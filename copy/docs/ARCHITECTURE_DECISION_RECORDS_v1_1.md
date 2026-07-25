# Tradeora Financial Operating System
## Architecture Decision Records (v1.1.0)
## Status: AUTHORITATIVE | Date: 2026-07-24 | Revision: 1.1.0

This document contains the Architecture Decision Records (ADRs) formulated during the v1.1 architectural improvement phase.
The architecture described herein is **FROZEN at v1.1** — existing decisions are immutable.
New depth and three additional ADRs (046–048) have been added in revision 1.1.0.

---

## ADR-041: Enterprise LLM Gateway Pattern

**Date:** 2026-07-24
**Status:** ACCEPTED
**Authors:** Chief Enterprise Architect
**Resolves:** ISSUE-002

### Context and Problem Statement
The initial architecture tightly coupled internal AI agents to direct physical instances of Ollama for inference. As the system scales and the need for more complex reasoning models emerges, this direct coupling creates a critical scalability cliff. We face the risk of vendor/provider lock-in and lack a centralized mechanism for applying rate limits, tracking token costs, routing requests based on model availability, and seamlessly falling back to cloud providers (like OpenAI or Anthropic) during severe load spikes. How can we decouple the domain logic of our AI agents from the physical inference infrastructure?

### Decision Drivers
- Need to prevent vendor lock-in and allow seamless switching between local models and cloud providers.
- Requirement for centralized observability (token usage, latency, error rates).
- Necessity for intelligent request routing and load balancing across multiple inference nodes.
- Strict enforcement of API key governance and security.

### Considered Options
1. **Option A: Client-Side Load Balancing (Status Quo)**
   Agents contain libraries to manage multiple endpoints.
   *Cons:* Duplicates routing logic across every service. Hard to enforce global rate limits.
2. **Option B: Service Mesh Extension**
   Utilize Istio/Envoy filters to intercept and route LLM traffic.
   *Cons:* Extremely complex to configure for specific LLM payload inspection and retry logic.
3. **Option C: Enterprise LLM Gateway (Dedicated Middleware)**
   Deploy a specialized gateway (e.g., LiteLLM or custom Go service) that exposes a unified OpenAI-compatible API to the internal network and proxies requests to the appropriate backend.

### Decision Outcome
Chosen option: **Option C: Enterprise LLM Gateway (Dedicated Middleware)**.
We will implement a centralized LLM Gateway. All internal services will communicate solely with this gateway using standard OpenAI API schemas. The gateway will handle authentication, model translation, cost tracking, and routing to either local Ollama clusters or external APIs based on dynamic configuration.

**Positive Consequences:**
- Complete decoupling of AI logic from inference providers.
- Single pane of glass for all AI observability and cost management.
- Ability to implement robust fallback strategies (e.g., if local Ollama fails, fallback to Azure OpenAI).
- Centralized governance of external API keys.

**Negative Consequences (Tradeoffs Accepted):**
- Introduces an additional network hop, slightly increasing base latency.
- Creates a new critical single point of failure (requires highly available deployment).

### Alternatives Not Chosen
Client-side load balancing was rejected due to the complexity of updating routing rules across dozens of independent microservices. Service Mesh was rejected as overkill and lacking domain-specific features like token counting.

### Compliance Check
- Article 29 (OSS-first): ✅ (Will utilize OSS gateway solutions where possible)
- Article 17 (Decimal arithmetic): ✅ (N/A)
- Article 3 (Extension over modification): ✅ (Gateway allows adding new models without modifying agents)
- Article 6 (Advisory-only AI): ✅ (Enforced at the gateway policy level)

### Implementation Notes

All AI Engine services (e.g., `TRD-AI-001` through `TRD-AI-N`) MUST communicate with the gateway exclusively through the following TypeScript client contract. The interface is intentionally narrow to prevent consumers from bypassing centralized concerns such as audit logging, rate limiting, and provider fallback.

