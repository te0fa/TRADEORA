# Tradeora Financial Operating System
## Global Expansion Strategy — Market Entry & Technical Roadmap
## Version 1.0.0 | Status: APPROVED | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Constitution Article 26  : Global expansion policy                          ║
║  Constitution Article 27  : EGX-first before regional expansion             ║
║  Phase Trigger            : Phase 1 → 2 requires MAU ≥ 50,000 on EGX       ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Section 1 — Market Opportunity Analysis

### 1.1 Egypt & EGX — Phase 1 Market

| Metric | Value | Source |
|--------|-------|--------|
| Egypt population | 107 million | World Bank 2024 |
| Internet users | 68 million (63%) | DataReportal 2024 |
| Egyptian brokerage accounts | ~3 million | FRA 2023 |
| EGX daily trading volume | ~EGP 1–3 billion | EGX 2024 |
| EGX listed companies | 220+ | EGX 2024 |
| Retail investor share of EGX volume | 40–50% | FRA estimate |
| Target addressable users (Phase 1) | 3–5 million retail investors | Tradeora estimate |
| Phase 1 revenue model | Freemium subscription (EGP 99–399/month) | — |

**Why Egypt First:**
1. Arabic-first AI is our moat — calibrated specifically for EGX and Egyptian macroeconomic cycles
2. Regulatory relationship with FRA established at lower cost than GCC regulators
3. Deep Arabic NLP trained on Egyptian financial media (Al-Borsa, Al-Ahram Ekonomi)
4. PDPL 2020 compliance architecture already built — data stays in Egypt

### 1.2 GCC — Phase 2 Market

| Market | Exchange | Listed Companies | Daily Volume | Regulator | Currency |
|--------|---------|-----------------|-------------|----------|---------|
| Saudi Arabia | Tadawul (SAR) | 330+ | SAR 6–15 bn | CMA + SAMA | SAR |
| UAE (Dubai) | DFM | 70+ | AED 1–3 bn | SCA | AED |
| UAE (Abu Dhabi) | ADX | 80+ | AED 2–5 bn | SCA | AED |
| Kuwait | Boursa Kuwait | 170+ | KWD 30–100 mn | CMA | KWD |
| Bahrain | Bahrain Bourse | 40+ | BHD 2–10 mn | CBB | BHD |
| Qatar | Qatar Exchange | 50+ | QAR 200–500 mn | QFC | QAR |

**GCC TAM:**  
- 40 million retail investors across GCC
- Combined daily trading: SAR 100+ billion
- Growing retail participation driven by Vision 2030 (Saudi), post-oil economy diversification
- Arabic is primary language → our AI NLP advantage transfers directly

### 1.3 North Africa & Levant — Phase 3 Market

| Market | Exchange | Key Characteristic |
|--------|---------|------------------|
| Morocco | Casablanca SE | French + Arabic bilingual, sophisticated market |
| Tunisia | Bourse de Tunis | Small but growing retail |
| Jordan | Amman SE | Established market, English + Arabic |
| Lebanon | BSE | Recovering from 2019 crisis |

**Strategic value:** French NLP adds Morocco + Tunisia. Regional regulatory relationships
established. Extension of Arabic NLP to Darija (Moroccan Arabic) required.

---

## Section 2 — 4-Phase Expansion Plan

### Phase 1: Egypt (EGX) — NOW

**Status:** Active development  
**Exchange:** Egyptian Exchange (EGX)  
**Currency:** Egyptian Pound (EGP)  
**Regulatory:** FRA (Financial Regulatory Authority)  
**Languages:** Arabic (primary), English (secondary)  
**AI Calibration:** Egyptian macroeconomic cycles, EGX-specific patterns, CBE interest rate policy  

**Revenue Model:**
- FREE: 1 portfolio, 5 AI recommendations/day, basic market data
- BASIC: EGP 99/month — 3 portfolios, 20 AI recommendations/day, alerts
- PREMIUM: EGP 299/month — unlimited portfolios, 50 AI recommendations/day, advanced analytics
- PROFESSIONAL: EGP 599/month — API access, custom alerts, backtesting (Phase 2)

