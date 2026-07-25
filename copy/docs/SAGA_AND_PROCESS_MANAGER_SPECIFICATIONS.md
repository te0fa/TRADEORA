# Tradeora Financial Operating System
## Saga & Process Manager Specifications
## Version 1.0.0 | Status: APPROVED | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Resolves     : GOV-001 (Architecture Freeze Board Sprint 1)                ║
║  Constitution : Article 24 — Event-driven sagas coordinate distributed state║
║  Constitution : Article 37 — Fail-fast + graceful recovery                 ║
║  Engineering  : No direct cross-BC database calls                           ║
║  Owner        : Chief Platform Architect                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Section 1 — Saga Philosophy

### 1.1 Why Sagas Are Required
Tradeora's 51 Bounded Contexts run as independent microservices with isolated databases.
Multi-step business processes that span multiple BCs cannot use ACID transactions.
Sagas provide the coordination pattern for **distributed, long-running business processes**.

### 1.2 Choreography vs Orchestration
**Tradeora uses Choreography-based Sagas** via Kafka events.

Rationale:
- Each BC reacts to domain events it subscribes to — no central orchestrator creates coupling
- BullMQ manages saga state (instance tracking, timeouts, retries)
- PostgreSQL `saga_instances` table provides durability and observability

### 1.3 Compensation Transactions
Every saga step that mutates state has a corresponding **compensation transaction**:
```
Forward Step:   UserActivated  →  Portfolio created
Compensation:   PortfolioArchived  ← KYCFailed
```
Compensations are idempotent and can be replayed safely.

### 1.4 Idempotency Guarantee
Every saga step uses a composite idempotency key:
```
idempotency_key = SHA-256(saga_id + ":" + step_name)
```
PostgreSQL `ON CONFLICT DO NOTHING` prevents duplicate step execution.

---

## Section 2 — Process Manager Infrastructure

### 2.1 PostgreSQL Saga State Schema

```sql
-- Saga instance registry
CREATE TABLE saga_instances (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saga_type           VARCHAR(50) NOT NULL,   -- SAGA-001, SAGA-002, etc.
    correlation_id      VARCHAR(255) NOT NULL,   -- business correlation (user_id, etc.)
    status              VARCHAR(20) NOT NULL DEFAULT 'STARTED',
    current_step        VARCHAR(100),
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    failed_at           TIMESTAMPTZ,
    failure_reason      TEXT,
    compensating        BOOLEAN NOT NULL DEFAULT FALSE,
    context_data        JSONB NOT NULL DEFAULT '{}',  -- saga-specific state
    CONSTRAINT chk_status CHECK (status IN ('STARTED','RUNNING','COMPLETED','COMPENSATING','FAILED'))
);

CREATE INDEX idx_saga_instances_correlation ON saga_instances(saga_type, correlation_id);
CREATE INDEX idx_saga_instances_status ON saga_instances(status) WHERE status IN ('RUNNING', 'COMPENSATING');

-- Individual step execution log
CREATE TABLE saga_step_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saga_instance_id UUID NOT NULL REFERENCES saga_instances(id),
    step_name       VARCHAR(100) NOT NULL,
    idempotency_key VARCHAR(64) NOT NULL UNIQUE,   -- SHA-256(saga_id:step_name)
    status          VARCHAR(20) NOT NULL,           -- PENDING/EXECUTING/COMPLETED/COMPENSATED/FAILED
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    event_published VARCHAR(200),                   -- Kafka topic+offset
    compensation_event VARCHAR(200),                -- Kafka topic if compensated
    attempt_count   INTEGER NOT NULL DEFAULT 1
);
```

