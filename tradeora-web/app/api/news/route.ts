import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function classifyNewsSector(n: any): string {
  if (n.companies?.sector) return n.companies.sector;
  if (n.sector_name && n.sector_name !== 'العقارات والإنشاءات') return n.sector_name;

  const text = `${n.title || ''} ${n.content || ''}`.toLowerCase();
  
  if (text.includes('أدوية') || text.includes('دواء') || text.includes('فارما') || text.includes('صيدل') || text.includes('رعاية صحية')) {
    return 'الرعاية الصحية والأدوية';
  }
  if (text.includes('اتصالات') || text.includes('فودافون') || text.includes('أورنج') || text.includes('تكنولوجيا') || text.includes('شبك')) {
    return 'الاتصالات والتكنولوجيا';
  }
  if (text.includes('بنك') || text.includes('بنوك') || text.includes('فائدة') || text.includes('مركزي') || text.includes('مالي') || text.includes('تمويل')) {
    return 'البنوك والخدمات المالية';
  }
  if (text.includes('غاز') || text.includes('بترول') || text.includes('طاقة') || text.includes('كهرباء') || text.includes('نفط') || text.includes('دانة')) {
    return 'الطاقة والموارد الطبيعية';
  }
  if (text.includes('عقار') || text.includes('إسكان') || text.includes('بناء') || text.includes('تطوير') || text.includes('تنمي') || text.includes('طلعت')) {
    return 'العقارات والإنشاءات';
  }
  if (text.includes('سياحة') || text.includes('فندق') || text.includes('فنادق') || text.includes('إيكون')) {
    return 'السياحة والترفيه';
  }
  if (text.includes('غذائ') || text.includes('أغذية') || text.includes('مشروبات') || text.includes('زراع') || text.includes('محاصيل')) {
    return 'الأغذية والمشروبات';
  }
  if (text.includes('بورصة') || text.includes('إجازة') || text.includes('مؤشر') || text.includes('جلسة') || text.includes('ارتفاعات') || text.includes('ضرائب')) {
    return 'الأخبار الاقتصادية الكلية';
  }
  
  return 'الأخبار الاقتصادية الكلية';
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const companyId = searchParams.get('companyId');
  const symbol = searchParams.get('symbol');
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '30');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ success: false, news: [] }, { status: 500 });
  }

  const sb = createClient(supabaseUrl, supabaseKey);

  try {
    let query = sb.from('company_news').select('*, companies(id, symbol, name_ar, sector)').order('published_at', { ascending: false }).limit(limit);

    if (companyId) {
      query = query.eq('company_id', companyId);
    } else if (symbol) {
      const { data: comp } = await sb.from('companies').select('id').ilike('symbol', symbol).maybeSingle();
      if (comp?.id) {
        query = query.eq('company_id', comp.id);
      } else {
        return NextResponse.json({ success: true, news: [] });
      }
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: newsItems, error } = await query;

    if (error) {
      console.error('Error fetching news:', error);
      return NextResponse.json({ success: false, news: [] }, { status: 500 });
    }

    const enriched = (newsItems || []).map((n: any) => ({
      ...n,
      sector_name: classifyNewsSector(n),
      company_symbol: n.companies?.symbol || null
    }));

    return NextResponse.json({ success: true, news: enriched });
  } catch (err: any) {
    console.error('API /api/news error:', err);
    return NextResponse.json({ success: false, news: [] }, { status: 500 });
  }
}
