# TRADEORA UBIQUITOUS LANGUAGE & CANONICAL DOMAIN VOCABULARY

**Document Reference:** `docs/UBIQUITOUS_LANGUAGE.md`  
**Version:** 1.0.0  
**Status:** CANONICAL BINDING VOCABULARY  
**Effective Date:** July 21, 2026  
**Governance Authority:** Architecture Governance Board & Domain Language Specialist  
**Supersedes:** `docs/BUSINESS_DOMAIN_DISCOVERY.md` Section 17 (Preliminary Draft Glossary)  
**Governed By:** `docs/PROJECT_CONSTITUTION.md`

---

## SECTION 1 — HOW TO USE THIS DOCUMENT

### 1.1 Overview and Purpose
This document is the **Single Source of Truth (SSoT)** for every term, word, label, variable name, and concept used across the Tradeora Financial Operating System. Tradeora operates in a high-precision, zero-trust financial domain across the Egyptian Exchange (EGX), Middle East and North Africa (MENA) markets, and global financial venues. Inconsistent, informal, or synonymous terminology introduces severe operational risk, ambiguity in financial models, database corruptions, regulatory non-compliance, and AI model hallucinations.

A term defined in this document is the **ONLY allowed name** for that specific financial or technical concept. Synonyms, informal abbreviations, legacy vendor terms (e.g., Bloomberg/Refinitiv jargon), and generic CRUD terminology are **strictly forbidden**.

### 1.2 Usage Protocols by Role

#### 1.2.1 How Engineers Must Use This Document
*   **Code Identifiers:** Class names, struct types, domain model aggregates, entities, value objects, method signatures, variable names, database tables, database columns, and API parameters MUST strictly derive from the `IDENTIFIER CONVENTION` and `API FIELD NAMING STANDARD` declared herein.
*   **Domain Events:** Event schemas and event topics MUST use the exact `SCREAMING_SNAKE_CASE` naming declared in Section 4.
*   **Code Reviews:** Code reviewers MUST reject any Pull Request (PR) containing forbidden synonyms, unauthorized abbreviations, or generic names (e.g., `data`, `info`, `manager`, `item`).
*   **Comments & Documentation:** Code comments, docstrings, and inline notes MUST use canonical English and Arabic terms.

#### 1.2.2 How Product Managers Must Use This Document
*   **Feature Specifications & PRDs:** Every product requirement document, user story, and feature spec MUST use canonical terms.
*   **UI/UX Copy:** All user-facing labels, tooltips, error messages, educational breakdowns, and navigation items MUST match the `UI Label (EN)` and `UI Label (AR)` defined in Section 8.
*   **Client & Stakeholder Communication:** Product managers MUST enforce this vocabulary during discussions with external data vendors, regulatory authorities (FRA/CMA/SEC), and client advisory partners.

#### 1.2.3 How AI Agents Must Use This Document
*   **Pre-Generation Context:** Every AI coding agent, research agent, copilot model, and prompt engineering pipeline operating on Tradeora MUST load and parse this document prior to performing any code generation, architectural analysis, or response synthesis.
*   **Synonym Rejection:** AI agents MUST actively scan user prompts and internal contexts for forbidden synonyms and automatically map them to their canonical terms.
*   **Domain Boundary Respect:** AI agents MUST refuse to invent new domain terms or alter existing naming conventions without following the formal New Term Discovery Protocol (Section 12).

### 1.3 Handling Undocumented Concepts & Disagreements

#### What to Do When a New Concept Is Discovered
If a developer, product manager, or AI agent encounters a legitimate financial or technical concept that is not yet defined in this document:
1.  **Do NOT invent an ad-hoc term** in code, database migrations, or specifications.
2.  Immediately initiate the **New Term Discovery Protocol** (Section 12).
3.  Use a temporary, explicitly flagged proposal identifier (`PROP_[CONCEPT_NAME]`) in draft documentation until formal approval.

#### What to Do When Teams Disagree on a Term
1.  **Stop Implementation:** No code or spec using the disputed term may be merged.
2.  **Refer to the Constitution:** Review `docs/PROJECT_CONSTITUTION.md` Section 7 (Domain Language Rules) and Section 3 (Business Boundaries).
3.  **Escalate to the Language Specialist:** Submit a formal clarification request to the Architecture Governance Board. The decision rendered by the Governance Board is final and immutable.

### 1.4 Governance and Amendment Linkage
This document is governed under Constitution-level amendment rules. Any modification, addition, or retirement of a canonical term requires a formal version update following the protocols defined in Section 12 and Section 14.

---

## SECTION 2 — FORBIDDEN SYNONYMS REGISTRY

This section is the primary defensive mechanism against naming fragmentation. For every concept subject to common synonym confusion, this registry dictates the canonical term and explicitly bans all alternatives across code, APIs, databases, UI copy, and verbal team communication.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    FORBIDDEN SYNONYMS QUICK REFERENCE                     │
├──────────────────────────────────────┬────────────────────────────────────┤
│ CANONICAL TERM                       │ FORBIDDEN ALIASES (NEVER USE)      │
├──────────────────────────────────────┼────────────────────────────────────┤
│ Instrument                           │ Security, Asset, Product, Symbol   │
│ Exchange                             │ Market, Venue, Platform, Bourse    │
│ Portfolio                            │ Account, Holdings, Fund, Wallet    │
│ Position                             │ Holding, Lot, Stake, Inventory     │
│ Trade                                │ Order, Transaction, Execution, Deal│
│ Recommendation                       │ Signal, Tip, Advice, Insight       │
│ Price                                │ Quote, Rate, Value, Level          │
│ Return                               │ Gain, Profit, Yield, Performance   │
│ Risk                                 │ Exposure, Volatility, Uncertainty  │
│ ResearchReport                       │ Analysis, Study, Brief, Note       │
│ Weight                               │ Allocation, Proportion, Share %    │
│ Benchmark                            │ Index, Reference, Baseline         │
│ FairValue                            │ Forecast, Prediction, Projection   │
│ Watchlist                            │ List, Favorites, Tracker           │
│ Notification                         │ Alert, Message, Warning, Push      │
│ UserProfile                          │ User, Investor, Client, Customer   │
│ Subscription                         │ Plan, License, Tier, Package       │
│ MarketSession                        │ Period, Window, Interval           │
│ CorporateAction                      │ Event, Adjustment, Distribution    │
│ ConfidenceScore                      │ Probability, Score, Rating         │
└──────────────────────────────────────┴────────────────────────────────────┘
```

### 2.1 Asset vs Instrument vs Security vs Product vs Symbol
*   **CANONICAL TERM:** `Asset` (for underlying economic entity) | `Instrument` (for tradable market contract)
*   **FORBIDDEN SYNONYMS:** Security, Product, Symbol, Ticker-Item, Financial Good
*   **WHY THIS MATTERS:** In financial architecture, an "Asset" is the legal economic entity (e.g., Commercial International Bank), whereas an "Instrument" is the specific tradable vehicle listed on an exchange segment (e.g., `COMI.CA` on EGX). Confusing these leads to database corruption when an Asset has multiple listings or ADRs across global exchanges. "Symbol" is merely a string identifier of an Instrument, not the Instrument itself.
*   **CORRECT USAGE EXAMPLE:** `const instrument = securityMaster.getBySymbol("COMI.CA");`
*   **WRONG USAGE EXAMPLE:** `const product = securityMaster.getSecurity("COMI.CA");`

### 2.2 Exchange vs Market vs Venue vs Platform
*   **CANONICAL TERM:** `Exchange` (organization) | `Market` (trading segment)
*   **FORBIDDEN SYNONYMS:** Venue, Platform, Trading Pit, Bourse
*   **WHY THIS MATTERS:** An Exchange (e.g., Egyptian Exchange) contains multiple distinct Markets (e.g., EGX Main Market, Nilex SME Market). Calling everything a "Venue" or "Platform" obscures listing rules, clearing mechanisms, and regulatory boundaries.
*   **CORRECT USAGE EXAMPLE:** `const exchange = marketCalendarService.getExchangeByMic("XCAI");`
*   **WRONG USAGE EXAMPLE:** `const venue = marketCalendarService.getPlatform("XCAI");`

### 2.3 Portfolio vs Account vs Holdings vs Fund
*   **CANONICAL TERM:** `Portfolio` (collection of positions) | `UserProfile` / `Account` (user identity & credentials)
*   **FORBIDDEN SYNONYMS:** Holdings, Fund, Wallet, Investment Container
*   **WHY THIS MATTERS:** An `Account` represents billing, identity, and credentials. A `Portfolio` represents an authoritative ledger of positions under specific risk parameters. An Account can own multiple Portfolios. Calling a Portfolio a "Fund" implies institutional pooled vehicle legal structures, causing compliance breaches.
*   **CORRECT USAGE EXAMPLE:** `const portfolio = portfolioService.getPortfolioById(portfolioId);`
*   **WRONG USAGE EXAMPLE:** `const wallet = accountService.getFund(portfolioId);`

### 2.4 Position vs Holding vs Lot vs Stake
*   **CANONICAL TERM:** `Position`
*   **FORBIDDEN SYNONYMS:** Holding, Lot, Stake, Inventory, Quantity-Block
*   **WHY THIS MATTERS:** A `Position` represents the aggregated quantity of a specific Instrument held within a single Portfolio. "Holding" is vague, "Lot" refers to tax-lot sub-components of a position, and "Stake" implies percentage ownership of total corporate equity.
*   **CORRECT USAGE EXAMPLE:** `const position = portfolio.getPositionByInstrument(instrumentId);`
*   **WRONG USAGE EXAMPLE:** `const holding = portfolio.getLot(instrumentId);`

> **NOTE (v1.1 Correction):** The `TACTICAL_DOMAIN_MODEL.md` uses `PositionHolding` as an Aggregate Root name — this was a naming inconsistency corrected in v1.1. The authoritative term is `Position`. `PositionHolding` is **deprecated** and MUST NOT be used in new code or domain model specifications. `TaxLot` is permitted as an internal entity name within the `Position` aggregate (implementation concept only, not domain language visible to users or exposed in public APIs).

### 2.4.1 TaxLot (Implementation-Only Internal Entity)
*   **TERM (English):** TaxLot
*   **TERM (Arabic):** وحدة الأساس الضريبي (مفهوم تطبيقي داخلي فقط)
*   **DEFINITION:** An internal accounting entity within the `Position` aggregate that tracks the acquisition cost basis of a specific purchase lot for tax calculation and capital gains computation purposes. A TaxLot records: the lot's purchase date, share quantity, cost basis price per share (in `Money`), settlement date (T+2), and FIFO/LIFO lot ordering sequence.
*   **SCOPE IN TRADEORA:** Used exclusively within `CTX-POS` (Position Context) and `CTX-TAX` (Tax Calculation Context) for realized gain/loss calculation upon position reduction or closure. Never surfaced in user interfaces, external APIs, or cross-context events.
*   **NOT A SYNONYM FOR:** `Position`. A single `Position` may contain multiple `TaxLot` sub-entities representing distinct buy transactions at different prices and dates.
*   **VISIBILITY CONSTRAINT:** Implementation concept only — never used in user-facing language, UI labels, API response fields, or domain event payload keys visible outside `CTX-POS`.
*   **IDENTIFIER CONVENTION:** Code/DB: `TaxLot` (internal entity) | ID format: `TaxLotId` (`PositionId` + `LotSequence`, e.g. `POS-101#LOT-02`)
*   **RELATED TERMS:** `Position`, `RealizedGain`, `CostBasis`, `Settlement`
*   **FORBIDDEN SYNONYMS:** Lot (as synonym for Position), PositionHolding, Stake

### 2.5 Trade vs Order vs Transaction vs Execution vs Deal
*   **CANONICAL TERM:** `Order` (instruction) | `Trade` / `Execution` (filled transaction)
*   **FORBIDDEN SYNONYMS:** Transaction, Deal, Fill-Record, Purchase-Action
*   **WHY THIS MATTERS:** An `Order` is a pending or cancelled instruction submitted by a user. A `Trade` (or `Execution`) is a completed market transaction resulting from a filled Order. Conflating them causes severe state tracking bugs where unfulfilled orders are accounted for as settled trades.
*   **CORRECT USAGE EXAMPLE:** `const trade = executionService.processFill(order, fillPrice);`
*   **WRONG USAGE EXAMPLE:** `const transaction = executionService.processOrderDeal(order);`

### 2.6 Signal vs Recommendation vs Insight vs Tip vs Alert
*   **CANONICAL TERM:** `AISignal` (quantitative indicator flag) | `Recommendation` (personalized advice proposal) | `AIInsight` (enriched context)
*   **FORBIDDEN SYNONYMS:** Tip, Advice, Hot-Pick, Forecast-Flag, Suggestion
*   **WHY THIS MATTERS:** A `Signal` is an objective mathematical setup carrying zero personal suitability context. A `Recommendation` is a personalized, risk-adjusted proposal subject to strict regulatory suitability rules (FRA/CMA). Calling a recommendation a "Tip" violates Constitution Principle 3.2.5 (Prohibition of Gambling/Tip Platforms).
*   **CORRECT USAGE EXAMPLE:** `const recommendation = recommendationEngine.synthesize(userProfile, portfolio, signal);`
*   **WRONG USAGE EXAMPLE:** `const tip = advisorEngine.getHotPick(userProfile);`

### 2.7 Price vs Quote vs Rate vs Value vs Level
*   **CANONICAL TERM:** `Price` (monetary security valuation) | `ExchangeRate` (FX conversion factor)
*   **FORBIDDEN SYNONYMS:** Quote, Rate (for stocks), Value (for price), Level, Mark
*   **WHY THIS MATTERS:** `Price` explicitly represents monetary units per instrument share. `Rate` is strictly reserved for interest rates or foreign exchange ratios. "Quote" refers to a Bid/Ask pair snapshot. Conflating these leads to bad type casting in financial math modules.
*   **CORRECT USAGE EXAMPLE:** `const price = priceService.getLastPrice(instrumentId);`
*   **WRONG USAGE EXAMPLE:** `const rate = priceService.getQuoteLevel(instrumentId);`

### 2.8 Return vs Gain vs Profit vs Yield vs Performance
*   **CANONICAL TERM:** `TotalReturn` / `TWR` / `MWR` (percentage return) | `RealizedGain` / `UnrealizedGain` (monetary P&L) | `DividendYield` (annual income ratio)
*   **FORBIDDEN SYNONYMS:** Profit, Gain %, Performance-Value, Earnings-Return, Yield (for capital gains)
*   **WHY THIS MATTERS:** "Profit" is an accounting income statement term for corporations, NOT a portfolio return metric. "Yield" specifically measures annualized cash flows relative to price. Using "Yield" when meaning percentage capital return corrupts financial reporting.
*   **CORRECT USAGE EXAMPLE:** `const twr = performanceEngine.calculateTWR(portfolioId);`
*   **WRONG USAGE EXAMPLE:** `const profitYield = performanceEngine.getPerformanceProfit(portfolioId);`

### 2.9 Risk vs Exposure vs Volatility vs Uncertainty
*   **CANONICAL TERM:** `Risk` (broad metric domain) | `Exposure` (monetary capital at risk) | `Volatility` (standard deviation)
*   **FORBIDDEN SYNONYMS:** Uncertainty, Danger-Score, Vulnerability, Fluctuating-Metric
*   **WHY THIS MATTERS:** `Exposure` is a monetary currency amount (e.g., 500,000 EGP exposed to Banking sector). `Volatility` is a statistical dispersion percentage. `Risk` is the governing profile context. Confusing exposure with volatility produces mathematically invalid VaR calculations.
*   **CORRECT USAGE EXAMPLE:** `const exposure = riskService.calculateSectorExposure(portfolio, sectorId);`
*   **WRONG USAGE EXAMPLE:** `const vulnerability = riskService.getSectorVolatilityAmount(portfolio);`

### 2.10 Research vs Analysis vs Report vs Study vs Brief
*   **CANONICAL TERM:** `ResearchReport` (deep equity document) | `MarketBrief` (daily summary synthesis)
*   **FORBIDDEN SYNONYMS:** Analysis-Doc, Study, Research-Note, Market-Paper, Memo
*   **WHY THIS MATTERS:** `ResearchReport` represents a formal, auditable equity research artifact containing valuation models. `MarketBrief` is a short-form AI synthesis of daily news. Conflating them degrades content entitlement gating.
*   **CORRECT USAGE EXAMPLE:** `const report = researchService.getResearchReportByAsset(assetId);`
*   **WRONG USAGE EXAMPLE:** `const study = researchService.getAnalysisDoc(assetId);`

### 2.11 Allocation vs Weight vs Proportion vs Percentage
*   **CANONICAL TERM:** `TargetWeight` / `ActualWeight` (percentage of portfolio) | `AssetAllocation` (distribution across classes)
*   **FORBIDDEN SYNONYMS:** Allocation %, Proportion, Share-Ratio, Portfolio-Fraction
*   **WHY THIS MATTERS:** `Weight` is a precise decimal figure (e.g., `0.15` for 15%) summing to `1.00` across a portfolio. "Allocation" refers to the target structure or strategy. Mixing integer percentages (15) and decimal weights (0.15) causes catastrophic 100x calculation errors in rebalancing engines.
*   **CORRECT USAGE EXAMPLE:** `const actualWeight = position.marketValue / portfolio.netAssetValue;`
*   **WRONG USAGE EXAMPLE:** `const allocationShare = position.amount / portfolio.total;`

### 2.12 Benchmark vs Index vs Reference vs Baseline
*   **CANONICAL TERM:** `Benchmark` (performance comparison standard) | `Index` (calculated market basket)
*   **FORBIDDEN SYNONYMS:** Reference, Baseline, Standard-Track, Comparison-Index
*   **WHY THIS MATTERS:** An `Index` (e.g., EGX30) is a specific calculated market instrument. A `Benchmark` is a role played by an Index or blended asset model when linked to a Portfolio for alpha attribution.
*   **CORRECT USAGE EXAMPLE:** `const benchmark = portfolio.getBenchmark();`
*   **WRONG USAGE EXAMPLE:** `const baseline = portfolio.getReferenceIndex();`

### 2.13 Forecast vs Prediction vs Projection vs Estimate
*   **CANONICAL TERM:** `FairValue` (calculated intrinsic value) | `ConsensusEstimate` (analyst earnings forecast)
*   **FORBIDDEN SYNONYMS:** Prediction, Target-Forecast, Stock-Projection, Speculative-Target
*   **WHY THIS MATTERS:** Tradeora strictly rejects "Predictions" or "Forecasts" of future market prices (violating Constitution Principle 3.2.5). The system calculates mathematical `FairValue` based on DCF models and ingests corporate `ConsensusEstimate` figures.
*   **CORRECT USAGE EXAMPLE:** `const fairValue = valuationEngine.calculateDCF(assetId);`
*   **WRONG USAGE EXAMPLE:** `const pricePrediction = valuationEngine.predictStockPrice(assetId);`

### 2.14 Watchlist vs List vs Favorites vs Tracker
*   **CANONICAL TERM:** `Watchlist` | `WatchlistItem`
*   **FORBIDDEN SYNONYMS:** Favorites, List, Follow-Tracker, Stock-Basket, Saved-Items
*   **WHY THIS MATTERS:** `Watchlist` is an authoritative domain aggregate owning monitoring rules and alert triggers. Generic names like "List" or "Favorites" obscure domain intent in database schemas.
*   **CORRECT USAGE EXAMPLE:** `const watchlist = watchlistService.getUserWatchlist(userProfileId);`
*   **WRONG USAGE EXAMPLE:** `const favorites = accountService.getSavedList(userProfileId);`

### 2.15 Notification vs Alert vs Message vs Warning
*   **CANONICAL TERM:** `Alert` (domain condition rule) | `Notification` (dispatched user message)
*   **FORBIDDEN SYNONYMS:** Message, Push-Notice, Warning-Item, System-Pop
*   **WHY THIS MATTERS:** An `Alert` is a domain-layer rule evaluated by background engines (e.g., VaR breach rule). A `Notification` is the presentation-layer message payload delivered to a user device via push, email, or in-app channels.
*   **CORRECT USAGE EXAMPLE:** `const notification = notificationService.dispatchFromAlert(triggeredAlert);`
*   **WRONG USAGE EXAMPLE:** `const message = alertService.sendWarningNotice(triggeredAlert);`

### 2.16 User vs Investor vs Client vs Customer vs Account
*   **CANONICAL TERM:** `UserProfile` (domain actor record) | `Account` (credential/billing container)
*   **FORBIDDEN SYNONYMS:** Investor (in code), Client, Customer, User-Record, Login-Identity
*   **WHY THIS MATTERS:** "Investor" is a human role description. "UserProfile" is the software entity containing preferences, risk profiles, and locale settings. "Client" implies advisory relationships in B2B contexts.
*   **CORRECT USAGE EXAMPLE:** `const userProfile = userDomainService.getProfileById(userId);`
*   **WRONG USAGE EXAMPLE:** `const investor = userService.getCustomerRecord(userId);`

### 2.17 Subscription vs Plan vs License vs Tier vs Package
*   **CANONICAL TERM:** `Subscription` (commercial entitlement record) | `SubscriptionTier` (Basic, Professional, Enterprise)
*   **FORBIDDEN SYNONYMS:** Plan, License, Access-Package, Membership-Tier, User-Level
*   **WHY THIS MATTERS:** `Subscription` binds a `UserProfile` to a `SubscriptionTier` and manages renewal, entitlements, and API quotas. "License" implies downloadable software rights.
*   **CORRECT USAGE EXAMPLE:** `const subscription = subscriptionService.getActiveSubscription(userProfileId);`
*   **WRONG USAGE EXAMPLE:** `const plan = billingService.getUserLicense(userProfileId);`

### 2.18 Session vs Period vs Window vs Interval (market time)
*   **CANONICAL TERM:** `MarketSession` (exchange operational window) | `TimeInterval` (OHLCV bar window) | `UserSession` (auth token state)
*   **FORBIDDEN SYNONYMS:** Period, Window (for exchange hours), Slot, Trading-Block
*   **WHY THIS MATTERS:** A `MarketSession` represents official exchange trading phases (Pre-Open, Continuous, Closing Auction). Using "Session" without context causes collision between user JWT authentication states and exchange trading hours.
*   **CORRECT USAGE EXAMPLE:** `const sessionState = marketCalendarService.getMarketSession(exchangeMic);`
*   **WRONG USAGE EXAMPLE:** `const period = calendarService.getWindow(exchangeMic);`

### 2.19 Corporate Action vs Event vs Adjustment vs Distribution
*   **CANONICAL TERM:** `CorporateAction` | `CashDividend` | `StockSplit` | `RightsIssue`
*   **FORBIDDEN SYNONYMS:** Event, Company-Adjustment, Distribution-Notice, Capital-Event
*   **WHY THIS MATTERS:** `CorporateAction` is a formal aggregate representing binding corporate modifications. Generic "Event" collides with Domain Events in software architecture.
*   **CORRECT USAGE EXAMPLE:** `const corporateAction = corporateActionService.getById(actionId);`
*   **WRONG USAGE EXAMPLE:** `const event = companyService.getAdjustmentEvent(actionId);`

### 2.20 Confidence Score vs Probability vs Score vs Rating
*   **CANONICAL TERM:** `ConfidenceScore` (statistical AI certainty percentage) | `FactorScore` (quantitative factor metric)
*   **FORBIDDEN SYNONYMS:** Probability, Rating, AI-Rank, Certainty-Index, Star-Score
*   **WHY THIS MATTERS:** `ConfidenceScore` is explicitly a 0.00% to 100.00% calibrated statistical metric indicating AI model uncertainty. Calling it "Probability" implies stochastic future likelihoods, violating explainability guidelines.
*   **CORRECT USAGE EXAMPLE:** `const confidenceScore = recommendation.confidenceScore;`
*   **WRONG USAGE EXAMPLE:** `const probability = recommendation.probabilityRating;`

### 2.21 EGX/MENA Specific Conflict: Cleared Trade vs Settlement
*   **CANONICAL TERM:** `Trade` (executed fill) | `Settlement` (MCSD transfer completion) | `SettlementCycle` (T+2)
*   **FORBIDDEN SYNONYMS:** Clearing-Complete, Final-Trade, Transferred-Deal
*   **WHY THIS MATTERS:** On EGX, execution occurs at `T+0` (Trade timestamp), but ownership and cash settlement via Misr for Clearing, Settlement and Depository (MCSD) completes on `T+2` (`SettlementCycle`). Conflating trade execution with settlement causes illegal cash availability reporting.
*   **CORRECT USAGE EXAMPLE:** `const settlementDate = settlementService.calculateSettlementDate(tradeDate, "T+2");`
*   **WRONG USAGE EXAMPLE:** `const clearedDate = tradeService.getClearingDate(tradeDate);`

### 2.22 EGX/MENA Specific Conflict: EGP vs Local Currency vs Foreign Currency
*   **CANONICAL TERM:** `EGP` (Egyptian Pound ISO) | `BaseCurrency` (portfolio accounting currency) | `TradingCurrency` (instrument trading currency)
*   **FORBIDDEN SYNONYMS:** Local Money, Native Cash, Domestic Currency, Soft Currency
*   **WHY THIS MATTERS:** All financial amounts in APIs, DBs, and event payloads MUST carry explicit ISO-4217 currency codes (`EGP`, `SAR`, `USD`). Generic terms like "Local Currency" lead to un-tracked FX risk in multi-currency portfolios.
*   **CORRECT USAGE EXAMPLE:** `const price = Money.of(150.50, "EGP");`
*   **WRONG USAGE EXAMPLE:** `const price = Money.ofLocal(150.50);`

