# Tradeora Financial Operating System
## System Audit Trail Specification — Complete Technical Reference
## Version 1.0.0 | Status: APPROVED | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Constitution Article 14  : Immutable audit trail for all financial events   ║
║  Constitution Article 15  : FRA 7-year retention mandate (non-negotiable)    ║
║  Constitution Article 16  : PDPL 2020 compliance by design                  ║
║  Constitution Article 29  : OSS-first (MinIO, OpenBao, Keycloak)            ║
║  Regulatory Authority     : FRA Egypt + PDPL 2020                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Section 1 — Audit Trail Philosophy

### 1.1 Purpose and Mandate

The Tradeora Audit Trail is **not optional**. Every financial event, AI recommendation,
compliance decision, and user action affecting financial data MUST be permanently
archived. This is not a logging system — it is a **legally mandated evidence chain**.

**Three non-negotiable guarantees:**

| Guarantee | Requirement | Implementation |
|-----------|------------|----------------|
| **Immutability** | Records cannot be modified after writing | MinIO Object Lock (GOVERNANCE mode) |
| **Completeness** | 100% of regulated events archived | Kafka consumer with retry + dead-letter queue |
| **Integrity** | Tampering is detectable | SHA-256 checksum chain per entity |

### 1.2 Regulatory Basis

**FRA Egypt (Financial Regulatory Authority):**
- All investment-related records: 7-year retention minimum
- AI-generated recommendations: MUST be archived with confidence scores and explanation
- FRA disclaimer delivery: MUST be confirmed in audit record

**PDPL 2020 (Personal Data Protection Law):**
- Audit records themselves are exempt from right-to-erasure (superseded by FRA retention mandate)
- PII minimization: only necessary personal data in audit records
- Breach notification: 72-hour window — audit trail is the evidence source

**Internal Policy (Constitution):**
- Every AI recommendation: WORM-archived before response is returned
- Zero audit gaps tolerated: daily coverage audit, compliance alert on any gap

### 1.3 Architectural Position

The AuditTrail is a **dedicated Bounded Context** — not a shared library, not a
cross-cutting concern bolted on. It is a full NestJS service with its own:
- PostgreSQL schema: `audit`
- Kafka consumer group: `audit-trail-consumer`
- MinIO bucket: `tradeora-audit-trail` (WORM-locked)
- REST + GraphQL API for compliance queries

