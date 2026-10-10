
import type { NewUser, UpdateUser, NewUserRecord, PasswordChange } from '../schemas/users.schema.js';
import {
    getUsers as getUsersRepository, createUser as createUserRepository,
    getUserById as getUserByIdRepository, updateUser as updateUserRepository,
    blockUser as blockUserRepository, unblockUser as unblockUserRepository,
    changeUserPassword as changeUserPasswordRepository, returnPassword as returnPasswordRepository
} from '../repositories/users.repository.js';
import bcrypt from 'bcrypt';

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

    return await createUserRepository(userRecord);
}

export async function getUserById(id: number) {
    return await getUserByIdRepository(id);
}

export async function updateUser(id: number, updates: UpdateUser) {
    return await updateUserRepository(id, updates);
}

export async function blockUser(id: number) {
    return await blockUserRepository(id);
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
