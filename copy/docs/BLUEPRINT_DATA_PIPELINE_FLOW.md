# BLUEPRINT: Data Ingestion & Pipeline Flow
**Document ID:** BLUEPRINT-DATA-PIPELINE-001  
**Version:** 1.0.0  
**Status:** ACTIVE  
**Authority:** Project Constitution Rule 40 (Look-Ahead Bias Prevention), Article 15 (Market Data Integrity)  
**Last Updated:** 2026-07-24  
**Classification:** INTERNAL — Architecture Team  
**Owner:** Data Engineering  

---

## Section 1 — Blueprint Authority & Scope

This blueprint defines the architecture and processes for ingesting, transforming, and serving financial data across the Tradeora Financial Operating System. It is strictly governed by the Tradeora Project Constitution.

### Constitutional Mandates

- **Rule 40 (Look-Ahead Bias Prevention):** This rule is the cornerstone of our backtesting integrity. It strictly prohibits any AI school or backtesting engine from consuming data before its `available_from_timestamp`. The pipeline guarantees that a realistic processing latency buffer is applied to all ingested data to simulate real-world availability. If data leaked into the future during training, models would learn false patterns, invalidating our entire strategy.
- **Article 15 (Market Data Integrity):** Market data is the lifeblood of the system. All incoming data streams must pass through rigorous, automated quality gates before they are allowed into the Serving Zone. Quarantines, staleness checks, and anomaly detection must be explicitly implemented at the ingestion layer. No unvalidated data shall ever reach the AI schools or portfolio management systems.

### Three Data Pipeline Types

1. **Real-time (streaming):** This pipeline handles EGX tick data (trades), bid/ask quotes (Level 1/2), and security status updates. It operates on a strict latency budget, targeting a P99 latency of <500ms from the exchange gateway to the Serving Zone. It utilizes FIX protocol over TCP for ingestion and Kafka for low-latency event distribution.
2. **Near-real-time (micro-batch):** This pipeline ingests financial news articles and corporate announcements. It operates in micro-batches (e.g., 1-to-5-minute intervals) via RSS polling and REST API consumption. It includes NLP steps like language detection, sentiment pre-scoring, and ticker entity extraction.
3. **Batch (EOD/historical):** This pipeline calculates aggregated metrics such as daily Open-High-Low-Close-Volume (OHLCV) and VWAP, processes fundamentals, and archives raw data to the data lake (MinIO). It is scheduled to run after the EGX market close (typically after 15:00 EGT).

### Data Sovereignty Mandate
All EGP-denominated data and Egyptian market operations must be processed within the Egypt cloud region to comply strictly with Egyptian data localization and sovereignty requirements. Data must not cross borders into external regions for processing.

### Out of Scope
- Non-EGX exchanges (e.g., NYSE, LSE) are deferred to Phase 2.
- Cryptocurrency markets and data feeds are explicitly excluded by the Tradeora constitution.

---

## Section 2 — Architecture Overview

The data architecture follows a modern event-driven, three-tier pipeline design to ensure reliability, scalability, and strict temporal tracking.

### Components and Roles

- **EGX Data Feed:** The primary source of market data, accessed via FIX protocol (Financial Information eXchange) and WebSocket connections.
- **Kafka:** The event streaming backbone. All pipeline data flows through Kafka topics, providing a durable, ordered, and decoupled integration layer.
- **TimescaleDB:** A high-performance time-series database (built as a PostgreSQL extension) used for storing raw tick data, quotes, and aggregated OHLCV metrics.
- **PostgreSQL:** The relational datastore for metadata, news articles, corporate actions, pipeline configuration, and application state.
- **MinIO:** An S3-compatible object storage system acting as our data lake, storing compressed Parquet files for long-term historical data archival and bulk analytics.
- **Apache Flink:** (Phase 2) Complex Event Processing (CEP) engine for real-time aggregations and advanced stream analytics.
- **Apache Spark:** (Phase 2) Distributed computing framework for large-scale batch processing, machine learning feature engineering, and massive historical backfills.
- **dbt:** The primary tool for SQL-based data transformations, executing ELT (Extract, Load, Transform) pipelines for fundamentals and business analytics within the database.
- **Great Expectations:** Our data quality and validation framework, running automated checks to enforce Article 15.
- **Apache Airflow:** The workflow orchestrator for scheduling, monitoring, and managing complex DAGs (Directed Acyclic Graphs) in the batch pipeline.
- **Confluent Schema Registry:** Centralized Avro schema management ensuring backward compatibility and strict contract enforcement for all Kafka messages.

### Three-Tier Pipeline Architecture

1. **Landing Zone:** The boundary layer where raw data enters the system from external sources (EGX FIX feed, news APIs, corporate filings). Data here is transient and unconformed.
2. **Processing Zone:** The transformation layer where data is normalized (e.g., decimal conversions, timestamp alignment), validated against Great Expectations, enriched (e.g., ISIN mapping), and routed.
3. **Serving Zone:** The presentation layer where consumer-ready, validated data rests in TimescaleDB, PostgreSQL, and Valkey cache, ready for low-latency queries by AI schools and trading modules.

### Architecture Diagram

```ascii
+-----------------+      +-----------------+      +--------------------+
|   EGX Gateway   |      |   News APIs     |      | Corporate Filings  |
+--------+--------+      +--------+--------+      +---------+----------+
         |                        |                         |
         v                        v                         v
+----------------------------------------------------------------------+
|                           LANDING ZONE                               |
|   +---------------+    +----------------+    +-------------------+   |
|   | FIX Handlers  |    |  RSS Fetchers  |    |  Scrapers/Uploads |   |
|   +-------+-------+    +--------+-------+    +---------+---------+   |
+-----------|---------------------|----------------------|-------------+
            |                     |                      |
            v                     v                      v
+----------------------------------------------------------------------+
|                           PROCESSING ZONE                            |
|                                                                      |
|  +----------------------------------------------------------------+  |
|  |                           KAFKA                                |  |
|  |  +---------------+  +---------------+  +--------------------+  |  |
|  |  | market.ticks  |  | news.ingested |  | corporate.actions  |  |  |
|  |  +---------------+  +---------------+  +--------------------+  |  |
|  +----------------------------------------------------------------+  |
|          |                      |                      |             |
|          v                      v                      v             |
|  +---------------+      +---------------+      +---------------+     |
|  | Quality Gate  |      | NLP Processor |      | Action Parser |     |
|  | (Great Expect)|      | (Sentiment)   |      | (Validation)  |     |
|  +-------+-------+      +-------+-------+      +-------+-------+     |
+----------|----------------------|----------------------|-------------+
           |                      |                      |
           v                      v                      v
+----------------------------------------------------------------------+
|                             SERVING ZONE                             |
|  +---------------+      +---------------+      +---------------+     |
|  |  TimescaleDB  |      |  PostgreSQL   |      |     MinIO     |     |
|  | (Ticks, OHLCV)|      | (News, State) |      | (Parquet Arch)|     |
|  +---------------+      +---------------+      +---------------+     |
+----------------------------------------------------------------------+
           |                      |                      |
           v                      v                      v
+----------------------------------------------------------------------+
|                             CONSUMERS                                |
|    AI Schools, Portfolio Managers, Alerting Engines, Dashboards      |
+----------------------------------------------------------------------+
```

---

## Section 3 — Real-Time Market Data Pipeline

### 3.1 Feed Ingestion

The ingestion layer uses a robust FIX 4.4 handler built with the QuickFIX engine to process market data directly from the EGX gateway.