```
                    AUDIT TRAIL BOUNDED CONTEXT
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Kafka Consumer ──▶ AuditEventProcessor ──▶ PostgreSQL (90d)    │
│                              │                                   │
│                              └──────────▶ MinIO WORM (7 years)  │
│                                                                  │
│  Audit API (REST/GraphQL) ──▶ Compliance Queries                │
│  Daily Coverage Audit Job ──▶ Prometheus Metric + Alert         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Section 2 — Audit Event Taxonomy (12 Categories)

### 2.1 Category Overview

| Category | Events/Day (est.) | Retention | Who Can Read | Regulatory Basis |
|----------|------------------|-----------|--------------|-----------------|
| AUTHENTICATION | 5,000 | 3 years | Security Team | PDPL Art. 20 |
| AUTHORIZATION | 500 | 3 years | Security Team | PDPL Art. 20 |
| AI_RECOMMENDATION | 50,000 | 7 years | Compliance + AI Team | FRA |
| PORTFOLIO_CHANGE | 10,000 | 7 years | Compliance | FRA |
| FINANCIAL_TRANSACTION | 2,000 | 7 years | Compliance | FRA |
| KYC_COMPLIANCE | 500 | 7 years | Compliance | FRA + PDPL |
| AML_SCREENING | 500 | 7 years | Compliance | FRA + AML Law |
| USER_CONSENT | 200 | 5 years | Compliance | PDPL Art. 7 |
| DATA_EXPORT | 50 | 3 years | Compliance | PDPL Art. 15 |
| DATA_DELETION | 50 | 7 years | Compliance | PDPL Art. 16 |
| FEATURE_FLAG | 1,000 | 1 year | Engineering | Internal |
| ADMIN_ACTION | 100 | 5 years | Security + Compliance | Internal |

### 2.2 AUTHENTICATION Category

**Events:** `USER_LOGIN_SUCCESS`, `USER_LOGIN_FAILURE`, `USER_LOGOUT`,
`MFA_CHALLENGE_SENT`, `MFA_VERIFIED`, `MFA_FAILED`, `TOKEN_REFRESHED`,
`PASSWORD_RESET_INITIATED`, `SESSION_EXPIRED`

**Additional required fields:**
```typescript
interface AuthenticationAuditData {
  authMethod: 'PASSWORD' | 'BIOMETRIC' | 'OTP' | 'SSO';
  mfaType?: 'TOTP' | 'SMS' | 'FIDO2';
  deviceFingerprint: string;       // Hashed device identifier
  geoCountry?: string;             // Country code (ISO 3166-1 alpha-2)
  failureReason?: string;          // For failed logins
  consecutiveFailures?: number;    // Account lockout tracking
}
```

**Example event:**
```json
{
  "auditId": "aud_01J6XK4MFVX7XNPQRST0001",
  "eventCategory": "AUTHENTICATION",
  "eventAction": "USER_LOGIN_SUCCESS",
  "occurredAt": "2026-07-24T09:30:00.000Z",
  "actorUserId": "usr_01J6XXXXX",
  "actorType": "USER",
  "actorIpAddress": "197.55.23.x",
  "subjectType": "UserSession",
  "subjectId": "sess_01J6XK4M",
  "outcome": "SUCCESS",
  "data": {
    "authMethod": "PASSWORD",
    "mfaType": "TOTP",
    "deviceFingerprint": "sha256:a3f8e1b2c4d5..."
  },
  "retentionYears": 3
}
```

### 2.3 AI_RECOMMENDATION Category (Most Critical)

**Events:** `RECOMMENDATION_REQUESTED`, `RECOMMENDATION_GENERATED`,
`RECOMMENDATION_BLOCKED_SAFETY_GATE`, `RECOMMENDATION_BLOCKED_MARKET_CLOSED`,
`RECOMMENDATION_SERVED_FROM_CACHE`, `EXPLANATION_GENERATED`

**Additional required fields:**
```typescript
interface AIRecommendationAuditData {
  ticker: string;
  egxSessionState: 'OPEN' | 'PRE_CLOSE';
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  confidence: string;             // Decimal string — never float
  participatingSchools: number;
  totalSchools: number;
  excludedSchools: ExclusionRecord[];
  schoolBreakdown: Record<string, string>;  // direction → decimal string
  explanationWordCountAr: number;
  explanationWordCountEn: number;
  fraDisclosureDelivered: boolean;    // MANDATORY: must be true for every recommendation
  safetyGateChecks: SafetyCheckRecord[];
  servedFromCache: boolean;
  fullPayloadWormPath: string;        // MinIO path to complete recommendation payload
  dataFreshnessSeconds: number;
}
```

**Example event:**
```json
{
  "auditId": "aud_01J6XK4MFVX7XNPQRST0002",
  "eventCategory": "AI_RECOMMENDATION",
  "eventAction": "RECOMMENDATION_GENERATED",
  "occurredAt": "2026-07-24T09:30:15.234Z",
  "requestId": "req_01J6XK4MFVX7XNPQRST1234567",
  "actorUserId": "usr_01J6XXXXX",
  "actorType": "USER",
  "subjectType": "AIRecommendation",
  "subjectId": "rec_01J6XK4MFVX7XNPQRST9999",
  "outcome": "SUCCESS",
  "data": {
    "ticker": "COMI",
    "egxSessionState": "OPEN",
    "recommendation": "BUY",
    "confidence": "0.8234",
    "participatingSchools": 11,
    "totalSchools": 12,
    "fraDisclosureDelivered": true,
    "explanationWordCountAr": 87,
    "explanationWordCountEn": 72,
    "servedFromCache": false,
    "dataFreshnessSeconds": 23,
    "fullPayloadWormPath": "/2026/07/24/ai-recommendations/rec_01J6XK4MFVX7XNPQRST9999.json.gz"
  },
  "retentionYears": 7,
  "wormPath": "/2026/07/24/AI_RECOMMENDATION/aud_01J6XK4MFVX7XNPQRST0002.json.gz"
}
```

### 2.4 KYC_COMPLIANCE Category

**Events:** `KYC_INITIATED`, `DOCUMENT_UPLOADED`, `LIVENESS_CHECK_COMPLETED`,
`KYC_APPROVED`, `KYC_REJECTED`, `KYC_MANUAL_REVIEW_REQUIRED`,
`KYC_EXPIRY_WARNING`, `KYC_RENEWAL_COMPLETED`

**Additional required fields:**
```typescript
interface KYCAuditData {
  kycProvider: string;              // 'internal' or vendor name
  documentType: 'NATIONAL_ID' | 'PASSPORT' | 'DRIVING_LICENSE';
  documentCountry: string;          // ISO 3166-1
  verificationScore?: number;       // Provider confidence score
  rejectionReason?: string;
  manualReviewRequired: boolean;
  // NOTE: No document images or OCR text in audit record (PII minimization)
  // Document stored in separate PDPL-compliant encrypted storage
  documentStorageRef: string;       // Reference to encrypted document store
}
```

### 2.5 AML_SCREENING Category

**Events:** `AML_SCREENING_INITIATED`, `AML_SCREENING_PASSED`,
`AML_HIT_DETECTED`, `AML_FALSE_POSITIVE_RESOLVED`,
`SANCTIONS_LIST_UPDATED`, `AML_MONITORING_ALERT`

**Additional required fields:**
```typescript
interface AMLAuditData {
  screeningProvider: string;
  listsChecked: string[];           // e.g., ['OFAC', 'UN', 'EU', 'CBE_WATCHLIST']
  hitCount: number;
  hitDetails?: AMLHit[];           // Present only if hit_count > 0
  resolution?: 'FALSE_POSITIVE' | 'TRUE_HIT';
  resolvedBy?: string;             // Admin userId (hashed)
  accountAction: 'NONE' | 'FROZEN' | 'MANUAL_REVIEW';
}
```

### 2.6 DATA_DELETION Category (PDPL Right to Erasure)

**Events:** `ERASURE_REQUESTED`, `ERASURE_PSEUDONYMIZATION_STARTED`,
`ERASURE_PSEUDONYMIZATION_COMPLETED`, `ERASURE_CONFIRMED`

**Additional required fields:**
```typescript
interface DataDeletionAuditData {
  erasureRequestId: string;
  requestedAt: string;
  pseudonymizationToken: string;    // The token replacing userId
  affectedSystems: string[];        // Which systems pseudonymized
  auditRecordsTreated: number;      // Count of audit records where userId replaced
  retainedForFRA: boolean;          // true: financial records kept (pseudonymized)
  completedAt?: string;
  pdplArticle: 'ART_16';           // Right to erasure basis
}
```

---

## Section 3 — Audit Event Base Schema

### 3.1 TypeScript Interface (Canonical)

```typescript
// packages/shared-kernel/src/audit/audit-event.interface.ts

export type AuditCategory =
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'AI_RECOMMENDATION'
  | 'PORTFOLIO_CHANGE'
  | 'FINANCIAL_TRANSACTION'
  | 'KYC_COMPLIANCE'
  | 'AML_SCREENING'
  | 'USER_CONSENT'
  | 'DATA_EXPORT'
  | 'DATA_DELETION'
  | 'FEATURE_FLAG'
  | 'ADMIN_ACTION';

export type AuditOutcome = 'SUCCESS' | 'FAILURE' | 'PARTIAL';
export type ActorType = 'USER' | 'SYSTEM' | 'AI' | 'ADMIN';

