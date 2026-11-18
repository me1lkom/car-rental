import { describe, test, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createHash } from 'node:crypto';

import { db } from './helpers/db.js';
import { createTestUser } from './helpers/test-data.js';

const BASE_URL = process.env.API_BASE_URL;

if (!BASE_URL) {
    throw new Error('API_BASE_URL is required');
}

const testUserIds = [];

afterAll(async () => {
    try {
        for (const userId of testUserIds) {
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

describe('POST /auth/login', () => {

    test('Успешная авторизация пользователя', async () => {

        const user = await createTestUser();
        testUserIds.push(user.user_id);

        const response = await request(BASE_URL)
            .post('/auth/login')
            .send({
                email: user.email,
                password: user.password
            });


        expect(response.status).toBe(200);
        expect(response.body.user_id).toBe(user.user_id);

        const cookies = response.headers['set-cookie'];

        expect(cookies).toBeDefined();
        expect(cookies.some(c => c.startsWith('access_token='))).toBe(true);
        expect(cookies.some(c => c.startsWith('refresh_token='))).toBe(true);

        const result = await db.query(
            'SELECT * FROM refresh_sessions WHERE user_id = $1',
            [user.user_id]
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].refresh_token_hash).toMatch(/^[a-f0-9]{64}$/);
    });

    test('Авторизация с неправильным паролем', async () => {

        const user = await createTestUser();
        testUserIds.push(user.user_id);

        const response = await request(BASE_URL)
            .post('/auth/login')
            .send({
                email: user.email,
                password: 'WrongPassword123!'
            });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Invalid email or password');

        expect(response.headers['set-cookie']).toBeUndefined();

        const result = await db.query(
            'SELECT COUNT(*)::int AS total FROM refresh_sessions WHERE user_id = $1',
            [user.user_id]
        );

        expect(result.rows[0].total).toBe(0);
    });
});

describe('POST /auth/refresh', () => {
    test('Ротация refresh-токена', async () => {
        const user = await createTestUser();
        testUserIds.push(user.user_id);

        const agent = request.agent(BASE_URL);

        const login = await agent
            .post('/auth/login')
            .send({
                email: user.email,
                password: user.password
            });

        expect(login.status).toBe(200);

        const oldCookie = login.headers['set-cookie']
            .find(cookie => cookie.startsWith('refresh_token='));

        expect(oldCookie).toBeDefined();

        const oldRefreshToken = oldCookie.split(';')[0].split('=')[1];

        const response = await agent
            .post('/auth/refresh');

        expect(response.status).toBe(204);

        const newCookie = response.headers['set-cookie']
            .find(cookie => cookie.startsWith('refresh_token='));

        expect(newCookie).toBeDefined();

        const newRefreshToken = newCookie.split(';')[0].split('=')[1];

        expect(newRefreshToken).not.toBe(oldRefreshToken);

        const result = await db.query(
            `
                    SELECT refresh_token_hash
                    FROM refresh_sessions
                    WHERE user_id = $1
                `,
            [user.user_id]
        );

        expect(result.rows).toHaveLength(1);

        const newTokenHash = createHash('sha256')
            .update(newRefreshToken)
            .digest('hex');

        expect(result.rows[0].refresh_token_hash).toBe(newTokenHash);

        const oldTokenResponse = await request(BASE_URL)
            .post('/auth/refresh')
            .set('Cookie', `refresh_token=${oldRefreshToken}`);

        expect(oldTokenResponse.status).toBe(401);
    });

    test('Обновление без refresh-токена', async () => {
        const response = await request(BASE_URL)
            .post('/auth/refresh');

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Token not found');
    });

});

describe('POST /auth/logout', () => {
    test('Выход из аккаунта и отзыв сессии', async () => {
        const user = await createTestUser();
        testUserIds.push(user.user_id);

        const agent = request.agent(BASE_URL);

        const login = await agent
            .post('/auth/login')
            .send({
                email: user.email,
                password: user.password
            });

        expect(login.status).toBe(200);

        const refreshCookie = login.headers['set-cookie']
            .find(cookie => cookie.startsWith('refresh_token='))
            .split(';')[0];

        const response = await agent.post('/auth/logout');

        expect(response.status).toBe(204);

        const cookies = response.headers['set-cookie'];

        expect(cookies.some(c => c.startsWith('access_token=;'))).toBe(true);
        expect(cookies.some(c => c.startsWith('refresh_token=;'))).toBe(true);

        const result = await db.query(
            `
                    SELECT revoked_at
                    FROM refresh_sessions
                    WHERE user_id = $1
                `,
            [user.user_id]
        );

        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].revoked_at).not.toBeNull();

        const refreshResponse = await request(BASE_URL)
            .post('/auth/refresh')
            .set('Cookie', refreshCookie);

        expect(refreshResponse.status).toBe(401);
    });
});