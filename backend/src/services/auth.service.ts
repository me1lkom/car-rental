import {
    getUserByEmail as getUserByEmailRepository, addRefreshToken as addRefreshTokenRepository,
    getSessionByRefresh as getSessionByRefreshRepository, updateSession as updateSessionRepository,
    logout as logoutRepository
} from '../repositories/auth.repository.js';
import type {
    Login as LoginType, RefreshToken as RefreshTokenType,
    UpdateRefreshData as UpdateRefreshDataType
} from '../schemas/auth.schema.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { AuthPayload } from '../types/auth.js';
import { addDays } from 'date-fns';
import { randomBytes, createHash } from 'node:crypto';


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

    const { user_id } = findUser;

    const jwtSecret = process.env.JWT_SECRET_KEY;
    const accessTtlSeconds = Number(process.env.ACCESS_TOKEN_TTL_SECONDS);
    const refreshTtlSeconds = Number(process.env.REFRESH_TOKEN_TTL_SECONDS);


    if (
        !jwtSecret ||
        !accessTtlSeconds ||
        !Number.isInteger(refreshTtlSeconds) ||
        accessTtlSeconds <= 0 ||
        refreshTtlSeconds <= 0
    ) {
        throw new Error('Invalid authentication configuration');
    }

    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');

    const expireAt = new Date(Date.now() + refreshTtlSeconds * 1000);

    const refreshData: RefreshTokenType = {
        user_id: user_id,
        refresh_token_hash: refreshTokenHash,
        expire_at: expireAt
    };

    const result = await addRefreshTokenRepository(refreshData);

    if (!result) {
        return null;
    }

    const sessionId = result.session_id

    const payload: AuthPayload = {
        user_id,
        session_id: sessionId
    };
    
    const accessToken = jwt.sign(payload, jwtSecret, {
        expiresIn: accessTtlSeconds
    });

    return { accessToken, refreshToken, publicUser }
}

export async function refreshToken(token: string) {

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const findSession = await getSessionByRefreshRepository(tokenHash);

    if (!findSession) {
        return {
            ok: false,
            reason: 'SESSION_NOT_FOUND'
        } as const;
    }

    const sessionId = findSession.session_id
    const userId = findSession.user_id;

    const payload: AuthPayload = {
        user_id: userId,
        session_id: sessionId
    };

    const jwtSecret = process.env.JWT_SECRET_KEY;
    const accessTtlSeconds = Number(process.env.ACCESS_TOKEN_TTL_SECONDS);
    const refreshTtlSeconds = Number(process.env.REFRESH_TOKEN_TTL_SECONDS);


    if (
        !jwtSecret ||
        !accessTtlSeconds ||
        !Number.isInteger(refreshTtlSeconds) ||
        accessTtlSeconds <= 0 ||
        refreshTtlSeconds <= 0
    ) {
        throw new Error('Invalid authentication configuration');
    }

    const accessToken = jwt.sign(payload, jwtSecret, {
        expiresIn: accessTtlSeconds
    });

    const newRefreshToken = randomBytes(32).toString('hex');
    const newRefreshTokenHash = createHash('sha256').update(newRefreshToken).digest('hex');

    const expireAt = new Date(Date.now() + refreshTtlSeconds * 1000);

    const updateData: UpdateRefreshDataType = {
        session_id: sessionId,
        new_refresh_token_hash: newRefreshTokenHash,
        old_refresh_token_hash: tokenHash,
        expire_at: expireAt
    };

    const updateResult = await updateSessionRepository(updateData);

    if (!updateResult) {
        return {
            ok: false,
            reason: 'INVALID_UPDATE'
        } as const;
    }

    return {
        ok: true,
        accessToken,
        newRefreshToken
    } as const;
}

export async function logout(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    const findSession = await logoutRepository(tokenHash);

    if (!findSession) {
        return {
            ok: false,
            reason: 'SESSION_NOT_FOUND'
        } as const;
    }

    return {
        ok: true
    } as const;
}