export interface AuditEvent {
  // Identity
  auditId: string;                 // ULID: aud_{ulid}
  eventCategory: AuditCategory;
  eventAction: string;             // SCREAMING_SNAKE_CASE action name

  // Timing
  occurredAt: string;              // ISO 8601 UTC: '2026-07-24T09:30:15.234Z'

  // Correlation
  requestId?: string;              // From X-Request-ID header
  traceId?: string;                // OpenTelemetry trace ID
  spanId?: string;                 // OpenTelemetry span ID
  correlationId?: string;          // Business correlation (e.g., KYC flow ID)

  // Actor (who performed the action)
  actorUserId?: string;            // null for SYSTEM/AI events
  actorType: ActorType;
  actorIpAddress?: string;         // Last octet removed: '197.55.23.x' (PDPL Art 4)
  actorServiceName?: string;       // For SYSTEM actor: service name

  // Subject (what was acted upon)
  subjectType: string;             // 'Portfolio', 'AIRecommendation', 'UserAccount'
  subjectId: string;               // ULID of the affected entity
  subjectTenantId?: string;        // For multi-tenant context

  // Action Result
  outcome: AuditOutcome;
  failureReason?: string;          // If outcome = FAILURE
  failureCode?: string;            // Machine-readable failure code

  // Category-Specific Data (PII-minimized)
  data: Record<string, unknown>;

  // Integrity Chain
  checksum: string;                // SHA-256 of canonical JSON of this event
  previousChecksum?: string;       // SHA-256 of previous audit event for same subjectId

  // Retention & Storage
  retentionYears: number;          // 7 (FRA) | 5 (admin) | 3 (auth) | 1 (feature_flag)
  wormPath: string;                // MinIO WORM object path
  wormWrittenAt?: string;          // Set after successful MinIO write
  wormETag?: string;               // MinIO ETag (proves object integrity)
}
```

### 3.2 Checksum Computation

```typescript
import { createHash } from 'crypto';

function computeChecksum(event: Omit<AuditEvent, 'checksum' | 'wormWrittenAt' | 'wormETag'>): string {
  // Deterministic canonical JSON (sorted keys, no undefined values)
  const canonicalPayload = JSON.stringify({
    auditId: event.auditId,
    eventCategory: event.eventCategory,
    eventAction: event.eventAction,
    occurredAt: event.occurredAt,
    actorUserId: event.actorUserId ?? null,
    actorType: event.actorType,
    subjectType: event.subjectType,
    subjectId: event.subjectId,
    outcome: event.outcome,
    data: event.data,
    retentionYears: event.retentionYears,
  });
  return createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');
}
```

### 3.3 PostgreSQL Schema

```sql
-- Schema: audit
-- Migration: V1_0_0__create_audit_events_table.sql

CREATE TABLE audit.audit_events (
    audit_id          TEXT        PRIMARY KEY,             -- ULID
    event_category    TEXT        NOT NULL,
    event_action      TEXT        NOT NULL,
    occurred_at       TIMESTAMPTZ NOT NULL,
    request_id        TEXT,
    trace_id          TEXT,
    actor_user_id     TEXT,                                -- Nullable for SYSTEM events
    actor_type        TEXT        NOT NULL,
    actor_ip_address  TEXT,                                -- Last octet masked
    subject_type      TEXT        NOT NULL,
    subject_id        TEXT        NOT NULL,
    outcome           TEXT        NOT NULL CHECK (outcome IN ('SUCCESS','FAILURE','PARTIAL')),
    failure_reason    TEXT,
    data              JSONB       NOT NULL DEFAULT '{}',
    checksum          TEXT        NOT NULL UNIQUE,
    previous_checksum TEXT,                                -- Chain link
    retention_years   INTEGER     NOT NULL,
    worm_path         TEXT        NOT NULL,
    worm_written_at   TIMESTAMPTZ,
    worm_etag         TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for compliance queries
CREATE INDEX idx_audit_category_occurred ON audit.audit_events (event_category, occurred_at DESC);
CREATE INDEX idx_audit_subject_occurred  ON audit.audit_events (subject_id, occurred_at DESC);
CREATE INDEX idx_audit_actor_occurred    ON audit.audit_events (actor_user_id, occurred_at DESC)
    WHERE actor_user_id IS NOT NULL;
CREATE INDEX idx_audit_occurred_only     ON audit.audit_events (occurred_at DESC);

-- Partition by month for performance (TimescaleDB hypertable)
SELECT create_hypertable('audit.audit_events', 'occurred_at', chunk_time_interval => INTERVAL '1 month');

COMMENT ON TABLE audit.audit_events IS
  'Hot audit storage (90-day window). Cold archival via MinIO WORM. FRA 7-year retention.';
```

---

## Section 4 — WORM Storage Implementation

### 4.1 MinIO Bucket Configuration

```yaml
# infrastructure/minio/audit-trail-bucket.yaml
BucketName: tradeora-audit-trail
Region: us-east-1  # Internal MinIO region label
Versioning: Enabled
ObjectLock:
  Enabled: true
  DefaultRetention:
    Mode: GOVERNANCE      # GOVERNANCE: requires admin override to delete
    Years: 7              # FRA minimum (COMPLIANCE mode would prevent all deletion)
Encryption:
  SSEAlgorithm: AES256   # Server-side encryption
Lifecycle:
  - ID: archive-to-cold
    Status: Enabled
    Filter:
      Prefix: ""
    Transitions:
      - Days: 90
        StorageClass: GLACIER  # Move to cold storage after 90 days
PublicAccess: BLOCKED
ACL: Private
```

### 4.2 Object Path Convention

```
/{year}/{month}/{day}/{category}/{audit_id}.json.gz

Examples:
  /2026/07/24/AI_RECOMMENDATION/aud_01J6XK4MFVX7XNPQRST0002.json.gz
  /2026/07/24/KYC_COMPLIANCE/aud_01J6XK4MFVX7XNPQRST0003.json.gz
  /2026/07/24/FINANCIAL_TRANSACTION/aud_01J6XK4MFVX7XNPQRST0004.json.gz

Full AI Recommendation payload (linked from audit event):
  /2026/07/24/ai-recommendations/rec_01J6XK4MFVX7XNPQRST9999.json.gz
```

### 4.3 MinIO Write Implementation

```typescript
// services/audit-trail/src/storage/worm-writer.service.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { gzipSync } from 'zlib';
import { createHash } from 'crypto';

@Injectable()
export class WormWriterService {
  private readonly s3: S3Client;
  private readonly bucketName = 'tradeora-audit-trail';

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      endpoint: configService.get('MINIO_ENDPOINT'),
      credentials: {
        accessKeyId: configService.get('MINIO_ACCESS_KEY'),
        secretAccessKey: configService.get('MINIO_SECRET_KEY'),
      },
      forcePathStyle: true,
    });
  }

  async writeWorm(event: AuditEvent): Promise<WormWriteResult> {
    const payload = JSON.stringify(event);
    const compressed = gzipSync(payload);
    const contentMd5 = createHash('md5').update(compressed).digest('base64');

    const objectKey = this.buildObjectKey(event);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      Body: compressed,
      ContentType: 'application/json',
      ContentEncoding: 'gzip',
      ContentMD5: contentMd5,
      // WORM Object Lock
      ObjectLockMode: 'GOVERNANCE',
      ObjectLockRetainUntilDate: this.computeRetainUntil(event.retentionYears),
      // Metadata for compliance queries
      Metadata: {
        'audit-id': event.auditId,
        'event-category': event.eventCategory,
        'event-action': event.eventAction,
        'occurred-at': event.occurredAt,
        'checksum': event.checksum,
        'retention-years': String(event.retentionYears),
      },
    });

    const response = await this.s3.send(command);

    return {
      objectKey,
      etag: response.ETag!.replace(/"/g, ''),
      writtenAt: new Date().toISOString(),
    };
  }

  private buildObjectKey(event: AuditEvent): string {
    const d = new Date(event.occurredAt);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}/${month}/${day}/${event.eventCategory}/${event.auditId}.json.gz`;
  }

  private computeRetainUntil(retentionYears: number): Date {
    const retainUntil = new Date();
    retainUntil.setFullYear(retainUntil.getFullYear() + retentionYears);
    return retainUntil;
  }
}
```

