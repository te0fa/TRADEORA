# TRADEORA BUSINESS CAPABILITY MODEL

**Document Reference:** `docs/BUSINESS_CAPABILITY_MODEL.md`  
**Version:** 1.0.0  
**Status:** CANONICAL BUSINESS CAPABILITY SPECIFICATION  
**Effective Date:** July 21, 2026  
**Governance Authority:** Architecture Governance Board & Enterprise Business Architecture Board  
**Framework Alignment:** TOGAF ADM Phase B (Business Architecture)  
**Governed By:** `docs/PROJECT_CONSTITUTION.md`  
**Subordinate To:** `docs/PROJECT_CONSTITUTION.md` & `docs/BUSINESS_DOMAIN_DISCOVERY.md`  
**Supersedes:** `docs/BUSINESS_DOMAIN_DISCOVERY.md` Section 4 (Preliminary Capability List)

---

## SECTION 1 — CAPABILITY FRAMEWORK AND STANDARDS

### 1.1 Capability Modeling Principles for Tradeora

This document defines the authoritative **Business Capability Model** for Tradeora, operating under the TOGAF (The Open Group Architecture Framework) ADM Phase B Business Architecture standard. A business capability represents a stable, fundamental ability that Tradeora possesses to achieve a specific business outcome. Capabilities answer the foundational enterprise architecture question: **"What can Tradeora do?"** completely decoupled from **"How will it do it?"**, **"Who will build it?"**, or **"What technology will power it?"**.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                      THREE-LEVEL CAPABILITY HIERARCHY                     │
├───────────────────────────────────────────────────────────────────────────┤
│ LEVEL 1 (L1) — CAPABILITY DOMAIN                                          │
│ Top-level structural grouping representing a broad business domain.      │
│ Example: MKT — Market Intelligence                                        │
├───────────────────────────────────────────────────────────────────────────┤
│ LEVEL 2 (L2) — CAPABILITY AREA                                            │
│ Cohesive operational grouping of related business abilities within L1.    │
│ Example: MKT-DAT — Market Data Management                                 │
├───────────────────────────────────────────────────────────────────────────┤
│ LEVEL 3 (L3) — ATOMIC BUSINESS CAPABILITY                                 │
│ Granular, atomic business ability satisfying strict atomicity criteria.    │
│ Example: MKT-DAT-001 — Real-Time Market Data Ingestion                   │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Key Architecture Principles:
1. **Technology Neutrality**: Capabilities are modeled purely in business terms. No capability entry may reference software technologies, database engines, network protocols, programming languages, cloud vendors, or architectural deployment patterns. Technologies change rapidly; business capabilities persist over decades.
2. **Domain Boundary Alignment**: Every top-level (L1) capability domain aligns strictly to the Bounded Context Domain Boundaries established in `docs/BUSINESS_DOMAIN_DISCOVERY.md` Section 18.
3. **Ubiquitous Language Compliance**: All capability names, input descriptions, output expectations, and entity references use canonical terminology defined in `docs/UBIQUITOUS_LANGUAGE.md`. Forbidden synonyms are strictly excluded.
4. **Cross-Cutting vs. Domain Differentiation**: Domain capabilities reflect specific functional capabilities owned by business domains. Cross-Cutting Capabilities (Section 4) represent shared, foundational abilities that serve multiple domains simultaneously.
5. **Governance of Future Capabilities**: Capabilities designated for future strategic horizons (Phase 2 MENA expansion or Phase 3 Global scale) are fully cataloged, assigned permanent IDs, and governed under identical evolutionary rules to Phase 1 capabilities.
6. **Heat Map Prioritization**: The Capability Heat Map (Section 5) translates capability criticality and strategic importance into explicit investment posture decisions to guide resource allocation.

---

### 1.2 Capability Classification System

Every capability in this model is classified according to five standardized architecture dimensions:

#### STRATEGIC IMPORTANCE
* **Core Differentiating**: Proprietary business capabilities that create Tradeora's unique competitive advantage in the capital markets intelligence space.
* **Core Enabling**: Essential capabilities required to deliver core value propositions, though not inherently unique to Tradeora.
* **Supporting**: Necessary operational support capabilities required for business execution and administrative continuity.
* **Generic/Commodity**: Standard industry capabilities where commercial off-the-shelf or external service sourcing is favored over custom build.

#### CURRENT STATE
* **Phase 1**: Operational target for the Egyptian Exchange (EGX) initial commercial launch.
* **Phase 2**: Operational target for MENA regional market expansion.
* **Phase 3**: Operational target for global market scale and multi-asset class expansion.
* **Future**: Long-term strategic capability planned beyond Phase 3.

#### BUSINESS CRITICALITY
* **Mission Critical**: Severe system failure or total operational halt if this capability is absent; platform cannot function.
* **Business Critical**: Significant business degradation or core value destruction if missing; major commercial impact.
* **Operationally Important**: Operational inconvenience or localized workflow degradation if missing; manageable workarounds exist.
* **Nice to Have**: Incremental value addition; absence causes minimal operational friction.

#### INVESTMENT POSTURE
* **Invest Heavily**: Allocate maximum capital and strategic focus to build market-leading, proprietary edge.
* **Invest Adequately**: Maintain at industry-standard quality and high operational reliability.
* **Optimize**: Streamline operational costs while sustaining baseline quality metrics.
* **Tolerate**: Maintain existing operational baseline without immediate expansion capital.
* **Eliminate**: Phase out or replace over time due to redundancy or deprecation.

#### CAPABILITY STATUS
* **Planned**: Formally defined in the model but not yet operational in production.
* **Active**: Implemented, verified, and operational in production environments.
* **Deprecated**: Currently operational but scheduled for retirement under an approved transition plan.
* **Retired**: Permanently removed from active operational use; historical ID and record preserved.

---

### 1.3 Capability ID Convention

The **Capability ID** is the permanent, immutable identifier assigned to every L3 and Cross-Cutting capability.

```
FORMAT: [L1-CODE]-[L2-CODE]-[NNN]
Examples: MKT-DAT-001 | RES-EQR-003 | AI-REC-002 | XCC-AUTH-001
```

#### Binding Identifier Rules:
* **Rule ID-01**: Once assigned, a Capability ID NEVER changes under any circumstance.
* **Rule ID-02**: Capability IDs are never recycled, reassigned, or reused after capability retirement.
* **Rule ID-03**: Renaming a capability or updating its business definition does not alter its assigned Capability ID.
* **Rule ID-04**: Splitting a capability retires the parent ID (Status: `Retired`, Reason: `SPLIT`) and assigns new sequential IDs to child capabilities.
* **Rule ID-05**: Merging capabilities retires all source IDs (Status: `Retired`, Reason: `MERGED-INTO [NEW-ID]`) and assigns a new unique ID to the merged entity.

---

## SECTION 2 — L1 CAPABILITY MAP (Top-Level Domains)

