import type { Request, Response } from "express";
import { getUsers as getUserService, createUser as createUserService, getUserById as getUserByIdService, 
        updateUser as updateUserService, blockUser as blockUserService, unblockUser as unblockUserService,
        changeUserPassword as changeUserPasswordService
} from '../services/users.service.js'
import { createUserSchema, updateUserSchema, passwordChangeSchema } from "../schemas/users.schema.js";

export async function getUsers(req: Request, res: Response) {
    const users = await getUserService();

    res.status(200).json(users)
}

export async function createUser(req: Request, res: Response) {
    const result = createUserSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: 'Invalid user data',
            details: result.error.issues
        });
    }

    const user = await createUserService(result.data);

    res.status(201).json(user);
}

export async function getUserById(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'Invalid user id'
        });
    }

    const user = await getUserByIdService(id);

    if (!user) {
        return res.status(404).json({
            error: 'User not found'
        });
    }

    res.status(200).json(user);
}

export async function updateUser(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'Invalid user id'
        });
    }

    const result = updateUserSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: 'Invalid data',
            details: result.error.issues
        });
    }

    if (Object.keys(result.data).length === 0) {
        return res.status(400).json({
            error: 'No fields to update'
        });
    }

    const user = await updateUserService(id, result.data);

    if (!user) { 
        return res.status(404).json({
            error: 'User not found'
        });
    }

    res.status(200).json(user);
}


export async function blockUser(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'Invalid user id'
        });
    }

    const user = await blockUserService(id);

    if (!user) {
        return res.status(404).json({
            error: 'User not found'
        });
    }

    res.status(200).json(user);
}

export async function unblockUser(req: Request, res: Response) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'Invalid user id'
        });
    }

    const user = await unblockUserService(id);

    if (!user) {
        return res.status(404).json({
            error: 'User not found'
        });
    }

    res.status(200).json(user);
}

export async function  changeUserPassword(req: Request, res: Response) {
    const id = Number(req.params.id);

    const newPassword = passwordChangeSchema.safeParse(req.body);

    if (!newPassword.success) {
        return res.status(400).json({
            error: 'Invalid user data',
            details: newPassword.error.issues
        });
    }

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: 'Invalid user id'
        });
    }
    
    const user = await changeUserPasswordService(id, newPassword.data);

    if(!user) {
        return res.status(404).json({
            error: 'User not found'
        });
    }

    res.status(200).json(user);
}
