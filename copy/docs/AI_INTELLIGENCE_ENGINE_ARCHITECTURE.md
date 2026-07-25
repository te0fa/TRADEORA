# Tradeora Financial Operating System
## AI Intelligence Engine Architecture Specification
**Document Classification:** RESTRICTED - INTERNAL USE ONLY
**Component:** AI Consensus Orchestrator
**Version:** v1.1.0 amended 2026-07-24 — ISSUE-006 (SLO update), ISSUE-002 (LLM Gateway routing)
**Status:** APPROVED — PRE-006 resolved 2026-07-24 by Architecture Freeze Board

---

## Section 1 — Intelligence Engine Philosophy

### 1.1 The 17-School Architecture (12 Active in Phase 1)
Tradeora's AI Intelligence Engine adopts a 17-School Consensus Architecture as its long-term target. This design leverages the **Wisdom of Crowds** principle, where independent, specialized analytical "schools" evaluate market data concurrently.

> [!IMPORTANT]
> **Phase 1 Active Schools: 12 (Schools 1–12 only)**
> Schools 13–17 (OptionsFlow, InsiderActivity, ESGAnalysis, GlobalMacro, AlternativeData) are Phase 2 additions tracked in the Technical Debt Register as DEBT-008. All quorum thresholds in Phase 1 use **12 as the denominator**. The minimum participating school count for a valid consensus in Phase 1 is **9 of 12** (75%). When Schools 13–17 are activated in Phase 2, quorum thresholds will be recalibrated and a new ADR will govern the transition.

By utilizing 12 distinct methodologies in Phase 1 (Technical, Fundamental, Sentiment, Macroeconomic, Quant, Risk-Adjusted, Behavioral, Sector Rotation, Peer Comparison, Earnings Quality, Pattern Recognition, and Market Intelligence), the engine mitigates hallucination risk and systemic bias. If one model hallucinates or over-indexes on noisy data, the consensus mechanism dilutes its impact, ensuring robust and reliable outputs.

### 1.2 The Three Hard Guarantees
To ensure enterprise-grade safety and reliability in financial recommendations, the Intelligence Engine enforces three inviolable guarantees:
1.  **Confidence Threshold:** The aggregated consensus confidence must mathematically exceed 75% (`0.75`). If the threshold is not met, the system returns `INSUFFICIENT_CONSENSUS`.
2.  **Freshness Gate:** Market data feeding into the models must be no older than 15 minutes (900 seconds). Stale data automatically triggers a safety exclusion.
3.  **Human-Advisory-Only:** The engine strictly functions as an advisory tool. It does not possess direct market execution capabilities.

### 1.3 Constitutional Grounding
The architecture strictly adheres to Tradeora's core constitutional mandates:
*   **ARTICLE 6 (AI Advisory Only):** The AI operates exclusively as an intelligent advisor. All outputs must be clearly labeled as informational recommendations, never as binding directives.
*   **ARTICLE 6.2 (No Autonomous Trading):** The Intelligence Engine is physically and logically decoupled from the Order Management System (OMS). It cannot initiate, modify, or cancel trades autonomously.

### 1.4 Arabic-First Explanation Mandate
Given Tradeora's primary market (EGX and MENA region), the Intelligence Engine operates under an **Arabic-First Mandate**. All generated rationales and market explanations must be natively constructed in high-quality financial Arabic, accurately utilizing localized EGX terminology. English explanations are generated secondarily.

---

## Section 2 — School Registry (All 17 Schools)

The Intelligence Engine is composed of 17 specialized analytical schools.

### Phase 1: Core Intelligence Schools (1-12)

**SCHOOL-01: MarketIntelligence**
*   **Python Service:** `ai-market-intelligence`
*   **Model Backend:** Ollama (Qwen2.5:72b)
*   **Note:** AI engines do NOT call Ollama directly. All LLM inference routes through the LLM Gateway service (ADR-041, LLM_GATEWAY_ARCHITECTURE.md).
*   **Input Data:** EGX real-time ticks, order book depth, bid-ask spread
*   **Output Type:** BUY / HOLD / SELL + confidence (Decimal 0.00–1.00)
*   **Weight in Consensus:** 0.07 (base, dynamic per WisdomEngine)
*   **Max Latency Budget:** 1,500ms
*   **Minimum Confidence to Participate:** 0.75
*   **Exclusion Condition:** If latest market tick age > 900s OR model health check failed
*   **Explainability:** Arabic + English rationale string (max 500 chars each)
*   **Phase:** 1

