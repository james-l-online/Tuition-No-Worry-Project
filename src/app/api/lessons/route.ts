import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const res = await query('SELECT * FROM lesson ORDER BY start_time')
  return NextResponse.json({ data: res.rows })
}

export async function POST(request: Request) {
  const b = await request.json()
  const res = await query('INSERT INTO lesson (name,day,start_time,end_time,subject_id,class_id,teacher_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [b.name,b.day,b.start_time,b.end_time,b.subject_id,b.class_id,b.teacher_id])
  return NextResponse.json({ data: res.rows[0] }, { status: 201 })
}
