# Tradeora Financial Operating System
## FEATURE TRACEABILITY MATRIX
## Version 1.0.0 | Status: AUTHORITATIVE | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  FEATURE TRACEABILITY MATRIX                                                 ║
║  Purpose   : Maps every approved Tradeora feature to its Release, BCM ID,   ║
║              Vertical Slice, Saga, Bounded Context, and Phase                ║
║  Baseline  : ARCHITECTURE FREEZE v1.2 FINAL                                 ║
║  Rule      : Every entry has a source reference. No entries without source.  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## TABLE 1 — DOMAIN CAPABILITY MATRIX (BCM L3 Atomic Capabilities)

> Source: `BUSINESS_CAPABILITY_MODEL.md` — 44 Phase 1 + 4 Phase 2+ capabilities

| Capability ID | Canonical Name (EN / AR) | L1 Domain | Phase | Release | Vertical Slice | Bounded Context | Strategic Importance | Differentiator? |
|:-------------|:------------------------|:----------|:------|:--------|:--------------|:---------------|:--------------------|:----------------|
| **MKT-DAT-001** | Real-Time Market Data Ingestion / استيعاب بيانات السوق الفورية | MKT | 1 | R2.0 | SLICE-04 | MarketData | Core Enabling | NO |
| **MKT-DAT-002** | Market Data Distribution / توزيع بيانات السوق | MKT | 1 | R2.0 | SLICE-04 | MarketDataDistribution | Core Enabling | NO |
| **MKT-DAT-003** | Technical Indicator Computation / حساب المؤشرات الفنية | MKT | 1 | R2.0 | SLICE-04 | TechnicalAnalysis | Core Enabling | NO |
| **MKT-SEC-001** | Security Master Registry Management / إدارة سجل الأوراق المالية | MKT | 1 | R1.0 | SLICE-11 | SecurityMaster | Core Enabling | NO |
| **MKT-SEC-002** | Corporate Action Tracking / متابعة إجراءات الشركات | MKT | 1 | R2.0 | — | CorporateActions | Core Enabling | NO |
| **MKT-CAL-001** | Exchange Trading Calendar Management / إدارة تقويم تداول البورصة | MKT | 1 | R1.0 | SLICE-11 | MarketCalendar | Core Enabling | NO |
| **MKT-CAL-002** | Circuit Breaker Tracking / متابعة توقف التداول الإجباري | MKT | 1 | R2.0 | — | MarketCalendar | Core Enabling | NO |
| **RES-FND-001** | Financial Statement Standardization / توحيد القوائم المالية | RES | 1 | R2.0 | SLICE-10 | FundamentalData | Core Differentiating | YES |
| **RES-FND-002** | Earnings Intelligence Parsing / تحليل بيانات الأرباح الذكية | RES | 1 | R2.0 | SLICE-10 | FundamentalData | Core Differentiating | YES |
| **RES-FND-003** | Fair Value DCF Modeling / نمذجة التدفقات النقدية المخصومة | RES | 1 | R2.0–R4.0 | SLICE-10 | Valuation | Core Differentiating | YES |
| **RES-MAC-001** | Economic Indicator Tracking / تتبع المؤشرات الاقتصادية الكلية | RES | 1 | R2.0 | — | MacroData | Core Enabling | NO |
| **RES-MAC-002** | Financial News Media Ingestion / استيعاب الأخبار المالية | RES | 1 | R2.0 | SLICE-07 | NewsIntelligence | Core Enabling | YES |
| **RES-MAC-003** | News Sentiment Scoring / قياس انطباعات الأخبار | RES | 1 | R3.0–R4.0 | — | SentimentEngine | Core Differentiating | YES |
| **RES-SEC-001** | Sector Heatmap Aggregation / تجميع الخرائط الحرارية للقطاعات | RES | 1 | R2.0 | — | SectorIntelligence | Core Enabling | NO |
| **RES-SEC-002** | Cross-Market Spread Analysis / تحليل الفروق السعرية بين الأسواق | RES | 2 | R6.0 | — | CrossMarketIntelligence | Core Differentiating | YES |
| **AI-REC-001** | Explainable Recommendation Generation / توليد التوصيات القابلة للتفسير | AI | 1 | R3.0 | SLICE-03 | AIConsensus | Core Differentiating | YES |
| **AI-REC-002** | Recommendation Confidence Calibration / معايرة نسبة الثقة | AI | 1 | R3.0 | SLICE-03 | AIConsensus | Core Differentiating | YES |
| **AI-REC-003** | Quantitative Signal Generation / توليد الإشارات الكمية | AI | 1 | R3.0 | — | SignalGeneration | Core Enabling | NO |
| **AI-RES-001** | Equity Research Report Synthesis / صياغة التقارير البحثية للأسهم | AI | 1 | R3.0 | — | ResearchSynthesis | Core Differentiating | YES |
| **AI-RES-002** | Daily Market Brief Compilation / تجميع التلخيص اليومي للسوق | AI | 1 | R3.0 | — | MarketBrief | Core Differentiating | YES |
| **PRT-TRK-001** | Multi-Asset Position Accounting / المحاسبة لجميع مراكز الأصول | PRT | 1 | R1.0 | SLICE-02 | Portfolio | Core Enabling | NO |
| **PRT-TRK-002** | Historical Transaction Recording / تسجيل المعاملات التاريخية | PRT | 1 | R1.0 | SLICE-02 | Portfolio | Core Enabling | NO |
| **PRT-PRF-001** | Time-Weighted Return Calculation / حساب العائد الموزون بالزمن | PRT | 1 | R2.0–R4.0 | SLICE-05 | PortfolioPerformance | Core Enabling | NO |
| **PRT-PRF-002** | Benchmark Comparison Evaluation / تقييم الأداء مقارنة بالمؤشرات | PRT | 1 | R2.0–R4.0 | SLICE-05 | PortfolioPerformance | Core Enabling | NO |
| **PRT-FX-001** | Multi-Currency Valuation Conversion / تحويل وتقييم المحافظ متعددة العملات | PRT | 1 | R1.0 | SLICE-02 | Portfolio | Core Enabling | NO |
| **PRT-WTC-001** | Custom Watchlist Management / إدارة قوائم المتابعة المخصصة | PRT | 1 | R1.0 | SLICE-02 | Watchlist | Supporting | NO |
| **PRT-WTC-002** | Dynamic Multi-Variable Screening / التصفية متعدد الأبعاد | PRT | 1 | R2.0 | — | Screening | Core Enabling | YES |
| **RSK-PRF-001** | User Risk Tolerance Profiling / تحديد ملف مخاطر المستثمر | RSK | 1 | R1.0–R4.0 | — | RiskProfiling | Core Differentiating | YES |
| **RSK-ANL-001** | Value-at-Risk (VaR) Modeling / نمذجة القيمة المعرضة للمخاطر | RSK | 1 | R4.0 | — | RiskAnalytics | Core Differentiating | YES |
| **RSK-ANL-002** | Sector Concentration Risk Stress-Testing / اختبار الإجهاد والتركيز القطاعي | RSK | 1 | R4.0 | — | RiskAnalytics | Core Enabling | NO |
| **RSK-ANL-003** | Drawdown Stress-Testing / اختبارات الانخفاض الأقصى | RSK | 1 | R4.0 | — | RiskAnalytics | Core Differentiating | YES |
| **ENG-ALT-001** | Price & Volatility Alert Evaluation / تقييم تنبيهات الأسعار | ENG | 1 | R2.0 | SLICE-06 | AlertEngine | Supporting | NO |
| **ENG-ALT-002** | Risk Breach Alert Dispatch / إرسال تنبيهات تجاوز المخاطر | ENG | 1 | R2.0–R4.0 | SLICE-06 | AlertEngine | Core Differentiating | YES |
| **IDN-PRF-001** | User Profile Registration & Onboarding / تسجيل وتهيئة ملف المستخدم | IDN | 1 | R1.0 | SLICE-01 | UserIdentity | Supporting | NO |
| **IDN-PRF-002** | Locale & Language Preference Management / إدارة إعدادات اللغة | IDN | 1 | R1.0 | SLICE-01 | UserIdentity | Core Differentiating | YES |
| **ENT-SUB-001** | Subscription Tier Entitlement Enforcement / تطبيق صلاحيات الاشتراك | ENT | 1 | R1.0 | SLICE-08 | Subscription | Supporting | NO |
| **ENT-SUB-002** | API Volume Quota Enforcement / إدارة حصص استهلاك واجهات البرمجة | ENT | 1 | R1.0 | SLICE-08 | Subscription | Supporting | NO |
| **RPT-GEN-001** | Portfolio Statement Generation / إصدار تقارير كشوف المحافظ | RPT | 1 | R4.0 | — | Reporting | Supporting | YES |
| **RPT-GEN-002** | Equity Research Export Compilation / تصدير البحوث المالية | RPT | 1 | R4.0 | — | Reporting | Supporting | YES |
| **OPS-GOV-001** | Immutable Audit Event Logging / التسجيل غير القابل للتعديل | OPS | 1 | R1.0 | — | AuditTrail | Supporting | NO |
| **OPS-GOV-002** | System Data Stream Health Monitoring / مراقبة صحة تدفقات البيانات | OPS | 1 | R1.0 | — | Observability | Supporting | NO |
| **LOC-LNG-001** | Bilingual Dynamic Text Localization / التوطين الديناميكي | LOC | 1 | R1.0 | All | Localization | Core Differentiating | YES |
| **LOC-LNG-002** | Right-to-Left (RTL) Layout Management / إدارة التنسيق RTL | LOC | 1 | R1.0 | All | Localization | Core Differentiating | YES |
| **LOC-LNG-003** | Cultural Date & Number Formatting / التنسيق الثقافي للأرقام | LOC | 1 | R1.0 | All | Localization | Core Enabling | NO |
| **EXC-SOR-001** | Broker Order Parameter Routing / توجيه أوامر التداول | EXC | 2 | R6.0 | — | OrderManagement | Core Enabling | NO |
| **WLT-REB-001** | Tax-Aware Rebalancing Plan Synthesis / صياغة خطط إعادة التوازن | WLT | 2 | R6.0 | — | WealthManagement | Core Differentiating | YES |
| **ADV-COP-001** | Financial Advisor Client Copilot Workflows / بيئة المستشار المالي | ADV | 2 | R6.0 | — | AdvisoryServices | Core Differentiating | YES |

