# TRADEORA BUSINESS DOMAIN DISCOVERY

**Document Reference:** `docs/BUSINESS_DOMAIN_DISCOVERY.md`  
**Version:** 1.0.0  
**Status:** CANONICAL BUSINESS DOMAIN SPECIFICATION  
**Effective Date:** July 21, 2026  
**Governance Authority:** Enterprise Business Architecture & Domain Model Governance Board  
**Subordinate To:** `docs/PROJECT_CONSTITUTION.md`

---

## 1. Executive Summary

Tradeora is established as a global AI-powered Financial Operating System (OS). It addresses a severe, systemic deficiency in global capital markets: the profound information asymmetry, analytical fragmentation, and financial opacity that isolate individual retail investors, wealth advisors, and regional institutions from institutional-grade financial intelligence. While legacy market terminals (e.g., Bloomberg, Refinitiv) cater exclusively to high-capital institutional desks at prohibitive cost structures, and conventional retail platforms offer basic, uncurated data feeds or speculative, unexplainable tips, Tradeora introduces a unified, explainable, and accessible intelligence ecosystem.

From a strategic market perspective, Tradeora initiates its commercial footprint in the Egyptian Exchange (EGX), serving as the foundational launch market within the Middle East and North Africa (MENA) region. The MENA financial landscape is characterized by high growth, expanding retail participation, rapidly maturing regulatory frameworks, and an acute void of native Arabic, AI-driven financial decision-support systems. Existing regional market portals function primarily as passive news aggregators or delayed static data tables; they lack deep fundamental modeling, dynamic risk stress-testing, automated research synthesis, and multi-asset intelligence.

Tradeora fills this gap by transforming raw, unstructured market data, earnings filings, economic indicators, corporate action logs, and news streams into auditable, risk-adjusted, explainable financial insights. Positioned strategically between raw data vendors/exchanges and human decision-makers, Tradeora acts as an intelligent decision-augmentation platform. It delivers a fundamental transformation across all user tiers: beginner retail investors transition from emotional speculation to disciplined, educated capital allocation; active traders gain real-time, multi-modal signal clarity; portfolio managers and wealth advisors automate labor-intensive quantitative research and compliance workflows; and enterprise users deploy standardized intelligence across operations. By design, Tradeora's domain model is market-agnostic, multi-currency, multi-lingual, and multi-regulatory, ensuring seamless international scaling from EGX to regional MENA exchanges and global financial markets.

---

## 2. Business Vision and Strategic Goals

### 2.1 Business Vision
To become the global standard Financial Operating System—the definitive intelligence layer that powers every capital allocation decision across worldwide markets through explainable AI, rigorous mathematical modeling, and native multi-cultural internationalization.

### 2.2 Strategic Positioning & Horizon Roadmap
Tradeora’s growth trajectory follows a disciplined three-tier strategic horizon:

*   **Short-Term Horizon (Year 1 — EGX Market Depth & Product-Market Fit):**
    Establish complete domain depth within the Egyptian Exchange (EGX). Capture primary market share among Egyptian retail and regional Arab investors by delivering native Arabic institutional-grade analytics, complete EGX equity and fixed-income coverage, localized earnings intelligence, and flawless compliance with the Financial Regulatory Authority (FRA).
*   **Medium-Term Horizon (Years 2–3 — MENA Regional Expansion):**
    Extend operational coverage across major regional exchanges (Saudi Exchange / TADAWUL, Dubai Financial Market / DFM, Abu Dhabi Securities Exchange / ADX, Qatar Stock Exchange / QSE, Kuwait Boursa). Integrate multi-currency accounting, regional corporate actions, and cross-border macroeconomic analytics. Establish B2B enterprise partnerships with regional brokerages, wealth management firms, and family offices.
*   **Long-Term Horizon (Years 4–5 — Global Financial Operating System):**
    Scale intelligence capabilities to Tier-1 global exchanges (NYSE, NASDAQ, LSE, XETRA, TSE) across equities, fixed income, commodities, FX, derivatives, and private asset classes. Position Tradeora as the premier non-custodial financial copilot and research engine for global investors, advisors, and financial enterprises.

### 2.3 Measurable Strategic Goals

