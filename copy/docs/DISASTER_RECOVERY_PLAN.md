# Tradeora Financial Operating System
## Disaster Recovery Plan — Production Continuity Reference
## Version 1.0.0 | Status: APPROVED | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Constitution Article 24  : Business continuity mandate                      ║
║  Constitution Article 25  : Data durability (zero financial data loss)       ║
║  Regulatory Requirement   : FRA — business continuity plan required          ║
║  PDPL 2020                : Breach notification within 72 hours              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Section 1 — DR Philosophy

### 1.1 Guiding Principles

**1. Financial data durability is non-negotiable.**  
RTO for user-facing services can be hours. Financial data (WORM audit trail,
portfolio history, transaction records) must have zero data loss. The WORM
storage layer is the last line of defense.

**2. Recovery is Infrastructure-as-Code.**  
Every infrastructure component is declared in Git (FluxCD/Terraform). A complete
environment can be rebuilt from code. No "tribal knowledge" recovery paths.

**3. DR plans are only as good as the last test.**  
Untested DR plans are fiction. Quarterly DR drills are mandatory (see Section 5).

**4. Fail loudly — never silently.**  
When a recovery step fails, it must alert loudly. Silent recovery failures
become discovered data loss incidents during audits.

### 1.2 Recovery Tiers

| Tier | Criteria | RTO Target | RPO Target |
|------|---------|-----------|-----------|
| CRITICAL | Financial data, user authentication | < 15 minutes | < 5 seconds |
| HIGH | AI recommendations, real-time prices | < 30 minutes | N/A (stateless) |
| MEDIUM | Portfolio display, news feed | < 2 hours | < 15 minutes |
| LOW | Historical analytics, reports | < 4 hours | < 1 hour |

---

## Section 2 — RTO/RPO Matrix by Component

| Component | RTO | RPO | DR Strategy | Recovery Method |
|-----------|-----|-----|------------|----------------|
| **PostgreSQL (primary)** | 5 min | 5 seconds | Patroni auto-failover | Automatic leader election |
| **PostgreSQL (full cluster)** | 30 min | 5 seconds | WAL-G restore | Restore from MinIO WAL archive |
| **Kafka (1 broker fails)** | 0 min | 0 | Quorum (2/3) maintained | Automatic partition rebalance |
| **Kafka (2 brokers fail)** | 15 min | 30 seconds | Quorum lost, restore | Restart brokers, reassign partitions |
| **Valkey/Cache** | 2 min | N/A | Reconstructed from Kafka | Cache warm-up procedure |
| **MinIO WORM (audit)** | 15 min | 5 min | Object Lock + restore | Restart MinIO, data survives on disk |
| **Ollama/AI inference** | 30 min | N/A (stateless) | GPU node replacement | Re-provision GPU node |
| **Keycloak (auth)** | 5 min | 0 | Cluster + PG backup | Restart cluster, restore Keycloak DB |
| **API Gateway (Kong)** | 3 min | N/A (stateless) | Pod restart / HPA | kubectl rollout restart |
| **AI Schools (pods)** | 5 min | N/A (stateless) | Kubernetes self-heal | HPA + ReplicaSet restart |
| **EGX Data Feed** | 10 min | 5 min | Vendor reconnect / backup | Restart connector, switch provider |
| **Full Data Center (Phase 1)** | 4 hours | 5 min (PG) | Rebuild from IaC | Terraform + FluxCD + restore |

---

## Section 3 — Disaster Scenarios

### SCENARIO-DR-01: Single Kubernetes Node Failure

**Classification:** EXPECTED — hardware nodes fail  
**Impact:** Services on the failed node become unavailable briefly  
**RTO:** < 2 minutes (Kubernetes self-healing)  

**Detection:**
```bash
# Kubernetes node becomes NotReady
kubectl get nodes | grep NotReady
# Alert: node_not_ready fires in < 1 minute
```

**Recovery (automatic):**
```
Node → NotReady
  │
  └── Kubernetes Node Controller waits 2 minutes (node-monitor-grace-period)
       │
       └── Pods evicted and rescheduled on healthy nodes
            │
            └── HPA ensures min 2 replicas per deployment
                 │
                 └── New pods scheduled, services recover
```

