import type { Request, Response, NextFunction } from "express";
import { sendError } from './error-handler.js';


export function checkRole(...needRoles: string[]) {
    return function (req: Request, res: Response, next: NextFunction) {
        const user_role = req.user?.role
        if (!user_role) {
            return sendError(res, 401, 'Unauthorized');
        }

        if (needRoles.includes(user_role)) {
            return next();
        }

        return sendError(res, 403, 'Forbidden access');

    }
}