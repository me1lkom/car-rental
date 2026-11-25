import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
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

const userIds = [];
const searchName = `Test-${randomUUID()}`;

let adminCookie;
let firstUser;
let secondUser;

async function prepareUser(role) {
    const user = await createTestUser(role);
    userIds.push(user.user_id);

    await db.query(
        'UPDATE users SET name = $1 WHERE user_id = $2',
        [searchName, user.user_id]
    );

    return user;
}

beforeAll(async () => {
    const admin = await createTestUser('admin');
    userIds.push(admin.user_id);

    adminCookie = await createTestAccessCookie(admin.user_id);

    firstUser = await prepareUser('client');
    secondUser = await prepareUser('client');

    await prepareUser('manager');

    await db.query(`
        UPDATE users
        SET blocked_at = NOW()
        WHERE user_id = $1
    `, [secondUser.user_id]);
});

afterAll(async () => {
    try {
        await db.query(
            'DELETE FROM refresh_sessions WHERE user_id = ANY($1::int[])',
            [userIds]
        );

        await db.query(
            'DELETE FROM users WHERE user_id = ANY($1::int[])',
            [userIds]
        );
    } finally {
        await db.end();
    }
});

describe('GET /users', () => {

    test('Пагинация с поиском и фильтрацией по роли', async () => {
        const response = await request(BASE_URL)
            .get('/users')
            .set('Cookie', adminCookie)
            .query({
                search: searchName.toUpperCase(),
                role: 'client',
                limit: 1,
                offset: 0
            });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(1);

        expect(response.body.pagination).toEqual({
            total: 2,
            limit: 1,
            offset: 0,
            has_more: true
        });

        expect(response.body.items[0].user_id)
            .toBe(secondUser.user_id);
    });

    test('Получение заблокированного пользователя', async () => {
        const response = await request(BASE_URL)
            .get('/users')
            .set('Cookie', adminCookie)
            .query({
                search: searchName,
                blocked: true
            });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(1);
        expect(response.body.pagination.total).toBe(1);

        expect(response.body.items[0].user_id)
            .toBe(secondUser.user_id);

        expect(response.body.items[0].blocked_at)
            .not.toBeNull();

        const detail = await request(BASE_URL)
            .get(`/users/${secondUser.user_id}`)
            .set('Cookie', adminCookie);

        expect(detail.status).toBe(200);
        expect(detail.body.user_id).toBe(secondUser.user_id);
        expect(detail.body.blocked_at).not.toBeNull();
    });

    describe('PATCH /users/:id/admin', () => {

        test('Администратор может редактировать пользователя', async () => {
            const response = await request(BASE_URL)
                .patch(`/users/${firstUser.user_id}/admin`)
                .set('Cookie', adminCookie)
                .send({
                    surname: 'UpdatedSurname'
                });

            expect(response.status).toBe(200);
            expect(response.body.surname).toBe('UpdatedSurname');

            const result = await db.query(
                'SELECT surname FROM users WHERE user_id = $1',
                [firstUser.user_id]
            );

            expect(result.rows[0].surname).toBe('UpdatedSurname');
        });

    });

});