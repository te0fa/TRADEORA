# TRADEORA EGX — CURRENT ARCHITECTURE (AS-IS)
**Document Type:** Authoritative As-Is Architecture Reference  
**Generated:** 2026-08-05T19:17:37+03:00 (Cairo Time)  
**Authority:** Forensic code inspection — implementation wins over documentation  
**Scope:** Full platform: frontend, API, Python services, databases, automation, ML, data flows  
**Status:** READ-ONLY forensic record — do not modify based on this document alone

---

## ARCHITECTURE PRINCIPLES (How to Read This Document)

| Label | Meaning |
|-------|---------|
| **ACTUAL** | Confirmed from source code — implementation verified |
| **INTENDED** | Documented or commented intent that differs from implementation |
| **MISSING** | Referenced in documentation or code comments but not implemented |
| **BROKEN** | Implemented but provably non-functional in the production environment |

> **Rule:** When implementation contradicts documentation or code comments, the implementation is the authoritative record. Aspirational comments are noted as INTENDED.

---

## SECTION 1 — SYSTEM CONTEXT (C4 Level 1)

### 1.1 Users

| User Type | Access | Notes |
|-----------|--------|-------|
| Anonymous visitor | Public pages (prices, news, indices) | No auth required for most read paths |
| Registered user | Full platform including signal recommendations, alerts, watchlist | Supabase Auth |
| Admin user | `/admin` panel, Telegram reports, performance summaries | Role-based via `user_profiles.role` |
| Developer (owner) | Local machine pipelines, GitHub Actions, direct DB access | Owner of all infrastructure |
| GitHub Actions runner | Automated jobs (price ingestion, signal generation, trade monitoring) | ubuntu-latest |

### 1.2 C4 Context Diagram (ASCII)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        TRADEORA EGX SYSTEM CONTEXT                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

  ┌──────────────────────┐    HTTPS     ┌──────────────────────────────────────┐
  │  RETAIL USER         │ ──────────► │  TRADEORA EGX PLATFORM               │
  │  (Browser / Mobile)  │ ◄────────── │  tradeora-web.vercel.app             │
  └──────────────────────┘    HTTP/SSE │  [Vercel Serverless + Edge]          │
                                        └────────────────────┬─────────────────┘
  ┌──────────────────────┐                                   │
  │  DEVELOPER / ADMIN   │ ──── local ──► Windows machine    │
  │  (Windows 11 PC)     │               pipelines           │
  └──────────────────────┘                                   │
                                                             │
  ┌──────────────────────┐                                   │ Supabase SDK
  │  GITHUB ACTIONS      │ ─── writes ────────────────────►  │
  │  (ubuntu-latest)     │ ◄─── reads ────────────────────── │
  └──────────────────────┘                                   │
                                                             ▼
                                        ┌──────────────────────────────────────┐
  ┌─────────────────────┐              │  SUPABASE (PostgreSQL)               │
  │  TRADINGVIEW SCANNER│ ──scrape───► │  kdjsguozssxvtmlmqhpz.supabase.co   │
  │  scanner.tv.com/    │              │  market_prices, intraday_snapshots   │
  │  egypt/scan         │              │  recommended_trades, companies...    │
  └─────────────────────┘              └──────────────────────────────────────┘
                                                             │
  ┌─────────────────────┐                                   │ sync
  │  YAHOO FINANCE v8   │ ──fetch────► intraday/route.ts    │
  │  query1.finance.    │              (live inject)         ▼
  │  yahoo.com          │              ┌──────────────────────────────────────┐
  └─────────────────────┘              │  COCKROACHDB (PostgreSQL-compatible)  │
                                       │  raw-donkey-30500.j77.aws-eu-        │
  ┌─────────────────────┐              │  central-1.cockroachlabs.cloud       │
  │  EGX OFFICIAL SITE  │ ──scrape──► │  daily_investor_flows (mirror)       │
  │  egx.com.eg         │              └──────────────────────────────────────┘
  │  PDF bulletins      │
  └─────────────────────┘              ┌──────────────────────────────────────┐
                                       │  TELEGRAM BOT API                    │
  ┌─────────────────────┐              │  api.telegram.org                    │
  │  MUBASHER           │ ──scrape──► │  (trade alerts, performance reports) │
  │  mubasher.info      │              └──────────────────────────────────────┘
  │  (EGX33 only)       │
  └─────────────────────┘              ┌──────────────────────────────────────┐
                                       │  UPSTASH REDIS                       │
  ┌─────────────────────┐              │  (package.json dependency)           │
  │  ALMAL.COM          │ ──scrape──► │  ACTUAL USE: UNKNOWN — not confirmed │
  │  Arabic news        │              │  in any route or service file        │
  └─────────────────────┘              └──────────────────────────────────────┘
