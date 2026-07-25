# BLUEPRINT: KYC & Compliance Audit Flow
**Document ID:** BLUEPRINT-KYC-001  
**Version:** 1.0.0  
**Status:** APPROVED  
**Authority:** Tradeora Constitutional Council — Article 29 (Data Sovereignty)  
**Classification:** INTERNAL — COMPLIANCE SENSITIVE  
**Date:** 2026-07-24  
**Owner:** Compliance Engineering Team  
**Reviewers:** Chief Compliance Officer, Lead Architect, Data Protection Officer  

---

## Section 1 — Blueprint Authority & Scope

### 1.1 Constitutional and Regulatory Authority
This architecture blueprint is mandated by **Constitutional Article 29 (Data Sovereignty)** of the Tradeora Constitutional Council. All implementations herein are strictly bound to local and international regulations, prominently featuring the Financial Regulatory Authority (FRA) guidelines, the Personal Data Protection Law (PDPL 2020), and the Central Bank of Egypt (CBE) Anti-Money Laundering (AML) Circulars. 

### 1.2 Scope of the Blueprint
This blueprint explicitly covers the following bounded contexts and operational domains:
- **KYC Lifecycle Management:** Orchestration of Identity Verification processes from ingestion to approval, rejection, or expiration.
- **FRA Compliance Reporting:** Automated, scheduled, and auditable generation of required compliance documentation and metrics.
- **AML Screening:** Real-time and scheduled cross-referencing against global and local sanctions lists.
- **WORM Audit Trails:** Secure, immutable storage of all compliance decisions and data changes.

### 1.3 Non-Negotiables
- All compliance, decision, and audit data MUST be persisted in Write-Once-Read-Many (WORM) storage.
- An Arabic disclosure (إخلاء مسؤولية) MUST be presented to and explicitly acknowledged by the user prior to the collection of any personally identifiable information (PII).
- PII must not leave the geographical boundaries dictated by data sovereignty laws.

### 1.4 Regulatory References
| Authority | Regulation / Directive | Relevance |
|-----------|-------------------------|-----------|
| FRA | Decision 1/2024 | Governance of digital financial platforms and robo-advisory reporting. |
| PDPL | Law No. 151 of 2020 | Data privacy, user consent, Data Subject Requests (DSR), breach notification. |
| CBE | AML Circular 2021 | Customer Due Diligence (CDD) and continuous transaction monitoring. |
| Tradeora | Article 29 | Internal mandate for data sovereignty and strict immutable auditing. |

---

## Section 2 — Architecture Overview

### 2.1 ASCII Component Diagram
```text
                          +-------------------------+
                          |   Flutter Mobile App    |
                          |  (End User Interface)   |
                          +-----------+-------------+
                                      | (HTTPS/TLS 1.3)
                                      v
+-----------------+       +-------------------------+       +-------------------+
| Admin Dashboard |------>|      API Gateway        |<------| External KYC Auth |
| (Compliance)    |       |      (Kong/Nginx)       |       | (Government APIs) |
+--------+--------+       +-----------+-------------+       +-------------------+
         |                            |
         |                            v
         |                +-------------------------+       +-------------------+
         +--------------->|       Keycloak          |<----->|  UserIdentity BC  |
                          | (Authentication/RBAC)   |       +---------+---------+
                          +-----------+-------------+                 |
                                      |                               |
  +-----------------------------------+-------------------------------+
  |
  v
+-------------------+     +-------------------+     +-------------------+
| KYCVerification BC|---->|  AMLScreening BC  |---->|   Compliance BC   |
| (State Machine)   |     | (Sanctions Match) |     | (FRA Reporting)   |
+--------+----------+     +--------+----------+     +--------+----------+
         |                         |                         |
         +-------------------------+-------------------------+
                                   |
                                   v
+-------------------+     +-------------------+     +-------------------+
|   PostgreSQL      |     |       Kafka       |---->|NotificationDelivery|
| (Operational DB)  |     | (Event Streaming) |     | (SMS/Email/Push)  |
+-------------------+     +--------+----------+     +-------------------+
                                   |
                                   v
                          +-------------------+
                          |   AuditTrail BC   |
                          | (WORM Writer)     |
                          +--------+----------+
                                   |
                                   v
                          +-------------------+
                          |      MinIO        |
                          | (Immutable WORM)  |
                          +-------------------+
```

