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

# Notes:
# - If you mount host volumes into /app (for development), file ownership may be root on the container.
#   Set CHOWN_ON_STARTUP=true to attempt a chown -R /app to the runtime user (UID 1000).
#   Example in docker-compose:
#     environment:
#       - CHOWN_ON_STARTUP=true
# - chown requires the container to run as a user that can perform chown (root). If you are running
#   the container as non-root, leave CHOWN_ON_STARTUP unset and make sure host side ownership maps to UID 1000.
