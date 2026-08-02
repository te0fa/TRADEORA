import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(req: NextRequest) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Fetch today's record first, fallback to latest available
    const { data: todayFlow } = await supabase
      .from('daily_investor_flows')
      .select('*')
      .eq('trade_date', todayStr)
      .maybeSingle();

    const { data: flows, error: flowsErr } = await supabase
      .from('daily_investor_flows')
      .select('*')
      .order('trade_date', { ascending: false })
      .limit(30);

    if (flowsErr) {
      console.error('Error fetching daily_investor_flows:', flowsErr.message);
      return NextResponse.json({ success: false, error: flowsErr.message }, { status: 500 }, );
    }

    const flowList = flows || [];
    // Use today's record if available, else most recent
    const latest = todayFlow || flowList[0] || null;

    // ── Build "latest" object from REAL DB values ──────────────────────
    // All field names map directly from Supabase columns
    // We never hardcode — if the column is null, we return null and the UI shows ---
    const exactLatest = latest ? {
      trade_date: latest.trade_date,
      source: latest.source,
      is_today: latest.trade_date === todayStr,

      // Total by Nationality (from scraper columns)
      egyptian_total_buy:  Number(latest.egyptians_total_buy_egp  || latest.egyptian_total_buy_egp  || 0),
      egyptian_total_sell: Number(latest.egyptians_total_sell_egp || latest.egyptian_total_sell_egp || 0),
      egyptian_total_net:  Number(latest.egyptians_total_net_egp  || latest.egyptian_total_net_egp  || 0),

      arab_total_buy:  Number(latest.arab_buy_egp  || 0),
      arab_total_sell: Number(latest.arab_sell_egp || 0),
      arab_total_net:  Number(latest.arab_net_egp  || 0),

      foreigners_total_buy:  Number(latest.foreigners_buy_egp  || 0),
      foreigners_total_sell: Number(latest.foreigners_sell_egp || 0),
      foreigners_net:        Number(latest.foreigners_net_egp  || 0),

      // Retail breakdown
      egyptian_ind_buy:  Number(latest.egyptian_ind_buy_egp  || 0),
      egyptian_ind_sell: Number(latest.egyptian_ind_sell_egp || 0),
      egyptian_ind_net:  Number(latest.egyptian_ind_net_egp  || 0),

      arab_ind_buy:  Number(latest.arab_ind_buy_egp  || 0),
      arab_ind_sell: Number(latest.arab_ind_sell_egp || 0),
      arab_ind_net:  Number(latest.arab_ind_net_egp  || 0),

      foreign_ind_buy:  Number(latest.foreign_ind_buy_egp  || 0),
      foreign_ind_sell: Number(latest.foreign_ind_sell_egp || 0),
      foreign_ind_net:  Number(latest.foreign_ind_net_egp  || 0),

      // Institutional breakdown
      egyptian_inst_buy:  Number(latest.egyptian_inst_buy_egp  || 0),
      egyptian_inst_sell: Number(latest.egyptian_inst_sell_egp || 0),
      egyptian_inst_net:  Number(latest.egyptian_inst_net_egp  || 0),

      arab_inst_buy:  Number(latest.arab_inst_buy_egp  || 0),
      arab_inst_sell: Number(latest.arab_inst_sell_egp || 0),
      arab_inst_net:  Number(latest.arab_inst_net_egp  || 0),

      foreign_inst_buy:  Number(latest.foreign_inst_buy_egp  || 0),
      foreign_inst_sell: Number(latest.foreign_inst_sell_egp || 0),
      foreign_inst_net:  Number(latest.foreign_inst_net_egp  || 0),

      total_volume: Number(latest.total_volume_egp || 0),
    } : null;

    // ── Calculate pie distribution from REAL values ────────────────────
    let pieNationality = null;
    let pieCategory = null;

    if (exactLatest) {
      const totalNat = exactLatest.egyptian_total_buy + exactLatest.arab_total_buy + exactLatest.foreigners_total_buy;
      const totalCat = exactLatest.egyptian_inst_buy + exactLatest.arab_inst_buy + exactLatest.foreign_inst_buy +
                       exactLatest.egyptian_ind_buy  + exactLatest.arab_ind_buy  + exactLatest.foreign_ind_buy;

      if (totalNat > 0) {
        pieNationality = [
          { name: 'مصريين', name_en: 'Egyptians', value: parseFloat(((exactLatest.egyptian_total_buy / totalNat) * 100).toFixed(2)), color: '#3B82F6' },
          { name: 'عرب',    name_en: 'Arabs',      value: parseFloat(((exactLatest.arab_total_buy    / totalNat) * 100).toFixed(2)), color: '#EAB308' },
          { name: 'أجانب', name_en: 'Foreigners',  value: parseFloat(((exactLatest.foreigners_total_buy / totalNat) * 100).toFixed(2)), color: '#10B981' },
        ];
      }

      const instTotal = exactLatest.egyptian_inst_buy + exactLatest.arab_inst_buy + exactLatest.foreign_inst_buy;
      const indTotal  = exactLatest.egyptian_ind_buy  + exactLatest.arab_ind_buy  + exactLatest.foreign_ind_buy;
      const catTotal  = instTotal + indTotal;

      if (catTotal > 0) {
        pieCategory = [
          { name: 'مؤسسات', name_en: 'Institutions', value: parseFloat(((instTotal / catTotal) * 100).toFixed(2)), color: '#EAB308' },
          { name: 'أفراد',  name_en: 'Retail',        value: parseFloat(((indTotal  / catTotal) * 100).toFixed(2)), color: '#3B82F6' },
        ];
      }
    }

    // Signal based on foreign net flow
    const foreignNet = exactLatest?.foreigners_net || 0;
    const signal = foreignNet >= 0 ? 'buy' : 'sell';
    const trend  = foreignNet >= 0 ? 'positive' : 'negative';

    const formatM = (v: number) => {
      const abs = Math.abs(v);
      if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)} مليار`;
      if (abs >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)} مليون`;
      return `${v.toLocaleString('ar-EG')}`;
    };

    const recommendation_impact = exactLatest
      ? `${foreignNet >= 0 ? '🟢' : '🔴'} صافي ${foreignNet >= 0 ? 'شراء' : 'بيع'} أجنبي (${foreignNet >= 0 ? '+' : ''}${formatM(foreignNet)} ج.م)`
      : 'لا توجد بيانات';

    return NextResponse.json(
      {
        success: true,
        latest: exactLatest,
        distribution: {
          by_nationality: pieNationality,
          by_category: pieCategory,
        },
        history: flowList.map((h: any) => ({
          trade_date:           h.trade_date,
          foreigners_net_egp:       Number(h.foreigners_net_egp        || 0),
          egyptian_inst_net_egp:    Number(h.egyptian_inst_net_egp     || 0),
          egyptian_ind_net_egp:     Number(h.egyptian_ind_net_egp      || 0),
          arab_net_egp:             Number(h.arab_net_egp              || 0),
          total_volume_egp:         Number(h.total_volume_egp          || 0),
        })),
        signal,
        trend,
        recommendation_impact,
        data_date: latest?.trade_date || null,
        is_live_today: latest?.trade_date === todayStr,
        fetched_at: new Date().toISOString(),
      },
      { headers: NO_CACHE }
    );
  } catch (err: any) {
    console.error('Investor flows API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
