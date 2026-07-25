# ENTERPRISE ARCHITECTURE DECISION RECORDS
## docs/ENTERPRISE_ARCHITECTURE_DECISION_RECORDS.md

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              ENTERPRISE ARCHITECTURE DECISION RECORDS (ADR)                  ║
║              docs/ENTERPRISE_ARCHITECTURE_DECISION_RECORDS.md                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Version:          v1.0.0                                                   ║
║  Authority:        Chief Enterprise Architect                                ║
║  Document Level:   LEVEL 1 — INSTITUTIONAL DECISION MEMORY                 ║
║  Status:           LIVING DOCUMENT — grows with every technology decision   ║
║  Inherits From:    ENTERPRISE_TECHNOLOGY_STRATEGY.md (§ 48 ADR Strategy)   ║
║                    TRADEORA_ENGINEERING_CONSTITUTION.md (ARTICLE 18.3)      ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

> **PURPOSE**: This document is Tradeora's institutional memory for all
> significant architecture and technology decisions. Every decision that
> shaped the Phase 1 architecture is formally documented here.
> Every future decision that changes the stack must create an ADR here first.
> No architecture decision is valid without an ADR.

---

## ADR FRAMEWORK

### ADR Lifecycle

```
PROPOSED → [Review] → ACCEPTED ──────────────────┐
                    → REJECTED (with rationale)   │
                                                   │
ACCEPTED ──► [Time passes, context changes] ──────▼
         ──► DEPRECATED (better option found)
         ──► SUPERSEDED BY ADR-{N} (explicit replacement)
```

### ADR Template (Mandatory Format)

```markdown
## ADR-{ID}: {Title}
**Status**: PROPOSED | ACCEPTED | REJECTED | DEPRECATED | SUPERSEDED BY ADR-{N}
**Date**: YYYY-MM-DD
**Author(s)**: Name(s)
**Reviewers**: Name(s)
**Constitutional Reference**: ARTICLE {N} (if applicable)

### Context
[What situation or problem prompted this decision?]

### Decision
[What was decided?]

### Options Considered
[What alternatives were evaluated?]

### Consequences
Positive: [What benefits does this decision bring?]
Negative: [What costs, risks, or trade-offs does this decision carry?]
Neutral:  [What changes without clear positive/negative valuation?]

### OSS Compliance
[License, self-hosting capability, vendor lock-in risk 1-5]

### Escape Hatch
[How can this be reversed within 90 days?]

### Related ADRs
[ADR-{N}: {relationship}]
```

---

## ADR REGISTER

### CATEGORY: ARCHITECTURE FOUNDATIONS

---

#### ADR-ARCH-001: Domain-Driven Design as Primary Architecture Paradigm
**Status**: ACCEPTED
**Date**: 2024-01-01
**Author**: Chief Enterprise Architect

**Context**: Tradeora is a complex financial domain with 49+ bounded contexts, rich business rules, and multiple user personas. We need an architecture that places business logic at the center and prevents technology choices from contaminating domain logic.

**Decision**: DDD (Domain-Driven Design) combined with Clean Architecture and Hexagonal Architecture is the primary software architecture paradigm. All Phase 7 documents implement this decision.

**Consequences**:
- Positive: Business logic is isolated, testable, and replaceable-technology-agnostic
- Positive: Ubiquitous language creates shared understanding between domain experts and engineers
- Positive: 49 bounded contexts create natural service boundaries
- Negative: Higher initial learning curve for engineers unfamiliar with DDD
- Negative: More boilerplate (ports, adapters, command/query handlers)

**OSS Compliance**: DDD is a methodology, not software. N/A.
**Related ADRs**: ADR-ARCH-002 (CQRS), ADR-ARCH-003 (Event Sourcing)

---

#### ADR-ARCH-002: CQRS as Read/Write Separation Pattern
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: Financial dashboards have read:write ratios of 100:1+. Serving all reads from the write database creates unnecessary load. Portfolio summary reads need different optimization than portfolio mutation writes.

**Decision**: CQRS (Command Query Responsibility Segregation) applied at the Application layer. Commands go to write models (PostgreSQL primary). Queries go to optimized read models (PostgreSQL read replicas + Valkey cache).

