import os

docs_dir = r'e:\tradeora\docs'
os.makedirs(docs_dir, exist_ok=True)

sprints = [
    # R1.0
    ('R1.0 Alpha', 'S-1.1', 'Infrastructure Foundation', 'Establish K8s, Kafka, PostgreSQL, and basic GitOps pipelines', [
        'No trading features yet, purely structural foundation.', 'Prepare namespace for trading services.'
    ], [
        'No AI features yet.'
    ], [
        'Service: devops-controller — provision K8s cluster and namespaces',
        'Database: Initialize Patroni cluster for highly available PostgreSQL',
        'Kafka: Deploy KRaft mode Kafka 3.7+ and Karapace schema registry'
    ], [
        'Screen: Splash — Initial load and network check',
        'Setup Flutter project with localization support (ar/en)'
    ], [
        'Deploy MinIO WORM compliant storage for audit logs',
        'Deploy OpenBao for secrets management',
        'Configure Kong API Gateway and Unleash feature flags'
    ], [
        'Infrastructure: Test node failover and recovery',
        'Security: Validate OpenBao secret injection'
    ], [
        'FluxCD v2 deployment for automated GitOps sync'
    ], [
        'Infrastructure risk: K8s cluster networking misconfiguration'
    ]),
    ('R1.0 Alpha', 'S-1.2', 'Identity & Authentication', 'Implement user registration and Keycloak JWT authentication', [
        'Basic user profiles and preferences'
    ], [
        'No AI features yet'
    ], [
        'Service: identity-service — User registration, login, JWT validation',
        'Database: identity schema, users table, preferences table',
        'Kafka: users.created.v1 event'
    ], [
        'Screen: Login/Register — Arabic RTL layout',
        'Screen: Settings — Language toggle (ar/en)'
    ], [
        'Configure Keycloak realms, clients, and identity providers'
    ], [
        'E2E: Registration flow to JWT generation',
        'Security: Token expiry and refresh tests'
    ], [
        'Deploy identity-service via FluxCD'
    ], [
        'Integration risk: Keycloak to PostgreSQL connection drops'
    ]),
    ('R1.0 Alpha', 'S-1.3', 'KYC & AML', 'Implement Egyptian National ID upload, liveness check, AML', [
        'User verification status for trading enablement'
    ], [
        'Optical Character Recognition (OCR) for National ID'
    ], [
        'Service: kyc-service — ID parsing, SAGA-001 initiation',
        'Service: compliance-service — AML screening',
        'Database: compliance schema, kyc_records table',
        'Kafka: kyc.submitted.v1, kyc.approved.v1'
    ], [
        'Screen: KYC Upload — Camera integration for ID',
        'Screen: Liveness — Selfie capture instructions'
    ], [
        'MinIO WORM buckets setup for ID documents'
    ], [
        'Integration: OCR accuracy on sample IDs',
        'SAGA: SAGA-001 compensation on AML failure'
    ], [
        'Deploy kyc-service and compliance-service'
    ], [
        'Compliance risk: OCR failure rate on low-quality camera uploads'
    ]),
    ('R1.0 Alpha', 'S-1.4', 'Portfolio Foundation', 'Create portfolio schema, positions tracking, watchlist', [
        'Watchlist creation and management',
        'Dummy position tracking and basic FX conversion'
    ], [
        'No AI features yet'
    ], [
        'Service: portfolio-service — CRUD operations for portfolios',
        'Database: portfolio schema, positions, transactions',
        'Kafka: portfolio.created.v1'
    ], [
        'Screen: Dashboard — Watchlist and portfolio summary view',
        'Screen: Portfolio — Detailed holdings list'
    ], [
        'Configure Decimal types in PostgreSQL strictly'
    ], [
        'Unit: Python Decimal operations for FX conversion',
        'Load: Watchlist retrieval under concurrency'
    ], [
        'Deploy portfolio-service'
    ], [
        'Data risk: Float drift if Decimal is not strictly enforced'
    ]),
    ('R1.0 Alpha', 'S-1.5', 'Subscription & Entitlement', 'Implement subscription tiers and SAGA billing integration', [
        'Premium feature gating based on subscription tier'
    ], [
        'No AI features yet'
    ], [
        'Service: subscription-service — Tier management',
        'Database: subscriptions schema, billing_history',
        'Kafka: SAGA-002 subscription.purchased, SAGA-006'
    ], [
        'Screen: Paywall — Subscription tier comparison',
        'Screen: Checkout — Payment gateway integration mock'
    ], [
        'Unleash feature flag configurations for tiers'
    ], [
        'SAGA: SAGA-002 billing rollback if entitlement fails'
    ], [
        'Deploy subscription-service'
    ], [
        'Business risk: Payment gateway sandbox divergence from prod'
    ]),
    ('R1.0 Alpha', 'S-1.6', 'EGX Session Status + Alpha Launch', 'EGX session display, FluxCD prod gate, first 100 users', [
        'EGX market open/close indicator',
        'Alpha user onboarding cohort'
    ], [
        'No AI features yet'
    ], [
        'Service: market-calendar-service — EGX holiday calendar',
        'Database: market_calendar schema',
        'Kafka: market.session.status.v1'
    ], [
        'Screen: Header — Live session status indicator',
        'Screen: Onboarding — Alpha invite code entry'
    ], [
        'FluxCD schedule window (no deploys 08:45-15:20)'
    ], [
        'UAT: Alpha cohort registration flow',
        'System: Deployment block during market hours'
    ], [
        'Alpha Prod Launch'
    ], [
        'Operational risk: Release happens during trading hours'
    ]),
    
    # R2.0
    ('R2.0 Beta', 'S-2.1', 'Forex Data Infrastructure', 'Forex data provider integration, pip precision, 24/5 feed', [
        'Currency pair definitions, 24/5 streaming feed'
    ], [
        'No AI features yet'
    ], [
        'Service: market-data-service — Forex feed ingestion',
        'Database: forex_pairs schema, currency definitions',
        'Kafka: forex.tick.v1, forex.candle.1m.v1'
    ], [
        'Screen: FX Market — Major, Minor, Exotic pair listings',
        'Screen: Chart — Live tick updates for Forex'
    ], [
        'TimescaleDB hypertables configuration for Forex'
    ], [
        'Data: Tick ordering and gap detection',
        'Precision: 5-decimal major, 3-decimal JPY validation'
    ], [
        'Deploy Forex ingestion workers'
    ], [
        'Data risk: Feed latency from OANDA/FXCM causing stale prices'
    ]),
    ('R2.0 Beta', 'S-2.2', 'EGX Real-Time Market Data', 'EGX tick ingestion, OHLCV bars, circuit breaker', [
        'EGX equity realtime quotes, Level 1 market data'
    ], [
        'No AI features yet'
    ], [
        'Service: egx-data-service — EGX feed handler',
        'Database: market_data schema, egx_ticks hypertable',
        'Kafka: egx.tick.v1, egx.circuit_breaker.v1'
    ], [
        'Screen: Stock Detail — EGX live quote and depth',
        'Screen: Alerts — Circuit breaker notification'
    ], [
        'Configure Kong rate limits for data streams'
    ], [
        'Performance: 10k messages/sec tick ingestion',
        'Resilience: Circuit breaker trigger event handling'
    ], [
        'Deploy EGX data handlers'
    ], [
        'Data risk: EGX FIX feed disconnection during active session'
    ]),
    ('R2.0 Beta', 'S-2.3', 'Technical Indicators', 'RSI, MACD, Bollinger, ADX, Ichimoku for EGX + Forex pairs', [
        'Client-side and server-side technical indicator calculations'
    ], [
        'No AI features yet'
    ], [
        'Service: ta-service — Technical analysis calculation engine',
        'Database: None (in-memory/cache compute)',
        'Kafka: ta.signal.generated.v1'
    ], [
        'Screen: Advanced Charting — Overlay TA indicators',
        'Screen: Screener — Filter by RSI/MACD'
    ], [
        'Valkey caching for latest indicator values'
    ], [
        'Algorithm: Verify RSI calculation matches TradingView',
        'Algorithm: MACD signal line crossover accuracy'
    ], [
        'Deploy ta-service'
    ], [
        'Compute risk: High CPU load during candle close for all pairs'
    ]),
    ('R2.0 Beta', 'S-2.4', 'Forex + EGX Fundamentals & News', 'EGX fundamentals, Arabic news ingestion, DCF modeling, macro', [
        'Company financials, DCF valuation, economic indicators'
    ], [
        'NLP entity extraction for news tagging'
    ], [
        'Service: fundamentals-service — PE, EPS, DCF data',
        'Database: fundamentals schema, news schema',
        'Kafka: news.published.v1, fundamental.updated.v1'
    ], [
        'Screen: Company Profile — Financials tab',
        'Screen: News Feed — Arabic financial news'
    ], [
        'News feed webhooks and RSS ingestion pipelines'
    ], [
        'Data: DCF formula validation with manual models',
        'NLP: Arabic text encoding checks'
    ], [
        'Deploy fundamentals-service and news ingesters'
    ], [
        'Integration risk: News source format changes breaking ingestion'
    ]),
    ('R2.0 Beta', 'S-2.5', 'Alerts & Screening', 'Price/volatility alerts for EGX + Forex, dynamic screening', [
        'User-defined price alerts, complex screener queries'
    ], [
        'No AI features yet'
    ], [
        'Service: alert-service — Notification rules engine',
        'Database: alerts schema, screening schema',
        'Kafka: alert.triggered.v1'
    ], [
        'Screen: Screener — Query builder (e.g. PE < 15, RSI < 30)',
        'Screen: Alert Setup — Push notification configuration'
    ], [
        'Firebase Cloud Messaging (FCM) integration via notification-service'
    ], [
        'E2E: Alert triggers exactly once on price cross',
        'Load: 100k active alerts evaluated per tick'
    ], [
        'Deploy alert-service'
    ], [
        'Scale risk: Alert engine latency during extreme volatility'
    ]),
    ('R2.0 Beta', 'S-2.6', 'Portfolio NAV + Beta Gate', 'Live portfolio NAV, TWR, benchmark comparison, Beta launch', [
        'Time-Weighted Return (TWR) calculation, EGX30 benchmark'
    ], [
        'No AI features yet'
    ], [
        'Service: portfolio-analytics-service — NAV and TWR',
        'Database: portfolio_snapshots hypertable',
        'Kafka: portfolio.nav.calculated.v1'
    ], [
        'Screen: Dashboard — Performance chart vs Benchmark',
        'Screen: Beta Gate — 5,000 user limit reached display'
    ], [
        'Increase K8s node pool for Beta traffic'
    ], [
        'Math: TWR calculation accuracy over cash flows',
        'Performance: Daily NAV snapshot generation time'
    ], [
        'Beta Launch'
    ], [
        'Business risk: TWR discrepancy causing user mistrust'
    ]),

    # R3.0
    ('R3.0 Beta', 'S-3.1', 'LLM Gateway & AI Infrastructure', 'Ollama deployment, Qwen2.5, LiteLLM proxy, Qdrant', [
        'AI infrastructure readiness'
    ], [
        'Qwen2.5:14b-q4 and 7b-q4 deployment via Ollama'
    ], [
        'Service: llm-gateway — LiteLLM proxy for rate limiting',
        'Database: Qdrant vector DB initialization',
        'Kafka: ai.prompt.logged.v1'
    ], [
        'Screen: AI Chat — Initial interface skeleton',
        'Screen: Settings — AI opt-in'
    ], [
        'GPU node provisioning in K8s (if applicable/cloud)',
        'Qdrant statefulset deployment'
    ], [
        'Infrastructure: LiteLLM proxy failover to fallback models',
        'Security: Prompt injection baseline tests'
    ], [
        'Deploy Ollama, LiteLLM, Qdrant'
    ], [
        'Infrastructure risk: GPU out-of-memory on large context'
    ]),
    ('R3.0 Beta', 'S-3.2', 'Schools 01–04', 'Market Intel, Fundamental, Technical, Sentiment (Arabic NLP)', [
        'AI-driven insights on individual stocks'
    ], [
        'SCHOOL-01 to 04 deployment, Arabic Sentiment Analysis'
    ], [
        'Service: ai-school-service — Worker nodes for schools 1-4',
        'Database: ai_schools schema',
        'Kafka: ai.school.analysis.completed.v1'
    ], [
        'Screen: Asset Detail — AI Technical Summary',
        'Screen: Asset Detail — Market Sentiment gauge'
    ], [
        'Vector embedding pipeline for Arabic news'
    ], [
        'AI Quality: Sentiment accuracy against manual Arabic news dataset',
        'Performance: School inference within 2 seconds'
    ], [
        'Deploy Schools 01-04'
    ], [
        'AI risk: Hallucination in fundamental data summarization'
    ]),
    ('R3.0 Beta', 'S-3.3', 'Schools 05–08', 'Macroeconomic, Quantitative, Risk-Adjusted, Behavioral', [
        'Macro impact on Forex, Risk-adjusted return scoring'
    ], [
        'SCHOOL-05 to 08 deployment'
    ], [
        'Service: ai-school-service — Add workers for schools 5-8',
        'Database: macro data feeds to Qdrant',
        'Kafka: macro.event.analyzed.v1'
    ], [
        'Screen: Forex Pair — Macro impact analysis',
        'Screen: Asset Detail — Risk-Adjusted Return score'
    ], [
        'Integrate CBE/Fed/ECB data sources'
    ], [
        'AI Quality: Correlation of macro events to FX recommendations',
        'Pipeline: CBE interest rate data pipeline test'
    ], [
        'Deploy Schools 05-08'
    ], [
        'Data risk: Macro data source formatting changes'
    ]),
    ('R3.0 Beta', 'S-3.4', 'Schools 09–12', 'Sector Rotation, Peer Comparison, Earnings Quality, Pattern Rec', [
        'Sector momentum, CNN pattern recognition on charts'
    ], [
        'SCHOOL-09 to 12 deployment, CNN for charts'
    ], [
        'Service: ai-vision-service — CNN for technical patterns',
        'Database: image storage in MinIO',
        'Kafka: pattern.recognized.v1'
    ], [
        'Screen: Sector Heatmap — AI sector rotation predictions',
        'Screen: Chart — Auto-drawn support/resistance'
    ], [
        'GPU allocation for vision models'
    ], [
        'AI Quality: CNN accuracy on historical head-and-shoulders',
        'System: Vision service latency'
    ], [
        'Deploy Schools 09-12'
    ], [
        'AI risk: False positive pattern recognition leading to bad trades'
    ]),
    ('R3.0 Beta', 'S-3.5', 'Consensus Orchestrator + AI Safety Engine', '7-check gate, SAGA-003 WORM, FRA disclaimer', [
        'Final AI recommendation generation with safety checks'
    ], [
        'WisdomEngine aggregation, AI Safety Engine evaluation'
    ], [
        'Service: ai-orchestrator — Consensus and Safety gating',
        'Database: ai_safety log in WORM MinIO',
        'Kafka: SAGA-003 ai.consensus.reached.v1'
    ], [
        'Screen: Asset Detail — Final AI Consensus Buy/Sell/Hold',
        'Screen: Global — Mandatory FRA Arabic disclaimer'
    ], [
        'WORM compliance lockdown for AI outputs'
    ], [
        'Compliance: FRA disclaimer present on ALL AI outputs',
        'Safety: Blocked prompts return canned refusal'
    ], [
        'Deploy Orchestrator and Safety Engine'
    ], [
        'Compliance risk: FRA disclaimer missing on a corner-case UI component'
    ]),
    ('R3.0 Beta', 'S-3.6', 'Explainability + Beta Gate 2', 'Arabic explanation engine, daily market brief, 15,000 users', [
        'Daily AI market brief, detailed reasoning for recommendations'
    ], [
        'Explainability text generation (RAG)'
    ], [
        'Service: ai-explain-service — Narrative generation',
        'Database: ai_explanations schema',
        'Kafka: report.generated.v1'
    ], [
        'Screen: AI Explanation — Breakdown of the 12 schools',
        'Screen: Daily Brief — Morning digest'
    ], [
        'Scale K8s to handle 15,000 MAU load'
    ], [
        'UX: Arabic text readability and formatting',
        'Load: Generate 15k briefs at 8 AM daily'
    ], [
        'Beta 2 Launch'
    ], [
        'Performance risk: Morning generation spike overwhelms LLM cluster'
    ]),

    # R4.0
    ('R4.0 GA', 'S-4.1', 'Risk Profiling & VaR', 'FRA suitability, VaR 95%/99%, historical/parametric', [
        'Value at Risk calculation on portfolio'
    ], [
        'No AI features'
    ], [
        'Service: risk-service — VaR engine',
        'Database: risk_profiling schema, user questionnaires',
        'Kafka: user.risk.profiled.v1'
    ], [
        'Screen: Risk Questionnaire — FRA compliant form',
        'Screen: Portfolio — VaR metrics display'
    ], [
        'Compute optimized workers for matrix math'
    ], [
        'Math: VaR historical vs parametric validation',
        'Compliance: FRA suitability logic maps correctly'
    ], [
        'Deploy risk-service'
    ], [
        'Math risk: Covariance matrix calculation failure on new assets'
    ]),
    ('R4.0 GA', 'S-4.2', 'Stress Testing & Risk Alerts', 'Drawdown scenarios, EGX crash, EGP devaluation', [
        'Portfolio stress testing against historical shocks'
    ], [
        'No AI features'
    ], [
        'Service: stress-test-service — Scenario application',
        'Database: risk schema, scenario definitions',
        'Kafka: portfolio.stress.alert.v1'
    ], [
        'Screen: Risk Dashboard — Stress test results (e.g. -20% EGP)',
        'Screen: Alerts — Concentration warning'
    ], [
        'Nightly cron jobs for stress tests'
    ], [
        'Data: Devaluation scenario math accuracy',
        'System: Alert firing on sector concentration breach'
    ], [
        'Deploy stress-test-service'
    ], [
        'Performance risk: Nightly batch takes longer than available window'
    ]),
    ('R4.0 GA', 'S-4.3', 'Portfolio Rebalancing', 'SAGA-005, AI rebalancing suggestions, position sizing', [
        'Target weight calculation, generate rebalancing trades'
    ], [
        'AI suggested target weights based on risk profile'
    ], [
        'Service: rebalancing-service — Target weight solver',
        'Database: rebalancing schema, proposed_trades',
        'Kafka: SAGA-005 rebalance.proposed.v1'
    ], [
        'Screen: Rebalance — Proposed trades review',
        'Screen: Rebalance — One-click execute (mock for now)'
    ], [
        'Audit trail logging for all accepted rebalances'
    ], [
        'Algorithm: Target weights sum to 100%',
        'SAGA: Rebalance proposal lifecycle'
    ], [
        'Deploy rebalancing-service'
    ], [
        'Business risk: Fractional share rounding errors in proposed trades'
    ]),
    ('R4.0 GA', 'S-4.4', 'Reporting Engine', 'PDF/Excel portfolio statements bilingual, PDPL data export', [
        'Monthly statements, PDPL compliance export'
    ], [
        'No AI features'
    ], [
        'Service: report-service — PDF/Excel generation',
        'Database: reports schema, SLICE-12 exports',
        'Kafka: report.requested.v1'
    ], [
        'Screen: Statements — Download monthly PDFs',
        'Screen: Privacy — Export my data (PDPL)'
    ], [
        'Fonts and templates deployed to report generators'
    ], [
        'Compliance: PDPL export contains all PII',
        'UX: PDF Arabic RTL rendering correct'
    ], [
        'Deploy report-service'
    ], [
        'Tech risk: RTL PDF rendering library issues'
    ]),
    ('R4.0 GA', 'S-4.5', 'Economic Calendar & Audit Trail', 'Macro calendar, XCC-AUD-002 comprehensive audit', [
        'Global economic calendar, enhanced audit logging'
    ], [
        'No AI features'
    ], [
        'Service: calendar-service — Macro events',
        'Database: economic_calendar schema',
        'Kafka: audit.log.v1'
    ], [
        'Screen: Calendar — Upcoming macro events',
        'Screen: Activity Log — User actions'
    ], [
        'WORM storage verification for XCC-AUD-002'
    ], [
        'Security: Audit logs immutable',
        'Data: Calendar timezone handling'
    ], [
        'Deploy calendar-service'
    ], [
        'Data risk: Calendar data provider inaccuracies'
    ]),
    ('R4.0 GA', 'S-4.6', 'GA Launch', 'Remove Beta restrictions, FRA audit readiness, 50k MAU target', [
        'Public launch, removal of Beta gate'
    ], [
        'No new AI features'
    ], [
        'Service: all — Final optimization',
        'Database: Index tuning',
        'Kafka: Partition scaling'
    ], [
        'Screen: Various — Polish and bug fixes',
        'Screen: Marketing — Share portfolio/invite'
    ], [
        'Scale infrastructure for 50k MAU, multi-AZ DB'
    ], [
        'Load: 50k concurrent users simulated',
        'Compliance: Final FRA pre-launch signoff checks'
    ], [
        'General Availability Launch'
    ], [
        'Launch risk: Massive unexpected influx overwhelms DB connections'
    ]),

    # R5.0
    ('R5.0 Enterprise', 'S-5.1', 'GPU Infrastructure & Learning Engine', 'NVIDIA A100, vLLM, Ground Truth Collector', [
        'Internal data collection for AI learning'
    ], [
        'vLLM deployment for high throughput inference'
    ], [
        'Service: ground-truth-service — Collect user feedback',
        'Database: ground_truth schema',
        'Kafka: ai.feedback.received.v1'
    ], [
        'Screen: AI Feedback — Thumbs up/down on AI insights',
        'Screen: Admin — Ground truth dashboard'
    ], [
        'NVIDIA A100 node pools, vLLM engine integration'
    ], [
        'Infrastructure: vLLM throughput vs standard Ollama',
        'Data: Ground truth logging accuracy'
    ], [
        'Deploy vLLM and Ground Truth Collector'
    ], [
        'Infra risk: GPU availability in selected cloud region'
    ]),
    ('R5.0 Enterprise', 'S-5.2', 'AI Learning System', 'TRD-AI-023 to 026: Self-Reflection, Bias Detection', [
        'Internal AI accuracy tracking'
    ], [
        'Self-Reflection loop, Bias detection models'
    ], [
        'Service: ai-learning-service — Nightly reflection jobs',
        'Database: learning schema',
        'Kafka: ai.model.updated.v1'
    ], [
        'Screen: None (Backend AI improvement)'
    ], [
        'Batch job scheduling for nightly AI grading'
    ], [
        'AI Quality: Reflection correctly identifies past bad predictions',
        'Logic: Bias detection flags over-optimistic schools'
    ], [
        'Deploy AI Learning jobs'
    ], [
        'AI risk: Reflection loop creates feedback resonance (mode collapse)'
    ]),
    ('R5.0 Enterprise', 'S-5.3', 'Qdrant Learning Collections', 'learning_core, learning_recent, antipatterns', [
        'Memory segmentation for AI'
    ], [
        'RAG improvements using distinct learning collections'
    ], [
        'Service: vector-manager-service — Qdrant segmenting',
        'Database: Qdrant new collections',
        'Kafka: vector.collection.synced.v1'
    ], [
        'Screen: None'
    ], [
        'Qdrant payload index optimization'
    ], [
        'Search: Antipattern retrieval blocks bad answers',
        'Performance: Multi-collection search latency'
    ], [
        'Deploy vector-manager updates'
    ], [
        'Data risk: Vector space pollution with conflicting data'
    ]),
    ('R5.0 Enterprise', 'S-5.4', 'Backtesting Engine Foundation', 'Rule 40, available_from_ts, read-only schema', [
        'Internal backtesting for AI models'
    ], [
        'No AI features (validation of AI)'
    ], [
        'Service: backtest-service — Historical simulation',
        'Database: backtesting schema, read-only replicas',
        'Kafka: backtest.completed.v1'
    ], [
        'Screen: Admin — Backtest initiation'
    ], [
        'Point-in-time recovery DB snapshots for backtesting'
    ], [
        'Rule 40: Zero look-ahead bias confirmed',
        'Data: available_from_ts strictly enforced'
    ], [
        'Deploy backtest-service'
    ], [
        'Compliance risk: Look-ahead bias corrupts internal model validation'
    ]),
    ('R5.0 Enterprise', 'S-5.5', 'Monte Carlo Simulation', 'Internal only, EGX/Forex shock, compliance metadata', [
        'Advanced statistical modeling'
    ], [
        'Stochastic modeling for risk'
    ], [
        'Service: monte-carlo-service — 10k path simulation',
        'Database: monte_carlo schema',
        'Kafka: simulation.completed.v1'
    ], [
        'Screen: Admin — MC reports'
    ], [
        'High compute node auto-scaling based on queue depth'
    ], [
        'Math: Random walk standard deviation matches historical vol',
        'Performance: 10k paths in < 5 mins'
    ], [
        'Deploy monte-carlo-service'
    ], [
        'Compute risk: MC simulations starve other background tasks'
    ]),
    ('R5.0 Enterprise', 'S-5.6', 'Family Office Multi-Tenancy', 'Schema isolation, RBAC, consolidated reporting', [
        'Multi-user accounts, parent-child portfolios'
    ], [
        'No AI features'
    ], [
        'Service: tenancy-service — RLS enforcement',
        'Database: multi_tenancy schema, Row-Level Security',
        'Kafka: SAGA-007 account.linked.v1'
    ], [
        'Screen: Account Switcher — Move between sub-accounts',
        'Screen: Consolidated Dashboard — Multi-portfolio view'
    ], [
        'PostgreSQL RLS policy deployment'
    ], [
        'Security: Cross-tenant data leakage strictly prevented',
        'SAGA: Parent/child linking workflow'
    ], [
        'Deploy tenancy-service and RLS'
    ], [
        'Security risk: RLS bypass flaw exposes another office data'
    ]),
    ('R5.0 Enterprise', 'S-5.7', 'Crypto Data Infrastructure', 'Binance/CoinGecko API, 24/7 feed, 8-decimal precision', [
        'Cryptocurrency asset definitions'
    ], [
        'No AI features'
    ], [
        'Service: crypto-data-service — WebSocket ingestion',
        'Database: crypto_instruments schema',
        'Kafka: crypto.tick.v1'
    ], [
        'Screen: Crypto Market — Coin listings'
    ], [
        'Dedicated TimescaleDB hypertable for crypto ticks'
    ], [
        'Data: 8-decimal precision validation everywhere',
        'System: WebSocket reconnect logic resilience'
    ], [
        'Deploy crypto-data-service'
    ], [
        'Data risk: Crypto exchange API rate limits or IP bans'
    ]),
    ('R5.0 Enterprise', 'S-5.8', 'Crypto Market Data Service', 'BTC/ETH/BNB/SOL, OHLCV bars, crypto hypertables', [
        'Historical and live charts for top 50 crypto'
    ], [
        'No AI features'
    ], [
        'Service: crypto-market-service — Aggregation',
        'Database: crypto_market_data hypertable',
        'Kafka: crypto.candle.1m.v1'
    ], [
        'Screen: Crypto Chart — TradingView integration'
    ], [
        'Continuous aggregates in TimescaleDB for 1h/1d bars'
    ], [
        'Performance: Aggregation lag < 100ms',
        'Data: No missing bars during extreme volatility'
    ], [
        'Deploy crypto-market-service'
    ], [
        'Storage risk: Crypto tick volume fills disk faster than EGX/FX'
    ]),
    ('R5.0 Enterprise', 'S-5.9', 'Crypto Technical Analysis', 'Crypto RSI/MACD/BB, on-chain metrics MVRV/NVT', [
        '24/7 adapted indicators, On-chain data integration'
    ], [
        'No AI features'
    ], [
        'Service: crypto-ta-service — 24/7 TA compute',
        'Database: on_chain_metrics table',
        'Kafka: crypto.ta.updated.v1'
    ], [
        'Screen: Crypto Details — On-chain metrics tab'
    ], [
        'Glassnode/CryptoQuant API integrations'
    ], [
        'Math: Rolling 24h calculation vs standard daily close',
        'Integration: On-chain data pipeline reliability'
    ], [
        'Deploy crypto-ta-service'
    ], [
        'Methodology risk: Defining "daily close" for crypto indicators (UTC midnight)'
    ]),
    ('R5.0 Enterprise', 'S-5.10', 'Crypto AI School (SCHOOL-13)', 'Fear & Greed, crypto sentiment, volatility clustering', [
        'Crypto-specific AI advisory'
    ], [
        'SCHOOL-13 specialized for crypto assets'
    ], [
        'Service: ai-crypto-school — specialized workers',
        'Database: ai_schools new models',
        'Kafka: crypto.analysis.completed.v1'
    ], [
        'Screen: Crypto Details — AI Consensus'
    ], [
        'Crypto Twitter/Reddit sentiment ingestion pipeline'
    ], [
        'AI Quality: Crypto terminology understanding (HODL, rekt, etc)',
        'System: Sentiment ingestion rate limit handling'
    ], [
        'Deploy SCHOOL-13'
    ], [
        'AI risk: High noise-to-signal ratio in crypto social sentiment'
    ]),
    ('R5.0 Enterprise', 'S-5.11', 'Crypto Portfolio & Alerts', 'BTC/ETH/alt position tracking in Decimal, price alerts', [
        'Crypto holdings, 8-decimal accounting, EGP/USD/USDT conversion'
    ], [
        'No AI features'
    ], [
        'Service: crypto-portfolio-service — Accounting engine',
        'Database: crypto_portfolio schema',
        'Kafka: crypto.alert.triggered.v1'
    ], [
        'Screen: Portfolio — Crypto section with fractional amounts',
        'Screen: Alerts — Crypto volatility alerts'
    ], [
        'Cross-rate calculation updates (BTC->USDT->USD->EGP)'
    ], [
        'Math: 8-decimal addition/subtraction strictly verified',
        'Performance: Alert engine on high crypto tick rate'
    ], [
        'Deploy crypto-portfolio-service'
    ], [
        'Accounting risk: Floating point leak causing missing satoshis'
    ]),
    ('R5.0 Enterprise', 'S-5.12', 'Crypto GA + Riyadh Standby', 'CBE disclaimer, passive standby, 200k MAU', [
        'Full crypto launch, DR environment setup'
    ], [
        'No AI features'
    ], [
        'Service: all — DR replication configuration',
        'Database: Cross-region async replication to Riyadh',
        'Kafka: MirrorMaker 2 setup (passive)'
    ], [
        'Screen: Global — CBE Crypto Advisory Disclaimer',
        'Screen: System — Maintenance mode screens'
    ], [
        'Provision Riyadh AWS/Azure region infrastructure'
    ], [
        'DR: Failover test to Riyadh (RTO/RPO validation)',
        'Compliance: CBE crypto disclaimer enforcement'
    ], [
        'Crypto GA Launch + Riyadh Passive sync'
    ], [
        'DR risk: Data replication lag between Cairo and Riyadh'
    ]),

    # R6.0
    ('R6.0 Scale', 'S-6.1', 'US Market Data Infrastructure', 'IEX/Polygon API, NYSE feeds, EST timezone, after-hours', [
        'US Market timezone management'
    ], [
        'No AI features'
    ], [
        'Service: us-market-data — Polygon/IEX ingestion',
        'Database: us_market_data schema',
        'Kafka: us.tick.v1'
    ], [
        'Screen: Market Hours — Show US Pre/Regular/After hours state'
    ], [
        'EST/EDT daylight savings handling in core'
    ], [
        'Time: Timezone math for market open/close exact seconds',
        'Data: Handle massive US tick volume'
    ], [
        'Deploy us-market-data'
    ], [
        'Data risk: US Options feed volume overwhelms network'
    ]),
    ('R6.0 Scale', 'S-6.2', 'US Stock Data Service', 'S&P 500, NASDAQ, DJIA, Russell 2000, US corporate actions', [
        'US Equity definitions, major indices'
    ], [
        'No AI features'
    ], [
        'Service: us-instrument-service — Security master US',
        'Database: us_instruments schema, corporate_actions',
        'Kafka: us.instrument.updated.v1'
    ], [
        'Screen: US Market — Index trackers (SPY, QQQ)'
    ], [
        'Corporate action processing pipelines (splits/dividends)'
    ], [
        'Data: Stock split historical adjustment logic',
        'Data: Symbol collision checks (e.g. CIB in EGX vs NYSE)'
    ], [
        'Deploy us-instrument-service'
    ], [
        'Data risk: Unhandled corporate action corrupts historical charts'
    ]),
    ('R6.0 Scale', 'S-6.3', 'SEC Compliance Framework', 'SEC advisory disclaimer, US user geolocation', [
        'US specific compliance and geo-blocking if needed'
    ], [
        'No AI features'
    ], [
        'Service: compliance-service — Add SEC rules',
        'Database: geo_ip_logs',
        'Kafka: compliance.sec.check.v1'
    ], [
        'Screen: Onboarding — W-8BEN form info/geo warning',
        'Screen: AI Output — SEC disclaimer'
    ], [
        'GeoIP database integration'
    ], [
        'Compliance: SEC disclaimers on US assets only',
        'Security: VPN detection for prohibited regions'
    ], [
        'Deploy updated compliance-service'
    ], [
        'Regulatory risk: Unlicensed advice to US persons'
    ]),
    ('R6.0 Scale', 'S-6.4', 'US Market AI Schools', 'SCHOOL-14 OptionsFlow, SCHOOL-15 Insider, SCHOOL-16 ESG', [
        'US specific AI analysis'
    ], [
        'Schools 14, 15, 16 deployment'
    ], [
        'Service: ai-us-school — Specialized workers',
        'Database: ai_schools US models',
        'Kafka: us.analysis.completed.v1'
    ], [
        'Screen: US Asset — Insider Activity sentiment',
        'Screen: US Asset — Options Flow gauge'
    ], [
        'Options flow data vendor integration (e.g. CBOE data)'
    ], [
        'AI Quality: Options flow correctly interpreted as bullish/bearish',
        'Integration: SEC Form 4 parsing for insider trades'
    ], [
        'Deploy Schools 14-16'
    ], [
        'Data risk: Options flow data cost and parsing complexity'
    ]),
    ('R6.0 Scale', 'S-6.5', '17-School Consensus Recalibration', 'Quorum 13/17, WisdomEngine update, GlobalMacro SCHOOL-17', [
        'Updated AI voting mechanism'
    ], [
        'SCHOOL-17 deployment, new consensus logic'
    ], [
        'Service: ai-orchestrator — Update logic for 17 schools',
        'Database: ai_wisdom weighting tables',
        'Kafka: ai.consensus.recalibrated.v1'
    ], [
        'Screen: AI Consensus — Updated UI for 17 factors'
    ], [
        'WisdomEngine DB migration'
    ], [
        'Logic: Quorum accurately calculated based on asset type (US vs EGX)',
        'Performance: Orchestrator latency with 17 parallel calls'
    ], [
        'Deploy updated ai-orchestrator'
    ], [
        'AI risk: Consensus becomes too conservative with more schools'
    ]),
    ('R6.0 Scale', 'S-6.6', 'AlternativeData School', 'SCHOOL-18 satellite/web/consumer data (vendor dependent)', [
        'Alternative data integration'
    ], [
        'SCHOOL-18 deployment'
    ], [
        'Service: ai-altdata-school — Alt data analysis',
        'Database: alt_data schema',
        'Kafka: altdata.analyzed.v1'
    ], [
        'Screen: Asset Detail — Alternative Data insights'
    ], [
        'S3 bucket integrations with alt data vendors'
    ], [
        'Integration: Alt data payload parsing',
        'AI Quality: Relevance of alt data to price action'
    ], [
        'Deploy SCHOOL-18'
    ], [
        'Business risk: High cost of alternative datasets vs ROI'
    ]),
    ('R6.0 Scale', 'S-6.7', 'Broker Integration', 'EXC-SOR-001 SOR, 3+ EGX brokers, order lifecycle', [
        'Actual trade execution via partner brokers'
    ], [
        'No AI features'
    ], [
        'Service: order-management-service — FIX/REST routing',
        'Database: order_management schema, executions',
        'Kafka: order.placed.v1, order.filled.v1'
    ], [
        'Screen: Trade Ticket — Limit/Market/Stop orders',
        'Screen: Orders — Live status (Open, Filled, Cancelled)'
    ], [
        'FIX engine deployment, VPN tunnels to brokers'
    ], [
        'Integration: FIX message parsing and state machine',
        'Security: Non-custodial OAuth with broker'
    ], [
        'Deploy order-management-service'
    ], [
        'Execution risk: Dropped FIX messages leading to unknown order states'
    ]),
    ('R6.0 Scale', 'S-6.8', 'Wealth Management', 'WLT-REB-001 tax-aware rebalancing, EGX capital gains', [
        'Tax-loss harvesting and advanced portfolio management'
    ], [
        'No AI features'
    ], [
        'Service: wealth-service — Tax optimization',
        'Database: wealth_management schema, tax_lots',
        'Kafka: tax.optimization.proposed.v1'
    ], [
        'Screen: Wealth — Tax-loss harvesting dashboard'
    ], [
        'Tax lot accounting engine (FIFO, LIFO, Specific ID)'
    ], [
        'Math: Capital gains calculation strictly verified',
        'Logic: Wash sale rule detection'
    ], [
        'Deploy wealth-service'
    ], [
        'Compliance risk: Incorrect tax calculation creates legal liability'
    ]),
    ('R6.0 Scale', 'S-6.9', 'Advisory Services Copilot', 'ADV-COP-001 Arabic advisor workflows, client report draft', [
        'B2B tool for human financial advisors'
    ], [
        'LLM drafting of client communications'
    ], [
        'Service: advisory-service — Advisor portal backend',
        'Database: advisory schema, client_notes',
        'Kafka: advice.drafted.v1'
    ], [
        'Screen: Advisor Web — Client roster and CRM',
        'Screen: Advisor Web — AI Copilot draft generator'
    ], [
        'Separate web frontend deployment for advisors'
    ], [
        'Security: Advisor can only see assigned clients',
        'AI Quality: Professional tone in Arabic drafts'
    ], [
        'Deploy advisory frontend and backend'
    ], [
        'Adoption risk: Advisors distrust AI drafts'
    ]),
    ('R6.0 Scale', 'S-6.10', 'Paper Trading', 'FRA written approval required, execution simulator', [
        'Virtual trading environment'
    ], [
        'No AI features'
    ], [
        'Service: paper-trading-service — Mock execution',
        'Database: paper_trading schema',
        'Kafka: paper.order.filled.v1'
    ], [
        'Screen: Account Switcher — Toggle to Paper Trading',
        'Screen: Paper Dashboard — Virtual balance reset'
    ], [
        'Isolation of paper topics from live order topics'
    ], [
        'Isolation: Paper trades absolutely cannot route to brokers',
        'Logic: Realistic fill simulation based on volume'
    ], [
        'Deploy paper-trading-service'
    ], [
        'Catastrophic risk: Paper order accidentally routed to live broker'
    ]),
    ('R6.0 Scale', 'S-6.11', 'Plugin Marketplace', 'Plugin registration, certification pipeline, rev share', [
        'Third-party extensions (e.g. custom indicators)'
    ], [
        'No AI features'
    ], [
        'Service: plugin-service — Marketplace backend',
        'Database: plugin_marketplace schema',
        'Kafka: plugin.installed.v1'
    ], [
        'Screen: Marketplace — Browse and install plugins'
    ], [
        'Sandboxed execution environment for plugins (WASM)'
    ], [
        'Security: Plugin sandbox escape prevention',
        'Billing: Revenue share calculations'
    ], [
        'Deploy plugin-service'
    ], [
        'Security risk: Malicious plugin steals user API keys'
    ]),
    ('R6.0 Scale', 'S-6.12', 'US GA + Multi-Region Active-Passive', 'Cairo primary, Riyadh active, data residency, 1M MAU', [
        'US Markets launch, Active-Active database setup'
    ], [
        'No AI features'
    ], [
        'Service: all — Geo-routing enabled',
        'Database: CockroachDB/Multi-region Patroni setup',
        'Kafka: MirrorMaker 2 active-active config'
    ], [
        'Screen: Settings — Data residency preference'
    ], [
        'Global DNS load balancing (Route53/Cloudflare)'
    ], [
        'DR: Split-brain resolution testing',
        'Load: 1M MAU distributed traffic test'
    ], [
        'US GA Launch + Riyadh Active'
    ], [
        'Data risk: Multi-region replication conflicts causing data corruption'
    ]),

    # R7.0
    ('R7.0 Global', 'S-7.1', 'GCC Market Data', 'Tadawul, DFM, ADX feeds, GCC security master', [
        'Saudi and UAE market data integration'
    ], [
        'No AI features'
    ], [
        'Service: gcc-market-data — Tadawul/DFM ingestion',
        'Database: gcc_market_data schema',
        'Kafka: gcc.tick.v1'
    ], [
        'Screen: Market — GCC section'
    ], [
        'Direct lines or vendor API for GCC exchanges'
    ], [
        'Data: Tadawul Arabic symbol names formatting',
        'Time: Friday/Sunday GCC weekend handling'
    ], [
        'Deploy gcc-market-data'
    ], [
        'Integration risk: Expensive direct connectivity requirements'
    ]),
    ('R7.0 Global', 'S-7.2', 'GCC Regulatory Compliance', 'CMA Saudi, SCA UAE, all licenses required', [
        'GCC specific compliance rules'
    ], [
        'No AI features'
    ], [
        'Service: compliance-service — GCC rule engine',
        'Database: gcc_kyc schema',
        'Kafka: gcc.kyc.approved.v1'
    ], [
        'Screen: KYC — Absher integration for Saudi users'
    ], [
        'Nafath/Absher API gateway setup'
    ], [
        'Compliance: CMA data residency in Riyadh verified',
        'Integration: Nafath auth flow success'
    ], [
        'Deploy GCC compliance modules'
    ], [
        'Regulatory risk: CMA rejects AI advisory components'
    ]),
    ('R7.0 Global', 'S-7.3', 'GCC AI Market Coverage', 'GCC fundamentals, Arabic news, GCC sector rotation', [
        'AI tuned for GCC markets'
    ], [
        'Fine-tuning models on GCC financial data'
    ], [
        'Service: ai-gcc-school — GCC specific workers',
        'Database: gcc_fundamentals in Qdrant',
        'Kafka: gcc.analysis.completed.v1'
    ], [
        'Screen: Asset Detail — GCC AI Analysis'
    ], [
        'Vectorizing Argaam and GCC news sources'
    ], [
        'AI Quality: Understanding GCC macro (oil prices impact)',
        'Data: News pipeline Arabic encoding'
    ], [
        'Deploy GCC AI workers'
    ], [
        'Data risk: Paywalls on GCC financial news'
    ]),
    ('R7.0 Global', 'S-7.4', 'Dubai Active Region', 'Third active region, active-active-active, write affinity', [
        'Triple-active infrastructure'
    ], [
        'No AI features'
    ], [
        'Service: infra — Deploy to Dubai region',
        'Database: 3-way replication topology',
        'Kafka: 3-way MirrorMaker mesh'
    ], [
        'Screen: Network diagnostics hidden tool'
    ], [
        'Provision UAE cloud region'
    ], [
        'Network: Latency between Cairo, Riyadh, Dubai',
        'Database: Write affinity to user home region works'
    ], [
        'Dubai Region Launch'
    ], [
        'Infra risk: Tri-region consensus latency slows all writes'
    ]),
    ('R7.0 Global', 'S-7.5', 'Knowledge Operating System', 'Financial Knowledge Graph, cross-entity relationships', [
        'Deep linking of assets, executives, macro events'
    ], [
        'Knowledge graph construction (Neo4j)'
    ], [
        'Service: knowledge-graph-service — Graph queries',
        'Database: Neo4j deployment',
        'Kafka: graph.node.updated.v1'
    ], [
        'Screen: Explorer — Visual node graph of asset relationships'
    ], [
        'Neo4j cluster deployment'
    ], [
        'Query: Graph traversal performance < 50ms',
        'Data: Accuracy of executive board member links'
    ], [
        'Deploy Knowledge Graph'
    ], [
        'Tech risk: Unbounded graph queries crashing Neo4j'
    ]),
    ('R7.0 Global', 'S-7.6', 'Enterprise Memory Engine', 'Cross-session learning, experience graph, 1M+ signals', [
        'Long-term personalization memory'
    ], [
        'LLM memory management'
    ], [
        'Service: memory-service — User context retrieval',
        'Database: enterprise_memory schema',
        'Kafka: user.memory.consolidated.v1'
    ], [
        'Screen: Chat — AI references past conversations'
    ], [
        'Background summarization workers'
    ], [
        'AI Quality: Recall of user preferences from 3 months ago',
        'Privacy: Strict isolation of memory between users'
    ], [
        'Deploy memory-service'
    ], [
        'Privacy risk: Memory leak across user sessions'
    ]),
    ('R7.0 Global', 'S-7.7', 'Autonomous Financial Agents Phase 1', 'Advisory agents, FRA/CMA regulatory pre-approval', [
        'Agents that monitor and propose actions 24/7'
    ], [
        'Agentic loop (ReAct/LangGraph)'
    ], [
        'Service: autonomous-agent-service — Agent orchestration',
        'Database: agent_state schema',
        'Kafka: agent.proposal.ready.v1'
    ], [
        'Screen: Agents — Manage active monitoring agents'
    ], [
        'LangGraph/AutoGen state management backend'
    ], [
        'Logic: Agent correctly halts if unsure',
        'Compliance: Agent strictly stays in advisory mode'
    ], [
        'Deploy autonomous-agent-service'
    ], [
        'AI risk: Infinite agent looping burning compute'
    ]),
    ('R7.0 Global', 'S-7.8', 'Autonomous Financial Agents Phase 2', 'Semi-autonomous, user pre-approval workflows, guardrails', [
        'One-click execution of agent proposed multi-step plans'
    ], [
        'Agent planning capabilities'
    ], [
        'Service: agent-execution-service — Sandbox validation',
        'Database: agent_history schema',
        'Kafka: agent.execution.approved.v1'
    ], [
        'Screen: Approval Inbox — Review agent trade plans'
    ], [
        'Pre-execution simulation sandboxes'
    ], [
        'Security: Agent cannot execute without explicit user button click',
        'Logic: Hard limits on trade size for agent plans'
    ], [
        'Deploy agent-execution enhancements'
    ], [
        'Security risk: Prompt injection tricking user into approving bad trades'
    ]),
    ('R7.0 Global', 'S-7.9', 'Collective Intelligence', 'Anonymized signal aggregation, federated learning prep', [
        'Aggregated user sentiment and flow tracking'
    ], [
        'Federated learning data pipelines'
    ], [
        'Service: collective-intelligence-service — Aggregation',
        'Database: collective_intelligence schema',
        'Kafka: ci.signal.aggregated.v1'
    ], [
        'Screen: Market — Tradeora Retail Sentiment indicator'
    ], [
        'Data anonymization proxies (Differential Privacy)'
    ], [
        'Privacy: K-anonymity verified on all exported datasets',
        'Math: Sentiment aggregation accuracy'
    ], [
        'Deploy collective-intelligence-service'
    ], [
        'Privacy risk: De-anonymization attack vector'
    ]),
    ('R7.0 Global', 'S-7.10', 'Proprietary Tradeora LLM', 'Model training completion, deployment, A/B testing', [
        'Custom base model deployment'
    ], [
        'Tradeora-FinLLM-8B deployment'
    ], [
        'Service: llm-gateway — Add proprietary model to router',
        'Database: weights in S3',
        'Kafka: model.ab_test.logged.v1'
    ], [
        'Screen: Settings — Toggle experimental model'
    ], [
        'Custom model serving infrastructure (TensorRT-LLM)'
    ], [
        'AI Quality: Performance vs Qwen2.5 baseline',
        'System: Inference latency and throughput'
    ], [
        'Deploy Tradeora LLM'
    ], [
        'AI risk: Custom model performs worse than open-weights baseline'
    ]),
    ('R7.0 Global', 'S-7.11', 'Whitelabel B2B Platform', '50+ banks, custom branding, dedicated infra', [
        'Enterprise SaaS platform deployment'
    ], [
        'Multi-tenant isolated AI instances'
    ], [
        'Service: b2b-manager-service — Tenant orchestration',
        'Database: whitelabel config schema',
        'Kafka: b2b.tenant.provisioned.v1'
    ], [
        'Screen: B2B Admin — Branding customization'
    ], [
        'Terraform automation for dedicated tenant environments'
    ], [
        'Security: Complete network isolation for dedicated instances',
        'UX: Custom CSS/Theming injection works correctly'
    ], [
        'Deploy Whitelabel infrastructure'
    ], [
        'Scale risk: Operating 50 distinct K8s clusters becomes unmanageable'
    ]),
    ('R7.0 Global', 'S-7.12', 'Global GA', 'MIFID II compliance, 5M MAU, 190+ markets, full ecosystem', [
        'Global expansion completion'
    ], [
        'Global multi-language models'
    ], [
        'Service: all — Massive scale optimizations',
        'Database: Global distributed SQL tuning',
        'Kafka: Global topic replication'
    ], [
        'Screen: Global Markets — Browse 190+ countries'
    ], [
        'Global CDN optimization, Edge compute for TA'
    ], [
        'Load: 5 Million MAU stress test',
        'Compliance: MIFID II reporting verified'
    ], [
        'Global GA Launch'
    ], [
        'Regulatory risk: Conflicting global regulations (SEC vs MIFID vs CMA)'
    ])
]