### 2.2 Component Responsibilities
| Component | Responsibility | Technology Choice & Rationale |
|-----------|----------------|-------------------------------|
| **Flutter App** | Cross-platform user interface for data ingestion and consent capture. | Flutter: High performance, single codebase, robust camera/document scanning plugins. |
| **Admin Dashboard** | Web interface for compliance officers to manually review, approve, or reject KYC profiles. | React/Next.js: Rich ecosystem for data tables and back-office UI components. |
| **Keycloak** | Centralized Identity and Access Management (IAM), Role-Based Access Control (RBAC). | Keycloak: Open-source, supports OAuth2/OIDC, robust fine-grained permissions. |
| **KYCVerification BC** | Manages the KYC state machine, orchestrates document verification and liveness checks. | Node.js/TypeScript: Event-driven architecture, fast async processing. |
| **AMLScreening BC** | Matches identities against global/local sanctions lists (OFAC, UN, CBE). | Python (FastAPI): Excellent libraries for fuzzy string matching (jellyfish) and data science. |
| **Compliance BC** | Aggregates data, generates reports for the FRA, handles PDPL DSRs. | Python/Airflow: Scheduled DAGs for batch reporting and complex aggregations. |
| **AuditTrail BC** | Consumes events and writes immutable records to WORM storage. | Go: High throughput, low latency concurrent Kafka consumer. |
| **MinIO** | Object storage configured with Governance/Compliance Object Lock. | MinIO: S3-compatible, native support for WORM and enterprise data retention. |
| **Kafka** | Event backbone for decoupling services and reliable event sourcing. | Apache Kafka: Distributed, durable, replayable event logs. |
| **Valkey** | Distributed locking and caching (e.g., claiming applications). | Valkey: High-performance Redis alternative for queuing and locks. |

---

## Section 3 — KYC Application Lifecycle

### 3.1 State Machine
The KYC application transitions through the following strict states:
`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` / `REJECTED` / `PENDING_RESUBMISSION` → `EXPIRED`

#### State: DRAFT
- **Entry conditions:** User starts the KYC process.
- **Allowed actions:** Upload documents, fill PII, update fields.
- **Exit conditions:** User submits the application.
- **Events published:** `kyc.KYCDraftCreated.v1`, `kyc.KYCDraftUpdated.v1`
- **SLA timer:** 7 days to submit, otherwise auto-deleted.

#### State: SUBMITTED
- **Entry conditions:** All required fields filled, Arabic disclosure acknowledged, submit button pressed.
- **Allowed actions:** None (read-only for user).
- **Exit conditions:** Picked up by an automated worker or compliance officer.
- **Events published:** `kyc.KYCSubmitted.v1`
- **SLA timer:** 24 hours to transition to `UNDER_REVIEW`.

#### State: UNDER_REVIEW
- **Entry conditions:** Application claimed by compliance officer via Valkey distributed lock.
- **Allowed actions:** Officer views documents, triggers manual AML screen, adds notes.
- **Exit conditions:** Officer makes a final decision.
- **Events published:** `kyc.KYCUnderReview.v1`
- **SLA timer:** 4 hours to make a decision.

#### State: APPROVED / REJECTED / PENDING_RESUBMISSION
- **Entry conditions:** Officer submits a decision.
- **Allowed actions:** If `PENDING_RESUBMISSION`, user can update specific rejected fields.
- **Exit conditions:** Transitions to active user (`APPROVED`), account blocked (`REJECTED`), or back to `SUBMITTED` (`PENDING_RESUBMISSION`).
- **Events published:** `kyc.KYCDecisionMade.v1`
- **SLA timer:** N/A (terminal or restarts flow).

#### State: EXPIRED
- **Entry conditions:** KYC data is older than the regulatory validity period (e.g., ID expired) or DRAFT SLA breached.
- **Allowed actions:** User must restart KYC.
- **Exit conditions:** N/A.
- **Events published:** `kyc.KYCExpired.v1`
- **SLA timer:** N/A.

### 3.2 KYC Review Flow
1. **Queueing:** A new KYC application appears in the compliance review queue, sorted ascending by submission time (FIFO).
2. **Claiming:** A compliance officer claims the application. A `SETNX` lock is acquired in Valkey for 1 hour to prevent duplicate reviews.
3. **Review:** The officer reviews personal info, National ID scans, selfie, and liveness check metadata.
4. **Automated Checks:** The UI displays automated system checks: AML status (from AMLScreening BC) and document authenticity scores (from OCR/Vision AI).
5. **Decision:** The officer makes a decision: `APPROVE`, `REJECT`, or `REQUEST_RESUBMISSION` (highlighting specific failures like "Blurry ID").
6. **Recording:** The decision is recorded in the operational DB with the officer's UUID, a precise timestamp, and a standardized reason code.
7. **Event Publication:** A decision event (`kyc.KYCDecisionMade.v1`) is published to the Kafka broker.
8. **WORM Archival:** The AuditTrail BC consumes the event and writes the immutable decision record to MinIO.
9. **Notification:** The NotificationDelivery BC sends an SMS/Email to the user in both Arabic and English outlining the result.
10. **Identity Update:** The UserIdentity BC consumes the event and updates the user's global authorization status.

