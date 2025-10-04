import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const res = await query('SELECT * FROM message ORDER BY created_at DESC')
  return NextResponse.json({ data: res.rows })
}

export async function POST(request: Request) {
  const b = await request.json()
  const res = await query('INSERT INTO message (sender_id,receiver_id,content) VALUES ($1,$2,$3) RETURNING *', [b.sender_id,b.receiver_id,b.content])
  return NextResponse.json({ data: res.rows[0] }, { status: 201 })
}
