# Tradeora Financial Operating System
## Blueprint: AI Recommendation Flow — Complete Technical Specification
## Version 2.0.0 | Status: APPROVED | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Constitution Article 6   : AI Advisory Only — no autonomous execution       ║
║  Constitution Article 6.2 : Human confirmation required for all actions      ║
║  Constitution Article 17  : Financial accuracy — Decimal arithmetic ONLY     ║
║  Constitution Article 29  : All components OSS-first                         ║
║  Supersedes: BLUEPRINT_AI_RECOMMENDATION_FLOW.md v1.0 (2026-07-21)          ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Section 1 — Blueprint Authority & Scope

### 1.1 Mandate

This blueprint is the **golden reference** for the AI Recommendation Flow in Tradeora.
It governs every component interaction from a user's mobile tap to the WORM-archived result.
Any implementation that deviates from this blueprint requires a Constitution-compliant ADR.

### 1.2 Scope Boundary

**IN SCOPE:**
- Flutter mobile tap → API Gateway → AIConsensusOrchestrator → 12 AI Schools → Consensus → Safety Gate → Explainability → Response
- Caching strategy (Valkey), event publication (Kafka), WORM audit (MinIO), push notification (FCM)
- SLO definitions, observability, security controls, test strategy

**OUT OF SCOPE:**
- Order execution (Phase 2, covered in BLUEPRINT_ORDER_EXECUTION_FLOW.md)
- Backtesting (BLUEPRINT_BACKTEST_FLOW.md)
- AI school training/fine-tuning (AI_INTELLIGENCE_ENGINE_ARCHITECTURE.md)
- EGX session management (BLUEPRINT_EGX_SESSION_MANAGEMENT.md)

### 1.3 Pre-Conditions

All pre-conditions must be TRUE before a recommendation can be generated:

| Pre-Condition | Check Location | Failure Response |
|---------------|---------------|-----------------|
| EGX session is OPEN or PRE_CLOSE | Valkey `market:egx:session:state` | 503 `session_closed` |
| User has `read:recommendations` scope | JWT claims | 403 `insufficient_scope` |
| Instrument exists in EGX registry | InstrumentRegistry BC | 404 `instrument_not_found` |
| Last EGX tick < 60 seconds old | Valkey `market:tick:last:{ticker}` | 503 `data_stale` |
| AI school warm-up passed (session start) | Valkey `ai:schools:warmup:passed` | 503 `schools_not_ready` |
| Feature flag `ai.recommendation.enabled` = ON | Unleash local cache | 503 `feature_disabled` |

### 1.4 Dependency Map

```
BLUEPRINT_EGX_SESSION_MANAGEMENT.md    → session state pre-condition
AI_INTELLIGENCE_ENGINE_ARCHITECTURE.md → school specifications
AI_SAFETY_AND_ETHICS_FRAMEWORK.md      → 7 safety check definitions
DOMAIN_EVENT_CATALOG.md               → ConsensusResultReached event ID
ENTERPRISE_METRICS_FRAMEWORK.md       → Prometheus metric standards
```

---

## Section 2 — Architecture Overview

### 2.1 Component Inventory

| Component | Technology | Version | Role | Port |
|-----------|------------|---------|------|------|
| Flutter Mobile App | Flutter | 3.19+ | User interface | — |
| API Gateway | Kong OSS | 3.6 | Auth, rate limit, route | 8000/8443 |
| Valkey | Valkey | 8.0 | Rate limiting, caching, session state | 6379 |
| AIConsensusOrchestrator | Python FastAPI | 3.12 | School dispatch & consensus | 8080 |
| AI Schools (×12) | Python asyncio | 3.12 | Parallel inference | 8081–8092 |
| LiteLLM Proxy | LiteLLM | 1.x | LLM routing & failover | 4000 |
| Ollama | Ollama | 0.3+ | GPU LLM inference | 11434 |
| Qdrant | Qdrant | 1.9 | Vector search (PeerComparison, PatternRecognition) | 6333 |
| WeightedConsensusAlgorithm | Python lib | 2.0 | Decimal vote aggregation | in-process |
| AI Safety Engine | Python lib | 2.0 | 7-check validation gate | in-process |
| AIExplainability Service | Python FastAPI | 3.12 | Arabic + English explanation | 8093 |
| Kafka | Apache Kafka | 3.7 | Event publication | 9092 |
| Schema Registry | Karapace 3.x | — | Avro schema management (ADR-044) | 8081 |
| AuditTrail Service | Python | 3.12 | WORM write coordination | 8094 |
| MinIO | MinIO | RELEASE.2024 | WORM object storage | 9000 |
| NotificationDelivery | NestJS | 20 | FCM push dispatch | 3000 |
| FCM | Firebase | — | Push notification delivery | external |
| Prometheus | Prometheus | 2.50+ | Metrics collection | 9090 |
| Unleash | Unleash OSS | 6.x | Feature flag evaluation | 4242 |
| Keycloak | Keycloak | 24.x | JWT issuance & JWKS | 8443 |

### 2.2 Network Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                          MOBILE EDGE                                   │
│  Flutter App ──HTTPS/TLS 1.3──▶ CDN ──▶ Load Balancer (L7)           │
└────────────────────────────────────────┬───────────────────────────────┘
                                         │
