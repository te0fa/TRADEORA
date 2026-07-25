# TRADEORA DOMAIN EVENT CATALOG

**Document Reference:** `docs/DOMAIN_EVENT_CATALOG.md`  
**Version:** 1.0.0  
**Status:** CANONICAL BUSINESS DOMAIN EVENT SPECIFICATION  
**Effective Date:** July 21, 2026  
**Governance Authority:** Architecture Governance Board & Enterprise Business Architecture Board  
**Governing Document:** `docs/PROJECT_CONSTITUTION.md`  
**Subordinate To:** `docs/BUSINESS_DOMAIN_DISCOVERY.md`, `docs/UBIQUITOUS_LANGUAGE.md`, `docs/BUSINESS_CAPABILITY_MODEL.md`

---

## GOVERNING CONSTRAINTS AND ARCHITECTURAL PRINCIPLES

1. **Business Domain Modeling Only**: This catalog models exclusively **what happens inside Tradeora's business domain**, NOT how events are transported, stored, or processed technically.
2. **Zero Technology Leakage**: No references to technical message brokers, message queuing systems, message queues, event buses, microservices, databases, network integration interfaces, JSON schemas, network protocols, or technical infrastructure.
3. **Pure Business Language**: Every event describes an immutable business fact that has occurred, expressed in canonical business terms adhering strictly to `docs/UBIQUITOUS_LANGUAGE.md`.

---

# SECTION 1 — EVENT CATALOG FRAMEWORK

## 1.1 Purpose of the Domain Event Catalog

The Tradeora Domain Event Catalog is the authoritative architectural contract defining every business event that occurs across Tradeora's global multi-asset financial intelligence domain. A Domain Event represents a significant business state transition or real-world financial occurrence that has already taken place within the domain. 

The catalog serves five fundamental enterprise architecture functions:
1. **Business Contract Authority**: Defines the explicit business meaning, cause, consequence, and regulatory audit requirement of every event.
2. **Domain Boundary Decoupling**: Enables asynchronous, decoupled business interaction across Tradeora's Bounded Contexts as established in `docs/BUSINESS_DOMAIN_DISCOVERY.md` Section 18.
3. **Regulatory Audit Lineage**: Establishes immutable event chains for compliance reporting (FRA, CMA, SCA, SEC, FCA) and tamper-evident audit trails.
4. **AI Decision Traceability**: Provides causal lineage linking raw market events to downstream AI recommendations and confidence scores.
5. **Cross-Border Market Synchronization**: Standardizes temporal and regional event semantics across global financial exchanges operating in distinct timezones, currencies, and calendar rules.

---

## 1.2 Event Definition Standard

A **Domain Event** in Tradeora must satisfy six non-negotiable architectural criteria:

1. **Past Tense Record**: It records something that has already happened. It is an immutable historical fact (e.g., `PRICE_TICK_RECEIVED`, not `RECEIVE_PRICE_TICK`).
2. **Clear Business Trigger**: It is originated by an explicit business trigger—such as an exchange feed state change, corporate announcement, user action, Central Bank decision, or AI model inference.
3. **Observable Business Consequences**: It produces measurable state changes or downstream analytical implications for at least one business object or capability.
4. **Meaningful to Business Actors**: It is understood by business domain actors (Retail Investors, Traders, Portfolio Managers, Compliance Officers) without needing software engineering translation.
5. **NOT a Technical Log Message**: System diagnostic logs, garbage collection events, network retry attempts, database connection resets, and memory metrics are strictly EXCLUDED.
6. **NOT a UI State Change**: Mouse clicks, screen scrolling, tab switches, visual modal toggles, and client render cycles are strictly EXCLUDED.

---

## 1.3 Event Naming Convention

### Format Standard
All domain event names follow the strict format:
```
[DOMAIN_PREFIX]_[SUBJECT]_[VERB_PAST_TENSE]
```

### Formatting Rules
- **Language**: English `SCREAMING_SNAKE_CASE` exclusively.
- **Verb Tense**: Always past tense (`RECEIVED`, `BREACHED`, `ANNOUNCED`, `TRIGGERED`, `CANCELLED`).
- **Examples**:
  - `CORRECT`: `PRICE_TICK_RECEIVED`
  - `CORRECT`: `RISK_THRESHOLD_BREACHED`
  - `WRONG`: `RECEIVE_PRICE_TICK` (Imperative / Present Tense)
  - `WRONG`: `PriceTickReceived` (CamelCase)
  - `WRONG`: `PRICE_TICK` (Missing past tense verb)

### Domain Prefix Registry

| Prefix | Domain Name | Description |
| :--- | :--- | :--- |
| `MKT_` | Market Data | Real-time quotes, order books, OHLCV, market depth, data quality |
| `CAL_` | Market Calendar & Sessions | Exchange operational hours, trading sessions, holidays, emergency closures |
| `INST_` | Instrument Lifecycle | Security Master records, corporate listings, suspensions, delistings |
| `CORP_` | Corporate Actions | Cash/stock dividends, splits, mergers, rights issues, elections |
| `SETT_` | Settlement | Post-trade custody confirmation, T+N settlement cycles, failures |
| `RES_` | Financial Research | Equity research generation, DCF fair value models, factor scoring |
| `MAC_` | Macroeconomic | Central Bank rate decisions, CPI releases, economic calendar events |
| `AI_` | AI & Intelligence | Model predictions, sentiment scoring, reasoning chains, drift detection |
| `PORT_` | Portfolio | NAV calculations, position adjustments, asset allocation updates |
| `RISK_` | Risk | VaR calculations, concentration breaches, drawdown alerts |
| `ALRT_` | Alert & Notification | User alert triggers, notification dispatches, priority escalations |
| `REG_` | Regulatory | Short-selling bans, trading restrictions, position limits, compliance rules |
| `USER_` | User & Identity | Account registration, risk profiling, MFA status, session events |
| `SUB_` | Subscription & Entitlement | Plan upgrades, feature entitlement checks, trial expirations |
| `RPT_` | Reporting | Client report generation, PDF exports, performance summaries |
| `AUD_` | Audit | Compliance trail logging, evidence export, snapshot creations |
| `SYS_` | Platform System Operations | Data source failover, operational health, market coverage additions |
| `FX_` | Foreign Exchange | Spot rate updates, currency revaluations, FX cross conversions |
| `CRYP_` | Cryptocurrency | Digital asset network events, staking, cross-chain pricing |
| `XMKT_` | Cross-Market | Arbitrage detection, dual-listing spreads, market regime shifts |

---

## 1.4 Event ID Convention

### Format
Every domain event is assigned a permanent, unique identifier:
```
[PREFIX]-[NNN]
Examples: MKT-001 | CAL-003 | CORP-005 | RISK-002
```

### Architectural Rules
1. **Permanent Immutability**: Once assigned, an Event ID is never changed or reassigned under any circumstances.
2. **No Recycling**: Retired or deprecated Event IDs are permanently locked and never reused for future events.
3. **Version Control Rules**:
   - **MAJOR Version Increment** (e.g., `1.0` → `2.0`): Indicates a breaking change to the fundamental business meaning or semantics of the event.
   - **MINOR Version Increment** (e.g., `1.0` → `1.1`): Indicates an additive clarification or non-breaking addition of metadata fields.

---

## 1.5 Event Classification System

Every domain event carries six mandatory business classifications:

### 1. Business Criticality
- **Mission Critical**: Core financial operations depend on it. System cannot deliver basic value without it.
- **Business Critical**: Significant commercial or analytical impact if missing; core features degrade.
- **Operational**: Important for operational continuity, degrades gracefully without total failure.
- **Informational**: Enhances user experience or context; non-essential for core financial calculations.

### 2. Event Frequency
- **Ultra High**: Millions of events per day (e.g., Real-Time Exchange Price Ticks).
- **High**: Thousands of events per day (e.g., Technical Indicator Computations, Intraday Volatility Updates).
- **Medium**: Hundreds of events per day (e.g., News Sentiment Dispatches, User Watchlist Alerts).
- **Low**: Tens of events per day (e.g., Earnings Report Releases, Corporate Action Announcements).
- **Rare**: Once per week or less (e.g., Central Bank Rate Decisions, Market Holiday Declarations).
- **Scheduled**: Fixed calendar schedule (e.g., Session Opening Auction, End-of-Day Valuation Batch).

### 3. Ordering Sensitivity
- **Strict**: Events must be evaluated in exact sequence. Out-of-order processing invalidates business state (e.g., `PRE_OPEN` → `OPENING_AUCTION` → `CONTINUOUS`).
- **Causal**: Must follow its specific trigger event, but sequence relative to unrelated events is irrelevant (e.g., `CORPORATE_ACTION_ANNOUNCED` must precede `CORPORATE_ACTION_APPROVED`).
- **Independent**: Order of occurrence does not affect business validity (e.g., independent User Watchlist creation events).

### 4. Idempotency Requirement
- **Required**: Reprocessing the exact same event must produce an identical business state without duplicate side-effects. (e.g., A cash dividend payment event processed twice must NOT result in double cash credit to the portfolio).
- **Not Required**: Reprocessing does not risk duplicate financial state modification.

### 5. Event Severity
Every domain event carries an explicit **Business Severity** classification:
- **INFO**: Routine business operation (e.g., `PRICE_TICK_RECEIVED`, `SESSION_SEGMENT_STARTED`).
- **NOTICE**: Noteworthy operational occurrence requiring tracking (e.g., `PORTFOLIO_SHARED`, `TRIAL_ENDING_SOON`).
- **WARNING**: Potential business impact requiring user or advisor attention (e.g., `OUTLIER_PRICE_DETECTED`, `AI_MODEL_DRIFT_DETECTED`).
- **ERROR**: Business operation disrupted or validation failed (e.g., `PRICE_VALIDATION_FAILED`, `DATA_SOURCE_RELIABILITY_DEGRADED`).
- **CRITICAL**: Immediate business action required; capital at risk or regulatory compliance breach (e.g., `RISK_THRESHOLD_BREACHED`, `CIRCUIT_BREAKER_MARKET_L2_TRIGGERED`, `SETTLEMENT_FAILED`).

### 6. Event Source Confidence
Every event carries a **Source Confidence** classification declaring the authority of its originating source:

- **OFFICIAL_EXCHANGE**: Direct feed from an authorized, regulated stock exchange (e.g., EGX, NYSE, TADAWUL).
- **LICENSED_VENDOR**: Direct feed from a licensed market data vendor (e.g., Refinitiv, Bloomberg, FactSet).
- **REGULATED_BODY**: Official publishing body (e.g., Central Bank of Egypt, US Federal Reserve, FRA, SEC).
- **BROKER**: Licensed broker-dealer confirmation.
- **AI_GENERATED**: Produced by AI/ML processing, LLM synthesis, or algorithmic modeling.
- **CALCULATED**: Derived mathematically from verified primary inputs (e.g., Portfolio NAV, Black-Scholes Option Pricing).
- **ESTIMATED**: Analytical approximation carrying known statistical uncertainty (e.g., DCF Fair Value Range).
- **MANUAL_ENTRY**: Input manually by a human user or platform administrator.
- **UNKNOWN**: Origin cannot be independently verified.

#### GOVERNING SOURCE CONFIDENCE RULE:
> **Source Confidence dictates permissible event usage.**  
> An `AI_GENERATED` price estimate or signal must **NEVER** be treated as an `OFFICIAL_EXCHANGE` price tick.  
> All user-facing views displaying `ESTIMATED` or `AI_GENERATED` events must present explicit disclaimers and confidence intervals.

---

## 1.6 Canonical Event Metadata Standard

Every domain event in Tradeora MUST carry this mandatory 19-field metadata contract. No event may be defined without ALL fields.

```
═══════════════════════════════════════════════════════════════════════════════
CANONICAL EVENT METADATA CONTRACT
═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                [PREFIX-NNN]
EVENT NAME:              [DOMAIN_SUBJECT_VERB_PAST_TENSE]
VERSION:                 [MAJOR.MINOR]
STATUS:                  [Active / Planned / Deprecated / Retired]

OWNER DOMAIN:            [Domain Boundary from BDD Sec 18]
ORIGINATING CAPABILITY:  [Capability ID — Name from BCM]
BUSINESS OBJECT:         [Primary Business Object from BDD Sec 9]
MARKET CLASS:            [CLASS 1 (Exchange) / CLASS 2 (OTC) / CLASS 3 (Crypto) / CLASS 4 (Periodic) / CLASS 5 (Indices)]
ASSET CLASS:             [Equities / Fixed Income / FX / Crypto / Derivatives / Funds / Multi-Asset]

SOURCE CONFIDENCE:       [OFFICIAL_EXCHANGE / LICENSED_VENDOR / REGULATED_BODY / BROKER / AI_GENERATED / CALCULATED / ESTIMATED / MANUAL_ENTRY / UNKNOWN]
SEVERITY:                [INFO / NOTICE / WARNING / ERROR / CRITICAL]

TIME MODEL:
  Effective Time:        [ISO 8601 UTC timestamp when business event occurred in real world]
  Recorded Time:         [ISO 8601 UTC timestamp when platform recorded the event]
  Business Date:         [Exchange business trading date (YYYY-MM-DD)]
  Exchange Date:         [Local date in exchange timezone (YYYY-MM-DD)]
  Timezone ID:           [IANA Timezone String, e.g., Africa/Cairo, America/New_York]
  MIC Code:              [ISO 10383 Market Identifier Code or Proprietary Identifier]
  UTC Offset:            [Exchange UTC offset at time of event, e.g., +03:00]
  DST Active:            [YES / NO at time of event]

PRECISION:               [NANOSECOND / MICROSECOND / MILLISECOND / SECOND / MINUTE / DAY]
CLOCK SOURCE:            [EXCHANGE_CERTIFIED / GPS_SYNCHRONIZED / NTP_SYNCHRONIZED / SYSTEM_CLOCK]

IDEMPOTENCY KEY:         [Business deduplication key, e.g., ISIN + TransactionType + EffectiveDate + Amount]
CORRELATION ID:          [Business chain tracking token linking trigger event to downstream consequences]

RELATED EVENTS:
  PRECEDED BY:           [Event ID — Event Name]
  FOLLOWED BY:           [Event ID — Event Name]
  PART OF CHAIN:         [Chain ID — Chain Name from Section 4]
═══════════════════════════════════════════════════════════════════════════════
```

---

## 1.7 Universal Financial Event Taxonomy

This taxonomy classifies every domain event into a permanent, stable category.

### Category Summary Table

| Cat # | Category Name | Canonical Arabic Name | Purpose |
| :--- | :--- | :--- | :--- |
| **1** | Market Structure Events | أحداث هيكل السوق | Exchange onboarding, venue segment changes, market infrastructure setup |
| **2** | Market Calendar & Session Events | أحداث تقويم وجلسات السوق | Trading session openings, closes, holiday closures, emergency halts |
| **3** | Trading Status Events | أحداث حالة التداول | Instrument & market trading state transitions, circuit breakers |
| **4** | Market Data Events | أحداث بيانات السوق | Real-time ticks, order book depth, OHLCV summaries, index updates |
| **5** | Market Data Quality Events | أحداث جودة بيانات السوق | Validation failures, price corrections, latency spikes, data gaps |
| **6** | Instrument Lifecycle Events | أحداث دورة حياة الأداة المالية | Security master creations, listings, suspensions, splits, delistings |
| **7** | Corporate Action Events | أحداث الإجراءات المؤسسية | Dividends, stock splits, rights issues, mergers, shareholder elections |
| **8** | Settlement Events | أحداث التسوية | Post-trade confirmation, custody transfer, settlement failures |
| **9** | Fixed Income & Sukuk Events | أحداث الدخل الثابت والصكوك | Bond coupon payments, Sukuk profit distributions, maturity calls |
| **10** | Foreign Exchange Events | أحداث الصرف الأجنبي | Spot FX rate updates, currency revaluations, devaluation events |
| **11** | Cryptocurrency & Digital Assets | أحداث العملات المشفرة والأصول الرقمية | Crypto spot ticks, protocol hard forks, staking reward distributions |
| **12** | Derivatives Events | أحداث المشتقات المالية | Options expiry, futures roll dates, margin call threshold alerts |
| **13** | Fund & Periodic Asset Events | أحداث الصناديق والأصول الدورية | Mutual fund NAV publications, REIT valuation updates |
| **14** | Index & Benchmark Events | أحداث المؤشرات والمقاييس | Index rebalancing, benchmark weight shifts, index value publications |
| **15** | Financial Research Events | أحداث البحوث المالية | Equity research publications, DCF model updates, factor scores |
| **16** | Economic Calendar Events | أحداث التقويم الاقتصادي | Central Bank rate decisions, CPI inflation releases, GDP reports |
| **17** | AI & Intelligence Events | أحداث الذكاء الاصطناعي | AI model retraining, recommendation generation, model drift alerts |
| **18** | Portfolio Events | أحداث المحفظة الاستثمارية | NAV recalculations, position changes, base currency updates |
| **19** | Risk Events | أحداث المخاطر | VaR limit breaches, sector concentration warnings, stress test alerts |
| **20** | Alert & Notification Events | أحداث التنبيهات والإشعارات | User alert condition triggers, notification dispatching |
| **21** | User & Identity Events | أحداث المستخدم الهوية | Account onboarding, risk profile updates, MFA security changes |
| **22** | Subscription & Entitlements | أحداث الاشتراكات والصلاحيات | Tier upgrades, feature access gate checks, trial expirations |
| **23** | Regulatory Events | أحداث الضوابط التنظيمية | Short-selling bans, regulatory investigations, trading caps |
| **24** | Compliance & Audit Events | أحداث الامتثال التدقيق | Audit snapshot creations, log archive operations, evidence exports |
| **25** | Reporting Events | أحداث التقارير | Client performance report compilations, PDF export generations |
| **26** | Cross-Market Events | أحداث الأسواق المتقاطعة | Arbitrage signal detections, cross-asset correlation shifts |
| **27** | Platform Operations Events | أحداث عمليات المنصة | Data vendor feed failovers, market coverage activations |
| **28** | Administrative Events | أحداث الإدارة النظامية | System parameter adjustments, global feature flag toggles |

---

## 1.8 Trading Status State Machine

The Trading Status State Machine governs ALL events related to market and instrument operational states across Tradeora.

### State Machine Diagram

```
                 ┌─────────────────────────────────────────┐
                 │                PRE_OPEN                 │
                 └────────────────────┬────────────────────┘
                                      │
                                      ▼
                 ┌─────────────────────────────────────────┐
                 │             OPENING_AUCTION             │
                 └────────────────────┬────────────────────┘
                                      │
                                      ▼
   ┌───────────────────────────────────────────────────────────────────────┐
   │                              CONTINUOUS                               │
   └──────┬──────────────┬─────────────────┬──────────────┬─────────┬──────┘
          │              │                 │              │         │
          ▼              ▼                 ▼              ▼         ▼
    INTRADAY_AUCTION   HALTED     CIRCUIT_BREAKER_L1  SUSPENDED MAINTENANCE
          │              │                 │              │         │
          │              │ (Auto-Resume)   │ (30-Min Halt)│         │
          └──────────────┴────────┬────────┴──────────────┘         │
                                  │                                 │
                                  ▼                                 │
                             CONTINUOUS                             │
                                  │                                 │
                                  ▼                                 │
                         CIRCUIT_BREAKER_L2                         │
                                  │                                 │
                                  │ (Session Terminated)            │
                                  ▼                                 │
                           CLOSING_AUCTION ◄────────────────────────┘
                                  │
                                  ▼
                              POST_CLOSE
                                  │
                                  ▼
                           HOLIDAY / OFFLINE
```

### State Definitions

1. **PRE_OPEN**: Market accepting order cancellations and entries; no execution occurring.
2. **OPENING_AUCTION**: Price discovery phase; single price determination algorithm executing.
3. **CONTINUOUS**: Live continuous matching and execution session.
4. **INTRADAY_AUCTION**: Scheduled or volatility-triggered mid-session auction.
5. **CLOSING_AUCTION**: End-of-day price discovery session establishing official closing price.
6. **POST_CLOSE**: Extended after-hours trading session (where applicable).
7. **HALTED**: Short temporary halt (typically < 30 minutes) due to localized volatility; auto-resumes.
8. **SUSPENDED**: Regulatory or corporate halt requiring explicit regulatory reinstatement.
9. **CIRCUIT_BREAKER_L1**: Market-wide Level 1 threshold breached (e.g., EGX −5% on EGX30 → 30-minute market-wide halt).
10. **CIRCUIT_BREAKER_L2**: Market-wide Level 2 threshold breached (e.g., EGX −10% on EGX30 → session terminated for remainder of day).
11. **MAINTENANCE**: Planned exchange system maintenance window.
12. **HOLIDAY**: Official exchange calendar holiday.
13. **OFFLINE**: Unplanned emergency closure (e.g., technical failure or force majeure).
14. **DELISTED**: Instrument permanently removed from exchange trading.
15. **UNKNOWN**: Trading status cannot be determined due to data vendor interruption.

---

## 1.9 Time Precision Policy

Every domain event carries explicit time information in accordance with Tradeora's global financial time policy.

### Six Mandatory Time Fields
1. **UTC Timestamp**: ISO 8601 format ending in `Z` (e.g., `2026-07-21T10:30:00.123456Z`).
2. **Exchange Local Timestamp**: Local time in the exchange's home jurisdiction.
3. **IANA Timezone ID**: Exact IANA location string (e.g., `Africa/Cairo`, `Asia/Riyadh`, `America/New_York`). Offset abbreviations (EST, BST) are FORBIDDEN due to ambiguity.
4. **MIC Code / Proprietary ID**: ISO 10383 Market Identifier Code or verified crypto exchange identifier.
5. **Precision Declaration**: `NANOSECOND`, `MICROSECOND`, `MILLISECOND`, `SECOND`, `MINUTE`, or `DAY`.
6. **Clock Source**: `EXCHANGE_CERTIFIED`, `GPS_SYNCHRONIZED`, `NTP_SYNCHRONIZED`, or `SYSTEM_CLOCK`.

### Precision Requirements by Market Class
- **Class 1 (Exchange-Traded Equities/Bonds)**: `MILLISECOND` minimum (EGX); `MICROSECOND` / `NANOSECOND` for US/EU desks.
- **Class 2 (OTC / Forex)**: `MILLISECOND`.
- **Class 3 (Crypto Assets)**: `MILLISECOND` or `NANOSECOND` (Centralized Exchanges).
- **Class 4 (Periodic / Mutual Funds)**: `SECOND` or `DAY`.
- **Class 5 (Indices & Macro)**: `SECOND` or `DAY`.

### Daylight Saving Time (DST) Rules
- **Egypt (EGX / Africa/Cairo)**: DST is DYNAMIC. Historically suspended in 2011, reinstated in 2023. Event processors MUST look up DST status dynamically from IANA database—NEVER hardcode.
- **Saudi Arabia (TADAWUL / Asia/Riyadh)**: No DST (UTC+3 permanently).
- **UAE (DFM/ADX / Asia/Dubai)**: No DST (UTC+4 permanently).
- **Qatar (QSE / Asia/Qatar)**: No DST (UTC+3 permanently).
- **Kuwait (Boursa Kuwait / Asia/Kuwait)**: No DST (UTC+3 permanently).
- **United States (NYSE/NASDAQ / America/New_York)**: Standard DST rules (2nd Sunday March → 1st Sunday November).
- **United Kingdom / EU (LSE/XETRA / Europe/London, Europe/Berlin)**: Standard European DST rules (Last Sunday March → Last Sunday October).
- **Japan (TSE / Asia/Tokyo)**: No DST (UTC+9 permanently).
- **Crypto (Binance/Deribit)**: Pure UTC reference. No local timezone concept.

---

# SECTION 2 — GLOBAL MARKET SESSION MODEL

Tradeora maintains an explicit operational session model for 14 primary global and regional exchanges:

### 1. Egyptian Exchange (EGX)
- **MIC Code**: `XCAI`
- **Primary Timezone**: `Africa/Cairo` (Dynamic DST)
- **Session Hours**: Main Session: 10:00 – 14:30 EET/EEST. Discovery Session: 09:30 – 10:00.
- **Settlement Cycle**: Equities: T+2 (T+0/T+1 for intraday/same-day mechanisms). T-Bills: T+1.
- **Primary Regulatory Body**: Financial Regulatory Authority (FRA)
- **Applicable Calendar Exceptions**: `OFFICIAL_HOLIDAY`, `ELECTION_HOLIDAY`, `NATIONAL_MOURNING`, `EMERGENCY_CLOSURE`, `FORCE_MAJEURE`, `TECHNICAL_FAILURE`. *(Note: EGX 2011 2-week closure represents FORCE_MAJEURE + SECURITY_INCIDENT).*

### 2. Saudi Exchange (TADAWUL)
- **MIC Code**: `XSAU`
- **Primary Timezone**: `Asia/Riyadh` (UTC+3, No DST)
- **Session Hours**: Main Session: 10:00 – 15:00 AST. Opening Auction: 09:30 – 10:00.
- **Settlement Cycle**: T+2
- **Primary Regulatory Body**: Capital Market Authority (CMA)
- **Applicable Calendar Exceptions**: `OFFICIAL_HOLIDAY`, `NATIONAL_MOURNING`, `EMERGENCY_CLOSURE`.

### 3. Dubai Financial Market (DFM)
- **MIC Code**: `XDFM`
- **Primary Timezone**: `Asia/Dubai` (UTC+4, No DST)
- **Session Hours**: Main Session: 10:00 – 15:00 GST. Opening Auction: 09:30 – 10:00.
- **Settlement Cycle**: T+2
- **Primary Regulatory Body**: Securities and Commodities Authority (SCA)
- **Applicable Calendar Exceptions**: `OFFICIAL_HOLIDAY`, `NATIONAL_MOURNING`, `EMERGENCY_CLOSURE`.

### 4. Abu Dhabi Securities Exchange (ADX)
- **MIC Code**: `XADS`
- **Primary Timezone**: `Asia/Dubai` (UTC+4, No DST)
- **Session Hours**: Main Session: 10:00 – 15:00 GST.
- **Settlement Cycle**: T+2
- **Primary Regulatory Body**: Securities and Commodities Authority (SCA)
- **Applicable Calendar Exceptions**: `OFFICIAL_HOLIDAY`, `NATIONAL_MOURNING`.

### 5. Qatar Stock Exchange (QSE)
- **MIC Code**: `XQAT`
- **Primary Timezone**: `Asia/Qatar` (UTC+3, No DST)
- **Session Hours**: Main Session: 09:30 – 13:15 AST. Pre-Open: 09:00 – 09:30.
- **Settlement Cycle**: T+2
- **Primary Regulatory Body**: Qatar Financial Markets Authority (QFMA)
- **Applicable Calendar Exceptions**: `OFFICIAL_HOLIDAY`, `NATIONAL_MOURNING`.

### 6. Boursa Kuwait
- **MIC Code**: `XKUW`
- **Primary Timezone**: `Asia/Kuwait` (UTC+3, No DST)
- **Session Hours**: Premier Market: 09:00 – 12:45 AST.
- **Settlement Cycle**: T+2
- **Primary Regulatory Body**: Capital Markets Authority Kuwait (CMA)
- **Applicable Calendar Exceptions**: `OFFICIAL_HOLIDAY`, `NATIONAL_MOURNING`.

### 7. New York Stock Exchange (NYSE)
- **MIC Code**: `XNYS`
- **Primary Timezone**: `America/New_York` (US DST)
- **Session Hours**: Main Session: 09:30 – 16:00 EST/EDT. Pre-Market: 04:00 – 09:30.
- **Settlement Cycle**: T+1 (Transitioned May 2024)
- **Primary Regulatory Body**: Securities and Exchange Commission (SEC)
- **Applicable Calendar Exceptions**: `OFFICIAL_HOLIDAY`, `NATIONAL_MOURNING`, `WEATHER_CLOSURE`, `TECHNICAL_FAILURE`.

### 8. NASDAQ
- **MIC Code**: `XNAS`
- **Primary Timezone**: `America/New_York` (US DST)
- **Session Hours**: Main Session: 09:30 – 16:00 EST/EDT.
- **Settlement Cycle**: T+1
- **Primary Regulatory Body**: Securities and Exchange Commission (SEC)
- **Applicable Calendar Exceptions**: `OFFICIAL_HOLIDAY`, `WEATHER_CLOSURE`, `TECHNICAL_FAILURE`.

### 9. London Stock Exchange (LSE)
- **MIC Code**: `XLON`
- **Primary Timezone**: `Europe/London` (UK DST)
- **Session Hours**: Main Session: 08:00 – 16:30 GMT/BST.
- **Settlement Cycle**: T+2
- **Primary Regulatory Body**: Financial Conduct Authority (FCA)
- **Applicable Calendar Exceptions**: `OFFICIAL_HOLIDAY`, `NATIONAL_MOURNING`, `TECHNICAL_FAILURE`.

### 10. XETRA (Frankfurt)
- **MIC Code**: `XETR` *(Note: XETR is the electronic trading venue; XFRA represents Frankfurt floor)*
- **Primary Timezone**: `Europe/Berlin` (EU DST)
- **Session Hours**: Main Session: 09:00 – 17:30 CET/CEST.
- **Settlement Cycle**: T+2
- **Primary Regulatory Body**: Federal Financial Supervisory Authority (BaFin)
- **Applicable Calendar Exceptions**: `OFFICIAL_HOLIDAY`, `TECHNICAL_FAILURE`.

### 11. Tokyo Stock Exchange (TSE)
- **MIC Code**: `XTKS`
- **Primary Timezone**: `Asia/Tokyo` (UTC+9, No DST)
- **Session Hours**: Morning Segment: 09:00 – 11:30 JST. Lunch Break: 11:30 – 12:30 JST. Afternoon Segment: 12:30 – 15:30 JST.
- **Settlement Cycle**: T+2
- **Primary Regulatory Body**: Financial Services Agency (FSA Japan)
- **Applicable Calendar Exceptions**: `OFFICIAL_HOLIDAY`, `WEATHER_CLOSURE`, `TECHNICAL_FAILURE`.

### 12. Hong Kong Exchanges and Clearing (HKEX)
- **MIC Code**: `XHKG`
- **Primary Timezone**: `Asia/Hong_Kong` (UTC+8, No DST)
- **Session Hours**: Morning Segment: 09:30 – 12:00 HKT. Lunch Break: 12:00 – 13:00 HKT. Afternoon Segment: 13:00 – 16:00 HKT.
- **Settlement Cycle**: T+2
- **Primary Regulatory Body**: Securities and Futures Commission (SFC HK)
- **Applicable Calendar Exceptions**: `OFFICIAL_HOLIDAY`, `WEATHER_CLOSURE` (Typhoon closures).

### 13. Binance
- **Exchange Identifier**: `BINANCE` — *No official ISO 10383 MIC assigned. ISO 10383 does not cover crypto exchanges. Proprietary identifier used.*
- **Primary Timezone**: UTC
- **Session Hours**: Continuous 24/7/365.
- **Settlement Cycle**: Instant / T+0
- **Regulatory Jurisdiction**: Multi-jurisdictional / VARA Dubai / Global
- **Applicable Calendar Exceptions**: `TECHNICAL_FAILURE`, `SECURITY_INCIDENT`, `MAINTENANCE`.

### 14. Deribit
- **Exchange Identifier**: `DERIBIT` — *No official ISO 10383 MIC assigned.*
- **Primary Timezone**: UTC
- **Session Hours**: Continuous 24/7/365.
- **Settlement Cycle**: Instant / Daily Settlement (08:00 UTC)
- **Regulatory Jurisdiction**: VARA Dubai / Panama
- **Applicable Calendar Exceptions**: `TECHNICAL_FAILURE`, `SECURITY_INCIDENT`, `MAINTENANCE`.

---
## 3A — Market Structure Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                MKT-010
EVENT NAME:              MARKET_EXCHANGE_ONBOARDED
ARABIC NAME:             تم إدراج سوق مالية جديدة
TAXONOMY:                Category 1: Market Structure Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A new financial exchange venue has been officially onboarded to the Tradeora platform coverage. Security master records and calendar schedules are established.

CANONICAL EVENT METADATA:
  EVENT ID:                MKT-010
  EVENT NAME:              MARKET_EXCHANGE_ONBOARDED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Data Domain
  ORIGINATING CAPABILITY:  MKT-DAT-001 — Real-Time Data Ingestion
  BUSINESS OBJECT:         Exchange
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       REGULATED_BODY
  SEVERITY:                NOTICE

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ExchangeMIC + OnboardingDate
  CORRELATION ID:          CORR-MKT-ONBOARD

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           CAL_MARKET_CALENDAR_UPDATED
    PART OF CHAIN:         Chain 20: New Exchange Onboarding

TRIGGER: Platform Administrator configures new exchange metadata and licensing agreement
PRECONDITIONS: Exchange MIC code is verified against ISO 10383 database
POSTCONDITIONS: Exchange venue is active in platform Security Master and Market Calendar engines
BUSINESS RULES: Rule 27: Asset ticker symbols must be uniquely qualified by Exchange MIC code.
BUSINESS OBJECTS AFFECTED: Exchange object MODIFIED; Security Master CREATED
ORIGINATING CAPABILITY: MKT-DAT-001 — Real-Time Data Ingestion
CONSUMING CAPABILITIES: MKT-DAT-001 — Market Data Acquisition
POTENTIAL DOMAIN CONSUMERS: Security Master, Portfolio Tracking, Screening Engine

SEVERITY: NOTICE
SOURCE CONFIDENCE: REGULATED_BODY
BUSINESS CRITICALITY: Operational
EVENT FREQUENCY: Rare
ORDERING SENSITIVITY: Independent
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Market data licensing agreement must be active prior to onboarding
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX (XCAI) is baseline launch exchange onboarded in Phase 1
MARKET TIMEZONE NOTES: Local exchange operating hours apply
FORBIDDEN SYNONYMS: ADD_EXCHANGE, CREATE_MARKET
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                MKT-011
EVENT NAME:              VENUE_SEGMENT_MODIFIED
ARABIC NAME:             تم تعديل قطاع السوق
TAXONOMY:                Category 1: Market Structure Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An exchange operational trading segment structure has been modified by the exchange authority.

CANONICAL EVENT METADATA:
  EVENT ID:                MKT-011
  EVENT NAME:              VENUE_SEGMENT_MODIFIED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Data Domain
  ORIGINATING CAPABILITY:  MKT-DAT-001 — Real-Time Data Ingestion
  BUSINESS OBJECT:         Exchange
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ExchangeMIC + SegmentID + EffectiveDate
  CORRELATION ID:          CORR-VENUE-MOD

  RELATED EVENTS:
    PRECEDED BY:           MKT_EXCHANGE_ONBOARDED
    FOLLOWED BY:           CAL_SESSION_SEGMENT_STARTED
    PART OF CHAIN:         None

TRIGGER: Exchange publishes official market structure adjustment disclosure
PRECONDITIONS: Exchange MIC is registered on platform
POSTCONDITIONS: Session segment rules updated in Market Calendar engine
BUSINESS RULES: Rule 8: Market session hours derived from official local calendar.
BUSINESS OBJECTS AFFECTED: Exchange object MODIFIED
ORIGINATING CAPABILITY: MKT-DAT-001 — Real-Time Data Ingestion
CONSUMING CAPABILITIES: CAL-MKT-001 — Market Calendar Management
POTENTIAL DOMAIN CONSUMERS: Market Data Ingestion, Alert Engine

SEVERITY: INFO
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Operational
EVENT FREQUENCY: Rare
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Regulatory disclosure required for session structural changes
AUDIT REQUIREMENTS: RECOMMENDED
EGX-SPECIFIC NOTES: EGX operates single main session without lunch break
MARKET TIMEZONE NOTES: Local market hours govern
FORBIDDEN SYNONYMS: CHANGE_VENUE, UPDATE_SEGMENT
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                MKT-012
EVENT NAME:              ASSET_CLASS_ENABLED
ARABIC NAME:             تم تفعيل فئة أصول جديدة
TAXONOMY:                Category 1: Market Structure Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  Platform administration has enabled analytical and tracking coverage for a new financial asset class (e.g., REITs, Sukuk, Crypto Derivatives).

CANONICAL EVENT METADATA:
  EVENT ID:                MKT-012
  EVENT NAME:              ASSET_CLASS_ENABLED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Data Domain
  ORIGINATING CAPABILITY:  MKT-DAT-001 — Real-Time Data Ingestion
  BUSINESS OBJECT:         SecurityMaster
  MARKET CLASS:            ALL
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       MANUAL_ENTRY
  SEVERITY:                NOTICE

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         AssetClassName + EffectiveDate
  CORRELATION ID:          CORR-ASSET-ENABLE

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           MKT_SECURITY_MASTER_RECORD_CREATED
    PART OF CHAIN:         None

TRIGGER: Platform Governance Board approves new asset class deployment
PRECONDITIONS: Valuation and analytical models for target asset class are verified
POSTCONDITIONS: Asset class is active for user screening, portfolio tracking, and AI research
BUSINESS RULES: Rule 28: Asset classifications must conform to standard frameworks.
BUSINESS OBJECTS AFFECTED: SecurityMaster MODIFIED
ORIGINATING CAPABILITY: MKT-DAT-001 — Real-Time Data Ingestion
CONSUMING CAPABILITIES: MKT-DAT-001 — Market Data Acquisition
POTENTIAL DOMAIN CONSUMERS: Portfolio Management, AI Research Engine

SEVERITY: NOTICE
SOURCE CONFIDENCE: MANUAL_ENTRY
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Rare
ORDERING SENSITIVITY: Independent
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Regulatory disclaimers updated for newly enabled asset class
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX Equities and Treasury Bills enabled at Phase 1 launch
MARKET TIMEZONE NOTES: Global asset class rules apply
FORBIDDEN SYNONYMS: ENABLE_ASSET_TYPE, ACTIVATE_ASSET_CLASS
═══════════════════════════════════════════════════════════════════════════════
## 3B — Market Calendar and Session Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CAL-001
EVENT NAME:              SESSION_OPENED
ARABIC NAME:             افتتاح جلسة التداول
TAXONOMY:                Category 2: Market Calendar and Session Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An exchange trading session has officially transitioned into active trading status. Real-time quote streams and execution tracking are activated.

CANONICAL EVENT METADATA:
  EVENT ID:                CAL-001
  EVENT NAME:              SESSION_OPENED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Calendar Domain
  ORIGINATING CAPABILITY:  CAL-MKT-001 — Market Calendar Management
  BUSINESS OBJECT:         MarketSession
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities / Bonds

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ExchangeMIC + BusinessDate + SESSION_OPEN
  CORRELATION ID:          CORR-CAL-OPEN-001

  RELATED EVENTS:
    PRECEDED BY:           CAL_SESSION_SEGMENT_STARTED
    FOLLOWED BY:           MKT_PRICE_TICK_RECEIVED
    PART OF CHAIN:         Chain 1: Session Opening & Tick Ingestion

TRIGGER: Exchange official local clock reaches declared session opening time
PRECONDITIONS: Exchange calendar date is not an official holiday or declared closure date
POSTCONDITIONS: Market status set to CONTINUOUS; real-time alerts active
BUSINESS RULES: Rule 8: Market session hours derived from official local calendar.
BUSINESS OBJECTS AFFECTED: MarketSession MODIFIED
ORIGINATING CAPABILITY: CAL-MKT-001 — Market Calendar Management
CONSUMING CAPABILITIES: CAL-MKT-001 — Market Calendar Management
POTENTIAL DOMAIN CONSUMERS: Price Intelligence, Real-Time Alert Engine, Data Ingestion Router

SEVERITY: INFO
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Scheduled
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Session opening timestamps recorded for regulatory audit
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX Session Opens at 10:00 EET/EEST
MARKET TIMEZONE NOTES: Timezone Africa/Cairo with dynamic DST
FORBIDDEN SYNONYMS: OPEN_MARKET, MARKET_START
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CAL-002
EVENT NAME:              SESSION_CLOSED
ARABIC NAME:             إغلاق جلسة التداول
TAXONOMY:                Category 2: Market Calendar and Session Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An exchange trading session has concluded. Real-time intraday trading is deactivated and End-of-Day portfolio valuation batch begins.

CANONICAL EVENT METADATA:
  EVENT ID:                CAL-002
  EVENT NAME:              SESSION_CLOSED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Calendar Domain
  ORIGINATING CAPABILITY:  CAL-MKT-001 — Market Calendar Management
  BUSINESS OBJECT:         MarketSession
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities / Bonds

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ExchangeMIC + BusinessDate + SESSION_CLOSE
  CORRELATION ID:          CORR-CAL-CLOSE-001

  RELATED EVENTS:
    PRECEDED BY:           CAL_CLOSING_AUCTION_ENDED
    FOLLOWED BY:           MKT_EOD_PRICES_PUBLISHED
    PART OF CHAIN:         Chain 2: Session Closing & EOD Valuation

TRIGGER: Exchange official local clock reaches declared closing time
PRECONDITIONS: Market session was in active continuous or closing auction state
POSTCONDITIONS: Market status set to POST_CLOSE; EOD valuation batch initiated
BUSINESS RULES: Rule 8: Market session hours derived from official local calendar.
BUSINESS OBJECTS AFFECTED: MarketSession MODIFIED
ORIGINATING CAPABILITY: CAL-MKT-001 — Market Calendar Management
CONSUMING CAPABILITIES: CAL-MKT-001 — Market Calendar Management
POTENTIAL DOMAIN CONSUMERS: Portfolio Valuation Engine, EOD Processing Engine

SEVERITY: INFO
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Scheduled
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Official closing prices locked for daily regulatory valuation
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX Session Closes at 14:30 EET/EEST
MARKET TIMEZONE NOTES: Timezone Africa/Cairo with dynamic DST
FORBIDDEN SYNONYMS: CLOSE_MARKET, MARKET_END
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CAL-003
EVENT NAME:              SESSION_SEGMENT_STARTED
ARABIC NAME:             بدء شريحة الجلسة
TAXONOMY:                Category 2: Market Calendar and Session Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A specific session segment within a segmented trading market has commenced (e.g., Tokyo TSE Morning Segment 09:00 JST).

CANONICAL EVENT METADATA:
  EVENT ID:                CAL-003
  EVENT NAME:              SESSION_SEGMENT_STARTED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Calendar Domain
  ORIGINATING CAPABILITY:  CAL-MKT-001 — Market Calendar Management
  BUSINESS OBJECT:         MarketSession
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ExchangeMIC + BusinessDate + SegmentName + START
  CORRELATION ID:          CORR-SEG-START

  RELATED EVENTS:
    PRECEDED BY:           CAL_SESSION_OPENED
    FOLLOWED BY:           MKT_PRICE_TICK_RECEIVED
    PART OF CHAIN:         Chain 1: Session Opening & Tick Ingestion

TRIGGER: Exchange local time reaches declared segment start time
PRECONDITIONS: Market session is active for business date
POSTCONDITIONS: Market segment status set to Active
BUSINESS RULES: Rule 8: Session segment hours derived from exchange local calendar.
BUSINESS OBJECTS AFFECTED: MarketSession MODIFIED
ORIGINATING CAPABILITY: CAL-MKT-001 — Market Calendar Management
CONSUMING CAPABILITIES: CAL-MKT-001 — Market Calendar Management
POTENTIAL DOMAIN CONSUMERS: Data Ingestion Router, Price Intelligence

SEVERITY: INFO
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Operational
EVENT FREQUENCY: Scheduled
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Segment boundaries recorded for trade latency audit
AUDIT REQUIREMENTS: RECOMMENDED
EGX-SPECIFIC NOTES: Not applicable to EGX (single continuous session)
MARKET TIMEZONE NOTES: Applies to TSE (Japan), SSE (China)
FORBIDDEN SYNONYMS: START_SEGMENT, SEGMENT_OPEN
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CAL-004
EVENT NAME:              SESSION_SEGMENT_ENDED
ARABIC NAME:             انتهاء شريحة الجلسة
TAXONOMY:                Category 2: Market Calendar and Session Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A specific session segment within a segmented trading market has concluded (e.g., Tokyo TSE Lunch Break 11:30–12:30 JST).

CANONICAL EVENT METADATA:
  EVENT ID:                CAL-004
  EVENT NAME:              SESSION_SEGMENT_ENDED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Calendar Domain
  ORIGINATING CAPABILITY:  CAL-MKT-001 — Market Calendar Management
  BUSINESS OBJECT:         MarketSession
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ExchangeMIC + BusinessDate + SegmentName + END
  CORRELATION ID:          CORR-SEG-END

  RELATED EVENTS:
    PRECEDED BY:           CAL_SESSION_SEGMENT_STARTED
    FOLLOWED BY:           CAL_SESSION_SEGMENT_STARTED
    PART OF CHAIN:         None

TRIGGER: Exchange local time reaches declared segment end time
PRECONDITIONS: Session segment was active
POSTCONDITIONS: Market segment status set to Intermission / Paused
BUSINESS RULES: Rule 8: Session segment hours derived from exchange local calendar.
BUSINESS OBJECTS AFFECTED: MarketSession MODIFIED
ORIGINATING CAPABILITY: CAL-MKT-001 — Market Calendar Management
CONSUMING CAPABILITIES: CAL-MKT-001 — Market Calendar Management
POTENTIAL DOMAIN CONSUMERS: Data Ingestion Router

SEVERITY: INFO
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Operational
EVENT FREQUENCY: Scheduled
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Segment pause recorded in session history
AUDIT REQUIREMENTS: RECOMMENDED
EGX-SPECIFIC NOTES: Not applicable to EGX
MARKET TIMEZONE NOTES: Applies to TSE (Japan), SSE (China)
FORBIDDEN SYNONYMS: END_SEGMENT, SEGMENT_CLOSE
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CAL-005
EVENT NAME:              EXCHANGE_CALENDAR_EXCEPTION_DECLARED
ARABIC NAME:             إعلان استثناء تقويم السوق
TAXONOMY:                Category 2: Market Calendar and Session Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An official authority has declared a non-standard calendar exception for an exchange (e.g., holiday, election, mourning, emergency closure).

CANONICAL EVENT METADATA:
  EVENT ID:                CAL-005
  EVENT NAME:              EXCHANGE_CALENDAR_EXCEPTION_DECLARED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Calendar Domain
  ORIGINATING CAPABILITY:  CAL-MKT-001 — Market Calendar Management
  BUSINESS OBJECT:         MarketCalendar
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       REGULATED_BODY
  SEVERITY:                WARNING

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         ExchangeMIC + ExceptionDate + ExceptionType
  CORRELATION ID:          CORR-CAL-EXC

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           CAL_MARKET_CALENDAR_UPDATED
    PART OF CHAIN:         Chain 19: Emergency Market Closure & Reopening

TRIGGER: Government, Exchange, or Regulatory body issues official announcement
PRECONDITIONS: Target date is a valid calendar date
POSTCONDITIONS: Market calendar schedule updated; user notifications dispatched if applicable
BUSINESS RULES: Rule 30: Market holiday schedules updated in advance.
BUSINESS OBJECTS AFFECTED: MarketCalendar MODIFIED
ORIGINATING CAPABILITY: CAL-MKT-001 — Market Calendar Management
CONSUMING CAPABILITIES: CAL-MKT-001 — Market Calendar Management
POTENTIAL DOMAIN CONSUMERS: Alert Notification Engine, Data Ingestion Router

SEVERITY: WARNING
SOURCE CONFIDENCE: REGULATED_BODY
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Supports retroactive declaration for same-day emergency closures
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX 2011 2-week closure represents FORCE_MAJEURE + SECURITY_INCIDENT
MARKET TIMEZONE NOTES: Local timezone rules apply
FORBIDDEN SYNONYMS: DECLARE_HOLIDAY, MARKET_EXCEPTION
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CAL-006
EVENT NAME:              UNSCHEDULED_MARKET_CLOSURE_DECLARED
ARABIC NAME:             إعلان إغلاق طارئ غير مبرمج للسوق
TAXONOMY:                Category 2: Market Calendar and Session Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An exchange or regulatory authority has declared an immediate, unscheduled emergency market closure with no advance notice.

