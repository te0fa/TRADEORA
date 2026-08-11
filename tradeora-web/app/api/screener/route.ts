import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { normalizeEgxSector, isSmeStock } from '@/lib/egx-sectors';
import { fetchCanonicalLatestPrices } from '@/lib/canonical-price';

export const dynamic = 'force-dynamic';

// Statistical sample threshold: at least 30 closed trades required to display win rate
const MIN_SAMPLE_SIZE_THRESHOLD = 30;

export async function GET() {
  try {
    const sb = supabase;
    // 1. Fetch all active companies
    const { data: companies, error: compError } = await sb
      .from('companies')
      .select('id, symbol, name_ar, name_en, sector, is_shariah_compliant')
      .order('symbol');

    if (compError) throw compError;
    const ids = companies.map((c: any) => c.id);

    // 2. Fetch authoritative canonical latest prices with fallback query
    const canonicalPriceMap = await fetchCanonicalLatestPrices(sb, ids);
    const priceMap: Record<string, any> = {};
    for (const [cid, p] of canonicalPriceMap.entries()) {
      priceMap[cid] = p;
    }

    // Direct fallback for missing price map entries
    const missingIds = ids.filter((id: string) => !priceMap[id]);
    if (missingIds.length > 0) {
      const { data: fallbackPrices } = await sb
        .from('market_prices')
        .select('company_id, close_price, open_price, volume, change_percent, price_date')
        .in('company_id', missingIds)
        .order('price_date', { ascending: false })
        .limit(1000);

      (fallbackPrices || []).forEach((p: any) => {
        if (!priceMap[p.company_id] && p.close_price > 0) {
          priceMap[p.company_id] = p;
        }
      });
    }

    // 3. Fetch active high-conviction ML trades
    const { data: activeTrades } = await sb
      .from('recommended_trades')
      .select('company_id, direction, ml_probability')
      .eq('status', 'active');

    const tradeMap: Record<string, any> = {};
    for (const t of activeTrades ?? []) {
      tradeMap[t.company_id] = t;
    }

    // 4. Fetch historical closed trades to calculate real statistical win rate
    const { data: closedTrades } = await sb
      .from('recommended_trades')
      .select('company_id, pnl_percent')
      .eq('status', 'closed')
      .not('pnl_percent', 'is', null);

    const statsMap: Record<string, { total: number; wins: number }> = {};
    for (const ct of closedTrades ?? []) {
      if (!statsMap[ct.company_id]) {
        statsMap[ct.company_id] = { total: 0, wins: 0 };
      }
      statsMap[ct.company_id].total += 1;
      if (Number(ct.pnl_percent) > 0) {
        statsMap[ct.company_id].wins += 1;
      }
    }

    // 5. Combine data with strict truthfulness & statistical significance checks
    const result = companies
      .map((c: any) => {
        const p = priceMap[c.id];
        if (!p) return null;

        const rawChange = p.change_percent ?? 0;
        const change = rawChange !== 0 ? rawChange : (p.open_price > 0 ? parseFloat((((p.close_price - p.open_price) / p.open_price) * 100).toFixed(2)) : 0);
        const activeTrade = tradeMap[c.id];

        let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
        let signalType: 'price_momentum_rule' | 'ml_model_v6' = 'price_momentum_rule';

        // Signal Classification: clearly distinguish price momentum vs verified ML model signal
        if (activeTrade && (activeTrade.ml_probability ?? 0) >= 0.82) {
          signal = activeTrade.direction === 'sell' ? 'sell' : 'buy';
          signalType = 'ml_model_v6';
        } else if (change >= 2.2) {
          signal = 'buy';
          signalType = 'price_momentum_rule';
        } else if (change <= -2.2) {
          signal = 'sell';
          signalType = 'price_momentum_rule';
        } else if (change > 0.5) {
          signal = 'buy';
          signalType = 'price_momentum_rule';
        } else if (change < -0.5) {
          signal = 'sell';
          signalType = 'price_momentum_rule';
        } else {
          signal = 'neutral';
          signalType = 'price_momentum_rule';
        }

        // Statistical Win Rate Resolution (Strictly null if sample size < MIN_SAMPLE_SIZE_THRESHOLD)
        const compStats = statsMap[c.id] || { total: 0, wins: 0 };
        const isSignificant = compStats.total >= MIN_SAMPLE_SIZE_THRESHOLD;
        const winRate = isSignificant 
          ? Number(((compStats.wins / compStats.total) * 100).toFixed(1)) 
          : null;

        return {
          id:                           c.id,
          symbol:                       c.symbol,
          name_ar:                      c.name_ar,
          name_en:                      c.name_en,
          sector:                       normalizeEgxSector(c.sector),
          is_sme:                       isSmeStock(c),
          is_shariah_compliant:         Boolean(c.is_shariah_compliant),
          price:                        p.close_price,
          change:                       change,
          volume:                       p.volume,
          date:                         p.price_date,
          signal:                       signal,
          signal_type:                  signalType,
          signal_source_ar:             signalType === 'ml_model_v6' ? 'نموذج الذكاء الاصطناعي (v6)' : 'تغير وحركة السعر اللحظية (Price Momentum)',
          win_rate:                     winRate,
          sample_size:                  compStats.total,
          min_sample_threshold:         MIN_SAMPLE_SIZE_THRESHOLD,
          is_statistically_significant: isSignificant,
          signals_count:                activeTrade ? 1 : 0,
        };
      })
      .filter(Boolean);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/screener:', error);
    return NextResponse.json({ error: error.message || String(error), details: error.stack }, { status: 500 });
  }
}