---

## Section 5 — Audit Service Architecture

### 5.1 Service Overview

```typescript
// services/audit-trail/src/app.module.ts
@Module({
  imports: [
    // Kafka consumer for all domain event topics
    KafkaModule.forRoot({
      clientId: 'audit-trail-service',
      brokers: ['kafka-1:9092', 'kafka-2:9092', 'kafka-3:9092'],
      groupId: 'audit-trail-consumer',
      // Subscribe to ALL topics — audit trail consumes everything
      topics: ['#'],  // Pattern: all topics
    }),
    TypeOrmModule.forFeature([AuditEventEntity]),
    WormWriterModule,
    IntegrityChainModule,
    ComplianceReportModule,
  ],
  providers: [
    AuditEventProcessor,
    WormWriterService,
    IntegrityChainService,
    CoverageAuditJob,
  ],
})
export class AuditTrailModule {}
```

### 5.2 Event Processing Pipeline

```typescript
// services/audit-trail/src/processors/audit-event.processor.ts

@Injectable()
export class AuditEventProcessor {
  constructor(
    private readonly repository: AuditEventRepository,
    private readonly wormWriter: WormWriterService,
    private readonly integrityChain: IntegrityChainService,
    private readonly metrics: AuditMetricsService,
  ) {}

  @KafkaConsumer({ topics: ['#'], fromBeginning: false })
  async processKafkaEvent(kafkaEvent: KafkaMessage): Promise<void> {
    const startMs = Date.now();

    try {
      // Step 1: Classify the Kafka event into an AuditCategory
      const category = this.classify(kafkaEvent);
      if (!category) {
        return; // Not an auditable event — skip silently
      }

      // Step 2: Build AuditEvent from Kafka message
      const auditEvent = await this.buildAuditEvent(kafkaEvent, category);

      // Step 3: Compute integrity checksum + chain link
      const previousChecksum = await this.integrityChain.getLastChecksum(auditEvent.subjectId);
      auditEvent.checksum = this.integrityChain.computeChecksum(auditEvent);
      auditEvent.previousChecksum = previousChecksum;

      // Step 4: Write to MinIO WORM FIRST (most critical)
      const wormResult = await this.wormWriter.writeWorm(auditEvent);
      auditEvent.wormPath = wormResult.objectKey;
      auditEvent.wormWrittenAt = wormResult.writtenAt;
      auditEvent.wormETag = wormResult.etag;

      // Step 5: Save to PostgreSQL hot store (queryable for 90 days)
      await this.repository.save(auditEvent);

      // Step 6: Update metrics
      this.metrics.recordAuditEvent(category, Date.now() - startMs);

    } catch (error) {
      // CRITICAL: Audit write failure goes to dead-letter queue for retry
      // We NEVER silently drop audit events
      this.metrics.recordAuditFailure(kafkaEvent.topic);
      await this.deadLetterQueue.push(kafkaEvent, error);
      this.logger.error('audit_event_write_failed', { topic: kafkaEvent.topic, error });

      // Alert compliance team immediately for FRA-regulated categories
      if (this.isRegulated(kafkaEvent.topic)) {
        await this.complianceAlerter.fireAuditGap(kafkaEvent);
      }
    }
  }

  private classify(kafkaEvent: KafkaMessage): AuditCategory | null {
    const topic = kafkaEvent.topic;
    if (topic.startsWith('ai.consensus.')) return 'AI_RECOMMENDATION';
    if (topic.startsWith('portfolio.')) return 'PORTFOLIO_CHANGE';
    if (topic.startsWith('compliance.kyc.')) return 'KYC_COMPLIANCE';
    if (topic.startsWith('compliance.aml.')) return 'AML_SCREENING';
    if (topic.startsWith('identity.auth.')) return 'AUTHENTICATION';
    if (topic.startsWith('identity.authorization.')) return 'AUTHORIZATION';
    if (topic.startsWith('subscription.billing.')) return 'FINANCIAL_TRANSACTION';
    if (topic.startsWith('compliance.erasure.')) return 'DATA_DELETION';
    if (topic.startsWith('compliance.export.')) return 'DATA_EXPORT';
    if (topic.startsWith('identity.consent.')) return 'USER_CONSENT';
    return null; // Not an auditable topic
  }
}
```

