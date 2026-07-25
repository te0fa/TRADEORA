# Tradeora Financial Operating System
## Multi-Region Architecture — Geographic Expansion & DR Topology
## Version 1.0.0 | Status: APPROVED | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Constitution Article 26  : Regional expansion policy                        ║
║  Constitution Article 25  : Data durability mandate                          ║
║  Constitution Article 31  : Data sovereignty per jurisdiction                ║
║  Phase 1 Scope            : Single region (Cairo, Egypt) — current          ║
║  Phase 2 Trigger          : Egypt MAU ≥ 50,000                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Section 1 — Geographic Topology Overview

### 1.1 Three-Phase Regional Expansion

```
PHASE 1 (NOW)                    PHASE 2 (Year 1-2)                PHASE 3 (Year 3-4)
━━━━━━━━━━━━━━                   ━━━━━━━━━━━━━━━━━━━━━━            ━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────┐               ┌─────────────────┐               ┌─────────────────┐
│  Cairo, Egypt   │               │  Cairo, Egypt   │               │  Cairo, Egypt   │
│  [PRIMARY]      │               │  [PRIMARY]      │               │  [PRIMARY]      │
│  All services   │  ──GCC──▶    │  All services   │  ──GCC──▶    │  All services   │
│  All Egyptian   │               │  All Egyptian   │               │  All MENA       │
│  user data      │               │  + GCC user     │               │  + GCC + N.Afr. │
│                 │               │  data           │               │  data (zoned)   │
└─────────────────┘               └───────┬─────────┘               └───────┬─────────┘
                                          │                                   │
                              ┌───────────▼──────────┐           ┌───────────▼──────────┐
                              │  Riyadh, Saudi Arabia│           │  Riyadh, Saudi Arabia│
                              │  [ACTIVE + DR]       │           │  [ACTIVE]            │
                              │  Saudi user data     │           │  Saudi user data     │
                              │  (NDMO sovereignty)  │           └──────────────────────┘
                              └──────────────────────┘                       │
                                                               ┌─────────────▼──────────┐
                                                               │  Dubai, UAE             │
                                                               │  [ACTIVE]               │
                                                               │  UAE + GCC user data    │
                                                               └─────────────────────────┘
```

### 1.2 Region Classification

| Region | Role | Phases | Data Stored |
|--------|------|--------|-------------|
| Cairo, Egypt | Primary Active | 1, 2, 3 | All Egyptian user data (required) |
| Riyadh, KSA | Active + KSA DR | 2, 3 | Saudi user data (NDMO requirement) |
| Dubai, UAE | Active + GCC hub | 2, 3 | UAE/GCC user data |
| Casablanca, Morocco | Expansion | 3 | Moroccan user data (CNDP requirement) |

---

## Section 2 — Phase 1: Single Region (Cairo, Egypt) — Current

### 2.1 Architecture

All Tradeora services run in a single Kubernetes cluster in Cairo. High availability is
achieved within the region via multi-AZ pod scheduling and Patroni PostgreSQL clustering.

```
Cairo Kubernetes Cluster
├── availability-zone: cai-az-1
│   ├── patroni-0 (PostgreSQL primary)
│   ├── kafka-0
│   └── ai-consensus-orchestrator-pod-1
│
├── availability-zone: cai-az-2
│   ├── patroni-1 (PostgreSQL replica)
│   ├── kafka-1
│   └── ai-consensus-orchestrator-pod-2
│
└── availability-zone: cai-az-3
    ├── patroni-2 (PostgreSQL replica)
    ├── kafka-2
    └── minio-0 (WORM storage)
```

### 2.2 Phase 1 Intra-Region HA

| Component | HA Mechanism | Replicas |
|-----------|-------------|---------|
| PostgreSQL | Patroni (Raft via etcd) | 3 nodes (1 primary, 2 replicas) |
| Kafka | Quorum (2/3 majority) | 3 brokers |
| Valkey | Primary + 1 Replica | 2 nodes |
| MinIO | Erasure coding (k=2, m=2) | 4 drives |
| AI Services | Kubernetes HPA | 2–10 replicas |
| Keycloak | Cluster mode (Infinispan) | 2+ nodes |
| Kong API Gateway | Load balanced | 3+ replicas |

