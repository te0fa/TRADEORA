# TRADEORA EGX — PRODUCTION BEHAVIOR BASELINE (00.1E)

> **Baseline Timestamp:** 2026-08-10T23:34:12+03:00
> **Inspection Scope:** Production APIs, Historical Trades, Model Artifacts & Displayed Metrics
> **Fixed Sample Set:** 8 EGX Core Equities (`COMI`, `TMGH`, `EKHO`, `FWRY`, `SWDY`, `HRHO`, `ABUK`, `ISPH`)

## 1. Fixed Stock Reference Sample Baseline

| Symbol | Company Name | Sector | Shariah Compliant | Latest Canonical Date | Latest Close | Source | Intraday Date | Orderbook DB Data |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`COMI`** | Commercial International Bank (Egypt) | Banks | ❌ No | `2026-07-30` | **141.00 EGP** | `tradingview_1d` | `2026-07-30T14:15` | ❌ EMPTY (Mock Fallback) |
| **`TMGH`** | Talaat Moustafa Group Holding | Real Estate | ✅ Yes | `2026-07-30` | **97.30 EGP** | `tradingview_1d` | `2026-07-30T14:15` | ❌ EMPTY (Mock Fallback) |
| **`EKHO`** | Egypt Kuwait Holding | Financial Services | ❌ No | `N/A` | **N/A** | `N/A` | `NO_INTRADAY` | ❌ EMPTY (Mock Fallback) |
| **`FWRY`** | Fawry for Banking & Payment | Technology | ❌ No | `2026-07-30` | **18.77 EGP** | `tradingview_1d` | `2026-07-30T14:15` | ❌ EMPTY (Mock Fallback) |
| **`SWDY`** | Elsewedy Electric | Industrials | ✅ Yes | `2026-07-30` | **93.00 EGP** | `tradingview_1d` | `2026-07-22T13:45` | ❌ EMPTY (Mock Fallback) |
| **`HRHO`** | EFG Holding | Financial Services | ❌ No | `2026-07-30` | **26.20 EGP** | `tradingview_1d` | `2026-07-30T11:15` | ❌ EMPTY (Mock Fallback) |
| **`ABUK`** | Abu Qir Fertilizers | Basic Resources | ✅ Yes | `2026-07-30` | **73.00 EGP** | `tradingview_1d` | `2026-07-26T14:00` | ❌ EMPTY (Mock Fallback) |
| **`ISPH`** | Ibnsina Pharma | Healthcare | ✅ Yes | `2026-07-30` | **11.37 EGP** | `tradingview_1d` | `2026-05-13T13:15` | ❌ EMPTY (Mock Fallback) |

---
## 2. API Endpoint Actual Runtime Behavior Breakdown

### 2.1 Canonical Price API (`/api/canonical-price`)
- **Resolution Logic:** Queries `market_prices` (for 1d) or `intraday_snapshots` (for intraday) with source hierarchy fallback.
- **Current Source Priority:** `tradingview_1d` > `egx_bulletin` > `yahoo_historical` > `tradingview` > `yahoo_live`.
- **Sample Payloads (Live DB Resolution):**

| Symbol | Date | Open | High | Low | Close | Volume | Change % | Resolved Source |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `COMI` | `2026-07-30` | 140.30 | 141.00 | 138.40 | **141.00** | 2,002,578 | +0.50% | `tradingview_1d` |
| `TMGH` | `2026-07-30` | 97.59 | 97.89 | 95.20 | **97.30** | 3,985,718 | -0.30% | `tradingview_1d` |
| `EKHO` | N/A | N/A | N/A | N/A | N/A | N/A | N/A | NONE |
| `FWRY` | `2026-07-30` | 19.00 | 19.10 | 18.71 | **18.77** | 3,657,747 | -1.21% | `tradingview_1d` |
| `SWDY` | `2026-07-30` | 94.95 | 94.95 | 91.80 | **93.00** | 270,010 | -2.05% | `tradingview_1d` |
| `HRHO` | `2026-07-30` | 26.45 | 26.50 | 25.95 | **26.20** | 2,523,436 | -0.95% | `tradingview_1d` |
| `ABUK` | `2026-07-30` | 71.32 | 73.29 | 70.90 | **73.00** | 2,221,116 | +2.36% | `tradingview_1d` |
| `ISPH` | `2026-07-30` | 11.50 | 11.50 | 11.30 | **11.37** | 3,182,475 | -1.13% | `tradingview_1d` |

