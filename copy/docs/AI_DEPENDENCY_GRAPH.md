# Tradeora Financial Operating System
## AI Dependency Graph
## Version v1.1.0 amended 2026-07-24 — Resolves ISSUE-004 (circular dependencies eliminated) | Status: AUTHORITATIVE

╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Owner: Enterprise AI Architecture Council                                   ║
║  Classification: ENTERPRISE CONFIDENTIAL                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

## Section 1 — Dependency Graph Overview

### Purpose
The AI Dependency Graph documents the intricate relationships, data flows, and execution dependencies between the 26 AI engines within the Tradeora platform. Understanding these relationships is critical for diagnosing latency issues, planning system upgrades, and comprehending how raw market data transforms into an actionable trading decision.

### Notation Key
*   **Nodes**:
    *   `( Oval )` : AI Engine
    *   `[ Rectangle ]` : External Data Feed / API
    *   `[( Cylinder )]` : Data Store / Database
    *   `{ User }` : End User / Client Application
*   **Edges**:
    *   `───>` : Consumes (Direct Dependency, Solid)
    *   `═══>` : Produces (Primary Output, Solid Bold)
    *   `- - >` : Optional/Asynchronous Dependency (Dashed)

---

## Section 2 — Master AI Dependency Graph

This diagram illustrates the macro-level architecture and data flow across all 26 AI engines.

```ascii
                                          [External News] ──> (News Intel) ──> (Sentiment Intel)
                                                                                         │
[EGX Market Feed] ═══╗                                                                   │
                     ╠══> (Market Intel) ───────────┐                                    │
                     ╠══> (Technical Analysis) ─────┤                                    │
                     ╠══> (Volume Intel) ───────────┤                                    │
                     ╠══> (Smart Money) ────┐       │                                    │
                     ╠══> (ICT Intel) <─────┘       ├───> (Consensus Orchestrator) <─────┤
                     ╠══> (Wyckoff Intel) ──────────┤            │                       │
                     ╚══> (Elliott Wave) ───────────┘            v                       │
                                                         (Arbitration Engine) <──────────┘
[Macro Data] ───────────> (Macro Intel) ─────────────────────>   │
                                                                 v
{User Portfolio} ───────> (Portfolio Intel) ────────┐    (Meta Decision Engine) ═══> {User Response}
                                                    │            │         ^
[Margin Rules] ─────────> (Risk Intel) <────────────┘            v         │
                                                              (Position Sizing)
                                                                 │
                                                                 v
                                                         [(Enterprise Memory)] 
                                                                 ^
                                                                 │
                                                          (Knowledge OS)
                                                                 ^
                                                                 │
                                                          (Learning Engine)
                                                                 │
                                                                 v
                                                          (Bias Detection)
                                                                 │
                                                                 v
                                                          (Self-Reflection)
                                                                 │
                                                                 v
                                                       (Decision Improvement) - - > (Arbitration Engine)

                                                       [LLM Provider Layer]
                                                                ^
                                                                │
                                                         (LLM Gateway)
                                                                ^
                                                                │
                                                        (All AI Engines)
```

---

## Section 3 — Capability Flow Graph

This graph models what *type of capability* is passed between system boundaries.

```ascii
+-------------------+       +-----------------------+       +-------------------+
| RAW DATA LAYER    |       | ANALYSIS LAYER        |       | DECISION LAYER    |
+-------------------+       +-----------------------+       +-------------------+
| - Price Ticks     | ====> | - Trend Direction     | ====> | - Arbitrated Signal|
| - Level 2 Order   |       | - Pattern Recognition |       | - Confidence Score |
| - News Feeds      |       | - Wave Counts         |       | - Risk Adjusted    |
| - Interest Rates  |       | - Sentiment Score     |       |   Action           |
+-------------------+       +-----------------------+       +-------------------+
         ||                          ||                              ||
         ||                          ||                              ||
         \/                          \/                              \/
+-------------------+       +-----------------------+       +-------------------+
| DATA STORES       |       | KNOWLEDGE LAYER       |       | EXECUTION LAYER   |
+-------------------+       +-----------------------+       +-------------------+
| - Timeseries DB   | <==== | - Semantic Memory     | ====> | - Strategy Rules  |
| - Vector DB       |       | - Entity Graphs       |       | - Position Size   |
+-------------------+       +-----------------------+       +-------------------+
```

