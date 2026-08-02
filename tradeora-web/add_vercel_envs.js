const { execSync } = require('child_process');

const envs = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://kdjsguozssxvtmlmqhpz.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkanNndW96c3N4dnRtbG1xaHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NzM0MDMsImV4cCI6MjA5OTQ0OTQwM30.kTSTIVQedOCupcjwidSOca4_m4s6Qp2Wh5t1Zi7_Wmg',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkanNndW96c3N4dnRtbG1xaHB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzg3MzQwMywiZXhwIjoyMDk5NDQ5NDAzfQ.sCyCHFnLo7MWKeUmAb6s5j0zT5PzNBBnVAls1LcPclM',
  SUPABASE_URL: 'https://kdjsguozssxvtmlmqhpz.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkanNndW96c3N4dnRtbG1xaHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NzM0MDMsImV4cCI6MjA5OTQ0OTQwM30.kTSTIVQedOCupcjwidSOca4_m4s6Qp2Wh5t1Zi7_Wmg',
  DATABASE_URL: 'postgresql://tradeora:gdW77s_jShDK8nChydbbCg@raw-donkey-30500.j77.aws-eu-central-1.cockroachlabs.cloud:26257/defaultdb?sslmode=require'
};

for (const [key, val] of Object.entries(envs)) {
  for (const envType of ['production', 'preview', 'development']) {
    try {
      console.log(`Adding ${key} to ${envType}...`);
      execSync(`npx vercel env add ${key} ${envType}`, {
        input: val + '\n',
        stdio: ['pipe', 'inherit', 'inherit']
      });
    } catch (e) {
      console.log(`Skipped or already exists: ${key}`);
    }
  }
}

console.log('✅ All environment variables pushed to Vercel!');
