const { Pool } = require('pg');

const connStr = 'postgresql://tradeora:gdW77s_jShDK8nChydbbCg@raw-donkey-30500.j77.aws-eu-central-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full';

const pool = new Pool({
  connectionString: connStr,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    const res = await pool.query('SELECT NOW(), version();');
    console.log('Successfully connected to CockroachDB!');
    console.log('Server time:', res.rows[0].now);
    console.log('Version:', res.rows[0].version);
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

main();
