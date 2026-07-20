const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY="?([^"\r\n]+)/) || env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="?([^"\r\n]+)/);
const SUPABASE_URL = urlMatch[1].trim();
const SUPABASE_KEY = keyMatch[1].trim();

fetch(`${SUPABASE_URL}/rest/v1/market_prices?source=is.null`, {
  method: 'PATCH',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify({ source: 'mubasher' })
})
.then(r => r.json())
.then(data => {
  console.log('Fixed source=null rows count:', data.length);
})
.catch(console.error);