**On-call action:**
```bash
# Verify recovery happened automatically
kubectl get pods -A | grep -v Running | grep -v Completed
# If pods not rescheduled after 5 minutes:
kubectl describe pod <stuck-pod> -n <namespace>
# Check for resource pressure on remaining nodes
kubectl describe node <healthy-node> | grep -A10 "Conditions:"
```

**Post-incident:**
- Replace or repair the failed node
- Investigate cause (hardware, cloud provider, OS)
- Ensure no financial data was on the failed node's ephemeral storage

---

### SCENARIO-DR-02: PostgreSQL Primary Pod Failure (Single Pod)

**Classification:** EXPECTED — primary pod can OOMKill or crash  
**Impact:** Brief write interruption (< 30 seconds during election)  
**RTO:** 5 minutes | **RPO:** < 5 seconds (streaming replication lag)  

**Detection:**
```bash
# Patroni detects primary unhealthy via health checks
# Alert: patroni_leader_lost fires
kubectl get pods -n databases | grep patroni
```

**Recovery (Patroni automatic):**
```
patroni-0 (primary) crashes
  │
  ├── Patroni DCS (etcd) detects: no heartbeat for TTL seconds (default 10s)
  │
  ├── Patroni replicas race for leader lock in etcd
  │
  ├── Replica with lowest lag wins: patroni-1 becomes new primary
  │
  ├── HAProxy health checks update: route writes to patroni-1
  │
  └── PgBouncer reconnects to new primary via HAProxy VIP
       Target: < 30 seconds total
```

**On-call action (if Patroni election stalls > 90 seconds):**
```bash
# Check etcd health (Patroni's DCS)
kubectl exec -n databases patroni-0 -- \
  patronictl -c /etc/patroni/patroni.yml list

# Manual failover if needed
kubectl exec -n databases patroni-1 -- \
  patronictl -c /etc/patroni/patroni.yml failover tradeora-postgres \
  --master patroni-0 --candidate patroni-1 --force

# Rebuild failed patroni-0 as new replica
kubectl delete pod patroni-0 -n databases
# Pod restarts, joins cluster as replica, replicates from new primary
```

**Verify:**
```bash
kubectl exec -n databases patroni-1 -- \
  psql -U postgres -c "SELECT pg_is_in_recovery();"
# Should return: f (false = this is now primary)

kubectl exec -n databases patroni-0 -- \
  psql -U postgres -c "SELECT pg_is_in_recovery();"
# Should return: t (true = this is replica now)
```

---

### SCENARIO-DR-03: GPU Node Failure (AI Service Unavailability)

**Classification:** SIGNIFICANT — AI recommendations offline  
**Impact:** All AI recommendations blocked; portfolio valuation still works  
**RTO:** 30 minutes (provision new GPU node) to 4 hours (if GPU unavailable)  
**RPO:** N/A (AI inference is stateless)  

**Detection:**
```bash
# Ollama pod enters CrashLoopBackOff or Pending (no GPU node)
kubectl get pods -n ai-services -l app=ollama
# Alert: ollama_unavailable fires
```

**Response:**
```bash
# Step 1: Confirm AI recommendations are blocked (safety gate active)
kubectl exec -n ai-services deploy/ai-consensus-orchestrator -- \
  curl -s http://localhost:9090/metrics | grep recommendation_safety_gate_blocked_total

# Step 2: Post on status page:
# "AI analysis features temporarily unavailable. Portfolio tracking continues normally."

# Step 3: Provision replacement GPU node
# For cloud: adjust node group to include GPU capacity
# For on-prem: escalate to hardware team

# Step 4: If CPU-only inference acceptable (lower quality):
kubectl set env deployment/ollama -n ai-services \
  OLLAMA_FORCE_CPU=true \
  OLLAMA_MODEL=qwen2.5:7b  # Smaller model for CPU inference
kubectl rollout restart deployment/ollama -n ai-services

# Step 5: After new GPU node available:
kubectl uncordon <new-gpu-node>
kubectl set env deployment/ollama -n ai-services \
  OLLAMA_FORCE_CPU=false \
  OLLAMA_MODEL=qwen2.5:72b
kubectl rollout restart deployment/ollama -n ai-services
```

**User communication (Arabic):**
> "نعتذر عن انقطاع خدمة التحليل الذكي مؤقتاً. خدمة تتبع المحفظة تعمل بشكل طبيعي."

---

### SCENARIO-DR-04: Kafka Cluster Failure (Minority — 1 of 3 Brokers)

