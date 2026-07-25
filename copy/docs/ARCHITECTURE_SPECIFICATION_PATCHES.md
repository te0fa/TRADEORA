# Tradeora Financial Operating System
## Architecture Improvement Specification Patches
## Version 1.1.0 | Status: AUTHORITATIVE | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  This document contains specification patches for architecture issues        ║
║  ISSUE-001, ISSUE-008 through ISSUE-023 from TRD-AUDIT-ARCH-001.            ║
║  These patches clarify existing documents without requiring new documents.   ║
║  Authority: Chief Enterprise Architect                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## PATCH-001: AI Consensus Quorum Standardization (Resolves ISSUE-001)

**Affected Documents:**
- `AI_SAFETY_AND_ETHICS_FRAMEWORK.md`
- `IMPLEMENTATION_READINESS_GATE.md`
- `AI_CAPABILITY_REGISTRY.md`

**The Official Specification:**

The AI Consensus Orchestrator (TRD-AI-019) uses a THREE-TIER quorum model:

```
┌─────────────────────────────────────────────────────────────────────────┐
│         OFFICIAL AI CONSENSUS QUORUM MODEL — PHASE 1 (12 Schools)       │
│                                                                          │
│  Schools Responding    Confidence Mode    User Delivery                  │
│  ─────────────────────────────────────────────────────                   │
│  ≥ 10 of 12           HIGH CONFIDENCE    Full recommendation             │
│  9 of 12              MEDIUM CONFIDENCE  Recommendation + Arabic warning │
│                                          "التحليل مبني على X مدارس"     │
│  < 9 of 12            INSUFFICIENT       No recommendation               │
│                                          Arabic fallback message:         │
│                                          "غير متاح حالياً، يرجى المحاولة │
│                                           في وقت لاحق"                  │
│                                                                          │
│  Official Phase 1 quorum: 9 / 12 (75% minimum)                          │
│  Phase 2 recalibration when Schools 13-17 activate (PATCH-001b)         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Phase 1 Rationale (12 active schools):**
- 75% minimum (9/12) balances recommendation quality with availability
- HIGH tier (≥10/12 = 83%+) ensures strong consensus for full recommendations
- MEDIUM tier (9/12 = 75%) allows advisory delivery with transparency warning
- Below 75% participation: signal quality insufficient
- Phase 2 PATCH-001b will recalibrate when Schools 13-17 activated

**Document Update Instructions:**
- `AI_INTELLIGENCE_ENGINE_ARCHITECTURE.md §consensus`: UPDATED — 9/12 minimum applied
- `AI_SAFETY_AND_ETHICS_FRAMEWORK.md`: UPDATED — minimum 9 of 12 Phase 1 schools
- `IMPLEMENTATION_READINESS_GATE.md §7`: UPDATED — 12-school Phase 1 quorum
- `ARCHITECTURE_CONSISTENCY_VERIFICATION.md`: UPDATED — 9/12 Phase 1 row
- `AI_CAPABILITY_REGISTRY.md TRD-AI-019`: Update consensus section to reference three-tier Phase 1 model

---

## PATCH-008: EventStoreDB vs. PostgreSQL Outbox — Official Delivery Path (Resolves ISSUE-008)

**Official Decision: Option A — PostgreSQL Outbox as Single Delivery Mechanism**

```
┌─────────────────────────────────────────────────────────────────────────┐
│              OFFICIAL EVENT DELIVERY ARCHITECTURE                        │
│                                                                          │
│  Aggregate Command Handler                                               │
│      │                                                                   │
│      ▼ (atomic transaction)                                              │
│  ┌────────────────────────────────┐                                      │
│  │  PostgreSQL Transaction        │                                      │
│  │  ├── State table UPDATE        │                                      │
│  │  └── outbox_events INSERT      │ ← Single atomic write               │
│  └────────────────────────────────┘                                      │
│      │                                                                   │
│      ▼ (BullMQ Job: JOB-001 — Outbox Poller, runs every 100ms)          │
│  Kafka Producer → Topic publish                                          │
│      │                                                                   │
│      ▼ (via Kafka consumer — dedicated consumer group)                   │
│  EventStoreDB ← Append event stream (replay/audit store)                │
│                                                                          │
│  EventStoreDB ROLE: Immutable replay and audit store ONLY               │
│  EventStoreDB is NOT the Kafka delivery mechanism                        │
│  PostgreSQL outbox IS the authoritative delivery source                  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Schema: outbox_events table**
```sql
CREATE TABLE outbox_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID        NOT NULL UNIQUE,
  topic         TEXT        NOT NULL,   -- Kafka topic name
  schema_subject TEXT       NOT NULL,   -- Karapace subject name
  payload       JSONB       NOT NULL,   -- Event payload (Avro serialized)
  tenant_id     TEXT        NOT NULL,
  produced_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dispatched_at TIMESTAMPTZ,            -- Set by poller after Kafka ACK
  status        TEXT        NOT NULL DEFAULT 'PENDING',  -- PENDING|DISPATCHED|FAILED
  retry_count   INTEGER     NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ
);
CREATE INDEX idx_outbox_pending ON outbox_events (status, produced_at)
  WHERE status = 'PENDING';
```