```
┌───────────────────────────────────────────────────────────────────────────┐
─────────────────── TRADEORA 5-YEAR STRATEGIC MEASURABLE TARGETS ───────────
├───────────────────────────────────────────────────────────────────────────┤
│ 1-YEAR TARGETS (EGX Dominance):                                          │
│   • Retail & Institutional User Base: 150,000 Active Monthly Users       │
│   • Market Coverage: 100% EGX Listed Equities, Treasury Bills & Bonds     │
│   • AI Decision Trust Index: > 92% user recommendation satisfaction        │
│   • Language Parity: 100% feature and intelligence parity (Arabic/English)│
├───────────────────────────────────────────────────────────────────────────┤
│ 3-YEAR TARGETS (MENA Leadership):                                        │
│   • Regional User Base: 1,500,000 Active Monthly Users across GCC & MENA  │
│   • Enterprise Adoption: 35+ Regional Wealth Firms & Broker Partners     │
│   • Cross-Market Arbitrage & Insight Velocity: Real-time MENA signals      │
│   • Annualized Recurring Revenue (ARR) Growth: > 180% Year-over-Year     │
├───────────────────────────────────────────────────────────────────────────┤
│ 5-YEAR TARGETS (Global Scale):                                           │
│   • Global Footprint: 10,000,000+ Active Users across 40+ International Markets│
│   • Institutional Enterprise Integration: Tier-1 Global Financial OS      │
│   • Research Automation: > 80% reduction in research Time to Insight (TTI)│
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Business Scope

Tradeora enforces explicit functional boundaries to maintain regulatory compliance, operational focus, and architectural alignment.

### 3.1 In Scope (Phase 1 — EGX as First Live Market)
*   Full global-first platform capability architecture running EGX as its first operational deployment instance.
*   Real-time and end-of-day market data acquisition, normalization, and distribution for EGX securities, indices, and macro indicators.
*   Automated parsing, extraction, and financial modeling of corporate financial statements, earnings announcements, and disclosures.
*   Explainable AI-driven security analysis, automated equity research generation, factor scoring, and valuation modeling.
*   Multi-asset portfolio tracking, real-time risk profiling, Value-at-Risk (VaR) analytics, and performance attribution.
*   Personalized AI recommendation synthesis equipped with mandatory confidence scoring, risk disclosures, and causal reasoning.
*   Screening, filtering, interactive watchlists, and dynamic alert notification engines.
*   Native dual-language (Arabic and English) internationalization engine with localized formatting, RTL layouts, and currency contexts.
*   Subscription management, user entitlement controls, enterprise administrative governance, and immutable audit logging.

### 3.2 Out of Scope (Explicitly Excluded in Phase 1)
*   Direct order execution, trade routing, limit order matching, or exchange counterparty operations.
*   Brokerage operations, client money handling, fund custody, asset escrow, or banking operations.
*   Discretionary asset management where software acts autonomously without human approval.
*   Unregulated financial advice, speculative stock tipping, or non-explainable black-box forecasting.

### 3.3 Future Scope
*   Smart Order Routing (SOR) and standardized execution integration with licensed external brokers via open APIs.
*   Automated wealth management, portfolio rebalancing execution pipelines, and tax-loss harvesting modeling.
*   Enterprise advisory portals for certified wealth managers, fund management suites, and institutional compliance tools.
*   Expansion into global asset classes (US/EU equities, global FX, commodities, derivatives, private equity, and real estate).

---

## 4. Business Capabilities

Tradeora's functional model is defined by 30 core business capabilities. Each capability represents a cohesive, market-agnostic business behavior designed to operate across any asset class, currency, or regulatory jurisdiction.

1.  **Market Data Acquisition:** Ingests raw structured, semi-structured, and streaming tick data, order books, and price feeds from global exchanges, third-party data vendors, and regulatory repositories.
    *   *Users:* System, Platform Administrator, Data Engineers.
    *   *Value Delivered:* Guarantees continuous, verified baseline market pricing for all downstream intelligence.
2.  **Market Data Distribution:** Formats, normalizes, and streams real-time pricing feeds, aggregated quotes, and historical market data to internal analytical services and end-user interface clients.
    *   *Users:* All User Profiles.
    *   *Value Delivered:* Provides low-latency, reliable market visibility tailored to user connection profiles.
3.  **Price Intelligence:** Computes technical indicators, price momentum metrics, volatility indices, volume distribution, and moving average clusters across arbitrary time horizons.
    *   *Users:* Active Trader, Portfolio Manager, Researcher/Analyst.
    *   *Value Delivered:* Transforms raw tick pricing into actionable technical context.
4.  **Corporate Actions Tracking:** Detects, validates, and records corporate events including cash/stock dividends, stock splits, bonus shares, rights issues, spin-offs, and mergers.
    *   *Users:* Long-Term Investor, Portfolio Manager, Compliance Officer.
    *   *Value Delivered:* Preserves historical price adjustments and accurate historical return calculations.
5.  **Financial Statement Analysis:** Extracts, standardizes, and evaluates corporate balance sheets, income statements, and cash flow statements across diverse accounting standards (IFRS, EAS, US GAAP).
    *   *Users:* Researcher/Analyst, Long-Term Investor, Fund Manager.
    *   *Value Delivered:* Eliminates manual spreadsheet analysis by delivering instant financial ratio trends and growth metrics.
6.  **Earnings Intelligence:** Parses earnings release documents, quarterly reporting packages, and call notes to isolate guidance changes, revenue surprises, and margin trends.
    *   *Users:* Active Trader, Long-Term Investor, Researcher/Analyst.
    *   *Value Delivered:* Reduces time-to-insight following corporate earnings announcements from hours to seconds.
7.  **Economic Data Intelligence:** Tracks national and international macroeconomic indicators, including inflation (CPI), interest rates, GDP growth, foreign exchange reserves, and trade balances.
    *   *Users:* Fund Manager, Wealth Advisor, Portfolio Manager.
    *   *Value Delivered:* Provides top-down macroeconomic context to contextualize asset pricing and risk exposures.
8.  **News and Sentiment Intelligence:** Aggregates and analyzes financial news feeds, regulatory disclosures, and market media in Arabic and English, deriving quantitative sentiment scores and impact assessments.
    *   *Users:* Active Trader, Beginner Investor, Research Analyst.
    *   *Value Delivered:* Filters noise and quantifies public news impact on security pricing.
9.  **Equity Research:** Synthesizes qualitative and quantitative company data into standardized equity research summaries, DCF fair-value estimates, competitive moat scores, and peer comparisons.
    *   *Users:* Long-Term Investor, Financial Advisor, Wealth Manager.
    *   *Value Delivered:* Grants retail users access to institutional-grade research reports.
10. **Sector and Industry Analysis:** Aggregates individual asset performance and fundamentals into industry sector heatmaps, market cap weighted indices, and capital flow distribution metrics.
    *   *Users:* Portfolio Manager, Researcher/Analyst, Active Trader.
    *   *Value Delivered:* Highlights rotational market capital flows and sector concentration risks.
11. **Multi-Asset Research:** Extends analytical modeling across equities, fixed-income instruments, ETFs, mutual funds, REITs, commodities, and FX pairs within a unified research environment.
    *   *Users:* Portfolio Manager, Wealth Manager, Financial Advisor.
    *   *Value Delivered:* Supports comprehensive asset allocation across diverse investment vehicles.
12. **Cross-Market Analysis:** Evaluates lead-lag relationships, correlation matrices, currency effects, and cross-border valuation spreads between international markets and regional exchanges.
    *   *Users:* Institutional User, Fund Manager, Portfolio Manager.
    *   *Value Delivered:* Identifies cross-market arbitrage opportunities and macro systemic risk spillover.
13. **AI-Powered Security Analysis:** Deploys cognitive analytical agents to continuously scan fundamental, technical, macro, and sentiment data to evaluate security health and valuation anomalies.
    *   *Users:* All User Profiles.
    *   *Value Delivered:* Automates multi-dimensional security evaluation at scale.
14. **AI Recommendation Engine:** Synthesizes explainable, personalized investment recommendations matching user profiles, complete with confidence scores, downside risk scenarios, and key assumptions.
    *   *Users:* Beginner Investor, Long-Term Investor, Financial Advisor.
    *   *Value Delivered:* Delivers tailored decision support without compromising human oversight.
15. **Signal Generation:** Identifies statistical, technical, and fundamental regime shifts, generating event-based quantitative market signals.
    *   *Users:* Active Trader, Quantitative Analyst, Portfolio Manager.
    *   *Value Delivered:* Alerts users to actionable high-probability market setups.
16. **Risk Profiling:** Evaluates user risk tolerance, investment horizon, liquidity needs, loss capacity, and financial knowledge through standardized interactive questionnaires and behavior analysis.
    *   *Users:* Beginner Investor, Financial Advisor, Wealth Manager.
    *   *Value Delivered:* Establishes legal and personal risk boundaries for all downstream recommendations.
17. **Risk Assessment:** Calculates real-time portfolio risk exposures including Value-at-Risk (VaR), Conditional VaR, Sharpe/Sortino ratios, beta, maximum drawdown, and concentration stress.
    *   *Users:* Portfolio Manager, Fund Manager, Wealth Advisor.
    *   *Value Delivered:* Prevents catastrophic capital loss through continuous risk quantification.
18. **Portfolio Construction Intelligence:** Generates optimal asset allocation weights using Modern Portfolio Theory (MPT), Black-Litterman models, factor tilt strategies, and risk parity methodologies.
    *   *Users:* Portfolio Manager, Wealth Advisor, Long-Term Investor.
    *   *Value Delivered:* Guides efficient portfolio construction customized to risk parameters.
19. **Portfolio Tracking:** Maintains a real-time ledger of multi-asset positions, cash balances, historical trades, pending corporate action adjustments, and total portfolio valuation.
    *   *Users:* All User Profiles.
    *   *Value Delivered:* Provides an authoritative single view of total multi-market wealth.
20. **Portfolio Performance Analytics:** Computes time-weighted returns (TWR), money-weighted returns (MWR), benchmark-relative alpha, sector attribution, and fee drag impact over arbitrary periods.
    *   *Users:* Portfolio Manager, Fund Manager, Wealth Advisor, Long-Term Investor.
    *   *Value Delivered:* Provides transparent attribution of investment skill versus market movements.
21. **Benchmark Comparison:** Evaluates portfolio performance against market indices, custom blend benchmarks, or peer category averages across normalized base currencies.
    *   *Users:* Portfolio Manager, Fund Manager, Financial Advisor.
    *   *Value Delivered:* Verifies whether investment strategies outperform passive market indexes.
22. **Multi-Currency Portfolio Support:** Aggregates, converts, and values positions denominated in arbitrary global currencies using real-time and historical exchange rate data.
    *   *Users:* Wealth Manager, Global Investor, Portfolio Manager.
    *   *Value Delivered:* Enables cross-border portfolio tracking while isolating foreign exchange impact.
23. **Watchlist Management:** Allows users to build, organize, tag, and monitor custom collections of securities across multiple exchanges with dynamic sorting and alert triggers.
    *   *Users:* All User Profiles.
    *   *Value Delivered:* Streamlines ongoing monitoring of prospective investment candidates.
24. **Screening and Filtering:** Executes dynamic multi-variable filtering based on fundamental ratios, technical parameters, AI scores, sector classifications, and dividend yields.
    *   *Users:* Active Trader, Long-Term Investor, Research Analyst.
    *   *Value Delivered:* Filters thousands of listed securities into actionable opportunity sets.
25. **Alert and Notification Engine:** Evaluates price thresholds, volatility spikes, news events, risk breaches, and AI recommendations, delivering real-time notifications across push, email, and mobile channels.
    *   *Users:* All User Profiles.
    *   *Value Delivered:* Ensures critical market events and risk breaches receive immediate user attention.
26. **Strategy Evaluation:** Evaluates custom and pre-defined investment strategies against historical parameter rules, stress-test regimes, and factor models.
    *   *Users:* Active Trader, Quantitative Analyst, Portfolio Manager.
    *   *Value Delivered:* Validates investment methodologies prior to capital commitment.
27. **Backtesting:** Simulates historical strategy performance across multi-year tick and daily price histories, adjusting for historical corporate actions, spread costs, and market liquidity limits.
    *   *Users:* Quantitative Analyst, Active Trader, Fund Manager.
    *   *Value Delivered:* Prevents flawed quantitative strategies from being deployed live.
28. **Financial Education:** Delivers context-aware educational breakdowns, financial glossary definitions, ratio explainers, and interactive learning modules in Arabic and English.
    *   *Users:* Beginner Investor, Long-Term Investor.
    *   *Value Delivered:* Demystifies complex financial concepts and improves overall investor literacy.
29. **Onboarding Intelligence:** Guides new users through identity setup, risk profiling, locale customization, exchange preferences, and initial portfolio connection.
    *   *Users:* All New User Profiles.
    *   *Value Delivered:* Accelerates time-to-value while capturing necessary regulatory profile parameters.
30. **User Profile Management:** Manages user account credentials, security settings, subscription tiers, notification preferences, locale configurations, and connected broker credentials.
    *   *Users:* All User Profiles.
    *   *Value Delivered:* Ensures secure personal settings and access management across device sessions.
31. **Subscription and Entitlement:** Enforces feature access tiering, data feed licensing permissions, API quota enforcement, and multi-currency billing integration.
    *   *Users:* Platform Administrator, All User Profiles.
    *   *Value Delivered:* Monetizes platform capabilities and enforces market data licensing rules.
32. **Reporting and Export:** Generates downloadable, publication-ready PDF, Excel, and CSV reports containing portfolio valuations, tax statements, research summaries, and compliance logs.
    *   *Users:* Wealth Manager, Financial Advisor, Portfolio Manager, Individual Investor.
    *   *Value Delivered:* Facilitates external reporting, tax filing, and institutional record-keeping.
33. **Audit and Compliance Logging:** Captures tamper-evident, immutable records of all user actions, AI inference payloads, administrative overrides, parameter modifications, and risk warnings.
    *   *Users:* Compliance Officer, Platform Administrator, Regulatory Auditors.
    *   *Value Delivered:* Guarantees regulatory auditability, non-repudiation, and operational transparency.
34. **Administration:** Manages system-wide operational configurations, user account status, system feature flags, data vendor connections, and AI model routing rules.
    *   *Users:* Platform Administrator.
    *   *Value Delivered:* Controls global system operation, security, and operational state.
35. **Platform Health Monitoring:** Tracks system data stream latency, quote feed integrity, AI inference error rates, infrastructure resource utilization, and API endpoint availability.
    *   *Users:* Platform Administrator, Operations Team.
    *   *Value Delivered:* Protects operational SLA availability and data accuracy.
36. **Internationalization Engine:** Manages multi-language translation bundles, localized date/time formatting (Gregorian, Hijri), numeric formatting rules, and Right-to-Left (RTL) layout state.
    *   *Users:* All User Profiles.
    *   *Value Delivered:* Guarantees culturally native, accessible user experiences globally.
37. **Market Calendar Management:** Maintains authoritative operational calendars, trading session hours, market holidays, half-day sessions, and auction windows for all global exchanges.
    *   *Users:* System, All User Profiles.
    *   *Value Delivered:* Enforces market-session awareness for quote evaluation and alert timing.
38. **Fair Value Modeling (Additional):** Executes multi-variable intrinsic valuation models including Discounted Cash Flow (DCF), Dividend Discount Model (DDM), Economic Value Added (EVA), and Asset-Based Valuation.
    *   *Users:* Researcher/Analyst, Long-Term Investor, Portfolio Manager.
    *   *Value Delivered:* Delivers objective mathematical baseline values for listed securities.
39. **Liquidity Analysis Engine (Additional):** Evaluates bid-ask spreads, order book depth, average daily trading volume (ADTV), turnover ratios, and market impact cost across target securities.
    *   *Users:* Active Trader, Portfolio Manager, Institutional User.
    *   *Value Delivered:* Prevents illiquidity traps and quantifies execution slippage risk.

---

## 5. Business Actors

### 5.1 Human Actors

```
┌───────────────────────────────────────────────────────────────────────────┐
────────────────────────── TRADEORA HUMAN ACTORS ───────────────────────────
├───────────────────────────────────────────────────────────────────────────┤
│ 1. Beginner Investor:                                                     │
│    Goal: Wealth preservation and guided growth without excessive risk.    │
│    Role: Learns basics, sets conservative profile, follows AI insights.   │
├───────────────────────────────────────────────────────────────────────────┤
│ 2. Active Trader:                                                         │
│    Goal: Capture short-term market momentum and price discrepancies.      │
│    Role: Uses real-time technical indicators, scanners, and fast alerts. │
├───────────────────────────────────────────────────────────────────────────┤
│ 3. Long-Term Investor:                                                    │
│    Goal: Compound capital over years via fundamental value and dividends.  │
│    Role: Evaluates fair value models, financial statement health, & DCFs. │
├───────────────────────────────────────────────────────────────────────────┤
│ 4. Portfolio Manager:                                                     │
│    Goal: Optimize multi-asset allocations and control portfolio risk.    │
│    Role: Configures asset weights, monitors VaR, and rebalances holdings. │
├───────────────────────────────────────────────────────────────────────────┤
│ 5. Wealth Advisor:                                                        │
│    Goal: Deliver tailored, compliant financial guidance to private clients.│
│    Role: Generates client reports, runs scenario tests, tracks goals.     │
├───────────────────────────────────────────────────────────────────────────┤
│ 6. Fund Manager:                                                          │
│    Goal: Outperform institutional benchmarks and maintain liquidity.      │
│    Role: Conducts factor attribution, monitors drawdowns & filings.       │
├───────────────────────────────────────────────────────────────────────────┤
│ 7. Researcher/Analyst:                                                    │
│    Goal: Produce deep fundamental research and financial modeling.        │
│    Role: Analyzes earnings, standardizes ratios, drafts equity notes.    │
├───────────────────────────────────────────────────────────────────────────┤
│ 8. Enterprise User:                                                       │
│    Goal: Leverage platform intelligence within enterprise infrastructure. │
│    Role: Accesses high-throughput APIs, custom data streams & white-label.│
├───────────────────────────────────────────────────────────────────────────┤
│ 9. Platform Administrator:                                                │
│    Goal: Ensure system operational stability, security, & health.         │
│    Role: Manages configurations, user entitlements, and system metrics.   │
├───────────────────────────────────────────────────────────────────────────┤
│ 10. Compliance Officer:                                                   │
│    Goal: Guarantee strict adherence to regulatory rules & privacy laws.   │
│    Role: Audits advice logs, verifies suitability records & regulatory exports.│
└───────────────────────────────────────────────────────────────────────────┘
```

### 5.2 External Organizations
1.  **Exchanges (Global):** Primary venues providing security definitions, real-time tick feeds, order book depth, official closing prices, and corporate announcements (e.g., EGX, TADAWUL, DFM, ADX, NYSE, NASDAQ).
2.  **Regulatory Authorities:** Governing bodies defining compliance rules, disclosure standards, and financial licensing boundaries in operating jurisdictions (e.g., FRA in Egypt, CMA in Saudi Arabia, SEC in US).
3.  **Licensed Data Vendors:** Third-party financial data aggregators distributing real-time quotes, macroeconomic series, reference data, and fundamental financials.
4.  **News Providers:** Financial news agencies, wire services, and press outlets delivering market news, press releases, and editorial media.
5.  **Broker Partners (Future):** Licensed brokerage institutions executing user orders via secure execution APIs.
6.  **Financial Data Aggregators:** Specialized data providers delivering sector data, ESG scores, alternative data feeds, and benchmark indexes.

### 5.3 AI Systems
1.  **Recommendation Engine:** Multi-agent reasoning system that synthesizes personalized, explainable investment proposals grounded in user risk profiles and market context.
2.  **Sentiment Analyzer:** Natural Language Processing (NLP) engine evaluating financial media in Arabic and English to generate quantitative sentiment scores.
3.  **Risk Evaluator:** Quantitative analytics agent assessing portfolio VaR, correlation stress, concentration limits, and downside volatility exposure.
4.  **Research Generator:** Autonomous multi-modal document parser that extracts financial ratios, summarizes earnings filings, and drafts structured research notes.
5.  **Portfolio Optimizer:** Mathematical optimization engine computing efficient frontiers, factor tilts, and Black-Litterman asset rebalancing models.

---

## 6. Stakeholders

| Stakeholder Group | Primary Goals | Key Responsibilities | Expectations from Tradeora | Success Measurement |
| :--- | :--- | :--- | :--- | :--- |
| **Retail Investors (Beginner, Active, Long-Term)** | Protect and grow personal wealth; make educated financial decisions. | Maintain accurate user profiles; manage personal risk appetite. | Unbiased, explainable insights; high data accuracy; clear Arabic UI. | Portfolio returns; user retention; low drawdown; high decision confidence. |
| **Institutional Users & Fund Managers** | Outperform market benchmarks; manage large-scale multi-asset portfolios. | Exercise fiduciary duty; enforce mandate compliance limits. | Sub-second data feeds; deep quantitative risk metrics; API reliability. | Risk-adjusted alpha; Sharpe ratio optimization; low tracking error. |
| **Advisors & Wealth Managers** | Scale client advisory business; deliver personalized, compliant reports. | Perform client KYC/suitability; validate financial advice. | Automated report drafting; scenario stress-testing tools; full auditability. | Client growth; report generation velocity; zero regulatory violations. |
| **Regulatory & Compliance Entities** | Protect public investors; maintain financial market integrity. | Enforce securities laws and financial disclosure regulations. | Transparent information vs. advice boundaries; immutable audit logs. | Absolute audit compliance; transparent risk disclosures; zero market manipulation. |
| **Financial Data Partners & Exchanges** | Commercialize market data; enforce licensing and copyright terms. | Maintain data feed uptime, delivery SLAs, and accurate market feeds. | Strict entitlement enforcement; compliant user count reporting. | Full licensing compliance; high data distribution reliability. |
| **Enterprise Leadership & Shareholders** | Build a sustainable, high-margin, market-leading global Financial OS. | Oversee strategic roadmap, capital allocation, and governance. | Rapid market adoption; sustainable unit economics; high platform trust. | ARR growth; customer lifetime value (LTV); net promoter score (NPS); market share. |

---

## 7. Business Processes

### Process 1: User Researches a Listed Security
```
[User Selects Security Ticker]
       │
       ▼
[System Fetches Security Master & Real-Time Price]
       │
       ▼
[System Aggregates Fundamental Ratios, Technical Context & Financial Statements]
       │
       ▼
[AI Engines Extract Key Insights, Earnings Trends & News Sentiment (Arabic/English)]
       │
       ▼
