# To Run as Docker Container

## Prerequisites

- **Docker Desktop** 4.x+ (includes Compose v2)

---

# 1) Register and setup app in Clerk

**Register for [Clerk Account](https://clerk.com/)**

- **Docker Compose example**

Replace values with your own in a local `.env` (do not commit secrets). Example placeholder:

```sh
DATABASE_URL=postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@postgres:5432/<POSTGRES_DB>?schema=public&sslmode=disable
```

---

## **Create Test Users in Clerk**

- Go to "Users" in Clerk dashboard.
- Create users for role: `admin`
- In each user, go into Profile.
   Scroll down to Metadata, then edit Public
- Set `public_metadata` for user:

```yaml
{
"role": "admin"
}
```
---

## **Configure Clerk Session Claims**

- Go to Clerk dashboard → Configure → Session Management → Customize session token
- Add under Claims:

```yaml
{
	"publicMetadata": {
		"role": "{{user.public_metadata.role}}"
	}
}
```
## **Get Clerk API Keys**

- In Clerk dashboard —> configure —> API keys —> Publishable Key / Secret Key.
---

## 2) Configure environment variables

Create a **`.env`** at the repo root: (rename the provided .env.example to .env to use)

```sh
# Copy this file to .env and fill in values for local development
# Do NOT commit real credentials. .env is in .gitignore.

# Postgres credentials used by docker-compose
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydb

# App database URL (Postgres)
# DATABASE_URL=postgresql://myuser:mypassword@postgres:5432/mydb
DATABASE_URL=postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@postgres:5432/<POSTGRES_DB>?schema=public&sslmode=disable

# Clerk (auth) keys 
CLERK_SECRET_KEY= [add your secret key here]
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= [add your publishable key here]
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/

# Seeds: enable SQL seeding on container start (development only)
SQL_SEED_ON_START=false

## Database changes (Prisma deprecated)

This project is moving away from Prisma due to runtime issues in AKS. The repo now includes plain SQL migrations and seeds under `sql/` and a lightweight Postgres helper at `src/lib/db.ts`.

How to run locally:

1. Ensure `DATABASE_URL` is set (Postgres connection string).
2. Create schema: `psql "$DATABASE_URL" -f sql/schema.sql`
3. Seed: `psql "$DATABASE_URL" -f sql/seed-full.sql`

Alternatively you can run the included Node helper which reads `DATABASE_URL`:

PowerShell

$env:DATABASE_URL = 'postgres://user:pass@localhost:5432/db'
node scripts/run-sql-seed.js sql/schema.sql
node scripts/run-sql-seed.js sql/seed-full.sql

See `sql/README.md` for more details.

API routes: Basic CRUD API routes are being added under `src/app/api/*` (example: `src/app/api/teachers`).

If you previously relied on `prisma/seed.ts` or other Prisma-based code, see `src/lib/prisma.ts` which now throws in production and instructs developers to migrate call sites to `src/lib/db.ts`.

# If you need the container to chown mounted files on startup (development only)
# CHOWN_ON_STARTUP=false
```

---

## Docker dev note: file ownership (important)

This project runs the app as a non-root container user (UID 1000)

If you prefer an init chown step instead of changing host ownership, see `docker/README.md` for an optional
init-chown pattern (dev only).

## 3) Build & run

```bash
# from repo root
docker compose build --no-cache
docker compose up -d
```

- To run app, open in browser:

```powershell
http://localhost:3000/
```

login with your created clerk account earlier

---

## Running the consolidated SQL seed (docker)

This repository includes a single consolidated SQL file `sql/seed-full.sql` which applies the necessary
type-conversion ALTERs (uuid -> text for some id columns) and then inserts the large idempotent dev seed.

Important: The ALTERs in `sql/seed-full.sql` are irreversible and intended for development only. Do NOT run
this file against production. Back up your database before running.

To run the consolidated seed automatically during container startup, enable the env var in `.env` or `docker-compose.yml`:

```env
SQL_SEED_ON_START=true
```

When enabled the container entrypoint will run `/app/scripts/run-sql-seed.js /app/sql/seed-full.sql` after the
DB becomes available. You can also run it manually from your host (requires `psql` or the node runner):

PowerShell:

```powershell
# $env:DATABASE_URL = 'postgresql://tnw_user:tnw_pass@127.0.0.1:5432/tuition_dev?schema=public&sslmode=disable'
# node scripts/run-sql-seed.js sql/seed-full.sql
# or using psql (if psql is installed):
# psql "$env:DATABASE_URL" -f sql/seed-full.sql
```

## 
