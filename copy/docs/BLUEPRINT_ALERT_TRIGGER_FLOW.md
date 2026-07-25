| Field | Value |
|-------|-------|
| Document ID | BLUEPRINT-ALERT-001 |
| Title | Alert & Notification Trigger Flow |
| Version | 1.0.0 |
| Status | AUTHORITATIVE |
| Authority | Constitution Articles 3, 19, 25 |
| Date | 2026-07-24 |
| Owner | Platform Engineering |

## SECTION 1 — Blueprint Authority & Scope

This blueprint defines the end-to-end architecture and data flow for the Tradeora Alert & Notification Trigger system.

- **Authority:** 
  - Constitution Article 3 (Real-time data integrity): Ensures alerts act on truthful, low-latency market data.
  - Constitution Article 19 (Notification delivery): Guarantees multi-channel, reliable notification delivery without spam.
  - Constitution Article 25 (User experience SLOs): Mandates strict latency bounds for the critical path of trading alerts.
- **Three alert types covered:** 
  1. Price Alerts (EGX Ticks)
  2. Portfolio NAV Alerts
  3. News Alerts
- **Scope:** 
  - Covers alert rule creation, real-time evaluation, and notification delivery via FCM, APNs, and WebSocket.
  - Does NOT cover marketing notifications, system maintenance alerts, or regulatory notices.
- **Pre-conditions:** 
  - EGX session must be open for price alerts to trigger.
  - User must have a valid FCM/APNs token registered.
  - User must have granted OS-level notification permissions.
- **Dependencies table:** 
  | Dependency | Description |
  |------------|-------------|
  | BLUEPRINT-NAV-001 | Real-time Portfolio NAV calculation |
  | BLUEPRINT-AI-REC-001 | AI Recommendation event streams |
  | BLUEPRINT-EGX-001 | Real-time Market Data Ingestion |
  | EVENT_ARCHITECTURE | Core Kafka pub/sub schemas |
  | SECURITY_ARCHITECTURE| JWT authentication and rate limiting |
- **SLO commitment:** P99 < 5 seconds from price trigger event (at gateway) to FCM receipt by the device.

## SECTION 2 — Architecture Overview

### Component Inventory Table

| Component | Technology | Role | Port |
|-----------|------------|------|------|
| Flutter | Dart/Flutter 3.22 | Client Application | N/A |
| API Gateway | Kong OSS 3.7 | Auth/Route/Rate Limit | 8000/8443 |
| AlertRule Service | Python/FastAPI | Alert CRUD & rule management | 8004 |
| Valkey | Valkey 8.0+ | Fast in-memory Alert index & deduplication | 6379 |
| Apache Kafka | 3.7 | Distributed Event Bus | 9092 |
| EGXMarketData Service| Python | Price evaluation & tick processing | 8005 |
| PortfolioValuation Svc| Python | NAV alert evaluation | 8002 |
| FinancialNews Service| Python | News alert evaluation | 8006 |
| NotificationDelivery | Python | FCM/APNs/WS payload delivery | 8007 |
| FCM | Google Firebase | Android Push Notifications | External |
| APNs | Apple Push | iOS Push Notifications | External |
| WebSocket Gateway | FastAPI/Starlette | In-app push stream | 8003 |
| PostgreSQL | 16 | Persistent Alert rule storage | 5433 |
| Prometheus | 2.53 | Metrics collection | 9090 |

### ASCII Alert Evaluation Topology Diagram

```text
EGX Tick → [ Kafka: egx.tick.v1 ] → EGXMarketData Service
                                          │
                                          ├─(1) O(log n) Lookup─→ [ Valkey Alert Index ]
                                          │
                                          └─(2) Publish─→ [ Kafka: alert.AlertTriggered.v1 ]
                                                                 │
                                         ┌───────────────────────┘
                                         │
                               NotificationDelivery Service 
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ↓                       ↓                       ↓
                FCM                     APNs              WebSocket Gateway
                 │                       │                       │
                 └───────────────────────┴───────────────────────┘
                                         │
                                  Flutter Client
```

## SECTION 3 — Alert Rule Creation Flow (8 Steps)

