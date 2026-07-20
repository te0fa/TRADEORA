import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { companyId, symbol, interval, timeframe } = await req.json();

    const tf = timeframe || (['15m', '30m'].includes(interval)
      ? '15m'
      : ['1h'].includes(interval)
      ? '1h'
      : ['4h'].includes(interval)
      ? '4h'
      : '1d');

    let targetCompanyId = companyId;

    // Resolve company_id from symbol if companyId was not provided directly
    if (!targetCompanyId && symbol) {
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('symbol', symbol.toUpperCase())
        .maybeSingle();

      if (company) {
        targetCompanyId = company.id;
      }
    }

    if (!targetCompanyId) {
      return NextResponse.json({ probability: null }, { status: 200 });
    }

    // Query latest stored prediction from the last 24 hours
    const { data, error } = await supabase
      .from('ml_predictions')
      .select('probability, signal_type, predicted_at')
      .eq('company_id', targetCompanyId)
      .eq('timeframe', tf)
      .gte('predicted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('predicted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching ML prediction from Supabase:', error);
      return NextResponse.json({ probability: null }, { status: 500 });
    }

    return NextResponse.json({
      probability: data?.probability ?? null,
      signalType: data?.signal_type ?? null,
      predictedAt: data?.predicted_at ?? null,
    });
  } catch (error) {
    console.error('ML Prediction API error:', error);
    return NextResponse.json(
      { probability: null },
      { status: 500 }
    );
  }
}
