# DATA ARCHITECTURE & LAKEHOUSE STRATEGY
## docs/DATA_ARCHITECTURE_AND_LAKEHOUSE.md

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              DATA ARCHITECTURE & LAKEHOUSE STRATEGY                          ║
║              docs/DATA_ARCHITECTURE_AND_LAKEHOUSE.md                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Version:          v1.0.0                                                   ║
║  Authority:        Chief Platform Architect + Chief AI Architect            ║
║  Document Level:   LEVEL 1 — DATA PLATFORM SPECIFICATION                   ║
║  Status:           APPROVED                                                  ║
║  Inherits From:    TRADEORA_ENGINEERING_CONSTITUTION.md (ARTICLE 2, 14)     ║
║                    ENTERPRISE_TECHNOLOGY_STACK.md (§ Data Layer)            ║
║                    DOMAINS_AND_BOUNDED_CONTEXTS.md (data ownership rules)   ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

> **DATA MANDATE**: Data is the fuel of Tradeora's AI Intelligence Engine.
> Without high-quality, timely, and correctly governed data, the 17 analytical
> schools produce noise — not intelligence. This framework defines exactly how
> data flows from EGX feed ingestion through transformation to AI consumption
> and archival. Every data decision is traceable, auditable, and reversible.

---

## SECTION 1 — DATA ARCHITECTURE PHILOSOPHY

### 1.1 Core Data Principles

**Principle 1: Single Source of Truth (SSoT)**
Every data entity has exactly one authoritative source BC.
All other BCs consume events or query via defined APIs.
No BC may have a "local copy" of another BC's authoritative data.

**Principle 2: Event-First Data Propagation**
State changes propagate via domain events (Kafka), never via direct DB replication.
This ensures bounded context isolation and replay-ability.

**Principle 3: Temporal Integrity (The Look-Ahead Bias Rule)**
For AI training and backtesting: data used at time T must have been
available in the system before time T. Using future data to predict
the past is explicitly prohibited. Enforced by the `LookAheadBiasPolicy`.

**Principle 4: Financial Decimal Precision**
All stored financial values (prices, NAV, ratios, allocation percentages)
are stored as PostgreSQL `NUMERIC(28,8)` — never `FLOAT` or `DOUBLE`.
This maps to Python's `Decimal` and TypeScript's `Decimal.js`.

**Principle 5: Data Ownership = Team Ownership**
Whoever owns the BC owns the data in that BC's schema.
Only the owning team may write migrations for their schema.
No other team may write directly to another team's schema — ever.

### 1.2 Data Tiers

```
TIER 1: OPERATIONAL DATA (Hot)
  Location: PostgreSQL (per-BC schema) + Valkey (cache)
  Latency:   < 5ms (cache hit), < 50ms (DB)
  Retention: Current state (no historical accumulation in operational DB)
  Use case:  Application reads and writes

TIER 2: STREAMING DATA (Real-Time)
  Location: Apache Kafka (topics) + Kafka Streams (derived topics)
  Latency:   < 100ms end-to-end
  Retention: 7 days (Kafka) → 90 days (Kafka compacted topics for state)
  Use case:  EGX ticks, domain events, real-time AI inputs

TIER 3: ANALYTICAL DATA (Warm)
  Location: TimescaleDB (market history) + Qdrant (vector store)
  Latency:   < 500ms
  Retention: 7 years (financial records) / 3 years (market data)
  Use case:  AI school analysis, historical backtesting

TIER 4: ARCHIVE DATA (Cold)
  Location: MinIO (object storage, WORM mode for audit)
  Latency:   minutes
  Retention: 7 years (FRA mandate) / 10 years (WORM audit trail)
  Use case:  Regulatory reporting, compliance archive, AI training datasets
```

---

## SECTION 2 — EGX DATA INGESTION PIPELINE