**Phase 1 Milestones:**
```
Launch → 1,000 users:   Validate product-market fit
1,000 → 10,000 users:   Optimize onboarding, Arabic NLP calibration
10,000 → 50,000 users:  Scale infrastructure, FRA compliance track record established
50,000 users:           Phase 1 → 2 gate consideration
```

---

### Phase 2: GCC Markets

**Phase 2 Trigger Criteria (ALL must be met before Phase 2 launch):**

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Egypt MAU | ≥ 50,000 active users | Monthly active users |
| AI directional accuracy | ≥ 70% sustained | 6-month EGX golden dataset |
| Platform uptime | ≥ 99.9% sustained | 3-month rolling SLA |
| Compliance violations | Zero critical | FRA audit clean |
| Engineering team | ≥ 20 engineers | Headcount |
| GCC regulatory approval | ≥ 1 market approved | CMA/SCA license received |

**Phase 2 Priority Order:**

1. **Saudi Arabia (Tadawul)** — Largest market, highest revenue potential
   - Regulatory: CMA (Capital Market Authority) + SAMA fintech sandbox
   - Data sovereignty: Saudi user data must reside in Saudi Arabia (NDMO regulation)
   - Islamic finance: Sharia-compliant stock screening mandatory (separate AI module)
   - AI recalibration: Saudi macro cycles differ from Egypt (oil-driven, Vision 2030)

2. **UAE (DFM + ADX)** — Cosmopolitan, English + Arabic, lower regulatory friction
   - Regulatory: SCA, DIFC Financial Free Zone option
   - Multi-nationality users (expats): multilingual UI more important
   - No data sovereignty requirement as strict as Egypt/KSA

3. **Kuwait, Qatar, Bahrain** — Extension of Saudi infrastructure with per-market calibration

**Phase 2 Technical Prerequisites:**
```
[ ] Multi-currency engine (EGP, SAR, AED, KWD, QAR, BHD) with Decimal.js
[ ] Saudi Arabia data residency infrastructure (Riyadh data center)
[ ] Tadawul data feed integration (vendor: Refinitiv, Bloomberg, or Tadawul direct)
[ ] Sharia-compliant filter AI school (ESGAnalysis school, Phase 2)
[ ] Arabic NLP recalibration for Gulf Arabic dialect
[ ] Multi-region architecture Phase 2 (Egypt primary + Saudi DR)
[ ] CMA regulatory compliance module (different from FRA)
```

---

### Phase 3: North Africa & Levant

**Phase 3 Trigger:**
- GCC Phase 2 MAU ≥ 200,000 combined
- Phase 2 profitability established
- Engineering team ≥ 60 engineers

**Phase 3 Technical Additions:**
- French NLP module (CAMeL-BERT equivalent for French + Darija)
- Casablanca Stock Exchange data feed
- Morocco AMMC regulatory compliance module
- Multi-currency: MAD (Moroccan Dirham), TND (Tunisian Dinar)

---

### Phase 4: Global Institutional

**Phase 4 Trigger:**
- Phase 3 established
- Engineering team ≥ 150 engineers
- FRA + CMA institutional track record clean

**Scope:** Not retail expansion — institutional-grade API for global funds investing in MENA markets.
Product pivot: From retail app → institutional data and analytics API.
Revenue model: Enterprise API licensing (USD 5,000–50,000/month).

---

## Section 3 — Exchange Integration Specifications (Phase 2)

### Tadawul (Saudi Arabia)

| Parameter | Value |
|-----------|-------|
| Trading hours | 10:00–15:00 AST (UTC+3) |
| Pre-market | 09:30–10:00 |
| Settlement | T+2 |
| Price limit | ±10% daily (±5% for new IPOs) |
| Circuit breaker | 5% index drop → 30-min halt |
| Tick size | 0.01 SAR |
| Data feed | Tadawul API or Refinitiv |
| Format | FIX protocol or REST API |
| Historical data | Tadawul Data Services |
| Latency (real-time) | < 500ms |

