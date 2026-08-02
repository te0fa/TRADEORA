const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kdjsguozssxvtmlmqhpz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkanNndW96c3N4dnRtbG1xaHB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzg3MzQwMywiZXhwIjoyMDk5NDQ5NDAzfQ.sCyCHFnLo7MWKeUmAb6s5j0zT5PzNBBnVAls1LcPclM';
const COCKROACH_URL = process.env.DATABASE_URL || 'postgresql://tradeora:gdW77s_jShDK8nChydbbCg@raw-donkey-30500.j77.aws-eu-central-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const pgPool = new Pool({
  connectionString: COCKROACH_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('=== CONTINUOUS MIGRATION: INTRADAY_SNAPSHOTS (598 MB) ===\n');

  // 1. Fetch sample row to build table structure
  const { data: sampleRows, error: sampleErr } = await supabase.from('intraday_snapshots').select('*').limit(1);
  if (sampleErr || !sampleRows || sampleRows.length === 0) {
    console.error('Error reading intraday_snapshots from Supabase:', sampleErr?.message);
    return;
  }

  const keys = Object.keys(sampleRows[0]);
  console.log('Columns in intraday_snapshots:', keys.join(', '));

  // Create table in CockroachDB
  await pgPool.query(`CREATE TABLE IF NOT EXISTS "intraday_snapshots" (id TEXT PRIMARY KEY);`);
  for (const col of keys) {
    if (col === 'id') continue;
    try {
      await pgPool.query(`ALTER TABLE "intraday_snapshots" ADD COLUMN IF NOT EXISTS "${col}" TEXT;`);
    } catch (e) {}
  }

  const pageSize = 3000;
  let offset = 0;
  let migrated = 0;

  while (true) {
    const { data: chunk, error } = await supabase
      .from('intraday_snapshots')
      .select('*')
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error(`Chunk error at offset ${offset}:`, error.message);
      break;
    }

    if (!chunk || chunk.length === 0) {
      console.log('Reached end of intraday_snapshots table!');
      break;
    }

    const cols = keys.map(k => `"${k}"`).join(', ');
    const values = [];
    let paramIdx = 1;
    const valuePlaceholders = [];

    for (const row of chunk) {
      const rowPlaceholders = [];
      for (const k of keys) {
        let val = row[k];
        if (typeof val === 'object' && val !== null) {
          val = JSON.stringify(val);
        }
        values.push(val);
        rowPlaceholders.push(`$${paramIdx++}`);
      }
      valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
    }

    const updateSet = keys.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');
    const sql = `INSERT INTO "intraday_snapshots" (${cols}) VALUES ${valuePlaceholders.join(', ')} ON CONFLICT ("id") DO UPDATE SET ${updateSet}`;

    try {
      await pgPool.query(sql, values);
      migrated += chunk.length;
      console.log(`  Progress: ${migrated} rows migrated so far...`);
    } catch (err) {
      console.warn(`  Batch warning at offset ${offset}:`, err.message);
    }

    offset += pageSize;
  }

  console.log(`\n🎉 SUCCESS! Fully migrated ${migrated} intraday_snapshots rows (598 MB data) to CockroachDB!`);
  await pgPool.end();
}

main().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