### 5.3 Storage Tiers

| Tier | Technology | Retention | Purpose |
|------|-----------|-----------|---------|
| Hot | PostgreSQL `audit` schema (TimescaleDB) | 90 days | Active compliance investigations |
| Cold | MinIO WORM (GOVERNANCE locked) | 7 years | Legal archive, FRA evidence |
| Dead-Letter | Valkey queue | 7 days | Failed write retry |

### 5.4 Audit REST API

```typescript
// services/audit-trail/src/api/audit.controller.ts

@Controller('/api/v1/audit')
@UseGuards(ComplianceTeamAuthGuard)  // Only compliance team role
export class AuditController {

  @Get('/events')
  async queryEvents(@Query() query: AuditQueryDto): Promise<PaginatedAuditEvents> {
    // Compliance team queries hot store (90 days) or cold archive (7 years)
    return this.auditQuery.find({
      category: query.category,
      subjectId: query.subjectId,
      actorUserId: query.actorUserId,
      from: query.from,
      to: query.to,
      outcome: query.outcome,
      limit: Math.min(query.limit ?? 50, 1000),
      cursor: query.cursor,
    });
  }

  @Get('/events/:auditId')
  async getEvent(@Param('auditId') auditId: string): Promise<AuditEvent> {
    return this.auditQuery.findById(auditId);
  }

  @Get('/events/:auditId/worm')
  async getWormRecord(@Param('auditId') auditId: string): Promise<Buffer> {
    // Fetch directly from MinIO WORM (proves original, unmodified record)
    const event = await this.auditQuery.findById(auditId);
    return this.wormReader.fetchRaw(event.wormPath);
  }

  @Get('/coverage/daily')
  async getDailyCoverage(@Query('date') date: string): Promise<CoverageReport> {
    // For FRA audits: confirm all events for a day are archived
    return this.coverageAuditService.generateReport(date);
  }

  @Get('/integrity/verify/:subjectId')
  async verifyIntegrityChain(
    @Param('subjectId') subjectId: string,
  ): Promise<IntegrityVerificationResult> {
    return this.integrityChain.verifyChain(subjectId);
  }
}
```

---

## Section 6 — Integrity Chain

### 6.1 Chain Design

Every audit event for a given `subjectId` forms a **cryptographic chain**:

```
Event 1 (subjectId=rec_001):  checksum=A,   previousChecksum=null
Event 2 (subjectId=rec_001):  checksum=B,   previousChecksum=A
Event 3 (subjectId=rec_001):  checksum=C,   previousChecksum=B
                                                      ↑
                    Tamper event 2 → C's previousChecksum won't match new B
```

### 6.2 Chain Verification

```typescript
@Injectable()
export class IntegrityChainService {
  async verifyChain(subjectId: string): Promise<IntegrityVerificationResult> {
    const events = await this.repository.findBySubjectId(subjectId, { orderBy: 'occurred_at ASC' });

    const violations: IntegrityViolation[] = [];
    let previousChecksum: string | null = null;

    for (const event of events) {
      // Recompute checksum from stored fields
      const recomputed = this.computeChecksum(event);

      if (recomputed !== event.checksum) {
        violations.push({
          auditId: event.auditId,
          violationType: 'CHECKSUM_MISMATCH',
          storedChecksum: event.checksum,
          recomputedChecksum: recomputed,
        });
      }

      if (event.previousChecksum !== previousChecksum) {
        violations.push({
          auditId: event.auditId,
          violationType: 'CHAIN_BREAK',
          expectedPreviousChecksum: previousChecksum,
          actualPreviousChecksum: event.previousChecksum,
        });
      }

      previousChecksum = event.checksum;
    }

    return {
      subjectId,
      eventsVerified: events.length,
      violations,
      integrityStatus: violations.length === 0 ? 'INTACT' : 'COMPROMISED',
      verifiedAt: new Date().toISOString(),
    };
  }

  async getDailyMerkleRoot(date: string): Promise<string> {
    // All events for a day → sort by auditId → build Merkle tree → return root
    const events = await this.repository.findByDate(date);
    const checksums = events.map(e => e.checksum);
    return this.buildMerkleRoot(checksums);
  }

  private buildMerkleRoot(checksums: string[]): string {
    if (checksums.length === 0) return createHash('sha256').update('empty').digest('hex');
    if (checksums.length === 1) return checksums[0];

    const pairs: string[] = [];
    for (let i = 0; i < checksums.length; i += 2) {
      const left = checksums[i];
      const right = i + 1 < checksums.length ? checksums[i + 1] : left; // Duplicate last if odd
      pairs.push(createHash('sha256').update(left + right).digest('hex'));
    }
    return this.buildMerkleRoot(pairs);
  }
}
```

### 6.3 Daily Merkle Root Storage

```sql
-- Table: audit.daily_merkle_roots
CREATE TABLE audit.daily_merkle_roots (
    date          DATE    PRIMARY KEY,
    merkle_root   TEXT    NOT NULL,       -- Merkle root of all event checksums for the day
    event_count   INTEGER NOT NULL,
    computed_at   TIMESTAMPTZ NOT NULL,
    worm_path     TEXT    NOT NULL        -- MinIO path to the daily manifest
);
```