---

## SECTION 3 — CORE DOMAIN VOCABULARY

This section defines the canonical domain terms across Tradeora's 11 core sub-domains. Every entry provides full specifications including modern standard Arabic (فصحى) naming, precise business definitions, Tradeora scope, identifier conventions, related terms, forbidden synonyms, and EGX/MENA context notes.

---

### 3.1 Financial Instruments and Markets

#### 1. Asset
*   **TERM (English):** Asset
*   **TERM (Arabic):** أصل مالي
*   **DEFINITION:** The underlying economic entity, corporate issuer, or financial property possessing intrinsic economic value (e.g., Commercial International Bank CIB). An Asset exists independently of specific exchange listings or tradable contracts.
*   **SCOPE IN TRADEORA:** Serves as the parent entity in the Security Master for financial statement analysis, fundamental valuation (DCF), factor scoring, and news entity tagging.
*   **IDENTIFIER CONVENTION:** Code/DB: `Asset` | API: `assetId`, `assetName` | Event: `ASSET_*`
*   **RELATED TERMS:** `Instrument`, `AssetClass`, `SecurityMaster`, `Issuer`
*   **FORBIDDEN SYNONYMS:** Security, Product, Stock-Item, Financial Good
*   **EGX CONTEXT:** EGX listed companies (e.g., CIB, EFG Hermes) are modeled as Assets within the Egyptian jurisdiction.

#### 2. Instrument
*   **TERM (English):** Instrument
*   **TERM (Arabic):** أداة مالية
*   **DEFINITION:** A specific tradable financial contract referencing an Asset, listed on a specific Market within an Exchange, governed by explicit trading currency, tick size rules, and lot parameters (e.g., `COMI.CA` listed on EGX Main Market in EGP).
*   **SCOPE IN TRADEORA:** The primary entity for real-time price tick ingestion, order placement, position tracking, technical analysis, and watchlist monitoring.
*   **IDENTIFIER CONVENTION:** Code/DB: `Instrument` | API: `instrumentId`, `tickerSymbol` | Event: `INSTRUMENT_*`
*   **RELATED TERMS:** `Asset`, `Exchange`, `Market`, `TickerSymbol`, `ISIN`
*   **FORBIDDEN SYNONYMS:** Symbol, Ticker, Security, Product, Tradeable
*   **EGX CONTEXT:** Every stock traded on EGX carries a Reuters instrument ticker suffix `.CA` (e.g., `COMI.CA`, `HRHO.CA`).

#### 3. Security Master
*   **TERM (English):** Security Master
*   **TERM (Arabic):** السجل الرئيسي للأوراق المالية
*   **DEFINITION:** The centralized, authoritative reference registry within Tradeora that unifies ticker definitions, ISIN codes, asset classifications, exchange mappings, and corporate cross-listings across global markets.
*   **SCOPE IN TRADEORA:** Owned strictly by Market Data Domain to ensure single source of truth pricing and ticker resolution across all platform services.
*   **IDENTIFIER CONVENTION:** Code/DB: `SecurityMaster` | API: `securityMasterId` | Event: `SECURITY_MASTER_UPDATED`
*   **RELATED TERMS:** `Instrument`, `Asset`, `ISIN`, `Exchange`
*   **FORBIDDEN SYNONYMS:** TickerDB, SymbolRegistry, InstrumentCatalog
*   **EGX CONTEXT:** Resolves local EGX ticker symbols (e.g., `COMI`) to international ISIN numbers (e.g., `EGS60121C018`).

#### 4. Equity
*   **TERM (English):** Equity
*   **TERM (Arabic):** سهم / ملكية أسهم
*   **DEFINITION:** An asset class representing fractional ownership in a corporation, granting residual claims on corporate earnings and net assets.
*   **SCOPE IN TRADEORA:** Primary asset class covered in Phase 1 for EGX fundamental analysis, dividend yield tracking, and valuation modeling.
*   **IDENTIFIER CONVENTION:** Code/DB: `Equity` | Enum: `AssetClass.EQUITY`
*   **RELATED TERMS:** `AssetClass`, `Instrument`, `Dividend`, `EarningsReport`
*   **FORBIDDEN SYNONYMS:** Share-Stock, Common-Stock-Item
*   **EGX CONTEXT:** Represents common equity shares listed on EGX Main Market and Nilex SME Market.

#### 5. Bond
*   **TERM (English):** Bond
*   **TERM (Arabic):** سند دين
*   **DEFINITION:** A fixed-income debt instrument issued by a government or corporation to raise capital, obligating the issuer to pay periodic coupon interest and principal repayment at maturity.
*   **SCOPE IN TRADEORA:** Evaluated in Phase 1 for fixed-income yield analytics, clean/dirty pricing, and accrued interest calculations.
*   **IDENTIFIER CONVENTION:** Code/DB: `Bond` | Enum: `AssetClass.BOND`
*   **RELATED TERMS:** `Sukuk`, `AssetClass`, `ParValue`, `CouponRate`
*   **FORBIDDEN SYNONYMS:** Debt-Paper, Fixed-Note
*   **EGX CONTEXT:** Covers Egyptian Treasury Bonds and Corporate Bonds listed on the EGX Debt Market.

#### 6. Sukuk
*   **TERM (English):** Sukuk
*   **TERM (Arabic):** صكوك إسلامية
*   **DEFINITION:** Shariah-compliant financial certificates representing undivided proportional ownership in tangible assets, usufructs, or services, generating asset-backed returns rather than interest payments.
*   **SCOPE IN TRADEORA:** First-class fixed-income asset class in Tradeora Phase 1 for Egyptian sovereign/corporate Sukuk and MENA regional expansion.
*   **IDENTIFIER CONVENTION:** Code/DB: `Sukuk` | Enum: `AssetClass.SUKUK`
*   **RELATED TERMS:** `Bond`, `IslamicFinanceInstrument`, `AssetClass`
*   **FORBIDDEN SYNONYMS:** Islamic-Bond, Shariah-Note
*   **EGX CONTEXT:** Governed by FRA Egyptian Sukuk regulations and Accounting and Auditing Organization for Islamic Financial Institutions (AAOIFI) standards.

#### 7. Exchange Traded Fund (ETF)
*   **TERM (English):** Exchange Traded Fund (ETF)
*   **TERM (Arabic):** صندوق مؤشر متداول
*   **DEFINITION:** An open-ended investment fund traded on exchanges like equities, tracking an underlying index, commodity, or basket of assets.
*   **SCOPE IN TRADEORA:** Analyzed for indicative Net Asset Value (iNAV), tracking error, and sector exposure.
*   **IDENTIFIER CONVENTION:** Code/DB: `ETF` | Enum: `AssetClass.ETF`
*   **RELATED TERMS:** `Index`, `NAV`, `TrackingError`, `AssetClass`
*   **FORBIDDEN SYNONYMS:** Index-Fund-Stock, Basket-Share
*   **EGX CONTEXT:** Covers EGX-listed ETFs such as `EGX30ETF`.

#### 8. Real Estate Investment Trust (REIT)
*   **TERM (English):** Real Estate Investment Trust (REIT)
*   **TERM (Arabic):** صندوق استثمار عقاري
*   **DEFINITION:** A listed company or fund that owns, operates, or finances income-generating real estate, distributing the majority of net taxable income as dividends to shareholders.
*   **SCOPE IN TRADEORA:** Supported in Phase 2 for real estate sector analytics, dividend yield evaluation, and NAV discount/premium modeling.
*   **IDENTIFIER CONVENTION:** Code/DB: `REIT` | Enum: `AssetClass.REIT`
*   **RELATED TERMS:** `DividendYield`, `NAV`, `AssetClass`
*   **FORBIDDEN SYNONYMS:** Property-Fund, Real-Estate-Stock
*   **EGX CONTEXT:** Regulated by the Egyptian Financial Regulatory Authority (FRA) real estate fund rules.

#### 9. Index
*   **TERM (English):** Index
*   **TERM (Arabic):** مؤشر قياسي
*   **DEFINITION:** A calculated statistical composite measuring the aggregate price performance of a defined basket of securities representing a market, sector, or strategy.
*   **SCOPE IN TRADEORA:** Used for market trend intelligence, sector heatmaps, and as Benchmark reference objects for portfolio performance comparison.
*   **IDENTIFIER CONVENTION:** Code/DB: `Index` | API: `indexId`, `indexCode` | Event: `INDEX_UPDATED`
*   **RELATED TERMS:** `Benchmark`, `EGX30`, `MarketCapitalization`
*   **FORBIDDEN SYNONYMS:** Basket-Value, Average-Metric
*   **EGX CONTEXT:** Core indices include EGX30, EGX70 EWI, EGX100 EWI, and EGX Shariah Index.

#### 10. Exchange
*   **TERM (English):** Exchange
*   **TERM (Arabic):** بورصة / سوق مالي منظم
*   **DEFINITION:** An organized, licensed regulatory venue operating matching engines, listing standards, and clearing rules for financial instruments.
*   **SCOPE IN TRADEORA:** Top-level structural entity governing Market segments, MarketCalendars, and data ingestion feeds.
*   **IDENTIFIER CONVENTION:** Code/DB: `Exchange` | API: `exchangeId`, `micCode` | Event: `EXCHANGE_*`
*   **RELATED TERMS:** `Market`, `MarketCalendar`, `FRA`
*   **FORBIDDEN SYNONYMS:** Venue, Platform, Bourse, Pit
*   **EGX CONTEXT:** Represented by Market Identifier Code (MIC): `XCAI` (The Egyptian Exchange).

#### 11. Market
*   **TERM (English):** Market
*   **TERM (Arabic):** سوق فرعي / قطاع تداول
*   **DEFINITION:** A specific operational trading segment or sub-venue within an Exchange with distinct listing rules and trading parameters (e.g., Main Market vs SME Market).
*   **SCOPE IN TRADEORA:** Hosts Instruments and binds them to specific trading session rules.
*   **IDENTIFIER CONVENTION:** Code/DB: `Market` | API: `marketId`, `marketCode`
*   **RELATED TERMS:** `Exchange`, `Instrument`, `MarketSession`
*   **FORBIDDEN SYNONYMS:** Segment-Zone, Sub-Venue
*   **EGX CONTEXT:** Includes EGX Main Equities Market, Nilex Small & Medium Enterprise Market, and EGX Fixed Income Market.

#### 12. MarketSession
*   **TERM (English):** MarketSession
*   **TERM (Arabic):** جلسة التداول
*   **DEFINITION:** A defined operational phase within a trading day on an exchange market segment (e.g., Pre-Open Auction, Continuous Trading, Closing Auction, Market Close).
*   **SCOPE IN TRADEORA:** Governs real-time quote validation, alert evaluation frequency, and pricing state transitions.
*   **IDENTIFIER CONVENTION:** Code/DB: `MarketSession` | API: `sessionId`, `sessionStatus` | Event: `MARKET_SESSION_CHANGED`
*   **RELATED TERMS:** `MarketCalendar`, `Exchange`, `PreOpenPhase`
*   **FORBIDDEN SYNONYMS:** Trading-Window, Operating-Period, Time-Slot
*   **EGX CONTEXT:** Official EGX session schedule (Sunday–Thursday 10:00–14:30 Cairo Time; Pre-Open 09:30–10:00).

#### 13. MarketCalendar
*   **TERM (English):** MarketCalendar
*   **TERM (Arabic):** تقويم السوق
*   **DEFINITION:** The authoritative operational schedule for an Exchange defining official trading days, session hours, auction windows, and holiday closures.
*   **SCOPE IN TRADEORA:** Owned strictly by Market Calendar Domain to enforce session-awareness across data ingestion, AI recommendations, and alert engines.
*   **IDENTIFIER CONVENTION:** Code/DB: `MarketCalendar` | API: `calendarId`, `operatingDays`
*   **RELATED TERMS:** `Exchange`, `MarketSession`, `Holiday`
*   **FORBIDDEN SYNONYMS:** ExchangeSchedule, TradingCalendar
*   **EGX CONTEXT:** Accounts for Egyptian national holidays, Islamic holidays (Hijri-based), and official Sunday-Thursday business weeks.

#### 14. Pre-Open Phase
*   **TERM (English):** Pre-Open Phase
*   **TERM (Arabic):** مرحلة التجميع قبل الافتتاح
*   **DEFINITION:** An auction window prior to continuous trading where orders are entered and matched to establish the official opening price without executing continuous fills.
*   **SCOPE IN TRADEORA:** Evaluated by Price Intelligence to display theoretical opening prices and order book imbalance.
*   **IDENTIFIER CONVENTION:** Code/Enum: `MarketSessionType.PRE_OPEN`
*   **RELATED TERMS:** `MarketSession`, `OpeningPrice`, `OrderBook`
*   **FORBIDDEN SYNONYMS:** Early-Session, Pre-Market-Slot
*   **EGX CONTEXT:** EGX Pre-Open order accumulation window runs from 09:30 to 10:00 Cairo time.

#### 15. Continuous Trading Phase
*   **TERM (English):** Continuous Trading Phase
*   **TERM (Arabic):** مرحلة التداول المستمر
*   **DEFINITION:** The main operational session window during which buy and sell orders are continuously matched and executed based on price-time priority.
*   **SCOPE IN TRADEORA:** Active window for real-time tick processing, intraday risk calculations, and push alert dispatch.
*   **IDENTIFIER CONVENTION:** Code/Enum: `MarketSessionType.CONTINUOUS_TRADING`
*   **RELATED TERMS:** `MarketSession`, `Price`, `Trade`
*   **FORBIDDEN SYNONYMS:** Live-Session, Open-Trading-Window
*   **EGX CONTEXT:** Runs from 10:00 to 14:15 Cairo time for EGX equities.

#### 16. Circuit Breaker
*   **TERM (English):** Circuit Breaker
*   **TERM (Arabic):** إيقاف مؤقت للتداول / آلية فترات التهدئة
*   **DEFINITION:** A regulatory trading halt mechanism triggered automatically when an individual security or market index breaches maximum allowed percentage price fluctuation limits within a session.
*   **SCOPE IN TRADEORA:** Suppresses real-time recommendation alerts during halt windows and tags price streams with halt status flags.
*   **IDENTIFIER CONVENTION:** Code/DB: `CircuitBreaker` | API: `isHalted`, `haltReason` | Event: `CIRCUIT_BREAKER_TRIGGERED`
*   **RELATED TERMS:** `MarketSession`, `Price`, `FRA`
*   **FORBIDDEN SYNONYMS:** Trading-Halt-Rule, Price-Cap-Stop
*   **EGX CONTEXT:** EGX enforces a 10-minute temporary halt on individual stocks upon a 5% price move, and a 30-minute market-wide halt upon a 5% move in EGX100.

#### 17. Tick
*   **TERM (English):** Tick
*   **TERM (Arabic):** التغير السعري الأصغر / تكة
*   **DEFINITION:** The minimum allowed price fluctuation step for an Instrument on an exchange market segment.
*   **SCOPE IN TRADEORA:** Used in price validation, limit order parameter checking, and spread calculations.
*   **IDENTIFIER CONVENTION:** Code/DB: `Tick` | API: `tickSize`, `minPriceIncrement`
*   **RELATED TERMS:** `Instrument`, `Price`, `Spread`
*   **FORBIDDEN SYNONYMS:** Price-Step, Mini-Move
*   **EGX CONTEXT:** Determined by FRA tick rules based on share price tiers in Egyptian Pounds.

#### 18. Lot
*   **TERM (English):** Lot
*   **TERM (Arabic):** وحدة التداول / اللوت
*   **DEFINITION:** The standardized minimum number of share units that can be traded in a single order on a market segment.
*   **SCOPE IN TRADEORA:** Validates order parameter calculations and execution simulation constraints.
*   **IDENTIFIER CONVENTION:** Code/DB: `Lot` | API: `lotSize`, `boardLot`
*   **RELATED TERMS:** `Instrument`, `Order`, `Trade`
*   **FORBIDDEN SYNONYMS:** Trade-Block-Unit, Quantity-Lot
*   **EGX CONTEXT:** EGX standard board lot is typically 1 share for main market equities following modern exchange rules.

#### 19. Market Capitalization
*   **TERM (English):** Market Capitalization
*   **TERM (Arabic):** القيمة السوقية
*   **DEFINITION:** The total monetary value of an Asset's outstanding equity shares, calculated by multiplying total shares outstanding by current market price.
*   **SCOPE IN TRADEORA:** Used for company size classification (Large-Cap, Mid-Cap, Small-Cap), index weighting, and factor scoring.
*   **IDENTIFIER CONVENTION:** Code/DB: `MarketCapitalization` | API: `marketCap`
*   **RELATED TERMS:** `SharesOutstanding`, `Price`, `Asset`
*   **FORBIDDEN SYNONYMS:** Company-Value, Stock-Cap-Total
*   **EGX CONTEXT:** Key metric for inclusion in EGX30 index (requires top market cap and liquidity).

#### 20. Free Float
*   **TERM (English):** Free Float
*   **TERM (Arabic):** الأسهم حرة التداول
*   **DEFINITION:** The proportion of an Asset's total shares outstanding that are available for public trading, excluding strategic, government, or insider locked holdings.
*   **SCOPE IN TRADEORA:** Critical input for free-float market-cap weighted indices and liquidity risk evaluation.
*   **IDENTIFIER CONVENTION:** Code/DB: `FreeFloat` | API: `freeFloatPercentage`, `freeFloatShares`
*   **RELATED TERMS:** `SharesOutstanding`, `MarketCapitalization`, `Index`
*   **FORBIDDEN SYNONYMS:** Public-Shares, Tradable-Ratio
*   **EGX CONTEXT:** EGX rules require listed companies to maintain a minimum 10% free float to retain main market listing status.

#### 21. Shares Outstanding
*   **TERM (English):** Shares Outstanding
*   **TERM (Arabic):** إجمالي الأسهم المصدرة
*   **DEFINITION:** Total authorized equity shares currently issued by a corporation and held by all shareholders, including insiders and public investors.
*   **SCOPE IN TRADEORA:** Used in Market Capitalization and Earnings Per Share (EPS) calculations.
*   **IDENTIFIER CONVENTION:** Code/DB: `SharesOutstanding` | API: `sharesOutstanding`
*   **RELATED TERMS:** `MarketCapitalization`, `EPS`, `FreeFloat`
*   **FORBIDDEN SYNONYMS:** Total-Issued-Shares, Share-Count
*   **EGX CONTEXT:** Source from official corporate disclosure filings on EGX.

#### 22. EGX30
*   **TERM (English):** EGX30
*   **TERM (Arabic):** مؤشر إي جي إكس 30
*   **DEFINITION:** The flagship free-float market-capitalization weighted index of the Egyptian Exchange, tracking the top 30 most liquid companies listed on EGX.
*   **SCOPE IN TRADEORA:** Primary Egyptian equity benchmark index for portfolio comparison and performance attribution.
*   **IDENTIFIER CONVENTION:** Code/DB: `EGX30` | Enum: `BenchmarkType.EGX30` | Ticker: `EGX30.CA`
*   **RELATED TERMS:** `Index`, `Benchmark`, `EGX70`
*   **FORBIDDEN SYNONYMS:** Main-Egyptian-Index, Top30-Cairo
*   **EGX CONTEXT:** Reviewed semi-annually by EGX index committee in February and August.

#### 23. EGX70
*   **TERM (English):** EGX70
*   **TERM (Arabic):** مؤشر إي جي إكس 70 متساوي الأوزان
*   **DEFINITION:** An equal-weighted index of the Egyptian Exchange tracking 70 small and medium capitalization listed companies with high liquidity outside the EGX30.
*   **SCOPE IN TRADEORA:** Secondary Egyptian equity benchmark for mid/small-cap portfolio attribution.
*   **IDENTIFIER CONVENTION:** Code/DB: `EGX70` | Enum: `BenchmarkType.EGX70`
*   **RELATED TERMS:** `Index`, `EGX30`, `EGX100`
*   **FORBIDDEN SYNONYMS:** SmallCap-70, Mid-Index-Cairo
*   **EGX CONTEXT:** Equal-weighted (EWI) structure prevents single stock domination.

#### 24. EGX100
*   **TERM (English):** EGX100
*   **TERM (Arabic):** مؤشر إي جي إكس 100 متساوي الأوزان
*   **DEFINITION:** An equal-weighted composite index of the Egyptian Exchange tracking the 100 constituent companies from both EGX30 and EGX70.
*   **SCOPE IN TRADEORA:** Broad market benchmark for Egyptian equity coverage and circuit breaker monitoring.
*   **IDENTIFIER CONVENTION:** Code/DB: `EGX100` | Enum: `BenchmarkType.EGX100`
*   **RELATED TERMS:** `Index`, `EGX30`, `EGX70`
*   **FORBIDDEN SYNONYMS:** Broad-Egyptian-Index, Top100-Cairo
*   **EGX CONTEXT:** Triggers 30-minute market halt if index fluctuates by 5%.

#### 25. Sector
*   **TERM (English):** Sector
*   **TERM (Arabic):** قطاع اقتصادي
*   **DEFINITION:** A broad category aggregating listed Assets sharing similar core economic activities and business models (e.g., Banking, Real Estate, Industrial Goods).
*   **SCOPE IN TRADEORA:** Used for sector concentration risk limits, sector heatmaps, and sector rotation analysis.
*   **IDENTIFIER CONVENTION:** Code/DB: `Sector` | API: `sectorId`, `sectorName`
*   **RELATED TERMS:** `Industry`, `GICSClassification`, `ConcentrationRisk`
*   **FORBIDDEN SYNONYMS:** Industry-Group, Business-Category
*   **EGX CONTEXT:** Aligned with official EGX 18 sector classifications.

#### 26. Industry
*   **TERM (English):** Industry
*   **TERM (Arabic):** صناعة فرعية
*   **DEFINITION:** A specific sub-segment within a Sector grouping companies with near-identical operational processes or products.
*   **SCOPE IN TRADEORA:** Provides granular peer group comparison in DCF and ratio analysis.
*   **IDENTIFIER CONVENTION:** Code/DB: `Industry` | API: `industryId`, `industryName`
*   **RELATED TERMS:** `Sector`, `GICSClassification`
*   **FORBIDDEN SYNONYMS:** Sub-Sector, Niche-Group
*   **EGX CONTEXT:** Detailed breakdown under EGX sector hierarchy.

#### 27. GICS Classification
*   **TERM (English):** GICS Classification
*   **TERM (Arabic):** التصنيف المعياري العالمي للقطاعات (GICS)
*   **DEFINITION:** Global Industry Classification Standard—the international taxonomy framework categorizing companies into Sectors, Industry Groups, Industries, and Sub-Industries.
*   **SCOPE IN TRADEORA:** Standardized taxonomy mapping local EGX sectors to global industry definitions for international scaling.
*   **IDENTIFIER CONVENTION:** Code/DB: `GICSClassification` | API: `gicsCode`
*   **RELATED TERMS:** `Sector`, `Industry`, `Asset`
*   **FORBIDDEN SYNONYMS:** Standard-Industry-Code, Global-Taxonomy
*   **EGX CONTEXT:** Maps EGX sector codes to global GICS 4-level taxonomy.

#### 28. ISIN
*   **TERM (English):** ISIN (International Securities Identification Number)
*   **TERM (Arabic):** الرقم التعريفي الدولي للورقة المالية (ISIN)
*   **DEFINITION:** A 12-character alphanumeric code that uniquely identifies a specific security globally according to ISO 6166 standards.
*   **SCOPE IN TRADEORA:** Primary cross-market global identifier stored in Security Master for clearing, settlement, and global feed mapping.
*   **IDENTIFIER CONVENTION:** Code/DB: `ISIN` | API: `isinCode`
*   **RELATED TERMS:** `Instrument`, `SecurityMaster`, `TickerSymbol`
*   **FORBIDDEN SYNONYMS:** Global-ID, Security-Code-Intl
*   **EGX CONTEXT:** Egyptian ISINs begin with country code `EG` (e.g., `EGS60121C018`).

#### 29. Ticker Symbol
*   **TERM (English):** Ticker Symbol
*   **TERM (Arabic):** رمز السهم / رمز الأداة
*   **DEFINITION:** A standardized short alphanumeric symbol assigned to an Instrument for identification on an exchange market segment.
*   **SCOPE IN TRADEORA:** User-facing identifier for search, watchlists, charts, and API parameter lookup.
*   **IDENTIFIER CONVENTION:** Code/DB: `TickerSymbol` | API: `tickerSymbol`
*   **RELATED TERMS:** `Instrument`, `Exchange`, `ISIN`
*   **FORBIDDEN SYNONYMS:** Symbol, Stock-Code, Ticker-String
*   **EGX CONTEXT:** Formatted as `[EGX_CODE].[MIC]` (e.g., `COMI.CA` for CIB on EGX).

---

### 32. Price and Market Data