```

---

## SECTION 2 — CONTAINER ARCHITECTURE (C4 Level 2)

### Container 1: Next.js Frontend + API Layer

| Property | Value |
|----------|-------|
| **Purpose** | Serve UI pages + handle all API requests (read/write to DB, scrape external sources) |
| **Technology** | Next.js 16.2.10, React 19.2.4, TypeScript 5, Tailwind CSS 4 |
| **Deployment** | Vercel Serverless Functions + Edge Runtime |
| **Language** | TypeScript |
| **Routes** | 40+ API routes under `app/api/` |
| **Pages** | 18 user-facing pages under `app/[locale]/` |
| **Dependencies** | Supabase JS client, TradingView Scanner (HTTP), Yahoo Finance v8 (HTTP), lightweight-charts 5.2.0, technicalindicators |
| **Inputs** | HTTP requests from browser, Vercel Cron triggers |
| **Outputs** | JSON API responses, SSE stream (broken), HTML pages |
| **State** | Stateless per-invocation (serverless). No persistent memory between requests. |
| **Failure modes** | Cold start latency (first request); External API timeout → empty response or DB fallback; DB unavailable → 500 |
| **BROKEN component** | `live-price-store.ts` — in-memory singleton is NOT shared across serverless invocations in production |

### Container 2: Python Signal Engine

| Property | Value |
|----------|-------|
| **Purpose** | Generate daily trade recommendations using XGBoost ML model |
| **Technology** | Python 3.11, XGBoost 2.0+, scikit-learn, pandas, pandas-ta-classic |
| **Deployment** | GitHub Actions ubuntu-latest runner (ephemeral per-run) |
| **Entrypoint** | `generate_daily_recommendations.py` |
| **Schedule** | `daily-recommendations.yml` → `30 14 * * 0,1,2,3,4` UTC (17:30 Cairo) |
| **Inputs** | `market_prices`, `intraday_snapshots`, `company_fundamentals`, `daily_investor_flows`, `company_news`, `volume_profiles` (all from Supabase) |
| **Outputs** | Writes/updates `recommended_trades` table |
| **Model** | `models/model_1d_v6.pkl` (2.7 MB XGBoost, 30 features, loaded from repo filesystem) |
| **Failure modes** | Model file not found → FileNotFoundError (no fallback); Supabase unavailable → exception + log; Insufficient candles (< 50) → skip symbol silently |

### Container 3: Python Data Ingestion Pipeline

| Property | Value |
|----------|-------|
| **Purpose** | Fetch EOD prices from EGX/TradingView and store in Supabase |
| **Technology** | Python 3.12, requests, BeautifulSoup, Selenium (for investing.com) |
| **Deployment** | GitHub Actions (`daily_update.yml`) + Windows Task Scheduler (`run_daily.bat`) — DUAL deployment, SPOF |
| **Entrypoints** | `main.py` (primary EOD), `tv_backfill.py` (TradingView backfill), `backfill_historical.py` |
| **Schedule** | GH Action: `0 15 * * 0-4` UTC (18:00 Cairo, post-market); Windows: Task Scheduler at developer-set time |
| **Inputs** | EGX PDF/HTML, TradingView scanner, Yahoo Finance |
| **Outputs** | `market_prices` (upsert on `company_id, price_date, source`) |
| **Failure modes** | EGX site down → TradingView fallback; TV blocked → Yahoo fallback; Yahoo fails → no data, no alert; Silent failure unless logs checked |

### Container 4: Python Trade Monitor

| Property | Value |
|----------|-------|
| **Purpose** | Monitor active trades and trigger exits (SL/TP/trailing) |
| **Technology** | Python 3.12 |
| **Deployment** | GitHub Actions (`trade-monitor.yml`) — active during session |
| **Entrypoints** | `trade_monitor.py` (primary), `track_trades.py` (legacy, also referenced in `run_daily.bat`) |
| **Also exists as** | TypeScript: `app/api/cron/track-recommended-trades/route.ts` (618 lines) — BROKEN in Vercel (timing bug) |
| **Inputs** | `recommended_trades` (active trades), current price from TradingView or DB |
| **Outputs** | Updates `recommended_trades` (status, exit_price, pnl_percent, closed_at) |
| **Failure modes** | Python version: unknown retry behavior; TypeScript Vercel cron: ALWAYS SKIPPED (fires at 18:00 Cairo, gate closes at 13:30 Cairo) |

### Container 5: Python ML Training Pipeline

| Property | Value |
|----------|-------|
| **Purpose** | Train XGBoost models on historical `market_prices` data |
| **Technology** | Python 3.11/3.12, XGBoost, scikit-learn, pandas |
| **Deployment** | Run manually by developer (no GH Action workflow confirmed for retraining) |
| **Entrypoints** | `train_model_v6.py`, `train_model_v5.py`, etc. (9 scripts total) |
| **Inputs** | `market_prices`, `company_fundamentals`, `intraday_snapshots`, `daily_investor_flows` |
| **Outputs** | `models/model_1d_v6.pkl`, `models/scaler_1d_v6.pkl`, `models/model_v6_metadata.json` |
| **Stored where** | Repository filesystem (committed to git) |
| **Failure modes** | Runs on local machine; if machine is unavailable, no retraining possible |

### Container 6: Python Backtest Engine

| Property | Value |
|----------|-------|
| **Purpose** | Compute signal win rates and update `signal_stats` table |
| **Technology** | Python 3.11, pandas, pandas-ta, optionally quantstats, vectorbt |
| **Deployment** | GitHub Actions (`weekly_backtest.yml`) |
| **Entrypoints** | `backtest_signals.py` (primary, tests rule-based signals), `backtest_engine.py` (larger), `validate_backtest.py` (validation harness) |
| **Inputs** | `market_prices`, `intraday_snapshots` (NO source filter applied → multi-source duplicates included) |
| **Outputs** | `signal_stats` table (upsert on `company_id, timeframe, signal_type`) |
| **Critical flaw** | Tests rule-based signals, NOT the XGBoost ML model. `backtest_results.json` mixes both |

### Container 7: Python Investor Flow Scraper

| Property | Value |
|----------|-------|
| **Purpose** | Scrape official EGX investor flow PDFs and store daily net buy/sell by investor type |
| **Technology** | Python 3.12, requests, pdfplumber/PyPDF2 |
| **Deployment** | GitHub Actions (`egx-investor-flows.yml`) + Vercel Cron (`sync-investor-flows`, 13:30 UTC) |
| **Entrypoints** | `egx_flow_scraper.py`, `egx_intraday_flows.py`, `auto_scrape_egx_live_flows.py` |
| **Inputs** | EGX official PDF bulletins (egx.com.eg) |
| **Outputs** | `daily_investor_flows` in Supabase AND CockroachDB (dual write via `cockroach_sync.py`) |
| **Data quality** | ACTUAL real EGX official data — highest reliability in the platform |

### Container 8: Supabase Database

| Property | Value |
|----------|-------|
| **Purpose** | Primary relational database for all platform data |
| **Technology** | PostgreSQL (Supabase managed), project `kdjsguozssxvtmlmqhpz` |
| **Region** | Unknown (Supabase default — likely EU or US East) |
| **Deployment** | Supabase SaaS (managed) |
| **Inputs** | Python services (direct SDK), Next.js API routes (SDK), Supabase Edge Functions (if any) |
| **Outputs** | Data to all consumers |
| **RPC Functions** | `get_latest_prices()` (source-priority price resolution), `get_verification_data()` |
| **RLS** | Enabled on all tables; most allow public SELECT |
| **Migration history** | 12 migrations, starting 2026-07-20 |

### Container 9: CockroachDB

| Property | Value |
|----------|-------|
| **Purpose** | Secondary database, specifically for investor flow data |
| **Technology** | CockroachDB (PostgreSQL-compatible), AWS EU Central |
| **Deployment** | CockroachDB SaaS (managed) |
| **Why it exists** | `api/investor-flows/route.ts` uses it as primary source with Supabase as fallback |
| **Sync mechanism** | `cockroach_sync.py` — syncs from Supabase to CockroachDB |
| **Failure mode** | If CockroachDB is unavailable → API falls back to Supabase |
| **Credentials** | Connection string is in committed `.env` file (SECURITY ISSUE) |

### Container 10: Vercel Cron Scheduler

| Property | Value |
|----------|-------|
| **Purpose** | Trigger serverless API route execution on a schedule |
| **Config file** | `tradeora-web/vercel.json` |
| **Jobs** | 5 scheduled jobs |
| **BROKEN job** | `track-recommended-trades`: fires at 15:00 UTC but session gate closes at 13:30 UTC → always skipped |
| **Working jobs** | `sync-intraday` (10:00 UTC), `intraday-analysis` (14:00 UTC), `sync-investor-flows` (13:30 UTC), `sync-shariah` (Fri 16:00 UTC) |

### Container 11: GitHub Actions Scheduler

| Property | Value |
|----------|-------|
| **Purpose** | Trigger Python scripts on a schedule in cloud environment |
| **Config** | `.github/workflows/` (16 workflow files) |
| **Runtime** | ubuntu-latest, ephemeral per-run |
| **Active workflows** | 15 (one — `track_trades_schedule.yml` — explicitly disabled) |
| **Key workflows** | See Section 8 (Automation Architecture) |

### Container 12: Windows Task Scheduler (Local Machine)

| Property | Value |
|----------|-------|
| **Purpose** | Run daily Python pipelines on developer's local Windows machine |
| **Config** | `setup_scheduler.ps1`, `setup_intraday_scheduler.ps1`, `run_daily.bat` |
| **Scripts run** | `main.py` → `track_trades.py` → `signal_guardian.py` → `tv_backfill.py` |
| **SPOF** | Fails silently if machine is powered off or network is unavailable. No cloud backup for these specific runs. |
| **Monitoring** | Writes timestamps to `logs/scheduler.log` — no alert on failure |

---

## SECTION 3 — DATA FLOW ARCHITECTURE

### 3.1 Historical Price Flow

```
ACTUAL FLOW — Historical Daily OHLCV:

EGX Official Website (egx.com.eg)
  └─ PDF/HTML Bulletin (OHLCV for all EGX stocks)
       ↓ [egx_pdf_watcher.py / egx_scraper.py]
       ↓ [Python: HTML parse / PDF extract → dict]
       ↓ [services/importer.py → upsert]
         source = 'egx_bulletin'
         ↓
Supabase: market_prices (company_id, price_date, OHLCV, source)
         ↓
OR (if EGX fails):

TradingView Scanner (scanner.tradingview.com/egypt/scan)
  └─ POST request → JSON with all EGX stocks
       ↓ [tv_backfill.py / tradingview_scraper.py]
       ↓ [upsert market_prices]
         source = 'tradingview_1d'
         ↓
Supabase: market_prices
         ↓
API Layer (Next.js serverless)
  └─ api/intraday?interval=1440
       ↓ [intraday/route.ts lines 87–127]
       ↓ SELECT from market_prices
         WHERE source IN ('tradingview_1d','tradingview','egx_bulletin','yahoo_historical','yahoo_live')
         Dedup: prefer tradingview_1d > tradingview > egx_bulletin (in this route)
         [NOTE: differs from canonical.py priority order]
         ↓
HTTP JSON response { candles: [...], source: 'tradingview' }
[NOTE: response always labels source as 'tradingview' regardless of actual DB source]
         ↓
Frontend: lightweight-charts candlestick chart
  └─ No further transformation
  └─ No client-side caching (force-dynamic, revalidate=0)
```

### 3.2 Intraday Price Flow

```
ACTUAL FLOW — Intraday (15m/30m/1h/4h):

TradingView 15m Candles (scraped via tv_backfill.py)
  └─ During market session scrape (intraday_prices_schedule.yml / live-session-candles.yml)
       ↓ [backfill_all_tv_15m.py / fill_intraday_history.py]
       ↓ Upsert intraday_snapshots
         source = 'tradingview_15m'
         ↓
Supabase: intraday_snapshots (company_id, snapshot_time, OHLCV, price, source)
         ↓
API Layer: api/intraday?interval=15 (or 30, 60, 240)
  ├─ Step 1: SELECT from intraday_snapshots WHERE source IN (canonical intraday list)
  │   └─ Dedup by snapshot_time, filter exact interval match
  │   └─ If < 10 rows for exact interval: aggregate from tradingview_15m
  │      (30m = 2×15m chunks, 60m = 4×15m chunks, 4h = 16×15m chunks)
  │
  ├─ Step 2: CHECK if last candle date < today Cairo OR market is open (10:00–16:00 Cairo)
  │   └─ IF stale OR open:
  │       → Fetch Yahoo Finance v8 API
  │         URL: query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}.CA
  │         interval: 5m/15m/30m/60m (mapped from requested interval)
  │         range: '5d'
  │       → Merge Yahoo candles: only today's timestamps not already in DB set
  │       → Result: mixed DB + Yahoo candles sorted ascending
  │
  └─ Step 3: Return JSON
      { candles: [...], source: 'tradingview', count: N, todayInjected: true/false }
      [SOURCE LABEL IS ALWAYS 'tradingview' REGARDLESS OF ACTUAL DATA SOURCE]
         ↓
Frontend: lightweight-charts candlestick chart
  └─ No distinction shown between DB and Yahoo candles
  └─ No source indicator in chart UI
```

### 3.3 Live Price Flow (Designed vs Actual)

```
DESIGNED (INTENDED) FLOW:
  Polling service → POST /api/update-live-tick
    → livePriceStore.updateTick() in-memory singleton
    → SSE clients subscribed to /api/stream-prices
    → Browser EventSource receives ticks
    → Chart/price display updates in real-time

ACTUAL FLOW ON VERCEL (PRODUCTION):
  POST /api/update-live-tick
    → Runs in Serverless Function Container A
    → livePriceStore in Container A gets updated
    → Container A's livePriceStore: { SYMBOL: 45.20 }

  GET /api/stream-prices (SSE client)
    → Runs in Serverless Function Container B (DIFFERENT CONTAINER)
    → livePriceStore in Container B: {} (EMPTY — fresh module load)
    → SSE stream sends: heartbeat only, no price ticks

RESULT: SSE live streaming is COMPLETELY NON-FUNCTIONAL in Vercel production.

Evidence: live-price-store.ts lines 69–71:
  if (process.env.NODE_ENV !== 'production') {
    globalForLivePrice.livePriceStore = livePriceStore; // singleton ONLY in dev
  }

