# Tradeora Financial Operating System
## Enterprise Evolution KPIs
## Version 1.0.0 | Status: AUTHORITATIVE | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Classification  : ENTERPRISE CONFIDENTIAL                                  ║
║  Owner           : Chief Strategy Officer + Chief AI Officer                ║
║  Mandated By     : Global Enterprise Architecture Board — 2026-07-24        ║
║  Purpose         : Answer "Is Tradeora improving over time?"                ║
║  Constitutional  : Article 8 (data governance), Article 17 (Decimal)       ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

> **PURPOSE**: Evolution KPIs are longitudinal measures that track Tradeora's
> improvement across every dimension over months and years. Unlike operational
> metrics (which measure current state), Evolution KPIs measure **trajectory**.
> They answer the most important strategic question: *Is the platform getting better?*

---

## Section 1 — Evolution KPI Framework

### 1.1 KPI Schema (16 Fields per KPI)

| Field | Description |
|-------|-------------|
| **KPI ID** | Unique identifier: `TRD-EVO-{domain}-{seq}` |
| **KPI Name** | Human-readable name |
| **Description** | What trajectory this KPI measures |
| **Strategic Question** | The "Is Tradeora getting better at X?" question this answers |
| **Formula** | Exact calculation with time dimension (Decimal arithmetic) |
| **Trend Direction** | INCREASING / DECREASING / STABLE (which direction is good) |
| **Measurement Frequency** | How often measured |
| **Comparison Window** | Historical period for comparison (e.g., MoM, QoQ, YoY) |
| **Owner** | Accountable role |
| **Alert Conditions** | When to raise a concern |
| **Target Trajectory** | Target improvement rate per period |
| **Dashboard** | Grafana dashboard and panel |
| **Historical Comparison** | How to visualize trend |
| **Minimum Periods** | Minimum history required for valid KPI |
| **Data Source** | Where the raw data comes from |
| **Version** | Semantic version |

### 1.2 TimescaleDB Schema for Evolution KPI History

```sql
CREATE TABLE evolution_kpi_history (
    kpi_id          VARCHAR(30) NOT NULL,     -- TRD-EVO-*
    measured_at     DATE NOT NULL,             -- measurement date (usually 1st of month)
    period_label    VARCHAR(20) NOT NULL,      -- '2026-07' for monthly
    value           NUMERIC(14, 6) NOT NULL,   -- Decimal precision
    prev_value      NUMERIC(14, 6),            -- previous period value
    delta           NUMERIC(14, 6),            -- value - prev_value
    delta_pct       NUMERIC(8, 4),             -- (delta / prev_value) * 100
    trend_direction VARCHAR(20),               -- IMPROVING / REGRESSING / STABLE
    notes           TEXT,
    PRIMARY KEY (kpi_id, measured_at)
);
SELECT create_hypertable('evolution_kpi_history', 'measured_at');
-- Retained 10 years (long-term strategic data)
```

### 1.3 Trend Calculation Standard

All trend calculations use the **Compound Monthly Growth Rate (CMGR)**:

```python
from decimal import Decimal, ROUND_HALF_UP

def calculate_cmgr(start_value: Decimal, end_value: Decimal, periods: int) -> Decimal:
    """
    CMGR = (end_value / start_value)^(1/periods) - 1
    Returns monthly growth rate as Decimal.
    """
    if start_value <= Decimal('0') or periods == 0:
        return Decimal('0')
    ratio = end_value / start_value
    # Use logarithm for Decimal-compatible power
    import math
    cmgr = Decimal(str(math.exp(math.log(float(ratio)) / periods) - 1))
    return cmgr.quantize(Decimal('0.00001'), ROUND_HALF_UP)
```

---

## Section 2 — AI Evolution KPIs (TRD-EVO-AI)

---

