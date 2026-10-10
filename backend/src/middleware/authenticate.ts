
import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import type { AuthPayload } from '../types/auth.js';
import { checkUser as checkUserRepository } from '../repositories/auth.repository.js'

export async function checkAuth(req: Request, res: Response, next: NextFunction) {
    const accessToken = req.cookies.access_token;

    if (!accessToken) {
        return res.status(401).json({
            error: 'Miss token'
        });
    }

    const jwtSecret = process.env.JWT_SECRET_KEY;

    if (!jwtSecret) {
        throw new Error('Invalid authentication configuration');
    }

    let decodedJWT;     

    try {
        decodedJWT = jwt.verify(accessToken, jwtSecret) as AuthPayload;
    } catch (error) {
        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }

    const userId = decodedJWT.user_id;
    const sessionId = decodedJWT.session_id;

    const checkPayload: AuthPayload = {
        user_id: userId,
        session_id: sessionId
    }

    const userData = await checkUserRepository(checkPayload);

    if (!userData) {
        return res.status(401).json({
            error: 'Invalid or revoked session'
        });
    }


    req.user = {
        user_id: userData.user_id,
        role: userData.role
    }
    
    return next();
}