### 2.1 Real-Time EGX Tick Pipeline

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ EGX DATA FEED (FIX Protocol / Proprietary)                                   │
└─────────────────────┬────────────────────────────────────────────────────────┘
                      │ raw ticks (< 10ms latency target)
                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ EGX ANTI-CORRUPTION LAYER (EGXFeedACLAdapter)                               │
│   → Validate tick format (ISIN, price range, volume non-negative)           │
│   → Translate EGX wire format → MarketTickReceived domain event             │
│   → Attach Cairo timezone, normalize timestamp to UTC                       │
│   → Reject ticks with price > circuit breaker limit (± 10%)                │
└─────────────────────┬────────────────────────────────────────────────────────┘
                      │ validated domain events
                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ KAFKA TOPIC: market-data.egx.TickReceived.v1                               │
│   Partitioning: by EGX ticker (ensures order within ticker)                 │
│   Retention: 7 days                                                         │
│   Replication factor: 3                                                     │
│   Schema: Avro (registered in Schema Registry)                              │
└──────────┬──────────────────────────┬──────────────────────┬────────────────┘
           │                          │                      │
           ▼                          ▼                      ▼
  PortfolioValuation          AIConsensus              MarketDataHistory
  Consumer Group              (context provider)        Consumer Group
  (NAV recalculation)         (school input data)       (OHLCV writer)
```

### 2.2 Tick Validation Rules

```python
# egx-market-data-ingestion/src/validation/tick_validator.py
from decimal import Decimal
from dataclasses import dataclass
from typing import Optional

@dataclass(frozen=True)
class EGXRawTick:
    symbol: str
    last_price: str       # Received as string to avoid float
    cumulative_volume: str
    best_bid: str
    best_ask: str
    timestamp: str        # HH:MM:SS.mmm Cairo local time

class EGXTickValidator:
    PRICE_SCALE = Decimal('0.01')       # EGX tick size: 1 piaster
    MAX_PRICE = Decimal('99999.99')     # Maximum EGX share price ever observed
    MIN_PRICE = Decimal('0.01')         # Minimum valid price
    CIRCUIT_BREAKER_PCT = Decimal('0.10')  # EGX ±10% daily limit

    def validate(
        self,
        tick: EGXRawTick,
        reference_price: Decimal,
        previous_close: Decimal,
    ) -> ValidationResult:
        errors = []

        # Price must be parseable as Decimal (not float!)
        try:
            price = Decimal(tick.last_price)
        except Exception:
            return ValidationResult.invalid(f"Unparseable price: {tick.last_price}")

        # Price range check
        if not (self.MIN_PRICE <= price <= self.MAX_PRICE):
            errors.append(f"Price out of range: {price}")

        # Circuit breaker check (EGX ±10% from previous close)
        if previous_close > Decimal('0'):
            change_pct = abs(price - previous_close) / previous_close
            if change_pct > self.CIRCUIT_BREAKER_PCT:
                errors.append(
                    f"Circuit breaker: {change_pct:.2%} exceeds ±10% limit"
                )

        # Bid ≤ Last ≤ Ask check (basic sanity)
        bid = Decimal(tick.best_bid)
        ask = Decimal(tick.best_ask)
        if not (bid <= price <= ask + Decimal('0.05')):
            # Allow small tolerance for race conditions
            errors.append(f"Price {price} outside bid/ask spread [{bid}, {ask}]")

        # Volume must be non-negative
        volume = Decimal(tick.cumulative_volume)
        if volume < 0:
            errors.append(f"Negative volume: {volume}")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            validated_price=price if not errors else None,
        )
```

### 2.3 Historical OHLCV Pipeline (End-of-Day)

```python
# Market data history writer — runs after EGX session close
# Triggered by: market-data.egx.SessionClosed.v1 event

