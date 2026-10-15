# VELA frontend

Каталог, регистрация и вход идут на backend через прокси Vite.
Заявок в API нет, форма брони сохраняется в браузере.

## Запуск

Сначала должен быть запущен backend на http://localhost:3000.

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173