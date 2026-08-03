import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const symbol   = req.nextUrl.searchParams.get('symbol')
  const interval = parseInt(req.nextUrl.searchParams.get('interval') ?? '15')
  const daysBack = parseInt(req.nextUrl.searchParams.get('days') ?? '90')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || !symbol) {
    return NextResponse.json({ candles: [], source: 'none', count: 0, fallback: true })
  }

  const sb = createClient(supabaseUrl, supabaseKey)

  // ── Cairo time helpers ────────────────────────────────────────────────────
  const getCairoDateStr = (): string =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())

  const getCairoHour = (): number =>
    parseInt(new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Cairo', hour: 'numeric', hour12: false
    }).format(new Date()))

async function fetchYahoo(ticker: string, yInterval: string, range: string): Promise<any[] | null> {
  const YAHOO_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
  }
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${yInterval}&range=${range}&events=div,splits`
    const res = await fetch(url, { headers: YAHOO_HEADERS, next: { revalidate: 30 } })
    if (!res.ok) return null
    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result?.timestamp || !result?.indicators?.quote?.[0]) return null

    const timestamps = result.timestamp as number[]
    const quote = result.indicators.quote[0]
    const candles: any[] = []

    for (let i = 0; i < timestamps.length; i++) {
      const close  = quote.close?.[i]
      const open   = quote.open?.[i]
      const high   = quote.high?.[i]
      const low    = quote.low?.[i]
      const vol    = quote.volume?.[i] ?? 0
      const ts     = timestamps[i]

      if (!ts || !close || isNaN(close) || close <= 0) continue

      candles.push({
        time: ts,
        open:   open  ?? close,
        high:   high  ?? close,
        low:    low   ?? close,
        close,
        volume: vol,
      })
    }

    return candles.length > 0 ? candles : null
  } catch (e) {
    console.error('[intraday] Yahoo fetch error:', e)
    return null
  }
}


  // ── 1. Resolve company_id ─────────────────────────────────────────────────
  const { data: company } = await sb
    .from('companies')
    .select('id, symbol')
    .ilike('symbol', symbol.trim())
    .eq('status', 'active')
    .maybeSingle()

  if (!company) {
    return NextResponse.json({ candles: [], source: 'none', count: 0, fallback: true })
  }

  // ── 2. Daily candles ──────────────────────────────────────────────────────
  if (interval >= 1440) {
    const { data: dailyPrices } = await sb
      .from('market_prices')
      .select('price_date, open_price, high_price, low_price, close_price, volume, source')
      .eq('company_id', company.id)
      .in('source', ['tradingview_1d', 'tradingview', 'egx_bulletin', 'yahoo_historical', 'yahoo_live'])
      .order('price_date', { ascending: true })
      .limit(1000)

    if (dailyPrices && dailyPrices.length >= 10) {
      const dateMap: Record<string, any> = {}
      for (const d of dailyPrices) {
        const dateStr = d.price_date.split('T')[0]
        const isTv = d.source === 'tradingview_1d' || d.source === 'tradingview'
        if (!dateMap[dateStr] || isTv) dateMap[dateStr] = d
      }

      const formattedDaily: any[] = []
      for (const dateStr of Object.keys(dateMap).sort()) {
        const d = dateMap[dateStr]
        const close = parseFloat(d.close_price)
        const open  = parseFloat(d.open_price ?? d.close_price)
        const high  = parseFloat(d.high_price ?? d.close_price)
        const low   = parseFloat(d.low_price  ?? d.close_price)
        if (isNaN(close) || close <= 0) continue

        formattedDaily.push({
          time: dateStr,
          open: open > 0 ? open : close,
          high: Math.max(high, open, close),
          low:  Math.min(low > 0 ? low : close, open, close),
          close,
          volume: parseInt(d.volume ?? 0, 10),
        })
      }

      if (formattedDaily.length >= 10) {
        return NextResponse.json({ candles: formattedDaily, source: 'tradingview', count: formattedDaily.length, fallback: false })
      }
    }
    return NextResponse.json({ candles: [], source: 'none', count: 0, fallback: true })
  }

  // ── 3. Intraday interval key ──────────────────────────────────────────────
  let intervalKey = '15m'
  if (interval === 1)   intervalKey = '1m'
  else if (interval === 5)   intervalKey = '5m'
  else if (interval === 30)  intervalKey = '30m'
  else if (interval === 60)  intervalKey = '1h'
  else if (interval === 240) intervalKey = '4h'

  const CANONICAL_SOURCES_INTRADAY = [
    'tradingview_15m', 'yahoo_15m',
    'tradingview_30m', 'yahoo_30m',
    'tradingview_1h',  'yahoo_1h',
    'tradingview_4h',  'yahoo_4h',
    'tradingview_5m',  'yahoo_5m',
    'tradingview_1d',  'yahoo_1d',
  ]

  // ── 4. Fetch from intraday_snapshots ──────────────────────────────────────
  const { data: tvSnapshots } = await sb
    .from('intraday_snapshots')
    .select('snapshot_time, open_price, high_price, low_price, price, volume, source')
    .eq('company_id', company.id)
    .in('source', CANONICAL_SOURCES_INTRADAY)
    .order('snapshot_time', { ascending: true })
    .limit(2000)

  const exactKeySnapshots = (tvSnapshots || []).filter(s =>
    s.source === `tradingview_${intervalKey}` || s.source === `yahoo_${intervalKey}`
  )

  const parseSnapshots = (snaps: any[]): any[] => {
    const seen = new Set<number>()
    const result: any[] = []
    for (const s of snaps) {
      const timeSec = Math.floor(new Date(s.snapshot_time).getTime() / 1000)
      if (seen.has(timeSec)) continue
      seen.add(timeSec)
      const close = parseFloat(s.price)
      const open  = parseFloat(s.open_price ?? s.price)
      const high  = parseFloat(s.high_price ?? s.price)
      const low   = parseFloat(s.low_price  ?? s.price)
      if (isNaN(close) || close <= 0) continue
      result.push({
        time: timeSec,
        open:   open  > 0 ? open  : close,
        high:   Math.max(high, open, close),
        low:    Math.min(low > 0 ? low : close, open, close),
        close,
        volume: parseInt(s.volume ?? 0, 10),
      })
    }
    return result
  }

  let dbCandles: any[] = []

  if (exactKeySnapshots.length >= 10) {
    dbCandles = parseSnapshots(exactKeySnapshots)
  }

  // Fallback: aggregate from 15m
  if (dbCandles.length < 10) {
    const base15m = (tvSnapshots || []).filter(s => s.source === 'tradingview_15m')
    const raw15m  = parseSnapshots(base15m)

    if (raw15m.length >= 10) {
      if (interval <= 15) {
        dbCandles = raw15m
      } else {
        const groupSize = interval === 30 ? 2 : interval === 60 ? 4 : 16
        const aggregated: any[] = []
        for (let i = 0; i < raw15m.length; i += groupSize) {
          const chunk = raw15m.slice(i, i + groupSize)
          if (!chunk.length) continue
          const first = chunk[0]
          const last  = chunk[chunk.length - 1]
          aggregated.push({
            time:   first.time,
            open:   first.open,
            high:   Math.max(...chunk.map(c => c.high)),
            low:    Math.min(...chunk.map(c => c.low)),
            close:  last.close,
            volume: chunk.reduce((s, c) => s + c.volume, 0),
          })
        }
        if (aggregated.length >= 10) dbCandles = aggregated
      }
    }
  }

  // ── 5. Inject today's live data (Yahoo) if last candle is stale ──────────
  const cairoDateStr = getCairoDateStr()
  const cairoHour    = getCairoHour()
  const isMarketOpen = cairoHour >= 10 && cairoHour < 16

  const lastCandleTime = dbCandles.length > 0 ? dbCandles[dbCandles.length - 1].time : 0
  const lastCandleDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' })
    .format(new Date(lastCandleTime * 1000))
  const isStale = lastCandleDate < cairoDateStr

  if (isStale || isMarketOpen) {
    // Build Yahoo ticker for EGX symbol
    const yahooTicker = symbol.includes('.CA') ? symbol : `${symbol}.CA`
    const yInterval   = interval <= 5  ? '5m'
                      : interval <= 15 ? '15m'
                      : interval <= 30 ? '30m'
                      : interval <= 60 ? '60m' : '60m'

    const yCandles = await fetchYahoo(yahooTicker, yInterval, '5d')

    if (yCandles && yCandles.length > 0) {
      // Merge: filter out timestamps already in dbCandles, keep today's
      const existingTimes = new Set(dbCandles.map(c => c.time))
      const todayStart    = new Date(cairoDateStr + 'T00:00:00+03:00').getTime() / 1000

      const newCandles = yCandles.filter(c =>
        !existingTimes.has(c.time) && c.time >= todayStart
      )

      if (newCandles.length > 0) {
        dbCandles = [...dbCandles, ...newCandles].sort((a, b) => a.time - b.time)
      }
    }
  }

  // ── 6. Return result ──────────────────────────────────────────────────────
  if (dbCandles.length >= 5) {
    return NextResponse.json({
      candles: dbCandles,
      source: 'tradingview',
      count: dbCandles.length,
      fallback: false,
      lastCandleDate,
      todayInjected: isStale || isMarketOpen,
    })
  }

  return NextResponse.json({ candles: [], source: 'none', count: 0, fallback: true })
}