CANONICAL EVENT METADATA:
  EVENT ID:                CAL-006
  EVENT NAME:              UNSCHEDULED_MARKET_CLOSURE_DECLARED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Calendar Domain
  ORIGINATING CAPABILITY:  CAL-MKT-001 — Market Calendar Management
  BUSINESS OBJECT:         MarketSession
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                CRITICAL

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ExchangeMIC + BusinessDate + UNSCHEDULED_CLOSURE
  CORRELATION ID:          CORR-UNSCHED-CLOSE

  RELATED EVENTS:
    PRECEDED BY:           CAL_SESSION_OPENED
    FOLLOWED BY:           CAL_MARKET_STATUS_CHANGED
    PART OF CHAIN:         Chain 19: Emergency Market Closure & Reopening

TRIGGER: Emergency condition (civil unrest, severe technical outage, extreme systemic panic) occurs during live session
PRECONDITIONS: Market session was in active continuous trading state
POSTCONDITIONS: Market status immediately set to OFFLINE; trading halted; high-priority alerts dispatched
BUSINESS RULES: Rule 39: Session transitions log explicit state change events.
BUSINESS OBJECTS AFFECTED: MarketSession MODIFIED; Exchange object MODIFIED
ORIGINATING CAPABILITY: CAL-MKT-001 — Market Calendar Management
CONSUMING CAPABILITIES: CAL-MKT-001 — Market Calendar Management
POTENTIAL DOMAIN CONSUMERS: Platform Operations, Risk Assessment, Alert Engine

SEVERITY: CRITICAL
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Rare
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Immediate emergency regulatory disclosure required
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX closed unscheduled during 2011 Revolution
MARKET TIMEZONE NOTES: Local market timezone applies
FORBIDDEN SYNONYMS: EMERGENCY_HALT, UNANNOUNCED_CLOSURE
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CAL-007
EVENT NAME:              EMERGENCY_MARKET_REOPENING_ANNOUNCED
ARABIC NAME:             الإعلان عن إعادة فتح السوق الطارئ
TAXONOMY:                Category 2: Market Calendar and Session Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An exchange authority has officially announced the planned date and time for market session resumption following an unscheduled closure.

CANONICAL EVENT METADATA:
  EVENT ID:                CAL-007
  EVENT NAME:              EMERGENCY_MARKET_REOPENING_ANNOUNCED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Calendar Domain
  ORIGINATING CAPABILITY:  CAL-MKT-001 — Market Calendar Management
  BUSINESS OBJECT:         MarketCalendar
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                NOTICE

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         ExchangeMIC + ReopeningDate + AnnouncementTimestamp
  CORRELATION ID:          CORR-REOPEN-ANNOUNCE

  RELATED EVENTS:
    PRECEDED BY:           CAL_UNSCHEDULED_MARKET_CLOSURE_DECLARED
    FOLLOWED BY:           CAL_EMERGENCY_MARKET_REOPENED
    PART OF CHAIN:         Chain 19: Emergency Market Closure & Reopening

TRIGGER: Regulatory approval and market stability checks completed
PRECONDITIONS: Exchange market is currently in OFFLINE state
POSTCONDITIONS: Market calendar updated with target reopening window
BUSINESS RULES: Rule 30: Holiday schedules updated in advance.
BUSINESS OBJECTS AFFECTED: MarketCalendar MODIFIED
ORIGINATING CAPABILITY: CAL-MKT-001 — Market Calendar Management
CONSUMING CAPABILITIES: CAL-MKT-001 — Market Calendar Management
POTENTIAL DOMAIN CONSUMERS: Data Ingestion Router, User Notification Engine

SEVERITY: NOTICE
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Rare
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Official announcement document logged for audit
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX announced reopening date prior to resumption in 2011
MARKET TIMEZONE NOTES: Exchange local timezone applies
FORBIDDEN SYNONYMS: ANNOUNCE_REOPENING, SCHEDULE_RESUMPTION
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CAL-008
EVENT NAME:              EMERGENCY_MARKET_REOPENED
ARABIC NAME:             تأكيد إعادة فتح السوق الطارئ
TAXONOMY:                Category 2: Market Calendar and Session Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An exchange confirms actual resumption of live trading following an unscheduled closure period.

CANONICAL EVENT METADATA:
  EVENT ID:                CAL-008
  EVENT NAME:              EMERGENCY_MARKET_REOPENED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Calendar Domain
  ORIGINATING CAPABILITY:  CAL-MKT-001 — Market Calendar Management
  BUSINESS OBJECT:         MarketSession
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                NOTICE

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ExchangeMIC + BusinessDate + REOPENED_CONFIRM
  CORRELATION ID:          CORR-REOPEN-CONFIRM

  RELATED EVENTS:
    PRECEDED BY:           CAL_EMERGENCY_MARKET_REOPENING_ANNOUNCED
    FOLLOWED BY:           CAL_MARKET_STATUS_CHANGED
    PART OF CHAIN:         Chain 19: Emergency Market Closure & Reopening

TRIGGER: Exchange opening auction succeeds and continuous trading commences
PRECONDITIONS: Exchange was previously OFFLINE
POSTCONDITIONS: Market status set to CONTINUOUS; regular streaming feeds active
BUSINESS RULES: Rule 39: Session transitions log explicit state change events.
BUSINESS OBJECTS AFFECTED: MarketSession MODIFIED
ORIGINATING CAPABILITY: CAL-MKT-001 — Market Calendar Management
CONSUMING CAPABILITIES: CAL-MKT-001 — Market Calendar Management
POTENTIAL DOMAIN CONSUMERS: Data Ingestion Router, Price Intelligence

SEVERITY: NOTICE
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Rare
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Regulatory notification confirmed
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX resumed trading March 2011 following 2-week closure
MARKET TIMEZONE NOTES: Exchange local timezone applies
FORBIDDEN SYNONYMS: CONFIRM_REOPENING, RESUME_MARKET
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CAL-009
EVENT NAME:              DAYLIGHT_SAVING_TIME_TRANSITION_APPLIED
ARABIC NAME:             تطبيق انتقال التوقيت الصيفي
TAXONOMY:                Category 2: Market Calendar and Session Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An IANA timezone database transition has occurred (DST onset or offset), shifting local session opening/closing hours relative to UTC.

CANONICAL EVENT METADATA:
  EVENT ID:                CAL-009
  EVENT NAME:              DAYLIGHT_SAVING_TIME_TRANSITION_APPLIED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Calendar Domain
  ORIGINATING CAPABILITY:  CAL-MKT-001 — Market Calendar Management
  BUSINESS OBJECT:         MarketCalendar
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       REGULATED_BODY
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         IANA_Timezone + TransitionDate
  CORRELATION ID:          CORR-DST-TRANS

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           CAL_MARKET_CALENDAR_UPDATED
    PART OF CHAIN:         None

TRIGGER: IANA timezone database rules execute transition date
PRECONDITIONS: Exchange jurisdiction observes DST transition
POSTCONDITIONS: Exchange UTC Offset and DST Active metadata updated in Market Calendar
BUSINESS RULES: Rule 8: Market session hours derived from official local calendar.
BUSINESS OBJECTS AFFECTED: MarketCalendar MODIFIED
ORIGINATING CAPABILITY: CAL-MKT-001 — Market Calendar Management
CONSUMING CAPABILITIES: CAL-MKT-001 — Market Calendar Management
POTENTIAL DOMAIN CONSUMERS: Price Intelligence, Data Ingestion Router

SEVERITY: INFO
SOURCE CONFIDENCE: REGULATED_BODY
BUSINESS CRITICALITY: Operational
EVENT FREQUENCY: Scheduled
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: DST transition verified against official government decrees
AUDIT REQUIREMENTS: RECOMMENDED
EGX-SPECIFIC NOTES: Egypt DST transitions dynamically (April / October). MUST derive from IANA DB.
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: APPLY_DST, TIMEZONE_SHIFT
═══════════════════════════════════════════════════════════════════════════════
## 3C — Trading Status Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CAL-010
EVENT NAME:              MARKET_STATUS_CHANGED
ARABIC NAME:             تغير حالة السوق
TAXONOMY:                Category 3: Trading Status Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  The operational trading status of a market venue or instrument has transitioned from one defined state to another (carrying from_state, to_state, reason, authority).

CANONICAL EVENT METADATA:
  EVENT ID:                CAL-010
  EVENT NAME:              MARKET_STATUS_CHANGED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Calendar Domain
  ORIGINATING CAPABILITY:  CAL-MKT-001 — Market Calendar Management
  BUSINESS OBJECT:         MarketSession
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                NOTICE

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ExchangeMIC + BusinessDate + FromState + ToState
  CORRELATION ID:          CORR-STAT-CHG

  RELATED EVENTS:
    PRECEDED BY:           CAL_SESSION_OPENED
    FOLLOWED BY:           None
    PART OF CHAIN:         None

TRIGGER: Exchange operational trigger or regulatory command issued
PRECONDITIONS: From_state is a valid state in Section 1.8 Trading Status State Machine
POSTCONDITIONS: Market session status updated to To_state
BUSINESS RULES: Rule 39: Market session transitions log explicit state change events.
BUSINESS OBJECTS AFFECTED: MarketSession MODIFIED
ORIGINATING CAPABILITY: CAL-MKT-001 — Market Calendar Management
CONSUMING CAPABILITIES: CAL-MKT-001 — Market Calendar Management
POTENTIAL DOMAIN CONSUMERS: Data Ingestion Router, Real-Time Alert Engine

SEVERITY: NOTICE
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: High
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: State transitions logged for exchange surveillance compliance
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX status changes broadcast live to platform clients
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: CHANGE_STATUS, STATE_TRANSITION
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CAL-011
EVENT NAME:              CIRCUIT_BREAKER_INDIVIDUAL_TRIGGERED
ARABIC NAME:             تفعيل قاطع الدورة الفردي للأداة المالية
TAXONOMY:                Category 3: Trading Status Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An individual security price movement has crossed exchange volatility threshold limits, triggering a temporary single-instrument trading halt.

CANONICAL EVENT METADATA:
  EVENT ID:                CAL-011
  EVENT NAME:              CIRCUIT_BREAKER_INDIVIDUAL_TRIGGERED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Calendar Domain
  ORIGINATING CAPABILITY:  CAL-MKT-001 — Market Calendar Management
  BUSINESS OBJECT:         Instrument
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                WARNING

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ISIN + EffectiveTimestamp + PriceThreshold
  CORRELATION ID:          CORR-CB-IND

  RELATED EVENTS:
    PRECEDED BY:           MKT_PRICE_TICK_RECEIVED
    FOLLOWED BY:           CAL_CIRCUIT_BREAKER_RESET
    PART OF CHAIN:         Chain 17: Instrument Suspension & Reinstatement

TRIGGER: Real-time executed price tick deviates beyond exchange intraday volatility limit (e.g., ±5% or ±10%)
PRECONDITIONS: Instrument was in CONTINUOUS trading state
POSTCONDITIONS: Instrument trading status set to HALTED; limit order matching paused
BUSINESS RULES: Rule 36: Stop-loss and risk alerts present clear visual severity distinctions.
BUSINESS OBJECTS AFFECTED: Instrument MODIFIED
ORIGINATING CAPABILITY: CAL-MKT-001 — Market Calendar Management
CONSUMING CAPABILITIES: CAL-MKT-001 — Market Calendar Management
POTENTIAL DOMAIN CONSUMERS: Alert Notification Engine, Watchlist Management

SEVERITY: WARNING
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Medium
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Volatility halt duration governed by exchange trading rules
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX enforces price cap volatility auctions per stock
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: STOCK_HALT, VOLATILITY_HALT
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CAL-012
EVENT NAME:              CIRCUIT_BREAKER_MARKET_L1_TRIGGERED
ARABIC NAME:             تفعيل قاطع الدورة للسوق — المستوى الأول
TAXONOMY:                Category 3: Trading Status Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A market-wide Level 1 halt threshold has been breached (e.g., EGX30 index drops −5%), triggering a mandatory 30-minute market-wide trading halt.

CANONICAL EVENT METADATA:
  EVENT ID:                CAL-012
  EVENT NAME:              CIRCUIT_BREAKER_MARKET_L1_TRIGGERED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Calendar Domain
  ORIGINATING CAPABILITY:  CAL-MKT-001 — Market Calendar Management
  BUSINESS OBJECT:         Exchange
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                CRITICAL

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ExchangeMIC + BusinessDate + L1_TRIGGER
  CORRELATION ID:          CORR-CB-L1

  RELATED EVENTS:
    PRECEDED BY:           MKT_INDEX_VALUE_PUBLISHED
    FOLLOWED BY:           CAL_CIRCUIT_BREAKER_RESET
    PART OF CHAIN:         None

TRIGGER: Primary exchange market index crosses Level 1 halt threshold
PRECONDITIONS: Market was in CONTINUOUS trading session
POSTCONDITIONS: Market status set to CIRCUIT_BREAKER_L1; all order execution halted across exchange for 30 minutes
BUSINESS RULES: Rule 39: Market session transitions log explicit state change events.
BUSINESS OBJECTS AFFECTED: Exchange MODIFIED; MarketSession MODIFIED
ORIGINATING CAPABILITY: CAL-MKT-001 — Market Calendar Management
CONSUMING CAPABILITIES: CAL-MKT-001 — Market Calendar Management
POTENTIAL DOMAIN CONSUMERS: Alert Engine, Portfolio Risk Engine, Admin Ops

SEVERITY: CRITICAL
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Rare
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Mandatory regulatory audit notification to FRA / SEC
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX Rule: EGX30 drops 5% → mandatory 30-minute market halt
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: MARKET_HALT_L1, LEVEL_1_BREACH
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CAL-013
EVENT NAME:              CIRCUIT_BREAKER_MARKET_L2_TRIGGERED
ARABIC NAME:             تفعيل قاطع الدورة للسوق — المستوى الثاني
TAXONOMY:                Category 3: Trading Status Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A market-wide Level 2 halt threshold has been breached (e.g., EGX30 index drops −10%), terminating the trading session for the remainder of the business day.

CANONICAL EVENT METADATA:
  EVENT ID:                CAL-013
  EVENT NAME:              CIRCUIT_BREAKER_MARKET_L2_TRIGGERED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Calendar Domain
  ORIGINATING CAPABILITY:  CAL-MKT-001 — Market Calendar Management
  BUSINESS OBJECT:         Exchange
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                CRITICAL

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ExchangeMIC + BusinessDate + L2_TRIGGER
  CORRELATION ID:          CORR-CB-L2

  RELATED EVENTS:
    PRECEDED BY:           CAL_CIRCUIT_BREAKER_MARKET_L1_TRIGGERED
    FOLLOWED BY:           CAL_SESSION_CLOSED
    PART OF CHAIN:         None

TRIGGER: Primary exchange market index crosses Level 2 halt threshold following or independent of L1 breach
PRECONDITIONS: Market was in continuous or resumed session state
POSTCONDITIONS: Market status set to CIRCUIT_BREAKER_L2; session terminated for business date; EOD batch initiated
BUSINESS RULES: Rule 39: Market session transitions log explicit state change events.
BUSINESS OBJECTS AFFECTED: Exchange MODIFIED; MarketSession MODIFIED
ORIGINATING CAPABILITY: CAL-MKT-001 — Market Calendar Management
CONSUMING CAPABILITIES: CAL-MKT-001 — Market Calendar Management
POTENTIAL DOMAIN CONSUMERS: Portfolio Valuation Engine, EOD Processing

SEVERITY: CRITICAL
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Rare
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Emergency market termination report filed with regulator
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX Rule: EGX30 drops 10% → trading session terminated for remainder of day
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: MARKET_HALT_L2, SESSION_TERMINATED_CB
═══════════════════════════════════════════════════════════════════════════════
## 3D — Market Data Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                MKT-001
EVENT NAME:              PRICE_TICK_RECEIVED
ARABIC NAME:             استلام لقطة السعر
TAXONOMY:                Category 4: Market Data Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A new executed trade price or quote tick has been ingested from an authorized exchange feed.

CANONICAL EVENT METADATA:
  EVENT ID:                MKT-001
  EVENT NAME:              PRICE_TICK_RECEIVED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Data Domain
  ORIGINATING CAPABILITY:  MKT-DAT-001 — Real-Time Data Ingestion
  BUSINESS OBJECT:         Price
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities / Bonds / FX

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ISIN + EffectiveTimestamp + ExecutionPrice + Volume
  CORRELATION ID:          CORR-TICK-001

  RELATED EVENTS:
    PRECEDED BY:           CAL_SESSION_OPENED
    FOLLOWED BY:           MKT_TECHNICAL_INDICATOR_COMPUTED
    PART OF CHAIN:         Chain 1: Session Opening & Tick Ingestion

TRIGGER: Exchange broadcasts executed trade or quote update
PRECONDITIONS: Market session is active and price tick passes validation rules
POSTCONDITIONS: Asset current market price and intraday volume updated
BUSINESS RULES: Rule 5: A position cannot be valued without a verified price source and timestamp.
BUSINESS OBJECTS AFFECTED: Price CREATED; Instrument MODIFIED
ORIGINATING CAPABILITY: MKT-DAT-001 — Real-Time Data Ingestion
CONSUMING CAPABILITIES: MKT-DAT-001 — Real-Time Data Ingestion
POTENTIAL DOMAIN CONSUMERS: Price Intelligence, Real-Time Alert Engine, Portfolio NAV Engine

SEVERITY: INFO
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Ultra High
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Real-time quote stream licensing rules enforced
AUDIT REQUIREMENTS: RECOMMENDED
EGX-SPECIFIC NOTES: EGX price ticks ingested with millisecond precision
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: TICK_RECEIVED, QUOTE_UPDATE
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                MKT-002
EVENT NAME:              EOD_PRICES_PUBLISHED
ARABIC NAME:             نشر أسعار إغلاق نهاية اليوم
TAXONOMY:                Category 4: Market Data Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  Official exchange closing prices, daily high/low, and total turnover summary published by exchange.

CANONICAL EVENT METADATA:
  EVENT ID:                MKT-002
  EVENT NAME:              EOD_PRICES_PUBLISHED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Data Domain
  ORIGINATING CAPABILITY:  MKT-DAT-001 — Real-Time Data Ingestion
  BUSINESS OBJECT:         Price
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities / Bonds

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ExchangeMIC + BusinessDate + EOD_PUBLISH
  CORRELATION ID:          CORR-EOD-001

  RELATED EVENTS:
    PRECEDED BY:           CAL_SESSION_CLOSED
    FOLLOWED BY:           PORT_PORTFOLIO_NAV_RECALCULATED
    PART OF CHAIN:         Chain 2: Session Closing & EOD Valuation

TRIGGER: Exchange closing auction completes and official closing prices calculated
PRECONDITIONS: Market session is in POST_CLOSE state
POSTCONDITIONS: Official EOD price record appended to historical price series; portfolio daily returns calculated
BUSINESS RULES: Rule 2: Historical market data is immutable once recorded; corrections appended as records.
BUSINESS OBJECTS AFFECTED: Price CREATED; HistoricalSeries MODIFIED
ORIGINATING CAPABILITY: MKT-DAT-001 — Real-Time Data Ingestion
CONSUMING CAPABILITIES: MKT-DAT-001 — Market Data Ingestion
POTENTIAL DOMAIN CONSUMERS: Portfolio Valuation Service, Performance Analytics

SEVERITY: INFO
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Scheduled
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Official exchange EOD prices form legal portfolio accounting basis
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX publishes official daily EOD price file post 14:30
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: CLOSING_PRICES_PUBLISHED, DAILY_EOD_LOCK
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                MKT-003
EVENT NAME:              SECURITY_MASTER_RECORD_CREATED
ARABIC NAME:             إنشاء سجل الأداة المالية الرئيسي
TAXONOMY:                Category 4: Market Data Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A new security record (ISIN, ticker, issuer, sector, asset class) has been created in the platform Security Master.

CANONICAL EVENT METADATA:
  EVENT ID:                MKT-003
  EVENT NAME:              SECURITY_MASTER_RECORD_CREATED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Data Domain
  ORIGINATING CAPABILITY:  MKT-DAT-001 — Real-Time Data Ingestion
  BUSINESS OBJECT:         SecurityMaster
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       REGULATED_BODY
  SEVERITY:                NOTICE

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         ISIN + PrimaryMIC
  CORRELATION ID:          CORR-SEC-CREATE

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           INST_INSTRUMENT_ACTIVATED
    PART OF CHAIN:         None

TRIGGER: Issuer completes IPO filing or regulatory listing approval
PRECONDITIONS: ISIN code is unique in Security Master database
POSTCONDITIONS: SecurityMaster record created; pending activation for live trading
BUSINESS RULES: Rule 27: Asset ticker symbols must be uniquely qualified by Exchange MIC code.
BUSINESS OBJECTS AFFECTED: SecurityMaster CREATED
ORIGINATING CAPABILITY: MKT-DAT-001 — Real-Time Data Ingestion
CONSUMING CAPABILITIES: MKT-DAT-001 — Market Data Ingestion
POTENTIAL DOMAIN CONSUMERS: Security Master Management, Screening Engine

SEVERITY: NOTICE
SOURCE CONFIDENCE: REGULATED_BODY
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: ISIN and regulatory listing prospectus validated
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX new listing filings ingested via FRA disclosures
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: NEW_SECURITY_ADDED, REGISTER_INSTRUMENT
═══════════════════════════════════════════════════════════════════════════════
## 3E — Market Data Quality Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                MKT-020
EVENT NAME:              PRICE_VALIDATION_FAILED
ARABIC NAME:             فشل التحقق من صحة السعر
TAXONOMY:                Category 5: Market Data Quality Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An incoming price tick failed statistical or business validation rules (e.g., price is 500% above previous close—statistically impossible).

CANONICAL EVENT METADATA:
  EVENT ID:                MKT-020
  EVENT NAME:              PRICE_VALIDATION_FAILED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Data Quality Domain
  ORIGINATING CAPABILITY:  MKT-DAT-001 — Real-Time Data Ingestion
  BUSINESS OBJECT:         Price
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       LICENSED_VENDOR
  SEVERITY:                ERROR

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         ISIN + Timestamp + RawPrice
  CORRELATION ID:          CORR-QUAL-ERR-001

  RELATED EVENTS:
    PRECEDED BY:           MKT_PRICE_TICK_RECEIVED
    FOLLOWED BY:           MKT_OUTLIER_PRICE_DETECTED
    PART OF CHAIN:         Chain 16: Market Data Quality Failure

TRIGGER: Incoming tick fails plausibility band or zero-price check
PRECONDITIONS: Raw price tick received from vendor feed
POSTCONDITIONS: Corrupted price tick is REJECTED and discarded; operational alert flagged
BUSINESS RULES: Rule 5: A position cannot be valued without a verified price source.
BUSINESS OBJECTS AFFECTED: Price REJECTED (Not stored)
ORIGINATING CAPABILITY: MKT-DAT-001 — Real-Time Data Ingestion
CONSUMING CAPABILITIES: MKT-DAT-001 — Real-Time Data Ingestion
POTENTIAL DOMAIN CONSUMERS: Data Quality Engine, Platform Health Monitoring

SEVERITY: ERROR
SOURCE CONFIDENCE: LICENSED_VENDOR
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Independent
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Rejected data logs retained for vendor SLA review
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Protects EGX portfolio valuations from bad feed ticks
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: INVALID_PRICE, TICK_REJECTED
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                MKT-021
EVENT NAME:              PRICE_CORRECTED
ARABIC NAME:             تصحيح سعر رسمي
TAXONOMY:                Category 5: Market Data Quality Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An exchange or data vendor has published an official correction for a previously published price tick or closing price.

