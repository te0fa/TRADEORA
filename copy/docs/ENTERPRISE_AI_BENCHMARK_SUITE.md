# Tradeora Financial Operating System
## Enterprise AI Benchmark Suite
## Version 1.0.0 | Status: AUTHORITATIVE | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Classification  : ENTERPRISE CONFIDENTIAL                                  ║
║  Owner           : Chief AI Officer + AI Architecture Lead                  ║
║  Mandated By     : Global Enterprise Architecture Board — 2026-07-24        ║
║  References      : AI_CAPABILITY_REGISTRY.md, BLUEPRINT_BACKTEST_FLOW.md   ║
║  Constitutional  : Article 11 (FRA), Article 17 (Decimal), Article 6 (HITL) ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

> **PURPOSE**: This suite defines the continuous quality measurement framework for all
> 26 AI engines in the Tradeora Financial Operating System. Every benchmark produces
> a time-series score that is stored in TimescaleDB and displayed in Grafana.
> A failing benchmark blocks the WisdomEngine recalibration gate.

---

## Section 1 — Benchmark Framework

### 1.1 Benchmark Schema (17 Fields per Benchmark)

| Field | Description |
|-------|-------------|
| **Benchmark ID** | Unique identifier: `TRD-BM-{category}-{seq}` |
| **Benchmark Name** | Human-readable name |
| **Description** | What quality dimension this measures |
| **Target AI Engines** | Which of the 26 engines are evaluated |
| **Dataset** | Source and composition of test data |
| **Evaluation Method** | Algorithm or procedure used to score |
| **Target Threshold** | Score required for PASS at nominal operation |
| **Minimum Threshold** | Score below which AI is SUSPENDED |
| **Baseline Score** | Bootstrapped score at Phase 1 launch |
| **Success Criteria** | Conditions for benchmark PASS |
| **Failure Criteria** | Conditions for benchmark FAIL and action |
| **Monitoring** | How often the benchmark runs |
| **Historical Tracking** | Storage location and retention |
| **Trend Analysis** | Method for computing trend |
| **Consumers** | Who uses the benchmark results |
| **Gate Action** | What happens on failure |
| **Version** | Semantic version of the benchmark definition |

### 1.2 Benchmark Execution Pipeline

```
BullMQ Cron Trigger
        │
        ▼
BenchmarkRunnerService
        │
        ├─► Load test dataset (PostgreSQL / TimescaleDB)
        ├─► Apply Rule 40 (available_from_ts filter — see BLUEPRINT_BACKTEST_FLOW §5)
        ├─► Execute evaluation algorithm
        ├─► Compute score (Decimal arithmetic — Article 17)
        ├─► Compare against thresholds
        ├─► Write result to TimescaleDB (benchmark_results hypertable)
        ├─► Publish: ai.Benchmark.BenchmarkCompleted.v1
        └─► If FAIL: Publish ai.Benchmark.BenchmarkFailed.v1 → PagerDuty + Gate Block
```

### 1.3 TimescaleDB Schema for Benchmark Results

```sql
CREATE TABLE benchmark_results (
    benchmark_id    VARCHAR(30) NOT NULL,   -- TRD-BM-*
    engine_id       VARCHAR(30),            -- SCHOOL-01..26 or NULL for ensemble
    run_at          TIMESTAMPTZ NOT NULL,
    score           NUMERIC(10, 6) NOT NULL, -- Decimal precision
    threshold_passed BOOLEAN NOT NULL,
    min_threshold_passed BOOLEAN NOT NULL,
    dataset_size    INTEGER NOT NULL,
    notes           TEXT,
    PRIMARY KEY (benchmark_id, engine_id, run_at)
);
SELECT create_hypertable('benchmark_results', 'run_at');
-- Retained 7 years (FRA audit)
```

### 1.4 Benchmark Gate Logic
```
WisdomEngine Recalibration Gate check:
  IF any benchmark in {TRD-BM-SIG-001, TRD-BM-PRED-001, TRD-BM-SAFE-001}
     has min_threshold_passed = FALSE in the last 7 days:
     → BLOCK recalibration
     → Alert: ROLE_AI_ARCHITECT + ROLE_COMPLIANCE_OFFICER
     → Status: AI_QUALITY_GATE_BLOCKED
```

---

## Section 2 — Signal Accuracy Benchmarks (TRD-BM-SIG)

---

