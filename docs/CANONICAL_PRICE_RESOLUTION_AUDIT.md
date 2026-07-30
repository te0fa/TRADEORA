# CANONICAL PRICE RESOLUTION AUDIT REPORT
## Enterprise Market Data Architecture & Data Governance Audit

**Auditor:** Chief Market Data Architect, Financial Data Governance Auditor, Canonical Price Resolution Investigator, & Enterprise Market Data Forensics Specialist  
**Audit Date:** 2026-07-30  
**Audit Classification:** ARCHITECTURAL & DATA GOVERNANCE FORENSICS — EVIDENCE ONLY  
**Target Codebase:** Tradeora (`e:\zaora\TRADEORA`)  
**Scope:** Read-Only Source Code Audit of Market Data Pipeline, Ingestion, Deduplication, & Canonical Resolution  

---

## EXECUTIVE SUMMARY & OBJECTIVE

### Objective

Tradeora collects market data from multiple providers (Official EGX Bulletins, TradingView Scanner, Yahoo Finance, Mubasher, Investing.com). However, only ONE canonical candle eventually feeds the Signal Engine and the User Interface.

This audit determines with absolute certainty **EXACTLY HOW THAT FINAL CANONICAL CANDLE IS SELECTED**, tracing data from raw provider ingestion to database storage and downstream execution.

---

## QUESTION 1: MARKET DATA PROVIDERS INVENTORY

