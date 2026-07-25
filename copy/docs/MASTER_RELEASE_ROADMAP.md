# Tradeora Financial Operating System
## MASTER RELEASE ROADMAP
## Version 1.2.0 | Status: FROZEN — PERMANENT ENTERPRISE BASELINE | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  MASTER RELEASE ROADMAP — PERMANENT ENTERPRISE BASELINE                    ║
║  Certificate ID : TRD-CERT-ROADMAP-FREEZE-v1.2-2026-0724                    ║
║  Status         : ✅ FROZEN — PERMANENT ENTERPRISE BASELINE                   ║
║  Authority      : Chief Product Officer + Enterprise Solution Architect      ║
║                   + AI Strategy Director + Program Manager                   ║
║  Extracted from : ALL 106 approved Tradeora architecture documents           ║
║  Baseline Ref   : ARCHITECTURE FREEZE v1.2 FINAL (TRD-CERT-FREEZE-v1.2-FINAL)║
║  Constitution   : PROJECT_CONSTITUTION.md (all articles)                     ║
║  ADR Reference  : ADR-001 through ADR-049                                    ║
║  Constraint     : DO NOT invent features. DO NOT remove features. LOCKED.    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

> **EXTRACTION MANDATE**: Every approved capability in this roadmap was extracted
> from one or more of the 96 frozen architecture documents. No feature has been
> invented. No approved feature has been omitted. Traceability to BCM Capability
> IDs, Vertical Slice IDs, and Bounded Context names is maintained throughout.

---

## SECTION 0 — ROADMAP OVERVIEW

### 0.1 Release Summary

> ⚠️ **MARKET ORDER AMENDMENT (2026-07-24)**: The approved market expansion sequence is:
> **Phase 1: EGX + Forex → Phase 2: Crypto → Phase 3: US Stocks → Phase 4: GCC + Global**
> All releases have been updated to comply with this approved order.

| Release | Name | Phase Gate | Duration | MAU Target | Markets |
|---------|------|-----------|----------|-----------|---------|
| **R1.0 ALPHA** | Foundation | Alpha | Months 1–3 | 0→500 | EGX |
| **R2.0 BETA** | Market Intelligence | Beta Gate 1 | Months 4–6 | 500→5,000 | **EGX + Forex** |
| **R3.0 BETA** | AI Intelligence Engine | Beta Gate 2 | Months 7–9 | 5,000→15,000 | **EGX + Forex** |
| **R4.0 GA** | Analytics & Risk | General Availability | Months 10–12 | 15,000→50,000 | **EGX + Forex** |
| **R5.0 ENTERPRISE** | Enterprise Analytics + Crypto | Post-GA | Months 13–18 | 50,000→200,000 | **EGX + Forex + Crypto** |
| **R6.0 SCALE** | US Markets & Scale | Phase 2 Launch | Months 19–30 | 200,000→1,000,000 | **EGX + Forex + Crypto + US Stocks** |
| **R7.0 GLOBAL** | GCC + Global Platform | Phase 3 | Months 31–48 | 1,000,000→5,000,000 | **All above + GCC + Global** |

### 0.1-A Market Expansion Sequence (Approved Order)

```
MARKET EXPANSION ORDER — APPROVED 2026-07-24

Step 1 — Phase 1 (R1.0–R4.0): EGX + Forex
  ├── Egyptian Exchange (EGX): Main Market + Nilex
  └── Forex: Major pairs (EUR/USD, GBP/USD, USD/JPY, AUD/USD)
              EGP pairs (USD/EGP, EUR/EGP, GBP/EGP, SAR/EGP)
              Cross pairs (EUR/GBP, EUR/JPY, GBP/JPY)

Step 2 — Phase 2 Early (R5.0): Crypto
  ├── Bitcoin (BTC/USD, BTC/EGP)
  ├── Ethereum (ETH/USD, ETH/EGP)
  └── Top 50 cryptocurrencies by market cap

Step 3 — Phase 2 Scale (R6.0): US Stocks
  ├── NYSE listed equities
  ├── NASDAQ listed equities
  └── Major indices: S&P 500, NASDAQ Composite, DJIA, Russell 2000

Step 4 — Phase 3 (R7.0): GCC + Global
  ├── Saudi Arabia: Tadawul
  ├── UAE: DFM + ADX
  ├── Kuwait: KSE
  ├── Qatar: QSE
  └── Additional global exchanges (EU, APAC)
```

### 0.2 Analysis Methodology Coverage by Release

| Release | Markets | Analysis Schools Active |
|---------|---------|------------------------|
| R1.0 | EGX | None (infrastructure only) |
| R2.0 | EGX + Forex | Technical indicators (computed, not AI) + Forex technical indicators |
| R3.0 | EGX + Forex | 12 schools: all EGX + Forex schools (SCHOOL-03 extended for FX pairs) |
| R4.0 | EGX + Forex | 12 schools + VaR + Stress Testing + DCF Modeling |
| R5.0 | EGX + Forex + Crypto | 12 schools + Crypto schools + Learning/Calibration + Backtesting (internal) |
| R6.0 | EGX + Forex + Crypto + US Stocks | 17 schools: adds OptionsFlow, InsiderActivity, ESGAnalysis, GlobalMacro, AlternativeData |
| R7.0 | All + GCC + Global | 17+ schools + Autonomous Agents + Collective Intelligence |

### 0.3 Compliance by Release

| Release | FRA | PDPL | AML | Crypto Regulation | SEC | MIFID II |
|---------|-----|------|-----|------------------|-----|----------|
| R1.0–R4.0 | ✅ Full | ✅ Full | ✅ Full | N/A | N/A | N/A |
| R5.0 | ✅ Full | ✅ Full | ✅ Full | CBE crypto advisory guidelines | N/A | N/A |
| R6.0 | ✅ Full | ✅ Full | ✅ Full | Full | ✅ SEC (advisory only) | N/A |
| R7.0 | ✅ Full | ✅ Full | ✅ Full | Full | ✅ Full | ✅ Full |

---

## SECTION 1 — RELEASE 1.0 ALPHA: FOUNDATION

### 1.1 Release Vision

> **"Build the platform's beating heart before the brain."**

Release 1.0 establishes the complete foundational infrastructure upon which every
subsequent release depends. No AI, no analytics — just a secure, compliant,
observable, production-ready platform that can register Egyptian investors, create
portfolios, activate subscriptions, and survive a regulatory audit on day one.

This release delivers the first commercially operational version of Tradeora for
a controlled Alpha cohort of early adopters and design partners.

### 1.2 Business Goals

1. Achieve commercial operation with a closed Alpha cohort (target: 100–500 users)
2. Establish FRA-compliant KYC/AML infrastructure from day one
3. Prove the multi-tenant architecture scales to enterprise requirements
4. Generate first subscription revenue (early adopter pricing)
5. Collect first user feedback from Egyptian investors on UX/Arabic quality
6. Pass first internal security audit (OWASP Top 10 compliance)
7. Establish PDPL consent infrastructure 100% compliant before any PII is stored

### 1.3 Target Users

| User Tier | Access |
|-----------|--------|
| Closed Alpha Users | Invitation-only; Free tier + early adopter Premium |
| Platform Administrators | Internal Tradeora ops team |
| Compliance Officers | Internal Tradeora compliance team |

### 1.4 Supported Markets

- **Egyptian Exchange (EGX)**: Main Market, Nilex SME Market
- **Session**: Sunday–Thursday, 09:30–15:30 Cairo time (EGT = UTC+2)
- **Instruments**: 300 monitored EGX instruments (Phase 1 universe)
- **Currency**: Egyptian Pound (EGP) primary; USD/EGP, EUR/EGP, SAR/EGP supported

### 1.5 Supported Analysis Schools

None operational in R1.0. Foundation only.

### 1.6 Included Features (Extracted from Architecture)

#### Identity & User Management (IDN Domain)

| Capability ID | Feature | Vertical Slice | Bounded Context |
|--------------|---------|---------------|----------------|
| IDN-PRF-001 | User profile registration & onboarding (Arabic/English) | SLICE-01 | UserIdentity |
| IDN-PRF-002 | Locale & language preference management (Arabic-first, RTL) | SLICE-01 | UserIdentity |
| XCC-AUTH-001 | User identity authentication (Keycloak OIDC/JWT) | SLICE-01 | Authentication |
| XCC-AUTH-002 | Role-based authorization enforcement (RBAC) | SLICE-01 | Authentication |

#### Compliance & KYC (Compliance Domain)

| Capability ID | Feature | Vertical Slice | Bounded Context |
|--------------|---------|---------------|----------------|
| — | Egyptian National ID document upload (front + back) | SLICE-01 | KYCVerification |
| — | Liveness check (selfie anti-spoofing) | SLICE-01 | KYCVerification |
| — | KYC status display (real-time progress) | SLICE-01 | KYCVerification |
| — | AML sanctions screening (OFAC, UN, EU, CBE watchlists) | SLICE-01 | AMLScreening |
| — | PDPL consent recording with timestamp | SLICE-01 | Compliance |
| OPS-GOV-001 | Immutable WORM audit logging (FRA 7-year retention) | SLICE-01 | AuditTrail |
| XCC-AUD-001 | System-wide audit event logging | SLICE-01 | AuditTrail |

#### Portfolio Foundation (PRT Domain)

| Capability ID | Feature | Vertical Slice | Bounded Context |
|--------------|---------|---------------|----------------|
| PRT-TRK-001 | Multi-asset position accounting (EGX equities, bonds, EGP cash) | SLICE-02 | Portfolio |
| PRT-TRK-002 | Historical transaction recording (buy/sell/dividend/fee) | SLICE-02 | Portfolio |
| PRT-FX-001 | Multi-currency valuation conversion (EGP primary) | SLICE-02 | Portfolio |
| PRT-WTC-001 | Custom watchlist management (EGX instruments) | SLICE-02 | Watchlist |

#### Market Calendar Foundation (MKT Domain)

| Capability ID | Feature | Vertical Slice | Bounded Context |
|--------------|---------|---------------|----------------|
| MKT-SEC-001 | Security master registry management (ISIN/EGX ticker mapping) | SLICE-11 | SecurityMaster |
| MKT-CAL-001 | Exchange trading calendar management (EGX Sun–Thu, Islamic holidays) | SLICE-11 | MarketCalendar |
| — | EGX session status display (pre-open, open, closed, halted) | SLICE-11 | MarketSession |