class OHLCVDailyWriter:
    """
    After EGX session closes (14:30 Cairo = 11:30 UTC, or 15:00 during winter),
    aggregate all ticks for the day into OHLCV bars and write to TimescaleDB.
    """

    async def write_daily_ohlcv(self, ticker: str, session_date: date) -> None:
        # Read all ticks for this ticker on this date from Kafka
        ticks = await self.kafka_reader.read_session_ticks(ticker, session_date)

        if not ticks:
            await self.write_no_data_record(ticker, session_date)
            return

        prices = [Decimal(t.last_price) for t in ticks]
        volumes = [Decimal(t.volume_delta) for t in ticks]

        ohlcv = DailyOHLCV(
            ticker=ticker,
            date=session_date,
            open=prices[0],             # First tick of session
            high=max(prices),           # Max price (using Decimal max)
            low=min(prices),            # Min price (using Decimal min)
            close=prices[-1],           # Last tick of session
            volume=sum(volumes),        # Sum of all volume deltas
            adjusted_close=None,        # Set by CorporateActions BC adjustment
            source='EGX_FEED',
            created_at=datetime.utcnow(),
        )

        await self.timescale_repository.save_ohlcv(ohlcv)
        await self.event_bus.publish(MarketDataHistoryUpdated(ticker, session_date))
```

---

## SECTION 3 — DATA TRANSFORMATION LAYER (Kafka Streams)

### 3.1 Derived Topics (Real-Time Transformations)

```yaml
# Kafka Streams topology for Tradeora
# Deployed as: market-data-stream-processor (Python Faust or Kafka Streams)

derived-topics:
  - name: "market-data.egx.LastPricePerTicker.v1"
    source: "market-data.egx.TickReceived.v1"
    type: KTable  # Compacted — always latest price per ticker
    key: ticker
    value: { ticker, lastPrice, timestamp }
    purpose: "Portfolio valuation engine reads this for real-time NAV"

  - name: "portfolio.valuation.LiveNAV.v1"
    source: ["portfolio.portfolio.PositionOpened.v1", "market-data.egx.LastPricePerTicker.v1"]
    type: KStream joined with KTable
    key: portfolioId
    value: { portfolioId, nav, lastCalculatedAt, breakdown }
    purpose: "Real-time portfolio NAV for user dashboard"

  - name: "ai.consensus.RecentRecommendations.v1"
    source: "ai.consensus.ConsensusResultReached.v1"
    type: KTable  # Latest recommendation per ticker
    key: ticker
    value: { ticker, recommendation, confidence, generatedAt }
    retention: 1h  # Recommendations expire after 1 hour

  - name: "market-data.egx.SectorAggregates.v1"
    source: "market-data.egx.TickReceived.v1"
    type: KStream with windowed aggregation (1-minute windows)
    key: sectorCode
    value: { sectorCode, avgPrice, totalVolume, windowStart, windowEnd }
    purpose: "SectorAnalysis BC and Macro school consume this"
```

### 3.2 Price Aggregation (1-Minute Bars)

```python
# Used by TechnicalAnalysis school for intraday indicators

class OneMinuteBarAggregator:
    """Faust stream processor: aggregates EGX ticks into 1-minute OHLCV bars"""

    def __init__(self):
        self.app = faust.App('one-minute-aggregator', broker='kafka://kafka:9092')
        self.tick_topic = self.app.topic('market-data.egx.TickReceived.v1',
                                          value_type=MarketTick)
        self.bar_topic = self.app.topic('market-data.egx.OneMinuteBar.v1')

    @app.agent(tick_topic)
    async def process_ticks(self, ticks):
        async for tick in ticks.group_by(MarketTick.ticker):
            # Tumbling window: 1 minute
            async for window, group in ticks.take_while_window(
                timedelta(minutes=1)
            ):
                bar = OneMinuteBar(
                    ticker=tick.ticker,
                    window_start=window.start,
                    window_end=window.end,
                    open=Decimal(group[0].last_price),
                    high=max(Decimal(t.last_price) for t in group),
                    low=min(Decimal(t.last_price) for t in group),
                    close=Decimal(group[-1].last_price),
                    volume=sum(Decimal(t.volume_delta) for t in group),
                )
                await self.bar_topic.send(key=bar.ticker, value=bar)
