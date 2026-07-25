# Tradeora Financial Operating System
## RELEASE DEPENDENCY GRAPH
## Version 1.0.0 | Status: AUTHORITATIVE | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  RELEASE DEPENDENCY GRAPH                                                    ║
║  Purpose   : Documents all inter-release and intra-release dependencies      ║
║              to guide sequencing, block management, and risk planning        ║
║  Baseline  : ARCHITECTURE FREEZE v1.2 FINAL                                 ║
║  Source    : BCM Dependency Map (Section 6), Vertical Slice Matrix,          ║
║              AI Intelligence Engine Architecture, Infrastructure Resolution  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## SECTION 1 — INTER-RELEASE DEPENDENCY MAP

### 1.1 Release Dependency Summary (Visual)

```
DEPENDENCY GRAPH: RELEASE SEQUENCING

R1.0 ALPHA (Foundation)
 │ [HARD BLOCKING]
 │ Provides: Identity, KYC, AML, Portfolio schema, Subscription, Audit,
 │           Kafka bus, Karapace schema registry, Keycloak, Kong, MinIO WORM,
 │           OpenBao, Valkey, Unleash, FluxCD, Security Master
 ▼
R2.0 BETA (Market Intelligence)
 │ [HARD BLOCKING]
 │ Provides: EGX real-time ticks, TimescaleDB OHLCV, Technical indicators,
 │           Arabic news, Fundamentals, Corporate actions, Sectors,
 │           Circuit breaker, Alert engine, Universal search
 ├──────────────────────────────┐
 ▼                              ▼
R3.0 BETA                    R4.0 GA (some features can parallel)
(AI Intelligence Engine)     (Analytics & Risk)
 │ [HARD BLOCKING for R4.0]
 │ Provides: 12-school consensus, LLM Gateway, WisdomEngine,
 │           AI Safety Engine, Explainability, Recommendation cache,
 │           Confidence calibration, Research synthesis, Market brief,
 │           SAGA-003 (WORM audit per recommendation)
 ├───────────────────────────────┘
 ▼
R4.0 GA (Analytics & Risk) — requires R2.0 + R3.0
 │ [HARD BLOCKING]
 │ Provides: VaR, Stress testing, Drawdown, Risk profiling,
 │           TWR, Benchmark comparison, Rebalancing (SAGA-005),
 │           Report generation, PDPL export (SLICE-12),
 │           Audit trail reporting (XCC-AUD-002), SAGA-004 full,
 │           SAGA-006 full, Economic calendar
 ▼
R5.0 ENTERPRISE (Enterprise Analytics) — requires R4.0
 │ [HARD BLOCKING]
 │ Provides: Ground truth collection, Learning engine,
 │           Self-reflection, Bias detection, Decision improvement,
 │           Backtesting engine (internal), Monte Carlo (internal),
 │           Family Office multi-tenancy, B2B API platform,
 │           GPU nodes (Phase 2 readiness), Second region (passive standby)
 ▼
R6.0 SCALE (GCC & Phase 2) — requires R5.0
 │ [HARD BLOCKING]
 │ Provides: GCC exchanges (Tadawul, DFM/ADX, KSE, QSE),
 │           5 additional AI schools (13–17, 17 total),
 │           Broker order routing (EXC-SOR-001),
 │           Tax-aware wealth management (WLT-REB-001),
 │           Advisory copilot (ADV-COP-001),
 │           Paper trading (FRA approval required),
 │           Plugin marketplace, Multi-region active-passive
 ▼
R7.0 GLOBAL (Global Platform) — requires R6.0
   Provides: Global markets (EU/US), Autonomous agents,
             Knowledge OS, Enterprise Memory Engine,
             Collective intelligence, Whitelabel B2B platform,
             Multi-region active-active, Proprietary LLM
```

### 1.2 Release Dependency Table

| Release | Hard Depends On | Soft Depends On | Can Run In Parallel With |
|---------|----------------|----------------|-------------------------|
| R1.0 ALPHA | None | None | — |
| R2.0 BETA | R1.0 (full) | — | Some R4.0 risk profiling UI prep |
| R3.0 BETA | R1.0 (full) + R2.0 (full) | — | Some R4.0 analytics preparation |
| R4.0 GA | R1.0 + R2.0 + R3.0 (full) | — | R5.0 multi-tenancy design |
| R5.0 ENTERPRISE | R4.0 (full) | — | R6.0 GCC licensing negotiations |
| R6.0 SCALE | R5.0 (full) | — | R7.0 design phase |
| R7.0 GLOBAL | R6.0 (full) | — | — |

