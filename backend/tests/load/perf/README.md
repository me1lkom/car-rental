# Изолированные нагрузочные тесты backend

Новые файлы устанавливаются с сохранением путей из папки `backend/`.
Этот контур не использует обычную БД `car_rental`, её порт или Docker-volume.

## Перед запуском

В `backend/` должны быть корректные зависимости Swagger. На проверенной версии `main` они ошибочно добавлены в корневой `package.json`, а не в `backend/package.json`. Если ещё не исправлено:

```bash
cd backend
npm install swagger-ui-express
npm install -D @types/swagger-ui-express
```

Должны быть доступны Docker Desktop / `docker compose`. Локальный k6 **не нужен**: он запускается контейнером.

## Запуск

Из `backend/`:

```bash
bash scripts/run-performance-tests.sh
```

Или выполнить один сценарий:

```bash
bash scripts/run-performance-tests.sh cars-filter
```

Сценарии: `cars-list`, `cars-filter`, `rentals-list`, `rentals-create`.
При каждом запуске старый временный perf-том **удаляется**, окружение пересоздаётся, заново применяются миграции, генерируются тестовые записи, затем выполняется k6.
После тестов perf-контейнеры и их том удаляются. Основная БД не затрагивается.
Отчёты — `backend/tests/load/results/*.txt` (не коммитить результаты).

## Размер данных

По умолчанию 10 000 машин, 5 000 клиентов + 1 администратор, 100 000 завершённых исторических аренд. Дополнительно при старте базы выполняются обычные `db/01-schema.sql`, `db/02-seed.sql` и все миграции.

Можно начать с меньших цифр:

```bash
PERF_CARS=1000 PERF_USERS=500 PERF_RENTALS=10000 bash scripts/run-performance-tests.sh cars-filter
```

**Важно:** `rentals-create` требует минимум 200 доступных Honda, поэтому при `PERF_CARS=1000` машин будет примерно столько же Honda (и чуть меньше 200 доступных); для этого сценария оставляй значения по умолчанию или хотя бы 2000 машин.

## Ручной EXPLAIN ANALYZE после заполнения

Чтобы оставить perf-окружение включённым:

```bash
KEEP_PERF=1 bash scripts/run-performance-tests.sh cars-filter
```

После выполнения:

```bash
docker compose -p car-rental-perf -f docker-compose.perf.yml exec postgres-perf psql -U perf_user -d car_rental_perf
```

Пример запроса в `psql`:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM cars WHERE deleted_at IS NULL AND brand = 'Honda';
```

Удаление только perf-окружения после ручного исследования:

```bash
docker compose -p car-rental-perf -f docker-compose.perf.yml down -v --remove-orphans
```

Для диагностики запуска:

```bash
docker compose -p car-rental-perf -f docker-compose.perf.yml logs backend-perf
```

## Интерпретация

Замеры выполняются в Docker на локальной машине и зависят от её ресурсов, размера ответов и окружения. Сценарии используют закрытую модель нагрузки (VU + sleep); наблюдаемый RPS — результат, а не заданное число запросов в секунду. Сами по себе эти числа не доказывают наличие или отсутствие узкого места.

`GET /cars` возвращает весь список без пагинации: на 10 000 машин этот запрос может тратить время прежде всего на передачу и сериализацию большого JSON. Для чисто SQL-анализа используй `EXPLAIN ANALYZE` и сравни отдельно с полным HTTP-замером.

При сравнении «до/после» сохраняй одинаковые объёмы данных и сценарии, повторяй тесты, а также записывай результаты `EXPLAIN ANALYZE`.