---

## Section 7 — AI Recommendation Audit Flow

### 7.1 Sequence

```
User Request
    │
    ├─▶ ConsensusOrchestrator generates recommendation
    │
    ├─▶ HTTP Response returned to user (< 800ms)
    │
    └─▶ [ASYNC, after response] ──────────────────────────────────┐
                                                                    │
        ┌──────────────────────────────────────────────────────────▼──┐
        │  AuditTrail Async Writer                                      │
        │                                                               │
        │  1. ConsensusResultReached event consumed from Kafka          │
        │  2. Full recommendation payload → MinIO WORM                 │
        │     Path: /2026/07/24/ai-recommendations/{rec_id}.json.gz    │
        │  3. AuditEvent record created:                                │
        │     - checksum computed                                       │
        │     - previousChecksum linked                                 │
        │     - wormPath set                                            │
        │  4. AuditEvent → MinIO WORM                                  │
        │     Path: /2026/07/24/AI_RECOMMENDATION/{audit_id}.json.gz   │
        │  5. AuditEvent → PostgreSQL hot store                        │
        │  6. METRIC_WORM_WRITE_SUCCESS.inc()                          │
        └──────────────────────────────────────────────────────────────┘
```

### 7.2 Zero-Gap Enforcement

```typescript
@Cron('0 1 * * *')  // 1:00 AM daily
export class DailyCoverageAuditJob {
  async run(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];  // YYYY-MM-DD

    // Count Kafka events published yesterday (from Kafka offset tracking)
    const publishedCount = await this.kafkaAuditTracker.countPublished(dateStr, 'AI_RECOMMENDATION');

    // Count WORM objects created yesterday
    const wormCount = await this.wormReader.countObjects(`/${dateStr.replace(/-/g, '/')}/AI_RECOMMENDATION/`);

    // Count PostgreSQL hot store records
    const pgCount = await this.repository.countByDate(dateStr, 'AI_RECOMMENDATION');

    const coverage = {
      date: dateStr,
      category: 'AI_RECOMMENDATION',
      kafkaEventsPublished: publishedCount,
      wormObjectsCreated: wormCount,
      postgresRecords: pgCount,
      wormCoverageRate: wormCount / publishedCount,
      postgresRetentionCompliant: pgCount === wormCount,
    };

    // COMPLIANCE ALERT if any gap
    if (coverage.wormCoverageRate < 1.0) {
      await this.complianceAlerter.fireWormGap({
        severity: 'CRITICAL',
        message: `AI_RECOMMENDATION WORM coverage gap on ${dateStr}: ${wormCount}/${publishedCount} objects`,
        gapCount: publishedCount - wormCount,
      });
    }

    // Update Prometheus
    METRIC_WORM_COVERAGE_RATIO.labels({ category: 'AI_RECOMMENDATION', date: dateStr })
      .set(coverage.wormCoverageRate);

    await this.repository.saveCoverageReport(coverage);
  }
}
```

---

## Section 8 — PDPL Right-to-Erasure Implementation

### 8.1 Erasure Request Flow

```
User requests erasure (PDPL Art. 16)
    │
    ├─▶ UserDataErasureRequested event published
    │
    └─▶ ErasureCoordinator service:
           │
           ├─▶ Generate pseudonymization token:
           │     ERASURE_TOKEN_{YYYYMMDD}_{SHA256(userId)}
           │
           ├─▶ Pseudonymize in PostgreSQL (operational tables):
           │     UPDATE users SET user_id = token, email = NULL, phone = NULL
           │     UPDATE portfolio.portfolios SET user_id = token
           │     (All 15 operational tables updated)
           │
           ├─▶ Audit records: userId REPLACED with pseudonymization token
           │     (WORM objects themselves: NOT modified — legally exempt)
           │     (Future audit events reference the token, not the real userId)
           │
           ├─▶ Publish UserDataErasureCompleted event
           │
           └─▶ Send confirmation to user (72-hour SLA met)
```

### 8.2 Key Legal Principle

> **WORM records are NOT modified after erasure.** This is both technically
> impossible (Object Lock) and legally permissible: FRA 7-year retention mandate
> supersedes PDPL Art. 16 right-to-erasure for financial records. The pseudonymization
> token breaks the link between the audit record and the real person, satisfying
> PDPL's privacy intent while maintaining FRA's evidence integrity.

```typescript
// services/compliance/src/erasure/erasure-coordinator.service.ts

@Injectable()
export class ErasureCoordinatorService {
  async processErasureRequest(userId: string, requestId: string): Promise<void> {
    // Generate deterministic pseudonymization token
    const token = `ERASURE_TOKEN_${format(new Date(), 'yyyyMMdd')}_${createHash('sha256').update(userId).digest('hex').slice(0, 16)}`;

    // Pseudonymize all operational databases
    await this.pseudonymizeOperational(userId, token);

    // Update future audit event routing (new events use token instead of userId)
    await this.auditRouter.registerErasureToken(userId, token);

    // Create erasure completion audit record (using the token itself as actor)
    await this.auditWriter.write({
      eventCategory: 'DATA_DELETION',
      eventAction: 'ERASURE_PSEUDONYMIZATION_COMPLETED',
      actorUserId: token,  // Actor is the pseudonymized token
      actorType: 'SYSTEM',
      subjectType: 'UserAccount',
      subjectId: token,    // Subject also uses token
      outcome: 'SUCCESS',
      data: {
        erasureRequestId: requestId,
        pseudonymizationToken: token,
        affectedSystems: ['postgresql', 'valkey', 'kafka-consumer-offsets'],
        auditRecordsTreated: 0,  // WORM records not modified
        retainedForFRA: true,
        pdplArticle: 'ART_16',
      },
      retentionYears: 7,
    });
  }
}
```

---

## Section 9 — Observability