```typescript
interface LLMGatewayClient {
  readonly baseUrl: string;
  complete(request: LLMRequest): Promise<LLMResponse>;
  stream(request: LLMRequest): AsyncIterable<LLMStreamChunk>;
  embeddings(text: string): Promise<number[]>;
}

interface LLMRequest {
  model: string;           // e.g., 'tradeora/llama3-finance'
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  tenantId: TenantId;     // For usage tracking and cost attribution
  engineId: AIEngineId;   // e.g., 'TRD-AI-001' — identifies the calling engine
}

interface LLMResponse {
  id: string;
  model: string;
  choices: ResponseChoice[];
  usage: TokenUsage;        // Mandatory — drives cost attribution
  providerId: string;       // Indicates which backend served the request
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

The `engineId` field is mandatory and non-nullable. Gateway middleware MUST reject any request without a valid `engineId` with an `HTTP 400`. This ensures every inference call is traceable to a specific AI Engine in audit logs.

The `stream()` method yields `LLMStreamChunk` objects and MUST be used for all Tier-2 and above responses rendered in the UI — see ADR-043 for tier definitions. Clients consuming streams are responsible for assembling the final `TokenUsage` from the `[DONE]` sentinel chunk.

### Monitoring Strategy

The following Prometheus metrics are the **mandatory minimum** for every LLM Gateway deployment. Alerts MUST be configured for each metric in the operations runbook.

| Metric Name | Type | Labels | Alert Threshold |
|---|---|---|---|
| `llm_gateway_tokens_consumed_total` | Counter | `engine_id`, `model`, `tenant_id`, `provider_id` | Cost budget alert via recording rule |
| `llm_gateway_request_latency_ms` | Histogram | `engine_id`, `model`, `provider_id`, `tier` | p99 > 1500ms triggers PagerDuty (Tier 1) |
| `llm_gateway_provider_fallback_total` | Counter | `from_provider`, `to_provider`, `reason` | > 5 fallbacks/min triggers P2 incident |
| `llm_gateway_errors_total` | Counter | `engine_id`, `error_code` | > 10 errors/min triggers P1 |
| `llm_gateway_active_streams` | Gauge | `engine_id` | > 500 concurrent streams triggers capacity alert |

A Grafana dashboard named `Tradeora LLM Gateway Overview` MUST be maintained in the `monitoring/dashboards/` GitOps path and reconciled by FluxCD (see ADR-045).

### Security

**mTLS between AI Engines and Gateway:** All intra-cluster traffic between an AI Engine pod and the LLM Gateway MUST use mutual TLS. Client certificates are issued by the internal Tradeora CA (managed via cert-manager). Gateway pods MUST refuse connections presenting an unknown or expired client certificate with a `TLS 1.3` alert, logged at `WARN` level.

**API Key Governance via OpenBao:** External provider API keys (OpenAI, Anthropic, Azure OpenAI) are stored exclusively in **OpenBao** (the OSS HashiCorp Vault fork, Apache 2.0). The gateway authenticates to OpenBao using its Kubernetes ServiceAccount JWT (see ADR-047) and retrieves keys via the KV Secrets Engine v2. Keys are **never** written to environment variables, ConfigMaps, or Kubernetes Secrets directly.

**PDPL 2020 Audit Log Compliance:** Every inference request processed by the gateway generates an immutable audit log entry. The entry MUST contain: `timestamp` (ISO 8601), `engineId`, `tenantId`, `model`, `providerId`, `promptTokens`, `completionTokens`, and a SHA-256 hash of the prompt payload. Log entries are written to the append-only EventStoreDB stream `$tradeora-llm-audit` and are subject to the 7-year retention policy mandated by Article 18 and PDPL 2020.

---

## ADR-042: Ground Truth Feedback System

**Date:** 2026-07-24
**Status:** ACCEPTED
**Authors:** Chief Enterprise Architect
**Resolves:** ISSUE-007

### Context and Problem Statement
An AI advisory system operating in financial markets requires continuous validation against objective reality. Without a mechanism to measure the accuracy of its predictions, the model's performance will inevitably drift due to changing market regimes. We currently lack a systemic, automated way to capture the "ground truth" (the actual market outcome) and correlate it with the AI's prior recommendations to facilitate Reinforcement Learning and model improvement.

### Decision Drivers
- Requirement for continuous model improvement.
- Need to establish an objective metric for AI advisory quality.
- Compliance with the AI Constitution's mandate for accountable and measurable AI.

### Considered Options
1. **Option A: Manual Periodic Audits**
   Data science team manually extracts recommendations and compares them to historical charts.
   *Cons:* Unscalable, subjective, and too slow for dynamic markets.
2. **Option B: Synchronous Evaluation at Trade Closure**
   The system blocks when a trade closes to evaluate the original recommendation.
   *Cons:* Introduces unacceptable latency and couples execution with analytics.
3. **Option C: Asynchronous Ground Truth Collector**
   An independent background process that observes historical predictions and continuously polls market data to evaluate outcomes over a defined horizon (e.g., 5 days).

### Decision Outcome
Chosen option: **Option C: Asynchronous Ground Truth Collector**.
We will implement an event-driven Ground Truth System. It will consume `RecommendationGenerated` events and schedule a validation task. After the specified horizon (e.g., T+5 days), it will query the market data store, calculate the directional outcome, and emit a `GroundTruthCollected` event. This data will be stored in Qdrant for similarity search and training pipelines.

**Positive Consequences:**
- Completely uncouples evaluation from the critical trading path.
- Generates a high-quality, continuous dataset for model fine-tuning.
- Provides real-time dashboards on model accuracy drift.

**Negative Consequences (Tradeoffs Accepted):**
- Increases storage costs due to retaining the evaluation context.
- Adds complexity to the event architecture (scheduling future events).

### Alternatives Not Chosen
Manual audits were dismissed as archaic. Synchronous evaluation violates performance mandates and Clean Architecture boundaries.

### Compliance Check
- Article 29 (OSS-first): ✅
- Article 17 (Decimal arithmetic): ✅ (Strictly used for outcome calculation)
- Article 3 (Extension over modification): ✅
- Article 6 (Advisory-only AI): ✅ (Validates the advisory nature)

### Implementation Notes

The Ground Truth Collector is a stateless Python worker deployed as a Kubernetes Deployment (replicas: 2, anti-affinity enforced). It consumes from the Kafka topic `tradeora.recommendations.generated.v1` (Avro schema registered in Karapace — see ADR-044) and schedules a future BullMQ job in Valkey (see ADR-048) for evaluation at horizon time.

```python
# Domain constants — horizon in trading days per recommendation type
GROUND_TRUTH_HORIZON: dict[str, int] = {
    "EQUITY_DIRECTION": 5,
    "SECTOR_ROTATION":  10,
    "MACRO_SIGNAL":     21,
    "RISK_ALERT":       3,
}

async def on_recommendation_generated(event: RecommendationGeneratedEvent) -> None:
    """
    Entry point for the RecommendationGenerated Kafka consumer.
    Schedules a ground truth check at T+horizon trading days.
    All price values use Decimal (Article 17 compliance).
    """
    horizon_days = GROUND_TRUTH_HORIZON.get(event.recommendation_type, 5)
    scheduled_at = event.generated_at + timedelta(days=horizon_days)

    await scheduler.schedule(
        job_id=f'gt_{event.recommendation_id}',
        run_at=scheduled_at,
        payload=GroundTruthCheckPayload(
            recommendation_id=event.recommendation_id,
            symbol=event.symbol,
            predicted_direction=event.direction,
            # Article 17: prices MUST be Decimal, never float
            predicted_price=Decimal(str(event.target_price)),
            entry_price=Decimal(str(event.entry_price))
        )
    )
    logger.info(
        "Ground truth check scheduled",
        recommendation_id=event.recommendation_id,
        run_at=scheduled_at.isoformat(),
        horizon_days=horizon_days,
    )
