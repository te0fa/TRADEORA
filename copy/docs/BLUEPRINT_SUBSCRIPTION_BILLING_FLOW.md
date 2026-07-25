# BLUEPRINT: Subscription & Billing Flow
**Document ID:** BLUEPRINT-SUB-001  
**Version:** 1.0.0  
**Status:** APPROVED  
**Authority:** Tradeora Constitutional Council — Article 29 (Free Tier Perpetuity Mandate)  
**Classification:** INTERNAL — FINANCIAL SENSITIVE  
**Date:** 2026-07-24  
**Owner:** Payments Engineering Team  
**Reviewers:** CFO, Lead Architect, Head of Product  

---

## Section 1 — Blueprint Authority & Scope

This blueprint defines the end-to-end architecture, user experience, and technical implementation of the Tradeora Financial Operating System's subscription and billing lifecycle. The authority for this document stems directly from the Tradeora Constitutional Council.

**Constitutional Mandate:**
- **Article 29: FREE tier must ALWAYS exist — non-negotiable.** Tradeora is committed to democratizing access to financial tools. Under no circumstances shall the platform become paywall-only. The Free tier (مجاني) will remain a permanent fixture, providing essential portfolio management capabilities to all Egyptian citizens regardless of their ability to pay.

**Subscription Tiers Overview:**
The platform offers a tiered subscription model designed to scale with the user's wealth management needs, ranging from a completely free tier to an enterprise-grade Institutional tier.

**Phased Rollout:**
- **Phase 1 (Current):** Focus strictly on Egyptian payment methods to capture the local market. Integrated providers include Fawry, Meeza, and direct bank transfers (InstaPay compatible).
- **Phase 2+ (Future):** Global payment methods (Stripe, PayPal, Apple Pay, Google Pay) to support international expansion and expatriate Egyptians.

**Regulatory Compliance:**
All billing flows are designed to strictly adhere to Central Bank of Egypt (CBE) payment regulations, including local data residency for payment transactions, EGP base currency requirements, and mandatory VAT application (14%).

**Out of Scope:**
This blueprint exclusively covers platform subscription fees. Payments related to investment execution, brokerage fees, clearing house fees, and margin interest are explicitly out of scope and are handled by the separate `BrokerageExecution` Bounded Context.

---

## Section 2 — Subscription Tier Architecture

The subscription model is structured into four distinct tiers. Prices are subject to a 20% discount when billed annually.

### Full Tier Table

| Feature | Free (مجاني) | Premium (99 EGP/mo) | Wealth (499 EGP/mo) | Institutional (Custom) |
|---|---|---|---|---|
| Portfolios | 1 | 5 | 20 | Unlimited |
| AI Recommendations/day | 10 | 100 | Unlimited | Unlimited |
| Price Alerts | 5 | 25 | 100 | Unlimited |
| Historical data | 1 year | 5 years | 10 years | Full |
| Priority support | ❌ | Email | Chat | Dedicated |
| API Access | ❌ | ❌ | Rate limited | Full |
| Real-time data | Delayed 15min | Real-time | Real-time | Real-time |
| Custom reports | ❌ | ❌ | ✅ | ✅ |
| White-label | ❌ | ❌ | ❌ | ✅ |

### Tier Details

#### 1. Free Tier
- **Arabic Name:** مجاني (Magany)
- **Annual Pricing:** 0 EGP
- **Feature Flags Enabled:**
  - `feature_ai_recommendations` (limit: 10)
  - `feature_price_alerts` (limit: 5)
- **Target User Segment:** Students, beginners, casual investors.
- **Support SLA:** Community support only.

#### 2. Premium Tier
- **Arabic Name:** بريميوم (Premium)
- **Annual Pricing:** 950.40 EGP (20% discount applied to 1,188 EGP base)
- **Feature Flags Enabled:**
  - `feature_ai_recommendations` (limit: 100)
  - `feature_realtime_data` (ON)
  - `feature_price_alerts` (limit: 25)
- **Target User Segment:** Active retail traders.
- **Support SLA:** 24-hour email response.

#### 3. Wealth Tier
- **Arabic Name:** ثروة (Tharwa)
- **Annual Pricing:** 4,790.40 EGP (20% discount applied to 5,988 EGP base)
- **Feature Flags Enabled:**
  - `feature_ai_recommendations` (Unlimited)
  - `feature_realtime_data` (ON)
  - `feature_api_access` (Rate limited)
  - `feature_custom_reports` (ON)
  - `feature_price_alerts` (limit: 100)
- **Target User Segment:** High Net Worth Individuals (HNWI), professional day traders.
- **Support SLA:** 1-hour chat response.

