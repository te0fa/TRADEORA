# Tradeora Financial Operating System
## AI Service Catalog
## Version 1.0.0 | Status: AUTHORITATIVE | Date: 2026-07-24

╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Owner: Enterprise AI Architecture Council                                   ║
║  Classification: ENTERPRISE CONFIDENTIAL                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

## Section 1 — Catalog Overview

### Purpose
The AI Service Catalog is the authoritative discoverability layer of the Tradeora AI Capability Registry. This document defines the operational characteristics, service level agreements (SLAs), API structures, and ownership of all 26 AI engines within the Tradeora Financial Operating System. It serves as the primary reference for engineering teams integrating AI capabilities, product managers designing new features, and executives monitoring platform health.

### Audience
*   **Engineering**: To discover available services, understand API contracts, configure gRPC/REST endpoints, and implement circuit breakers.
*   **Product Management**: To understand available capabilities, rate limits by user tier, and feature flag dependencies for product rollouts.
*   **Business & Operations**: To review SLA compliance, monitor system health, and understand internal pricing models.

### Catalog Conventions
*   **Registry ID**: A unique identifier for each AI engine (e.g., TRD-AI-001).
*   **Feature Flag**: LaunchDarkly key used to control service availability.
*   **Endpoint**: The gRPC or REST endpoint path.

### Service Tier Definitions
*   **Core**: Mission-critical engines required for basic platform operation and core trading workflows. Must maintain maximum availability.
*   **Supporting**: Value-add engines that enhance the platform experience but are not critical for basic execution. Can degrade gracefully.
*   **Experimental**: New engines in beta testing or limited rollout. SLAs are best-effort.

### SLA Tiers
*   **Platinum (99.99%)**: Max downtime 4.32 mins/month. P50 Latency < 50ms. P99 Latency < 200ms.
*   **Gold (99.9%)**: Max downtime 43.2 mins/month. P50 Latency < 100ms. P99 Latency < 500ms.
*   **Silver (99.5%)**: Max downtime 3.6 hours/month. P50 Latency < 200ms. P99 Latency < 1000ms.

---

## Section 2 — Service Catalog

### Group 1: Market Analysis Schools

#### 1. Market Intelligence Engine
*   **Registry ID**: TRD-AI-001
*   **Description**: Analyzes overall market conditions, trend direction, and broad market breadth indicators for the EGX.
*   **Service Tier**: Core
*   **SLA Tier**: Platinum
*   **Primary Consumers**: Portfolio Intelligence, Arbitration Engine, Meta Decision Engine
*   **API Quick Reference**: 
    *   Endpoint: `/api/v1/ai/market-intelligence`
    *   Request: `{ "market": "EGX", "timeframe": "1D" }`
    *   Response: `{ "trend": "BULLISH", "strength": 0.85, "breadth": 0.72 }`
*   **Feature Flag**: `ai-engine-market-intel`
*   **Rate Limits**: 
    *   RETAIL: 100 req/min
    *   WEALTH: 500 req/min
    *   FAMILY_OFFICE: 2000 req/min
    *   INSTITUTIONAL: 10000 req/min
*   **Monitoring**: `grafana/d/trd-ai-001/market-intel`
*   **On-call Team**: Quant Engineering Alpha
*   **Current Version**: v2.4.1
*   **Known Limitations**: High latency during market open (first 5 minutes).
*   **Pricing Model**: $0.001 / query

#### 2. Macro Intelligence Engine
*   **Registry ID**: TRD-AI-002
*   **Description**: Evaluates macroeconomic indicators, interest rates (CBE), inflation data, and geopolitical events.
*   **Service Tier**: Core
*   **SLA Tier**: Gold
*   **Primary Consumers**: Market Intelligence, Portfolio Intelligence
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/macro-intelligence`
    *   Request: `{ "region": "MENA", "indicators": ["CPI", "GDP"] }`
    *   Response: `{ "sentiment": "NEUTRAL", "risk_premium": 0.045 }`
*   **Feature Flag**: `ai-engine-macro-intel`
*   **Rate Limits**: RETAIL: 50 req/min | WEALTH: 200 req/min | FAMILY_OFFICE: 1000 req/min | INSTITUTIONAL: 5000 req/min
*   **Monitoring**: `grafana/d/trd-ai-002/macro-intel`
*   **On-call Team**: Macro Research Tech
*   **Current Version**: v1.8.0
*   **Known Limitations**: Data updates are dependent on external agency release schedules.
*   **Pricing Model**: $0.005 / query

#### 3. Technical Analysis Intelligence
*   **Registry ID**: TRD-AI-003
*   **Description**: Computes standard technical indicators (RSI, MACD, Bollinger Bands, Moving Averages) across multiple timeframes.
*   **Service Tier**: Core
*   **SLA Tier**: Platinum
*   **Primary Consumers**: User Dashboards, Arbitration Engine, Strategy Engine
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/technical-analysis`
    *   Request: `{ "symbol": "COMI.CA", "indicators": ["RSI", "MACD"], "timeframe": "1H" }`
    *   Response: `{ "RSI": 45.2, "MACD": { "value": 1.2, "signal": 0.8, "hist": 0.4 } }`