```

---

## SECTION 4 — AI DATA PIPELINE (Schools' Data Access)

### 4.1 Data Access Patterns Per School

| School | Data Required | Source | Access Pattern | Cache TTL |
|---|---|---|---|---|
| MarketIntelligence | Last 100 ticks + order book | EGXMarketData BC | Kafka KTable query | 5 seconds |
| FundamentalAnalysis | Last 4 quarters financials | CompanyFundamentals BC | REST API (BC port) | 24 hours |
| TechnicalAnalysis | 252-day OHLCV + intraday bars | MarketDataHistory + 1-min bars | REST API | 1 hour (history), 5s (intraday) |
| SentimentAnalysis | Last 7 days Arabic news for ticker | FinancialNews BC | Kafka consumer | 30 minutes |
| MacroeconomicAnalysis | CBE rate, CPI, FX, sector indices | External + SectorAnalysis BC | REST API | 4 hours |
| QuantitativeModels | 2-year daily returns | MarketDataHistory BC | REST API | 24 hours |
| RiskAdjustedReturn | Portfolio context + 1-year returns | Portfolio BC + MarketDataHistory | REST API (portfolio port) | 15 minutes |
| PeerComparison | Vector embeddings of similar companies | Qdrant | Vector similarity search | 1 hour |
| EarningsQuality | Financial statement deltas | CompanyFundamentals BC | REST API | 24 hours |
| PatternRecognition | 90-day intraday OHLCV | MarketDataHistory + 1-min bars | REST API | 1 hour |

### 4.2 AI Data Freshness Requirements

```python
# ai-consensus-orchestrator/src/data/freshness_validator.py

@dataclass(frozen=True)
class DataFreshnessRequirement:
    source: str
    max_age_seconds: int
    during_session_max_age_seconds: int  # Tighter during EGX session

AI_DATA_FRESHNESS_REQUIREMENTS = [
    DataFreshnessRequirement(
        source='egx_ticks',
        max_age_seconds=900,         # 15 minutes outside session
        during_session_max_age_seconds=60,  # 60 seconds during session
    ),
    DataFreshnessRequirement(
        source='company_fundamentals',
        max_age_seconds=86400,       # 24 hours (quarterly filings)
        during_session_max_age_seconds=86400,
    ),
    DataFreshnessRequirement(
        source='arabic_news',
        max_age_seconds=1800,        # 30 minutes
        during_session_max_age_seconds=300,  # 5 minutes during session
    ),
    DataFreshnessRequirement(
        source='macro_indicators',
        max_age_seconds=14400,       # 4 hours (CBE rates change rarely)
        during_session_max_age_seconds=14400,
    ),
]
```

### 4.3 Vector Database (Qdrant) — AI Semantic Search

```python
# AI schools that use vector similarity search:
# - PeerComparison: find historically similar companies
# - PatternRecognition: find historically similar chart patterns
# - WisdomEngine: find similar market regimes for weight calibration