ACTUAL "live" price for dashboard/movers page:
  Browser → GET /api/market-movers
    → Next.js serverless function
    → POST scanner.tradingview.com/egypt/scan (8s timeout)
    → Returns all EGX stocks with live prices from TradingView
    → No persistent connection — each page load is a fresh scan
    [This IS live data, but via per-request HTTP polling, not streaming]
```

### 3.4 Market Depth (Order Book) Flow

```
DESIGNED FLOW:
  orderbook_service.py → real Level 2 data → orderbook_snapshots table
    → api/orderbook → frontend Level 2 display

ACTUAL FLOW:
  api/orderbook?symbol=X
    → SELECT from orderbook_snapshots WHERE company_id = X LIMIT 1
    → IF snapshot exists:
        return snapshot.top_bids_json, snapshot.top_asks_json  [may be real]
    → IF no snapshot (MOST CASES):
        return HARDCODED SYNTHETIC DATA:
          bids = [
            { price: currentPrice - step,   volume: 145000, orders_count: 14 },
            { price: currentPrice - 2*step,  volume: 290000, orders_count: 28 },
            { price: currentPrice - 3*step,  volume: 85000,  orders_count: 9  },
            { price: currentPrice - 4*step,  volume: 62000,  orders_count: 6  },
            { price: currentPrice - 5*step,  volume: 41000,  orders_count: 4  },
          ]
          asks = [symmetric hardcoded volumes]
          ofi_ratio: derived from synthetic data (also synthetic)

No real Level 2 data source exists. EGX does not provide public Level 2 API.
orderbook_snapshots table is largely empty.
Users see fabricated data with no disclosure.
```

### 3.5 News Flow

```
SOURCE A: Almal.com (Arabic financial news)
  └─ scrapers/almal_news_scraper.py (GH Action: daily_news_intelligence.yml)
       ↓ Parse HTML/RSS
       ↓ Upsert company_news (company_id FK, title, content, source='almal', published_at)

SOURCE B: EGX Disclosures (official corporate actions)
  └─ scrapers/egx_disclosures_insider_scraper.py
       ↓ Scrape egx.com.eg disclosures
       ↓ Upsert corporate_events, insider_trading

SOURCE C: Historical seed data
  └─ seed_official_egx_news.py (19 KB one-time script)
       ↓ Batch insert historical news

Supabase: company_news table
  ↓ api/news?symbol=X or ?category=X
      → SELECT * FROM company_news WHERE company_id=X ORDER BY published_at DESC
  ↓ api/news-sentiment?symbol=X
      → Reads impact_score from company_news
      → NLP-derived (how? unclear — impact_score column exists, population method not confirmed)
  ↓
Frontend: News tab on /stock/[symbol], /news page
  └─ Simple list rendering, no live updates
```

### 3.6 Signal Generation Flow

```
TRIGGER: GH Action daily-recommendations.yml (14:30 UTC = 17:30 Cairo, Sun–Thu)
  ↓
generate_daily_recommendations.py
  ↓
1. LOAD MODEL
   models/model_1d_v6.pkl (XGBoost)  ← committed to git repo
   models/scaler_1d_v6.pkl

2. FETCH ACTIVE TRADES
   SELECT company_id FROM recommended_trades WHERE status='active'

3. FOR EACH ACTIVE COMPANY:

   a. FETCH CANONICAL CANDLES
      services/canonical.get_canonical_candles()
        → SELECT from market_prices
          WHERE source IN ('tradingview_1d','egx_bulletin','yahoo_historical','tradingview','yahoo_live')
          ORDER BY price_date DESC LIMIT 600
        → Dedup by date (best source per day)
        → Freshness check: skip if last candle > 5 days old
        → Filter: skip zero price, flat candle, impossible H<L, C>H*1.5
        → Return ascending sorted candles

   b. SPLIT DETECTION
      scripts/split_detector.py
        → detect_price_anomaly() — checks for > 30% drop in recent candles
        → If anomaly: skip symbol, mark in companies.notes

   c. FEATURE EXTRACTION (30 features)
      Technical (15): RSI(14), MACD(12/26/9) hist+line, EMA dist(20,50),
                      ATR(14), vol_ratio, price_pos, BB_width, BB_pos,
                      StochRSI, vol_spike, dist_ATH, day_of_week, regime(ADX)
      Sentiment (7):  Hardcoded 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0 — DEAD FEATURES
      Fundamental (8): pe_ratio, eps, debt_equity, profit_margin, revenue_growth,
                       earnings_growth, dividend_yield, fv_ratio
                       ← CURRENT values, NOT point-in-time (look-ahead bias)

   d. SCALE FEATURES
      scaler.transform([feat_input])  ← StandardScaler fitted on training data

   e. ML PREDICTION
      prob = model.predict_proba(X_scaled)[0][1]

   f. ADDITIVE BOOSTS (post-model, not validated against holdout):
      + fundamental_boost (from fundamental_engine.py)
      + news_boost (±0.07/0.09 based on avg impact_score)
      + wyckoff_boost (from wyckoff_engine.py)
      + pattern_boost (from patterns_engine.py)
      + smart_money boost (from smart_money_engine.py)
      + ict_smc boost (from ict_smc_engine.py)
      + elliott boost (from elliott_time_engine.py)
      + flow_boost (from foreign_flow_analyzer.py, ±0.05 to ±0.15)
      + volume_profile_boost (from volume_profiles table, +0.05)
      Clip to [0.0, 0.99]

   g. CONFIRMATION GATE (lines 497–543)
      Count how many boost sources fired > 0.01
      IF confirmations >= 4: timeframe = '3-5 أيام تداول'
      IF confirmations >= 2: timeframe = '1d'
      IF confirmations < 2 AND prob < 0.75: SKIP

   h. RISK/REWARD VALIDATION
      SL = entry - 1.5 × ATR
      TP1 = entry + 2.0 × ATR
      TP2 = entry + 3.5 × ATR  (or fair_value if higher than TP1)
      R:R = (TP1 - entry) / (entry - SL)
      IF R:R > 5.0 or < 1.2: SKIP

   i. EMIT RECOMMENDATION
      IF prob >= 0.65: INSERT/UPDATE recommended_trades (direction='buy', status='active')
      IF prob <= 0.35: INSERT/UPDATE recommended_trades (direction='sell', status='active')
      IF 0.35 < prob < 0.65: UPDATE signal_stats counter only (no trade emitted)
      ↓
Supabase: recommended_trades (new row or update existing active row)
  ↓
Frontend: api/trades → /app (signals page)
```

### 3.7 Trade Tracking & Exit Flow

```
TRIGGER A (WORKING): GH Action trade-monitor.yml (during session hours)
TRIGGER B (BROKEN):  Vercel Cron 0 15 * * * UTC = 18:00 Cairo → always skipped

trade_monitor.py (Python, GH Action):
  ↓
1. SELECT * FROM recommended_trades WHERE status='active'
2. FOR EACH active trade:
   a. GET current price (TradingView or DB)
   b. COMPUTE trailing stop (4 phases)
   c. CHECK exit conditions:
      - Price <= SL → EXIT (stop_loss)
      - Price >= TP1 → status='tp1_hit', partial exit, move SL to entry
      - Price >= TP2 → EXIT (tp2_hit)
      - RSI >= 75 with profit >= 3% → EXIT (rsi_exhaustion)
      - MACD dead cross → EXIT (macd_dead_cross)
      - EMA20 break → EXIT (ema20_break)
      - Age >= 28 days → EXIT (stale_cleanup)
   d. IF exit:
      UPDATE recommended_trades SET
        status='closed',
        exit_price=currentPrice,
        exit_reason=reason,
        pnl_percent=((exit-entry)/entry*100),
        closed_at=now()

TypeScript version (api/cron/track-recommended-trades/route.ts):
  → Same logic, 618 lines, also re-implements RSI, MACD, EMA20, trailing stop
  → Vercel cron timing: ALWAYS SKIPPED (session gate closes at 13:30 UTC, cron fires at 15:00 UTC)
  → Would dispatch Telegram + web-push alerts on exit if it ever ran

PnL Calculation (both Python and TypeScript):
  pnl_percent = (exit_price - entry_price) / entry_price × 100 × direction_multiplier
  [No commissions. No slippage. No dividends. Not risk-adjusted.]

Performance Analytics (weekly):
  performance_analytics.py → reads closed trades → computes stats → writes performance_reports
  [Non-standard Sharpe. Meaningless benchmark. Sequential trade drawdown.]
