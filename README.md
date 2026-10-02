# Car Rental

Веб-приложение для аренды автомобилей компании.

## Структура

- `backend/` — REST API, бизнес-логика и работа с PostgreSQL
- `frontend/` — клиентская часть приложения

## Backend stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- Zod
- bcrypt
- Docker

## Требования

- Node.js
- npm
- Docker / Docker Compose

## Запуск backend

1. Перейти в backend:

   cd backend

2. Установить зависимости:

   npm install

3. Создать `.env` на основе `.env.example`.

4. Запустить PostgreSQL:

   docker compose up -d

5. Запустить сервер:

   npm run dev

Backend будет доступен по адресу:

http://localhost:3000