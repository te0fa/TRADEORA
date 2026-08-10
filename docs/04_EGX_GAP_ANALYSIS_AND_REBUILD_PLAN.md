# TRADEORA EGX — GAP ANALYSIS & REBUILD PLAN
**Document Type:** Gap Analysis and Phased Rebuild Plan  
**Authority:** Derived from `01_EGX_COMPREHENSIVE_AUDIT.md`, `02_EGX_SUPPLEMENTARY_AUDIT.md`,  
`02_EGX_CURRENT_ARCHITECTURE.md`, `03_EGX_TARGET_ARCHITECTURE.md`  
**Date:** 2026-08-05  
**Platform Age:** 16 days as of audit date (first migration: 2026-07-20)  
**Authors:** Principal Software Architect / Quantitative Systems Architect / Program Manager

> **Governing Rule:** Every recommendation traces back to AUDIT → CURRENT → TARGET → GAP → ACTION.  
> DO NOT implement anything from this document without completing the acceptance gates first.

---

## SECTION 1 — EXECUTIVE GAP SUMMARY

### 1.1 Maturity Assessment

| Dimension | Current Score | Target Score | Gap |
|-----------|--------------|-------------|-----|
| Data Accuracy | 55/100 | 90/100 | −35 |
| Data Freshness | 70/100 | 90/100 | −20 |
| Data Integrity | 60/100 | 95/100 | −35 |
| Intraday Reliability | 55/100 | 80/100 | −25 |
| Market Depth | 5/100 | 40/100 (honest derived) | −35 |
| API Reliability | 65/100 | 92/100 | −27 |
| Automation | 60/100 | 90/100 | −30 |
| Signal Logic | 55/100 | 80/100 | −25 |
| Backtesting Readiness | 25/100 | 90/100 | −65 |
| Risk Management | 50/100 | 85/100 | −35 |
| Performance Reporting | 35/100 | 90/100 | −55 |
| Security | 30/100 | 90/100 | −60 |
| Observability | 45/100 | 85/100 | −40 |
| **Overall Platform** | **55/100** | **88/100** | **−33** |

### 1.2 Biggest Architectural Gaps

1. **SSE live streaming is non-functional on Vercel** — `livePriceStore` singleton breaks in serverless. No real-time prices work in production despite the UI suggesting they do.
2. **Exit cron (Vercel) always skipped** — fires at 15:00 UTC (18:00 Cairo), session gate closes at 13:30 UTC (10:30 UTC). Every exit check via Vercel is silently skipped. GH Action `trade-monitor.yml` is the actual (unacknowledged) mechanism.
3. **Two conflicting exit engines** — `track-recommended-trades/route.ts` (TypeScript, 618 lines) and `track_trades.py` / `trade_monitor.py` (Python). A third, `signal_guardian.py`, also exists. None are authoritative. Race condition risk exists if any two run simultaneously.
4. **CockroachDB is an unnecessary second database** — `daily_investor_flows` lives in both Supabase and CockroachDB. The sync logic (`cockroach_sync.py`) adds complexity with no demonstrated benefit.
5. **Canonical price layer not universally respected** — `canonical.py` defines FORBIDDEN sources but the SQL RPC `get_latest_prices()` assigns priority 3 to `intraday_consensus` (flagged FORBIDDEN). API routes implement own priority logic, creating four different prices for the same stock on the same page load.

### 1.3 Biggest Data Gaps

1. **Order book data is entirely fabricated** — hardcoded 145k/290k/85k bid/ask volumes in code presented as real Level 2 data. EGX does not provide a public L2 API.
2. **Fundamental data has no history** — `company_fundamentals` is a single scalar row per company. Today's PE is applied to all historical training bars (look-ahead bias).
3. **Intraday data is mislabeled** — Yahoo Finance candles injected at request time are stored with `source='tradingview'`.
4. **Screener shows fabricated win rates** — 78/72/60 hardcoded based purely on daily price direction (up/down/flat), not ML signals.
5. **Screener signals are not ML signals** — `signal = 'buy'` if price_change >= 2.2%, else 'sell' if <= -2.2%. Nothing to do with the XGBoost model.
6. **EGX33 fallback is stale hardcoded value** — `6199.67` returned when Mubasher HTML scrape fails. No timestamp shown.
7. **998 historical trades hidden** — `LAUNCH_DATE = '2026-08-03'` filter removes all pre-audit performance data from the dashboard.

### 1.4 Biggest Quantitative Gaps

1. **28.3% live win rate vs 60.3% backtest claim** — 32pp gap is the single largest quant finding. Caused by look-ahead bias (8 of 30 features), in-sample evaluation, and unvalidated boost stack.
2. **7 dead features in 30-feature model** — sentiment/macro features are always `0.0` or `1.0`. Model effectively operates on ~14 non-constant, non-contaminated features.
3. **SELL signals are incorrect** — SELL = BUY_probability <= 0.35 (inverse BUY tail). A stock that won't rise 4%+ in 15 days is not necessarily a SELL candidate.
4. **Boost stack is not walk-forward validated** — Wyckoff, Elliott, ICT/SMC, flow boosts add probability after model output with no OOS evidence they improve results.
5. **Sharpe ratio is non-standard** — `avg_pnl / std_pnl` (no annualization, no risk-free rate). Reported values of 6.9 and 12.32 cannot be compared to any industry Sharpe.
6. **Benchmark is mathematically meaningless** — `pct_change()` run on all rows of `market_prices` concatenated across all companies and sources. Output is not a valid benchmark.
7. **Max drawdown uses sequential trade order** (by `recommended_at`), not concurrent portfolio equity curve. Understates real drawdown.
8. **Intraday strategy losing average -5.25% per trade** across 253 live trades. This is the largest capital destruction in the platform.

### 1.5 Biggest Reliability Gaps

1. **Windows local machine is a Single Point of Failure** — `run_daily.bat` handles `main.py`, `track_trades.py`, `signal_guardian.py`, `tv_backfill.py`. If the machine is off, no alert fires.
2. **No source health monitoring** — if EGX website or TradingView scraper fails silently, the platform uses stale data with no user or admin notification.
3. **No pipeline alerting** — beyond Telegram trade alerts, no system-level alerting exists for failed GH Actions, data gaps, or quality degradation.
4. **No circuit breaker** — repeated external API failures are not tracked; no backoff or fallback escalation.
5. **Model files are stored in the repo filesystem** — `models/model_1d_v6.pkl` (2.7 MB) lives in git. If the GitHub Actions runner cannot load it, signal generation silently fails.

### 1.6 Biggest Automation Gaps

1. **Exit engine is broken on Vercel** (timing bug). The actual working exit mechanism is `trade-monitor.yml` GH Action — but this relationship is undocumented and untested for full 7-mechanism coverage.
2. **No automated data quality check** — no job validates that today's data passed OHLC constraints, was not a duplicate, and came from the expected source.
3. **Intraday data has no quality gate** — Yahoo-injected candles labeled as `tradingview` with no validation.
4. **Weekly backtest tests rule-based strategy, not ML model** — `weekly_backtest.yml` runs `backtest_signals.py` which tests RSI/MACD/SMA rules, not the XGBoost v6 model.
5. **Model retraining is fully manual** — no GH Action for model training. If fundamentals change or market regime shifts, model staleness goes undetected.
6. **`track_trades_schedule.yml` is explicitly disabled** but not deleted — creates confusion about which automation is canonical.

### 1.7 Biggest Frontend/Data Integration Gaps

1. **Same stock shows 4 different prices on different pages simultaneously** — `market-movers` (TV scanner live), `stock-live` (TV scanner), `canonical-price` RPC, `intraday?interval=1440` (DB). No disclosure.
2. **Live indicator is false** — SSE stream is non-functional; frontend shows "live" but receives no ticks.
3. **Trade badges are hash-fabricated** — Wyckoff, Elliott, MACD dead cross badges assigned by `symbol.charCodeAt()` hash when not in snapshot.
4. **Smart money score defaults to 82.0** for every trade lacking a real snapshot.
5. **Fundamental discount badge always shows "خصم 28%"** regardless of actual fundamental data.

---

## SECTION 2 — LAYER-BY-LAYER GAP ANALYSIS

### Layer 1: Data Layer

**Severity: HIGH**

| | Current | Target |
|--|---------|--------|
| Schema | Single flat schema in Supabase | Separate schemas: raw.*, canonical.*, fundamentals.*, signals.*, trades.*, performance.*, observability.*, config.* |
| Dual DB | CockroachDB + Supabase for investor flows | Supabase only (consolidate) |
| Bitemporal tables | None — single-row fundamentals | INSERT-ONLY bitemporal for fundamentals, sharia, regimes, events |
| Source tracking | `source VARCHAR` per row (inconsistently set) | Accurate source per row; forbidden sources never written to canonical.* |
| Secrets | Service role key hardcoded in route.ts; CockroachDB URL in .env | All secrets in env vars; zero in source |

**Gap:** No schema separation; no bitemporal pattern; dual DB; one critical credential in source.  
**Evidence:** `app/api/investor-flows/route.ts` line 18; `company_fundamentals` single-row design.  
**Impact:** Look-ahead bias; security breach risk; data confusion across schemas.  
**Complexity:** HIGH (schema migration requires careful data migration; bitemporal requires new insert logic)  
**Priority:** CRITICAL — unblocks everything else

---

### Layer 2: Market Data

**Severity: HIGH**

| | Current | Target |
|--|---------|--------|
| Ingestion | `main.py` scrapes EGX+TV; `tv_backfill.py` backfills. No formal adapter pattern | Pluggable adapter per source; source label always accurate |
| Source priority | `canonical.py` defines priority but API routes diverge | Single authoritative resolver used by all routes and services |
| Validation | No OHLC quality gate | Quality gate: H >= max(O,C), L <= min(O,C), change_pct in [-50%,+50%], volume >= 0 |
| Gap detection | None | Gap detector: alert if EGX trading day has no canonical row for top-50 stocks |
| Source health | None | Source health monitor: consecutive_failures tracked per source; alert at threshold |
| Intraday labeling | Yahoo-injected candles stored with `source='tradingview'` (line 259 intraday/route.ts) | Accurate source label per bar; mixed-source response labeled |

**Gap:** No quality gate; no gap detection; no source health; intraday mislabeling; canonical layer not universally enforced.  
**Evidence:** `api/intraday/route.ts` line 259; `backtest_signals.py` no source filter; `get_latest_prices()` RPC includes `intraday_consensus` at priority 3.  
**Impact:** Phantom price moves in backtests; user sees mislabeled data; silent data gaps.  
**Complexity:** MEDIUM (quality gate is addable; source health is new service)  
**Priority:** HIGH — Phase 1

---

### Layer 3: Data Quality Engine

**Severity: CRITICAL**

| | Current | Target |
|--|---------|--------|
| Existence | None | Full quality engine: freshness, coverage, consistency, accuracy, completeness |
| Monitoring | No quality scorecard | Daily quality report with composite score |
| Alerting | No quality alerts | Telegram alert if composite_score < 0.7 |
| Duplicate handling | Basic upsert on `(company_id, price_date, source)` — different sources create multiple rows | Source priority resolver produces one canonical row |

**Gap:** Entirely missing. The only quality logic is "upsert on compound key."  
**Evidence:** `services/canonical.py` — has source list but no active quality scoring. Backtest queries raw `market_prices` with no source filter (`backtest_signals.py`).  
**Impact:** Contaminated backtests; stale data served to users with no warning.  
**Complexity:** MEDIUM (new service, requires new observability.* schema tables)  
**Priority:** HIGH — Phase 1

---

### Layer 4: Universe Engine

**Severity: MEDIUM**

| | Current | Target |
|--|---------|--------|
| Asset registry | `companies` table — static, seeded | Dynamic: new listings detected; delistings tracked |
| Corporate actions | `companies.notes` text field stores "SPLIT_DETECTED:..." hacks | `events.corporate_actions` formal table |
| Signal inclusion | No formal filter | Active + data_coverage_pct >= 60% + last_price within 5 trading days |

**Gap:** Corporate action handling is a text-field hack; no formal delisting/suspension tracking; no signal inclusion filter criteria.  
**Evidence:** `companies.notes` design; audit finding that no price adjustment is applied for splits.  
**Impact:** Backtests include split-adjusted prices incorrectly; suspended stocks may receive signals.  
**Complexity:** MEDIUM  
**Priority:** MEDIUM — Phase 2

---

### Layer 5: Sharia Compliance Engine

**Severity: LOW**

| | Current | Target |
|--|---------|--------|
| Data model | `companies.is_shariah_compliant` single boolean | INSERT-ONLY `compliance.sharia_assessments` with effective_date |
| Source | EGX scrape via `sync-shariah` Vercel cron | Same source but bitemporal |
| Temporal accuracy | N/A — only current status | Point-in-time query for historical signals |

**Gap:** No history of sharia status changes. Minor look-ahead issue for historical signal generation (a stock may have been sharia-non-compliant in the past).  
**Evidence:** `20260802_critical_fixes.sql` — adds `is_shariah_compliant` as a column.  
**Impact:** LOW for live trading; MEDIUM for historical analysis.  
**Complexity:** LOW (INSERT-ONLY table, weekly scrape unchanged)  
**Priority:** LOW — Phase 4

---

### Layer 6: Events/Catalysts Engine

**Severity: MEDIUM**

| | Current | Target |
|--|---------|--------|
| News ingestion | `almal_news_scraper.py` → `company_news` table | Same + classification + materiality scoring + market reaction tracking |
| Corporate events | `egx_disclosures_insider_scraper.py` → `corporate_events` table | Same + formal CatalystEvent lifecycle |
| Catalyst → Signal | None — signals are generated independently | Catalyst scores feed Opportunity engine |
| Surprise scoring | None | EPS surprise vs prior period; automatic reaction tracking at T+1/T+3/T+5 |

**Gap:** News is ingested but not classified into formal catalysts. No surprise scoring. No Opportunity → Signal pipeline.  
**Evidence:** `company_news` table has `category` column but materiality scoring is not confirmed.  
**Impact:** Signals are generated without considering fundamental catalysts — missed entries and exits.  
**Complexity:** HIGH (NLP scoring + materiality model + reaction tracking)  
**Priority:** MEDIUM — Phase 5 (after data and signal integrity are fixed)

---

### Layer 7: Market Regime Engine

**Severity: MEDIUM**

| | Current | Target |
|--|---------|--------|
| Regime detection | `ADX(14)` threshold only (in feature vector as `regime` feature) | Multi-signal: ADX + A/D ratio + foreign flows + EGX30 trend |
| Regime history | None stored | INSERT-ONLY `regimes.snapshots` per trading day |
| Signal thresholds | Fixed ML threshold (0.65 default) | Threshold varies by regime: 0.60 bullish → 0.75 bearish |
| Performance attribution | None by regime | Attribution split by regime in weekly performance report |