```

---

## SECTION 4 — DATA OWNERSHIP

| Data Object | Source of Truth | Owner | Storage | Primary Consumer | Update Mechanism | Freshness |
|------------|----------------|-------|---------|-----------------|-----------------|-----------|
| **Company Master** | Manual + EGX scraper | Developer | `companies` (Supabase) | All tables (FK) | Manual insert + status field | Static — rare update |
| **Daily OHLCV** | EGX bulletin (primary), TV (fallback) | GH Action `daily_update.yml` | `market_prices` (Supabase) | API routes, signal engine | Upsert on `(company_id, price_date, source)` daily after market close | T+0 after 18:00 Cairo |
| **Intraday Candles** | TradingView 15m (backfill), Yahoo live (inject) | GH Action `intraday_prices_schedule.yml` | `intraday_snapshots` (Supabase) | `api/intraday`, signal engine | Upsert during session; Yahoo injected at request time | T+0 during session, T+0 via Yahoo inject |
| **Live Current Price** | TradingView Scanner | `api/market-movers` (per-request) | NOT stored — fetched live | Dashboard, trades page | Per HTTP request (no polling, no push) | T+0 per request, TTL = duration of HTTP call |
| **Market Depth / Level 2** | SYNTHETIC (hardcoded fallback) | N/A | `orderbook_snapshots` (mostly empty) | `api/orderbook` | No real update mechanism | FABRICATED — not real |
| **News** | Almal.com, EGX disclosures | GH Action `daily_news_intelligence.yml` | `company_news` (Supabase) | News page, signal boost | Daily scrape | T+1 day typically |
| **Signal / Trade** | XGBoost v6 model + rule stack | GH Action `daily-recommendations.yml` | `recommended_trades` (Supabase) | Trades page, exit engine, performance | Daily generation; daily update to active trades | T+0 after 17:30 Cairo |
| **Fundamentals** | Yahoo Finance (via `fundamentals_importer.py`) | GH Action `weekly_fundamentals_sync.yml` | `company_fundamentals` (Supabase) | Signal engine, stock detail | Weekly | Weekly; may be months stale |
| **Investor Flows** | Official EGX PDF | GH Action `egx-investor-flows.yml` | `daily_investor_flows` (Supabase + CockroachDB) | `/investor-flows` page, signal engine | Daily scrape | T+0 after 16:30 Cairo |
| **PnL** | Computed at exit | Exit engine (Python `trade_monitor.py`) | `recommended_trades.pnl_percent` | Performance page, trades list | On exit event | T+0 on exit |
| **Performance Stats** | Derived from `recommended_trades` | `performance_analytics.py` (weekly) | `performance_reports` (Supabase) | Telegram reports | Weekly | T+7 days max |
| **Signal Stats (WR)** | Backtest engine (rule-based, NOT ML) | GH Action `weekly_backtest.yml` | `signal_stats` (Supabase) | Stock detail page, screener | Weekly backtest run | T+7 days max |

---

## SECTION 5 — DEPENDENCY GRAPH

### 5.1 Runtime Dependencies (Request-Time)

```
api/market-movers          → scanner.tradingview.com/egypt/scan [EXTERNAL, no auth, 8s timeout]
                           → Supabase: market_prices [FALLBACK if TV fails]

api/market-indices         → scanner.tradingview.com/egypt/scan [EGX30, EGX70, EGX100]
                           → mubasher.info [HTML scrape, EGX33 only — FRAGILE]
                           → HARDCODED fallback: { egx33: 6199.67, change: 0.46 }

api/intraday               → Supabase: intraday_snapshots [PRIMARY]
                           → query1.finance.yahoo.com/v8 [LIVE INJECT if stale/open]

api/trades                 → Supabase: recommended_trades [PRIMARY]
                           → scanner.tradingview.com/egypt/scan [current price for PnL]
                           → Supabase: market_prices [FALLBACK for price]

api/investor-flows         → CockroachDB (pool.query) [PRIMARY]
                           → Supabase: daily_investor_flows [FALLBACK]

api/orderbook              → Supabase: orderbook_snapshots [PRIMARY, usually empty]
                           → HARDCODED SYNTHETIC DATA [FALLBACK — most cases]

api/screener               → Supabase: market_prices [last 7 days]
                           → Supabase: companies
                           → Supabase: recommended_trades [for win_rate_hist lookup]
                           → HARDCODED win_rates [78/72/60 if no trade found — FABRICATED]

api/stream-prices          → livePriceStore [in-memory — EMPTY in production]
api/update-live-tick       → livePriceStore [in-memory — writes to different container]
```

### 5.2 Data Dependencies (Pipeline-Time)

```
generate_daily_recommendations.py
  DATA DEPS:
    ← market_prices (canonical candles)
    ← company_fundamentals (look-ahead contaminated)
    ← company_news (impact_score for boost)
    ← volume_profiles (VPOC boost)
    ← daily_investor_flows (flow_boost)
    ← recommended_trades (existing active trades to skip)
    ← MODEL FILE: models/model_1d_v6.pkl (committed to repo)
  OUTPUTS:
    → recommended_trades (INSERT/UPDATE)

train_model_v6.py
  DATA DEPS:
    ← market_prices
    ← company_fundamentals (same look-ahead issue)
    ← intraday_snapshots (for intraday model variants)
  OUTPUTS:
    → models/model_1d_v6.pkl (file on disk)
    → models/scaler_1d_v6.pkl
    → models/model_v6_metadata.json

trade_monitor.py
  DATA DEPS:
    ← recommended_trades (active trades)
    ← market_prices or TradingView scanner (current price)
  OUTPUTS:
    → recommended_trades (status=closed, exit fields)
    → Telegram (exit alert)
    → Web push (exit alert)

cockroach_sync.py
  DATA DEPS:
    ← Supabase: daily_investor_flows
  OUTPUTS:
    → CockroachDB: daily_investor_flows (mirror)
```

### 5.3 Dependency Classification

| Dependency | Type | Fragility |
|-----------|------|----------|
| TradingView Scanner → market data | External, runtime | ⚠️ HIGH — unofficial API, no SLA, could be blocked |
| Yahoo Finance v8 → intraday inject | External, runtime | ⚠️ HIGH — unofficial API, no SLA |
| EGX PDF → EOD prices | External, scheduled | 📋 MEDIUM — official but fragile HTML/PDF parsing |
| Mubasher HTML → EGX33 | External, runtime | 🚨 CRITICAL — fragile regex scrape, stale fallback |
| Supabase SDK → all services | External, runtime | 📋 MEDIUM — managed SaaS with SLA |
| CockroachDB → investor flows | External, runtime | 📋 MEDIUM — managed SaaS, Supabase fallback exists |
| `models/model_1d_v6.pkl` → signal engine | File, startup | ⚠️ HIGH — committed to git, no versioned model registry |
| Windows local machine → daily pipeline | Local, scheduled | 🚨 CRITICAL — SPOF, no HA |
| GitHub Actions → all cloud jobs | Platform, scheduled | 📋 MEDIUM — free tier has usage limits |

### 5.4 Circular / Problematic Dependencies

| Issue | Evidence |
|-------|---------|
| **Duplicate exit logic** | `trade_monitor.py` (Python) + `api/cron/track-recommended-trades` (TypeScript) both implement identical exit logic. No coordination. |
| **canonical.py not universally respected** | `api/intraday` defines its own `CANONICAL_SOURCES_INTRADAY` inline (line 138–145), diverging from `services/canonical.py` |
| **Signal engine updates active trade SL/TP daily** | `generate_daily_recommendations.py` updates TP/SL on existing active trades each day. Exit engine reads these updated levels. Creates a moving-target exit — no stable reference for historical PnL reconstruction. |
| **RPC priority vs canonical.py mismatch** | SQL `get_latest_prices()` gives `intraday_consensus` priority 3; `canonical.py` marks it FORBIDDEN |

---

## SECTION 6 — TEMPORAL ARCHITECTURE

### 6.1 Timestamp Semantics by Object

| Object | `created_at` / `recommended_at` | `updated_at` | `closed_at` | `price_date` / `snapshot_time` | Timezone |
|--------|--------------------------------|-------------|------------|-------------------------------|---------|
| `recommended_trades` | `datetime.now(UTC).isoformat()` — signal generation time | Via `features_snapshot` update | Exit event time | — | UTC stored, Cairo displayed |
| `market_prices` | `fetched_at TIMESTAMPTZ` | — | — | `price_date DATE` (date only) | Date is EGX calendar date; `fetched_at` is UTC |
| `intraday_snapshots` | `snapshot_time TIMESTAMPTZ` | — | — | `snapshot_time` | UTC (TV/Yahoo timestamps are UTC) |
| `company_news` | `published_at` | — | — | — | Mixed (depends on source) |
| `daily_investor_flows` | `trade_date DATE` | — | — | `trade_date` | Cairo calendar date |
| `performance_reports` | `report_date` | — | — | — | UTC |

### 6.2 Cairo Time Assumptions in API Code

The platform makes heavy use of Cairo time (UTC+3) for market session logic. All session gates use:
```typescript
const getCairoHour = (): number =>
  parseInt(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo', hour: 'numeric', hour12: false
  }).format(new Date()))
```

**EGX Trading Hours:** Sunday–Thursday, 10:00–15:00 Cairo (UTC+3).

### 6.3 Historical Replay Feasibility

| Scenario | Feasible? | Reason |
|----------|-----------|--------|
| Replay daily OHLCV | ✅ YES | `market_prices` stores all historical bars with dates |
| Replay intraday candles | ⚠️ PARTIAL | `intraday_snapshots` has limited depth (few months); no guaranteed completeness |
| Replay signal features at entry | ✅ YES (partial) | `features_snapshot JSONB` in `recommended_trades` stores feature values at signal time |
| Replay TP/SL levels at entry | ⚠️ NO | Daily generator overwrites TP/SL/prob on existing active trades. Original levels not preserved. |
| Reconstruct portfolio equity curve | 🚨 NO | Trades stored as sequential records, not with simultaneous position state |
| Replay fundamentals at entry date | 🚨 NO | `company_fundamentals` stores only current values — no history |

---

## SECTION 7 — AUTOMATION ARCHITECTURE

### 7.1 Complete Job Schedule Map

```
UTC TIME  │ CAIRO TIME │ JOB                              │ TRIGGER              │ STATUS
──────────┼────────────┼──────────────────────────────────┼──────────────────────┼─────────
09:00 UTC │ 12:00      │ (session mid-run trade monitor)  │ trade-monitor.yml    │ ✅ WORKING
10:00 UTC │ 13:00      │ sync-intraday (Vercel cron)      │ vercel.json          │ ✅ WORKING
13:00 UTC │ 16:00      │ egx-investor-flows.yml           │ GH Action            │ ✅ WORKING
13:30 UTC │ 16:30      │ sync-investor-flows (Vercel)     │ vercel.json          │ ✅ WORKING
14:00 UTC │ 17:00      │ intraday-analysis (Vercel cron)  │ vercel.json          │ ✅ WORKING
14:30 UTC │ 17:30      │ daily-recommendations.yml        │ GH Action            │ ✅ WORKING
15:00 UTC │ 18:00      │ daily_update.yml                 │ GH Action            │ ✅ WORKING
15:00 UTC │ 18:00      │ track-recommended-trades (Vercel)│ vercel.json          │ 🚨 BROKEN
  (daily  │            │ daily_news_intelligence.yml      │ GH Action            │ ✅ WORKING
  but     │            │ daily-backfill.yml               │ GH Action            │ ✅ WORKING
  time    │            │ session-crons.yml                │ GH Action            │ ✅ WORKING
  varies) │            │ live-session-candles.yml         │ GH Action            │ ✅ WORKING
  (weekly)│            │ weekly_backtest.yml              │ GH Action (weekly)   │ ✅ WORKING
          │            │ weekly_fundamentals_sync.yml     │ GH Action (weekly)   │ ✅ WORKING
          │            │ weekly_performance_analytics.yml │ GH Action (weekly)   │ ✅ WORKING
          │            │ weekly_shariah_review.yml        │ GH Action (weekly)   │ ✅ WORKING
          │ Fri 19:00  │ sync-shariah (Vercel)            │ vercel.json          │ ✅ WORKING
