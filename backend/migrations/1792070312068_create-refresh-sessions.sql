-- Up Migration

CREATE TABLE IF NOT EXISTS public.refresh_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(user_id),
    refresh_token_hash VARCHAR(64) UNIQUE NOT NULL,
    expire_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP
);

-- Down Migration

DROP TABLE public.refresh_sessions;