Tradeora's business capability taxonomy is structured across 14 top-level (L1) Capability Domains.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                       TRADEORA L1 CAPABILITY MAP                          │
├──────────────────────────┬──────────────────────────┬─────────────────────┤
│ MKT: Market Intelligence │ RES: Financial Research  │ AI: AI & Decision   │
├──────────────────────────┼──────────────────────────┼─────────────────────┤
│ PRT: Portfolio Mgmt      │ RSK: Risk Management     │ ENG: Engagement     │
├──────────────────────────┼──────────────────────────┼─────────────────────┤
│ IDN: Identity & User     │ ENT: Subscriptions       │ RPT: Reporting      │
├──────────────────────────┼──────────────────────────┼─────────────────────┤
│ OPS: Operations & Gov    │ LOC: Localization        │ EXC: Trade Exec (F) │
├──────────────────────────┴──────────────────────────┴─────────────────────┤
│ WLT: Wealth Management (F)  │  ADV: Advisory Services (F)                 │
└───────────────────────────────────────────────────────────────────────────┘
```

### 1. Market Intelligence Domain
* **NAME**: Market Intelligence
* **ARABIC NAME**: بيانات ومعلومات السوق
* **CODE**: `MKT`
* **DEFINITION**: The ability to acquire, normalize, validate, structure, and distribute multi-asset market data, price ticks, order book depth, corporate action logs, and exchange trading calendars across global financial venues.
* **STRATEGIC IMPORTANCE**: Core Enabling
* **BUSINESS CRITICALITY**: Mission Critical
* **ALIGNS TO DOMAIN BOUNDARY**: Market Data Domain & Market Calendar Domain
* **CURRENT STATE**: Phase 1
* **JUSTIFICATION**: Serves as the foundational data prerequisite for all pricing, analytics, portfolio tracking, and AI decision models across Tradeora.

### 2. Financial Research Domain
* **NAME**: Financial Research
* **ARABIC NAME**: البحوث المالية والتحليل
* **CODE**: `RES`
* **DEFINITION**: The ability to standardize, analyze, model, and evaluate fundamental corporate financial statements, earnings releases, macroeconomic series, industry sector metrics, and public news sentiment in Arabic and English.
* **STRATEGIC IMPORTANCE**: Core Differentiating
* **BUSINESS CRITICALITY**: Business Critical
* **ALIGNS TO DOMAIN BOUNDARY**: Financial Research Domain
* **CURRENT STATE**: Phase 1
* **JUSTIFICATION**: Transforms raw disclosures and news into structured financial intelligence, valuation models (DCF), and fair-value baselines.

### 3. AI and Decision Intelligence Domain
* **NAME**: AI and Decision Intelligence
* **ARABIC NAME**: الذكاء الاصطناعي ودعم القرارات
* **CODE**: `AI`
* **DEFINITION**: The ability to synthesize personalized, explainable, risk-adjusted investment recommendations, quantitative market signals, research summaries, and cognitive analytics accompanied by mandatory confidence scoring and downside risk disclosures.
* **STRATEGIC IMPORTANCE**: Core Differentiating
* **BUSINESS CRITICALITY**: Mission Critical
* **ALIGNS TO DOMAIN BOUNDARY**: AI Intelligence Domain
* **CURRENT STATE**: Phase 1
* **JUSTIFICATION**: Represents Tradeora's central intelligence engine, delivering explainable decision augmentation to investors and financial professionals.

### 4. Portfolio Management Domain
* **NAME**: Portfolio Management
* **ARABIC NAME**: إدارة المحافظ الاستثمارية
* **CODE**: `PRT`
* **DEFINITION**: The ability to construct, track, value, analyze, and attribute multi-asset investment portfolios across global currencies, historical transaction ledgers, and benchmark indices.
* **STRATEGIC IMPORTANCE**: Core Enabling
* **BUSINESS CRITICALITY**: Mission Critical
* **ALIGNS TO DOMAIN BOUNDARY**: Portfolio Domain
* **CURRENT STATE**: Phase 1
* **JUSTIFICATION**: Establishes the authoritative user ledger for wealth tracking, performance evaluation (TWR/MWR), position accounting, and benchmark comparison.

### 5. Risk Management Domain
* **NAME**: Risk Management
* **ARABIC NAME**: إدارة المخاطر
* **CODE**: `RSK`
* **DEFINITION**: The ability to evaluate, stress-test, quantify, and monitor user risk profiles, portfolio Value-at-Risk (VaR), drawdown metrics, sector concentration limits, and correlation exposure.
* **STRATEGIC IMPORTANCE**: Core Differentiating
* **BUSINESS CRITICALITY**: Mission Critical
* **ALIGNS TO DOMAIN BOUNDARY**: Risk Domain
* **CURRENT STATE**: Phase 1
* **JUSTIFICATION**: Protects user capital through mathematical risk quantification and continuous risk threshold monitoring.

### 6. User Engagement and Notification Domain
* **NAME**: User Engagement and Notification
* **ARABIC NAME**: التفاعل والتنبيهات
* **CODE**: `ENG`
* **DEFINITION**: The ability to evaluate alert conditions, filter market noise, and dispatch multi-channel localized notifications regarding price thresholds, risk breaches, AI recommendations, and watchlist events.
* **STRATEGIC IMPORTANCE**: Supporting
* **BUSINESS CRITICALITY**: Business Critical
* **ALIGNS TO DOMAIN BOUNDARY**: Alert and Notification Domain
* **CURRENT STATE**: Phase 1
* **JUSTIFICATION**: Delivers real-time proactive communication to keep users informed of critical market developments and portfolio events.

### 7. User and Identity Management Domain
* **NAME**: User and Identity Management
* **ARABIC NAME**: إدارة المستخدمين والهوية
* **CODE**: `IDN`
* **DEFINITION**: The ability to onboard, verify, profile, authenticate, and manage user identities, security preferences, locale settings, and financial risk questionnaires.
* **STRATEGIC IMPORTANCE**: Supporting
* **BUSINESS CRITICALITY**: Mission Critical
* **ALIGNS TO DOMAIN BOUNDARY**: User and Identity Domain
* **CURRENT STATE**: Phase 1
* **JUSTIFICATION**: Manages user identity lifecycle, access permissions, legal risk profiling, and personal account settings.

### 8. Subscription and Entitlement Domain
* **NAME**: Subscription and Entitlement
* **ARABIC NAME**: الاشتراكات والصلاحيات
* **CODE**: `ENT`
* **DEFINITION**: The ability to define commercial subscription tiers, manage user billing cycles, enforce feature access entitlements, track API quota allocations, and manage commercial licensing rules.
* **STRATEGIC IMPORTANCE**: Supporting
* **BUSINESS CRITICALITY**: Mission Critical
* **ALIGNS TO DOMAIN BOUNDARY**: Subscription and Entitlement Domain
* **CURRENT STATE**: Phase 1
* **JUSTIFICATION**: Governs platform commercial monetization, user tier access, and vendor data redistribution compliance.

### 9. Reporting and Export Domain
* **NAME**: Reporting and Export
* **ARABIC NAME**: التقارير والتصدير
* **CODE**: `RPT`
* **DEFINITION**: The ability to compile, format, generate, and export publication-ready portfolio statements, equity research documents, tax records, and compliance audit summaries.
* **STRATEGIC IMPORTANCE**: Supporting
* **BUSINESS CRITICALITY**: Operationally Important
* **ALIGNS TO DOMAIN BOUNDARY**: Reporting Domain
* **CURRENT STATE**: Phase 1
* **JUSTIFICATION**: Enables external documentation, client reporting, regulatory filings, and tax reporting.

### 10. Platform Operations and Governance Domain
* **NAME**: Platform Operations and Governance
* **ARABIC NAME**: العمليات والحوكمة
* **CODE**: `OPS`
* **DEFINITION**: The ability to govern system configurations, monitor operational health, manage feature flags, maintain audit trails, and enforce security policies.
* **STRATEGIC IMPORTANCE**: Supporting
* **BUSINESS CRITICALITY**: Mission Critical
* **ALIGNS TO DOMAIN BOUNDARY**: Administration and Audit Domain
* **CURRENT STATE**: Phase 1
* **JUSTIFICATION**: Guarantees platform stability, regulatory auditability, operational compliance, and security governance.

### 11. Localization and Accessibility Domain
* **NAME**: Localization and Accessibility
* **ARABIC NAME**: التوطين وسهولة الاستخدام
* **CODE**: `LOC`
* **DEFINITION**: The ability to format dynamic text, currencies, numbers, dates (Gregorian/Hijri), and Right-to-Left (RTL) layouts natively in Arabic and English across all user experiences.
* **STRATEGIC IMPORTANCE**: Core Differentiating
* **BUSINESS CRITICALITY**: Mission Critical
* **ALIGNS TO DOMAIN BOUNDARY**: Localization and Internationalization Domain
* **CURRENT STATE**: Phase 1
* **JUSTIFICATION**: Provides native Arabic-first financial intelligence parity to bridge regional market opacity across MENA.

### 12. Trade Execution Domain (Future)
* **NAME**: Trade Execution
* **ARABIC NAME**: تنفيذ التداولات
* **CODE**: `EXC`
* **DEFINITION**: The ability to validate order parameters, route orders to licensed external execution venues via Smart Order Routing (SOR), and track order lifecycle states.
* **STRATEGIC IMPORTANCE**: Core Enabling
* **BUSINESS CRITICALITY**: Operationally Important
* **ALIGNS TO DOMAIN BOUNDARY**: Execution Domain (Future)
* **CURRENT STATE**: Phase 2
* **JUSTIFICATION**: Planned for Phase 2 to enable seamless broker-integrated order routing following user authorization.

### 13. Wealth Management Domain (Future)
* **NAME**: Wealth Management
* **ARABIC NAME**: إدارة الثروات
* **CODE**: `WLT`
* **DEFINITION**: The ability to generate tax-aware portfolio rebalancing plans, track private non-public assets, manage multi-generational family wealth accounts, and execute asset allocation models.
* **STRATEGIC IMPORTANCE**: Core Differentiating
* **BUSINESS CRITICALITY**: Operationally Important
* **ALIGNS TO DOMAIN BOUNDARY**: Wealth Management Domain (Future)
* **CURRENT STATE**: Phase 2
* **JUSTIFICATION**: Expands platform utility to high-net-worth individuals, family offices, and institutional wealth managers in Phase 2.

### 14. Advisory Services Domain (Future)
* **NAME**: Advisory Services
* **ARABIC NAME**: الاستشارات المالية
* **CODE**: `ADV`
* **DEFINITION**: The ability to equip licensed financial advisors with client management portals, automated suitability compliance verification, interactive scenario stress-testing, and client report drafting copilots.
* **STRATEGIC IMPORTANCE**: Core Differentiating
* **BUSINESS CRITICALITY**: Operationally Important
* **ALIGNS TO DOMAIN BOUNDARY**: Advisory Domain (Future)
* **CURRENT STATE**: Phase 2
* **JUSTIFICATION**: Powers B2B financial advisor and wealth management operations across regional financial institutions in Phase 2.

---

## SECTION 3 — FULL CAPABILITY HIERARCHY (L1 → L2 → L3)

This section documents the full business capability hierarchy. Every L3 capability entry strictly adheres to the mandated 18-field metadata block.

```
TOTAL CAPABILITIES DEFINED: 84 L3 Atomic Capabilities across 14 L1 Domains.
Every L3 capability passes the mandatory L3 Atomicity Test.
```

---

### DOMAIN 1: MKT — Market Intelligence (بيانات ومعلومات السوق)

#### L2 Area: MKT-DAT — Market Data Ingestion & Distribution

─────────────────────────────────────────
CAPABILITY ID: MKT-DAT-001
CANONICAL NAME: Real-Time Market Data Ingestion
ARABIC NAME: استيعاب بيانات السوق لحظياً
─────────────────────────────────────────
DEFINITION: The ability to acquire, parse, and validate real-time price ticks, bid-ask quotes, order book depth snapshots, and trading volumes from financial exchanges and licensed data vendors.
BUSINESS VALUE: Guarantees continuous, verified baseline market pricing for all downstream analytics, valuation models, and user views.
CAPABILITY CONSUMERS: System, Active Trader, Portfolio Manager, Risk Evaluator.
BUSINESS INPUTS: Raw exchange tick streams, vendor quote payloads, instrument identifiers.
BUSINESS OUTPUTS: Validated price tick records, updated order book snapshots, trade volume totals.
DEPENDENCIES: MKT-CAL-001, MKT-SEC-001.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard market data capability required by financial intelligence systems.
EGX-SPECIFIC NOTES: Ingests EGX ticker feeds via licensed vendor integrations following local exchange data formats.
REGULATORY CONSIDERATIONS: Requires compliance with FRA exchange data licensing agreements and redistribution rules.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: MKT-DAT-002
CANONICAL NAME: Market Data Distribution
ARABIC NAME: توزيع بيانات السوق
─────────────────────────────────────────
DEFINITION: The ability to format, normalize, and stream validated market price feeds, aggregated quotes, and historical price bars to platform analytical services and client interfaces.
BUSINESS VALUE: Delivers tailored, low-latency market visibility to users and downstream analytical engines based on subscription rights.
CAPABILITY CONSUMERS: All User Profiles, Screening Engine, Alert Engine.
BUSINESS INPUTS: Validated price ticks, historical price series, user subscription entitlement rules.
BUSINESS OUTPUTS: Normalized quote streams, intraday OHLCV bars, price update notifications.
DEPENDENCIES: MKT-DAT-001, ENT-SUB-001.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — foundational distribution capability.
EGX-SPECIFIC NOTES: Enforces 15-minute delay rules for free tier viewers per EGX market data licensing guidelines.
REGULATORY CONSIDERATIONS: Enforces strict data entitlement boundaries to prevent unauthorized market data redistribution.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: MKT-DAT-003
CANONICAL NAME: Technical Indicator Computation
ARABIC NAME: حساب المؤشرات الفنية
─────────────────────────────────────────
DEFINITION: The ability to compute price momentum metrics, volatility indicators, volume distribution scores, and moving average clusters across arbitrary timeframes.
BUSINESS VALUE: Converts raw price streams into actionable technical indicators to assist active traders and quantitative strategy models.
CAPABILITY CONSUMERS: Active Trader, Quantitative Analyst, Portfolio Manager.
BUSINESS INPUTS: Historical OHLCV price series, indicator parameter parameters.
BUSINESS OUTPUTS: Technical indicator values (RSI, MACD, Bollinger Bands, Moving Averages), trend status flags.
DEPENDENCIES: MKT-DAT-002.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard quantitative technical analysis capability.
EGX-SPECIFIC NOTES: Calculates technical indicators for all EGX listed equities and indices.
REGULATORY CONSIDERATIONS: Technical indicators are quantitative metrics and do not constitute individual advice.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

#### L2 Area: MKT-SEC — Security Master Management

─────────────────────────────────────────
CAPABILITY ID: MKT-SEC-001
CANONICAL NAME: Security Master Registry Management
ARABIC NAME: إدارة السجل الرئيسي للأوراق المالية
─────────────────────────────────────────
DEFINITION: The ability to maintain an authoritative single source of truth reference database for instrument definitions, ISIN mappings, ticker symbols, asset classifications, and exchange listings.
BUSINESS VALUE: Eliminates cross-market ticker ambiguity and ensures accurate asset identification across global exchanges.
CAPABILITY CONSUMERS: System, All User Profiles, Data Engineers.
BUSINESS INPUTS: Exchange reference files, vendor master listings, ISIN directory updates.
BUSINESS OUTPUTS: Canonical Instrument master records, asset classification mappings, ticker resolution tables.
DEPENDENCIES: None (Foundational capability).
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — essential reference data registry capability.
EGX-SPECIFIC NOTES: Maps local EGX ticker symbols (e.g., COMI) to international ISIN codes (e.g., EGS60121C018).
REGULATORY CONSIDERATIONS: Ensures legal instrument identification compliant with international ISO 6166 standards.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: MKT-SEC-002
CANONICAL NAME: Corporate Action Tracking
ARABIC NAME: تتبع إجراءات الشركات
─────────────────────────────────────────
DEFINITION: The ability to detect, record, and validate corporate announcements including cash dividends, stock splits, bonus shares, rights issues, and mergers.
BUSINESS VALUE: Preserves historical price chart continuity and enables accurate historical return calculations following capital adjustments.
CAPABILITY CONSUMERS: Long-Term Investor, Portfolio Manager, Compliance Officer.
BUSINESS INPUTS: Official exchange corporate disclosures, vendor corporate action feeds.
BUSINESS OUTPUTS: Verified CorporateAction records, ex-date adjustments, historical price multiplier factors.
DEPENDENCIES: MKT-SEC-001.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — critical corporate action tracking capability.
EGX-SPECIFIC NOTES: Captures official EGX corporate action announcements and MCSD record date schedules.
REGULATORY CONSIDERATIONS: Requires accurate tracking compliant with FRA disclosure rules.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

#### L2 Area: MKT-CAL — Market Calendar Management

─────────────────────────────────────────
CAPABILITY ID: MKT-CAL-001
CANONICAL NAME: Exchange Trading Calendar Management
ARABIC NAME: إدارة تقويم التداول بالبورصة
─────────────────────────────────────────
DEFINITION: The ability to maintain authoritative operational schedules, trading session hours, auction windows, and holiday closures for global financial exchanges.
BUSINESS VALUE: Enforces session-awareness across data ingestion streams, AI recommendation generation, and notification timing.
CAPABILITY CONSUMERS: System, All User Profiles.
BUSINESS INPUTS: Official exchange calendar publications, regulatory holiday notices.
BUSINESS OUTPUTS: Authoritative MarketCalendar objects, trading session status flags, holiday schedule tables.
DEPENDENCIES: None (Foundational capability).
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — essential operational calendar capability.
EGX-SPECIFIC NOTES: Manages EGX official trading week (Sunday-Thursday), Islamic holidays (Hijri-based), and session windows.
REGULATORY CONSIDERATIONS: Ensures system operates in full alignment with official exchange trading hours.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: MKT-CAL-002
CANONICAL NAME: Circuit Breaker Tracking
ARABIC NAME: تتبع آليات الإيقاف المؤقت
─────────────────────────────────────────
DEFINITION: The ability to monitor, record, and flag temporary trading halts and price limit breaches imposed by exchange circuit breaker mechanisms.
BUSINESS VALUE: Prevents invalid signal generation and suppresses automated recommendation notifications during market halt states.
CAPABILITY CONSUMERS: Active Trader, Risk Evaluator, Alert Engine.
BUSINESS INPUTS: Exchange session status feeds, real-time price tick variations.
BUSINESS OUTPUTS: Active trading halt status flags, circuit breaker event logs.
DEPENDENCIES: MKT-DAT-001, MKT-CAL-001.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard market circuit breaker monitoring capability.
EGX-SPECIFIC NOTES: Tracks EGX 5% individual stock temporary halts (10 mins) and EGX100 5% market-wide halts (30 mins).
REGULATORY CONSIDERATIONS: Aligned directly with FRA market volatility interruption rules.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

---

### DOMAIN 2: RES — Financial Research (البحوث المالية والتحليل)

#### L2 Area: RES-FND — Fundamental Financial Analysis

─────────────────────────────────────────
CAPABILITY ID: RES-FND-001
CANONICAL NAME: Financial Statement Standardization
ARABIC NAME: نمذجة ومعايرة القوائم المالية
─────────────────────────────────────────
DEFINITION: The ability to extract, normalize, and standardize corporate balance sheets, income statements, and cash flow statements across diverse accounting standards.
BUSINESS VALUE: Eliminates manual spreadsheet data entry by providing instant, comparable financial statement data.
CAPABILITY CONSUMERS: Researcher/Analyst, Long-Term Investor, Fund Manager.
BUSINESS INPUTS: Raw corporate financial disclosures (PDF/XBRL), financial reporting packages.
BUSINESS OUTPUTS: Normalized FinancialStatement objects, standard ratio inputs, growth trends.
DEPENDENCIES: MKT-SEC-001.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — native bilingual extraction engine designed for Egyptian Accounting Standards (EAS) and IFRS filings.
EGX-SPECIFIC NOTES: Normalizes Arabic PDF financial filings published by EGX listed corporations into standardized financial models.
REGULATORY CONSIDERATIONS: Adheres strictly to IFRS and EAS financial reporting definitions.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: RES-FND-002
CANONICAL NAME: Earnings Intelligence Parsing
ARABIC NAME: تحلیل تقارير الأرباح
─────────────────────────────────────────
DEFINITION: The ability to parse quarterly earnings filings and call notes to extract revenue surprises, margin trends, and guidance modifications.
BUSINESS VALUE: Reduces time-to-insight following earnings releases from hours to seconds.
CAPABILITY CONSUMERS: Active Trader, Long-Term Investor, Research Analyst.
BUSINESS INPUTS: Corporate earnings disclosures, consensus analyst estimates.
BUSINESS OUTPUTS: Earnings surprise metrics, guidance modification flags, summary payloads.
DEPENDENCIES: RES-FND-001.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — specialized in Arabic earnings document parsing for MENA markets.
EGX-SPECIFIC NOTES: Extracts key metrics from EGX quarterly disclosure statements within minutes of release.
REGULATORY CONSIDERATIONS: Uses publicly disclosed corporate data exclusively.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: RES-FND-003
CANONICAL NAME: Fair Value DCF Modeling
ARABIC NAME: نمذجة التدفقات النقدية المخصومة للقيمة العادلة
─────────────────────────────────────────
DEFINITION: The ability to compute mathematical Discounted Cash Flow (DCF) fair-value estimates and sensitivity matrices for listed assets based on fundamental cash flow projections.
BUSINESS VALUE: Provides objective baseline mathematical valuations to help investors identify over/undervalued securities.
CAPABILITY CONSUMERS: Long-Term Investor, Portfolio Manager, Research Analyst.
BUSINESS INPUTS: Normalized financial statements, discount rate assumptions, growth projections.
BUSINESS OUTPUTS: FairValueModel objects, fair-value per share amounts, sensitivity matrix tables.
DEPENDENCIES: RES-FND-001.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — fully explainable DCF modeling engine with transparent assumption disclosures.
EGX-SPECIFIC NOTES: Incorporates EGP discount rates and local macroeconomic inflation expectations into valuation models.
REGULATORY CONSIDERATIONS: Discloses valuation models as mathematical calculations, not guaranteed price targets.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

#### L2 Area: RES-MAC — Macroeconomic & News Intelligence

─────────────────────────────────────────
CAPABILITY ID: RES-MAC-001
CANONICAL NAME: Economic Indicator Tracking
ARABIC NAME: تتبع المؤشرات الاقتصادية الكلية
─────────────────────────────────────────
DEFINITION: The ability to track national and international macroeconomic series including inflation rates, interest rates, GDP growth, foreign exchange reserves, and trade balances.
BUSINESS VALUE: Provides macroeconomic context to contextualize asset pricing and systemic risk factors.
CAPABILITY CONSUMERS: Fund Manager, Wealth Advisor, Portfolio Manager.
BUSINESS INPUTS: Central bank publications, national statistical agency releases, macro data feeds.
BUSINESS OUTPUTS: Macroeconomic indicator series, inflation rate trends, interest rate curve objects.
DEPENDENCIES: None.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard macroeconomic data tracking capability.
EGX-SPECIFIC NOTES: Tracks Central Bank of Egypt (CBE) interest rate decisions, CAPMAS CPI inflation figures, and Treasury bill yields.
REGULATORY CONSIDERATIONS: Uses official public statistical sources.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: RES-MAC-002
CANONICAL NAME: Financial News Media Ingestion
ARABIC NAME: استيعاب الأخبار والوسائط المالية
─────────────────────────────────────────
DEFINITION: The ability to aggregate, tag, and organize financial news articles, press releases, and regulatory disclosures in Arabic and English.
BUSINESS VALUE: Filters media noise and associates relevant news coverage directly with listed assets and sectors.
CAPABILITY CONSUMERS: Active Trader, Beginner Investor, Research Analyst.
BUSINESS INPUTS: Financial news wire feeds, press agency releases, regulatory announcement streams.
BUSINESS OUTPUTS: Tagged NewsItem objects, asset reference linkages, media category labels.
DEPENDENCIES: MKT-SEC-001.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — dual-language financial media processing tailored for Arab capital markets.
EGX-SPECIFIC NOTES: Ingests EGX corporate disclosures and major Egyptian financial publications.
REGULATORY CONSIDERATIONS: Complies with news copyright and media attribution guidelines.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: RES-MAC-003
CANONICAL NAME: News Sentiment Scoring
ARABIC NAME: قياس انطباعات وتحليلات الأخبار
─────────────────────────────────────────
DEFINITION: The ability to compute quantitative sentiment polarity and subjectivity scores for financial news coverage in Arabic and English.
BUSINESS VALUE: Quantifies qualitative market narrative shifts to measure news impact on market pricing.
CAPABILITY CONSUMERS: Active Trader, Portfolio Manager, AI Recommendation Engine.
BUSINESS INPUTS: Tagged NewsItem objects, language context lexicons.
BUSINESS OUTPUTS: SentimentScore objects, entity sentiment trends, aggregate polarity ratings.
DEPENDENCIES: RES-MAC-002.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — native Arabic financial Natural Language Processing (NLP) sentiment engine.
EGX-SPECIFIC NOTES: Analyzes Arabic sentiment for Egyptian market news and local corporate disclosures.
REGULATORY CONSIDERATIONS: Sentiment scores represent quantitative media analysis, not trading advice.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

#### L2 Area: RES-SEC — Sector & Cross-Market Intelligence

─────────────────────────────────────────
CAPABILITY ID: RES-SEC-001
CANONICAL NAME: Sector Heatmap Aggregation
ARABIC NAME: تجميع الخرائط الحرارية للقطاعات
─────────────────────────────────────────
DEFINITION: The ability to aggregate individual asset metrics into industry sector heatmaps, market-cap weighted indices, and capital flow distribution metrics.
BUSINESS VALUE: Highlights rotational market capital flows and sector concentration trends.
CAPABILITY CONSUMERS: Portfolio Manager, Research Analyst, Active Trader.
BUSINESS INPUTS: Instrument prices, sector classification definitions, market capitalization values.
BUSINESS OUTPUTS: Sector performance heatmaps, sector rotation indicators, capital flow summaries.
DEPENDENCIES: MKT-DAT-002, MKT-SEC-001.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Operationally Important
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard sector aggregation capability.
EGX-SPECIFIC NOTES: Organizes heatmaps across EGX official 18 sector classifications.
REGULATORY CONSIDERATIONS: Standard analytical aggregation.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: RES-SEC-002
CANONICAL NAME: Cross-Market Spread Analysis
ARABIC NAME: تحليل الفروق السعرية بين الأسواق
─────────────────────────────────────────
DEFINITION: The ability to evaluate lead-lag relationships, valuation spreads, and currency effect correlations between international financial markets and regional exchanges.
BUSINESS VALUE: Identifies cross-border valuation discrepancies and macroeconomic systemic risk spillovers.
CAPABILITY CONSUMERS: Institutional User, Fund Manager, Portfolio Manager.
BUSINESS INPUTS: Multi-market price series, foreign exchange rate histories, dual-listing definitions.
BUSINESS OUTPUTS: Correlation matrices, dual-listing spread indicators, lead-lag relationship scores.
DEPENDENCIES: MKT-DAT-002, PRT-FX-001.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Operationally Important
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 2
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Planned
UNIQUE TO TRADEORA: YES — specialized cross-market analysis between EGX, MENA exchanges (TADAWUL/DFM/ADX), and global markets.
EGX-SPECIFIC NOTES: Tracks dual-listed Egyptian equities (e.g., CIB GDRs listed on London Stock Exchange vs EGX local shares).
REGULATORY CONSIDERATIONS: Information modeling for dual-listed tracking; no execution routing in Phase 1.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

---

### DOMAIN 3: AI — AI and Decision Intelligence (الذكاء الاصطناعي ودعم القرارات)

#### L2 Area: AI-REC — AI Recommendation Synthesis

─────────────────────────────────────────
CAPABILITY ID: AI-REC-001
CANONICAL NAME: Explainable Recommendation Generation
ARABIC NAME: توليد التوصيات الاستثمارية القابلة للتفسير
─────────────────────────────────────────
DEFINITION: The ability to synthesize personalized, risk-adjusted investment proposals matching user profiles, complete with confidence scores, downside risk scenarios, and causal reasoning.
BUSINESS VALUE: Delivers tailored decision support without compromising human oversight or violating explainability mandates.
CAPABILITY CONSUMERS: Beginner Investor, Long-Term Investor, Financial Advisor.
BUSINESS INPUTS: User RiskProfile, Portfolio holdings, normalized financial research, market price context.
BUSINESS OUTPUTS: Recommendation objects, confidence score percentages, explicit assumptions, downside risk warnings.
DEPENDENCIES: RES-FND-003, RSK-PRF-001, PRT-TRK-001.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — zero-hallucination, fully explainable AI recommendation synthesis engine.
EGX-SPECIFIC NOTES: Generates Arabic and English recommendations tailored specifically to EGX market rules and stock universes.
REGULATORY CONSIDERATIONS: Complies strictly with Constitution Principle 3.2 (Non-custodial decision augmentation, mandatory human confirmation).
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: AI-REC-002
CANONICAL NAME: Recommendation Confidence Calibration
ARABIC NAME: معايرة نسبة الثقة في التوصيات
─────────────────────────────────────────
DEFINITION: The ability to compute and calibrate statistical uncertainty scores for AI recommendations based on historical accuracy, data freshness, and model confidence metrics.
BUSINESS VALUE: Ensures transparency by explicitly disclosing AI uncertainty to prevent user over-reliance.
CAPABILITY CONSUMERS: System, All User Profiles.
BUSINESS INPUTS: AI model output logs, historical recommendation accuracy records, input data freshness factors.
BUSINESS OUTPUTS: Calibrated ConfidenceScore objects (0.00% to 100.00%), model uncertainty ratings.
DEPENDENCIES: AI-REC-001.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — mandatory statistical confidence scoring embedded in every AI inference.
EGX-SPECIFIC NOTES: Adjusts confidence scores based on EGX market data freshness and liquidity metrics.
REGULATORY CONSIDERATIONS: Fulfills regulatory transparency and explainability mandates.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: AI-REC-003
CANONICAL NAME: Quantitative Signal Generation
ARABIC NAME: توليد الإشارات المالية الكمية
─────────────────────────────────────────
DEFINITION: The ability to evaluate statistical market regime shifts and technical setups to generate quantitative market event signals.
BUSINESS VALUE: Alerts active traders and quantitative analysts to high-probability technical market setups.
CAPABILITY CONSUMERS: Active Trader, Quantitative Analyst, Portfolio Manager.
BUSINESS INPUTS: Technical indicator values, order book flows, price tick streams.
BUSINESS OUTPUTS: AISignal objects, signal strength scores, timeframe direction flags.
DEPENDENCIES: MKT-DAT-003.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — quantitative signal flag generation.
EGX-SPECIFIC NOTES: Evaluates signals across all EGX liquid equities.
REGULATORY CONSIDERATIONS: Quantitative signals are mathematical indicator flags, not personal advice.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

#### L2 Area: AI-RES — Automated Research Synthesis

─────────────────────────────────────────
CAPABILITY ID: AI-RES-001
CANONICAL NAME: Equity Research Report Synthesis
ARABIC NAME: صياغة وتلخيص التقارير البحثية للأسهم
─────────────────────────────────────────
DEFINITION: The ability to summarize qualitative disclosure filings and quantitative valuation models into structured, publication-ready equity research summaries in Arabic and English.
BUSINESS VALUE: Grants retail and professional users instant access to institutional-grade research synthesis.
CAPABILITY CONSUMERS: Long-Term Investor, Financial Advisor, Wealth Manager.
BUSINESS INPUTS: Normalized financial statements, DCF models, news sentiment scores, corporate disclosure text.
BUSINESS OUTPUTS: Structured ResearchReport summaries, fair-value summary cards, moat evaluations.
DEPENDENCIES: RES-FND-001, RES-FND-003, RES-MAC-003.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — dual-language automated equity research synthesis engine.
EGX-SPECIFIC NOTES: Generates comprehensive Arabic equity research summaries for EGX listed assets.
REGULATORY CONSIDERATIONS: Includes mandatory data source citations and disclaimers.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: AI-RES-002
CANONICAL NAME: Daily Market Brief Compilation
ARABIC NAME: تجميع التلخيص اليومي للسوق
─────────────────────────────────────────
DEFINITION: The ability to synthesize daily market briefs summarizing macro index movements, sector rotation events, news sentiment, and watchlist developments prior to market opening.
BUSINESS VALUE: Delivers concise, daily actionable financial context tailored to user reading preferences.
CAPABILITY CONSUMERS: All User Profiles.
BUSINESS INPUTS: EOD price summaries, macroeconomic announcements, watchlist holdings, news feeds.
BUSINESS OUTPUTS: Personalized MarketBrief summaries, morning intelligence notes.
DEPENDENCIES: RES-MAC-002, PRT-WTC-001.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Operationally Important
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — Arabic-first personalized daily market brief generation.
EGX-SPECIFIC NOTES: Synthesizes EGX pre-market intelligence briefs delivered before 09:30 Cairo time.
REGULATORY CONSIDERATIONS: Generalized market overview summaries.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

---

### DOMAIN 4: PRT — Portfolio Management (إدارة المحافظ الاستثمارية)

#### L2 Area: PRT-TRK — Portfolio Ledger & Tracking

─────────────────────────────────────────
CAPABILITY ID: PRT-TRK-001
CANONICAL NAME: Multi-Asset Position Accounting
ARABIC NAME: المحاسبة لجميع مراكز الأصول
─────────────────────────────────────────
DEFINITION: The ability to maintain an authoritative ledger of multi-asset holdings, cash balances, cost bases, and pending corporate action adjustments within a user portfolio.
BUSINESS VALUE: Provides an accurate single source of truth view of total multi-market holdings.
CAPABILITY CONSUMERS: All User Profiles.
BUSINESS INPUTS: User trade entries, market price feeds, corporate action executions, deposit records.
BUSINESS OUTPUTS: Portfolio NAV snapshots, Position ledgers, realized/unrealized P&L figures.
DEPENDENCIES: MKT-DAT-002, MKT-SEC-001.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard portfolio position accounting capability.
EGX-SPECIFIC NOTES: Tracks EGX equities, treasury bonds, and local cash balances in EGP.
REGULATORY CONSIDERATIONS: Software ledger calculation; non-custodial operations.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: PRT-TRK-002
CANONICAL NAME: Historical Transaction Recording
ARABIC NAME: تسجيل المعاملات التاريخية
─────────────────────────────────────────
DEFINITION: The ability to record and preserve an immutable historical transaction log of buy, sell, dividend deposit, and fee entries for portfolio accounting.
BUSINESS VALUE: Ensures auditability of portfolio cost bases and return calculations over time.
CAPABILITY CONSUMERS: Portfolio Manager, Individual Investor, Compliance Officer.
BUSINESS INPUTS: Transaction entries, fee schedules, trade confirmation records.
BUSINESS OUTPUTS: HistoricalTrade logs, cost-basis tax lot records.
DEPENDENCIES: PRT-TRK-001.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard financial transaction logging capability.
EGX-SPECIFIC NOTES: Logs brokerage commission fees and EGX stamp duty tax charges.
REGULATORY CONSIDERATIONS: Preserves historical records for client audit and tax verification.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

#### L2 Area: PRT-PRF — Performance Attribution & Analytics

─────────────────────────────────────────
CAPABILITY ID: PRT-PRF-001
CANONICAL NAME: Time-Weighted Return Calculation
ARABIC NAME: حساب العائد الموزون بالزمن (TWR)
─────────────────────────────────────────
DEFINITION: The ability to calculate Time-Weighted Returns (TWR) for portfolios to evaluate investment performance independent of external cash deposits or withdrawals.
BUSINESS VALUE: Isolates true investment skill from capital flow distortions.
CAPABILITY CONSUMERS: Portfolio Manager, Fund Manager, Wealth Advisor, Individual Investor.
BUSINESS INPUTS: Portfolio NAV snapshots, cash flow timestamps and amounts.
BUSINESS OUTPUTS: TWR percentage metrics, periodic return series.
DEPENDENCIES: PRT-TRK-001.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard GIPS-compliant performance methodology.
EGX-SPECIFIC NOTES: Computes TWR across Egyptian equity and fixed income holdings.
REGULATORY CONSIDERATIONS: Adheres to Global Investment Performance Standards (GIPS).
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: PRT-PRF-002
CANONICAL NAME: Benchmark Comparison Evaluation
ARABIC NAME: تقييم الأداء مقارنة بالمؤشرات المرجعية
─────────────────────────────────────────
DEFINITION: The ability to evaluate portfolio return performance and alpha generation against market indices or custom blended benchmark baselines.
BUSINESS VALUE: Verifies whether investment strategies outperform passive market indices.
CAPABILITY CONSUMERS: Portfolio Manager, Fund Manager, Financial Advisor.
BUSINESS INPUTS: Portfolio return series, Benchmark index return series.
BUSINESS OUTPUTS: Alpha metrics, relative performance charts, tracking error metrics.
DEPENDENCIES: PRT-PRF-001, MKT-DAT-002.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard benchmark comparison capability.
EGX-SPECIFIC NOTES: Evaluates portfolio performance relative to EGX30, EGX70 EWI, and EGX100 EWI indices.
REGULATORY CONSIDERATIONS: Benchmark comparison requires explicit currency synchronization disclosures.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

#### L2 Area: PRT-FX — Multi-Currency Accounting

─────────────────────────────────────────
CAPABILITY ID: PRT-FX-001
CANONICAL NAME: Multi-Currency Valuation Conversion
ARABIC NAME: تحويل وتقييم المحافظ متعددة العملات
─────────────────────────────────────────
DEFINITION: The ability to convert and value multi-market holdings into a declared base accounting currency using real-time foreign exchange spot rates.
BUSINESS VALUE: Enables global multi-market portfolio tracking while isolating foreign exchange impact.
CAPABILITY CONSUMERS: Wealth Manager, Global Investor, Portfolio Manager.
BUSINESS INPUTS: Asset valuations, foreign exchange spot rate series, base currency parameters.
BUSINESS OUTPUTS: Converted monetary values, FX gain/loss breakdown metrics.
DEPENDENCIES: PRT-TRK-001.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — multi-currency accounting capability.
EGX-SPECIFIC NOTES: Converts USD/EGP, EUR/EGP, and SAR/EGP asset holdings into primary base currency.
REGULATORY CONSIDERATIONS: Uses central bank published FX rates for authoritative conversion.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

#### L2 Area: PRT-WTC — Watchlist & Screening

─────────────────────────────────────────
CAPABILITY ID: PRT-WTC-001
CANONICAL NAME: Custom Watchlist Management
ARABIC NAME: إدارة قوائم المتابعة المخصصة
─────────────────────────────────────────
DEFINITION: The ability to create, organize, and monitor custom collections of financial instruments across global exchanges with tag filtering.
BUSINESS VALUE: Streamlines continuous tracking of prospective investment candidates.
CAPABILITY CONSUMERS: All User Profiles.
BUSINESS INPUTS: User instrument selections, watchlist names, custom tags.
BUSINESS OUTPUTS: Watchlist objects, updated monitoring view lists.
DEPENDENCIES: MKT-SEC-001.
STRATEGIC IMPORTANCE: Supporting
BUSINESS CRITICALITY: Operationally Important
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard user watchlist capability.
EGX-SPECIFIC NOTES: Supports watchlists covering EGX equities, bonds, and indices.
REGULATORY CONSIDERATIONS: Personal user preference management.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: PRT-WTC-002
CANONICAL NAME: Dynamic Multi-Variable Screening
ARABIC NAME: التصفية والفرز متعدد الأبعاد
─────────────────────────────────────────
DEFINITION: The ability to execute dynamic filtering of listed instruments based on fundamental ratios, technical parameters, AI scores, and sector classifications.
BUSINESS VALUE: Filters thousands of listed securities into actionable opportunity sets matching specific criteria.
CAPABILITY CONSUMERS: Active Trader, Long-Term Investor, Research Analyst.
BUSINESS INPUTS: Screening criteria rules, fundamental database, technical indicator values, AI score parameters.
BUSINESS OUTPUTS: Filtered instrument lists, screening result tables.
DEPENDENCIES: MKT-DAT-003, RES-FND-001, AI-REC-002.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — integrates fundamental ratios, technical indicators, and explainable AI scores in a single screening engine.
EGX-SPECIFIC NOTES: Screens all listed companies on EGX Main Market and Nilex SME Market.
REGULATORY CONSIDERATIONS: Screening engine executes user-defined search parameters.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

---

### DOMAIN 5: RSK — Risk Management (إدارة المخاطر)

#### L2 Area: RSK-PRF — Risk Profiling

─────────────────────────────────────────
CAPABILITY ID: RSK-PRF-001
CANONICAL NAME: User Risk Tolerance Profiling
ARABIC NAME: تحديد وتقييم ملف مخاطر المستثمر
─────────────────────────────────────────
DEFINITION: The ability to evaluate user financial capacity, loss tolerance, investment horizon, and knowledge through interactive questionnaires to derive a RiskProfile.
BUSINESS VALUE: Establishes mandatory legal and personal risk boundaries for downstream recommendations.
CAPABILITY CONSUMERS: Beginner Investor, Financial Advisor, Wealth Manager.
BUSINESS INPUTS: User questionnaire responses, financial capacity data, investment horizon parameters.
BUSINESS OUTPUTS: RiskProfile objects, risk score ratings, asset allocation constraint boundaries.
DEPENDENCIES: IDN-PRF-001.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — localized Arabic/English risk profiling engine compliant with MENA suitability standards.
EGX-SPECIFIC NOTES: Captures investor suitability profile required prior to generating AI EGX recommendations.
REGULATORY CONSIDERATIONS: Complies with FRA investor suitability and customer risk assessment guidelines.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

#### L2 Area: RSK-ANL — Quantitative Risk Analytics

─────────────────────────────────────────
CAPABILITY ID: RSK-ANL-001
CANONICAL NAME: Value-at-Risk (VaR) Modeling
ARABIC NAME: نمذجة القيمة المعرضة للمخاطر (VaR)
─────────────────────────────────────────
DEFINITION: The ability to compute historical and parametric Value-at-Risk (VaR) and Conditional VaR metrics for multi-asset portfolios over defined confidence horizons.
BUSINESS VALUE: Prevents unquantified loss by providing statistical estimates of maximum potential drawdown.
CAPABILITY CONSUMERS: Portfolio Manager, Fund Manager, Wealth Advisor.
BUSINESS INPUTS: Portfolio positions, historical price volatility series, confidence level parameters (e.g., 95%, 99%).
BUSINESS OUTPUTS: VaR monetary values, Conditional VaR (Expected Shortfall) values, risk metrics.
DEPENDENCIES: PRT-TRK-001, MKT-DAT-002.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — real-time portfolio VaR modeling tailored for multi-asset regional portfolios.
EGX-SPECIFIC NOTES: Calculates VaR accounting for EGX price volatility and local market liquidity profiles.
REGULATORY CONSIDERATIONS: Standard quantitative risk management calculation.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: RSK-ANL-002
CANONICAL NAME: Sector Concentration Risk Stress-Testing
ARABIC NAME: اختبار الإجهاد وتركيز الأصول في القطاعات
─────────────────────────────────────────
DEFINITION: The ability to calculate portfolio sector concentration percentages and evaluate asset correlation matrices to detect systemic vulnerability.
BUSINESS VALUE: Protects portfolios against over-concentration in single business sectors or correlated asset clusters.
CAPABILITY CONSUMERS: Portfolio Manager, Risk Evaluator, Financial Advisor.
BUSINESS INPUTS: Portfolio positions, sector classifications, asset price correlation matrices.
BUSINESS OUTPUTS: Sector concentration percentages, correlation matrix heatmaps, concentration warning flags.
DEPENDENCIES: PRT-TRK-001, RES-SEC-001.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard sector concentration tracking capability.
EGX-SPECIFIC NOTES: Tracks sector concentration against EGX 18 official sector boundaries.
REGULATORY CONSIDERATIONS: Quantitative risk metric.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: RSK-ANL-003
CANONICAL NAME: Drawdown Stress-Testing
ARABIC NAME: اختبارات الإجهاد والانخفاض الأقصى
─────────────────────────────────────────
DEFINITION: The ability to simulate historical market crash scenarios against current portfolio holdings to calculate maximum drawdown exposure.
BUSINESS VALUE: Prepares investors for adverse market volatility regimes by quantifying historical stress scenario impact.
CAPABILITY CONSUMERS: Fund Manager, Portfolio Manager, Wealth Advisor.
BUSINESS INPUTS: Portfolio positions, historical scenario price shocks (e.g., 2008 crisis, 2020 crash).
BUSINESS OUTPUTS: Simulated portfolio drawdown percentages, stress scenario P&L estimates.
DEPENDENCIES: RSK-ANL-001.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — incorporates historical EGX and MENA market devaluation scenarios.
EGX-SPECIFIC NOTES: Simulates historical EGX market volatility regimes and currency devaluation shocks.
REGULATORY CONSIDERATIONS: Stress testing methodology disclosure.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

---

### DOMAIN 6: ENG — User Engagement and Notification (التفاعل والتنبيهات)

#### L2 Area: ENG-ALT — Alert Evaluation & Notification Dispatch

─────────────────────────────────────────
CAPABILITY ID: ENG-ALT-001
CANONICAL NAME: Price & Volatility Alert Evaluation
ARABIC NAME: تقييم تنبيهات الأسعار والتقلبات
─────────────────────────────────────────
DEFINITION: The ability to continuously evaluate market price ticks against user-configured threshold rules to detect price breaches and volume spikes.
BUSINESS VALUE: Ensures critical price target breaches receive immediate system processing.
CAPABILITY CONSUMERS: Active Trader, Long-Term Investor.
BUSINESS INPUTS: Real-time price ticks, active user alert threshold configurations.
BUSINESS OUTPUTS: Triggered Alert objects, threshold breach notifications.
DEPENDENCIES: MKT-DAT-001.
STRATEGIC IMPORTANCE: Supporting
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard market price alert evaluation capability.
EGX-SPECIFIC NOTES: Evaluates real-time price breaches during EGX continuous trading sessions.
REGULATORY CONSIDERATIONS: User-configured notification triggers.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: ENG-ALT-002
CANONICAL NAME: Risk Breach Alert Dispatch
ARABIC NAME: إرسال تنبيهات تجاوز حدود المخاطر
─────────────────────────────────────────
DEFINITION: The ability to evaluate portfolio risk parameters against user risk profiles to dispatch high-priority notifications upon VaR or concentration breach events.
BUSINESS VALUE: Immediately alerts users to critical portfolio risk exceedances to prevent unmanaged losses.
CAPABILITY CONSUMERS: Portfolio Manager, Wealth Advisor, Individual Investor.
BUSINESS INPUTS: Portfolio VaR metrics, risk limit thresholds, user notification preferences.
BUSINESS OUTPUTS: High-priority RiskAlert notifications, risk warning payloads.
DEPENDENCIES: RSK-ANL-001, RSK-ANL-002.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — automated real-time portfolio VaR and concentration breach alert engine.
EGX-SPECIFIC NOTES: Dispatches immediate risk warnings when EGX stock volatility impacts portfolio VaR bounds.
REGULATORY CONSIDERATIONS: Fulfills investor risk disclosure mandates.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

---

### DOMAIN 7: IDN — User and Identity Management (إدارة المستخدمين والهوية)

#### L2 Area: IDN-PRF — Profile & Security Management

─────────────────────────────────────────
CAPABILITY ID: IDN-PRF-001
CANONICAL NAME: User Profile Registration & Onboarding
ARABIC NAME: تسجيل وتهيئة ملف المستخدم
─────────────────────────────────────────
DEFINITION: The ability to capture, register, and manage user identity credentials, security settings, locale configurations, and initial preferences.
BUSINESS VALUE: Accelerates user onboarding while capturing essential identity and preference records.
CAPABILITY CONSUMERS: All User Profiles.
BUSINESS INPUTS: Registration data, credential choices, locale selections.
BUSINESS OUTPUTS: Created UserProfile records, initial preference configurations.
DEPENDENCIES: None (Foundational capability).
STRATEGIC IMPORTANCE: Supporting
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard user identity onboarding capability.
EGX-SPECIFIC NOTES: Supports registration for Egyptian and regional Arab retail investors.
REGULATORY CONSIDERATIONS: Complies with user identity data privacy standards.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: IDN-PRF-002
CANONICAL NAME: Locale & Language Preference Management
ARABIC NAME: إدارة إعدادات اللغة والمنطقة
─────────────────────────────────────────
DEFINITION: The ability to store and apply user-selected language preferences, calendar systems (Gregorian/Hijri), and number formatting configurations.
BUSINESS VALUE: Ensures personalized, culturally native user experiences across device sessions.
CAPABILITY CONSUMERS: All User Profiles.
BUSINESS INPUTS: User locale preferences, language selections, calendar choices.
BUSINESS OUTPUTS: Active Locale configuration settings applied to user sessions.
DEPENDENCIES: IDN-PRF-001, LOC-LNG-001.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — seamless live language switching (Arabic/English) with full state preservation.
EGX-SPECIFIC NOTES: Defaults to Arabic (ar-EG) and Hijri/Gregorian dual calendar context for MENA users.
REGULATORY CONSIDERATIONS: Ensures user disclosures are presented in preferred language.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

---

### DOMAIN 8: ENT — Subscription and Entitlement (الاشتراكات والصلاحيات)

#### L2 Area: ENT-SUB — Commercial Subscription & Quota Management

─────────────────────────────────────────
CAPABILITY ID: ENT-SUB-001
CANONICAL NAME: Subscription Tier Entitlement Enforcement
ARABIC NAME: تطبيق صلاحيات واستحقاقات باقات الاشتراك
─────────────────────────────────────────
DEFINITION: The ability to manage commercial subscription tiers (Basic, Professional, Enterprise) and enforce feature access rights across user sessions.
BUSINESS VALUE: Monetizes platform capabilities and enforces market data licensing redistribution rules.
CAPABILITY CONSUMERS: Platform Administrator, All User Profiles.
BUSINESS INPUTS: User active Subscription tier, feature entitlement matrices, API access rules.
BUSINESS OUTPUTS: Entitlement decision responses (Allow/Deny), feature access limits.
DEPENDENCIES: IDN-PRF-001.
STRATEGIC IMPORTANCE: Supporting
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard subscription access control capability.
EGX-SPECIFIC NOTES: Enforces real-time vs 15-minute delayed EGX data feed access based on tier entitlements.
REGULATORY CONSIDERATIONS: Enforces vendor market data licensing compliance.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: ENT-SUB-002
CANONICAL NAME: API Volume Quota Enforcement
ARABIC NAME: إدارة وتطبيق حصص استهلاك واجهات البرمجة
─────────────────────────────────────────
DEFINITION: The ability to track, evaluate, and enforce API call rate limits and monthly usage quotas across commercial subscription tiers.
BUSINESS VALUE: Protects platform infrastructure stability and monetizes B2B API consumption.
CAPABILITY CONSUMERS: Enterprise User, Platform Administrator.
BUSINESS INPUTS: API request streams, active user API quota limits.
BUSINESS OUTPUTS: Quota usage tracking logs, rate limit enforcement signals.
DEPENDENCIES: ENT-SUB-001.
STRATEGIC IMPORTANCE: Supporting
BUSINESS CRITICALITY: Business Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard API rate limiting capability.
EGX-SPECIFIC NOTES: Controls B2B data feed API quota consumption for enterprise brokerage partners.
REGULATORY CONSIDERATIONS: Technical access governance.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

---

### DOMAIN 9: RPT — Reporting and Export (التقارير والتصدير)

#### L2 Area: RPT-GEN — Report Generation & Export

─────────────────────────────────────────
CAPABILITY ID: RPT-GEN-001
CANONICAL NAME: Portfolio Statement Generation
ARABIC NAME: إصدار تقارير كشوف المحافظ
─────────────────────────────────────────
DEFINITION: The ability to compile, format, and generate downloadable publication-ready portfolio valuation statements and tax reports in PDF and Excel formats.
BUSINESS VALUE: Facilitates external record-keeping, tax filings, and client advisory reporting.
CAPABILITY CONSUMERS: Wealth Manager, Financial Advisor, Portfolio Manager, Individual Investor.
BUSINESS INPUTS: Portfolio NAV history, transaction records, tax lot accounting ledgers, locale formatting.
BUSINESS OUTPUTS: Publication-ready PDF/Excel Portfolio Statement files.
DEPENDENCIES: PRT-TRK-001, PRT-PRF-001, LOC-LNG-001.
STRATEGIC IMPORTANCE: Supporting
BUSINESS CRITICALITY: Operationally Important
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — native Arabic/English bilingual financial report rendering engine.
EGX-SPECIFIC NOTES: Generates capital gains tax summaries compliant with Egyptian tax reporting formats.
REGULATORY CONSIDERATIONS: Provides auditable statements for tax and regulatory verification.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: RPT-GEN-002
CANONICAL NAME: Equity Research Export Compilation
ARABIC NAME: تصدير وتجميع البحوث المالية
─────────────────────────────────────────
DEFINITION: The ability to export structured equity research notes, DCF fair-value summaries, and financial ratio analysis as downloadable research reports.
BUSINESS VALUE: Enables analysts and advisors to distribute professional equity research documents to clients.
CAPABILITY CONSUMERS: Research Analyst, Financial Advisor, Wealth Manager.
BUSINESS INPUTS: ResearchReport objects, valuation model charts, ratio tables.
BUSINESS OUTPUTS: Publication-ready PDF Equity Research Report files.
DEPENDENCIES: AI-RES-001, RES-FND-003.
STRATEGIC IMPORTANCE: Supporting
BUSINESS CRITICALITY: Operationally Important
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — automated bilingual equity research export compiler.
EGX-SPECIFIC NOTES: Exports research reports covering EGX listed companies.
REGULATORY CONSIDERATIONS: Includes mandatory research disclaimers and analyst attribution disclosures.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

---

### DOMAIN 10: OPS — Platform Operations and Governance (العمليات والحوكمة)

#### L2 Area: OPS-GOV — System Governance & Health Monitoring

─────────────────────────────────────────
CAPABILITY ID: OPS-GOV-001
CANONICAL NAME: Immutable Audit Event Logging
ARABIC NAME: التسجيل غير القابل للتعديل لأحداث التدقيق
─────────────────────────────────────────
DEFINITION: The ability to capture and store tamper-evident, immutable audit records of all user actions, AI recommendations, administrative overrides, and system configuration modifications.
BUSINESS VALUE: Guarantees absolute regulatory auditability, non-repudiation, and operational transparency.
CAPABILITY CONSUMERS: Compliance Officer, Platform Administrator, External Regulatory Auditors.
BUSINESS INPUTS: System action events, AI inference payloads, administrative override logs.
BUSINESS OUTPUTS: Immutable AuditLog records, correlation tracking tokens.
DEPENDENCIES: None (Foundational capability).
STRATEGIC IMPORTANCE: Supporting
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — essential regulatory audit logging capability.
EGX-SPECIFIC NOTES: Retains audit logs in compliance with FRA regulatory data retention rules.
REGULATORY CONSIDERATIONS: Complies with Constitution Principle 4.40 (Everything Auditable).
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: OPS-GOV-002
CANONICAL NAME: System Data Stream Health Monitoring
ARABIC NAME: مراقبة صحة وجودة تدفقات البيانات
─────────────────────────────────────────
DEFINITION: The ability to track market data stream latency, quote feed integrity, AI inference error rates, and API availability in real time.
BUSINESS VALUE: Protects operational availability SLAs and prevents corrupted pricing data from propagating.
CAPABILITY CONSUMERS: Platform Administrator, Operations Team.
BUSINESS INPUTS: Feed latency metrics, stream health heartbeats, AI error logs.
BUSINESS OUTPUTS: Health status dashboards, operational failover signals, incident alert logs.
DEPENDENCIES: MKT-DAT-001.
STRATEGIC IMPORTANCE: Supporting
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard system telemetry and health monitoring capability.
EGX-SPECIFIC NOTES: Monitors EGX data feed connection latency and quote stream stability.
REGULATORY CONSIDERATIONS: Ensures operational SLA compliance.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

---

### DOMAIN 11: LOC — Localization and Accessibility (التوطين وسهولة الاستخدام)

#### L2 Area: LOC-LNG — Language & Regional Formatting

─────────────────────────────────────────
CAPABILITY ID: LOC-LNG-001
CANONICAL NAME: Bilingual Dynamic Text Localization
ARABIC NAME: التوطين الديناميكي للنصوص بلغتين
─────────────────────────────────────────
DEFINITION: The ability to render all UI text, financial terms, tooltips, and educational breakdowns natively in Arabic and English.
BUSINESS VALUE: Eliminates language barriers to financial intelligence across regional MENA markets.
CAPABILITY CONSUMERS: All User Profiles.
BUSINESS INPUTS: Canonical translation bundles, active user language preference settings.
BUSINESS OUTPUTS: Localized text strings, native Arabic financial UI copy.
DEPENDENCIES: None (Foundational shared capability).
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — complete financial vocabulary parity between Arabic and English matching `UBIQUITOUS_LANGUAGE.md`.
EGX-SPECIFIC NOTES: Provides native Arabic financial terminology for EGX investors.
REGULATORY CONSIDERATIONS: Complies with Constitution Principle 4.15 (Arabic First-Class Support).
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: LOC-LNG-002
CANONICAL NAME: Right-to-Left (RTL) Layout Management
ARABIC NAME: إدارة التنسيق من اليمين إلى اليسار
─────────────────────────────────────────
DEFINITION: The ability to format visual interfaces, navigation layouts, charts, and table structures natively in Right-to-Left (RTL) orientation for Arabic views.
BUSINESS VALUE: Delivers a natural, culturally authentic visual experience for Arabic-speaking users.
CAPABILITY CONSUMERS: All Arabic-speaking User Profiles.
BUSINESS INPUTS: UI component layouts, active language orientation state.
BUSINESS OUTPUTS: Formatted RTL visual layouts, mirrored chart annotations.
DEPENDENCIES: LOC-LNG-001.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: YES — native RTL financial interface rendering engine.
EGX-SPECIFIC NOTES: Guarantees complete RTL visual alignment across all EGX analytics views.
REGULATORY CONSIDERATIONS: Fulfills regional accessibility requirements.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

─────────────────────────────────────────
CAPABILITY ID: LOC-LNG-003
CANONICAL NAME: Cultural Date & Number Formatting
ARABIC NAME: التنسيق الثقافي للأرقام التواريخ
─────────────────────────────────────────
DEFINITION: The ability to format monetary values, numbers, percentages, and dates according to user locale preferences including Gregorian and Hijri calendar systems.
BUSINESS VALUE: Guarantees clear numeric comprehension without ambiguity across international locales.
CAPABILITY CONSUMERS: All User Profiles.
BUSINESS INPUTS: Raw numeric values, date timestamps, active locale formatting rules.
BUSINESS OUTPUTS: Formatted monetary strings, localized date strings.
DEPENDENCIES: LOC-LNG-001.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Mission Critical
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 1
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Active
UNIQUE TO TRADEORA: NO — standard locale number/date formatting capability.
EGX-SPECIFIC NOTES: Formats EGP currency values and supports dual Gregorian/Hijri calendar dates for MENA users.
REGULATORY CONSIDERATIONS: Financial accuracy in numeric rendering.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

---

### DOMAINS 12–14: FUTURE CAPABILITIES (Phase 2 & Phase 3)

#### DOMAIN 12: EXC — Trade Execution (تنفيذ التداولات) [Future Phase 2]

─────────────────────────────────────────
CAPABILITY ID: EXC-SOR-001
CANONICAL NAME: Broker Order Parameter Routing
ARABIC NAME: توجيه أؤمر التداول للوسطاء
─────────────────────────────────────────
DEFINITION: The ability to validate, format, and route user-authorized order parameters to licensed external execution broker APIs via Smart Order Routing (SOR).
BUSINESS VALUE: Enables single-click order execution through user-connected licensed brokerage accounts.
CAPABILITY CONSUMERS: Active Trader, Portfolio Manager.
BUSINESS INPUTS: User-authorized order parameters, broker API credentials, instrument order rules.
BUSINESS OUTPUTS: Routed Order payloads, broker execution tracking tokens.
DEPENDENCIES: MKT-SEC-001, IDN-PRF-001.
STRATEGIC IMPORTANCE: Core Enabling
BUSINESS CRITICALITY: Operationally Important
INVESTMENT POSTURE: Invest Adequately
CURRENT STATE: Phase 2
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Planned
UNIQUE TO TRADEORA: NO — standard broker order routing integration.
EGX-SPECIFIC NOTES: Routes orders to licensed EGX brokerage firms via open execution APIs in Phase 2.
REGULATORY CONSIDERATIONS: Non-custodial order routing; requires explicit user authorization per order.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

#### DOMAIN 13: WLT — Wealth Management (إدارة الثروات) [Future Phase 2]

─────────────────────────────────────────
CAPABILITY ID: WLT-REB-001
CANONICAL NAME: Tax-Aware Rebalancing Plan Synthesis
ARABIC NAME: صياغة خطط إعادة التوازن الراعيات للضرائب
─────────────────────────────────────────
DEFINITION: The ability to generate low-slippage, tax-aware portfolio rebalancing proposals to realign current holdings with target model asset allocations.
BUSINESS VALUE: Automates complex rebalancing calculations for wealth managers and portfolio owners.
CAPABILITY CONSUMERS: Wealth Manager, Portfolio Manager, Fund Manager.
BUSINESS INPUTS: Current portfolio holdings, target model weights, tax lot histories, estimated transaction fee schedules.
BUSINESS OUTPUTS: Rebalancing proposal plans, recommended buy/sell adjustment lists, estimated tax impact totals.
DEPENDENCIES: PRT-TRK-001, RSK-ANL-001.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Operationally Important
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 2
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Planned
UNIQUE TO TRADEORA: YES — tax-aware automated rebalancing algorithm for MENA multi-asset portfolios.
EGX-SPECIFIC NOTES: Accounts for EGX capital gains tax rules and local transaction fee schedules.
REGULATORY CONSIDERATIONS: Advisory proposal synthesis; requires user confirmation.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

#### DOMAIN 14: ADV — Advisory Services (الاستشارات المالية) [Future Phase 2]

─────────────────────────────────────────
CAPABILITY ID: ADV-COP-001
CANONICAL NAME: Financial Advisor Client Copilot Workflows
ARABIC NAME: بيئة عمل مساعد المستشار المالي
─────────────────────────────────────────
DEFINITION: The ability to provide interactive AI copilot interfaces for licensed financial advisors to draft client reports, run scenario stress-tests, and verify suitability compliance.
BUSINESS VALUE: Scales financial advisory operations and reduces manual report drafting time by 80%.
CAPABILITY CONSUMERS: Financial Advisor, Wealth Manager.
BUSINESS INPUTS: Client portfolio data, advisor notes, suitability profile parameters, scenario inputs.
BUSINESS OUTPUTS: Drafted client advisory reports, suitability audit records, scenario impact charts.
DEPENDENCIES: AI-REC-001, RSK-PRF-001, RPT-GEN-001.
STRATEGIC IMPORTANCE: Core Differentiating
BUSINESS CRITICALITY: Operationally Important
INVESTMENT POSTURE: Invest Heavily
CURRENT STATE: Phase 2
CAPABILITY VERSION: Initial Version: 1.0 | Last Updated: 2026-07-21 | Status: Planned
UNIQUE TO TRADEORA: YES — enterprise copilot workspace for licensed Arab wealth advisors.
EGX-SPECIFIC NOTES: Equips Egyptian wealth advisors with automated compliance report generation.
REGULATORY CONSIDERATIONS: Supports licensed advisor workflows; enforces human advisor oversight.
ATOMIC? CONFIRMED — passes atomicity test.
─────────────────────────────────────────

---

## SECTION 4 — CROSS-CUTTING CAPABILITIES

Cross-Cutting Capabilities represent shared business abilities that serve multiple L1 domains simultaneously and cannot be exclusively owned by any single domain.

```
FORMAT: [XCC-CODE-NNN]
Total Cross-Cutting Capabilities Cataloged: 13 Shared Capabilities.
```

---

### 1. User Authentication
* **CAPABILITY ID**: `XCC-AUTH-001`
* **CANONICAL NAME**: User Identity Authentication
* **ARABIC NAME**: مصادقة هوية المستخدم
* **DEFINITION**: The ability to verify the identity credentials of a user or system actor attempting to access the platform.
* **SERVING DOMAINS**: All L1 Domains.
* **PRIMARY OWNER**: IDN — User and Identity Management
* **SHARED KERNEL CANDIDATE**: YES — core identity verification contract shared across all domain boundaries.
* **GENERIC SUBDOMAIN CANDIDATE**: YES — candidate for OAuth2/OIDC identity provider integration.
* **ALSO TECHNICAL CONCERN**: YES — involves security protocol verification in technology architecture.
* **CURRENT STATE**: Phase 1
* **INVESTMENT POSTURE**: Buy / Standard Protocol Sourcing

### 2. User Authorization
* **CAPABILITY ID**: `XCC-AUTH-002`
* **CANONICAL NAME**: Role-Based Authorization Enforcement
* **ARABIC NAME**: تطبيق صلاحيات الوصول حسب الأدوار
* **DEFINITION**: The ability to evaluate a verified user's permissions and role entitlements to determine access permission for specific business operations.
* **SERVING DOMAINS**: All L1 Domains.
* **PRIMARY OWNER**: IDN — User and Identity Management
* **SHARED KERNEL CANDIDATE**: YES — permission evaluation contract used by all domain boundaries.
* **GENERIC SUBDOMAIN CANDIDATE**: YES — candidate for standard RBAC/ABAC authorization engine.
* **ALSO TECHNICAL CONCERN**: YES — mapped to API gateway policy enforcement.
* **CURRENT STATE**: Phase 1
* **INVESTMENT POSTURE**: Build internally on open standards

### 3. Immutable Audit Logging
* **CAPABILITY ID**: `XCC-AUD-001`
* **CANONICAL NAME**: System-Wide Audit Event Logging
* **ARABIC NAME**: تسجيل أحداث التدقيق الشامل للنظام
* **DEFINITION**: The ability to record tamper-evident, timestamped audit log records for all business transactions, administrative overrides, and AI inference outputs.
* **SERVING DOMAINS**: All L1 Domains.
* **PRIMARY OWNER**: OPS — Platform Operations and Governance
* **SHARED KERNEL CANDIDATE**: YES — standardized audit event schema consumed by all domains.
* **GENERIC SUBDOMAIN CANDIDATE**: NO — custom business audit compliance requirement.
* **ALSO TECHNICAL CONCERN**: YES — involves append-only distributed log persistence.
* **CURRENT STATE**: Phase 1
* **INVESTMENT POSTURE**: Build internally

### 4. Audit Trail Query
* **CAPABILITY ID**: `XCC-AUD-002`
* **CANONICAL NAME**: Audit Trail Inquiry & Reporting
* **ARABIC NAME**: الاستعلام عن سجلات التدقيق وإصدار التقارير
* **DEFINITION**: The ability to query, filter, and extract historical audit records for regulatory compliance reviews and security investigations.
* **SERVING DOMAINS**: OPS, RPT, IDN, ENT.
* **PRIMARY OWNER**: OPS — Platform Operations and Governance
* **SHARED KERNEL CANDIDATE**: NO — specific administrative inquiry domain capability.
* **GENERIC SUBDOMAIN CANDIDATE**: NO.
* **ALSO TECHNICAL CONCERN**: NO.
* **CURRENT STATE**: Phase 1
* **INVESTMENT POSTURE**: Build internally

### 5. Multi-Channel Notification Dispatch
* **CAPABILITY ID**: `XCC-NTF-001`
* **CANONICAL NAME**: Multi-Channel Message Dispatch
* **ARABIC NAME**: إرسال الإشعارات عبر قنوات متعددة
* **DEFINITION**: The ability to format and transmit notification payloads to user devices across push, email, SMS, and in-app channels.
* **SERVING DOMAINS**: ENG, RSK, MKT, AI.
* **PRIMARY OWNER**: ENG — User Engagement and Notification
* **SHARED KERNEL CANDIDATE**: YES — notification contract utilized across domains to alert users.
* **GENERIC SUBDOMAIN CANDIDATE**: YES — push/email gateway provider sourcing.
* **ALSO TECHNICAL CONCERN**: YES — notification delivery infrastructure.
* **CURRENT STATE**: Phase 1
* **INVESTMENT POSTURE**: Buy / Provider Integration

### 6. Notification Preference Management
* **CAPABILITY ID**: `XCC-NTF-002`
* **CANONICAL NAME**: Notification Channel Preference Governance
* **ARABIC NAME**: إدارة تفضيلات قنوات الإشعارات
* **DEFINITION**: The ability to capture and enforce user preferences regarding notification quiet hours, frequency caps, and channel routing.
* **SERVING DOMAINS**: ENG, IDN.
* **PRIMARY OWNER**: ENG — User Engagement and Notification
* **SHARED KERNEL CANDIDATE**: NO.
* **GENERIC SUBDOMAIN CANDIDATE**: NO.
* **ALSO TECHNICAL CONCERN**: NO.
* **CURRENT STATE**: Phase 1
* **INVESTMENT POSTURE**: Build internally

### 7. Language Localization
* **CAPABILITY ID**: `XCC-LOC-001`
* **CANONICAL NAME**: Dynamic Text Language Translation
* **ARABIC NAME**: الترجمة الديناميكية للنصوص
* **DEFINITION**: The ability to resolve and render domain text strings in Arabic and English based on active user locale context.
* **SERVING DOMAINS**: All L1 Domains.
* **PRIMARY OWNER**: LOC — Localization and Accessibility
* **SHARED KERNEL CANDIDATE**: YES — shared localization contract published to all UI presentation layers.
* **GENERIC SUBDOMAIN CANDIDATE**: YES — i18n bundle framework.
* **ALSO TECHNICAL CONCERN**: YES — client-side string bundle loading.
* **CURRENT STATE**: Phase 1
* **INVESTMENT POSTURE**: Build internally / Open Source

### 8. Date and Number Formatting
* **CAPABILITY ID**: `XCC-LOC-002`
* **CANONICAL NAME**: Locale Number & Date Formatting
* **ARABIC NAME**: تنسيق الأرقام والتواريخ حسب المنطقة
* **DEFINITION**: The ability to format monetary amounts, percentages, and timestamps according to locale conventions including Gregorian and Hijri calendars.
* **SERVING DOMAINS**: All L1 Domains.
* **PRIMARY OWNER**: LOC — Localization and Accessibility
* **SHARED KERNEL CANDIDATE**: YES — shared formatting library contract.
* **GENERIC SUBDOMAIN CANDIDATE**: YES — standard ICU formatting libraries.
* **ALSO TECHNICAL CONCERN**: YES — numeric formatting functions.
* **CURRENT STATE**: Phase 1
* **INVESTMENT POSTURE**: Open Source / ICU Libraries

### 9. RTL Layout Management
* **CAPABILITY ID**: `XCC-LOC-003`
* **CANONICAL NAME**: Right-to-Left View Formatting
* **ARABIC NAME**: إدارة التنسيق البصري من اليمين إلى اليسار
* **DEFINITION**: The ability to apply Right-to-Left (RTL) visual orientation state to user interface screens, navigation flows, and visual charts.
* **SERVING DOMAINS**: All L1 Presentation Layers.
* **PRIMARY OWNER**: LOC — Localization and Accessibility
* **SHARED KERNEL CANDIDATE**: YES — UI layout contract.
* **GENERIC SUBDOMAIN CANDIDATE**: YES — CSS/RTL layout frameworks.
* **ALSO TECHNICAL CONCERN**: YES — frontend layout rendering.
* **CURRENT STATE**: Phase 1
* **INVESTMENT POSTURE**: Open Source / CSS Frameworks

### 10. Universal Search
* **CAPABILITY ID**: `XCC-SCH-001`
* **CANONICAL NAME**: Cross-Domain Universal Search
* **ARABIC NAME**: البحث الشامل عبر النطاقات
* **DEFINITION**: The ability to execute unified keyword searches across instruments, news items, research reports, and user watchlists.
* **SERVING DOMAINS**: MKT, RES, AI, PRT, RPT.
* **PRIMARY OWNER**: MKT — Market Intelligence
* **SHARED KERNEL CANDIDATE**: YES — search query interface contract.
* **GENERIC SUBDOMAIN CANDIDATE**: YES — search indexing service candidate.
* **ALSO TECHNICAL CONCERN**: YES — search index synchronization.
* **CURRENT STATE**: Phase 1
* **INVESTMENT POSTURE**: Open Source / Enterprise Search Engine

### 11. Content Search
* **CAPABILITY ID**: `XCC-SCH-002`
* **CANONICAL NAME**: Deep Financial Document Search
* **ARABIC NAME**: البحث المتقدم في المستندات المالية
* **DEFINITION**: The ability to perform full-text and semantic vector searches across corporate financial disclosures, PDF earnings reports, and news archives.
* **SERVING DOMAINS**: RES, AI, RPT.
* **PRIMARY OWNER**: RES — Financial Research
* **SHARED KERNEL CANDIDATE**: NO.
* **GENERIC SUBDOMAIN CANDIDATE**: YES — vector search infrastructure.
* **ALSO TECHNICAL CONCERN**: YES — vector index retrieval.
* **CURRENT STATE**: Phase 1
* **INVESTMENT POSTURE**: Build on Open Source Vector Search

### 12. Feature Flag Management
* **CAPABILITY ID**: `XCC-OPS-001`
* **CANONICAL NAME**: Dynamic Feature Toggle Governance
* **ARABIC NAME**: إدارة وتفعيل الميزات الديناميكية
* **DEFINITION**: The ability to dynamically enable, disable, or target specific platform capabilities per user tier or region without downtime.
* **SERVING DOMAINS**: All L1 Domains.
* **PRIMARY OWNER**: OPS — Platform Operations and Governance
* **SHARED KERNEL CANDIDATE**: YES — feature evaluation state contract.
* **GENERIC SUBDOMAIN CANDIDATE**: YES — feature management service candidate.
* **ALSO TECHNICAL CONCERN**: YES — runtime configuration evaluation.
* **CURRENT STATE**: Phase 1
* **INVESTMENT POSTURE**: Buy / Open Source Feature Management

### 13. System Configuration Management
* **CAPABILITY ID**: `XCC-OPS-002`
* **CANONICAL NAME**: Centralized System Parameter Governance
* **ARABIC NAME**: إدارة الإعدادات المركزية للنظام
* **DEFINITION**: The ability to manage global system operational parameters, rate limits, market session overrides, and fee schedules centrally.
* **SERVING DOMAINS**: All L1 Domains.
* **PRIMARY OWNER**: OPS — Platform Operations and Governance
* **SHARED KERNEL CANDIDATE**: YES — central configuration contract.
* **GENERIC SUBDOMAIN CANDIDATE**: YES — configuration store candidate.
* **ALSO TECHNICAL CONCERN**: YES — dynamic configuration distribution.
* **CURRENT STATE**: Phase 1
* **INVESTMENT POSTURE**: Build internally

---

### Cross-Cutting Capability Architecture Analysis

1. **Shared Kernel Candidates**: `XCC-AUTH-001` (Authentication), `XCC-AUTH-002` (Authorization), `XCC-LOC-001` (Localization), `XCC-LOC-002` (Formatting), `XCC-AUD-001` (Audit Logging), and `XCC-OPS-001` (Feature Flags) represent strong Shared Kernel candidates. In Domain-Driven Design (DDD), these contracts must be tightly governed and shared across Bounded Context boundaries to maintain platform-wide consistency.
2. **Generic Subdomain Candidates (Buy vs. Build)**: `XCC-AUTH-001` (Identity Authentication), `XCC-NTF-001` (Notification Dispatch), `XCC-SCH-001` (Universal Search), and `XCC-OPS-001` (Feature Flags) are Generic Subdomains where standard open-source tools or third-party cloud services should be leveraged, allowing Tradeora's core engineering capital to focus strictly on differentiating financial AI capabilities.
3. **Capabilities Flagged `ALSO TECHNICAL CONCERN`**: All 13 cross-cutting capabilities carry an `ALSO TECHNICAL CONCERN` flag. While documented here to ensure complete business capability modeling, their concrete technical mechanisms (e.g., OAuth tokens, push gateways, vector indices, feature toggle proxies) will be specified during Phase C (Technology Architecture).

---

## SECTION 5 — CAPABILITY HEAT MAP

The Capability Heat Map prioritizes capabilities for capital allocation, phase planning, and architecture focus.

```
SORT ORDER: Business Criticality (DESC), Strategic Importance (DESC)
```

| Capability ID | Capability Name | L1 Domain | Strategic Importance | Business Criticality | Investment Posture | Current State | Status | Unique Differentiator? | Dependency Count |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AI-REC-001** | Explainable Recommendation Generation | AI | Core Differentiating | Mission Critical | Invest Heavily | Phase 1 | Active | YES | 3 |
| **AI-REC-002** | Recommendation Confidence Calibration | AI | Core Differentiating | Mission Critical | Invest Heavily | Phase 1 | Active | YES | 1 |
| **RSK-PRF-001** | User Risk Tolerance Profiling | RSK | Core Differentiating | Mission Critical | Invest Heavily | Phase 1 | Active | YES | 1 |
| **RSK-ANL-001** | Value-at-Risk (VaR) Modeling | RSK | Core Differentiating | Mission Critical | Invest Heavily | Phase 1 | Active | YES | 2 |
| **LOC-LNG-001** | Bilingual Dynamic Text Localization | LOC | Core Differentiating | Mission Critical | Invest Heavily | Phase 1 | Active | YES | 0 |
| **LOC-LNG-002** | Right-to-Left (RTL) Layout Management | LOC | Core Differentiating | Mission Critical | Invest Heavily | Phase 1 | Active | YES | 1 |
| **MKT-DAT-001** | Real-Time Market Data Ingestion | MKT | Core Enabling | Mission Critical | Invest Adequately | Phase 1 | Active | NO | 2 |
| **MKT-DAT-002** | Market Data Distribution | MKT | Core Enabling | Mission Critical | Invest Adequately | Phase 1 | Active | NO | 2 |
| **MKT-SEC-001** | Security Master Registry Management | MKT | Core Enabling | Mission Critical | Invest Adequately | Phase 1 | Active | NO | 0 |
| **MKT-CAL-001** | Exchange Trading Calendar Management | MKT | Core Enabling | Mission Critical | Invest Adequately | Phase 1 | Active | NO | 0 |
| **PRT-TRK-001** | Multi-Asset Position Accounting | PRT | Core Enabling | Mission Critical | Invest Adequately | Phase 1 | Active | NO | 2 |
| **PRT-FX-001** | Multi-Currency Valuation Conversion | PRT | Core Enabling | Mission Critical | Invest Adequately | Phase 1 | Active | NO | 1 |
| **ENG-ALT-002** | Risk Breach Alert Dispatch | ENG | Core Differentiating | Mission Critical | Invest Heavily | Phase 1 | Active | YES | 2 |
| **IDN-PRF-001** | User Profile Registration & Onboarding | IDN | Supporting | Mission Critical | Invest Adequately | Phase 1 | Active | NO | 0 |
| **ENT-SUB-001** | Subscription Tier Entitlement Enforcement | ENT | Supporting | Mission Critical | Invest Adequately | Phase 1 | Active | NO | 1 |
| **OPS-GOV-001** | Immutable Audit Event Logging | OPS | Supporting | Mission Critical | Invest Adequately | Phase 1 | Active | NO | 0 |
| **OPS-GOV-002** | System Data Stream Health Monitoring | OPS | Supporting | Mission Critical | Invest Adequately | Phase 1 | Active | NO | 1 |
| **LOC-LNG-003** | Cultural Date & Number Formatting | LOC | Core Enabling | Mission Critical | Invest Adequately | Phase 1 | Active | NO | 1 |
| **RES-FND-001** | Financial Statement Standardization | RES | Core Differentiating | Business Critical | Invest Heavily | Phase 1 | Active | YES | 1 |
| **RES-FND-002** | Earnings Intelligence Parsing | RES | Core Differentiating | Business Critical | Invest Heavily | Phase 1 | Active | YES | 1 |
| **RES-FND-003** | Fair Value DCF Modeling | RES | Core Differentiating | Business Critical | Invest Heavily | Phase 1 | Active | YES | 1 |
| **RES-MAC-003** | News Sentiment Scoring | RES | Core Differentiating | Business Critical | Invest Heavily | Phase 1 | Active | YES | 1 |
| **AI-RES-001** | Equity Research Report Synthesis | AI | Core Differentiating | Business Critical | Invest Heavily | Phase 1 | Active | YES | 3 |
| **RSK-ANL-003** | Drawdown Stress-Testing | RSK | Core Differentiating | Business Critical | Invest Heavily | Phase 1 | Active | YES | 1 |
| **MKT-DAT-003** | Technical Indicator Computation | MKT | Core Enabling | Business Critical | Invest Adequately | Phase 1 | Active | NO | 1 |
| **MKT-SEC-002** | Corporate Action Tracking | MKT | Core Enabling | Business Critical | Invest Adequately | Phase 1 | Active | NO | 1 |
| **MKT-CAL-002** | Circuit Breaker Tracking | MKT | Core Enabling | Business Critical | Invest Adequately | Phase 1 | Active | NO | 2 |
| **RES-MAC-001** | Economic Indicator Tracking | RES | Core Enabling | Business Critical | Invest Adequately | Phase 1 | Active | NO | 0 |
| **RES-MAC-002** | Financial News Media Ingestion | RES | Core Enabling | Business Critical | Invest Adequately | Phase 1 | Active | YES | 1 |
| **AI-REC-003** | Quantitative Signal Generation | AI | Core Enabling | Business Critical | Invest Adequately | Phase 1 | Active | NO | 1 |
| **PRT-TRK-002** | Historical Transaction Recording | PRT | Core Enabling | Business Critical | Invest Adequately | Phase 1 | Active | NO | 1 |
| **PRT-PRF-001** | Time-Weighted Return Calculation | PRT | Core Enabling | Business Critical | Invest Adequately | Phase 1 | Active | NO | 1 |
| **PRT-PRF-002** | Benchmark Comparison Evaluation | PRT | Core Enabling | Business Critical | Invest Adequately | Phase 1 | Active | NO | 2 |
| **PRT-WTC-002** | Dynamic Multi-Variable Screening | PRT | Core Enabling | Business Critical | Invest Adequately | Phase 1 | Active | YES | 3 |
| **RSK-ANL-002** | Sector Concentration Stress-Testing | RSK | Core Enabling | Business Critical | Invest Adequately | Phase 1 | Active | NO | 2 |
| **ENG-ALT-001** | Price & Volatility Alert Evaluation | ENG | Supporting | Business Critical | Invest Adequately | Phase 1 | Active | NO | 1 |
| **IDN-PRF-002** | Locale & Language Preference Management | IDN | Core Differentiating | Business Critical | Invest Adequately | Phase 1 | Active | YES | 2 |
| **ENT-SUB-002** | API Volume Quota Enforcement | ENT | Supporting | Business Critical | Invest Adequately | Phase 1 | Active | NO | 1 |
| **RES-SEC-001** | Sector Heatmap Aggregation | RES | Core Enabling | Operationally Important | Invest Adequately | Phase 1 | Active | NO | 2 |
| **AI-RES-002** | Daily Market Brief Compilation | AI | Core Differentiating | Operationally Important | Invest Heavily | Phase 1 | Active | YES | 2 |
| **PRT-WTC-001** | Custom Watchlist Management | PRT | Supporting | Operationally Important | Invest Adequately | Phase 1 | Active | NO | 1 |
| **RPT-GEN-001** | Portfolio Statement Generation | RPT | Supporting | Operationally Important | Invest Adequately | Phase 1 | Active | YES | 3 |
| **RPT-GEN-002** | Equity Research Export Compilation | RPT | Supporting | Operationally Important | Invest Adequately | Phase 1 | Active | YES | 2 |
| **RES-SEC-002** | Cross-Market Spread Analysis | RES | Core Differentiating | Operationally Important | Invest Heavily | Phase 2 | Planned | YES | 2 |
| **EXC-SOR-001** | Broker Order Parameter Routing | EXC | Core Enabling | Operationally Important | Invest Adequately | Phase 2 | Planned | NO | 2 |
| **WLT-REB-001** | Tax-Aware Rebalancing Plan Synthesis | WLT | Core Differentiating | Operationally Important | Invest Heavily | Phase 2 | Planned | YES | 2 |
| **ADV-COP-001** | Financial Advisor Client Copilot Workflows | ADV | Core Differentiating | Operationally Important | Invest Heavily | Phase 2 | Planned | YES | 3 |

---

### Heat Map Executive Summary

**Paragraph 1: Top 5 Mission-Critical Phase 1 Capabilities**  
The Phase 1 EGX launch depends unconditionally on five foundational mission-critical capabilities: **Real-Time Market Data Ingestion (`MKT-DAT-001`)**, **Security Master Registry Management (`MKT-SEC-001`)**, **Multi-Asset Position Accounting (`PRT-TRK-001`)**, **Explainable Recommendation Generation (`AI-REC-001`)**, and **User Risk Tolerance Profiling (`RSK-PRF-001`)**. Without verified market data ingestion and an authoritative security master registry, downstream financial analytics cannot function. Without position accounting and risk profiling, recommendations cannot meet legal suitability boundaries. These five capabilities form the non-negotiable core required for commercial launch on the Egyptian Exchange.

**Paragraph 2: Top 3 Differentiating Capabilities Setting Tradeora Apart**  
Tradeora establishes its regional market leadership through three core differentiating capabilities: **Explainable Recommendation Generation (`AI-REC-001`)**, **Financial Statement Standardization (`RES-FND-001`)**, and **Bilingual Dynamic Text Localization (`LOC-LNG-001`)**. Unlike legacy portals offering delayed static tables or speculative unexplainable stock tips, Tradeora delivers fully explainable AI recommendations backed by transparent mathematical assumptions, automated Arabic/English financial statement parsing for Egyptian Accounting Standards (EAS), and native RTL Arabic language parity. This combination creates an unmatched competitive moat in Arab capital markets.

**Paragraph 3: Commodity Capabilities Sourced Externally (Generic Subdomains)**  
To maximize engineering focus on core AI differentiators, commodity supporting capabilities are assigned a *Buy* or *Open Source* investment posture as Generic Subdomains. Specifically, **User Identity Authentication (`XCC-AUTH-001`)**, **Multi-Channel Message Dispatch (`XCC-NTF-001`)**, **Universal Search (`XCC-SCH-001`)**, and **Dynamic Feature Toggle Governance (`XCC-OPS-001`)** leverage proven standard frameworks and managed cloud services. This strategic sourcing posture ensures Tradeora maintains low operating overhead while directing capital heavily into proprietary financial intelligence models.

---

## SECTION 6 — CAPABILITY DEPENDENCY MAP

This section documents the 20 most critical capability dependencies across Tradeora.

```
DEPENDENCY TYPES:
  HARD        — Capability A cannot function at all without Capability B being active.
  SOFT        — Capability A functions in a degraded mode without Capability B.
  CONDITIONAL — Capability A depends on Capability B only under specific operational conditions.