#### Subscription & Entitlement (ENT Domain)

| Capability ID | Feature | Vertical Slice | Bounded Context |
|--------------|---------|---------------|----------------|
| ENT-SUB-001 | Subscription tier entitlement enforcement (Free, Basic, Premium, Family Office) | SLICE-08 | Subscription |
| ENT-SUB-002 | API volume quota enforcement (rate limiting per tier) | SLICE-08 | Subscription |
| — | Payment processing (subscription billing) | SLICE-08 | Billing |
| — | Subscription activation flow (SAGA-002) | SLICE-08 | Subscription |

#### Localization (LOC Domain)

| Capability ID | Feature | Vertical Slice | Bounded Context |
|--------------|---------|---------------|----------------|
| LOC-LNG-001 | Bilingual dynamic text localization (Arabic ↔ English, live switching) | All slices | Localization |
| LOC-LNG-002 | Right-to-left (RTL) layout management | All slices | Localization |
| LOC-LNG-003 | Cultural date & number formatting (Gregorian/Hijri, EGP) | All slices | Localization |
| XCC-LOC-001 | Dynamic text language translation | All slices | Localization |
| XCC-LOC-002 | Locale number & date formatting | All slices | Localization |
| XCC-LOC-003 | Right-to-left view formatting | All slices | Localization |

#### Platform Operations (OPS Domain)

| Capability ID | Feature | Vertical Slice | Bounded Context |
|--------------|---------|---------------|----------------|
| OPS-GOV-002 | System data stream health monitoring | Infrastructure | Observability |
| XCC-OPS-001 | Dynamic feature toggle governance (Unleash) | Infrastructure | FeatureFlags |
| XCC-OPS-002 | Centralized system parameter governance | Infrastructure | Configuration |

#### Multi-Channel Notifications

| Capability ID | Feature | Bounded Context |
|--------------|---------|----------------|
| XCC-NTF-001 | Multi-channel message dispatch (push, email, SMS, in-app) | Notification |
| XCC-NTF-002 | Notification channel preference governance | Notification |

#### Active Sagas in R1.0

| Saga | Description | Timeout |
|------|-------------|---------|
| SAGA-001 | User Onboarding (KYC → Subscription → Portfolio → Notification) | 72 hours |
| SAGA-002 | Subscription Activation (Payment → Entitlement → Feature Flags) | 15 minutes |
| SAGA-004 | User Account Deletion / PDPL Right-to-Erasure (PII key deletion + pseudonymization) | 30 days |

### 1.7 Excluded Features

- All AI recommendations (Release 3.0)
- Market data display (Release 2.0)
- Portfolio NAV calculation with live prices (Release 2.0)
- Technical indicators (Release 2.0)
- Risk analytics / VaR (Release 4.0)
- Backtesting / simulation (Release 5.0)
- GCC markets (Release 6.0)

### 1.8 Dependencies

| Dependency | Type | Status |
|-----------|------|--------|
| EGX licensed market data vendor contract | Business | Must be signed |
| KYC provider (Sumsub/Shufti Pro) API contract | Technical | Must be signed |
| Payment gateway (Paymob/Fawry) integration | Technical | Must be signed |
| FRA operating license for advisory-only platform | Regulatory | Must be obtained |
| PDPL registration with Egyptian data authority | Regulatory | Must be completed |

### 1.9 Database Changes

**New PostgreSQL Schemas:**
```sql
-- Identity schemas
CREATE SCHEMA identity;         -- UserProfile, Credential, Session
CREATE SCHEMA compliance;       -- KYCRecord, AMLResult, ConsentRecord
CREATE SCHEMA audit;            -- AuditEvent (append-only, WORM backed)

-- Portfolio schemas
CREATE SCHEMA portfolio;        -- Portfolio, Position, Transaction, CashBalance
CREATE SCHEMA instruments;      -- SecurityMaster, InstrumentDefinition

-- Subscription schemas
CREATE SCHEMA subscriptions;    -- Subscription, EntitlementMatrix, BillingRecord

-- Market calendar schemas
CREATE SCHEMA market_calendar;  -- TradingCalendar, SessionStatus, HolidaySchedule
```

**TimescaleDB Hypertables:**
```sql
CREATE TABLE audit.audit_events (...) -- time-partitioned, append-only
```

**Qdrant Collections:** (placeholder collections, not yet populated)
- `egx_instruments` — ready for vector search (populated in R2.0)

### 1.10 API Requirements

**New API Endpoints (Kong Gateway):**
```
POST /v1/auth/register          — User registration
POST /v1/auth/login             — Authentication (Keycloak OIDC)
POST /v1/auth/refresh           — Token refresh
POST /v1/kyc/initiate           — KYC document upload
GET  /v1/kyc/status             — KYC verification status
POST /v1/portfolios             — Create portfolio
GET  /v1/portfolios/{id}        — Get portfolio details
POST /v1/watchlists             — Create watchlist
POST /v1/subscriptions/activate — Activate subscription tier
GET  /v1/market/session         — EGX session status
DELETE /v1/users/{id}           — PDPL account deletion (SAGA-004)
GET  /v1/users/{id}/data-export — PDPL data export (SLICE-12 prep)
```

### 1.11 Frontend Requirements

**Flutter Screens:**
- `RegistrationScreen` — email, password, phone (+20 prefix)
- `NationalIDUploadScreen` — front + back Egyptian National ID
- `LivenessCheckScreen` — selfie liveness (anti-spoofing)
- `KYCStatusScreen` — real-time KYC progress
- `KYCApprovedScreen` — onboarding complete
- `HomeScreen` — empty state with EGX session status
- `CreatePortfolioScreen` — portfolio name, currency base
- `PortfolioScreen` — empty portfolio view
- `WatchlistScreen` — empty watchlist
- `SubscriptionScreen` — tier selection + payment
- `ProfileScreen` — locale, language, notifications
- `SessionStatusWidget` — PRE_OPEN / OPEN / CLOSED / HALTED indicator

**RTL/Localization:** All screens must render in Arabic (default) + English (switchable).

### 1.12 Backend Services

| Service | Language | Bounded Contexts Served |
|---------|---------|------------------------|
| `identity-service` (NestJS) | TypeScript | UserIdentity, Authentication |
| `kyc-service` (NestJS) | TypeScript | KYCVerification, AMLScreening |
| `compliance-service` (NestJS) | TypeScript | Compliance, AuditTrail |
| `portfolio-service` (NestJS) | TypeScript | Portfolio, Position, Transaction |
| `subscription-service` (NestJS) | TypeScript | Subscription, Billing, Entitlement |
| `market-calendar-service` (NestJS) | TypeScript | MarketCalendar, SessionStatus, SecurityMaster |
| `notification-service` (NestJS) | TypeScript | Notification |
| `api-gateway` (Kong) | — | All services |

### 1.13 AI Engines

**None operational in R1.0.** LLM Gateway service deployed but idle.

### 1.14 Infrastructure Requirements

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Kubernetes | K8s | 1.28+ | All services containerized |
| PostgreSQL | Patroni HA | 16+ | Primary + replica |
| Message Bus | Apache Kafka | 3.7+ | KRaft mode (no ZooKeeper) |
| Schema Registry | Karapace | 3.x | All events registered before first publish |
| Cache | Valkey | 8.0+ | Session, feature flags |
| Object Storage | MinIO | Latest | WORM Object Lock COMPLIANCE mode |
| Secret Management | OpenBao | 1.x | API keys, encryption keys |
| Identity Provider | Keycloak | 24+ | OIDC, JWT, MFA |
| API Gateway | Kong | 3.x | Rate limiting, auth, routing |
| Feature Flags | Unleash | 5.x | All features default OFF |
| CI/CD | FluxCD v2 | — | GitOps; EGX session deployment gate |
| Observability | Prometheus + Grafana + Loki + Tempo | — | Three-pillar: metrics, logs, traces |

**Single Region: Cairo, Egypt (PDPL data sovereignty requirement)**

### 1.15 Testing Strategy

| Test Type | Tool | Coverage Target |
|-----------|------|----------------|
| BDD Acceptance | Behave | All 4 active slices pass |
| Integration | Testcontainers + pytest | 100% BC interactions |
| Load | k6 | P99 ≤ 500ms at 200 concurrent |
| Security | OWASP ZAP | Zero critical vulnerabilities |
| Float prohibition | `ast_float_checker.py` CI hook | 0 floats in financial code |
| Arabic quality | Native speaker review | 100% of Arabic copy reviewed |
| FRA disclaimer | Automated UI screenshot audit | N/A (no AI in R1.0) |
| WORM coverage | `audit_worm_coverage_ratio = 1.0` | KYC + AML + consent events |

### 1.16 Deployment Strategy

- FluxCD GitOps (production namespace)
- Blue-green deployment per service
- EGX session gate: no production deployments during 08:45–15:20 Cairo time
- Feature flags ALL default OFF; enable per user cohort
- Rollback: FluxCD `git revert` + PostgreSQL PITR (15-min RPO)

### 1.17 Success Metrics

| Metric | Target |
|--------|--------|
| KYC completion rate | ≥ 75% of registered users complete KYC |
| Onboarding time (SAGA-001 median) | ≤ 5 minutes |
| Authentication P99 latency | ≤ 200ms |
| System availability | ≥ 99.5% |
| PDPL consent recorded | 100% of registrations |
| AML false positive rate | ≤ 5% |

### 1.18 Release Exit Criteria

- [ ] All 4 active vertical slices (SLICE-01, SLICE-02, SLICE-08, SLICE-11) pass all 12 DoD criteria
- [ ] SAGA-001, SAGA-002, SAGA-004 fully operational
- [ ] PDPL consent infrastructure verified by legal counsel
- [ ] FRA advisory-only platform license obtained
- [ ] First 100 Alpha users onboarded and KYC-verified
- [ ] Security audit completed (OWASP Top 10 zero critical)
- [ ] Arabic copy reviewed by native Arabic financial professional

### 1.19 Business KPIs

| KPI | Target |
|-----|--------|
| Alpha registered users | 100–500 |
| KYC approval rate | ≥ 70% |
| Subscription conversion (Free → Paid) | ≥ 10% of Alpha cohort |
| NPS score (Alpha cohort) | ≥ 30 |

### 1.20 Technical KPIs

