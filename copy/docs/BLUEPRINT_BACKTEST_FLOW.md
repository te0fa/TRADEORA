# Tradeora Financial Operating System
## Blueprint: Backtesting & Golden Dataset Evaluation Flow
## Version 1.0.0 | Status: APPROVED | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Resolves     : PRE-007 (Architecture Freeze Board 2026-07-24)              ║
║  Constitution : Article 27 — Backtesting is internal engineering tool only  ║
║  Constitution : Article 17 — Decimal arithmetic mandatory                   ║
║  FRA Rule 40  : Look-ahead bias prohibition (available_from_ts)             ║
║  Owner        : Chief AI Architect                                           ║
║  Supersedes   : N/A — New Document                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

> [!IMPORTANT]
> **CRITICAL REGULATORY CONSTRAINT (Article 27 + FRA):**
> Backtesting results are NEVER displayed to end users under any circumstance.
> Backtest output is ONLY used internally: (a) to recalibrate WisdomEngine school weights,
> (b) to validate new AI school models before promotion, (c) for FRA audit purposes.
> Any product feature that exposes historical performance to users requires FRA pre-approval
> as a financial promotion and is out of scope for Phase 1.

---

## Section 1 — Blueprint Authority & Scope

### 1.1 Purpose
This blueprint specifies the complete end-to-end flow for:
- **Historical backtesting**: Running all Phase 1 AI schools against EGX historical data
- **Golden Dataset Evaluation**: Running the fixed 100-scenario benchmark suite
- **WisdomEngine Recalibration**: Updating school weights based on backtest accuracy
- **Walk-forward validation**: Ensuring no in-sample overfitting (FRA Rule 40)

### 1.2 In-Scope
| Component | Responsibility |
|-----------|---------------|
| BacktestOrchestrator | Coordinates the full backtest pipeline |
| SchoolBacktestRunner | Runs each of the 12 Phase 1 schools in isolation |
| HistoricalDataService | Serves EGX OHLCV data with Rule 40 enforcement |
| GoldenDatasetEvaluator | Evaluates against fixed 100-scenario benchmark |
| WisdomEngine | Consumes backtest results to recalibrate school weights |
| BacktestAuditTrail | Writes immutable WORM audit records |

### 1.3 Out-of-Scope
- Live trading simulation (no paper trading in Phase 1)
- User-facing performance attribution (blocked by Article 27)
- Real-time inference (covered by BLUEPRINT_AI_RECOMMENDATION_FLOW.md)
- Portfolio optimization (covered by SIMULATION_AND_BACKTESTING_FRAMEWORK.md)

### 1.4 Pre-Conditions
- TimescaleDB populated with at least 3 years EGX historical OHLCV (adjusted for splits)
- All 12 Phase 1 AI schools deployed and health-checked
- Ollama CPU cluster warmed and model artifacts verified
- PostgreSQL backtesting schema migrated (backtest_runs, backtest_school_results, backtest_outcomes)
- MinIO WORM bucket `backtest-audit` created with Object Lock COMPLIANCE 7 years

### 1.5 Relationship to Other Documents
- `SIMULATION_AND_BACKTESTING_FRAMEWORK.md` — strategy-level simulation (Monte Carlo)
- `AI_INTELLIGENCE_ENGINE_ARCHITECTURE.md §6` — WisdomEngine calibration specification
- `AI_SAFETY_AND_ETHICS_FRAMEWORK.md` — safety gates that apply during backtest
- `DATA_ARCHITECTURE_AND_LAKEHOUSE.md` — TimescaleDB schema for OHLCV data

---

## Section 2 — Component Inventory

