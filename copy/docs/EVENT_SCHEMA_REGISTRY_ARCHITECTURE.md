# Tradeora Financial Operating System
## Enterprise Event Schema Registry Architecture
## Version 1.0.0 | Status: AUTHORITATIVE | Date: 2026-07-24

╔══════════════════════════════════════════════════════════════════════════════╗
║  Resolves: ISSUE-003 (Schema Registry absent from infrastructure)            ║
║  Owner: Chief Platform Architect                                             ║
║  ADR Reference: ADR-044 (Event Schema Registry)                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

## Section 1 — Architecture Mandate

In the Tradeora Financial Operating System, the event-driven architecture is paramount for ensuring low-latency communication, decoupled microservices, and reliable asynchronous processing. To maintain data integrity and system stability across all 49 Bounded Contexts (BCs), strict schema governance is mandatory. 

No event may exist in Tradeora without meeting the following criteria:
1. **A registered schema in Karapace**: Every event type MUST have a corresponding schema definition registered in the central Karapace Schema Registry. Anonymous or loosely typed JSON payloads are strictly prohibited.
2. **A version number**: Every schema MUST follow semantic versioning. The version must be explicitly defined in the subject name and payload.
3. **An owner (producing BC)**: Every schema MUST be owned by exactly one producing Bounded Context. The owner is responsible for the schema lifecycle, evolution, and backward compatibility. Consumers may only read schemas, never define them for a producer.
4. **A compatibility rule**: All schemas MUST enforce `BACKWARD_TRANSITIVE` compatibility to ensure consumer resilience. Breaking changes are only allowed through formalized migration patterns.
5. **A deprecation strategy**: Schemas cannot be abruptly deleted. They MUST follow a formalized 90-day deprecation lifecycle to allow consumers to migrate gracefully.

These mandates are enforced via CI/CD pipelines, runtime validation, and automated infrastructure policies. Any violation will result in blocked deployments or runtime rejections.

---

## Section 2 — Karapace Architecture

Tradeora has selected Karapace (v3.x), the open-source alternative to the Confluent Schema Registry, to govern event schemas. Karapace provides a fully compatible REST API for schema registration, versioning, and compatibility checking, backed by Kafka as its underlying storage mechanism. This ensures high availability, durability, and seamless integration with our existing Kafka infrastructure.

### 2.1 Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TRADEORA EVENT SCHEMA REGISTRY                        │
│                       (Karapace v3.x — Open Source)                         │
│                                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────────────────────┐  │
│  │   Schema API   │  │   Compat API   │  │        Schema Subjects        │  │
│  │   (Port: 8081) │  │  (BACKWARD_    │  │     (1 per event type /       │  │
│  │                │  │   TRANSITIVE)  │  │      topic combination)       │  │
│  └───────┬────────┘  └───────┬────────┘  └──────────────┬────────────────┘  │
│          │                   │                          │                   │
│  ┌───────▼───────────────────▼──────────────────────────▼────────────────┐  │
│  │                Karapace internal validation and routing               │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │                   Karapace ZooKeeper / Kafka Backend                  │  │
│  │            (Stores schemas durably in a compact Kafka topic)          │  │
│  │                   Topic: _schemas (cleanup.policy=compact)            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
           ┌───────────────────────────┴───────────────────────────┐
           │                                                       │
           ▼                                                       ▼