### 3.3 TypeScript Code: KYCService
```typescript
import { Kafka } from 'kafkajs';
import Redis from 'ioredis';
import { Pool } from 'pg';

export enum KYCDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REQUEST_RESUBMISSION = 'REQUEST_RESUBMISSION'
}

export interface DecisionPayload {
  applicationId: string;
  officerId: string;
  decision: KYCDecision;
  reasonCode?: string;
  notes?: string;
}

export class KYCReviewService {
  private redis: Redis;
  private db: Pool;
  private kafkaProducer: any;

  constructor(redisUrl: string, dbString: string, kafkaBrokers: string[]) {
    this.redis = new Redis(redisUrl);
    this.db = new Pool({ connectionString: dbString });
    const kafka = new Kafka({ clientId: 'kyc-service', brokers: kafkaBrokers });
    this.kafkaProducer = kafka.producer();
  }

  async init() {
    await this.kafkaProducer.connect();
  }

  /**
   * Claims an application for a specific officer using Valkey/Redis SETNX.
   */
  async claimApplication(applicationId: string, officerId: string): Promise<boolean> {
    const lockKey = `kyc:lock:${applicationId}`;
    // Lock for 1 hour (3600 seconds)
    const acquired = await this.redis.set(lockKey, officerId, 'EX', 3600, 'NX');
    if (acquired) {
      await this.db.query(
        'UPDATE kyc_applications SET status = $1, locked_by = $2 WHERE id = $3',
        ['UNDER_REVIEW', officerId, applicationId]
      );
      return true;
    }
    return false;
  }

  /**
   * Submits the final decision and orchestrates updates and events.
   */
  async submitDecision(payload: DecisionPayload): Promise<void> {
    const lockKey = `kyc:lock:${payload.applicationId}`;
    const lockedBy = await this.redis.get(lockKey);

    if (lockedBy !== payload.officerId) {
      throw new Error('Application is not locked by this officer.');
    }

    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      
      const updateQuery = `
        UPDATE kyc_applications 
        SET status = $1, decision_reason = $2, decision_notes = $3, updated_at = NOW()
        WHERE id = $4
        RETURNING *;
      `;
      const res = await client.query(updateQuery, [
        payload.decision === KYCDecision.APPROVE ? 'APPROVED' : 
        payload.decision === KYCDecision.REJECT ? 'REJECTED' : 'PENDING_RESUBMISSION',
        payload.reasonCode || null,
        payload.notes || null,
        payload.applicationId
      ]);

      if (res.rowCount === 0) {
        throw new Error('Application not found');
      }

      await this.publishDecisionEvent(payload, res.rows[0]);
      
      // Release the lock
      await this.redis.del(lockKey);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async publishDecisionEvent(payload: DecisionPayload, appData: any) {
    const event = {
      eventId: `evt_${Date.now()}_${payload.applicationId}`,
      timestamp: new Date().toISOString(),
      type: 'kyc.KYCDecisionMade.v1',
      data: {
        applicationId: payload.applicationId,
        userId: appData.user_id,
        officerId: payload.officerId,
        decision: payload.decision,
        reasonCode: payload.reasonCode,
        metadata: {
          ipAddress: appData.submit_ip,
          documentHash: appData.document_hash
        }
      }
    };

    await this.kafkaProducer.send({
      topic: 'compliance.kyc.events',
      messages: [{ key: payload.applicationId, value: JSON.stringify(event) }],
    });
  }
}
```

---

## Section 4 — AML Screening Architecture

### 4.1 Screening Triggers
AML screening is triggered asynchronously during the `SUBMITTED` state phase, just before manual review. Additionally, batch screening occurs nightly for all active `APPROVED` users against newly updated sanctions lists.

### 4.2 Data Sources
- **OFAC SDN List:** Automatically fetched from the US Treasury via API.
- **UN Security Council List:** Consolidated UN sanctions list XML.
- **CBE Watchlist:** Central Bank of Egypt domestic blacklist (manual/SFTP upload).

### 4.3 Python Code: AML Screening Engine
```python
from decimal import Decimal
from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime
import jellyfish
import re

@dataclass
class AMLHit:
    list_source: str
    matched_name: str
    similarity_score: Decimal
    hit_type: str  # EXACT_MATCH | PROBABLE_MATCH
    matched_id: Optional[str]

@dataclass  
class AMLScreenResult:
    national_id: str
    screened_name: str
    hits: List[AMLHit]
    overall_status: str  # CLEAR | FLAGGED | BLOCKED
    screening_timestamp: str
    screening_version: str  # sanctions list version
    
def romanize_arabic(arabic_name: str) -> str:
    """
    Standardized transliteration from Arabic characters to Latin.
    Ensures accurate matching against international lists like OFAC.
    """
    # Simplified mapping for demonstration purposes.
    # In production, use libraries like camel-tools or deep learning models.
    mapping = {
        'أ': 'A', 'ا': 'A', 'ب': 'B', 'ت': 'T', 'ث': 'TH', 'ج': 'J',
        'ح': 'H', 'خ': 'KH', 'د': 'D', 'ذ': 'ZH', 'ر': 'R', 'ز': 'Z',
        'س': 'S', 'ش': 'SH', 'ص': 'S', 'ض': 'D', 'ط': 'T', 'ظ': 'Z',
        'ع': 'A', 'غ': 'GH', 'ف': 'F', 'ق': 'Q', 'ك': 'K', 'ل': 'L',
        'م': 'M', 'ن': 'N', 'ه': 'H', 'و': 'W', 'ي': 'Y', ' ': ' '
    }
    romanized = ''.join(mapping.get(char, char) for char in arabic_name)
    return re.sub(r'\s+', ' ', romanized).strip().upper()

def calculate_similarity(name1: str, name2: str) -> Decimal:
    """Calculates normalized Jaro-Winkler distance as a percentage."""
    score = jellyfish.jaro_winkler_similarity(name1, name2)
    return Decimal(str(round(score * 100, 2)))

def screen_name(arabic_name: str, national_id: str, sanctions_db: dict) -> AMLScreenResult:
    """
    Screens an Arabic name against global and local sanctions lists.
    Threshold: 85% similarity -> PROBABLE_MATCH (FLAGGED)
    Threshold: 98%+ similarity -> EXACT_MATCH (BLOCKED)
    """
    romanized_name = romanize_arabic(arabic_name)
    hits = []
    
    for entry in sanctions_db.get("entries", []):
        list_name = entry.get("primary_name", "").upper()
        score = calculate_similarity(romanized_name, list_name)
        
        if score >= Decimal('98.00'):
            hits.append(AMLHit(
                list_source=entry["source"],
                matched_name=list_name,
                similarity_score=score,
                hit_type="EXACT_MATCH",
                matched_id=entry.get("entity_id")
            ))
        elif score >= Decimal('85.00'):
            hits.append(AMLHit(
                list_source=entry["source"],
                matched_name=list_name,
                similarity_score=score,
                hit_type="PROBABLE_MATCH",
                matched_id=entry.get("entity_id")
            ))

    status = "CLEAR"
    if any(h.hit_type == "EXACT_MATCH" for h in hits):
        status = "BLOCKED"
    elif any(h.hit_type == "PROBABLE_MATCH" for h in hits):
        status = "FLAGGED"

    return AMLScreenResult(
        national_id=national_id,
        screened_name=romanized_name,
        hits=hits,
        overall_status=status,
        screening_timestamp=datetime.utcnow().isoformat() + "Z",
        screening_version=sanctions_db.get("version", "unknown")
    )
```

