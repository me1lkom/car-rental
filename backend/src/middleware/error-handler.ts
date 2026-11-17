import type { Response, ErrorRequestHandler } from 'express';

type HttpErrorStatus = 400 | 401 | 403 | 404 | 409 | 500;

export class HttpError extends Error {
    constructor(
        public readonly status: HttpErrorStatus,
        message: string,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'HttpError';
    }
}

export function sendError(
    res: Response,
    status: HttpErrorStatus,
    message: string,
    details?: unknown
) {
    return res.status(status).json({
        error: message,
        ...(details !== undefined ? { details } : {})
    });
}

export const errorHandler: ErrorRequestHandler = (
    err,
    req,
    res,
    next
) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof HttpError) {
        return sendError(res, err.status, err.message, err.details);
    }

    if (
        err instanceof SyntaxError &&
        'status' in err &&
        err.status === 400 &&
        'body' in err
    ) {
        return sendError(res, 400, 'Invalid JSON');
    }

    console.error(err);

    return sendError(res, 500, 'Internal server error');
};