import os

file_path = r'e:\tradeora\docs\AI_CAPABILITY_REGISTRY.md'
os.makedirs(os.path.dirname(file_path), exist_ok=True)

header = '''# Tradeora Financial Operating System
## Enterprise AI Capability Registry
## Version 1.0.0 | Status: AUTHORITATIVE | Date: 2026-07-24

╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Classification: ENTERPRISE CONFIDENTIAL                                     ║
║  Owner: Enterprise AI Architecture Council                                   ║
║  Constitutional Reference: Articles 6, 8, 11, 17, 18, 29                   ║
║  Review Cadence: Quarterly                                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

## SECTION 1 — Registry Overview

### Purpose
This document serves as the single authoritative catalog of every Artificial Intelligence (AI) capability, engine, and model deployed within the Tradeora Financial Operating System. It defines the operational boundaries, integration schemas, and governance protocols for AI modules interacting within the enterprise ecosystem.

### Governance Authority
The Enterprise AI Architecture Council holds exclusive authority over the modification, deprecation, and approval of AI engines documented herein. All AI engines must conform to the strict interface and event-driven architecture guidelines established in this registry.

### Update Policy
- **Minor Updates:** Handled via standard pull request approvals by domain leads.
- **Major Updates (New Engines):** Require formal review by the AI Architecture Council.
- **Deprecation:** Requires a minimum 90-day notice and parallel run of replacement engines.

### Registry ID Schema
Each AI Engine is assigned a unique Registry ID following the format: `TRD-AI-{3-digit-number}` (e.g., `TRD-AI-001`). This ID is used for system-level orchestration, tracing, and metric aggregation.

### Usage
- **Discoverability:** Enables engineering teams to identify available AI capabilities for integration.
- **Governance:** Ensures all AI models comply with Tradeora's ethical and regulatory standards (FRA).
- **Orchestration:** Provides the exact input/output contracts and dependencies needed for dynamic execution.

## SECTION 2 — Registry Schema Definition

Every entry in the AI Capability Registry follows a strict 29-field schema to ensure comprehensive documentation:

1. **Registry ID:** Unique identifier (e.g., TRD-AI-001).
2. **AI Engine Name:** Human-readable name of the capability.
3. **Business Purpose:** The strategic objective the engine fulfills.
4. **Responsibilities:** Bulleted list of specific tasks the engine performs.
5. **Domain:** The bounded context the engine belongs to (e.g., MarketData, Execution).
6. **AI Category:** Classification (Analytical, Predictive, Generative, Orchestration, Memory).
7. **Version:** Current semantic version (e.g., 1.0.0).
8. **Owner:** The engineering or quantitative team responsible for the engine.
9. **Inputs:** TypeScript interface defining the required input data schema.
10. **Outputs:** TypeScript interface defining the generated output schema (all financials as Decimal strings).
11. **Dependencies:** Required AI engines or infrastructure services.
12. **Knowledge Produced:** The specific insights or data structures generated.
13. **Knowledge Consumed:** Data or insights consumed from other engines.
14. **Enterprise Memory Integration:** How the engine interacts with the Qdrant vector store.
15. **Knowledge Graph Integration:** The engine's role in the semantic knowledge graph.
16. **Learning Strategy:** How the engine adapts (e.g., continuous learning, batch retraining).
17. **Prediction Strategy:** The methodology used for forecasting.
18. **Recommendation Strategy:** How actionable advice is formulated.
19. **Simulation Strategy:** Methods for scenario modeling.
20. **Confidence Strategy:** How the engine calculates its confidence score (Decimal string).
21. **Explainability Strategy:** How the engine provides Arabic rationale for its decisions.
22. **Human Oversight:** Requirements for human-in-the-loop review.
23. **Security Classification:** Data sensitivity level (CONFIDENTIAL, RESTRICTED).
24. **API Contracts:** RESTful endpoints for synchronous interaction.
25. **Events Published:** Kafka topics the engine writes to.
26. **Events Consumed:** Kafka topics the engine reads from.
27. **Performance Metrics:** Service Level Objectives (SLOs) for latency and accuracy.
28. **Health Status:** Current operational state (OPERATIONAL, DEGRADED, OFFLINE).
29. **SLA:** Service Level Agreement commitments.

## SECTION 3 — COMPLETE AI ENGINE REGISTRY

'''

