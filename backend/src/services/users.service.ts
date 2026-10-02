
import type { NewUser, UpdateUser, NewUserRecord, PasswordChange } from '../schemas/users.schema.js';
import { getUsers as getUsersRepository, createUser as createUserRepository, 
    getUserById as getUserByIdRepository, updateUser as updateUserRepository,
    blockUser as blockUserRepository, unblockUser as unblockUserRepository,
    changeUserPassword as changeUserPasswordRepository
} from '../repositories/users.repository.js';
import bcrypt from 'bcrypt';

export async function getUsers() {
    return await getUsersRepository();
}

export async function createUser(user: NewUser) {
    
    const passwordHash = await bcrypt.hash(user.password, 12);

    const { password, ...userData} = user;

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

export async function changeUserPassword(id: number, newPassword: PasswordChange) {
    const passwordHash = await bcrypt.hash(newPassword.password, 12);

    return await changeUserPasswordRepository(id, passwordHash)
}