### TRD-EVO-AI-001: AI Evolution Index

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-AI-001 |
| **KPI Name** | AI Evolution Index |
| **Description** | Composite index of AI ensemble accuracy improvement over time. The single number that answers "Is our AI getting smarter?" |
| **Strategic Question** | Is the Tradeora AI ensemble more accurate this month than last month? |
| **Formula** | `index = 0.40 × accuracy_delta + 0.30 × brier_improvement + 0.20 × quorum_delta + 0.10 × latency_improvement` where each component is normalized to [-1, +1]. All arithmetic Decimal |
| **Trend Direction** | INCREASING (positive index = improving) |
| **Measurement Frequency** | Monthly |
| **Comparison Window** | MoM and rolling 6-month |
| **Owner** | Chief AI Officer |
| **Alert Conditions** | Index < -0.05 for 2 consecutive months (AI regressing) |
| **Target Trajectory** | +0.02 to +0.05 per month (2–5% improvement) |
| **Dashboard** | AI Evolution > AI Evolution Index |
| **Historical Comparison** | 12-month bar chart with rolling 3-month trend line |
| **Minimum Periods** | 3 months |
| **Data Source** | `benchmark_results` + `wisdom_engine_weights` + Prometheus |
| **Version** | 1.0.0 |

---

### TRD-EVO-AI-002: School Diversity Evolution

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-AI-002 |
| **KPI Name** | School Diversity Evolution |
| **Description** | Trend of WisdomEngine weight entropy over time — measures whether the ensemble remains diverse and balanced |
| **Strategic Question** | Is our AI maintaining healthy diversity across schools, or is it converging toward a single dominant school? |
| **Formula** | `entropy_delta = H_current - H_prior_3_month_avg` where H = Shannon entropy of school weights |
| **Trend Direction** | INCREASING (higher entropy = more balanced = better) |
| **Measurement Frequency** | Monthly |
| **Comparison Window** | 3-month rolling average |
| **Owner** | AI Architecture Lead |
| **Alert Conditions** | Entropy below 2.0 bits and declining for 3 months |
| **Target Trajectory** | Maintain 2.5–3.2 bits |
| **Dashboard** | AI Evolution > Weight Entropy Trend |
| **Historical Comparison** | 12-month entropy line chart |
| **Minimum Periods** | 4 months |
| **Data Source** | `wisdom_engine_weights` PostgreSQL table |
| **Version** | 1.0.0 |

---

## Section 3 — Knowledge Evolution KPIs (TRD-EVO-KNW)

---

### TRD-EVO-KNW-001: Knowledge Evolution Index

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-KNW-001 |
| **KPI Name** | Knowledge Evolution Index |
| **Description** | Composite measure of Knowledge Operating System growth, quality, and recall improvement |
| **Strategic Question** | Is Tradeora's knowledge base getting richer, more accurate, and more useful? |
| **Formula** | `index = 0.40 × knowledge_growth_rate + 0.40 × recall_quality_delta + 0.20 × fact_accuracy_delta` (Decimal, all components normalized) |
| **Trend Direction** | INCREASING |
| **Measurement Frequency** | Monthly |
| **Comparison Window** | MoM |
| **Owner** | Chief AI Officer |
| **Alert Conditions** | Index < 0 for 3 consecutive months |
| **Target Trajectory** | +0.03/month (3% improvement in knowledge capability) |
| **Dashboard** | AI Evolution > Knowledge Evolution |
| **Historical Comparison** | 12-month composite chart |
| **Minimum Periods** | 3 months |
| **Data Source** | `benchmark_results` (TRD-BM-KNW-001, TRD-BM-KNW-002) + Qdrant collection stats |
| **Version** | 1.0.0 |

---

### TRD-EVO-KNW-002: Knowledge Graph Density Evolution

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-KNW-002 |
| **KPI Name** | Knowledge Graph Density Evolution |
| **Description** | Trend in the ratio of edges to nodes in the Qdrant knowledge graph — measures interconnectedness |
| **Strategic Question** | Is our knowledge base becoming more richly connected over time? |
| **Formula** | `density = edges / nodes`; `delta = density_current - density_3m_avg` |
| **Trend Direction** | INCREASING (denser graph = richer knowledge) |
| **Measurement Frequency** | Monthly |
| **Comparison Window** | 3-month rolling average |
| **Owner** | Knowledge OS Lead |
| **Alert Conditions** | Density decreasing for 4 consecutive months |
| **Target Trajectory** | 5% density increase per quarter |
| **Dashboard** | AI Evolution > Knowledge Graph Density |
| **Historical Comparison** | 12-month density trend |
| **Minimum Periods** | 4 months |
| **Data Source** | Qdrant collection metadata API |
| **Version** | 1.0.0 |

---

## Section 4 — Decision Quality Evolution (TRD-EVO-DEC)

---