*   **Feature Flag**: `ai-engine-ta`
*   **Rate Limits**: RETAIL: 300 req/min | WEALTH: 1000 req/min | FAMILY_OFFICE: 5000 req/min | INSTITUTIONAL: 20000 req/min
*   **Monitoring**: `grafana/d/trd-ai-003/tech-analysis`
*   **On-call Team**: Trading Infrastructure
*   **Current Version**: v3.1.2
*   **Known Limitations**: Max 500 candles per request.
*   **Pricing Model**: $0.0001 / query

#### 4. Smart Money Intelligence
*   **Registry ID**: TRD-AI-004
*   **Description**: Tracks institutional order flow, block trades, and identifies accumulation/distribution patterns.
*   **Service Tier**: Core
*   **SLA Tier**: Platinum
*   **Primary Consumers**: ICT Intelligence, Wyckoff Intelligence, Meta Decision Engine
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/smart-money`
    *   Request: `{ "symbol": "HRHO.CA", "window": "1D" }`
    *   Response: `{ "net_flow": 15000000, "accumulation_phase": true, "institutional_activity": "HIGH" }`
*   **Feature Flag**: `ai-engine-smart-money`
*   **Rate Limits**: RETAIL: N/A | WEALTH: 50 req/min | FAMILY_OFFICE: 500 req/min | INSTITUTIONAL: 5000 req/min
*   **Monitoring**: `grafana/d/trd-ai-004/smart-money`
*   **On-call Team**: Quant Engineering Beta
*   **Current Version**: v2.0.5
*   **Known Limitations**: Requires Level 2 market data.
*   **Pricing Model**: $0.01 / query

#### 5. ICT Intelligence
*   **Registry ID**: TRD-AI-005
*   **Description**: Applies Inner Circle Trader (ICT) concepts like Fair Value Gaps (FVG), Order Blocks, and Liquidity Pools.
*   **Service Tier**: Supporting
*   **SLA Tier**: Gold
*   **Primary Consumers**: Arbitration Engine, Strategy Engine
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/ict-intelligence`
    *   Request: `{ "symbol": "FWRY.CA", "timeframe": "15m" }`
    *   Response: `{ "fvg_zones": [...], "order_blocks": [...], "liquidity_sweeps": [...] }`
*   **Feature Flag**: `ai-engine-ict`
*   **Rate Limits**: RETAIL: 20 req/min | WEALTH: 100 req/min | FAMILY_OFFICE: 500 req/min | INSTITUTIONAL: 2000 req/min
*   **Monitoring**: `grafana/d/trd-ai-005/ict-intel`
*   **On-call Team**: Quant Engineering Beta
*   **Current Version**: v1.5.0
*   **Known Limitations**: Can generate noisy signals in ranging markets.
*   **Pricing Model**: $0.005 / query

#### 6. Wyckoff Intelligence
*   **Registry ID**: TRD-AI-006
*   **Description**: Identifies Wyckoff market phases (Accumulation, Markup, Distribution, Markdown) and specific events (Spring, Upthrust).
*   **Service Tier**: Supporting
*   **SLA Tier**: Gold
*   **Primary Consumers**: Arbitration Engine, Market Intelligence
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/wyckoff`
    *   Request: `{ "symbol": "EAST.CA", "timeframe": "1D" }`
    *   Response: `{ "phase": "ACCUMULATION", "sub_phase": "Phase C", "recent_event": "SPRING", "confidence": 0.88 }`
*   **Feature Flag**: `ai-engine-wyckoff`
*   **Rate Limits**: RETAIL: 20 req/min | WEALTH: 100 req/min | FAMILY_OFFICE: 500 req/min | INSTITUTIONAL: 2000 req/min
*   **Monitoring**: `grafana/d/trd-ai-006/wyckoff`
*   **On-call Team**: Market Structure Team
*   **Current Version**: v1.2.1
*   **Known Limitations**: Requires significant historical data context (min 200 bars).
*   **Pricing Model**: $0.005 / query

#### 7. Elliott Wave Intelligence
*   **Registry ID**: TRD-AI-007
*   **Description**: Maps Elliott Wave counts (Motive and Corrective waves) and projects potential targets based on Fibonacci extensions.
*   **Service Tier**: Supporting
*   **SLA Tier**: Silver
*   **Primary Consumers**: Arbitration Engine, Strategy Engine
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/elliott-wave`
    *   Request: `{ "symbol": "EKHO.CA", "timeframe": "1D" }`
    *   Response: `{ "current_wave": "Wave 3", "degree": "Intermediate", "targets": [45.5, 52.0] }`
