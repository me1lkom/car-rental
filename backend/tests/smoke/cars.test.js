import { test, expect } from 'vitest';
import request from 'supertest';

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';

test('GET /cars получение всех авто', async () => {
    const response = await request(BASE_URL)
        .get('/cars');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
});

test('GET /cars/car-attributes получение всех фильтров авто',
        async() => {
            const response = await request(BASE_URL)
                .get('/cars/car-attributes');
            
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.body_types)).toBe(true);
            expect(Array.isArray(response.body.drive_types)).toBe(true);
            expect(Array.isArray(response.body.transmissions)).toBe(true);
        }
);

