const { Pool } = require('pg');

const COCKROACH_URL = process.env.DATABASE_URL;

async function main() {
  console.log('Adding foreign_ownership_pct and free_float_pct columns to company_fundamentals...');
  const pool = new Pool({ connectionString: COCKROACH_URL, ssl: { rejectUnauthorized: false } });
  try {
    await pool.query(`
      ALTER TABLE company_fundamentals ADD COLUMN IF NOT EXISTS foreign_ownership_pct NUMERIC(5,2) DEFAULT 0.0;
      ALTER TABLE company_fundamentals ADD COLUMN IF NOT EXISTS free_float_pct NUMERIC(5,2) DEFAULT 0.0;
    `);
    console.log('✅ Successfully added foreign_ownership_pct & free_float_pct columns!');
  } catch (e) {
    console.error('Error adding columns:', e.message);
  }
  await pool.end();
}

main().catch(console.error);
