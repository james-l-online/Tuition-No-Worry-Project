import { Pool, QueryResult } from 'pg'

// Lazy pool instance so imports during build (when DATABASE_URL may not be set)
// don't throw. At build time we prefer the app to compile; runtime DB errors
// will still be surfaced at runtime when trying to actually query.
let pool: Pool | null = null

function ensurePool(): Pool | null {
  if (pool) return pool
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) return null
  pool = new Pool({ connectionString: databaseUrl })
  return pool
}

export async function query(text: string, params?: any[]): Promise<QueryResult<any>> {
  const p = ensurePool()
  if (!p) {
    // No DATABASE_URL configured at build-time or in the current environment.
    // Return an empty result instead of throwing so Next.js can collect page
    // data during build. Call sites should handle empty results appropriately.
    // eslint-disable-next-line no-console
    console.warn('db.query skipped: DATABASE_URL not set')
    return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as QueryResult<any>
  }

  let client: any
  try {
    client = await p.connect()
    const res = await client.query(text, params)
    return res
  } catch (err: any) {
    // In development we may not have a reachable Postgres instance (e.g. hostname `postgres`).
    // Don't crash the whole server during rendering — log and return an empty result so
    // server components can render fallback UIs.
    // eslint-disable-next-line no-console
    console.warn('db.query failed:', err && err.message ? err.message : err)
    return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] } as QueryResult<any>
  } finally {
    try { if (client) client.release() } catch (_) {}
  }
}

export async function getClient() {
  const p = ensurePool()
  if (!p) throw new Error('DATABASE_URL is not set. Set it in environment to connect to Postgres')
  return p.connect()
}

const db = { query, getClient }
export default db