| KPI | Target |
|-----|--------|
| API P99 latency | ≤ 500ms |
| Kafka consumer lag | < 1,000 messages |
| Error rate | < 0.1% |
| Audit trail coverage | 100% |

### 1.21 Risk Level

🟡 **MEDIUM** — Novel market (no prior Egyptian fintech at this scale), KYC provider dependency, FRA regulatory timeline uncertainty

---

## SECTION 2 — RELEASE 2.0 BETA: MARKET INTELLIGENCE

### 2.1 Release Vision

> **"Give every Egyptian investor a professional-grade trading terminal — for EGX equities AND Forex — in their pocket, in Arabic."**

Release 2.0 transforms Tradeora from a registration system into a live market
intelligence platform for TWO markets simultaneously: the Egyptian Exchange (EGX)
and the global Forex market. Real-time EGX and FX price data, technical indicators
for both markets, Arabic news, sector heatmaps, fundamental data, and smart price
alerts — all make Tradeora immediately useful to active traders before any AI
recommendation is live.

Forex is added in R2.0 because:
- Egyptian traders actively trade Forex (USD/EGP, EUR/USD, GBP/USD are highly liquid)
- No FRA license is required for Forex data display (regulatory advantage)
- Forex operates 24/5 (Sunday 21:00 UTC – Friday 21:00 UTC), extending Tradeora's
  value outside EGX session hours (EGX is Sun–Thu, 09:30–15:30 Cairo)

### 2.2 Business Goals

1. Achieve 5,000 active Beta users from Egyptian Exchange and Forex trading community
2. Demonstrate EGX real-time data quality superior to existing portals
3. Be the first Arabic-language platform with integrated EGX + Forex market intelligence
4. Achieve ≥ 70% daily active usage among Beta cohort (during EGX sessions AND Forex trading hours)
5. Generate organic virality through Arabic-first UI differentiation for both markets
6. Establish first media coverage as "Egypt's premier AI trading intelligence platform for EGX and Forex"

### 2.3 Target Users

| Tier | EGX Features | Forex Features |
|------|-------------|---------------|
| Free | 15-min delayed EGX data, 1 portfolio, 5 tickers, 3 alerts | 15-min delayed Forex data, 3 FX pairs monitored |
| Basic/Premium | Real-time EGX data, unlimited watchlists, unlimited alerts, news feed | Real-time Forex ticks, 11+ pairs, spread display, session overlap |
| Institutional | Full EGX API access (B2B enterprise rate plan) | Full Forex API access |

### 2.4 Supported Markets

#### Egyptian Exchange (EGX)
- **Main Market + Nilex SME Market**: 300 instruments
- **Indices**: EGX30, EGX70 EWI, EGX100 EWI, EGX Shariah
- **Session**: Sunday–Thursday, 09:30–15:30 Cairo time (EGT = UTC+2)
- **Currency**: Egyptian Pound (EGP)
- **Data**: Real-time ticks (Premium), 15-min delayed (Free)

#### Forex Market (NEW IN R2.0)
- **Session**: 24/5 — Sunday 21:00 UTC through Friday 21:00 UTC
- **Trading Sessions Tracked**:
  - Sydney: 21:00–06:00 UTC
  - Tokyo: 00:00–09:00 UTC
  - London: 07:00–16:00 UTC
  - New York: 12:00–21:00 UTC
  - London-New York overlap: 12:00–16:00 UTC (highest liquidity)
- **Pairs Supported (11 pairs at launch)**:
  - EGP Majors: USD/EGP, EUR/EGP, GBP/EGP, SAR/EGP
  - G10 Majors: EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CAD
  - G10 Crosses: EUR/GBP, EUR/JPY
- **Pip Precision**:
  - Major pairs (non-JPY): 0.00001 (5 decimal places)
  - JPY pairs: 0.001 (3 decimal places)
  - EGP pairs: 0.0001 (4 decimal places)
- **Data Provider**: OANDA / FXCM / Dukascopy (professional grade)
- **No FRA advisory license required for Forex data display**
- **Data**: Real-time ticks (Premium), 15-min delayed (Free)

### 2.5 Supported Analysis Schools (Active)

**Computed indicators only** — no AI schools yet.
- RSI, MACD, Bollinger Bands, ADX, Ichimoku Cloud, Moving Averages, Volume oscillators (20+ computed indicators — MKT-DAT-003)

### 2.6 Included Features

#### Market Data (MKT Domain)

| Capability ID | Feature | Vertical Slice | Bounded Context |
|--------------|---------|---------------|----------------|
| MKT-DAT-001 | Real-time EGX market data ingestion (ticks, bid-ask, order book depth) | SLICE-04 | MarketData |
| MKT-DAT-002 | Market data distribution (real-time premium / 15-min delayed free) | SLICE-04 | MarketData |
| MKT-DAT-003 | Technical indicator computation (RSI, MACD, Bollinger, ADX, Ichimoku, 20+) | SLICE-04 | TechnicalAnalysis |
| MKT-SEC-002 | Corporate action tracking (dividends, splits, bonus shares, rights, mergers) | — | CorporateActions |
| MKT-CAL-002 | Circuit breaker tracking (EGX 5% individual halt, EGX100 5% market-wide halt) | — | MarketCalendar |

#### Financial Research (RES Domain)

| Capability ID | Feature | Vertical Slice | Bounded Context |
|--------------|---------|---------------|----------------|
| RES-FND-001 | Financial statement standardization (Arabic PDF, EAS + IFRS) | SLICE-10 | FundamentalData |
| RES-FND-002 | Earnings intelligence parsing (surprise, guidance, margin trend) | SLICE-10 | FundamentalData |
| RES-FND-003 | Fair value DCF modeling (EGP discount rates, sensitivity matrix) | SLICE-10 | Valuation |
| RES-MAC-001 | Economic indicator tracking (CBE rates, CPI, FX reserves, GDP) | — | MacroData |
| RES-MAC-002 | Financial news media ingestion (Arabic + English, EGX disclosures, press) | SLICE-07 | NewsIntelligence |
| RES-SEC-001 | Sector heatmap aggregation (EGX 18 official sectors, capital flow) | — | SectorIntelligence |

#### Alerts & Engagement (ENG Domain)

| Capability ID | Feature | Vertical Slice | Bounded Context |
|--------------|---------|---------------|----------------|
| ENG-ALT-001 | Price & volatility alert evaluation (threshold breach, volume spike) | SLICE-06 | AlertEngine |
| ENG-ALT-002 | Risk breach alert dispatch (VaR breach, concentration breach) | SLICE-06 | AlertEngine |

#### Portfolio Intelligence (PRT Domain)

| Capability ID | Feature | Vertical Slice | Bounded Context |
|--------------|---------|---------------|----------------|
| PRT-PRF-001 | Time-weighted return calculation (TWR, GIPS-compliant) | SLICE-05 | PortfolioPerformance |
| PRT-PRF-002 | Benchmark comparison evaluation (vs EGX30, EGX70, EGX100) | SLICE-05 | PortfolioPerformance |
| PRT-WTC-002 | Dynamic multi-variable screening (fundamental + technical + sector) | — | Screening |

#### Search

| Capability ID | Feature | Bounded Context |
|--------------|---------|----------------|
| XCC-SCH-001 | Cross-domain universal search (instruments, news, research) | Search |
| XCC-SCH-002 | Deep financial document search (PDF filings, earnings, news archives) | Search |

### 2.7 New Backend Services

| Service | Language | BCs Served |
|---------|---------|-----------|
| `market-data-service` (Python/FastAPI) | Python | MarketData, MarketDataDistribution |
| `technical-analysis-service` (Python) | Python | TechnicalAnalysis, TechnicalIndicator |
| `corporate-actions-service` (NestJS) | TypeScript | CorporateActions |
| `fundamental-data-service` (Python) | Python | FundamentalData, Valuation |
| `news-intelligence-service` (Python) | Python | NewsIntelligence |
| `macro-data-service` (Python) | Python | MacroData |
| `sector-intelligence-service` (Python) | Python | SectorIntelligence |
| `alert-engine-service` (Python) | Python | AlertEngine |
| `screening-service` (Python) | Python | Screening |
| `search-service` (NestJS) | TypeScript | Search |

### 2.8 Database Changes

**New TimescaleDB Hypertables:**
```sql
CREATE TABLE market_data.price_ticks (...) -- compressed, 90-day hot retention
CREATE TABLE market_data.ohlcv_bars (...)  -- 1m, 5m, 15m, 1h, 1d bars
CREATE TABLE market_data.order_book_snapshots (...) -- L2 depth
CREATE TABLE market_data.technical_indicators (...) -- pre-computed indicators
CREATE TABLE fundamentals.financial_statements (...) -- with available_from_ts (Rule 40)
CREATE TABLE fundamentals.earnings_events (...)
CREATE TABLE news.news_items (...) -- with ticker linkage, language tagging
CREATE TABLE macro.economic_indicators (...)
CREATE TABLE alerts.alert_configurations (...)
CREATE TABLE alerts.alert_triggers (...)
```

**New Kafka Topics:**
```
market.MarketData.PriceTickReceived.v1
market.MarketData.OHLCVBarCompleted.v1
market.MarketData.CircuitBreakerTriggered.v1
market.MarketData.SessionStatusChanged.v1
market.CorporateActions.DividendAnnounced.v1
market.CorporateActions.SplitEffected.v1
news.NewsIntelligence.ArticleIngested.v1
alerts.AlertEngine.PriceAlertTriggered.v1
alerts.AlertEngine.RiskAlertTriggered.v1
```

### 2.9 Infrastructure Additions

- **Valkey DB 1**: Market data cache (1-minute TTL for real-time ticks)
- **TimescaleDB**: Enabled on PostgreSQL cluster for time-series compression
- **Qdrant**: `egx_instruments` + `egx_news` collections populated

### 2.10 Testing Strategy

- SLICE-04 (Real-Time Price): Load test k6 at 1,000 concurrent tick consumers, P99 ≤ 100ms
- SLICE-06 (Alert): Test alert delivery < 5 seconds from tick receipt to push notification
- SLICE-07 (News): Arabic NLP quality review by native financial speaker
- SLICE-10 (Fundamentals): EAS financial statement parsing accuracy ≥ 95%
- Circuit breaker integration test: verify alert suppression during EGX halt

### 2.11 Success Metrics

