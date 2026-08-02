import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const companyId = searchParams.get('companyId');
  const symbol = searchParams.get('symbol');
  const category = searchParams.get('category') || 'all';
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    let query = supabase
      .from('company_news')
      .select('*, companies(id, symbol, name_ar, sector)')
      .order('published_at', { ascending: false })
      .limit(limit);

    // Filter by company or symbol
    if (companyId || symbol) {
      let targetCompId = companyId;
      let targetSymbol = symbol;

      if (!targetCompId && symbol) {
        const { data: comp } = await supabase
          .from('companies')
          .select('id, symbol')
          .ilike('symbol', symbol)
          .maybeSingle();
        if (comp?.id) {
          targetCompId = comp.id;
          targetSymbol = comp.symbol;
        }
      }

      if (targetCompId && targetSymbol) {
        query = query.or(`company_id.eq.${targetCompId},title.ilike.%[${targetSymbol}]%,title.ilike.%${targetSymbol}%,content.ilike.%${targetSymbol}%`);
      } else if (targetCompId) {
        query = query.eq('company_id', targetCompId);
      } else {
        return NextResponse.json({ success: true, news: [] });
      }
    }

    const { data: newsItems, error } = await query;

    if (error) {
      console.error('Error fetching news:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Enrich with sector classification from company data
    const enriched = (newsItems || []).map((n: any) => ({
      ...n,
      sector_name: n.companies?.sector || classifySectorFromContent(n.title, n.content),
      symbol: n.companies?.symbol || extractSymbolFromTitle(n.title),
    }));

    // Filter by category or sector
    let finalNews = enriched;

    if (category && category !== 'all') {
      const cat = category.toLowerCase();

      if (cat === 'egx_bulletin') {
        finalNews = enriched.filter((n: any) =>
          (n.source || '').includes('البورصة') ||
          (n.title || '').includes('إيقاف') ||
          (n.title || '').includes('إفصاح') ||
          (n.title || '').includes('بيان')
        );
      } else if (cat === 'corporate') {
        finalNews = enriched.filter((n: any) =>
          n.category === 'corporate' || (n.title || '').includes('إفصاح') || (n.title || '').includes('أرباح')
        );
      } else if (cat === 'banking') {
        finalNews = enriched.filter((n: any) =>
          matchesKeywords(n, ['بنك', 'مالية', 'ائتمان', 'استثمار', 'comi', 'hrho', 'krdi', 'aspi'])
        );
      } else if (cat === 'real_estate') {
        finalNews = enriched.filter((n: any) =>
          matchesKeywords(n, ['عقار', 'إسكان', 'تطوير', 'تعمير', 'بناء', 'tmgh', 'phdc', 'mnhd', 'masr'])
        );
      } else if (cat === 'pharma') {
        finalNews = enriched.filter((n: any) =>
          matchesKeywords(n, ['دواء', 'صحة', 'مستشفى', 'دوائي', 'phar', 'bioc', 'clho', 'rmda'])
        );
      } else if (cat === 'food') {
        finalNews = enriched.filter((n: any) =>
          matchesKeywords(n, ['أغذية', 'مشروب', 'زيوت', 'مطاحن', 'صابون', 'زراعة', 'mosc', 'jufo', 'afmc', 'efid', 'ealr'])
        );
      } else if (cat === 'telecom') {
        finalNews = enriched.filter((n: any) =>
          matchesKeywords(n, ['اتصالات', 'تكنولوجيا', 'شبك', 'إنترنت', 'etel', 'raya', 'oih'])
        );
      } else if (cat === 'energy') {
        finalNews = enriched.filter((n: any) =>
          matchesKeywords(n, ['طاقة', 'بترول', 'غاز', 'سماد', 'كهرباء', 'amoc', 'abuk', 'swdy'])
        );
      } else if (cat === 'industrial') {
        finalNews = enriched.filter((n: any) =>
          matchesKeywords(n, ['صناع', 'مقاولات', 'حديد', 'بلاستيك', 'إنشاء', 'aalr', 'gdwa', 'cpme'])
        );
      } else if (cat === 'textile') {
        finalNews = enriched.filter((n: any) =>
          matchesKeywords(n, ['منسوجات', 'سلع', 'ملابس', 'غزل', 'zeot'])
        );
      }
    }

    return NextResponse.json({ success: true, news: finalNews });
  } catch (err: any) {
    console.error('API /api/news error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function matchesKeywords(n: any, keywords: string[]): boolean {
  const text = `${n.sector_name || ''} ${n.companies?.sector || ''} ${n.title || ''} ${n.content || ''} ${n.symbol || ''}`.toLowerCase();
  return keywords.some(kw => text.includes(kw.toLowerCase()));
}

function extractSymbolFromTitle(title?: string): string | null {
  if (!title) return null;
  const match = title.match(/\[([A-Z0-9]{3,6})\]/);
  return match ? match[1] : null;
}

function classifySectorFromContent(title?: string, content?: string): string {
  const text = `${title || ''} ${content || ''}`.toLowerCase();
  if (text.includes('بنك') || text.includes('فائدة') || text.includes('ائتمان') || text.includes('تمويل')) return 'قطاع البنوك والخدمات المالية';
  if (text.includes('عقار') || text.includes('إسكان') || text.includes('بناء') || text.includes('تطوير')) return 'قطاع العقارات والإنشاءات';
  if (text.includes('اتصالات') || text.includes('تكنولوجيا') || text.includes('رقمي') || text.includes('إنترنت')) return 'قطاع الاتصالات والتكنولوجيا';
  if (text.includes('طاقة') || text.includes('بترول') || text.includes('غاز') || text.includes('سماد')) return 'قطاع الطاقة والموارد الطبيعية';
  if (text.includes('غذاء') || text.includes('أغذية') || text.includes('زراعة') || text.includes('مطاحن')) return 'قطاع الأغذية والمشروبات';
  if (text.includes('دواء') || text.includes('صحة') || text.includes('طب')) return 'قطاع الرعاية الصحية والأدوية';
  return 'إفصاحات وأخبار عامة';
}
