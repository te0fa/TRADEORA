const { Pool } = require('pg');

const COCKROACH_URL = process.env.DATABASE_URL || 'postgresql://tradeora:gdW77s_jShDK8nChydbbCg@raw-donkey-30500.j77.aws-eu-central-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full';
const pool = new Pool({ connectionString: COCKROACH_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  const res = await pool.query(`SELECT count(*), features_snapshot->>'model_version' as ver FROM recommended_trades WHERE status='active' GROUP BY features_snapshot->>'model_version'`);
  console.log('Active recommendations by model version:', res.rows);
  await pool.end();
}

main().catch(console.error);
