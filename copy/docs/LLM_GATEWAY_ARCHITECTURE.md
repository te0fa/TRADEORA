# Tradeora Financial Operating System
## Enterprise LLM Gateway Architecture
## Version 1.0.0 | Status: AUTHORITATIVE | Date: 2026-07-24

╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Resolves: ISSUE-002 (Ollama scalability), ISSUE-006 (AI SLO)               ║
║  Owner: Chief AI Architect                                                   ║
║  Constitutional Reference: Articles 6, 17, 29 (OSS-first)                  ║
║  ADR Reference: ADR-041 (LLM Provider Abstraction)                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

## Section 1 — Architectural Mandate

The Tradeora Financial Operating System (TFOS) relies upon a sophisticated network of 26 specialized AI engines to provide real-time market intelligence, portfolio analysis, and risk management. Initially, these engines were tightly coupled directly to a local Ollama instance for inference. This architecture presents a significant scalability cliff and violates core principles of provider independence, cost control, and performance guarantees.

### 1.1 The Necessity of Provider Abstraction
To ensure TFOS can scale gracefully from hundreds to millions of concurrent users without inference bottlenecks, provider abstraction is non-negotiable. Direct dependency on any single provider (even an open-source one like Ollama) limits our ability to route traffic intelligently, leverage heterogeneous compute environments, and maintain strict SLAs during peak market hours. By introducing an Enterprise LLM Gateway, we decouple the AI engines from the underlying inference hardware and provider APIs, enabling seamless scalability, automated failover, and granular cost controls.

### 1.2 The Golden Rule
**Every AI engine MUST communicate only through the LLM Gateway. Zero direct provider calls.**
Under no circumstances shall any engine, microservice, or script within the Tradeora ecosystem instantiate a direct connection to a language model provider (e.g., Ollama, vLLM, OpenAI, DeepSeek). All traffic must transit through the LLM Gateway. This ensures consistent enforcement of caching policies, security constraints, and telemetry collection.

### 1.3 Constitutional Basis
This mandate is grounded in the foundational principles of the Tradeora Constitution:
*   **Article 29 (OSS-first):** The architecture inherently prioritizes open-source, locally hosted inference (e.g., Ollama, vLLM) for the vast majority of workloads, falling back to proprietary APIs only when strictly necessary or explicitly configured.
*   **Article 6 (Advisory-only):** The Gateway enforces the rule that AI outputs are advisory. By centralizing the inference pipeline, we can universally append necessary legal disclaimers and confidence scoring before responses reach the user interface.
*   **Article 3 (Extension over Modification):** The Gateway allows for the addition of new LLM providers without requiring any modifications to the 26 AI engines.

---

## Section 2 — LLM Gateway Architecture Overview

The following diagram illustrates the position of the LLM Gateway as the immutable architectural boundary between the Tradeora AI ecosystem and the physical/cloud inference providers.

```text
 AI Engine (TRD-AI-001) ──►┐
 AI Engine (TRD-AI-002) ──►│
 AI Engine (TRD-AI-003) ──►│
        ...                ├──► LLM GATEWAY ──► Provider Router ──►┬── Ollama (Primary, OSS)
 AI Engine (TRD-AI-024) ──►│    (Port 8080)   (LiteLLM-based)    ├── vLLM (Phase 2, OSS)
 AI Engine (TRD-AI-025) ──►│                                       ├── DeepSeek API (Fallback)
 AI Engine (TRD-AI-026) ──►┘                                       ├── OpenAI API (Emergency)
                                                                    ├── Gemini API (Enterprise)
                                                                    ├── Claude API (Safety check)
                                                                    ├── Grok API (Market sentiment)
                                                                    └── Future providers
```

The LLM Gateway exposes a unified, OpenAI-compatible API to all internal clients. It intercepts requests, applies caching logic, executes the routing strategy, and transparently multiplexes the workload across the available providers based on real-time health metrics, cost budgets, and data sensitivity requirements.