**Gap:** No regime history; no regime-dependent signal thresholds; single ADX proxy in feature vector is insufficient.  
**Evidence:** `generate_daily_recommendations.py` feature 14: `regime = ADX + DI+/DI-` only.  
**Impact:** Model generates signals at fixed threshold regardless of market environment; no attribution for regime-specific performance.  
**Complexity:** MEDIUM  
**Priority:** MEDIUM — Phase 5

---

### Layer 8: Analysis Engine

**Severity: OK/LOW**

| | Current | Target |
|--|---------|--------|
| Technical indicators | RSI, MACD, EMA, ATR, ADX, Bollinger, StochRSI, volume ratio — all computed from point-in-time prices | Same + explicit DateGuard enforcement |
| Purity | Functions are mostly pure (take price arrays as input) | Enforce `as_of_date` parameter on all feature functions |
| MACD formula | Fixed in v4+ (`MACD_line - signal_line`) | Correct — no change needed |

**Gap:** No formal DateGuard enforcement (the as_of_date discipline is informal); no caching layer.  
**Evidence:** Features 0–14 in `generate_daily_recommendations.py` are confirmed point-in-time. `day_of_week` (feature 13) uses `datetime.now()` for all historical bars during training — minor but real look-ahead.  
**Impact:** LOW for live; MEDIUM for backtest accuracy (day_of_week always = training day's weekday).  
**Complexity:** LOW (DateGuard is a decorator pattern)  
**Priority:** MEDIUM — Phase 2

---

### Layer 9: Microstructure Engine

**Severity: CRITICAL**

| | Current | Target |
|--|---------|--------|
| Order book | Hardcoded synthetic 145k/290k/85k bid/ask presented as real L2 | Honest UNAVAILABLE response + derived estimates labeled |
| OFI ratio | Computed from synthetic bid/ask; hardcoded 0.5 in ML features | Remove from ML; honest derived estimate or UNAVAILABLE |
| UI disclosure | None — users see synthetic data with no warning | Arabic label: "غير متاح" for unavailable; "مشتق" for derived |

**Gap:** Fabricated data presented as real. OFI ratio is a dead ML feature. No disclosure to users.  
**Evidence:** `api/orderbook/route.ts` lines 59–73 confirmed. `ofi_ratio_norm = 0.5` in training code.  
**Impact:** CRITICAL — users may make trading decisions based on fabricated market depth.  
**Complexity:** LOW (change API response; label UI — no real data source to wire up)  
**Priority:** CRITICAL — Phase 0 (hours)

---

### Layer 10: Opportunity Engine

**Severity: HIGH**

| | Current | Target |
|--|---------|--------|
| Existence | None — Signal generation runs directly without an opportunity assessment stage | Formal Opportunity entity with multi-factor scoring |
| Tradeability | No check for suspended stocks, circuit breakers, liquidity | Explicit tradeability check before signal creation |
| Lifecycle | None | DETECTED → ACTIVE → CONVERTED_TO_SIGNAL / EXPIRED / INVALIDATED |

**Gap:** Entirely missing. The current system goes directly from "daily candles" to "ML signal" without any catalyst, regime, or tradeability pre-filter.  
**Evidence:** `generate_daily_recommendations.py` — processes every company in `companies` table without tradeability check.  
**Impact:** Signals generated on suspended stocks, illiquid stocks, and stocks in circuit breaker territory.  
**Complexity:** HIGH (new engine layer)  
**Priority:** LOW — Phase 5 (after foundations are stable)

---

### Layer 11: Strategy Engine

**Severity: MEDIUM**

| | Current | Target |
|--|---------|--------|
| Strategy definition | Implicit — ML model + hardcoded thresholds in `generate_daily_recommendations.py` | Versioned, approved strategy records in `config.strategies` |
| Multiple strategies | Single `combined_strict` approach | 5 catalogued strategies with independent tracking |
| Human gate | None — parameters can be changed in code | Human approval required for any strategy parameter change |

**Gap:** No formal strategy versioning; no human gate; strategy is embedded in a 796-line Python file.  
**Evidence:** `generate_daily_recommendations.py` lines 765–770 — threshold from `system_settings` but not versioned.  
**Impact:** Strategy drift undetectable; no A/B comparison between strategy versions.  
**Complexity:** MEDIUM  
**Priority:** LOW — Phase 5

---

### Layer 12: Signal Engine

**Severity: CRITICAL**

| | Current | Target |
|--|---------|--------|
| Look-ahead bias | 8 of 30 features use current fundamentals for historical bars | All features point-in-time via `FundamentalSnapshot` + DateGuard |
| Dead features | 7 features are constant (always 0.0); 1 (`ofi_ratio`) is hardcoded 0.5 | Remove dead features; replace with validated alternatives |
| Signal immutability | TP/SL/probability updated in-place daily on active trades | Signal is IMMUTABLE after creation; update = new Signal |
| SELL logic | SELL = BUY_probability <= 0.35 (inverse BUY — wrong) | Phase 1: SELL = exit engine only. Phase 2: dedicated SELL model |
| Boost stack | 9 additive boosts after model output; none walk-forward validated | Boosts stored but contribute 0 until OOS validation confirms value |
| Evidence | No evidence log per signal | `features_snapshot` + `evidence` JSONB fields (partially implemented) |
| Expiry | Signals are open-ended | `valid_until` field; signals expire |

**Gap:** Multiple critical flaws: look-ahead bias (8 features), dead features (8 features), daily overwrite of TP/SL, wrong SELL logic, unvalidated boosts.  
**Evidence:** Phase 21 supplementary audit (full feature trace); Phase 22 (28.3% live WR vs 60.3% backtest).  
**Impact:** 32pp backtest/live gap; negative expected value at most ML thresholds; misleading probability updates.  
**Complexity:** HIGH  
**Priority:** CRITICAL — Phase 2

---

### Layer 13: Risk Engine

**Severity: CRITICAL**

| | Current | Target |
|--|---------|--------|
| Position sizing | None — signal generated regardless of position size | ATR-based position sizing: risk_per_share × shares = max_risk_per_trade |
| Portfolio heat | None — unlimited concurrent signals | max_portfolio_heat_pct = 10% cap |
| Drawdown halt | None | Suspend signals if portfolio drawdown >= 20% |
| Net R:R | R:R computed gross (no EGX costs) | rr_net_t1 must clear min after ~0.72% round-trip cost |

**Gap:** Entirely missing. No position sizing, no portfolio heat limit, no drawdown halt, no cost-adjusted R:R.  
**Evidence:** `generate_daily_recommendations.py` — no portfolio-level check. Exit engine computes PnL without costs.  
**Impact:** CRITICAL — unlimited concurrent risk; signals generated even during deep portfolio drawdown.  
**Complexity:** HIGH (new service layer; requires daily equity curve tracking)  
**Priority:** CRITICAL — Phase 3

---

### Layer 14: Regulatory Constraints

**Severity: MEDIUM**

| | Current | Target |
|--|---------|--------|
| EGX calendar | No formal entity | `config.egx_calendar` with all trading days, session hours, holiday types |
| Circuit breakers | No check | Tradeability = LOW_LIQUIDITY if stock moved +-9% today |
| Short selling | SELL signals may imply short | SELL = exit existing longs only; SBL check required for short |
| Settlement T+2 | Not explicitly modeled | Tagged in TradePlan; affects exit window |
| Timezone | UTC+2 used in most places; occasional confusion | All schedules via `config.egx_calendar` UTC equivalents |

**Gap:** No EGX calendar entity; no circuit breaker check in signal generation; SELL signals may be generating inappropriate short recommendations.  
**Evidence:** `track-recommended-trades/route.ts` — session gate uses hardcoded UTC offsets, not a calendar table.  
**Impact:** MEDIUM for correctness; HIGH for legal/regulatory if short-selling signals are followed on non-SBL stocks.  
**Complexity:** LOW for calendar; MEDIUM for full regulatory constraint enforcement  
**Priority:** MEDIUM — Phase 1 (calendar only); MEDIUM — Phase 3 (full constraints)

---

### Layer 15: TradePlan Engine

**Severity: HIGH**

| | Current | Target |
|--|---------|--------|
| Immutability | TP1/TP2/SL updated daily in-place on active trades | Immutable after creation; new levels = new TradePlan |
| EGX costs | Not included in R:R | `rr_net_t1` after 0.72% round-trip cost |
| ATR levels | ATR recalculated daily; levels change daily | ATR computed once at signal_date; frozen |
| Formal entity | Embedded in `recommended_trades` | Separate `signals.trade_plans` entity |
| Historical reconstruction | Impossible — levels overwritten daily | Possible — each TradePlan is immutable |

**Gap:** Moving-target exit levels; no EGX transaction costs in R:R; no separate TradePlan entity; no historical reconstruction possible.  
**Evidence:** Phase 21.4 — `generate_daily_recommendations.py` lines 638–650 updating `sl`, `tp1`, `tp2` on active trades daily.  
**Impact:** HIGH — exit engine is evaluating against different levels than original entry decision; performance reconstruction impossible.  
**Complexity:** MEDIUM (requires schema change and signal engine refactor)  
**Priority:** HIGH — Phase 2

---

### Layer 16: Execution Integration

**Severity: LOW**

| | Current | Target |
|--|---------|--------|
| Entry recording | `entry_price = last_close_price` from signal time — estimated, not actual fill | `is_entry_estimated = true` flag; actual fill recording |
| User trade recording | `user_trades` table exists | Maintained as-is + actual fill price when user records |
| Exit recording | Exit via trade_monitor.py | Same, plus `exit_engine_version` tracking |

**Gap:** No distinction between estimated entry and actual fill. All entries are estimated.  
**Evidence:** `recommended_trades.entry_price` = price at signal time, not actual user fill.  
**Impact:** LOW (information/transparency issue, not a functional bug)  
**Complexity:** LOW  
**Priority:** LOW — Phase 4

---

### Layer 17: Performance Engine

**Severity: CRITICAL**

| | Current | Target |
|--|---------|--------|
| Sharpe | `avg_pnl / std_pnl` — non-standard | `(annualized_return - egypt_tbill_27pct) / annualized_std * sqrt(252)` |
| Benchmark | All `market_prices` rows concatenated — mathematically meaningless | EGX30 Total Return Index |
| Max drawdown | Sequential trade order, not concurrent portfolio | Daily equity curve from `trades.daily_pnl_snapshots` |
| Transaction costs | Not included | All statistics use `net_pnl_egp` after EGX costs |
| Data coverage | `LAUNCH_DATE = '2026-08-03'` hides 998 trades | All trades included; pre-clean labeled not hidden |
| Attribution | None | Cost drag, regime attribution, model version split |

**Gap:** Every major performance metric is incorrect or misleading. This is a complete rebuild of `performance_analytics.py`.  
**Evidence:** Phase 22 supplementary audit — full code trace of `performance_analytics.py`.  
**Impact:** CRITICAL — platform cannot make honest performance claims until this is fixed.  
**Complexity:** HIGH  
**Priority:** CRITICAL — Phase 3

---

### Layer 18: Backtesting Engine

**Severity: CRITICAL**

| | Current | Target |
|--|---------|--------|
| Strategy tested | Rule-based RSI/MACD/SMA rules (`backtest_signals.py`) — NOT the XGBoost ML model | Dedicated ML model backtest with XGBoost predict_proba |
| Look-ahead | 8 features with current fundamentals applied to historical bars | `FundamentalSnapshot` point-in-time query; DateGuard |
| Walk-forward | None | Minimum 5 folds; OOS gap >= 6 months |
| Source filter | None — multi-source duplicates create phantom price moves | Source-filtered canonical query only |
| Transaction costs | Not applied | 0.175% + 0.009% per side + 0.15% FRA + slippage |
| Survivorship bias | Current `companies` table only | Universe at each bar_date includes all then-active stocks |
| Random baseline | None | Monte Carlo 10,000 runs; beat coin flip + EGX30 TR + T-bill |
| Promotion gate | None — model promoted manually | Human approval required; look_ahead_detected must be false |

**Gap:** The current backtest is entirely invalid — wrong strategy, look-ahead bias, no walk-forward, multi-source duplicates, no costs, no survivorship control.  
**Evidence:** Phase 23 — `backtest_signals.py` does not test the XGBoost model. Phase 25.2 — no source filter in backtest query.  
**Impact:** CRITICAL — the 60.3% win rate claim is meaningless; 28.3% live reality is the truth.  
**Complexity:** VERY HIGH (new backtest infrastructure + FundamentalSnapshot dependency)  
**Priority:** CRITICAL — Phase 2 (after temporal truth fixed)

---

### Layer 19: Learning Engine

**Severity: HIGH (missing)**

| | Current | Target |
|--|---------|--------|
| Existence | None | OBSERVE → ANALYZE → PROPOSE → HUMAN APPROVE → VERSIONED UPDATE |
| Model retraining | Manual — developer runs `train_model_v6.py` locally | Structured proposal with evidence + human gate |
| Feature importance | Not tracked over time | Regular drift analysis; alert if importance distribution shifts |

**Gap:** Entirely missing. Model retraining is fully manual with no governance.  
**Evidence:** Container 5 (`train_model_v6.py`) — no GH Action for retraining; run manually.  
**Impact:** HIGH — no mechanism to detect or respond to model drift; no governance over changes.  
**Complexity:** HIGH  
**Priority:** LOW — Phase 6 (after stable backtest exists)

---

### Layer 20: Observability

**Severity: CRITICAL**

| | Current | Target |
|--|---------|--------|
| Pipeline monitoring | None — file logs only | `observability.pipeline_health` table; health dashboard |
| Alerting | Telegram for trade alerts only | Telegram alerts for every pipeline failure |
| Source health | None | Consecutive failure tracking per source |
| Quality dashboards | None | Admin `/observability` dashboard with composite scores |
| Model health | None | Weekly WR comparison; suspend if delta > 25pp |

**Gap:** Entirely missing for infrastructure. Only trade-event Telegram alerts exist.  
**Evidence:** Phase 16 scorecard: Observability = 45/100. No `observability.*` schema tables exist.  
**Impact:** CRITICAL — silent failures go undetected; data gaps are not caught; model drift is invisible.  
**Complexity:** MEDIUM  
**Priority:** HIGH — Phase 1

---

### Layer 21: Frontend

**Severity: HIGH**

| | Current | Target |
|--|---------|--------|
| Live prices | SSE + `livePriceStore` (non-functional on Vercel) | Redis-backed polling; "Updated Ns ago" counter; no false "LIVE" |
| Order book UI | Shows synthetic L2 data with no disclaimer | Honest UNAVAILABLE + derived estimates labeled in Arabic |
| Trade badges | Hash-fabricated Wyckoff/Elliott/MACD badges | Only show if `features_snapshot` has real value |
| Screener signals | Price-change threshold masquerading as ML | Show ML signal or null; show real OOS win rate or null |
| Performance | Shows 2-day data (post-reset) | Show all historical trades with model_version label |
| Price discrepancy | 4 different prices for same stock across pages | One canonical price per page with source label |

**Gap:** Multiple fabricated UI elements presented as real data. SSE broken. 4 different prices on same page.  
**Evidence:** Phase 14 — hardcoded values catalog. Phase 2.3 — screener signal logic.  
**Impact:** HIGH — user trust and legal exposure.  
**Complexity:** LOW-MEDIUM (mostly API changes, some UI component changes)  
**Priority:** CRITICAL (fabricated data) — Phase 0; HIGH (other) — Phase 3

---

### Layer 22: API Layer

**Severity: HIGH**

| | Current | Target |
|--|---------|--------|
| Response format | Inconsistent — varies per route | `{ data, meta: { source, freshness_at, quality_score, is_estimated } }` |
| Source labeling | Intraday labels Yahoo as TradingView | Accurate source per bar |
| Fabricated defaults | Fundamental defaults, win rates, badges | null if no real data |
| SSE endpoint | Non-functional (`/api/stream-prices`) | Remove or replace with Redis-backed polling endpoint |
| LAUNCH_DATE filter | Hides 998 trades in `/api/trades` | Remove filter; add model_version label |

**Gap:** No universal response format; source mislabeling; fabricated defaults throughout.  
**Evidence:** Phase 3 API inventory — 6 routes confirmed as FAKE, SYNTHETIC, or NON-FUNCTIONAL.  
**Impact:** HIGH — API contract is unreliable; consumers cannot trust source labels.  
**Complexity:** MEDIUM (systematic changes across 40 routes)  
**Priority:** HIGH — Phase 0-1

---

### Layer 23: Database

**Severity: HIGH**

| | Current | Target |
|--|---------|--------|
| Schema organization | Flat — all tables in public schema | Separated by domain: raw.*, canonical.*, signals.*, etc. |
| RPC consistency | `get_latest_prices()` includes `intraday_consensus` (FORBIDDEN in canonical.py) | RPC and canonical.py agree on source priority |
| Bitemporal tables | None — `company_fundamentals` is single-row per company | `fundamentals.snapshots` INSERT-ONLY |
| Missing constraints | No NOT NULL on some key columns; no CHECK constraints on OHLC validity | Add quality constraints |
| Indexes | Missing on `(company_id, price_date)` for intraday queries | Composite indexes for all common query patterns |
| CockroachDB | Second DB for investor flows — complex sync | Consolidate to Supabase; remove CockroachDB |

**Gap:** No schema separation; RPC inconsistent with application code; no bitemporal tables; no quality constraints.  
**Evidence:** Migration `20260720220522` — RPC includes `intraday_consensus` priority 3. Phase 4.2.  
**Impact:** HIGH — data inconsistency at DB level; canonical layer bypassed by RPC.  
**Complexity:** HIGH (schema migration requires careful phased migration)  
**Priority:** HIGH — Phase 1

---

### Layer 24: Infrastructure

**Severity: HIGH**

| | Current | Target |
|--|---------|--------|
| Exit engine compute | Vercel Cron (broken, timing bug) + GH Action (working, undocumented) | GH Actions only; Vercel cron removed from vercel.json |
| Windows SPOF | `run_daily.bat` on developer machine | Eliminated; all critical jobs on GH Actions |
| Price cache | `livePriceStore` in-memory (non-functional) | Upstash Redis TTL=60s price cache |
| Secret management | Service role key in source; .env committed | All secrets in Vercel env vars / GH Actions secrets |
| EGX calendar | No entity — hardcoded UTC offsets | `config.egx_calendar` consumed by all schedulers |
| Redundant workflow | `track_trades_schedule.yml` marked disabled but not removed | Removed cleanly |

**Gap:** Broken Vercel cron; Windows SPOF; non-functional SSE; credentials in source; no calendar entity.  
**Evidence:** Phase 24.2 — mathematical proof exit cron always skipped. Phase 15.1 — service role key in source.  
**Impact:** CRITICAL (security + exit engine); HIGH (SPOF + SSE).  
**Complexity:** LOW (cron fix = 2 lines; secret fix = 5 minutes); MEDIUM (Redis price cache)  
**Priority:** CRITICAL — Phase 0

---

## SECTION 3 — DATA PIPELINE GAP ANALYSIS

### 3.1 Daily OHLCV Pipeline

```
CURRENT FLOW:
  EGX Website (PDF/HTML)
    ↓ [egx_pdf_watcher.py / egx_scraper.py]
    ↓ [NO quality gate]
    ↓ [source = 'egx_bulletin'] ✅ (correct labeling)
    → market_prices table (multi-source rows per date)
  
  TradingView Scanner (fallback)
    ↓ [tv_backfill.py / tradingview_scraper.py]
    ↓ [NO quality gate]
    ↓ [source = 'tradingview_1d'] ✅
    → market_prices table (may create duplicate rows per date)
  
  API Layer (Next.js)
    ← api/intraday?interval=1440
       ← SELECT from market_prices
          WHERE source IN (...) — ORDER varies by route
          [FINDING: source priority differs between api/intraday and get_latest_prices() RPC]
       ← Response always labels source='tradingview' regardless of actual DB source ❌
    → Frontend: lightweight-charts candlestick
  
BROKEN LINKS:
  1. No quality gate on ingestion → bad OHLCV can enter market_prices
  2. Source priority inconsistent between routes → 4 different prices possible
  3. Response always labels 'tradingview' regardless of actual source
  4. No gap detection → silent data holes

TARGET FLOW:
  EGX Bulletin Adapter → QUALITY GATE → NORMALIZATION → raw.market_data_egx_bulletin
  TradingView Adapter  → QUALITY GATE → NORMALIZATION → raw.market_data_tradingview
  Yahoo Adapter        → QUALITY GATE → NORMALIZATION → raw.market_data_yahoo
    ↓ SOURCE PRIORITY RESOLVER (single canonical function)
    → canonical.market_data (one row per asset per date, accurate source label)
    ↓ GAP DETECTOR
    → observability.data_gaps + alert
  API Layer
    ← Reads canonical.market_data only
    → Response: { source: "egx_bulletin", freshness_at: "2026-08-05T16:30Z" } (accurate)
```

---

### 3.2 Intraday Pipeline

```
CURRENT FLOW:
  TradingView 15m candles (backfill)
    ↓ [tv_backfill.py during session via live-session-candles.yml]
    ↓ [source = 'tradingview_15m'] ✅ (correct in DB)
    → intraday_snapshots table
  
  Yahoo Finance live (request-time injection)
    ↓ [api/intraday/route.ts lines 230–252]
    ↓ [injected AT REQUEST TIME — not stored, or stored with source='tradingview'] ❌
    → May or may not be stored in intraday_snapshots
    → When stored: source mislabeled as 'tradingview'
  
  API Layer
    ← Reads intraday_snapshots + live Yahoo inject
    ← Aggregates 15m→30m/60m/4h by chunking
    ← Response: { source: 'tradingview' } regardless of actual source ❌
  
BROKEN LINKS:
  1. Yahoo-injected candles stored/labeled as 'tradingview'
  2. Live inject is not stored → disappears on next request (no persistence)
  3. Weekend handling not implemented → returns whatever DB has (may be empty)
  4. Market hours check: `cairoHour >= 10 && cairoHour < 16` — hardcoded, not from EGX calendar
  5. No quality gate on intraday candles

TARGET FLOW:
  tv_intraday_scraper.py (GH Actions, every 15min during session 08:00-13:00 UTC)
    → canonical.intraday_bars (source='tradingview_15m', accurate)
  
  price_cache_updater.py (GH Actions, every 30s)
    → Upstash Redis: price:{SYM} TTL=60s (for live price display)
  
  API Layer
    ← Reads canonical.intraday_bars
    ← Response: { source: 'tradingview_15m', is_live: false } (accurate)
    ← For live price: reads Redis cache → { price, changePct, updated_at, ttl_seconds }
```

---

### 3.3 Market Depth Pipeline

```
CURRENT FLOW:
  [No real data source exists]
  
  API Layer
    ← api/orderbook
       → IF orderbook_snapshots has row for this company_id:
           Return real snapshot (rarely populated)
       → ELSE (always):
           Return hardcoded synthetic bids/asks:
           { price - step, volume: 145000 }, { price - 2*step, volume: 290000 }, ...
           Labeled "Whale Bid Wall" in code comment ← HARDCODED

BROKEN LINKS:
  1. No real data source for EGX L2 — EGX does not provide public L2 API
  2. Synthetic data presented without disclosure
  3. OFI ratio computed from synthetic data → used as ML feature (hardcoded 0.5)
  4. orderbook_snapshots table exists but is almost never populated with real data

TARGET FLOW:
  api/orderbook → HONEST response:
  {
    data_availability: "UNAVAILABLE",
    message_ar: "بيانات عمق السوق غير متاحة لبورصة مصر",
    derived_metrics: {
      relative_volume: <from canonical.market_data>,
      estimated_spread_pct: <from intraday H-L proxy>,
      avg_daily_value_egp: <from canonical.market_data>,
      liquidity_tier: "LARGE_CAP|MID_CAP|SMALL_CAP"
    },
    is_derived: true
  }
  
  Remove: ofi_ratio_norm from ML features (replace with relative_volume which is real)
```

---

### 3.4 News Pipeline

```
CURRENT FLOW:
  Almal.com (Arabic news)
    ↓ [almal_news_scraper.py]
    → company_news table (title, content, source, published_at, category)
  
  EGX Disclosures
    ↓ [egx_disclosures_insider_scraper.py]
    → corporate_events + insider_trading tables
  
  Signal Engine
    ← News does NOT directly feed signal generation
    ← News sentiment boost is applied post-model (±0.07/0.09) without OOS validation

BROKEN LINKS:
  1. News is ingested but has no formal materiality scoring
  2. News → Signal path only through unvalidated probability boost
  3. No surprise scoring (vs prior quarter)
  4. No market reaction tracking (T+1, T+3, T+5)
  5. Catalyst → Opportunity → Signal pipeline does not exist

TARGET FLOW:
  almal_news_scraper.py → company_news → NLP classification → events.catalyst_events
  egx_disclosures_scraper.py → events.catalyst_events (EARNINGS, DIVIDEND, SPLIT, CONTRACT)
  ↓ materiality_score (NLP + rules + credibility)
  ↓ surprise_score (vs prior period)
  → signals.opportunities (if materiality >= threshold AND stock is tradeable)
  → Signal Engine as additional evidence item (validated OOS contribution only)
```

---

### 3.5 Corporate Actions Pipeline

```
CURRENT FLOW:
  Detection: price anomaly > 30% detected in main.py
  Storage: companies.notes text field ("SPLIT_DETECTED:2026-07-xx")
  Adjustment: NONE — no retrospective price adjustment applied
  Performance: No adjustment → inflated returns on post-split price series

BROKEN LINKS:
  1. Corporate actions stored in text field (not queryable)
  2. No price adjustment applied to historical bars
  3. No formal schema for corporate action events
  4. Backtest uses unadjusted prices → overstates/understates returns around splits

TARGET FLOW:
  detect_price_anomaly() → cross-check EGX Disclosures PDF
  → events.corporate_actions (formal schema: event_type, effective_date, factor)
  → apply adjustment_factor to market_prices prior to effective_date
  → record as_adjusted=true, adjustment_factor on adjusted rows
  Backtest: always use adjusted price series
```

---

## SECTION 4 — PRICE/CHART REBUILD PLAN

### Issue 1: Live Prices Not Updating (SSE Failure)

**Root Cause:** `live-price-store.ts` creates an in-memory singleton (`let livePrices = new Map()`). On Vercel serverless, every request spawns an isolated container. The singleton is never shared between containers. `POST /api/update-live-tick` writes to Container A's memory; user's `GET /api/stream-prices` reads from Container B's empty memory. The SSE stream delivers zero ticks.

**Fix:** Replace in-memory store with Upstash Redis:
1. `price_cache_updater.py` (GH Actions, every 30s during session): `SET price:{SYM} <json> EX 60`
2. `/api/price/{symbol}` (Vercel): `GET price:{SYM}` from Upstash → return `{ price, changePct, source, updated_at, ttl_remaining }`
3. Frontend: SWR polling every 30s (not SSE); UI shows "Updated Ns ago" (not fake "LIVE")
4. Remove: `/api/stream-prices`, `/api/update-live-tick`, `live-price-store.ts`

**Dependencies:** Upstash Redis account + env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)  
**Validation Test:** Load stock page; confirm price updates every 30s; confirm `updated_at` timestamp is < 60s old

