# Tradeora Financial Operating System
## Enterprise Metrics Catalog
## Version 1.0.0 | Status: AUTHORITATIVE | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Classification : ENTERPRISE CONFIDENTIAL                                   ║
║  Owner          : Chief Data Officer + Chief Platform Architect             ║
║  Mandated By    : Global Enterprise Architecture Board — Session 2026-07-24 ║
║  Constitutional : Articles 8 (data governance), 17 (Decimal arithmetic)    ║
║  Review Cadence : Quarterly                                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

> **PURPOSE**: This catalog is the single authoritative registry of every measurable
> value in the Tradeora Financial Operating System. No metric may be published to a
> Grafana dashboard, Prometheus endpoint, or business report unless it is registered
> here first. Every metric has one owner, one formula, one source of truth.

---

## Section 1 — Catalog Schema

Every metric entry uses the following 21-field schema:

| Field | Description |
|-------|-------------|
| **Metric ID** | Unique identifier: `TRD-MTR-{domain}-{seq}` |
| **Metric Name** | Human-readable name |
| **Description** | What it measures |
| **Business Meaning** | Why the business cares |
| **Technical Meaning** | What generates/consumes it |
| **Formula** | Exact calculation (Decimal arithmetic per Article 17) |
| **Unit** | Measurement unit |
| **Aggregation Method** | sum / avg / p99 / rate / gauge / histogram |
| **Source** | System that produces the raw value |
| **Refresh Frequency** | How often the value is recalculated |
| **Retention Policy** | How long raw values are kept |
| **Alert Thresholds** | Warning / Critical thresholds |
| **Consumers** | Systems / teams that use this metric |
| **Dependencies** | Other metrics or data required |
| **Version** | Semantic version of the metric definition |
| **Validation Rules** | Data quality constraints |
| **Dashboard** | Grafana dashboard panel |
| **Business Owner** | Accountable business role |
| **Technical Owner** | Accountable engineering role |
| **AI Owner** | AI team owner (if AI metric) |
| **Data Owner** | Data governance owner |

---

## Section 2 — AI Inference Metrics (TRD-MTR-AI)

---

### TRD-MTR-AI-001: School Signal Accuracy

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-AI-001 |
| **Metric Name** | School Signal Accuracy |
| **Description** | Directional accuracy of a single AI school's BUY/HOLD/SELL signal over a 20-day outcome window |
| **Business Meaning** | Measures whether each AI school's trading signals are directionally correct |
| **Technical Meaning** | Percentage of predictions where actual 20-day return direction matches signal direction |
| **Formula** | `accuracy = correct_predictions / total_predictions` (Decimal, ROUND_HALF_UP 4dp) |
| **Unit** | Ratio [0.0000 – 1.0000] |
| **Aggregation Method** | Rolling 30-day average per school |
| **Source** | `backtest_school_accuracy` PostgreSQL table |
| **Refresh Frequency** | Nightly (post-market, 16:00 Cairo) |
| **Retention Policy** | 7 years (FRA audit requirement) |
| **Alert Thresholds** | Warning: < 0.58 | Critical: < 0.55 (3 consecutive months) |
| **Consumers** | WisdomEngine, AI Architecture Council, Grafana AI Dashboard |
| **Dependencies** | TRD-MTR-AI-002 (Brier score) |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0; requires ≥ 30 predictions per window |
| **Dashboard** | AI Operations > School Performance Heat Map |
| **Business Owner** | Chief Investment Officer |
| **Technical Owner** | AI Architecture Lead |
| **AI Owner** | WisdomEngine Team |
| **Data Owner** | Data Engineering |

---

### TRD-MTR-AI-002: School Brier Score

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-AI-002 |
| **Metric Name** | School Brier Score |
| **Description** | Confidence calibration quality for each AI school |
| **Business Meaning** | Measures whether the AI's stated confidence matches actual outcome probability |
| **Technical Meaning** | Mean squared error between predicted probability and binary outcome |
| **Formula** | `brier = mean((confidence - outcome_binary)^2)` where outcome_binary ∈ {0, 1} |
| **Unit** | Score [0.0000 – 1.0000] (lower = better) |
| **Aggregation Method** | Rolling 30-day average per school |
| **Source** | `backtest_outcomes.brier_score` PostgreSQL column |
| **Refresh Frequency** | Nightly |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Warning: > 0.22 | Critical: > 0.28 |
| **Consumers** | WisdomEngine, AI Benchmark Suite |
| **Dependencies** | TRD-MTR-AI-001 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0 |
| **Dashboard** | AI Operations > Confidence Calibration |
| **Business Owner** | Chief AI Officer |
| **Technical Owner** | AI Architecture Lead |
| **AI Owner** | WisdomEngine Team |
| **Data Owner** | Data Engineering |

---

### TRD-MTR-AI-003: Consensus Orchestrator Latency P99

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-AI-003 |
| **Metric Name** | Consensus Orchestrator P99 Latency |
| **Description** | End-to-end latency from user recommendation request to consensus result |
| **Business Meaning** | User-facing speed of AI recommendations; affects UX quality |
| **Technical Meaning** | Wall-clock time from ConsensusOrchestrator.start() to ConsensusResultReached event |
| **Formula** | P99 of histogram `ai_consensus_duration_seconds` buckets over 5-minute window |
| **Unit** | Milliseconds |
| **Aggregation Method** | histogram_quantile(0.99) |
| **Source** | Prometheus: `ai_consensus_duration_seconds` |
| **Refresh Frequency** | Real-time (15s scrape interval) |
| **Retention Policy** | 30 days hot / 1 year aggregated |
| **Alert Thresholds** | Warning: > 700ms | Critical: > 900ms |
| **Consumers** | SRE On-call, Grafana SLO Dashboard |
| **Dependencies** | TRD-MTR-INFRA-001 (LLM Gateway latency) |
| **Version** | 1.0.0 |
| **Validation Rules** | value > 0; measured only during EGX session hours |
| **Dashboard** | AI SLO Dashboard > Consensus Latency |
| **Business Owner** | VP Engineering |
| **Technical Owner** | SRE Lead |
| **AI Owner** | Consensus Orchestrator Team |
| **Data Owner** | Platform Engineering |

---

### TRD-MTR-AI-004: Golden Dataset Accuracy

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-AI-004 |
| **Metric Name** | Golden Dataset Accuracy |
| **Description** | AI ensemble accuracy against the fixed 100-scenario benchmark |
| **Business Meaning** | Absolute quality gate for the AI system; must stay above 70% at all times |
| **Technical Meaning** | Percentage of 100 fixed golden scenarios answered correctly by the consensus |
| **Formula** | `accuracy = scenarios_correct / 100` (Decimal) |
| **Unit** | Ratio [0.00 – 1.00] |
| **Aggregation Method** | Per backtest run (not rolling) |
| **Source** | `backtest_runs` PostgreSQL table |
| **Refresh Frequency** | After each backtest run (monthly minimum) |
| **Retention Policy** | Permanent (FRA audit) |
| **Alert Thresholds** | Warning: < 0.70 | Critical: < 0.60 (suspend AI) |
| **Consumers** | AI Architecture Council, PagerDuty, Freeze Board |
| **Dependencies** | TRD-MTR-AI-001 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0; requires all 100 scenarios evaluated |
| **Dashboard** | AI Quality > Golden Dataset Trend |
| **Business Owner** | Chief AI Officer |
| **Technical Owner** | AI Architecture Lead |
| **AI Owner** | Backtesting Team |
| **Data Owner** | Data Engineering |