**Classification:** EXPECTED — single broker failures are normal  
**Impact:** None (quorum maintained with 2/3 brokers)  
**RTO:** 0 (automatic partition rebalance)  

**Response:**
```bash
# Verify quorum is maintained
kubectl exec -n kafka kafka-0 -- kafka-broker-api-versions.sh \
  --bootstrap-server kafka-0.kafka:9092 2>&1 | head -3
# Should succeed (2 brokers can still handle requests)

# Failed broker will restart automatically (StatefulSet)
kubectl get pods -n kafka

# After restart, rebalance partitions if needed
kubectl exec -n kafka kafka-0 -- kafka-reassign-partitions.sh \
  --bootstrap-server kafka-0.kafka:9092 \
  --reassignment-json-file /tmp/reassignment.json \
  --execute 2>&1
```

---

### SCENARIO-DR-05: Kafka Cluster Failure (Majority — 2 of 3 Brokers)

**Classification:** CRITICAL — event streaming offline  
**Impact:** All Kafka-dependent features degraded; AI pipeline stalled  
**RTO:** 15 minutes | **RPO:** 30 seconds (in-flight messages may be lost)  

**Response:**
```bash
# Step 1: Determine what killed 2 brokers
kubectl describe pod -n kafka kafka-1 | tail -30
kubectl describe pod -n kafka kafka-2 | tail -30

# Step 2: Restart failed brokers
kubectl delete pod kafka-1 kafka-2 -n kafka
kubectl rollout status statefulset/kafka -n kafka --timeout=300s

# Step 3: After brokers restart, verify cluster rejoins
kubectl exec -n kafka kafka-0 -- kafka-topics.sh \
  --bootstrap-server kafka-0.kafka:9092 \
  --describe --topic portfolio.PortfolioNAVUpdated.v1 2>&1 | head -5
# Should show 3 replicas

# Step 4: Verify consumer groups resume
kubectl exec -n kafka kafka-0 -- kafka-consumer-groups.sh \
  --bootstrap-server kafka-0.kafka:9092 \
  --describe --group audit-trail-consumer 2>&1
# Lag should be decreasing
```

**RPO Impact:** Events published between crash and recovery may be lost if not
persisted to producer-side retry queues. All Tradeora producers use
`acks=all` and local retry queue — actual data loss should be minimal.

---

### SCENARIO-DR-06: MinIO WORM Storage Failure

**Classification:** CRITICAL — FRA compliance risk if gap > 1 hour  
**Impact:** Audit events queued in DLQ, not yet WORM-archived  
**RTO:** 15 minutes | **RPO:** 5 minutes (events in DLQ)  

**Response:**
```bash
# Step 1: Check MinIO health
kubectl get pods -n storage -l app=minio
kubectl logs -n storage $(kubectl get pod -n storage -l app=minio -o name | head -1) --tail=100

# Step 2: Check disk space
kubectl exec -n storage $(kubectl get pod -n storage -l app=minio -o name | head -1) -- \
  df -h /data

# Step 3: Restart MinIO (data persists on PVC)
kubectl rollout restart statefulset/minio -n storage
kubectl rollout status statefulset/minio -n storage --timeout=120s

# Step 4: Verify Object Lock intact after restart
kubectl exec -n storage deploy/minio -- \
  mc retention info --recursive tradeora/tradeora-audit-trail/

# Step 5: Check DLQ depth and trigger replay
kubectl exec -n compliance deploy/audit-trail -- \
  curl -s http://localhost:9090/metrics | grep audit_dead_letter_queue_depth

kubectl exec -n compliance deploy/audit-trail -- \
  curl -X POST http://localhost:8080/internal/dlq/replay \
  -H "X-Internal-Auth: $INTERNAL_API_KEY"

# Step 6: Monitor coverage ratio recovery
watch -n 10 'kubectl exec -n compliance deploy/audit-trail -- \
  curl -s http://localhost:9090/metrics | grep audit_worm_coverage_ratio'
```

**Compliance escalation threshold:**
- Gap > 30 minutes: Notify Compliance Engineering Lead
- Gap > 1 hour: Notify Compliance Officer
- Gap > 4 hours: Notify FRA per Article 14 reporting protocol

---

### SCENARIO-DR-07: Full Data Center Failure (Phase 1 — No Cross-Region DR)