---

### Issue 2: Charts Not Reflecting Latest Data

**Root Cause A:** Historical chart (`interval=1440`) reads from `market_prices` with source priority varying by route. The `intraday/route.ts` always labels response `source: 'tradingview'` regardless of actual DB source.  
**Fix A:** Use a single canonical price resolver function for all routes. Add `source` field per candle to response.

**Root Cause B:** No maximum age check — if `daily_update.yml` fails silently, chart shows yesterday's data with no staleness indicator.  
**Fix B:** Add `freshness_at` to response. Frontend shows "Last updated 2 days ago" warning if > 1 trading day stale.

**Root Cause C:** `get_latest_prices()` RPC includes `intraday_consensus` at priority 3 (FORBIDDEN in canonical.py).  
**Fix C:** Update the RPC migration to match `canonical.py` priority. Remove `intraday_consensus` from priority list.

**Validation Test:** After GH Action runs, chart shows today's candle with `source: 'egx_bulletin'` or `source: 'tradingview_1d'`; no stale-data warnings for today.

---

### Issue 3: Intraday Chart Gaps

**Root Cause A:** `tv_backfill.py` scrapes TradingView 15m candles during session. If TV blocks the scraper for any session intervals, those bars have no data. Yahoo Finance is injected at request time but not persisted → disappears on next request.  
**Fix A:** Store Yahoo-injected bars permanently in `intraday_snapshots` with accurate `source='yahoo_15m'` label. GH Action runs every 15min as backup.

**Root Cause B:** Weekend/holiday handling not implemented — chart returns empty array for weekend dates.  
**Fix B:** Filter requests by `config.egx_calendar.is_trading_day`. Return error or empty with explicit `{ is_trading_day: false }` metadata.