| Component | Technology | Role | Access |
|-----------|------------|------|--------|
| BacktestOrchestrator | Python / BullMQ | Pipeline coordinator | Internal Admin API only |
| HistoricalDataService | Python / TimescaleDB | EGX OHLCV with Rule 40 | Internal only |
| SchoolBacktestRunner | Python / LangGraph | Per-school historical inference | Internal only |
| GoldenDatasetEvaluator | Python | Fixed benchmark evaluation | Internal only |
| WisdomEngine | Python / Decimal | Weight recalibration | Internal only |
| BacktestAuditTrail | Python / MinIO | WORM immutable audit records | Internal only |
| TimescaleDB | TimescaleDB 2.x | Historical price time-series | Internal only |
| PostgreSQL (backtest schema) | PostgreSQL 16 | Backtest run metadata + results | Internal only |
| MinIO WORM (`backtest-audit`) | MinIO Object Lock | Immutable audit trail | Write-once, read-only |
| Prometheus | Prometheus 2.53 | Backtest job metrics | Monitoring only |

---

## Section 3 — PostgreSQL Backtesting Schema

```sql
-- Backtest run header
CREATE TABLE backtest_runs (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    triggered_by      VARCHAR(255) NOT NULL,  -- engineer user ID
    trigger_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    start_date        DATE NOT NULL,           -- backtest period start
    end_date          DATE NOT NULL,           -- backtest period end
    tickers           TEXT[] NOT NULL,         -- EGX tickers included
    outcome_window    INTEGER NOT NULL,        -- days to measure outcome (5/10/20)
    status            VARCHAR(20) NOT NULL DEFAULT 'QUEUED',  -- QUEUED/RUNNING/COMPLETE/FAILED
    completed_at      TIMESTAMPTZ,
    total_predictions INTEGER,
    worm_archive_path VARCHAR(500),            -- MinIO path
    CONSTRAINT chk_outcome_window CHECK (outcome_window IN (5, 10, 20))
);

-- Per-school per-prediction results
CREATE TABLE backtest_school_results (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id            UUID NOT NULL REFERENCES backtest_runs(id),
    school_id         VARCHAR(20) NOT NULL,    -- SCHOOL-01 through SCHOOL-12
    ticker            VARCHAR(20) NOT NULL,
    as_of_date        DATE NOT NULL,           -- date school was evaluated
    as_of_timestamp   TIMESTAMPTZ NOT NULL,    -- Rule 40: data available at this time
    recommendation    VARCHAR(10) NOT NULL,    -- BUY / HOLD / SELL
    confidence        NUMERIC(5,4) NOT NULL,   -- Decimal [0.0000 - 1.0000]
    rationale_hash    VARCHAR(64),             -- SHA-256 of Arabic rationale (not stored raw)
    CONSTRAINT chk_recommendation CHECK (recommendation IN ('BUY', 'HOLD', 'SELL'))
);

-- Outcome measurement (actual EGX return after outcome_window days)
CREATE TABLE backtest_outcomes (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_result_id      UUID NOT NULL REFERENCES backtest_school_results(id),
    run_id                UUID NOT NULL REFERENCES backtest_runs(id),
    actual_return_pct     NUMERIC(10,6) NOT NULL,  -- actual N-day return, Decimal
    direction_correct     BOOLEAN NOT NULL,
    confidence_correct    BOOLEAN NOT NULL,         -- was confidence calibrated (Brier)
    brier_score           NUMERIC(6,4) NOT NULL,    -- [0.0000 - 1.0000]
    outcome_date          DATE NOT NULL
);

-- Monthly accuracy summary per school (feeds WisdomEngine)
CREATE TABLE backtest_school_accuracy (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id            UUID NOT NULL REFERENCES backtest_runs(id),
    school_id         VARCHAR(20) NOT NULL,
    month_year        DATE NOT NULL,           -- first day of month
    total_predictions INTEGER NOT NULL,
    correct_direction INTEGER NOT NULL,
    accuracy          NUMERIC(5,4) NOT NULL,   -- correct_direction / total_predictions (Decimal)
    avg_brier_score   NUMERIC(6,4) NOT NULL,
    sharpe_ratio      NUMERIC(8,4),            -- Decimal, nullable (requires ≥20 predictions)
    calibration_grade VARCHAR(10)              -- EXCELLENT / GOOD / ACCEPTABLE / POOR
);

-- TimescaleDB OHLCV table (adjusted for corporate actions)
-- (defined in DATA_ARCHITECTURE_AND_LAKEHOUSE.md — referenced here)
-- Key Rule 40 field:
-- available_from_ts: the timestamp when this data became publicly available
--   (e.g., closing price available_from_ts = day+1 08:00 Cairo)
--   Backtest MUST use WHERE available_from_ts <= as_of_timestamp

CREATE INDEX idx_backtest_school_results_run ON backtest_school_results(run_id, school_id, ticker, as_of_date);
CREATE INDEX idx_backtest_outcomes_run ON backtest_outcomes(run_id);
```

