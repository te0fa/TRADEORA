import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // EGX Live Session Market Breakdown Data & Institutional Net Inflow
  const marketBreakdown = {
    session_date: '2026-07-26',
    market_status: 'مغلق',
    next_session: 'الاثنين 27 يوليو 2026 (09:45 ص)',
    investor_breakdown: {
      egyptians: { pct: 98.30, net_flow_egp: '+42.5M', sentiment: 'شراء مكثف' },
      arabs: { pct: 1.44, net_flow_egp: '-12.8M', sentiment: 'جني أرباح جزئي' },
      foreigners: { pct: 0.26, net_flow_egp: '-29.7M', sentiment: 'بيع محدود' }
    },
    institution_vs_retail: {
      institutions_pct: 68.4,
      retail_pct: 31.6,
      institutional_net_direction: 'BUY',
      institutional_conviction_score: 84
    },
    recent_disclosures: [
      {
        id: 'news-1',
        symbol: 'ABUK',
        company_name: 'أبو قير للأسمدة',
        title: 'نتائج أعمال استثنائية وزيادة في أرباح التصدير بالعملة الأجنبية',
        published_at: 'اليوم 02:15 م',
        impact_score: '+8.5%',
        impact_type: 'POSITIVE',
        recommendation_effect: 'تعزيز ثقة الشراء ورفع احتمالية النجاح لـ 88%'
      },
      {
        id: 'news-2',
        symbol: 'SWDY',
        company_name: 'السويدي إليكتريك',
        title: 'توقيع عقد مشروع طاقة تجددية جديد بقيمة 120 مليون دولار',
        published_at: 'اليوم 01:40 م',
        impact_score: '+6.2%',
        impact_type: 'POSITIVE',
        recommendation_effect: 'دعم استمرار الاتجاه الصاعد وتأكيد هدف TP2'
      },
      {
        id: 'news-3',
        symbol: 'COMI',
        company_name: 'البنك التجاري الدولي CIB',
        title: 'صافي أرباح النصف الأول تنمو بنسبة 34% بدعم من عائدات الوساطة والائتمان',
        published_at: 'اليوم 11:30 ص',
        impact_score: '+9.1%',
        impact_type: 'POSITIVE',
        recommendation_effect: 'دعم القيادي الرئيسي ورفع تقييم صفقات البنوك'
      }
    ]
  };

  return NextResponse.json({ success: true, data: marketBreakdown });
}
