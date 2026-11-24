#!/bin/sh
set -e

echo "[umbral] applying database schema..."

# v0.1 uses `db push`, not migrations. It is safe for first boot and for
# additive changes; it will refuse destructive ones, which is what we want.
# Replace with `prisma migrate deploy` once migrations exist.
npx prisma db push \
  --schema prisma/schema.postgres.prisma \
  --skip-generate

echo "[umbral] starting server on ${HOSTNAME}:${PORT}"
exec node node_modules/next/dist/bin/next start -p "${PORT}" -H "${HOSTNAME}"