**Root Cause C:** Aggregation from 15m to 30m/60m/4h by simple chunking — if first bar of chunk is missing, OHLC is computed from fewer bars than expected.  
**Fix C:** Mark aggregated bars with `{ bars_included: N, expected_bars: M, is_complete: N===M }`.

**Validation Test:** Load intraday chart for a trading day. Confirm all intervals from 10:00–15:00 Cairo are present. Confirm no gaps in 15m data except confirmed trading halts.

---

### Issue 4: Frontend/Backend Price Disagreement

**Root Cause:** Four different code paths return different prices for the same stock:
1. `/api/market-movers` → TradingView scanner (live)
2. `/api/canonical-price` → `get_latest_prices()` RPC (DB, source priority order)
3. `/api/trades` → TradingView scanner for current_price, then DB fallback
4. `/api/intraday?interval=1440` → `market_prices` with inline source priority (different from RPC)

**Fix:** Create a single `getCanonicalPrice(symbol)` function used by ALL routes. Single source of truth per stock per page load. Response includes `source` and `freshness_at`.

**Validation Test:** Load `/stock/[symbol]` page. Confirm price shown in header, trades panel, and chart all match within 30 seconds.

---

## SECTION 5 — AUTOMATION REBUILD PLAN

### 5.1 Broken/Incomplete Automations

#### A. Exit Engine (Vercel Cron) — BROKEN

| Property | Current | Target |
|----------|---------|--------|
| Trigger | Vercel cron `0 15 * * *` (15:00 UTC = 18:00 Cairo) | GH Actions every 30min during session (08:00–13:30 UTC) |
| Job | `api/cron/track-recommended-trades/route.ts` | `trade_monitor.py` (Python, canonical) |
| Output | Always `{ skipped: true }` | Trade exits recorded in `recommended_trades` |
| Monitoring | None | `observability.pipeline_health` |
| Retry | None | retry: 2 in GH Actions job |
| Alert | None | Telegram if consecutive_failures >= 2 |

**Action:** Remove `track-recommended-trades` from `vercel.json`. Ensure `trade-monitor.yml` GH Action handles all 7 exit mechanisms. Remove `signal_guardian.py` (duplicate) or document clearly.

---

#### B. Live Price Cache — BROKEN

| Property | Current | Target |
|----------|---------|--------|
| Trigger | `POST /api/update-live-tick` (no caller confirmed) | GH Actions cron every 30s during session |
| Job | In-memory livePriceStore update (broken) | `price_cache_updater.py` → Upstash Redis |
| Output | Nothing (broken) | `price:{SYM}` in Redis TTL=60s |
| Monitoring | None | Pipeline health; alert if Redis write fails 3× |
| Alert | None | Telegram if source becomes unavailable |

---

#### C. Daily OHLCV Ingestion — PARTIAL

| Property | Current | Target |
|----------|---------|--------|
| Trigger | `daily_update.yml`: `0 15 * * 0-4` UTC | Same schedule; add quality gate step |
| Job | `main.py` (EGX + TV scraper) | `main.py` + `data_quality_check.py` step |
| Output | `market_prices` rows | `canonical.market_data` + `observability.quality_report` |
| Monitoring | File logs only | `observability.pipeline_health` |
| Retry | GH Actions default | retry: 2 |
| Alert | None | Telegram if coverage_pct < 80% or source DOWN |

---

#### D. Signal Generation — PARTIAL

| Property | Current | Target |
|----------|---------|--------|
| Trigger | `daily-recommendations.yml`: `30 14 * * 0,1,2,3,4` UTC | Same; add DateGuard validation step |
| Job | `generate_daily_recommendations.py` (v6, look-ahead contaminated) | Same + BitempFundamentals query + DateGuard |
| Output | `recommended_trades` (mutable, daily update) | `signals.signals` (IMMUTABLE) + `signals.trade_plans` |
| Monitoring | None | `observability.pipeline_health` |
| Alert | None | Alert if 0 signals generated when expected |

---

#### E. Weekly Backtest — BROKEN (wrong strategy tested)

| Property | Current | Target |
|----------|---------|--------|
| Trigger | `weekly_backtest.yml` (Sunday) | Same; but test ML model, not rule-based |
| Job | `backtest_signals.py` (RSI/MACD rules) | `backtest_engine.py` with XGBoost model + DateGuard + costs |
| Output | `signal_stats` table | `research.backtest_runs` |
| Monitoring | None | Alert if look_ahead_detected = true |
| Retry | None | retry: 1 (backtest is idempotent) |

---

#### F. Model Health Check — MISSING

| Property | Current | Target |
|----------|---------|--------|
| Trigger | None | Weekly (same as backtest) |
| Job | None | Compare rolling 30-trade live WR vs OOS expected WR |
| Output | None | Alert if delta > 15pp; suspend signals if delta > 25pp |
| Alert | None | Telegram CRITICAL if > 25pp gap detected |

---

#### G. Data Quality Check — MISSING

| Property | Current | Target |
|----------|---------|--------|
| Trigger | None | Daily (after ingestion, before signal generation) |
| Job | None | `data_quality_check.py`: freshness, coverage, consistency, accuracy |
| Output | None | `observability.quality_report` |
| Alert | None | Telegram if composite_score < 0.7 |

---

### 5.2 Full Automation Schedule (Target)

| Pipeline | Schedule | Compute | Priority |
|----------|---------|---------|---------|
| data_quality_check | Daily 15:30 UTC | GH Actions | HIGH |
| egx_bulletin_ingest | Daily 14:45 UTC | GH Actions | CRITICAL |
| tv_intraday_scrape | Every 15min, 08:00–13:00 UTC session days | GH Actions | HIGH |
| price_cache_updater | Every 30s, 08:00–13:00 UTC session days | GH Actions | HIGH |
| trade_monitor (exit) | Every 30min, 08:00–13:30 UTC session days | GH Actions | CRITICAL |
| signal_generation | Daily 16:00 UTC (after data quality passes) | GH Actions | CRITICAL |
| investor_flows_scrape | Daily 14:00 UTC | GH Actions + Vercel Cron backup | MEDIUM |
| news_scrape | Daily 14:30 UTC | GH Actions | MEDIUM |
| regime_snapshot | Daily 16:30 UTC | GH Actions | MEDIUM |
| performance_analytics | Weekly Sunday 04:00 UTC | GH Actions | HIGH |
| backtest_weekly | Weekly Sunday 02:00 UTC | GH Actions | HIGH |
| model_health_check | Weekly Sunday 05:00 UTC | GH Actions | HIGH |
| fundamentals_sync | Weekly Saturday 12:00 UTC | GH Actions | MEDIUM |
| shariah_sync | Weekly Friday 12:00 UTC | GH Actions | LOW |
| learning_analyze | Weekly Sunday 06:00 UTC | GH Actions | LOW |

---

## SECTION 6 — DATABASE REBUILD PLAN

### 6.1 Schema Problems

| Problem | Evidence | Risk of Migration |
|---------|---------|-------------------|
| Flat public schema — all tables mixed | All migrations write to public.* | LOW — additive (new schemas can be added without destroying existing) |
| `company_fundamentals` single-row (no history) | Phase 21 feature trace | MEDIUM — requires INSERT-ONLY migration; existing row becomes initial snapshot |
| `get_latest_prices()` RPC includes FORBIDDEN source `intraday_consensus` | Migration `20260720220522` | LOW — fix via new migration |
| `companies.notes` stores corporate actions as text | `companies.notes = 'SPLIT_DETECTED:...'` | LOW — additive (new `events.corporate_actions` table) |
| `recommended_trades` conflates Signal + TradePlan + Trade | Phase 21.4 | HIGH — requires careful migration; cannot rewrite 998 rows without audit trail |
| No quality constraints on `market_prices` OHLC fields | No CHECK(high_price >= low_price) etc. | LOW — add constraints via new migration; flag existing violations |

### 6.2 Missing Tables (Target vs Current)

| Target Table | Status | Migration Strategy |
|-------------|--------|-------------------|
| `fundamentals.snapshots` (INSERT-ONLY) | MISSING | New table; seed with one snapshot per company from existing `company_fundamentals` |
| `regimes.snapshots` (INSERT-ONLY) | MISSING | New table; backfill from historical prices post-signal-fix |
| `config.egx_calendar` | MISSING | New table; seed from EGX official 2026 calendar |
| `config.risk_parameters` | MISSING | New table; seed with defaults from target architecture |
| `observability.pipeline_health` | MISSING | New table; immediately useful |
| `observability.quality_reports` | MISSING | New table |
| `observability.data_gaps` | MISSING | New table |
| `compliance.sharia_assessments` | MISSING (current: column on companies) | New INSERT-ONLY table; seed from existing boolean |
| `signals.opportunities` | MISSING | New table — Phase 5 |
| `signals.signals` | MISSING (current: rows in recommended_trades) | New table — Phase 2; recommended_trades becomes legacy |
| `signals.trade_plans` | MISSING (embedded in recommended_trades) | New table — Phase 2 |
| `trades.daily_pnl_snapshots` | MISSING | New table — Phase 3 (required for correct drawdown) |
| `performance.reports` | PARTIAL (performance_reports exists) | Rename/extend |
| `research.backtest_runs` | MISSING | New table — Phase 2 |
| `research.proposed_changes` | MISSING | New table — Phase 6 |

### 6.3 Dangerous Migration Warning

> [!CAUTION]
> **DO NOT** migrate `recommended_trades` to a new schema until the new `signals.*` + `trades.*` schema is fully tested in staging. The 998 rows in `recommended_trades` are the only historical performance record. Any destructive migration must be preceded by a full backup and a read-only shadow period where both the old and new systems run in parallel.

### 6.4 Migration Execution Order

```
Phase 0:
  [1] Fix get_latest_prices() RPC — remove intraday_consensus from priority
  [2] Add config.egx_calendar table (seed from EGX 2026 calendar)
  [3] Add observability.pipeline_health, quality_reports, data_gaps tables

Phase 1:
  [4] Add fundamentals.snapshots (INSERT-ONLY, seed from company_fundamentals)
  [5] Add compliance.sharia_assessments (INSERT-ONLY, seed from companies.is_shariah_compliant)
  [6] Add OHLC quality constraints to market_prices (CHECK constraints, initially as NOT VALID)
  [7] Add events.corporate_actions (migrate from companies.notes text hack)

Phase 2:
  [8] Add signals.signals table (IMMUTABLE after creation)
  [9] Add signals.trade_plans table (IMMUTABLE after active)
  [10] Add research.backtest_runs table

Phase 3:
  [11] Add trades.daily_pnl_snapshots table (for real drawdown calculation)
  [12] Add config.risk_parameters table
  [13] Extend performance.reports with EGX30 TR benchmark and net PnL fields
  [14] Migrate CockroachDB daily_investor_flows to Supabase only

Phase 4+:
  [15] Add regimes.snapshots (INSERT-ONLY)
  [16] Add signals.opportunities table
  [17] Add research.proposed_changes table
```

---

## SECTION 7 — DOMAIN MODEL REBUILD

| Entity | Current Equivalent | Target Entity | Gap | Migration |
|--------|-------------------|--------------|-----|-----------|
| Asset | `companies` table | `canonical.assets` | Missing: data_coverage_pct, shariah_status_date, float_shares, is_sbl_eligible | RENAME + extend columns |
| MarketData | `market_prices` | `canonical.market_data` | Missing: quality_score, flags[], is_adjusted, adjustment_factor, vwap | ADD columns; quality gate on insert |
| FundamentalSnapshot | `company_fundamentals` (single row) | `fundamentals.snapshots` (INSERT-ONLY) | No history; single row = look-ahead bias | NEW INSERT-ONLY table; existing row = seed snapshot |
| RegimeSnapshot | None (ADX as ML feature only) | `regimes.snapshots` (INSERT-ONLY) | Entirely missing | NEW table |
| CatalystEvent | `corporate_events` + `company_news` (partial) | `events.catalyst_events` | Missing: materiality_score, surprise_score, reaction tracking, lifecycle status | EXTEND `corporate_events`; add fields |
| ShariaAssessment | `companies.is_shariah_compliant` (boolean) | `compliance.sharia_assessments` (INSERT-ONLY) | No history; no effective_date | NEW table; seed from column |
| Opportunity | None | `signals.opportunities` | Entirely missing | NEW table |
| Strategy | Implicit in `generate_daily_recommendations.py` | `config.strategies` | No formal versioning; no human gate | NEW table |
| Signal | `recommended_trades` rows (status=active) | `signals.signals` (IMMUTABLE) | Conflated with TradePlan and Trade; mutable | NEW table; recommended_trades becomes legacy |
| TradePlan | Embedded in `recommended_trades` (tp1, tp2, sl — mutable daily) | `signals.trade_plans` (IMMUTABLE) | Levels overwritten daily; costs not included | NEW table |
| Trade | `recommended_trades` rows (status=closed) | `trades.trades` | Missing: gross_pnl_egp, total_costs_egp, net_pnl_egp, exit_engine_version, look_ahead_flagged | EXTEND recommended_trades + migrate |
| Position | None (inferred from active recommended_trades) | `trades.positions` (live view) | No formal position tracking | NEW view or table |
| Performance | `performance_reports` table | `performance.reports` | Non-standard metrics; no EGX30 TR benchmark; LAUNCH_DATE filter | REBUILD `performance_analytics.py`; extend table |
| Attribution | None | `performance.attribution` | Entirely missing | NEW table |
| LearningInput | None | `research.proposed_changes` | Entirely missing | NEW table |

---

## SECTION 8 — SIGNAL ENGINE REBUILD

### 8.1 What Must Be Preserved

| Component | Reason |
|-----------|--------|
| XGBoost v6 model (`model_1d_v6.pkl`) | Despite contamination, it has learned real price-action patterns; preserve as baseline |
| Features 0–14 (price-action indicators) | Confirmed point-in-time: RSI, MACD, EMA distances, ATR, volume ratio, etc. |
| `services/canonical.py` source priority | Well-designed; just not universally enforced |
| 7 exit mechanisms in exit engine | SL/TP1/TP2/trailing/RSI/MACD/EMA20 — valid logic |
| `features_snapshot JSONB` on recommended_trades | Audit trail concept is correct |

### 8.2 What Must Be Rewritten

| Component | Why |
|-----------|-----|
| Feature extraction for training | Must use `FundamentalSnapshot` point-in-time query; add DateGuard to all features |
| `day_of_week` feature | Uses `datetime.now()` for historical bars; must use bar_date instead |
| Model training script | Must enforce point-in-time discipline; remove look-ahead contamination |
| Signal immutability | `generate_daily_recommendations.py` must NEVER update tp1/tp2/sl on active trades |
| SELL signal logic | Remove inverse-BUY logic; SELL = exit engine only |
| Probability boost stack | All boosts must be gated by OOS validation before contributing to final probability |
| Performance calculation | Completely rewrite `performance_analytics.py` |
| Backtest | Completely rewrite to test ML model with point-in-time features |