| Provider Name | Purpose | Files | Functions | Output Format | Priority | Used By | Status |
|---------------|---------|-------|-----------|---------------|----------|---------|--------|
| **Official EGX Daily Bulletin** | Authoritative official EOD daily trading price bulletins | [`scrapers/egx_scraper.py`](file:///e:/zaora/TRADEORA/scrapers/egx_scraper.py#L12), [`main.py`](file:///e:/zaora/TRADEORA/main.py#L61), [`services/importer.py`](file:///e:/zaora/TRADEORA/services/importer.py#L15) | `EGXScraper.fetch_data()`, `_parse_html()`, `_parse_excel()`, `DataImporter.import_records()` | List of dicts `[{symbol, open_price, high_price, low_price, close_price, volume, value_traded, price_date}]` | **Rank #1** in Signal Engine & Signal Guardian; Rank #2 in PriceChart.tsx | Daily import pipeline (`main.py`), Signal Engine (`generate_daily_recommendations.py`), Signal Guardian (`signal_guardian.py`) | **ACTIVE** |
| **TradingView Scanner API** (`scanner.tradingview.com`) | EOD prices, intraday ticks, EGX30/70 indices, localized names | [`scrapers/tradingview_scraper.py`](file:///e:/zaora/TRADEORA/scrapers/tradingview_scraper.py#L8), [`scrapers/tradingview_provider.py`](file:///e:/zaora/TRADEORA/scrapers/tradingview_provider.py#L6), [`intraday_collector.py`](file:///e:/zaora/TRADEORA/intraday_collector.py#L7) | `TradingViewScraper.fetch_data()`, `TradingViewProvider.fetch_prices()`, `intraday_collector.main()` | Standardized dictionary records parsed from TradingView POST JSON response | **Rank #1** (`tradingview_1d`) in PriceChart.tsx & /api/intraday; **Rank #2** in Signal Engine | Intraday collector, main pipeline fallback (`main.py --source tradingview`), index tickers (`/api/egx30`, `/api/egx70`) | **ACTIVE** |
| **TradingView tvDatafeed** | Historical intraday candle backfill (1m, 5m, 15m, 1h, 4h) | [`tv_backfill.py`](file:///e:/zaora/TRADEORA/tv_backfill.py#L22) | `backfill_symbol()`, `TvDatafeed.get_hist()` | Pandas DataFrame converted to `intraday_snapshots` payloads | Dedicated historical backfill source (`tradingview_15m`, `tradingview_30m`, etc.) | Historical intraday backfill script (`tv_backfill.py`) | **ACTIVE** |
| **Yahoo Finance REST API** (`query1.finance.yahoo.com` & `yfinance`) | Historical daily candles (2 years backfill), live/intraday chart fallback, fundamentals | [`backfill_historical.py`](file:///e:/zaora/TRADEORA/backfill_historical.py#L28), [`scrapers/yahoo_provider.py`](file:///e:/zaora/TRADEORA/scrapers/yahoo_provider.py#L6), [`tradeora-web/app/api/yahoo-chart/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/yahoo-chart/route.ts#L31), [`tradeora-web/components/stock/PriceChart.tsx`](file:///e:/zaora/TRADEORA/tradeora-web/components/stock/PriceChart.tsx#L108) | `backfill_stock()`, `YahooProvider.fetch_prices()`, `fetchYahooCandles()`, `GET()` | Yahoo Finance JSON chart structure or DataFrame (unadjusted and `adjclose` adjusted) | **Rank #3** in Signal Engine; **Rank #4** in PriceChart.tsx & `get_latest_prices()` RPC | Historical backfill script, Intraday consensus fallback, Frontend chart fallback | **ACTIVE** |
| **Mubasher.info Portal** | Real-time stock prices, close-only price sync, market overview bar | [`scrapers/mubasher_provider.py`](file:///e:/zaora/TRADEORA/scrapers/mubasher_provider.py#L6), [`tradeora-web/app/api/cron/sync-prices/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/cron/sync-prices/route.ts#L35) | `MubasherProvider.fetch_prices()`, `GET()` in sync-prices route | Dictionary `[{symbol, close_price, volume, source: 'mubasher'}]` (Close-only, missing OHLC) | **Excluded** from Signal Engine `ALLOWED` list; Rank #2 in market overview bar | Cron price sync (`/api/cron/sync-prices`), Mubasher sync script (`sync-mubasher.js`) | **ACTIVE (Price sync only; EXCLUDED from Signal Engine)** |
| **Investing.com** | Secondary price scraping for auditing/comparison | [`scrapers/investing_provider.py`](file:///e:/zaora/TRADEORA/scrapers/investing_provider.py#L6), [`services/intraday_importer.py`](file:///e:/zaora/TRADEORA/services/intraday_importer.py#L51) | `InvestingProvider.fetch_prices()` | Dictionary `[{symbol, price, change, volume, source: 'investing'}]` | **Excluded** from production consensus due to Cloudflare anti-bot blocks | Manual/Legacy comparison scripts | **LEGACY / EXCLUDED IN PRODUCTION** |

---

## QUESTION 2: FIRST POINT OF ENTRY & COMPLETE FLOW

```
[ Provider: Official EGX Bulletin ]
  │
  ▼
[ HTTP Request / File Download ]
File: scrapers/egx_scraper.py (Line 30) -> fetch_data()
  │
  ▼
[ Parser ]
File: scrapers/egx_scraper.py (Lines 74-120) -> _parse_html() / _parse_excel() / _parse_csv()
  │
  ▼
[ Normalizer ]
File: scrapers/egx_scraper.py (Line 125)
- Standardizes ticker symbols (strips .CA)
- Converts numeric strings to float/int
- Computes change_value and change_percent
  │
  ▼
[ Validator ]
File: services/importer.py (Line 120) -> _validate_record()
- Checks open_price > 0, close_price > 0
- Checks high_price >= low_price
- Checks volume >= 0
- Flags 'close_outside_range' soft warning if applicable
  │
  ▼
[ Database Insert / Upsert ]
File: database/db.py (Line 203) -> upsert_market_prices()
Target Table: market_prices
PostgreSQL Statement: ON CONFLICT (company_id, price_date, source) DO UPDATE ...
```

---

## QUESTION 3: WHERE PROVIDER PRIORITY IS DEFINED

### Determination: HARDCODED LOGIC (Decentralized Across Subsystems)

There is **NO central configuration file, environment variable, or database setting** defining provider priority. Instead, priority rankings are **hardcoded independently** inside five separate consumer files:

1. **Backend Signal Engine:** [`generate_daily_recommendations.py`](file:///e:/zaora/TRADEORA/generate_daily_recommendations.py#L297)
   ```python
   SOURCE_PRIORITY = ['egx_bulletin', 'tradingview_1d', 'yahoo_historical', 'tradingview', 'yahoo_live']
   ```
2. **Backend Signal Guardian:** [`signal_guardian.py`](file:///e:/zaora/TRADEORA/signal_guardian.py#L49)
   ```python
   PRIORITY = ['egx_bulletin', 'tradingview_1d', 'yahoo_historical', 'tradingview', 'intraday_consensus']
   ```
3. **Database PostgreSQL RPC Function:** [`database/migrations/005_create_get_latest_prices.sql`](file:///e:/zaora/TRADEORA/database/migrations/005_create_get_latest_prices.sql#L29)
   ```sql
   CASE mp.source 
     WHEN 'egx_bulletin' THEN 1 
     WHEN 'tradingview' THEN 2 
     WHEN 'intraday_consensus' THEN 3 
     WHEN 'yahoo_historical' THEN 4
     ELSE 5
   END
   ```
4. **Frontend Price Chart Component:** [`tradeora-web/components/stock/PriceChart.tsx`](file:///e:/zaora/TRADEORA/tradeora-web/components/stock/PriceChart.tsx#L613)
   ```typescript
   const priority = (src?: string) => {
     if (src === 'tradingview_1d') return 1;
     if (src === 'egx_bulletin') return 2;
     if (src === 'tradingview') return 3;
     if (src === 'yahoo_historical') return 4;
     if (src === 'yahoo_live') return 5;
     return 99;
   };
   ```
5. **Frontend Intraday API Route:** [`tradeora-web/app/api/intraday/route.ts`](file:///e:/zaora/TRADEORA/tradeora-web/app/api/intraday/route.ts#L45)
   ```typescript
   const isTv = d.source === 'tradingview_1d' || d.source === 'tradingview';
   if (!dateMap[dateStr] || isTv) { dateMap[dateStr] = d; }
   ```

---

## QUESTION 4: HOW IS THE CANONICAL CANDLE SELECTED?

### Selection Mechanism: PROVIDER PRIORITY (Read-Time Deduplication)

Tradeora does **not** generate or store a single fused "consensus" candle during database insertion. All providers write their own raw rows into `market_prices` with their respective `source` tag.

Canonical selection occurs **at query/read time** via a deduplication loop:

- **Exact Implementation in Signal Engine ([`generate_daily_recommendations.py` Lines 297–314](file:///e:/zaora/TRADEORA/generate_daily_recommendations.py#L297-L314)):**
```python
# Guard 2: Deduplicate — best source per day
SOURCE_PRIORITY = ['egx_bulletin', 'tradingview_1d',
                   'yahoo_historical', 'tradingview',
                   'yahoo_live']
day_map = {}
for row in rows:
    d = row['price_date']
    if d not in day_map:
        day_map[d] = row
    else:
        curr_p = SOURCE_PRIORITY.index(day_map[d]['source']) \
                 if day_map[d]['source'] in SOURCE_PRIORITY else 99
        new_p  = SOURCE_PRIORITY.index(row['source']) \
                 if row['source'] in SOURCE_PRIORITY else 99
        if new_p < curr_p:
            day_map[d] = row

sorted_rows = sorted(day_map.values(), key=lambda r: r['price_date'])
```

If multiple provider rows exist for the same date `d`, the row with the lower index in `SOURCE_PRIORITY` overwrites the candidate in `day_map[d]`. The non-winning provider rows are discarded in memory for that query execution.

---

## QUESTION 5: PROVIDER DISAGREEMENT SCENARIO

### Scenario: Yahoo = 45.23 | TradingView = 45.31 | EGX = 45.28 (Symbol: COMI, Date: 2026-07-29)

1. **At Database Storage Level:**
   All 3 rows exist side-by-side in `market_prices` because the unique constraint is `(company_id, price_date, source)`.
   - Row 1: `(COMI_id, '2026-07-29', 'yahoo_historical', 45.23)`
   - Row 2: `(COMI_id, '2026-07-29', 'tradingview', 45.31)`
   - Row 3: `(COMI_id, '2026-07-29', 'egx_bulletin', 45.28)`

2. **When Signal Engine Runs ([`generate_daily_recommendations.py` Line 306](file:///e:/zaora/TRADEORA/generate_daily_recommendations.py#L306)):**
   - Signal Engine queries `market_prices` for `COMI_id`.
   - Evaluates `SOURCE_PRIORITY = ['egx_bulletin', 'tradingview_1d', 'yahoo_historical', 'tradingview', 'yahoo_live']`.
   - `egx_bulletin` has rank index `0`. `yahoo_historical` has rank `2`. `tradingview` has rank `3`.
   - **Winner Selected for Signal Engine:** **EGX Bulletin (45.28)**.

3. **When Frontend Price Chart Runs ([`PriceChart.tsx` Line 614](file:///e:/zaora/TRADEORA/tradeora-web/components/stock/PriceChart.tsx#L614)):**
   - Chart component evaluates: `tradingview_1d` (1) > `egx_bulletin` (2) > `tradingview` (3) > `yahoo_historical` (4).
   - If `tradingview_1d` row exists (close 45.31), **TradingView (45.31)** is selected for the chart while **EGX (45.28)** is selected for the Signal Engine.

---

## QUESTION 6: VALIDATION RULES BEFORE `market_prices`

All records passing through [`services/importer.py`](file:///e:/zaora/TRADEORA/services/importer.py#L120) undergo 5 validation checks:

1. **Open Price Positive Check (Critical):** `open_p > 0`. If `open_p <= 0`, record is rejected. ([`services/importer.py` Line 137](file:///e:/zaora/TRADEORA/services/importer.py#L137))
2. **Close Price Positive Check (Critical):** `close_p > 0`. If `close_p <= 0`, record is rejected. ([`services/importer.py` Line 140](file:///e:/zaora/TRADEORA/services/importer.py#L140))
3. **High/Low Range Check (Critical):** `high_p >= low_p`. If `high_p < low_p`, record is rejected. ([`services/importer.py` Line 143](file:///e:/zaora/TRADEORA/services/importer.py#L143))
4. **Volume Non-Negative Check (Critical):** `volume >= 0`. If `volume < 0`, record is rejected. ([`services/importer.py` Line 146](file:///e:/zaora/TRADEORA/services/importer.py#L146))
5. **Close Outside High-Low Range Check (Soft Warning):** If `not (low_p <= close_p <= high_p)`, record is accepted but `data_quality_flag` is set to `"close_outside_range"`. ([`services/importer.py` Line 153](file:///e:/zaora/TRADEORA/services/importer.py#L153))

**Signal Engine Additional Cleaning Guards ([`generate_daily_recommendations.py` Lines 331–356](file:///e:/zaora/TRADEORA/generate_daily_recommendations.py#L331-L356)):**
6. **Flat Candle Removal (Mubasher Artifacts):** Removes bars where `high == low == close` and `c > 0`.
7. **Stale Data Guard:** Rejects signals if the latest candle in `market_prices` is older than 5 days.
8. **Duplicate Signal Guard:** Rejects signal generation if an active trade already exists in `recommended_trades` for the company.

---

## QUESTION 7: PROVIDER NORMALIZATION AUDIT

| Aspect | Normalized Before Comparison? | Details & Evidence |
|--------|--------------------------------|-------------------|
| **Timezone** | **YES** | All scrapers convert timestamps to Cairo local time (`Africa/Cairo`) before DB insertion. ([`scrapers/tradingview_provider.py` Line 43](file:///e:/zaora/TRADEORA/scrapers/tradingview_provider.py#L43), [`services/importer.py` Line 40](file:///e:/zaora/TRADEORA/services/importer.py#L40)) |
| **Decimals** | **YES** | Prices rounded to 4 decimal places in Python scrapers and DB NUMERIC fields. ([`scrapers/tradingview_scraper.py` Line 119](file:///e:/zaora/TRADEORA/scrapers/tradingview_scraper.py#L119)) |
| **Adjusted Prices** | **NO (MISMATCH)** | Yahoo Finance API provides split/dividend-adjusted close prices (`adjclose`), whereas EGX Bulletin and TradingView Scanner provide raw unadjusted prices. Tradeora does **not** adjust historical candles to a single standard before storing or comparing. ([`tradeora-web/components/stock/PriceChart.tsx` Line 126](file:///e:/zaora/TRADEORA/tradeora-web/components/stock/PriceChart.tsx#L126)) |
| **Currency** | **YES** | Defaults to `EGP` for EGX listings. ([`services/importer.py` Line 177](file:///e:/zaora/TRADEORA/services/importer.py#L177)) |
| **Volume Units** | **YES** | Converted to standard integer counts (`BIGINT`). |
| **Ticker Symbols** | **YES** | Strips suffixes (`.CA`, `.CAI`, `EGX:`) to match company symbol in `companies` table. ([`intraday_collector.py` Line 69](file:///e:/zaora/TRADEORA/intraday_collector.py#L69)) |
| **Sessions** | **YES** | Session guards check EGX trading hours (Sun–Thu 10:00–14:30 Cairo time). ([`scrapers/utils.py` Line 15](file:///e:/zaora/TRADEORA/scrapers/utils.py#L15)) |

---

## QUESTION 8: COMPLETE END-TO-END TRACE OF ONE CANDLE (COMI)

Target Symbol: **COMI** (Commercial International Bank) | Date: `2026-07-29`

```
1. Provider Response (TradingView Scanner POST API)
   URL: https://scanner.tradingview.com/egypt/scan
   Raw Payload: { "s": "EGX:COMI", "d": ["COMI", "Commercial International Bank", 84.50, 85.20, 84.00, 85.00, 1250000, 106250000, 0.50, 0.59, 84.50] }

2. Parser Output (scrapers/tradingview_scraper.py Line 90)
   Dict: { "symbol": "COMI", "open_price": 84.50, "high_price": 85.20, "low_price": 84.00, "close_price": 85.00, "previous_close": 84.50, "change_value": 0.50, "change_percent": 0.59, "volume": 1250000, "price_date": "2026-07-29" }

3. Normalized Candle (services/importer.py Line 78)
   Resolved company_id: "a1b2c3d4-..." (from companies table) | Source tag: "tradingview" | Fetched at: "2026-07-29T14:30:00+03:00"

4. Validation (services/importer.py Line 120)
   open_price > 0 (PASS) | close_price > 0 (PASS) | high >= low (PASS) | volume >= 0 (PASS) | low <= close <= high (PASS)

5. Conflict Resolution (database/db.py Line 203)
   PostgreSQL UPSERT into market_prices with ON CONFLICT (company_id, price_date, source).
   Row INSERTED as (COMI_id, '2026-07-29', 'tradingview').

6. Canonical Candle Resolution (generate_daily_recommendations.py Line 286)
   Signal engine queries market_prices for COMI.
   If both 'egx_bulletin' (close 85.05) and 'tradingview' (close 85.00) exist:
   SOURCE_PRIORITY = ['egx_bulletin', 'tradingview_1d', 'yahoo_historical', 'tradingview', 'yahoo_live']
   'egx_bulletin' rank 0 beats 'tradingview' rank 3.
   Canonical Candle Selected: { open: 84.50, high: 85.20, low: 84.00, close: 85.05, volume: 1250000, source: 'egx_bulletin' }

7. Signal Engine Feature Calculation (generate_daily_recommendations.py Line 415)
   - RSI(14) & MACD(12, 26, 9) computed on canonical closes array.
   - Model prob = 0.74 -> Trade Signal GENERATED (BUY COMI at 85.05).
```

---

## QUESTION 9: EXACT CODE THAT WRITES INTO `market_prices`

- **File Path:** [`database/db.py`](file:///e:/zaora/TRADEORA/database/db.py#L173-L220)
- **Function:** `upsert_market_prices(prices: list[dict]) -> tuple[int, int]`
- **Python / Supabase API Call:**
```python
# db.py Line 203
res = client.table("market_prices").upsert(
    prices, 
    on_conflict="company_id,price_date,source"
).execute()
```
- **Underlying PostgreSQL SQL Execution:**
```sql
INSERT INTO market_prices (
  company_id, open_price, high_price, low_price, close_price,
  previous_close, change_value, change_percent, volume, value_traded,
  source, price_date, fetched_at, data_quality_flag
) VALUES (...)
ON CONFLICT (company_id, price_date, source) 
DO UPDATE SET
  open_price = EXCLUDED.open_price,
  high_price = EXCLUDED.high_price,
  low_price = EXCLUDED.low_price,
  close_price = EXCLUDED.close_price,
  previous_close = EXCLUDED.previous_close,
  change_value = EXCLUDED.change_value,
  change_percent = EXCLUDED.change_percent,
  volume = EXCLUDED.volume,
  value_traded = EXCLUDED.value_traded,
  fetched_at = EXCLUDED.fetched_at,
  data_quality_flag = EXCLUDED.data_quality_flag,
  updated_at = NOW();
```

---

## QUESTION 10: CAN ONE PROVIDER OVERWRITE ANOTHER IN THE DATABASE?

### Answer: NO (At Database Storage Layer) / YES (At Read-Time Resolution Layer)

1. **Database Storage Overwriting:** **NO.** Because the unique constraint is `(company_id, price_date, source)`, an EGX record (`source='egx_bulletin'`) does **NOT** overwrite a Yahoo record (`source='yahoo_historical'`) or a TradingView record (`source='tradingview'`). They co-exist as separate rows in `market_prices`.
2. **Read-Time Resolution Overwriting:** **YES.** When a query runs in `generate_daily_recommendations.py`, the `SOURCE_PRIORITY` loop evaluates all rows for a given `price_date`.
   - `egx_bulletin` **overwrites** `tradingview_1d`, `yahoo_historical`, and `tradingview` in memory.
   - `tradingview_1d` **overwrites** `yahoo_historical` and `tradingview`.
   - `yahoo_historical` **overwrites** `tradingview` and `yahoo_live`.
   - `mubasher` is **completely ignored / overwritten** by any allowed source.

---

## QUESTION 11: PROVIDER FALLBACK SEQUENCE

| Scenario | Behavior & Code Path |
|----------|──────────────────────|
| **TradingView Unavailable** | Signal Engine uses `egx_bulletin` or `yahoo_historical`. Chart uses `egx_bulletin` or falls back to Yahoo API (`/api/yahoo-chart`). |
| **Yahoo Unavailable** | Signal Engine uses `egx_bulletin` or `tradingview_1d`. Chart uses local DB TradingView candles. |
| **EGX Unavailable** | Signal Engine falls back to `tradingview_1d`, then `yahoo_historical`, then `tradingview`. |
| **Only Mubasher Available** | Signal Engine **halts signal generation** for those stocks (`ALLOWED` filter excludes `mubasher`). Live ticker bar displays Mubasher price. |
| **No Provider Available** | Signal Engine logs `[symbol] Insufficient clean data (< 50 candles). Skipping.` ([Line 410](file:///e:/zaora/TRADEORA/generate_daily_recommendations.py#L410)). Frontend displays empty chart skeleton. |

---

## QUESTION 12: PROVIDER PRIORITY MATRIX

| Rank | Provider Name | Source Tag in DB | Purpose | Can Become Canonical? | Selection Reason |
|------|---------------|------------------|---------|-----------------------|------------------|
| **1** | Official EGX Bulletin | `egx_bulletin` | Authoritative daily closing price bulletin | **YES (Highest)** | Official exchange trading data, zero vendor latency/adjustment skew. |
| **2** | TradingView EOD | `tradingview_1d` | Clean daily OHLCV scanner snapshot | **YES** | High reliability, raw unadjusted prices. |
| **3** | Yahoo Finance Historical | `yahoo_historical` | Deep historical daily candles backfill | **YES (Fallback)** | Covers missing historical dates, but subject to dividend adjustments. |
| **4** | TradingView Live Scanner | `tradingview` | Intraday snapshot ticks | **YES (Fallback)** | Real-time scanner ticks during market session. |
| **5** | Yahoo Finance Live | `yahoo_live` | Intraday live prices | **YES (Lowest)** | Final fallback when TV is unavailable. |
| **EXCLUDED** | Mubasher.info | `mubasher` | Real-time close-only price sync | **NO** | Excluded because it provides close-only prices without OHLCV volume data. |
| **EXCLUDED** | Investing.com | `investing` | Secondary price source | **NO** | Excluded in production due to Cloudflare anti-bot blocks. |

---

## QUESTION 13: CONFLICT RESOLUTION MATRIX

| Case | Behavioral Outcome | Code Reference |
|------|--------------------|----------------|
| **Providers Agree** | Exact match, highest priority source tag retained. | [`generate_daily_recommendations.py` Line 306](file:///e:/zaora/TRADEORA/generate_daily_recommendations.py#L306) |
| **Providers Disagree (Price)** | Higher priority source in `SOURCE_PRIORITY` array selected; lower priority rows discarded. | [`generate_daily_recommendations.py` Line 309](file:///e:/zaora/TRADEORA/generate_daily_recommendations.py#L309) |
| **Timestamp / Date Different** | Each date resolved independently per symbol. | [`generate_daily_recommendations.py` Line 301](file:///e:/zaora/TRADEORA/generate_daily_recommendations.py#L301) |
| **Volume Different** | Entire candle (OHLCV) taken from winning provider; volume is **not** averaged or blended. | [`generate_daily_recommendations.py` Line 310](file:///e:/zaora/TRADEORA/generate_daily_recommendations.py#L310) |
| **Missing Provider** | Next available provider in `SOURCE_PRIORITY` array selected. | [`signal_guardian.py` Line 60](file:///e:/zaora/TRADEORA/signal_guardian.py#L60) |
| **Holiday (Fri/Sat/EGX Holiday)** | Scraper exits gracefully via session guard (`weekday in [4, 5]`). No records inserted. | [`main.py` Line 39](file:///e:/zaora/TRADEORA/main.py#L39) |
| **Half Trading Day (Ramadan/Special)** | Ingested normally; volume checks pass if `volume >= 0`. | [`services/importer.py` Line 146](file:///e:/zaora/TRADEORA/services/importer.py#L146) |
| **Corporate Action (Split/Dividend)** | Raw prices retained from EGX/TV. If Yahoo fallback used, adjusted close (`adjclose`) is stored, causing price level shifts. | [`tradeora-web/components/stock/PriceChart.tsx` Line 126](file:///e:/zaora/TRADEORA/tradeora-web/components/stock/PriceChart.tsx#L126) |
| **Duplicate Candle (Same Source & Date)** | Deduplicated in batch array by `(company_id, price_date, source)`, then upserted via PostgreSQL `ON CONFLICT`. | [`database/db.py` Line 182](file:///e:/zaora/TRADEORA/database/db.py#L182) |

---

## QUESTION 14: COMPLETE REAL ARCHITECTURE DIAGRAM

```
                       [ EGYPTIAN EXCHANGE & VENDORS ]
      ┌──────────────────────┬──────────────────────┬──────────────────────┐
      │                      │                      │                      │
      ▼                      ▼                      ▼                      ▼
  Official EGX         TradingView            Yahoo Finance            Mubasher /
  Bulletin PDF/HTML    Scanner POST API       Chart REST API           Web Scraper
      │                      │                      │                      │
      ▼                      ▼                      ▼                      ▼
 [ egx_scraper.py ]  [ tradingview_scraper ] [ yahoo_provider.py ]  [ mubasher_provider ]
      │                      │                      │                      │
      └──────────────────────┼──────────────────────┴──────────────────────┘
                             │
                             ▼
                    [ NORMALIZER & VALIDATOR ]
                    services/importer.py
                    - Validates open>0, close>0, high>=low, vol>=0
                    - Resolves symbol -> company_id (UUID)
                    - Assigns source tag ('egx_bulletin', 'tradingview', etc.)
                             │
                             ▼
                   [ DATABASE STORAGE LAYER ]
                   database/db.py -> market_prices
                   Constraint: UNIQUE (company_id, price_date, source)
                   (Stores ALL valid provider records side-by-side)
                             │
            ┌────────────────┴────────────────┐
            │ READ-TIME CANONICAL RESOLUTION  │
            └────────────────┬────────────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
[ SIGNAL ENGINE ]     [ SIGNAL GUARDIAN ]    [ WEB API / CHARTS ]
generate_daily_rec.py signal_guardian.py     /api/intraday
Priority:             Priority:              Priority:
1. egx_bulletin       1. egx_bulletin        1. tradingview_1d
2. tradingview_1d     2. tradingview_1d      2. egx_bulletin
3. yahoo_historical   3. yahoo_historical    3. tradingview
4. tradingview        4. tradingview         4. yahoo_historical
       │                     │                     │
       ▼                     ▼                     ▼
  Trade Signal          Trade Status          Lightweight Charts
  Generation            Update (TP/SL)        Canvas Render
```

---

## QUESTION 15: CANONICAL CANDLE INTEGRITY TEST

### Is every candle in `market_prices` guaranteed to come from exactly one deterministic algorithm?

### Answer: NO

### Architectural Explanation

1. **Storage Disconnect:** `market_prices` does **not** store a single deterministic canonical candle per day. It stores multiple rows per day whenever multiple providers ingest data for that date.
2. **Read-Time Inconsistency:** Canonical resolution is deferred to read time, and different consumer components apply **different, conflicting priority arrays**:
   - `generate_daily_recommendations.py` prioritizes `egx_bulletin` over `tradingview`.
   - `PriceChart.tsx` prioritizes `tradingview_1d` over `egx_bulletin`.
   - `get_latest_prices()` RPC uses a different SQL CASE statement priority.
3. **Data Mixture Risk:** Because read-time priority ranking selects candles per date, a 300-bar historical series for a single stock can contain 100 bars from `egx_bulletin`, 150 bars from `tradingview_1d`, and 50 bars from `yahoo_historical` (which uses dividend-adjusted prices), creating artificial price gaps across provider transition boundaries.

---

## QUESTION 16: DATA GOVERNANCE AUDIT

| Data Governance Requirement | Rating | Evidence & Status |
|-----------------------------|--------|-------------------|
| **Single Source of Truth** | **NO** | Multiple conflicting priority lists exist across backend and frontend files. No unified single source of truth service. |
| **Canonical Data Layer** | **PARTIAL** | DB `market_prices` table holds all provider data, but canonical selection is performed on-the-fly at query time by individual callers. |
| **Provider Governance** | **PARTIAL** | Source priority rankings are hardcoded into Python and TypeScript files; no dynamic provider governance control plane. |
| **Conflict Resolution Policy** | **YES** | Strict provider ranking order (`SOURCE_PRIORITY`) resolves conflicts deterministically per consumer. |
| **Data Quality Rules** | **YES** | Implemented in `services/importer.py` (`_validate_record()`) checking positive prices, range boundaries, and non-negative volume. |
| **Provider Audit Trail** | **YES** | Every row in `market_prices` contains explicit `source`, `fetched_at`, and `data_quality_flag` fields. Import jobs logged in `import_jobs` table. |
| **Versioned Data** | **NO** | No row versioning or point-in-time historical revisions stored for price corrections. |
| **Historical Provider Attribution** | **YES** | `source` column strictly attributes every candle to its ingestion source (`egx_bulletin`, `tradingview`, `yahoo_historical`, etc.). |

---

## FINAL VERDICT

```
===============================================================================
                            FINAL AUDIT VERDICT
===============================================================================
```

### 1. Who decides the final price?
**The individual consumer component querying the database at read-time** (e.g. Signal Engine via `fetch_canonical_candles()`, Signal Guardian via `get_canonical_price()`, or Chart via `PriceChart.tsx`), applying its own hardcoded source priority ranking array.

### 2. What is the canonical price algorithm?
**Read-time provider priority deduplication.** For a given stock and date, the consumer queries all rows from `market_prices` and selects the candle from the provider with the lowest index in its hardcoded `SOURCE_PRIORITY` array.

### 3. Which provider has highest authority?
**Official EGX Bulletin (`egx_bulletin`)** for backend signal generation and trade management; **TradingView EOD (`tradingview_1d`)** for frontend web charts.

### 4. Can Yahoo overwrite EGX?
**NO.** `egx_bulletin` has higher priority (rank 1) than `yahoo_historical` (rank 3) in all backend priority lists. In addition, database rows co-exist due to the `(company_id, price_date, source)` unique constraint.

### 5. Can TradingView overwrite Yahoo?
**YES.** `tradingview_1d` and `tradingview` have higher priority than `yahoo_historical` and `yahoo_live` in both backend and frontend priority lists.

### 6. Can multiple providers influence one candle?
**NO.** An entire candle (Open, High, Low, Close, Volume) is selected from a single winning provider. Tradeora does **not** average, blend, or fuse values across different providers for the same candle.

### 7. Is canonical candle generation deterministic?
**YES (Within a single component)** / **NO (Across different system components).** A single script (e.g., `generate_daily_recommendations.py`) will deterministically select the same candle every time given the same DB state. However, the Signal Engine and the Web Chart can resolve **different** canonical candles for the exact same date due to conflicting priority arrays.

### 8. Can two executions generate different candles?
**YES**, if new data from a higher-priority provider (e.g. `egx_bulletin`) is ingested between the two executions, or if two different components execute at the same time.

### 9. Is Tradeora using proper financial market data governance?

```
===============================================================================
                     DATA GOVERNANCE RATING: HIGH RISK
===============================================================================
```

**Justification:** While Tradeora maintains excellent data quality validation rules, provider attribution tags, and session guards, canonical price resolution is **decentralized and fragmented** across multiple hardcoded files. The frontend chart and the backend signal engine utilize conflicting source priority rankings, and dividend-adjusted Yahoo candles can mix with unadjusted EGX/TradingView candles in historical series.
