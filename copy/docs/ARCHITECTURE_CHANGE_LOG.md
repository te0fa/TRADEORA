# Tradeora Financial Operating System
## Architecture Change Log
## Version 1.2.0 | Status: AUTHORITATIVE | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  Tracks all architecture changes from v1.0 (Audit) → v1.1 → v1.2 (Final)  ║
║  Authority : Chief Enterprise Architect                                      ║
║  Baseline  : TRD-BASELINE-2026-0724-v1.2                                   ║
║  Freeze    : ARCHITECTURE FREEZE v1.2 FINAL — 2026-07-24                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## v1.2 Changes — Global Enterprise Architecture Board Session 2026-07-24

---

## CHANGE-024: Enterprise Metrics Catalog created

| Field | Value |
|-------|-------|
| Change ID | CHANGE-024 |
| Type | ADDITION |
| Priority | P1 |
| Status | RESOLVED |
| Documents Created | `ENTERPRISE_METRICS_CATALOG.md` v1.0.0 |
| Documents Updated | None |
| ADR Reference | ADR-047 |
| Resolution Summary | Created the authoritative centralized metrics registry. 38 metrics registered across 13 domains (AI Inference, Learning, Signal, Portfolio, Risk, Users, Business, Infrastructure, Security, Operations, Compliance, Data Quality, Developer Productivity). Each metric has 21-field schema with formula, Decimal enforcement (Article 17), alert thresholds, owners, and dashboard references. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Article 8 (data governance) + Article 17 (Decimal) |

---

## CHANGE-025: Enterprise AI Benchmark Suite created

| Field | Value |
|-------|-------|
| Change ID | CHANGE-025 |
| Type | ADDITION |
| Priority | P1 |
| Status | RESOLVED |
| Documents Created | `ENTERPRISE_AI_BENCHMARK_SUITE.md` v1.0.0 |
| Documents Updated | None |
| ADR Reference | ADR-048 |
| Resolution Summary | Created 20-benchmark continuous quality measurement framework for all 26 AI engines. Benchmark categories: Signal Accuracy (2), Prediction Accuracy (2), Confidence Calibration (2), Safety (3), Ground Truth (2), Learning (2), Inference Performance (3), Knowledge & Memory (2), Explainability (1), Reliability (1). New category: Decision Consistency (4 benchmarks — TRD-BM-CONS-001 through 004). All benchmarks integrated with WisdomEngine recalibration gate. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Article 6 (HITL) + Article 17 (Decimal) |

---

## CHANGE-026: Enterprise Evolution KPIs created

| Field | Value |
|-------|-------|
| Change ID | CHANGE-026 |
| Type | ADDITION |
| Priority | P1 |
| Status | RESOLVED |
| Documents Created | `ENTERPRISE_EVOLUTION_KPIS.md` v1.0.0 |
| Documents Updated | None |
| ADR Reference | ADR-049 |
| Resolution Summary | Created 23 longitudinal KPIs across 13 domains: AI Evolution (2), Knowledge Evolution (2), Decision Quality Evolution (2), Signal Quality Evolution (1), Portfolio Performance (2), Risk Management (1), Learning Speed (1), Infrastructure (1), Developer Productivity (2), User Satisfaction (2), Business Growth (1), Architecture Health (2), Architecture Stability (4 — new). New Architecture Stability cluster (TRD-EVO-STAB-001 through 004) measures architecture drift, ECR rate, and long-term maintainability. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Article 8 (data governance) |

---

## CHANGE-027: Architecture Baseline Manifest created

| Field | Value |
|-------|-------|
| Change ID | CHANGE-027 |
| Type | ADDITION |
| Priority | P1 |
| Status | RESOLVED |
| Documents Created | `ARCHITECTURE_BASELINE_MANIFEST.md` v1.2.0 |
| Documents Updated | None |
| ADR Reference | None (governance document) |
| Resolution Summary | Created single authoritative version registry of all 91 frozen documents with exact versions, sizes, and dates. Includes technology stack baseline, architecture statistics (51 BCs, 26 AI engines, 49 ADRs, etc.), and freeze rules. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

---

## CHANGE-028: Enterprise Baseline Signature created