---

## SECTION 2 — INTRA-RELEASE CAPABILITY DEPENDENCIES

### 2.1 R1.0 ALPHA — Internal Dependency Chain

```
CAPABILITY DEPENDENCY CHAIN — R1.0 ALPHA

[Infrastructure Layer — Must be first]
  Kafka + Karapace (Schema Registry)
  Keycloak (Identity Provider)
  Kong (API Gateway)
  MinIO + WORM Object Lock
  OpenBao (Secret Management)
  Valkey (Cache)
  Unleash (Feature Flags)
  FluxCD v2 (GitOps)
  PostgreSQL + Patroni HA
          │
          ▼
[Security Master — Required before any portfolio or market data]
  MKT-SEC-001 (Security Master Registry)
          │
          ▼
[Identity — Required before all user features]
  IDN-PRF-001 (User Registration)
    + XCC-AUTH-001 (Authentication)
    + XCC-AUTH-002 (Authorization)
          │
          ├──► IDN-PRF-002 (Locale/Language Preference)
          │      + LOC-LNG-001 (Bilingual Text) ──► LOC-LNG-002 (RTL)
          │      + LOC-LNG-003 (Date/Number Formatting)
          │
          ├──► XCC-NTF-001 (Multi-Channel Notification)
          │      + XCC-NTF-002 (Notification Preferences)
          │
          └──► KYC + AML (via SAGA-001)
                  │
                  ▼
              ENT-SUB-001 (Subscription Entitlement)
                + ENT-SUB-002 (API Quota)
                + Billing Service
                  │
                  ├──► SAGA-002 (Subscription Activation)
                  ├──► SAGA-006 (Subscription Downgrade)
                  └──► SAGA-004 (PDPL Account Deletion)
                         │
                         ▼
                  PRT-TRK-001 (Portfolio Accounting)
                    + PRT-TRK-002 (Transaction Recording)
                    + PRT-FX-001 (Multi-Currency Conversion)
                    + PRT-WTC-001 (Watchlist Management)
                         │
                         ▼
                  MKT-CAL-001 (Trading Calendar)
                    + EGX Session Status Display
                    [SLICE-11 delivered]
```

**R1.0 Critical Path:**
```
Infra → Keycloak → Security Master → User Registration → KYC/AML → Subscription → Portfolio → Session Status
```

### 2.2 R2.0 BETA — Internal Dependency Chain

```
CAPABILITY DEPENDENCY CHAIN — R2.0 BETA

R1.0 Foundation (MKT-SEC-001 is prerequisite)
          │
          ▼
MKT-DAT-001 (Real-Time EGX Tick Ingestion)
  ├──── MKT-CAL-001 (Calendar: must know when market is open) [from R1.0]
  └──── MKT-SEC-001 (Security Master: must know valid instruments) [from R1.0]
          │
          ▼
MKT-DAT-002 (Market Data Distribution — real-time vs delayed by tier)
  └──── ENT-SUB-001 (Subscription gate for real-time vs delayed) [from R1.0]
          │
          ├──► MKT-DAT-003 (Technical Indicator Computation — 20+ indicators)
          │      └──► PRT-WTC-002 (Dynamic Screening — requires indicators + fundamentals)
          │
          └──► MKT-CAL-002 (Circuit Breaker Tracking)
                 └──── MKT-DAT-001 (price ticks to detect 5%/10% triggers)

          ▼
MKT-SEC-002 (Corporate Action Tracking) [requires MKT-SEC-001]
  └──► Dividend/Split/Bonus adjustments to portfolio NAV

          ▼
ENG-ALT-001 (Price & Volatility Alert) [requires MKT-DAT-001]
  └──► ENG-ALT-002 (Risk Breach Alert) [requires RSK-ANL-001 — deferred to R4.0]

          ▼
RES-FND-001 (Financial Statement Standardization)
  └──── MKT-SEC-001 (ISIN → ticker mapping) [from R1.0]
          ├──► RES-FND-002 (Earnings Intelligence Parsing)
          └──► RES-FND-003 (DCF Modeling) ──► [feeds AI in R3.0]

          ▼
RES-MAC-001 (Economic Indicator Tracking) [standalone — no prior dependency]
  ├──► RES-SEC-001 (Sector Heatmap) [requires MKT-DAT-002 + MKT-SEC-001]
  └──► RES-MAC-002 (Financial News Ingestion)
         └──► RES-MAC-003 (News Sentiment Scoring) — [deferred to R3.0/R4.0]

          ▼
PRT-PRF-001 (Time-Weighted Return) [requires PRT-TRK-001 from R1.0 + live prices]
  └──► PRT-PRF-002 (Benchmark Comparison) [requires PRT-PRF-001 + MKT-DAT-002]

          ▼
XCC-SCH-001 (Universal Search) [requires news + instruments available]
  └──► XCC-SCH-002 (Deep Document Search) [requires Qdrant populated from R2.0 data]
```