#### 4. Institutional Tier
- **Arabic Name:** مؤسسي (Mo'asasy)
- **Annual Pricing:** Custom quoting based on AUM and volume.
- **Feature Flags Enabled:**
  - `feature_ai_recommendations` (Unlimited)
  - `feature_realtime_data` (ON)
  - `feature_api_access` (Full)
  - `feature_custom_reports` (ON)
  - `feature_white_label` (ON)
  - `feature_price_alerts` (Unlimited)
- **Target User Segment:** Family offices, boutique wealth managers.
- **Support SLA:** 15-minute dedicated account manager response.

### VAT Calculation Implementation

All Egyptian transactions require a 14% VAT calculation. This must be calculated securely using `decimal` to avoid floating-point inaccuracies.

```python
from decimal import Decimal, ROUND_HALF_UP

VAT_RATE = Decimal('0.14')  # 14% Egypt VAT

def calculate_subscription_total(base_price: Decimal) -> dict:
    """
    Calculates the total subscription cost including Egyptian VAT.
    Uses ROUND_HALF_UP for compliant financial rounding.
    """
    vat_amount = (base_price * VAT_RATE).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    total = base_price + vat_amount
    
    return {
        'base_price': str(base_price),
        'vat_amount': str(vat_amount),
        'vat_rate': '14%',
        'total': str(total),
        'currency': 'EGP'
    }

# Examples:
# Premium: base=99.00, vat=13.86, total=112.86 EGP
# Wealth: base=499.00, vat=69.86, total=568.86 EGP
```

---

## Section 3 — Subscription Upgrade Flow (Step by Step)

The following sequence details the full end-to-end upgrade process, ensuring robust state management, idempotent payment handling, and real-time UI updates.

### 18-Step Upgrade Process

1. **Plan Retrieval:** User taps 'Upgrade to Premium'. The Flutter app sends a `GET /subscriptions/plans` request to the API gateway.
2. **UI Render:** The mobile app renders the plan comparison screen, highlighting the user's current tier and available upgrade paths.
3. **Selection:** User selects a target plan and a payment method (e.g., Fawry).
4. **Order Creation:** App sends `POST /subscriptions/upgrade`. Backend creates a `SubscriptionOrder` record in the database with status `PENDING`.
5. **Payment Initiation:** Backend calls `POST /payments/initiate` to the Fawry API, passing the `SubscriptionOrder` ID as the merchant reference.
6. **User Redirect:** Fawry API returns a payment URL and a reference number. Backend forwards this to the app, which redirects the user to the Fawry payment page or displays the Fawry USSD reference code.
7. **Payment Execution:** User completes the payment either via the web interface or at a physical Fawry kiosk.
8. **Webhook Trigger:** Fawry's system sends an asynchronous webhook callback to the Tradeora endpoint `POST /webhooks/fawry`.
9. **Signature Verification:** Backend verifies the HMAC-SHA256 signature in the webhook payload to ensure authenticity.
10. **Status Confirmation:** Backend parses the webhook to confirm the payment status is `PAID`.
11. **Order Fulfillment:** The `SubscriptionOrder` status is updated to `ACTIVE` in the Postgres database.
12. **Event Sourcing:** A `SubscriptionUpgraded` domain event is published to the Kafka topic `platform.subscriptions.events`.
13. **Entitlement Update:** The Subscription Service listens to the Kafka event and updates the user's feature flags via the Unleash Admin API.
14. **Cache Invalidation:** The Subscription Service invalidates the Valkey (Redis) cache key `user:entitlements:{userId}` to force a fresh fetch on the next request.
15. **Receipt Generation:** A compliant Arabic PDF receipt (Egyptian e-invoicing format) is dynamically generated.
16. **Document Storage:** The generated receipt is uploaded to MinIO in the `receipts` bucket.
17. **Notification:** The user receives an email with the receipt attached and a push notification stating "تم الترقية بنجاح!" (Upgrade Successful!).
18. **UI Refresh:** The Flutter app, observing a WebSocket event or reacting to the push notification, re-fetches entitlements and unlocks the enhanced dashboard features.

### TypeScript Subscription Service Implementation

```typescript
import { Decimal } from 'decimal.js';
import { KafkaProducer } from './infrastructure/kafka';
import { UnleashClient } from './infrastructure/unleash';
import { ValkeyClient } from './infrastructure/valkey';
import { MinioClient } from './infrastructure/minio';
import { FawryClient } from './infrastructure/fawry';
import { NotificationService } from './services/notifications';

export enum SubscriptionTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM', 
  WEALTH = 'WEALTH',
  INSTITUTIONAL = 'INSTITUTIONAL'
}

export interface SubscriptionUpgradeRequest {
  userId: string;
  fromTier: SubscriptionTier;
  toTier: SubscriptionTier;
  paymentMethod: 'FAWRY' | 'MEEZA' | 'BANK_TRANSFER';
  billingCycle: 'MONTHLY' | 'ANNUAL';
}

export interface SubscriptionOrder {
  orderId: string;
  userId: string;
  targetTier: SubscriptionTier;
  amount: Decimal;
  status: 'PENDING' | 'ACTIVE' | 'FAILED';
  createdAt: Date;
}

export class SubscriptionService {
  constructor(
    private db: DatabaseRepository,
    private fawry: FawryClient,
    private kafka: KafkaProducer,
    private unleash: UnleashClient,
    private valkey: ValkeyClient,
    private minio: MinioClient,
    private notifications: NotificationService
  ) {}

  async initiateUpgrade(request: SubscriptionUpgradeRequest): Promise<SubscriptionOrder> {
    const amount = this.calculatePrice(request.toTier, request.billingCycle);
    
    // Create PENDING order
    const order = await this.db.createSubscriptionOrder({
      userId: request.userId,
      targetTier: request.toTier,
      amount,
      status: 'PENDING',
      createdAt: new Date()
    });

    return order;
  }

  async handlePaymentConfirmation(orderId: string, paymentRef: string): Promise<void> {
    const order = await this.db.getOrderById(orderId);
    if (!order || order.status !== 'PENDING') return; // Idempotency check

    await this.db.transaction(async (tx) => {
      await tx.updateOrderStatus(orderId, 'ACTIVE');
      await tx.updateUserTier(order.userId, order.targetTier);
    });

    await this.kafka.publish('platform.subscriptions.events', {
      eventType: 'SubscriptionUpgraded',
      userId: order.userId,
      newTier: order.targetTier,
      timestamp: new Date().toISOString()
    });
  }

  async updateFeatureFlags(userId: string, tier: SubscriptionTier): Promise<void> {
    const flags = this.getTierFlags(tier);
    for (const flag of flags) {
      await this.unleash.setUserConstraint(flag.name, userId, flag.value);
    }
    await this.valkey.del(`user:entitlements:${userId}`);
  }

  async generateReceipt(orderId: string): Promise<string> {
    const order = await this.db.getOrderById(orderId);
    const pdfBuffer = await this.createArabicPdfReceipt(order);
    const objectName = `receipts/${order.userId}/${orderId}.pdf`;
    
    await this.minio.putObject('receipts-bucket', objectName, pdfBuffer);
    
    await this.notifications.sendPush(order.userId, 'تم الترقية بنجاح!', 'استمتع بمميزات حسابك الجديد');
    
    return await this.minio.presignedGetObject('receipts-bucket', objectName, 24 * 60 * 60);
  }
  
  // Helper methods omitted for brevity
  private calculatePrice(tier: SubscriptionTier, cycle: string): Decimal { /* ... */ return new Decimal('99.00'); }
  private getTierFlags(tier: SubscriptionTier): any[] { /* ... */ return []; }
  private async createArabicPdfReceipt(order: any): Promise<Buffer> { /* ... */ return Buffer.from(''); }
}
```

---

## Section 4 — Payment Integration Architecture

Robust payment integration is critical for revenue realization. Phase 1 relies heavily on Fawry, Egypt's largest electronic payment network.

### 4.1 Fawry API Integration

Fawry requires request signing using a shared secret key to prevent tampering.

```python
import hmac
import hashlib
from decimal import Decimal

def generate_fawry_signature(merchant_code: str, merchant_ref: str, 
                              amount: Decimal, secret_key: str) -> str:
    """
    Generates a SHA-256 HMAC signature required by the Fawry API.
    The string to sign is a concatenation of specific fields.
    """
    # Format amount to exactly 2 decimal places to match Fawry's expected format
    formatted_amount = amount.quantize(Decimal('0.01'))
    
    # Concatenation order as per Fawry documentation
    signature_string = f"{merchant_code}{merchant_ref}{formatted_amount}"
    
    return hmac.new(
        key=secret_key.encode('utf-8'),
        msg=signature_string.encode('utf-8'),
        digestmod=hashlib.sha256
    ).hexdigest()

def verify_fawry_webhook(payload: dict, signature: str, secret_key: str) -> bool:
    """
    Verifies the authenticity of incoming Fawry webhooks.
    """
    merchant_code = payload.get('merchantCode', '')
    merchant_ref = payload.get('merchantRefNum', '')
    payment_amount = Decimal(str(payload.get('paymentAmount', '0.00')))
    
    expected_signature = generate_fawry_signature(
        merchant_code, merchant_ref, payment_amount, secret_key
    )
    
    # Use compare_digest to prevent timing attacks
    return hmac.compare_digest(expected_signature, signature)
```

### 4.2 Webhook Security

All webhook endpoints must implement:
1. **Signature Verification:** Using the `verify_fawry_webhook` function described above.
2. **IP Allowlisting:** Webhooks must only be accepted from Fawry's published CIDR blocks.
3. **Replay Protection:** Webhooks older than 5 minutes (based on timestamp) must be rejected.

### 4.3 Idempotency

Webhooks can be delivered multiple times (at-least-once delivery). The system relies on the `merchantRefNum` (mapped to our `SubscriptionOrder.orderId`) as an idempotency key.

Processing logic:
1. Fetch `SubscriptionOrder` by `orderId`.
2. If `order.status` is `ACTIVE`, return HTTP 200 OK immediately without taking action.
3. If `order.status` is `PENDING`, proceed with the upgrade logic.

### 4.4 Currency Handling

- **Exclusively EGP:** All transactions in Phase 1 are strictly in Egyptian Pounds (EGP).
- **Data Types:** All monetary values MUST be stored and manipulated using arbitrary-precision decimal libraries (`decimal.Decimal` in Python, `decimal.js` in TypeScript). Floating-point floats/doubles are strictly prohibited.

### 4.5 Refund Flow and Proration Calculation

When a user downgrades or cancels, they may be eligible for a prorated refund (subject to terms of service).

```python
from decimal import Decimal, ROUND_HALF_UP
from datetime import date

def calculate_prorated_refund(subscription_end: date, cancellation_date: date, 
                               monthly_price: Decimal) -> Decimal:
    """
    Calculates the refund amount based on unused days in the billing cycle.
    Assumes a standardized 30-day month for financial simplicity.
    """
    if cancellation_date >= subscription_end:
        return Decimal('0.00')

    remaining_days = (subscription_end - cancellation_date).days
    
    if remaining_days <= 0:
        return Decimal('0.00')

    days_in_month = 30
    
    # Proration formula: (Remaining Days / Total Days) * Price
    refund_ratio = Decimal(remaining_days) / Decimal(days_in_month)
    refund = refund_ratio * monthly_price
    
    return refund.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

# Example:
# end=Aug 31, cancel=Aug 15, price=99.00 -> remaining=16 -> (16/30)*99 = 52.80 EGP
```

---

## Section 5 — Feature Flag Integration (Unleash)

Entitlements are entirely decoupled from the core application logic via Unleash feature flags. This allows product managers to adjust tier limits without code deployments.

### Mapping Table: SubscriptionTier → Unleash Feature Flags

| Flag Name | Free | Premium | Wealth | Institutional |
|-----------|------|---------|--------|---------------|
| `feature_ai_recommendations` | ON (limit:10) | ON (limit:100) | ON (unlimited) | ON (unlimited) |
| `feature_realtime_data` | OFF | ON | ON | ON |
| `feature_api_access` | OFF | OFF | ON (rate limited) | ON (full) |
| `feature_custom_reports` | OFF | OFF | ON | ON |
| `feature_white_label` | OFF | OFF | OFF | ON |
| `feature_price_alerts` | ON (limit:5) | ON (limit:25) | ON (limit:100) | ON (unlimited) |

### TypeScript Flag Update Code

When a subscription event occurs, the system dynamically updates user constraints in Unleash.

```typescript
import { UnleashAdminClient } from './unleash-admin';
import { ValkeyClient } from './valkey';
import { SubscriptionTier } from './types';

const unleashAdminClient = new UnleashAdminClient(process.env.UNLEASH_ADMIN_TOKEN);
const valkey = new ValkeyClient(process.env.VALKEY_URL);

const TIER_FLAG_MAPPING = {
  [SubscriptionTier.FREE]: {
    'feature_ai_recommendations': { enabled: true, payload: { type: 'number', value: '10' } },
    'feature_realtime_data': { enabled: false },
    'feature_api_access': { enabled: false },
    'feature_custom_reports': { enabled: false },
    'feature_white_label': { enabled: false },
    'feature_price_alerts': { enabled: true, payload: { type: 'number', value: '5' } }
  },
  [SubscriptionTier.PREMIUM]: {
    'feature_ai_recommendations': { enabled: true, payload: { type: 'number', value: '100' } },
    'feature_realtime_data': { enabled: true },
    'feature_api_access': { enabled: false },
    'feature_custom_reports': { enabled: false },
    'feature_white_label': { enabled: false },
    'feature_price_alerts': { enabled: true, payload: { type: 'number', value: '25' } }
  },
  // Wealth and Institutional omitted for brevity, follows same structure
};

export async function updateUserFeatureFlags(userId: string, tier: SubscriptionTier): Promise<void> {
  const flagConfig = TIER_FLAG_MAPPING[tier];
  
  if (!flagConfig) {
    throw new Error(`Invalid tier mapping for: ${tier}`);
  }

  // Iterate and update constraints in Unleash Admin API
  for (const [flagName, config] of Object.entries(flagConfig)) {
    if (config.enabled) {
      await unleashAdminClient.setUserConstraint(flagName, userId, config);
    } else {
      await unleashAdminClient.removeUserConstraint(flagName, userId);
    }
  }

  // Invalidate Valkey cache to force the application to fetch fresh entitlements
  await valkey.del(`user:entitlements:${userId}`);
  console.log(`Successfully updated entitlements and invalidated cache for user ${userId}`);
}
```

---

## Section 6 — Subscription Lifecycle

Subscriptions transition through a strict state machine.

### State Machine

`FREE` → `TRIAL` → `ACTIVE` → `PAST_DUE` → `CANCELLED` / `EXPIRED`

#### 1. FREE State
- **Entry Conditions:** Default state for all new accounts. Also entered upon downgrade from `PAST_DUE` or `CANCELLED`.
- **Allowed Transitions:** → `TRIAL`, → `ACTIVE`.
- **Actions Triggered:** Set Unleash flags to FREE defaults.

#### 2. TRIAL State
- **Entry Conditions:** User opts into a 14-day promotional trial.
- **Allowed Transitions:** → `ACTIVE`, → `FREE` (if trial expires without payment method).
- **Actions Triggered:** Temporarily apply Premium flags. Schedule trial expiry job.

#### 3. ACTIVE State
- **Entry Conditions:** Successful payment received (new or renewal).
- **Allowed Transitions:** → `PAST_DUE` (renewal fails), → `CANCELLED` (user requests cancellation).
- **Actions Triggered:** Apply tier-specific flags, generate receipt.

#### 4. PAST_DUE State (Dunning)
- **Entry Conditions:** Automatic renewal fails (e.g., card expired, insufficient funds).
- **Allowed Transitions:** → `ACTIVE` (successful retry), → `FREE` (grace period ends).
- **Actions Triggered:** Initiate dunning process.

### Dunning Process Table

| Day | Action | Notification |
|-----|--------|------|
| Day 0 | Payment failed | Email + push: 'تعذر تجديد اشتراكك' (Unable to renew subscription) |
| Day 1 | First retry attempt | Email reminder to update payment method |
| Day 3 | Second retry attempt | Email + SMS reminder |
| Day 7 | Third and final retry | Final notice: subscription will downgrade tomorrow |
| Day 8 | Grace period ends | Downgrade to FREE, email confirmation of downgrade |

### Grace Period Logic

During the `PAST_DUE` grace period, the user retains their premium access. Once the grace period expires, they are downgraded to the constitutional FREE tier.

```python
from datetime import datetime, timedelta
from typing import Protocol

class Subscription(Protocol):
    status: str
    expired_at: datetime
    user_id: str

def check_grace_period(subscription: Subscription) -> bool:
    """
    Evaluates if a PAST_DUE subscription is still within the 7-day grace period.
    """
    if subscription.status == 'PAST_DUE':
        grace_end = subscription.expired_at + timedelta(days=7)
        return datetime.utcnow() < grace_end
    return False

def downgrade_to_free(user_id: str) -> None:
    """
    Executes the downgrade process. 
    Crucially, NO user data (portfolios, watchlists) is deleted.
    Access limits are simply re-imposed via feature flags.
    """
    print(f"Initiating downgrade to FREE tier for user {user_id}")
    
    # 1. Revert feature flags to FREE tier
    # unleash_client.update_user_flags(user_id, 'FREE')
    
    # 2. Preserve all user data (no deletion)
    # The application layer will handle restricting access to portfolios > 1
    # rather than deleting the extra portfolios.
    
    # 3. Publish SubscriptionDowngraded event
    # kafka_producer.publish('platform.subscriptions.events', {
    #     'eventType': 'SubscriptionDowngraded',
    #     'userId': user_id,
    #     'newTier': 'FREE',
    #     'reason': 'GRACE_PERIOD_EXPIRED'
    # })
    pass
```

---

## Section 7 — Revenue Recognition & Accounting

Accurate revenue recognition is required for financial compliance (IFRS 15). Revenue is recognized linearly over the life of the subscription.

### Monthly vs Annual Recognition

```python
from decimal import Decimal
from datetime import date
from dataclasses import dataclass
from typing import List

class Account:
    ACCOUNTS_RECEIVABLE = '1200'
    CASH = '1000'
    UNEARNED_REVENUE = '2100'
    SUBSCRIPTION_REVENUE = '4000'
    VAT_PAYABLE = '2200'

@dataclass
class JournalEntry:
    debit_account: str
    credit_account: str
    amount: Decimal
    period: date
    description: str

class RevenueRecognitionService:
    def recognize_monthly(self, subscription_id: str, amount: Decimal, period_start: date) -> List[JournalEntry]:
        """
        Recognizes revenue for a monthly subscription.
        Recognized immediately upon payment receipt.
        """
        return [
            JournalEntry(
                debit_account=Account.CASH,
                credit_account=Account.SUBSCRIPTION_REVENUE,
                amount=amount,
                period=period_start,
                description=f'Monthly subscription revenue - {subscription_id}'
            )
        ]
    
    def recognize_annual_deferred(self, subscription_id: str, annual_amount: Decimal, 
                                    start_date: date) -> List[JournalEntry]:
        """
        Recognizes revenue for an annual subscription.
        Cash is received upfront, but revenue is deferred and recognized monthly.
        """
        monthly_amount = (annual_amount / Decimal('12')).quantize(Decimal('0.01'))
        
        # Initial cash receipt -> Unearned Revenue
        entries = [
            JournalEntry(
                debit_account=Account.CASH,
                credit_account=Account.UNEARNED_REVENUE,
                amount=annual_amount,
                period=start_date,
                description=f'Annual subscription cash receipt - {subscription_id}'
            )
        ]
        
        # Schedule 12 monthly recognition entries: Unearned -> Revenue
        for month in range(12):
            recognition_date = date(start_date.year + (start_date.month + month - 1) // 12, 
                                    ((start_date.month + month - 1) % 12) + 1, 
                                    start_date.day)
            entries.append(
                JournalEntry(
                    debit_account=Account.UNEARNED_REVENUE,
                    credit_account=Account.SUBSCRIPTION_REVENUE,
                    amount=monthly_amount,
                    period=recognition_date,
                    description=f'Annual revenue recognition month {month+1}/12 - {subscription_id}'
                )
            )
        return entries
```

### Journal Entries Table for Scenarios

| Scenario | Debit Account | Credit Account | Amount | Timing |
|----------|---------------|----------------|--------|--------|
| Premium Monthly Payment | Cash (1000) | Subscription Revenue (4000) | 99 EGP | Day 0 |
| Premium Monthly VAT | Cash (1000) | VAT Payable (2200) | 13.86 EGP | Day 0 |
| Wealth Annual Payment | Cash (1000) | Unearned Revenue (2100) | 4,790.40 EGP | Day 0 |
| Wealth Annual Amortization | Unearned Rev (2100) | Subscription Revenue (4000) | 399.20 EGP | Monthly (x12) |
| Refund Issued | Subscription Revenue (4000) | Cash (1000) | Prorated Amt | At Refund |

---

## Section 8 — Complete JSON Schemas

### 1. Subscription Upgrade Request
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SubscriptionUpgradeRequest",
  "type": "object",
  "properties": {
    "userId": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for the user requesting the upgrade."
    },
    "fromTier": {
      "type": "string",
      "enum": ["FREE", "PREMIUM", "WEALTH"],
      "description": "The user's current subscription tier."
    },
    "toTier": {
      "type": "string",
      "enum": ["PREMIUM", "WEALTH", "INSTITUTIONAL"],
      "description": "The target subscription tier for the upgrade."
    },
    "paymentMethod": {
      "type": "string",
      "enum": ["FAWRY", "MEEZA", "BANK_TRANSFER"],
      "description": "The chosen payment method for this transaction."
    },
    "billingCycle": {
      "type": "string",
      "enum": ["MONTHLY", "ANNUAL"],
      "description": "The billing frequency (annual includes a 20% discount)."
    }
  },
  "required": ["userId", "fromTier", "toTier", "paymentMethod", "billingCycle"],
  "additionalProperties": false
}
```

### 2. Payment Initiation Response (Fawry)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PaymentInitiationResponse",
  "type": "object",
  "properties": {
    "statusCode": {
      "type": "integer",
      "description": "HTTP status code of the Fawry API response."
    },
    "statusDescription": {
      "type": "string",
      "description": "Human-readable description of the response status."
    },
    "referenceNumber": {
      "type": "string",
      "description": "The unique Fawry reference code (e.g., for USSD payment)."
    },
    "paymentUrl": {
      "type": "string",
      "format": "uri",
      "description": "The URL to redirect the user to for web-based payment."
    },
    "expirationTime": {
      "type": "string",
      "format": "date-time",
      "description": "The ISO-8601 timestamp when the reference number expires."
    }
  },
  "required": ["statusCode", "statusDescription", "referenceNumber"],
  "additionalProperties": true
}
```