```python
# egx_fix_handler.py
import quickfix as fix
from decimal import Decimal
from datetime import datetime
from zoneinfo import ZoneInfo
import kafka
import json
import uuid

EGYPT_TZ = ZoneInfo('Africa/Cairo')

class EGXFIXHandler(fix.Application):
    """
    FIX 4.4 handler for EGX market data feed.
    Message types processed:
    - Quote (35=S): Bid/Ask prices
    - Trade (35=V): Last trade prices  
    - Security Status (35=f): Circuit breaker signals
    - Trading Session Status (35=h): Session events
    """
    
    def __init__(self, kafka_producer, sequence_tracker, quality_checker):
        self.kafka = kafka_producer
        self.sequences = sequence_tracker
        self.quality = quality_checker
        self._last_sequence: dict[str, int] = {}  # ticker -> last seq num
    
    def onCreate(self, sessionID): 
        pass
    
    def onLogon(self, sessionID):
        # Feed connected - publish FeedConnected event
        self._publish_feed_event('CONNECTED', sessionID)
    
    def onLogout(self, sessionID):
        # Feed disconnected - trigger failover
        self._trigger_failover(sessionID)
    
    def onMessage(self, message, sessionID):
        msg_type_field = fix.MsgType()
        message.getHeader().getField(msg_type_field)
        msg_type = msg_type_field.getValue()
        
        handlers = {
            'S': self._handle_quote,    # Quote
            'V': self._handle_mass_quote,  # Mass Quote
            'f': self._handle_security_status,  # Security Status  
            'h': self._handle_trading_session_status,  # Trading Session Status
        }
        
        handler = handlers.get(msg_type)
        if handler:
            handler(message, sessionID)
    
    def _handle_quote(self, message, sessionID):
        # Extract fields
        symbol_field = fix.Symbol()          # Tag 55
        bid_px_field = fix.BidPx()           # Tag 132
        ask_px_field = fix.OfferPx()         # Tag 133
        bid_size_field = fix.BidSize()       # Tag 134
        ask_size_field = fix.OfferSize()     # Tag 135
        quote_id_field = fix.QuoteID()       # Tag 117 (sequence)
        transact_time_field = fix.TransactTime()  # Tag 60
        
        message.getField(symbol_field)
        message.getField(bid_px_field)
        message.getField(ask_px_field)
        message.getField(quote_id_field)
        message.getField(transact_time_field)
        
        ticker = symbol_field.getValue()
        seq_num = int(quote_id_field.getValue())
        
        # Sequence gap detection
        if not self._check_sequence(ticker, seq_num):
            self._handle_sequence_gap(ticker, seq_num)
            return
        
        # Price sanity check
        bid = Decimal(str(bid_px_field.getValue()))
        ask = Decimal(str(ask_px_field.getValue()))
        
        if not self.quality.validate_quote(ticker, bid, ask):
            self._quarantine_message(message, 'QUALITY_FAIL')
            return
        
        # Normalize to TickEvent
        tick_event = {
            'eventId': str(uuid.uuid4()),
            'eventType': 'market.egx.ticks.v1',
            'schemaVersion': '1.0.0',
            'occurredAt': datetime.now(EGYPT_TZ).isoformat(),
            'exchangeTimestamp': transact_time_field.getString(),
            'ingestionTimestamp': datetime.utcnow().isoformat() + 'Z',
            'payload': {
                'ticker': ticker,
                'isin': self.symbol_map.get_isin(ticker),
                'bidPrice': str(bid),
                'askPrice': str(ask),
                'bidSize': int(bid_size_field.getValue()) if bid_size_field else None,
                'askSize': int(ask_size_field.getValue()) if ask_size_field else None,
                'sequenceNumber': seq_num,
                'currency': 'EGP',
                'exchange': 'EGX'
            }
        }
        
        # Kafka publication (key=ticker for partition ordering)
        self.kafka.produce(
            topic='market.egx.ticks.v1',
            key=ticker.encode(),
            value=json.dumps(tick_event).encode(),
            callback=self._delivery_callback
        )
    
    def _check_sequence(self, ticker: str, seq_num: int) -> bool:
        last = self._last_sequence.get(ticker)
        if last is None:
            self._last_sequence[ticker] = seq_num
            return True
        if seq_num == last + 1:
            self._last_sequence[ticker] = seq_num
            return True
        if seq_num <= last:
            # Duplicate — discard
            return False
        # Gap detected (seq_num > last + 1)
        return False  # Will trigger gap handling
    
    def _handle_sequence_gap(self, ticker: str, received: int):
        expected = self._last_sequence.get(ticker, 0) + 1
        gap_event = {
            'ticker': ticker,
            'expected': expected,
            'received': received,
            'missing_count': received - expected,
            'detected_at': datetime.utcnow().isoformat() + 'Z'
        }
        # Publish gap event for monitoring
        self.kafka.produce('market.egx.SequenceGap.v1', json.dumps(gap_event).encode())
        # Request retransmission if possible
        self._request_retransmission(ticker, expected, received - 1)
```

### 3.2 Ticker Symbol Mapping

```python
# symbol_mapping.py
class EGXSymbolMapper:
    """Maps EGX ticker codes to ISIN and canonical identifiers."""
    
    # Example EGX tickers and their ISINs
    EGX_TO_ISIN = {
        'COMI': 'EGS30011C010',  # Commercial International Bank
        'TMGH': 'EGS65171C016',  # Talaat Moustafa Group
        'ETEL': 'EGS63201C012',  # Telecom Egypt
        'HRHO': 'EGS61041C018',  # El Sewedy Electric
        'SWDY': 'EGS30821C018',  # Suez Canal Bank
    }
    
    def get_isin(self, ticker: str) -> str | None:
        return self.EGX_TO_ISIN.get(ticker)
    
    def get_ticker(self, isin: str) -> str | None:
        return {v: k for k, v in self.EGX_TO_ISIN.items()}.get(isin)
```

### 3.3 Price Normalization (EGP Decimal)

```python
# CRITICAL: All monetary calculations MUST use Decimal, never float
from decimal import Decimal, ROUND_HALF_UP

class EGPPriceNormalizer:
    PIASTRE_SCALE = Decimal('0.01')  # 1 EGP = 100 piastres
    
    def normalize_fix_price(self, fix_price_str: str) -> Decimal:
        """Convert FIX price string to EGP Decimal."""
        # FIX prices may be in piastres or EGP depending on feed config
        raw = Decimal(fix_price_str)
        # Normalize to 4 decimal places for EGP
        return raw.quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)
    
    def validate_price_bounds(
        self, 
        ticker: str, 
        price: Decimal, 
        previous_close: Decimal
    ) -> bool:
        """Check price is within ±20% of previous close (EGX circuit breaker threshold)."""
        if previous_close == Decimal('0'):
            return True  # No reference price available
        
        change_pct = abs(price - previous_close) / previous_close * Decimal('100')
        return change_pct <= Decimal('20')  # ±20% maximum
```

### 3.4 Kafka Producer Configuration

Configured for maximum throughput, exactly-once delivery semantics, and extreme durability.

```python
# kafka_producer_config.py
from confluent_kafka import Producer

KAFKA_PRODUCER_CONFIG = {
    'bootstrap.servers': 'kafka-01.internal:9092,kafka-02.internal:9092,kafka-03.internal:9092',
    'acks': 'all',                    # Wait for all replicas
    'enable.idempotence': True,        # Exactly-once delivery
    'max.in.flight.requests.per.connection': 5,
    'linger.ms': 0,                    # No batching delay for real-time
    'compression.type': 'lz4',         # Fast compression
    'retries': 10,                     # Retry on transient failures
    'retry.backoff.ms': 100,
    'delivery.timeout.ms': 5000,       # 5 second delivery timeout
    'batch.size': 16384,               # 16KB batch size
    'buffer.memory': 33554432,         # 32MB buffer
    'schema.registry.url': 'http://schema-registry.internal:8081',
}

# For batch pipeline (high throughput, latency not critical)
KAFKA_BATCH_PRODUCER_CONFIG = {
    **KAFKA_PRODUCER_CONFIG,
    'linger.ms': 50,                   # 50ms batching for throughput
    'compression.type': 'snappy',
    'batch.size': 65536,               # 64KB batches
}
```

### 3.5 Consumer Architecture