[Platform Displays Integrated Equity Intelligence Summary with Source Attribution]
```
*Narrative Flow:* The user initiates a lookup for an asset on any market. The platform retrieves canonical security definitions, recent pricing, valuation ratios (DCF, P/E, P/B), standardized financial statements, and technical momentum indicator clusters. Simultaneously, AI engines parse recent earnings disclosures and regional news streams, compiling an explainable research summary displayed in the user's preferred language with full source attributions and timestamps.

### Process 2: AI Generates an Investment Recommendation
*Narrative Flow:* Upon user request or scheduled background review, the AI Recommendation Engine evaluates a target asset against the user’s stored Risk Profile and current Portfolio context. The engine validates data freshness and market session state, then executes multi-agent reasoning to evaluate valuation, technical momentum, and downside risk. It formulates a personalized recommendation payload incorporating explicit confidence scores (0-100%), downside risk scenarios, key macroeconomic assumptions, and causal explanations. The user receives the recommendation, with the platform enforcing human confirmation before any action can be initiated.

### Process 3: User Builds and Monitors a Multi-Asset Portfolio
*Narrative Flow:* A user defines a new portfolio, specifying base accounting currency and benchmark selection. The user imports historical position holdings, trade records, and cash balances across multiple exchanges and asset classes. The platform normalizes asset prices using multi-currency exchange rates, adjusts for pending corporate actions, and calculates real-time net asset value (NAV), unrealized gains/losses, asset allocation distribution, and total exposure.

### Process 4: Risk Threshold Breach Triggers an Alert
*Narrative Flow:* The Risk Evaluator continuously monitors portfolio parameters against user-defined or system-recommended risk thresholds (e.g., maximum sector concentration of 25%, VaR threshold breach, or single-stock drawdown limit). When volatility or price action causes a threshold breach, the system generates an immediate high-priority Risk Event. The Alert Engine formats a localized warning message detailing the precise nature of the breach, contributing asset positions, and suggested corrective rebalancing strategies, transmitting it to the user via push and in-app notifications.

### Process 5: Corporate Action (Dividend / Split) is Processed
*Narrative Flow:* The platform ingests an official corporate action disclosure from an exchange feed (e.g., cash dividend announcement or 2-for-1 stock split). The Corporate Actions Engine validates the ex-date, record date, and payment parameters. Upon ex-date execution, the system adjusts historical price series to preserve chart continuity, updates user portfolio position quantities (for splits), and projects cash receivable entries (for dividends). The portfolio ledger recalculates cost bases and return metrics within one business day of confirmation.

### Process 6: User Receives AI-Generated Market Brief (Daily)
*Narrative Flow:* Prior to market opening or following market closing for each specific exchange calendar, the AI Research Generator compiles a personalized daily market brief. The brief synthesizes macro indices movements, relevant sector rotation events, overnight global news sentiment, pending corporate earnings releases, and specific portfolio watchlist updates. The brief is delivered in native Arabic or English, tailored to the user's reading preference and investment horizon.

### Process 7: New User Onboards and is Profiled
*Narrative Flow:* A new user registers on Tradeora. The Onboarding Intelligence engine guides the user through locale selection (language, calendar system, preferred number formatting), primary currency preference, and initial target markets. The user completes an interactive, multi-factor risk profiling questionnaire evaluating investment experience, horizon, financial capacity, and loss tolerance. The system calculates a deterministic Risk Profile Score, assigns a suitability classification, and establishes initial entitlement permissions.

### Process 8: Market Session Opens and Closes (Local Calendar Awareness)
*Narrative Flow:* The Market Calendar Management domain tracks operational session schedules across global exchanges. As a specific exchange calendar signals an upcoming session transition (e.g., Pre-Auction, Continuous Trading, Closing Auction, Post-Trading), the system publishes Market Session Events. Real-time pricing streams transition operational modes, alert engine rules adjust evaluation frequencies, and end-of-day (EOD) pricing validation pipelines execute upon official session close to freeze daily valuation snapshots.

### Process 9: Earnings Announcement is Processed and Analyzed
*Narrative Flow:* A listed company publishes quarterly financial statements. The Market Data Acquisition domain ingests the disclosure document. The Financial Statement Analysis domain standardizes raw income, balance sheet, and cash flow figures into normalized accounting structures. The AI Earnings Intelligence engine compares reported numbers against market consensus expectations, calculates surprise metrics, extracts management guidance changes, and updates fair-value DCF models within minutes of publication.

### Process 10: User Screens the Market Using Filters and AI
*Narrative Flow:* A user defines a multi-variable market screening query combining fundamental parameters (e.g., P/E < 12, Dividend Yield > 6%), technical factors (e.g., RSI < 30, price above 200-day moving average), and AI criteria (e.g., AI Health Score > 80, positive news sentiment). The Screening Engine executes the search across thousands of listed assets in specified markets, returning a prioritized list with key ratio metrics, downloadable research links, and single-click watchlist addition options.

### Process 11: User Tracks Performance Across Multiple Markets
*Narrative Flow:* A user managing assets across multiple international exchanges (e.g., EGX in EGP, TADAWUL in SAR, NASDAQ in USD) opens the platform's multi-market performance dashboard. The platform fetches real-time quote feeds, applies current timestamped foreign exchange rates from declared rate sources, converts all valuations into the user's declared base currency, and computes consolidated Time-Weighted Returns (TWR). The dashboard isolates organic security performance from foreign exchange gains/losses.

### Process 12: AI Detects Cross-Market Signal or Opportunity
*Narrative Flow:* The Cross-Market Analysis engine monitors lead-lag relationships, sector valuation spreads, and macroeconomic correlations across connected global exchanges. Upon detecting a statistically significant valuation discrepancy (e.g., dual-listed security price spread, regional sector lag, or commodity-to-equity valuation divergence), the AI engine formulates a Cross-Market Signal Event. The signal is enriched with statistical confidence, historical arbitrage metrics, and risk factors, then distributed to eligible subscribed users.

### Process 13: Fair Value Discrepancy & Arbitrage Opportunity Detection (Additional)
*Narrative Flow:* The Fair Value Modeling engine continuously evaluates market pricing against mathematical DCF, DDM, and asset-replacement valuations. When a security's market price deviates from its calculated intrinsic value band by more than a defined statistical threshold, the system flags a Fair Value Discrepancy event, enabling fundamental investors to evaluate under/over-valued opportunities.

### Process 14: Portfolio Rebalancing Strategy Synthesis (Additional)
*Narrative Flow:* A portfolio manager requests a rebalancing review. The Portfolio Construction Intelligence domain evaluates current position weights against target model allocations and risk constraints. The AI engine synthesizes a low-slippage, tax-aware rebalancing proposal detailing specific position adjustments, estimated execution transaction costs, and expected post-rebalance VaR improvements.

---

## 8. Business Services

| Business Service Name | Service Purpose | Primary Consumers | Inputs | Outputs | Business Value Delivered |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Market Data Ingestion Service** | Acquire, validate, and normalize real-time tick feeds and EOD market data. | Market Data Distribution, Price Intelligence. | Raw exchange feeds, vendor data stream payloads. | Normalized Price objects, trade ticks, order book snapshots. | Ensures verified, clean pricing foundation across platform. |
| **Price Intelligence Service** | Compute technical momentum, volatility, and volume indicators. | Screening Service, Alert Engine, User Interfaces. | Price history series, timeframe parameters. | Technical indicator clusters, moving average states. | Converts price streams into actionable technical context. |
| **Corporate Action Service** | Record and adjust position histories for corporate events. | Portfolio Service, Performance Engine. | Exchange corporate action filings, record dates. | Adjusted price series, position share quantity updates. | Preserves financial calculation accuracy across corporate events. |
| **Financial Statement Service** | Standardize and analyze corporate balance sheets & income statements. | Research Engine, Screening Service, Valuation Service. | Raw financial filings (IFRS/EAS), XBRL payloads. | Normalized financial statements, financial ratio trends. | Delivers instant financial modeling and ratio evaluation. |
| **Earnings Intelligence Service** | Extract earnings surprises, guidance changes, and transcript notes. | AI Recommendation Engine, User Interfaces. | Earnings release documents, consensus estimates. | Earnings surprise metrics, guidance summary payloads. | Accelerates earnings evaluation from hours to seconds. |
| **Economic Intelligence Service** | Track macro indicators, interest rates, and FX series. | Portfolio Service, Risk Service, Cross-Market Service. | Central bank feeds, statistical agency releases. | Macroeconomic indicator objects, inflation/rate trends. | Provides macro context for portfolio risk and valuation. |
| **News Sentiment Service** | Quantify sentiment and impact of financial news releases. | Research Engine, Signal Generation Service. | News articles (Arabic/English), press releases. | Quantitative SentimentScore objects, entity tags. | Filters news noise and quantifies market sentiment impact. |
| **Equity Research Service** | Synthesize qualitative and quantitative equity research notes. | User Interfaces, Advisor Portals. | Financial statements, price history, sentiment data. | Publication-ready Equity Research Reports. | Democratizes access to institutional-grade research. |
| **AI Recommendation Service** | Synthesize explainable, personalized investment recommendations. | End-User Interfaces, Advisory Copilots. | User Profile, Risk Profile, Portfolio, Market Data. | Recommendation objects with confidence scores & risks. | Delivers tailored, risk-adjusted decision support. |
| **Signal Generation Service** | Detect quantitative indicators and market regime shifts. | Active Traders, Alert Engine. | Technical indicators, order book flows, price ticks. | AISignal objects, signal strength scores. | Highlights high-probability technical setups. |
| **Risk Assessment Service** | Compute real-time VaR, drawdown, and correlation risk. | Portfolio Engine, Alert Engine, User Interfaces. | Portfolio positions, price histories, market volatility. | Risk Profile metrics, VaR values, stress test scores. | Protects users from unquantified catastrophic loss. |
| **Portfolio Tracking Service** | Maintain authoritative multi-asset position and cash ledger. | User Interfaces, Performance Analytics Service. | User trade entries, price feeds, corporate actions. | Portfolio valuation snapshots, position ledgers. | Delivers a unified single view of total multi-market wealth. |
| **Portfolio Performance Service**| Calculate time-weighted returns (TWR) and benchmark alpha. | User Interfaces, Reporting Service. | Portfolio history, benchmark index series. | TWR metrics, benchmark relative performance ratios. | Provides transparent attribution of investment results. |
| **Multi-Currency Service** | Convert monetary values across global currencies dynamically. | Portfolio Service, Reporting Service. | Spot exchange rates, base currency parameters. | Converted monetary values, FX gain/loss breakdown. | Enables seamless multi-market global asset tracking. |
| **Screening Service** | Execute dynamic multi-variable filtering across asset universe. | All User Profiles. | Screening parameter queries, market metrics. | Filtered asset lists, comparative ratio matrices. | Accelerates opportunity discovery across thousands of assets. |
| **Alert Notification Service** | Evaluate threshold rules and dispatch multi-channel alerts. | All User Profiles. | Alert rules, price feeds, risk events, signals. | Multi-channel notifications (push, in-app, email). | Ensures immediate awareness of critical market events. |
| **Financial Education Service** | Deliver contextual financial glossaries, ratio guides & learning. | Beginner Investors, Educational Interfaces. | User context, selected financial terms/ratios. | Localized educational explanations (Arabic/English). | Improves investor literacy and decision quality. |
| **Internationalization Service** | Manage translations, date systems, numbers, RTL formatting. | Platform User Interfaces, Reporting Engines. | Locale context, translation keys, dates/numbers. | Formatted localized UI text, Hijri/Gregorian dates. | Guarantees native user experience in any language/region. |
| **Market Calendar Service** | Manage exchange session states, holidays, and trading hours. | Ingestion Service, Price Service, Alert Engine. | Global exchange session schedules, holiday lists. | Session states (Open, Closed, Auction), session timers. | Enforces market-session awareness across all services. |
| **Audit & Compliance Service** | Record immutable, tamper-evident logs of system actions. | Compliance Officers, System Administrators. | User actions, AI outputs, administrative events. | Immutable AuditLog entries, compliance reports. | Guarantees complete regulatory transparency and auditability. |

---

## 9. Business Objects

1.  **Asset:** The underlying economic entity, security class, or financial property possessing intrinsic value (e.g., Commercial International Bank Common Stock, Egyptian Treasury Bill 2027). *Attributes:* Asset Identifier, Legal Name, Asset Type, Issuer Entity, Country of Domicile, Sector Classification. *Relationships:* Referenced by Instruments; categorized by AssetClass.
2.  **AssetClass:** Classification grouping financial instruments with similar financial structures and regulatory characteristics (e.g., Equities, Fixed Income, ETFs, Cash, Commodities, FX). *Attributes:* Class Identifier, Name, Risk Characteristics, Valuation Methodology Standard. *Relationships:* Groups multiple Assets.
3.  **Exchange:** A licensed organized venue where financial instruments are listed and traded (e.g., Egyptian Exchange - EGX, Saudi Exchange - TADAWUL, Nasdaq). *Attributes:* Exchange Identifier, MIC Code, Country, Operating Currency, Timezone, Regulatory Body. *Relationships:* Contains Markets; associated with MarketCalendar.
4.  **Market:** A specific trading segment or sub-venue within an exchange (e.g., EGX Main Market, EGX Small & Medium Enterprises - Nilex). *Attributes:* Market Identifier, Name, Segment Rules, Listing Standards. *Relationships:* Belongs to an Exchange; hosts Instruments.
5.  **MarketSession:** A defined operational time window within a trading day for a market (e.g., Pre-Open Auction, Continuous Trading, Post-Close). *Attributes:* Session Identifier, Session Type, Planned Start Time, Planned End Time, Current Operational Status. *Relationships:* Governed by MarketCalendar; associated with Exchange.
6.  **Instrument:** A specific tradable contract referencing an Asset listed on a specific Market (e.g., COMI.CA on EGX). *Attributes:* Instrument Identifier, Ticker Symbol, ISIN, Trading Currency, Lot Size, Tick Size Rules, Listing Status. *Relationships:* References an Asset; listed on a Market; has Price histories.
7.  **Price:** A verified monetary valuation snapshot for an Instrument at a specific point in time. *Attributes:* Timestamp, Bid Price, Ask Price, Last Traded Price, Volume, Source Attribution, Currency Context. *Relationships:* Belongs to an Instrument; sourced from DataSource.
8.  **OHLCV:** Standardized aggregated price bar summarizing market action over a defined time interval (e.g., 1-minute, 1-day). *Attributes:* Time Interval, Open Price, High Price, Low Price, Close Price, Total Volume, Turnover, Adjusted Close. *Relationships:* Belongs to an Instrument.
9.  **Dividend:** A distribution of corporate earnings allocated to eligible shareholders. *Attributes:* Declaration Date, Ex-Dividend Date, Record Date, Payment Date, Dividend Per Share Amount, Dividend Currency, Dividend Type (Cash/Stock). *Relationships:* Associated with an Asset; updates Portfolios.
10. **CorporateAction:** An official event initiated by an issuing company that impacts its outstanding securities or financial structure. *Attributes:* Action Identifier, Action Type (Split, Dividend, Rights Issue, Merger), Announcement Date, Effective Date, Adjustment Factor, Status. *Relationships:* Belongs to an Asset; adjusts Instrument price history and Portfolios.
11. **FinancialStatement:** Normalized financial report detailing an issuing entity's financial position over a accounting period. *Attributes:* Statement Period, Accounting Standard (IFRS, EAS), Filing Date, Balance Sheet Metrics, Income Statement Metrics, Cash Flow Metrics, Currency Context. *Relationships:* Belongs to an Asset.
12. **EarningsReport:** Detailed disclosure summarizing quarterly financial results, earnings surprises, and corporate guidance. *Attributes:* Fiscal Quarter, Report Release Date, Reported EPS, Consensus EPS, Revenue Reported, Guidance Summary, Surprise Percentage. *Relationships:* Associated with an Asset and FinancialStatement.
13. **EconomicIndicator:** A macroeconomic statistical series tracking country-level economic health. *Attributes:* Indicator Code, Country Code, Indicator Name (CPI, Interest Rate, GDP), Observation Date, Value, Unit of Measure, Frequency. *Relationships:* Associated with a Country/Locale.
14. **NewsItem:** Unstructured or semi-structured financial article, press disclosure, or media report. *Attributes:* News Identifier, Headline, Source Agency, Publication Timestamp, Body Text, Article Language (Arabic/English), URL Reference. *Relationships:* Tagged to Assets/Instruments; analyzed for SentimentScore.
15. **SentimentScore:** Quantitative metrics deriving news or market sentiment for an entity. *Attributes:* Polarity Score (-1.0 to +1.0), Subjectivity Score, Confidence Rating, Model Reference, Timestamp. *Relationships:* Derived from NewsItem; linked to Asset.
16. **ResearchReport:** Synthesized equity or sector research document containing analytical models and valuation conclusions. *Attributes:* Report Identifier, Title, Executive Summary, Valuation Target Price, Moat Rating, Key Risks, Author/AI Model Reference, Publication Date. *Relationships:* References Asset; consumed by UserProfiles.
17. **AISignal:** Quantitative event flag generated by analytical algorithms indicating market setup conditions. *Attributes:* Signal Identifier, Signal Type, Direction (Bullish/Bearish/Neutral), Timeframe, Signal Strength Score, Trigger Timestamp, Expiry Timestamp. *Relationships:* Belongs to Instrument; evaluated by Alert rules.
18. **Recommendation:** Personalized, explainable investment proposal generated by AI engines for a specific user profile. *Attributes:* Recommendation Identifier, Targeted Action (Accumulate, Hold, Reduce), Horizon, Target Valuation, Rationale Text, Assumptions List, Downside Risk Text, Expiry Date. *Relationships:* References Asset; created for UserProfile and Portfolio; uses ConfidenceScore.
19. **ConfidenceScore:** Standardized statistical score reflecting AI uncertainty regarding an inference or recommendation. *Attributes:* Percentage Score (0.00% to 100.00%), Data Freshness Factor, Historical Model Accuracy Score, Calibration Method. *Relationships:* Component of Recommendation and AISignal.
20. **RiskProfile:** Evaluated classification of a user's financial capacity, loss tolerance, and investment horizon. *Attributes:* Risk Score, Capacity Tier (Conservative, Moderate, Growth, Aggressive), Horizon Years, Max Drawdown Threshold, Last Assessment Date. *Relationships:* Belongs to UserProfile; governs Recommendation logic.
21. **Portfolio:** Managed collection of financial assets, positions, and cash ledgers owned by a user account. *Attributes:* Portfolio Identifier, Portfolio Name, Base Currency, Benchmark Identifier, Creation Date, Current Net Asset Value (NAV), Realized P&L, Unrealized P&L. *Relationships:* Owned by UserProfile; contains Positions; uses Benchmark.
22. **Position:** Current holding quantity of a specific Instrument within a Portfolio. *Attributes:* Position Identifier, Instrument Reference, Quantity Held, Average Cost Basis, Current Market Price, Total Market Value, Unrealized Gain/Loss, Currency Context. *Relationships:* Belongs to Portfolio; references Instrument.
23. **HistoricalTrade:** Record of an executed purchase, sale, or transfer transaction within a portfolio log. *Attributes:* Trade Identifier, Trade Timestamp, Transaction Type (Buy, Sell, Deposit, Dividend), Quantity, Unit Execution Price, Commission Fees, Settlement Currency. *Relationships:* Recorded in Portfolio; references Instrument.
24. **Benchmark:** Reference index or customized asset combination used to evaluate portfolio performance. *Attributes:* Benchmark Identifier, Name, Constituent Weights, Index Currency, Calculation Frequency. *Relationships:* Linked to Portfolio for Benchmark Comparison.
25. **Watchlist:** User-defined list of Instruments monitored for price movements and alerts. *Attributes:* Watchlist Identifier, Name, Creation Date, Sort Order, Tags. *Relationships:* Owned by UserProfile; contains Instruments.
26. **Alert:** Configured monitoring rule that triggers a notification upon condition fulfillment. *Attributes:* Alert Identifier, Rule Type (Price Target, Volatility Spike, Risk Breach, AI Signal), Threshold Value, Notification Channels, Active Status, Last Triggered Timestamp. *Relationships:* Owned by UserProfile; monitors Instrument or Portfolio.
27. **Strategy:** Defined methodology incorporating parameter rules, indicators, and risk limits for market analysis. *Attributes:* Strategy Identifier, Name, Parameter Configuration, Target Asset Classes, Risk Limits, Author. *Relationships:* Executed by Backtest; generates AISignals.
28. **Backtest:** Historical simulation evaluation of a Strategy against historical market data. *Attributes:* Backtest Identifier, Date Range, Initial Capital, Total Return %, Max Drawdown %, Sharpe Ratio, Win Rate %, Trade Log Snapshot. *Relationships:* Simulates a Strategy; references Instruments.
29. **UserProfile:** Authoritative record of a registered user's identity, preferences, risk profile, and platform settings. *Attributes:* User Identifier, Preferred Language (Arabic/English), Preferred Calendar System, Preferred Currency, Risk Profile Reference, Account Status, Registration Date. *Relationships:* Owns Portfolios, Watchlists, Alerts, Subscriptions.
30. **Subscription:** Record of user commercial service tier entitlements and feature access limits. *Attributes:* Subscription Identifier, Plan Tier (Basic, Premium, Enterprise), Start Date, Expiry Date, Billing Currency, Active Features List. *Relationships:* Linked to UserProfile.
31. **Notification:** Formatted message payload dispatched to a user device. *Attributes:* Notification Identifier, Priority (Low, Medium, High, Critical), Headline, Body Text, Target Route, Dispatch Timestamp, Read Status. *Relationships:* Sent to UserProfile; generated by Alert.
32. **AuditLog:** Immutable record detailing a system event, user action, AI output, or data modification. *Attributes:* Log Identifier, Timestamp, Actor ID, Event Category, Action Description, Request Payload Snapshot, Result Status, Correlation Token. *Relationships:* Generated by all system operations for Compliance Officers.
33. **Currency:** Defined monetary unit of exchange used for financial valuation and accounting. *Attributes:* Currency ISO Code (e.g., EGP, SAR, USD), Currency Name, Symbol, Sub-unit Precision. *Relationships:* Used by Price, Portfolio, Instrument, Exchange.
34. **ExchangeRate:** Conversion factor between two explicit Currencies at a specific timestamp. *Attributes:* Base Currency Code, Quote Currency Code, Rate Value, Timestamp, Rate Source Attribution. *Relationships:* Used by Multi-Currency Service.
35. **MarketCalendar:** Authoritative operational schedule for an Exchange detailing trading days, session hours, and holiday schedules. *Attributes:* Calendar Identifier, Exchange MIC Code, Year, Operating Days List, Official Holidays List, Session Schedules. *Relationships:* Governs Exchange and MarketSession.
36. **Locale:** Configuration defining language, region, calendar system, and number formatting rules for user interfaces. *Attributes:* Locale Code (e.g., ar-EG, en-US), Language Code, Region Code, Calendar System (Gregorian/Hijri), Number System. *Relationships:* Applied to UserProfile and UI presentation.
37. **DataSource:** Authoritative external entity or feed provider delivering market pricing, financial statements, or news. *Attributes:* Source Identifier, Source Name, License Type, Reliability Rating, Update Frequency SLA. *Relationships:* Sourced by Price, NewsItem, FinancialStatement.
38. **FactorScore (Additional):** Quantitative factor metric evaluating an asset across dimensions such as Value, Quality, Momentum, Low Volatility, and Size. *Attributes:* Asset Reference, Factor Code, Score Value (-3.0 to +3.0), Percentile Rank, Calculation Date. *Relationships:* Belongs to Asset.
39. **FairValueModel (Additional):** Mathematical intrinsic valuation calculation payload for a security. *Attributes:* Asset Reference, Model Type (DCF, DDM, Asset-Based), Calculated Fair Value Amount, Discount Rate Used, Terminal Growth Rate Used, Margin of Safety %. *Relationships:* Belongs to Asset.

---

## 10. Business Rules

1.  Every AI recommendation must include: explicit rationale, confidence level percentage, key underlying assumptions, and downside risk disclosures.
2.  Historical market data is immutable once recorded; corrections must be appended as auditable adjustment records.
3.  AI systems never initiate trades or execute orders autonomously without explicit human authorization.
4.  Portfolio performance calculations must be strictly reproducible, deterministic, and auditable.
5.  A position cannot be valued without a verified price source and explicit timestamp.
6.  Risk assessments must directly reference the user's declared and verified risk profile.
7.  No financial data may be displayed without clear source attribution and execution timestamp.
8.  Market session hours are always derived from the exchange's official local calendar—never hardcoded assumptions.
9.  Corporate actions must be reflected in portfolio valuations within one business day of official exchange confirmation.
10. User financial data and portfolio holdings are strictly private and never shared across accounts without consent.
11. All monetary values must carry explicit ISO currency context.
12. Cross-currency calculations must use a declared, timestamped exchange rate source.
13. Every recommendation has an explicit expiry timestamp; it must not be displayed past its validity window without explicit refresh.
14. A benchmark comparison is only valid when the benchmark and portfolio share the same base currency or an explicit currency conversion is disclosed.
15. Financial statement ratio calculations must adhere to standardized, documented accounting formulas (IFRS/EAS).
16. Unverified news or speculative social media rumors must never be processed as verified financial facts.
17. User risk profiles must undergo mandatory re-evaluation at least annually or following major portfolio drawdown events.
18. Real-time quote stream latency must not exceed defined SLA boundaries for active trading capabilities.
19. Language switching between Arabic and English must preserve full operational state without data loss.
20. Rights and entitlement access limits must be enforced on every data request at the platform boundary.
21. All user-facing AI financial explanations must support native Right-to-Left (RTL) Arabic typography.
22. Price adjustment calculations following stock splits or bonus shares must preserve historical percentage returns.
23. The platform must maintain strict operational separation between informative financial intelligence and licensed individual advice.
24. Audit logs are tamper-evident and must be retained in accordance with local regulatory retention schedules.
25. Portfolio Cash balances cannot drop below zero unless an explicit overdraft/margin facility is registered.
26. Fair value models must explicitly disclose sensitivity matrices for key input variables (e.g., WACC, growth rates).
27. Asset ticker symbols must be uniquely qualified by Exchange MIC code to prevent cross-market ambiguity.
28. Sector and industry classifications must conform to standard international classification frameworks (e.g., GICS).
29. High-priority risk threshold alerts must override muted non-essential notification settings.
30. Market holiday schedules must be updated at least 30 days in advance of the calendar year start.
31. Automated backtesting simulations must account for bid-ask spreads and estimated trading fee drag.
32. User session timeouts must enforce re-authentication to protect sensitive financial portfolios.
33. System feature flags must allow instantaneous disabling of failing data feeds without disrupting total platform availability.
34. Yield calculations on fixed-income instruments must explicitly declare clean vs. dirty price basis and day-count conventions.
35. Historical financial statements must be preserved in their original reported currencies alongside normalized reporting currency views.
36. (Rule 36) Stop-loss and risk warning alerts must present clear visual severity distinctions based on portfolio impact.
37. (Rule 37) Multi-currency portfolios must display foreign exchange impact separately from organic asset capital gains.
38. (Rule 38) AI model confidence scores below defined threshold levels (e.g., < 60%) must automatically suppress automated recommendation generation.
39. (Rule 39) Market session transitions must log explicit system state change events for downstream analytical alignment.
40. (Rule 40) No analytical score or indicator may use future data in historical backtesting calculations (prohibition of look-ahead bias).

---

## 11. Business Constraints

### 11.1 Regulatory Constraints
*   **Information vs. Advice Boundary:** Tradeora operates strictly as an AI-powered financial intelligence and decision-support operating system. It provides explainable analytics, quantitative modeling, and generalized recommendations grounded in user profiles. It does *not* operate as a discretionary money manager, broker-dealer, or individualized licensed investment advisor without explicit regional licensing. All UI views must feature clear, contextual regulatory disclaimers.
*   **Egyptian Regulatory Framework (FRA):** Operation on EGX must strictly satisfy the rules of the Egyptian Financial Regulatory Authority (FRA), including data privacy laws, local cloud sovereignty/data storage compliance options, and non-custodial functional boundaries.
*   **Multi-Jurisdiction Expansion Framework:** As Tradeora expands across MENA (CMA in Saudi Arabia, SCA in UAE) and globally (SEC, FCA), the platform’s business model boundary dynamically adapts its regulatory disclosures and feature permissions per jurisdiction via localized compliance configuration modules.

### 11.2 Operational Constraints
*   **Data Licensing Dependencies:** Market data feeds (real-time ticks, depth, delayed quotes) are subject to strict legal licensing agreements with exchanges and data vendors. Redistribution rights, delayed feed rules (e.g., 15-minute delay for free tiers), and subscriber counts must be enforced by entitlement engines.
*   **Exchange Session Dependencies:** Data freshness, order book depth, and pricing indicators depend directly on local exchange session operational states. Systems must gracefully handle market closures, weekend gaps, auction phases, and unannounced emergency session halts.
*   **Acceptable Data Latency Ranges:** Real-time active trading workflows require sub-second tick ingestion latency (< 500ms); equity research and fundamental statement analysis tolerate latencies up to several minutes; macroeconomic series and EOD valuations operate on daily batch cycles.

### 11.3 Financial Constraints
*   **Monetization & Subscription Boundaries:** Business revenue is generated through SaaS subscriptions (Basic, Professional, Enterprise tiers), API volume quotas, and B2B white-label licensing. Revenue models must strictly avoid conflict-of-interest monetization (e.g., payment for order flow / PFOF or paid promotional asset bias).
*   **Multi-Currency Billing:** Billing systems must support multi-currency payment processing (EGP, SAR, AED, USD, EUR) with transparent currency conversions and local tax compliance (e.g., VAT handling in Egypt and GCC).

### 11.4 Localization and Internationalization Constraints
*   **First-Class Native Launch Languages:** Arabic and English are first-class, fully supported launch languages with complete feature parity across all UI screens, reports, and AI interactions.
*   **Flexible Regional Locale System:** The platform must natively support any language, any calendar system (Gregorian, Hijri, Persian), any number format (Western Arabic numerals `123`, Eastern Arabic numerals `١٢٣`), and any currency display. Locale settings are *always* dynamic user configurations—never hardcoded assumptions.

---

## 12. Business Events

1.  **Market Session Opens:** Triggered by Market Calendar; signals transition of a specific exchange into active trading session status. *Consumers:* Price Engine, Alert Engine, Ingestion Service.
2.  **Market Session Closes:** Triggered by Market Calendar; signals end of continuous trading session. *Consumers:* EOD Processing Engine, Valuation Service, Portfolio Tracker.
3.  **Price Tick Received:** Triggered by Exchange Data Feed; represents a new executed trade or quote update. *Consumers:* Price Intelligence, Real-Time Alert Engine.
4.  **EOD Prices Published:** Triggered by Exchange / Vendor; provides official closing prices and daily high/low/volume totals. *Consumers:* Portfolio Valuation Service, Performance Analytics, Historical DB.
5.  **Dividend Announced:** Triggered by Corporate Action Feed; announces upcoming cash/stock dividend distribution parameters. *Consumers:* Portfolio Service, Corporate Action Tracker.
6.  **Split Announced:** Triggered by Corporate Action Feed; announces stock split or reverse split ratios and dates. *Consumers:* Historical Price Adjustment Engine, Portfolio Service.
7.  **Earnings Report Released:** Triggered by Company Disclosure Feed; delivers quarterly financial statement filings. *Consumers:* Financial Statement Analysis, Earnings Intelligence, AI Recommendation Engine.
8.  **Economic Data Published:** Triggered by Macro Data Vendor / Central Bank; releases new economic indicator values (e.g., inflation rate). *Consumers:* Macro Intelligence Engine, Risk Evaluator.
9.  **News Item Published:** Triggered by News Wire Feed; delivers new financial news article or press release. *Consumers:* Sentiment Analyzer, AI Research Generator, User Watchlists.
10. **AI Recommendation Generated:** Triggered by AI Recommendation Engine; creates a personalized investment proposal payload. *Consumers:* End-User Client, Notification Service, Audit Log.
11. **Risk Alert Triggered:** Triggered by Risk Assessment Service; flags a portfolio VaR breach, concentration limit violation, or drawdown alert. *Consumers:* Alert Notification Engine, Portfolio Dashboard.
12. **Portfolio Value Changed:** Triggered by Portfolio Tracking Service; recalculates NAV following price movements or transactions. *Consumers:* User Interface, Risk Engine.
13. **Benchmark Crossed:** Triggered by Performance Analytics Engine; indicates a portfolio outperforming or underperforming its benchmark index by a predefined threshold. *Consumers:* User Notification Engine.
14. **Watchlist Alert Fired:** Triggered by Price Intelligence / Alert Engine; flags an asset hitting a user's price target or volume spike limit. *Consumers:* Push Notification Engine.
15. **User Portfolio Updated:** Triggered by User Action or Automated Corporate Action; records new position purchase, sale, or cash adjustment. *Consumers:* Portfolio Ledger, Risk Engine, Tax Service.
16. **Corporate Action Processed:** Triggered by Corporate Action Service; confirms execution of split/dividend adjustment in portfolio records. *Consumers:* Portfolio Tracker, User Audit View.
17. **New User Registered:** Triggered by Onboarding Intelligence; creates a new User Profile record. *Consumers:* Profile Service, Entitlement Engine, Risk Profiler.
18. **Subscription Changed:** Triggered by Billing Service; updates user access tier permissions upon plan upgrade, downgrade, or renewal. *Consumers:* Entitlement Engine, Feature Access Gate.
19. **Data Feed Interrupted:** Triggered by Platform Health Monitoring; flags an unexpected loss of connectivity or quote stream stall from a data vendor. *Consumers:* Admin Operations, Fallback Failover Router.
20. **Data Feed Restored:** Triggered by Platform Health Monitoring; confirms re-establishment of data stream connection. *Consumers:* Data Reconciler, Admin Operations.
21. **Cross-Market Signal Detected:** Triggered by Cross-Market Analysis Engine; identifies dual-listing spread or regional sector valuation arbitrage opportunity. *Consumers:* Quantitative Signal Subscribers, AI Research Engine.
22. **Currency Rate Updated:** Triggered by Foreign Exchange Data Feed; updates spot exchange rate between currency pairs. *Consumers:* Multi-Currency Portfolio Service, Converted Price Engine.
23. **Market Added to Platform:** Triggered by Administrative Governance; onboard a new global or regional exchange to platform coverage. *Consumers:* Security Master, Calendar Engine, Data Ingestion Router.
24. **New Asset Class Enabled:** Triggered by Administrative Governance; activates platform support for a new asset type (e.g., Commodities, REITs). *Consumers:* Analytical Engine, Valuation Models, UI Screening.

---

## 13. Business Decisions

```
┌───────────────────────────────────────────────────────────────────────────┐
──────────────────────── TRADEORA BUSINESS DECISIONS ───────────────────────
├───────────────────────────────────────────────────────────────────────────┤
│ 1. AI-Assisted Decisions:                                                │
│    • Asset Valuation & Intrinsic Fair Value Estimation                   │
│    • Earnings Report Sentiment & Surprise Analysis                       │
│    • Portfolio Rebalancing Strategy Proposal Synthesis                   │
│    • Personalized Investment Opportunity Recommendation                  │
├───────────────────────────────────────────────────────────────────────────┤
│ 2. Human-Only Decisions:                                                  │
│    • Capital Allocation & Trade Execution Confirmation                   │
│    • User Personal Risk Tolerance & Target Goal Definition               │
│    • Advisor Client Suitability Override & Legal Advice Approval         │
│    • Enterprise Commercial Terms & Platform Subscription Selection      │
├───────────────────────────────────────────────────────────────────────────┤
│ 3. System-Automated Decisions:                                           │
│    • Market Session State Transition & Stream Mode Routing              │
│    • Price Adjustment Calculation for Corporate Actions (Splits)        │
│    • Multi-Currency Conversion Rate Application                          │
│    • High-Priority Risk Threshold Breach Alert Dispatch                  │
├───────────────────────────────────────────────────────────────────────────┤
│ 4. Decisions Requiring Human Confirmation:                               │
│    • Portfolio Target Model Rebalancing Trade Execution                   │
│    • Risk Profile Score Modification based on Questionnaire Answers       │
│    • Watchlist & Alert Rule Creation / Parameter Deletion                │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 14. Business Policies