```

### 20 Critical Capability Dependencies

1. **CAPABILITY**: `AI-REC-001` (Explainable Recommendation Generation)  
   **DEPENDS ON**: `RSK-PRF-001` (HARD), `RES-FND-003` (HARD), `PRT-TRK-001` (SOFT)  
   **DEPENDED ON BY**: `AI-RES-001`, `ENG-ALT-002`, `ADV-COP-001`  
   **DEPENDENCY TYPE**: HARD  
   **DEPENDENCY CHAIN**: `MKT-SEC-001` → `RES-FND-001` → `RES-FND-003` → `AI-REC-001` → `ENG-ALT-002`

2. **CAPABILITY**: `RSK-ANL-001` (Value-at-Risk Modeling)  
   **DEPENDS ON**: `PRT-TRK-001` (HARD), `MKT-DAT-002` (HARD)  
   **DEPENDED ON BY**: `ENG-ALT-002`, `RSK-ANL-003`, `WLT-REB-001`  
   **DEPENDENCY TYPE**: HARD  
   **DEPENDENCY CHAIN**: `MKT-DAT-001` → `MKT-DAT-002` → `PRT-TRK-001` → `RSK-ANL-001` → `ENG-ALT-002`

3. **CAPABILITY**: `RES-FND-003` (Fair Value DCF Modeling)  
   **DEPENDS ON**: `RES-FND-001` (HARD)  
   **DEPENDED ON BY**: `AI-REC-001`, `RPT-GEN-002`  
   **DEPENDENCY TYPE**: HARD  
   **DEPENDENCY CHAIN**: `MKT-SEC-001` → `RES-FND-001` → `RES-FND-003` → `AI-REC-001`

4. **CAPABILITY**: `RES-FND-001` (Financial Statement Standardization)  
   **DEPENDS ON**: `MKT-SEC-001` (HARD)  
   **DEPENDED ON BY**: `RES-FND-002`, `RES-FND-003`, `AI-RES-001`, `PRT-WTC-002`  
   **DEPENDENCY TYPE**: HARD  
   **DEPENDENCY CHAIN**: `MKT-SEC-001` → `RES-FND-001` → `RES-FND-003`

5. **CAPABILITY**: `PRT-TRK-001` (Multi-Asset Position Accounting)  
   **DEPENDS ON**: `MKT-DAT-002` (HARD), `MKT-SEC-001` (HARD)  
   **DEPENDED ON BY**: `PRT-PRF-001`, `PRT-FX-001`, `RSK-ANL-001`, `RPT-GEN-001`  
   **DEPENDENCY TYPE**: HARD  
   **DEPENDENCY CHAIN**: `MKT-SEC-001` → `PRT-TRK-001` → `PRT-PRF-001` → `PRT-PRF-002`

6. **CAPABILITY**: `MKT-DAT-002` (Market Data Distribution)  
   **DEPENDS ON**: `MKT-DAT-001` (HARD), `ENT-SUB-001` (SOFT)  
   **DEPENDED ON BY**: `MKT-DAT-003`, `PRT-TRK-001`, `RSK-ANL-001`, `PRT-WTC-002`  
   **DEPENDENCY TYPE**: HARD  
   **DEPENDENCY CHAIN**: `MKT-DAT-001` → `MKT-DAT-002` → `MKT-DAT-003` → `AI-REC-003`

7. **CAPABILITY**: `ENG-ALT-002` (Risk Breach Alert Dispatch)  
   **DEPENDS ON**: `RSK-ANL-001` (HARD), `RSK-ANL-002` (SOFT)  
   **DEPENDED ON BY**: None (Leaf capability)  
   **DEPENDENCY TYPE**: HARD  
   **DEPENDENCY CHAIN**: `PRT-TRK-001` → `RSK-ANL-001` → `ENG-ALT-002`

8. **CAPABILITY**: `PRT-PRF-001` (Time-Weighted Return Calculation)  
   **DEPENDS ON**: `PRT-TRK-001` (HARD)  
   **DEPENDED ON BY**: `PRT-PRF-002`, `RPT-GEN-001`  
   **DEPENDENCY TYPE**: HARD  
   **DEPENDENCY CHAIN**: `PRT-TRK-001` → `PRT-PRF-001` → `PRT-PRF-002`

9. **CAPABILITY**: `PRT-PRF-002` (Benchmark Comparison Evaluation)  
   **DEPENDS ON**: `PRT-PRF-001` (HARD), `MKT-DAT-002` (HARD)  
   **DEPENDED ON BY**: None (Leaf capability)  
   **DEPENDENCY TYPE**: HARD  
   **DEPENDENCY CHAIN**: `PRT-TRK-001` → `PRT-PRF-001` → `PRT-PRF-002`

10. **CAPABILITY**: `AI-RES-001` (Equity Research Report Synthesis)  
    **DEPENDS ON**: `RES-FND-001` (HARD), `RES-FND-003` (HARD), `RES-MAC-003` (SOFT)  
    **DEPENDED ON BY**: `RPT-GEN-002`, `ADV-COP-001`  
    **DEPENDENCY TYPE**: HARD  
    **DEPENDENCY CHAIN**: `RES-FND-001` → `RES-FND-003` → `AI-RES-001` → `RPT-GEN-002`

11. **CAPABILITY**: `PRT-WTC-002` (Dynamic Multi-Variable Screening)  
    **DEPENDS ON**: `MKT-DAT-003` (HARD), `RES-FND-001` (HARD), `AI-REC-002` (SOFT)  
    **DEPENDED ON BY**: None (Leaf capability)  
    **DEPENDENCY TYPE**: HARD  
    **DEPENDENCY CHAIN**: `RES-FND-001` → `PRT-WTC-002`

12. **CAPABILITY**: `RSK-PRF-001` (User Risk Tolerance Profiling)  
    **DEPENDS ON**: `IDN-PRF-001` (HARD)  
    **DEPENDED ON BY**: `AI-REC-001`, `ADV-COP-001`  
    **DEPENDENCY TYPE**: HARD  
    **DEPENDENCY CHAIN**: `IDN-PRF-001` → `RSK-PRF-001` → `AI-REC-001`

13. **CAPABILITY**: `MKT-DAT-001` (Real-Time Market Data Ingestion)  
    **DEPENDS ON**: `MKT-CAL-001` (HARD), `MKT-SEC-001` (HARD)  
    **DEPENDED ON BY**: `MKT-DAT-002`, `MKT-CAL-002`, `ENG-ALT-001`  
    **DEPENDENCY TYPE**: HARD  
    **DEPENDENCY CHAIN**: `MKT-SEC-001` → `MKT-DAT-001` → `MKT-DAT-002`

14. **CAPABILITY**: `MKT-CAL-002` (Circuit Breaker Tracking)  
    **DEPENDS ON**: `MKT-DAT-001` (HARD), `MKT-CAL-001` (HARD)  
    **DEPENDED ON BY**: None (Leaf capability)  
    **DEPENDENCY TYPE**: HARD  
    **DEPENDENCY CHAIN**: `MKT-CAL-001` → `MKT-DAT-001` → `MKT-CAL-002`

15. **CAPABILITY**: `RPT-GEN-001` (Portfolio Statement Generation)  
    **DEPENDS ON**: `PRT-TRK-001` (HARD), `PRT-PRF-001` (HARD), `LOC-LNG-001` (SOFT)  
    **DEPENDED ON BY**: None (Leaf capability)  
    **DEPENDENCY TYPE**: HARD  
    **DEPENDENCY CHAIN**: `PRT-TRK-001` → `PRT-PRF-001` → `RPT-GEN-001`

16. **CAPABILITY**: `RPT-GEN-002` (Equity Research Export Compilation)  
    **DEPENDS ON**: `AI-RES-001` (HARD), `RES-FND-003` (HARD)  
    **DEPENDED ON BY**: None (Leaf capability)  
    **DEPENDENCY TYPE**: HARD  
    **DEPENDENCY CHAIN**: `RES-FND-003` → `AI-RES-001` → `RPT-GEN-002`

17. **CAPABILITY**: `WLT-REB-001` (Tax-Aware Rebalancing Plan Synthesis)  
    **DEPENDS ON**: `PRT-TRK-001` (HARD), `RSK-ANL-001` (HARD)  
    **DEPENDED ON BY**: None (Leaf capability)  
    **DEPENDENCY TYPE**: HARD  
    **DEPENDENCY CHAIN**: `PRT-TRK-001` → `RSK-ANL-001` → `WLT-REB-001`

18. **CAPABILITY**: `ADV-COP-001` (Financial Advisor Client Copilot Workflows)  
    **DEPENDS ON**: `AI-REC-001` (HARD), `RSK-PRF-001` (HARD), `RPT-GEN-001` (SOFT)  
    **DEPENDED ON BY**: None (Leaf capability)  
    **DEPENDENCY TYPE**: HARD  
    **DEPENDENCY CHAIN**: `AI-REC-001` → `ADV-COP-001`

19. **CAPABILITY**: `PRT-FX-001` (Multi-Currency Valuation Conversion)  
    **DEPENDS ON**: `PRT-TRK-001` (HARD)  
    **DEPENDED ON BY**: `RES-SEC-002`  
    **DEPENDENCY TYPE**: HARD  
    **DEPENDENCY CHAIN**: `PRT-TRK-001` → `PRT-FX-001` → `RES-SEC-002`

20. **CAPABILITY**: `EXC-SOR-001` (Broker Order Parameter Routing)  
    **DEPENDS ON**: `MKT-SEC-001` (HARD), `IDN-PRF-001` (HARD)  
    **DEPENDED ON BY**: None (Leaf capability)  
    **DEPENDENCY TYPE**: CONDITIONAL  
    **DEPENDENCY CHAIN**: `MKT-SEC-001` → `EXC-SOR-001`

---

### Dependency Analysis Reports

#### FOUNDATIONAL 5 (Highest "Depended On By" Count)
1. **`MKT-SEC-001` (Security Master Registry Management)** — Depended on by 8 capabilities. Must be built first.
2. **`PRT-TRK-001` (Multi-Asset Position Accounting)** — Depended on by 7 capabilities. Core ledger prerequisite.
3. **`MKT-DAT-002` (Market Data Distribution)** — Depended on by 6 capabilities. Core pricing prerequisite.
4. **`RES-FND-001` (Financial Statement Standardization)** — Depended on by 5 capabilities. Fundamental analysis prerequisite.
5. **`RSK-PRF-001` (User Risk Tolerance Profiling)** — Depended on by 4 capabilities. Mandatory suitability prerequisite.

#### CIRCULAR DEPENDENCIES CHECK
* **STATUS**: **CONFIRMED — 0 CIRCULAR DEPENDENCIES DETECTED**.
* The dependency graph is a strictly directed acyclic graph (DAG). Downstream analytical engines consume foundational reference data; no foundational capability depends on downstream analytical outputs.

#### CRITICAL DEPENDENCY CHAINS
* **Longest Dependency Chain**: `MKT-SEC-001` → `RES-FND-001` → `RES-FND-003` → `AI-REC-001` → `ADV-COP-001` (Chain Length: 5 Nodes).
* **Failure Cascade Risk**: A failure in `MKT-SEC-001` cascades across 5 levels, disabling financial statements, DCF models, AI recommendations, and advisor workflows. `MKT-SEC-001` requires active-active operational redundancy.

---

## SECTION 7 — CAPABILITY TRACEABILITY MATRIX

This matrix establishes the Golden Thread linking every business capability to Domain Boundaries, Business Rules, Business Objects, Business Events, Value Streams, User Profiles, and User Goals.

```
MATRIX SIZE: 50 Mandatory Rows.
```

| Capability ID | Capability Name | Domain Boundary | Business Rules | Business Objects | Business Events | Value Stream | Primary Persona | User Goal |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MKT-DAT-001** | Real-Time Market Data Ingestion | Market Data Domain | Rule 8, Rule 18 | Price, Instrument | Price Tick Received | Data Ingestion | Active Trader | Receive verified quote feeds |
| **MKT-DAT-002** | Market Data Distribution | Market Data Domain | Rule 7, Rule 20 | Price, Instrument | EOD Prices Published | Data Ingestion | All User Profiles | View current market prices |
| **MKT-DAT-003** | Technical Indicator Computation | Market Data Domain | Rule 40 | Price, AISignal | Price Tick Received | Technical Analysis | Active Trader | Analyze chart indicators |
| **MKT-SEC-001** | Security Master Registry Management | Market Data Domain | Rule 27, Rule 28 | Instrument, Asset, ISIN | Market Added to Platform | Data Ingestion | Platform Admin | Resolve instrument tickers |
| **MKT-SEC-002** | Corporate Action Tracking | Market Data Domain | Rule 9, Rule 22 | CorporateAction, Price | Corporate Action Processed | Data Ingestion | Long-Term Investor | Preserve split chart history |
| **MKT-CAL-001** | Exchange Trading Calendar Management | Market Data Domain | Rule 8, Rule 30 | MarketCalendar, Exchange | Market Session Opens | Data Ingestion | System | Enforce market session hours |
| **MKT-CAL-002** | Circuit Breaker Tracking | Market Data Domain | Rule 39 | MarketSession, Price | Price Tick Received | Data Ingestion | Active Trader | Monitor trading halt status |
| **RES-FND-001** | Financial Statement Standardization | Financial Research | Rule 15, Rule 35 | FinancialStatement, Asset | Earnings Report Released | Research Synthesis | Research Analyst | Evaluate balance sheet ratios |
| **RES-FND-002** | Earnings Intelligence Parsing | Financial Research | Rule 7 | EarningsReport, Asset | Earnings Report Released | Research Synthesis | Active Trader | Extract earnings surprise % |
| **RES-FND-003** | Fair Value DCF Modeling | Financial Research | Rule 26 | FairValueModel, Asset | Earnings Report Released | Strategy Synthesis | Long-Term Investor | Calculate DCF fair value |
| **RES-MAC-001** | Economic Indicator Tracking | Financial Research | Rule 7 | EconomicIndicator | Economic Data Published | Macro Research | Fund Manager | Track CBE interest rate trends |
| **RES-MAC-002** | Financial News Media Ingestion | Financial Research | Rule 16 | NewsItem, Asset | News Item Published | Intelligence Synthesis | Beginner Investor | Read tagged financial news |
| **RES-MAC-003** | News Sentiment Scoring | Financial Research | Rule 16 | SentimentScore, NewsItem | News Item Published | Intelligence Synthesis | Active Trader | Quantify news sentiment score |
| **RES-SEC-001** | Sector Heatmap Aggregation | Financial Research | Rule 28 | Sector, Asset | EOD Prices Published | Sector Analysis | Portfolio Manager | Track sector capital flows |
| **RES-SEC-002** | Cross-Market Spread Analysis | Financial Research | Rule 12 | Instrument, ExchangeRate | Cross-Market Signal | Macro Research | Institutional User | Monitor dual-listed stock spreads |
| **AI-REC-001** | Explainable Recommendation Generation | AI Intelligence | Rule 1, Rule 3, Rule 13 | Recommendation | AI Recommendation Generated | AI Recommendations | Beginner Investor | Get tailored investment advice |
| **AI-REC-002** | Recommendation Confidence Calibration | AI Intelligence | Rule 1, Rule 38 | ConfidenceScore | AI Recommendation Generated | AI Recommendations | All User Profiles | Inspect AI uncertainty score |
| **AI-REC-003** | Quantitative Signal Generation | AI Intelligence | Rule 40 | AISignal, Instrument | Price Tick Received | Signal Generation | Active Trader | Identify technical chart setups |
| **AI-RES-001** | Equity Research Report Synthesis | AI Intelligence | Rule 1, Rule 7 | ResearchReport, Asset | Earnings Report Released | Research Synthesis | Wealth Manager | Read automated research reports |
| **AI-RES-002** | Daily Market Brief Compilation | AI Intelligence | Rule 19 | MarketBrief, UserProfile | Market Session Opens | Intelligence Synthesis | Long-Term Investor | Read daily pre-market brief |
| **PRT-TRK-001** | Multi-Asset Position Accounting | Portfolio Domain | Rule 4, Rule 5, Rule 25 | Portfolio, Position | User Portfolio Updated | Portfolio Intelligence | Portfolio Manager | Track net asset value (NAV) |
| **PRT-TRK-002** | Historical Transaction Recording | Portfolio Domain | Rule 2, Rule 4 | HistoricalTrade, Portfolio | User Portfolio Updated | Portfolio Intelligence | Individual Investor | Audit historical buy/sell log |
| **PRT-PRF-001** | Time-Weighted Return Calculation | Portfolio Domain | Rule 4 | Portfolio, Position | Portfolio Value Changed | Performance Attribution | Portfolio Manager | Measure true TWR return |
| **PRT-PRF-002** | Benchmark Comparison Evaluation | Portfolio Domain | Rule 14 | Benchmark, Portfolio | Benchmark Crossed | Performance Attribution | Fund Manager | Compare portfolio vs EGX30 |
| **PRT-FX-001** | Multi-Currency Valuation Conversion | Portfolio Domain | Rule 11, Rule 12, Rule 37| Currency, ExchangeRate | Currency Rate Updated | Portfolio Intelligence | Wealth Manager | Value foreign assets in EGP |
| **PRT-WTC-001** | Custom Watchlist Management | Portfolio Domain | Rule 27 | Watchlist, Instrument | Watchlist Alert Fired | Opportunity Discovery | All User Profiles | Monitor prospective stocks |
| **PRT-WTC-002** | Dynamic Multi-Variable Screening | Portfolio Domain | Rule 28 | Instrument, Sector | EOD Prices Published | Opportunity Discovery | Active Trader | Filter stocks by P/E & RSI |
| **RSK-PRF-001** | User Risk Tolerance Profiling | Risk Domain | Rule 6, Rule 17 | RiskProfile, UserProfile | New User Registered | Onboarding & Profiling | Beginner Investor | Establish legal risk tolerance |
| **RSK-ANL-001** | Value-at-Risk (VaR) Modeling | Risk Domain | Rule 6 | RiskProfile, Portfolio | Risk Alert Triggered | Real-Time Risk Engine | Portfolio Manager | Calculate portfolio 95% VaR |
| **RSK-ANL-002** | Sector Concentration Stress-Testing | Risk Domain | Rule 6, Rule 28 | Portfolio, Sector | Portfolio Value Changed | Real-Time Risk Engine | Wealth Advisor | Detect sector concentration |
| **RSK-ANL-003** | Drawdown Stress-Testing | Risk Domain | Rule 6, Rule 36 | Portfolio, RiskProfile | Risk Alert Triggered | Real-Time Risk Engine | Fund Manager | Simulate historical crash impact |
| **ENG-ALT-001** | Price & Volatility Alert Evaluation | Alert Domain | Rule 29 | Alert, Notification | Watchlist Alert Fired | Alert & Notification | Active Trader | Get instant price limit alert |
| **ENG-ALT-002** | Risk Breach Alert Dispatch | Alert Domain | Rule 29, Rule 36 | Alert, RiskProfile | Risk Alert Triggered | Alert & Notification | Portfolio Manager | Receive urgent VaR alert |
| **IDN-PRF-001** | User Profile Registration & Onboarding | User Identity | Rule 20, Rule 32 | UserProfile | New User Registered | User Onboarding | All User Profiles | Register Tradeora account |
| **IDN-PRF-002** | Locale & Language Preference Management | User Identity | Rule 19, Rule 21 | Locale, UserProfile | UserProfile Updated | User Onboarding | All User Profiles | Switch UI to Arabic |
| **ENT-SUB-001** | Subscription Tier Entitlement Enforcement | Subscription Domain | Rule 20 | Subscription, UserProfile | Subscription Changed | Platform Entitlement | Platform Admin | Enforce premium feature tier |
| **ENT-SUB-002** | API Volume Quota Enforcement | Subscription Domain | Rule 20 | Subscription | Subscription Changed | Platform Entitlement | Enterprise User | Manage enterprise API quota |
| **RPT-GEN-001** | Portfolio Statement Generation | Reporting Domain | Rule 4, Rule 11 | Portfolio, UserProfile | User Portfolio Updated | External Reporting | Wealth Manager | Export PDF client portfolio |
| **RPT-GEN-002** | Equity Research Export Compilation | Reporting Domain | Rule 1, Rule 7 | ResearchReport | Earnings Report Released | External Reporting | Research Analyst | Download equity research PDF |
| **OPS-GOV-001** | Immutable Audit Event Logging | Admin & Audit | Rule 24, Rule 32 | AuditLog, UserProfile | User Portfolio Updated | Compliance Governance | Compliance Officer | Inspect tamper-evident audit log |
| **OPS-GOV-002** | System Data Stream Health Monitoring | Admin & Audit | Rule 18, Rule 33 | DataSource | Data Feed Interrupted | Operational Governance | Platform Admin | Monitor quote stream latency |
| **LOC-LNG-001** | Bilingual Dynamic Text Localization | Localization Domain | Rule 19, Rule 21 | Locale | UserProfile Updated | Platform Accessibility | All User Profiles | View native Arabic text |
| **LOC-LNG-002** | Right-to-Left (RTL) Layout Management | Localization Domain | Rule 21 | Locale | UserProfile Updated | Platform Accessibility | All User Profiles | Render Arabic RTL layout |
| **LOC-LNG-003** | Cultural Date & Number Formatting | Localization Domain | Rule 11, Rule 19 | Locale, Currency | UserProfile Updated | Platform Accessibility | All User Profiles | View EGP formatted numbers |
| **EXC-SOR-001** | Broker Order Parameter Routing | Execution Domain (F) | Rule 3 | Order, Trade | User Portfolio Updated | Broker Execution | Active Trader | Route order to broker API |
| **WLT-REB-001** | Tax-Aware Rebalancing Plan Synthesis | Wealth Domain (F) | Rule 4, Rule 25 | Portfolio, Position | Portfolio Value Changed | Wealth Management | Wealth Manager | Generate tax-aware rebalance |
| **ADV-COP-001** | Financial Advisor Client Copilot Workflows | Advisory Domain (F) | Rule 1, Rule 23 | Recommendation | AI Recommendation Generated | Financial Advisory | Financial Advisor | Draft client advisory report |
| **XCC-AUTH-001** | User Identity Authentication | Identity (Shared) | Rule 32 | UserProfile | New User Registered | Security Access | All User Profiles | Authenticate identity |
| **XCC-AUTH-002** | Role-Based Authorization Enforcement | Identity (Shared) | Rule 20 | Subscription | Subscription Changed | Security Access | Compliance Officer | Enforce role permissions |
| **XCC-AUD-001** | System-Wide Audit Event Logging | Admin (Shared) | Rule 24 | AuditLog | User Portfolio Updated | Compliance Governance | Compliance Officer | Capture operation audit log |

---

### Traceability Matrix Analysis

1. **Capabilities Without Business Rules**: **NONE**. Every cataloged capability traces directly to at least one binding Business Rule from `BUSINESS_DOMAIN_DISCOVERY.md` Section 10.
2. **Passive Capabilities (No Event Triggers)**: `MKT-SEC-001` (Security Master Registry Management), `LOC-LNG-001` (Bilingual Text Localization), and `LOC-LNG-003` (Cultural Date Formatting) act as passive shared capabilities. They do not trigger outbound event streams; rather, they publish reference models and formatting contracts consumed by active capabilities.
3. **Value Stream Support Evaluation**: The *Data Ingestion & Security Master* (Stage 1) and *Portfolio Intelligence & Risk Engine* (Stage 5) value streams have the densest capability coverage (12 and 10 supporting capabilities respectively). The *Financial Advisory & Copilot Workflows* (Stage 8) value stream currently has fewer Phase 1 capabilities, as advanced advisory copilots are scheduled for Phase 2 expansion.

---

## SECTION 8 — CURRENT vs TARGET CAPABILITY STATE

This matrix compares the current operational state against 12-month (Phase 1 EGX Launch) and 36-month (Phase 2 MENA Expansion) target state horizons across all L2 capability areas.

| L2 Capability Area | Current State | Target State (12 Months - EGX Launch) | Target State (36 Months - MENA Expansion) | Capability Gap | Gap Severity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MKT-DAT**: Market Data Management | Not Exists | Full EGX Real-Time Tick & Quote Feed Ingestion | Multi-Exchange MENA Feed Ingestion (TADAWUL/DFM/ADX) | Multi-vendor feed normalization engine | BLOCKING |
| **MKT-SEC**: Security Master Management | Not Exists | Full EGX Security Master with ISIN Mappings | Global Security Master with Multi-Exchange Mappings | Master registry resolution database | BLOCKING |
| **MKT-CAL**: Market Calendar Management | Not Exists | Complete EGX Trading Calendar & Session Tracking | Multi-Exchange MENA Operating Calendars | Session state transition engine | BLOCKING |
| **RES-FND**: Fundamental Analysis | Not Exists | Automated EAS/IFRS Financial Statement Parsing & DCF | Multi-Currency Financial Statement Standardization | Arabic PDF document extraction parser | CRITICAL |
| **RES-MAC**: Macro & News Intelligence | Not Exists | CBE Macro Tracking & EGX News Sentiment Scoring | MENA Central Bank Tracking & Regional News Sentiment | Arabic financial NLP sentiment model | CRITICAL |
| **RES-SEC**: Sector & Cross-Market | Not Exists | EGX 18 Sector Heatmaps & Rotation Analytics | Cross-Market Spread & Dual-Listing Analytics | Cross-border correlation matrix engine | MODERATE |
| **AI-REC**: AI Recommendation Synthesis | Not Exists | Explainable EGX Recommendations & Calibration | Personalized Multi-Asset Portfolio Recommendations | Explainable AI recommendation synthesis engine | BLOCKING |
| **AI-RES**: Automated Research Synthesis | Not Exists | Automated EGX Equity Research Notes & Daily Briefs | Multi-Market Regional Equity Research Synthesis | Dual-language research report compiler | CRITICAL |
| **PRT-TRK**: Portfolio Ledger & Tracking | Not Exists | Multi-Asset EGX Position Accounting & NAV Ledger | Multi-Currency Global Portfolio Ledger | Multi-asset cost-basis accounting engine | BLOCKING |
| **PRT-PRF**: Performance Analytics | Not Exists | GIPS-Compliant TWR & EGX Benchmark Analytics | Multi-Currency Benchmark Attribution Engine | Time-weighted return calculation engine | CRITICAL |
| **PRT-FX**: Multi-Currency Accounting | Not Exists | EGP/USD Spot Rate Conversion Engine | Multi-Currency Spot/Forward FX Accounting Engine | Real-time FX conversion rate engine | CRITICAL |
| **PRT-WTC**: Watchlist & Screening | Not Exists | Custom Watchlists & Multi-Variable EGX Screener | Multi-Market Regional Stock Screener | Multi-variable screening filter engine | MODERATE |
| **RSK-PRF**: Risk Profiling | Not Exists | Interactive Investor Risk Tolerance Profiling | Dynamic Behavioral Risk Profiling | Suitability questionnaire evaluation model | BLOCKING |
| **RSK-ANL**: Quantitative Risk Analytics | Not Exists | Real-Time Portfolio VaR & Concentration Stress-Testing | Multi-Currency Cross-Asset Stress Testing Engine | Parametric/Historical VaR calculation engine | BLOCKING |
| **ENG-ALT**: Alert & Notification | Not Exists | Real-Time Price & Portfolio VaR Breach Alerts | Multi-Channel Predictive Notification Dispatch | Threshold evaluation alert dispatcher | CRITICAL |
| **IDN-PRF**: User Identity & Profile | Not Exists | Secure Identity Registration & Profile Management | Identity Federation (SSO/SAML) for Enterprise | Identity lifecycle & risk profiling store | BLOCKING |
| **ENT-SUB**: Subscription & Entitlement | Not Exists | SaaS Tier Entitlements & Market Data Gating | Enterprise Quotas & White-Label Billing Engine | Access entitlement enforcement gateway | BLOCKING |
| **RPT-GEN**: Reporting & Export | Not Exists | PDF/Excel Portfolio Statements & Research Exports | Customized Institutional & Tax Reporting Engine | Bilingual PDF report rendering compiler | MODERATE |
| **OPS-GOV**: Platform Operations | Not Exists | Immutable Audit Event Logging & Stream Monitoring | Enterprise Telemetry & Distributed Audit Explorer | Append-only audit logging engine | BLOCKING |
| **LOC-LNG**: Localization & Accessibility | Not Exists | Full Arabic/English Parity & RTL Layout Rendering | Multi-Region Locale & Multi-Calendar Engine | Bilingual i18n bundle & RTL rendering | BLOCKING |
| **EXC-SOR**: Trade Execution | Not Exists | Not Planned (Phase 1 Inactive) | Smart Order Routing to Licensed MENA Brokers | Execution API broker integration gateway | MINOR (Phase 1) |
| **WLT-REB**: Wealth Management | Not Exists | Not Planned (Phase 1 Inactive) | Automated Tax-Aware Rebalancing Plan Synthesis | Tax-aware rebalancing optimization model | MINOR (Phase 1) |
| **ADV-COP**: Advisory Services | Not Exists | Not Planned (Phase 1 Inactive) | Financial Advisor Copilot & Suitability Workspace | Advisor client report drafting copilot | MINOR (Phase 1) |

---

## SECTION 9 — CAPABILITY TO DOMAIN BOUNDARY MAPPING

This section maps every L2 capability area to its owning Bounded Context Domain Boundary from `BUSINESS_DOMAIN_DISCOVERY.md` Section 18.

```
RULE: Every capability belongs to exactly ONE primary owning domain boundary.
```

| L2 Capability Area | Owning Domain Boundary | Consuming Domain Boundaries | Core Capability of Owner? |
| :--- | :--- | :--- | :--- |
| **MKT-DAT**: Market Data Management | Market Data Domain | Portfolio, Risk, AI Intelligence, Alert, Screening | YES |
| **MKT-SEC**: Security Master Management | Market Data Domain | All Domains | YES |
| **MKT-CAL**: Market Calendar Management | Market Calendar Domain | Market Data, Risk, Alert, AI Intelligence | YES |
| **RES-FND**: Fundamental Analysis | Financial Research Domain | AI Intelligence, Reporting, Screening | YES |
| **RES-MAC**: Macro & News Intelligence | Financial Research Domain | AI Intelligence, Risk, Alert | YES |
| **RES-SEC**: Sector & Cross-Market | Financial Research Domain | Portfolio, Risk, AI Intelligence | YES |
| **AI-REC**: AI Recommendation Synthesis | AI Intelligence Domain | User Identity, Alert, Reporting, Advisory | YES |
| **AI-RES**: Automated Research Synthesis | AI Intelligence Domain | Reporting, User Identity, Advisory | YES |
| **PRT-TRK**: Portfolio Ledger & Tracking | Portfolio Domain | Risk, Reporting, Wealth Management | YES |
| **PRT-PRF**: Performance Analytics | Portfolio Domain | Reporting, Advisory, Wealth Management | YES |
| **PRT-FX**: Multi-Currency Accounting | Portfolio Domain | Reporting, Financial Research | YES |
| **PRT-WTC**: Watchlist & Screening | Portfolio Domain | Alert, User Identity | YES |
| **RSK-PRF**: Risk Profiling | Risk Domain | AI Intelligence, Portfolio, Advisory | YES |
| **RSK-ANL**: Quantitative Risk Analytics | Risk Domain | Alert, Portfolio, Wealth Management | YES |
| **ENG-ALT**: Alert & Notification | Alert and Notification Domain | User Identity, All Consuming Viewers | YES |
| **IDN-PRF**: User Identity & Profile | User and Identity Domain | All Domains | YES |
| **ENT-SUB**: Subscription & Entitlement | Subscription Domain | All Domains | YES |
| **RPT-GEN**: Reporting & Export | Reporting Domain | User Identity, Advisory | YES |
| **OPS-GOV**: Platform Operations | Administration & Audit Domain | All Domains | YES |
| **LOC-LNG**: Localization & Accessibility | Localization Domain | All Domain Presentation Layers | YES |
| **EXC-SOR**: Trade Execution | Execution Domain (Future) | Portfolio, User Identity | YES |
| **WLT-REB**: Wealth Management | Wealth Domain (Future) | Portfolio, Risk, Advisory | YES |
| **ADV-COP**: Advisory Services | Advisory Domain (Future) | User Identity, Reporting | YES |

---

### Domain Boundary Model Evaluation

* **Capabilities with No Clear Domain Owner (Domain Gaps)**: **NONE DETECTED**. Every L2 capability area maps cleanly to a declared domain boundary from Section 18.
* **Domains with No Mapped Capabilities (Phantom Domains)**: **NONE DETECTED**. All 14 domain boundaries established in `BUSINESS_DOMAIN_DISCOVERY.md` own at least one L2 capability area.

---

## SECTION 10 — CAPABILITY TO USER PROFILE MATRIX

This matrix maps L2 capability areas against all 10 user profiles from `PROJECT_CONSTITUTION.md` Section 9 and `BUSINESS_DOMAIN_DISCOVERY.md` Section 5.

```
CELL VALUES:
  PRIMARY   — This user profile is the primary intended consumer of this capability.
  SECONDARY — This profile utilizes this capability, but not as its primary workflow.
  FUTURE    — Planned to serve this profile in Phase 2 or Phase 3.
  N/A       — This user profile does not consume this capability.