```

The `scheduler` is backed by BullMQ (job `JOB-GT-001`) with Valkey as the queue store. The `run_at` precision is to-the-second. Idempotency is guaranteed by the `job_id` field — duplicate events will not double-schedule.

### Data Retention

Ground truth records — including `GroundTruthCheckPayload`, the raw market outcome snapshot, and the computed directional accuracy label — are stored as events in **EventStoreDB** on the stream `$tradeora-ground-truth-{symbol}`. EventStoreDB operates in **WORM (Write-Once, Read-Many)** mode for these streams (append-only projections, no soft-deletes).

**Retention period: minimum 7 years**, in alignment with Article 18 (WORM/Append-Only) and applicable financial record-keeping regulations. The retention policy is enforced at the EventStoreDB cluster level via a server-side policy, not at the application level.

After 7 years, records are archived to cold Blob storage (S3-compatible) with a cryptographic proof of transfer before deletion from EventStoreDB.

### Privacy

No Personally Identifiable Information (PII) is stored in ground truth records. Specifically:

- **User signals** (e.g., whether a user acted on a recommendation) are included only in anonymized form. The `userId` is replaced by `HMAC-SHA256(userId, GROUND_TRUTH_SALT)` where `GROUND_TRUTH_SALT` is a secret managed in OpenBao, rotated quarterly.
- **Portfolio identifiers** are replaced by the corresponding `portfolioId` UUID, which has no direct mapping to an individual stored within the ground truth store.
- Ground truth records are safe to use in model training pipelines without additional anonymization steps, provided the above constraints are maintained.

---

## ADR-043: Capability-Based AI Performance SLAs

**Date:** 2026-07-24
**Status:** ACCEPTED
**Authors:** Chief Enterprise Architect
**Resolves:** ISSUE-006

### Context and Problem Statement
The original system specification mandated a flat 800ms latency Service Level Objective (SLO) for all AI operations. This uniform constraint is technically impossible for tasks that require deep reasoning, chain-of-thought processing, or complex multi-agent orchestration. Forcing deep-thinking models into sub-second SLAs results in severe degradation of output quality and hallucinations. We need a nuanced performance framework that aligns latency expectations with the cognitive complexity of the task.

### Decision Drivers
- Necessity to balance speed with intelligence.
- Requirement to provide realistic targets for infrastructure provisioning.
- Need to design appropriate UI/UX for different response times (e.g., streaming vs blocking).

### Considered Options
1. **Option A: Increase Global SLA to 5000ms**
   *Cons:* Unacceptable for real-time validation tasks; degrades user experience for simple queries.
2. **Option B: Abandon Hard SLAs**
   *Cons:* Leads to unpredictable performance and cascading timeouts across the system.
3. **Option C: Capability-Based 4-Tier Framework**
   Categorize tasks and assign specific SLAs to each category.

### Decision Outcome
Chosen option: **Option C: Capability-Based 4-Tier Framework**.
We establish the following tiers:
1. **Synchronous Realtime (<200ms):** Simple classification, intent routing, format validation.
2. **Synchronous Extended (<2000ms):** Standard RAG queries, simple summaries. Requires UI loading indicators.
3. **Background Precomputed (Retrieval <100ms, Generation N/A):** Complex nightly batch analysis. The user only queries the pre-computed result.
4. **Async Learning (No hard latency bound):** Model training, deep research tasks. Delivered via WebSockets/Notifications.

**Positive Consequences:**
- Allows engineers to select appropriate model sizes and infrastructure per task.
- Greatly improves the quality of deep-reasoning outputs.
- Provides clear guidelines for frontend UX design.

**Negative Consequences (Tradeoffs Accepted):**
- Increases the complexity of system monitoring and alerting.
- Requires strict categorization of every AI endpoint.

### Alternatives Not Chosen
Modifying the global SLA or removing it entirely were rejected as they either penalize fast tasks or introduce systemic instability.

### Compliance Check
- Article 29 (OSS-first): ✅
- Article 17 (Decimal arithmetic): ✅
- Article 3 (Extension over modification): ✅
- Article 6 (Advisory-only AI): ✅

### SLA Enforcement Contract

The following TypeScript constant is the single source of truth for SLA tier parameters. It is exported from the shared `@tradeora/sla-contracts` package and consumed by both the API Gateway (for timeout enforcement) and the monitoring stack (for alert thresholds). **This object MUST NOT be modified without a new ADR.**

```typescript
export const SLA_TIERS = {
  TIER_1_REALTIME: {
    p99Ms: 1500,
    maxMs: 2000,
    fallback: 'RETURN_CACHED',
    description: 'Classification, intent routing, validation',
  },
  TIER_2_EXTENDED: {
    p99Ms: 3000,
    maxMs: 5000,
    fallback: 'RETURN_PARTIAL',
    description: 'RAG queries, standard summaries',
  },
  TIER_3_BACKGROUND: {
    cacheMaxAgeMs: 4 * 60 * 60 * 1000, // 4 hours
    retrievalMs: 50,
    fallback: 'EXTEND_CACHE',
    description: 'Pre-computed batch analysis results',
  },
  TIER_4_ASYNC: {
    maxJobDurationMs: 4 * 60 * 60 * 1000, // 4 hours
    fallback: 'RESCHEDULE',
    description: 'Model training, deep research jobs',
  },
} as const;

export type SLATier = keyof typeof SLA_TIERS;
```

The API Gateway enforces `maxMs` as a hard circuit-breaker timeout. If the upstream AI Engine does not respond within `maxMs`, the gateway invokes the `fallback` strategy and records a `sla_breach_total` Prometheus counter increment with labels `{tier, engine_id, fallback_strategy}`.

### SLA Breach Protocol

When a production SLA breach is detected (p99 > `p99Ms` for a sustained 5-minute window on any tier), the following response protocol is mandatory:

1. **Automatic (T+0s):** The API Gateway activates the tier's `fallback` strategy. `RETURN_CACHED` serves the last valid Valkey cache entry. `RETURN_PARTIAL` streams available tokens and appends a `[PARTIAL]` sentinel. `EXTEND_CACHE` increases the Tier-3 cache TTL by 2 hours. `RESCHEDULE` re-enqueues the BullMQ job with a 30-minute delay.
2. **PagerDuty Alert (T+0s):** Alertmanager fires a P2 (Tier 2/3/4) or P1 (Tier 1) incident to the on-call engineering rotation.
3. **Incident Commander (T+5min):** On-call engineer opens a war room channel in Slack (`#incidents-sla`) and posts the Grafana panel link for the breaching engine.
4. **Diagnosis (T+15min):** The engineer checks Flux reconciliation status (`flux get kustomizations`), LLM Gateway logs, and the Karapace consumer lag dashboard to isolate the cause.
5. **Mitigation (T+30min target):** Apply remediation — scale up inference replicas (`kubectl scale`), promote a Flux image update, or activate the provider fallback in the LLM Gateway config.
6. **Post-Incident Review (T+72h):** A blameless PIR document is filed in `docs/incident-reviews/` and reviewed in the next architecture sync.

### Quarterly SLA Review

SLA parameters in `SLA_TIERS` are reviewed on the first Thursday of each quarter (Q1: January, Q2: April, Q3: July, Q4: October) following this minimum process:

1. The SRE lead pulls the 90-day p99 latency histogram for each tier from Prometheus.
2. If the observed p99 exceeds the defined `p99Ms` threshold for more than 1% of the measurement window, a Tier upgrade review is triggered.
3. Any proposed change to `SLA_TIERS` MUST be accompanied by a new ADR amending this record.
4. Changes take effect on the first deployment after the new ADR is merged to `main`.