| Metric | Target |
|--------|--------|
| Market data tick latency (P99) | ≤ 100ms from EGX to user screen |
| Alert delivery latency | ≤ 5 seconds |
| Arabic news coverage | ≥ 95% of EGX disclosures within 60 min of publication |
| Daily active usage rate (Beta) | ≥ 60% during EGX sessions |
| 15-min delay enforcement (Free tier) | 100% |

### 2.12 Release Exit Criteria

- [ ] SLICE-04, SLICE-06, SLICE-07, SLICE-10 pass all 12 DoD criteria
- [ ] EGX real-time data feed validated for 5 consecutive trading days
- [ ] Arabic news ingestion ≥ 95% coverage of EGX official disclosures
- [ ] Circuit breaker suppression verified during real or simulated halt
- [ ] 5,000 Beta users registered and actively using market data features

### 2.13 Risk Level

🟡 **MEDIUM** — EGX data vendor feed reliability; Arabic NLP accuracy

---

## SECTION 3 — RELEASE 3.0 BETA: AI INTELLIGENCE ENGINE

### 3.1 Release Vision

> **"The world's first 12-school AI consensus engine for Arabic-speaking investors."**

Release 3.0 activates Tradeora's core differentiating capability: the 12-school
AI Consensus Architecture. Every recommendation is generated by 12 specialized
analytical schools running in parallel, arbitrated by the WisdomEngine, validated
by the 7-check AI Safety Engine, and explained in native Arabic — with a mandatory
FRA disclaimer — before reaching the user.

This release makes Tradeora the most sophisticated AI advisory platform in the
Egyptian market.

### 3.2 Business Goals

1. Activate 12-school consensus and achieve ≥ 70% directional accuracy on EGX
2. Achieve Arabic AI Explanation Quality Score ≥ 4.0/5.0 (monthly human evaluation)
3. Hallucination rate < 2% (LLM-as-a-judge monthly evaluation)
4. 85% of recommendation requests pass AI Safety Gate (valid data, no circuit breaker)
5. Convert 30% of Beta users to Premium subscription (AI access gate)
6. Demonstrate regulatory compliance: every AI output carries FRA mandatory disclaimer

### 3.3 Target Users

| Tier | AI Access |
|------|----------|
| Free | 0 AI recommendations per day |
| Basic | 5 AI recommendations per day (limited quota) |
| Premium | Unlimited AI recommendations + full school breakdown |
| Institutional | API access to AI recommendation stream |

### 3.4 Supported Analysis Schools (Phase 1 — All 12 Active)

| School ID | School Name (English / Arabic) | Input Data | Weight (Base) | Phase |
|-----------|-------------------------------|-----------|--------------|-------|
| SCHOOL-01 | Market Intelligence / ذكاء السوق | EGX ticks, order book, bid-ask spread | 0.07 | 1 |
| SCHOOL-02 | Fundamental Analysis / التحليل الأساسي | P/E, P/B, ROE, EV/EBITDA, Debt/Equity | 0.09 | 1 |
| SCHOOL-03 | Technical Analysis / التحليل الفني | RSI, MACD, Bollinger, ADX, Ichimoku (20+) | 0.08 | 1 |
| SCHOOL-04 | Sentiment Analysis / تحليل المشاعر | Arabic financial news, social, EGX disclosures | 0.05 | 1 |
| SCHOOL-05 | Macroeconomic Analysis / التحليل الاقتصادي الكلي | CBE rates, USD/EGP, CPI, EGX cycle phase | 0.06 | 1 |
| SCHOOL-06 | Quantitative Models / النماذج الكمية | Mean-reversion, momentum, Fama-French (EGX) | 0.07 | 1 |
| SCHOOL-07 | Risk-Adjusted Return / العائد المعدل للمخاطر | Sharpe, Sortino, Calmar, VaR 99%, ES | 0.08 | 1 |
| SCHOOL-08 | Behavioral Finance / التمويل السلوكي | Herding, disposition effect, overreaction | 0.05 | 1 |
| SCHOOL-09 | Sector Rotation / دوران القطاعات | Sector momentum, relative P/E vs historical | 0.06 | 1 |
| SCHOOL-10 | Peer Comparison / مقارنة الأقران | Qdrant vector similarity vs similar companies | 0.05 | 1 |
| SCHOOL-11 | Earnings Quality / جودة الأرباح | Accruals, revenue quality, cash conversion | 0.07 | 1 |
| SCHOOL-12 | Pattern Recognition / التعرف على الأنماط | H&S, double bottom, flags, channels (CNN ML) | 0.06 | 1 |

**Quorum Rules:**
- Minimum 9 of 12 schools must participate (75% quorum)
- Minimum confidence 0.75 per school to be eligible
- All 7 safety checks must pass before delivery

### 3.5 Included AI Engine Features

| Engine | Feature | User-Visible |
|--------|---------|-------------|
| Consensus Orchestrator | Weighted voting (Decimal arithmetic, ROUND_HALF_UP) | No (internal) |
| WisdomEngine | Dynamic weight calibration (monthly Brier score + accuracy) | No (internal) |
| AI Safety Engine | 7-check validation gate | Yes (user sees "Analysis Pending" on failure) |
| Explainability Engine | Arabic explanation generation (50–500 words) | Yes (Arabic + English) |
| LLM Gateway | Provider routing (Ollama → DeepSeek → OpenAI fallback chain) | No (internal) |
| Confidence Calibration | Platt scaling confidence calibration | Yes (confidence % displayed) |

### 3.6 AI Recommendation Features (User-Facing)

| Capability ID | Feature | Bounded Context |
|--------------|---------|----------------|
| AI-REC-001 | Explainable recommendation generation (BUY/HOLD/SELL + Arabic rationale + confidence) | AIConsensus |
| AI-REC-002 | Recommendation confidence calibration (0.00%–100.00%, Decimal) | AIConsensus |
| AI-REC-003 | Quantitative signal generation (direction flags for active traders) | SignalGeneration |
| AI-RES-001 | Equity research report synthesis (Arabic + English, institutional-grade) | ResearchSynthesis |
| AI-RES-002 | Daily market brief compilation (pre-market, delivered by 08:30 Cairo) | MarketBrief |
| RSK-MAC-003 | News sentiment scoring (Arabic NLP, polarity + subjectivity) | SentimentEngine |

### 3.7 FRA Compliance (Mandatory)

Every AI output includes:
- Mandatory Arabic disclaimer: `"هذا التحليل استرشادي فقط ولا يعد توصية استثمارية ملزمة"`
- Confidence score (0.00–1.00)
- Explanation (50–500 words Arabic + English)
- Data freshness indicator
- School participation count

**SAGA-003 (AI Recommendation Audit, 30-second timeout):**
Every recommendation is WORM-archived in MinIO before delivery to user.
If WORM write fails → recommendation is blocked, not delivered.

### 3.8 AI Model Infrastructure (Phase 1 CPU)

| Specification | Value |
|--------------|-------|
| Primary model (reasoning) | Qwen2.5:14b-q4 (quantized for CPU) |
| Fast model (latency-sensitive) | Qwen2.5:7b-q4 |
| LLM Gateway | LiteLLM proxy + custom caching layer |
| Fallback chain | Ollama → DeepSeek API → OpenAI API |
| Max concurrent Ollama requests | 8 |
| Pre-session warm-up | 08:30 Cairo (JOB-WARMUP-001), 30 min before EGX open |
| GPU provision | None in Phase 1 (DEBT-003, Phase 2 upgrade) |
| Vector DB | Qdrant (SCHOOL-10 peer comparison, SCHOOL-12 pattern matching) |

### 3.9 AI Performance SLAs

| Tier | Engines | P99 Latency | Cache |
|------|---------|------------|-------|
| Tier 1 Realtime | SCHOOL-01, 03, 04, 06, 09 | ≤ 1,500ms | TTL 60–300s |
| Tier 2 Extended | SCHOOL-02, 05, 07, 08, 10, 11, 12 | ≤ 3,000ms | TTL 300–3600s |
| Tier 3 Background | Pre-computed schools | Served < 50ms | Pre-computed |
| End-to-end P99 | Full recommendation | ≤ 3,000ms (cached: ≤ 100ms) | Cache key: SHA-256(engine+ticker+timeframe+session+portfolioHash) |

### 3.10 New Backend Services

| Service | Language | School Served |
|---------|---------|--------------|
| `ai-market-intelligence` (Python) | Python | SCHOOL-01 |
| `ai-fundamental-analysis` (Python) | Python | SCHOOL-02 |
| `ai-technical-analysis` (Python) | Python | SCHOOL-03 |
| `ai-sentiment-analysis` (Python) | Python | SCHOOL-04 |
| `ai-macro-analysis` (Python) | Python | SCHOOL-05 |
| `ai-quant-models` (Python) | Python | SCHOOL-06 |
| `ai-risk-adjusted` (Python) | Python | SCHOOL-07 |
| `ai-behavioral-finance` (Python) | Python | SCHOOL-08 |
| `ai-sector-rotation` (Python) | Python | SCHOOL-09 |
| `ai-peer-comparison` (Python) | Python | SCHOOL-10 |
| `ai-earnings-quality` (Python) | Python | SCHOOL-11 |
| `ai-pattern-recognition` (Python) | Python | SCHOOL-12 |
| `ai-consensus-orchestrator` (Python) | Python | WisdomEngine + Consensus + Safety |
| `ai-explainability-service` (Python) | Python | Arabic/English explanation generation |
| `llm-gateway-service` (Python) | Python | Provider routing + caching |
| `ai-recommendation-service` (NestJS) | TypeScript | User-facing recommendation API |

### 3.11 New Kafka Topics

```
ai.AIConsensus.SchoolRecommendationGenerated.v1
ai.AIConsensus.ConsensusReached.v1
ai.AIConsensus.InsufficientConsensus.v1
ai.AIConsensus.SafetyCheckFailed.v1
ai.AIConsensus.RecommendationReady.v1
ai.AIConsensus.RecommendationWORMArchived.v1
ai.WisdomEngine.WeightCalibrationUpdated.v1
ai.Schools.SchoolExcluded.v1
```

### 3.12 New Valkey Namespaces

```
ai:rec:{ticker}:{timeframe}:{session}     — Recommendation cache (60s–60min TTL by tier)
ai:schools:warmup:passed                  — Pre-session warm-up gate flag
ai:wisdom:weights:{school_id}             — Current school weights
```

### 3.13 Success Metrics

