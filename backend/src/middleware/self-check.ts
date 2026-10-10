import type { Request, Response, NextFunction } from "express";

export function selfCheck(req: Request, res: Response, next: NextFunction) {
    const accessedId = Number(req.params.id);

    if (!Number.isInteger(accessedId) || accessedId <= 0) {
        return res.status(400).json({
            error: 'Invalid user id'
        });
    }

    const userId = req.user?.user_id;

    if (accessedId !== userId) { 
        return res.status(403).json({
            error: 'Forbidden access'
        })
    }

    next();
}