┌───────────────────────┐                               ┌───────────────────────┐
│    Kafka Producers    │                               │    Kafka Consumers    │
│  (Producing BCs)      │                               │  (Consuming BCs)      │
│                       │                               │                       │
│ 1. Serialize payload  │                               │ 1. Receive payload    │
│ 2. Fetch schema       │                               │ 2. Read schema ID     │
│ 3. Validate locally   │                               │ 3. Fetch schema       │
│ 4. Publish to Kafka   │                               │ 4. Deserialize        │
└───────────────────────┘                               └───────────────────────┘
```

### 2.2 Kubernetes Deployment Specification

The following specification details the deployment configuration for Karapace within the Tradeora platform Kubernetes cluster. It emphasizes high availability, resource constraints, and integration with the primary Kafka cluster.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: karapace
  namespace: tradeora-platform
  labels:
    app.kubernetes.io/name: karapace
    app.kubernetes.io/component: schema-registry
    app.kubernetes.io/part-of: tradeora-platform
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  selector:
    matchLabels:
      app: karapace
  template:
    metadata:
      labels:
        app: karapace
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8081"
        prometheus.io/path: "/metrics"
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - karapace
              topologyKey: "kubernetes.io/hostname"
      containers:
      - name: karapace
        image: ghcr.io/aiven-open/karapace:3.x
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8081
          name: http-api
        env:
        - name: KARAPACE_BOOTSTRAP_URI
          value: "kafka-cluster-kafka-bootstrap.tradeora-platform.svc.cluster.local:9092"
        - name: KARAPACE_TOPIC_NAME
          value: "_schemas"
        - name: KARAPACE_COMPATIBILITY
          value: "BACKWARD_TRANSITIVE"
        - name: KARAPACE_LOG_LEVEL
          value: "INFO"
        - name: KARAPACE_METRICS_ENABLED
          value: "true"
        livenessProbe:
          httpGet:
            path: /
            port: 8081
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /
            port: 8081
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        resources:
          requests:
            cpu: "250m"
            memory: "512Mi"
          limits:
            cpu: "1000m"
            memory: "2Gi"
```

---

## Section 3 — Schema Compatibility Rules

To ensure a highly resilient distributed system, Tradeora strictly enforces schema compatibility rules. We have standardized on `BACKWARD_TRANSITIVE` as the global compatibility policy.

### 3.1 Definition of BACKWARD_TRANSITIVE

`BACKWARD_TRANSITIVE` ensures that consumers using the *latest* schema can read data written by *all previous* schemas registered under the same subject. 

**What BACKWARD means:**
- A new version of the schema is backward compatible with the previous version.
- Consumers can safely upgrade to the new schema before producers start publishing data with it.
- Safe for rolling consumer upgrades and resilient long-term storage consumption.

**What TRANSITIVE means:**
- The new schema is compatible not just with the immediate predecessor, but with *every* prior version of the schema that was ever registered. This guarantees that consumers reading historical data (e.g., event sourcing replay) will never break.

### 3.2 Compatibility Rule Enforcement

**What Breaks BACKWARD Compatibility (STRICTLY PROHIBITED):**
1. **Removing a required field:** If a producer stops sending a field that consumers expect, consumers will crash.
2. **Changing a field type:** Changing a field from `string` to `int`, or from `long` to `double`.
3. **Renaming a field:** The original field is effectively "removed" and a new one "added", breaking readers looking for the original field.
4. **Adding a required field without a default value:** Older producers will not include this field, causing new consumers to fail when reading old data.

**What is BACKWARD-SAFE (ALLOWED):**
1. **Adding an optional field (or a field with a default value):** When old data is read, the default value is used.
2. **Deleting an optional field:** Consumers already know how to handle its absence.
3. **Adding a new value to an `enum`:** Provided consumers are built with robust fallback logic for unknown enums. (Use with caution).
4. **Updating documentation (`doc` tags):** Safe and encouraged.

---

## Section 4 — Avro Schema Standard

Apache Avro is the designated serialization format for all Tradeora events. Avro provides rich data structures, a compact binary format, and robust support for schema evolution.

### 4.1 Tradeora Standard Envelope

Every standard Avro schema MUST adhere to the Tradeora Base Envelope. The envelope provides crucial metadata for routing, tracing, and auditing.

