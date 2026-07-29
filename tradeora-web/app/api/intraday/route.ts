import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')
  const interval = parseInt(req.nextUrl.searchParams.get('interval') ?? '15')
  const daysBack = parseInt(req.nextUrl.searchParams.get('days') ?? '90')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || !symbol) {
    return NextResponse.json({ candles: [], source: 'none', count: 0, fallback: true })
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
    return NextResponse.json({ candles: [], source: 'none', count: 0, fallback: true })
  }

  // 2. Handle Daily candles (1440 mins or 1d)
  if (interval >= 1440) {
    const { data: dailyPrices } = await sb
      .from('market_prices')
      .select('price_date, open_price, high_price, low_price, close_price, volume, source')
      .eq('company_id', company.id)
      .in('source', ['tradingview_1d', 'tradingview', 'egx_bulletin', 'yahoo_historical', 'yahoo_live'])
      .order('price_date', { ascending: true })
      .limit(1000)

    if (dailyPrices && dailyPrices.length >= 10) {
      // Group by dateStr, giving 100% priority to tradingview source
      const dateMap: Record<string, any> = {}
      for (const d of dailyPrices) {
        const dateStr = d.price_date.split('T')[0]
        const isTv = d.source === 'tradingview_1d' || d.source === 'tradingview'
        if (!dateMap[dateStr] || isTv) {
          dateMap[dateStr] = d
        }
      }

      const sortedDates = Object.keys(dateMap).sort()
      const formattedDaily: any[] = []

      for (const dateStr of sortedDates) {
        const d = dateMap[dateStr]
        const close = parseFloat(d.close_price)
        const open = parseFloat(d.open_price ?? d.close_price)
        const high = parseFloat(d.high_price ?? d.close_price)
        const low = parseFloat(d.low_price ?? d.close_price)

        if (isNaN(close) || close <= 0) continue

        formattedDaily.push({
          time: dateStr, // YYYY-MM-DD string format required by Lightweight Charts for 1D!
          open: open > 0 ? open : close,
          high: Math.max(high, open, close),
          low: Math.min(low > 0 ? low : close, open, close),
          close: close,
          volume: parseInt(d.volume ?? 0, 10)
        })
      }

      if (formattedDaily.length >= 10) {
        return NextResponse.json({
          candles: formattedDaily,
          source: 'tradingview',
          count: formattedDaily.length,
          fallback: false
        })
      }
    }

    return NextResponse.json({ candles: [], source: 'none', count: 0, fallback: true })
  }

  // 3. Determine intervalKey for intraday & priority sources
  let intervalKey = '15m'
  if (interval === 1) intervalKey = '1m'
  else if (interval === 5) intervalKey = '5m'
  else if (interval === 30) intervalKey = '30m'
  else if (interval === 60) intervalKey = '1h'
  else if (interval === 240) intervalKey = '4h'

  // Priority: official Canonical intraday sources
  const CANONICAL_SOURCES_INTRADAY = [
    'tradingview_15m',
    'tradingview_30m',
    'tradingview_1h',
    'tradingview_4h',
    'tradingview_1d',
  ]

  // 4. Fetch exact source intraday snapshots
  const { data: tvSnapshots } = await sb
    .from('intraday_snapshots')
    .select('snapshot_time, open_price, high_price, low_price, price, volume, source')
    .eq('company_id', company.id)
    .in('source', CANONICAL_SOURCES_INTRADAY)
    .order('snapshot_time', { ascending: true })
    .limit(2000)

  // Filter exact interval snapshots
  const exactKeySnapshots = (tvSnapshots || []).filter(s => s.source === `tradingview_${intervalKey}`)

  if (exactKeySnapshots && exactKeySnapshots.length >= 10) {
    const seenTimes = new Set<number>()
    const formattedCandles: any[] = []

    for (const s of exactKeySnapshots) {
      const timeSec = Math.floor(new Date(s.snapshot_time).getTime() / 1000)
      if (seenTimes.has(timeSec)) continue
      seenTimes.add(timeSec)

      const close = parseFloat(s.price)
      const open = parseFloat(s.open_price ?? s.price)
      const high = parseFloat(s.high_price ?? s.price)
      const low = parseFloat(s.low_price ?? s.price)

      if (isNaN(close) || close <= 0) continue

      formattedCandles.push({
        time: timeSec, // Unix timestamp in seconds for intraday!
        open: open > 0 ? open : close,
        high: Math.max(high, open, close),
        low: Math.min(low > 0 ? low : close, open, close),
        close: close,
        volume: parseInt(s.volume ?? 0, 10),
      })
    }

    if (formattedCandles.length >= 10) {
      return NextResponse.json({
        candles: formattedCandles,
        source: 'tradingview',
        count: formattedCandles.length,
        fallback: false
      })
    }
  }

  // 5. Fallback: Aggregate from 15m candles
  const base15mSnapshots = (tvSnapshots || []).filter(s => s.source === 'tradingview_15m')

  if (base15mSnapshots && base15mSnapshots.length >= 10) {
    const seenTimes = new Set<number>()
    const raw15m: any[] = []

    for (const s of base15mSnapshots) {
      const timeSec = Math.floor(new Date(s.snapshot_time).getTime() / 1000)
      if (seenTimes.has(timeSec)) continue
      seenTimes.add(timeSec)

      const close = parseFloat(s.price)
      const open = parseFloat(s.open_price ?? s.price)
      const high = parseFloat(s.high_price ?? s.price)
      const low = parseFloat(s.low_price ?? s.price)

      if (isNaN(close) || close <= 0) continue

      raw15m.push({
        time: timeSec,
        open: open > 0 ? open : close,
        high: Math.max(high, open, close),
        low: Math.min(low > 0 ? low : close, open, close),
        close: close,
        volume: parseInt(s.volume ?? 0, 10),
      })
    }

    if (interval === 1 || interval === 15) {
      if (raw15m.length >= 10) {
        return NextResponse.json({
          candles: raw15m,
          source: 'tradingview',
          count: raw15m.length,
          fallback: false
        })
      }
    } else {
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
        // BUG FIX: Use first candle time, not last
        aggregated.push({
          time: first.time,
          open: first.open,
          high: maxHigh,
          low: minLow,
          close: last.close,
          volume: sumVol
        })
      }

      if (aggregated.length >= 10) {
        return NextResponse.json({
          candles: aggregated,
          source: 'tradingview',
          count: aggregated.length,
          fallback: false
        })
      }
    }
  }

  // If result is less than 10 candles, do not fallback here or mix sources.
  // Leave fallback to frontend (Yahoo).
  return NextResponse.json({
    candles: [],
    source: 'none',
    count: 0,
    fallback: true
  })
}
