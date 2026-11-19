import pg from 'pg';

const { Pool } = pg;

if (
    process.env.DB_NAME !== 'car_rental_test' ||
    process.env.DB_HOST !== 'postgres-test'
) {
    throw new Error('Invalid tests database or host');
}

export const db = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});