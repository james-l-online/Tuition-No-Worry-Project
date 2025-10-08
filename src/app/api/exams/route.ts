import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const res = await query('SELECT * FROM exam ORDER BY start_time')
  return NextResponse.json({ data: res.rows })
}

export async function POST(request: Request) {
  const b = await request.json()
  const res = await query('INSERT INTO exam (title,start_time,end_time,lesson_id) VALUES ($1,$2,$3,$4) RETURNING *', [b.title,b.start_time,b.end_time,b.lesson_id])
  return NextResponse.json({ data: res.rows[0] }, { status: 201 })
}
