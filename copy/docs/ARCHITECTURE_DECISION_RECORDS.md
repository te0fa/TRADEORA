```
╔══════════════════════════════════════════════════════════════════════════════════╗
║         TRADEORA FINANCIAL OPERATING SYSTEM — ARCHITECTURE DECISION RECORDS     ║
║                   Living Document · Chief Architect Authority                   ║
║             Version 1.0 · Effective: 2025-01-01 · Status: ACTIVE               ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

# Architecture Decision Records — Tradeora FOS

This document is the authoritative catalog of all major architectural decisions made for the Tradeora Financial Operating System. Every decision recorded here is binding on all engineering teams. New decisions must follow the ADR Governance Process (Section: ADR Governance). Superseded decisions are retained for historical context.

**Guardian:** Chief Architect  
**Review Cycle:** Quarterly  
**Last Updated:** 2026-07-24  
**Total ADRs:** 49  

---

## Table of Contents

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](#adr-001-python-for-ai-services-typescriptnestjs-for-platform-services) | Python for AI Services, TypeScript/NestJS for Platform Services | ACCEPTED |
| [ADR-002](#adr-002-ollama--litellm-for-local-llm-inference) | Ollama + LiteLLM for Local LLM Inference | ACCEPTED |
| [ADR-003](#adr-003-valkey-over-redis-for-caching) | Valkey over Redis for Caching | ACCEPTED |
| [ADR-004](#adr-004-timescaledb-for-time-series-market-data) | TimescaleDB for Time-Series Market Data | ACCEPTED |
| [ADR-005](#adr-005-eventstoredb-for-event-sourcing) | EventStoreDB for Event Sourcing | ACCEPTED |
| [ADR-006](#adr-006-decimal-arithmetic--ieee-754-floats-prohibited) | Decimal Arithmetic — IEEE 754 Floats Prohibited | ACCEPTED |
| [ADR-007](#adr-007-schema-per-bounded-context-postgresql-isolation) | Schema-Per-Bounded-Context PostgreSQL Isolation | ACCEPTED |
| [ADR-008](#adr-008-kafka-for-all-cross-bc-communication) | Kafka for All Cross-BC Communication | ACCEPTED |
| [ADR-009](#adr-009-unleash-oss-for-feature-flags) | Unleash OSS for Feature Flags | ACCEPTED |
| [ADR-010](#adr-010-qdrant-for-vector-search) | Qdrant for Vector Search | ACCEPTED |
| [ADR-011](#adr-011-17-school-consensus-architecture-for-ai) | 17-School Consensus Architecture for AI | ACCEPTED |
| [ADR-012](#adr-012-keycloak-for-identity--access-management) | Keycloak for Identity & Access Management | ACCEPTED |
| [ADR-013](#adr-013-kong-oss-as-api-gateway) | Kong OSS as API Gateway | ACCEPTED |
| [ADR-014](#adr-014-minio-for-object-storage-with-worm) | MinIO for Object Storage with WORM | ACCEPTED |
| [ADR-015](#adr-015-patroni--postgresql-for-high-availability) | Patroni + PostgreSQL for High Availability | ACCEPTED |
| [ADR-016](#adr-016-arabic-first-language-architecture) | Arabic-First Language Architecture | ACCEPTED |
| [ADR-017](#adr-017-ulid-for-distributed-id-generation) | ULID for Distributed ID Generation | ACCEPTED |
| [ADR-018](#adr-018-openbao-for-secrets-management) | OpenBao for Secrets Management | ACCEPTED |
| [ADR-019](#adr-019-kafka-avro--schema-registry-for-event-contracts) | Kafka Avro + Schema Registry for Event Contracts | ACCEPTED |
| [ADR-020](#adr-020-row-level-security-for-retail-tenant-isolation) | Row-Level Security for Retail Tenant Isolation | ACCEPTED |
| [ADR-021](#adr-021-feature-governance-via-6-stage-lifecycle) | Feature Governance via 6-Stage Lifecycle | ACCEPTED |
| [ADR-022](#adr-022-egx-only-focus-for-phase-1) | EGX-Only Focus for Phase 1 | ACCEPTED |
| [ADR-023](#adr-023-look-ahead-bias-prevention) | Look-Ahead Bias Prevention | ACCEPTED |
| [ADR-024](#adr-024-gvisor-for-ai-school-sandboxing) | gVisor for AI School Sandboxing | ACCEPTED |
| [ADR-025](#adr-025-gitops-for-all-infrastructure-fluxcd) | GitOps for All Infrastructure — FluxCD | ACCEPTED |
| [ADR-026](#adr-026-grafana--prometheus-for-observability) | Grafana + Prometheus for Observability | ACCEPTED |
| [ADR-027](#adr-027-flyway-for-database-migrations) | Flyway for Database Migrations | ACCEPTED |
| [ADR-028](#adr-028-no-autonomous-trading--advisory-only) | No Autonomous Trading — Advisory Only | ACCEPTED |
| [ADR-029](#adr-029-camel-bert-for-arabic-nlp) | CAMeL-BERT for Arabic NLP | ACCEPTED |
| [ADR-030](#adr-030-opentelemetry-for-distributed-tracing) | OpenTelemetry for Distributed Tracing | ACCEPTED |
| [ADR-031](#adr-031-pdpl-2020-compliance-by-design) | PDPL 2020 Compliance by Design | ACCEPTED |
| [ADR-032](#adr-032-structlog-for-structured-logging) | Structlog for Structured Logging | ACCEPTED |
| [ADR-033](#adr-033-testcontainers-for-integration-tests) | Testcontainers for Integration Tests | ACCEPTED |
| [ADR-034](#adr-034-pgbouncer-for-connection-pooling) | PgBouncer for Connection Pooling | ACCEPTED |
| [ADR-035](#adr-035-constitution-driven-architecture) | Constitution-Driven Architecture | ACCEPTED |
| [ADR-036](#adr-036-horizontal-pod-autoscaler-for-all-services) | Horizontal Pod Autoscaler for All Services | ACCEPTED |
| [ADR-037](#adr-037-no-cross-schema-sql-queries) | No Cross-Schema SQL Queries | ACCEPTED |
| [ADR-038](#adr-038-qwen25-model-family-for-llm-inference) | Qwen2.5 Model Family for LLM Inference | ACCEPTED |
| [ADR-039](#adr-039-fra-advisory-only-registration) | FRA Advisory-Only Registration | ACCEPTED |
| [ADR-040](#adr-040-phase-gated-feature-flags-for-school-activation) | Phase-Gated Feature Flags for School Activation | ACCEPTED |

---

## Status Legend

| Status | Meaning |
|--------|---------|
| **ACCEPTED** | Decision is current, binding, and in effect |
| **SUPERSEDED** | Decision replaced by a newer ADR (reference provided) |
| **DEPRECATED** | Decision no longer applies; context has changed |
| **PROPOSED** | Under review by architecture board — not yet binding |

---

## ADR Template (MADR Format)

All ADRs follow this structure. Deviations require Chief Architect approval.

```
## ADR-{N}: {Title}
| Field | Value |
|-------|-------|
| Date | YYYY-MM-DD |
| Status | ACCEPTED | SUPERSEDED | DEPRECATED |
| Deciders | {roles} |
| Constitutional Reference | Article N — {Article Title} |
| Last Reviewed | YYYY-MM-DD |

### Context
### Decision
### Rationale
### Consequences
### Alternatives Considered
### Implementation Notes
```

---

## ADR-001: Python for AI Services, TypeScript/NestJS for Platform Services

| Field | Value |
|-------|-------|
| Date | 2024-09-01 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of AI Engineering, Head of Platform Engineering |
| Constitutional Reference | Article 1 — Technology Stack Governance |
| Last Reviewed | 2025-01-15 |

### Context

Tradeora's architecture comprises two fundamentally distinct engineering domains with divergent requirements. The AI domain (17 consensus schools, orchestration, NLP) requires Python's mature ML ecosystem: PyTorch, Hugging Face Transformers, NumPy, Pandas, LangChain, asyncio, and the broader scientific Python stack. The platform domain (49 NestJS bounded-context services, API gateway integration, CQRS projections, domain logic) requires enterprise-grade type safety, a powerful dependency injection framework, decorators for cross-cutting concerns (auth guards, interceptors, pipes), and a rich ecosystem for financial domain modelling. A single-language mandate forces unacceptable compromise in one of the two domains.

### Decision

**Python 3.12+** is the exclusive language for all AI schools, ML orchestration, model inference clients, and data pipeline services. **TypeScript 5.x with NestJS 10+** is the exclusive language for all platform, domain, and infrastructure services. No bounded context may mix the two languages. Communication between Python AI schools and TypeScript platform services occurs via well-defined gRPC or REST interfaces only.

### Rationale

Python 3.12 delivers a 60% performance improvement over 3.10 via specialized interpreter optimization (PEP 659). The Python ML ecosystem has no credible competitor for production AI workloads. NestJS provides Angular-inspired DI, Providers, Guards, Interceptors, and Pipes that map precisely to financial domain patterns (e.g., AuthGuard for RLS enforcement, TransformInterceptor for Decimal serialization). TypeScript's strict mode catches an entire class of null-reference and type-mismatch bugs at compile time — critical for financial code.

### Consequences

**Positive:**
- Best-in-class tooling for each domain without compromise
- Python AI schools access full PyTorch/Transformers/Scikit-learn ecosystem
- NestJS DI framework simplifies complex domain logic across 49 bounded contexts
- TypeScript strict mode prevents null-pointer exceptions in financial calculations
- Independent deployment pipelines optimized per language

**Negative / Trade-offs:**
- Two build pipelines, two CI configurations, two base Docker images
- Engineers require proficiency in both stacks; onboarding time increases
- Cross-context debugging requires polyglot proficiency
- Potential for API contract drift between Python and TypeScript services if Schema Registry (ADR-019) is not enforced

**Neutral:**
- Two separate linting configurations (pylint/ruff for Python, ESLint/TSLint for TypeScript)
- IDE configuration differs per team

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| Go (Golang) | Immature ML ecosystem; no mature transformers, NumPy equivalents; CGO overhead for native libs |
| Java / Spring Boot | Verbose boilerplate; 10-15s JVM startup too slow for AI school cold starts; inferior ML ecosystem |
| All-Python (FastAPI) | FastAPI's dependency injection is functional but not as powerful as NestJS's class-based DI for complex 49-BC domain logic; TypeScript's type system is strictly superior for financial safety |
| All-TypeScript | TensorFlow.js and ONNX.js cannot match Python ML ecosystem maturity; Transformers.js is experimental for production use |
| Rust | Outstanding performance but prohibitively steep learning curve; ML ecosystem nascent |

### Implementation Notes

**Python service structure (`pyproject.toml`):**
```toml
[tool.poetry]
name = "tradeora-technical-analysis-school"
version = "1.0.0"
python = "^3.12"

[tool.poetry.dependencies]
pydantic = "^2.5"
structlog = "^23.3"
httpx = "^0.26"
python-ulid = "^1.1"
opentelemetry-sdk = "^1.22"
```

**NestJS module structure:**
```typescript
// portfolio.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Holding]), KafkaModule],
  providers: [PortfolioService, PortfolioRepository, HoldingFactory],
  controllers: [PortfolioController],
  exports: [PortfolioService],
})
export class PortfolioModule {}
```

---

## ADR-002: Ollama + LiteLLM for Local LLM Inference

| Field | Value |
|-------|-------|
| Date | 2024-09-10 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, CISO, Head of AI Engineering, PDPL Legal Counsel |
| Constitutional Reference | Article 29 — OSS-First Mandate; Article 31 — Data Sovereignty |
| Last Reviewed | 2025-01-15 |

### Context

Egypt's Personal Data Protection Law 2020 (PDPL, Law 151/2020) prohibits the transfer of Egyptian personal data to foreign servers without explicit consent and regulatory approval. Cloud LLM APIs (OpenAI, Anthropic, Google Gemini) process all prompts — including user portfolio data, financial questions, and behavioral patterns — on foreign infrastructure, constituting a direct PDPL violation for financial data. Additionally, Constitution Article 29 mandates OSS-first for all Tradeora infrastructure. At scale (17 AI schools × thousands of daily active users), per-token API costs would be economically prohibitive.

### Decision

**Ollama** runs Qwen2.5:72b (primary) and Qwen2.5:7b (fallback) locally on Tradeora's GPU cluster (NVIDIA A100 80GB or equivalent). **LiteLLM** serves as the unified proxy layer for model routing, failover between models, cost tracking, and OpenAI-compatible API surface. All LLM inference for financial data processing is strictly air-gapped from external APIs. The Ollama instance is not exposed beyond the internal Kubernetes cluster network.

### Rationale

Ollama provides the simplest operational model for serving GGUF-quantized models locally with automatic GPU/CPU routing, REST API, and Kubernetes compatibility. LiteLLM provides a standard OpenAI-compatible interface so AI school code is model-agnostic — schools call LiteLLM, LiteLLM routes to Ollama. This decoupling means model upgrades (e.g., Qwen2.5:72b → Qwen3:72b) require only LiteLLM routing config changes, not school code changes.

### Consequences

**Positive:**
- PDPL compliant by architectural design — data never leaves Egypt infrastructure
- Zero per-token cost at scale (GPU CapEx amortized over millions of inferences)
- No vendor lock-in; model can be swapped without API contract changes
- Full control over model versions and quantization
- Arabic language quality optimized by model selection (ADR-038)

**Negative / Trade-offs:**
- GPU CapEx required (NVIDIA A100 80GB ≈ USD 10,000-15,000 per card)
- Ollama is single-host in Phase 1 (multi-host via vLLM deferred to Phase 2)
- Model updates require `ollama pull qwen2.5:72b` and service restart window
- GPU memory management requires careful resource allocation in Kubernetes

**Neutral:**
- LiteLLM config changes are operational, not code deployments
- Model benchmarking cadence: quarterly evaluation of new OSS model releases

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| OpenAI GPT-4 API | Direct PDPL violation (data egress); $0.03/1K tokens unsustainable at scale; vendor lock-in |
| Anthropic Claude API | Same data sovereignty violation; similar cost concerns |
| Google Gemini API | GCP infrastructure; data sovereignty violation |
| vLLM | Superior throughput via PagedAttention — deferred to Phase 2 for higher-scale inference |
| HuggingFace Inference Endpoints | Data egress to HuggingFace cloud; sovereignty violation |
| Azure OpenAI (West Europe) | Cloud dependency; not Egypt-hosted; PDPL uncertain for financial data |

### Implementation Notes

**LiteLLM routing config (`litellm_config.yaml`):**
```yaml
model_list:
  - model_name: qwen-primary
    litellm_params:
      model: ollama/qwen2.5:72b
      api_base: http://ollama.ai-inference.svc.cluster.local:11434
      timeout: 90
  - model_name: qwen-fallback
    litellm_params:
      model: ollama/qwen2.5:7b
      api_base: http://ollama.ai-inference.svc.cluster.local:11434
      timeout: 30

router_settings:
  routing_strategy: latency-based-routing
  fallbacks: [{"qwen-primary": ["qwen-fallback"]}]
  num_retries: 2
```

**GPU resource allocation (Kubernetes):**
```yaml
resources:
  limits:
    nvidia.com/gpu: "1"
    memory: "90Gi"
  requests:
    nvidia.com/gpu: "1"
    memory: "85Gi"
