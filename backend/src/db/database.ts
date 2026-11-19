import pg from 'pg';

pg.types.setTypeParser(pg.types.builtins.DATE, value => value);

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionTimeoutMillis: 3000
});

pool.on('error', (error) => {
    console.error('PostgreSQL pool error:', error);
});

export default pool;