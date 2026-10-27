import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import 'dotenv/config';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

const SMOKE_EMAIL = process.env.SMOKE_EMAIL;
const SMOKE_PASSWORD = process.env.SMOKE_PASSWORD;

describe('Авторизация и защищённые маршруты', () => {
    const agent = request.agent(BASE_URL);
    let loginResponse;
    let cookies;

    beforeAll(async () => {
        loginResponse = await agent
            .post('/auth/login')
            .send({
                email: SMOKE_EMAIL,
                password: SMOKE_PASSWORD
            });

        cookies = loginResponse.headers['set-cookie'];
    })

    test('POST /auth/login аутентификация', () => {
        expect(loginResponse.status).toBe(200);
        expect(loginResponse.headers['set-cookie']).toBeDefined();

        expect(cookies.find(cookie => cookie.startsWith('access_token='))).toBeDefined();
        expect(cookies.find(cookie => cookie.startsWith('refresh_token='))).toBeDefined();
    });

    test('GET /auth/me — получение себя', async ({ skip }) => {
        if (loginResponse.status !== 200 ||
            !cookies?.some(cookie => cookie.startsWith('access_token='))) {
            skip('Авторизация не прошла');
        }

        const response = await agent.get('/auth/me');

        expect(response.status).toBe(200);
        expect(response.body.email).toBe(SMOKE_EMAIL);
    });

    test('GET /rentals/my — получение своих броней', async ({ skip }) => {
        if (loginResponse.status !== 200 ||
            !cookies?.some(cookie => cookie.startsWith('access_token='))) {
            skip('Авторизация не прошла');
        }

        const response = await agent.get('/rentals/my');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /users — проверка отказа в доступе', async ({ skip }) => {
        if (loginResponse.status !== 200 ||
            !cookies?.some(cookie => cookie.startsWith('access_token='))) {
            skip('Авторизация не прошла');
        }

        const response = await agent.get('/users');

        expect(response.status).toBe(403);
        expect(response.body.error).toBeDefined();
    });

    afterAll(async () => {
        if (loginResponse?.status === 200) {
            await agent.post('/auth/logout')
                .expect(204);
        }
    });
})