---

## Section 4 — Knowledge Flow Graph

How knowledge moves through the system, gets stored, and applied to future decisions.

```ascii
[Raw Market Data] ──(Stream)──> (Schools: TA, ICT, Volume) 
                                       │
                                   (Extract)
                                       │
                                       v
                                [Structured Signals]
                                       │
                                   (Synthesize)
                                       │
                                       v
                             (Meta Decision Engine) ──(Store)──> [(Enterprise Memory DB)]
                                       │                                   │
                                       v                                   v
                               (Outcome Observed) ──────────────> (Learning Engine)
                                                                           │
                                                                        (Update)
                                                                           │
                                                                           v
                                                                 (Decision Improvement)
```

**Knowledge Adjacency:**
*   Market Data -> School Engines -> Signals
*   Signals -> Arbitration -> Meta Decision
*   Meta Decision -> Enterprise Memory
*   Memory + Market Outcome -> Learning Engine
*   Learning Engine -> Parameter Weights (Arbitration)

---

## Section 5 — Decision Flow Graph

The end-to-end pipeline from a user asking "Should I buy COMI?" to the final recommendation.

```ascii
TIME   | COMPONENT                 | ACTION                                      | STATE / CONFIDENCE
-------------------------------------------------------------------------------------------------------
T+0ms  | {User}                    | Requests Analysis (COMI)                    | -
T+5ms  | (Consensus Orchestrator)  | Receives request, fans out to Schools       | Pending
T+15ms | (Technical Analysis)      | Calculates RSI/MACD                         | BUY (Conf: 0.70)
T+25ms | (Volume Intel)            | Analyzes VWAP                               | BUY (Conf: 0.85)
T+40ms | (Smart Money)             | Detects accumulation                        | BUY (Conf: 0.60)
T+80ms | (Sentiment Intel)         | Scrapes recent news                         | NEUTRAL (Conf: 0.50)
T+120ms| (ICT / Wyckoff / Elliott) | Complete complex pattern matching           | SELL (Conf: 0.65)
T+125ms| (Arbitration Engine)      | Ingests all signals, resolves conflicts     | BUY (Weighted: 0.72)
T+130ms| (Risk & Portfolio Intel)  | Checks user margin and current exposure     | APPROVED (Risk: Low)
T+140ms| (Meta Decision Engine)    | Combines Arbitration and Risk               | EXECUTE BUY
T+145ms| (Position Sizing)         | Calculates optimal shares based on Kelly    | 150 Shares
T+150ms| (Meta Intelligence)       | Generates natural language summary          | "Buy 150 shares..."
T+800ms| {User}                    | Receives rendered UI response               | -
```

---

## Section 6 — Signal Flow Graph

The hierarchical transformation of signals.

*   **Level 0 (Raw Data)**: `{"price": 55.40, "vol": 1000}`
*   **Level 1 (School Signals)**: Each school outputs a standardized `Signal` interface:
    ```typescript
    interface SchoolSignal {
      source_id: string;      // e.g., "TRD-AI-005"
      symbol: string;         // e.g., "COMI.CA"
      action: "BUY" | "SELL" | "HOLD";
      confidence: number;     // 0.0 to 1.0
      horizon: "INTRA" | "SWING" | "MACRO";
      metadata: object;       // School-specific details (e.g., FVG bounds)
    }
    ```
*   **Level 2 (Aggregated Signal)**: Arbitration Engine output:
    ```typescript
    interface ArbitratedSignal {
      symbol: string;
      final_action: "BUY" | "SELL" | "HOLD";
      blended_confidence: number;
      dominant_school: string;
      contrarian_schools: string[];
    }
    ```