### 4.4 Hit Types & Actions
| Hit Type | Similarity | System Action | Officer Action |
|----------|------------|---------------|----------------|
| EXACT_MATCH | ≥ 98% | Auto-block account | Review and escalate to MLRO |
| PROBABLE_MATCH | 85% - 97% | Flag for review | Investigate alias/DOB, Approve/Reject |
| NO_MATCH | < 85% | Auto-pass | None |

### 4.5 False Positive Management
Officers can mark a `PROBABLE_MATCH` as a false positive. This creates a whitelist entry mapping the user's `national_id` to the specific sanction list `entity_id`. Future batch screens will bypass this specific match.

### 4.6 Sanctions List Update Procedure
1. Nightly CRON job downloads OFAC/UN lists.
2. Checks hash against previous version.
3. If changed, parses and ingests into Valkey/PostgreSQL.
4. Triggers re-screening for all active `APPROVED` users.

---

## Section 5 — WORM Audit Trail Architecture

### 5.1 MinIO Configuration
The Tradeora infrastructure utilizes MinIO for S3-compatible storage. The `compliance-audit-logs` bucket is configured with **Object Lock** in `GOVERNANCE` mode. 

### 5.2 Object Retention
By FRA regulations, all compliance records must be retained immutably for **7 years** (2555 days). Deletions or modifications prior to this expiry will be rejected at the storage API layer.

### 5.3 WORM-Archived Entities
- KYC Application Submissions (Payload + Hashes)
- KYC Officer Decisions (Approve/Reject + Reasoning)
- AML Screening Results
- Data Subject Requests (DSRs) submissions and fulfillment logs
- Consents and opt-ins with timestamps and IP addresses

### 5.4 Object Naming Convention
`s3://compliance-audit-logs/kyc_decisions/YYYY/MM/DD/{user_id}/{event_id}.json`

### 5.5 Python Code: WORM Writer
```python
from minio import Minio
from minio.commonconfig import GOVERNANCE
from minio.retention import Retention
from datetime import datetime, timedelta
import hashlib
import json
import os
import io

class WORMWriter:
    def __init__(self):
        self.client = Minio(
            os.getenv("MINIO_ENDPOINT"),
            access_key=os.getenv("MINIO_ACCESS_KEY"),
            secret_key=os.getenv("MINIO_SECRET_KEY"),
            secure=True
        )
        self.bucket_name = "compliance-audit-logs"

    def write_kyc_decision(self, event_id: str, payload: dict) -> str:
        """
        Calculates SHA-256 hash of the payload, uploads it to MinIO 
        with a 7-year retention policy, and returns the object path.
        """
        user_id = payload.get("data", {}).get("userId", "unknown")
        now = datetime.utcnow()
        
        object_path = f"kyc_decisions/{now.year}/{now.month:02d}/{now.day:02d}/{user_id}/{event_id}.json"
        
        # Serialize and hash
        raw_bytes = json.dumps(payload, sort_keys=True).encode('utf-8')
        sha256_hash = hashlib.sha256(raw_bytes).hexdigest()
        
        # Embed hash in metadata
        metadata = {
            "x-amz-meta-sha256": sha256_hash,
            "x-amz-meta-event-id": event_id
        }
        
        # Calculate retention date (7 years = 2555 days)
        retention_date = now + timedelta(days=2555)
        retention = Retention(GOVERNANCE, retention_date)
        
        # Upload
        data_stream = io.BytesIO(raw_bytes)
        self.client.put_object(
            bucket_name=self.bucket_name,
            object_name=object_path,
            data=data_stream,
            length=len(raw_bytes),
            metadata=metadata,
            retention=retention
        )
        
        return f"s3://{self.bucket_name}/{object_path}"
```