---

## Section 4 — Rule 40 (Look-Ahead Bias) Enforcement

Rule 40 is the FRA prohibition on look-ahead bias in financial model evaluation.

### 4.1 The Problem
Look-ahead bias occurs when a model "sees" future data during evaluation. Example: using Q4 earnings (announced 2026-02-15) when evaluating a recommendation made on 2026-01-10 would be look-ahead bias.

### 4.2 The Solution: `available_from_ts`
Every data point in TimescaleDB has an `available_from_ts` timestamp — the exact moment that data became publicly available.

```python
# HistoricalDataService — Rule 40 enforced query
async def get_market_data_as_of(
    ticker: str,
    as_of_timestamp: datetime,
    lookback_days: int = 365,
) -> list[OHLCVRecord]:
    """
    Returns ONLY data that was publicly available at as_of_timestamp.
    CRITICAL: available_from_ts filter prevents look-ahead bias (FRA Rule 40).
    """
    query = """
        SELECT
            ticker,
            candle_date,
            open_price,
            high_price,
            low_price,
            close_price_adjusted,  -- split/dividend adjusted
            volume,
            available_from_ts
        FROM egx_ohlcv_adjusted
        WHERE ticker = $1
          AND candle_date >= $2::date - $3
          AND candle_date < $4::date
          AND available_from_ts <= $4   -- ← RULE 40 GATE: no future data
        ORDER BY candle_date ASC
    """
    return await db.fetch(
        query,
        ticker,
        as_of_timestamp.date(),
        lookback_days,
        as_of_timestamp,
    )
```

### 4.3 Data Availability Windows (EGX)
| Data Type | Available From |
|-----------|---------------|
| Intraday OHLCV | Real-time (during session) |
| Daily close price | Next trading day 08:00 Cairo |
| Corporate disclosures | Timestamp of FRA/EGX filing |
| Quarterly earnings | Timestamp of official EGX announcement |
| Analyst ratings | Timestamp of publication |
| Macro data (CPI, rates) | Timestamp of CBE announcement |

---

## Section 5 — Complete Backtest Flow (25 Steps)

```
TRIGGER → ORCHESTRATOR → SCHOOL RUNNERS → OUTCOME MEASUREMENT → RECALIBRATION → WORM
```

### Step 1: Engineer Triggers Backtest
Only `ROLE_PLATFORM_ADMIN` or `ROLE_AI_ARCHITECT` may trigger:
```http
POST /internal/api/v1/backtest/trigger
Authorization: Bearer {service-account-jwt}
X-Internal-Service: backtest-admin
Content-Type: application/json

{
  "startDate": "2023-01-01",
  "endDate": "2025-12-31",
  "tickers": ["COMI.EGX", "ETEL.EGX", "HRHO.EGX", ...],  // or "ALL_EGX30"
  "outcomeWindowDays": 20,
  "triggeredBy": "eng.user.ahmed.hassan"
}
```

### Step 2: BacktestOrchestrator Creates Run Record
```python
run_id = await db.fetchval("""
    INSERT INTO backtest_runs (triggered_by, start_date, end_date, tickers, outcome_window, status)
    VALUES ($1, $2, $3, $4, $5, 'RUNNING')
    RETURNING id
""", triggered_by, start_date, end_date, tickers, outcome_window_days)
```

### Step 3: Enqueue BullMQ Job
```typescript
await backtestQueue.add('backtest-run', { runId }, {
  priority: 10,  // low priority — does not compete with live inference
  attempts: 3,
  backoff: { type: 'exponential', delay: 60_000 },
  removeOnComplete: false,
  removeOnFail: false,
});
```