CANONICAL EVENT METADATA:
  EVENT ID:                MKT-021
  EVENT NAME:              PRICE_CORRECTED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Data Quality Domain
  ORIGINATING CAPABILITY:  MKT-DAT-001 — Real-Time Data Ingestion
  BUSINESS OBJECT:         Price
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                WARNING

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ISIN + BusinessDate + OriginalPrice + CorrectedPrice
  CORRELATION ID:          CORR-PRICE-CORR

  RELATED EVENTS:
    PRECEDED BY:           MKT_EOD_PRICES_PUBLISHED
    FOLLOWED BY:           PORT_PORTFOLIO_NAV_RECALCULATED
    PART OF CHAIN:         None

TRIGGER: Exchange issues official price correction bulletin
PRECONDITIONS: Original price record exists in historical database
POSTCONDITIONS: Price correction appended as auditable adjustment record; downstream portfolio valuations recalculated
BUSINESS RULES: Rule 2: Historical market data is immutable; corrections appended as adjustment records.
BUSINESS OBJECTS AFFECTED: Price MODIFIED (Adjustment record appended)
ORIGINATING CAPABILITY: MKT-DAT-001 — Real-Time Data Ingestion
CONSUMING CAPABILITIES: MKT-DAT-001 — Real-Time Data Ingestion
POTENTIAL DOMAIN CONSUMERS: Portfolio Valuation Service, Performance Analytics

SEVERITY: WARNING
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Price correction audit trail preserved for compliance review
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX official price corrections processed within 24 hours
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: CORRECT_PRICE, RETROACTIVE_PRICE_ADJUSTMENT
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                MKT-022
EVENT NAME:              FEED_LATENCY_THRESHOLD_EXCEEDED
ARABIC NAME:             تجاوز حد التأخير في موجز البيانات
TAXONOMY:                Category 5: Market Data Quality Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  The measured elapsed time between exchange tick publishing and platform receipt has exceeded declared business SLA boundaries.

CANONICAL EVENT METADATA:
  EVENT ID:                MKT-022
  EVENT NAME:              FEED_LATENCY_THRESHOLD_EXCEEDED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Market Data Quality Domain
  ORIGINATING CAPABILITY:  MKT-DAT-001 — Real-Time Data Ingestion
  BUSINESS OBJECT:         DataSource
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       LICENSED_VENDOR
  SEVERITY:                WARNING

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         VendorID + SLA_Threshold + MeasuredLatency
  CORRELATION ID:          CORR-LATENCY-SPIKE

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           SYS_DATA_VENDOR_FEED_STALLED
    PART OF CHAIN:         Chain 16: Market Data Quality Failure

TRIGGER: Data Quality monitor detects tick ingestion delay exceeding SLA threshold
PRECONDITIONS: Data feed is connected
POSTCONDITIONS: Feed latency alert logged; ops team notified; active trader warning flag raised if persistent
BUSINESS RULES: Rule 18: Quote stream latency must not exceed defined SLA boundaries.
BUSINESS OBJECTS AFFECTED: DataSource MODIFIED
ORIGINATING CAPABILITY: MKT-DAT-001 — Real-Time Data Ingestion
CONSUMING CAPABILITIES: MKT-DAT-001 — Real-Time Data Ingestion
POTENTIAL DOMAIN CONSUMERS: Platform Health Monitoring, Admin Ops

SEVERITY: WARNING
SOURCE CONFIDENCE: LICENSED_VENDOR
BUSINESS CRITICALITY: Operational
EVENT FREQUENCY: Medium
ORDERING SENSITIVITY: Independent
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Vendor SLA latency breach evidence archived
AUDIT REQUIREMENTS: RECOMMENDED
EGX-SPECIFIC NOTES: Monitors EGX feed latency during high-volatility session opens
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: LATENCY_SPIKE, FEED_SLOWDOWN
═══════════════════════════════════════════════════════════════════════════════
## 3F — Instrument Lifecycle Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                INST-001
EVENT NAME:              INSTRUMENT_CREATED
ARABIC NAME:             إنشاء أداة مالية جديدة
TAXONOMY:                Category 6: Instrument Lifecycle Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A new financial instrument has been formally defined in the Security Master following regulatory listing approval.

CANONICAL EVENT METADATA:
  EVENT ID:                INST-001
  EVENT NAME:              INSTRUMENT_CREATED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Instrument Lifecycle Domain
  ORIGINATING CAPABILITY:  INST-MGT-001 — Security Master Governance
  BUSINESS OBJECT:         Instrument
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       REGULATED_BODY
  SEVERITY:                NOTICE

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         ISIN + PrimaryMIC
  CORRELATION ID:          CORR-INST-CREATE

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           INST_INSTRUMENT_ACTIVATED
    PART OF CHAIN:         None

TRIGGER: Exchange or regulatory authority issues new listing notice
PRECONDITIONS: ISIN and Ticker symbol validated
POSTCONDITIONS: Instrument created in Security Master in Inactive state
BUSINESS RULES: Rule 27: Ticker symbols must be uniquely qualified by Exchange MIC code.
BUSINESS OBJECTS AFFECTED: Instrument CREATED
ORIGINATING CAPABILITY: INST-MGT-001 — Security Master Governance
CONSUMING CAPABILITIES: INST-MGT-001 — Security Master Governance
POTENTIAL DOMAIN CONSUMERS: Screening Engine, Portfolio Management

SEVERITY: NOTICE
SOURCE CONFIDENCE: REGULATED_BODY
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Regulatory prospectus and ISIN registration verified
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX IPO listings added to Security Master
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: ADD_INSTRUMENT, CREATE_SECURITY
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                INST-002
EVENT NAME:              INSTRUMENT_ACTIVATED
ARABIC NAME:             تفعيل الأداة المالية للتداول
TAXONOMY:                Category 6: Instrument Lifecycle Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An instrument transitions to active tradeable status on the exchange (first day of trading post-IPO).

CANONICAL EVENT METADATA:
  EVENT ID:                INST-002
  EVENT NAME:              INSTRUMENT_ACTIVATED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Instrument Lifecycle Domain
  ORIGINATING CAPABILITY:  INST-MGT-001 — Security Master Governance
  BUSINESS OBJECT:         Instrument
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                NOTICE

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ISIN + ActivationDate
  CORRELATION ID:          CORR-INST-ACT

  RELATED EVENTS:
    PRECEDED BY:           INST_INSTRUMENT_CREATED
    FOLLOWED BY:           MKT_PRICE_TICK_RECEIVED
    PART OF CHAIN:         None

TRIGGER: Exchange trading commencement date arrives
PRECONDITIONS: Instrument exists in Security Master in Pending state
POSTCONDITIONS: Instrument status set to ACTIVE; live quote tracking and screening enabled
BUSINESS RULES: Rule 27: Ticker symbols uniquely qualified by MIC.
BUSINESS OBJECTS AFFECTED: Instrument MODIFIED
ORIGINATING CAPABILITY: INST-MGT-001 — Security Master Governance
CONSUMING CAPABILITIES: INST-MGT-001 — Security Master Governance
POTENTIAL DOMAIN CONSUMERS: Price Intelligence, Screening Engine

SEVERITY: NOTICE
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: First trading day notification recorded
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX first trading day post-IPO
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: ACTIVATE_SECURITY, LISTING_COMMENCED
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                INST-003
EVENT NAME:              INSTRUMENT_SUSPENDED
ARABIC NAME:             إيقاف الأداة المالية عن التداول
TAXONOMY:                Category 6: Instrument Lifecycle Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A regulatory body or exchange authority has temporarily suspended trading in an instrument (due to pending disclosure, fraud investigation, or failure to file financials).

CANONICAL EVENT METADATA:
  EVENT ID:                INST-003
  EVENT NAME:              INSTRUMENT_SUSPENDED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Instrument Lifecycle Domain
  ORIGINATING CAPABILITY:  INST-MGT-001 — Security Master Governance
  BUSINESS OBJECT:         Instrument
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       REGULATED_BODY
  SEVERITY:                WARNING

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ISIN + SuspensionDate + Authority
  CORRELATION ID:          CORR-INST-SUSP

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           INST_INSTRUMENT_REINSTATED
    PART OF CHAIN:         Chain 17: Instrument Suspension & Reinstatement

TRIGGER: Regulatory order issued for instrument trading suspension
PRECONDITIONS: Instrument is in ACTIVE trading status
POSTCONDITIONS: Instrument status set to SUSPENDED; order entry blocked; user portfolio holdings flagged
BUSINESS RULES: Rule 36: Clear visual severity distinctions for suspended assets.
BUSINESS OBJECTS AFFECTED: Instrument MODIFIED
ORIGINATING CAPABILITY: INST-MGT-001 — Security Master Governance
CONSUMING CAPABILITIES: INST-MGT-001 — Security Master Governance
POTENTIAL DOMAIN CONSUMERS: Portfolio Tracker, Alert Engine, Risk Engine

SEVERITY: WARNING
SOURCE CONFIDENCE: REGULATED_BODY
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Regulatory suspension notice archived
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: FRA suspends EGX stocks for non-disclosure of quarterly earnings
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: SUSPEND_SECURITY, TRADING_HALT_REGULATORY
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                INST-004
EVENT NAME:              INSTRUMENT_REINSTATED
ARABIC NAME:             إعادة الأداة المالية للتداول
TAXONOMY:                Category 6: Instrument Lifecycle Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A previously suspended instrument has been authorized by regulatory authorities to resume live trading.

CANONICAL EVENT METADATA:
  EVENT ID:                INST-004
  EVENT NAME:              INSTRUMENT_REINSTATED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Instrument Lifecycle Domain
  ORIGINATING CAPABILITY:  INST-MGT-001 — Security Master Governance
  BUSINESS OBJECT:         Instrument
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       REGULATED_BODY
  SEVERITY:                NOTICE

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ISIN + ReinstatementDate
  CORRELATION ID:          CORR-INST-REIN

  RELATED EVENTS:
    PRECEDED BY:           INST_INSTRUMENT_SUSPENDED
    FOLLOWED BY:           MKT_PRICE_TICK_RECEIVED
    PART OF CHAIN:         Chain 17: Instrument Suspension & Reinstatement

TRIGGER: Regulatory order lifting trading suspension published
PRECONDITIONS: Instrument is currently in SUSPENDED state
POSTCONDITIONS: Instrument status set to ACTIVE; live quote tracking resumed
BUSINESS RULES: Rule 39: State transitions log explicit events.
BUSINESS OBJECTS AFFECTED: Instrument MODIFIED
ORIGINATING CAPABILITY: INST-MGT-001 — Security Master Governance
CONSUMING CAPABILITIES: INST-MGT-001 — Security Master Governance
POTENTIAL DOMAIN CONSUMERS: Price Intelligence, Portfolio Tracker

SEVERITY: NOTICE
SOURCE CONFIDENCE: REGULATED_BODY
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Reinstatement notice archived
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: FRA lifts suspension on EGX stock following earnings disclosure filing
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: REINSTATE_SECURITY, LIFT_SUSPENSION
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                INST-005
EVENT NAME:              INSTRUMENT_DELISTED
ARABIC NAME:             شطب الأداة المالية من السوق
TAXONOMY:                Category 6: Instrument Lifecycle Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An exchange or regulatory authority has permanently removed an instrument from listing and trading.

CANONICAL EVENT METADATA:
  EVENT ID:                INST-005
  EVENT NAME:              INSTRUMENT_DELISTED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Instrument Lifecycle Domain
  ORIGINATING CAPABILITY:  INST-MGT-001 — Security Master Governance
  BUSINESS OBJECT:         Instrument
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       REGULATED_BODY
  SEVERITY:                CRITICAL

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ISIN + DelistingDate
  CORRELATION ID:          CORR-INST-DELIST

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           None
    PART OF CHAIN:         None

TRIGGER: Company liquidation, privatization, or regulatory delisting order finalized
PRECONDITIONS: Instrument exists in Security Master
POSTCONDITIONS: Instrument status set to DELISTED; all held portfolio positions flagged for manual review
BUSINESS RULES: Rule 2: Historical price records preserved indefinitely post-delisting.
BUSINESS OBJECTS AFFECTED: Instrument MODIFIED; Portfolio MODIFIED
ORIGINATING CAPABILITY: INST-MGT-001 — Security Master Governance
CONSUMING CAPABILITIES: INST-MGT-001 — Security Master Governance
POTENTIAL DOMAIN CONSUMERS: Portfolio Ledger, Risk Engine, Audit Logging

SEVERITY: CRITICAL
SOURCE CONFIDENCE: REGULATED_BODY
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Rare
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Delisting regulatory decree archived for audit
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX delisting decree removes security from trading board
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: DELIST_SECURITY, REMOVE_LISTING
═══════════════════════════════════════════════════════════════════════════════
## 3G — Corporate Action Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CORP-001
EVENT NAME:              CORPORATE_ACTION_ANNOUNCED
ARABIC NAME:             الإعلان عن إجراء مؤسسي
TAXONOMY:                Category 7: Corporate Action Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A corporate action (cash dividend, stock split, bonus shares, rights issue) has been officially announced by the issuer.

CANONICAL EVENT METADATA:
  EVENT ID:                CORP-001
  EVENT NAME:              CORPORATE_ACTION_ANNOUNCED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Corporate Actions Domain
  ORIGINATING CAPABILITY:  CORP-ACT-001 — Corporate Actions Tracking
  BUSINESS OBJECT:         CorporateAction
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ISIN + ActionType + AnnouncementDate
  CORRELATION ID:          CORR-CORP-001

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           CORP_CORPORATE_ACTION_APPROVED
    PART OF CHAIN:         Chain 3: Cash Dividend Lifecycle

TRIGGER: Issuer files official corporate action disclosure with exchange
PRECONDITIONS: Instrument is active in Security Master
POSTCONDITIONS: CorporateAction record created in ANNOUNCED state; ex-date and record date cataloged
BUSINESS RULES: Rule 9: Corporate actions reflected in portfolios within 1 business day.
BUSINESS OBJECTS AFFECTED: CorporateAction CREATED
ORIGINATING CAPABILITY: CORP-ACT-001 — Corporate Actions Tracking
CONSUMING CAPABILITIES: CORP-ACT-001 — Corporate Actions Tracking
POTENTIAL DOMAIN CONSUMERS: Portfolio Service, Research Engine, Alert Engine

SEVERITY: INFO
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Official exchange disclosure document linked
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX company files dividend or stock split announcement
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: ANNOUNCE_CORPORATE_ACTION, DIVIDEND_DECLARED
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CORP-003
EVENT NAME:              CORPORATE_ACTION_EX_DATE_REACHED
ARABIC NAME:             حلول تاريخ استحقاق الإجراء المؤسسي
TAXONOMY:                Category 7: Corporate Action Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  The ex-date for a corporate action has arrived. Stock trades ex-entitlement from this session forward.

CANONICAL EVENT METADATA:
  EVENT ID:                CORP-003
  EVENT NAME:              CORPORATE_ACTION_EX_DATE_REACHED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Corporate Actions Domain
  ORIGINATING CAPABILITY:  CORP-ACT-001 — Corporate Actions Tracking
  BUSINESS OBJECT:         CorporateAction
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                NOTICE

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ISIN + ActionID + EX_DATE
  CORRELATION ID:          CORR-CORP-003

  RELATED EVENTS:
    PRECEDED BY:           CORP_CORPORATE_ACTION_APPROVED
    FOLLOWED BY:           CORP_PRICE_HISTORY_ADJUSTED
    PART OF CHAIN:         Chain 4: Stock Split & Price Adjustment

TRIGGER: Exchange business date reaches declared Ex-Date
PRECONDITIONS: Corporate action is in APPROVED state
POSTCONDITIONS: Historical price series adjusted for splits/dividends; portfolio position eligibility locked
BUSINESS RULES: Rule 22: Price adjustment calculations preserve historical percentage returns.
BUSINESS OBJECTS AFFECTED: CorporateAction MODIFIED; HistoricalPrice MODIFIED
ORIGINATING CAPABILITY: CORP-ACT-001 — Corporate Actions Tracking
CONSUMING CAPABILITIES: CORP-ACT-001 — Corporate Actions Tracking
POTENTIAL DOMAIN CONSUMERS: Historical Price Adjustment Engine, Portfolio Service

SEVERITY: NOTICE
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Scheduled
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Ex-date pricing adjustment verified against exchange reference price
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX stock opens ex-dividend or ex-split on Ex-Date
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: EX_DATE_ARRIVED, EX_DIVIDEND_DATE
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CORP-005
EVENT NAME:              CORPORATE_ACTION_PAY_DATE_REACHED
ARABIC NAME:             حلول تاريخ صرف الإجراء المؤسسي
TAXONOMY:                Category 7: Corporate Action Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  The payment date for a corporate action has arrived. Cash dividends or bonus shares are distributed.

CANONICAL EVENT METADATA:
  EVENT ID:                CORP-005
  EVENT NAME:              CORPORATE_ACTION_PAY_DATE_REACHED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Corporate Actions Domain
  ORIGINATING CAPABILITY:  CORP-ACT-001 — Corporate Actions Tracking
  BUSINESS OBJECT:         CorporateAction
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ISIN + ActionID + PAY_DATE
  CORRELATION ID:          CORR-CORP-005

  RELATED EVENTS:
    PRECEDED BY:           CORP_CORPORATE_ACTION_RECORD_DATE_REACHED
    FOLLOWED BY:           CORP_PORTFOLIO_ADJUSTED_FOR_CORPORATE_ACTION
    PART OF CHAIN:         Chain 3: Cash Dividend Lifecycle

TRIGGER: Exchange business date reaches declared Pay Date
PRECONDITIONS: Record date holders list finalized
POSTCONDITIONS: Portfolio cash balances credited or share quantities updated; action completed
BUSINESS RULES: Rule 9: Corporate actions reflected in portfolio valuations within 1 business day.
BUSINESS OBJECTS AFFECTED: CorporateAction MODIFIED; Portfolio MODIFIED
ORIGINATING CAPABILITY: CORP-ACT-001 — Corporate Actions Tracking
CONSUMING CAPABILITIES: CORP-ACT-001 — Corporate Actions Tracking
POTENTIAL DOMAIN CONSUMERS: Portfolio Ledger, User Audit View

SEVERITY: INFO
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Scheduled
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Payment execution confirmation logged
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX cash dividends credited via MCDR (Misr for Central Clearing)
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: PAYMENT_DATE_REACHED, DIVIDEND_PAID
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CORP-013
EVENT NAME:              PRICE_HISTORY_ADJUSTED
ARABIC NAME:             تعديل التاريخ السعري للإجراءات المؤسسية
TAXONOMY:                Category 7: Corporate Action Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  Historical price series retroactively adjusted for stock split or bonus share distribution to maintain return continuity.

CANONICAL EVENT METADATA:
  EVENT ID:                CORP-013
  EVENT NAME:              PRICE_HISTORY_ADJUSTED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Corporate Actions Domain
  ORIGINATING CAPABILITY:  CORP-ACT-001 — Corporate Actions Tracking
  BUSINESS OBJECT:         HistoricalPrice
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       CALCULATED
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         ISIN + ActionID + AdjustmentFactor
  CORRELATION ID:          CORR-HIST-ADJ

  RELATED EVENTS:
    PRECEDED BY:           CORP_CORPORATE_ACTION_EX_DATE_REACHED
    FOLLOWED BY:           None
    PART OF CHAIN:         Chain 4: Stock Split & Price Adjustment

TRIGGER: Corporate action reaches ex-date
PRECONDITIONS: Adjustment factor computed from split ratio or dividend yield
POSTCONDITIONS: Adjusted OHLCV series generated alongside raw unadjusted series
BUSINESS RULES: Rule 22: Price adjustment calculations preserve historical percentage returns.
BUSINESS OBJECTS AFFECTED: HistoricalPrice MODIFIED (Adjusted series updated)
ORIGINATING CAPABILITY: CORP-ACT-001 — Corporate Actions Tracking
CONSUMING CAPABILITIES: CORP-ACT-001 — Corporate Actions Tracking
POTENTIAL DOMAIN CONSUMERS: Technical Analysis Engine, Backtesting Engine

SEVERITY: INFO
SOURCE CONFIDENCE: CALCULATED
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Causal
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Original unadjusted prices preserved as immutable records
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX historical chart adjusted for stock splits and bonus issues
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: ADJUST_PRICE_HISTORY, SPLIT_ADJUSTMENT
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CORP-014
EVENT NAME:              PORTFOLIO_ADJUSTED_FOR_CORPORATE_ACTION
ARABIC NAME:             تعديل المحفظة للإجراء المؤسسي
TAXONOMY:                Category 7: Corporate Action Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A user's portfolio holdings or cash ledger updated to reflect executed corporate action (dividend payout or split share doubling).

CANONICAL EVENT METADATA:
  EVENT ID:                CORP-014
  EVENT NAME:              PORTFOLIO_ADJUSTED_FOR_CORPORATE_ACTION
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Corporate Actions Domain
  ORIGINATING CAPABILITY:  CORP-ACT-001 — Corporate Actions Tracking
  BUSINESS OBJECT:         Portfolio
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       CALCULATED
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         PortfolioID + ActionID + PayDate
  CORRELATION ID:          CORR-PORT-CORP-ADJ

  RELATED EVENTS:
    PRECEDED BY:           CORP_CORPORATE_ACTION_PAY_DATE_REACHED
    FOLLOWED BY:           PORT_PORTFOLIO_NAV_RECALCULATED
    PART OF CHAIN:         Chain 3: Cash Dividend Lifecycle

TRIGGER: Pay date reached and position holder confirmed on record date
PRECONDITIONS: Portfolio held target security on ex-date
POSTCONDITIONS: Portfolio Cash balance credited or Position quantity increased; NAV updated
BUSINESS RULES: Rule 9: Corporate actions reflected in portfolio records within 1 business day.
BUSINESS OBJECTS AFFECTED: Portfolio MODIFIED; Position MODIFIED
ORIGINATING CAPABILITY: CORP-ACT-001 — Corporate Actions Tracking
CONSUMING CAPABILITIES: CORP-ACT-001 — Corporate Actions Tracking
POTENTIAL DOMAIN CONSUMERS: Portfolio Ledger, User Audit View

SEVERITY: INFO
SOURCE CONFIDENCE: CALCULATED
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Causal
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Idempotency key prevents double crediting
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX dividend cash credit recorded in EGP
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: APPLY_CORPORATE_ACTION_TO_PORTFOLIO, CREDIT_DIVIDEND
═══════════════════════════════════════════════════════════════════════════════
## 3H — Settlement Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                SETT-001
EVENT NAME:              SETTLEMENT_INITIATED
ARABIC NAME:             بدء عملية التسوية
TAXONOMY:                Category 8: Settlement Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  Post-trade settlement process initiated following executed trade placement, registering target settlement date.

CANONICAL EVENT METADATA:
  EVENT ID:                SETT-001
  EVENT NAME:              SETTLEMENT_INITIATED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Settlement Domain
  ORIGINATING CAPABILITY:  SETT-MGT-001 — Post-Trade Settlement Tracking
  BUSINESS OBJECT:         HistoricalTrade
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities / Bonds

  SOURCE CONFIDENCE:       BROKER
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         TradeRef + SettlementDate
  CORRELATION ID:          CORR-SETT-001

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           SETT_SETTLEMENT_CONFIRMED
    PART OF CHAIN:         None

TRIGGER: Trade execution confirmed by broker or exchange clearing house
PRECONDITIONS: Trade record valid in portfolio ledger
POSTCONDITIONS: Settlement process initialized in PENDING state
BUSINESS RULES: Rule 9: Corporate actions and settlements reflected in portfolios on schedule.
BUSINESS OBJECTS AFFECTED: HistoricalTrade MODIFIED
ORIGINATING CAPABILITY: SETT-MGT-001 — Post-Trade Settlement Tracking
CONSUMING CAPABILITIES: SETT-MGT-001 — Settlement Tracking
POTENTIAL DOMAIN CONSUMERS: Portfolio Ledger, Broker Integration Layer

