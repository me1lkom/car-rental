import type { Response } from 'express';
import { getAuthConfig } from '../config/auth.config.js';

export function setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string
) {
    const { accessTtlSeconds, refreshTtlSeconds } = getAuthConfig();

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
}