```

---

## ADR-003: Valkey over Redis for Caching

| Field | Value |
|-------|-------|
| Date | 2024-09-15 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of Infrastructure |
| Constitutional Reference | Article 29 — OSS-First Mandate |
| Last Reviewed | 2025-01-15 |

### Context

Redis 7.4+ adopted the Server Side Public License (SSPL), which requires companies offering Redis as a cloud service to open-source their entire stack — a condition that OSI does not recognize as an Open Source license. Constitution Article 29 mandates all Tradeora infrastructure components use OSI-approved open source licenses. Tradeora requires a high-performance, in-memory data store for: API rate limiting (per-user token buckets), session caching, AI school result caching (recommendation memoization within TTL), and ephemeral feature flag state.

### Decision

**Valkey 7.2+** (BSD-3-Clause license, Linux Foundation fork of Redis OSS, initiated March 2024) as Tradeora's primary caching and ephemeral data layer. Valkey maintains 100% Redis protocol and API compatibility — all Redis clients (redis-py for Python, ioredis for TypeScript) work transparently without code changes. Deployed as Valkey cluster (3 primary + 3 replica nodes) for HA.

### Rationale

Valkey is governed by the Linux Foundation (neutral, OSS-committed governance), uses BSD-3-Clause (fully OSS per OSI), and maintains strict Redis compatibility ensuring zero migration cost. The Valkey community includes ex-Redis core contributors (Madelyn Olson, Ping Xie) providing strong technical continuity. Valkey 7.2 adds performance improvements including slot migration speedups and improved memory efficiency.

### Consequences

**Positive:**
- Full OSS compliance (BSD-3-Clause, Article 29 satisfied)
- Zero code changes required (Redis-compatible API)
- Linux Foundation governance — long-term OSS commitment guaranteed
- Active development by experienced Redis contributors
- Cluster mode for HA without single point of failure

**Negative / Trade-offs:**
- Smaller community than Redis commercial ecosystem
- Some Redis Stack features (RedisGraph, RedisTimeSeries, RediSearch) not available in Valkey
- Redis enterprise support contracts not available for Valkey (community only)

**Neutral:**
- Monitoring via Prometheus redis_exporter works without modification (same protocol)
- Existing Redis Helm charts adapted with minimal changes

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| Redis 7.4+ (SSPL) | SSPL not OSS per OSI; directly violates Article 29 |
| Memcached | No persistence, no native data structures (sorted sets, hashes), no pub/sub |
| KeyDB | Acquired by Snap Inc.; uncertain OSS governance trajectory |
| Apache Ignite | Overkill for caching use case; Java-based adds complexity |
| Hazelcast OSS | Less mature ecosystem than Redis/Valkey; IMDG vs. cache-first design |

### Implementation Notes

**Rate limiting implementation (INCR + EXPIRE pattern):**
```python
import redis.asyncio as redis
from decimal import Decimal

async def check_rate_limit(client: redis.Redis, user_id: str, limit: int, window_seconds: int) -> bool:
    key = f"rate_limit:{user_id}:{window_seconds}"
    pipe = client.pipeline()
    pipe.incr(key)
    pipe.expire(key, window_seconds)
    results = await pipe.execute()
    current_count = results[0]
    return current_count <= limit
```

**Valkey cluster configuration:**
```yaml
# valkey-cluster.yaml (Helm values)
cluster:
  enabled: true
  nodes: 6       # 3 primary + 3 replica
  replicas: 1
persistence:
  enabled: true
  size: 10Gi
resources:
  limits:
    memory: 4Gi
    cpu: "2"
```

---

## ADR-004: TimescaleDB for Time-Series Market Data

| Field | Value |
|-------|-------|
| Date | 2024-09-20 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of Data Engineering, Lead Data Architect |
| Constitutional Reference | Article 8 — Data Architecture Standards |
| Last Reviewed | 2025-01-15 |

### Context

The Egyptian Exchange (EGX) generates 100,000+ OHLCV (Open/High/Low/Close/Volume) data points per trading day across approximately 350 listed securities. Technical Analysis and Pattern Recognition AI schools require microsecond-resolution tick data queries, rolling-window moving averages (SMA-20, EMA-50, EMA-200), time-bucket OHLCV aggregation, and percent-change calculations across arbitrary time ranges. Standard PostgreSQL B-tree indexes on `timestamp` columns degrade severely beyond 10 million rows without manual partitioning, and manual partitioning across 49 bounded contexts is an operational burden no team should absorb.

### Decision

**TimescaleDB** (PostgreSQL extension, Timescale Community License — permissive for self-hosted use) for all time-series data stores: OHLCV tables, tick data, index values (EGX30, EGX100), macroeconomic time series (CPI, GDP, FX rates), and sentiment scores over time. Hypertables with 1-day chunk intervals. Continuous aggregates pre-compute OHLCV rollups for all standard timeframes (1m, 5m, 15m, 1h, 1d). Compression policy: compress chunks older than 7 days (90%+ storage reduction via columnar compression).

### Rationale

TimescaleDB transforms PostgreSQL into a purpose-built time-series database while retaining full SQL compatibility, JOIN capability with relational data, and Flyway migration support. The `time_bucket()` function eliminates complex CASE/GROUP BY aggregation code. Continuous aggregates ensure OHLCV rollup queries are O(1) regardless of underlying data volume — critical for AI school latency budgets.

### Consequences

**Positive:**
- 100x faster time-range queries vs. plain PostgreSQL on large datasets (TimescaleDB benchmarks)
- Automatic chunk partitioning — zero manual partition management
- `time_bucket()`, `first()`, `last()` functions eliminate complex OHLCV aggregation code
- Continuous aggregates: pre-computed rollups eliminate on-the-fly computation
- Columnar compression: 90%+ storage reduction for historical data
- Full SQL and JOIN compatibility with PostgreSQL relational tables

**Negative / Trade-offs:**
- TimescaleDB adds a dependency to PostgreSQL installation (extension must be installed)
- Some DDL operations differ from standard PostgreSQL (must use `create_hypertable()` after CREATE TABLE)
- Timescale Community Edition (TSL) license: review required; self-hosted use is free and permitted
- Compression: compressed chunks are read-only; decompression required for updates (rare for market data)

**Neutral:**
- Flyway migrations work normally; `create_hypertable()` is called in a migration
- Existing PostgreSQL monitoring and tooling works without modification

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| InfluxDB 3.0 | Separate DB engine; JOIN with PostgreSQL portfolio data impossible; Flux query language steep learning curve |
| QuestDB | Smaller community; fewer integrations; less mature PostgreSQL compatibility layer |
| ClickHouse | Deferred to Phase 3 for analytics-scale OLAP; overkill for Phase 1 EGX data volumes |
| Apache Cassandra | Eventual consistency inappropriate for financial OHLCV; no SQL JOINs |
| Plain PostgreSQL + manual partitioning | 10x slower for time-range queries; manual partitioning adds operational burden |

### Implementation Notes

**Hypertable creation (Flyway migration):**
```sql
-- V1_0_0__create_market_data_hypertable.sql
CREATE TABLE market_data.ohlcv (
  time         TIMESTAMPTZ NOT NULL,
  symbol       VARCHAR(20)  NOT NULL,
  open         NUMERIC(20,8) NOT NULL,  -- Decimal (ADR-006)
  high         NUMERIC(20,8) NOT NULL,
  low          NUMERIC(20,8) NOT NULL,
  close        NUMERIC(20,8) NOT NULL,
  volume       BIGINT NOT NULL,
  available_from_timestamp TIMESTAMPTZ NOT NULL  -- Look-ahead guard (ADR-023)
);

SELECT create_hypertable('market_data.ohlcv', 'time', chunk_time_interval => INTERVAL '1 day');

-- Continuous aggregate for daily OHLCV
CREATE MATERIALIZED VIEW market_data.ohlcv_daily
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 day', time) AS bucket,
       symbol,
       first(open, time)  AS open,
       max(high)          AS high,
       min(low)           AS low,
       last(close, time)  AS close,
       sum(volume)        AS volume
FROM market_data.ohlcv
GROUP BY bucket, symbol;

-- Compression policy
SELECT add_compression_policy('market_data.ohlcv', INTERVAL '7 days');
```

---

## ADR-005: EventStoreDB for Event Sourcing

| Field | Value |
|-------|-------|
| Date | 2024-09-25 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, DDD Lead, Compliance Architect |
| Constitutional Reference | Article 3 — DDD Principles; Article 12 — Audit and Compliance |
| Last Reviewed | 2025-01-15 |

### Context

Financial systems require immutable audit trails where every state change is recorded and replayable. FRA requires the ability to reconstruct portfolio state at any point in time within a 7-year window. Event sourcing — storing the sequence of domain events that produced current state, rather than current state alone — is the architectural pattern that enables this. The system requires stream-based subscriptions (for projection rebuilding), catch-up subscriptions (for new projection bootstrapping), and per-stream ordering guarantees.

### Decision

**EventStoreDB** (OSS, Apache 2.0, event-native database) as the append-only event store for all financial domain events. PostgreSQL serves as the read model (projection) store, rebuilt from EventStoreDB streams. CQRS applied to all financial bounded contexts. Events are NEVER deleted. EventStoreDB stream naming convention: `{BCName}-{AggregateType}-{AggregateId}` (e.g., `Portfolio-Portfolio-01HWKP4MFVX7XNPQRST`).

### Rationale

EventStoreDB is purpose-built for event sourcing with: native stream subscriptions (persistent and catch-up), server-side projections in JavaScript, optimistic concurrency via expected version, and strong per-stream ordering. Kafka can emulate event sourcing but lacks per-stream ordering across partitions, and log compaction (a Kafka feature) can silently delete events — catastrophic for an event-sourced financial system.

### Consequences

**Positive:**
- Immutable audit trail by architectural design — no DELETE possible on event store
- Event replay for debugging: reconstruct any aggregate's state at any point in time
- Temporal queries: "what was the portfolio worth on 2024-Q3 close?" are trivially answerable
- Decoupled read/write models; projections can be rebuilt independently
- Natural fit for DDD aggregates with optimistic concurrency control

**Negative / Trade-offs:**
- Two databases per financial BC (EventStoreDB for write model + PostgreSQL for read model)
- Eventual consistency: read models lag behind events by milliseconds to seconds
- Team must learn event sourcing patterns (significant learning investment)
- Projection rebuilding for large streams can take minutes to hours
- EventStoreDB cluster requires careful storage provisioning (events grow indefinitely)

**Neutral:**
- EventStoreDB cluster: 3 nodes (odd number for leader election quorum)
- gRPC client available for both TypeScript and Python

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| Apache Kafka as event store | Log compaction can delete events; no per-stream ordering across partitions; no built-in projections or catch-up subscriptions designed for event sourcing |
| Axon Framework | Java-only; conflicts with ADR-001 (TypeScript for platform services) |
| Custom PostgreSQL event table | Lacks built-in subscriptions, projections, catch-up mechanisms; no optimistic concurrency |
| Marten (PostgreSQL event sourcing) | .NET-only; not applicable to TypeScript NestJS stack |

### Implementation Notes

**EventStoreDB stream naming convention:**

| BC | Aggregate | Stream Pattern | Example |
|----|-----------|---------------|---------|
| Portfolio | Portfolio | `Portfolio-Portfolio-{id}` | `Portfolio-Portfolio-01HWKP4` |
| AIConsensus | Recommendation | `AIConsensus-Recommendation-{id}` | `AIConsensus-Recommendation-01HWKP5` |
| Compliance | KYCRecord | `Compliance-KYCRecord-{id}` | `Compliance-KYCRecord-01HWKP6` |

**TypeScript append event example:**
```typescript
import { EventStoreDBClient, jsonEvent } from '@eventstore/db-client';

const client = EventStoreDBClient.connectionString('esdb://esdb.tradeora.internal:2113');

const event = jsonEvent({
  type: 'HoldingAdded',
  data: {
    portfolioId: 'prt_01HWKP4MFVX7XNPQRST',
    symbol: 'COMI',
    quantity: new Decimal('500'),
    avgCostPrice: new Decimal('52.75'),
  },
});

await client.appendToStream(
  `Portfolio-Portfolio-prt_01HWKP4MFVX7XNPQRST`,
  [event],
  { expectedRevision: BigInt(currentVersion) }  // Optimistic concurrency
);
```

---

## ADR-006: Decimal Arithmetic — IEEE 754 Floats Prohibited

| Field | Value |
|-------|-------|
| Date | 2024-10-01 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Lead Financial Engineer, QA Lead |
| Constitutional Reference | Article 17 — Financial Calculation Standards |
| Last Reviewed | 2025-01-15 |

### Context

IEEE 754 floating-point arithmetic introduces rounding errors that are fundamentally unacceptable in financial calculations. The canonical example: `0.1 + 0.2 = 0.30000000000000004` in Python `float`. For a portfolio with EGP 10,000,000 in assets, a 0.000001% rounding error equals EGP 100 — a reportable discrepancy under FRA rules. Across millions of daily calculations (NAV computation, portfolio weight calculation, technical indicator computation, fee calculation), float errors accumulate into material misstatements with regulatory and legal consequences.

### Decision

ALL financial calculations MUST use **Python `Decimal`** (`decimal.Context(prec=28, rounding=ROUND_HALF_EVEN)`) or **TypeScript `Decimal.js`** (28 significant digits). Prohibited types for financial values: `float`, `double`, `np.float32`, `np.float64`. This prohibition covers: money amounts, portfolio values, NAV, prices, rates, percentage values, ratios, and fee calculations. Enforced by CI lint rule `ast_float_checker.py` that fails any build containing float literals in financial modules. Money stored as `BIGINT` (integer cents) or `NUMERIC(20,8)` in PostgreSQL — never `FLOAT` or `DOUBLE PRECISION`.

### Rationale

Python `Decimal` with `prec=28` and `ROUND_HALF_EVEN` (banker's rounding) provides exact decimal representation matching the mathematical operations performed by human accountants. ROUND_HALF_EVEN distributes rounding error fairly (avoids systematic bias). The 28-digit precision exceeds any reasonable financial calculation requirement for EGX securities. JavaScript `Decimal.js` provides identical semantics for TypeScript services.

### Consequences

**Positive:**
- Exact decimal arithmetic; no rounding accumulation across millions of calculations
- FRA-compliant financial statements — no unexplained rounding discrepancies
- ROUND_HALF_EVEN (banker's rounding) for fair, symmetric rounding distribution
- CI enforcement prevents accidental float introduction by new engineers
- PostgreSQL NUMERIC(20,8) stores exact decimal values

**Negative / Trade-offs:**
- Python `Decimal` is 10-30x slower than `float` arithmetic (acceptable given latency budgets)
- `Decimal.js` adds ~15KB gzipped to TypeScript bundle
- NumPy operations require conversion from `Decimal` to `float` and back (AI schools doing statistical calculations must explicitly convert with care)
- JSON serialization of `Decimal` requires custom encoder; `json.dumps(Decimal('3.14'))` raises `TypeError`

**Neutral:**
- All API responses serialize financial values as strings (e.g., `"price": "52.75"`) to preserve precision through JSON
- Database column types enforced via Flyway migration reviews

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| Java BigDecimal | Viable technically but conflicts with ADR-001 (Python preferred for AI services) |
| Fixed-point integer arithmetic | Too error-prone to implement correctly at scale; higher-level Decimal is safer |
| mpmath | 50-digit arbitrary precision is overkill; 28 digits sufficient; Decimal is standard library |
| IEEE 754 with careful rounding | "Careful rounding" is not enforceable at scale; CI can't distinguish careful from careless float use |

### Implementation Notes

**Python Decimal setup:**
```python
from decimal import Decimal, Context, ROUND_HALF_EVEN, setcontext

FINANCIAL_CONTEXT = Context(prec=28, rounding=ROUND_HALF_EVEN)
setcontext(FINANCIAL_CONTEXT)

# Usage
price = Decimal('52.75')
quantity = Decimal('500')
total = price * quantity  # Decimal('26375.00') — exact

# Custom JSON encoder
import json
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return super().default(obj)
```

**TypeScript Decimal.js:**
```typescript
import Decimal from 'decimal.js';
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