### 3. Fawry Webhook Payload
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "FawryWebhookPayload",
  "type": "object",
  "properties": {
    "requestId": {
      "type": "string",
      "description": "Unique identifier for this webhook request."
    },
    "merchantCode": {
      "type": "string",
      "description": "Tradeora's unique merchant identifier in Fawry's system."
    },
    "merchantRefNum": {
      "type": "string",
      "description": "The SubscriptionOrder ID provided during initiation."
    },
    "paymentAmount": {
      "type": "number",
      "description": "The actual amount paid by the customer."
    },
    "orderStatus": {
      "type": "string",
      "enum": ["PAID", "FAILED", "EXPIRED", "REFUNDED"],
      "description": "The final status of the payment transaction."
    },
    "paymentMethod": {
      "type": "string",
      "description": "How the user paid (e.g., PAYATFAWRY, MWALLET)."
    },
    "signature": {
      "type": "string",
      "description": "HMAC-SHA256 signature for payload verification."
    }
  },
  "required": ["requestId", "merchantCode", "merchantRefNum", "paymentAmount", "orderStatus", "signature"],
  "additionalProperties": true
}
```

### 4. SubscriptionUpgraded Kafka Event
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SubscriptionUpgradedEvent",
  "type": "object",
  "properties": {
    "eventId": {
      "type": "string",
      "format": "uuid",
      "description": "Unique identifier for this domain event."
    },
    "eventType": {
      "type": "string",
      "enum": ["SubscriptionUpgraded"],
      "description": "The specific type of subscription event."
    },
    "userId": {
      "type": "string",
      "format": "uuid",
      "description": "The ID of the user who upgraded."
    },
    "oldTier": {
      "type": "string",
      "description": "The user's previous tier."
    },
    "newTier": {
      "type": "string",
      "description": "The user's newly acquired tier."
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "When the upgrade was confirmed."
    }
  },
  "required": ["eventId", "eventType", "userId", "oldTier", "newTier", "timestamp"],
  "additionalProperties": false
}
```

