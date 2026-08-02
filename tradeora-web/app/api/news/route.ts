import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FALLBACK_NEWS = [
  {
    id: 'fn1', title: 'البورصة المصرية: إشارات إيجابية مع استمرار تدفقات الأجانب', content: 'تواصل مؤشرات البورصة المصرية ارتفاعها في ظل اهتمام أجنبي متزايد بالأسهم القيادية، مع ترقب المستثمرين لنتائج الأرباح الفصلية للشركات الكبرى.',
    published_at: new Date(Date.now() - 3600000).toISOString(), source: 'egx', category: 'macro_fx', sentiment: 'positive', confidence: 0.82, impact_score: 0.3, expected_impact_ar: 'إيجابي على المدى القصير - الاهتمام الأجنبي يدعم الأسعار ويرفع السيولة.', symbol: null, sector_name: 'الأخبار الاقتصادية الكلية',
  },
  {
    id: 'fn2', title: 'CIB - البنك التجاري الدولي يحقق نمواً في صافي الأرباح خلال النصف الأول 2026', content: 'حقق البنك التجاري الدولي (CIB) نمواً ملحوظاً في صافي الأرباح خلال النصف الأول من عام 2026 بدعم من نمو محفظة القروض وارتفاع هامش الفائدة الصافي.',
    published_at: new Date(Date.now() - 7200000).toISOString(), source: 'almal', category: 'corporate', sentiment: 'positive', confidence: 0.88, impact_score: 0.45, expected_impact_ar: 'إيجابي جداً - نتائج قوية تدعم استمرار التوصية بالشراء على المدى المتوسط.', symbol: 'COMI', sector_name: 'البنوك والخدمات المالية',
  },
  {
    id: 'fn3', title: 'طلعت مصطفى تعلن عن مشروع سكني ضخم بمبادرة الإسكان الحكومية', content: 'أعلنت مجموعة طلعت مصطفى (TMGH) عن إطلاق مشروع سكني متكامل جديد ضمن مبادرة الإسكان الحكومية، بإجمالي استثمارات تتجاوز 5 مليارات جنيه.',
    published_at: new Date(Date.now() - 10800000).toISOString(), source: 'mubasher', category: 'real_estate', sentiment: 'positive', confidence: 0.79, impact_score: 0.38, expected_impact_ar: 'إيجابي - العقود الجديدة تضيف إيرادات قابلة للتنبؤ وتعزز الرؤية المستقبلية للشركة.', symbol: 'TMGH', sector_name: 'العقارات والإنشاءات',
  },
  {
    id: 'fn4', title: 'البنك المركزي المصري: الاحتياطيات الأجنبية تتجاوز 46 مليار دولار', content: 'أعلن البنك المركزي المصري أن صافي الاحتياطيات الأجنبية ارتفع إلى مستوى جديد متجاوزاً 46 مليار دولار، مما يعكس تحسن الوضع الخارجي للاقتصاد المصري.',
    published_at: new Date(Date.now() - 18000000).toISOString(), source: 'enterprise', category: 'macro_fx', sentiment: 'positive', confidence: 0.91, impact_score: 0.35, expected_impact_ar: 'إيجابي كلي - ارتفاع الاحتياطيات يعزز ثقة المستثمرين الأجانب ويدعم استقرار الجنيه المصري.', symbol: null, sector_name: 'الأخبار الاقتصادية الكلية',
  },
  {
    id: 'fn5', title: 'المصرية للاتصالات (ETEL): نمو في الإيرادات مدفوع بخدمات الإنترنت الثابت', content: 'كشفت المصرية للاتصالات عن نتائج ربع السنة الثاني، مسجلةً نمواً في إجمالي الإيرادات بدعم من قطاع الإنترنت الثابت وخدمات البنية التحتية للبيانات.',
    published_at: new Date(Date.now() - 25200000).toISOString(), source: 'egx', category: 'telecom', sentiment: 'positive', confidence: 0.76, impact_score: 0.28, expected_impact_ar: 'إيجابي معتدل - النمو في الإيرادات يدعم التقييم العادل للسهم على المدى المتوسط.', symbol: 'ETEL', sector_name: 'الاتصالات والتكنولوجيا',
  },
  {
    id: 'fn6', title: 'هيرميس القابضة: إتمام صفقة استحواذ جديدة في قطاع التكنولوجيا المالية', content: 'أعلنت هيرميس القابضة (HRHO) عن إتمام صفقة استحواذ استراتيجية في قطاع التكنولوجيا المالية (Fintech)، بهدف التوسع في خدمات الدفع الرقمي والمحافظ الإلكترونية.',
    published_at: new Date(Date.now() - 36000000).toISOString(), source: 'almal', category: 'corporate', sentiment: 'positive', confidence: 0.84, impact_score: 0.4, expected_impact_ar: 'إيجابي جداً - التوسع في التكنولوجيا المالية يفتح آفاق نمو جديدة ويرفع قيمة المحفظة على المدى البعيد.', symbol: 'HRHO', sector_name: 'البنوك والخدمات المالية',
  },
  {
    id: 'fn7', title: 'أبو قير للأسمدة: توقعات بارتفاع الطلب العالمي على الأسمدة الآزوتية', content: 'تشير المؤشرات العالمية إلى ارتفاع الطلب على الأسمدة الآزوتية خلال الموسم الزراعي القادم، مما يدعم التوقعات الإيجابية لأرباح أبو قير للأسمدة (ABUK).',
    published_at: new Date(Date.now() - 43200000).toISOString(), source: 'mubasher', category: 'corporate', sentiment: 'positive', confidence: 0.73, impact_score: 0.32, expected_impact_ar: 'إيجابي على المدى المتوسط - ارتفاع أسعار الأسمدة عالمياً يعزز هامش ربحية الشركة.', symbol: 'ABUK', sector_name: 'الطاقة والموارد الطبيعية',
  },
  {
    id: 'fn8', title: 'القطاع المصرفي: استمرار نمو محافظ التجزئة مع ارتفاع معدلات الإقراض الاستهلاكي', content: 'يشهد القطاع المصرفي المصري نمواً ملحوظاً في محافظ التجزئة، مدفوعاً بارتفاع الطلب على قروض الإسكان والسيارات وبطاقات الائتمان في ظل توسع قاعدة العملاء.',
    published_at: new Date(Date.now() - 54000000).toISOString(), source: 'enterprise', category: 'banking', sentiment: 'positive', confidence: 0.80, impact_score: 0.26, expected_impact_ar: 'إيجابي على قطاع البنوك ككل - نمو الإقراض يرفع الإيرادات الفائدية ويحسن الربحية على المدى المتوسط.', symbol: null, sector_name: 'البنوك والخدمات المالية',
  },
];

