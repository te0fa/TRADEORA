import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Valid DB categories only (chk_news_category constraint)
const VALID_CATEGORIES = ['corporate', 'macro_fx'];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const companyId = searchParams.get('companyId');
  const symbol = searchParams.get('symbol');
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '30');

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

    // Filter by category (only valid DB categories)
    if (category && category !== 'all') {
      if (VALID_CATEGORIES.includes(category)) {
        query = query.eq('category', category);
      }
      // If category is a sector name (like 'banking'), we do sector-based filtering below
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
      symbol: n.companies?.symbol || null,
    }));

    // If filtering by sector name (not a DB category), filter client-side
    let finalNews = enriched;
    if (category && category !== 'all' && !VALID_CATEGORIES.includes(category)) {
      finalNews = enriched.filter((n: any) =>
        (n.sector_name || '').toLowerCase().includes(category.toLowerCase()) ||
        (n.companies?.sector || '').toLowerCase().includes(category.toLowerCase())
      );
    }

    return NextResponse.json({ success: true, news: finalNews });
  } catch (err: any) {
    console.error('API /api/news error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function classifySectorFromContent(title?: string, content?: string): string {
  const text = `${title || ''} ${content || ''}`.toLowerCase();
  if (text.includes('بنك') || text.includes('فائدة') || text.includes('ائتمان') || text.includes('تمويل')) return 'البنوك والخدمات المالية';
  if (text.includes('عقار') || text.includes('إسكان') || text.includes('بناء') || text.includes('تطوير')) return 'العقارات والإنشاءات';
  if (text.includes('اتصالات') || text.includes('تكنولوجيا') || text.includes('رقمي') || text.includes('إنترنت')) return 'الاتصالات والتكنولوجيا';
  if (text.includes('طاقة') || text.includes('بترول') || text.includes('غاز') || text.includes('سماد')) return 'الطاقة والموارد الطبيعية';
  if (text.includes('غذاء') || text.includes('أغذية') || text.includes('زراعة')) return 'الأغذية والمشروبات';
  if (text.includes('دواء') || text.includes('صحة') || text.includes('طب')) return 'الرعاية الصحية والأدوية';
  return 'الأخبار الاقتصادية';
}