*   **Feature Flag**: `ai-engine-elliott-wave`
*   **Rate Limits**: RETAIL: 10 req/min | WEALTH: 50 req/min | FAMILY_OFFICE: 200 req/min | INSTITUTIONAL: 1000 req/min
*   **Monitoring**: `grafana/d/trd-ai-007/elliott-wave`
*   **On-call Team**: Quant Engineering Gamma
*   **Current Version**: v1.1.0
*   **Known Limitations**: High computational cost; wave counts can frequently revise.
*   **Pricing Model**: $0.02 / query

#### 8. Volume Intelligence
*   **Registry ID**: TRD-AI-008
*   **Description**: Analyzes Volume Profile, Volume Weighted Average Price (VWAP), and anomalies in trading volume.
*   **Service Tier**: Core
*   **SLA Tier**: Platinum
*   **Primary Consumers**: Smart Money Intelligence, Technical Analysis Intelligence, Arbitration Engine
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/volume-intelligence`
    *   Request: `{ "symbol": "TMGH.CA", "session": "CURRENT" }`
    *   Response: `{ "poc": 12.4, "value_area_high": 12.8, "value_area_low": 12.1, "vwap": 12.5 }`
*   **Feature Flag**: `ai-engine-volume`
*   **Rate Limits**: RETAIL: 200 req/min | WEALTH: 800 req/min | FAMILY_OFFICE: 3000 req/min | INSTITUTIONAL: 15000 req/min
*   **Monitoring**: `grafana/d/trd-ai-008/volume-intel`
*   **On-call Team**: Trading Infrastructure
*   **Current Version**: v2.5.0
*   **Known Limitations**: None.
*   **Pricing Model**: $0.001 / query

### Group 2: Intelligence Layer

#### 9. Sentiment Intelligence Engine
*   **Registry ID**: TRD-AI-009
*   **Description**: Analyzes social media (Twitter, local forums), news headlines, and analyst reports to gauge market sentiment.
*   **Service Tier**: Core
*   **SLA Tier**: Gold
*   **Primary Consumers**: Market Intelligence, Meta Decision Engine
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/sentiment`
    *   Request: `{ "entity": "EGX30" }`
    *   Response: `{ "score": 0.65, "classification": "BULLISH", "momentum": "INCREASING" }`
*   **Feature Flag**: `ai-engine-sentiment`
*   **Rate Limits**: RETAIL: 50 req/min | WEALTH: 200 req/min | FAMILY_OFFICE: 1000 req/min | INSTITUTIONAL: 5000 req/min
*   **Monitoring**: `grafana/d/trd-ai-009/sentiment`
*   **On-call Team**: NLP Engineering
*   **Current Version**: v2.2.0
*   **Known Limitations**: Arabic NLP models sometimes struggle with local Egyptian slang (Amiya).
*   **Pricing Model**: $0.002 / query

#### 10. News Intelligence Engine
*   **Registry ID**: TRD-AI-010
*   **Description**: Ingests, categorizes, summarizes, and extracts entities/impact from real-time financial news feeds.
*   **Service Tier**: Core
*   **SLA Tier**: Platinum
*   **Primary Consumers**: Sentiment Intelligence, User Dashboards
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/news-intelligence`
    *   Request: `{ "symbol": "COMI.CA", "hours": 24 }`
    *   Response: `{ "articles": [...], "summary": "Positive earnings report drives CIB higher...", "impact_score": 0.8 }`
*   **Feature Flag**: `ai-engine-news`
*   **Rate Limits**: RETAIL: 100 req/min | WEALTH: 500 req/min | FAMILY_OFFICE: 2000 req/min | INSTITUTIONAL: 10000 req/min
*   **Monitoring**: `grafana/d/trd-ai-010/news-intel`
*   **On-call Team**: NLP Engineering
*   **Current Version**: v3.0.1
*   **Known Limitations**: Dependent on external news APIs (Reuters, Bloomberg, Enterprise).
*   **Pricing Model**: $0.005 / query

#### 11. Portfolio Intelligence
*   **Registry ID**: TRD-AI-011
*   **Description**: Analyzes user portfolios, calculates risk metrics (Sharpe, Sortino), and suggests rebalancing actions.
*   **Service Tier**: Core
*   **SLA Tier**: Platinum
*   **Primary Consumers**: User Dashboards, Risk Intelligence, Meta Intelligence
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/portfolio-intelligence`
    *   Request: `{ "portfolio_id": "usr_123_pf_1" }`
    *   Response: `{ "beta": 1.1, "var_95": 0.02, "suggestions": [...] }`
