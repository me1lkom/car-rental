import pool from '../db/database.js';
import type { UpdateUser, NewUserRecord } from '../schemas/users.schema.js';

export async function getUsers() {
    const query = `
        SELECT 
            u.user_id,
            u.name,
            u.surname,
            u.email,
            u.phone,
            r.name AS role, 
            u.created_at,
            u.blocked_at
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
    `

    const result = await pool.query(query);

    return result.rows;
}

export async function createUser(user: NewUserRecord) {
    const query = `
        INSERT INTO users (
            name,
            surname, 
            email,
            phone,
            password_hash
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING 
            user_id,
            name,
            surname,
            email,
            phone,
            created_at
    `

    const values = [
        user.name,
        user.surname,
        user.email,
        user.phone,
        user.password_hash
    ]

    const result = await pool.query(query, values);

    return result.rows[0]
}

export async function getUserById(id: number) {
    const query = `
        SELECT 
            u.user_id,
            u.name,
            u.surname,
            u.email,
            u.phone,
            r.name AS role, 
            u.created_at,
            u.blocked_at
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.user_id = $1 AND u.blocked_at IS NULL
    `

    const result = await pool.query(query, [id]);

    return result.rows[0];
}

export async function updateUser(id: number, updates: UpdateUser) {
    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(updates)) {
        fields.push(`${key} = $${values.length + 1}`);
        values.push(value);
    }

    values.push(id);

    const query = `
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE user_id = $${values.length} AND blocked_at IS NULL
        RETURNING 
            user_id,
            name,
            surname,
            email,
            phone
    `;

    const result = await pool.query(query, values);

    return result.rows[0];
}

export async function blockUser(id: number) {
    const query = `
        UPDATE users u
        SET blocked_at = CURRENT_TIMESTAMP
        FROM roles r
        WHERE u.user_id = $1
          AND u.role_id = r.role_id
          AND u.blocked_at IS NULL
        RETURNING
            u.user_id,
            u.name,
            u.surname,
            u.email,
            u.phone,
            r.name AS role,
            u.created_at,
            u.blocked_at
    `;

    const result = await pool.query(query, [id])

    return result.rows[0];
}


export async function unblockUser(id: number) {

    const query = `
        UPDATE users u
        SET blocked_at = NULL
        FROM roles r
        WHERE u.user_id = $1
            AND u.role_id = r.role_id
            AND u.blocked_at IS NOT NULL
        RETURNING
            u.user_id,
            u.name,
            u.surname,
            u.email,
            u.phone,
            r.name AS role,
            u.created_at,
            u.blocked_at
    `
    const result = await pool.query(query, [id])

    return result.rows[0];
}

export async function changeUserPassword(id: number, passwordHash: string) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const updatePasswordQuery = `
            UPDATE users
            SET password_hash = $2
            WHERE user_id = $1 AND blocked_at IS NULL
            RETURNING user_id
        `;

        const updatePasswordResult = await client.query(updatePasswordQuery, [id, passwordHash]);

        if (updatePasswordResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        const revokeSessionQuery = `
            UPDATE refresh_sessions
            SET revoked_at = NOW()
            WHERE user_id = $1 AND expire_at > NOW()
                AND revoked_at IS NULL
        `;

        const revokeSessionResult = await client.query(revokeSessionQuery, [id]);

        await client.query('COMMIT');
        return updatePasswordResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }

}

export async function returnPassword(id: number) {
    const query = `
        SELECT 
            user_id,
            password_hash
        FROM users
        WHERE user_id = $1 AND blocked_at IS NULL
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
}