```json
{
  "namespace": "tradeora.{domain}.{bounded_context}",
  "type": "record",
  "name": "{EventName}",
  "doc": "Comprehensive description of this event, its trigger, and its business meaning.",
  "fields": [
    {
      "name": "eventId",
      "type": "string",
      "logicalType": "uuid",
      "doc": "Globally unique UUID v4 for the event instance."
    },
    {
      "name": "eventType",
      "type": "string",
      "doc": "Fully qualified event name, e.g., tradeora.portfolio.PortfolioCreated."
    },
    {
      "name": "eventVersion",
      "type": "string",
      "doc": "Semantic version of the schema, e.g., 1.0.0."
    },
    {
      "name": "occurredAt",
      "type": "string",
      "doc": "ISO 8601 UTC timestamp indicating exactly when the event occurred."
    },
    {
      "name": "tenantId",
      "type": "string",
      "doc": "Tenant identifier for multi-tenancy support."
    },
    {
      "name": "correlationId",
      "type": "string",
      "doc": "Request correlation ID for distributed tracing across microservices."
    },
    {
      "name": "causationId",
      "type": "string",
      "doc": "The ID of the event or command that caused this event to be emitted."
    },
    {
      "name": "producerBc",
      "type": "string",
      "doc": "The Bounded Context that owns and published this event."
    },
    {
      "name": "payload",
      "type": {
        "type": "record",
        "name": "Payload",
        "doc": "The business payload specific to this event type.",
        "fields": [
          // Business specific fields go here
        ]
      }
    }
  ]
}
```

### 4.2 Real Avro Schema Examples

Below are 5 concrete examples of key Tradeora events adhering to the standard envelope.

#### Example 1: `portfolio.Portfolio.PortfolioCreated.v1`
```json
{
  "namespace": "tradeora.portfolio.Portfolio",
  "type": "record",
  "name": "PortfolioCreated",
  "doc": "Emitted when a new investment portfolio is successfully provisioned for a user.",
  "fields": [
    {"name": "eventId", "type": "string", "doc": "UUID v4"},
    {"name": "eventType", "type": "string", "default": "tradeora.portfolio.PortfolioCreated"},
    {"name": "eventVersion", "type": "string", "default": "1.0.0"},
    {"name": "occurredAt", "type": "string"},
    {"name": "tenantId", "type": "string"},
    {"name": "correlationId", "type": "string"},
    {"name": "causationId", "type": "string"},
    {"name": "producerBc", "type": "string", "default": "portfolio-bc"},
    {"name": "payload", "type": {
      "type": "record",
      "name": "PortfolioCreatedPayload",
      "fields": [
        {"name": "portfolioId", "type": "string", "doc": "Unique ID of the new portfolio"},
        {"name": "userId", "type": "string", "doc": "Owner of the portfolio"},
        {"name": "currency", "type": "string", "doc": "Base currency, e.g., USD, EGP"},
        {"name": "strategyType", "type": "string", "doc": "e.g., AGGRESSIVE, CONSERVATIVE"}
      ]
    }}
  ]
}
```

#### Example 2: `ai.AIConsensus.RecommendationReady.v1`
```json
{
  "namespace": "tradeora.ai.AIConsensus",
  "type": "record",
  "name": "RecommendationReady",
  "doc": "Emitted when the multi-agent AI consensus engine finalizes a trading recommendation.",
  "fields": [
    {"name": "eventId", "type": "string"},
    {"name": "eventType", "type": "string", "default": "tradeora.ai.RecommendationReady"},
    {"name": "eventVersion", "type": "string", "default": "1.0.0"},
    {"name": "occurredAt", "type": "string"},
    {"name": "tenantId", "type": "string"},
    {"name": "correlationId", "type": "string"},
    {"name": "causationId", "type": "string"},
    {"name": "producerBc", "type": "string", "default": "ai-consensus-bc"},
    {"name": "payload", "type": {
      "type": "record",
      "name": "RecommendationReadyPayload",
      "fields": [
        {"name": "recommendationId", "type": "string"},
        {"name": "symbol", "type": "string", "doc": "Ticker symbol, e.g., COMI.CA"},
        {"name": "action", "type": "string", "doc": "BUY, SELL, HOLD"},
        {"name": "confidenceScore", "type": "double", "doc": "0.0 to 1.0 scale"},
        {"name": "supportingAgentsCount", "type": "int"}
      ]
    }}
  ]
}
```