#### 30. Price
*   **TERM (English):** Price
*   **TERM (Arabic):** سعر الأداة المالية
*   **DEFINITION:** A verified monetary valuation snapshot for an Instrument at a specific timestamp, denominated in explicit ISO currency.
*   **SCOPE IN TRADEORA:** Core Value Object for portfolio NAV calculations, technical indicators, and alert rules.
*   **IDENTIFIER CONVENTION:** Code/DB: `Price` | API: `priceAmount`, `currency` | Event: `PRICE_TICK_RECEIVED`
*   **RELATED TERMS:** `Instrument`, `BidPrice`, `AskPrice`, `LastPrice`
*   **FORBIDDEN SYNONYMS:** Quote-Value, Rate, Mark, Level
*   **EGX CONTEXT:** Expressed in EGP (or USD for dual-currency EGX listings).

#### 31. Bid Price
*   **TERM (English):** Bid Price
*   **TERM (Arabic):** سعر الطلب (أعلى سعر شراء)
*   **DEFINITION:** The highest monetary price a buyer in an order book is currently willing to pay for a unit of an Instrument.
*   **SCOPE IN TRADEORA:** Used in Market Depth analytics, bid-ask spread evaluation, and liquidation portfolio valuation.
*   **IDENTIFIER CONVENTION:** Code/DB: `BidPrice` | API: `bidPrice`
*   **RELATED TERMS:** `AskPrice`, `Spread`, `OrderBook`
*   **FORBIDDEN SYNONYMS:** Buy-Price, Buyer-Quote
*   **EGX CONTEXT:** Top of order book bid snapshot from EGX tick feed.

#### 32. Ask Price
*   **TERM (English):** Ask Price
*   **TERM (Arabic):** سعر العرض (أقل سعر بيع)
*   **DEFINITION:** The lowest monetary price a seller in an order book is currently willing to accept for a unit of an Instrument.
*   **SCOPE IN TRADEORA:** Used in Market Depth analytics, spread evaluation, and acquisition portfolio cost estimation.
*   **IDENTIFIER CONVENTION:** Code/DB: `AskPrice` | API: `askPrice`
*   **RELATED TERMS:** `BidPrice`, `Spread`, `OrderBook`
*   **FORBIDDEN SYNONYMS:** Offer-Price, Sell-Price, Seller-Quote
*   **EGX CONTEXT:** Top of order book ask snapshot from EGX tick feed.

#### 33. Last Price
*   **TERM (English):** Last Price
*   **TERM (Arabic):** سعر آخر صفقة
*   **DEFINITION:** The price per share of the most recently executed trade fill for an Instrument on an exchange market segment.
*   **SCOPE IN TRADEORA:** Primary real-time price display on watchlists and active dashboards.
*   **IDENTIFIER CONVENTION:** Code/DB: `LastPrice` | API: `lastPrice`
*   **RELATED TERMS:** `Price`, `Trade`, `ClosingPrice`
*   **FORBIDDEN SYNONYMS:** Current-Quote, Latest-Value
*   **EGX CONTEXT:** Updates instantly upon execution during continuous trading.

#### 34. Opening Price
*   **TERM (English):** Opening Price
*   **TERM (Arabic):** سعر الافتتاح
*   **DEFINITION:** The official price at which the first trade of a trading session is executed for an Instrument, typically determined during the Pre-Open Phase auction.
*   **SCOPE IN TRADEORA:** Used as the baseline for intraday percentage change calculations and daily OHLCV bars.
*   **IDENTIFIER CONVENTION:** Code/DB: `OpeningPrice` | API: `openPrice`
*   **RELATED TERMS:** `PreOpenPhase`, `ClosingPrice`, `OHLCV`
*   **FORBIDDEN SYNONYMS:** Start-Price, Open-Val
*   **EGX CONTEXT:** Fixed at 10:00 Cairo time following Pre-Open auction matching.

#### 35. Closing Price
*   **TERM (English):** Closing Price
*   **TERM (Arabic):** سعر الإغلاق
*   **DEFINITION:** The official closing valuation of an Instrument for a trading session, calculated according to exchange rules (e.g., volume-weighted auction or final trade).
*   **SCOPE IN TRADEORA:** Baseline for EOD portfolio valuation, daily performance attribution, and historical price series.
*   **IDENTIFIER CONVENTION:** Code/DB: `ClosingPrice` | API: `closePrice` | Event: `EOD_PRICES_PUBLISHED`
*   **RELATED TERMS:** `OpeningPrice`, `AdjustedPrice`, `OHLCV`
*   **FORBIDDEN SYNONYMS:** Final-Price, End-Val
*   **EGX CONTEXT:** EGX closing price is calculated as the Volume Weighted Average Price (VWAP) of the last 15 minutes of trading or official closing auction match.

#### 36. Adjusted Price
*   **TERM (English):** Adjusted Price
*   **TERM (Arabic):** السعر المعدل
*   **DEFINITION:** A historical price series value modified backward to account for corporate actions (e.g., stock splits, bonus shares, rights issues, cash dividends) to preserve historical percentage returns.
*   **SCOPE IN TRADEORA:** Mandatory input for technical analysis indicators, backtesting simulations, and historical chart rendering.
*   **IDENTIFIER CONVENTION:** Code/DB: `AdjustedPrice` | API: `adjustedClose`
*   **RELATED TERMS:** `CorporateAction`, `AdjustmentFactor`, `StockSplit`
*   **FORBIDDEN SYNONYMS:** Modified-Price, Clean-Historical-Price
*   **EGX CONTEXT:** Preserves return continuity across EGX bonus share distributions.

#### 37. OHLCV
*   **TERM (English):** OHLCV
*   **TERM (Arabic):** شمعة التداول (افتتاح-أعلى-أدنى-إغلاق-حجم)
*   **DEFINITION:** A standardized aggregated price bar summarizing market action over a defined time interval (e.g., 1-minute, 1-day), containing Open, High, Low, Close prices, and total Volume.
*   **SCOPE IN TRADEORA:** Core entity for technical chart rendering, candlestick pattern scanning, and quantitative indicator computation.
*   **IDENTIFIER CONVENTION:** Code/DB: `OHLCV` | API: `ohlcvSeries`
*   **RELATED TERMS:** `OpeningPrice`, `ClosingPrice`, `Volume`, `TimeInterval`
*   **FORBIDDEN SYNONYMS:** Price-Bar, Candle-Data, History-Block
*   **EGX CONTEXT:** Aggregated for EGX instruments across intraday (1m, 5m, 15m, 1h) and daily timeframes.

#### 38. Spread
*   **TERM (English):** Spread
*   **TERM (Arabic):** الفارق بين العرض والطلب
*   **DEFINITION:** The monetary or percentage difference between the current lowest Ask Price and highest Bid Price for an Instrument.
*   **SCOPE IN TRADEORA:** Used in Liquidity Analysis Engine to measure transaction cost drag and illiquidity risk.
*   **IDENTIFIER CONVENTION:** Code/DB: `Spread` | API: `bidAskSpread`, `spreadPercentage`
*   **RELATED TERMS:** `BidPrice`, `AskPrice`, `Liquidity`
*   **FORBIDDEN SYNONYMS:** Bid-Ask-Gap, Margin-Spread
*   **EGX CONTEXT:** High spread indicates low liquidity in SME (Nilex) stocks.

#### 39. Mid Price
*   **TERM (English):** Mid Price
*   **TERM (Arabic):** متوسط سعر العرض والطلب
*   **DEFINITION:** The arithmetic midpoint between the current Bid Price and Ask Price, calculated as `(Bid + Ask) / 2`.
*   **SCOPE IN TRADEORA:** Used as a un-biased price estimate for fair value modeling and portfolio evaluation when last trade is stale.
*   **IDENTIFIER CONVENTION:** Code/DB: `MidPrice` | API: `midPrice`
*   **RELATED TERMS:** `BidPrice`, `AskPrice`, `Spread`
*   **FORBIDDEN SYNONYMS:** Average-Quote, Half-Spread-Price
*   **EGX CONTEXT:** Helpful for low-turnover EGX illiquid stocks.

#### 40. Volume
*   **TERM (English):** Volume
*   **TERM (Arabic):** كمية التداول (عدد الأسهم)
*   **DEFINITION:** The total number of share units of an Instrument traded during a specified time window or trading session.
*   **SCOPE IN TRADEORA:** Used in technical momentum indicators, volume breakout alerts, and liquidity profiling.
*   **IDENTIFIER CONVENTION:** Code/DB: `Volume` | API: `tradingVolume`
*   **RELATED TERMS:** `Turnover`, `OHLCV`, `Liquidity`
*   **FORBIDDEN SYNONYMS:** Quantity-Traded, Share-Volume
*   **EGX CONTEXT:** Expressed as number of shares traded on EGX.

#### 41. Turnover
*   **TERM (English):** Turnover
*   **TERM (Arabic):** قيمة التداول الإجمالية
*   **DEFINITION:** The total monetary value of all traded shares for an Instrument during a specified period, calculated as `Sum(Share Quantity * Trade Price)`.
*   **SCOPE IN TRADEORA:** Key metric for measuring institutional liquidity and market depth in EGX/MENA equities.
*   **IDENTIFIER CONVENTION:** Code/DB: `Turnover` | API: `tradingTurnover`, `turnoverCurrency`
*   **RELATED TERMS:** `Volume`, `VWAP`, `Liquidity`
*   **FORBIDDEN SYNONYMS:** Total-Value-Traded, Money-Volume
*   **EGX CONTEXT:** Expressed in EGP on EGX daily summary reports.

#### 42. Market Depth
*   **TERM (English):** Market Depth
*   **TERM (Arabic):** عمق السوق (دفتر الأوامر)
*   **DEFINITION:** The aggregate volume of outstanding buy and sell limit orders organized by price level in an order book (Level 2 data).
*   **SCOPE IN TRADEORA:** Processed by Active Trader dashboards and Liquidity Analysis Engine to estimate execution slippage.
*   **IDENTIFIER CONVENTION:** Code/DB: `MarketDepth` | API: `orderBookDepth`
*   **RELATED TERMS:** `OrderBook`, `BidPrice`, `AskPrice`
*   **FORBIDDEN SYNONYMS:** Level2-Data, Book-Depth
*   **EGX CONTEXT:** EGX Level 2 feed displays top 5 to 20 price levels.

#### 43. Order Book
*   **TERM (English):** Order Book
*   **TERM (Arabic):** سجل الأوامر
*   **DEFINITION:** The electronic ledger maintained by an exchange matching engine containing all active, unexecuted buy and sell limit orders for an Instrument.
*   **SCOPE IN TRADEORA:** Source of Market Depth, bid-ask quotes, and liquidity metrics.
*   **IDENTIFIER CONVENTION:** Code/DB: `OrderBook` | API: `orderBookSnapshot`
*   **RELATED TERMS:** `MarketDepth`, `BidPrice`, `AskPrice`
*   **FORBIDDEN SYNONYMS:** Matching-Book, Exchange-Ledger
*   **EGX CONTEXT:** Streamed via licensed EGX data vendor API.

#### 44. 52-Week High
*   **TERM (English):** 52-Week High
*   **TERM (Arabic):** أعلى سعر في 52 أسبوعاً
*   **DEFINITION:** The highest trade price recorded for an Instrument over the preceding 52-week (1-year) rolling calendar period.
*   **SCOPE IN TRADEORA:** Used in technical screening, breakout alerts, and momentum factor scoring.
*   **IDENTIFIER CONVENTION:** Code/DB: `FiftyTwoWeekHigh` | API: `fiftyTwoWeekHigh`
*   **RELATED TERMS:** `FiftyTwoWeekLow`, `Price`, `Breakout`
*   **FORBIDDEN SYNONYMS:** Yearly-High, 1Y-Peak
*   **EGX CONTEXT:** Standard reference metric in EGX market disclosures.

#### 45. 52-Week Low
*   **TERM (English):** 52-Week Low
*   **TERM (Arabic):** أدنى سعر في 52 أسبوعاً
*   **DEFINITION:** The lowest trade price recorded for an Instrument over the preceding 52-week (1-year) rolling calendar period.
*   **SCOPE IN TRADEORA:** Used in technical screening, value screening, and support level evaluation.
*   **IDENTIFIER CONVENTION:** Code/DB: `FiftyTwoWeekLow` | API: `fiftyTwoWeekLow`
*   **RELATED TERMS:** `FiftyTwoWeekHigh`, `Price`
*   **FORBIDDEN SYNONYMS:** Yearly-Low, 1Y-Floor
*   **EGX CONTEXT:** Standard reference metric in EGX market disclosures.

#### 46. VWAP
*   **TERM (English):** VWAP (Volume-Weighted Average Price)
*   **TERM (Arabic):** متوسط السعر المرجح بحجم التداول (فواب)
*   **DEFINITION:** The ratio of total monetary Turnover to total Volume traded for an Instrument over a defined trading session, calculated as `Sum(Price * Volume) / Sum(Volume)`.
*   **SCOPE IN TRADEORA:** Benchmark for intraday execution quality, institutional trading efficiency, and EGX closing price verification.
*   **IDENTIFIER CONVENTION:** Code/DB: `VWAP` | API: `vwap`
*   **RELATED TERMS:** `Turnover`, `Volume`, `ClosingPrice`
*   **FORBIDDEN SYNONYMS:** Volume-Price-Avg, Weighted-Price
*   **EGX CONTEXT:** Primary formula used by EGX to calculate official daily closing prices.

#### 47. Real-Time Data
*   **TERM (English):** Real-Time Data
*   **TERM (Arabic):** بيانات أصلية لحظية
*   **DEFINITION:** Streaming market price ticks and order book updates delivered immediately upon execution at the exchange without artificial delay.
*   **SCOPE IN TRADEORA:** Entitlement-gated data tier for Professional/Enterprise subscriptions and Active Trader workflows.
*   **IDENTIFIER CONVENTION:** Code/Enum: `DataFeedType.REAL_TIME`
*   **RELATED TERMS:** `DelayedData`, `SubscriptionTier`, `MarketData`
*   **FORBIDDEN SYNONYMS:** Live-Stream, Instant-Data
*   **EGX CONTEXT:** Requires official EGX real-time market data redistribution license.

#### 48. Delayed Data
*   **TERM (English):** Delayed Data
*   **TERM (Arabic):** بيانات مؤجلة (15 دقيقة)
*   **DEFINITION:** Market price updates artificially delayed by a fixed regulatory window (typically 15 minutes) before distribution.
*   **SCOPE IN TRADEORA:** Default data feed tier for Basic/Free subscription users in compliance with exchange licensing rules.
*   **IDENTIFIER CONVENTION:** Code/Enum: `DataFeedType.DELAYED`
*   **RELATED TERMS:** `RealTimeData`, `Subscription`, `Exchange`
*   **FORBIDDEN SYNONYMS:** Lagged-Feed, Slow-Data
*   **EGX CONTEXT:** EGX mandates a 15-minute delay for non-licensed free public displays.

#### 49. End-of-Day (EOD)
*   **TERM (English):** End-of-Day (EOD)
*   **TERM (Arabic):** بيانات نهاية اليوم
*   **DEFINITION:** Consolidated daily official closing prices, volume totals, and adjusted historical metrics published following market session closure.
*   **SCOPE IN TRADEORA:** Baseline data payload for daily portfolio NAV valuation, EOD risk runs, and financial statement modeling.
*   **IDENTIFIER CONVENTION:** Code/Enum: `DataFeedType.END_OF_DAY` | Event: `EOD_PRICES_PUBLISHED`
*   **RELATED TERMS:** `ClosingPrice`, `AdjustedPrice`, `Portfolio`
*   **FORBIDDEN SYNONYMS:** Daily-Snapshot, Daily-Close-Data
*   **EGX CONTEXT:** Published by EGX at approximately 15:00 Cairo time daily.

---

### 3.3 Corporate Actions

#### 50. CorporateAction
*   **TERM (English):** CorporateAction
*   **TERM (Arabic):** إجراء الشركات
*   **DEFINITION:** An official binding event initiated by an issuing corporation that alters its outstanding equity structure, capital base, or cash distributions to security holders.
*   **SCOPE IN TRADEORA:** Aggregate root owned by Market Data Domain; triggers price adjustments and portfolio ledger updates via Corporate Action Service.
*   **IDENTIFIER CONVENTION:** Code/DB: `CorporateAction` | API: `corporateActionId` | Event: `CORPORATE_ACTION_PROCESSED`
*   **RELATED TERMS:** `CashDividend`, `StockSplit`, `RightsIssue`, `ExDate`
*   **FORBIDDEN SYNONYMS:** Event, Company-Adjustment, Capital-Event
*   **EGX CONTEXT:** Governed by EGX listing committee disclosures and MCSD depository updates.

#### 51. Dividend
*   **TERM (English):** Dividend
*   **TERM (Arabic):** توزيع أرباح
*   **DEFINITION:** A distribution of corporate profits allocated by a company's board of directors to eligible class shareholders.
*   **SCOPE IN TRADEORA:** Evaluated for cash flow projections, portfolio yield, and dividend sustainability scoring.
*   **IDENTIFIER CONVENTION:** Code/DB: `Dividend` | API: `dividendAmount`, `dividendYield`
*   **RELATED TERMS:** `CashDividend`, `StockDividend`, `ExDate`, `DividendYield`
*   **FORBIDDEN SYNONYMS:** Payout, Shareholder-Return-Cash
*   **EGX CONTEXT:** Paid in EGP (or USD) via Misr for Clearing, Settlement and Depository (MCSD).

#### 52. Cash Dividend
*   **TERM (English):** Cash Dividend
*   **TERM (Arabic):** توزيعات أرباح نقدية
*   **DEFINITION:** A corporate dividend payment made in cash directly to eligible shareholders per share held.
*   **SCOPE IN TRADEORA:** Generates cash receivable ledger entries in user Portfolios on payment date.
*   **IDENTIFIER CONVENTION:** Code/DB: `CashDividend` | API: `cashAmountPerShare`
*   **RELATED TERMS:** `Dividend`, `ExDate`, `PaymentDate`
*   **FORBIDDEN SYNONYMS:** Cash-Payout, Money-Dividend
*   **EGX CONTEXT:** Subject to Egyptian dividend withholding tax rules (e.g., 5% or 10%).

#### 53. Stock Dividend
*   **TERM (English):** Stock Dividend
*   **TERM (Arabic):** أسهم مجانية / توزيع أسهم
*   **DEFINITION:** A corporate dividend payment made in the form of additional free shares issued to existing shareholders proportional to their holdings (bonus shares).
*   **SCOPE IN TRADEORA:** Increases position share quantity and adjusts average cost basis in Portfolios without adding cash.
*   **IDENTIFIER CONVENTION:** Code/DB: `StockDividend` | API: `bonusShareRatio`
*   **RELATED TERMS:** `Dividend`, `StockSplit`, `CostBasisAdjustment`
*   **FORBIDDEN SYNONYMS:** Bonus-Shares, Free-Shares
*   **EGX CONTEXT:** Highly common capital distribution method among EGX listed companies.

#### 54. Rights Issue
*   **TERM (English):** Rights Issue
*   **TERM (Arabic):** اكتتاب أولوية / أسهم زيادة رأس المال
*   **DEFINITION:** An invitation to existing shareholders to purchase additional new shares of a company at a discounted subscription price proportional to their current holdings.
*   **SCOPE IN TRADEORA:** Modeled as a corporate action and tradable rights instrument (`.R`) during subscription windows.
*   **IDENTIFIER CONVENTION:** Code/DB: `RightsIssue` | API: `subscriptionPrice`, `rightsRatio`
*   **RELATED TERMS:** `CorporateAction`, `ExDate`, `CostBasis`
*   **FORBIDDEN SYNONYMS:** Priority-Subscription, Share-Option-Offer
*   **EGX CONTEXT:** Rights trade separately on EGX under temporary tickers during the subscription period.

#### 55. Stock Split
*   **TERM (English):** Stock Split
*   **TERM (Arabic):** تجزئة الأسهم
*   **DEFINITION:** A corporate action increasing the number of outstanding shares by dividing existing shares by a split ratio (e.g., 2-for-1), proportionally reducing the share price while keeping market cap unchanged.
*   **SCOPE IN TRADEORA:** Triggers historical price adjustment factor calculations and updates portfolio position share counts.
*   **IDENTIFIER CONVENTION:** Code/DB: `StockSplit` | API: `splitRatio` | Event: `STOCK_SPLIT_PROCESSED`
*   **RELATED TERMS:** `ReverseSplit`, `AdjustmentFactor`, `AdjustedPrice`
*   **FORBIDDEN SYNONYMS:** Share-Division, Split-Event
*   **EGX CONTEXT:** Executed via MCSD ledger adjustments; EGX share par value is updated accordingly.

#### 56. Reverse Split
*   **TERM (English):** Reverse Split
*   **TERM (Arabic):** تجميع الأسهم (تجزئة عكسية)
*   **DEFINITION:** A corporate action reducing total outstanding shares by consolidating existing shares into fewer, higher-priced shares (e.g., 1-for-5).
*   **SCOPE IN TRADEORA:** Adjusts position counts and historical price series backward.
*   **IDENTIFIER CONVENTION:** Code/DB: `ReverseSplit` | API: `consolidationRatio`
*   **RELATED TERMS:** `StockSplit`, `AdjustmentFactor`
*   **FORBIDDEN SYNONYMS:** Share-Consolidation, Reverse-Division
*   **EGX CONTEXT:** Requires FRA approval to ensure compliance with minimum par value rules.

#### 57. Ex-Date (Ex-Dividend / Ex-Rights Date)
*   **TERM (English):** Ex-Date
*   **TERM (Arabic):** تاريخ تجريد الحق (تاريخ الاستحقاق)
*   **DEFINITION:** The official cutoff date on or after which a security buyer is no longer entitled to receive a declared corporate action (dividend or rights).
*   **SCOPE IN TRADEORA:** Triggers stock price adjustment in historical series and locks eligibility for portfolio dividend projections.
*   **IDENTIFIER CONVENTION:** Code/DB: `ExDate` | API: `exDate`
*   **RELATED TERMS:** `RecordDate`, `PaymentDate`, `Dividend`
*   **FORBIDDEN SYNONYMS:** Cutoff-Date, Exclusion-Date
*   **EGX CONTEXT:** Based on EGX settlement cycle rules (`T+2`).

#### 58. Record Date
*   **TERM (English):** Record Date
*   **TERM (Arabic):** تاريخ القيد في سجلات المساهمين
*   **DEFINITION:** The date on which an individual must officially be registered as a shareholder in company records to receive a corporate distribution.
*   **SCOPE IN TRADEORA:** Used to verify portfolio holding eligibility against MCSD shareholder lists.
*   **IDENTIFIER CONVENTION:** Code/DB: `RecordDate` | API: `recordDate`
*   **RELATED TERMS:** `ExDate`, `PaymentDate`, `MCSD`
*   **FORBIDDEN SYNONYMS:** Holder-Date, Registry-Date
*   **EGX CONTEXT:** Set by EGX/MCSD exactly two business days after Ex-Date under `T+2` settlement.

#### 59. Payment Date
*   **TERM (English):** Payment Date
*   **TERM (Arabic):** تاريخ التوزيع والتسديد
*   **DEFINITION:** The official date on which a declared cash dividend or bonus share distribution is actually credited to eligible shareholders.
*   **SCOPE IN TRADEORA:** Date on which cash balances or share counts are updated in live Portfolio ledgers.
*   **IDENTIFIER CONVENTION:** Code/DB: `PaymentDate` | API: `paymentDate`
*   **RELATED TERMS:** `ExDate`, `RecordDate`, `CashDividend`
*   **FORBIDDEN SYNONYMS:** Pay-Day, Distribution-Date
*   **EGX CONTEXT:** Cash transferred via paying bank or MCSD account.

#### 60. Adjustment Factor
*   **TERM (English):** Adjustment Factor
*   **TERM (Arabic):** معامل تعديل السعر
*   **DEFINITION:** A mathematical multiplier applied to historical price series to eliminate artificial price gaps caused by corporate actions.
*   **SCOPE IN TRADEORA:** Calculated by Corporate Action Service to generate `AdjustedPrice` series for technical charts.
*   **IDENTIFIER CONVENTION:** Code/DB: `AdjustmentFactor` | API: `adjustmentFactor`
*   **RELATED TERMS:** `AdjustedPrice`, `StockSplit`, `CorporateAction`
*   **FORBIDDEN SYNONYMS:** Multiplier-Factor, Chart-Fix-Ratio
*   **EGX CONTEXT:** Formula: `Adjusted Price = Raw Price * Adjustment Factor`.

#### 61. Dividend Yield
*   **TERM (English):** Dividend Yield
*   **TERM (Arabic):** عائد توزيع الأرباح
*   **DEFINITION:** The annual cash dividend payout per share expressed as a percentage of current market price, calculated as `(Annual Dividend Per Share / Current Price) * 100`.
*   **SCOPE IN TRADEORA:** Key ratio for income screening, factor scoring, and fundamental evaluation.
*   **IDENTIFIER CONVENTION:** Code/DB: `DividendYield` | API: `dividendYieldPercentage`
*   **RELATED TERMS:** `Dividend`, `Price`, `Yield`
*   **FORBIDDEN SYNONYMS:** Payout-Ratio-Yield, Cash-Yield-%
*   **EGX CONTEXT:** High dividend yield is a primary investment criteria for Egyptian retail investors.