**Classification:** CATASTROPHIC — complete platform outage  
**Impact:** All services offline; users cannot access Tradeora  
**RTO:** 4 hours (rebuild from IaC) | **RPO:** 5 minutes for DB, 7 days for Kafka  

**This scenario triggers Phase 2 acceleration:** Cross-region DR becomes P0.

**Pre-requisites for recovery:**
- Git repository access (all IaC)
- MinIO backup credentials (in OpenBao, also backed up offline)
- WAL-G backup location (separate MinIO bucket)
- On-call team assembled (minimum: 2 senior engineers + DBA)

**Recovery Procedure:**

```bash
# === PHASE 1: INFRASTRUCTURE PROVISIONING (0-60 min) ===

# 1. Provision new Kubernetes cluster (cloud provider)
# Ensure: GPU node group included (for Ollama)
# Use saved Terraform config from git:
cd infrastructure/terraform/environments/production
terraform init
terraform plan
terraform apply -auto-approve

# 2. Configure kubeconfig for new cluster
aws eks update-kubeconfig --name tradeora-prod --region me-south-1
# OR: gcloud container clusters get-credentials tradeora-prod

# 3. Deploy FluxCD (GitOps operator)
flux install
flux create source git tradeora-infra \
  --url=https://github.com/tradeora/infrastructure \
  --branch=main \
  --secret-ref=github-auth
flux create kustomization infra \
  --source=GitRepository/tradeora-infra \
  --path="./k8s/namespaces" \
  --prune=true \
  --interval=1m
# FluxCD will apply all namespace and base config automatically

# 4. Deploy infrastructure dependencies (MinIO, Kafka, Patroni)
flux create kustomization databases \
  --source=GitRepository/tradeora-infra \
  --path="./k8s/databases" \
  --prune=true \
  --interval=1m

# Wait for Kafka and PostgreSQL pods
kubectl wait --for=condition=ready pod -l app=kafka -n kafka --timeout=300s
kubectl wait --for=condition=ready pod -l app=patroni -n databases --timeout=300s


# === PHASE 2: DATA RESTORATION (60-150 min) ===

# 1. Restore PostgreSQL from WAL-G backup
# Find latest backup:
kubectl exec -n databases patroni-0 -- \
  wal-g backup-list --detail 2>&1 | tail -5

# Restore (on fresh patroni-0 pod):
kubectl exec -n databases patroni-0 -- \
  wal-g backup-fetch /var/lib/postgresql/data LATEST

# Configure recovery target (point-in-time)
kubectl exec -n databases patroni-0 -- bash -c \
  "echo \"recovery_target_time='$(date -u '+%Y-%m-%d %H:%M:%S')'\" >> /var/lib/postgresql/data/recovery.conf"

# Let Patroni bootstrap the cluster from the restored data
kubectl delete pod -n databases patroni-0
# Patroni will restart, detect restored data, and bootstrap

# 2. Restore MinIO WORM audit trail
# NOTE: If MinIO data survived (PVC on separate storage), no restore needed
# If fresh MinIO: data is already WORM-locked on old storage — mount same PVC
# Or restore from cross-region backup (Phase 2)

# 3. Bootstrap Valkey (no restore needed — reconstructs from Kafka)
# Valkey will rebuild its cache as consumers reconnect


# === PHASE 3: APPLICATION DEPLOYMENT (90-180 min) ===

# FluxCD auto-deploys all application services from Git
# Monitor deployment progress:
flux get kustomizations --watch

# Or manually apply all services:
kubectl apply -k ./k8s/applications/production

# Wait for critical services
kubectl wait --for=condition=ready pod -l app=api-gateway -n api-gateway --timeout=300s
kubectl wait --for=condition=ready pod -l app=keycloak -n identity --timeout=300s
kubectl wait --for=condition=ready pod -l app=ollama -n ai-services --timeout=300s


# === PHASE 4: VERIFICATION (180-240 min) ===

# Run full health check script
./scripts/health-check-all.sh

# Verify AI recommendations work
curl -X POST https://api.tradeora.com/api/v1/recommendations \
  -H "Authorization: Bearer $TEST_USER_TOKEN" \
  -d '{"ticker": "COMI"}' | jq .recommendation

# Verify audit trail is working
curl https://api.tradeora.com/api/v1/audit/coverage/daily?date=$(date +%Y-%m-%d) \
  -H "Authorization: Bearer $COMPLIANCE_TOKEN" | jq .wormCoverageRate

# Verify EGX market data flowing
curl https://api.tradeora.com/api/v1/market-data/tickers/COMI/price \
  -H "Authorization: Bearer $TEST_USER_TOKEN" | jq .price
```

