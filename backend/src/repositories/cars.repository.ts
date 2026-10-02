import pool from '../db/database.js';
import type { NewCar, UpdateCar } from '../schemas/cars.schema.js';


type CarsFilter = {
    brand?: string;
    model?: string;
    year?: number;
    status?: string;
};

export async function findCars(filters: CarsFilter) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.brand) {
        conditions.push(`brand = $${values.length + 1}`);
        values.push(filters.brand);
    }

    if (filters.model) {
        conditions.push(`model = $${values.length + 1}`);
        values.push(filters.model);
    }

    if (filters.year) {
        conditions.push(`year = $${values.length + 1}`);
        values.push(filters.year);
    }

    if (filters.status) {
        conditions.push(`status = $${values.length + 1}`);
        values.push(filters.status);
    }

    let query = `
        SELECT * FROM cars
        WHERE deleted_at IS NULL
    `;

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await pool.query(query, values);

    return result.rows;
}

export async function createCar(car: NewCar) {
    const result = await pool.query(
        `INSERT INTO cars (
            license_plate,
            brand,
            model,
            year,
            image_url,
            description,
            price_per_day,
            status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
            car.license_plate,
            car.brand,
            car.model,
            car.year,
            car.image_url,
            car.description,
            car.price_per_day,
            car.status
        ]
    );

    return result.rows[0];
}

export async function findCarsById(id: number) {
    const query = `
        SELECT * FROM cars
        WHERE car_id = $1 AND deleted_at IS NULL
    `

    const result = await pool.query(query, [id]);
    return result.rows[0];
}


export async function updateCar(id: number, updates: UpdateCar) {
    const fields: string[] = []
    const values: unknown[] = []

    for (const [key, value] of Object.entries(updates)) {
        fields.push(`${key} = $${values.length + 1}`);
        values.push(value);
    }

    values.push(id);

    const query = `
        UPDATE cars 
        SET ${fields.join(', ')}
        WHERE car_id = $${values.length} AND deleted_at IS NULL
        RETURNING *
    `;

    const result = await pool.query(query, values);

    return result.rows[0];
}

export async function temporaryFindAllCars() {
    const query = `
        SELECT * FROM cars
    `
    const result = await pool.query(query);
    return result.rows;
}

export async function deleteCar(id: number) {
    const query = `
        UPDATE cars
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE car_id = $1 AND deleted_at IS NULL
        RETURNING *
    `

    const result = await pool.query(query, [id])

    return result.rows[0];
}

export async function restoreCar(id: number) {
    const query = `
        UPDATE cars 
        SET deleted_at = NULL
        WHERE car_id = $1
        RETURNING *
    `
    const result = await pool.query(query, [id])

    return result.rows[0];
}