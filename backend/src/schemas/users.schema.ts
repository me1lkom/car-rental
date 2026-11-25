import { z } from 'zod';

export const createUserSchema = z.object({
    name: z.string().min(1),
    surname: z.string().min(1),
    email: z.email().toLowerCase(),
    phone: z.string().min(1),
    password: z.string().min(8)
});
export type NewUser = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    surname: z.string().min(1).optional(),
    email: z.email().toLowerCase().optional(),
    phone: z.string().min(1).optional()
});
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type NewUserRecord = Omit<NewUser, 'password'> & {
    password_hash: string;
};

export const passwordChangeSchema = z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8)
});
export type PasswordChange = z.infer<typeof passwordChangeSchema>

const queryPositiveInt = z.string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().positive());

const queryNonNegativeInt = z.string()
    .regex(/^(0|[1-9]\d*)$/)
    .transform(Number)
    .pipe(z.number().int().nonnegative());

const userRoleSchema = z.enum([
    'client',
    'manager',
    'admin'
]);

export const usersFilterSchema = z.object({
    user_id: queryPositiveInt.optional(),

    role: userRoleSchema.optional(),

    blocked: z.enum(['true', 'false'])
        .transform(value => value === 'true')
        .optional(),

    search: z.string().trim().min(1).max(100).optional(),

    limit: queryPositiveInt
        .pipe(z.number().max(100))
        .default(50),

    offset: queryNonNegativeInt.default(0)
});

export type UsersFilter = z.infer<typeof usersFilterSchema>;