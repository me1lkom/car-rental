import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

import { db } from './helpers/db.js';
import {
    createTestUser,
    createTestCar,
    createTestAccessCookie
} from './helpers/test-data.js';

const BASE_URL = process.env.API_BASE_URL;

if (!BASE_URL) {
    throw new Error('API_BASE_URL is required');
}

let userId;
let clientCookie;

let adminId;
let adminCookie;

const createdCarIds = [];

function dateInDays(days) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

async function prepareCar() {
    const car = await createTestCar();
    createdCarIds.push(car.car_id);
    return car;
}

async function prepareRental(carId, startDays, endDays, status = 'pending', ownerId = userId) {
    const result = await db.query(`
        INSERT INTO rentals (
            user_id,
            car_id,
            start_date,
            end_date,
            total_price,
            status_id
        )
        VALUES (
            $1, $2, $3, $4, $5,
            (SELECT status_id FROM rental_statuses WHERE code = $6)
        )
        RETURNING rental_id
    `, [
        ownerId,
        carId,
        dateInDays(startDays),
        dateInDays(endDays),
        (endDays - startDays + 1) * 3000,
        status
    ]);

    return result.rows[0].rental_id;
}


beforeAll(async () => {
    const user = await createTestUser('client');

    userId = user.user_id;
    clientCookie = await createTestAccessCookie(userId);

    const admin = await createTestUser('admin');

    adminId = admin.user_id;
    adminCookie = await createTestAccessCookie(adminId);
});

afterAll(async () => {
    try {
        if (createdCarIds.length > 0) {
            await db.query(
                'DELETE FROM rentals WHERE car_id = ANY($1::int[])',
                [createdCarIds]
            );

            await db.query(
                'DELETE FROM cars WHERE car_id = ANY($1::int[])',
                [createdCarIds]
            );
        }

        for (const id of [userId, adminId]) {
            if (id === undefined) continue;

            await db.query(
                'DELETE FROM refresh_sessions WHERE user_id = $1',
                [id]
            );

            await db.query(
                'DELETE FROM users WHERE user_id = $1',
                [id]
            );
        }
    } finally {
        await db.end();
    }
});

