-- Up Migration

ALTER TABLE refresh_sessions
ALTER COLUMN expire_at TYPE TIMESTAMPTZ
USING expire_at AT TIME ZONE 'UTC';

-- Down Migration

ALTER TABLE refresh_sessions
ALTER COLUMN expire_at TYPE TIMESTAMP
USING expire_at AT TIME ZONE 'UTC';