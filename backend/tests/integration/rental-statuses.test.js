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

const userIds = [];
const carIds = [];
const rentalIds = [];

let clientId;
let adminCookie;
let clientCookie;

function dateInDays(days) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

async function prepareRental(status = 'pending_payment') {
    const car = await createTestCar();
    carIds.push(car.car_id);

    const result = await db.query(`
        INSERT INTO rentals (
            user_id, car_id, start_date, end_date,
            total_price, status_id, hold_expires_at
        )
        VALUES (
            $1, $2, $3, $4, 9000,
            (SELECT status_id FROM rental_statuses WHERE code = $5),
            CASE
                WHEN $5 = 'pending_payment'
                THEN NOW() + INTERVAL '15 minutes'
                ELSE NULL
            END
        )
        RETURNING rental_id
    `, [
        clientId,
        car.car_id,
        dateInDays(30),
        dateInDays(32),
        status
    ]);

    const id = result.rows[0].rental_id;
    rentalIds.push(id);

    return id;
}

async function getStatus(rentalId) {
    const result = await db.query(`
        SELECT rs.code
        FROM rentals r
        JOIN rental_statuses rs ON r.status_id = rs.status_id
        WHERE r.rental_id = $1
    `, [rentalId]);

    return result.rows[0]?.code;
}

beforeAll(async () => {
    for (const role of ['client', 'admin']) {
        const user = await createTestUser(role);
        userIds.push(user.user_id);

        const cookie = await createTestAccessCookie(user.user_id);

        if (role === 'client') {
            clientId = user.user_id;
            clientCookie = cookie;
        } else {
            adminCookie = cookie;
        }
    }
});

afterAll(async () => {
    try {
        for (const id of rentalIds) {
            await db.query('DELETE FROM rentals WHERE rental_id = $1', [id]);
        }

        for (const id of carIds) {
            await db.query('DELETE FROM cars WHERE car_id = $1', [id]);
        }

        for (const id of userIds) {
            await db.query(
                'DELETE FROM refresh_sessions WHERE user_id = $1',
                [id]
            );
            await db.query('DELETE FROM users WHERE user_id = $1', [id]);
        }
    } finally {
        await db.end();
    }
});

describe('Жизненный цикл аренды', () => {

    test('Полный цикл от оплаты до завершения', async () => {
        const id = await prepareRental();

        const payment = await request(BASE_URL)
            .post(`/rentals/${id}/mock-payment`)
            .set('Cookie', adminCookie);

        expect(payment.status).toBe(200);
        expect(await getStatus(id)).toBe('pending');

        for (const [action, expectedStatus] of [
            ['confirm', 'confirmed'],
            ['activate', 'active'],
            ['complete', 'completed']
        ]) {
            const response = await request(BASE_URL)
                .patch(`/rentals/${id}/${action}`)
                .set('Cookie', adminCookie);

            expect(response.status).toBe(200);
            expect(await getStatus(id)).toBe(expectedStatus);
        }
    });

    test.each([
        ['pending', 'confirm', 'confirmed'],
        ['pending', 'reject', 'rejected'],
        ['confirmed', 'activate', 'active'],
        ['active', 'complete', 'completed'],
        ['pending_payment', 'cancel', 'cancelled']
    ])('%s → %s → %s', async (initial, action, expected) => {
        const id = await prepareRental(initial);

        const response = await request(BASE_URL)
            .patch(`/rentals/${id}/${action}`)
            .set('Cookie', adminCookie);

        expect(response.status).toBe(200);
        expect(await getStatus(id)).toBe(expected);
    });

    test('Нельзя подтвердить неоплаченную аренду', async () => {
        const id = await prepareRental('pending_payment');

        const response = await request(BASE_URL)
            .patch(`/rentals/${id}/confirm`)
            .set('Cookie', adminCookie);

        expect(response.status).toBe(409);
        expect(response.body.error)
            .toBe('Invalid rental status transition');
        expect(await getStatus(id)).toBe('pending_payment');
    });

    test('Нельзя оплатить аренду с истёкшим удержанием', async () => {
        const id = await prepareRental();

        await db.query(`
            UPDATE rentals
            SET hold_expires_at = NOW() - INTERVAL '1 minute'
            WHERE rental_id = $1
        `, [id]);

        const response = await request(BASE_URL)
            .post(`/rentals/${id}/mock-payment`)
            .set('Cookie', adminCookie);

        expect(response.status).toBe(409);
        expect(await getStatus(id)).toBe('pending_payment');
    });

    test('Клиент не может подтверждать аренду', async () => {
        const id = await prepareRental('pending');

        const response = await request(BASE_URL)
            .patch(`/rentals/${id}/confirm`)
            .set('Cookie', clientCookie);

        expect(response.status).toBe(403);
        expect(await getStatus(id)).toBe('pending');
    });

});