**SCHOOL-02: FundamentalAnalysis**
*   **Python Service:** `ai-fundamental-analysis`
*   **Model Backend:** Ollama (Qwen2.5:72b)
*   **Note:** AI engines do NOT call Ollama directly. All LLM inference routes through the LLM Gateway service (ADR-041, LLM_GATEWAY_ARCHITECTURE.md).
*   **Input Data:** Trailing P/E, P/B, ROE, EV/EBITDA, Debt/Equity
*   **Output Type:** BUY / HOLD / SELL + confidence (Decimal 0.00–1.00)
*   **Weight in Consensus:** 0.09 (base, dynamic per WisdomEngine)
*   **Max Latency Budget:** 2,000ms
*   **Minimum Confidence to Participate:** 0.75
*   **Exclusion Condition:** Financial reports older than 180 days
*   **Explainability:** Arabic + English rationale string (max 500 chars each)
*   **Phase:** 1

**SCHOOL-03: TechnicalAnalysis**
*   **Python Service:** `ai-technical-analysis`
*   **Model Backend:** Custom ML Pipeline + Ollama (Qwen2.5:7b)
*   **Note:** AI engines do NOT call Ollama directly. All LLM inference routes through the LLM Gateway service (ADR-041, LLM_GATEWAY_ARCHITECTURE.md).
*   **Input Data:** 20+ indicators (RSI, MACD, Bollinger Bands, ADX, Ichimoku)
*   **Output Type:** BUY / HOLD / SELL + confidence (Decimal 0.00–1.00)
*   **Weight in Consensus:** 0.08 (base, dynamic per WisdomEngine)
*   **Max Latency Budget:** 1,000ms
*   **Minimum Confidence to Participate:** 0.75
*   **Exclusion Condition:** Incomplete OHLCV history for indicator calculation
*   **Explainability:** Arabic + English rationale string (max 500 chars each)
*   **Phase:** 1

**SCHOOL-04: SentimentAnalysis**
*   **Python Service:** `ai-sentiment-analysis`
*   **Model Backend:** Arabic BERT/CAMeL
*   **Input Data:** Arabic financial news, social media sentiment, EGX disclosures
*   **Output Type:** BUY / HOLD / SELL + confidence (Decimal 0.00–1.00)
*   **Weight in Consensus:** 0.05 (base, dynamic per WisdomEngine)
*   **Max Latency Budget:** 1,200ms
*   **Minimum Confidence to Participate:** 0.75
*   **Exclusion Condition:** No relevant news/mentions in past 48 hours
*   **Explainability:** Arabic + English rationale string (max 500 chars each)
*   **Phase:** 1

**SCHOOL-05: MacroeconomicAnalysis**
*   **Python Service:** `ai-macro-analysis`
*   **Model Backend:** Ollama (Qwen2.5:72b)
*   **Note:** AI engines do NOT call Ollama directly. All LLM inference routes through the LLM Gateway service (ADR-041, LLM_GATEWAY_ARCHITECTURE.md).
*   **Input Data:** CBE interest rates, USD/EGP exchange rate, CPI inflation data, EGX cycle phase
*   **Output Type:** BUY / HOLD / SELL + confidence (Decimal 0.00–1.00)
*   **Weight in Consensus:** 0.06 (base, dynamic per WisdomEngine)
*   **Max Latency Budget:** 1,500ms
*   **Minimum Confidence to Participate:** 0.75
*   **Exclusion Condition:** Missing key macroeconomic indicators
*   **Explainability:** Arabic + English rationale string (max 500 chars each)
*   **Phase:** 1