### TRD-EVO-DEC-001: Decision Evolution Index

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-DEC-001 |
| **KPI Name** | Decision Evolution Index |
| **Description** | Measures improvement in the quality of AI advisory decisions (accuracy, confidence calibration, consistency, and explainability combined) |
| **Strategic Question** | Are Tradeora's AI recommendations getting better in every quality dimension simultaneously? |
| **Formula** | `index = 0.35 × accuracy_cmgr_3m + 0.25 × calibration_cmgr_3m + 0.25 × consistency_cmgr_3m + 0.15 × explainability_cmgr_3m` (all CMGR, Decimal) |
| **Trend Direction** | INCREASING |
| **Measurement Frequency** | Monthly |
| **Comparison Window** | 3-month CMGR |
| **Owner** | Chief AI Officer |
| **Alert Conditions** | Index < 0 for 2 consecutive months |
| **Target Trajectory** | +0.02/month |
| **Dashboard** | AI Evolution > Decision Quality |
| **Historical Comparison** | Multi-line chart: 4 components + composite index |
| **Minimum Periods** | 3 months |
| **Data Source** | `benchmark_results` (TRD-BM-SIG-001, TRD-BM-CAL-001, TRD-BM-CONS-001, TRD-BM-XAI-001) |
| **Version** | 1.0.0 |

---

### TRD-EVO-DEC-002: Decision Consistency Evolution

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-DEC-002 |
| **KPI Name** | Decision Consistency Evolution |
| **Description** | Trend of the TRD-BM-CONS-001 score over time — are AI decisions becoming more reproducible? |
| **Strategic Question** | Is the AI becoming more deterministic and trustworthy in its decisions? |
| **Formula** | `delta = consistency_current_month - consistency_3m_avg` |
| **Trend Direction** | INCREASING (approaching 1.0 = perfect consistency) |
| **Measurement Frequency** | Monthly |
| **Comparison Window** | MoM + 3-month average |
| **Owner** | AI Architecture Lead |
| **Alert Conditions** | Consistency score declining > 2% MoM |
| **Target Trajectory** | Approach 0.98 asymptote |
| **Dashboard** | AI Evolution > Decision Consistency Trend |
| **Historical Comparison** | 12-month consistency trend |
| **Minimum Periods** | 3 months |
| **Data Source** | `benchmark_results` (TRD-BM-CONS-001) |
| **Version** | 1.0.0 |

---

## Section 5 — Signal Quality Evolution (TRD-EVO-SIG)

---

### TRD-EVO-SIG-001: Signal Quality Evolution Index

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-SIG-001 |
| **KPI Name** | Signal Quality Evolution Index |
| **Description** | Compound trend of signal accuracy, SNR, and quorum achievement over time |
| **Strategic Question** | Are Tradeora's AI trading signals getting stronger and more reliable? |
| **Formula** | `index = 0.50 × accuracy_cmgr_6m + 0.30 × snr_cmgr_6m + 0.20 × quorum_cmgr_6m` (Decimal) |
| **Trend Direction** | INCREASING |
| **Measurement Frequency** | Monthly |
| **Comparison Window** | 6-month CMGR |
| **Owner** | Chief Investment Officer |
| **Alert Conditions** | Index < -0.01 for 3 consecutive months |
| **Target Trajectory** | +0.01/month (modest but consistent) |
| **Dashboard** | AI Evolution > Signal Quality Evolution |
| **Historical Comparison** | 18-month bar chart |
| **Minimum Periods** | 6 months |
| **Data Source** | `benchmark_results` + Prometheus signal metrics |
| **Version** | 1.0.0 |

---

## Section 6 — Portfolio Performance Evolution (TRD-EVO-PORT)

---

### TRD-EVO-PORT-001: Portfolio Performance Evolution

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-PORT-001 |
| **KPI Name** | Platform Portfolio Performance Evolution |
| **Description** | Trend of the average alpha (portfolio return vs EGX30TR) across all platform portfolios |
| **Strategic Question** | Are Tradeora users achieving consistently better returns vs the market benchmark over time? |
| **Formula** | `cmgr_alpha = CMGR(alpha_start_period, alpha_current, n_months)` |
| **Trend Direction** | INCREASING (rising alpha = platform adding more value) |
| **Measurement Frequency** | Monthly |
| **Comparison Window** | 6-month and 12-month |
| **Owner** | Chief Investment Officer |
| **Alert Conditions** | Alpha negative for 3 consecutive months |
| **Target Trajectory** | Positive alpha maintained; target > 0 alpha across all periods |
| **Dashboard** | Portfolio Evolution > Alpha Trend |
| **Historical Comparison** | 18-month alpha time series |
| **Minimum Periods** | 6 months |
| **Data Source** | Portfolio BC performance service + `benchmark_prices` |
| **Version** | 1.0.0 |

