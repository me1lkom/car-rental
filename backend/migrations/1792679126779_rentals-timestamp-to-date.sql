-- Up Migration

ALTER TABLE rentals
    ALTER COLUMN start_date TYPE DATE USING start_date::DATE,
    ALTER COLUMN end_date TYPE DATE USING end_date::DATE;

ALTER TABLE rentals
ADD CONSTRAINT rentals_dates_check
CHECK (end_date >= start_date);

-- Down Migration

ALTER TABLE rentals
    ALTER COLUMN start_date TYPE TIMESTAMP USING start_date::TIMESTAMP,
    ALTER COLUMN end_date TYPE TIMESTAMP USING end_date::TIMESTAMP;

ALTER TABLE rentals
DROP CONSTRAINT rentals_dates_check;