| Field | Value |
|-------|-------|
| Change ID | CHANGE-028 |
| Type | ADDITION |
| Priority | P1 |
| Status | RESOLVED |
| Documents Created | `ENTERPRISE_BASELINE_SIGNATURE.md` v1.2.0 |
| Documents Updated | None |
| ADR Reference | None (governance document) |
| Resolution Summary | Created digital signature framework document for the v1.2 baseline. Contains version manifest, SHA-256 hash placeholders (generated at git tag time), digital signature placeholders (signed by OpenBao PKI at WORM upload time), and approval records from 4 authority roles. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

---

## v1.2 Summary

| Metric | Value |
|--------|-------|
| New documents (v1.2) | 5 (Metrics Catalog, Benchmark Suite, Evolution KPIs, Baseline Manifest, Baseline Signature) + 6 certificates |
| Changes applied | CHANGE-024 through CHANGE-028 |
| ADRs added | ADR-047, ADR-048, ADR-049 |
| Total corpus after v1.2 | 91 documents |
| Architecture freeze | FREEZE v1.2 FINAL — LOCKED |
| Architecture score | 99.4/100 |

---

## Future Evolution Backlog

> Ideas recorded here are NOT part of the frozen architecture.
> They will be reviewed for Phase 2 implementation.
> None may affect Phase 8 implementation without an approved ECR.

| ID | Idea | Phase | Requester | Priority |
|----|------|-------|-----------|----------|
| FEB-001 | Scale to 17 schools in Phase 2 (Ollama → vLLM migration) | Phase 2 | Architecture Board | HIGH |
| FEB-002 | GPU inference cluster for schools that require it | Phase 2 | AI Architecture Lead | HIGH |
| FEB-003 | GCC region expansion (Saudi Arabia, UAE) | Phase 2 | CEO | MEDIUM |
| FEB-004 | Family Office white-labeling (multi-tenant portal) | Phase 2 | CPO | MEDIUM |
| FEB-005 | Real-time streaming recommendations (WebSocket) | Phase 2 | CPO | MEDIUM |
| FEB-006 | Second exchange integration (Tadawul, ADX) | Phase 2 | CIO | MEDIUM |
| FEB-007 | Grafana Evolution Observatory dashboard automation | Phase 1 post-launch | Platform Engineering | LOW |
| FEB-008 | ChatGPT-4o fallback provider in LLM Gateway | Phase 2 | AI Architecture Lead | LOW |

---

## v1.1 Changes (previously recorded — see below for continuation)



## CHANGE-001: Consensus quorum standardized to 10/17 with 3-tier model

| Field | Value |
|-------|-------|
| Change ID | CHANGE-001 |
| Resolves | ISSUE-001 |
| Type | DECISION |
| Priority | P0 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `ARCHITECTURE.md` |
| ADR Reference | None |
| Resolution Summary | Standardized the consensus quorum to a strict 10/17 model utilizing a 3-tier architecture. This change mitigates split-brain scenarios and ensures a robust election process for high-availability clusters. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
The consensus mechanism across the distributed trading systems was previously under-specified, leading to potential inconsistency during network partitions. By formally adopting a 10/17 quorum model, we ensure that a clear majority is required for any state-mutating consensus decision. The 3-tier model categorizes nodes into core voters, standby voters, and observer nodes. This hierarchy ensures that the core trading path remains unencumbered by excessive gossip protocols, while maintaining the strictest consistency guarantees required by Article 17 of the Engineering Constitution. All systems participating in leader election must adhere to this unified standard.

## CHANGE-002: LLM Gateway Architecture introduced — resolves Ollama scalability

| Field | Value |
|-------|-------|
| Change ID | CHANGE-002 |
| Resolves | ISSUE-002 |
| Type | NEW_DOCUMENT |
| Priority | P0 |
| Status | RESOLVED |
| Documents Created | `LLM_GATEWAY_ARCHITECTURE.md` |
| Documents Updated | `AI_COPILOT_ENGINE.md` |
| ADR Reference | ADR-041 |
| Resolution Summary | Introduced a centralized LLM Gateway to abstract direct dependencies on Ollama, enabling seamless scaling and provider interchangeability. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
The direct coupling of internal AI agents to specific Ollama endpoints posed a critical scalability cliff and violated our vendor-agnostic policies. To resolve this, we introduced the Enterprise LLM Gateway Pattern (detailed in ADR-041). This gateway acts as a reverse proxy, load balancer, and abstraction layer for all LLM inference requests. It provides essential features such as request routing, fallback mechanisms, cost tracking, and unified observability. The new architecture completely decouples the Bounded Contexts from the physical inference infrastructure, allowing us to seamlessly swap out local Ollama instances with cloud providers or specialized hardware accelerators without changing the domain logic.