#### 62. Dividend Sustainability
*   **TERM (English):** Dividend Sustainability
*   **TERM (Arabic):** الاستدامة المالية لتوزيع الأرباح
*   **DEFINITION:** A quantitative score (0-100) evaluating a corporation's financial capacity to maintain its historical dividend payout based on free cash flow coverage, earnings payout ratio, and debt metrics.
*   **SCOPE IN TRADEORA:** Proprietary AI metric generated by Financial Research Domain to warn against "dividend traps."
*   **IDENTIFIER CONVENTION:** Code/DB: `DividendSustainability` | API: `dividendSustainabilityScore`
*   **RELATED TERMS:** `DividendYield`, `CashFlowStatement`, `FactorScore`
*   **FORBIDDEN SYNONYMS:** Dividend-Safety-Rank, Payout-Health
*   **EGX CONTEXT:** Evaluates cash flow of EGX blue-chips against Egyptian accounting standards.

---

### 3.4 Financial Analysis and Valuation

#### 63. FinancialStatement
*   **TERM (English):** FinancialStatement
*   **TERM (Arabic):** القوائم المالية
*   **DEFINITION:** A standardized formal accounting report summarizing a corporate entity's financial results and health over a reporting period (quarterly or annual).
*   **SCOPE IN TRADEORA:** Aggregate root owned by Financial Research Domain; incorporates Balance Sheet, Income Statement, and Cash Flow Statement.
*   **IDENTIFIER CONVENTION:** Code/DB: `FinancialStatement` | API: `statementId`, `fiscalPeriod`
*   **RELATED TERMS:** `BalanceSheet`, `IncomeStatement`, `CashFlowStatement`, `EAS`
*   **FORBIDDEN SYNONYMS:** Financial-Doc, Accounting-Report
*   **EGX CONTEXT:** Parsed from official PDF disclosures compliant with Egyptian Accounting Standards (EAS).

#### 64. Income Statement
*   **TERM (English):** Income Statement
*   **TERM (Arabic):** قائمة الدخل
*   **DEFINITION:** Financial statement summarizing corporate revenues, cost of goods sold, operating expenses, tax, and net income over a fiscal period.
*   **SCOPE IN TRADEORA:** Source for Revenue, EBITDA, Net Income, and Earnings Per Share (EPS) calculations.
*   **IDENTIFIER CONVENTION:** Code/DB: `IncomeStatement` | API: `incomeStatement`
*   **RELATED TERMS:** `FinancialStatement`, `Revenue`, `NetIncome`, `EPS`
*   **FORBIDDEN SYNONYMS:** P&L-Statement, Profit-Loss-Doc
*   **EGX CONTEXT:** Quarterly filings required within 45 days of quarter-end under EGX rules.

#### 65. Balance Sheet
*   **TERM (English):** Balance Sheet
*   **TERM (Arabic):** الميزانية العمومية / قائمة المركز المالي
*   **DEFINITION:** Financial statement reporting a corporation's total assets, total liabilities, and shareholders' equity at a specific reporting date.
*   **SCOPE IN TRADEORA:** Source for Debt-to-Equity, Current Ratio, Price-to-Book (P/B), and Net Asset Value modeling.
*   **IDENTIFIER CONVENTION:** Code/DB: `BalanceSheet` | API: `balanceSheet`
*   **RELATED TERMS:** `FinancialStatement`, `DebtToEquity`, `BookValue`
*   **FORBIDDEN SYNONYMS:** Financial-Position-Statement, Asset-Liability-Doc
*   **EGX CONTEXT:** Audited annually by certified Egyptian accounting firms.

#### 66. Cash Flow Statement
*   **TERM (English):** Cash Flow Statement
*   **TERM (Arabic):** قائمة التدفقات النقدية
*   **DEFINITION:** Financial statement tracking net cash generated and used across operating, investing, and financing activities over a fiscal period.
*   **SCOPE IN TRADEORA:** Source for Free Cash Flow (FCF) calculations, DCF models, and Dividend Sustainability scoring.
*   **IDENTIFIER CONVENTION:** Code/DB: `CashFlowStatement` | API: `cashFlowStatement`
*   **RELATED TERMS:** `FinancialStatement`, `DiscountedCashFlow`, `DividendSustainability`
*   **FORBIDDEN SYNONYMS:** Cash-Movement-Doc, Flow-Statement
*   **EGX CONTEXT:** Evaluates real cash generation isolating non-cash foreign exchange revaluations.

#### 67. Revenue
*   **TERM (English):** Revenue
*   **TERM (Arabic):** الإيرادات / المبيعات
*   **DEFINITION:** Total gross monetary inflow generated by a corporation from its core business operations and sales prior to expense deductions.
*   **SCOPE IN TRADEORA:** Used in Revenue Surprise calculations and top-line growth rate modeling.
*   **IDENTIFIER CONVENTION:** Code/DB: `Revenue` | API: `totalRevenue`
*   **RELATED TERMS:** `IncomeStatement`, `NetIncome`, `RevenueSurprise`
*   **FORBIDDEN SYNONYMS:** Gross-Sales, Top-Line-Value
*   **EGX CONTEXT:** Denominated in EGP (or functional currency).

#### 68. Net Income
*   **TERM (English):** Net Income
*   **TERM (Arabic):** صافي الربح
*   **DEFINITION:** Total residual corporate profit remaining after deducting all operating expenses, cost of goods sold, interest, depreciation, and taxes from Revenue.
*   **SCOPE IN TRADEORA:** Primary input for EPS, P/E ratio, and Return on Equity (ROE) metrics.
*   **IDENTIFIER CONVENTION:** Code/DB: `NetIncome` | API: `netIncome`
*   **RELATED TERMS:** `IncomeStatement`, `EPS`, `PERatio`
*   **FORBIDDEN SYNONYMS:** Bottom-Line, Net-Profit, Clear-Earnings
*   **EGX CONTEXT:** Reported under EAS accounting guidelines.

#### 69. EBITDA
*   **TERM (English):** EBITDA
*   **TERM (Arabic):** الأرباح قبل الفوائد والضرائب والإهلاك والاستهلاك
*   **DEFINITION:** Earnings Before Interest, Taxes, Depreciation, and Amortization—a metric evaluating pure operational profitability isolating capital structure and tax environments.
*   **SCOPE IN TRADEORA:** Core metric for EV/EBITDA valuation modeling across capital-intensive industries.
*   **IDENTIFIER CONVENTION:** Code/DB: `EBITDA` | API: `ebitda`
*   **RELATED TERMS:** `IncomeStatement`, `EVEBITDA`, `EnterpriseValue`
*   **FORBIDDEN SYNONYMS:** Operating-Cash-Profit, Pre-Tax-Operating-Income
*   **EGX CONTEXT:** Crucial for evaluating EGX industrial and real estate sectors.

#### 70. Earnings Per Share (EPS)
*   **TERM (English):** Earnings Per Share (EPS)
*   **TERM (Arabic):** ربحية السهم
*   **DEFINITION:** Net corporate profit allocated to each outstanding common equity share, calculated as `(Net Income - Preferred Dividends) / Shares Outstanding`.
*   **SCOPE IN TRADEORA:** Core metric for P/E ratio calculation, earnings surprise evaluation, and consensus tracking.
*   **IDENTIFIER CONVENTION:** Code/DB: `EPS` | API: `epsAmount`
*   **RELATED TERMS:** `NetIncome`, `SharesOutstanding`, `EarningsSurprise`
*   **FORBIDDEN SYNONYMS:** Per-Share-Profit, Net-EPS
*   **EGX CONTEXT:** Reported directly in EGX quarterly financial summaries.

#### 71. Earnings Surprise
*   **TERM (English):** Earnings Surprise
*   **TERM (Arabic):** مفاجأة الأرباح
*   **DEFINITION:** The percentage difference between a company's actual reported EPS and the market consensus EPS estimate prior to release, calculated as `((Reported EPS - Consensus EPS) / Consensus EPS) * 100`.
*   **SCOPE IN TRADEORA:** Triggers quantitative market signals and immediate news sentiment updates via Earnings Intelligence Service.
*   **IDENTIFIER CONVENTION:** Code/DB: `EarningsSurprise` | API: `earningsSurprisePercentage` | Event: `EARNINGS_REPORT_RELEASED`
*   **RELATED TERMS:** `ConsensusEstimate`, `EPS`, `EarningsReport`
*   **FORBIDDEN SYNONYMS:** EPS-Beat-Ratio, EPS-Delta
*   **EGX CONTEXT:** Evaluated instantly upon filing parsing.

#### 72. Consensus Estimate
*   **TERM (English):** Consensus Estimate
*   **TERM (Arabic):** متوسط توقعات المحللين
*   **DEFINITION:** The aggregated average forecast of key financial metrics (EPS, Revenue) compiled from independent financial research analysts covering an Asset.
*   **SCOPE IN TRADEORA:** Benchmark for earnings and revenue surprise evaluation.
*   **IDENTIFIER CONVENTION:** Code/DB: `ConsensusEstimate` | API: `consensusEps`, `consensusRevenue`
*   **RELATED TERMS:** `EarningsSurprise`, `EPS`, `Revenue`
*   **FORBIDDEN SYNONYMS:** Analyst-Forecast, Market-Expectation
*   **EGX CONTEXT:** Ingested from regional brokerage analyst research coverage.

#### 73. P/E Ratio (Price-to-Earnings Ratio)
*   **TERM (English):** P/E Ratio (Price-to-Earnings Ratio)
*   **TERM (Arabic):** مضاعف الربحية
*   **DEFINITION:** A fundamental valuation ratio comparing an Asset's current market price to its earnings per share, calculated as `Current Price / Trailing 12-Month EPS`.
*   **SCOPE IN TRADEORA:** Primary valuation metric for equity screening, peer comparison, and factor scoring.
*   **IDENTIFIER CONVENTION:** Code/DB: `PERatio` | API: `peRatio`
*   **RELATED TERMS:** `Price`, `EPS`, `ValuationRatio`
*   **FORBIDDEN SYNONYMS:** Earnings-Multiple, PE-Val
*   **EGX CONTEXT:** Key metric compared against EGX30 historical average P/E.

#### 74. P/B Ratio (Price-to-Book Ratio)
*   **TERM (English):** P/B Ratio (Price-to-Book Ratio)
*   **TERM (Arabic):** مضاعف القيمة الدفترية
*   **DEFINITION:** A valuation ratio comparing an Asset's market capitalization to its total net book value (Assets - Liabilities), calculated as `Current Price / Book Value Per Share`.
*   **SCOPE IN TRADEORA:** Crucial metric for screening financial sector, banking, and asset-heavy stocks.
*   **IDENTIFIER CONVENTION:** Code/DB: `PBRatio` | API: `pbRatio`
*   **RELATED TERMS:** `BalanceSheet`, `ValuationRatio`, `BookValue`
*   **FORBIDDEN SYNONYMS:** Book-Multiple, PB-Val
*   **EGX CONTEXT:** Primary valuation metric for Egyptian banking sector (e.g., CIB, QNB Alahli).

#### 75. EV/EBITDA
*   **TERM (English):** EV/EBITDA
*   **TERM (Arabic):** مضاعف قيمة المنشأة إلى الأرباح قبل الفوائد والضرائب والإهلاك والاستهلاك
*   **DEFINITION:** A capital-structure neutral valuation ratio comparing Enterprise Value to EBITDA, calculated as `Enterprise Value / EBITDA`.
*   **SCOPE IN TRADEORA:** Used in cross-border M&A evaluation and regional peer valuation screening.
*   **IDENTIFIER CONVENTION:** Code/DB: `EVEBITDA` | API: `evToEbitdaRatio`
*   **RELATED TERMS:** `EnterpriseValue`, `EBITDA`, `ValuationRatio`
*   **FORBIDDEN SYNONYMS:** Enterprise-Multiple, EV-EBITDA-Val
*   **EGX CONTEXT:** Standard institutional valuation metric for MENA region.

#### 76. Debt-to-Equity
*   **TERM (English):** Debt-to-Equity
*   **TERM (Arabic):** نسبة الدين إلى الملكية
*   **DEFINITION:** A leverage financial ratio evaluating corporate financial risk, calculated as `Total Liabilities / Total Shareholders' Equity`.
*   **SCOPE IN TRADEORA:** Used in risk assessment, credit scoring, and Shariah-compliance filtering (Islamic Finance).
*   **IDENTIFIER CONVENTION:** Code/DB: `DebtToEquity` | API: `debtToEquityRatio`
*   **RELATED TERMS:** `BalanceSheet`, `Risk`, `ShariahCompliance`
*   **FORBIDDEN SYNONYMS:** Leverage-Ratio, Debt-Ratio
*   **EGX CONTEXT:** Essential metric for Shariah-compliant investor screening on EGX.

#### 77. Discounted Cash Flow (DCF)
*   **TERM (English):** Discounted Cash Flow (DCF)
*   **TERM (Arabic):** نموذج خصم التدفقات النقدية
*   **DEFINITION:** A fundamental valuation methodology calculating an Asset's intrinsic Fair Value by discounting its projected future free cash flows to present value using WACC.
*   **SCOPE IN TRADEORA:** Core valuation engine in Financial Research Domain delivering objective intrinsic value bands.
*   **IDENTIFIER CONVENTION:** Code/DB: `DiscountedCashFlow` | API: `dcfFairValue`, `wacc`
*   **RELATED TERMS:** `FairValue`, `IntrinsicValue`, `WACC`, `MarginOfSafety`
*   **FORBIDDEN SYNONYMS:** Present-Value-Model, Cash-Discount-Engine
*   **EGX CONTEXT:** Adjusted for Egyptian risk premium and inflation expectations in WACC calculations.

#### 78. Fair Value
*   **TERM (English):** Fair Value
*   **TERM (Arabic):** القيمة العادلة
*   **DEFINITION:** The calculated objective intrinsic valuation of an Asset derived from fundamental mathematical models (DCF, DDM, EVA) independent of current market price sentiment.
*   **SCOPE IN TRADEORA:** Primary analytical output of Equity Research Service, displayed alongside current price to identify valuation gaps.
*   **IDENTIFIER CONVENTION:** Code/DB: `FairValue` | API: `fairValueAmount`, `valuationModelType`
*   **RELATED TERMS:** `DiscountedCashFlow`, `IntrinsicValue`, `MarginOfSafety`
*   **FORBIDDEN SYNONYMS:** Target-Price, Predicted-Price, Forecasted-Value
*   **EGX CONTEXT:** Used to identify under-valued EGX value opportunities.

#### 79. Intrinsic Value
*   **TERM (English):** Intrinsic Value
*   **TERM (Arabic):** القيمة الجوهرية
*   **DEFINITION:** The true underlying economic worth of an Asset based on fundamental cash generation, assets, and growth potential, independent of market speculation.
*   **SCOPE IN TRADEORA:** Theoretical foundation governing all Fair Value models in Tradeora.
*   **IDENTIFIER CONVENTION:** Code/DB: `IntrinsicValue` | API: `intrinsicValue`
*   **RELATED TERMS:** `FairValue`, `DiscountedCashFlow`
*   **FORBIDDEN SYNONYMS:** True-Value, Real-Worth
*   **EGX CONTEXT:** Core concept for Long-Term Investor persona.

#### 80. Margin of Safety
*   **TERM (English):** Margin of Safety
*   **TERM (Arabic):** هامش الأمان
*   **DEFINITION:** The percentage discount of an Asset's current market price below its calculated Fair Value, calculated as `((Fair Value - Current Price) / Fair Value) * 100`.
*   **SCOPE IN TRADEORA:** Key quantitative filter for conservative investors to minimize downside capital risk.
*   **IDENTIFIER CONVENTION:** Code/DB: `MarginOfSafety` | API: `marginOfSafetyPercentage`
*   **RELATED TERMS:** `FairValue`, `Price`, `DownsideRisk`
*   **FORBIDDEN SYNONYMS:** Safety-Discount, Value-Buffer
*   **EGX CONTEXT:** Protects investors against currency devaluation and volatility shocks in EGX.

#### 81. WACC (Weighted Average Cost of Capital)
*   **TERM (English):** WACC (Weighted Average Cost of Capital)
*   **TERM (Arabic):** المتوسط المرجح لتكلفة رأس المال
*   **DEFINITION:** The required rate of return a company must earn on its assets to satisfy equity holders and debt providers, used as the discount rate in DCF models.
*   **SCOPE IN TRADEORA:** Input variable in Fair Value DCF calculations.
*   **IDENTIFIER CONVENTION:** Code/DB: `WACC` | API: `waccPercentage`
*   **RELATED TERMS:** `DiscountedCashFlow`, `FairValue`
*   **FORBIDDEN SYNONYMS:** Discount-Rate-Avg, Capital-Cost
*   **EGX CONTEXT:** Incorporates Egyptian Central Bank risk-free rates and country risk premiums.

#### 82. Factor Score
*   **TERM (English):** Factor Score
*   **TERM (Arabic):** درجة العامل الكمي
*   **DEFINITION:** A standardized quantitative metric (-3.0 to +3.0) evaluating an Asset across specific factor dimensions such as Value, Quality, Momentum, Low Volatility, and Size.
*   **SCOPE IN TRADEORA:** Computed by Price Intelligence and Financial Research domains for multi-factor asset screening.
*   **IDENTIFIER CONVENTION:** Code/DB: `FactorScore` | API: `factorCode`, `scoreValue`
*   **RELATED TERMS:** `PERatio`, `Volatility`, `Screening`
*   **FORBIDDEN SYNONYMS:** Factor-Rank, Quant-Score
*   **EGX CONTEXT:** Normalizes factor distribution across EGX listed assets.

---

### 3.5 Portfolio and Position Management

#### 83. Portfolio
*   **TERM (English):** Portfolio
*   **TERM (Arabic):** محفظة استثمارية
*   **DEFINITION:** An authoritative ledger maintaining a user's multi-asset position holdings, cash balances, trade logs, and historical valuations under defined risk parameters and base currency.
*   **SCOPE IN TRADEORA:** Aggregate root owned by Portfolio Domain; central entity for performance tracking, risk assessment, and rebalancing.
*   **IDENTIFIER CONVENTION:** Code/DB: `Portfolio` | API: `portfolioId`, `baseCurrency` | Event: `PORTFOLIO_VALUE_CHANGED`
*   **RELATED TERMS:** `Position`, `CashBalance`, `NetAssetValue`, `UserProfile`
*   **FORBIDDEN SYNONYMS:** Account, Holdings, Fund, Wallet
*   **EGX CONTEXT:** Aggregates EGX holdings alongside cash balances in EGP or foreign currencies.

#### 84. Position
*   **TERM (English):** Position
*   **TERM (Arabic):** مركز استثماري
*   **DEFINITION:** The current aggregated holding quantity of a specific Instrument held within a single Portfolio at a given point in time.
*   **SCOPE IN TRADEORA:** Entity within Portfolio aggregate; tracks share quantity, cost basis, unrealized gain/loss, and current market value.
*   **IDENTIFIER CONVENTION:** Code/DB: `Position` | API: `positionId`, `quantityHeld`
*   **RELATED TERMS:** `Portfolio`, `Instrument`, `CostBasis`, `MarketValue`
*   **FORBIDDEN SYNONYMS:** Holding, Lot, Stake, Inventory
*   **EGX CONTEXT:** Position size updated upon execution of EGX trades or stock split processing.

#### 85. Cost Basis
*   **TERM (English):** Cost Basis
*   **TERM (Arabic):** التكلفة الأساسية / متوسط سعر الشراء
*   **DEFINITION:** The total monetary cost incurred to acquire a Position, including purchase prices and transaction commissions, used to calculate realized and unrealized gains.
*   **SCOPE IN TRADEORA:** Maintained by Portfolio Domain using average cost accounting methodologies.
*   **IDENTIFIER CONVENTION:** Code/DB: `CostBasis` | API: `averageCostBasis`, `totalCostBasis`
*   **RELATED TERMS:** `Position`, `UnrealizedGain`, `RealizedGain`
*   **FORBIDDEN SYNONYMS:** Purchase-Cost, Avg-Price-Paid
*   **EGX CONTEXT:** Adjusted for brokerage commissions and EGX clearance fees.

#### 86. Market Value
*   **TERM (English):** Market Value
*   **TERM (Arabic):** القيمة السوقية الحالية للمركز
*   **DEFINITION:** The total monetary worth of a Position at current market prices, calculated as `Quantity Held * Last Price`.
*   **SCOPE IN TRADEORA:** Calculated continuously by Portfolio Tracking Service to compute Net Asset Value (NAV).
*   **IDENTIFIER CONVENTION:** Code/DB: `MarketValue` | API: `marketValueAmount`
*   **RELATED TERMS:** `Position`, `LastPrice`, `NetAssetValue`
*   **FORBIDDEN SYNONYMS:** Current-Position-Val, Position-Worth
*   **EGX CONTEXT:** Revalued in real-time during EGX trading session hours.

#### 87. Unrealized Gain
*   **TERM (English):** Unrealized Gain
*   **TERM (Arabic):** أرباح غير محققة (ورقية)
*   **DEFINITION:** The monetary paper profit or loss on an open Position, calculated as `Market Value - Total Cost Basis`.
*   **SCOPE IN TRADEORA:** Displayed on portfolio dashboards to reflect current open performance prior to sale.
*   **IDENTIFIER CONVENTION:** Code/DB: `UnrealizedGain` | API: `unrealizedGainLoss`
*   **RELATED TERMS:** `Position`, `RealizedGain`, `MarketValue`
*   **FORBIDDEN SYNONYMS:** Paper-Profit, Open-P&L
*   **EGX CONTEXT:** Fluctuates live with EGX tick feeds.

#### 88. Realized Gain
*   **TERM (English):** Realized Gain
*   **TERM (Arabic):** أرباح محققة
*   **DEFINITION:** The net monetary profit or loss locked in upon the execution of a sell transaction, calculated as `Net Sale Proceeds - Allocated Cost Basis`.
*   **SCOPE IN TRADEORA:** Recorded permanently in Portfolio transaction ledgers for tax and performance attribution reporting.
*   **IDENTIFIER CONVENTION:** Code/DB: `RealizedGain` | API: `realizedGainLoss`
*   **RELATED TERMS:** `Portfolio`, `UnrealizedGain`, `HistoricalTrade`
*   **FORBIDDEN SYNONYMS:** Closed-Profit, Locked-P&L
*   **EGX CONTEXT:** Used for capital gains tax calculations under Egyptian tax regulations.

#### 89. Total Return
*   **TERM (English):** Total Return
*   **TERM (Arabic):** العائد الإجمالي
*   **DEFINITION:** The overall percentage return generated by a Portfolio or Position over a period, incorporating both capital appreciation (price changes) and cash income (dividends).
*   **SCOPE IN TRADEORA:** Core return metric displayed in performance dashboards.
*   **IDENTIFIER CONVENTION:** Code/DB: `TotalReturn` | API: `totalReturnPercentage`
*   **RELATED TERMS:** `TWR`, `MWR`, `Dividend`
*   **FORBIDDEN SYNONYMS:** Total-Profit-%, Overall-Gain
*   **EGX CONTEXT:** Critical for evaluating dividend-heavy EGX portfolios.

#### 90. Time-Weighted Return (TWR)
*   **TERM (English):** Time-Weighted Return (TWR)
*   **TERM (Arabic):** العائد الموزون بالزمن (TWR)
*   **DEFINITION:** A compounding return metric measuring portfolio investment performance while strictly eliminating the distorting effects of external cash deposits and withdrawals.
*   **SCOPE IN TRADEORA:** Primary standard calculation method used by Portfolio Performance Service for benchmark comparison.
*   **IDENTIFIER CONVENTION:** Code/DB: `TimeWeightedReturn` | API: `twrPercentage`
*   **RELATED TERMS:** `MWR`, `TotalReturn`, `Benchmark`
*   **FORBIDDEN SYNONYMS:** Time-Return, Clean-Portfolio-Return
*   **EGX CONTEXT:** Institutional standard for evaluating portfolio manager skill.

#### 91. Money-Weighted Return (MWR)
*   **TERM (English):** Money-Weighted Return (MWR)
*   **TERM (Arabic):** العائد الموزون بالنقود (MWR / IRR)
*   **DEFINITION:** The internal rate of return (IRR) that equates the present value of all cash inflows and outflows to the final portfolio Net Asset Value.
*   **SCOPE IN TRADEORA:** Secondary performance calculation evaluating actual investor personal return performance.
*   **IDENTIFIER CONVENTION:** Code/DB: `MoneyWeightedReturn` | API: `mwrPercentage`
*   **RELATED TERMS:** `TWR`, `NetAssetValue`, `CashFlow`
*   **FORBIDDEN SYNONYMS:** Internal-Rate-Return, Money-Return
*   **EGX CONTEXT:** Evaluates individual retail investor deposit timing performance.

#### 92. Net Asset Value (NAV)
*   **TERM (English):** Net Asset Value (NAV)
*   **TERM (Arabic):** صافي قيمة الأصول
*   **DEFINITION:** The total monetary value of a Portfolio's assets (market value of positions plus cash balances) minus any outstanding liabilities, expressed in Base Currency.
*   **SCOPE IN TRADEORA:** Authoritative top-level monetary metric representing total user portfolio wealth.
*   **IDENTIFIER CONVENTION:** Code/DB: `NetAssetValue` | API: `netAssetValue`, `navCurrency`
*   **RELATED TERMS:** `Portfolio`, `MarketValue`, `CashBalance`
*   **FORBIDDEN SYNONYMS:** Portfolio-Total, Net-Worth-Value
*   **EGX CONTEXT:** Revalued continuously during EGX market session.

