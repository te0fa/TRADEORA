# Tradeora Financial Operating System
## Operational Runbooks — On-Call Engineer Reference
## Version 1.0.0 | Status: APPROVED | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Constitution Article 22  : SRE mandate — every alert must have a runbook   ║
║  Constitution Article 23  : Incident response SLAs                          ║
║  Target Audience          : On-call engineers, SRE team                     ║
║  CRITICAL: Commands below are production-grade. Execute with care.          ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

> **Philosophy:** These runbooks are written for a sleep-deprived engineer at 3am.
> Every command is copy-paste ready. Every decision has a clear tree. No ambiguity.
> **Format:** Alert → Assess (2 min) → Diagnose → Remediate → Verify → Post-Incident

---

## RUNBOOK DIRECTORY

| ID | Alert Name | Severity | Team | Avg TTR |
|----|-----------|----------|------|---------|
| RB-01 | `ai_school_participation_low` | SEV-2 | AI Platform | 15 min |
| RB-02 | `egx_market_data_stale` | SEV-1/3 | Data Platform | 10 min |
| RB-03 | `portfolio_nav_error_rate_high` | SEV-2 | Core Platform | 20 min |
| RB-04 | `audit_worm_coverage_gap` | SEV-1 | Compliance Eng | 30 min |
| RB-05 | `postgres_primary_failover` | SEV-1 | Platform/DBA | 10 min |
| RB-06 | `kafka_consumer_lag_critical` | SEV-2 | Platform | 20 min |
| RB-07 | `keycloak_health_failing` | SEV-1 | Platform | 10 min |
| RB-08 | `gpu_node_memory_pressure` | SEV-2 | AI Platform | 15 min |
| RB-09 | `kyc_verification_degraded` | SEV-2 | Compliance Eng | 25 min |
| RB-10 | `tls_certificate_expiry` | SEV-3 | Platform | 60 min |
| RB-11 | `minio_worm_write_failed` | SEV-1 | Platform | 20 min |
| RB-12 | `valkey_memory_high` | SEV-2 | Platform | 15 min |
| RB-13 | `api_gateway_error_rate_high` | SEV-1 | Platform | 10 min |
| RB-14 | `pgbouncer_pool_exhausted` | SEV-2 | DBA | 15 min |
| RB-15 | `ollama_inference_timeout` | SEV-2 | AI Platform | 20 min |

---

## RUNBOOK RB-01: AI School Participation Low

**Alert:** `ai_school_participation_low`  
**PromQL trigger:** `ai_school_participation_rate < 0.70`  
**Severity:** SEV-2  
**Owner:** AI Platform Team  

### Step 1 — ASSESS (2 minutes)

```bash
# View all AI service pods
kubectl get pods -n ai-services -o wide

# Check participation metric directly
kubectl exec -n ai-services deploy/ai-consensus-orchestrator -- \
  curl -s http://localhost:9090/metrics | grep school_participation_rate

# Grafana quick link: http://grafana.internal/d/ai-schools/17-school-dashboard
# Look for: which schools are red/excluded?
```

### Step 2 — DIAGNOSE

**Decision tree:**

```
Is Ollama pod Running?
├── NO → Go to Step 3A (Ollama down)
└── YES
    │
    Is GPU memory > 90%?
    ├── YES → Go to Step 3B (GPU OOM)
    └── NO
        │
        Are individual school pods Running?
        ├── Some CrashLoopBackOff → Go to Step 3C (School pod crash)
        └── All Running
            │
            Is LiteLLM proxy healthy?
            ├── NO → Go to Step 3D (LiteLLM proxy issue)
            └── YES → Go to Step 3E (Timeout/inference slowness)
```

```bash
# Check Ollama health
kubectl exec -n ai-services deploy/ai-consensus-orchestrator -- \
  curl -s http://ollama-service:11434/api/tags | jq '.models[].name'

# Check GPU memory
kubectl exec -n ai-services $(kubectl get pod -n ai-services -l app=ollama -o name | head -1) -- \
  nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader

# Check which schools are excluded
kubectl logs -n ai-services deploy/ai-consensus-orchestrator --tail=200 | grep "school_excluded"

# Check school pod statuses
kubectl get pods -n ai-services -l tier=ai-school

# Check LiteLLM proxy
kubectl exec -n ai-services deploy/ai-consensus-orchestrator -- \
  curl -s http://litellm-proxy:8000/health
```

### Step 3 — REMEDIATE

**3A — Ollama pod down:**
```bash
kubectl rollout restart deployment/ollama -n ai-services
# Wait for Qwen2.5:72b to load (45–90 seconds)
kubectl rollout status deployment/ollama -n ai-services --timeout=180s
# Verify model is loaded
kubectl exec -n ai-services deploy/ollama -- curl -s http://localhost:11434/api/tags
```