---

### TRD-EVO-PORT-002: Sharpe Ratio Evolution

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-PORT-002 |
| **KPI Name** | Platform Sharpe Ratio Evolution |
| **Description** | Trend of the mean Sharpe ratio across platform portfolios |
| **Strategic Question** | Are users achieving better risk-adjusted returns over time? |
| **Formula** | `delta = sharpe_current_quarter - sharpe_prior_quarter` |
| **Trend Direction** | INCREASING (higher Sharpe = better risk-adjusted performance) |
| **Measurement Frequency** | Quarterly |
| **Comparison Window** | QoQ |
| **Owner** | Chief Investment Officer |
| **Alert Conditions** | Sharpe declining for 2 consecutive quarters |
| **Target Trajectory** | Sharpe ≥ 0.80 sustained |
| **Dashboard** | Portfolio Evolution > Sharpe Ratio |
| **Historical Comparison** | 8-quarter Sharpe bar chart |
| **Minimum Periods** | 4 quarters |
| **Data Source** | Portfolio BC performance service |
| **Version** | 1.0.0 |

---

## Section 7 — Risk Management Evolution (TRD-EVO-RISK)

---

### TRD-EVO-RISK-001: Risk Management Evolution Index

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-RISK-001 |
| **KPI Name** | Risk Management Evolution Index |
| **Description** | Composite trend of platform VaR utilization, concentration risk rate, and max drawdown |
| **Strategic Question** | Is Tradeora's risk management guidance helping users avoid excessive risks over time? |
| **Formula** | `index = 0.40 × (1 - var_util_cmgr) + 0.35 × (1 - concentration_cmgr) + 0.25 × (1 - drawdown_cmgr)` (inverted: lower risk = better index) |
| **Trend Direction** | INCREASING (improving = less aggregate risk) |
| **Measurement Frequency** | Monthly |
| **Comparison Window** | 6-month |
| **Owner** | Chief Risk Officer |
| **Alert Conditions** | VaR utilization rising for 3 months |
| **Target Trajectory** | Declining concentration risk; stable VaR utilization |
| **Dashboard** | Risk Evolution > Risk Management Index |
| **Historical Comparison** | 12-month index chart + component breakdown |
| **Minimum Periods** | 6 months |
| **Data Source** | Risk Intelligence Engine + Portfolio BC |
| **Version** | 1.0.0 |

---

## Section 8 — Learning Speed Evolution (TRD-EVO-LRN)

---

### TRD-EVO-LRN-001: Learning Speed Evolution

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-LRN-001 |
| **KPI Name** | Learning Speed Evolution |
| **Description** | Measures how quickly the AI system improves after each recalibration cycle relative to earlier cycles |
| **Strategic Question** | Is Tradeora's AI learning faster and more effectively with each passing month? |
| **Formula** | `learning_speed = accuracy_delta_current_recal / time_since_last_recal_days` (Decimal) |
| **Trend Direction** | INCREASING (learning more per day) |
| **Measurement Frequency** | Per recalibration (monthly) |
| **Comparison Window** | Last 6 recalibrations |
| **Owner** | Chief AI Officer |
| **Alert Conditions** | Learning speed declining for 4 consecutive recalibrations |
| **Target Trajectory** | Maintain positive learning speed |
| **Dashboard** | AI Evolution > Learning Speed |
| **Historical Comparison** | Bar chart: last 12 recalibration speed values |
| **Minimum Periods** | 6 recalibrations |
| **Data Source** | WisdomEngine recalibration audit log |
| **Version** | 1.0.0 |

---

## Section 9 — Infrastructure Evolution (TRD-EVO-INFRA)

---

