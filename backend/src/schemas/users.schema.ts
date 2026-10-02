import { z } from 'zod';

export const createUserSchema = z.object({

    name: z.string().min(1),
    surname: z.string().min(1),
    email: z.email(),
    phone: z.string().min(1),
    password: z.string().min(8)

});
export type NewUser = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    surname: z.string().min(1).optional(),
    email: z.email().optional(),
    phone: z.string().min(1).optional()
});
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type NewUserRecord = Omit<NewUser, 'password'> & {
    password_hash: string;
};

export const passwordChangeSchema = z.object({
    password: z.string().min(8)
});
export type PasswordChange = z.infer<typeof passwordChangeSchema>