---

### TRD-MTR-AI-005: AI Hallucination Rate

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-AI-005 |
| **Metric Name** | AI Hallucination Rate |
| **Description** | Percentage of AI responses citing non-existent tickers, events, or data points |
| **Business Meaning** | Critical safety metric — hallucinations in financial advice are a regulatory risk |
| **Technical Meaning** | Rate of responses flagged by the hallucination detection pipeline |
| **Formula** | `rate = flagged_responses / total_responses` (Decimal, rolling 7-day) |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | 7-day rolling rate |
| **Source** | AI Safety Engine hallucination detection log |
| **Refresh Frequency** | Real-time |
| **Retention Policy** | 7 years (FRA) |
| **Alert Thresholds** | Warning: > 0.01 | Critical: > 0.02 |
| **Consumers** | AI Safety Team, Compliance, PagerDuty |
| **Dependencies** | TRD-MTR-AI-003 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0; must have ≥ 50 samples per 7-day window |
| **Dashboard** | AI Safety > Hallucination Monitor |
| **Business Owner** | Chief Compliance Officer |
| **Technical Owner** | AI Safety Lead |
| **AI Owner** | AI Safety Engine Team |
| **Data Owner** | Compliance Engineering |

---

### TRD-MTR-AI-006: FRA Embargo Block Rate

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-AI-006 |
| **Metric Name** | FRA Embargo Block Rate |
| **Description** | Percentage of AI recommendation requests blocked due to active FRA embargo |
| **Business Meaning** | Compliance health metric — high rate means many embargoed tickers or embargo sync working correctly |
| **Technical Meaning** | Rate of Safety Check 7 (FRA embargo) failures among all AI requests |
| **Formula** | `rate = embargo_blocks / total_ai_requests` (Decimal, daily) |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Daily rate |
| **Source** | AI Safety Engine Check 7 metrics: `ai_safety_check_failed_total{check="7"}` |
| **Refresh Frequency** | Real-time |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Info: > 0.05 (many embargoes active — notify compliance) |
| **Consumers** | Compliance Officer, FRA Reporting BC |
| **Dependencies** | TRD-MTR-SEC-001 (FRA embargo sync staleness) |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0 |
| **Dashboard** | FRA Compliance > Embargo Block Monitor |
| **Business Owner** | Chief Compliance Officer |
| **Technical Owner** | AI Safety Lead |
| **AI Owner** | AI Safety Engine Team |
| **Data Owner** | Compliance Engineering |

---

### TRD-MTR-AI-007: WisdomEngine Weight Entropy

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-AI-007 |
| **Metric Name** | WisdomEngine Weight Entropy |
| **Description** | Shannon entropy of the school weight distribution — measures weight diversity |
| **Business Meaning** | Low entropy = one school dominates; risks single-school failure; high entropy = balanced ensemble |
| **Technical Meaning** | Shannon entropy H = -Σ(wᵢ × log₂(wᵢ)) over all 12 Phase 1 school weights |
| **Formula** | `H = -sum(w_i * log2(w_i) for w_i in weights if w_i > 0)` (Decimal) |
| **Unit** | Bits [0.000 – log₂(12) ≈ 3.585] |
| **Aggregation Method** | Scalar gauge, updated after each WisdomEngine recalibration |
| **Source** | WisdomEngine weight table in PostgreSQL |
| **Refresh Frequency** | After each recalibration (monthly minimum) |
| **Retention Policy** | 5 years |
| **Alert Thresholds** | Warning: < 2.0 bits | Critical: < 1.5 bits (excessive concentration) |
| **Consumers** | AI Architecture Council, WisdomEngine Team |
| **Dependencies** | TRD-MTR-AI-001 (per-school accuracy) |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 3.585; weights must sum to 1.0 |
| **Dashboard** | AI Quality > WisdomEngine Weight Distribution |
| **Business Owner** | Chief AI Officer |
| **Technical Owner** | AI Architecture Lead |
| **AI Owner** | WisdomEngine Team |
| **Data Owner** | Data Engineering |

---

### TRD-MTR-AI-008: LLM Gateway Cache Hit Ratio

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-AI-008 |
| **Metric Name** | LLM Gateway Cache Hit Ratio |
| **Description** | Percentage of LLM inference requests served from Valkey cache (no Ollama call needed) |
| **Business Meaning** | Higher ratio = lower AI costs and lower latency; target 90%+ during session |
| **Technical Meaning** | `cache_hits / (cache_hits + cache_misses)` on Valkey DB 4 (AI namespace) |
| **Formula** | `ratio = cache_hits / total_requests` (Decimal, 5-min rolling) |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | 5-minute rolling ratio |
| **Source** | Prometheus: `llm_gateway_cache_hit_ratio{engine_id}` |
| **Refresh Frequency** | Real-time (15s scrape) |
| **Retention Policy** | 30 days |
| **Alert Thresholds** | Warning: < 0.80 | Critical: < 0.60 (Ollama load spike risk) |
| **Consumers** | AI Architecture Lead, SRE, Cost Management |
| **Dependencies** | TRD-MTR-INFRA-004 (Valkey memory utilization) |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0; must have ≥ 10 requests per 5-min window |
| **Dashboard** | LLM Gateway > Cache Performance |
| **Business Owner** | VP Engineering |
| **Technical Owner** | LLM Gateway Lead |
| **AI Owner** | LLM Gateway Team |
| **Data Owner** | Platform Engineering |

---

### TRD-MTR-AI-009: AI Cost Per Recommendation (EGP)

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-AI-009 |
| **Metric Name** | AI Cost Per Recommendation |
| **Description** | Average EGP cost of producing one AI recommendation (LLM inference costs) |
| **Business Meaning** | Directly impacts unit economics; must stay ≤ 0.15 EGP for financial viability |
| **Technical Meaning** | Total monthly LLM provider costs / total AI recommendations in month |
| **Formula** | `cost_egp = total_llm_cost_egp / recommendations_generated` (Decimal) |
| **Unit** | EGP (Egyptian Pounds, 4dp Decimal) |
| **Aggregation Method** | Monthly average |
| **Source** | LLM Gateway cost tracking: `llm_gateway_cost_egp_total{provider}` |
| **Refresh Frequency** | Daily (cumulative) |
| **Retention Policy** | 3 years |
| **Alert Thresholds** | Warning: > 0.12 EGP | Critical: > 0.18 EGP |
| **Consumers** | CFO, Cost Management, LLM Gateway Team |
| **Dependencies** | TRD-MTR-AI-008 (cache ratio — affects cost) |
| **Version** | 1.0.0 |
| **Validation Rules** | value > 0; requires ≥ 100 recommendations in month |
| **Dashboard** | AI Cost Management > Cost Per Recommendation |
| **Business Owner** | CFO |
| **Technical Owner** | LLM Gateway Lead |
| **AI Owner** | LLM Gateway Team |
| **Data Owner** | Finance Engineering |

---

