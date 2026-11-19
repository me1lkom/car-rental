import type { Request, Response } from "express";
import {
    getUsers as getUserService,
    createUser as createUserService,
    getUserById as getUserByIdService,
    updateUser as updateUserService,
    blockUser as blockUserService,
    unblockUser as unblockUserService,
    changeUserPassword as changeUserPasswordService
} from '../services/users.service.js'
import { createUserSchema, updateUserSchema, passwordChangeSchema } from "../schemas/users.schema.js";
import { sendError } from '../middleware/error-handler.js';
import { checkId } from "../utils/check-id.js";

export async function getUsers(req: Request, res: Response) {
    const users = await getUserService();

    res.status(200).json(users)
}

export async function createUser(req: Request, res: Response) {
    const result = createUserSchema.safeParse(req.body);

    if (!result.success) {
        return sendError(res, 400, 'Invalid user data', result.error.issues);
    }

    const creation = await createUserService(result.data);

    if (!creation.ok) {
        return sendError(res, 409, creation.reason === 'EMAIL_ALREADY_EXISTS'
            ? 'Email already registered'
            : 'Phone already registered');
    }

    return res.status(201).json(creation.user);
}

export async function getUserById(req: Request, res: Response) {
    const id = checkId(req.params.id);

    if (!id) {
        return sendError(res, 400, 'Invalid user id');
    }

    const user = await getUserByIdService(id);

    if (!user) {
        return sendError(res, 404, 'User not found');
    }

    res.status(200).json(user);
}

export async function updateUser(req: Request, res: Response) {
    const id = checkId(req.params.id);

    if (!id) {
        return sendError(res, 400, 'Invalid user id');
    }

    const result = updateUserSchema.safeParse(req.body);

    if (!result.success) {
        return sendError(res, 400, 'Invalid data', result.error.issues);
    }

    if (Object.keys(result.data).length === 0) {
        return sendError(res, 400, 'No fields to update');
    }

    const user = await updateUserService(id, result.data);

    if (!user) {
        return sendError(res, 404, 'User not found');
    }

    res.status(200).json(user);
}


export async function blockUser(req: Request, res: Response) {
    const id = checkId(req.params.id);

    if (!id) {
        return sendError(res, 400, 'Invalid user id');
    }

    const result = await blockUserService(id);

    if (!result.ok) {
        if (result.reason === 'INVALID_USER_BLOCK') {
            return sendError(res, 404, 'User not found');
        }
    }

    res.status(200).json(result.user);
}

export async function unblockUser(req: Request, res: Response) {
    const id = checkId(req.params.id);

    if (!id) {
        return sendError(res, 400, 'Invalid user id');
    }

    const user = await unblockUserService(id);

    if (!user) {
        return sendError(res, 404, 'User not found');
    }

    res.status(200).json(user);
}

export async function changeUserPassword(req: Request, res: Response) {
    let result = passwordChangeSchema.safeParse(req.body);

    if (!result.success) {
        return sendError(res, 400, 'Invalid user data', result.error?.issues);
    }

    const id = checkId(req.params.id);

    if (!id) {
        return sendError(res, 400, 'Invalid user id');
    }

    const changeeResult = await changeUserPasswordService(id, result.data);

    if (!changeeResult.ok) {
        if (changeeResult.reason === 'USER_NOT_FOUND') {
            return sendError(res, 404, 'User not found');
        }

        if (changeeResult.reason === 'WRONG_PASSWORD') {
            return sendError(res, 400, 'Incorrect current password');
        }
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return res.sendStatus(204);
}