**Rationale for Option A over Option B (EventStoreDB as source):**
- PostgreSQL atomic write with business state guarantees exactly-once semantics
- Simpler operational model (1 write path, not 2)
- EventStoreDB can be rebuilt from Kafka replay at any time
- PostgreSQL outbox is industry-standard reliable delivery pattern

**Affected Documents:**
- `APPLICATION_LAYER_ARCHITECTURE.md`: Add note clarifying outbox as delivery mechanism
- `BACKGROUND_PROCESSING_ARCHITECTURE.md`: Confirm JOB-001 is the authoritative delivery job
- `CQRS_ARCHITECTURE.md`: Update diagram to show outbox → Kafka → EventStoreDB flow

---

## PATCH-009: Inter-Service Authentication (Resolves ISSUE-009)

**Specification: Kubernetes ServiceAccount JWT Authentication**

In Phase 1 (no Istio), all internal NestJS-to-NestJS API calls use Kubernetes ServiceAccount JWTs:

```typescript
// Producer: inject service account token into internal API calls
class InternalHttpClient {
  private readonly serviceAccountToken: string;

  constructor() {
    // Mounted by Kubernetes at this path automatically
    this.serviceAccountToken = fs.readFileSync(
      '/var/run/secrets/kubernetes.io/serviceaccount/token',
      'utf-8'
    );
  }

  async callInternalService(url: string, body: unknown): Promise<unknown> {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.serviceAccountToken}`,
        'Content-Type': 'application/json',
        'X-Internal-Service': process.env.SERVICE_NAME,
      },
      body: JSON.stringify(body),
    });
  }
}

// Consumer: validate service account JWT in NestJS guard
@Injectable()
class InternalServiceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization']?.replace('Bearer ', '');
    // Validate against Kubernetes TokenReview API
    return this.tokenReviewService.validate(token);
  }
}
```

**Kubernetes NetworkPolicy** (defense-in-depth):
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-external-internal-api
spec:
  podSelector:
    matchLabels:
      type: internal-service
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: tradeora-platform
    ports:
    - port: 3000
      protocol: TCP
```

This achieves defense-in-depth without Istio:
- NetworkPolicy: restricts which pods can reach internal APIs
- ServiceAccount JWT: authenticates the calling service identity
- Phase 2: Istio mTLS adds a third layer (mutual TLS between all pods)

---

## PATCH-010: Qdrant Multi-Tenant Isolation (Resolves ISSUE-010)

**Mandatory Filter Specification:**

All vector searches in Enterprise Memory Engine (TRD-AI-021) MUST include tenant_id as a mandatory payload filter:

```python
# ALL Qdrant searches MUST use this pattern
def search_vectors(
    collection: str,
    query_vector: list[float],
    tenant_id: str,           # MANDATORY - never optional
    limit: int = 10,
    additional_filters: Optional[Filter] = None
) -> list[ScoredPoint]:
    
    # Tenant isolation filter - NEVER bypass this
    tenant_filter = Filter(
        must=[
            FieldCondition(
                key="tenant_id",
                match=MatchValue(value=tenant_id)
            )
        ]
    )
    
    # Merge with additional filters if provided
    if additional_filters:
        combined_filter = Filter(must=[tenant_filter, additional_filters])
    else:
        combined_filter = tenant_filter
    
    return qdrant_client.search(
        collection_name=collection,
        query_vector=query_vector,
        query_filter=combined_filter,
        limit=limit
    )
```

**Enforcement Mechanism:**
- CI/CD fitness function: `qdrant_tenant_isolation_checker.py` scans all Python files for `qdrant_client.search()` calls without tenant_id filter → CI failure
- Code review checklist: Qdrant search without tenant_id is a mandatory review rejection

---

## PATCH-011: Qdrant Collection Ownership (Resolves ISSUE-011)

**Official Qdrant Collection Partitioning:**

```
┌────────────────────────────────────────────────────────────────────────┐
│                    QDRANT COLLECTION OWNERSHIP MAP                      │
├─────────────────────────────────┬──────────────────────────────────────┤
│ Collection Name                 │ Owner Engine                         │
├─────────────────────────────────┼──────────────────────────────────────┤
│ ENTERPRISE MEMORY ENGINE (TRD-AI-021)                                  │
├─────────────────────────────────┼──────────────────────────────────────┤
│ recommendations                 │ TRD-AI-021 (write), all schools (read)│
│ outcomes                        │ TRD-AI-021 (via Ground Truth feed)   │
│ user_context                    │ TRD-AI-021 (user session memory)     │
│ learning_core                   │ TRD-AI-023 (immutable core knowledge)│
│ learning_recent                 │ TRD-AI-023 (rolling 90-day examples) │
│ learning_antipatterns           │ TRD-AI-023 (failure cases)           │
│ learning_calibration            │ TRD-AI-023 (confidence calibration)  │
├─────────────────────────────────┼──────────────────────────────────────┤
│ KNOWLEDGE OPERATING SYSTEM (TRD-AI-022)                                │
├─────────────────────────────────┼──────────────────────────────────────┤
│ company_facts                   │ TRD-AI-022 (EGX company knowledge)   │
│ market_ontology                 │ TRD-AI-022 (market concepts graph)   │
│ causal_relationships            │ TRD-AI-022 (cause-effect mappings)   │
│ sector_intelligence             │ TRD-AI-022 (sector analysis context) │
│ egx_filings                     │ TRD-AI-022 (corporate disclosure vec)│
│ market_news                     │ TRD-AI-022 (Arabic news vectors)     │
└─────────────────────────────────┴──────────────────────────────────────┘

BOUNDARY RULE: No cross-ownership reads without explicit inter-engine API call.
              TRD-AI-022 NEVER writes to TRD-AI-021 collections directly.
              Cross-collection queries are FORBIDDEN (no joins across owners).
```

---

## PATCH-012: AI Endpoint Rate Limits (Resolves ISSUE-012)

**Official AI Recommendation Rate Limits by User Tier:**

```
╔══════════════════════════════════════════════════════════════════════════╗
║              AI RECOMMENDATION RATE LIMITS                               ║
╠══════════════════════════════════════╦═══════════╦══════════╦═══════════╣
║ User Tier                            ║ Per Hour  ║ Per Day  ║ Queue     ║
╠══════════════════════════════════════╬═══════════╬══════════╬═══════════╣
║ RETAIL (ROLE_ACTIVE_TRADER)          ║     5     ║    20    ║ Shared    ║
║ PREMIUM (ROLE_PREMIUM)               ║    15     ║    60    ║ Shared    ║
║ WEALTH_MANAGEMENT (ROLE_WM)          ║    40     ║   200    ║ Priority  ║
║ FAMILY_OFFICE (ROLE_FO)              ║   120     ║   500    ║ Priority  ║
║ INSTITUTIONAL (ROLE_INST)            ║ Unlimited ║Unlimited ║ Dedicated ║
╚══════════════════════════════════════╩═══════════╩══════════╩═══════════╝

Rate limit enforcement: Kong API Gateway plugin (kong-rate-limiting-advanced)
Keys: X-User-Tier + X-User-ID
HTTP 429 response with Arabic message on breach:
  {"error": "تم تجاوز الحد المسموح للتحليل. يرجى المحاولة لاحقاً.", "retryAfter": 3600}
```

