import { z } from 'zod';

export const loginSchema = z.object({
    email: z.email().toLowerCase(),
    password: z.string().min(8)
});

export type Login = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
    user_id: z.number().int(),
    refresh_token_hash: z.string(),
    expire_at: z.date()
})

export type RefreshToken = z.infer<typeof refreshTokenSchema>;

export const UpdateRefreshDataSchema = z.object({
    session_id: z.number().int(),
    new_refresh_token_hash: z.string(),
    old_refresh_token_hash: z.string(),
    expire_at: z.date()
})

export type UpdateRefreshData = z.infer<typeof UpdateRefreshDataSchema>
