# Tradeora Financial Operating System
## Intraday FRA Embargo & Trading Halt Synchronization Specification
## Version 1.0.0 | Status: APPROVED | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Resolves     : AI-004 (Architecture Freeze Board Sprint 1)                 ║
║  Supersedes   : Daily 00:01 embargo sync (insufficient for intraday halts)  ║
║  Constitution : Article 11 — FRA compliance is non-negotiable               ║
║  Owner        : Chief Compliance Officer + Chief AI Architect               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

> [!CAUTION]
> **REGULATORY CRITICAL**: The FRA can halt individual securities intraday without advance
> notice. A daily sync at 00:01 leaves a window of up to 9 hours during which Tradeora
> could generate AI recommendations for a suspended instrument — a direct FRA violation.
> This document specifies the intraday sync architecture that closes this window to ≤5 minutes.

---

## Section 1 — Problem Statement

### 1.1 The Regulatory Risk
The Financial Regulatory Authority (FRA) and the Egyptian Exchange (EGX) can and do:
- Halt individual securities intraday (e.g., for unusual price movements, news embargoes, regulatory investigation)
- Issue intraday trading suspensions with immediate effect
- Re-open halted securities the same day or the following session

**Previous Architecture (Insufficient):**
```
Daily sync at 00:01 Cairo time → FRA API → embargo_list.json → AI Safety Check 7
```
Gap: If FRA halts COMI at 11:15 AM on a trading day, Tradeora may generate COMI
recommendations from 11:15 AM until the next day's 00:01 sync — up to 13 hours of
regulatory non-compliance.

### 1.2 The Solution
```
Every 5 minutes during EGX session → FRA API polling → Valkey real-time embargo set
→ AI Safety Check 7 reads from Valkey (sub-millisecond)
```
Gap reduced to: ≤5 minutes (the polling interval).

---

## Section 2 — Solution Architecture

### 2.1 Component Diagram
```
FRA Official API ──────────────────────────────────────────────────────────────┐
(https://fra.gov.eg/api/v1/restrictions)                                       │
                                                                               │
EGX Circuit Breaker Feed ──────────────────────────────────────────────────────┤
(https://www.egx.com.eg/api/v1/halted-securities)                              │
                                                                               ▼
                                                             FRAEmbargoSyncJob
                                                             (BullMQ, every 5 min)
                                                                    │
                                          ┌─────────────────────────┼──────────────────────────┐
                                          ▼                         ▼                          ▼
                               Valkey SET                   Kafka publish              PostgreSQL log
                        fra:embargo:active:{ticker}    regulatory.FRACompliance    embargo_sync_log
                          TTL = EGX session end         .EmbargoAdded.v1           (daily audit)
                          (15:30 Cairo)
                                          │
                                          ▼
                              AI Safety Engine — Check 7
                    if SISMEMBER fra:embargo:active:{ticker} → BLOCK
```

### 2.2 Sync Schedule

| Sync Type | Schedule | Data Source | Purpose |
|-----------|----------|-------------|---------|
| **Baseline sync** | Daily 00:01 Cairo (BullMQ cron) | FRA API full list | Set next-day baseline embargo list |
| **Intraday sync** | Every 5 minutes: 09:00–15:35 Cairo | FRA API + EGX feed | Detect intraday halts within ≤5 min |
| **Pre-session sync** | 08:45 Cairo (before warm-up) | FRA API | Ensure embargo list is fresh before session |
| **Emergency sync** | Triggered by compliance officer | FRA API | On-demand refresh when needed |

### 2.3 EGX Session Window
The intraday sync runs ONLY during the EGX trading window to avoid unnecessary API calls:
```python
EGX_PRE_OPEN_START  = time(8, 0)   # 08:00 Cairo
EGX_SESSION_START   = time(9, 0)   # 09:00 Cairo (sync starts)
EGX_SESSION_END     = time(15, 30) # 15:30 Cairo (last intraday sync)
EGX_CLOSE_SYNC_END  = time(15, 35) # 15:35 Cairo (final reconciliation)
```

---

## Section 3 — FRAEmbargoSyncJob Specification