### TRD-BM-SIG-001: Directional Signal Accuracy

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-SIG-001 |
| **Benchmark Name** | Directional Signal Accuracy |
| **Description** | Measures the percentage of BUY/HOLD/SELL signals where the 20-day realized price direction matches the signal direction |
| **Target AI Engines** | All 12 Phase 1 schools individually + ensemble consensus |
| **Dataset** | 24 months of EGX OHLCV data, 50 securities, all corporate-action adjusted. Available-from-ts gated (Rule 40). Minimum 500 signal/outcome pairs per school |
| **Evaluation Method** | For each signal: BUY=positive 20d return → correct; SELL=negative 20d return → correct; HOLD=abs(return) < 2% → correct. `accuracy = correct / total` |
| **Target Threshold** | 0.620 (62.0%) |
| **Minimum Threshold** | 0.540 (54.0% — above random chance 50%) |
| **Baseline Score** | 0.580 (bootstrapped at launch from backtesting) |
| **Success Criteria** | All 12 schools individually ≥ 0.54; ensemble ≥ 0.62 |
| **Failure Criteria** | Any school < 0.54 OR ensemble < 0.54 → SCHOOL_SUSPENDED |
| **Monitoring** | Monthly (after market close on last trading day of month) |
| **Historical Tracking** | `benchmark_results` TimescaleDB, 7 years |
| **Trend Analysis** | 3-month rolling trend; flag if declining > 2% per month |
| **Consumers** | WisdomEngine (gate), AI Architecture Council, Grafana AI Quality |
| **Gate Action** | Ensemble < 0.54 → block all AI recommendations; individual school < 0.50 for 3 months → school decommissioned |
| **Version** | 1.0.0 |

---

### TRD-BM-SIG-002: Sector-Level Signal Accuracy

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-SIG-002 |
| **Benchmark Name** | Sector-Level Signal Accuracy |
| **Description** | Directional accuracy broken down by EGX sector (Banking, Real Estate, Telecom, Food & Beverage, Materials, Energy) |
| **Target AI Engines** | All 12 Phase 1 schools + ensemble |
| **Dataset** | Same as TRD-BM-SIG-001, stratified by EGX sector |
| **Evaluation Method** | Same as TRD-BM-SIG-001, computed per sector |
| **Target Threshold** | 0.590 per sector |
| **Minimum Threshold** | 0.510 per sector |
| **Baseline Score** | Varies by sector |
| **Success Criteria** | All sectors above minimum threshold |
| **Failure Criteria** | Any sector below 0.51 for 2 consecutive months |
| **Monitoring** | Monthly |
| **Historical Tracking** | `benchmark_results` with sector tag, 7 years |
| **Trend Analysis** | Per-sector trend comparison |
| **Consumers** | AI Architecture Council, Sector Specialist schools |
| **Gate Action** | Advisory: flag weak sector; no gate block (sector-level only) |
| **Version** | 1.0.0 |

---

## Section 3 — Prediction Accuracy Benchmarks (TRD-BM-PRED)

---

### TRD-BM-PRED-001: Price Direction Prediction Accuracy

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-PRED-001 |
| **Benchmark Name** | Price Direction Prediction — Multi-Horizon |
| **Description** | Accuracy of price movement direction predictions at 5, 10, and 20-day horizons |
| **Target AI Engines** | SCHOOL-01 (Fundamental), SCHOOL-02 (Technical), SCHOOL-06 (Macro), SCHOOL-12 (Pattern Recognition) |
| **Dataset** | 24 months EGX OHLCV, 50 securities, 250 rolling-window test cases per horizon |
| **Evaluation Method** | Binary classification: predicted_up vs actual_up at each horizon. `accuracy_h = correct_h / total` (Decimal) |
| **Target Threshold** | 5d: 0.580 / 10d: 0.570 / 20d: 0.560 |
| **Minimum Threshold** | 5d: 0.520 / 10d: 0.510 / 20d: 0.510 |
| **Baseline Score** | 5d: 0.555 / 10d: 0.545 / 20d: 0.535 |
| **Success Criteria** | All three horizons above target threshold |
| **Failure Criteria** | Any horizon below minimum threshold for 2 consecutive months |
| **Monitoring** | Monthly |
| **Historical Tracking** | `benchmark_results` with horizon tag, 7 years |
| **Trend Analysis** | Per-horizon trend; flag if accuracy converging toward 0.50 (coin flip) |
| **Consumers** | WisdomEngine (weight adjustment), AI Architecture Council |
| **Gate Action** | Below minimum: affected school weight reduced to minimum (0.01) pending review |
| **Version** | 1.0.0 |

---

### TRD-BM-PRED-002: Recommendation Success Rate

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-PRED-002 |
| **Benchmark Name** | User-Facing Recommendation Success Rate |
| **Description** | Percentage of AI recommendations that prove directionally correct from the user's perspective (based on ground truth feedback data) |
| **Target AI Engines** | Ensemble consensus (all 12 schools via WisdomEngine) |
| **Dataset** | `ground_truth_feedback` table: all closed recommendation outcomes from previous 90 days |
| **Evaluation Method** | `success_rate = correct_outcomes / total_outcomes_with_feedback` (Decimal) |
| **Target Threshold** | 0.600 (60.0%) |
| **Minimum Threshold** | 0.520 (52.0%) |
| **Baseline Score** | 0.565 |
| **Success Criteria** | Rate ≥ 0.60 for last 3 months |
| **Failure Criteria** | Rate < 0.52 for 2 consecutive months |
| **Monitoring** | Monthly |
| **Historical Tracking** | `benchmark_results`, 7 years |
| **Trend Analysis** | 6-month rolling regression; flag downward trend |
| **Consumers** | CEO, Chief AI Officer, AI Architecture Council |
| **Gate Action** | Below minimum: mandatory AI Architecture Council review within 72 hours |
| **Version** | 1.0.0 |