**3B — GPU OOM (nvidia-smi shows memory > 90%):**
```bash
# Restart Ollama to release GPU memory
kubectl rollout restart deployment/ollama -n ai-services
# If that doesn't help, switch to Qwen2.5:7b (smaller model, lower quality)
kubectl set env deployment/ollama -n ai-services OLLAMA_MODEL=qwen2.5:7b
kubectl rollout restart deployment/ollama -n ai-services
# IMPORTANT: Create incident — GPU node may need to be upsized
# Notify AI Platform lead
```

**3C — School pod in CrashLoopBackOff:**
```bash
# Identify the crashing school
kubectl get pods -n ai-services -l tier=ai-school | grep CrashLoop
# Example: ai-fundamental-analysis-xxx is crashing

# Check crash logs
kubectl logs -n ai-services ai-fundamental-analysis-xxx --previous --tail=100

# Force restart the pod
kubectl delete pod -n ai-services ai-fundamental-analysis-xxx
# ReplicaSet will recreate automatically

# If crash persists after 2 restarts:
kubectl scale deployment -n ai-services ai-fundamental-analysis --replicas=0
# Consensus will continue with remaining schools (assuming >= 9 healthy)
# Page AI Platform on-call lead for deep diagnosis
```

**3D — LiteLLM proxy issue:**
```bash
kubectl rollout restart deployment/litellm-proxy -n ai-services
kubectl rollout status deployment/litellm-proxy -n ai-services --timeout=60s
```

**3E — Inference timeouts (schools timing out but healthy):**
```bash
# Check if Qwen2.5:72b is overloaded
kubectl exec -n ai-services $(kubectl get pod -n ai-services -l app=ollama -o name | head -1) -- \
  curl -s http://localhost:11434/api/ps | jq

# Increase school timeout temporarily
kubectl set env deployment/ai-consensus-orchestrator -n ai-services SCHOOL_TIMEOUT_MS=2500
kubectl rollout restart deployment/ai-consensus-orchestrator -n ai-services
# NOTE: This exceeds SLO — create ticket to investigate root cause
```

### Step 4 — VERIFY

```bash
# Watch participation rate recover
watch -n 5 'kubectl exec -n ai-services deploy/ai-consensus-orchestrator -- \
  curl -s http://localhost:9090/metrics | grep school_participation_rate'
# Target: value >= 0.70 for 2 consecutive readings
```

### Step 5 — POST-INCIDENT

- If duration > 30 min: create post-incident report (SEV-2 template)
- Check `ai_school_exclusion_count` metric to identify most frequently excluded school
- Review school accuracy data — if a school frequently drops out, consider its calibration
- Update this runbook if a new failure mode was discovered

---

## RUNBOOK RB-02: EGX Market Data Stale

**Alert:** `egx_market_data_stale`  
**PromQL trigger:** `egx_last_tick_age_seconds{session="OPEN"} > 900`  
**Severity:** SEV-1 (during EGX session 09:30–14:30 CLT) | SEV-3 (outside session)  
**Owner:** Data Platform Team  

### Step 1 — ASSESS (2 minutes)

```bash
# Check current EGX session state
kubectl exec -n market-data deploy/egx-market-data -- \
  curl -s http://localhost:8080/api/session/status | jq

# Check last tick age
kubectl exec -n market-data deploy/egx-market-data -- \
  curl -s http://localhost:9090/metrics | grep egx_last_tick_age_seconds

# Check data feed pod logs (last 5 minutes)
kubectl logs -n market-data deploy/egx-feed-connector --since=5m --tail=200
```

### Step 2 — DIAGNOSE

```bash
# Is this during EGX session hours? (09:30–14:30 CLT = UTC+2)
TZ='Africa/Cairo' date  # Check current time in Cairo

# Check feed connector connection status
kubectl exec -n market-data deploy/egx-feed-connector -- \
  curl -s http://localhost:8080/internal/connection-status | jq

# Check if EGX vendor API is responding
kubectl exec -n market-data deploy/egx-feed-connector -- \
  curl -sv --max-time 5 https://api.egx-datafeed.com/health 2>&1 | tail -20

# Check Kafka producer health from feed connector
kubectl exec -n market-data deploy/egx-feed-connector -- \
  curl -s http://localhost:9090/metrics | grep kafka_producer_errors_total
```

### Step 3 — REMEDIATE

**3A — Feed connector lost connection to EGX:**
```bash
# Restart feed connector (triggers reconnect with exponential backoff)
kubectl rollout restart deployment/egx-feed-connector -n market-data
kubectl rollout status deployment/egx-feed-connector -n market-data --timeout=60s

# Verify ticks flowing
kubectl logs -n market-data deploy/egx-feed-connector --since=30s | grep "tick_received"
```

**3B — EGX vendor API outage (their side):**
```bash
# Check EGX vendor status page (bookmark: https://status.egx-datafeed.com)
# If vendor is down: alert is expected, acknowledge in PagerDuty
# Notify compliance team — AI recommendations will be blocked (safety gate)
# Post on internal status page: "EGX data feed disruption from vendor"

# If backup feed exists, switch to it:
kubectl set env deployment/egx-feed-connector -n market-data \
  EGX_FEED_PROVIDER=BACKUP_PROVIDER \
  EGX_FEED_URL=https://backup-egx-feed.com/stream
kubectl rollout restart deployment/egx-feed-connector -n market-data
```