1.  **Data Retention Policy:** Historical tick and OHLCV price series are retained indefinitely as immutable financial history. User audit logs, system transaction records, and AI inference payloads are retained for a minimum of 7 years to satisfy international regulatory compliance standards.
2.  **Recommendation Freshness Policy:** AI recommendations carry strict validity windows (e.g., 24 hours for tactical setups, 30 days for fundamental value proposals). Stale recommendations past their expiry timestamp must be visually marked as expired and suppressed from active decision views until explicitly refreshed.
3.  **Alert Escalation Policy:** Risk threshold breaches (e.g., severe portfolio VaR exceedance or liquidation drawdown warnings) trigger immediate multi-channel escalation (in-app banner, high-priority push, and email notification), bypassing low-priority notification throttles.
4.  **User Data Privacy & Isolation Policy:** Customer financial portfolio holdings, personal trade histories, and risk parameters are classified as strictly confidential. User data is logically isolated per account tenant and is *never* aggregated or exposed to train public global AI models without explicit opt-in consent.
5.  **Subscription Access Policy:** Feature entitlements and market data permissions are enforced strictly according to active subscription tiers. Users attempting to access data feeds or advanced analytical tools outside their active entitlement tier are prompted with clear upgrade pathways.
6.  **Data Source Failover Policy:** If a primary market data ingestion stream degrades or experiences an outage exceeding SLA threshold limits, the platform automatically fails over to a secondary verified data vendor stream while logging an operational alert.
7.  **Cross-Market Data Consistency Policy:** Valuations and pricing across dual-listed securities or cross-border assets must utilize synchronized, timestamped exchange rates derived from an authoritative central bank or Tier-1 FX provider to eliminate currency calculation drift.
8.  **AI Explainability Governance Policy:** No AI recommendation, score, or analytical summary may be rendered in a user-facing context without including explicit causal rationale, confidence scores, underlying assumptions, and downside risk warnings.
9.  **Market Data Licensing Compliance Policy:** The platform strictly enforces exchange data redistribution rules, including maintaining clear operational boundaries between real-time data subscribers and delayed data viewers.
10. **Model Auditability Policy:** Every production AI model version, prompt template, retrieval dataset snapshot, and hyperparameter configuration must be tracked under version control, enabling exact historical reproduction of any AI analytical output.

