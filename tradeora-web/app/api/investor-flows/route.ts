import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch last 30 days of daily investor flows — REAL DATA ONLY
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
        recommendation_impact = `🟢 أجانب يشترون بكثافة (${formatMillion(net)} م.ج) — تعزيز التوصيات +10% للأسهم عالية التداول الأجنبي.`;
      } else if (net >= 20_000_000) {
        signal = 'buy';
        recommendation_impact = `🟢 تدفقات أجنبية إيجابية (${formatMillion(net)} م.ج) — تعزيز التوصيات +5% للأسهم القيادية.`;
      } else if (net >= 0) {
        signal = 'mild_buy';
        recommendation_impact = `🟡 شراء أجنبي معتدل (${formatMillion(net)} م.ج) — لا تأثير جوهري، يُفضل متابعة الاتجاه.`;
      } else if (net <= -50_000_000) {
        signal = 'strong_sell';
        recommendation_impact = `🔴 مبيعات مكثفة للأجانب (${formatMillion(net)} م.ج) — خفض أوزان التوصيات وتعزيز وقف الخسارة.`;
      } else if (net <= -20_000_000) {
        signal = 'sell';
        recommendation_impact = `🔴 مبيعات أجنبية (${formatMillion(net)} م.ج) — تقليل الأوزان -5% وترقب أي تحسن.`;
      } else {
        signal = 'mild_sell';
        recommendation_impact = `🟡 ضغط بيعي أجنبي طفيف (${formatMillion(net)} م.ج) — مراقبة دون اتخاذ قرارات.`;
      }

      if (flowList.length >= 3) {
        const recent3 = flowList.slice(0, 3).map((f: any) => Number(f.foreigners_net_egp || 0));
        if (recent3.every((n: number) => n > 0)) {
          trend = 'bullish';
          recommendation_impact += ' (3 أيام شراء متتالية ✅)';
        } else if (recent3.every((n: number) => n < 0)) {
          trend = 'bearish';
          recommendation_impact += ' (3 أيام بيع متتالية ⚠️)';
        }
      }
    }

    // 2. Fetch sector rankings — REAL DATA
    const { data: sectorFlows, error: secErr } = await supabase
      .from('sector_investor_flows')
      .select('sector_name, foreigners_net_egp, trade_date')
      .order('trade_date', { ascending: false })
      .limit(500);

    let sector_ranking: any[] = [];

    if (sectorFlows && sectorFlows.length > 0) {
      // Only use most recent date's data
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

    return NextResponse.json({
      success: true,
      latest: latest ? {
        trade_date: latest.trade_date,
        foreigners_net: Number(latest.foreigners_net_egp || 0),
        foreign_inst_net: Number(latest.foreign_inst_net_egp || 0),
        egyptian_inst_net: Number(latest.egyptian_inst_net_egp || 0),
        arab_net: Number(latest.arabs_net_egp || 0),
        total_volume: Number(latest.total_volume_egp || 0),
        signal,
        trend,
      } : null,
      history: flowList.map((h: any) => ({
        trade_date: h.trade_date,
        foreigners_net_egp: Number(h.foreigners_net_egp || 0),
        egyptian_inst_net_egp: Number(h.egyptian_inst_net_egp || 0),
        arab_net_egp: Number(h.arabs_net_egp || 0),
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
  if (abs >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} مليار`;
  if (abs >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} مليون`;
  return `${val.toLocaleString('ar-EG')}`;
}
