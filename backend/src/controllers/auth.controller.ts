import type { Request, Response } from "express";
import { login as loginService, refreshToken as refreshTokenService, logout as logoutService } from '../services/auth.service.js';
import { getUserById as getUserByIdService } from '../services/users.service.js';
import { loginSchema } from "../schemas/auth.schema.js";
import { sendError } from '../middleware/error-handler.js';
import { setAuthCookies } from '../utils/auth-cookies.js';


export async function login(req: Request, res: Response) {
    const userData = loginSchema.safeParse(req.body);

    if (!userData.success) {
        return sendError(res, 400, 'Invalid user data', userData.error.issues);
    }

    const result = await loginService(userData.data);

    if (!result) {
        return sendError(res, 401, 'Invalid email or password');
    }

    const { accessToken, refreshToken, publicUser } = result;

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json(publicUser);
}

export async function returnMe(req: Request, res: Response) {
    if (!req.user) {
        return sendError(res, 401, 'Lost you :(');
    }

    const user_id: number = req.user.user_id

    const user = await getUserByIdService(user_id);

    if (!user) {
        return sendError(res, 404, 'User not found');
    }

    res.status(200).json(user);
}

export async function refreshToken(req: Request, res: Response) {

    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
        return sendError(res, 401, 'Token not found');
    }

    const result = await refreshTokenService(refreshToken);

    if (!result.ok) {
        if (result.reason === 'SESSION_NOT_FOUND') {
            return sendError(res, 401, 'Session not found');
        }
        if (result.reason === 'INVALID_UPDATE') {
            return sendError(res, 401, 'Invalid or expired refresh token');
        }
    }

    const { accessToken, newRefreshToken } = result;

    setAuthCookies(res, accessToken, newRefreshToken);

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

            return sendError(res, 401, 'Session not found');
        }
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return res.sendStatus(204);
}