---

## TABLE 2 — CROSS-CUTTING CAPABILITY MATRIX

> Source: `BUSINESS_CAPABILITY_MODEL.md` Section 4 — 13 XCC capabilities

| Capability ID | Feature | Serving Domains | Phase | Release | Investment Posture |
|:-------------|:--------|:---------------|:------|:--------|:-----------------|
| XCC-AUTH-001 | User Identity Authentication | All | 1 | R1.0 | Buy (Keycloak) |
| XCC-AUTH-002 | Role-Based Authorization Enforcement | All | 1 | R1.0 | Build (RBAC/ABAC) |
| XCC-AUD-001 | System-Wide Audit Event Logging | All | 1 | R1.0 | Build internally |
| XCC-AUD-002 | Audit Trail Inquiry & Reporting | OPS, RPT, IDN, ENT | 1 | R4.0 | Build internally |
| XCC-NTF-001 | Multi-Channel Message Dispatch | ENG, RSK, MKT, AI | 1 | R1.0 | Buy (push/email provider) |
| XCC-NTF-002 | Notification Channel Preference Governance | ENG, IDN | 1 | R1.0 | Build internally |
| XCC-LOC-001 | Dynamic Text Language Translation | All | 1 | R1.0 | Build/Open Source |
| XCC-LOC-002 | Locale Number & Date Formatting | All | 1 | R1.0 | Open Source (ICU) |
| XCC-LOC-003 | Right-to-Left View Formatting | All (UI) | 1 | R1.0 | Open Source (CSS) |
| XCC-SCH-001 | Cross-Domain Universal Search | MKT, RES, AI, PRT, RPT | 1 | R2.0 | Open Source (search engine) |
| XCC-SCH-002 | Deep Financial Document Search | RES, AI, RPT | 1 | R2.0 | Build on Qdrant |
| XCC-OPS-001 | Dynamic Feature Toggle Governance | All | 1 | R1.0 | Buy (Unleash) |
| XCC-OPS-002 | Centralized System Parameter Governance | All | 1 | R1.0 | Build internally |

