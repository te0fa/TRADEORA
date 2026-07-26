import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')
  const interval = parseInt(req.nextUrl.searchParams.get('interval') ?? '15')
  const daysBack = parseInt(req.nextUrl.searchParams.get('days') ?? '90')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || !symbol) {
    return NextResponse.json({ candles: [] })
  }

  const sb = createClient(supabaseUrl, supabaseKey)

  // 1. Get active company_id from symbol
  const { data: company } = await sb
    .from('companies')
    .select('id')
    .ilike('symbol', symbol.trim())
    .eq('status', 'active')
    .maybeSingle()

  if (!company) {
    return NextResponse.json({ candles: [] })
  }

  // 2. Handle Daily candles (1440 mins or 1d)
  if (interval >= 1440) {
    const { data: dailyPrices } = await sb
      .from('market_prices')
      .select('price_date, open_price, high_price, low_price, close_price, volume')
      .eq('company_id', company.id)
      .order('price_date', { ascending: true })
      .limit(1000)

    if (dailyPrices && dailyPrices.length > 0) {
      const formattedDaily = dailyPrices.map((d: any) => ({
        time: new Date(d.price_date).getTime() / 1000,
        open: parseFloat(d.open_price ?? d.close_price),
        high: parseFloat(d.high_price ?? d.close_price),
        low: parseFloat(d.low_price ?? d.close_price),
        close: parseFloat(d.close_price),
        volume: parseInt(d.volume ?? 0, 10)
      }))
      return NextResponse.json({ candles: formattedDaily })
    }
  }

  // 3. Determine intervalKey for intraday
  let intervalKey = '15m'
  if (interval === 30) intervalKey = '30m'
  else if (interval === 60) intervalKey = '1h'
  else if (interval === 240) intervalKey = '4h'

  // 4. Fetch exact source intraday snapshots
  const { data: tvSnapshots } = await sb
    .from('intraday_snapshots')
    .select('snapshot_time, open_price, high_price, low_price, price, volume')
    .eq('company_id', company.id)
    .eq('source', `tradingview_${intervalKey}`)
    .order('snapshot_time', { ascending: true })
    .limit(2000)

  if (tvSnapshots && tvSnapshots.length >= 10) {
    const formattedCandles = tvSnapshots.map((s: any) => ({
      time: new Date(s.snapshot_time).getTime() / 1000,
      open: parseFloat(s.open_price ?? s.price),
      high: parseFloat(s.high_price ?? s.price),
      low: parseFloat(s.low_price ?? s.price),
      close: parseFloat(s.price),
      volume: parseInt(s.volume ?? 0, 10),
    }))
    return NextResponse.json({ candles: formattedCandles })
  }

  // 5. Fallback: If exact higher interval missing, aggregate from 15m candles
  const { data: base15mSnapshots } = await sb
    .from('intraday_snapshots')
    .select('snapshot_time, open_price, high_price, low_price, price, volume')
    .eq('company_id', company.id)
    .eq('source', 'tradingview_15m')
    .order('snapshot_time', { ascending: true })
    .limit(2000)

  if (base15mSnapshots && base15mSnapshots.length > 0) {
    const raw15m = base15mSnapshots.map((s: any) => ({
      time: new Date(s.snapshot_time).getTime() / 1000,
      open: parseFloat(s.open_price ?? s.price),
      high: parseFloat(s.high_price ?? s.price),
      low: parseFloat(s.low_price ?? s.price),
      close: parseFloat(s.price),
      volume: parseInt(s.volume ?? 0, 10),
    }))

    if (interval === 15) {
      return NextResponse.json({ candles: raw15m })
    }

    // Aggregate 15m candles into 30m, 1h, 4h
    const groupSize = interval === 30 ? 2 : interval === 60 ? 4 : 16
    const aggregated: any[] = []
    for (let i = 0; i < raw15m.length; i += groupSize) {
      const chunk = raw15m.slice(i, i + groupSize)
      if (chunk.length === 0) continue
      const first = chunk[0]
      const last = chunk[chunk.length - 1]
      let maxHigh = chunk[0].high
      let minLow = chunk[0].low
      let sumVol = 0
      chunk.forEach(c => {
        if (c.high > maxHigh) maxHigh = c.high
        if (c.low < minLow) minLow = c.low
        sumVol += c.volume
      })
      aggregated.push({
        time: last.time,
        open: first.open,
        high: maxHigh,
        low: minLow,
        close: last.close,
        volume: sumVol
      })
    }
    return NextResponse.json({ candles: aggregated })
  }

  // 6. Final Fallback to RPC
  const { data: rpcCandles } = await sb
    .rpc('get_intraday_candles', {
      p_company_id: company.id,
      p_interval_minutes: interval,
      p_days_back: daysBack,
    })

  const formattedRpc = (rpcCandles ?? []).map((c: any) => ({
    time: new Date(c.candle_time).getTime() / 1000,
    open: parseFloat(c.open_price),
    high: parseFloat(c.high_price),
    low: parseFloat(c.low_price),
    close: parseFloat(c.close_price),
    volume: parseInt(c.volume ?? 0, 10),
  }))

  return NextResponse.json({ candles: formattedRpc })
}