### Step 1: User taps 'Set Alert' in Flutter
The user selects a condition and threshold for an asset.

```dart
// Flutter Dart: AlertCreationScreen & AlertRepository
import 'package:http/http.dart' as http;
import 'dart:convert';

class AlertRepository {
  final String baseUrl = 'https://api.tradeora.com/api/v1';
  final String jwtToken;

  AlertRepository(this.jwtToken);

  Future<Map<String, dynamic>> createAlert({
    required String ticker,
    required String condition,
    required String threshold,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/alerts'),
      headers: {
        'Authorization': 'Bearer $jwtToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'ticker': ticker,
        'alert_type': 'PRICE',
        'condition': condition,
        'threshold': threshold,
        'notification_channels': ['PUSH', 'IN_APP'],
        'language': 'ar',
        'max_triggers': 1
      }),
    );
    if (response.statusCode == 201) return jsonDecode(response.body);
    throw Exception('Failed to create alert');
  }
}
```
**Latency:** ~10ms UI processing. **Failure mode:** Network timeout -> Retry with exponential backoff.

### Step 2: POST /api/v1/alerts
**Action:** Client issues the POST request to API Gateway.
```http
POST /api/v1/alerts HTTP/1.1
Host: api.tradeora.com
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "ticker": "COMI",
  "alert_type": "PRICE",
  "condition": "CROSSES_ABOVE",
  "threshold": "15.00",
  "notification_channels": ["PUSH", "IN_APP"],
  "language": "ar",
  "max_triggers": 1,
  "expires_at": "2026-07-24T15:00:00Z"
}
```

### Step 3: API Gateway validates JWT, rate limits
**Action:** Kong validates the token and applies rate limits.
**Rate Limit:** 100 alert creation requests per day per user.
```yaml
# Kong declarative configuration
plugins:
  - name: rate-limiting
    service: alert-rule-service
    config:
      second: 5
      day: 100
      policy: redis
      redis_host: valkey
      redis_port: 6379
```

### Step 4: AlertRule Service creates AlertRule aggregate
**Action:** FastAPI service handles the request.
```python
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from enum import Enum

class AlertType(str, Enum):
    PRICE = "PRICE"
    PORTFOLIO_NAV = "PORTFOLIO_NAV"
    NEWS = "NEWS"

class AlertCondition(str, Enum):
    ABOVE = "ABOVE"
    BELOW = "BELOW"
    CROSSES_ABOVE = "CROSSES_ABOVE"
    CROSSES_BELOW = "CROSSES_BELOW"
    PCT_CHANGE = "PCT_CHANGE"

class AlertStatus(str, Enum):
    ACTIVE = "ACTIVE"
    TRIGGERED = "TRIGGERED"
    EXPIRED = "EXPIRED"
    PAUSED = "PAUSED"
    DELETED = "DELETED"

class NotificationChannel(str, Enum):
    PUSH = "PUSH"
    IN_APP = "IN_APP"
    SMS = "SMS"

@dataclass
class AlertRule:
    id: UUID
    user_id: UUID
    tenant_id: UUID
    ticker: str
    alert_type: AlertType
    condition: AlertCondition
    threshold: Decimal
    status: AlertStatus
    trigger_count: int
    max_triggers: int
    notification_channels: List[NotificationChannel]
    language: str
    created_at: datetime
    expires_at: Optional[datetime]
    last_triggered_at: Optional[datetime]
    cooldown_seconds: int = 86400
```