### 8.3 What Must Be Removed

| Component | Why |
|-----------|-----|
| `ofi_ratio_norm = 0.5` ML feature | Dead constant; contributes zero information |
| 7 constant sentiment features (0.0/0.0/0.0/0.0/0.0/0.0/1.0) | Dead constants |
| Hardcoded screener signals (price-change threshold) | Not ML signals |
| Fabricated win rates (78/72/60) | Misleading |
| `LAUNCH_DATE` filter | Hides performance history |
| Hash-based badge fabrication | Fabricated metadata |
| Vercel exit cron (timing bug) | Replaced by GH Action |
| `signal_guardian.py` (third exit layer, undocumented) | Consolidate to single authoritative exit engine |
| `track_trades_schedule.yml` (explicitly disabled) | Remove cleanly |

### 8.4 What Must Be Isolated (Not Changed Yet)

| Component | Reason to isolate |
|-----------|------------------|
| Wyckoff, ICT/SMC, Elliott boosts | Not yet OOS validated; store but contribute 0.0 |
| Advanced ML strategies | Wait for stable OOS backtest foundation |
| Intraday signal strategy | -5.25% avg PnL; pause intraday signal generation until OOS validation |

### 8.5 AI vs Rules vs Hybrid — Evidence-Based Decision

**Evidence summary (from 998 live trades):**
- ML model (XGBoost, all confidence levels): 28.3% WR, -0.68% avg PnL → **negative expected value**
- Rule-based 3-5 day signals: 76.9% WR, +1.66% avg PnL (n=26, statistically insignificant)
- Daily ML signals: 23.8% WR, +2.02% avg PnL (n=665, WR poor but avg PnL marginal positive)
- Intraday ML signals: 31.6% WR, -5.25% avg PnL (n=253, actively destroying capital)

**Verdict:**
- **ML model should remain** — 15 clean price-action features do capture real patterns; 8 look-ahead features inflate backtest; removing contamination will likely materially improve OOS WR
- **Rule-based layer should be added** — the rule-based `combined_strict` strategy deserves a clean OOS backtest; the 3-5 day result, while small-n, is directionally promising
- **Hybrid approach (recommended):** ML model provides base probability from clean features; rule-based confirmations are formal evidence items (validated OOS before contributing to final probability)
- **Intraday signals: SUSPEND** pending a valid OOS backtest; -5.25% avg PnL with 253 trades is conclusive enough to act on now

---

## SECTION 9 — BACKTESTING FOUNDATION

### 9.1 What Must Exist Before Trusting the Signal Engine

All items below are **hard prerequisites**. Backtesting must not run without all being in place.

| # | Requirement | Current Status | How to Achieve |
|---|-------------|---------------|----------------|
| 1 | Temporal Truth | ❌ MISSING | `fundamentals.snapshots` INSERT-ONLY table; DateGuard on all feature functions |
| 2 | Historical OHLCV Dataset | ✅ PARTIAL | Exists in `market_prices`; must filter to canonical source, exclude forbidden sources, exclude multi-source duplicates |
| 3 | Point-in-Time Features | ❌ BROKEN (8 of 30 features) | Rewrite feature extraction with `as_of_date` parameter |
| 4 | Corporate Action Adjustment | ❌ MISSING | `events.corporate_actions` table; adjust prices pre-event |
| 5 | Transaction Costs | ❌ MISSING | Apply 0.175%+0.009% per side + 0.15% FRA + slippage per trade |
| 6 | Slippage Model | ❌ MISSING | 0.1% large-cap (avg vol > 10M EGP/day); 0.3% small-cap |
| 7 | Liquidity Filter | ❌ MISSING | Exclude stocks with avg daily value < 500k EGP |
| 8 | Survivorship Control | ❌ MISSING | Include all stocks active at each bar_date (requires delisted stock data or at minimum flagging) |
| 9 | Walk-Forward Validation | ❌ MISSING | Min 5 folds, OOS gap >= 6 months per fold |
| 10 | OOS Evaluation | ❌ MISSING | Never evaluate on training data; strict temporal separation |
| 11 | EGX30 TR Benchmark | ❌ MISSING (current benchmark is broken) | Download EGX30 TR from EGX official; store in `performance.benchmark_returns` |
| 12 | Random Baseline | ❌ MISSING | Monte Carlo: 10,000 runs of random entry + same hold period |
| 13 | Monte Carlo | ❌ MISSING | 10,000 random trade orderings; report 5th percentile outcome |
| 14 | DateGuard Enforcement | ❌ MISSING | Automated test: verify no feature references data after bar_date; backtest FAILS if violated |
| 15 | Multi-Source Dedup | ❌ BROKEN | `backtest_signals.py` fetches all sources; must filter to canonical only |

### 9.2 Minimum Dataset for Valid Backtest

```
Requirement:
  - At least 3 years of point-in-time OHLCV data (2022–2026)
  - At least 2 years of fundamental snapshots (quarterly cadence)
  - EGX30 TR benchmark for same period
  - Canonical source only (no mubasher, no intraday_consensus)

Current availability:
  - OHLCV: ~16 days confirmed in DB as of 2026-07-20; historical data may pre-exist
  - Fundamentals history: NONE (single-row per company)
  - EGX30 TR: NONE

Gap: Cannot run a valid backtest until FundamentalSnapshot history exists.
If fundamental history cannot be sourced (EGX filings + Yahoo historical):
  - Run a price-action-only backtest with the 15 temporally clean features
  - Exclude all 8 fundamental features
  - Label backtest clearly: "Fundamental features excluded — insufficient historical data"
```

---

## SECTION 10 — REBUILD ORDER

### Phase 0: Stabilization (Days 1–3)
**Goal:** Eliminate critical security risks and fabricated data. No new features.

| Step | Action | Files | Dependency | Output |
|------|--------|-------|-----------|--------|
| 0.1 | Remove hardcoded service role key | `app/api/investor-flows/route.ts` line 18 | None | Env var `SUPABASE_SERVICE_ROLE_KEY` used |
| 0.2 | Remove CockroachDB URL from .env | `.env`, `.env.local` | None | Secrets only in Vercel / GH Actions |
| 0.3 | Fix Vercel exit cron OR remove from vercel.json | `vercel.json` | None | Exit engine = GH Actions only |
| 0.4 | Return honest UNAVAILABLE for orderbook | `app/api/orderbook/route.ts` | None | { data_availability: "UNAVAILABLE" } |
| 0.5 | Remove fabricated screener win rates | `app/api/screener/route.ts` line 99 | None | null or real signal_stats value |
| 0.6 | Remove screener fake ML signal | `app/api/screener/route.ts` lines 72–83 | None | Show real recommended_trades signal or null |
| 0.7 | Remove LAUNCH_DATE filter | `app/api/trades/route.ts` line 24 | None | All 998 trades visible with model_version label |
| 0.8 | Remove hash-fabricated badges | `app/api/trades/route.ts` lines 361–378 | None | Show only real snapshot values |
| 0.9 | Remove fundamental fabricated defaults | `lib/queries.ts` lines 321–324 | None | null if no data |
| 0.10 | Remove fake "LIVE" indicator | Frontend | None | "Updated Ns ago" counter |

**Acceptance Criteria:** All 10 steps verified. No fabricated data served to users. Credentials verified out of source.  
**Rollback:** Git revert to previous commit. No DB changes in this phase.

---

### Phase 1: Data Foundation (Weeks 1–3)
**Goal:** Reliable canonical daily data with quality gates and gap detection.

**Dependencies:** Phase 0 complete.

| Step | Action | Dependency | Output |
|------|--------|-----------|--------|
| 1.1 | Create `config.egx_calendar` table; seed 2026 EGX calendar | DB access | All schedulers can query EGX trading days |
| 1.2 | Fix `get_latest_prices()` RPC — remove `intraday_consensus` priority | DB migration | Consistent source priority across all routes |
| 1.3 | Create `observability.pipeline_health` table | DB migration | Health tracking infrastructure |
| 1.4 | Implement data quality gate in ingestion pipeline | 1.3 | Quality score per OHLCV bar; bad data flagged |
| 1.5 | Implement gap detector | 1.1, 1.3 | Alerts when EGX trading day has no canonical data |
| 1.6 | Implement source health monitor | 1.3 | Consecutive failure tracking per source |
| 1.7 | Implement Upstash Redis price cache | Redis env vars | Live price updates every 30s |
| 1.8 | Fix intraday source mislabeling | None | `source='yahoo_15m'` where appropriate |
| 1.9 | Implement single canonical price resolver used by all routes | 1.2 | One price per stock per page |
| 1.10 | Create `fundamentals.snapshots` INSERT-ONLY table; seed | DB migration | Bitemporal fundamentals foundation |
| 1.11 | Migrate investor flows from CockroachDB to Supabase-only | DB, `investor-flows/route.ts` | Eliminate second DB |

**Acceptance Criteria (DATA FOUNDATION GATE):**
- >= 95% of EGX trading days in last 90 days have canonical OHLCV
- Quality score >= 0.90 composite for last 30 days
- Zero days where top-50 stocks missing data without alert
- Source health monitor fires correctly on simulated failure
- Redis price cache updates verified within 60s during session
- All routes use single canonical price resolver (no 4-price disagreement)

---

### Phase 2: Data Integrity & Signal Integrity (Weeks 4–7)
**Goal:** Remove look-ahead bias. Make signals immutable. Fix backtest methodology.

**Dependencies:** Phase 1 complete (specifically: `fundamentals.snapshots` must exist).

| Step | Action | Dependency | Output |
|------|--------|-----------|--------|
| 2.1 | Rewrite feature extraction with `as_of_date` parameter + DateGuard | 1.10 | Point-in-time features for all 30 features |
| 2.2 | Remove 8 dead/constant features (7 zeros + ofi_ratio) | 2.1 | Cleaner 22-feature model |
| 2.3 | Fix `day_of_week` feature to use bar_date | 2.1 | Clean temporal feature |
| 2.4 | Retrain model (v7) on point-in-time features | 2.1, 2.2, 2.3 | `models/model_1d_v7.pkl` |
| 2.5 | Create `signals.signals` table (IMMUTABLE) | DB migration | New signal entity |
| 2.6 | Create `signals.trade_plans` table (IMMUTABLE) | DB migration | Separate TradePlan entity |
| 2.7 | Create `research.backtest_runs` table | DB migration | Backtest audit trail |
| 2.8 | Rewrite `generate_daily_recommendations.py` to use new signal/tradeplan schema | 2.4, 2.5, 2.6 | Signals no longer overwritten daily |
| 2.9 | Remove SELL from BUY classifier output | 2.8 | SELL = exit engine only |
| 2.10 | Rewrite backtest to test XGBoost ML model with point-in-time features | 2.1, 2.7 | Valid backtest methodology |
| 2.11 | Implement walk-forward validation (5 folds) | 2.10 | OOS win rate and Sharpe |
| 2.12 | Apply EGX transaction costs in backtest | 2.10 | Realistic net returns |
| 2.13 | Add Monte Carlo baseline (10,000 runs) | 2.10 | True random baseline comparison |
| 2.14 | Run first clean walk-forward; document OOS win rate | 2.11 | Honest baseline OOS performance |
| 2.15 | Suspend intraday signals pending OOS validation | 2.14 | Stop -5.25% avg PnL intraday strategy |

**Acceptance Criteria (SIGNAL INTEGRITY GATE):**
- `backtest_engine.py` DateGuard test passes: zero features reference data after bar_date
- Walk-forward OOS win rate documented and plausible (>= random baseline)
- `signals.signals` rows are never UPDATE'd after creation (enforced by DB trigger)
- No SELL signals generated by BUY classifier inverse
- Model v7 trained exclusively on point-in-time data (training log verified)

---

### Phase 3: Risk & Performance (Weeks 8–11)
**Goal:** Correct performance metrics. Add risk controls.

**Dependencies:** Phase 2 complete.

| Step | Action | Dependency | Output |
|------|--------|-----------|--------|
| 3.1 | Create `config.risk_parameters` table; seed with defaults | DB migration | Risk parameters as config, not hardcode |
| 3.2 | Implement Risk Engine: position sizing, portfolio heat check | 3.1 | Position size computed per signal |
| 3.3 | Implement drawdown halt mechanism | 3.2 | Signal generation suspended if portfolio DD >= 20% |
| 3.4 | Create `trades.daily_pnl_snapshots` table | DB migration | Daily equity curve for real drawdown calculation |
| 3.5 | Add net PnL fields to `recommended_trades` (or trades.trades) | DB migration | `total_costs_egp`, `net_pnl_egp`, `net_pnl_pct` |
| 3.6 | Download EGX30 TR benchmark series; store in DB | External data | Benchmark for performance reporting |
| 3.7 | Rewrite `performance_analytics.py` | 3.4, 3.5, 3.6 | Annualized Sharpe, real drawdown, net PnL |
| 3.8 | Remove LAUNCH_DATE filter from all performance calculations | 3.7 | All historical trades in statistics |
| 3.9 | Add cost attribution to performance report | 3.7 | gross_return, cost_drag, net_return breakdown |

**Acceptance Criteria (RISK & PERFORMANCE GATE):**
- Sharpe ratio: `(annualized_return - 0.27) / annualized_std * sqrt(252)` verified
- Max drawdown: computed from `daily_pnl_snapshots` equity curve, not sequential trades
- Benchmark: EGX30 TR used; alpha computed
- All 998 pre-audit trades in statistics with `model_version` label
- Position sizing prevents > 2% portfolio risk per trade
- Portfolio heat cap prevents > 10% concurrent risk

---

### Phase 4: Observability & Reliability (Weeks 12–14)
**Goal:** Every pipeline monitored; every failure alerts within 5 minutes.

**Dependencies:** Phases 1–3 complete.

| Step | Action | Dependency | Output |
|------|--------|-----------|--------|
| 4.1 | Implement `observability.quality_reports` table and daily quality check | 1.3 | Daily composite quality score |
| 4.2 | Implement admin `/admin/observability` dashboard | 4.1 | Health dashboard |
| 4.3 | Implement model health check (weekly WR vs OOS expected) | 2.14, 3.7 | Suspend signals if gap > 25pp |
| 4.4 | Implement Learning Engine proposal mechanism (human gate) | 4.3 | `research.proposed_changes` table |
| 4.5 | Write operational runbooks for all critical pipelines | All pipelines | Manual fallback documented |
| 4.6 | Eliminate Windows local machine dependency | Phase 1 GH Actions | No SPOF |