## CHANGE-003: Karapace Schema Registry added to infrastructure

| Field | Value |
|-------|-------|
| Change ID | CHANGE-003 |
| Resolves | ISSUE-003 |
| Type | DECISION |
| Priority | P1 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `DATA_INFRASTRUCTURE.md` |
| ADR Reference | ADR-044 |
| Resolution Summary | Deployed Karapace as the official schema registry for Kafka to enforce runtime schema evolution and compatibility. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
The audit revealed over 270 event types flowing through Kafka without centralized runtime validation, risking downstream data corruption upon schema evolution. We selected Karapace, an open-source schema registry compatible with the Confluent API, to resolve this. Karapace is configured with BACKWARD_TRANSITIVE compatibility by default, ensuring that producers can evolve their Avro/Protobuf schemas without breaking existing consumers. This infrastructure addition provides a critical safety net for our event-driven architecture, validating payloads at the edge of each Bounded Context and integrating directly with our CI/CD pipelines to catch breaking schema changes before they reach production.

## CHANGE-004: Circular AI dependencies broken via async Kafka events

| Field | Value |
|-------|-------|
| Change ID | CHANGE-004 |
| Resolves | ISSUE-004 |
| Type | SPECIFICATION_CLARIFICATION |
| Priority | P0 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `AI_COPILOT_ENGINE.md` |
| ADR Reference | None |
| Resolution Summary | Refactored AI module interactions to eliminate circular dependencies by enforcing strictly asynchronous, event-driven communication via Kafka. |
| Impact on Existing Arch | Breaking |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
Several sub-modules within the AI Copilot Engine exhibited tight coupling and circular dependencies (e.g., Risk Agent depending on Strategy Agent, which in turn depended back on Risk Agent for scoring). This violated Clean Architecture principles and caused deadlock scenarios during high-load inference. The resolution mandates that all inter-agent communication must occur asynchronously via Kafka event streams. The Risk Agent now publishes `RiskScoreComputed` events, which the Strategy Agent consumes independently. This decoupling restores the unidirectional dependency flow and ensures that AI components can scale and fail independently without causing systemic cascading failures.

## CHANGE-005: FluxCD v2 standardized as GitOps tool, ArgoCD deprecated

| Field | Value |
|-------|-------|
| Change ID | CHANGE-005 |
| Resolves | ISSUE-005 |
| Type | DECISION |
| Priority | P2 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `DEPLOYMENT_STRATEGY.md` |
| ADR Reference | ADR-045 |
| Resolution Summary | Standardized all continuous deployment pipelines on FluxCD v2, explicitly deprecating ArgoCD to resolve documentation conflicts. |
| Impact on Existing Arch | None |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
Prior architectural documents contained conflicting directives, with some advocating for FluxCD and others for ArgoCD. To eliminate ambiguity, FluxCD v2 is now declared the singular, authoritative GitOps tool for the enterprise. The decision (formalized in ADR-045) was driven by FluxCD's superior native integration with Kubernetes CRDs, its lightweight controller architecture, and its seamless support for our multi-cluster Phase 2 GCC deployment strategy. All existing ArgoCD references in the repository have been expunged. Deployment manifests will be restructured into strict Kustomize overlays managed by Flux source controllers, ensuring 100% declarative state convergence.

## CHANGE-006: Capability-based AI SLAs replace impossible 800ms global SLO

| Field | Value |
|-------|-------|
| Change ID | CHANGE-006 |
| Resolves | ISSUE-006 |
| Type | DECISION |
| Priority | P1 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `PERFORMANCE_SLAS.md` |
| ADR Reference | ADR-043 |
| Resolution Summary | Replaced the unrealistic 800ms global latency requirement for all AI operations with a nuanced, capability-based 4-tier SLA system. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
The original mandate of an 800ms global SLO for all AI responses was fundamentally incompatible with tasks requiring deep reasoning or chain-of-thought processing. We have implemented a capability-based SLA framework comprising four tiers: Synchronous Realtime (<200ms for immediate validation), Synchronous Extended (<2000ms for standard queries), Background Precomputed (SLA applies to retrieval, not generation), and Async Learning (no hard latency bound, optimized for throughput). This classification allows engineering teams to appropriately size infrastructure and design UX paradigms (e.g., streaming responses vs. loading states) based on the specific cognitive demands of the AI task.