### Step 5: AlertRule stored in PostgreSQL
**Action:** Persist the alert to the primary DB.
```sql
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    ticker VARCHAR(10) NOT NULL,
    alert_type VARCHAR(20) NOT NULL,
    condition VARCHAR(20) NOT NULL,
    threshold DECIMAL(18, 4) NOT NULL,
    status VARCHAR(20) NOT NULL,
    trigger_count INT NOT NULL DEFAULT 0,
    max_triggers INT NOT NULL DEFAULT 1,
    notification_channels TEXT[] NOT NULL,
    language VARCHAR(5) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    cooldown_seconds INT NOT NULL DEFAULT 86400
);

CREATE INDEX idx_alert_rules_user ON alert_rules(user_id, status);
CREATE INDEX idx_alert_rules_ticker ON alert_rules(ticker, status);
```
```sql
INSERT INTO alert_rules (id, user_id, tenant_id, ticker, alert_type, condition, threshold, status, trigger_count, max_triggers, notification_channels, language, created_at, expires_at)
VALUES ('550e8400-e29b-41d4-a716-446655440000', '...', '...', 'COMI', 'PRICE', 'CROSSES_ABOVE', 15.0000, 'ACTIVE', 0, 1, '{"PUSH", "IN_APP"}', 'ar', NOW(), '2026-07-24 15:00:00+00');
```

### Step 6: Alert indexed in Valkey
**Action:** Index alert for fast real-time lookup.
```python
import valkey
import json
from decimal import Decimal

# Key: alerts:price:{ticker}:{direction}
# Score: threshold_price as float
# Value: alert_rule_id

async def index_alert_in_valkey(rule: AlertRule, v: valkey.Redis):
    direction = "above" if rule.condition in [AlertCondition.CROSSES_ABOVE, AlertCondition.ABOVE] else "below"
    zset_key = f"alerts:price:{rule.ticker}:{direction}"
    meta_key = f"alerts:price:{rule.ticker}:meta:{rule.id}"
    
    pipeline = v.pipeline()
    pipeline.zadd(zset_key, {str(rule.id): float(rule.threshold)})
    pipeline.hset(meta_key, mapping={
        "user_id": str(rule.user_id),
        "condition": rule.condition.value,
        "threshold": str(rule.threshold),
        "language": rule.language
    })
    await pipeline.execute()
```

### Step 7: AlertRuleCreated event published to Kafka
**Action:** Publish creation event for other subsystems (e.g., analytics).
Topic: `alert.AlertRuleCreated.v1`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "u-1234",
  "ticker": "COMI",
  "alert_type": "PRICE",
  "condition": "CROSSES_ABOVE",
  "threshold": "15.00"
}
```

### Step 8: Confirmation returned to user
**Action:** Return 201 Created.
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "ticker": "COMI",
  "status": "ACTIVE",
  "threshold": "15.00",
  "created_at": "2026-07-24T03:07:41Z"
}
```

## SECTION 4 — Alert Evaluation Flow (11 Steps)

### Step 1: EGX price tick arrives at EGXMarketData
```python
from confluent_kafka import Consumer
import json
from decimal import Decimal

consumer = Consumer({'bootstrap.servers': 'kafka:9092', 'group.id': 'egx-market-data-alerts'})
consumer.subscribe(['egx.tick.v1'])
```

### Step 2 & 3: Efficient O(log n + k) lookup using Valkey ZRANGEBYSCORE
```python
async def evaluate_price_alerts(
    ticker: str,
    current_price: Decimal,
    previous_price: Decimal,
    v: valkey.Redis
) -> List[str]:
    triggered_alerts = []
    
    # 1. CROSSES_ABOVE: previous_price < threshold <= current_price
    if current_price > previous_price:
        # Range scan on 'above' index
        zset_above = f"alerts:price:{ticker}:above"
        # Exclusive of previous_price, inclusive of current_price
        matches = await v.zrangebyscore(zset_above, f"({float(previous_price)}", float(current_price))
        triggered_alerts.extend(matches)
        
    # 2. CROSSES_BELOW: current_price <= threshold < previous_price
    elif current_price < previous_price:
        zset_below = f"alerts:price:{ticker}:below"
        matches = await v.zrangebyscore(zset_below, float(current_price), f"({float(previous_price)}")
        triggered_alerts.extend(matches)
        
    return [match.decode('utf-8') for match in triggered_alerts]
```

### Step 4: Triggered alerts published to Kafka
Topic: `alert.AlertTriggered.v1`
```json
{
  "alert_rule_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "u-1234",
  "ticker": "COMI",
  "trigger_price": "15.05",
  "trigger_time": "2026-07-24T10:05:00Z"
}
```