---

## 15. Business Metrics

### 15.1 Platform KPIs
*   **Monthly Active Users (MAU) / Daily Active Users (DAU):** Total count of unique active user accounts engaging with platform intelligence. Target: > 40% DAU/MAU ratio.
*   **Annual Recurring Revenue (ARR):** Total predictable subscription revenue generated across retail, professional, and enterprise tiers. Target: 150% YoY growth.
*   **Customer Churn Rate:** Percentage of subscribed users canceling plans within a monthly cycle. Target: < 2.5% monthly churn.

### 15.2 AI Quality KPIs
*   **Recommendation Accuracy & Calibration:** Correlation between predicted AI target valuation bands and actual historical security performance over defined validity windows. Target: > 82% calibration accuracy.
*   **AI Hallucination Rate:** Percentage of AI-generated summaries containing unverified, non-grounded financial facts. Target: 0.00% (absolute zero tolerance).
*   **Recommendation Explainability Score:** Quantitative user evaluation rating the clarity and utility of AI reasoning breakdowns. Target: > 4.5 / 5.0 rating.

### 15.3 User Success KPIs
*   **Time to Insight (TTI):** Elapsed duration from user query initiation to rendering of actionable financial intelligence. Target: < 3 seconds.
*   **Risk-Adjusted Portfolio Return (Sharpe Improvement):** Average improvement in user portfolio Sharpe ratio following adoption of platform risk recommendations. Target: +15% Sharpe optimization.
*   **User Decision Confidence Index:** Surveyed percentage of users reporting higher clarity and lower anxiety regarding capital allocation decisions. Target: > 88%.

### 15.4 Data Quality KPIs
*   **Market Data Ingestion Latency:** Delay between exchange tick publishing and platform availability. Target: < 500ms for real-time feeds.
*   **Corporate Action Processing Speed:** Elapsed time between official exchange corporate action confirmation and portfolio adjustment. Target: < 4 hours (100% within 1 business day).
*   **Financial Statement Extraction Accuracy:** Percentage of correctly normalized XBRL/PDF financial statement metrics against original filings. Target: > 99.8%.

### 15.5 Operational KPIs
*   **System Availability Uptime:** Percentage of operational uptime across core analytical services and market data streams. Target: 99.95% availability.
*   **Mean Time to Detect (MTTD) / Resolve (MTTR):** Average time taken to identify and resolve operational platform incidents. Target: MTTD < 5 mins, MTTR < 30 mins.

### 15.6 Market Coverage KPIs
*   **Asset Coverage Ratio:** Percentage of total active listed securities covered by full platform analytics within a target market. Target: 100% of listed EGX assets; > 95% across expansion MENA markets.

---

## 16. Business Risks

| Risk Category | Description | Likelihood | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Market Data Risk** | Inaccurate, delayed, or corrupted price feeds from exchanges or vendor partners. | Medium | High | Multi-source feed validation, automated anomaly sanity checks, instant fallback failover routes. |
| **AI Accuracy Risk** | AI models generating misleading recommendations, bad sentiment reads, or uncalibrated scores. | Medium | High | Strict RAG grounding, mandatory confidence score thresholds, human-in-the-loop oversight, continuous backtesting. |
| **Regulatory Risk (Multi-Jurisdiction)**| Changing regulatory requirements regarding AI governance, financial advice boundaries, or cloud data hosting. | Medium | High | Explicit information vs. advice operational boundary, jurisdiction-specific compliance modules, local legal counsel. |
| **Operational Risk** | Cloud infrastructure outages, streaming pipeline stalls, or session state synchronization failures. | Low | High | Active-active redundant architecture, automated cluster recovery, circuit breaker patterns, strict SLAs. |
| **Data Privacy Risk** | Unauthorized breach or disclosure of private customer portfolio holdings or user identity data. | Low | Critical | Zero-trust encryption at rest and in transit, tenant data isolation, strict access control, zero model training on private data. |
| **Vendor Dependency Risk** | Over-reliance on single third-party data providers or cloud vendors leading to lock-in or cost spikes. | Medium | Medium | Open integration abstractions, vendor-neutral protocols, multi-vendor data contracts. |
| **User Trust Risk** | Loss of user confidence due to unexplained loss scenarios, bad AI outputs, or system downtime. | Low | Critical | Unwavering mathematical explainability, transparent risk warnings, zero-hallucination policy, high uptime focus. |
| **Competitive Risk** | Legacy market terminal incumbents or regional portals copying features or lowering prices. | High | Medium | Differentiation through native Arabic-first AI experience, superior UX, accessible pricing, fast innovation velocity. |
| **Financial Risk** | Subscription churn or unoptimized AI inference infrastructure costs eroding unit margins. | Medium | Medium | Optimized model routing, caching strategies, disciplined unit economics monitoring, high LTV/CAC target ratios. |
| **Multi-Market Complexity Risk**| Operational friction handling disparate settlement rules, corporate action standards, currencies, and languages. | Medium | Medium | Global-first domain architecture, market-agnostic core models, market rules encapsulated in dynamic configuration layers. |

---

## 17. Domain Glossary — Ubiquitous Language

*This section serves as the definitive single source of truth for all concepts and terminology used across the Tradeora ecosystem. No synonyms are permitted.*