| Metric | Target |
|--------|--------|
| Directional accuracy (monthly backtest) | ≥ 70% |
| Arabic explanation quality (human review) | ≥ 4.0/5.0 |
| Hallucination rate (LLM-as-judge) | < 2% |
| AI Safety Gate pass rate | ≥ 85% |
| FRA disclaimer presence | 100% of recommendations |
| WORM archive coverage | 100% of recommendations |
| Recommendation P99 latency | ≤ 3,000ms |

### 3.14 Release Exit Criteria

- [ ] SLICE-03 (AI Recommendation) passes all 12 DoD criteria
- [ ] SAGA-003 (AI Recommendation Audit) fully operational
- [ ] 12 schools tested with ≥ 100 EGX tickers each
- [ ] Arabic explanation approved by native financial Arabic reviewer
- [ ] FRA disclaimer verified in 100% of AI outputs
- [ ] WisdomEngine calibration verified (Brier score + accuracy tracking)
- [ ] LLM Gateway fallback chain tested (Ollama → DeepSeek → OpenAI)
- [ ] 15,000 users with ≥ 20% using AI recommendations weekly

### 3.15 Risk Level

🔴 **HIGH** — AI safety (financial recommendations), FRA compliance, Ollama CPU capacity, Arabic NLP quality

---

## SECTION 4 — RELEASE 4.0 GA: ANALYTICS & RISK

### 4.1 Release Vision

> **"Full portfolio intelligence. Complete risk management. Production-grade for Egypt."**

Release 4.0 completes the Phase 1 feature set with comprehensive portfolio analytics,
professional-grade risk management, and the platform's reporting layer. This release
marks Tradeora's General Availability — open to the full Egyptian market, all
subscription tiers, with no Alpha/Beta restrictions.

### 4.2 Business Goals

1. Open platform to general public (remove Beta restrictions)
2. Achieve 50,000 Monthly Active Users within 6 months of GA
3. Generate EGP 2M+ Monthly Recurring Revenue from subscriptions
4. Achieve NPS ≥ 45 (industry benchmark for fintech)
5. Pass first FRA regulatory examination with zero major findings
6. Launch B2B API program for first 3–5 institutional partners

### 4.3 Target Users

All tiers open publicly. No invitation required.

| Tier | Features |
|------|---------|
| Free | Delayed data, 1 portfolio, basic alerts, EGX session status |
| Basic | Real-time data, 3 portfolios, unlimited alerts, AI (5/day) |
| Premium | Unlimited AI, full research, risk analytics, portfolio reports |
| Family Office | Multi-portfolio, multi-user, advanced risk, custom benchmarks |
| Institutional | Full B2B API, whitelabel options, custom SLA |

### 4.4 Included Features

#### Risk Management (RSK Domain — Full)

| Capability ID | Feature | Vertical Slice | Bounded Context |
|--------------|---------|---------------|----------------|
| RSK-PRF-001 | User risk tolerance profiling (questionnaire, FRA suitability) | — | RiskProfiling |
| RSK-ANL-001 | Value-at-Risk (VaR) modeling (historical + parametric, 95%/99%) | — | RiskAnalytics |
| RSK-ANL-002 | Sector concentration risk stress-testing (EGX 18 sectors, correlation matrix) | — | RiskAnalytics |
| RSK-ANL-003 | Drawdown stress-testing (historical EGX crash scenarios, EGP devaluation) | — | RiskAnalytics |

#### Portfolio Intelligence (PRT Domain — Full)

| Capability ID | Feature | Vertical Slice | Bounded Context |
|--------------|---------|---------------|----------------|
| PRT-PRF-001 | Time-weighted return (TWR, GIPS, periodic return series) | SLICE-05 | PortfolioPerformance |
| PRT-PRF-002 | Benchmark comparison (alpha vs EGX30/70/100/Shariah) | SLICE-05 | PortfolioPerformance |
| — | Portfolio rebalancing suggestion (SAGA-005: AI suggests → user confirms) | SLICE-09 | PortfolioRebalancing |
| — | Position sizing recommendations (risk-adjusted, Decimal arithmetic) | — | PositionSizing |

#### Financial Research (RES Domain — Full)

| Capability ID | Feature | Vertical Slice | Bounded Context |
|--------------|---------|---------------|----------------|
| RES-FND-003 | Fair value DCF modeling (EGP discounting, sensitivity matrix, transparent assumptions) | SLICE-10 | Valuation |
| RES-MAC-003 | News sentiment scoring (Arabic NLP, polarity, subjectivity) | — | SentimentEngine |
| RES-SEC-001 | Sector heatmap aggregation (18 EGX sectors, capital flow) | — | SectorIntelligence |

#### Reporting & Export (RPT Domain — Full)

| Capability ID | Feature | Vertical Slice | Bounded Context |
|--------------|---------|---------------|----------------|
| RPT-GEN-001 | Portfolio statement generation (PDF/Excel, Arabic/English, EGP tax summary) | — | Reporting |
| RPT-GEN-002 | Equity research export compilation (PDF, bilingual, DCF + ratios) | — | Reporting |
| — | User data export (PDPL Article 19 compliance) | SLICE-12 | PDPLCompliance |
| XCC-AUD-002 | Audit trail inquiry & reporting (regulatory review export) | — | AuditTrail |

#### Economic Calendar

| Feature | Bounded Context |
|---------|----------------|
| Economic calendar (CBE decisions, CAPMAS, earnings releases, EGX corporate actions) | MacroData |
| Event countdown (time to next CBE decision, earnings release) | MacroData |

### 4.5 Active Sagas (Full Set)

| Saga | Description |
|------|-------------|
| SAGA-001 | User Onboarding |
| SAGA-002 | Subscription Activation |
| SAGA-003 | AI Recommendation WORM Audit (every recommendation) |
| SAGA-004 | User Account Deletion / PDPL |
| SAGA-005 | Portfolio Rebalancing (AI suggest → user confirm → WORM audit) |
| SAGA-006 | Subscription Downgrade (archive excess portfolios/watchlists) |

### 4.6 New Backend Services

| Service | Language | Notes |
|---------|---------|-------|
| `risk-analytics-service` (Python) | Python | VaR, stress testing, drawdown |
| `risk-profiling-service` (NestJS) | TypeScript | FRA suitability questionnaire |
| `reporting-service` (Python) | Python | PDF/Excel generation (WeasyPrint/OpenPyXL) |
| `position-sizing-service` (Python) | Python | Risk-adjusted position size calc |
| `portfolio-rebalancing-service` (NestJS) | TypeScript | SAGA-005 orchestration |
| `economic-calendar-service` (Python) | Python | CBE, CAPMAS, EGX event calendar |

### 4.7 Success Metrics

| Metric | Target |
|--------|--------|
| Monthly Active Users (6 months post-GA) | 50,000 |
| Monthly Recurring Revenue | EGP 2,000,000+ |
| VaR calculation accuracy (vs manual benchmark) | ≤ 0.5% deviation |
| Report generation latency (P99) | ≤ 10 seconds |
| FRA audit findings | Zero major findings |

### 4.8 Release Exit Criteria

- [ ] SLICE-05, SLICE-09, SLICE-12 pass all 12 DoD criteria
- [ ] All 6 sagas operational
- [ ] VaR calculation validated by independent financial analyst
- [ ] PDF reports approved by Arabic financial content reviewer
- [ ] PDPL data export tested with user consent verification
- [ ] Platform passes internal FRA readiness audit

### 4.9 Risk Level

🟡 **MEDIUM** — Risk model accuracy, FRA regulatory examination, PDF generation bilingual quality

---

## SECTION 5 — RELEASE 5.0 ENTERPRISE: ENTERPRISE ANALYTICS + CRYPTO

### 5.1 Release Vision

> **"AI that learns from markets. And now: every market. EGX, Forex, and Crypto — under one intelligence platform."**

Release 5.0 delivers two parallel achievements:
1. **Enterprise AI Learning**: Ground truth feedback, school calibration, self-reflection,
   and bias detection make Tradeora's AI measurably more accurate over time.
2. **Crypto Market Launch**: Bitcoin, Ethereum, and the top 50 cryptocurrencies are added
   as the second market expansion after EGX+Forex. Crypto trades 24/7/365 — creating
   a permanent revenue opportunity outside EGX and Forex sessions.

This release also introduces the multi-tenant Family Office tier and the internal
backtesting infrastructure (internal engineering only, never user-facing per FRA).


### 5.2 Business Goals

1. **Crypto Market**: Launch EGX+Forex+Crypto combined platform (BTC, ETH, top 50 by market cap)
2. Demonstrate measurable AI accuracy improvement over time (WisdomEngine effect)
3. Onboard first 10 Family Office clients (multi-portfolio, multi-user)
4. Establish B2B API platform with 3–5 institutional clients
5. Achieve AI directional accuracy ≥ 72% (improvement from 70% launch baseline)
6. Complete first annual Architecture Evolution Review (January)
7. Pass first external security penetration test
8. Achieve 200,000 Monthly Active Users (EGX + Forex + Crypto combined)

### 5.3 Included AI Engine Features

| Engine | Capability | Visible to Users |
|--------|-----------|-----------------|
| Learning Engine (TRD-AI-023) | Ground truth feedback collection (EGX outcome 5 days later), school weight adjustment (CMGR 0.1 rate) | No (internal) |
| Self-Reflection Engine (TRD-AI-024) | Monthly accuracy audit, recommendation quality scoring | No (internal) |
| Bias Detection Engine (TRD-AI-025) | Systematic school bias detection, calibration penalty | No (internal) |
| Decision Improvement Engine (TRD-AI-026) | Weight bounds enforcement [0.04–0.12], auto-exclusion (accuracy < 55% × 3 months) | No (internal) |
| Ground Truth Collector | Market outcome collection (price change 5d post-recommendation), user behavior tracking | No (internal) |
| Confidence Calibration System | Platt scaling recalibration (monthly, 90-day lookback), calibration error measurement | Yes (improved accuracy score) |

**Ground Truth Signal Types (8 types, all collected):**
1. EGX market outcome (price movement 5 EGX trading days after recommendation)
2. Forex market outcome (exchange rate movement 1 day after recommendation)
3. Crypto market outcome (price movement 7 days after recommendation — crypto volatility window)
4. Portfolio outcome (NAV change attributed to recommendation)
5. User action (did user follow the recommendation?)
6. User explicit feedback (thumbs up/down in app)
7. Recommendation success (directional accuracy)
8. Confidence calibration (confidence vs accuracy delta)

