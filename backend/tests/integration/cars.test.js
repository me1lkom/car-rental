import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

import { db } from './helpers/db.js';
import {
    makeTestCar,
    createTestCar,
    createTestUser,
    createTestAccessCookie
} from './helpers/test-data.js';

const BASE_URL = process.env.API_BASE_URL;

if (!BASE_URL) {
    throw new Error('API_BASE_URL is required');
}

let adminId;
let adminCookie;

const createdCarIds = [];

async function prepareCar() {
    const car = await createTestCar();
    createdCarIds.push(car.car_id);
    return car;
}

beforeAll(async () => {
    const admin = await createTestUser('admin');

    adminId = admin.user_id;
    adminCookie = await createTestAccessCookie(adminId);
});

afterAll(async () => {
    try {
        for (const id of createdCarIds) {
            await db.query('DELETE FROM cars WHERE car_id = $1', [id]);
        }

        if (adminId !== undefined) {
            await db.query(
                'DELETE FROM refresh_sessions WHERE user_id = $1',
                [adminId]
            );

            await db.query(
                'DELETE FROM users WHERE user_id = $1',
                [adminId]
            );
        }
    } finally {
        await db.end();
    }
});

describe('Cars API', () => {

    test('POST /cars — создание автомобиля', async () => {
        const car = await makeTestCar();

        const response = await request(BASE_URL)
            .post('/cars')
            .set('Cookie', adminCookie)
            .send(car);

        expect(response.status).toBe(201);
        expect(response.body.car_id).toBeDefined();

        const id = response.body.car_id;
        createdCarIds.push(id);

        const result = await db.query(
            'SELECT * FROM cars WHERE car_id = $1',
            [id]
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].license_plate).toBe(car.license_plate);
    });

    test('GET /cars/:id — получение автомобиля', async () => {
        const car = await prepareCar();

        const response = await request(BASE_URL)
            .get(`/cars/${car.car_id}`);

        expect(response.status).toBe(200);
        expect(response.body.car_id).toBe(car.car_id);
        expect(response.body.brand).toBe(car.brand);
    });

    test('GET /cars — фильтрация по марке', async () => {
        const car = await prepareCar();

        const response = await request(BASE_URL)
            .get('/cars')
            .query({ brand: car.brand });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].car_id).toBe(car.car_id);

        expect(response.body.pagination).toEqual({
            total: 1,
            limit: 20,
            offset: 0,
            has_more: false
        });
    });

    test('GET /cars — пагинация', async () => {
        const first = await prepareCar();
        const second = await prepareCar();

        await db.query(
            'UPDATE cars SET brand = $1 WHERE car_id = $2',
            [first.brand, second.car_id]
        );

        const response = await request(BASE_URL)
            .get('/cars')
            .query({ brand: first.brand, limit: 1, offset: 1 });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].car_id).toBe(second.car_id);

        expect(response.body.pagination).toEqual({
            total: 2,
            limit: 1,
            offset: 1,
            has_more: false
        });
    });

    test('PATCH /cars/:id — изменение стоимости', async () => {
        const car = await prepareCar();

        const response = await request(BASE_URL)
            .patch(`/cars/${car.car_id}`)
            .set('Cookie', adminCookie)
            .send({ price_per_day: 4500 });

        expect(response.status).toBe(200);

        const result = await db.query(
            'SELECT price_per_day FROM cars WHERE car_id = $1',
            [car.car_id]
        );

        expect(result.rows[0].price_per_day).toBe(4500);
    });

    test('DELETE /cars/:id — мягкое удаление', async () => {
        const car = await prepareCar();

        const response = await request(BASE_URL)
            .delete(`/cars/${car.car_id}`)
            .set('Cookie', adminCookie);

        expect(response.status).toBe(200);

        const result = await db.query(
            'SELECT deleted_at FROM cars WHERE car_id = $1',
            [car.car_id]
        );

        expect(result.rows[0].deleted_at).not.toBeNull();

        const getResponse = await request(BASE_URL)
            .get(`/cars/${car.car_id}`);

        expect(getResponse.status).toBe(404);
    });

    test('PATCH /cars/:id/restore — восстановление', async () => {
        const car = await prepareCar();

        await db.query(
            'UPDATE cars SET deleted_at = NOW() WHERE car_id = $1',
            [car.car_id]
        );

        const response = await request(BASE_URL)
            .patch(`/cars/${car.car_id}/restore`)
            .set('Cookie', adminCookie);

        expect(response.status).toBe(200);

        const result = await db.query(
            'SELECT deleted_at FROM cars WHERE car_id = $1',
            [car.car_id]
        );

        expect(result.rows[0].deleted_at).toBeNull();
    });

    test('POST /cars — некорректные данные', async () => {
        const car = await makeTestCar();

        const response = await request(BASE_URL)
            .post('/cars')
            .set('Cookie', adminCookie)
            .send({
                ...car,
                price_per_day: -100
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid car data');

        const result = await db.query(
            'SELECT COUNT(*)::int AS total FROM cars WHERE license_plate = $1',
            [car.license_plate]
        );

        expect(result.rows[0].total).toBe(0);
    });

});