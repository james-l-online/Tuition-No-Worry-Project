import React from 'react'
import db from '../../../lib/db'

export default async function Page() {
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">DB Inspector</h2>
        <p className="text-sm text-gray-600">This page is only available in development.</p>
      </div>
    )
  }

  const tables = [
    'teacher','parent','student','class','lesson','exam','assignment','result','attendance','message','subject','subject_teacher','announcement','event'
  ]

  const countsPromises = tables.map(async (t) => {
    try {
      const res = await db.query(`SELECT count(*)::int AS c FROM ${t}`)
      return { table: t, count: res.rows[0].c }
    } catch (e) {
      return { table: t, error: String(e) }
    }
  })

  const rowsPromises = tables.map(async (t) => {
    try {
      const res = await db.query(`SELECT * FROM ${t} ORDER BY 1 LIMIT 5`)
      return { table: t, rows: res.rows }
    } catch (e) {
      return { table: t, rows: [], error: String(e) }
    }
  })

  const counts = await Promise.all(countsPromises)
  const samples = await Promise.all(rowsPromises)

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Development DB Inspector</h2>
      <p className="text-sm text-gray-600 mb-6">Showing counts and up to 5 sample rows for common tables.</p>

      <div className="space-y-6">
        {counts.map((c) => (
          <div key={c.table} className="border rounded p-4">
            <h3 className="font-medium">{c.table} — {c.count ?? 'error'}</h3>
            <pre className="mt-2 text-xs bg-gray-100 p-2 overflow-auto">
              {JSON.stringify(samples.find(s => s.table === c.table)?.rows || samples.find(s => s.table === c.table)?.error || [], null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}