LOCAL     │ TBD        │ run_daily.bat (Windows)          │ Task Scheduler       │ ⚠️ SPOF
```

### 7.2 Retry and Failure Handling

| Job | Retry? | Failure Handling | Alerting |
|-----|--------|-----------------|---------|
| GH Action workflows | GitHub retries once on failure (if configured) | `upload-artifact` on failure for logs (`daily-recommendations.yml`) | No automatic alert on most workflows |
| Vercel cron | No retry | Silent skip or 500 logged in Vercel | No alert |
| Windows bat | No retry | `echo [ERROR]` to `scheduler.log` only | No alert |
| Python scripts | `try/except` with `logger.error()` | File log only | Some send Telegram alerts |

### 7.3 Monitoring

| Layer | Tool | Status |
|-------|------|--------|
| GH Actions | GitHub Actions UI + optional email | Available but not configured for alerts |
| Vercel cron | Vercel dashboard logs | Available; timing bug makes all track-trades logs show "skipped" |
| Python scripts | `logs/*.log` file-based | On GH Action runner: ephemeral (lost after run unless uploaded as artifact); on local machine: permanent |
| Telegram | `performance_analytics.py` sends weekly report | ✅ WORKING but only weekly |
| Database health | None | No health check queries, no connection pool monitoring |

---

## SECTION 8 — FRONTEND DATA ARCHITECTURE

### 8.1 Dashboard Page (`/`)

```
Component: MarketMoversWidget
  → fetch('/api/market-movers') [force-dynamic, no cache]
      → POST scanner.tradingview.com/egypt/scan → live prices
      → FALLBACK: SELECT from market_prices last 7 days
  → Rendered: gainers, losers, most-active-volume, most-active-value

Component: EGX Indices (EGX30/70/100/33)
  → fetch('/api/market-indices') [force-dynamic]
      → scanner.tradingview.com/egypt/scan (EGX30, 70, 100)
      → mubasher.info HTML scrape (EGX33)
      → FALLBACK: hardcoded { egx33: 6199.67 }

CACHING: None (revalidate=0, force-dynamic)
POLLING: None — data is fresh only on page load or tab focus
STALE STATE: Prices go stale after user loads page — no refresh trigger
```

### 8.2 Stock Detail Page (`/stock/[symbol]`)

```
Component: PriceHeader
  → lib/queries.ts: fetchCompaniesWithPrices()
      → supabase.rpc('get_latest_prices')  [source-priority price]
      → OVERRIDE: SELECT from market_prices last 3 days ORDER BY fetched_at DESC
      [Two separate queries — RPC result may be overridden by fresher raw price]

Component: Candlestick Chart
  → fetch('/api/intraday?symbol=X&interval=N')
      → SELECT from intraday_snapshots (DB candles)
      → INJECT: Yahoo Finance v8 (today's candles if stale)
      → source label always returns 'tradingview' regardless of actual source

Component: Order Book
  → fetch('/api/orderbook?symbol=X')
      → SELECT from orderbook_snapshots (usually empty)
      → FALLBACK: hardcoded synthetic data [presented as real]

Component: Fundamentals Panel
  → lib/queries.ts: fetchFundamentals()
      → SELECT from company_fundamentals
      → DEFAULTS: debt_equity ?? 0.38, profit_margin ?? 18.5, etc. [fabricated]

CACHING: None (force-dynamic)
POLLING: None — chart does NOT auto-refresh
STALE STATE: After page load, chart data is static until manual refresh
```

### 8.3 Screener Page (`/screener`)

```
Component: StockTable
  → fetch('/api/screener')
      → SELECT close_price, change_percent, volume from market_prices (last 7 days)
      → JOIN companies
      → SIGNAL LOGIC (NOT ML):
          if change >= 2.2: signal='buy'
          elif change <= -2.2: signal='sell'
          else if change > 0.5: signal='buy'
          else: signal='neutral'
      → WIN RATE:
          activeTrade?.win_rate_hist ?? (signal==='buy' ? 78 : 72 or 60) [FABRICATED]

CACHING: None
POLLING: None
ML: NOT USED in screener — pure price change threshold logic
```

### 8.4 Trades/Performance Page (`/`)

```
Component: ActiveSignals
  → fetch('/api/trades?limit=1000')
      → SELECT from recommended_trades WHERE recommended_at >= '2026-08-03'
      [998 historical trades hidden by LAUNCH_DATE filter]
      → For each trade: fetch current price from TV scanner
      → BADGE FABRICATION:
          is_wyckoff_spring = snap.is_wyckoff_spring ?? (hashIdx % 7 === 0)
          fundamental_badge_ar = snap.fundamental_badge_ar ?? '💎 خصم 28%'
          smart_money_score = snap.smart_money_score ?? 82.0
          is_macd_dead_cross = snap.is_macd_dead_cross ?? (hashIdx % 11 === 0 && pnl >= 2.5)
      → PERFORMANCE STATS: only from post-2026-08-03 data (2 days at audit time)

CACHING: None (revalidate=0, fetchCache='force-no-store')
POLLING: None
HISTORY: Pre-launch trades invisible (hidden by LAUNCH_DATE)
```

---

## SECTION 9 — DATABASE ARCHITECTURE

### 9.1 Entity Relationship (Key Tables)

```
companies ──────────────────────────────────────────────────────────────┐
  id UUID PK                                                             │
  symbol VARCHAR UNIQUE                                                  │
  name_ar, name_en                                                       │
  sector, market_type                                                    │
  is_shariah_compliant BOOLEAN                                           │
  is_egx33_shariah BOOLEAN                                               │
  is_sme BOOLEAN                                                         │
  listing_status, status                                                 │
  currency                                                               │
  notes TEXT (used for SPLIT_DETECTED flags)                             │
                                                                         │ FK: company_id
market_prices ──────────────────────────────────────────────────────────┤
  id UUID PK                                                             │
  company_id UUID FK → companies.id                                      │
  price_date DATE                                                        │
  open_price, high_price, low_price, close_price NUMERIC                 │
  change_value, change_percent NUMERIC                                   │
  volume BIGINT                                                          │
  source VARCHAR  ── multi-source per date (dedup via RPC)              │
  fetched_at TIMESTAMPTZ                                                  │
  data_quality_flag VARCHAR  ── exists, not surfaced in UI              │
  UNIQUE (company_id, price_date, source)                                │
                                                                         │
intraday_snapshots ─────────────────────────────────────────────────────┤
  id UUID PK                                                             │
  company_id UUID FK → companies.id                                      │
  snapshot_time TIMESTAMPTZ                                              │
  open_price, high_price, low_price NUMERIC                              │
  price NUMERIC  ── close price (inconsistent column name)             │
  volume BIGINT                                                          │
  source VARCHAR  ── tradingview_15m, tradingview_1h, yahoo_15m, etc.  │
                                                                         │
recommended_trades ─────────────────────────────────────────────────────┤
  id UUID PK                                                             │
  company_id UUID FK → companies.id                                      │
  symbol VARCHAR  ── denormalized (duplicates companies.symbol)         │
  direction VARCHAR  ── 'buy' | 'sell'                                  │
  entry_price NUMERIC                                                    │
  tp1, tp2, sl NUMERIC  ── UPDATED DAILY by signal engine (moving target)│
  status VARCHAR  ── 'active' | 'closed' | 'tp1_hit'                   │
  ml_probability NUMERIC  ── UPDATED DAILY by signal engine             │
  win_rate_hist NUMERIC  ── historical win rate from signal_stats        │
  features_snapshot JSONB  ── signal-time feature values               │
  pnl_percent NUMERIC  ── computed at exit, stored                      │
  exit_price NUMERIC                                                     │
  exit_reason VARCHAR  ── 'stop_loss' | 'tp1_hit' | 'tp2_hit' | etc.  │
  recommended_at TIMESTAMPTZ  ── signal generation time                 │
  closed_at TIMESTAMPTZ                                                  │
  flow_signal VARCHAR                                                    │
  timeframe VARCHAR                                                      │
                                                                         │
company_fundamentals ───────────────────────────────────────────────────┤
  id UUID PK                                                             │
  company_id UUID FK → companies.id                                      │
  pe_ratio, pb_ratio, eps NUMERIC                                        │
  revenue, net_income NUMERIC                                            │
  debt_to_equity, profit_margin NUMERIC                                  │
  revenue_growth, earnings_growth NUMERIC                                │
  fair_value NUMERIC  ── analyst estimate                               │
  dividend_yield NUMERIC                                                 │
  [NO point-in-time history — single row per company]                    │
                                                                         │
company_news ───────────────────────────────────────────────────────────┤
  id UUID PK                                                             │
  company_id UUID FK → companies.id                                      │
  title, content TEXT                                                    │
  source VARCHAR  ── 'almal' | 'egx_disclosure' | etc.                 │
  published_at TIMESTAMPTZ                                               │
  category VARCHAR                                                       │
  impact_score NUMERIC  ── NLP-derived                                  │
                                                                         │
signal_stats ───────────────────────────────────────────────────────────┤
  id UUID PK                                                             │
  company_id UUID FK → companies.id                                      │
  symbol VARCHAR                                                         │
  timeframe VARCHAR  ── '1d' | '15m' | '1h' | '4h'                    │
  signal_type VARCHAR  ── 'buy' | 'sell'                               │
  total_signals INT                                                      │
  tp1_hits, tp2_hits INT                                                 │
  win_rate_tp1, win_rate_tp2 NUMERIC  ── from rule-based backtest, NOT ML│
  avg_bars_tp1, avg_bars_tp2 NUMERIC                                     │
  last_updated TIMESTAMPTZ                                               │
                                                                         │
daily_investor_flows ───────────────────────────────────────────────────┤
  trade_date DATE                                                        │
  egyptian_net, arab_net, foreign_net NUMERIC  ── EGP millions          │
  egyptian_buy, egyptian_sell NUMERIC                                    │
  arab_buy, arab_sell NUMERIC                                            │
  foreign_buy, foreign_sell NUMERIC                                      │
  [ALSO in CockroachDB as mirror]                                        │
                                                                         │
corporate_events, insider_trading ─────────────────────────────────────┤
  [Added 2026-08-01. company_id FK. Populated by egx_disclosures_insider_scraper.py]
                                                                         │
technical_levels ───────────────────────────────────────────────────────┤
  [Added 2026-08-02. Fibonacci, Order Blocks, FVG.]                     │
  [Population mechanism: unknown — not confirmed in any script]          │
                                                                         │
seasonality_patterns ───────────────────────────────────────────────────┤
  [Added 2026-08-02. Monthly avg return per company/month.]             │
  [Populated by seasonality_engine.py. Coverage unknown.]               │
                                                                         │
volume_profiles ────────────────────────────────────────────────────────┤
  company_id FK, vpoc, vah, val NUMERIC, calculated_at TIMESTAMPTZ       │
  [Added 2026-08-02. Populated by volume_profile_engine.py. Coverage unknown.]│
                                                                         │
orderbook_snapshots ────────────────────────────────────────────────────┤
  company_id FK, top_bids_json JSONB, top_asks_json JSONB               │
  [Added 2026-08-02. MOSTLY EMPTY — orderbook_service.py not confirmed running.]│
                                                                         │
market_breadth_snapshots ───────────────────────────────────────────────┤
  [market health snapshots. advance/decline ratio.]                      │
  [Populated by market_breadth_engine.py. Schedule: unknown.]            │
                                                                         │
trade_alerts ───────────────────────────────────────────────────────────┤
  [Added 2026-07-31. In-app trade notifications.]                        │
                                                                         │
push_subscriptions ─────────────────────────────────────────────────────┘
  [Web push VAPID tokens. Populated at user subscription.]
```

### 9.2 Indexing & Integrity

| Table | Known Indexes | FK Integrity | RLS |
|-------|--------------|-------------|-----|
| `companies` | PK, UNIQUE symbol | — | Public SELECT enabled |
| `market_prices` | PK, UNIQUE (company_id, price_date, source), INDEX price_date | company_id → companies | Public SELECT |
| `intraday_snapshots` | PK, INDEX (company_id, snapshot_time, source) | company_id → companies | Public SELECT |
| `recommended_trades` | PK | company_id → companies | Public SELECT |
| `company_fundamentals` | PK | company_id → companies | Public SELECT |
| `signal_stats` | PK, UNIQUE (company_id, timeframe, signal_type) | company_id → companies | Public SELECT |
| New tables (2026-08-02) | PK only (from migration) | company_id → companies | `USING (true)` |

---

## SECTION 10 — AI / QUANT ARCHITECTURE

### 10.1 Model Inventory (ACTUAL)

| Model | File | Version | Features | Accuracy (claimed) | Training |
|-------|------|---------|----------|-------------------|---------|
| Daily BUY/SELL classifier | `model_1d_v6.pkl` | v6 | 30 | Unknown (metadata not read) | Manual, developer's local machine |
| Daily scaler | `scaler_1d_v6.pkl` | v6 | StandardScaler | — | Same as model |
| Intraday model | `model_1d.pkl` | v1 | 15 | 56.43% (v2 baseline) | — |
| Intraday v2 | `model_4h_v2.pkl` | v2 | 15 | 56.43% | — |

### 10.2 Feature Engineering (ACTUAL vs INTENDED)

| Feature Group | Count | Status | Look-Ahead Safe? |
|--------------|-------|--------|-----------------|
| Technical indicators (RSI, MACD, EMA, ATR, etc.) | 15 | ✅ ACTUAL — computed from price series | ✅ YES |
| Sentiment/macro placeholders | 7 | 🚨 ACTUAL — hardcoded `0.0, 1.0` | N/A (constants) |
| Fundamental (PE, margin, fair value, etc.) | 8 | ✅ ACTUAL — used in model | 🚨 NO — current values for all history |
| Elliott Wave, ICT, Wyckoff (post-model boosts) | Varies | ✅ ACTUAL — additive to `prob` | Not trained — unvalidated boosts |
| OFI ratio | 1 | 🚨 DEAD — constant 0.5 in training data | N/A |

### 10.3 Signal Confidence Architecture (ACTUAL)

```
raw_prob = model.predict_proba(X)[0][1]  ← XGBoost BUY probability

prob = raw_prob
  + fundamental_boost     (from PE/fair_value analysis)
  + news_boost            (±0.07/0.09 from company_news.impact_score)
  + wyckoff_boost         (from wyckoff_engine.py)
  + pattern_boost         (from patterns_engine.py)
  + smart_money_boost     (from smart_money_engine.py)
  + ict_smc_boost         (from ict_smc_engine.py)
  + elliott_boost         (from elliott_time_engine.py)
  + flow_boost            (from daily_investor_flows, ±0.05 to ±0.15)
  + volume_profile_boost  (from volume_profiles table, +0.05)
  └── clip to [0.0, 0.99]

GATE: prob >= 0.65 → BUY signal
      prob <= 0.35 → SELL signal (misapplication: BUY classifier inverse ≠ SELL signal)
      0.35 < prob < 0.65 → signal_stats counter update only

None of the post-model boosts have been walk-forward validated.
```

### 10.4 Backtesting Architecture (ACTUAL)

| Component | What it tests | Bias |
|-----------|--------------|------|
| `backtest_signals.py` | Rule-based: RSI+MACD+SMA trend-following | Multi-source duplicate candles; no cost modeling |
| `backtest_engine.py` | Unknown (not fully read) | Unknown |
| `validate_backtest.py` | Aspirational validation harness | NOT operationally confirmed; optional deps (quantstats, vectorbt) may not be installed in CI |
| `backtest_results.json` | Mix of rule-based simulation + actual live trade stats | In-sample; look-ahead; no walk-forward |

### 10.5 Performance Attribution (ACTUAL)

| Metric | Method | Standard? |
|--------|--------|----------|
| Win Rate | `count(pnl > 0) / count(all)` | ✅ Standard |
| Avg PnL | `mean(pnl_percent)` | ✅ Standard |
| Sharpe | `mean/std` (no annualization, no risk-free rate) | 🚨 NON-STANDARD |
| Max Drawdown | Sequential cumulative product of trade returns | 🚨 NOT portfolio-level |
| Benchmark | `pct_change()` on all market_prices rows (cross-company, cross-source) | 🚨 MEANINGLESS |

---

## SECTION 11 — FAILURE ARCHITECTURE

### "What happens when X fails?"

| Failure | System Response | Alert? | User Sees |
|---------|----------------|--------|----------|
| TradingView scanner returns empty | DB fallback (last 7 days `market_prices`) | No | Stale prices, no indicator |
| Yahoo Finance v8 returns 4xx/5xx | `null` returned, Yahoo candles not injected | No | DB candles only (potentially yesterday's) |
| EGX website down for 1 day | TradingView scraper runs instead; egx_bulletin not written | No | TV prices shown |
| EGX website down for > 5 days | `canonical.py` freshness check fails; no candles returned; no signals | No | "No data" charts; no signal generation |
| Supabase unavailable | All API routes return 500 | No | Generic error |
| CockroachDB unavailable | `investor-flows/route.ts` catches exception; falls back to Supabase query | No | Supabase data shown |
| Mubasher HTML structure changes | EGX33 scrape fails; hardcoded fallback `6199.67` shown | No | Stale/wrong EGX33 value |
| Signal engine (GH Action) fails | No new signals for that day; active trades not updated | Log uploaded as artifact | No new signals |
| Trade monitor (GH Action) fails | Active trades not evaluated; no exits triggered | No | Active trades continue running |
| Vercel cron fires (track-recommended-trades) | Session gate check: always skipped | No | No effect (it never worked) |
| ML model file missing from repo | `FileNotFoundError` raised → signal engine crashes | No | No signals |
| Windows local machine offline | `run_daily.bat` doesn't run; GH Action is backup for price ingestion | No | Delayed data |
| Orderbook service not running | `orderbook_snapshots` stays empty → synthetic data returned | No | Fabricated data shown as real |
| Chart endpoint returns empty `candles:[]` | Frontend renders empty/blank chart | No | Blank chart |
| Fundamental data missing | Hardcoded defaults applied (0.38 D/E, 18.5% margin) | No | Fabricated ratios shown |
| `features_snapshot` JSON null for a trade | Hash-based badge fabrication → fake badges shown | No | Fabricated technical badges |

---

## SECTION 12 — ARCHITECTURAL WEAKNESSES

### CRITICAL

| ID | Weakness | Evidence |
|----|---------|---------|
| AW-C1 | **Service role JWT hardcoded in source** | `investor-flows/route.ts` line 18: full `eyJhbGci...` key in TypeScript source |
| AW-C2 | **Order book is fabricated data** — presented as real Level 2 market depth | `api/orderbook/route.ts` lines 59–73: hardcoded bid/ask volumes |
| AW-C3 | **SSE live streaming architecture impossible on Vercel** — serverless containers cannot share in-memory state | `live-price-store.ts` lines 69–71: singleton guard disabled in production |
| AW-C4 | **Primary exit cron always skipped** — Vercel `track-recommended-trades` fires at 18:00 Cairo, gate closes at 13:30 Cairo | `vercel.json` + route.ts session gate math |

### HIGH

| ID | Weakness | Evidence |
|----|---------|---------|
| AW-H1 | **Look-ahead bias in ML training** — 8 fundamental features use current values for historical bars | `generate_daily_recommendations.py` lines 307–317; `company_fundamentals` single-row design |
| AW-H2 | **Duplicate exit logic** — Python and TypeScript versions with no coordination | Both files confirmed, ~600 lines each |
| AW-H3 | **Canonical layer not universally respected** — routes define own source priority | `intraday/route.ts` inline list vs `canonical.py` |
| AW-H4 | **RPC priority contradicts canonical.py** — `intraday_consensus` is FORBIDDEN in code, priority 3 in SQL | Migration `20260720220522` vs `canonical.py` |
| AW-H5 | **LAUNCH_DATE filter hides 998 historical trades** | `api/trades/route.ts` line 24 |
| AW-H6 | **Screener win rates fabricated** | `api/screener/route.ts` line 99 |
| AW-H7 | **Trade metadata badges fabricated by hash** | `api/trades/route.ts` lines 361–378 |
| AW-H8 | **Fundamental display defaults are fabricated** | `lib/queries.ts` lines 321–324 |
| AW-H9 | **Windows local machine SPOF** | `run_daily.bat` + no HA backup |
| AW-H10 | **Backtest is in-sample; validate_backtest.py is non-operational** | `validate_backtest.py` optional deps; no confirmed CI run |
| AW-H11 | **SELL signal is BUY classifier inverse** — not a proper SELL model | `generate_daily_recommendations.py` line 674: `elif prob <= 0.35` |
| AW-H12 | **Signal engine updates TP/SL daily** — original trade levels not preserved | Lines 638–650: in-place UPDATE on active trades |

### MEDIUM

| ID | Weakness | Evidence |
|----|---------|---------|
| AW-M1 | **No circuit breaker** for external API failures (TV, Yahoo, EGX, Mubasher) | All routes use simple try/catch with no backoff or rate tracking |
| AW-M2 | **No centralized log aggregation** — logs are file-based on ephemeral GH runners | File logging only; GH artifacts uploaded only on failure for one workflow |
| AW-M3 | **Intraday source mislabeled** — Yahoo Finance candles returned as `source: 'tradingview'` | `intraday/route.ts` line 259 |
| AW-M4 | **Price shown differs by page** — 4 different APIs, 4 different price source logics | Confirmed across routes |
| AW-M5 | **Non-standard Sharpe ratio** — `mean/std` without annualization or risk-free rate | `performance_analytics.py` line 132 |
| AW-M6 | **Meaningless benchmark** — pct_change across all market_prices rows cross-company | `performance_analytics.py` line 144 |
| AW-M7 | **CockroachDB credentials in committed .env** | `.env` file confirmed |
| AW-M8 | **`technical_levels`, `volume_profiles` tables have no confirmed population mechanism** | Migration confirms schema; no confirmed script runs on schedule |
| AW-M9 | **`signal_stats.win_rate_tp1` computed from old buggy MACD** | Confirmed MACD bug fix in v4+ but `backtest_signals.py` may use old formula |
| AW-M10 | **No portfolio-level risk management** — all trades treated as equal-weight, no position sizing | Entire codebase confirmed |

### LOW

| ID | Weakness |
|----|---------|
| AW-L1 | `track_trades_schedule.yml` is disabled but not deleted — creates confusion |
| AW-L2 | `run_daily.bat` runs both `track_trades.py` and the GitHub Action handles `trade_monitor.py` — possible double execution |
| AW-L3 | `day_of_week` feature uses today's date for all historical training bars |
| AW-L4 | Yahoo Finance candle timestamps are Unix seconds; DB timestamps are ISO strings — conversion in `intraday/route.ts` handles this but is brittle |

---

## SECTION 13 — ARCHITECTURE SCORECARD

| Domain | Score | Evidence |
|--------|-------|---------|
| **Data Architecture** | 52/100 | Canonical layer exists but not universally applied; fundamentals are point-in-time deficient; multi-source dedup works at DB level |
| **Integration** | 48/100 | 6 external APIs; no circuit breakers; fragile scrapers (Mubasher HTML, TV unofficial API); TradingView as primary live data source without contract |
| **Modularity** | 55/100 | Python services are reasonably decomposed; API routes are monolithic (trades/route.ts = 907 lines); duplicate exit logic |
| **Scalability** | 50/100 | Vercel serverless scales horizontally; but SSE pattern requires persistent server; Windows local machine doesn't scale |
| **Reliability** | 40/100 | Primary exit cron broken; SSE broken; Windows SPOF; no circuit breakers; no retry on most jobs |
| **Observability** | 30/100 | File-based logs on ephemeral runners; no metrics; no dashboards; no alerting on failures; Telegram alerts only on trade events |
| **Temporal Integrity** | 35/100 | Timestamps stored correctly; but look-ahead in features; TP/SL overwritten daily (no immutable audit trail); `signal_stats` uses potentially stale MACD calculation |
| **Security** | 25/100 | Service role key in source code; credentials in .env; no MFA evidence; public SELECT RLS is appropriate for read-only data |
| **Quant Architecture** | 30/100 | XGBoost model exists; 8/30 features have look-ahead bias; 7/30 are dead constants; SELL signal is inverse BUY; Sharpe non-standard; backtest in-sample |
| **Automation** | 55/100 | 16 GH Actions; but Vercel exit cron broken; Windows SPOF; no retry; no failure alerts |
| **Frontend Integration** | 58/100 | Pages render correctly; no client-side caching; no polling; prices go stale after load; fabricated data in multiple places |
| **Database Architecture** | 65/100 | Schema well-designed; correct dedup UNIQUEs; RLS enabled; but `intraday_consensus` in RPC contradicts canonical.py; no point-in-time fundamentals |
| **OVERALL** | **45/100** | Functional for retail information display; multiple structural weaknesses prevent investment-grade operation |

---

## SECTION 14 — CANONICAL AS-IS ARCHITECTURE DIAGRAM

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║              TRADEORA EGX — CANONICAL AS-IS ARCHITECTURE                           ║
║              Date: 2026-08-05 | Status: Forensic READ-ONLY Record                  ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════╗
║  USERS                           ║
║  ┌────────┐  ┌────────┐          ║
║  │Retail  │  │Admin   │          ║
║  │Browser │  │Browser │          ║
║  └───┬────┘  └───┬────┘          ║
╚══════╪═══════════╪══════════════╝
       │ HTTPS     │ HTTPS
       └───────────┘
               │
               ▼
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  VERCEL SERVERLESS (Next.js 16.2.10 / React 19 / TypeScript 5)                    ║
║  ┌────────────────────────────────────────────────────────────────────────────┐   ║
║  │  PAGES (18 routes, SSR/SSG via App Router)                                 │   ║
║  │  / (dashboard) | /stock/[symbol] | /screener | /news | /investor-flows     │   ║
║  │  /performance | /analytics | /my-trades | /sectors | /calendar | /compare  │   ║
║  └────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                    ║
║  ┌──────────────────────────────────────────────────────────────────────────────┐ ║
║  │  API ROUTES (40+)                                                            │ ║
║  │                                                                              │ ║
║  │  DATA ROUTES:                                                                │ ║
║  │  /market-movers ──────────────────────────────────► TV Scanner (live) [A]   │ ║
║  │                  ────────────────────────────────── market_prices (fallback) │ ║
║  │  /market-indices ─────────────────────────────────► TV Scanner (live) [A]   │ ║
║  │                  ─── EGX33 ───────────────────────► mubasher.info [B] FRGL  │ ║
║  │                          └── FALLBACK: hardcoded 6199.67                    │ ║
║  │  /intraday ────────────────────────────────────────► intraday_snapshots [C] │ ║
║  │             ──── inject today ────────────────────► Yahoo Finance v8 [D]    │ ║
║  │  /orderbook ───────────────────────────────────────► orderbook_snapshots[C] │ ║
║  │              └── FALLBACK: HARDCODED SYNTHETIC DATA (145k,290k volumes)     │ ║
║  │  /investor-flows ─────────────────────────────────► CockroachDB [E] PRIM   │ ║
║  │                   ─────────────────────────────────► Supabase [C] FALLBACK  │ ║
║  │  /trades ─────────────────────────────────────────► recommended_trades [C]  │ ║
║  │           ──── live price ─────────────────────────► TV Scanner [A]         │ ║
║  │           └── LAUNCH_DATE='2026-08-03' HIDES PRE-LAUNCH DATA                │ ║
║  │  /screener ────────────────────────────────────────► market_prices [C]      │ ║
║  │             └── SIGNAL = price_change threshold (NOT ML)                    │ ║
║  │             └── WIN_RATE = 78/72/60 default (FABRICATED)                   │ ║
║  │  /news ────────────────────────────────────────────► company_news [C]       │ ║
║  │  /sectors ─────────────────────────────────────────► market_prices [C]      │ ║
║  │  /canonical-price ─────────────────────────────────► get_latest_prices() RPC│ ║
║  │  /market-breadth ──────────────────────────────────► market_breadth_snaps[C]│ ║
║  │  /volume-profile ──────────────────────────────────► volume_profiles [C]    │ ║
║  │  /seasonality ─────────────────────────────────────► seasonality_patterns[C]│ ║
║  │                                                                              │ ║
║  │  LIVE / STREAMING:                                                           │ ║
║  │  /stream-prices (SSE) ─────────────────────────────► livePriceStore [MEM]   │ ║
║  │                         ██ BROKEN: empty in production (serverless) ██       │ ║
║  │  /update-live-tick (POST) ─────────────────────────► livePriceStore [MEM]   │ ║
║  │                         ██ BROKEN: different container than SSE ██           │ ║
║  │                                                                              │ ║
║  │  CRON ROUTES (triggered by vercel.json):                                     │ ║
║  │  /cron/sync-intraday      [10:00 UTC] ─────────────► intraday sync   ✅     │ ║
║  │  /cron/intraday-analysis  [14:00 UTC] ─────────────► analysis jobs   ✅     │ ║
║  │  /cron/sync-investor-flows[13:30 UTC] ─────────────► flows sync      ✅     │ ║
║  │  /cron/sync-shariah       [Fri 16UTC] ─────────────► shariah sync    ✅     │ ║
║  │  /cron/track-recommended  [15:00 UTC] ─────────────► EXIT ENGINE     ██     │ ║
║  │                         ██ BROKEN: fires 18:00 Cairo, gate=13:30 ██         │ ║
║  │                                                                              │ ║
║  │  USER / AUTH ROUTES:                                                         │ ║
║  │  /alerts, /push, /telegram, /settings, /user-trades, /referral, /stripe    │ ║
║  └──────────────────────────────────────────────────────────────────────────────┘ ║
╚════════════════════════╤═══════════════════════════════════════════════════════════╝
                         │ Supabase JS SDK
                         ▼
╔══════════════════════════════════════════════════════╗   ╔═══════════════════════╗
║  SUPABASE PostgreSQL [C]                             ║   ║  COCKROACHDB [E]      ║
║  kdjsguozssxvtmlmqhpz.supabase.co                   ║   ║  AWS EU Central       ║
║                                                      ║   ║                       ║
║  TABLES:                                             ║   ║  daily_investor_flows ║
║  companies (master registry)                         ║◄──║  (mirror of Supabase) ║
║  market_prices (primary OHLCV — multi-source)        ║   ║                       ║
║  intraday_snapshots (15m/1h/4h candles)              ║   ║  Written by:          ║
║  recommended_trades (signals + trade tracking)       ║   ║  cockroach_sync.py    ║
║  company_fundamentals (single row per company)       ║   ╚═══════════════════════╝
║  company_news (scraped articles)                     ║
║  signal_stats (rule-based backtest WR)               ║
║  daily_investor_flows (EGX official data)            ║
║  corporate_events, insider_trading                   ║
║  trade_alerts, push_subscriptions                    ║
║  volume_profiles, orderbook_snapshots (sparse)       ║
║  seasonality_patterns, technical_levels (sparse)     ║
║  market_breadth_snapshots                            ║
║  performance_reports                                 ║
║                                                      ║
║  RPC: get_latest_prices() [source priority]          ║
║  RLS: Public SELECT on all tables                    ║
╚════════════════════════╤═════════════════════════════╝
                         │ (reads and writes)
                         │
╔════════════════════════╪════════════════════════════════════════════════════════════╗
║  GITHUB ACTIONS (ubuntu-latest, ephemeral per-run)                                ║
║                        │                                                          ║
║  daily_update.yml [15:00 UTC] ─────────────────────────────────────────────────  ║
║    main.py                                                                        ║
║      ├─► scrapers/egx_scraper.py → market_prices (egx_bulletin)                  ║
║      ├─► scrapers/tradingview_scraper.py → market_prices (tradingview_1d)         ║
║      ├─► services/fundamentals_importer.py → company_fundamentals                ║
║      ├─► generate_daily_recommendations.py → recommended_trades                  ║
║      │     ├─ loads models/model_1d_v6.pkl (from repo filesystem)                 ║
║      │     ├─ reads market_prices via services/canonical.py                       ║
║      │     ├─ reads company_fundamentals (LOOK-AHEAD BIAS ← current PE for all)  ║
║      │     ├─ applies 9 post-model boosts (unvalidated)                           ║
║      │     └─ upserts recommended_trades (updates TP/SL on existing active)      ║
║      ├─► scripts/validate_data.py → data quality check                           ║
║      └─► services/daily_report_service.py → EOD report                           ║
║                                                                                   ║
║  trade-monitor.yml [during session] ──────────────────────────────────────────── ║
║    trade_monitor.py                                                               ║
║      ├─ reads recommended_trades (status='active')                                ║
║      ├─ gets current price (TV scanner or market_prices)                          ║
║      ├─ evaluates 7 exit mechanisms                                               ║
║      └─ writes: recommended_trades (status, exit_price, pnl_percent, closed_at)  ║
║         + Telegram alert (on exit)                                                ║
║                                                                                   ║
║  egx-investor-flows.yml [~16:00 UTC] ─────────────────────────────────────────── ║
║    egx_flow_scraper.py → daily_investor_flows (Supabase + CockroachDB)            ║
║                                                                                   ║
║  intraday_prices_schedule.yml + live-session-candles.yml [during session] ──────  ║
║    tv_backfill.py → intraday_snapshots (tradingview_15m)                          ║
║                                                                                   ║
║  weekly_backtest.yml [weekly] ─────────────────────────────────────────────────── ║
║    backtest_signals.py → signal_stats (RULE-BASED, NOT ML; multi-source issue)    ║
║                                                                                   ║
║  weekly_performance_analytics.yml [weekly] ──────────────────────────────────── ║
║    performance_analytics.py → performance_reports                                 ║
║      ├─ non-standard Sharpe (mean/std, no annualization)                          ║
║      └─ meaningless benchmark (all market_prices pct_change)                     ║
║                                                                                   ║
║  [13 more workflows: news, shariah, backfill, session crons, cockroach-sync]      ║
╚════════════════════════╤══════════════════════════════════════════════════════════╝
                         │ (git pull; reads/writes same Supabase)
                         │
╔════════════════════════╪════════════════════════════════════════════════════════════╗
║  WINDOWS DEVELOPER MACHINE (SINGLE POINT OF FAILURE)                              ║
║                                                                                   ║
║  Windows Task Scheduler → run_daily.bat                                           ║
║    main.py (price ingestion — duplicate of GH Action daily_update.yml)            ║
║    track_trades.py (exit monitor — duplicate of trade_monitor.py)                 ║
║    signal_guardian.py (third exit layer — details unknown)                        ║
║    tv_backfill.py (intraday backfill — duplicate of GH Action)                    ║
║                                                                                   ║
║  Models stored here AND in git repo:                                              ║
║    models/model_1d_v6.pkl (2.7 MB)                                                ║
║    models/scaler_1d_v6.pkl                                                        ║
║                                                                                   ║
║  If machine is offline: GH Actions serve as backup for most jobs                 ║
╚═══════════════════════════════════════════════════════════════════════════════════╝

EXTERNAL DATA SOURCES:

[A] TradingView Scanner (scanner.tradingview.com/egypt/scan)
    ├─ Used by: market-movers, market-indices, trades (live price), tv_backfill.py
    ├─ Auth: None (browser headers spoofed)
    ├─ Timeout: 8 seconds
    └─ Risk: Unofficial API, no SLA, could be blocked

[B] Mubasher (mubasher.info/markets/EGX/indices/SHARIAH)
    ├─ Used by: market-indices (EGX33 only)
    ├─ Method: HTML regex scrape
    └─ Risk: Any DOM change breaks it; fallback is hardcoded stale value

[C] Supabase — See database section above

[D] Yahoo Finance v8 (query1.finance.yahoo.com/v8/finance/chart)
    ├─ Used by: intraday/route.ts (live today inject), yahoo_provider.py
    ├─ Auth: None (browser User-Agent)
    ├─ Timeout: 8 seconds (revalidate: 30s)
    └─ Risk: Unofficial API, rate-limited, no SLA

[E] CockroachDB — See container section above

[F] EGX Website (egx.com.eg)
    ├─ Used by: egx_scraper.py, egx_flow_scraper.py, egx_disclosures_insider_scraper.py
    └─ Risk: PDF structure changes break parsers

[G] Almal.com
    ├─ Used by: almal_news_scraper.py
    └─ Risk: HTML structure changes

[H] Telegram Bot API (api.telegram.org)
    ├─ Used by: alert-dispatcher.ts, performance_analytics.py, trade_monitor.py
    └─ Status: ✅ Working (real bot token configured)
```

---

*Document Classification: ACTUAL AS-IS ARCHITECTURE*  
*This document describes only what provably exists as of 2026-08-05.*  
*Implementation takes precedence over all documentation, comments, and intentions.*  
*Source evidence: 96 root files, 24 service files, 13 scrapers, 40 API routes, 12 migrations, 16 workflows, all confirmed by direct code inspection.*