---

## ADR-044: Karapace Event Schema Registry

**Date:** 2026-07-24
**Status:** ACCEPTED
**Authors:** Chief Enterprise Architect
**Resolves:** ISSUE-003

### Context and Problem Statement
Our event-driven architecture relies on Kafka to distribute over 270 distinct event types across multiple Bounded Contexts. Currently, these events are serialized as raw JSON strings without any centralized schema validation. This creates a severe risk of "poison pills" — where a producer alters an event structure, causing downstream consumers to silently fail or corrupt local state. We need a robust mechanism to enforce schema evolution and backward compatibility at runtime.

### Decision Drivers
- Strict requirement for data integrity across microservice boundaries.
- Need for CI/CD integration to prevent breaking schema changes from reaching production.
- Desire to optimize network payload size (e.g., via Avro or Protobuf).

### Considered Options
1. **Option A: Confluent Schema Registry**
   *Cons:* Licensing restrictions (Confluent Community License) conflict with our strict OSS-first mandates for core infrastructure.
2. **Option B: Custom JSON Schema Validator**
   *Cons:* High maintenance burden; reinventing the wheel; doesn't help with binary serialization.
3. **Option C: Karapace (Aiven)**
   An open-source (Apache 2.0) drop-in replacement for Confluent Schema Registry.

### Decision Outcome
Chosen option: **Option C: Karapace**.
We will deploy Karapace as our centralized schema registry. All Kafka producers and consumers must integrate with Karapace to serialize/deserialize payloads using Avro. The registry will be configured with a strict `BACKWARD_TRANSITIVE` compatibility policy, ensuring that no schema change can break existing consumers.

**Positive Consequences:**
- Guarantees runtime data contracts between decoupled services.
- Reduces network bandwidth via efficient binary serialization (Avro).
- Fully complies with open-source mandates (Apache 2.0).

**Negative Consequences (Tradeoffs Accepted):**
- Adds infrastructure overhead and a new critical dependency to the data plane.
- Increases developer friction slightly due to mandatory schema registration.

### Alternatives Not Chosen
Confluent was rejected due to licensing. Custom solutions were rejected due to maintenance overhead.

### Compliance Check
- Article 29 (OSS-first): ✅ (Karapace is Apache 2.0)
- Article 17 (Decimal arithmetic): ✅ (Avro schemas will strictly define decimals)
- Article 3 (Extension over modification): ✅
- Article 6 (Advisory-only AI): ✅

### Schema Registration Workflow (CI/CD Integration)

Schema changes are validated **before merge** as a required CI check in the GitHub Actions pipeline. No schema may be deployed without passing both steps below.

```bash
# Step 1: Register the new schema version (in CI — pre-merge check)
# This will fail if the schema is not BACKWARD_TRANSITIVE compatible.
curl -X POST \
  http://karapace:8081/subjects/tradeora.portfolio.events.v1-value/versions \
  -H 'Content-Type: application/vnd.schemaregistry.v1+json' \
  -d @schemas/portfolio-events-v1.avsc

# Step 2: Explicit compatibility check before promoting to next version
# Returns {"is_compatible": true} or fails the CI pipeline.
curl -X POST \
  http://karapace:8081/compatibility/subjects/tradeora.portfolio.events.v1-value/versions/latest \
  -H 'Content-Type: application/vnd.schemaregistry.v1+json' \
  -d @schemas/portfolio-events-v2.avsc
```

Both commands are wrapped in the `scripts/schema-check.sh` helper. The CI job `schema-compat-check` MUST pass before the PR merge button is enabled. Any `{"is_compatible": false}` response is a hard blocker.

### Producer and Consumer Integration (TypeScript)

