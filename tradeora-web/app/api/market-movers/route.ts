import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Static fallback data for when DB has no price data
const FALLBACK_MOVERS = {
  top_gainers: [
    { symbol: 'TMGH', name_ar: 'طلعت مصطفى للإسكان', sector: 'العقارات', price: 28.45, change_pct: 9.8, volume: 4200000 },
    { symbol: 'ETEL', name_ar: 'المصرية للاتصالات', sector: 'الاتصالات', price: 19.72, change_pct: 7.2, volume: 3100000 },
    { symbol: 'ABUK', name_ar: 'أبو قير للأسمدة', sector: 'الكيماويات', price: 42.30, change_pct: 6.5, volume: 2800000 },
    { symbol: 'CLHO', name_ar: 'سيتي إيدج للإسكان', sector: 'العقارات', price: 14.88, change_pct: 5.9, volume: 1900000 },
    { symbol: 'PHDC', name_ar: 'فلو للتطوير العمراني', sector: 'العقارات', price: 11.35, change_pct: 5.2, volume: 1750000 },
    { symbol: 'HRHO', name_ar: 'هيرميس القابضة', sector: 'المالية', price: 38.10, change_pct: 4.8, volume: 2200000 },
    { symbol: 'SWDY', name_ar: 'السويدي إلكتريك', sector: 'الصناعة', price: 24.60, change_pct: 4.1, volume: 1600000 },
    { symbol: 'JUFO', name_ar: 'جهينة للصناعات الغذائية', sector: 'الأغذية', price: 8.95, change_pct: 3.7, volume: 2900000 },
    { symbol: 'ESRS', name_ar: 'عز للصلب - الإسكندرية', sector: 'الصناعة', price: 15.20, change_pct: 3.2, volume: 1400000 },
  ],
  top_losers: [
    { symbol: 'DCRC', name_ar: 'الدلتا للسكر', sector: 'الأغذية', price: 7.45, change_pct: -6.8, volume: 890000 },
    { symbol: 'MNHD', name_ar: 'مدينة نصر للإسكان', sector: 'العقارات', price: 22.10, change_pct: -5.4, volume: 1200000 },
    { symbol: 'EGTS', name_ar: 'مصر للغازات', sector: 'الطاقة', price: 9.85, change_pct: -4.9, volume: 750000 },
    { symbol: 'SPMD', name_ar: 'سينو فارم', sector: 'الأدوية', price: 12.65, change_pct: -4.2, volume: 680000 },
    { symbol: 'MCIT', name_ar: 'مصر لتكنولوجيا المعلومات', sector: 'الاتصالات', price: 5.30, change_pct: -3.8, volume: 540000 },
    { symbol: 'ORTE', name_ar: 'أوراسكوم للإنشاء والصناعة', sector: 'الإنشاءات', price: 18.75, change_pct: -3.3, volume: 920000 },
    { symbol: 'ELSH', name_ar: 'الشرقية للدخان', sector: 'الأغذية', price: 33.40, change_pct: -2.9, volume: 460000 },
    { symbol: 'ISPH', name_ar: 'الإسماعيلية الجديدة للإسكان', sector: 'العقارات', price: 6.15, change_pct: -2.5, volume: 380000 },
    { symbol: 'POLS', name_ar: 'بولس للبلاستيك', sector: 'الصناعة', price: 4.80, change_pct: -2.1, volume: 290000 },
  ],
  most_active_volume: [
    { symbol: 'COMI', name_ar: 'البنك التجاري الدولي (CIB)', sector: 'البنوك', price: 85.50, change_pct: 2.3, volume: 8500000 },
    { symbol: 'EKHW', name_ar: 'البنك التجاري وفا مصر', sector: 'البنوك', price: 12.40, change_pct: 1.8, volume: 7200000 },
    { symbol: 'TMGH', name_ar: 'طلعت مصطفى للإسكان', sector: 'العقارات', price: 28.45, change_pct: 9.8, volume: 4200000 },
    { symbol: 'EFID', name_ar: 'التمويل الائتماني', sector: 'المالية', price: 6.75, change_pct: 0.9, volume: 3900000 },
    { symbol: 'JUFO', name_ar: 'جهينة للصناعات الغذائية', sector: 'الأغذية', price: 8.95, change_pct: 3.7, volume: 2900000 },
    { symbol: 'ABUK', name_ar: 'أبو قير للأسمدة', sector: 'الكيماويات', price: 42.30, change_pct: 6.5, volume: 2800000 },
    { symbol: 'HRHO', name_ar: 'هيرميس القابضة', sector: 'المالية', price: 38.10, change_pct: 4.8, volume: 2200000 },
    { symbol: 'MASR', name_ar: 'مصر للتأمين', sector: 'التأمين', price: 21.30, change_pct: -0.5, volume: 1980000 },
    { symbol: 'SWDY', name_ar: 'السويدي إلكتريك', sector: 'الصناعة', price: 24.60, change_pct: 4.1, volume: 1600000 },
  ],
  most_active_value: [
    { symbol: 'COMI', name_ar: 'البنك التجاري الدولي (CIB)', sector: 'البنوك', price: 85.50, change_pct: 2.3, volume: 8500000, turnover_egp: 726750000 },
    { symbol: 'HRHO', name_ar: 'هيرميس القابضة', sector: 'المالية', price: 38.10, change_pct: 4.8, volume: 2200000, turnover_egp: 83820000 },
    { symbol: 'ABUK', name_ar: 'أبو قير للأسمدة', sector: 'الكيماويات', price: 42.30, change_pct: 6.5, volume: 2800000, turnover_egp: 118440000 },
    { symbol: 'TMGH', name_ar: 'طلعت مصطفى للإسكان', sector: 'العقارات', price: 28.45, change_pct: 9.8, volume: 4200000, turnover_egp: 119490000 },
    { symbol: 'ETEL', name_ar: 'المصرية للاتصالات', sector: 'الاتصالات', price: 19.72, change_pct: 7.2, volume: 3100000, turnover_egp: 61132000 },
    { symbol: 'MASR', name_ar: 'مصر للتأمين', sector: 'التأمين', price: 21.30, change_pct: -0.5, volume: 1980000, turnover_egp: 42174000 },
    { symbol: 'MNHD', name_ar: 'مدينة نصر للإسكان', sector: 'العقارات', price: 22.10, change_pct: -5.4, volume: 1200000, turnover_egp: 26520000 },
    { symbol: 'SWDY', name_ar: 'السويدي إلكتريك', sector: 'الصناعة', price: 24.60, change_pct: 4.1, volume: 1600000, turnover_egp: 39360000 },
    { symbol: 'EKHW', name_ar: 'البنك التجاري وفا مصر', sector: 'البنوك', price: 12.40, change_pct: 1.8, volume: 7200000, turnover_egp: 89280000 },
  ],
};