┌────────────────────────────────────────▼───────────────────────────────┐
│                        API GATEWAY LAYER                               │
│  Kong OSS :8000/:8443                                                  │
│    ├── TLS termination                                                 │
│    ├── JWT validation (Keycloak JWKS, cached 6h)                      │
│    ├── Rate limiting (Valkey sliding window per userId)                │
│    └── Route: /api/v1/recommendations/* → ConsensusOrch :8080         │
└────────────────────────────────────────┬───────────────────────────────┘
                                         │
┌────────────────────────────────────────▼───────────────────────────────┐
│                   AI CONSENSUS ORCHESTRATION LAYER                     │
│  AIConsensusOrchestrator (FastAPI :8080)                               │
│    ├── Unleash flag check (ai.recommendation.enabled)                  │
│    ├── Valkey cache check (ai:consensus:{ticker}:{date}:{phase})       │
│    ├── Market data freshness check (last tick < 60s)                   │
│    ├── EGX session state check (OPEN | PRE_CLOSE only)                 │
│    ├── asyncio.gather() → 12 AI Schools (parallel, 1500ms timeout)    │
│    ├── WeightedConsensusAlgorithm (Decimal arithmetic, in-process)     │
│    ├── AI Safety Engine (7 checks, in-process)                         │
│    └── AIExplainability Service (:8093)                                │
└──────────┬─────────────────────────┬──────────────────────────────────┘
           │                         │
┌──────────▼────────────┐  ┌─────────▼─────────────────────────────────┐
│  AI INFERENCE LAYER   │  │        ASYNC PERSISTENCE LAYER             │
│  LiteLLM Proxy :4000  │  │  Kafka :9092 → ConsensusResultReached.v1  │
│  Ollama GPU :11434    │  │  AuditTrail :8094 → MinIO WORM :9000      │
│  Qdrant :6333         │  │  NotificationDelivery → FCM               │
│  (12 schools connect) │  │  Prometheus :9090                          │
└───────────────────────┘  └────────────────────────────────────────────┘
```

---

## Section 3 — The 23-Step Exhaustive Flow

### Step 1: User Tap Event
- **Component:** Flutter Mobile App
- **Action:** User taps 'Get AI Analysis' on ticker detail screen. PostHog analytics event fired (`ai_recommendation_requested`). Button transitions to loading spinner state. Haptic feedback.
- **Data Out:** HTTP POST initiated with ticker symbol
- **Latency Budget:** < 50ms (client-side)
- **Failure Mode:** No connectivity → Offline banner shown, retry on reconnect

### Step 2: Flutter Assembles HTTP Request
- **Component:** Flutter Mobile App
- **Action:** Constructs POST with full headers:
```http
POST /api/v1/recommendations/COMI HTTP/1.1
Host: api.tradeora.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRyYWRlb3JhLTIwMjYifQ...
X-Request-ID: req_01J6XK4MFVX7XNPQRST1234567
X-Tenant-ID: retail-pool
Accept-Language: ar-EG, en;q=0.9
Content-Type: application/json

{
  "sessionContext": {
    "portfolioId": "port_01J6XXXXX",
    "preferredLanguage": "ar",
    "userSophistication": "INTERMEDIATE"
  }
}
```
- **Latency Budget:** < 20ms (request assembly)
- **Failure Mode:** Stored JWT expired → RefreshToken flow (< 3s), then retry

### Step 3: API Gateway Preprocessing
- **Component:** Kong OSS
- **Action:** TLS 1.3 termination, request-id injection (`X-Kong-Request-ID`), body size check (max 4 KB), content-type validation (`application/json`)
- **Latency Budget:** < 3ms
- **Failure Mode:** Body > 4 KB → `413 Payload Too Large`

### Step 4: JWT Validation
- **Component:** Kong OSS (jwt-keycloak plugin) + Keycloak
- **Action:** Validate JWT against Keycloak JWKS endpoint (`https://auth.tradeora.com/realms/tradeora-retail/protocol/openid-connect/certs`). Checks:
  - `alg = RS256` (HS256 rejected)
  - `exp > now()`
  - `iss = https://auth.tradeora.com/realms/tradeora-retail`
  - `scope` contains `read:recommendations`
  - `tenantId` claim present
- **Data Out:** Decoded claims injected as headers: `X-User-ID`, `X-Tenant-ID`, `X-Subscription-Tier`, `X-Scope`
- **Latency Budget:** < 5ms (JWKS cached, rotated every 6h with 5m overlap)
- **Failure Mode:** Invalid sig → `401 Unauthorized`, `WWW-Authenticate: Bearer error="invalid_token"`

### Step 5: Rate Limit Check
- **Component:** Kong OSS + Valkey (sliding window algorithm)
- **Action:** Sliding window per `userId`. Tier limits:
```python
RATE_LIMITS = {
    'RETAIL':        10,   # requests per minute
    'WEALTH':        50,
    'INSTITUTIONAL': 200,
}

# Valkey atomic increment with TTL
key = f"rate:rec:{user_id}:{window_minute}"
count = await valkey.incr(key)
if count == 1:
    await valkey.expire(key, 60)
if count > RATE_LIMITS[subscription_tier]:
    headers['Retry-After'] = str(60 - seconds_into_window)
    raise RateLimitExceededException()
```
- **Latency Budget:** < 3ms
- **Failure Mode:** Valkey partitioned → Fail-open (no rate limiting); metric `rate_limit_enforcement_down` fired

### Step 6: Feature Flag Check
- **Component:** AIConsensusOrchestrator + Unleash OSS SDK
- **Action:** Local Unleash SDK evaluates `ai.recommendation.enabled` for `{ userId, tenantId, subscriptionTier }`. SDK caches flags locally, refreshes every 15s.
- **Flag types used:**
  - `ai.recommendation.enabled` — Release flag (globally toggleable)
  - `ai.recommendation.school_count_override` — Ops flag (load shedding: reduce schools during overload)
- **Latency Budget:** < 1ms (in-memory SDK evaluation)
- **Failure Mode:** Unleash server unreachable → Fail-safe with last known state (default: enabled if never fetched)

### Step 7: Valkey Cache Lookup
- **Component:** AIConsensusOrchestrator
- **Action:** Cache hit path — returns recommendation in < 50ms total
```python
cache_key = f"ai:consensus:{ticker}:{egx_session_date}:{session_phase}"
cached_bytes = await valkey.get(cache_key)
if cached_bytes:
    result = ConsensusResult.from_msgpack(cached_bytes)  # msgpack: faster than JSON
    result.cached = True
    METRIC_CACHE_HIT.labels(ticker=ticker).inc()
    return result
METRIC_CACHE_MISS.labels(ticker=ticker).inc()
```
- **Cache TTL:** 900s (OPEN session) / 300s (PRE_CLOSE) / immediate flush on `SessionClosed` event
- **Latency Budget:** < 3ms
- **Failure Mode:** Valkey down → Cache miss, proceed without cache; P99 latency increases ~400ms

### Step 8: Market Data Freshness Gate
- **Component:** AIConsensusOrchestrator
- **Action:** Verify last EGX tick for requested ticker
```python
FRESHNESS_THRESHOLD_SECONDS = 60

last_tick_key = f"market:tick:last:{ticker}"
last_tick_epoch = await valkey.get(last_tick_key)

if last_tick_epoch is None:
    raise DataFreshnessException(ticker=ticker, reason="no_tick_received")

age_seconds = int(time.time()) - int(last_tick_epoch)
if age_seconds > FRESHNESS_THRESHOLD_SECONDS:
    raise DataFreshnessException(
        ticker=ticker,
        last_tick_age_seconds=age_seconds,
        threshold_seconds=FRESHNESS_THRESHOLD_SECONDS,
    )

METRIC_DATA_FRESHNESS_SECONDS.labels(ticker=ticker).observe(age_seconds)
```
- **Latency Budget:** < 2ms
- **Failure Mode:** Stale data → `503 {"error": "DATA_STALE", "last_tick_age_seconds": N, "retry_after": 30}`

### Step 9: EGX Session State Verification
- **Component:** AIConsensusOrchestrator
- **Action:** Read canonical session state from Valkey (written by MarketSchedule BC)
```python
ALLOWED_STATES = {'OPEN', 'PRE_CLOSE'}
session_state = await valkey.get('market:egx:session:state')
if session_state not in ALLOWED_STATES:
    raise SessionStateException(
        current_state=session_state,
        allowed_states=ALLOWED_STATES,
    )
```
- **Latency Budget:** < 2ms
- **Failure Mode:** State = CLOSED → `503 {"error": "MARKET_CLOSED", "session_state": "CLOSED"}`

### Step 10: Historical Data Snapshot Assembly
- **Component:** AIConsensusOrchestrator → TimescaleDB, PostgreSQL, Valkey
- **Action:** Build `MarketContext` with full look-ahead bias protection (Rule 40):
```python
from datetime import datetime, timezone
from decimal import Decimal

@dataclass
class MarketContext:
    ticker: str
    snapshot_timestamp: datetime        # UTC now — the "as-of" timestamp
    # All data MUST have available_from_timestamp <= snapshot_timestamp
    ohlcv_252d: list[OHLCVBar]         # 252 trading days (1 year)
    ohlcv_intraday_5m: list[OHLCVBar]  # Today's 5-min bars
    current_price: Decimal              # Last tick price
    bid: Decimal
    ask: Decimal
    volume_today: int
    fundamental: FundamentalSnapshot    # Latest quarterly filing (announced, not forecasted)
    macro: MacroSnapshot                # CBE rate, CPI, USD/EGP (latest published)
    news_48h: list[NewsItem]            # Arabic news last 48h (available_from_ts enforced)
    order_book: OrderBookDepth          # Level 2 (10 bid + 10 ask levels)
    sector_index_3m: list[IndexBar]     # Sector index 3m returns
```
- **Look-Ahead Prevention:** TimescaleDB query filters: `WHERE available_from_timestamp <= NOW()`
- **Latency Budget:** < 50ms (parallel queries to TimescaleDB + PostgreSQL + Valkey)
- **Failure Mode:** TimescaleDB timeout → `503 {"error": "DATA_UNAVAILABLE"}`

### Step 11: Parallel School Dispatch
- **Component:** AIConsensusOrchestrator
- **Action:** All 12 schools dispatched simultaneously via `asyncio.gather()`:
```python
async def dispatch_schools(
    ticker: str,
    context: MarketContext,
    school_registry: SchoolRegistry,
) -> list[SchoolRecommendation | BaseException]:
    active_schools = school_registry.get_active_schools()
    
    tasks = [
        asyncio.wait_for(
            school.analyze(ticker, context),
            timeout=school.max_latency_seconds,  # 1.5s per school
        )
        for school in active_schools
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    METRIC_SCHOOL_DISPATCH_TOTAL.inc(len(active_schools))
    return results
```
- **Latency Budget:** 5ms dispatch overhead; schools execute in parallel
- **Failure Mode:** Thread pool exhausted → Queue with backpressure, reject after 50ms wait

### Step 12: Per-School Data Fetching

All schools receive the pre-assembled `MarketContext`. Additional per-school fetches:

| School | Additional Fetch | Source | Latency |
|--------|-----------------|--------|---------|
| TechnicalAnalysis | None — uses OHLCV from MarketContext | — | 0ms |
| FundamentalAnalysis | Sector P/E comparison | PostgreSQL | < 10ms |
| SentimentAnalysis | None — uses news_48h from MarketContext | — | 0ms |
| MacroeconomicAnalysis | Historical CBE rate series (2y) | TimescaleDB | < 15ms |
| MarketMicrostructure | None — uses order_book from MarketContext | — | 0ms |
| QuantitativeModels | Factor loadings cache | Valkey | < 3ms |
| RiskAdjustedReturn | None — uses ohlcv_252d from MarketContext | — | 0ms |
| BehavioralFinance | Retail flow data (EGX retail turnover %) | TimescaleDB | < 15ms |
| SectorRotation | None — uses sector_index_3m from MarketContext | — | 0ms |
| PeerComparison | Peer embedding search | Qdrant | < 30ms |
| EarningsQuality | Peer accruals comparison | PostgreSQL | < 10ms |
| PatternRecognition | Chart pattern similarity | Qdrant | < 30ms |

### Step 13: Per-School Inference

| School | Method | Model | Typical Latency |
|--------|--------|-------|----------------|
| TechnicalAnalysis | Algorithmic (RSI+MACD+BB+ADX+Ichimoku+EMA) | None | < 30ms |
| FundamentalAnalysis | LLM ratio analysis | Qwen2.5:7b via LiteLLM | 200–800ms |
| SentimentAnalysis | Arabic BERT (CAMeL-BERT-MSA, fine-tuned) | Local GPU | 100–400ms |
| MacroeconomicAnalysis | Algorithmic rules + LLM synthesis | Qwen2.5:7b | 150–600ms |
| MarketMicrostructure | Algorithmic (spread/depth/VPIN) | None | < 10ms |
| QuantitativeModels | Statistical (Fama-French EGX-adapted) | None | < 50ms |
| RiskAdjustedReturn | Mathematical (Sharpe/Sortino/VaR 99%) | None | < 20ms |
| BehavioralFinance | Algorithmic (herding/disposition indices) | None | < 20ms |
| SectorRotation | Algorithmic (relative strength ranking) | None | < 10ms |
| PeerComparison | Qdrant vector similarity → historical outcomes | Embedding model | < 50ms |
| EarningsQuality | Mathematical (Sloan accruals, Beneish M-Score) | None | < 20ms |
| PatternRecognition | CNN chart classifier via Qdrant | chart-pattern-v2 | < 60ms |

### Step 14: Schools Return SchoolRecommendation
```python
@dataclass(frozen=True)
class SchoolRecommendation:
    school_id: str                          # 'SCHOOL-03-TECHNICAL'
    school_name: str                        # 'TechnicalAnalysis'
    recommendation: Literal['BUY', 'HOLD', 'SELL']
    confidence: Decimal                     # 0.0000–1.0000 (prec=28)
    rationale_ar: str                       # Arabic rationale (50–500 chars)
    rationale_en: str                       # English rationale (50–500 chars)
    base_weight: Decimal                    # From school registry
    adjusted_weight: Decimal                # WisdomEngine-calibrated
    inference_ms: int                       # Actual inference duration
    data_timestamp: datetime                # Freshest data point used
    data_freshness_seconds: int
    indicators_used: list[str]              # Signal names that drove result
    model_version: str                      # e.g., 'qwen2.5:7b', 'algorithmic-v3'
```
- **Latency Budget:** 2ms collection overhead
- **Failure Mode:** School returns Exception → recorded in exclusion log, excluded from consensus

### Step 15: Timeout & Exclusion Handling
```python
valid_results: list[SchoolRecommendation] = []
excluded_schools: list[ExclusionRecord] = []

for school, result in zip(active_schools, raw_results):
    if isinstance(result, asyncio.TimeoutError):
        METRIC_SCHOOL_TIMEOUT.labels(school_id=school.school_id).inc()
        excluded_schools.append(ExclusionRecord(
            school_id=school.school_id,
            reason='TIMEOUT',
            latency_budget_ms=school.max_latency_ms,
        ))
        logger.warning(
            "school_timeout",
            school_id=school.school_id,
            timeout_ms=school.max_latency_ms,
        )
    elif isinstance(result, Exception):
        METRIC_SCHOOL_ERROR.labels(
            school_id=school.school_id,
            error_type=type(result).__name__
        ).inc()
        excluded_schools.append(ExclusionRecord(
            school_id=school.school_id,
            reason='EXCEPTION',
            error=str(result),
        ))
    else:
        valid_results.append(result)

METRIC_SCHOOL_PARTICIPATION_RATE.observe(
    len(valid_results) / len(active_schools)
)
```
- **Latency Budget:** 1ms

### Step 16: Minimum Quorum Gate
```python
MINIMUM_QUORUM = 9  # > 50% of 12 schools required

if len(valid_results) < MINIMUM_QUORUM:
    METRIC_QUORUM_FAILURE.inc()
    raise InsufficientConsensusException(
        participating=len(valid_results),
        required=MINIMUM_QUORUM,
        excluded=excluded_schools,
    )
```
- **Failure Mode:** < 9 schools → `503 {"error": "INSUFFICIENT_CONSENSUS", "participating": N, "required": 9}`

### Step 17: WeightedConsensusAlgorithm
```python
from decimal import Decimal, ROUND_HALF_UP, getcontext
getcontext().prec = 28  # MANDATORY — financial-grade precision

class WeightedConsensusAlgorithm:
    CONFIDENCE_THRESHOLD = Decimal('0.75')

    def compute_consensus(
        self,
        recommendations: list[SchoolRecommendation],
        ticker: str,
    ) -> ConsensusResult:
        # Filter: only schools meeting confidence threshold vote
        eligible = [r for r in recommendations if r.confidence >= self.CONFIDENCE_THRESHOLD]

        if len(eligible) < 9:
            return ConsensusResult.insufficient_confidence(ticker, eligible)

        # Weighted vote aggregation — Decimal ONLY, zero floats
        votes: dict[str, Decimal] = {
            'BUY':  Decimal('0'),
            'HOLD': Decimal('0'),
            'SELL': Decimal('0'),
        }
        total_weight = Decimal('0')

        for rec in eligible:
            votes[rec.recommendation] += rec.confidence * rec.adjusted_weight
            total_weight += rec.adjusted_weight

        assert total_weight > Decimal('0'), "Zero total weight — domain invariant violated"

        # Normalize to [0, 1]
        normalized = {
            direction: (vote / total_weight).quantize(Decimal('0.0001'), ROUND_HALF_UP)
            for direction, vote in votes.items()
        }

        # Winner
        winner = max(normalized, key=normalized.__getitem__)

        return ConsensusResult(
            ticker=ticker,
            recommendation=winner,
            confidence=normalized[winner],
            school_breakdown=normalized,
            participating_schools=len(eligible),
            excluded_schools=len(recommendations) - len(eligible),
            status='CONSENSUS_REACHED',
        )
```

**School Weight Table (sums to exactly 1.0000):**

| School | Base Weight | Rationale |
|--------|-------------|-----------|
| TechnicalAnalysis | 0.1100 | Highest signal quality for EGX retail-driven market |
| FundamentalAnalysis | 0.1200 | Primary value driver for long-term investors |
| SentimentAnalysis | 0.0800 | Arabic news heavily influences EGX retail sentiment |
| MacroeconomicAnalysis | 0.0900 | EGX highly sensitive to CBE rate + USD/EGP |
| MarketMicrostructure | 0.0700 | Order flow signal for short-term direction |
| QuantitativeModels | 0.1000 | Systematic factor model |
| RiskAdjustedReturn | 0.0900 | Risk-weighted signal quality filter |
| BehavioralFinance | 0.0700 | Contrarian/herding signal unique to EGX |
| SectorRotation | 0.0700 | Sector momentum significant in EGX |
| PeerComparison | 0.0600 | Historical peer outcome reference |
| EarningsQuality | 0.0800 | Earnings reliability filter |
| PatternRecognition | 0.0600 | Chart-based confirmation signal |
| **TOTAL** | **1.0000** | |

- **Latency Budget:** < 5ms (pure Python Decimal arithmetic, no I/O)

### Step 18: AI Safety Engine — 7 Checks
```python
class AIRecommendationSafetyEngine:
    """
    7-check safety gate. ALL checks must pass.
    Any failure → recommendation BLOCKED.
    User sees: 'Analysis temporarily unavailable'.
    """
    def validate(
        self,
        result: ConsensusResult,
        ctx: ValidationContext,
    ) -> SafetyResult:
        checks = [
            self._check_1_minimum_confidence(result),
            self._check_2_minimum_school_count(result),
            self._check_3_market_data_freshness(ctx),
            self._check_4_no_egx_circuit_breaker(ctx),
            self._check_5_instrument_not_halted(ctx),
            self._check_6_explanation_quality_gate(result),
            self._check_7_no_fra_embargo(ctx),
        ]
        failures = [c for c in checks if not c.passed]
        for f in failures:
            METRIC_SAFETY_GATE_FAILURE.labels(check_id=f.check_id, ticker=ctx.ticker).inc()
        return SafetyResult(
            passed=len(failures) == 0,
            failures=failures,
            recommendation_blocked=len(failures) > 0,
        )
```

**7 Checks Specification:**

| # | Check | What It Validates | Pass Criterion | Action on Fail |
|---|-------|-------------------|----------------|----------------|
| 1 | CONFIDENCE | Overall consensus confidence | `confidence ≥ 0.75` | Block + log `SAFETY_CHECK_1_FAILED` |
| 2 | QUORUM | Schools participating | `participating ≥ 9` | Block + `INSUFFICIENT_CONSENSUS` |
| 3 | DATA_FRESHNESS | Last EGX tick age | `last_tick_age < 60s` | Block + `503 DATA_STALE` |
| 4 | CIRCUIT_BREAKER | EGX ±10% circuit breaker | `not circuit_breaker_active` | Block + `503 CIRCUIT_BREAKER_ACTIVE` |
| 5 | INSTRUMENT_HALT | EGX instrument suspension | `not instrument_halted` | Block + `503 INSTRUMENT_HALTED` |
| 6 | EXPLANATION | Arabic explanation quality | `word_count_ar ≥ 50` | Block + retry once |
| 7 | FRA_EMBARGO | Instrument on FRA advisory list | `not on_embargo_list` | Block + compliance alert |

- **Latency Budget:** < 15ms (all 7 checks)

### Step 19: AIExplainability Service — Arabic + English
```python
class AIExplainabilityService:
    async def generate_explanation(
        self,
        result: ConsensusResult,
        context: MarketContext,
        user_sophistication: Literal['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
    ) -> Explanation:

        # Build Arabic prompt from YAML template
        prompt_ar = self.prompt_registry.render(
            template_id='consensus_explanation_ar_v2.3',
            variables={
                'ticker': result.ticker,
                'recommendation': result.recommendation,
                'confidence_pct': int(result.confidence * 100),
                'top_schools': result.top_contributing_schools(n=3),
                'current_price': str(context.current_price),
                'sophistication': user_sophistication,
            }
        )

        # LLM calls — Arabic (72b) + English (7b) in parallel
        ar_response, en_response = await asyncio.gather(
            self.llm.complete(
                model='ollama/qwen2.5:72b',
                prompt=prompt_ar,
                max_tokens=600,
                temperature=0.25,  # Low temperature for financial accuracy
            ),
            self.llm.complete(
                model='ollama/qwen2.5:7b',
                prompt=self.prompt_registry.render('consensus_explanation_en_v2.3', ...),
                max_tokens=600,
                temperature=0.25,
            ),
        )

        # Quality gate
        ar_words = len(ar_response.text.split())
        en_words = len(en_response.text.split())
        if ar_words < 50 or en_words < 50:
            raise ExplanationQualityException(ar_words=ar_words, en_words=en_words)

        # MANDATORY: FRA disclaimer appended (Constitution Article 6)
        fra_ar = "هذا التحليل للأغراض المعلوماتية فقط وليس توصية بالشراء أو البيع. الاستثمار في الأوراق المالية ينطوي على مخاطر."
        fra_en = "This analysis is for informational purposes only and does not constitute investment advice. Investing in securities involves risk of loss."

        return Explanation(
            ar=ar_response.text + '\n\n' + fra_ar,
            en=en_response.text + '\n\n' + fra_en,
            word_count_ar=ar_words,
            word_count_en=en_words,
            model_ar='qwen2.5:72b',
            model_en='qwen2.5:7b',
            generated_at=datetime.now(timezone.utc),
        )
```
- **Latency Budget:** < 200ms (parallel LLM calls)
- **Failure Mode:** LLM timeout → Retry with Qwen2.5:7b only; if fails → Safety Check 6 blocks

### Step 20: Cache Write
```python
cache_payload = msgpack.packb(result.to_dict())  # msgpack: 30% smaller than JSON

ttl = 900 if session_phase == 'OPEN' else 300  # 15 min OPEN, 5 min PRE_CLOSE
await valkey.setex(
    name=f"ai:consensus:{ticker}:{session_date}:{session_phase}",
    time=ttl,
    value=cache_payload,
)
METRIC_CACHE_WRITE_SUCCESS.labels(ticker=ticker).inc()
```
- **Latency Budget:** < 5ms
- **Failure Mode:** Valkey write fails → Log + continue (recommendation still delivered)

### Step 21: Kafka Event Publication
```json
// Topic: ai.consensus.ConsensusResultReached.v1
// Partition key: ticker (guarantees ordering per ticker)
// Schema registry ID: 42
// Compression: lz4
{
  "eventId": "evt_01J6XK4MFVX7XNPQRST9999",
  "eventType": "ConsensusResultReached",
  "schemaVersion": "1.0",
  "occurredAt": "2026-07-24T09:30:15.234Z",
  "causationId": "req_01J6XK4MFVX7XNPQRST1234567",
  "correlationId": "trace_01J6XK4M",
  "payload": {
    "ticker": "COMI",
    "recommendation": "BUY",
    "confidence": "0.8234",
    "participatingSchools": 11,
    "totalSchools": 12,
    "schoolBreakdown": {"BUY": "0.7234", "HOLD": "0.2100", "SELL": "0.0666"},
    "sessionDate": "2026-07-24",
    "userId": "usr_01J6XXXXX",
    "portfolioId": "port_01J6XXXXX"
  },
  "metadata": {
    "sourceConfidence": "AI_GENERATED",
    "humanReviewRequired": false,
    "fraDisclosureDelivered": true
  }
}
```
- **Producer Config:** `acks=all`, `linger.ms=0`, `compression.type=lz4`, `max.in.flight.requests.per.connection=1`
- **Latency Budget:** < 10ms (async, fire-and-forget relative to HTTP response)
- **Failure Mode:** Kafka unavailable → Async retry queue (Valkey-backed), response not blocked

### Step 22: Async WORM Record + FCM Push
```python
# BOTH operations fire AFTER HTTP response is sent — non-blocking
async def post_response_async(result: ConsensusResult, user_id: str) -> None:
    await asyncio.gather(
        # FRA REQUIREMENT: Every AI recommendation WORM-archived for 7 years
        audit_trail.write_worm_record(
            object_path=f"/{year}/{month}/{day}/ai-recommendations/{result.recommendation_id}.json",
            payload=result.to_audit_dict(),
            retention_years=7,
            lock_mode='GOVERNANCE',  # MinIO object lock
        ),
        # Push notification to user
        notification_delivery.send_push(
            user_id=user_id,
            title_ar='تحليل جديد متاح',
            title_en='New Analysis Available',
            body_ar=f'تم تحليل {result.ticker}: {result.recommendation}',
            body_en=f'{result.ticker} analysis: {result.recommendation}',
            data={
                'recommendationId': result.recommendation_id,
                'ticker': result.ticker,
                'type': 'AI_RECOMMENDATION',
            },
        ),
        return_exceptions=True,  # Failures do NOT affect main flow
    )
```
- **WORM Path:** `/{year}/{month}/{day}/ai-recommendations/{recommendation_id}.json`
- **FCM Latency:** P99 < 5 seconds (FCM delivery)
- **Failure Mode:** WORM write fails → Alert to compliance team + retry queue (zero failures tolerated)

### Step 23: HTTP Response to Flutter
```json
{
  "recommendationId": "rec_01J6XK4MFVX7XNPQRST9999",
  "ticker": "COMI",
  "exchange": "EGX",
  "generatedAt": "2026-07-24T09:30:15.234Z",
  "recommendation": "BUY",
  "confidence": "0.8234",
  "participatingSchools": 11,
  "totalSchools": 12,
  "excludedSchools": 1,
  "exclusionReasons": [{"school": "PatternRecognition", "reason": "TIMEOUT"}],
  "schoolBreakdown": {
    "BUY": "0.7234",
    "HOLD": "0.2100",
    "SELL": "0.0666"
  },
  "explanation": {
    "ar": "بناءً على التحليل الفني والأساسي الشامل، يُظهر سهم CIB إشارات إيجابية قوية تشمل مؤشر RSI عند 58 في منطقة محايدة مع إمكانية صعود، ونمو في الأرباح بنسبة 18% سنوياً في آخر 3 سنوات، فضلاً عن تحسن ملحوظ في جودة الأصول. يُشير التحليل المجمع من 11 مدرسة تحليلية إلى ميل شرائي واضح مع ثقة عالية.\n\nهذا التحليل للأغراض المعلوماتية فقط وليس توصية بالشراء أو البيع.",
    "en": "Based on comprehensive multi-school analysis, COMI shows strong positive signals including RSI at 58 in neutral-bullish territory, 18% YoY earnings growth over 3 years, and improving asset quality. The 11-school consensus indicates a clear buy bias with high confidence.\n\nThis analysis is for informational purposes only and does not constitute investment advice."
  },
  "disclaimer": {
    "ar": "هذا التحليل للأغراض المعلوماتية فقط وليس توصية بالشراء أو البيع. الاستثمار في الأوراق المالية ينطوي على مخاطر.",
    "en": "This analysis is for informational purposes only and does not constitute investment advice. Investing in securities involves risk of loss."
  },
  "dataFreshness": {
    "lastTickAgeSeconds": 23,
    "fundamentalsAge": "2026-04-30",
    "newsLastArticle": "2026-07-24T09:15:00Z"
  },
  "cached": false,
  "processingMetrics": {
    "totalDurationMs": 634,
    "cacheCheckMs": 3,
    "dataAssemblyMs": 48,
    "schoolDispatchMs": 420,
    "consensusMs": 4,
    "safetyGateMs": 12,
    "explanationMs": 180,
    "cacheWriteMs": 3
  }
}
```
- **Latency Budget:** < 20ms (serialization + Kong overhead)

---

## Section 4 — Complete School Specifications

### SCHOOL-01: TechnicalAnalysis
- **Service:** `ai-technical-analysis` (in-process module)
- **Method:** Algorithmic — no LLM
- **Input:** `ohlcv_252d`, `ohlcv_intraday_5m`, `current_price`, `volume_today`
- **Indicators (8 groups):**
  1. RSI(14): > 70 = SELL, < 30 = BUY, 30–70 = HOLD weight
  2. MACD(12,26,9): Signal-line crossover direction + histogram magnitude
  3. Bollinger Bands(20,2): Price vs upper/lower band distance
  4. ADX(14): Trend strength filter (< 20 = choppy, signals weakened)
  5. Ichimoku Cloud: Kumo breakout, Tenkan/Kijun cross, Chikou span
  6. Volume Profile: Above-average volume confirms signals (×1.2 weight)
  7. EMA(50) vs EMA(200): Golden/Death cross detection
  8. Stochastic(14,3): Overbought/oversold oscillator
- **Scoring:** Each indicator votes BUY/HOLD/SELL; weighted majority determines output
- **Weight:** 0.1100 | **Max Latency:** 1,500ms (actual: < 30ms)

### SCHOOL-02: FundamentalAnalysis
- **Service:** `ai-fundamental-analysis`
- **Method:** LLM (Qwen2.5:7b via LiteLLM/Ollama)
- **Input:** P/E, P/B, ROE, ROCE, EV/EBITDA, revenue 3y CAGR, EPS 3y CAGR, D/E ratio, sector P/E comparison
- **Prompt Template:** `fundamentals_analysis_ar_v2.1.yaml` — instructs LLM to:
  - Compare P/E to sector average (above = expensive, below = cheap)
  - Evaluate earnings quality (ROE > 15% = strong)
  - Flag D/E > 2.0 as leveraged risk
  - Output structured JSON with recommendation + Arabic rationale
- **Weight:** 0.1200 | **Max Latency:** 1,500ms (actual: 200–800ms)

### SCHOOL-03: SentimentAnalysis
- **Service:** `ai-sentiment-analysis`
- **Method:** Arabic BERT fine-tuned on EGX financial news (CAMeL-BERT-MSA-EGX-Sentiment-v2)
- **Input:** `news_48h` — Arabic news articles mentioning ticker
- **Process:**
  1. Filter: articles mentioning ticker (regex + entity recognition)
  2. Sentence-level sentiment per article (positive/negative/neutral, 0–1 score)
  3. Article-level aggregation (headline weight × 2.0)
  4. Ticker-level weighted average (recency decay: articles < 6h weight × 1.5)
  5. Score > 0.65 → BUY, < 0.35 → SELL, else HOLD
- **Weight:** 0.0800 | **Max Latency:** 1,500ms (GPU BERT inference: 100–400ms)

### SCHOOL-04: MacroeconomicAnalysis
- **Service:** `ai-macroeconomic-analysis`
- **Method:** Algorithmic rules + LLM synthesis (Qwen2.5:7b)
- **Macro Signals:**
  - CBE Rate: Rate cut cycle → risk-on → BUY growth stocks; hike cycle → HOLD/SELL
  - USD/EGP: EGP depreciation → exporters BUY, importers SELL
  - CPI > 20%: Banks and real estate historically benefit (EGX pattern)
  - EGX30 3m trend: Bull trend > +8% → sector momentum BUY
  - M2 growth: Liquidity expansion → risk assets historically up
- **Weight:** 0.0900 | **Max Latency:** 1,500ms (actual: 150–600ms)

### SCHOOL-05: MarketMicrostructure
- **Service:** `ai-microstructure-analysis`
- **Method:** Algorithmic
- **Input:** `order_book` (Level 2, 10 bid + 10 ask levels), intraday volume
- **Signals:**
  - Bid/Ask Imbalance: bid_volume / (bid_volume + ask_volume) > 0.60 → BUY pressure
  - Effective Spread: spread < 0.5% of price → liquid, signal reliable
  - VPIN Proxy: Unusual order flow toxicity → uncertainty → HOLD
  - Depth Asymmetry: More depth on bid side → support, BUY
- **Weight:** 0.0700 | **Max Latency:** 1,500ms (actual: < 10ms)

### SCHOOL-06: QuantitativeModels
- **Service:** `ai-quantitative-models`
- **Method:** Statistical (NumPy/SciPy)
- **Models (EGX-adapted):**
  - Fama-French 3-Factor: Market beta, size (SMB), value (HML) factor loadings
  - Mean-Reversion: Price z-score vs 60-day moving average (z > 2.0 → SELL, < -2.0 → BUY)
  - Momentum 12-1: 12-month return minus last 1 month (skip-month effect)
- **Factor Loadings:** Pre-computed monthly by WisdomEngine, cached in Valkey
- **Weight:** 0.1000 | **Max Latency:** 1,500ms (actual: < 50ms)

### SCHOOL-07: RiskAdjustedReturn
- **Service:** `ai-risk-adjusted-return`
- **Method:** Mathematical
- **Metrics computed:**
  - Sharpe Ratio (252-day): (return - risk_free_rate) / std_dev
  - Sortino Ratio: Uses only downside deviation
  - Calmar Ratio: Annualized return / max drawdown
  - VaR 99% (Historical): 99th percentile loss over 252 days
  - Expected Shortfall (CVaR): Average loss beyond VaR
- **Signal:** Sharpe > 1.5 → BUY, 0.8–1.5 → HOLD, < 0.8 → SELL; weighted by Calmar
- **Weight:** 0.0900 | **Max Latency:** 1,500ms (actual: < 20ms)

### SCHOOL-08: BehavioralFinance
- **Service:** `ai-behavioral-finance`
- **Method:** Algorithmic (contrarian signal)
- **Signals:**
  - Retail Herding Index: `turnover_ratio_today / avg_turnover_30d` > 2.5 → herding → contrarian SELL
  - Disposition Effect: Abnormal selling at round numbers → price stickiness detected
  - Overreaction Index: Post-announcement return vs fundamental expectation deviation
  - Retail Fear Index: VIX-equivalent on EGX (custom) > 40 → contrarian BUY
- **Contrarian Logic:** Extreme herding → fade the crowd
- **Weight:** 0.0700 | **Max Latency:** 1,500ms (actual: < 20ms)

### SCHOOL-09: SectorRotation
- **Service:** `ai-sector-rotation`
- **Method:** Algorithmic (relative strength ranking)
- **Process:**
  1. Rank all 10 EGX sectors by 3-month relative return vs EGX30
  2. Ticker's sector rank 1–2 → BUY (top performer), rank 9–10 → SELL, else HOLD
  3. Momentum confirmation: sector rank improving vs last month → signal strengthened
- **Weight:** 0.0700 | **Max Latency:** 1,500ms (actual: < 10ms)

### SCHOOL-10: PeerComparison
- **Service:** `ai-peer-comparison`
- **Method:** Qdrant vector similarity search
- **Process:**
  1. Company embedding: financials + sector + market cap + quality score → 128-dim vector
  2. Qdrant search: find 10 most similar historical companies (cosine similarity > 0.85)
  3. Average 12-month forward return of historical peers
  4. Avg return > +12% → BUY, < -5% → SELL, else HOLD
- **Embedding Model:** Trained on EGX + MENA market company profiles
- **Weight:** 0.0600 | **Max Latency:** 1,500ms (actual: < 50ms including Qdrant)

### SCHOOL-11: EarningsQuality
- **Service:** `ai-earnings-quality`
- **Method:** Mathematical (accounting-based)
- **Models:**
  - Sloan Accruals Ratio: `(NI - CFO) / avg_total_assets` — high accruals = low quality
  - Beneish M-Score: 8-variable manipulation detector (M > -1.78 → manipulation risk)
  - Cash Conversion: `CFO / EBITDA` — < 0.5 = earnings not converting to cash (SELL signal)
- **Signal:** Low accruals + high cash conversion → BUY; high M-Score → SELL
- **Weight:** 0.0800 | **Max Latency:** 1,500ms (actual: < 20ms)

### SCHOOL-12: PatternRecognition
- **Service:** `ai-pattern-recognition`
- **Method:** CNN chart pattern classifier
- **Process:**
  1. OHLCV → candlestick chart image (128×128 normalized)
  2. CNN embedding (128-dim) via pre-trained chart-pattern-v2 model
  3. Qdrant similarity search: match against labeled historical patterns
  4. Top match: pattern name + historical forward return after pattern completion
- **Patterns detected:** Head & Shoulders, Double Bottom, Cup & Handle, Ascending/Descending Triangle, Bull/Bear Flag, Rounding Bottom
- **EGX Pattern Accuracy (backtested):** Bull Flag: 68%, Double Bottom: 72%, H&S: 74%
- **Weight:** 0.0600 | **Max Latency:** 1,500ms (actual: < 60ms)

---

## Section 5 — JSON Schemas

### SchoolRecommendation (Avro Schema)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12",
  "title": "SchoolRecommendation",
  "type": "object",
  "required": ["school_id", "recommendation", "confidence", "rationale_ar", "rationale_en", "adjusted_weight", "inference_ms"],
  "properties": {
    "school_id": {"type": "string", "pattern": "^SCHOOL-\\d{2}-[A-Z_]+$"},
    "school_name": {"type": "string"},
    "recommendation": {"type": "string", "enum": ["BUY", "HOLD", "SELL"]},
    "confidence": {"type": "string", "pattern": "^0\\.\\d{4}$", "description": "Decimal string, never float"},
    "rationale_ar": {"type": "string", "minLength": 50, "maxLength": 500},
    "rationale_en": {"type": "string", "minLength": 50, "maxLength": 500},
    "base_weight": {"type": "string"},
    "adjusted_weight": {"type": "string"},
    "inference_ms": {"type": "integer", "minimum": 0, "maximum": 1500},
    "data_freshness_seconds": {"type": "integer", "minimum": 0},
    "indicators_used": {"type": "array", "items": {"type": "string"}},
    "model_version": {"type": "string"}
  }
}
```

### ConsensusResultReached Kafka Event (Avro)
```json
{
  "type": "record",
  "name": "ConsensusResultReached",
  "namespace": "com.tradeora.ai.consensus",
  "fields": [
    {"name": "eventId", "type": "string"},
    {"name": "eventType", "type": {"type": "enum", "name": "EventType", "symbols": ["ConsensusResultReached"]}},
    {"name": "schemaVersion", "type": "string", "default": "1.0"},
    {"name": "occurredAt", "type": "string"},
    {"name": "causationId", "type": "string"},
    {"name": "correlationId", "type": "string"},
    {"name": "payload", "type": {
      "type": "record",
      "name": "Payload",
      "fields": [
        {"name": "ticker", "type": "string"},
        {"name": "recommendation", "type": {"type": "enum", "name": "Direction", "symbols": ["BUY", "HOLD", "SELL"]}},
        {"name": "confidence", "type": "string"},
        {"name": "participatingSchools", "type": "int"},
        {"name": "totalSchools", "type": "int"},
        {"name": "schoolBreakdown", "type": {"type": "map", "values": "string"}},
        {"name": "sessionDate", "type": "string"},
        {"name": "userId", "type": "string"},
        {"name": "portfolioId", "type": ["null", "string"], "default": null}
      ]
    }},
    {"name": "metadata", "type": {
      "type": "record",
      "name": "Metadata",
      "fields": [
        {"name": "sourceConfidence", "type": "string", "default": "AI_GENERATED"},
        {"name": "humanReviewRequired", "type": "boolean", "default": false},
        {"name": "fraDisclosureDelivered", "type": "boolean"}
      ]
    }}
  ]
}
```

---

## Section 6 — ASCII Sequence Diagram

```
Flutter   Kong    Valkey  Unleash  ConsOrch  Schools(×12)  LiteLLM  Qdrant  SafetyEng  Explainability  Kafka   MinIO   FCM
  |         |       |        |         |           |            |        |        |             |            |       |     |
  |--POST-->|       |        |         |           |            |        |        |             |            |       |     |
  |         |-JWKS->|        |         |           |            |        |        |             |            |       |     |
  |         |<-OK---|        |         |           |            |        |        |             |            |       |     |
  |         |-RL--->|        |         |           |            |        |        |             |            |       |     |
  |         |<-OK---|        |         |           |            |        |        |             |            |       |     |
  |         |----------route--------->|            |            |        |        |             |            |       |     |
  |         |        |        |        |-Flag?---->|            |        |        |             |            |       |     |
  |         |        |        |        |<-ON-------|            |        |        |             |            |       |     |
  |         |        |        |        |-Cache?--->|            |        |        |             |            |       |     |
  |         |        |        |        |<-MISS-----|            |        |        |             |            |       |     |
  |         |        |        |        |-Fresh?--->|            |        |        |             |            |       |     |
  |         |        |        |        |<-OK-------|            |        |        |             |            |       |     |
  |         |        |        |        |-Session?->|            |        |        |             |            |       |     |
  |         |        |        |        |<-OPEN-----|            |        |        |             |            |       |     |
  |         |        |        |        |-AssembleCtx            |        |        |             |            |       |     |
  |         |        |        |        |---gather()------------>|        |        |             |            |       |     |
  |         |        |        |        |           |--fetch---->|        |        |             |            |       |     |
  |         |        |        |        |           |--vect.srch-------->|        |             |            |       |     |
  |         |        |        |        |           |--inference->|        |        |             |            |       |     |
  |         |        |        |        |           |<-result----|        |        |             |            |       |     |
  |         |        |        |        |<-results(11/12)--------|        |        |             |            |       |     |
  |         |        |        |        |-consensus()            |        |        |             |            |       |     |
  |         |        |        |        |---validate()-------------------------------->|          |            |       |     |
  |         |        |        |        |<-PASS---------------------------------------------|   |            |       |     |
  |         |        |        |        |---explain()---------------------------------------------------->|   |       |     |
  |         |        |        |        |<-explanation---------------------------------------------------|   |       |     |
  |         |        |        |        |-setex()-->|            |        |        |             |            |       |     |
  |<-200 OK-|        |        |        |           [ASYNC BELOW - AFTER RESPONSE SENT]                          |     |
  |         |        |        |        |---publish event---------------------------------------------->|       |     |
  |         |        |        |        |---WORM write--------------------------------------------------->|---|   |     |
  |         |        |        |        |---FCM push--------------------------------------------------------->|     |
```

---

## Section 7 — Failure Mode Analysis

| # | Failure | Trigger | Detection | System Response | User Experience | Recovery |
|---|---------|---------|-----------|-----------------|-----------------|----------|
| F-01 | EGX feed offline | Network loss | `tick_age > 60s` | Safety Check 3 blocks | 'Market data unavailable, retry in 30s' | Feed reconnect (SLA: 30s) |
| F-02 | 5 schools timeout | GPU overload | `asyncio.TimeoutError × 5` | Check quorum — if 7 valid: blocked | '503 Insufficient consensus' | Auto GPU cooldown |
| F-03 | Ollama GPU crash | OOM / SIGKILL | LiteLLM health check | Fail over to Qwen2.5:7b | Slightly reduced quality | 30s pod restart |
| F-04 | Arabic explanation < 50 words | LLM hallucination | Word count check | 1 retry with longer prompt | 'Analysis pending' if retry fails | Retry (< 3s) |
| F-05 | Valkey cache offline | Network partition | Connection timeout | Cache miss — proceed | P99 increases ~400ms | Auto-reconnect |
| F-06 | JWT expired mid-flow | Token TTL expired | Kong 401 | Client receives 401 | Refresh token prompt | Token refresh < 5s |
| F-07 | EGX circuit breaker | ±10% price move | Valkey flag | Safety Check 4 blocks | 'Circuit breaker active' | Until EGX lifts halt |
| F-08 | Kafka broker down | Broker crash | Producer timeout | Event queued in local retry | No user impact (async) | Kafka restart + replay |
| F-09 | MinIO WORM write fails | Storage full | Write error | Compliance alert fired; retry queue | No user impact (async) | Storage cleared |
| F-10 | Rate limit exceeded | > tier_limit req/min | Valkey counter | 429 with Retry-After header | 'Too many requests — try in 60s' | Window reset |
| F-11 | Feature flag OFF | Ops decision | Unleash evaluation | 503 `feature_disabled` | 'AI Analysis temporarily unavailable' | Flag re-enabled |
| F-12 | FRA embargo active | FRA advisory | Embargo list check | Safety Check 7 blocks | 'Analysis not available for this instrument' | FRA removes embargo |
| F-13 | Orchestrator OOM | Memory leak | K8s OOMKilled | Pod restart, traffic to replica | ~10s disruption during restart | HPA restarts pod |
| F-14 | Qdrant down | Crash / network | Health check failure | Schools 10+12 excluded | Reduced: 10 schools (still ≥ 9, valid) | Qdrant restart < 30s |
| F-15 | All schools return HOLD | Macro uncertainty | Consensus result | HOLD published normally | 'HOLD' recommendation | Valid outcome — no recovery needed |

---

## Section 8 — Caching Strategy

### 8.1 Cache Key Design
```
ai:consensus:{ticker}:{session_date}:{session_phase}

Examples:
  ai:consensus:COMI:2026-07-24:OPEN
  ai:consensus:EFIH:2026-07-24:PRE_CLOSE
```

### 8.2 TTL Strategy

| Scenario | TTL | Rationale |
|----------|-----|-----------|
| EGX OPEN session | 900s (15 min) | Markets move; stale beyond 15 min |
| EGX PRE_CLOSE | 300s (5 min) | Close auction — higher volatility |
| Blocked recommendation | 60s | Negative cache — prevents repeated blocked requests |
| On `SessionClosed` event | Flush immediately | All session-day recommendations invalidated |

### 8.3 Cache Warming (Session Open)
```python
# Triggered by Kafka: market.egx.SessionStateChanged.v1 (CLOSED → OPEN)
@kafka_consumer('market.egx.SessionStateChanged.v1')
async def on_session_opened(event: SessionStateChanged) -> None:
    if event.new_state != 'OPEN':
        return

    top_30 = await instrument_registry.get_top_by_market_cap(limit=30)

    tasks = [
        consensus_orchestrator.pre_generate(ticker.symbol)
        for ticker in top_30
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)
    success_count = sum(1 for r in results if not isinstance(r, Exception))

    logger.info(
        "cache_warming_complete",
        total=len(top_30),
        successful=success_count,
        failed=len(top_30) - success_count,
    )
    METRIC_CACHE_WARMING_TICKERS.set(success_count)
```

---

## Section 9 — Performance Budget

| Step | P50 | P95 | P99 | Hard Cap |
|------|-----|-----|-----|----------|
| JWT validation (Kong) | 2ms | 4ms | 6ms | 10ms |
| Rate limit check | 1ms | 2ms | 3ms | 5ms |
| Feature flag check | <1ms | 1ms | 1ms | 2ms |
| Cache HIT path | 5ms | 8ms | 12ms | 20ms |
| Cache MISS: data assembly | 25ms | 40ms | 50ms | 80ms |
| School dispatch (parallel, 12 schools) | 280ms | 450ms | 580ms | 1,500ms |
| Timeout & exclusion handling | 1ms | 1ms | 2ms | 3ms |
| WeightedConsensusAlgorithm | 2ms | 3ms | 5ms | 10ms |
| AI Safety Gate (7 checks) | 8ms | 12ms | 15ms | 25ms |
| Explanation generation | 120ms | 165ms | 200ms | 350ms |
| Cache write | 2ms | 4ms | 5ms | 10ms |
| Response serialization | 3ms | 5ms | 8ms | 15ms |
| **Total (cache MISS)** | **~446ms** | **~689ms** | **~760ms** | **800ms** |
| **Total (cache HIT)** | **15ms** | **25ms** | **40ms** | **60ms** |

**Throughput Capacity (Phase 1 targets):**
- Peak concurrent recommendation requests: 200 RPS
- Ollama GPU concurrent inference: 5 simultaneous LLM calls
- LiteLLM proxy hard limit: 5 concurrent (matches GPU capacity)
- Qdrant: 50 concurrent searches (well within headroom)

---

## Section 10 — SLO Definitions

```yaml
SLO-REC-01:
  name: AI Recommendation Latency (cache miss)
  target: P99 ≤ 800ms
  window: 30-day rolling
  measurement: |
    histogram_quantile(0.99,
      rate(ai_recommendation_duration_seconds_bucket{cached="false"}[5m])
    ) <= 0.800
  error_budget_minutes_per_month: 43.2  # 99.9% target
  burn_rate_alerts:
    - window: 1h,  burn_rate: 14x → page on-call immediately
    - window: 6h,  burn_rate: 3x  → create incident ticket

SLO-REC-02:
  name: AI Recommendation Availability
  target: 99.9% success rate (5xx < 0.1%)
  measurement: |
    rate(ai_recommendation_requests_total{status!~"5.."}[5m]) /
    rate(ai_recommendation_requests_total[5m]) >= 0.999

SLO-REC-03:
  name: School Participation Rate
  target: ≥ 75% of schools participate per request (average)
  measurement: avg_over_time(ai_school_participation_ratio[5m]) >= 0.75
  alert_threshold: < 0.70 for 2 consecutive minutes → SEV-2

SLO-REC-04:
  name: WORM Audit Coverage
  target: 100% of recommendations have WORM record
  measurement: Daily audit job comparing ConsensusResultReached events vs MinIO objects
  violation: Any gap → IMMEDIATE compliance escalation (FRA mandate)
```

---

## Section 11 — Observability

### 11.1 Prometheus Metrics
```python
# ai_consensus/metrics.py — all metric definitions

# Throughput
METRIC_REQUESTS_TOTAL = Counter(
    'ai_recommendation_requests_total',
    'Total AI recommendation requests',
    ['ticker', 'status', 'cached'],
)
# Latency
METRIC_REQUEST_DURATION = Histogram(
    'ai_recommendation_duration_seconds',
    'End-to-end recommendation latency',
    ['cached'],
    buckets=[.05, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1.0, 1.25, 1.5, 2.0],
)
# Per-school
METRIC_SCHOOL_LATENCY = Histogram(
    'ai_school_inference_duration_seconds',
    'Per-school inference latency',
    ['school_id'],
)
METRIC_SCHOOL_TIMEOUT_TOTAL = Counter(
    'ai_school_timeout_total',
    'Schools that timed out per request',
    ['school_id'],
)
METRIC_SCHOOL_CONFIDENCE = Histogram(
    'ai_school_confidence_distribution',
    'School confidence score distribution',
    ['school_id', 'recommendation'],
    buckets=[.50, .60, .65, .70, .75, .80, .85, .90, .95, 1.0],
)
METRIC_PARTICIPATION_RATE = Histogram(
    'ai_school_participation_ratio',
    'Fraction of schools that participated',
    buckets=[.5, .6, .7, .75, .8, .85, .9, .95, 1.0],
)
# Safety gate
METRIC_SAFETY_GATE_FAILURE = Counter(
    'ai_safety_gate_failures_total',
    'Safety gate check failures',
    ['check_id', 'ticker'],
)
# Consensus direction
METRIC_CONSENSUS_DIRECTION = Counter(
    'ai_consensus_recommendation_total',
    'Consensus direction counts',
    ['recommendation', 'ticker'],
)
METRIC_CONSENSUS_CONFIDENCE = Histogram(
    'ai_consensus_confidence_distribution',
    'Final consensus confidence distribution',
    buckets=[.75, .78, .80, .82, .84, .86, .88, .90, .95, 1.0],
)
# Cache
METRIC_CACHE_HIT = Counter('ai_recommendation_cache_hits_total', 'Cache hits', ['ticker'])
METRIC_CACHE_MISS = Counter('ai_recommendation_cache_misses_total', 'Cache misses', ['ticker'])
# Data freshness
METRIC_DATA_FRESHNESS = Histogram(
    'ai_market_data_freshness_seconds',
    'Age of market data at time of recommendation',
    ['ticker'],
    buckets=[5, 10, 20, 30, 45, 60, 90, 120],
)
```

### 11.2 PromQL Alert Rules
```yaml
groups:
  - name: ai_recommendation_slos
    rules:
      - alert: AIRecommendationLatencyP99Breach
        expr: |
          histogram_quantile(0.99,
            rate(ai_recommendation_duration_seconds_bucket{cached="false"}[5m])
          ) > 0.800
        for: 2m
        labels: {severity: page, team: ai-platform}
        annotations:
          summary: 'AI recommendation P99 latency > 800ms SLO'
          runbook: 'https://runbooks.tradeora.com/ai/recommendation-latency'

      - alert: AISchoolParticipationLow
        expr: avg(ai_school_participation_ratio) < 0.70
        for: 3m
        labels: {severity: page}
        annotations:
          summary: 'Less than 70% of AI schools participating'

      - alert: AISafetyGateFailureSpike
        expr: rate(ai_safety_gate_failures_total[5m]) > 0.5
        for: 1m
        labels: {severity: warning}
        annotations:
          summary: 'AI Safety Gate failing > 0.5/s'

      - alert: AIRecommendationErrorRateHigh
        expr: |
          rate(ai_recommendation_requests_total{status=~"5.."}[5m]) /
          rate(ai_recommendation_requests_total[5m]) > 0.001
        for: 2m
        labels: {severity: page}
        annotations:
          summary: 'AI recommendation error rate > 0.1% (SLO breach)'

      - alert: AIWORMAuditGapDetected
        expr: ai_worm_audit_coverage_ratio < 1.0
        for: 0m  # Immediate alert
        labels: {severity: critical, team: compliance}
        annotations:
          summary: 'CRITICAL: AI recommendations missing WORM records (FRA violation risk)'
```

### 11.3 Grafana Dashboard: AI Recommendation Flow
```
Panel 1:  Request rate (RPS) — time series, split by cached/uncached
Panel 2:  P50/P95/P99 latency — time series with SLO line at 800ms
Panel 3:  Cache hit rate — gauge (target: > 40%)
Panel 4:  School participation heatmap — 12×time grid, color = participation %
Panel 5:  Per-school confidence violin plots
Panel 6:  Per-school latency heatmap
Panel 7:  Consensus direction distribution — pie (BUY/HOLD/SELL)
Panel 8:  Safety gate failure rate by check ID — bar chart
Panel 9:  Error rate by type — stacked bar
Panel 10: WORM audit coverage — gauge (must be 100%)
Panel 11: Data freshness distribution — histogram
Panel 12: Explanation generation latency — time series
```

---

## Section 12 — Security Controls

| Layer | Control | Implementation | Verification |
|-------|---------|---------------|--------------|
| Transport | TLS 1.3 minimum | Kong TLS termination, HSTS | Weekly cert audit |
| Authentication | JWT RS256 (asymmetric) | Keycloak JWKS endpoint | Key rotation every 90d |
| Authorization | Scope-based (`read:recommendations`) | Kong JWT plugin | Integration test |
| Rate Limiting | Per-user sliding window | Valkey atomic counter | Load test verification |
| Input Validation | Ticker whitelist | EGX instrument registry lookup | Unit test: invalid tickers rejected |
| LLM Output | JSON schema validation | Pydantic model validation | Unit test: malformed LLM output rejected |
| PII in Logs | userId hashed in logs | Structured logging with hash | Log audit |
| Audit Trail | WORM archival (FRA mandate) | MinIO object lock (GOVERNANCE) | Daily coverage audit |
| Data at Rest | Encryption SSE-S3 | MinIO server-side encryption | Storage audit |
| Dependency | No float arithmetic | Decimal-only enforcement | CI lint check (`ast_float_checker.py`) |

---

## Section 13 — Test Strategy

### 13.1 Unit Tests
```python
# tests/unit/test_weighted_consensus.py
class TestWeightedConsensusAlgorithm:
    def test_buy_majority_returns_buy(self):
        recs = [make_school_rec(i, 'BUY', Decimal('0.85')) for i in range(10)]
        recs += [make_school_rec(10, 'HOLD', Decimal('0.76')), make_school_rec(11, 'SELL', Decimal('0.78'))]
        result = WeightedConsensusAlgorithm().compute_consensus(recs, 'COMI')
        assert result.recommendation == 'BUY'
        assert result.status == 'CONSENSUS_REACHED'

    def test_no_floats_in_output(self):
        recs = make_school_recommendations(12)
        result = WeightedConsensusAlgorithm().compute_consensus(recs, 'COMI')
        assert isinstance(result.confidence, Decimal), "Float contamination detected!"
        breakdown_sum = sum(result.school_breakdown.values())
        assert breakdown_sum == Decimal('1.0000'), f"Breakdown sum {breakdown_sum} ≠ 1.0000"

    def test_quorum_failure_below_9(self):
        recs = make_school_recommendations(7)
        result = WeightedConsensusAlgorithm().compute_consensus(recs, 'COMI')
        assert result.status == 'INSUFFICIENT_CONSENSUS'

    def test_confidence_below_threshold_excluded(self):
        recs = [make_school_rec(i, 'BUY', Decimal('0.60')) for i in range(12)]
        result = WeightedConsensusAlgorithm().compute_consensus(recs, 'COMI')
        assert result.status == 'INSUFFICIENT_CONFIDENCE'

    def test_school_weights_sum_to_one(self):
        registry = SchoolRegistry.load_default()
        total = sum(s.base_weight for s in registry.schools)
        assert total == Decimal('1.0000'), f"Weights sum {total} ≠ 1.0000"
```

### 13.2 Integration Tests (Testcontainers)
```python
@pytest.mark.integration
class TestRecommendationFlowIntegration:
    @pytest.fixture(scope='class')
    def env(self):
        with TestContainers() as tc:
            tc.kafka = KafkaContainer()
            tc.valkey = ValKeyContainer()
            tc.pg = PostgresContainer('timescale/timescaledb:2.14-pg16')
            tc.qdrant = QdrantContainer()
            yield tc

    async def test_full_flow_cache_miss(self, env, seeded_ticker='COMI'):
        await seed_ohlcv(env.pg, ticker=seeded_ticker, days=252)
        await seed_fundamentals(env.pg, ticker=seeded_ticker)
        await seed_news(env.pg, ticker=seeded_ticker, count=10)

        result = await consensus_orchestrator.generate_recommendation(
            ticker=seeded_ticker,
            user_context=make_user_context(),
        )

        assert result.recommendation in ['BUY', 'HOLD', 'SELL']
        assert isinstance(result.confidence, Decimal)
        assert result.explanation.ar is not None
        assert len(result.explanation.ar.split()) >= 50
        assert 'هذا التحليل للأغراض' in result.explanation.ar  # FRA disclaimer

        # Verify Kafka event
        event = await consume_kafka_event(env.kafka, 'ai.consensus.ConsensusResultReached.v1', timeout=5)
        assert event['payload']['ticker'] == seeded_ticker
        assert event['metadata']['fraDisclosureDelivered'] is True

    async def test_full_flow_cache_hit(self, env):
        # Second call hits cache
        result = await consensus_orchestrator.generate_recommendation('COMI', make_user_context())
        assert result.cached is True
        assert result.processingMetrics.totalDurationMs < 60
```

### 13.3 Load Test (k6)
```javascript
// k6/recommendation_load_test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    steady_load: {
      executor: 'constant-arrival-rate',
      rate: 200,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
  },
  thresholds: {
    http_req_duration: ['p(99)<800'],   // SLO-REC-01: P99 < 800ms
    http_req_failed:   ['rate<0.001'],  // SLO-REC-02: < 0.1% errors
  },
};

const TICKERS = ['COMI', 'EFIH', 'HRHO', 'SWDY', 'EAST', 'AMOC', 'TALM', 'ORWE'];

export default function () {
  const ticker = TICKERS[Math.floor(Math.random() * TICKERS.length)];
  const res = http.post(
    `https://api.tradeora.com/api/v1/recommendations/${ticker}`,
    JSON.stringify({
      sessionContext: { portfolioId: 'port_test', preferredLanguage: 'ar' }
    }),
    {
      headers: {
        'Authorization': `Bearer ${__ENV.TEST_JWT}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': 'retail-pool',
      }
    }
  );
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has recommendation': (r) => JSON.parse(r.body).recommendation !== undefined,
    'has Arabic explanation': (r) => JSON.parse(r.body).explanation?.ar?.length > 50,
    'no floats (confidence is string)': (r) => typeof JSON.parse(r.body).confidence === 'string',
  });
  sleep(0.1);
}
```

### 13.4 Chaos Engineering Tests
```bash
# CHAOS-01: Kill Ollama GPU pod during active session
kubectl delete pod -l app=ollama --grace-period=0
# Expected: LiteLLM fails over to qwen2.5:7b; FundamentalAnalysis + MacroeconomicAnalysis
# quality reduced but present; if GPU schools fail entirely: quorum check determines outcome

# CHAOS-02: Partition Valkey from AIConsensusOrchestrator
kubectl apply -f chaos/valkey-network-partition.yaml
# Expected: Cache misses, rate limiting disabled (fail-open), data freshness check
# uses DB fallback; P99 latency increases to ~1200ms; SLO-REC-01 breach alert fires

# CHAOS-03: Inject 2-second delay into 5 schools
kubectl apply -f chaos/school-latency-5-schools.yaml
# Expected: 5 schools timeout (TIMEOUT in exclusion log); if 7 valid remain:
# quorum not met (need 9) → 503 INSUFFICIENT_CONSENSUS returned

# CHAOS-04: Kill Kafka broker
kubectl delete pod kafka-0 --grace-period=0
# Expected: Kafka event publication queued in local retry buffer;
# HTTP response NOT delayed; recommendation delivered normally;
# events replayed when Kafka recovers

# CHAOS-05: Fill MinIO bucket to capacity
# Expected: WORM write fails → compliance alert fired → retry queue;
# HTTP response NOT delayed; WORM gap detected in daily audit job
```

### 13.5 Contract Tests (Pact)
```python
# pact/test_recommendation_consumer.py
# Verifies: Flutter app ↔ API Gateway contract
@pytest.fixture
def pact():
    return Consumer('flutter-app').has_pact_with(Provider('ai-recommendation-api'))

def test_recommendation_request(pact):
    pact.given('COMI ticker exists and EGX session is OPEN')
        .upon_receiving('a recommendation request for COMI')
        .with_request(
            method='POST',
            path='/api/v1/recommendations/COMI',
            headers={'Authorization': like('Bearer eyJ...')},
            body={'sessionContext': {'preferredLanguage': 'ar'}},
        )
        .will_respond_with(
            status=200,
            body={
                'recommendation': term(matcher='BUY|HOLD|SELL', generate='BUY'),
                'confidence': like('0.8234'),
                'explanation': {
                    'ar': like('بناءً على التحليل'),
                    'en': like('Based on analysis'),
                },
                'disclaimer': {'ar': like('هذا التحليل'), 'en': like('This analysis')},
            }
        )
```

---

## Section 14 — Cache Warming & Session Integration

### 14.1 Cache Warming Flow
```
07:55 EGT: MarketSchedule BC → countdown timer armed (5 min to OPEN)
08:00 EGT: PRE_OPEN state → data feeds warm up, news indexed
09:25 EGT: Cache warming job triggered (5 min before OPEN)
           → Top 30 tickers pre-analyzed in parallel
           → Results cached with TTL=915s (15m + 15s grace)
09:30 EGT: SessionOpened event → session state = OPEN
           → First user requests: 100% cache hits for top 30 tickers
           → Other tickers: cache miss path (~760ms P99)
```

### 14.2 Session Close Integration
```python
@kafka_consumer('market.egx.SessionStateChanged.v1')
async def on_session_state_changed(event: SessionStateChanged) -> None:
    if event.new_state == 'CLOSED':
        # Flush all recommendation caches for today's session
        pattern = f"ai:consensus:*:{event.session_date}:*"
        keys = await valkey.scan_iter(match=pattern)
        if keys:
            await valkey.delete(*keys)
            logger.info("session_cache_flushed", keys_deleted=len(keys))

        # Trigger EOD WORM audit verification
        await audit_trail.verify_worm_coverage(
            session_date=event.session_date,
            event_type='AI_RECOMMENDATION',
        )
```

---

## Section 15 — Regulatory Compliance

| Requirement | Source | Implementation | Audit Frequency |
|-------------|--------|---------------|-----------------|
| Advisory-only disclaimer in every response | Constitution Article 6 | FRA disclaimer appended by AIExplainability, enforced by Safety Check 6 | Every response verified |
| Arabic disclaimer present | FRA Egyptian law | Arabic disclaimer required + validated | Safety Check 6 |
| WORM archive of every recommendation | FRA 7-year retention | MinIO object lock GOVERNANCE mode | Daily coverage audit |
| AI-generated confidence metadata | FRA disclosure | `sourceConfidence: AI_GENERATED` in Kafka event | Event schema validated |
| No autonomous execution | Constitution Article 6.2 | Zero connection from recommendation API to order management (Phase 2) | Architecture fitness function |
| Decimal arithmetic (no IEEE 754) | Constitution Article 17 | `getcontext().prec=28`, CI lint rule forbids float in consensus | CI pipeline + unit tests |

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT FOOTER                                                             ║
║  Document: BLUEPRINT_AI_RECOMMENDATION_FLOW.md                              ║
║  Version:  2.0.0 (Complete Expansion)                                       ║
║  Status:   APPROVED                                                          ║
║  Owner:    AI Platform Team                                                  ║
║  Effective: 2026-07-24                                                       ║
║  Next Review: 2026-10-24                                                    ║
║  Authority: Tradeora Engineering Constitution v3.0                           ║
║  Supersedes: v1.0 (2026-07-21)                                              ║
║  This document is the GOLDEN REFERENCE for AI recommendation flow.          ║
║  All implementations MUST comply. Deviations require Constitution-ADR.      ║
╚══════════════════════════════════════════════════════════════════════════════╝
```
