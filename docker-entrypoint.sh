#!/bin/sh
set -e

echo "[umbral] applying database schema..."

npx prisma db push \
  --schema prisma/schema.postgres.prisma \
  --skip-generate

if grep -q '"seed"' package.json; then
  echo "[umbral] seeding database..."
  npm run seed || echo "[umbral] seed failed or already seeded."
fi

echo "[umbral] starting server on ${HOSTNAME}:${PORT}"
exec node node_modules/next/dist/bin/next start -p "${PORT}" -H "${HOSTNAME}"