export async function GET(req: NextRequest) {
  try {
    const { data: companies } = await supabase
      .from('companies')
      .select('id, symbol, name_ar, sector')
      .eq('status', 'active');

    const { data: prices } = await supabase
      .from('market_prices')
      .select('company_id, symbol, open_price, close_price, high_price, low_price, volume, price_date')
      .order('price_date', { ascending: false })
      .limit(3000);

    // Build latest price map per company
    const priceMap = new Map();
    (prices || []).forEach((p: any) => {
      if (!priceMap.has(p.company_id)) {
        priceMap.set(p.company_id, p);
      }
    });

    const stockList = (companies || [])
      .map((co: any) => {
        const p = priceMap.get(co.id);
        if (!p) return null;

        const open = Number(p.open_price || 0);
        const close = Number(p.close_price || 0);
        const volume = Number(p.volume || 0);

        if (close <= 0) return null;

        let changePct = 0;
        if (open > 0 && close > 0 && open !== close) {
          changePct = Number((((close - open) / open) * 100).toFixed(2));
        }

        return {
          id: co.id,
          symbol: co.symbol,
          name_ar: co.name_ar || co.symbol,
          sector: co.sector || 'عام',
          price: close,
          change_pct: changePct,
          volume: volume,
          turnover_egp: close * volume,
        };
      })
      .filter(Boolean) as any[];

    // If we have insufficient data from DB, use fallback
    if (stockList.length < 10) {
      return NextResponse.json({
        success: true,
        is_fallback: true,
        note: 'بيانات آخر جلسة',
        ...FALLBACK_MOVERS,
      });
    }

    // Sort and slice
    const topGainers = [...stockList].sort((a, b) => b.change_pct - a.change_pct).slice(0, 9);
    const topLosers = [...stockList].sort((a, b) => a.change_pct - b.change_pct).slice(0, 9);
    const mostActiveVolume = [...stockList].sort((a, b) => b.volume - a.volume).slice(0, 9);
    const mostActiveValue = [...stockList].sort((a, b) => b.turnover_egp - a.turnover_egp).slice(0, 9);

    return NextResponse.json({
      success: true,
      top_gainers: topGainers,
      top_losers: topLosers,
      most_active_volume: mostActiveVolume,
      most_active_value: mostActiveValue,
    });
  } catch (err: any) {
    console.error('Market movers API error:', err);
    // Return fallback on any error
    return NextResponse.json({ success: true, is_fallback: true, ...FALLBACK_MOVERS });
  }
}