with open(os.path.join(docs_dir, 'SPRINT_EXECUTION_PLAN.md'), 'w', encoding='utf-8') as f:
    f.write('# Tradeora Financial Operating System\n')
    f.write('## SPRINT EXECUTION PLAN\n')
    f.write('## Version 1.0.0 | Status: AUTHORITATIVE | Date: 2026-07-24\n\n')
    
    for r, s, title, goal, tf, aif, be, fe, infra, test, dep, risk in sprints:
        # compute month/week approximation
        s_num = int(s.split('.')[1])
        f.write(f'## SPRINT {s} — {title}\n\n')
        f.write(f'| Attribute | Value |\n')
        f.write(f'|-----------|-------|\n')
        f.write(f'| Release | {r} |\n')
        f.write(f'| Sprint | S-{(s_num):02d} |\n')
        f.write(f'| Duration | 2 weeks |\n')
        f.write(f'| Sprint Goal | {goal} |\n\n')
        
        f.write('### Trading Features\n')
        for x in tf: f.write(f'- {x}\n')
        f.write('\n### AI Features\n')
        for x in aif: f.write(f'- {x}\n')
        f.write('\n### Backend Tasks\n')
        for x in be: f.write(f'- {x}\n')
        f.write('\n### Frontend Tasks (Flutter)\n')
        for x in fe: f.write(f'- {x}\n')
        f.write('\n### Infrastructure Tasks\n')
        for x in infra: f.write(f'- {x}\n')
        f.write('\n### Testing Tasks\n')
        for x in test: f.write(f'- {x}\n')
        f.write('\n### Deployment\n')
        for x in dep: f.write(f'- {x}\n')
        f.write('\n### Definition of Done\n')
        f.write('- All acceptance criteria for sprint features met\n')
        f.write('- All new Kafka schemas registered in Karapace before first publish\n')
        f.write('- All new API endpoints load-tested at target concurrency\n')
        f.write('- Arabic copy reviewed (if new user-facing text)\n')
        f.write('- Feature flags set to OFF by default, enabled for test cohort only\n')
        f.write(f'\n### Sprint Risks\n')
        for x in risk: f.write(f'- {x}\n')
        f.write('\n---\n\n')