*   **Feature Flag**: `ai-engine-portfolio`
*   **Rate Limits**: RETAIL: 20 req/min | WEALTH: 100 req/min | FAMILY_OFFICE: 500 req/min | INSTITUTIONAL: 5000 req/min
*   **Monitoring**: `grafana/d/trd-ai-011/portfolio`
*   **On-call Team**: Wealth Tech
*   **Current Version**: v2.1.0
*   **Known Limitations**: Rebalancing suggestions are computed daily, not intra-day.
*   **Pricing Model**: $0.05 / query

#### 12. Risk Intelligence
*   **Registry ID**: TRD-AI-012
*   **Description**: Continuously monitors market risks, user margin levels, and portfolio stress tests against historical scenarios (e.g., 2016 float).
*   **Service Tier**: Core
*   **SLA Tier**: Platinum
*   **Primary Consumers**: Execution Engine, Position Sizing, Meta Decision
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/risk-intelligence`
    *   Request: `{ "portfolio_id": "usr_123_pf_1", "scenarios": ["FLOAT_2016", "COVID_2020"] }`
    *   Response: `{ "risk_score": 85, "margin_call_prob": 0.01, "stress_test_drawdown": -0.15 }`
*   **Feature Flag**: `ai-engine-risk`
*   **Rate Limits**: RETAIL: 50 req/min | WEALTH: 200 req/min | FAMILY_OFFICE: 1000 req/min | INSTITUTIONAL: 10000 req/min
*   **Monitoring**: `grafana/d/trd-ai-012/risk`
*   **On-call Team**: Risk Engineering
*   **Current Version**: v4.0.0
*   **Known Limitations**: Stress tests are computationally heavy.
*   **Pricing Model**: $0.10 / query

### Group 3: Execution Layer

#### 13. Position Sizing Engine
*   **Registry ID**: TRD-AI-013
*   **Description**: Calculates optimal trade size based on user risk tolerance, account size, stop-loss levels, and Kelly Criterion.
*   **Service Tier**: Core
*   **SLA Tier**: Platinum
*   **Primary Consumers**: Strategy Engine, User Dashboards
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/position-sizing`
    *   Request: `{ "account_balance": 100000, "risk_per_trade": 0.01, "entry": 50, "stop_loss": 48 }`
    *   Response: `{ "recommended_shares": 500, "capital_allocated": 25000 }`
*   **Feature Flag**: `ai-engine-pos-sizing`
*   **Rate Limits**: RETAIL: 100 req/min | WEALTH: 500 req/min | FAMILY_OFFICE: 2000 req/min | INSTITUTIONAL: 10000 req/min
*   **Monitoring**: `grafana/d/trd-ai-013/pos-sizing`
*   **On-call Team**: Execution Tech
*   **Current Version**: v1.5.0
*   **Known Limitations**: Assumes perfect execution at stop loss (no slippage in basic calculation).
*   **Pricing Model**: $0.001 / query

#### 14. Strategy Engine
*   **Registry ID**: TRD-AI-014
*   **Description**: Generates and manages algorithmic trading strategies, combining signals from multiple schools into executable logic.
*   **Service Tier**: Core
*   **SLA Tier**: Platinum
*   **Primary Consumers**: Backtesting Engine, Simulation Engine, Execution System
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/strategy`
    *   Request: `{ "strategy_id": "str_abc", "data_feed": [...] }`
    *   Response: `{ "action": "BUY", "target": 55, "stop": 48 }`
*   **Feature Flag**: `ai-engine-strategy`
*   **Rate Limits**: RETAIL: N/A | WEALTH: 20 req/min | FAMILY_OFFICE: 100 req/min | INSTITUTIONAL: 1000 req/min
*   **Monitoring**: `grafana/d/trd-ai-014/strategy`
*   **On-call Team**: Quant Engineering Alpha
*   **Current Version**: v2.8.1
*   **Known Limitations**: Limit 10 active strategies per Retail user.
*   **Pricing Model**: $0.05 / query

#### 15. Backtesting Engine
*   **Registry ID**: TRD-AI-015
*   **Description**: Simulates strategy performance over historical market data, calculating metrics like Max Drawdown, Win Rate, and Profit Factor.
*   **Service Tier**: Supporting
*   **SLA Tier**: Silver
*   **Primary Consumers**: User Dashboards, Strategy Engine
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/backtest`
    *   Request: `{ "strategy_id": "str_abc", "start_date": "2020-01-01", "end_date": "2023-12-31" }`
    *   Response: `{ "cagr": 0.15, "max_drawdown": -0.20, "trades_executed": 150 }`