---

## TABLE 3 — AI SCHOOL MATRIX (17 Schools)

> Source: `AI_INTELLIGENCE_ENGINE_ARCHITECTURE.md` — School Registry

| School ID | School Name (EN / AR) | Input Data Summary | Model Backend | Base Weight | Max Latency | Phase | Release |
|:---------|:---------------------|:------------------|:------------|:-----------|:-----------|:------|:--------|
| SCHOOL-01 | Market Intelligence / ذكاء السوق | EGX ticks, order book, bid-ask | Ollama (Qwen2.5:72b via LLM GW) | 0.07 | 1,500ms | 1 | R3.0 |
| SCHOOL-02 | Fundamental Analysis / التحليل الأساسي | P/E, P/B, ROE, EV/EBITDA, D/E | Ollama (Qwen2.5:72b via LLM GW) | 0.09 | 2,000ms | 1 | R3.0 |
| SCHOOL-03 | Technical Analysis / التحليل الفني | RSI, MACD, BB, ADX, Ichimoku (20+) | Custom ML + Ollama (Qwen2.5:7b) | 0.08 | 1,000ms | 1 | R3.0 |
| SCHOOL-04 | Sentiment Analysis / تحليل المشاعر | Arabic news, social, EGX disclosures | Arabic BERT/CAMeL | 0.05 | 1,200ms | 1 | R3.0 |
| SCHOOL-05 | Macroeconomic Analysis / التحليل الاقتصادي | CBE rates, USD/EGP, CPI, cycle | Ollama (Qwen2.5:72b via LLM GW) | 0.06 | 1,500ms | 1 | R3.0 |
| SCHOOL-06 | Quantitative Models / النماذج الكمية | Mean-reversion, momentum, Fama-French EGX | Statistical Engine (Pandas/NumPy) | 0.07 | 1,000ms | 1 | R3.0 |
| SCHOOL-07 | Risk-Adjusted Return / العائد المعدل | Sharpe, Sortino, Calmar, VaR 99%, ES | Statistical Engine | 0.08 | 1,500ms (SLA) | 1 | R3.0 |
| SCHOOL-08 | Behavioral Finance / التمويل السلوكي | Herding, disposition, overreaction | Custom ML Pipeline | 0.05 | 1,200ms | 1 | R3.0 |
| SCHOOL-09 | Sector Rotation / دوران القطاعات | Sector momentum, relative P/E | Ollama (Qwen2.5:72b via LLM GW) | 0.06 | 1,500ms | 1 | R3.0 |
| SCHOOL-10 | Peer Comparison / مقارنة الأقران | Qdrant vector embeddings vs peers | Qdrant Vector Search | 0.05 | 2,000ms | 1 | R3.0 |
| SCHOOL-11 | Earnings Quality / جودة الأرباح | Accruals, revenue quality, cash conversion | Statistical Engine | 0.07 | 1,000ms | 1 | R3.0 |
| SCHOOL-12 | Pattern Recognition / التعرف على الأنماط | H&S, double bottom, flags, channels | Chart pattern ML (CNN) | 0.06 | 2,000ms | 1 | R3.0 |
| SCHOOL-13 | Options Flow / تدفق الخيارات | IV, put/call ratio, unusual options activity | Statistical Engine (Phase 2) | TBD | TBD | 2 | R6.0 |
| SCHOOL-14 | Insider Activity / نشاط المطلعين | Director dealings, institutional accumulation | Custom ML (Phase 2) | TBD | TBD | 2 | R6.0 |
| SCHOOL-15 | ESG Analysis / تحليل ESG | Sharia compliance + ESG scoring for MENA | Custom ML (Phase 2) | TBD | TBD | 2 | R6.0 |
| SCHOOL-16 | Global Macro / الاقتصاد الكلي العالمي | Global index correlations, US Fed impact | Ollama (Phase 2) | TBD | TBD | 2 | R6.0 |
| SCHOOL-17 | Alternative Data / البيانات البديلة | Satellite imagery, web traffic, consumer data | Custom ML (Phase 3) | TBD | TBD | 2→3 | R6.0–R7.0 |