const price = new Decimal('52.75');
const quantity = new Decimal('500');
const total = price.mul(quantity);  // Decimal('26375.00')
```

**PostgreSQL column definitions:**
```sql
price         NUMERIC(20, 8) NOT NULL,   -- Stock prices (EGP, up to 8 decimal places)
quantity      NUMERIC(20, 4) NOT NULL,   -- Share quantities
total_value   NUMERIC(20, 2) NOT NULL,   -- EGP monetary values (2 decimal places)
fee_amount    BIGINT         NOT NULL,   -- Fees in millipiasters (1 EGP = 1000 millipiasters)
```

---

## ADR-007: Schema-Per-Bounded-Context PostgreSQL Isolation

| Field | Value |
|-------|-------|
| Date | 2024-10-05 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, DDD Lead, Head of Platform Engineering |
| Constitutional Reference | Article 3 — DDD; Article 7 — Bounded Context Isolation |
| Last Reviewed | 2025-01-15 |

### Context

With 49 bounded contexts and multiple engineering teams, a shared PostgreSQL schema creates dangerous coupling. One team's `ALTER TABLE` migration can break another team's queries running against the same table. Shared tables lead to God objects where multiple BCs manipulate the same data structure, violating DDD aggregate boundaries. The DDD principle of bounded context isolation requires data isolation as a technical guarantee, not a social convention.

### Decision

Each bounded context owns exactly **ONE PostgreSQL schema** named after the BC (e.g., `CREATE SCHEMA portfolio; CREATE SCHEMA ai_consensus; CREATE SCHEMA compliance;`). The BC's service database user has `USAGE` + table privileges ONLY on its own schema. Cross-schema SQL queries are PROHIBITED (enforced per ADR-037). Data sharing between BCs occurs exclusively via Kafka events (ADR-008). Flyway migrations for each BC live under `{bc-module}/src/migrations/` and are applied only to that BC's schema.

### Rationale

Schema-level isolation provides a technical barrier that makes BC coupling physically impossible through normal development. A `JOIN` to another schema fails with a PostgreSQL permission error — enforced at the database engine level, not by code review or policy. This is the most effective way to prevent schema coupling from creeping in under delivery pressure.

### Consequences

**Positive:**
- True BC isolation — no accidental coupling via shared tables
- Independent migration: one BC's Flyway migration cannot affect another BC's tables
- Clear ownership: schema name = BC name = team ownership
- Reduced scope for each team's cognitive load (own schema only)
- Enables independent scaling of each BC's database user connections

**Negative / Trade-offs:**
- Data duplication across schemas (by DDD design intent — duplicate the data, not the schema)
- No cross-BC SQL reporting queries (must use Kafka-derived analytics read models or separate data warehouse)
- More PostgreSQL schema objects to manage (49 schemas in one cluster)

**Neutral:**
- Schema naming: all lowercase snake_case (e.g., `market_data`, `ai_consensus`, `audit_trail`)
- Schema creation is a one-time infrastructure operation per BC

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| Table-per-BC in shared schema | Hard to enforce isolation; namespace collision risk; no DB-level permission enforcement |
| Database-per-BC | 49 PostgreSQL clusters is operationally unmanageable in Phase 1; Patroni cluster per DB; extreme HA overhead |
| Single schema for all BCs | Directly violates DDD bounded context isolation; God schema anti-pattern |

### Implementation Notes

**PostgreSQL schema and permission setup:**
```sql
-- Run once per BC during infrastructure bootstrap
CREATE SCHEMA IF NOT EXISTS portfolio;

CREATE USER portfolio_svc WITH PASSWORD '${dynamic_password}';
GRANT USAGE ON SCHEMA portfolio TO portfolio_svc;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA portfolio TO portfolio_svc;
ALTER DEFAULT PRIVILEGES IN SCHEMA portfolio
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO portfolio_svc;

-- Explicitly DENY access to other schemas
REVOKE ALL ON SCHEMA ai_consensus FROM portfolio_svc;
REVOKE ALL ON SCHEMA compliance FROM portfolio_svc;
```

**BC schema inventory (partial):**

| BC Name | Schema | Owner Team |
|---------|--------|------------|
| Portfolio | `portfolio` | Platform Team |
| AIConsensus | `ai_consensus` | AI Team |
| Compliance | `compliance` | Compliance Team |
| AuditTrail | `audit_trail` | Platform Team |
| MarketData | `market_data` | Data Team |
| UserProfile | `user_profile` | Platform Team |
| Notification | `notification` | Platform Team |

---

## ADR-008: Kafka for All Cross-BC Communication

| Field | Value |
|-------|-------|
| Date | 2024-10-08 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of Platform Engineering, Head of Data Engineering |
| Constitutional Reference | Article 4 — Event-Driven Architecture; Article 7 — BC Isolation |
| Last Reviewed | 2025-01-15 |

### Context

49 bounded contexts need to share data and coordinate without tight coupling. REST calls between BCs create temporal coupling (if BC-A is down, BC-B fails), data coupling (BC-B must know BC-A's internal API shape), and cascade failure risk. Event-driven architecture via Kafka decouples producers and consumers both temporally and spatially — a producer publishes to Kafka and is unaware of its consumers; consumers process at their own pace; both can be independently deployed and scaled.

### Decision

ALL cross-BC data sharing via **Kafka events**. Topic naming: `tradeora.{source_bc}.{entity}.{event_verb}` (e.g., `tradeora.portfolio.holding.updated`). Synchronous REST/gRPC permitted **only within** a BC (intra-BC service calls). Confluent Schema Registry (OSS) for Avro schema governance (ADR-019). Kafka cluster: 3 brokers, replication factor 3, min ISR 2, `acks=all` on producers for financial events.

### Rationale

Kafka provides temporal decoupling (both parties don't need to be online simultaneously), independent scaling of consumers, event replay capability (configurable retention — 7 days for operational, indefinite for audit), natural fan-out (multiple BCs can consume the same event), and a natural audit trail for all cross-BC interactions. EGX tick data volume (100K+ events/day) requires the throughput that Kafka provides natively.

### Consequences

**Positive:**
- Temporal decoupling — producer and consumer availability are independent
- Independently scalable consumers (consumer group horizontal scaling)
- Event replay: debug production issues by replaying event sequences
- Natural fan-out: one event consumed by multiple BCs without producer changes
- EGX tick data: 100K+ events/day handled trivially by Kafka

**Negative / Trade-offs:**
- Eventual consistency: UI must handle the fact that a portfolio update may not be immediately visible
- Kafka operational complexity: ZooKeeper/KRaft, partition management, consumer group lag monitoring
- Message ordering guaranteed only within a partition (design topics to use consistent partition keys)
- Debugging async event flows requires distributed tracing (ADR-030)

**Neutral:**
- Consumer groups allow independent replay without affecting other consumers
- Kafka retention: operational topics 7 days; audit topics 90 days (cold storage in MinIO)

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| REST API calls between BCs | Tight coupling; cascade failures; synchronous dependency; violates BC isolation |
| GraphQL Federation | Query-oriented, not event-oriented; does not solve write-path coupling |
| RabbitMQ | Lower throughput ceiling; less suitable for EGX tick data; Kafka superior for high-volume streams |
| gRPC Streaming | High performance but lacks persistence, replay, and fan-out; requires both services online |

### Implementation Notes

**Topic naming convention:**

| Pattern | Example | Description |
|---------|---------|-------------|
| `tradeora.{bc}.{entity}.{verb}` | `tradeora.portfolio.holding.updated` | Standard domain event |
| `tradeora.{bc}.{entity}.{verb}.dlq` | `tradeora.portfolio.holding.updated.dlq` | Dead letter queue |
| `tradeora.system.{name}.{verb}` | `tradeora.system.school.activated` | System events |

**TypeScript producer example:**
```typescript
@Injectable()
export class HoldingEventPublisher {
  constructor(@Inject(KAFKA_CLIENT) private kafka: ClientKafka) {}

  async publishHoldingUpdated(event: HoldingUpdatedEvent): Promise<void> {
    await this.kafka.emit('tradeora.portfolio.holding.updated', {
      key: event.portfolioId,   // Partition key: all events for one portfolio go to same partition
      value: event,
      headers: {
        'X-Request-ID': event.requestId,
        'traceparent': event.traceContext,
        'schema-version': '1.0.0',
      },
    }).toPromise();
  }
}
```

---

## ADR-009: Unleash OSS for Feature Flags

| Field | Value |
|-------|-------|
| Date | 2024-10-12 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of Product, CISO |
| Constitutional Reference | Article 29 — OSS-First; Article 21 — Feature Lifecycle |
| Last Reviewed | 2025-01-15 |

### Context

Every Tradeora feature must be flag-gated for gradual rollout, emergency kill switches, and A/B testing. Financial features require server-side flag evaluation — client-side evaluation (e.g., JavaScript in the browser) is a compliance risk because a compromised client could bypass kill switches affecting financial data display. The flag platform must be self-hosted to comply with data sovereignty requirements (flag evaluation data reveals user behavior patterns).

### Decision

**Unleash OSS 5.x** (self-hosted on Kubernetes, Apache 2.0 license) as Tradeora's feature flag platform. Unleash SDK integrated in all Python and TypeScript services. Server-side evaluation ONLY for all financial features. Kill switches: instant global disable via Unleash API. Gradual rollout: Unleash gradual rollout strategy with user cohort percentage. Unleash API protected by Keycloak service accounts. Flag changes logged as FEATURE_FLAG audit events (ADR Audit Trail).

### Rationale

Unleash provides the richest OSS feature flag capability: gradual rollout, A/B/n testing, user segment targeting, instant kill switch, SDK for Python and TypeScript, audit log, and a web UI for product managers. Self-hosting satisfies data sovereignty requirements. LaunchDarkly (the industry standard) is proprietary SaaS — rejected under Article 29.

### Consequences

**Positive:**
- Instant kill switches for any feature without redeployment
- Gradual rollout prevents blast radius of bugs reaching all users simultaneously
- Server-side evaluation: flag logic cannot be bypassed by clients
- Audit log: every flag change recorded (who changed it, when, from what value)
- Unleash SDK caches flags locally — no latency on flag evaluation

**Negative / Trade-offs:**
- Self-hosted operational overhead (Unleash requires PostgreSQL + Redis backing)
- Unleash OSS lacks advanced analytics (enterprise feature)
- Flag proliferation risk: 40 schools × multiple flags = management overhead

**Neutral:**
- Unleash admin UI for product managers to control rollout without engineering involvement
- SDK polling interval: 15 seconds (flags are eventually consistent within 15s of change)

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| LaunchDarkly | Proprietary SaaS; data egress; Article 29 violation |
| ConfigCat | SaaS primary; limited OSS tier |
| Split.io | Proprietary |
| Custom YAML-based flags | No runtime control; requires redeployment to change flag state; no audit log |
| Flagsmith OSS | Viable alternative; Unleash chosen for larger community and better SDK quality |

### Implementation Notes

**Flag naming convention:**

| Category | Pattern | Example |
|----------|---------|---------|
| AI School activation | `ai.school.{name}.enabled` | `ai.school.technical_analysis.enabled` |
| Feature flag | `feature.{bc}.{name}.enabled` | `feature.portfolio.rebalancing.enabled` |
| Kill switch | `killswitch.{service}.{name}` | `killswitch.wisdom_engine.consensus` |
| Phase gate | `phase.{n}.{name}.active` | `phase.2.options_flow.active` |

**NestJS Guard integration:**
```typescript
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(private unleash: UnleashService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const flagKey = this.reflector.get<string>('featureFlag', context.getHandler());
    return this.unleash.isEnabled(flagKey, { userId: request.user.id });
  }
}
```

---

## ADR-010: Qdrant for Vector Search

| Field | Value |
|-------|-------|
| Date | 2024-10-15 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of AI Engineering |
| Constitutional Reference | Article 29 — OSS-First; Article 11 — AI Infrastructure |
| Last Reviewed | 2025-01-15 |

### Context

PeerComparison school requires vector similarity search across 350+ EGX-listed company financial profiles (embeddings of fundamental ratios, sector characteristics, financial health scores). PatternRecognition school requires similarity search across 10,000+ historical EGX chart patterns (OHLCV pattern embeddings). Both require millisecond ANN (approximate nearest neighbor) search with payload filtering (filter by sector, market cap tier, listing date range) — standard SQL `LIKE` queries and B-tree indexes cannot serve this use case.

### Decision

**Qdrant** (OSS, Apache 2.0, written in Rust, high-performance ANN) for all vector search operations. Collections: `company_profiles` (768-dim, financial embedding), `chart_patterns` (512-dim, OHLCV pattern embedding), `news_embeddings` (768-dim, CAMeL-BERT-MSA embeddings). HNSW indexing (hierarchical navigable small world graph). Payload filtering for EGX sector, market cap tier, and date range. Self-hosted in Kubernetes with persistent volume (NVMe preferred for HNSW index performance).

### Rationale

Qdrant's Rust implementation delivers HNSW search with P99 < 5ms for 100K-vector collections — well within AI school latency budgets. Filtered ANN (Qdrant's native payload filter applied during graph traversal, not post-filtering) ensures filter conditions don't degrade result quality. Qdrant's Python client is excellent, integrating naturally with Python AI schools.

### Consequences

**Positive:**
- P99 < 5ms ANN search for 100K-vector collections (Rust performance)
- Filtered ANN: payload filters applied during graph traversal (not post-filter quality degradation)
- Apache 2.0 license — full OSS compliance
- Python client: idiomatic, async-compatible
- Kubernetes-native deployment with persistent volume support

**Negative / Trade-offs:**
- No native JOIN with PostgreSQL: application-level join required (Qdrant returns IDs, app fetches details from PostgreSQL)
- Qdrant OSS lacks distributed cluster mode in early versions (single-node in Phase 1)
- Requires separate infrastructure footprint (CPU + RAM + NVMe storage)
- Vector index warm-up required after restart (HNSW graph loading)

**Neutral:**
- Vector update strategy: full re-upsert (Qdrant supports upsert with version control)
- Collection snapshots for backup (daily)

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| pgvector (PostgreSQL extension) | Adds connection pool pressure to shared PostgreSQL; slower for large-scale ANN (100K+ vectors); HNSW not as optimized as Qdrant's implementation |
| Pinecone | Proprietary SaaS; data sovereignty violation; PDPL concern |
| Weaviate | Viable; Qdrant chosen for superior benchmark performance and lighter operational footprint |
| Milvus | Go dependency; heavier operational footprint; more complex deployment |

### Implementation Notes

```python
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct, Filter, FieldCondition, MatchValue

client = AsyncQdrantClient(host="qdrant.vector.svc.cluster.local", port=6333)

# Create collection
await client.create_collection(
    collection_name="company_profiles",
    vectors_config=VectorParams(size=768, distance=Distance.COSINE),
)

