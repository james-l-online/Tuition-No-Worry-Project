## Purpose

This repo is meant to be a devops project showcase, for demonstrating an app that can be containerized, be send to azure ACR and deployed on AKS, with a private flexible postgres server, with provisioning done by Terraform, and deployment via helm charts. The terraform files are located in folder tf-acr for ACR provisiong, tf-aks for AKS provisioning, tf-iam for uami in azure, tf-aks-storage for storage for terraform states, separated from other resouces, tf-postgres for flexible private postgres server. Helm charts are in charts folder. 

Short, targeted instructions to help an AI coding agent become productive in this repository (Tuition No Worry).

Focus on concrete, discoverable patterns, build/deploy commands, and key files to consult when making changes.

---

### Quick start (what humans usually run)

- Local dev: `npm run dev` (starts Next.js in `app/` mode).
- Build and run locally: `npm run build` then `npm start` (honors `PORT` and binds to 0.0.0.0).
- Docker (dev): `docker compose build` then `docker compose up -d` from the repo root (see `docker-compose.yml`).
- SQL seeds (development only):
    - Node helper: `node scripts/run-sql-seed.js sql/seed-full.sql`
    - psql: `psql "$DATABASE_URL" -f sql/seed-full.sql`

Files to inspect for environment and runtime details: `package.json`, `Dockerfile`, `docker/entrypoint.sh`, `.env.example`.

---

### High-level architecture (what to know before editing)

- Frontend / app: Next.js (app router) under `src/app/` and React components in `src/components/`.
- Auth: Clerk is used for auth; app is wrapped with `ClerkProvider` in `src/app/layout.tsx`.
- Middleware: `src/middleware.ts` implements authentication and role-based route protection via `routeAccessMap` (see `src/lib/settings`) and `validateReturnTo` (see `src/lib/auth`).
- Database: Postgres. The repo uses plain SQL migrations and seeds in `sql/` (Prisma usage was deprecated). The runtime DB helper lives at `src/lib/db.ts`; `src/lib/prisma.ts` exists but is intentionally disabled for production.
- Infrastructure: Terraform manifests are in `tf-*` folders (`tf-acr`, `tf-aks`, `tf-postgres`, etc.). Helm chart is in `charts/tuition-no-worry/`.

Important files to review when modifying behavior: `sql/schema.sql`, `sql/seed-full.sql`, `scripts/run-sql-seed.js`, and `src/lib/db.ts`.

---

### CI / CD / Deployment notes

- There is an example (commented) GitHub Actions workflow at `.github/workflows/ci-deploy-acr-aks.yml` that demonstrates: build -> push to ACR -> deploy to AKS. It uses Azure/ACR/AKS steps and OIDC/secret patterns — review and replace secrets before use.
- The `Dockerfile` is multi-stage: `deps`, `builder`, and `runner`. Key points:
    - `npm ci` is run in the deps stage; build happens in `builder` with `npm run build`.
    - `npm prune --production` is used to shrink `node_modules` for the runtime image.
    - The image runs as the `node` user (non-root) and includes a `HEALTHCHECK` that probes `/`.

---

### Conventions & gotchas specific to this repo

- Security: Do NOT commit credentials. Use `.env` (see `.env.example`) and repository secrets for CI.
- SQL seed: `sql/seed-full.sql` contains irreversible ALTERs intended for dev only — do not run against production.
- Middleware behavior: API/fetch requests return JSON 401 (not redirects) when unauthenticated — follow that pattern in new API endpoints.
- File ownership: the Docker image expects non-root file ownership; `docker/entrypoint.sh` contains optional chown logic and safeguards for Windows line endings.
- Auth metadata: Clerk stores `role` in `public_metadata` and middleware reads `sessionClaims.publicMetadata.role` — rely on that when implementing role checks.

---

### Where to look for examples when implementing features

- Protected route & role checks: `src/middleware.ts` and `src/lib/settings.ts` (routeAccessMap).
- App layout and global providers: `src/app/layout.tsx` (Clerk, ToastContainer, global styles).
- API patterns: `src/app/api/*` (basic CRUD conventions are being added there).
- UI components: `src/components/` (follow existing naming/props conventions).
- DB access: `src/lib/db.ts` (use the helper instead of introducing new ORM code).

---

### Helpful search terms for an agent

- "routeAccessMap", "validateReturnTo", "run-sql-seed", "sql/seed-full.sql", "Dockerfile", "HEALTHCHECK", "ClerkProvider".

---

If any of the environment assumptions are incorrect or you want more detail about CI, deployment manifests (Helm values), or the database helper API surface, tell me what to expand and I will update this file.