The primary real-time consumers of `market.egx.ticks.v1` include:
1. **TimescaleDB Writer**: Persists every tick to the `price_ticks` hypertable.
2. **Price Alert Evaluator**: Continuously compares ticks against user-defined alert thresholds.
3. **NAV Calculation Trigger**: Calculates portfolio Net Asset Value in real-time when held stock prices move.
4. **Technical Analysis Signal Generator**: Accumulates ticks and updates real-time technical indicators (e.g., RSI, MACD).
5. **AI School Data Provider**: Feeds real-time data to inference engines, strictly honoring `availableFromTimestamp`.

TimescaleDB Writer Implementation:
```python
# timescaledb_tick_writer.py
from confluent_kafka import Consumer
import asyncpg
from decimal import Decimal
import json

class TimescaleDBTickWriter:
    TIMESCALEDB_DSN = 'postgresql://tradeora:secret@timescaledb.internal:5432/tradeora'
    CONSUMER_GROUP = 'timescaledb-tick-writer'
    BATCH_SIZE = 1000
    BATCH_TIMEOUT_MS = 100
    
    CREATE_HYPERTABLE_SQL = """
    CREATE TABLE IF NOT EXISTS price_ticks (
        id                  BIGSERIAL,
        ticker              TEXT NOT NULL,
        isin                TEXT,
        bid_price           NUMERIC(12, 4) NOT NULL,
        ask_price           NUMERIC(12, 4) NOT NULL,
        last_price          NUMERIC(12, 4),
        bid_size            INTEGER,
        ask_size            INTEGER,
        exchange_timestamp  TIMESTAMPTZ NOT NULL,
        ingestion_timestamp TIMESTAMPTZ NOT NULL,
        available_from      TIMESTAMPTZ NOT NULL,  -- Rule 40: look-ahead bias prevention
        currency            CHAR(3) NOT NULL DEFAULT 'EGP',
        exchange            TEXT NOT NULL DEFAULT 'EGX',
        sequence_number     BIGINT,
        is_stale            BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (id, exchange_timestamp)
    );
    
    -- Convert to TimescaleDB hypertable (partitioned by time)
    SELECT create_hypertable('price_ticks', 'exchange_timestamp', if_not_exists => TRUE);
    
    -- Create indices
    CREATE INDEX ON price_ticks (ticker, exchange_timestamp DESC);
    CREATE INDEX ON price_ticks (available_from);  -- For look-ahead bias queries
    """
    
    async def write_batch(self, ticks: list[dict]) -> int:
        """Batch insert ticks with COPY for maximum throughput."""
        records = [
            (
                t['payload']['ticker'],
                t['payload'].get('isin'),
                Decimal(t['payload']['bidPrice']),
                Decimal(t['payload']['askPrice']),
                t['payload'].get('lastPrice'),
                t['payload'].get('bidSize'),
                t['payload'].get('askSize'),
                t['exchangeTimestamp'],
                t['ingestionTimestamp'],
                t['availableFromTimestamp'],  # Rule 40
                t['payload'].get('currency', 'EGP'),
                t['payload'].get('exchange', 'EGX'),
                t['payload'].get('sequenceNumber'),
                t['payload'].get('isStale', False)
            )
            for t in ticks
        ]
        
        async with self.pool.acquire() as conn:
            await conn.copy_records_to_table(
                'price_ticks',
                records=records,
                columns=['ticker', 'isin', 'bid_price', 'ask_price', 
                        'last_price', 'bid_size', 'ask_size',
                        'exchange_timestamp', 'ingestion_timestamp', 
                        'available_from', 'currency', 'exchange',
                        'sequence_number', 'is_stale']
            )
        
        return len(records)
```

---

## Section 4 — Financial News Pipeline

### 4.1 News Sources

News sources are prioritized based on officiality and latency constraints.

```python
# news_source_config.py
NEWS_SOURCES = [
    {
        'id': 'al_borsa',
        'name': 'Al-Borsa News',
        'type': 'rss',
        'url': 'https://www.alborsaanews.com/feed',
        'language': 'ar',
        'poll_interval_seconds': 300,  # 5 minutes
        'priority': 1,
    },
    {
        'id': 'egx_announcements',
        'name': 'EGX Official Announcements',
        'type': 'rss',
        'url': 'https://www.egx.com.eg/en/rss.aspx',
        'language': 'ar',
        'poll_interval_seconds': 60,   # 1 minute (official source)
        'priority': 0,  # Highest priority
    },
    {
        'id': 'reuters_arabic',
        'name': 'Reuters Arabic',
        'type': 'api',
        'url': 'https://api.reuters.com/articles',
        'language': 'ar',
        'api_key_env': 'REUTERS_API_KEY',
        'poll_interval_seconds': 180,  # 3 minutes
        'priority': 2,
    },
]
```

### 4.2 News Processing Pipeline

```python
# news_pipeline.py
import hashlib
from langdetect import detect
from typing import Optional

class FinancialNewsPipeline:
    def process_article(self, raw_article: dict) -> Optional[ProcessedArticle]:
        # 1. Language detection
        detected_lang = detect(raw_article['content'])
        if detected_lang not in ('ar', 'en'):  # Only Arabic and English
            return None
        
        # 2. Deduplication (URL hash + content hash)
        url_hash = hashlib.sha256(raw_article['url'].encode()).hexdigest()
        content_hash = hashlib.sha256(raw_article['content'].encode()).hexdigest()
        
        if self.dedup_cache.exists(url_hash) or self.dedup_cache.exists(content_hash):
            return None  # Duplicate - skip
        
        # 3. Ticker mention extraction
        mentioned_tickers = self.ticker_extractor.extract(raw_article['content'])
        
        # 4. Sentiment pre-scoring (fast lexicon-based)
        sentiment_score = self.sentiment_scorer.score(raw_article['content'])
        
        # 5. Store and publish
        article = ProcessedArticle(
            id=str(uuid4()),
            url=raw_article['url'],
            url_hash=url_hash,
            content_hash=content_hash,
            title=raw_article['title'],
            content=raw_article['content'],
            language=detected_lang,
            source=raw_article['source'],
            published_at=raw_article['published_at'],
            ingested_at=datetime.utcnow(),
            mentioned_tickers=mentioned_tickers,
            sentiment_score=sentiment_score,
        )
        
        return article

class ArabicTickerExtractor:
    """Extracts EGX ticker mentions from Arabic financial text."""
    
    # Company name → ticker mapping (Arabic)
    ARABIC_NAME_MAP = {
        'كوميرشال انترناشيونال': 'COMI',
        'طلعت مصطفى': 'TMGH',
        'المصرية للاتصالات': 'ETEL',
        'السويدي إليكتريك': 'HRHO',
        'البنك التجاري الدولي': 'COMI',
    }
    
    def extract(self, text: str) -> list[str]:
        found_tickers = set()
        
        # Direct ticker code mention (e.g., COMI, TMGH)
        import re
        ticker_pattern = re.compile(r'\b[A-Z]{3,5}\b')
        for match in ticker_pattern.finditer(text):
            if match.group() in self.valid_tickers:
                found_tickers.add(match.group())
        
        # Arabic company name lookup
        for arabic_name, ticker in self.ARABIC_NAME_MAP.items():
            if arabic_name in text:
                found_tickers.add(ticker)
        
        return list(found_tickers)
```

---

## Section 5 — Corporate Actions Pipeline

Corporate actions inherently manipulate market structure (prices, shares outstanding). Careful processing and Rule 40 compliance are critical to prevent artificial price jumps or look-ahead biases.

