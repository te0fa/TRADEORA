import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Find company by symbol
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, sector')
      .eq('symbol', symbol.toUpperCase())
      .maybeSingle();

    if (companyError || !company) {
      return NextResponse.json({ 
        success: true, 
        sentimentScore: 0.0, 
        sectorSentimentScore: 0.0, 
        macroScores: { fx: 0.0, rate: 0.0, geo: 0.0 } 
      });
    }

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const fiveDaysAgoStr = fiveDaysAgo.toISOString();

    const _sevenDaysAgo = new Date();
    _sevenDaysAgo.setDate(_sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = _sevenDaysAgo.toISOString();

    // 1. Fetch corporate news for this company
    const { data: corpNews } = await supabase
      .from('company_news')
      .select('sentiment')
      .eq('company_id', company.id)
      .eq('category', 'corporate')
      .gte('published_at', fiveDaysAgoStr);

    let sentimentScore = 0.0;
    if (corpNews && corpNews.length > 0) {
      const pos = corpNews.filter(n => n.sentiment === 'positive').length;
      const neg = corpNews.filter(n => n.sentiment === 'negative').length;
      sentimentScore = (pos - neg) / corpNews.length;
    }

    // 2. Fetch sector corporate news
    // Get all company IDs in same sector
    const { data: sectorCompanies } = await supabase
      .from('companies')
      .select('id')
      .eq('sector', company.sector);
      
    let sectorSentimentScore = 0.0;
    if (sectorCompanies && sectorCompanies.length > 0) {
      const coIds = sectorCompanies.map(c => c.id);
      const { data: sectorNews } = await supabase
        .from('company_news')
        .select('sentiment')
        .in('company_id', coIds)
        .eq('category', 'corporate')
        .gte('published_at', fiveDaysAgoStr);

      if (sectorNews && sectorNews.length > 0) {
        const pos = sectorNews.filter(n => n.sentiment === 'positive').length;
        const neg = sectorNews.filter(n => n.sentiment === 'negative').length;
        sectorSentimentScore = (pos - neg) / sectorNews.length;
      }
    }

    // 3. Fetch macro news
    const { data: macroNews } = await supabase
      .from('company_news')
      .select('category, sentiment')
      .in('category', ['macro_fx', 'macro_rate', 'macro_geopolitical'])
      .gte('published_at', sevenDaysAgoStr);

    const macroScores = { fx: 0.0, rate: 0.0, geo: 0.0 };
    if (macroNews && macroNews.length > 0) {
      for (const cat of ['macro_fx', 'macro_rate', 'macro_geopolitical'] as const) {
        const catNews = macroNews.filter(n => n.category === cat);
        if (catNews.length > 0) {
          const pos = catNews.filter(n => n.sentiment === 'positive').length;
          const neg = catNews.filter(n => n.sentiment === 'negative').length;
          const key = cat === 'macro_fx' ? 'fx' : cat === 'macro_rate' ? 'rate' : 'geo';
          macroScores[key] = (pos - neg) / catNews.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      sentimentScore,
      sectorSentimentScore,
      macroScores
    });
  } catch (error: any) {
    console.error('Error in GET /api/news-sentiment:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
