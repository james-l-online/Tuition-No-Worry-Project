# To Run as Docker Container

## Prerequisites

- **Docker Desktop** 4.x+ (includes Compose v2)

---

# 1) Register and setup app in Clerk

**Register for [Clerk Account](https://clerk.com/)** 

- Create your first Clerk application.
- only username field is required for this demo, you may self configure others.

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

```
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

## 3) Docker Compose (services)

**`docker-compose.yml`** (already included in repo):

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U myuser -d mydb || pg_isready -U myuser -d postgres || exit 1"]
      interval: 2s
      timeout: 2s
      retries: 15
    environment:
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD: mypassword
      POSTGRES_DB: mydb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - PORT=${PORT:-3000}
      - DATABASE_URL=${DATABASE_URL}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      - PRISMA_SEED_ON_START=${PRISMA_SEED_ON_START:-false}
      - PRISMA_STUDIO=${PRISMA_STUDIO:-false}
      - PRISMA_STUDIO_PORT=${PRISMA_STUDIO_PORT:-5555}
    ports:
      - "3000:3000"
      - "5555:5555"   # meant for Prisma Studio (optional)

volumes:
  postgres_data:
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

## 4) Entrypoint

**`docker/entrypoint.sh`** (already included in repo):

```bash
#!/usr/bin/env sh
set -e

# to check progress and ensure postgres is setup
echo "Waiting for postgres:5432 (TCP)…"
RETRIES=60
until nc -z postgres 5432 >/dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  echo "  not ready, retrying…"
  RETRIES=$((RETRIES-1))
  sleep 2
done
[ $RETRIES -eq 0 ] && { echo "ERROR: PG tcp unreachable"; exit 1; }

# ensure DB exists
echo "Ensuring DB exists (prisma db create)…"
npx prisma db create || true

# ensure migrates in prisma is deployed
echo "Applying migrations (prisma migrate deploy)…"
npx prisma migrate deploy

# ensure prisma seed is used to generate random data for demo
if [ "${PRISMA_SEED_ON_START:-false}" = "true" ]; then
  echo "Seeding (prisma db seed)…"
  npx prisma db seed || true
fi

# start primsa studio to view db schema
if [ "${PRISMA_STUDIO:-false}" = "true" ]; then
  echo "Starting Prisma Studio on ${PRISMA_STUDIO_PORT:-5555}…"
  (npx prisma studio --port "${PRISMA_STUDIO_PORT:-5555}" &) || true
fi

echo "Starting app…"
exec "$@"
```

---

## 5) Dockerfile

**`Dockerfile`** (already included in repo)

multi-stage; generates Prisma client, builds Next, normalizes entrypoint EOLs):

```docker
# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---------- builder ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client at build time
RUN npx prisma generate
# Build Next.js
RUN npm run build

# ---------- runtime ----------
FROM node:22-alpine AS runner
WORKDIR /app

# Copy runtime assets
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
# normalize CRLF and set exec bit
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000
# 5555 is for prisma studio
EXPOSE 5555

ENTRYPOINT ["sh", "/entrypoint.sh"]
CMD ["npm", "start"]
```

## 6) Build & run

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