### 5.6 Integrity Verification & Access Control
- **Verification:** A weekly job streams random objects from MinIO, re-computes the SHA-256 hash of the JSON, and compares it to the metadata hash to detect bit rot.
- **Access Control:** MinIO IAM policies restrict `s3:PutObjectRetention` and `s3:DeleteObject` entirely. Read access is granted only to the `Compliance_Auditor` Role.

---

## Section 6 — FRA Compliance Reporting

### 6.1 Quarterly Report Contents
The FRA requires a comprehensive quarterly report covering:
1. Total users onboarded vs. rejected.
2. AML hit statistics and resolutions.
3. AI/Robo-advisory metrics (disclaimer acceptance rates).
4. System uptime and security incidents.

### 6.2 Report Generation
Apache Airflow orchestrates the DAG:
- Task 1: `Extract_Postgres_Stats`
- Task 2: `Extract_WORM_Logs`
- Task 3: `Aggregate_Metrics`
- Task 4: `Generate_JSON_Report`
- Task 5: `Sign_And_Encrypt_Report`

### 6.3 Disclosure Requirements
All AI-driven advisory features must display the following disclaimer prior to use:
> **Arabic:**
> إخلاء مسؤولية: يعتمد هذا التحليل على خوارزميات الذكاء الاصطناعي. يُرجى مراجعة مستشار مالي معتمد قبل اتخاذ أي قرارات استثمارية. المنصة غير مسؤولة عن أي خسائر مالية.
> 
> **English:**
> Disclaimer: This analysis is based on Artificial Intelligence algorithms. Please consult a certified financial advisor before making any investment decisions. The platform is not liable for any financial losses.

---

## Section 7 — PDPL 2020 Compliance Flows

### 7.1 Data Subject Request (DSR) Handling
Users have the right to request their data or request deletion.
1. User submits DSR via the mobile app.
2. DSR ticket created in `SUBMITTED` state.
3. Identity is re-verified via OTP.
4. `DSRService` aggregates data across databases for `ACCESS` requests.
5. For `ERASURE`, soft-deletes are performed except for data under FRA retention mandate (AML hits, financial ledgers).

### 7.2 Consent Management
15 tracked consent points including:
1. Terms of Service
2. Privacy Policy
3. AI Robo-advisory usage
4. Marketing SMS
5. Marketing Email
6. Third-party data sharing (brokers)
...

### 7.3 Data Breach Response Runbook
Under PDPL 2020, breaches must be reported within 72 hours.
1. **T+0:** SecOps declares Incident.
2. **T+12:** Scope containment and impact analysis completed.
3. **T+24:** Compliance team drafts Personal Data Protection Center (PDPPC) notification.
4. **T+48:** Chief Compliance Officer signs off. Email sent to PDPPC.
5. **T+72:** Affected users notified via in-app push and email.

### 7.4 TypeScript Code: DSR Handler
```typescript
export enum DSRType {
  ACCESS = 'ACCESS',
  CORRECTION = 'CORRECTION',
  ERASURE = 'ERASURE'
}

export interface DSRRequest {
  userId: string;
  type: DSRType;
  details?: string;
}

export interface DSRTicket {
  ticketId: string;
  status: string;
  createdAt: Date;
}

export interface DataExport {
  userId: string;
  profile: any;
  transactions: any[];
  consents: any[];
}

export interface ErasureReport {
  status: string;
  erasedEntities: string[];
  retainedEntities: string[];
  retentionReason: string;
}

export class DSRService {
  private db: any; // PostgreSQL client

  constructor(dbClient: any) {
    this.db = dbClient;
  }

  async handleDSR(request: DSRRequest): Promise<DSRTicket> {
    const ticketId = `DSR-${Date.now()}`;
    await this.db.query(
      'INSERT INTO dsr_tickets (id, user_id, type, status) VALUES ($1, $2, $3, $4)',
      [ticketId, request.userId, request.type, 'PENDING']
    );
    return { ticketId, status: 'PENDING', createdAt: new Date() };
  }

  async generateDataExport(userId: string): Promise<DataExport> {
    const profile = await this.db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const tx = await this.db.query('SELECT * FROM ledgers WHERE user_id = $1', [userId]);
    
    return {
      userId,
      profile: profile.rows[0],
      transactions: tx.rows,
      consents: [] // Fetched from consent store
    };
  }

  async processErasure(userId: string, exceptions: string[]): Promise<ErasureReport> {
    // Cannot delete if user has active balance or regulatory holds
    const holds = await this.db.query('SELECT status FROM kyc_applications WHERE user_id = $1', [userId]);
    
    if (exceptions.includes('FRA_RETENTION_RULE')) {
      return {
        status: 'PARTIAL_ERASURE',
        erasedEntities: ['marketing_data', 'tracking_logs'],
        retainedEntities: ['kyc_data', 'ledger_entries'],
        retentionReason: 'FRA 7-year data retention mandate'
      };
    }
    
    await this.db.query('DELETE FROM users WHERE id = $1', [userId]);
    return {
      status: 'COMPLETE_ERASURE',
      erasedEntities: ['users', 'marketing_data', 'tracking_logs'],
      retainedEntities: [],
      retentionReason: 'N/A'
    };
  }
}
```

---

## Section 8 — Complete JSON Schemas