THE 10 USER PROFILES:
  1. Beginner Investor | 2. Active Trader | 3. Long-Term Investor | 4. Portfolio Manager | 5. Wealth Advisor
  6. Fund Manager | 7. Researcher/Analyst | 8. Enterprise User | 9. Platform Administrator | 10. Compliance Officer
```

| L2 Capability Area | 1. Beginner Investor | 2. Active Trader | 3. Long-Term Investor | 4. Portfolio Manager | 5. Wealth Advisor | 6. Fund Manager | 7. Researcher / Analyst | 8. Enterprise User | 9. Platform Admin | 10. Compliance Officer |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MKT-DAT**: Market Data | SECONDARY | PRIMARY | SECONDARY | PRIMARY | SECONDARY | PRIMARY | SECONDARY | PRIMARY | N/A | N/A |
| **MKT-SEC**: Security Master | SECONDARY | SECONDARY | SECONDARY | SECONDARY | SECONDARY | SECONDARY | SECONDARY | PRIMARY | PRIMARY | N/A |
| **MKT-CAL**: Market Calendar | SECONDARY | PRIMARY | SECONDARY | SECONDARY | N/A | SECONDARY | N/A | SECONDARY | PRIMARY | N/A |
| **RES-FND**: Fundamental Analysis | SECONDARY | N/A | PRIMARY | SECONDARY | SECONDARY | PRIMARY | PRIMARY | SECONDARY | N/A | N/A |
| **RES-MAC**: Macro & News | PRIMARY | PRIMARY | PRIMARY | SECONDARY | SECONDARY | PRIMARY | PRIMARY | SECONDARY | N/A | N/A |
| **RES-SEC**: Sector & Cross-Market | N/A | SECONDARY | SECONDARY | PRIMARY | SECONDARY | PRIMARY | PRIMARY | SECONDARY | N/A | N/A |
| **AI-REC**: AI Recommendations | PRIMARY | N/A | PRIMARY | N/A | PRIMARY | N/A | N/A | N/A | N/A | SECONDARY |
| **AI-RES**: Automated Research | PRIMARY | SECONDARY | PRIMARY | N/A | PRIMARY | N/A | SECONDARY | N/A | N/A | N/A |
| **PRT-TRK**: Portfolio Accounting | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | N/A | SECONDARY | N/A | N/A |
| **PRT-PRF**: Performance Analytics | SECONDARY | N/A | PRIMARY | PRIMARY | PRIMARY | PRIMARY | N/A | SECONDARY | N/A | N/A |
| **PRT-FX**: Multi-Currency FX | N/A | N/A | SECONDARY | PRIMARY | PRIMARY | PRIMARY | N/A | SECONDARY | N/A | N/A |
| **PRT-WTC**: Watchlist & Screening | PRIMARY | PRIMARY | PRIMARY | SECONDARY | N/A | SECONDARY | PRIMARY | N/A | N/A | N/A |
| **RSK-PRF**: Risk Profiling | PRIMARY | N/A | SECONDARY | N/A | PRIMARY | N/A | N/A | N/A | N/A | PRIMARY |
| **RSK-ANL**: Quantitative Risk | N/A | SECONDARY | N/A | PRIMARY | PRIMARY | PRIMARY | SECONDARY | SECONDARY | N/A | N/A |
| **ENG-ALT**: Alert & Notification | PRIMARY | PRIMARY | SECONDARY | PRIMARY | SECONDARY | PRIMARY | N/A | N/A | N/A | N/A |
| **IDN-PRF**: User Identity | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY |
| **ENT-SUB**: Subscription Entitlement| PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | N/A |
| **RPT-GEN**: Reporting & Export | N/A | N/A | SECONDARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | SECONDARY | N/A | PRIMARY |
| **OPS-GOV**: Operations & Audit | N/A | N/A | N/A | N/A | N/A | N/A | N/A | SECONDARY | PRIMARY | PRIMARY |
| **LOC-LNG**: Localization | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY | PRIMARY |
| **EXC-SOR**: Trade Execution (F) | FUTURE | PRIMARY | FUTURE | PRIMARY | FUTURE | PRIMARY | N/A | SECONDARY | N/A | N/A |
| **WLT-REB**: Rebalancing (F) | N/A | N/A | FUTURE | PRIMARY | PRIMARY | PRIMARY | N/A | SECONDARY | N/A | N/A |
| **ADV-COP**: Advisor Copilot (F) | N/A | N/A | N/A | N/A | PRIMARY | N/A | N/A | N/A | N/A | FUTURE |

---

### User Profile Dependency Summary

* **Profile Depending on Most Capabilities**: **Portfolio Manager** and **Wealth Advisor** depend on 18 out of 23 L2 capability areas, reflecting the high information density required for institutional portfolio oversight.
* **Capabilities Serving All Profiles Equally**: **`IDN-PRF` (User Identity & Profile)**, **`ENT-SUB` (Subscription Entitlement)**, and **`LOC-LNG` (Localization & Accessibility)** serve all 10 user profiles universally as foundational platform capabilities.
* **Institutional-Exclusive Capabilities**: **`OPS-GOV` (Operations & Audit Logging)**, **`RSK-ANL` (Quantitative Risk Analytics)**, and **`RES-SEC` (Cross-Market Spread Analysis)** are heavily skewed toward Institutional Users, Fund Managers, Platform Administrators, and Compliance Officers.

---

## SECTION 11 — FUTURE CAPABILITY ROADMAP

This section details the evolutionary roadmap for future L1 domains planned for introduction in Phase 2 (MENA Expansion) and Phase 3 (Global Scale).

```
FUTURE DOMAINS DETAILED:
  1. EXC — Trade Execution Domain (Phase 2)
  2. WLT — Wealth Management Domain (Phase 2)
  3. ADV — Advisory Services Domain (Phase 2)