**3C — Kafka producer failure (ticks received but not written to Kafka):**
```bash
# Check Kafka broker health
kubectl exec -n kafka kafka-0 -- kafka-broker-api-versions.sh \
  --bootstrap-server kafka-0.kafka:9092 2>&1 | head -5

# Check for Kafka disk pressure
kubectl exec -n kafka kafka-0 -- df -h /var/lib/kafka/data

# Restart feed connector after Kafka recovery
kubectl rollout restart deployment/egx-feed-connector -n market-data
```

### Step 4 — VERIFY

```bash
# Confirm ticks flowing
kubectl exec -n market-data deploy/egx-market-data -- \
  curl -s http://localhost:9090/metrics | grep egx_last_tick_age_seconds
# Target: < 30 seconds during session hours

# Confirm AI recommendations unblocked
kubectl exec -n ai-services deploy/ai-consensus-orchestrator -- \
  curl -s http://localhost:9090/metrics | grep recommendation_safety_gate_blocked_total
```

---

## RUNBOOK RB-03: Portfolio NAV Error Rate High

**Alert:** `portfolio_nav_error_rate_high`  
**PromQL trigger:** `rate(portfolio_nav_calculation_errors_total[5m]) / rate(portfolio_nav_calculation_total[5m]) > 0.01`  
**Severity:** SEV-2  
**Owner:** Core Platform Team  

### Step 1 — ASSESS

```bash
kubectl get pods -n core-services -l app=portfolio-valuation
kubectl logs -n core-services deploy/portfolio-valuation --tail=200 | grep -E "ERROR|DECIMAL|ArithmeticError"
```

### Step 2 — DIAGNOSE

```bash
# Check if market data is available (NAV requires price data)
kubectl exec -n core-services deploy/portfolio-valuation -- \
  curl -s http://egx-market-data.market-data:8080/health

# Check for Decimal arithmetic errors specifically
kubectl logs -n core-services deploy/portfolio-valuation --tail=500 | grep "InvalidOperation\|DivisionByZero\|float"

# Check TimescaleDB connectivity
kubectl exec -n core-services deploy/portfolio-valuation -- \
  psql $DATABASE_URL -c "SELECT NOW();" 2>&1
```

### Step 3 — REMEDIATE

```bash
# If Decimal arithmetic error detected — this is a CODE BUG
# DO NOT restart — collect evidence first
kubectl logs -n core-services deploy/portfolio-valuation --tail=1000 > /tmp/nav_error_logs.txt
# Page the Core Platform on-call lead IMMEDIATELY — Decimal errors are production P0 bugs

# If connectivity issue:
kubectl rollout restart deployment/portfolio-valuation -n core-services
kubectl rollout status deployment/portfolio-valuation -n core-services --timeout=60s
```

### Step 4 — VERIFY

```bash
watch -n 5 'kubectl exec -n core-services deploy/portfolio-valuation -- \
  curl -s http://localhost:9090/metrics | grep portfolio_nav_calculation_errors_total'
# Target: 0 errors per minute
```

---

## RUNBOOK RB-04: Audit WORM Coverage Gap

**Alert:** `audit_worm_coverage_gap`  
**PromQL trigger:** `audit_worm_coverage_ratio < 1.0`  
**Severity:** SEV-1 — FRA COMPLIANCE RISK  
**Owner:** Compliance Engineering Team  
**ESCALATION:** If gap > 1 hour, notify Compliance Officer immediately.

### Step 1 — ASSESS

```bash
# Get current coverage ratio
kubectl exec -n compliance deploy/audit-trail -- \
  curl -s http://localhost:9090/metrics | grep audit_worm_coverage_ratio

# Get DLQ depth (events pending retry)
kubectl exec -n compliance deploy/audit-trail -- \
  curl -s http://localhost:9090/metrics | grep audit_dead_letter_queue_depth

# Check MinIO health
kubectl exec -n compliance deploy/audit-trail -- \
  curl -s http://minio.storage:9000/minio/health/live
```

### Step 2 — DIAGNOSE

```bash
# Check audit-trail service logs
kubectl logs -n compliance deploy/audit-trail --since=10m --tail=500 | grep -E "ERROR|WORM|MinIO|S3"

# Check MinIO pod status
kubectl get pods -n storage -l app=minio

# Check if MinIO bucket exists and has Object Lock
kubectl exec -n storage deploy/minio -- \
  mc ls tradeora/tradeora-audit-trail/

# Check Kafka consumer lag for audit-trail consumer
kubectl exec -n kafka kafka-0 -- kafka-consumer-groups.sh \
  --bootstrap-server kafka-0.kafka:9092 \
  --group audit-trail-consumer \
  --describe 2>&1 | head -30
```

