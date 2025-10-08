import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const res = await query('SELECT * FROM announcement ORDER BY date DESC')
  return NextResponse.json({ data: res.rows })
}

export async function POST(request: Request) {
  const b = await request.json()
  const res = await query('INSERT INTO announcement (title,description,date,class_id) VALUES ($1,$2,$3,$4) RETURNING *', [b.title,b.description,b.date,b.class_id])
  return NextResponse.json({ data: res.rows[0] }, { status: 201 })
}