#### 93. Cash Balance
*   **TERM (English):** Cash Balance
*   **TERM (Arabic):** الرصيد النقدي
*   **DEFINITION:** The un-invested monetary liquidity available within a Portfolio ledger across explicit ISO currencies.
*   **SCOPE IN TRADEORA:** Used for purchasing new positions, receiving cash dividends, and paying subscription/trading fees.
*   **IDENTIFIER CONVENTION:** Code/DB: `CashBalance` | API: `cashAmount`, `currency`
*   **RELATED TERMS:** `Portfolio`, `NetAssetValue`, `DividendReceipt`
*   **FORBIDDEN SYNONYMS:** Liquid-Money, Wallet-Cash
*   **EGX CONTEXT:** Maintained in EGP or USD. Cannot drop below zero without margin facility (Constitution Business Rule 25).

#### 94. Target Weight
*   **TERM (English):** Target Weight
*   **TERM (Arabic):** الوزن المستهدف
*   **DEFINITION:** The desired percentage allocation (expressed as a decimal from 0.00 to 1.00) assigned to a Position or Asset Class within a portfolio model strategy.
*   **SCOPE IN TRADEORA:** Used by Portfolio Construction Intelligence and Rebalancing Engine to calculate trade adjustments.
*   **IDENTIFIER CONVENTION:** Code/DB: `TargetWeight` | API: `targetWeight`
*   **RELATED TERMS:** `ActualWeight`, `Rebalancing`, `Drift`
*   **FORBIDDEN SYNONYMS:** Model-Allocation, Desired-%
*   **EGX CONTEXT:** Defines model allocation targets for EGX portfolio strategies.

#### 95. Actual Weight
*   **TERM (English):** Actual Weight
*   **TERM (Arabic):** الوزن الفعلي الحالي
*   **DEFINITION:** The current real-time percentage proportion of a Position's market value relative to total portfolio NAV, calculated as `Position Market Value / Portfolio NAV`.
*   **SCOPE IN TRADEORA:** Compared against Target Weight to detect portfolio Drift.
*   **IDENTIFIER CONVENTION:** Code/DB: `ActualWeight` | API: `actualWeight`
*   **RELATED TERMS:** `TargetWeight`, `Drift`, `MarketValue`
*   **FORBIDDEN SYNONYMS:** Current-Allocation-%, Real-Weight
*   **EGX CONTEXT:** Updates live with EGX intraday price changes.

#### 96. Rebalancing
*   **TERM (English):** Rebalancing
*   **TERM (Arabic):** إعادة توازن المحفظة
*   **DEFINITION:** The process of buying or selling portfolio positions to realign Actual Weights back to declared Target Weights and risk limits.
*   **SCOPE IN TRADEORA:** Synthesized as an explainable proposal by Portfolio Construction Intelligence.
*   **IDENTIFIER CONVENTION:** Code/DB: `Rebalancing` | API: `rebalanceProposalId` | Event: `REBALANCE_PROPOSAL_GENERATED`
*   **RELATED TERMS:** `Drift`, `TargetWeight`, `ActualWeight`
*   **FORBIDDEN SYNONYMS:** Portfolio-Adjustment, Realignment-Trade
*   **EGX CONTEXT:** Generates low-slippage trade proposals for EGX holdings.

#### 97. Drift
*   **TERM (English):** Drift
*   **TERM (Arabic):** الانحراف عن الوزن المستهدف
*   **DEFINITION:** The absolute percentage deviation between a Position's Actual Weight and its Target Weight caused by price movement divergence, calculated as `|Actual Weight - Target Weight|`.
*   **SCOPE IN TRADEORA:** Monitored by Risk Engine to trigger rebalancing alerts when drift exceeds threshold limits (e.g., > 5%).
*   **IDENTIFIER CONVENTION:** Code/DB: `Drift` | API: `driftPercentage`
*   **RELATED TERMS:** `Rebalancing`, `TargetWeight`, `ActualWeight`
*   **FORBIDDEN SYNONYMS:** Weight-Deviation, Allocation-Gap
*   **EGX CONTEXT:** High market volatility in EGX triggers accelerated drift warnings.

#### 98. Benchmark Comparison
*   **TERM (English):** Benchmark Comparison
*   **TERM (Arabic):** مقارنة الأداء بالمؤشر الاسترشادي
*   **DEFINITION:** The formal analytical evaluation of a Portfolio's TWR and risk metrics against a normalized Benchmark Index (e.g., EGX30) over an identical timeframe.
*   **SCOPE IN TRADEORA:** Executed by Portfolio Performance Service to compute Alpha and Tracking Error.
*   **IDENTIFIER CONVENTION:** Code/DB: `BenchmarkComparison` | API: `relativeAlpha`, `trackingError`
*   **RELATED TERMS:** `Benchmark`, `Alpha`, `TWR`
*   **FORBIDDEN SYNONYMS:** Index-Match, Relative-Performance
*   **EGX CONTEXT:** Requires base currency alignment between portfolio and EGX index.

#### 99. Base Currency
*   **TERM (English):** Base Currency
*   **TERM (Arabic):** عملة الأساس للقياس المحاسبي
*   **DEFINITION:** The single primary ISO currency chosen by a user to value, consolidate, and report all multi-asset portfolio ledgers and performance metrics.
*   **SCOPE IN TRADEORA:** Universal accounting parameter applied across all Portfolio views.
*   **IDENTIFIER CONVENTION:** Code/DB: `BaseCurrency` | API: `baseCurrency`
*   **RELATED TERMS:** `MultiCurrencyPortfolio`, `ExchangeRate`, `FXGain`
*   **FORBIDDEN SYNONYMS:** Reporting-Currency, Main-Money-Unit
*   **EGX CONTEXT:** Defaults to `EGP` for Egyptian accounts, configurable to `USD`, `SAR`, etc.

#### 100. FX Gain (Foreign Exchange Gain/Loss)
*   **TERM (English):** FX Gain
*   **TERM (Arabic):** أرباح/خسائر فروق سعر الصرف
*   **DEFINITION:** The portion of total portfolio monetary return derived specifically from currency exchange rate fluctuations between an Instrument's trading currency and the portfolio Base Currency.
*   **SCOPE IN TRADEORA:** Isolated by Multi-Currency Portfolio Service to separate organic security growth from currency devaluation effects.
*   **IDENTIFIER CONVENTION:** Code/DB: `FXGain` | API: `fxGainLossAmount`
*   **RELATED TERMS:** `BaseCurrency`, `MultiCurrencyPortfolio`, `ExchangeRate`
*   **FORBIDDEN SYNONYMS:** Currency-Profit, Devaluation-Gain
*   **EGX CONTEXT:** Essential metric for Egyptian investors holding dual-currency USD/EGP EGX assets during currency devaluations.

---

### 3.6 Risk

#### 101. Risk
*   **TERM (English):** Risk
*   **TERM (Arabic):** المخاطر المالية
*   **DEFINITION:** The quantifiable uncertainty or probability of financial capital loss or underperformance relative to expectations within a portfolio or investment.
*   **SCOPE IN TRADEORA:** Core governing domain (Risk Domain) providing VaR, drawdown stress testing, and concentration limits.
*   **IDENTIFIER CONVENTION:** Code/DB: `Risk` | API: `riskScore`, `riskMetrics`
*   **RELATED TERMS:** `RiskProfile`, `ValueAtRisk`, `Exposure`
*   **FORBIDDEN SYNONYMS:** Exposure (as alias), Uncertainty, Danger
*   **EGX CONTEXT:** Encompasses market volatility, liquidity risk, and macroeconomic currency risk on EGX.

#### 102. Risk Profile
*   **TERM (English):** Risk Profile
*   **TERM (Arabic):** ملف مخاطر المستثمر
*   **DEFINITION:** The evaluated classification of a user's financial loss tolerance, risk capacity, investment horizon, and financial knowledge derived from standardized questionnaires.
*   **SCOPE IN TRADEORA:** Aggregate root owned by Risk Domain; governs AI recommendation suitability boundaries and portfolio risk threshold limits.
*   **IDENTIFIER CONVENTION:** Code/DB: `RiskProfile` | API: `riskProfileId`, `riskScore`, `capacityTier` | Event: `RISK_PROFILE_CALCULATED`
*   **RELATED TERMS:** `UserProfile`, `RiskTolerance`, `Recommendation`
*   **FORBIDDEN SYNONYMS:** Risk-Category-Doc, Suitability-Score
*   **EGX CONTEXT:** Classified into Conservative, Moderate, Growth, or Aggressive tiers under regulatory guidelines.

#### 103. Risk Score
*   **TERM (English):** Risk Score
*   **TERM (Arabic):** درجة تقييم المخاطر (0-100)
*   **DEFINITION:** A standardized numerical score from 0 (minimum risk) to 100 (maximum risk) reflecting a user's evaluated risk appetite or an asset's volatility profile.
*   **SCOPE IN TRADEORA:** Used to match AI investment proposals to user suitability tiers.
*   **IDENTIFIER CONVENTION:** Code/DB: `RiskScore` | API: `riskScore`
*   **RELATED TERMS:** `RiskProfile`, `RiskTolerance`
*   **FORBIDDEN SYNONYMS:** Risk-Rating, Danger-Index
*   **EGX CONTEXT:** Determines maximum allowed single-stock concentration limits in portfolios.

#### 104. Value-at-Risk (VaR)
*   **TERM (English):** Value-at-Risk (VaR)
*   **TERM (Arabic):** القيمة المعرضة للمخاطر (VaR)
*   **DEFINITION:** A statistical risk metric quantifying the maximum expected monetary loss of a Portfolio over a defined time horizon (e.g., 1 day) at a specified confidence level (e.g., 95% or 99%).
*   **SCOPE IN TRADEORA:** Primary quantitative risk metric calculated by Risk Evaluator Service to detect portfolio risk breaches.
*   **IDENTIFIER CONVENTION:** Code/DB: `ValueAtRisk` | API: `varAmount`, `confidenceLevelPercentage` | Event: `RISK_ALERT_TRIGGERED`
*   **RELATED TERMS:** `ConditionalVaR`, `RiskThreshold`, `Portfolio`
*   **FORBIDDEN SYNONYMS:** Max-Loss-Est, VaR-Score
*   **EGX CONTEXT:** Evaluated daily incorporating EGX historical volatility regimes.

#### 105. Conditional VaR (CVaR / Expected Shortfall)
*   **TERM (English):** Conditional VaR (CVaR)
*   **TERM (Arabic):** القيمة المعرضة للمخاطر الشرطية (النقص المتوقع)
*   **DEFINITION:** An advanced risk metric quantifying the expected average monetary loss of a Portfolio in the extreme tail scenarios where the VaR threshold is breached.
*   **SCOPE IN TRADEORA:** Used in institutional risk profiling and portfolio stress testing for extreme downside tail risk.
*   **IDENTIFIER CONVENTION:** Code/DB: `ConditionalVaR` | API: `cvarAmount`
*   **RELATED TERMS:** `ValueAtRisk`, `DownsideRisk`, `StressTest`
*   **FORBIDDEN SYNONYMS:** Tail-Risk-Loss, Expected-Shortfall
*   **EGX CONTEXT:** Captures tail risk during extreme EGX market crash events.

#### 106. Exposure
*   **TERM (English):** Exposure
*   **TERM (Arabic):** مدى التعرض المالي (القيمة العرضة للمخاطرة)
*   **DEFINITION:** The absolute monetary amount or percentage proportion of portfolio capital invested in a specific Asset, Sector, Asset Class, or Currency region.
*   **SCOPE IN TRADEORA:** Monitored by Risk Assessment Service to prevent concentration breaches.
*   **IDENTIFIER CONVENTION:** Code/DB: `Exposure` | API: `exposureAmount`, `exposurePercentage`
*   **RELATED TERMS:** `ConcentrationRisk`, `SectorRisk`, `CurrencyRisk`
*   **FORBIDDEN SYNONYMS:** Risk (as alias), Capital-At-Stake
*   **EGX CONTEXT:** Tracks exposure to single EGX sectors (e.g., Banking sector exposure).

#### 107. Concentration Risk
*   **TERM (English):** Concentration Risk
*   **TERM (Arabic):** مخاطر التركز الاستثماري
*   **DEFINITION:** The heightened risk of financial loss resulting from over-allocating portfolio capital to a single Asset, Sector, or Geographic market (e.g., > 25% in one stock).
*   **SCOPE IN TRADEORA:** Triggers automated Risk Alerts when concentration limits defined in User Risk Profiles are breached.
*   **IDENTIFIER CONVENTION:** Code/DB: `ConcentrationRisk` | API: `concentrationPercentage` | Event: `RISK_ALERT_TRIGGERED`
*   **RELATED TERMS:** `Exposure`, `SectorRisk`, `RiskAlert`
*   **FORBIDDEN SYNONYMS:** Over-Allocation-Risk, Single-Stock-Trap
*   **EGX CONTEXT:** Common issue in retail EGX portfolios over-concentrated in CIB or real estate stocks.

#### 108. Volatility
*   **TERM (English):** Volatility
*   **TERM (Arabic):** التقلب السعري
*   **DEFINITION:** A statistical measure of the dispersion of returns for a given Instrument or Portfolio, typically calculated as the annualized standard deviation of daily price returns.
*   **SCOPE IN TRADEORA:** Used in Sharpe Ratio calculations, option pricing models, and risk rating assignments.
*   **IDENTIFIER CONVENTION:** Code/DB: `Volatility` | API: `annualizedVolatility`
*   **RELATED TERMS:** `StandardDeviation`, `Beta`, `SharpeRatio`
*   **FORBIDDEN SYNONYMS:** Price-Uncertainty, Fluctuation-Rate
*   **EGX CONTEXT:** Calculated using 30-day and 252-day EGX trading price series.

#### 109. Correlation Matrix
*   **TERM (English):** Correlation Matrix
*   **TERM (Arabic):** مصفوفة الارتباط المالي
*   **DEFINITION:** A statistical matrix displaying pairwise correlation coefficients (-1.0 to +1.0) between multiple Instruments in a portfolio to measure co-movement.
*   **SCOPE IN TRADEORA:** Used by Portfolio Construction Intelligence to optimize diversification benefits and reduce total portfolio variance.
*   **IDENTIFIER CONVENTION:** Code/DB: `CorrelationMatrix` | API: `correlationMatrixData`
*   **RELATED TERMS:** `Portfolio`, `Risk Assessment`, `Diversification`
*   **FORBIDDEN SYNONYMS:** Co-Movement-Grid, Asset-Relationship-Matrix
*   **EGX CONTEXT:** Identifies non-correlated EGX sector pairs for diversification.

#### 110. Stress Test
*   **TERM (English):** Stress Test
*   **TERM (Arabic):** اختبار الجهد / الضغط المالي
*   **DEFINITION:** A simulation analysis evaluating the hypothetical monetary impact on a Portfolio's NAV under extreme historical or synthetic shock scenarios (e.g., 2008 crash, 50% currency devaluation).
*   **SCOPE IN TRADEORA:** Feature provided by Risk Domain to allow advisors and portfolio managers to assess tail vulnerability.
*   **IDENTIFIER CONVENTION:** Code/DB: `StressTest` | API: `stressTestScenarioId`, `simulatedNavImpact`
*   **RELATED TERMS:** `ScenarioAnalysis`, `ValueAtRisk`, `ConditionalVaR`
*   **FORBIDDEN SYNONYMS:** Crash-Simulation, Vulnerability-Test
*   **EGX CONTEXT:** Includes Egyptian-specific macro scenarios such as interest rate hikes or EGP floatation events.

#### 111. Maximum Drawdown
*   **TERM (English):** Maximum Drawdown
*   **TERM (Arabic):** أقصى تراجع تاريخي (Max Drawdown)
*   **DEFINITION:** The maximum observed peak-to-trough percentage decline in a Portfolio's valuation before a new peak is achieved over a defined historical period.
*   **SCOPE IN TRADEORA:** Core risk metric displayed on performance reports and used in Sortino Ratio calculations.
*   **IDENTIFIER CONVENTION:** Code/DB: `MaximumDrawdown` | API: `maxDrawdownPercentage`
*   **RELATED TERMS:** `DrawdownRecovery`, `SortinoRatio`, `DownsideRisk`
*   **FORBIDDEN SYNONYMS:** Peak-Trough-Loss, Worst-Drop
*   **EGX CONTEXT:** Measures historical loss depth during market corrections.

#### 112. Risk Alert
*   **TERM (English):** Risk Alert
*   **TERM (Arabic):** تنبيه المخاطر
*   **DEFINITION:** High-priority domain notification event triggered when a Portfolio breaches defined risk thresholds (VaR exceedance, concentration cap breach, drawdown warning).
*   **SCOPE IN TRADEORA:** Dispatched via Alert Notification Service to override muted settings (Constitution Business Rule 29).
*   **IDENTIFIER CONVENTION:** Code/DB: `RiskAlert` | API: `riskAlertId`, `severity` | Event: `RISK_ALERT_TRIGGERED`
*   **RELATED TERMS:** `RiskThreshold`, `ConcentrationRisk`, `Notification`
*   **FORBIDDEN SYNONYMS:** Risk-Warning, Danger-Notice
*   **EGX CONTEXT:** Alerts users to sudden EGX portfolio vulnerability.

---

### 3.7 AI and Intelligence

#### 113. AI Recommendation
*   **TERM (English):** AI Recommendation
*   **TERM (Arabic):** توصية استثمارية ذكية
*   **DEFINITION:** A personalized, explainable investment proposal synthesized by AI engines for a specific UserProfile and Portfolio, incorporating mandatory ConfidenceScore, KeyAssumptions, IdentifiedRisks, and RationaleText.
*   **SCOPE IN TRADEORA:** Aggregate root owned by AI Intelligence Domain; generated via multi-agent reasoning, subject to strict regulatory disclosures (FRA/CMA).
*   **IDENTIFIER CONVENTION:** Code/DB: `Recommendation` | API: `recommendationId`, `actionDirection` | Event: `AI_RECOMMENDATION_GENERATED`
*   **RELATED TERMS:** `ConfidenceScore`, `KeyAssumptions`, `IdentifiedRisks`, `Rationale`
*   **FORBIDDEN SYNONYMS:** Signal, Tip, Advice, Hot-Pick, Suggestion
*   **EGX CONTEXT:** Proposes personalized actions (Accumulate, Hold, Reduce) on EGX assets.

#### 114. AISignal
*   **TERM (English):** AISignal
*   **TERM (Arabic):** إشارة كمية ذكية
*   **DEFINITION:** An objective, quantitative market setup flag generated by analytical algorithms indicating technical or fundamental regime shifts without personal suitability context.
*   **SCOPE IN TRADEORA:** Produced by Signal Generation Service; consumed by Active Traders and as input for Recommendation synthesis.
*   **IDENTIFIER CONVENTION:** Code/DB: `AISignal` | API: `signalId`, `signalDirection` | Event: `AI_SIGNAL_DETECTED`
*   **RELATED TERMS:** `Recommendation`, `PriceIntelligence`, `ConfidenceScore`
*   **FORBIDDEN SYNONYMS:** Technical-Tip, Trade-Flag, Forecast-Signal
*   **EGX CONTEXT:** Signals volume breakouts or RSI crossovers on EGX30 stocks.

#### 115. ConfidenceScore
*   **TERM (English):** ConfidenceScore
*   **TERM (Arabic):** درجة الثقة الإحصائية (0-100%)
*   **DEFINITION:** A standardized calibrated statistical percentage (0.00% to 100.00%) reflecting an AI model's mathematical certainty regarding an inference or recommendation based on data freshness and accuracy.
*   **SCOPE IN TRADEORA:** Mandatory component of every AI Recommendation and AISignal payload (Constitution Principle 11.3). Scores < 60% suppress automated recommendation generation (Business Rule 38).
*   **IDENTIFIER CONVENTION:** Code/DB: `ConfidenceScore` | API: `confidenceScorePercentage`
*   **RELATED TERMS:** `Recommendation`, `AISignal`, `ModelConfidence`
*   **FORBIDDEN SYNONYMS:** Probability, Rating, Certainty-Index, Star-Score
*   **EGX CONTEXT:** Derived from data completeness of EGX disclosures.

#### 116. Key Assumptions
*   **TERM (English):** Key Assumptions
*   **TERM (Arabic):** الفرضيات الجوهرية للنموذج
*   **DEFINITION:** Explicit declarations of macro and fundamental input parameters relied upon by an AI model during inference (e.g., inflation rate assumption, benchmark interest rate, terminal growth rate).
*   **SCOPE IN TRADEORA:** Mandatory explainability component attached to every AI Recommendation payload (Constitution Principle 11.4).
*   **IDENTIFIER CONVENTION:** Code/DB: `KeyAssumptions` | API: `keyAssumptionsList`
*   **RELATED TERMS:** `Recommendation`, `Explainability`, `FairValue`
*   **FORBIDDEN SYNONYMS:** Model-Inputs, Context-Baselines
*   **EGX CONTEXT:** Declares Egyptian Central Bank interest rate and FX rate assumptions.

#### 117. Identified Risks
*   **TERM (English):** Identified Risks
*   **TERM (Arabic):** المخاطر المحتملة المحددة
*   **DEFINITION:** Explicit downside scenarios, potential headwinds, and loss risks identified by AI engines that could invalidate an investment recommendation.
*   **SCOPE IN TRADEORA:** Mandatory risk disclosure section displayed with visual prominence equal to upside opportunities (Constitution Principle 11.5).
*   **IDENTIFIER CONVENTION:** Code/DB: `IdentifiedRisks` | API: `identifiedRisksList`
*   **RELATED TERMS:** `Recommendation`, `DownsideRisk`, `Explainability`
*   **FORBIDDEN SYNONYMS:** Threat-List, Downside-Warnings
*   **EGX CONTEXT:** Highlights sector concentration, regulatory changes, or EGP volatility risks.

#### 118. Rationale (Explainability Rationale)
*   **TERM (English):** Rationale
*   **TERM (Arabic):** التفسير والتعليل المنطقي
*   **DEFINITION:** Clear, structured causal textual reasoning in Arabic or English detailing the exact mathematical, fundamental, and technical factors that produced an AI output.
*   **SCOPE IN TRADEORA:** Enforces 100% AI explainability; pure black-box outputs are strictly forbidden.
*   **IDENTIFIER CONVENTION:** Code/DB: `Rationale` | API: `rationaleText`
*   **RELATED TERMS:** `Recommendation`, `Explainability`, `AIInsight`
*   **FORBIDDEN SYNONYMS:** AI-Reasoning, Logic-Summary
*   **EGX CONTEXT:** Rendered in native MSA Arabic for EGX investors.

#### 119. AIInsight
*   **TERM (English):** AIInsight
*   **TERM (Arabic):** رؤية تحليلية ذكية
*   **DEFINITION:** An enriched, contextualized analytical summary produced by processing news, fundamental filings, and price action through AI models to deliver tailored situational awareness.
*   **SCOPE IN TRADEORA:** Delivered on dashboards and daily briefs to explain market movements without asserting personal trade instructions.
*   **IDENTIFIER CONVENTION:** Code/DB: `AIInsight` | API: `insightId`, `headlineText`
*   **RELATED TERMS:** `NewsSentiment`, `MarketBrief`, `Rationale`
*   **FORBIDDEN SYNONYMS:** News-Summary, Market-Note
*   **EGX CONTEXT:** Explains impact of EGX corporate earnings or Central Bank decisions.

#### 120. SentimentScore
*   **TERM (English):** SentimentScore
*   **TERM (Arabic):** درجة الانطباع المعنوي
*   **DEFINITION:** A quantitative metric deriving public news and media tone toward an Asset, including Polarity Score (-1.0 to +1.0) and Subjectivity Score.
*   **SCOPE IN TRADEORA:** Owned strictly by Financial Research Domain (News & Sentiment capability); consumed by AI Intelligence Domain as input.
*   **IDENTIFIER CONVENTION:** Code/DB: `SentimentScore` | API: `polarityScore`, `subjectivityScore`
*   **RELATED TERMS:** `NewsSentiment`, `NewsItem`, `FinancialResearch`
*   **FORBIDDEN SYNONYMS:** News-Mood, Tone-Rank
*   **EGX CONTEXT:** Evaluates Arabic and English Egyptian financial press coverage.

#### 121. MarketBrief
*   **TERM (English):** MarketBrief
*   **TERM (Arabic):** موجز السوق اليومي
*   **DEFINITION:** A daily synthesized intelligence summary compiled by AI engines prior to session opening or following market close, covering macro indices, sector news, and watchlist updates.
*   **SCOPE IN TRADEORA:** Aggregate root in Financial Research Domain; delivered in Arabic or English to user dashboards and push notifications.
*   **IDENTIFIER CONVENTION:** Code/DB: `MarketBrief` | API: `briefId`, `summaryContent` | Event: `MARKET_BRIEF_GENERATED`
*   **RELATED TERMS:** `AIInsight`, `NewsSentiment`, `MarketSession`
*   **FORBIDDEN SYNONYMS:** Daily-Report, Morning-Note, Market-Paper
*   **EGX CONTEXT:** Published at 09:30 Cairo time prior to EGX session open.