*   **Feature Flag**: `ai-engine-backtest`
*   **Rate Limits**: RETAIL: 5 req/min | WEALTH: 20 req/min | FAMILY_OFFICE: 100 req/min | INSTITUTIONAL: 500 req/min
*   **Monitoring**: `grafana/d/trd-ai-015/backtest`
*   **On-call Team**: Data Engineering
*   **Current Version**: v3.0.0
*   **Known Limitations**: High latency (asynchronous execution recommended).
*   **Pricing Model**: $0.50 / query

#### 16. Simulation Engine
*   **Registry ID**: TRD-AI-016
*   **Description**: Runs Monte Carlo simulations and forward-testing (paper trading) environments using live data.
*   **Service Tier**: Supporting
*   **SLA Tier**: Gold
*   **Primary Consumers**: Risk Intelligence, Portfolio Intelligence
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/simulation`
    *   Request: `{ "portfolio_id": "usr_123_pf_1", "iterations": 10000, "horizon_days": 252 }`
    *   Response: `{ "expected_return": 0.12, "var_99": 0.25 }`
*   **Feature Flag**: `ai-engine-sim`
*   **Rate Limits**: RETAIL: 2 req/min | WEALTH: 10 req/min | FAMILY_OFFICE: 50 req/min | INSTITUTIONAL: 200 req/min
*   **Monitoring**: `grafana/d/trd-ai-016/simulation`
*   **On-call Team**: Risk Engineering
*   **Current Version**: v1.2.0
*   **Known Limitations**: Computationally very expensive.
*   **Pricing Model**: $1.00 / query

### Group 4: Orchestration

#### 17. Arbitration Engine
*   **Registry ID**: TRD-AI-017
*   **Description**: Resolves conflicting signals between different Market Analysis Schools (e.g., ICT says sell, Elliott Wave says buy).
*   **Service Tier**: Core
*   **SLA Tier**: Platinum
*   **Primary Consumers**: Meta Decision Engine, Consensus Orchestrator
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/arbitration`
    *   Request: `{ "signals": [{"school": "ICT", "action": "SELL", "confidence": 0.8}, {"school": "TA", "action": "BUY", "confidence": 0.6}] }`
    *   Response: `{ "resolution": "SELL", "weighted_confidence": 0.72, "reasoning": "ICT FVG alignment outweighs TA RSI divergence" }`
*   **Feature Flag**: `ai-engine-arbitration`
*   **Rate Limits**: Internal Service Only - No External Limits
*   **Monitoring**: `grafana/d/trd-ai-017/arbitration`
*   **On-call Team**: Core AI Architecture
*   **Current Version**: v2.0.0
*   **Known Limitations**: None
*   **Pricing Model**: Internal Transfer Pricing

#### 18. Meta Decision Engine
*   **Registry ID**: TRD-AI-018
*   **Description**: Takes the output from Arbitration, incorporates Risk and Portfolio contexts, and makes the final trading decision.
*   **Service Tier**: Core
*   **SLA Tier**: Platinum
*   **Primary Consumers**: Consensus Orchestrator, Execution System
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/meta-decision`
    *   Request: `{ "arbitrated_signal": {...}, "risk_profile": {...}, "portfolio_state": {...} }`
    *   Response: `{ "final_decision": "EXECUTE", "allocation_pct": 0.05 }`
*   **Feature Flag**: `ai-engine-meta-decision`
*   **Rate Limits**: Internal Service Only
*   **Monitoring**: `grafana/d/trd-ai-018/meta-decision`
*   **On-call Team**: Core AI Architecture
*   **Current Version**: v1.5.0
*   **Known Limitations**: Highly dependent on low-latency Risk data.
*   **Pricing Model**: Internal Transfer Pricing

#### 19. Consensus Orchestrator
*   **Registry ID**: TRD-AI-019
*   **Description**: The conductor. Manages the parallel execution of all analysis engines, waits for responses, and routes to Arbitration.
*   **Service Tier**: Core
*   **SLA Tier**: Platinum
*   **Primary Consumers**: Frontend API Gateway, System Schedulers
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/orchestrator/consensus`
    *   Request: `{ "symbol": "COMI.CA", "context": "USER_REQUEST" }`
    *   Response: `{ "consensus_reached": true, "final_recommendation": "STRONG_BUY", "breakdown": {...} }`
