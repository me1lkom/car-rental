-- Up Migration

INSERT INTO rental_statuses (code, name)
VALUES ('pending_payment', 'Ожидает предоплаты');

ALTER TABLE rentals
ADD COLUMN hold_expires_at TIMESTAMPTZ;


-- Down Migration

DELETE FROM rental_statuses
WHERE code = 'pending_payment';

ALTER TABLE rentals
DROP COLUMN hold_expires_at;