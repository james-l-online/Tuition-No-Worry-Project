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

---

## 2) Configure environment variables

## **Get Clerk API Keys**

- In Clerk dashboard —> configure —> API keys —> Publishable Key / Secret Key.

Create a **`.env`** at the repo root: (rename the provided .env.example to .env to use)

```sh
# Copy this file to .env and fill in values for local development
# Do NOT commit real credentials. .env is in .gitignore.

# Postgres credentials used by docker-compose
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydb

# Prisma / app database URL
# DATABASE_URL=postgresql://myuser:mypassword@postgres:5432/mydb
DATABASE_URL=postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@postgres:5432/<POSTGRES_DB>?schema=public&sslmode=disable

# Clerk (auth) keys 
CLERK_SECRET_KEY= [add your secret key here]
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= [add your publishable key here]
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/

# Prisma options
PRISMA_SEED_ON_START=false
PRISMA_STUDIO=false
PRISMA_STUDIO_PORT=5555

## Database changes (Prisma deprecated)

This project is moving away from Prisma due to runtime issues in AKS. The repo now includes plain SQL migrations and seeds under `sql/` and a lightweight Postgres helper at `src/lib/db.ts`.

How to run locally:

1. Ensure `DATABASE_URL` is set (Postgres connection string).
2. Create schema: `psql "$DATABASE_URL" -f sql/schema.sql`
3. Seed: `psql "$DATABASE_URL" -f sql/seed.sql`

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

## 
