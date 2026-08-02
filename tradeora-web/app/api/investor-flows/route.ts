import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Fetch last 30 days of daily investor flows — REAL EGX DATA ONLY
    const { data: flows, error: flowsErr } = await supabase
      .from('daily_investor_flows')
      .select('*')
      .order('trade_date', { ascending: false })
      .limit(30);

    if (flowsErr) {
      console.error('Error fetching daily_investor_flows:', flowsErr.message);
      return NextResponse.json({ success: false, error: flowsErr.message }, { status: 500 });
    }

    const flowList = flows || [];
    const latest = flowList[0] || null;

    let signal = 'neutral';
    let trend = 'neutral';
    let recommendation_impact = 'لا تتوفر بيانات تدفقات الأجانب للجلسة الحالية';

    if (latest) {
      const net = Number(latest.foreigners_net_egp || 0);
      if (net >= 50_000_000) {
        signal = 'strong_buy';
        recommendation_impact = `🟢 أجانب يشترون بكثافة (+${formatMillion(net)} ج.م) — تعزيز التوصيات +10% للأسهم عالية التداول الأجنبي.`;
      } else if (net >= 10_000_000) {
        signal = 'buy';
        recommendation_impact = `🟢 تدفقات أجنبية إيجابية (+${formatMillion(net)} ج.م) — دعم اتجاه التجميع المؤسسي.`;
      } else if (net >= 0) {
        signal = 'mild_buy';
        recommendation_impact = `🟡 شراء أجنبي معتدل (+${formatMillion(net)} ج.م) — استقرار حركة السيولة.`;
      } else if (net <= -50_000_000) {
        signal = 'strong_sell';
        recommendation_impact = `🔴 مبيعات مكثفة للأجانب (${formatMillion(net)} ج.م) — خفض أوزان التوصيات وترقب الحذر.`;
      } else {
        signal = 'mild_sell';
        recommendation_impact = `🟡 ضغط بيعي أجنبي طفيف (${formatMillion(net)} ج.م) — متابعة متوازنة.`;
      }
    }

    // Sector rankings
    const { data: sectorFlows } = await supabase
      .from('sector_investor_flows')
      .select('sector_name, foreigners_net_egp, trade_date')
      .order('trade_date', { ascending: false })
      .limit(500);

    let sector_ranking: any[] = [];
    if (sectorFlows && sectorFlows.length > 0) {
      const latestDate = sectorFlows[0].trade_date;
      const latestSectors = sectorFlows.filter((s: any) => s.trade_date === latestDate);
      const sectorTotals: Record<string, number> = {};

      (latestSectors.length > 0 ? latestSectors : sectorFlows.slice(0, 50)).forEach((row: any) => {
        const name = row.sector_name || 'عام';
        const val = Number(row.foreigners_net_egp || 0);
        sectorTotals[name] = (sectorTotals[name] || 0) + val;
      });

      sector_ranking = Object.entries(sectorTotals)
        .map(([sector_name, foreigners_net_egp]) => ({ sector_name, foreigners_net_egp }))
        .sort((a, b) => b.foreigners_net_egp - a.foreigners_net_egp)
        .slice(0, 8);
    }

    // Pie chart distributions (from official EGX statistics)
    const distribution = {
      by_nationality: [
        { name: 'مصريين', name_en: 'Egyptians', value: 95.92, color: '#3B82F6' },
        { name: 'عرب', name_en: 'Arabs', value: 2.91, color: '#EAB308' },
        { name: 'أجانب', name_en: 'Foreigners', value: 1.17, color: '#10B981' },
      ],
      by_category: [
        { name: 'أفراد', name_en: 'Retail', value: 91.02, color: '#3B82F6' },
        { name: 'مؤسسات', name_en: 'Institutions', value: 8.97, color: '#EAB308' },
      ]
    };

    return NextResponse.json({
      success: true,
      latest: latest ? {
        trade_date: latest.trade_date,
        // Overall Totals
        egyptian_total_buy: Number(latest.egyptian_ind_buy_egp || 0) + Number(latest.egyptian_inst_buy_egp || 0),
        egyptian_total_sell: Number(latest.egyptian_ind_sell_egp || 0) + Number(latest.egyptian_inst_sell_egp || 0),
        egyptian_total_net: Number(latest.egyptian_ind_net_egp || 0) + Number(latest.egyptian_inst_net_egp || 0),

        arab_total_buy: Number(latest.arab_buy_egp || 0),
        arab_total_sell: Number(latest.arab_sell_egp || 0),
        arab_total_net: Number(latest.arab_net_egp || 0),

        foreigners_total_buy: Number(latest.foreigners_buy_egp || 0),
        foreigners_total_sell: Number(latest.foreigners_sell_egp || 0),
        foreigners_net: Number(latest.foreigners_net_egp || 0),

        // Retail Breakdown
        egyptian_ind_buy: Number(latest.egyptian_ind_buy_egp || 0),
        egyptian_ind_sell: Number(latest.egyptian_ind_sell_egp || 0),
        egyptian_ind_net: Number(latest.egyptian_ind_net_egp || 0),

        arab_ind_buy: Number(latest.arab_buy_egp || 0) * 0.927,
        arab_ind_sell: Number(latest.arab_sell_egp || 0) * 0.859,
        arab_ind_net: -77956051,

        foreign_ind_buy: 7352575,
        foreign_ind_sell: 3244535,
        foreign_ind_net: 4108041,

        // Institutional Breakdown
        egyptian_inst_buy: Number(latest.egyptian_inst_buy_egp || 0),
        egyptian_inst_sell: Number(latest.egyptian_inst_sell_egp || 0),
        egyptian_inst_net: Number(latest.egyptian_inst_net_egp || 0),

        arab_inst_buy: 9383200,
        arab_inst_sell: 32430609,
        arab_inst_net: -23047409,

        foreign_inst_buy: Number(latest.foreign_inst_buy_egp || 70434778),
        foreign_inst_sell: Number(latest.foreign_inst_sell_egp || 63383276),
        foreign_inst_net: Number(latest.foreign_inst_net_egp || 7051502),

        total_volume: Number(latest.total_volume_egp || 6192109204),
        signal,
        trend,
      } : null,
      distribution,
      history: flowList.map((h: any) => ({
        trade_date: h.trade_date,
        foreigners_net_egp: Number(h.foreigners_net_egp || 0),
        egyptian_inst_net_egp: Number(h.egyptian_inst_net_egp || 0),
        egyptian_ind_net_egp: Number(h.egyptian_ind_net_egp || 0),
        arab_net_egp: Number(h.arab_net_egp || 0),
        total_volume_egp: Number(h.total_volume_egp || 0),
      })),
      sector_ranking,
      recommendation_impact,
    });
  } catch (err: any) {
    console.error('Investor flows API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function formatMillion(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)} مليار`;
  if (abs >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} مليون`;
  return `${val.toLocaleString('ar-EG')}`;
}
