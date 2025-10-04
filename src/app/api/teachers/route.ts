import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: Request) {
  // list teachers, simple pagination support
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page') || '1')
  const limit = Number(url.searchParams.get('limit') || '50')
  const offset = (page - 1) * limit

  const res = await query('SELECT * FROM teacher ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset])
  return NextResponse.json({ data: res.rows })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { username, name, surname, email, phone, address, blood_type, sex, birthday } = body
  const res = await query(
    `INSERT INTO teacher (username,name,surname,email,phone,address,blood_type,sex,birthday)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [username, name, surname, email, phone, address, blood_type, sex, birthday]
  )
  return NextResponse.json({ data: res.rows[0] }, { status: 201 })
}
