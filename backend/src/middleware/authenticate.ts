
import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import type { AuthPayload } from '../types/auth.js';

export function checkAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.access_token;

    if (!token) {
        return res.status(401).json({
            error: 'Miss token'
        });
    }

    const jwtSecret = process.env.JWT_SECRET_KEY;

    if (!jwtSecret) {
        throw new Error('JWT_SECRET_KEY not defined');
    }

    try {
        const decoded = jwt.verify(token, jwtSecret) as AuthPayload;

        req.user = {
            user_id: decoded.user_id,
            role: decoded.role
        }

        return next();
    } catch (error) {
        return res.status(401).json({
            error: 'Invalid or expired token'
        });
    }

}