**Consequences**:
- Positive: Read performance independent of write performance
- Positive: Read models can be optimized per use case
- Negative: Eventual consistency between write and read models (managed via domain events)

---

#### ADR-ARCH-003: Event Sourcing for Financial Audit Trail
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: Financial systems require complete audit trails. Reconstructing past state is needed for: regulatory compliance, AI training, backtesting (Phase 2), dispute resolution.

**Decision**: Event Sourcing using EventStoreDB Community Edition. Every significant state change produces an immutable domain event. State is derived from event replay.

**Consequences**:
- Positive: Complete tamper-proof audit trail (required for FRA compliance)
- Positive: Time-travel queries (any past state reconstructable)
- Positive: Event history = AI training dataset
- Negative: Increased complexity vs. simple CRUD
- Negative: Read models require separate projection logic

---

#### ADR-ARCH-004: Hexagonal Architecture for Infrastructure Independence
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: Technology choices change. Database vendors change. AI providers change. Cloud providers change. Business logic should not be affected by these changes.

**Decision**: Hexagonal Architecture (Ports and Adapters). Application layer defines Ports (interfaces). Infrastructure layer implements Adapters. Domain and Application layers have zero infrastructure imports.

**Consequences**:
- Positive: Any infrastructure component replaceable without touching domain/application code
- Positive: Unit testing of domain logic requires zero infrastructure setup
- Negative: More interfaces and indirection layers

---

### CATEGORY: DATABASE

---

#### ADR-DB-001: PostgreSQL as Primary Database
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: Need ACID-compliant, battle-tested, NUMERIC-type capable, schema-isolated relational database for financial data.

**Decision**: PostgreSQL 15+ with schema-per-bounded-context isolation. NUMERIC type for all financial amounts. Patroni for HA. PgBouncer for connection pooling.

**OSS Compliance**: PostgreSQL License ✅ | Self-hosted ✅ | Lock-in risk: 1/5
**Escape Hatch**: Repository pattern. Migration to CockroachDB (PostgreSQL-compatible) within 45 days.

---

#### ADR-DB-002: EventStoreDB Community Edition for Event Store
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: Need purpose-built event store for event sourcing. PostgreSQL can store events but lacks native event streaming capabilities.

**Decision**: EventStoreDB Community Edition 24.x. Apache 2.0 license (OSS compliant). CE features sufficient for Phase 1.

**OSS Compliance**: Apache 2.0 ✅ | Self-hosted ✅ | Lock-in risk: 3/5
**Escape Hatch**: EventStorePort interface. Migration to Marten (MIT, PostgreSQL-based) within 30 days.

---

### CATEGORY: CACHE

---

#### ADR-CACHE-001: Valkey Replaces Redis 7.4+ (OSS Compliance)
**Status**: ACCEPTED
**Date**: 2026-07-23
**Constitutional Reference**: ARTICLE 29 (FREE & OPEN SOURCE FIRST)

**Context**: Redis changed its license from BSD-3 to SSPL (Server Side Public License) for versions 7.4+ in March 2024. SSPL is not recognized as an open-source license by OSI. Per Constitution ARTICLE 29, non-OSS licenses require exception ADR. No justification exists for SSPL when an OSS alternative exists.

**Decision**: Adopt Valkey (BSD-3, Linux Foundation) as the Redis replacement. Valkey is a fork of Redis 7.2 (last BSD-3 version) under Linux Foundation governance.

**Options Considered**:
1. Redis Enterprise (proprietary) — REJECTED: paid + proprietary
2. Redis OSS 7.2 (BSD-3) — CONSIDERED: still OSS but abandoned upstream (no security patches)
3. **Valkey (BSD-3)** — SELECTED: OSS, Linux Foundation governed, drop-in API compatible
4. Dragonfly (BSL) — REJECTED: BSL = not OSS per ARTICLE 29

**Consequences**:
- Positive: BSD-3 license fully OSS compliant
- Positive: Drop-in API compatibility — zero application code changes
- Positive: Linux Foundation governance = stable long-term
- Positive: Security patches will continue indefinitely
- Neutral: Kubernetes operator change (valkey-operator vs redis-operator)

