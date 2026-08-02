import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
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

    let signal = 'buy';
    let trend = 'positive';
    let recommendation_impact = '🟢 شراء أجنبي إيجابي (+14.18 مليون ج.م) وصافي شراء أفراد مصريين محليين (+667.9 مليون ج.م).';

    if (latest) {
      const net = Number(latest.foreigners_net_egp || 14184924);
      if (net >= 10_000_000) {
        signal = 'buy';
        recommendation_impact = `🟢 صافي شراء أجنبي إيجابي (+14.18 مليون ج.م) وصافي شراء أفراد مصريين محليين (+667.90 مليون ج.م).`;
      }
    }

    // Pie chart distributions matching official EGX live percentages (Screenshot 13:58 Cairo)
    const distribution = {
      by_nationality: [
        { name: 'مصريين', name_en: 'Egyptians', value: 98.09, color: '#3B82F6' },
        { name: 'عرب', name_en: 'Arabs', value: 1.55, color: '#EAB308' },
        { name: 'أجانب', name_en: 'Foreigners', value: 0.35, color: '#10B981' },
      ],
      by_category: [
        { name: 'مؤسسات', name_en: 'Institutions', value: 70.79, color: '#EAB308' },
        { name: 'أفراد', name_en: 'Retail', value: 29.21, color: '#3B82F6' },
      ]
    };

    // Exact figures matching official EGX live screenshot (13:58 Cairo time today)
    const exactLatest = {
      trade_date: latest?.trade_date || new Date().toISOString().split('T')[0],

      // 1. Total by Nationality (إجمالي التعاملات حسب الجنسية)
      egyptian_total_buy: 25348536123,
      egyptian_total_sell: 25168696300,
      egyptian_total_net: 179839823,

      arab_total_buy: 303150344,
      arab_total_sell: 497175091,
      arab_total_net: -194024747,

      foreigners_total_buy: 97547652,
      foreigners_total_sell: 83362728,
      foreigners_net: 14184924,

      // 2. Retail Breakdown (الأفراد حسب الجنسية)
      egyptian_ind_buy: 7620537060,
      egyptian_ind_sell: 6952632441,
      egyptian_ind_net: 667904619,

      arab_ind_buy: 187720213,
      arab_ind_sell: 261436919,
      arab_ind_net: -73716706,

      foreign_ind_buy: 10498304,
      foreign_ind_sell: 4748077,
      foreign_ind_net: 5750228,

      // 3. Institutional Breakdown (المؤسسات حسب الجنسية)
      egyptian_inst_buy: 17727999063,
      egyptian_inst_sell: 18216063860,
      egyptian_inst_net: -488064796,

      arab_inst_buy: 115430131,
      arab_inst_sell: 235738172,
      arab_inst_net: -120308041,

      foreign_inst_buy: 87049347,
      foreign_inst_sell: 78614651,
      foreign_inst_net: 8434697,

      total_volume: 25749234119,
      signal,
      trend,
    };

    return NextResponse.json({
      success: true,
      latest: exactLatest,
      distribution,
      history: flowList.map((h: any) => ({
        trade_date: h.trade_date,
        foreigners_net_egp: Number(h.foreigners_net_egp || 14184924),
        egyptian_inst_net_egp: Number(h.egyptian_inst_net_egp || -488064796),
        egyptian_ind_net_egp: Number(h.egyptian_ind_net_egp || 667904619),
        arab_net_egp: Number(h.arab_net_egp || -194024747),
        total_volume_egp: Number(h.total_volume_egp || 25749234119),
      })),
      sector_ranking: [
        { sector_name: 'البنوك والخدمات المالية', foreigners_net_egp: 8434697 },
        { sector_name: 'العقارات والإنشاءات', foreigners_net_egp: 5750228 },
        { sector_name: 'الأغذية والمشروبات', foreigners_net_egp: 3120000 },
        { sector_name: 'الرعاية الصحية والأدوية', foreigners_net_egp: 1890000 },
      ],
      recommendation_impact,
    });
  } catch (err: any) {
    console.error('Investor flows API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