**R2.0 Critical Path:**
```
MKT-DAT-001 → MKT-DAT-002 → MKT-DAT-003 → PRT-WTC-002 (screening)
                            └──► RES-FND-001 → RES-FND-003 (DCF)
```

### 2.3 R3.0 BETA — Internal Dependency Chain

```
CAPABILITY DEPENDENCY CHAIN — R3.0 BETA (AI Intelligence Engine)

[LLM Gateway must be deployed first]
LLM Gateway Service (TRD-AI-022)
  ├──── Ollama CPU nodes (pre-provisioned with Qwen2.5:14b-q4 + 7b-q4)
  ├──── DeepSeek API credentials (OpenBao) [fallback tier 2]
  └──── OpenAI API credentials (OpenBao) [fallback tier 3]
          │
          ▼
[Qdrant must be populated from R2.0 data before Phase 1 AI goes live]
Qdrant Vector DB
  ├──── egx_instruments (from R2.0 Security Master)
  ├──── egx_news (from R2.0 news ingestion)
  └──── egx_financials (from R2.0 fundamentals)
          │
          ▼
[12 AI Schools — parallel service deployment]
SCHOOL-01 (Market Intelligence) ─── requires MKT-DAT-001 from R2.0
SCHOOL-02 (Fundamental) ────────── requires RES-FND-001, RES-FND-002 from R2.0
SCHOOL-03 (Technical) ──────────── requires MKT-DAT-003 from R2.0
SCHOOL-04 (Sentiment) ──────────── requires RES-MAC-002 from R2.0
SCHOOL-05 (Macroeconomic) ──────── requires RES-MAC-001 from R2.0
SCHOOL-06 (Quantitative) ───────── requires MKT-DAT-002 + MKT-DAT-003 from R2.0
SCHOOL-07 (Risk-Adjusted) ──────── requires RSK-ANL-001 from R4.0 [soft dep; uses own calc]
SCHOOL-08 (Behavioral) ─────────── requires MKT-DAT-001 + MKT-DAT-002 from R2.0
SCHOOL-09 (Sector Rotation) ────── requires RES-SEC-001 from R2.0
SCHOOL-10 (Peer Comparison) ────── requires Qdrant vector embeddings
SCHOOL-11 (Earnings Quality) ───── requires RES-FND-001 from R2.0
SCHOOL-12 (Pattern Recognition) ── requires MKT-DAT-002 (OHLCV bars) from R2.0
          │
          ▼
[AI Consensus Orchestrator — requires all schools operational]
ConsensusOrchestrator (TRD-AI-018)
  ├──── Parallel dispatch to 12 schools (asyncio + timeout per school)
  ├──── Weighted voting (Decimal arithmetic — ROUND_HALF_UP)
  ├──── WisdomEngine (TRD-AI-019) — base weights at launch
  └──── Safety Engine (TRD-AI-020) — 7 checks:
         Check 1: Confidence ≥ 0.75
         Check 2: ≥ 9 of 12 schools participating (75% quorum)
         Check 3: Market data freshness < 15 minutes
         Check 4: No EGX circuit breaker active
         Check 5: Instrument not suspended
         Check 6: Arabic explanation ≥ 50 words generated
         Check 7: No FRA regulatory embargo
          │
          ▼
Explainability Engine (TRD-AI-021)
  ├──── Arabic explanation (native, 50–500 words, FRA disclaimer mandatory)
  └──── English explanation (secondary, 50–500 words)
          │
          ▼
SAGA-003 (AI Recommendation WORM Audit, 30-second timeout)
  ├──── MinIO WORM archive MUST complete before delivery
  └──── [If WORM write fails → recommendation BLOCKED, not delivered]
          │
          ▼
AI-REC-001 (Recommendation delivered to user with confidence score)
AI-REC-002 (Confidence calibration displayed)
AI-RES-001 (Research synthesis — requires RES-FND-001+003 + RES-MAC-003)
AI-RES-002 (Daily Market Brief — pre-market 08:30 Cairo, pre-session warm-up)
```

**R3.0 Critical Path:**
```
LLM Gateway → Qdrant (populated) → 12 schools → Consensus Orchestrator
→ Safety Engine → Explainability → SAGA-003 (WORM) → AI-REC-001 delivered
```