### Step 3 — REMEDIATE

**3A — MinIO pod down:**
```bash
kubectl rollout restart statefulset/minio -n storage
kubectl rollout status statefulset/minio -n storage --timeout=120s
# After MinIO is healthy, DLQ will auto-replay (audit-trail service watches DLQ)
# Monitor DLQ depth decreasing:
watch -n 10 'kubectl exec -n compliance deploy/audit-trail -- \
  curl -s http://localhost:9090/metrics | grep audit_dead_letter_queue_depth'
```

**3B — MinIO disk full:**
```bash
# Check MinIO disk usage
kubectl exec -n storage $(kubectl get pod -n storage -l app=minio -o name | head -1) -- \
  df -h /data

# EMERGENCY: Expand PVC or add storage
# This requires infrastructure access — escalate to platform lead + notify compliance officer
kubectl get pvc -n storage
```

**3C — audit-trail service OOM:**
```bash
kubectl describe pod -n compliance $(kubectl get pod -n compliance -l app=audit-trail -o name | head -1) | grep -A5 "OOMKilled"
# Increase memory limit temporarily
kubectl set resources deployment/audit-trail -n compliance --limits=memory=2Gi
kubectl rollout restart deployment/audit-trail -n compliance
```

**3D — DLQ manual replay (if DLQ items > 0 and MinIO is healthy):**
```bash
# Trigger manual DLQ replay via internal API
kubectl exec -n compliance deploy/audit-trail -- \
  curl -X POST http://localhost:8080/internal/dlq/replay \
  -H "X-Internal-Auth: $INTERNAL_API_KEY"
```

### Step 4 — VERIFY

```bash
# Coverage ratio must return to 1.0000
watch -n 15 'kubectl exec -n compliance deploy/audit-trail -- \
  curl -s http://localhost:9090/metrics | grep audit_worm_coverage_ratio'

# Verify MinIO objects are being created
kubectl exec -n storage deploy/minio -- \
  mc ls tradeora/tradeora-audit-trail/$(date +%Y/%m/%d)/AI_RECOMMENDATION/ | tail -5
```

### Step 5 — POST-INCIDENT (MANDATORY for WORM gap)

```
[ ] Calculate exact gap duration and event count
[ ] Verify all missed events were replayed from DLQ
[ ] Confirm final coverage ratio = 1.0000 for affected date
[ ] Notify Compliance Officer with gap timeline
[ ] If gap > 1 hour: notify FRA (per Article 14 breach reporting obligation)
[ ] Create post-incident report within 24 hours
[ ] Update DLQ retry policy if needed to prevent recurrence
```

---

## RUNBOOK RB-05: PostgreSQL Primary Failover

**Alert:** `postgres_primary_failover`  
**PromQL trigger:** `patroni_master_mode == 0` (no primary detected)  
**Severity:** SEV-1  
**Owner:** Platform / DBA Team  

### Step 1 — ASSESS

```bash
# Check Patroni cluster state
kubectl exec -n databases patroni-0 -- patronictl -c /etc/patroni/patroni.yml list

# Expected healthy output:
# + Cluster: tradeora-postgres (6789...) --+----+-----------+
# | Member    | Host        | Role    | State   | TL | Lag in MB |
# +-----------+-------------+---------+---------+----+-----------+
# | patroni-0 | 10.0.0.1:5432 | Leader | running | 1  |           |
# | patroni-1 | 10.0.0.2:5432 | Replica| running | 1  | 0.0       |
# | patroni-2 | 10.0.0.3:5432 | Replica| running | 1  | 0.0       |
```

### Step 2 — DIAGNOSE

```bash
# Which member is current primary?
kubectl exec -n databases patroni-0 -- patronictl -c /etc/patroni/patroni.yml list | grep Leader

# Check HAProxy routing (write endpoint)
kubectl exec -n databases deploy/haproxy -- \
  curl -s http://localhost:7000/stats | grep "primary"

# Check application connectivity
kubectl exec -n core-services deploy/portfolio-service -- \
  psql $DATABASE_URL -c "SELECT pg_is_in_recovery();" 2>&1
# Should return: f (false = this is primary)

# Check PgBouncer connection pool
kubectl exec -n databases deploy/pgbouncer -- \
  psql -p 6432 pgbouncer -c "SHOW POOLS;" 2>&1
```

### Step 3 — REMEDIATE

**Automatic failover (Patroni handles this):**
```bash
# If Patroni is in election: WAIT. Do NOT intervene for the first 60 seconds.
# Patroni election takes 15-30 seconds automatically.

# Monitor election progress
watch -n 2 'kubectl exec -n databases patroni-0 -- \
  patronictl -c /etc/patroni/patroni.yml list'

# After new leader elected, verify HAProxy updated its routing
kubectl exec -n databases deploy/haproxy -- \
  curl -s http://localhost:7000/stats | grep -E "primary|OPEN|DOWN"
```

