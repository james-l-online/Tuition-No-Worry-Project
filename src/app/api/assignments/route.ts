import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const res = await query('SELECT * FROM assignment ORDER BY start_date')
  return NextResponse.json({ data: res.rows })
}

export async function POST(request: Request) {
  const b = await request.json()
  const res = await query('INSERT INTO assignment (title,start_date,due_date,lesson_id) VALUES ($1,$2,$3,$4) RETURNING *', [b.title,b.start_date,b.due_date,b.lesson_id])
  return NextResponse.json({ data: res.rows[0] }, { status: 201 })
}
