type AuthUser = {
    user_id: number;
    role: string;
};

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export {};