**Manual failover (if Patroni election stalled > 2 minutes):**
```bash
# Identify the replica with lowest lag
kubectl exec -n databases patroni-0 -- \
  patronictl -c /etc/patroni/patroni.yml list

# Trigger manual failover to specific member
kubectl exec -n databases patroni-0 -- \
  patronictl -c /etc/patroni/patroni.yml failover tradeora-postgres \
  --master patroni-0 --candidate patroni-1 --force
```

**After failover — verify applications reconnected:**
```bash
# PgBouncer should auto-reconnect (it follows HAProxy VIP)
# But force pool refresh to be safe:
kubectl exec -n databases deploy/pgbouncer -- \
  psql -p 6432 pgbouncer -c "RECONNECT;"

# Verify all application services can write
kubectl exec -n core-services deploy/portfolio-service -- \
  psql $DATABASE_URL -c "INSERT INTO health_check (ts) VALUES (NOW()) RETURNING ts;" 2>&1
```

### Step 4 — VERIFY

```bash
# Confirm cluster is healthy with 1 leader, 2 replicas
kubectl exec -n databases patroni-0 -- \
  patronictl -c /etc/patroni/patroni.yml list

# Confirm replication lag is 0
kubectl exec -n databases patroni-0 -- \
  psql -h localhost -U postgres -c \
  "SELECT client_addr, state, sent_lsn, replay_lsn, sync_state FROM pg_stat_replication;" 2>&1
```

---

## RUNBOOK RB-06: Kafka Consumer Lag Critical

**Alert:** `kafka_consumer_lag_critical`  
**PromQL trigger:** `kafka_consumer_group_lag > 100000`  
**Severity:** SEV-2  
**Owner:** Platform Team  

### Step 1 — ASSESS

```bash
# Identify which consumer group is lagging
kubectl exec -n kafka kafka-0 -- kafka-consumer-groups.sh \
  --bootstrap-server kafka-0.kafka:9092 \
  --list 2>&1

# Get lag for each group
kubectl exec -n kafka kafka-0 -- kafka-consumer-groups.sh \
  --bootstrap-server kafka-0.kafka:9092 \
  --describe --all-groups 2>&1 | sort -k6 -rn | head -30
```

### Step 2 — DIAGNOSE

```bash
# Check consumer pod resources (CPU/memory throttled?)
kubectl top pods -n <consumer-namespace> --sort-by=cpu | head -20

# Check for poison pill messages (consumer stuck on one partition)
kubectl logs -n <consumer-namespace> deploy/<consumer-service> --tail=200 | grep -E "ERROR|retry|poison"

# Check Kafka broker health
kubectl exec -n kafka kafka-0 -- kafka-broker-api-versions.sh \
  --bootstrap-server kafka-0.kafka:9092 2>&1 | head -3
```

### Step 3 — REMEDIATE

**3A — Consumer is under-resourced:**
```bash
# Scale out consumer pods
kubectl scale deployment/<consumer-service> -n <namespace> --replicas=5
# Kafka partitions must be >= replica count for effective parallelism
# Check partition count:
kubectl exec -n kafka kafka-0 -- kafka-topics.sh \
  --bootstrap-server kafka-0.kafka:9092 \
  --describe --topic <lagging-topic>
```

**3B — Poison pill message:**
```bash
# Skip the bad message (CAUTION: only for non-financial topics)
# For financial topics: escalate to lead, do NOT skip without review

# Get current offset
kubectl exec -n kafka kafka-0 -- kafka-consumer-groups.sh \
  --bootstrap-server kafka-0.kafka:9092 \
  --group <group-id> --describe 2>&1

# Skip one offset (dangerous — use only after team lead approval)
kubectl exec -n kafka kafka-0 -- kafka-consumer-groups.sh \
  --bootstrap-server kafka-0.kafka:9092 \
  --group <group-id> \
  --topic <topic>:<partition> \
  --reset-offsets --to-offset <current+1> --execute 2>&1
```

---

## RUNBOOK RB-07: Keycloak Health Failing

**Alert:** `keycloak_health_failing`  
**PromQL trigger:** `keycloak_health_check_status == 0`  
**Severity:** SEV-1 (all users cannot authenticate)  
**Owner:** Platform Team  

### Step 1 — ASSESS

```bash
kubectl get pods -n identity -l app=keycloak
kubectl logs -n identity deploy/keycloak --tail=100 | grep -E "ERROR|WARN|Starting|Started"

# Test Keycloak health endpoint directly
kubectl exec -n identity deploy/keycloak -- \
  curl -s http://localhost:8080/health/ready | jq
```

### Step 2 — DIAGNOSE & REMEDIATE

