# TRADEORA EGX — PROFESSIONAL TARGET ARCHITECTURE
**Document Type:** Target Architecture Design  
**Authority:** Derived from `01_EGX_COMPREHENSIVE_AUDIT.md` + `02_EGX_CURRENT_ARCHITECTURE.md`  
**Date:** 2026-08-05  
**Authors:** Principal Enterprise Architect / Quantitative Systems Architect / Financial Data Architect  

---

## HOW TO READ THIS DOCUMENT

| Label | Meaning |
|-------|---------|
| `CURRENT` | What exists today (from the forensic audit) |
| `TARGET` | What this architecture defines |
| `AUDIT-REF` | The specific audit finding being resolved |
| `EGX-SPECIFIC` | Requirement unique to the Egyptian market context |
| `HUMAN-GATE` | Decision that must always require human approval |

> **Governing Rule:** Every design decision in this document is traceable to a specific audit finding or EGX market constraint. This is not a generic trading platform architecture — it is designed for the specific limitations, data sources, and market structure of the Egyptian Stock Exchange.

---

## PART I — FOUNDATIONS

### 1.1 Core Architectural Mandate — Top 10 Audit Findings Resolved

| Priority | Audit Finding | Architectural Response |
|----------|-------------|----------------------|
| 1 | Service role key hardcoded in TypeScript source | Secret management via env vars — zero credentials in source |
| 2 | Order book is fabricated (synthetic 145k/290k/85k volumes) | Remove fabrication; return data_availability=UNAVAILABLE |
| 3 | SSE streaming non-functional on Vercel serverless | Redis pub/sub price cache; frontend polling with staleness label |
| 4 | Exit cron always skipped (fires 18:00 Cairo, gate closes 13:30) | EGX-aware GH Actions scheduler; remove broken Vercel cron |
| 5 | Look-ahead bias in 8 ML features (today's fundamentals applied to 2020 bars) | Bitemporal FundamentalSnapshot; mandatory point-in-time query |
| 6 | Win rate 28% live vs 60% backtest (32pp gap unexplained) | Walk-forward validation mandatory before any production promotion |
| 7 | Duplicate exit logic: Python + broken TypeScript cron | Single canonical Python exit engine; TypeScript for display only |
| 8 | Screener win rates hardcoded (78/72/60) | Show real OOS win rate or null with honest label |
| 9 | Sharpe non-standard; benchmark meaningless (EGX30 not TR) | Annualized Sharpe vs Egypt T-bill; EGX30 Total Return benchmark |
| 10 | No pipeline monitoring or failure alerting | Observability layer: health check + Telegram alert per pipeline |

### 1.2 Architecture Principles — Current vs Target

| Principle | Current State | Target State |
|-----------|--------------|-------------|
| Temporal Truth | Look-ahead bias in 8 features | Point-in-time bitemporal data layer; DateGuard enforcement |
| Data Source Hierarchy | Ad-hoc per route; sources relabeled | Canonical 3-tier system; source label always accurate |
| Canonical Data Model | Implicit, inconsistent per table | Explicit typed contracts with owners, timestamps, versioning |
| Data Quality Engine | Basic dedup only | Freshness + coverage + consistency + accuracy scores + alerts |
| Market Data Engine | Multi-source chaos; mubasher in SQL RPC | Unified ingestion with quality gates and source health tracking |
| Intraday Architecture | Yahoo inject at request time, labeled as TradingView | Scheduled pipeline; honest source label; stored with provenance |
| Microstructure | Fabricated Level 2 presented as real | Honest UNAVAILABLE with labeled derived-only estimates |
| Market Regime | ADX threshold only | Multi-signal versioned RegimeSnapshot (INSERT-ONLY per day) |
| Catalyst Intelligence | News sentiment only | Event → Catalyst → Materiality → Reaction full lifecycle |
| Opportunity Engine | Signal = Trade (conflated) | Opportunity ≠ Signal ≠ TradePlan ≠ Trade (cleanly separated) |
| Dynamic Confidence | Static probability, time-decayed | Evidence-updated confidence with explainability |
| TradePlan | None (TP/SL overwritten daily) | Formal immutable TradePlan with ATR-based levels + EGX costs |
| Risk Engine | None | Position sizing, portfolio heat, drawdown halt |
| Performance Engine | Non-standard Sharpe; no costs; LAUNCH_DATE hides 998 trades | GIPS-aligned, net of costs, full history with honest labels |
| Research/Backtesting | In-sample only; look-ahead contaminated | Walk-forward, OOS, Monte Carlo, survivorship-bias-free |
| Learning Engine | Manual ad-hoc retraining | OBSERVE → ANALYZE → HUMAN APPROVES → VERSIONED UPDATE |
| Observability | File logs only; no alerting | Health dashboard + Telegram alerts for every pipeline |
| Security | Service role key in TypeScript source code | Secrets in env vars only; zero credentials in source |
| EGX-Specific | US market assumptions imported blindly | Cairo TZ; EGX calendar; local transaction costs; liquidity context |

---

## PART II — CANONICAL DATA CONTRACTS

### 2.1 Entity: Asset

```
Owner:             Universe Engine
Source of Truth:   EGX official registry (egx.com.eg)
Immutable fields:  asset_id, symbol, isin, created_at
Mutable (versioned): name_ar, name_en, sector, listing_status, shariah_status
Timestamps:        created_at, status_updated_at, shariah_status_date
Consumers:         All engines

KEY FIELDS:
  asset_id:              UUID    -- platform-internal stable ID
  symbol:                VARCHAR -- EGX ticker (COMI, HRHO, EKHW...)
  isin:                  VARCHAR -- official ISIN
  listing_status:        ENUM    -- active | suspended | delisted
  market_type:           VARCHAR -- main | second | nileX | sme
  is_shariah_compliant:  BOOLEAN -- current status
  shariah_status_date:   DATE    -- date of latest Shariah ruling
  data_coverage_pct:     NUMERIC -- % of trading days with valid OHLCV
  float_shares:          BIGINT? -- free float (if known)
  total_shares:          BIGINT? -- total issued shares
```

### 2.2 Entity: MarketData (Daily OHLCV)

```
Owner:             Market Data Engine
Source of Truth:   TIER-1 (EGX Bulletin) > TIER-2 (TradingView) > TIER-3 (Yahoo)
Immutable fields:  asset_id, price_date, source, ingested_at, OHLCV
Mutable:           quality_score, flags, is_adjusted, adjustment_factor
Versioning:        One canonical row per (asset_id, price_date); source stored in row
Consumers:         Signal Engine, Performance Engine, Backtesting, Frontend Chart API

SOURCE HIERARCHY:
  TIER-1 (Official):  egx_bulletin — USE IF AVAILABLE
  TIER-2 (Reliable):  tradingview_1d — USE IF TIER-1 MISSING <= 2 DAYS
  TIER-3 (Fallback):  yahoo_historical, yahoo_live — EMERGENCY ONLY
  FORBIDDEN:          mubasher (close-only), intraday_consensus (unreliable OHLC)
  RULE: Source label is ALWAYS accurate — never relabel Yahoo as TradingView

KEY FIELDS:
  quality_score:      NUMERIC(4,2) -- 0=fail | 0.5=warnings | 1.0=clean
  flags:              TEXT[]       -- ohlc_impossible | zero_volume | flat_candle | estimated
  is_adjusted:        BOOLEAN      -- adjusted for splits/dividends?
  adjustment_factor:  NUMERIC?     -- multiplier applied to pre-event prices
  vwap:               NUMERIC?     -- volume-weighted average price
```

### 2.3 Entity: FundamentalSnapshot (INSERT-ONLY — bitemporal)

```
Owner:             Fundamentals Engine
Source of Truth:   EGX official filings > Yahoo Finance > Manual
Immutable fields:  ALL (INSERT-ONLY table — no UPDATE ever)
Versioning:        New row per quarter/filing event
Consumers:         Signal Engine (point-in-time query), Backtesting

AUDIT-REF: AW-H1 Look-ahead bias
CURRENT:  Single row per company; training uses today's PE for all historical bars
TARGET:   INSERT-ONLY; mandatory point-in-time query rule:
          SELECT * FROM fundamentals.snapshots
          WHERE asset_id = ? AND effective_date <= :signal_date
          ORDER BY effective_date DESC LIMIT 1

KEY FIELDS:
  effective_date:   DATE     -- date from which these fundamentals became valid
  reported_period:  VARCHAR  -- 'Q3-2025' | 'FY-2025' | 'H1-2025'
  source:           VARCHAR  -- 'egx_disclosure' | 'yahoo_finance' | 'manual'
  confidence:       NUMERIC  -- 0-1 (1.0 = official filing, 0.5 = scraped estimate)
  pe_ratio, pb_ratio, eps, roe, roa, debt_to_equity, dividend_yield...
```

### 2.4 Entity: RegimeSnapshot (INSERT-ONLY)

```
Owner:             Market Regime Engine
Immutable fields:  ALL (INSERT-ONLY; one row per trading day per scope)
Versioning:        snapshot_date is effective date; model_version tracks model
Consumers:         Signal Engine (threshold), Risk Engine (sizing), Performance (attribution)

KEY FIELDS:
  primary_regime:  ENUM -- BULLISH_TRENDING | BEARISH_TRENDING | SIDEWAYS_RANGE |
                          HIGH_VOL | LOW_VOL | LIQUIDITY_STRESS | MIXED
  scope:           ENUM -- MARKET | SECTOR | ASSET
  regime_strength: NUMERIC -- 0-1 (ADX-derived + multi-signal)
  adx, plus_di, minus_di, egx30_trend_5d, egx30_trend_20d, advance_decline
  foreign_net_5d, flow_regime (ACCUMULATION | DISTRIBUTION | NEUTRAL)
```

### 2.5 Entity: Signal (IMMUTABLE after creation)

```
Owner:             Signal Engine
Source of Truth:   Signal Engine at generation time
Immutable fields:  ALL (new signal supersedes old — never overwrite)
Versioning:        model_version + generated_at identify version
Consumers:         TradePlan Engine, Exit Engine, Frontend, Performance

AUDIT-REF: AW-H12 (TP/SL overwritten daily)
CURRENT:   generate_daily_recommendations.py updates active trades with new TP/SL/prob daily
TARGET:    Signal is FROZEN at creation. Update = new Signal (old signal INVALIDATED)

KEY FIELDS:
  signal_id:               UUID
  direction:               ENUM -- BUY | SELL | HOLD | EXIT
  conviction:              ENUM -- HIGH | MEDIUM | LOW
  ml_probability_raw:      NUMERIC -- raw model.predict_proba output
  ml_probability_final:    NUMERIC -- after validated evidence boosts only
  features_snapshot:       JSONB   -- ALL 30 features at signal time (for audit)
  fundamental_snapshot_id: UUID    -- FK to exact FundamentalSnapshot used
  regime_snapshot_id:      UUID    -- FK to exact RegimeSnapshot at signal time
  valid_until:             TIMESTAMPTZ -- signals expire; no open-ended signals
  evidence:                JSONB   -- [{source, score, description_ar, validated: bool}]
  confirmation_count:      INT     -- independent evidence sources that confirmed
```

### 2.6 Entity: TradePlan (IMMUTABLE after status=ACTIVE)

```
Owner:             TradePlan Engine
Immutable fields:  ALL price levels after status=ACTIVE
Versioning:        Change = new Signal → new TradePlan; old = INVALIDATED
Consumers:         Exit Engine (reads ORIGINAL levels), Trade, Performance

EGX TRANSACTION COSTS (embedded in every plan):
  Brokerage:   0.175% buy + 0.175% sell
  EGX fees:    0.009% buy + 0.009% sell
  FRA:         0.05% sell only
  Stamp duty:  0.15% sell only (if applicable)
  Total RT:    ~0.72% minimum
  rr_net_t1:  (target_1 - entry - costs) / (entry - stop_loss) — must meet min_net_rr

KEY FIELDS:
  stop_loss:          NUMERIC -- IMMUTABLE (never move stop against position)
  target_1:           NUMERIC -- TP1 (rr_gross >= 1.5:1)
  target_2:           NUMERIC -- TP2 (rr_gross >= 2.5:1, optional)
  rr_net_t1:          NUMERIC -- net R:R after EGX estimated costs
  position_size_egp:  NUMERIC -- from Risk Engine
  portfolio_risk_pct: NUMERIC -- % of portfolio at risk on this plan
```

### 2.7 Entity: Trade

```
Owner:             Execution Layer (user-recorded or exit-engine-detected)
Immutable fields:  entry_price, entry_shares, opened_at (once filled)
Mutable:           exit_* fields (until closed)
Consumers:         Performance Engine

AUDIT-REF: AW-M10 (no costs in PnL)
CURRENT:   PnL = exit_price - entry_price (gross only, no costs)
TARGET:    gross_pnl_egp AND net_pnl_egp (after all commissions, fees, taxes)
           Performance Engine ALWAYS uses net_pnl_pct

KEY FIELDS:
  gross_pnl_egp:      NUMERIC? -- before costs
  total_costs_egp:    NUMERIC? -- commissions + fees + taxes
  net_pnl_egp:        NUMERIC? -- THE real PnL
  net_pnl_pct:        NUMERIC? -- Performance Engine uses this
  exit_reason:        ENUM     -- STOP_LOSS | TP1 | TP2 | TRAILING_STOP |
                                  RSI_EXHAUSTION | MACD_DEAD_CROSS | EMA20_BREAK | MANUAL
  model_version:      VARCHAR  -- which model version generated the original signal
  look_ahead_flagged: BOOLEAN  -- true if generated by biased pre-clean model
```

### 2.8 Entity: Performance Report

```
Owner:             Performance Engine
Generated:         Weekly (full), daily (lightweight)

AUDIT-REF: AW-M5 (non-standard Sharpe), AW-M6 (meaningless benchmark)
CURRENT:   Sharpe = mean/std (no annualization, no risk-free rate)
           Benchmark = EGX30 index level (not Total Return)
           Statistics hide 998 pre-audit trades (LAUNCH_DATE filter)

TARGET:
  sharpe_ratio = (annualized_return - egypt_tbill_rate) / annualized_std * sqrt(trading_days)
  egypt_tbill_rate: CBE official rate (27% annualized as of 2026)
  benchmark: EGX30 Total Return Index (including dividends)
  alpha = strategy_return - benchmark_return (Jensen's alpha)
  ALL statistics use NET pnl (after EGX transaction costs)
  ALL historical trades included; pre-clean trades labeled, NOT hidden
  UI note: "Trades before v6-clean (2026-08-03): generated by biased model — shown for reference"
```

### 2.9 Entity: CatalystEvent

```
Owner:   Event/Catalyst Engine
Consumers: Opportunity Engine, Signal Engine (context), Frontend

KEY FIELDS:
  event_type:         ENUM    -- EARNINGS | DIVIDEND | SPLIT | CONTRACT |
                                 REGULATORY | MACRO | GEO_POLITICAL | MGMT_CHANGE
  materiality_score:  NUMERIC -- 0-1 (NLP + rules-based)
  surprise_score:     NUMERIC -- vs prior period or estimate (if quantifiable)
  credibility:        ENUM    -- OFFICIAL | MEDIA | SOCIAL | UNVERIFIED
  reaction_1d_pct:    NUMERIC -- T+1 price reaction (filled automatically)
  reaction_3d_pct:    NUMERIC -- T+3 price reaction
  status:             ENUM    -- DETECTED | CONFIRMED | FOLLOWED_THROUGH | DECAYED
```

### 2.10 Entity: LearningInput (ProposedChange)

```
Owner:   Learning Engine
Consumers: Admin (human review), Model Registry

KEY FIELDS:
  change_type:  ENUM   -- MODEL_RETRAIN | FEATURE_ADD | FEATURE_REMOVE |
                          THRESHOLD_ADJUST | BOOST_REMOVE | STRATEGY_SUSPEND
  evidence:     JSONB  -- supporting data from analysis phase
  status:       ENUM   -- PROPOSED | UNDER_REVIEW | APPROVED | REJECTED | IMPLEMENTED
  approved_by:  VARCHAR? -- required for APPROVED status (human ID)

RULE: No automated system can set status=APPROVED on its own proposal.
      Human review in admin panel is mandatory.
```

---

## PART III — DATA SOURCE HIERARCHY

```
+=====================================================================+
|                  EGX DATA SOURCE HIERARCHY                          |
+=====================================================================+
|  DATA TYPE          | TIER-1 (Official)  | TIER-2      | TIER-3   |
+---------------------+--------------------+-------------+----------+
|  Daily OHLCV        | EGX Bulletin PDF   | TradingView | Yahoo v8 |
|  Daily Volume       | EGX Bulletin PDF   | TradingView | Yahoo v8 |
|  Intraday (15m/1h)  | TradingView scrape | Yahoo v8    | None     |
|  Indices (EGX30/70) | EGX Official       | TradingView | None     |
|  Corporate Actions  | EGX Disclosures    | Yahoo splits| None     |
|  Fundamentals       | EGX filings        | Yahoo Fin.  | Manual   |
|  Investor Flows     | EGX Official PDF   | None        | None     |
|  Market Depth (L2)  | UNAVAILABLE        | UNAVAILABLE | None     |
|  News               | EGX Disclosures    | Almal.com   | None     |
|  Shariah            | EGX Official       | Falak/AAOIFI| None     |
+---------------------+--------------------+-------------+----------+
|  FORBIDDEN: mubasher (close-only); investing.com Selenium          |
|  RULE: If all tiers fail → DataGap + alert. NEVER fabricate.       |
+=====================================================================+
```

---

## PART IV — TEMPORAL DATA LAYER (Bitemporal Pattern)

```
PROBLEM (AUDIT-REF AW-H1):
  Signal engine reads company_fundamentals.pe_ratio — a single current row.
  When training on 2020 bars, today's PE is used — look-ahead bias.
  Estimated contribution to 32pp backtest vs live win-rate gap.

TARGET: Bitemporal pattern for all time-varying data.

  effective_date:  DATE        -- when this fact became true in the market
  ingested_at:     TIMESTAMPTZ -- when our system learned about it

TABLES USING THIS PATTERN (INSERT-ONLY):
  fundamentals.snapshots        -- one row per new EGX filing or Yahoo update
  compliance.sharia_assessments -- one row per new Shariah ruling
  regimes.snapshots             -- one row per trading day per scope
  events.corporate_actions      -- one row per confirmed corporate action

MANDATORY POINT-IN-TIME QUERY RULE:
  For signal engine AND backtesting, ALWAYS use:
    SELECT * FROM fundamentals.snapshots
    WHERE asset_id = :asset_id
      AND effective_date <= :as_of_date   -- the signal or training bar date
    ORDER BY effective_date DESC
    LIMIT 1;

DateGuard Enforcement:
  All feature functions take explicit as_of_date parameter.
  Automated test: verify no feature value references data after bar_date.
  Backtest run FAILS if look_ahead_detected = true.
```

---

## PART V — SYSTEM LAYERS

### Layer 1: Data Layer

```
Technology: Supabase PostgreSQL (primary) + Upstash Redis (cache)
Remove:     CockroachDB — investor flows consolidate to Supabase

SCHEMA LAYOUT:
  raw.*           -- raw ingested data, minimal validation, append-only
  canonical.*     -- quality-gated, deduplicated, source-prioritized
  fundamentals.*  -- point-in-time snapshots (INSERT-ONLY, bitemporal)
  events.*        -- catalyst events, corporate actions, news, insider trades
  compliance.*    -- sharia assessments (INSERT-ONLY, bitemporal)
  regimes.*       -- market regime snapshots (INSERT-ONLY, bitemporal)
  signals.*       -- opportunities, signals, trade_plans
  trades.*        -- trades, positions, daily_pnl_snapshots
  performance.*   -- reports, attribution, benchmark_returns
  research.*      -- backtest_runs, proposed_changes, model_registry
  observability.* -- pipeline_health, quality_reports, data_gaps, alerts
  config.*        -- strategies, risk_parameters, egx_calendar

ROW-LEVEL SECURITY:
  Public read:   canonical.*, events.news_articles, compliance.sharia_assessments
  Auth read:     signals.*, trades.*, performance.*
  Admin only:    observability.*, config.*, research.*, raw.*
  Service role:  env vars ONLY — ZERO credentials in source code
```

### Layer 2: Market Data Engine

```
INGESTION PIPELINE (daily, after EGX close, ~15:00 UTC = 18:00 Cairo):

  Source Adapters (one per source, pluggable):
    EGXBulletinAdapter   → raw.market_data_egx_bulletin
    TradingViewAdapter   → raw.market_data_tradingview
    YahooAdapter         → raw.market_data_yahoo
         |
         ↓
  Normalization Layer
    - Standardize field names across all sources
    - Attach accurate source label (NEVER relabel)
    - Compute change_abs, change_pct, typical_price, vwap
         |
         ↓
  Quality Gate (per OHLCV bar)
    - open > 0, high >= max(open,close), low <= min(open,close)
    - volume >= 0
    - change_pct in [-50%, +50%] (alert if outside)
    - Not a duplicate (same asset + date + source)
    - Date is valid EGX trading day per config.egx_calendar
    → quality_score: 1.0 clean | 0.5 warning | 0.0 fail
         |
         ↓
  Source Priority Resolver
    For each (asset, date):
      TIER-1 exists? → canonical.market_data (source=egx_bulletin)
      TIER-2 exists? → canonical.market_data (source=tradingview_1d)
      TIER-3 exists? → canonical.market_data (source=yahoo)
      None?          → DataGap record + alert
         |
         ↓
  Gap Detector
    Find (asset, date) pairs: EGX trading day but no canonical row
    → observability.data_gaps
    Alert: gap > 2 consecutive days OR gap in top-50 stocks

SOURCE HEALTH MONITOR (after each ingestion run):
  Per source: last_successful_at, consecutive_failures, coverage_pct_today, latency_ms
  Alert if: consecutive_failures >= 2 OR coverage_pct_today < 80%

EGX MARKET CALENDAR (first-class config entity):
  config.egx_calendar: date, is_trading_day, session_open, session_close,
                        holiday_name, holiday_type
  Maintained: annually from EGX official announcements
  Ramadan note: session hours shortened (09:30–13:30 Cairo typical)
  Used by: ALL schedulers, session gate logic, gap detector, backtest engine
  EGX-SPECIFIC: No DST in Egypt; UTC+2 standard (verify annually vs UTC+3 claim)
```

### Layer 3: Data Quality Engine

```
QUALITY DIMENSIONS:
  Freshness:    FRESH(<1 trading day) | STALE(1-3 days) | CRITICAL(>3 days)
  Coverage:     FULL(>=95% assets) | PARTIAL(80-95%) | DEGRADED(<80%)
  Consistency:  AGREE(<0.5% cross-source delta) | WARN(0.5-2%) | CONFLICT(>2%)
  Accuracy:     OHLC constraints satisfied; change_pct within expected range
  Completeness: All expected fields populated

DAILY QUALITY SCORECARD:
  observability.quality_report:
    freshness_score, coverage_score, consistency_score, accuracy_score,
    completeness_score, composite_score (weighted average), issues (JSONB list)

ALERTS:
  composite_score < 0.7    → Telegram alert to admin
  Top-20 asset data gap    → Immediate alert
  Source DEGRADED          → Telegram warning
  Source DOWN              → Telegram alert + email
```

### Layer 4: Universe Engine

```
Responsibilities:
  - Track all EGX-listed stocks, ETFs, funds
  - Detect new listings, delistings, suspensions (from EGX disclosures)
  - Track name changes, ticker changes, mergers
  - Manage signal generation inclusion rules

SIGNAL GENERATION FILTERS:
  listing_status = 'active'
  data_coverage_pct >= 60%      -- at least 60% of trading days have data
  last_price_date within 5 trading days

CORPORATE ACTION PIPELINE:
  detect_price_anomaly()         -- flags candles with > 30% single-day move
  → cross-check EGX Disclosures (events.corporate_actions table)
  → if confirmed: apply adjustment_factor to pre-event prices
  → store in events.corporate_actions (formal schema, not text field hack)

CURRENT → TARGET:
  CURRENT: companies.notes stores "SPLIT_DETECTED:..." (text field hack)
  TARGET:  events.corporate_actions with formal schema + EGX verification required
```

### Layer 5: Sharia Compliance Engine

```
CURRENT: is_shariah_compliant = single boolean column on companies (no history)
TARGET:  compliance.sharia_assessments (INSERT-ONLY, bitemporal)

Key fields: effective_date, source (EGX_OFFICIAL|AAOIFI|FALAK|MANUAL),
  is_compliant, methodology, revenue_threshold, debt_threshold,
  purification_ratio, review_date

Query rule: WHERE effective_date <= :as_of_date ORDER BY effective_date DESC LIMIT 1

Source: EGX official (egx.com.eg/Shariah) — scraped weekly
```

### Layer 6: Event/Catalyst Engine

```
EVENT PIPELINE:

  Sources: EGX disclosures, Almal.com, CBE announcements, flow anomalies
      ↓
  Detection:
    Earnings:    extract EPS, revenue vs prior period
    Dividends:   parse amount, ex-date, payment-date
    Splits:      price anomaly + cross-check EGX disclosure
    Contracts:   NLP from news title + body
    Regulatory:  keyword detection (EGX circulars, FRA decisions)
    Macro:       CBE rate decision, government policy
      ↓
  Classification → events.catalyst_events:
    EARNINGS | DIVIDEND | SPLIT | CONTRACT | REGULATORY |
    MACRO | GEO_POLITICAL | MANAGEMENT_CHANGE | SECTOR_ROTATION
      ↓
  Materiality:
    credibility: OFFICIAL(1.0) > MEDIA(0.7) > SOCIAL(0.3)
    materiality_score: credibility × type_weight × surprise_score
      ↓
  Market Reaction Tracking (auto, T+1, T+3, T+5):
    After event_date: fetch close prices → compute reaction_Nd_pct
    Update status: CONFIRMED → FOLLOWED_THROUGH → DECAYED
      ↓
  Catalyst → Opportunity:
    materiality_score >= threshold
    + tradeability check (not suspended, volume sufficient)
    → Create signals.opportunities record
```

### Layer 7: Market Regime Engine

```
MARKET-LEVEL REGIME SIGNALS:
  EGX30 trend (5d, 20d, 60d EMA slope)
  Advance/Decline ratio (advances / declines)
  Foreign investor net flow (5-day rolling EGP sum)
  20-day realized volatility of EGX30

ASSET-LEVEL REGIME SIGNALS:
  ADX(14) + DI+/DI- from canonical candles
  Price relative to EMA(20), EMA(50)
  Relative volume (vs 20d average)
  RSI(14) zone (oversold/neutral/overbought)

REGIME CLASSIFICATION:
  BULLISH_TRENDING:  ADX>25, DI+>DI-, EGX30 up, A/D>1.5
  BEARISH_TRENDING:  ADX>25, DI->DI+, EGX30 down, A/D<0.7
  SIDEWAYS_RANGE:    ADX<20, price between EMA20-EMA50
  HIGH_VOLATILITY:   20d vol > 1.5× 90d avg
  LOW_VOLATILITY:    20d vol < 0.7× 90d avg
  LIQUIDITY_STRESS:  avg volume < 50% of 90d avg
  ACCUMULATION:      Foreign net > 0 for 5 consecutive days, flat price
  DISTRIBUTION:      Foreign net < 0 for 5 consecutive days, flat price

OUTPUT: regimes.snapshots (INSERT-ONLY) per trading day
USAGE:
  Signal Engine:   threshold by regime (higher bar in BEARISH/HIGH_VOL)
  Risk Engine:     position_size_multiplier by regime
  Performance:     attribution by regime
  Backtesting:     walk-forward uses only past regimes (no future look-ahead)
```

### Layer 8: Analysis Engine (Stateless)

```
DESIGN RULES:
  1. All indicator functions are PURE (same input → same output, no DB reads)
  2. All functions take explicit as_of_date — no future data can slip in
  3. DateGuard decorator enforces point-in-time correctness

INDICATOR CATALOG:
  Trend:      EMA(12,20,26,50,200), SMA(20,50,200)
  Momentum:   RSI(14), StochRSI(14), CCI(20), Williams %R
  Volatility: ATR(14), Bollinger Bands(20), Keltner Channels
  Volume:     OBV, Relative Volume, VWAP, VolumeProfile (VPOC/VAH/VAL)
  Structure:  ADX(14), DI+, DI-
  MACD:       Standard (12/26/9) — MACD_line - Signal_line (v6 formula is correct)
  Patterns:   Engulfing, Doji, Hammer, Shooting Star, CupHandle, DoubleBottom, BullFlag

ANALYSIS SERVICES (stateless, reusable):
  TrendAnalyzer, MomentumAnalyzer, VolumeAnalyzer, StructureAnalyzer,
  WyckoffAnalyzer, SmartMoneyAnalyzer, PatternAnalyzer, SeasonalityAnalyzer

CACHING (for live UI speed):
  Option A: Recompute on demand (always correct — use for backtesting)
  Option B: Pre-compute → analytics.indicator_cache (use for live UI)
  Cache invalidation: when new canonical candle added for asset
```

### Layer 9: Microstructure Engine

```
EGX MICROSTRUCTURE REALITY:
  EGX does NOT provide a public Level 2 API.
  Real-time bid/ask depth is NOT available to retail.

  REAL data (from EGX/TradingView):
    Daily OHLCV, traded value EGP, VWAP, intraday 15m/1h bars

  DERIVED (computed, MUST be labeled):
    Relative volume vs 20d average
    Estimated spread (intraday H-L as proxy)
    Volume profile VPOC/VAH/VAL from intraday bars
    Estimated market impact (Almgren-Chriss approximation)

  UNAVAILABLE:
    Bid/ask spread (real-time), order book depth, number of orders

  UI RULE (AUDIT-REF: AW-C2 fabrication):
    Arabic label: "مشتق" (Derived) or "غير متاح" (Not Available)
    NEVER show synthetic values as real market data

  CURRENT: /api/orderbook returns hardcoded 145k/290k/85k bid/ask volumes as real
  TARGET:  /api/orderbook returns:
    {
      data_availability: "UNAVAILABLE",
      message_ar: "بيانات عمق السوق غير متاحة لبورصة مصر",
      message_en: "Level 2 market depth data is not publicly available for EGX",
      derived_metrics: {
        relative_volume: <computed>,
        estimated_spread_pct: <computed from intraday H-L>,
        avg_daily_value_egp: <computed>,
        liquidity_tier: "LARGE_CAP|MID_CAP|SMALL_CAP"
      },
      is_derived: true
    }
```

### Layer 10: Opportunity Engine

```
FUNDAMENTAL SEPARATION:
  Opportunity: "Conditions consistent with a potential setup exist"
  Signal:      "Sufficient evidence to recommend a directional trade"
  TradePlan:   "Specific entry, exit, sizing, cost-adjusted plan"
  Trade:       "A TradePlan was executed at a specific price and size"

OPPORTUNITY ASSESSMENT PIPELINE:
  Catalyst Event (materiality >= threshold)
    + Regime not BEARISH_TRENDING or LIQUIDITY_STRESS
    + Technical readiness (setup aligns with catalyst)
    + Tradeability (stock active, volume sufficient, not at circuit breaker)
    → signals.opportunities (status=DETECTED)

OPPORTUNITY SCORING:
  catalyst_score:  0-40 pts (materiality × credibility × surprise)
  technical_score: 0-30 pts (trend alignment, S/R, pattern)
  flow_score:      0-15 pts (foreign flow direction, smart money)
  regime_score:    0-15 pts (regime favorable for trade type)
  total: 0-100

  >= 60 AND tradeability=TRADEABLE → ACTIVE (proceed to Signal Engine)
  40-60                            → WATCH (no signal yet)
  < 40 OR not tradeable            → SKIP

LIFECYCLE: DETECTED → ACTIVE → CONVERTED_TO_SIGNAL | EXPIRED | INVALIDATED
```

### Layer 11: Strategy Engine

```
All strategies: versioned, immutable after approval, performance-tracked.
Changes require human approval + new version number.

STRATEGY DEFINITION (config.strategies):
  strategy_id, name, version, active, description
  entry_rules, exit_rules, position_rules, universe_filter, regime_filter (all JSONB)
  approved_by: VARCHAR -- HUMAN-GATE; cannot be approved automatically

INITIAL STRATEGY CATALOGUE (grounded in current codebase):
  1. momentum_breakout:   ML prob >= 0.65 + 2 confirmations, BULLISH_TRENDING
  2. wyckoff_spring:      Spring near support with volume confirmation
  3. catalyst_play:       Earnings surprise or contract catalyst, within T+2
  4. flow_divergence:     Unusual foreign accumulation vs price suppression
  5. oversold_recovery:   RSI < 30, ADX < 20, volume spike, fundamental support
```

### Layer 12: Signal Engine

```
SIGNAL GENERATION PIPELINE:

  Opportunities (status=ACTIVE)
       ↓
  Feature Extraction — POINT-IN-TIME ONLY (DateGuard enforced)
    Technical:    canonical candles up to signal_date
    Fundamentals: FundamentalSnapshot WHERE effective_date <= signal_date
    Regime:       RegimeSnapshot WHERE snapshot_date = signal_date
    Catalyst:     CatalystEvent WHERE event_date <= signal_date
    Flows:        daily_investor_flows WHERE trade_date <= signal_date
       ↓
  ML Model (XGBoost v6+)
    Returns raw probability — zero look-ahead contamination
    model_version stored in Signal record
       ↓
  Evidence Stack (additive, capped, OOS-validated)
    evidence_item: { source, score, max_contribution, description_ar, validated }
    Unvalidated boosts: stored but contribute 0.0 to ml_probability_final
    until Learning Engine confirms OOS improvement
       ↓
  Dynamic Confidence
    + confirmation:    new evidence agrees with direction
    + follow_through:  price moving in expected direction
    - contradiction:   counter-evidence (opposite flow, earnings miss)
    - deterioration:   regime changed adversely
       ↓
  Signal Gate (threshold by regime)
    BULLISH_TRENDING:  ml_probability_raw >= 0.60
    SIDEWAYS_RANGE:    ml_probability_raw >= 0.65
    HIGH_VOLATILITY:   ml_probability_raw >= 0.70
    BEARISH_TRENDING:  ml_probability_raw >= 0.75
    LIQUIDITY_STRESS:  SKIP — no new signals
       ↓
  Signal CREATED (IMMUTABLE)
    All fields frozen at creation. TP/SL stored in TradePlan (not Signal).
    valid_until = signal_date + timeframe_days (signals expire)
    New analysis → new Signal (old Signal status=INVALIDATED)

SELL SIGNAL FIX (AUDIT-REF: SELL signals = inverse BUY = wrong):
  CURRENT: SELL if BUY_probability <= 0.35 — incorrect
  TARGET (Phase 1): Remove SELL from BUY classifier output.
                    SELL signals = exit engine only (closing existing longs)
  TARGET (Phase 2): Train dedicated SELL model (separate labels)
```

### Layer 13: Risk Engine

```
PARAMETERS (stored in config.risk_parameters, human-gated changes):
  max_risk_per_trade_pct:    2.0%
  max_portfolio_heat_pct:   10.0%   (sum of all open position risks)
  max_concentration_pct:    15.0%   (single stock)
  max_sector_concentration: 30.0%   (single EGX sector)
  max_drawdown_halt_pct:    20.0%   (halt signals if portfolio DD >= 20%)
  min_net_rr_ratio:          1.2    (after EGX transaction costs)
  min_volume_egp:        500_000    (minimum avg daily traded value in EGP)

POSITION SIZING:
  risk_per_share     = entry_price - stop_loss
  allowed_risk_egp   = portfolio_capital × max_risk_per_trade_pct
  position_size_shares = floor(allowed_risk_egp / risk_per_share)
  
  Checks (all must pass):
    position_egp / portfolio <= max_concentration_pct
    sum(all_open_risk_egp) + new_risk_egp <= portfolio × max_portfolio_heat_pct
    position_egp <= 10% of avg_daily_value_egp  (EGX liquidity constraint)

DRAWDOWN HALT:
  Monitor: trades.daily_pnl_snapshots → compute portfolio equity curve
  If drawdown from peak >= max_drawdown_halt_pct:
    Signal Engine: suspend new signal generation
    Alert: Telegram (immediate) + in-app admin notification
    Resume: HUMAN review and approval required
```

### Layer 14: Regulatory & Trading Constraints (EGX-Specific)

```
1. DAILY PRICE LIMITS: EGX +-10% circuit breakers
   If stock moved +-9% today: tradeability = LOW_LIQUIDITY
   Stop losses must be outside circuit breaker range (else untradeable)

2. SHORT SELLING: Restricted on EGX (SBL for specific securities only)
   CURRENT: SELL signals imply short — wrong for most EGX stocks
   TARGET:  SELL = EXIT existing longs by default
            SBL-eligible stocks tracked in canonical.assets.is_sbl_eligible

3. SETTLEMENT: T+2 (standard EGX)
   Intraday exits only for explicitly marked day-trade strategies

4. MARKET SUSPENSIONS:
   Universe Engine polls for suspensions
   Active signals for suspended stocks: flagged SUSPENDED
   Exit engine: does NOT evaluate suspended stocks

5. TIMEZONE: Egypt = UTC+2 standard (NO DST)
   All cron schedules use UTC equivalents from config.egx_calendar
   Do NOT hardcode UTC times; verify annually as Egypt occasionally changes
```

### Layer 15: TradePlan Engine

```
TRADEPLAN CREATION (triggered when Signal achieves conviction threshold):
  Signal (HIGH|MEDIUM conviction)
       ↓
  Risk Engine check (all checks must pass — TradePlan not created if any fails)
       ↓
  ATR-based level computation:
    atr = ATR(14) at signal_date (from canonical candles)
    stop_loss = entry_zone_mid - 1.5 × atr
    target_1  = entry_zone_mid + 2.0 × atr
    target_2  = entry_zone_mid + 3.5 × atr
    if fair_value available and > target_1: target_2 = min(fair_value, entry × 1.5)
    
    R:R check: (target_1 - entry) / (entry - stop) must be in [min_rr, max_rr]
    Cost check: apply EGX RT costs to get rr_net_t1 >= min_net_rr_ratio
       ↓
  TradePlan CREATED (IMMUTABLE once status=ACTIVE)
    All price levels frozen at creation time.
    Exit engine reads ORIGINAL levels — never updates them.
    If levels become invalid: create new Signal → new TradePlan; old = INVALIDATED
```

### Layer 16: Execution Integration

```
CURRENT SCOPE: Tradeora EGX is market intelligence, not an execution system.
               No direct brokerage API integration in current scope.

User flow: TradePlan shown in UI → User executes via their broker
           User optionally records actual fill: trade.entry_price, trade.entry_shares

  trade.is_entry_estimated = true if entry_price = last_close (not actual fill)
  Estimated entries flagged in performance statistics

FUTURE SCOPE (if brokerage API added):
  EGX brokers with documented APIs: Beltone, CI Capital, EFG Hermes
  Layer is stubbed; not in current implementation scope.
```

### Layer 17: Performance Engine

```
METRICS (all use NET pnl after EGX transaction costs):

  Win Rate = count(net_pnl_pct > 0) / count(all_closed_trades)

  Expectancy = win_rate × avg_net_winner_pct + (1 - win_rate) × avg_net_loser_pct

  Sharpe (annualized):
    daily_pnl_series from trades.daily_pnl_snapshots (portfolio level)
    excess_returns = daily_returns - (egypt_tbill_rate / 252)
    sharpe = mean(excess_returns) / std(excess_returns) × sqrt(252)
    egypt_tbill_rate: CBE official rate (27% annualized, 2026)

  Max Drawdown (PORTFOLIO-LEVEL, requires daily equity curve):
    equity_curve from trades.daily_pnl_snapshots
    drawdown = (peak - current) / peak
    max_drawdown = max(drawdown over period)

  Benchmark: EGX30 Total Return Index
    alpha = strategy_return - benchmark_return
    information_ratio = alpha / tracking_error

  Cost Attribution:
    gross_return (before costs) — cost_drag (%) — net_return (after costs)

DATA HISTORY RULE:
  CURRENT: LAUNCH_DATE filter hides 998 pre-audit trades
  TARGET:  ALL historical trades included
           trade.look_ahead_flagged = true for pre-v6-clean signals
           UI label: "Generated by biased model (v1-v5) — shown for reference"
           Statistics available in two views: ALL and CLEAN_ONLY (v6+ signals)
```

### Layer 18: Research & Backtesting Engine

```
NON-NEGOTIABLE PRINCIPLES:

  1. POINT-IN-TIME DATA ONLY
     DateGuard enforced on all feature functions.
     Backtest run status = FAILED if look_ahead_detected = true.

  2. WALK-FORWARD VALIDATION (mandatory before production promotion):
     Minimum 5 folds, each with training window + OOS gap of >=6 months:
       Fold 1: Train 2020-2022, OOS Test Jan-Jun 2023
       Fold 2: Train 2020-Jun2023, OOS Test Jul-Dec 2023
       Fold 3: Train 2020-Dec2023, OOS Test Jan-Jun 2024
       ...etc.
     Report: median OOS win rate, OOS Sharpe, OOS max drawdown, OOS expectancy

  3. SURVIVORSHIP BIAS CONTROL:
     Universe at each bar_date includes ALL stocks active then
     (including subsequently delisted stocks)

  4. TRANSACTION COSTS (EGX-specific, always applied):
     Commission: 0.175% per side
     EGX fees: 0.009% per side
     FRA stamp: 0.15% on sell
     Slippage: 0.1% large-cap (avg vol > 10M EGP/day), 0.3% small-cap

  5. RANDOM BASELINE (mandatory):
     A. Random entry, same hold period (Monte Carlo, 10,000 runs)
     B. Buy-and-hold EGX30 TR
     C. Egypt T-bill rate
     Strategy must beat ALL baselines in OOS testing to be promoted

  6. MONTE CARLO: 10,000 random trade orderings → report 5th percentile (worst case)

  7. HUMAN GATE: promoted_to_production requires admin approval
     No model version goes live without OOS validation + human sign-off

research.backtest_runs:
  run_id, strategy_id, model_version, run_type (IN_SAMPLE|OUT_OF_SAMPLE|WALK_FORWARD|MC)
  data_start, data_end, total_trades, win_rate, sharpe, max_drawdown,
  benchmark_return, alpha, look_ahead_detected, promoted_to_production, promoted_by
```

### Layer 19: Learning Engine

```
PIPELINE:

  OBSERVE:
    Collect closed trades with feature_snapshots
    Tag: win | loss | breakeven
    Identify: which features most deviant in losing trades?
    Identify: which evidence sources correlated with winning trades?

  ANALYZE:
    Feature importance drift (has any feature's predictive power changed?)
    Evidence source validation (which boosts improved OOS outcomes?)
    Regime-specific analysis (works in some regimes but not others?)
    Drawdown clustering (systematic vs random loss distribution?)
    Cost impact (are EGX costs eating a significant fraction of gross returns?)

  SUGGEST → research.proposed_changes:
    change_type: MODEL_RETRAIN | FEATURE_ADD | FEATURE_REMOVE |
                 THRESHOLD_ADJUST | BOOST_REMOVE | STRATEGY_SUSPEND
    With: evidence JSONB, expected_impact, risk description

  HUMAN APPROVES (admin panel — MANDATORY GATE):
    Admin must APPROVE or REJECT with reason
    No automated system can approve its own proposed changes

  VERSIONED UPDATE (after approval):
    New model trained (e.g., v7)
    Walk-forward validation run (Layers 18)
    If OOS results acceptable: promote model_v7.pkl to production
    Old version: archived in research.model_registry (never deleted)

HARD PROHIBITIONS (the Learning Engine cannot):
  Modify max_risk_per_trade_pct
  Change portfolio drawdown halt threshold
  Alter capital allocation
  Change strategy logic without human review
  Promote itself to production
  Remove safety limits
```

### Layer 20: Observability

```
PIPELINE HEALTH STORE (observability.pipeline_health):
  pipeline_id, last_run_at, last_success_at, last_failure_at,
  status (HEALTHY|DEGRADED|FAILED|UNKNOWN), consecutive_failures,
  last_error, last_output_summary (JSONB), coverage_pct

ALERT ROUTING:
  CRITICAL: Telegram + Email (immediate — pipeline down, look-ahead detected)
  HIGH:     Telegram (within 1 hour — data gap, quality score low)
  MEDIUM:   Email digest (daily — minor coverage degradation)
  LOW:      Weekly admin dashboard summary

PIPELINE REGISTRY (all registered pipelines):
  egx_bulletin_ingestion, tradingview_1d_ingestion, intraday_15m_scrape,
  investor_flows_scrape, corporate_events_scrape, news_scrape,
  data_quality_check, gap_detection, regime_snapshot,
  signal_generation, trade_monitoring, exit_engine,
  performance_analytics, backtest_weekly, fundamentals_sync,
  shariah_sync, learning_analyze, model_health_check

MODEL HEALTH CHECK (weekly):
  Compare rolling 30-trade live win rate vs OOS backtest expected win rate
  Delta > 15pp: alert admin
  Delta > 25pp: SUSPEND signal generation until human review
```

### Layer 21: Frontend / API

```
UNIVERSAL API RESPONSE FORMAT:
  { data: T, meta: { source, freshness_at, quality_score, is_estimated } }
  Missing data = null (not fabricated). Source label always accurate.

PRICE DISPLAY — fixing SSE failure (AUDIT-REF: in-memory store non-functional):
  CURRENT: SSE + in-memory livePriceStore = non-functional on Vercel serverless
  TARGET (Upstash Redis — already declared dependency):
    price_cache_updater.py (GH Actions, every 30s during session):
      GET prices from TradingView scanner
      SET price:{SYMBOL} in Upstash Redis (TTL=60s)
    /api/price/{symbol} (Vercel):
      GET from Upstash Redis (shared across all serverless containers)
      Returns: { price, changePct, source, updated_at, ttl_seconds }
    Frontend: SWR polling every 30s
      UI: "Updated 12s ago" counter — NOT a fake "LIVE" indicator

ORDER BOOK — fix fabrication:
  CURRENT: Returns synthetic 145k/290k/85k bid/ask as real data
  TARGET:  { data_availability: "UNAVAILABLE",
             message_ar: "بيانات عمق السوق غير متاحة لبورصة مصر",
             derived_metrics: { relative_volume, estimated_spread_pct, liquidity_tier },
             is_derived: true }

SCREENER — fix hardcoded win rates:
  CURRENT: Returns 78/72/60 for all screener filters
  TARGET:  Real OOS win rate from research.backtest_runs (>= 30 trades)
           null if insufficient data — UI: "Insufficient data (N trades)"

INTRADAY — fix source relabeling:
  CURRENT: Yahoo-injected candles labeled as 'tradingview'
  TARGET:  Accurate source per segment + is_live_injected flag

TRADES — fix LAUNCH_DATE filter and badge fabrication:
  CURRENT: 998 pre-audit trades hidden; badges from hash when snapshot null
  TARGET:  All trades visible with model_version + look_ahead_flagged labels
           Badges only shown when features_snapshot.FIELD is not null
```

### Layer 22: Database

```
PRIMARY:    Supabase PostgreSQL
CACHE:      Upstash Redis (price cache TTL, rate limiting)
REMOVE:     CockroachDB (eliminate dual-write complexity)

KEY DESIGN:
  Bitemporal tables: INSERT-ONLY with effective_date + ingested_at
  Immutable records: Signal, TradePlan (after ACTIVE), MarketData
  JSONB for flexible schemas: evidence, features_snapshot, quality issues
  RLS enforced at schema level
  All secrets: environment variables ONLY (zero in source code)

QUARTERLY ROTATION PLAN:
  SUPABASE_SERVICE_ROLE_KEY, Telegram bot token,
  Upstash Redis credentials, Yahoo/TradingView user-agent strings
```

### Layer 23: Infrastructure / Deployment

```
COMPUTE TIERS:
  Vercel Serverless:  Frontend + API routes (stateless, read-heavy)
  GitHub Actions:     ALL production pipelines, scheduled and event-driven
  Upstash Redis:      Price cache (TTL 60s), rate limiting
  Supabase:           Database + Auth

ELIMINATING WINDOWS SPOF:
  CURRENT: Windows Task Scheduler runs critical pipelines (single point of failure)
  TARGET:  ALL critical jobs → GitHub Actions (primary)
           Windows machine → development environment ONLY
           Runbooks written for all pipelines with manual fallback procedures

FIXING VERCEL CRON TIMING BUG (AUDIT-REF: exit cron always skipped):
  CURRENT: Vercel cron fires 15:00 UTC = 18:00 Cairo; session gate rejects; 0 exits via cron
  TARGET:
    Option: Remove exit cron from Vercel entirely
    Exit monitoring → GH Actions (trade-monitor.yml)
    Schedule: every 30 min during 08:00-13:30 UTC (10:00-15:30 Cairo)
    No serverless 60s limit; no timing conflicts
    *** track-recommended-trades/route.ts cron REMOVED from vercel.json ***

GITHUB ACTIONS RELIABILITY:
  Each job: retry: 2 (retry on transient failures)
  All job logs: uploaded as artifacts on failure
  Status badges in README
  All workflow YAML documented with Egyptian market context comments

DEPLOYMENT ENVIRONMENTS:
  production: Vercel (main branch) + GH Actions (scheduled workflows)
  staging:    Vercel preview (PR branches) + no scheduled GH Actions
  development: localhost:3000 + local Python scripts

SECRET MANAGEMENT:
  Production: Vercel Environment Variables (encrypted at rest)
  CI/CD:      GitHub Actions Secrets
  Local dev:  .env.local (in .gitignore)
  Source code: ZERO secrets, ZERO credentials, ZERO hardcoded keys
```

---

## PART VI — DEPENDENCY GRAPH (NO CIRCULAR DEPENDENCIES)

```
+======================================================================+
|         TARGET DEPENDENCY GRAPH — WHO PUBLISHES, WHO CONSUMES        |
+======================================================================+

LEGEND: --> Synchronous   ==> Async/Scheduled   ··> Data dependency (reads from store)

L1  Data Layer (Supabase + Redis)        [Foundation — no upstream dependencies]
     Publishes: all tables

L2  Market Data Engine                   Depends on: L1 (write)
     External: EGX Bulletin, TradingView Scanner, Yahoo Finance
     Publishes: canonical.market_data, observability.pipeline_health

L3  Data Quality Engine                  Depends on: L1 (read canonical.market_data)
     Publishes: observability.quality_reports, observability.data_gaps, alerts

L4  Universe Engine                      Depends on: L1, L2, L3
     External: EGX Disclosures
     Publishes: canonical.assets, events.corporate_actions

L5  Sharia Engine                        Depends on: L1, L4
     External: EGX Shariah webpage (weekly)
     Publishes: compliance.sharia_assessments (INSERT-ONLY)

L6  Event/Catalyst Engine                Depends on: L1, L4
     External: EGX Disclosures, Almal.com, CBE
     Publishes: events.catalyst_events, events.news_articles

L7  Market Regime Engine                 Depends on: L1, L2
     Publishes: regimes.snapshots (INSERT-ONLY, per trading day)

L8  Analysis Engine                      Depends on: L1 (reads canonical.market_data)
     PURE: stateless functions — no DB writes required for live computation
     Optional: writes analytics.indicator_cache

L9  Microstructure Engine                Depends on: L1, L8
     Publishes: derived metrics only (honest labels; no fabrication)

L10 Opportunity Engine                   Depends on: L6, L7, L8, L9
     Publishes: signals.opportunities

L11 Strategy Engine                      Depends on: L1 (config.strategies, read-only)
     Human-gated writes to config.strategies

L12 Signal Engine                        Depends on: L10, L7, L8, L11
     ··> fundamentals.snapshots (point-in-time query)
     ··> canonical.market_data (historical candles)
     ··> events.catalyst_events
     ··> daily_investor_flows
     Publishes: signals.signals (IMMUTABLE after creation)

L13 Risk Engine                          Depends on: L1 (config.risk_parameters), L12
     ··> trades.positions (current open risk)
     ··> canonical.market_data (liquidity check)
     Publishes: position_size → TradePlan Engine (in-memory, not persisted)

L14 Regulatory Constraints               Depends on: L1 (config.egx_calendar, compliance.*)
     Pure validation layer — no DB writes

L15 TradePlan Engine                     Depends on: L12, L13, L14, L8
     Publishes: signals.trade_plans (IMMUTABLE after status=ACTIVE)

L16 Execution Integration                Depends on: L15
     Publishes: trades.trades (when user records fills or exit engine fires)

L17 Performance Engine                   Depends on: L1 (trades.*, trades.daily_pnl_snapshots)
     ··> performance.benchmark_returns (EGX30 TR)
     Publishes: performance.reports, performance.attribution

L18 Research/Backtesting                 Depends on: L1 (ALL historical data), L8, L11
     CRITICAL: reads only data up to backtest_date — DateGuard enforced
     Publishes: research.backtest_runs

L19 Learning Engine                      Depends on: L17, L18, L12 (feature snapshots)
     Publishes: research.proposed_changes (HUMAN approves; self-approval PROHIBITED)

L20 Observability                        Depends on: ALL layers (reads health from all)
     Publishes: alerts (Telegram, email)

L21 Frontend API                         Depends on: L1 (reads canonical, signals, trades, perf)
     ··> Upstash Redis (price cache)
     Publishes: HTTP responses to browsers

RULE: No layer reads from a layer above it (except Observability).
      This graph has ZERO circular dependencies.
```

---

## PART VII — FAILURE RESPONSE MATRIX

| Service | Failure Mode | Response | Alert Level | Fallback |
|---------|-------------|---------|------------|---------|
| EGX Bulletin ingestion | Site down | Log; increment counter | After 2 consecutive | TradingView TIER-2 |
| TradingView adapter | Blocked / rate limited | Log; increment counter | After 1 failure | Yahoo TIER-3 |
| Yahoo Finance v8 | 4xx / rate limited | Return null | No (minor) | DataGap recorded |
| Intraday 15m scrape | TV blocked mid-session | Skip interval | After 3 consecutive | Use last bar; no fabrication |
| Investor flows scrape | EGX PDF format changed | Exception + alert | CRITICAL (immediate) | No fallback; official data only |
| Signal engine | Model file missing | Fatal exception | CRITICAL (immediate) | No signals that day |
| Signal engine | DB unavailable | Retry 3× with backoff; abort | HIGH after 3 failures | No signals that day |
| Trade monitor | Price unavailable for asset | Skip that asset | No (minor) | Check next cycle |
| Trade monitor | DB unavailable | Retry 3×; abort | HIGH after failure | No exits until resolved |
| Exit engine | Duplicate exit attempt | Idempotency key; no-op | No | Natural (idempotent) |
| Performance analytics | No trades in period | Empty report with note | No | Valid empty report |
| Backtest run | Look-ahead detected | FAIL the run | CRITICAL (immediate) | Do NOT promote model |
| Supabase unavailable | Any pipeline | All fail; retry per SLA | CRITICAL if > 5 min | Manual runbook |
| Upstash Redis unavailable | Price cache miss | Fall back to DB read | No | Supabase direct read |
| Model health check | WR delta > 25pp vs backtest | Suspend signal generation | CRITICAL | Human review required to resume |

---

## PART VIII — TARGET ARCHITECTURE DIAGRAM

```
+==========================================================================================+
|                 TRADEORA EGX — PROFESSIONAL TARGET ARCHITECTURE                          |
|                 Status: TARGET (not yet implemented as of 2026-08-05)                    |
+==========================================================================================+

 USERS
 +-----------+   +-----------+   +-----------+
 | Retail    |   | Premium   |   | Admin     |
 | Browser   |   | Mobile    |   | Dashboard |
 +-----+-----+   +-----+-----+   +-----+-----+
       |               |               |
       +---------------+---------------+
                       | HTTPS
                       v
+==========================================================================================+
| L21: VERCEL FRONTEND + API (Next.js 16+, TypeScript, Stateless Serverless)             |
|                                                                                          |
| PAGES               READ APIs                     ADMIN APIs                           |
| /                   /api/market-movers             /api/admin/pipelines                |
| /stock/[sym]        /api/canonical-price           /api/admin/model-health             |
| /screener           /api/intraday (honest source)  /api/admin/approve-change           |
| /trades (all)       /api/orderbook (UNAVAILABLE)   /api/admin/quality-report          |
| /performance        /api/screener (real OOS WR)    /api/admin/backtest-runs           |
| /analytics          /api/news                                                          |
| /learning           /api/stream-prices (Redis-backed; NOT in-memory SSE)              |
|                                                                                          |
| API CONTRACT: { data, meta: { source, freshness_at, quality_score, is_estimated } }    |
| NULL IS TRUTH. NEVER FABRICATE. SOURCE LABEL ALWAYS ACCURATE. LABEL ALL ESTIMATED DATA.|
+==========================================================================================+
        |                                     |
        | Supabase SDK                         | Upstash Redis SDK
        v                                     v
+========================+          +===========================+
| L22: SUPABASE          |          | UPSTASH REDIS             |
| PostgreSQL             |          | price:{SYM}  TTL=60s      |
|                        |          | ratelimit:{IP}            |
| raw.*                  |          +===========================+
| canonical.*            |
| fundamentals.*         |          (Replaces broken in-memory
| events.*               |           livePriceStore singleton)
| compliance.*           |
| regimes.*              |
| signals.*              |
| trades.*               |
| performance.*          |
| research.*             |
| observability.*        |
| config.*               |
|                        |
| RLS: schema-level      |
| Secrets: env vars ONLY |
+========================+
        ^
        | read/write (Python SDK + Supabase JS SDK)
        |
+==========================================================================================+
| L23: GITHUB ACTIONS (ubuntu-latest — ALL production pipelines)                          |
|                                                                                          |
| DAILY PIPELINES (post-market, 15:00 UTC = 18:00 Cairo):                                |
|  +--------------------------------------------------------------------------------+    |
|  | L2: Market Data Engine                                                          |    |
|  |  EGXBulletinAdapter + TradingViewAdapter + YahooAdapter                         |    |
|  |  --> Normalization --> QualityGate --> SourcePriorityResolver                   |    |
|  |      --> canonical.market_data (one row per asset per date per source tier)     |    |
|  |  --> GapDetector --> observability.data_gaps + alert                            |    |
|  |  --> SourceHealthMonitor --> observability.pipeline_health                      |    |
|  +--------------------------------------------------------------------------------+    |
|  +--------------------------------------------------------------------------------+    |
|  | L3: Data Quality Engine                                                         |    |
|  |  --> observability.quality_reports                                              |    |
|  |  Alert if composite_score < 0.7                                                 |    |
|  +--------------------------------------------------------------------------------+    |
|  +--------------------------------------------------------------------------------+    |
|  | L6: Event/Catalyst Engine                                                       |    |
|  |  almal_scraper --> events.news_articles (Arabic NLP scored)                     |    |
|  |  egx_disclosures --> events.catalyst_events (classified + materiality scored)   |    |
|  |  flow_anomaly_detector --> catalyst if net foreign buy > 50M EGP               |    |
|  +--------------------------------------------------------------------------------+    |
|  +--------------------------------------------------------------------------------+    |
|  | L7: Market Regime Engine                                                        |    |
|  |  regime_detector.py --> regimes.snapshots (INSERT-ONLY, MARKET + top-50 assets)|    |
|  +--------------------------------------------------------------------------------+    |
|  +--------------------------------------------------------------------------------+    |
|  | L10-L15: Opportunity -> Signal -> Risk -> TradePlan                             |    |
|  |                                                                                 |    |
|  |  opportunity_engine.py                                                          |    |
|  |    Catalyst events + Regime + Technical readiness + Tradeability               |    |
|  |    --> signals.opportunities                                                    |    |
|  |                                                                                 |    |
|  |  signal_engine.py                                                               |    |
|  |    POINT-IN-TIME feature extraction (DateGuard enforced on all features)       |    |
|  |    XGBoost v6+ (no look-ahead) + Validated evidence stack                      |    |
|  |    Dynamic confidence (evidence-updated, not time-decayed)                     |    |
|  |    Signal gate: threshold varies by regime                                      |    |
|  |    --> signals.signals (IMMUTABLE — all fields frozen at creation)             |    |
|  |                                                                                 |    |
|  |  risk_engine.py                                                                 |    |
|  |    Position sizing, portfolio heat check, concentration check, liquidity check  |    |
|  |    Drawdown halt if portfolio DD >= 20%                                         |    |
|  |                                                                                 |    |
|  |  tradeplan_engine.py                                                            |    |
|  |    ATR-based levels (TP1, TP2, SL) computed ONCE and frozen                   |    |
|  |    EGX transaction costs embedded in rr_net_t1 and rr_net_t2                   |    |
|  |    --> signals.trade_plans (IMMUTABLE after status=ACTIVE)                     |    |
|  |                                                                                 |    |
|  |  Telegram alert for new HIGH conviction signals                                 |    |
|  +--------------------------------------------------------------------------------+    |
|                                                                                          |
| INTRADAY PIPELINES (every 15-30 min during session, 08:00-13:00 UTC):                 |
|  +--------------------------------------------------------------------------------+    |
|  | tv_intraday_scraper.py                                                          |    |
|  |  --> canonical.intraday_bars (source=tradingview_15m, accurate label)           |    |
|  |                                                                                 |    |
|  | price_cache_updater.py (every 30s)                                              |    |
|  |  GET prices from TradingView scanner                                            |    |
|  |  SET price:{SYM} in Upstash Redis TTL=60s                                       |    |
|  +--------------------------------------------------------------------------------+    |
|  +--------------------------------------------------------------------------------+    |
|  | Exit Engine (SINGLE CANONICAL — Python only)                                    |    |
|  |  exit_engine.py (every 30 min during session)                                   |    |
|  |  Reads: signals.trade_plans (ACTIVE), Upstash Redis price cache                |    |
|  |  Evaluates: SL | TP1 | TP2 | TrailingStop | RSI | MACD | EMA20 | Stale        |    |
|  |  Uses ORIGINAL plan levels — NEVER updates them                                 |    |
|  |  Writes: trades.trades (on exit), observability.pipeline_health                |    |
|  |  Sends: Telegram + web-push notification on exit                               |    |
|  |  *** Vercel cron track-recommended-trades REMOVED (18:00 Cairo timing bug) *** |    |
|  +--------------------------------------------------------------------------------+    |
|                                                                                          |
| WEEKLY PIPELINES (Sunday pre-market):                                                   |
|  +--------------------------------------------------------------------------------+    |
|  | L18: Backtesting/Research                                                       |    |
|  |  Walk-forward, DateGuard enforced, EGX costs applied, random baseline          |    |
|  |  Monte Carlo 10,000 runs, survivorship-bias-free universe                       |    |
|  |  --> research.backtest_runs                                                     |    |
|  |  HUMAN APPROVAL required before promoted_to_production = true                  |    |
|  +--------------------------------------------------------------------------------+    |
|  +--------------------------------------------------------------------------------+    |
|  | L17: Performance Analytics                                                      |    |
|  |  Annualized Sharpe (vs Egypt T-bill 27%), portfolio-level drawdown             |    |
|  |  EGX30 TR benchmark, net PnL after EGX transaction costs                       |    |
|  |  ALL historical trades included (with honest model_version labels)             |    |
|  |  --> performance.reports, performance.attribution                              |    |
|  +--------------------------------------------------------------------------------+    |
|  +--------------------------------------------------------------------------------+    |
|  | L19: Learning Engine                                                            |    |
|  |  Analyzes closed trade outcomes, feature drift, evidence source performance    |    |
|  |  --> research.proposed_changes (HUMAN APPROVAL REQUIRED for every change)      |    |
|  |  Cannot self-approve. Cannot modify risk params. Cannot promote models.        |    |
|  +--------------------------------------------------------------------------------+    |
+==========================================================================================+

EXTERNAL DATA SOURCES (honest source hierarchy):
  [TIER-1]  EGX Official (egx.com.eg)              --> L2, L4, L5, L6
  [TIER-1]  EGX Investor Flows (egx.com.eg/flows)  --> L6
  [TIER-2]  TradingView EGX Scanner                --> L2 (daily+intraday), price cache
  [TIER-3]  Yahoo Finance v8                       --> L2 (fallback)
  [NLP]     Almal.com Arabic news                  --> L6 (catalyst detection)

MONITORING:
  All pipelines --> observability.pipeline_health --> /admin/observability dashboard
  CRITICAL alerts: Telegram (immediate) + Email
  Source health: DOWN -> alert within 5 minutes
  Model health: live WR vs backtest WR -- suspend signals if delta > 25pp
```

---

## PART IX — EGX-SPECIFIC REQUIREMENTS SUMMARY

```
All of these distinguish the EGX platform from generic trading system templates:

  1. TIMEZONE: Egypt Standard Time = UTC+2 (NO DST)
     All cron jobs use UTC equivalents; verify annually
     Ramadan: shortened session hours (09:30-13:30 Cairo)

  2. MARKET CALENDAR: EGX has unique national/religious holidays
     config.egx_calendar is the single source of truth for all session gates
     Holiday types: NATIONAL | RELIGIOUS | RAMADAN_SHORT | EGX_TECHNICAL

  3. CIRCUIT BREAKERS: +-10% daily limits
     Signal tradeability check must account for this
     Stop losses must be outside today's limit range

  4. SHORT SELLING: Restricted (SBL for specific securities only)
     Default: SELL = EXIT existing longs
     Short signals only for SBL-eligible stocks (tracked in canonical.assets)

  5. SETTLEMENT: T+2
     Intraday exits only for explicitly marked day-trade strategies

  6. TRANSACTION COSTS (higher than Western markets):
     ~0.72% round trip minimum (commission + EGX fees + FRA + stamp duty)
     Must be embedded in every net R:R calculation and PnL

  7. LIQUIDITY: EGX has smaller universe and lower daily volume than US markets
     min_volume_egp = 500,000 EGP (minimum filter for signal generation)
     Position sizing: max 10% of avg daily volume

  8. DATA AVAILABILITY: No public Level 2 API
     Never fabricate bid/ask data
     Always label derived estimates as "مشتق" (derived)

  9. FUNDAMENTAL DATA: Quarterly EGX filings + Arabic disclosures
     Arabic NLP required for catalyst detection
     EGX filing calendar differs from SEC (no 10-Q equivalent)

  10. SHARIAH COMPLIANCE: Material for a significant segment of EGX investors
      EGX33 Shariah index tracked separately
      Purification ratios must be applied to dividend income for compliant portfolios
      Shariah status history tracked (INSERT-ONLY, bitemporal)

  11. BENCHMARK: EGX30 Total Return Index (including dividends)
      NOT just EGX30 index level (which ignores dividend returns)
      Risk-free rate: CBE T-bill rate (27% annualized as of 2026 — materially high)
      This makes Sharpe ratio very different from US context
```

---

## PART X — IMPLEMENTATION ROADMAP

```
ORDER: Security → Data Integrity → Signal Integrity → Risk/Performance → Observability → Intelligence

PHASE 0 — Critical Security & Data Fabrication Fixes (Hours to Days):
  [ ] Remove service role key from TypeScript source → env var
  [ ] Remove fabricated order book data → honest UNAVAILABLE response
  [ ] Remove hardcoded screener win rates (78/72/60) → null with honest label
  [ ] Remove LAUNCH_DATE filter → show all trades with model_version label
  [ ] Remove hash-based badge fabrication → badge only if snapshot has real data
  [ ] Fix Vercel exit cron: remove from vercel.json, move exit engine to GH Actions

PHASE 1 — Data Foundations (Weeks 1-3):
  [ ] Create config.egx_calendar (first-class entity, maintained annually)
  [ ] Implement observability.pipeline_health (source health monitor)
  [ ] Implement Data Quality Engine (quality gate, gap detection, Telegram alerts)
  [ ] Refactor Market Data Engine: normalize, quality-gate, source priority resolver
  [ ] Create fundamentals.snapshots as INSERT-ONLY bitemporal table
  [ ] Migrate investor flows from CockroachDB → Supabase (eliminate dual-DB)

PHASE 2 — Signal Integrity (Weeks 4-7):
  [ ] Fix point-in-time feature extraction (DateGuard on all feature functions)
  [ ] Make Signal IMMUTABLE after creation (stop daily TP/SL/prob overwrite)
  [ ] Remove SELL signals from BUY classifier output
  [ ] Implement evidence stack with per-source max_contribution cap
  [ ] Implement walk-forward backtesting with DateGuard + EGX cost model
  [ ] Run first clean walk-forward validation to establish true OOS win rate

PHASE 3 — Risk & Performance (Weeks 8-11):
  [ ] Implement Risk Engine (position sizing, portfolio heat, drawdown halt)
  [ ] Implement TradePlan as formal immutable entity (ATR levels + EGX costs)
  [ ] Implement trades.daily_pnl_snapshots (portfolio equity curve)
  [ ] Implement correct Performance Engine (annualized Sharpe, EGX30 TR, net costs)
  [ ] Show ALL historical trades with honest labeling (remove LAUNCH_DATE filter)

PHASE 4 — Observability & Reliability (Weeks 12-14):
  [ ] Implement /admin/observability health dashboard
  [ ] Implement Upstash Redis price cache (replace broken in-memory SSE)
  [ ] Implement model health check (weekly WR comparison; suspend if delta > 25pp)
  [ ] Implement Learning Engine proposal mechanism (HUMAN-GATE enforced)
  [ ] Write operational runbooks for all critical pipelines

PHASE 5 — Advanced Intelligence (Weeks 15+):
  [ ] Implement formal Opportunity Engine (separate from Signal)
  [ ] Implement Catalyst Intelligence lifecycle (full DETECTED→DECAYED tracking)
  [ ] Implement Market Regime Engine with versioned snapshots
  [ ] Implement dynamic confidence (evidence-updated, not time-decayed)
  [ ] Monte Carlo simulation for all accepted strategies
  [ ] Train dedicated SELL classifier (separate model from BUY)
```

---

*DOCUMENT: docs/03_EGX_TARGET_ARCHITECTURE.md*  
*Based on: 28-phase forensic audit (01_EGX_COMPREHENSIVE_AUDIT.md) + current architecture (02_EGX_CURRENT_ARCHITECTURE.md)*  
*Every design decision is traceable to an audit finding or EGX market constraint.*  
*This document describes what SHOULD be built — not what exists today.*  
*Generated: 2026-08-05T19:26 (Cairo Time)*  
