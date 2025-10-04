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

if [ -z "${DATABASE_URL:-}" ] \
  || echo "${DATABASE_URL}" | grep -q "<POSTGRES_" \
  || echo "${DATABASE_URL:-}" | grep -Eq "(localhost|127\\.0\\.0\\.1)"; then
  if [ -n "${POSTGRES_USER:-}" ] && [ -n "${POSTGRES_PASSWORD:-}" ] && [ -n "${POSTGRES_DB:-}" ]; then
    export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public&sslmode=disable"
    echo "Constructed DATABASE_URL from POSTGRES_* env vars"
  else
    echo "WARNING: DATABASE_URL not set or contains placeholders/points to localhost. Set DATABASE_URL or POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB in your .env"
  fi
fi

# Print a masked DATABASE_URL for debugging (hide credentials)
if [ -n "${DATABASE_URL:-}" ]; then
  # extract host portion safely
  DBHOST=$(echo "${DATABASE_URL}" | sed -E 's#.*@([^:/]+).*#\1#' || echo "<unknown>")
  echo "Using DATABASE host: ${DBHOST}"
fi

# Seeding:

if [ "${SQL_SEED_ON_START:-false}" = "true" ]; then
  # First apply schema (if provided), then run the consolidated data seed.
  if [ -f "/app/sql/schema.sql" ]; then
    echo "Applying SQL schema: /app/sql/schema.sql"
    if [ -f "/app/scripts/run-sql-seed.js" ]; then
      node /app/scripts/run-sql-seed.js /app/sql/schema.sql || true
    elif command -v psql >/dev/null 2>&1; then
      psql "$DATABASE_URL" -f /app/sql/schema.sql || true
    else
      echo "No SQL runner (node script or psql) available; skipping schema apply."
    fi
  else
    echo "No /app/sql/schema.sql found; skipping schema apply."
  fi

  echo "Running consolidated SQL seed (if present): /app/sql/seed-full.sql"
  if [ -f "/app/sql/seed-full.sql" ]; then
    if [ -f "/app/scripts/run-sql-seed.js" ]; then
      node /app/scripts/run-sql-seed.js /app/sql/seed-full.sql || true
    elif command -v psql >/dev/null 2>&1; then
      psql "$DATABASE_URL" -f /app/sql/seed-full.sql || true
    else
      echo "No SQL runner (node script or psql) available; skipping SQL seed."
    fi
  else
    echo "No /app/sql/seed-full.sql found; skipping SQL seed."
  fi
fi

echo "Starting app…"
  if [ "${DEBUG_LIST_APP:-false}" = "true" ]; then
    echo "--- DEBUG: listing /app ---"
    ls -la /app || true
    echo "--- end debug ---"
  fi
exec "$@"