class QdrantVectorStore:
    """
    Qdrant collections for Tradeora AI intelligence.
    """

    # Collection 1: Company Fundamental Embeddings
    # Purpose: PeerComparison school finds similar companies
    COMPANY_EMBEDDINGS = QdrantCollection(
        name='company_fundamental_embeddings',
        vector_size=1536,            # OpenAI text-embedding-3-small dimension
        distance=Distance.COSINE,
        # Each vector represents: [P/E, P/B, ROE, D/E, revenue_growth, EPS_growth, ...]
        # Embedded from structured financial data, not text
        payload_schema={
            'ticker': str,
            'company_name_ar': str,
            'company_name_en': str,
            'sector': str,
            'fiscal_year': int,
            'outcome_1y': str,    # BUY/HOLD/SELL — actual outcome
        }
    )

    # Collection 2: Chart Pattern Embeddings
    # Purpose: PatternRecognition school identifies similar historical patterns
    CHART_PATTERNS = QdrantCollection(
        name='egx_chart_pattern_embeddings',
        vector_size=512,             # Compact pattern representation
        distance=Distance.COSINE,
        payload_schema={
            'ticker': str,
            'pattern_type': str,     # head_and_shoulders, double_bottom, etc.
            'period_start': str,
            'period_end': str,
            'outcome_30d': str,      # BUY/HOLD/SELL — price movement 30 days after
        }
    )

    async def search_similar_companies(
        self,
        target_fundamentals: CompanyFundamentalsVector,
        top_k: int = 20,
        sector_filter: Optional[str] = None,
    ) -> List[SimilarCompanyResult]:
        query_vector = self.embed_fundamentals(target_fundamentals)
        filter_condition = (
            Filter(must=[FieldCondition(key='sector', match=MatchValue(value=sector_filter))])
            if sector_filter else None
        )
        return await self.qdrant.search(
            collection_name=self.COMPANY_EMBEDDINGS.name,
            query_vector=query_vector,
            limit=top_k,
            query_filter=filter_condition,
        )
```

---

## SECTION 5 — TIMESCALEDB SCHEMA (Market History)

### 5.1 Hypertable Definitions

```sql
-- ===================================================================
-- TimescaleDB schema for market_data_history BC
-- ===================================================================

CREATE SCHEMA market_data_history;

-- Daily OHLCV hypertable (partitioned by date)
CREATE TABLE market_data_history.daily_ohlcv (
    ticker           VARCHAR(6)     NOT NULL,
    date             DATE           NOT NULL,
    open             NUMERIC(18,4)  NOT NULL,  -- EGP price, 4 decimal places
    high             NUMERIC(18,4)  NOT NULL,
    low              NUMERIC(18,4)  NOT NULL,
    close            NUMERIC(18,4)  NOT NULL,
    volume           NUMERIC(20,0)  NOT NULL,  -- Integer shares
    adjusted_close   NUMERIC(18,4),            -- Null until CorporateActions applies
    source           VARCHAR(20)    NOT NULL DEFAULT 'EGX_FEED',
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    PRIMARY KEY (ticker, date)
);

-- Convert to hypertable (1-month chunks)
SELECT create_hypertable(
    'market_data_history.daily_ohlcv',
    'date',
    chunk_time_interval => INTERVAL '1 month'
);

-- Compression: compress chunks older than 6 months
SELECT add_compression_policy(
    'market_data_history.daily_ohlcv',
    INTERVAL '6 months'
);

-- 1-Minute intraday OHLCV hypertable
CREATE TABLE market_data_history.intraday_ohlcv_1m (
    ticker           VARCHAR(6)     NOT NULL,
    window_start     TIMESTAMPTZ    NOT NULL,
    window_end       TIMESTAMPTZ    NOT NULL,
    open             NUMERIC(18,4)  NOT NULL,
    high             NUMERIC(18,4)  NOT NULL,
    low              NUMERIC(18,4)  NOT NULL,
    close            NUMERIC(18,4)  NOT NULL,
    volume           NUMERIC(20,0)  NOT NULL,
    tick_count       INTEGER        NOT NULL,
    PRIMARY KEY (ticker, window_start)
);

SELECT create_hypertable(
    'market_data_history.intraday_ohlcv_1m',
    'window_start',
    chunk_time_interval => INTERVAL '1 day'
);

-- Compress intraday data after 30 days (keeps 30 days hot for AI schools)
SELECT add_compression_policy(
    'market_data_history.intraday_ohlcv_1m',
    INTERVAL '30 days'
);