### 9.1 Prometheus Metrics

```typescript
// services/audit-trail/src/metrics/audit-metrics.service.ts

// Event ingestion throughput
const METRIC_AUDIT_EVENTS_TOTAL = new Counter({
  name: 'audit_events_ingested_total',
  help: 'Total audit events ingested from Kafka',
  labelNames: ['category', 'outcome'],
});

// WORM write latency
const METRIC_WORM_WRITE_DURATION = new Histogram({
  name: 'audit_worm_write_duration_seconds',
  help: 'MinIO WORM write latency',
  labelNames: ['category'],
  buckets: [.05, .1, .2, .5, 1.0, 2.0, 5.0],
});

// CRITICAL: WORM coverage ratio (must be 1.0)
const METRIC_WORM_COVERAGE_RATIO = new Gauge({
  name: 'audit_worm_coverage_ratio',
  help: 'Fraction of Kafka events that have WORM records (target: 1.0)',
  labelNames: ['category', 'date'],
});

// Dead-letter queue depth
const METRIC_DLQ_DEPTH = new Gauge({
  name: 'audit_dead_letter_queue_depth',
  help: 'Number of failed audit events pending retry',
  labelNames: ['category'],
});

// Integrity chain violations
const METRIC_INTEGRITY_VIOLATIONS = new Counter({
  name: 'audit_integrity_chain_violations_total',
  help: 'Integrity chain violations detected',
  labelNames: ['violation_type', 'category'],
});

// PostgreSQL hot store size
const METRIC_HOT_STORE_ROWS = new Gauge({
  name: 'audit_hot_store_row_count',
  help: 'Rows in PostgreSQL audit hot store',
  labelNames: ['category'],
});
```

### 9.2 PromQL Alert Rules

```yaml
groups:
  - name: audit_trail_critical
    rules:
      - alert: AuditWORMCoverageGap
        expr: audit_worm_coverage_ratio < 1.0
        for: 0m  # Immediate — no grace period
        labels:
          severity: critical
          team: compliance
        annotations:
          summary: 'CRITICAL: Audit WORM coverage gap detected (FRA violation risk)'
          description: 'Category {{ $labels.category }} on {{ $labels.date }}: coverage {{ $value }}'
          runbook: 'https://runbooks.tradeora.com/compliance/worm-gap'

      - alert: AuditDeadLetterQueueHigh
        expr: audit_dead_letter_queue_depth > 100
        for: 5m
        labels:
          severity: page
          team: platform
        annotations:
          summary: 'Audit DLQ depth > 100 — WORM writes failing'

      - alert: AuditIntegrityViolation
        expr: increase(audit_integrity_chain_violations_total[1m]) > 0
        for: 0m
        labels:
          severity: critical
          team: compliance
        annotations:
          summary: 'CRITICAL: Audit integrity chain violation detected — potential tampering'

      - alert: AuditWORMWriteLatencyHigh
        expr: histogram_quantile(0.99, rate(audit_worm_write_duration_seconds_bucket[5m])) > 5.0
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: 'Audit WORM write P99 latency > 5s'

      - alert: AuditKafkaConsumerLag
        expr: kafka_consumer_group_lag{group="audit-trail-consumer"} > 10000
        for: 5m
        labels:
          severity: page
        annotations:
          summary: 'Audit trail consumer lag > 10,000 — events not being archived'
```

### 9.3 Grafana Dashboard: Audit Trail Health

```
Panel 1:  WORM Coverage Ratio (all categories) — gauge, must be 100%
Panel 2:  Audit events ingested per category — stacked bar chart (24h)
Panel 3:  WORM write latency P50/P95/P99 — time series
Panel 4:  Dead-letter queue depth — time series
Panel 5:  Integrity violations — counter (must be 0)
Panel 6:  Hot store row count by category — table
Panel 7:  Daily Merkle root history — table with verify links
Panel 8:  Erasure requests pending vs. completed — stat panels
Panel 9:  Kafka consumer group lag — time series
Panel 10: MinIO bucket utilization (GB) — gauge with 7-year projection
```

---

## Section 10 — Test Strategy

### 10.1 Unit Tests

```typescript
describe('IntegrityChainService', () => {
  it('computes deterministic checksum', () => {
    const event = buildTestAuditEvent({ auditId: 'aud_test_001' });
    const checksum1 = service.computeChecksum(event);
    const checksum2 = service.computeChecksum(event);
    expect(checksum1).toBe(checksum2);
    expect(checksum1).toHaveLength(64); // SHA-256 hex
  });

  it('detects checksum mismatch in chain verification', async () => {
    const events = buildChainedEvents(3, { subjectId: 'rec_001' });
    // Tamper event 2's data
    events[1].data = { ...events[1].data, tampered: true };
    // Recompute checksum for event 2 with tampered data
    events[1].checksum = service.computeChecksum(events[1]);
    // Chain verification should detect: event 3's previousChecksum won't match

    await repository.saveAll(events);
    const result = await service.verifyChain('rec_001');
    expect(result.integrityStatus).toBe('COMPROMISED');
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].violationType).toBe('CHAIN_BREAK');
  });
});

describe('WormWriterService', () => {
  it('writes gzip-compressed JSON to MinIO with correct object lock', async () => {
    const event = buildTestAuditEvent({ retentionYears: 7 });
    const result = await service.writeWorm(event);
    
    // Verify object exists
    const head = await s3.headObject({ Bucket: 'tradeora-audit-trail', Key: result.objectKey });
    expect(head.ContentEncoding).toBe('gzip');
    expect(head.ObjectLockMode).toBe('GOVERNANCE');
    
    // Verify retention date is ~7 years from now
    const retainUntil = new Date(head.ObjectLockRetainUntilDate!);
    const yearsFromNow = (retainUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365);
    expect(yearsFromNow).toBeCloseTo(7, 0);
  });
});
```

### 10.2 Integration Tests (Testcontainers)