### TRD-EVO-INFRA-001: Infrastructure Evolution Index

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-INFRA-001 |
| **KPI Name** | Infrastructure Evolution Index |
| **Description** | Composite trend of API latency improvement, availability improvement, and error rate reduction |
| **Strategic Question** | Is Tradeora's platform getting faster, more reliable, and more stable over time? |
| **Formula** | `index = 0.40 × (1 - latency_cmgr_6m) + 0.40 × availability_cmgr_6m + 0.20 × (1 - error_rate_cmgr_6m)` |
| **Trend Direction** | INCREASING |
| **Measurement Frequency** | Monthly |
| **Comparison Window** | 6-month CMGR |
| **Owner** | VP Engineering |
| **Alert Conditions** | API latency P99 increasing for 3 months; availability declining |
| **Target Trajectory** | Latency improving 2% per quarter; availability maintained ≥ 99.9% |
| **Dashboard** | Infrastructure Evolution > Platform Health Index |
| **Historical Comparison** | 12-month index chart |
| **Minimum Periods** | 6 months |
| **Data Source** | Prometheus/Thanos long-term storage |
| **Version** | 1.0.0 |

---

## Section 10 — Developer Productivity Evolution (TRD-EVO-DEV)

---

### TRD-EVO-DEV-001: Developer Productivity Evolution

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-DEV-001 |
| **KPI Name** | Developer Productivity Evolution |
| **Description** | Composite DORA metric trend: deployment frequency, change failure rate, and MTTR |
| **Strategic Question** | Is the engineering team shipping faster and more safely over time? |
| **Formula** | `index = 0.35 × deployment_freq_cmgr + 0.35 × (1 - cfr_cmgr) + 0.30 × (1 - mttr_cmgr)` (Decimal) |
| **Trend Direction** | INCREASING |
| **Measurement Frequency** | Monthly |
| **Comparison Window** | 6-month CMGR |
| **Owner** | VP Engineering |
| **Alert Conditions** | CFR increasing for 2 months; MTTR increasing for 3 months |
| **Target Trajectory** | Progress toward DORA Elite tier benchmarks |
| **Dashboard** | DevOps > DORA Evolution |
| **Historical Comparison** | 12-month DORA metrics + elite tier benchmarks |
| **Minimum Periods** | 4 months |
| **Data Source** | FluxCD deployments + PagerDuty incidents + GitHub Actions |
| **Version** | 1.0.0 |

---

### TRD-EVO-DEV-002: Test Coverage Evolution

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-DEV-002 |
| **KPI Name** | Test Coverage Evolution |
| **Description** | Trend of unit + integration test coverage across all 51 BC services |
| **Strategic Question** | Is the codebase becoming more thoroughly tested over time? |
| **Formula** | `delta = coverage_current_sprint - coverage_3_sprints_ago` |
| **Trend Direction** | INCREASING (approaching 90%+ coverage) |
| **Measurement Frequency** | Per sprint (2 weeks) |
| **Comparison Window** | 3-sprint rolling |
| **Owner** | VP Engineering |
| **Alert Conditions** | Coverage decreasing for 3 consecutive sprints |
| **Target Trajectory** | +2% per sprint until 90% achieved; then maintain |
| **Dashboard** | DevOps > Test Coverage Trend |
| **Historical Comparison** | Sprint-by-sprint coverage chart |
| **Minimum Periods** | 6 sprints |
| **Data Source** | GitHub Actions CI coverage reports |
| **Version** | 1.0.0 |

---

## Section 11 — User Satisfaction Evolution (TRD-EVO-UX)

---

### TRD-EVO-UX-001: User Satisfaction Evolution

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-UX-001 |
| **KPI Name** | User Satisfaction Evolution |
| **Description** | Trend of Net Promoter Score (NPS) and in-app satisfaction ratings |
| **Strategic Question** | Are Tradeora users increasingly happy with the platform? |
| **Formula** | `nps = promoters_pct - detractors_pct`; `delta = nps_current_quarter - nps_prev_quarter` |
| **Trend Direction** | INCREASING |
| **Measurement Frequency** | Quarterly (NPS survey) |
| **Comparison Window** | QoQ |
| **Owner** | CPO |
| **Alert Conditions** | NPS < 30 or declining for 2 consecutive quarters |
| **Target Trajectory** | NPS ≥ 50 by end of Year 1 |
| **Dashboard** | User Evolution > NPS Trend |
| **Historical Comparison** | 8-quarter NPS chart |
| **Minimum Periods** | 2 quarters |
| **Data Source** | In-app NPS survey (minimum 100 responses) |
| **Version** | 1.0.0 |

---