# Search with payload filter
results = await client.search(
    collection_name="company_profiles",
    query_vector=embedding_vector,
    query_filter=Filter(
        must=[FieldCondition(key="sector", match=MatchValue(value="Banking"))]
    ),
    limit=10,
)
```

---

## ADR-011: 17-School Consensus Architecture for AI

| Field | Value |
|-------|-------|
| Date | 2024-10-20 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of AI Research, FRA Compliance Advisor, Chief Risk Officer |
| Constitutional Reference | Article 10 — AI Governance; Article 15 — Risk Management |
| Last Reviewed | 2025-01-15 |

### Context

Single AI model financial recommendations carry unacceptable hallucination and error risk. A single model confidently recommending a stock that reverses within days creates reputational, legal, and regulatory liability. FRA expects documented, robust AI decision processes. Ensemble methods reduce variance and improve reliability through diversity of analytical approaches — technical analysis says one thing, fundamental analysis may agree or disagree, macro context qualifies both.

### Decision

**17-school consensus architecture**: 12 schools in Phase 1, 5 in Phase 2. Schools run in parallel (asyncio). Each school returns: `vote` (BUY/HOLD/SELL), `confidence` (Decimal 0.0–1.0), `explanation` (Arabic text), `evidence` (JSON key facts). WisdomEngine aggregates via weighted voting. Minimum quorum: 9/12 schools must respond within 1500ms. Minimum aggregate confidence: 0.75. Below threshold → `DATA_INSUFFICIENT` (no recommendation issued).

### Rationale

17 schools representing 6 analytical families (technical, fundamental, macro, sentiment, quantitative, alternative) provide genuine analytical diversity. A BUY recommendation requires convergence across multiple independent lines of evidence, substantially reducing hallucination risk. Each school's vote and explanation is logged for FRA audit trail — the recommendation is fully explainable.

### Consequences

**Positive:**
- Substantially reduced hallucination risk through multi-school convergence
- Fully explainable: every recommendation backed by 12 independent school votes with explanations
- FRA regulatory defensibility: documented multi-factor analysis process
- DATA_INSUFFICIENT safety valve prevents low-confidence recommendations reaching users
- Analytical diversity: 6 different analytical families represented

**Negative / Trade-offs:**
- 1500ms latency budget is tight; every school must complete within budget
- School weight calibration requires ongoing maintenance and backtesting
- GPU resource intensive: 12 schools may call LLM inference in parallel
- Quorum failure must be handled gracefully in UI (user-facing messaging)

**Neutral:**
- School weights are runtime-configurable via Unleash (no redeployment needed for weight adjustment)
- Phase 2 schools activate via feature flag (ADR-040) without architectural changes

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| Single GPT-4 API call | PDPL violation; hallucination risk; no explainability; no multi-factor analysis |
| 3-model ensemble | Insufficient analytical diversity; too few independent perspectives |
| Human analysts only | Doesn't scale; not real-time; inconsistent quality |

### Implementation Notes

**Phase 1 school weights (sum = 1.0):**

| School | Weight | Analytical Family |
|--------|--------|------------------|
| TechnicalAnalysis | 0.12 | Technical |
| FundamentalAnalysis | 0.14 | Fundamental |
| MacroEconomic | 0.10 | Macro |
| SentimentAnalysis | 0.10 | Sentiment |
| PatternRecognition | 0.08 | Technical |
| PeerComparison | 0.08 | Fundamental |
| MomentumAnalysis | 0.08 | Quantitative |
| RiskAssessment | 0.10 | Risk |
| ValuationModel | 0.10 | Fundamental |
| LiquidityAnalysis | 0.05 | Market Structure |
| SeasonalityAnalysis | 0.03 | Quantitative |
| NewsEventAnalysis | 0.02 | Sentiment |
| **Total** | **1.00** | |

---

## ADR-012: Keycloak for Identity & Access Management

| Field | Value |
|-------|-------|
| Date | 2024-10-22 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, CISO, Head of Platform Engineering, Legal |
| Constitutional Reference | Article 29 — OSS-First; Article 31 — Data Sovereignty; Article 16 — Security |
| Last Reviewed | 2025-01-15 |

### Context

User identity data (name, email, phone, national ID for KYC linkage) must remain in Egypt per PDPL 2020 data localization requirements. Cloud IdP solutions (Auth0, AWS Cognito, Firebase Auth) process authentication on foreign infrastructure. Tradeora needs OIDC 1.0 + OAuth 2.0 compliance, RBAC with fine-grained scopes, MFA (TOTP + FIDO2), social login (Google, Apple), and integration with KYC/AML compliance flows.

### Decision

**Keycloak 24.x** (Red Hat, Apache 2.0) self-hosted on Kubernetes. Realms: `retail` (end users), `institutional` (fund managers, brokers), `admin` (Tradeora operations). JWT signing: RS256 (asymmetric). PKCE for mobile clients. FIDO2/WebAuthn for biometric authentication. Role hierarchy: INVESTOR → PREMIUM_INVESTOR → ANALYST → COMPLIANCE → ADMIN → SUPER_ADMIN.

### Rationale

Keycloak is the most mature OSS OIDC-compliant IAM solution with production-grade RBAC, MFA, social login, FIDO2/WebAuthn, event listeners for PDPL consent tracking, and extensive documentation. Self-hosting satisfies PDPL data localization. The Red Hat ecosystem provides long-term maintenance commitment.

### Consequences

**Positive:**
- Full PDPL compliance: user identity data stays in Egypt
- OIDC/OAuth2 standard: all services validate JWT tokens without Keycloak dependency at runtime
- RBAC built-in: fine-grained scopes per API endpoint
- MFA: TOTP + FIDO2 out-of-the-box
- Social login: Google, Apple OAuth (authentication redirected to provider, tokens issued by Keycloak)

**Negative / Trade-offs:**
- Keycloak is operationally complex: JVM-based, requires PostgreSQL backend, 512MB+ RAM per instance
- Upgrade path between Keycloak major versions can require data migration
- Custom themes require FreeMarker templating (learning curve)
- Keycloak clustering requires sticky sessions or distributed Infinispan cache

**Neutral:**
- Keycloak admin API: used by User Management BC for programmatic user operations
- JWT expiry: access token 15min, refresh token 24h (configurable per realm)

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| Auth0 | Proprietary SaaS; user identity data leaves Egypt; PDPL violation |
| AWS Cognito | Cloud lock-in; data sovereignty concern; pricing at scale |
| Firebase Authentication | Google infrastructure; PDPL violation |
| Custom JWT implementation | Security risk; not OIDC standard; maintenance burden |
| Dex (OIDC server) | Less mature; fewer features (no MFA, no social login built-in) |

---

## ADR-013: Kong OSS as API Gateway

| Field | Value |
|-------|-------|
| Date | 2024-10-25 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of Platform Engineering, CISO |
| Constitutional Reference | Article 29 — OSS-First; Article 16 — Security |
| Last Reviewed | 2025-01-15 |

### Context

49 bounded context services expose APIs that must be secured, rate-limited, and observable from a single entry point. Without a centralized API gateway, each service independently implements JWT validation, rate limiting, correlation ID injection, and request/response logging — creating inconsistency and security gaps. Centralizing these concerns at the gateway guarantees uniform policy enforcement.

### Decision

**Kong Gateway OSS** (Apache 2.0) self-hosted on Kubernetes. Enabled plugins: `jwt` (RS256 token validation against Keycloak JWKS endpoint), `rate-limiting` (per-user, per-IP, per-route using Valkey backend), `prometheus` (metrics), `request-transformer` (inject X-User-ID header from JWT claims), `correlation-id` (inject X-Request-ID if missing), `opentelemetry` (trace propagation). Declarative config via `deck` for GitOps compatibility.

### Rationale

Kong's plugin architecture allows centralized enforcement of cross-cutting concerns without modifying service code. The `jwt` plugin validates and decodes JWT tokens at the gateway — services receive pre-validated user context via request headers, eliminating redundant validation in every service. The declarative `deck` configuration enables GitOps-managed gateway configuration (PR → review → apply).

### Consequences

**Positive:**
- Centralized JWT validation: one point of enforcement, no service-level inconsistency
- Rate limiting at gateway: protects all services without per-service implementation
- `X-User-ID` header injection: services trust the gateway-validated user identity
- Prometheus metrics for all API routes: latency, error rate, request count
- Declarative config: gateway changes tracked in Git

**Negative / Trade-offs:**
- Kong OSS lacks an admin UI (Kong Manager is enterprise-only)
- PostgreSQL backing required for Kong (separate from application PostgreSQL)
- Plugin development requires Lua knowledge
- Kong is a potential single point of failure (mitigated by multiple Kong instances + HPA)

**Neutral:**
- Kong upstream targets: Kubernetes service names (resolved via cluster DNS)
- Kong version upgrades: tested in staging first (breaking plugin changes are common)

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| NGINX | No declarative plugin model; auth requires custom Lua or external auth server; complex configuration |
| Traefik | Less mature API gateway feature set; fewer financial-grade plugins |
| AWS API Gateway | Cloud lock-in; data egress |
| Kong Enterprise | Proprietary license |
| Envoy + Istio service mesh | Higher operational complexity; service mesh is complementary, not replacement |

---

## ADR-014: MinIO for Object Storage with WORM

| Field | Value |
|-------|-------|
| Date | 2024-10-28 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Compliance Architect, CISO, Head of Infrastructure |
| Constitutional Reference | Article 12 — Audit; Article 29 — OSS-First; Article 31 — Data Sovereignty |
| Last Reviewed | 2025-01-15 |

### Context

FRA requires 7-year immutable retention of all AI recommendations, financial transaction records, and compliance events. WORM (Write Once Read Many) storage prevents post-hoc modification of audit records. AWS S3 with Object Lock would satisfy technical requirements but violates PDPL data sovereignty. Need S3-compatible API for ecosystem tooling compatibility (AWS SDK works without modification).

### Decision

**MinIO** (GNU AGPL v3 for self-hosted, S3-compatible) with Object Lock in GOVERNANCE mode. Bucket `tradeora-audit-trail` with 7-year default retention. AES-256 server-side encryption (SSE-S3). Distributed MinIO cluster (4+ nodes for erasure coding — EC:4 configuration). Replication to secondary site for disaster recovery. S3-compatible API enables standard AWS SDK toolchain.

### Rationale

MinIO is the de facto self-hosted S3-compatible object store. Object Lock in GOVERNANCE mode means: no user (including MinIO admin) can delete WORM-locked objects during the retention period without a special governance override requiring multi-person authorization. This provides the strongest practical WORM guarantee for a self-hosted deployment. GNU AGPL v3 is permissive for self-hosted use (modification disclosure only required if modified and served as SaaS).

### Consequences

**Positive:**
- S3 API compatibility: standard AWS SDKs work without modification
- WORM guarantee: Object Lock prevents deletion during retention period
- Data sovereignty: self-hosted in Egypt
- AES-256 encryption at rest
- Erasure coding: 4 drives can fail without data loss

**Negative / Trade-offs:**
- GNU AGPL v3 requires source code disclosure if MinIO is modified and offered as a service (acceptable — no modification planned)
- MinIO distributed requires minimum 4 nodes (EC:4 = 4 data drives + 4 parity drives across 8 nodes optimal)
- Object Lock overhead: additional metadata storage per object

**Neutral:**
- MinIO Console (web UI) available for compliance team browsing
- MinIO Prometheus metrics: `minio_bucket_usage_total_bytes`, `minio_node_disk_total_bytes`

---

## ADR-015: Patroni + PostgreSQL for High Availability

| Field | Value |
|-------|-------|
| Date | 2024-11-01 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of Infrastructure, Head of Platform Engineering |
| Constitutional Reference | Article 25 — Business Continuity; Article 8 — Data Architecture |
| Last Reviewed | 2025-01-15 |

### Context

PostgreSQL is the primary data store for 49 bounded context read models, CQRS projections, and operational data. A single PostgreSQL instance creates a single point of failure. EGX trading hours (09:30–15:00 EGT) require 99.9% uptime with RTO < 30 seconds and RPO < 5 seconds. Manual failover is too slow and introduces human error risk under the pressure of a production incident.

### Decision

**Patroni** (Python, MIT license) as PostgreSQL HA orchestration. 3-node cluster: 1 primary + 2 synchronous standbys. **etcd** 3-node cluster for distributed consensus and leader election. **HAProxy** for read/write endpoint split (port 5000 → primary only; port 5001 → replica pool). **PgBouncer** (ADR-034) in front of HAProxy. Automatic failover: if primary is unreachable for > 10 seconds, Patroni promotes a standby via etcd leader election.

### Rationale

Patroni is the industry standard for PostgreSQL HA, used in production by major cloud providers. etcd provides strong consistency for leader election, preventing split-brain scenarios. The combination of Patroni + etcd + HAProxy provides automatic failover in < 30 seconds with near-zero RPO (synchronous standby = zero data loss on failover).

### Consequences

**Positive:**
- Automatic failover in < 30 seconds: satisfies RTO requirement
- Synchronous standby: RPO near zero (no data loss on primary failure)
- HAProxy read/write split: read scaling via replica pool
- Patroni REST API: programmatic cluster status monitoring

**Negative / Trade-offs:**
- 3-node etcd cluster adds operational complexity (another distributed system to manage)
- Patroni requires careful tuning of `ttl`, `loop_wait`, and `retry_timeout` parameters
- Synchronous standby: any replica lag pauses the primary write path briefly

**Neutral:**
- Patroni config managed via ConfigMap in Kubernetes (GitOps controlled)
- Nightly logical backup: `pg_dump` to MinIO (point-in-time recovery complement to Patroni streaming)

---

## ADR-016: Arabic-First Language Architecture

| Field | Value |
|-------|-------|
| Date | 2024-11-05 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of AI Research, Head of Product, FRA Compliance Advisor |
| Constitutional Reference | Article 2 — Market Focus; Article 10 — AI Governance |
| Last Reviewed | 2025-01-15 |

### Context

Tradeora's primary market is Egypt's retail investor base. The vast majority communicate, think, and make financial decisions in Arabic. Providing AI explanations in English would render the product unusable for most target users and potentially violate FRA disclosure requirements that mandate clear investor understanding in the investor's primary language. Arabic NLP presents unique challenges: right-to-left text, morphological richness (10,000+ root-pattern combinations), Modern Standard Arabic (MSA) vs. Egyptian colloquial Arabic dialect differences, and limited Arabic financial text training corpora.

### Decision

Arabic is the PRIMARY output language for all AI-generated explanations, recommendations, and notifications. **Qwen2.5:72b** selected as LLM for superior Arabic text generation quality among OSS models (internal benchmark: Arabic F1 = 0.89 vs. Llama3.1:70b F1 = 0.71). **CAMeL-BERT-MSA** for Arabic NLP classification tasks (ADR-029). All UI components support RTL layout. English output available on request. Arabic FinancialGlossary maintained as a dedicated BC.

### Rationale

Target market usability is a primary business requirement. Arabic-first design ensures every retail investor can understand AI analysis without translation artifacts. Qwen2.5:72b's superior Arabic quality (trained on Alibaba's large Arabic web corpus) provides publication-quality Arabic financial text that accurately uses EGX-specific terminology (e.g., "التحليل الفني", "الأساسي", "التوافق الإجماعي").

### Consequences

**Positive:**
- Product usable by target market without language barrier
- FRA compliance: disclosures in investor's primary language
- Competitive differentiation: superior Arabic AI vs. generic English tools
- Cultural resonance: Arabic financial terminology matches EGX investor vocabulary

**Negative / Trade-offs:**
- Arabic NLP community smaller than English NLP community
- RTL UI doubles testing scope (every UI component tested in both LTR and RTL)
- Arabic financial text training data is limited (EGX financial news corpus collection required)

**Neutral:**
- i18n framework: react-i18next with `dir="rtl"` switching per locale
- Arabic financial glossary: maintained in FinancialGlossary BC, used by all AI schools

### Implementation Notes

**Arabic financial glossary (sample):**

| Arabic Term | English Equivalent | EGX Context |
|-------------|-------------------|-------------|
| التحليل الفني | Technical Analysis | Chart-based analysis |
| التحليل الأساسي | Fundamental Analysis | Financial statements analysis |
| إجماع المدارس | School Consensus | WisdomEngine result |
| السيولة | Liquidity | Trading volume/bid-ask spread |
| العائد على السهم | EPS (Earnings Per Share) | Fundamental metric |

---

## ADR-017: ULID for Distributed ID Generation

| Field | Value |
|-------|-------|
| Date | 2024-11-08 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Lead Platform Architect |
| Constitutional Reference | Article 8 — Data Architecture Standards |
| Last Reviewed | 2025-01-15 |

### Context

49 bounded contexts generate entity IDs independently without coordination. PostgreSQL SERIAL/BIGSERIAL creates cross-service coupling (service must round-trip to DB to get next ID). UUID v4 is randomly ordered — inserting random UUIDs into B-tree indexes causes page fragmentation and degrades insert performance significantly at high volume (PostgreSQL B-tree prefers monotonically increasing keys). ULIDs combine global uniqueness with time-sortability and require no coordination service.

### Decision

**ULID** (Universally Unique Lexicographically Sortable Identifier) for all entity and event IDs. ULID is 128-bit: first 48 bits = millisecond timestamp, remaining 80 bits = random. Encodes to 26-character Crockford Base32. Entity ID format convention: `{entity_prefix}_{ulid}` (e.g., `rec_01HWKP4MFVX7XNPQRST`, `prt_01HWKP5MFVX7XNPQRST`). Libraries: `python-ulid` (Python), `ulid-ts` (TypeScript).

### Rationale

ULID's time-prefix ensures B-tree index insertions are approximately sequential within a millisecond, dramatically improving PostgreSQL insert performance vs. UUID v4. The 26-character string representation is shorter than UUID v4 (36 chars). No coordination service needed — each service generates ULIDs independently. The entity prefix convention makes IDs self-describing in logs and debugging sessions.

### Consequences

**Positive:**
- Time-sortable: B-tree index performance comparable to sequential integers
- Globally unique without coordination service
- Self-describing ID format: entity type visible in ID prefix
- More compact than UUID v4 (26 vs. 36 chars)
- Monotonically increasing within millisecond resolution

**Negative / Trade-offs:**
- ULID timestamp is predictable — do not use ULID as a secret or authentication token
- Millisecond precision means same-millisecond ULIDs from different generators may not sort correctly (acceptable)

**Neutral:**
- PostgreSQL stores ULID as VARCHAR(26) or can be stored in UUID column with encoding

### Implementation Notes

**Entity prefix registry:**

| Prefix | Entity | Example |
|--------|--------|---------|
| `rec_` | AIRecommendation | `rec_01HWKP4MFVX7XNPQRST` |
| `prt_` | Portfolio | `prt_01HWKP5MFVX7XNPQRST` |
| `usr_` | User | `usr_01HWKP6MFVX7XNPQRST` |
| `txn_` | Transaction | `txn_01HWKP7MFVX7XNPQRST` |
| `aud_` | AuditEvent | `aud_01HWKP8MFVX7XNPQRST` |
| `kyc_` | KYCRecord | `kyc_01HWKP9MFVX7XNPQRST` |

```python
from ulid import ULID

