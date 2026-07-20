import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function scrapeMubasher(symbol: string) {
  try {
    const res = await fetch(`https://english.mubasher.info/markets/EGX/stocks/${symbol}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      },
      next: { revalidate: 0 } // Bypass Next.js cache
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

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: companies, error: compError } = await sb
      .from('companies')
      .select('id, symbol');

    if (compError) throw compError;
    if (!companies || companies.length === 0) {
      return NextResponse.json({ msg: 'No companies to sync' });
    }

    const batchSize = 15;
    const results: any[] = [];
    
    for (let i = 0; i < companies.length; i += batchSize) {
      const chunk = companies.slice(i, i + batchSize);
      
      const promises = chunk.map(async (company) => {
        const data = await scrapeMubasher(company.symbol);
        if (data) {
          const changeDecimal = data.change / 100;
          const openPrice = data.price / (1 + changeDecimal);
          
          return {
            company_id: company.id,
            price_date: new Date().toISOString().split('T')[0],
            close_price: data.price,
            open_price: parseFloat(openPrice.toFixed(4)),
            high_price: data.price,
            low_price: data.price,
            volume: 0,
            source: 'mubasher'
          };
        }
        return null;
      });
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults.filter(Boolean));
      
      // Polite delay between batches
      await new Promise(r => setTimeout(r, 200));
    }

    if (results.length > 0) {
      const { error: upsertError } = await sb
        .from('market_prices')
        .insert(results); // Standard insert appends new rows for today
        
      if (upsertError) throw upsertError;
      return NextResponse.json({ success: true, count: results.length });
    } else {
      return NextResponse.json({ success: true, count: 0, msg: 'No data scraped' });
    }
  } catch (err: any) {
    console.error('Cron sync-prices failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