### Step 4: Generate Date Slices
The orchestrator generates the evaluation grid:
- For each trading date D in [startDate, endDate]:
  - For each ticker T in tickers:
    - Schedule (D, T) evaluation unit

```python
trading_dates = await egx_calendar.get_trading_dates(start_date, end_date)
evaluation_units = [
    EvaluationUnit(date=d, ticker=t, as_of_timestamp=egx_open_time(d))
    for d in trading_dates
    for t in tickers
]
# For 3-year backtest, 12 tickers: ~750 dates × 12 = ~9,000 units
```

### Step 5: Dispatch to 12 Schools in Parallel (per unit)
```python
async def evaluate_unit(unit: EvaluationUnit) -> list[SchoolResult]:
    # Pass as_of_timestamp to enforce Rule 40 in each school
    tasks = [
        run_school(school_id=s, ticker=unit.ticker, as_of_timestamp=unit.as_of_timestamp)
        for s in PHASE1_SCHOOLS  # SCHOOL-01 through SCHOOL-12
    ]
    # 5-second timeout per school (same as live inference)
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return [r for r in results if not isinstance(r, Exception)]
```

### Step 6: Each School Executes Historical Inference
- School receives `as_of_timestamp` parameter
- School calls `HistoricalDataService.get_market_data_as_of(ticker, as_of_timestamp)`
- School constructs prompt using ONLY available_from_ts-gated data
- School calls LLM Gateway with `priority='BATCH'` (lowest cost routing)
- School returns `SchoolSignal(recommendation, confidence: Decimal, rationale_hash)`

### Step 7: Store School Results
```python
for result in school_results:
    await db.execute("""
        INSERT INTO backtest_school_results
        (run_id, school_id, ticker, as_of_date, as_of_timestamp, recommendation, confidence, rationale_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    """, run_id, result.school_id, unit.ticker, unit.date, unit.as_of_timestamp,
        result.recommendation, result.confidence, result.rationale_hash)
```

### Step 8: Compute Weighted Consensus (Historical)
Uses the same `WeightedConsensusAlgorithm` as live inference — same Decimal arithmetic, same 9/12 quorum. This ensures the backtest measures the actual production algorithm, not an approximation.

### Step 9: Wait for Outcome Window
After recording predictions for date D, the system waits until date D + outcome_window_days to measure actual EGX returns. This is handled by a separate BullMQ delayed job.

### Step 10: Measure Actual EGX Return
```python
from decimal import Decimal

async def measure_outcome(school_result_id: UUID, ticker: str, as_of_date: date, outcome_date: date) -> None:
    price_at_pred = await get_close_price_adjusted(ticker, as_of_date)
    price_at_outcome = await get_close_price_adjusted(ticker, outcome_date)

    # All arithmetic: Decimal (Article 17)
    actual_return = (
        (Decimal(str(price_at_outcome)) - Decimal(str(price_at_pred)))
        / Decimal(str(price_at_pred))
    ).quantize(Decimal('0.000001'))

    # Direction correct?
    recommendation = await get_recommendation(school_result_id)
    direction_correct = (
        (recommendation == 'BUY'  and actual_return > Decimal('0'))   or
        (recommendation == 'SELL' and actual_return < Decimal('0'))   or
        (recommendation == 'HOLD' and abs(actual_return) < Decimal('0.02'))
    )

    # Brier score
    confidence = await get_confidence(school_result_id)
    outcome_binary = Decimal('1') if direction_correct else Decimal('0')
    brier_score = (confidence - outcome_binary) ** 2

    await db.execute("""
        INSERT INTO backtest_outcomes
        (school_result_id, run_id, actual_return_pct, direction_correct, brier_score, outcome_date)
        VALUES ($1, $2, $3, $4, $5, $6)
    """, school_result_id, run_id, actual_return, direction_correct, brier_score, outcome_date)
```