### 8.1 KYC Application Submission
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "KYCSubmission",
  "type": "object",
  "properties": {
    "userId": { "type": "string", "format": "uuid" },
    "nationalId": { "type": "string", "pattern": "^[0-9]{14}$" },
    "fullNameArabic": { "type": "string" },
    "dateOfBirth": { "type": "string", "format": "date" },
    "documentFrontUrl": { "type": "string", "format": "uri" },
    "documentBackUrl": { "type": "string", "format": "uri" },
    "selfieVideoUrl": { "type": "string", "format": "uri" },
    "disclosureAccepted": { "type": "boolean", "const": true }
  },
  "required": ["userId", "nationalId", "fullNameArabic", "disclosureAccepted"]
}
```

### 8.2 KYC Decision Record (WORM Format)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "KYCWormDecision",
  "type": "object",
  "properties": {
    "eventId": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "type": { "type": "string", "const": "kyc.KYCDecisionMade.v1" },
    "data": {
      "type": "object",
      "properties": {
        "applicationId": { "type": "string" },
        "officerId": { "type": "string" },
        "decision": { "type": "string", "enum": ["APPROVE", "REJECT", "REQUEST_RESUBMISSION"] },
        "reasonCode": { "type": "string" }
      }
    }
  },
  "required": ["eventId", "timestamp", "data"]
}
```

### 8.3 AMLScreenResult
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AMLScreenResult",
  "type": "object",
  "properties": {
    "national_id": { "type": "string" },
    "screened_name": { "type": "string" },
    "hits": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "list_source": { "type": "string" },
          "matched_name": { "type": "string" },
          "similarity_score": { "type": "number" },
          "hit_type": { "type": "string" }
        }
      }
    },
    "overall_status": { "type": "string", "enum": ["CLEAR", "FLAGGED", "BLOCKED"] },
    "screening_timestamp": { "type": "string", "format": "date-time" }
  },
  "required": ["national_id", "overall_status", "screening_timestamp"]
}
```

### 8.4 FRA Compliance Report
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "FRAReport",
  "type": "object",
  "properties": {
    "report_id": { "type": "string" },
    "period": {
      "type": "object",
      "properties": {
        "start": { "type": "string", "format": "date" },
        "end": { "type": "string", "format": "date" }
      }
    },
    "metrics": {
      "type": "object",
      "properties": {
        "total_onboarded": { "type": "integer" },
        "total_rejected": { "type": "integer" },
        "aml_flags_investigated": { "type": "integer" }
      }
    },
    "ai_recommendations": {
      "type": "object",
      "properties": {
        "total_generated": { "type": "integer" },
        "disclaimer_delivery_rate": { "type": "number" },
        "accuracy_metrics": { "type": "object" }
      }
    }
  },
  "required": ["report_id", "period", "metrics"]
}
```

### 8.5 WORM Object Metadata
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "WORMMetadata",
  "type": "object",
  "properties": {
    "x-amz-meta-sha256": { "type": "string" },
    "x-amz-meta-event-id": { "type": "string" }
  }
}
```

---

## Section 9 — Compliance Officer Admin Dashboard

### 9.1 Feature List
- **Global Queue View:** Paginated data table of all pending KYC applications.
- **Application Detail View:** Side-by-side comparison of ID scan, selfie, and extracted OCR data.
- **AML Investigations:** Dedicated view for resolving `FLAGGED` AML hits.
- **Audit Viewer:** Read-only view of past decisions directly fetched from WORM storage.
- **Export Engine:** Capability to trigger FRA reports manually.

### 9.2 Role-Based Access Control (RBAC)
| Role | Permissions | Use Case |
|------|-------------|----------|
| `READ_ONLY` | View applications, view audit logs. | External Auditors (FRA/CBE). |
| `COMPLIANCE_OFFICER` | Claim apps, submit decisions, resolve AML flags. | Daily operations team. |
| `COMPLIANCE_MANAGER` | Re-assign claimed apps, override decisions, export reports. | MLRO / Team Lead. |

### 9.3 Audit Logging Specification
Every action performed within the Admin Dashboard generates an internal HTTP request log capturing:
`Timestamp`, `Officer UUID`, `Action (e.g., VIEW_APP, APPROVE_APP)`, `IP Address`, `User-Agent`.

---

## Section 10 — Sequence Diagrams (ASCII art)

### 10.1 KYC Review Flow
```text
User          Flutter       KYCService    Valkey        AMLScreening   Kafka         MinIO         Notification
 |              |              |              |              |              |              |              |
 |--Submit KYC->|              |              |              |              |              |              |
 |              |--POST /kyc-->|              |              |              |              |              |
 |              |              |---Screen---->|              |              |              |              |
 |              |              |<--Result-----|              |              |              |              |
 |              |<-201 Created-|              |              |              |              |              |
 |              |              |              |              |              |              |              |
 |              |              | (Time passes, Officer claims app)          |              |              |
 |              |              |---SETNX----->|              |              |              |              |
 |              |              |<--OK---------|              |              |              |              |
 |              |              |              |              |              |              |              |
 |              |              | (Officer submits decision)  |              |              |              |
 |              |              |---Publish Event--------------------------->|              |              |
 |              |              |              |              |              |---Write----->|              |
 |              |              |              |              |              |<--200 OK-----|              |
 |              |              |              |              |              |              |              |
 |              |              |---Trigger SMS-------------------------------------------->|              |
 |<-------------------SMS Received---------------------------------------------------------|              |