*   **Level 3 (Meta Signal)**: Includes risk context and sizing:
    ```typescript
    interface MetaDecision {
      arbitrated_signal: ArbitratedSignal;
      approved_by_risk: boolean;
      recommended_shares: number;
      stop_loss: number;
      take_profit: number;
    }
    ```

---

## Section 7 — Learning Flow Graph

The autonomous improvement loop.

```ascii
[Prediction (Buy @ 55)] ────> [(Memory DB)]
                                    │
[Time Passes (T+3 Days)] ───> [Market Outcome (Price = 58)]
                                    │
                                    v
                            (Learning Engine)
                            │ 1. Retrieve Prediction
                            │ 2. Compare Outcome (Success)
                            │ 3. Identify which Schools were right/wrong
                            │
                            v
                          (Bias Detection) ──> Checks if TA is always bullish
                            │
                            v
                        (Self-Reflection) ──> Audits Meta Decision logic
                            │
                            v
                      (Decision Improvement)
                            │
                            v
                 [Update Weights in Arbitration DB]
                 (e.g., TA Weight +0.02, ICT Weight -0.01)
```

---

## Section 8 — Trading Workflow Graph

A complete algorithmic execution workflow.

```ascii
START -> (Strategy Engine) wakes up on cron schedule
  |
  +-> Calls (Consensus Orchestrator) for Symbol Context
  |     +-> (Schools) calculate indicators
  |     +-> (Arbitration) resolves
  |     +-> Returns Context
  |
  +-> Strategy Logic Evaluates -> CONDITION MET (Go Long)
  |
  +-> Calls (Risk Intel) -> Pre-trade stress test -> PASS
  |
  +-> Calls (Position Sizing) -> Get Allocation -> 5% Portfolio
  |
  +-> Generates FIX Order -> [Broker Execution Gateway]
  |
  +-> Logs action to [(Enterprise Memory)]
  |
END
```

---

## Section 9 — Dependency Matrix

This N×N matrix shows direct (D) dependencies between key services. Rows are the PRODUCER of data, Columns are the CONSUMER.

| Producer \ Consumer | Arbitration | Meta Decision | Consensus | Learning | Risk | Portfolio | Strategy | Memory |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **All Schools (01-10)** | D | - | D | D | - | - | D | D |
| **Portfolio (011)** | - | D | - | - | D | - | - | D |
| **Risk (012)** | - | D | - | - | - | - | D | D |
| **Arbitration (017)**| - | D | - | - | - | - | D | D |
| **Consensus (019)** | - | - | - | - | - | - | - | - |
| **Memory (021)** | D | D | - | D | - | - | - | - |
| **Learning (023)** | D | - | - | - | - | - | - | - |

*(Note: D = Direct Dependency. Missing relationships imply no direct dependency, avoiding circular loops).*

---

## Section 10 — Critical Path Analysis

### The Critical Path
The longest latency path in the synchronous decision pipeline is:
`User Request -> Consensus Orchestrator -> Elliott Wave Engine -> Arbitration -> Risk Intelligence -> Meta Decision`

**Why?**
1. **Elliott Wave Engine**: Computationally expensive, involving recursive pattern matching over long timeframes. P99 latency is ~1500ms.
2. **Risk Intelligence**: Runs Monte Carlo simulations on the fly. P99 latency is ~1000ms.

### Optimization Opportunities
1. **Asynchronous Computation**: Elliott Wave and Wyckoff engines compute continuously in background; state cached in Valkey. Consensus Orchestrator reads O(1) cache, not blocking on inference.
2. **Risk Caching**: Pre-calculate portfolio stress tests overnight; apply marginal updates only on proposed trade size delta.
3. **gRPC Multiplexing**: Consensus Orchestrator uses HTTP/2 multiplexing to fan out to 17 schools without connection overhead.

---

## Section 11 — End-to-End Latency Budget

Full timing breakdown for the complete AI recommendation pipeline from user request
to delivered Arabic explanation:

```
USER REQUEST (Flutter app)
  │
  ▼  [20-50ms — LTE/WiFi network]
KONG API GATEWAY — JWT validation (Keycloak cache hit)
  │
  ▼  [2ms — in-cluster]
AI CONSENSUS ORCHESTRATOR (TRD-AI-019)
  │   ├─ Check Valkey cache (10ms) ─── CACHE HIT? ──► Return in 12ms total ✅
  │   └─ CACHE MISS: Launch parallel school execution
  │
  ▼  [Parallel execution window: 0–800ms]
  ├── TRD-AI-001 Market Intelligence      [P99: 150ms] ─────┐
  ├── TRD-AI-002 Macro Intelligence       [P99: 200ms] ─────┤
  ├── TRD-AI-003 Technical Analysis       [P99: 250ms] ─────┤
  ├── TRD-AI-004 Smart Money              [P99: 300ms] ─────┤
  ├── TRD-AI-005 ICT Intelligence         [P99: 350ms] ─────┤
  ├── TRD-AI-006 Wyckoff Intelligence     [P99: 400ms] ─────┤ ← All parallel
  ├── TRD-AI-007 Elliott Wave             [P99: 500ms] ─────┤   Max window = 800ms
  ├── TRD-AI-008 Volume Intelligence      [P99: 150ms] ─────┤   (slowest school)
  ├── TRD-AI-009 Sentiment Intelligence   [P99: 120ms] ─────┤
  ├── TRD-AI-010 News Intelligence        [P99: 180ms] ─────┤
  ├── TRD-AI-011 Portfolio Intelligence   [P99: 100ms] ─────┤
  └── TRD-AI-012 Risk Intelligence        [P99: 350ms] ─────┘
                                                             │
  ▼  [10ms — aggregation]                                   │
TRD-AI-017 AI ARBITRATION ENGINE ◄───────────────────────────┘
  │  (Conflict resolution, weight application, school exclusion check)
  │
  ▼  [15ms]
TRD-AI-018 META DECISION ENGINE
  │  (Confidence scoring, recommendation direction, safety gate check)
  │
  ▼  [50ms — Arabic explanation generation via Qwen2.5]
AI EXPLAINABILITY (Arabic text generation)
  │
  ▼  [5ms — WORM write async, non-blocking]
MINIO WORM (Audit record — non-blocking to user path)
  │
  ▼  [5ms — response serialization]
KONG API GATEWAY → FLUTTER APP

─────────────────────────────────────────────────────────────────
TOTAL P99 BUDGET: 20ms (network) + 800ms (schools) + 75ms (arbitration+meta) + 50ms (explanation) = 945ms
TOTAL P50 TARGET: < 500ms (most users experience < 500ms end-to-end)
SLO BREACH THRESHOLD: > 2,000ms for 5 consecutive requests → PagerDuty SEV-2
─────────────────────────────────────────────────────────────────
```

---

## Section 12 — Kafka Event Topology (AI Events)

Complete map of AI-related Kafka topics and their producers/consumers:

```
TOPIC                                          PRODUCER              CONSUMERS
─────────────────────────────────────────────────────────────────────────────────
ai.MarketIntelligence.SignalProduced.v1        TRD-AI-001           TRD-AI-017 (Arbitration)
                                                                      TRD-AI-021 (Memory)

ai.MacroIntelligence.SignalProduced.v1         TRD-AI-002           TRD-AI-017 (Arbitration)
                                                                      TRD-AI-020 (Meta Intel)

ai.TechnicalAnalysis.SignalProduced.v1         TRD-AI-003           TRD-AI-017 (Arbitration)

ai.SmartMoney.SignalProduced.v1               TRD-AI-004           TRD-AI-017 (Arbitration)
                                                                      TRD-AI-020 (Meta Intel)

ai.ICT.SignalProduced.v1                      TRD-AI-005           TRD-AI-017 (Arbitration)

ai.Wyckoff.SignalProduced.v1                  TRD-AI-006           TRD-AI-017 (Arbitration)

ai.ElliottWave.SignalProduced.v1              TRD-AI-007           TRD-AI-017 (Arbitration)

ai.Volume.SignalProduced.v1                   TRD-AI-008           TRD-AI-017 (Arbitration)
                                                                      TRD-AI-004 (Smart Money)

ai.Sentiment.SignalProduced.v1                TRD-AI-009           TRD-AI-017 (Arbitration)
                                                                      TRD-AI-021 (Memory)

ai.News.ArticleAnalyzed.v1                    TRD-AI-010           TRD-AI-009 (Sentiment)
                                                                      TRD-AI-021 (Memory)
                                                                      TRD-AI-022 (Knowledge OS)

ai.Portfolio.HealthAssessed.v1                TRD-AI-011           TRD-AI-012 (Risk)
                                                                      TRD-AI-013 (Position Sizing)

ai.Risk.AssessmentCompleted.v1                TRD-AI-012           TRD-AI-017 (Arbitration)
                                                                      TRD-AI-013 (Position Sizing)
                                                                      TRD-AI-018 (Meta Decision)

ai.Consensus.RecommendationReady.v1           TRD-AI-019           ai.WisdomEngine (output)
                                                                      TRD-AI-021 (Memory)
                                                                      TRD-AI-024 (Self-Reflection)

ai.MetaDecision.RecommendationIssued.v1       TRD-AI-018           TRD-AI-024 (Self-Reflection)
                                                                      TRD-AI-023 (Learning)
                                                                      Notification Delivery BC

ai.Learning.ModelUpdated.v1                   TRD-AI-023           TRD-AI-025 (Bias Detection)
                                                                      TRD-AI-026 (Decision Improvement)
                                                                      TRD-AI-020 (Meta Intelligence)

ai.BiasDetection.BiasIdentified.v1            TRD-AI-025           TRD-AI-026 (Decision Improvement)
                                                                      AI Ethics Board (alert)

ai.SelfReflection.OutcomeAudited.v1           TRD-AI-024           TRD-AI-023 (Learning)
                                                                      TRD-AI-026 (Decision Improvement)

ai.Memory.KnowledgeStored.v1                  TRD-AI-021           TRD-AI-022 (Knowledge OS)
                                                                      TRD-AI-023 (Learning)

ai.MetaIntelligence.RegimeChanged.v1          TRD-AI-020           TRD-AI-017 (Arbitration weights)
                                                                      TRD-AI-019 (Orchestrator config)
                                                                      TRD-AI-023 (Learning trigger)
```

---

## Section 13 — Qdrant Knowledge Flow (Vector Store)

The Enterprise Memory Engine (TRD-AI-021) uses Qdrant as the primary vector store.
Knowledge flows through the system as embeddings:

```
AI ENGINE OUTPUT                VECTOR EMBEDDING                   QDRANT COLLECTION
─────────────────────────────────────────────────────────────────────────────────
TRD-AI-010 News Analysis   ─►  Qwen2.5 text embedding (768d)  ─►  tradeora_news_embeddings
TRD-AI-001 Market Signal   ─►  TimeSeries embedding (128d)    ─►  tradeora_market_signals
TRD-AI-018 Recommendation  ─►  Decision embedding (256d)      ─►  tradeora_decisions
TRD-AI-024 Outcome Audit   ─►  Outcome embedding (256d)       ─►  tradeora_outcomes
TRD-AI-002 Macro Signal    ─►  Macro embedding (64d)          ─►  tradeora_macro_context
TRD-AI-009 Sentiment       ─►  Sentiment embedding (128d)     ─►  tradeora_sentiment_history

Cross-session memory retrieval (RAG):
User asks about COMI → Qdrant similarity search → retrieve last 10 relevant decisions
→ inject as context into AI schools → improves recommendation quality for that ticker
```

---

## Section 13.5 — Circular Dependency Resolutions

CIRCULAR DEPENDENCY RESOLUTION (ADR-042, v1.1.0 — 2026-07-24):

