# TRADINGVIEW SOURCE VERIFICATION AUDIT REPORT
## Enterprise Trading Infrastructure & Market Data Architecture Audit

**Auditor:** Senior Trading Infrastructure Auditor, TradingView Integration Specialist, & Market Data Architecture Investigator  
**Audit Date:** 2026-07-30  
**Audit Classification:** SOURCE VERIFICATION AUDIT — EVIDENCE ONLY  
**Target Codebase:** Tradeora (`e:\zaora\TRADEORA`)  
**Scope:** Read-Only Source Code Forensics & Verification  

---

## EXECUTIVE SUMMARY & OBJECTIVE

### Objective

Determine with absolute certainty:

**IS TRADINGVIEW THE ACTUAL MARKET DATA SOURCE OR IS TRADINGVIEW ONLY A CHART RENDERER?**

### Audit Findings Summary

1. **Chart Rendering Library:** TradingView is integrated **ONLY** as an open-source client-side chart rendering canvas library ([`@tradingview/lightweight-charts`](file:///e:/zaora/TRADEORA/tradeora-web/package.json#L32)). No TradingView Charting Library widget, iframe, or `TradingView.widget` instance exists in the application frontend.
2. **Datafeed Implementation:** No TradingView datafeed protocol (`getBars`, `subscribeBars`, `resolveSymbol`, `searchSymbols`) exists in the codebase.
3. **Data Storage & Pipeline:** Tradeora downloads, ingests, deduplicates, and stores its own OHLCV candles inside its Supabase PostgreSQL database tables ([`market_prices`](file:///e:/zaora/TRADEORA/database/schema.sql#L41) and [`intraday_snapshots`](file:///e:/zaora/TRADEORA/setup_intraday_db.sql#L2)).
4. **Signal Engine Price Isolation:** The Signal Engine ([`generate_daily_recommendations.py`](file:///e:/zaora/TRADEORA/generate_daily_recommendations.py#L376)) reads prices strictly from Tradeora's PostgreSQL database table [`market_prices`](file:///e:/zaora/TRADEORA/database/schema.sql#L41). It has **NO direct network connection or access** to TradingView's servers during execution.
5. **Backend Data Scraping:** TradingView's REST Scanner API (`https://scanner.tradingview.com/egypt/scan`) is used on the **backend** as **one of five** raw data collection sources (alongside Official EGX Daily Bulletins, Yahoo Finance API, Mubasher, and Investing.com).

---

## QUESTION 1: HOW IS TRADINGVIEW INTEGRATED?

### Classification: Lightweight Charts (Open-Source Canvas Renderer)

TradingView is integrated exclusively via the open-source npm package [`lightweight-charts`](file:///e:/zaora/TRADEORA/tradeora-web/package.json#L32) (`@tradingview/lightweight-charts` version `^4.2.0`).

- **Widget:** ❌ NO
- **Charting Library (JS Embed / Iframe):** ❌ NO
- **Lightweight Charts (Open-Source Canvas):** ✅ YES
- **Trading Platform:** ❌ NO
- **Unknown:** ❌ NO

### Exact Integration File

- **File Path:** [`tradeora-web/components/stock/CandlestickChart.tsx`](file:///e:/zaora/TRADEORA/tradeora-web/components/stock/CandlestickChart.tsx#L3-L16)
- **Imports:**
```typescript
import { 
  createChart, 
  ColorType, 
  LineStyle, 
  CrosshairMode, 
  IPriceLine,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  Time
} from 'lightweight-charts';
```

---

## QUESTION 2: LOCATE TRADINGVIEW INITIALIZATION

### Initialization Search Results

- `new TradingView.widget()`: **NOT FOUND**
- `new widget()`: **NOT FOUND**
- `createChart()`: **FOUND**

### Exact File & Function

- **File:** [`tradeora-web/components/stock/CandlestickChart.tsx`](file:///e:/zaora/TRADEORA/tradeora-web/components/stock/CandlestickChart.tsx#L129-L178)
- **Component / Function:** `CandlestickChartInner` (inside `React.useEffect` hook)
- **Code Reference:**
```typescript
// CandlestickChart.tsx Line 129
const chart = createChart(containerRef.current, {
  width: containerRef.current.clientWidth,
  height: 380,
  layout: {
    background: { type: ColorType.Solid, color: '#0B0F19' },
    textColor: '#9CA3AF',
    fontSize: 10,
    fontFamily: 'sans-serif',
    attributionLogo: false,
  },
  watermark: {
    visible: true,
    text: 'TRADEORA',
  },
  grid: {
    vertLines: { color: 'rgba(255,255,255,0.04)' },
    horzLines: { color: 'rgba(255,255,255,0.04)' },
  },
  timeScale: {
    timeVisible: isIntraday,
    secondsVisible: false,
    barSpacing: 8,
  },
} as any);
```

---

## QUESTION 3: DATAFEED ANALYSIS (OPTION A VS OPTION B)

### Verification Result

**NEITHER OPTION A NOR OPTION B IS USED IN THE FRONTEND CHART.**

- **Option A (Symbol only, e.g. `symbol: "EGX:COMI"` where TradingView fetches data itself):** ❌ FALSE. Lightweight Charts cannot fetch data independently.
- **Option B (Custom Datafeed with protocol methods):**
  - `datafeed:` ❌ **DOES NOT EXIST**
  - `resolveSymbol()`: ❌ **DOES NOT EXIST**
  - `getBars()`: ❌ **DOES NOT EXIST**
  - `subscribeBars()`: ❌ **DOES NOT EXIST**
  - `searchSymbols()`: ❌ **DOES NOT EXIST**

### How Data Is Actually Passed to the Chart

Lightweight Charts receives pre-formatted JSON candle arrays explicitly passed into the series object using `.setData()`:

- **File:** [`tradeora-web/components/stock/CandlestickChart.tsx`](file:///e:/zaora/TRADEORA/tradeora-web/components/stock/CandlestickChart.tsx#L202-L212)
- **Function:** `CandlestickChartInner`
- **Code:**
```typescript
// CandlestickChart.tsx Line 202
candleSeries.setData(
  data
    .filter((d) => d && d.time !== undefined && d.time !== null && isValidNum(getClose(d)))
    .map((d) => ({
      time: d.time as Time,
      open: isValidNum(getOpen(d)) ? getOpen(d) : getClose(d),
      high: isValidNum(getHigh(d)) ? getHigh(d) : getClose(d),
      low: isValidNum(getLow(d)) ? getLow(d) : getClose(d),
      close: getClose(d),
    }))
);
```

The `data` prop is passed to `CandlestickChart` by parent component [`PriceChart.tsx`](file:///e:/zaora/TRADEORA/tradeora-web/components/stock/PriceChart.tsx#L684).

---

## QUESTION 4: CANDLE DATA TRACE (WHERE DO CANDLES COME FROM?)

Because `getBars()` does **not** exist, below is the exact trace of how candle data moves from original sources to the canvas renderer:

```
[ Step 1: User Navigates to Stock Page ]
File: tradeora-web/app/[locale]/stock/[symbol]/page.tsx
  │
  ▼
[ Step 2: Render PriceChart Component ]
File: tradeora-web/components/stock/PriceChart.tsx (Lines 544-607)
Function: fetchCandlesData() inside useEffect
  │
  ├─► Primary Path: Fetch from Tradeora Intraday API
  │   Call: fetch(`/api/intraday?symbol=${symbol}&interval=${minuteInterval}&source=tradingview&days=90`)
  │   File: tradeora-web/app/api/intraday/route.ts (Lines 32-184)
  │   Database Query: Supabase PostgreSQL RPC `get_intraday_candles` OR `market_prices` table.
  │
  └─► Fallback Path (If DB returns < 10 candles): Fetch from Yahoo Finance API Proxy
      Call: fetchYahooCandles(symbol, interval)
      File: tradeora-web/components/stock/PriceChart.tsx (Lines 108-184)
      API Endpoint: tradeora-web/app/api/yahoo-chart/route.ts (Line 31)
      External Source: Yahoo Finance REST API `https://query1.finance.yahoo.com/v8/finance/chart/{ticker}`
  │
  ▼
[ Step 3: Compute Active Prices Array ]
File: tradeora-web/components/stock/PriceChart.tsx (Lines 635-680)
Variable: activePrices
  │
  ▼
[ Step 4: Pass Array as Prop to Lightweight Charts Wrapper ]
File: tradeora-web/components/stock/PriceChart.tsx (Line 684)
JSX: <CandlestickChart data={activePrices} ... />
  │
  ▼
[ Step 5: Render Canvas ]
File: tradeora-web/components/stock/CandlestickChart.tsx (Line 202)
Code: candleSeries.setData(...)
```

---

## QUESTION 5: DOES TRADEORA DOWNLOAD CANDLES ITSELF?

### Answer: YES

Tradeora maintains an extensive automated backend ingestion pipeline to download, scrape, and backfill market data candles.

### Downloader & Scraper Inventory

| # | File Path | Class / Function | Purpose / Target |
|---|-----------|------------------|------------------|
| 1 | [`scrapers/tradingview_scraper.py`](file:///e:/zaora/TRADEORA/scrapers/tradingview_scraper.py#L8) | `TradingViewScraper.fetch_data()` | Scrapes daily EOD OHLCV records from TradingView Egypt Scanner POST API (`https://scanner.tradingview.com/egypt/scan`). |
| 2 | [`scrapers/tradingview_provider.py`](file:///e:/zaora/TRADEORA/scrapers/tradingview_provider.py#L6) | `TradingViewProvider.fetch_prices()` | Fetches live price & volume ticks from TradingView Scanner API. |
| 3 | [`intraday_collector.py`](file:///e:/zaora/TRADEORA/intraday_collector.py#L31) | `main()` | Periodic job that runs during market hours, fetches TradingView scanner data, and stores snapshot ticks in DB. |
| 4 | [`tv_backfill.py`](file:///e:/zaora/TRADEORA/tv_backfill.py#L22) | `backfill_symbol()` | Connects to TradingView via `tvDatafeed` Python library to backfill 1m, 5m, 15m, 1h, 4h historical bars. |
| 5 | [`scrapers/egx_scraper.py`](file:///e:/zaora/TRADEORA/scrapers/egx_scraper.py#L12) | `EGXScraper.fetch_data()` | Downloads and parses official daily trading bulletin PDF/HTML/Excel files directly from EGX website. |
| 6 | [`backfill_historical.py`](file:///e:/zaora/TRADEORA/backfill_historical.py#L28) | `backfill_stock()` | Downloads historical daily OHLCV candles (up to 2 years) from Yahoo Finance using `yfinance`. |
| 7 | [`scrapers/mubasher_provider.py`](file:///e:/zaora/TRADEORA/scrapers/mubasher_provider.py#L6) | `MubasherProvider.fetch_prices()` | Scrapes real-time stock prices from Mubasher.info web portal. |
| 8 | [`scrapers/investing_provider.py`](file:///e:/zaora/TRADEORA/scrapers/investing_provider.py#L6) | `InvestingProvider.fetch_prices()` | Scrapes price data from Investing.com. |
| 9 | [`services/importer.py`](file:///e:/zaora/TRADEORA/services/importer.py#L15) | `DataImporter.import_records()` | Ingests parsed records into Supabase PostgreSQL database. |

---

## QUESTION 6: DOES TRADEORA STORE CANDLES IN ITS OWN DATABASE?

### Answer: YES

Tradeora stores OHLCV market data in **two primary PostgreSQL database tables** hosted on Supabase.

### 1. Table `market_prices` (Daily OHLCV & EOD Prices)

- **Schema Definition File:** [`database/schema.sql`](file:///e:/zaora/TRADEORA/database/schema.sql#L41-L61)
- **Table Name:** `market_prices`
- **Columns:**
  - `id` (UUID, PRIMARY KEY)
  - `company_id` (UUID, FK -> companies.id)
  - `open_price` (NUMERIC)
  - `high_price` (NUMERIC)
  - `low_price` (NUMERIC)
  - `close_price` (NUMERIC)
  - `previous_close` (NUMERIC)
  - `change_value` (NUMERIC)
  - `change_percent` (NUMERIC)
  - `volume` (BIGINT)
  - `value_traded` (NUMERIC)
  - `source` (TEXT, FK -> market_sources.id)
  - `price_date` (DATE, NOT NULL)
  - `data_quality_flag` (TEXT)
  - `fetched_at` (TIMESTAMPTZ)
  - `created_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)
  - *Unique Constraint:* `(company_id, price_date, source)`
- **Writers:**
  - [`services/importer.py`](file:///e:/zaora/TRADEORA/services/importer.py#L15) (via `main.py`)
  - [`backfill_historical.py`](file:///e:/zaora/TRADEORA/backfill_historical.py#L85)
  - [`tradeora-web/app/api/cron/sync-prices/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/cron/sync-prices/route.ts#L88)
- **Readers:**
  - [`generate_daily_recommendations.py`](file:///e:/zaora/TRADEORA/generate_daily_recommendations.py#L286) (Signal Engine)
  - [`signal_guardian.py`](file:///e:/zaora/TRADEORA/signal_guardian.py#L52)
  - [`track_trades.py`](file:///e:/zaora/TRADEORA/track_trades.py#L75)
  - [`tradeora-web/app/api/intraday/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/intraday/route.ts#L32) (Daily candles API)
  - [`tradeora-web/lib/queries.ts`](file:///e:/zaora/TRADEORA/tradeora-web/lib/queries.ts#L32) (`fetchHistoricalPrices`)

### 2. Table `intraday_snapshots` (Intraday Snapshot Ticks & Candles)

- **Schema Definition File:** [`setup_intraday_db.sql`](file:///e:/zaora/TRADEORA/setup_intraday_db.sql#L2-L13)
- **Table Name:** `intraday_snapshots`
- **Columns:**
  - `id` (UUID, PRIMARY KEY)
  - `company_id` (UUID, FK -> companies.id)
  - `snapshot_time` (TIMESTAMPTZ, NOT NULL)
  - `price` (NUMERIC(12,4))
  - `open_price` (NUMERIC(12,4))
  - `high_price` (NUMERIC(12,4))
  - `low_price` (NUMERIC(12,4))
  - `volume` (BIGINT)
  - `source` (TEXT)
  - `created_at` (TIMESTAMPTZ)
  - *Unique Constraint:* `(company_id, snapshot_time, source)`
- **Writers:**
  - [`intraday_collector.py`](file:///e:/zaora/TRADEORA/intraday_collector.py#L102)
  - [`tv_backfill.py`](file:///e:/zaora/TRADEORA/tv_backfill.py#L112)
  - [`services/intraday_importer.py`](file:///e:/zaora/TRADEORA/services/intraday_importer.py#L45)
- **Readers:**
  - [`tradeora-web/app/api/intraday/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/intraday/route.ts#L100) (via RPC `get_intraday_candles`)
  - [`tradeora-web/components/stock/PriceChart.tsx`](file:///e:/zaora/TRADEORA/tradeora-web/components/stock/PriceChart.tsx#L189)

---

## QUESTION 7: FIND THE SIGNAL ENGINE

### Exact Signal Generation File & Function

- **File Path:** [`generate_daily_recommendations.py`](file:///e:/zaora/TRADEORA/generate_daily_recommendations.py#L376)
- **Function:** `generate_daily_recommendations()`
- **Data Extractor Function:** `fetch_canonical_candles()` (Line 269)

### Where Does it Read Price From?

**DATABASE (`market_prices` table in Supabase PostgreSQL)**

### Source Code Evidence

- **File:** [`generate_daily_recommendations.py`](file:///e:/zaora/TRADEORA/generate_daily_recommendations.py#L286-L293)
- **Code Snippet:**
```python
# Lines 277-293
ALLOWED = ['tradingview_1d', 'egx_bulletin', 
           'yahoo_historical', 'tradingview',
           'yahoo_live']

res = sb.table("market_prices").select(
    "price_date, open_price, high_price, "
    "low_price, close_price, volume, source"
).eq("company_id", company_id) \
 .in_("source", ALLOWED) \
 .order("price_date", desc=False) \
 .limit(limit * 2).execute()
```

- **Deduplication & Priority Logic:** [`generate_daily_recommendations.py`](file:///e:/zaora/TRADEORA/generate_daily_recommendations.py#L297-L312)
```python
SOURCE_PRIORITY = ['egx_bulletin', 'tradingview_1d',
                   'yahoo_historical', 'tradingview',
                   'yahoo_live']
```

The entry price and all technical indicators (RSI, MACD, ATR, Bollinger Bands, Moving Averages) are derived strictly from these database records.

---

## QUESTION 8: CAN THE SIGNAL ENGINE DIRECTLY ACCESS TRADINGVIEW PRICES?

### Answer: NO

### Detailed Technical Explanation

1. **No External Network Calls During Execution:** The Signal Engine ([`generate_daily_recommendations.py`](file:///e:/zaora/TRADEORA/generate_daily_recommendations.py#L376)) contains zero HTTP requests or WebSocket connections to TradingView endpoints (`scanner.tradingview.com` or `tradingview.com`).
2. **Database Isolation:** It queries only the local Supabase PostgreSQL table `market_prices`.
3. **Indirect Dependency:** TradingView price data reaches the Signal Engine **only indirectly** after an independent scraper script ([`scrapers/tradingview_scraper.py`](file:///e:/zaora/TRADEORA/scrapers/tradingview_scraper.py#L8) or [`intraday_collector.py`](file:///e:/zaora/TRADEORA/intraday_collector.py#L31)) executes separately and writes records into `market_prices`.
4. **Source Overriding:** If official EGX Bulletin records (`egx_bulletin`) exist for a date, `fetch_canonical_candles()` prioritizes `egx_bulletin` over `tradingview` scanner entries, causing the Signal Engine to ignore TradingView data for that date.

---

## QUESTION 9: DOES THE CHART DISPLAY TRADINGVIEW MARKET DATA OR TRADEORA MARKET DATA?

### Answer: TRADEORA MARKET DATA

The chart displays Tradeora's own database candles, with an automated fallback to Yahoo Finance API.

### Evidence

1. **API Endpoint Call:** [`PriceChart.tsx`](file:///e:/zaora/TRADEORA/tradeora-web/components/stock/PriceChart.tsx#L565) queries Tradeora's internal API route:
```typescript
const dbRes = await fetch(`/api/intraday?symbol=${encodeURIComponent(symbol)}&interval=${minuteInterval}&source=tradingview&days=90`);
```
2. **Database Source:** [`app/api/intraday/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/intraday/route.ts#L32) reads from Tradeora's Supabase tables `market_prices` and `intraday_snapshots`.
3. **Yahoo Finance Fallback:** If DB snapshots are fewer than 10, [`PriceChart.tsx`](file:///e:/zaora/TRADEORA/tradeora-web/components/stock/PriceChart.tsx#L576) calls `fetchYahooCandles()`, which proxies Yahoo Finance REST API via [`/api/yahoo-chart`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/yahoo-chart/route.ts#L31).
4. **Client-Side Rendering Only:** [`CandlestickChart.tsx`](file:///e:/zaora/TRADEORA/tradeora-web/components/stock/CandlestickChart.tsx#L129) uses `@tradingview/lightweight-charts` purely as a rendering engine on HTML5 Canvas. It makes zero HTTP requests to TradingView servers.

---

## QUESTION 10: COMPLETE ARCHITECTURE DIAGRAM

```
                   ┌─────────────────────────────────────────┐
                   │          MARKET DATA SOURCES            │
                   └────┬──────────────┬──────────────┬──────┘
                        │              │              │
       ┌────────────────┘              │              └────────────────┐
       ▼                               ▼                               ▼
 TradingView Scanner           Official EGX Bulletin             Yahoo Finance API
(https://scanner.tradingview.com)   (PDF / HTML / Excel)         (query1.finance.yahoo.com)
       │                               │                               │
       ▼                               ▼                               ▼
 [ PYTHON SCRAPERS ]           [ PYTHON IMPORTER ]            [ PROXY & BACKFILL ]
 - tradingview_scraper.py      - egx_scraper.py               - backfill_historical.py
 - intraday_collector.py       - services/importer.py         - /api/yahoo-chart
 - tv_backfill.py                      │                               │
       │                               │                               │
       └───────────────────────┬───────┴───────────────────────────────┘
                               │
                               ▼
                ┌─────────────────────────────┐
                │   SUPABASE POSTGRESQL DB    │
                │  - market_prices            │
                │  - intraday_snapshots       │
                └──────┬───────────────┬──────┘
                       │               │
      ┌────────────────┘               └────────────────┐
      ▼                                                 ▼
[ SIGNAL ENGINE ]                             [ TRADEORA WEB API ]
generate_daily_recommendations.py             /api/intraday
(Queries market_prices DB)                              │
      │                                                 ▼
      ▼                                      [ FRONTEND WEB APP ]
recommended_trades DB                        PriceChart.tsx
      │                                                 │
      ▼                                                 ▼
User Signal UI                                [ LIGHTWEIGHT CHARTS ]
                                              CandlestickChart.tsx
                                              (Renders Tradeora DB Data)
```

---

## QUESTION 11: SINGLE MOST IMPORTANT STATEMENT VERIFICATION

### Statement Selection

**STATEMENT C: TradingView renders Tradeora's own candles.**

*(Specifically: TradingView's open-source `lightweight-charts` library renders candle arrays served directly from Tradeora's database and API proxies).*

### Breakdown of Other Statements

- **A) TradingView is both Price source & Candle source:** ❌ FALSE. TradingView is not the sole source. Tradeora ingests from EGX, Yahoo Finance, Mubasher, and Investing.com, and serves its own database candles to the chart.
- **B) TradingView only renders charts. Prices come from another provider:** ⚠️ PARTIALLY ACCURATE, but statement C is more precise because TradingView Scanner is also used as one of Tradeora's backend ingestion sources.
- **D) Cannot be determined:** ❌ FALSE. Code evidence is 100% conclusive.

---

## QUESTION 12: MARKET DATA PROVIDERS INVENTORY

| Provider | Purpose | Used By | Files | Active? |
|----------|---------|---------|-------|---------|
| **TradingView Scanner API** (`scanner.tradingview.com`) | EOD prices, intraday snapshots, EGX30/70 index values | Backend scrapers, intraday collector, web index route | [`scrapers/tradingview_scraper.py`](file:///e:/zaora/TRADEORA/scrapers/tradingview_scraper.py#L10), [`scrapers/tradingview_provider.py`](file:///e:/zaora/TRADEORA/scrapers/tradingview_provider.py#L12), [`intraday_collector.py`](file:///e:/zaora/TRADEORA/intraday_collector.py#L53), [`tradeora-web/app/api/egx30/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/egx30/route.ts#L15) | **YES** |
| **TradingView tvDatafeed Protocol** (`tvDatafeed`) | Historical intraday candle backfill (1m, 5m, 15m, 1h) | Historical backfill script | [`tv_backfill.py`](file:///e:/zaora/TRADEORA/tv_backfill.py#L22) | **YES** |
| **Official EGX Bulletin** (`egx.com.eg`) | Authoritative official EOD daily trading price bulletins | Primary EOD price importer pipeline | [`scrapers/egx_scraper.py`](file:///e:/zaora/TRADEORA/scrapers/egx_scraper.py#L12), [`main.py`](file:///e:/zaora/TRADEORA/main.py#L61), [`services/importer.py`](file:///e:/zaora/TRADEORA/services/importer.py#L15) | **YES** *(Priority #1 for daily prices)* |
| **Yahoo Finance REST API** (`query1.finance.yahoo.com`) | Historical daily candles (2 years backfill), live/intraday chart fallback, fundamentals | Historical backfill, web chart fallback, fundamentals importer | [`backfill_historical.py`](file:///e:/zaora/TRADEORA/backfill_historical.py#L28), [`tradeora-web/app/api/yahoo-chart/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/yahoo-chart/route.ts#L31), [`tradeora-web/components/stock/PriceChart.tsx`](file:///e:/zaora/TRADEORA/tradeora-web/components/stock/PriceChart.tsx#L163), [`services/fundamentals_importer.py`](file:///e:/zaora/TRADEORA/services/fundamentals_importer.py#L12) | **YES** |
| **Mubasher.info Web Portal** (`mubasher.info`) | Real-time price snapshots, market overview ticker sync | Cron price sync, market overview bar | [`scrapers/mubasher_provider.py`](file:///e:/zaora/TRADEORA/scrapers/mubasher_provider.py#L6), [`tradeora-web/app/api/cron/sync-prices/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/cron/sync-prices/route.ts#L35), [`tradeora-web/sync-mubasher.js`](file:///e:/zaora/TRADEORA/tradeora-web/sync-mubasher.js#L10) | **YES** |
| **Investing.com** (`investing.com`) | Secondary price validation source | Consensus price importer | [`scrapers/investing_provider.py`](file:///e:/zaora/TRADEORA/scrapers/investing_provider.py#L6), [`services/intraday_importer.py`](file:///e:/zaora/TRADEORA/services/intraday_importer.py#L12) | **YES** |

---

## QUESTION 13: MARKET DATA API ENDPOINTS LISTING

### 1. `/api/intraday`
- **File:** [`tradeora-web/app/api/intraday/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/intraday/route.ts#L4)
- **Input:** Query parameters `symbol` (string), `interval` (number, e.g. 15, 30, 60, 240, 1440), `days` (number, default 90).
- **Output:** JSON `{ candles: [{ time, open, high, low, close, volume }], source: string, count: number, fallback: boolean }`.
- **Who calls it:** Frontend [`PriceChart.tsx`](file:///e:/zaora/TRADEORA/tradeora-web/components/stock/PriceChart.tsx#L565) to load historical and intraday candle data for charts.

### 2. `/api/yahoo-chart`
- **File:** [`tradeora-web/app/api/yahoo-chart/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/yahoo-chart/route.ts#L3)
- **Input:** Query parameters `ticker` (e.g. `COMI.CA`), `interval` (e.g. `1d`, `1h`, `15m`).
- **Output:** Proxy JSON response from Yahoo Finance `v8/finance/chart` containing timestamp array and quote indicators (`open`, `high`, `low`, `close`, `volume`, `events`).
- **Who calls it:** Frontend [`PriceChart.tsx`](file:///e:/zaora/TRADEORA/tradeora-web/components/stock/PriceChart.tsx#L163) when DB intraday snapshots < 10.

### 3. `/api/egx30`
- **File:** [`tradeora-web/app/api/egx30/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/egx30/route.ts#L76)
- **Input:** None (GET request).
- **Output:** JSON `{ value: number, change: number, source: 'tradingview' | 'yahoo' | 'unavailable' }`.
- **Who calls it:** Dashboard ticker components ([`MarketOverviewBar.tsx`](file:///e:/zaora/TRADEORA/tradeora-web/components/dashboard/MarketOverviewBar.tsx#L87), home page).

### 4. `/api/egx70`
- **File:** [`tradeora-web/app/api/egx70/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/egx70/route.ts#L76)
- **Input:** None (GET request).
- **Output:** JSON `{ value: number, change: number, source: 'tradingview' | 'yahoo' | 'unavailable' }`.
- **Who calls it:** Dashboard ticker components ([`MarketOverviewBar.tsx`](file:///e:/zaora/TRADEORA/tradeora-web/components/dashboard/MarketOverviewBar.tsx#L87), home page).

### 5. `/api/stream-prices`
- **File:** [`tradeora-web/app/api/stream-prices/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/stream-prices/route.ts#L6)
- **Input:** HTTP Server-Sent Events (SSE) stream request.
- **Output:** SSE EventStream emitting live price updates `{ symbol, price, change, change_percent, volume, source, timestamp }`.
- **Who calls it:** Client-side components listening for real-time price updates.

### 6. `/api/update-live-tick`
- **File:** [`tradeora-web/app/api/update-live-tick/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/update-live-tick/route.ts#L4)
- **Input:** POST JSON payload `{ symbol, price, change, change_percent, volume, source }`.
- **Output:** JSON `{ success: true, symbol }`.
- **Who calls it:** External price collector scripts pushing live price ticks into Tradeora's SSE broadcast store.

### 7. `/api/cron/sync-prices`
- **File:** [`tradeora-web/app/api/cron/sync-prices/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/cron/sync-prices/route.ts#L10)
- **Input:** Vercel Cron GET request.
- **Output:** JSON `{ success: true, count, timestamp }`.
- **Who calls it:** Vercel Cron service scheduled every 15 minutes during market hours ([`vercel.json`](file:///e:/zaora/TRADEORA/tradeora-web/vercel.json#L3)).

### 8. External TradingView Scanner Endpoint: `https://scanner.tradingview.com/egypt/scan`
- **Input:** POST JSON payload specifying `markets: ["egypt"]`, `symbols`, `columns: ["close", "open", "high", "low", "volume", ...]`.
- **Output:** JSON object with `data: [{ s: "EGX:COMI", d: [...] }]`.
- **Who calls it:** [`scrapers/tradingview_scraper.py`](file:///e:/zaora/TRADEORA/scrapers/tradingview_scraper.py#L60), [`scrapers/tradingview_provider.py`](file:///e:/zaora/TRADEORA/scrapers/tradingview_provider.py#L40), [`intraday_collector.py`](file:///e:/zaora/TRADEORA/intraday_collector.py#L53), [`tradeora-web/app/api/egx30/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/egx30/route.ts#L15), [`tradeora-web/app/api/egx70/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/egx70/route.ts#L15).

---

## FINAL VERDICT

```
===============================================================================
                            FINAL AUDIT VERDICT
===============================================================================
```

### 1. Where does the chart price come from?
**Tradeora's PostgreSQL database** (`market_prices` table for daily candles or `intraday_snapshots` table for intraday candles via `/api/intraday`), with fallback to **Yahoo Finance API** (`/api/yahoo-chart`), rendered in browser via `@tradingview/lightweight-charts`.

### 2. Where does the signal price come from?
**Tradeora's Supabase PostgreSQL database** (`market_prices` table), queried directly by the Python backend script [`generate_daily_recommendations.py`](file:///e:/zaora/TRADEORA/generate_daily_recommendations.py#L286) using `fetch_canonical_candles()`.

### 3. Are they guaranteed to be identical?
**NO**
*Reason:* The frontend chart component may fall back to Yahoo Finance API (`/api/yahoo-chart`) if local DB intraday snapshot candles are fewer than 10, or render intraday snapshots from `intraday_snapshots`. Conversely, the backend Signal Engine strictly queries the `market_prices` table and applies source deduplication priority (`egx_bulletin` > `tradingview_1d` > `yahoo_historical` > `tradingview` > `yahoo_live`). Additionally, Yahoo Finance provides split/dividend-adjusted historical prices (`adjclose`) while `market_prices` stores unadjusted raw prices.

### 4. Does Tradeora actually use TradingView market data?
**PARTIALLY**
*Reason:* Tradeora uses the TradingView Scanner REST API (`https://scanner.tradingview.com/egypt/scan`) and `tvDatafeed` Python library as ONE OF SEVERAL backend data sources to populate its own database tables (`market_prices` and `intraday_snapshots`). Tradeora DOES NOT stream data directly from TradingView to the frontend chart widget, nor does it use TradingView as an exclusive or primary market data feed.

### 5. If prices differ from TradingView, is that expected based on architecture?
**YES**
*Reason:* Tradeora's architecture design places the official Egyptian Exchange daily bulletin (`egx_bulletin`) as Priority #1 for daily prices in `market_prices`. Furthermore, the Signal Engine applies explicit source deduplication and cleaning rules (removing Mubasher flat candles, prioritizing EGX official bulletins), while the frontend chart can use Yahoo Finance fallback. Therefore, price variances between Tradeora's displayed chart/signals and live TradingView figures are a direct mathematical consequence of multi-source priority blending and fallback mechanics.