### 2.2 BullMQ Saga Queue Configuration
```typescript
// saga-queues.ts
import { Queue, Worker, QueueScheduler } from 'bullmq';
import { redisConnection } from './valkey-connection';  // Valkey 8.0+

export const sagaQueue = new Queue('saga-coordinator', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2_000 },
    removeOnComplete: { age: 86_400 },   // keep 24h for debugging
    removeOnFail: false,                  // keep all failures for audit
  },
});

export const sagaScheduler = new QueueScheduler('saga-coordinator', {
  connection: redisConnection,
});
```

### 2.3 Timeout Handling
Each saga step has a maximum timeout after which compensation begins automatically:
```typescript
// BullMQ job with timeout
await sagaQueue.add(stepName, payload, {
  delay: 0,
  jobId: `${sagaId}:${stepName}`,   // idempotent job ID
  // Timeout enforced by BullMQ worker stall detection
});

// Saga-level timeout (e.g., KYC must complete within 72 hours)
await sagaQueue.add('saga-timeout-check', { sagaId }, {
  delay: 72 * 60 * 60 * 1000,       // 72 hours
  jobId: `timeout:${sagaId}`,
});
```

---

## Section 3 — SAGA-001: User Onboarding Saga

**Trigger**: `identity.UserRegistration.UserRegistered.v1`
**Timeout**: 72 hours (KYC completion deadline)
**Correlation Key**: `userId`

### 3.1 Happy Path Flow

```
Step 1: UserRegistered event received
   ↓ Action: Create saga instance, set status=RUNNING
   ↓ Publish: (nothing — wait for KYC submission)

Step 2: KYC documents submitted by user
   ↓ Trigger: identity.KYC.KYCDocumentsSubmitted.v1
   ↓ Action: Forward docs to KYC provider (Sumsub/Shufti)
   ↓ Publish: identity.KYC.KYCSubmittedToProvider.v1

Step 3: KYC provider returns APPROVED
   ↓ Trigger: identity.KYC.KYCApproved.v1
   ↓ Action: Update user status to ACTIVE in User BC
   ↓ Publish: identity.UserManagement.UserActivated.v1

Step 4: UserActivated received by Subscription BC
   ↓ Action: Create FREE_TIER subscription
   ↓ Publish: billing.Subscription.SubscriptionCreated.v1 (tier=FREE)

Step 5: SubscriptionCreated received by Portfolio BC
   ↓ Action: Create default portfolio "محفظتي الأولى" (My First Portfolio)
   ↓ Publish: portfolio.Portfolio.DefaultPortfolioCreated.v1

Step 6: DefaultPortfolioCreated received by Notification BC
   ↓ Action: Send welcome push notification + email in Arabic
   ↓ Publish: notifications.Notification.WelcomeNotificationSent.v1

Step 7: Saga completed
   ↓ Action: Update saga_instances.status = 'COMPLETED'
   ↓ Publish: platform.Saga.UserOnboardingSagaCompleted.v1
```

### 3.2 Compensation Flow (KYC Rejected)

```
KYCRejected received
   ↓ Compensate Step 5 (if portfolio created): PortfolioArchived
   ↓ Compensate Step 4 (if subscription created): SubscriptionCancelled
   ↓ Compensate Step 3: UserDeactivated (set status=KYC_FAILED)
   ↓ Publish: identity.KYC.KYCRejectionNotificationSent.v1
   ↓ Saga status: COMPENSATING → FAILED (final)
```

### 3.3 Timeout Compensation (72-hour KYC deadline)
```
72-hour timer fires, KYC still PENDING
   ↓ Publish: identity.KYC.KYCTimeoutExpired.v1
   ↓ User receives: "انتهت مهلة التحقق من هويتك. يرجى إعادة المحاولة" (Arabic)
   ↓ Saga status: FAILED (user can re-trigger onboarding)
```