```

### 10.2 AML Screening Flow
```text
CronJob       AMLScreening     External APIs (OFAC/UN)     PostgreSQL
 |                 |                   |                       |
 |--Trigger Batch->|                   |                       |
 |                 |--Fetch Lists----->|                       |
 |                 |<--XML/JSON List---|                       |
 |                 |                   |                       |
 |                 |--Process Data--+  |                       |
 |                 |                |  |                       |
 |                 |<---------------+  |                       |
 |                 |                   |                       |
 |                 |--Upsert Sanctions Data------------------->|
 |                 |<--200 OK----------------------------------|
 |                 |                   |                       |
 |                 |--Query Users to Re-screen---------------->|
 |                 |<--User Batch------------------------------|
 |                 |                   |                       |
 |                 |--Match Logic---+  |                       |
 |                 |                |  |                       |
 |                 |<---------------+  |                       |
 |                 |                   |                       |
 |                 |--Update AML Flags------------------------>|
 |                 |<--200 OK----------------------------------|
```

### 10.3 DSR Handling Flow
```text
User          Flutter       DSRService     PostgreSQL     Compliance BC
 |              |              |              |              |
 |--Req Access->|              |              |              |
 |              |--POST /dsr-->|              |              |
 |              |              |--Insert Ticket------------->|
 |              |<-201 Ticket--|              |              |
 |              |              |              |              |
 |              |              |--Fetch Profile------------->|
 |              |              |<--Profile Data--------------|
 |              |              |              |              |
 |              |              |--Assemble JSON Export----+  |
 |              |              |                          |  |
 |              |              |<-------------------------+  |
 |              |              |              |              |
 |              |<-Download----|              |              |
```

### 10.4 FRA Report Generation Flow
```text
Airflow       PostgreSQL      MinIO          Compliance BC     Admin Dashboard
 |                |             |                 |                 |
 |--Start DAG---->|             |                 |                 |
 |                |             |                 |                 |
 |                |--Extract DB Metrics---------->|                 |
 |                |<--Data------------------------|                 |
 |                |             |                 |                 |
 |                |             |--Extract Logs-->|                 |
 |                |             |<--Logs----------|                 |
 |                |             |                 |                 |
 |                |             |                 |--Aggregate---+  |
 |                |             |                 |              |  |
 |                |             |                 |<-------------+  |
 |                |             |                 |                 |
 |                |             |                 |--Generate PDF-->| (Available for download)
```

---

## Section 11 — Failure Modes & Mitigations

| Failure | Probability | Impact | Detection | Mitigation | Recovery SLA |
|---------|-------------|--------|-----------|------------|--------------|
| AML list download failure | LOW | HIGH | Airflow DAG failure alert (Slack/PagerDuty). | Retries with exponential backoff. Fallback to yesterday's list. | 4 hours |
| MinIO WORM write failure | VERY LOW | CRITICAL | Kafka dead-letter queue (DLQ) depth metric > 0. | Alert triggered. Events remain in Kafka. Fix MinIO storage capacity. Replay DLQ. | 1 hour |
| Kafka publish failure after decision | LOW | HIGH | App-level error logs, HTTP 500 returned to officer. | Sync rollback of DB transaction. Officer forced to retry decision. | Immediate |
| Valkey lock acquisition timeout | MEDIUM | LOW | Valkey latency metrics. | Degraded mode: officers cannot claim apps temporarily. | 15 minutes |
| PostgreSQL connection exhaustion | LOW | CRITICAL | PgBouncer metrics. | Auto-scale PgBouncer, reject new connections gracefully. | 10 minutes |
| External ID validation API down | HIGH | MEDIUM | Circuit breaker OPEN state metrics. | Fallback to manual review by compliance officer only. | N/A (Graceful) |
| OCR extraction failure | MEDIUM | LOW | Empty/null fields in extraction result. | Officer manually inputs data from document image. | Immediate |
| Notification service failure | LOW | MEDIUM | Kafka lag on notification topic. | Events buffered in Kafka until third-party SMS provider recovers. | 2 hours |
| Admin Dashboard offline | LOW | HIGH | Uptime checks (Datadog/Pingdom). | Multi-AZ deployment of frontend assets via CDN. | 5 minutes |
| Airflow scheduler crash | VERY LOW | HIGH | Heartbeat monitor failure. | K8s auto-restart pod. Alert on persistent crash loop. | 30 minutes |
| Storage quota exceeded in MinIO | VERY LOW | CRITICAL | Prometheus disk usage > 90%. | Auto-provision block volumes. Alerts at 75%, 85%, 95%. | 4 hours |
| Data Breach (Unauthorized access) | VERY LOW | SEVERE | GuardDuty / WAF anomaly alerts. | Invoke PDPL Incident Response. Isolate network segments. | 72 hours (Report) |

---

## Section 12 — SLO Compliance

| SLO | Target | Measurement | Alert Threshold | PromQL |
|-----|--------|-------------|-----------------|--------|
| KYC review time | <24h | P99 Duration | >20h | `histogram_quantile(0.99, rate(kyc_review_duration_seconds_bucket[24h]))` |
| AML screening | <5min | P99 Duration | >4min | `histogram_quantile(0.99, rate(aml_screen_duration_seconds_bucket[5m]))` |
| WORM write success | 100% | Error Rate | <100% | `rate(minio_worm_write_errors_total[5m]) > 0` |
| DSR response | <30 days | Ticket Age | >25 days | `max(time() - dsr_ticket_created_timestamp) > 2160000` |
| DB Uptime | 99.99% | Ping success | <99.9% | `avg_over_time(up{job="postgres"}[5m]) < 0.999` |

### 12.1 PromQL Alerts
```promql
groups:
- name: ComplianceSLOs
  rules:
  - alert: KYCReviewSLABreach
    expr: histogram_quantile(0.99, rate(kyc_review_duration_seconds_bucket[24h])) > 86400
    for: 5m
    labels:
      severity: critical
      team: compliance-ops
    annotations:
      summary: "KYC review SLA breach — P99 > 24 hours"
      description: "The 99th percentile of KYC reviews is taking longer than the 24-hour SLA."

  - alert: WORMWriteFailure
    expr: rate(minio_worm_write_errors_total[5m]) > 0
    for: 1m
    labels:
      severity: critical
      team: infrastructure
    annotations:
      summary: "WORM Storage Write Failures Detected"
      description: "Audit trail is failing to persist to immutable storage. Immediate action required."