**SCHOOL-06: QuantitativeModels**
*   **Python Service:** `ai-quant-models`
*   **Model Backend:** Statistical Engine (Pandas/NumPy)
*   **Input Data:** Mean-reversion signals, momentum metrics, Fama-French adapted for EGX
*   **Output Type:** BUY / HOLD / SELL + confidence (Decimal 0.00–1.00)
*   **Weight in Consensus:** 0.07 (base, dynamic per WisdomEngine)
*   **Max Latency Budget:** 1,000ms
*   **Minimum Confidence to Participate:** 0.75
*   **Exclusion Condition:** Statistical variance exceeds normal parameters
*   **Explainability:** Arabic + English rationale string (max 500 chars each)
*   **Phase:** 1

**SCHOOL-07: RiskAdjustedReturn**
*   **Python Service:** `ai-risk-adjusted`
*   **Model Backend:** Statistical Engine
*   **Input Data:** Sharpe ratio, Sortino ratio, Calmar ratio, VaR 99%, Expected Shortfall
*   **Output Type:** BUY / HOLD / SELL + confidence (Decimal 0.00–1.00)
*   **Weight in Consensus:** 0.08 (base, dynamic per WisdomEngine)
*   **Max Latency Budget:** AI performance SLAs are defined by capability tier. See AI_PERFORMANCE_SLA_ARCHITECTURE.md. Summary: Tier 1 (Realtime) P99 ≤1,500ms; Tier 2 (Extended) P99 ≤3,000ms; Tier 3 (Background) served from cache <50ms.
*   **Minimum Confidence to Participate:** 0.75
*   **Exclusion Condition:** Insufficient historical volatility data
*   **Explainability:** Arabic + English rationale string (max 500 chars each)
*   **Phase:** 1

**SCHOOL-08: BehavioralFinance**
*   **Python Service:** `ai-behavioral-finance`
*   **Model Backend:** Custom ML Pipeline
*   **Input Data:** Retail herding metrics, disposition effect proxies, overreaction signals
*   **Output Type:** BUY / HOLD / SELL + confidence (Decimal 0.00–1.00)
*   **Weight in Consensus:** 0.05 (base, dynamic per WisdomEngine)
*   **Max Latency Budget:** 1,200ms
*   **Minimum Confidence to Participate:** 0.75
*   **Exclusion Condition:** Extreme market illiquidity
*   **Explainability:** Arabic + English rationale string (max 500 chars each)
*   **Phase:** 1

**SCHOOL-09: SectorRotation**
*   **Python Service:** `ai-sector-rotation`
*   **Model Backend:** Ollama (Qwen2.5:72b)
*   **Note:** AI engines do NOT call Ollama directly. All LLM inference routes through the LLM Gateway service (ADR-041, LLM_GATEWAY_ARCHITECTURE.md).
*   **Input Data:** Sector momentum, relative P/E vs. historical sector averages
*   **Output Type:** BUY / HOLD / SELL + confidence (Decimal 0.00–1.00)
*   **Weight in Consensus:** 0.06 (base, dynamic per WisdomEngine)
*   **Max Latency Budget:** 1,500ms
*   **Minimum Confidence to Participate:** 0.75
*   **Exclusion Condition:** Sector reclassification underway
*   **Explainability:** Arabic + English rationale string (max 500 chars each)
*   **Phase:** 1

**SCHOOL-10: PeerComparison**
*   **Python Service:** `ai-peer-comparison`
*   **Model Backend:** Qdrant Vector Similarity Search
*   **Input Data:** Embeddings of financial metrics, comparing to similar historical companies
*   **Output Type:** BUY / HOLD / SELL + confidence (Decimal 0.00–1.00)
*   **Weight in Consensus:** 0.05 (base, dynamic per WisdomEngine)
*   **Max Latency Budget:** 2,000ms
*   **Minimum Confidence to Participate:** 0.75
*   **Exclusion Condition:** Fewer than 3 valid peers found in vector space
*   **Explainability:** Arabic + English rationale string (max 500 chars each)
*   **Phase:** 1