---

## Section 3 — Supported Providers

The LLM Gateway supports a tiered ecosystem of providers, balancing cost, performance, and data sovereignty.

### 3.1 Ollama (Local)
*   **Provider ID:** `ollama-local-01`
*   **Display Name:** Ollama (Primary Local Compute)
*   **Type:** LOCAL
*   **Priority/Tier:** Primary (Phase 1)
*   **OSS Compliance:** Yes (Article 29 compliant)
*   **Cost Model:** EGP "0.00" / 1K tokens (CapEx amortized)
*   **Latency Characteristics:** P50: 600ms / P99: 1500ms
*   **Max Context Window:** 8,192 tokens
*   **Recommended Use Cases:** Standard market analysis, non-sensitive summarization, bulk processing.
*   **Configuration Schema:** `{ baseUrl: string, model: string, numCtx: number }`
*   **PDPL 2020 Compliance:** Fully Compliant (Data does not leave Egypt)

### 3.2 vLLM (Local)
*   **Provider ID:** `vllm-local-01`
*   **Display Name:** vLLM (High-Throughput Local Compute)
*   **Type:** LOCAL
*   **Priority/Tier:** Primary (Phase 2)
*   **OSS Compliance:** Yes (Article 29 compliant)
*   **Cost Model:** EGP "0.00" / 1K tokens (CapEx amortized)
*   **Latency Characteristics:** P50: 80ms / P99: 200ms
*   **Max Context Window:** 32,768 tokens (PagedAttention enabled)
*   **Recommended Use Cases:** High-concurrency environments, continuous batching workloads, real-time trading signals.
*   **Configuration Schema:** `{ baseUrl: string, model: string, tensorParallelSize: number }`
*   **PDPL 2020 Compliance:** Fully Compliant (Data does not leave Egypt)

### 3.3 DeepSeek API
*   **Provider ID:** `deepseek-api-ext`
*   **Display Name:** DeepSeek Cloud API
*   **Type:** EXTERNAL
*   **Priority/Tier:** Fallback (Phase 1/2)
*   **OSS Compliance:** No (Proprietary API)
*   **Cost Model:** EGP "0.007" / 1K tokens
*   **Latency Characteristics:** P50: 400ms / P99: 1200ms
*   **Max Context Window:** 65,536 tokens
*   **Recommended Use Cases:** Cost-effective fallback during local capacity exhaustion, advanced Arabic NLP tasks.
*   **Configuration Schema:** `{ apiKey: secret, baseUrl: string, model: string }`
*   **PDPL 2020 Compliance:** **NOT COMPLIANT** (Cannot be used for PII or sensitive tenant data. Must pass PDPL check in router).

### 3.4 OpenAI API
*   **Provider ID:** `openai-api-ext`
*   **Display Name:** OpenAI Cloud API
*   **Type:** EXTERNAL
*   **Priority/Tier:** Emergency Fallback
*   **OSS Compliance:** No (Proprietary API)
*   **Cost Model:** EGP "0.24" / 1K tokens (USD pegged)
*   **Latency Characteristics:** P50: 300ms / P99: 800ms
*   **Max Context Window:** 128,000 tokens
*   **Recommended Use Cases:** Emergency capacity only, complex reasoning tasks requiring superior capabilities where local models fail.
*   **Configuration Schema:** `{ apiKey: secret, organizationId: string, model: string }`
*   **PDPL 2020 Compliance:** **NOT COMPLIANT** (Cannot be used for PII).

### 3.5 Google Gemini API
*   **Provider ID:** `gemini-api-ext`
*   **Display Name:** Google Gemini Enterprise API
*   **Type:** EXTERNAL
*   **Priority/Tier:** Enterprise Option (Phase 3)
*   **OSS Compliance:** No (Proprietary API)
*   **Cost Model:** EGP "0.15" / 1K tokens
*   **Latency Characteristics:** P50: 450ms / P99: 900ms
*   **Max Context Window:** 1,000,000+ tokens
*   **Recommended Use Cases:** Multimodal analysis (e.g., chart image parsing), massive context window document analysis.
*   **Configuration Schema:** `{ apiKey: secret, projectId: string, location: string, model: string }`
*   **PDPL 2020 Compliance:** **NOT COMPLIANT** (Requires Enterprise agreement for regional data residency).