### Step 5: AlertRule Service processes triggered event
Changes state to TRIGGERED and updates trigger count.
```python
# Kafka consumer inside AlertRule Service handling AlertTriggered event
async def process_triggered_alert(event):
    await update_db_status(event['alert_rule_id'], 'TRIGGERED')
```

### Step 6: AlertRule status updated in PostgreSQL
**Action:** UPDATE SQL with optimistic locking or direct update.
```sql
UPDATE alert_rules 
SET status = 'TRIGGERED', 
    trigger_count = trigger_count + 1,
    last_triggered_at = NOW()
WHERE id = '550e8400-e29b-41d4-a716-446655440000' 
  AND status = 'ACTIVE' 
  AND trigger_count < max_triggers;
```

### Step 7: Cooldown check — prevent duplicate notifications
```python
async def is_cooldown_active(alert_rule_id: str, date_str: str, cooldown_sec: int, v: valkey.Redis) -> bool:
    dedup_key = f"alert:dedup:{alert_rule_id}:{date_str}"
    # SET NX ensures only the first process sets it, returning True if successful
    is_set = await v.set(dedup_key, "1", nx=True, ex=cooldown_sec)
    return not is_set  # If not set (False), cooldown is active
```

### Step 8: NotificationDelivery service picks up AlertTriggered
Consumes `alert.AlertTriggered.v1`.

### Step 9: Arabic + English notification message assembled
```python
TEMPLATES = {
    'ar': {
        'CROSSES_ABOVE': 'تجاوز سهم {ticker} مستوى {threshold} جنيه. السعر الحالي: {current_price} جنيه',
        'CROSSES_BELOW': 'هبط سهم {ticker} دون مستوى {threshold} جنيه. السعر الحالي: {current_price} جنيه',
        'ABOVE': 'سهم {ticker} فوق مستوى {threshold} جنيه. السعر الحالي: {current_price} جنيه',
        'BELOW': 'سهم {ticker} دون مستوى {threshold} جنيه. السعر الحالي: {current_price} جنيه',
    },
    'en': {
        'CROSSES_ABOVE': '{ticker} crossed above {threshold} EGP. Current price: {current_price} EGP',
        'CROSSES_BELOW': '{ticker} crossed below {threshold} EGP. Current price: {current_price} EGP',
        'ABOVE': '{ticker} is above {threshold} EGP. Current price: {current_price} EGP',
        'BELOW': '{ticker} is below {threshold} EGP. Current price: {current_price} EGP',
    }
}

def build_message(lang: str, condition: str, ticker: str, threshold: Decimal, current_price: Decimal):
    template = TEMPLATES.get(lang, TEMPLATES['en']).get(condition)
    return template.format(ticker=ticker, threshold=threshold, current_price=current_price)
```

### Step 10: FCM push sent to registered devices
```python
from firebase_admin import messaging

def send_fcm_push(token: str, title: str, body: str, data: dict):
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        data=data,
        token=token,
    )
    response = messaging.send(message)
    return response
```

### Step 11: In-app notification stored & WebSocket push
```sql
INSERT INTO notifications (id, user_id, type, title, body, created_at, read_status)
VALUES (gen_random_uuid(), '...', 'PRICE_ALERT', 'COMI Alert', 'تجاوز سهم COMI...', NOW(), 'UNREAD');
```
```python
# WebSocket push
async def push_ws_notification(user_id: str, payload: dict):
    await redis_pubsub.publish(f"ws:user:{user_id}", json.dumps(payload))
```

## SECTION 5 — Alert Types Specification

### Price Alerts
- **Trigger conditions:** ABOVE, BELOW, CROSSES_ABOVE, CROSSES_BELOW, PCT_CHANGE_UP, PCT_CHANGE_DOWN
- **Evaluation frequency:** On every EGX tick (during session 10:00-15:00 Cairo).
- **Cooldown:** 86400 seconds (1 day) by default, configurable 0-604800 (7 days).
- **Re-arm rules:** After trigger, alert moves to TRIGGERED. Manual re-arm via `PATCH /api/v1/alerts/{id}/rearm`. Auto-expiry after `max_triggers` reached.
- **Boundary conditions:** Exact threshold matches are included. CROSSES_ABOVE: `prev < threshold <= current`. CROSSES_BELOW: `current <= threshold < prev`.

