#!/usr/bin/env bash
# Umbral deploy helper. Run from the repo root or from deploy/.
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cp env.example .env
  echo "Created deploy/.env from env.example."
  echo "Edit it (POSTGRES_PASSWORD, PUBLIC_URL) and re-run." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a; . ./.env; set +a

if [ "${POSTGRES_PASSWORD:-CHANGE_ME_LONG_RANDOM}" = "CHANGE_ME_LONG_RANDOM" ]; then
  echo "Refusing to start: set a real POSTGRES_PASSWORD in deploy/.env" >&2
  exit 1
fi

echo "==> Building and starting db + app on 127.0.0.1:${APP_PORT:-3001}"
docker compose up -d --build

echo "==> Waiting for health..."
for i in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:${APP_PORT:-3001}/api/health" >/dev/null 2>&1; then
    echo "==> Umbral is healthy."
    echo "    Local:  http://127.0.0.1:${APP_PORT:-3001}"
    echo "    Public: ${PUBLIC_URL:-<not set>}"
    exit 0
  fi
  sleep 3
done

echo "App did not become healthy in time. Inspect:" >&2
echo "  docker compose logs --tail=120 app" >&2
exit 1