**R3.0 Model Warm-Up Dependency:**
```
JOB-WARMUP-001 @ 08:30 Cairo (30 min before EGX 09:00 pre-open)
  └──► Sets ai:schools:warmup:passed = true in Valkey
  └──► If NOT set by 09:25 → AI recommendations HELD until set
```

### 2.4 R4.0 GA — Internal Dependency Chain

```
CAPABILITY DEPENDENCY CHAIN — R4.0 GA

RSK-PRF-001 (Risk Tolerance Profiling) [requires IDN-PRF-001 from R1.0]
          │
          ├──► AI-REC-001 (Recommendation — now includes risk profile gate)
          └──► ADV-COP-001 (Advisory Copilot — Phase 2 prereq)

RSK-ANL-001 (VaR Modeling)
  ├──── PRT-TRK-001 (Portfolio positions) [from R1.0]
  └──── MKT-DAT-002 (Historical volatility) [from R2.0]
          │
          ├──► ENG-ALT-002 (Risk Breach Alert — now fully operational)
          ├──► RSK-ANL-003 (Drawdown Stress-Testing)
          └──► WLT-REB-001 (Tax-Aware Rebalancing — Phase 2 prereq)

RSK-ANL-002 (Sector Concentration)
  ├──── PRT-TRK-001 [from R1.0]
  └──── RES-SEC-001 [from R2.0]
          │
          └──► ENG-ALT-002 (Risk alerts on concentration breach)

SAGA-005 (Portfolio Rebalancing)
  ├──── AI-REC-001 [from R3.0] — AI generates suggestion
  ├──── RSK-ANL-001 [R4.0] — risk-validates suggestion
  └──── PRT-TRK-001 [from R1.0] — executes advisory record
         [No execution — advisory only. User confirms. WORM archived.]

RPT-GEN-001 (Portfolio Statement)
  ├──── PRT-TRK-001 [from R1.0]
  ├──── PRT-PRF-001 [from R2.0]
  └──── LOC-LNG-001 [from R1.0]

RPT-GEN-002 (Research Export)
  ├──── AI-RES-001 [from R3.0]
  └──── RES-FND-003 [from R2.0]

SLICE-12 (PDPL Data Export)
  ├──── IDN-PRF-001 [from R1.0]
  ├──── OPS-GOV-001 [from R1.0]
  └──── SAGA-004 (Account Deletion — now complete with full data export)
```

**R4.0 Critical Path:**
```
RSK-PRF-001 (risk profiling) → RSK-ANL-001 (VaR) → SAGA-005 (rebalancing)
PRT-PRF-001 (TWR) → RPT-GEN-001 (reports)
```

### 2.5 R5.0 ENTERPRISE — Internal Dependency Chain

```
CAPABILITY DEPENDENCY CHAIN — R5.0 ENTERPRISE

Ground Truth Collector Service
  ├──── MinIO WORM (every recommendation archived in R3.0)
  ├──── Kafka (UserBehavior events)
  ├──── Portfolio BC (portfolio impact measurement)
  └──── EGX Market Data (price 5 days post-recommendation)
          │
          ▼
Ground Truth Record (GroundTruthRecord schema)
  ├──── recommendationId → recommendation (from SAGA-003 WORM archive)
  ├──── priceAtRecommendation → priceAtOutcome (5 EGX trading days later)
  ├──── directionallyCorrect (boolean)
  ├──── userActed (boolean)
  └──── confidenceCalibrationError (|confidence - accuracy|)
          │
          ▼
Learning Engine (TRD-AI-023)
  └──── School weight update formula:
         new_weight = current_weight + 0.1 * (rolling_accuracy_90d - current_weight)
         Bounded: [0.04, 0.12]
         Calibration penalty applied
         Auto-exclusion if accuracy < 55% for 3 consecutive months
          │
          ├──► Bias Detection Engine (TRD-AI-025)
          ├──► Self-Reflection Engine (TRD-AI-024) — monthly accuracy audit
          └──► Decision Improvement Engine (TRD-AI-026) — weight enforcement
                         │
                         ▼
                  Backtesting Engine (Internal Only)
                    ├──── TimescaleDB historical data (from R2.0+)
                    ├──── Rule 40: available_from_ts filter enforced
                    ├──── Separate read-only DB user + schema
                    └──── CI static analysis (pylint rule: no queries missing filter)

                  Monte Carlo Service (Internal Only)
                    ├──── RSK-ANL-001 (VaR model) [from R4.0]
                    ├──── Historical price distributions (from TimescaleDB)
                    └──── EGX shock scenarios (20% EGP devaluation, 500bps rate hike)
```