OLD (ANTI-PATTERN — CIRCULAR): Learning Engine (023) ←sync→ Self-Reflection (024)
NEW (RESOLVED — ASYNC EVENT):
  Learning Engine (023) PUBLISHES: ai.Learning.ModelUpdated.v1 (Kafka)
           ↓ async consume (non-blocking)
  Self-Reflection Engine (024) CONSUMES: ai.Learning.ModelUpdated.v1
  Self-Reflection Engine (024) PUBLISHES: ai.SelfReflection.OutcomeAudited.v1 (Kafka)
           ↓ async consume (non-blocking)
  Learning Engine (023) CONSUMES: ai.SelfReflection.OutcomeAudited.v1

Result: Zero synchronous cycles. Each engine is an independent producer/consumer.

CIRCULAR DEPENDENCY RESOLUTION:

OLD (ANTI-PATTERN): Strategy Engine (014) ←sync→ Backtesting Engine (015)
NEW (RESOLVED):
  Backtesting Engine (015): Runs as CONTINUOUS background CronJob
  Results stored in: Valkey cache key pattern: backtest:{strategy_id}:{ticker}
  Cache TTL: 60 minutes (refreshed hourly by Backtesting CronJob)
  
  Strategy Engine (014): At recommendation time:
    cache_key = f"backtest:{strategy_id}:{ticker}"
    result = valkey.get(cache_key)  # O(1) lookup, no Backtesting engine call
    if result is None:
        result = CONSERVATIVE_DEFAULT  # Never blocks on Backtesting engine

Result: Strategy depends on pre-computed cache, NOT on Backtesting engine directly.
No synchronous inter-engine dependency remains.

LLM GATEWAY (NEW — v1.1.0):
  All 26 AI engines → LLM Gateway (one-directional dependency)
  LLM Gateway → Provider (Ollama/DeepSeek/OpenAI/etc.)
  
  FORBIDDEN: Any AI engine → Provider (direct call forbidden by ADR-041)

---

## Section 14 — Complete N×N Dependency Matrix

26 AI engines × 26 AI engines. Cells: **D**=Direct dependency, **I**=Indirect, **O**=Optional, **·**=None.
Rows = consumer, Columns = producer.