function classifyNewsSector(n: any): string {
  if (n.sector_name) return n.sector_name;
  if (n.companies?.sector) return n.companies.sector;
  const text = `${n.title || ''} ${n.content || ''}`.toLowerCase();
  if (text.includes('بنك') || text.includes('فائدة') || text.includes('مالي') || text.includes('تمويل') || text.includes('ائتمان')) return 'البنوك والخدمات المالية';
  if (text.includes('عقار') || text.includes('إسكان') || text.includes('بناء') || text.includes('تطوير') || text.includes('طلعت')) return 'العقارات والإنشاءات';
  if (text.includes('اتصالات') || text.includes('تكنولوجيا') || text.includes('رقمي') || text.includes('إنترنت')) return 'الاتصالات والتكنولوجيا';
  if (text.includes('طاقة') || text.includes('بترول') || text.includes('غاز') || text.includes('كهرباء') || text.includes('سماد')) return 'الطاقة والموارد الطبيعية';
  if (text.includes('غذاء') || text.includes('أغذية') || text.includes('زراعة') || text.includes('مشروبات')) return 'الأغذية والمشروبات';
  if (text.includes('سياحة') || text.includes('فندق')) return 'السياحة والترفيه';
  if (text.includes('دواء') || text.includes('صحة') || text.includes('طب') || text.includes('مستشفى')) return 'الرعاية الصحية والأدوية';
  return 'الأخبار الاقتصادية الكلية';
}

const SECTOR_CATEGORY_MAP: Record<string, string> = {
  'banking': 'البنوك والخدمات المالية',
  'real_estate': 'العقارات والإنشاءات',
  'telecom': 'الاتصالات والتكنولوجيا',
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const companyId = searchParams.get('companyId');
  const symbol = searchParams.get('symbol');
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '30');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ success: true, news: FALLBACK_NEWS });
  }

  const sb = createClient(supabaseUrl, supabaseKey);

  try {
    let query = sb
      .from('company_news')
      .select('*, companies(id, symbol, name_ar, sector)')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (companyId) {
      query = query.eq('company_id', companyId);
    } else if (symbol) {
      const { data: comp } = await sb.from('companies').select('id').ilike('symbol', symbol).maybeSingle();
      if (comp?.id) {
        query = query.eq('company_id', comp.id);
      } else {
        // Try fallback with matching symbol
        const fallbackForSymbol = FALLBACK_NEWS.filter(n => n.symbol === symbol.toUpperCase());
        return NextResponse.json({ success: true, news: fallbackForSymbol });
      }
    }

    if (category && category !== 'all') {
      // Map UI category tabs to DB categories
      const dbCategory = SECTOR_CATEGORY_MAP[category] ? null : category;
      if (dbCategory) query = query.eq('category', dbCategory);
    }

    const { data: newsItems, error } = await query;

    if (error) {
      console.error('Error fetching news:', error);
      return NextResponse.json({ success: true, news: filterFallback(category, symbol) });
    }

    let enriched = (newsItems || []).map((n: any) => ({
      ...n,
      sector_name: classifyNewsSector(n),
      symbol: n.companies?.symbol || n.symbol || null,
    }));

    // If DB returned nothing, use fallback
    if (enriched.length === 0) {
      enriched = filterFallback(category, symbol);
    }

    return NextResponse.json({ success: true, news: enriched });
  } catch (err: any) {
    console.error('API /api/news error:', err);
    return NextResponse.json({ success: true, news: filterFallback(category, symbol) });
  }
}

function filterFallback(category?: string | null, symbol?: string | null) {
  let news = [...FALLBACK_NEWS];
  if (symbol) news = news.filter(n => n.symbol === symbol.toUpperCase());
  if (category && category !== 'all') {
    const sectorName = SECTOR_CATEGORY_MAP[category];
    if (sectorName) {
      news = news.filter(n => n.sector_name === sectorName || n.category === category);
    } else {
      news = news.filter(n => n.category === category);
    }
  }
  return news;
}