### 2.3 Phase 1 Data Sovereignty

All user data stored exclusively in Cairo, Egypt:

```typescript
// Runtime enforcement: all DB connections point to Cairo
// Environment config: .env.production
DATABASE_HOST=patroni-primary.cairo.tradeora.internal
MINIO_ENDPOINT=https://minio.cairo.tradeora.internal
KAFKA_BROKERS=kafka-0.cairo:9092,kafka-1.cairo:9092,kafka-2.cairo:9092
```

**FRA + PDPL requirement:** Egyptian user financial data cannot be stored outside Egypt.
This is enforced by the single-region architecture and will be maintained in Phase 2
via data residency partitioning.

---

## Section 3 — Phase 2: Active-Passive Dual Region (Cairo + Riyadh)

### 3.1 Trigger Criteria

Phase 2 multi-region deployment activates when:
- Egypt MAU ≥ 50,000 (Phase 1 → 2 gate met)
- CMA Saudi Arabia license received
- Engineering team ≥ 25 engineers

### 3.2 Component Replication Strategy

| Component | Replication Method | Direction | RPO | RTO |
|-----------|------------------|----------|-----|-----|
| **PostgreSQL** | Streaming WAL (async replica in Riyadh) | Cairo → Riyadh | < 5 seconds | < 5 minutes |
| **Kafka** | MirrorMaker 2 (selective topics) | Cairo → Riyadh | < 30 seconds | < 5 minutes |
| **MinIO WORM** | Bucket replication (async) | Cairo → Riyadh | < 5 minutes | < 15 minutes |
| **Valkey** | No replication — rebuilt from Kafka | N/A | Reconstruct | < 2 minutes |
| **Qdrant** | Snapshot replication (daily) | Cairo → Riyadh | < 24 hours | < 15 minutes |
| **Keycloak** | Read replica from Cairo DB | Cairo → Riyadh | < 5 seconds | < 5 minutes |

### 3.3 Data Partitioning by User Home Region

```typescript
// User's home region is set at registration and immutable
interface UserRegionConfig {
  userId: string;
  homeRegion: 'EGYPT' | 'SAUDI' | 'UAE';
  
  // Data residency rule:
  // EGYPT users: primary data in Cairo ONLY
  // SAUDI users: primary data in Riyadh ONLY (NDMO requirement)
  // UAE users:   primary data in Dubai ONLY (SCA requirement)
  
  writeEndpoint: string;   // Always home region
  readEndpoints: string[]; // Home region + replicas (for performance)
}

// Request routing in API Gateway (Kong)
// Saudi users → Riyadh write endpoint
// Egyptian users → Cairo write endpoint
// Both read from nearest region
```

### 3.4 Kafka MirrorMaker 2 Configuration

```yaml
# infrastructure/kafka/mirrormaker2-config.yaml
# Only replicate cross-region relevant topics

mirrormaker2:
  source_cluster: cairo-kafka
  target_cluster: riyadh-kafka
  
  replication_policy:
    topics_to_replicate:
      - "market.data.*"           # EGX prices (read-only reference data)
      - "platform.*.v1"           # Platform events (feature flags, etc.)
    
    topics_NOT_replicated:        # Data stays in home region
      - "portfolio.*"             # Egyptian user portfolios stay in Cairo
      - "ai.consensus.*"          # Recommendations: stateless, re-generated per region
      - "compliance.kyc.*"        # KYC data: stays in home region (PDPL/NDMO)
      - "identity.user.*"         # User identity: stays in home region
    
    consumer_group_offset_sync:
      enabled: true
      interval.seconds: 60
```

### 3.5 DNS Failover Architecture

```
User request: api.tradeora.com
       │
       ▼
Cloudflare DNS (GeoDNS + health check routing)
       │
       ├── Egyptian users → cairo-lb.tradeora.internal → Cairo Kubernetes
       ├── Saudi users    → riyadh-lb.tradeora.internal → Riyadh Kubernetes
       └── UAE users      → dubai-lb.tradeora.internal → Dubai Kubernetes

# Failover: if health check fails for > 2 minutes
cairo-lb down → Egyptian users fail over to riyadh-lb (DR mode)
riyadh-lb down → Saudi users fail over to cairo-lb (DR mode — data served from replica)

# TTL: 60 seconds (allows fast failover)
# Health check: HTTPS every 30 seconds to /api/v1/health
```