```python
# corporate_action_processor.py
from enum import Enum
from decimal import Decimal

class CorporateActionType(str, Enum):
    DIVIDEND = 'DIVIDEND'
    STOCK_SPLIT = 'STOCK_SPLIT'
    REVERSE_SPLIT = 'REVERSE_SPLIT'
    RIGHTS_ISSUE = 'RIGHTS_ISSUE'
    MERGER = 'MERGER'
    ACQUISITION = 'ACQUISITION'
    DELISTING = 'DELISTING'
    SYMBOL_CHANGE = 'SYMBOL_CHANGE'

class CorporateActionProcessor:
    def process_stock_split(self, ticker: str, ratio: Decimal, ex_date: date):
        """
        Process a stock split. Example: 2:1 split means price halves, shares double.
        ratio = 2.0 means 2 new shares for every 1 old share.
        
        Look-ahead bias safe: adjustment only applied AFTER ex_date.
        Historical price adjustment: mark all historical prices with
        split_factor for retroactive adjustment IN DISPLAY ONLY.
        AI schools use price_adjusted field.
        """
        split_factor = ratio  # 2.0 for 2:1 split
        
        # Store adjustment factor (do NOT modify historical raw prices)
        adjustment = PriceAdjustment(
            ticker=ticker,
            adjustment_type=CorporateActionType.STOCK_SPLIT,
            ex_date=ex_date,
            factor=split_factor,
            announced_at=datetime.utcnow(),  # When WE received the announcement
            available_from=datetime.utcnow(),  # Rule 40: can only use after ingestion
        )
        
        self.adjustment_repo.save(adjustment)
        
        # Publish event for affected portfolio NAV recalculation
        self.kafka.produce('corporate.egx.CorporateActionAnnounced.v1', {
            'ticker': ticker,
            'action_type': CorporateActionType.STOCK_SPLIT.value,
            'ex_date': ex_date.isoformat(),
            'split_ratio': str(ratio),
            'announced_at': datetime.utcnow().isoformat(),
        })
    
    def get_adjusted_price(
        self, 
        ticker: str, 
        raw_price: Decimal, 
        price_date: date,
        as_of_date: date
    ) -> Decimal:
        """
        Return price adjusted for corporate actions that occurred
        between price_date and as_of_date.
        ONLY uses adjustments where announced_at <= as_of_date (Rule 40).
        """
        adjustments = self.adjustment_repo.get_adjustments(
            ticker=ticker,
            from_date=price_date,
            to_date=as_of_date,
            only_announced_before=as_of_date  # CRITICAL: Rule 40
        )
        
        adjusted = raw_price
        for adj in adjustments:
            if adj.adjustment_type == CorporateActionType.STOCK_SPLIT:
                adjusted = adjusted / adj.factor
            elif adj.adjustment_type == CorporateActionType.DIVIDEND:
                adjusted = adjusted - adj.dividend_per_share
        
        return adjusted.quantize(Decimal('0.0001'))
```

Dividend Adjustment Logic:
```python
def compute_dividend_adjusted_price(
    price: Decimal, 
    dividend_per_share: Decimal,
    dividend_yield_method: str = 'SUBTRACT'
) -> Decimal:
    """
    Standard dividend adjustment: subtract dividend from pre-dividend price.
    This eliminates the artificial price drop on ex-dividend date.
    MUST use Decimal for EGP calculations.
    """
    if dividend_yield_method == 'SUBTRACT':
        return (price - dividend_per_share).quantize(Decimal('0.0001'))
    elif dividend_yield_method == 'FACTOR':
        # Factor method: adjusted_price = price * (price - dividend) / price
        factor = (price - dividend_per_share) / price
        return (price * factor).quantize(Decimal('0.0001'))
    raise ValueError(f'Unknown dividend adjustment method: {dividend_yield_method}')
```

---

## Section 6 — Historical Data Batch Pipeline

### 6.1 EOD OHLCV Calculation

Executed continuously upon market close (15:30 EGT), this materializes tick-level data into highly efficient OHLCV rows for the day.

```python
# eod_ohlcv_calculator.py
from decimal import Decimal
from datetime import date
import asyncpg

class EODOHLCVCalculator:
    """
    Calculates daily OHLCV from tick data stored in TimescaleDB.
    Runs after 15:30 EGT (30 min after market close).
    """
    
    OHLCV_QUERY = """
    INSERT INTO daily_ohlcv (ticker, trading_date, open, high, low, close, volume, vwap, tick_count)
    SELECT 
        ticker,
        DATE(exchange_timestamp AT TIME ZONE 'Africa/Cairo') AS trading_date,
        FIRST(last_price, exchange_timestamp) AS open,
        MAX(last_price) AS high,
        MIN(last_price) AS low,
        LAST(last_price, exchange_timestamp) AS close,
        SUM(COALESCE(bid_size, 0) + COALESCE(ask_size, 0)) AS volume,
        SUM(last_price * (COALESCE(bid_size, 0) + COALESCE(ask_size, 0))) 
            / NULLIF(SUM(COALESCE(bid_size, 0) + COALESCE(ask_size, 0)), 0) AS vwap,
        COUNT(*) AS tick_count
    FROM price_ticks
    WHERE 
        DATE(exchange_timestamp AT TIME ZONE 'Africa/Cairo') = $1
        AND last_price IS NOT NULL
        AND is_stale = FALSE
    GROUP BY ticker, DATE(exchange_timestamp AT TIME ZONE 'Africa/Cairo')
    ON CONFLICT (ticker, trading_date) DO UPDATE SET
        open = EXCLUDED.open,
        high = EXCLUDED.high,
        low = EXCLUDED.low,
        close = EXCLUDED.close,
        volume = EXCLUDED.volume,
        vwap = EXCLUDED.vwap,
        tick_count = EXCLUDED.tick_count,
        calculated_at = NOW()
    """
    
    async def calculate_for_date(self, trading_date: date) -> dict:
        async with self.pool.acquire() as conn:
            result = await conn.execute(self.OHLCV_QUERY, trading_date)
            return {
                'trading_date': trading_date.isoformat(),
                'records_processed': result,
                'completed_at': datetime.utcnow().isoformat()
            }
```

### 6.2 dbt Transformations

```sql
-- models/staging/stg_egx_ticks.sql
{{ config(materialized='incremental', unique_key='id') }}

SELECT
    id,
    ticker,
    isin,
    bid_price::NUMERIC(12,4) AS bid_price,
    ask_price::NUMERIC(12,4) AS ask_price,
    last_price::NUMERIC(12,4) AS last_price,
    (bid_price + ask_price) / 2::NUMERIC(12,4) AS mid_price,
    exchange_timestamp,
    ingestion_timestamp,
    available_from,
    currency,
    exchange,
    sequence_number,
    is_stale
FROM {{ source('timescaledb', 'price_ticks') }}
{% if is_incremental() %}
WHERE ingestion_timestamp > (SELECT MAX(ingestion_timestamp) FROM {{ this }})
{% endif %}

-- models/marts/mart_daily_ohlcv.sql
{{ config(materialized='table') }}

SELECT
    o.*,
    e.company_name_ar,
    e.company_name_en,
    e.sector,
    e.market_cap_band,
    prev.close AS previous_close,
    ((o.close - prev.close) / prev.close * 100)::NUMERIC(6,2) AS daily_change_pct
FROM daily_ohlcv o
JOIN equity_master e ON o.ticker = e.ticker
LEFT JOIN daily_ohlcv prev 
    ON prev.ticker = o.ticker 
    AND prev.trading_date = (
        SELECT MAX(trading_date) 
        FROM daily_ohlcv 
        WHERE ticker = o.ticker AND trading_date < o.trading_date
    )
```

### 6.3 MinIO Parquet Archival

```python
# parquet_archiver.py
import pyarrow as pa
import pyarrow.parquet as pq
from minio import Minio
from io import BytesIO

class ParquetArchiver:
    BUCKET = 'market-data-archive'
    
    SCHEMA = pa.schema([
        pa.field('ticker', pa.string()),
        pa.field('isin', pa.string()),
        pa.field('bid_price', pa.decimal128(12, 4)),
        pa.field('ask_price', pa.decimal128(12, 4)),
        pa.field('last_price', pa.decimal128(12, 4)),
        pa.field('exchange_timestamp', pa.timestamp('us', tz='UTC')),
        pa.field('ingestion_timestamp', pa.timestamp('us', tz='UTC')),
        pa.field('available_from', pa.timestamp('us', tz='UTC')),
        pa.field('sequence_number', pa.int64()),
        pa.field('is_stale', pa.bool_()),
    ])
    
    def archive_day(self, trading_date: date, ticks: list[dict]) -> str:
        """Archive ticks to MinIO as Parquet, partitioned by year/month."""
        table = pa.Table.from_pylist(ticks, schema=self.SCHEMA)
        
        buffer = BytesIO()
        pq.write_table(
            table, 
            buffer,
            compression='snappy',
            use_dictionary=True,
        )
        buffer.seek(0)
        
        # Partition key: year=YYYY/month=MM/day=trading_date.parquet
        object_key = (
            f'year={trading_date.year}/'
            f'month={trading_date.month:02d}/'
            f'{trading_date.isoformat()}_ticks.parquet'
        )
        
        self.minio.put_object(
            self.BUCKET,
            object_key,
            buffer,
            length=buffer.getbuffer().nbytes,
            content_type='application/octet-stream'
        )
        
        return object_key
```

