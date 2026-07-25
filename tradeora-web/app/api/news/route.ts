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
    let query = sb.from('company_news').select('*').order('published_at', { ascending: false }).limit(limit);

    if (companyId) {
      query = query.or(`company_id.eq.${companyId},company_id.is.null`);
    } else if (symbol) {
      const { data: comp } = await sb.from('companies').select('id').ilike('symbol', symbol).maybeSingle();
      if (comp?.id) {
        query = query.or(`company_id.eq.${comp.id},company_id.is.null`);
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

    return NextResponse.json({ success: true, news: newsItems || [] });
  } catch (err: any) {
    console.error('API /api/news error:', err);
    return NextResponse.json({ success: false, news: [] }, { status: 500 });
  }
}