### 3.6 Cross-Region Traffic Routing

```yaml
# Kong route configuration for multi-region routing
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: region-router
config:
  home_region_header: X-User-Region  # Set by auth middleware
  routing_rules:
    - region: EGYPT
      write_upstream: cairo-write-upstream
      read_upstream: cairo-read-upstream
    - region: SAUDI
      write_upstream: riyadh-write-upstream
      read_upstream: riyadh-read-upstream
      fallback_write_upstream: cairo-write-upstream  # DR fallback only
```

---

## Section 4 — Phase 3: Active-Active Multi-Region (Cairo + Riyadh + Dubai)

### 4.1 Architecture Shift: Write Affinity Model

Phase 3 uses **write affinity** (not full active-active) to avoid distributed write conflicts:
- Every user has a **home region** where ALL their writes go
- Reads can be served from any region (eventual consistency acceptable for reads)
- No global distributed transactions (too complex, too slow for financial data)

```
User (Saudi): All writes → Riyadh DB (home region)
              Reads → Riyadh DB (freshest) or Cairo replica (if latency better)

User (Egyptian): All writes → Cairo DB (home region)
                 Reads → Cairo DB

User (UAE): All writes → Dubai DB (home region)
            Reads → Dubai DB or closest replica
```

### 4.2 Conflict Resolution

Since writes always go to home region and data is partitioned by user (not shared),
there are **no write conflicts** between regions. The only conflict risk is in
truly shared data (instrument master data, market data):

```typescript
// Shared reference data (EGX instrument registry, market prices):
// Published by Cairo (single source of truth)
// Replicated read-only to all regions via Kafka MirrorMaker 2
// NO regional modification of shared reference data

// User-specific data (portfolios, alerts, recommendations):
// Partitioned by user home region
// Writes only to home region
// Read from home region (always consistent)
```

### 4.3 Eventual Consistency Zones

| Data Type | Consistency Model | Acceptable Staleness |
|-----------|-----------------|---------------------|
| Market prices (read in non-home region) | Eventual | < 30 seconds |
| Portfolio NAV (read in non-home region) | Session | Immediate (always from home) |
| User preferences | Eventual | < 60 seconds |
| Feature flags | Eventual | < 5 minutes |
| AI recommendations | Generated locally | N/A (stateless per region) |

---

## Section 5 — Data Sovereignty Enforcement Matrix

| Data Category | Egypt (Cairo) | Saudi Arabia (Riyadh) | UAE (Dubai) | Enforcement Mechanism |
|---------------|--------------|----------------------|------------|----------------------|
| Egyptian user portfolio data | **MUST reside here** | Replica (read-only) | NO | PDPL 2020, FRA |
| Saudi user financial data | NO | **MUST reside here** | NO | NDMO, CMA |
| UAE user financial data | NO | NO | **MUST reside here** | SCA |
| EGX market data | Primary | Replica (licensed) | Replica (licensed) | EGX data license |
| Tadawul market data | NO | Primary | Replica (licensed) | Tadawul data license |
| AI models (Qwen2.5) | Deployed here | Deployed here | Deployed here | No restriction (OSS) |
| WORM audit trail | 7-year retention here | 7-year retention here | 7-year retention here | FRA + CMA + SCA each jurisdiction |
| Anonymized analytics | Allowed | Allowed | Allowed | All jurisdictions permit |

---

## Section 6 — Regulatory Compliance per Region

### Egypt (Phase 1)
- **Regulator:** FRA (Financial Regulatory Authority)
- **Key law:** PDPL 2020
- **Data requirement:** All Egyptian user data in Egypt
- **AI regulation:** Information Service Provider license
- **Architecture impact:** Cairo-only DB, local Keycloak realm