---

## Section 7 — Data Quality Framework

Great Expectations manages rigorous, verifiable constraints across the incoming pipeline.

```python
# great_expectations_config.py

# Quality checks for real-time tick data
TICK_DATA_EXPECTATIONS = [
    # Completeness
    {'expectation': 'expect_column_values_to_not_be_null', 
     'kwargs': {'column': 'ticker'}},
    {'expectation': 'expect_column_values_to_not_be_null',
     'kwargs': {'column': 'bid_price'}},
    {'expectation': 'expect_column_values_to_not_be_null',
     'kwargs': {'column': 'exchange_timestamp'}},
    
    # Validity
    {'expectation': 'expect_column_values_to_be_between',
     'kwargs': {'column': 'bid_price', 'min_value': 0.01, 'max_value': 50000}},
    {'expectation': 'expect_column_values_to_be_in_set',
     'kwargs': {'column': 'currency', 'value_set': ['EGP']}},
    
    # Consistency: ask >= bid
    {'expectation': 'expect_column_pair_values_A_to_be_greater_than_B',
     'kwargs': {'column_A': 'ask_price', 'column_B': 'bid_price'}},
    
    # Timeliness: exchange_timestamp within 60s of now
    {'expectation': 'expect_column_values_to_be_between',
     'kwargs': {'column': 'data_age_seconds', 'min_value': 0, 'max_value': 60}},
    
    # Accuracy: ticker must be in EGX master list
    {'expectation': 'expect_column_values_to_be_in_set',
     'kwargs': {'column': 'ticker', 'value_set': EGX_VALID_TICKERS}},
]

# Quality dimensions
QUALITY_DIMENSIONS = {
    'completeness': 'All required fields present and non-null',
    'consistency': 'ask_price >= bid_price, sequence numbers monotonic',  
    'accuracy': 'Prices within ±20% of previous close',
    'timeliness': 'Exchange timestamp within 60s of ingestion timestamp',
    'validity': 'Ticker in EGX master list, currency=EGP',
}

# Quarantine rules
QUARANTINE_RULES = [
    {
        'id': 'QR-001',
        'name': 'Negative price',
        'condition': 'bid_price <= 0 OR ask_price <= 0',
        'action': 'QUARANTINE',  # Not REJECT — preserve for investigation
        'severity': 'CRITICAL',
    },
    {
        'id': 'QR-002',
        'name': 'Price sanity violation (>20% move)',
        'condition': 'ABS((price - prev_close) / prev_close) > 0.20',
        'action': 'FLAG_FOR_REVIEW',
        'severity': 'WARNING',
    },
    {
        'id': 'QR-003',
        'name': 'Stale timestamp (>5 min old)',
        'condition': '(NOW() - exchange_timestamp) > INTERVAL 5 MINUTES',
        'action': 'MARK_STALE',
        'severity': 'WARNING',
    },
    {
        'id': 'QR-004',
        'name': 'Unknown ticker',
        'condition': 'ticker NOT IN egx_master_list',
        'action': 'QUARANTINE',
        'severity': 'ERROR',
    },
    {
        'id': 'QR-005',
        'name': 'Bid > Ask (crossed market)',
        'condition': 'bid_price > ask_price',
        'action': 'QUARANTINE',
        'severity': 'CRITICAL',
    },
]
```

```python
import great_expectations as gx

class DataQualityRunner:
    def run_tick_quality_check(self, batch: list[dict]) -> QualityResult:
        context = gx.get_context()
        ds = context.sources.add_pandas('tick_batch')
        da = ds.add_dataframe_asset('ticks')
        
        batch_req = da.build_batch_request(dataframe=pd.DataFrame(batch))
        checkpoint = context.get_checkpoint('tick_data_checkpoint')
        result = checkpoint.run(batch_request=batch_req)
        
        if not result.success:
            failed = [
                r for r in result.run_results.values()
                if not r['validation_result']['success']
            ]
            # Publish quality gate failure event
            self.kafka.produce('data.pipeline.QualityGateFailed.v1', {
                'pipeline': 'tick_ingestion',
                'failed_checks': len(failed),
                'timestamp': datetime.utcnow().isoformat()
            })
            
        return QualityResult(success=result.success, failures=failed)
```

---

## Section 8 — Look-Ahead Bias Prevention (Rule 40)

Strict temporal logic explicitly enforces separation of past and future during simulation and live trading. AI pipelines exclusively rely on `available_from_timestamp`.

```python
# rule40_temporal_isolation.py
from datetime import datetime, timedelta
from decimal import Decimal

PROCESSING_LATENCY_BUFFER = timedelta(seconds=5)  # 5 second conservative buffer

def compute_available_from_timestamp(ingestion_timestamp: datetime) -> datetime:
    """
    Rule 40: available_from_timestamp is the EARLIEST time an AI school
    may consume this data record.
    
    Formula: available_from = ingestion_timestamp + processing_latency_buffer
    
    This prevents look-ahead bias: an AI model cannot 'see' data before
    it would have been realistically available during backtesting.
    """
    return ingestion_timestamp + PROCESSING_LATENCY_BUFFER

def filter_for_backtesting(
    query_time: datetime,
    data_records: list[dict]
) -> list[dict]:
    """
    For backtesting environments: only return records where
    available_from_timestamp <= simulation_time.
    
    This is the critical enforcement point of Rule 40.
    """
    return [
        record for record in data_records
        if record['available_from_timestamp'] <= query_time
    ]

# SQL implementation for TimescaleDB
BACKTESTING_SAFE_QUERY = """
SELECT 
    ticker,
    bid_price,
    ask_price,
    last_price,
    exchange_timestamp,
    available_from  -- Only use this timestamp in backtesting
FROM price_ticks
WHERE 
    ticker = $1
    AND available_from <= $2  -- $2 = simulation_time (Rule 40 enforcement)
    AND exchange_timestamp >= $3
    AND exchange_timestamp <= $2  -- Also bound by exchange time
ORDER BY exchange_timestamp ASC
"""

# Unit test for Rule 40
def test_no_future_data_leak():
    """
    CRITICAL: This test must NEVER fail. It verifies that no future
    data can be consumed by AI schools during backtesting.
    """
    simulation_time = datetime(2026, 1, 15, 10, 0, 0)  # 10:00 AM Jan 15
    
    # Create a tick with ingestion_timestamp AFTER simulation_time
    future_tick = {
        'ticker': 'COMI',
        'ingestion_timestamp': datetime(2026, 1, 15, 11, 0, 0),  # 11:00 AM
        'available_from_timestamp': datetime(2026, 1, 15, 11, 0, 5),  # +5s
        'bid_price': Decimal('75.50'),
    }
    
    result = filter_for_backtesting(
        query_time=simulation_time,
        data_records=[future_tick]
    )
    
    assert len(result) == 0, 'RULE 40 VIOLATION: Future data leaked into backtesting!'
```

---

## Section 9 — Schema Registry

Avro schemas map explicit contracts between producers and consumers. Confluent Schema Registry strictly governs structural modifications.

### Schema Governance
- **Owner:** Data Engineering Team
- **Compatibility Mode:** BACKWARD (new schema iterations can effectively read older format data)
- **Schema Approval:** Any field removal or type change requires Architecture Review Board sign-off.
- **Schema Naming:** `{domain}.{entity}.{version}` (e.g., `market.TickEvent.v1`)