1.  **Account (حساب):** The legal identity, credential profile, and administrative subscription relationship of a user with Tradeora.
2.  **Accumulate (تجميع):** An AI investment recommendation direction proposing a gradual increase in position exposure based on fundamental undervaluation.
3.  **Active Trader (متداول نشط):** A user actor focused on short-term market setups, technical indicators, and rapid alert responsiveness.
4.  **Alert (تنبيه):** A machine-evaluated condition rule that dispatches notifications upon threshold fulfillment.
5.  **Alpha (ألفا):** A quantitative metric measuring a portfolio's risk-adjusted excess return relative to a benchmark index.
6.  **Arbitrage (مضاربة هيكلية / فرق سعر):** The practice of exploiting price discrepancies for the same asset across different markets or forms.
7.  **Asset (أصل):** An underlying economic entity or financial instrument possessing intrinsic economic value.
8.  **Asset Class (فئة الأصول):** A grouping of financial instruments sharing similar financial structures and regulatory characteristics.
9.  **Audit Log (سجل التدقيق):** An immutable, tamper-evident record capturing system transactions, user actions, and AI inferences.
10. **Backtest (اختبار رجي / اختبار تاريخي):** Simulation evaluation of an investment strategy against historical market price data.
11. **Balance Sheet (الميزانية العمومية):** Financial statement summarizing an entity's assets, liabilities, and shareholders' equity at a specific point in time.
12. **Base Currency (العملة الأساسية):** The primary currency selected for portfolio valuation and accounting consolidation.
13. **Benchmark (مؤشر القياس / الاسترشاد):** A standardized reference index used to evaluate portfolio performance and risk metrics.
14. **Beta (بيتا):** A measure of an asset's or portfolio's sensitivity and volatility relative to the broader market.
15. **Beginner Investor (مستثمر مبتدئ):** A user actor seeking wealth preservation, fundamental education, and low-complexity guided insights.
16. **Bid-Ask Spread (فارق سعر البيع والشراء):** The monetary difference between the highest price a buyer is willing to pay and the lowest price a seller is willing to accept.
17. **Black-Litterman Model (نموذج بلاك-ليترمان):** A mathematical portfolio optimization methodology combining market equilibrium with investor views.
18. **Cash Flow Statement (قائمة التدفقات النقدية):** Financial statement reporting cash inflows and outflows across operating, investing, and financing activities.
19. **Compliance Officer (مسؤول الالتزام):** A human actor responsible for auditing platform operations against regulatory frameworks.
20. **Confidence Score (درجة الثقة):** A quantitative percentage (0-100%) indicating an AI model's statistical certainty regarding an inference.
21. **Corporate Action (إجراء الشركات):** An official event initiated by an issuing company impacting its outstanding securities or capitalization.
22. **Correlation Matrix (مصفوفة الارتباط):** A statistical matrix quantifying directional co-movement relationships between multiple financial assets.
23. **Discounted Cash Flow / DCF (خصم التدفقات النقدية):** A valuation methodology estimating an asset's intrinsic fair value based on projected future cash flows discounted to present value.
24. **Dividend (توزيعات الأرباح):** Distribution of corporate earnings allocated to eligible shareholders.
25. **Dividend Yield (عائد توزيع الأرباح):** Annual dividend payout expressed as a percentage of current asset market price.
26. **Downside Risk (مخاطر الهبوط):** Quantitative evaluation of potential financial loss under adverse market conditions.
27. **Earnings Per Share / EPS (ربحية السهم):** Corporate net income divided by outstanding common shares.
28. **Earnings Report (تقرير الأرباح):** Quarterly disclosure of financial results, earnings performance, and corporate guidance.
29. **Economic Indicator (مؤشر اقتصادي):** Macroeconomic statistical metric tracking national or regional economic health.
30. **Equity Research (بحث أسهم):** Comprehensive fundamental and quantitative analysis evaluating listed company valuation and health.
31. **Ex-Dividend Date (تاريخ تجريد الأرباح):** The cutoff date on or after which a security buyer is no longer entitled to receive the declared dividend.
32. **Exchange (بورصة / سوق مالي):** An organized, licensed venue where financial instruments are listed and traded.
33. **Exchange Rate (سعر الصرف):** The conversion factor between two distinct currencies at a specific point in time.
34. **Execution (تنفيذ):** The completion of a trade transaction in a market venue (distinct from an Order).
35. **Fair Value (القيمة العادلة):** Calculated objective intrinsic valuation of an asset based on mathematical modeling.
36. **Financial Advisory (استشارات مالية):** Client decision support workflows delivered by licensed wealth professionals.
37. **Financial Operating System / Financial OS (نظام التشغيل المالي):** Tradeora's core platform architecture delivering unified data ingestion, analytics, risk, and intelligence.
38. **Financial Statement (القوائم المالية):** Standardized reporting packages detailing an entity's financial health.
39. **Fund Manager (مدير صندوق):** A human actor responsible for managing institutional investment funds against mandate targets.
40. **Hold (احتفاظ):** An AI recommendation direction proposing maintenance of current position exposure without buying or selling.
41. **Income Statement (قائمة الدخل):** Financial statement summarizing revenues, expenses, and net profit over a reporting period.
42. **Insight (رؤية تحليلية):** An enriched, contextualized analytical output produced by processing raw market data through AI engines.
43. **Instrument (أداة مالية):** A tradable financial contract referencing an Asset within a specific Exchange market segment.
44. **Internationalization / i18n (العالمية والتوطين):** Platform capability supporting arbitrary languages, calendar systems, number formats, and currency displays.
45. **Intraday (خلال الجلسة):** Market price movements and trades occurring within a single trading day's session.
46. **Intrinsic Value (القيمة الجوهرية):** The true mathematical value of an asset based on fundamental cash flow and asset evaluation.
47. **Liquidity (السيولة):** The ease with which an asset can be converted into cash without causing significant price impact.
48. **Locale (الإعدادات الإقليمية):** User configuration defining language, region, calendar system, and formatting preferences.
49. **Long-Term Investor (مستثمر طويل الأجل):** A user actor focused on multi-year fundamental capital compounding and dividend income.
50. **Market Calendar (تقويم السوق):** Authoritative schedule governing exchange trading days, session hours, and official holidays.
51. **Market Data (بيانات السوق):** Real-time, intraday, and historical price ticks, quotes, volumes, and order book snapshots.
52. **Market Session (جلسة التداول):** A defined operational time window within a trading day on an exchange.
53. **Net Asset Value / NAV (صافي قيمة الأصول):** Total market value of portfolio assets minus total liabilities.
54. **News Sentiment (انطباع الأخبار):** Quantitative metric assessing public media tone (positive, negative, neutral) toward an asset.
55. **OHLCV (افتتاح-أعلى-أدنى-إغلاق-حجم):** Standardized aggregate price bar containing Open, High, Low, Close prices, and Volume.
56. **Order (أمر تداول):** An instruction submitted by a user or algorithm requesting to buy or sell a security under defined parameters.
57. **Portfolio (محفظة استثمارية):** A managed collection of financial holdings, positions, and cash ledgers owned by a user account.
58. **Portfolio Manager (مدير محفظة):** A human actor managing multi-asset allocations and controlling portfolio risk exposures.
59. **Position (مركز استثماري):** Current holding quantity of a specific Instrument within a Portfolio.
60. **Price (السعر):** A verified monetary valuation snapshot for an Instrument at a specific timestamp.
61. **Recommendation (توصية استثمارية):** A personalized, explainable, risk-adjusted analytical proposal synthesized by AI for a user profile.
62. **Reduce (تخفيض):** An AI recommendation direction proposing a decrease in position exposure to lock in gains or mitigate risk.
63. **Research Analyst (محلل بحوث):** A human actor producing fundamental financial models, earnings analyses, and equity notes.
64. **Risk Profile (ملف المخاطر):** Evaluated classification of a user's financial capacity, loss tolerance, and investment horizon.
65. **Sector (قطاع):** Industry grouping aggregating listed companies sharing core business activities (e.g., Banking, Real Estate).
66. **Security Master (السجل الرئيسي للأوراق المالية):** Centralized authoritative database unifying ticker definitions, ISINs, and asset classifications.
67. **Sharpe Ratio (مؤشر شارب):** Risk-adjusted performance metric calculating excess return per unit of total volatility.
68. **Signal (إشارة تحليلية):** Raw quantitative output generated by mathematical algorithms indicating specific market setups.
69. **Strategy (استراتيجية):** High-level financial methodology combining quantitative algorithms, risk constraints, and rules.
70. **Subscription (اشتراك):** Commercial entitlement record governing user platform access tiers and feature limits.
71. **Ticker Symbol (رمز السهم / الأداة):** Standardized alphanumeric code representing an Instrument listed on an exchange (e.g., COMI.CA).
72. **Time-Weighted Return / TWR (العائد الموزون بالزمن):** Performance calculation method eliminating the distortion of external cash inflows and outflows.
73. **Time to Insight / TTI (زمن الوصول للرؤية):** Elapsed time between user query initiation and rendering of actionable financial intelligence.
74. **Value at Risk / VaR (القيمة المعرضة للمخاطر):** Statistical measure quantifying maximum potential portfolio financial loss over a time horizon at a given confidence level.
75. **Watchlist (قائمة المتابعة):** User-defined collection of Instruments monitored for price movements and alerts.
76. **Wealth Advisor (مستشار ثروات):** A human actor delivering tailored financial plans and portfolio guidance to private clients.

---

## 18. Domain Boundaries

```
┌────────────────────────────────────────────────────────────────────────────┐
────────────────────── TRADEORA BOUNDED CONTEXT DOMAIN MAP ──────────────────
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─ UPSTREAM PROVIDERS ────────────────────────────────────────────────┐  │
│  │  [Market Data] ─────────────────────────────► [Market Calendar]    │  │
│  │       │                                                             │  │
│  │       ▼                                                             │  │
│  │  [Financial Research] ──────────────────────► [AI Intelligence]    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                  │                                      │                  │
│                  ▼                                      ▼                  │
│  ┌─ CORE DOMAINS ──────────────────────────────────────────────────────┐  │
│  │            [Portfolio] ◄────────────────────────────────────────┐   │  │
│  │                 │                                               │   │  │
│  │                 ▼                                               │   │  │
│  │           [Risk Engine] ────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                  │                                                         │
│                  ▼                                                         │
│  ┌─ DELIVERY & CROSS-CUTTING ──────────────────────────────────────────┐  │
│  │  [Alert & Notification] ──► [User & Identity] ──► [Subscription]   │  │
│  │                                    │                    │           │  │
│  │                                    ▼                    ▼           │  │
│  │                             [Reporting]        [Admin & Audit]      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ╔═ PASSIVE SHARED LIBRARY — NO INBOUND CALLS ════════════════════════╗  │
│  ║  [Localization] publishes formatting contracts only.               ║  │
│  ║  Each domain's presentation layer consumes independently.          ║  │
│  ║  Localization has NO outbound arrows and receives NO runtime calls. ║  │
│  ╚═════════════════════════════════════════════════════════════════════╝  │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│  FUTURE DOMAIN BOUNDARIES:                                                 │
│  [Execution Domain] │ [Wealth Management Domain] │ [Advisory Domain]      │
└────────────────────────────────────────────────────────────────────────────┘
```

1.  **Market Data Domain:**
    *   *Inside:* Data vendor ingestion, raw feed normalization, tick stream parsing, Security Master registry, EOD price publishing, Technical Indicator Computation (momentum, volatility, volume distribution, moving average clusters).
    *   *Outside:* User portfolio valuations, AI prompt generation, individual financial advice.
    *   *Communication:* Emits `Price Tick Received`, `EOD Prices Published`, `Corporate Action Filings`, `Technical Indicator Computed`.
2.  **Financial Research Domain:**
    *   *Inside:* Financial statement standardization (IFRS/EAS), ratio computation (DCF, P/E), earnings report parsing, sector aggregation, macro series tracking.
    *   *News and Sentiment:* News Intelligence (ingestion, entity tagging, media parsing in Arabic and English) and Sentiment Scoring (quantitative polarity/subjectivity scoring) are core capabilities strictly owned by Financial Research Domain. AI Intelligence Domain consumes these structured sentiment scores as inputs for downstream reasoning and recommendations — AI Intelligence Domain does not own raw news processing or sentiment derivation.
    *   *Outside:* Real-time tick parsing, personal portfolio tracking, direct order execution.
    *   *Communication:* Consumes `EOD Prices` and raw news feeds; emits `Financial Statement Processed`, `Earnings Report Released`, `News Item Tagged`, `Sentiment Score Calculated`.
3.  **AI Intelligence Domain:**
    *   *Inside:* RAG context retrieval, multi-agent reasoning, prompt engineering, recommendation payload generation, confidence scoring.
    *   *Outside:* Raw news ingestion, raw sentiment derivation, immutable database persistence, user account authentication.
    *   *Communication:* Consumes normalized market data, financial research metrics, and structured sentiment scores; emits `AI Recommendation Generated`.
4.  **Portfolio Domain:**
    *   *Inside:* Multi-asset position ledgers, transaction histories, cash balances, NAV calculations, performance attribution (TWR/MWR), multi-currency conversions.
    *   *Outside:* Order execution, user identity management.
    *   *Communication:* Consumes `Price Ticks`, `Corporate Actions`; emits `Portfolio Value Changed`, `User Portfolio Updated`.
5.  **Risk Domain:**
    *   *Inside:* Value-at-Risk (VaR) modeling, correlation matrices, drawdown stress-testing, risk profile scoring, sector concentration evaluation.
    *   *Outside:* Direct user notification dispatch, billing entitlements.
    *   *Communication:* Consumes `Portfolio Positions`, `Price Series`; emits `Risk Alert Triggered`, `Risk Profile Calculated`.
6.  **Alert and Notification Domain:**
    *   *Inside:* Alert rule evaluation, notification channel routing (push, email, in-app), message formatting, notification status tracking.
    *   *Outside:* Generating price ticks or financial recommendations.
    *   *Communication:* Consumes `Risk Alert Triggered`, `AISignal`, `Price Thresholds`; dispatches localized messages to users.
7.  **User and Identity Domain:**
    *   *Inside:* Authentication, user registration, profile settings, locale configurations, risk profiling questionnaire state.
    *   *Outside:* Payment processing, market data feed management.
    *   *Communication:* Emits `New User Registered`, `UserProfile Updated`.
8.  **Subscription and Entitlement Domain:**
    *   *Inside:* Commercial tier definitions, feature access enforcement, API quota tracking, payment gateway integration, invoice generation.
    *   *Outside:* Portfolio return calculations, financial modeling.
    *   *Communication:* Emits `Subscription Changed`, `Entitlement Limit Breached`.
9.  **Reporting Domain:**
    *   *Inside:* PDF/Excel report rendering, tax export formatting, equity research document compilation, chart snapshot generation.
    *   *Outside:* Real-time data streaming.
    *   *Communication:* Consumes `Portfolio Snapshots`, `Research Reports`; exports downloadable artifacts.
10. **Localization and Internationalization Domain:**
    *   *Inside:* Dynamic text translation bundles (Arabic/English), Hijri/Gregorian date formatting, currency display formatting, RTL state management.
    *   *Outside:* Domain business logic calculations.
    *   *Communication:* Provides a shared formatting library consumed by each domain's presentation layer independently. The Localization Domain does not receive runtime calls — it publishes formatting contracts and localization bundles.
11. **Administration and Audit Domain:**
    *   *Inside:* Operational system configuration, feature flag toggles, immutable audit logging, platform health dashboarding, system metric aggregation.
    *   *Outside:* End-user financial analysis.
    *   *Communication:* Ingests system logs and audit events from all domains.
12. **Market Calendar Domain:**
    *   *Inside:* Exchange operational hours management, holiday schedules, trading session state tracking (Pre-Open, Continuous, Closed), session state rules, holiday logic.
    *   *Data Source & Anti-Corruption Layer (ACL) Boundary:* Exchange schedule data is received from Market Data Domain (which ingests raw schedule data from external vendors). Market Data Domain strictly owns raw schedule ingestion, while Market Calendar Domain owns all business rules regarding session state transitions and holiday logic. The boundary between raw ingestion (Market Data) and session domain logic (Market Calendar) is formally governed by an Anti-Corruption Layer (ACL) that translates vendor schedule schemas into clean domain calendar models.
    *   *Outside:* Trade order matching, stock valuation, raw vendor feed ingestion.
    *   *Communication:* Consumes raw vendor schedule events via ACL from Market Data Domain; emits `Market Session Opens`, `Market Session Closes`.