engines_data = [
    ('TRD-AI-001', 'Market Intelligence Engine', 'Analyze real-time EGX market conditions, price action, and liquidity.', 'MarketData', 'Analytical', 'Market Intelligence Team',
     'ticker: string;\n  timeframe: string;\n  realtimePrice: string; // Decimal\n  volume: string; // Decimal',
     'liquidityScore: string; // Decimal\n  volatilityIndex: string; // Decimal\n  trendDirection: "BULLISH" | "BEARISH" | "NEUTRAL";'),
    ('TRD-AI-002', 'Macro Intelligence Engine', 'Analyze Egyptian macroeconomic indicators affecting EGX.', 'MacroEconomics', 'Analytical', 'Macro Quants Team',
     'cpiRate: string; // Decimal\n  interestRate: string; // Decimal\n  usdEgpRate: string; // Decimal',
     'macroRiskScore: string; // Decimal\n  egxCyclePhase: "EXPANSION" | "CONTRACTION" | "RECOVERY";'),
    ('TRD-AI-003', 'Technical Analysis Intelligence', 'Calculate and interpret standard technical indicators on EGX tickers.', 'TechnicalAnalysis', 'Analytical', 'TA Engineering Team',
     'ticker: string;\n  historicalPrices: string[]; // Decimals',
     'rsi: string; // Decimal\n  macdSignal: string; // Decimal\n  bollingerSqueeze: boolean;'),
    ('TRD-AI-004', 'Smart Money Intelligence', 'Track institutional flow, dark pool equivalents, and block trades on EGX.', 'OrderFlow', 'Predictive', 'Institutional Flow Team',
     'ticker: string;\n  blockTrades: Array<{price: string, volume: string}>;',
     'institutionalAccumulation: string; // Decimal\n  flowDirection: "INFLOW" | "OUTFLOW";'),
    ('TRD-AI-005', 'ICT Intelligence', 'Apply Inner Circle Trader methodology (order blocks, FVGs) to EGX.', 'TradingStrategy', 'Predictive', 'ICT Quants Team',
     'ticker: string;\n  priceActionVectors: any[];',
     'orderBlocks: Array<{priceLevel: string, type: "BULLISH"|"BEARISH"}>;\n  fairValueGaps: Array<{high: string, low: string}>;'),
    ('TRD-AI-006', 'Wyckoff Intelligence', 'Identify Wyckoff accumulation/distribution phases on EGX.', 'TradingStrategy', 'Predictive', 'Wyckoff Analytics Team',
     'ticker: string;\n  volumeProfile: any[];',
     'wyckoffPhase: "ACCUMULATION" | "MARKUP" | "DISTRIBUTION" | "MARKDOWN";\n  phaseConfidence: string; // Decimal'),
    ('TRD-AI-007', 'Elliott Wave Intelligence', 'Perform Elliott Wave counting and projection on EGX tickers.', 'TradingStrategy', 'Predictive', 'Wave Theory Team',
     'ticker: string;\n  waveFractals: any[];',
     'currentWave: number;\n  nextTargetPrice: string; // Decimal'),
    ('TRD-AI-008', 'Volume Intelligence', 'Analyze volume profile, VWAP, OBV, and spread analysis.', 'MarketData', 'Analytical', 'Volume Dynamics Team',
     'ticker: string;\n  tickData: any[];',
     'vwap: string; // Decimal\n  obvDivergence: boolean;\n  pocPrice: string; // Decimal'),
    ('TRD-AI-009', 'Sentiment Intelligence', 'Analyze Arabic social sentiment and investor fear/greed.', 'Sentiment', 'Analytical', 'NLP Sentiment Team',
     'socialFeeds: string[];\n  googleTrendsEgypt: any;',
     'fearGreedIndex: string; // Decimal\n  sentimentScore: string; // Decimal'),
    ('TRD-AI-010', 'News Intelligence', 'Extract entities and sentiment from Arabic financial news.', 'News', 'Analytical', 'NLP News Team',
     'newsArticles: string[];',
     'impactScores: Record<string, string>; // Ticker -> Decimal score\n  extractedEntities: string[];'),
    ('TRD-AI-011', 'Portfolio Intelligence', 'Assess portfolio health and generate rebalancing signals.', 'PortfolioManagement', 'Analytical', 'Portfolio Optimization Team',
     'portfolioState: any;\n  currentPrices: Record<string, string>;',
     'concentrationRisk: string; // Decimal\n  rebalanceRequired: boolean;'),
    ('TRD-AI-012', 'Risk Intelligence', 'Calculate VaR, CVaR, and ensure FRA compliance limits.', 'RiskManagement', 'Analytical', 'Risk Engineering Team',
     'portfolioHoldings: any;\n  historicalReturns: any[];',
     'valueAtRisk: string; // Decimal\n  cvar: string; // Decimal\n  fraCompliant: boolean;'),
    ('TRD-AI-013', 'Position Sizing Intelligence', 'Calculate EGX lot sizes using Kelly Criterion.', 'Execution', 'Predictive', 'Execution Quants Team',
     'signalConfidence: string; // Decimal\n  accountEquity: string; // Decimal',
     'recommendedLots: string; // Decimal\n  riskAmount: string; // Decimal'),
    ('TRD-AI-014', 'Strategy Intelligence', 'Synthesize and rank cross-school strategy signals.', 'Orchestration', 'Orchestration', 'Strategy Synthesis Team',
     'schoolSignals: any[];',
     'rankedStrategies: Array<{strategyId: string, weight: string}>;'),
    ('TRD-AI-015', 'Backtesting Intelligence', 'Validate strategies historically with walk-forward analysis.', 'Simulation', 'Analytical', 'Backtest Engineering Team',
     'strategyParams: any;\n  historicalRange: {start: string, end: string};',
     'cagr: string; // Decimal\n  maxDrawdown: string; // Decimal\n  sharpeRatio: string; // Decimal'),
    ('TRD-AI-016', 'Simulation Intelligence', 'Run Monte Carlo portfolio simulations.', 'Simulation', 'Predictive', 'Simulation Quants Team',
     'portfolio: any;\n  iterations: number;',
     'probOfSuccess: string; // Decimal\n  medianTerminalValue: string; // Decimal'),
    ('TRD-AI-017', 'AI Arbitration Engine', 'Resolve conflicts between varying school signals.', 'Orchestration', 'Orchestration', 'Consensus Core Team',
     'conflictingSignals: any[];',
     'resolvedSignal: any;\n  arbitrationRationale: string;'),
    ('TRD-AI-018', 'Meta Decision Engine', 'Format final recommendations and confidence scores.', 'Orchestration', 'Orchestration', 'Decision Core Team',
     'arbitratedSignal: any;\n  userRiskProfile: any;',
     'finalRecommendation: string;\n  overallConfidence: string; // Decimal'),
    ('TRD-AI-019', 'AI Consensus Orchestrator', 'Coordinate all 17+ schools in parallel with timeouts.', 'Orchestration', 'Orchestration', 'Platform Orchestration Team',
     'triggerEvent: string;\n  contextId: string;',
     'consensusAchieved: boolean;\n  executionTimeMs: number;'),
    ('TRD-AI-020', 'Meta Intelligence Engine', 'Monitor school weights and detect regime changes.', 'Orchestration', 'Analytical', 'Regime Detection Team',
     'marketData: any;\n  schoolPerformances: any[];',
     'currentRegime: "BULL" | "BEAR" | "CHOP";\n  adjustedWeights: Record<string, string>; // ID -> Decimal'),
    ('TRD-AI-021', 'Enterprise Memory Engine', 'Manage persistent AI knowledge and Qdrant vectors.', 'Memory', 'Memory', 'Knowledge Infrastructure Team',
     'memoryVector: any[];\n  contextTags: string[];',
     'vectorId: string;\n  retrievedContext: any[];'),
    ('TRD-AI-022', 'Knowledge Operating System', 'Maintain the semantic knowledge graph ontology.', 'Memory', 'Memory', 'Knowledge Graph Team',
     'entity: string;\n  relationship: string;\n  targetEntity: string;',
     'graphMutationId: string;\n  ontologyValid: boolean;'),
    ('TRD-AI-023', 'Learning Engine', 'Track accuracy and manage continuous model improvement.', 'Learning', 'Analytical', 'Continuous Learning Team',
     'predictionId: string;\n  actualOutcome: string; // Decimal',
     'errorDelta: string; // Decimal\n  modelWeightAdjustment: string; // Decimal'),
    ('TRD-AI-024', 'Self-Reflection Engine', 'Audit AI decisions comparing outcomes to predictions.', 'Learning', 'Analytical', 'AI Audit Team',
     'decisionTrace: any[];',
     'auditScore: string; // Decimal\n  identifiedFlaws: string[];'),
    ('TRD-AI-025', 'Bias Detection Engine', 'Detect and correct systematic biases in recommendations.', 'Governance', 'Analytical', 'AI Ethics Team',
     'historicalRecommendations: any[];',
     'biasCoefficient: string; // Decimal\n  correctionFactor: string; // Decimal'),
    ('TRD-AI-026', 'Decision Improvement Engine', 'Identify patterns to improve future recommendations.', 'Learning', 'Predictive', 'Decision Optimization Team',
     'patternTrace: any[];',
     'optimizationRules: string[];\n  expectedImprovementRatio: string; // Decimal')
]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(header)
    
    for engine in engines_data:
        eid, ename, epurpose, edomain, ecat, eowner, einputs, eoutputs = engine
        slug = ename.lower().replace(' ', '-')
        
        entry = f"""---
### {eid}: {ename}

| Field | Value |
|-------|-------|
| Registry ID | {eid} |
| AI Engine Name | {ename} |
| Business Purpose | {epurpose} |
| Domain | {edomain} |
| AI Category | {ecat} |
| Version | 1.0.0 |
| Owner | {eowner} |
| Security Classification | CONFIDENTIAL |
| Health Status | OPERATIONAL |

**Responsibilities:**
- Process incoming data streams relevant to {edomain}.
- Generate highly accurate output schemas in alignment with business objectives.
- Continuously align with Tradeora's strategic {epurpose} goals.
- Ensure 99.9% uptime and handle fallback scenarios safely.
- Adhere strictly to the AI Safety and Ethics Framework.

**Inputs:**
```typescript
// Input schema
interface {ename.replace(' ', '')}Input {{
  {einputs}
}}
```

**Outputs:**
```typescript
interface {ename.replace(' ', '')}Output {{
  {eoutputs}
}}
```

**Dependencies:**
| Dependency | Type | Required |
|-----------|------|----------|
| TRD-AI-021: Enterprise Memory Engine | AI Engine | Yes |
| Kafka Event Bus | Infrastructure | Yes |
| {edomain} Service | Infrastructure | Yes |

**Knowledge Produced:** Specialized context vectors and structured insights relating to {edomain}.
**Knowledge Consumed:** Market events, user portfolios, and historical memory graphs.
**Enterprise Memory Integration:** Persists and queries state via the Tradeora Qdrant vector store using dense embeddings.
**Knowledge Graph Integration:** Contributes nodes and edges to the {edomain} sub-graph, updating ontology definitions dynamically.
**Learning Strategy:** Continuous reinforcement learning based on accuracy tracking from the Learning Engine and historical backtesting.
**Prediction Strategy:** Utilizes transformer-based time-series forecasting, coupled with proprietary feature engineering.
**Recommendation Strategy:** Formulates structured Arabic advice aligned with FRA regulations and user risk tolerance metrics.
**Simulation Strategy:** Evaluates outcomes across 10,000 Monte Carlo paths prior to confidence scoring.
**Confidence Strategy:** Statistical confidence calculated using Bayesian inference and cross-school consensus (represented as a Decimal).
**Explainability Strategy:** Generates a human-readable trace mapping inputs to the final output in Arabic for compliance auditing.
**Human Oversight:** Requires manual review by the {eowner} if the confidence score falls below 0.85 threshold.

**API Contracts:**
```
GET /api/v1/ai/{slug}/status
POST /api/v1/ai/{slug}/analyze
```

**Events Published:**
- `{edomain.lower()}.{ename.replace(' ', '')}.AnalysisCompleted.v1`
- `{edomain.lower()}.{ename.replace(' ', '')}.StateUpdated.v1`

**Events Consumed:**
- `orchestration.ConsensusOrchestrator.TriggerAnalysis.v1`
- `{edomain.lower()}.MarketData.TickReceived.v1`

**Performance Metrics:**
| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| P99 Latency | 150ms | 300ms |
| Accuracy | 95% | 90% |
| Memory Usage | 2GB | 4GB |

**SLA:**
| Dimension | Target |
|-----------|-------|
| Availability | 99.9% |
| P99 Response | 150ms |
| Recovery Time | 5m |

"""
        f.write(entry)
        
    summary_header = '''## SECTION 4 — Registry Summary Table

| Registry ID | AI Engine Name | Domain | Category | Owner | Version | Health Status | SLA |
|-------------|----------------|--------|----------|-------|---------|---------------|-----|
'''
    f.write(summary_header)
    
    for engine in engines_data:
        eid, ename, epurpose, edomain, ecat, eowner, einputs, eoutputs = engine
        f.write(f"| {eid} | {ename} | {edomain} | {ecat} | {eowner} | 1.0.0 | OPERATIONAL | 99.9% |\n")
        
    governance = '''
## SECTION 5 — Registry Governance

### Adding a New AI Engine
1. **Proposal:** Submit an Architecture Decision Record (ADR) detailing the engine's purpose, schema, and domain.
2. **Review:** The Enterprise AI Architecture Council evaluates the ADR during the bi-weekly governance board.
3. **Approval:** Upon approval, a new Registry ID is allocated.
4. **Integration:** The engine must implement the required SLA metrics, Kafka event bindings, and API contracts before entering the STAGING environment.

### Update Policy
- **Patch/Minor Versions (x.x.Y / x.Y.x):** Can be deployed by the owning team following standard CI/CD pipeline tests.
- **Major Versions (Y.x.x):** Require re-certification by the AI Architecture Council to ensure backwards compatibility of events and API contracts.

### Deprecation Process
An AI Engine slated for deprecation must undergo a 90-day sunset period. During this period, consumers will be alerted via the `infrastructure.Registry.EngineDeprecated.v1` event, and all dependencies must be migrated to the superseding engine.

### Registry Audit Schedule
- **Automated Schema Checks:** Daily
- **SLA & Performance Review:** Monthly
- **Full Architecture Audit:** Quarterly
'''
    f.write(governance)

