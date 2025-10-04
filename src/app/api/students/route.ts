import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page') || '1')
  const limit = Number(url.searchParams.get('limit') || '50')
  const offset = (page - 1) * limit
  const res = await query('SELECT * FROM student ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset])
  return NextResponse.json({ data: res.rows })
}

export async function POST(request: Request) {
  const body = await request.json()
  const res = await query(
    `INSERT INTO student (username,name,surname,email,phone,address,blood_type,sex,parent_id,class_id,grade_id,birthday)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [body.username, body.name, body.surname, body.email, body.phone, body.address, body.blood_type, body.sex, body.parent_id, body.class_id, body.grade_id, body.birthday].slice(0,11)
  )
  return NextResponse.json({ data: res.rows[0] }, { status: 201 })
}
