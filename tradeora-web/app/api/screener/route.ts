import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { normalizeEgxSector, isSmeStock } from '@/lib/egx-sectors';
import { fetchCanonicalLatestPrices } from '@/lib/canonical-price';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MIN_SAMPLE_SIZE_THRESHOLD = 30;

export async function GET() {
  try {
    const priceMap: Record<string, any> = {};

    // 1. Primary DB Query: CockroachDB / PostgreSQL Pool for authoritative prices & change_percent
    if (process.env.DATABASE_URL) {
      try {
        const { rows } = await pool.query(`
          WITH canonical AS (
            SELECT DISTINCT ON (c.id) 
              c.id as company_id, c.symbol, c.name_ar, c.name_en, c.sector, c.is_shariah_compliant,
              mp.close_price, mp.open_price, mp.volume, mp.price_date,
              COALESCE(mp.change_percent, CASE WHEN mp.open_price > 0 THEN ((mp.close_price - mp.open_price)/mp.open_price)*100 ELSE 0 END) as change_percent
            FROM companies c
            JOIN market_prices mp ON c.id = mp.company_id
            WHERE mp.close_price > 0
            ORDER BY c.id, mp.price_date DESC
          )
          SELECT * FROM canonical;
        `);

        (rows || []).forEach((r: any) => {
          priceMap[r.company_id] = {
            company_id: r.company_id,
            close_price: parseFloat(r.close_price || '0'),
            open_price: parseFloat(r.open_price || '0'),
            volume: parseFloat(r.volume || '0'),
            change_percent: parseFloat(r.change_percent || '0'),
            price_date: r.price_date
          };
        });
      } catch (dbErr) {
        console.error('CockroachDB query in screener route error:', dbErr);
      }
    }

    // 2. Fetch all active companies from Supabase
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id, symbol, name_ar, name_en, sector, is_shariah_compliant')
      .order('symbol');

    if (compError) throw compError;
    const ids = companies.map((c: any) => c.id);

    // If CockroachDB didn't populate priceMap, fallback to Supabase canonical price engine
    if (Object.keys(priceMap).length === 0) {
      const canonicalPriceMap = await fetchCanonicalLatestPrices(supabase, ids);
      for (const [cid, p] of canonicalPriceMap.entries()) {
        priceMap[cid] = p;
      }
    }

    // 3. Fetch active high-conviction ML trades
    const { data: activeTrades } = await supabase
      .from('recommended_trades')
      .select('company_id, direction, ml_probability')
      .eq('status', 'active');

    const tradeMap: Record<string, any> = {};
    for (const t of activeTrades ?? []) {
      tradeMap[t.company_id] = t;
    }

    // 4. Fetch historical closed trades to calculate real statistical win rate
    const { data: closedTrades } = await supabase
      .from('recommended_trades')
      .select('company_id, pnl_percent')
      .eq('status', 'closed');

    const statsMap: Record<string, { total: number; wins: number }> = {};
    for (const ct of closedTrades ?? []) {
      if (ct.pnl_percent != null) {
        if (!statsMap[ct.company_id]) {
          statsMap[ct.company_id] = { total: 0, wins: 0 };
        }
        statsMap[ct.company_id].total += 1;
        if (Number(ct.pnl_percent) > 0) {
          statsMap[ct.company_id].wins += 1;
        }
      }
    }

    // 5. Combine data with strict truthfulness & statistical significance checks
    const result = companies
      .map((c: any) => {
        const p = priceMap[c.id];
        if (!p) return null;

        const change = p.change_percent != null ? Number(p.change_percent) : 0;
        const activeTrade = tradeMap[c.id];

        let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
        let signalType: 'price_momentum_rule' | 'ml_model_v6' = 'price_momentum_rule';

        if (activeTrade && (activeTrade.ml_probability ?? 0) >= 0.82) {
          signal = activeTrade.direction === 'sell' ? 'sell' : 'buy';
          signalType = 'ml_model_v6';
        } else if (change > 0) {
          signal = 'buy';
          signalType = 'price_momentum_rule';
        } else if (change < 0) {
          signal = 'sell';
          signalType = 'price_momentum_rule';
        } else {
          signal = 'neutral';
          signalType = 'price_momentum_rule';
        }

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
          change:                       Number(change.toFixed(2)),
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