**OSS Compliance**: BSD-3 ✅ | Self-hosted ✅ | Lock-in risk: 1/5
**Escape Hatch**: Any Redis-compatible store (KeyDB, Garnet) within 1 day (API identical)
**Migration Effort**: 1 sprint (infrastructure only — zero application code)

---

### CATEGORY: SECRETS MANAGEMENT

---

#### ADR-SM-001: OpenBao Replaces HashiCorp Vault (OSS Compliance)
**Status**: ACCEPTED
**Date**: 2026-07-23
**Constitutional Reference**: ARTICLE 29 (FREE & OPEN SOURCE FIRST)

**Context**: HashiCorp changed Vault's license from MPL 2.0 to BSL 1.1 in August 2023. BSL 1.1 is not an open-source license. This violates Constitution ARTICLE 29.

**Decision**: Adopt OpenBao (MIT license) as the secrets management platform. OpenBao is a fork of HashiCorp Vault (pre-BSL version) maintained by the OpenBao Foundation.

**Options Considered**:
1. HashiCorp Vault OSS (old MPL version) — REJECTED: no security updates from HashiCorp
2. HashiCorp Vault Enterprise — REJECTED: paid + BSL
3. **OpenBao (MIT)** — SELECTED: OSS, API-compatible, MIT license, active community
4. Infisical (MIT) — CONSIDERED: newer, less mature, smaller API surface

**Consequences**:
- Positive: MIT license fully OSS compliant
- Positive: 100% API compatible with Vault (same CLI, same HTTP API, same SDK)
- Positive: Active OpenBao Foundation governance
- Neutral: CLI command changes from `vault` to `bao` (CI scripts only)

**OSS Compliance**: MIT ✅ | Self-hosted ✅ | Lock-in risk: 2/5
**Escape Hatch**: SecretsPort interface. Migration to any OIDC-based secrets system within 14 days.
**Migration Effort**: 1 sprint (infrastructure only — zero application code changes)

---

### CATEGORY: INFRASTRUCTURE AS CODE

---

#### ADR-IAC-001: OpenTofu Replaces HashiCorp Terraform (OSS Compliance)
**Status**: ACCEPTED
**Date**: 2026-07-23
**Constitutional Reference**: ARTICLE 29 (FREE & OPEN SOURCE FIRST)

**Context**: HashiCorp changed Terraform's license from MPL 2.0 to BSL 1.1 in August 2023. This is the same situation as Vault.

**Decision**: Adopt OpenTofu (MPL 2.0) as the Infrastructure as Code tool. OpenTofu is a fork of Terraform maintained by the Linux Foundation OpenTofu project.

**Options Considered**:
1. Terraform OSS (old MPL) — REJECTED: no upstream security updates
2. Terraform Cloud — REJECTED: paid + BSL
3. **OpenTofu (MPL 2.0)** — SELECTED: OSS, HCL-compatible, Linux Foundation, active
4. Pulumi (Apache 2.0) — CONSIDERED: different HCL → TypeScript/Python; migration cost too high
5. Ansible (GPL-2.0) — CONSIDERED: different paradigm; not a drop-in replacement

**Consequences**:
- Positive: MPL 2.0 fully OSS compliant
- Positive: All .tf HCL files work unchanged (100% compatible)
- Positive: Linux Foundation governance = long-term stability
- Neutral: CI pipeline command changes: `terraform` → `tofu`
- Neutral: HCL file changes: ZERO

**OSS Compliance**: MPL 2.0 ✅ | Self-hosted ✅ | Lock-in risk: 2/5
**Escape Hatch**: HCL files are portable. Migration to Pulumi within 30 days.
**Migration Effort**: 2 days (CI pipeline command replacement — HCL unchanged)

---

### CATEGORY: AI PLATFORM

---

#### ADR-AI-001: Ollama for Local AI Inference (Provider Independence)
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: AI provider APIs (OpenAI, Anthropic) create vendor lock-in. API costs scale with usage. Network latency adds to AI response time. For financial advisory, the system must function without external dependencies.

**Decision**: Ollama (MIT) as primary AI inference engine. CPU-based Phase 1. GPU Phase 2. System fully functional with Ollama alone.