### Saudi Arabia (Phase 2)
- **Regulator:** CMA (Capital Market Authority) + SAMA (Central Bank)
- **Key law:** NDMO (National Data Management Office) Personal Data Protection Law 2021
- **Data requirement:** Saudi user data must stay in Saudi Arabia
- **AI regulation:** SAMA Fintech Lab sandbox approval required before production
- **Sharia finance:** Mandatory Sharia-compliant screening for investment advice
- **Architecture impact:** Riyadh data center with dedicated Saudi user DB, Sharia AI school

### UAE (Phase 2)
- **Regulator:** SCA (Securities and Commodities Authority) + DIFC (for financial free zone)
- **Key law:** UAE PDPL (Federal Decree No. 45 of 2021)
- **Data requirement:** More flexible than Saudi — allows some cross-border transfer
- **Architecture impact:** Dubai data center for primary UAE users, optional EU data transfer

---

## Section 7 — Cross-Region Observability

### 7.1 Grafana Federation

```yaml
# Grafana datasource configuration for multi-region federation
datasources:
  - name: Prometheus-Cairo
    type: prometheus
    url: https://prometheus.cairo.tradeora.internal
    
  - name: Prometheus-Riyadh
    type: prometheus
    url: https://prometheus.riyadh.tradeora.internal
    
  - name: Prometheus-Dubai
    type: prometheus
    url: https://prometheus.dubai.tradeora.internal

# Global view dashboard uses Federation datasource:
# { job="federate", match[]="ai_school_participation_rate" }
# All regions' metrics visible in single pane
```

### 7.2 Cross-Region Latency Monitoring

```yaml
# Prometheus alert: cross-region replication lag
- alert: CrossRegionReplicationLag
  expr: |
    max by (source_region, target_region) (
      kafka_mirrormaker2_replication_lag_seconds
    ) > 60
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "MirrorMaker 2 lag > 60s between {{ $labels.source_region }} → {{ $labels.target_region }}"

# PostgreSQL WAL replication lag
- alert: PostgresWALReplicationLag
  expr: |
    max by (primary_region, replica_region) (
      pg_replication_slots_pg_wal_lsn_diff / 1024 / 1024
    ) > 100  # 100MB lag
  for: 2m
  labels:
    severity: critical
```

---

## Section 8 — Cost Model

### 8.1 Phase 1 (Single Region, Cairo)

| Component | Monthly Cost (est.) | Notes |
|-----------|-------------------|-------|
| Kubernetes cluster (3 nodes) | ~$1,500 | m5.2xlarge equivalent |
| GPU node (Ollama, RTX 4090) | ~$2,000 | GPU instance |
| PostgreSQL storage (3×SSD) | ~$300 | 500GB per node |
| MinIO storage | ~$200 | 10TB WORM |
| Bandwidth (EGX feed, API) | ~$200 | Outbound + inbound |
| **Total Phase 1** | **~$4,200/month** | ~$50,400/year |

### 8.2 Phase 2 Incremental Cost (Add Riyadh)

| Additional Component | Monthly Cost (est.) |
|---------------------|-------------------|
| Riyadh Kubernetes cluster | ~$1,500 |
| Riyadh GPU node | ~$2,000 |
| Cross-region data transfer (WAL + Kafka) | ~$500 |
| Riyadh MinIO storage | ~$200 |
| **Phase 2 additional** | **~$4,200/month** |
| **Total Phase 2** | **~$8,400/month** |

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT FOOTER                                                             ║
║  Document: MULTI_REGION_ARCHITECTURE.md                                     ║
║  Version:  1.0.0                                                            ║
║  Owner:    Platform Engineering + Infrastructure                             ║
║  Completeness: 97% — Phase 1 fully specified; Phase 2/3 architecture,       ║
║    replication strategy, data sovereignty, DNS failover, cost model done.   ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Section 9 — Cross-Region Failover Runbook (Phase 2+)

### 9.1 Scenario: Cairo Region Unavailable — Failover to Riyadh

**Trigger:** Cairo region health checks fail for > 2 consecutive minutes.

