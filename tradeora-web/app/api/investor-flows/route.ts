import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch last 30 days of daily investor flows
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
    let recommendation_impact = 'محايد - لا تأثير إضافي على التوصيات';

    if (latest) {
      const net = Number(latest.foreigners_net_egp || 0);
      if (net >= 50000000) {
        signal = 'strong_buy';
        recommendation_impact = 'أجانب يشترون بكثافة (+50M ج.م) - تعزيز التوصيات بنسبة +10%';
      } else if (net >= 20000000) {
        signal = 'buy';
        recommendation_impact = 'تدفقات أجنبية إيجابية (+20M ج.م) - تعزيز التوصيات بنسبة +5%';
      } else if (net <= -50000000) {
        signal = 'strong_sell';
        recommendation_impact = 'مبيعات مكثفة للأجانب (-50M ج.م) - خفض التوصيات بنسبة -15%';
      } else if (net <= -20000000) {
        signal = 'sell';
        recommendation_impact = 'مبيعات أجنبية (-20M ج.م) - خفض التوصيات بنسبة -5%';
      }

      // Check 3-day trend
      if (flowList.length >= 3) {
        const recent3 = flowList.slice(0, 3).map((f: any) => Number(f.foreigners_net_egp || 0));
        if (recent3.every((n: number) => n > 0)) {
          trend = 'bullish';
          recommendation_impact += ' (مع اتجاه شراء لـ 3 أيام متتالية +5%)';
        } else if (recent3.every((n: number) => n < 0)) {
          trend = 'bearish';
        }
      }
    }

    // 2. Fetch top 5 sector rankings
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: sectorFlows } = await supabase
      .from('sector_investor_flows')
      .select('sector_name, foreigners_net_egp')
      .gte('trade_date', thirtyDaysAgo);

    const sectorTotals: Record<string, number> = {};
    (sectorFlows || []).forEach((row: any) => {
      const name = row.sector_name || 'عام';
      const val = Number(row.foreigners_net_egp || 0);
      sectorTotals[name] = (sectorTotals[name] || 0) + val;
    });

    const sector_ranking = Object.entries(sectorTotals)
      .map(([sector_name, net_egp]: [string, number]) => ({ sector_name, foreigners_net_egp: net_egp }))
      .sort((a, b) => b.foreigners_net_egp - a.foreigners_net_egp)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      latest: latest ? {
        date: latest.trade_date,
        foreigners_net: Number(latest.foreigners_net_egp || 0),
        foreign_inst_net: Number(latest.foreign_inst_net_egp || 0),
        egyptian_inst_net: Number(latest.egyptian_inst_net_egp || 0),
        arab_net: Number(latest.arab_net_egp || 0),
        signal,
        trend
      } : null,
      history: flowList,
      sector_ranking,
      recommendation_impact
    });
  } catch (err: any) {
    console.error('Investor flows API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
