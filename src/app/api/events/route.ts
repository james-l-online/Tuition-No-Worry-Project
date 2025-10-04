import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const res = await query('SELECT * FROM event ORDER BY start_time')
  return NextResponse.json({ data: res.rows })
}

export async function POST(request: Request) {
  const b = await request.json()
  const res = await query('INSERT INTO event (title,description,start_time,end_time,class_id) VALUES ($1,$2,$3,$4,$5) RETURNING *', [b.title,b.description,b.start_time,b.end_time,b.class_id])
  return NextResponse.json({ data: res.rows[0] }, { status: 201 })
}