### 3.6 Anthropic Claude API
*   **Provider ID:** `claude-api-ext`
*   **Display Name:** Anthropic Claude
*   **Type:** EXTERNAL
*   **Priority/Tier:** Safety & Verification Specialist
*   **OSS Compliance:** No (Proprietary API)
*   **Cost Model:** EGP "0.45" / 1K tokens
*   **Latency Characteristics:** P50: 500ms / P99: 1100ms
*   **Max Context Window:** 200,000 tokens
*   **Recommended Use Cases:** Strict compliance checking, conservative financial advice generation, highly nuanced logical verification.
*   **Configuration Schema:** `{ apiKey: secret, version: string, model: string }`
*   **PDPL 2020 Compliance:** **NOT COMPLIANT**.

### 3.7 Grok API (xAI)
*   **Provider ID:** `grok-api-ext`
*   **Display Name:** Grok (Market Sentiment)
*   **Type:** EXTERNAL
*   **Priority/Tier:** Sentiment Specialization
*   **OSS Compliance:** No (Proprietary API)
*   **Cost Model:** EGP "0.18" / 1K tokens
*   **Latency Characteristics:** P50: 350ms / P99: 850ms
*   **Max Context Window:** 131,072 tokens
*   **Recommended Use Cases:** Real-time social sentiment analysis, breaking news interpretation.
*   **Configuration Schema:** `{ apiKey: secret, model: string }`
*   **PDPL 2020 Compliance:** **NOT COMPLIANT**.

### 3.8 Local Custom Model
*   **Provider ID:** `custom-qwen-local`
*   **Display Name:** Enterprise Fine-tuned Qwen2.5
*   **Type:** LOCAL
*   **Priority/Tier:** Target (Phase 2)
*   **OSS Compliance:** Yes
*   **Cost Model:** EGP "0.00" / 1K tokens
*   **Latency Characteristics:** P50: 150ms / P99: 400ms
*   **Max Context Window:** 32,768 tokens
*   **Recommended Use Cases:** Highly specialized Tradeora-specific financial tasks, internal proprietary logic execution.
*   **Configuration Schema:** `{ baseUrl: string, modelPath: string }`
*   **PDPL 2020 Compliance:** Fully Compliant.

---

## Section 4 — LLM Gateway Internal Architecture

The LLM Gateway is designed around strongly typed interfaces to guarantee predictable behavior across the AI engine ecosystem. The following TypeScript definitions represent the core data structures for requests and responses.

```typescript
/**
 * Core Request Interface for the LLM Gateway
 */
interface LLMGatewayRequest {
  requestId: string;               // UUID for distributed tracing (e.g., Jaeger/Zipkin)
  engineId: string;                // Identifier of the calling engine (e.g., 'TRD-AI-014')
  prompt: string;                  // The primary user prompt or structured data input
  systemPrompt: string;            // The engine-specific system instructions
  maxTokens: number;               // Hard limit on generation length to control costs
  temperature: string;             // Decimal string (e.g., "0.7") governing creativity
  topP: string;                    // Decimal string (e.g., "0.9") for nucleus sampling
  timeout: number;                 // Maximum allowable latency in milliseconds
  priority: 'REALTIME' | 'BACKGROUND' | 'BATCH'; // Influences routing decisions
  requiredCapabilities: string[];  // e.g., ['ARABIC', 'FINANCIAL', 'REASONING']
  tenantId: string;                // Multi-tenant isolation and billing attribution
  userId?: string;                 // Required for requests involving PII for audit purposes
  pdplSensitive: boolean;          // CRITICAL: If true, routing is restricted to LOCAL providers only
}

/**
 * Core Response Interface from the LLM Gateway
 */
interface LLMGatewayResponse {
  requestId: string;               // Matches the incoming requestId
  provider: string;                // Which provider successfully fulfilled the request
  model: string;                   // The specific model version used (e.g., 'llama3:8b-instruct')
  content: string;                 // The generated text payload
  tokensUsed: number;              // Total tokens (prompt + completion) consumed
  latencyMs: number;               // End-to-end processing time
  cost: string;                    // Decimal string, calculated cost in EGP (e.g., "0.0125")
  confidence: string;              // Decimal string [0.00-1.00] estimating output reliability
  cached: boolean;                 // True if served from Valkey cache, skipping inference
  cacheKey?: string;               // The SHA-256 key used for retrieval (if cached)
}
```