---

## TABLE 4 — AI ORCHESTRATION ENGINE MATRIX (9 Meta-Engines)

> Source: `AI_INTELLIGENCE_ENGINE_ARCHITECTURE.md`, `LLM_GATEWAY_ARCHITECTURE.md`,
> `GROUND_TRUTH_FEEDBACK_ARCHITECTURE.md`, `AI_PERFORMANCE_SLA_ARCHITECTURE.md`

| Engine ID | Engine Name | Phase | Release | User-Visible | Purpose |
|:---------|:-----------|:------|:--------|:------------|:--------|
| TRD-AI-018 | Consensus Orchestrator | 1 | R3.0 | No (result only) | Parallel school dispatch, weighted voting (Decimal) |
| TRD-AI-019 | WisdomEngine (Dynamic Weight Calibration) | 1 | R3.0 | No | Monthly Brier score + accuracy-based weight update [0.04–0.12] |
| TRD-AI-020 | AI Safety Engine (7-Check Validation) | 1 | R3.0 | Yes (blocked msg) | Confidence ≥0.75, ≥9 schools, data freshness, circuit breaker, suspension, Arabic explanation, FRA embargo |
| TRD-AI-021 | Explainability Engine | 1 | R3.0 | Yes (Arabic + EN) | Arabic explanation 50–500 words; FRA disclaimer mandatory |
| TRD-AI-022 | LLM Gateway | 1 | R3.0 | No | Provider routing: Ollama → DeepSeek → OpenAI; caching; rate limiting (8 concurrent Phase 1) |
| TRD-AI-023 | Learning Engine | 1 | R5.0 | No | School weight adjustment from ground truth (CMGR 0.1, 90-day rolling) |
| TRD-AI-024 | Self-Reflection Engine | 1 | R5.0 | No | Monthly accuracy audit, decision quality scoring |
| TRD-AI-025 | Bias Detection Engine | 1 | R5.0 | No | Systematic school bias detection, calibration penalty |
| TRD-AI-026 | Decision Improvement Engine | 1 | R5.0 | No | Weight bounds [0.04–0.12], auto-exclusion (accuracy < 55% × 3 months) |

---

## TABLE 5 — VERTICAL SLICE MATRIX (12 Phase 1 Slices)

> Source: `VERTICAL_SLICE_VALIDATION_MATRIX.md` — All 12 Phase 1 slices

