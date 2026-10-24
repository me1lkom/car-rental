import pool from '../db/database.js';
import type { NewCar, UpdateCar, CarsFilter } from '../schemas/cars.schema.js';


export async function findCars(filters: CarsFilter) {
    const conditions: string[] = ['c.deleted_at IS NULL'];
    const values: (string | number)[] = [];

    function addFilter(column: string, value?: string | number) {
        if (value === undefined) return;

        values.push(value);
        conditions.push(`${column} = $${values.length}`);
    }

    addFilter('c.brand', filters.brand);
    addFilter('c.model', filters.model);
    addFilter('c.year', filters.year);
    addFilter('c.status', filters.status);

    addFilter('c.body_type_id', filters.body_type_id);
    addFilter('c.drive_type_id', filters.drive_type_id);
    addFilter('c.rental_class_id', filters.rental_class_id);
    addFilter('c.transmission_id', filters.transmission_id);
    addFilter('c.fuel_type_id', filters.fuel_type_id);
    addFilter('c.seats', filters.seats);
    addFilter('c.doors', filters.doors);

    const query = `
        SELECT
            c.*,
            bt.name AS body_type_name,
            dt.name AS drive_type_name,
            rc.name AS rental_class_name,
            t.name AS transmission_name,
            ft.name AS fuel_type_name
        FROM cars AS c
        LEFT JOIN body_types AS bt
            ON c.body_type_id = bt.body_type_id
        LEFT JOIN drive_types AS dt
            ON c.drive_type_id = dt.drive_type_id
        LEFT JOIN rental_classes AS rc
            ON c.rental_class_id = rc.rental_class_id
        LEFT JOIN transmissions AS t
            ON c.transmission_id = t.transmission_id
        LEFT JOIN fuel_types AS ft
            ON c.fuel_type_id = ft.fuel_type_id
        WHERE ${conditions.join(' AND ')}
    `;

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
            status,
            body_type_id,
            drive_type_id,
            rental_class_id,
            transmission_id,
            fuel_type_id,
            seats,
            doors
        )
        VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15
        )
        RETURNING *`,
        [
            car.license_plate,
            car.brand,
            car.model,
            car.year,
            car.image_url,
            car.description,
            car.price_per_day,
            car.status,
            car.body_type_id,
            car.drive_type_id,
            car.rental_class_id,
            car.transmission_id,
            car.fuel_type_id,
            car.seats,
            car.doors
        ]
    );

    return result.rows[0];
}

export async function findCarsById(id: number) {
    const query = `
        SELECT 
            c.*,
            bt.name AS body_type_name,
            dt.name AS drive_type_name,
            rc.name AS rental_class_name,
            t.name AS transmission_name,
            ft.name AS fuel_type_name
        FROM cars AS c
        LEFT JOIN body_types AS bt
            ON c.body_type_id = bt.body_type_id
        LEFT JOIN drive_types AS dt
            ON c.drive_type_id = dt.drive_type_id
        LEFT JOIN rental_classes AS rc
            ON c.rental_class_id = rc.rental_class_id
        LEFT JOIN transmissions AS t
            ON c.transmission_id = t.transmission_id
        LEFT JOIN fuel_types AS ft
            ON c.fuel_type_id = ft.fuel_type_id
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

export async function getCarAttributes() {
    const [
        bodyTypes,
        driveTypes,
        rentalClasses,
        transmissions,
        fuelTypes
    ] = await Promise.all([
        pool.query('SELECT * FROM body_types ORDER BY name'),
        pool.query('SELECT * FROM drive_types ORDER BY name'),
        pool.query('SELECT * FROM rental_classes ORDER BY name'),
        pool.query('SELECT * FROM transmissions ORDER BY name'),
        pool.query('SELECT * FROM fuel_types ORDER BY name')
    ]);

    return {
        body_types: bodyTypes.rows,
        drive_types: driveTypes.rows,
        rental_classes: rentalClasses.rows,
        transmissions: transmissions.rows,
        fuel_types: fuelTypes.rows
    };
}

export async function findCarUnavailablePeriods(carId: number) {
    const query = `
        SELECT 
            (r.start_date - 1)::text AS start_date,
            (r.end_date + 1)::text AS end_date
        FROM rentals AS r
        JOIN rental_statuses AS rs 
            ON r.status_id = rs.status_id
        WHERE r.car_id = $1 AND (rs.code IN ('pending', 'confirmed', 'active') OR (
            rs.code = 'pending_payment' AND r.hold_expires_at > NOW()
        ))
        ORDER BY r.start_date;
    `

    const result = await pool.query(query, [carId])

    return result.rows;
}