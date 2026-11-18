import { describe, test, expect, beforeAll, afterAll } from 'vitest';

import { db } from './helpers/db.js';
import { createTestUser, createTestCar } from './helpers/test-data.js';
import {
    findConflictingRentals
} from '../../dist/repositories/rentals.repository.js';

let userId;
const carIds = [];

async function prepareRental(status = 'confirmed', expired = false) {
    const car = await createTestCar();
    carIds.push(car.car_id);

    const result = await db.query(`
        INSERT INTO rentals (
            user_id, car_id, start_date, end_date,
            total_price, status_id, hold_expires_at
        )
        VALUES (
            $1, $2, '2030-06-10', '2030-06-12', 9000,
            (SELECT status_id FROM rental_statuses WHERE code = $3),
            CASE
                WHEN $3 = 'pending_payment' THEN
                    CASE
                        WHEN $4::boolean THEN NOW() - INTERVAL '1 minute'
                        ELSE NOW() + INTERVAL '15 minutes'
                    END
                ELSE NULL
            END
        )
        RETURNING rental_id
    `, [userId, car.car_id, status, expired]);

    return {
        car_id: car.car_id,
        rental_id: result.rows[0].rental_id
    };
}

beforeAll(async () => {
    const user = await createTestUser();
    userId = user.user_id;
});

afterAll(async () => {
    try {
        if (carIds.length > 0) {
            await db.query(
                'DELETE FROM rentals WHERE car_id = ANY($1::int[])',
                [carIds]
            );

            await db.query(
                'DELETE FROM cars WHERE car_id = ANY($1::int[])',
                [carIds]
            );
        }

        if (userId !== undefined) {
            await db.query('DELETE FROM users WHERE user_id = $1', [userId]);
        }
    } finally {
        await db.end();
    }
});

describe('SQL — конфликты дат аренды', () => {

    test.each([
        ['2030-06-10', '2030-06-12', true],
        ['2030-06-09', '2030-06-11', true],
        ['2030-06-12', '2030-06-15', true],
        ['2030-06-09', '2030-06-09', true],
        ['2030-06-13', '2030-06-13', true],
        ['2030-06-08', '2030-06-08', false],
        ['2030-06-14', '2030-06-14', false]
    ])('Период %s — %s: конфликт = %s', async (start, end, expected) => {
        const rental = await prepareRental();

        const conflict = await findConflictingRentals(
            rental.car_id, start, end, db
        );

        expect(conflict).toBe(expected);
    });

    test.each([
        ['pending', false, true],
        ['confirmed', false, true],
        ['active', false, true],
        ['pending_payment', false, true],
        ['pending_payment', true, false],
        ['cancelled', false, false],
        ['rejected', false, false],
        ['completed', false, false]
    ])('Статус %s, удержание истекло: %s', async (status, expired, expected) => {
        const rental = await prepareRental(status, expired);

        const conflict = await findConflictingRentals(
            rental.car_id,
            '2030-06-10',
            '2030-06-12',
            db
        );

        expect(conflict).toBe(expected);
    });

    test('Исключение собственной аренды при редактировании', async () => {
        const rental = await prepareRental();

        const conflict = await findConflictingRentals(
            rental.car_id,
            '2030-06-10',
            '2030-06-12',
            db,
            rental.rental_id
        );

        expect(conflict).toBe(false);
    });

});