```bash
# STEP 1: Confirm Cairo is actually down (not a monitoring glitch)
curl -sf --max-time 10 https://health.cairo.tradeora.internal/ready || echo "Cairo DOWN"
curl -sf --max-time 10 https://health.riyadh.tradeora.internal/ready && echo "Riyadh UP"

# STEP 2: Assess replication lag before failing over
# Check PostgreSQL WAL replica lag in Riyadh
kubectl exec -n databases-riyadh patroni-0 -- \
  psql -U postgres -c "
    SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag,
           pg_is_in_recovery() AS is_replica;
  "
# Expected: lag < 10 seconds (within RPO). If lag > 60s: DO NOT failover automatically.

# STEP 3: Update Cloudflare DNS to route all traffic to Riyadh
# This step requires Cloudflare API access (run from ops bastion)
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records/${RECORD_ID}" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "A",
    "name": "api.tradeora.com",
    "content": "'${RIYADH_LB_IP}'",
    "proxied": true
  }'

# STEP 4: Promote Riyadh replica to primary (PostgreSQL)
kubectl exec -n databases-riyadh patroni-0 -- \
  patronictl -c /etc/patroni/patroni.yml promote tradeora-postgres --force

# STEP 5: Verify Riyadh accepts writes
kubectl exec -n databases-riyadh patroni-0 -- \
  psql -U postgres -c "
    SELECT pg_is_in_recovery();  -- Should return: f (false = primary)
  "

# STEP 6: Update PgBouncer in Riyadh to point to local primary
kubectl exec -n databases-riyadh deploy/pgbouncer -- \
  psql -p 6432 pgbouncer -c "RECONNECT;"

# STEP 7: Monitor error rates
watch -n 10 'curl -s https://prometheus.riyadh.tradeora.internal/api/v1/query \
  --data-urlencode "query=rate(http_requests_total{status=~\"5..\"}[2m])" | jq .data.result'
```

**Important constraints during Cairo DR mode:**
- Egyptian user data: Served from Riyadh WAL replica — data may be up to RPO (5s) behind
- AI recommendations: Stateless — work normally in Riyadh
- EGX market data: Must reconnect feed connector in Riyadh to EGX feed
- WORM audit: Cairo WORM unreachable — Riyadh WORM used for new records; Cairo gap replayed after recovery

### 9.2 Scenario: Cairo Region Recovered — Failback Procedure

```bash
# STEP 1: Confirm Cairo is fully healthy
./scripts/health-check-all.sh --region cairo
# All services: Running, all health checks: PASS

# STEP 2: Check Cairo PostgreSQL replication caught up
# Cairo was promoted as standby under Riyadh primary
kubectl exec -n databases-cairo patroni-0 -- \
  psql -U postgres -c "SELECT now() - pg_last_xact_replay_timestamp() AS lag;"
# Target: lag < 5 seconds

# STEP 3: Planned failback — switch DNS back to Cairo
# This requires change window notification (15 min advance notice)
# Update Cloudflare DNS back to Cairo load balancer
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records/${RECORD_ID}" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  --data '{"content": "'${CAIRO_LB_IP}'"}'

# STEP 4: Promote Cairo back to primary
kubectl exec -n databases-cairo patroni-0 -- \
  patronictl -c /etc/patroni/patroni.yml failover tradeora-postgres \
  --master riyadh-patroni-0 --candidate cairo-patroni-0 --force

# STEP 5: Demote Riyadh back to replica
# Riyadh PostgreSQL automatically becomes replica after Cairo takes leader lock

# STEP 6: Resume normal MirrorMaker 2 replication (Cairo → Riyadh)
kubectl rollout restart deployment/kafka-mirrormaker2 -n kafka

# STEP 7: Replay any WORM events missed during Cairo outage
kubectl exec -n compliance-cairo deploy/audit-trail -- \
  curl -X POST http://localhost:8080/internal/dlq/replay \
  -H "X-Internal-Auth: ${INTERNAL_API_KEY}"
```

---

## Section 10 — Network Latency Budget Per Component

### 10.1 Intra-Region Latency Targets (Phase 1, Cairo)