---

## Section 4 — Confidence Calibration Benchmarks (TRD-BM-CAL)

---

### TRD-BM-CAL-001: Brier Score Calibration

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-CAL-001 |
| **Benchmark Name** | Brier Score Calibration |
| **Description** | Measures how well each school's stated confidence corresponds to actual outcome probability |
| **Target AI Engines** | All 12 Phase 1 schools |
| **Dataset** | Same as TRD-BM-SIG-001 |
| **Evaluation Method** | `brier = mean((confidence - outcome_binary)^2)` — lower is better |
| **Target Threshold** | ≤ 0.180 (better calibration) |
| **Minimum Threshold** | ≤ 0.250 (acceptable; above 0.25 = worse than random for binary) |
| **Baseline Score** | 0.210 |
| **Success Criteria** | All schools ≤ 0.20 |
| **Failure Criteria** | Any school > 0.25 for 3 months → recalibrate confidence scoring |
| **Monitoring** | Monthly |
| **Historical Tracking** | `benchmark_results`, 7 years |
| **Trend Analysis** | Flag if any school's Brier score increasing (worsening calibration) |
| **Consumers** | AI Architecture Council, WisdomEngine (confidence weight adjustment) |
| **Gate Action** | Above threshold: reduce school's confidence weight in WisdomEngine |
| **Version** | 1.0.0 |

---

### TRD-BM-CAL-002: Reliability Diagram Check

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-CAL-002 |
| **Benchmark Name** | Reliability Diagram Check |
| **Description** | Validates that predicted confidence deciles correspond to actual outcome rates |
| **Target AI Engines** | Ensemble consensus |
| **Dataset** | 12 months of recommendations with ground truth, binned into 10 confidence deciles |
| **Evaluation Method** | Chi-squared test on predicted vs actual rates per decile. Pass if p > 0.05 (no significant miscalibration) |
| **Target Threshold** | p-value > 0.05 |
| **Minimum Threshold** | p-value > 0.01 |
| **Baseline Score** | p = 0.12 |
| **Success Criteria** | p > 0.05 consistently |
| **Failure Criteria** | p < 0.01 for 2 consecutive months |
| **Monitoring** | Quarterly |
| **Historical Tracking** | `benchmark_results`, 5 years |
| **Trend Analysis** | Trend p-value over 4 quarters |
| **Consumers** | AI Architecture Council |
| **Gate Action** | Failure: mandatory confidence re-calibration pass |
| **Version** | 1.0.0 |

---

## Section 5 — Safety Benchmarks (TRD-BM-SAFE)

---

### TRD-BM-SAFE-001: Hallucination Rate Benchmark

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-SAFE-001 |
| **Benchmark Name** | Hallucination Rate Benchmark |
| **Description** | Measures the rate at which AI responses cite non-existent data, tickers, or events |
| **Target AI Engines** | Meta Decision Engine, all 12 schools that generate text rationale |
| **Dataset** | 200 adversarial prompts referencing: (a) non-existent EGX tickers, (b) fictional corporate events, (c) invented financial regulations |
| **Evaluation Method** | Each response scored 0 (hallucination detected) or 1 (no hallucination). `hall_rate = hallucinations / 200` |
| **Target Threshold** | ≤ 0.010 (≤ 1.0%) |
| **Minimum Threshold** | ≤ 0.020 (≤ 2.0%) |
| **Baseline Score** | 0.015 |
| **Success Criteria** | Rate ≤ 1.0% on full adversarial dataset |
| **Failure Criteria** | Rate > 2.0% → AI system SUSPENDED pending investigation |
| **Monitoring** | Monthly (runs on static adversarial dataset) |
| **Historical Tracking** | `benchmark_results`, 7 years |
| **Trend Analysis** | Flag if hallucination rate increasing after any model update |
| **Consumers** | AI Safety Team, Chief Compliance Officer, PagerDuty |
| **Gate Action** | Rate > 2.0%: immediate suspension of AI recommendations |
| **Version** | 1.0.0 |

---