**SCHOOL-11: EarningsQuality**
*   **Python Service:** `ai-earnings-quality`
*   **Model Backend:** Statistical Engine
*   **Input Data:** Accruals analysis, revenue quality, cash conversion cycle
*   **Output Type:** BUY / HOLD / SELL + confidence (Decimal 0.00–1.00)
*   **Weight in Consensus:** 0.07 (base, dynamic per WisdomEngine)
*   **Max Latency Budget:** 1,000ms
*   **Minimum Confidence to Participate:** 0.75
*   **Exclusion Condition:** Missing cash flow statement data
*   **Explainability:** Arabic + English rationale string (max 500 chars each)
*   **Phase:** 1

**SCHOOL-12: PatternRecognition**
*   **Python Service:** `ai-pattern-recognition`
*   **Model Backend:** Chart pattern ML (CNN)
*   **Input Data:** Price charts (H&S, double bottom, flags, channels)
*   **Output Type:** BUY / HOLD / SELL + confidence (Decimal 0.00–1.00)
*   **Weight in Consensus:** 0.06 (base, dynamic per WisdomEngine)
*   **Max Latency Budget:** 2,000ms
*   **Minimum Confidence to Participate:** 0.75
*   **Exclusion Condition:** No discernible pattern detected above confidence threshold
*   **Explainability:** Arabic + English rationale string (max 500 chars each)
*   **Phase:** 1

### Phase 2: Advanced Intelligence Schools (13-17 - Planned)

**SCHOOL-13: OptionsFlow**
*   **Input Data:** Implied volatility, put/call ratio, unusual options activity
*   **Phase:** 2

**SCHOOL-14: InsiderActivity**
*   **Input Data:** Director dealings, institutional accumulation signals
*   **Phase:** 2

**SCHOOL-15: ESGAnalysis**
*   **Input Data:** Sharia compliance screen + ESG scoring for EGX companies
*   **Phase:** 2

**SCHOOL-16: GlobalMacro**
*   **Input Data:** Correlation with global indices, US Fed impact on EGX
*   **Phase:** 2

**SCHOOL-17: AlternativeData**
*   **Input Data:** Satellite imagery, web traffic, consumer data
*   **Phase:** 3

---

## Section 3 — Consensus Algorithm

The consensus algorithm utilizes weighted voting governed strictly by Decimal arithmetic to prevent floating-point anomalies. 

```python
# ai-consensus-orchestrator/src/consensus/weighted_voting.py
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Literal
from dataclasses import dataclass
import asyncio

@dataclass(frozen=True)
class SchoolRecommendation:
    school_id: str
    recommendation: Literal['BUY', 'HOLD', 'SELL']
    confidence: Decimal  # 0.00–1.00, using Decimal
    rationale_ar: str
    rationale_en: str
    weight: Decimal
    inference_ms: int
    data_freshness_seconds: int

@dataclass
class ConsensusResult:
    ticker: str
    status: Literal['REACHED', 'INSUFFICIENT_CONSENSUS', 'ERROR']
    recommendation: Optional[Literal['BUY', 'HOLD', 'SELL']] = None
    confidence: Optional[Decimal] = None
    school_breakdown: Optional[dict] = None
    participating_schools: int = 0
    excluded_schools: int = 0
    minimum_required: int = 0
    error_reason: Optional[str] = None
    
    @classmethod
    def insufficient(cls, ticker: str, participating: int, minimum_required: int):
        return cls(ticker=ticker, status='INSUFFICIENT_CONSENSUS', participating_schools=participating, minimum_required=minimum_required)
        
    @classmethod
    def error(cls, ticker: str, reason: str):
        return cls(ticker=ticker, status='ERROR', error_reason=reason)
        
    @classmethod
    def reached(cls, ticker, recommendation, confidence, school_breakdown, participating_schools, excluded_schools):
        return cls(
            ticker=ticker,
            status='REACHED',
            recommendation=recommendation,
            confidence=confidence,
            school_breakdown=school_breakdown,
            participating_schools=participating_schools,
            excluded_schools=excluded_schools
        )

class WeightedConsensusAlgorithm:
    CONFIDENCE_THRESHOLD = Decimal('0.75')
    # Phase 1: 9 of 12 active schools must participate (75% minimum).
    # Phase 2 recalibration required when Schools 13-17 are activated (new ADR).
    MINIMUM_PARTICIPATING_SCHOOLS = 9  # 9/12 = 75% Phase 1 quorum threshold
    
    def compute_consensus(
        self,
        recommendations: List[SchoolRecommendation],
        ticker: str,
    ) -> ConsensusResult:
        # Step 1: Filter schools below confidence threshold
        eligible = [
            r for r in recommendations
            if r.confidence >= self.CONFIDENCE_THRESHOLD
        ]
        
        # Step 2: Gate: if < 9 of 12 Phase 1 schools eligible, return INSUFFICIENT_CONSENSUS
        if len(eligible) < self.MINIMUM_PARTICIPATING_SCHOOLS:
            return ConsensusResult.insufficient(
                ticker=ticker,
                participating=len(eligible),
                minimum_required=self.MINIMUM_PARTICIPATING_SCHOOLS
            )
        
        # Step 3: Weighted vote per direction (Decimal arithmetic only)
        weighted_votes = {direction: Decimal('0') for direction in ['BUY', 'HOLD', 'SELL']}
        total_weight = Decimal('0')
        
        for rec in eligible:
            weighted_votes[rec.recommendation] += rec.confidence * rec.weight
            total_weight += rec.weight
        
        # Step 4: Normalize
        if total_weight == Decimal('0'):
            return ConsensusResult.error(ticker, 'zero_total_weight')
        
        normalized = {
            direction: (vote / total_weight).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)
            for direction, vote in weighted_votes.items()
        }
        
        # Step 5: Winner
        winner = max(normalized, key=normalized.__getitem__)
        winner_score = normalized[winner]
        
        # Step 6: Consensus confidence (winning score, not just winner)
        return ConsensusResult.reached(
            ticker=ticker,
            recommendation=winner,
            confidence=winner_score,
            school_breakdown=normalized,
            participating_schools=len(eligible),
            excluded_schools=len(recommendations) - len(eligible),
        )
```