### 3.1 BullMQ Job Definition
```typescript
// fra-embargo-sync.job.ts
import { Queue, Worker, QueueScheduler } from 'bullmq';

const INTRADAY_CRON  = '*/5 9-15 * * 0-4';   // Every 5 min, 09:00–15:59, Sun–Thu (EGX days)
const BASELINE_CRON  = '1 0 * * *';            // Daily 00:01
const PRE_SESSION    = '45 8 * * 0-4';         // 08:45 Sun–Thu

export const fraEmbargoQueue = new Queue('fra-embargo-sync', {
  connection: valkeyConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { age: 3_600 },    // keep 1h for debugging
    removeOnFail: { age: 86_400 * 7 },  // keep 7 days for audit
  },
});

// Schedule recurring jobs
await fraEmbargoQueue.add('intraday-sync', {}, { repeat: { cron: INTRADAY_CRON } });
await fraEmbargoQueue.add('baseline-sync', {}, { repeat: { cron: BASELINE_CRON } });
await fraEmbargoQueue.add('pre-session-sync', {}, { repeat: { cron: PRE_SESSION } });
```

### 3.2 Sync Worker Implementation
```python
# fra_embargo_sync_worker.py
import asyncio
from datetime import datetime, time, timedelta
import httpx
from valkey.asyncio import Valkey
from decimal import Decimal

VALKEY_EMBARGO_KEY_PREFIX = "fra:embargo:active:"
VALKEY_EMBARGO_META_KEY   = "fra:embargo:sync:last_success"
VALKEY_EMBARGO_FAIL_KEY   = "fra:embargo:sync:consecutive_failures"
EGX_SESSION_END_CAIRO     = time(15, 30)

async def run_embargo_sync(sync_type: str, valkey: Valkey, kafka_producer, db) -> None:
    """
    Fetch current FRA embargo list and update Valkey in real-time.
    """
    sync_start = datetime.utcnow()
    newly_embargoed = []
    newly_released  = []

    try:
        # 1. Fetch from FRA official API (primary)
        fra_tickers = await fetch_fra_embargo_list()

        # 2. Fetch from EGX circuit breaker feed (supplementary)
        egx_halted = await fetch_egx_halted_securities()

        # 3. Merge: union of both sources
        all_embargoed = fra_tickers | egx_halted

        # 4. Compare with current Valkey state
        current_embargoed = await get_current_valkey_embargo_set(valkey)
        newly_embargoed = all_embargoed - current_embargoed
        newly_released  = current_embargoed - all_embargoed

        # 5. Update Valkey atomically (pipeline)
        pipe = valkey.pipeline()

        # Calculate TTL: seconds until EGX session end
        cairo_now = datetime.now(tz=CAIRO_TZ)
        session_end = cairo_now.replace(
            hour=EGX_SESSION_END_CAIRO.hour,
            minute=EGX_SESSION_END_CAIRO.minute,
            second=0, microsecond=0
        )
        ttl_seconds = max(0, int((session_end - cairo_now).total_seconds()))

        for ticker in newly_embargoed:
            pipe.set(f"{VALKEY_EMBARGO_KEY_PREFIX}{ticker}", "1", ex=ttl_seconds)

        for ticker in newly_released:
            pipe.delete(f"{VALKEY_EMBARGO_KEY_PREFIX}{ticker}")

        # Update sync metadata
        pipe.set(VALKEY_EMBARGO_META_KEY, sync_start.isoformat())
        pipe.set(VALKEY_EMBARGO_FAIL_KEY, "0")   # Reset failure counter

        await pipe.execute()

        # 6. Publish events for newly embargoed tickers
        for ticker in newly_embargoed:
            await kafka_producer.send(
                'regulatory.FRACompliance.EmbargoAdded.v1',
                {
                    'ticker': ticker,
                    'source': 'FRA_INTRADAY_SYNC',
                    'syncType': sync_type,
                    'embargoed_at': sync_start.isoformat(),
                    'ttl_seconds': ttl_seconds,
                }
            )

        # 7. Log to PostgreSQL audit table
        await db.execute("""
            INSERT INTO embargo_sync_log
            (sync_type, synced_at, tickers_embargoed, tickers_released,
             newly_embargoed, newly_released, success)
            VALUES ($1, $2, $3, $4, $5, $6, TRUE)
        """, sync_type, sync_start, list(all_embargoed), list(newly_released),
            list(newly_embargoed), list(newly_released))

        # 8. Update Prometheus metrics
        EMBARGO_SYNC_SUCCESS.inc()
        EMBARGO_ACTIVE_COUNT.set(len(all_embargoed))
        EMBARGO_SYNC_LATENCY.observe((datetime.utcnow() - sync_start).total_seconds())

    except FRAApiUnavailableError as e:
        await handle_fra_api_failure(valkey, kafka_producer, e)
        raise
```