### TRD-EVO-UX-002: User Engagement Evolution (DAU/MAU Stickiness)

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-UX-002 |
| **KPI Name** | User Engagement Evolution (Stickiness) |
| **Description** | Trend of DAU/MAU ratio — measures how often active users return daily |
| **Strategic Question** | Is Tradeora becoming a daily habit for its users? |
| **Formula** | `stickiness = DAU / MAU`; `cmgr = CMGR(stickiness_launch, stickiness_current, months)` |
| **Trend Direction** | INCREASING (approaching 0.40+ = strong daily habit) |
| **Measurement Frequency** | Monthly |
| **Comparison Window** | 6-month CMGR |
| **Owner** | CPO |
| **Alert Conditions** | Stickiness below 0.15 after 6 months |
| **Target Trajectory** | 0.10 at launch → 0.30 at 12 months → 0.40 at 24 months |
| **Dashboard** | User Evolution > Engagement Stickiness |
| **Historical Comparison** | 18-month stickiness trend |
| **Minimum Periods** | 3 months |
| **Data Source** | Identity BC session analytics |
| **Version** | 1.0.0 |

---

## Section 12 — Business Growth Evolution (TRD-EVO-BIZ)

---

### TRD-EVO-BIZ-001: Business Growth Index

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-BIZ-001 |
| **KPI Name** | Business Growth Index |
| **Description** | Composite measure of MRR growth, MAU growth, AUA growth, and AUA per user |
| **Strategic Question** | Is Tradeora growing revenue, users, and asset value consistently? |
| **Formula** | `index = 0.35 × mrr_cmgr_6m + 0.25 × mau_cmgr_6m + 0.25 × aua_cmgr_6m + 0.15 × arpu_cmgr_6m` (Decimal) |
| **Trend Direction** | INCREASING |
| **Measurement Frequency** | Monthly |
| **Comparison Window** | 6-month CMGR |
| **Owner** | CEO |
| **Alert Conditions** | Index < 0.02 for 3 consecutive months (growth stalling) |
| **Target Trajectory** | +5% MRR CMGR minimum |
| **Dashboard** | Business Evolution > Growth Index |
| **Historical Comparison** | 18-month growth chart |
| **Minimum Periods** | 6 months |
| **Data Source** | Billing BC + Identity BC + Portfolio BC |
| **Version** | 1.0.0 |

---

## Section 13 — Architecture Health Evolution (TRD-EVO-ARCH)

---

### TRD-EVO-ARCH-001: Architecture Health Index

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-ARCH-001 |
| **KPI Name** | Architecture Health Index |
| **Description** | Composite measure of technical debt trend, test coverage trend, ADR compliance, and inter-BC coupling |
| **Strategic Question** | Is the Tradeora architecture staying healthy and maintainable as it grows? |
| **Formula** | `index = 0.30 × (1 - tech_debt_cmgr) + 0.30 × coverage_cmgr + 0.25 × adr_compliance + 0.15 × (1 - coupling_score)` (Decimal) |
| **Trend Direction** | INCREASING (positive = healthy architecture) |
| **Measurement Frequency** | Quarterly |
| **Comparison Window** | QoQ |
| **Owner** | Chief Platform Architect |
| **Alert Conditions** | Index declining for 2 consecutive quarters (architectural debt accumulating) |
| **Target Trajectory** | Index ≥ 0.80 maintained |
| **Dashboard** | Architecture Evolution > Health Index |
| **Historical Comparison** | 8-quarter health trend |
| **Minimum Periods** | 3 quarters |
| **Data Source** | SonarQube (tech debt) + GitHub Actions (coverage) + ARCHITECTURE_DECISION_RECORDS.md |
| **Version** | 1.0.0 |

---

### TRD-EVO-ARCH-002: Technical Debt Trend

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-ARCH-002 |
| **KPI Name** | Technical Debt Trend |
| **Description** | Trend of accumulated technical debt (hours equivalent from SonarQube) across all 51 BC codebases |
| **Strategic Question** | Is technical debt accumulating faster than it is being paid down? |
| **Formula** | `debt_ratio = tech_debt_hours / total_code_size_kloc`; `delta = debt_ratio_current - debt_ratio_3m_avg` |
| **Trend Direction** | DECREASING (lower debt ratio = healthier) |
| **Measurement Frequency** | Per sprint (2 weeks) |
| **Comparison Window** | 3-month rolling |
| **Owner** | Chief Platform Architect |
| **Alert Conditions** | Debt ratio increasing for 4 consecutive sprints |
| **Target Trajectory** | Debt ratio ≤ 5% of total estimated codebase hours |
| **Dashboard** | Architecture Evolution > Technical Debt |
| **Historical Comparison** | Sprint-by-sprint debt ratio chart |
| **Minimum Periods** | 8 sprints |
| **Data Source** | SonarQube project analysis + TECHNICAL_DEBT_GOVERNANCE.md |
| **Version** | 1.0.0 |