---

## Section 4 — AI Safety Engine (7-Check Validation)

The AI Safety Engine is the final gatekeeper before a recommendation is surfaced to the user. All 7 checks must pass.

```python
# ai-consensus-orchestrator/src/safety/engine.py
from typing import List
from dataclasses import dataclass
from decimal import Decimal

@dataclass
class ValidationContext:
    latest_tick_age_seconds: int
    is_circuit_breaker_active: bool
    is_instrument_suspended: bool
    is_regulatory_embargo: bool

@dataclass
class CheckResult:
    check_name: str
    passed: bool
    reason: str = ""

@dataclass
class SafetyResult:
    passed: bool
    failures: List[CheckResult]
    recommendation_blocked: bool

class AIRecommendationSafetyEngine:
    """
    7-check safety gate. ALL checks must pass before recommendation is published.
    Any failure -> RECOMMENDATION BLOCKED, reason logged, user sees 'Analysis Pending'.
    """
    
    def validate(self, result: ConsensusResult, context: ValidationContext) -> SafetyResult:
        if result.status != 'REACHED':
            return SafetyResult(passed=False, failures=[CheckResult("Consensus Status", False, "Consensus not reached")], recommendation_blocked=True)
            
        checks = [
            self._check_1_minimum_confidence(result),          # >= 0.75 overall
            self._check_2_minimum_school_count(result),         # >= 9 of 17
            self._check_3_market_data_freshness(context),       # last tick < 15 min
            self._check_4_no_circuit_breaker_active(context),   # EGX circuit breaker
            self._check_5_instrument_not_suspended(context),    # EGX halt check
            self._check_6_explanation_generated(result),        # Arabic explanation exists
            self._check_7_no_regulatory_embargo(context),       # FRA embargo list check
        ]
        
        failures = [c for c in checks if not c.passed]
        return SafetyResult(
            passed=len(failures) == 0,
            failures=failures,
            recommendation_blocked=len(failures) > 0
        )
        
    def _check_1_minimum_confidence(self, result: ConsensusResult) -> CheckResult:
        passed = result.confidence is not None and result.confidence >= Decimal('0.75')
        return CheckResult("Minimum Confidence", passed, "Confidence below 0.75" if not passed else "")

    def _check_2_minimum_school_count(self, result: ConsensusResult) -> CheckResult:
        # Phase 1: require at least 9 of 12 active schools (75% quorum)
        PHASE1_MINIMUM = 9
        passed = result.participating_schools >= PHASE1_MINIMUM
        return CheckResult(
            "Minimum School Count",
            passed,
            f"Only {result.participating_schools}/12 Phase 1 schools participated (minimum: {PHASE1_MINIMUM})" if not passed else ""
        )

    def _check_3_market_data_freshness(self, context: ValidationContext) -> CheckResult:
        passed = context.latest_tick_age_seconds < 900
        return CheckResult("Market Data Freshness", passed, "Market data older than 15 minutes" if not passed else "")

    def _check_4_no_circuit_breaker_active(self, context: ValidationContext) -> CheckResult:
        passed = not context.is_circuit_breaker_active
        return CheckResult("Circuit Breaker Status", passed, "EGX circuit breaker is active" if not passed else "")

    def _check_5_instrument_not_suspended(self, context: ValidationContext) -> CheckResult:
        passed = not context.is_instrument_suspended
        return CheckResult("Instrument Suspension Status", passed, "Instrument is currently suspended" if not passed else "")

    def _check_6_explanation_generated(self, result: ConsensusResult) -> CheckResult:
        """
        Validates that the Arabic explanation meets the minimum quality threshold.
        Requirement: non-empty string of >= 50 words in Arabic.
        The explanation is expected to be stored in result.school_breakdown['arabic_rationale'].
        """
        rationale: str = (result.school_breakdown or {}).get('arabic_rationale', '')
        word_count = len(rationale.split()) if rationale else 0
        MIN_ARABIC_WORDS = 50
        passed = bool(rationale) and word_count >= MIN_ARABIC_WORDS
        reason = (
            f"Arabic explanation too short: {word_count} words (minimum: {MIN_ARABIC_WORDS})"
            if not passed else ""
        )
        return CheckResult("Arabic Explanation Quality", passed, reason)

    def _check_7_no_regulatory_embargo(self, context: ValidationContext) -> CheckResult:
        passed = not context.is_regulatory_embargo
        return CheckResult("Regulatory Embargo", passed, "Instrument under FRA embargo" if not passed else "")
```