**Communication:**
- Status page: Update to "Major Outage — Recovery in Progress"
- User notification (Arabic + English): "نعمل على استعادة الخدمة. نأسف للإزعاج"
- FRA notification: Required if outage > 4 hours (per FRA business continuity rules)
- Internal: Assemble war room in Slack #incident-dr-activation

---

### SCENARIO-DR-08: Ransomware / Data Corruption Attack

**Classification:** CATASTROPHIC  
**Impact:** Production data may be encrypted or corrupted  
**Special:** MinIO WORM with Object Lock is the primary defense  

**Immediate response (first 15 minutes):**
```bash
# STEP 1: ISOLATE — cut off network access
# Isolate affected nodes IMMEDIATELY
kubectl cordon <affected-node-1> <affected-node-2>
kubectl drain <affected-node> --ignore-daemonsets --delete-emptydir-data --force

# Block all external traffic immediately
kubectl apply -f ./security/emergency-network-policy.yaml
# emergency-network-policy.yaml: deny all ingress except monitoring

# STEP 2: ASSESS — what is encrypted?
# Check PostgreSQL (most critical)
kubectl exec -n databases patroni-0 -- \
  psql -U postgres -c "SELECT count(*) FROM portfolio.portfolios;" 2>&1
# If returns error: PostgreSQL may be corrupted

# Check MinIO WORM (this should be unaffected by ransomware)
kubectl exec -n storage deploy/minio -- \
  mc ls tradeora/tradeora-audit-trail/ --recursive --json | head -5
# Object Lock prevents encryption of WORM-locked objects
```

**Recovery:**
```bash
# PostgreSQL: Restore from WAL-G backup (pre-attack point in time)
# Use recovery_target_time to restore to BEFORE the attack
kubectl exec -n databases patroni-0 -- \
  wal-g backup-fetch /var/lib/postgresql/data LATEST

# Set recovery target to before attack time (assume attack at T):
# recovery_target_time = T - 1 hour (conservative)

# Provision clean infrastructure BEFORE restoring data
# (do not restore to potentially compromised nodes)

# After recovery: Security forensics
# - Identify attack vector
# - Rotate all credentials (OpenBao dynamic secrets + manual rotation)
# - Deploy clean base images from known-good image registry
# - Scan all images before deploying
```

**PDPL requirement:** Data breach notification to PDPL authority within 72 hours if
personal data was accessed or exfiltrated.

---

## Section 4 — Backup Strategy

### 4.1 PostgreSQL Backup

| Backup Type | Tool | Frequency | Location | Retention |
|------------|------|-----------|---------|---------|
| Continuous WAL | WAL-G | Every 16MB or 5 min | MinIO: `tradeora-pg-backups` | 7 years (FRA) |
| Base backup | WAL-G | Daily (02:00 UTC) | MinIO: `tradeora-pg-backups` | 30 days |
| Pre-migration snapshot | WAL-G | Before every migration | MinIO: `tradeora-pg-backups` | 90 days |

```bash
# WAL-G configuration (env vars in Patroni pod)
WALG_S3_PREFIX=s3://tradeora-pg-backups
WALG_COMPRESSION_METHOD=lz4
WALG_DELTA_MAX_STEPS=6
WALG_RETAIN_FULL_BACKUPS=30

# Trigger manual backup (pre-maintenance)
kubectl exec -n databases patroni-0 -- wal-g backup-push /var/lib/postgresql/data

# Verify backup
kubectl exec -n databases patroni-0 -- wal-g backup-list --detail 2>&1 | tail -3
```

### 4.2 MinIO WORM Audit Trail

MinIO WORM with Object Lock IS the backup. No additional backup needed for audit trail.

- **Object Lock:** GOVERNANCE mode, 7-year retention enforced
- **Phase 2:** Cross-region replication to secondary MinIO (Dubai)
- **Integrity:** SHA-256 checksum chain + daily Merkle root computed and archived

### 4.3 Kafka Backup