**AI recalibration required:**
- Oil price correlation coefficients for Saudi stocks
- Vision 2030 sector weighting (renewable energy, tourism, technology)
- SABIC, Aramco mega-cap dominance in index
- Islamic finance Sharia screening: 28 AAOIFI standards

### DFM & ADX (UAE)

| Parameter | Value |
|-----------|-------|
| Trading hours | 10:00–14:00 GST (UTC+4) |
| Settlement | T+2 |
| Price limit | ±15% daily |
| Circuit breaker | 5% index drop → 30-min halt |
| Data feed | DFM API or Bloomberg |
| Currencies | AED (pegged to USD at 3.6725) |

**Key distinction:** AED/USD peg simplifies FX arithmetic — no complex Decimal FX needed.

---

## Section 4 — Multi-Currency Engine Specification

### 4.1 Architecture Principle

All internal financial calculations remain in the user's **home currency**.
Currency conversion is display-only and uses rates refreshed every 15 minutes.

```typescript
// packages/shared-kernel/src/currency/multi-currency.ts
// PHASE 2: Multi-currency support

export type CurrencyCode = 'EGP' | 'SAR' | 'AED' | 'KWD' | 'QAR' | 'BHD' | 'MAD' | 'USD';

export interface FXRate {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: string;             // Decimal string — NEVER float
  validAt: string;          // ISO 8601 UTC timestamp
  validUntilAt: string;     // rate expires after 15 minutes
  source: 'ECB' | 'CBE' | 'SAMA_REFERENCE';
}

export class MultiCurrencyEngine {
  // All conversions use Decimal arithmetic — no float
  convert(
    amount: Decimal,
    from: CurrencyCode,
    to: CurrencyCode,
    rates: Map<string, FXRate>,
  ): Decimal {
    if (from === to) return amount;
    
    const rateKey = `${from}/${to}`;
    const fxRate = rates.get(rateKey);
    if (!fxRate) throw new Error(`No FX rate for ${rateKey}`);
    
    // Validate rate is not expired
    if (new Date() > new Date(fxRate.validUntilAt)) {
      throw new Error(`FX rate for ${rateKey} has expired`);
    }
    
    return amount.times(new Decimal(fxRate.rate)).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
  }
}
```

### 4.2 FX Rate Sources

| Currency Pair | Source | Update Frequency |
|--------------|--------|----------------|
| EGP/USD | CBE (Central Bank of Egypt) | Daily official rate |
| SAR/USD | Fixed 3.75 (KSA peg) | Effectively static |
| AED/USD | Fixed 3.6725 (UAE peg) | Effectively static |
| KWD/USD | CBK reference | Daily |
| QAR/USD | QCB reference | Daily |
| All/All | ECB cross-rates | Intraday (15-min refresh) |

---

## Section 5 — Regulatory Landscape Matrix

| Market | Regulator | License Type | Key Requirements | Timeline Estimate | Risk Level |
|--------|----------|-------------|-----------------|------------------|-----------|
| Egypt (Phase 1) | FRA | Information Service Provider | AI disclaimer, PDPL 2020, Arabic | 6-12 months | LOW |
| Saudi Arabia (Phase 2) | CMA | Capital Market Services License | Sharia screening, NDMO data sovereignty | 12-18 months | HIGH |
| UAE / DFM (Phase 2) | SCA | Financial Services Permission | Fit & proper, technology audit | 6-12 months | MEDIUM |
| UAE / DIFC (Phase 2) | DFSA | Authorized Firm (Arranging) | DFSA rulebook, AML/KYC | 9-15 months | MEDIUM |
| Kuwait (Phase 2) | CMA Kuwait | Capital Markets License | Arabic only, limited digital services | 18-24 months | HIGH |
| Morocco (Phase 3) | AMMC | Prestataire de Services d'Investissement | French + Arabic, CNDP data law | 12-18 months | MEDIUM |
| Jordan (Phase 3) | JSC | Licensed Financial Advisor | Lower barrier | 6-12 months | LOW |
| UK/EU (Phase 4) | FCA / ESMA | MiFID II, FCA Authorization | Highest compliance bar | 24-36 months | VERY HIGH |