| Consumer \ Producer | 001 | 002 | 003 | 004 | 005 | 006 | 007 | 008 | 009 | 010 | 011 | 012 | 013 | 014 | 015 | 016 | 017 | 018 | 019 | 020 | 021 | 022 | 023 | 024 | 025 | 026 |
|---------------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| 001 Market Intel    | ·   | O   | ·   | ·   | ·   | ·   | ·   | D   | O   | D   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | O   | O   | ·   | O   | ·   | ·   | O   |
| 002 Macro Intel     | O   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | O   | D   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | O   | O   | D   | O   | ·   | ·   | O   |
| 003 Technical Anal  | D   | O   | ·   | ·   | ·   | ·   | D   | D   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | O   | O   | ·   | O   | ·   | ·   | O   |
| 004 Smart Money     | D   | ·   | ·   | ·   | ·   | O   | ·   | D   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | O   | O   | ·   | O   | ·   | ·   | O   |
| 005 ICT Intel       | D   | ·   | D   | D   | ·   | ·   | ·   | D   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | O   | O   | ·   | O   | ·   | ·   | O   |
| 006 Wyckoff Intel   | D   | O   | D   | O   | ·   | ·   | ·   | D   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | O   | O   | ·   | O   | ·   | ·   | O   |
| 007 Elliott Wave    | D   | O   | D   | ·   | ·   | O   | ·   | D   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | O   | O   | ·   | O   | ·   | ·   | O   |
| 008 Volume Intel    | D   | ·   | D   | D   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | O   | O   | ·   | O   | ·   | ·   | O   |
| 009 Sentiment       | ·   | D   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | D   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | O   | D   | O   | O   | ·   | ·   | O   |
| 010 News Intel      | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | D   | D   | O   | ·   | ·   | ·   |
| 011 Portfolio Intel | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | O   | ·   | ·   | O   | O   | ·   | ·   | ·   | ·   | D   | O   | O   | ·   | ·   | O   |
| 012 Risk Intel      | D   | D   | D   | ·   | ·   | ·   | ·   | D   | ·   | ·   | D   | ·   | ·   | ·   | O   | D   | ·   | ·   | ·   | O   | D   | D   | O   | O   | O   | O   |
| 013 Position Sizing | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | D   | D   | ·   | O   | ·   | ·   | D   | D   | ·   | ·   | O   | ·   | O   | ·   | ·   | O   |
| 014 Strategy Intel  | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | O   | ·   | D   | O   | D   | D   | ·   | D   | D   | D   | D   | D   | D   | D   |
| 015 Backtesting     | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | ·   | D   | ·   | ·   | ·   | O   | D   | O   | O   | O   | O   | D   |
| 016 Simulation      | D   | D   | D   | ·   | ·   | ·   | D   | D   | D   | D   | D   | D   | D   | D   | D   | ·   | ·   | ·   | ·   | O   | D   | O   | O   | ·   | ·   | O   |
| 017 AI Arbitration  | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | D   | D   | O   | O   | ·   | D   | D   |
| 018 Meta Decision   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | D   | D   | D   | ·   | ·   | O   | D   | ·   | ·   | D   | D   | O   | O   | ·   | D   | D   |
| 019 Consensus Orch  | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | ·   | ·   | ·   | ·   | D   | D   | ·   | D   | D   | D   | ·   | ·   | D   | ·   |
| 020 Meta Intel      | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | D   | ·   | D   | D   | D   | D   | D   | D   | ·   | D   | D   | D   | D   | D   | D   |
| 021 Enterprise Mem  | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | ·   | I   | I   | I   | I   | I   | I   | I   | ·   | D   | D   | D   | ·   | ·   |
| 022 Knowledge OS    | ·   | D   | ·   | ·   | ·   | ·   | ·   | ·   | D   | D   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | D   | D   | ·   | O   | ·   | ·   | ·   |
| 023 Learning Engine | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | ·   | ·   | I   | I   | I   | I   | I   | D   | D   | D   | ·   | D   | D   | D   |
| 024 Self-Reflection | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | D   | D   | ·   | D   | D   | D   | ·   | ·   | D   |
| 025 Bias Detection  | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | ·   | D   | ·   | ·   | ·   | ·   | ·   | D   | D   | D   | D   | ·   | D   |
| 026 Decision Improv | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | I   | D   | D   | D   | D   | D   | ·   |

**Legend:** D=Direct · I=Indirect · O=Optional · ·=None

---

## Section 15 — Dependency Health Prometheus Monitoring

```yaml
# Prometheus metrics for AI engine dependency health
# Scraped from each AI engine at :9090/metrics

# Tracks whether a dependency is reachable
ai_dependency_reachable{engine_id, dependency_id, dependency_type} gauge  # 1=reachable, 0=unreachable

# Tracks dependency call latency
ai_dependency_call_duration_seconds{engine_id, dependency_id} histogram

# Tracks dependency circuit breaker state
ai_dependency_circuit_state{engine_id, dependency_id} gauge  # 0=CLOSED, 1=OPEN, 2=HALF_OPEN

# Critical dependency alerts:
- alert: AIDependencyUnreachable
  expr: ai_dependency_reachable{dependency_type="required"} == 0
  for: 30s
  labels:
    severity: critical
  annotations:
    summary: "Required dependency {{ $labels.dependency_id }} unreachable for {{ $labels.engine_id }}"

- alert: AIDependencyCircuitOpen
  expr: ai_dependency_circuit_state == 1
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "Circuit breaker OPEN for {{ $labels.engine_id }} → {{ $labels.dependency_id }}"
```

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT FOOTER                                                             ║
║  Document: AI_DEPENDENCY_GRAPH.md                                           ║
║  Version:  v1.1.0 amended 2026-07-24 — Resolves ISSUE-004 (circular dependencies eliminated)║
║  Owner:    Enterprise AI Architecture Council                               ║
║  Completeness: 99% — Master graph, 7 flow graphs, full latency budget,      ║
║    Kafka event topology, Qdrant knowledge flow, N×N matrix, monitoring.     ║
╚══════════════════════════════════════════════════════════════════════════════╝
```