### 3.3 FRA API Unavailability Handling
```python
CONSECUTIVE_FAILURE_THRESHOLD = 2   # 2 failures = 10 minutes of outage

async def handle_fra_api_failure(valkey: Valkey, kafka_producer, error: Exception) -> None:
    """
    If FRA API is unreachable for >10 min during session: suspend ALL recommendations.
    This is the conservative fail-safe: better to suspend than risk regulatory violation.
    """
    failures = int(await valkey.incr(VALKEY_EMBARGO_FAIL_KEY))

    if failures >= CONSECUTIVE_FAILURE_THRESHOLD:
        # Suspend ALL AI recommendations as precaution
        await valkey.set(
            "ai:recommendations:global_suspend",
            "FRA_API_UNAVAILABLE",
            ex=600   # Re-evaluate every 10 minutes
        )
        # PagerDuty P1 alert
        await pagerduty.trigger(
            severity='critical',
            summary=f'FRA embargo sync failed {failures} consecutive times — AI recommendations SUSPENDED',
            details={'error': str(error), 'consecutive_failures': failures}
        )
        # Kafka event
        await kafka_producer.send(
            'regulatory.FRACompliance.EmbargoSyncFailed.v1',
            {
                'consecutiveFailures': failures,
                'aiRecommendationsSuspended': True,
                'reason': str(error),
                'timestamp': datetime.utcnow().isoformat(),
            }
        )
```

---

## Section 4 — AI Safety Check 7 Integration

### 4.1 Updated Check 7 Implementation
The AI Safety Engine Check 7 now reads from Valkey (sub-millisecond) instead of a flat file:

```python
# ai_safety_engine.py — Check 7 (updated)
async def _check_7_no_regulatory_embargo(self, context: ValidationContext) -> CheckResult:
    """
    Verify instrument is not under active FRA embargo or EGX circuit breaker halt.
    Reads from Valkey: sub-millisecond lookup, updated every 5 minutes intraday.
    See: INTRADAY_FRA_EMBARGO_SYNC_SPECIFICATION.md
    """
    ticker = context.ticker

    # 1. Check global suspension (FRA API unavailable scenario)
    global_suspend = await self.valkey.get("ai:recommendations:global_suspend")
    if global_suspend:
        return CheckResult(
            "FRA Embargo Check",
            passed=False,
            reason=f"AI recommendations globally suspended: {global_suspend.decode()}",
            arabic_message="الخدمة متوقفة مؤقتاً لأسباب تنظيمية. يرجى المحاولة لاحقاً",
        )

    # 2. Check ticker-specific embargo
    is_embargoed = await self.valkey.exists(f"fra:embargo:active:{ticker}")
    if is_embargoed:
        return CheckResult(
            "FRA Embargo Check",
            passed=False,
            reason=f"Ticker {ticker} is under active FRA embargo",
            arabic_message=f"السهم {ticker} محظور حالياً وفقاً للوائح هيئة الرقابة المالية",
        )

    # 3. Check sync freshness (warn if sync is stale)
    last_sync_str = await self.valkey.get(VALKEY_EMBARGO_META_KEY)
    if last_sync_str:
        last_sync = datetime.fromisoformat(last_sync_str.decode())
        sync_age_minutes = (datetime.utcnow() - last_sync).total_seconds() / 60
        if sync_age_minutes > 10:   # >10 min → sync is stale, log warning
            EMBARGO_SYNC_STALENESS_GAUGE.set(sync_age_minutes)
            logger.warning(f"FRA embargo sync is {sync_age_minutes:.1f} minutes stale")

    return CheckResult("FRA Embargo Check", passed=True, reason="")
```

---

## Section 5 — Kafka Events

| Event | Topic | Trigger | Consumers |
|-------|-------|---------|-----------|
| `EmbargoAdded.v1` | `regulatory.FRACompliance.EmbargoAdded.v1` | New ticker embargoed | AI Orchestrator, Alert BC, Compliance Dashboard |
| `EmbargoReleased.v1` | `regulatory.FRACompliance.EmbargoReleased.v1` | Embargo lifted | AI Orchestrator, Alert BC |
| `EmbargoSyncFailed.v1` | `regulatory.FRACompliance.EmbargoSyncFailed.v1` | Consecutive sync failures | PagerDuty, Compliance Officer |
| `AIRecommendationsSuspended.v1` | `regulatory.FRACompliance.AIRecommendationsSuspended.v1` | Global suspend triggered | All AI consumers |

---

## Section 6 — RBAC & Access Control

| Operation | Required Role | Justification |
|-----------|--------------|---------------|
| View embargo list | ROLE_ACTIVE_TRADER | User-facing: shows "suspended" status |
| Trigger manual sync | ROLE_COMPLIANCE_OFFICER | Compliance authority |
| Override embargo (emergency) | ROLE_PLATFORM_ADMIN + 2FA | Break-glass: documented, WORM-logged |
| View sync audit log | ROLE_COMPLIANCE_OFFICER | Regulatory evidence |