def generate_id(prefix: str) -> str:
    return f"{prefix}{ULID()}"

recommendation_id = generate_id("rec_")  # rec_01HWKP4MFVX7XNPQRST
```

---

## ADR-018: OpenBao for Secrets Management

| Field | Value |
|-------|-------|
| Date | 2024-11-10 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, CISO, Head of Infrastructure |
| Constitutional Reference | Article 29 — OSS-First; Article 16 — Security Standards |
| Last Reviewed | 2025-01-15 |

### Context

Services require: data vendor API keys (EGX data feeds), database credentials (PostgreSQL, Kafka SSL certs), JWT signing keys (RSA private keys for Keycloak), third-party integration credentials. Environment variables are insecure (visible in process listings, Kubernetes manifests committed to Git). HashiCorp Vault was the leading OSS solution until August 2023, when HashiCorp changed Vault's license from MPL 2.0 to Business Source License (BSL 1.1) — making it non-OSS per OSI and therefore non-compliant with Article 29.

### Decision

**OpenBao** (MPL 2.0, Linux Foundation / OpenBao community — fork of HashiCorp Vault post-BSL change) for all secrets management. Dynamic secrets for PostgreSQL (time-limited credentials, auto-rotate). Kubernetes auth: services authenticate via their Kubernetes service account JWT. Automatic rotation: database credentials every 24 hours. Transit secrets engine for envelope encryption of sensitive data fields. AppRole auth for CI/CD pipelines.

### Rationale

OpenBao maintains full API compatibility with HashiCorp Vault — existing Vault clients work without code changes. The MPL 2.0 license is OSI-approved (Article 29 compliant). Dynamic database credentials eliminate static passwords — each pod gets a unique, time-limited credential that is automatically revoked when the pod terminates.

### Consequences

**Positive:**
- Dynamic credentials: no static database passwords in any config file or environment variable
- Automatic rotation: eliminates manual secret rotation toil
- Audit log: every secret access logged (who accessed what secret, when)
- Kubernetes-native auth: no additional credentials needed for pods to authenticate
- MPL 2.0: fully OSS-compliant per Article 29

**Negative / Trade-offs:**
- OpenBao is newer fork — community smaller than HashiCorp Vault; some enterprise Vault features not yet ported
- HA requires Raft storage backend (etcd alternative also available — already deployed for Patroni)
- OpenBao unseal process requires ceremony after restart (key shares + threshold)

**Neutral:**
- OpenBao → PostgreSQL dynamic secret path: `database/creds/portfolio-svc-role`
- Secret TTL: 1 hour (pods renew before expiry via sidecar injector)

---

## ADR-019: Kafka Avro + Schema Registry for Event Contracts

| Field | Value |
|-------|-------|
| Date | 2024-11-12 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of Data Engineering, Tech Leads from all BC teams |
| Constitutional Reference | Article 4 — Event-Driven Architecture; Article 9 — Data Contracts |
| Last Reviewed | 2025-01-15 |

### Context

49 BCs publish Kafka events consumed by multiple other BCs. Without schema enforcement, a producer renaming a field silently breaks consumers in production. JSON events have no schema enforcement — a missing required field causes a `KeyError` or `undefined` in consumers. Schema governance is critical for safe independent deployments of producer and consumer teams.

### Decision

All Kafka events serialized as **Avro** with **Confluent Schema Registry** (OSS). Compatibility mode: `FULL_TRANSITIVE` (both backward and forward compatible — consumers can evolve to read new fields, producers can add optional fields). Schema registration required before first production publish. Breaking changes require RFC process + all consuming teams sign-off.

### Rationale

Avro binary encoding is 50-70% smaller than equivalent JSON. Schema Registry enforces contracts at serialization time — a producer cannot publish an event that doesn't conform to the registered schema. `FULL_TRANSITIVE` is the strictest compatibility mode, ensuring both old and new consumers can read both old and new events — critical for zero-downtime deployments.

### Consequences

**Positive:**
- Contract enforcement: producer cannot publish non-conforming events
- Safe independent deployment: FULL_TRANSITIVE compatibility guarantees
- Schema as living documentation: Schema Registry UI shows all event schemas
- 50-70% payload size reduction vs. JSON

**Negative / Trade-offs:**
- Avro binary not human-readable (Schema Registry UI required for debugging)
- Schema Registry is an additional operational dependency
- FULL_TRANSITIVE is more restrictive: new required fields are forbidden (must add defaults)

**Neutral:**
- Schema evolution rules: adding optional fields = ALLOWED; renaming fields = FORBIDDEN without RFC
- Schema Registry replication factor: 3 (consistent with Kafka cluster)

### Implementation Notes

**Example Avro schema (`PortfolioHoldingUpdated.avsc`):**
```json
{
  "type": "record",
  "name": "PortfolioHoldingUpdated",
  "namespace": "io.tradeora.portfolio.events.v1",
  "fields": [
    {"name": "portfolioId", "type": "string", "doc": "ULID of the portfolio"},
    {"name": "symbol",      "type": "string", "doc": "EGX ticker symbol"},
    {"name": "quantity",    "type": "string", "doc": "Decimal string (ADR-006)"},
    {"name": "avgCostPrice","type": "string", "doc": "Decimal string in EGP"},
    {"name": "occurredAt",  "type": "string", "doc": "ISO 8601 UTC timestamp"},
    {"name": "requestId",   "type": "string", "doc": "ULID correlation ID"},
    {"name": "version",     "type": "string", "default": "1.0.0"}
  ]
}
```

---

## ADR-020: Row-Level Security for Retail Tenant Isolation

| Field | Value |
|-------|-------|
| Date | 2024-11-15 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, CISO, DBA Lead |
| Constitutional Reference | Article 7 — BC Isolation; Article 16 — Security; Article 31 — Data Privacy |
| Last Reviewed | 2025-01-15 |

### Context

ADR-007 defines schema-per-BC for bounded context isolation. However, within the retail tier (potentially millions of users), creating a separate PostgreSQL schema per user is operationally infeasible. Yet user data isolation is critical — User A must NEVER see User B's portfolio data. Application-level `WHERE user_id = ?` filtering is insufficient: a single missed WHERE clause in any query exposes all users' data.

### Decision

**PostgreSQL Row-Level Security (RLS)** on all retail-tier tables containing user data. Policy enforced at DB engine level: `CREATE POLICY user_isolation ON portfolio.holdings USING (user_id = current_setting('app.current_user_id', true)::uuid);`. Transaction setup: `SET LOCAL app.current_user_id = '{userId}';` at the start of every transaction (compatible with PgBouncer transaction mode).

### Rationale

RLS enforcement at the PostgreSQL engine level means even if application code omits a WHERE clause (due to a bug), the database engine filters rows to only those belonging to the current user. This provides defense-in-depth security — RLS cannot be bypassed by application-level bugs. The `SET LOCAL` approach is PgBouncer transaction mode compatible (unlike `SET SESSION`).

### Consequences

**Positive:**
- Database-level enforcement: cannot be bypassed by application code bugs
- Zero performance overhead for compliant queries (RLS evaluated at plan time)
- Transparent to application code: no WHERE clause required (RLS adds it automatically)
- Compliance admin access: BYPASSRLS role for compliance investigators (tightly controlled)

**Negative / Trade-offs:**
- `SET LOCAL` must be called at the start of every database transaction (discipline required)
- Complex RLS policies can impact query plan efficiency
- BYPASSRLS role must be tightly controlled (misuse exposes all data)

**Neutral:**
- RLS policies defined per table in Flyway migrations
- Admin bypass requires BYPASSRLS role + Keycloak ADMIN scope + logged as ADMIN_ACTION audit event

### Implementation Notes

```sql
-- Enable RLS on portfolio holdings
ALTER TABLE portfolio.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio.holdings FORCE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON portfolio.holdings
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- TypeScript: Set user context before any query
async executeWithUserContext<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  return this.dataSource.transaction(async (manager) => {
    await manager.query(`SET LOCAL app.current_user_id = '${userId}'`);
    return fn();
  });
}
```

---

## ADR-021: Feature Governance via 6-Stage Lifecycle

| Field | Value |
|-------|-------|
| Date | 2024-11-18 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of Product, FRA Compliance Advisor, CTO |
| Constitutional Reference | Article 21 — Feature Lifecycle; Article 12 — Compliance |
| Last Reviewed | 2025-01-15 |

### Context

Rapid feature development without governance creates technical debt, regulatory risk, and financial calculation bugs. FRA requires disclosure of any significant changes to financial data presentation. Without a structured lifecycle, features ship directly to production without compliance review, shadow testing, or rollback planning — creating unacceptable risk for a financial product.

### Decision

All Tradeora features follow a mandatory **6-stage lifecycle**: (1) **PROPOSED** — feature brief + RFC, (2) **DESIGNED** — architecture review + FRA compliance check + Feature Review Board approval, (3) **BUILT** — TDD, 80% coverage minimum, (4) **SHADOW** — runs in production but output hidden; compared to existing behavior, (5) **ROLLOUT** — gradual via feature flags (1% → 5% → 25% → 100%), (6) **GA** — fully live. No feature can skip stages. Feature flags remain post-GA as kill switches.

### Rationale

The SHADOW stage is the most valuable innovation: a new AI school or calculation change runs against real production data and its output is compared to the existing system. Discrepancies are logged and reviewed. Only after shadow stage validates the new feature matches or improves on existing behavior is rollout permitted. This provides a real-production validation layer that no staging environment can replicate.

### Consequences

**Positive:**
- Regulatory defensibility: every feature has documented compliance review
- Shadow stage: real-production validation before users see the feature
- Kill switch capability: feature flags remain post-GA
- Measurable rollout: metrics gate advancement from 1% → 5% → 25% → 100%

**Negative / Trade-offs:**
- Estimated 2 extra weeks per feature for shadow + rollout stages
- Feature Review Board is a bottleneck for high-velocity teams
- Shadow stage requires infrastructure to run both old and new implementations simultaneously

**Neutral:**
- Feature lifecycle state tracked in Confluence (or equivalent doc system)
- Feature flags remain in Unleash post-GA for kill switch capability

---

## ADR-022: EGX-Only Focus for Phase 1

| Field | Value |
|-------|-------|
| Date | 2024-11-20 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, CEO, CTO, Head of Product |
| Constitutional Reference | Article 2 — Market Focus; Article 22 — Phased Delivery |
| Last Reviewed | 2025-01-15 |

### Context

Multi-exchange support from inception would require simultaneous development of: multi-currency arithmetic engine, multiple regulatory frameworks (FRA + CMA + DIFC + SEC), multiple data vendor integrations (EGX data feeds + Tadawul + Bloomberg), multi-language NLP (Arabic MSA + Arabic Gulf dialect), and multiple economic cycle models. This complexity would delay Phase 1 launch by 12–18 months and dilute AI school calibration quality.

### Decision

Phase 1 covers **Egyptian Exchange (EGX) ONLY**. All AI schools calibrated for EGX-specific characteristics: Egyptian macroeconomic cycles, Arabic MSA news sentiment, FRA regulations, EGP currency (NUMERIC(20,2)), 09:30–15:00 EGT trading hours, EGX listing rules. Phase 2 trigger: EGX MAU ≥ 50,000 OR Board approval. Phase 2 target exchanges: Tadawul (Saudi Arabia), ADX (Abu Dhabi).

### Rationale

Focus enables excellence. AI schools calibrated specifically for EGX deliver superior recommendations for EGX investors than a generalized multi-exchange model. The EGX market has unique characteristics (high retail participation, commodity sensitivity, FX sensitivity to USD) that reward specialized calibration. Phase 1 launch quality is the most important factor for user acquisition and regulatory relationship-building with FRA.

### Consequences

**Positive:**
- Faster Phase 1 launch (6-9 months earlier than multi-exchange)
- Higher AI quality for EGX: schools calibrated specifically for Egyptian market
- Simpler regulatory engagement: single regulator (FRA)
- Focused data partnerships: EGX data feed only

**Negative / Trade-offs:**
- No international investor support in Phase 1
- Competitive risk if a global player launches Egyptian AI analysis
- EGX-only limits total addressable market in Phase 1

**Neutral:**
- Architecture is designed for multi-exchange from Phase 1 (exchange ID in all data models)
- EGX-specific constants isolated in `MarketConfig` BC for easy extension in Phase 2

---

## ADR-023: Look-Ahead Bias Prevention

| Field | Value |
|-------|-------|
| Date | 2024-11-22 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of AI Research, Head of Quantitative Finance |
| Constitutional Reference | Article 23 — Backtesting Standards; Article 10 — AI Governance |
| Last Reviewed | 2025-01-15 |

### Context

Look-ahead bias: AI schools using data that was not available at the time of historical analysis. Financial statements are published 30 days after quarter close — using the quarter-close date as the "available" date gives the model access to information investors didn't have. This overstates backtest accuracy, creates false confidence, and misleads users about AI school performance. FRA will scrutinize AI accuracy claims.

### Decision

ALL time-series data points carry two timestamps: `as_of_date` (the period described) and `available_from_timestamp` (when publicly available). TimescaleDB backtesting queries MUST filter: `WHERE available_from_timestamp <= backtest_as_of_date`. Financial statements: available 30 days after quarter close. Macro data: available on release date (not reference period). Earnings: available T+0. Enforced by backtesting framework validation that rejects queries missing the guard.

### Rationale

The only reliable way to prevent look-ahead bias is technical enforcement, not convention. The `available_from_timestamp` column makes the constraint explicit and machine-enforceable. A backtesting query without the guard fails at framework validation — preventing the bug from ever producing misleading accuracy metrics.

### Consequences

**Positive:**
- Accurate backtest results: AI school performance metrics are trustworthy
- Regulatory defensibility: FRA accuracy claims backed by rigorously bias-free backtests
- Investor trust: disclosed AI accuracy reflects real-world capability

**Negative / Trade-offs:**
- More complex data ingestion: two timestamps per data point
- Data vendor coordination required to confirm actual publication dates (not just reference dates)
- Increased storage (additional column per row)

**Neutral:**
- `available_from_timestamp` also serves as the Audit Trail data integrity timestamp for recommendations

### Implementation Notes

**Data latency table:**

| Data Type | As-Of Period | Available From |
|-----------|-------------|----------------|
| EGX Price/OHLCV | Trade date | T+0 (real-time feed) |
| Earnings Announcement | Quarter close | T+0 (day of announcement) |
| Financial Statements | Quarter close | Q-close + 30 days |
| Annual Report | Fiscal year end | FY-end + 45 days |
| CPI (Inflation) | Reference month | Release date (CAPMAS) |
| FX Rates | Trade date | T+0 (CBE feed) |

---

## ADR-024: gVisor for AI School Sandboxing

| Field | Value |
|-------|-------|
| Date | 2024-11-25 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, CISO, Head of AI Engineering |
| Constitutional Reference | Article 16 — Security; Article 24 — AI School Plugin Architecture |
| Last Reviewed | 2025-01-15 |

### Context

Phase 2 introduces Third-Party AI School Plugins — externally developed school implementations that plug into the consensus framework. An exploited or malicious plugin could access other schools' data, the PostgreSQL database, or internal Kafka topics. Even Phase 1 schools running third-party model code (downloaded GGUF weights, fine-tuned checkpoints) need process-level isolation as a defense-in-depth measure.

### Decision

All AI school Python processes run in **gVisor** (runsc) sandboxed containers (Kubernetes RuntimeClass: `gvisor`). gVisor intercepts Linux syscalls at the application level, preventing kernel exploits. Phase 2 Third-Party Plugins: **WebAssembly (WASM)** sandbox with gRPC sidecar interface — WASM has no filesystem or network access by default; plugin API is gRPC protobuf only, no shared memory.

### Rationale

gVisor provides kernel-level isolation without the startup cost of VMs. A gVisor container's syscall attack surface is the gVisor user-space kernel — not the host kernel — dramatically reducing exploit risk. WASM sandboxing for third-party plugins provides an even stronger guarantee: WASM code cannot access the filesystem, network, or system resources without explicit capability grants.

### Consequences

**Positive:**
- Defense in depth: kernel exploit from third-party model code is prevented
- WASM plugin API: clear interface boundary, no shared memory or side-channel risk
- gVisor overhead: 10-30% (acceptable within 1500ms school latency budget)

**Negative / Trade-offs:**
- gVisor performance overhead: 10-30% CPU overhead for syscall interception
- WASM sandboxing limits plugin capabilities (by design — security property)
- Additional Kubernetes node label required for gVisor node pool

**Neutral:**
- RuntimeClass `gvisor` configured in Kubernetes (supported on GKE, EKS, and self-hosted with gVisor install)
- Non-school services (TypeScript platform services) use standard runc — no overhead

---

## ADR-025: GitOps for All Infrastructure — FluxCD

| Field | Value |
|-------|-------|
| Date | 2024-11-28 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of Infrastructure, Head of DevOps |
| Constitutional Reference | Article 25 — Infrastructure as Code; Article 29 — OSS-First |
| Last Reviewed | 2025-01-15 |

### Context

Manual `kubectl apply` changes to Kubernetes create configuration drift — production cluster diverges from Git. Infrastructure changes without PR review bypass governance. In a financial system, unreviewed infrastructure changes are a compliance and security risk. The audit trail for infrastructure changes must be as rigorous as for application changes.

### Decision

**FluxCD** (OSS, Apache 2.0, CNCF graduated) as GitOps operator. All Kubernetes manifests, Helm releases, and Kustomize overlays stored in `infrastructure/` Git repository. Changes only via PR with architecture review. FluxCD reconciliation: every 1 minute. Drift detection: alerts via PagerDuty when cluster diverges from Git. **Sealed Secrets** for encrypted secrets committed to Git (decrypted only by the in-cluster Sealed Secrets controller).

### Rationale

FluxCD's controller-based reconciliation ensures the cluster continuously converges to the Git-declared state. Any manual `kubectl apply` that diverges from Git is detected and reversed within 1 minute. The Git history is the complete infrastructure change audit trail — every infrastructure change has a commit, author, PR number, and reviewer.

### Consequences

**Positive:**
- Complete infrastructure change audit trail in Git history
- Automatic reconciliation: manual changes reverted within 1 minute
- Disaster recovery: new cluster bootstrapped from Git in < 30 minutes
- PR review enforces infrastructure governance

**Negative / Trade-offs:**
- Slower infrastructure changes: PR process adds time
- Sealed Secrets rotation is manual (requires re-seal with new public key)
- Learning curve: Flux CRDs, Kustomize, and GitOps mental model

**Neutral:**
- ArgoCD is a viable alternative (also CNCF graduated); FluxCD chosen for lighter footprint and better multi-tenancy without requiring UI
- Terraform used for cloud resources (VMs, storage); FluxCD for Kubernetes objects

---

## ADR-026: Grafana + Prometheus for Observability

| Field | Value |
|-------|-------|
| Date | 2024-12-01 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of Infrastructure, Head of Platform Engineering |
| Constitutional Reference | Article 29 — OSS-First; Article 26 — Observability Standards |
| Last Reviewed | 2025-01-15 |

### Context

49 bounded contexts in Kubernetes require comprehensive observability: metrics for SLO tracking, logs for debugging and compliance, traces for cross-service latency analysis. Commercial APM solutions (Datadog, New Relic) send service telemetry to foreign cloud infrastructure, creating data sovereignty concerns. Per-host costs at 50+ node scale are prohibitive.

### Decision

Full OSS observability stack: **Prometheus** (metrics scraping via ServiceMonitor CRDs), **Grafana** (dashboards + alerting via Alertmanager), **Loki** (log aggregation, LogQL queries), **Tempo** (distributed tracing, OTLP ingest, Jaeger query interface). **OpenTelemetry** SDK in all services for traces (ADR-030). **Thanos** for long-term Prometheus metrics (90-day retention beyond Prometheus 15-day window).

### Rationale

The LGTM stack (Loki + Grafana + Tempo + Mimir/Prometheus) is the industry-standard OSS observability platform. Grafana provides a single-pane-of-glass UI for all three signals (metrics, logs, traces) with exemplar linking between them. All data stays within Tradeora's infrastructure.

### Consequences

**Positive:**
- Zero data egress: all telemetry stays in Egypt
- Cost: ~$0 vs. Datadog $23/host/month ($1,150+/month for 50 hosts)
- CNCF ecosystem: long-term OSS commitment
- Grafana correlates metrics + logs + traces in a single view

**Negative / Trade-offs:**
- Multiple separate systems to operate (Prometheus, Loki, Tempo, Thanos)
- No commercial support contract (community only)
- Thanos adds operational complexity for long-term metrics storage

**Neutral:**
- SLO definitions: Availability ≥ 99.9% (43min/month budget), P95 recommendation latency < 1500ms, Error rate < 0.1%
- Alert routing: PagerDuty for critical, Slack for warning

---

## ADR-027: Flyway for Database Migrations

| Field | Value |
|-------|-------|
| Date | 2024-12-03 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of Platform Engineering, DBA Lead |
| Constitutional Reference | Article 8 — Data Architecture; Article 27 — Database Governance |
| Last Reviewed | 2025-01-15 |

### Context

49 bounded contexts each own a PostgreSQL schema. Without a migration tool, schema changes are applied manually — error-prone, non-auditable, and inconsistent across environments. Multiple teams running migrations concurrently risk race conditions. Need a SQL-native tool that engineers write SQL (not ORM abstractions) and that runs deterministically on every environment.

### Decision

**Flyway OSS** (Apache 2.0) for all PostgreSQL schema migrations. Each BC has its own Flyway migration directory: `{bc-module}/src/migrations/`. Version format: `V{major}_{minor}_{patch}__{description}.sql` (e.g., `V1_0_0__create_portfolio_holdings.sql`). Migrations run at service startup. Never delete or modify applied migrations — only add new ones. Rollback via new forward migration (Flyway OSS doesn't support rollback — paid tier feature; rollback migrations must be written manually).

### Consequences

**Positive:**
- Deterministic migrations: identical migration history across dev/staging/prod
- Auditable: `flyway_schema_history` table records every applied migration with checksum
- SQL-native: engineers write SQL, no ORM abstraction required
- Concurrent-safe: Flyway uses advisory locks to prevent concurrent migration runs

**Negative / Trade-offs:**
- Flyway OSS lacks automated rollback (paid feature); rollback requires a new migration
- Forward-only migrations require careful planning (no easy undo)
- Each service must connect to PostgreSQL with schema-owner credentials at startup

**Neutral:**
- Flyway migration checksums: modifications to applied migrations detected and blocked (prevents tampering)

### Implementation Notes

```typescript
// NestJS service startup: Flyway.migrate()
import { Flyway } from 'node-flywaydb';

