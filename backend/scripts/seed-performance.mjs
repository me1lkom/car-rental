import pg from 'pg';
import bcrypt from 'bcrypt';

if (process.env.DB_HOST !== 'postgres-perf' || process.env.DB_NAME !== 'car_rental_perf') {
  throw new Error('Safety check: only postgres-perf / car_rental_perf is permitted');
}

function readCount(key, fallback, maximum) {
  const raw = process.env[key] ?? String(fallback);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${key} must be an integer between 1 and ${maximum}`);
  }
  return value;
}

const carsCount = readCount('PERF_CARS', 10000, 100000);
const usersCount = readCount('PERF_USERS', 5000, 100000);
const rentalsCount = readCount('PERF_RENTALS', 100000, 1000000);
const startedAt = Date.now();

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const client = await pool.connect();
try {
  const database = await client.query('SELECT current_database() AS name');
  if (database.rows[0].name !== 'car_rental_perf') {
    throw new Error('Safety check: unexpected database');
  }

  await client.query('BEGIN');
  const existing = await client.query("SELECT COUNT(*)::int AS total FROM cars WHERE license_plate LIKE 'PERF%'");
  if (existing.rows[0].total !== 0) {
    throw new Error('Performance fixtures already exist; start with a fresh perf volume');
  }

  console.log(`Seeding ${carsCount} cars ...`);
  await client.query(`
    WITH attrs AS (
      SELECT
        (SELECT body_type_id FROM body_types WHERE code = 'sedan') AS body_type_id,
        (SELECT drive_type_id FROM drive_types WHERE code = 'fwd') AS drive_type_id,
        (SELECT rental_class_id FROM rental_classes WHERE code = 'comfort') AS rental_class_id,
        (SELECT transmission_id FROM transmissions WHERE code = 'automatic') AS transmission_id,
        (SELECT fuel_type_id FROM fuel_types WHERE code = 'petrol') AS fuel_type_id
    )
    INSERT INTO cars (
      license_plate, brand, model, year, image_url, description,
      price_per_day, status,
      body_type_id, drive_type_id, rental_class_id,
      transmission_id, fuel_type_id, seats, doors
    )
    SELECT
      'PERF' || LPAD(g.i::text, 8, '0'),
      (ARRAY['Honda', 'BMW', 'Kia', 'Toyota', 'Hyundai'])[1 + ((g.i - 1) % 5)],
      'PerfModel-' || g.i,
      2015 + (g.i % 11),
      NULL,
      'Сгенерировано для нагрузочного тестирования',
      1500 + ((g.i % 30) * 200),
      CASE WHEN g.i % 37 = 0 THEN 'maintenance' ELSE 'available' END,
      a.body_type_id, a.drive_type_id, a.rental_class_id,
      a.transmission_id, a.fuel_type_id, 5, 4
    FROM generate_series(1, $1::int) AS g(i)
    CROSS JOIN attrs AS a
  `, [carsCount]);

  const carRange = await client.query(`
    SELECT MIN(car_id)::int AS first_id, MAX(car_id)::int AS last_id, COUNT(*)::int AS amount
    FROM cars WHERE license_plate LIKE 'PERF%'
  `);
  const car = carRange.rows[0];
  if (car.amount !== carsCount || car.last_id - car.first_id + 1 !== carsCount) {
    throw new Error('Non-contiguous test car IDs');
  }

  console.log(`Seeding ${usersCount} clients and one admin ...`);
  const adminHash = await bcrypt.hash('PerfAdmin2026!', 8);
  const dummyHash = await bcrypt.hash('NotUsedForLogin2026!', 8);
  await client.query(`
    INSERT INTO users (role_id, name, surname, email, phone, password_hash)
    VALUES (
      (SELECT role_id FROM roles WHERE name = 'admin'),
      'Performance', 'Admin', 'perf-admin@example.invalid',
      '79999999999', $1
    )
  `, [adminHash]);

  await client.query(`
    INSERT INTO users (role_id, name, surname, email, phone, password_hash)
    SELECT
      (SELECT role_id FROM roles WHERE name = 'client'),
      'Perf', 'Client-' || g.i,
      'perf-client-' || g.i || '@example.invalid',
      '78' || LPAD(g.i::text, 9, '0'),
      $2
    FROM generate_series(1, $1::int) AS g(i)
  `, [usersCount, dummyHash]);

  const userRange = await client.query(`
    SELECT MIN(user_id)::int AS first_id, MAX(user_id)::int AS last_id, COUNT(*)::int AS amount
    FROM users WHERE email LIKE 'perf-client-%@example.invalid'
  `);
  const usr = userRange.rows[0];
  if (usr.amount !== usersCount || usr.last_id - usr.first_id + 1 !== usersCount) {
    throw new Error('Non-contiguous test user IDs');
  }

  console.log(`Seeding ${rentalsCount} completed historical rentals ...`);
  await client.query(`
    INSERT INTO rentals (
      user_id, car_id, start_date, end_date,
      total_price, status_id, created_at
    )
    SELECT
      $1::int + ((g.i - 1) % $2::int),
      c.car_id,
      CURRENT_DATE - (15 + (g.i % 350)),
      CURRENT_DATE - (15 + (g.i % 350)) + (g.i % 3),
      c.price_per_day * (1 + (g.i % 3)),
      (SELECT status_id FROM rental_statuses WHERE code = 'completed'),
      (CURRENT_DATE - (22 + (g.i % 350)))::timestamp
    FROM generate_series(1, $3::int) AS g(i)
    JOIN cars AS c
      ON c.car_id = $4::int + ((g.i - 1) % $5::int)
  `, [usr.first_id, usersCount, rentalsCount, car.first_id, carsCount]);

  await client.query('COMMIT');
  await client.query('ANALYZE');
  const summary = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM cars) AS cars,
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM rentals) AS rentals
  `);
  console.log('Seed complete:', summary.rows[0]);
  console.log(`Elapsed: ${((Date.now() - startedAt) / 1000).toFixed(2)} s`);
} catch (error) {
  await client.query('ROLLBACK');
  console.error(error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