## CHANGE-007: Ground Truth Feedback Architecture documented

| Field | Value |
|-------|-------|
| Change ID | CHANGE-007 |
| Resolves | ISSUE-007 |
| Type | NEW_DOCUMENT |
| Priority | P1 |
| Status | RESOLVED |
| Documents Created | `GROUND_TRUTH_ARCHITECTURE.md` |
| Documents Updated | None |
| ADR Reference | ADR-042 |
| Resolution Summary | Designed and documented a systemic feedback loop to capture real market outcomes for evaluating and retraining AI advisory models. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
An AI system without a feedback loop cannot improve and degrades over time as market regimes shift. To address this, we have architected the Ground Truth Feedback System (ADR-042). This component operates as an asynchronous worker that observes the AI's recommendations (e.g., trade signals) and correlates them with the actual market outturn over a predefined horizon (e.g., 5-day directional outcome on the EGX). These correlated pairs (Prediction + Actual Outcome) are stored in a specialized Qdrant collection, serving as a high-quality dataset for continuous RLHF (Reinforcement Learning from Human Feedback) and automated model fine-tuning.

## CHANGE-008: EventStoreDB delivery path clarified — Option A adopted

| Field | Value |
|-------|-------|
| Change ID | CHANGE-008 |
| Resolves | ISSUE-008 |
| Type | SPECIFICATION_CLARIFICATION |
| Priority | P1 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `EVENT_SOURCING_STRATEGY.md` |
| ADR Reference | None |
| Resolution Summary | Resolved ambiguity regarding EventStoreDB integration by mandating "Option A": direct appending to EventStoreDB with Kafka bridging via catch-up subscriptions. |
| Impact on Existing Arch | None |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
The architecture previously presented two conflicting paths for event sourcing: writing to Kafka first then syncing to EventStoreDB, or vice versa. We have decisively adopted "Option A". All domain events must be appended directly to EventStoreDB to guarantee absolute consistency and optimistic concurrency control at the aggregate root level. Subsequently, EventStoreDB catch-up subscriptions act as the singular mechanism to publish these committed events onto Kafka topics for cross-boundary integration. This enforces a strict single source of truth for the write model while leveraging Kafka's robust consumer group semantics for the read models.

## CHANGE-009: Inter-service ServiceAccount JWT auth specified

| Field | Value |
|-------|-------|
| Change ID | CHANGE-009 |
| Resolves | ISSUE-009 |
| Type | SPECIFICATION_CLARIFICATION |
| Priority | P1 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `SECURITY_ARCHITECTURE.md` |
| ADR Reference | None |
| Resolution Summary | Specified the use of short-lived, centrally minted JWTs bound to Kubernetes ServiceAccounts for all synchronous inter-service communication. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
Security audit revealed a lack of explicit authentication mechanisms for internal microservice-to-microservice calls, relying too heavily on network perimeter defense. We have mandated an explicit Zero Trust architecture where every internal API call must carry a JWT token. These tokens are generated by an internal OIDC provider, tied to the caller's Kubernetes ServiceAccount, and possess a maximum lifespan of 15 minutes. The API Gateway and internal sidecars will validate these JWTs using locally cached JWKS public keys. This ensures strict authorization controls and non-repudiation for internal system commands.

## CHANGE-010: Qdrant tenant isolation via tenant_id filter mandated

| Field | Value |
|-------|-------|
| Change ID | CHANGE-010 |
| Resolves | ISSUE-010 |
| Type | DECISION |
| Priority | P0 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `VECTOR_DATABASE_STRATEGY.md` |
| ADR Reference | None |
| Resolution Summary | Mandated logical multi-tenancy in Qdrant by requiring a mandatory `tenant_id` payload filter on all read and write operations. |
| Impact on Existing Arch | None |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
To support scalable multi-tenancy without the overhead of provisioning thousands of physical Qdrant collections, we are adopting logical isolation. Every vector embedding inserted into Qdrant must include a `tenant_id` in its metadata payload. Furthermore, all search queries issued by the AI Gateway must programmatically inject a strict filter matching the authenticated user's `tenant_id`. This pattern is enforced at the Data Access Layer (DAL) to prevent cross-tenant data leakage. It optimizes RAM utilization in the vector database while maintaining strict regulatory compliance for data isolation.

