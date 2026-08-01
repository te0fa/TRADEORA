import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://tradeora:gdW77s_jShDK8nChydbbCg@raw-donkey-30500.j77.aws-eu-central-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full';

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
} else {
  // In development, preserve pool instance across hot reloads
  const globalWithPg = global as typeof globalThis & { _pgPool?: Pool };
  if (!globalWithPg._pgPool) {
    globalWithPg._pgPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  pool = globalWithPg._pgPool;
}

export default pool;
export { pool };