All TypeScript services use the `@kafkajs/confluent-schema-registry` library (compatible with Karapace's Confluent-compatible API endpoint). The registry client is a singleton instantiated once at service startup.

```typescript
import { SchemaRegistry, SchemaType } from '@kafkajs/confluent-schema-registry';
import { Kafka } from 'kafkajs';

// Singleton — initialize once at application bootstrap
const registry = new SchemaRegistry({
  host: process.env.KARAPACE_URL ?? 'http://karapace:8081',
});

// --- PRODUCER ---
const schemaId = await registry.getLatestSchemaId(
  'tradeora.portfolio.events.v1-value'
);

async function publishPortfolioEvent(event: PortfolioEvent): Promise<void> {
  const encodedValue = await registry.encode(schemaId, event);
  await producer.send({
    topic: 'tradeora.portfolio.events.v1',
    messages: [{ value: encodedValue }],
  });
}

// --- CONSUMER ---
async function consumePortfolioEvents(): Promise<void> {
  await consumer.subscribe({ topic: 'tradeora.portfolio.events.v1' });
  await consumer.run({
    eachMessage: async ({ message }) => {
      const decoded = await registry.decode(message.value!);
      await handlePortfolioEvent(decoded as PortfolioEvent);
    },
  });
}
```

### Schema Evolution Example: BACKWARD_TRANSITIVE v1 to v2

The following Avro schema pair illustrates a **compliant** v1-to-v2 migration. The only change in v2 is adding the `currency` field with a default value of `"SAR"`. Adding a field with a default is the canonical BACKWARD_TRANSITIVE-safe evolution.

**v1 Schema (`portfolio-events-v1.avsc`):**

```json
{
  "type": "record",
  "name": "PortfolioEvent",
  "namespace": "tradeora.portfolio",
  "fields": [
    { "name": "portfolioId", "type": "string" },
    { "name": "symbol",      "type": "string" },
    { "name": "quantity",    "type": "int"    }
  ]
}
```

**v2 Schema (`portfolio-events-v2.avsc`):**

```json
{
  "type": "record",
  "name": "PortfolioEvent",
  "namespace": "tradeora.portfolio",
  "fields": [
    { "name": "portfolioId", "type": "string" },
    { "name": "symbol",      "type": "string" },
    { "name": "quantity",    "type": "int"    },
    {
      "name": "currency",
      "type": "string",
      "default": "SAR",
      "doc": "ISO 4217 currency code. Added in v2 — default ensures backward compatibility."
    }
  ]
}
```

**Why this is safe:** A consumer running the v1 schema reading a v2 message will see the `currency` field and use the Avro default (`"SAR"`). A consumer running v2 reading an old v1 message will also receive `"SAR"` as the default. No consumer restart is required.

**Prohibited v1-to-v2 changes (will fail `is_compatible` check):**
- Removing or renaming an existing field.
- Changing a field's type (e.g., `int` to `long`).
- Adding a new field **without** a `"default"` value.

---

## ADR-045: FluxCD v2 as Official GitOps Tool

**Date:** 2026-07-24
**Status:** ACCEPTED
**Authors:** Chief Enterprise Architect
**Resolves:** ISSUE-005

### Context and Problem Statement
The architectural documentation was in an inconsistent state, referencing both ArgoCD and FluxCD as the primary GitOps continuous deployment tool. This ambiguity causes confusion in the DevOps team and risks fragmenting our deployment pipelines. We must authoritatively select a single GitOps controller to manage the Kubernetes cluster state across our multi-region Phase 2 rollout.

### Decision Drivers
- Need for a single source of truth for GitOps.
- Requirement for lightweight, highly secure cluster reconciliation.
- Support for complex Kustomize overlays and Helm releases.
- Native Kubernetes integration.

### Considered Options
1. **Option A: Standardize on ArgoCD**
   *Cons:* Heavier resource footprint; includes a UI which we prefer to abstract away in favor of terminal-first workflows.
2. **Option B: Standardize on FluxCD v2**
   *Cons:* Steeper learning curve for pure CLI interactions; less visual debugging.

### Decision Outcome
Chosen option: **Option B: Standardize on FluxCD v2**.
FluxCD v2 is hereby declared the official and exclusive GitOps tool for the Tradeora Financial Operating System. Its controller-based architecture aligns perfectly with our Kubernetes-native philosophy. It handles multi-tenancy and complex dependency graphs between infrastructure and applications more cleanly through its Kustomization CRDs. All ArgoCD references are deprecated.

**Positive Consequences:**
- Eliminates documentation ambiguity.
- Provides a highly secure, declarative deployment pipeline.
- Reduces resource overhead on the management clusters compared to ArgoCD.

**Negative Consequences (Tradeoffs Accepted):**
- Requires the DevOps team to standardize entirely on Flux CLI and CRD debugging rather than relying on a graphical dashboard.

### Alternatives Not Chosen
ArgoCD was rejected in favor of FluxCD's tighter native Kubernetes controller model and smaller attack surface.

### Compliance Check
- Article 29 (OSS-first): ✅
- Article 17 (Decimal arithmetic): ✅ (N/A)
- Article 3 (Extension over modification): ✅
- Article 6 (Advisory-only AI): ✅

### FluxCD Monitoring via Prometheus

FluxCD exposes metrics natively from each controller. The following `ServiceMonitor` resources MUST be deployed alongside Flux. All metrics are scraped from the `flux-system` namespace.

**Key metrics to alert on:**

| Metric | Description | Alert Condition |
|---|---|---|
| `gotk_reconcile_duration_seconds` | Time for Kustomization/HelmRelease reconciliation | p99 > 60s triggers P3 alert |
| `gotk_reconcile_condition{type="Ready",status="False"}` | Reconciliation failure flag | Any occurrence triggers P2 alert |
| `controller_runtime_reconcile_errors_total` | Source controller fetch errors | > 3 in 5 min triggers P2 alert |
| `gotk_suspend_status` | Manually suspended resources | Any `{suspended="true"}` triggers Slack notify only |

A pre-built Grafana dashboard for these metrics is maintained at `monitoring/dashboards/fluxcd-overview.json` and reconciled via a `ConfigMap` managed by FluxCD itself (meta-reconciliation). The dashboard MUST include panels for reconcile duration histograms, error rate sparklines, and a table of all currently suspended Kustomizations.

### Emergency Override Procedure (Security Patch During EGX Hours)

This procedure bypasses the standard GitOps gate. It MUST only be invoked for critical security patches (CVSS score >= 9.0) discovered during EGX market hours (09:00–15:00 AST, Sunday–Thursday) when the standard PR review cycle cannot complete in time.

**Authorization:** Requires explicit approval from the on-call Incident Commander AND the CTO on-call. Both must confirm in writing in the `#incidents-critical` Slack channel before step 3 is executed.

```bash
# Step 1: Suspend the affected Kustomization to prevent Flux from reverting your change.
flux suspend kustomization <kustomization-name> -n flux-system

# Step 2: Apply the critical patch directly to the cluster.
kubectl apply -f path/to/critical-security-patch.yaml

# Step 3: Verify the patch is healthy before proceeding.
kubectl rollout status deployment/<deployment-name> -n <namespace>

# Step 4: Immediately commit the patch to the GitOps repository and open a PR.
git add path/to/critical-security-patch.yaml
git commit -m "SECURITY: Emergency patch CVSS-XXXX applied during EGX hours [bypass]"
git push origin emergency/cvss-xxxx

# Step 5: Resume Flux reconciliation after the PR is merged (within 2 hours maximum).
flux resume kustomization <kustomization-name> -n flux-system

# Step 6: Confirm Flux has reconciled to the committed state.
flux get kustomizations -n flux-system
```

The `[bypass]` marker in the commit message triggers an automated Jira ticket creation via the CI webhook, ensuring every override is tracked in the audit system with a full approval trail.

### Key Flux CLI Commands for Daily DevOps Operations

The following commands form the mandatory vocabulary for DevOps engineers operating the Tradeora cluster. All engineers MUST be proficient in these before being added to the on-call rotation.

```bash
# View the reconciliation status of all Kustomizations
flux get kustomizations --all-namespaces

# View the status of all HelmReleases
flux get helmreleases --all-namespaces

# Force an immediate reconciliation (without waiting for the poll interval)
flux reconcile kustomization <name> --with-source -n flux-system

# Watch the live logs of the Flux kustomize-controller
flux logs --kind=Kustomization --name=<name> --follow -n flux-system

# Check for any image update automation pending
flux get images all -n flux-system

# Trigger a manual image policy update check
flux reconcile image repository <image-repo-name> -n flux-system

# Export the full diff of what Flux would apply (dry-run)
flux diff kustomization <name> --path ./clusters/production -n flux-system

# List all Flux events for a specific resource (useful for debugging failed reconciliations)
kubectl describe kustomization <name> -n flux-system
```

---

## ADR-046: PostgreSQL Outbox Pattern as Sole Kafka Delivery Path

**Date:** 2026-07-24
**Status:** ACCEPTED
**Authors:** Chief Enterprise Architect
**Resolves:** ISSUE-008

### Context and Problem Statement

The system evolved with two competing patterns for delivering domain events to Kafka:

1. **Direct Publish-on-Commit:** The application service directly calls `kafka.produce()` inside the same business transaction (or immediately after), relying on the developer to handle failure cases correctly.
2. **PostgreSQL Outbox Pattern:** Domain events are first written to an `outbox` table in the same PostgreSQL transaction as the business data mutation. A separate poller (BullMQ job `JOB-001`) reads the outbox and publishes to Kafka, marking events as processed atomically.

This dual-path architecture introduced a class of critical consistency bugs. If a direct publish succeeded but the enclosing database transaction subsequently rolled back (due to a validation error, a constraint violation, or a network partition), an event describing a non-existent state change would already be in Kafka. Downstream consumers would then act on phantom data, corrupting portfolio state and potentially generating invalid advisory signals in violation of Article 6.

### Decision Drivers
- Requirement for guaranteed at-least-once delivery semantics at the domain boundary with idempotent consumers.
- Prohibition of phantom events that describe uncommitted state changes.
- Article 18 (WORM/Append-Only): events must only reflect committed reality.
- Article 3 (Extension over Modification): solution must not require modifying existing domain logic, only the delivery layer.
- PDPL 2020 audit trail requirements: every event in the system must be traceable to a committed transaction.

### Considered Options
1. **Option A: Maintain Dual-Path with Developer Discipline**
   *Cons:* Relies on convention, not enforcement. Code review cannot reliably catch all async failure modes. This approach already caused production incidents.
2. **Option B: Kafka Transactions (Exactly-Once Semantics)**
   *Cons:* Requires coordinating PostgreSQL and Kafka transactions across a distributed boundary, which is not natively supported without a complex 2PC-like protocol. Dramatically increases operational complexity and introduces Kafka as a dependency inside the database transaction boundary.
3. **Option C: PostgreSQL Outbox Pattern as Sole Path (Enforced Mandate)**
   Prohibit all direct Kafka publishing. Enforce the Outbox pattern exclusively via static analysis linting rules and architecture fitness functions in CI.

### Decision Outcome
Chosen option: **Option C: PostgreSQL Outbox Pattern (Sole Delivery Path)**.

The PostgreSQL Outbox Pattern via BullMQ job `JOB-001` is hereby mandated as the **only** permitted path for delivering domain events to Kafka within the Tradeora Financial Operating System. **Direct Kafka publishing from application code is strictly prohibited and constitutes an architectural violation.**

The canonical outbox table schema is:

```sql
CREATE TABLE domain_event_outbox (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type  TEXT        NOT NULL,
    -- ^ e.g., 'Portfolio', 'Recommendation', 'GroundTruth'
    aggregate_id    TEXT        NOT NULL,
    event_type      TEXT        NOT NULL,
    -- ^ Fully qualified: 'tradeora.portfolio.PositionOpened.v1'
    payload         JSONB       NOT NULL,
    kafka_topic     TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at    TIMESTAMPTZ,
    -- ^ NULL until successfully published to Kafka
    retry_count     INT         NOT NULL DEFAULT 0
);

-- Partial index for efficient polling of unpublished events only
CREATE INDEX idx_outbox_unpublished
    ON domain_event_outbox (created_at ASC)
    WHERE published_at IS NULL;
```

The domain service writes to `domain_event_outbox` in the same transaction as its business mutation. `JOB-001` polls at a configurable interval (default poll interval achieves P99 delivery latency of ~100ms) and publishes pending events via the authenticated Kafka producer. On successful publish, `published_at` is set atomically using an `UPDATE ... WHERE published_at IS NULL` guard to prevent double-publishing during concurrent poll cycles.

**Enforcement Mechanism:** An ESLint/TypeScript rule `no-direct-kafka-publish` is added to `@tradeora/eslint-config`. It detects any direct call to `kafka.producer().send()` or `producer.send()` outside of the designated `outbox-publisher` package and fails the build with a descriptive error message linking to this ADR. This rule is enabled as an `error` (not `warn`) and cannot be suppressed with inline comments.

**Positive Consequences:**
- Guaranteed at-least-once delivery with no phantom events. Events only flow after the enclosing transaction commits successfully.
- Eliminates an entire class of distributed system consistency bugs related to the dual-path architecture.
- Provides a natural audit trail of all domain events in the relational database, queryable via SQL.
- Simplifies consumer logic — consumers can trust that every Kafka event reflects committed state.

**Negative Consequences (Tradeoffs Accepted):**
- Slight delivery latency increase: P99 approximately 100ms for the outbox poll interval. This is acceptable per ADR-043 Tier-2 and Tier-3 SLA thresholds.
- Adds a new `domain_event_outbox` table to every service database schema that produces events.
- The outbox poller (`JOB-001`) is a new operational concern requiring dedicated monitoring.

### Monitoring

| Metric | Type | Alert Threshold |
|---|---|---|
| `outbox_pending_events_count` | Gauge | > 500 pending for more than 2 minutes triggers P2 |
| `outbox_publish_latency_ms` | Histogram | p99 > 500ms triggers P3 |
| `outbox_retry_count_total` | Counter | Any event with `retry_count > 5` triggers P2 |
| `outbox_poller_last_run_seconds` | Gauge | > 30s since last successful run triggers P1 |

### Compliance Check
- Article 18 (WORM/Append-Only): ✅ Events only flow from committed state; `published_at` is set, never cleared.
- Article 3 (Extension over Modification): ✅ Delivery layer changed; domain logic is untouched.
- Article 29 (OSS-first): ✅ PostgreSQL, BullMQ, Valkey — all Apache 2.0 or MIT licensed.
- Article 17 (Decimal arithmetic): ✅ JSONB payload stores prices as strings; Decimal conversion enforced at the application boundary.
- Article 6 (Advisory-only AI): ✅ Eliminates phantom advisory events from uncommitted state.

---

## ADR-047: Kubernetes ServiceAccount JWT for Inter-Service Authentication (Phase 1)

**Date:** 2026-07-24
**Status:** ACCEPTED
**Authors:** Chief Enterprise Architect
**Resolves:** ISSUE-009

### Context and Problem Statement

Services communicating within the Kubernetes cluster require a lightweight, cryptographically verifiable authentication mechanism that confirms a request arriving at Service B genuinely originates from an authorized Service A — not from an unauthorized pod, a misconfigured service, or an external actor that has breached the network perimeter.

This is a Phase 1 requirement. Full service-mesh mTLS via Linkerd is planned for Phase 2 but is out of scope for the current engineering sprint.

Three options were formally evaluated:

1. **Shared Secret Headers:** Each service is pre-configured with a shared secret and presents it in an `X-Internal-Token` header.
2. **API Gateway Mutual Auth:** All inter-service calls are routed through the central API Gateway, which performs authentication and forwards the request.
3. **Kubernetes ServiceAccount Projected Tokens:** Each pod is assigned a unique Kubernetes `ServiceAccount`. The Kubernetes API Server acts as an OIDC provider, issuing short-lived, cryptographically signed JWTs bound to the `ServiceAccount` identity.

### Decision Drivers
- Zero additional infrastructure overhead in Phase 1 (no new services to deploy).
- Cryptographically verifiable caller identity. Shared secrets are symmetric and un-attributable; any holder of the secret can impersonate any service.
- Native integration with Kubernetes RBAC, enabling future fine-grained authorization policy.
- Short-lived tokens (1 hour TTL) minimize the blast radius of a credential compromise.
- Full auditability — every inter-service call is attributable to a specific, named `ServiceAccount` in the Kubernetes audit log.

### Considered Options Evaluation

| Criterion | Shared Secrets | API Gateway Auth | ServiceAccount JWT |
|---|---|---|---|
| Cryptographic verifiability | No | Partial | Yes (RS256, OIDC) |
| Zero new infrastructure | Yes | No (requires gateway routing) | Yes |
| Short-lived credential | No | Depends | Yes (1-hour TTL) |
| Kubernetes-native | No | No | Yes |
| Phase 2 migration path | Disruptive | Disruptive | Non-breaking |

### Decision Outcome
Chosen option: **Kubernetes ServiceAccount Projected Tokens**.

All inter-service HTTP calls within the Tradeora Kubernetes cluster MUST present the calling service's Kubernetes ServiceAccount JWT in the `Authorization: Bearer <token>` header. The receiving service validates the token against the Kubernetes OIDC discovery endpoint.

**Pod Token Volume Configuration:**

```yaml
# Kubernetes Pod spec — serviceAccountToken volume projection
volumes:
  - name: kube-api-access
    projected:
      sources:
        - serviceAccountToken:
            audience: "https://kubernetes.default.svc"
            expirationSeconds: 3600   # 1-hour TTL; rotated automatically by kubelet
            path: token
```

**Validation Logic (TypeScript — Receiving Service):**

```typescript
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS_URI = `${process.env.KUBERNETES_API_SERVER}/openid/v1/jwks`;
const JWKS = createRemoteJWKSet(new URL(JWKS_URI), {
  cacheMaxAge: 5 * 60 * 1000, // 5-minute JWKS cache — mandatory
});

async function validateServiceAccountToken(
  authHeader: string
): Promise<ServiceIdentity> {
  const token = authHeader.replace('Bearer ', '');
  const { payload } = await jwtVerify(token, JWKS, {
    audience: 'https://kubernetes.default.svc',
    issuer: process.env.KUBERNETES_OIDC_ISSUER,
  });

  return {
    serviceAccountName: payload[
      'kubernetes.io/serviceaccount/service-account.name'
    ] as string,
    namespace: payload[
      'kubernetes.io/serviceaccount/namespace'
    ] as string,
  };
}
```

**ServiceAccount Naming Convention:** Every Tradeora microservice MUST have a dedicated `ServiceAccount` named `tradeora-{service-slug}` in its namespace (e.g., `tradeora-recommendation-engine`, `tradeora-portfolio-service`). Use of the Kubernetes `default` service account for any inter-service call is prohibited and will be rejected by the receiving service's validation middleware.

**Phase 2 Migration Path:** When Linkerd is introduced in Phase 2, the ServiceAccount JWT validation middleware in each service will be replaced by Linkerd's mTLS policy (`Server` + `AuthorizationPolicy` CRDs). The `ServiceAccount` identity established in Phase 1 maps directly to Linkerd's workload identity model, making the migration non-breaking from the perspective of calling services — only the receiving service's middleware changes.

**Positive Consequences:**
- Zero additional infrastructure required — this is a native Kubernetes feature available in all conformant distributions.
- Short-lived tokens (1-hour TTL) limit the blast radius of any token compromise to at most one hour.
- Every inter-service call is attributable to a specific named `ServiceAccount` and appears in the Kubernetes API server audit log.
- Smooth, non-breaking migration path to full mTLS in Phase 2 without any changes in calling services.

**Negative Consequences (Tradeoffs Accepted):**
- Token rotation is automatic but requires that receiving services cache the JWKS public keys to avoid latency spikes on cache miss. The 5-minute JWKS cache TTL shown in the code above is mandatory.
- Does not encrypt in-transit payload data in Phase 1 (mTLS provides encryption; plain TLS provides confidentiality). Encryption is supplemented by Kubernetes `NetworkPolicy` resources restricting inter-namespace traffic to authorized service pairs only.

### Compliance Check
- Article 29 (OSS-first): ✅ Native Kubernetes feature; no proprietary components.
- Article 3 (Extension over Modification): ✅ Phase 2 Linkerd migration is purely additive.
- Article 17 (Decimal arithmetic): ✅ Not applicable.
- Article 6 (Advisory-only AI): ✅ Not applicable.

---

## ADR-048: Valkey 7.2.x as Redis Replacement

**Date:** 2026-07-24
**Status:** ACCEPTED
**Authors:** Chief Enterprise Architect
**Resolves:** ISSUE-022

### Context and Problem Statement

In March 2024, Redis Ltd. relicensed Redis from the permissive **BSD-3-Clause** license to the **Server Side Public License (SSPL)**. The SSPL is explicitly excluded from OSI (Open Source Initiative) approval because it requires that any entity offering Redis as a managed service must open-source the entirety of its managing infrastructure — a clause that is commercially and legally incompatible with Tradeora's **OSS-first mandate (Article 29)**.

Immediately following the Redis relicensing, the Linux Foundation established the **Valkey** project — a community-driven, **Apache 2.0**-licensed fork of Redis 7.2, backed by AWS, Google, Oracle, and Ericsson among others. Valkey 7.2 is fully wire-protocol, API, and data-structure compatible with Redis 7.2. All existing client libraries (`ioredis`, `redis-py`, `Jedis`, `BullMQ`) connect to Valkey without any code modifications, as they communicate via the Redis Serialization Protocol (RESP3), which Valkey implements identically.

### Decision Drivers
- Article 29 (OSS-first): SSPL is not an OSI-approved open source license. Continued use of SSPL-licensed Redis constitutes a compliance violation requiring immediate remediation.
- Drop-in protocol compatibility: the migration requires zero application code changes.
- Linux Foundation governance: ensures long-term sustainability, community ownership, and independence from any single vendor's commercial roadmap.
- Performance parity: Valkey 7.2 benchmarks are within 2% of Redis 7.2 on all standard workloads used by Tradeora (GET/SET, INCR, PUBLISH/SUBSCRIBE, LIST operations).
- All major client libraries are Valkey-compatible out of the box.

### Considered Options

1. **Option A: Remain on Redis 7.2 (Pre-SSPL snapshot)**
   *Cons:* No security patches or CVE fixes for the frozen BSD-licensed snapshot. Accumulates dangerous CVE debt. Technically compliant today but operationally unsustainable.
2. **Option B: Migrate to KeyDB**
   *Cons:* KeyDB was acquired by Snap Inc. and subsequently abandoned. No active community maintenance; considered end-of-life for OSS purposes.
3. **Option C: Migrate to Valkey 7.2.x (Apache 2.0)**
   Full wire-protocol compatibility, active LF community, no license concerns. **Selected.**
4. **Option D: Replace with Dragonfly DB**
   *Cons:* Dragonfly uses the Business Source License (BSL), which imposes production use restrictions after a time period — a class of concern similar to SSPL. Not compliant with Article 29.

### Decision Outcome
Chosen option: **Option C: Valkey 7.2.x (Apache 2.0)**.

**All caching layers, queue backends, and Pub/Sub channels within the Tradeora Financial Operating System exclusively use Valkey 7.2.x.** The affected subsystems are:

| Subsystem | Valkey Usage Pattern | TTL |
|---|---|---|
| Session Cache | `SET session:{userId} <jwt-payload> EX 3600` | 1 hour |
| Recommendation Cache | `SET rec:{portfolioId}:{symbol} <payload> EX 14400` | 4 hours (Tier-3 SLA) |
| Rate Limiting | `INCR rate:{tenantId}:{endpoint}` + sliding window `EXPIRE` | 60 seconds |
| WebSocket Notification Relay | `PUBLISH tradeora:notifications:{userId} <event>` | Ephemeral |
| BullMQ Job Queue (`JOB-001`, `JOB-GT-001`) | BullMQ uses Valkey as its backing store | Per-job TTL |
| LLM Gateway Request Deduplication | `SET dedup:{requestHash} 1 EX 5 NX` | 5 seconds |

**Naming Convention — Mandatory Enforcement:**

All documentation, configuration files, Helm chart values, environment variable names, Kubernetes Secret keys, and source code comments MUST use the terms `valkey` or `Valkey`. The term `Redis` is permitted **only** in two contexts:
1. Historical context (e.g., "Valkey is a fork of Redis 7.2 created in 2024").
2. Third-party client library names that have not yet been renamed (e.g., `ioredis`, `redis-py`).

References such as `REDIS_URL`, `REDIS_HOST`, and `REDIS_PORT` in environment variable definitions MUST be renamed to `VALKEY_URL`, `VALKEY_HOST`, and `VALKEY_PORT` respectively.

**Configuration Migration Example:**

```yaml
# Before (using Redis naming)
env:
  - name: REDIS_URL
    value: redis://redis-master.cache.svc.cluster.local:6379

# After (using Valkey naming — protocol prefix 'redis://' is retained)
env:
  - name: VALKEY_URL
    value: redis://valkey-master.cache.svc.cluster.local:6379
```

Note on the `redis://` URI scheme: This prefix is a protocol identifier for the Redis Serialization Protocol (RESP), not a product name. Client libraries use `redis://` to mean "connect using RESP". Valkey implements RESP3, so this prefix remains correct. It should NOT be changed to `valkey://` unless a specific client library explicitly introduces native Valkey URI scheme support.

**Helm Chart Migration:**

The Valkey community maintains an official Bitnami Helm chart (`bitnami/valkey`) that is a drop-in replacement for `bitnami/redis`. The chart values file requires only a name change at the chart reference level; all value keys remain identical.

```bash
# Replace the Redis chart reference
helm repo add bitnami https://charts.bitnami.com/bitnami
helm upgrade --install valkey bitnami/valkey \
  --namespace cache \
  --values helm/valkey/values.yaml
```

**Positive Consequences:**
- Full license compliance with Article 29 (Apache 2.0 — fully OSI-approved open source).
- Drop-in replacement at the protocol level: zero application code changes, zero client library changes.
- Access to ongoing security patches and new feature development from an active, Linux Foundation-governed community.
- Reduced single-vendor risk — no commercial entity controls the project's licensing or roadmap.

**Negative Consequences (Tradeoffs Accepted):**
- Valkey has a smaller ecosystem than Redis at this time. Some managed cloud service integrations require explicit Valkey cluster selection rather than a Redis default.
- OSS tooling for Valkey-specific diagnostics (e.g., a Valkey Insight equivalent) is still maturing. The team will use `valkey-cli` and Prometheus metrics as the primary operational interfaces in the interim.

### Compliance Check
- Article 29 (OSS-first): ✅ Valkey is Apache 2.0 — fully OSI-compliant.
- Article 18 (WORM/Append-Only): ✅ Valkey is used for ephemeral caching and queuing, not for WORM audit storage.
- Article 3 (Extension over Modification): ✅ Migration is purely additive at the infrastructure layer.
- Article 17 (Decimal arithmetic): ✅ Prices stored as strings in Valkey; Decimal conversion enforced at the application boundary.
- Article 6 (Advisory-only AI): ✅ Not applicable.

---

## Document Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0.0 | 2026-07-24 | Chief Enterprise Architect | Initial ADR-041 through ADR-045 |
| 1.1.0 | 2026-07-24 | Chief Enterprise Architect | Added Implementation Notes, Monitoring, Security, and SLA Enforcement sections to ADR-041 through ADR-045; added ADR-046 (Outbox Pattern), ADR-047 (ServiceAccount JWT), ADR-048 (Valkey) |

---
**End of Document — ARCHITECTURE_DECISION_RECORDS v1.1.0**