with open(os.path.join(docs_dir, 'IMPLEMENTATION_DEPENDENCY_GRAPH.md'), 'w', encoding='utf-8') as f:
    f.write('''# Tradeora Financial Operating System
## IMPLEMENTATION DEPENDENCY GRAPH
## Version 1.0.0 | Status: AUTHORITATIVE | Date: 2026-07-24

### SECTION 1 — SERVICE DEPENDENCY GRAPH

R1.0 must-deploy-first order:
1. Infrastructure (K8s, network, security groups)
2. PostgreSQL Patroni + Karapace Schema Registry
3. Apache Kafka 3.7+ KRaft
4. Valkey + MinIO WORM + OpenBao
5. Keycloak
6. Kong API Gateway
7. Unleash Feature Flags
8. FluxCD v2 GitOps
9. Prometheus + Grafana + Loki + Tempo
10. market-calendar-service (must know EGX is open before anything)
11. identity-service
12. kyc-service (depends on identity-service)
13. compliance-service (depends on kyc-service)
14. portfolio-service (depends on identity-service + security-master)
15. subscription-service (depends on identity-service)
16. notification-service (depends on Kafka)
17. api-gateway routes configured (Kong)

### SECTION 2 — MODULE DEPENDENCY MATRIX

| Module | Release | Depends On | Required By | Hard/Soft |
|--------|---------|-----------|------------|----------|
| Core Infrastructure | R1.0 | None | All Modules | Hard |
| Identity / Auth | R1.0 | Core Infra | KYC, Portfolio, Subscriptions | Hard |
| KYC / AML | R1.0 | Identity | Trading Enablement, Compliance | Hard |
| Portfolio Management | R1.0 | Identity | Analytics, Risk, Reporting | Hard |
| EGX Market Data | R2.0 | Core Infra, Calendar | Indicators, TA, AI Schools | Hard |
| Forex Market Data | R2.0 | Core Infra, FX Calendar | Indicators, AI Schools | Hard |
| AI Gateway | R3.0 | Vector DB, LLM Infra | All AI Schools | Hard |
| AI Schools 01-12 | R3.0 | AI Gateway, Market Data | AI Consensus, Wisdom Engine | Hard |
| Risk Profiling & VaR | R4.0 | Portfolio | Stress Testing, Rebalancing | Hard |
| Crypto Infra | R5.0 | Core Infra, Market Data | Crypto TA, Crypto Portfolio | Hard |
| US Market Infra | R6.0 | Core Infra, Market Data | US Schools, US Options | Hard |
| Broker Integration | R6.0 | Portfolio, Identity | Paper Trading, Live Trading | Hard |
| GCC Integration | R7.0 | Compliance, Market Data | GCC Schools | Hard |
| Autonomous Agents | R7.0 | Knowledge Graph, Memory | Final AI Workflow | Soft |

### SECTION 3 — KAFKA TOPIC DEPENDENCY CHAIN

- **Topic Creation Order & SAGA Events:**
  - `users.created.v1` → Required by `kyc.submitted.v1`, `portfolio.created.v1`
  - **SAGA-001 (KYC)**: `kyc.submitted.v1` → Consumer: `compliance-service` → `kyc.approved.v1` or `kyc.rejected.v1`
  - **SAGA-002 (Subscription)**: `subscription.purchased` → Consumer: `billing-service` → `subscription.activated`
  - `market.session.status.v1` → Required by all `trade.execution.*` events (EGX)
  - `forex.tick.v1` / `egx.tick.v1` → Consumers: `ta-service`, `alert-service`, `market-data-service`
  - **SAGA-003 (AI Output)**: `ai.school.completed.v1` (12x) → Consumer: `ai-orchestrator` → `ai.consensus.reached.v1` (Logged to WORM)
  - **SAGA-005 (Rebalancing)**: `rebalance.proposed.v1` → Consumer: `risk-service`, `order-management` → `rebalance.executed.v1`
  - `us.tick.v1`, `crypto.tick.v1` → Independent of EGX session state.

### SECTION 4 — DATABASE MIGRATION DEPENDENCY ORDER

- **R1.0:** `identity` → `compliance` → `market_calendar` → `instruments` → `portfolio` → `subscriptions` → `notifications` → `audit`
- **R2.0:** `forex_pairs` → `market_data` → `fundamentals` → `news` → `macro` → `alerts` → `corporate_actions` → `sectors` → `screening`
- **R3.0:** `ai_infra` (Qdrant) → `ai_schools` → `ai_wisdom` → `ai_safety` → `ai_explanations`
- **R4.0:** `risk_profiling` → `risk` → `position_sizing` → `rebalancing` → `reports` → `economic_calendar`
- **R5.0:** `ground_truth` → `learning` → `backtesting` → `monte_carlo` → `multi_tenancy` → `crypto_instruments` → `crypto_market_data` → `crypto_portfolio`
- **R6.0:** `us_instruments` → `us_market_data` → `us_options` → `order_management` → `paper_trading` → `wealth_management` → `plugin_marketplace` → `advisory`
- **R7.0:** `gcc_instruments` → `gcc_market_data` → `knowledge_graph` → `enterprise_memory` → `collective_intelligence` → `whitelabel`

### SECTION 5 — FOREX-SPECIFIC DEPENDENCIES

- Forex trading is 24/5 (Sunday 21:00 UTC – Friday 21:00 UTC).
- Forex feed does NOT use EGX session gate (24/5 continuous).
- Forex requires separate `market-hours-service` with FX session tracking:
  - Sydney session: 21:00–06:00 UTC
  - Tokyo session: 00:00–09:00 UTC
  - London session: 07:00–16:00 UTC
  - New York session: 12:00–21:00 UTC
- Pip precision: major pairs = 0.00001 (5 decimal places), JPY pairs = 0.001 (3 decimal).
- Spread tracking (bid-ask spread for FX pairs) requires decimal precision compliance.
- Economic calendar events that affect FX: Fed decisions, ECB decisions, CBE decisions, NFP, CPI.

### SECTION 6 — CRYPTO-SPECIFIC DEPENDENCIES

- Crypto trading is 24/7/365. No session gate at all.
- Crypto feed: WebSocket connections to Binance + CoinGecko + CryptoCompare.
- Price precision: 8 decimal places (`Decimal('0.00000001')` minimum tick).
- On-chain metrics ingestion (Glassnode/CryptoQuant API).
- Fear & Greed index (alternative.me API).
- Social sentiment (Reddit r/CryptoCurrency, Crypto Twitter API).
- Crypto-specific risk: 20%+ daily moves possible — special VaR parameters required in `risk-service`.
- CBE advisory statement required on all Egyptian-facing crypto content via `compliance-service`.

### SECTION 7 — US STOCKS-SPECIFIC DEPENDENCIES

- NYSE/NASDAQ session: 09:30–16:00 ET (Mon-Fri, NYSE calendar).
- Pre-market: 04:00–09:30 ET (Premium only).
- After-hours: 16:00–20:00 ET (Premium only).
- Timezone: ET (UTC-5 in winter, UTC-4 in summer — DST handling required).
- Cairo offset: US market opens at 16:30 Cairo time (winter) or 15:30 (summer).
- Decimal precision: USD to 2 decimal places (stocks), 4 for ETFs.
- SEC advisory compliance: every AI output must include SEC-required disclaimer.
- Data vendors: IEX Cloud / Polygon.io / Alpaca Markets API.
- Corporate actions: US dividends, splits, SPAC mergers handled by `us-instrument-service`.

### SECTION 8 — CRITICAL PATH ANALYSIS

- **R1.0 Critical Path: [3 months]** Infrastructure deployment → Keycloak Auth → KYC/AML pipeline. Bottleneck: KYC OCR accuracy and FRA manual validation mapping.
- **R2.0 Critical Path: [3 months]** TimescaleDB setup → EGX + Forex Feed ingestion → Technical Indicator computation engine. Bottleneck: Real-time calculation latency for indicators.
- **R3.0 Critical Path: [3 months]** GPU provisioning → Qdrant Vector DB → 12 Schools Deployment → Consensus Engine. Bottleneck: Ollama prompt inference rate limits.
- **R4.0 Critical Path: [3 months]** Risk Profiling → VaR Engine → Stress Testing → PDF Generation. Bottleneck: Matrix math performance for VaR across thousands of portfolios.
- **R5.0 Critical Path: [6 months]** Crypto Infrastructure → 8-Decimal Precision Migration → Backtesting Engine → AI Learning Engine. Bottleneck: Ensuring absolute precision compliance across existing services while migrating crypto.
- **R6.0 Critical Path: [6 months]** US Data Feed (Polygon/IEX) → Options Flow Models → Broker Integration (FIX routing). Bottleneck: Broker FIX API certification and testing.
- **R7.0 Critical Path: [6 months]** Multi-Region Active/Active Sync → GCC Licensing → Autonomous Agents Launch. Bottleneck: Tri-region DB latency and regulatory approval for autonomous execution.
''')

print("Documents generated successfully.")