### 2.6 R6.0 SCALE — Internal Dependency Chain

```
CAPABILITY DEPENDENCY CHAIN — R6.0 SCALE

[BLOCKER: CMA Saudi + SCA UAE + regulatory licenses must be obtained BEFORE data goes live]

GCC Exchange Data Feeds
  ├──── Tadawul (Saudi) ──── CMA Saudi license required
  ├──── DFM (Dubai) ─────── SCA UAE license required
  ├──── ADX (Abu Dhabi) ─── SCA UAE license required
  ├──── KSE (Kuwait) ─────── CMA Kuwait required
  └──── QSE (Qatar) ─────── QFMA required
          │
          ▼
Security Master updated: 200+ Tadawul + 60+ DFM + 70+ ADX + 100+ KSE + 50+ QSE
          │
          ▼
[5 Additional AI Schools deployed]
SCHOOL-13 (Options Flow) ─── Requires options data feeds (Phase 2 vendor)
SCHOOL-14 (Insider Activity) ─ Regulatory filing data feeds
SCHOOL-15 (ESG/Sharia) ────── ESG data vendor + Sharia screening API
SCHOOL-16 (Global Macro) ──── Global index feeds + US Fed data
SCHOOL-17 (Alternative Data) ─ Satellite/web data vendor contracts
          │
          ▼
17-School Consensus Recalibration
  ├──── New quorum: 13 of 17 schools (76.5%)
  ├──── New ADR required (per AI_INTELLIGENCE_ENGINE_ARCHITECTURE.md mandate)
  └──── WisdomEngine base weights recalibrated for all 17 schools

EXC-SOR-001 (Broker Order Routing)
  ├──── Licensed EGX broker API contracts (3+ brokers at launch)
  ├──── User authorization per order (MANDATORY — non-custodial)
  └──── OrderManagement BC (tracks PENDING → SUBMITTED → FILLED/REJECTED)

WLT-REB-001 (Tax-Aware Rebalancing)
  ├──── PRT-TRK-001 (positions) [from R1.0]
  ├──── RSK-ANL-001 (VaR risk validation) [from R4.0]
  └──── Egyptian capital gains tax rules + EGX fee schedule (EGP)

Paper Trading System
  ├──── Written FRA approval letter MUST be on file before feature is live
  ├──── Paper Portfolio Service (virtual NAV, EGP Decimal arithmetic)
  ├──── Execution Simulator (EGX slippage, circuit breaker, T+0)
  └──── All results: internal_use_only=true (MinIO metadata)

Multi-Region Active-Passive
  ├──── Cairo (primary, EGX + Egyptian users)
  ├──── Riyadh (standby, Tadawul + Saudi users)
  ├──── Kafka MirrorMaker 2 (cross-region replication)
  └──── Data residency partitioning:
         Egyptian user data → Cairo only
         Saudi user data → Riyadh only
```

---

## SECTION 3 — BCM CAPABILITY DEPENDENCY CHAINS

> Source: `BUSINESS_CAPABILITY_MODEL.md` Section 6 — 20 Critical Dependencies

### 3.1 Top 10 Mission-Critical Chains

```
CHAIN-01: THE MASTER AI RECOMMENDATION CHAIN
MKT-SEC-001 → RES-FND-001 → RES-FND-003 → AI-REC-001 → ENG-ALT-002
  R1.0          R2.0           R2.0          R3.0          R2.0/R4.0

CHAIN-02: THE RISK ALERT CHAIN
MKT-DAT-001 → MKT-DAT-002 → PRT-TRK-001 → RSK-ANL-001 → ENG-ALT-002
  R2.0          R2.0           R1.0          R4.0           R4.0

CHAIN-03: THE PORTFOLIO PERFORMANCE CHAIN
MKT-SEC-001 → PRT-TRK-001 → PRT-PRF-001 → PRT-PRF-002
  R1.0          R1.0           R2.0-R4.0     R2.0-R4.0

CHAIN-04: THE RESEARCH SYNTHESIS CHAIN
RES-FND-001 → RES-FND-003 → AI-RES-001 → RPT-GEN-002
  R2.0          R2.0           R3.0          R4.0

CHAIN-05: THE REPORT GENERATION CHAIN
PRT-TRK-001 → PRT-PRF-001 → RPT-GEN-001
  R1.0          R2.0-R4.0     R4.0

CHAIN-06: THE USER SUITABILITY CHAIN
IDN-PRF-001 → RSK-PRF-001 → AI-REC-001
  R1.0          R1.0-R4.0     R3.0

CHAIN-07: THE MARKET DATA PIPELINE CHAIN
MKT-DAT-001 → MKT-DAT-002 → MKT-DAT-003 → AI-REC-003
  R2.0          R2.0           R2.0           R3.0

CHAIN-08: THE DRAWDOWN STRESS CHAIN
PRT-TRK-001 → RSK-ANL-001 → RSK-ANL-003
  R1.0          R4.0           R4.0

CHAIN-09: THE CIRCUIT BREAKER CHAIN
MKT-CAL-001 → MKT-DAT-001 → MKT-CAL-002 → [AI Safety Check 4]
  R1.0          R2.0           R2.0           R3.0

CHAIN-10: THE WEALTH MANAGEMENT CHAIN (Phase 2)
PRT-TRK-001 → RSK-ANL-001 → WLT-REB-001
  R1.0          R4.0           R6.0
```