---

## PATCH-013: Phase 1 → Phase 2 Migration Architecture (Resolves ISSUE-013)

**Expand-Contract Migration Strategy:**

Phase 1→2 migration uses the **Expand-Contract** (also called parallel-change) pattern:

```
Phase 1 Schema    Phase 2 Schema          Phase 2 Full Migration
(Production)      (Expanded)              (Contracted)
     │                  │                       │
     ▼                  ▼                       ▼
[EGP only]  →  [EGP + SAR(nullable)] →  [Multi-currency full]
                  
Step 1 (Month before Phase 2):
  - Add nullable columns: currency_code, forex_rate, amount_usd
  - Feature flag: MULTI_CURRENCY_ENABLED = false
  - All new columns populated but not displayed

Step 2 (Phase 2 launch day):
  - Feature flag: MULTI_CURRENCY_ENABLED = true
  - New UI elements activated
  - No data migration required (columns already populated)

Step 3 (3 months post-Phase 2):
  - Remove legacy EGP-only code paths
  - Contract: clean up old columns if any
```

**Flyway Version Control Policy:**
- Phase 1 migrations: `V1_xxx__description.sql`
- Phase 1→2 transition: `V2_000__phase2_expand.sql` (nullable columns only)
- Phase 2 features: `V2_xxx__description.sql`
- Phase 2 cleanup: `V2_999__phase1_contract.sql`

---

## PATCH-014: EGX Historical Data Bootstrap (Resolves ISSUE-014)

**Historical Data Requirements:**

```
┌──────────────────────────────────────────────────────────────────────┐
│              EGX HISTORICAL DATA BOOTSTRAP SPECIFICATION              │
├──────────────────────────┬───────────────────────────────────────────┤
│ Data Type                │ Specification                             │
├──────────────────────────┼───────────────────────────────────────────┤
│ Daily OHLCV              │ 10 years (2015-01-01 → launch date)      │
│ Scope                    │ All EGX listed companies (220+)           │
│ Intraday (5-minute)      │ 3 years for EGX30 stocks                 │
│ Intraday (1-minute)      │ 1 year for EGX30 stocks (high-freq)      │
│ Corporate Actions        │ 15 years (dividends, splits, rights)      │
│ Index History            │ 10 years (EGX30, EGX70, EGX100)         │
│ Source                   │ EGX official historical data API (primary)│
│                          │ Refinitiv DataScope (backup vendor)       │
│ Storage                  │ TimescaleDB (hypertable partitioned)      │
│ Bootstrap Pipeline       │ One-time ETL job (Python, ~72hrs runtime) │
│ Validation               │ Price continuity check post corporate act.│
│ Completion Gate          │ Bootstrap MUST complete before Phase 1    │
│                          │ launch (pre-launch checklist item)        │
└──────────────────────────┴───────────────────────────────────────────┘
```

---

## PATCH-016: Order Management Phase 1 Scope (Resolves ISSUE-016)

**Mandatory Phase 1 Constraint Added to OrderManagement BC:**

```
⚠️ PHASE 1 SCOPE CONSTRAINT — OrderManagement Bounded Context

Phase 1 ONLY: Simulated/paper orders (no real cash flow, no brokerage connectivity)

Feature Flags:
  REAL_ORDER_EXECUTION_ENABLED = false   # Mandatory. Never enable in Phase 1.
  FIX_GATEWAY_ENABLED = false            # Mandatory. Phase 2 only.
  BROKER_API_ENABLED = false             # Mandatory. Phase 2 only.

Phase 1 Order Types Permitted:
  ✅ Paper order (simulation only — records intent, tracks hypothetical P&L)
  ✅ Watchlist add/remove
  ✅ Price alert set

Phase 1 Order Types BLOCKED (feature flag enforcement):
  ❌ Market order (real execution)
  ❌ Limit order (real execution)
  ❌ FIX protocol order routing
  ❌ Any order type that moves real currency

Regulatory Basis: FRA license pending. Article 6 (Advisory-only). 
Engineering Constitution prohibits custodial trading in Phase 1.
```