### 3.4 Kafka Event Contracts
| Event | Topic | Schema |
|-------|-------|--------|
| `UserRegistered.v1` | `identity.UserRegistration.UserRegistered.v1` | userId, email, mobile, registeredAt |
| `KYCApproved.v1` | `identity.KYC.KYCApproved.v1` | userId, kycProvider, approvedAt |
| `KYCRejected.v1` | `identity.KYC.KYCRejected.v1` | userId, reason, rejectedAt |
| `UserActivated.v1` | `identity.UserManagement.UserActivated.v1` | userId, activatedAt |
| `SubscriptionCreated.v1` | `billing.Subscription.SubscriptionCreated.v1` | userId, tier, startsAt |
| `DefaultPortfolioCreated.v1` | `portfolio.Portfolio.DefaultPortfolioCreated.v1` | userId, portfolioId |
| `WelcomeNotificationSent.v1` | `notifications.Notification.WelcomeNotificationSent.v1` | userId, channels |

---

## Section 4 — SAGA-002: Subscription Activation Saga

**Trigger**: `billing.Payment.PaymentInitiated.v1`
**Timeout**: 15 minutes (payment gateway timeout)
**Correlation Key**: `paymentId`

### 4.1 Happy Path Flow

```
Step 1: PaymentInitiated (user selects premium tier)
   ↓ Action: Create saga, record target tier
   ↓ Action: Call payment gateway (Vodafone Cash / Fawry / EGP card)
   ↓ Publish: billing.Payment.PaymentGatewayCallInitiated.v1

Step 2: PaymentGatewayConfirmed
   ↓ Trigger: billing.Payment.PaymentConfirmed.v1
   ↓ Action: Create/upgrade subscription in Subscription BC
   ↓ Publish: billing.Subscription.SubscriptionActivated.v1

Step 3: SubscriptionActivated received by Feature Flag BC (Unleash)
   ↓ Action: Enable premium feature flags for userId
   ↓ Publish: featureflags.FeatureFlags.PremiumFeaturesEnabled.v1

Step 4: Features enabled — notify user
   ↓ Action: Push notification + in-app banner "تم تفعيل حسابك المميز!"
   ↓ Publish: notifications.Notification.SubscriptionConfirmationSent.v1

Step 5: Saga completed
   ↓ Action: Update saga_instances.status = 'COMPLETED'
```

### 4.2 Compensation Flow (Payment Failed)
```
PaymentFailed or timeout (15 min)
   ↓ Compensate Step 3 (if features enabled): PremiumFeaturesReverted
   ↓ Compensate Step 2 (if subscription created): SubscriptionRolledBack
   ↓ Publish: billing.Payment.PaymentFailureNotificationSent.v1
   ↓ Arabic message: "فشلت عملية الدفع. لم يتم خصم أي مبلغ."
   ↓ Saga status: FAILED
```

---

## Section 5 — SAGA-003: AI Recommendation Audit Saga

**Trigger**: `ai.AIConsensusOrchestrator.ConsensusResultReached.v1`
**Timeout**: 30 seconds (WORM write must complete)
**Correlation Key**: `recommendationId`

### 5.1 Flow

```
Step 1: ConsensusResultReached (recommendation generated)
   ↓ Action: Start saga, prepare WORM audit payload

Step 2: Write to WORM (MinIO Object Lock)
   ↓ Action: POST recommendation JSON to MinIO recommendations-audit bucket
   ↓ Path: recommendations-audit/{userId}/{ticker}/{date}/{recommendationId}.json
   ↓ Object Lock: COMPLIANCE, 7 years
   ↓ Publish: audit.AuditTrail.RecommendationWORMWritten.v1

Step 3: WORM confirmed → check alert rules
   ↓ Action: Query Valkey for user's active alert rules (O(log n))
   ↓ If alert triggered: publish alert event (covered by BLUEPRINT_ALERT_TRIGGER_FLOW.md)

Step 4: Check notification preferences
   ↓ If user has AI recommendation push enabled:
   ↓ Publish: notifications.Notification.AIRecommendationPushQueued.v1

Step 5: Saga completed
   ↓ Publish: platform.Saga.AIRecommendationAuditCompleted.v1
```