### Portfolio NAV Alert
- **Trigger conditions:** NAV_DROP_PCT (daily drop by X%), NAV_LOSS_EGP (absolute loss > Y EGP), DRAWDOWN_ALERT (NAV drops to X% of ATH).
- **Evaluation frequency:** Every 60 seconds.
- **Evaluation Code:**
```python
async def evaluate_nav_alerts(
    portfolio_id: str,
    current_nav: Decimal,
    prev_day_nav: Decimal,
    valkey: valkey.Redis
) -> List[str]:
    daily_change_pct = ((current_nav - prev_day_nav) / prev_day_nav) * Decimal('100')
    triggered = []
    # Simplified evaluation check:
    if daily_change_pct <= Decimal('-10.0'):
        triggered.append("MANDATORY_SYSTEM_ALERT")
    # Custom alerts would be queried from Valkey hash and evaluated
    return triggered
```

### News Alert
- **Trigger conditions:** KEYWORD_MATCH, ENTITY_MENTION, SECTOR_NEWS.
- **Evaluation:** On `FinancialNewsIngested` Kafka event.
- **Cooldown:** 1 hour per keyword match to prevent spam.

## SECTION 6 — Valkey Alert Index Design

```python
class PriceAlertIndex:
    def __init__(self, valkey_client):
        self.v = valkey_client

    async def index_alert(self, rule: AlertRule) -> None:
        direction = "above" if rule.condition in [AlertCondition.CROSSES_ABOVE, AlertCondition.ABOVE] else "below"
        zset_key = f"alerts:price:{rule.ticker}:{direction}"
        meta_key = f"alerts:price:{rule.ticker}:meta:{rule.id}"
        
        pipe = self.v.pipeline()
        pipe.zadd(zset_key, {str(rule.id): float(rule.threshold)})
        pipe.hset(meta_key, mapping={"cond": rule.condition.value, "thr": str(rule.threshold)})
        await pipe.execute()
    
    async def evaluate(self, ticker: str, current: Decimal, previous: Decimal) -> List[str]:
        # Implementation shown in Step 3
        pass
    
    async def remove_alert(self, rule_id: str, ticker: str) -> None:
        pipe = self.v.pipeline()
        pipe.zrem(f"alerts:price:{ticker}:above", rule_id)
        pipe.zrem(f"alerts:price:{ticker}:below", rule_id)
        pipe.delete(f"alerts:price:{ticker}:meta:{rule_id}")
        await pipe.execute()
```

### Memory Estimation for 1M alerts
- Per alert entry in sorted set: ~64 bytes.
- Per alert metadata hash: ~512 bytes.
- Total for 1M alerts: 1,000,000 * 576 bytes ≈ 576 MB.
- Valkey memory budget: 1 GB (headroom: 400 MB).

## SECTION 7 — Notification Message Templates

**Arabic (RTL, proper financial Arabic):**
```
Price CROSSES_ABOVE: "🔔 تنبيه: تجاوز سهم {ticker} مستوى {threshold:.2f} جنيه\nالسعر الحالي: {current_price:.2f} جنيه\nالتغير: +{change_pct:.2f}%"
Price CROSSES_BELOW: "⚠️ تنبيه: هبط سهم {ticker} دون مستوى {threshold:.2f} جنيه\nالسعر الحالي: {current_price:.2f} جنيه\nالتغير: {change_pct:.2f}%"
NAV Drop: "📉 تنبيه محفظة: انخفضت قيمة محفظتك بنسبة {drop_pct:.2f}% اليوم\nالقيمة الحالية: {current_nav:.2f} جنيه"
News Alert: "📰 خبر مالي: {headline}\nالشركة: {company_name}"
```