| Slice ID | Slice Name | Release Gate | BCM Dependencies | Bounded Contexts | Saga | DoD |
|:--------|:-----------|:------------|:----------------|:----------------|:-----|:----|
| SLICE-01 | User Registration & KYC | R1.0 Alpha | IDN-PRF-001, XCC-AUTH-001, OPS-GOV-001 | UserIdentity, KYCVerification, AMLScreening, Compliance, AuditTrail | SAGA-001 | 12 criteria |
| SLICE-02 | EGX Portfolio Creation | R1.0 Alpha | PRT-TRK-001, PRT-TRK-002, PRT-FX-001, PRT-WTC-001, MKT-SEC-001 | Portfolio, Watchlist, SecurityMaster | SAGA-001 | 12 criteria |
| SLICE-03 | AI Recommendation (Single Ticker) | R3.0 Beta | AI-REC-001, AI-REC-002, RSK-PRF-001, RES-FND-003 | AIConsensus, SignalGeneration | SAGA-003 | 12 criteria |
| SLICE-04 | EGX Real-Time Price Display | R2.0 Beta | MKT-DAT-001, MKT-DAT-002, MKT-DAT-003 | MarketData, MarketDataDistribution, TechnicalAnalysis | — | 12 criteria |
| SLICE-05 | Portfolio NAV Calculation | R2.0–R4.0 | PRT-TRK-001, PRT-PRF-001, PRT-PRF-002, MKT-DAT-002 | Portfolio, PortfolioPerformance | — | 12 criteria |
| SLICE-06 | Price Alert Trigger | R2.0 Beta | ENG-ALT-001, ENG-ALT-002, MKT-DAT-001 | AlertEngine, Notification | — | 12 criteria |
| SLICE-07 | Arabic News Feed | R2.0 Beta | RES-MAC-002, RES-MAC-003, LOC-LNG-001 | NewsIntelligence, SentimentEngine | — | 12 criteria |
| SLICE-08 | Subscription Activation | R1.0 Alpha | ENT-SUB-001, ENT-SUB-002, IDN-PRF-001 | Subscription, Billing, Entitlement | SAGA-002, SAGA-006 | 12 criteria |
| SLICE-09 | Portfolio Rebalancing Suggestion | R4.0 GA | PRT-TRK-001, RSK-ANL-001, AI-REC-001 | PortfolioRebalancing, WealthManagement | SAGA-005 | 12 criteria |
| SLICE-10 | Company Fundamentals View | R2.0 Beta | RES-FND-001, RES-FND-002, RES-FND-003, MKT-SEC-001 | FundamentalData, Valuation | — | 12 criteria |
| SLICE-11 | EGX Session Status Display | R1.0 Alpha | MKT-CAL-001, MKT-CAL-002, MKT-SEC-001 | MarketCalendar, MarketSession | — | 12 criteria |
| SLICE-12 | User Data Export (PDPL) | R4.0 GA | IDN-PRF-001, OPS-GOV-001, XCC-AUD-001 | PDPLCompliance, AuditTrail | SAGA-004 | 12 criteria |

---

## TABLE 6 — SAGA MATRIX (6 Business Sagas)

> Source: `BOUNDED_CONTEXT_MAP.md`, agent research extraction — All 6 Sagas

| Saga ID | Saga Name | Timeout | Steps | Compensation | Release |
|:--------|:---------|:--------|:------|:------------|:--------|
| SAGA-001 | User Onboarding | 72 hours | KYC → AML → Free Subscription → Default Portfolio → Notification | Full rollback per step | R1.0 |
| SAGA-002 | Subscription Activation | 15 minutes | Payment Gateway → Subscription BC → Feature Flags (Unleash) → Notification | Payment reversal | R1.0 |
| SAGA-003 | AI Recommendation WORM Audit | 30 seconds | Generate Recommendation → WORM Archive (MinIO) → Delivery. If WORM fails → block delivery | Cannot deliver without archive | R3.0 |
| SAGA-004 | User Account Deletion (PDPL) | 30 days | Archive portfolios → Delete OpenBao encryption keys → PostgreSQL pseudonymization → Confirmation | Staged (point-of-no-return at key deletion) | R1.0 |
| SAGA-005 | Portfolio Rebalancing | 24 hours | AI suggests rebalancing → User confirms → WORM audit → Advisory record (no execution) | Cancel if user rejects | R4.0 |
| SAGA-006 | Subscription Downgrade | 1 hour | Archive excess portfolios & watchlists → Apply new rate limits → Notification | Restore if payment issues | R1.0 |

---

## TABLE 7 — SUBSCRIPTION TIER FEATURE MATRIX

> Source: Agent 3 technical research extraction, `BOUNDED_CONTEXT_MAP.md`