### TRD-BM-SAFE-002: Arabic Disclaimer Enforcement Benchmark

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-SAFE-002 |
| **Benchmark Name** | Arabic FRA Disclaimer Enforcement |
| **Description** | Validates that 100% of AI recommendations include the mandatory Arabic FRA disclaimer |
| **Target AI Engines** | Meta Decision Engine (Check 4 — disclaimer gate) |
| **Dataset** | Last 30 days of production AI recommendations |
| **Evaluation Method** | Text search for canonical Arabic disclaimer string in every recommendation |
| **Target Threshold** | 1.0000 (100%) |
| **Minimum Threshold** | 1.0000 (100% — zero tolerance) |
| **Baseline Score** | 1.0000 |
| **Success Criteria** | Every recommendation has disclaimer |
| **Failure Criteria** | Any recommendation missing disclaimer → immediate PagerDuty P1 + WORM audit |
| **Monitoring** | Daily |
| **Historical Tracking** | `benchmark_results`, 7 years |
| **Trend Analysis** | Any deviation from 1.0000 triggers investigation |
| **Consumers** | Compliance Officer, AI Safety Team, FRA Reporting |
| **Gate Action** | Failure: recommendation batch quarantined, manual review required |
| **Version** | 1.0.0 |

---

### TRD-BM-SAFE-003: Safety Gate Block Rate Benchmark

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-SAFE-003 |
| **Benchmark Name** | Safety Gate Block Rate |
| **Description** | Validates that AI Safety Checks 1–7 are blocking requests at expected rates (neither over-blocking nor under-blocking) |
| **Target AI Engines** | AI Safety Engine (all 7 checks) |
| **Dataset** | 30-day rolling production data |
| **Evaluation Method** | Measure block rate per check. Compare to baseline block rates established at launch |
| **Target Threshold** | Block rate per check within ±20% of baseline |
| **Minimum Threshold** | Check 7 (FRA embargo): rate ≥ 0 and sync_staleness ≤ 10 min |
| **Baseline Score** | Check 1: 0.02 / Check 2: 0.01 / Check 3: 0.005 / Check 4: 0.0 / Check 5: 0.01 / Check 6: 0.02 / Check 7: varies |
| **Success Criteria** | All checks within expected bounds |
| **Failure Criteria** | Any check block rate = 0.0 for 30 days (possible gate bypass) OR > 5× baseline |
| **Monitoring** | Weekly |
| **Historical Tracking** | `benchmark_results`, 7 years |
| **Trend Analysis** | Sudden block rate changes may indicate safety gate malfunction |
| **Consumers** | AI Safety Team, Compliance |
| **Gate Action** | Zero block rate on any check: mandatory code audit |
| **Version** | 1.0.0 |

---

## Section 6 — Ground Truth Benchmarks (TRD-BM-GT)

---

### TRD-BM-GT-001: Ground Truth Coverage Benchmark

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-GT-001 |
| **Benchmark Name** | Ground Truth Coverage |
| **Description** | Validates that ≥ 90% of eligible recommendations (20+ trading days old) have outcome data |
| **Target AI Engines** | Learning Engine (data pipeline) |
| **Dataset** | `ground_truth_feedback` table vs `ai_recommendations` table |
| **Evaluation Method** | `coverage = count(feedback) / count(eligible_recs)` (Decimal) |
| **Target Threshold** | 0.950 |
| **Minimum Threshold** | 0.900 |
| **Baseline Score** | 0.000 at launch (bootstrapped over first 20 trading days) |
| **Success Criteria** | Coverage ≥ 95% |
| **Failure Criteria** | Coverage < 90% — Learning Engine cannot function |
| **Monitoring** | Daily |
| **Historical Tracking** | `benchmark_results`, 7 years |
| **Trend Analysis** | Declining coverage indicates ETL pipeline failure |
| **Consumers** | Learning Engine Team, AI Architecture Council |
| **Gate Action** | Below minimum: block WisdomEngine recalibration |
| **Version** | 1.0.0 |

---

### TRD-BM-GT-002: Golden Dataset Integrity Benchmark

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-GT-002 |
| **Benchmark Name** | Golden Dataset Integrity |
| **Description** | Verifies that the 100-scenario golden dataset has not been corrupted or contaminated |
| **Target AI Engines** | Backtesting service (data integrity check) |
| **Dataset** | The fixed 100-scenario golden dataset stored in WORM MinIO |
| **Evaluation Method** | SHA-256 hash of golden dataset vs stored hash in `golden_dataset_hashes` table |
| **Target Threshold** | Hash match = 1.0000 |
| **Minimum Threshold** | Hash match = 1.0000 (zero tolerance) |
| **Baseline Score** | 1.0000 |
| **Success Criteria** | Hashes match exactly |
| **Failure Criteria** | Hash mismatch → dataset contamination → golden dataset must be restored from WORM |
| **Monitoring** | Before every backtest run + weekly standalone check |
| **Historical Tracking** | `benchmark_results`, permanent |
| **Trend Analysis** | Any deviation is an incident |
| **Consumers** | AI Architecture Council, Security Team |
| **Gate Action** | Failure: block all backtesting; restore from WORM backup |
| **Version** | 1.0.0 |

