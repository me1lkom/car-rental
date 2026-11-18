#!/bin/sh
set -eu

COMPOSE_FILE="docker-compose.perf.yml"

compose() {
    docker compose -p car-rental-perf -f "$COMPOSE_FILE" "$@"
}

cleanup() {
    if [ "${KEEP_PERF:-0}" != "1" ]; then
        compose down --volumes --remove-orphans > /dev/null 2>&1
    fi
}

trap cleanup EXIT

# Удаляем предыдущее тестовое окружение
compose down --volumes --remove-orphans > /dev/null 2>&1

echo "Сборка тестового окружения"
compose build --quiet backend-perf

echo "Запуск PostgreSQL и backend"
compose up -d --wait --no-build backend-perf

echo "Генерация тестовых данных"
compose exec -T backend-perf node scripts/seed-performance.mjs

# Если тесты не указаны, запускаем все
if [ "$#" -eq 0 ]; then
    set -- cars-list cars-filter rentals-list rentals-create
fi

mkdir -p tests/load/results

echo "Запуск нагрузочных тестов"

for scenario in "$@"; do
    echo "Тест: $scenario"

    report="tests/load/results/$(date +%Y%m%d-%H%M%S)-$scenario.txt"

    if compose --profile load run --rm --no-deps -T k6 \
        run "/scripts/$scenario.js" > "$report" 2>&1; then
        cat "$report"
    else
        cat "$report"
        exit 1
    fi
done