### 5. Feature Entitlements Response
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "FeatureEntitlementsResponse",
  "type": "object",
  "properties": {
    "userId": {
      "type": "string",
      "format": "uuid",
      "description": "The user these entitlements belong to."
    },
    "tier": {
      "type": "string",
      "description": "The user's current active subscription tier."
    },
    "features": {
      "type": "object",
      "description": "A map of feature flags and their configurations.",
      "patternProperties": {
        "^feature_[a-z_]+$": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean" },
            "limit": { "type": ["integer", "null"] }
          },
          "required": ["enabled"]
        }
      }
    }
  },
  "required": ["userId", "tier", "features"],
  "additionalProperties": false
}
```

---

## Section 9 — Sequence Diagram (ASCII)

```
User      Flutter    SubService  FawryAPI   Kafka     Unleash    Valkey    MinIO     NotifSvc
 |           |           |           |         |          |          |         |          |
 |---Click-->|           |           |         |          |          |         |          |
 | Upgrade   |---POST--->|           |         |          |          |         |          |
 |           | /upgrade  |--Create-->|         |          |          |         |          |
 |           |           |  Order    |         |          |          |         |          |
 |           |           |---POST--->|         |          |          |         |          |
 |           |           |/initiate  |         |          |          |         |          |
 |           |           |<--RefNum--|         |          |          |         |          |
 |           |<--URL/Ref-|           |         |          |          |         |          |
 |<--Display-|           |           |         |          |          |         |          |
 |  RefNum   |           |           |         |          |          |         |          |
 |           |           |           |         |          |          |         |          |
 |-Pays Kiosk----------------------->|         |          |          |         |          |
 |           |           |           |         |          |          |         |          |
 |           |           |<--Webhook-|         |          |          |         |          |
 |           |           | (Status:  |         |          |          |         |          |
 |           |           |   PAID)   |         |          |          |         |          |
 |           |           |           |         |          |          |         |          |
 |           |           |--Verify-->|         |          |          |         |          |
 |           |           | Signature |         |          |          |         |          |
 |           |           |           |         |          |          |         |          |
 |           |           |--Update-->|         |          |          |         |          |
 |           |           | DB ACTIVE |         |          |          |         |          |
 |           |           |           |         |          |          |         |          |
 |           |           |--Publish------------------------------------------------------->|
 |           |           | Event     |-->[Topic: platform.subscriptions.events]            |
 |           |           |           |         |          |          |         |          |
 |           |           |           |         |---Update->|         |         |          |
 |           |           |           |         |   Flags   |         |         |          |
 |           |           |           |         |           |         |         |          |
 |           |           |           |         |---Delete------------>|        |          |
 |           |           |           |         | Cache Key |          |        |          |
 |           |           |           |         |           |          |        |          |
 |           |           |--Gen PDF->|         |          |          |         |          |
 |           |           |           |         |          |          |--Upload->|         |
 |           |           |           |         |          |          | Receipt |          |
 |           |           |           |         |          |          |         |          |
 |           |           |--Send--------------------------------------------------------->|
 |           |           | Push/Email|         |          |          |         |          |
 |<--تم الترقية بنجاح!---|           |         |          |          |         |          |
 |           |           |           |         |          |          |         |          |
 |---Refresh UI--------->|           |         |          |          |         |          |
 |           |<--Flags---|           |         |          |          |         |          |
 |<--New Dashboard-------|           |         |          |          |         |          |