### Topic -> Schema Mapping

| Topic | Schema Subject | Compatibility | Owner |
|---|---|---|---|
| market.egx.ticks.v1 | market.TickEvent-value | BACKWARD | Data Engineering |
| market.egx.quotes.v1 | market.QuoteEvent-value | BACKWARD | Data Engineering |
| market.egx.PriceUpdated.v1 | market.PriceUpdated-value | BACKWARD | Data Engineering |
| market.egx.SessionStateChanged.v1 | market.SessionStateChanged-value | FULL | Platform Engineering |
| news.egx.FinancialNewsIngested.v1 | news.FinancialNewsIngested-value | BACKWARD | Data Engineering |
| corporate.egx.CorporateActionAnnounced.v1 | corporate.CorporateActionAnnounced-value | FULL | Data Engineering |
| data.pipeline.QualityGateFailed.v1 | data.QualityGateFailed-value | BACKWARD | Data Engineering |
| data.pipeline.BatchCompleted.v1 | data.BatchCompleted-value | BACKWARD | Data Engineering |

### Avro Schema Example for TickEvent
```json
{
  "type": "record",
  "name": "TickEvent",
  "namespace": "com.tradeora.market",
  "fields": [
    { "name": "eventId", "type": "string", "doc": "UUID v4" },
    { "name": "eventType", "type": "string", "default": "market.egx.ticks.v1" },
    { "name": "schemaVersion", "type": "string", "default": "1.0.0" },
    { "name": "occurredAt", "type": "string", "doc": "ISO-8601 UTC timestamp" },
    { "name": "exchangeTimestamp", "type": "string", "doc": "Timestamp from EGX exchange" },
    { "name": "ingestionTimestamp", "type": "string", "doc": "When Tradeora received data" },
    { "name": "availableFromTimestamp", "type": "string", "doc": "Rule 40: earliest AI consumption time" },
    { "name": "ticker", "type": "string" },
    { "name": "isin", "type": ["null", "string"], "default": null },
    { "name": "bidPrice", "type": "string", "doc": "Decimal as string, EGP" },
    { "name": "askPrice", "type": "string", "doc": "Decimal as string, EGP" },
    { "name": "lastPrice", "type": ["null", "string"], "default": null },
    { "name": "bidSize", "type": ["null", "int"], "default": null },
    { "name": "askSize", "type": ["null", "int"], "default": null },
    { "name": "sequenceNumber", "type": "long" },
    { "name": "currency", "type": "string", "default": "EGP" },
    { "name": "exchange", "type": "string", "default": "EGX" },
    { "name": "isStale", "type": "boolean", "default": false }
  ]
}
```

---

## Section 10 — Complete Kafka Topic Catalog

Kafka Topics structure the nervous system of Tradeora.

| Topic | Partitions | Retention | Compacted | Schema | Producers | Consumers |
|---|---|---|---|---|---|---|
| market.egx.ticks.v1 | 30 (by ticker) | 7 days | No | TickEvent | EGXFeedIngestion | TimescaleWriter, PriceAlertEval, NAVCalc, TechnicalAnalysis, AISchool |
| market.egx.quotes.v1 | 30 (by ticker) | 1 day | No | QuoteEvent | EGXFeedIngestion | PriceDisplay, WebSocket push |
| market.egx.PriceUpdated.v1 | 30 (by ticker) | 7 days | No | PriceUpdated | NormalizationService | Portfolio, Alerts, NAV |
| market.egx.SessionStateChanged.v1 | 1 | 30 days | Yes | SessionStateChanged | MarketScheduleService | All services |
| market.egx.InstrumentHalted.v1 | 10 | 7 days | No | InstrumentHalted | CircuitBreakerHandler | AIEngine, AlertEval |
| market.egx.SequenceGap.v1 | 1 | 7 days | No | SequenceGap | EGXFeedIngestion | DataQuality, Ops |
| news.egx.FinancialNewsIngested.v1 | 10 | 30 days | No | FinancialNewsIngested | NewsPipeline | AISentiment, AlertEval, Commentary |
| corporate.egx.CorporateActionAnnounced.v1 | 5 | 365 days | No | CorporateActionAnnounced | CorporateActionPipeline | PortfolioNAV, AlertEval, NotificationDelivery |
| data.pipeline.QualityGateFailed.v1 | 1 | 30 days | No | QualityGateFailed | DataQuality | Ops, Alerting |
| data.pipeline.BatchCompleted.v1 | 1 | 30 days | No | BatchCompleted | Airflow | Downstream batch jobs |
| data.pipeline.BatchJobTriggered.v1 | 1 | 7 days | No | BatchJobTriggered | MarketScheduleService | Airflow DAG triggers |

### Partitioning & Ordering Strategy
Real-time topics (e.g. `market.egx.ticks.v1`) partition heavily by `ticker`. This guarantees strict chronological sequence delivery for any given stock, allowing technical analysis nodes to trust relative time progression and averting race conditions during sequential quote matching. 

---

## Section 11 — Complete JSON/Avro Schemas

### TickEvent
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "market.egx.ticks.v1",
  "schemaVersion": "1.0.0",
  "occurredAt": "2026-07-24T09:35:12.456789Z",
  "exchangeTimestamp": "2026-07-24T09:35:12.123456+02:00",
  "ingestionTimestamp": "2026-07-24T07:35:12.234567Z",
  "availableFromTimestamp": "2026-07-24T07:35:17.234567Z",
  "payload": {
    "ticker": "COMI",
    "isin": "EGS30011C010",
    "bidPrice": "75.4500",
    "askPrice": "75.5000",
    "lastPrice": "75.4750",
    "bidSize": 5000,
    "askSize": 3000,
    "sequenceNumber": 184729342,
    "currency": "EGP",
    "exchange": "EGX",
    "isStale": false
  }
}
```

### PriceUpdated
```json
{
  "eventId": "8f8b88d3-52dc-4682-a0ce-f5979bb87265",
  "eventType": "market.egx.PriceUpdated.v1",
  "schemaVersion": "1.0.0",
  "occurredAt": "2026-07-24T09:35:12.800000Z",
  "payload": {
    "ticker": "TMGH",
    "oldPrice": "28.5000",
    "newPrice": "28.6000",
    "priceChangePct": "0.3508",
    "updatedAt": "2026-07-24T09:35:12.800000Z"
  }
}
```

### FinancialNewsIngested
```json
{
  "eventId": "3c983d95-88af-48bc-a61f-6a56e7e0eecf",
  "eventType": "news.egx.FinancialNewsIngested.v1",
  "schemaVersion": "1.0.0",
  "occurredAt": "2026-07-24T09:35:12.456789Z",
  "payload": {
    "articleId": "art_19034",
    "urlHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "title": "Egyptian Central Bank announces unexpected rate hike",
    "language": "en",
    "source": "reuters_arabic",
    "publishedAt": "2026-07-24T09:30:00Z",
    "ingestedAt": "2026-07-24T09:35:05Z",
    "mentionedTickers": ["COMI", "ADIB"],
    "sentimentScore": -0.65
  }
}
```

### CorporateActionAnnounced
```json
{
  "eventId": "12f1e621-c42a-46da-b09e-711bf3f29517",
  "eventType": "corporate.egx.CorporateActionAnnounced.v1",
  "schemaVersion": "1.0.0",
  "occurredAt": "2026-07-24T09:35:12.456789Z",
  "payload": {
    "ticker": "ETEL",
    "actionType": "DIVIDEND",
    "exDate": "2026-08-10",
    "dividendPerShare": "1.2500",
    "splitRatio": null,
    "announcedAt": "2026-07-24T09:00:00Z"
  }
}
```

---

## Section 12 — Sequence Diagrams (ASCII)

### 1. Real-Time Tick Pipeline (End-to-End)
```ascii
EGX Feed    FIXHandler    QualityCheck    Kafka              TimescaleDB    PriceAlert
   |            |               |            |                    |              |
   |--FIX Msg-->|               |            |                    |              |
   |            |--validate---->|            |                    |              |
   |            |<--pass--------|            |                    |              |
   |            |--produce----->|market.egx.ticks.v1              |              |
   |            |               |            |--consume---------->|              |
   |            |               |            |                    |--INSERT----  |
   |            |               |            |--consume------------------------>|
   |            |               |            |                    |             |--eval alert-|
                                                                  Total < 500ms