describe('POST /rentals', () => {

    test('Успешное создание аренды', async () => {
        const car = await prepareCar();

        const response = await request(BASE_URL)
            .post('/rentals')
            .set('Cookie', clientCookie)
            .send({
                car_id: car.car_id,
                start_date: dateInDays(30),
                end_date: dateInDays(32)
            });

        expect(response.status).toBe(201);
        expect(response.body.rental_id).toBeDefined();
        expect(response.body.total_price).toBe(9000);

        const result = await db.query(`
            SELECT
                r.user_id,
                r.car_id,
                r.total_price,
                rs.code AS status
            FROM rentals r
            JOIN rental_statuses rs
                ON r.status_id = rs.status_id
            WHERE r.rental_id = $1
        `, [response.body.rental_id]);

        expect(result.rows).toHaveLength(1);

        const rental = result.rows[0];

        expect(rental.user_id).toBe(userId);
        expect(rental.car_id).toBe(car.car_id);
        expect(rental.total_price).toBe(9000);
        expect(rental.status).toBe('pending_payment');
    });

    test('Конфликт дат аренды — 409', async () => {
        const car = await prepareCar();

        const rental = {
            car_id: car.car_id,
            start_date: dateInDays(30),
            end_date: dateInDays(32)
        };

        const first = await request(BASE_URL)
            .post('/rentals')
            .set('Cookie', clientCookie)
            .send(rental);

        expect(first.status).toBe(201);

        const second = await request(BASE_URL)
            .post('/rentals')
            .set('Cookie', clientCookie)
            .send(rental);

        expect(second.status).toBe(409);
        expect(second.body.error).toBe('Selected dates are unavailable');

        const result = await db.query(
            'SELECT COUNT(*)::int AS total FROM rentals WHERE car_id = $1',
            [car.car_id]
        );

        expect(result.rows[0].total).toBe(1);
    });

    test('Автомобиль недоступен — 409', async () => {
        const car = await prepareCar();

        await db.query(
            "UPDATE cars SET status = 'maintenance' WHERE car_id = $1",
            [car.car_id]
        );

        const response = await request(BASE_URL)
            .post('/rentals')
            .set('Cookie', clientCookie)
            .send({
                car_id: car.car_id,
                start_date: dateInDays(30),
                end_date: dateInDays(32)
            });

        expect(response.status).toBe(409);
        expect(response.body.error).toBe('Car unavailable');
    });

    test('Некорректный диапазон дат — 400', async () => {
        const car = await prepareCar();

        const response = await request(BASE_URL)
            .post('/rentals')
            .set('Cookie', clientCookie)
            .send({
                car_id: car.car_id,
                start_date: dateInDays(32),
                end_date: dateInDays(30)
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid rental data');

        const result = await db.query(
            'SELECT COUNT(*)::int AS total FROM rentals WHERE car_id = $1',
            [car.car_id]
        );

        expect(result.rows[0].total).toBe(0);
    });

    test('Несуществующий автомобиль — 404', async () => {
        const result = await db.query(
            'SELECT COALESCE(MAX(car_id), 0) + 1000 AS id FROM cars'
        );

        const nonexistentCarId = result.rows[0].id;

        const response = await request(BASE_URL)
            .post('/rentals')
            .set('Cookie', clientCookie)
            .send({
                car_id: nonexistentCarId,
                start_date: dateInDays(30),
                end_date: dateInDays(32)
            });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Car not found');
    });

});

describe('GET /rentals', () => {
    let car;
    let firstRentalId;
    let secondRentalId;
    let thirdRentalId;

    beforeAll(async () => {
        car = await prepareCar();

        firstRentalId = await prepareRental(
            car.car_id, 10, 12, 'pending'
        );

        secondRentalId = await prepareRental(
            car.car_id, 20, 22, 'confirmed'
        );

        thirdRentalId = await prepareRental(
            car.car_id, 30, 32, 'cancelled'
        );
    });

    test('Пагинация с учётом фильтра по автомобилю', async () => {
        const response = await request(BASE_URL)
            .get('/rentals')
            .set('Cookie', adminCookie)
            .query({
                car_id: car.car_id,
                limit: 2,
                offset: 0
            });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(2);

        expect(response.body.pagination).toEqual({
            total: 3,
            limit: 2,
            offset: 0,
            has_more: true
        });

        expect(response.body.items.map(rental => rental.rental_id))
            .toEqual([thirdRentalId, secondRentalId]);
    });

    test('Получение последней страницы аренд', async () => {
        const response = await request(BASE_URL)
            .get('/rentals')
            .set('Cookie', adminCookie)
            .query({
                car_id: car.car_id,
                limit: 2,
                offset: 2
            });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(1);

        expect(response.body.pagination).toEqual({
            total: 3,
            limit: 2,
            offset: 2,
            has_more: false
        });

        expect(response.body.items[0].rental_id)
            .toBe(firstRentalId);
    });

    test('Фильтрация по ID аренды', async () => {
        const response = await request(BASE_URL)
            .get('/rentals')
            .set('Cookie', adminCookie)
            .query({
                rental_id: secondRentalId
            });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(1);
        expect(response.body.pagination.total).toBe(1);

        expect(response.body.items[0].rental_id)
            .toBe(secondRentalId);
    });

    test('Фильтрация по нескольким статусам', async () => {
        const response = await request(BASE_URL)
            .get('/rentals')
            .set('Cookie', adminCookie)
            .query({
                car_id: car.car_id,
                status: 'pending,confirmed'
            });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(2);
        expect(response.body.pagination.total).toBe(2);

        expect(response.body.items.map(rental => rental.rental_id))
            .toEqual([secondRentalId, firstRentalId]);
    });

    test('Фильтрация по пересечению дат аренды', async () => {
        const response = await request(BASE_URL)
            .get('/rentals')
            .set('Cookie', adminCookie)
            .query({
                car_id: car.car_id,
                date_from: dateInDays(11),
                date_to: dateInDays(21)
            });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(2);
        expect(response.body.pagination.total).toBe(2);

        expect(response.body.items.map(rental => rental.rental_id))
            .toEqual([secondRentalId, firstRentalId]);
    });

    test('Получение собственных аренд с пагинацией', async () => {
        const response = await request(BASE_URL)
            .get('/rentals/my')
            .set('Cookie', clientCookie)
            .query({
                car_id: car.car_id,
                limit: 2,
                offset: 0
            });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(2);

        expect(response.body.pagination).toEqual({
            total: 3,
            limit: 2,
            offset: 0,
            has_more: true
        });

        expect(response.body.items.map(rental => rental.rental_id))
            .toEqual([thirdRentalId, secondRentalId]);
    });

    test('Клиент не может получить чужие аренды', async () => {
        const foreignCar = await prepareCar();

        const foreignRentalId = await prepareRental(
            foreignCar.car_id, 40, 42, 'confirmed', adminId
        );

        const response = await request(BASE_URL)
            .get('/rentals/my')
            .set('Cookie', clientCookie)
            .query({
                user_id: adminId,
                rental_id: foreignRentalId,
                search: foreignCar.brand
            });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(0);
        expect(response.body.pagination.total).toBe(0);
    });
});