**OSS Compliance**: MIT ✅ | Self-hosted ✅ | Lock-in risk: 2/5

---

#### ADR-AI-002: LiteLLM as AI Provider Independence Layer
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: Need a single interface for AI that works across any provider (Ollama, OpenAI, Anthropic, DeepSeek). Provider changes must be configuration-only.

**Decision**: LiteLLM (MIT) proxy routes all AI calls. Application code calls `litellm.completion()`. Provider selection is configuration. Switching providers = config change, zero code change.

**OSS Compliance**: MIT ✅ | Self-hosted ✅ | Lock-in risk: 1/5

---

#### ADR-AI-003: LangGraph for Agent Orchestration
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: 17-school consensus requires orchestrating 17 parallel AI calls and aggregating results. LangGraph provides graph-based workflow for this pattern. Phase 2 extends to multi-agent systems.

**Decision**: LangGraph (MIT) for agent workflow. AgentOrchestratorPort abstracts it.

**OSS Compliance**: MIT ✅ | Self-hosted ✅ | Lock-in risk: 3/5
**Escape Hatch**: AgentOrchestratorPort. Migration to CrewAI or AutoGen within 30 days.

---

#### ADR-AI-004: 17-School Consensus Architecture
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: No single AI analytical framework is sufficient for reliable financial recommendations. Different schools (technical, fundamental, quantitative, macro, sentiment...) provide complementary perspectives. Single-model outputs have high hallucination risk.

**Decision**: 17 analytical schools run in parallel. Each school produces: recommendation, confidence, rationale. Weighted consensus produces the final recommendation. Schools with confidence < 0.65 are excluded from consensus.

**Consequences**:
- Positive: Dramatically reduces hallucination risk (must agree across 17 frameworks)
- Positive: Richer explanations (multi-dimensional analysis)
- Negative: Higher inference time (17 parallel calls vs 1)
- Mitigation: Parallel execution via LangGraph nodes + KEDA scaling

---

#### ADR-AI-005: LangFuse for Prompt Management (Phase 2+)
**Status**: PROPOSED (Phase 2)
**Date**: 2026-07-23

**Context**: Phase 1 manages prompts as Git files. Phase 2 requires prompt versioning, A/B testing, quality tracking, and cost monitoring at scale (17 schools × 100K AI requests/day).

**Decision**: LangFuse (MIT, self-hosted) for prompt lifecycle management in Phase 2.

**OSS Compliance**: MIT ✅ | Self-hosted ✅ | Lock-in risk: 2/5

---

### CATEGORY: MESSAGE BUS

---

#### ADR-MSG-001: Apache Kafka as Event Bus
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: 49 bounded contexts need reliable event communication. Events must be: persistent, ordered per partition, replayable, scalable. EGX market data generates 10,000+ events/second during session.

**Decision**: Apache Kafka 3.7+ in KRaft mode (no ZooKeeper). 49 domain event topics. Avro format. Apicurio Schema Registry.

**OSS Compliance**: Apache 2.0 ✅ | Self-hosted ✅ | Lock-in risk: 3/5
**Escape Hatch**: EventBusPort interface. Migration to RabbitMQ within 45 days.

---

### CATEGORY: AUTHENTICATION & IDENTITY

---

#### ADR-AUTH-001: Keycloak as Identity Provider
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: Need OIDC/OAuth 2.0 compliant identity provider with RBAC, MFA, and Arabic-language support. Must be self-hosted for data sovereignty.

**Decision**: Keycloak 24.x (Apache 2.0). Self-hosted. OIDC standard ensures zero application lock-in.

**OSS Compliance**: Apache 2.0 ✅ | Self-hosted ✅ | Lock-in risk: 2/5
**Escape Hatch**: OIDC standard interface. Migration to Authentik or Dex within 21 days.

---

### CATEGORY: OBJECT STORAGE

---

#### ADR-OBJ-001: MinIO for Object Storage (WORM Audit Trail)
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: Need S3-compatible object storage for: regulatory audit trail (WORM), AI document storage, user exports. Must be self-hosted. Must support immutable (WORM) storage for compliance.

