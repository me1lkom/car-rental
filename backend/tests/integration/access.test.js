import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

import { db } from './helpers/db.js';
import {
    createTestUser,
    createTestAccessCookie
} from './helpers/test-data.js';

const BASE_URL = process.env.API_BASE_URL;

if (!BASE_URL) {
    throw new Error('API_BASE_URL is required');
}

const users = {};
const createdIds = [];

beforeAll(async () => {
    for (const role of ['client', 'manager', 'admin']) {
        const user = await createTestUser(role);
        createdIds.push(user.user_id);

        const cookie = await createTestAccessCookie(user.user_id);

        users[role] = { user, cookie };
    }
});

afterAll(async () => {
    try {
        for (const id of createdIds) {
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

describe('Разграничение доступа', () => {

    test('GET /users без авторизации — 401', async () => {
        const response = await request(BASE_URL)
            .get('/users');

        expect(response.status).toBe(401);
    });

    test.each([
        ['client', 403],
        ['manager', 403],
        ['admin', 200]
    ])('GET /users — роль %s', async (role, expectedStatus) => {
        const response = await request(BASE_URL)
            .get('/users')
            .set('Cookie', users[role].cookie);

        expect(response.status).toBe(expectedStatus);
    });

    test('GET /rentals без авторизации — 401', async () => {
        const response = await request(BASE_URL)
            .get('/rentals');

        expect(response.status).toBe(401);
    });

    test.each([
        ['client', 403],
        ['manager', 200],
        ['admin', 200]
    ])('GET /rentals — роль %s', async (role, expectedStatus) => {
        const response = await request(BASE_URL)
            .get('/rentals')
            .set('Cookie', users[role].cookie);

        expect(response.status).toBe(expectedStatus);
    });

});