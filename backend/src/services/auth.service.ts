import { getUserByEmail as getUserByEmailRepository } from '../repositories/auth.repository.js';
import type { Login as LoginType } from '../schemas/auth.schema.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { AuthPayload } from '../types/auth.js';

export async function login(userData: LoginType) {

    const findUser = await getUserByEmailRepository(userData.email.trim().toLowerCase())

    if (!findUser) {
        return null /* заглушка, временно */
    }

    const comparePasswordHash = await bcrypt.compare(userData.password, findUser.password_hash);

    if (!comparePasswordHash) {
        return null /* заглушка, временно */
    }

    const { password_hash, ...publicUser } = findUser;

    const { user_id, role } = findUser;

    const payload: AuthPayload = { user_id, role };

    const jwtSecret = process.env.JWT_SECRET_KEY;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN;


    if (!jwtSecret || !jwtExpiresIn) {
        throw new Error('JWT_SECRET_KEY or JWT_EXPIRES_IN not defined');
    }

    const expiresIn = jwtExpiresIn as NonNullable<SignOptions['expiresIn']>;

    const token = jwt.sign(payload, jwtSecret, {
        expiresIn
    });

    return { token, publicUser }
}