**Decision**: MinIO (AGPL-3.0). WORM-enabled bucket for audit trail. S3-compatible (zero lock-in to S3).

**AGPL Note**: Tradeora self-hosts MinIO — does not embed or distribute MinIO. AGPL copyleft does not apply.

**OSS Compliance**: AGPL-3.0 ✅ | Self-hosted ✅ | Lock-in risk: 1/5 (S3-compatible)

---

### CATEGORY: MOBILE

---

#### ADR-MOB-001: Flutter as Mobile Platform (Permanent Decision)
**Status**: ACCEPTED (PERMANENT — requires Constitutional Amendment to change)
**Date**: 2024-01-01
**Constitutional Reference**: ARTICLE 34.1 (Flutter is permanent)

**Context**: Need cross-platform mobile framework for iOS + Android + Tablet. Egyptian/GCC markets are mobile-dominant. Arabic RTL is mandatory. Financial charting must be smooth (60fps).

**Decision**: Flutter 3.x (Dart 3.x, BSD-3). Single codebase for iOS + Android + Tablet. NOT React Native.

**Why Flutter over React Native**:
- Superior performance: compiled Dart → native code (React Native: JS bridge)
- Better Arabic RTL support
- fl_chart provides smooth 60fps financial charting
- Isar DB for offline-first local storage
- Single language (Dart) vs hybrid (JS + native)

**Consequences**:
- Positive: 60fps native performance on iOS and Android
- Positive: Single codebase for all mobile platforms
- Negative: Dart ecosystem is smaller than React/JS ecosystem
- Negative: Lock-in to Flutter/Dart is higher than React Native
- Accepted: Flutter's advantages for financial apps outweigh ecosystem trade-off

**OSS Compliance**: BSD-3 ✅ | Lock-in risk: 4/5 (Dart is Flutter-specific)

---

### CATEGORY: FRONTEND

---

#### ADR-FE-001: Next.js 14+ for Web Platform
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: Need SSR/SSG capable React framework for web. SEO matters for discovery. App Router provides server components for performance. Arabic RTL support required.

**Decision**: Next.js 14+ with App Router (MIT). React 18+. Self-hosted or Vercel-deployed.

**OSS Compliance**: MIT ✅ | Self-hosted ✅ | Lock-in risk: 3/5

---

### CATEGORY: VECTOR DATABASE

---

#### ADR-VDB-001: Qdrant for Vector Similarity Search
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: AI RAG (Retrieval-Augmented Generation) requires vector similarity search for document retrieval. EGX company profiles, news articles, and research reports need semantic search.

**Decision**: Qdrant (Apache 2.0). High-performance, Rust-based. Arabic and English embedding support via nomic-embed-text.

**OSS Compliance**: Apache 2.0 ✅ | Self-hosted ✅ | Lock-in risk: 2/5

---

### CATEGORY: KNOWLEDGE GRAPH

---

#### ADR-KG-001: Apache AGE for Financial Knowledge Graph (Phase 2+)
**Status**: PROPOSED (Phase 2)
**Date**: 2026-07-23

**Context**: Phase 2 requires a Financial Knowledge Graph to capture entity relationships (Company → Instrument → Sector → Macro). Graph queries enable: supply chain analysis, correlation discovery, regulatory exposure mapping.

**Decision**: Apache AGE (Apache 2.0) as PostgreSQL graph extension. Reuses existing PostgreSQL infrastructure. Cypher query language.

**Why AGE over Neo4j Community**: Zero new infrastructure (PostgreSQL extension). Apache 2.0 license. PostgreSQL ACID guarantees extend to graph data.

**OSS Compliance**: Apache 2.0 ✅ | Self-hosted ✅ | Lock-in risk: 2/5

---

### CATEGORY: CONTAINER ORCHESTRATION

---

#### ADR-CO-001: Kubernetes as Container Orchestration
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: Need production-grade container orchestration with auto-scaling, self-healing, and declarative deployment. Cloud-agnostic.

**Decision**: Kubernetes 1.29+ (Apache 2.0). KEDA for event-driven scaling. ArgoCD for GitOps CD.