#### 122. RAG (Retrieval-Augmented Generation)
*   **TERM (English):** RAG (Retrieval-Augmented Generation)
*   **TERM (Arabic):** التوليد المُعزز بالتثبت والاسترجاع (RAG)
*   **DEFINITION:** An AI architectural pattern where LLM prompt synthesis is strictly grounded by retrieving verified factual documents (financial statements, official data feeds) to eliminate hallucinations.
*   **SCOPE IN TRADEORA:** Mandatory AI operational standard across all research and recommendation engines (Constitution Principle 11.6).
*   **IDENTIFIER CONVENTION:** Code/System: `RAGPipeline`, `RetrievalContext`
*   **RELATED TERMS:** `Hallucination`, `AuditLog`, `Recommendation`
*   **FORBIDDEN SYNONYMS:** Document-Search-AI, Grounded-LLM
*   **EGX CONTEXT:** Retrieves official EGX PDF disclosures and verified Security Master data.

#### 123. Hallucination (Zero-Hallucination Policy)
*   **TERM (English):** Hallucination
*   **TERM (Arabic):** التوليد الزائف / الهلوسة الذكية
*   **DEFINITION:** The generation by an AI language model of unverified, ungrounded, or mathematically fabricated financial figures, tickers, or news citations.
*   **SCOPE IN TRADEORA:** Absolutely prohibited; system enforces 0.00% hallucination tolerance via strict RAG grounding, verification filters, and automated audit logging.
*   **IDENTIFIER CONVENTION:** Code/Metric: `hallucinationRate` (Target: 0.00%)
*   **RELATED TERMS:** `RAG`, `ConfidenceScore`, `AuditLog`
*   **FORBIDDEN SYNONYMS:** AI-Error, Model-Slip
*   **EGX CONTEXT:** Severe failure if an AI model fabricates EGX financial statement metrics.

#### 124. Recommendation Freshness
*   **TERM (English):** Recommendation Freshness
*   **TERM (Arabic):** صلاحية وحداثة التوصية
*   **DEFINITION:** The operational validity window assigned to an AI Recommendation (e.g., 24 hours for tactical, 30 days for fundamental), after which it is marked stale and suppressed from active views.
*   **SCOPE IN TRADEORA:** Governed by Business Policy 2 to prevent users from acting on expired insights.
*   **IDENTIFIER CONVENTION:** Code/DB: `RecommendationFreshness` | API: `expiryTimestamp`, `isStale`
*   **RELATED TERMS:** `Recommendation`, `StaleRecommendation`
*   **FORBIDDEN SYNONYMS:** Valid-Window, Expiry-Time
*   **EGX CONTEXT:** Tactical EGX recommendations expire automatically at market close.

---

### 3.8 Screening and Discovery

#### 125. Screen
*   **TERM (English):** Screen
*   **TERM (Arabic):** فحص مسحي للأوراق المالية
*   **DEFINITION:** An execution query filtering the listed asset universe against dynamic multi-variable criteria (ratios, technical indicators, factor scores, AI scores).
*   **SCOPE IN TRADEORA:** Capability owned by Screening Service to return actionable investment candidate sets.
*   **IDENTIFIER CONVENTION:** Code/DB: `Screen` | API: `screenId`, `queryParameters`
*   **RELATED TERMS:** `FilterCriterion`, `Universe`, `ScreenerResult`
*   **FORBIDDEN SYNONYMS:** Search-Query, Stock-Filter-Run
*   **EGX CONTEXT:** Filters all 200+ EGX listed equities in sub-second queries.

#### 126. Universe (Investment Universe)
*   **TERM (English):** Universe
*   **TERM (Arabic):** النطاق الاستثماري المستهدف
*   **DEFINITION:** The total set of listed Instruments eligible for screening or portfolio construction, bounded by exchanges, asset classes, or liquidity limits.
*   **SCOPE IN TRADEORA:** Defines boundaries for screening engines (e.g., EGX Equities Universe).
*   **IDENTIFIER CONVENTION:** Code/DB: `InvestmentUniverse` | API: `universeCode`
*   **RELATED TERMS:** `Screen`, `Instrument`, `Exchange`
*   **FORBIDDEN SYNONYMS:** Market-Pool, Asset-Collection
*   **EGX CONTEXT:** Options include EGX All-Share, EGX30, EGX70, or SME Nilex.

#### 127. Watchlist
*   **TERM (English):** Watchlist
*   **TERM (Arabic):** قائمة المتابعة
*   **DEFINITION:** A user-defined aggregate containing a custom collection of monitored Instruments linked to real-time price feeds, alert rules, and tags.
*   **SCOPE IN TRADEORA:** Aggregate root owned by User & Identity Domain; provides prospective monitoring dashboards.
*   **IDENTIFIER CONVENTION:** Code/DB: `Watchlist` | API: `watchlistId`, `name` | Event: `WATCHLIST_UPDATED`
*   **RELATED TERMS:** `WatchlistItem`, `Instrument`, `Alert`
*   **FORBIDDEN SYNONYMS:** Favorites, List, Saved-Items, Stock-Basket
*   **EGX CONTEXT:** Tracks selected EGX tickers across user devices.

#### 128. WatchlistItem
*   **TERM (English):** WatchlistItem
*   **TERM (Arabic):** عنصر في قائمة المتابعة
*   **DEFINITION:** An individual Instrument entry within a Watchlist, associated with custom user tags, notes, and specific alert threshold triggers.
*   **SCOPE IN TRADEORA:** Entity within Watchlist aggregate.
*   **IDENTIFIER CONVENTION:** Code/DB: `WatchlistItem` | API: `watchlistItemId`, `instrumentId`
*   **RELATED TERMS:** `Watchlist`, `Instrument`
*   **FORBIDDEN SYNONYMS:** Saved-Stock, List-Row
*   **EGX CONTEXT:** Represents single EGX ticker entry (e.g., `COMI.CA`).

#### 129. Alert Rule
*   **TERM (English):** Alert Rule
*   **TERM (Arabic):** قاعدة شرط التنبيه
*   **DEFINITION:** A machine-evaluated condition configuration specifying an Instrument/Portfolio metric, a comparison operator, and a threshold value (e.g., Price > 150 EGP).
*   **SCOPE IN TRADEORA:** Evaluated by Alert Notification Service to trigger user Notifications upon fulfillment.
*   **IDENTIFIER CONVENTION:** Code/DB: `AlertRule` | API: `alertRuleId`, `thresholdValue` | Event: `ALERT_CONDITION_FULFILLED`
*   **RELATED TERMS:** `Notification`, `PriceAlert`, `RiskAlert`
*   **FORBIDDEN SYNONYMS:** Trigger-Config, Condition-Rule
*   **EGX CONTEXT:** Triggers when EGX stock crosses user target price.

#### 130. Notification
*   **TERM (English):** Notification
*   **TERM (Arabic):** إشعار مستخدم
*   **DEFINITION:** A formatted message payload dispatched to a user device across push, email, or in-app channels upon the fulfillment of an Alert Rule or system event.
*   **SCOPE IN TRADEORA:** Value Object managed by Alert and Notification Domain.
*   **IDENTIFIER CONVENTION:** Code/DB: `Notification` | API: `notificationId`, `channel` | Event: `NOTIFICATION_DISPATCHED`
*   **RELATED TERMS:** `AlertRule`, `PushNotification`, `UserProfile`
*   **FORBIDDEN SYNONYMS:** Message, Push-Notice, Warning-Pop
*   **EGX CONTEXT:** Delivered in Arabic or English with RTL formatting support.

---

### 3.9 Strategy and Backtesting

#### 131. Strategy
*   **TERM (English):** Strategy
*   **TERM (Arabic):** استراتيجية استثمارية
*   **DEFINITION:** A high-level quantitative methodology combining indicator parameter rules, risk limits, asset allocation weights, and rebalancing logic to achieve an investment objective.
*   **SCOPE IN TRADEORA:** Executed in historical Backtest simulations and evaluated by Strategy Evaluation Service.
*   **IDENTIFIER CONVENTION:** Code/DB: `Strategy` | API: `strategyId`, `strategyName`
*   **RELATED TERMS:** `Backtest`, `RuleBasedStrategy`, `AISignal`
*   **FORBIDDEN SYNONYMS:** Algorithm (as alias), System-Plan, Model-Method
*   **EGX CONTEXT:** Incorporates EGX market rules, settlement delays, and fee structures.

#### 132. Backtest
*   **TERM (English):** Backtest
*   **TERM (Arabic):** اختبار تاريخي للاستراتيجية (باكتيست)
*   **DEFINITION:** A simulation analysis executing a Strategy against historical market price series, adjusting for corporate actions, bid-ask spreads, and transaction fee drag.
*   **SCOPE IN TRADEORA:** Aggregate root (`BacktestRun`) in Strategy Domain; computes CAGR, Maximum Drawdown, Win Rate, and Sharpe ratio.
*   **IDENTIFIER CONVENTION:** Code/DB: `BacktestRun` | API: `backtestId`, `cagr`, `maxDrawdown` | Event: `BACKTEST_COMPLETED`
*   **RELATED TERMS:** `Strategy`, `HistoricalSimulation`, `Overfitting`
*   **FORBIDDEN SYNONYMS:** Historical-Run, Strategy-Test
*   **EGX CONTEXT:** Simulates strategy performance on EGX30 multi-year price histories without look-ahead bias (Constitution Business Rule 40).

#### 133. Win Rate
*   **TERM (English):** Win Rate
*   **TERM (Arabic):** نسبة الصفقات الرابحة
*   **DEFINITION:** The percentage proportion of closed trades generated by a Backtest or strategy that resulted in a positive net realized gain, calculated as `(Winning Trades / Total Trades) * 100`.
*   **SCOPE IN TRADEORA:** Core quantitative output in strategy evaluation reports.
*   **IDENTIFIER CONVENTION:** Code/DB: `WinRate` | API: `winRatePercentage`
*   **RELATED TERMS:** `Backtest`, `TradeLog`, `CAGR`
*   **FORBIDDEN SYNONYMS:** Success-Ratio, Profit-Trade-%
*   **EGX CONTEXT:** Evaluates trading strategy reliability on EGX assets.

#### 134. CAGR (Compound Annual Growth Rate)
*   **TERM (English):** CAGR (Compound Annual Growth Rate)
*   **TERM (Arabic):** معدل النمو السنوي المركب (CAGR)
*   **DEFINITION:** The annualized mean compounding rate of return earned by an investment or strategy over a multi-year period longer than 1 year.
*   **SCOPE IN TRADEORA:** Primary long-term performance return metric in Backtest results and multi-year portfolio performance reports.
*   **IDENTIFIER CONVENTION:** Code/DB: `CAGR` | API: `cagrPercentage`
*   **RELATED TERMS:** `Backtest`, `TotalReturn`, `TWR`
*   **FORBIDDEN SYNONYMS:** Annualized-Return-Compounded, Mean-Yearly-Gain
*   **EGX CONTEXT:** Evaluates long-term wealth growth relative to Egyptian inflation.

#### 135. Overfitting (Business Prevention Definition)
*   **TERM (English):** Overfitting
*   **TERM (Arabic):** الإفراط في التوفيق (التلاؤم الزائف)
*   **DEFINITION:** A quantitative flaw where a strategy's parameters are excessively tuned to historical market noise, producing illusionary high backtest returns that fail in out-of-sample live trading.
*   **SCOPE IN TRADEORA:** Mitigated by Strategy Evaluation Service using out-of-sample simulation testing and parameter sensitivity analysis.
*   **IDENTIFIER CONVENTION:** Code/Metric: `overfittingRiskScore`
*   **RELATED TERMS:** `Backtest`, `Strategy`, `InSample`
*   **FORBIDDEN SYNONYMS:** Curve-Fitting, Data-Mining-Bias
*   **EGX CONTEXT:** Warns active traders against over-optimizing EGX technical parameters.

---

### 3.10 User, Identity, and Entitlement

#### 136. UserProfile
*   **TERM (English):** UserProfile
*   **TERM (Arabic):** ملف المستخدم
*   **DEFINITION:** The authoritative domain record of a registered user's identity, preferences, RiskProfile reference, locale configurations, and platform settings.
*   **SCOPE IN TRADEORA:** Aggregate root owned by User and Identity Domain; owns Portfolios, Watchlists, and Subscription links.
*   **IDENTIFIER CONVENTION:** Code/DB: `UserProfile` | API: `userProfileId`, `email` | Event: `USER_REGISTERED`
*   **RELATED TERMS:** `Account`, `RiskProfile`, `Subscription`, `Locale`
*   **FORBIDDEN SYNONYMS:** User (as class name), Investor, Client, Customer
*   **EGX CONTEXT:** Captures Egyptian investor profile preferences, locale, and tax residency.

#### 137. Subscription
*   **TERM (English):** Subscription
*   **TERM (Arabic):** اشتراك الخدمات
*   **DEFINITION:** The commercial entitlement record binding a UserProfile to an active SubscriptionTier (Basic, Professional, Enterprise) and enforcing feature access limits and API quotas.
*   **SCOPE IN TRADEORA:** Aggregate root in Subscription & Entitlement Domain; manages billing cycles, payment processing, and entitlements.
*   **IDENTIFIER CONVENTION:** Code/DB: `Subscription` | API: `subscriptionId`, `tierCode` | Event: `SUBSCRIPTION_CHANGED`
*   **RELATED TERMS:** `SubscriptionTier`, `Entitlement`, `UserProfile`
*   **FORBIDDEN SYNONYMS:** Plan, License, Package, Membership
*   **EGX CONTEXT:** Processed in EGP, USD, or regional currencies with local VAT handling.

#### 138. Entitlement
*   **TERM (English):** Entitlement
*   **TERM (Arabic):** صلاحية الاستخدام والوصول
*   **DEFINITION:** An explicit permission token or quota limit granting access to specific platform capabilities, market data feeds (real-time vs. delayed), or API throughput limits.
*   **SCOPE IN TRADEORA:** Enforced at platform API gateways by Subscription & Entitlement Domain.
*   **IDENTIFIER CONVENTION:** Code/DB: `Entitlement` | API: `entitlementCode`, `isGranted`
*   **RELATED TERMS:** `Subscription`, `FeatureAccess`, `APIQuota`
*   **FORBIDDEN SYNONYMS:** Access-Right, Permission-Flag
*   **EGX CONTEXT:** Gates access to EGX real-time level 2 quote streams.

#### 139. AuditLog
*   **TERM (English):** AuditLog
*   **TERM (Arabic):** سجل التدقيق غير القابل للتعديل
*   **DEFINITION:** An immutable, tamper-evident record capturing every critical system event, user action, administrative override, parameter change, and AI recommendation payload with microsecond timestamps and correlation tokens.
*   **SCOPE IN TRADEORA:** Owned by Administration & Audit Domain; retained for a minimum of 7 years to satisfy regulatory compliance (Constitution Principle 40).
*   **IDENTIFIER CONVENTION:** Code/DB: `AuditEntry` | API: `auditLogId`, `actorId` | Event: `AUDIT_LOG_RECORDED`
*   **RELATED TERMS:** `ComplianceOfficer`, `ImmutableLog`, `UserProfile`
*   **FORBIDDEN SYNONYMS:** System-Log, Trace-History, Event-Record
*   **EGX CONTEXT:** Subject to inspection by Financial Regulatory Authority (FRA) auditors.

---

### 3.11 EGX and MENA-Specific Terms

#### 140. EGX (Egyptian Exchange)
*   **TERM (English):** EGX (Egyptian Exchange)
*   **TERM (Arabic):** البورصة المصرية
*   **DEFINITION:** The primary securities exchange of Egypt, operating markets for equities, bonds, Sukuk, and ETFs under the regulation of the Financial Regulatory Authority (FRA).
*   **SCOPE IN TRADEORA:** First operational launch market venue in Tradeora Phase 1 deployment.
*   **IDENTIFIER CONVENTION:** Code/Enum: `ExchangeMic.XCAI` | Ticker Suffix: `.CA`
*   **RELATED TERMS:** `Exchange`, `FRA`, `EGP`, `EGX30`
*   **FORBIDDEN SYNONYMS:** Cairo-Stock-Exchange, Cairo-Bourse
*   **EGX CONTEXT:** Operates in Cairo, Egypt. Market Identifier Code (MIC): `XCAI`.

#### 141. FRA (Financial Regulatory Authority)
*   **TERM (English):** FRA (Financial Regulatory Authority)
*   **TERM (Arabic):** الهيئة العامة للرقابة المالية
*   **DEFINITION:** The public regulatory body in Egypt governing and supervising non-banking financial markets and instruments, including the Egyptian Exchange.
*   **SCOPE IN TRADEORA:** Authoritative regulatory framework defining compliance, non-custodial boundaries, data privacy, and advisory disclaimers for EGX operation.
*   **IDENTIFIER CONVENTION:** Code/Domain: `FRA` | Disclosure Note: `FRA_COMPLIANT_DISCLAIMER`
*   **RELATED TERMS:** `EGX`, `ComplianceOfficer`, `AuditLog`
*   **FORBIDDEN SYNONYMS:** Egyptian-SEC, Financial-Authority-Cairo
*   **EGX CONTEXT:** Governing authority for all Tradeora Egyptian operations.

#### 142. EGP (Egyptian Pound)
*   **TERM (English):** EGP (Egyptian Pound)
*   **TERM (Arabic):** الجنيه المصري
*   **DEFINITION:** The official national currency ISO-4217 code for the Arab Republic of Egypt.
*   **SCOPE IN TRADEORA:** Primary base trading currency for EGX securities and default accounting currency for Egyptian user portfolios.
*   **IDENTIFIER CONVENTION:** Code/ISO: `EGP` | Symbol: `ج.م` or `EGP`
*   **RELATED TERMS:** `BaseCurrency`, `Currency`, `ExchangeRate`
*   **FORBIDDEN SYNONYMS:** Local-Pound, Egyptian-Money, Soft-Pound
*   **EGX CONTEXT:** Used for all EGX domestic stock pricing and dividend payments.

#### 143. MCSD (Misr for Clearing, Settlement and Depository)
*   **TERM (English):** MCSD
*   **TERM (Arabic):** شركة مصر للمقاصة والإيداع والقيد المركزي
*   **DEFINITION:** The central clearinghouse and depository entity in Egypt responsible for clearing, settling, and central registry bookkeeping of security transactions executed on the EGX.
*   **SCOPE IN TRADEORA:** External Organization reference for settlement cycle modeling (`T+2`) and corporate action reconciliation.
*   **IDENTIFIER CONVENTION:** Code/Org: `MCSD`
*   **RELATED TERMS:** `SettlementCycle`, `CorporateAction`, `RecordDate`
*   **FORBIDDEN SYNONYMS:** Egypt-Clearing, Central-Depository-Cairo
*   **EGX CONTEXT:** Sole central depository in Egypt.

#### 144. T+2 Settlement
*   **TERM (English):** T+2 Settlement
*   **TERM (Arabic):** دورة التسوية (T+2)
*   **DEFINITION:** The standard settlement cycle on EGX where the physical transfer of securities ownership and cash payment is officially completed 2 business days after trade execution (`T+0`).
*   **SCOPE IN TRADEORA:** Modeled in Portfolio Domain to track unsettled cash receivables and pending position transfers.
*   **IDENTIFIER CONVENTION:** Code/Enum: `SettlementCycle.T_PLUS_TWO`
*   **RELATED TERMS:** `SettlementCycle`, `Trade`, `MCSD`
*   **FORBIDDEN SYNONYMS:** Two-Day-Clear, Delayed-Settlement
*   **EGX CONTEXT:** Official settlement rule for EGX main market equities.

#### 145. Arabic First (RTL Parity)
*   **TERM (English):** Arabic First (RTL Parity)
*   **TERM (Arabic):** أولوية اللغة العربية والتوافق التام مع الكتابة من اليمين إلى اليسار
*   **DEFINITION:** The mandatory platform architectural commitment treating Modern Standard Arabic (فصحى) and Right-to-Left (RTL) layout rendering as equal, first-class native standards alongside English.
*   **SCOPE IN TRADEORA:** Governed by Constitution Principle 4.15 and Section 7 of this document across all UI screens, reports, charts, and AI model outputs.
*   **IDENTIFIER CONVENTION:** Code/Config: `Locale.AR_EG`, `Direction.RTL`
*   **RELATED TERMS:** `Locale`, `Internationalization`, `GregorianCalendar`
*   **FORBIDDEN SYNONYMS:** Arabic-Translation, RTL-Mode
*   **EGX CONTEXT:** Ensures culturally native experience for Egyptian and Arab investors.

#### 146. Hijri Calendar
*   **TERM (English):** Hijri Calendar
*   **TERM (Arabic):** التقويم الهجري
*   **DEFINITION:** The Islamic lunar calendar system used alongside the Gregorian calendar for regional date displays and Islamic financial reporting.
*   **SCOPE IN TRADEORA:** Supported as a secondary dynamic user locale selection for date rendering.
*   **IDENTIFIER CONVENTION:** Code/Enum: `CalendarSystem.HIJRI`
*   **RELATED TERMS:** `GregorianCalendar`, `Locale`, `Zakat`
*   **FORBIDDEN SYNONYMS:** Lunar-Calendar, Islamic-Date
*   **EGX CONTEXT:** Used for reporting and determining Islamic holiday market closures.

#### 147. Zakat (Portfolio Reporting Context)
*   **TERM (English):** Zakat
*   **TERM (Arabic):** زكاة المال للمحفظة الاستثمارية
*   **DEFINITION:** The mandatory Islamic wealth distribution calculation (typically 2.5% of eligible net zakatability assets held for a lunar year) provided as an informational portfolio reporting tool.
*   **SCOPE IN TRADEORA:** Optional informational calculator feature in Portfolio Reporting Domain for Shariah-conscious investors.
*   **IDENTIFIER CONVENTION:** Code/DB: `ZakatCalculator` | API: `zakatEstimatedAmount`
*   **RELATED TERMS:** `Portfolio`, `IslamicFinanceInstrument`, `HijriCalendar`
*   **FORBIDDEN SYNONYMS:** Islamic-Tax, Wealth-Tithes
*   **EGX CONTEXT:** Popular feature for Egyptian and GCC Islamic investors.

#### 148. Shariah-Compliant Instrument
*   **TERM (English):** Shariah-Compliant Instrument
*   **TERM (Arabic):** أداة مالية متوافقة مع الشريعة الإسلامية
*   **DEFINITION:** A listed security that satisfies established Islamic financial screening criteria (prohibition of Riba/interest, leverage caps < 33%, business sector purity screening).
*   **SCOPE IN TRADEORA:** Filter tag applied in Security Master and Screening Service based on official Shariah board index inclusions.
*   **IDENTIFIER CONVENTION:** Code/DB: `ShariahCompliance` | API: `isShariahCompliant`
*   **RELATED TERMS:** `Sukuk`, `DebtToEquity`, `EGX`
*   **FORBIDDEN SYNONYMS:** Halal-Stock, Islamic-Share
*   **EGX CONTEXT:** Aligned with official EGX Shariah Index constituents.

#### 149. TADAWUL (Saudi Exchange)
*   **TERM (English):** TADAWUL (Saudi Exchange)
*   **TERM (Arabic):** تداول - السوق المالية السعودية
*   **DEFINITION:** The principal stock exchange of the Kingdom of Saudi Arabia, operating under the Capital Market Authority (CMA).
*   **SCOPE IN TRADEORA:** Secondary expansion market covered in Phase 2 MENA rollout.
*   **IDENTIFIER CONVENTION:** Code/Enum: `ExchangeMic.XSAU` | Currency: `SAR`
*   **RELATED TERMS:** `Exchange`, `MENA`, `GCC`
*   **FORBIDDEN SYNONYMS:** Saudi-Stock-Exchange, Riyadh-Bourse
*   **EGX CONTEXT:** Key regional market for cross-border MENA portfolio tracking.

#### 150. DFM (Dubai Financial Market)
*   **TERM (English):** DFM (Dubai Financial Market)
*   **TERM (Arabic):** سوق دبي المالي
*   **DEFINITION:** A primary stock exchange operating in Dubai, United Arab Emirates, governed by the Securities and Commodities Authority (SCA).
*   **SCOPE IN TRADEORA:** Phase 2 expansion exchange for MENA equity and REIT coverage.
*   **IDENTIFIER CONVENTION:** Code/Enum: `ExchangeMic.XDFM` | Currency: `AED`
*   **RELATED TERMS:** `Exchange`, `ADX`, `MENA`
*   **FORBIDDEN SYNONYMS:** Dubai-Bourse, DFM-Market
*   **EGX CONTEXT:** Regional market for Arab investors.

---

## SECTION 4 — EVENT NAMING STANDARD

Domain Events are first-class architectural artifacts in Tradeora. State changes across all microservices and Bounded Contexts are published to the event bus using explicit, non-ambiguous event names.

### 4.1 Naming Pattern
All Domain Event names MUST strictly conform to the following format:

`DOMAIN_SUBJECT_VERB_PAST_TENSE`

*   **DOMAIN:** The Bounded Context owning the event (e.g., `MARKET_DATA`, `PORTFOLIO`, `RISK`, `AI`, `USER`).
*   **SUBJECT:** The Aggregate Root or Entity initiating the event (e.g., `PRICE_TICK`, `POSITION`, `RECOMMENDATION`).
*   **VERB_PAST_TENSE:** The state change action that occurred in past tense (e.g., `RECEIVED`, `CALCULATED`, `RELEASED`, `BREACHED`).