## CHANGE-011: Qdrant collection ownership partition defined

| Field | Value |
|-------|-------|
| Change ID | CHANGE-011 |
| Resolves | ISSUE-011 |
| Type | SPECIFICATION_CLARIFICATION |
| Priority | P2 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `VECTOR_DATABASE_STRATEGY.md` |
| ADR Reference | None |
| Resolution Summary | Defined clear boundaries for Qdrant collection ownership, mapping specific collections exclusively to their corresponding Bounded Contexts. |
| Impact on Existing Arch | None |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
Unregulated access to vector collections risks violating domain boundaries and creating hidden dependencies. We have codified the partition of Qdrant collections. The `KnowledgeBase` BC owns the collections related to regulatory documents and standard operating procedures. The `UserIntelligence` BC owns the user preference and trading behavior embeddings. The `MarketAnalysis` BC owns technical indicator and macro-economic embeddings. No BC is permitted to directly query another BC's vector collection; all cross-boundary semantic searches must be exposed via well-defined REST or gRPC APIs over the network.

## CHANGE-012: AI endpoint rate limits added (5/20/100/unlimited per tier)

| Field | Value |
|-------|-------|
| Change ID | CHANGE-012 |
| Resolves | ISSUE-012 |
| Type | DECISION |
| Priority | P1 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `API_GATEWAY_CONFIG.md` |
| ADR Reference | None |
| Resolution Summary | Implemented strict rate limiting on all AI inference endpoints, categorized by user subscription tiers to prevent resource exhaustion. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
Unbounded access to computationally expensive LLM endpoints poses a severe Denial of Wallet (DoW) and infrastructure stability risk. We have instituted a 4-tier rate limiting policy enforced at the API Gateway level using Redis-backed token buckets. Free users are limited to 5 complex inference requests per hour; Standard users to 20; Pro users to 100; and Enterprise users possess unlimited access subject to fair use anomaly detection. This ensures equitable resource distribution and protects the core trading infrastructure from being starved by compute-heavy AI tasks.

## CHANGE-013: Phase 1→2 migration architecture specified

| Field | Value |
|-------|-------|
| Change ID | CHANGE-013 |
| Resolves | ISSUE-013 |
| Type | NEW_DOCUMENT |
| Priority | P2 |
| Status | RESOLVED |
| Documents Created | `MIGRATION_STRATEGY_P1_P2.md` |
| Documents Updated | None |
| ADR Reference | None |
| Resolution Summary | Detailed the architectural roadmap and data migration strategies for transitioning from the Phase 1 monolithic data models to the Phase 2 multi-region deployment. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
The transition from our initial launch phase to the GCC multi-region expansion requires careful planning to avoid downtime. We have drafted a comprehensive migration specification. It details the Strangler Fig pattern application for extracting remaining legacy modules, the establishment of cross-region Kafka MirrorMaker 2 replication links, and the protocol for migrating localized user data to geographically compliant data centers. It also mandates backward compatibility of all internal APIs during the transition window, ensuring zero disruption to existing trading operations.

## CHANGE-014: EGX historical data bootstrap specified

| Field | Value |
|-------|-------|
| Change ID | CHANGE-014 |
| Resolves | ISSUE-014 |
| Type | SPECIFICATION_CLARIFICATION |
| Priority | P2 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `DATA_INGESTION_PIPELINE.md` |
| ADR Reference | None |
| Resolution Summary | Formalized the process and data schema for bootstrapping the system with 10 years of historical EGX market data. |
| Impact on Existing Arch | None |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
To train the initial quantitative models and backtesting engines, the system requires a massive influx of historical data. We have defined the bootstrap procedure, detailing the ETL pipelines required to ingest 10 years of Egyptian Exchange (EGX) tick data, corporate actions, and end-of-day summaries. The specification outlines the cleansing heuristics for handling missing ticks and the parallel loading strategy into TimeScaleDB to optimize index rebuilding. This historical dataset is immutable and serves as the foundational corpus for all backtesting scenarios.

## CHANGE-015: BDUF risk acknowledged; CI incremental build strategy defined