---

## SECTION 4 — BLOCKER DEPENDENCY MATRIX

### 4.1 Hard Blockers by Release

| Release | Hard Blocker | Resolution |
|---------|-------------|-----------|
| R1.0 | EGX market data vendor contract signed | Business decision, pre-construction |
| R1.0 | KYC provider (Sumsub/Shufti) contract signed | Business decision, pre-construction |
| R1.0 | Payment gateway contract signed | Business decision, pre-construction |
| R1.0 | FRA advisory-only platform license | Regulatory, 30–90 days lead time |
| R1.0 | PDPL registration | Regulatory, 15–30 days lead time |
| R2.0 | R1.0 Alpha exit criteria ALL passed | Engineering, exit criteria checklist |
| R2.0 | EGX data feed technically validated (5 trading days) | Engineering validation |
| R3.0 | R2.0 exit criteria ALL passed | Engineering |
| R3.0 | Ollama CPU nodes provisioned and pre-warmed | Infrastructure |
| R3.0 | LLM Gateway tested (all 3 fallback tiers) | Engineering |
| R3.0 | Arabic explanation reviewed by native financial speaker | Quality gate |
| R4.0 | R3.0 exit criteria ALL passed | Engineering |
| R4.0 | VaR validated by independent financial analyst | Quality gate |
| R4.0 | FRA regulatory examination passed | Regulatory gate |
| R5.0 | R4.0 exit criteria ALL passed | Engineering |
| R5.0 | 90-day ground truth collection window (first recommendations) | Time dependency |
| R6.0 | R5.0 exit criteria ALL passed | Engineering |
| R6.0 | CMA Saudi license obtained | Regulatory (6–12 months lead time) |
| R6.0 | SCA UAE license obtained | Regulatory (3–6 months lead time) |
| R6.0 | FRA written approval for paper trading | Regulatory |
| R6.0 | Broker API contracts signed (3+ EGX brokers) | Business |
| R6.0 | New 17-school ADR approved | Architecture governance |
| R7.0 | R6.0 exit criteria ALL passed | Engineering |
| R7.0 | FCA (UK) license obtained | Regulatory (12–18 months lead time) |
| R7.0 | SEC registration (US) | Regulatory (12–24 months lead time) |

---

## SECTION 5 — INFRASTRUCTURE DEPENDENCY CHAIN

### 5.1 Infrastructure Provision Order (R1.0)

```
INFRASTRUCTURE PROVISION ORDER — MUST BE SEQUENTIAL

Step 1: Kubernetes cluster provisioned (Cairo region)
Step 2: Network security (VPC, security groups, PDPL data boundary)
Step 3: PostgreSQL + Patroni HA (primary + replica)
Step 4: Apache Kafka 3.7+ (KRaft mode — no ZooKeeper)
Step 5: Karapace Schema Registry (ALL event schemas registered BEFORE first publish)
Step 6: Valkey 8.0 (sessions, feature flags, cache)
Step 7: MinIO + WORM Object Lock COMPLIANCE mode
Step 8: OpenBao (secrets management — API keys, encryption keys)
Step 9: Keycloak 24+ (identity provider)
Step 10: Kong API Gateway (rate limiting, auth routing)
Step 11: Unleash 5.x (feature flags — ALL default OFF)
Step 12: FluxCD v2 (GitOps — all deployments through Git)
Step 13: Prometheus + Grafana + Loki + Tempo (observability)
Step 14: Application services deployed via FluxCD
```

**Critical Constraint:** Karapace schema registry MUST be operational and schemas
registered before ANY Kafka producer publishes a first message. This is an
authoritative architecture constraint per `EVENT_SCHEMA_REGISTRY_ARCHITECTURE.md`.

