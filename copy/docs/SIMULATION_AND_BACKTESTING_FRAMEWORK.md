<!--
  TRADEORA FINANCIAL OPERATING SYSTEM
  Document: Simulation and Backtesting Framework
  Classification: INTERNAL — ENGINEERING
  Version: 1.0.0
  Author: Tradeora Architecture Team
  Date: 2026-07-24
  Compliance: FRA Egypt / PDPL / EGX Regulations
  Review Cycle: Quarterly
-->

# Simulation and Backtesting Framework

> **Classification:** Internal — Engineering Only  
> **Version:** 1.0.0 | **Date:** 2026-07-24  
> **Owner:** Platform Engineering  
> **Related Documents:** AI_SCHOOLS_SPECIFICATION.md, WISDOM_ENGINE_ARCHITECTURE.md, MARKET_DATA_PIPELINE.md, FINANCIAL_LEDGER_ARCHITECTURE.md  
> **FRA Reference:** No. 92 / 2022 Article 14 (AI system auditability); Rule 40 (look-ahead bias prohibition)

---

> [!CAUTION]
> **Constitutional Constraint — Simulation Results Are INFORMATIONAL ONLY.**  
> Backtest results, Monte Carlo outputs, and any simulated performance figures are **internal engineering tools** and are **never displayed to users** in any form. Displaying simulation results to users as indicative of future performance is a **critical regulatory violation** under FRA No. 92/2022 and Egyptian Capital Market Law. Any feature that exposes simulation data to users requires an explicit FRA approval letter on file before deployment.

---

## Table of Contents