```bash
# Check PostgreSQL connectivity (Keycloak needs its DB)
kubectl exec -n identity deploy/keycloak -- \
  psql $KC_DB_URL -c "SELECT 1;" 2>&1

# Check Keycloak cluster quorum (Infinispan cache)
kubectl exec -n identity deploy/keycloak -- \
  curl -s http://localhost:9000/metrics | grep infinispan_cluster_size

# If single pod, restart:
kubectl rollout restart deployment/keycloak -n identity
kubectl rollout status deployment/keycloak -n identity --timeout=90s

# If Keycloak DB connection issue:
kubectl exec -n databases patroni-0 -- \
  psql -U postgres -c "\l" | grep keycloak

# Test OIDC discovery endpoint (critical for JWT validation)
kubectl exec -n core-services deploy/api-gateway -- \
  curl -s http://keycloak.identity:8080/realms/tradeora/.well-known/openid-configuration | jq .issuer
```

### Step 4 — VERIFY

```bash
# Test a real token validation
kubectl exec -n core-services deploy/api-gateway -- \
  curl -s -X POST http://keycloak.identity:8080/realms/tradeora/protocol/openid-connect/token \
  -d "client_id=internal-health-check&client_secret=$KC_HEALTH_SECRET&grant_type=client_credentials" \
  | jq .access_token | head -c 50
# Should return a JWT token (not null)
```

---

## RUNBOOK RB-08: GPU Node Memory Pressure

**Alert:** `gpu_node_memory_pressure`  
**PromQL trigger:** `nvidia_gpu_memory_used_bytes / nvidia_gpu_memory_total_bytes > 0.90`  
**Severity:** SEV-2  
**Owner:** AI Platform Team  

### Step 1 — ASSESS

```bash
# Check GPU utilization across all GPU nodes
kubectl get nodes -l nvidia.com/gpu=true
kubectl exec -n ai-services $(kubectl get pod -n ai-services -l app=ollama -o name | head -1) -- \
  nvidia-smi --query-gpu=index,name,memory.used,memory.total,utilization.gpu --format=csv,noheader
```

### Step 2 — DIAGNOSE & REMEDIATE

```bash
# Check which model is loaded in Ollama
kubectl exec -n ai-services $(kubectl get pod -n ai-services -l app=ollama -o name | head -1) -- \
  curl -s http://localhost:11434/api/ps | jq '.models[] | {name, size}'

# Option A: Restart Ollama to free fragmented GPU memory
kubectl rollout restart deployment/ollama -n ai-services
# Wait 90 seconds for Qwen2.5:72b to reload
kubectl rollout status deployment/ollama -n ai-services --timeout=150s

# Option B: Switch to smaller model (lower quality but lower memory footprint)
kubectl set env deployment/ollama -n ai-services OLLAMA_MODEL=qwen2.5:7b
kubectl rollout restart deployment/ollama -n ai-services
# ALERT: This reduces AI quality. Create ticket and notify AI Platform lead.

# Option C: If memory leak suspected, check for zombie inference processes
kubectl exec -n ai-services $(kubectl get pod -n ai-services -l app=ollama -o name | head -1) -- \
  nvidia-smi pmon -s mu -d 1 -c 5
```

### Step 4 — VERIFY

```bash
watch -n 10 'kubectl exec -n ai-services \
  $(kubectl get pod -n ai-services -l app=ollama -o name | head -1) -- \
  nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader'
# Target: memory.used / memory.total < 0.85
```

---

## RUNBOOK RB-09: KYC Verification Degraded

**Alert:** `kyc_verification_degraded`  
**PromQL trigger:** `rate(kyc_verification_completed_total[15m]) / rate(kyc_initiated_total[15m]) < 0.80`  
**Severity:** SEV-2  
**Owner:** Compliance Engineering Team  

### Step 1 — ASSESS

```bash
kubectl get pods -n compliance -l app=kyc-service
kubectl logs -n compliance deploy/kyc-service --since=10m --tail=200 | grep -E "ERROR|timeout|provider"

# Check KYC provider API response time
kubectl exec -n compliance deploy/kyc-service -- \
  curl -s http://localhost:9090/metrics | grep kyc_provider_response_time_seconds
```

### Step 2 — DIAGNOSE & REMEDIATE

```bash
# Test KYC provider API directly
kubectl exec -n compliance deploy/kyc-service -- \
  curl -sv --max-time 10 $KYC_PROVIDER_URL/health 2>&1 | tail -10

# If KYC provider is down: switch to manual review mode
kubectl set env deployment/kyc-service -n compliance KYC_MODE=MANUAL_REVIEW
kubectl rollout restart deployment/kyc-service -n compliance
# In manual mode: users can register but wait for compliance team review

# Notify compliance team to check manual review queue
# compliance-team Slack channel: #compliance-manual-kyc

# If timeout issue: extend timeout temporarily
kubectl set env deployment/kyc-service -n compliance KYC_PROVIDER_TIMEOUT_MS=30000
kubectl rollout restart deployment/kyc-service -n compliance
```

---

## RUNBOOK RB-10: TLS Certificate Expiry Warning

**Alert:** `tls_certificate_expiry_warning`  
**PromQL trigger:** `certmanager_certificate_expiration_timestamp_seconds - time() < 1209600` (14 days)  
**Severity:** SEV-3  
**Owner:** Platform Team  
**SLA:** Resolved before expiry (14-day warning window)  

