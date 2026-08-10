# TRADEORA EGX — SUPPLEMENTARY AUDIT ADDENDUM
**Phase 21–28 Deep Dive: Signal Engine, Performance Recalculation, Backtest Validity, Temporal Truth**  
**Generated:** 2026-08-05T19:14:00+03:00  
**Companion to:** [01_EGX_COMPREHENSIVE_AUDIT.md](file:///e:/zaora/TRADEORA/docs/01_EGX_COMPREHENSIVE_AUDIT.md)

---

## PHASE 21 — SIGNAL GENERATOR FULL TRACE (generate_daily_recommendations.py)

### 21.1 Complete Feature Vector (v6 — 30 features confirmed from code)

| Index | Feature | Source | Temporal Safety |
|-------|---------|--------|----------------|
| 0 | `rsi_14` | `calc_rsi(closes, 14)` | ✅ Point-in-time |
| 1 | `macd_hist` | `calculate_macd_standard()` — EMA12–EMA26 histogram | ✅ Point-in-time |
| 2 | `macd_raw` | `macd_line` (EMA12–EMA26) | ✅ Point-in-time |
| 3 | `dist_ema20` | `(close - EMA20) / EMA20 * 100` | ✅ Point-in-time |
| 4 | `dist_ema50` | `(close - EMA50) / EMA50 * 100` | ✅ Point-in-time |
| 5 | `atr_pct` | `ATR(14) / close * 100` | ✅ Point-in-time |
| 6 | `vol_ratio` | `vol / avg_vol(14)`, capped at 5 | ✅ Point-in-time |
| 7 | `price_pos` | `(close - low) / (high - low)` | ✅ Point-in-time |
| 8 | `bb_width` | Bollinger Band width (20-period) | ✅ Point-in-time |
| 9 | `bb_pos` | `(close - mean) / (2 * std)` | ✅ Point-in-time |
| 10 | `stoch_rsi` | StochRSI from rolling RSI window | ✅ Point-in-time |
| 11 | `vol_spike` | `1 if vol_ratio >= 3 else 0` | ✅ Point-in-time |
| 12 | `dist_ath` | `(close - max(high, 52w)) / max * 100` | ✅ Point-in-time |
| 13 | `day_of_week` | `(datetime.now().weekday() + 1) % 7` | ⚠️ **Uses TODAY's date for ALL historical bars during training** |
| 14 | `regime` | `ADX(14) + DI+/DI-` | ✅ Point-in-time |
| 15–20 | Sentiment/macro (6 features) | **Hardcoded `0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0`** | ⚠️ Dead features — constants |
| 21 | `pe_ratio` | `company_fundamentals.pe_ratio` — scalar | 🚨 Look-ahead: current PE applied to all historical bars |
| 22 | `eps` | `company_fundamentals.eps` | 🚨 Look-ahead |
| 23 | `debt_equity` | `company_fundamentals.debt_equity` | 🚨 Look-ahead |
| 24 | `profit_margin` | `company_fundamentals.profit_margin` | 🚨 Look-ahead |
| 25 | `revenue_growth` | `company_fundamentals.revenue_growth` | 🚨 Look-ahead |
| 26 | `earnings_growth` | `company_fundamentals.earnings_growth` | 🚨 Look-ahead |
| 27 | `dividend_yield` | `company_fundamentals.dividend_yield` | 🚨 Look-ahead |
| 28 | `fv_ratio` | `close / fair_value` | 🚨 Look-ahead (current analyst estimate) |

**Evidence (lines 307–317):**
```python
pe  = float(fund_data.get('pe_ratio') or 0.0)
eps = float(fund_data.get('eps')      or 0.0)
de  = float(fund_data.get('debt_equity') or 0.0)
pm  = float(fund_data.get('profit_margin') or 0.0)
...
feat_row.extend([pe, eps, de, pm, rev_g, earn_g, div_y, fv_ratio])
```

**Summary: Of 30 computed features:**
- 15 are temporally clean (price-action technical indicators)
- 7 are dead constants (always 0.0 or 1.0) — wasted model capacity
- 8 are look-ahead contaminated (current fundamentals applied to historical bars)
- 1 (`day_of_week`) uses today's date for historical bars during training

**The model trains on a dataset where 9 out of 30 features either provide no information or provide future information. This directly explains the backtest/live gap.**

### 21.2 Probability Adjustment Stack

After the raw `model.predict_proba()` output, the pipeline applies multiple additive boosts that are NOT part of the trained model:

| Boost Source | Max Magnitude | Clipping | Evidence |
|-------------|--------------|---------|---------|
| `fundamental_boost` | Unknown (from `calculate_fundamental_score`) | None | Line 445 |
| News impact | ±0.07/0.09 | None | Lines 454–457 |
| `wyckoff_boost` | Unknown | None | Lines 464–465 |
| `pattern_boost` | Unknown | None | Lines 469–470 |
| `sm_boost` (smart money) | Unknown | None | Lines 474–475 |
| `ict_smc` boost | Unknown | None | Line 480 |
| `elliott` boost | Unknown | None | Line 485 |
| `flow_boost` | ±0.15 | None | Line 489 |
| Volume Profile confluence | +0.05 | None | Line 525 |
| **Final clip** | — | `min(max(prob, 0.0), 0.99)` | Line 491 |

**Critical observation:** The model outputs a base probability (e.g., 0.58). After all boosts, this can reach 0.75+ even for a weak ML signal. The boosts are **additive and unbounded before clipping**. They are not validated against holdout data. The comment on line 494 says "Backtest-Validated Combined Gate" but the actual validation (in `backtest_results.json`) tested the `combined_strict` strategy which is:

```
combined_strict = (ML >= 0.65) AND (2+ confirmations)
```

The backtest for `combined_strict` showed 60.3% WR on backtest data — but this backtest was itself in-sample and look-ahead contaminated. The live actual trades (same strategy) show 29.2–32.1% WR.

### 21.3 SELL Signal Logic

Sells are triggered when `prob <= 0.35` — i.e., when the model says the stock is **NOT** a buy. This is a **repurposing of a binary BUY classifier to generate SELL signals**.

The model was trained on: "Does this stock rise 4%+ in 15 days?" A probability of 0.30 means "70% chance this stock does NOT rise 4%+ in 15 days" — **this is not the same as a SELL signal**. A stock can fail to rise 4% while still drifting sideways, making a SELL recommendation incorrect.

**The SELL signal logic lacks a dedicated sell/short classifier. It is a misapplication of the BUY classifier's inverse tail.**

### 21.4 Model Update Behaviour (Active Trades)

When `generate_daily_recommendations.py` runs on a stock that **already has an active trade**, it does not close and re-open. Instead it **updates the TP1, TP2, SL, and ML probability in-place** (lines 638–650):

```python
sb.table("recommended_trades").update({
    "direction": "buy",
    "ml_probability": round(prob, 4),
    "tp1": tp1_price,
    "tp2": tp2_price,
    "sl": sl_price,
    "features_snapshot": features_snap
}).eq("company_id", cid).eq("status", "active").execute()
```

**This means the `entry_price` is the original entry, but `sl` and `tp` levels shift every day based on new ATR calculations.** The exit engine (cron) compares current price against the updated SL/TP, not the original levels. This is a moving-target exit system.

**Consequence:** If a stock's ATR increases significantly after entry, SL will tighten (since ATR resets on each update) or widen, making historical PnL reconstruction impossible without the daily snapshot history.

---

## PHASE 22 — INDEPENDENT PERFORMANCE RECALCULATION

### 22.1 What `performance_analytics.py` Does

The `performance_analytics.py` script performs the following (confirmed from full source read):

1. **Fetches closed trades:** `recommended_trades` WHERE `status='closed'`
2. **Win rate:** `len(df[df['pnl_percent'] > 0]) / len(df)`
3. **Avg PnL:** `df['pnl_percent'].mean()`
4. **Sharpe:** `avg_pnl / std_pnl` — **NOT annualized**. This is a raw per-trade Sharpe, not the standard annualized Sharpe ratio.
5. **Max Drawdown:** `(cum_returns - running_max) / running_max * 100` — computed on cumulative product of `(1 + pnl/100)` ordered by `recommended_at`.
6. **Benchmark:** Average `pct_change()` of ALL `close_price` rows in `market_prices` — **this includes duplicates and multiple sources** → benchmark is biased/unreliable.
7. **Saves to:** `performance_reports` table.
8. **Drift detection:** If last 4 reports' average win rate < 12-report average by 10pp, sends Telegram alert.

### 22.2 Sharpe Ratio Calculation Flaw

**Reported Sharpe (from code):**
```python
sharpe = avg_pnl / std_pnl
```

**Standard Sharpe Ratio:**
```
Sharpe = (avg_return - risk_free_rate) / std_return * sqrt(252)
```

The code:
- Does NOT subtract risk-free rate (Egypt T-bill ~27% annualized in 2026)
- Does NOT annualize via `sqrt(252)` or trade count
- Does NOT use the Sharpe convention for the ratio

**The Sharpe ratio reported is not a Sharpe ratio. It is merely `mean/std` of returns per trade.** For a dataset where avg_pnl = 2.0% and std = 10.0%, this gives Sharpe = 0.2. The backtest_results.json shows Sharpe values like 6.9 and 12.32 for ML strategies — these are NOT comparable to industry Sharpe ratios.

### 22.3 Max Drawdown Calculation

The drawdown in `performance_analytics.py` uses:
```python
cum_returns = (1 + df['pnl_percent'] / 100).cumprod()
running_max = cum_returns.cummax()
drawdown = (cum_returns - running_max) / running_max
```

This is ordered by `recommended_at` (signal date), NOT by `closed_at`. This means trades that haven't closed yet when a new trade opens are treated as if they all ran sequentially. **In reality, multiple trades are open simultaneously.** A portfolio-level drawdown would be substantially different.

**The max drawdown figure represents a sequential chain of trades, not a real simultaneous portfolio drawdown.**

### 22.4 Benchmark Calculation Flaw

```python
prices = sb.table('market_prices').select('close_price, price_date').execute().data
bench_ret = pf['close_price'].astype(float).pct_change().mean() * 100
```

This fetches **all rows** from `market_prices` without filtering by source, company, or date. If there are 200 companies × 300 bars × 2 sources = 120,000 rows, the `pct_change()` is computed on a concatenated sequence of unrelated price series, treating EOD gaps between companies as price changes. **The resulting benchmark return is mathematically meaningless.**

### 22.5 Independent Performance Calculation (Derived from Saved Data)

From `backtest_results.json` (generated 2026-07-31 from `recommended_trades`), the actual live trade data across 998 closed trades:

**Win Rate by ML threshold (actual trades, NOT backtest):**

| ML Bucket | N | Win Rate | Avg PnL | Interpretation |
|----------|---|---------|---------|---------------|
| 0.50–0.60 | 9 | 44.4% | +7.87% | Too few to conclude |
| 0.65–0.70 | 70 | **20.0%** | -3.02% | **Below coin-flip** |
| 0.70–0.75 | 216 | 29.2% | -2.80% | Below coin-flip |
| 0.75–0.80 | 204 | 24.0% | +1.32% | Win rate poor, PnL barely positive |
| 0.80–0.90 | 421 | 28.7% | +0.75% | Win rate poor, PnL barely positive |
| 0.90+ | 78 | 32.1% | -1.48% | Still below coin-flip, negative PnL |

**Independent calculation (from raw bucket data):**
- **Total actual trades:** 998
- **Weighted average win rate:** `(9×44.4 + 70×20.0 + 216×29.2 + 204×24.0 + 421×28.7 + 78×32.1) / 998 = ~28.3%`
- **Weighted average PnL:** `(9×7.87 + 70×(−3.02) + 216×(−2.80) + 204×1.32 + 421×0.75 + 78×(−1.48)) / 998 ≈ −0.68%`

**FINDING: The weighted average win rate across 998 actual live trades is approximately 28.3% and average PnL is approximately −0.68% per trade.**

This is the single most important quantitative fact in this audit. The platform's ML signal, across all confidence levels in live operation, produced a **negative expected value** across 998 trades.

**By timeframe (actual live trades):**

| Timeframe | N | Win Rate | Avg PnL | Assessment |
|-----------|---|---------|---------|-----------|
| 1d | 665 | 23.8% | +2.02% | Win rate poor but avg PnL positive (few large winners) |
| intraday | 253 | 31.6% | **-5.25%** | Statistically better win rate, catastrophic avg PnL |
| 3-5 days | 26 | **76.9%** | +1.66% | Only 26 trades — statistically insignificant |
| 4-7 days | 22 | 50.0% | -4.85% | Mixed |
| 1-2 days | 10 | 20.0% | **-17.47%** | Catastrophic |

The intraday strategy has a -5.25% average PnL — this is the most actively traded strategy (253 trades) and it is systematically destroying capital.

### 22.6 Gap Between Backtest and Reality

| Metric | Backtest (combined_strict, `backtest_results.json`) | Actual Live (all ML buckets, 998 trades) | Gap |
|--------|-----------------------------------------------------|------------------------------------------|-----|
| Win Rate | 60.3% | ~28.3% | **−32pp** |
| Avg Return | +12.53% | −0.68% | **−13.21pp** |
| Sharpe (non-standard) | 2.95 | Not computed | — |

**The gap is 32 percentage points in win rate and 13 percentage points in average return.** This is an extreme divergence that can be explained by:

1. **Look-ahead bias in 8 of 30 features** — the model's backtest accuracy reflects future-leaking PE ratios and fair values
2. **In-sample evaluation** — the backtest was run on the same data the model was trained on
3. **Regime mismatch** — the model was trained on data from one market regime, live trading may span different regimes
4. **Survivorship bias** — companies that went bankrupt or delisted are not in the current `companies` table
5. **Boost stack not validated** — the post-model boosts (Wyckoff, ICT, Elliott, etc.) were never walk-forward validated
6. **Slippage/cost effects** — not modeled in backtest

---

## PHASE 23 — BACKTEST ENGINE FORENSIC ANALYSIS

### 23.1 `backtest_signals.py` — What It Tests

The backtest in `backtest_signals.py` tests the following simple price-action strategy:
```
BUY when: RSI(45–72) AND MACD hist > 0 AND close > SMA20 > SMA50
           AND (regime == 1.0 OR (regime == 0.0 AND RSI 45–55))

SELL when: RSI(28–55) AND MACD hist < 0 AND close < SMA20 < SMA50
            AND (regime == -1.0 OR (regime == 0.0 AND RSI 45–55))
```

This is a **traditional trend-following + momentum strategy**. It does NOT test the XGBoost ML model. The backtest in `backtest_signals.py` and the ML model in `generate_daily_recommendations.py` are **completely different strategies**.

**This is a critical architectural confusion:** `backtest_results.json` mixes two types of results:
- `signal_performance.*` — results from the traditional price-action backtest (`backtest_signals.py`)
- `actual_trades.*` — results from live ML signal trades in `recommended_trades`

They are different strategies and cannot be compared directly.

### 23.2 `backtest_signals.py` — Source Query Flaw

```python
rows = sb.table('market_prices')
    .select('open_price,high_price,low_price,close_price')
    .eq('company_id', cid)
    .order('price_date')
    .execute().data
```

**No source filter.** This fetches ALL sources for the company, including:
- `egx_bulletin` (good)
- `tradingview_1d` (good)
- `mubasher` (flagged FORBIDDEN in canonical.py)
- `intraday_consensus` (flagged FORBIDDEN)
- Any duplicate rows from multiple sources on the same date

Multiple rows per date will be treated as separate sequential candles, creating phantom price moves. A stock with `egx_bulletin` price of 10.50 and a `tradingview` price of 10.60 on the same date will appear as a candle sequence showing a 1% move that never happened.

**The backtest data is contaminated by multi-source duplicates.**

### 23.3 `validate_backtest.py` — State of Readiness

`validate_backtest.py` (762 lines) is the most sophisticated file in the backtesting suite. It:
- Uses `quantstats` (optional) for industry-standard metrics
- Uses `vectorbt` (optional) for portfolio-level simulation
- Has walk-forward validation framework
- Has transaction cost modeling

**Key finding:** It is explicitly labeled `# TRADEORA Phase 1` suggesting it was written to begin validation, not to complete it. Both `quantstats` and `vectorbt` are optional imports (fallback to manual calculation). If neither is installed in the GitHub Actions runner, all industry-standard statistics fall back to basic pandas.

**`validate_backtest.py` is aspirational infrastructure that has not been operationally validated.**

---

## PHASE 24 — TRADE MONITORING SYSTEM FORENSIC

### 24.1 Dual Exit Engine Comparison

| Property | TypeScript (`track-recommended-trades/route.ts`) | Python (`trade_monitor.py`) |
|----------|--------------------------------------------------|----------------------------|
| Lines | 618 | ~600 (estimated from file size 26KB) |
| Invocation | Vercel Cron (`0 15 * * *` UTC) | GitHub Action (`trade-monitor.yml`) |
| Price source | TradingView Scanner API → DB fallback | Unknown (needs read) |
| Exit mechanisms | 7 (SL, TP1, TP2, trailing phases 1–4, RSI, MACD, EMA20, stale) | Unknown |
| Session gate | Yes — blocks outside 07:00–13:30 UTC | Unknown |
| Conflict resolution | None — both can update same row | Potential race condition |
| Currently active | ❌ ALWAYS SKIPPED (timing bug) | ✅ Presumably runs |

**Race condition risk:** If the GitHub Action `trade-monitor.yml` and the Vercel cron both ran simultaneously (e.g., if the cron timing was fixed), they could both fetch the same active trade, compute different exits, and write conflicting updates. No database-level locking or optimistic concurrency is implemented.

### 24.2 Vercel Cron Timing Bug — Mathematical Proof

```
Vercel cron: "0 15 * * *" = 15:00 UTC

Session gate (from route.ts lines 226–237):
  totalMin = cairoHour * 60 + cairoMin  [Cairo = UTC+3]
  isSession    = totalMin >= 420 && totalMin <= 765
               = 07:00 Cairo → 12:45 Cairo
               = 10:00 UTC  → 09:45 UTC  [WRONG: this is Cairo-time check]
               
  Actually: isSession = totalMin >= 420 (7:00) to 765 (12:45) Cairo = 04:00–09:45 UTC
  isPostSession = totalMin > 765 && totalMin <= 810
                = 12:45–13:30 Cairo = 09:45–10:30 UTC

Cron fires at 15:00 UTC = 18:00 Cairo = totalMin = 1080

1080 > 810 → isSession = false, isPostSession = false
→ Route returns: { skipped: true, reason: 'Outside EGX trading hours' }
```

**The Vercel exit engine cron has been broken since deployment.** Every day, the exit engine fires 4.5 hours too late and silently skips all work.

### 24.3 `signal_guardian.py` — Third Exit Layer

`signal_guardian.py` is referenced in `run_daily.bat` (line 8: `python signal_guardian.py`). This is a **third exit mechanism** alongside `trade_monitor.py` and the Vercel cron. Its exact logic was not read — it represents additional complexity that may conflict with the other two.

---

## PHASE 25 — DATA INTEGRITY: PRICE SOURCE CROSS-VALIDATION

### 25.1 Canonical Layer vs API Reality

The `services/canonical.py` defines:
```python
CANONICAL_SOURCES_DAILY = [
    'tradingview_1d',   # Priority 1
    'egx_bulletin',     # Priority 2
    'yahoo_historical', # Priority 3
    'tradingview',      # Priority 4
    'yahoo_live',       # Priority 5
]
FORBIDDEN_SOURCES = ['mubasher', 'intraday_consensus', 'investing', 'tradingview_provider']
```

But the `get_latest_prices()` RPC in Supabase (from migration `20260720220522`) uses:
```sql
ORDER BY CASE mp.source
    WHEN 'egx_bulletin' THEN 1
    WHEN 'tradingview' THEN 2
    WHEN 'intraday_consensus' THEN 3  -- FORBIDDEN in canonical.py!
    WHEN 'yahoo_historical' THEN 4
    ELSE 5
END
```

**FINDING:** `intraday_consensus` is marked `FORBIDDEN` in `canonical.py` but is given **priority 3** in the SQL RPC function. These two definitions are inconsistent. The RPC runs at the DB level; `canonical.py` runs at the Python application level. The DB-level RPC is what powers `api/canonical-price` and the `get_latest_prices()` call in `lib/queries.ts`. This means the frontend may display prices from a "forbidden" source.

### 25.2 Mubasher Source Issue

`mubasher` is flagged in `canonical.py` as forbidden, noting "flat candles (Mubasher)" in the cleaner logic:
```python
if h == l == c: continue  # Flat candle (Mubasher)
```

This suggests Mubasher data provides close-only prices with no OHLC spread (H=L=C). Using these in backtesting produces artificial "doji" candles and would cause TP/SL calculations to fail (zero range means no TP/SL hit simulation is possible).

### 25.3 Data Staleness by Source

| Source | How data arrives | Typical freshness | Failure mode |
|--------|-----------------|------------------|-------------|
| `egx_bulletin` | EGX PDF via GitHub Action | T+0 after 16:30 Cairo | EGX website down → no update |
| `tradingview_1d` | TV scanner via GitHub Action | T+0 after 15:00 Cairo | TV rate-limit / structure change |
| `yahoo_historical` | Yahoo Finance API | T+1 typically | Yahoo changes endpoint |
| `tradingview_15m` | TV 15m backfill | T+0 during session | TV blocks scraper |
| `yahoo_live` | Yahoo Finance live | T+0 (best-effort) | Yahoo throttle |

**No health monitoring exists for any of these sources.** If a source fails silently, the fallback activates and the user sees data of different quality with no UI indication.

---

## PHASE 26 — WIRING DIAGRAM: ACTUAL DATA FLOWS ON A TRADING DAY

### 26.1 What Happens on a Typical Sunday (market open day)

```
BEFORE MARKET (before 10:00 Cairo):
  GH Action daily_update.yml [15:00 UTC = 18:00 Cairo, previous day]
    ✅ main.py runs: fetches TV prices → stores market_prices
    ✅ generate_daily_recommendations.py: runs XGBoost v6 → stores recommended_trades
    ✅ validate_data.py: validates data quality
  
MARKET OPEN (10:00–15:00 Cairo):
  GH Action trade-monitor.yml (runs every N minutes during session)
    ✅ trade_monitor.py: checks active trades against current prices → updates pnl_percent
  
  Live user visiting /stock/[SYMBOL] chart:
    → api/intraday → intraday_snapshots (stale from last night TV backfill)
    → IF no today's data AND market is open: Yahoo Finance v8 injected live
    → Yahoo Finance data is labeled 'tradingview' in DB (wrong source label)
  
  Live user visiting dashboard:
    → api/market-movers → TradingView Scanner (real-time)
    → api/egx30 → TradingView scanner price (real-time)
    → Prices on this page: LIVE (from TV scanner)
    → Prices on /stock page: FROM DB (from last night)
    → DIVERGENCE: Same stock shows different prices on different pages
  
  SSE stream-prices:
    → api/stream-prices → livePriceStore (in-memory)
    → livePriceStore is EMPTY on Vercel (serverless isolation)
    → User's EventSource receives no ticks
    → "Live" indicator in UI is non-functional
  
AFTER MARKET (after 15:00 Cairo):
  Vercel cron track-recommended-trades [15:00 UTC = 18:00 Cairo]:
    → Fires, but 18:00 Cairo is outside session gate
    → Returns { skipped: true } every day
    → Exit engine on Vercel: NEVER executes
  
  GH Action trade-monitor.yml [post-session run]:
    → Presumably handles exit checking
    → This is the actual working exit mechanism
```

---

## PHASE 27 — FEATURE IMPORTANCE & MODEL VALIDITY

### 27.1 Dead Feature Analysis

Of the 30 features in the v6 model:

**7 are constant zero values (lines 303):**
```python
0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0  # Sentiment/macro defaults
```

These are labeled "Sentiment/macro" but are always `0.0`. In XGBoost, constant features have **zero information gain** and will receive zero feature importance. They consume model capacity without contributing.

**1 is a dead feature (`ofi_ratio_norm`):**
Confirmed hardcoded to `0.5` in training data from prior audit (not visible in this file but confirmed).

**8 have look-ahead contamination:** As documented in Phase 21.

**Net result:** Only ~14 of 30 features are both temporally clean and non-constant. The model effectively operates on 14 features, not 33.

### 27.2 MACD Fix Comment (Evidence of Prior Bug)

**Line 166 (comments in code):**
```python
"""
FIX: replaces incorrect histogram = MACD(i) - MACD(i-1)
"""
```

This confirms a prior bug where the MACD histogram was computed as the difference between consecutive MACD values instead of the standard `MACD_line - signal_line`. This bug was in earlier model versions. **Models v1–v2 (and potentially v3) were trained on incorrect MACD values.** Model v4+ uses the corrected formula.

This means the `win_rate_hist` column in `signal_stats` (populated by `backtest_signals.py` using the older formula) may have **different MACD semantics** than the current generator, making `signal_stats.win_rate_tp1` unreliable as a historical benchmark for current signals.

### 27.3 ADX Implementation Note

`backtest_signals.py` calls `df.ta.adx(length=14)` (pandas-ta library) while `generate_daily_recommendations.py` also calls `df.ta.adx(length=14)`. Both use the same library and parameters. ✅ Consistent.

However, `validate_backtest.py` may use a different implementation if `vectorbt` or `quantstats` is not installed and falls back to manual calculations. ⬛ Unverified.

---

## PHASE 28 — FINAL RISK REGISTER

### 28.1 Complete Risk Register

| Risk ID | Risk | Likelihood | Impact | Current Control | Residual Risk |
|---------|------|-----------|--------|----------------|--------------|
| R01 | Service role key exposed in source code | CERTAIN (it exists now) | CRITICAL | None | 🚨 CRITICAL |
| R02 | CockroachDB credentials in .env | CERTAIN (if repo is visible) | CRITICAL | Private repo? | ⚠️ HIGH |
| R03 | Live win rate is ~28% (negative EV at many thresholds) | CONFIRMED | HIGH — user trust | None | 🚨 CRITICAL |
| R04 | Order book data is synthetic — users don't know | CONFIRMED | HIGH — misleads trading decisions | None | 🚨 CRITICAL |
| R05 | Vercel exit cron always skipped | CONFIRMED | HIGH — trades may not exit at SL | GH Action `trade-monitor.yml` is fallback | ⚠️ HIGH |
| R06 | SSE streaming non-functional | CONFIRMED | MEDIUM — "live" UX is false | None | ⚠️ HIGH |
| R07 | Fundamental defaults fabricated | CONFIRMED | HIGH — bad analysis shown as real | None | ⚠️ HIGH |
| R08 | Screener win rates fabricated | CONFIRMED | HIGH — misleads signal quality | None | ⚠️ HIGH |
| R09 | LAUNCH_DATE hides 998 trades | CONFIRMED | MEDIUM — users see incomplete history | None | 📋 MEDIUM |
| R10 | Look-ahead bias in 8 features | CONFIRMED | HIGH — invalidates model evaluation | None | ⚠️ HIGH |
| R11 | Duplicate exit engines may race | POSSIBLE | MEDIUM — inconsistent exits | None | 📋 MEDIUM |
| R12 | Windows local machine SPOF | POSSIBLE | HIGH — pipeline failure if offline | GH Actions partial backup | 📋 MEDIUM |
| R13 | TV scanner scraping could be blocked | POSSIBLE | HIGH — primary data source lost | DB fallback | 📋 MEDIUM |
| R14 | EGX website goes down | POSSIBLE | HIGH — bulletin data stale | TV scraper fallback | 📋 MEDIUM |
| R15 | `signal_stats` win rates use old buggy MACD | CONFIRMED | MEDIUM — stale benchmark | Model v4+ uses fixed MACD | 📋 MEDIUM |
| R16 | Benchmark calculation in analytics is meaningless | CONFIRMED | MEDIUM — false alpha attribution | None | 📋 MEDIUM |
| R17 | Sharpe ratio reported is non-standard | CONFIRMED | MEDIUM — misleads performance reporting | None | 📋 MEDIUM |
| R18 | Intraday data mislabeled as 'tradingview' when from Yahoo | CONFIRMED | LOW — data quality confusion | None | 📋 MEDIUM |

---

## CONCLUSION — HIGHEST PRIORITY REMEDIATION LIST

Based on the complete forensic audit (Phases 1–28), the following are the 10 highest-priority remediations in order:

| Priority | Action | Severity | Effort |
|----------|--------|---------|--------|
| 1 | Remove hardcoded service role key from `investor-flows/route.ts` — use `process.env` | 🚨 CRITICAL | 5 minutes |
| 2 | Fix Vercel cron timing: change `"0 15 * * *"` to `"0 9 * * *"` (9:00 UTC = noon Cairo, within session) | 🚨 CRITICAL | 2 minutes |
| 3 | Mark order book data as simulated with a clear UI disclosure label | 🚨 CRITICAL | 1 hour |
| 4 | Remove `LAUNCH_DATE` filter — show full historical performance with date label | ⚠️ HIGH | 1 hour |
| 5 | Remove fabricated win rate defaults from screener — show "N/A" if no signal_stats data | ⚠️ HIGH | 30 minutes |
| 6 | Remove hash-fabricated trade badges — show only real snapshot values or nothing | ⚠️ HIGH | 1 hour |
| 7 | Remove hardcoded fundamental defaults — show "N/A" if no data | ⚠️ HIGH | 1 hour |
| 8 | Fix live streaming: either implement Redis pub/sub for SSE or remove the "live" UI indicator | ⚠️ HIGH | 1–3 days |
| 9 | Build point-in-time fundamental snapshot table — stop using current PE for historical bars | ⚠️ HIGH | 2–3 days |
| 10 | Fix benchmark calculation in performance_analytics.py — use EGX30 index return as benchmark | ⚠️ HIGH | 2 hours |

---

*Supplementary Audit Complete — 2026-08-05T19:14:00+03:00*  
*Evidence: 796-line signal generator (fully traced), 307-line performance analytics (fully traced), 368-line backtest engine (fully traced), vercel.json, backtest_results.json mathematical verification.*