### 5.2 Compensation (WORM Write Failure)
```
WORM write fails (MinIO error / network)
   ↓ CRITICAL: Recommendation is BLOCKED until WORM write succeeds
   ↓ Retry with exponential backoff (max 5 attempts over 25 seconds)
   ↓ If all retries fail: recommendation suppressed, user sees "متاح لاحقاً"
   ↓ PagerDuty P2 alert: "WORM write failure for recommendation {id}"
   ↓ Saga status: FAILED
```

### 5.3 Why WORM Failure Blocks the Recommendation
FRA compliance requirement: every AI recommendation must be immutably logged BEFORE it is delivered to the user. This is an audit trail guarantee, not just best-effort logging.

---

## Section 6 — SAGA-004: User Account Deletion Saga (PDPL Right-to-Erasure)

**Trigger**: `identity.UserManagement.ErasureRequested.v1`
**Timeout**: 30 days (PDPL Article 10 compliance deadline)
**Correlation Key**: `userId`
**SLA**: Complete within 30 days of request

> [!IMPORTANT]
> PDPL 2020 Article 10 guarantees the right to erasure. Tradeora's architecture uses the
> **PII Encryption Key Deletion Pattern** for EventStoreDB (append-only, cannot physically delete).
> All PII fields in domain events are encrypted at write time with a per-user AES-256-GCM key
> stored in OpenBao. Erasure = key deletion → all encrypted fields become unreadable.

### 6.1 Happy Path Flow

```
Step 1: ErasureRequested
   ↓ Action: Create saga, record userId, set 30-day timer
   ↓ Action: Suspend user account immediately (cannot log in)
   ↓ Publish: identity.UserManagement.AccountSuspendedForErasure.v1

Step 2: Archive all portfolios
   ↓ Trigger: portfolio.Portfolio.PortfoliosArchived.v1
   ↓ Action: Mark all portfolios status=ARCHIVED (no deletion — audit)

Step 3: Close all open positions (advisory records)
   ↓ Action: Set all Position aggregates status=CLOSED
   ↓ Publish: portfolio.Position.AllPositionsClosed.v1

Step 4: Delete all alert rules
   ↓ Action: Hard delete from alert_rules table
   ↓ Action: Remove from Valkey alert index
   ↓ Publish: alerts.AlertRule.AllAlertRulesDeleted.v1

Step 5: Anonymize AI interaction history
   ↓ Action: Replace userId with anonymized_user_{hash} in ai_interaction_log
   ↓ Action: Delete ground truth feedback (ground_truth_feedback table)
   ↓ Publish: ai.AIHistory.UserAIHistoryAnonymized.v1

Step 6: Delete EventStoreDB PII encryption key (CRITICAL)
   ↓ Action: DELETE /secret/users/{userId}/event-encryption-key from OpenBao
   ↓ Verification: Read key back → must return 404 (key is gone)
   ↓ Effect: All domain events for this user with encrypted PII → permanently unreadable
   ↓ Publish: identity.PDPL.EncryptionKeyDeleted.v1

Step 7: Anonymize PostgreSQL operational tables
   ↓ Action: UPDATE users SET
       email = 'deleted-{hash}@erasure.tradeora.invalid',
       mobile = NULL,
       full_name = 'Deleted User',
       national_id_hash = NULL,
       erasure_completed = TRUE
   ↓ Action: Delete notification_tokens for userId
   ↓ Publish: identity.PDPL.OperationalDataAnonymized.v1

Step 8: Delete notification preferences
   ↓ Action: Hard delete notification_preferences for userId
   ↓ Publish: notifications.Notification.NotificationPreferencesDeleted.v1

Step 9: Write WORM Erasure Audit Record
   ↓ Action: Write ErasureCompletedAudit to MinIO (WORM, 7 years)
   ↓ Record: { userId, erasureRequestedAt, completedAt, stepsCompleted, keyDeletionConfirmed }
   ↓ Note: userId IS stored in this WORM record (for regulatory proof of compliance)
   ↓ Publish: audit.AuditTrail.ErasureAuditRecordWritten.v1

Step 10: Saga completed
   ↓ Publish: identity.PDPL.ErasureCompleted.v1
   ↓ Send erasure confirmation to user's last known email (PDPL requirement)
   ↓ Saga status: COMPLETED
```