```

### 2. EOD Batch Pipeline (Airflow Orchestrated)
```ascii
Airflow     TimescaleDB      PostgreSQL (dbt)        MinIO (Archival)      Kafka
   |             |                   |                     |                 |
   |--trigger--->| (15:30 EGT)       |                     |                 |
   |             |--OHLCV Calc-------|                     |                 |
   |             |<--Success---------|                     |                 |
   |--dbt run--->|                   |                     |                 |
   |             |                   |--stg_ticks--------->|                 |
   |             |                   |--mart_daily_ohlcv-->|                 |
   |             |<--Success---------|                     |                 |
   |--archive--->|                   |                     |                 |
   |             |--fetch ticks--------------------------->|                 |
   |             |                   |                     |--write parquet->|
   |             |<--Success-------------------------------|                 |
   |--notify---->|                   |                     |                 |--BatchCompleted->
```

### 3. Corporate Action Processing
```ascii
CorporateFeed    ActionProcessor   AdjustmentRepo    Kafka         NAV Calc Engine
   |                  |                  |             |                  |
   |--Announcement--->|                  |             |                  |
   |                  |--Parse & Verify->|             |                  |
   |                  |                  |--Save Adj-->|                  |
   |                  |                  |<--Ack-------|                  |
   |                  |--Publish Evt------------------>|CorpActAnnounced  |
   |                  |                  |             |--consume-------->|
   |                  |                  |             |                  |--Recalculate NAV-|
```

---

## Section 13 — Failure Modes

| # | Failure | Detection | Response | Recovery | SLO Impact |
|---|---|---|---|---|---|
| 1 | EGX primary feed disconnected | TCP keepalive timeout (30s) | Failover to backup feed within 5s | Reconnect attempt every 30s | Feed SLO: <30s gap |
| 2 | Schema registry unavailable | Producer exception | Cache last known schemas locally | Registry recovery | Possible schema mismatch |
| 3 | TimescaleDB disk full | PostgreSQL error pg_full | Pause writes, alert ops, increase volume | Disk expansion | Tick data loss |
| 4 | Kafka broker failure (1 of 3) | Kafka metadata refresh | Producer retries to surviving brokers | Broker recovery | Slight latency increase |
| 5 | Data quality gate failure | GE validation result | Quarantine batch, alert ops, continue pipeline | Data review | Quarantined data not served |
| 6 | Sequence gap detected | Sequence counter | Request retransmission, mark gap in monitoring | EGX retransmit | Possible tick data gap |
| 7 | News API rate limited | HTTP 429 | Exponential backoff, use cached articles | Time-based retry | News delay |
| 8 | Corporate action feed unavailable | HTTP 5xx | Manual entry mode, alert ops | Feed recovery | Corporate actions delayed |
| 9 | EOD batch pipeline fails | Airflow task failure | Retry 3x, then alert, trigger manual run | Manual operator run | OHLCV calculation delayed |
| 10 | Rule 40 violation detected | Test assertion fails | CRITICAL alert, stop AI school training | Fix data pipeline | AI school training halted |
| 11 | MinIO archival fails | S3 error | Queue for retry, keep data in TimescaleDB | MinIO recovery | Archival delayed |
| 12 | Kafka consumer lag spike | Prometheus alert | Scale out consumer instances horizontally | Pod scaling | Temporary latency increase |

---

## Section 14 — Performance Budget

```yaml
pipeline_slos:
  real_time_tick_pipeline:
    end_to_end_latency:
      target_p50: 50ms
      target_p99: 500ms
      target_p999: 1000ms
      measurement: kafka_consumer_lag_ms + write_time
      alert: p99 > 500ms for 1 minute
    
    throughput:
      target_ticks_per_second: 100000
      target_kafka_mb_per_second: 100
      timescaledb_writes_per_second: 50000
      alert: throughput < 80000 tps
  
  news_pipeline:
    freshness:
      target: article_available_within 5 minutes of publication
      measurement: news_ingested_at - article_published_at
      alert: >10 minutes delay
  
  batch_pipeline:
    eod_ohlcv_completion:
      target: completed by 17:00 EGT (2 hours after market close)
      measurement: batch_completed_at - session_closed_at
      alert: not completed by 17:30 EGT
    
    archival:
      target: Parquet archived by 20:00 EGT
      measurement: archival_completed_at
      alert: not archived by 22:00 EGT
```

TimescaleDB tuning parameters:
```sql
-- TimescaleDB chunk interval: 1 hour (matches EGX session)
SELECT set_chunk_time_interval('price_ticks', INTERVAL '1 hour');

-- Compression policy (compress chunks older than 7 days)
SELECT add_compression_policy('price_ticks', INTERVAL '7 days');

-- Continuous aggregate for 1-minute OHLCV
CREATE MATERIALIZED VIEW ohlcv_1min
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', exchange_timestamp) AS bucket,
    ticker,
    FIRST(last_price, exchange_timestamp) AS open,
    MAX(last_price) AS high,
    MIN(last_price) AS low,
    LAST(last_price, exchange_timestamp) AS close,
    SUM(bid_size + ask_size) AS volume
FROM price_ticks
WHERE is_stale = FALSE
GROUP BY bucket, ticker;

-- Refresh policy: every 1 minute
SELECT add_continuous_aggregate_policy('ohlcv_1min',
    start_offset => INTERVAL '2 minutes',
    end_offset => INTERVAL '1 second',
    schedule_interval => INTERVAL '1 minute'
);
```

---

## Section 15 — SLO Compliance

Alerting integration via Prometheus and PromQL to guarantee service levels.

```promql
# P99 end-to-end tick latency
alert: TickPipelineLatencySLOBreach
expr: |
  histogram_quantile(0.99, 
    rate(tick_end_to_end_latency_seconds_bucket[5m])
  ) > 0.5
for: 1m
labels: { severity: critical, pipeline: tick }
annotations:
  summary: "Tick pipeline P99 latency exceeds 500ms SLO"
  description: "P99 latency is {{ $value }}s"

# Data freshness
alert: MarketDataStale
expr: |
  (time() - market_data_last_tick_timestamp_seconds{exchange="EGX"}) > 60
  and market_session_state{exchange="EGX"} == 2  # 2 = OPEN
for: 30s
labels: { severity: critical }
annotations:
  summary: "EGX market data stale: no tick received in 60 seconds during OPEN session"

# Pipeline uptime
alert: PipelineUptimeSLOBreach
expr: |
  (
    1 - (
      rate(pipeline_downtime_seconds_total{pipeline="tick_ingestion"}[1h]) /
      3600
    )
  ) < 0.9995
for: 5m
labels: { severity: critical }
annotations:
  summary: "Tick ingestion pipeline uptime below 99.95% SLO"

# Kafka consumer lag
alert: KafkaConsumerLagHigh
expr: kafka_consumer_group_lag{topic="market.egx.ticks.v1"} > 10000
for: 2m
labels: { severity: warning }

# Batch pipeline completion
alert: EODBatchNotCompleted
expr: |
  (time() > 54000)  # 15:00 UTC = market close
  and pipeline_batch_completed{pipeline="eod_ohlcv"} == 0
for: 7200s  # Alert if not done 2 hours after close
labels: { severity: critical }
```

---

## Section 16 — Observability

Deep observability via Prometheus metrics instrumentation.

```python
# pipeline_metrics.py
from prometheus_client import Counter, Histogram, Gauge

# Tick ingestion throughput
tick_ingestion_total = Counter(
    'tick_ingestion_total',
    'Total ticks ingested from EGX feed',
    ['exchange', 'ticker']
)