---

## Section 7 — Learning Benchmarks (TRD-BM-LRN)

---

### TRD-BM-LRN-001: Learning Improvement Benchmark

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-LRN-001 |
| **Benchmark Name** | Month-over-Month Learning Improvement |
| **Description** | Measures whether the WisdomEngine recalibration improved overall ensemble accuracy vs the previous month |
| **Target AI Engines** | WisdomEngine + all 12 schools |
| **Dataset** | Backtest results from current month vs identical rolling window one month prior |
| **Evaluation Method** | `delta = accuracy_new_weights - accuracy_old_weights` on same backtest period (Decimal) |
| **Target Threshold** | delta ≥ 0.000 (improvement or neutral) |
| **Minimum Threshold** | delta ≥ -0.020 (regression tolerated if within 2%) |
| **Baseline Score** | 0.000 (starting point) |
| **Success Criteria** | Positive delta for ≥ 4 of last 6 months |
| **Failure Criteria** | delta < -0.020 for 3 consecutive months (persistent regression) |
| **Monitoring** | Monthly |
| **Historical Tracking** | `benchmark_results`, 7 years |
| **Trend Analysis** | Rolling 6-month cumulative improvement; target: +3% per 6 months |
| **Consumers** | Chief AI Officer, AI Architecture Council |
| **Gate Action** | Failure: block next recalibration; revert to previous weights |
| **Version** | 1.0.0 |

---

### TRD-BM-LRN-002: Shadow Mode Accuracy Benchmark

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-LRN-002 |
| **Benchmark Name** | Shadow Mode Accuracy |
| **Description** | Compares experimental model accuracy (shadow mode) against production model accuracy |
| **Target AI Engines** | Any school under shadow mode testing |
| **Dataset** | Same recommendation requests, evaluated by both production and shadow model |
| **Evaluation Method** | `improvement = shadow_accuracy - production_accuracy` (Decimal) |
| **Target Threshold** | improvement ≥ 0.010 (must be 1% better to justify promotion) |
| **Minimum Threshold** | improvement ≥ -0.005 (shadow must not be significantly worse) |
| **Baseline Score** | 0.000 |
| **Success Criteria** | Shadow accuracy ≥ production + 1% over 30-day shadow period |
| **Failure Criteria** | Shadow accuracy < production - 0.5% → shadow model rejected |
| **Monitoring** | During shadow mode period (continuous) |
| **Historical Tracking** | `benchmark_results` with shadow_run tag, 5 years |
| **Trend Analysis** | Compares shadow vs production over full shadow period |
| **Consumers** | AI Architecture Council (promotion decision gate) |
| **Gate Action** | Failure: shadow model rejected; production unchanged |
| **Version** | 1.0.0 |

---

## Section 8 — Inference Performance Benchmarks (TRD-BM-PERF)

---

### TRD-BM-PERF-001: Consensus Latency Benchmark

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-PERF-001 |
| **Benchmark Name** | Consensus Latency P99 |
| **Description** | 99th percentile end-to-end latency from recommendation request to result |
| **Target AI Engines** | Consensus Orchestrator + all 12 schools |
| **Dataset** | Production traffic (100,000-request sample over 30 days) |
| **Evaluation Method** | Prometheus histogram: `histogram_quantile(0.99, ai_consensus_duration_seconds)` |
| **Target Threshold** | ≤ 700ms |
| **Minimum Threshold** | ≤ 900ms (SLO threshold) |
| **Baseline Score** | 650ms |
| **Success Criteria** | P99 ≤ 700ms across all EGX session hours |
| **Failure Criteria** | P99 > 900ms for > 5% of session hours in any week |
| **Monitoring** | Real-time, reported weekly |
| **Historical Tracking** | Prometheus long-term storage (Thanos), 1 year |
| **Trend Analysis** | Weekly P99 trend; flag if increasing > 50ms per week |
| **Consumers** | SRE, AI Architecture Lead |
| **Gate Action** | Critical breach: trigger autoscaling; notify on-call |
| **Version** | 1.0.0 |

---

### TRD-BM-PERF-002: AI Throughput Benchmark

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-PERF-002 |
| **Benchmark Name** | Peak AI Recommendation Throughput |
| **Description** | Maximum sustained AI recommendations per minute at launch-day peak load |
| **Target AI Engines** | All 12 schools + Consensus Orchestrator + LLM Gateway |
| **Dataset** | Load test simulation (Locust): 1,000 concurrent users, 10-minute sustained load |
| **Evaluation Method** | Requests per minute at the point where P99 < 900ms |
| **Target Threshold** | ≥ 500 recommendations/minute |
| **Minimum Threshold** | ≥ 300 recommendations/minute |
| **Baseline Score** | Measured at deployment (target 500) |
| **Success Criteria** | 500+ rec/min with P99 < 700ms |
| **Failure Criteria** | < 300 rec/min before P99 exceeds 900ms |
| **Monitoring** | Quarterly load test |
| **Historical Tracking** | Load test reports in MinIO, 3 years |
| **Trend Analysis** | Compare quarterly — flag if capacity decreasing |
| **Consumers** | SRE, VP Engineering |
| **Gate Action** | Failure: infrastructure scaling investigation before release |
| **Version** | 1.0.0 |