Examples:
*   `MARKET_DATA_PRICE_TICK_RECEIVED`
*   `FINANCIAL_RESEARCH_EARNINGS_REPORT_RELEASED`
*   `RISK_THRESHOLD_BREACH_DETECTED`
*   `AI_RECOMMENDATION_SYNTHESIZED`
*   `USER_ACCOUNT_REGISTERED`

### 4.2 Complete Event Registry

The table below records every canonical domain event established in `BUSINESS_DOMAIN_DISCOVERY.md` Section 12 and derived from business processes and objects.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                 CANONICAL EVENT REGISTRY                                               │
├─────────────────────────────────────────────┬──────────────────────────────────────┬──────────────────┬────────────────┤
│ CANONICAL EVENT NAME (SCREAMING_SNAKE)      │ ARABIC BUSINESS MEANING (ONE SENTENCE)│ OWNING DOMAIN    │ FORBIDDEN ALIAS│
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ MARKET_DATA_PRICE_TICK_RECEIVED             │ تم استلام صفقة تداول جديدة أو تحديث  │ Market Data      │ PRICE_UPDATED, │
│                                             │ للأسعار لحظياً من البورصة.           │                  │ TICK_IN        │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ MARKET_DATA_EOD_PRICES_PUBLISHED            │ تم نشر أسعار الإغلاق الرسمية اليومية │ Market Data      │ EOD_DONE,      │
│                                             │ المعتمدة وإعادة التقييم.             │                  │ CLOSE_PRICES   │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ MARKET_SESSION_STATE_CHANGED                │ تغيرت حالة جلسة التداول في البورصة   │ Market Calendar  │ SESSION_CHANGE,│
│                                             │ (افتتاح، جلسة مستمرة، إغلاق).        │                  │ MARKET_STATUS  │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ CORPORATE_ACTION_ANNOUNCED                  │ تم تسجيل الإعلان عن إجراء شركة جديد  │ Market Data      │ EVENT_ADDED,   │
│                                             │ (توزيعات أو تجزئة).                  │                  │ ACTION_NEW     │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ CORPORATE_ACTION_PROCESSED                  │ تم تنفيذ وتطبيق إجراء الشركة على     │ Market Data      │ SPLIT_DONE,    │
│                                             │ الأسعار التاريخية والمحافظ.          │                  │ ACTION_EXEC    │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ FINANCIAL_STATEMENT_PROCESSED               │ تم استخراج وتنميط القوائم المالية    │ Financial Research│ STMT_READ,     │
│                                             │ الجديدة للشركة.                      │                  │ BALANCE_PARSED │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ EARNINGS_REPORT_RELEASED                    │ تم صدور تقرير الأرباح الربع سنوي     │ Financial Research│ EARNINGS_IN,   │
│                                             │ واستخراج مفاجأة الأرباح.             │                  │ EPS_RELEASED   │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ NEWS_ITEM_TAGGED                            │ تم تحليل وتنقية خبر مالي جديد وتحديده│ Financial Research│ NEWS_ARRIVED,  │
│                                             │ بالأصول المرتبطة.                    │                  │ ARTICLE_TAG    │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ SENTIMENT_SCORE_CALCULATED                  │ تم حساب درجة الانطباع المعنوي للأخبار│ Financial Research│ SENTIMENT_DONE,│
│                                             │ والوسائل الإعلامية.                  │                  │ TONE_CHECKED   │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ AI_SIGNAL_DETECTED                          │ تم اكتشاف إشارة كمية جديدة بواسطة    │ AI Intelligence  │ SIGNAL_FOUND,  │
│                                             │ خوارزميات التحليل.                   │                  │ PATTERN_ALERT  │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ AI_RECOMMENDATION_SYNTHESIZED               │ تم توليد توصية استثمارية جديدة شخصية │ AI Intelligence  │ REC_CREATED,   │
│                                             │ ومفسرة للمستخدم.                     │                  │ ADVICE_GEN     │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ RISK_PROFILE_CALCULATED                     │ تم تحديث حساب درجة ملف مخاطر         │ Risk Domain      │ PROFILE_SET,   │
│                                             │ المستثمر وتصنيفه.                    │                  │ RISK_EVAL      │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ RISK_THRESHOLD_BREACH_DETECTED              │ تم اكتشاف تجاوز أحد حدود المخاطر     │ Risk Domain      │ RISK_ALERT,    │
│                                             │ المسموح بها في المحفظة.              │                  │ VAR_BREACHED   │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ PORTFOLIO_VALUE_CHANGED                     │ تغيرت قيمة صافي أصول المحفظة نتيجة   │ Portfolio        │ NAV_UPDATED,   │
│                                             │ حركة الأسعار أو الصفقات.             │                  │ PORT_CALC      │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ PORTFOLIO_POSITION_UPDATED                  │ تم تعديل كمية أو تكلفة مركز استثماري │ Portfolio        │ HOLDING_CHANGE,│
│                                             │ في المحفظة.                          │                  │ POS_EDITED     │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ PORTFOLIO_REBALANCE_PROPOSED                │ تم بناء مقترح إعادة توازن المحفظة    │ Portfolio        │ REBAL_PLAN,    │
│                                             │ لتقليل الانحراف.                     │                  │ TARGET_WEIGHTS │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ ALERT_CONDITION_FULFILLED                   │ تحققت شروط التنبيه المحدد بواسطة     │ Alert & Notice   │ TRIGGER_FIRED, │
│                                             │ المستخدم أو النظام.                  │                  │ ALERT_ON       │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ NOTIFICATION_DISPATCHED                     │ تم إرسال إشعار للمستخدم عبر بروتوكولات│ Alert & Notice   │ PUSH_SENT,     │
│                                             │ الإرسال المحددة.                     │                  │ MSG_DISPATCHED │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ USER_ACCOUNT_REGISTERED                     │ تم إنشاء وتسجيل حساب جديد للمستخدم   │ User & Identity  │ USER_NEW,      │
│                                             │ على المنصة.                          │                  │ SIGNUP_DONE    │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ SUBSCRIPTION_TIER_CHANGED                   │ تم تغيير باقة اشتراك المستخدم أو     │ Subscription     │ PLAN_UPGRADED, │
│                                             │ تجديدها.                             │                  │ TIER_MUTATED   │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ MARKET_CALENDAR_HOLIDAY_UPDATED             │ تم تعديل جدول العطلات الرسمية في     │ Market Calendar  │ HOLIDAY_SET,   │
│                                             │ تقويم السوق.                         │                  │ CALENDAR_EDIT  │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ EXCHANGE_RATE_UPDATED                       │ تم تحديث سعر صرف العملات الأجنبية    │ Multi-Currency   │ FX_REFRESHED,  │
│                                             │ لحظياً.                              │                  │ CURRENCY_CHANGE│
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ AUDIT_LOG_RECORDED                          │ تم تسجيل حركة تدقيق سريّة جديدة غير  │ Admin & Audit    │ LOG_SAVED,     │
│                                             │ قابلة للتعديل.                       │                  │ TRACE_STORED   │
├─────────────────────────────────────────────┼──────────────────────────────────────┼──────────────────┼────────────────┤
│ DATA_FEED_INTERRUPTED                       │ تم اكتشاف انقطاع تدفق البيانات من    │ Market Data      │ FEED_DOWN,     │
│                                             │ المورد الرئيسي.                      │                  │ STREAM_LOST    │
└─────────────────────────────────────────────┴──────────────────────────────────────┴──────────────────┴────────────────┘
```

---

## SECTION 5 — AGGREGATE AND ENTITY NAMING STANDARD

### 5.1 Naming Rules
Aggregates, Entities, and Value Objects in Tradeora codebases MUST strictly comply with the following structural rules:

1.  **PascalCase:** Every class, interface, struct, and type name MUST use strict PascalCase (e.g., `Portfolio`, `MarketSession`).
2.  **No Abbreviations:** Abbreviations are forbidden in domain class names, even if common (e.g., `FinancialStatement`, NOT `FinStmt`; `InternationalSecuritiesIdentificationNumber`, NOT `IsinCode` for class types; Value Object types use explicit naming).
3.  **No Generic Names:** Class names MUST NOT contain generic, non-domain suffixes such as `Manager`, `Handler`, `Helper`, `Processor`, `Data`, `Info`, or `Object`.
4.  **No Database-Influenced Names:** Class names MUST reflect core business concepts, NOT database storage mechanisms (e.g., `Portfolio`, NOT `PortfolioTable` or `PortfolioRow`).
5.  **Single & Plural Clarity:** Aggregate types use singular nouns (`Portfolio`). Collections use clear domain plural names (`PositionCollection` or `List<Position>`).

### 5.2 Canonical Aggregate Names

The table below lists all authoritative Aggregate Roots established in the domain model and explains why each specific name was selected over alternative options.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CANONICAL AGGREGATE ROOTS                                         │
├───────────────────────┬───────────────────────────────────┬─────────────────────────────────────────────┤
│ CANONICAL AGGREGATE   │ OWNING BOUNDED CONTEXT            │ RATIONALE & REJECTED ALTERNATIVES           │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ Instrument            │ Market Data Domain                │ Represents tradable market contract.        │
│                       │                                   │ Rejected: Security (too broad), Stock (equity│
│                       │                                   │ only), Ticker (string value).               │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ Portfolio             │ Portfolio Domain                  │ Authoritative ledger of user positions.     │
│                       │                                   │ Rejected: Account (identity), Wallet (cash),│
│                       │                                   │ Holdings (collection only).                 │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ Position              │ Portfolio Domain                  │ Individual instrument holding within        │
│                       │                                   │ portfolio. Rejected: Holding, Lot (sub-unit)│
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ Recommendation        │ AI Intelligence Domain            │ Personalized explainable investment advice  │
│                       │                                   │ proposal. Rejected: Signal (unsuited),      │
│                       │                                   │ Tip (prohibited), Advice (informal).        │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ RiskProfile           │ Risk Domain                       │ User risk capacity and limit boundaries.    │
│                       │                                   │ Rejected: UserRisk (non-aggregate),         │
│                       │                                   │ RiskCategory (value object).                │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ AlertRule             │ Alert & Notification Domain       │ Rule configuration governing triggers.      │
│                       │                                   │ Rejected: Alert (confuses rule & notice),   │
│                       │                                   │ Trigger (too technical).                    │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ UserProfile           │ User & Identity Domain            │ Authoritative domain user identity.         │
│                       │                                   │ Rejected: User (generic entity), Client,    │
│                       │                                   │ Investor (role description).                │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ Subscription          │ Subscription & Entitlement Domain │ Commercial entitlement access record.       │
│                       │                                   │ Rejected: Plan (billing only), Tier (value  │
│                       │                                   │ object), License (software term).           │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ BacktestRun           │ Strategy Domain                   │ Single historical strategy simulation run.  │
│                       │                                   │ Rejected: Backtest (verb/ambiguous),        │
│                       │                                   │ Simulation (too generic).                   │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ Watchlist             │ User & Identity Domain            │ User-defined list of monitored instruments. │
│                       │                                   │ Rejected: List (generic), Favorites (UI),   │
│                       │                                   │ Tracker (ambiguous).                        │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ AuditEntry            │ Admin & Audit Domain              │ Immutable log record of system action.      │
│                       │                                   │ Rejected: AuditLog (collection), Trace,     │
│                       │                                   │ HistoryItem (ambiguous).                    │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ MarketSession         │ Market Calendar Domain            │ Official operational trading session phase. │
│                       │                                   │ Rejected: Session (auth collision), Period, │
│                       │                                   │ Window (non-domain).                        │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ CorporateAction       │ Market Data Domain                │ Official binding corporate modification.    │
│                       │                                   │ Rejected: Event (domain event collision),   │
│                       │                                   │ Adjustment (too narrow).                    │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ EarningsReport        │ Financial Research Domain         │ Quarterly corporate financial disclosure.   │
│                       │                                   │ Rejected: QuarterlyReport (too narrow),     │
│                       │                                   │ Release (ambiguous).                        │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ FinancialStatement    │ Financial Research Domain         │ Normalized accounting financial report.     │
│                       │                                   │ Rejected: Statement (generic), Accounting   │
│                       │                                   │ Filing (raw doc).                           │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ ResearchReport        │ Financial Research Domain         │ Formal equity research analytical document. │
│                       │                                   │ Rejected: AnalysisDoc, Study, Brief.        │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────────────────┤
│ MarketBrief           │ Financial Research Domain         │ Synthesized daily market summary brief.     │
│                       │                                   │ Rejected: DailyBrief, MorningNote.          │
└───────────────────────┴───────────────────────────────────┴─────────────────────────────────────────────┘
```

---

## SECTION 6 — API FIELD NAMING STANDARD

### 6.1 General Rules
API interfaces across REST, gRPC, and GraphQL MUST directly mirror the Ubiquitous Language.

1.  **camelCase in JSON:** All JSON field names in API requests and responses MUST use camelCase (e.g., `netAssetValue`, `tickerSymbol`).
2.  **snake_case in DB:** All database table names, column names, and migration files MUST use snake_case (e.g., `net_asset_value`, `ticker_symbol`).
3.  **No Unapproved Abbreviations:** Field names MUST be written in full unless the abbreviation is explicitly listed in Section 6.2.
4.  **No Generic Field Names:** Fields named `data`, `info`, `obj`, `val`, `temp`, or `item` are strictly forbidden.

### 6.2 Pre-Approved Abbreviations List
The following 15 abbreviations are the **ONLY** permitted abbreviations across APIs, database columns, and code variables:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PRE-APPROVED ABBREVIATIONS                                │
├──────────────┬───────────────────────────────────────────┬─────────────────────────────┤
│ ABBREVIATION │ FULL DOMAIN EXPANSION                     │ API FIELD EXAMPLE (camelCase)│
├──────────────┼───────────────────────────────────────────┼─────────────────────────────┤
│ nav          │ netAssetValue                             │ netAssetValue               │
│ vwap         │ volumeWeightedAveragePrice                │ vwap                        │
│ pe           │ priceToEarnings                           │ priceToEarningsRatio        │
│ pb           │ priceToBook                               │ priceToBookRatio            │
│ eps          │ earningsPerShare                          │ earningsPerShare            │
│ var          │ valueAtRisk                               │ valueAtRiskAmount           │
│ cvar         │ conditionalValueAtRisk                    │ conditionalValueAtRiskAmount│
│ twr          │ timeWeightedReturn                        │ timeWeightedReturn          │
│ mwr          │ moneyWeightedReturn                       │ moneyWeightedReturn         │
│ ytd          │ yearToDate                                │ yearToDateReturn            │
│ eod          │ endOfDay                                  │ endOfDayClosePrice          │
│ isin         │ internationalSecuritiesIdentificationNumber│ isinCode                    │
│ cagr         │ compoundAnnualGrowthRate                  │ cagrPercentage              │
│ ohlcv        │ openHighLowCloseVolume                    │ ohlcvSeries                 │
│ fx           │ foreignExchange                           │ fxGainLoss                  │
└──────────────┴───────────────────────────────────────────┴─────────────────────────────┘
```

### 6.3 Forbidden Abbreviations
The following abbreviations MUST NEVER appear in code, database schemas, or API contracts:

*   `acc` (Use `account` or `accountNumber`)
*   `amt` (Use `amount`)
*   `calc` (Use `calculation` or `calculate`)
*   `cat` (Use `category`)
*   `cfg` / `config` (Use `configuration`)
*   `curr` (Use `currency`)
*   `desc` (Use `description`)
*   `doc` (Use `document`)
*   `id` (Allowed ONLY as suffix, e.g., `portfolioId`; never standalone `id` without context in domain models)
*   `info` (Forbidden; use specific domain attribute name)
*   `msg` (Use `message`)
*   `num` (Use `number`)
*   `obj` (Forbidden)
*   `pct` (Use `percentage`)
*   `pos` (Use `position`)
*   `qty` (Use `quantity`)
*   `rec` (Use `recommendation`)
*   `sec` (Use `security` or `seconds`)
*   `stat` (Use `status` or `statistics`)
*   `val` (Forbidden; use `value` or `amount`)

---

## SECTION 7 — ARABIC LANGUAGE STANDARD

Tradeora is built **Arabic-First**. Arabic terminology is not a secondary translation footnote—it carries equal authority to canonical English names.

### 7.1 Arabic Term Registry Governance
1.  **Modern Standard Arabic (فصحى):** All canonical Arabic names, user interface copy, AI explanations, and financial reports MUST use formal Modern Standard Arabic (فصحى). Colloquial Egyptian Arabic (عامية) is strictly forbidden in technical registries, domain models, and official financial copy.
2.  **Equal Authority:** When an Arabic term is defined in Section 3, it is the binding canonical name for all Arabic UI screens and NLP models.
3.  **Transliteration Rules:** When a modern quantitative finance term has no standard Arabic equivalent, the documented adopted transliteration MUST be used consistently across the platform (e.g., `فواب` for VWAP, `باكتيست` for Backtest).
4.  **Islamic Finance Terms:** Islamic finance instruments MUST use established Shariah finance vocabulary (e.g., `صكوك`, `أرباح مجانية`, `زكاة المال`).

### 7.2 Directional Formatting Rules

#### 7.2.1 Right-to-Left (RTL) Layout Rules
*   UI layouts in Arabic mode MUST render natively in Right-to-Left (RTL).
*   Navigation headers, text alignment, button flows, and table column orders MUST mirror seamlessly without breaking visual hierarchy.

#### 7.2.2 Numeric Formatting Rules
*   **Numbers are ALWAYS Left-to-Right (LTR):** Even within RTL Arabic text sentences, financial numbers, prices, tickers, and percentages MUST be rendered LTR (e.g., `150.50 ج.م` or `EGP 150.50`).
*   **Western Arabic Numerals (`123`):** Financial data tables, charts, and technical indicators MUST use Western Arabic numerals (`123`) by default for mathematical clarity, while allowing dynamic user locale switching to Eastern Arabic numerals (`١٢٣`) if selected in preferences.

#### 7.2.3 Currency and Date Formatting
*   **Currency Display:** EGP amounts in Arabic UI MUST be formatted as `[NUMBER] ج.م` (e.g., `1,250.75 ج.م`).
*   **Date Display:** Standard display uses Gregorian calendar primary format (`21 يوليو 2026`). Secondary Hijri calendar format (`5 صفر 1448 هـ`) MUST be rendered when selected in user locale settings.
*   **Percentages and Decimals:** Percentage values MUST be formatted with explicit decimal precision (e.g., `% 12.50+` or `+12.50%`).

---

## SECTION 8 — DOMAIN LANGUAGE MATRIX

The matrix below maps canonical terms across every software layer to guarantee zero divergence between product specs, domain logic, APIs, databases, domain events, UI labels, and Bounded Contexts.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                      DOMAIN LANGUAGE MATRIX                                                                     │
├────────────────────┬─────────────────┬─────────────────────────────┬─────────────────────────────┬────────────────────────────────┬──────────────┬──────────────┬───────────────┬──────────────────┤
│ CANONICAL TERM     │ BUSINESS LAYER  │ API FIELD (camelCase)       │ DB COLUMN (snake_case)      │ EVENT NAME (SCREAMING_SNAKE)   │ UI LABEL(EN) │ UI LABEL(AR) │ AGGREGATE     │ BOUNDED CONTEXT  │
├────────────────────┼─────────────────┼─────────────────────────────┼─────────────────────────────┼────────────────────────────────┼──────────────┼──────────────┼───────────────┼──────────────────┤
│ Instrument         │ Instrument      │ instrumentId                │ instrument_id               │ INSTRUMENT_UPDATED             │ Instrument   │ أداة مالية   │ Instrument    │ Market Data      │
│ Asset              │ Asset           │ assetId                     │ asset_id                    │ ASSET_CREATED                  │ Asset        │ أصل مالي     │ Instrument    │ Market Data      │
│ SecurityMaster     │ SecurityMaster  │ securityMasterId            │ security_master_id          │ SECURITY_MASTER_UPDATED        │ Sec Master   │ سجل الأوراق  │ Instrument    │ Market Data      │
│ Exchange           │ Exchange        │ micCode                     │ mic_code                    │ EXCHANGE_REGISTERED            │ Exchange     │ بورصة        │ Instrument    │ Market Data      │
│ MarketSession      │ MarketSession   │ sessionStatus               │ session_status              │ MARKET_SESSION_STATE_CHANGED   │ Session      │ جلسة التداول │ MarketSession │ Market Calendar  │
│ MarketCalendar     │ MarketCalendar  │ calendarId                  │ calendar_id                 │ MARKET_CALENDAR_HOLIDAY_UPDATED│ Calendar     │ تقويم السوق  │ MarketSession │ Market Calendar  │
│ Price              │ Price           │ priceAmount                 │ price_amount                │ MARKET_DATA_PRICE_TICK_RECEIVED│ Price        │ السعر        │ Instrument    │ Market Data      │
│ LastPrice          │ LastPrice       │ lastPrice                   │ last_price                  │ MARKET_DATA_PRICE_TICK_RECEIVED│ Last Price   │ آخر سعر      │ Instrument    │ Market Data      │
│ ClosingPrice       │ ClosingPrice    │ closePrice                  │ close_price                 │ MARKET_DATA_EOD_PRICES_PUBLISHED│ Close Price  │ سعر الإغلاق  │ Instrument    │ Market Data      │
│ AdjustedPrice      │ AdjustedPrice   │ adjustedClose               │ adjusted_close              │ CORPORATE_ACTION_PROCESSED     │ Adj Price    │ السعر المعدل │ Instrument    │ Market Data      │
│ OHLCV              │ OHLCV           │ ohlcvSeries                 │ ohlcv_series                │ MARKET_DATA_PRICE_TICK_RECEIVED│ Chart Bar    │ شمعة التداول │ Instrument    │ Market Data      │
│ VWAP               │ VWAP            │ vwap                        │ vwap                        │ MARKET_DATA_PRICE_TICK_RECEIVED│ VWAP         │ فواب         │ Instrument    │ Market Data      │
│ CorporateAction    │ CorporateAction │ corporateActionId           │ corporate_action_id         │ CORPORATE_ACTION_ANNOUNCED     │ Corp Action  │ إجراء الشركات│ CorporateAction│ Market Data     │
│ CashDividend       │ CashDividend    │ cashAmountPerShare          │ cash_amount_per_share       │ CORPORATE_ACTION_ANNOUNCED     │ Cash Dividend│ توزيع نقدي   │ CorporateAction│ Market Data     │
│ StockSplit         │ StockSplit      │ splitRatio                  │ split_ratio                 │ CORPORATE_ACTION_PROCESSED     │ Stock Split  │ تجزئة الأسهم │ CorporateAction│ Market Data     │
│ FinancialStatement │ FinancialStmt   │ statementId                 │ statement_id                │ FINANCIAL_STATEMENT_PROCESSED  │ Financials   │ القوائم المالية│ FinancialStmt│ Financial Research│
│ BalanceSheet       │ BalanceSheet    │ balanceSheet                │ balance_sheet               │ FINANCIAL_STATEMENT_PROCESSED  │ Balance Sheet│ الميزانية    │ FinancialStmt │ Financial Research│
│ IncomeStatement    │ IncomeStatement │ incomeStatement             │ income_statement            │ FINANCIAL_STATEMENT_PROCESSED  │ Income Stmt  │ قائمة الدخل  │ FinancialStmt │ Financial Research│
│ CashFlowStatement  │ CashFlowStmt    │ cashFlowStatement           │ cash_flow_statement        │ FINANCIAL_STATEMENT_PROCESSED  │ Cash Flow    │ التدفقات النقدية│ FinancialStmt│ Financial Research│
│ EarningsReport     │ EarningsReport  │ reportId                    │ report_id                   │ EARNINGS_REPORT_RELEASED       │ Earnings     │ تقرير الأرباح│ EarningsReport│ Financial Research│
│ EarningsSurprise   │ EarningsSurprise│ earningsSurprisePercentage  │ earnings_surprise_percentage│ EARNINGS_REPORT_RELEASED       │ EPS Surprise │ مفاجأة الأرباح│ EarningsReport│ Financial Research│
│ DiscountedCashFlow │ DCFValuation    │ dcfFairValue                │ dcf_fair_value              │ FINANCIAL_STATEMENT_PROCESSED  │ DCF Valuation│ خصم التدفقات │ FinancialStmt │ Financial Research│
│ FairValue          │ FairValue       │ fairValueAmount             │ fair_value_amount           │ FINANCIAL_STATEMENT_PROCESSED  │ Fair Value   │ القيمة العادلة│ FinancialStmt│ Financial Research│
│ SentimentScore     │ SentimentScore  │ polarityScore               │ polarity_score              │ SENTIMENT_SCORE_CALCULATED     │ Sentiment    │ الانطباع     │ FinancialStmt │ Financial Research│
│ ResearchReport     │ ResearchReport  │ reportId                    │ report_id                   │ RESEARCH_REPORT_PUBLISHED      │ Research     │ بحث أسهم     │ ResearchReport│ Financial Research│
│ MarketBrief        │ MarketBrief     │ briefId                     │ brief_id                    │ MARKET_BRIEF_GENERATED         │ Daily Brief  │ موجز السوق   │ MarketBrief   │ Financial Research│
│ AISignal           │ AISignal        │ signalId                    │ signal_id                   │ AI_SIGNAL_DETECTED             │ Signal       │ إشارة كمية   │ AISignal      │ AI Intelligence   │
│ Recommendation     │ Recommendation  │ recommendationId            │ recommendation_id           │ AI_RECOMMENDATION_SYNTHESIZED  │ Insight Rec  │ توصية استثمارية│ Recommendation│ AI Intelligence  │
│ ConfidenceScore    │ ConfidenceScore │ confidenceScorePercentage   │ confidence_score_percentage │ AI_RECOMMENDATION_SYNTHESIZED  │ Confidence   │ درجة الثقة   │ Recommendation│ AI Intelligence   │
│ Portfolio          │ Portfolio       │ portfolioId                 │ portfolio_id                │ PORTFOLIO_VALUE_CHANGED        │ Portfolio    │ محفظة استثمارية│ Portfolio   │ Portfolio Domain  │
│ Position           │ Position        │ positionId                  │ position_id                 │ PORTFOLIO_POSITION_UPDATED     │ Position     │ مركز استثماري│ Portfolio     │ Portfolio Domain  │
│ NetAssetValue      │ NetAssetValue   │ netAssetValue               │ net_asset_value             │ PORTFOLIO_VALUE_CHANGED        │ Portfolio NAV│ صافي الأصول  │ Portfolio     │ Portfolio Domain  │
│ CostBasis          │ CostBasis       │ averageCostBasis            │ average_cost_basis          │ PORTFOLIO_POSITION_UPDATED     │ Avg Cost     │ متوسط الشراء │ Portfolio     │ Portfolio Domain  │
│ RealizedGain       │ RealizedGain    │ realizedGainLoss            │ realized_gain_loss          │ PORTFOLIO_POSITION_UPDATED     │ Realized P&L │ أرباح محققة  │ Portfolio     │ Portfolio Domain  │
│ UnrealizedGain     │ UnrealizedGain  │ unrealizedGainLoss          │ unrealized_gain_loss        │ PORTFOLIO_VALUE_CHANGED        │ Open P&L     │ أرباح غير محققة│ Portfolio    │ Portfolio Domain  │
│ TimeWeightedReturn │ TWR             │ timeWeightedReturn          │ time_weighted_return        │ PORTFOLIO_VALUE_CHANGED        │ TWR Return   │ العائد الموزون│ Portfolio     │ Portfolio Domain  │
│ TargetWeight       │ TargetWeight    │ targetWeight                │ target_weight               │ PORTFOLIO_REBALANCE_PROPOSED   │ Target %     │ الوزن المستهدف│ Portfolio    │ Portfolio Domain  │
│ Rebalancing        │ Rebalancing     │ rebalanceProposalId         │ rebalance_proposal_id       │ PORTFOLIO_REBALANCE_PROPOSED   │ Rebalance    │ إعادة التوازن│ Portfolio     │ Portfolio Domain  │
│ RiskProfile        │ RiskProfile     │ riskProfileId               │ risk_profile_id             │ RISK_PROFILE_CALCULATED        │ Risk Profile │ ملف المخاطر  │ RiskProfile   │ Risk Domain       │
│ ValueAtRisk        │ ValueAtRisk     │ valueAtRiskAmount           │ value_at_risk_amount        │ RISK_THRESHOLD_BREACH_DETECTED │ 1D VaR       │ القيمة المعرضة│ RiskProfile  │ Risk Domain       │
│ RiskAlert          │ RiskAlert       │ riskAlertId                 │ risk_alert_id               │ RISK_THRESHOLD_BREACH_DETECTED │ Risk Alert   │ تنبيه المخاطر│ RiskProfile   │ Risk Domain       │
│ AlertRule          │ AlertRule       │ alertRuleId                 │ alert_rule_id               │ ALERT_CONDITION_FULFILLED      │ Alert Rule   │ قاعدة التنبيه│ AlertRule     │ Alert & Notice    │
│ Notification       │ Notification    │ notificationId              │ notification_id             │ NOTIFICATION_DISPATCHED        │ Notification │ إشعار        │ AlertRule     │ Alert & Notice    │
│ Screen             │ Screen          │ screenId                    │ screen_id                   │ SCREEN_EXECUTED                │ Screener     │ فحص الأسهم   │ Screen        │ Screening Domain  │
│ Watchlist          │ Watchlist       │ watchlistId                 │ watchlist_id                │ WATCHLIST_UPDATED              │ Watchlist    │ قائمة المتابعة│ Watchlist    │ User & Identity   │
│ BacktestRun        │ BacktestRun     │ backtestId                  │ backtest_id                 │ BACKTEST_COMPLETED             │ Backtest     │ اختبار تاريخي│ BacktestRun   │ Strategy Domain   │
│ CAGR               │ CAGR            │ cagrPercentage              │ cagr_percentage             │ BACKTEST_COMPLETED             │ CAGR %       │ النمو المركب │ BacktestRun   │ Strategy Domain   │
│ UserProfile        │ UserProfile     │ userProfileId               │ user_profile_id             │ USER_ACCOUNT_REGISTERED        │ Profile      │ ملف المستخدم  │ UserProfile   │ User & Identity   │
│ Subscription       │ Subscription    │ subscriptionId              │ subscription_id             │ SUBSCRIPTION_TIER_CHANGED      │ Subscription │ اشتراك       │ Subscription  │ Subscription      │
│ AuditEntry         │ AuditEntry      │ auditLogId                  │ audit_log_id                │ AUDIT_LOG_RECORDED             │ Audit Log    │ سجل التدقيق  │ AuditEntry    │ Admin & Audit     │
└────────────────────┴─────────────────┴─────────────────────────────┴─────────────────────────────┴────────────────────────────────┴──────────────┴──────────────┴───────────────┴──────────────────┘
```