---

### Phase 5: Advanced Intelligence (Weeks 15+)
**Goal:** Formal Opportunity Engine, Catalyst Intelligence, Market Regime.

**Dependencies:** Phases 1–4 complete AND OOS win rate acceptable (> random baseline).

| Step | Action |
|------|--------|
| 5.1 | Implement `regimes.snapshots` (INSERT-ONLY; multi-signal regime detection) |
| 5.2 | Implement regime-dependent signal thresholds |
| 5.3 | Implement formal Opportunity Engine (`signals.opportunities`) |
| 5.4 | Implement Catalyst Intelligence pipeline (full lifecycle tracking) |
| 5.5 | Implement dynamic confidence (evidence-updated, not time-decayed) |
| 5.6 | OOS validate individual evidence sources before contributing to probability |
| 5.7 | Train dedicated SELL classifier (separate from BUY) |

---

## SECTION 11 — MVP DEFINITION

### MVP Scope (What Must Be Reliable Before Expanding)

| # | MVP Component | Acceptance Criteria |
|---|---------------|---------------------|
| 1 | Canonical Asset Model | `companies` table complete; no signals on suspended/delisted stocks |
| 2 | Reliable Daily OHLCV | >= 95% coverage; quality gate passes; source labeled accurately |
| 3 | Reliable Intraday (best-effort) | Source labeled accurately; no fabricated data |
| 4 | Data Quality System | Daily quality report; alerts on degradation |
| 5 | EGX Market Calendar | `config.egx_calendar` used by all schedulers |
| 6 | Source Health Monitoring | Consecutive failure tracking; alert at threshold |
| 7 | Basic Price-Action Analysis | Confirmed point-in-time; DateGuard passes |
| 8 | Validated ML Signal (v7) | OOS win rate > random baseline; no look-ahead |
| 9 | Risk Engine | Position sizing; portfolio heat; drawdown halt |
| 10 | Clean Backtest | Walk-forward, point-in-time, with costs, vs random baseline |
| 11 | Honest Performance Report | Annualized Sharpe; EGX30 TR benchmark; net PnL; all trades included |
| 12 | Basic Monitoring | All critical pipelines in `observability.pipeline_health`; Telegram alerts |

### What Is NOT Part of MVP

| Feature | Why Excluded |
|---------|-------------|
| Order book / Level 2 | EGX does not provide public L2 API; no valid data source |
| Intraday trading signals | -5.25% avg PnL proven; suspend until OOS validation shows edge |
| Opportunity Engine | Complex; depends on stable signal engine first |
| Catalyst Intelligence pipeline | Complex; depends on stable data and signal engine |
| Market Regime Engine | Useful but not prerequisite for valid signals |
| Learning Engine | Cannot safely operate without stable backtest |
| SELL classifier | Requires stable BUY classifier first |
| Monte Carlo simulation UI | Backend first; UI can wait |
| Brokerage API integration | Out of scope |
| Alternative data sources | Not needed for MVP edge |
| Advanced ML (LightGBM, neural nets) | XGBoost v7 (clean) must be validated first |

---

## SECTION 12 — PHASED REBUILD ROADMAP

| Phase | Name | Duration | Key Goal | Exit Criterion |
|-------|------|---------|----------|---------------|
| **0** | Stabilization | Days 1–3 | Eliminate security risks + fabricated data | Zero fabricated values served; secrets out of source |
| **1** | Data Foundation | Weeks 1–3 | Reliable canonical data + monitoring | DATA FOUNDATION GATE passes |
| **2** | Signal Integrity | Weeks 4–7 | Point-in-time features + immutable signals + valid backtest | SIGNAL INTEGRITY GATE passes |
| **3** | Risk & Performance | Weeks 8–11 | Real risk controls + honest performance metrics | RISK & PERFORMANCE GATE passes |
| **4** | Observability | Weeks 12–14 | Every pipeline monitored; no silent failures | All pipelines in health dashboard; model health monitored |
| **5** | Intelligence | Weeks 15–20 | Catalyst engine + regime detection + validated boosts | OOS win rate > random baseline for promoted strategy |
| **6** | Research | Weeks 21–24 | Learning engine + automated model proposal | ProposedChange → HumanApproval → ModelVersion cycle working |
| **7** | Paper Trading | Week 25+ | Signal-to-paper-trade cycle with full audit trail | Full audit trail per signal; costs tracked |
| **8** | Production | Week 29+ | Real-money signals with risk controls + monitoring | All acceptance gates passed; drawdown halt tested |
| **9** | Learning | Ongoing | Evidence-based model evolution | At least one model version promoted via governance cycle |

---

## SECTION 13 — TOP 50 TASKS

| Rank | Task | Category | Why | Dependency | Impact | Effort | Priority | Acceptance Test |
|------|------|---------|-----|-----------|--------|--------|---------|----------------|
| 1 | Remove hardcoded service role key | SECURITY | Complete DB compromise risk | None | CRITICAL | 5 min | CRITICAL | `grep -r "eyJhbGci"` returns nothing |
| 2 | Remove CockroachDB URL from .env | SECURITY | Full DB access if repo exposed | None | CRITICAL | 5 min | CRITICAL | .env has no URLs |
| 3 | Fix Vercel exit cron (remove from vercel.json) | ARCHITECTURE | Exit engine never runs via Vercel | None | HIGH | 10 min | CRITICAL | vercel.json has no track-recommended-trades |
| 4 | Remove fabricated order book data | DATA | Users misled by synthetic L2 | None | CRITICAL | 1 hr | CRITICAL | /api/orderbook returns data_availability=UNAVAILABLE |
| 5 | Remove fabricated screener win rates | DATA | 78/72/60 defaults are fictional | None | HIGH | 30 min | CRITICAL | win_rate is null unless real data exists |
| 6 | Remove LAUNCH_DATE trade filter | DATA | 998 trades hidden from performance | None | HIGH | 30 min | CRITICAL | All 998 trades visible in API response |
| 7 | Remove hash-fabricated badges | DATA | Wyckoff/Elliott badges are fictional | None | HIGH | 1 hr | CRITICAL | Badges only shown if snapshot field non-null |
| 8 | Remove fundamental defaults (0.38 D/E etc.) | DATA | Fabricated ratios shown as real | None | HIGH | 30 min | CRITICAL | null returned when no fundamental data |
| 9 | Create config.egx_calendar table | ARCHITECTURE | All schedulers need EGX calendar | DB access | HIGH | 1 day | CRITICAL | Calendar table populated; query returns is_trading_day |
| 10 | Create observability.pipeline_health table | OBSERVABILITY | No monitoring exists | DB access | HIGH | 1 day | CRITICAL | Table exists; pipelines write health records |
| 11 | Fix get_latest_prices() RPC source priority | DATA | intraday_consensus is FORBIDDEN | DB migration | HIGH | 2 hr | HIGH | RPC returns egx_bulletin or tradingview_1d, never intraday_consensus |
| 12 | Implement data quality gate in ingestion | DATA | Bad OHLCV enters undetected | 10, 9 | HIGH | 3 days | HIGH | OHLC constraint violations flagged; quality_score computed |
| 13 | Implement gap detector with alerts | OBSERVABILITY | Silent data gaps undetected | 9, 10 | HIGH | 2 days | HIGH | Alert fires when top-50 stock missing for EGX trading day |
| 14 | Create fundamentals.snapshots INSERT-ONLY table | DATA | Look-ahead bias elimination | DB migration | CRITICAL | 2 days | CRITICAL | Table created; existing row migrated as seed snapshot |
| 15 | Rewrite feature extraction with as_of_date | QUANT | 8 of 30 features are look-ahead | 14 | CRITICAL | 1 week | CRITICAL | DateGuard test passes; no feature uses post-bar data |
| 16 | Remove 8 dead/constant ML features | QUANT | Dead features waste model capacity | 15 | HIGH | 1 day | HIGH | Feature count reduced; constants removed |
| 17 | Retrain model (v7) on clean data | QUANT | Current model is look-ahead contaminated | 15, 16 | CRITICAL | 3 days | CRITICAL | model_v7_metadata.json documents clean training |
| 18 | Create signals.signals table (IMMUTABLE) | ARCHITECTURE | Signal overwrite destroys audit trail | DB migration | HIGH | 2 days | HIGH | DB trigger prevents UPDATE on signals table |
| 19 | Rewrite generate_daily_recommendations.py | ARCHITECTURE | Creates immutable signals, no tp/sl overwrite | 17, 18 | CRITICAL | 1 week | CRITICAL | Active signals never have tp1/tp2/sl updated |
| 20 | Remove SELL from BUY classifier | QUANT | Inverse-BUY ≠ SELL signal | 19 | HIGH | 1 day | HIGH | No SELL signals generated by signal engine |
| 21 | Suspend intraday signals | QUANT | -5.25% avg PnL proven | 19 | HIGH | 1 hr | CRITICAL | No intraday signals until OOS validation passes |
| 22 | Rewrite backtest to test XGBoost model | BACKTEST | Current backtest tests wrong strategy | 15 | CRITICAL | 1 week | CRITICAL | Backtest uses model.predict_proba(); source filter applied |
| 23 | Implement walk-forward validation | BACKTEST | No OOS evaluation exists | 22 | CRITICAL | 1 week | CRITICAL | 5 folds with OOS gap; results documented |
| 24 | Apply EGX transaction costs in backtest | BACKTEST | Costs not modeled | 22 | HIGH | 1 day | HIGH | 0.72% RT cost applied per simulated trade |
| 25 | Add Monte Carlo random baseline | BACKTEST | No random baseline for comparison | 22 | HIGH | 2 days | HIGH | Strategy beats random + EGX30 TR + T-bill |
| 26 | Run first clean walk-forward; document OOS WR | BACKTEST | Establish honest baseline | 23 | CRITICAL | 1 day | CRITICAL | Documented OOS WR; honest comparison to live WR |
| 27 | Create signals.trade_plans table (IMMUTABLE) | ARCHITECTURE | TradePlan separate from Signal | DB migration | HIGH | 2 days | HIGH | ATR-based levels frozen at creation; never updated |
| 28 | Implement Risk Engine: position sizing | RISK | No position sizing exists | 27 | CRITICAL | 1 week | CRITICAL | position_size_egp computed per signal; max_risk_per_trade enforced |
| 29 | Implement portfolio heat check | RISK | Unlimited concurrent signals | 28 | CRITICAL | 2 days | CRITICAL | New signals blocked if total_open_risk >= 10% |
| 30 | Implement drawdown halt | RISK | No halt if portfolio in deep drawdown | 28, 29 | CRITICAL | 2 days | CRITICAL | Signal generation suspends at DD >= 20% |
| 31 | Add EGX transaction costs to PnL | DATA | No costs in current PnL | DB migration | HIGH | 1 day | HIGH | net_pnl_egp field populated on all new trades |
| 32 | Create trades.daily_pnl_snapshots table | DATA | No equity curve for real drawdown | DB migration | HIGH | 2 days | HIGH | Daily equity curve computed; max drawdown correct |
| 33 | Download EGX30 TR benchmark | DATA | Benchmark is broken/meaningless | External | HIGH | 2 days | HIGH | EGX30 TR series stored; alpha computable |
| 34 | Rewrite performance_analytics.py | QUANT | Every metric is incorrect | 31, 32, 33 | CRITICAL | 1 week | CRITICAL | Annualized Sharpe; EGX30 TR benchmark; net PnL |
| 35 | Implement Redis price cache | ARCHITECTURE | SSE streaming broken | Upstash env vars | HIGH | 3 days | HIGH | Frontend shows "Updated Ns ago" with real data |
| 36 | Implement single canonical price resolver | ARCHITECTURE | 4 different prices per stock | 11 | HIGH | 2 days | HIGH | All routes return same price for same stock |
| 37 | Implement source health monitor | OBSERVABILITY | Silent source failures | 10 | HIGH | 2 days | HIGH | Consecutive failure tracking; alert at threshold |
| 38 | Migrate investor flows to Supabase-only | ARCHITECTURE | CockroachDB dual-DB unnecessary | DB, route changes | MEDIUM | 3 days | HIGH | /api/investor-flows reads Supabase only |
| 39 | Implement admin observability dashboard | OBSERVABILITY | No health visibility | 10, 37 | MEDIUM | 1 week | HIGH | /admin/observability shows all pipeline health |
| 40 | Implement model health check | OBSERVABILITY | Model drift undetected | 26, 34 | HIGH | 2 days | HIGH | Alert if rolling WR vs OOS WR delta > 25pp |
| 41 | Fix intraday source mislabeling | DATA | Yahoo labeled as tradingview | None | MEDIUM | 1 day | MEDIUM | source='yahoo_15m' accurate in DB and API response |
| 42 | Add response metadata format to all APIs | ARCHITECTURE | No universal response format | None | MEDIUM | 1 week | MEDIUM | All routes return { data, meta: { source, freshness_at } } |
| 43 | Consolidate exit engine to single Python canonical | ARCHITECTURE | 3 exit engines (TS + 2 Python) | 3 | HIGH | 1 week | HIGH | Single trade_monitor.py handles all 7 exit mechanisms |
| 44 | Implement EGX calendar-aware schedulers | ARCHITECTURE | Hardcoded UTC offsets everywhere | 9 | MEDIUM | 1 week | MEDIUM | All crons query egx_calendar; no hardcoded offsets |
| 45 | Eliminate Windows Task Scheduler dependency | ARCHITECTURE | SPOF | Phase 1 GH Actions | HIGH | 1 day | HIGH | run_daily.bat not referenced in production |
| 46 | Add quality constraints to market_prices | DATA | No OHLC validity constraints in DB | DB migration | MEDIUM | 1 day | MEDIUM | CHECK(high >= low), CHECK(volume >= 0) etc. |
| 47 | Create compliance.sharia_assessments INSERT-ONLY | DATA | Sharia status has no history | DB migration | LOW | 1 day | LOW | Table created; existing boolean migrated |
| 48 | Fix benchmark calculation in performance_analytics | QUANT | Current benchmark is meaningless | 33 | HIGH | 2 hr | HIGH | EGX30 TR used; existing broken calculation removed |
| 49 | Remove signal_guardian.py (undocumented third exit layer) | ARCHITECTURE | 3 exit layers cause confusion | 43 | MEDIUM | 1 hr | MEDIUM | signal_guardian.py removed or clearly documented as deprecated |
| 50 | Implement Learning Engine human gate | RISK | No governance on model changes | 26, 40 | MEDIUM | 2 weeks | MEDIUM | research.proposed_changes requires admin approval before any change |

---

## SECTION 14 — REBUILD DEPENDENCY GRAPH

