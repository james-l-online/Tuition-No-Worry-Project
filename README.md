# To Run as Docker Container

## Prerequisites

- **Docker Desktop** 4.x+ (includes Compose v2)

---

# 1) Register and setup app in Clerk

**Register for [Clerk Account](https://clerk.com/)**

- **Docker Compose example**

Replace values with your own in a local `.env` (do not commit secrets). Example placeholder:

```
DATABASE_URL=postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@postgres:5432/<POSTGRES_DB>?schema=public&sslmode=disable
```

---

## **Create Test Users in Clerk**

- Go to "Users" in Clerk dashboard.
- Create users for each role: `parent`, `teacher`, `student`, `admin`
- In each user, go into Profile.
   Scroll down to Metadata, then edit Public
- Set `public_metadata` for each user:

```yaml
{
"role": "parent"
}
```

- save and repeat for each role

---

## **Configure Clerk Session Claims**

- Go to Clerk dashboard → Configure → Session Management → Customize session token
- Add under Claims:
- repeat for all 4 roles created.

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
DATABASE_URL=postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@postgres:5432/<POSTGRES_DB>

# Clerk (auth) keys - add your own in .env
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

# Prisma options
PRISMA_SEED_ON_START=false
PRISMA_STUDIO=false
PRISMA_STUDIO_PORT=5555

# If you need the container to chown mounted files on startup (development only)
# CHOWN_ON_STARTUP=false
```

---

## Docker dev note: file ownership (important)

This project runs the app as a non-root container user (UID 1000). If you develop with bind mounts,
you should make the host project files owned by UID 1000 so the container user can read/write them.
See `docker/README.md` for full platform-specific commands. Quick copy/paste examples:

- Linux / macOS / WSL:
   sudo chown -R 1000:1000 .
   docker compose up --build
- Windows (no WSL): prefer building and running the image without bind mounts, or use WSL to chown files.

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

login with your created clerk accounts earlier

---

## 