import { Pool, QueryResult } from 'pg'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Set it in environment to connect to Postgres')
}

const pool = new Pool({ connectionString: databaseUrl })

export async function query(text: string, params?: any[]): Promise<QueryResult<any>> {
  const client = await pool.connect()
  try {
    const res = await client.query(text, params)
    return res
  } finally {
    client.release()
  }
}

const db = { query }
export default db