```

---

## Section 10 — Failure Modes & Mitigations

| Failure | Detection | Mitigation | Recovery |
|---------|-----------|------------|----------|
| Fawry API timeout | HTTP 504 / Latency metrics spike | Circuit breaker trips; UI shows "Service busy" | Retry with exponential backoff |
| Webhook delivery failure | Fawry dashboard shows failed deliveries | Polling fallback: CRON job checks PENDING orders > 1hr old | Fawry automatic retry policy (up to 24h) |
| Feature flag service down | Unleash API returns 5xx | SubService continues relying on cached Valkey data | Kafka event processing pauses until Unleash recovers |
| Duplicate webhook received | Postgres Unique Violation or idempotency check | Ignore webhook, return 200 OK | None required (idempotent design) |
| Receipt generation failure | PDF lib throws exception | Catch exception, queue for async generation | Dead Letter Queue (DLQ) processing |
| Valkey cache unavailable | Connection timeout | Fallback to direct DB reads | Auto-reconnect via client library |
| Kafka publish failure | Producer timeout | Transactional outbox pattern: save event to DB | Outbox relay picks up and publishes |
| MinIO storage full | Quota exceeded error | Alerts fire, temporary storage in /tmp | SRE expands PVC / clears old data |
| Subscription DB write failure | Postgres throws error | Rollback transaction, return 500 | Client retries initiation |
| VAT calculation rounding error | Unit test failure in CI pipeline | Prevent deployment, fix rounding logic | Manual DB reconciliation if deployed |
| User account deleted during upgrade | Foreign key constraint fails on DB update | Abort upgrade, trigger refund process | Admin console manual refund |
| Payment success but order not found | Webhook processor finds no DB record | Log critical error, return 200 to ack | Manual investigation, possible race condition fix |

---

## Section 11 — Performance Budget

| Operation | P50 Target | P99 Target | Measurement Method |
|-----------|------------|------------|--------------------|
| Payment initiation | <500ms | <2s | OpenTelemetry span: `fawry_initiate` |
| Webhook processing | <200ms | <1s | OpenTelemetry span: `webhook_process` |
| Feature flag update | <50ms | <100ms | Datadog APM tracing |
| Receipt generation | <3s | <10s | Custom histogram metric |
| End-to-end upgrade | <15s | <30s | UI to Webhook completion synthetic test |
| Cache invalidation | <10ms | <50ms | Redis command latency metrics |

---

## Section 12 — Security Controls

- **PCI DSS Scope Reduction:** Tradeora never stores, transmits, or processes raw credit card data. All card capture is handled entirely on Fawry's hosted checkout pages via tokenization.
- **Webhook Authentication:** Mandatory HMAC-SHA256 signature verification for all incoming webhooks to prevent spoofed payment confirmations.
- **Data Encryption:** All subscription and billing data is encrypted at rest in PostgreSQL using AES-256.
- **Receipt Security:** MinIO receipt documents are private. Access is granted only via time-bound (24-hour) presigned URLs.
- **Audit Logging:** Every state change to a subscription is immutably logged with the triggering user ID, timestamp, and IP address for compliance and debugging.

---

## Section 13 — SLO Compliance

To ensure high availability of the billing pipeline, the following Prometheus alerting rules are active.

```promql
alert: SubscriptionUpgradeLatencyHigh
expr: histogram_quantile(0.99, rate(subscription_upgrade_duration_seconds_bucket[5m])) > 30
for: 5m
labels:
  severity: critical
  team: payments