| Path | Expected Latency | Budget |
|------|----------------|--------|
| Flutter app → Kong API Gateway | 20–50ms (LTE) | < 200ms |
| Kong → Application Service (k8s pod) | < 1ms | < 5ms |
| Application Service → PostgreSQL (PgBouncer) | < 2ms | < 10ms |
| Application Service → Valkey | < 1ms | < 5ms |
| Application Service → Kafka (produce) | < 5ms | < 20ms |
| Application Service → Ollama (AI inference) | 200–600ms | < 800ms |
| Application Service → MinIO (WORM write) | < 10ms | < 50ms |
| EGX Feed → Kafka (ingest) | < 100ms | < 500ms |

**Total P99 E2E budget (AI recommendation):**
```
Kong routing:     5ms
Auth (Keycloak):  2ms (cached JWT)
App processing:   10ms
Ollama inference: 600ms (17 schools parallel)
Response:         5ms
─────────────────
Total:            622ms   ← within 800ms SLO ✅
```

### 10.2 Cross-Region Latency Targets (Phase 2, Cairo ↔ Riyadh)

| Path | Expected RTT | Notes |
|------|-------------|-------|
| Cairo → Riyadh (internet path) | 80–120ms | Via UAE submarine cable |
| Cairo → Riyadh (dedicated cloud) | 50–80ms | AWS/GCP dedicated backbone |
| PostgreSQL WAL streaming (Cairo → Riyadh) | 60–100ms per batch | Async — does not affect write latency |
| Kafka MirrorMaker 2 (Cairo → Riyadh) | 80–120ms per message | Acceptable for reference data |

**Design implication:** Because cross-region latency is 60–120ms, ALL writes for a user
go to their **home region** — no cross-region synchronous writes. Cross-region traffic
is replication-only (async), never in the write path.

---

## Section 11 — FluxCD GitOps Topology (Multi-Region)

### 11.1 FluxCD Per-Region Configuration

```yaml
# Each region has its own FluxCD installation
# referencing the SAME Git repository but DIFFERENT kustomize overlay

# Cairo region FluxCD source
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: tradeora-platform
  namespace: flux-system
spec:
  url: https://github.com/tradeora/infrastructure
  ref:
    branch: main
  interval: 1m

# Cairo kustomization (applies Cairo-specific patches)
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: tradeora-platform-cairo
  namespace: flux-system
spec:
  sourceRef:
    kind: GitRepository
    name: tradeora-platform
  path: ./k8s/overlays/cairo          # Cairo-specific values
  prune: true
  interval: 5m
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: api-gateway
      namespace: api-gateway

---
# Riyadh region (IDENTICAL GitRepository, different overlay path)
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: tradeora-platform-riyadh
  namespace: flux-system           # Installed in Riyadh cluster
spec:
  path: ./k8s/overlays/riyadh      # Riyadh-specific values (Saudi endpoints, etc.)
  prune: true
  interval: 5m
```

### 11.2 Region-Specific Kustomize Overlays

```
k8s/
├── base/                          # Shared across all regions
│   ├── api-gateway/
│   ├── ai-services/
│   ├── core-services/
│   └── databases/
│
└── overlays/
    ├── cairo/                     # Egypt-specific overrides
    │   ├── kustomization.yaml
    │   ├── configmap-region.yaml  # REGION=cairo, EGX_FEED_URL=...
    │   ├── hpa-cairo.yaml         # Cairo-specific scaling (EGX session peaks)
    │   └── storage-cairo.yaml     # Cairo storage class
    │
    ├── riyadh/                    # Saudi-specific overrides
    │   ├── kustomization.yaml
    │   ├── configmap-region.yaml  # REGION=riyadh, TADAWUL_FEED_URL=...
    │   ├── sharia-school-patch.yaml # Enables Sharia compliance AI school
    │   └── storage-riyadh.yaml    # Riyadh storage class (NDMO compliant)
    │
    └── dubai/                     # UAE-specific overrides (Phase 2+)
        ├── kustomization.yaml
        ├── configmap-region.yaml  # REGION=dubai, DFM_FEED_URL=...
        └── storage-dubai.yaml
```

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT FOOTER (EXPANDED)                                                  ║
║  Document: MULTI_REGION_ARCHITECTURE.md                                     ║
║  Version:  1.0.1 (expanded with failover runbook, latency budget, GitOps)  ║
║  Owner:    Platform Engineering + Infrastructure + SRE                      ║
║  Completeness: 99%                                                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
```