```
CRITICAL PATH (must be sequential):

[1] Security fix (0.1, 0.2)
    ↓
[2] Fabrication removal (0.3–0.10) ← parallelizable
    ↓
[3] EGX Calendar + Observability foundation (1.1, 1.3)
    ↓
[4] Data quality gate + gap detector (1.4, 1.5)  ← parallelizable
[4] Fix RPC source priority (1.2)                ← parallelizable
[4] Redis price cache (1.7)                       ← parallelizable
    ↓
[5] fundamentals.snapshots table (1.10)
    ↓  [HARD GATE — cannot proceed without this]
[6] Rewrite feature extraction with DateGuard (2.1)
    ↓
[7] Remove dead features + fix day_of_week (2.2, 2.3) ← parallelizable
    ↓
[8] Retrain model v7 (2.4)
    ↓
[9] Create signals.signals + signals.trade_plans tables (2.5, 2.6) ← parallelizable
    ↓
[10] Rewrite signal generator (2.8)
     ↓
[11] Remove SELL logic; suspend intraday (2.9, 2.15) ← parallelizable
[11] Rewrite backtest for ML model (2.10)              ← parallelizable
     ↓
[12] Walk-forward validation (2.11)
     ↓
[13] Apply costs in backtest (2.12) + Monte Carlo baseline (2.13) ← parallelizable
     ↓
[14] Run first clean walk-forward; document results (2.14) ← HARD GATE
     ↓
[15] Risk Engine: position sizing + portfolio heat (3.1, 3.2, 3.3) ← sequential
     ↓
[16] daily_pnl_snapshots + EGX30 TR benchmark (3.4, 3.6) ← parallelizable
     ↓
[17] Rewrite performance_analytics.py (3.7, 3.8, 3.9)
     ↓
[18] Observability dashboard + model health check (4.1–4.4) ← parallelizable
     ↓
[19] Phase 5 Intelligence (can begin in parallel with Phase 4)


PARALLELIZABLE TRACKS (can run simultaneously after their dependencies):

Track A: Data pipeline (1.4, 1.5, 1.6, 1.8, 1.9) → feeds backtest quality
Track B: Redis price cache (1.7) → feeds frontend price display
Track C: CockroachDB migration (1.11) → reduces infrastructure complexity
Track D: Backtest infrastructure (2.10 onward) → critical for OOS validation

CRITICAL PATH ITEMS (no parallelism possible):
  fundamentals.snapshots → DateGuard → model_v7 → signal generator
  → walk-forward → risk engine → performance analytics

ESTIMATED MINIMUM DURATION (single developer, full focus):
  Phase 0: 3 days
  Phase 1: 3 weeks
  Phase 2: 4 weeks
  Phase 3: 4 weeks
  Phase 4: 3 weeks
  → Total to MVP + Monitoring: approximately 14–16 weeks
```

---

## SECTION 15 — TESTING STRATEGY

### 15.1 Data Tests

```python
# Source tests
test_egx_bulletin_returns_valid_response()
test_tradingview_scanner_returns_all_egx_stocks()
test_yahoo_finance_v8_returns_ohlcv()
test_forbidden_sources_never_written_to_canonical()

# Schema tests
test_market_prices_has_quality_score_column()
test_fundamentals_snapshots_has_no_update_trigger()  # INSERT-ONLY
test_signals_signals_has_update_prevention_trigger()  # IMMUTABLE

# Freshness tests
test_canonical_data_has_todays_prices_after_ingestion()
test_data_gap_detected_when_egx_trading_day_missing()

# Completeness tests
test_all_active_egx_stocks_have_canonical_price()
test_coverage_pct_above_95_for_last_30_days()

# Duplicate tests
test_no_duplicate_rows_for_same_asset_date_source()
test_canonical_returns_one_row_per_asset_per_date()

# OHLC validity tests
test_high_gte_max_open_close()
test_low_lte_min_open_close()
test_high_gte_low()
test_close_positive()
test_volume_non_negative()

# Symbol mapping tests
test_egx_symbol_maps_to_company_id()
test_no_orphan_prices_without_company()
```

---

### 15.2 API Tests

```typescript
// Contract tests
test_canonical_price_returns_source_and_freshness_at()
test_orderbook_returns_data_availability_unavailable()
test_screener_win_rate_is_null_when_no_real_data()
test_trades_all_998_visible_without_launch_date_filter()
test_intraday_source_label_is_accurate()

// Integration tests
test_daily_ingestion_populates_canonical_price()
test_signal_generation_creates_immutable_signal()
test_exit_engine_closes_trade_at_stop_loss()

// Error handling
test_api_returns_null_not_fabricated_default_when_data_missing()
test_api_returns_freshness_warning_when_data_stale()
test_api_503_when_supabase_unavailable_not_500()
```

---

### 15.3 Frontend Tests

```typescript
// Chart freshness
test_chart_shows_staleness_warning_when_freshness_at_old()
test_price_display_shows_updated_at_timestamp()
test_no_live_indicator_shown_when_redis_ttl_expired()

// Stale data
test_chart_shows_last_valid_date_not_weekend_date()
test_intraday_shows_source_label_per_segment()

// Loading/failure states
test_orderbook_shows_unavailable_message_not_synthetic_data()
test_screener_shows_null_win_rate_not_78()
test_trade_badges_hidden_when_snapshot_field_is_null()
```

---

### 15.4 Quantitative Tests

```python
# Unit tests
test_rsi_14_equals_known_reference_value()
test_macd_histogram_equals_macd_line_minus_signal_line()  # v4+ fix
test_atr_14_equals_known_reference_value()

# DateGuard / look-ahead tests
def test_no_feature_uses_post_bar_data():
    for feature_fn in ALL_FEATURE_FUNCTIONS:
        result = feature_fn(candles[:100], as_of_date=candles[99]['date'])
        # Verify feature does not access candles[100:]
        # DateGuard should raise if any post-bar data accessed

# Backtest tests
test_backtest_fails_if_look_ahead_detected()
test_backtest_applies_egx_transaction_costs()
test_backtest_oos_win_rate_documented_before_production_promotion()

# Walk-forward tests
test_walk_forward_has_minimum_5_folds()
test_each_fold_oos_gap_at_least_6_months()
test_walk_forward_result_exceeds_random_baseline()

# Leakage tests (critical)
test_model_trained_only_on_dates_before_test_fold()
test_fundamentals_query_uses_effective_date_lte_bar_date()
test_sharia_status_query_uses_effective_date_lte_bar_date()

# Random baseline
test_random_baseline_oos_win_rate_approximately_50pct()
test_strategy_oos_win_rate_exceeds_random_baseline()
```

---

### 15.5 Automation Tests

```yaml
# Job execution
- test: egx_bulletin_ingestion completes within 10 minutes
  validation: pipeline_health.status = 'HEALTHY' after run

# Retry tests
- test: if source fails once, retry fires within 5 minutes
  validation: consecutive_failures increments; retries observed in logs

# Alert tests
- test: if consecutive_failures >= 2, Telegram alert fires
  validation: test Telegram bot receives message with pipeline_id

# Recovery tests
- test: after source recovers, pipeline_health.status returns to HEALTHY
  validation: consecutive_failures reset to 0 on success

# Session gate tests
- test: exit engine does not run when EGX calendar.is_trading_day = false
  validation: trade_monitor.py logs "skipping — not a trading day"
```

---

## SECTION 16 — ACCEPTANCE GATES

### DATA FOUNDATION GATE (before Phase 2 starts)

```
✓ >= 95% of EGX active stocks have canonical OHLCV for all trading days in last 90d
✓ Daily quality composite score >= 0.90 for last 30 consecutive trading days
✓ Zero top-50 data gaps in last 30 trading days without a triggered alert
✓ Source health monitor fires correctly on simulated 2-consecutive-failure scenario
✓ Redis price cache updates verified < 60s during market session
✓ All API routes return identical price for same stock (single canonical resolver)
✓ get_latest_prices() RPC verified: never returns intraday_consensus as price
✓ Intraday source labels accurate (no Yahoo data labeled as tradingview)
✓ fundamentals.snapshots table exists with one snapshot per company
```

### SIGNAL INTEGRITY GATE (before Phase 3 starts)

```
✓ DateGuard test passes: zero features reference data after bar_date
✓ All 8 look-ahead features confirmed replaced with point-in-time equivalents
✓ Model v7 training log documents: only historical data used per bar
✓ signals.signals table confirmed: no UPDATE statements succeed after status=ACTIVE
✓ No SELL signals generated by BUY classifier
✓ Intraday signal generation suspended (confirmed by observing zero intraday signals)
✓ Backtest uses model.predict_proba() (not rule-based RSI/MACD strategy)
✓ Backtest source filter confirmed: only canonical sources used
✓ Walk-forward: >= 5 folds with OOS gap >= 6 months each
✓ OOS win rate documented and >= random baseline (>= 33% threshold recommended)
✓ EGX transaction costs applied in backtest
✓ Monte Carlo 10,000 runs confirms strategy beats random at 5th percentile
```

### RISK & PERFORMANCE GATE (before Phase 4 starts)

```
✓ Position sizing: max_risk_per_trade = 2% verified for last 10 signals
✓ Portfolio heat: no new signals generated when open_risk >= 10% portfolio (tested)
✓ Drawdown halt: signal generation suspended when DD >= 20% (tested in staging)
✓ net_pnl_egp field populated on all new trades; EGX costs applied
✓ daily_pnl_snapshots equity curve produces correct max_drawdown
✓ Sharpe ratio formula: (annualized_return - 0.27) / annualized_std * sqrt(252)
✓ EGX30 TR benchmark stored and alpha computable
✓ All 998 historical trades visible with model_version label
✓ Cost attribution shows gross_return, cost_drag, net_return breakdown
```

### SIGNAL PRODUCTION GATE (before real-money signals)

```
✓ All gates above passed
✓ Model v7 OOS win rate > random baseline for >= 6 months of OOS data
✓ Model health check running weekly; no suspension triggered in last 4 weeks
✓ Every pipeline in observability.pipeline_health; zero UNKNOWN status
✓ Admin runbooks written and tested for all critical failure scenarios
✓ LAUNCH_DATE filter permanently removed (confirmed by code review)
✓ Security audit: zero credentials in source code (grep verified)
✓ Paper trading run for minimum 4 weeks with full audit trail
✓ Drawdown halt tested live (paper trade)
✓ Human approval gate working for model changes (at least one complete cycle)
```

---

## SECTION 17 — WHAT NOT TO BUILD YET

| Feature | Reason to Delay |
|---------|----------------|
| Order book / Level 2 data | No public EGX L2 API. No valid data source. Build only if a licensed data vendor is contracted. |
| Intraday trading signals | -5.25% avg PnL on 253 live trades. Proven negative EV. Suspend until OOS backtest shows edge. |
| Advanced ML (LightGBM, neural nets, ensemble) | XGBoost v7 (clean) must be OOS-validated first. Adding model complexity before foundations are stable is premature. |
| Opportunity Engine | Requires stable signal engine and catalyst pipeline. Not needed for MVP. |
| Dedicated SELL/Short classifier | Requires valid BUY classifier first. Short selling also restricted on EGX. |
| Learning Engine (automated model evolution) | Cannot safely operate without stable backtest and model health check infrastructure. |
| Brokerage API integration | No confirmed EGX broker with usable API in scope. Out of scope for current phase. |
| Alternative data (social sentiment, satellite) | No evidence base for EGX value. Requires valid baseline model first. |
| Real-time WebSocket feed | No real EGX real-time data source. Redis 30s cache is sufficient and honest. |
| Factor model / portfolio optimization | Risk Engine (Phase 3) is prerequisite. |
| Cairo office / multi-tenant deployment | Infrastructure complexity; not warranted at current scale. |

---

## SECTION 18 — MIGRATION STRATEGY

| Component | Strategy | Rationale |
|-----------|---------|-----------|
| `companies` table | **KEEP + EXTEND** | Valid asset registry; add missing columns |
| `market_prices` table | **KEEP + ADD QUALITY GATE** | Core data; schema is fine; need quality constraints |
| `company_fundamentals` | **WRAP → MIGRATE** | Keep existing row; create `fundamentals.snapshots` as INSERT-ONLY table; existing row = first snapshot |
| `recommended_trades` | **WRAP + DEPRECATE** | Keep as legacy; new signals write to `signals.signals` + `signals.trade_plans`; old trades migrated with `look_ahead_flagged=true` |
| `company_news` | **KEEP + EXTEND** | Add materiality scoring fields |
| `corporate_events` | **KEEP + EXTEND** | Add CatalystEvent lifecycle fields |
| `signal_stats` | **DEPRECATE** | Win rates based on buggy MACD formula; replace with `research.backtest_runs` |
| `performance_reports` | **REWRITE** | Every metric is incorrect; rebuild from scratch |
| `intraday_snapshots` | **KEEP + FIX LABELS** | Data is real; fix mislabeled source column |
| `orderbook_snapshots` | **KEEP (EMPTY is OK)** | Table schema is fine; no synthetic data should be returned from API |
| CockroachDB | **MIGRATE → REMOVE** | All investor flows migrate to Supabase; CockroachDB decommissioned |
| `livePriceStore.ts` | **REPLACE** | Replace with Upstash Redis |
| `track_trades.py` + `signal_guardian.py` | **DEPRECATE** | Consolidate to single `trade_monitor.py` |
| `backtest_signals.py` | **DEPRECATE (partially)** | Rule-based test valid as one strategy; but ML model needs separate backtest |
| Vercel exit cron | **REMOVE** | Always skipped; GH Action is the actual mechanism |
| Windows `run_daily.bat` | **DEPRECATE** | Remove all production dependencies; keep only as developer convenience |
| `train_model_v6.py` | **REWRITE as train_model_v7.py** | Fundamental architecture change; v6 training is look-ahead contaminated |
| `performance_analytics.py` | **REWRITE** | Every metric is non-standard or incorrect |

---

## SECTION 19 — RISK REGISTER

