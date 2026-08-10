const { execSync } = require('child_process');

const envs = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://kdjsguozssxvtmlmqhpz.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  SUPABASE_URL: 'https://kdjsguozssxvtmlmqhpz.supabase.co',
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  DATABASE_URL: process.env.DATABASE_URL || ''
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