*   **Feature Flag**: `ai-engine-consensus`
*   **Rate Limits**: Matches API Gateway tier limits
*   **Monitoring**: `grafana/d/trd-ai-019/orchestrator`
*   **On-call Team**: Platform Infrastructure
*   **Current Version**: v3.2.0
*   **Known Limitations**: Tail latency is determined by the slowest responding school engine.
*   **Pricing Model**: Internal Transfer Pricing

#### 20. Meta Intelligence Engine
*   **Registry ID**: TRD-AI-020
*   **Description**: Generates high-level natural language narratives explaining the rationale behind the Consensus Orchestrator's output to the user.
*   **Service Tier**: Core
*   **SLA Tier**: Gold
*   **Primary Consumers**: User Interface, Notifications Service
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/meta-intelligence`
    *   Request: `{ "decision_data": {...}, "language": "ar-EG" }`
    *   Response: `{ "narrative": "السوق يشهد تجميعاً مؤسسياً، وننصح بالشراء..." }`
*   **Feature Flag**: `ai-engine-meta-intel`
*   **Rate Limits**: RETAIL: 100 req/min | WEALTH: 500 req/min
*   **Monitoring**: `grafana/d/trd-ai-020/meta-intel`
*   **On-call Team**: Generative AI Team
*   **Current Version**: v2.1.0
*   **Known Limitations**: LLM inference adds ~800ms latency.
*   **Pricing Model**: $0.01 / query

### Group 5: Enterprise Memory & Learning

#### 21. Enterprise Memory Engine
*   **Registry ID**: TRD-AI-021
*   **Description**: Vector database manager storing all past decisions, market contexts, and outcomes for RAG (Retrieval-Augmented Generation) retrieval.
*   **Service Tier**: Core
*   **SLA Tier**: Gold
*   **Primary Consumers**: Knowledge OS, Learning Engine, Arbitration Engine
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/memory/query`
    *   Request: `{ "vector": [...], "top_k": 5, "filter": {"market": "EGX"} }`
    *   Response: `{ "results": [{ "id": "mem_1", "context": "...", "score": 0.95 }] }`
*   **Feature Flag**: `ai-engine-memory`
*   **Rate Limits**: Internal Service Only
*   **Monitoring**: `grafana/d/trd-ai-021/memory`
*   **On-call Team**: Data Platform
*   **Current Version**: v1.8.0
*   **Known Limitations**: Embedding generation limits throughput.
*   **Pricing Model**: Internal Transfer Pricing

#### 22. Knowledge OS
*   **Registry ID**: TRD-AI-022
*   **Description**: The semantic layer over Enterprise Memory. Organizes raw vectors into structured knowledge graphs (e.g., "COMI is correlated with EGP/USD rate").
*   **Service Tier**: Supporting
*   **SLA Tier**: Silver
*   **Primary Consumers**: Meta Intelligence, Market Intelligence
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/knowledge/graph`
    *   Request: `{ "entity_id": "COMI.CA", "depth": 2 }`
    *   Response: `{ "nodes": [...], "edges": [...] }`
*   **Feature Flag**: `ai-engine-knowledge-os`
*   **Rate Limits**: Internal Service Only
*   **Monitoring**: `grafana/d/trd-ai-022/knowledge`
*   **On-call Team**: Data Platform
*   **Current Version**: v1.1.0
*   **Known Limitations**: Graph traversal can be slow for highly connected nodes.
*   **Pricing Model**: Internal Transfer Pricing

#### 23. Learning Engine
*   **Registry ID**: TRD-AI-023
*   **Description**: Continuously evaluates past AI predictions against actual market outcomes to calculate accuracy scores for each school.
*   **Service Tier**: Core
*   **SLA Tier**: Silver
*   **Primary Consumers**: Arbitration Engine (for weighting), Decision Improvement Engine
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/learning/evaluate`
    *   Request: `{ "prediction_id": "pred_xyz", "actual_outcome": 56.5 }`
    *   Response: `{ "error_margin": 0.02, "school_weight_adjustments": {"ICT": +0.01, "TA": -0.02} }`
*   **Feature Flag**: `ai-engine-learning`
*   **Rate Limits**: Internal Service Only
*   **Monitoring**: `grafana/d/trd-ai-023/learning`
*   **On-call Team**: Core AI Architecture
*   **Current Version**: v2.0.0
*   **Known Limitations**: Runs in batch mode (hourly updates).
*   **Pricing Model**: Internal Transfer Pricing