### TRD-MTR-AI-010: Arabic Rationale Completeness Score

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-AI-010 |
| **Metric Name** | Arabic Rationale Completeness Score |
| **Description** | Average word count and completeness of Arabic rationale in AI recommendations |
| **Business Meaning** | Regulatory requirement: every recommendation must have a clear Arabic explanation |
| **Technical Meaning** | Average Arabic word count per recommendation; percentage meeting 50-word minimum |
| **Formula** | `score = recommendations_above_50_words / total_recommendations` (Decimal) |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Daily rolling rate |
| **Source** | AI Safety Engine Check 6 metrics |
| **Refresh Frequency** | Real-time |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Warning: < 0.95 | Critical: < 0.90 |
| **Consumers** | Compliance Officer, AI Safety Team |
| **Dependencies** | TRD-MTR-AI-005 (hallucination rate) |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0 |
| **Dashboard** | AI Quality > Arabic Rationale Monitor |
| **Business Owner** | Chief Compliance Officer |
| **Technical Owner** | AI Safety Lead |
| **AI Owner** | Meta Decision Engine Team |
| **Data Owner** | Compliance Engineering |

---

## Section 3 — Learning & Memory Metrics (TRD-MTR-LRN)

---

### TRD-MTR-LRN-001: WisdomEngine Accuracy Delta

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-LRN-001 |
| **Metric Name** | WisdomEngine Accuracy Delta |
| **Description** | Change in overall AI ensemble accuracy before vs after WisdomEngine recalibration |
| **Business Meaning** | Did the monthly recalibration make the AI better or worse? |
| **Technical Meaning** | `delta = accuracy_post_recalibration - accuracy_pre_recalibration` (Decimal) |
| **Formula** | `delta = new_accuracy - old_accuracy` |
| **Unit** | Percentage points (4dp Decimal) |
| **Aggregation Method** | Per recalibration event |
| **Source** | WisdomEngine recalibration audit log in PostgreSQL |
| **Refresh Frequency** | Per recalibration (monthly) |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Warning: delta < 0.00 (regression) | Critical: delta < -0.03 (significant regression) |
| **Consumers** | AI Architecture Council, Chief AI Officer |
| **Dependencies** | TRD-MTR-AI-001 |
| **Version** | 1.0.0 |
| **Validation Rules** | -1.0 ≤ value ≤ 1.0; pre and post values must be from same backtest period |
| **Dashboard** | AI Learning > Recalibration Impact |
| **Business Owner** | Chief AI Officer |
| **Technical Owner** | WisdomEngine Lead |
| **AI Owner** | Learning Engine Team |
| **Data Owner** | Data Engineering |

---

### TRD-MTR-LRN-002: Knowledge Graph Growth Rate

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-LRN-002 |
| **Metric Name** | Knowledge Graph Growth Rate |
| **Description** | Weekly rate of new facts, entities, and relationships added to the Knowledge Operating System |
| **Business Meaning** | Tradeora's AI gets smarter over time through knowledge accumulation |
| **Technical Meaning** | (new_nodes + new_edges) per week in the Qdrant knowledge graph |
| **Formula** | `rate = (nodes_current_week - nodes_prev_week) / nodes_prev_week` (Decimal) |
| **Unit** | Ratio (weekly growth rate) |
| **Aggregation Method** | Weekly snapshot |
| **Source** | Qdrant collection metadata via Knowledge OS API |
| **Refresh Frequency** | Weekly (Monday 06:00 Cairo) |
| **Retention Policy** | 5 years |
| **Alert Thresholds** | Warning: rate < 0.01 (stagnating) | Info: rate > 0.20 (rapid growth, verify quality) |
| **Consumers** | AI Architecture Council, Knowledge OS Team |
| **Dependencies** | TRD-MTR-LRN-003 (memory recall quality) |
| **Version** | 1.0.0 |
| **Validation Rules** | rate > -0.05 (slight shrinkage acceptable during pruning); Qdrant collection must have ≥ 1000 nodes |
| **Dashboard** | AI Knowledge > Knowledge Graph Growth |
| **Business Owner** | Chief AI Officer |
| **Technical Owner** | Knowledge OS Lead |
| **AI Owner** | Knowledge OS Team |
| **Data Owner** | Data Engineering |

---

### TRD-MTR-LRN-003: Enterprise Memory Recall Quality

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-LRN-003 |
| **Metric Name** | Enterprise Memory Recall Quality |
| **Description** | Accuracy of Qdrant vector similarity search for AI knowledge retrieval |
| **Business Meaning** | Measures whether the AI can correctly recall relevant past knowledge when needed |
| **Technical Meaning** | Percentage of top-5 Qdrant retrievals that are relevant to the query (evaluated on test set) |
| **Formula** | `recall_at_5 = relevant_in_top_5 / 5` averaged over test queries (Decimal) |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Weekly evaluation against test set |
| **Source** | Knowledge OS evaluation job (100-query test set) |
| **Refresh Frequency** | Weekly |
| **Retention Policy** | 5 years |
| **Alert Thresholds** | Warning: < 0.85 | Critical: < 0.80 |
| **Consumers** | Knowledge OS Team, AI Architecture Council |
| **Dependencies** | TRD-MTR-LRN-002 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0; test set must have ≥ 100 labeled queries |
| **Dashboard** | AI Knowledge > Memory Recall Quality |
| **Business Owner** | Chief AI Officer |
| **Technical Owner** | Knowledge OS Lead |
| **AI Owner** | Enterprise Memory Team |
| **Data Owner** | Data Engineering |

---

### TRD-MTR-LRN-004: Ground Truth Feedback Coverage

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-LRN-004 |
| **Metric Name** | Ground Truth Feedback Coverage |
| **Description** | Percentage of AI recommendations that have received ground truth outcome data |
| **Business Meaning** | Learning requires ground truth — low coverage means the AI cannot improve |
| **Technical Meaning** | `coverage = recommendations_with_outcome / total_recommendations_eligible` (Decimal) |
| **Formula** | Eligible = recommendations older than 20 trading days (outcome window elapsed) |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Daily |
| **Source** | `ground_truth_feedback` PostgreSQL table |
| **Refresh Frequency** | Daily (nightly ETL job) |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Warning: < 0.90 | Critical: < 0.80 |
| **Consumers** | Learning Engine Team, AI Architecture Council |
| **Dependencies** | TRD-MTR-AI-004 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0; coverage must include all eligible recommendations (not sampled) |
| **Dashboard** | AI Learning > Ground Truth Coverage |
| **Business Owner** | Chief AI Officer |
| **Technical Owner** | Learning Engine Lead |
| **AI Owner** | Learning Engine Team |
| **Data Owner** | Data Engineering |

---

## Section 4 — Signal Quality Metrics (TRD-MTR-SIG)

---

### TRD-MTR-SIG-001: Consensus Signal Strength

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-SIG-001 |
| **Metric Name** | Consensus Signal Strength |
| **Description** | Average weighted confidence of the final consensus recommendation |
| **Business Meaning** | Strong signals (high confidence) are more actionable than weak signals |
| **Technical Meaning** | Weighted average confidence across responding schools, Decimal [0.0000–1.0000] |
| **Formula** | `strength = sum(weight_i * confidence_i) / sum(weight_i)` (Decimal) |
| **Unit** | Score [0.0000 – 1.0000] |
| **Aggregation Method** | Per recommendation; daily average |
| **Source** | AI Consensus Orchestrator output events |
| **Refresh Frequency** | Per recommendation |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Info: mean daily strength < 0.65 (below-average signal quality day) |
| **Consumers** | AI Dashboard, Portfolio Intelligence |
| **Dependencies** | TRD-MTR-AI-001, TRD-MTR-AI-007 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0; must have ≥ 9 responding schools (quorum) |
| **Dashboard** | AI Signals > Signal Strength Distribution |
| **Business Owner** | Chief Investment Officer |
| **Technical Owner** | AI Architecture Lead |
| **AI Owner** | Consensus Orchestrator Team |
| **Data Owner** | Data Engineering |