**Qdrant Learning Collections:**
- `learning_core` — foundational EGX + Forex + Crypto patterns (never pruned, council-gated)
- `learning_recent` — high-accuracy past 90 days (≥ 0.65 directional accuracy, max 10,000/school)
- `learning_antipatterns` — low-accuracy recommendations (accuracy < 0.40, negative examples)
- `learning_calibration` — confidence vs accuracy pairs (Platt scaling calibration)

### 5.3-A Crypto Market Features (NEW IN R5.0)

#### Crypto Supported Instruments

| Category | Instruments | Notes |
|---------|------------|-------|
| Tier 1 (always live) | BTC, ETH, USDT, BNB, SOL, USDC | Highest liquidity |
| Tier 2 (live at launch) | XRP, ADA, DOGE, MATIC, LINK, DOT, AVAX, UNI, LTC | Major altcoins |
| Tier 3 (top 50 by market cap) | Remaining to reach top 50 | Market cap ranked |
| EGP pairs | BTC/EGP, ETH/EGP | Egyptian Pound valuation |

#### Crypto Market Specifications

| Specification | Value |
|--------------|-------|
| Trading hours | 24/7/365 (never closes) |
| Price precision | 8 decimal places (Decimal('0.00000001') for 1 Satoshi) |
| Quote currency | USD primary; EGP secondary (converted via USD/EGP real-time) |
| Data provider | Binance WebSocket API (primary) + CoinGecko API (secondary) + CryptoCompare (fallback) |
| Session gate | None (crypto never sleeps — no EGX session gate applied) |
| Regulatory | CBE crypto advisory guidelines; advisory-only; no custody |

#### Crypto-Specific AI School (SCHOOL-13)

| Attribute | Value |
|-----------|-------|
| School ID | SCHOOL-13 |
| School Name | Crypto On-Chain Analysis / تحليل البيانات على السلسلة |
| Input Data | Hash rate, MVRV ratio, NVT ratio, active addresses, Fear & Greed index, social sentiment (Reddit/Twitter), exchange inflows/outflows |
| Data Provider | Glassnode / CryptoQuant (on-chain) + Alternative.me (Fear & Greed) |
| Model Backend | Statistical Engine + Ollama (Qwen2.5:7b for sentiment) |
| Base Weight | 0.06 |
| Latency SLA | 2,000ms |
| Phase | 2 (R5.0) |

#### Crypto Compliance

- Every crypto AI output carries: **"هذا التحليل خاص بالعملات الرقمية ولا يعد توصية استثمارية ملزمة. العملات الرقمية استثمارات عالية المخاطر."**
- CBE advisory guidelines compliance statement in all crypto AI outputs
- No custody, no execution — advisory only
- Extreme volatility warning displayed when 24h change > 10%

#### Crypto New Backend Services

| Service | Language | Purpose |
|---------|---------|--------|
| `crypto-market-data-service` (Python) | Python | Binance WebSocket + CoinGecko REST ingestion |
| `crypto-technical-analysis-service` (Python) | Python | RSI/MACD/BB/ATR adapted for 24/7 crypto markets |
| `crypto-onchain-service` (Python) | Python | Glassnode + CryptoQuant on-chain metrics |
| `ai-crypto-onchain-school` (Python) | Python | SCHOOL-13 — on-chain + sentiment analysis |
| `crypto-portfolio-service` (NestJS) | TypeScript | BTC/ETH/altcoin position tracking in Decimal |

### 5.4 Backtesting Infrastructure (Internal Engineering — NOT User-Facing)

> ⚠️ **FRA Compliance Constraint**: Backtesting results are INTERNAL ENGINEERING TOOLS ONLY.
> They MUST NEVER be displayed to users. Displaying simulation results to users is a
> critical regulatory violation under FRA No. 92/2022.

| Feature | Description |
|---------|-------------|
| Historical Backtesting Engine | Applies AI school logic to historical EGX data with Rule 40 (look-ahead bias prevention) |
| Rule 40 Enforcement | All queries filtered by `available_from_ts` (not `event_date`); CI static analysis; separate DB schema |
| School Accuracy Golden Dataset | Held-out validation period; SHA-256 integrity verified before each run |
| Monte Carlo Portfolio Stress Test | 95th/99th percentile loss estimates; EGX shock scenarios (20% EGP devaluation, 500bps rate hike) |
| WisdomEngine Weight Calibration | Monthly Brier score measurement; 3-month rolling accuracy window |
| Backtesting Results Storage | MinIO with `internal_use_only=true` metadata; excluded from PDPL exports |

**EGX-Specific Backtesting Features:**
- Configurable slippage model (EGX T+0 settlement, circuit breaker rules)
- Price fixing session modeling
- Bid-ask spread modeling for illiquid mid/small cap EGX names
- Regime detection (4 historical EGX regimes: 2012–14, 2016–17, 2019–21, 2022+)

### 5.5 Multi-Tenancy (Family Office Tier)

| Feature | Description | Bounded Context |
|---------|-------------|----------------|
| Schema-per-tenant isolation | Each Family Office gets isolated PostgreSQL schema with RLS | MultiTenancy |
| Multi-portfolio management | Multiple portfolios per family unit (labelled by beneficiary) | Portfolio |
| Multi-user access | Principal + family members with role-based access (Viewer, Analyst, Manager) | Authentication |
| Consolidated reporting | Aggregated family NAV + per-beneficiary breakdown | Reporting |
| Custom benchmark support | User-defined blended benchmarks | PortfolioPerformance |
| Multi-tenant provisioning | SAGA-007 (new: Family Office onboarding orchestration) | MultiTenancy |

### 5.6 New Backend Services

| Service | Notes |
|---------|-------|
| `ground-truth-collector` (Python) | Collects market outcomes, user behavior |
| `learning-engine` (Python) | School weight adjustment, Qdrant RAG learning |
| `self-reflection-engine` (Python) | Monthly accuracy audits |
| `bias-detection-engine` (Python) | Systematic bias checks |
| `backtesting-engine` (Python) | Rule-40 compliant historical simulation |
| `monte-carlo-service` (Python) | Portfolio stress testing |
| `multi-tenancy-service` (NestJS) | Family Office provisioning |

### 5.7 Infrastructure Changes

- **GPU Nodes**: NVIDIA A100 added for Phase 2 preparation (DEBT-003 resolved)
- **vLLM**: Added alongside Ollama for Phase 2 readiness (LLM Gateway routes to it)
- **TimescaleDB**: `benchmark_results` hypertable added (7-year retention)
- **TimescaleDB**: `evolution_kpi_history` hypertable added (10-year retention)
- **Second Region**: Cairo primary + Riyadh standby (passive) deployment begun

### 5.8 Success Metrics

| Metric | Target |
|--------|--------|
| AI directional accuracy improvement | ≥ 72% (from 70% at R3.0 launch) |
| Family Office clients | 10 |
| B2B institutional API clients | 3–5 |
| Learning Engine weekly runs | 100% on schedule |
| School weight drift (Architecture Stability Index) | ≥ 0.95 |

### 5.9 Risk Level

🟡 **MEDIUM** — ML learning stability (catastrophic forgetting prevention), multi-tenant isolation, backtesting Rule 40 enforcement

---

## SECTION 6 — RELEASE 6.0 SCALE: US MARKETS EXPANSION

### 6.1 Release Vision

> **"The platform that never sleeps: EGX equities, Forex 24/5, Crypto 24/7, US Stocks. 1 million users. The Arab world's most comprehensive trading intelligence."**

Release 6.0 adds US equity markets — NYSE and NASDAQ — as the third market
expansion per the approved market sequence (EGX+Forex → Crypto → US Stocks).
Five additional AI schools are activated bringing the consensus engine to 17 schools.
Broker integration, paper trading, tax-aware wealth management, advisory services
copilot, and the plugin marketplace are all launched. Multi-region active-passive
(Cairo + Riyadh) is finalized.

### 6.2 Business Goals

1. **Launch US Markets**: NYSE + NASDAQ equities with SEC advisory compliance
2. Activate 17-school consensus (OptionsFlow, InsiderActivity, ESG, GlobalMacro, AlternativeData)
3. Achieve 1,000,000 Monthly Active Users (EGX + Forex + Crypto + US Stocks)
4. Launch broker integration (EXC-SOR-001) with 3+ EGX brokers
5. Launch plugin marketplace with 10+ certified third-party providers
6. Generate EGP 40M+ Monthly Recurring Revenue
7. Multi-region active-passive (Cairo primary + Riyadh standby) fully operational
8. First 50 Family Office clients; B2B platform with 10+ institutional clients

### 6.3 Supported Markets (R6.0 — 4 Markets)

| Market | Exchange(s) | Instruments | Session | License Required |
|--------|------------|------------|---------|----------------|
| Egyptian Exchange | EGX Main + Nilex | 300+ | Sun–Thu 09:30–15:30 Cairo | FRA ✅ |
| Forex | 11+ pairs | EUR/USD, GBP/USD, USD/JPY, USD/EGP, + 7 more | 24/5 | None |
| Crypto | Top 50 by market cap | BTC, ETH, BNB, SOL, + 46 more | 24/7/365 | CBE guidelines |
| **US Stocks (NEW)** | NYSE + NASDAQ | S&P 500 + NASDAQ + DJIA + Russell 2000 | Mon–Fri 09:30–16:00 ET | **SEC advisory** |

#### US Market Specifications (NEW IN R6.0)

| Specification | Value |
|--------------|-------|
| Primary session | 09:30–16:00 ET (Mon–Fri, NYSE calendar) |
| Pre-market | 04:00–09:30 ET (Premium tier only) |
| After-hours | 16:00–20:00 ET (Premium tier only) |
| Cairo time (winter, UTC+2) | Market opens at **16:30 Cairo**, closes at **23:00 Cairo** |
| Cairo time (summer, UTC+3) | Market opens at **15:30 Cairo**, closes at **22:00 Cairo** |
| DST handling | US DST: spring forward 2nd Sunday March; fall back 1st Sunday November |
| Price precision | USD to 2 decimal places (equities), 4 for ETFs |
| Quote currency | USD primary; EGP equivalent displayed |
| Regulatory | SEC advisory-only compliance; no solicitation without SEC registration |
| Data provider | IEX Cloud / Polygon.io / Alpaca Markets API |
| Indices | S&P 500, NASDAQ Composite, DJIA, Russell 2000, VIX |
| Corporate actions | US dividends, splits, SPAC mergers, earnings dates |