---

## PATCH-017: Backtesting Walk-Forward Mandate (Resolves ISSUE-017)

**Mandatory Backtesting Standards:**

The Backtesting Intelligence Engine (TRD-AI-015) MUST comply:

```
WALK-FORWARD ANALYSIS MANDATE:

1. Minimum out-of-sample window: 20% of total historical period
   Example: 10 years data → 8 years in-sample, 2 years out-of-sample

2. Walk-forward window configuration:
   - Training window: 252 trading days (1 EGX year)
   - Test window: 63 trading days (1 EGX quarter)
   - Step: 21 trading days (1 EGX month)

3. EGX Transaction Cost Model (mandatory in all backtest results):
   - Brokerage commission: 0.175% (midpoint of 0.15–0.20% range)
   - MCDR clearing fee: 0.016% per transaction
   - FRA levy: 0.005% per transaction
   - Stamp duty: 0.15% for non-EGX30 stocks
   - Total round-trip cost: ~0.72% (0.36% buy + 0.36% sell)

4. Slippage model:
   - EGX30 stocks: 0.05% average slippage
   - EGX30-70 stocks: 0.15% average slippage
   - Small-cap EGX stocks: 0.40% average slippage

5. Results display: MANDATORY dual display
   ┌──────────────────┬────────────────────────────┐
   │ Metric           │ Without Costs │ With Costs  │
   ├──────────────────┼──────────────┼─────────────┤
   │ Total Return     │     XX%      │     XX%     │
   │ Sharpe Ratio     │     X.XX     │     X.XX    │
   │ Max Drawdown     │     XX%      │     XX%     │
   │ Win Rate         │     XX%      │     XX%     │
   └──────────────────┴──────────────┴─────────────┘

6. Lookahead bias prevention:
   - All features calculated using only data available at time T
   - No future OHLCV data used in signal calculation
   - Corporate actions adjusted BEFORE testing (not after)
```

---

## PATCH-019: Arabic RTL Financial Number Localization (Resolves ISSUE-019)

**Financial Localization Specification:**

```
ARABIC RTL FINANCIAL NUMBER DISPLAY STANDARD:

1. Number System: Western Arabic numerals (0-9) — NOT Eastern Arabic (٠-٩)
   Rationale: Egyptian financial markets (EGX, Bloomberg, Reuters) universally
   use Western numerals. Eastern Arabic creates confusion in financial context.

2. Decimal Separator: Period (.) — NOT comma (,)
   Example: ١٢٥٠.٥٠ EGP → WRONG
            1250.50 ج.م → CORRECT

3. Thousands Separator: Comma (,)
   Example: 1,250,500.75 ج.م

4. Currency Symbol Position (Egyptian Pound EGP):
   - Code: EGP
   - Arabic symbol: ج.م (Gineh Masri)
   - Display: Amount THEN symbol → "1,250.50 ج.م"
   - In RTL context: symbol appears on LEFT visually, but is RIGHT in HTML

5. Negative Numbers:
   - Display: "-1,250.50 ج.م" (minus sign BEFORE amount, in LTR number)
   - Color: Red (#E53E3E) for losses
   - Do NOT use parentheses () for negative (not Egyptian standard)

6. Percentage Display:
   - "3.47%" — ALWAYS in LTR regardless of RTL context
   - Positive: Green (#38A169) with "+" prefix
   - Negative: Red (#E53E3E) with "-" prefix
   - Neutral: Gray (#718096)

7. Arabic text + numbers:
   - "ارتفع السهم بنسبة" + [LTR span: "3.47%"] + "اليوم"
   - Numbers MUST be wrapped in <span dir="ltr"> inside RTL containers

8. React/Next.js implementation:
   const formatEGP = (amount: Decimal, locale: 'ar' | 'en' = 'ar'): string => {
     const formatted = new Intl.NumberFormat('en-EG', {
       minimumFractionDigits: 2,
       maximumFractionDigits: 2
     }).format(amount.toNumber());
     return locale === 'ar' ? `${formatted} ج.م` : `EGP ${formatted}`;
   };
```