---

## Section 5 — Provider Routing Strategy

The `ProviderRouter` is the intelligent core of the LLM Gateway. It evaluates every incoming request against a strict set of rules to determine the optimal execution path.

### 5.1 Routing Algorithm Rules

1.  **PDPL Check (Strict Sovereignty Enforcement):**
    *   If `request.pdplSensitive === true` OR the `tenantId` requires localized processing due to Egyptian PII regulations, the router MUST select a provider with `Type: LOCAL` (e.g., Ollama or vLLM).
    *   If local providers are unavailable, the request MUST be rejected with a `451 Unavailable For Legal Reasons` equivalent error. Data must never spill over to external APIs.
2.  **Priority Routing:**
    *   `REALTIME`: Routed to the fastest available provider meeting capabilities. In Phase 2, this favors vLLM.
    *   `BACKGROUND`: Optimized for cost/quality balance. May utilize queued local processing or cheap external APIs (if PDPL allows).
    *   `BATCH`: Strictly routed to the most cost-effective local provider during off-peak hours to maximize hardware utilization.
3.  **Circuit Breaker Mechanism:**
    *   Monitors provider health continuously.
    *   If a provider fails 3 consecutive requests (e.g., timeouts, 5xx errors), the circuit transitions to `OPEN`.
    *   Traffic is immediately diverted to the next tier in the fallback chain.
    *   A probe request is sent every 60 seconds (`HALF_OPEN` state) to check if the provider has recovered.
4.  **Fallback Chain:**
    *   **Phase 1:** Ollama -> (If PDPL false) -> DeepSeek -> (If emergency) -> OpenAI
    *   **Phase 2:** vLLM -> Ollama -> (If PDPL false) -> DeepSeek -> OpenAI
5.  **Cost Cap Enforcement:**
    *   Maintains a real-time tally of expenditures per provider per month.
    *   If the projected cost of a request exceeds the remaining budget (configured in EGP), the provider is temporarily marked unavailable, forcing a fallback to a cheaper or local alternative.

### 5.2 Implementation Blueprint

```typescript
// Provider selection algorithm blueprint
class ProviderRouter {
  
  public selectProvider(request: LLMGatewayRequest): Provider {
    // 1. Strict PDPL enforcement
    if (request.pdplSensitive) {
        const localProvider = this.getHealthyLocalProvider(request);
        if (!localProvider) {
            throw new PDPLException("No local providers available for sensitive data.");
        }
        return localProvider;
    }

    // 2. Filter available providers based on Circuit Breaker health
    const availableProviders = this.getHealthyProviders();

    // 3. Filter by required capabilities (e.g., ARABIC)
    const capableProviders = this.filterByCapabilities(availableProviders, request.requiredCapabilities);

    // 4. Apply tier routing based on Priority
    const prioritySorted = this.sortByPriority(capableProviders, request.priority);

    // 5. Apply cost budget check
    for (const provider of prioritySorted) {
        if (this.isWithinBudget(provider)) {
            return provider;
        }
    }

    throw new ResourceExhaustedException("All capable providers exhausted or over budget.");
  }
}
```