### Step 11: Aggregate Monthly Accuracy Per School
```python
async def aggregate_monthly_accuracy(run_id: UUID) -> None:
    await db.execute("""
        INSERT INTO backtest_school_accuracy
        (run_id, school_id, month_year, total_predictions, correct_direction, accuracy, avg_brier_score)
        SELECT
            bsr.run_id,
            bsr.school_id,
            date_trunc('month', bsr.as_of_date)::date AS month_year,
            COUNT(*) AS total_predictions,
            SUM(CASE WHEN bo.direction_correct THEN 1 ELSE 0 END) AS correct_direction,
            -- Decimal precision maintained in NUMERIC(5,4) column
            ROUND(
                SUM(CASE WHEN bo.direction_correct THEN 1.0 ELSE 0.0 END) / COUNT(*)::NUMERIC,
                4
            ) AS accuracy,
            ROUND(AVG(bo.brier_score), 4) AS avg_brier_score
        FROM backtest_school_results bsr
        JOIN backtest_outcomes bo ON bo.school_result_id = bsr.id
        WHERE bsr.run_id = $1
        GROUP BY bsr.run_id, bsr.school_id, date_trunc('month', bsr.as_of_date)
    """, run_id)
```

### Step 12: Compute Sharpe Ratio Per School (Optional, ≥20 predictions)
```python
def compute_sharpe_ratio(daily_returns: list[Decimal], risk_free_daily: Decimal) -> Decimal:
    """Article 17: all Sharpe arithmetic uses Decimal."""
    if len(daily_returns) < 20:
        return None
    n = Decimal(str(len(daily_returns)))
    mean = sum(daily_returns) / n
    variance = sum((r - mean) ** 2 for r in daily_returns) / (n - 1)
    std_dev = variance.sqrt()
    if std_dev == Decimal('0'):
        return Decimal('0')
    return ((mean - risk_free_daily) / std_dev * Decimal('252').sqrt()).quantize(Decimal('0.0001'))
```

### Step 13: Run Golden Dataset Evaluation
After the main backtest, run the fixed 100-scenario benchmark:
```python
async def run_golden_dataset_evaluation(run_id: UUID) -> GoldenDatasetReport:
    golden_scenarios = await load_golden_dataset()  # 100 curated EGX scenarios
    results = []
    for scenario in golden_scenarios:
        school_signals = await run_all_schools_for_scenario(scenario)
        consensus = compute_consensus(school_signals)
        accuracy = consensus.recommendation == scenario.ground_truth
        results.append(GoldenResult(scenario_id=scenario.id, correct=accuracy, confidence=consensus.confidence))

    overall_accuracy = Decimal(str(sum(1 for r in results if r.correct))) / Decimal('100')
    return GoldenDatasetReport(
        run_id=run_id,
        accuracy=overall_accuracy,
        scenarios_correct=sum(1 for r in results if r.correct),
        scenarios_total=100,
        threshold_met=overall_accuracy >= Decimal('0.70'),
    )
```

### Step 14: Detect WisdomEngine Recalibration Trigger
Recalibration is triggered if any of:
- Any school's monthly accuracy drops below 55% for 3 consecutive months
- Overall golden dataset accuracy drops below 70%
- An engineer manually triggers recalibration via admin API

### Step 15: Trigger WisdomEngine Recalibration
```python
async def trigger_wisdom_engine_recalibration(run_id: UUID) -> None:
    accuracy_data = await fetch_monthly_accuracy_by_school(run_id)
    new_weights = {}
    for school_id, monthly_records in accuracy_data.items():
        latest = monthly_records[-1]
        new_weight = calculate_new_weight(
            current_weight=Decimal(str(CURRENT_WEIGHTS[school_id])),
            accuracy=latest.accuracy,        # Decimal from DB
            brier_score=latest.avg_brier_score,  # Decimal from DB
        )
        new_weights[school_id] = new_weight

    # Normalize weights to sum to 1.0 (Decimal arithmetic)
    total = sum(new_weights.values())
    normalized = {k: (v / total).quantize(Decimal('0.0001')) for k, v in new_weights.items()}

    await update_wisdom_engine_weights(normalized)  # → Valkey + PostgreSQL
    await publish_event('ai.WisdomEngine.WeightsRecalibrated.v1', {
        'runId': str(run_id),
        'newWeights': {k: str(v) for k, v in normalized.items()},  # Decimal as string
        'timestamp': datetime.utcnow().isoformat(),
    })
```