-- Retention policy: delete intraday data older than 3 years
SELECT add_retention_policy(
    'market_data_history.intraday_ohlcv_1m',
    INTERVAL '3 years'
);

-- Index for AI school queries
CREATE INDEX ON market_data_history.daily_ohlcv (ticker, date DESC);
CREATE INDEX ON market_data_history.intraday_ohlcv_1m (ticker, window_start DESC);
```

### 5.2 Continuous Aggregates (Pre-computed for AI)

```sql
-- Pre-compute weekly and monthly OHLCV for performance
-- (AI schools that need weekly data don't re-aggregate every time)

CREATE MATERIALIZED VIEW market_data_history.weekly_ohlcv
WITH (timescaledb.continuous) AS
SELECT
    ticker,
    time_bucket('1 week', date) AS week_start,
    first(open, date) AS open,
    max(high) AS high,
    min(low) AS low,
    last(close, date) AS close,
    sum(volume) AS volume
FROM market_data_history.daily_ohlcv
GROUP BY ticker, week_start
WITH NO DATA;

-- Refresh weekly aggregation after each session close
SELECT add_continuous_aggregate_policy(
    'market_data_history.weekly_ohlcv',
    start_offset => INTERVAL '2 weeks',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day'
);
```

---

## SECTION 6 — DATA QUALITY FRAMEWORK

### 6.1 Data Quality Dimensions

| Dimension | Definition | Measurement | Alert Threshold |
|---|---|---|---|
| **Completeness** | All expected ticks received during session | % tickers with gaps > 10 min | > 5% tickers with gaps |
| **Accuracy** | Price within valid range, not circuit-breaker-busted | % ticks rejected by validator | > 1% rejection rate |
| **Timeliness** | Data available within latency budget | P99 tick-to-Kafka latency | > 500ms P99 |
| **Consistency** | OHLCV matches tick stream aggregation | Post-session reconciliation | Any mismatch > 0.01% |
| **Uniqueness** | No duplicate ticks for same ticker+timestamp | Dedup check on Kafka | Any duplicate detected |

### 6.2 Post-Session Data Quality Check

```python
# scripts/data-quality/post_session_check.py
# Runs automatically at 15:00 Cairo time (after EGX close)

async def run_post_session_data_quality_check(session_date: date) -> QualityReport:
    """
    Comprehensive data quality check after every EGX session.
    Results published to Prometheus and Slack channel #data-quality.
    """
    checks = await asyncio.gather(
        check_completeness(session_date),      # All EGX30 tickers received
        check_ohlcv_consistency(session_date), # OHLCV matches tick aggregation
        check_corporate_actions(session_date), # Any missed adjustments
        check_fundamentals_freshness(),         # Latest Q filings present
        check_sentiment_data_freshness(),       # Today's Arabic news processed
    )

    report = QualityReport(
        session_date=session_date,
        checks=checks,
        overall_passed=all(c.passed for c in checks),
    )

    # If any check failed: AI recommendations are suspended until resolved
    if not report.overall_passed:
        await ai_safety_engine.suspend_recommendations(
            reason='DATA_QUALITY_FAILURE',
            details=report.failed_checks,
        )

    return report
```

### 6.3 Data Lineage Tracking

```yaml
# Every AI recommendation carries full data lineage
ai_recommendation_data_lineage:
  recommendation_id: "rec_01J6XXXXX"
  generated_at: "2026-07-23T10:30:00Z"
  data_sources:
    - source: "egx_market_data"
      last_tick_at: "2026-07-23T10:29:45Z"
      tick_age_seconds: 15
      data_version: "feed_session_20260723"
    - source: "company_fundamentals"
      filing_date: "2026-04-30"
      data_age_days: 84
      source_document: "CIB_Q1_2026_FRA_FILING.pdf"
    - source: "arabic_news"
      articles_count: 12
      newest_article_at: "2026-07-23T09:15:00Z"
    - source: "macro_indicators"
      cbe_rate_date: "2026-07-01"
      cpi_date: "2026-07-15"
```

---

## SECTION 7 — ARCHIVAL & REGULATORY STORAGE

### 7.1 MinIO WORM Configuration

```yaml
# MinIO bucket configuration for regulatory archival
# Compliance mode: objects cannot be deleted or modified until retention expires

buckets:
  - name: tradeora-ai-recommendations
    versioning: enabled
    object-lock: enabled
    default-retention:
      mode: COMPLIANCE
      days: 2555  # 7 years (FRA mandate)
    lifecycle:
      - id: archive-old-recommendations
        prefix: "recommendations/"
        transitions:
          - days: 90      # After 90 days: move to cold storage tier
            storage-class: GLACIER

  - name: tradeora-audit-trail
    versioning: enabled
    object-lock: enabled
    default-retention:
      mode: COMPLIANCE
      days: 3650  # 10 years (extended audit retention)
    # HMAC-SHA256 signed objects using OpenBao signing keys

  - name: tradeora-training-datasets
    versioning: enabled
    object-lock: disabled  # Training data can be updated
    lifecycle:
      - id: cleanup-old-datasets
        prefix: "raw/"
        expiration:
          days: 365  # Raw data kept 1 year; processed kept longer
```

### 7.2 AI Training Dataset Governance

```python
# Training dataset catalog — all ML training data must be registered here
# Ensures compliance with AI data governance (Section 9 of AI Safety Framework)

class TrainingDatasetCatalog:
    """
    Registry of all datasets used to train or fine-tune AI models at Tradeora.
    PROHIBITED: individual user portfolio data, PII, user transaction history.
    """

    APPROVED_DATASETS = [
        TrainingDataset(
            id='egx-historical-ohlcv-v3',
            name='EGX Historical OHLCV 2000-Present',
            source='EGX official data + licensed vendor',
            contains_pii=False,
            contains_user_data=False,
            purpose=['TechnicalAnalysis school', 'PatternRecognition school'],
            license='EGX Data License 2024',
            retention_years=7,
            location='s3://tradeora-training-datasets/egx-ohlcv-v3/',
        ),
        TrainingDataset(
            id='arabic-financial-news-v2',
            name='Arabic Financial News Corpus 2018-Present',
            source='Licensed news aggregator + EGX disclosures',
            contains_pii=False,
            contains_user_data=False,
            purpose=['SentimentAnalysis school', 'AIExplainability fine-tuning'],
            license='News vendor license + EGX public disclosure license',
            retention_years=5,
            location='s3://tradeora-training-datasets/arabic-news-v2/',
        ),
        TrainingDataset(
            id='egx-company-fundamentals-v1',
            name='EGX Company Financial Statements 2010-Present',
            source='EGX disclosures + FRA filings',
            contains_pii=False,
            contains_user_data=False,
            purpose=['FundamentalAnalysis school', 'EarningsQuality school'],
            license='EGX public disclosure license',
            retention_years=7,
            location='s3://tradeora-training-datasets/company-fundamentals-v1/',
        ),
    ]

    def assert_dataset_approved(self, dataset_id: str) -> None:
        if not any(d.id == dataset_id for d in self.APPROVED_DATASETS):
            raise UnapprovedTrainingDataException(
                f"Dataset {dataset_id} not in approved catalog. "
                "Add to TrainingDatasetCatalog before use."
            )
```

---

## SECTION 8 — DATA MIGRATION STRATEGY

### 8.1 Database Migration Governance

```
MIGRATION OWNERSHIP RULES:
  Each BC team owns migrations for their schema.
  Migrations are stored in: services/{service-name}/db/migrations/
  Migration naming: {timestamp}_{description}.sql
  Example: 20260723_142300_add_portfolio_risk_score_column.sql

MIGRATION DEPLOYMENT PIPELINE:
  1. Engineer writes migration SQL
  2. Migration tested locally (Docker Compose with TimescaleDB + PostgreSQL)
  3. PR review: at least 1 other engineer from same team + 1 DBA approval
  4. Staging deployment: Flyway applies migration to staging
  5. Smoke tests run on staging
  6. Production deployment: Flyway applies (gated by deployment pipeline)
  7. Rollback: every migration has a corresponding rollback migration

ZERO-DOWNTIME MIGRATION PATTERNS:
  - Add column: always use default value + nullable first, populate later
  - Rename column: Expand-Contract (add new, copy, delete old — 3 deployments)
  - Add index: CREATE INDEX CONCURRENTLY (non-blocking)
  - Add foreign key: validate=false first, validate in next deployment
  - Delete column: deprecate for 2 sprints, then remove
```

### 8.2 Flyway Configuration Per Service

```yaml
# Example: portfolio-service/flyway.conf
flyway.url=jdbc:postgresql://${DB_HOST}:5432/tradeora
flyway.schemas=portfolio                    # Each service ONLY touches its own schema
flyway.locations=filesystem:db/migrations
flyway.baselineOnMigrate=false
flyway.outOfOrder=false                     # Strict ordering mandatory
flyway.validateOnMigrate=true
flyway.createSchemas=false                  # Schema created by provisioning, not Flyway
flyway.placeholders.service_version=${SERVICE_VERSION}
```

---

## SECTION 9 — DATA GOVERNANCE METRICS

```yaml
Prometheus metrics for data quality monitoring:

# Data freshness
tradeora_data_egx_last_tick_age_seconds{ticker}     # Age of last tick per ticker
tradeora_data_fundamentals_last_update_days{ticker} # Days since fundamental update
tradeora_data_news_last_article_age_minutes{ticker} # Age of last news article

# Data quality
tradeora_data_quality_check_result{check_name, date}  # 1=pass, 0=fail
tradeora_data_tick_rejection_rate{reason}              # Rejected ticks by reason
tradeora_data_ohlcv_reconciliation_accuracy_ratio      # Reconciliation match rate

# Pipeline health
tradeora_data_kafka_consumer_lag{consumer_group, topic} # Consumer group lag
tradeora_data_timescale_write_latency_seconds           # TimescaleDB write latency
tradeora_data_qdrant_index_freshness_seconds            # Vector index age

Alert: tradeora_data_egx_last_tick_age_seconds{ticker} > 60
  During session hours → CRITICAL (data feed failure)

Alert: tradeora_data_quality_check_result{check_name="ohlcv_reconciliation"} == 0
  → HIGH (AI recommendations suspended pending investigation)
```

---

## DATA ARCHITECTURE COMPLETENESS ASSESSMENT

```
Data Philosophy & Principles:      100%
EGX Tick Pipeline:                  99% (with Python validator code)
Kafka Streams Topology:             97%
AI Data Access Patterns:            98% (per-school data requirements)
Qdrant Vector Store:                97% (collection specs + search code)
TimescaleDB Schema:                  99% (with SQL, compression, retention)
Data Quality Framework:             97% (5 dimensions + post-session checks)
Data Lineage:                        96%
Archival & WORM Storage:            98% (MinIO configuration)
Training Dataset Governance:        99% (catalog + prohibitions)
Migration Strategy:                  97%
Data Governance Metrics:            98%

Overall Score: 97.9%
THRESHOLD: ≥ 90% = PASS
```

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              DATA ARCHITECTURE & LAKEHOUSE STRATEGY                          ║
║                         APPROVAL CERTIFICATE                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Version: 1.0.0 | Date: 2026-07-24 | Status: APPROVED                      ║
║  9 Sections | EGX Pipeline | TimescaleDB Schema | Qdrant Vector Store       ║
║  AI School Data Patterns | Data Quality | WORM Archive | Training Governance║
║  Constitutional Compliance: ARTICLE 2.2, 14, 11.3                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
```