#### SEC Compliance for US Stock AI Outputs

- Every US stock AI output carries mandatory disclaimer: **"This analysis is for informational purposes only and does not constitute investment advice. Past performance does not guarantee future results. Trading US securities involves risk."**
- Arabic version: **"هذا التحليل لأغراض معلوماتية فقط ولا يعد توصية استثمارية ملزمة."**
- Advisory-only model (no execution, no custody of US securities)
- SEC registration obtained before US stock AI recommendations go live

#### New Phase 2 AI Schools (5 additional — 17 total)

| School ID | School Name | Primary Market Focus | Phase |
|-----------|------------|---------------------|-------|
| SCHOOL-14 | Options Flow / تدفق الخيارات | US Options markets (IV, put/call ratio, unusual activity) | R6.0 |
| SCHOOL-15 | Insider Activity / نشاط المطلعين | Director dealings, institutional 13F filings (US) | R6.0 |
| SCHOOL-16 | ESG Analysis / تحليل ESG | ESG scoring + Sharia compliance screen (EGX + US) | R6.0 |
| SCHOOL-17 | Global Macro / الاقتصاد الكلي العالمي | US Fed, ECB, BOE, BOJ policy impact; global risk-on/off | R6.0 |
| SCHOOL-18 | Alternative Data / البيانات البديلة | Satellite imagery, web traffic, credit card data (US focus) | R6.0 |

**Note**: School numbering updated — SCHOOL-13 is Crypto On-Chain (added R5.0). Schools 14–18 are Phase 2 schools.

**17-School Quorum Recalibration (Required):**
- Minimum participating schools: 13 of 17 (76.5%)
- New ADR required and must be signed by Architecture Governance Board before R6.0 goes live
- WisdomEngine base weights recalibrated for 17-school configuration

| Exchange | Country | Instruments | License Required |
| QSE | Qatar | 50+ | QFMA |

### 6.4 Phase 2 AI Schools (5 Additional — Total: 17)

| School ID | School Name | Input Data | Phase |
|-----------|-------------|-----------|-------|
| SCHOOL-13 | Options Flow / تدفق الخيارات | Implied volatility, put/call ratio, unusual options activity | 2 |
| SCHOOL-14 | Insider Activity / نشاط المطلعين | Director dealings, institutional accumulation signals | 2 |
| SCHOOL-15 | ESG Analysis / التحليل البيئي والاجتماعي والحوكمة | Sharia compliance screen + ESG scoring for MENA companies | 2 |
| SCHOOL-16 | Global Macro / الاقتصاد الكلي العالمي | Correlation with global indices, US Fed impact on MENA | 2 |
| SCHOOL-17 | Alternative Data / البيانات البديلة | Satellite imagery, web traffic, consumer data (EGX Phase 3) | 2→3 |

**Phase 2 Quorum Recalibration:**
- Minimum participating schools: 13 of 17 (76.5% — new ADR required per AI_INTELLIGENCE_ENGINE_ARCHITECTURE.md)

### 6.5 Phase 2 Features

#### Trade Execution (EXC Domain — Phase 2)

| Capability ID | Feature | Bounded Context |
|--------------|---------|----------------|
| EXC-SOR-001 | Broker order parameter routing (Smart Order Routing via licensed EGX brokers) | OrderManagement |
| — | Order lifecycle tracking (PENDING → SUBMITTED → FILLED / REJECTED) | OrderManagement |
| — | Non-custodial model: explicit user authorization per order | OrderManagement |

> ⚠️ No autonomous execution. Article 6.2 (Constitution): AI is NEVER connected to OMS.
> Every order requires explicit user confirmation.

#### Wealth Management (WLT Domain — Phase 2)

| Capability ID | Feature | Bounded Context |
|--------------|---------|----------------|
| WLT-REB-001 | Tax-aware rebalancing plan synthesis (low-slippage, EGX capital gains tax aware) | WealthManagement |
| — | Private non-public asset tracking (Phase 2) | WealthManagement |
| — | Multi-generational family wealth accounts (Phase 2) | WealthManagement |
| — | Asset allocation model execution (advisory only) | WealthManagement |

#### Advisory Services (ADV Domain — Phase 2)

| Capability ID | Feature | Bounded Context |
|--------------|---------|----------------|
| ADV-COP-001 | Financial advisor client copilot workflows (draft reports, suitability, scenario stress) | AdvisoryServices |
| — | Suitability compliance verification (automated FRA suitability checks) | Compliance |
| — | Client report drafting copilot (Arabic first) | AdvisoryServices |
| — | Interactive scenario stress-testing (advisor client view) | AdvisoryServices |

#### Cross-Market Analysis (RES Domain — Phase 2)

| Capability ID | Feature | Bounded Context |
|--------------|---------|----------------|
| RES-SEC-002 | Cross-market spread analysis (EGX vs Tadawul/DFM/ADX, dual-listing spreads) | CrossMarketIntelligence |
| — | Intermarket analysis (lead-lag relationships, currency effect correlations) | CrossMarketIntelligence |
| — | GCC sector rotation (EGX + GCC cross-sector capital flow) | SectorIntelligence |

#### Paper Trading Simulation (Phase 2 — FRA Approval Required)

| Feature | Description |
|---------|-------------|
| Paper Portfolio Service | Virtual portfolios; AI recommendations applied as paper trades |
| Execution Simulator | EGX market impact, configurable slippage, circuit breaker rules, T+0 settlement |
| Performance Tracker | Daily paper NAV, rolling accuracy, EGX30TR benchmark |
| FRA Compliance Layer | All paper results INTERNAL ONLY until FRA written approval received |

#### Plugin Architecture & Marketplace

| Feature | Bounded Context |
|---------|----------------|
| Plugin registration & certification | PluginMarketplace |
| Third-party data provider plugins | PluginMarketplace |
| Third-party strategy plugins | PluginMarketplace |
| Plugin revenue share model | PluginMarketplace |
| First 10 certified plugins at launch | PluginMarketplace |

### 6.6 Multi-Region Architecture (Phase 2)

| Configuration | Details |
|--------------|---------|
| Primary Region | Cairo, Egypt (EGX data sovereignty, PDPL) |
| Secondary Region | Riyadh, Saudi Arabia (Tadawul, CMA) |
| Architecture | Active-Passive (Cairo primary, Riyadh standby → failover) |
| Data Partitioning | Egyptian user data: Cairo only; Saudi user data: Riyadh only |
| Replication | Patroni streaming replication + Kafka MirrorMaker 2 |
| RPO | 60 seconds |
| RTO | 5 minutes |

### 6.7 Success Metrics

| Metric | Target |
|--------|--------|
| GCC markets live | 4 (Tadawul, DFM/ADX, KSE, QSE) |
| Monthly Active Users | 500,000 |
| AI directional accuracy (17 schools) | ≥ 73% |
| Broker-connected users | ≥ 5,000 (Phase 2 EGX only) |
| Plugin marketplace providers | 10+ certified |
| Family Office clients | 50+ |

### 6.8 Risk Level

🔴 **HIGH** — Multi-jurisdiction regulatory licensing (CMA Saudi, SCA UAE), broker API integration, 17-school quorum recalibration, multi-region data residency compliance

---

## SECTION 7 — RELEASE 7.0 GLOBAL: GCC + GLOBAL PLATFORM

### 7.1 Release Vision

> **"The world's AI-powered Financial Operating System. Every Arab market. Every global market. Every investor."**

Release 7.0 completes the market expansion sequence by adding GCC markets
(Tadawul, DFM, ADX, KSE, QSE) as the fourth and final market step. Simultaneously,
Tradeora goes global — EU markets (MIFID II), autonomous financial agents (regulated,
human-in-the-loop), the Knowledge Operating System, Enterprise Memory Engine,
and collective intelligence from 1M+ anonymized user signals.

**Markets in R7.0 (5 total):**
1. ~~EGX + Forex~~ ✔ (since R2.0)
2. ~~Crypto~~ ✔ (since R5.0)
3. ~~US Stocks~~ ✔ (since R6.0)
4. **GCC Markets (NEW)**: Tadawul + DFM + ADX + KSE + QSE
5. **EU Markets (NEW)**: Selected MIFID II exchanges

### 7.2 Business Goals

1. **GCC Expansion**: Tadawul (Saudi), DFM+ADX (UAE), KSE (Kuwait), QSE (Qatar) — all live
2. Obtain CMA Saudi Arabia + SCA UAE + CMA Kuwait + QFMA Qatar licenses
3. Achieve 5,000,000 Monthly Active Users globally
4. Launch autonomous financial agents (FRA/CMA/SEC regulated, human-in-the-loop)
5. Activate collective intelligence (anonymized signals from 1M+ users)
6. White-label platform: 50+ banks and brokerages as enterprise clients
7. Train and deploy first Tradeora-proprietary financial language model
8. Launch Knowledge Operating System (Financial Knowledge Graph)

#### GCC Market Specifications (NEW IN R7.0)

| Exchange | Country | Instruments | Session (Local) | License Required |
|---------|---------|------------|-----------------|----------------|
| Tadawul | Saudi Arabia | 200+ | Sun–Thu 10:00–15:00 AST (UTC+3) | CMA Saudi |
| DFM | UAE (Dubai) | 60+ | Sun–Thu 10:00–14:00 GST (UTC+4) | SCA UAE |
| ADX | UAE (Abu Dhabi) | 70+ | Sun–Thu 10:00–14:50 GST (UTC+4) | SCA UAE |
| KSE | Kuwait | 100+ | Sun–Thu 09:30–12:30 AST (UTC+3) | CMA Kuwait |
| QSE | Qatar | 50+ | Sun–Thu 09:30–13:30 AST (UTC+3) | QFMA Qatar |

**Data Residency (GCC):** Saudi user data → Riyadh region. UAE user data → Dubai region.
**Language**: GCC markets are Arabic-first (already our default — zero additional localization cost).

### 7.3 Phase 3 Features

#### Autonomous Financial Agents (Regulated — Phase 3)

> ⚠️ Requires explicit regulatory approval from each jurisdiction (FRA, FCA, SEC).
> Autonomy is earned incrementally. Phase 1: Advisory. Phase 2: Semi-autonomous.
> Phase 3: Regulated autonomous (still human-in-the-loop for major decisions).