#### Example 3: `market.EGXMarketData.PriceTickReceived.v1` (Lightweight Envelope)
```json
{
  "namespace": "tradeora.market.EGXMarketData",
  "type": "record",
  "name": "PriceTickReceived",
  "doc": "Emitted continuously as real-time pricing data is received from the EGX matching engine.",
  "fields": [
    {"name": "eventId", "type": "string"},
    {"name": "occurredAt", "type": "string"},
    {"name": "symbol", "type": "string", "doc": "EGX symbol code"},
    {"name": "price", "type": "double"},
    {"name": "volume", "type": "long"}
  ]
}
```

#### Example 4: `risk.RiskManagement.RiskLimitBreached.v1`
```json
{
  "namespace": "tradeora.risk.RiskManagement",
  "type": "record",
  "name": "RiskLimitBreached",
  "doc": "Critical event emitted when a portfolio's exposure exceeds predefined risk limits.",
  "fields": [
    {"name": "eventId", "type": "string"},
    {"name": "eventType", "type": "string", "default": "tradeora.risk.RiskLimitBreached"},
    {"name": "eventVersion", "type": "string", "default": "1.0.0"},
    {"name": "occurredAt", "type": "string"},
    {"name": "tenantId", "type": "string"},
    {"name": "correlationId", "type": "string"},
    {"name": "causationId", "type": "string"},
    {"name": "producerBc", "type": "string", "default": "risk-management-bc"},
    {"name": "payload", "type": {
      "type": "record",
      "name": "RiskLimitBreachedPayload",
      "fields": [
        {"name": "portfolioId", "type": "string"},
        {"name": "breachedLimitType", "type": "string", "doc": "e.g., MARGIN_CALL, MAX_DRAWDOWN"},
        {"name": "currentValue", "type": "double"},
        {"name": "thresholdValue", "type": "double"},
        {"name": "severity", "type": "string", "doc": "WARNING, CRITICAL, FATAL"}
      ]
    }}
  ]
}
```

#### Example 5: `user.UserIdentity.UserRegistered.v1`
```json
{
  "namespace": "tradeora.user.UserIdentity",
  "type": "record",
  "name": "UserRegistered",
  "doc": "Emitted upon successful registration and initial identity verification of a new user.",
  "fields": [
    {"name": "eventId", "type": "string"},
    {"name": "eventType", "type": "string", "default": "tradeora.user.UserRegistered"},
    {"name": "eventVersion", "type": "string", "default": "1.0.0"},
    {"name": "occurredAt", "type": "string"},
    {"name": "tenantId", "type": "string"},
    {"name": "correlationId", "type": "string"},
    {"name": "causationId", "type": "string"},
    {"name": "producerBc", "type": "string", "default": "user-identity-bc"},
    {"name": "payload", "type": {
      "type": "record",
      "name": "UserRegisteredPayload",
      "fields": [
        {"name": "userId", "type": "string"},
        {"name": "email", "type": "string"},
        {"name": "kycStatus", "type": "string", "doc": "PENDING, APPROVED, REJECTED"},
        {"name": "registrationCountry", "type": "string"}
      ]
    }}
  ]
}
```

---

## Section 5 — Event Registration Process

To ensure robust schema governance, schema registration is tightly coupled with the CI/CD lifecycle. No schema can be published manually.

### 5.1 Registration Workflow
1. **Authoring:** The developer representing the owning BC creates or modifies an Avro schema file located in the monorepo under `schemas/{domain}/{bc}/{EventName}.v1.avsc`.
2. **Pull Request (PR):** A PR is opened against the `main` branch.
3. **CI Validation:** The CI pipeline intercepts the PR. It runs the Karapace compatibility check against the current state of the schema registry.
   - Command: `curl -X POST http://karapace.tradeora-platform:8081/compatibility/subjects/{subject}/versions/latest`
   - Payload: The new schema definition.