---

## Section 6 — Caching Layer (Resolves ISSUE-002)

The most effective way to scale LLM inference is to avoid doing it altogether. The LLM Gateway implements an aggressive, context-aware caching layer backed by Valkey to eliminate redundant compute cycles, addressing ISSUE-002 (Ollama scalability).

### 6.1 Cache Architecture

*   **Cache Key Generation:** `SHA-256(engineId + ticker + timeframe + marketSession + portfolioContextHash)`
    *   This ensures that identical analytical requests (e.g., "Analyze COMI.EGX on the 1H timeframe") generate the same hash.
*   **Storage Backend:** Valkey DB 4, isolated within an `AI:` namespace.

### 6.2 TTL Definitions by Engine Type

Different AI engines produce data with varying half-lives. The cache TTL is strictly tuned to the volatility of the underlying financial context:

*   **Market Intelligence (TRD-AI-001):** 60 seconds (Asset prices tick frequently)
*   **Technical Analysis (TRD-AI-002):** 5 minutes (Indicators update periodically)
*   **Macro Intelligence (TRD-AI-005):** 30 minutes (News cycles move slower)
*   **News Intelligence (TRD-AI-007):** 10 minutes (Intraday updates)
*   **Sentiment Analysis (TRD-AI-008):** 15 minutes (Social trends)
*   **Portfolio Management (TRD-AI-012):** 2 minutes (Positions fluctuate constantly)
*   **Risk Assessment (TRD-AI-015):** 2 minutes (Real-time VaR)
*   **Background Schools/Tutors (TRD-AI-020+):** 60 minutes (Educational content is largely static)

### 6.3 Request Deduplication (The Multiplier Effect)

If 500 users log in and request an analysis of COMI.EGX simultaneously:
1.  **Without Cache:** 500 parallel requests hit Ollama, overwhelming the queue and causing catastrophic latency spikes.
2.  **With Cache:** 1 request is sent to Ollama. The subsequent 499 requests hit the Valkey cache within the TTL window, resulting in 0 additional inference cost and ~2ms latency.

### 6.4 Pre-warming Strategy

To further mitigate "thundering herd" problems at market open, a scheduled background job runs daily at 08:30 AM Cairo time. This job pre-computes analyses for all EGX30 constituent stocks across standard timeframes. Consequently, the opening-bell traffic spike hits a 100% warm cache, resulting in immediate responses and zero load on the inference hardware.

---

## Section 7 — Performance SLA by Provider

The LLM Gateway enforces strict Service Level Agreements (SLAs) to guarantee user experience, addressing ISSUE-006 (AI SLO).

| Provider | P50 Latency | P99 Latency | Throughput (Concurrency) | Implementation Phase |
| :--- | :--- | :--- | :--- | :--- |
| **Ollama** | 600ms | 1,500ms | 15 concurrent | Phase 1 (Current) |
| **vLLM** | 80ms | 200ms | 500 concurrent | Phase 2 (Target GPU) |
| **DeepSeek** | 400ms | 1,200ms | Limited by API tier | Phase 1 (Fallback) |
| **OpenAI** | 300ms | 800ms | Limited by API tier | Phase 1 (Emergency) |

*Note: Latency is measured from Gateway ingress to the first token generated (Time-to-First-Token, TTFT).*

---

## Section 8 — Concurrency Model (Resolves ISSUE-002 fully)

Managing concurrent access to constrained local hardware (like Phase 1 Ollama) is critical to preventing system collapse. The Gateway acts as a highly efficient traffic controller.

### 8.1 Phase 1 Concurrency Management

*   **Max Concurrent Ollama Requests:** Hardcoded limit of 8 parallel inference streams.
*   **Queue Depth Limit:** A backlog queue of up to 50 pending requests is maintained.
*   **Shedding Load:** If a request arrives when the queue is at capacity (50), the Gateway immediately rejects it with a graceful Arabic fallback message indicating high system load, rather than blocking indefinitely.

