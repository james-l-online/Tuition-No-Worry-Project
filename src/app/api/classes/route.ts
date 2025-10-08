import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const res = await query('SELECT * FROM class ORDER BY name')
  return NextResponse.json({ data: res.rows })
}

export async function POST(request: Request) {
  const body = await request.json()
  const res = await query('INSERT INTO class (name,capacity,supervisor_id,grade_id) VALUES ($1,$2,$3,$4) RETURNING *', [body.name, body.capacity, body.supervisor_id, body.grade_id])
  return NextResponse.json({ data: res.rows[0] }, { status: 201 })
}
