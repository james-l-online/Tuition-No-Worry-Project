#!/usr/bin/env sh
set -e

echo "Waiting for postgres:5432 (TCP)…"
RETRIES=60
# Use netcat for a plain TCP wait; no SQL, no Prisma yet.
until nc -z postgres 5432 >/dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  echo "  not ready, retrying…"
  RETRIES=$((RETRIES-1))
  sleep 2
done
[ $RETRIES -eq 0 ] && { echo "ERROR: PG tcp unreachable"; exit 1; }

echo "Ensuring DB exists (prisma db create)…"
npx prisma db create || true

echo "Applying migrations (prisma migrate deploy)…"
npx prisma migrate deploy

if [ "${PRISMA_SEED_ON_START:-false}" = "true" ]; then
  echo "Seeding (prisma db seed)…"
  npx prisma db seed || true
fi

if [ "${PRISMA_STUDIO:-false}" = "true" ]; then
  echo "Starting Prisma Studio on ${PRISMA_STUDIO_PORT:-5555}…"
  (npx prisma studio --port "${PRISMA_STUDIO_PORT:-5555}" &) || true
fi

echo "Starting app…"
exec "$@"