---

## Section 6 — Localization Requirements by Phase

### Arabic (All Phases)
- RTL text direction enforced in Flutter
- Arabic number formatting: ١٢٣٤.٥٦ OR 1,234.56 (user preference)
- Date format: يوليو ٢٤، ٢٠٢٦ / 24 يوليو 2026
- AI explanations: Modern Standard Arabic (MSA) for Phase 1
- Phase 2 Gulf: Gulf Arabic terminology adjustments (different financial vocabulary)

### French (Phase 3 — Morocco, Tunisia)
- LTR direction, standard French typography
- French financial terminology (not translated from English — use native French terms)
- CAMeL-BERT equivalent for French: CamemBERT-Finance model
- Date: 24 juillet 2026

### Islamic Finance Localization (Phase 2 — Saudi, Kuwait, Qatar)
```python
# Sharia Compliance Filter — Phase 2 AI School
class IslamicFinanceSchool:
    """
    Phase 2 AI school: filters stocks for Sharia compliance.
    AAOIFI standard (Islamic financial institution standard).
    """
    PROHIBITED_SECTORS = [
        'BANKING_CONVENTIONAL',  # Interest-based banking
        'INSURANCE_CONVENTIONAL',  # Gambling element
        'ALCOHOL',
        'TOBACCO',
        'PORK',
        'WEAPONS',
        'ENTERTAINMENT_HARAM',
    ]
    
    DEBT_TO_EQUITY_MAX = Decimal('0.33')  # AAOIFI 33% max leverage
    INTEREST_INCOME_REVENUE_MAX = Decimal('0.05')  # < 5% of revenue
    
    def assess_sharia_compliance(self, company: CompanyProfile) -> ShariahAssessment:
        violations = []
        
        if company.primary_sector in self.PROHIBITED_SECTORS:
            violations.append(f"Prohibited sector: {company.primary_sector}")
        
        if company.debt_to_equity > self.DEBT_TO_EQUITY_MAX:
            violations.append(f"Leverage too high: {company.debt_to_equity} > {self.DEBT_TO_EQUITY_MAX}")
        
        if company.interest_income_ratio > self.INTEREST_INCOME_REVENUE_MAX:
            violations.append(f"Interest income too high: {company.interest_income_ratio}")
        
        return ShariahAssessment(
            is_compliant=len(violations) == 0,
            violations=violations,
            aaoifi_standard='AAOIFI-21',
            assessed_at=datetime.utcnow().isoformat(),
        )
```

---

## Section 7 — Engineering Team Scaling Model

| Phase | Markets Active | Engineering Headcount | Key Hires |
|-------|---------------|----------------------|----------|
| Phase 1 | Egypt (EGX) | 10–15 | Full-stack, AI/ML, DevOps, Compliance |
| Phase 2 | Egypt + GCC (6 markets) | 25–40 | Multi-region infra, Arabic NLP experts, FX engineers |
| Phase 3 | Phase 2 + N. Africa (3 markets) | 60–80 | French NLP, regional compliance, data engineers |
| Phase 4 | Global institutional | 150+ | Enterprise sales, institutional API, FCA-grade compliance |

**Critical Phase 2 hires:**
1. Multi-region infrastructure engineer (Kubernetes multi-cluster expert)
2. Saudi Arabian regulatory compliance specialist
3. Islamic finance / Sharia compliance AI specialist
4. Gulf Arabic NLP specialist (Tadawul financial terminology)
5. Multi-currency financial engineering lead

---

