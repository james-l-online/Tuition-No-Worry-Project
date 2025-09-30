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
# If DATABASE_URL contains placeholder tokens like <POSTGRES_USER>, try to construct
# it from individual POSTGRES_* env vars. This helps when using docker-compose with
# environment placeholders.
if [ -z "${DATABASE_URL:-}" ] || echo "${DATABASE_URL}" | grep -q "<POSTGRES_"; then
  if [ -n "${POSTGRES_USER:-}" ] && [ -n "${POSTGRES_PASSWORD:-}" ] && [ -n "${POSTGRES_DB:-}" ]; then
    export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public&sslmode=disable"
    echo "Constructed DATABASE_URL from POSTGRES_* env vars"
  else
    echo "WARNING: DATABASE_URL not set or contains placeholders. Set DATABASE_URL or POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB in your .env"
  fi
fi

# The `prisma db create` command is no longer available in Prisma v4+. We'll rely on
# migrations (deploy) to create/apply schema. If you need to create the DB manually,
# create the Postgres database from the host or use a one-off container.

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
#   Set CHOWN_ON_STARTUP=true to attempt a chown -R /app to the runtime user (UID 1007).
#   Example in docker-compose:
#     environment:
#       - CHOWN_ON_STARTUP=true
# - chown requires the container to run as a user that can perform chown (root). If you are running
#   the container as non-root, leave CHOWN_ON_STARTUP unset and make sure host side ownership maps to UID 1007.
