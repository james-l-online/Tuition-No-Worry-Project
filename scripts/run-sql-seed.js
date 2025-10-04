#!/usr/bin/env node
// scripts/run-sql-seed.js
// Runs sql/seed.sql against DATABASE_URL using node-postgres.

const fs = require('fs');
const { Client } = require('pg');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set. Set it and re-run.');
    process.exit(1);
  }

  const fileToRun = process.argv[2] || 'sql/seed.sql';
  let sql = fs.readFileSync(fileToRun, 'utf8');
  // Remove psql meta-commands (lines beginning with backslash) which are
  // not valid SQL for node-postgres. For example: \echo, \i, etc.
  sql = sql.split(/\r?\n/).filter(line => !/^\s*\\/.test(line)).join('\n');
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
  console.log('Running', fileToRun, '...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ SQL seed finished.');
  } catch (err) {
    console.error('Seed failed:', err && err.message ? err.message : err);
    if (err && err.position && Number(err.position)) {
      const pos = Number(err.position);
      const snippet = sql.slice(Math.max(0, pos - 80), pos + 80);
      console.error('Error near:', snippet.replace(/\n/g, '\\n'));
    }
    try { await client.query('ROLLBACK'); } catch (e) {}
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
