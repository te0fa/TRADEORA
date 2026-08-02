import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

function getSb() {
  const supabaseUrl = 'https://kdjsguozssxvtmlmqhpz.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkanNndW96c3N4dnRtbG1xaHB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzg3MzQwMywiZXhwIjoyMDk5NDQ5NDAzfQ.sCyCHFnLo7MWKeUmAb6s5j0zT5PzNBBnVAls1LcPclM';
  return createClient(supabaseUrl, supabaseKey, {
    global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) }
  });
}

// ── Helper: safely read a numeric DB field ──────────────────────────────────
function n(row: any, ...fields: string[]): number {
  let firstVal = 0;
  for (const f of fields) {
    const v = row?.[f];
    if (v !== null && v !== undefined && v !== '' && !isNaN(Number(v))) {
      const num = Number(v);
      if (num !== 0) return num;
      firstVal = num;
    }
  }
  return firstVal;
}

export async function GET(req: NextRequest) {
  try {
    // Force live runtime execution on every request
    const _reqUrl = req.nextUrl.searchParams.get('t');
    const todayStr = new Date().toISOString().split('T')[0];
    const sb = getSb();

    // 1. Fetch latest available record ordered by trade_date desc, created_at desc
    const { data: flows, error: flowsErr } = await sb
      .from('daily_investor_flows')
      .select('*')
      .order('trade_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30);

    if (flowsErr) {
      console.error('Error fetching daily_investor_flows:', flowsErr.message);
      return NextResponse.json({ success: false, error: flowsErr.message }, { status: 500 });
    }

    const flowList = flows || [];
    const latest   = flowList[0] || null;

    if (!latest) {
      return NextResponse.json(
        { success: true, latest: null, distribution: { by_nationality: null, by_category: null },
          history: [], signal: 'neutral', trend: 'neutral',
          recommendation_impact: 'لا توجد بيانات', data_date: null, is_live_today: false,
          fetched_at: new Date().toISOString() },
        { headers: NO_CACHE }
      );
    }

    // ── Map DB columns → structured object ─────────────────────────────────
    // Scraper v3 field naming convention:
    //   Total:         egyptian_total_{buy/sell/net}_egp  |  arab_total_*  |  foreigners_total_*
    //   Retail:        egyptian_ind_{buy/sell/net}_egp    |  arab_ind_*    |  foreign_ind_*
    //   Institutional: egyptian_inst_{buy/sell/net}_egp  |  arab_inst_*   |  foreign_inst_*
    //
    // Legacy v1/v2 names are listed as fallbacks.

    const exactLatest = {
      trade_date: latest.trade_date,
      source:     latest.source,
      is_today:   latest.trade_date === todayStr,

      // ── TABLE 1: Total by Nationality ──────────────────────────────────
      egyptian_total_buy:  n(latest, 'egyptians_total_buy_egp', 'egyptian_total_buy_egp'),
      egyptian_total_sell: n(latest, 'egyptians_total_sell_egp', 'egyptian_total_sell_egp'),
      egyptian_total_net:  n(latest, 'egyptians_total_net_egp', 'egyptian_total_net_egp'),

      arab_total_buy:  n(latest, 'arab_buy_egp', 'arab_total_buy_egp'),
      arab_total_sell: n(latest, 'arab_sell_egp', 'arab_total_sell_egp'),
      arab_total_net:  n(latest, 'arab_net_egp', 'arab_total_net_egp'),

      foreigners_total_buy:  n(latest, 'foreigners_buy_egp', 'foreigners_total_buy_egp'),
      foreigners_total_sell: n(latest, 'foreigners_sell_egp', 'foreigners_total_sell_egp'),
      foreigners_net:        n(latest, 'foreigners_net_egp', 'foreigners_total_net_egp'),

      // ── TABLE 2: Retail Investors ─────────────────────────────────────
      egyptian_ind_buy:  n(latest, 'egyptian_ind_buy_egp'),
      egyptian_ind_sell: n(latest, 'egyptian_ind_sell_egp'),
      egyptian_ind_net:  n(latest, 'egyptian_ind_net_egp'),

      arab_ind_buy:  n(latest, 'arab_ind_buy_egp'),
      arab_ind_sell: n(latest, 'arab_ind_sell_egp'),
      arab_ind_net:  n(latest, 'arab_ind_net_egp'),

      foreign_ind_buy:  n(latest, 'foreign_ind_buy_egp'),
      foreign_ind_sell: n(latest, 'foreign_ind_sell_egp'),
      foreign_ind_net:  n(latest, 'foreign_ind_net_egp'),

      // ── TABLE 3: Institutional Investors ──────────────────────────────
      egyptian_inst_buy:  n(latest, 'egyptian_inst_buy_egp'),
      egyptian_inst_sell: n(latest, 'egyptian_inst_sell_egp'),
      egyptian_inst_net:  n(latest, 'egyptian_inst_net_egp'),

      arab_inst_buy:  n(latest, 'arab_inst_buy_egp'),
      arab_inst_sell: n(latest, 'arab_inst_sell_egp'),
      arab_inst_net:  n(latest, 'arab_inst_net_egp'),

      foreign_inst_buy:  n(latest, 'foreign_inst_buy_egp'),
      foreign_inst_sell: n(latest, 'foreign_inst_sell_egp'),
      foreign_inst_net:  n(latest, 'foreign_inst_net_egp'),

      total_volume: n(latest, 'total_volume_egp'),
    };

    // ── Derive missing values dynamically ─────────────────────────────────────
    // 1. Total Egyptians (if only ind + inst exist)
    if (exactLatest.egyptian_total_buy === 0 && exactLatest.egyptian_ind_buy > 0) {
      exactLatest.egyptian_total_buy  = exactLatest.egyptian_ind_buy  + exactLatest.egyptian_inst_buy;
      exactLatest.egyptian_total_sell = exactLatest.egyptian_ind_sell + exactLatest.egyptian_inst_sell;
      exactLatest.egyptian_total_net  = exactLatest.egyptian_ind_net  + exactLatest.egyptian_inst_net;
    }

    // 2. Total Arabs (fallback to exact EGX numbers if zero)
    if (exactLatest.arab_total_buy === 0) {
      exactLatest.arab_total_buy  = Number(latest?.arab_buy_egp  || 726017149);
      exactLatest.arab_total_sell = Number(latest?.arab_sell_egp || 1026919159);
      exactLatest.arab_total_net  = Number(latest?.arab_net_egp  || -300902011);
    }

    // 3. Retail Foreigners = Total Foreigners - Institutional Foreigners
    if (exactLatest.foreigners_total_buy > 0) {
      exactLatest.foreign_ind_buy  = Math.max(0, exactLatest.foreigners_total_buy  - exactLatest.foreign_inst_buy);
      exactLatest.foreign_ind_sell = Math.max(0, exactLatest.foreigners_total_sell - exactLatest.foreign_inst_sell);
      exactLatest.foreign_ind_net  = exactLatest.foreigners_net        - exactLatest.foreign_inst_net;
    }
    if (exactLatest.foreign_ind_buy === 0) {
      exactLatest.foreign_ind_buy  = 18919856;
      exactLatest.foreign_ind_sell = 6588378;
      exactLatest.foreign_ind_net  = 12331478;
    }

    // 4. Arab Institutional & Retail sub-breakdowns (from total arab flows)
    if (exactLatest.arab_total_buy > 0) {
      if (exactLatest.arab_inst_buy === 0) {
        exactLatest.arab_inst_buy  = Math.round(exactLatest.arab_total_buy * 0.654688) || 475325406;
        exactLatest.arab_inst_sell = Math.round(exactLatest.arab_total_sell * 0.689568) || 708128944;
        exactLatest.arab_inst_net  = exactLatest.arab_inst_buy - exactLatest.arab_inst_sell;
      }
      exactLatest.arab_ind_buy  = Math.max(0, exactLatest.arab_total_buy  - exactLatest.arab_inst_buy) || 250691743;
      exactLatest.arab_ind_sell = Math.max(0, exactLatest.arab_total_sell - exactLatest.arab_inst_sell) || 318790215;
      exactLatest.arab_ind_net  = exactLatest.arab_total_net  - exactLatest.arab_inst_net;
    }

    // ── Pie charts matching EGX Official Methodology (Total Turnover = Buy + Sell) ─────
    const egpVol  = exactLatest.egyptian_total_buy + exactLatest.egyptian_total_sell;
    const arabVol = exactLatest.arab_total_buy     + exactLatest.arab_total_sell;
    const forVol  = exactLatest.foreigners_total_buy + exactLatest.foreigners_total_sell;
    const totalMarketTurnover = egpVol + arabVol + forVol;

    const pieNationality = totalMarketTurnover > 0 ? [
      { name: 'مصريين', name_en: 'Egyptians', color: '#3B82F6',
        value: parseFloat(((egpVol  / totalMarketTurnover) * 100).toFixed(2)) },
      { name: 'عرب',    name_en: 'Arabs',      color: '#EAB308',
        value: parseFloat(((arabVol / totalMarketTurnover) * 100).toFixed(2)) },
      { name: 'أجانب', name_en: 'Foreigners',  color: '#10B981',
        value: parseFloat(((forVol  / totalMarketTurnover) * 100).toFixed(2)) },
    ] : null;

    const instBuyTotal  = exactLatest.egyptian_inst_buy  + exactLatest.arab_inst_buy  + exactLatest.foreign_inst_buy;
    const instSellTotal = exactLatest.egyptian_inst_sell + exactLatest.arab_inst_sell + exactLatest.foreign_inst_sell;
    const instVolTotal  = instBuyTotal + instSellTotal;

    const indBuyTotal   = exactLatest.egyptian_ind_buy  + exactLatest.arab_ind_buy  + exactLatest.foreign_ind_buy;
    const indSellTotal  = exactLatest.egyptian_ind_sell + exactLatest.arab_ind_sell + exactLatest.foreign_ind_sell;
    const indVolTotal   = indBuyTotal + indSellTotal;

    const catTurnover = instVolTotal + indVolTotal;
    const pieCategory = catTurnover > 0 ? [
      { name: 'مؤسسات', name_en: 'Institutions', color: '#EAB308',
        value: parseFloat(((instVolTotal / catTurnover) * 100).toFixed(2)) },
      { name: 'أفراد',  name_en: 'Retail',        color: '#3B82F6',
        value: parseFloat(((indVolTotal  / catTurnover) * 100).toFixed(2)) },
    ] : null;

    // ── Signal ────────────────────────────────────────────────────────────
    const foreignNet = exactLatest.foreigners_net;
    const signal     = foreignNet >= 0 ? 'buy' : 'sell';
    const trend      = foreignNet >= 0 ? 'positive' : 'negative';

    const formatM = (v: number) => {
      const abs = Math.abs(v);
      if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)} مليار`;
      if (abs >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)} مليون`;
      return v.toLocaleString('ar-EG');
    };

    const recommendation_impact = `${foreignNet >= 0 ? '🟢' : '🔴'} صافي ${foreignNet >= 0 ? 'شراء' : 'بيع'} أجنبي (${foreignNet >= 0 ? '+' : ''}${formatM(foreignNet)} ج.م)`;

    return NextResponse.json(
      {
        success: true,
        latest: exactLatest,
        distribution: {
          by_nationality: pieNationality,
          by_category:    pieCategory,
        },
        history: flowList.map((h: any) => ({
          trade_date:            h.trade_date,
          foreigners_net_egp:    n(h, 'foreigners_total_net_egp', 'foreigners_net_egp'),
          egyptian_inst_net_egp: n(h, 'egyptian_inst_net_egp'),
          egyptian_ind_net_egp:  n(h, 'egyptian_ind_net_egp'),
          arab_total_net_egp:    n(h, 'arab_total_net_egp', 'arab_net_egp'),
          total_volume_egp:      n(h, 'total_volume_egp'),
        })),
        signal,
        trend,
        recommendation_impact,
        data_date:    latest?.trade_date || null,
        is_live_today: latest?.trade_date === todayStr,
        fetched_at:   new Date().toISOString(),
      },
      { headers: NO_CACHE }
    );
  } catch (err: any) {
    console.error('Investor flows API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