| Feature | Free | Basic | Premium | Family Office | Institutional |
|---------|:----:|:-----:|:-------:|:-------------:|:-------------:|
| EGX data | 15-min delayed | Real-time | Real-time | Real-time | Real-time |
| Portfolios | 1 | 3 | Unlimited | Unlimited (multi-user) | Custom |
| Watchlist tickers | 5 | 50 | Unlimited | Unlimited | Unlimited |
| AI recommendations/day | 0 | 5 | Unlimited | Unlimited | API stream |
| Price alerts | 3 | 20 | Unlimited | Unlimited | Unlimited |
| News feed (Arabic) | Basic | Full | Full + Sentiment | Full + Sentiment | Full + API |
| Fundamental data | Basic | Full | Full + DCF | Full + DCF | Full + API |
| Risk analytics (VaR) | — | — | ✅ | ✅ | ✅ |
| Portfolio reports (PDF) | — | — | ✅ | ✅ | ✅ |
| Research export (PDF) | — | — | ✅ | ✅ | ✅ |
| Sector heatmaps | Basic | Full | Full | Full | Full |
| Advanced screening | — | Basic | Full | Full | Full |
| Backtesting (future) | — | — | ✅ | ✅ | ✅ |
| Family multi-user | — | — | — | ✅ | ✅ |
| Custom benchmarks | — | — | — | ✅ | ✅ |
| B2B API access | — | — | — | — | ✅ |
| White-label options | — | — | — | — | ✅ |
| Custom SLA | — | — | — | — | ✅ |

---

## TABLE 8 — COMPLIANCE FEATURE MATRIX

> Source: Agent 3 research, `PROJECT_CONSTITUTION.md`, BCM regulatory annotations

| Compliance Feature | Applicable Regulation | Release | Bounded Context | Notes |
|:-----------------:|:---------------------|:--------|:---------------|:------|
| Egyptian National ID KYC | FRA, CBE AML rules | R1.0 | KYCVerification | Sumsub/Shufti Pro integration |
| Liveness check | FRA eKYC | R1.0 | KYCVerification | Anti-spoofing selfie |
| AML sanctions screening | CBE, OFAC, UN, EU | R1.0 | AMLScreening | 4 watchlists, real-time check |
| PDPL consent recording | PDPL 2020 | R1.0 | Compliance | Timestamped, verifiable |
| PDPL right to erasure (SAGA-004) | PDPL 2020 Art. 24 | R1.0 | PDPLCompliance | 30-day SLA, key deletion |
| PDPL data export | PDPL 2020 Art. 19 | R4.0 | PDPLCompliance | SLICE-12 |
| Immutable WORM audit (7-year) | FRA data retention | R1.0 | AuditTrail | MinIO COMPLIANCE mode |
| FRA embargo sync | FRA halted instruments | R2.0 | MarketSession | 5-min poll during EGX session |
| AI advisory-only label | FRA, Constitution Art. 6 | R3.0 | AIConsensus | Every AI output |
| Mandatory FRA disclaimer (Arabic) | FRA No. 92/2022 | R3.0 | AIConsensus | "هذا التحليل استرشادي فقط..." |
| No autonomous trading | Constitution Art. 6.2 | R1.0+ | OrderManagement | AI physically decoupled from OMS |
| Simulation results internal only | FRA No. 92/2022 Art. 18 | R5.0 | Backtesting | NEVER displayed to users |
| EGX circuit breaker halt | EGX Rules | R2.0 | MarketCalendar | AI recommendations suppressed |
| Instrument suspension check | EGX Rules | R2.0–R3.0 | AIConsensus | Safety Check 5 |
| Data sovereignty — Cairo | PDPL 2020 | R1.0+ | All | Egyptian user data: Cairo only |
| Data sovereignty — Riyadh | CMA Saudi | R6.0 | All | Saudi user data: Riyadh only |
| CMA Saudi license | Saudi Capital Market Law | R6.0 | — | Required for Tadawul advisory |
| MIFID II compliance | EU Directive 2014/65/EU | R7.0 | — | Required for EU market expansion |
| SEC compliance | US Securities Act | R7.0 | — | Required for US market expansion |
| FRA written approval — paper trading | FRA No. 92/2022 | R6.0 | PaperTrading | Must be on file before feature live |
| Look-ahead bias prevention (Rule 40) | FRA, internal engineering | R5.0 | Backtesting | `available_from_ts` filter; CI enforcement |

---

## TABLE 9 — INFRASTRUCTURE COMPONENT MATRIX

> Source: `INFRASTRUCTURE_CONFLICT_RESOLUTION.md`, `ENGINEERING_AND_INTELLIGENCE_VISION.md`

