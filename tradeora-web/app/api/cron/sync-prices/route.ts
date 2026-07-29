import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}


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
  // Mubasher provides close price ONLY.
  // OHLCV columns are intentionally null.
  // This source is excluded from signal generation
  // and chart rendering by source priority filters.

  const authHeader = req.headers.get('Authorization');
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSb();
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id, symbol');

    if (compError) throw compError;
    if (!companies || companies.length === 0) {
      return NextResponse.json({ msg: 'No companies to sync' });
    }

    const PRIORITY_SOURCES = [
      'egx_bulletin',
      'tradingview_1d',
      'yahoo_historical',
      'tradingview'
    ];

    const todayDate = new Date().toISOString().split('T')[0];
    const batchSize = 15;
    let updatedCount = 0;
    let insertedCount = 0;
    const recordsToInsert: any[] = [];
    
    for (let i = 0; i < companies.length; i += batchSize) {
      const chunk = companies.slice(i, i + batchSize);
      
      const promises = chunk.map(async (company) => {
        const data = await scrapeMubasher(company.symbol);
        if (!data) return null;

        // Step 1: Check if a record exists for this company for today from a higher priority source
        const { data: existing } = await supabase
          .from('market_prices')
          .select('id, source, close_price')
          .eq('company_id', company.id)
          .eq('price_date', todayDate)
          .in('source', PRIORITY_SOURCES)
          .limit(1)
          .maybeSingle();

        // Step 2: If a record from a better source exists
        if (existing) {
          const currentClose = existing.close_price;
          const diffRatio = currentClose ? Math.abs(data.price - currentClose) / currentClose : 1;

          if (diffRatio > 0.005) {
            await supabase
              .from('market_prices')
              .update({ close_price: data.price })
              .eq('id', existing.id);

            console.log(`[Mubasher] ${company.symbol}: Updated close_price only (preserving ${existing.source} OHLCV)`);
            return { type: 'updated' };
          }
          return { type: 'skipped' };
        } else {
          // Step 3: If no record from a better source exists
          return {
            type: 'insert',
            record: {
              company_id: company.id,
              price_date: todayDate,
              close_price: data.price,
              open_price: null,
              high_price: null,
              low_price: null,
              volume: null,
              source: 'mubasher_close_only'
            }
          };
        }
      });
      
      const batchResults = await Promise.all(promises);
      for (const res of batchResults) {
        if (!res) continue;
        if (res.type === 'updated') updatedCount++;
        else if (res.type === 'insert' && res.record) {
          recordsToInsert.push(res.record);
        }
      }
      
      // Polite delay between batches
      await new Promise(r => setTimeout(r, 200));
    }

    if (recordsToInsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('market_prices')
        .upsert(recordsToInsert, { onConflict: 'company_id,price_date,source' });
        
      if (upsertError) throw upsertError;
      insertedCount = recordsToInsert.length;
    }

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      inserted: insertedCount,
      count: updatedCount + insertedCount
    });

  } catch (err: any) {
    console.error('Cron sync-prices failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

