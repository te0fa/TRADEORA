import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Query companies with active status and joined fundamentals
    const { data: companies, error: coError } = await supabase
      .from('companies')
      .select('id, symbol, name_ar, name_en, sector, company_fundamentals(*)')
      .eq('status', 'active');

    if (coError) {
      throw coError;
    }

    // 2. Fetch latest prices for valuation
    const companyIds = (companies || []).map((c: any) => c.id);
    const { data: prices } = await supabase
      .from('market_prices')
      .select('company_id, close_price, price_date')
      .in('company_id', companyIds)
      .order('price_date', { ascending: false });

    const priceMap: Record<string, number> = {};
    (prices || []).forEach((p: any) => {
      if (!priceMap[p.company_id]) {
        priceMap[p.company_id] = parseFloat(p.close_price);
      }
    });

    // 3. Fetch latest news sentiment per company
    const { data: newsItems } = await supabase
      .from('company_news')
      .select('company_id, impact_score')
      .in('company_id', companyIds)
      .order('published_at', { ascending: false });

    const newsSentimentMap: Record<string, number> = {};
    if (newsItems) {
      const newsByCo: Record<string, number[]> = {};
      newsItems.forEach((n: any) => {
        if (!newsByCo[n.company_id]) newsByCo[n.company_id] = [];
        if (newsByCo[n.company_id].length < 5) {
          newsByCo[n.company_id].push(parseFloat(n.impact_score || '0'));
        }
      });
      Object.keys(newsByCo).forEach(cid => {
        const scores = newsByCo[cid];
        newsSentimentMap[cid] = scores.reduce((a, b) => a + b, 0) / scores.length;
      });
    }

    // 4. Compute 100-Point Investment Score per company
    const gems = (companies || []).map((co: any) => {
      const fundArr = co.company_fundamentals;
      const fund = Array.isArray(fundArr) && fundArr.length > 0 ? fundArr[0] : (fundArr || {});

      const currentPrice = priceMap[co.id] || parseFloat(fund.current_price || '0');
      const fairValue = parseFloat(fund.fair_value || '0');
      let upside = parseFloat(fund.upside_potential || '0');
      if (fairValue > 0 && currentPrice > 0 && upside === 0) {
        upside = ((fairValue - currentPrice) / currentPrice) * 100;
      }

      const divYield = parseFloat(fund.dividend_yield || '0');
      const peRatio = parseFloat(fund.pe_ratio || '0');
      const pbRatio = parseFloat(fund.pb_ratio || '0');

      // --- Score Component 1: Fundamentals (55 pts) ---
      let fundScore = 0;
      if (upside >= 50) fundScore += 30;
      else if (upside >= 30) fundScore += 24;
      else if (upside >= 20) fundScore += 18;
      else if (upside >= 10) fundScore += 10;

      if (divYield >= 10) fundScore += 15;
      else if (divYield >= 7.5) fundScore += 12;
      else if (divYield >= 5.0) fundScore += 8;
      else if (divYield >= 3.0) fundScore += 4;

      if (peRatio > 0 && peRatio <= 10) fundScore += 5;
      else if (peRatio > 0 && peRatio <= 15) fundScore += 3;

      if (pbRatio > 0 && pbRatio <= 1.5) fundScore += 5;
      else if (pbRatio > 0 && pbRatio <= 2.5) fundScore += 3;

      // --- Score Component 2: Weekly Trend Confirmation (30 pts) ---
      let techScore = 20; // Default baseline weekly confirmation

      // --- Score Component 3: AI News Sentiment (15 pts) ---
      let newsScore = 0;
      const sentiment = newsSentimentMap[co.id];
      if (sentiment !== undefined) {
        if (sentiment >= 0.25) newsScore = 10;
        else if (sentiment <= -0.25) newsScore = -15;
      }

      const totalScore = Math.min(Math.max(fundScore + techScore + newsScore, 0), 100);

      // Determine Investment Badges
      const badges = [];
      if (upside >= 25) {
        badges.push({ id: 'value_gem', text_ar: '💎 جوهرة قيمة', text_en: 'Value Gem' });
      }
      if (divYield >= 6.0) {
        badges.push({ id: 'high_dividend', text_ar: '💰 توزيعات عالية', text_en: 'High Dividend' });
      }
      if (peRatio > 0 && peRatio <= 10.0) {
        badges.push({ id: 'defensive_play', text_ar: '🛡️ ملاذ دفاعي', text_en: 'Defensive Play' });
      }

      const targetPrice1 = fairValue > currentPrice ? Math.min(fairValue, currentPrice * 1.35) : currentPrice * 1.25;
      const targetPrice2 = fairValue > 0 ? Math.max(fairValue, currentPrice * 1.5) : currentPrice * 1.4;
      const stopLoss = currentPrice * 0.85;

      return {
        id: co.id,
        symbol: co.symbol,
        name_ar: co.name_ar,
        name_en: co.name_en,
        sector: co.sector,
        current_price: currentPrice,
        fair_value: fairValue,
        upside_potential: parseFloat(upside.toFixed(1)),
        dividend_yield: parseFloat(divYield.toFixed(1)),
        pe_ratio: peRatio > 0 ? parseFloat(peRatio.toFixed(1)) : null,
        pb_ratio: pbRatio > 0 ? parseFloat(pbRatio.toFixed(1)) : null,
        investment_score: parseFloat(totalScore.toFixed(1)),
        badges,
        recommended_entry: currentPrice,
        target_price_1: parseFloat(targetPrice1.toFixed(2)),
        target_price_2: parseFloat(targetPrice2.toFixed(2)),
        stop_loss: parseFloat(stopLoss.toFixed(2)),
        timeframe: '1w',
        trade_style: 'long_term_investment',
        trade_style_ar: '🏛️ استثمار طويل الأجل (Value Gem)'
      };
    });

    // Filter qualified investment gems (Score >= 55) and sort by investment_score desc
    const qualifiedGems = gems
      .filter((g: any) => g.investment_score >= 55)
      .sort((a: any, b: any) => b.investment_score - a.investment_score);

    // Compute Summary Stats
    const totalGems = qualifiedGems.length;
    const avgYield = totalGems > 0 ? qualifiedGems.reduce((s: number, g: any) => s + g.dividend_yield, 0) / totalGems : 0;
    const maxUpsideGem = totalGems > 0 ? [...qualifiedGems].sort((a, b) => b.upside_potential - a.upside_potential)[0] : null;

    return NextResponse.json({
      gems: qualifiedGems,
      stats: {
        total_gems: totalGems,
        avg_dividend_yield: parseFloat(avgYield.toFixed(1)),
        top_upside_symbol: maxUpsideGem ? maxUpsideGem.symbol : null,
        top_upside_percent: maxUpsideGem ? maxUpsideGem.upside_potential : 0
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/long-term-investments:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