#### Knowledge Operating System

| Feature | Description |
|---------|-------------|
| Financial Knowledge Graph | EGX + GCC entity-relationship intelligence |
| Cross-entity relationship mapping | Companies, sectors, management, ownership, subsidiaries |
| Historical pattern library | Long-term EGX + MENA pattern database |
| Predictive knowledge synthesis | Forward-looking AI synthesis from structured knowledge |

#### Enterprise Memory Engine

| Feature | Description |
|---------|-------------|
| Cross-session learning | User investment patterns carried across sessions |
| Experience Graph | Hyper-personalized intelligence per user (1M+ user signals) |
| Collective intelligence | Anonymized aggregated signals improving entire ecosystem |
| Federated AI (Phase 4) | Models trained at edge without centralizing user data |

#### B2B Platform

| Feature | Description |
|---------|-------------|
| Whitelabel API platform | Banks and brokerages white-labeling Tradeora intelligence |
| Enterprise client management | Dedicated SLA, custom onboarding, dedicated infra |
| Multi-jurisdiction compliance engine | 15+ regulatory frameworks (FRA, CMA, SCA, QFMA, FCA, SEC, MAS) |
| Global plugin marketplace | 500+ certified plugins |

### 7.4 Multi-Region Architecture (Phase 3)

| Configuration | Details |
|--------------|---------|
| Regions | Cairo (Egypt) + Riyadh (Saudi) + Dubai (UAE) |
| Architecture | Active-Active-Active (write affinity per user home region) |
| Global CDN | Static assets globally cached |
| Target | 190+ markets, 50M+ users at Phase 4 horizon |

### 7.5 Risk Level

🔴 **VERY HIGH** — Multi-jurisdiction autonomous agent regulation, proprietary AI model training, global data privacy compliance, enterprise white-label complexity

---

## SECTION 8 — ANALYSIS METHODOLOGY COMPLETENESS VERIFICATION

Every analysis methodology required by the mission has been mapped to at least one
approved capability, AI school, or feature.

| Analysis Methodology | Approved Coverage | Release |
|---------------------|-----------------|---------|
| Technical Analysis | SCHOOL-03, MKT-DAT-003 (RSI, MACD, BB, ADX, Ichimoku) | R2.0–R7.0 |
| Fundamental Analysis | SCHOOL-02, RES-FND-001..003 (P/E, P/B, DCF) | R2.0–R7.0 |
| Price Action | SCHOOL-03 (price chart analysis) | R3.0–R7.0 |
| Smart Money Concepts (SMC) | SCHOOL-08 (Behavioral), SCHOOL-12 (Pattern) | R3.0–R7.0 |
| ICT (Inner Circle Trader) | SCHOOL-12 Pattern Recognition (price levels, liquidity) | R3.0–R7.0 |
| Wyckoff Method | SCHOOL-12 Pattern Recognition (accumulation/distribution phases) | R3.0–R7.0 |
| Elliott Wave Theory | SCHOOL-12 Pattern Recognition (wave counting) | R3.0–R7.0 |
| Volume Analysis | SCHOOL-01 (Market Intelligence, order book depth, volume) | R3.0–R7.0 |
| Order Flow Analysis | SCHOOL-01 (bid-ask, order book depth), SCHOOL-08 (herding) | R3.0–R7.0 |
| Market Structure | SCHOOL-01 + SCHOOL-03 (highs/lows, structure breaks) | R3.0–R7.0 |
| Supply & Demand | SCHOOL-01 + SCHOOL-12 (S/D zones) | R3.0–R7.0 |
| Liquidity Analysis | SCHOOL-01 (bid-ask spread, order book depth) | R3.0–R7.0 |
| Support & Resistance | SCHOOL-03 + SCHOOL-12 | R3.0–R7.0 |
| Trend Analysis | SCHOOL-03 (ADX, moving averages, Ichimoku trend) | R3.0–R7.0 |
| Candlestick Analysis | SCHOOL-12 Pattern Recognition (candlestick patterns) | R3.0–R7.0 |
| Fundamental Analysis | SCHOOL-02 + RES-FND-001..003 | R3.0–R7.0 |
| Macro Economics | SCHOOL-05, RES-MAC-001 (CBE, CPI, GDP, FX) | R3.0–R7.0 |
| News Intelligence | RES-MAC-002 + SCHOOL-04 (Arabic NLP) | R2.0–R7.0 |
| Sentiment Intelligence | SCHOOL-04 (Arabic BERT/CAMeL), RES-MAC-003 | R3.0–R7.0 |
| Sector Rotation | SCHOOL-09, RES-SEC-001 | R3.0–R7.0 |
| Intermarket Analysis | SCHOOL-05 + RES-SEC-002 (Phase 2) | R3.0→R6.0 |
| Economic Calendar | RES-MAC-001 (CBE dates, CAPMAS, EGX corporate actions) | R4.0–R7.0 |
| Pattern Recognition | SCHOOL-12 (CNN ML: H&S, double bottom, flags, channels) | R3.0–R7.0 |
| AI Arbitration | WisdomEngine (weighted voting, Brier, accuracy-adjusted) | R3.0–R7.0 |
| Meta Intelligence | Consensus Orchestrator + WisdomEngine meta-analysis | R3.0–R7.0 |
| Enterprise Memory | Enterprise Memory Engine (R5.0→R7.0) | R5.0–R7.0 |
| Knowledge OS | Knowledge Operating System (R7.0) | R7.0 |
| Enterprise Ecosystem Intelligence | Collective Intelligence (R7.0) | R7.0 |
| AI Capability Registry | 26 registered AI engines (SCHOOL-01..17 + 9 orchestration) | Architecture |
| Backtesting | Historical Backtesting Engine (internal, Rule 40) | R5.0 |
| Simulation | Monte Carlo + Paper Trading (R5.0 internal + R6.0 user-facing) | R5.0–R6.0 |
| Strategy Builder | AI-guided strategy construction (Phase 2 roadmap) | R6.0 |
| Strategy Marketplace | Plugin marketplace + strategy plugins | R6.0 |
| Portfolio Intelligence | Full portfolio analytics (TWR, alpha, VaR, drawdown, benchmark) | R4.0–R7.0 |
| Risk Intelligence | VaR, Sharpe, Sortino, Calmar, sector concentration, stress test | R4.0–R7.0 |
| Position Sizing | Risk-adjusted position sizing (Decimal arithmetic) | R4.0–R7.0 |
| ESG Analysis | SCHOOL-15 (Sharia screen + ESG scoring) | R6.0–R7.0 |
| Options Flow | SCHOOL-13 (put/call ratio, IV) | R6.0–R7.0 |
| Quantitative Models | SCHOOL-06 (mean-reversion, momentum, Fama-French EGX) | R3.0–R7.0 |
| Earnings Quality | SCHOOL-11 (accruals, revenue quality, cash conversion) | R3.0–R7.0 |
| Peer Comparison | SCHOOL-10 (Qdrant vector similarity) | R3.0–R7.0 |
| Behavioral Finance | SCHOOL-08 (herding, disposition, overreaction) | R3.0–R7.0 |
| Risk-Adjusted Return | SCHOOL-07 (Sharpe, Sortino, Calmar, VaR 99%) | R3.0–R7.0 |

---

## SECTION 9 — CROSS-CUTTING CAPABILITIES BY RELEASE

| Capability ID | Feature | R1 | R2 | R3 | R4 | R5 | R6 | R7 |
|--------------|---------|----|----|----|----|----|----|-----|
| XCC-AUTH-001 | User Identity Authentication | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| XCC-AUTH-002 | Role-Based Authorization | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| XCC-AUD-001 | Immutable Audit Logging | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| XCC-AUD-002 | Audit Trail Inquiry & Reporting | — | — | — | ✅ | ✅ | ✅ | ✅ |
| XCC-NTF-001 | Multi-Channel Notification Dispatch | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| XCC-NTF-002 | Notification Preference Governance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| XCC-LOC-001 | Dynamic Text Language Translation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| XCC-LOC-002 | Locale Number & Date Formatting | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| XCC-LOC-003 | RTL View Formatting | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| XCC-SCH-001 | Cross-Domain Universal Search | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| XCC-SCH-002 | Deep Financial Document Search | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| XCC-OPS-001 | Dynamic Feature Toggle Governance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| XCC-OPS-002 | Centralized System Parameter Governance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## SECTION 10 — ROADMAP TRACEABILITY & FREEZE CERTIFICATE

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  MASTER RELEASE ROADMAP TRACEABILITY & FREEZE CERTIFICATE                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Certificate ID                       : TRD-CERT-ROADMAP-FREEZE-v1.2-2026-0724║
║  Status                               : ✅ PERMANENTLY FROZEN                ║
║  Total BCM L3 Capabilities (Phase 1)  : 44 of 44 — 100% mapped              ║
║  Total BCM L3 Capabilities (Phase 2)  : 4 of 4 — 100% mapped                ║
║  Total XCC Capabilities               : 13 of 13 — 100% mapped              ║
║  Total AI Schools                     : 17 of 17 — 100% mapped              ║
║  Total AI Orchestration Engines       : 9 of 9 — 100% mapped                ║
║  Total Vertical Slices (Phase 1)      : 12 of 12 — 100% mapped              ║
║  Total Sagas                          : 6 of 6 — 100% mapped                ║
║  Total Analysis Methodologies         : 40 of 40 — 100% mapped              ║
║  Market Expansion Sequence            : EGX+Forex → Crypto → US → GCC+Global ║
║  Features Invented (unauthorized)     : 0 — ZERO                            ║
║  Features Omitted (from approved set) : 0 — ZERO                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  FREEZE DECLARATION                                                          ║
║  The Master Release Roadmap is PERMANENTLY FROZEN at Version 1.2.0.          ║
║  No feature additions, deletions, re-scoping, or market sequence changes are ║
║  permitted without formal Enterprise Change Request (ECR) board approval.     ║
║  Baseline Reference : ARCHITECTURE FREEZE v1.2 FINAL (TRD-CERT-FREEZE-v1.2)║
║  Issued by          : Chief Product Officer + Enterprise Solution Architect ║
║                       + AI Strategy Director + Program Manager               ║
║  Date               : 2026-07-24                                             ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

*Tradeora Financial Operating System — Master Release Roadmap — Version 1.2.0 FROZEN*
*All features extracted from approved architecture documents. No feature invented. No feature omitted. LOCKED.*