---

### TRD-MTR-SIG-002: School Quorum Achievement Rate

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-SIG-002 |
| **Metric Name** | School Quorum Achievement Rate |
| **Description** | Percentage of consensus attempts that successfully achieve the 9/12 minimum quorum |
| **Business Meaning** | Availability of AI recommendations — low quorum rate means users get fewer recommendations |
| **Technical Meaning** | `rate = successful_quorum / total_consensus_attempts` (Decimal) |
| **Formula** | Successful = ≥ 9 schools respond within 5s timeout |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Daily |
| **Source** | Prometheus: `ai_consensus_quorum_achieved_total` vs `ai_consensus_attempts_total` |
| **Refresh Frequency** | Real-time |
| **Retention Policy** | 90 days |
| **Alert Thresholds** | Warning: < 0.95 | Critical: < 0.90 |
| **Consumers** | SRE, AI Architecture Lead |
| **Dependencies** | TRD-MTR-AI-003 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0 |
| **Dashboard** | AI Operations > Quorum Health |
| **Business Owner** | VP Engineering |
| **Technical Owner** | SRE Lead |
| **AI Owner** | Consensus Orchestrator Team |
| **Data Owner** | Platform Engineering |

---

### TRD-MTR-SIG-003: Signal-to-Noise Ratio

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-SIG-003 |
| **Metric Name** | Signal-to-Noise Ratio |
| **Description** | Ratio of HIGH_CONFIDENCE recommendations to total recommendations |
| **Business Meaning** | High SNR = the AI mostly produces actionable signals; low SNR = mostly noise |
| **Technical Meaning** | `snr = high_confidence_recs / total_recs` where HIGH_CONFIDENCE = ≥ 10/12 schools agreeing |
| **Formula** | `snr = count(confidence_tier='HIGH') / count(*)` (Decimal, daily) |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Daily |
| **Source** | AI recommendations table |
| **Refresh Frequency** | Daily |
| **Retention Policy** | 5 years |
| **Alert Thresholds** | Info: < 0.40 (low signal day — typically high market volatility) |
| **Consumers** | Chief Investment Officer, AI Dashboard |
| **Dependencies** | TRD-MTR-SIG-001, TRD-MTR-SIG-002 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0; minimum 10 recommendations per day |
| **Dashboard** | AI Signals > Signal Quality |
| **Business Owner** | Chief Investment Officer |
| **Technical Owner** | AI Architecture Lead |
| **AI Owner** | Consensus Orchestrator Team |
| **Data Owner** | Data Engineering |

---

## Section 5 — Portfolio Metrics (TRD-MTR-PORT)

---

### TRD-MTR-PORT-001: Platform Total Assets Under Advisory (AUA)

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-PORT-001 |
| **Metric Name** | Platform Total Assets Under Advisory |
| **Description** | Sum of all portfolio NAV values across all active users |
| **Business Meaning** | Key business scale metric — larger AUA = larger platform influence and revenue potential |
| **Technical Meaning** | Sum of `portfolios.current_nav_egp` for all ACTIVE portfolios (Decimal) |
| **Formula** | `aua = sum(portfolio.nav_egp for all active portfolios)` |
| **Unit** | EGP (Egyptian Pounds, 2dp Decimal) |
| **Aggregation Method** | Daily total |
| **Source** | Portfolio BC daily NAV calculation |
| **Refresh Frequency** | Daily (post-market, 16:00 Cairo) |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Info only (business metric, no operational alert) |
| **Consumers** | CEO, CFO, Business Dashboard |
| **Dependencies** | TRD-MTR-PORT-002 |
| **Version** | 1.0.0 |
| **Validation Rules** | value ≥ 0; cannot decrease by > 15% day-over-day without validation |
| **Dashboard** | Business KPIs > AUA Trend |
| **Business Owner** | CEO |
| **Technical Owner** | Portfolio Engineering Lead |
| **AI Owner** | Portfolio Intelligence Team |
| **Data Owner** | Finance Engineering |

---

### TRD-MTR-PORT-002: Average Portfolio Return vs EGX30TR

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-PORT-002 |
| **Metric Name** | Average Portfolio Return vs Benchmark |
| **Description** | Average alpha generated by all portfolios on Tradeora vs EGX30TR benchmark |
| **Business Meaning** | Proves the platform adds value — are users outperforming the market? |
| **Technical Meaning** | `alpha = avg(portfolio_return_90d) - egx30tr_return_90d` (Decimal) |
| **Formula** | See `calculate_portfolio_alpha_beta()` in ARCHITECTURE_ADDENDUM §2 |
| **Unit** | Percentage points (4dp Decimal) |
| **Aggregation Method** | 90-day rolling average across all portfolios ≥ 30 days old |
| **Source** | Portfolio BC performance calculation + `benchmark_prices` TimescaleDB |
| **Refresh Frequency** | Weekly |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Info: alpha < 0 for 3 consecutive months (platform not outperforming) |
| **Consumers** | CEO, Chief Investment Officer, Business Dashboard |
| **Dependencies** | TRD-MTR-PORT-001, TRD-MTR-AI-001 |
| **Version** | 1.0.0 |
| **Validation Rules** | Requires ≥ 50 portfolios with ≥ 30 days history; excludes paper portfolios |
| **Dashboard** | Business KPIs > Portfolio Alpha |
| **Business Owner** | Chief Investment Officer |
| **Technical Owner** | Portfolio Engineering Lead |
| **AI Owner** | Portfolio Intelligence Team |
| **Data Owner** | Data Engineering |

---

### TRD-MTR-PORT-003: Portfolio Risk-Adjusted Return (Platform Sharpe)

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-PORT-003 |
| **Metric Name** | Platform Average Sharpe Ratio |
| **Description** | Average Sharpe ratio across all portfolios with ≥ 30 days history |
| **Business Meaning** | Risk-adjusted quality of AI advisory guidance |
| **Technical Meaning** | `sharpe = (portfolio_daily_return - risk_free_daily) / std_dev_daily * sqrt(252)` (Decimal) |
| **Formula** | See `calculate_sharpe_ratio()` in BLUEPRINT_BACKTEST_FLOW §12 |
| **Unit** | Ratio (4dp Decimal) |
| **Aggregation Method** | Monthly average across eligible portfolios |
| **Source** | Portfolio BC performance service |
| **Refresh Frequency** | Monthly |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Info: mean Sharpe < 0.5 (poor risk-adjusted performance) |
| **Consumers** | Chief Investment Officer, Business Dashboard |
| **Dependencies** | TRD-MTR-PORT-002 |
| **Version** | 1.0.0 |
| **Validation Rules** | Requires ≥ 30 daily returns; risk-free rate = CBE overnight rate / 365 |
| **Dashboard** | Business KPIs > Risk-Adjusted Performance |
| **Business Owner** | Chief Investment Officer |
| **Technical Owner** | Portfolio Engineering Lead |
| **AI Owner** | Portfolio Intelligence Team |
| **Data Owner** | Data Engineering |

