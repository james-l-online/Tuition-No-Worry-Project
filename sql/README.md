# SQL schema and seed files

Contains the Postgres schema and an idempotent development seed.

Recommended: use the helper script so large files are streamed to psql:

```bash
DATABASE_URL='postgres://user:pass@localhost:5432/db' node scripts/run-sql-seed.js
```

Alternatively, run directly with psql:

```bash
psql "$DATABASE_URL" -f sql/seed-full.sql
```

Warning: Review `sql/seed-full.sql` before running against non-dev databases.