4. **Evaluation:**
   - If the check returns `200 OK` (schema is BACKWARD_TRANSITIVE), the CI step passes.
   - If the check fails (e.g., a required field was removed), the CI step fails, and the PR is explicitly **blocked**.
5. **Merging and Registration:** Upon PR approval and merge, the Continuous Deployment (CD) pipeline extracts the schema and pushes it to Karapace.
   - Command: `curl -X POST http://karapace.tradeora-platform:8081/subjects/{subject}/versions`
6. **Enforcement:** The schema is now live. Producers can begin publishing data utilizing the new schema ID, and consumers can fetch it for deserialization.

### 5.2 CI/CD Pipeline Implementation (GitHub Actions)

```yaml
name: Schema Registry CI/CD
on:
  push:
    paths:
      - 'schemas/**/*.avsc'

jobs:
  validate-schema-compatibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 2
      - name: Karapace Compatibility Check
        run: |
          echo "Starting Schema Compatibility Verification..."
          CHANGED_FILES=$(git diff --name-only HEAD~1 | grep '\.avsc$' || true)
          if [ -z "$CHANGED_FILES" ]; then
            echo "No schema files changed."
            exit 0
          fi
          
          for schema_file in $CHANGED_FILES; do
            subject=$(basename $schema_file .avsc)
            echo "Testing compatibility for subject: $subject"
            
            # Extract JSON payload and format for Karapace API
            schema_content=$(cat $schema_file | jq -Rs .)
            payload="{\"schema\": $schema_content}"
            
            result=$(curl -s -o /dev/null -w "%{http_code}" \
              -X POST http://karapace.tradeora-platform.internal:8081/compatibility/subjects/$subject/versions/latest \
              -H "Content-Type: application/vnd.schemaregistry.v1+json" \
              -d "$payload")
              
            if [ "$result" == "404" ]; then
              echo "Subject $subject not found. This is a new schema. Validation passed."
            elif [ "$result" != "200" ]; then
              echo "::error::Schema incompatibility detected for $subject. HTTP Code: $result"
              echo "This PR introduces a breaking change violating BACKWARD_TRANSITIVE compatibility."
              exit 1
            else
              echo "Compatibility check passed for $subject."
            fi
          done

  register-schemas:
    needs: validate-schema-compatibility
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      # ... checkout and CD deployment logic ...
```

---

## Section 6 — Schema Versioning Strategy

Schema versioning dictates how evolution is managed without disrupting complex distributed workflows.

### 6.1 Versioning Tiers
Tradeora utilizes a semantic-style versioning approach for schemas:

- **Patch (1.0.X)**: Minor documentation changes, fixing typos in `doc` strings. No structural changes. These do not require a new schema version in the topic payload, but may register a new version in Karapace.
- **Minor (1.X.0)**: Adding optional fields (with defaults) or adding enum values. These are structurally backward compatible. The PR is automatically approved by the CI pipeline. The topic remains the same.
- **Major (X.0.0)**: Breaking changes (e.g., removing a required field, changing a field type). These violate `BACKWARD_TRANSITIVE` compatibility. **These are strictly prohibited on existing topics.** They require a dual-topic migration.

### 6.2 Dual-Topic Migration Strategy (For Breaking Changes)

When a Major schema change is unavoidable, the following 90-day lifecycle MUST be executed to prevent system outages.

```text
Migration Timeline (90 Days)

[Day 0]  -------------------------------------------------------------
         Step 1: New schema (v2) registered under a new subject.
         Step 2: Producer updated to publish to BOTH the old topic (v1) 
                 and the new topic (v2) simultaneously (Dual-Write).
                 
[Day 1-89] -----------------------------------------------------------
         Step 3: Consumer BCs receive notification to migrate.
         Step 4: Consumers update logic, test, and deploy consumers 
                 pointing to the v2 topic.
                 
[Day 90] -------------------------------------------------------------
         Step 5: Old topic (v1) is marked DEPRECATED.
         Step 6: Producer stops publishing to old topic (v1).
         Step 7: Old topic (v1) deleted, ACLs revoked.
```

