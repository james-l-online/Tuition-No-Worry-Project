import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const res = await query('SELECT * FROM subject ORDER BY name')
  return NextResponse.json({ data: res.rows })
}

export async function POST(request: Request) {
  const body = await request.json()
  const res = await query('INSERT INTO subject (name) VALUES ($1) RETURNING *', [body.name])
  return NextResponse.json({ data: res.rows[0] }, { status: 201 })
}