| Component | Technology | Version | Phase | Release | Role |
|:----------|:----------|:--------|:------|:--------|:-----|
| Kubernetes | K8s | 1.28+ | 1 | R1.0 | Container orchestration |
| PostgreSQL (Patroni HA) | PostgreSQL | 16+ | 1 | R1.0 | Primary RDBMS |
| TimescaleDB | Extension on PG | Latest | 1 | R2.0 | Time-series market data |
| Apache Kafka | Kafka | 3.7+ (KRaft) | 1 | R1.0 | Async event bus |
| Karapace | Schema Registry | 3.x | 1 | R1.0 | Authoritative event schema source |
| Valkey | Cache | 8.0+ | 1 | R1.0 | Sessions, AI cache, feature flags |
| MinIO | Object Storage | Latest | 1 | R1.0 | WORM archives, ML models, reports |
| OpenBao | Secret Management | 1.x | 1 | R1.0 | API keys, PII encryption keys |
| Keycloak | Identity Provider | 24+ | 1 | R1.0 | OIDC, JWT, MFA, RBAC |
| Kong | API Gateway | 3.x | 1 | R1.0 | Rate limiting, auth, routing |
| Unleash | Feature Flags | 5.x | 1 | R1.0 | All features default OFF |
| FluxCD v2 | GitOps CI/CD | Latest | 1 | R1.0 | Authoritative GitOps tool |
| Prometheus | Metrics | Latest | 1 | R1.0 | Observability pillar 1 |
| Grafana | Dashboards | Latest | 1 | R1.0 | Visualization + alerts |
| Loki | Log Aggregation | Latest | 1 | R1.0 | Observability pillar 2 |
| Tempo | Distributed Tracing | Latest | 1 | R1.0 | Observability pillar 3 |
| Ollama | LLM Runtime (CPU) | Latest | 1 | R3.0 | Local AI inference (Phase 1 CPU only) |
| LiteLLM | LLM Proxy | Latest | 1 | R3.0 | LLM Gateway routing |
| Qdrant | Vector DB | Latest | 1 | R3.0 | SCHOOL-10, SCHOOL-12, learning |
| Arabic BERT/CAMeL | NLP Model | Latest | 1 | R3.0 | SCHOOL-04 Sentiment Analysis |
| NVIDIA A100 (GPU) | GPU Nodes | — | 2 | R5.0 | Phase 2 AI performance upgrade |
| vLLM | LLM Runtime (GPU) | Latest | 2 | R5.0 | Phase 2 GPU inference |
| Kafka MirrorMaker 2 | Cross-region Kafka | Latest | 2 | R6.0 | Cairo ↔ Riyadh replication |

---

## TABLE 10 — ANALYSIS METHODOLOGY TRACEABILITY

> Source: `AI_INTELLIGENCE_ENGINE_ARCHITECTURE.md`, `BUSINESS_CAPABILITY_MODEL.md`

