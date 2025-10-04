This folder contains the archived Prisma artifacts that were removed from the runtime.

Why archived:
- Prisma runtime has been removed from this project in favor of a SQL-first runtime using `pg` and raw SQL seeds.
- These files are kept only for historical reference and to allow restoring schema/migration history if needed.

Files included:
- migrations/ (original Prisma migrations folder)
- schema - Copy.prisma
- schema.prisma
- seed.js
- seed.ts

DO NOT RUN these files in production. If you need to restore Prisma, re-add Prisma dependencies and verify compatibility.