The embargo sync service account writes to Valkey using a dedicated ServiceAccount with minimal permissions (write to `fra:embargo:*` namespace only).

---

## Section 7 — Observability

### 7.1 Prometheus Metrics
```
fra_embargo_sync_total{sync_type, status}          # counter: success/failure
fra_embargo_sync_duration_seconds{sync_type}       # histogram
fra_embargo_active_tickers_count                   # gauge: current embargoed count
fra_embargo_sync_staleness_minutes                 # gauge: minutes since last successful sync
fra_embargo_consecutive_failures_count             # gauge: trigger alert at 2
fra_embargo_newly_embargoed_total                  # counter: new embargo events
fra_embargo_newly_released_total                   # counter: embargo lifted events
```

### 7.2 Alerting Rules
```yaml
# Prometheus alert rules
- alert: FRAEmbargoSyncStale
  expr: fra_embargo_sync_staleness_minutes > 10
  for: 0m
  labels:
    severity: warning
  annotations:
    summary: "FRA embargo sync is {{ $value }} minutes stale"

- alert: FRAEmbargoSyncFailed
  expr: fra_embargo_consecutive_failures_count >= 2
  for: 0m
  labels:
    severity: critical
  annotations:
    summary: "FRA embargo sync failed {{ $value }} consecutive times — AI suspended"

- alert: FRAEmbargoNewHalt
  expr: increase(fra_embargo_newly_embargoed_total[5m]) > 0
  for: 0m
  labels:
    severity: info
  annotations:
    summary: "New FRA embargo detected — affected tickers blocked from AI recommendations"
```

### 7.3 Grafana Dashboard: "FRA Compliance — Embargo Monitor"
- **Panel 1**: Currently embargoed tickers (table, real-time from Valkey)
- **Panel 2**: Last successful sync timestamp + staleness gauge
- **Panel 3**: Sync success/failure over last 24h (bar chart)
- **Panel 4**: Embargo events timeline (when each ticker was embargoed/released)
- **Panel 5**: AI recommendations blocked due to embargo (counter)

---

## Section 8 — PostgreSQL Audit Schema

```sql
CREATE TABLE embargo_sync_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type           VARCHAR(20) NOT NULL,    -- BASELINE / INTRADAY / PRE_SESSION / MANUAL
    synced_at           TIMESTAMPTZ NOT NULL,
    tickers_embargoed   TEXT[] NOT NULL,          -- full embargo list at time of sync
    tickers_released    TEXT[],                   -- tickers released since last sync
    newly_embargoed     TEXT[],                   -- new additions this sync
    newly_released      TEXT[],                   -- removed this sync
    success             BOOLEAN NOT NULL,
    error_message       TEXT,
    sync_duration_ms    INTEGER,
    fra_api_version     VARCHAR(20)               -- FRA API version (for audit)
);

CREATE INDEX idx_embargo_sync_log_synced_at ON embargo_sync_log(synced_at DESC);

-- Retained for 7 years (FRA audit requirement)
-- Purge job: monthly, deletes records older than 7 years
```

---

## Section 9 — Runbook: RB-015 (FRA Embargo Sync Failure)

**Alert**: `FRAEmbargoSyncFailed` (PagerDuty P1)
**Response Time**: Immediate (on-call engineer)

```
Step 1: Check PagerDuty alert details for error message
Step 2: Open Grafana → FRA Compliance — Embargo Monitor → check sync history
Step 3: Verify FRA API reachability:
          curl https://fra.gov.eg/api/v1/restrictions -H "X-API-Key: {fra_api_key}"
Step 4: If FRA API is down:
          a. AI recommendations are already suspended (automatic)
          b. Notify Compliance Officer (ROLE_COMPLIANCE_OFFICER)
          c. Monitor FRA API recovery → sync will auto-resume when API recovers
Step 5: If FRA API is up but sync still failing:
          a. Check BullMQ dead letter queue for failed jobs
          b. Check Valkey connectivity from fra-embargo-sync pod
          c. Check network policies (K8s NetworkPolicy)
Step 6: On recovery:
          a. Trigger manual sync: POST /internal/api/v1/fra-embargo/sync (ROLE_COMPLIANCE_OFFICER)
          b. Verify Valkey embargo set is populated
          c. Verify AI recommendations resumed: GET /internal/api/v1/ai/status
Step 7: Document incident in ARCHITECTURE_CHANGE_LOG.md if sync was down >30 minutes
```

---

*Document: INTRADAY_FRA_EMBARGO_SYNC_SPECIFICATION.md*
*Version: 1.0.0 | Status: APPROVED*
*Resolves: AI-004, H006 (Architecture Freeze Board Sprint 1)*