**OSS Compliance**: Apache 2.0 ✅ | Self-hosted ✅ | Lock-in risk: 3/5

---

#### ADR-CO-002: ArgoCD for GitOps CD
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: Kubernetes deployments must be declarative, versioned, and auditable. GitOps pattern ensures: every deployment traceable to a Git commit, rollback is a Git revert.

**Decision**: ArgoCD 2.11+ (Apache 2.0). All Kubernetes manifests in Git. Auto-sync for staging. Manual approval gate for production.

**OSS Compliance**: Apache 2.0 ✅ | Self-hosted ✅ | Lock-in risk: 2/5

---

### CATEGORY: CI/CD

---

#### ADR-CI-001: GitHub Actions (OSS Exception)
**Status**: ACCEPTED (with documented exception)
**Date**: 2024-01-01
**Constitutional Reference**: ARTICLE 29 § OSS Exception Process

**Context**: Need CI platform for 49-service monorepo with NestJS, Python, and Flutter pipelines. GitHub Actions is the industry standard with the best ecosystem for this combination.

**Decision**: GitHub Actions (proprietary SaaS) with documented OSS exception.

**Exception Justification**:
1. No viable OSS self-hosted alternative offers equivalent engineering velocity for this stack
2. All workflows are standard YAML — portable to Forgejo + Woodpecker CI within 7 days
3. No business logic in CI — it's infrastructure glue only
4. Phase 2: Evaluate Forgejo + Woodpecker for full OSS stack

**OSS Compliance**: ⚠️ Proprietary SaaS — exception approved | Lock-in risk: 2/5
**Escape Hatch**: Standard YAML workflows → Forgejo + Woodpecker CI within 7 days

---

### CATEGORY: OBSERVABILITY

---

#### ADR-OBS-001: Prometheus + Grafana + Loki + Jaeger Stack
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: Need three-pillar observability: metrics, logs, distributed traces. Must be self-hosted. CNCF-aligned for cloud-agnostic deployment.

**Decision**: Prometheus (Apache 2.0) + Grafana (AGPL-3.0) + Loki (AGPL-3.0) + Jaeger (Apache 2.0) + OpenTelemetry Collector (Apache 2.0).

**OSS Compliance**: All Apache 2.0 or AGPL-3.0 ✅ | Self-hosted ✅ | Lock-in risk: 2/5

---

### CATEGORY: MONOREPO

---

#### ADR-REPO-001: Nx Monorepo
**Status**: ACCEPTED
**Date**: 2024-01-01

**Context**: 49 services + 2 frontends + shared libraries need a monorepo build system with caching, dependency graph, and code generation.

**Decision**: Nx 19.x (MIT). Provides: distributed caching, affected build detection, NestJS + Flutter generators, TypeScript project references.

**Why Nx over Turborepo**: Better NestJS integration, Flutter workspace support, more mature enterprise tooling, better DX for large teams.

**OSS Compliance**: MIT ✅ | Lock-in risk: 2/5

---

### CATEGORY: NOTIFICATIONS

---

#### ADR-NOTIF-001: Firebase FCM (OSS Exception)
**Status**: ACCEPTED (with documented exception)
**Date**: 2024-01-01
**Constitutional Reference**: ARTICLE 29 § OSS Exception Process

**Context**: Need push notification delivery for iOS (APNs) and Android (FCM). iOS push notifications require Apple APNs which cannot be self-hosted. FCM is the standard Android push gateway.

**Decision**: Firebase FCM for push notifications (proprietary SaaS) with documented OSS exception.

**Exception Justification**:
1. iOS APNs is the only mechanism for iOS push notifications (Apple mandates this)
2. No viable OSS alternative exists for reliably delivering iOS push notifications
3. ntfy.sh (Phase 2) for non-critical alerts where FCM can be avoided

**OSS Compliance**: ⚠️ Proprietary SaaS — exception approved | Lock-in risk: 3/5

---

### CATEGORY: FINANCIAL CALCULATIONS

---

#### ADR-FIN-001: Decimal.js / Python Decimal for Financial Arithmetic
**Status**: ACCEPTED (CONSTITUTIONAL — ARTICLE 2.2)
**Date**: 2024-01-01
**Constitutional Reference**: ARTICLE 2.2 (Financial Integrity)

