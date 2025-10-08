const { Client } = require('pg');
(async ()=>{
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query("SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND data_type='uuid' ORDER BY table_name,column_name");
  console.log(JSON.stringify(r.rows,null,2));
  await c.end();
})().catch(e=>{ console.error(e); process.exit(1) });
