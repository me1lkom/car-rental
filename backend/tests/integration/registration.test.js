import { describe, test, expect, afterAll } from 'vitest';
import request from 'supertest';

import { db } from './helpers/db.js';
import { makeTestUser } from './helpers/test-data.js';

const BASE_URL = process.env.API_BASE_URL;

if (!BASE_URL) {
    throw new Error('API_BASE_URL is required');
}

const emailsForCleanup = [];

afterAll(async () => {
    try {
        if (emailsForCleanup.length > 0) {
            await db.query(
                'DELETE FROM users WHERE email = ANY($1::text[])',
                [emailsForCleanup]
            );
        }
    } finally {
        await db.end();
    }
});

describe('POST /auth/registration', () => {

    test('Успешная регистрация пользователя', async () => {

        const user = makeTestUser();
        emailsForCleanup.push(user.email);


        const response = await request(BASE_URL)
            .post('/auth/registration')
            .send(user);

        expect(response.status).toBe(201);
        expect(response.body.user_id).toBeDefined();
        expect(response.body.email).toBe(user.email);


        const result = await db.query(
            `SELECT user_id, email, phone, password_hash
             FROM users
             WHERE email = $1`,
            [user.email]
        );

        expect(result.rows).toHaveLength(1);

        const savedUser = result.rows[0];

        expect(savedUser.user_id).toBe(response.body.user_id);
        expect(savedUser.phone).toBe(user.phone);


        expect(savedUser.password_hash).not.toBe(user.password);
        expect(response.body.password_hash).toBeUndefined();
    });

    test('Регистрация с существующим email', async () => {
        const user = makeTestUser();
        emailsForCleanup.push(user.email);

        const firstResponse = await request(BASE_URL)
            .post('/auth/registration')
            .send(user);

        expect(firstResponse.status).toBe(201);


        const duplicateUser = {
            ...makeTestUser(),
            email: user.email
        };


        const response = await request(BASE_URL)
            .post('/auth/registration')
            .send(duplicateUser);

        expect(response.status).toBe(409);
        expect(response.body.error).toBe('Email already registered');


        const result = await db.query(
            'SELECT COUNT(*)::int AS total FROM users WHERE email = $1',
            [user.email]
        );

        expect(result.rows[0].total).toBe(1);
    });

    test('Регистрация с некорректными данными', async () => {

        const user = makeTestUser();
        emailsForCleanup.push(user.email);

        const invalidUser = {
            ...user,
            password: '123'
        };


        const response = await request(BASE_URL)
            .post('/auth/registration')
            .send(invalidUser);


        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid user data');
        expect(Array.isArray(response.body.details)).toBe(true);


        const result = await db.query(
            'SELECT COUNT(*)::int AS total FROM users WHERE email = $1',
            [user.email]
        );

        expect(result.rows[0].total).toBe(0);
    });
});