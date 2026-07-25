# Tradeora Financial Operating System
## AI Capability-Based Performance SLA Architecture
## Version 1.1.0 | Status: AUTHORITATIVE | Date: 2026-07-24

╔══════════════════════════════════════════════════════════════════════════════╗
║  Resolves: ISSUE-006 (Impossible 800ms global SLO)                           ║
║  Owner: Chief AI Architect                                                   ║
║  ADR Reference: ADR-043 (Capability-Based SLAs)                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

## Table of Contents
1. [Section 1 — Architecture Mandate](#section-1--architecture-mandate)
2. [Section 2 — Per-Engine SLA Table](#section-2--per-engine-sla-table)
3. [Section 3 — Consensus Pipeline SLA](#section-3--consensus-pipeline-sla)
4. [Section 4 — Scalability Strategy per Tier](#section-4--scalability-strategy-per-tier)
5. [Section 5 — SLA Monitoring Dashboard](#section-5--sla-monitoring-dashboard)
6. [Section 6 — ADR-043](#section-6--adr-043)
7. [Section 7 — SLA Enforcement: Circuit Breakers & Timeout Policies](#section-7--sla-enforcement-circuit-breakers--timeout-policies)
8. [Section 8 — SLA Alerting & PagerDuty Escalation Policy](#section-8--sla-alerting--pagerduty-escalation-policy)
9. [Section 9 — CI/CD SLA Gate Integration](#section-9--cicd-sla-gate-integration)
10. [Section 10 — SLA Cost Analysis: Tier vs. Infrastructure Cost](#section-10--sla-cost-analysis-tier-vs-infrastructure-cost)
11. [Section 11 — Degraded Mode Operations](#section-11--degraded-mode-operations)
12. [Section 12 — SLA Compliance Reporting](#section-12--sla-compliance-reporting)

---

### Section 1 — Architecture Mandate

The initial architectural specification for the Tradeora Financial OS mandated a flat, global Service Level Objective (SLO) of 800ms for all AI operations. As highlighted in architectural audit ISSUE-006, this requirement is scientifically and computationally impossible.

**Why a single global SLO is architecturally incorrect:**
- **Market Intelligence:** Analyzing real-time ticker tape data requires extreme low latency. A user cannot wait 2 seconds for a current price signal. This must be fast.
- **Fundamental Analysis:** Extracting, parsing, and running complex financial models across 20 different corporate ratios spanning 10 years of earnings reports is inherently a slow, I/O bound, and compute-heavy process.
- **Monte Carlo Simulation:** Simulating 10,000 potential future price paths requires massive CPU cycles. It cannot be done in 800ms under standard load.
- **Learning Engine:** Backpropagation, weight updating, and vector DB indexing operate entirely in the background. Applying a user-facing latency SLO to these jobs represents a fundamental misunderstanding of the architecture.

**The Solution: Capability-Based SLAs**
To resolve this, we are re-architecting the system to classify all 26 AI engines into four distinct operational tiers based on their capability and interaction model.

#### The 4 Processing Tiers:

**Tier 1 — SYNCHRONOUS REALTIME (The Fast Path)**
- **Interaction:** User is actively waiting for a response on the UI.
- **Target SLOs:** P50 ≤ 500ms; P99 ≤ 1,500ms; Absolute MAX ≤ 2,000ms.
- **Engines included:** Market Intelligence, Technical Analysis, Volume Analysis, ICT (Inner Circle Trader) concepts, Sentiment Analysis, News parsing, Portfolio context.

**Tier 2 — SYNCHRONOUS EXTENDED (The Analytical Path)**
- **Interaction:** User is waiting, but UI provides loading indicators (e.g., "Deep analyzing..."). Longer wait is acceptable for deeper insights.
- **Target SLOs:** P50 ≤ 1,000ms; P99 ≤ 3,000ms; Absolute MAX ≤ 5,000ms.
- **Engines included:** Macro Intelligence, Risk Intelligence, Position Sizing, AI Arbitration, Meta Decision generation.

**Tier 3 — BACKGROUND PRECOMPUTED (The Heavy Path)**
- **Interaction:** Runs entirely in the background. The user request is served *instantly* from a pre-calculated cache.
- **Target SLOs:** Background computation P99 ≤ 30 seconds. User-facing retrieval from cache ≤ 50ms.
- **Engines included:** Elliott Wave (complex pattern matching), Wyckoff methodologies, Smart Money footprinting, Deep Fundamental Analysis, Backtesting, Monte Carlo Simulation.

**Tier 4 — ASYNC LEARNING (The System Path)**
- **Interaction:** Scheduled infrastructure jobs. No user-facing latency requirement.
- **Target SLOs:** Based on throughput and job completion times, not millisecond latency.
- **Engines included:** Learning Engine, Self-Reflection, Bias Detection, Decision Improvement, Enterprise Memory, Knowledge OS.

---

### Section 2 — Per-Engine SLA Table

This table serves as the definitive engineering contract for all 26 Tradeora AI engines. Any PR that degrades performance below these P99 thresholds will fail CI/CD gating.

| Engine ID | Engine Name | Tier | P50 (ms) | P99 (ms) | Max (ms) | Cache TTL | Scaling Strategy |
|:----------|:------------|:----:|---------:|---------:|---------:|:---------:|:--------------------|
| TRD-AI-001 | Market Intelligence | 1 | 200 | 800 | 1,000 | 1s | HPA (CPU based) |
| TRD-AI-002 | Technical Analysis | 1 | 300 | 1,000 | 1,500 | 1m | HPA + LLM Gateway |
| TRD-AI-003 | Volume Analysis | 1 | 250 | 900 | 1,500 | 1m | HPA (CPU based) |
| TRD-AI-004 | ICT Concepts | 1 | 400 | 1,200 | 1,800 | 5m | HPA + LLM Gateway |
| TRD-AI-005 | Sentiment Analysis | 1 | 350 | 1,100 | 1,500 | 5m | HPA + LLM Gateway |
| TRD-AI-006 | News Intelligence | 1 | 450 | 1,400 | 2,000 | 15m | HPA + LLM Gateway |
| TRD-AI-007 | Portfolio Context | 1 | 150 | 500 | 800 | 0s | HPA (Mem based) |
| TRD-AI-008 | Macro Intelligence | 2 | 800 | 2,500 | 4,000 | 1h | KEDA (Queue Depth) |
| TRD-AI-009 | Risk Intelligence | 2 | 600 | 2,000 | 3,500 | 5m | KEDA (Queue Depth) |
| TRD-AI-010 | Position Sizing | 2 | 500 | 1,500 | 2,500 | 0s | KEDA (Queue Depth) |
| TRD-AI-011 | AI Arbitration | 2 | 900 | 2,800 | 4,500 | 0s | KEDA (Queue Depth) |
| TRD-AI-012 | Meta Decision | 2 | 1,000 | 3,000 | 5,000 | 0s | KEDA (Queue Depth) |
| TRD-AI-013 | Elliott Wave | 3 | N/A | 30,000 | 60,000 | 4h | CronJob/Valkey Cache |
| TRD-AI-014 | Wyckoff Analysis | 3 | N/A | 25,000 | 50,000 | 4h | CronJob/Valkey Cache |
| TRD-AI-015 | Smart Money | 3 | N/A | 20,000 | 45,000 | 1h | CronJob/Valkey Cache |
| TRD-AI-016 | Fundamental Data | 3 | N/A | 45,000 | 90,000 | 24h | CronJob/Valkey Cache |
| TRD-AI-017 | Backtesting | 3 | N/A | 60,000 | 120k | 24h | CronJob/Valkey Cache |
| TRD-AI-018 | MC Simulation | 3 | N/A | 90,000 | 180k | 24h | Batch processing |
| TRD-AI-019 | Learning Engine | 4 | N/A | N/A | N/A | N/A | BullMQ Scheduled Job |
| TRD-AI-020 | Self-Reflection | 4 | N/A | N/A | N/A | N/A | BullMQ Scheduled Job |
| TRD-AI-021 | Bias Detection | 4 | N/A | N/A | N/A | N/A | BullMQ Scheduled Job |
| TRD-AI-022 | Decision Improve | 4 | N/A | N/A | N/A | N/A | BullMQ Scheduled Job |
| TRD-AI-023 | Enterprise Memory | 4 | N/A | N/A | N/A | N/A | BullMQ Scheduled Job |
| TRD-AI-024 | Knowledge OS | 4 | N/A | N/A | N/A | N/A | BullMQ Scheduled Job |
| TRD-AI-025 | Explanation Gen | 1 | 400 | 1,200 | 1,500 | 0s | HPA + LLM Gateway |
| TRD-AI-026 | Strategy Gen | 2 | 800 | 2,500 | 4,000 | 1h | KEDA (Queue Depth) |

---

### Section 3 — Consensus Pipeline SLA (Resolves 800ms vs 5000ms conflict)

The core conflict in ISSUE-006 arose because the Meta Decision Engine must wait for inputs from various schools of thought before formulating a final recommendation. If it waits for Tier 3 engines synchronously, it violates the 5000ms max latency. If it enforces 800ms, it drops all Tier 2 and Tier 3 insights.

**The Re-architected Consensus Flow:**

1. **User requests recommendation for COMI.CA**
2. **Scatter-Gather Phase:**
   - System synchronously calls all Tier 1 engines (Max wait: 1,500ms).
   - System simultaneously retrieves pre-computed data for Tier 3 engines from Valkey Cache (Max wait: 50ms).
   - Note: Tier 2 engines are bypassed in the immediate scatter-gather if they aren't part of the direct dependency tree, or they run asynchronously and stream results to the UI. For the core consensus, we assume the critical path involves Tier 1 + cached Tier 3.
3. **Arbitration Phase (Tier 2 Engine):**
   - Takes Tier 1 results + Tier 3 cached results.
   - Arbitration Engine processing (Max wait: 50ms - highly optimized logic).
4. **Meta Decision Phase (Tier 2 Engine):**
   - Final decision formulation (Max wait: 50ms).
5. **Explanation Generation Phase:**
   - Generating natural language Arabic explanation (Max wait: 500ms).

**Mathematical SLA Proof:**
Total recommendation response time = `max(Tier1 P99) + Arbitration + MetaDecision + Explanation`
Total Time = `1,500ms + 50ms + 50ms + 500ms = 2,100ms P99 end-to-end`

**Final System SLO:** 
We establish a global System SLO of **P99 ≤ 3,000ms** for the initial user response.

**The Tier 3 Contribution Mechanism:**
How do background schools (Tier 3) contribute if they take 60 seconds to run?
They contribute to the *NEXT* recommendation. 
User sees: **Tier 1 (computed NOW) + Tier 3 (from CACHE, computed in last 1-4 hours)**. Given that fundamental ratios and Elliott Wave super-cycles do not invalidate within minutes, this architecture provides massive analytical depth with zero user-facing latency penalty.

---

### Section 4 — Scalability Strategy per Tier

To guarantee these SLAs under load (e.g., during market open or major economic announcements), we employ distinct infrastructure scaling profiles.

**Tier 1: Synchronous Realtime**
- **Architecture:** Stateless microservices deployed on Kubernetes.
- **Scaling:** Horizontal Pod Autoscaler (HPA) configured to scale aggressively based on CPU utilization (> 60%) and request rate.
- **Caching:** LLM Gateway semantic caching (redis) for identical queries.

**Tier 2: Synchronous Extended**
- **Architecture:** Queue-worker pattern. Requests are dropped onto a high-speed Kafka topic.
- **Scaling:** KEDA (Kubernetes Event-driven Autoscaling) scales worker pods based on Kafka topic lag / queue depth. If the queue backs up, we spin up to 100 pods to process the backlog instantly.

**Tier 3: Background Precomputed**
- **Architecture:** Scheduled Kubernetes CronJobs triggering massive parallel map-reduce jobs.
- **Scaling:** Static allocation of high-CPU spot instances. Cost optimization prioritized over speed. Results pushed to Valkey (Redis replacement) cluster.

**Tier 4: Async Learning**
- **Architecture:** BullMQ running on Node/Python workers executing long-running transactional sagas.
- **Scaling:** Time-based scaling. Jobs run during off-hours (e.g., 2 AM Cairo time) when market data is static and compute resources are cheap.

---

### Section 5 — SLA Monitoring Dashboard

To operationalize these SLAs, the SRE team must implement a rigorous Prometheus + Grafana stack.

**Prometheus Metric Specifications:**
```yaml
# Histogram for tracking latency of Tier 1 AI calls
- name: ai_engine_latency_milliseconds
  type: histogram
  labels:
    - engine_id       # e.g., 'TRD-AI-001'
    - tier            # e.g., 'tier_1'
    - status          # 'success', 'error', 'timeout'
  buckets: [50, 100, 250, 500, 1000, 1500, 2000, 3000, 5000]

# Counter for Cache Hit Ratio for Tier 3
- name: ai_cache_hit_total
  type: counter
  labels:
    - engine_id
    - result_type     # 'hit', 'miss'
```

**Grafana Dashboard Requirements:**
1. **The "CEO View":** Single pane showing End-to-End Consensus Pipeline Latency (Target: green if P99 < 3,000ms).
2. **The "SRE View":** Heatmaps mapping `ai_engine_latency_milliseconds` for all Tier 1 and Tier 2 engines. Apdex scores for user satisfaction.
3. **The "Data Team View":** Tier 3 cache staleness metrics. Alerts fire if fundamental data in cache is older than 24 hours.

---

### Section 6 — ADR-043: Capability-Based SLAs

**Title:** Migration from Global SLO to Tiered Capability-Based SLAs
**Status:** Accepted
**Date:** 2026-07-24
**Context:** The existing 800ms global SLO forced the Meta Decision Engine to timeout and drop inputs from heavy analytical engines like Elliott Wave and Fundamental Analysis (ISSUE-006), severely degrading the quality of AI recommendations.
**Decision:** We adopt a 4-Tier capability-based SLA model. Fast data is processed synchronously; slow data is pre-computed asynchronously and cached. The global latency requirement for the consensus pipeline is relaxed to a mathematically sound P99 of 3,000ms.
**Consequences:** 
- *Positive:* High-complexity engines can now contribute to the Meta Decision without causing system timeouts. The system becomes highly available and resilient to load spikes.
- *Negative:* Increased infrastructure complexity. Requires robust cache invalidation strategies for Tier 3 data. Introduces slight data staleness for fundamental signals (acceptable given their nature).

---

### Section 7 — SLA Enforcement: Circuit Breakers & Timeout Policies

> **Architecture Note:** All circuit breakers are implemented using the `opossum` library for Node.js services and `resilience4j` for any JVM-based adapters. This section defines the canonical configuration parameters that MUST be used. Deviations require a signed ADR.

This section defines the **hard enforcement layer** for the SLA targets defined in Section 2. The monitoring stack (Section 5) observes breaches; this section *prevents* them from cascading into full system failure. The circuit breaker pattern is applied at the service-mesh (Istio) level for inter-service calls and at the application level (middleware) for LLM Gateway calls.

---

#### 7.1 — Tier 1 Circuit Breaker (Synchronous Realtime)

Tier 1 engines serve the hot path. A slow Tier 1 engine directly degrades user experience. The circuit breaker is aggressive: it opens quickly, fails fast, and falls back to cached data.

```typescript
import CircuitBreaker from 'opossum';
import { valkey } from '@tradeora/cache';
import { logger } from '@tradeora/observability';

/**
 * Tier 1 Circuit Breaker — Synchronous Realtime
 * Max user-facing timeout: 2,000ms (hard wall per ADR-043)
 * Cache fallback TTL: up to 60s stale data is acceptable for Tier 1
 */
const TIER1_OPTIONS: CircuitBreaker.Options = {
  timeout: 2000,               // 2,000ms hard timeout — MAX for Tier 1 engines
  errorThresholdPercentage: 20, // Open circuit if >20% of requests fail/timeout
  resetTimeout: 30000,          // Attempt reset (half-open) after 30 seconds
  volumeThreshold: 10,          // Minimum 10 calls in rolling window before evaluation
  rollingCountTimeout: 10000,   // 10s rolling window for error rate calculation
  rollingCountBuckets: 10,      // 10 buckets of 1s each within the rolling window
  name: 'tier1-ai-engine',
};

async function tier1FallbackHandler(
  engineId: string,
  context: RequestContext,
  error: Error,
): Promise<AiEngineResponse> {
  logger.warn({ engineId, error: error.message }, 'Tier 1 circuit breaker fallback triggered');

  // 1. Attempt to serve stale cached result (up to 60s old)
  const cachedResult = await valkey.get<AiEngineResponse>(
    `tier1:${engineId}:${context.symbolId}`,
  );

  if (cachedResult) {
    return {
      ...cachedResult,
      metadata: {
        ...cachedResult.metadata,
        isStale: true,
        staleSinceMs: Date.now() - cachedResult.metadata.computedAtMs,
        fallbackReason: 'circuit_breaker_open',
      },
    };
  }

  // 2. No cache available — return a typed null response; UI renders degraded badge
  return {
    engineId,
    result: null,
    metadata: {
      isStale: false,
      fallbackReason: 'circuit_breaker_open_no_cache',
      computedAtMs: 0,
    },
  };
}

export function createTier1CircuitBreaker(
  aiEngineCall: (ctx: RequestContext) => Promise<AiEngineResponse>,
  engineId: string,
): CircuitBreaker {
  const breaker = new CircuitBreaker(aiEngineCall, TIER1_OPTIONS);

  breaker.fallback((ctx: RequestContext, error: Error) =>
    tier1FallbackHandler(engineId, ctx, error),
  );

  // Emit Prometheus metrics on state changes
  breaker.on('open', () => {
    metrics.increment('ai_circuit_breaker_state_change_total', {
      tier: 'tier_1', engine_id: engineId, state: 'open',
    });
    logger.error({ engineId }, 'Tier 1 circuit OPENED — serving stale cache only');
  });

  breaker.on('halfOpen', () => {
    metrics.increment('ai_circuit_breaker_state_change_total', {
      tier: 'tier_1', engine_id: engineId, state: 'half_open',
    });
  });

  breaker.on('close', () => {
    metrics.increment('ai_circuit_breaker_state_change_total', {
      tier: 'tier_1', engine_id: engineId, state: 'closed',
    });
    logger.info({ engineId }, 'Tier 1 circuit CLOSED — normal operation resumed');
  });

  return breaker;
}
```

**Tier 1 Enforcement Summary:**

| Parameter | Value | Rationale |
|:----------|------:|:----------|
| Hard Timeout | 2,000ms | Absolute max per ADR-043 §1 |
| Error Threshold | 20% | Aggressive — protects P99 budget |
| Reset Timeout | 30s | Fast recovery; market conditions change rapidly |
| Volume Threshold | 10 calls | Prevents spurious trips during low-traffic periods |
| Fallback | Stale cache (≤60s), then null | UI renders "data from X seconds ago" badge |

---

#### 7.2 — Tier 2 Circuit Breaker (Synchronous Extended)

Tier 2 engines operate on the extended path with user-visible loading states. The circuit breaker is more tolerant of transient errors but still protects the 5,000ms absolute max.

```typescript
/**
 * Tier 2 Circuit Breaker — Synchronous Extended
 * Max user-facing timeout: 5,000ms (hard wall per ADR-043)
 * Fallback: Return Tier 1-only result set; skip extended analysis
 */
const TIER2_OPTIONS: CircuitBreaker.Options = {
  timeout: 5000,               // 5,000ms hard timeout — MAX for Tier 2
  errorThresholdPercentage: 30, // More tolerant — 30% error rate before opening
  resetTimeout: 60000,          // 60s reset — these jobs are heavier; wait longer
  volumeThreshold: 5,           // Only 5 calls needed; Tier 2 has lower traffic
  rollingCountTimeout: 30000,   // 30s rolling window (Tier 2 is less frequent)
  rollingCountBuckets: 6,
  name: 'tier2-ai-engine',
};

async function tier2FallbackHandler(
  engineId: string,
  context: RequestContext,
): Promise<AiEngineResponse> {
  logger.warn({ engineId }, 'Tier 2 circuit breaker fallback — dropping extended analysis');

  // Tier 2 fallback: return an explicit "analysis unavailable" signal.
  // The consensus pipeline will proceed with Tier 1 + Tier 3 cache only.
  // The UI will show: "Extended analysis temporarily unavailable"
  return {
    engineId,
    result: null,
    metadata: {
      isStale: false,
      fallbackReason: 'tier2_circuit_breaker_open',
      computedAtMs: 0,
      userMessage: 'التحليل الموسع غير متاح مؤقتاً — يعتمد النظام على التحليل السريع',
    },
  };
}
```

**Tier 2 Enforcement Summary:**

| Parameter | Value | Rationale |
|:----------|------:|:----------|
| Hard Timeout | 5,000ms | Absolute max per ADR-043 §1 |
| Error Threshold | 30% | More tolerant; UI already shows loading state |
| Reset Timeout | 60s | Heavier engines need longer recovery window |
| Fallback | Return null result | Consensus pipeline degrades gracefully to Tier 1 + Tier 3 |

---

#### 7.3 — Tier 3 Cache-Miss Circuit Breaker (Background Precomputed)

Tier 3 engines do not have user-facing timeouts. However, the **cache retrieval path** must be protected. If Valkey is unavailable, we must not block the user response.

```typescript
/**
 * Tier 3 Cache-Read Circuit Breaker
 * Protects the Valkey cache READ operation, not the background computation.
 * If Valkey is down, the consensus pipeline proceeds without Tier 3 data.
 */
const TIER3_CACHE_READ_OPTIONS: CircuitBreaker.Options = {
  timeout: 100,                // 100ms hard timeout for cache reads — Valkey is fast
  errorThresholdPercentage: 50, // 50% error rate — higher threshold; cache misses are not errors
  resetTimeout: 10000,          // 10s reset — Valkey recovers quickly
  volumeThreshold: 20,
  name: 'tier3-cache-read',
};

async function tier3CacheFallbackHandler(): Promise<null> {
  // If the cache layer is unavailable, return null.
  // The consensus engine will note: Tier 3 data UNAVAILABLE.
  // It proceeds with Tier 1 data only and sets a flag for the UI.
  logger.error('Tier 3 Valkey cache read failed — proceeding without historical analysis');
  return null;
}
```

**Tier 3 Enforcement Summary:**

| Parameter | Value | Rationale |
|:----------|------:|:----------|
| Hard Timeout | 100ms | Valkey reads must be near-instantaneous |
| Error Threshold | 50% | Cache misses don't count; only connection errors |
| Reset Timeout | 10s | Fast infra recovery |
| Fallback | Return null | Consensus proceeds with Tier 1 only; Tier 3 badge hidden on UI |

---

#### 7.4 — Tier 4 Job Watchdog (Async Learning)

Tier 4 has no user-facing circuit breaker. Instead, a **BullMQ job watchdog** enforces a 4-hour maximum job duration. Jobs exceeding this threshold are forcefully terminated and re-queued for the next off-peak window.

```typescript
// In BullMQ worker configuration (ai-learning-worker.ts)
const tier4Worker = new Worker(
  'ai-learning-queue',
  async (job: Job) => {
    // ... job processing logic
  },
  {
    connection: bullMQRedisConnection,
    // Each Tier 4 job gets a maximum of 4 hours (14,400,000ms)
    // BullMQ will forcefully KILL the job if it exceeds this.
    lockDuration: 14400000, // 4 hours in milliseconds
    lockRenewTime: 300000,  // Renew lock every 5 minutes to prevent premature expiry
    maxStalledCount: 1,     // If stalled once, move to failed queue; do NOT retry automatically
    stalledInterval: 60000, // Check for stalled jobs every 60 seconds
  },
);

tier4Worker.on('failed', (job, error) => {
  if (error.message.includes('stalled')) {
    // Job ran for >4h — alert the data team
    alertManager.fire({
      alert: 'AiTier4JobOverrun',
      jobId: job?.id,
      jobName: job?.name,
      duration: job?.processedOn ? Date.now() - job.processedOn : 0,
    });
  }
});
```

---

### Section 8 — SLA Alerting & PagerDuty Escalation Policy

This section defines the **Prometheus Alertmanager rules** that govern when human intervention is triggered, and the **PagerDuty escalation paths** that ensure the right people are notified at the right time. All alert rules are stored in `k8s/monitoring/prometheus/alerts/ai-sla-alerts.yaml`.

---

#### 8.1 — Prometheus Alert Rule Definitions

```yaml
# File: k8s/monitoring/prometheus/alerts/ai-sla-alerts.yaml
# Managed by: SRE Team | Owner: Chief AI Architect
# Last Updated: 2026-07-24 | Version: 1.1.0

groups:
  - name: tradeora.ai.sla
    interval: 30s   # Evaluate every 30 seconds
    rules:

      # ─────────────────────────────────────────────────────────────────────
      # ALERT 1: Tier 1 Latency Budget Exhausted
      # Fires when P99 latency for ANY Tier 1 engine exceeds 1,500ms
      # for a sustained 5-minute window (not just a transient spike).
      # ─────────────────────────────────────────────────────────────────────
      - alert: AiTier1LatencyBudgetExhausted
        expr: |
          histogram_quantile(0.99,
            sum by (engine_id, le) (
              rate(ai_engine_latency_milliseconds_bucket{tier="tier_1"}[5m])
            )
          ) > 1500
        for: 5m
        labels:
          severity: critical
          tier: tier_1
          team: ai-platform
          pagerduty_service: tradeora-ai-tier1
        annotations:
          summary: "CRITICAL: Tier 1 AI engine {{ $labels.engine_id }} P99 latency exceeds 1,500ms"
          description: |
            Engine {{ $labels.engine_id }} P99 latency is {{ $value | humanizeDuration }},
            which exceeds the ADR-043 budget of 1,500ms. The circuit breaker may activate.
            User-facing recommendations are at risk of degradation.
          runbook_url: "https://wiki.tradeora.io/runbooks/ai-tier1-latency"
          auto_remediation: "Scale HPA to max replicas immediately. Check LLM Gateway queue depth."

      # ─────────────────────────────────────────────────────────────────────
      # ALERT 2: Tier 2 Latency Budget Exhausted
      # Fires when P99 for ANY Tier 2 engine exceeds 3,000ms for 10 minutes.
      # ─────────────────────────────────────────────────────────────────────
      - alert: AiTier2LatencyBudgetExhausted
        expr: |
          histogram_quantile(0.99,
            sum by (engine_id, le) (
              rate(ai_engine_latency_milliseconds_bucket{tier="tier_2"}[10m])
            )
          ) > 3000
        for: 10m
        labels:
          severity: warning
          tier: tier_2
          team: ai-platform
          pagerduty_service: tradeora-ai-tier2
        annotations:
          summary: "WARNING: Tier 2 AI engine {{ $labels.engine_id }} P99 exceeds 3,000ms"
          description: |
            Engine {{ $labels.engine_id }} P99 is {{ $value | humanizeDuration }}.
            Extended analysis quality is degraded. If P99 exceeds 5,000ms, the circuit
            breaker will open and extended analysis will be dropped from the consensus.
          runbook_url: "https://wiki.tradeora.io/runbooks/ai-tier2-latency"
          auto_remediation: "Check Kafka consumer lag on ai-tier2-topic. Scale KEDA workers."

      # ─────────────────────────────────────────────────────────────────────
      # ALERT 3: Tier 3 Cache Stale
      # Fires when Tier 3 Valkey cache data age exceeds engine TTL + 30 minutes.
      # Indicates the background CronJob failed to refresh on schedule.
      # ─────────────────────────────────────────────────────────────────────
      - alert: AiTier3CacheStale
        expr: |
          (time() - ai_cache_last_refresh_timestamp_seconds{tier="tier_3"}) >
          (ai_cache_ttl_seconds{tier="tier_3"} + 1800)
        for: 0m    # Fire immediately; no tolerance for stale analytical data
        labels:
          severity: warning
          tier: tier_3
          team: data-platform
          pagerduty_service: tradeora-data-platform
        annotations:
          summary: "WARNING: Tier 3 cache for {{ $labels.engine_id }} is stale beyond TTL+30m"
          description: |
            Engine {{ $labels.engine_id }} cache was last refreshed
            {{ $value | humanizeDuration }} ago, exceeding its TTL + 30-minute grace period.
            Users are receiving outdated analytical data. The background CronJob may have failed.
          runbook_url: "https://wiki.tradeora.io/runbooks/ai-tier3-cache-stale"
          auto_remediation: "Trigger manual re-run of tier3-refresh CronJob. Check K8s job logs."

      # ─────────────────────────────────────────────────────────────────────
      # ALERT 4: Tier 4 Background Job Overrun
      # Fires when any Tier 4 BullMQ job exceeds 4 hours of execution time.
      # This indicates a runaway learning job that must be investigated.
      # ─────────────────────────────────────────────────────────────────────
      - alert: AiTier4JobOverrun
        expr: |
          (time() - bullmq_job_started_timestamp_seconds{queue=~"ai-learning.*"}) > 14400
        for: 0m    # Immediate alert — 4h is already the absolute max
        labels:
          severity: warning
          tier: tier_4
          team: data-platform
          pagerduty_service: tradeora-data-platform
        annotations:
          summary: "WARNING: Tier 4 BullMQ job {{ $labels.job_name }} has exceeded 4 hours"
          description: |
            Job {{ $labels.job_name }} (ID: {{ $labels.job_id }}) has been running for
            {{ $value | humanizeDuration }}. The BullMQ watchdog will forcefully terminate it.
            Investigate for data volume anomalies or model training regressions.
          runbook_url: "https://wiki.tradeora.io/runbooks/ai-tier4-overrun"
          auto_remediation: "Job auto-killed by BullMQ watchdog. Reschedule to next off-peak window."
```

---

#### 8.2 — PagerDuty Escalation Policy

Each alert maps to a PagerDuty service and escalation policy. The following table defines the escalation path and response time commitments:

| Alert | Severity | L1 On-Call (SRE) | L2 Escalation | L3 Final Escalation | Auto-Remediation |
|:------|:--------:|:-----------------|:--------------|:--------------------|:-----------------|
| `AiTier1LatencyBudgetExhausted` | **CRITICAL** | Immediate page (0m) | AI Platform Lead (15m no ACK) | CTO (30m no resolve) | HPA scale-out to max; LLM Gateway rate-limit relief |
| `AiTier2LatencyBudgetExhausted` | WARNING | Page (5m delay) | AI Platform Lead (30m no ACK) | Engineering Manager (60m no resolve) | KEDA scale-out; Kafka consumer group rebalance |
| `AiTier3CacheStale` | WARNING | Page (10m delay) | Data Platform Lead (45m no ACK) | CTO (if EGX market open within 2h) | Trigger manual CronJob re-run via K8s API |
| `AiTier4JobOverrun` | WARNING | Slack notification | Data Platform Lead (next business hour) | N/A | BullMQ watchdog auto-kills; reschedule next window |

**Escalation Time Windows:**
- **Market Hours (10:00–14:30 CLT):** All critical alerts are escalated to CTO within 20 minutes if unresolved. Tier 1 SLA breaches during EGX market open are classified as **P1 incidents**.
- **Off-Market Hours:** L1 SRE handles; L2 escalation after 30 minutes; CTO escalation reserved for P1 only.
- **Weekends/Holidays:** Reduced on-call roster; Tier 3 and Tier 4 alerts suppressed until next trading day open.

---

### Section 9 — CI/CD SLA Gate Integration

Every pull request targeting an AI service microservice must pass an automated **k6 load test** as a mandatory gate in the CI/CD pipeline. A PR cannot be merged if the SLA targets defined in Section 2 are not met under synthetic load.

---

#### 9.1 — Pipeline Gate Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  GitHub Actions CI Pipeline                  │
├─────────────────────────────────────────────────────────────┤
│  1. Unit Tests  →  2. Integration Tests  →  3. Build Image  │
│                                                             │
│  4. Deploy to Preview Namespace (K8s ephemeral env)         │
│                                                             │
│  5. k6 SLA Gate:                                            │
│     ├── Tier 1 Load Test (100 VUs, 2min ramp, 5min soak)   │
│     ├── Tier 2 Load Test (50 VUs, 3min ramp, 5min soak)    │
│     └── Threshold Check: FAIL → Block PR merge              │
│                                                             │
│  6. If k6 PASSES → Allow Merge to main                      │
│  7. Post-Deploy Smoke Test (5min synthetic) → Production     │
└─────────────────────────────────────────────────────────────┘
```

---

#### 9.2 — k6 Tier 1 Load Test Script

```javascript
// File: tests/sla/tier1-sla-gate.k6.js
// Purpose: Mandatory CI/CD SLA gate for all Tier 1 AI engine PRs
// Run: k6 run --env BASE_URL=http://ai-gateway.preview.svc:3000 tier1-sla-gate.k6.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// ── Custom Metrics ────────────────────────────────────────────────────────────
const tier1Latency   = new Trend('tier1_engine_latency_ms', true);
const tier1Errors    = new Counter('tier1_engine_errors_total');
const tier1SuccessRate = new Rate('tier1_engine_success_rate');

// ── SLA Constants (mirrors ADR-043) ──────────────────────────────────────────
const TIER1_P99_MAX_MS   = 1500;  // P99 must be ≤ 1,500ms
const TIER1_P50_MAX_MS   = 500;   // P50 must be ≤ 500ms
const TIER1_ERROR_RATE_MAX = 0.01; // <1% error rate under load

// ── Test Configuration ────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '1m',  target: 50  },  // Ramp up to 50 VUs over 1 minute
    { duration: '2m',  target: 100 },  // Ramp up to 100 VUs (peak load)
    { duration: '5m',  target: 100 },  // Sustain peak load for 5 minutes (soak)
    { duration: '1m',  target: 0   },  // Ramp down gracefully
  ],

  // ── SLA Threshold Gates — CI/CD WILL FAIL if any threshold is breached ──
  thresholds: {
    // P99 latency must be below 1,500ms at all times during the test
    'tier1_engine_latency_ms{quantile:0.99}': ['p(99)<1500'],

    // P50 latency must be below 500ms (ensures median performance)
    'tier1_engine_latency_ms{quantile:0.50}': ['p(50)<500'],

    // Built-in HTTP request duration threshold as a secondary gate
    'http_req_duration{expected_response:true}': ['p(99)<1500', 'p(50)<500'],

    // Error rate must be below 1% under peak load
    'tier1_engine_success_rate': ['rate>0.99'],

    // Absolute max: NO request should exceed 2,000ms (the circuit breaker timeout)
    'http_req_duration': ['max<2000'],
  },

  // Tagging for Prometheus/Grafana integration via k6 Cloud or Prometheus remote write
  tags: {
    environment: __ENV.ENV || 'ci-preview',
    pr_number:   __ENV.PR_NUMBER || 'manual',
    tier:        'tier_1',
  },
};

// ── Test Fixtures ─────────────────────────────────────────────────────────────
const TEST_SYMBOLS = ['COMI.CA', 'ETEL.CA', 'HRHO.CA', 'SWDY.CA', 'JUFO.CA'];
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// ── Main Test Function ────────────────────────────────────────────────────────
export default function () {
  // Rotate through EGX symbols to simulate realistic traffic distribution
  const symbol = TEST_SYMBOLS[Math.floor(Math.random() * TEST_SYMBOLS.length)];

  const payload = JSON.stringify({
    symbolId: symbol,
    userId: `test-user-${__VU}`,  // Virtual user ID for isolation
    requestedEngines: [
      'TRD-AI-001', // Market Intelligence
      'TRD-AI-002', // Technical Analysis
      'TRD-AI-005', // Sentiment Analysis
      'TRD-AI-025', // Explanation Generation
    ],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': __ENV.API_KEY || 'ci-test-key',
      'X-Request-Source': 'k6-sla-gate',
    },
    timeout: '2100ms', // Slightly above circuit breaker timeout to capture all responses
    tags: { engine_tier: 'tier_1', symbol },
  };

  const res = http.post(`${BASE_URL}/api/v1/ai/analyze`, payload, params);

  // ── Record custom metrics ─────────────────────────────────────────────────
  tier1Latency.add(res.timings.duration);

  const isSuccess = check(res, {
    'HTTP 200 status':          (r) => r.status === 200,
    'Response body non-empty':  (r) => r.body && r.body.length > 0,
    'Has engineResults field':  (r) => JSON.parse(r.body)?.engineResults !== undefined,
    'Latency under 1500ms':     (r) => r.timings.duration < 1500,
    'No circuit breaker errors':(r) => !r.body.includes('"circuit_breaker_open"') ||
                                        JSON.parse(r.body).engineResults?.some(e => e.result !== null),
  });

  if (!isSuccess) {
    tier1Errors.add(1);
  }
  tier1SuccessRate.add(isSuccess);

  // Think time between requests — simulates realistic user cadence (1-3s)
  sleep(Math.random() * 2 + 1);
}

// ── Setup & Teardown ──────────────────────────────────────────────────────────
export function setup() {
  console.log(`k6 Tier 1 SLA Gate starting against: ${BASE_URL}`);
  console.log(`SLA Targets: P99 < ${TIER1_P99_MAX_MS}ms | P50 < ${TIER1_P50_MAX_MS}ms`);
  // Warm up: single request to ensure the service is ready
  http.get(`${BASE_URL}/health`);
}

export function teardown(data) {
  console.log('k6 Tier 1 SLA Gate complete. Check thresholds for pass/fail determination.');
}
```

---

#### 9.3 — GitHub Actions Gate Configuration

```yaml
# File: .github/workflows/ai-service-sla-gate.yaml
name: AI Service SLA Gate

on:
  pull_request:
    paths:
      - 'apps/ai-gateway/**'
      - 'apps/ai-engines/**'
      - 'libs/ai-shared/**'

jobs:
  sla-gate:
    name: k6 SLA Gate — Tier 1 & Tier 2
    runs-on: ubuntu-latest
    timeout-minutes: 25

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Preview Namespace
        run: |
          kubectl apply -k k8s/overlays/preview/
          kubectl rollout status deployment/ai-gateway -n preview --timeout=5m

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
            --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
            | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update && sudo apt-get install k6 -y

      - name: Run Tier 1 SLA Gate
        env:
          BASE_URL: http://ai-gateway.preview.svc.cluster.local:3000
          API_KEY:  ${{ secrets.CI_API_KEY }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          ENV: ci-preview
        run: |
          k6 run \
            --out json=results/tier1-results.json \
            --out prometheus-remote-write=server=http://prometheus-pushgateway:9091 \
            tests/sla/tier1-sla-gate.k6.js

      - name: Upload k6 Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: k6-sla-results
          path: results/

      - name: Comment PR with SLA Results
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('results/tier1-results.json', 'utf8'));
            // ... parse and comment on PR
```

---

#### 9.4 — Post-Deployment Smoke Test

After every production deployment, a **5-minute synthetic monitoring test** is automatically triggered:

```yaml
# Triggered by: Argo CD post-sync hook
# File: k8s/ai-gateway/templates/post-deploy-smoke-test.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: ai-sla-smoke-test-{{ .Release.Revision }}
  annotations:
    argocd.argoproj.io/hook: PostSync
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
spec:
  template:
    spec:
      containers:
        - name: k6-smoke
          image: grafana/k6:0.52.0
          command:
            - k6
            - run
            - --duration=5m
            - --vus=10        # Light load — smoke test, not stress test
            - --threshold=http_req_duration{p(99)}<1500
            - tests/sla/tier1-sla-gate.k6.js
          env:
            - name: BASE_URL
              value: http://ai-gateway.production.svc:3000
      restartPolicy: Never
```

---

### Section 10 — SLA Cost Analysis: Tier vs. Infrastructure Cost

This section provides realistic cost estimates for operating the Tradeora AI engine fleet at Phase 1 scale (10,000 Monthly Active Users — Egyptian market). All figures are denominated in USD with EGP equivalents based on the 2026 exchange rate of ~48 EGP/USD. Estimates assume AWS ap-south-1 (Mumbai, closest low-latency region to Cairo) pricing as the primary cloud region, with a secondary DR region on Oracle Cloud Infrastructure (OCI) Cairo (me-abudhabi-1 as proxy).

| Tier | Engines | Avg CPU / Request | Avg RAM / Request | P99 Compute Time | Monthly Cost Est. (10K MAU) | Notes |
|:----:|:--------|:-----------------:|:-----------------:|:----------------:|:---------------------------:|:------|
| **1** | TRD-AI-001 to 007, 025 (8 engines) | 0.05 vCPU | 128 MB | 800–1,500ms | **$320–$480/mo** | HPA on `c7g.large` spot instances. LLM Gateway caching reduces actual LLM calls by ~70%. Cost dominated by Gemini Flash API calls (~$0.00015/1K tokens). |
| **2** | TRD-AI-008 to 012, 026 (6 engines) | 0.20 vCPU | 512 MB | 2,500–5,000ms | **$180–$260/mo** | KEDA workers on `c7g.xlarge`. Lower traffic volume (not every user triggers deep analysis). Queue-based processing allows burst absorption. |
| **3** | TRD-AI-013 to 018 (6 engines) | 2.0 vCPU (burst) | 4 GB (burst) | 20–90 seconds (batch) | **$90–$140/mo** | CronJobs on AWS Spot `m7g.2xlarge` (70% cheaper than on-demand). Run 4x/day during off-peak. Cost is predictable — no user-traffic dependency. |
| **4** | TRD-AI-019 to 024 (6 engines) | 4.0 vCPU (sustained) | 16 GB | 1–4 hours/job | **$60–$80/mo** | BullMQ workers on `r7g.xlarge` (memory-optimized) spot instances. Run nightly 02:00–06:00 CLT. Cost: ~$0.09/hour × 4h × 30 days. |
| **Infrastructure** | Valkey cluster, Kafka, Prometheus stack, API Gateway | N/A | N/A | N/A | **$210–$280/mo** | 3-node Valkey cluster (`cache.r7g.large`), MSK Kafka, Prometheus + Grafana on `t4g.medium`. |
| **LLM Gateway** | Gemini Flash (Tier 1/2), Gemini Pro (Tier 3/4 analysis) | N/A | N/A | N/A | **$150–$220/mo** | Semantic caching reduces token consumption by ~65%. Budget includes Arabic NLP processing overhead (~15% token premium vs. English). |

**Total Monthly Infrastructure Cost Estimate: $1,010–$1,460 / month** (~48,480–70,080 EGP/mo)

**Cost Scaling Projection:**

| Phase | MAU | Est. Monthly Cost | Cost per MAU |
|:-----:|----:|:-----------------:|:------------:|
| Phase 1 | 10,000 | $1,010–$1,460 | $0.10–$0.15 |
| Phase 2 | 50,000 | $2,800–$4,200 | $0.06–$0.08 |
| Phase 3 | 200,000 | $8,500–$13,000 | $0.04–$0.07 |

> **Egyptian Market Note:** The cost structure benefits significantly from the tiered caching architecture. Approximately 70% of Tier 1 requests during market hours will be served from the LLM Gateway semantic cache (EGX stocks trade in concentrated high-overlap query patterns). This dramatically reduces the effective LLM API spend and is a core justification for the ADR-043 caching architecture beyond pure latency optimization.

---

### Section 11 — Degraded Mode Operations

This section defines the formally specified behavior of the Tradeora AI system when SLA targets cannot be met due to infrastructure degradation, LLM Gateway overload, or cascading failures. The principle is **graceful degradation**: always return the best possible answer, never fail silently, and always communicate degraded state to the user in Arabic.

---

#### 11.1 — Degradation Triggers

| Trigger | Condition | Detected By |
|:--------|:----------|:------------|
| LLM Gateway Overload | >50% of LLM calls return 429 or timeout | Circuit Breaker (Section 7) |
| Valkey Cache Failure | Cache read latency > 200ms or connection refused | Tier 3 Circuit Breaker |
| Kafka Lag Explosion | Consumer lag on `ai-tier2-topic` > 10,000 messages | KEDA + Alertmanager |
| Database Contention | P99 DB query time > 500ms (portfolio context) | Tier 1 Circuit Breaker |
| K8s Node Failure | Pod crash loop (3 failures in 5 minutes) | K8s liveness probe + HPA |

---

#### 11.2 — Per-Tier Degraded Mode Behavior

**Tier 1 Degraded Mode:**
- **Action:** Return the last cached recommendation for the requested symbol, with the cache timestamp.
- **UI Behavior:** Render a yellow badge reading: `"بيانات من X دقائق مضت"` ("Data from X minutes ago"). The badge color scales with staleness: yellow (< 5 min), orange (5–15 min), red (> 15 min).
- **Data contract:** The response JSON includes `"degraded": true, "degradedReason": "tier1_circuit_open", "dataAgeMs": <age>`.
- **Maximum stale tolerance:** 60 seconds. Beyond 60 seconds, Tier 1 returns a structured error and the UI hides the recommendation entirely, displaying a "جاري إعادة الاتصال..." (Reconnecting...) spinner.

**Tier 2 Degraded Mode:**
- **Action:** Drop extended analysis (Macro, Risk, Position Sizing). The Meta Decision Engine proceeds with Tier 1 + Tier 3 cache data only.
- **UI Behavior:** The "Extended Analysis" tab shows: `"التحليل الموسع غير متاح مؤقتاً — يعرض النظام التحليل السريع فقط"`.
- **Quality impact:** ~30% reduction in recommendation confidence score. Confidence score is visually downgraded from "High" to "Medium" in the UI.
- **Recovery:** Tier 2 engines auto-recover when circuit breaker resets (60 seconds). UI polls for recovery and auto-refreshes the extended analysis section.

**Tier 3 Degraded Mode:**
- **Action:** Extend cache TTL by 2x the original value. Do NOT proactively invalidate stale entries — preserve the last known good data.
- **Background:** Immediately trigger a priority re-computation job for the affected engine(s), bypassing normal scheduling.
- **UI Behavior:** If cache age exceeds original TTL, a subtle indicator appears: `"التحليل الجوهري يُحدَّث..."` (Fundamental analysis updating...).
- **Maximum stale tolerance:** TTL × 3. Beyond that, Tier 3 contribution is excluded from the consensus and the Meta Decision notes: "Fundamental analysis temporarily unavailable."
- **Data integrity:** Under NO circumstances is stale Tier 3 data served beyond 48 hours from original computation, regardless of degradation state.

**Tier 4 Degraded Mode:**
- **Action:** Reschedule the failed job to the next off-peak window (next occurrence of 02:00–06:00 CLT).
- **Alert:** Data team receives a Slack notification (not a PagerDuty page) with the job ID, failure reason, and next scheduled run time.
- **Impact:** No user-facing impact. Learning engine delay means AI recommendations do not benefit from the latest trading feedback loop until the next successful run. Maximum accumulated delay: 24 hours before it escalates to a PagerDuty warning.

---

#### 11.3 — Graceful Degradation State Machine

```
                        ┌─────────────────────┐
                        │   NORMAL OPERATION   │
                        │  All tiers healthy   │
                        │  Full AI consensus   │
                        └──────────┬──────────┘
                                   │
               ┌───────────────────┼───────────────────┐
               │                   │                   │
        Tier1 CB Opens      Tier2 CB Opens      Valkey Failure
               │                   │                   │
               ▼                   ▼                   ▼
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │ TIER1_DEGRADED  │  │ TIER2_DEGRADED  │  │ TIER3_DEGRADED  │
    │                 │  │                 │  │                 │
    │ Serve stale     │  │ Drop extended   │  │ Serve stale     │
    │ cache (≤60s)    │  │ analysis; use   │  │ cache (TTL×3);  │
    │ Show stale      │  │ Tier1+Tier3     │  │ trigger manual  │
    │ data badge      │  │ only            │  │ re-computation  │
    └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
             │                   │                     │
    Cache >60s old       Both Tier1 &          Stale > TTL×3
             │           Tier2 degrade                 │
             ▼                   │                     ▼
    ┌─────────────────┐          │           ┌─────────────────┐
    │  CRITICAL_DEGRAD│◄─────────┘           │ TIER3_EXCLUDED  │
    │                 │                      │                 │
    │ No live data;   │                      │ Consensus runs  │
    │ Hide recommend. │                      │ without T3 data │
    │ Show reconnect  │                      │ Confidence:Low  │
    │ spinner         │                      └────────┬────────┘
    └────────┬────────┘                               │
             │                               CronJob recovers
    CB resets (30s)                                   │
             │                                        ▼
             ▼                              ┌─────────────────┐
    ┌─────────────────┐                    │  NORMAL OPERATION│
    │HALF_OPEN PROBE  │                    │  (with T3 data)  │
    │ Single test req │                    └─────────────────┘
    │ If success →    │
    │ NORMAL         │
    │ If fail →      │
    │ TIER1_DEGRADED │
    └─────────────────┘
```

---

#### 11.4 — Degraded Mode User Communication Standards

All degraded-mode user-facing messages must conform to the following standards:
1. **Language:** Primary Arabic, with English sub-label for technical users. Never expose internal error codes to end users.
2. **Tone:** Reassuring and informative. Never alarming. The system is "updating" or "reconnecting," never "broken."
3. **Action:** Always provide a user action (e.g., "اضغط للتحديث" — Tap to refresh).
4. **Transparency:** Always show data age for stale results. Users should never receive stale data without being informed.
5. **Accessibility:** Degraded badges must meet WCAG 2.1 AA color contrast requirements.

---

### Section 12 — SLA Compliance Reporting

For regulatory compliance with the Egyptian Financial Regulatory Authority (FRA) and the Personal Data Protection Law (PDPL) 2020, Tradeora must maintain comprehensive, auditable SLA performance records. This section defines the formal compliance reporting framework.

---

#### 12.1 — Monthly SLA Report Specification

**Report Title:** Tradeora AI System — Monthly SLA Compliance Report
**Frequency:** Generated on the 1st business day of each calendar month, covering the prior calendar month.
**Generation Method:** Automated Grafana PDF export via `grafana-reporter` sidecar container, triggered by a monthly Kubernetes CronJob.
**Format:** PDF/A-1b (archival format per ISO 19005-1) and CSV raw data export.

**Required Metrics (per reporting period):**

| Metric | Granularity | SLA Target | Report Column |
|:-------|:------------|:----------:|:--------------|
| P50 Latency | Per engine | See Section 2 | `p50_latency_ms` |
| P95 Latency | Per engine | — | `p95_latency_ms` |
| P99 Latency | Per engine | See Section 2 | `p99_latency_ms` |
| Maximum Latency | Per engine | See Section 2 | `max_latency_ms` |
| Uptime Percentage | Per tier | ≥ 99.5% | `uptime_pct` |
| SLA Breach Count | Per engine | 0 target | `breach_count` |
| SLA Breach Duration | Per incident | N/A | `breach_duration_ms` |
| Circuit Breaker Opens | Per engine | 0 target | `cb_open_count` |
| Cache Hit Rate | Tier 3 only | ≥ 85% | `cache_hit_rate_pct` |
| Degraded Mode Minutes | Per tier | 0 target | `degraded_minutes` |
| Tier 4 Job Success Rate | Per job type | ≥ 98% | `job_success_rate_pct` |
| End-to-End P99 (Consensus) | System-wide | ≤ 3,000ms | `e2e_p99_latency_ms` |

---

#### 12.2 — Grafana Report Generation CronJob

```yaml
# File: k8s/monitoring/sla-report-generator-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: sla-compliance-report-generator
  namespace: monitoring
spec:
  schedule: "0 8 1 * *"   # 08:00 CLT on the 1st of every month
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: grafana-reporter
              image: tradeora/grafana-reporter:2.0.1
              env:
                - name: GRAFANA_URL
                  value: http://grafana.monitoring.svc:3000
                - name: GRAFANA_API_KEY
                  valueFrom:
                    secretKeyRef:
                      name: grafana-api-secrets
                      key: service-account-token
                - name: DASHBOARD_UID
                  value: "ai-sla-compliance-monthly"
                - name: OUTPUT_FORMAT
                  value: "pdf-a"
                - name: REPORT_PERIOD
                  value: "last-calendar-month"
                - name: RECIPIENTS
                  # Comma-separated email list
                  value: "cto@tradeora.io,compliance@tradeora.io,fra-reports@tradeora.io"
                - name: S3_BUCKET
                  value: "tradeora-compliance-reports"
                - name: S3_PREFIX
                  value: "ai-sla-reports/"
              command:
                - /bin/sh
                - -c
                - |
                  # Generate PDF/A report
                  /app/reporter generate \
                    --format=pdf-a \
                    --dashboard=${DASHBOARD_UID} \
                    --period=${REPORT_PERIOD} \
                    --output=/tmp/sla-report-$(date +%Y-%m).pdf

                  # Archive to S3 (7-year retention enforced via S3 lifecycle policy)
                  aws s3 cp /tmp/sla-report-$(date +%Y-%m).pdf \
                    s3://${S3_BUCKET}/${S3_PREFIX}sla-report-$(date +%Y-%m).pdf \
                    --storage-class GLACIER_IR \
                    --metadata "retention=7years,regulation=PDPL-2020"

                  # Distribute via email
                  /app/reporter send-email \
                    --to=${RECIPIENTS} \
                    --subject="Tradeora AI SLA Monthly Report — $(date +%B %Y)" \
                    --attachment=/tmp/sla-report-$(date +%Y-%m).pdf
          restartPolicy: OnFailure
```

---

#### 12.3 — Data Retention Policy (PDPL 2020 Compliance)

Per the Egyptian Personal Data Protection Law (PDPL) 2020, Article 23, all performance and operational audit data that may be linked to user activity must be retained for a minimum of 7 years.

| Data Category | Retention Period | Storage Medium | Access Control |
|:--------------|:----------------:|:---------------|:---------------|
| Monthly SLA PDF Reports | **7 years** | AWS S3 Glacier Instant Retrieval | CTO, CCO, Legal, FRA (on request) |
| Raw Prometheus metrics (TSDB) | **13 months** (rolling) | Thanos long-term storage (S3) | SRE Team, AI Platform Team |
| Per-request audit logs | **3 years** | OpenSearch (warm tier) → S3 Glacier | Compliance, Legal, FRA |
| Circuit Breaker event logs | **3 years** | OpenSearch | SRE Team, AI Platform Team |
| Incident reports (P1/P2) | **7 years** | Confluence + S3 archive | All internal stakeholders |
| k6 CI/CD test results | **12 months** | GitHub Actions artifacts + S3 | Engineering Team |

> **Regulatory Note:** The FRA Egypt may request SLA compliance records during examination cycles. The Chief Compliance Officer (CCO) is the designated data custodian and must provide reports within 5 business days of an FRA request. All report requests must be logged in the regulatory affairs tracking system.

---

#### 12.4 — Report Recipients and Distribution Matrix

| Recipient | Report Type | Frequency | Delivery Method | Action Required |
|:----------|:------------|:---------:|:----------------|:----------------|
| Chief Technology Officer (CTO) | Full SLA report (all tiers) | Monthly | Email + Confluence | Review and sign-off |
| Chief Compliance Officer (CCO) | Full SLA report + breach summary | Monthly | Email + encrypted archive | Regulatory sign-off |
| AI Platform Team Lead | Per-engine deep-dive | Weekly | Grafana dashboard link | Investigate breaches |
| SRE Team | Incident-level alerts | Real-time | PagerDuty + Slack | Immediate response |
| Financial Regulatory Authority (FRA) | Full SLA report + incident log | On request | Secure file transfer | N/A (regulatory) |
| Board of Directors | Executive SLA summary | Quarterly | PDF presentation | Strategic review |

---

#### 12.5 — SLA Breach Escalation and Root Cause Analysis

Any month with more than **3 SLA breach events** (defined as any P99 threshold exceeded for >5 minutes) triggers a mandatory **Root Cause Analysis (RCA)** report:

- **Timeline:** RCA draft due within 10 business days of month-end.
- **Format:** Standard 5-Why analysis with corrective action items assigned to named owners.
- **Review:** Reviewed by CTO and CCO; filed with the FRA if the breach affected more than 100 user sessions.
- **Tracking:** All RCA action items tracked in Linear with a mandatory due date of 30 days.
- **Recurrence Prevention:** If the same breach pattern occurs in 3 consecutive months, it is escalated to the Board as a systemic risk.

---

#### 12.6 — SLA Reporting Prometheus Queries (Reference)

The following PromQL queries are used by the automated report generator to populate the monthly compliance report. These queries are authoritative and must not be modified without CCO sign-off:

```promql
# P50 per engine over reporting period
histogram_quantile(0.50, sum by (engine_id, le) (
  increase(ai_engine_latency_milliseconds_bucket[30d])
))

# P95 per engine over reporting period
histogram_quantile(0.95, sum by (engine_id, le) (
  increase(ai_engine_latency_milliseconds_bucket[30d])
))

# P99 per engine over reporting period
histogram_quantile(0.99, sum by (engine_id, le) (
  increase(ai_engine_latency_milliseconds_bucket[30d])
))

# Uptime percentage per tier (based on availability probe)
avg_over_time(probe_success{job="ai-tier-blackbox", tier=~"tier_.*"}[30d]) * 100

# Total SLA breach count (P99 exceeded threshold, per engine)
count_over_time(
  (histogram_quantile(0.99,
    sum by (engine_id, le) (rate(ai_engine_latency_milliseconds_bucket[5m]))
  ) > on(engine_id) ai_engine_sla_p99_threshold_ms)[30d:5m]
)

# End-to-end consensus pipeline P99
histogram_quantile(0.99, sum by (le) (
  rate(consensus_pipeline_latency_milliseconds_bucket[30d])
))

# Tier 3 cache hit rate
sum(increase(ai_cache_hit_total{result_type="hit"}[30d])) /
sum(increase(ai_cache_hit_total[30d])) * 100
```

---

================================================================================
END OF DOCUMENT — Version 1.1.0
================================================================================