SEVERITY: INFO
SOURCE CONFIDENCE: BROKER
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: High
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Clearing house settlement instructions logged
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX MCDR clears T+2 equity trades and T+1 T-Bills
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: INITIATE_SETTLEMENT, START_CLEARING
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                SETT-002
EVENT NAME:              SETTLEMENT_CONFIRMED
ARABIC NAME:             تأكيد اكتمال التسوية
TAXONOMY:                Category 8: Settlement Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  Both counterparties and central depository confirm final legal settlement and transfer of securities and cash.

CANONICAL EVENT METADATA:
  EVENT ID:                SETT-002
  EVENT NAME:              SETTLEMENT_CONFIRMED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Settlement Domain
  ORIGINATING CAPABILITY:  SETT-MGT-001 — Post-Trade Settlement Tracking
  BUSINESS OBJECT:         HistoricalTrade
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities / Bonds

  SOURCE CONFIDENCE:       BROKER
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         TradeRef + ConfirmTimestamp
  CORRELATION ID:          CORR-SETT-002

  RELATED EVENTS:
    PRECEDED BY:           SETT_SETTLEMENT_INITIATED
    FOLLOWED BY:           SETT_CUSTODY_RECORD_UPDATED
    PART OF CHAIN:         None

TRIGGER: Central Securities Depository (CSD) confirms trade settlement completion
PRECONDITIONS: Settlement was in PENDING state
POSTCONDITIONS: Trade status set to SETTLED; legal ownership transferred
BUSINESS RULES: Rule 4: Portfolio performance calculations auditable against settled trades.
BUSINESS OBJECTS AFFECTED: HistoricalTrade MODIFIED; Position MODIFIED
ORIGINATING CAPABILITY: SETT-MGT-001 — Post-Trade Settlement Tracking
CONSUMING CAPABILITIES: SETT-MGT-001 — Settlement Tracking
POTENTIAL DOMAIN CONSUMERS: Custody Service, Portfolio Ledger

SEVERITY: INFO
SOURCE CONFIDENCE: BROKER
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: High
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: CSD confirmation reference recorded for regulatory audit
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX MCDR issues final settlement confirmation certificate
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: CONFIRM_SETTLEMENT, TRADE_SETTLED
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                SETT-003
EVENT NAME:              SETTLEMENT_FAILED
ARABIC NAME:             فشل عملية التسوية
TAXONOMY:                Category 8: Settlement Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  Post-trade settlement failed to complete by declared deadline due to securities deficit or payment default.

CANONICAL EVENT METADATA:
  EVENT ID:                SETT-003
  EVENT NAME:              SETTLEMENT_FAILED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Settlement Domain
  ORIGINATING CAPABILITY:  SETT-MGT-001 — Post-Trade Settlement Tracking
  BUSINESS OBJECT:         HistoricalTrade
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities / Bonds

  SOURCE CONFIDENCE:       BROKER
  SEVERITY:                CRITICAL

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         TradeRef + FailureReason
  CORRELATION ID:          CORR-SETT-FAIL

  RELATED EVENTS:
    PRECEDED BY:           SETT_SETTLEMENT_INITIATED
    FOLLOWED BY:           SETT_FAILED_TRADE_BUY_IN_INITIATED
    PART OF CHAIN:         None

TRIGGER: CSD or clearing broker flags trade delivery failure at T+N deadline
PRECONDITIONS: Settlement was pending
POSTCONDITIONS: Trade status set to FAILED; compliance alert and buy-in protocol triggered
BUSINESS RULES: Rule 24: Audit logs preserve tamper-evident failure records.
BUSINESS OBJECTS AFFECTED: HistoricalTrade MODIFIED
ORIGINATING CAPABILITY: SETT-MGT-001 — Post-Trade Settlement Tracking
CONSUMING CAPABILITIES: SETT-MGT-001 — Settlement Tracking
POTENTIAL DOMAIN CONSUMERS: Compliance Engine, Broker Integration

SEVERITY: CRITICAL
SOURCE CONFIDENCE: BROKER
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Rare
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Mandatory regulatory failure report to FRA / SEC
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX MCDR failed trade buy-in rules apply
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: FAIL_SETTLEMENT, CLEARING_DEFAULT
═══════════════════════════════════════════════════════════════════════════════
## 3I — Fixed Income & Islamic Finance Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                INST-030
EVENT NAME:              BOND_COUPON_PAID
ARABIC NAME:             صرف كوبون السندات
TAXONOMY:                Category 9: Fixed Income and Islamic Finance Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  Periodic interest coupon payment distributed to bondholders of record.

CANONICAL EVENT METADATA:
  EVENT ID:                INST-030
  EVENT NAME:              BOND_COUPON_PAID
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Fixed Income Domain
  ORIGINATING CAPABILITY:  INST-FI-001 — Fixed Income & Sukuk Management
  BUSINESS OBJECT:         HistoricalTrade
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Fixed Income

  SOURCE CONFIDENCE:       REGULATED_BODY
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ISIN + CouponDate + AmountPerBond
  CORRELATION ID:          CORR-COUPON-PAID

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           PORT_PORTFOLIO_NAV_RECALCULATED
    PART OF CHAIN:         None

TRIGGER: Bond coupon payment date arrives
PRECONDITIONS: Portfolio holds target bond on record date
POSTCONDITIONS: Portfolio cash balance credited with coupon payment; income ledger updated
BUSINESS RULES: Rule 34: Yield calculations explicitly declare clean vs dirty price basis.
BUSINESS OBJECTS AFFECTED: Portfolio MODIFIED; HistoricalTrade CREATED
ORIGINATING CAPABILITY: INST-FI-001 — Fixed Income & Sukuk Management
CONSUMING CAPABILITIES: INST-FI-001 — Fixed Income Management
POTENTIAL DOMAIN CONSUMERS: Portfolio Ledger, Income Attribution Engine

SEVERITY: INFO
SOURCE CONFIDENCE: REGULATED_BODY
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Scheduled
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Tax withholding and coupon payment receipts logged
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Egyptian Treasury Bond coupon payouts processed via Central Bank of Egypt
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: COUPON_DISTRIBUTED, INTEREST_PAID
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                INST-031
EVENT NAME:              SUKUK_PROFIT_DISTRIBUTION_PAID
ARABIC NAME:             صرف أرباح الصكوك الإسلامية
TAXONOMY:                Category 9: Fixed Income and Islamic Finance Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  Periodic Sharia-compliant profit distribution paid to Sukuk certificate holders of record.

CANONICAL EVENT METADATA:
  EVENT ID:                INST-031
  EVENT NAME:              SUKUK_PROFIT_DISTRIBUTION_PAID
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Fixed Income Domain
  ORIGINATING CAPABILITY:  INST-FI-001 — Fixed Income & Sukuk Management
  BUSINESS OBJECT:         HistoricalTrade
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Fixed Income (Sukuk)

  SOURCE CONFIDENCE:       REGULATED_BODY
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ISIN + DistributionDate + ProfitRate
  CORRELATION ID:          CORR-SUKUK-PROFIT

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           PORT_PORTFOLIO_NAV_RECALCULATED
    PART OF CHAIN:         None

TRIGGER: Sukuk profit distribution date arrives
PRECONDITIONS: Portfolio holds target Sukuk on record date
POSTCONDITIONS: Portfolio cash balance credited with Sharia profit yield; income ledger updated
BUSINESS RULES: Rule 34: Fixed income yield calculations adhere to documented Sharia standards.
BUSINESS OBJECTS AFFECTED: Portfolio MODIFIED; HistoricalTrade CREATED
ORIGINATING CAPABILITY: INST-FI-001 — Fixed Income & Sukuk Management
CONSUMING CAPABILITIES: INST-FI-001 — Sukuk Management
POTENTIAL DOMAIN CONSUMERS: Portfolio Ledger, Sharia Compliance Engine

SEVERITY: INFO
SOURCE CONFIDENCE: REGULATED_BODY
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Scheduled
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Sharia supervisory board compliance approval reference logged
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Egyptian Sovereign Sukuk profit distributions processed in EGP
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: SUKUK_PROFIT_PAID, SHARIA_YIELD_DISTRIBUTED
═══════════════════════════════════════════════════════════════════════════════
## 3J — Foreign Exchange Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                FX-001
EVENT NAME:              SPOT_RATE_UPDATED
ARABIC NAME:             تحديث سعر الصرف الفوري
TAXONOMY:                Category 10: Foreign Exchange Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  Spot exchange rate between currency pair updated from authoritative central bank or Tier-1 FX provider.

CANONICAL EVENT METADATA:
  EVENT ID:                FX-001
  EVENT NAME:              SPOT_RATE_UPDATED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Foreign Exchange Domain
  ORIGINATING CAPABILITY:  FX-MGT-001 — Foreign Exchange Rate Tracking
  BUSINESS OBJECT:         ExchangeRate
  MARKET CLASS:            CLASS 2 (OTC / FX)
  ASSET CLASS:             Foreign Exchange

  SOURCE CONFIDENCE:       LICENSED_VENDOR
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           UTC
    MIC Code:              FX_MARKET
    UTC Offset:            +00:00
    DST Active:            NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            GPS_SYNCHRONIZED

  IDEMPOTENCY KEY:         BaseCurrency + QuoteCurrency + Timestamp
  CORRELATION ID:          CORR-FX-001

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           PORT_PORTFOLIO_NAV_RECALCULATED
    PART OF CHAIN:         Chain 15: Multi-Currency FX Revaluation

TRIGGER: FX rate tick received from central bank or vendor feed
PRECONDITIONS: Currency pair is active in platform Currency Master
POSTCONDITIONS: Current ExchangeRate record updated; multi-currency portfolio NAVs recalculated
BUSINESS RULES: Rule 12: Cross-currency calculations must use declared, timestamped rate source.
BUSINESS OBJECTS AFFECTED: ExchangeRate CREATED; Portfolio MODIFIED
ORIGINATING CAPABILITY: FX-MGT-001 — Foreign Exchange Rate Tracking
CONSUMING CAPABILITIES: FX-MGT-001 — Foreign Exchange Rate Tracking
POTENTIAL DOMAIN CONSUMERS: Multi-Currency Portfolio Support, Price Intelligence

SEVERITY: INFO
SOURCE CONFIDENCE: LICENSED_VENDOR
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: High
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Central Bank rate attribution recorded for accounting audit
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: CBE official EGP spot exchange rates updated daily
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: FX_RATE_CHANGED, CURRENCY_UPDATE
═══════════════════════════════════════════════════════════════════════════════
## 3K — Cryptocurrency and Digital Asset Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                CRYP-001
EVENT NAME:              CRYPTO_TICK_RECEIVED
ARABIC NAME:             استلام لقطة سعر العملة المشفرة
TAXONOMY:                Category 11: Cryptocurrency & Digital Assets
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A continuous spot price tick received for a digital asset from a centralized crypto exchange.

CANONICAL EVENT METADATA:
  EVENT ID:                CRYP-001
  EVENT NAME:              CRYPTO_TICK_RECEIVED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Crypto Domain
  ORIGINATING CAPABILITY:  CRYP-MGT-001 — Digital Asset Tracking
  BUSINESS OBJECT:         Price
  MARKET CLASS:            CLASS 3 (Crypto Assets)
  ASSET CLASS:             Crypto

  SOURCE CONFIDENCE:       LICENSED_VENDOR
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           UTC
    MIC Code:              BINANCE
    UTC Offset:            +00:00
    DST Active:            NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            GPS_SYNCHRONIZED

  IDEMPOTENCY KEY:         CryptoSymbol + Timestamp + ExecutionPrice
  CORRELATION ID:          CORR-CRYP-TICK

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           ALRT_PRICE_TARGET_REACHED
    PART OF CHAIN:         None

TRIGGER: Crypto exchange feed broadcasts executed trade tick
PRECONDITIONS: Asset active in Security Master
POSTCONDITIONS: Price record updated; real-time crypto alerts evaluated
BUSINESS RULES: Rule 5: Position cannot be valued without verified price source.
BUSINESS OBJECTS AFFECTED: Price CREATED
ORIGINATING CAPABILITY: CRYP-MGT-001 — Digital Asset Tracking
CONSUMING CAPABILITIES: CRYP-MGT-001 — Digital Asset Tracking
POTENTIAL DOMAIN CONSUMERS: Price Intelligence, Alert Engine

SEVERITY: INFO
SOURCE CONFIDENCE: LICENSED_VENDOR
BUSINESS CRITICALITY: Operational
EVENT FREQUENCY: Ultra High
ORDERING SENSITIVITY: Independent
IDEMPOTENCY REQUIREMENT: Not Required

REGULATORY CONSIDERATIONS: Crypto exchange source attribution preserved
AUDIT REQUIREMENTS: RECOMMENDED
EGX-SPECIFIC NOTES: Continuous 24/7 market monitoring
MARKET TIMEZONE NOTES: Pure UTC reference
FORBIDDEN SYNONYMS: CRYPTO_PRICE_UPDATE, DIGITAL_ASSET_TICK
═══════════════════════════════════════════════════════════════════════════════
## 3L — Derivatives Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                INST-050
EVENT NAME:              OPTION_CONTRACT_EXPIRED
ARABIC NAME:             انتهاء صلاحية عقد الخيار
TAXONOMY:                Category 12: Derivatives Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An options contract reaches its official expiration date, settling in-the-money or expiring worthless.

CANONICAL EVENT METADATA:
  EVENT ID:                INST-050
  EVENT NAME:              OPTION_CONTRACT_EXPIRED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Derivatives Domain
  ORIGINATING CAPABILITY:  INST-DER-001 — Derivatives Contract Lifecycle
  BUSINESS OBJECT:         Instrument
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Derivatives

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                NOTICE

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         OptionISIN + ExpiryDate
  CORRELATION ID:          CORR-OPT-EXP

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           PORT_PORTFOLIO_NAV_RECALCULATED
    PART OF CHAIN:         None

TRIGGER: Option contract expiry date and time arrives
PRECONDITIONS: Contract exists in Security Master
POSTCONDITIONS: Instrument status set to EXPIRED; position closed out in portfolio ledgers
BUSINESS RULES: Rule 4: Portfolio performance calculations strictly auditable.
BUSINESS OBJECTS AFFECTED: Instrument MODIFIED; Portfolio MODIFIED
ORIGINATING CAPABILITY: INST-DER-001 — Derivatives Contract Lifecycle
CONSUMING CAPABILITIES: INST-DER-001 — Derivatives Lifecycle
POTENTIAL DOMAIN CONSUMERS: Portfolio Tracker, Settlement Engine

SEVERITY: NOTICE
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Scheduled
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Exchange settlement price log archived
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Derivatives contracts on EGX expansion board
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: EXPIRE_OPTION, OPTION_MATURITY
═══════════════════════════════════════════════════════════════════════════════
## 3M — Fund and Periodically Priced Asset Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                MKT-040
EVENT NAME:              MUTUAL_FUND_NAV_DECLARED
ARABIC NAME:             إعلان صافي قيمة أصول صندوق الاستثمار
TAXONOMY:                Category 13: Fund & Periodic Asset Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An investment fund manager publishes the official periodic Net Asset Value (NAV) per share for a mutual fund.

CANONICAL EVENT METADATA:
  EVENT ID:                MKT-040
  EVENT NAME:              MUTUAL_FUND_NAV_DECLARED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Funds Domain
  ORIGINATING CAPABILITY:  MKT-FND-001 — Periodic Valuation Tracking
  BUSINESS OBJECT:         FundNAV
  MARKET CLASS:            CLASS 4 (Periodic Assets)
  ASSET CLASS:             Funds

  SOURCE CONFIDENCE:       LICENSED_VENDOR
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         FundISIN + ValuationDate
  CORRELATION ID:          CORR-FUND-NAV

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           PORT_PORTFOLIO_NAV_RECALCULATED
    PART OF CHAIN:         None

TRIGGER: Fund management company computes and publishes daily/weekly NAV
PRECONDITIONS: Fund security record active in Security Master
POSTCONDITIONS: FundNAV record updated; fund positions in portfolios revalued
BUSINESS RULES: Rule 5: Position cannot be valued without verified price source.
BUSINESS OBJECTS AFFECTED: FundNAV CREATED; Portfolio MODIFIED
ORIGINATING CAPABILITY: MKT-FND-001 — Periodic Valuation Tracking
CONSUMING CAPABILITIES: MKT-FND-001 — Periodic Valuation Tracking
POTENTIAL DOMAIN CONSUMERS: Portfolio Valuation Service, Screening Engine

SEVERITY: INFO
SOURCE CONFIDENCE: LICENSED_VENDOR
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Fund manager NAV declaration filing archived
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Egyptian Mutual Fund NAVs published daily/weekly via EFSA/FRA portal
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: MUTUAL_FUND_NAV_PUBLISHED, FUND_VALUATION_DECLARED
═══════════════════════════════════════════════════════════════════════════════
## 3N — Index and Benchmark Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                MKT-050
EVENT NAME:              INDEX_VALUE_PUBLISHED
ARABIC NAME:             نشر قيمة المؤشر
TAXONOMY:                Category 14: Index & Benchmark Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An official market index provider publishes a real-time or end-of-day index value update (e.g., EGX30, S&P 500).

CANONICAL EVENT METADATA:
  EVENT ID:                MKT-050
  EVENT NAME:              INDEX_VALUE_PUBLISHED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Index Domain
  ORIGINATING CAPABILITY:  MKT-IDX-001 — Index & Benchmark Tracking
  BUSINESS OBJECT:         Benchmark
  MARKET CLASS:            CLASS 5 (Indices)
  ASSET CLASS:             Indices

  SOURCE CONFIDENCE:       OFFICIAL_EXCHANGE
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         IndexSymbol + Timestamp
  CORRELATION ID:          CORR-IDX-VAL

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           RISK_BENCHMARK_CROSSED
    PART OF CHAIN:         None

TRIGGER: Index calculation engine computes new index value
PRECONDITIONS: Index active in Security Master
POSTCONDITIONS: Benchmark value updated; benchmark comparison engine evaluates portfolio alpha
BUSINESS RULES: Rule 14: Benchmark comparison valid when benchmark and portfolio share currency context.
BUSINESS OBJECTS AFFECTED: Benchmark MODIFIED
ORIGINATING CAPABILITY: MKT-IDX-001 — Index & Benchmark Tracking
CONSUMING CAPABILITIES: MKT-IDX-001 — Benchmark Tracking
POTENTIAL DOMAIN CONSUMERS: Performance Analytics, Benchmark Comparison

SEVERITY: INFO
SOURCE CONFIDENCE: OFFICIAL_EXCHANGE
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: High
ORDERING SENSITIVITY: Independent
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Official index publisher attribution recorded
AUDIT REQUIREMENTS: RECOMMENDED
EGX-SPECIFIC NOTES: EGX30, EGX70, EGX100 index values published real-time
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: INDEX_UPDATED, BENCHMARK_VALUE_CALCULATED
═══════════════════════════════════════════════════════════════════════════════
## 3O — Financial Research Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                RES-001
EVENT NAME:              EQUITY_RESEARCH_PUBLISHED
ARABIC NAME:             نشر تقرير البحث المالي الأسهم
TAXONOMY:                Category 15: Financial Research Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An institutional-grade equity research document synthesizing DCF fair value, moat rating, and key risks has been generated and published.

CANONICAL EVENT METADATA:
  EVENT ID:                RES-001
  EVENT NAME:              EQUITY_RESEARCH_PUBLISHED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Research Domain
  ORIGINATING CAPABILITY:  RES-EQR-001 — Equity Research Synthesis
  BUSINESS OBJECT:         ResearchReport
  MARKET CLASS:            ALL
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       AI_GENERATED
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         ISIN + ReportVersion + PublicationTimestamp
  CORRELATION ID:          CORR-RES-PUB

  RELATED EVENTS:
    PRECEDED BY:           RES_EARNINGS_REPORT_PARSED
    FOLLOWED BY:           AI_RECOMMENDATION_GENERATED
    PART OF CHAIN:         Chain 5: Earnings Release & AI Research

TRIGGER: AI Research Engine completes multi-model fundamental synthesis following financial statement release
PRECONDITIONS: Target instrument is active in Security Master
POSTCONDITIONS: ResearchReport object CREATED; available for user subscription consumption
BUSINESS RULES: Rule 1: AI research must include explicit rationale, assumptions, and risk disclosures.
BUSINESS OBJECTS AFFECTED: ResearchReport CREATED
ORIGINATING CAPABILITY: RES-EQR-001 — Equity Research Synthesis
CONSUMING CAPABILITIES: RES-EQR-001 — Equity Research Synthesis
POTENTIAL DOMAIN CONSUMERS: AI Recommendation Engine, User Client UI

SEVERITY: INFO
SOURCE CONFIDENCE: AI_GENERATED
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Medium
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Full AI prompt template, reasoning chain, and data snapshot archived for audit
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Native Arabic equity research reports generated for EGX listed stocks
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: PUBLISH_RESEARCH, EQUITY_REPORT_GENERATED
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                RES-002
EVENT NAME:              FAIR_VALUE_MODEL_UPDATED
ARABIC NAME:             تحديث نموذج القيمة العادلة
TAXONOMY:                Category 15: Financial Research Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A mathematical intrinsic valuation calculation (DCF, DDM, Asset-Based) has updated its calculated fair value range following new data ingestion.

CANONICAL EVENT METADATA:
  EVENT ID:                RES-002
  EVENT NAME:              FAIR_VALUE_MODEL_UPDATED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Research Domain
  ORIGINATING CAPABILITY:  RES-EQR-001 — Equity Research Synthesis
  BUSINESS OBJECT:         FairValueModel
  MARKET CLASS:            ALL
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       CALCULATED
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         ISIN + ModelType + ValuationTimestamp
  CORRELATION ID:          CORR-FV-UPDATE

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           RES_EQUITY_RESEARCH_PUBLISHED
    PART OF CHAIN:         Chain 5: Earnings Release & AI Research

TRIGGER: New quarterly financial statement ingested or discount rate parameters updated
PRECONDITIONS: DCF valuation model inputs validated
POSTCONDITIONS: FairValueModel record updated with new fair value band and margin of safety %
BUSINESS RULES: Rule 26: Fair value models must explicitly disclose sensitivity matrices.
BUSINESS OBJECTS AFFECTED: FairValueModel MODIFIED
ORIGINATING CAPABILITY: RES-EQR-001 — Equity Research Synthesis
CONSUMING CAPABILITIES: RES-EQR-001 — Valuation Modeling
POTENTIAL DOMAIN CONSUMERS: Equity Research, AI Recommendation Engine

SEVERITY: INFO
SOURCE CONFIDENCE: CALCULATED
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Medium
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Valuation input parameter sensitivity snapshot archived
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX DCF models update automatically on quarterly earnings filings
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: UPDATE_DCF, FAIR_VALUE_CALCULATED
═══════════════════════════════════════════════════════════════════════════════
## 3P — Economic Calendar Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                MAC-004
EVENT NAME:              ECONOMIC_INDICATOR_PUBLISHED
ARABIC NAME:             نشر المؤشر الاقتصادي
TAXONOMY:                Category 16: Economic Calendar Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An official statistical authority has released a scheduled economic data metric (e.g., Inflation CPI, GDP growth rate, unemployment rate).

CANONICAL EVENT METADATA:
  EVENT ID:                MAC-004
  EVENT NAME:              ECONOMIC_INDICATOR_PUBLISHED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Macro Domain
  ORIGINATING CAPABILITY:  MAC-IND-001 — Macroeconomic Intelligence
  BUSINESS OBJECT:         EconomicIndicator
  MARKET CLASS:            CLASS 5 (Indices / Macro)
  ASSET CLASS:             Macroeconomic

  SOURCE CONFIDENCE:       REGULATED_BODY
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              PublishingAuthority
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            GPS_SYNCHRONIZED

  IDEMPOTENCY KEY:         CountryCode + IndicatorCode + Period
  CORRELATION ID:          CORR-MAC-PUB

  RELATED EVENTS:
    PRECEDED BY:           MAC_HIGH_IMPACT_EVENT_STARTED
    FOLLOWED BY:           RISK_STRESS_TEST_EXECUTED
    PART OF CHAIN:         Chain 6: Economic Release & Risk Recalibration