#### 24. Self-Reflection Engine
*   **Registry ID**: TRD-AI-024
*   **Description**: Audits the reasoning of the Meta Decision Engine to identify logical flaws or hallucinated data in its outputs.
*   **Service Tier**: Supporting
*   **SLA Tier**: Gold
*   **Primary Consumers**: Meta Intelligence, Compliance Team
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/self-reflection/audit`
    *   Request: `{ "decision_trace_id": "trace_123" }`
    *   Response: `{ "status": "PASS", "confidence": 0.99, "flags": [] }`
*   **Feature Flag**: `ai-engine-self-reflection`
*   **Rate Limits**: Internal Service Only
*   **Monitoring**: `grafana/d/trd-ai-024/reflection`
*   **On-call Team**: AI Safety
*   **Current Version**: v1.0.0
*   **Known Limitations**: LLM-as-a-judge paradigm introduces some variability.
*   **Pricing Model**: Internal Transfer Pricing

#### 25. Bias Detection Engine
*   **Registry ID**: TRD-AI-025
*   **Description**: Monitors predictions for systemic bias (e.g., perpetual bullishness on specific sectors or over-weighting specific indicators).
*   **Service Tier**: Supporting
*   **SLA Tier**: Gold
*   **Primary Consumers**: Learning Engine, Risk Engineering
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/bias/analyze`
    *   Request: `{ "school": "Smart Money", "window": "30D" }`
    *   Response: `{ "bias_score": 0.8, "identified_bias": "LONG_BIAS_REAL_ESTATE" }`
*   **Feature Flag**: `ai-engine-bias`
*   **Rate Limits**: Internal Service Only
*   **Monitoring**: `grafana/d/trd-ai-025/bias`
*   **On-call Team**: AI Safety
*   **Current Version**: v1.2.0
*   **Known Limitations**: Requires large sample sizes to detect statistically significant bias.
*   **Pricing Model**: Internal Transfer Pricing

#### 26. Decision Improvement Engine
*   **Registry ID**: TRD-AI-026
*   **Description**: The final loop. Takes outputs from Learning, Bias, and Self-Reflection to automatically tune hyperparameters in the Arbitration and Meta Decision engines.
*   **Service Tier**: Core
*   **SLA Tier**: Silver
*   **Primary Consumers**: Arbitration Engine, Meta Decision Engine
*   **API Quick Reference**:
    *   Endpoint: `/api/v1/ai/decision-improvement/apply`
    *   Request: `{ "tuning_proposal": {...} }`
    *   Response: `{ "status": "APPLIED", "new_weights": {...} }`
*   **Feature Flag**: `ai-engine-decision-improvement`
*   **Rate Limits**: Internal Service Only
*   **Monitoring**: `grafana/d/trd-ai-026/improvement`
*   **On-call Team**: Core AI Architecture
*   **Current Version**: v1.0.5
*   **Known Limitations**: Human-in-the-loop required for major parameter shifts.
*   **Pricing Model**: Internal Transfer Pricing

---

## Section 3 — Service Discovery

### Finding a Service
Tradeora uses HashiCorp Consul as our service mesh and registry. Services automatically register themselves upon startup in Kubernetes.

### Registry Format
All AI services follow a standard DNS naming convention within the internal network:
`ai-{service-slug}.tradeora.internal`

Example: `ai-market-intel.tradeora.internal:50051`

### Health Check Endpoints
Every service must expose a standard health check over HTTP and gRPC:
*   HTTP: `GET /health` (Returns 200 OK)
*   HTTP: `GET /ready` (Returns 200 OK when ready to serve traffic)
*   gRPC: Implements `grpc.health.v1.Health`

### gRPC Configuration
Consumers should use the Consul resolver scheme in their gRPC dialing:
```typescript
const client = new MarketIntelClient(
  'consul://127.0.0.1:8500/ai-market-intel', 
  grpc.credentials.createInsecure(),
  {
    'grpc.service_config': JSON.stringify({
      loadBalancingConfig: [{ round_robin: {} }]
    })
  }
);
```

---

## Section 4 — SLA Dashboard

### SLA Matrix Target Requirements