### Step 16: Circuit Breaker Check
```python
# If school accuracy < 55% for 3 consecutive months → weight = 0 (exclude school)
for school_id, records in accuracy_data.items():
    last_3 = records[-3:] if len(records) >= 3 else []
    if all(r.accuracy < Decimal('0.55') for r in last_3):
        normalized[school_id] = Decimal('0')  # Circuit breaker open
        await alert_ai_team(f"School {school_id} circuit breaker opened: 3-month accuracy < 55%")
```

### Step 17: Write WORM Audit Record
```python
audit_record = {
    'type': 'BACKTEST_RUN_COMPLETE',
    'runId': str(run_id),
    'triggeredBy': triggered_by,
    'period': f"{start_date}/{end_date}",
    'totalPredictions': total_predictions,
    'overallAccuracy': str(overall_accuracy),  # Decimal as string
    'goldenDatasetAccuracy': str(golden_report.accuracy),
    'weightsRecalibrated': recalibration_triggered,
    'newWeights': {k: str(v) for k, v in normalized.items()} if recalibration_triggered else None,
    'completedAt': datetime.utcnow().isoformat(),
    'sha256': compute_sha256(audit_payload_bytes),
}

worm_path = f"backtest-audit/{run_id}/{datetime.utcnow().date()}/run_complete.json"
await minio.put_object(
    bucket='backtest-audit',
    object_name=worm_path,
    data=json.dumps(audit_record).encode(),
    content_type='application/json',
    # Object Lock: COMPLIANCE mode, 7-year retention
)
await db.execute("UPDATE backtest_runs SET worm_archive_path = $1, status = 'COMPLETE' WHERE id = $2",
    worm_path, run_id)
```

### Step 18: Publish Completion Event
```python
await kafka.publish('ai.BacktestOrchestrator.BacktestCompleted.v1', {
    'runId': str(run_id),
    'period': f"{start_date}/{end_date}",
    'overallAccuracy': str(overall_accuracy),
    'weightsRecalibrated': recalibration_triggered,
    'goldenDatasetPassed': golden_report.threshold_met,
    'wormPath': worm_path,
})
```

### Steps 19-25: Completion & Notification

- **Step 19**: Update `backtest_runs.status = 'COMPLETE'`
- **Step 20**: Prometheus metrics updated (see §9)
- **Step 21**: Grafana dashboard auto-refreshes
- **Step 22**: If recalibration occurred → Slack alert to AI Architecture team
- **Step 23**: If golden dataset accuracy < 70% → PagerDuty P2 alert (action required)
- **Step 24**: If golden dataset accuracy < 60% → PagerDuty P1 alert (suspend AI recommendations until resolved)
- **Step 25**: Backtest report written to MinIO (PDF format, internal only)

---

## Section 6 — Golden Dataset Specification

### 6.1 Definition
The Golden Dataset is a fixed set of **100 curated EGX historical scenarios** with known, verified ground-truth outcomes. It serves as the permanent benchmark against which the AI ensemble is evaluated.

### 6.2 Dataset Composition

| Category | Count | Description |
|----------|-------|-------------|
| Bull trend scenarios | 20 | Clear uptrend with follow-through (verified ≥+10% over 20 days) |
| Bear trend scenarios | 20 | Clear downtrend with follow-through (verified ≥-10% over 20 days) |
| Sideways/ranging | 15 | Low volatility, range-bound (return within ±3%) |
| News-driven events | 15 | Earnings beats/misses, dividend announcements |
| Macro-driven events | 10 | CBE rate decisions, USD/EGP movements |
| Sector rotation events | 10 | EGX sector leadership changes |
| High-volatility events | 10 | Market-wide volatility spikes |

### 6.3 Maintenance
- Golden Dataset is maintained by the AI Architecture team
- New scenarios added quarterly (maximum 10 additions per quarter)
- Retired scenarios must be documented with reason
- Dataset stored in PostgreSQL `golden_dataset_scenarios` table (read-only for all except ROLE_AI_ARCHITECT)