### 6.2 Partial Failure Handling
If any step fails:
- Saga status → COMPENSATING (partial erasure in progress)
- Alert to ROLE_COMPLIANCE_OFFICER: manual remediation required
- WORM record written with partial completion status
- Legal obligation remains: complete within 30 days

### 6.3 EventStoreDB PII Encryption Architecture
```python
# At event write time (all domain events with PII):
async def encrypt_pii_fields(event: DomainEvent, user_id: str) -> DomainEvent:
    """Encrypt PII fields using per-user key from OpenBao."""
    key = await openbao.get_secret(f"secret/users/{user_id}/event-encryption-key")
    encrypted_event = event.copy()
    for field in event.PII_FIELDS:  # declared per-event type
        encrypted_event[field] = aes_gcm_encrypt(event[field], key['value'])
    return encrypted_event

# At erasure (SAGA-004 Step 6):
async def delete_user_encryption_key(user_id: str) -> None:
    """Delete the encryption key. All encrypted event fields become unreadable."""
    await openbao.delete_secret(f"secret/users/{user_id}/event-encryption-key")
    # Verify deletion
    result = await openbao.get_secret(f"secret/users/{user_id}/event-encryption-key")
    assert result is None, f"Key deletion failed for user {user_id}"
```

---

## Section 7 — SAGA-005: Portfolio Rebalancing Suggestion Saga

**Trigger**: `ai.PortfolioIntelligence.RebalancingOpportunityDetected.v1`
**Timeout**: 24 hours (user must confirm or dismiss)
**Correlation Key**: `portfolioId`

### 7.1 Flow

```
Step 1: RebalancingOpportunityDetected (AI school identified imbalance)
   ↓ Action: Create saga, store rebalancing suggestion

Step 2: AI Risk Assessment
   ↓ Action: Run Risk Intelligence school (SCHOOL-04) on suggested rebalancing
   ↓ Verify: post-rebalancing VaR within user's risk tolerance
   ↓ Publish: ai.RiskIntelligence.RebalancingRiskAssessed.v1

Step 3: Generate Rebalancing Suggestion (advisory only)
   ↓ Action: Format suggestion as: "يُقترح تقليل COMI من 45% إلى 30% وزيادة ETEL من 20% إلى 35%"
   ↓ FRA Disclaimer: attached mandatorily
   ↓ Publish: portfolio.PortfolioAdvisory.RebalancingSuggestionGenerated.v1

Step 4: Notify user
   ↓ Push + in-app notification with suggestion summary
   ↓ Deep link to portfolio rebalancing screen

Step 5a: User confirms (ADVISORY ACKNOWLEDGEMENT — not execution)
   ↓ Trigger: portfolio.Portfolio.RebalancingSuggestionAcknowledged.v1
   ↓ Action: Record acknowledgement in audit trail (WORM)
   ↓ Saga status: COMPLETED

Step 5b: User dismisses
   ↓ Trigger: portfolio.Portfolio.RebalancingSuggestionDismissed.v1
   ↓ Action: Record dismissal (no WORM — normal user action)
   ↓ Saga status: COMPLETED (dismissed)

Step 5c: No response (24-hour timeout)
   ↓ Saga status: COMPLETED (expired — no action required)
```

> [!IMPORTANT]
> **Article 6 Advisory-Only Mandate**: Tradeora NEVER executes trades.
> The rebalancing saga records the *suggestion* and the user's *acknowledgement*.
> The user executes any resulting trades through their broker independently.

---