---

## Section 14 — Architecture Stability Index (TRD-EVO-STAB)

*Added per Global Enterprise Architecture Board mandate — 2026-07-24*

---

### TRD-EVO-STAB-001: Architecture Stability Index

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-STAB-001 |
| **KPI Name** | Architecture Stability Index |
| **Description** | Measures how stable the frozen architecture remains during implementation — low modifications, minimal drift, controlled evolution |
| **Strategic Question** | Is the implementation team building what was designed, or is the architecture drifting? |
| **Formula** | `stability = 1 - (arch_modifications / total_components) × (1 + drift_severity_score)` where: `arch_modifications` = ECRs approved in the period; `drift_severity_score` = severity-weighted drift events (Decimal) |
| **Trend Direction** | STABLE (should stay close to 1.0) |
| **Measurement Frequency** | Monthly |
| **Comparison Window** | Rolling since Architecture Freeze v1.2 |
| **Owner** | Chief Platform Architect |
| **Alert Conditions** | Index < 0.90 → architecture is drifting; Index < 0.80 → architectural crisis |
| **Target Trajectory** | Maintain ≥ 0.95 throughout Phase 8 implementation |
| **Dashboard** | Architecture Evolution > Stability Index |
| **Historical Comparison** | Monthly index since Freeze v1.2 |
| **Minimum Periods** | 1 month post-freeze |
| **Data Source** | `ARCHITECTURE_CHANGE_LOG.md` (ECR count) + JIRA/Confluence architecture drift tracking |
| **Version** | 1.0.0 |

---

### TRD-EVO-STAB-002: Architecture Modification Rate

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-STAB-002 |
| **KPI Name** | Architecture Modification Rate |
| **Description** | Rate of Enterprise Change Requests (ECRs) approved per month — measures how much the frozen architecture is being changed |
| **Strategic Question** | Are changes to the frozen architecture controlled and infrequent? |
| **Formula** | `rate = approved_ecrs_in_month / total_frozen_components` (Decimal); target: rate < 0.02 (< 2% of components modified per month) |
| **Trend Direction** | STABLE or DECREASING (fewer changes is better once implementation begins) |
| **Measurement Frequency** | Monthly |
| **Comparison Window** | MoM |
| **Owner** | Chief Platform Architect |
| **Alert Conditions** | > 3 ECRs in any single month → Architecture Council emergency review |
| **Target Trajectory** | 0–2 ECRs per month throughout Phase 8 |
| **Dashboard** | Architecture Evolution > ECR Rate |
| **Historical Comparison** | Monthly ECR count bar chart |
| **Minimum Periods** | 1 month |
| **Data Source** | ARCHITECTURE_CHANGE_LOG.md ECR entries |
| **Version** | 1.0.0 |

---

### TRD-EVO-STAB-003: Architecture Drift Score

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-STAB-003 |
| **KPI Name** | Architecture Drift Score |
| **Description** | Measures the gap between the documented frozen architecture and the actual implemented architecture |
| **Strategic Question** | Is what the team is building consistent with what the Architecture Board designed? |
| **Formula** | `drift = (implemented_deviations × severity_weight) / total_documented_decisions` where severity_weight: LOW=1, MEDIUM=3, HIGH=10 (Decimal) |
| **Trend Direction** | STABLE near 0 (minimal drift) |
| **Measurement Frequency** | Quarterly architecture review |
| **Comparison Window** | Since Architecture Freeze v1.2 |
| **Owner** | Chief Platform Architect |
| **Alert Conditions** | Drift score > 0.05 (5% of decisions deviated); any HIGH severity deviation → immediate escalation |
| **Target Trajectory** | Drift < 0.02 throughout Phase 8 |
| **Dashboard** | Architecture Evolution > Architecture Drift |
| **Historical Comparison** | Quarterly drift scorecard |
| **Minimum Periods** | 1 quarter |
| **Data Source** | Quarterly architecture compliance audit (conducted by Architecture Council) |
| **Version** | 1.0.0 |

---

### TRD-EVO-STAB-004: Long-Term Maintainability Index