---

## Section 7 — Schema Deprecation Process

Managing the end-of-life for schemas is critical for minimizing technical debt and infrastructure costs.

### 7.1 90-Day Deprecation Lifecycle

1. **Day 0 (Deprecation Initiated):** 
   - The schema is marked `DEPRECATED` in Karapace via metadata tags.
   - An organizational event `platform.SchemaRegistry.SchemaDeprecated.v1` is broadcasted on the `platform-events` topic.
   - Engineering managers of consuming BCs receive automated Jira tickets.
2. **Day 30 (Soft Warning):** 
   - The Kafka client libraries integrated into all Tradeora BCs will detect the deprecated status during schema fetch.
   - A `WARN` level log is emitted continuously by any consumer still reading the deprecated topic.
3. **Day 60 (Hard Warning):** 
   - The CI/CD pipeline starts emitting aggressive warnings during any deployment for services that still hold consumer group configurations for the deprecated topic.
   - Pipeline requires explicit sign-off to proceed.
4. **Day 90 (Retirement):** 
   - The schema status is updated to `RETIRED`.
   - Infrastructure-as-Code (Terraform/Flux) revokes all Kafka ACLs for the topic.
   - Consumers still attempting to read will receive authorization errors and crash. The topic is safely dropped.

---

## Section 8 — Schema Ownership Registry

The following table serves as the authoritative registry mapping major Kafka topics to their respective owners and schema subjects. A comprehensive matrix is maintained in the internal developer portal; below are 20 critical baseline events.

| Topic Name | Schema Subject | Owner Bounded Context | Compatibility | Status |
|---|---|---|---|---|
| `portfolio-events` | `portfolio.Portfolio.PortfolioCreated.v1-value` | `portfolio-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `portfolio-events` | `portfolio.Portfolio.AssetAllocated.v1-value` | `portfolio-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `portfolio-events` | `portfolio.Portfolio.Rebalanced.v1-value` | `portfolio-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `ai-consensus-events` | `ai.AIConsensus.RecommendationReady.v1-value` | `ai-consensus-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `ai-consensus-events` | `ai.AIConsensus.AgentVoted.v1-value` | `ai-consensus-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `market-data-ticks` | `market.EGXMarketData.PriceTickReceived.v1-value` | `market-data-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `market-data-eod` | `market.EGXMarketData.EndOfDaySummary.v1-value` | `market-data-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `risk-alerts` | `risk.RiskManagement.RiskLimitBreached.v1-value` | `risk-management-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `risk-alerts` | `risk.RiskManagement.MarginCallIssued.v1-value` | `risk-management-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `risk-evaluations` | `risk.RiskManagement.PortfolioEvaluated.v1-value` | `risk-management-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `user-identity` | `user.UserIdentity.UserRegistered.v1-value` | `user-identity-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `user-identity` | `user.UserIdentity.KycApproved.v1-value` | `user-identity-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `user-identity` | `user.UserIdentity.LoginSucceeded.v1-value` | `user-identity-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `order-execution` | `execution.OrderExecution.OrderPlaced.v1-value` | `order-execution-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `order-execution` | `execution.OrderExecution.OrderFilled.v1-value` | `order-execution-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `order-execution` | `execution.OrderExecution.OrderRejected.v1-value` | `order-execution-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `billing-events` | `finance.Billing.InvoiceGenerated.v1-value` | `billing-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `billing-events` | `finance.Billing.PaymentReceived.v1-value` | `billing-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `notification-events`| `platform.Notifications.EmailSent.v1-value` | `notification-bc` | BACKWARD_TRANSITIVE | ACTIVE |
| `platform-events` | `platform.SchemaRegistry.SchemaDeprecated.v1-value` | `platform-governance-bc`| BACKWARD_TRANSITIVE | ACTIVE |

---

## Section 9 — Event Taxonomy for Lightweight vs Full Envelope

Resolving **ISSUE-018**, Tradeora distinguishes between high-throughput data streams and standard business domain events to optimize network bandwidth and serialization overhead.