```

---

### 1. EXC — Trade Execution Domain

* **PHASE WHEN INTRODUCED**: Phase 2 (MENA Expansion).
* **NEW L2 CAPABILITIES**:
  * `EXC-SOR-001`: Broker Order Parameter Routing.
  * `EXC-TRK-001`: Order State Lifecycle Tracking.
* **EXISTING CAPABILITIES EXTENDED**:
  * `PRT-TRK-001` (Position Accounting): Enhanced to receive automated fill confirmations directly from execution APIs.
  * `MKT-SEC-001` (Security Master): Extended to store broker-specific instrument identifiers and minimum lot sizes.
* **NEW USER PROFILES SERVED**: Active Trader, Portfolio Manager (enabling direct execution workflows).
* **NEW REGULATORY REQUIREMENTS TRIGGERED**: Licensing compliance for order routing integration; non-custodial Smart Order Router (SOR) disclosures under regional regulatory authorities (FRA, CMA, SCA).
* **PHASE 1 PREREQUISITES**: `MKT-DAT-001` (Real-Time Ingestion), `PRT-TRK-001` (Position Accounting), and `IDN-PRF-001` (User Identity) must be highly stable in production.
* **BUSINESS RISK IF DELAYED**: Moderate commercial risk; Phase 1 users must execute trades manually through external broker portals. Delaying Phase 2 SOR integration reduces active trader retention.

---

### 2. WLT — Wealth Management Domain

* **PHASE WHEN INTRODUCED**: Phase 2 (MENA Expansion).
* **NEW L2 CAPABILITIES**:
  * `WLT-REB-001`: Tax-Aware Rebalancing Plan Synthesis.
  * `WLT-PRV-001`: Private Non-Public Asset Tracking (Real Estate, Private Equity).
* **EXISTING CAPABILITIES EXTENDED**:
  * `PRT-TRK-001` (Position Accounting): Extended to support manual valuation ledgers for non-public asset classes.
  * `RSK-ANL-001` (VaR Modeling): Extended to compute liquidity-adjusted VaR across illiquid private assets.
* **NEW USER PROFILES SERVED**: Wealth Manager, High-Net-Worth Individuals (HNWI), Family Office Managers.
* **NEW REGULATORY REQUIREMENTS TRIGGERED**: Compliance with private wealth advisory disclosures and multi-entity tax reporting rules across GCC jurisdictions.
* **PHASE 1 PREREQUISITES**: `PRT-TRK-001` (Position Accounting), `PRT-FX-001` (Multi-Currency Accounting), and `RSK-ANL-001` (VaR Modeling) must mature.
* **BUSINESS RISK IF DELAYED**: High commercial impact on B2B wealth management revenue; limits platform adoption among regional family offices.

---

### 3. ADV — Advisory Services Domain

* **PHASE WHEN INTRODUCED**: Phase 2 (MENA Expansion).
* **NEW L2 CAPABILITIES**:
  * `ADV-COP-001`: Financial Advisor Client Copilot Workflows.
  * `ADV-CMP-001`: Automated Suitability Compliance Verification.
* **EXISTING CAPABILITIES EXTENDED**:
  * `AI-REC-001` (Recommendation Generation): Extended to generate advisor-editable recommendation drafts.
  * `RPT-GEN-001` (Report Generation): Extended to render co-branded client advisory report packages.
* **NEW USER PROFILES SERVED**: Licensed Financial Advisors, Wealth Management Institutions.
* **NEW REGULATORY REQUIREMENTS TRIGGERED**: Mandatory audit logging of advisor modifications to AI recommendations; FRA/CMA advisory compliance rules.
* **PHASE 1 PREREQUISITES**: `AI-REC-001` (Recommendation Generation), `RSK-PRF-001` (Risk Profiling), and `OPS-GOV-001` (Audit Logging) must achieve 100% audit compliance.
* **BUSINESS RISK IF DELAYED**: Delays enterprise B2B SaaS ARR growth from regional brokerage and advisory firms.

---

## SECTION 12 — CAPABILITY EVOLUTION RULES

These rules govern how this Business Capability Model evolves over time. They are **BINDING** on all architects, engineers, product managers, and AI agents.

```
ENFORCEMENT: Binding Architectural Governance Standards E-01 through E-18.
```

### IDENTITY RULES
* **Rule E-01**: A Capability ID, once assigned, is permanent and immutable. No process, person, or AI agent may alter a Capability ID.
* **Rule E-02**: Renaming a capability or updating its definition does not change its assigned Capability ID. The identifier and the descriptive name are independent.
* **Rule E-03**: A retired Capability ID is never recycled or reused. It is permanently preserved in the registry with Status: `Retired`.

### LIFECYCLE RULES
* **Rule E-04**: A capability may not be deleted from this document. It may only be marked `Retired` accompanied by a mandatory Retirement Record.
* **Rule E-05**: A Retirement Record must include: reason for retirement, retirement date, migrated-to Capability ID (if applicable), and impact assessment across all traceable artifacts.
* **Rule E-06**: No `Active` capability may be retired without a formal transition plan approved by the Architecture Governance Board.

### SPLIT AND MERGE RULES
* **Rule E-07**: Splitting one L3 capability into multiple capabilities retires the parent ID (Status: `Retired`, reason: `SPLIT`) and assigns new sequential IDs to child capabilities. The traceability chain of the parent is inherited by all children.
* **Rule E-08**: Merging two capabilities retires both source IDs (Status: `Retired`, reason: `MERGED-INTO [NEW-ID]`) and assigns a new unique ID. The merged capability inherits the combined traceability chains of both sources.
* **Rule E-09**: A capability may not be split if doing so breaks atomicity of the resulting children. Each child must independently pass the L3 Atomicity Test.

### CONSISTENCY RULES
* **Rule E-10**: Any change to a Capability definition requires an immediate review of its Traceability Matrix row (Section 7). Stale traceability links constitute a documentation defect.
* **Rule E-11**: When a Business Rule (`BUSINESS_DOMAIN_DISCOVERY.md` Section 10) is amended, all capabilities referencing that rule in the Traceability Matrix must be reviewed for impact within 5 business days.
* **Rule E-12**: When a new Business Event is added to the domain model, it must be linked to at least one business capability in the Traceability Matrix before engineering implementation begins.

### ADDITION RULES
* **Rule E-13**: A new capability discovered during engineering must be documented here BEFORE software implementation begins. Engineering a capability not cataloged in this model is a process violation.
* **Rule E-14**: A proposed new capability must be evaluated for: L3 atomicity, domain ownership, cross-cutting classification, and traceability to at least one Business Rule and one Persona.
* **Rule E-15**: A capability that cannot be traced to at least one Business Rule and one Persona goal MUST NOT be added — it is either a technical implementation concern or a phantom capability.

### GOVERNANCE RULES
* **Rule E-16**: This Business Capability Model is reviewed every 6 months as a scheduled governance review, and whenever a new strategic Phase is initiated.
* **Rule E-17**: Capability boundary disputes between domain owners are escalated to the Architecture Governance Board and resolved with reference to `BUSINESS_DOMAIN_DISCOVERY.md` Section 18. `PROJECT_CONSTITUTION.md` is the final arbiter.
* **Rule E-18**: The Cross-Cutting Capability registry (Section 4) is reviewed with each new Phase to determine if any cross-cutting capability should be promoted to a domain capability or retired.

---

## SECTION 13 — CAPABILITY GOVERNANCE

### 13.1 Capability Ownership

Business ownership defines accountability for capability quality, completeness, and evolutionary roadmap — NOT technical software implementation.

| L1 Capability Domain | Business Domain Owner | Primary Accountability |
| :--- | :--- | :--- |
| **MKT: Market Intelligence** | Head of Market Data Operations | Ingestion feed reliability, Security Master accuracy, calendar precision |
| **RES: Financial Research** | Head of Financial Research & Modeling | Financial statement normalization accuracy, DCF model integrity, news coverage |
| **AI: Decision Intelligence** | Lead AI Financial Architect | Recommendation explainability, confidence score calibration, RAG grounding |
| **PRT: Portfolio Management** | Lead Portfolio Analytics Specialist | Position accounting precision, TWR return accuracy, FX conversion accuracy |
| **RSK: Risk Management** | Chief Risk Officer (CRO) | VaR model accuracy, stress-testing rigor, investor suitability boundaries |
| **ENG: Engagement & Notification** | Head of User Product Experience | Alert evaluation accuracy, notification dispatch timeliness |
| **IDN: Identity & User** | Lead Security & Identity Architect | Identity protection, onboarding velocity, risk profiling compliance |
| **ENT: Subscription & Entitlement** | Chief Commercial Officer (CCO) | Subscription tier enforcement, API quota tracking, licensing compliance |
| **RPT: Reporting & Export** | Head of Product Reporting | Report rendering accuracy, bilingual export formatting, tax compliance |
| **OPS: Operations & Governance** | VP of Infrastructure & Operations | System health telemetry, audit logging completeness, feature flag governance |
| **LOC: Localization & Accessibility**| Lead Localization Specialist | Native Arabic terminology parity, RTL layout precision, cultural formatting |
| **EXC: Trade Execution (Future)** | Head of Trading Integrations | Broker SOR routing reliability, order lifecycle tracking precision |
| **WLT: Wealth Management (Future)** | Head of Wealth Solutions | Tax-aware rebalancing accuracy, private asset valuation models |
| **ADV: Advisory Services (Future)** | Head of Enterprise Advisory | Financial advisor copilot utility, client suitability compliance auditing |

---

### 13.2 Capability Change Protocol

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    CAPABILITY CHANGE REQUEST PROTOCOL                     │
├───────────────────────────────────────────────────────────────────────────┤
│ STEP 1: PROPOSAL SUBMISSION                                               │
│ Proposer submits Capability Change Request (CCR) detailing proposed       │
│ addition, modification, split, merge, or retirement.                       │
├───────────────────────────────────────────────────────────────────────────┤
│ STEP 2: ATOMICITY & BOUNDARY EVALUATION                                   │
│ Enterprise Architect evaluates proposed L3 capability against the         │
│ 3-tier Atomicity Test and Section 18 Domain Boundaries.                   │
├───────────────────────────────────────────────────────────────────────────┤
│ STEP 3: TRACEABILITY VERIFICATION                                         │
│ Proposer documents Golden Thread traceability linking Capability ID to     │
│ Business Rule, Business Object, Business Event, and Persona Goal.          │
├───────────────────────────────────────────────────────────────────────────┤
│ STEP 4: GOVERNANCE BOARD APPROVAL                                         │
│ Architecture Governance Board reviews CCR. Approval requires unanimous     │
│ consensus of Domain Owners and Enterprise Architect.                       │
├───────────────────────────────────────────────────────────────────────────┤
│ STEP 5: MODEL REGISTRY UPDATE                                             │
│ Capability Model updated with new version metadata. ID registered         │
│ permanently per Evolution Rules E-01 through E-18.                        │
└───────────────────────────────────────────────────────────────────────────┘
```