async function runMigrations(): Promise<void> {
  const flyway = new Flyway({
    url: `jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}?currentSchema=portfolio`,
    user: DB_USER,
    password: DB_PASS,
    locations: ['filesystem:./src/migrations'],
    schemas: ['portfolio'],
  });
  await flyway.migrate();
}
```

---

## ADR-028: No Autonomous Trading — Advisory Only

| Field | Value |
|-------|-------|
| Date | 2024-12-05 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, CEO, Legal, FRA Compliance Advisor |
| Constitutional Reference | Article 6 — Product Boundaries; Article 28 — Regulatory Compliance |
| Last Reviewed | 2025-01-15 |

### Context

Autonomous trading systems that execute trades without explicit per-trade user approval require an FRA Investment Manager license — a significantly more complex, capital-intensive (minimum EGP 5,000,000) regulatory process than an Information Service Provider license. Tradeora's Phase 1 product vision is AI analysis and recommendations, not execution. Autonomous execution also dramatically increases liability exposure.

### Decision

Tradeora **NEVER autonomously executes trades**. The platform provides BUY/HOLD/SELL recommendations with analysis only. Phase 2 order routing: Tradeora presents a pre-filled order form; user reviews and manually confirms. All recommendations display mandatory FRA disclaimer in Arabic and English. AI output labeled "تحليل مالي" (financial analysis) — never "نصيحة استثمارية" (investment advice).

### Consequences

**Positive:**
- FRA Information Service Provider registration sufficient (faster, cheaper)
- Reduced liability: no fiduciary duty under information service registration
- Simpler ongoing compliance: no suitability assessment required per transaction
- Faster to market: avoids 12+ month Investment Manager registration process

**Negative / Trade-offs:**
- Users wanting automated execution must use broker apps separately (Phase 1)
- Revenue model limited to information subscription (Phase 1)

**Neutral:**
- Phase 3: Investment Advisor registration pathway opened if product evolves to managed portfolios

---

## ADR-029: CAMeL-BERT for Arabic NLP

| Field | Value |
|-------|-------|
| Date | 2024-12-08 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of AI Research |
| Constitutional Reference | Article 10 — AI Governance; Article 16 — Arabic-First |
| Last Reviewed | 2025-01-15 |

### Context

The SentimentAnalysis school classifies Arabic financial news articles from EGX-related sources. Standard BERT (English-trained) performs poorly on Arabic text (Arabic is morphologically rich: a single three-letter root generates thousands of word forms). Arabic NLP requires models pre-trained on Arabic text. Modern Standard Arabic (MSA) used in financial news differs substantially from Egyptian colloquial Arabic — general Arabic models underperform on MSA financial terminology.

### Decision

**CAMeL-BERT-MSA** (NYU Abu Dhabi, MIT license) fine-tuned on EGX financial news corpus (minimum 50,000 labeled articles: positive/neutral/negative sentiment). Inference on local GPU. No Arabic NLP data sent to external APIs. CAMeL-BERT-MSA selected over AraBERT based on internal benchmark: F1 score on EGX financial news = 0.87 (CAMeL-BERT-MSA) vs. 0.81 (AraBERT) vs. 0.63 (mBERT).

### Consequences

**Positive:**
- Superior Arabic financial text understanding vs. general models
- Local inference: PDPL compliant, zero data egress
- Fine-tunable on EGX-specific corpus for domain adaptation
- MIT license: full OSS compliance

**Negative / Trade-offs:**
- Fine-tuning requires 50K+ labeled articles (labeling effort)
- Smaller community than English BERT equivalents
- GPU memory: 2GB for 7B-class BERT; manageable but requires allocation

**Neutral:**
- Model versioning: fine-tuned model versions stored in MinIO; model registry tracked in MLflow
- Inference wrapped in SentimentAnalysis school's standard school interface

---

## ADR-030: OpenTelemetry for Distributed Tracing

| Field | Value |
|-------|-------|
| Date | 2024-12-10 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of Platform Engineering, Head of Infrastructure |
| Constitutional Reference | Article 26 — Observability Standards |
| Last Reviewed | 2025-01-15 |

### Context

49 bounded contexts participate in cross-service request flows. A single AI recommendation request traverses: API Gateway → WisdomEngine → 12 AI Schools (in parallel) → AuditTrail BC — 15+ service hops. Without distributed tracing, diagnosing latency issues in production is impossible. Request correlation IDs must propagate through all services including Kafka message headers for async flow tracing.

### Decision

**OpenTelemetry SDK** (Python: `opentelemetry-sdk`; TypeScript: `@opentelemetry/sdk-node`) in all services. OTLP gRPC export to OpenTelemetry Collector → Tempo (traces). Context propagation: W3C TraceContext (`traceparent` header). `X-Request-ID` ULID propagated through all HTTP calls and Kafka headers. Sampling: 100% for AI recommendation flow (critical path), 10% for all other flows.

### Consequences

**Positive:**
- End-to-end trace visibility across all 49 BCs
- Latency breakdown by service: identifies which school is the bottleneck in consensus
- Error root cause analysis: trace shows exactly where a failure occurred
- OTLP standard: vendor-neutral, future-proof

**Negative / Trade-offs:**
- 100% sampling for recommendation flow adds ~5-10% overhead (acceptable)
- OpenTelemetry Collector is an additional component to manage
- Trace storage in Tempo requires NVMe disk provisioning

**Neutral:**
- Exemplar linking: Grafana links metrics datapoints to traces for the same timestamp
- Trace retention: 7 days in Tempo (hot); 30 days in MinIO (cold)

---

## ADR-031: PDPL 2020 Compliance by Design

| Field | Value |
|-------|-------|
| Date | 2024-12-12 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, CISO, Legal (PDPL Counsel), Compliance Officer |
| Constitutional Reference | Article 31 — Data Sovereignty and Privacy |
| Last Reviewed | 2025-01-15 |

### Context

Egypt's Personal Data Protection Law 2020 (Law 151/2020) creates mandatory obligations: lawful basis for processing (consent), data localization, right of access, right to erasure (with exceptions for legally mandated retention), breach notification within 72 hours to NCPD. Violations: fines up to EGP 1,000,000, possible license suspension. Reactive compliance (fixing violations after they're found) is unacceptable for a financial platform.

### Decision

PDPL compliance by design: (1) Data localization — ALL Egyptian user data on Egypt-based infrastructure only; (2) Consent via Keycloak consent flows (granular per processing purpose); (3) Right to erasure — pseudonymization pipeline (UserDataErasureRequested Kafka event → BC pseudonymization → ERASURE_COMPLETED audit record); (4) Breach response runbook — 72-hour SLA tracked in PagerDuty; (5) PII masking in all logs (ADR-032).

### Consequences

**Positive:**
- Legal compliance: avoids EGP 1M fines and license suspension risk
- User trust: transparent data processing builds investor confidence
- Foundation for GDPR expansion in Phase 3 (European investor market)

**Negative / Trade-offs:**
- Erasure pipeline is complex (pseudonymization, not deletion, where FRA retention applies)
- Consent flows add friction to onboarding (3-5 additional consent screens)
- Data localization limits cloud flexibility (cannot use closest AWS/GCP region outside Egypt)

**Neutral:**
- PDPL compliance officer appointed (separate role from CISO)
- NCPD registration: completed as part of Phase 1 go-live checklist

---

## ADR-032: Structlog for Structured Logging

| Field | Value |
|-------|-------|
| Date | 2024-12-14 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of Platform Engineering |
| Constitutional Reference | Article 26 — Observability; Article 32 — Logging Standards |
| Last Reviewed | 2025-01-15 |

### Context

49 services generate millions of log lines per day. Unstructured printf-style logs cannot be queried, alerted on, or aggregated at scale with Loki's LogQL. PDPL requires PII fields be masked in all logs — an informal convention is insufficient. Compliance requires that logs contain correlation IDs (request_id, trace_id) to link log events to audit trail records.

### Decision

**structlog** (Python, MIT) for Python services. **winston** (TypeScript, MIT) for NestJS services. JSON format on every log event. Required fields: `timestamp` (ISO 8601 UTC), `level`, `service`, `version`, `request_id`, `trace_id`, `span_id`. PII masking: `user_id` → `sha256(user_id)[:12]`, `ip_address` → first 3 octets, names → `REDACTED`. Log aggregation: Loki.

### Consequences

**Positive:**
- LogQL queryable logs: `{service="portfolio"} | json | latency_ms > 100`
- PDPL-compliant: PII masked before logs leave the service process
- Trace correlation: every log line linkable to distributed trace

**Negative / Trade-offs:**
- JSON logs ~3x larger than text logs (Loki compression mitigates significantly)
- PII masking processor: each new PII field type must be explicitly added to processor

**Neutral:**
- Log level policy: DEBUG in dev/staging; INFO in prod (WARN/ERROR for actionable items)
- Log sampling: DEBUG logs sampled at 10% in staging to reduce volume

### Implementation Notes

```python
import structlog
from hashlib import sha256

