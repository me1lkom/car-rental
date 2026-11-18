import { randomUUID, randomInt } from 'node:crypto';
import bcrypt from 'bcrypt';
import { db } from './db.js';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'node:crypto';

export function makeTestUser() {
    return {
        name: 'Test',
        surname: 'User',
        email: `test-${randomUUID()}@example.com`,
        phone: `+7${randomInt(1000000000, 10000000000)}`,
        password: 'TestPassword123!'
    };
}

export async function createTestUser(role = 'client') {
    const user = makeTestUser();
    const passwordHash = await bcrypt.hash(user.password, 10);

    const result = await db.query(`
        INSERT INTO users (
            name, surname, email, phone,
            password_hash, role_id
        )
        VALUES (
            $1, $2, $3, $4, $5,
            (SELECT role_id FROM roles WHERE name = $6)
        )
        RETURNING user_id
    `, [
        user.name,
        user.surname,
        user.email,
        user.phone,
        passwordHash,
        role
    ]);

    return {
        ...user,
        user_id: result.rows[0].user_id
    };
}

export async function createTestAccessCookie(userId) {
    const secret = process.env.JWT_SECRET_KEY;

    if (!secret) {
        throw new Error('JWT_SECRET_KEY is required');
    }

    const refreshHash = createHash('sha256')
        .update(randomBytes(32))
        .digest('hex');

    const result = await db.query(`
        INSERT INTO refresh_sessions (
            user_id, refresh_token_hash, expire_at
        )
        VALUES ($1, $2, NOW() + INTERVAL '1 hour')
        RETURNING session_id
    `, [userId, refreshHash]);

    const accessToken = jwt.sign({
        user_id: userId,
        session_id: result.rows[0].session_id
    }, secret, {
        expiresIn: '1h'
    });

    return `access_token=${accessToken}`;
}

export async function makeTestCar() {
    const result = await db.query(`
        SELECT
            body_type_id,
            drive_type_id,
            rental_class_id,
            transmission_id,
            fuel_type_id
        FROM cars
        WHERE deleted_at IS NULL
          AND body_type_id IS NOT NULL
          AND drive_type_id IS NOT NULL
          AND rental_class_id IS NOT NULL
          AND transmission_id IS NOT NULL
          AND fuel_type_id IS NOT NULL
        LIMIT 1
    `);

    if (!result.rows[0]) {
        throw new Error('No car attributes for tests');
    }

    return {
        license_plate: `T${randomUUID().slice(0, 8)}`,
        brand: `Test-${randomUUID().slice(0, 8)}`,
        model: 'Integration',
        year: 2025,
        price_per_day: 3000,
        status: 'available',
        seats: 5,
        doors: 4,
        ...result.rows[0]
    };
}

export async function createTestCar() {
    const car = await makeTestCar();

    const result = await db.query(`
        INSERT INTO cars (
            license_plate, brand, model, year,
            price_per_day, status, seats, doors,
            body_type_id, drive_type_id, rental_class_id,
            transmission_id, fuel_type_id
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13
        )
        RETURNING car_id
    `, [
        car.license_plate, car.brand, car.model, car.year,
        car.price_per_day, car.status, car.seats, car.doors,
        car.body_type_id, car.drive_type_id, car.rental_class_id,
        car.transmission_id, car.fuel_type_id
    ]);

    return {
        ...car,
        car_id: result.rows[0].car_id
    };
}