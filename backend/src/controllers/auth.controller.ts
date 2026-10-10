import type { Request, Response } from "express";
import { login as loginService, refreshToken as refreshTokenService, logout as logoutService } from '../services/auth.service.js';
import { getUserById as getUserByIdService } from '../services/users.service.js';
import { loginSchema } from "../schemas/auth.schema.js";


export async function login(req: Request, res: Response) {
    const userData = loginSchema.safeParse(req.body);

    if (!userData.success) {
        return res.status(400).json({
            error: 'Invalid user data',
            details: userData.error.issues
        });
    }

    const result = await loginService(userData.data);

    if (!result) {
        return res.status(401).json({
            error: 'Invalid email or password',
        });
    }

    const { accessToken, refreshToken, publicUser } = result;

    const accessTtlSeconds = Number(process.env.ACCESS_TOKEN_TTL_SECONDS);
    const refreshTtlSeconds = Number(process.env.REFRESH_TOKEN_TTL_SECONDS);

    if (
        !accessTtlSeconds ||
        !refreshTtlSeconds
    ) {
        throw new Error('Invalid authentication configuration');
    }

    res.cookie('access_token', accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: accessTtlSeconds * 1000
    });

    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: refreshTtlSeconds * 1000
    });

    res.status(200).json(publicUser);
}

export async function returnMe(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({
            error: 'Lost you :('
        });
    }

    const user_id: number = req.user.user_id

    const user = await getUserByIdService(user_id);

    if (!user) {
        return res.status(404).json({
            error: 'User not found'
        });
    }

    res.status(200).json(user);
}

export async function refreshToken(req: Request, res: Response) {

    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
        return res.status(401).json({
            error: 'Token not found'
        });
    }

    const result = await refreshTokenService(refreshToken);

    if (!result.ok) {
        if (result.reason === 'SESSION_NOT_FOUND') {
            return res.status(401).json({
                error: 'Session not found'
            });
        }
        if (result.reason === 'INVALID_UPDATE') {
            return res.status(401).json({
                error: 'Invalid or expired refresh token'
            })
        }
    }

    const { accessToken, newRefreshToken } = result;

    const accessTtlSeconds = Number(process.env.ACCESS_TOKEN_TTL_SECONDS);
    const refreshTtlSeconds = Number(process.env.REFRESH_TOKEN_TTL_SECONDS);

    if (
        !accessTtlSeconds ||
        !refreshTtlSeconds
    ) {
        throw new Error('Invalid authentication configuration');
    }

    res.cookie('access_token', accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: accessTtlSeconds * 1000
    });

    res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: refreshTtlSeconds * 1000
    });

    return res.sendStatus(204);
}

export async function logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');

        return res.sendStatus(204);
    }

    const result = await logoutService(refreshToken);

    if (!result.ok) {
        if (result.reason === 'SESSION_NOT_FOUND') {
            res.clearCookie('access_token');
            res.clearCookie('refresh_token');
            return res.status(401).json({
                error: 'Session not found'
            });
        }
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return res.sendStatus(204);
}