## Section 8 — Risk Register

| Risk | Probability | Impact | Mitigation | Escalation Trigger |
|------|------------|--------|-----------|-------------------|
| EGX data vendor disruption | HIGH | MEDIUM | Backup data vendor, 15-min buffer | Vendor outage > 30 min |
| CMA Saudi license denied | MEDIUM | HIGH | DIFC UAE as fallback Phase 2 entry | License denial |
| Arabic NLP quality degrades | LOW | HIGH | Monthly golden dataset evaluation | Accuracy < 65% |
| EGP currency crisis (devaluation) | MEDIUM | LOW | All calculations in local currency; no FX risk to Tradeora | > 20% devaluation in 30 days |
| Competitive entry (Bloomberg Arabic) | MEDIUM | HIGH | Speed to market, loyalty program, local brand | Major competitor launches |
| PDPL violation | LOW | VERY HIGH | Privacy by design, quarterly PDPL audit | Any user complaint to PDPL authority |
| FRA regulatory stance hardening | LOW | HIGH | Regular FRA engagement, advisory board | New FRA circular affecting AI advisors |
| GPU supply shortage (AI inference) | MEDIUM | MEDIUM | Cloud GPU fallback, model distillation to smaller models | Lead time > 12 weeks |
| Key engineer departure | MEDIUM | HIGH | Documentation-first culture, bus factor > 2 per domain | > 2 core engineers resign in 30 days |
| Phase 2 technical delays | MEDIUM | MEDIUM | EGX-first focus, no Phase 2 until Phase 1 gate met | Gate criteria not met by month 18 |

---

## Section 9 — Technology Decisions Triggered by Expansion

| Trigger | Technology Change | When |
|---------|-----------------|------|
| Phase 2 launch | Multi-currency Decimal.js engine | Before Phase 2 data |
| Phase 2 launch | TimescaleDB per-market schema isolation | Before Phase 2 data |
| Phase 2 launch | Multi-region Kubernetes (Cairo + Riyadh) | Before Saudi launch |
| Phase 2 launch | Kafka MirrorMaker 2 (cross-region events) | Before Saudi launch |
| Phase 2 launch | Gulf Arabic NLP model (fine-tuned CAMeL-BERT) | Before Saudi launch |
| Phase 2 launch | Sharia compliance AI school | Before Saudi launch |
| Phase 3 launch | French NLP model (CamemBERT-Finance) | Before Morocco launch |
| Phase 3 launch | Active-Active multi-region Kubernetes (3 regions) | Before Phase 3 |
| Phase 4 | Distributed SQL (CockroachDB or TiDB) | Before global scale |
| Phase 4 | OpenFGA for complex RBAC | Before institutional feature sets |

---

## Section 10 — Phase 1 → 2 Gate Decision Process

```
MONTHLY GATE REVIEW (from month 12 onwards):

1. Pull metrics dashboard:
   - MAU count (target: ≥ 50,000)
   - AI accuracy (target: ≥ 70% sustained 6 months)
   - Uptime (target: ≥ 99.9% sustained 3 months)
   - Compliance violations (target: 0 critical)
   - Engineering headcount (target: ≥ 20)

2. Legal status check:
   - CMA Saudi Arabia license status?
   - SCA UAE license status?

3. Gate decision: ALL 6 criteria met?
   ├── YES → Board approval for Phase 2 budget
   │         Engineering begins Phase 2 architecture
   │         Recruit Phase 2 engineers
   └── NO  → Continue Phase 1 focus
             Document which criteria are blocking
             Create 90-day plan to close gap
```

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT FOOTER                                                             ║
║  Document: GLOBAL_EXPANSION_STRATEGY.md                                     ║
║  Version:  1.0.0                                                            ║
║  Owner:    Product + Strategy + Engineering Leadership                       ║
║  Completeness: 97% — Covers 4-phase plan, regulatory matrix, tech          ║
║    decisions, FX engine, localization, risk register, gate criteria.         ║
║  Review: Quarterly or when Phase 1 gate criteria change                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Section 11 — Partnership & Market Entry Strategy by Region

