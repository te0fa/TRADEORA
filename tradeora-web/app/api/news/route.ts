import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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
      // STRICTLY filter by company_id when companyId is requested
      query = query.eq('company_id', companyId);
    } else if (symbol) {
      // STRICTLY filter by company symbol when symbol is requested
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
      sector_name: n.companies?.sector || n.sector_name || 'العقارات والإنشاءات',
      company_symbol: n.companies?.symbol || null
    }));

    return NextResponse.json({ success: true, news: enriched });
  } catch (err: any) {
    console.error('API /api/news error:', err);
    return NextResponse.json({ success: false, news: [] }, { status: 500 });
  }
}