---

## Section 5 — School Dispatch & Parallel Execution

Schools are queried in parallel via `asyncio`. Individual timeouts ensure a slow school does not degrade overall system latency.

```python
# ai-consensus-orchestrator/src/orchestrator/dispatcher.py
import asyncio
from typing import List
import logging

logger = logging.getLogger(__name__)

async def dispatch_to_all_schools(
    ticker: str,
    market_context: MarketContext,
    school_registry: SchoolRegistry,
) -> List[SchoolRecommendation]:
    # Run all active schools in parallel with individual timeouts
    tasks = [
        asyncio.wait_for(
            school.analyze(ticker, market_context),
            timeout=school.max_latency_ms / 1000.0,
        )
        for school in school_registry.get_active_schools()
    ]
    
    # Gather with error handling — failed schools excluded, not fatal
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    valid_results = []
    for school, result in zip(school_registry.get_active_schools(), results):
        if isinstance(result, asyncio.TimeoutError):
            logger.warning(f"School {school.school_id} timed out")
            log_school_failure(school.school_id, "timeout")
        elif isinstance(result, Exception):
            # Log exclusion, metric counter increment, continue
            logger.error(f"School {school.school_id} failed: {str(result)}")
            log_school_failure(school.school_id, result)
        else:
            valid_results.append(result)
    
    return valid_results

def log_school_failure(school_id: str, error: Exception | str):
    # Sends metrics to Prometheus
    # metrics.school_failures.labels(school_id=school_id).inc()
    pass
```

---

## Section 6 — WisdomEngine (Dynamic Weight Calibration)

The WisdomEngine continuously evaluates historical school accuracy and dynamically adjusts their weights.

