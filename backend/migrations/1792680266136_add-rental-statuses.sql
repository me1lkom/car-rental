
-- Up Migration

-- Создаём справочника статусов
CREATE TABLE rental_statuses (
    status_id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Добавляес начальные значения
INSERT INTO rental_statuses (code, name) VALUES
    ('pending', 'На рассмотрении'),
    ('confirmed', 'Подтверждена'),
    ('active', 'Активна'),
    ('completed', 'Завершена'),
    ('cancelled', 'Отменена'),
    ('rejected', 'Отклонена');

-- Добавляем новый столбец
ALTER TABLE rentals
ADD COLUMN status_id INTEGER
    REFERENCES rental_statuses(status_id)
    ON DELETE RESTRICT;

-- Переносим существующие статусы, если аренды уже есть
UPDATE rentals AS r
SET status_id = rs.status_id
FROM rental_statuses AS rs
WHERE r.status = rs.code;

-- Закрепляем обязательность статуса
ALTER TABLE rentals
ALTER COLUMN status_id SET NOT NULL;

-- Удаляем старый столбец
ALTER TABLE rentals
DROP COLUMN status;


-- Down Migration

-- Восстанавливаем старый строковый столбец
ALTER TABLE rentals
ADD COLUMN status VARCHAR(30);

UPDATE rentals AS r
SET status = rs.code
FROM rental_statuses AS rs
WHERE r.status_id = rs.status_id;

ALTER TABLE rentals
ALTER COLUMN status SET NOT NULL;

ALTER TABLE rentals
DROP COLUMN status_id;

DROP TABLE rental_statuses;