TRIGGER: Statistical agency releases scheduled data payload at declared release time
PRECONDITIONS: Economic indicator defined in Macro Security Master
POSTCONDITIONS: EconomicIndicator record updated; macro risk stress-testing triggered across portfolios
BUSINESS RULES: Rule 7: Financial data must carry clear source attribution and timestamp.
BUSINESS OBJECTS AFFECTED: EconomicIndicator CREATED
ORIGINATING CAPABILITY: MAC-IND-001 — Macroeconomic Intelligence
CONSUMING CAPABILITIES: MAC-IND-001 — Macroeconomic Intelligence
POTENTIAL DOMAIN CONSUMERS: Risk Assessment, AI Research Engine

SEVERITY: INFO
SOURCE CONFIDENCE: REGULATED_BODY
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Medium
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Official statistical release bulletin reference logged
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: CAPMAS publishes monthly Egyptian CPI inflation data
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: MACRO_DATA_PUBLISHED, CPI_RELEASED
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                MAC-009
EVENT NAME:              CENTRAL_BANK_INTEREST_RATE_CHANGED
ARABIC NAME:             تغير سعر الفائدة من البنك المركزي
TAXONOMY:                Category 16: Economic Calendar Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A Central Bank Monetary Policy Committee announces a change in benchmark interest rates (hike, cut, or emergency adjustment).

CANONICAL EVENT METADATA:
  EVENT ID:                MAC-009
  EVENT NAME:              CENTRAL_BANK_INTEREST_RATE_CHANGED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Macro Domain
  ORIGINATING CAPABILITY:  MAC-IND-001 — Macroeconomic Intelligence
  BUSINESS OBJECT:         EconomicIndicator
  MARKET CLASS:            CLASS 5 (Indices / Macro)
  ASSET CLASS:             Macroeconomic

  SOURCE CONFIDENCE:       REGULATED_BODY
  SEVERITY:                CRITICAL

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              CentralBankMIC
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            GPS_SYNCHRONIZED

  IDEMPOTENCY KEY:         CentralBankID + DecisionDate + NewRate
  CORRELATION ID:          CORR-RATE-CHANGE

  RELATED EVENTS:
    PRECEDED BY:           MAC_CENTRAL_BANK_POLICY_DECISION_PUBLISHED
    FOLLOWED BY:           XMKT_MARKET_REGIME_CHANGED
    PART OF CHAIN:         Chain 13: Central Bank Rate Shock

TRIGGER: Central Bank Monetary Policy Committee concludes meeting and issues official rate decision decree
PRECONDITIONS: Meeting date was scheduled or emergency session called
POSTCONDITIONS: Benchmark interest rate record updated; fixed income valuation models, DCF discount rates, and portfolio risk sensitivity recalculated platform-wide
BUSINESS RULES: Rule 7: Mandatory source attribution and execution timestamp.
BUSINESS OBJECTS AFFECTED: EconomicIndicator MODIFIED; FairValueModel MODIFIED
ORIGINATING CAPABILITY: MAC-IND-001 — Macroeconomic Intelligence
CONSUMING CAPABILITIES: MAC-IND-001 — Macroeconomic Intelligence
POTENTIAL DOMAIN CONSUMERS: Fixed Income Analytics, Risk Engine, Research Generator

SEVERITY: CRITICAL
SOURCE CONFIDENCE: REGULATED_BODY
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Rare
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Official Central Bank Monetary Policy Committee press release archived
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Central Bank of Egypt (CBE) MPC interest rate decisions update EGP discount rates
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: RATE_DECISION_PUBLISHED, INTEREST_RATE_HIKE
═══════════════════════════════════════════════════════════════════════════════
## 3Q — AI and Intelligence Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                AI-001
EVENT NAME:              AI_RECOMMENDATION_GENERATED
ARABIC NAME:             توليد توصية من الذكاء الاصطناعي
TAXONOMY:                Category 17: AI & Intelligence Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A personalized investment recommendation payload (Action, Target Valuation, Rationale, Assumptions, Risk Warnings) has been produced by the AI engine for a specific user.

CANONICAL EVENT METADATA:
  EVENT ID:                AI-001
  EVENT NAME:              AI_RECOMMENDATION_GENERATED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            AI Domain
  ORIGINATING CAPABILITY:  AI-REC-001 — Personalized Recommendation Synthesis
  BUSINESS OBJECT:         Recommendation
  MARKET CLASS:            ALL
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       AI_GENERATED
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         UserID + ISIN + RecommendationTimestamp
  CORRELATION ID:          CORR-AI-REC-001

  RELATED EVENTS:
    PRECEDED BY:           RES_EQUITY_RESEARCH_PUBLISHED
    FOLLOWED BY:           ALRT_NOTIFICATION_DISPATCHED
    PART OF CHAIN:         Chain 5: Earnings Release & AI Research

TRIGGER: AI engine completes multi-factor evaluation of asset against user risk profile and portfolio holdings
PRECONDITIONS: User profile exists and confidence score meets platform generation threshold (>= 60%)
POSTCONDITIONS: Recommendation record created with explicit validity expiration window; ready for dispatch
BUSINESS RULES: Rule 1: Every recommendation must include explicit rationale, confidence level %, assumptions, and downside risk disclosures. Rule 38: Confidence < 60% suppresses generation.
BUSINESS OBJECTS AFFECTED: Recommendation CREATED; AuditLog CREATED
ORIGINATING CAPABILITY: AI-REC-001 — Personalized Recommendation Synthesis
CONSUMING CAPABILITIES: AI-REC-001 — AI Recommendation Engine
POTENTIAL DOMAIN CONSUMERS: Notification Service, Audit Logging, User UI

SEVERITY: INFO
SOURCE CONFIDENCE: AI_GENERATED
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Medium
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Full reasoning chain, input data snapshot, and confidence score logged for regulatory audit
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Generated in native Arabic for Egyptian retail users
MARKET TIMEZONE NOTES: Platform local timezone context
FORBIDDEN SYNONYMS: GENERATE_RECOMMENDATION, AI_ADVICE_PRODUCED
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                AI-002
EVENT NAME:              AI_MODEL_DRIFT_DETECTED
ARABIC NAME:             رصد انحراف نموذج الذكاء الاصطناعي
TAXONOMY:                Category 17: AI & Intelligence Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  Monitored prediction accuracy metrics indicate an AI model's inferences diverge significantly from actual historical market distribution.

CANONICAL EVENT METADATA:
  EVENT ID:                AI-002
  EVENT NAME:              AI_MODEL_DRIFT_DETECTED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            AI Domain
  ORIGINATING CAPABILITY:  AI-REC-001 — AI Model Governance
  BUSINESS OBJECT:         AISignal
  MARKET CLASS:            ALL
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       AI_GENERATED
  SEVERITY:                WARNING

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         ModelID + DriftMetric + DetectionTimestamp
  CORRELATION ID:          CORR-MODEL-DRIFT

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           AI_RECOMMENDATION_WITHDRAWN
    PART OF CHAIN:         Chain 20: AI Model Drift & Recovery

TRIGGER: Model monitoring process identifies accuracy calibration dropping below threshold limit
PRECONDITIONS: AI model is active in production
POSTCONDITIONS: Model drift warning flagged; active recommendations generated by model marked for review or withdrawn
BUSINESS RULES: Rule 38: AI model confidence thresholds enforced.
BUSINESS OBJECTS AFFECTED: AISignal MODIFIED; AuditLog CREATED
ORIGINATING CAPABILITY: AI-REC-001 — AI Model Governance
CONSUMING CAPABILITIES: AI-REC-001 — Model Monitoring
POTENTIAL DOMAIN CONSUMERS: Admin Operations, Compliance Logging

SEVERITY: WARNING
SOURCE CONFIDENCE: AI_GENERATED
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Model drift evidence archived for AI governance audit
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Monitors regional MENA market regime shifts
MARKET TIMEZONE NOTES: Platform timezone
FORBIDDEN SYNONYMS: MODEL_DRIFT, ACCURACY_DEGRADED
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                AI-003
EVENT NAME:              AI_REASONING_CHAIN_GENERATED
ARABIC NAME:             توليد سلسلة الاستدلال للذكاء الاصطناعي
TAXONOMY:                Category 17: AI & Intelligence Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A step-by-step mathematical and qualitative causal reasoning chain generated for an AI recommendation to satisfy explainability requirements.

CANONICAL EVENT METADATA:
  EVENT ID:                AI-003
  EVENT NAME:              AI_REASONING_CHAIN_GENERATED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            AI Domain
  ORIGINATING CAPABILITY:  AI-REC-001 — Explainable AI Governance
  BUSINESS OBJECT:         AuditLog
  MARKET CLASS:            ALL
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       AI_GENERATED
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         RecommendationID + ReasoningStepCount
  CORRELATION ID:          CORR-REASON-CHAIN

  RELATED EVENTS:
    PRECEDED BY:           AI_RECOMMENDATION_GENERATED
    FOLLOWED BY:           None
    PART OF CHAIN:         Chain 5: Earnings Release & AI Research

TRIGGER: AI engine synthesizes recommendation rationale breakdown
PRECONDITIONS: Recommendation payload created
POSTCONDITIONS: Auditable reasoning chain stored; rendered in user UI explainability modal
BUSINESS RULES: Rule 1: AI recommendations must include explicit causal rationale.
BUSINESS OBJECTS AFFECTED: AuditLog CREATED
ORIGINATING CAPABILITY: AI-REC-001 — Explainable AI Governance
CONSUMING CAPABILITIES: AI-REC-001 — Explainability Engine
POTENTIAL DOMAIN CONSUMERS: User Client UI, Compliance Officer Audit

SEVERITY: INFO
SOURCE CONFIDENCE: AI_GENERATED
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Medium
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Explainability chain logged for 7-year retention compliance
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Reasoning rendered in native Right-to-Left Arabic text
MARKET TIMEZONE NOTES: Platform timezone
FORBIDDEN SYNONYMS: EXPLAINABILITY_CHAIN_CREATED, RATIONALE_LOGGED
═══════════════════════════════════════════════════════════════════════════════
## 3R — Portfolio Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                PORT-001
EVENT NAME:              PORTFOLIO_NAV_RECALCULATED
ARABIC NAME:             إعادة حساب صافي قيمة أصول المحفظة
TAXONOMY:                Category 18: Portfolio Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  The total Net Asset Value (NAV), unrealized P&L, and cash balance of a user portfolio recalculated following price tick or transaction.

CANONICAL EVENT METADATA:
  EVENT ID:                PORT-001
  EVENT NAME:              PORTFOLIO_NAV_RECALCULATED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Portfolio Domain
  ORIGINATING CAPABILITY:  PORT-TRK-001 — Portfolio Tracking & Ledger
  BUSINESS OBJECT:         Portfolio
  MARKET CLASS:            ALL
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       CALCULATED
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         PortfolioID + Timestamp + NAV
  CORRELATION ID:          CORR-NAV-RECALC

  RELATED EVENTS:
    PRECEDED BY:           MKT_PRICE_TICK_RECEIVED
    FOLLOWED BY:           RISK_VAR_BREACHED
    PART OF CHAIN:         Chain 1: Session Opening & Tick Ingestion

TRIGGER: Price tick received for held security, FX rate updated, or transaction recorded
PRECONDITIONS: Portfolio is active and contains target holding
POSTCONDITIONS: Portfolio Current NAV, Realized P&L, and Unrealized Gain/Loss updated; risk checks triggered
BUSINESS RULES: Rule 4: Portfolio performance calculations strictly reproducible, deterministic, and auditable.
BUSINESS OBJECTS AFFECTED: Portfolio MODIFIED
ORIGINATING CAPABILITY: PORT-TRK-001 — Portfolio Tracking & Ledger
CONSUMING CAPABILITIES: PORT-TRK-001 — Portfolio Tracking
POTENTIAL DOMAIN CONSUMERS: Risk Assessment, User Dashboard UI

SEVERITY: INFO
SOURCE CONFIDENCE: CALCULATED
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: High
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: NAV calculation snapshot recorded for performance reporting
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Calculates EGP base currency NAVs for EGX investors
MARKET TIMEZONE NOTES: User preference timezone
FORBIDDEN SYNONYMS: RECALCULATE_NAV, PORTFOLIO_VALUATION_UPDATED
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                PORT-002
EVENT NAME:              BASE_CURRENCY_CHANGED
ARABIC NAME:             تغير العملة الأساسية للمحفظة
TAXONOMY:                Category 18: Portfolio Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A user or wealth advisor changes the primary accounting base currency of a portfolio (e.g., EGP → USD).

CANONICAL EVENT METADATA:
  EVENT ID:                PORT-002
  EVENT NAME:              BASE_CURRENCY_CHANGED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Portfolio Domain
  ORIGINATING CAPABILITY:  PORT-TRK-001 — Portfolio Tracking & Ledger
  BUSINESS OBJECT:         Portfolio
  MARKET CLASS:            ALL
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       MANUAL_ENTRY
  SEVERITY:                WARNING

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         PortfolioID + OldCurrency + NewCurrency
  CORRELATION ID:          CORR-BASE-CURR

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           PORT_PORTFOLIO_NAV_RECALCULATED
    PART OF CHAIN:         None

TRIGGER: User modifies portfolio settings base currency selection
PRECONDITIONS: Target currency is active in platform Currency Master
POSTCONDITIONS: Portfolio Base Currency updated; historical performance figures re-denominated using timestamped FX rates
BUSINESS RULES: Rule 11: All monetary values carry explicit ISO currency context. Rule 37: Foreign exchange impact displayed separately.
BUSINESS OBJECTS AFFECTED: Portfolio MODIFIED
ORIGINATING CAPABILITY: PORT-TRK-001 — Portfolio Tracking & Ledger
CONSUMING CAPABILITIES: PORT-TRK-001 — Portfolio Tracking
POTENTIAL DOMAIN CONSUMERS: Multi-Currency Support, Performance Analytics

SEVERITY: WARNING
SOURCE CONFIDENCE: MANUAL_ENTRY
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Base currency change event logged in portfolio audit ledger
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Supports EGP, SAR, AED, USD, EUR base currencies
MARKET TIMEZONE NOTES: User preference timezone
FORBIDDEN SYNONYMS: CHANGE_BASE_CURRENCY, SWITCH_PORTFOLIO_CURRENCY
═══════════════════════════════════════════════════════════════════════════════
## 3S — Risk Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                RISK-001
EVENT NAME:              RISK_THRESHOLD_BREACHED
ARABIC NAME:             تجاوز حد المخاطر المسموح به
TAXONOMY:                Category 19: Risk Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A portfolio's risk metric (Value-at-Risk, sector concentration, or max drawdown) has breached the user's declared risk profile tolerance limit.

CANONICAL EVENT METADATA:
  EVENT ID:                RISK-001
  EVENT NAME:              RISK_THRESHOLD_BREACHED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Risk Domain
  ORIGINATING CAPABILITY:  RISK-EVAL-001 — Portfolio Risk Assessment
  BUSINESS OBJECT:         RiskProfile
  MARKET CLASS:            ALL
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       CALCULATED
  SEVERITY:                CRITICAL

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         PortfolioID + RiskMetric + ThresholdValue + MeasuredValue
  CORRELATION ID:          CORR-RISK-BREACH

  RELATED EVENTS:
    PRECEDED BY:           PORT_PORTFOLIO_NAV_RECALCULATED
    FOLLOWED BY:           ALRT_NOTIFICATION_DISPATCHED
    PART OF CHAIN:         Chain 7: Real-Time Risk Breach & Notification

TRIGGER: Portfolio risk assessment service computes VaR or drawdown exceeding target limit
PRECONDITIONS: Portfolio is active and user risk profile registered
POSTCONDITIONS: Risk breach alert generated; high-priority notification dispatched to user app; rebalancing actions suggested
BUSINESS RULES: Rule 6: Risk assessments must directly reference user risk profile. Rule 29: High-priority risk alerts override muted settings.
BUSINESS OBJECTS AFFECTED: RiskProfile MODIFIED; Alert CREATED
ORIGINATING CAPABILITY: RISK-EVAL-001 — Portfolio Risk Assessment
CONSUMING CAPABILITIES: RISK-EVAL-001 — Portfolio Risk Assessment
POTENTIAL DOMAIN CONSUMERS: Alert Notification Engine, User Dashboard

SEVERITY: CRITICAL
SOURCE CONFIDENCE: CALCULATED
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Medium
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Risk breach and escalation log archived for audit compliance
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Monitors portfolio drawdowns during volatile EGX sessions
MARKET TIMEZONE NOTES: User preference timezone
FORBIDDEN SYNONYMS: RISK_BREACH, VAR_EXCEEDED
═══════════════════════════════════════════════════════════════════════════════
## 3T — Alert & Notification Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                ALRT-001
EVENT NAME:              NOTIFICATION_DISPATCHED
ARABIC NAME:             إرسال إشعار للمستخدم
TAXONOMY:                Category 20: Alert & Notification Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A formatted notification payload (Headline, Body Text, Route, Priority) has been dispatched to a user device channel.

CANONICAL EVENT METADATA:
  EVENT ID:                ALRT-001
  EVENT NAME:              NOTIFICATION_DISPATCHED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Notification Domain
  ORIGINATING CAPABILITY:  ALRT-NOT-001 — Alert & Notification Engine
  BUSINESS OBJECT:         Notification
  MARKET CLASS:            ALL
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       CALCULATED
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         NotificationID + UserID + DispatchChannel
  CORRELATION ID:          CORR-NOTIF-001

  RELATED EVENTS:
    PRECEDED BY:           RISK_THRESHOLD_BREACHED
    FOLLOWED BY:           None
    PART OF CHAIN:         Chain 7: Real-Time Risk Breach & Notification

TRIGGER: Alert condition fulfilled or high-priority system insight generated
PRECONDITIONS: User channel preferences active
POSTCONDITIONS: Notification delivered to client device; delivery status logged
BUSINESS RULES: Rule 29: High-priority risk threshold alerts override muted non-essential notification settings.
BUSINESS OBJECTS AFFECTED: Notification CREATED
ORIGINATING CAPABILITY: ALRT-NOT-001 — Alert & Notification Engine
CONSUMING CAPABILITIES: ALRT-NOT-001 — Notification Engine
POTENTIAL DOMAIN CONSUMERS: User Mobile App, Email Dispatcher

SEVERITY: INFO
SOURCE CONFIDENCE: CALCULATED
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: High
ORDERING SENSITIVITY: Independent
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Notification dispatch timestamp and delivery confirmation logged
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Native Arabic push notification dispatches
MARKET TIMEZONE NOTES: User preference timezone
FORBIDDEN SYNONYMS: DISPATCH_NOTIFICATION, PUSH_SENT
═══════════════════════════════════════════════════════════════════════════════
## 3U — User and Identity Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                USER-001
EVENT NAME:              USER_REGISTERED
ARABIC NAME:             تسجيل مستخدم جديد
TAXONOMY:                Category 21: User & Identity Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A new user account has been successfully created and registered on the Tradeora platform.

CANONICAL EVENT METADATA:
  EVENT ID:                USER-001
  EVENT NAME:              USER_REGISTERED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            User Identity Domain
  ORIGINATING CAPABILITY:  USER-MGT-001 — User Profile Governance
  BUSINESS OBJECT:         UserProfile
  MARKET CLASS:            ALL
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       MANUAL_ENTRY
  SEVERITY:                NOTICE

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         UserID + RegistrationTimestamp
  CORRELATION ID:          CORR-USER-REG

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           USER_RISK_PROFILE_UPDATED
    PART OF CHAIN:         Chain 8: User Onboarding & Risk Profiling

TRIGGER: User completes registration signup form and email verification
PRECONDITIONS: Email and username unique in user database
POSTCONDITIONS: UserProfile object CREATED; default basic subscription entitlement assigned
BUSINESS RULES: Rule 19: Language switching preserves operational state. Rule 20: Rights enforced at boundary.
BUSINESS OBJECTS AFFECTED: UserProfile CREATED
ORIGINATING CAPABILITY: USER-MGT-001 — User Profile Governance
CONSUMING CAPABILITIES: USER-MGT-001 — User Profile Management
POTENTIAL DOMAIN CONSUMERS: Onboarding Intelligence, Subscription Service

SEVERITY: NOTICE
SOURCE CONFIDENCE: MANUAL_ENTRY
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: User onboarding consent and regulatory disclaimers recorded
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: EGX retail investor onboarding with Arabic preference option
MARKET TIMEZONE NOTES: User local timezone
FORBIDDEN SYNONYMS: CREATE_USER, ONBOARD_USER
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                USER-002
EVENT NAME:              USER_RISK_PROFILE_UPDATED
ARABIC NAME:             تحديث ملف مخاطر المستخدم
TAXONOMY:                Category 21: User & Identity Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A user's financial capacity, loss tolerance, and risk classification (Conservative, Moderate, Growth, Aggressive) updated following onboarding or annual review.

CANONICAL EVENT METADATA:
  EVENT ID:                USER-002
  EVENT NAME:              USER_RISK_PROFILE_UPDATED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            User Identity Domain
  ORIGINATING CAPABILITY:  USER-MGT-001 — User Risk Profiling
  BUSINESS OBJECT:         RiskProfile
  MARKET CLASS:            ALL
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       MANUAL_ENTRY
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         UserID + RiskScore + CapacityTier
  CORRELATION ID:          CORR-RISK-PROF

  RELATED EVENTS:
    PRECEDED BY:           USER_USER_REGISTERED
    FOLLOWED BY:           AI_RECOMMENDATION_GENERATED
    PART OF CHAIN:         Chain 8: User Onboarding & Risk Profiling

TRIGGER: User completes risk assessment questionnaire or annual review cycle
PRECONDITIONS: UserProfile exists
POSTCONDITIONS: RiskProfile object updated; governs all downstream AI recommendation and risk breach thresholds
BUSINESS RULES: Rule 6: Risk assessments must directly reference declared risk profile. Rule 17: Mandatory annual re-evaluation.
BUSINESS OBJECTS AFFECTED: RiskProfile MODIFIED
ORIGINATING CAPABILITY: USER-MGT-001 — User Risk Profiling
CONSUMING CAPABILITIES: USER-MGT-001 — Risk Profiling
POTENTIAL DOMAIN CONSUMERS: AI Recommendation Engine, Portfolio Risk Engine

SEVERITY: INFO
SOURCE CONFIDENCE: MANUAL_ENTRY
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Risk questionnaire answers and score calculation archived for regulatory compliance
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Arabic suitability questionnaire for MENA retail users
MARKET TIMEZONE NOTES: User local timezone
FORBIDDEN SYNONYMS: UPDATE_RISK_PROFILE, SET_RISK_TOLERANCE
═══════════════════════════════════════════════════════════════════════════════
## 3V — Subscription and Entitlement Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                SUB-001
EVENT NAME:              SUBSCRIPTION_UPGRADED
ARABIC NAME:             ترقية اشتراك المستخدم
TAXONOMY:                Category 22: Subscription & Entitlement Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A user's commercial SaaS subscription tier upgraded (e.g., Basic → Premium or Enterprise), expanding data feed and feature entitlements.

CANONICAL EVENT METADATA:
  EVENT ID:                SUB-001
  EVENT NAME:              SUBSCRIPTION_UPGRADED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Subscription Domain
  ORIGINATING CAPABILITY:  SUB-ENT-001 — Subscription & Feature Entitlement
  BUSINESS OBJECT:         Subscription
  MARKET CLASS:            ALL
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       MANUAL_ENTRY
  SEVERITY:                NOTICE

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         UserID + SubID + NewTier
  CORRELATION ID:          CORR-SUB-UPG

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           None
    PART OF CHAIN:         Chain 9: Subscription Upgrade & Entitlement