---

### TRD-BM-PERF-003: LLM Gateway Cost Efficiency Benchmark

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-PERF-003 |
| **Benchmark Name** | LLM Cost Per Recommendation |
| **Description** | Average EGP cost per AI recommendation (includes LLM inference cost) |
| **Target AI Engines** | LLM Gateway |
| **Dataset** | Monthly billing data from LLM providers + recommendation count |
| **Evaluation Method** | `cost_egp = total_llm_cost_egp / total_recommendations` (Decimal, 4dp) |
| **Target Threshold** | ≤ 0.1200 EGP |
| **Minimum Threshold** | ≤ 0.1800 EGP |
| **Baseline Score** | 0.1000 EGP (estimated at launch) |
| **Success Criteria** | Cost < 0.12 EGP per recommendation |
| **Failure Criteria** | Cost > 0.18 EGP for 2 consecutive months |
| **Monitoring** | Monthly |
| **Historical Tracking** | `benchmark_results`, 5 years |
| **Trend Analysis** | Monthly cost trend; flag if increasing with no volume change |
| **Consumers** | CFO, LLM Gateway Team |
| **Gate Action** | Failure: review LLM provider strategy and cache hit ratio |
| **Version** | 1.0.0 |

---

## Section 9 — Knowledge & Memory Benchmarks (TRD-BM-KNW)

---

### TRD-BM-KNW-001: Knowledge Accuracy Benchmark

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-KNW-001 |
| **Benchmark Name** | Knowledge Accuracy |
| **Description** | Accuracy of facts stored in the Knowledge Operating System against a verified fact set |
| **Target AI Engines** | Knowledge OS (Qdrant) |
| **Dataset** | 500-fact verified EGX knowledge test set (company data, regulatory rules, sector facts) — manually curated by analyst team |
| **Evaluation Method** | Query each fact via Knowledge OS; evaluate correctness. `accuracy = correct / 500` (Decimal) |
| **Target Threshold** | 0.950 |
| **Minimum Threshold** | 0.900 |
| **Baseline Score** | 0.920 |
| **Success Criteria** | ≥ 95% facts retrieved correctly |
| **Failure Criteria** | < 90% facts correct → knowledge base contamination |
| **Monitoring** | Monthly |
| **Historical Tracking** | `benchmark_results`, 5 years |
| **Trend Analysis** | Flag if accuracy declining (knowledge degradation) |
| **Consumers** | Knowledge OS Team, AI Architecture Council |
| **Gate Action** | Failure: pause knowledge base writes; audit for contaminated facts |
| **Version** | 1.0.0 |

---

### TRD-BM-KNW-002: Memory Recall Quality Benchmark

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-KNW-002 |
| **Benchmark Name** | Enterprise Memory Recall@5 |
| **Description** | Quality of Qdrant vector similarity retrieval — Recall@5 on labeled test set |
| **Target AI Engines** | Enterprise Memory Engine (Qdrant) |
| **Dataset** | 100-query test set with labeled relevant documents (curated by AI team) |
| **Evaluation Method** | For each query: `recall_at_5 = relevant_in_top_5 / total_relevant` averaged over 100 queries |
| **Target Threshold** | 0.900 |
| **Minimum Threshold** | 0.850 |
| **Baseline Score** | 0.875 |
| **Success Criteria** | Recall@5 ≥ 0.90 |
| **Failure Criteria** | Recall@5 < 0.85 for 2 consecutive months |
| **Monitoring** | Weekly |
| **Historical Tracking** | `benchmark_results`, 5 years |
| **Trend Analysis** | Flag declining recall (embedding drift) |
| **Consumers** | Knowledge OS Team |
| **Gate Action** | Failure: re-index Qdrant collection with updated embeddings |
| **Version** | 1.0.0 |

---

## Section 10 — Explainability Benchmarks (TRD-BM-XAI)

---