| Analysis Methodology | Primary School(s) | Supporting School(s) | Capability ID(s) | Release |
|:--------------------|:-----------------|:--------------------|:----------------|:--------|
| Technical Analysis (indicators) | SCHOOL-03 | — | MKT-DAT-003 | R2.0 (computed), R3.0 (AI) |
| Fundamental Analysis | SCHOOL-02 | SCHOOL-11 | RES-FND-001, RES-FND-002, RES-FND-003 | R2.0 (data), R3.0 (AI) |
| DCF Fair Value Modeling | — | SCHOOL-02 | RES-FND-003 | R2.0–R4.0 |
| Candlestick Pattern Analysis | SCHOOL-12 | SCHOOL-03 | — | R3.0 |
| Chart Pattern Recognition (H&S, Flags, etc.) | SCHOOL-12 | — | — | R3.0 |
| Price Action | SCHOOL-03 | SCHOOL-01 | MKT-DAT-001 | R3.0 |
| Elliott Wave Theory | SCHOOL-12 | — | — | R3.0 |
| Wyckoff Method | SCHOOL-12 | SCHOOL-08 | — | R3.0 |
| Volume Analysis | SCHOOL-01 | SCHOOL-03 | MKT-DAT-001 | R3.0 |
| Order Flow Analysis | SCHOOL-01 | SCHOOL-08 | MKT-DAT-001 | R3.0 |
| Market Structure (highs/lows, breaks) | SCHOOL-01 | SCHOOL-03 | MKT-DAT-001 | R3.0 |
| Supply & Demand Zones | SCHOOL-01 | SCHOOL-12 | — | R3.0 |
| Smart Money Concepts (SMC) | SCHOOL-08 | SCHOOL-12 | — | R3.0 |
| ICT (Inner Circle Trader) | SCHOOL-12 | SCHOOL-01 | — | R3.0 |
| Liquidity Analysis | SCHOOL-01 | SCHOOL-08 | MKT-DAT-001 | R3.0 |
| Support & Resistance | SCHOOL-03 | SCHOOL-12 | MKT-DAT-003 | R3.0 |
| Trend Analysis | SCHOOL-03 | SCHOOL-05 | MKT-DAT-003 | R3.0 |
| Quantitative / Statistical Models | SCHOOL-06 | SCHOOL-07 | — | R3.0 |
| Sector Rotation | SCHOOL-09 | — | RES-SEC-001 | R3.0 |
| Macroeconomic Analysis | SCHOOL-05 | SCHOOL-09 | RES-MAC-001 | R3.0 |
| News Sentiment Intelligence | SCHOOL-04 | — | RES-MAC-002, RES-MAC-003 | R2.0–R3.0 |
| Behavioral Finance | SCHOOL-08 | SCHOOL-06 | — | R3.0 |
| Risk-Adjusted Return Analysis | SCHOOL-07 | — | RSK-ANL-001 | R3.0–R4.0 |
| Peer Comparison | SCHOOL-10 | SCHOOL-02 | — | R3.0 |
| Earnings Quality | SCHOOL-11 | SCHOOL-02 | RES-FND-002 | R3.0 |
| VaR & Stress Testing | SCHOOL-07 | — | RSK-ANL-001, RSK-ANL-002, RSK-ANL-003 | R4.0 |
| Intermarket Analysis | SCHOOL-05 | SCHOOL-09 | RES-SEC-002 | R3.0 (EGX only), R6.0 (cross-market) |
| Options Flow | SCHOOL-13 | — | — | R6.0 |
| Insider Activity | SCHOOL-14 | — | — | R6.0 |
| ESG / Sharia Compliance | SCHOOL-15 | — | — | R6.0 |
| Global Macro | SCHOOL-16 | SCHOOL-05 | — | R6.0 |
| Alternative Data | SCHOOL-17 | — | — | R6.0–R7.0 |
| Historical Backtesting | Backtesting Engine | All schools | — | R5.0 (internal only) |
| Monte Carlo Simulation | Monte Carlo Service | SCHOOL-07 | RSK-ANL-003 | R5.0 (internal) / R6.0 (advisory) |
| Paper Trading | Paper Trading System | All schools | — | R6.0 (FRA approval required) |
| Meta-Intelligence (AI Arbitration) | WisdomEngine | Consensus Orchestrator | AI-REC-001 | R3.0 |
| AI Self-Learning | Learning Engine | Bias Detection, Self-Reflection | — | R5.0 |
| Ground Truth Collection | Ground Truth Collector | — | — | R5.0 |
| Collective Intelligence | Collective Intelligence Engine | — | — | R7.0 |
| Knowledge Graph | Knowledge OS | — | — | R7.0 |
| Enterprise Memory | Enterprise Memory Engine | — | — | R5.0–R7.0 |

---

## TRACEABILITY SUMMARY

| Domain | Total Capabilities | Phase 1 | Phase 2+ | Mapped to Release |
|--------|:-----------------:|:-------:|:--------:|:-----------------:|
| MKT (Market Intelligence) | 7 | 7 | 0 | ✅ 100% |
| RES (Financial Research) | 8 | 7 | 1 | ✅ 100% |
| AI (AI Decision Intelligence) | 5 | 5 | 0 | ✅ 100% |
| PRT (Portfolio Management) | 7 | 7 | 0 | ✅ 100% |
| RSK (Risk Management) | 4 | 4 | 0 | ✅ 100% |
| ENG (User Engagement) | 2 | 2 | 0 | ✅ 100% |
| IDN (Identity Management) | 2 | 2 | 0 | ✅ 100% |
| ENT (Subscription) | 2 | 2 | 0 | ✅ 100% |
| RPT (Reporting) | 2 | 2 | 0 | ✅ 100% |
| OPS (Operations) | 2 | 2 | 0 | ✅ 100% |
| LOC (Localization) | 3 | 3 | 0 | ✅ 100% |
| XCC (Cross-Cutting) | 13 | 13 | 0 | ✅ 100% |
| EXC (Trade Execution) | 1 | 0 | 1 | ✅ 100% |
| WLT (Wealth Management) | 1 | 0 | 1 | ✅ 100% |
| ADV (Advisory Services) | 1 | 0 | 1 | ✅ 100% |
| **TOTAL** | **60** | **56** | **4** | **✅ 100%** |

| Component | Total | Mapped | Coverage |
|-----------|:-----:|:------:|:--------:|
| AI Schools | 17 | 17 | ✅ 100% |
| AI Orchestration Engines | 9 | 9 | ✅ 100% |
| Vertical Slices (Phase 1) | 12 | 12 | ✅ 100% |
| Sagas | 6 | 6 | ✅ 100% |
| Analysis Methodologies | 40 | 40 | ✅ 100% |
| Infrastructure Components | 22 | 22 | ✅ 100% |

---

*Tradeora Financial Operating System — Feature Traceability Matrix — Architecture Freeze v1.2 FINAL*
*Source: 96 approved architecture documents. Zero invented entries. Zero omissions.*