def mask_pii(logger, method, event_dict):
    if 'user_id' in event_dict:
        uid = event_dict['user_id']
        event_dict['user_id_hash'] = sha256(uid.encode()).hexdigest()[:12]
        del event_dict['user_id']
    if 'ip_address' in event_dict:
        parts = event_dict['ip_address'].split('.')
        event_dict['ip_address'] = f"{parts[0]}.{parts[1]}.{parts[2]}.xxx"
    return event_dict

structlog.configure(
    processors=[
        mask_pii,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.JSONRenderer(),
    ],
)
```

---

## ADR-033: Testcontainers for Integration Tests

| Field | Value |
|-------|-------|
| Date | 2024-12-16 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, QA Lead, Head of Engineering |
| Constitutional Reference | Article 33 — Testing Standards |
| Last Reviewed | 2025-01-15 |

### Context

Integration tests for Tradeora services require real infrastructure: PostgreSQL with RLS policies (which don't activate in mocks), Kafka with Schema Registry (which enforces Avro schema compliance that mocks bypass), Valkey, Qdrant, and EventStoreDB. Mocking these at the library level produces tests that pass against mocks but fail in production due to real infrastructure behavioral differences.

### Decision

**Testcontainers** (Python and TypeScript libraries) for all integration tests. Real Docker containers per test suite: PostgreSQL 16 with TimescaleDB extension, Kafka + Confluent Schema Registry, Valkey 7.2, Qdrant latest, EventStoreDB 23.x. CI pipeline (GitHub Actions) runs full integration suite on every PR. Containers are ephemeral — started before tests, torn down after.

### Consequences

**Positive:**
- Real infrastructure behavior: PostgreSQL RLS enforced, Kafka schema validation enforced
- No mock false positives: integration bugs caught before production
- CI-reproducible: same container versions across all environments
- Validates Avro schema compliance, RLS policies, PgBouncer compatibility

**Negative / Trade-offs:**
- Integration tests: 30-120s container startup time per suite
- CI runners require Docker (DinD for GitHub Actions: additional configuration)
- Higher CI compute cost vs. mock-based tests

**Neutral:**
- Testcontainers reuse running containers within the same test session (startup cost is one-time per suite)
- Container versions pinned in `testcontainers-config.yaml` to ensure reproducibility

---

## ADR-034: PgBouncer for Connection Pooling

| Field | Value |
|-------|-------|
| Date | 2024-12-18 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, DBA Lead, Head of Platform Engineering |
| Constitutional Reference | Article 8 — Data Architecture; Article 34 — Database Performance |
| Last Reviewed | 2025-01-15 |

### Context

HPA (ADR-036) scales services horizontally. At 49 BCs × 10 pods × 5 connections per pod = 2,450 PostgreSQL connections — far exceeding PostgreSQL's practical limit. Each PostgreSQL connection consumes ~5MB shared memory; 2,450 connections = 12.25GB of connection overhead. Without an external pooler, HPA scaling would exhaust PostgreSQL connections before relieving application load.

### Decision

**PgBouncer 1.22+** (ISC license) in transaction mode as connection pooler. Max server connections per database: 100. Client connections: unlimited. PgBouncer sits between application pods and Patroni (via HAProxy). Multiple PgBouncer instances for HA. Transaction mode: connections returned to pool after each transaction — maximum reuse.

### Rationale

Transaction mode provides maximum connection reuse: a single PostgreSQL connection serves hundreds of simultaneous client requests (one at a time, per transaction). PgBouncer's C implementation is extremely lightweight (~5MB memory per instance). The 2,450 connection load is reduced to ~100 PostgreSQL connections — a 24x reduction.

### Consequences

**Positive:**
- Reduces PostgreSQL connections from 2,450 to ~100 (24x reduction)
- Enables unlimited application pod horizontal scaling without DB connection exhaustion
- Lightweight: PgBouncer uses ~5MB memory per instance
- Transparent: application sees standard PostgreSQL connection

**Negative / Trade-offs:**
- Transaction pooling mode: incompatible with `SET SESSION` (must use `SET LOCAL`), advisory locks, and server-side prepared statements (use `?` placeholders instead)
- Network hop: adds 1-2ms latency per query
- PgBouncer admin interface: basic monitoring only (supplement with Prometheus exporter)

**Neutral:**
- PgBouncer pool mode: transaction (not session, not statement)
- `SET LOCAL app.current_user_id` (ADR-020 RLS) is compatible with transaction pooling mode

### Implementation Notes

```ini
; pgbouncer.ini
[databases]
portfolio = host=patroni-primary.db.svc.cluster.local port=5432 dbname=tradeora

[pgbouncer]
listen_port = 5432
listen_addr = 0.0.0.0
auth_type = scram-sha-256
pool_mode = transaction
max_client_conn = 10000
default_pool_size = 20
server_pool_size = 100
server_lifetime = 3600
server_idle_timeout = 600
log_connections = 0
log_disconnections = 0
stats_period = 60
```

---

## ADR-035: Constitution-Driven Architecture

| Field | Value |
|-------|-------|
| Date | 2024-12-20 |
| Status | **ACCEPTED** |
| Deciders | CTO, Chief Architect, All Tech Leads (unanimous) |
| Constitutional Reference | Article 35 — Governance Framework (self-referential) |
| Last Reviewed | 2025-01-15 |

### Context

Tradeora's development involves 15+ engineering teams, an 18-24 month timeline, and 49 bounded contexts. Without a codified architectural authority, each team makes local decisions that conflict with other teams' decisions. Technical debt accumulates silently. Security decisions get made without security review. Regulatory requirements get missed in velocity-focused sprints. Architecture governance at this scale requires formal enforcement, not soft guidelines.

### Decision

**Tradeora Engineering Constitution** (29 Articles) is the supreme architectural authority. Every ADR must cite a Constitutional Article as its foundation. Every PR must include a compliance checklist confirming no Constitutional violations. Chief Architect has veto power on Constitutional violations. Constitution amendments: RFC process + 2-week comment period + all Tech Leads sign-off + CTO approval.

### Consequences

**Positive:**
- Consistent architecture across 49 BCs and 15+ teams
- Regulatory defensibility: architecture decisions documented and principled
- Team alignment: disputes resolved by reference to Constitution, not politics
- Prevents local optimization that harms global architecture

**Negative / Trade-offs:**
- Governance overhead: PR checklist, Architecture Review Board, RFC process
- Chief Architect bottleneck for Constitutional disputes
- Culture change required for teams accustomed to full autonomy

**Neutral:**
- Constitution is publicly accessible to all engineering staff
- Architecture Review Board: Chief Architect + rotating Tech Lead representative

---

## ADR-036: Horizontal Pod Autoscaler for All Services

| Field | Value |
|-------|-------|
| Date | 2024-12-22 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of Infrastructure, Head of Platform Engineering |
| Constitutional Reference | Article 25 — Business Continuity; Article 36 — Scalability |
| Last Reviewed | 2025-01-15 |

### Context

EGX trading creates predictable bursty load: 09:30 EGT open generates 10x normal load as users check overnight recommendations. 14:55 EGT pre-close sees a second spike. Static pod counts either waste resources off-peak or are under-provisioned at peak. Manual scaling introduces operational risk under trading session pressure.

### Decision

**HPA** enabled for ALL stateless Kubernetes deployments. Standard services: `min_replicas=2`, `max_replicas=10`. Scale trigger: CPU > 70% OR memory > 75% (sustained 3 minutes). Scale-in: 5-minute cooldown. AI schools: `min_replicas=1` (GPU cost), `max_replicas=3`, GPU utilization > 70% trigger. Predictive scaling CronJob: pre-scale 15 minutes before EGX open (09:15 EGT) and 14:40 EGT.

### Consequences

**Positive:**
- Automatic load handling at EGX session open spikes
- Off-peak cost optimization: scale-in to minimum replicas during 15:00-09:30 window
- HA minimum: 2 replicas guarantee no single-pod SPOF for non-GPU services

**Negative / Trade-offs:**
- Stateful services (EventStoreDB, PostgreSQL, Kafka) cannot use HPA
- Scale-in cooldown means temporary over-provisioning after peak
- GPU nodes are expensive; AI school scaling must be economically justified

**Neutral:**
- KEDA (Kafka-based autoscaling) added in Phase 2 for Kafka consumer lag-based scaling

### Implementation Notes

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: recommendation-api-hpa
  namespace: tradeora
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: recommendation-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 75
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # 5-minute cooldown
```

---

## ADR-037: No Cross-Schema SQL Queries

| Field | Value |
|-------|-------|
| Date | 2024-12-24 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, DDD Lead, All Tech Leads (unanimous) |
| Constitutional Reference | Article 7 — BC Isolation; Article 37 — Data Coupling Prevention |
| Last Reviewed | 2025-01-15 |

### Context

PostgreSQL trivially allows `SELECT * FROM schema_a.table JOIN schema_b.table` — making cross-schema queries technically simple. Without an explicit prohibition, engineers under delivery pressure use cross-schema SQL as a shortcut, creating tight data coupling between BCs. This coupling makes independent deployment impossible: a schema_a DDL change can break schema_b queries silently.

### Decision

Cross-schema SQL queries are **PROHIBITED with zero exceptions**. Multi-layer enforcement: (1) CI fitness function `cross_schema_checker.py` scans all SQL files for cross-schema references and fails build, (2) PostgreSQL GRANT: each BC's service user can only access its own schema (permission error on cross-schema attempt), (3) Architecture peer review: SQL files reviewed by architecture team. Data sharing: Kafka events ONLY.

### Consequences

**Positive:**
- True BC isolation enforced at DB engine level — not just policy
- Independent migration: no cross-schema FK constraints to worry about
- Coupling prevention: enforced automatically, not dependent on code review thoroughness

**Negative / Trade-offs:**
- Cannot do multi-BC reporting via SQL (must use Kafka-derived analytics store or data warehouse)
- More Kafka events needed for data flows previously done via SQL JOIN
- Cross-BC reporting latency: Kafka-derived read models lag by seconds vs. SQL JOIN immediacy

**Neutral:**
- Fitness function runs in CI/CD pipeline: zero human review required for enforcement

### Implementation Notes

```python
# cross_schema_checker.py (CI fitness function)
import re, sys, os

CROSS_SCHEMA_PATTERN = re.compile(
    r'\b(?:FROM|JOIN|UPDATE|INSERT\s+INTO)\s+(\w+)\.(\w+)',
    re.IGNORECASE
)

def check_file(filepath: str, allowed_schema: str) -> list[str]:
    violations = []
    with open(filepath) as f:
        for i, line in enumerate(f, 1):
            for match in CROSS_SCHEMA_PATTERN.finditer(line):
                schema = match.group(1)
                if schema != allowed_schema and schema not in ('public', 'pg_catalog'):
                    violations.append(f"{filepath}:{i}: Cross-schema reference to '{schema}'")
    return violations
```

---

## ADR-038: Qwen2.5 Model Family for LLM Inference

| Field | Value |
|-------|-------|
| Date | 2024-12-26 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of AI Research, Head of AI Engineering |
| Constitutional Reference | Article 10 — AI Governance; Article 29 — OSS-First; Article 31 — Data Sovereignty |
| Last Reviewed | 2025-01-15 |

### Context

LLM selection required evaluation against: (1) Arabic text quality (MSA financial vocabulary), (2) Local GPU inference capability (PDPL requirement), (3) Financial reasoning capability, (4) Context window size (for long financial statement analysis), (5) OSS license compatibility. Evaluation on a 500-item Arabic financial text benchmark constructed from EGX financial news and analyst reports.

### Decision

**Qwen2.5:72b** (Alibaba Cloud, Apache 2.0) as primary LLM. **Qwen2.5:7b** as secondary/fallback. Both run via Ollama on local GPU. LiteLLM routing: GPU utilization > 85% → route to 7b with quality flag. Arabic benchmark: Qwen2.5:72b F1 = 0.89; Llama 3.1:70b F1 = 0.71; Mistral:7b F1 = 0.58.

### Consequences

**Positive:**
- Best Arabic quality among OSS models (F1 = 0.89)
- Apache 2.0: fully OSS, commercial use permitted
- Runs locally: PDPL compliant
- 128K token context window: entire financial annual report fits in context

**Negative / Trade-offs:**
- 72b model requires 80GB+ VRAM (NVIDIA A100 80GB or 2× A40 48GB)
- Inference latency: 2-4 seconds per request (school-level caching required)
- Large model download: 72b GGUF Q4 ≈ 40GB

**Neutral:**
- Qwen2.5 model family: regular updates from Alibaba Cloud; Apache 2.0 license maintained
- Model evaluation cadence: quarterly benchmark on 500-item EGX Arabic test set

### Implementation Notes

**OSS LLM Arabic benchmark results:**

| Model | Arabic F1 | Context Window | VRAM Required | License |
|-------|-----------|----------------|---------------|---------|
| Qwen2.5:72b | **0.89** | 128K | 80GB | Apache 2.0 |
| Llama 3.1:70b | 0.71 | 128K | 80GB | Llama 3.1 License |
| Mistral:7b | 0.58 | 32K | 8GB | Apache 2.0 |
| Gemma 2:27b | 0.62 | 8K | 30GB | Gemma License |
| Falcon:40b | 0.55 | 2K | 45GB | Apache 2.0 |

---

## ADR-039: FRA Advisory-Only Registration

| Field | Value |
|-------|-------|
| Date | 2024-12-28 |
| Status | **ACCEPTED** |
| Deciders | CEO, Legal, FRA Compliance Advisor, Chief Architect |
| Constitutional Reference | Article 28 — Regulatory Compliance; Article 39 — FRA Registration |
| Last Reviewed | 2025-01-15 |

### Context

Tradeora's AI output could be classified by FRA as: (1) financial information service (Article 93, Capital Markets Law) — lighter requirements and registration; or (2) investment advice with fiduciary duty — requires Investment Advisor license, EGP 5,000,000 minimum capital, independent compliance officer, detailed client suitability assessments per transaction. The regulatory classification depends entirely on how recommendations are framed and labeled throughout the product.

### Decision

Register under FRA as **Information Service Provider** (financial information and analysis service). Architectural enforcement: (1) All AI outputs labeled "تحليل مالي" (financial analysis) — never "نصيحة استثمارية" (investment advice), (2) Mandatory disclaimer on every recommendation API response and UI screen, (3) Compliance team reviews all AI output labels quarterly, (4) `isAdvice: false, analysisType: 'INFORMATION'` in all recommendation API responses.

### Consequences

**Positive:**
- FRA registration achievable in Phase 1 (3-6 months vs. 12-18 months for Investment Advisor)
- No EGP 5,000,000 minimum capital requirement
- Simpler ongoing compliance: no per-transaction suitability assessment
- Faster product launch

**Negative / Trade-offs:**
- Cannot offer personalized investment advice in Phase 1
- Revenue model: information subscription (Phase 1) vs. advisory fees (Phase 3)
- Phase 3 Investment Advisor license requires separate, lengthy FRA application

**Neutral:**
- FRA disclaimer text (Arabic): "هذا التحليل لأغراض المعلومات فقط وليس نصيحة استثمارية. الاستثمار في الأوراق المالية ينطوي على مخاطر. استشر مستشاراً مالياً قبل الاستثمار."
- FRA disclaimer text (English): "This analysis is for informational purposes only and does not constitute investment advice. Securities investment involves risk. Consult a financial advisor before investing."

---

## ADR-040: Phase-Gated Feature Flags for School Activation

| Field | Value |
|-------|-------|
| Date | 2024-12-30 |
| Status | **ACCEPTED** |
| Deciders | Chief Architect, Head of AI Engineering, Head of Product |
| Constitutional Reference | Article 21 — Feature Lifecycle; Article 40 — Phase Management |
| Last Reviewed | 2025-01-15 |

### Context

Phase 2 AI schools (OptionsFlow, InsiderActivity, ESGAnalysis, GlobalMacro, AlternativeData) are architecturally designed in Phase 1 — their interfaces, data contracts, and consensus integration points are defined. However, implementation is deferred. Separate code branches per phase create merge conflicts and divergence. Stub implementations create dead code. A feature-flag-based approach keeps the architecture unified while enabling clean phase gating.

### Decision

