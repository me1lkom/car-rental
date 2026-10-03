import pool from '../db/database.js';

export async function getUserByEmail(email: string) {
    const query = `
        SELECT 
            u.user_id,
            u.name,
            u.surname,
            u.email,
            u.phone,
            r.name AS role,
            u.created_at,
            u.password_hash
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.email = $1 AND u.blocked_at IS NULL
    `;

    const result = await pool.query(query, [email]);

    return result.rows[0];
}

export async function getAllRole() {
    const query = `
        SELECT * FROM roles
    `;

    const result = await pool.query(query);

    return result.rows;
}