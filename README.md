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

Create a **`.env`** at the repo root: (must manually edit and create this)

```sh
# ---- App ----
NODE_ENV=development           # use 'development' or 'production'
PORT=3000

# ---- Clerk ----
CLERK_SECRET_KEY= [add your clerk secret key here ]
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= [ add your clerk publisher key here ]
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/

# ---- Prisma / Postgres ----
# IMPORTANT: 'postgres'  is a Docker service name here (internal DNS), not localhost.
DATABASE_URL=postgresql://myuser:mypassword@postgres:5432/mydb?schema=public&sslmode=disable

# Optional toggles in entrypoint:
PRISMA_SEED_ON_START=true     # to run `prisma db seed` automatically on boot
PRISMA_STUDIO=true            # auto-start Prisma Studio inside the container
PRISMA_STUDIO_PORT=5555       # default 5555 , for viewing schema like excel sheet
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