annotations:
  summary: "Subscription upgrade P99 > 30 seconds"
  description: "The 99th percentile for end-to-end subscription upgrades has exceeded the 30s performance budget."

alert: PaymentSuccessRateLow
expr: rate(payment_completed_total{status='SUCCESS'}[5m]) / rate(payment_completed_total[5m]) < 0.95
for: 10m
labels:
  severity: warning
  team: payments
annotations:
  summary: "Payment success rate dropped below 95%"
  description: "High volume of failed payment attempts. Investigate Fawry API stability or fraud rules."

alert: WebhookProcessingBacklog
expr: kafka_consumer_lag{topic="platform.subscriptions.events"} > 500
for: 5m
labels:
  severity: warning
annotations:
  summary: "High Kafka consumer lag on subscription events"
```

---

## Section 14 — Observability

### Core Metrics Table

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `subscription_upgrades_total` | Counter | `tier`, `payment_method` | Total count of successful subscription upgrades. |
| `subscription_mrr_egp` | Gauge | `tier` | Current Monthly Recurring Revenue in EGP. |
| `payment_duration_seconds` | Histogram | `provider`, `status` | Time taken to process payments externally. |
| `subscription_churn_rate` | Gauge | `tier` | Percentage of users cancelling per month. |
| `feature_flag_update_duration` | Histogram | `tier` | Latency of updating Unleash API. |
| `receipt_generation_duration` | Histogram | `tier` | Time taken to generate the PDF receipt. |
| `dunning_retries_total` | Counter | `attempt`, `result` | Tracking of automated failed payment retries. |

### Grafana Dashboard Panels

- **MRR Trend:** A line chart tracking Monthly Recurring Revenue over the last 12 months, split by tier.
- **Tier Distribution:** A pie chart showing the percentage of users in Free vs. Premium vs. Wealth tiers.
- **Payment Success Rate:** A large stat panel showing the current % of successful payments vs. declines.
- **Churn Rate by Tier:** A bar chart visualizing churn, helping identify if a specific tier is losing value.
- **Upgrade Funnel:** A funnel chart tracking: `Visited Plans -> Clicked Upgrade -> Initiated Payment -> Completed Payment`.

---

## Section 15 — Test Strategy

Robust testing is required for all billing logic. Code coverage for the `subscriptions` module must remain above 95%.

```python
import pytest
from decimal import Decimal
from datetime import date
from tradeora.billing import calculate_subscription_total, calculate_prorated_refund
from tradeora.security import verify_fawry_webhook

