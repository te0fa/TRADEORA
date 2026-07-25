import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')
  const interval = parseInt(req.nextUrl.searchParams.get('interval') ?? '15')
  const daysBack = parseInt(req.nextUrl.searchParams.get('days') ?? '60')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in Next.js backend.")
    return NextResponse.json({ candles: [] })
  }

  const sb = createClient(supabaseUrl, supabaseKey)

  // 1. Get company_id from symbol
  const { data: company, error: companyErr } = await sb
    .from('companies')
    .select('id')
    .ilike('symbol', symbol!)
    .single()

  if (!company || companyErr) {
    return NextResponse.json({ candles: [] })
  }

  let intervalKey = '15m';
  if (interval === 30) intervalKey = '30m';
  else if (interval === 60) intervalKey = '1h';
  else if (interval === 240) intervalKey = '4h';

  // 1. Try fetching authentic TradingView OHLC candles directly
  const { data: tvSnapshots } = await sb
    .from('intraday_snapshots')
    .select('snapshot_time, open_price, high_price, low_price, price, volume')
    .eq('company_id', company.id)
    .eq('source', `tradingview_${intervalKey}`)
    .order('snapshot_time', { ascending: true })
    .limit(2000);

  if (tvSnapshots && tvSnapshots.length > 0) {
    const formattedCandles = tvSnapshots.map((s: any) => ({
      time: new Date(s.snapshot_time).getTime() / 1000,
      open: parseFloat(s.open_price ?? s.price),
      high: parseFloat(s.high_price ?? s.price),
      low: parseFloat(s.low_price ?? s.price),
      close: parseFloat(s.price),
      volume: parseInt(s.volume ?? 0, 10),
    }));
    return NextResponse.json({ candles: formattedCandles });
  }

  // 2. Fallback to RPC
  const { data: candles, error: rpcErr } = await sb
    .rpc('get_intraday_candles', {
      p_company_id: company.id,
      p_interval_minutes: interval,
      p_days_back: daysBack,
    })

  if (rpcErr) {
    console.error("RPC Error:", rpcErr)
    return NextResponse.json({ candles: [] })
  }

  // Map to lightweight-charts expected format
  const formattedCandles = (candles ?? []).map((c: any) => ({
    time: new Date(c.candle_time).getTime() / 1000,
    open: parseFloat(c.open_price),
    high: parseFloat(c.high_price),
    low: parseFloat(c.low_price),
    close: parseFloat(c.close_price),
    volume: parseInt(c.volume ?? 0, 10),
  }))

  return NextResponse.json({ candles: formattedCandles })
}