# End-to-end latency
tick_end_to_end_latency_seconds = Histogram(
    'tick_end_to_end_latency_seconds',
    'Latency from exchange_timestamp to TimescaleDB write completion',
    ['exchange'],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)

# Kafka consumer lag
kafka_consumer_lag = Gauge(
    'kafka_consumer_group_lag',
    'Current Kafka consumer group lag',
    ['topic', 'consumer_group', 'partition']
)

# Data quality metrics
data_quality_failures_total = Counter(
    'data_quality_failures_total',
    'Data quality gate failures by rule',
    ['pipeline', 'rule_id', 'severity']
)

# Sequence gaps
sequence_gaps_total = Counter(
    'sequence_gaps_total',
    'FIX message sequence gaps detected',
    ['exchange', 'ticker']
)

# Feed connectivity
feed_connected = Gauge(
    'market_feed_connected',
    'Whether the market data feed is connected (1=yes, 0=no)',
    ['exchange', 'feed_type']  # feed_type: primary/backup
)

# Batch pipeline
batch_pipeline_duration_seconds = Histogram(
    'batch_pipeline_duration_seconds',
    'Duration of EOD batch pipeline execution',
    ['pipeline_name'],
    buckets=[60, 300, 600, 1800, 3600, 7200]
)

# Last tick timestamp (for freshness)
market_data_last_tick_timestamp_seconds = Gauge(
    'market_data_last_tick_timestamp_seconds',
    'Unix timestamp of last tick received from exchange',
    ['exchange', 'ticker']
)
```

### Grafana Dashboard Panels
1. **Pipeline Health Overview**: Real-time status of all pipeline components (green/yellow/red).
2. **Tick Throughput**: Ticks/second per ticker, time series, trailing 1 hour.
3. **End-to-End Latency**: P50/P95/P99 latency histogram, real-time calculation.
4. **Kafka Consumer Lag**: Lag per consumer group, alert threshold lines drawn in red.
5. **Data Quality Failure Rate**: Failures/minute mapped by rule ID.
6. **Feed Connectivity**: Primary/backup feed status discrete state chart over time.
7. **Data Freshness Heatmap**: All active tickers, color graded by seconds since last tick.
8. **Batch Pipeline Timeline**: Gantt chart visualization of EOD batch job task dependencies and duration.

---

## Section 17 — Test Strategy

```python
# test_fix_message_parsing.py
import pytest
from decimal import Decimal
import time
from datetime import datetime, timedelta

class TestFIXMessageParsing:
    def test_quote_message_parsed_correctly(self, fix_handler):
        # Create a synthetic FIX Quote message
        message = fix.Message()
        message.getHeader().setField(fix.MsgType('S'))  # Quote
        message.setField(fix.Symbol('COMI'))
        message.setField(fix.BidPx(75.45))
        message.setField(fix.OfferPx(75.50))
        message.setField(fix.QuoteID('184729342'))
        
        tick = fix_handler._handle_quote(message, session_id)
        
        assert tick['payload']['ticker'] == 'COMI'
        assert tick['payload']['bidPrice'] == '75.4500'  # Decimal string
        assert tick['payload']['askPrice'] == '75.5000'
    
    def test_crossed_market_rejected(self, fix_handler, quality_checker):
        # bid > ask = crossed market, should be quarantined
        message = fix.Message()
        message.setField(fix.BidPx(76.00))  # Bid HIGHER than Ask
        message.setField(fix.OfferPx(75.50))
        
        with pytest.raises(DataQualityException):
            fix_handler._handle_quote(message, session_id)
    
    def test_price_normalization_uses_decimal(self, normalizer):
        # CRITICAL: verify no float arithmetic
        result = normalizer.normalize_fix_price('75.45')
        assert isinstance(result, Decimal)
        assert result == Decimal('75.4500')
    
    def test_sequence_gap_detected(self, fix_handler):
        fix_handler._last_sequence['COMI'] = 100
        is_valid = fix_handler._check_sequence('COMI', 102)  # Missing 101
        assert is_valid is False

class TestRule40LookAheadBias:
    def test_future_data_not_served_in_backtest(self):
        simulation_time = datetime(2026, 1, 15, 10, 0, 0)
        
        future_tick = {
            'available_from_timestamp': datetime(2026, 1, 15, 11, 0, 0)
        }
        
        result = filter_for_backtesting(simulation_time, [future_tick])
        assert len(result) == 0, 'RULE 40 VIOLATION'
    
    def test_current_data_served_in_backtest(self):
        simulation_time = datetime(2026, 1, 15, 10, 0, 0)
        
        past_tick = {
            'available_from_timestamp': datetime(2026, 1, 15, 9, 0, 0)
        }
        
        result = filter_for_backtesting(simulation_time, [past_tick])
        assert len(result) == 1
    
    def test_available_from_is_ingestion_plus_buffer(self):
        ingestion_time = datetime(2026, 7, 24, 9, 35, 12)
        available_from = compute_available_from_timestamp(ingestion_time)
        
        assert available_from == datetime(2026, 7, 24, 9, 35, 17)  # +5 seconds

@pytest.mark.integration
class TestFullPipelineIntegration:
    def test_tick_end_to_end_within_500ms(self, kafka_container, timescaledb_container):
        """
        Integration test: inject a FIX message and verify it appears
        in TimescaleDB within 500ms.
        """
        start = datetime.utcnow()
        
        # Inject FIX message
        fix_handler.inject_test_message('COMI', bid=Decimal('75.45'), ask=Decimal('75.50'))
        
        # Wait for TimescaleDB write (poll every 10ms, max 600ms)
        deadline = start + timedelta(milliseconds=600)
        while datetime.utcnow() < deadline:
            result = timescaledb.query(
                "SELECT * FROM price_ticks WHERE ticker='COMI' AND ingestion_timestamp >= $1",
                start
            )
            if result:
                latency_ms = (datetime.utcnow() - start).total_seconds() * 1000
                assert latency_ms < 500, f'Pipeline latency {latency_ms}ms exceeds 500ms SLO'
                return
            time.sleep(0.01)
        
        pytest.fail('Tick not written to TimescaleDB within 600ms')

@pytest.mark.load
class TestPipelineLoad:
    def test_100k_ticks_per_second_throughput(self):
        """
        Load test: replay 100,000 ticks/second and verify system handles it.
        """
        TARGET_TPS = 100_000
        TEST_DURATION_SECONDS = 10
        
        generator = TickReplayGenerator(tps=TARGET_TPS)
        metrics = generator.run_for_seconds(TEST_DURATION_SECONDS)
        
        assert metrics.actual_tps >= TARGET_TPS * 0.95  # Allow 5% variance
        assert metrics.dropped_messages == 0
        assert metrics.p99_latency_ms < 500

@pytest.mark.chaos
class TestChaosScenarios:
    def test_feed_disconnection_triggers_failover(self, feed_simulator):
        # Kill primary feed
        feed_simulator.disconnect_primary()
        
        # Wait for failover (max 10 seconds)
        failover_detected = wait_for(
            condition=lambda: feed_simulator.backup_is_active(),
            timeout=timedelta(seconds=10)
        )
        
        assert failover_detected, 'Failover to backup feed not detected within 10 seconds'
    
    def test_schema_registry_restart(self, schema_registry_container):
        schema_registry_container.restart()
        # Producer should use cached schemas during downtime
        # No messages should be lost
        pass

    def test_timescaledb_disk_full_graceful_degradation(self, timescaledb_container):
        timescaledb_container.fill_disk_to_95_percent()
        # System should alert and pause writes gracefully
        # Should NOT crash the FIX handler
        pass
```

---
*This blueprint is a living document. All changes require Architecture Review Board approval.*  
*Constitutional Authority: Rule 40 (Look-Ahead Bias Prevention), Article 15 (Market Data Integrity)*  
*Document Owner: Data Engineering*  
*Review Cycle: Quarterly or on EGX feed protocol changes*
