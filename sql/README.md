# SQL seed

This folder contains SQL seeds to populate a local development Postgres database.

Run the seed using the helper Node script (recommended):

```
DATABASE_URL='postgres://user:pass@localhost:5432/db'
node scripts/run-sql-seed.js
```

Or using psql directly:

```
psql "$DATABASE_URL" -f sql/seed.sql
```
Notes:

- The seed is designed to be idempotent (uses INSERT ... WHERE NOT EXISTS or ON CONFLICT where appropriate).
- If your schema uses different table/column names than the generated SQL, update `sql/seed.sql` accordingly.