| Registry ID | Engine | Availability | P50 Latency (ms) | P99 Latency (ms) | Accuracy Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TRD-AI-001 | Market Intelligence | 99.99% | < 50 | < 200 | 75% Directional |
| TRD-AI-002 | Macro Intelligence | 99.9% | < 100 | < 500 | 80% Trend |
| TRD-AI-003 | Technical Analysis | 99.99% | < 20 | < 100 | 100% Math Match |
| TRD-AI-004 | Smart Money | 99.99% | < 50 | < 200 | 70% Reversal |
| TRD-AI-005 | ICT Intelligence | 99.9% | < 100 | < 300 | 65% Zone hit |
| TRD-AI-006 | Wyckoff Intelligence | 99.9% | < 150 | < 500 | 60% Phase Acc |
| TRD-AI-007 | Elliott Wave | 99.5% | < 500 | < 1500 | 55% Target Hit |
| TRD-AI-008 | Volume Intelligence | 99.99% | < 20 | < 100 | 100% Math Match |
| TRD-AI-009 | Sentiment Intelligence | 99.9% | < 200 | < 800 | 80% Correlation |
| TRD-AI-010 | News Intelligence | 99.99% | < 100 | < 400 | 95% Entity Match|
| TRD-AI-011 | Portfolio Intelligence | 99.99% | < 50 | < 200 | N/A |
| TRD-AI-012 | Risk Intelligence | 99.99% | < 200 | < 1000 | N/A |
| TRD-AI-013 | Position Sizing | 99.99% | < 10 | < 50 | 100% Math Match |
| TRD-AI-014 | Strategy Engine | 99.99% | < 50 | < 200 | N/A |
| TRD-AI-015 | Backtesting Engine | 99.5% | < 5000 | < 15000 | 100% Simulation |
| TRD-AI-016 | Simulation Engine | 99.9% | < 2000 | < 8000 | N/A |
| TRD-AI-017 | Arbitration Engine | 99.99% | < 30 | < 100 | 85% Logic Match |
| TRD-AI-018 | Meta Decision Engine | 99.99% | < 50 | < 150 | 80% Win Rate |
| TRD-AI-019 | Consensus Orch. | 99.99% | < 10 | < 50 | N/A |
| TRD-AI-020 | Meta Intelligence | 99.9% | < 800 | < 2500 | > 4/5 Human Eval|
| TRD-AI-021 | Enterprise Memory | 99.9% | < 100 | < 500 | 90% Recall |
| TRD-AI-022 | Knowledge OS | 99.5% | < 300 | < 1000 | N/A |
| TRD-AI-023 | Learning Engine | 99.5% | < 5000 | Batch | N/A |
| TRD-AI-024 | Self-Reflection | 99.9% | < 1000 | < 3000 | 95% Catch Rate |
| TRD-AI-025 | Bias Detection | 99.9% | < 500 | < 2000 | 90% Recall |
| TRD-AI-026 | Decision Improvement | 99.5% | < 1000 | Batch | > 0 Alpha Gen |

### Alert Thresholds
PagerDuty alerts trigger automatically if:
1. Error rate exceeds 1% for 5 consecutive minutes.
2. P99 latency exceeds SLA target for 10 consecutive minutes.
3. Node CPU/Memory utilization > 85% for 15 minutes.

### SLA Breach Protocol
In the event of an SLA breach for a Core service, an incident is immediately escalated to the On-Call rotation. During degradation, the Consensus Orchestrator will automatically omit the failing school/engine from the arbitration pool and note the degraded context in the final Meta Intelligence output.

---

## Section 5 — Consumer Guide

### Orchestration Integration
Most consumers (e.g., Mobile App, Web Frontend) should NOT call individual engines directly. Instead, they should interface with the `Consensus Orchestrator` (TRD-AI-019). The Orchestrator manages the fan-out to the schools, handles timeouts, and marshals the final Meta Decision.

### Authentication
Service-to-service communication requires a JWT signed by the internal Auth Service.
Include the token in the metadata/headers:
`Authorization: Bearer <service-jwt-token>`

### Circuit Breakers & Retries
Clients MUST implement circuit breakers. The standard configuration using something like resilience4j or equivalent is:
*   Failure Rate Threshold: 50%
*   Wait Duration In Open State: 10s
*   Ring Buffer Size: 20

Retries should be configured for idempotent endpoints only (e.g., GET requests), with exponential backoff and jitter. Maximum 3 retries.

---

## Section 6 — Service Health Overview

### Current Health Snapshot
*Last Updated: 2026-07-24 04:55 UTC*
**STATUS: ALL 26 ENGINES OPERATIONAL**

### Prometheus Metrics Format
Services expose `/metrics` for Prometheus scraping. Key metrics to alert on:
*   `grpc_server_handled_total{grpc_code="OK", grpc_service="tradeora.ai.MarketIntel"}`
*   `grpc_server_handling_seconds_bucket`
*   `ai_engine_inference_latency_seconds`
*   `ai_engine_queue_depth`

### Grafana Dashboards
Navigate to `https://grafana.tradeora.internal/dashboards/folder/ai-engines`
*   **Executive View**: High-level traffic and aggregate SLAs.
*   **Engine Deep-Dive**: Selected from the TRD-AI-XXX list. Shows memory utilization, cache hit rates, inference latency distributions, and circuit breaker states.
*   **Arbitration Accuracy**: Real-time tracking of Learning Engine feedback loop.

---
End of Document
