#!/bin/sh
set -eu

COMPOSE_FILE="docker-compose.test.yml"

cleanup() {
    docker compose -f "$COMPOSE_FILE" down \
        --volumes --remove-orphans > /dev/null 2>&1
}

trap cleanup EXIT

cleanup

echo "Сборка тестового окружения"

docker compose -f "$COMPOSE_FILE" build --quiet \
    backend-test integration-tests

echo "Запуск PostgreSQL и backend"

docker compose -f "$COMPOSE_FILE" up \
    -d --wait --no-build backend-test > /dev/null

echo "Запуск интеграционных тестов"

docker compose -f "$COMPOSE_FILE" run \
    --rm --no-deps integration-tests