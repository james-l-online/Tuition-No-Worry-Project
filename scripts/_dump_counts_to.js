const fs = require('fs');
const { Client } = require('pg');

async function main(){
  const outFile = process.argv[2] || 'sql/backup_counts.json';
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const tables = ['teacher','parent','student','lesson','result','attendance','message','subject_teacher'];
  const out = {};
  for (const t of tables) {
    try {
      const r = await c.query(`SELECT count(*)::int AS c FROM ${t}`);
      out[t] = r.rows[0].c;
    } catch (e) {
      out[t] = 'ERROR: ' + e.message;
    }
  }
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
  console.log('wrote', outFile);
  await c.end();
}

main().catch(e=>{ console.error(e); process.exit(1) });