---

## Section 6 — Risk Metrics (TRD-MTR-RISK)

---

### TRD-MTR-RISK-001: Platform VaR Utilization

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-RISK-001 |
| **Metric Name** | Platform Value at Risk Utilization |
| **Description** | Average 95% 1-day VaR across all active portfolios as % of total AUA |
| **Business Meaning** | How much of the platform's total AUA is at risk on any given day |
| **Technical Meaning** | `var_util = mean(portfolio_var_egp / portfolio_nav_egp)` (Decimal) |
| **Formula** | Historical simulation VaR at 95% confidence, 1-day horizon |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Daily average |
| **Source** | Risk Intelligence Engine (SCHOOL-04) |
| **Refresh Frequency** | Daily (post-market) |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Warning: > 0.04 | Critical: > 0.06 (systemic risk) |
| **Consumers** | Risk Team, Chief Investment Officer, Compliance |
| **Dependencies** | TRD-MTR-PORT-001 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 0.20 (sanity check); requires ≥ 20 days historical data |
| **Dashboard** | Risk Management > Platform VaR |
| **Business Owner** | Chief Risk Officer |
| **Technical Owner** | Risk Engineering Lead |
| **AI Owner** | Risk Intelligence Team |
| **Data Owner** | Data Engineering |

---

### TRD-MTR-RISK-002: Concentration Risk Alert Rate

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-RISK-002 |
| **Metric Name** | Concentration Risk Alert Rate |
| **Description** | Percentage of portfolios triggering a concentration risk alert (single security > 40%) |
| **Business Meaning** | Measures how many users hold dangerously concentrated positions |
| **Technical Meaning** | `rate = portfolios_with_concentration_alert / total_active_portfolios` (Decimal) |
| **Formula** | Alert condition: any single ticker weight > 0.40 in portfolio |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Daily |
| **Source** | Portfolio Correlation Analysis nightly job |
| **Refresh Frequency** | Daily |
| **Retention Policy** | 5 years |
| **Alert Thresholds** | Warning: > 0.20 | Critical: > 0.35 |
| **Consumers** | Risk Team, Portfolio Intelligence |
| **Dependencies** | TRD-MTR-RISK-001 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0 |
| **Dashboard** | Risk Management > Concentration Monitor |
| **Business Owner** | Chief Risk Officer |
| **Technical Owner** | Risk Engineering Lead |
| **AI Owner** | Risk Intelligence Team |
| **Data Owner** | Data Engineering |

---

## Section 7 — User Metrics (TRD-MTR-USR)

---

### TRD-MTR-USR-001: Monthly Active Users (MAU)

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-USR-001 |
| **Metric Name** | Monthly Active Users |
| **Description** | Count of unique users with at least one session in the last 30 days |
| **Business Meaning** | Core growth metric — Phase 1 target: 1,000 MAU |
| **Technical Meaning** | `mau = count(distinct user_id WHERE last_active_at >= NOW() - INTERVAL '30 days')` |
| **Formula** | As above |
| **Unit** | Count (integer) |
| **Aggregation Method** | Rolling 30-day count |
| **Source** | User sessions table in Identity BC |
| **Refresh Frequency** | Daily |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Info: < 500 at month 3 (growth concern) |
| **Consumers** | CEO, Growth Team, Business Dashboard |
| **Dependencies** | TRD-MTR-USR-002 |
| **Version** | 1.0.0 |
| **Validation Rules** | value ≥ 0; verified against unique user_id count (no double counting) |
| **Dashboard** | Business KPIs > User Growth |
| **Business Owner** | CEO |
| **Technical Owner** | Identity Engineering Lead |
| **AI Owner** | N/A |
| **Data Owner** | Data Engineering |

---

### TRD-MTR-USR-002: Daily Active Users (DAU)

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-USR-002 |
| **Metric Name** | Daily Active Users |
| **Description** | Count of unique users with at least one session today |
| **Business Meaning** | Engagement metric; DAU/MAU ratio = stickiness |
| **Technical Meaning** | `dau = count(distinct user_id WHERE session_date = TODAY())` |
| **Formula** | As above |
| **Unit** | Count (integer) |
| **Aggregation Method** | Daily |
| **Source** | User sessions table |
| **Refresh Frequency** | Real-time (updated per session) |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Info only |
| **Consumers** | Growth Team, Product Team |
| **Dependencies** | TRD-MTR-USR-001 |
| **Version** | 1.0.0 |
| **Validation Rules** | value ≥ 0 |
| **Dashboard** | Business KPIs > DAU/MAU Stickiness |
| **Business Owner** | CPO |
| **Technical Owner** | Identity Engineering Lead |
| **AI Owner** | N/A |
| **Data Owner** | Data Engineering |

---

### TRD-MTR-USR-003: Subscription Conversion Rate

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-USR-003 |
| **Metric Name** | Subscription Conversion Rate |
| **Description** | Percentage of free-tier users who convert to paid in any 30-day period |
| **Business Meaning** | Revenue growth engine — target: ≥ 5% monthly conversion |
| **Technical Meaning** | `rate = free_users_upgraded / total_free_users_30d_active` (Decimal) |
| **Formula** | As above |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Monthly |
| **Source** | Subscription BC + Billing BC |
| **Refresh Frequency** | Daily (rolling 30-day) |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Warning: < 0.03 | Critical: < 0.01 |
| **Consumers** | CEO, CFO, Growth Team |
| **Dependencies** | TRD-MTR-USR-001, TRD-MTR-BIZ-001 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0; denominator ≥ 50 free users |
| **Dashboard** | Business KPIs > Conversion Funnel |
| **Business Owner** | CEO |
| **Technical Owner** | Billing Engineering Lead |
| **AI Owner** | N/A |
| **Data Owner** | Finance Engineering |

---

### TRD-MTR-USR-004: Monthly Churn Rate

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-USR-004 |
| **Metric Name** | Monthly Churn Rate |
| **Description** | Percentage of paid subscribers who cancel in any given month |
| **Business Meaning** | Revenue health — target: < 3% monthly churn |
| **Technical Meaning** | `churn = cancelled_subscriptions_month / active_paid_subscriptions_start_of_month` (Decimal) |
| **Formula** | As above |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Monthly |
| **Source** | Subscription BC cancellation events |
| **Refresh Frequency** | Daily (rolling 30-day) |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Warning: > 0.05 | Critical: > 0.10 |
| **Consumers** | CEO, CFO, Customer Success |
| **Dependencies** | TRD-MTR-USR-003 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0 |
| **Dashboard** | Business KPIs > Churn Analysis |
| **Business Owner** | CEO |
| **Technical Owner** | Billing Engineering Lead |
| **AI Owner** | N/A |
| **Data Owner** | Finance Engineering |

---

## Section 8 — Business KPIs (TRD-MTR-BIZ)

---