1. [Simulation Philosophy](#1-simulation-philosophy)
2. [Historical Backtesting Engine](#2-historical-backtesting-engine)
3. [School Accuracy Golden Dataset](#3-school-accuracy-golden-dataset)
4. [Monte Carlo Portfolio Stress Test](#4-monte-carlo-portfolio-stress-test)
5. [WisdomEngine Weight Calibration](#5-wisdomengine-weight-calibration)
6. [Simulation Infrastructure](#6-simulation-infrastructure)
7. [Performance Targets](#7-performance-targets)
8. [Disclaimer and Regulatory Treatment](#8-disclaimer-and-regulatory-treatment)
9. [Appendix A — Glossary](#appendix-a--glossary)
10. [Appendix B — Regulatory Cross-Reference](#appendix-b--regulatory-cross-reference)

---

## 1. Simulation Philosophy

### 1.1 Why Backtesting Alone Is Insufficient for AI-Driven Recommendations

Backtesting — the practice of applying a trading strategy to historical data and measuring its hypothetical performance — has been the standard tool of quantitative finance since the 1970s. It remains useful and is employed by Tradeora's backtesting engine as described in Section 2. However, relying on backtesting alone to validate an AI-driven recommendation system introduces a family of structural errors that undermine the reliability of the validation exercise.

**1.1.1 Regime Change Blindness**

Historical backtests assume that the statistical distribution of asset returns during the backtest period is representative of future conditions. In the Egyptian market context, this assumption is especially fragile. EGX30 has experienced at least four distinct return regimes in the past decade: the post-Arab Spring recovery (2012–2014), a currency devaluation regime (2016–2017), a period of sustained inflows correlated with EM sentiment (2019–2021), and the high-inflation, high-rate regime beginning in 2022. An AI school trained or validated exclusively on one regime may perform with apparent accuracy on that period's backtest but fail catastrophically when the regime shifts. Tradeora's backtesting engine measures school performance across rolling windows to detect regime sensitivity, but this still only addresses regimes already present in the historical record.

**1.1.2 Overfitting to Historical Data**

Each of Tradeora's 12 AI schools uses a defined, fixed feature set and algorithm that does not update its parameters on production data (to preserve Rule 40 integrity). Nevertheless, the process of selecting which schools to include, how to weight them in the WisdomEngine, and which hyperparameters to use involves repeated exposure to historical data at the system design level — a form of meta-overfitting. Backtesting cannot detect this meta-overfitting because the backtest uses the same historical data that influenced the design. The Golden Dataset (Section 3) partially addresses this by holding out a validation period, but the fundamental limitation remains: any backtest result is an in-sample measurement to some degree.

**1.1.3 Market Microstructure Assumptions**

EGX has unique microstructure characteristics: T+0 settlement, circuit breakers at plus-or-minus 10% daily, price fixing sessions, and lower liquidity in mid/small caps compared to developed markets. A backtesting engine that models EGX as a generic liquid market will systematically overestimate achievable returns by:
- Assuming trades execute at the close price rather than with slippage
- Ignoring fixed-price sessions where no trades occur
- Underestimating bid-ask spreads for illiquid names
- Ignoring the impact of circuit breakers on exit strategies

Tradeora's backtesting engine uses a configurable slippage model (Section 2.4) and EGX-specific trading cost assumptions to partially compensate, but no model fully captures EGX microstructure.

**1.1.4 Feedback Effects**

If Tradeora successfully scales to serve a meaningful fraction of Egyptian retail investors, its own recommendations will influence EGX prices. A backtest conducted on historical data cannot account for this feedback effect. The AI schools analyzed historical EGX prices that were set without any Tradeora influence; future EGX prices will be partially influenced by Tradeora users acting on its recommendations. This self-referential dynamic is unquantifiable in advance and is a core reason why forward simulation — specifically paper trading simulation (Phase 2) — is essential for long-term system validation.

**1.1.5 Conclusion: Backtesting as Necessary but Not Sufficient**

Backtesting is retained as an essential tool for:
- Detecting gross failures in AI school logic
- Benchmarking school accuracy against EGX30TR
- Calibrating WisdomEngine weights
- Demonstrating to internal stakeholders that the system has positive expected alpha before launch

However, all backtesting results are treated as internal engineering signals, not as product claims. The system is designed with the following validation stack, ordered by increasing reliability:
1. Unit tests (algorithmic correctness)
2. Historical backtest (retrospective accuracy)
3. Golden dataset evaluation (held-out retrospective accuracy)
4. Monte Carlo stress test (tail risk estimation)
5. Paper trading simulation — Phase 2 (live-market forward validation, no capital at risk)
6. Production monitoring (ongoing live accuracy tracking)

---

### 1.2 Look-Ahead Bias Prevention — Rule 40 (Critical Constraint)

Look-ahead bias is the single most dangerous failure mode in backtesting AI recommendation systems. It occurs when the system uses information that would not have been available at the time of the simulated decision.

**Rule 40** is Tradeora's internal designation for the absolute constraint that prevents look-ahead bias across all simulation and backtesting code. The name derives from ADR-0040.

> **Rule 40:** In all backtesting and simulation code, every data query MUST be filtered by an `as_of_date` or `as_of_timestamp` parameter. Any query that retrieves data without such a filter is a Rule 40 violation and MUST be rejected in code review. The `available_from_timestamp` column on all market data tables MUST be set to the timestamp at which the data first became available — NOT the statement or event date.

**Why `available_from_timestamp` not `event_date`?**

Consider a company reporting earnings on 2024-03-15 but the report is filed with FRA and publicly available at 14:30:00 EGT that day. If we simulate a trading decision at 09:00:00 EGT, we must not use those earnings.

```sql
-- TimescaleDB schema for financial statements with Rule 40 compliance
CREATE TABLE fundamentals.financial_statements (
    ticker              VARCHAR(12)     NOT NULL,
    fiscal_period       VARCHAR(8)      NOT NULL,
    report_type         VARCHAR(20)     NOT NULL,
    event_date          DATE            NOT NULL,
    available_from_ts   TIMESTAMPTZ     NOT NULL,
    filing_source       VARCHAR(50)     NOT NULL,
    revenue_egp         NUMERIC(20, 4),
    net_income_egp      NUMERIC(20, 4),
    eps_egp             NUMERIC(10, 4),
    total_assets_egp    NUMERIC(20, 4),
    total_equity_egp    NUMERIC(20, 4),
    PRIMARY KEY (ticker, fiscal_period, report_type)
);

-- Rule 40 compliant query
SELECT * FROM fundamentals.financial_statements
WHERE ticker = $1
  AND available_from_ts <= $2
ORDER BY event_date DESC
LIMIT 8;
```

**Rule 40 Enforcement Mechanisms:**

| Mechanism | Description | Owner |
|-----------|-------------|-------|
| Code review checklist | Mandatory Rule 40 checklist item for all backtesting PRs | Engineering Lead |
| CI static analysis | Custom pylint rule that flags market_data queries missing available_from_ts filter | CI/CD Pipeline |
| Database read-only user | Backtesting service uses a PostgreSQL role with only SELECT grants | DBA |
| Separate DB schema | Backtesting reads from market_data_readonly views, not production tables | Platform Engineering |
| Integration test | Automated test that deliberately introduces future data and asserts the engine rejects it | QA Engineering |

---

### 1.3 Forward Simulation vs. Historical Backtesting

| Dimension | Historical Backtesting | Forward Simulation (Paper Trading) |
|-----------|----------------------|-------------------------------------|
| **Data source** | TimescaleDB historical archive | Live EGX market data feed |
| **Decision timing** | Replayed at historical timestamps | Real wall-clock time |
| **Look-ahead risk** | HIGH — requires Rule 40 enforcement | ZERO — decisions made before outcomes |
| **Regime coverage** | Only historical regimes | Current live regime |
| **Feedback effect** | Not modeled | Partially modeled |
| **Regulatory treatment** | Internal engineering tool | Phase 2; requires FRA approval |
| **Capital at risk** | None | None (paper trades) |
| **Latency constraints** | None | Must match production latency profile |

---

### 1.4 Paper Trading Simulation — Phase 2 Specification Outline

Paper trading simulation is a **Phase 2 feature** not active in Phase 1. Specified here to prevent Phase 1 architecture from blocking Phase 2 implementation.

**Phase 2 Paper Trading Design:**

```
Paper Trading System (Phase 2)
|
+-- Paper Portfolio Service
|   Maintains virtual portfolios; applies AI recommendations as paper trades;
|   uses live EGX prices for valuation; tracks P&L in EGP Decimal arithmetic
|
+-- Execution Simulator
|   Models EGX market impact; applies configurable slippage model;
|   enforces circuit breaker rules; simulates T+0 settlement
|
+-- Performance Tracker
|   Calculates daily paper NAV; computes rolling accuracy metrics;
|   benchmarks vs EGX30TR; feeds WisdomEngine calibration
|
+-- FRA Compliance Layer
    All paper results internal only; requires FRA approval to show users;
    WORM-archived for audit trail
```

**FRA Approval Requirements for Phase 2:** Written approval from FRA; legal review of user-facing language; prohibition on displaying paper returns alongside real AI recommendations in ways that imply causal relationship.

---

### 1.5 Monte Carlo Simulation for Portfolio Stress Testing

Monte Carlo simulation (Section 4) estimates the **distribution of possible future portfolio outcomes** given return distribution assumptions. Key Tradeora uses:
1. **Risk disclosure support**: 95th/99th percentile loss estimates for internal risk monitoring
2. **Rebalancing validation**: Stress-test proposed post-rebalance portfolio before SLICE-09 suggestion
3. **WisdomEngine validation**: Verify school weight configurations don't produce excessive tail risk
4. **Scenario analysis**: Model EGX shocks (20% EGP devaluation, 500bps rate hike)

---

### 1.6 Constitutional Constraint: Simulation Results Are Informational Only

> **Any simulation result — backtest, Monte Carlo, paper trading, scenario analysis — is an internal engineering signal. It MUST NEVER be displayed to users, shared with users, or referenced in user-facing communications as evidence of investment performance, expected returns, or future outcomes. Violating this constraint is a regulatory offense under Egyptian Capital Market Law Article 47 and FRA Decision No. 92/2022 Article 18.**

All simulation result data is stored with `internal_use_only = true` in MinIO metadata and excluded from PDPL user data exports (SLICE-12).

---

## 2. Historical Backtesting Engine

### 2.1 Architecture Overview

The backtesting engine is a **dedicated Python microservice** (`backtesting-engine`) in an isolated Kubernetes namespace, architecturally separated from all production services.

```
backtesting-engine namespace
  Backtest REST API (FastAPI :8080) --> Backtest Worker Pool (Celery, 8 workers)
  Result Store: MinIO bucket bt-results
  TimescaleDB Read-Only Replica: market_data_readonly schema
  Role: backtest_reader (SELECT only)
```

**Technology Stack:**

| Component | Technology | Justification |
|-----------|------------|---------------|
| Runtime | Python 3.12 | NumPy/pandas ecosystem; AI school parity |
| API framework | FastAPI + Uvicorn | Async, typed, OpenAPI spec generation |
| Task queue | Celery + Redis | Distributed backtest job management |
| Data access | asyncpg + SQLAlchemy Core | Async TimescaleDB queries |
| Computation | NumPy, pandas, scipy | Statistical computation |
| Financial arithmetic | Python Decimal | Rule: no float in financial calculations |
| Result storage | MinIO (S3-compatible) | Consistent with production WORM store |
| Monitoring | Prometheus + Grafana | Standard Tradeora observability stack |

---

### 2.2 Rule 40 Data Access Pattern

```python
# backtesting_engine/data/access_layer.py
from __future__ import annotations
import asyncio
import logging
from dataclasses import dataclass
from datetime import date, datetime, time, timezone
from decimal import Decimal
from typing import Optional
import asyncpg
from asyncpg import Connection

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class OHLCV:
    ticker: str
    trade_date: date
    open_price: Decimal
    high_price: Decimal
    low_price: Decimal
    close_price: Decimal
    volume: int
    available_from_ts: datetime


@dataclass(frozen=True)
class FundamentalsSnapshot:
    ticker: str
    fiscal_period: str
    revenue_egp: Optional[Decimal]
    net_income_egp: Optional[Decimal]
    eps_egp: Optional[Decimal]
    pe_ratio: Optional[Decimal]
    pb_ratio: Optional[Decimal]
    roe: Optional[Decimal]
    available_from_ts: datetime


@dataclass
class MarketContext:
    """Complete market context for a ticker at a specific historical point in time."""
    ticker: str
    snapshot_timestamp: datetime
    ohlcv_252d: list[OHLCV]
    fundamentals: Optional[FundamentalsSnapshot]
    egx30_ohlcv_252d: list[OHLCV]
    sector_avg_pe: Optional[Decimal]
    sector_avg_pb: Optional[Decimal]


@dataclass(frozen=True)
class BacktestPoint:
    """A single point in a backtest simulation — Rule 40 compliant."""
    as_of_date: date
    ticker: str
    available_data: MarketContext  # Strictly filtered: available_from_ts <= as_of_date


class BacktestDataAccessLayer:
    """
    Rule 40 enforcement layer — all queries MUST pass as_of_timestamp.
    Every method filters by available_from_ts. Queries without this filter
    are Rule 40 violations and must be rejected in code review.
    """

    def __init__(self, conn: Connection):
        self._conn = conn

    def _make_as_of_ts(self, as_of_date: date) -> datetime:
        """Convert as_of_date to end-of-day timestamp (23:59:59 EGT = 20:59:59 UTC)."""
        return datetime.combine(as_of_date, time(20, 59, 59), tzinfo=timezone.utc)

    async def get_ohlcv(
        self, ticker: str, as_of_date: date, lookback_days: int = 252
    ) -> list[OHLCV]:
        """Fetch OHLCV data available as of as_of_date. Rule 40: filters by available_from_ts."""
        as_of_ts = self._make_as_of_ts(as_of_date)
        rows = await self._conn.fetch(
            """
            SELECT ticker, trade_date, open_price, high_price, low_price,
                   close_price, volume, available_from_ts
            FROM market_data_readonly.ohlcv
            WHERE ticker = $1
              AND available_from_ts <= $2
            ORDER BY trade_date DESC
            LIMIT $3
            """,
            ticker, as_of_ts, lookback_days
        )
        return [
            OHLCV(
                ticker=row['ticker'],
                trade_date=row['trade_date'],
                open_price=Decimal(str(row['open_price'])),
                high_price=Decimal(str(row['high_price'])),
                low_price=Decimal(str(row['low_price'])),
                close_price=Decimal(str(row['close_price'])),
                volume=row['volume'],
                available_from_ts=row['available_from_ts'],
            )
            for row in rows
        ]

    async def get_fundamentals(
        self, ticker: str, as_of_date: date
    ) -> Optional[FundamentalsSnapshot]:
        """Fetch most recent fundamentals available as of as_of_date. Rule 40 compliant."""
        as_of_ts = self._make_as_of_ts(as_of_date)
        row = await self._conn.fetchrow(
            """
            SELECT ticker, fiscal_period, revenue_egp, net_income_egp, eps_egp,
                   pe_ratio, pb_ratio, roe, available_from_ts
            FROM market_data_readonly.financial_statements
            WHERE ticker = $1
              AND available_from_ts <= $2
            ORDER BY available_from_ts DESC
            LIMIT 1
            """,
            ticker, as_of_ts
        )
        if row is None:
            return None
        return FundamentalsSnapshot(
            ticker=row['ticker'],
            fiscal_period=row['fiscal_period'],
            revenue_egp=Decimal(str(row['revenue_egp'])) if row['revenue_egp'] else None,
            net_income_egp=Decimal(str(row['net_income_egp'])) if row['net_income_egp'] else None,
            eps_egp=Decimal(str(row['eps_egp'])) if row['eps_egp'] else None,
            pe_ratio=Decimal(str(row['pe_ratio'])) if row['pe_ratio'] else None,
            pb_ratio=Decimal(str(row['pb_ratio'])) if row['pb_ratio'] else None,
            roe=Decimal(str(row['roe'])) if row['roe'] else None,
            available_from_ts=row['available_from_ts'],
        )

    async def build_historical_context(
        self, ticker: str, as_of_date: date
    ) -> MarketContext:
        """Build complete MarketContext for ticker as of as_of_date. Rule 40 compliant."""
        ohlcv, fundamentals, egx30_ohlcv = await asyncio.gather(
            self.get_ohlcv(ticker, as_of_date),
            self.get_fundamentals(ticker, as_of_date),
            self.get_ohlcv('EGX30TR', as_of_date),
        )
        return MarketContext(
            ticker=ticker,
            snapshot_timestamp=self._make_as_of_ts(as_of_date),
            ohlcv_252d=ohlcv,
            fundamentals=fundamentals,
            egx30_ohlcv_252d=egx30_ohlcv,
            sector_avg_pe=None,
            sector_avg_pb=None,
        )
```

---

### 2.3 Backtest Run Configuration

```python
# backtesting_engine/models/backtest_run.py
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from decimal import Decimal
from enum import Enum
import ulid


class SlippageModel(str, Enum):
    ZERO = 'ZERO'
    LINEAR = 'LINEAR'
    MARKET_IMPACT = 'MARKET_IMPACT'


class RebalancingFrequency(str, Enum):
    DAILY = 'DAILY'
    WEEKLY = 'WEEKLY'
    MONTHLY = 'MONTHLY'


@dataclass
class SchoolWeight:
    school_id: str
    weight: Decimal  # Must be in [0.04, 0.12]; all weights sum to 1.0000


@dataclass
class SchoolConfig:
    schools: list[SchoolWeight]
    consensus_threshold: Decimal = Decimal('0.60')

    def __post_init__(self):
        total = sum(sw.weight for sw in self.schools)
        assert abs(total - Decimal('1.0000')) < Decimal('0.0001'), \
            f'School weights must sum to 1.0000, got {total}'
        for sw in self.schools:
            assert Decimal('0.04') <= sw.weight <= Decimal('0.12'), \
                f'School {sw.school_id} weight {sw.weight} out of bounds [0.04, 0.12]'


@dataclass
class BacktestRun:
    """
    Complete specification for a single backtesting run.
    Immutable once created — results are archived against this configuration.
    """
    name: str
    description: str
    tickers: list[str]                  # EGX tickers to backtest
    start_date: date                     # e.g., date(2022, 1, 1)
    end_date: date                       # e.g., date(2024, 12, 31)
    school_config: SchoolConfig
    initial_portfolio_value: Decimal     # EGP
    rebalancing_frequency: RebalancingFrequency
    transaction_cost_bps: Decimal        # e.g., Decimal('30') = 0.30% round-trip
    slippage_model: SlippageModel
    benchmark: str = 'EGX30TR'
    created_by: str = 'system'
    run_id: str = field(default_factory=lambda: str(ulid.new()))
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __post_init__(self):
        assert self.start_date < self.end_date, 'start_date must precede end_date'
        assert len(self.tickers) >= 1, 'At least one ticker required'
        assert self.initial_portfolio_value > Decimal('0')
        assert Decimal('0') <= self.transaction_cost_bps <= Decimal('200')
```

---

### 2.4 Slippage Models (EGX-Calibrated)

```python
# backtesting_engine/execution/slippage.py
from decimal import Decimal
import math


class SlippageCalculator:
    """EGX-calibrated slippage models. Returns effective execution price."""

    @staticmethod
    def zero(close_price: Decimal, order_side: str, qty: int, adv: int) -> Decimal:
        """ZERO: execute at close price. Optimistic upper bound for large-cap names."""
        return close_price

    @staticmethod
    def linear(close_price: Decimal, order_side: str, qty: int, adv: int) -> Decimal:
        """
        LINEAR: slippage proportional to participation rate.
        Calibrated to EGX: 20bps slippage per 1% ADV participation.
        """
        if adv == 0:
            return close_price
        participation = Decimal(str(qty)) / Decimal(str(adv))
        slippage_pct = participation * Decimal('2000') / Decimal('10000')  # 20bps per 1% ADV
        if order_side == 'BUY':
            return close_price * (Decimal('1') + slippage_pct)
        return close_price * (Decimal('1') - slippage_pct)

    @staticmethod
    def market_impact(
        close_price: Decimal,
        order_side: str,
        qty: int,
        adv: int,
        volatility: Decimal,
        eta: Decimal = Decimal('0.142'),    # Almgren-Chriss permanent impact
        gamma: Decimal = Decimal('0.314'),  # Temporary impact parameter
    ) -> Decimal:
        """
        MARKET_IMPACT: Almgren-Chriss (2001) adapted for EGX.
        Permanent: eta * sigma * sqrt(qty/ADV)
        Temporary: gamma * sigma * (qty/ADV)
        """
        if adv == 0:
            return close_price
        x = Decimal(str(qty)) / Decimal(str(adv))
        permanent = eta * volatility * Decimal(str(math.sqrt(float(x))))
        temporary = gamma * volatility * x
        total_impact = permanent + temporary
        if order_side == 'BUY':
            return close_price * (Decimal('1') + total_impact)
        return close_price * (Decimal('1') - total_impact)
```

---

### 2.5 Backtest Results Schema

```python
# backtesting_engine/models/backtest_results.py
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional


@dataclass
class TradeRecord:
    trade_date: date
    ticker: str
    action: Literal['BUY', 'SELL']
    quantity: int
    execution_price: Decimal        # After slippage
    transaction_cost_egp: Decimal   # Brokerage + EGX fees
    portfolio_weight_pct: Decimal
    ai_recommendation: Literal['BUY', 'HOLD', 'SELL']
    school_votes: dict[str, str]    # school_id -> vote
    consensus_confidence: Decimal


@dataclass
class DailyPortfolioSnapshot:
    snapshot_date: date
    nav_egp: Decimal
    nav_change_pct: Decimal
    benchmark_nav_egp: Decimal
    holdings: dict[str, Decimal]    # ticker -> market_value_egp
    cash_egp: Decimal
    school_weights_today: dict[str, Decimal]


@dataclass
class BacktestResults:
    """
    Complete results of a single backtest run.
    INTERNAL USE ONLY — never expose to users.
    """
    run_id: str
    status: Literal['RUNNING', 'COMPLETED', 'FAILED']
    error_message: Optional[str] = None
    duration_seconds: int = 0
    completed_at: Optional[datetime] = None

    # Portfolio Performance
    total_return_pct: Decimal = Decimal('0')
    annualized_return_pct: Decimal = Decimal('0')
    benchmark_return_pct: Decimal = Decimal('0')
    alpha_pct: Decimal = Decimal('0')           # vs. EGX30TR
    beta: Decimal = Decimal('0')
    information_ratio: Decimal = Decimal('0')
    tracking_error_pct: Decimal = Decimal('0')

    # Risk Metrics
    sharpe_ratio: Decimal = Decimal('0')        # Annualized; risk-free = EGB 3m yield
    sortino_ratio: Decimal = Decimal('0')
    max_drawdown_pct: Decimal = Decimal('0')
    max_drawdown_start: Optional[date] = None
    max_drawdown_end: Optional[date] = None
    calmar_ratio: Decimal = Decimal('0')        # CAGR / |Max Drawdown|
    var_99_pct: Decimal = Decimal('0')
    var_95_pct: Decimal = Decimal('0')
    expected_shortfall_95: Decimal = Decimal('0')  # CVaR
    annualized_volatility_pct: Decimal = Decimal('0')
    skewness: Decimal = Decimal('0')
    excess_kurtosis: Decimal = Decimal('0')
    ulcer_index: Decimal = Decimal('0')

    # AI Accuracy Metrics
    total_recommendations: int = 0
    directional_accuracy_pct: Decimal = Decimal('0')
    buy_precision: Decimal = Decimal('0')       # TP_buy / (TP_buy + FP_buy)
    buy_recall: Decimal = Decimal('0')
    sell_precision: Decimal = Decimal('0')
    sell_recall: Decimal = Decimal('0')
    hold_accuracy: Decimal = Decimal('0')
    f1_score: Decimal = Decimal('0')
    brier_score: Decimal = Decimal('0')         # Confidence calibration

    # School Performance
    school_accuracy_breakdown: dict[str, Decimal] = field(default_factory=dict)
    school_weight_stability: dict[str, list[Decimal]] = field(default_factory=dict)
    school_avg_confidence: dict[str, Decimal] = field(default_factory=dict)
    school_vote_agreement_pct: Decimal = Decimal('0')

    # Trade Statistics
    trade_count: int = 0
    buy_trade_count: int = 0
    sell_trade_count: int = 0
    winning_trades_pct: Decimal = Decimal('0')
    losing_trades_pct: Decimal = Decimal('0')
    avg_holding_period_days: Decimal = Decimal('0')
    max_holding_period_days: int = 0
    total_transaction_costs_egp: Decimal = Decimal('0')
    transaction_cost_drag_pct: Decimal = Decimal('0')
    turnover_pct_annual: Decimal = Decimal('0')

    # Time Series
    daily_snapshots: list[DailyPortfolioSnapshot] = field(default_factory=list)
    trade_log: list[TradeRecord] = field(default_factory=list)
```

---

### 2.6 Backtest Execution Engine

```python
# backtesting_engine/engine/runner.py
from __future__ import annotations
import logging
import math
from datetime import date
from decimal import Decimal
from ..models.backtest_run import BacktestRun, RebalancingFrequency
from ..models.backtest_results import BacktestResults, DailyPortfolioSnapshot

logger = logging.getLogger(__name__)


class BacktestRunner:
    """
    Core backtest simulation engine. Replays market history day by day.
    All data access goes through BacktestDataAccessLayer for Rule 40 compliance.
    """
    EGX_RISK_FREE_RATE_ANNUAL = Decimal('0.27')  # EGB 3-month yield proxy (2024)
    TRADING_DAYS_PER_YEAR = Decimal('252')

    def _should_rebalance(
        self, current_date: date, run: BacktestRun, trading_days: list[date]
    ) -> bool:
        if run.rebalancing_frequency == RebalancingFrequency.DAILY:
            return True
        day_index = trading_days.index(current_date)
        if run.rebalancing_frequency == RebalancingFrequency.WEEKLY:
            return current_date.weekday() == 0 or day_index == 0
        if run.rebalancing_frequency == RebalancingFrequency.MONTHLY:
            return (current_date.day <= 7 and current_date.weekday() < 5 and
                    (day_index == 0 or trading_days[day_index - 1].month != current_date.month))
        return False

    def _compute_metrics(self, results: BacktestResults, run: BacktestRun) -> BacktestResults:
        if not results.daily_snapshots:
            return results
        navs = [s.nav_egp for s in results.daily_snapshots]
        bench_navs = [s.benchmark_nav_egp for s in results.daily_snapshots]
        daily_returns = [(navs[i] - navs[i-1]) / navs[i-1] for i in range(1, len(navs))]
        if not daily_returns:
            return results
        years = Decimal(str(len(daily_returns))) / self.TRADING_DAYS_PER_YEAR
        results.total_return_pct = (navs[-1] - navs[0]) / navs[0] * Decimal('100')
        results.annualized_return_pct = (
            ((navs[-1] / navs[0]) ** (Decimal('1') / years) - Decimal('1')) * Decimal('100')
        )
        results.benchmark_return_pct = (
            (bench_navs[-1] - bench_navs[0]) / bench_navs[0] * Decimal('100')
        )
        results.alpha_pct = results.annualized_return_pct - (
            ((bench_navs[-1] / bench_navs[0]) ** (Decimal('1') / years) - Decimal('1')) * Decimal('100')
        )
        mean_ret = sum(daily_returns) / len(daily_returns)
        variance = sum((r - mean_ret) ** 2 for r in daily_returns) / (len(daily_returns) - 1)
        daily_vol = Decimal(str(math.sqrt(float(variance))))
        results.annualized_volatility_pct = daily_vol * Decimal(str(math.sqrt(252))) * Decimal('100')
        daily_rf = self.EGX_RISK_FREE_RATE_ANNUAL / self.TRADING_DAYS_PER_YEAR
        excess = [r - daily_rf for r in excess]
        me = sum(excess) / len(excess)
        ex_var = sum((r - me) ** 2 for r in excess) / (len(excess) - 1)
        ex_vol = Decimal(str(math.sqrt(float(ex_var))))
        results.sharpe_ratio = (
            me / ex_vol * Decimal(str(math.sqrt(252))) if ex_vol > Decimal('0') else Decimal('0')
        )
        peak = navs[0]
        max_dd = Decimal('0')
        for nav in navs:
            if nav > peak:
                peak = nav
            dd = (nav - peak) / peak
            if dd < max_dd:
                max_dd = dd
        results.max_drawdown_pct = max_dd * Decimal('100')
        results.calmar_ratio = (
            results.annualized_return_pct / abs(results.max_drawdown_pct)
            if results.max_drawdown_pct != Decimal('0') else Decimal('0')
        )
        return results
```

---

## 3. School Accuracy Golden Dataset

### 3.1 Purpose and Construction

The Golden Dataset is the authoritative evaluation benchmark for all Tradeora AI schools. It provides objective, out-of-sample measurement of each school's predictive accuracy against verified EGX outcomes.

**Dataset Composition:**

| Field | Description |
|-------|-------------|
| `record_id` | ULID — unique per recommendation event |
| `school_id` | Which AI school made the recommendation |
| `ticker` | EGX ticker symbol (e.g., COMI, HRHO, ETEL) |
| `recommendation_date` | Date the school recommendation was generated |
| `recommendation` | BUY, HOLD, or SELL |
| `confidence` | School confidence score [0.0, 1.0] as Decimal |
| `actual_return_30d` | Verified actual return over next 30 calendar days |
| `actual_return_60d` | Verified actual return over next 60 calendar days |
| `actual_return_90d` | Verified actual return over next 90 calendar days |
| `egx30_return_30d` | EGX30TR return over same 30-day window |
| `egx30_return_60d` | EGX30TR return over same 60-day window |
| `egx30_return_90d` | EGX30TR return over same 90-day window |
| `outcome_30d` | CORRECT / INCORRECT / EXCLUDED (suspended trading) |
| `evaluated_at` | Timestamp when forward return was computed |

**Data volume:** 2 years x 12 schools x ~30 EGX tickers x ~252 trading days = up to ~2.2M records. Realistic estimate: ~400,000-600,000 records per year.

---

### 3.2 Directional Accuracy Definition

| Recommendation | Condition for CORRECT |
|----------------|----------------------|
| BUY | actual_return_30d > egx30_return_30d (positive relative return) |
| SELL | actual_return_30d < egx30_return_30d (negative relative return) |
| HOLD | abs(actual_return_30d - egx30_return_30d) < 2.0% |

Minimum accuracy target: **70%** directional accuracy sustained over 6 months.
School exclusion trigger: **< 55%** accuracy for 3 consecutive months.

---

### 3.3 Golden Dataset Evaluator Implementation

```python
# backtesting_engine/golden_dataset/evaluator.py
from __future__ import annotations
from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class HistoricalRecommendation:
    record_id: str
    school_id: str
    ticker: str
    recommendation_date: date
    recommendation: str  # 'BUY', 'HOLD', 'SELL'
    confidence: Decimal


@dataclass
class SchoolAccuracyReport:
    school_id: str
    window_days: int
    accuracy: Decimal
    total_recommendations: int
    correct_predictions: int
    excluded_count: int
    buy_precision: Decimal
    sell_precision: Decimal
    hold_accuracy: Decimal
    brier_score: Decimal
    monthly_accuracy: dict[str, Decimal]  # 'YYYY-MM' -> accuracy
    meets_threshold: bool     # accuracy >= 0.70
    triggers_exclusion: bool  # 3 consecutive months below 0.55


class GoldenDatasetEvaluator:
    FORWARD_RETURN_WINDOWS = [30, 60, 90]
    ACCURACY_THRESHOLD = Decimal('0.70')
    SCHOOL_EXCLUSION_THRESHOLD = Decimal('0.55')
    CONSECUTIVE_MONTHS_FOR_EXCLUSION = 3
    HOLD_BAND_PCT = Decimal('0.02')

    def evaluate_school_accuracy(
        self,
        school_id: str,
        recommendations: list[HistoricalRecommendation],
        forward_returns: dict[str, Decimal],
        egx30_returns: dict[str, Decimal],
        window_days: int = 30,
    ) -> SchoolAccuracyReport:
        correct = total = excluded = 0
        buy_tp = buy_fp = sell_tp = sell_fp = hold_correct = hold_total = 0
        brier_sum = Decimal('0')
        monthly_stats: dict[str, dict] = {}

        for rec in recommendations:
            fwd_key = f'{rec.ticker}:{rec.recommendation_date.isoformat()}:{window_days}d'
            actual_return = forward_returns.get(fwd_key)
            if actual_return is None:
                excluded += 1
                continue

            egx_key = f'EGX30TR:{rec.recommendation_date.isoformat()}:{window_days}d'
            benchmark_return = egx30_returns.get(egx_key)
            if benchmark_return is None:
                excluded += 1
                continue

            relative_return = actual_return - benchmark_return

            if rec.recommendation == 'BUY':
                prediction_correct = relative_return > Decimal('0')
                if prediction_correct:
                    buy_tp += 1
                    correct += 1
                else:
                    buy_fp += 1
            elif rec.recommendation == 'SELL':
                prediction_correct = relative_return < Decimal('0')
                if prediction_correct:
                    sell_tp += 1
                    correct += 1
                else:
                    sell_fp += 1
            elif rec.recommendation == 'HOLD':
                prediction_correct = abs(relative_return) < self.HOLD_BAND_PCT
                hold_total += 1
                if prediction_correct:
                    hold_correct += 1
                    correct += 1
            else:
                continue

            total += 1
            outcome = Decimal('1') if prediction_correct else Decimal('0')
            brier_sum += (rec.confidence - outcome) ** 2

            month_key = rec.recommendation_date.strftime('%Y-%m')
            if month_key not in monthly_stats:
                monthly_stats[month_key] = {'correct': 0, 'total': 0}
            monthly_stats[month_key]['total'] += 1
            if prediction_correct:
                monthly_stats[month_key]['correct'] += 1

        accuracy = Decimal(correct) / Decimal(total) if total > 0 else Decimal('0')
        brier_score = brier_sum / Decimal(total) if total > 0 else Decimal('0')

        monthly_accuracy = {
            month: (
                Decimal(stats['correct']) / Decimal(stats['total'])
                if stats['total'] > 0 else Decimal('0')
            ).quantize(Decimal('0.0001'))
            for month, stats in sorted(monthly_stats.items())
        }

        current_streak = 0
        for acc in reversed(list(monthly_accuracy.values())):
            if acc < self.SCHOOL_EXCLUSION_THRESHOLD:
                current_streak += 1
            else:
                break
        triggers_exclusion = current_streak >= self.CONSECUTIVE_MONTHS_FOR_EXCLUSION

        return SchoolAccuracyReport(
            school_id=school_id,
            window_days=window_days,
            accuracy=accuracy.quantize(Decimal('0.0001')),
            total_recommendations=total,
            correct_predictions=correct,
            excluded_count=excluded,
            buy_precision=(
                Decimal(buy_tp) / Decimal(buy_tp + buy_fp)
                if (buy_tp + buy_fp) > 0 else Decimal('0')
            ).quantize(Decimal('0.0001')),
            sell_precision=(
                Decimal(sell_tp) / Decimal(sell_tp + sell_fp)
                if (sell_tp + sell_fp) > 0 else Decimal('0')
            ).quantize(Decimal('0.0001')),
            hold_accuracy=(
                Decimal(hold_correct) / Decimal(hold_total)
                if hold_total > 0 else Decimal('0')
            ).quantize(Decimal('0.0001')),
            brier_score=brier_score.quantize(Decimal('0.0001')),
            monthly_accuracy=monthly_accuracy,
            meets_threshold=accuracy >= self.ACCURACY_THRESHOLD,
            triggers_exclusion=triggers_exclusion,
        )

    def generate_monthly_accuracy_report(
        self,
        school_reports: dict[str, SchoolAccuracyReport],
        reporting_month: str,
    ) -> dict:
        return {
            'reporting_month': reporting_month,
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'summary': {
                school_id: {
                    'accuracy_30d': str(report.accuracy),
                    'buy_precision': str(report.buy_precision),
                    'sell_precision': str(report.sell_precision),
                    'hold_accuracy': str(report.hold_accuracy),
                    'brier_score': str(report.brier_score),
                    'total_evaluated': report.total_recommendations,
                    'meets_70pct_threshold': report.meets_threshold,
                    'exclusion_triggered': report.triggers_exclusion,
                }
                for school_id, report in school_reports.items()
            },
            'schools_to_exclude': [
                sid for sid, r in school_reports.items() if r.triggers_exclusion
            ],
            'system_accuracy': (
                sum(r.accuracy for r in school_reports.values()) / len(school_reports)
            ).quantize(Decimal('0.0001')) if school_reports else Decimal('0'),
        }
```

---

## 4. Monte Carlo Portfolio Stress Test

### 4.1 Purpose and Methodology

The Monte Carlo stress test generates a probability distribution of possible portfolio outcomes by simulating correlated random market scenarios. Methodology: Geometric Brownian Motion (GBM) with Cholesky-decomposed correlation matrix.

**Inputs:** Historical return estimates per ticker (252d OHLCV); pairwise correlation matrix; portfolio weights.

**Outputs:** VaR 95%/99%, Expected Shortfall (CVaR) 95%, P(loss), best/worst/median outcomes, full distribution for Grafana.

---

### 4.2 Monte Carlo Implementation

```python
# backtesting_engine/monte_carlo/stress_test.py
from __future__ import annotations
from dataclasses import dataclass
from decimal import Decimal
from typing import Optional
import numpy as np
import logging

logger = logging.getLogger(__name__)


@dataclass
class PortfolioHolding:
    ticker: str
    weight: Decimal
    historical_return: Decimal    # Annualized
    historical_volatility: Decimal  # Annualized


@dataclass
class Portfolio:
    holdings: list[PortfolioHolding]
    total_value_egp: Decimal

    def weights_vector(self) -> np.ndarray:
        return np.array([float(h.weight) for h in self.holdings])

    def volatilities_vector(self) -> np.ndarray:
        return np.array([float(h.historical_volatility) for h in self.holdings])

    def returns_vector(self) -> np.ndarray:
        return np.array([float(h.historical_return) for h in self.holdings])


@dataclass
class StressTestResults:
    n_simulations: int
    simulation_horizon_days: int
    var_95_pct: Decimal
    var_99_pct: Decimal
    expected_shortfall_95: Decimal
    expected_shortfall_99: Decimal
    probability_of_loss: Decimal
    worst_case_pct: Decimal
    best_case_pct: Decimal
    median_return_pct: Decimal
    mean_return_pct: Decimal
    std_return_pct: Decimal
    percentiles: dict[str, Decimal]  # '1','5','10','25','50','75','90','95','99'
    simulated_returns_egp: list[Decimal]
    metadata: dict


class MonteCarloStressTest:
    """
    Simulate 10,000 portfolio scenarios to estimate tail risk.
    Uses Cholesky decomposition to preserve inter-asset correlations.
    NumPy used for computation; results returned as Decimal.
    """
    N_SIMULATIONS = 10_000
    SIMULATION_HORIZON_DAYS = 252
    TRADING_DAYS_PER_YEAR = 252

    def __init__(self, n_simulations: int = N_SIMULATIONS, random_seed: Optional[int] = None):
        self.n_simulations = n_simulations
        self.random_seed = random_seed

    def run(
        self,
        portfolio: Portfolio,
        correlation_matrix: np.ndarray,
        horizon_days: int = SIMULATION_HORIZON_DAYS,
    ) -> StressTestResults:
        n_assets = len(portfolio.holdings)
        assert correlation_matrix.shape == (n_assets, n_assets)

        if self.random_seed is not None:
            np.random.seed(self.random_seed)

        reg_corr = correlation_matrix + np.eye(n_assets) * 1e-8
        L = np.linalg.cholesky(reg_corr)

        weights = portfolio.weights_vector()
        daily_vols = portfolio.volatilities_vector() / np.sqrt(self.TRADING_DAYS_PER_YEAR)
        daily_rets = portfolio.returns_vector() / self.TRADING_DAYS_PER_YEAR

        portfolio_sim_returns = np.zeros(self.n_simulations)
        for sim_idx in range(self.n_simulations):
            z = np.random.standard_normal((n_assets, horizon_days))
            correlated_z = L @ z
            asset_log_returns = (
                (daily_rets - 0.5 * daily_vols**2)[:, np.newaxis]
                + daily_vols[:, np.newaxis] * correlated_z
            )
            asset_total_returns = np.exp(np.sum(asset_log_returns, axis=1)) - 1
            portfolio_sim_returns[sim_idx] = np.dot(weights, asset_total_returns)

        sorted_returns = np.sort(portfolio_sim_returns)
        n = len(sorted_returns)
        var_95_idx = int(0.05 * n)
        var_99_idx = int(0.01 * n)

        percentile_levels = [1, 5, 10, 25, 50, 75, 90, 95, 99]
        percentiles = {
            str(p): Decimal(str(round(float(np.percentile(sorted_returns, p)) * 100, 4)))
            for p in percentile_levels
        }

        logger.info(
            'Monte Carlo: n=%d, VaR95=%.2f%%, VaR99=%.2f%%, P(loss)=%.1f%%',
            self.n_simulations,
            float(sorted_returns[var_95_idx]) * 100,
            float(sorted_returns[var_99_idx]) * 100,
            float(np.mean(sorted_returns < 0)) * 100,
        )

        return StressTestResults(
            n_simulations=self.n_simulations,
            simulation_horizon_days=horizon_days,
            var_95_pct=Decimal(str(round(float(sorted_returns[var_95_idx]) * 100, 4))),
            var_99_pct=Decimal(str(round(float(sorted_returns[var_99_idx]) * 100, 4))),
            expected_shortfall_95=Decimal(str(round(float(np.mean(sorted_returns[:var_95_idx])) * 100, 4))),
            expected_shortfall_99=Decimal(str(round(float(np.mean(sorted_returns[:var_99_idx])) * 100, 4))),
            probability_of_loss=Decimal(str(round(float(np.mean(sorted_returns < 0)), 4))),
            worst_case_pct=Decimal(str(round(float(sorted_returns[0]) * 100, 4))),
            best_case_pct=Decimal(str(round(float(sorted_returns[-1]) * 100, 4))),
            median_return_pct=Decimal(str(round(float(np.median(sorted_returns)) * 100, 4))),
            mean_return_pct=Decimal(str(round(float(np.mean(sorted_returns)) * 100, 4))),
            std_return_pct=Decimal(str(round(float(np.std(sorted_returns)) * 100, 4))),
            percentiles=percentiles,
            simulated_returns_egp=[
                Decimal(str(round(r * 100, 4))) for r in sorted_returns.tolist()
            ],
            metadata={
                'n_assets': n_assets,
                'tickers': [h.ticker for h in portfolio.holdings],
                'weights': [str(h.weight) for h in portfolio.holdings],
                'horizon_days': horizon_days,
                'internal_use_only': True,
            },
        )
```

---

## 5. WisdomEngine Weight Calibration

### 5.1 Overview

The WisdomEngine aggregates votes from all active AI schools into a single consensus recommendation. Each school's influence is determined by its weight — a Decimal in [0.04, 0.12] summing to 1.0000 across all active schools. Weights are updated monthly based on measured accuracy from the Golden Dataset evaluator.

### 5.2 Monthly Calibration Cycle

```
Monthly Weight Calibration (1st of each month, 01:00 EGT)
  Step 1: Collect prior-month school accuracy from GoldenDatasetEvaluator
  Step 2: Circuit breaker — exclude schools with 3+ consecutive months < 55%
           Alert fired: Kafka topic school.circuit_breaker_triggered
  Step 3: update_weights() — bounded gradient step toward accuracy-proportional target
  Step 4: Brier score check — flag schools with score > 0.25 for recalibration
  Step 5: Publish weights to TimescaleDB + Kafka: wisdom_engine.weights_updated
  Step 6: Grafana dashboard updated with monthly accuracy report
```

---

### 5.3 Weight Update Algorithm

```python
# backtesting_engine/wisdom_engine/weight_calibration.py
from __future__ import annotations
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class WeightUpdateResult:
    prior_weights: dict[str, Decimal]
    new_weights: dict[str, Decimal]
    weight_changes: dict[str, Decimal]
    excluded_schools: list[str]
    total_sum: Decimal
    calibration_month: str


class WisdomEngine:
    WEIGHT_MIN = Decimal('0.04')    # 4% minimum
    WEIGHT_MAX = Decimal('0.12')    # 12% maximum
    LEARNING_RATE = Decimal('0.10') # 10% max adjustment per month

    def update_weights(
        self,
        current_weights: dict[str, Decimal],
        school_accuracies: dict[str, Decimal],
        excluded_schools: Optional[list[str]] = None,
    ) -> dict[str, Decimal]:
        """
        Compute new school weights based on measured accuracy.
        1. Exclude circuit-broken schools
        2. Target weight proportional to accuracy
        3. Move toward target by at most LEARNING_RATE * (target - current)
        4. Clamp to [WEIGHT_MIN, WEIGHT_MAX]
        5. Normalize to sum exactly to 1.0000
        6. Fix rounding residual by adjusting highest-weight school
        """
        excluded = set(excluded_schools or [])
        if excluded:
            logger.warning('Circuit breaker: excluding %s', sorted(excluded))

        active = {
            sid: acc for sid, acc in school_accuracies.items()
            if sid not in excluded and sid in current_weights
        }
        if not active:
            raise ValueError('No active schools remain after exclusions')

        total_accuracy = sum(active.values())
        if total_accuracy == Decimal('0'):
            n = len(active)
            targets = {sid: Decimal('1') / Decimal(str(n)) for sid in active}
        else:
            targets = {
                sid: (acc / total_accuracy).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)
                for sid, acc in active.items()
            }

        adjusted = {}
        for sid, target in targets.items():
            current = current_weights.get(sid, Decimal('1') / Decimal(str(len(active))))
            new_w = current + (target - current) * self.LEARNING_RATE
            new_w = max(self.WEIGHT_MIN, min(self.WEIGHT_MAX, new_w))
            adjusted[sid] = new_w.quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)

        total = sum(adjusted.values())
        normalized = {
            sid: (w / total).quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)
            for sid, w in adjusted.items()
        }

        residual = Decimal('1.0000') - sum(normalized.values())
        if residual != Decimal('0'):
            max_school = max(normalized, key=normalized.__getitem__)
            normalized[max_school] = (normalized[max_school] + residual).quantize(
                Decimal('0.0001'), rounding=ROUND_HALF_UP
            )

        assert sum(normalized.values()) == Decimal('1.0000'), \
            'Weight normalization failed. Critical algorithmic error.'
        return normalized

    def compute_consensus(
        self,
        school_votes: dict[str, str],
        school_confidences: dict[str, Decimal],
        current_weights: dict[str, Decimal],
        consensus_threshold: Decimal = Decimal('0.60'),
    ) -> tuple[str, Decimal]:
        """Compute weighted consensus. Returns (recommendation, weighted_confidence)."""
        weighted: dict[str, Decimal] = {'BUY': Decimal('0'), 'HOLD': Decimal('0'), 'SELL': Decimal('0')}
        total_w = Decimal('0')
        for sid, vote in school_votes.items():
            w = current_weights.get(sid, Decimal('0'))
            if w == Decimal('0') or vote not in weighted:
                continue
            weighted[vote] += w
            total_w += w
        if total_w == Decimal('0'):
            return 'HOLD', Decimal('0')
        for rec in weighted:
            weighted[rec] = (weighted[rec] / total_w).quantize(Decimal('0.0001'))
        max_rec = max(weighted, key=weighted.__getitem__)
        final = max_rec if weighted[max_rec] >= consensus_threshold else 'HOLD'
        conf = sum(
            school_confidences.get(sid, Decimal('0')) * current_weights.get(sid, Decimal('0'))
            for sid in school_votes
        ) / total_w
        return final, conf.quantize(Decimal('0.0001'))
```

---

## 6. Simulation Infrastructure

### 6.1 Kubernetes Deployment

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: tradeora-backtesting
  labels:
    app.kubernetes.io/part-of: tradeora
    environment: internal
    pii-exposure: "false"
    production-isolation: required
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backtesting-engine
  namespace: tradeora-backtesting
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backtesting-engine
  template:
    metadata:
      labels:
        app: backtesting-engine
    spec:
      containers:
        - name: backtesting-engine
          image: tradeora/backtesting-engine:latest
          resources:
            requests:
              cpu: "16"
              memory: "64Gi"
            limits:
              cpu: "16"
              memory: "64Gi"
          env:
            - name: DB_DSN
              valueFrom:
                secretKeyRef:
                  name: backtesting-db-secret
                  key: dsn
            - name: MINIO_ENDPOINT
              value: minio.tradeora-backtesting.svc.cluster.local:9000
            - name: MINIO_BUCKET
              value: bt-results
            - name: INTERNAL_USE_ONLY
              value: "true"
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 10
```

### 6.2 Database Access: Read-Only TimescaleDB Replica

```sql
-- Provisioned by DBA; NOT managed by application migrations
CREATE ROLE backtest_reader WITH LOGIN PASSWORD '<secret>' CONNECTION LIMIT 10;
GRANT USAGE ON SCHEMA market_data_readonly TO backtest_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA market_data_readonly TO backtest_reader;
GRANT USAGE ON SCHEMA golden_dataset TO backtest_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA golden_dataset TO backtest_reader;
REVOKE ALL ON SCHEMA public FROM backtest_reader;
REVOKE ALL ON SCHEMA recommendations FROM backtest_reader;
REVOKE ALL ON SCHEMA user_data FROM backtest_reader;
REVOKE ALL ON SCHEMA compliance FROM backtest_reader;
```

### 6.3 Backtest REST API Endpoints

```
POST   /api/v1/backtests                       Submit new backtest run
GET    /api/v1/backtests/{run_id}              Get status and metadata
GET    /api/v1/backtests/{run_id}/results      Get full results (JSON)
GET    /api/v1/backtests/{run_id}/results/csv  Download trade log CSV
DELETE /api/v1/backtests/{run_id}              Cancel running backtest
GET    /api/v1/school-accuracy                 Latest school accuracy report
GET    /api/v1/school-accuracy/{school_id}     School accuracy history
POST   /api/v1/monte-carlo                     Submit stress test job
GET    /api/v1/monte-carlo/{job_id}            Get stress test results
GET    /api/v1/wisdom-engine/weights            Current WisdomEngine weights
GET    /api/v1/wisdom-engine/weights/history   Weight history (12 months)
GET    /health                                  Kubernetes probe
GET    /metrics                                 Prometheus metrics
```

### 6.4 MinIO Result Storage Layout

```
MinIO Bucket: bt-results/
  backtests/{run_id}/
    config.json            BacktestRun configuration (immutable)
    results.json           BacktestResults summary metrics
    daily_snapshots.parquet  Daily portfolio snapshots
    trade_log.parquet      Full trade log
    metadata.json          internal_use_only=true, created_at, etc.
  monte-carlo/{job_id}/
    config.json            StressTest configuration
    results.json           StressTestResults summary
    distribution.parquet   Full 10,000 simulated returns
  school-accuracy/{YYYY-MM}/
    summary.json           Monthly accuracy report
    per-school/{school_id}.json  Detailed per-school metrics
```

**Retention Policy:**

| Data Type | Retention | Notes |
|-----------|-----------|-------|
| Backtest results | 1 year | Sufficient for engineering review |
| Monte Carlo results | 90 days | Short-lived risk snapshots |
| School accuracy reports | 3 years | FRA accuracy monitoring requirement |
| Production recommendation WORM | 7 years | FRA No. 92/2022 mandatory |

Simulation data is NOT subject to the FRA 7-year WORM rule. Only production AI recommendations carry that archival obligation.

### 6.5 Weekly Scheduled Backtest CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: weekly-backtest
  namespace: tradeora-backtesting
spec:
  schedule: "0 22 * * 6"  # Saturday 22:00 UTC = Sunday 01:00 EGT
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: weekly-backtest-runner
              image: tradeora/backtesting-engine:latest
              command: [python, -m, backtesting_engine.jobs.weekly_backtest]
              env:
                - name: BACKTEST_TICKERS
                  value: COMI,HRHO,ETEL,SWDY,SKPC,EFIC,CLHO,TALM,FWRY,EKHO,ISPH,ABUK,ACGC,AFDI,AMOC,ARCO,BFIN,CANA,CSAG,DOMR,EGTS,FANS,FCEL,GBCO,GTHE,HHCM,HELI,LCSW,MCQE,MFPC
                - name: REBALANCING_FREQUENCY
                  value: MONTHLY
                - name: SLIPPAGE_MODEL
                  value: LINEAR
                - name: TRANSACTION_COST_BPS
                  value: "30"
```

---

## 7. Performance Targets

### 7.1 Target Table

| Workload | Target | Infrastructure | Notes |
|----------|--------|----------------|-------|
| 2-year backtest, 30 tickers, monthly rebalancing | < 10 min | 16 CPU, 64 GB RAM | All 12 schools, LINEAR slippage |
| 2-year backtest, 30 tickers, daily rebalancing | < 25 min | Same | ~504 rebalancing events |
| Monte Carlo: 10,000 simulations, 10 assets | < 60 sec | Same pod | NumPy vectorized Cholesky |
| School accuracy evaluation (1 school, 1 month) | < 30 sec | Same | ~3,500 recommendations |
| School accuracy evaluation (all 12 schools, monthly) | < 5 min | Same pod | Parallelized per school |
| Weekly scheduled backtest (30-ticker, 2-year) | < 15 min | CronJob pod | Includes MinIO upload |
| Golden dataset full evaluation (2 years, all schools) | < 20 min | Same | Quarterly operation |

### 7.2 Optimization Strategies

| Optimization | Implementation | Expected Speedup |
|-------------|----------------|------------------|
| Parallel school execution | asyncio.gather() across 12 schools | 12x vs sequential |
| NumPy vectorized Monte Carlo | Matrix operations vs Python loops | 100x vs pure Python |
| TimescaleDB chunk caching | Read-only replica with shared_buffers=16GB | 5x query speed |
| Parquet output | Apache Arrow / pyarrow | 10x smaller, faster reads |
| School output caching | Redis cache per (ticker, date) | Avoids re-running schools |
| Pre-computed forward returns | Golden dataset reads pre-computed returns table | Eliminates per-eval queries |

---

## 8. Disclaimer and Regulatory Treatment

### 8.1 FRA Regulatory Position on Backtesting

Backtesting results are classified as **internal engineering tools** under FRA Decision No. 92/2022. Not financial research, investment advice, or performance projections. Article 14 requires AI systems to be auditable with measurable accuracy — Tradeora's backtesting and Golden Dataset framework satisfies this.

**Key regulatory treatment decisions:**

| Decision | Rationale |
|----------|----------|
| Backtest results never shown to users | FRA Article 18: prohibition on misleading financial promotion |
| Simulation results stored with internal_use_only=true | Ensures PDPL export (SLICE-12) excludes simulation data |
| School accuracy reports on internal Grafana only | Not accessible via user-facing API |
| Paper trading (Phase 2) requires explicit FRA letter | User-facing simulated returns need specific approval |
| Monte Carlo labeled "Estimated tail risk — NOT investment advice" | Internal labeling standard |

### 8.2 Phase 2 Paper Trading Regulatory Conditions

If paper trading results are ever made visible to users, ALL of the following must be met before deployment:
1. **Written FRA approval letter** on file in Compliance SharePoint, specifically addressing paper trading display to retail investors
2. **Legal review** by external Egyptian capital market law firm of all user-facing copy
3. **FRA disclaimer** on every screen: *"هذه نتائج تداول وهمية على بيانات تاريخية ولا تمثل أداءً فعلياً أو مستقبلياً. الاستثمار في الأوراق المالية ينطوي على مخاطر."*
4. **Visual segregation** from AI recommendations with labeled divider
5. **Opt-in only**: paper trading feature default OFF

### 8.3 Compliance Controls Summary

| Control | Implementation |
|---------|----------------|
| Data classification | Simulation data tagged internal_use_only=true in MinIO metadata |
| User export exclusion | PDPL export excludes internal_use_only=true objects |
| Access control | Backtest API only accessible from internal VPN/Kubernetes network |
| Audit trail | All backtest runs logged with created_by, run_id, timestamp |
| WORM separation | Simulation in bt-results bucket; production WORM in audit-worm (separate ACLs) |

---

## Appendix A — Glossary

| Term | Definition |
|------|------------|
| Look-Ahead Bias | Using information not available at the simulated decision point |
| Rule 40 | Tradeora's internal rule requiring available_from_ts filtering on all backtesting queries |
| available_from_ts | Timestamp data first became available in Tradeora's systems (NOT the event/report date) |
| Golden Dataset | 2-year archive of AI school recommendations with verified forward outcomes |
| Directional Accuracy | % of recommendations where predicted direction proved correct relative to EGX30TR |
| Brier Score | Mean squared error between predicted confidence and binary outcome; 0=perfect |
| Circuit Breaker | Automatic school exclusion after 3 consecutive months below 55% accuracy |
| EGX30TR | EGX30 Total Return Index including dividends; benchmark for all alpha measurement |
| VaR | Value at Risk — loss not expected to be exceeded at a given confidence level |
| CVaR / Expected Shortfall | Expected loss given that loss exceeds VaR; a coherent risk measure |
| Cholesky Decomposition | Matrix decomposition for generating correlated random returns in Monte Carlo |
| GBM | Geometric Brownian Motion — standard log-normal model for asset price paths |
| Paper Trading | Simulation of trades without real capital; Phase 2 feature requiring FRA approval |
| Alpha | Excess annualized return vs EGX30TR |
| Calmar Ratio | Annualized return divided by absolute maximum drawdown |
| Ulcer Index | Downside risk measure accounting for depth and duration of drawdowns |
| Information Ratio | Active return per unit of tracking error |

---

## Appendix B — Regulatory Cross-Reference

| Regulation | Article | Tradeora Implementation |
|------------|---------|-------------------------|
| FRA Decision No. 92/2022 | Art. 14 — AI System Auditability | Golden Dataset evaluation; monthly accuracy reports; full recommendation audit trail |
| FRA Decision No. 92/2022 | Art. 18 — Misleading Financial Promotion | Backtest results never displayed to users; internal_use_only flag |
| Egyptian Capital Market Law | Art. 47 — Misleading Statements | Constitutional constraint: simulation is not future performance guarantee |
| PDPL 2020 | Art. 30 — Data Portability | Simulation data excluded from user data exports |
| PDPL 2020 | Art. 25 — Data Retention | Simulation data retention 1-3 years (not subject to FRA 7-year rule) |
| EGX Market Rules | Rule 40 (ADR-0040) | Look-ahead bias prevention enforced via CI and code review |

---

*Document End — Simulation and Backtesting Framework v1.0.0*

---

> **Footer**  
> Tradeora Financial Operating System | Confidential — Internal Engineering  
> (c) 2026 Tradeora. All rights reserved.  
> For regulatory questions: compliance@tradeora.eg  
> For technical questions: platform-engineering@tradeora.eg