### 11.1 Egypt (Phase 1) — Go-to-Market

| Partner Type | Potential Partners | Value Add |
|-------------|------------------|-----------|
| Data Vendor | EGX Official Data Feed, Mubasher | Real-time tick data license |
| Distribution | Banque Misr, CIB mobile app integration | Access to 10M+ retail bank customers |
| Regulatory Advisor | Egyptian compliance law firms | FRA licensing acceleration |
| Co-marketing | Egyptian Investment and Finance Association | Credibility with retail investors |

**Phase 1 distribution model:**
- Direct: Android/iOS app (Google Play, Apple App Store)
- Web: Progressive Web App (PWA) for desktop users
- API: B2B API for Egyptian fintechs and robo-advisors (Phase 1.5)

### 11.2 Saudi Arabia (Phase 2) — Market Entry

Saudi Arabia is Tradeora's most significant Phase 2 market. The Tadawul (Saudi Exchange)
is the largest stock exchange in MENA with a market cap exceeding **$2.5 trillion USD**.

```
SAUDI MARKET STRATEGY:
━━━━━━━━━━━━━━━━━━━━━

1. Regulatory first:
   - Engage Saudi CMA Fintech Lab sandbox (min. 6 months before launch)
   - SAMA Fintech Lab sandbox for any banking-adjacent features
   - Appoint Saudi CMA-accredited compliance officer (local hire)

2. Localization:
   - Gulf Arabic dialect NLP model (distinct from Egyptian Arabic)
   - Sharia-compliant investment screening (mandatory for Saudi market)
   - Hijri calendar support (Saudi investors prefer Hijri dates for zakat calculations)
   - Integration with Absher (Saudi national identity) for KYC

3. Distribution:
   - Al Rajhi Bank integration (largest Islamic bank globally — 15M customers)
   - Riyad Bank and Saudi National Bank partnership discussions
   - Direct app distribution (Saudi App Store + Google Play)
   - Tadawul institutional API (Phase 2.5 - B2B)

4. Data:
   - Tadawul official data license (mandatory for legal market data display)
   - Saudi Stock Exchange (Nomu) data for parallel market coverage
   - Aramco, SABIC, STC — top 3 Tadawul stocks by weight
```

### 11.3 UAE (Phase 2) — Market Entry

UAE has two distinct markets: DFM (Dubai Financial Market) and ADX (Abu Dhabi Securities Exchange).

```
UAE MARKET STRATEGY:
━━━━━━━━━━━━━━━━━━━

1. Regulatory:
   - SCA license (UAE Securities and Commodities Authority)
   - DIFC DFSA consideration for institutional features
   - Abu Dhabi Global Market (ADGM) for AI financial services

2. Unique UAE factors:
   - English as co-primary language (alongside Arabic) — bilingual app required
   - High expat population — international portfolio integration (Phase 3)
   - UAE gold market — add gold price tracking (DGD, DUBAI GOLD SOUK)
   - Crypto legal in UAE — watch regulatory developments for Phase 3

3. Distribution:
   - Emirates NBD Liv. integration
   - FAB (First Abu Dhabi Bank) partnership
   - Direct app (UAE users are mobile-first)
```

---

## Section 12 — Competitive Positioning by Market

### 12.1 Egypt — Competitive Landscape

| Competitor | Type | Strengths | Tradeora Advantage |
|-----------|------|-----------|-------------------|
| EFG Hermes Research | Sell-side research | Deep institutional research | AI-powered retail-grade analysis, 24/7 |
| Mubasher | Market data platform | Large user base, established | AI consensus engine; Arabic-native UX |
| EGX official app | Exchange app | Official data source | Portfolio management; AI recommendations |
| Generic robo-advisors | Global platforms | International assets | EGX-specific depth; Egyptian regulatory compliance |