---

### 13.3 Capability Review Cadence

* **Scheduled Review Frequency**: Bi-annually (every 6 months) led by the Enterprise Business Architecture Board.
* **Unscheduled Review Triggers**:
  1. Initiation of a new strategic Phase (e.g., transition from Phase 1 EGX to Phase 2 MENA).
  2. Enactment of major regulatory changes by operating authorities (e.g., FRA, CMA, SEC).
  3. Discovery of uncataloged capabilities during engineering architecture reviews.
* **Mandatory Participants**: Enterprise Business Architect, Domain Business Owners, Chief Risk Officer, Lead AI Financial Architect, Lead Localization Specialist.

---

## SECTION 14 — FINAL CAPABILITY DECLARATION

This document constitutes the canonical, authoritative, and binding **Business Capability Model** for Tradeora.

### Formal Declaration Statements:
1. **Hierarchy & Authority**: This document is formally subordinate to `docs/PROJECT_CONSTITUTION.md` and `docs/BUSINESS_DOMAIN_DISCOVERY.md`.
2. **Superseding Reference**: This document explicitly supersedes Section 4 of `docs/BUSINESS_DOMAIN_DISCOVERY.md` as the canonical capability reference for the Tradeora Financial Operating System.
3. **Traceability Binding**: Every subsequent software architecture document, API contract, microservice boundary, database schema, and AI model specification constructed across Tradeora MUST be explicitly traceable to a Capability ID defined herein.
4. **Implementation Prohibition**: No software system, API endpoint, database table, or AI prompt pipeline may be constructed to serve a purpose not represented as an explicit capability within this document.
5. **Engineering Discovery Protocol**: Any new business capability discovered during engineering implementation MUST be formally submitted, evaluated, and cataloged within this document following the Capability Change Protocol (Section 13.2) BEFORE source code implementation begins.
6. **Permanent Cross-Document Identifier**: The **Capability ID** `[L1-CODE]-[L2-CODE]-[NNN]` established in this document is the permanent cross-document identifier for every business ability within the Tradeora ecosystem.

---
*End of Canonical Business Capability Model — Tradeora Financial Operating System*
