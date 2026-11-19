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

beforeAll(async () => {
    const user = await createTestUser('client');

    userId = user.user_id;
    clientCookie = await createTestAccessCookie(userId);
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

        if (userId !== undefined) {
            await db.query(
                'DELETE FROM refresh_sessions WHERE user_id = $1',
                [userId]
            );

            await db.query(
                'DELETE FROM users WHERE user_id = $1',
                [userId]
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
