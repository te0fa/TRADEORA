const { Pool } = require('pg');

const connStr = process.env.DATABASE_URL || 'postgresql://tradeora:gdW77s_jShDK8nChydbbCg@raw-donkey-30500.j77.aws-eu-central-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full';

const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const today = '2026-08-01';
  console.log(`Checking market_prices for today (${today})...`);

  const res = await pool.query(`SELECT * FROM market_prices WHERE price_date = $1 LIMIT 10`, [today]);
  console.log(`Found ${res.rows.length} rows for price_date = ${today}`);
  if (res.rows.length > 0) {
    console.log('Sample row:', res.rows[0]);
  }

  const res2 = await pool.query(`SELECT * FROM intraday_snapshots WHERE snapshot_time LIKE $1 LIMIT 10`, [`${today}%`]);
  console.log(`Found ${res2.rows.length} rows in intraday_snapshots for ${today}`);

  await pool.end();
}

main().catch(console.error);