### TRD-MTR-BIZ-001: Monthly Recurring Revenue (MRR)

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-BIZ-001 |
| **Metric Name** | Monthly Recurring Revenue |
| **Description** | Total recurring subscription revenue in EGP per month |
| **Business Meaning** | Primary financial health indicator |
| **Technical Meaning** | `mrr = sum(active_subscriptions.monthly_price_egp)` (Decimal) |
| **Formula** | As above, calculated as of last day of month |
| **Unit** | EGP (2dp Decimal) |
| **Aggregation Method** | Monthly snapshot |
| **Source** | Billing BC subscription records |
| **Refresh Frequency** | Daily |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Info: MRR growth < 5% MoM |
| **Consumers** | CEO, CFO, Board |
| **Dependencies** | TRD-MTR-USR-003, TRD-MTR-USR-004 |
| **Version** | 1.0.0 |
| **Validation Rules** | value ≥ 0; reconciled with payment provider |
| **Dashboard** | Business KPIs > MRR |
| **Business Owner** | CFO |
| **Technical Owner** | Billing Engineering Lead |
| **AI Owner** | N/A |
| **Data Owner** | Finance Engineering |

---

### TRD-MTR-BIZ-002: Average Revenue Per User (ARPU)

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-BIZ-002 |
| **Metric Name** | Average Revenue Per User |
| **Description** | Average monthly revenue per paying user |
| **Business Meaning** | Measures monetization efficiency |
| **Technical Meaning** | `arpu = mrr / paying_user_count` (Decimal, 2dp) |
| **Formula** | As above |
| **Unit** | EGP (2dp Decimal) |
| **Aggregation Method** | Monthly |
| **Source** | Billing BC |
| **Refresh Frequency** | Monthly |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Info: ARPU declining for 3 consecutive months |
| **Consumers** | CFO, Growth Team |
| **Dependencies** | TRD-MTR-BIZ-001, TRD-MTR-USR-003 |
| **Version** | 1.0.0 |
| **Validation Rules** | value > 0; paying_user_count ≥ 10 |
| **Dashboard** | Business KPIs > ARPU |
| **Business Owner** | CFO |
| **Technical Owner** | Billing Engineering Lead |
| **AI Owner** | N/A |
| **Data Owner** | Finance Engineering |

---

### TRD-MTR-BIZ-003: Customer Acquisition Cost (CAC)

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-BIZ-003 |
| **Metric Name** | Customer Acquisition Cost |
| **Description** | Average cost to acquire one paying user |
| **Business Meaning** | Efficiency of growth spend |
| **Technical Meaning** | `cac = total_marketing_spend_egp / new_paying_users` (Decimal) |
| **Formula** | As above (monthly) |
| **Unit** | EGP (2dp Decimal) |
| **Aggregation Method** | Monthly |
| **Source** | Finance system + Billing BC |
| **Refresh Frequency** | Monthly |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Warning: CAC > 12 × ARPU (LTV < CAC) |
| **Consumers** | CFO, Marketing |
| **Dependencies** | TRD-MTR-BIZ-001, TRD-MTR-BIZ-002 |
| **Version** | 1.0.0 |
| **Validation Rules** | value > 0; requires marketing spend tracking |
| **Dashboard** | Business KPIs > Unit Economics |
| **Business Owner** | CFO |
| **Technical Owner** | Finance Engineering Lead |
| **AI Owner** | N/A |
| **Data Owner** | Finance Engineering |

---

## Section 9 — Infrastructure Metrics (TRD-MTR-INFRA)

---

### TRD-MTR-INFRA-001: API Gateway P99 Latency

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-INFRA-001 |
| **Metric Name** | API Gateway P99 Latency |
| **Description** | 99th percentile end-to-end API response time through Kong OSS 3.7 |
| **Business Meaning** | User-perceived application speed |
| **Technical Meaning** | `histogram_quantile(0.99, rate(kong_http_request_duration_ms_bucket[5m]))` |
| **Formula** | As above |
| **Unit** | Milliseconds |
| **Aggregation Method** | 5-minute histogram quantile |
| **Source** | Prometheus: Kong plugin metrics |
| **Refresh Frequency** | Real-time (15s scrape) |
| **Retention Policy** | 30 days |
| **Alert Thresholds** | Warning: > 300ms | Critical: > 500ms |
| **Consumers** | SRE, VP Engineering |
| **Dependencies** | TRD-MTR-INFRA-002 |
| **Version** | 1.0.0 |
| **Validation Rules** | value > 0; must exclude health check endpoints |
| **Dashboard** | Infrastructure > API Performance |
| **Business Owner** | VP Engineering |
| **Technical Owner** | SRE Lead |
| **AI Owner** | N/A |
| **Data Owner** | Platform Engineering |

---

### TRD-MTR-INFRA-002: Service Availability (per BC)

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-INFRA-002 |
| **Metric Name** | Service Availability (per BC) |
| **Description** | Uptime percentage per Bounded Context service (51 services) |
| **Business Meaning** | Platform reliability — SLO target: 99.9% (≤ 8.7 hours downtime/year) |
| **Technical Meaning** | `availability = 1 - (error_rate + timeout_rate)` over 30-day window |
| **Formula** | `availability = successful_requests / total_requests` (Decimal) |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | 30-day rolling per service |
| **Source** | Prometheus: `http_requests_total{status=~"5.."}` |
| **Refresh Frequency** | Real-time |
| **Retention Policy** | 1 year |
| **Alert Thresholds** | Warning: < 0.999 | Critical: < 0.995 |
| **Consumers** | SRE, On-Call, PagerDuty |
| **Dependencies** | TRD-MTR-INFRA-001 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0; minimum 1000 requests per 30-day window |
| **Dashboard** | SLO Dashboard > Service Availability |
| **Business Owner** | VP Engineering |
| **Technical Owner** | SRE Lead |
| **AI Owner** | N/A |
| **Data Owner** | Platform Engineering |

---

### TRD-MTR-INFRA-003: Kafka Consumer Lag

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-INFRA-003 |
| **Metric Name** | Kafka Consumer Lag |
| **Description** | Number of unprocessed messages per consumer group |
| **Business Meaning** | Event processing backlog — high lag means events are not being processed |
| **Technical Meaning** | `lag = latest_offset - committed_offset` per consumer group |
| **Formula** | As above (per topic partition) |
| **Unit** | Message count (integer) |
| **Aggregation Method** | Max across partitions per consumer group |
| **Source** | Prometheus: `kafka_consumer_group_lag` |
| **Refresh Frequency** | Real-time (30s) |
| **Retention Policy** | 30 days |
| **Alert Thresholds** | Warning: > 1000 | Critical: > 5000 |
| **Consumers** | SRE, Platform Engineering |
| **Dependencies** | TRD-MTR-INFRA-002 |
| **Version** | 1.0.0 |
| **Validation Rules** | value ≥ 0 |
| **Dashboard** | Infrastructure > Kafka Health |
| **Business Owner** | VP Engineering |
| **Technical Owner** | Platform Engineering Lead |
| **AI Owner** | N/A |
| **Data Owner** | Platform Engineering |

---

### TRD-MTR-INFRA-004: Valkey Memory Utilization

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-INFRA-004 |
| **Metric Name** | Valkey 8.0+ Memory Utilization |
| **Description** | Percentage of Valkey memory limit used |
| **Business Meaning** | Cache eviction at high utilization causes AI cache misses and AI recommendation delays |
| **Technical Meaning** | `util = used_memory_bytes / maxmemory_bytes` (Decimal) |
| **Formula** | From Valkey 8.0+ `INFO memory` command |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Real-time gauge |
| **Source** | Prometheus: `redis_memory_used_bytes` (Valkey exporter) |
| **Refresh Frequency** | Real-time (15s) |
| **Retention Policy** | 30 days |
| **Alert Thresholds** | Warning: > 0.75 | Critical: > 0.90 |
| **Consumers** | SRE, AI Architecture Lead |
| **Dependencies** | TRD-MTR-AI-008 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0 |
| **Dashboard** | Infrastructure > Valkey Health |
| **Business Owner** | VP Engineering |
| **Technical Owner** | SRE Lead |
| **AI Owner** | N/A |
| **Data Owner** | Platform Engineering |