13. **Execution Domain (Future):**
    *   *Inside:* Order parameter validation, Smart Order Routing (SOR), broker API integration, order state tracking (Pending, Filled, Cancelled).
    *   *Outside:* Financial research generation, portfolio performance analytics.
    *   *Communication:* Consumes user-authorized order requests; emits `Order Executed`, `Trade Filled`.
14. **Wealth Management Domain (Future):**
    *   *Inside:* Client wealth goal modeling, tax-loss harvesting execution, multi-family office reporting, private asset valuations.
    *   *Outside:* Basic retail screening.
    *   *Communication:* Consumes portfolio ledgers; emits `Rebalancing Proposal Generated`.
15. **Advisory Domain (Future):**
    *   *Inside:* Advisor copilot workflows, client suitability verification, regulatory advice compliance verification, advisor client communication logs.
    *   *Outside:* System infrastructure health monitoring.
    *   *Communication:* Interacts with User Identity and Portfolio domains for certified advisor workflows.

---

## 19. Future Business Expansion

As Tradeora matures past initial deployment phases, the domain architecture expands to incorporate new business capabilities, domain models, and actor roles:

1.  **Execution and Order Management:** Introduces non-custodial order routing capabilities, allowing users to submit authorized limit/market orders directly to licensed broker partners via standardized execution protocols.
2.  **Broker Integration Layer:** Establishes standardized API adapter interfaces for regional and global brokerage firms, supporting single-sign-on broker authorization, real-time position reconciliation, and instant trade placement.
3.  **Wealth Management:** Introduces automated target-allocation rebalancing engines, multi-generational family office consolidation dashboards, tax-efficient capital allocation modeling, and private asset (real estate, private equity) tracking.
4.  **Personalized Financial Advisory:** Enables certified financial advisors to manage client portfolios on Tradeora, deploy custom AI copilot models, conduct automated suitability reviews, and generate branded client advisory reports.
5.  **Fund Management Suite:** Equips institutional fund managers with advanced factor attribution tools, liquidity stress-testing models, automated regulatory filing generation (FRA/CMA compliance formats), and transaction cost analysis (TCA).
6.  **Institutional Enterprise Services:** Delivers multi-tenant organizational security (SSO/SAML), dedicated high-throughput API pipelines, enterprise data streaming hooks, and custom AI model fine-tuning environments.
7.  **Global Market Expansion (Beyond MENA):** Seamlessly activates market data coverage, exchange calendars, and regulatory compliance modules for Tier-1 global markets (US, UK, European Union, Asian exchanges).
8.  **Alternative Asset Coverage:** Expands Security Master and analytical models to support commodities, foreign exchange pairs, crypto-assets, REITs, private equity, and custom user-defined assets.
9.  **White-Label and API Products:** Enables third-party regional banks, wealth firms, and fintech portals to embed Tradeora’s AI intelligence engine, research summaries, and interactive charts directly within their proprietary applications.

---

## 20. Final Business Statement

**Formal Declaration of Business Domain Governance:**

This document, `docs/BUSINESS_DOMAIN_DISCOVERY.md`, constitutes the definitive, complete, and canonical business domain discovery for the Tradeora Financial Operating System. 

It establishes Tradeora as a global-first, market-agnostic financial intelligence ecosystem designed to operate across any exchange, currency, asset class, regulatory regime, and language from day one, with the Egyptian Exchange (EGX) serving as its first deployment instance.

This document is subordinate exclusively to the Tradeora Project Constitution (`docs/PROJECT_CONSTITUTION.md`). No software architecture design, database schema, API specification, Bounded Context boundary, Event Storming model, AI agent system, or product roadmap feature may be developed that contradicts or departs from the business requirements, domain terminology, rules, boundaries, and principles established herein.

All future engineering and business artifacts across the Tradeora ecosystem must maintain absolute traceability to this document.

---

## 21. Business Value Streams

1.  **Discover Investment Opportunities:**
    *   *Customer Trigger:* User seeks high-potential assets matching personal investment criteria.
    *   *Business Activities:* Apply fundamental/technical screens, analyze AI health scores, review sector trends.
    *   *Business Outcome:* Prioritized candidate asset list matching user constraints.
    *   *Business Value Delivered:* Reduces discovery time from days to seconds; eliminates search bias.
    *   *Primary Stakeholders:* Retail Investors, Active Traders, Research Analysts.
    *   *Capabilities Used:* Screening and Filtering, AI-Powered Security Analysis, Sector Analysis.
2.  **Evaluate Opportunities:**
    *   *Customer Trigger:* User selects a specific security for deep fundamental and technical evaluation.
    *   *Business Activities:* Fetch DCF fair values, parse financial statement trends, review earnings surprises and news sentiment.
    *   *Business Outcome:* Explainable investment decision (Buy/Hold/Avoid) with clear rationale.
    *   *Business Value Delivered:* Replaces guesswork with institutional-grade, mathematical research clarity.
    *   *Primary Stakeholders:* Long-Term Investors, Portfolio Managers, Wealth Advisors.
    *   *Capabilities Used:* Equity Research, Financial Statement Analysis, Earnings Intelligence, AI Recommendation Engine.
3.  **Monitor Portfolio:**
    *   *Customer Trigger:* User wants an authoritative real-time view of total multi-market net worth.
    *   *Business Activities:* Aggregate holdings, apply live multi-currency FX rates, compute real-time NAV and gain/loss.
    *   *Business Outcome:* Transparent multi-asset portfolio status dashboard.
    *   *Business Value Delivered:* Eliminates portfolio fragmentation across multiple accounts and exchanges.
    *   *Primary Stakeholders:* All User Profiles.
    *   *Capabilities Used:* Portfolio Tracking, Multi-Currency Support, Price Intelligence.
4.  **Manage Risk:**
    *   *Customer Trigger:* User or advisor seeks to evaluate portfolio exposure to market volatility or drawdowns.
    *   *Business Activities:* Calculate real-time VaR, sector concentration, correlation matrices, and stress test scenarios.
    *   *Business Outcome:* Identification of risk breaches and actionable rebalancing recommendations.
    *   *Business Value Delivered:* Prevents unquantified catastrophic capital loss.
    *   *Primary Stakeholders:* Portfolio Managers, Wealth Advisors, Fund Managers.
    *   *Capabilities Used:* Risk Assessment, Risk Profiling, Alert and Notification Engine.
5.  **Receive Market Intelligence:**
    *   *Customer Trigger:* Start of trading session or release of major market news/macro data.
    *   *Business Activities:* Synthesize news sentiment, earnings releases, and macro series into localized briefs.
    *   *Business Outcome:* Personalized daily market brief delivered in user's native language.
    *   *Business Value Delivered:* Keeps users continuously informed without cognitive overload.
    *   *Primary Stakeholders:* All User Profiles.
    *   *Capabilities Used:* News and Sentiment Intelligence, Economic Data Intelligence, Research Generator.
6.  **Track Performance:**
    *   *Customer Trigger:* End of monthly/quarterly period or portfolio review cycle.
    *   *Business Activities:* Compute Time-Weighted Returns (TWR), benchmark relative alpha, and sector attributions.
    *   *Business Outcome:* Auditable performance report and benchmark comparison.
    *   *Business Value Delivered:* Verifies whether investment decisions generate true excess market return.
    *   *Primary Stakeholders:* Portfolio Managers, Fund Managers, Long-Term Investors.
    *   *Capabilities Used:* Portfolio Performance Analytics, Benchmark Comparison, Reporting and Export.
7.  **Learn Investing:**
    *   *Customer Trigger:* Beginner user encounters unfamiliar financial ratio, metric, or AI recommendation.
    *   *Business Activities:* Provide context-aware Arabic/English ratio glossaries and interactive educational breakdowns.
    *   *Business Outcome:* Improved user financial literacy and decision confidence.
    *   *Business Value Delivered:* Demystifies capital markets and builds long-term user platform trust.
    *   *Primary Stakeholders:* Beginner Investors, Retail Users.
    *   *Capabilities Used:* Financial Education, Onboarding Intelligence, Internationalization Engine.
8.  **Improve Investment Decisions:**
    *   *Customer Trigger:* User seeks to validate an investment strategy before committing capital.
    *   *Business Activities:* Execute historical backtests, evaluate strategy parameter rules, simulate fee drags.
    *   *Business Outcome:* Quantitative strategy validation report with win-loss statistics.
    *   *Business Value Delivered:* Prevents deployment of flawed investment strategies.
    *   *Primary Stakeholders:* Active Traders, Quantitative Analysts, Fund Managers.
    *   *Capabilities Used:* Strategy Evaluation, Backtesting, Signal Generation.
9.  **Manage Watchlists:**
    *   *Customer Trigger:* User wants to monitor a prospective list of securities across exchanges.
    *   *Business Activities:* Build customized watchlists, configure price/volume alerts, apply dynamic tagging.
    *   *Business Outcome:* Organized, real-time prospective monitoring view.
    *   *Business Value Delivered:* Ensures users never miss key technical or price entry points.
    *   *Primary Stakeholders:* Active Traders, Long-Term Investors.
    *   *Capabilities Used:* Watchlist Management, Alert and Notification Engine.
10. **Receive Personalized Insights:**
    *   *Customer Trigger:* Market volatility or corporate announcement affects a security held in user's portfolio.
    *   *Business Activities:* AI engine evaluates impact on user's specific portfolio holdings and risk profile.
    *   *Business Outcome:* High-priority tailored insight notification with explicit action rationale.
    *   *Business Value Delivered:* Converts generic market news into immediate, personal actionable context.
    *   *Primary Stakeholders:* All User Profiles.
    *   *Capabilities Used:* AI Recommendation Engine, Alert Notification Engine, Risk Assessment.

---

## 22. Business Capability Classification & Criticality

| Capability Name | Capability Type | Business Criticality |
| :--- | :--- | :--- |
| **Market Data Acquisition** | Core | Critical |
| **Market Data Distribution** | Core | Critical |
| **Price Intelligence** | Core | High |
| **Corporate Actions Tracking** | Supporting | High |
| **Financial Statement Analysis** | Core | Critical |
| **Earnings Intelligence** | Strategic | High |
| **Economic Data Intelligence** | Supporting | Medium |
| **News and Sentiment Intelligence** | Competitive Differentiator | High |
| **Equity Research** | Strategic | Critical |
| **Sector and Industry Analysis** | Supporting | Medium |
| **Multi-Asset Research** | Core | High |
| **Cross-Market Analysis** | Competitive Differentiator | High |
| **AI-Powered Security Analysis** | Competitive Differentiator | Critical |
| **AI Recommendation Engine** | Competitive Differentiator | Critical |
| **Signal Generation** | Strategic | High |
| **Risk Profiling** | Core | Critical |
| **Risk Assessment** | Core | Critical |
| **Portfolio Construction Intelligence**| Strategic | High |
| **Portfolio Tracking** | Core | Critical |
| **Portfolio Performance Analytics** | Core | High |
| **Benchmark Comparison** | Supporting | Medium |
| **Multi-Currency Portfolio Support** | Core | High |
| **Watchlist Management** | Commodity | Medium |
| **Screening and Filtering** | Core | High |
| **Alert and Notification Engine** | Core | High |
| **Strategy Evaluation** | Strategic | Medium |
| **Backtesting** | Strategic | Medium |
| **Financial Education** | Competitive Differentiator | High |
| **Onboarding Intelligence** | Core | High |
| **User Profile Management** | Commodity | Medium |
| **Subscription and Entitlement** | Core | Critical |
| **Reporting and Export** | Supporting | Medium |
| **Audit and Compliance Logging** | Core | Critical |
| **Administration** | Commodity | High |
| **Platform Health Monitoring** | Core | Critical |
| **Internationalization Engine** | Competitive Differentiator | Critical |
| **Market Calendar Management** | Core | Critical |
| **Fair Value Modeling** | Competitive Differentiator | High |
| **Liquidity Analysis Engine** | Strategic | Medium |

---

## 23. Personas

### Persona 1: Omar - The Egyptian Retail Investor
*   **Name:** Omar El-Sayed (عمر السيد)
*   **Experience Level:** Beginner to Intermediate (2 years investing in EGX).
*   **Investment Style:** Value-seeking, long-term buy-and-hold, dividend income focus.
*   **Goals:** Protect family savings from inflation (EGP devaluation); earn reliable dividend income; invest in solid EGX blue-chips.
*   **Frustrations:** Dislikes unverified social media stock tips; frustrated by complex English financial terminals; lacks time to read 80-page financial statements.
*   **Digital Skills:** Moderate (uses smartphone, banking apps, Arabic social media).
*   **Risk Appetite:** Moderate-Conservative (prioritizes capital preservation over high speculation).
*   **Typical Daily Workflow:** Checks platform morning Arabic market brief before EGX session open; reviews portfolio NAV; inspects AI dividend sustainability scores for held stocks.
*   **Success Definition:** Outperforming Egyptian inflation while growing quarterly dividend yields with zero sudden capital losses.

### Persona 2: Karim - The Active Regional Momentum Trader
*   **Name:** Karim Al-Mansoor (كريم المنصور)
*   **Experience Level:** Advanced (7 years active trading across EGX, TADAWUL, DFM).
*   **Investment Style:** High-frequency intraday momentum, swing trading, technical setup execution.
*   **Goals:** Maximize short-term capital gains; capture cross-market momentum setups; react instantly to earnings surprises.
*   **Frustrations:** Delayed market data feeds; high execution slippage; missing price breakouts due to lack of fast alerts.
*   **Digital Skills:** High (multi-monitor setup, technical chart tools, mobile push alerts).
*   **Risk Appetite:** Aggressive (comfortable with high volatility and tight stop-losses).
*   **Typical Daily Workflow:** Configures multi-asset market scanners; monitors real-time technical indicators and AI signals; sets high-priority volume breakout alerts.
*   **Success Definition:** High trade win-loss ratio (> 65%) and sub-second alert responsiveness during volatile session hours.

### Persona 3: Layla - The Wealth Advisor & Portfolio Specialist
*   **Name:** Layla Mahmoud (ليلى محمود)
*   **Experience Level:** Expert (12 years institutional wealth management in Dubai & Cairo).
*   **Investment Style:** Multi-asset portfolio allocation, risk budgeting, factor tilt strategies.
*   **Goals:** Deliver tailored, compliant portfolio strategies for 40+ high-net-worth individual (HNWI) clients; automate client reporting.
*   **Frustrations:** Spent 15+ hours weekly manually compiling Excel client reports; managing regulatory compliance suitability documentation across jurisdictions.
*   **Digital Skills:** Advanced enterprise user (uses wealth management platforms, Excel models, CRM systems).
*   **Risk Appetite:** Customized per client mandate (ranging from Conservative to Aggressive).
*   **Typical Daily Workflow:** Reviews consolidated client portfolio risk exposures; runs scenario stress tests for high-net-worth clients; generates branded Arabic/English PDF client performance reports.
*   **Success Definition:** Reducing client report generation time by 80% with zero regulatory suitability audit violations.

