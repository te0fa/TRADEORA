import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchHybridFundamentals } from '@/lib/data-aggregator';

export async function POST(req: Request) {
  try {
    // Basic auth check for cron jobs if needed
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, symbol');

    if (error || !companies) {
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }

    const results = [];
    for (const company of companies) {
      const fund = await fetchHybridFundamentals(company.symbol);
      if (fund) {
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            pe_ratio: fund.pe_ratio,
            eps: fund.eps,
            market_cap: fund.market_cap,
            dividend_yield: fund.dividend_yield,
            book_value: fund.book_value
          })
          .eq('id', company.id);
        
        if (!updateError) {
          results.push({ symbol: company.symbol, success: true });
        } else {
          results.push({ symbol: company.symbol, success: false, error: updateError.message });
        }
      }
      
      // Sleep to avoid rate limiting from external APIs
      await new Promise(r => setTimeout(r, 1000));
    }

    return NextResponse.json({ success: true, processed: results.length, results });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