---

## Section 10 — Security Metrics (TRD-MTR-SEC)

---

### TRD-MTR-SEC-001: FRA Embargo Sync Staleness

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-SEC-001 |
| **Metric Name** | FRA Embargo Sync Staleness |
| **Description** | Minutes since the last successful intraday FRA embargo sync |
| **Business Meaning** | Regulatory risk — stale embargo data could result in recommending embargoed securities |
| **Technical Meaning** | `staleness_minutes = (NOW() - last_successful_sync_timestamp) / 60` |
| **Formula** | As above |
| **Unit** | Minutes |
| **Aggregation Method** | Real-time gauge |
| **Source** | Valkey key: `fra:embargo:sync:last_success` |
| **Refresh Frequency** | Real-time |
| **Retention Policy** | 90 days |
| **Alert Thresholds** | Warning: > 7 minutes | Critical: > 12 minutes |
| **Consumers** | Compliance Officer, SRE, PagerDuty |
| **Dependencies** | TRD-MTR-AI-006 |
| **Version** | 1.0.0 |
| **Validation Rules** | During EGX session hours only; value ≥ 0 |
| **Dashboard** | FRA Compliance > Embargo Sync Health |
| **Business Owner** | Chief Compliance Officer |
| **Technical Owner** | Compliance Engineering Lead |
| **AI Owner** | AI Safety Team |
| **Data Owner** | Compliance Engineering |

---

### TRD-MTR-SEC-002: Failed Authentication Rate

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-SEC-002 |
| **Metric Name** | Failed Authentication Rate |
| **Description** | Rate of failed login attempts per minute across all users |
| **Business Meaning** | Security indicator — spike could indicate brute-force attack or credential stuffing |
| **Technical Meaning** | `rate = failed_auth_events / total_auth_events` (Decimal, 5-min window) |
| **Formula** | As above |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | 5-minute rolling rate |
| **Source** | Keycloak event log + Prometheus |
| **Refresh Frequency** | Real-time |
| **Retention Policy** | 7 years (security audit) |
| **Alert Thresholds** | Warning: > 0.10 | Critical: > 0.25 |
| **Consumers** | Security Team, SRE, PagerDuty |
| **Dependencies** | N/A |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0; minimum 10 auth events per 5-min window |
| **Dashboard** | Security > Authentication Health |
| **Business Owner** | CISO |
| **Technical Owner** | Security Engineering Lead |
| **AI Owner** | N/A |
| **Data Owner** | Security Engineering |

---

### TRD-MTR-SEC-003: WORM Write Success Rate

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-SEC-003 |
| **Metric Name** | WORM Audit Write Success Rate |
| **Description** | Percentage of required WORM audit writes that succeed |
| **Business Meaning** | Regulatory non-negotiable — every AI recommendation MUST be WORM-logged |
| **Technical Meaning** | `rate = worm_writes_success / worm_writes_attempted` (Decimal) |
| **Formula** | As above |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Daily |
| **Source** | Prometheus: `backtest_worm_writes_total{status}` + audit trail write metrics |
| **Refresh Frequency** | Real-time |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Critical: < 1.00 (any failure = PagerDuty P1) |
| **Consumers** | Compliance Officer, SRE, PagerDuty |
| **Dependencies** | TRD-MTR-INFRA-002 |
| **Version** | 1.0.0 |
| **Validation Rules** | Must equal 1.0000 for AI recommendation audit writes |
| **Dashboard** | Compliance > WORM Audit Health |
| **Business Owner** | Chief Compliance Officer |
| **Technical Owner** | Compliance Engineering Lead |
| **AI Owner** | N/A |
| **Data Owner** | Compliance Engineering |

---

## Section 11 — Operational KPIs (TRD-MTR-OPS)

---

### TRD-MTR-OPS-001: Mean Time to Recovery (MTTR)

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-OPS-001 |
| **Metric Name** | Mean Time to Recovery |
| **Description** | Average time to restore service after an incident |
| **Business Meaning** | Operational resilience — target: < 30 minutes for P1/P2 incidents |
| **Technical Meaning** | `mttr = mean(resolution_time - detection_time)` per severity |
| **Formula** | As above |
| **Unit** | Minutes |
| **Aggregation Method** | Rolling 90-day average per severity |
| **Source** | PagerDuty incident data |
| **Refresh Frequency** | Per incident |
| **Retention Policy** | 3 years |
| **Alert Thresholds** | Warning: > 45 min (P1/P2) | Critical: > 60 min |
| **Consumers** | SRE Lead, VP Engineering |
| **Dependencies** | TRD-MTR-INFRA-002 |
| **Version** | 1.0.0 |
| **Validation Rules** | value > 0; requires incident severity tag |
| **Dashboard** | SRE > Reliability Metrics |
| **Business Owner** | VP Engineering |
| **Technical Owner** | SRE Lead |
| **AI Owner** | N/A |
| **Data Owner** | Platform Engineering |

---

### TRD-MTR-OPS-002: Deployment Frequency

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-OPS-002 |
| **Metric Name** | Deployment Frequency |
| **Description** | Number of successful production deployments per week |
| **Business Meaning** | Development velocity; target: ≥ 3 deployments/week (DORA Elite) |
| **Technical Meaning** | Count of successful FluxCD v2 reconciliations triggering new image versions in production |
| **Formula** | `freq = count(successful_deployments in week)` |
| **Unit** | Count per week |
| **Aggregation Method** | Weekly |
| **Source** | FluxCD v2 Prometheus metrics: `gotk_resource_info` |
| **Refresh Frequency** | Weekly |
| **Retention Policy** | 3 years |
| **Alert Thresholds** | Warning: < 2/week | Info: > 10/week (review gate process) |
| **Consumers** | VP Engineering, CTO |
| **Dependencies** | N/A |
| **Version** | 1.0.0 |
| **Validation Rules** | Excludes hotfix/emergency deployments from frequency target |
| **Dashboard** | DevOps > DORA Metrics |
| **Business Owner** | CTO |
| **Technical Owner** | DevOps Lead |
| **AI Owner** | N/A |
| **Data Owner** | Platform Engineering |

---

### TRD-MTR-OPS-003: Change Failure Rate

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-OPS-003 |
| **Metric Name** | Change Failure Rate |
| **Description** | Percentage of deployments that cause a production incident |
| **Business Meaning** | Quality of releases; DORA Elite target: < 5% |
| **Technical Meaning** | `cfr = deployments_causing_incident / total_deployments` (Decimal) |
| **Formula** | As above |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Monthly |
| **Source** | FluxCD deployments + PagerDuty incidents correlated |
| **Refresh Frequency** | Monthly |
| **Retention Policy** | 3 years |
| **Alert Thresholds** | Warning: > 0.10 | Critical: > 0.20 |
| **Consumers** | VP Engineering, CTO |
| **Dependencies** | TRD-MTR-OPS-002 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0; requires 10+ deployments per month |
| **Dashboard** | DevOps > DORA Metrics |
| **Business Owner** | CTO |
| **Technical Owner** | DevOps Lead |
| **AI Owner** | N/A |
| **Data Owner** | Platform Engineering |

