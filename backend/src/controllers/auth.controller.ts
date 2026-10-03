import type { Request, Response } from "express";
import { login as loginService } from '../services/auth.service.js';
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

    const { token, publicUser } = result;

    res.cookie('access_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 60 * 60 * 1000
    });

    res.status(200).json(publicUser);
}

export async function returnMe(req: Request, res: Response) {
    if(!req.user) {
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