### 5.2 Infrastructure Additions by Release

| Release | Infrastructure Added | Reason |
|---------|--------------------|----|
| R2.0 | TimescaleDB extension enabled on PostgreSQL | Time-series market data |
| R2.0 | Valkey DB 1 namespace (market data cache, 1-min TTL) | Tick caching |
| R2.0 | Qdrant vector DB (collections populated) | Search + AI prep |
| R3.0 | Ollama CPU compute nodes (8 concurrent max) | AI inference (Phase 1) |
| R3.0 | LiteLLM proxy (LLM Gateway) | Provider routing |
| R3.0 | Valkey AI cache namespace (60s–60min TTL by tier) | Recommendation caching |
| R4.0 | Additional PostgreSQL schemas (risk, reporting) | Analytics expansion |
| R4.0 | Report storage in MinIO (PDFs, Excel) | Report persistence |
| R5.0 | NVIDIA A100 GPU nodes | Phase 2 AI readiness (DEBT-003) |
| R5.0 | vLLM runtime | GPU inference (Phase 2) |
| R5.0 | TimescaleDB: benchmark_results + evolution_kpi_history | Backtesting + KPI |
| R5.0 | Riyadh region (passive standby) | Multi-region prep |
| R6.0 | Kafka MirrorMaker 2 | Cairo ↔ Riyadh replication |
| R6.0 | Active-passive failover automation | Phase 2 HA |
| R6.0 | Additional Qdrant collections (GCC instruments) | GCC market data |
| R7.0 | Dubai region (third active region) | Active-active-active |
| R7.0 | Global CDN | Static assets worldwide |
| R7.0 | Tradeora proprietary LLM training cluster | Custom model |

---

## SECTION 6 — DATA SCHEMA DEPENDENCY CHAIN

### 6.1 Schema Initialization Order (Critical for DB Migrations)

```
SCHEMA DEPENDENCY ORDER — MIGRATION SEQUENCE

R1.0 Schemas (must exist before application starts):
  1. identity schema (UserProfile, Credential, Session)
  2. compliance schema (KYCRecord, AMLResult, ConsentRecord)
  3. audit schema (AuditEvent — append-only, WORM backed)
  4. instruments schema (SecurityMaster, InstrumentDefinition)
  5. portfolio schema (Portfolio, Position, Transaction, CashBalance)
  6. subscriptions schema (Subscription, EntitlementMatrix, BillingRecord)
  7. market_calendar schema (TradingCalendar, SessionStatus, HolidaySchedule)
  8. notifications schema (NotificationPreference, NotificationLog)

R2.0 Schemas (added after R1.0 in production):
  9. market_data schema (TimescaleDB hypertables: price_ticks, ohlcv_bars, order_book)
  10. market_data schema (technical_indicators — pre-computed)
  11. fundamentals schema (financial_statements with available_from_ts — Rule 40)
  12. fundamentals schema (earnings_events)
  13. news schema (news_items — with ticker linkage, language tagging)
  14. macro schema (economic_indicators)
  15. alerts schema (alert_configurations, alert_triggers)
  16. corporate_actions schema (events, adjustments)
  17. sectors schema (heatmap_snapshots, capital_flow)

R3.0 Schemas (added after R2.0):
  18. ai_recommendations schema (RecommendationRecord — with WORM reference)
  19. ai_schools schema (SchoolRecommendation, ConsensusResult)
  20. ai_safety schema (SafetyCheckLog)
  21. ai_wisdom schema (SchoolWeights, WeightHistory)

R4.0 Schemas (added after R3.0):
  22. risk schema (VaRResult, StressTestResult, DrawdownScenario)
  23. risk_profiling schema (RiskProfile, SuitabilityRecord)
  24. reports schema (ReportRecord — references MinIO PDF path)
  25. rebalancing schema (RebalancingProposal — SAGA-005)
  26. economic_calendar schema (events, countdowns)

R5.0 Schemas:
  27. ground_truth schema (GroundTruthRecord with 8 signal types)
  28. backtesting schema (BacktestRun, BacktestResult — internal_use_only=true)
  29. monte_carlo schema (SimulationRun — internal_use_only=true)
  30. multi_tenancy schema (TenantProfile, TenantUserMap)

R6.0 Schemas:
  31. gcc_markets schema (Tadawul, DFM, ADX, KSE, QSE instruments)
  32. order_management schema (Order, OrderLifecycle — Phase 2 broker routing)
  33. wealth_management schema (RebalancingPlan with tax optimization)
  34. paper_trading schema (PaperPortfolio, PaperTrade — internal_use_only=true)
  35. plugin_marketplace schema (PluginDefinition, PluginSubscription)
```