### TRD-BM-XAI-001: Arabic Rationale Quality Score

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-XAI-001 |
| **Benchmark Name** | Arabic Rationale Quality Score |
| **Description** | Composite score measuring completeness, clarity, and accuracy of Arabic explanations |
| **Target AI Engines** | Meta Decision Engine (rationale generation) |
| **Dataset** | 50 sampled recommendations per month, evaluated by Arabic-speaking financial analyst |
| **Evaluation Method** | Human evaluation rubric (1–5 scale): (1) factual accuracy, (2) Arabic language quality, (3) reasoning completeness, (4) actionability, (5) FRA disclaimer presence. `score = mean(all criteria) / 5` |
| **Target Threshold** | 0.850 (85%) |
| **Minimum Threshold** | 0.750 (75%) |
| **Baseline Score** | 0.800 |
| **Success Criteria** | Score ≥ 0.85 across 50-sample monthly evaluation |
| **Failure Criteria** | Score < 0.75 for 2 consecutive months |
| **Monitoring** | Monthly |
| **Historical Tracking** | `benchmark_results`, 7 years (FRA audit) |
| **Trend Analysis** | Monthly score trend + per-criterion breakdown |
| **Consumers** | Chief Compliance Officer, Chief AI Officer |
| **Gate Action** | Failure: rationale generation model must be reviewed |
| **Version** | 1.0.0 |

---

## Section 11 — Reliability Benchmarks (TRD-BM-REL)

---

### TRD-BM-REL-001: AI Service Availability Benchmark

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-REL-001 |
| **Benchmark Name** | AI Recommendation Service Availability |
| **Description** | Uptime of the AI recommendation service during EGX session hours |
| **Target AI Engines** | Consensus Orchestrator, LLM Gateway, all 12 schools |
| **Dataset** | 30-day rolling uptime measurement |
| **Evaluation Method** | `availability = successful_req / total_req` excluding planned maintenance |
| **Target Threshold** | 0.999 (99.9%) |
| **Minimum Threshold** | 0.995 (99.5%) |
| **Baseline Score** | Target from launch |
| **Success Criteria** | ≥ 99.9% during EGX session hours (09:30–15:30) |
| **Failure Criteria** | < 99.5% for any calendar month |
| **Monitoring** | Real-time |
| **Historical Tracking** | Prometheus/Thanos, 1 year |
| **Trend Analysis** | Monthly SLO report |
| **Consumers** | SRE, VP Engineering, CEO |
| **Gate Action** | Below minimum: incident post-mortem + capacity review |
| **Version** | 1.0.0 |

---

## Section 12 — Decision Consistency Benchmark (TRD-BM-CONS)

*Added per Global Enterprise Architecture Board mandate — 2026-07-24*

---

### TRD-BM-CONS-001: Decision Consistency Under Repeated Evaluation

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-CONS-001 |
| **Benchmark Name** | Decision Consistency — Repeated Evaluation |
| **Description** | Measures whether the AI produces the same decision (BUY/HOLD/SELL) when given identical market conditions on repeated evaluations. Critical for reproducibility and user trust |
| **Target AI Engines** | All 12 Phase 1 schools individually + ensemble consensus |
| **Dataset** | 100 fixed market snapshots (same ticker, same OHLCV, same date context), each submitted 5 times over 24 hours |
| **Evaluation Method** | For each snapshot: check if all 5 evaluations agree on direction. `consistency = consistent_snapshots / 100` (Decimal) |
| **Target Threshold** | 0.980 (98.0% of snapshots give same answer across all 5 evaluations) |
| **Minimum Threshold** | 0.940 (94.0%) |
| **Baseline Score** | 0.960 |
| **Success Criteria** | ≥ 98% consistency across 100 × 5 evaluation matrix |
| **Failure Criteria** | Consistency < 94% → AI is non-deterministic beyond acceptable bounds |
| **Monitoring** | Weekly |
| **Historical Tracking** | `benchmark_results`, 5 years |
| **Trend Analysis** | Flag increasing inconsistency (may indicate LLM temperature drift or model weight update) |
| **Consumers** | AI Architecture Council, Chief AI Officer, Compliance |
| **Gate Action** | Below minimum: check LLM temperature settings (must be 0 for determinism), check model version drift |
| **Version** | 1.0.0 |

---

### TRD-BM-CONS-002: Decision Reproducibility Across Model Versions

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-CONS-002 |
| **Benchmark Name** | Decision Reproducibility Across Versions |
| **Description** | Measures alignment between current production model decisions and decisions from the certified baseline version, on identical inputs |
| **Target AI Engines** | All 12 schools |
| **Dataset** | 100 fixed market snapshots evaluated by baseline version vs current version |
| **Evaluation Method** | `alignment = snapshots_with_same_direction / 100` (Decimal) |
| **Target Threshold** | 0.950 (95.0%) |
| **Minimum Threshold** | 0.900 (90.0%) |
| **Baseline Score** | 1.000 (by definition at launch) |
| **Success Criteria** | ≥ 95% alignment after any model update |
| **Failure Criteria** | < 90% alignment → model update introduces excessive behavior change |
| **Monitoring** | After every model update (shadow mode promotion gate) |
| **Historical Tracking** | `benchmark_results`, 7 years |
| **Trend Analysis** | Cumulative drift from v1.0 baseline |
| **Consumers** | AI Architecture Council (promotion gate) |
| **Gate Action** | Failure: model update rejected; production model unchanged |
| **Version** | 1.0.0 |