---

## PATCH-020: Plugin Architecture Phase 1 Scope (Resolves ISSUE-020)

**Official Phase 1 Plugin Scope Constraint:**

```
PLUGIN ARCHITECTURE — PHASE ACTIVATION SCHEDULE:

Phase 1 (Current):
  ✅ ACTIVE: Built-in EGX Data Connector (Type A: gRPC sidecar)
             This is the ONLY active plugin in Phase 1.
             No third-party plugins accepted or processed.
  ❌ INACTIVE: WASM sandbox (Phase 2)
  ❌ INACTIVE: Plugin marketplace (Phase 3)
  ❌ INACTIVE: Partner certification program (Phase 2)
  ❌ INACTIVE: Custom school plugins (Phase 2)

Phase 2 (GCC Expansion):
  ✅ Activate: WASM sandbox for third-party plugins
  ✅ Activate: Partner certification program
  ✅ First partner plugin: Tadawul (Saudi) data connector

Phase 3 (North Africa / Levant):
  ✅ Activate: Plugin marketplace (Tradeora store)
  ✅ Activate: Custom school plugin API (partners can add AI schools)

Engineering Note: The Plugin Architecture document describes the FULL vision.
Do NOT implement Phases 2-3 infrastructure in Phase 1 code.
Feature flag: PLUGIN_MARKETPLACE_ENABLED = false (Phase 1 mandatory)
```

---

## PATCH-021: External AI API Key Security (Resolves ISSUE-021)

**External AI Provider API Key Governance:**

```
EXTERNAL AI API KEY MANAGEMENT POLICY:

Storage: OpenBao (HashiCorp Vault OSS fork) — path: secret/ai/providers/{provider}
  secret/ai/providers/deepseek/api_key
  secret/ai/providers/openai/api_key
  secret/ai/providers/gemini/api_key
  secret/ai/providers/anthropic/api_key

Rotation Policy:
  - Rotation frequency: 90 days (matches Constitution standard)
  - Rotation method: OpenBao dynamic secrets (if supported by provider)
                     OR manual rotation with 24-hour overlap window
  - Post-rotation: old key active for 24 hours, then revoked

Cost Cap Enforcement:
  - Monthly budget per provider stored in OpenBao as config:
    secret/ai/providers/{provider}/monthly_budget_egp
  - LLM Gateway checks cost running total from Prometheus metric
  - At 80% of monthly budget: alert (PagerDuty)
  - At 100% of monthly budget: LLM Gateway STOPS routing to that provider

External Rate Limit Handling:
  - HTTP 429 from provider → circuit breaker opens for 60 seconds
  - LLM Gateway routes to next tier provider automatically
  - Alert: llm_gateway_rate_limited_total{provider} > 10/min

PDPL Compliance:
  - External providers MUST NOT receive: user PII, user names, national IDs,
    portfolio data, trading history, or any personally identifiable information
  - External requests contain ONLY: anonymized market context + prompt
  - Tenant ID is hashed (SHA-256) before external transmission
```

---

## PATCH-022: Valkey Version Pinning (Resolves ISSUE-022)

**Official Valkey Version Specification:**

