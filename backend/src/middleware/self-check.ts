import type { Request, Response, NextFunction } from "express";
import { sendError } from './error-handler.js';


export function selfCheck(req: Request, res: Response, next: NextFunction) {
    const accessedId = Number(req.params.id);

    if (!Number.isInteger(accessedId) || accessedId <= 0) {
        return sendError(res, 400, 'Invalid user id');
    }

    const userId = req.user?.user_id;

    if (accessedId !== userId) {
        return sendError(res, 403, 'Forbidden access');
    }

    next();
}