TRIGGER: User completes tier upgrade payment transaction
PRECONDITIONS: Payment confirmation verified by billing system
POSTCONDITIONS: Subscription object MODIFIED; Feature Access Gate immediately unlocks high-tier capabilities
BUSINESS RULES: Rule 20: Rights and entitlement access limits enforced on every request.
BUSINESS OBJECTS AFFECTED: Subscription MODIFIED
ORIGINATING CAPABILITY: SUB-ENT-001 — Subscription & Feature Entitlement
CONSUMING CAPABILITIES: SUB-ENT-001 — Subscription Entitlement
POTENTIAL DOMAIN CONSUMERS: Feature Access Gate, User Billing Service

SEVERITY: NOTICE
SOURCE CONFIDENCE: MANUAL_ENTRY
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Billing transaction invoice and entitlement grant archived
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Multi-currency SaaS billing support (EGP, SAR, USD)
MARKET TIMEZONE NOTES: User preference timezone
FORBIDDEN SYNONYMS: UPGRADE_TIER, EXPAND_ENTITLEMENTS
═══════════════════════════════════════════════════════════════════════════════
## 3W — Regulatory Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                REG-001
EVENT NAME:              TRADING_RESTRICTION_APPLIED
ARABIC NAME:             تطبيق قيد تداول تنظيمي
TAXONOMY:                Category 23: Regulatory Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A statutory regulatory authority (e.g., FRA, CMA, SEC) imposes a binding trading restriction (margin restriction, price limit cap, ownership ceiling) on a security.

CANONICAL EVENT METADATA:
  EVENT ID:                REG-001
  EVENT NAME:              TRADING_RESTRICTION_APPLIED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Regulatory Domain
  ORIGINATING CAPABILITY:  REG-GOV-001 — Regulatory Compliance Governance
  BUSINESS OBJECT:         Instrument
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       REGULATED_BODY
  SEVERITY:                CRITICAL

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ISIN + RestrictionType + LegalRef
  CORRELATION ID:          CORR-REG-RESTRICT

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           REG_TRADING_RESTRICTION_LIFTED
    PART OF CHAIN:         Chain 17: Instrument Suspension & Reinstatement

TRIGGER: Regulator issues official statutory decree or circular
PRECONDITIONS: Target instrument exists in Security Master
POSTCONDITIONS: Regulatory restriction applied in platform Security Master; trading capabilities restricted per legal mandate
BUSINESS RULES: Rule 23: Strict operational separation between informative intelligence and licensed individual advice.
BUSINESS OBJECTS AFFECTED: Instrument MODIFIED
ORIGINATING CAPABILITY: REG-GOV-001 — Regulatory Compliance Governance
CONSUMING CAPABILITIES: REG-GOV-001 — Regulatory Compliance
POTENTIAL DOMAIN CONSUMERS: Risk Engine, Screening Engine, User Client UI

SEVERITY: CRITICAL
SOURCE CONFIDENCE: REGULATED_BODY
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Statutory decree legal reference number archived for regulatory audit
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: FRA margin trading restrictions applied on specific EGX equities
MARKET TIMEZONE NOTES: Exchange local timezone
FORBIDDEN SYNONYMS: APPLY_RESTRICTION, BAN_TRADING
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                REG-004
EVENT NAME:              SHORT_SELLING_SUSPENDED
ARABIC NAME:             تعليق البيع على المكشوف
TAXONOMY:                Category 23: Regulatory Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A regulatory authority publishes a temporary or permanent ban on short-selling mechanisms across market securities during high volatility periods.

CANONICAL EVENT METADATA:
  EVENT ID:                REG-004
  EVENT NAME:              SHORT_SELLING_SUSPENDED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Regulatory Domain
  ORIGINATING CAPABILITY:  REG-GOV-001 — Regulatory Compliance Governance
  BUSINESS OBJECT:         Exchange
  MARKET CLASS:            CLASS 1 (Exchange-Traded)
  ASSET CLASS:             Equities

  SOURCE CONFIDENCE:       REGULATED_BODY
  SEVERITY:                WARNING

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Exchange MIC Code
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            EXCHANGE_CERTIFIED

  IDEMPOTENCY KEY:         ExchangeMIC + EffectiveDate
  CORRELATION ID:          CORR-SHORT-BAN

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           REG_SHORT_SELLING_RESTRICTION_LIFTED
    PART OF CHAIN:         None

TRIGGER: Financial Regulatory Authority (FRA) issues short-selling ban decree
PRECONDITIONS: Exchange active in Market Master
POSTCONDITIONS: Short-selling indicator flags set to DISABLED; active trading screeners suppress short signals
BUSINESS RULES: Rule 23: Operational compliance with local regulatory limits.
BUSINESS OBJECTS AFFECTED: Exchange MODIFIED
ORIGINATING CAPABILITY: REG-GOV-001 — Regulatory Compliance Governance
CONSUMING CAPABILITIES: REG-GOV-001 — Regulatory Compliance
POTENTIAL DOMAIN CONSUMERS: Signal Generation, Screening Engine

SEVERITY: WARNING
SOURCE CONFIDENCE: REGULATED_BODY
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Rare
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Regulatory ban decree archived
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: FRA temporary short-selling bans on EGX equities
MARKET TIMEZONE NOTES: Timezone Africa/Cairo
FORBIDDEN SYNONYMS: BAN_SHORT_SELLING, DISABLE_SHORT_POSITIONS
═══════════════════════════════════════════════════════════════════════════════
## 3X — Compliance and Audit Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                AUD-001
EVENT NAME:              AUDIT_LOG_RECORDED
ARABIC NAME:             تسجيل سطر سجل التدقيق
TAXONOMY:                Category 24: Compliance & Audit Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  An immutable, tamper-evident audit record detailing a system operation, AI inference payload, user action, or data change created.

CANONICAL EVENT METADATA:
  EVENT ID:                AUD-001
  EVENT NAME:              AUDIT_LOG_RECORDED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Audit Domain
  ORIGINATING CAPABILITY:  AUD-LOG-001 — Audit & Compliance Logging
  BUSINESS OBJECT:         AuditLog
  MARKET CLASS:            ALL
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       CALCULATED
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         ActorID + EventCategory + CorrelationToken
  CORRELATION ID:          CORR-AUD-001

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           None
    PART OF CHAIN:         Chain 14: Audit Snapshot & Compliance Retention

TRIGGER: System operation, AI recommendation generation, or administrative modification executed
PRECONDITIONS: Actor ID and Correlation Token present
POSTCONDITIONS: AuditLog record created; stored in tamper-evident retention ledger
BUSINESS RULES: Rule 24: Audit logs are tamper-evident and retained per regulatory schedules (7 years).
BUSINESS OBJECTS AFFECTED: AuditLog CREATED
ORIGINATING CAPABILITY: AUD-LOG-001 — Audit & Compliance Logging
CONSUMING CAPABILITIES: AUD-LOG-001 — Compliance Logging
POTENTIAL DOMAIN CONSUMERS: Compliance Officer Portal, Regulatory Reporting

SEVERITY: INFO
SOURCE CONFIDENCE: CALCULATED
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Ultra High
ORDERING SENSITIVITY: Independent
IDEMPOTENCY REQUIREMENT: Not Required

REGULATORY CONSIDERATIONS: 7-year immutable retention schedule enforced
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Audit trail for all EGX AI recommendations
MARKET TIMEZONE NOTES: Platform timezone
FORBIDDEN SYNONYMS: RECORD_AUDIT, LOG_COMPLIANCE_EVENT
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                AUD-002
EVENT NAME:              AUDIT_SNAPSHOT_CREATED
ARABIC NAME:             إنشاء لقطة تدقيق نظامية
TAXONOMY:                Category 24: Compliance & Audit Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A scheduled or on-demand complete snapshot of system state, user holdings, and AI model configurations created for regulatory compliance audit.

CANONICAL EVENT METADATA:
  EVENT ID:                AUD-002
  EVENT NAME:              AUDIT_SNAPSHOT_CREATED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Audit Domain
  ORIGINATING CAPABILITY:  AUD-LOG-001 — Audit & Compliance Logging
  BUSINESS OBJECT:         AuditLog
  MARKET CLASS:            ALL
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       SYSTEM_CLOCK
  SEVERITY:                NOTICE

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         SnapshotID + BusinessDate
  CORRELATION ID:          CORR-AUD-SNAP

  RELATED EVENTS:
    PRECEDED BY:           CAL_SESSION_CLOSED
    FOLLOWED BY:           AUD_AUDIT_TRAIL_ARCHIVED
    PART OF CHAIN:         Chain 14: Audit Snapshot & Compliance Retention

TRIGGER: Scheduled EOD process finishes or compliance officer requests snapshot
PRECONDITIONS: EOD prices and transactions locked
POSTCONDITIONS: Audit snapshot created and cryptographically signed
BUSINESS RULES: Rule 24: Audit log retention schedule enforced.
BUSINESS OBJECTS AFFECTED: AuditLog CREATED
ORIGINATING CAPABILITY: AUD-LOG-001 — Audit & Compliance Logging
CONSUMING CAPABILITIES: AUD-LOG-001 — Compliance Logging
POTENTIAL DOMAIN CONSUMERS: Compliance Officer Portal

SEVERITY: NOTICE
SOURCE CONFIDENCE: SYSTEM_CLOCK
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Scheduled
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Cryptographic signature verified and logged
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Daily EOD state snapshot created for EGX session
MARKET TIMEZONE NOTES: Platform timezone
FORBIDDEN SYNONYMS: CREATE_SNAPSHOT, LOCK_AUDIT_STATE
═══════════════════════════════════════════════════════════════════════════════
## 3Y — Reporting Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                RPT-001
EVENT NAME:              CLIENT_REPORT_COMPILED
ARABIC NAME:             تجميع تقرير الأداء للعميل
TAXONOMY:                Category 25: Reporting Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A structured client performance report containing NAV growth, benchmark comparison, TWR returns, and asset attribution compiled.

CANONICAL EVENT METADATA:
  EVENT ID:                RPT-001
  EVENT NAME:              CLIENT_REPORT_COMPILED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Reporting Domain
  ORIGINATING CAPABILITY:  RPT-GEN-001 — Performance Reporting & Export
  BUSINESS OBJECT:         ResearchReport
  MARKET CLASS:            ALL
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       CALCULATED
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         PortfolioID + ReportingPeriod + CompileTimestamp
  CORRELATION ID:          CORR-RPT-001

  RELATED EVENTS:
    PRECEDED BY:           PORT_PORTFOLIO_NAV_RECALCULATED
    FOLLOWED BY:           RPT_PDF_EXPORT_GENERATED
    PART OF CHAIN:         None

TRIGGER: User or wealth advisor clicks 'Generate Report' or end-of-period schedule triggers
PRECONDITIONS: Portfolio transaction ledger and prices verified
POSTCONDITIONS: Client performance report dataset compiled; ready for rendering or PDF generation
BUSINESS RULES: Rule 4: Performance calculations strictly auditable.
BUSINESS OBJECTS AFFECTED: ResearchReport CREATED
ORIGINATING CAPABILITY: RPT-GEN-001 — Performance Reporting & Export
CONSUMING CAPABILITIES: RPT-GEN-001 — Reporting Engine
POTENTIAL DOMAIN CONSUMERS: Wealth Advisor Portal, User Client UI

SEVERITY: INFO
SOURCE CONFIDENCE: CALCULATED
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Medium
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Report generation audit record logged
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Bilingual Arabic/English client performance reports
MARKET TIMEZONE NOTES: User preference timezone
FORBIDDEN SYNONYMS: COMPILE_REPORT, GENERATE_CLIENT_STATEMENT
═══════════════════════════════════════════════════════════════════════════════
## 3Z — Cross-Market Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                XMKT-001
EVENT NAME:              CROSS_MARKET_CORRELATION_DETECTED
ARABIC NAME:             رصد ترابط بين الأسواق المتقاطعة
TAXONOMY:                Category 26: Cross-Market Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A significant correlation shift or dual-listing spread anomaly detected between related assets across different regional or global exchanges.

CANONICAL EVENT METADATA:
  EVENT ID:                XMKT-001
  EVENT NAME:              CROSS_MARKET_CORRELATION_DETECTED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Cross-Market Domain
  ORIGINATING CAPABILITY:  XMKT-ANA-001 — Cross-Market Correlation Engine
  BUSINESS OBJECT:         AISignal
  MARKET CLASS:            CLASS 1 & 2
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       AI_GENERATED
  SEVERITY:                INFO

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         AssetA + AssetB + CorrelationCoeff
  CORRELATION ID:          CORR-XMKT-001

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           XMKT_CROSS_ASSET_OPPORTUNITY_DETECTED
    PART OF CHAIN:         Chain 11: Cross-Market Arbitrage Signal

TRIGGER: Cross-market quantitative engine evaluates real-time price feeds across EGX, London, and GCC exchanges
PRECONDITIONS: Assets are active in Security Master
POSTCONDITIONS: Cross-market signal generated; dispatches arbitrage alert to quantitative subscribers
BUSINESS RULES: Rule 21: Dual-listing spreads must use timestamped exchange rates.
BUSINESS OBJECTS AFFECTED: AISignal CREATED
ORIGINATING CAPABILITY: XMKT-ANA-001 — Cross-Market Correlation Engine
CONSUMING CAPABILITIES: XMKT-ANA-001 — Cross-Market Analytics
POTENTIAL DOMAIN CONSUMERS: Signal Generation, AI Research Engine

SEVERITY: INFO
SOURCE CONFIDENCE: AI_GENERATED
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: High
ORDERING SENSITIVITY: Independent
IDEMPOTENCY REQUIREMENT: Not Required

REGULATORY CONSIDERATIONS: Calculated correlation inputs and FX rate attribution logged
AUDIT REQUIREMENTS: RECOMMENDED
EGX-SPECIFIC NOTES: EGX dual-listed stocks (e.g., Commercial International Bank COMI.CA vs LSE CIBq.L)
MARKET TIMEZONE NOTES: Cross-market timezone alignment
FORBIDDEN SYNONYMS: CORRELATION_SHIFT, DUAL_LISTING_SPREAD_ALERT
═══════════════════════════════════════════════════════════════════════════════
## 3AA — Platform Operations Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                SYS-001
EVENT NAME:              DATA_FEED_FAILOVER_TRIGGERED
ARABIC NAME:             تفعيل المسار البديل لموجز البيانات
TAXONOMY:                Category 27: Platform Operations Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  The platform health monitor automatically routes data ingestion from a degraded primary vendor stream to a secondary verified backup vendor stream.

CANONICAL EVENT METADATA:
  EVENT ID:                SYS-001
  EVENT NAME:              DATA_FEED_FAILOVER_TRIGGERED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Platform Operations Domain
  ORIGINATING CAPABILITY:  SYS-OPS-001 — Platform Health & Failover Router
  BUSINESS OBJECT:         DataSource
  MARKET CLASS:            ALL
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       SYSTEM_CLOCK
  SEVERITY:                ERROR

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               MILLISECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         PrimaryVendor + SecondaryVendor + TriggerReason
  CORRELATION ID:          CORR-SYS-FAILOVER

  RELATED EVENTS:
    PRECEDED BY:           SYS_DATA_VENDOR_FEED_INTERRUPTED
    FOLLOWED BY:           SYS_DATA_VENDOR_FEED_RESTORED
    PART OF CHAIN:         Chain 10: Data Vendor Interruption & Failover

TRIGGER: Primary market data feed heartbeat fails or latency exceeds SLA threshold limit for > 5 seconds
PRECONDITIONS: Secondary backup vendor stream is healthy and active
POSTCONDITIONS: Data ingestion router switches active stream; operational alert dispatched to engineering ops
BUSINESS RULES: Rule 33: Feature flags allow instantaneous disabling of failing feeds without disrupting platform availability.
BUSINESS OBJECTS AFFECTED: DataSource MODIFIED
ORIGINATING CAPABILITY: SYS-OPS-001 — Platform Health & Failover Router
CONSUMING CAPABILITIES: SYS-OPS-001 — Platform Failover Router
POTENTIAL DOMAIN CONSUMERS: Admin Operations, Health Monitoring

SEVERITY: ERROR
SOURCE CONFIDENCE: SYSTEM_CLOCK
BUSINESS CRITICALITY: Mission Critical
EVENT FREQUENCY: Rare
ORDERING SENSITIVITY: Strict
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Failover event and stream switch duration archived
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Ensures uninterrupted EGX live quote visibility
MARKET TIMEZONE NOTES: Platform timezone
FORBIDDEN SYNONYMS: TRIGGER_FAILOVER, SWITCH_DATA_VENDOR
═══════════════════════════════════════════════════════════════════════════════
## 3AB — Administrative Events

═══════════════════════════════════════════════════════════════════════════════
EVENT ID:                SYS-010
EVENT NAME:              SYSTEM_PARAMETER_UPDATED
ARABIC NAME:             تحديث معلمة النظام
TAXONOMY:                Category 28: Administrative Events
VERSION:                 1.0
STATUS:                  Active
═══════════════════════════════════════════════════════════════════════════════

BUSINESS MEANING:
  A global platform system parameter (e.g., maximum risk drawdown alert threshold, AI confidence minimum cut-off) modified by a authorized administrator.

CANONICAL EVENT METADATA:
  EVENT ID:                SYS-010
  EVENT NAME:              SYSTEM_PARAMETER_UPDATED
  VERSION:                 1.0
  STATUS:                  Active

  OWNER DOMAIN:            Administrative Governance Domain
  ORIGINATING CAPABILITY:  SYS-ADM-001 — Platform System Governance
  BUSINESS OBJECT:         UserProfile
  MARKET CLASS:            ALL
  ASSET CLASS:             Multi-Asset

  SOURCE CONFIDENCE:       MANUAL_ENTRY
  SEVERITY:                NOTICE

  TIME MODEL:
    Effective Time:        ISO 8601 UTC
    Recorded Time:         ISO 8601 UTC
    Business Date:         YYYY-MM-DD
    Exchange Date:         YYYY-MM-DD
    Timezone ID:           IANA Timezone
    MIC Code:              Platform
    UTC Offset:            UTC Offset
    DST Active:            YES/NO

  PRECISION:               SECOND
  CLOCK SOURCE:            SYSTEM_CLOCK

  IDEMPOTENCY KEY:         ParameterName + PreviousValue + NewValue + AdminID
  CORRELATION ID:          CORR-SYS-PARAM

  RELATED EVENTS:
    PRECEDED BY:           None
    FOLLOWED BY:           None
    PART OF CHAIN:         None

TRIGGER: Platform Administrator modifies global parameter in Admin Governance Console
PRECONDITIONS: Administrator credentials verified with dual-authorization approval
POSTCONDITIONS: Global parameter updated; immediate policy effect applied to downstream analytical engines
BUSINESS RULES: Rule 24: Tamper-evident administrative audit trail required.
BUSINESS OBJECTS AFFECTED: UserProfile MODIFIED; AuditLog CREATED
ORIGINATING CAPABILITY: SYS-ADM-001 — Platform System Governance
CONSUMING CAPABILITIES: SYS-ADM-001 — Platform Governance
POTENTIAL DOMAIN CONSUMERS: Audit Logging, AI Engine Governance

SEVERITY: NOTICE
SOURCE CONFIDENCE: MANUAL_ENTRY
BUSINESS CRITICALITY: Business Critical
EVENT FREQUENCY: Low
ORDERING SENSITIVITY: Causal
IDEMPOTENCY REQUIREMENT: Required

REGULATORY CONSIDERATIONS: Dual-authorization admin approval log archived
AUDIT REQUIREMENTS: MANDATORY
EGX-SPECIFIC NOTES: Admin updates EGX default market risk parameters
MARKET TIMEZONE NOTES: Platform timezone
FORBIDDEN SYNONYMS: UPDATE_PARAM, CHANGE_SYSTEM_SETTING
═══════════════════════════════════════════════════════════════════════════════
# SECTION 4 — EVENT DEPENDENCY CHAINS

This section cataloging Tradeora's 20 authoritative business event dependency chains. Each chain models the end-to-end flow of domain events triggered by a primary business event, detailing intermediate business transitions, final state, and explicit failure scenario handling.

---

### Chain 1: Market Session Opening & Tick Ingestion
- **Trigger Event**: `CAL_SESSION_OPENED` (CAL-001)
- **Sequence of Events**:
  1. `CAL_SESSION_OPENED` (Market transitions to CONTINUOUS trading state)
  2. `CAL_SESSION_SEGMENT_STARTED` (If market is segmented)
  3. `MKT_PRICE_TICK_RECEIVED` (Raw quote ticks ingested)
  4. `MKT_TECHNICAL_INDICATOR_COMPUTED` (Intraday indicators updated)
  5. `PORT_PORTFOLIO_NAV_RECALCULATED` (Portfolio live valuations updated)
- **Final Business State**: Live session active; real-time client streaming and portfolio NAV tracking operational.
- **Failure Handling**: If `MKT_PRICE_TICK_RECEIVED` fails or stalls post session open, `MKT_FEED_LATENCY_THRESHOLD_EXCEEDED` fires, initiating Chain 10 (Failover Router).

---

### Chain 2: Market Session Closing & EOD Valuation
- **Trigger Event**: `CAL_SESSION_CLOSED` (CAL-002)
- **Sequence of Events**:
  1. `CAL_SESSION_CLOSED` (Continuous trading concludes)
  2. `MKT_EOD_PRICES_PUBLISHED` (Official closing prices published)
  3. `PORT_PORTFOLIO_NAV_RECALCULATED` (Daily EOD NAV and performance returns locked)
  4. `AUD_AUDIT_SNAPSHOT_CREATED` (EOD cryptographic audit snapshot recorded)
- **Final Business State**: EOD market session closed; official daily NAVs locked for accounting.
- **Failure Handling**: If `MKT_EOD_PRICES_PUBLISHED` is delayed beyond expected window, `MKT_MISSING_MARKET_DATA_DETECTED` fires, flagging admin ops and postponing EOD portfolio locking until official prices arrive or secondary fallback prices are confirmed.

---

### Chain 3: Corporate Cash Dividend Lifecycle
- **Trigger Event**: `CORP_CORPORATE_ACTION_ANNOUNCED` (CORP-001)
- **Sequence of Events**:
  1. `CORP_CORPORATE_ACTION_ANNOUNCED` (Issuer files dividend announcement)
  2. `CORP_CORPORATE_ACTION_APPROVED` (Shareholders approve dividend rate)
  3. `CORP_CORPORATE_ACTION_EX_DATE_REACHED` (Stock trades ex-dividend; holder list frozen)
  4. `CORP_CORPORATE_ACTION_RECORD_DATE_REACHED` (Catering record confirmed)
  5. `CORP_CORPORATE_ACTION_PAY_DATE_REACHED` (Pay date arrives)
  6. `CORP_PORTFOLIO_ADJUSTED_FOR_CORPORATE_ACTION` (Cash credited to portfolio)
  7. `CORP_CORPORATE_ACTION_COMPLETED` (Action marked complete)
- **Final Business State**: Dividend cash credited to user portfolio ledgers; stock historical prices adjusted.
- **Failure Handling**: If `CORP_CORPORATE_ACTION_PAY_DATE_REACHED` arrives but CSD confirmation fails, `CORP_CORPORATE_ACTION_CORRECTED` fires, suspending automatic portfolio cash crediting until manually reconciled by ops.

---

### Chain 4: Stock Split & Price Adjustment
- **Trigger Event**: `CORP_CORPORATE_ACTION_ANNOUNCED` (CORP-001 — Split Type)
- **Sequence of Events**:
  1. `CORP_CORPORATE_ACTION_ANNOUNCED` (Stock split announced)
  2. `CORP_CORPORATE_ACTION_APPROVED` (Split ratio confirmed)
  3. `CORP_CORPORATE_ACTION_EX_DATE_REACHED` (Ex-split date reached)
  4. `CORP_PRICE_HISTORY_ADJUSTED` (Historical OHLCV series adjusted retroactively)
  5. `CORP_PORTFOLIO_ADJUSTED_FOR_CORPORATE_ACTION` (Position share quantities multiplied, cost basis halved)