**Context**: IEEE 754 floating-point arithmetic produces rounding errors (0.1 + 0.2 = 0.30000000000000004). Financial calculations MUST be exact.

**Decision**: TypeScript: decimal.js (MIT). Python: stdlib Decimal. PostgreSQL: NUMERIC type.
IEEE 754 float/double PROHIBITED for all financial values.

**OSS Compliance**: MIT ✅ | N/A (library, not service)

---

### CATEGORY: COMPLIANCE

---

#### ADR-COMP-001: PDPL 2020 (Egyptian Data Protection Law)
**Status**: ACCEPTED (REQUIRED)
**Date**: 2024-01-01

**Context**: Egypt enacted PDPL (Personal Data Protection Law) 2020. All user personal data processing must comply. Phase 1 operates exclusively in Egypt.

**Decision**: Design all data handling to comply with PDPL 2020:
- Minimum data collection
- Explicit consent for data processing
- Right to erasure (30-day processing)
- Data residency in Egypt (Phase 1)
- Audit log for all data access

---

#### ADR-COMP-002: FRA Investment Advisory Classification
**Status**: ACCEPTED (REQUIRED)
**Date**: 2024-01-01

**Context**: FRA (Financial Regulatory Authority, Egypt) classifies investment advisory services. AI recommendations must be clearly classified to avoid unlicensed advisory exposure.

**Decision**: Phase 1 AI output is classified as "informational" per FRA guidance. Every recommendation includes mandatory disclaimer in Arabic and English. AI is not licensed as a financial advisor.

---

## ADR STATISTICS

| Category | Total ADRs | Accepted | Proposed | Rejected |
|---|---|---|---|---|
| Architecture Foundations | 4 | 4 | 0 | 0 |
| Database | 2 | 2 | 0 | 0 |
| Cache | 1 | 1 | 0 | 0 |
| Secrets Management | 1 | 1 | 0 | 0 |
| Infrastructure as Code | 1 | 1 | 0 | 0 |
| AI Platform | 5 | 4 | 1 | 0 |
| Message Bus | 1 | 1 | 0 | 0 |
| Authentication | 1 | 1 | 0 | 0 |
| Object Storage | 1 | 1 | 0 | 0 |
| Mobile | 1 | 1 | 0 | 0 |
| Frontend | 1 | 1 | 0 | 0 |
| Vector Database | 1 | 1 | 0 | 0 |
| Knowledge Graph | 1 | 0 | 1 | 0 |
| Container Orchestration | 2 | 2 | 0 | 0 |
| CI/CD | 1 | 1 | 0 | 0 |
| Observability | 1 | 1 | 0 | 0 |
| Monorepo | 1 | 1 | 0 | 0 |
| Notifications | 1 | 1 | 0 | 0 |
| Financial Calculations | 1 | 1 | 0 | 0 |
| Compliance | 2 | 2 | 0 | 0 |
| **TOTAL** | **30** | **28** | **2** | **0** |

---

## INSTRUCTIONS FOR NEW ADRS

```
1. Use next available ID in category (e.g., ADR-DB-003 for 3rd database ADR)
2. Fill all template sections completely
3. OSS Compliance assessment is MANDATORY
4. Escape Hatch is MANDATORY for every infrastructure technology
5. Get review from Chief Enterprise Architect before marking ACCEPTED
6. Tag PR with label: "architecture-decision"
7. Update ADR STATISTICS table above
```

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║            ENTERPRISE ARCHITECTURE DECISION RECORDS                          ║
║                       INITIALIZATION COMPLETE                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Initial ADRs: 30                                                            ║
║  Accepted: 28 | Proposed: 2 | Rejected: 0                                   ║
║  OSS Conflicts Resolved: 3 (Valkey, OpenBao, OpenTofu)                      ║
║  Constitutional Articles referenced: ARTICLE 2.2, 8.1, 18.3, 29, 34.1     ║
║  Version: 1.0.0 | Date: 2026-07-23                                          ║
║  Proceeding to: docs/ENTERPRISE_GOVERNANCE.md (Phase 7.0.6)                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
```