Each AI school has a dedicated Unleash flag: `ai.school.{school_name}.enabled`. Phase 1 schools: flag ON at deployment. Phase 2 schools: flag OFF; schema and interface deployed but school returns `SchoolUnavailable` response when disabled. WisdomEngine dynamically includes/excludes schools based on flag state — quorum calculation adjusts automatically. Phase 2 school activation gated on: 30-day shadow mode accuracy validation + Feature Review Board approval.

### Consequences

**Positive:**
- Clean phase separation without code branching or merge conflicts
- Instant school activation/deactivation without redeployment
- Dynamic quorum: WisdomEngine automatically recalculates quorum from active schools
- Shadow mode: accuracy validated in production before users see recommendations

**Negative / Trade-offs:**
- Phase 2 school stubs add code to Phase 1 deployment
- Unleash flag proliferation: management overhead for 17+ school flags
- Shadow mode requires infrastructure to run both old and new school implementations simultaneously

**Neutral:**
- School flags managed by Head of AI Engineering + Product (no Chief Architect approval needed for within-phase flags)
- Cross-phase flag changes (Phase 1 → Phase 2 school activation): Feature Review Board approval required

### Implementation Notes

```typescript
// WisdomEngine school loading with dynamic flag check
@Injectable()
export class WisdomEngine {
  constructor(
    private unleash: UnleashService,
    private schoolRegistry: SchoolRegistry,
  ) {}

  async getActiveSchools(): Promise<AISchool[]> {
    const allSchools = this.schoolRegistry.getAllSchools();
    return allSchools.filter(school =>
      this.unleash.isEnabled(`ai.school.${school.id}.enabled`)
    );
  }

  calculateQuorum(activeSchools: AISchool[]): number {
    // Dynamic quorum: ceil(75% of active schools)
    return Math.ceil(activeSchools.length * 0.75);
  }
}
```

**School flag registry:**

| School | Phase | Flag Key | Default State |
|--------|-------|----------|---------------|
| TechnicalAnalysis | 1 | `ai.school.technical_analysis.enabled` | ON |
| FundamentalAnalysis | 1 | `ai.school.fundamental_analysis.enabled` | ON |
| MacroEconomic | 1 | `ai.school.macro_economic.enabled` | ON |
| SentimentAnalysis | 1 | `ai.school.sentiment_analysis.enabled` | ON |
| PatternRecognition | 1 | `ai.school.pattern_recognition.enabled` | ON |
| PeerComparison | 1 | `ai.school.peer_comparison.enabled` | ON |
| MomentumAnalysis | 1 | `ai.school.momentum_analysis.enabled` | ON |
| RiskAssessment | 1 | `ai.school.risk_assessment.enabled` | ON |
| ValuationModel | 1 | `ai.school.valuation_model.enabled` | ON |
| LiquidityAnalysis | 1 | `ai.school.liquidity_analysis.enabled` | ON |
| SeasonalityAnalysis | 1 | `ai.school.seasonality_analysis.enabled` | ON |
| NewsEventAnalysis | 1 | `ai.school.news_event_analysis.enabled` | ON |
| OptionsFlow | 2 | `ai.school.options_flow.enabled` | **OFF** |
| InsiderActivity | 2 | `ai.school.insider_activity.enabled` | **OFF** |
| ESGAnalysis | 2 | `ai.school.esg_analysis.enabled` | **OFF** |
| GlobalMacro | 2 | `ai.school.global_macro.enabled` | **OFF** |
| AlternativeData | 2 | `ai.school.alternative_data.enabled` | **OFF** |

---

## ADR Governance Process

All new architecture decisions follow this process before being recorded as an ADR:

```
1. TRIGGER       → Engineer or Tech Lead identifies a significant decision
                   (Significance: affects >1 BC, has security/compliance/performance impact,
                    or establishes a new technology choice)

2. RFC DRAFT     → Author writes RFC: Problem Statement + Proposed Decision + Alternatives
                   → Posted in #architecture Slack channel
                   → Minimum 5 business days open for comment

3. REVIEW        → Architecture Review Board reviews RFC
                   → All Tech Leads may vote (non-binding input)
                   → Chief Architect makes final decision

4. ACCEPTED      → Author writes full ADR in MADR format
                   → References Constitutional Article
                   → Added to this document via PR
                   → PR reviewed by Chief Architect

5. SUPERSEDED    → New ADR written that references superseded ADR
                   → Old ADR status changed to SUPERSEDED with reference to replacement
                   → Old ADR content preserved for historical context
```

**ADR authorship requirements:**
- Must reference one or more Constitutional Articles
- Must document rejected alternatives with clear rejection reasoning
- Must include at least one implementation note or code example
- Must be reviewed by Chief Architect before merge

---

## ADR Status Summary

| ADR | Title | Status | Date | Constitutional Ref |
|-----|-------|--------|------|-------------------|
| ADR-001 | Python + TypeScript/NestJS language split | ACCEPTED | 2024-09-01 | Art. 1 |
| ADR-002 | Ollama + LiteLLM local inference | ACCEPTED | 2024-09-10 | Art. 29, 31 |
| ADR-003 | Valkey over Redis | ACCEPTED | 2024-09-15 | Art. 29 |
| ADR-004 | TimescaleDB for time-series data | ACCEPTED | 2024-09-20 | Art. 8 |
| ADR-005 | EventStoreDB for event sourcing | ACCEPTED | 2024-09-25 | Art. 3, 12 |
| ADR-006 | Decimal arithmetic, no IEEE 754 floats | ACCEPTED | 2024-10-01 | Art. 17 |
| ADR-007 | Schema-per-BC PostgreSQL isolation | ACCEPTED | 2024-10-05 | Art. 3, 7 |
| ADR-008 | Kafka for cross-BC communication | ACCEPTED | 2024-10-08 | Art. 4, 7 |
| ADR-009 | Unleash OSS feature flags | ACCEPTED | 2024-10-12 | Art. 29, 21 |
| ADR-010 | Qdrant vector search | ACCEPTED | 2024-10-15 | Art. 29, 11 |
| ADR-011 | 17-school consensus AI architecture | ACCEPTED | 2024-10-20 | Art. 10, 15 |
| ADR-012 | Keycloak IAM | ACCEPTED | 2024-10-22 | Art. 29, 31, 16 |
| ADR-013 | Kong OSS API gateway | ACCEPTED | 2024-10-25 | Art. 29, 16 |
| ADR-014 | MinIO WORM object storage | ACCEPTED | 2024-10-28 | Art. 12, 29, 31 |
| ADR-015 | Patroni PostgreSQL HA | ACCEPTED | 2024-11-01 | Art. 25, 8 |
| ADR-016 | Arabic-first language architecture | ACCEPTED | 2024-11-05 | Art. 2, 10 |
| ADR-017 | ULID distributed ID generation | ACCEPTED | 2024-11-08 | Art. 8 |
| ADR-018 | OpenBao secrets management | ACCEPTED | 2024-11-10 | Art. 29, 16 |
| ADR-019 | Kafka Avro + Schema Registry | ACCEPTED | 2024-11-12 | Art. 4, 9 |
| ADR-020 | Row-Level Security retail isolation | ACCEPTED | 2024-11-15 | Art. 7, 16, 31 |
| ADR-021 | 6-stage feature lifecycle | ACCEPTED | 2024-11-18 | Art. 21, 12 |
| ADR-022 | EGX-only Phase 1 focus | ACCEPTED | 2024-11-20 | Art. 2, 22 |
| ADR-023 | Look-ahead bias prevention | ACCEPTED | 2024-11-22 | Art. 23, 10 |
| ADR-024 | gVisor AI school sandboxing | ACCEPTED | 2024-11-25 | Art. 16, 24 |
| ADR-025 | FluxCD GitOps | ACCEPTED | 2024-11-28 | Art. 25, 29 |
| ADR-026 | Grafana + Prometheus observability | ACCEPTED | 2024-12-01 | Art. 29, 26 |
| ADR-027 | Flyway database migrations | ACCEPTED | 2024-12-03 | Art. 8, 27 |
| ADR-028 | No autonomous trading, advisory only | ACCEPTED | 2024-12-05 | Art. 6, 28 |
| ADR-029 | CAMeL-BERT Arabic NLP | ACCEPTED | 2024-12-08 | Art. 10, 16 |
| ADR-030 | OpenTelemetry distributed tracing | ACCEPTED | 2024-12-10 | Art. 26 |
| ADR-031 | PDPL 2020 compliance by design | ACCEPTED | 2024-12-12 | Art. 31 |
| ADR-032 | Structlog structured logging | ACCEPTED | 2024-12-14 | Art. 26, 32 |
| ADR-033 | Testcontainers integration tests | ACCEPTED | 2024-12-16 | Art. 33 |
| ADR-034 | PgBouncer connection pooling | ACCEPTED | 2024-12-18 | Art. 8, 34 |
| ADR-035 | Constitution-driven architecture | ACCEPTED | 2024-12-20 | Art. 35 |
| ADR-036 | HPA for all services | ACCEPTED | 2024-12-22 | Art. 25, 36 |
| ADR-037 | No cross-schema SQL queries | ACCEPTED | 2024-12-24 | Art. 7, 37 |
| ADR-038 | Qwen2.5 model family | ACCEPTED | 2024-12-26 | Art. 10, 29, 31 |
| ADR-039 | FRA advisory-only registration | ACCEPTED | 2024-12-28 | Art. 28, 39 |
| ADR-040 | Phase-gated feature flags for schools | ACCEPTED | 2024-12-30 | Art. 21, 40 |
| ADR-047 | Centralized Enterprise Metrics Catalog | ACCEPTED | 2026-07-24 | Art. 8, 17 |
| ADR-048 | Enterprise AI Benchmark Suite | ACCEPTED | 2026-07-24 | Art. 6, 17 |
| ADR-049 | Enterprise Evolution KPIs with Architecture Stability | ACCEPTED | 2026-07-24 | Art. 8 |

---

## ADR-047: Centralized Enterprise Metrics Catalog

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-047 |
| **Title** | Centralized Enterprise Metrics Catalog |
| **Status** | ACCEPTED |
| **Date** | 2026-07-24 |
| **Deciders** | Global Enterprise Architecture Board |
| **Constitution Articles** | Article 8 (data governance), Article 17 (Decimal arithmetic) |

### Context
The Tradeora platform had an `ENTERPRISE_METRICS_FRAMEWORK.md` document that defined
the metrics strategy, but no registry of actual metrics. Grafana dashboards and Prometheus
counters were being defined ad-hoc by engineering teams without centralized governance.
This created inconsistency in metric naming, aggregation methods, and ownership.

### Decision
Create `ENTERPRISE_METRICS_CATALOG.md` as the **single authoritative registry** of
every measurable value in the Tradeora platform. A metric may not be published to a
Grafana dashboard, Prometheus endpoint, or business report unless it is registered in
the catalog first.

Each metric uses a 21-field schema: Metric ID, Name, Description, Business Meaning,
Technical Meaning, Formula, Unit, Aggregation Method, Source, Refresh Frequency,
Retention Policy, Alert Thresholds, Consumers, Dependencies, Version, Validation
Rules, Dashboard, Business Owner, Technical Owner, AI Owner, Data Owner.

Metric IDs follow the pattern `TRD-MTR-{domain}-{seq}`.

### Consequences
- **Positive**: Single source of truth for all metrics; consistent naming; clear ownership
- **Positive**: Alert thresholds are centrally governed; changes require catalog update
- **Positive**: Article 17 enforced — all formulas explicitly use Decimal arithmetic
- **Neutral**: Engineering teams must register metrics before publishing them
- **Negative**: Minor overhead per metric (21-field form), offset by governance benefit

---

## ADR-048: Enterprise AI Benchmark Suite

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-048 |
| **Title** | Enterprise AI Benchmark Suite with Decision Consistency Cluster |
| **Status** | ACCEPTED |
| **Date** | 2026-07-24 |
| **Deciders** | Global Enterprise Architecture Board |
| **Constitution Articles** | Article 6 (HITL), Article 11 (FRA), Article 17 (Decimal) |

### Context
The AI system had accuracy goals documented in various places, but no unified,
machine-readable benchmark system. WisdomEngine recalibration had no formal
quality gate. AI quality degradation could go undetected until FRA noticed
inaccurate recommendations — an unacceptable regulatory risk.

### Decision
Create `ENTERPRISE_AI_BENCHMARK_SUITE.md` defining 20 benchmarks across 11 categories.
Key decisions:
1. All benchmark results stored in TimescaleDB `benchmark_results` hypertable (7-year retention)
2. WisdomEngine recalibration gate: if `TRD-BM-SIG-001`, `TRD-BM-PRED-001`, or `TRD-BM-SAFE-001`
   fail the minimum threshold in the last 7 days — recalibration is BLOCKED
3. New benchmark category: **Decision Consistency** (4 benchmarks, `TRD-BM-CONS-001..004`)
   measuring reproducibility, version alignment, reasoning stability, and confidence stability
4. All evaluation algorithms use Decimal arithmetic (Article 17)
5. Hallucination rate ≥ 2% → AI recommendations suspended immediately (Article 6 protection)

### Consequences
- **Positive**: AI quality is continuously measured; regressions detected automatically
- **Positive**: WisdomEngine recalibration gate prevents bad model weights from entering production
- **Positive**: Decision Consistency benchmarks ensure AI is deterministic and trustworthy
- **Positive**: Golden dataset integrity verified via SHA-256 before every backtest run
- **Neutral**: Monthly benchmark runs add ~2 hours of compute time
- **Negative**: None identified

---

## ADR-049: Enterprise Evolution KPIs with Architecture Stability Index

| Field | Value |
|-------|-------|
| **ADR ID** | ADR-049 |
| **Title** | Enterprise Evolution KPIs with Architecture Stability Index |
| **Status** | ACCEPTED |
| **Date** | 2026-07-24 |
| **Deciders** | Global Enterprise Architecture Board |
| **Constitution Articles** | Article 8 (data governance) |

### Context
Operational metrics (Prometheus) measure current platform state. Business KPIs measure
current revenue. But there was no framework to answer: **"Is Tradeora improving over
time?"** Without longitudinal KPIs, it is impossible to know if the AI is getting
smarter, if the architecture is staying healthy, or if the platform is drifting from
its frozen baseline during implementation.

### Decision
Create `ENTERPRISE_EVOLUTION_KPIS.md` defining 23 longitudinal KPIs across 13 domains.
Key decisions:
1. All KPI values stored in `evolution_kpi_history` TimescaleDB hypertable (10-year retention)
2. Trend calculation uses **Compound Monthly Growth Rate (CMGR)** via Decimal arithmetic
3. New KPI cluster: **Architecture Stability** (`TRD-EVO-STAB-001..004`) introduced to
   measure architecture drift, ECR modification rate, drift score, and long-term maintainability
   index (24-month projection)
4. Monthly Evolution Report auto-generated by `BenchmarkReportService`
5. Annual Architecture Evolution Review conducted by Architecture Council each January
6. Architecture Stability Index must remain ≥ 0.95 during Phase 8 implementation

### Architecture Stability Index Formula
```
stability = 1 - (arch_modifications / total_components) × (1 + drift_severity_score)

Where:
  arch_modifications = ECRs approved in the period
  drift_severity_score = severity-weighted drift events (LOW=1, MEDIUM=3, HIGH=10)
  total_components = total frozen architectural decisions (49 ADRs + 51 BCs = 100)
```

### Consequences
- **Positive**: Longitudinal view of platform improvement across every dimension
- **Positive**: Architecture Stability KPI provides early warning of implementation drift
- **Positive**: AI Evolution Index gives single number answer to "is AI getting smarter?"
- **Positive**: Business Growth Index tracks revenue trajectory in one composite metric
- **Neutral**: Monthly KPI calculation adds minimal compute overhead
- **Negative**: None identified

---

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║   TRADEORA FINANCIAL OPERATING SYSTEM · ARCHITECTURE DECISION RECORDS          ║
║   Classification: INTERNAL · Chief Architect Authority                         ║
║   Version 1.3.0 · 49 ADRs · Frozen at Architecture Freeze v1.2 FINAL          ║
║   Next Review: Quarterly · Contact: chief-architect@tradeora.io               ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```