**Calibration Mechanism:**
1.  **Monthly Tracking:** Tracks accuracy per school across different EGX sectors.
2.  **Brier Score Measurement:** Evaluates confidence calibration (was the school highly confident when wrong?).
3.  **Circuit Breaker:** If a school's accuracy drops below 55% for 3 consecutive months, its weight is set to 0 (auto-excluded).
4.  **Weight Bounds:** Minimum weight = 0.04, Maximum weight = 0.12.

**Weight Update Formula (Article 17 compliant — Decimal arithmetic only):**
```python
from decimal import Decimal, ROUND_HALF_UP

def calculate_new_weight(
    current_weight: Decimal,
    accuracy: Decimal,
    brier_score: Decimal,
) -> Decimal:
    """
    Recalculate a school's consensus weight based on monthly accuracy and Brier score.

    Engineering Constitution Article 17 MANDATE: All arithmetic uses Decimal.
    float is strictly prohibited in weight calibration — weight drift compounds
    across thousands of monthly calibration cycles and silently biases all
    recommendations if float imprecision is permitted.

    Args:
        current_weight: Current school weight, Decimal in [0.04, 0.12]
        accuracy: Monthly directional accuracy rate, Decimal in [0.00, 1.00]
        brier_score: Monthly Brier calibration score, Decimal in [0.00, 1.00]

    Returns:
        New school weight, Decimal bounded in [0.04, 0.12]
    """
    BENCHMARK_ACCURACY = Decimal('0.60')
    ACCURACY_SENSITIVITY = Decimal('0.1')
    CALIBRATION_SENSITIVITY = Decimal('0.05')
    WEIGHT_FLOOR = Decimal('0.04')
    WEIGHT_CEILING = Decimal('0.12')

    accuracy_delta = (accuracy - BENCHMARK_ACCURACY) * ACCURACY_SENSITIVITY
    calibration_penalty = brier_score * CALIBRATION_SENSITIVITY
    raw_new_weight = current_weight + accuracy_delta - calibration_penalty

    # Bound between WEIGHT_FLOOR and WEIGHT_CEILING using Decimal comparisons
    bounded = max(WEIGHT_FLOOR, min(WEIGHT_CEILING, raw_new_weight))
    return bounded.quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)
```

---

## Section 7 — AI Explainability System

