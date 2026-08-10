const { Pool } = require('pg');

const COCKROACH_URL = process.env.DATABASE_URL;

async function main() {
  const pool = new Pool({ connectionString: COCKROACH_URL, ssl: { rejectUnauthorized: false } });
  try {
    const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'company_fundamentals'`);
    console.log('Columns in company_fundamentals:', res.rows.map(r => r.column_name));
  } catch (e) {
    console.error(e.message);
  }
  await pool.end();
}

main().catch(console.error);