### 8.2 The Impact of Caching on Concurrency

The combination of the concurrency limits and the Valkey caching layer drastically alters the load profile:

*   **Without caching:** ~3,400 inference requests per hour at Phase 1 scale.
*   **With caching (deduplication):** ~50-100 unique inference requests per hour (a 45x reduction).

At peak Phase 1 load (e.g., 200 concurrent active users):
1.  **~95% of requests** are served directly from the Valkey cache (Latency: ~10ms).
2.  **~5% of unique requests** are routed to Ollama for inference (Latency: ~1,500ms P99).
3.  **Effective P99 User Experience:** `(0.95 * 10ms) + (0.05 * 1500ms) = ~84.5ms`.
This blended latency easily satisfies the stringent requirements of ISSUE-006.

---

## Section 9 — Monitoring & Observability

Comprehensive telemetry is required to operate the LLM Gateway effectively. The system exposes standard Prometheus metrics for alerting and dashboarding (e.g., Grafana).

### 9.1 Prometheus Metrics

```text
# Tracks total requests categorized by provider, model, calling engine, and HTTP status
llm_gateway_request_total{provider, model, engine_id, status}

# Histogram of response times to monitor SLAs
llm_gateway_request_duration_seconds{provider, model, priority}

# Gauge indicating the effectiveness of the caching layer per engine
llm_gateway_cache_hit_ratio{engine_id}

# Binary status (1=healthy, 0=degraded) based on circuit breaker state
llm_gateway_provider_health{provider}

# Cumulative spend tracking for budget enforcement
llm_gateway_cost_egp_total{provider}

# Current state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)
llm_gateway_circuit_breaker_state{provider}

# Real-time gauge of the inference backlog
llm_gateway_queue_depth{provider}

# Total items stored in the Valkey cache
llm_gateway_cache_entries_total{engine_id}
```

### 9.2 Critical Alert Rules

The following scenarios trigger automated PagerDuty incidents:
1.  **Provider Circuit Open (> 5 minutes):** Triggers a SEV-2. Indicates a prolonged failure of a primary provider (e.g., Ollama crashed).
2.  **All Providers Unhealthy:** Triggers a SEV-1. The Gateway cannot route traffic; AI features are completely offline.
3.  **Monthly Cost > 80% of Budget:** Triggers a Warning. Requires manual review of traffic patterns before automatic cost caps activate.
4.  **Cache Hit Ratio < 50%:** Triggers an Investigation alert. Indicates a potential cache invalidation storm or poorly optimized cache keys.

---

## Section 10 — Security & PDPL Compliance

The LLM Gateway is the enforcement point for data sovereignty and security within the AI ecosystem.

### 10.1 Data Sovereignty (PDPL 2020)
The Egyptian Personal Data Protection Law (PDPL 2020) places strict requirements on the processing and storage of PII. The LLM Gateway guarantees that any request flagged with `pdplSensitive: true` is cryptographically bound to `Type: LOCAL` providers. If a local provider is unavailable, the request fails closed. Data never traverses international borders.

### 10.2 Secret Management
API keys for external providers (DeepSeek, OpenAI) are never hardcoded or stored in environment variables. The Gateway dynamically retrieves credentials from OpenBao (formerly HashiCorp Vault) using short-lived tokens. Keys are subject to an automated 90-day rotation policy.

### 10.3 Audit Trails
Every interaction through the Gateway generates an immutable audit record written to a MinIO Write-Once-Read-Many (WORM) bucket. This record includes the `requestId`, `userId`, provider selected, token counts, and cost, enabling forensic analysis and compliance auditing.

### 10.4 Zero-Knowledge Principle
Even when utilizing external providers for non-sensitive tasks, the Gateway strips identifying metadata. External providers receive contextually rich prompts but never the actual PII of the Tradeora user.

---

## Section 11 — API Contract

The LLM Gateway exposes a RESTful API internal to the TFOS cluster.