### 6.4 Ground Truth Verification
Ground truth is determined by actual EGX closing prices (adjusted). A scenario's ground truth is:
- **BUY**: 20-day return > +2% (directionally correct for a BUY recommendation)
- **SELL**: 20-day return < -2% (directionally correct for a SELL recommendation)
- **HOLD**: 20-day return within [-2%, +2%]

---

## Section 7 — Performance Targets & SLOs

| Metric | Target | Alert Threshold | Action |
|--------|--------|-----------------|--------|
| Full backtest (3-year, 12 tickers) | < 4 hours | > 6 hours | PagerDuty P3 |
| Golden dataset evaluation | < 30 minutes | > 45 minutes | Alert only |
| Golden dataset accuracy | ≥ 70% | < 70% | PagerDuty P2 |
| Golden dataset accuracy | ≥ 60% | < 60% | PagerDuty P1 + suspend AI |
| School circuit breaker | < 55% accuracy (3 months) | < 55% any month | Alert to AI team |
| WORM write success | 100% | < 100% | Block run completion, retry |

---

## Section 8 — Security & Access Control

```yaml
# Kubernetes RBAC for BacktestOrchestrator
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: ai-backtest
  name: backtest-operator
rules:
- apiGroups: ["batch"]
  resources: ["jobs"]
  verbs: ["create", "get", "watch", "list"]
```

| Role | Permission |
|------|-----------|
| ROLE_PLATFORM_ADMIN | Can trigger backtest, view all results |
| ROLE_AI_ARCHITECT | Can trigger backtest, view all results, modify golden dataset |
| All other roles | No access to backtest APIs |

**All backtest trigger endpoints are on internal network only.** Not routed through Kong API Gateway.

---

## Section 9 — Observability

### Prometheus Metrics
```
backtest_run_duration_seconds{run_id, outcome_window}
backtest_school_accuracy_gauge{school_id, month_year}   # rolling monthly
backtest_golden_dataset_accuracy_gauge                  # after each backtest run
backtest_wisdom_engine_recalibrations_total             # counter
backtest_circuit_breaker_opens_total{school_id}         # counter
backtest_worm_writes_total{status}                      # success/failure
backtest_prediction_count_total{run_id}                 # total predictions
```

### Grafana Dashboard: "AI Backtest Operations"
- **Panel 1**: School accuracy heat map (school × month, color: green ≥70%, amber 55-70%, red <55%)
- **Panel 2**: Golden dataset accuracy trend (line chart, last 12 evaluations)
- **Panel 3**: WisdomEngine weight history (stacked area chart)
- **Panel 4**: Backtest run duration (bar chart)
- **Panel 5**: Circuit breaker status (gauge per school)

---

## Section 10 — Regulatory Treatment

### 10.1 FRA Rule 40 Compliance Summary
Rule 40 compliance is enforced at the database query level via `available_from_ts <= as_of_timestamp`. This constraint is:
- Applied in every `HistoricalDataService` query
- Verified by the BacktestAuditTrail (stores the `as_of_timestamp` used per prediction)
- Testable: the test suite includes a FRA Rule 40 violation detection test that fails if any data with `available_from_ts > as_of_timestamp` is returned

### 10.2 Article 27 — Never Display to Users
Enforcement architecture:
- Backtest APIs have no route in Kong (external) gateway
- All backtest endpoints require internal ServiceAccount JWT (not user JWT)
- Backtest results tables have RLS policies blocking all user-context queries
- No frontend components reference backtest result endpoints

### 10.3 7-Year Audit Retention
All backtest runs are archived to MinIO WORM bucket `backtest-audit` with:
- Object Lock mode: COMPLIANCE (cannot be deleted even by admin)
- Retention period: 7 years from run date
- SHA-256 integrity hash stored alongside each record

---

*Document: BLUEPRINT_BACKTEST_FLOW.md*
*Version: 1.0.0 | Status: APPROVED*
*Resolves: PRE-007 (Architecture Freeze Board 2026-07-24)*
