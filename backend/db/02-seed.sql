INSERT INTO roles (name)
VALUES
    ('client'),
    ('manager'),
    ('admin');


INSERT INTO cars (
    license_plate,
    brand,
    model,
    year,
    image_url,
    description,
    price_per_day,
    status
)
VALUES
    (
        'A123AA',
        'Toyota',
        'Camry',
        2023,
        'https://example.com/camry.jpg',
        'Комфортный седан для города и поездок на дальние расстояния',
        5000,
        'available'
    ),
    (
        'B456BB',
        'BMW',
        'X5',
        2024,
        'https://example.com/x5.jpg',
        'Премиальный кроссовер',
        9000,
        'available'
    ),
    (
        'C789CC',
        'Kia',
        'K5',
        2022,
        'https://example.com/k5.jpg',
        'Современный седан',
        4500,
        'maintenance'
    ),
    (
        'D321DD',
        'Hyundai',
        'Tucson',
        2023,
        'https://example.com/tucson.jpg',
        'Практичный кроссовер',
        5500,
        'available'
    ),
    (
        'E654EE',
        'Mercedes-Benz',
        'E-Class',
        2024,
        'https://example.com/e-class.jpg',
        'Бизнес-седан',
        8500,
        'unavailable'
    );