```http
# Primary inference endpoint (JSON payload)
POST /internal/llm/complete

# Streaming inference endpoint utilizing Server-Sent Events (SSE) for UI responsiveness
POST /internal/llm/stream

# Operational health check for all registered providers
GET  /internal/llm/providers/health

# Caching layer analytics
GET  /internal/llm/cache/stats

# Administrative endpoint to forcefully invalidate specific cache entries
DELETE /internal/llm/cache/{key}

# Prometheus scraping endpoint
GET  /internal/llm/metrics
```

---

## Section 12 — Migration from Direct Ollama Calls

Transitioning from the legacy direct-connection model to the Gateway architecture requires a coordinated, zero-downtime migration strategy.

1.  **Step 1: Deployment.** Deploy the LLM Gateway as an independent microservice within the Kubernetes cluster, pointing it to the existing Ollama instance.
2.  **Step 2: Dual-Write/Shadow Mode.** Update the core AI SDK to send asynchronous, shadow requests to the Gateway while continuing to rely on direct Ollama calls for production traffic. Monitor Gateway metrics to validate routing and caching logic.
3.  **Step 3: Interface Compatibility.** Ensure the Gateway fully implements the expected OpenAI-compatible API surface, making it a drop-in replacement for existing client libraries.
4.  **Step 4: Cutover.** Update the configuration maps for the 26 AI engines, changing the endpoint URL from `http://ollama:11434` to `http://llm-gateway:8080`.
5.  **Step 5: Cleanup.** Once stability is confirmed, systematically remove all direct Ollama client connection logic and environment variables from the AI engine codebases.

---

## Section 13 — Future Provider Onboarding

The Gateway is designed for extensibility (Article 3). Onboarding a new provider (e.g., a highly specialized financial model on HuggingFace) is a configuration exercise, not a code rewrite.

**Procedure:**
1.  Implement the standard `ILLMProvider` TypeScript interface for the new service.
2.  Register the provider class within the `ProviderRegistry`.
3.  Update the YAML configuration to define the provider's routing priority, tier, and cost parameters (EGP).
4.  Configure the specific circuit breaker thresholds for the new endpoint.
5.  Document the PDPL compliance classification based on the provider's data residency guarantees.
6.  Update ADR-041 to reflect the new provider addition.
7.  Deploy the updated Gateway configuration. **Crucially, no changes are required within any of the 26 AI engines; they continue to communicate solely with the Gateway.**

---

## Section 14 — ADR-041: LLM Provider Abstraction Decision

**Title:** Enterprise LLM Provider Abstraction via Gateway Pattern
**Status:** ACCEPTED
**Date:** 2026-07-24

**Context:**
The initial TFOS architecture hardcoded dependencies on a single local Ollama instance for all 26 AI engines. This created a severe scalability cliff (Ollama queue exhaustion), violated provider independence, and lacked any centralized mechanism for cost control, telemetry, or intelligent caching.

**Decision:**
We will introduce a centralized 'LLM Gateway' microservice acting as a reverse proxy and intelligent router for all LLM traffic. All internal services must communicate through this gateway.

**Consequences:**
*   **Positive:** Complete provider independence (we can swap models seamlessly).
*   **Positive:** Massive scalability improvements via the Valkey-backed caching layer (solving ISSUE-002).
*   **Positive:** Enforceable SLA management and circuit breaking (solving ISSUE-006).
*   **Positive:** Centralized cost control and PDPL compliance enforcement.
*   **Negative:** Introduces an additional network hop and microservice to maintain.

**Alternatives Considered:**
*   *LiteLLM Library Integration Only:* Injecting LiteLLM into every AI engine. **Rejected:** Does not provide a centralized, shared caching layer or unified rate limiting across the entire cluster.
*   *Direct Provider Calls with SDK Wrappers:* Continuing the current pattern but with better error handling. **Rejected:** Maintains provider lock-in and fails to solve the fundamental scalability limit of local hardware without caching.