**Arabic Explanation Generation Requirements:**
*   **Tone Calibration:** Dynamically adjusts complexity based on the user profile (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`).
*   **Mandatory Disclaimer:** Every explanation must conclude with the FRA mandated disclaimer: "هذا التحليل استرشادي فقط ولا يعد توصية استثمارية ملزمة" (This analysis is for guidance only and is not a binding investment recommendation).
*   **Template Structure:** Context -> Consensus Reasoning -> Risk Factors -> Disclaimer.
*   **Quality Gate:** Explanations must be between 50 and 500 words.

**Ollama Prompt Example:**
```yaml
prompt_template:
  role: system
  content: "You are an expert financial analyst for the Egyptian Exchange (EGX). Generate a {user_level} level explanation in native Arabic summarizing why the consensus is {recommendation}. Include specific metrics. Conclude with the mandatory FRA disclaimer."
```

---

## Section 8 — Prompt Version Management

*   **Format:** Prompts are stored as YAML templates.
*   **Versioning:** Semantic versioning (e.g., `v1.2.0-ar-sentiment`).
*   **A/B Testing Framework:** Traffic splitting capabilities (e.g., 90% stable prompt, 10% experimental prompt) to measure impact on generated rationale quality.
*   **Rollback Procedure:** Automated rollback triggered if the daily explanation quality score drops below 3.5/5.0.
*   **Registry:** Prompts are version-controlled in a dedicated Git repository (`tradeora-prompts`).

---

## Section 9 — AI Performance SLOs

*   **P99 e2e Latency:** AI performance SLAs are defined by capability tier. See AI_PERFORMANCE_SLA_ARCHITECTURE.md. Summary: Tier 1 (Realtime) P99 ≤1,500ms; Tier 2 (Extended) P99 ≤3,000ms; Tier 3 (Background) served from cache <50ms.
*   **School Exclusion Rate:** &le; 30% excluded (Ensuring &ge; 70% participation per request).
*   **AI Safety Gate Pass Rate:** &ge; 85% of requests (Assuming 15% fail due to valid data constraints like circuit breakers).
*   **Directional Accuracy Target:** &ge; 70% (Evaluated monthly against a golden dataset).
*   **Hallucination Rate:** &lt; 2% (Factual errors in generated Arabic explanations, evaluated via LLM-as-a-judge).
*   **Arabic Explanation Quality Score:** &ge; 4.0 / 5.0 (Sampled monthly via human evaluation).

---

## Section 10 — AI Model Infrastructure

*   **Hardware Deployment — Phase 1 (CPU-ONLY):** Per Engineering Constitution TRIGGER 3 and Technical Debt Register DEBT-003, Phase 1 deploys Ollama exclusively on **CPU-optimized compute nodes**. No GPU nodes are provisioned in Phase 1. This is a deliberate architectural decision to minimize infrastructure complexity and cost during the initial launch phase.
*   **Phase 2 GPU Upgrade:** NVIDIA A100 or equivalent GPU nodes are planned for Phase 2 (tracked as DEBT-003). The LiteLLM proxy and LLM Gateway are GPU-agnostic and will route to GPU-backed Ollama instances without application code changes.
*   **Note:** AI engines do NOT call Ollama directly. All LLM inference routes through the LLM Gateway service (ADR-041, LLM_GATEWAY_ARCHITECTURE.md).
*   **Primary Model (Phase 1 CPU):** Qwen2.5:14b-q4 (quantized for CPU inference) for deep reasoning (Fundamental, Macro). Full 72b model deferred to Phase 2 GPU.
*   **Fast Model (Phase 1 CPU):** Qwen2.5:7b-q4 for latency-sensitive tasks (Technical Analysis, Market Intelligence).
*   **Routing:** LiteLLM proxy handles routing, load balancing, and 3-tier fallback (Local Ollama → DeepSeek API → OpenAI API).
*   **Vector Database:** Qdrant used for similarity searches (Peer Comparison SCHOOL-10, Pattern Recognition SCHOOL-12).
*   **Pre-Session Warm-up (CPU Phase 1):** Automated model pre-loading jobs (`JOB-WARMUP-001`) execute at **08:30 AM Cairo time**, during the PRE_OPEN window (08:00–09:29 Cairo), ensuring all 12 AI school models are loaded into CPU memory and the Valkey AI cache is primed before the EGX official trading session opens at **09:30 AM Cairo time**. The warm-up job completes by setting `ai:schools:warmup:passed = true` in Valkey. If warm-up is not complete by 09:25, an alert fires and AI recommendations are held until the flag is set.
*   **Concurrency Management:** Phase 1 Ollama CPU is limited to 8 concurrent inference requests. A token-bucket rate limiter in the LLM Gateway ensures requests beyond capacity receive a `503 AI_CAPACITY_EXCEEDED` response with `Retry-After: 30` header, rather than queueing indefinitely. A safe fallback message ("التحليل متأخر قليلاً، يرجى إعادة المحاولة") is returned to users during peak saturation.
*   **Memory Allocation:** CPU RAM quotas per school Kubernetes pod (memory request/limit) prevent out-of-memory cascading failures.

---

## Section 11 — Monitoring & Observability

*   **Prometheus Metrics:**
    *   `tradeora_ai_school_latency_ms`
    *   `tradeora_ai_school_confidence_score`
    *   `tradeora_ai_school_exclusion_total`
    *   `tradeora_ai_consensus_participation_ratio`
*   **Grafana Dashboards:** "17-School Unified Dashboard" tracking real-time inferences, accuracy trends, and latency per school.
*   **Critical Alerts:**
    *   `SchoolLatencyHigh`: If `tradeora_ai_school_latency_ms{quantile="0.99"}` > 1500ms -> Trigger auto-exclusion for the session.
    *   `LowConsensusParticipation`: If participation rate < 70% -> Suspend AI recommendations globally.
*   **Evaluation:** Monthly automated runs against the EGX historical golden dataset to validate accuracy.

---
*Tradeora Financial Operating System - Architecture Documentation - generated 2026*
