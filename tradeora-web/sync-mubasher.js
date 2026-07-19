const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY="?([^"\r\n]+)/) || env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="?([^"\r\n]+)/);
const SUPABASE_URL = urlMatch[1].trim();
const SUPABASE_KEY = keyMatch[1].trim();

async function fetchSupabase(path, options = {}) {
  const url = `${SUPABASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase Error: ${res.status} ${text}`);
  }
  if (options.headers && options.headers['Prefer'] === 'return=minimal') {
    return null;
  }
  return res.json();
}

async function scrapeMubasher(symbol) {
  try {
    const res = await fetch(`https://english.mubasher.info/markets/EGX/stocks/${symbol}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    const priceMatch = html.match(/class="market-summary__last-price[^"]*">\s*([\d.]+)/);
    const changeMatch = html.match(/class="market-summary__change-percentage[^"]*">\s*([-\d.%+]+)/);
    
    if (priceMatch && changeMatch) {
      const price = parseFloat(priceMatch[1]);
      const changeStr = changeMatch[1].replace('%', '');
      const change = parseFloat(changeStr);
      return { symbol, price, change };
    }
  } catch (e) {
    // Fail silently
  }
  return null;
}

async function run() {
  console.log('Fetching companies...');
  const companies = await fetchSupabase('/rest/v1/companies?select=id,symbol');
  console.log(`Found ${companies.length} companies.`);

  const batchSize = 15;
  const results = [];
  
  for (let i = 0; i < companies.length; i += batchSize) {
    const chunk = companies.slice(i, i + batchSize);
    console.log(`Scraping batch ${i / batchSize + 1}/${Math.ceil(companies.length / batchSize)}...`);
    
    const promises = chunk.map(async (company) => {
      const data = await scrapeMubasher(company.symbol);
      if (data) {
        // Back-calculate open_price to match the parsed change percentage
        // change = (price - open) / open * 100
        // change / 100 = price / open - 1
        // price / open = 1 + (change / 100)
        // open = price / (1 + change / 100)
        const changeDecimal = data.change / 100;
        const openPrice = data.price / (1 + changeDecimal);
        
        return {
          company_id: company.id,
          price_date: new Date().toISOString().split('T')[0],
          close_price: data.price,
          open_price: parseFloat(openPrice.toFixed(4)),
          high_price: data.price, // Fallback
          low_price: data.price,  // Fallback
          volume: 0
        };
      }
      return null;
    });
    
    const batchResults = await Promise.all(promises);
    results.push(...batchResults.filter(Boolean));
    
    // Polite delay between batches
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`Successfully scraped ${results.length} stocks. Upserting to Supabase...`);

  if (results.length > 0) {
    await fetchSupabase('/rest/v1/market_prices', {
      method: 'POST',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify(results)
    });
    console.log('Supabase update completed!');
  } else {
    console.log('No data scraped.');
  }
}

run().catch(console.error);