```
TECHNOLOGY_ARCHITECTURE.md Update:

In-Memory Cache: Valkey 8.0.x (OSS Redis fork — CNCF project)
  - Minimum version: 8.0.0
  - Recommended: 8.0.x (latest patch)
  - NOT PERMITTED: Valkey 7.x (missing critical memory management improvements)
  - Kubernetes deployment: valkey/valkey:8.0-alpine
  - Sentinel mode: 3 nodes (1 primary + 2 replicas) in Phase 1
  - Cluster mode: Phase 2 (when horizontal scaling needed)

Why Valkey 8.0 specifically:
  - ListPack encoding improvements for small structures (reduces memory 20%)
  - Enhanced RESP3 protocol support
  - Better Lua script security sandbox
  - Active memory defragmentation improvements
```

---

## PATCH-023: Monorepo CI/CD Incremental Build (Resolves ISSUE-023)

**Turborepo Incremental Build Strategy:**

```
MONOREPO BUILD OPTIMIZATION:

Tool: Turborepo (with remote caching)
Strategy: --filter affected packages only

Pipeline definition (turbo.json):
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": [],
      "cache": true
    },
    "lint": {
      "outputs": [],
      "cache": true
    }
  }
}

CI/CD Command (GitHub Actions):
  npx turbo run build test lint --filter=[HEAD^1]
  # Only builds packages changed since last commit + their dependents
  # At 49 BCs: typical PR touches 1-3 BCs → builds 1-5 packages (not all 49)

Remote Cache: Turborepo Remote Cache (self-hosted via @turborepo/remote-cache)
Cache key: content hash of all source files in the package
Cache hit rate target: > 80% on CI (measured by Turborepo metrics)

Expected CI improvement:
  Full build (all 49 BCs): ~45 minutes
  Incremental build (1-3 changed BCs): ~5-8 minutes
  Cache hit: ~1-2 minutes (cache restore only)
```

---

## APPENDIX: Summary of All Patches

| Patch | Issue | Documents Affected | Status |
|-------|-------|-------------------|--------|
| PATCH-001 | ISSUE-001 | 3 AI docs | ✅ Specified |
| PATCH-008 | ISSUE-008 | 3 CQRS/event docs | ✅ Specified |
| PATCH-009 | ISSUE-009 | SECURITY_ARCHITECTURE.md | ✅ Specified |
| PATCH-010 | ISSUE-010 | AI_CAPABILITY_REGISTRY.md | ✅ Specified |
| PATCH-011 | ISSUE-011 | AI_CAPABILITY_REGISTRY.md | ✅ Specified |
| PATCH-012 | ISSUE-012 | API_CONTRACT_SPECIFICATION.md | ✅ Specified |
| PATCH-013 | ISSUE-013 | MULTI_REGION_ARCHITECTURE.md | ✅ Specified |
| PATCH-014 | ISSUE-014 | MARKET_DATA_ARCHITECTURE.md | ✅ Specified |
| PATCH-016 | ISSUE-016 | BCM OrderManagement docs | ✅ Specified |
| PATCH-017 | ISSUE-017 | AI_CAPABILITY_REGISTRY.md TRD-AI-015 | ✅ Specified |
| PATCH-019 | ISSUE-019 | FRONTEND_ARCHITECTURE.md | ✅ Specified |
| PATCH-020 | ISSUE-020 | PLUGIN_ARCHITECTURE.md | ✅ Specified |
| PATCH-021 | ISSUE-021 | SECURITY_ARCHITECTURE.md | ✅ Specified |
| PATCH-022 | ISSUE-022 | TECHNOLOGY_ARCHITECTURE.md | ✅ Specified |
| PATCH-023 | ISSUE-023 | CODEBASE_ARCHITECTURE.md | ✅ Specified |

All patches are additive (Extension over Modification — Article 3 compliant).
No existing architectural decisions were reversed.
No BC boundaries were changed.
All patches comply with Engineering Constitution Articles 1-30.

---

```
╔══════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT FOOTER                                                         ║
║  Document: ARCHITECTURE_SPECIFICATION_PATCHES.md v1.1.0                 ║
║  Authority: Chief Enterprise Architect                                   ║
║  Date: 2026-07-24                                                        ║
║  Resolves: ISSUE-001, ISSUE-008 through ISSUE-023                       ║
╚══════════════════════════════════════════════════════════════════════════╝
```
