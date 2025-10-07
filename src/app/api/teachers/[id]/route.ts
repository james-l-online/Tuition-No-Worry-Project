import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const res = await query('SELECT * FROM teacher WHERE id::text = $1', [id])
  if (res.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: res.rows[0] })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const body = await request.json()
  const fields = [] as string[]
  const values = [] as any[]
  let idx = 1
  for (const key of ['username','name','surname','email','phone','address','blood_type','sex','birthday']) {
    if (key in body) {
      fields.push(`${key} = $${idx}`)
      values.push((body as any)[key])
      idx++
    }
  }
  if (fields.length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 })
  const sql = `UPDATE teacher SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`
  values.push(id)
  const res = await query(sql, values)
  if (res.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: res.rows[0] })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const res = await query('DELETE FROM teacher WHERE id::text = $1 RETURNING *', [id])
  if (res.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: res.rows[0] })
}
