import type { Request, Response, NextFunction } from "express";

export function checkRole(...needRoles: string[]) {
    return function (req: Request, res: Response, next: NextFunction) {
        const user_role = req.user?.role
        if (!user_role) {
            return res.status(401).json({
                error: 'Unauthorized('
            })
        }

        if (needRoles.includes(user_role)) {
            return next();
        }

        return res.status(403).json({
            error: 'Forbidden access'
        });
    }
}