class TestVATCalculation:
    def test_premium_vat_calculation(self):
        """Ensures 14% VAT is calculated correctly for the Premium tier."""
        result = calculate_subscription_total(Decimal('99.00'))
        assert result['vat_amount'] == '13.86'
        assert result['total'] == '112.86'
        assert result['currency'] == 'EGP'
    
    def test_annual_discount_applied(self):
        """Validates the 20% annual discount math."""
        monthly = Decimal('99.00')
        annual = monthly * Decimal('12') * Decimal('0.80')  # 20% discount
        assert annual == Decimal('950.40')

class TestProration:
    def test_prorated_refund_midmonth(self):
        """Verifies correct calculation of a mid-cycle cancellation refund."""
        refund = calculate_prorated_refund(
            subscription_end=date(2026, 8, 31),
            cancellation_date=date(2026, 8, 15),
            monthly_price=Decimal('99.00')
        )
        assert refund == Decimal('52.80')  # 16 days / 30 days * 99

    def test_no_refund_after_end_date(self):
        refund = calculate_prorated_refund(
            subscription_end=date(2026, 8, 31),
            cancellation_date=date(2026, 9, 1),
            monthly_price=Decimal('99.00')
        )
        assert refund == Decimal('0.00')

class TestWebhookSecurity:
    def test_valid_webhook_accepted(self):
        # Implementation to generate valid signature and test
        pass
        
    def test_tampered_webhook_rejected(self):
        payload = {
            'merchantCode': 'TRD001',
            'merchantRefNum': 'ORD-123',
            'paymentAmount': 99.00
        }
        # Intentionally invalid signature
        invalid_sig = 'abcdef1234567890' 
        
        is_valid = verify_fawry_webhook(payload, invalid_sig, 'secret_key')
        assert is_valid is False
    
    def test_duplicate_webhook_idempotent(self):
        # Test idempotency key handling
        # Send same webhook twice, expect second to return 200 but trigger no state change
        pass
```