```bash
# List expiring certificates
kubectl get certificate -A | grep -v "True   True"

# Check cert-manager is running
kubectl get pods -n cert-manager

# Trigger manual renewal
kubectl annotate certificate <cert-name> -n <namespace> \
  cert-manager.io/issuer-kind=ClusterIssuer --overwrite

# Force renewal
kubectl delete certificaterequest -n <namespace> \
  $(kubectl get certificaterequest -n <namespace> | grep <cert-name> | awk '{print $1}')

# Verify renewal
watch -n 30 'kubectl get certificate -n <namespace> <cert-name>'
# Wait for: READY=True

# Test renewed certificate
openssl s_client -connect api.tradeora.com:443 -servername api.tradeora.com < /dev/null 2>&1 | \
  openssl x509 -noout -dates
```

---

## RUNBOOK RB-11: MinIO WORM Write Failed

**Alert:** `minio_worm_write_failed`  
**PromQL trigger:** `rate(audit_worm_write_errors_total[5m]) > 0`  
**Severity:** SEV-1 — FRA COMPLIANCE RISK  
**Owner:** Platform Team + Compliance Engineering  

```bash
# Check MinIO status
kubectl get pods -n storage -l app=minio
kubectl logs -n storage $(kubectl get pod -n storage -l app=minio -o name | head -1) --tail=100

# Check Object Lock is still enabled
kubectl exec -n storage deploy/minio -- \
  mc legalhold info tradeora/tradeora-audit-trail

# Check disk space
kubectl exec -n storage $(kubectl get pod -n storage -l app=minio -o name | head -1) -- \
  df -h /data

# If Object Lock accidentally removed — ESCALATE IMMEDIATELY to compliance officer
# This is a potential FRA violation

# If MinIO disk full:
# - Expand PVC (requires cloud/infra access)
# - TEMPORARY: Clear non-WORM buckets (dev/test) to free space
# DO NOT delete any files from tradeora-audit-trail (WORM protected)

# Restart MinIO after fixing disk issue
kubectl rollout restart statefulset/minio -n storage
```

---

## RUNBOOK RB-12: Valkey Memory High

**Alert:** `valkey_memory_high`  
**PromQL trigger:** `valkey_memory_used_bytes / valkey_memory_max_bytes > 0.85`  
**Severity:** SEV-2  
**Owner:** Platform Team  

```bash
# Check Valkey memory
kubectl exec -n cache deploy/valkey -- valkey-cli info memory | grep -E "used_memory_human|maxmemory_human"

# Check key distribution
kubectl exec -n cache deploy/valkey -- valkey-cli --stat -i 1 | head -5

# Check which key patterns are using most memory
kubectl exec -n cache deploy/valkey -- \
  valkey-cli --bigkeys 2>&1 | tail -20

# Flush rate-limit keys if they're the culprit (safe — auto-regenerated)
kubectl exec -n cache deploy/valkey -- \
  valkey-cli --scan --pattern "ratelimit:*" | wc -l
# If > 1,000,000 rate-limit keys: flush them
kubectl exec -n cache deploy/valkey -- \
  valkey-cli --scan --pattern "ratelimit:*" | xargs valkey-cli del

# Increase maxmemory as temporary fix
kubectl exec -n cache deploy/valkey -- \
  valkey-cli config set maxmemory 8gb
# PERMANENT fix: update Helm values and redeploy
```

---

## RUNBOOK RB-13: API Gateway Error Rate High

**Alert:** `api_gateway_error_rate_high`  
**PromQL trigger:** `rate(kong_http_requests_total{status=~"5.."}[5m]) / rate(kong_http_requests_total[5m]) > 0.05`  
**Severity:** SEV-1 (> 5% 5xx errors means users getting errors)  
**Owner:** Platform Team  

```bash
# Check Kong pods
kubectl get pods -n api-gateway -l app=kong

# Check Kong error logs
kubectl logs -n api-gateway deploy/kong --tail=200 | grep -E "error|5[0-9][0-9]"

# Check which upstream services are failing
kubectl exec -n api-gateway deploy/kong -- \
  curl -s http://localhost:8001/upstreams | jq '.data[].name'

# Check upstream health
kubectl exec -n api-gateway deploy/kong -- \
  curl -s http://localhost:8001/upstreams/<upstream-name>/health | jq

# Identify failing upstream service and restart it
kubectl rollout restart deployment/<failing-service> -n <namespace>

# If Kong itself is the issue:
kubectl rollout restart deployment/kong -n api-gateway
kubectl rollout status deployment/kong -n api-gateway --timeout=60s
```

---

## RUNBOOK RB-14: PgBouncer Pool Exhausted

**Alert:** `pgbouncer_pool_exhausted`  
**PromQL trigger:** `pgbouncer_waiting_clients > 50`  
**Severity:** SEV-2 (database queries queuing, latency spikes)  
**Owner:** DBA Team  