---

## Section 12 — Compliance Metrics (TRD-MTR-COMP)

---

### TRD-MTR-COMP-001: FRA Report On-Time Submission Rate

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-COMP-001 |
| **Metric Name** | FRA Report On-Time Submission Rate |
| **Description** | Percentage of mandatory FRA monthly reports submitted by the 5th of following month |
| **Business Meaning** | Regulatory non-negotiable — late submission risks FRA sanctions |
| **Technical Meaning** | `rate = on_time_submissions / total_required_submissions` (Decimal) |
| **Formula** | As above |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Annual (cumulative) |
| **Source** | FRA Reporting BC (`fra_reports` PostgreSQL table) |
| **Refresh Frequency** | Monthly |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Critical: any submission is late (immediate Compliance Officer alert) |
| **Consumers** | Compliance Officer, CEO, Board |
| **Dependencies** | TRD-MTR-SEC-003 |
| **Version** | 1.0.0 |
| **Validation Rules** | Must equal 1.0000 for compliance |
| **Dashboard** | Compliance > FRA Reporting |
| **Business Owner** | Chief Compliance Officer |
| **Technical Owner** | Compliance Engineering Lead |
| **AI Owner** | N/A |
| **Data Owner** | Compliance Engineering |

---

### TRD-MTR-COMP-002: PDPL Erasure SLA Compliance

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-COMP-002 |
| **Metric Name** | PDPL Erasure SLA Compliance Rate |
| **Description** | Percentage of erasure requests completed within the 30-day PDPL deadline |
| **Business Meaning** | Legal obligation under PDPL 2020 Article 10 — non-compliance = regulatory fine |
| **Technical Meaning** | `rate = erasures_within_30d / total_erasure_requests` (Decimal) |
| **Formula** | As above |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Rolling |
| **Source** | SAGA-004 completion records in `saga_instances` table |
| **Refresh Frequency** | Daily |
| **Retention Policy** | 7 years |
| **Alert Thresholds** | Critical: any erasure at day 25 still RUNNING (5 days buffer) |
| **Consumers** | Compliance Officer, Legal Team |
| **Dependencies** | TRD-MTR-COMP-001 |
| **Version** | 1.0.0 |
| **Validation Rules** | Must equal 1.0000 for compliance |
| **Dashboard** | Compliance > PDPL Erasure Monitor |
| **Business Owner** | Chief Compliance Officer |
| **Technical Owner** | Compliance Engineering Lead |
| **AI Owner** | N/A |
| **Data Owner** | Compliance Engineering |

---

## Section 13 — Data Quality Metrics (TRD-MTR-DATA)

---

### TRD-MTR-DATA-001: Market Data Schema Validation Rate

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-DATA-001 |
| **Metric Name** | Market Data Schema Validation Rate |
| **Description** | Percentage of incoming EGX market data events passing Karapace schema validation |
| **Business Meaning** | Bad market data = bad AI signals; schema validation is the first data quality gate |
| **Technical Meaning** | `rate = valid_schema_events / total_events` validated by Karapace 3.x |
| **Formula** | As above |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Real-time rolling rate |
| **Source** | Karapace schema registry validation metrics |
| **Refresh Frequency** | Real-time |
| **Retention Policy** | 90 days |
| **Alert Thresholds** | Warning: < 0.99 | Critical: < 0.95 |
| **Consumers** | Data Engineering, AI Architecture Lead |
| **Dependencies** | TRD-MTR-AI-001 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0; minimum 100 events per hour |
| **Dashboard** | Data Quality > Schema Validation |
| **Business Owner** | Chief Data Officer |
| **Technical Owner** | Data Engineering Lead |
| **AI Owner** | N/A |
| **Data Owner** | Data Engineering |

---

## Section 14 — Developer Productivity Metrics (TRD-MTR-DEV)

---

### TRD-MTR-DEV-001: Test Coverage (Unit + Integration)

| Field | Value |
|-------|-------|
| **Metric ID** | TRD-MTR-DEV-001 |
| **Metric Name** | Test Coverage |
| **Description** | Percentage of production code covered by unit and integration tests |
| **Business Meaning** | Higher coverage = lower defect rate = faster delivery |
| **Technical Meaning** | `coverage = covered_lines / total_lines` (Decimal) from Vitest/Jest + Pytest |
| **Formula** | As above |
| **Unit** | Ratio [0.000 – 1.000] |
| **Aggregation Method** | Per CI build |
| **Source** | GitHub Actions CI coverage report |
| **Refresh Frequency** | Per commit |
| **Retention Policy** | 1 year |
| **Alert Thresholds** | Warning: < 0.80 | Critical: < 0.70 (CI gate enforced) |
| **Consumers** | VP Engineering, All Engineering Teams |
| **Dependencies** | TRD-MTR-OPS-003 |
| **Version** | 1.0.0 |
| **Validation Rules** | 0.0 ≤ value ≤ 1.0; excludes auto-generated files |
| **Dashboard** | DevOps > Code Quality |
| **Business Owner** | VP Engineering |
| **Technical Owner** | Engineering Lead |
| **AI Owner** | N/A |
| **Data Owner** | Platform Engineering |

---

## Section 15 — Catalog Governance

### 15.1 Adding a New Metric
1. Engineer proposes metric with all 21 fields in a PR to the Metrics Catalog
2. Business Owner and Technical Owner approve
3. Data Owner validates source system availability
4. Prometheus metric or event source is implemented
5. Grafana panel created and referenced in Dashboard field
6. Catalog entry versioned and merged

### 15.2 Deprecating a Metric
1. Metric marked `Status: DEPRECATED` with `Deprecation Date` and `Replacement ID`
2. 90-day sunset period (consumers have 90 days to migrate)
3. Prometheus metric removed, Grafana panel archived
4. Catalog entry retained permanently (audit trail)

### 15.3 Metric ID Registry Summary

| ID Range | Domain |
|----------|--------|
| TRD-MTR-AI-001 → 050 | AI Inference & Safety |
| TRD-MTR-LRN-001 → 030 | Learning & Memory |
| TRD-MTR-SIG-001 → 020 | Signal Quality |
| TRD-MTR-PORT-001 → 020 | Portfolio |
| TRD-MTR-RISK-001 → 020 | Risk Management |
| TRD-MTR-USR-001 → 030 | Users & Engagement |
| TRD-MTR-BIZ-001 → 030 | Business KPIs |
| TRD-MTR-INFRA-001 → 050 | Infrastructure & Platform |
| TRD-MTR-SEC-001 → 030 | Security & Compliance |
| TRD-MTR-OPS-001 → 020 | Operational KPIs |
| TRD-MTR-COMP-001 → 020 | Regulatory Compliance |
| TRD-MTR-DATA-001 → 020 | Data Quality |
| TRD-MTR-DEV-001 → 020 | Developer Productivity |

**Total metrics registered in v1.0.0: 38 (foundation set)**
**Total capacity: 400 (ID space reserved)**

---

*Document: ENTERPRISE_METRICS_CATALOG.md*
*Version: 1.0.0 | Status: AUTHORITATIVE*
*Mandated by: Global Enterprise Architecture Board — 2026-07-24*