| Data | Retention | Recovery If Lost |
|------|---------|----------------|
| Market data topics | 7 days | Re-ingest from EGX feed replay |
| Domain events | 30 days | Replay from EventStoreDB snapshots |
| Audit events | 7 days | WORM already archived to MinIO — Kafka is transit |
| Dead-letter queue | 7 days | Retry from application DLQ |

### 4.4 Valkey (Cache) Backup

No backup needed. Valkey is a cache — all data is reconstructed from:
1. Kafka topic replay (for event-derived cache entries)
2. Database queries (for database-derived cache entries)
3. Warm-up procedure runs automatically on restart

### 4.5 Keycloak Backup

Keycloak configuration is stored in PostgreSQL — covered by PostgreSQL WAL-G backup.
Additionally, realm configuration is exported to Git quarterly:

```bash
# Export Keycloak realm config (run quarterly or before major changes)
kubectl exec -n identity deploy/keycloak -- \
  /opt/keycloak/bin/kc.sh export \
  --dir /tmp/realm-export \
  --realm tradeora \
  --users realm_file
# Copy to Git: infrastructure/keycloak/realm-exports/
```

---

## Section 5 — DR Test Plan (Quarterly)

### 5.1 Test Schedule

| Quarter | Scenario | Duration | Environment |
|---------|---------|---------|------------|
| Q1 | SCENARIO-DR-02 (PostgreSQL failover) | 2 hours | Staging |
| Q2 | SCENARIO-DR-01 (Node failure) | 1 hour | Staging |
| Q3 | SCENARIO-DR-04/05 (Kafka broker failure) | 2 hours | Staging |
| Q4 | SCENARIO-DR-07 (Full rebuild from IaC) | 4 hours | Separate test env |

### 5.2 Pre-Test Checklist

```
[ ] Confirm test environment is isolated from production
[ ] Backup current staging state (so test can be reversed)
[ ] Notify team: "DR drill in progress — staging may be disrupted"
[ ] Confirm monitoring is working (Grafana, Prometheus alerts active)
[ ] Have runbooks open and ready
[ ] Time the recovery for each step
[ ] Document actual RTO achieved vs. target
```

### 5.3 PostgreSQL Failover Test (Q1 Procedure)

```bash
# STAGING ONLY — DO NOT RUN IN PRODUCTION
# Test: Kill PostgreSQL primary, measure auto-failover time

# 1. Record current primary
kubectl exec -n databases-staging patroni-0 -- \
  patronictl -c /etc/patroni/patroni.yml list

# 2. Start stopwatch

# 3. Kill primary
kubectl delete pod patroni-0 -n databases-staging --grace-period=0

# 4. Time to new leader election
watch -n 1 'kubectl exec -n databases-staging patroni-1 -- \
  patronictl -c /etc/patroni/patroni.yml list'
# Record: seconds to new leader appearing

# 5. Test write availability
START=$(date +%s%3N)
kubectl exec -n databases-staging patroni-1 -- \
  psql -U postgres -c "INSERT INTO health_check (ts) VALUES (NOW());" 2>&1
END=$(date +%s%3N)
echo "Write available after $((END - START))ms"

# 6. Success criteria
# - New primary elected: < 30 seconds
# - Write available: < 60 seconds
# - No data loss (row counts match pre-test)
```

### 5.4 Full IaC Rebuild Test (Q4 Procedure)

```bash
# This is done in a SEPARATE TEST ENVIRONMENT — not staging, not production

# Start timer
RECOVERY_START=$(date +%s)

# Phase 1: Provision
terraform apply -auto-approve
PHASE1_END=$(date +%s)
echo "Infrastructure provisioned in $((PHASE1_END - RECOVERY_START))s"

# Phase 2: Data restore
wal-g backup-fetch LATEST
PHASE2_END=$(date +%s)
echo "Data restored in $((PHASE2_END - PHASE1_END))s"

# Phase 3: App deployment
flux reconcile kustomization --all
PHASE3_END=$(date +%s)
echo "Applications deployed in $((PHASE3_END - PHASE2_END))s"

# Phase 4: Verification
./scripts/health-check-all.sh
PHASE4_END=$(date +%s)

TOTAL=$((PHASE4_END - RECOVERY_START))
echo "====================================="
echo "Total RTO: ${TOTAL}s (target: 14400s)"
if [ $TOTAL -lt 14400 ]; then
  echo "✅ RTO TARGET MET"
else
  echo "❌ RTO TARGET MISSED — investigate bottlenecks"
fi
```