| Risk | Probability | Impact | Mitigation | Owner |
|------|------------|--------|-----------|-------|
| R01: Service role key exploited before fix | HIGH (key is in source now) | CRITICAL | Fix within hours; rotate key immediately after | Developer |
| R02: EGX website changes PDF format | MEDIUM | HIGH — bulletin ingestion fails | TV fallback; alert on failure; build EGX scraper test | Developer |
| R03: TradingView blocks scanner endpoint | MEDIUM | HIGH — live prices unavailable | DB fallback; Yahoo fallback; Upstash Redis cache buys 60s | Developer |
| R04: Schema migration breaks production | LOW-MEDIUM | HIGH — downtime | Non-destructive migrations only; shadow period for new schema; rollback plan | Developer |
| R05: Stale data served after ingestion failure | HIGH | MEDIUM — user trust | Gap detector + Telegram alert; staleness label in UI | Developer |
| R06: Signal engine generates bad signals post-v7 | MEDIUM | HIGH — user trades on bad signals | Model health check; suspend if WR delta > 25pp; paper trading first | Developer |
| R07: Walk-forward backtest contaminated | MEDIUM | CRITICAL — false confidence | DateGuard automated test must pass before promotion | Developer |
| R08: Look-ahead bias discovered in v7 | LOW (after DateGuard) | CRITICAL | DateGuard enforcement is automated; all tests must pass | Developer |
| R09: Automation failure (GH Action down) | LOW | HIGH — missed exits | Telegram alert on failure; runbook documented; manual override possible | Developer |
| R10: Yahoo Finance v8 endpoint changes | MEDIUM | MEDIUM — intraday fallback broken | Monitor 4xx rates; alert if > 3 consecutive failures | Developer |
| R11: Supabase unavailable | LOW | CRITICAL — all pipelines fail | Retry with backoff; Telegram immediate alert; runbook for manual operation | Developer |
| R12: Upstash Redis unavailable | LOW | MEDIUM — price cache miss | Fall back to DB read for price; no fabrication | Developer |
| R13: Model drift undetected | LOW (after health check) | HIGH — signals become low quality | Weekly WR comparison; suspend at 25pp gap | Developer |
| R14: Race condition: two exit engines run simultaneously | LOW (after consolidation) | MEDIUM — conflicting exits | Consolidate to single trade_monitor.py; database-level idempotency key | Developer |
| R15: EGX calendar not maintained | MEDIUM (annual risk) | MEDIUM — wrong session gates | Annual review reminder; alert if calendar has no future dates within 30 days | Developer |
| R16: Corporate action not detected | MEDIUM | MEDIUM — backtest returns wrong | Price anomaly detector; EGX disclosure cross-check | Developer |
| R17: Look-ahead bias in FundamentalSnapshot seed | LOW | HIGH — first snapshot date matters | Seed snapshot effective_date = earliest known date for each company | Developer |
| R18: EGX30 TR benchmark unavailable | MEDIUM | MEDIUM — benchmark calculation fails | Use EGX30 index level (non-TR) as fallback; label clearly as "excludes dividends" | Developer |

---

## SECTION 20 — FINAL ORDERED REBUILD PLAN

```
STEP 1: Security (Day 1)
  Goal: Eliminate immediate security risks
  Files: app/api/investor-flows/route.ts (line 18), .env, .env.local
  Dependencies: None
  Output: Service role key in env var; CockroachDB URL not in .env
  Validation: grep -r "eyJhbGci" returns nothing in source code
  Rollback: git revert

STEP 2: Data Fabrication Removal (Days 2–3)
  Goal: Eliminate all fabricated data served to users
  Files: orderbook/route.ts, screener/route.ts, trades/route.ts, lib/queries.ts
  Dependencies: None
  Output: null or UNAVAILABLE where fabricated data was; real data or null
  Validation: Each route tested; no hardcoded win rates or badge hashes
  Rollback: git revert

STEP 3: Exit Engine Fix (Day 3)
  Goal: Remove broken Vercel cron; confirm GH Action is canonical exit engine
  Files: vercel.json, .github/workflows/trade-monitor.yml
  Dependencies: None
  Output: No track-recommended-trades in vercel.json; trade-monitor.yml handles all exits
  Validation: vercel.json updated; trade-monitor.yml covers all 7 exit mechanisms
  Rollback: Add cron back to vercel.json (it was skipped anyway — no harm)

STEP 4: EGX Calendar + Observability Foundation (Week 1)
  Goal: Create monitoring infrastructure
  Files: New migrations, new GH Action step
  Dependencies: DB access
  Output: config.egx_calendar, observability.pipeline_health tables
  Validation: Calendar has all 2026 trading days; pipelines write health records
  Rollback: Drop new tables (no existing data affected)

STEP 5: Data Quality Gate + Source Health Monitor (Week 1–2)
  Goal: Detect and alert on data problems
  Files: main.py (add quality gate step), new data_quality_check.py
  Dependencies: Step 4
  Output: Quality score per OHLCV bar; daily alert if quality degrades
  Validation: Simulate bad OHLCV; verify it is flagged; alert fires
  Rollback: Remove quality gate step from pipeline (data ingestion unaffected)

STEP 6: Fix get_latest_prices() RPC + Canonical Price Resolver (Week 2)
  Goal: Single price per stock, consistently
  Files: New migration for RPC, new shared function used by all routes
  Dependencies: Step 4 (calendar available)
  Output: No intraday_consensus in RPC priority; all routes use canonical resolver
  Validation: Same stock returns same price from all API routes
  Rollback: Previous RPC version via migration rollback

STEP 7: Redis Price Cache (Week 2)
  Goal: Replace broken SSE with working price cache
  Files: New price_cache_updater.py, new /api/price/{symbol} route, frontend polling
  Dependencies: Upstash Redis env vars
  Output: Frontend shows "Updated Ns ago" with real data
  Validation: Price updates within 60s during session; confirmed with network log
  Rollback: Remove price_cache_updater.py; frontend reverts to DB price (still works)

STEP 8: fundamentals.snapshots (Week 3)
  Goal: Create bitemporal fundamentals — the gating prerequisite for clean backtest
  Files: New migration, new seeding script
  Dependencies: Steps 4–6
  Output: INSERT-ONLY table with effective_date; existing row migrated as first snapshot
  Validation: Point-in-time query returns correct snapshot for historical dates
  Rollback: Drop new table (company_fundamentals unchanged)

STEP 9: DateGuard + Feature Rewrite (Week 4–5)
  Goal: Eliminate look-ahead bias from all 30 features
  Files: generate_daily_recommendations.py, train_model_v7.py (new)
  Dependencies: Step 8 (fundamentals.snapshots must exist)
  Output: DateGuard test passes; all features use as_of_date parameter
  Validation: Automated DateGuard test run; zero look-ahead violations
  Rollback: Feature rewrite is additive; model v6 still available as fallback

STEP 10: Model v7 Training + Validation (Week 5–6)
  Goal: Train clean model on point-in-time data
  Files: train_model_v7.py, models/model_1d_v7.pkl
  Dependencies: Step 9
  Output: model_v7_metadata.json documents clean training
  Validation: In-sample fit reasonable; feature importance plausible; no constants
  Rollback: Use model_v6 (still available)

STEP 11: Immutable Signals Schema + Generator Rewrite (Week 6–7)
  Goal: Stop daily TP/SL overwrite; create immutable signal/tradeplan entities
  Files: New migrations, generate_daily_recommendations.py rewrite
  Dependencies: Steps 9, 10
  Output: signals.signals table; signals never updated after creation
  Validation: DB trigger prevents UPDATE on signals table (verified)
  Rollback: recommended_trades still exists; can revert to old generator if needed

STEP 12: Backtest Rebuild + Walk-Forward (Week 7–9)
  Goal: Valid OOS evaluation of XGBoost ML model
  Files: backtest_engine.py (rewrite), validate_backtest.py, research.backtest_runs
  Dependencies: Steps 8, 9
  Output: 5-fold walk-forward with OOS results; random baseline; costs applied
  Validation: DateGuard test passes; walk-forward results documented
  Rollback: Old backtest_signals.py still available for rule-based strategy

STEP 13: Risk Engine (Week 9–11)
  Goal: Position sizing, portfolio heat, drawdown halt
  Files: New risk_engine.py, config.risk_parameters migration
  Dependencies: Steps 11, 12
  Output: Position size computed per signal; portfolio heat capped; drawdown halt works
  Validation: Staged test: create 6 simultaneous signals; 7th blocked by heat cap
  Rollback: Remove risk engine check; revert to old signal generator

STEP 14: Performance Analytics Rebuild (Week 11–12)
  Goal: Honest, standard performance metrics
  Files: performance_analytics.py (rewrite), trades.daily_pnl_snapshots migration
  Dependencies: Steps 12, 13; EGX30 TR downloaded
  Output: Annualized Sharpe; EGX30 TR benchmark; net PnL; all trades visible
  Validation: Sharpe formula verified against reference calculation; drawdown verified
  Rollback: Old performance_analytics.py still available; no DB changes are destructive

STEP 15: Observability Dashboard + Model Health (Week 13–14)
  Goal: Full pipeline visibility; model drift detection
  Files: /admin/observability page, model_health_check.py
  Dependencies: Steps 4–14
  Output: Dashboard shows all pipeline health; alert if model WR delta > 25pp
  Validation: Simulate pipeline failure; confirm alert fires within 5 minutes
  Rollback: Dashboard is additive; remove if issues

STEP 16: CockroachDB Migration (Week 14)
  Goal: Eliminate second database
  Files: investor-flows/route.ts, cockroach_sync.py (retire)
  Dependencies: investor flows confirmed in Supabase
  Output: /api/investor-flows reads Supabase only; CockroachDB decommissioned
  Validation: investor-flows API returns data; CockroachDB connection removed
  Rollback: Re-enable CockroachDB connection

STEP 17+: Phase 5 Intelligence (Weeks 15+)
  Only begin after all gates from Steps 1–16 are confirmed passed.
  See Section 12 Phase 5 for detailed task list.
```

---

## SECTION 21 — FINAL VERDICT

### 1. Is Tradeora EGX worth rebuilding?

**YES.** The platform has a solid structural foundation: Supabase is well-configured, 40 API routes work for read operations, the bilingual UI (Arabic/English) is complete, GH Actions infrastructure handles 15 workflows, real EGX data sources (bulletin, investor flows, news) are wired and working, and the XGBoost signal engine produces daily output. The problems are fixable without a ground-up rewrite — they are principally bugs, misconfigurations, missing tables, and one critical architectural mistake (look-ahead bias in training data).

### 2. What percentage can realistically be reused?

**~65–70%** of the codebase is reusable without major changes:
- All frontend UI pages (Arabic/English localization, charts, navigation)
- ~30 of 40 API routes (the 6–10 with fabricated data need fixes, not rewrites)
- GH Actions infrastructure (15 workflows; most schedule correctly)
- Data ingestion pipelines (EGX bulletin, TV scraper, Yahoo, investor flows, news)
- 15 of 30 ML features (temporally clean price-action indicators)
- Services/canonical.py (well-designed; just not universally enforced)
- Authentication, push notifications, Telegram alerts

### 3. What must be rewritten?

- `performance_analytics.py` — every metric is incorrect
- `train_model_v7.py` — complete rewrite of feature extraction with DateGuard
- `backtest_engine.py` — must test XGBoost model, not rule-based; must apply costs + walk-forward
- `generate_daily_recommendations.py` — signal immutability + point-in-time feature extraction

### 4. What must be fixed first?

1. Hardcoded service role key (security — hours)
2. Order book fabrication (legal/trust — hours)
3. Exit cron timing bug (functionality — 10 minutes)
4. Screener fabricated win rates + signals (trust — 30 minutes)
5. Performance LAUNCH_DATE filter (transparency — 30 minutes)

### 5. What must NOT be touched yet?

- The XGBoost model training process (until DateGuard and FundamentalSnapshot are ready)
- The ML feature set (until all 8 look-ahead features have been replaced)
- Intraday signals (proven negative EV; suspend until OOS validates edge)
- advanced Opportunity/Catalyst/Regime engines (Phase 5 — after foundations are stable)
- Learning engine (Phase 6 — cannot govern what cannot be trusted)

### 6. What is the critical path?

```
Security fix
  → fundamentals.snapshots (INSERT-ONLY bitemporal)
  → DateGuard + feature rewrite
  → Model v7 retraining
  → Immutable signal schema
  → Walk-forward backtest validation
  → Risk Engine
  → Performance Analytics rebuild
  → Model Health Check
  → Paper Trading
  → Production gate
```

### 7. What is the earliest point where valid backtesting becomes possible?

**After Step 12 in the rebuild plan** (approximately Week 7–9): after `fundamentals.snapshots` is created and seeded with historical data, DateGuard is implemented, model v7 is trained, and the backtest engine is rewritten to test the ML model with point-in-time features, EGX transaction costs, and walk-forward validation.

**Prerequisite challenge:** `fundamentals.snapshots` requires historical quarterly fundamental data. If EGX filing history is not available, the backtest must exclude fundamental features — which removes 8 of the 30 model features. A price-action-only backtest (15 clean features) is achievable earlier.

**Price-action-only backtest:** Available Week 5 (after feature rewrite only).  
**Full featured backtest with fundamentals:** Available Week 8+ (after historical fundamental data sourced and loaded).

### 8. What is the earliest point where paper trading becomes possible?

**After Step 11** (Week 6–7): once immutable signals are generated by model v7 (clean) and the TradePlan entity is formal and immutable. Paper trading = recording system-generated signals with actual simulated fills, tracking exits via the canonical exit engine, and monitoring net PnL with EGX costs.

Minimum additional requirement: basic Risk Engine (Step 13) to prevent unlimited paper trades.

**Estimated: Week 9–10** with model v7 + immutable signals + basic risk engine + honest performance tracking.

### 9. What is the earliest point where real-money signals could be considered?

**After all production acceptance gates pass** (Section 16). This requires:
- OOS win rate > random baseline for >= 6 months of OOS data
- Model health check: no suspension in last 4 weeks
- Drawdown halt tested in paper trading
- All fabricated data eliminated (confirmed)
- Full audit trail per signal
- Human approval gate working for model changes
- Minimum 4 weeks of paper trading

**Estimated: Week 29+ from today** (Phases 0–4 complete + 4 weeks paper trading).

### 10. What is the single most important architectural principle for the rebuild?

> **Temporal Truth is the Foundation.**
>
> Every other improvement — better signals, more strategies, better UI, more catalysts, improved risk controls — is built on price and fundamental data. If those data are contaminated by look-ahead bias (using today's PE ratio to train a model on 2020 bars), every statistical output of the system is unreliable regardless of how sophisticated the surrounding architecture becomes.
>
> Before building anything new: implement `fundamentals.snapshots` as an INSERT-ONLY bitemporal table, enforce DateGuard on every feature function, retrain the model on point-in-time data only, and validate the result with a walk-forward backtest.
>
> Only then — when the number "OOS win rate = X%" is trustworthy — can any other architectural decision be made with confidence.

---

*DOCUMENT: docs/04_EGX_GAP_ANALYSIS_AND_REBUILD_PLAN.md*  
*Generated: 2026-08-05 (Cairo Time)*  
*Based on: 28-phase forensic audit + supplementary audit + current architecture + target architecture*  
*Every recommendation traces: AUDIT → CURRENT → TARGET → GAP → ACTION*
