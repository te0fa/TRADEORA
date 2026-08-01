const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connStr = 'postgresql://tradeora:gdW77s_jShDK8nChydbbCg@raw-donkey-30500.j77.aws-eu-central-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full';

const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false }
});

const sqlFiles = [
  'database/schema.sql',
  'database/migrations/002_add_market_context.sql',
  'database/migrations/003_add_shariah_audit_log.sql',
  'database/migrations/004_create_historical_prices.sql',
  'database/migrations/006_create_signal_stats.sql',
  'database/migrations/007_create_disclosures_and_macro_news.sql',
  'database/migrations/007_create_trades.sql',
  'database/migrations/008_create_settings.sql',
  'database/migrations/009_create_user_trades.sql',
  'database/migrations/010_watchlist_alerts_telegram.sql',
  'database/migrations/012_create_performance_reports.sql',
  'database/migrations/013_create_processed_stripe_events.sql',
  'database/migrations/015_create_company_news.sql',
  'database/migrations/016_create_company_fundamentals.sql',
  'database/migrations/017_create_ml_predictions.sql',
  'setup_intraday_db.sql',
  'supabase/migrations/20260731_trade_alerts.sql',
  'supabase/migrations/20260801_investor_flows.sql'
];

async function main() {
  const root = path.join(__dirname, '..');
  console.log('Starting CockroachDB Schema Initialization...');

  for (const relPath of sqlFiles) {
    const fullPath = path.join(root, relPath);
    if (!fs.existsSync(fullPath)) {
      console.log(`Skipping (not found): ${relPath}`);
      continue;
    }

    console.log(`Executing ${relPath}...`);
    let sql = fs.readFileSync(fullPath, 'utf8');

    // Remove Postgres trigger definitions that might not be plpgsql compatible or replace them
    // CockroachDB supports standard PostgreSQL triggers in v23+, but PL/pgSQL function syntax can vary slightly
    // Replace 'CREATE OR REPLACE FUNCTION ...' triggers if needed
    sql = sql.replace(/CREATE OR REPLACE TRIGGER[\s\S]*?;/gi, '-- trigger omitted');

    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (err) {
        // Ignore "already exists" or trigger syntax warnings
        if (!err.message.includes('already exists') && !err.message.includes('unknown function')) {
          console.warn(`[Warning in ${relPath}]: ${err.message}`);
        }
      }
    }
  }

  // Verify created tables
  const tablesRes = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `);
  
  console.log('\nCreated Tables in CockroachDB:');
  tablesRes.rows.forEach(r => console.log(' - ' + r.table_name));

  await pool.end();
  console.log('\nSchema initialization completed successfully!');
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
