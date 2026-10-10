CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL DEFAULT 1 REFERENCES roles(role_id),
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    blocked_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cars (
    car_id SERIAL PRIMARY KEY,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    image_url VARCHAR(255),
    description VARCHAR(500),
    price_per_day INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS car_categories (
    car_id INTEGER NOT NULL REFERENCES cars(car_id),
    category_id INTEGER NOT NULL REFERENCES categories(category_id),
    PRIMARY KEY (car_id, category_id)
);

CREATE TABLE IF NOT EXISTS rentals (
    rental_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    car_id INTEGER NOT NULL REFERENCES cars(car_id),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    total_price INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    rental_id INTEGER NOT NULL REFERENCES rentals(rental_id),
    amount INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL,
    paid_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    refresh_token_hash VARCHAR(64) UNIQUE NOT NULL,
    expire_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP
)