| Field | Value |
|-------|-------|
| Change ID | CHANGE-015 |
| Resolves | ISSUE-015 |
| Type | DECISION |
| Priority | P1 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `CI_CD_PIPELINE.md` |
| ADR Reference | None |
| Resolution Summary | Mitigated "Big Design Up Front" risks by enforcing an agile, incremental CI build strategy powered by Turborepo remote caching. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
The exhaustive architectural planning phase risked falling into the BDUF (Big Design Up Front) anti-pattern, potentially delaying actual implementation. We acknowledge this risk and have pivoted the CI/CD pipeline to support extreme iterative development. We have specified an incremental build strategy utilizing Turborepo. By leveraging content-addressable remote caching, the CI pipeline will only build and test the specific micro-frontends and backend services affected by a commit. This drastically reduces feedback loops, encouraging smaller, more frequent commits and aligning with Agile delivery principles.

## CHANGE-016: Order Management BC Phase 1 paper-only constraint added

| Field | Value |
|-------|-------|
| Change ID | CHANGE-016 |
| Resolves | ISSUE-016 |
| Type | SPECIFICATION_CLARIFICATION |
| Priority | P0 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `ORDER_MANAGEMENT_BC.md` |
| ADR Reference | None |
| Resolution Summary | Constrained the Order Management Bounded Context to exclusively execute paper trades (simulated) during Phase 1 to mitigate financial risk. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
Integrating directly with live brokerage APIs in Phase 1 presents an unacceptable risk profile given the novelty of the AI Copilot Engine. We have imposed a hard constraint on the Order Management Bounded Context: all order executions in Phase 1 must be routed to the internal Paper Trading Simulator. The interface to the execution venue remains identical, but the implementation is stubbed. This allows us to test the entire end-to-end event flow, latency, and AI recommendation accuracy in a completely risk-free environment before pursuing regulatory approval for live money execution in Phase 2.

## CHANGE-017: Walk-forward backtesting mandate added with cost model

| Field | Value |
|-------|-------|
| Change ID | CHANGE-017 |
| Resolves | ISSUE-017 |
| Type | DECISION |
| Priority | P2 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `BACKTESTING_ENGINE.md` |
| ADR Reference | None |
| Resolution Summary | Mandated walk-forward optimization techniques for all backtesting pipelines and integrated strict cost modeling (slippage and fees). |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
Standard backtesting often leads to curve-fitting and over-optimism. We now mandate walk-forward backtesting methodologies, ensuring that models are continuously trained on a sliding window of historical data and validated on out-of-sample forward windows. Furthermore, the backtesting engine must strictly incorporate a realistic cost model, accounting for EGX clearing fees, broker commissions, and volume-weighted slippage estimates. Any trading strategy proposed by the AI that fails to demonstrate profitability net of these conservative cost estimates will be automatically rejected.

## CHANGE-018: Kafka event envelope split (5-field for ticks, 19-field for domain)

| Field | Value |
|-------|-------|
| Change ID | CHANGE-018 |
| Resolves | ISSUE-018 |
| Type | SPECIFICATION_CLARIFICATION |
| Priority | P1 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `EVENT_ARCHITECTURE.md` |
| ADR Reference | None |
| Resolution Summary | Split the Kafka event envelope specification into a lightweight 5-field schema for high-throughput market ticks and a rich 19-field schema for complex domain events. |
| Impact on Existing Arch | Breaking |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
A unified event envelope for all messages proved disastrous for performance. Forcing high-frequency market tick data (millions of events per second) to carry heavy distributed tracing and correlation metadata (19 fields) saturated the network. We have bifurcated the envelope standard. The "Tick Envelope" is a highly optimized 5-field byte array designed for maximum throughput in TimeScaleDB ingestion. The "Domain Envelope" retains the comprehensive 19-field structure (including causation IDs, tenant contexts, and JWT claims) required for orchestrating complex sagas across the microservices landscape.

## CHANGE-019: Arabic RTL financial localization spec added to Frontend Arch

| Field | Value |
|-------|-------|
| Change ID | CHANGE-019 |
| Resolves | ISSUE-019 |
| Type | DOCUMENT_UPDATE |
| Priority | P2 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `FRONTEND_ARCHITECTURE.md` |
| ADR Reference | None |
| Resolution Summary | Added comprehensive specifications for Arabic Right-To-Left (RTL) localization, focusing on financial data formatting and charting. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
Operating in the MENA region requires flawless Arabic language support. We have updated the Frontend Architecture to explicitly mandate CSS Logical Properties (e.g., `margin-inline-start`) instead of physical properties to seamlessly support LTR/RTL switching. Furthermore, the specification details the localization of financial data: numbers must respect Eastern Arabic numeral preferences based on locale, and time-series charts must ensure that the X-axis (time) always flows logically (oldest to newest) regardless of the RTL text direction surrounding it, preventing cognitive dissonance for traders.