### 2.2 Order Book API (`/api/orderbook`)
- **Actual Production Behavior:**
  - When `orderbook_snapshots` has no rows for a stock (current state in database: **0 rows**), the API route (`tradeora-web/app/api/orderbook/route.ts:59-99`) **fabricates synthetic Level 2 order book bids and asks** around the current market price.
  - **Baseline Finding:** 🔴 `CRITICAL FABRICATED FALLBACK`: Hardcoded mock order distribution (`145,000` volume, `14` orders count) is returned to users when DB snapshot is absent.

### 2.3 Screener API (`/api/screener`)
- **Actual Production Behavior:**
  - Fetches 344 companies, looks up prices in the last 7 days from `market_prices`, and links with active `recommended_trades`.
  - If prices are older than 7 days, stock is returned with 0 / null price.

### 2.4 Recommended Trades API (`/api/trades` & `/api/recommended-trades`)
- **Actual Production Behavior:**
  - Hardcoded filter: `LAUNCH_DATE = '2026-08-03T00:00:00+00:00'` excludes all historical pre-launch signals.
  - Returns active signals with AI Confidence (`ml_probability`), TP1, TP2, Stop Loss (`sl`), and dynamic win rate.

---
## 3. Historical Trades & Performance Metrics Baseline

> **Note on Pre-Fix Baseline:** These metrics represent what is currently stored and displayed on the platform, recorded strictly as the reference point before remediation.

### 3.1 Trades Breakdown by Status in Database

| Status | Count | Avg PnL % | Winning Trades | Losing Trades |
| :--- | :---: | :---: | :---: | :---: |
| `closed` | **1,305** | -0.07% | 345 | 864 |
| `active` | **240** | +0.00% | 0 | 0 |

### 3.2 Displayed Overall Platform Metrics
- **Total Recommended Trades (All Time in DB):** `1,545` trades
- **Closed Trades:** `1209` (Winners: `345`, Losers: `864`)
- **Raw Database Closed Win Rate:** `28.5%`
- **Average Closed PnL:** `-0.07%`

---
## 4. Production ML Model & Feature Baseline

- **Active Model Version:** `v6`
- **Trained Timestamp:** `2026-08-02T00:08:54.427289+00:00`
- **Total Training Samples:** `65,772`
- **Features Count:** `33` features
- **Declared Test Accuracy:** `61.98%`
- **Declared Test Precision:** `80.92%`
- **Declared Test AUC:** `0.7236`

### 4.1 Feature Names Vector (33 Features)
```json
[
  "rsi",
  "macd_hist",
  "macd_line",
  "dist_ema20",
  "dist_ema50",
  "atr_pct",
  "vol_ratio",
  "price_pos",
  "bb_width",
  "bb_pos",
  "stoch_rsi",
  "vol_spike",
  "dist_ath",
  "day_of_week",
  "market_regime",
  "wyckoff_score",
  "smart_money_norm",
  "ict_fvg",
  "ict_ob",
  "elliott_momentum",
  "fundamental_norm",
  "trend_strength",
  "volatility_regime",
  "volume_trend",
  "candle_body_ratio",
  "foreigners_net_norm",
  "foreign_inst_net_norm",
  "egyptian_inst_net_norm",
  "flow_trend_3d",
  "vpoc_dist_pct",
  "value_area_pos",
  "ofi_ratio_norm",
  "seasonality_winrate"
]
```

---
## 5. Summary of Baseline Behavioral Deficiencies to Track

1. **Order Book Synthetic Fallback:** `orderbook/route.ts` fabricates mock Level 2 book entries when DB table is empty.
2. **Hardcoded Launch Reset Date:** `trades/route.ts` hardcodes `'2026-08-03'` to filter trades rather than relying on configuration or audit trails.
3. **Intraday Snapshot Gaps:** Several sample stocks have stale intraday data or lack real-time continuous ingestion.
4. **Price Discrepancy Between Providers:** Mismatch between CockroachDB row counts and Supabase row counts in `market_prices` (307k vs 312k).
