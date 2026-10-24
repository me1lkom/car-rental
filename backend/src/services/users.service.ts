
import type { NewUser, UpdateUser, NewUserRecord, PasswordChange } from '../schemas/users.schema.js';
import {
    getUsers as getUsersRepository, 
    createUser as createUserRepository,
    getUserById as getUserByIdRepository, 
    updateUser as updateUserRepository,
    blockUser as blockUserRepository, 
    deleteSession as deleteSessionRepository,
    unblockUser as unblockUserRepository,
    changeUserPassword as changeUserPasswordRepository, 
    returnPassword as returnPasswordRepository
} from '../repositories/users.repository.js';
import bcrypt from 'bcrypt';
import { withTransaction } from '../db/transaction.js';


export async function getUsers() {
    return await getUsersRepository();
}

export async function createUser(user: NewUser) {

    const passwordHash = await bcrypt.hash(user.password, 12);

    const { password, ...userData } = user;

    const userRecord: NewUserRecord = {
        ...userData,
        password_hash: passwordHash
    };

    try {
        const createdUser = await createUserRepository(userRecord);

        return {
            ok: true,
            user: createdUser
        } as const;
    } catch (error: unknown) {
        if (
            error instanceof Error &&
            'code' in error &&
            error.code === '23505' &&
            'constraint' in error
        ) {
            if (error.constraint === 'users_email_key') {
                return {
                    ok: false,
                    reason: 'EMAIL_ALREADY_EXISTS'
                } as const;
            }

            if (error.constraint === 'users_phone_key') {
                return {
                    ok: false,
                    reason: 'PHONE_ALREADY_EXISTS'
                } as const;
            }
        }

        throw error;
    }
}

export async function getUserById(id: number) {
    return await getUserByIdRepository(id);
}

export async function updateUser(id: number, updates: UpdateUser) {
    return await updateUserRepository(id, updates);
}

export async function blockUser(id: number) {
    return withTransaction(async (client) => {
        const blockUser = await blockUserRepository(id, client);
        if (!blockUser) {
            return {
                ok: false,
                reason: 'INVALID_USER_BLOCK'
            } as const;
        };

        await deleteSessionRepository(id, client);

        return {
            ok: true,
            user: blockUser
        } as const;

    })

}

export async function unblockUser(id: number) {
    return await unblockUserRepository(id);
}

export async function changeUserPassword(id: number, password: PasswordChange) {
    const userData = await returnPasswordRepository(id);

    if (!userData) {
        return {
            ok: false,
            reason: 'USER_NOT_FOUND'
        } as const;
    }

    const isPasswordCorrect = await bcrypt.compare(password.currentPassword, userData.password_hash);

    if (!isPasswordCorrect) {
        return {
            ok: false,
            reason: 'WRONG_PASSWORD'
        } as const;
    }

    const passwordHash = await bcrypt.hash(password.newPassword, 12);


    const result = await changeUserPasswordRepository(id, passwordHash);

    if (!result) {
        return {
            ok: false,
            reason: 'USER_NOT_FOUND'
        } as const;
    }

    return {
        ok: true,
        user: result
    } as const;
}