### 5.5 DR Test Report Template

```markdown
# DR Test Report
- Date: YYYY-MM-DD
- Scenario: SCENARIO-DR-XX
- Environment: staging / test
- Participants: [names]

## Results
| Step | Target Time | Actual Time | Status |
|------|------------|------------|--------|
| Infrastructure provisioned | 30 min | X min | ✅/❌ |
| Database restored | 60 min | X min | ✅/❌ |
| Applications deployed | 30 min | X min | ✅/❌ |
| Health checks passed | 30 min | X min | ✅/❌ |
| **Total RTO** | **4 hours** | **X hours** | ✅/❌ |

## Issues Found
- [List any steps that failed or took longer than expected]

## Action Items
- [Changes required to infrastructure, runbooks, or procedures]

## Sign-off
Chief Architect: _________________ Date: _________
SRE Lead: ________________________ Date: _________
```

---

## Section 6 — Recovery Decision Tree

```
INCIDENT DETECTED
       │
       ├── Single pod/service failure?
       │      YES → Use relevant RUNBOOK (RB-01 through RB-15)
       │      NO
       │
       ├── Single Kubernetes node failure?
       │      YES → SCENARIO-DR-01 (automatic, monitor)
       │      NO
       │
       ├── Database primary failure?
       │      YES → SCENARIO-DR-02 (Patroni auto-failover)
       │      NO
       │
       ├── Kafka broker failure?
       │      ├── 1 broker → SCENARIO-DR-04 (automatic, monitor)
       │      └── 2+ brokers → SCENARIO-DR-05 (manual restart)
       │
       ├── MinIO failure?
       │      YES → SCENARIO-DR-06 (restart, check WORM integrity)
       │      NO
       │
       ├── AI/GPU failure?
       │      YES → SCENARIO-DR-03 (GPU replacement)
       │      NO
       │
       ├── Multiple systems failing simultaneously?
       │      YES → SUSPECTED ATTACK or DC FAILURE
       │            ├── Isolate immediately
       │            ├── Assemble DR team (#incident-dr-activation)
       │            └── SCENARIO-DR-07 or SCENARIO-DR-08
       │
       └── Unknown?
              → Page SRE lead + Platform lead
              → Start incident war room
              → Collect logs before taking action
```

---

## Section 7 — FRA Compliance Requirements for DR

Per FRA Business Continuity Guidelines for Financial Information Providers:

| Requirement | Tradeora Response |
|------------|------------------|
| Written DR plan | This document (version-controlled in Git) |
| Annual DR plan review | Quarterly update + annual formal review |
| Tested annually | Quarterly drills (exceeds FRA minimum) |
| RTO < 4 hours | Achieved: 4-hour target for full rebuild |
| Data backup | WAL-G continuous WAL archival + MinIO WORM |
| Audit trail preservation | MinIO WORM with 7-year Object Lock (immutable) |
| Breach notification | PDPL Art. 20: 72 hours to PDPL authority |
| FRA notification | Within 4 hours for outages affecting service availability |

---

## Section 8 — Emergency Contacts & Escalation

| Role | Trigger | Contact |
|------|---------|---------|
| SRE On-Call | Any SEV-1 | PagerDuty auto-page |
| Platform Lead | DB or infra failure > 30 min | PagerDuty escalation |
| Chief Architect | SEV-1 > 60 min or SCENARIO-DR-07/08 | Direct call |
| Compliance Officer | WORM gap > 1 hour, data breach | Direct call (24/7) |
| FRA Hotline | Service unavailability > 4 hours | Per FRA registration |
| PDPL Authority | Personal data breach | Within 72 hours (legal) |
| Cloud Provider Support | Infrastructure failure | Ticket + phone (enterprise) |
| EGX Data Feed Vendor | Feed outage > 15 min during session | Vendor 24/7 hotline |

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT FOOTER                                                             ║
║  Document: DISASTER_RECOVERY_PLAN.md                                        ║
║  Version:  1.0.0                                                            ║
║  Owner:    SRE Lead + Platform Engineering                                  ║
║  Review Cadence: Quarterly + after every major incident                     ║
║  FRA Submission: Required annually                                           ║
║  TEST CADENCE: Quarterly drills mandatory. Untested DR is not DR.           ║
╚══════════════════════════════════════════════════════════════════════════════╝
```
