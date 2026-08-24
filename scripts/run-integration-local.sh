#!/usr/bin/env bash
set -euo pipefail

# Local helper to run integration tests with Docker Postgres
# Usage: ./scripts/run-integration-local.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.test.yml"

echo "Starting test Postgres..."
docker compose -f "$COMPOSE_FILE" up -d

export DATABASE_URL="postgres://cadtest:cadtest@localhost:5433/cadpoint_test"
echo "Pushing Prisma schema and seeding DB..."
cd "$ROOT_DIR/server"
npx prisma db push --schema=./prisma/schema.prisma
node prisma/seed.js

echo "Starting server in background..."
npm run start &
SERVER_PID=$!

echo "Waiting for server health..."
until curl -sSf http://localhost:5001/api/health >/dev/null 2>&1; do
  sleep 1
done

echo "Running integration tests..."
npm run test:integration

EXIT_CODE=$?
echo "Stopping server..."
kill $SERVER_PID || true

echo "Tearing down test Postgres..."
cd "$ROOT_DIR"
docker compose -f "$COMPOSE_FILE" down -v

exit $EXIT_CODE