```bash
# Check PgBouncer status
kubectl exec -n databases deploy/pgbouncer -- \
  psql -p 6432 pgbouncer -c "SHOW POOLS;" 2>&1

# Check which database/user is exhausted
kubectl exec -n databases deploy/pgbouncer -- \
  psql -p 6432 pgbouncer -c "SHOW CLIENTS;" 2>&1 | head -30

# Check for long-running queries holding connections
kubectl exec -n databases patroni-0 -- \
  psql -U postgres -c "SELECT pid, now()-query_start AS duration, query FROM pg_stat_activity WHERE state='active' ORDER BY duration DESC LIMIT 10;" 2>&1

# Kill long-running queries (> 5 minutes, if clearly stuck)
kubectl exec -n databases patroni-0 -- \
  psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE now()-query_start > '5 minutes' AND state='active' AND query NOT LIKE '%pg_stat_activity%';" 2>&1

# Increase pool size temporarily (edit PgBouncer config)
kubectl edit configmap pgbouncer-config -n databases
# Increase: pool_size=30 (from 20 default)
kubectl rollout restart deployment/pgbouncer -n databases
```

---

## RUNBOOK RB-15: Ollama Inference Timeout

**Alert:** `ollama_inference_timeout`  
**PromQL trigger:** `rate(ollama_inference_timeouts_total[5m]) > 0.1`  
**Severity:** SEV-2 (AI schools timing out, participation dropping)  
**Owner:** AI Platform Team  

```bash
# Check Ollama GPU utilization
kubectl exec -n ai-services $(kubectl get pod -n ai-services -l app=ollama -o name | head -1) -- \
  nvidia-smi dmon -s pu -d 2 -c 5

# Check concurrent inference requests
kubectl exec -n ai-services $(kubectl get pod -n ai-services -l app=ollama -o name | head -1) -- \
  curl -s http://localhost:11434/api/ps | jq

# Check number of schools concurrently calling Ollama
kubectl exec -n ai-services deploy/ai-consensus-orchestrator -- \
  curl -s http://localhost:9090/metrics | grep ollama_concurrent_requests

# REMEDIATE: Restart Ollama to reset inference queue
kubectl rollout restart deployment/ollama -n ai-services
kubectl rollout status deployment/ollama -n ai-services --timeout=150s

# If chronic: consider request queuing at LiteLLM proxy level
kubectl set env deployment/litellm-proxy -n ai-services \
  LITELLM_MAX_PARALLEL_REQUESTS=8
kubectl rollout restart deployment/litellm-proxy -n ai-services
```

---

## Escalation Contacts

| Role | When to Escalate | Contact Method |
|------|----------------|----------------|
| AI Platform Lead | RB-01, RB-08, RB-15 unresolved > 30min | PagerDuty → Slack |
| Platform Lead | RB-05, RB-13 SEV-1 | PagerDuty immediate |
| DBA Lead | RB-05 (Patroni election stalled > 3min) | PagerDuty immediate |
| Compliance Officer | RB-04, RB-11 (WORM gap > 1 hour) | Direct call (24/7) |
| Data Platform Lead | RB-02 (EGX data stale > 30min during session) | PagerDuty → Slack |
| FRA Hotline | WORM gap > 24 hours, confirmed data loss | Direct per FRA protocol |

---

## Common Diagnostic One-Liners

```bash
# All pod health at a glance
kubectl get pods -A | grep -v Running | grep -v Completed

# Kafka consumer lag across all groups
kubectl exec -n kafka kafka-0 -- kafka-consumer-groups.sh \
  --bootstrap-server kafka-0.kafka:9092 --describe --all-groups 2>&1 | \
  awk 'NR>1 {sum+=$6} END {print "Total lag: " sum}'

# Top memory consumers
kubectl top pods -A --sort-by=memory | head -20

# Check all Prometheus alerts firing
curl -s http://prometheus.monitoring:9090/api/v1/alerts | jq '.data.alerts[] | select(.state=="firing") | {alertname: .labels.alertname, severity: .labels.severity}'

# Recent Kafka errors (last 5 min across all topics)
kubectl exec -n kafka kafka-0 -- kafka-log-dirs.sh \
  --bootstrap-server kafka-0.kafka:9092 --describe 2>&1 | grep -v "^$" | tail -20

# PgBouncer pool summary
kubectl exec -n databases deploy/pgbouncer -- \
  psql -p 6432 pgbouncer -c "SHOW STATS_TOTALS;" 2>&1
```

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT FOOTER                                                             ║
║  Document: OPERATIONAL_RUNBOOKS.md                                          ║
║  Version:  1.0.0                                                            ║
║  Owner:    SRE Team                                                          ║
║  Review Cadence: Monthly (or after every major incident)                    ║
║  CRITICAL: Test every runbook in staging before relying on it in prod.      ║
╚══════════════════════════════════════════════════════════════════════════════╝
```