### 9.1 Standard Envelope
- **Definition:** The full 19-field envelope (including tracking, tracing, causation, and correlation IDs).
- **Usage:** Used for all business domain events, user actions, state transitions, and asynchronous choreographies.
- **Target Volume:** Low to moderate throughput (< 5,000 msg/sec).
- **Examples:** `PortfolioCreated`, `OrderPlaced`, `KycApproved`.

### 9.2 Lightweight Envelope
- **Definition:** A highly condensed envelope containing only 5 required fields: `eventId`, `occurredAt`, and 3 payload-specific attributes. Eliminates correlation and routing metadata.
- **Usage:** Used strictly for raw telemetry, tick data, and sensor-like high-frequency streams.
- **Target Volume:** Ultra-high throughput (50,000+ msg/sec).
- **Examples:** `PriceTickReceived`, `OrderBookUpdated`, `SystemMetricLogged`.

---

## Section 10 — Monitoring

Observability into schema governance is crucial. Karapace exposes Prometheus metrics that are scraped by Tradeora's central Prometheus/Grafana stack.

### 10.1 Key Prometheus Metrics

1. `schema_registry_schema_count{domain, status}`
   - **Type:** Gauge
   - **Purpose:** Tracks the total number of registered schemas per domain. Monitors system growth and complexity.
2. `schema_registry_compatibility_failures_total`
   - **Type:** Counter
   - **Purpose:** Increments when a CI pipeline or direct API call attempts to register a breaking schema. Alerts on developer friction.
3. `schema_registry_deprecated_schemas_total`
   - **Type:** Gauge
   - **Purpose:** Tracks the number of schemas currently in the 90-day sunset period.
4. `kafka_producer_schema_validation_errors_total`
   - **Type:** Counter
   - **Purpose:** Emitted by the Kafka Producer SDK if a payload fails local validation against the downloaded schema before publishing. Alerts on severe application logic bugs.
5. `karapace_http_request_duration_seconds_bucket`
   - **Type:** Histogram
   - **Purpose:** Tracks the latency of schema API requests to ensure CI/CD and runtime fetches remain fast.

---

## Section 11 — Architecture Decision Record (ADR-044)

### ADR-044: Event Schema Registry Implementation

**Status:** Accepted
**Date:** 2026-07-24
**Deciders:** Chief Platform Architect, Lead Data Engineer, Platform Engineering Lead
**Context:** 
Tradeora is adopting an event-driven architecture across 49 bounded contexts. Without centralized schema management, producers and consumers lack contracts, leading to breaking changes, runtime deserialization errors, and chaotic debugging. The lack of a schema registry was identified as a critical vulnerability (ISSUE-003).

**Considered Options:**
1. **Confluent Schema Registry (Commercial):** Excellent features, but expensive and requires Confluent licensing.
2. **Karapace (Aiven OSS):** Fully API compatible with Confluent, open-source (Apache 2.0), lightweight, and easily deployable on our K8s infrastructure.
3. **Apicurio Registry:** Red Hat offering, feature-rich, but API differences require rewriting standard Kafka Avro SerDes configurations.
4. **No Registry (JSON/Protobuf over plain Kafka):** Rejected due to lack of strict governance and evolution rules.

**Decision:**
We will adopt **Karapace (v3.x)** using **Apache Avro** as the serialization format. We will enforce a strict `BACKWARD_TRANSITIVE` compatibility model globally via CI/CD pipelines.

**Consequences:**
- **Positive:** Robust contracts between BCs, automated enforcement of non-breaking changes, safe consumer upgrades, and comprehensive data cataloging.
- **Negative:** Increased initial friction for developers defining Avro schemas. Requires a rigorous 90-day dual-topic migration for major structural changes. Additional infrastructure dependency (Karapace deployment).

**Implementation Notes:**
Karapace will be deployed to the `tradeora-platform` namespace, backed by the central Kafka cluster utilizing the `_schemas` compacted topic.