---

### TRD-BM-CONS-003: Reasoning Stability Benchmark

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-CONS-003 |
| **Benchmark Name** | Reasoning Stability |
| **Description** | Measures whether the same decision is reached via similar reasoning chains across repeated evaluations (not just same final direction) |
| **Target AI Engines** | Meta Decision Engine (Arabic rationale) |
| **Dataset** | 50 fixed scenarios, each evaluated 3 times over 48 hours |
| **Evaluation Method** | Cosine similarity of TF-IDF vectors of Arabic rationales across 3 evaluations. `stability = mean(cosine_similarity_pairs)` |
| **Target Threshold** | 0.850 |
| **Minimum Threshold** | 0.750 |
| **Baseline Score** | 0.820 |
| **Success Criteria** | Mean cosine similarity ≥ 0.85 |
| **Failure Criteria** | < 0.75 — reasoning is unpredictable |
| **Monitoring** | Monthly |
| **Historical Tracking** | `benchmark_results`, 5 years |
| **Trend Analysis** | Flag declining stability after model updates |
| **Consumers** | AI Architecture Council, Compliance |
| **Gate Action** | Failure: LLM temperature audit + rationale generation review |
| **Version** | 1.0.0 |

---

### TRD-BM-CONS-004: Confidence Stability Benchmark

| Field | Value |
|-------|-------|
| **Benchmark ID** | TRD-BM-CONS-004 |
| **Benchmark Name** | Confidence Stability |
| **Description** | Measures variance in confidence scores for identical market conditions across repeated evaluations |
| **Target AI Engines** | All 12 schools |
| **Dataset** | 100 fixed market snapshots, each evaluated 5 times |
| **Evaluation Method** | For each snapshot: `std_dev = stdev(confidence_1..5)`. `stability = 1 - mean(std_dev_all_snapshots)` |
| **Target Threshold** | 0.950 (confidence variance ≤ 5%) |
| **Minimum Threshold** | 0.900 |
| **Baseline Score** | 0.930 |
| **Success Criteria** | Mean confidence std dev ≤ 5% |
| **Failure Criteria** | Mean std dev > 10% → confidence scoring is unreliable |
| **Monitoring** | Weekly |
| **Historical Tracking** | `benchmark_results`, 5 years |
| **Trend Analysis** | Flag increasing variance |
| **Consumers** | AI Architecture Council, WisdomEngine Team |
| **Gate Action** | Failure: investigate LLM determinism settings |
| **Version** | 1.0.0 |

---

## Section 13 — Benchmark Dashboard & Reporting

### 13.1 Grafana Dashboard: "AI Benchmark Suite"
| Panel | Content |
|-------|---------|
| 1 | Benchmark Health Overview (all benchmarks: PASS/FAIL heatmap) |
| 2 | Signal Accuracy Trend — all 12 schools (12-line chart, 12 months) |
| 3 | Brier Score Calibration — all schools (bar chart) |
| 4 | Hallucination Rate (time series, weekly) |
| 5 | Decision Consistency Matrix (100 scenarios × 5 evaluations) |
| 6 | Learning Improvement Delta (monthly bar chart) |
| 7 | Consensus Latency P99 (time series) |
| 8 | Knowledge Accuracy (monthly gauge) |
| 9 | Gate Status Panel (WisdomEngine gate: OPEN/BLOCKED) |

### 13.2 Monthly AI Quality Report
Auto-generated on 1st of each month by `BenchmarkReportService`:
- All benchmark scores for the month
- Pass/fail status per benchmark
- Trends vs prior 3 months
- Gate actions triggered
- WisdomEngine recalibration authorized/blocked

### 13.3 Benchmark Registry Summary

| ID Range | Category |
|----------|----------|
| TRD-BM-SIG-001..010 | Signal Accuracy |
| TRD-BM-PRED-001..010 | Prediction Accuracy |
| TRD-BM-CAL-001..010 | Confidence Calibration |
| TRD-BM-SAFE-001..010 | Safety |
| TRD-BM-GT-001..010 | Ground Truth |
| TRD-BM-LRN-001..010 | Learning |
| TRD-BM-PERF-001..010 | Performance |
| TRD-BM-KNW-001..010 | Knowledge & Memory |
| TRD-BM-XAI-001..010 | Explainability |
| TRD-BM-REL-001..010 | Reliability |
| TRD-BM-CONS-001..010 | Decision Consistency *(new)* |

**Total benchmarks registered in v1.0.0: 20**

---

*Document: ENTERPRISE_AI_BENCHMARK_SUITE.md*
*Version: 1.0.0 | Status: AUTHORITATIVE*
*Mandated by: Global Enterprise Architecture Board — 2026-07-24*