---

## SECTION 9 — TERM RELATIONSHIP MAP

The formal relationships governing Tradeora's 20 core concepts are defined below. Developers MUST preserve these structural dependencies in object models, relational foreign keys, and domain services.

### 1. Portfolio & Position
*   `Portfolio` **is composed of** `Position`
*   **EXPLANATION:** A Portfolio is an aggregate root that acts as the parent container for zero or more Position entities. A Position cannot exist independently of a Portfolio. Deleting a Portfolio cascades deletion to its Positions.

### 2. Position & Instrument
*   `Position` **references** `Instrument`
*   **EXPLANATION:** A Position holds a reference to a specific Instrument identifier in the Security Master. A Position does not own the Instrument definition. Multiple Positions across different Portfolios can reference the same Instrument.

### 3. Instrument & Exchange
*   `Instrument` **belongs to** `Exchange`
*   **EXPLANATION:** Every Instrument is listed on a specific Exchange market segment. Market operating hours, tick rules, and settlement cycles are inherited from the Exchange's MarketCalendar.

### 4. Recommendation & UserProfile / RiskProfile
*   `Recommendation` **is synthesized for** `UserProfile` **and depends on** `RiskProfile`
*   **EXPLANATION:** An AI Recommendation is personalized for a specific UserProfile and MUST evaluate that user's active RiskProfile. Synthesizing a recommendation without evaluating the RiskProfile violates regulatory suitability rules (Constitution Principle 11.2).

### 5. AISignal & Recommendation
*   `AISignal` **becomes input for** `Recommendation`
*   **EXPLANATION:** An AISignal is a raw quantitative market setup flag. It transitions into a Recommendation ONLY after being evaluated against a user's RiskProfile and Portfolio holdings by the AI Recommendation Service.

### 6. AlertRule & Notification
*   `AlertRule` **triggers** `Notification`
*   **EXPLANATION:** An AlertRule is a domain evaluation rule. When its condition is met, it emits a domain event that causes the Alert Notification Service to format and dispatch a Notification payload to a user device.

### 7. CorporateAction & Position / Price
*   `CorporateAction` **modifies** `Position` cost basis **and adjusts** historical `Price`
*   **EXPLANATION:** Executing a CorporateAction (e.g., StockSplit) automatically modifies position quantities and average cost bases in Portfolios while generating an AdjustmentFactor to adjust historical Price series backward.

### 8. MarketSession & Price
*   `MarketSession` **governs validity window of** `Price`
*   **EXPLANATION:** Real-time Price ticks are valid for live trading calculations ONLY during Continuous Trading MarketSessions. Ticks received outside session hours are processed for post-close or pre-open auction evaluation.

### 9. FinancialStatement & FairValue
*   `FinancialStatement` **is input to** `FairValue` (DCF Model)
*   **EXPLANATION:** Standardized Balance Sheets, Income Statements, and Cash Flow Statements serve as mandatory historical inputs for FairValue DCF and DDM valuation models.

### 10. EarningsReport & ConsensusEstimate
*   `EarningsReport` **is evaluated against** `ConsensusEstimate`
*   **EXPLANATION:** When an EarningsReport is released, reported EPS and Revenue are compared against ConsensusEstimate figures to calculate the EarningsSurprise metric.

### 11. RiskAlert & ValueAtRisk
*   `RiskAlert` **is triggered by** `ValueAtRisk` breach
*   **EXPLANATION:** When portfolio ValueAtRisk exceeds the maximum risk threshold defined in a user's RiskProfile, the Risk Domain immediately emits a RiskAlert.

### 12. Rebalancing & TargetWeight / ActualWeight
*   `Rebalancing` **realigns** `ActualWeight` **to** `TargetWeight`
*   **EXPLANATION:** The Rebalancing engine compares real-time ActualWeights against strategy TargetWeights to synthesize trade execution proposals that eliminate portfolio Drift.

### 13. BacktestRun & Strategy
*   `BacktestRun` **simulates** `Strategy`
*   **EXPLANATION:** A BacktestRun is an execution instance that applies a Strategy's parameter rules against historical OHLCV price series over a defined simulation period.

### 14. NetAssetValue & Position / CashBalance
*   `NetAssetValue` **is derived from** `Position` market values **and** `CashBalance`
*   **EXPLANATION:** Portfolio NAV is calculated deterministically as `Sum(Position Market Values) + CashBalance - Liabilities` in BaseCurrency.

### 15. TWR & Benchmark
*   `TWR` **is compared against** `Benchmark`
*   **EXPLANATION:** Time-Weighted Return (TWR) is evaluated against a normalized Benchmark index return over identical timeframes to compute excess market return (Alpha).

### 16. WatchlistItem & Instrument
*   `WatchlistItem` **references** `Instrument`
*   **EXPLANATION:** A WatchlistItem holds a reference to an Instrument in the Security Master alongside user-defined price alert targets and notes.

### 17. UserProfile & Subscription
*   `UserProfile` **owns** `Subscription`
*   **EXPLANATION:** A UserProfile maintains an active link to a Subscription record, which determines Entitlement permissions and API quotas.

### 18. AuditEntry & UserProfile / Recommendation
*   `AuditEntry` **records action of** `UserProfile` **or generation of** `Recommendation`
*   **EXPLANATION:** Every critical action performed by a UserProfile or AI engine generates an immutable AuditEntry for compliance auditing.

### 19. MultiCurrencyPortfolio & ExchangeRate
*   `MultiCurrencyPortfolio` **depends on** `ExchangeRate`
*   **EXPLANATION:** Valuing multi-currency holdings in a BaseCurrency requires fetching timestamped ExchangeRates from declared rate sources.

### 20. ConfidenceScore & Recommendation
*   `ConfidenceScore` **is mandatory attribute of** `Recommendation`
*   **EXPLANATION:** Every Recommendation MUST contain a statistical ConfidenceScore. Recommendations with scores < 60% are automatically suppressed.

---

## SECTION 10 — ANTI-PATTERNS AND LANGUAGE VIOLATIONS

Code reviewers, automated linters, and architecture governance boards MUST reject any pull request containing the language violations documented below.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             LANGUAGE ANTI-PATTERNS & VIOLATIONS                                        │
├────┬──────────────────────────────────────────────┬───────────────────────────────┬──────────────────────┬─────────────┤
│ #  │ VIOLATION (WRONG TERM / PHRASE)              │ CORRECT CANONICAL TERM        │ ENFORCEMENT METHOD   │ SEVERITY    │
├────┼──────────────────────────────────────────────┼───────────────────────────────┼──────────────────────┼─────────────┤
│ 1  │ `Security` used for market instrument class  │ `Instrument`                  │ Code Review          │ Blocker     │
│ 2  │ `Stock` used as generic instrument type       │ `Instrument` or `Equity`      │ Code Review          │ Blocker     │
│ 3  │ `Venue` or `Platform` used for exchange      │ `Exchange` or `Market`        │ Code Review          │ Major       │
│ 4  │ `Wallet` or `Fund` used for user portfolio    │ `Portfolio`                   │ Code Review          │ Blocker     │
│ 5  │ `Holding` or `Lot` used for position entity   │ `Position`                    │ Code Review          │ Blocker     │
│ 6  │ `Transaction` or `Deal` used for order fill   │ `Trade` or `Execution`        │ Code Review          │ Blocker     │
│ 7  │ `Tip` or `HotPick` used for AI recommendation │ `Recommendation`              │ Architecture Review  │ Blocker     │
│ 8  │ `Advice` used for AI output                  │ `Recommendation`              │ Code Review          │ Blocker     │
│ 9  │ `Quote` used for stock monetary price         │ `Price`                       │ Code Review          │ Major       │
│ 10 │ `Profit` or `Gain %` used for portfolio TWR   │ `TotalReturn` or `TWR`        │ Code Review          │ Blocker     │
│ 11 │ `Yield` used to describe percentage price return│ `TotalReturn` (Yield = income)│ Code Review         │ Blocker     │
│ 12 │ `Prediction` or `Forecast` used for fair value│ `FairValue`                   │ Architecture Review  │ Blocker     │
│ 13 │ `List` or `Favorites` used for watchlist class│ `Watchlist`                   │ Code Review          │ Major       │
│ 14 │ `Message` or `PushNotice` used for alert rule │ `AlertRule` / `Notification`  │ Code Review          │ Major       │
│ 15 │ `Investor` or `Client` used for user entity   │ `UserProfile`                 │ Code Review          │ Major       │
│ 16 │ `Plan` or `License` used for subscription tier│ `Subscription`                │ Code Review          │ Major       │
│ 17 │ `Period` or `Window` used for market hours    │ `MarketSession`               │ Code Review          │ Major       │
│ 18 │ `Event` used as class name for corp action    │ `CorporateAction`             │ Code Review          │ Blocker     │
│ 19 │ `Probability` or `Rating` used for AI score   │ `ConfidenceScore`             │ Code Review          │ Blocker     │
│ 20 │ `LocalMoney` used instead of explicit currency│ `EGP` or `BaseCurrency`       │ Linter               │ Blocker     │
│ 21 │ Generic class suffixes (`Manager`, `Handler`) │ Explicit Domain Name          │ Code Review          │ Blocker     │
│ 22 │ Unapproved abbreviations (`qty`, `amt`, `pos`)│ Full Domain Term              │ Linter               │ Blocker     │
└────┴──────────────────────────────────────────────┴───────────────────────────────┴──────────────────────┴─────────────┤
```

---

## SECTION 11 — CONTEXT-SPECIFIC LANGUAGE VARIATIONS

Certain terms carry distinct meanings depending on the Bounded Context in which they appear. The registry below documents these variations explicitly to prevent cross-domain integration confusion.

### 1. Price
*   **IN MARKET DATA DOMAIN:** Represents the raw monetary snapshot of an executed trade tick (`LastPrice`) or order book level (`BidPrice`/`AskPrice`) received from an exchange stream.
*   **IN PORTFOLIO DOMAIN:** Represents the verified closing or current market price used to revalue position market values and compute Net Asset Value (NAV).
*   **IN RISK DOMAIN:** Represents a historical time series array used to calculate daily return standard deviations and Value-at-Risk (VaR).
*   **INTEGRATION NOTE:** Portfolio and Risk domains MUST consume normalized `Price` objects emitted by Market Data Domain—never compute ad-hoc prices.

### 2. Return
*   **IN PORTFOLIO DOMAIN:** Refers to Time-Weighted Return (`TWR`) or Money-Weighted Return (`MWR`) measuring overall portfolio capital growth including dividends.
*   **IN PERFORMANCE ATTR. DOMAIN:** Refers to benchmark-relative excess return (`Alpha`) generated by active stock selection versus a market index.
*   **IN INDIVIDUAL POSITION CONTEXT:** Refers to percentage price change `((Current Price - Average Cost) / Average Cost) * 100`.
*   **INTEGRATION NOTE:** API field names MUST specify the exact return type (`twrPercentage`, `alphaPercentage`, `unrealizedReturnPercentage`).

### 3. Alert
*   **IN RISK DOMAIN:** Refers to a `RiskAlert` domain event emitted when a quantitative portfolio threshold (VaR exceedance, concentration limit) is breached.
*   **IN ALERT & NOTIFICATION DOMAIN:** Refers to an `AlertRule` entity configured by a user to trigger device notifications upon price or volume targets.
*   **INTEGRATION NOTE:** Risk domain emits `RISK_THRESHOLD_BREACH_DETECTED` events which the Notification Domain subscribes to as an input trigger.

### 4. Session
*   **IN MARKET CALENDAR DOMAIN:** Refers to `MarketSession` representing official exchange trading phases (Pre-Open Auction, Continuous Trading, Market Close).
*   **IN USER & IDENTITY DOMAIN:** Refers to `UserSession` representing a user's JWT authentication token validity state.
*   **INTEGRATION NOTE:** Code identifiers MUST NEVER use standalone `Session`. Always specify `MarketSession` or `UserSession`.

### 5. Transaction
*   **IN PORTFOLIO DOMAIN:** Refers to `HistoricalTrade` recording an executed buy, sell, deposit, or dividend entry in the portfolio ledger.
*   **IN SUBSCRIPTION DOMAIN:** Refers to a credit card or payment gateway billing transaction for subscription renewals.
*   **INTEGRATION NOTE:** Portfolio domain uses `HistoricalTrade` or `LedgerEntry`. Subscription domain uses `BillingTransaction`.

### 6. Report
*   **IN RESEARCH DOMAIN:** Refers to `ResearchReport` representing an in-depth equity analytical document with fair value DCF models.
*   **IN REPORTING DOMAIN:** Refers to downloadable client PDF/Excel artifacts (portfolio performance reports, tax statements).
*   **INTEGRATION NOTE:** Use `ResearchReport` for equity research content, and `PerformanceReport` or `TaxReport` for generated user documents.

### 7. Score
*   **IN AI DOMAIN:** Refers to `ConfidenceScore` (0-100% statistical certainty metric attached to recommendations).
*   **IN RISK DOMAIN:** Refers to `RiskScore` (0-100 evaluation of user loss tolerance or asset volatility).
*   **IN SCREENING DOMAIN:** Refers to `HealthScore` or `FactorScore` (quantitative asset factor rank).
*   **INTEGRATION NOTE:** API payloads MUST specify `confidenceScore`, `riskScore`, or `factorScore`—never standalone `score`.

---

## SECTION 12 — NEW TERM DISCOVERY PROTOCOL

When a new business concept, financial asset class, or technical domain pattern is discovered that is not documented in this SSoT, the following 6-step protocol MUST be executed before any code commit or specification merge.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    NEW TERM DISCOVERY PROTOCOL STEPS                      │
├───────────────────────────────────────────────────────────────────────────┤
│ STEP 1: PROPOSAL SUBMISSION                                               │
│ Any engineer or PM submits a formal term proposal PR targeting this doc.  │
├───────────────────────────────────────────────────────────────────────────┤
│ STEP 2: REQUIRED PROPOSAL INFORMATION                                     │
│ Must include: Term (EN/AR), Definition, Scope, Code Convention, Synonyms. │
├───────────────────────────────────────────────────────────────────────────┤
│ STEP 3: GOVERNANCE REVIEW                                                 │
│ Reviewed by Domain Language Specialist, Lead Architect & Product Manager. │
├───────────────────────────────────────────────────────────────────────────┤
│ STEP 4: CONFLICT RESOLUTION                                               │
│ Evaluated against existing terms to prevent duplicate concepts or aliases.│
├───────────────────────────────────────────────────────────────────────────┤
│ STEP 5: TEAM & AI BROADCAST                                               │
│ Approved term merged into SSoT; notification broadcast to all agents/devs.│
├───────────────────────────────────────────────────────────────────────────┤
│ STEP 6: CODEBASE & API SYNCHRONIZATION                                    │
│ Codebase, linters, schemas, and AI agent prompts updated within 48 hours. │
└───────────────────────────────────────────────────────────────────────────┘
```

1.  **Proposal Submission:** Any human engineer, product manager, or AI agent discovering an unlisted concept MUST submit a formal amendment proposal against `docs/UBIQUITOUS_LANGUAGE.md`.
2.  **Required Information:** The proposal MUST contain:
    *   Proposed Canonical Term (English & Arabic فصحى)
    *   Precise Business Definition (2-4 sentences tailored to Tradeora)
    *   Scope in Tradeora & Owning Bounded Context
    *   Identifier Conventions (Code class, API field camelCase, DB column snake_case, Event SCREAMING_SNAKE)
    *   List of Explicitly Forbidden Synonyms
    *   EGX / MENA Context Notes
3.  **Governance Review:** The Architecture Governance Board and Domain Language Specialist review the proposal within 2 business days.
4.  **Conflict Resolution:** The board verifies that the proposed term does not collide with existing terms or re-introduce forbidden synonyms.
5.  **Broadcast & Communication:** Once approved and merged, the updated version of this document is broadcast to all engineering channels and automatically re-indexed into AI agent memory context.
6.  **Code & Schema Update:** Existing draft code, database migrations, linters, and API specs are updated within 48 hours to incorporate the new canonical term.

---

## SECTION 13 — LANGUAGE ENFORCEMENT RULES

### 13.1 Code Review Rules
1.  **Blocker Rejection:** Code reviewers MUST reject any Pull Request containing terms listed in Section 2 (Forbidden Synonyms Registry) or Section 10 (Anti-Patterns).
2.  **Naming Parity:** Code reviewers MUST verify that API field names use camelCase matching Section 8, and database columns use snake_case matching Section 8.
3.  **No Generic Identifiers:** Variable names such as `data`, `info`, `temp`, `val`, or `manager` MUST be flagged for immediate refactoring to explicit domain names.

### 13.2 AI Agent Language Rules
1.  **Mandatory Reading:** Every AI agent working on Tradeora MUST read and parse `docs/UBIQUITOUS_LANGUAGE.md` prior to executing any code generation or design task.
2.  **Refusal of Forbidden Synonyms:** AI agents MUST actively refuse to generate code, database tables, or documentation containing forbidden synonyms.
3.  **Strict Event Formatting:** AI agents MUST strictly format all domain event topics using `DOMAIN_SUBJECT_VERB_PAST_TENSE` matching Section 4.
4.  **No Invention:** AI agents MUST NEVER invent new domain terms without following the New Term Discovery Protocol (Section 12).

### 13.3 Documentation Rules
1.  **ADR Conformance:** Every Architecture Decision Record (ADR), technical spec, and README MUST use canonical terms defined herein.
2.  **External Vendor Isolation:** Names from external third-party libraries or data vendor payloads (e.g., Reuters, Bloomberg) MUST be translated to Tradeora canonical terms at API boundary Anti-Corruption Layers (ACL).
3.  **UI Copy Consistency:** User interface copy in spec documents MUST match `UI Label (EN)` and `UI Label (AR)` defined in Section 8.

---

## SECTION 14 — TERM VERSION HISTORY

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          DOCUMENT VERSION HISTORY                         │
├─────────┬──────────────┬──────────────────┬───────────────────────────────┤
│ VERSION │ DATE         │ AUTHOR / ROLE    │ DESCRIPTION OF CHANGES        │
├─────────┼──────────────┼──────────────────┼───────────────────────────────┤
│ 1.0.0   │ July 21, 2026│ Domain Language  │ Initial production release of │
│         │              │ Specialist &     │ Tradeora Ubiquitous Language. │
│         │              │ Architecture     │ Fully supersedes Section 17 of│
│         │              │ Board            │ BUSINESS_DOMAIN_DISCOVERY.md. │
└─────────┴──────────────┴──────────────────┴───────────────────────────────┘
```

*   **Superseded Draft:** Section 17 (Preliminary Domain Glossary) of `docs/BUSINESS_DOMAIN_DISCOVERY.md` is officially retired and superseded by this document.
*   **Version Control Protocol:** Future amendments will update this document following semantic versioning rules:
    *   **MAJOR (2.0.0):** Renaming or replacing an existing canonical term (requires constitution amendment).
    *   **MINOR (1.1.0):** Adding new canonical terms for expanded asset classes or markets via Section 12.
    *   **PATCH (1.0.1):** Clarifying definitions, adding synonyms to forbidden registry, or correcting formatting.

---

## SECTION 15 — FINAL DECLARATION

**FORMAL DECLARATION OF CANONICAL DOMAIN LANGUAGE GOVERNANCE:**

This document, `docs/UBIQUITOUS_LANGUAGE.md`, constitutes the **final, binding, authoritative, and enforceable Single Source of Truth (SSoT)** for all domain terminology across the Tradeora Financial Operating System.

It is issued under the authority of the Tradeora Project Constitution (`docs/PROJECT_CONSTITUTION.md`) and supersedes all preliminary glossaries, informal discussions, and draft specifications.

**IMMUTABLE RULE OF PRODUCTION IMPLEMENTATION:**
> **"Any word, term, class name, variable name, API field, database column, event topic, or UI label not defined in this document or formally approved through Section 12 is STRICTLY PROHIBITED from production code, schemas, documentation, and user interfaces across the entire Tradeora ecosystem."**

---
*End of Canonical Ubiquitous Language Document — Tradeora Financial Operating System*