**Tradeora's Unique Positioning (Egypt):**
- Only AI system using **17-school consensus** specifically trained on EGX data
- **Arabic-first**: All AI outputs in Egyptian Arabic
- **PDPL compliant**: Data sovereignty — user data never leaves Egypt
- **Open source first**: No vendor lock-in; community-auditable AI

### 12.2 GCC — Competitive Landscape

| Competitor | Coverage | Weakness | Tradeora Angle |
|-----------|---------|---------|----------------|
| Bahrain FinHub platforms | GCC regional | Limited AI depth | AI consensus per local market |
| Tadawul Investor App | Saudi only | No AI analysis | Full analysis engine on Tadawul |
| Refinitiv Eikon | Global professional | Expensive ($30K+/year) | Retail-accessible price point |
| Bloomberg Terminal | Global | Same pricing barrier | AI-native; Arabic-first |

---

## Section 13 — Market Sizing & Revenue Projection

### 13.1 Total Addressable Market (TAM)

| Market | Retail Investors | Stock Market Value | Phase | TAM (Annual) |
|--------|----------------|------------------|-------|-------------|
| Egypt | 1.2M registered EGX investors | $50B market cap | 1 | $180M |
| Saudi Arabia | 3.5M registered Tadawul investors | $2.5T market cap | 2 | $700M |
| UAE | 900K registered DFM/ADX investors | $220B market cap | 2 | $200M |
| Kuwait | 600K investors | $150B market cap | 3 | $120M |
| Qatar | 400K investors | $180B market cap | 3 | $90M |
| Morocco | 500K investors | $80B market cap | 3 | $80M |
| **Total MENA** | **~7M investors** | **~$3.2T** | **1-3** | **~$1.37B** |

*TAM calculated as: registered investors × assumed 15% Tradeora addressable × $180/year ARPU*

### 13.2 Serviceable Addressable Market (SAM) & Revenue Targets

```
Phase 1 SAM (Egypt only):
- Target market penetration: 5% of 1.2M EGX investors = 60,000 MAU
- Average revenue per user: EGP 300/month (blended across tiers)
- Annual revenue target: 60,000 × EGP 300 × 12 = EGP 216M (~$4.5M USD)
- Phase 1 break-even: ~25,000 paying subscribers

Phase 2 SAM (Egypt + Saudi + UAE):
- Combined target: 2% of 5.6M GCC investors = 112,000 MAU
- Blended ARPU: EGP 400/month (higher due to GCC purchasing power)
- Annual revenue target: ~EGP 500M+ (~$10M+ USD)

Phase 3 SAM (Full MENA):
- Target: 1% of 7M investors = 70,000 + Phase 1/2 retained users
- Total MAU target: 300,000+
- Annual revenue target: $25M+ USD (institutional contracts included)
```

### 13.3 Unit Economics

| Metric | Target | Notes |
|--------|--------|-------|
| Customer Acquisition Cost (CAC) | EGP 150–300 | Social media + referral program |
| Average Revenue Per User (ARPU) | EGP 300/month (blended) | RETAIL=EGP 200; WEALTH=EGP 800 |
| Customer Lifetime Value (LTV) | EGP 7,200 (24 months) | Assuming 50% 2-year retention |
| LTV:CAC Ratio | 24:1 to 48:1 | Target: > 3:1 (healthy) |
| Gross Margin | 75–85% | SaaS model; AI compute is main variable cost |
| Monthly Churn (target) | < 3% | Financial apps have high switching costs |
| Payback Period | < 2 months | (CAC / Monthly ARPU) |

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT FOOTER (EXPANDED)                                                  ║
║  Document: GLOBAL_EXPANSION_STRATEGY.md                                     ║
║  Version:  1.0.1 (expanded with partnerships, competitive analysis,         ║
║    market sizing, unit economics, and per-region GTM strategy)              ║
║  Owner:    Product + Strategy + Engineering Leadership                       ║
║  Completeness: 99%                                                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
```