```typescript
describe('AuditEventProcessor — Integration', () => {
  let env: TestEnvironment;

  beforeAll(async () => {
    env = await TestEnvironment.start({
      kafka: true,
      postgres: true,
      minio: true,
    });
    await env.minio.createBucketWithObjectLock('tradeora-audit-trail');
  });

  it('processes AI recommendation Kafka event end-to-end', async () => {
    // Publish a ConsensusResultReached event
    await env.kafka.publish('ai.consensus.ConsensusResultReached.v1', {
      eventId: 'evt_test_001',
      payload: { ticker: 'COMI', recommendation: 'BUY', confidence: '0.8234' },
    });

    // Wait for AuditEventProcessor to consume and archive
    await waitFor(async () => {
      const wormObjects = await env.minio.listObjects('tradeora-audit-trail', '2026/');
      expect(wormObjects).toHaveLength(1);
    }, { timeout: 10_000 });

    // Verify PostgreSQL record
    const pgRecord = await env.postgres.query(
      "SELECT * FROM audit.audit_events WHERE event_category = 'AI_RECOMMENDATION'"
    );
    expect(pgRecord.rows).toHaveLength(1);
    expect(pgRecord.rows[0].data.fraDisclosureDelivered).toBe(true);

    // Verify checksum integrity
    const auditId = pgRecord.rows[0].audit_id;
    const result = await integrityService.verifyChain(pgRecord.rows[0].subject_id);
    expect(result.integrityStatus).toBe('INTACT');
  });
});
```

### 10.3 Chaos Tests

```bash
# CHAOS-01: MinIO unavailable during high-throughput period
kubectl delete pod -l app=minio --grace-period=0
# Expected: WORM writes fail → DLQ depth rises → Alert fires
# On MinIO recovery: DLQ replays → Coverage gap closed → Coverage alert resolves

# CHAOS-02: Audit service OOM (Kubernetes OOMKilled)
kubectl set resources deployment audit-trail --limits=memory=50Mi
# Expected: Pod OOMKilled → HPA restarts → Kafka consumer resumes from last offset
# Result: No events lost (Kafka provides replay)

# CHAOS-03: PostgreSQL hot store disk full
# Expected: WORM writes succeed (MinIO unaffected); PG writes fail
# Alert: 'Audit hot store write failed' (non-critical — WORM is the primary)
# Recovery: Disk expanded → PG writes resume

# CHAOS-04: Kafka consumer falls behind (inject latency)
# Expected: Consumer lag rises → Alert fires at > 10,000 lag
# WORM writes may be delayed but never lost (offset not committed until WORM written)
```

### 10.4 Load Test

```python
# audit_load_test.py — simulate 1,000 audit events/second
import asyncio
from kafka import KafkaProducer
import time

async def load_test_audit_throughput():
    producer = KafkaProducer(bootstrap_servers=['kafka-1:9092'])
    target_rps = 1000
    duration_seconds = 60
    total_sent = 0

    for second in range(duration_seconds):
        start = time.monotonic()
        for _ in range(target_rps):
            producer.send('ai.consensus.ConsensusResultReached.v1', b'{"test": true}')
            total_sent += 1
        producer.flush()

        elapsed = time.monotonic() - start
        if elapsed < 1.0:
            await asyncio.sleep(1.0 - elapsed)

    print(f"Sent {total_sent} events in {duration_seconds}s")
    print(f"Expected WORM objects: {total_sent}")
    # Verify coverage after test:
    # audit_worm_coverage_ratio should = 1.0 throughout
```

---

## Section 11 — Compliance Reporting

### 11.1 Monthly Compliance Report

```typescript
@Injectable()
export class ComplianceReportService {
  async generateMonthlyReport(year: number, month: number): Promise<ComplianceReport> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const stats = await this.repository.getStatsByPeriod(start, end);
    const integrityResults = await this.integrityChain.verifyAllChains(start, end);
    const wormCoverage = await this.coverageAudit.getCoverageByPeriod(start, end);

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      generatedAt: new Date().toISOString(),
      summary: {
        totalEventsAudited: stats.totalEvents,
        totalWORMObjectsCreated: stats.wormObjects,
        wormCoverageRate: `${(wormCoverage.rate * 100).toFixed(4)}%`,
        integrityViolations: integrityResults.totalViolations,
        criticalCategories: {
          AI_RECOMMENDATION: stats.byCategory.AI_RECOMMENDATION,
          KYC_COMPLIANCE: stats.byCategory.KYC_COMPLIANCE,
          AML_SCREENING: stats.byCategory.AML_SCREENING,
          FINANCIAL_TRANSACTION: stats.byCategory.FINANCIAL_TRANSACTION,
        },
      },
      sloCompliance: {
        wormCoverageSLO: '100% target',
        wormCoverageActual: `${(wormCoverage.rate * 100).toFixed(4)}%`,
        sloMet: wormCoverage.rate >= 1.0,
      },
      integrityStatus: integrityResults.totalViolations === 0 ? 'INTACT' : 'COMPROMISED',
      retentionStatus: {
        sevenYearRecords: stats.retentionBreakdown['7'],
        fiveYearRecords: stats.retentionBreakdown['5'],
        threeYearRecords: stats.retentionBreakdown['3'],
      },
    };
  }
}
```

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT FOOTER                                                             ║
║  Document: SYSTEM_AUDIT_TRAIL_SPECIFICATION.md                              ║
║  Version:  1.0.0                                                            ║
║  Status:   APPROVED                                                          ║
║  Owner:    Compliance Engineering Team                                       ║
║  Effective: 2026-07-24                                                       ║
║  Next Review: 2026-10-24                                                    ║
║  Regulatory Basis: FRA Egypt + PDPL 2020                                    ║
║  ZERO AUDIT GAPS TOLERATED. Any WORM coverage < 100% = COMPLIANCE ALERT.   ║
╚══════════════════════════════════════════════════════════════════════════════╝
```
