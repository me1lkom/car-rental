import type { PoolClient } from 'pg';
import pool from '../db/database.js';
import type { NewRentalRecord, UpdateRentalData, RentalsFilter } from '../schemas/rentals.schema.js';
import { fi } from 'zod/locales';

export async function getRentals(filters: RentalsFilter) {
    const conditions: string[] = [];
    const values: (string | number | string[])[] = [];

    function addFilter(column: string, value?: string | number) {
        if (value === undefined) return;

        values.push(value);
        conditions.push(`${column} = $${values.length}`)
    }

    addFilter('r.rental_id', filters.rental_id);
    addFilter('r.car_id', filters.car_id);
    addFilter('r.user_id', filters.user_id);

    if (filters.status !== undefined) {
        values.push(filters.status);
        conditions.push(`rs.code = ANY($${values.length}::text[])`)
    }

    if (filters.date_from !== undefined) {
        values.push(filters.date_from);
        conditions.push(`r.end_date >= $${values.length}::date`)
    }

    if (filters.date_to !== undefined) {
        values.push(filters.date_to);
        conditions.push(`r.start_date <= $${values.length}::date`)
    }

    if (filters.search !== undefined) {
        values.push(`%${filters.search}%`);

        const param = `$${values.length}`;

        conditions.push(`(
            CONCAT_WS(' ', c.brand, c.model) ILIKE ${param}
            OR c.license_plate ILIKE ${param}
            OR CONCAT_WS(' ', u.name, u.surname) ILIKE ${param}
            OR CONCAT_WS(' ', u.surname, u.name) ILIKE ${param}
            OR u.email ILIKE ${param}
            OR u.phone ILIKE ${param}
            OR r.rental_id::text ILIKE ${param}
        )`);
    }

    const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const limitParams = values.length + 1;
    const offsetParams = values.length + 2;

    const paginationValues = [
        ...values,
        filters.limit,
        filters.offset
    ];

    const client = await pool.connect();

    try {
        const rentalsResult = await client.query(`
            SELECT 
                r.rental_id,
                r.start_date,
                r.end_date,
                r.created_at,
                r.total_price,
                rs.name AS status_name,
                rs.code AS status_code,
                r.hold_expires_at,
                json_build_object(
                    'car_id', c.car_id,
                    'license_plate', c.license_plate,
                    'brand', c.brand,
                    'model', c.model,
                    'year', c.year
                ) as car,
                json_build_object(
                    'user_id', u.user_id,
                    'role_name', rl.name,
                    'name', u.name,
                    'surname', u.surname,
                    'email', u.email,
                    'phone', u.phone
                ) as user
            FROM rentals AS r
            JOIN cars AS c ON r.car_id = c.car_id
            JOIN rental_statuses AS rs ON r.status_id = rs.status_id
            JOIN users AS u ON r.user_id = u.user_id
            JOIN roles AS rl ON u.role_id = rl.role_id
            ${whereClause}
            ORDER BY rental_id DESC
            LIMIT $${limitParams} OFFSET $${offsetParams}
        `, paginationValues);

        const countResult = await client.query(`
            SELECT
                COUNT(*) AS total
            FROM rentals AS r
            JOIN rental_statuses AS rs ON r.status_id = rs.status_id
            JOIN users AS u ON r.user_id = u.user_id
            JOIN cars AS c ON r.car_id = c.car_id
            ${whereClause}
        `, values);

        return {
            rentals: rentalsResult.rows,
            total: Number(countResult.rows[0].total)
        };
    } finally {
        client.release();
    }
}

export async function getRentalById(rental_id: number, user_id?: number) {

    let query = `
        SELECT 
            r.rental_id,
            r.start_date,
            r.end_date,
            r.created_at,
            r.total_price,
            rs.name AS status_name,
            rs.code AS status_code,
            r.hold_expires_at,
            json_build_object(
                'car_id', c.car_id,
                'license_plate', c.license_plate,
                'brand', c.brand,
                'model', c.model,
                'year', c.year
            ) as car,
            json_build_object(
                'user_id', u.user_id,
                'role_name', rl.name,
                'name', u.name,
                'surname', u.surname,
                'email', u.email,
                'phone', u.phone
            ) as user
        FROM rentals AS r
        JOIN cars AS c ON r.car_id = c.car_id
        JOIN rental_statuses AS rs ON r.status_id = rs.status_id
        JOIN users AS u ON r.user_id = u.user_id
        JOIN roles AS rl ON u.role_id = rl.role_id
        WHERE r.rental_id = $1
    `

    const values = [rental_id]

    if (user_id !== undefined) {
        query += ` AND r.user_id = $2`;
        values.push(user_id)
    }

    const result = await pool.query(query, values);

    return result.rows[0];
}

export async function getUserRentalById(rental_id: number, user_id: number) {
    return getRentalById(rental_id, user_id);
}

export async function findConflictingRentals(
    car_id: number,
    start_date: string,
    end_date: string,
    client?: PoolClient,
    excludeRentalId?: number
) {
    const db = client ?? pool;

    let excludeCondition = '';

    if (excludeRentalId !== undefined) {
        excludeCondition = `AND r.rental_id <> $4`;
    }

    const query = `
        SELECT EXISTS(
            SELECT 1
            FROM rentals AS r
            JOIN rental_statuses AS rs
                ON r.status_id = rs.status_id
            WHERE r.car_id = $1
                AND r.start_date - 1 <= $3::date
                AND r.end_date + 1 >= $2::date
                AND (
                    rs.code IN ('pending', 'confirmed', 'active')
                    OR (
                        rs.code = 'pending_payment'
                        AND r.hold_expires_at > NOW()
                    )
                )
                ${excludeCondition}
        ) AS has_conflict;
    `;

    const values: (number | string)[] = [
        car_id,
        start_date,
        end_date
    ];

    if (excludeRentalId !== undefined) {
        values.push(excludeRentalId);
    }

    const result = await db.query(query, values);

    return result.rows[0].has_conflict as boolean;
}

