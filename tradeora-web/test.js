const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\r\n]+)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="?([^"\r\n]+)/);
const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

fetch(`${url}/rest/v1/market_prices?select=company_id,close_price&limit=1`, {
  headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
}).then(r => r.json()).then(data => console.log('PRICES:', data)).catch(e => console.error(e));