### Persona 4: Tariq - The Institutional Fund Manager
*   **Name:** Tariq Al-Hassan (طارق الحسن)
*   **Experience Level:** Master (18 years institutional fund management across MENA and European equities).
*   **Investment Style:** Institutional fundamental value, sector rotation, alpha generation relative to regional benchmarks.
*   **Goals:** Outperform regional equity benchmarks (EGX30, TADAWUL TASI); manage multi-currency portfolio risks; maintain fund liquidity.
*   **Frustrations:** Rigid legacy desktop terminals with poor API connectivity; lack of integrated cross-border MENA macroeconomic intelligence.
*   **Digital Skills:** Expert (API integrations, institutional terminals, quantitative models).
*   **Risk Appetite:** Institutional Moderate (bound by fund prospectus limits).
*   **Typical Daily Workflow:** Analyzes cross-market correlation matrices; evaluates factor attribution and Sharpe ratios; inspects institutional API data streams.
*   **Success Definition:** Delivering top-quartile regional fund returns with minimal tracking error.

---

## 24. Top 20 Business Scenarios

1.  **Scenario 1: Instant Fair Value Lookup for EGX Blue-Chip**
    *   *Business Goal:* Rapidly evaluate if an EGX stock (e.g., COMI.CA) is trading below its intrinsic value.
    *   *Trigger:* User searches ticker symbol in search bar.
    *   *Primary Actor:* Long-Term Investor.
    *   *Expected Outcome:* Platform displays DCF fair value range, key valuation ratios, and AI health score with explicit assumptions.
    *   *Business Value:* Eliminates manual modeling; delivers instant valuation clarity.
2.  **Scenario 2: Real-Time Value-at-Risk (VaR) Breach Notification**
    *   *Business Goal:* Alert a user when portfolio market drawdown exposure exceeds their risk profile limit.
    *   *Trigger:* High intraday market volatility causes portfolio VaR to cross 15% threshold.
    *   *Primary Actor:* Portfolio Manager.
    *   *Expected Outcome:* High-priority alert dispatched to mobile app detailing breach causes and suggested rebalancing actions.
    *   *Business Value:* Protects portfolio from unquantified risk spillover during market crashes.
3.  **Scenario 3: Automated Earnings Announcement Synthesis**
    *   *Business Goal:* Understand quarterly financial results minutes after official disclosure.
    *   *Trigger:* Listed company files quarterly income statement on exchange feed.
    *   *Primary Actor:* Research Analyst.
    *   *Expected Outcome:* AI extracts reported EPS, revenue surprise %, updates DCF model, and drafts localized Arabic summary.
    *   *Business Value:* Accelerates research velocity from 4 hours to under 2 minutes.
4.  **Scenario 4: Multi-Currency Portfolio NAV Consolidation**
    *   *Business Goal:* View total consolidated net worth across EGP, SAR, and USD holdings.
    *   *Trigger:* User opens portfolio home dashboard.
    *   *Primary Actor:* Wealth Advisor / Global Investor.
    *   *Expected Outcome:* Platform applies real-time FX spot rates, rendering unified NAV in base currency with separate FX gain/loss breakdown.
    *   *Business Value:* Simplifies global wealth monitoring across international accounts.
5.  **Scenario 5: Dynamic Market Screening for High-Dividend Equities**
    *   *Business Goal:* Filter all EGX listed stocks to identify stable dividend income opportunities.
    *   *Trigger:* User applies screen query: `Dividend Yield > 8% AND P/E < 10 AND Debt-to-Equity < 0.5`.
    *   *Primary Actor:* Beginner / Long-Term Investor.
    *   *Expected Outcome:* Platform returns filtered list sorted by AI dividend sustainability score.
    *   *Business Value:* Uncovers high-quality yield opportunities while filtering out dividend traps.
6.  **Scenario 6: Cross-Market Arbitrage Signal Detection**
    *   *Business Goal:* Identify valuation discrepancies between dual-listed regional assets.
    *   *Trigger:* Dual-listed stock price spread between EGX and London/GCC exchange exceeds 3%.
    *   *Primary Actor:* Active Trader / Quantitative Analyst.
    *   *Expected Outcome:* Cross-market signal event generated with historical spread stats and currency adjustment factor.
    *   *Business Value:* Captures high-probability regional arbitrage opportunities.
7.  **Scenario 7: Stock Split Corporate Action Portfolio Reconciliation**
    *   *Business Goal:* Preserve accurate cost basis and return calculations following a 2-for-1 stock split.
    *   *Trigger:* Exchange confirms ex-date for corporate stock split.
    *   *Primary Actor:* System / Portfolio Tracker.
    *   *Expected Outcome:* Position share quantity doubles, average cost per share halves, historical price series adjusts automatically.
    *   *Business Value:* Ensures 100% calculation accuracy without manual user ledger entry.
8.  **Scenario 8: Onboarding Risk Profiling and Entitlement Assignment**
    *   *Business Goal:* Establish a new user's legal risk profile and assign matching platform features.
    *   *Trigger:* User completes initial registration setup.
    *   *Primary Actor:* Beginner Investor.
    *   *Expected Outcome:* Interactive questionnaire computes Moderate risk classification and sets initial entitlement parameters.
    *   *Business Value:* Guarantees regulatory compliance and personalized insight targeting from day one.
9.  **Scenario 9: Daily Arabic AI Market Brief Generation**
    *   *Business Goal:* Prepare for upcoming market session with localized macro and stock intelligence.
    *   *Trigger:* Market Calendar triggers 30 minutes prior to EGX session opening.
    *   *Primary Actor:* Retail Investor.
    *   *Expected Outcome:* User receives push notification with concise Arabic brief covering macro indicators, sector news, and watchlist alerts.
    *   *Business Value:* Increases daily active user engagement and market readiness.
10. **Scenario 10: Quantitative Strategy Backtesting Simulation**
    *   *Business Goal:* Verify whether a moving-average crossover strategy is profitable on EGX30 stocks.
    *   *Trigger:* Active trader configures parameter rules and runs 5-year historical backtest.
    *   *Primary Actor:* Active Trader.
    *   *Expected Outcome:* Platform executes historical simulation, displaying CAGR, Max Drawdown %, Sharpe ratio, and trade log.
    *   *Business Value:* Prevents real capital loss by validating strategy mechanics prior to execution.
11. **Scenario 11: Sector Rotation Capital Flow Detection**
    *   *Business Goal:* Identify capital shifting from Banking to Real Estate sectors.
    *   *Trigger:* Intraday volume and turnover cluster shifts significantly across sector indices.
    *   *Primary Actor:* Fund Manager.
    *   *Expected Outcome:* Sector heatmap updates with capital flow movement alerts and volume anomaly tags.
    *   *Business Value:* Enables institutional managers to adjust sector weights ahead of broader market trends.
12. **Scenario 12: Generating Branded Client Advisory Report**
    *   *Business Goal:* Deliver a quarterly portfolio review report to a high-net-worth client.
    *   *Trigger:* Wealth advisor clicks "Generate Client Report" for a specific managed portfolio.
    *   *Primary Actor:* Wealth Advisor.
    *   *Expected Outcome:* Platform compiles publication-ready PDF containing NAV growth charts, asset allocations, risk metrics, and custom commentary.
    *   *Business Value:* Reduces report drafting time by hours while enhancing professional client presentation.
13. **Scenario 13: Emergency Market Data Feed Failover**
    *   *Business Goal:* Maintain continuous platform quote visibility during primary vendor outage.
    *   *Trigger:* Primary EGX market data feed experiences heartbeat failure exceeding 5 seconds.
    *   *Primary Actor:* System / Platform Health Monitoring.
    *   *Expected Outcome:* Data ingestion router switches automatically to secondary backup feed; operational log alerts ops team.
    *   *Business Value:* Protects system uptime and user trust during live trading hours.
14. **Scenario 14: Macroeconomic Inflation Spike Scenario Analysis**
    *   *Business Goal:* Stress-test a equity portfolio against a projected 5% interest rate hike.
    *   *Trigger:* Central Bank announces emergency monetary policy session.
    *   *Primary Actor:* Portfolio Manager.
    *   *Expected Outcome:* Risk Engine simulates rate impact across banking, real estate, and industrial holdings, projecting NAV sensitivity.
    *   *Business Value:* Prepares portfolios for macroeconomic regime shocks.
15. **Scenario 15: AI Recommendation Downside Risk Inspection**
    *   *Business Goal:* Evaluate downside risks before acting on a "Buy" recommendation.
    *   *Trigger:* User clicks "Inspect Reasoning & Risk" on an AI investment recommendation card.
    *   *Primary Actor:* Long-Term Investor.
    *   *Expected Outcome:* UI opens detailed breakdown showing 78% confidence score, underlying DCF model inputs, and worst-case drawdown scenario (-12%).
    *   *Business Value:* Fosters deep trust and explainability, rejecting black-box advice.
16. **Scenario 16: Regulatory Audit Log Export for Compliance Review**
    *   *Business Goal:* Demonstrate compliance with financial advice boundaries during regulatory audit.
    *   *Trigger:* Compliance officer requests system audit logs for all AI recommendations generated over past quarter.
    *   *Primary Actor:* Compliance Officer.
    *   *Expected Outcome:* System exports tamper-evident JSON/CSV log containing request payloads, timestamps, risk profiles, and disclaimers.
    *   *Business Value:* Guarantees 100% regulatory auditability and legal protection.
17. **Scenario 17: Seamless Mobile Language Switching During Active Session**
    *   *Business Goal:* Switch UI language from English to Arabic while reviewing live chart.
    *   *Trigger:* User toggles language selector in app settings.
    *   *Primary Actor:* Retail Investor.
    *   *Expected Outcome:* UI layout instantly transitions to native Right-to-Left (RTL), converting text, chart labels, and numbers without session reload.
    *   *Business Value:* Delivers native, frictionless internationalization experience.
18. **Scenario 18: Watchlist Technical Breakout Notification Dispatch**
    *   *Business Goal:* Catch a stock breaking above its 52-week high resistance level.
    *   *Trigger:* Real-time price tick crosses resistance threshold with 2x average volume.
    *   *Primary Actor:* Active Trader.
    *   *Expected Outcome:* Instant push notification delivered to user smartphone within 1 second of tick event.
    *   *Business Value:* Ensures traders capture high-velocity market entry points.
19. **Scenario 19: Portfolio Benchmark Alpha Attribution Review**
    *   *Business Goal:* Verify whether an active portfolio strategy outperformed the EGX30 index over 1 year.
    *   *Trigger:* User views performance analytics tab.
    *   *Primary Actor:* Long-Term Investor / Portfolio Manager.
    *   *Expected Outcome:* Dashboard displays TWR (+22%) vs EGX30 (+15%), isolating +7% net Alpha generated by stock selection.
    *   *Business Value:* Provides objective proof of investment skill versus broad market movement.
20. **Scenario 20: New Exchange Market Onboarding Configuration**
    *   *Business Goal:* Add Saudi Exchange (TADAWUL) data coverage to platform live environment.
    *   *Trigger:* Enterprise admin deploys new market configuration file.
    *   *Primary Actor:* Platform Administrator.
    *   *Expected Outcome:* Security Master ingests TADAWUL tickers; Market Calendar activates SAR trading sessions; screening engine enables Saudi equities.
    *   *Business Value:* Demonstrates frictionless global scaling without code rewrite.

---

## 25. Defining Success for Tradeora

Success for Tradeora is defined by 10 non-negotiable business outcomes:

1.  **User Trust:** Attaining absolute user confidence by eliminating hallucinated AI outputs, enforcing mathematical calculation precision, and maintaining transparent disclaimers across all features.
2.  **Decision Quality:** Empowering users to make measurably superior, risk-adjusted investment decisions characterized by higher Sharpe ratios, lower unforced drawdowns, and disciplined capital allocation.
3.  **Time to Insight (TTI):** Achieving sub-3-second latency from user query initiation to rendering comprehensive, explainable financial research summaries across any listed asset.
4.  **Research Depth:** Delivering institutional-grade equity modeling, DCF fair-value estimates, standardized financial statement analysis, and macro intelligence previously inaccessible to retail and mid-market users.
5.  **AI Explainability:** Enforcing 100% causal explainability for every AI recommendation, ensuring confidence scores, key assumptions, data sources, and downside risk scenarios accompany all insights.
6.  **Customer Satisfaction (CSAT & NPS):** Maintaining top-tier customer satisfaction ratings (> 85 NPS, > 4.5/5.0 CSAT) across retail, advisor, and enterprise user tiers in both Arabic and English markets.
7.  **Educational Impact:** Verifiably improving the financial literacy of retail investors in EGX, MENA, and global markets through contextual Arabic/English educational breakdowns and ratio explainers.
8.  **Platform Reliability:** Guaranteeing 99.95% system uptime, sub-second data streaming feeds, and fault-tolerant operation under extreme market volatility spikes.
9.  **Market Coverage:** Expanding platform data depth from 100% coverage of EGX listed assets to regional MENA exchanges and Tier-1 global capital markets without architectural redesign.
10. **Business Growth:** Sustaining strong commercial unit economics, low churn (< 2.5%), rapid ARR expansion (> 150% YoY), and establishing Tradeora as the dominant regional Financial Operating System.

---

## 26. Canonical Knowledge Base Statement

**Final Canonical Knowledge Base Declaration:**

This document, `docs/BUSINESS_DOMAIN_DISCOVERY.md`, stands as the ultimate, authoritative canonical knowledge base for the business domain of Tradeora.

No future business requirement, feature request, technical architecture specification, software design document, API schema, database design, event contract, AI model prompt, or product roadmap item may contradict or conflict with the domain language, business principles, domain boundaries, business rules, capabilities, objects, or decisions established in this document.

All future engineering discovery, Ubiquitous Language definitions, Bounded Context mappings, Context Maps, Event Storming sessions, Domain Models, Microservice Architectures, Database Schemas, API Endpoints, AI Agent Workflows, and Product Roadmaps for Tradeora must be derived directly from and maintain strict traceability to this document and the Project Constitution (`docs/PROJECT_CONSTITUTION.md`).