export async function getCarPricePerDay(car_id: number) {
    const query = `
        SELECT price_per_day
        FROM cars
        WHERE car_id = $1
    `;

    const result = await pool.query<{ price_per_day: number }>(
        query,
        [car_id]
    );

    return result.rows[0]?.price_per_day ?? null;
}

export async function getCarForUpdate(car_id: number, client: PoolClient) {
    const query = `
        SELECT
            car_id,
            price_per_day,
            status
        FROM cars
        WHERE car_id = $1
            AND deleted_at IS NULL
        FOR UPDATE
    `;

    const result = await client.query(query, [car_id]);

    return result.rows[0] ?? null;
}


export async function createRental(
    rental: NewRentalRecord,
    client: PoolClient
) {
    const query = `
        INSERT INTO rentals (
            user_id,
            car_id,
            start_date,
            end_date,
            total_price,
            status_id,
            hold_expires_at
        )
        VALUES (
            $1, $2, $3, $4, $5, (
                SELECT status_id
                FROM rental_statuses
                WHERE code = 'pending_payment'
            ),
            NOW() + INTERVAL '15 minutes'
        )
        RETURNING *;
    `;

    const values = [
        rental.user_id,
        rental.car_id,
        rental.start_date,
        rental.end_date,
        rental.total_price
    ];

    const result = await client.query(query, values);

    return result.rows[0];
}

export async function findRentalCarId(
    rental_id: number,
    client: PoolClient
) {
    const result = await client.query<{ car_id: number }>(`
        SELECT car_id
        FROM rentals
        WHERE rental_id = $1
    `, [rental_id]);

    return result.rows[0]?.car_id ?? null;
}

export async function mockPayment(
    rental_id: number,
    client: PoolClient
) {
    const query = `
        UPDATE rentals
        SET
            status_id = (
                SELECT status_id
                FROM rental_statuses
                WHERE code = 'pending'
            ),
            hold_expires_at = NULL
        WHERE rental_id = $1
            AND status_id = (
                SELECT status_id
                FROM rental_statuses
                WHERE code = 'pending_payment'
            )
            AND hold_expires_at > clock_timestamp()
        RETURNING *;
    `;

    const result = await client.query(query, [rental_id]);

    return result.rows[0] ?? null;
}

export async function updateRentalStatus(
    rentalId: number,
    expectedStatuses: string[],
    newStatus: string
) {

    const placeholders = expectedStatuses.map((_, index) => `$${index + 3}`).join(', ');

    const query = `
        UPDATE rentals 
        SET status_id = (
            SELECT status_id
            FROM rental_statuses
            WHERE code = $1
        )
        WHERE rental_id = $2
            AND status_id IN (
                SELECT status_id
                FROM rental_statuses
                WHERE code IN (${placeholders})
            )
        RETURNING *
    `;

    const result = await pool.query(query, [newStatus, rentalId, ...expectedStatuses])

    return result.rows[0];
}

export async function updateRental(
    rentalId: number,
    data: UpdateRentalData,
    client: PoolClient,
    managerRole?: boolean
) {
    const allowedFields = [
        'user_id',
        'car_id',
        'start_date',
        'end_date',
        'total_price'
    ] as const;

    const fields = allowedFields.filter(
        field => data[field] !== undefined
    );

    if (fields.length === 0) {
        throw new Error('No fields to update');
    }

    const setClause = fields
        .map((field, index) => `${field} = $${index + 2}`)
        .join(', ');

    const values = [
        rentalId,
        ...fields.map(field => data[field])
    ];

    let query = `
        UPDATE rentals
        SET ${setClause}
        WHERE rental_id = $1
    `;

    if (managerRole) {
        query += `
        AND status_id IN (
            SELECT status_id
            FROM rental_statuses
            WHERE code IN ('pending_payment', 'pending', 'confirmed')
        )
        AND end_date >= CURRENT_DATE
    `;
    }

    query += ` RETURNING *;`;

    const result = await client.query(query, values);

    return result.rows[0];
}

export async function updateRentalManager(
    rentalId: number,
    data: UpdateRentalData,
    client: PoolClient
) {
    return updateRental(rentalId, data, client, true);
}

export async function getRentalForUpdate(
    rentalId: number,
    client: PoolClient
) {
    const query = `
        SELECT
            r.rental_id,
            r.user_id,
            r.car_id,
            r.start_date::text,
            r.end_date::text,
            r.total_price,
            rs.code AS status_code
        FROM rentals AS r
        JOIN rental_statuses AS rs
            ON r.status_id = rs.status_id
        WHERE r.rental_id = $1
        FOR UPDATE OF r;
    `;

    const result = await client.query(query, [rentalId]);

    return result.rows[0];
}

export async function rentalUserExists(
    userId: number,
    client: PoolClient
) {
    const result = await client.query(`
        SELECT EXISTS (
            SELECT 1 FROM users WHERE user_id = $1
        ) AS user_exists
    `, [userId]);

    return result.rows[0].user_exists as boolean;
}