**FCM Payload Structure (JSON):**
```json
{
  "message": {
    "token": "device-token-123",
    "notification": {
      "title": "تنبيه: COMI",
      "body": "🔔 تنبيه: تجاوز سهم COMI مستوى 15.00 جنيه\nالسعر الحالي: 15.05 جنيه\nالتغير: +2.34%"
    },
    "data": {
      "alert_id": "550e8400...",
      "ticker": "COMI",
      "route": "/stock/COMI"
    },
    "android": {
      "priority": "high"
    },
    "apns": {
      "headers": {
        "apns-priority": "10"
      }
    }
  }
}
```

## SECTION 8 — Complete JSON Schemas

### 1. AlertRule creation request
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "ticker": { "type": "string" },
    "alert_type": { "type": "string", "enum": ["PRICE", "PORTFOLIO_NAV", "NEWS"] },
    "condition": { "type": "string", "enum": ["ABOVE", "BELOW", "CROSSES_ABOVE", "CROSSES_BELOW", "PCT_CHANGE"] },
    "threshold": { "type": "string", "pattern": "^[0-9]+(\\.[0-9]+)?$" },
    "notification_channels": {
      "type": "array",
      "items": { "type": "string", "enum": ["PUSH", "IN_APP"] }
    },
    "language": { "type": "string", "enum": ["en", "ar"] },
    "max_triggers": { "type": "integer" }
  },
  "required": ["ticker", "alert_type", "condition", "threshold", "notification_channels", "language", "max_triggers"]
}
```

## SECTION 9 — Sequence Diagram (Full ASCII)

### Diagram A: Alert Creation Flow
```text
Flutter        APIGateway     AlertRuleService   PostgreSQL      Valkey        Kafka
   │               │                │                │             │             │
   ├──POST /alerts─>│                │                │             │             │
   │               ├──Validate JWT──>│                │             │             │
   │               │                ├───INSERT DB────>│             │             │
   │               │                │<───OK───────────┤             │             │
   │               │                ├───ZADD Index────────────────>│             │
   │               │                │<───OK────────────────────────┤             │
   │               │                ├───Publish AlertRuleCreated────────────────>│
   │               │<───201 Created──┤                │             │             │
   |<──201 Created──┤                │                │             │             │
```

### Diagram B: Alert Evaluation Flow
```text
EGX Tick       Kafka      EGXMarketData    Valkey      AlertRuleService   PostgreSQL   NotificationSvc     FCM      Flutter
   │             │             │             │                │               │               │             │          │
   ├─egx.tick.v1─>│             │             │                │               │               │             │          │
   │             ├─Consume─────>│             │                │               │               │             │          │
   │             │             ├─ZRANGE──────>│                │               │               │             │          │
   │             │             │<─Matched IDs─┤                │               │               │             │          │
   │             │             ├─Publish Triggered (alert.AlertTriggered.v1)  │               │             │          │
   │             │             │─────────────────────────────>│               │               │             │          │
   │             │             │             │                ├─UPDATE status─>│               │             │          │
   │             │             │             │                │               │               ├─Consume─────>│          │
   │             │             │             ├─SET NX Dedup───────────────────────────────────>│             │          │
   │             │             │             │                │               │               ├─Send Push───>│          │
   │             │             │             │                │               │               │             ├─Deliver─>│
