-- Up Migration

-- Новые справочники

-- 1. Типы кузова
CREATE TABLE body_types (
    body_type_id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 2. Типы привода
CREATE TABLE drive_types (
    drive_type_id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 3. Классы аренды
CREATE TABLE rental_classes (
    rental_class_id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 4. Коробки передач
CREATE TABLE transmissions (
    transmission_id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 5. Типы топлива
CREATE TABLE fuel_types (
    fuel_type_id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Значения справочников
INSERT INTO body_types (code, name) VALUES
    ('sedan', 'Седан'),
    ('hatchback', 'Хэтчбек'),
    ('wagon', 'Универсал'),
    ('liftback', 'Лифтбек'),
    ('coupe', 'Купе'),
    ('convertible', 'Кабриолет'),
    ('crossover', 'Кроссовер'),
    ('suv', 'Внедорожник'),
    ('minivan', 'Минивэн');

INSERT INTO drive_types (code, name) VALUES
    ('fwd', 'Передний'),
    ('rwd', 'Задний'),
    ('awd', 'Полный');

INSERT INTO rental_classes (code, name) VALUES
    ('economy', 'Эконом'),
    ('comfort', 'Комфорт'),
    ('business', 'Бизнес'),
    ('premium', 'Премиум');

INSERT INTO transmissions (code, name) VALUES
    ('manual', 'Механическая'),
    ('automatic', 'Автоматическая'),
    ('cvt', 'Вариатор'),
    ('robot', 'Роботизированная'),
    ('single_speed', 'Одноступенчатая');

INSERT INTO fuel_types (code, name) VALUES
    ('petrol', 'Бензин'),
    ('diesel', 'Дизель'),
    ('hybrid', 'Гибрид'),
    ('phev', 'Подключаемый гибрид'),
    ('electric', 'Электро'),
    ('lpg', 'Газ (LPG)');

-- Новые характеристики автомобилей

ALTER TABLE cars
    ADD COLUMN body_type_id INTEGER
        REFERENCES body_types(body_type_id)
        ON DELETE RESTRICT,

    ADD COLUMN drive_type_id INTEGER
        REFERENCES drive_types(drive_type_id)
        ON DELETE RESTRICT,

    ADD COLUMN rental_class_id INTEGER
        REFERENCES rental_classes(rental_class_id)
        ON DELETE RESTRICT,

    ADD COLUMN transmission_id INTEGER
        REFERENCES transmissions(transmission_id)
        ON DELETE RESTRICT,

    ADD COLUMN fuel_type_id INTEGER
        REFERENCES fuel_types(fuel_type_id)
        ON DELETE RESTRICT,

    ADD COLUMN seats SMALLINT
        CHECK (seats BETWEEN 2 AND 9),

    ADD COLUMN doors SMALLINT
        CHECK (doors BETWEEN 2 AND 6);


-- Down Migration

ALTER TABLE cars
    DROP COLUMN body_type_id,
    DROP COLUMN drive_type_id,
    DROP COLUMN rental_class_id,
    DROP COLUMN transmission_id,
    DROP COLUMN fuel_type_id,
    DROP COLUMN seats,
    DROP COLUMN doors;

DROP TABLE fuel_types;
DROP TABLE transmissions;
DROP TABLE rental_classes;
DROP TABLE drive_types;
DROP TABLE body_types;