**Rule 40 Constraint (CRITICAL):**
All tables containing time-series financial data MUST include:
```sql
available_from_ts TIMESTAMPTZ NOT NULL  -- when data became publicly available
```
NOT `event_date` alone. The backtesting engine ALWAYS queries by `available_from_ts <= as_of_timestamp`.

---

## SECTION 7 — KAFKA EVENT DEPENDENCY CHAIN

### 7.1 Event Publishing Order Rules

```
MANDATORY KAFKA EVENT SEQUENCING RULES

Rule 1: Karapace schema registration BEFORE first publish
  Every event schema MUST be registered in Karapace before any producer
  can publish the first message. Schema evolution follows BACKWARD_COMPATIBLE.

Rule 2: Domain event ordering per topic partition
  All events within a given partition are ordered by producer timestamp.
  Portfolio events for the same user MUST be in the same partition (keyed by userId).
  AI recommendation events MUST be keyed by tickerId + sessionDate.

Rule 3: AI recommendation events are WORM archived (SAGA-003)
  The AIConsensus.RecommendationReady.v1 event is ONLY published AFTER
  MinIO WORM write confirmation (AIConsensus.RecommendationWORMArchived.v1).
  NEVER publish recommendation to user before WORM archive confirmed.

Key Topic → Consumer Dependency Chains:

market.PriceTickReceived.v1
  └──► alert-engine (ENG-ALT-001) — real-time threshold check
  └──► technical-analysis-service (MKT-DAT-003) — indicator computation
  └──► ai-market-intelligence (SCHOOL-01) — R3.0 only during EGX session

market.SessionStatusChanged.v1
  └──► ai-consensus-orchestrator — START/STOP recommendation processing
  └──► alert-engine — EGX halt suppression
  └──► all-services — EGX session gate (no deployment during session)

ai.RecommendationReady.v1
  └──► SAGA-003 starts: WORM archive write
         └──► OnSuccess: RecommendationWORMArchived.v1 published
                └──► notification-service: push/email to user
         └──► OnFailure: Recommendation BLOCKED, reason logged

identity.UserDeleted.v1 (SAGA-004 initiated)
  └──► portfolio-service: archive all user portfolios
  └──► ai-service: anonymize all recommendations
  └──► audit-service: retain WORM logs (7-year FRA requirement, exempt from deletion)
  └──► openbao: schedule PII encryption key deletion (point of no return)
```

---

## DEPENDENCY HEALTH CHECKLIST

Before each release gate, the following dependencies must be verified:

### R1.0 Dependency Checklist
- [ ] Karapace operational + all R1.0 schemas registered
- [ ] Keycloak realm configured + RBAC roles defined
- [ ] Kong routes + rate limiting configured per subscription tier
- [ ] MinIO WORM COMPLIANCE mode verified (cannot be changed after set)
- [ ] OpenBao initialized + unsealed + all secrets loaded
- [ ] Unleash configured + all features default OFF
- [ ] FluxCD connected to production Git repository
- [ ] Three-pillar observability (Prometheus + Loki + Tempo) deployed

### R3.0 Dependency Checklist
- [ ] Ollama CPU nodes provisioned + models pre-loaded (Qwen2.5:14b-q4 + 7b-q4)
- [ ] LLM Gateway operational + 3 fallback tiers tested
- [ ] JOB-WARMUP-001 scheduled + tested at 08:30 Cairo
- [ ] Qdrant collections populated from R2.0 data (all 3 collections)
- [ ] All 12 school services deployed + health checks passing
- [ ] ai:schools:warmup:passed flag logic verified in Valkey
- [ ] SAGA-003 tested: verify recommendation BLOCKED if WORM write fails
- [ ] Arabic explanation quality reviewed by native financial Arabic reviewer
- [ ] FRA disclaimer present in 100% of AI output (automated test)

### R6.0 Dependency Checklist
- [ ] CMA Saudi license obtained (6–12 months lead time required)
- [ ] SCA UAE license obtained
- [ ] FRA written paper trading approval on file
- [ ] 3+ EGX broker API contracts signed
- [ ] New 17-school ADR approved by Architecture Governance Board
- [ ] Multi-region failover tested: Cairo → Riyadh RTO ≤ 5 minutes

---

*Tradeora Financial Operating System — Release Dependency Graph — Architecture Freeze v1.2 FINAL*
*Source: BCM Dependency Map, AI Intelligence Engine Architecture, Infrastructure Resolution*