```

## SECTION 10 — Failure Mode Analysis

| # | Failure | Trigger | Detection | System Response | User-Visible | RTO |
|---|---------|---------|-----------|-----------------|--------------|-----|
| 1 | FCM service down | Google outage | API 500s | Fallback to IN_APP push only | Push delayed | N/A |
| 2 | APNs service down | Apple outage | API 500s | Fallback to IN_APP push only | Push delayed | N/A |
| 3 | Valkey restart | OOM/Crash | Monitor down | Rebuild from PG | Alerts missed for ms | <30s |
| 4 | Duplicate trigger | Race condition | Logs | Suppressed by Valkey dedup key | No | 0 |
| 5 | Eval missed | Consumer lag | Prom alert | Auto-scale EGXMarketData pods | Delayed alert | 10s |
| 6 | Kafka publish fail | Network issue | Produce err | Retry internally (idempotent) | None | 5s |
| 7 | DB conn exhausted | High load | PgBouncer | Reject non-critical queries | Create fails | 1m |
| 8 | Wrong language | Data error | - | None (uses default en) | English push | N/A |
| 9 | Precision mismatch | Float vs Dec | Log diff | Use strict Decimal string parsing | None | 0 |
| 10| FCM token invalid | Token expired | FCM 404 | Mark token invalid in DB | None | 0 |
| 11| User uninstalled | Device gone | FCM Unreg | Mark token inactive | None | 0 |
| 12| Cooldown bypass | Race condition | - | Valkey SET NX prevents this | None | 0 |

### Exactly-Once Delivery Guarantee Design
```python
# Kafka Producer Configuration
conf = {
    'bootstrap.servers': 'kafka:9092',
    'acks': 'all',
    'enable.idempotence': True,
    'max.in.flight.requests.per.connection': 5
}
```

## SECTION 11 — Performance Budget
- Target: <100ms from tick arrival to FCM dispatch.

| Step | P50 | P95 | P99 |
|---|---|---|---|
| Tick arrival to Valkey lookup | 2ms | 5ms | 10ms |
| Valkey ZRANGEBYSCORE | 1ms | 3ms | 5ms |
| Kafka publish AlertTriggered | 5ms | 15ms | 30ms |
| AlertRule state update PostgreSQL | 5ms | 20ms | 50ms |
| Dedup check Valkey | 1ms | 2ms | 5ms |
| FCM API call | 50ms | 200ms | 500ms |
| **Total** | **64ms** | **245ms** | **600ms** |

**Math:** 1M alerts across 300 tickers = 3,333 alerts/ticker. ZRANGEBYSCORE per tick = O(log 3,333 + k) ≈ O(12 + k) operations. Easily handles 10k ops/sec.

## SECTION 12 — Alert Lifecycle Management

```text
ACTIVE ──> TRIGGERED (condition met)
ACTIVE ──> EXPIRED (expires_at reached or max_triggers reached)
ACTIVE ──> PAUSED (user action)
ACTIVE ──> DELETED (user action)
TRIGGERED ──> ACTIVE (re-arm)
TRIGGERED ──> EXPIRED (max_triggers reached)
```

```typescript
export interface BulkAlertActionRequest {
    ids: string[];
    action: "PAUSE" | "RESUME" | "DELETE";
}
```

## SECTION 13 — SLO Compliance
- **SLO-ALERT-001:** P99 alert delivery < 5 seconds.
  ```promql
  histogram_quantile(0.99, rate(tradeora_alert_fcm_response_duration_seconds_bucket[5m]))
  ```
- **SLO-ALERT-002:** 100% evaluation coverage.
- **SLO-ALERT-003:** FCM success ≥ 99.0%.

## SECTION 14 — Observability
### Grafana Dashboard Panels:
1. `sum(tradeora_alert_rules_total{status="ACTIVE"}) by (alert_type)`
2. `rate(tradeora_alert_triggered_total[1m])`
3. `sum(rate(tradeora_alert_delivery_failures_total[5m])) / sum(rate(tradeora_alert_delivery_total[5m]))`
4. `histogram_quantile(0.99, rate(tradeora_alert_delivery_duration_seconds_bucket[5m]))`
5. `rate(tradeora_alert_fcm_failures[5m])`

```yaml
groups:
- name: Alerts
  rules:
  - alert: AlertDeliveryHighFailureRate
    expr: rate(tradeora_alert_delivery_failures_total[5m]) / rate(tradeora_alert_delivery_total[5m]) > 0.01
    for: 5m
```

## SECTION 15 — Test Strategy
- **Unit Tests:** 15 test cases for Price Alert Evaluation covering exact matches, jumps, decimal precision.
- **Integration Tests:** Full pipeline mock (Tick -> Valkey -> Kafka -> Mock FCM).
- **Load Test (k6):**
  ```javascript
  import { check } from 'k6';
  import http from 'k6/http';
  export default function () {
    const res = http.post('http://localhost:8000/api/v1/alerts', payload);
    check(res, { 'status was 201': (r) => r.status == 201 });
  }
  ```
- **Chaos Scenarios:** Kill FCM mock, trigger Valkey restart mid-tick.