| Field | Value |
|-------|-------|
| **KPI ID** | TRD-EVO-STAB-004 |
| **KPI Name** | Long-Term Maintainability Index |
| **Description** | Projects the maintainability of the architecture 24 months from now based on current trends |
| **Strategic Question** | Will Tradeora be easy to maintain and evolve 2 years from now? |
| **Formula** | `lti = 0.25 × coverage_proj + 0.25 × (1 - debt_proj) + 0.25 × (1 - coupling_proj) + 0.25 × doc_completeness` where `_proj` = projected value at 24 months using current CMGR |
| **Trend Direction** | INCREASING (projected future maintainability improving) |
| **Measurement Frequency** | Quarterly |
| **Comparison Window** | 24-month projection vs last quarter's projection |
| **Owner** | Chief Platform Architect |
| **Alert Conditions** | Projected LTI < 0.70 at 24 months → urgent architecture debt reduction needed |
| **Target Trajectory** | LTI ≥ 0.80 at all 24-month projections |
| **Dashboard** | Architecture Evolution > Long-Term Maintainability |
| **Historical Comparison** | Quarterly LTI projections waterfall |
| **Minimum Periods** | 2 quarters |
| **Data Source** | SonarQube + coverage + ARCHITECTURE_DECISION_RECORDS.md + doc completeness |
| **Version** | 1.0.0 |

---

## Section 15 — Evolution KPI Dashboard Architecture

### 15.1 Grafana Dashboard: "Tradeora Evolution Observatory"

| Panel Row | Content |
|-----------|---------|
| **Row 1: AI Evolution** | AI Evolution Index (TRD-EVO-AI-001), School Diversity, Decision Consistency Evolution |
| **Row 2: Knowledge & Learning** | Knowledge Evolution Index, Learning Speed, Ground Truth Coverage |
| **Row 3: Portfolio & Risk** | Portfolio Alpha Trend, Sharpe Evolution, Risk Management Index |
| **Row 4: Business** | Business Growth Index, MAU Growth, MRR Trend, Churn Trend |
| **Row 5: Architecture Stability** | Stability Index (gauge), ECR Rate, Drift Score, LTI Projection |
| **Row 6: Dev Productivity** | DORA Evolution, Test Coverage Trend, Technical Debt Trend |

### 15.2 Monthly Evolution Report
Auto-generated on 1st of each month:
- All 20 KPIs with current value, previous value, delta, and trend status
- Traffic-light status: IMPROVING (green), STABLE (amber), REGRESSING (red)
- Key insights: top 3 improvements, top 3 concerns
- Distributed to: CEO, CTO, CPO, Chief AI Officer, Chief Risk Officer

### 15.3 Annual Architecture Evolution Review
Conducted by Architecture Council each January:
- Full 12-month review of all Evolution KPIs
- Architecture Health report
- Decision on any ECRs for the coming year
- Updated Future Evolution Backlog

---

## Section 16 — KPI Registry Summary

| ID Range | Domain | Count |
|----------|--------|-------|
| TRD-EVO-AI-001..005 | AI Evolution | 2 |
| TRD-EVO-KNW-001..005 | Knowledge Evolution | 2 |
| TRD-EVO-DEC-001..005 | Decision Quality Evolution | 2 |
| TRD-EVO-SIG-001..005 | Signal Quality Evolution | 1 |
| TRD-EVO-PORT-001..005 | Portfolio Performance Evolution | 2 |
| TRD-EVO-RISK-001..005 | Risk Management Evolution | 1 |
| TRD-EVO-LRN-001..005 | Learning Speed Evolution | 1 |
| TRD-EVO-INFRA-001..005 | Infrastructure Evolution | 1 |
| TRD-EVO-DEV-001..005 | Developer Productivity | 2 |
| TRD-EVO-UX-001..005 | User Satisfaction Evolution | 2 |
| TRD-EVO-BIZ-001..005 | Business Growth | 1 |
| TRD-EVO-ARCH-001..005 | Architecture Health | 2 |
| TRD-EVO-STAB-001..005 | Architecture Stability *(new)* | 4 |

**Total Evolution KPIs registered in v1.0.0: 23**

---

*Document: ENTERPRISE_EVOLUTION_KPIS.md*
*Version: 1.0.0 | Status: AUTHORITATIVE*
*Mandated by: Global Enterprise Architecture Board — 2026-07-24*