- **Final Business State**: Portfolio share quantities updated; percentage historical returns preserved.
- **Failure Handling**: If price history adjustment calculation encounters a division anomaly, `CORP_CORPORATE_ACTION_CORRECTED` halts portfolio share multiplier until verified against official exchange reference prices.

---

### Chain 5: Quarterly Earnings Release & AI Research
- **Trigger Event**: `RES_EARNINGS_REPORT_PARSED` (RES-004)
- **Sequence of Events**:
  1. `RES_EARNINGS_REPORT_PARSED` (Company files quarterly financial statement)
  2. `RES_FAIR_VALUE_MODEL_UPDATED` (DCF fair value bands updated)
  3. `RES_EQUITY_RESEARCH_PUBLISHED` (AI generates institutional research report)
  4. `AI_RECOMMENDATION_GENERATED` (Personalized investment proposals synthesized)
  5. `AI_REASONING_CHAIN_GENERATED` (Causal explainability breakdown recorded)
  6. `ALRT_NOTIFICATION_DISPATCHED` (Research alert sent to subscribers)
- **Final Business State**: Institutional research and personalized recommendations rendered to users.
- **Failure Handling**: If AI confidence score falls below 60%, `AI_RECOMMENDATION_WITHDRAWN` suppresses recommendation dispatch while preserving published equity research.

---

### Chain 6: Economic Data Release & Risk Recalibration
- **Trigger Event**: `MAC_HIGH_IMPACT_EVENT_STARTED` (MAC-003)
- **Sequence of Events**:
  1. `MAC_HIGH_IMPACT_EVENT_STARTED` (Scheduled macro release window begins)
  2. `MAC_ECONOMIC_INDICATOR_PUBLISHED` (Official CPI / GDP metric published)
  3. `RISK_STRESS_TEST_EXECUTED` (Macro shock stress testing executed across portfolios)
  4. `XMKT_MARKET_REGIME_CHANGED` (AI evaluates macro regime shift)
- **Final Business State**: Portfolios stress-tested against new macroeconomic metrics.
- **Failure Handling**: If published economic data is unexpectedly revised, `MAC_ECONOMIC_INDICATOR_REVISED` triggers a secondary risk stress-test run.

---

### Chain 7: Real-Time Risk Breach & Notification
- **Trigger Event**: `PORT_PORTFOLIO_NAV_RECALCULATED` (PORT-001)
- **Sequence of Events**:
  1. `PORT_PORTFOLIO_NAV_RECALCULATED` (Intraday volatility drops portfolio value)
  2. `RISK_VAR_BREACHED` / `RISK_THRESHOLD_BREACHED` (VaR limit crossed)
  3. `ALRT_NOTIFICATION_DISPATCHED` (High-priority push notification sent)
  4. `ALRT_NOTIFICATION_ESCALATED` (Multi-channel escalation if unacknowledged)
- **Final Business State**: User notified of catastrophic loss risk; actionable rebalancing proposals rendered.
- **Failure Handling**: If notification dispatch channel is unreachable, `ALRT_NOTIFICATION_ESCALATED` redirects alert to alternative SMS/Email channels.

---

### Chain 8: User Onboarding & Risk Profiling
- **Trigger Event**: `USER_USER_REGISTERED` (USER-001)
- **Sequence of Events**:
  1. `USER_USER_REGISTERED` (User account created)
  2. `USER_RISK_PROFILE_UPDATED` (Interactive suitability questionnaire completed)
  3. `SUB_TRIAL_STARTED` (Trial subscription entitlements granted)
- **Final Business State**: User legally profiled; personalized feature access enabled.
- **Failure Handling**: If user abandons risk questionnaire, a default CONSERVATIVE risk classification is applied until explicit completion.

---

### Chain 9: Subscription Tier Upgrade & Entitlement Change
- **Trigger Event**: `SUB_SUBSCRIPTION_UPGRADED` (SUB-001)
- **Sequence of Events**:
  1. `SUB_SUBSCRIPTION_UPGRADED` (Upgrade payment confirmed)
  2. `SUB_LICENSE_ASSIGNED` (Tier features unlocked)
  3. `AUD_AUDIT_LOG_RECORDED` (Entitlement grant archived)
- **Final Business State**: User gains immediate access to premium real-time streams and AI models.
- **Failure Handling**: If payment confirmation is revoked by gateway, `SUB_SUBSCRIPTION_DOWNGRADED` immediately revokes premium access.

---

### Chain 10: Data Vendor Interruption & Failover Router
- **Trigger Event**: `SYS_DATA_VENDOR_FEED_STALLED` (SYS-001)
- **Sequence of Events**:
  1. `SYS_DATA_VENDOR_FEED_STALLED` (Heartbeat failure detected > 5s)
  2. `SYS_DATA_VENDOR_FEED_INTERRUPTED` (Primary feed marked down)
  3. `SYS_DATA_FEED_FAILOVER_TRIGGERED` (Ingestion router switches to backup vendor)
  4. `SYS_DATA_VENDOR_FEED_RESTORED` (Primary feed re-established)
- **Final Business State**: Continuous real-time market data streaming maintained without user interruption.
- **Failure Handling**: If secondary vendor also fails, `CAL_MARKET_STATUS_CHANGED` flags market status UNKNOWN and notifies operational engineers.

---

### Chain 11: Cross-Market Arbitrage Signal Chain
- **Trigger Event**: `XMKT_CROSS_MARKET_CORRELATION_DETECTED` (XMKT-001)
- **Sequence of Events**:
  1. `XMKT_CROSS_MARKET_CORRELATION_DETECTED` (Spread anomaly identified between EGX and LSE)
  2. `XMKT_DUAL_LISTING_SPREAD_ANOMALY_DETECTED` (FX-adjusted price spread > 3%)
  3. `XMKT_CROSS_ASSET_OPPORTUNITY_DETECTED` (Arbitrage setup validated)
  4. `ALRT_NOTIFICATION_DISPATCHED` (Signal sent to active traders)
- **Final Business State**: Arbitrage signal delivered to qualified subscribers.
- **Failure Handling**: If FX rate feed becomes stale during spread calculation, signal generation is aborted.

---

### Chain 12: Portfolio Import & Initial Revaluation
- **Trigger Event**: `PORT_PORTFOLIO_IMPORTED` (PORT-005)
- **Sequence of Events**:
  1. `PORT_PORTFOLIO_IMPORTED` (Positions imported from spreadsheet/broker)
  2. `MKT_SECURITY_MASTER_RECORD_UPDATED` (Holdings mapped to Security Master)
  3. `PORT_PORTFOLIO_NAV_RECALCULATED` (Initial NAV and cost basis computed)
  4. `RISK_STRESS_TEST_EXECUTED` (Baseline risk profile evaluated)
- **Final Business State**: Foreign portfolio mapped and baseline risk established.
- **Failure Handling**: If an imported ticker cannot be mapped to Security Master, `MKT_MISSING_MARKET_DATA_DETECTED` flags position for manual user mapping.

---

### Chain 13: Central Bank Interest Rate Shock
- **Trigger Event**: `MAC_CENTRAL_BANK_INTEREST_RATE_CHANGED` (MAC-009)
- **Sequence of Events**:
  1. `MAC_CENTRAL_BANK_INTEREST_RATE_CHANGED` (Central Bank announces rate hike)
  2. `RES_FAIR_VALUE_MODEL_UPDATED` (WACC and discount rates updated)
  3. `XMKT_MARKET_REGIME_CHANGED` (Market regime shifts to High-Rate Environment)
  4. `PORT_PORTFOLIO_NAV_RECALCULATED` (Fixed income valuations recomputed)
- **Final Business State**: Intrinsic valuations and bond holdings re-denominated across platform.
- **Failure Handling**: If DCF models fail to converge under extreme rate hikes, sensitivity fallback models are deployed.

---

### Chain 14: Audit Snapshot Creation & Compliance Retention
- **Trigger Event**: `CAL_SESSION_CLOSED` (CAL-002)
- **Sequence of Events**:
  1. `CAL_SESSION_CLOSED` (Session ends)
  2. `AUD_AUDIT_SNAPSHOT_CREATED` (EOD state snapshot created)
  3. `AUD_AUDIT_TRAIL_ARCHIVED` (Snapshot cryptographically signed and archived)
- **Final Business State**: Immutable EOD compliance snapshot secured.
- **Failure Handling**: If cryptographic signing fails, operational alert notifies compliance officer for manual snapshot verification.

---

### Chain 15: Multi-Currency FX Revaluation
- **Trigger Event**: `FX_SPOT_RATE_UPDATED` (FX-001)
- **Sequence of Events**:
  1. `FX_SPOT_RATE_UPDATED` (Spot FX rate update received)
  2. `XMKT_CROSS_CURRENCY_EXPOSURE_CHANGED` (Portfolio foreign exposure recalculated)
  3. `PORT_PORTFOLIO_NAV_RECALCULATED` (Consolidated NAV updated in base currency)
- **Final Business State**: Multi-currency net asset value updated without calculation drift.
- **Failure Handling**: If FX rate source drops offline, last verified rate is used with stale rate indicator warning.

---

### Chain 16: Market Data Quality Failure Chain
- **Trigger Event**: `MKT_FEED_LATENCY_THRESHOLD_EXCEEDED` (MKT-022)
- **Sequence of Events**:
  1. `MKT_FEED_LATENCY_THRESHOLD_EXCEEDED` (Data feed delay exceeds SLA)
  2. `MKT_MISSING_MARKET_DATA_DETECTED` (Expected ticks missing)
  3. `SYS_DATA_VENDOR_FEED_STALLED` (Feed marked stalled)
  4. `SYS_DATA_FEED_FAILOVER_TRIGGERED` (Failover router switches feed)
  5. `SYS_DATA_VENDOR_FEED_RESTORED` (Feed restored)
  6. `MKT_HISTORICAL_DATA_GAP_IDENTIFIED` (Gap discovered in intraday series)
  7. `MKT_HISTORICAL_DATA_GAP_FILLED` (Missing data backfilled and verified)
- **Final Business State**: Data stream failover executed and historical gaps completely backfilled.
- **Failure Handling**: If backfilled data contains corrupted ticks, `MKT_PRICE_VALIDATION_FAILED` rejects bad ticks during gap filling.

---

### Chain 17: Instrument Suspension & Reinstatement Chain
- **Trigger Event**: `REG_REGULATORY_INVESTIGATION_STARTED` (REG-003)
- **Sequence of Events**:
  1. `REG_REGULATORY_INVESTIGATION_STARTED` (Regulator announces investigation)
  2. `REG_TRADING_RESTRICTION_APPLIED` (Trading restriction decree issued)
  3. `INST_INSTRUMENT_SUSPENDED` (Instrument suspended on exchange)
  4. `REG_MARKET_SURVEILLANCE_ALERT_ISSUED` (Surveillance alert logged)
  5. `REG_TRADING_RESTRICTION_LIFTED` (Investigation concludes; restriction lifted)
  6. `INST_INSTRUMENT_REINSTATED` (Instrument resumes active trading)
- **Final Business State**: Instrument trading halted during regulatory review and safely reinstated post-clearance.
- **Failure Handling**: If investigation results in delisting, `INST_INSTRUMENT_DELISTED` replaces reinstatement event.

---

### Chain 18: Corporate Action Full Lifecycle Chain
- **Trigger Event**: `CORP_CORPORATE_ACTION_ANNOUNCED` (CORP-001)
- **Sequence of Events**:
  1. `CORP_CORPORATE_ACTION_ANNOUNCED` (Corporate action declared)
  2. `CORP_CORPORATE_ACTION_ELECTION_PERIOD_OPENED` (Shareholder election opened)
  3. `CORP_CORPORATE_ACTION_ELECTION_SUBMITTED` (User submits election choice)
  4. `CORP_CORPORATE_ACTION_ELECTION_PERIOD_CLOSED` (Election window closes)
  5. `CORP_CORPORATE_ACTION_APPROVED` (Shareholders ratify action)
  6. `CORP_CORPORATE_ACTION_EX_DATE_REACHED` (Ex-date arrives)
  7. `CORP_PRICE_HISTORY_ADJUSTED` (Historical price series adjusted)
  8. `CORP_CORPORATE_ACTION_RECORD_DATE_REACHED` (Record date frozen)
  9. `CORP_CORPORATE_ACTION_PAY_DATE_REACHED` (Payment date arrives)
  10. `CORP_PORTFOLIO_ADJUSTED_FOR_CORPORATE_ACTION` (Portfolio holdings/cash adjusted)
  11. `CORP_CORPORATE_ACTION_COMPLETED` (Action marked complete)
- **Final Business State**: End-to-end corporate action processed with full shareholder election choices honored.
- **Failure Handling**: If user fails to make an election by deadline, `CORP_CORPORATE_ACTION_DEFAULT_APPLIED` executes default option.

---

### Chain 19: Emergency Market Closure & Reopening Chain
- **Trigger Event**: `CAL_UNSCHEDULED_MARKET_CLOSURE_DECLARED` (CAL-006)
- **Sequence of Events**:
  1. `CAL_UNSCHEDULED_MARKET_CLOSURE_DECLARED` (Unannounced market closure declared)
  2. `CAL_MARKET_STATUS_CHANGED` (Market status set to OFFLINE)
  3. `REG_TRADING_RESTRICTION_APPLIED` (Emergency regulatory restrictions applied)
  4. `SYS_DATA_VENDOR_FEED_INTERRUPTED` (Feed interrupted due to market shutdown)
  5. `CAL_EMERGENCY_MARKET_REOPENING_ANNOUNCED` (Authority announces planned reopening date)
  6. `CAL_MARKET_CALENDAR_UPDATED` (Calendar schedule updated)
  7. `CAL_EMERGENCY_MARKET_REOPENED` (Market confirms resumption)
  8. `CAL_MARKET_STATUS_CHANGED` (Market status returns to CONTINUOUS)
  9. `SYS_DATA_VENDOR_FEED_RESTORED` (Live feeds restored)
- **Final Business State**: Platform safely handles emergency market shutdown and resumes tracking post-reopening.
- **Failure Handling**: If reopening date is postponed, `CAL_MARKET_CALENDAR_UPDATED` issues revised reopening schedule alert.

---

### Chain 20: AI Model Drift & Recovery Chain
- **Trigger Event**: `AI_CONFIDENCE_DISTRIBUTION_SHIFT_DETECTED` (AI-005)
- **Sequence of Events**:
  1. `AI_CONFIDENCE_DISTRIBUTION_SHIFT_DETECTED` (Statistical confidence shift detected)
  2. `AI_MODEL_DRIFT_DETECTED` (Model drift warning flagged)
  3. `AI_RECOMMENDATION_WITHDRAWN` (Active model recommendations withdrawn)
  4. `AI_MODEL_RETRAINED` (Model retrained on updated dataset)
  5. `AI_FEATURE_IMPORTANCE_UPDATED` (Feature weights updated)
  6. `AI_MODEL_DRIFT_RESOLVED` (Model accuracy recalibrated)
  7. `AI_RECOMMENDATION_GENERATED` (Fresh recommendation cycle initiated)
- **Final Business State**: AI model drift corrected; high-accuracy recommendation pipeline restored.
- **Failure Handling**: If retraining fails to achieve target calibration accuracy, model remains withdrawn and admin operations team is alerted.

---

# SECTION 5 — EVENT STORMING MODEL & BOUNDED CONTEXT MAPPING

The following matrix maps every Bounded Context from `docs/BUSINESS_DOMAIN_DISCOVERY.md` Section 18 to its Emitted and Consumed Domain Events:

| Bounded Context Domain | Primary Emitted Events | Primary Consumed Events |
| :--- | :--- | :--- |
| **1. Market Data Ingestion** | `MKT_PRICE_TICK_RECEIVED`, `MKT_EOD_PRICES_PUBLISHED`, `MKT_PRICE_VALIDATION_FAILED` | `CAL_SESSION_OPENED`, `CAL_SESSION_CLOSED`, `SYS_DATA_FEED_FAILOVER_TRIGGERED` |
| **2. Security Master** | `MKT_SECURITY_MASTER_RECORD_CREATED`, `INST_INSTRUMENT_SUSPENDED`, `INST_INSTRUMENT_DELISTED` | `REG_TRADING_RESTRICTION_APPLIED`, `CORP_CORPORATE_ACTION_ANNOUNCED` |
| **3. Fundamental Analysis** | `RES_FAIR_VALUE_MODEL_UPDATED`, `RES_FACTOR_SCORE_COMPUTED` | `RES_EARNINGS_REPORT_PARSED`, `MAC_CENTRAL_BANK_INTEREST_RATE_CHANGED` |
| **4. News & Sentiment** | `AI_SENTIMENT_ANALYSIS_COMPLETED`, `MAC_HIGH_IMPACT_EVENT_STARTED` | `MKT_NEWS_ITEM_PUBLISHED` |
| **5. Equity Research** | `RES_EQUITY_RESEARCH_PUBLISHED` | `RES_FAIR_VALUE_MODEL_UPDATED`, `AI_SENTIMENT_ANALYSIS_COMPLETED` |
| **6. Market Calendar** | `CAL_SESSION_OPENED`, `CAL_SESSION_CLOSED`, `CAL_MARKET_STATUS_CHANGED` | `CAL_EXCHANGE_CALENDAR_EXCEPTION_DECLARED`, `SYS_DATA_VENDOR_FEED_INTERRUPTED` |
| **7. Corporate Actions** | `CORP_CORPORATE_ACTION_ANNOUNCED`, `CORP_PRICE_HISTORY_ADJUSTED` | `MKT_SECURITY_MASTER_RECORD_CREATED` |
| **8. Portfolio Tracking** | `PORT_PORTFOLIO_NAV_RECALCULATED`, `PORT_BASE_CURRENCY_CHANGED` | `MKT_PRICE_TICK_RECEIVED`, `MKT_EOD_PRICES_PUBLISHED`, `CORP_PORTFOLIO_ADJUSTED_FOR_CORPORATE_ACTION` |
| **9. Risk Assessment** | `RISK_VAR_BREACHED`, `RISK_THRESHOLD_BREACHED`, `RISK_STRESS_TEST_EXECUTED` | `PORT_PORTFOLIO_NAV_RECALCULATED`, `USER_RISK_PROFILE_UPDATED`, `MAC_ECONOMIC_INDICATOR_PUBLISHED` |
| **10. AI Recommendation Engine**| `AI_RECOMMENDATION_GENERATED`, `AI_REASONING_CHAIN_GENERATED` | `RES_EQUITY_RESEARCH_PUBLISHED`, `RISK_THRESHOLD_BREACHED`, `USER_RISK_PROFILE_UPDATED` |
| **11. Alert & Notification** | `ALRT_NOTIFICATION_DISPATCHED`, `ALRT_NOTIFICATION_ESCALATED` | `RISK_THRESHOLD_BREACHED`, `AI_RECOMMENDATION_GENERATED`, `CAL_UNSCHEDULED_MARKET_CLOSURE_DECLARED` |
| **12. User Identity** | `USER_USER_REGISTERED`, `USER_RISK_PROFILE_UPDATED` | `USER_USER_MFA_ENABLED` |
| **13. Subscription & Entitlement**| `SUB_SUBSCRIPTION_UPGRADED`, `SUB_LICENSE_ASSIGNED` | `USER_USER_REGISTERED` |
| **14. Audit & Compliance** | `AUD_AUDIT_LOG_RECORDED`, `AUD_AUDIT_SNAPSHOT_CREATED` | *All Domain Events* |

---

# SECTION 6 — EVENT SCHEMA GOVERNANCE & EVOLUTION STRATEGY

### 6.1 Versioning Rules
- **MAJOR Version Increment** (e.g., `1.0` → `2.0`): Mandatory when a business event field is renamed, deleted, or its business semantics change fundamentally.
- **MINOR Version Increment** (e.g., `1.0` → `1.1`): Mandatory when adding optional metadata fields or clarifying business descriptions without breaking backwards compatibility.

### 6.2 Backwards Compatibility Contract
- Event consumers must handle unknown additive fields gracefully without breaking business execution.
- Retired fields must undergo a 90-day deprecation notice period before removal from event specifications.

---

# SECTION 7 — EVENT AUDITING & REGULATORY RETENTION POLICY

### 7.1 Statutory Retention Schedule

| Event Category | Statutory Regulator | Minimum Retention Period | Storage Contract |
| :--- | :--- | :--- | :--- |
| **Market Data & EOD Prices** | FRA / CMA / SEC | Indefinite (Immutable History) | Immutable Financial Archive |
| **Corporate Actions & Adjustments**| FRA / CMA | 10 Years | Tamper-Evident Ledger |
| **Portfolio Ledger & Transactions**| FRA / Central Bank | 7 Years Minimum | Regulatory Audit Vault |
| **AI Recommendations & Reasoning** | FRA / SEC | 7 Years Minimum | Explainability Audit Vault |
| **User Identity & Risk Profiles** | FRA / Privacy Laws | 7 Years Post Account Closure | Encrypted Vault |
| **System Operations & Failover** | Internal Governance | 3 Years | Operational Archive |

---

# SECTION 8 — CROSS-BORDER & MULTI-CURRENCY EVENT MECHANICS

### 8.1 Multi-Currency Event Rules
1. **Explicit Currency Context**: Every event carrying monetary values (prices, NAVs, dividends, transaction fees) MUST declare its ISO 4217 Currency Code (e.g., `EGP`, `SAR`, `USD`, `AED`).
2. **Timestamped FX Rate Binding**: Cross-currency portfolio NAV calculations MUST bind to the exact spot rate timestamped at the event's `Effective Time`.
3. **Dual-Listing Spread Rules**: Cross-border asset comparison events (e.g., EGX vs LSE dual-listings) MUST explicitly account for exchange local session overlaps and central bank FX rates.

---

# SECTION 9 — AI EVENT GOVERNANCE & ETHICAL INTELLIGENCE RULES

### 9.1 Source Confidence Governance Rules
1. **Strict Source Separation**: An event with `Source Confidence = AI_GENERATED` or `ESTIMATED` MUST NEVER be processed as an `OFFICIAL_EXCHANGE` event.
2. **Mandatory UI Disclaimers**: All UI views rendering `AI_GENERATED` recommendations or fair value estimates MUST display clear risk warnings and confidence intervals.
3. **Confidence Thresholding**: AI recommendations with a confidence score < 60% MUST automatically trigger `AI_RECOMMENDATION_WITHDRAWN` and suppress auto-generation.
4. **Explainability Requirement**: No `AI_RECOMMENDATION_GENERATED` event is valid without a correlated `AI_REASONING_CHAIN_GENERATED` event containing human-readable Arabic/English causal rationale.

---

# SECTION 10 — NON-FUNCTIONAL EVENT SLA MATRICES

*Governed by BDD Section 11.2 Operational Constraints. Expressed strictly in Business SLA Language without technical infrastructure metrics.*

### Business Data Freshness & Timeliness SLAs

| Business Capability Workflow | Target Business SLA Category | Business Freshness Requirement | Degradation Consequence |
| :--- | :--- | :--- | :--- |
| **Active Trader Workflows** | Near-Real-Time | Market data quote ticks must reflect live exchange execution state with imperceptible delay during active session hours. | Intraday momentum setup indicators degrade; breakout alerts delayed. |
| **Portfolio Value-at-Risk Monitoring**| Real-Time Session Window | Portfolio net asset values and risk threshold evaluations must update continuously upon receipt of verified market price ticks. | Unquantified market crash exposure; delayed drawdown alerts. |
| **Equity Research & DCF Modeling** | Multi-Minute Reporting Window | Financial statement parsing and intrinsic DCF fair value updates tolerate multi-minute batch processing following official disclosure. | Research summaries delayed slightly post earnings release; no trading impact. |
| **Macroeconomic & Central Bank Tracking** | Daily Batch Window | Central Bank interest rate announcements and economic indicator releases process within daily operational reporting windows. | Delayed macro regime attribution; no real-time trading disruption. |
| **End-of-Day Portfolio Valuation** | Daily EOD Lock | Official closing prices and daily portfolio return calculations lock post session close within standard EOD accounting windows. | Postponed daily statement delivery; manual reconciliation required. |