## CHANGE-020: Plugin Architecture Phase 1 scope bounded

| Field | Value |
|-------|-------|
| Change ID | CHANGE-020 |
| Resolves | ISSUE-020 |
| Type | SPECIFICATION_CLARIFICATION |
| Priority | P2 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `ARCHITECTURE.md` |
| ADR Reference | None |
| Resolution Summary | Bounded the scope of the Plugin Architecture for Phase 1 to read-only technical indicators, deferring execution-capable plugins to Phase 2. |
| Impact on Existing Arch | None |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
The original vision for a fully extensible plugin architecture presented immense security and complexity risks for Phase 1. We have severely bounded this scope. In Phase 1, the Plugin Architecture is restricted exclusively to read-only WebAssembly modules that calculate custom technical indicators based on market data streams. These plugins operate in a strict sandbox with zero network access and cannot emit trading signals or modify state. Full execution-capable plugins (e.g., custom automated trading bots) are explicitly deferred to Phase 2, pending the implementation of a robust capability-based security model.

## CHANGE-021: External AI API key governance added to Security Arch

| Field | Value |
|-------|-------|
| Change ID | CHANGE-021 |
| Resolves | ISSUE-021 |
| Type | DOCUMENT_UPDATE |
| Priority | P0 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `SECURITY_ARCHITECTURE.md` |
| ADR Reference | None |
| Resolution Summary | Established strict governance, rotation policies, and HashiCorp Vault integration for managing external AI API keys (e.g., OpenAI, Anthropic). |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
The proliferation of external AI API keys across different developer environments created a massive exfiltration risk. We have centralized the governance of all external AI credentials. Keys must be stored exclusively in HashiCorp Vault. The LLM Gateway (introduced in ADR-041) is the only component authorized to retrieve these keys. Application code never sees the raw API key. Furthermore, the Security Architecture now mandates automated key rotation every 30 days and strict anomaly detection on billing usage to detect potential credential compromise immediately.

## CHANGE-022: Valkey version pinned to 8.0+

| Field | Value |
|-------|-------|
| Change ID | CHANGE-022 |
| Resolves | ISSUE-022 |
| Type | SPECIFICATION_CLARIFICATION |
| Priority | P2 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `DATA_INFRASTRUCTURE.md` |
| ADR Reference | None |
| Resolution Summary | Pinned the version of our in-memory data store to Valkey 8.0+ to ensure access to the latest performance optimizations and licensing clarity. |
| Impact on Existing Arch | None |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
Following the licensing changes to Redis, we have strategically migrated our in-memory caching and transient state layers to Valkey (the open-source fork). To guarantee stability and prevent regressions, the infrastructure specification explicitly pins the deployment to Valkey version 8.0 or higher. This version provides necessary enhancements in multi-threading and cluster stability critical for our high-frequency rate-limiting and session management use cases. The migration path is transparent to application developers due to absolute API compatibility.

## CHANGE-023: Monorepo Turborepo incremental build strategy specified

| Field | Value |
|-------|-------|
| Change ID | CHANGE-023 |
| Resolves | ISSUE-023 |
| Type | DECISION |
| Priority | P2 |
| Status | RESOLVED |
| Documents Created | None |
| Documents Updated | `REPOSITORY_BLUEPRINT.md` |
| ADR Reference | None |
| Resolution Summary | Specified the internal dependency graph and caching rules for Turborepo to optimize build times in the enterprise monorepo. |
| Impact on Existing Arch | Additive |
| DDD Compatibility | ✅ Preserved |
| Constitutional Compliance | ✅ Compliant |

**Detailed Description:**
The consolidation of backend services and frontend applications into a single monorepo resulted in unacceptably long CI build times. We have fully specified the Turborepo configuration, explicitly defining the dependency graph between shared libraries (e.g., UI components, common validation logic) and the deployable applications. By strictly mapping inputs and outputs for each build phase and enabling Vercel Remote Caching, we guarantee that the CI pipeline avoids redundant work, ensuring that a change in a leaf node service only triggers a localized build and test cycle, restoring developer velocity.

---
**End of Document**
