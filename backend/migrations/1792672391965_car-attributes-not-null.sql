
-- Up Migration

WITH demo_cars (
    license_plate,
    body_code,
    drive_code,
    class_code,
    transmission_code,
    fuel_code,
    seats,
    doors
) AS (
    VALUES
        ('A123AA', 'sedan',     'fwd', 'comfort',  'automatic', 'petrol', 5, 4),
        ('B456BB', 'crossover', 'awd', 'premium',  'automatic', 'petrol', 5, 5),
        ('C789CC', 'sedan',     'fwd', 'comfort',  'automatic', 'petrol', 5, 4),
        ('D321DD', 'crossover', 'awd', 'comfort',  'automatic', 'petrol', 5, 5),
        ('E654EE', 'sedan',     'rwd', 'business', 'automatic', 'petrol', 5, 4)
)
UPDATE cars AS c
SET
    body_type_id = COALESCE(c.body_type_id, bt.body_type_id),
    drive_type_id = COALESCE(c.drive_type_id, dt.drive_type_id),
    rental_class_id = COALESCE(c.rental_class_id, rc.rental_class_id),
    transmission_id = COALESCE(c.transmission_id, t.transmission_id),
    fuel_type_id = COALESCE(c.fuel_type_id, ft.fuel_type_id),
    seats = COALESCE(c.seats, d.seats),
    doors = COALESCE(c.doors, d.doors)
FROM demo_cars AS d
JOIN body_types AS bt ON bt.code = d.body_code
JOIN drive_types AS dt ON dt.code = d.drive_code
JOIN rental_classes AS rc ON rc.code = d.class_code
JOIN transmissions AS t ON t.code = d.transmission_code
JOIN fuel_types AS ft ON ft.code = d.fuel_code
WHERE c.license_plate = d.license_plate;


-- Закрепляем обязательность характеристик.

ALTER TABLE cars
    ALTER COLUMN body_type_id SET NOT NULL,
    ALTER COLUMN drive_type_id SET NOT NULL,
    ALTER COLUMN rental_class_id SET NOT NULL,
    ALTER COLUMN transmission_id SET NOT NULL,
    ALTER COLUMN fuel_type_id SET NOT NULL,
    ALTER COLUMN seats SET NOT NULL,
    ALTER COLUMN doors SET NOT NULL;


-- Down Migration

ALTER TABLE cars
    ALTER COLUMN body_type_id DROP NOT NULL,
    ALTER COLUMN drive_type_id DROP NOT NULL,
    ALTER COLUMN rental_class_id DROP NOT NULL,
    ALTER COLUMN transmission_id DROP NOT NULL,
    ALTER COLUMN fuel_type_id DROP NOT NULL,
    ALTER COLUMN seats DROP NOT NULL,
    ALTER COLUMN doors DROP NOT NULL;
