import pool from '../db/database.js';
import type {
    RefreshToken as RefreshTokenType,
    UpdateRefreshData as UpdateRefreshDataType
} from '../schemas/auth.schema.js'
import type { AuthPayload } from '../types/auth.js';


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

export async function addRefreshToken(refreshData: RefreshTokenType) {
    const query = `
        INSERT INTO refresh_sessions (
            user_id,
            refresh_token_hash, 
            expire_at
        )
        VALUES ($1, $2, $3)
        RETURNING *
    `;

    const values = [
        refreshData.user_id,
        refreshData.refresh_token_hash,
        refreshData.expire_at
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
}

export async function getSessionByRefresh(refreshTokenHash: string) {
    const query = `
        SELECT 
            rs.session_id,
            rs.user_id,
            rs.refresh_token_hash, 
            rs.expire_at,
            r.name AS role
        FROM refresh_sessions rs
        JOIN users u ON u.user_id = rs.user_id
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.blocked_at IS NULL AND rs.revoked_at IS NULL 
            AND rs.refresh_token_hash = $1 AND rs.expire_at > NOW()
    `;

    const result = await pool.query(query, [refreshTokenHash]);

    return result.rows[0];
}

export async function updateSession(updateData: UpdateRefreshDataType) {
    const query = `
        UPDATE refresh_sessions 
        SET 
            refresh_token_hash = $2, 
            expire_at = $4
        WHERE session_id = $1 AND refresh_token_hash = $3 
            AND revoked_at IS NULL AND expire_at > NOW()
        RETURNING *
    `;

    const values = [
        updateData.session_id,
        updateData.new_refresh_token_hash,
        updateData.old_refresh_token_hash,
        updateData.expire_at,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
}

export async function checkUser(checkData: AuthPayload) {
    const query = `
        SELECT 
            u.user_id,
            r.name AS role
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        JOIN refresh_sessions rs ON u.user_id = rs.user_id
        WHERE u.user_id = $1 AND rs.session_id = $2 
            AND u.blocked_at IS NULL 
            AND revoked_at IS NULL AND expire_at > NOW()
    `

    const values = [
        checkData.user_id,
        checkData.session_id
    ]

    const result = await pool.query(query, values);

    return result.rows[0];
}

export async function logout(refreshTokenHash: string) {
    const query = `
        UPDATE refresh_sessions
        SET revoked_at = NOW()
        WHERE refresh_token_hash = $1 AND revoked_at IS NULL
    `;

    const result = await pool.query(query, [refreshTokenHash]);

    return result.rowCount === 1;
}