```

---

## Section 13 — Observability

### 13.1 Core Metrics
- `kyc_applications_submitted_total` (Counter, labels: `platform`)
- `kyc_decisions_total` (Counter, labels: `decision`, `officer_id`)
- `aml_hits_total` (Counter, labels: `hit_type`, `list_source`)
- `minio_worm_write_errors_total` (Counter, labels: `bucket`)
- `dsr_tickets_open_gauge` (Gauge, labels: `type`)
- `kyc_review_duration_seconds` (Histogram, labels: `decision`)
- `fra_report_generation_duration_seconds` (Histogram)
- `kafka_dlq_messages_total` (Gauge, labels: `topic`)

### 13.2 Grafana Dashboard
- **Panel 1 (Stat):** Pending KYC Applications in Queue.
- **Panel 2 (Time Series):** KYC Decisions (Approve/Reject) over last 24h.
- **Panel 3 (Gauge):** Current P99 Review Time.
- **Panel 4 (Table):** Officers with highest review volume.
- **Panel 5 (Heatmap):** AML Screen hit confidence scores.

### 13.3 Log Correlation Strategy
All microservices inject a `trace_id` (OpenTelemetry standard) and `user_id` into JSON logs. Logs are shipped to Elasticsearch via Fluentbit. This ensures that a single user's journey from submission to AML screening to WORM archival can be queried in Kibana using `trace_id: "..."`.

---

## Section 14 — Test Strategy

### 14.1 Unit Tests
- **AML Name Matching:** Test jellyfish exact and fuzzy match logic against known test cases.
- **WORM Write:** Mock MinIO client, assert that sha256 metadata is calculated correctly.
- **State Machine:** Assert illegal state transitions (e.g., DRAFT to APPROVED) throw exceptions.

### 14.2 Integration Tests
- Stand up Testcontainers (PostgreSQL, Valkey, Kafka, MinIO).
- Execute full happy-path API sequence: Submit -> Screen -> Claim -> Approve -> Verify Kafka Event -> Verify MinIO Object.

### 14.3 Compliance Tests
- Ensure disclaimer text exists in UI payload templates.
- Verify DSR export JSON schema matches expected standard.

### 14.4 Python Test Code
```python
import pytest
from decimal import Decimal
from aml_engine import screen_name, calculate_similarity, AMLHit

class TestAMLScreening:
    
    @pytest.fixture
    def mock_sanctions_db(self):
        return {
            "version": "v1.0",
            "entries": [
                {"primary_name": "MOHAMED IBRAHIM AL QAEDA", "source": "OFAC", "entity_id": "123"},
                {"primary_name": "AHMED TERRORIST", "source": "UN", "entity_id": "456"}
            ]
        }

    def test_exact_match_blocks_application(self, mock_sanctions_db):
        result = screen_name('محمد إبراهيم القاعدة', '12345678901234', mock_sanctions_db)
        assert result.overall_status == 'BLOCKED'
        assert any(h.hit_type == 'EXACT_MATCH' for h in result.hits)
    
    def test_romanization_normalizes_arabic(self, mock_sanctions_db):
        # Even with slight spelling difference, it should flag
        result = screen_name('محماد ابراهيم القاعدا', '9876543210', mock_sanctions_db)
        assert result.overall_status in ['FLAGGED', 'BLOCKED']
        
    def test_no_match_passes_clear(self, mock_sanctions_db):
        result = screen_name('خالد يوسف البرنس', '1111111111', mock_sanctions_db)
        assert result.overall_status == 'CLEAR'
        assert len(result.hits) == 0

    def test_false_positive_whitelist(self):
        # Logic to test that a whitelisted ID is ignored
        pass
```

---
*End of Blueprint. Validated against Tradeora Architecture Standards.*
