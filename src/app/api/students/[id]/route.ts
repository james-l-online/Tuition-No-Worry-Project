import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const res = await query('SELECT * FROM student WHERE id::text = $1', [params.id])
  if (res.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: res.rows[0] })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const allowed = ['username','name','surname','email','phone','address','blood_type','sex','parent_id','class_id','grade_id','birthday']
  const fields: string[] = []
  const vals: any[] = []
  let idx = 1
  for (const k of allowed) if (k in body) { fields.push(`${k}=$${idx}`); vals.push((body as any)[k]); idx++ }
  if (fields.length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 })
  vals.push(params.id)
  const res = await query(`UPDATE student SET ${fields.join(', ')} WHERE id=$${idx} RETURNING *`, vals)
  if (res.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: res.rows[0] })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const res = await query('DELETE FROM student WHERE id=$1 RETURNING *', [params.id])
  if (res.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: res.rows[0] })
}
