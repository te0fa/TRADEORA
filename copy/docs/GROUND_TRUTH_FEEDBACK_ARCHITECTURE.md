# Tradeora Financial Operating System
## Ground Truth Feedback & Learning Architecture
## Version 1.0.0 | Status: AUTHORITATIVE | Date: 2026-07-24

╔══════════════════════════════════════════════════════════════════════════════╗
║  Resolves: ISSUE-004 (feedback loop), ISSUE-011 (learning architecture)      ║
║  Owner: Chief AI Architect                                                   ║
║  ADR Reference: ADR-042 (Ground Truth Feedback System)                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

## Table of Contents
1. [Section 1 — Architecture Mandate](#section-1--architecture-mandate)
2. [Section 2 — Ground Truth Collection Architecture](#section-2--ground-truth-collection-architecture)
3. [Section 3 — Ground Truth Schema](#section-3--ground-truth-schema)
4. [Section 4 — School Weight Update Algorithm](#section-4--school-weight-update-algorithm)
5. [Section 5 — Qdrant Learning Store (Catastrophic Forgetting Prevention)](#section-5--qdrant-learning-store)
6. [Section 6 — Confidence Calibration System](#section-6--confidence-calibration-system)
7. [Section 7 — Ground Truth Kafka Event Flow](#section-7--ground-truth-kafka-event-flow)
8. [Section 8 — Measurement Schedule](#section-8--measurement-schedule)
9. [Section 9 — Breaking the Circular Dependency](#section-9--breaking-the-circular-dependency)
10. [Section 10 — ADR-042](#section-10--adr-042)
11. [Section 11 — Compliance & WORM Storage](#section-11--compliance--worm-storage)

---

### Section 1 — Architecture Mandate

The fundamental flaw of naive AI systems is operating in a closed loop, where models learn solely from their own generated outputs, leading to model collapse, confirmation bias, and detached reality. The AI must not learn only from its own outputs. Ground truth requires real-world outcome measurement. For the Tradeora Financial Operating System, the core directive is to tie the AI's learning mechanism directly to empirical market realities and actual user behaviors. 

This architecture mandates the collection, processing, and application of exactly 8 ground truth signal types. These signals form the bedrock of the continuous learning and calibration lifecycle of the Tradeora AI engines.

1. **EGX Market Outcome (price movement 5 days after recommendation):** The most objective measure of success. Did the asset move in the predicted direction within the specified timeframe on the Egyptian Exchange?
2. **Portfolio Outcome (NAV change attributed to recommendation):** If a user executes the recommendation, how does it affect their actual Net Asset Value? This measures the economic impact of the AI's advice.
3. **User Action (did user follow the recommendation?):** Behavioral metric indicating the persuasiveness, clarity, and perceived trustworthiness of the AI's output.
4. **User Explicit Feedback (thumbs up/down in app):** Direct, qualitative feedback from the user regarding the helpfulness or quality of the recommendation or explanation.
5. **Recommendation Success (directional accuracy):** A derived metric confirming if a 'BUY' signal resulted in an upward trend, or a 'SELL' signal avoided a downward trend.
6. **Recommendation Failure (missed signal, wrong direction):** The negative counterpart to success, critical for identifying blind spots, hallucinated patterns, or failed logic within specific schools of thought.
7. **Execution Quality (for Phase 2 brokerage integration):** Evaluates the slippage, spread capture, and execution speed when the recommendation is actually traded in the market.
8. **Confidence Calibration (was the stated confidence appropriate for the accuracy?):** Measures the delta between how confident the AI claimed to be and its actual statistical accuracy. Overconfidence is penalized heavily.

---

### Section 2 — Ground Truth Collection Architecture

The collection pipeline is designed to be asynchronous, resilient, and immutable. Recommendations are captured at inception, and their outcomes are joined later when the data matures (e.g., 5 trading days later).

```text
================================================================================
                    GROUND TRUTH DATA COLLECTION PIPELINE
================================================================================

      [AI Recommendation Issued by Meta Decision Engine]
                               │
                               ▼
                    [MinIO WORM Storage] 
           (Immutable recommendation record created)
                               │
                               ▼ (Wait: 5 EGX trading days)
                               │
                 [Ground Truth Collector Service]
                 (Orchestrates the gathering of all signals)
                               │
     ┌─────────────────────────┼─────────────────────────┐
     │                         │                         │
     ▼                         ▼                         ▼
[EGX Market Outcome]    [Portfolio Outcome]       [User Action Collector]
(Queries EGX API)       (Queries Portfolio BC)    (Consumes Kafka events)
     │                         │                         │
     │                         ▼                         │
     │                  [User Feedback]                  │
     │               (Queries In-App API)                │
     │                         │                         │
     │                         ▼                         │
     │               [Execution Quality]                 │
     │        (Queries OrderManagement BC - Ph2)         │
     │                         │                         │
     └─────────────────────────┼─────────────────────────┘
                               │
                               ▼
                  [Ground Truth Aggregator]
       (Synthesizes signals into a unified GroundTruthRecord)
                               │
                               ▼
                 [Learning Engine (TRD-AI-023)]
                 (Updates dynamic school weights)
                               │
     ┌─────────────────────────┼─────────────────────────┐
     │                         │                         │
     ▼                         ▼                         ▼
[Bias Detection]       [Self-Reflection]         [Decision Improvement]
 (TRD-AI-025)            (TRD-AI-024)                 (TRD-AI-026)
(Checks for bias)      (Audits decision quality) (Applies algorithmic tweaks)

================================================================================
```

This decoupled architecture ensures that the immediate serving of recommendations is never blocked by the heavy processing required to evaluate historical performance.

---

### Section 3 — Ground Truth Schema

The unified structure representing a complete, evaluated recommendation lifecycle. This schema is the canonical data contract between the Aggregator and the Learning Engine.

```typescript
/**
 * GroundTruthRecord: The foundational entity for continuous AI learning in Tradeora.
 * Represents a complete, closed-loop evaluation of a single AI recommendation.
 */
interface GroundTruthRecord {
  // Core Identifiers
  id: string;                              // UUID v4 of the ground truth record
  recommendationId: string;               // Links to original recommendation
  engineId: string;                       // e.g., 'TRD-AI-012' for Technical Analysis
  ticker: string;                         // EGX ticker symbol (e.g., 'COMI.CA')
  
  // Recommendation Context
  recommendationDate: string;             // ISO 8601 UTC
  recommendationDirection: 'BUY' | 'HOLD' | 'SELL';
  recommendationConfidence: string;        // Decimal [0.00-1.00], the stated confidence
  schoolsParticipated: number;            // How many schools contributed to this decision
  
  // Market Outcome (collected after 5 EGX trading days)
  outcomeDate: string;                    // ISO 8601 UTC (eval date)
  priceAtRecommendation: string;          // Decimal EGP
  priceAtOutcome: string;                 // Decimal EGP
  priceChangePercent: string;             // Decimal, e.g. "3.47" for +3.47%
  directionallyCorrect: boolean;          // Did price move in recommended direction?
  
  // Portfolio Outcome (User-specific economic impact)
  portfolioImpact?: string;               // Decimal EGP (if user held position)
  
  // User Behavior & Feedback
  userActed: boolean;                     // Did user follow recommendation?
  userFeedback?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  userFeedbackText?: string;              // Optional Arabic text for NLP analysis
  
  // Accuracy & Calibration Metrics
  directionAccuracy: string;              // Decimal [0.00-1.00] over rolling window
  confidenceCalibrationError: string;     // |confidence - actual_accuracy| as Decimal
  
  // Provenance & Compliance
  wormArchivePath: string;               // MinIO immutable path for audit
  sha256Hash: string;                     // Cryptographic hash of the record state
}
```

This schema must be strictly validated upon ingestion into the Ground Truth Aggregator. Missing fields in the Market Outcome section will cause the record to be quarantined for manual inspection.

---

### Section 4 — School Weight Update Algorithm

The Meta Decision Engine relies on weighted inputs from various "schools of thought" (e.g., Technical Analysis, Fundamental Analysis, Smart Money). These weights are not static; they evolve based on the Ground Truth feedback loop. 

We use an Exponential Moving Average (EMA) of directional accuracy, penalized by confidence calibration errors, to adjust weights dynamically.

```python
from decimal import Decimal

def update_school_weight(
    school_id: str,
    current_weight: Decimal,
    rolling_accuracy_90d: Decimal,
    confidence_calibration_error: Decimal
) -> Decimal:
    """
    Weight update using exponential moving average of directional accuracy.
    Weights are clipped to [0.05, 0.30] to prevent school exclusion or dominance.
    
    Parameters:
    - school_id: The identifier for the school (e.g., 'TRD-AI-012')
    - current_weight: The current weight allocated to this school [0.05, 0.30]
    - rolling_accuracy_90d: The success rate of this school over the last 90 days [0.0, 1.0]
    - confidence_calibration_error: Absolute difference between average stated confidence 
                                    and actual accuracy [0.0, 1.0]
                                    
    Returns:
    - Decimal: The newly adjusted weight for the school.
    """
    # The target weight is essentially the raw accuracy. If a school is right 65% of the time,
    # its baseline target weight is 0.65 (before normalization across all schools).
    target_weight = rolling_accuracy_90d  
    
    # Conservative update rate to prevent violent swings in system behavior
    learning_rate = Decimal("0.1")        
    
    # Calculate EMA based adjustment
    new_weight = current_weight + learning_rate * (target_weight - current_weight)
    
    # Calibration penalty: high confidence error reduces weight.
    # If a school is frequently "100% confident" but only right 50% of the time,
    # it is dangerous and must be penalized.
    calibration_penalty = confidence_calibration_error * Decimal("0.05")
    new_weight = new_weight - calibration_penalty
    
    # Safety bounds: 
    # - No school can disappear completely (min 0.05) to ensure diverse perspectives.
    # - No school can dictate the entire system (max 0.30) to prevent overfitting to one strategy.
    clamped_weight = max(Decimal("0.05"), min(Decimal("0.30"), new_weight))
    
    return clamped_weight
```

**Normalization Step:** After all individual school weights are updated, they must be mathematically normalized so their sum equals exactly 1.00 before being applied to the Meta Decision Engine.

---

### Section 5 — Qdrant Learning Store (Catastrophic Forgetting Prevention)

Catastrophic forgetting is a common failure mode in continuously learning AI systems, where optimizing for recent data destroys the model's ability to recall older, foundational patterns. To prevent this, Tradeora utilizes a specialized RAG (Retrieval-Augmented Generation) based learning mechanism backed by Qdrant vector database.

The store is partitioned into four distinct collections with strict eviction and retention policies:

1. **Core Collection (`learning_core`):** 
   - **Content:** Foundational EGX patterns (e.g., historical devaluation events, structural market crashes, textbook technical breakouts).
   - **Policy:** NEVER pruned. Immutable unless explicitly modified by the AI Architecture Council.
   - **Purpose:** Prevents the AI from forgetting black-swan events or fundamental market mechanics.

2. **Recent Examples (`learning_recent`):** 
   - **Content:** High-accuracy past recommendations (directional accuracy ≥ 0.65).
   - **Policy:** Rolling 90-day window. Maximum 10,000 entries per school (FIFO eviction).
   - **Purpose:** Adapts to current market regimes and recent momentum behaviors.

3. **Anti-pattern Collection (`learning_antipatterns`):** 
   - **Content:** Low-accuracy recommendations (accuracy < 0.40) where the AI was highly confident but completely wrong.
   - **Policy:** Kept for 1 year, maximum 5,000 entries.
   - **Purpose:** Used as explicit negative examples to avoid repeating historically failed logic patterns.

4. **Calibration Collection (`learning_calibration`):** 
   - **Content:** Pairs of (Stated Confidence vs. Actual Accuracy).
   - **Policy:** Rolling 6-month window.
   - **Purpose:** Used by the Calibration Service to run Platt scaling and adjust raw confidence scores.

**Inference Time Injection:**
When a school processes a new ticker, the system queries Qdrant. The RAG pipeline retrieves the last 10 relevant records from `learning_recent` and 5 relevant failure cases from `learning_antipatterns`. These are injected directly into the LLM prompt context to guide the current decision.

---

### Section 6 — Confidence Calibration System

An AI that is 90% confident but only 50% accurate is dangerous and untrustworthy. The Confidence Calibration System ensures that when the Tradeora AI states "80% confidence," it is historically accurate 80% of the time.

**Mechanism:**
1. **Bucketing:** Every ground truth outcome is slotted into a confidence bucket based on its original stated confidence: `[0.5-0.6)`, `[0.6-0.7)`, `[0.7-0.8)`, `[0.8-0.9)`, `[0.9-1.0]`.
2. **Measurement:** For each bucket, calculate the actual empirical accuracy (e.g., out of 1,000 recommendations in the 0.8-0.9 bucket, how many were correct?).
3. **Platt Scaling (Sigmoid Calibration):** Apply logistic regression to map the raw, uncalibrated confidence scores to the true probability derived from the historical buckets.
4. **Correction Engine:** Before any recommendation is shown to a user, its raw confidence is passed through the calibrated sigmoid curve to produce the "Calibrated Confidence."

*Example:* 
- Engine raw output: 0.85 confidence.
- Historical data shows the engine is historically overconfident in this range, only achieving 0.62 actual accuracy.
- Calibrated output delivered to user: 0.62 (or adjusted to a qualitative "Moderate Confidence" label).

Recalibration runs monthly utilizing the past 90 days of ground truth records.

---

### Section 7 — Ground Truth Kafka Event Flow

To maintain strict decoupling and prevent synchronous blocking, the entire Ground Truth architecture relies on an event-driven choreography via Kafka.

**Topic Specifications:**

```text
ai.GroundTruth.MarketOutcomeCollected.v1
  - Produced by: Market Outcome Collector (after 5 days)
  - Consumed by: Ground Truth Aggregator

ai.GroundTruth.UserActionRecorded.v1
  - Produced by: User Action Collector
  - Consumed by: Ground Truth Aggregator

ai.GroundTruth.RecommendationEvaluated.v1
  - Produced by: Ground Truth Aggregator (when a GroundTruthRecord is complete)
  - Consumed by: Learning Engine, Self-Reflection Engine

ai.Learning.SchoolWeightUpdated.v1
  - Produced by: Learning Engine
  - Consumed by: Meta Decision Engine (to update its internal state)

ai.Learning.CalibrationUpdated.v1
  - Produced by: Calibration Service
  - Consumed by: Meta Decision Engine (to update its scaling curves)

ai.BiasDetection.BiasIdentified.v1
  - Produced by: Bias Detection Engine
  - Consumed by: AI Ethics Board (Alerting), Learning Engine

ai.SelfReflection.OutcomeAudited.v1
  - Produced by: Self-Reflection Engine
  - Consumed by: Learning Engine, Decision Improvement Engine

ai.DecisionImprovement.ImprovementApplied.v1
  - Produced by: Decision Improvement Engine
  - Consumed by: Audit Logging, Architecture Council Dashboard
```

This choreography ensures highly scalable, non-blocking operations capable of handling tens of thousands of recommendations per day.

---

### Section 8 — Measurement Schedule

Operations are distributed across different frequencies to balance computational load and the need for fresh intelligence.

```text
Frequency    │ Action                                          │ Owner
─────────────┼─────────────────────────────────────────────────┼──────────────────────────────
Real-time    │ User feedback events captured via Kafka         │ Ground Truth Collector
Hourly       │ User action events aggregated (followed/ignored)│ Ground Truth Aggregator
Daily        │ EGX price outcomes calculated (5-day lag)       │ Market Outcome Collector
Weekly       │ School accuracy metrics updated                 │ Learning Engine
Weekly       │ School weights updated (conservative rate 0.1)  │ Learning Engine
Monthly      │ Confidence calibration recalculated             │ Calibration Service
Monthly      │ Bias audit executed (Bias Detection Engine)     │ AI Ethics Board
Quarterly    │ Architecture Council reviews weight evolution   │ AI Architecture Council
```

---

### Section 9 — Breaking the Circular Dependency (Resolves ISSUE-004)

**Context from Audit (ISSUE-004):** The external architectural audit identified critical circular dependencies that could lead to deadlocks or infinite feedback loops. 
- The Learning Engine (023) was synchronously calling the Self-Reflection Engine (024), which in turn called the Learning Engine.
- The Strategy Engine (014) was synchronously calling the Backtesting Engine (015), which referenced Strategy logic.

**Resolution 1: Fixed Learning ↔ Self-Reflection (Event-Driven Choreography)**

We transition from synchronous REST calls to an asynchronous Kafka event flow.

```text
[Learning Engine (023)] 
        │
        ├── (Completes weight update)
        └── Publishes: ai.Learning.ModelUpdated.v1
                   │
                   ▼ (async, non-blocking, eventual consistency)
                   │
[Self-Reflection Engine (024)]
        │
        ├── Consumes: ai.Learning.ModelUpdated.v1
        ├── (Performs deep audit of the changes)
        └── Publishes: ai.SelfReflection.OutcomeAudited.v1
                   │
                   ▼ (async, non-blocking)
                   │
[Learning Engine (023)]
        │
        └── Consumes: ai.SelfReflection.OutcomeAudited.v1 
            (Uses audit to adjust next cycle, breaks immediate loop)
```
*Result:* No synchronous cycle. Both engines act independently as producers and consumers of domain events, completely eliminating the risk of a runtime deadlock.

**Resolution 2: Fixed Strategy ↔ Backtesting (Cache-Aside Pattern)**

The synchronous calculation of backtests during live recommendation generation is computationally impossible within latency SLAs.

```text
[Backtesting Engine (015)]
        │
        ├── Runs CONTINUOUSLY as an isolated background cron job.
        └── Writes results to Valkey (Redis-compatible) cache:
            Key: backtest:{strategy_id}:{ticker} -> Value: JSON Metrics
                   │
                   ▼
[Strategy Engine (014)]
        │
        ├── Receives live request for ticker.
        ├── Reads from Valkey cache (O(1) lookup, <2ms latency).
        └── If cache miss, defaults to conservative baseline; DOES NOT call Backtesting.
```
*Result:* The Strategy Engine now depends on a pre-computed data state (the Valkey Cache) rather than a compute engine. The circular dependency is severed at the data layer.

---

### Section 10 — ADR-042: Ground Truth Feedback System

**Title:** Implementation of Asynchronous, Immutable Ground Truth Feedback Pipeline
**Status:** Accepted
**Date:** 2026-07-24
**Context:** The AI requires real-world data to improve. Previous iterations relied on model-driven self-evaluation which led to bias. Audit ISSUE-004 highlighted circular dependencies in the learning pipeline.
**Decision:** We will implement an 8-signal ground truth collection mechanism, fundamentally based on 5-day lagged EGX market outcomes. The architecture will be fully asynchronous using Kafka for choreography, eliminating circular dependencies. Qdrant will be used for RAG-based context injection to prevent catastrophic forgetting. Weights will be updated via a penalized EMA algorithm.
**Consequences:** 
- *Positive:* AI learns from real market behavior, not its own hallucinations. Complete removal of deadlocks. Confidence scores become mathematically sound.
- *Negative:* Increased complexity in the data pipeline. Requires maintaining 5-day state for all recommendations. Requires sophisticated vector DB management for Qdrant.

---

### Section 11 — Compliance & WORM Storage

To satisfy FRA (Financial Regulatory Authority) mandates regarding algorithmic trading advice, all AI decisions and their corresponding ground truth evaluations must be immutably stored for audit purposes.

**Storage Specifications:**
- **Technology:** MinIO configured in WORM (Write-Once-Read-Many) mode.
- **Path Structure:** `s3://tradeora-compliance/ground-truth/recommendations/{YYYY}/{MM}/{DD}/{recommendation_uuid}.json`
- **Retention Policy:** 7 years (Strict Enforcement, hard-coded at bucket level).
- **Immutability:** Object Lock set to `COMPLIANCE` mode. Once written, the object cannot be overwritten or deleted by any user, including the root administrator, until the retention period expires.
- **Access Control:** 
  - `Ground Truth Collector`: `s3:PutObject` (Write-Once only)
  - `Learning Engine`: `s3:GetObject` (Read-only)
  - `Auditor Role`: `s3:GetObject`, `s3:ListBucket`

This robust compliance layer ensures that the historical evolution of the Tradeora AI can be forensically reconstructed at any time by regulatory bodies.

================================================================================
END OF DOCUMENT
================================================================================