## Section 8 — SAGA-006: Subscription Downgrade Saga

**Trigger**: `billing.Subscription.DowngradeRequested.v1`
**Timeout**: 1 hour
**Correlation Key**: `userId`

### 8.1 Flow

```
Step 1: DowngradeRequested
   ↓ Determine what features exceed free tier limits
   ↓ Publish: billing.Subscription.DowngradeImpactCalculated.v1

Step 2: Disable premium features
   ↓ Action: Unleash → disable premium feature flags for userId
   ↓ Publish: featureflags.FeatureFlags.PremiumFeaturesDisabled.v1

Step 3: Trim excess portfolios (free tier limit: 1 portfolio)
   ↓ Action: Archive portfolios beyond free tier limit (keep most recent)
   ↓ Warning: "تم أرشفة محافظك الإضافية. يمكنك استعادتها بترقية حسابك"
   ↓ Publish: portfolio.Portfolio.ExcessPortfoliosArchived.v1

Step 4: Trim excess watchlist entries (free tier limit: 5 tickers)
   ↓ Action: Archive watchlist entries beyond limit (keep first 5)
   ↓ Publish: watchlist.Watchlist.ExcessWatchlistEntriesArchived.v1

Step 5: Trim AI request quota to free tier
   ↓ Action: Update rate limit in Kong (via Admin API)
   ↓ Publish: featureflags.RateLimits.FreeTierQuotaApplied.v1

Step 6: Send confirmation notification
   ↓ Arabic: "تم تخفيض اشتراكك إلى الخطة المجانية"
   ↓ Publish: billing.Subscription.SubscriptionDowngradeCompleted.v1

Step 7: Saga completed
```

---

## Section 9 — Saga Observability

### Prometheus Metrics
```
saga_instances_total{saga_type, status}          # counter
saga_duration_seconds{saga_type}                 # histogram
saga_step_duration_seconds{saga_type, step_name} # histogram
saga_compensations_total{saga_type}              # counter
saga_failures_total{saga_type, step_name}        # counter
saga_timeout_expirations_total{saga_type}        # counter
```

### Grafana Dashboard: "Saga Operations"
- **Panel 1**: Active sagas by type (gauge)
- **Panel 2**: Saga completion rate last 24h (percentage per type)
- **Panel 3**: Compensation rate (if >5% → investigate)
- **Panel 4**: Step failure heat map (saga_type × step_name)
- **Panel 5**: SAGA-004 (Erasure) compliance queue — PDPL 30-day SLA tracker

---

## Section 10 — Testing Strategy

### Happy Path Tests (BDD)
```gherkin
Scenario: User onboarding completes successfully
  Given a new user has submitted valid KYC documents
  When the KYC provider approves the user
  Then the user should be ACTIVE within 30 seconds
  And the user should have a default portfolio
  And the user should have received a welcome notification

Scenario: KYC rejection triggers full compensation
  Given a new user has submitted KYC documents
  When the KYC provider rejects the application
  Then the user should be in KYC_FAILED status
  And no subscription should exist for the user
  And no portfolio should exist for the user
  And the user should have received a rejection notification in Arabic
```

### Compensation Path Tests
- Simulate KYC rejection after each saga step to verify compensation
- Simulate payment failure after features enabled to verify rollback
- Simulate WORM write failure to verify recommendation blocking
- Simulate OpenBao timeout during SAGA-004 to verify compliance alert

### Chaos Tests (BullMQ)
- Kill saga worker mid-step → verify idempotent retry on restart
- Simulate Kafka producer failure → verify outbox pattern catches event
- Simulate 72-hour KYC timeout → verify user receives Arabic notification

---

*Document: SAGA_AND_PROCESS_MANAGER_SPECIFICATIONS.md*
*Version: 1.0.0 | Status: APPROVED*
*Resolves: GOV-001, GOV-002 (partial — PDPL erasure pattern specified in SAGA-004)*
