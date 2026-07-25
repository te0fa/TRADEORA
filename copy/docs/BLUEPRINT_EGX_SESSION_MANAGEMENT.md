# BLUEPRINT: EGX Session Management
**Document ID:** BLUEPRINT-EGX-SESSION-001  
**Version:** 2.0.0  
**Status:** ACTIVE  
**Authority:** Project Constitution Article 15 (Market Data Integrity) & Article 22 (Session Governance)  
**Last Updated:** 2026-07-24  
**Classification:** INTERNAL — Architecture Team  
**Owner:** Platform Engineering  

---

## Section 1 — Blueprint Authority & Scope

This blueprint defines the architecture and state management for the EGX (Egyptian Exchange) trading session. The authority for this architecture is derived directly from the Project Constitution, specifically Article 15 (Market Data Integrity) and Article 22 (Session Governance).

The EGX trading session schedule follows the Egyptian working week: Sunday through Thursday, from 09:30 to 15:00 EGT (Egypt Time). EGT is UTC+2 during standard time and UTC+3 during Daylight Saving Time (DST).

The session includes a pre-open window from 08:00 to 09:29 EGT for cache warming, price discovery, and feed connection establishment.

**Operations gated by session state (20 operations):**
1. Real-time price display
2. AI recommendation generation
3. Price alert evaluation
4. Portfolio NAV calculation
5. Historical data access
6. User onboarding/registration
7. Financial news display
8. Subscription management
9. Corporate action display
10. Risk questionnaire
11. Market order placement
12. Watchlist management
13. Sector analysis view
14. Technical chart display
15. Batch AI school training
16. EOD data pipeline
17. Compliance report generation
18. Admin holiday calendar edit
19. Data archival pipeline
20. Push notification delivery

**Ramadan Schedule Variant:**
During the holy month of Ramadan, the trading sessions may be shortened by 1 hour (typically opening at 10:00 instead of 09:30 or closing earlier). This adjustment is fully configurable via the `ramadan_adjustment_minutes` property.

**Legal Basis:**
The session governance defined herein complies with the Egyptian Financial Regulatory Authority (FRA) capital markets regulation and the official EGX trading rules regarding trading hours, market halts, and data dissemination.

---

## Section 2 — EGX Session States

The trading day is modeled as a state machine with the following states:

### 1. PRE_OPEN
- **Enum Value:** `PRE_OPEN`
- **Time Window:** 08:00 - 09:29 EGT
- **Active Subsystems:** Market data feeds connected, cache warming active, historical data access.
- **Blocked Operations:** AI recommendations, live trading, NAV calculation.
- **Kafka Event:** `market.egx.SessionStateChanged.v1` (to: PRE_OPEN)
- **Valkey Key:** `SET market:egx:session:state PRE_OPEN`

### 2. OPEN
- **Enum Value:** `OPEN`
- **Time Window:** 09:30 - 14:44 EGT
- **Active Subsystems:** All systems active, full AI recommendations, NAV calculation running, price alerts active, market order placement.
- **Blocked Operations:** Batch AI training, EOD pipelines.
- **Kafka Event:** `market.egx.SessionStateChanged.v1` (to: OPEN)
- **Valkey Key:** `SET market:egx:session:state OPEN`

### 3. PRE_CLOSE
- **Enum Value:** `PRE_CLOSE`
- **Time Window:** 14:45 - 15:00 EGT
- **Active Subsystems:** Close auction period, existing price alerts.
- **Blocked Operations:** New position recommendations restricted, new order placement restricted (Phase 2).
- **Kafka Event:** `market.egx.SessionStateChanged.v1` (to: PRE_CLOSE)
- **Valkey Key:** `SET market:egx:session:state PRE_CLOSE`

### 4. CLOSED
- **Enum Value:** `CLOSED`
- **Time Window:** 15:00 - 07:59 next day EGT
- **Active Subsystems:** Historical data access, EOD batch processing, AI batch processing, data archival.
- **Blocked Operations:** Real-time data feeds, AI live recommendations.
- **Kafka Event:** `market.egx.SessionStateChanged.v1` (to: CLOSED)
- **Valkey Key:** `SET market:egx:session:state CLOSED`

### 5. WEEKEND
- **Enum Value:** `WEEKEND`
- **Time Window:** Friday - Saturday
- **Active Subsystems:** Jumu'ah Friday prayer awareness, weekend batch jobs.
- **Blocked Operations:** All EGX trading operations.
- **Kafka Event:** `market.egx.SessionStateChanged.v1` (to: WEEKEND)
- **Valkey Key:** `SET market:egx:session:state WEEKEND`

### 6. HOLIDAY
- **Enum Value:** `HOLIDAY`
- **Time Window:** Configurable via calendar
- **Active Subsystems:** EGX official holidays bypass weekend check.
- **Blocked Operations:** All EGX trading operations.
- **Kafka Event:** `market.egx.SessionStateChanged.v1` (to: HOLIDAY)
- **Valkey Key:** `SET market:egx:session:state HOLIDAY`

---

## Section 3 — Session State Machine Transitions

### 1. CLOSED → PRE_OPEN
- **Trigger:** Kubernetes CronJob `session-transition-pre-open` running at 05:00 UTC (08:00 EGT Sunday-Thursday, configurable).
- **System Actions:** Start pre-open data feeds, warm AI model caches, load holiday calendar, initialize NAV queues.
- **Services Notified:** MarketDataIngestion, AIRecommendationEngine, PortfolioNAV, PriceAlertEvaluator, NotificationDelivery.
- **Feature Flags Affected:** `market_data_live=true`, `ai_recommendations_enabled=false`.
- **Kafka Events:** `market.egx.SessionStateChanged.v1` with payload `{from: "CLOSED", to: "PRE_OPEN"}`.
- **Valkey:** `SET market:egx:session:state PRE_OPEN`

### 2. PRE_OPEN → OPEN
- **Trigger:** Triggers at 09:30 EGT.
- **System Actions:** Enable AI recommendations, start NAV calculation loop, activate price alerts, publish SessionOpened event. Runs the session open checklist (8 automated checks).
- **Services Notified:** AIRecommendationEngine, PortfolioNAV, PriceAlertEvaluator.
- **Feature Flags:** `ai_recommendations_enabled=true`, `price_alerts_active=true`, `nav_calculation_running=true`.
- **Kafka Events:** `market.egx.SessionOpened.v1`, `market.egx.SessionStateChanged.v1` with payload `{from: "PRE_OPEN", to: "OPEN"}`.
- **Valkey:** `SET market:egx:session:state OPEN`

### 3. OPEN → PRE_CLOSE
- **Trigger:** Triggers at 14:45 EGT.
- **System Actions:** Send user alerts about close auction, restrict new order recommendations.
- **Services Notified:** NotificationDelivery, AIRecommendationEngine.
- **Kafka Events:** `market.egx.PreCloseAlert.v1`, `market.egx.SessionStateChanged.v1` with payload `{from: "OPEN", to: "PRE_CLOSE"}`.
- **Valkey:** `SET market:egx:session:state PRE_CLOSE`

### 4. PRE_CLOSE → CLOSED
- **Trigger:** Triggers at 15:00 EGT.
- **System Actions:** Stop live data feeds, publish session summary, trigger EOD batch pipeline.
- **EOD Actions:** NAV reconciliation, session summary generation, data archival, compliance reports execution.
- **Kafka Events:** `market.egx.SessionClosed.v1`, `market.egx.SessionStateChanged.v1` with payload `{from: "PRE_CLOSE", to: "CLOSED"}`.
- **Valkey:** `SET market:egx:session:state CLOSED`

### 5. ANY → HOLIDAY
- **Source:** Holiday calendar loaded from admin API.
- **Behavior:** Treated effectively as CLOSED, completely skips session transitions for the day.
- **Notification:** Push notification sent day before.
- **Kafka Events:** `market.egx.SessionStateChanged.v1` with payload `{from: "ANY", to: "HOLIDAY"}`.
- **Valkey:** `SET market:egx:session:state HOLIDAY`

---

## Section 4 — MarketSchedule Service Architecture

### Python Implementation

```python
# market_schedule_service.py
from enum import Enum
from datetime import datetime, date, time
from zoneinfo import ZoneInfo
from decimal import Decimal
from dataclasses import dataclass
from typing import Optional, List
from uuid import uuid4
import json
import logging

EGYPT_TZ = ZoneInfo('Africa/Cairo')  # UTC+2 standard, UTC+3 DST
logger = logging.getLogger(__name__)

class SessionState(str, Enum):
    PRE_OPEN = 'PRE_OPEN'
    OPEN = 'OPEN'
    PRE_CLOSE = 'PRE_CLOSE'
    CLOSED = 'CLOSED'
    WEEKEND = 'WEEKEND'
    HOLIDAY = 'HOLIDAY'

@dataclass
class SessionSchedule:
    pre_open_start: time = time(8, 0)    # 08:00 EGT
    open_start: time = time(9, 30)       # 09:30 EGT
    pre_close_start: time = time(14, 45) # 14:45 EGT
    close_time: time = time(15, 0)       # 15:00 EGT
    ramadan_adjustment_minutes: int = 0  # -60 during Ramadan
    trading_days: tuple = (6, 0, 1, 2, 3)  # Sun=6, Mon=0, Tue=1, Wed=2, Thu=3

class SessionTransitionConflict(Exception):
    pass

class MarketScheduleService:
    VALKEY_SESSION_KEY = 'market:egx:session:state'
    VALKEY_LOCK_KEY = 'market:egx:session:transition:lock'
    LOCK_TTL_SECONDS = 30
    
    def __init__(self, valkey_client, kafka_producer, holiday_repo):
        self.valkey = valkey_client
        self.kafka = kafka_producer
        self.holidays = holiday_repo
        self.schedule = SessionSchedule()
    
    def _adjust_time(self, original_time: time, minutes_adjustment: int) -> time:
        # Helper to adjust time by minutes (simplified for blueprint)
        if minutes_adjustment == 0:
            return original_time
        total_minutes = original_time.hour * 60 + original_time.minute + minutes_adjustment
        return time(total_minutes // 60, total_minutes % 60)

    def get_current_session_state(self) -> SessionState:
        now_egt = datetime.now(EGYPT_TZ)
        
        # Check holiday first (highest priority)
        if self.holidays.is_holiday(now_egt.date()):
            return SessionState.HOLIDAY
        
        # Check weekend (Friday=4, Saturday=5 in Python weekday)
        if now_egt.weekday() in (4, 5):  # Friday, Saturday
            return SessionState.WEEKEND
        
        current_time = now_egt.time()
        
        # Apply Ramadan adjustment
        adj = self.schedule.ramadan_adjustment_minutes
        open_start = self._adjust_time(self.schedule.open_start, adj)
        pre_close_start = self._adjust_time(self.schedule.pre_close_start, adj)
        close_time = self._adjust_time(self.schedule.close_time, adj)
        
        if current_time >= close_time or current_time < self.schedule.pre_open_start:
            return SessionState.CLOSED
        elif current_time >= pre_close_start:
            return SessionState.PRE_CLOSE
        elif current_time >= open_start:
            return SessionState.OPEN
        else:
            return SessionState.PRE_OPEN
    
    def transition_to(self, new_state: SessionState) -> bool:
        """Acquire distributed lock and execute state transition."""
        lock_acquired = self.valkey.set(
            self.VALKEY_LOCK_KEY, 
            '1', 
            nx=True,  # SETNX semantics
            ex=self.LOCK_TTL_SECONDS
        )
        if not lock_acquired:
            raise SessionTransitionConflict('Another node is transitioning session state')
        
        try:
            current_val = self.valkey.get(self.VALKEY_SESSION_KEY)
            current = SessionState(current_val.decode('utf-8')) if current_val else SessionState.CLOSED
            
            if current == new_state:
                logger.info(f"Session already in state {new_state}, skipping transition.")
                return True
                
            self._publish_transition_event(current, new_state)
            self.valkey.set(self.VALKEY_SESSION_KEY, new_state.value)
            logger.info(f"Successfully transitioned session from {current} to {new_state}")
            return True
        finally:
            self.valkey.delete(self.VALKEY_LOCK_KEY)
    
    def _publish_transition_event(self, from_state: SessionState, to_state: SessionState):
        event = {
            'eventId': str(uuid4()),
            'eventType': 'market.egx.SessionStateChanged.v1',
            'occurredAt': datetime.now(EGYPT_TZ).isoformat(),
            'payload': {
                'from': from_state.value,
                'to': to_state.value,
                'sessionDate': date.today().isoformat(),
                'exchange': 'EGX',
                'transitionSource': 'SCHEDULED'
            }
        }
        self.kafka.produce('market.egx.SessionStateChanged.v1', json.dumps(event).encode('utf-8'))
```

### TypeScript Implementation

```typescript
// market-schedule.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectValkey } from '../valkey/valkey.module';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { HolidayRepository } from '../holidays/holiday.repository';
import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';

export enum SessionState {
  PRE_OPEN = 'PRE_OPEN',
  OPEN = 'OPEN',
  PRE_CLOSE = 'PRE_CLOSE',
  CLOSED = 'CLOSED',
  WEEKEND = 'WEEKEND',
  HOLIDAY = 'HOLIDAY',
}

export const SESSION_KEY = 'market:egx:session:state';
export const LOCK_KEY = 'market:egx:session:transition:lock';

class SessionTransitionConflictException extends Error {
  constructor() {
    super('Another node is transitioning session state');
  }
}

@Injectable()
export class MarketScheduleService {
  private readonly EGYPT_TZ = 'Africa/Cairo';
  private readonly logger = new Logger(MarketScheduleService.name);
  
  constructor(
    @InjectValkey() private readonly valkey: any,
    private readonly kafka: KafkaProducerService,
    private readonly holidays: HolidayRepository
  ) {}
  
  async getCurrentSessionState(): Promise<SessionState> {
    const now = DateTime.now().setZone(this.EGYPT_TZ);
    
    const isHoliday = await this.holidays.isHoliday(now.toISODate());
    if (isHoliday) {
      return SessionState.HOLIDAY;
    }
    
    // 1-indexed, 1=Monday, ..., 5=Friday, 6=Saturday
    if (now.weekday === 5 || now.weekday === 6) {
      return SessionState.WEEKEND;
    }
    
    const preOpen = now.set({ hour: 8, minute: 0, second: 0, millisecond: 0 });
    const open = now.set({ hour: 9, minute: 30, second: 0, millisecond: 0 });
    const preClose = now.set({ hour: 14, minute: 45, second: 0, millisecond: 0 });
    const close = now.set({ hour: 15, minute: 0, second: 0, millisecond: 0 });
    
    if (now >= close || now < preOpen) return SessionState.CLOSED;
    if (now >= preClose) return SessionState.PRE_CLOSE;
    if (now >= open) return SessionState.OPEN;
    return SessionState.PRE_OPEN;
  }
  
  async transitionTo(newState: SessionState): Promise<void> {
    const lockAcquired = await this.valkey.set(
      LOCK_KEY, '1', 'NX', 'EX', 30
    );
    if (!lockAcquired) {
      throw new SessionTransitionConflictException();
    }
    
    try {
      const currentVal = await this.valkey.get(SESSION_KEY);
      const current = currentVal ? (currentVal as SessionState) : SessionState.CLOSED;
      
      if (current === newState) return;
      
      await this.publishTransitionEvent(current, newState);
      await this.valkey.set(SESSION_KEY, newState);
    } finally {
      await this.valkey.del(LOCK_KEY);
    }
  }
  
  private async publishTransitionEvent(from: SessionState, to: SessionState): Promise<void> {
    const event = {
      eventId: uuidv4(),
      eventType: 'market.egx.SessionStateChanged.v1',
      occurredAt: DateTime.now().setZone(this.EGYPT_TZ).toISO(),
      payload: {
        from,
        to,
        sessionDate: DateTime.now().setZone(this.EGYPT_TZ).toISODate(),
        exchange: 'EGX',
        transitionSource: 'SCHEDULED'
      }
    };
    await this.kafka.produce('market.egx.SessionStateChanged.v1', JSON.stringify(event));
  }
}
```

### Clock Drift Protection
NTP sync checks are performed via an OS-level integration script to ensure the system clock remains accurate. A drift threshold of 500ms is enforced. If the drift is higher, the process will fail health checks and prevent session transition.

---

## Section 5 — Session State Distribution

State distribution is critical for microservices to behave consistently according to market hours.

1. **MarketSchedule service owns canonical state.** No other service is authorized to compute or mutate the session state independently.
2. **State stored in Valkey:** The key `market:egx:session:state` contains the current state. It has **no TTL** because the market state does not expire; it only transitions. If a service needs to know the state immediately on boot, it can confidently read this key without worrying about expiration.
3. **Kafka Event Broadcasting:** `market.egx.SessionStateChanged.v1` is published on every successful transition.
4. **Subscription and Caching:** Microservices subscribe to this Kafka topic and maintain a local in-memory representation.
5. **Health Checks:** Microservices expose `/health/session` showing what they think the session state is. This allows external monitoring to detect divergent state.
6. **Reconciliation:** On startup, services read from Valkey to hydrate their cache before beginning to consume Kafka messages.

### Python Kafka Consumer Example

```python
# session_state_consumer.py
import json
import asyncio
from aiokafka import AIOKafkaConsumer
import valkey
from enum import Enum

class SessionState(str, Enum):
    PRE_OPEN = 'PRE_OPEN'
    OPEN = 'OPEN'
    PRE_CLOSE = 'PRE_CLOSE'
    CLOSED = 'CLOSED'
    WEEKEND = 'WEEKEND'
    HOLIDAY = 'HOLIDAY'

class SessionStateCache:
    def __init__(self, valkey_client):
        self.state = SessionState.CLOSED
        self.valkey = valkey_client
        self._hydrate_from_valkey()
        
    def _hydrate_from_valkey(self):
        val = self.valkey.get('market:egx:session:state')
        if val:
            self.state = SessionState(val.decode('utf-8'))
            
    def update(self, new_state: SessionState):
        self.state = new_state
        print(f"Local cache updated to {self.state}")

async def consume_session_events():
    v_client = valkey.Valkey(host='localhost', port=6379)
    cache = SessionStateCache(v_client)
    
    consumer = AIOKafkaConsumer(
        'market.egx.SessionStateChanged.v1',
        bootstrap_servers='localhost:9092',
        group_id='ai-recommendation-engine-group'
    )
    
    await consumer.start()
    try:
        async for msg in consumer:
            event = json.loads(msg.value.decode('utf-8'))
            new_state_str = event['payload']['to']
            cache.update(SessionState(new_state_str))
    finally:
        await consumer.stop()

if __name__ == '__main__':
    asyncio.run(consume_session_events())
```

---

## Section 6 — Session-Gated Operations Matrix

| Operation | PRE_OPEN | OPEN | PRE_CLOSE | CLOSED | WEEKEND | HOLIDAY |
|---|---|---|---|---|---|---|
| Real-time price display | Partial (delayed) | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| AI recommendation generation | ❌ | ✅ | ⚠️ Close-only | ❌ | ❌ | ❌ |
| Price alert evaluation | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Portfolio NAV calculation | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Historical data access | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| User onboarding/registration | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Financial news display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Subscription management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Corporate action display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Risk questionnaire | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Market order placement | ❌ | ✅ | ⚠️ Phase 2 | ❌ | ❌ | ❌ |
| Watchlist management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sector analysis view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Technical chart display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Batch AI school training | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| EOD data pipeline | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Compliance report generation | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Admin holiday calendar edit | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Data archival pipeline | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Push notification delivery | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Session Gate Middleware

```python
# session_gate.py
from functools import wraps
from typing import Callable, Any

class SessionGateViolation(Exception):
    def __init__(self, operation: str, current_state: Any, allowed_states: tuple):
        super().__init__(f"Operation '{operation}' denied in state {current_state}. Allowed: {allowed_states}")

def get_session_state_from_cache():
    # Typically injected or accessed via global singleton in actual app
    return SessionState.OPEN 

def require_session_state(*allowed_states: SessionState):
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current = get_session_state_from_cache()
            if current not in allowed_states:
                raise SessionGateViolation(
                    operation=func.__name__,
                    current_state=current,
                    allowed_states=allowed_states
                )
            return func(*args, **kwargs)
        return wrapper
    return decorator

@require_session_state(SessionState.OPEN, SessionState.PRE_CLOSE)
def generate_ai_recommendation(ticker: str):
    return {"ticker": ticker, "action": "BUY"}
```

---

## Section 7 — EGX Data Feed Integration

The market data ingestion architecture relies on a primary FIX feed and a backup WebSocket feed.
- **Primary Feed:** EGX direct FIX connection via Leased Line.
- **Backup Feed:** Data vendor WebSocket API over public internet.
- **Protocol Handler:** QuickFIX/J (or equivalent Python wrapper) processes messages.
  - Quote: `Tag 35=D` (actually usually X or S, but per spec Quote=Tag 35=D / standard is X, will follow specific FIX dialiect if needed, simplified here)
  - Trade: `Tag 35=V` (Market Data Request)
  - Status: `Tag 35=f` (Security Status)

- **Sequence number tracking:** Gap detection is built into QuickFIX. Missing sequences trigger ResendRequests (`Tag 35=2`).
- **Data Quality Checks:** ±20% daily move triggers automated review and marks price as suspect.
- **Failover:** Switchover within 5 seconds to backup if heartbeat timeout exceeds threshold.
- **Synthetic Ticks:** During complete outage, last known price + 'STALE' flag is generated to keep UI aware.

### FIX Message Parsing Example

```python
import quickfix as fix
from decimal import Decimal
import logging

class PriceSanityError(Exception):
    pass

class EGXFIXHandler(fix.Application):
    def __init__(self, kafka_producer):
        super().__init__()
        self.kafka_producer = kafka_producer
        self.logger = logging.getLogger(__name__)

    def onCreate(self, sessionID):
        pass

    def onLogon(self, sessionID):
        self.logger.info(f"Logon successful for {sessionID}")

    def onLogout(self, sessionID):
        self.logger.info(f"Logout for {sessionID}")

    def toAdmin(self, message, sessionID):
        pass

    def fromAdmin(self, message, sessionID):
        pass

    def toApp(self, message, sessionID):
        pass

    def fromApp(self, message, sessionID):
        try:
            msg_type = fix.MsgType()
            message.getHeader().getField(msg_type)
            
            if msg_type.getValue() == fix.MsgType_Quote:  # Tag 35=S in standard FIX
                self._handle_quote(message)
            elif msg_type.getValue() == fix.MsgType_Trade:  # Tag 35=V  
                self._handle_trade(message)
        except fix.FieldNotFound as e:
            self.logger.error(f"Field not found: {e}")

    def _handle_quote(self, message):
        symbol = fix.Symbol()
        bid_px = fix.BidPx()
        ask_px = fix.AskPx()
        
        message.getField(symbol)
        message.getField(bid_px)
        message.getField(ask_px)
        
        # Price sanity check
        bid = Decimal(str(bid_px.getValue()))
        ask = Decimal(str(ask_px.getValue()))
        
        if ask < bid:
            raise PriceSanityError(f'Ask {ask} < Bid {bid} for {symbol.getValue()}')
        
        # Publish to Kafka
        self.publish_tick_event(symbol.getValue(), bid, ask)

    def publish_tick_event(self, symbol, bid, ask):
        event = {
            "symbol": symbol,
            "bid": str(bid),
            "ask": str(ask)
        }
        self.kafka_producer.produce('market.egx.ticks.v1', json.dumps(event).encode('utf-8'))
```

---

## Section 8 — Session Open Procedure (Detailed)

Before transitioning to the `OPEN` state, the system executes an automated checklist. 

```python
# session_open_procedure.py
import asyncio
from dataclasses import dataclass

@dataclass
class CheckResult:
    failed: bool
    is_blocking: bool
    reason: str = ""

@dataclass
class SessionOpenResult:
    success: bool
    reason: str = ""

    @classmethod
    def ABORTED(cls, reason: str):
        return cls(success=False, reason=reason)

    @classmethod
    def SUCCESS(cls):
        return cls(success=True)

class SessionOpenProcedure:
    def __init__(self, market_schedule):
        self.market_schedule = market_schedule

    async def execute_open_checklist(self) -> SessionOpenResult:
        checks = [
            self._check_all_services_healthy,
            self._check_egx_feed_connected,
            self._check_holiday_calendar_loaded,
            self._check_ai_model_warm,
            self._check_top_tickers_cached,
            self._check_alert_rules_loaded,
            self._check_nav_queue_initialized,
            self._check_ntp_drift,
        ]
        
        results = []
        for check in checks:
            result = await check()
            results.append(result)
            if result.failed and result.is_blocking:
                return SessionOpenResult.ABORTED(reason=result.reason)
        
        # Transition to OPEN
        await self.market_schedule.transition_to(SessionState.OPEN)
        return SessionOpenResult.SUCCESS()

    # Checklist implementations (stubs for architecture blueprint)
    async def _check_all_services_healthy(self) -> CheckResult:
        # Pings Kubernetes API for deployment health. Blocking. 5s timeout.
        return CheckResult(failed=False, is_blocking=True)

    async def _check_egx_feed_connected(self) -> CheckResult:
        # Verifies FIX session is logged on. Blocking. 5s timeout.
        return CheckResult(failed=False, is_blocking=True)

    async def _check_holiday_calendar_loaded(self) -> CheckResult:
        # Ensures Valkey contains calendar. Blocking. 2s timeout.
        return CheckResult(failed=False, is_blocking=True)

    async def _check_ai_model_warm(self) -> CheckResult:
        # Queries AI inference server readiness. Non-blocking (can start late). 10s timeout.
        return CheckResult(failed=False, is_blocking=False)

    async def _check_top_tickers_cached(self) -> CheckResult:
        # Ensures EGX30 components are in memory. Non-blocking. 5s timeout.
        return CheckResult(failed=False, is_blocking=False)

    async def _check_alert_rules_loaded(self) -> CheckResult:
        # Ensures user alerts are compiled. Blocking. 15s timeout.
        return CheckResult(failed=False, is_blocking=True)

    async def _check_nav_queue_initialized(self) -> CheckResult:
        # Checks RabbitMQ/Kafka queue for NAV processing. Blocking. 5s timeout.
        return CheckResult(failed=False, is_blocking=True)

    async def _check_ntp_drift(self) -> CheckResult:
        # Verifies system clock against NTP <500ms. Blocking. 2s timeout.
        return CheckResult(failed=False, is_blocking=True)
```

---

## Section 9 — Session Close Procedure

The End Of Day (EOD) procedure is strictly triggered at 15:00 EGT.

1. **Stop Live Data Feeds (Immediate):** The FIX ingestion service immediately discards any incoming ticks and disconnects or idles the connection.
2. **Publish Session Summary:** Generates a comprehensive summary report of the day.
3. **Trigger EOD Batch Pipeline:** Emits `data.pipeline.BatchJobTriggered.v1`.
4. **NAV Reconciliation:** Compares live intraday NAV estimations against official EOD prices.
5. **Compliance Report Generation:** Triggers FRA daily reporting for trade compliance and market surveillance.
6. **Alert Rule State Cleanup:** Clears all intraday state flags for price alerts from Valkey.
7. **Cache Flush Strategy:** Keeps historical analytical keys intact, but flushes volatile live-only keys (e.g., current ask/bid sizes).

### Session Summary JSON Schema

```json
{
  "eventType": "market.egx.SessionClosed.v1",
  "sessionDate": "2026-07-24",
  "sessionDuration": "PT5H30M",
  "statistics": {
    "totalTicks": 2847263,
    "uniqueInstruments": 247,
    "circuitBreakersTriggered": 2,
    "feedFailovers": 0,
    "peakTicksPerSecond": 8423
  },
  "egxIndices": {
    "EGX30": { "open": "24150.50", "close": "24320.75", "change": "+0.71%" },
    "EGX70": { "open": "4102.30", "close": "4089.60", "change": "-0.31%" }
  }
}
```

---

## Section 10 — Circuit Breaker Integration

The platform handles external trading halts issued by the EGX.
- **Instrument-level:** EGX halts an instrument if it moves ±10%.
- **Index-level (Market-wide):** A ±5% move in EGX30 triggers a market-wide halt.

**System Response:**
- Marks instrument as `HALTED` in Valkey (`market:egx:instrument:{ticker}:status = HALTED`).
- AI recommendations halt for the affected instrument.
- Client applications subscribe to the status and show suspension notices.
- If market-wide, the entire session state transitions to `PRE_CLOSE` immediately.

```python
# circuit_breaker.py
from datetime import datetime
from zoneinfo import ZoneInfo
import json

EGYPT_TZ = ZoneInfo('Africa/Cairo')

class HaltReason:
    PRICE_LIMIT = "PRICE_LIMIT"
    EXCHANGE_ACTION = "EXCHANGE_ACTION"

class CircuitBreakerHandler:
    HALT_KEY_PATTERN = 'market:egx:instrument:{ticker}:status'
    HALT_TTL = 3600  # 1 hour max
    
    def __init__(self, valkey_client, kafka_producer):
        self.valkey = valkey_client
        self.kafka = kafka_producer
    
    async def handle_instrument_halt(self, ticker: str, reason: str):
        key = self.HALT_KEY_PATTERN.format(ticker=ticker)
        await self.valkey.set(key, 'HALTED', ex=self.HALT_TTL)
        
        event = {
            "ticker": ticker,
            "reason": reason,
            "halted_at": datetime.now(EGYPT_TZ).isoformat()
        }
        await self.kafka.produce('market.egx.InstrumentHalted.v1', json.dumps(event).encode('utf-8'))
        
    async def is_instrument_halted(self, ticker: str) -> bool:
        key = self.HALT_KEY_PATTERN.format(ticker=ticker)
        val = await self.valkey.get(key)
        return val == b'HALTED'
```

---

## Section 11 — Complete JSON Schemas

### SessionStateChanged Kafka Event
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SessionStateChanged",
  "type": "object",
  "required": ["eventId", "eventType", "schemaVersion", "occurredAt", "payload"],
  "properties": {
    "eventId": { "type": "string", "format": "uuid" },
    "eventType": { "type": "string", "const": "market.egx.SessionStateChanged.v1" },
    "schemaVersion": { "type": "string", "const": "1.0.0" },
    "occurredAt": { "type": "string", "format": "date-time" },
    "payload": {
      "type": "object",
      "required": ["from", "to", "sessionDate", "exchange", "transitionSource"],
      "properties": {
        "from": { "type": "string", "enum": ["PRE_OPEN", "OPEN", "PRE_CLOSE", "CLOSED", "WEEKEND", "HOLIDAY"] },
        "to": { "type": "string", "enum": ["PRE_OPEN", "OPEN", "PRE_CLOSE", "CLOSED", "WEEKEND", "HOLIDAY"] },
        "sessionDate": { "type": "string", "format": "date" },
        "exchange": { "type": "string", "const": "EGX" },
        "transitionSource": { "type": "string", "enum": ["SCHEDULED", "MANUAL", "CIRCUIT_BREAKER", "HOLIDAY"] }
      }
    }
  }
}
```

### Session Status API Response
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SessionStatusResponse",
  "type": "object",
  "required": ["status", "data"],
  "properties": {
    "status": { "type": "string", "const": "success" },
    "data": {
      "type": "object",
      "required": ["currentState", "nextTransition", "serverTime"],
      "properties": {
        "currentState": { "type": "string", "enum": ["PRE_OPEN", "OPEN", "PRE_CLOSE", "CLOSED", "WEEKEND", "HOLIDAY"] },
        "nextTransition": { "type": "string", "format": "date-time" },
        "serverTime": { "type": "string", "format": "date-time" }
      }
    }
  }
}
```

### Holiday Calendar Entry
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "HolidayCalendarEntry",
  "type": "object",
  "required": ["date", "name", "affectsTrading"],
  "properties": {
    "date": { "type": "string", "format": "date" },
    "name": { "type": "string" },
    "affectsTrading": { "type": "boolean" }
  }
}
```

### Session Health Check Response
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SessionHealthCheck",
  "type": "object",
  "required": ["healthy", "cachedState", "lastSync"],
  "properties": {
    "healthy": { "type": "boolean" },
    "cachedState": { "type": "string" },
    "lastSync": { "type": "string", "format": "date-time" }
  }
}
```

---

## Section 12 — Sequence Diagrams (ASCII)

### Session Open Sequence (08:00 PRE_OPEN + 09:30 OPEN)
```text
CronJob         MarketSchedule  Valkey          Kafka           AIEngine        DataFeed
   |                  |           |               |                |               |
   |--trigger 08:00-->|           |               |                |               |
   |                  |--SET PRE_OPEN------------>|                |               |
   |                  |--publish SessionStateChanged.v1---------->|                |
   |                  |                           |<-subscribe-----|               |
   |                  |                           |                |--update cache-|
   |                  |                           |                |               |
   |--trigger 09:30-->|                           |                |               |
   |                  |--run open checklist-------|                |               |
   |                  |<--checklist results-------|                |               |
   |                  |--SET OPEN---------------->|                |               |
   |                  |--publish SessionOpened.v1----------------->|               |
   |                  |                           |                |--enable recs--|
```

### Session Close Sequence (14:45 PRE_CLOSE + 15:00 CLOSED)
```text
CronJob         MarketSchedule  Kafka           DataFeed        BatchPipeline
   |                  |           |               |                |
   |--trigger 14:45-->|           |               |                |
   |                  |--SET PRE_CLOSE            |                |
   |                  |--publish SessionStateChanged.v1            |
   |                  |           |               |                |
   |--trigger 15:00-->|           |               |                |
   |                  |--SET CLOSED               |                |
   |                  |--publish SessionClosed.v1 |                |
   |                  |           |<-subscribe----|                |
   |                  |           |               |--stop feeds----|
   |                  |           |               |                |
   |                  |--publish BatchJobTriggered.v1------------->|
   |                  |           |               |                |--run EOD jobs-|
```

### Circuit Breaker Trigger and Resume
```text
EGX Feed        CircuitBreaker  Valkey          Kafka           ClientApp
   |                  |           |               |                |
   |--HALT MSG(FIX)-->|           |               |                |
   |                  |--SET HALTED-------------->|                |
   |                  |--publish InstrumentHalted.v1-------------->|
   |                  |           |               |<-subscribe-----|
   |                  |           |               |                |--show halt GUI|
   |                  |           |               |                |
   |--RESUME(FIX)---->|           |               |                |
   |                  |--DEL HALTED-------------->|                |
   |                  |--publish InstrumentResumed.v1------------->|
   |                  |           |               |<-subscribe-----|
   |                  |           |               |                |--resume GUI---|
```

---

## Section 13 — Failure Modes

| # | Failure Scenario | Detection | System Response | Recovery | SLO Impact |
|---|---|---|---|---|---|
| 1 | NTP clock drift >500ms | Startup health check | Log CRITICAL, alert ops, refuse transition | Manual time sync + service restart | Session open delayed |
| 2 | Kafka unavailable at session transition | Producer timeout | Retry 3x with exponential backoff, log to fallback store | Kafka recovery + replay from fallback | State distribution delayed |
| 3 | Primary EGX feed disconnected | TCP keepalive timeout | Automatic failover to backup feed within 5s | Primary reconnect attempt every 30s | Feed SLO: <30s gap allowed |
| 4 | Valkey unavailable | Connection error | Use in-memory fallback for reads, queue writes | Valkey recovery | State staleness |
| 5 | Session open checklist failure | Automated health check | Log blocking failure, send ops alert, delay OPEN | Manual investigation | OPEN transition delayed |
| 6 | Holiday calendar not loaded | Missing Valkey key | Default to non-holiday, alert ops | Reload calendar from database | Risk of incorrect trading day |
| 7 | Duplicate SessionStateChanged event | Kafka consumer dedup | Idempotent processing via event ID | No recovery needed | None |
| 8 | Distributed lock not released | Lock TTL expiry | Wait for TTL (30s), retry transition | Automatic (TTL) | Up to 30s transition delay |
| 9 | Timezone DST switch | NTP + EGYPT_TZ library | Use ZoneInfo library (auto DST) | Library update if bug | None if handled correctly |
| 10 | CronJob missed trigger | Prometheus alert | Manual trigger via admin API | Ops manual trigger | Session start delayed |
| 11 | Market-wide circuit breaker | EGX status message | Immediate PRE_CLOSE transition | EGX resume signal | All trading halted |
| 12 | Session state mismatch between services | Health check reconciliation | Alert + auto-reconcile from Valkey | Service restart or reconcile | Service inconsistency |

**Detailed Explanations:**
If NTP drift occurs (Scenario 1), the checklist fails because the precision of timestamps for trades is regulated by FRA. It's a hard block.
If Kafka goes down (Scenario 2), the transition happens locally and pushes to an SQLite fallback queue until Kafka is available again, ensuring zero data loss.
For Duplicate events (Scenario 7), all states transition uniformly and idempotently; an OPEN state transition applying to an already OPEN state is simply a no-op.

---

## Section 14 — SLO Compliance

| SLO | Metric | Target | Measurement | Alert Threshold |
|---|---|---|---|---|
| Session state propagation | Time from transition to all services updated | P99 <10s | Kafka consumer lag | >15s = WARNING, >30s = CRITICAL |
| First tick after OPEN | Time from 09:30 EGT to first tick received | <30s | Kafka topic timestamp | >30s = WARNING |
| Feed failover time | Time from primary disconnect to backup active | <5s | Custom metric | >5s = CRITICAL |
| Holiday calendar freshness | Calendar loaded before session day | By 07:00 EGT | Valkey key presence | Missing = CRITICAL |
| Session open checklist | All checks pass before OPEN transition | 100% | Checklist result metric | Any failure = CRITICAL |

### PromQL Alert Expressions

```promql
# Session state propagation SLO
alert: SessionStatePropagationSLOBreach
expr: kafka_consumer_group_lag{topic="market.egx.SessionStateChanged.v1"} > 100
for: 30s
labels:
  severity: critical
annotations:
  summary: "Session state not propagated within SLO"
  description: "Consumer lag {{ $value }} exceeds 100 messages"

# First tick after OPEN
alert: FirstTickAfterOpenMissed  
expr: (time() - market_data_last_tick_timestamp) > 30 
      and market_session_state == 2  # 2=OPEN
for: 30s
labels:
  severity: critical

# Feed Failover Time
alert: PrimaryFeedDisconnectTooLong
expr: egx_feed_disconnected_seconds > 5
for: 5s
labels:
  severity: critical
annotations:
  summary: "Backup failover took more than 5s"
```

---

## Section 15 — Observability

```python
# Prometheus metrics
from prometheus_client import Gauge, Counter, Histogram

# Session state (0=CLOSED, 1=PRE_OPEN, 2=OPEN, 3=PRE_CLOSE, 4=WEEKEND, 5=HOLIDAY)
market_session_state = Gauge(
    'market_session_state',
    'Current EGX session state',
    ['exchange']
)

# Tick rate
market_tick_rate = Gauge(
    'market_tick_rate_per_second',
    'Current EGX tick ingestion rate',
    ['exchange', 'ticker']
)

# Data freshness
market_data_last_tick_timestamp = Gauge(
    'market_data_last_tick_timestamp_seconds',
    'Unix timestamp of last tick received',
    ['exchange', 'ticker']
)

# Transition counter
session_transitions_total = Counter(
    'session_transitions_total',
    'Total session state transitions',
    ['from_state', 'to_state', 'exchange']
)

# Open procedure duration
session_open_procedure_duration = Histogram(
    'session_open_procedure_duration_seconds',
    'Duration of session open checklist',
    buckets=[1, 5, 10, 30, 60]
)
```

### Grafana Dashboard Panels:
1. **Session state indicator:** A Stat panel with large text showing current state (green for OPEN, gray for CLOSED).
2. **Tick rate time series:** A Time series panel mapping `market_tick_rate_per_second` over the last hour.
3. **Data freshness heatmap:** A heatmap indicating tick staleness across all major EGX30 components.
4. **Circuit breaker events:** Annotations overlaying the price chart showing exact halt and resume times.
5. **Session transition timeline:** A state timeline chart showing exactly when PRE_OPEN, OPEN, PRE_CLOSE triggered.

---

## Section 16 — Test Strategy

```python
# test_session_state_machine.py
import pytest
from datetime import datetime
from zoneinfo import ZoneInfo
from unittest.mock import Mock, patch

EGYPT_TZ = ZoneInfo('Africa/Cairo')

class TestSessionStateMachine:
    def test_open_state_at_930_egt(self):
        with patch('market_schedule_service.datetime') as mock_dt:
            mock_dt.now.return_value = datetime(2026, 7, 20, 9, 30, 0, tzinfo=EGYPT_TZ)
            service = MarketScheduleService(Mock(), Mock(), Mock())
            assert service.get_current_session_state() == SessionState.OPEN
    
    def test_pre_open_state_at_815_egt(self):
        with patch('market_schedule_service.datetime') as mock_dt:
            mock_dt.now.return_value = datetime(2026, 7, 20, 8, 15, 0, tzinfo=EGYPT_TZ)
            service = MarketScheduleService(Mock(), Mock(), Mock())
            assert service.get_current_session_state() == SessionState.PRE_OPEN
    
    def test_weekend_on_friday(self):
        # 2026-07-24 is a Friday
        with patch('market_schedule_service.datetime') as mock_dt:
            mock_dt.now.return_value = datetime(2026, 7, 24, 11, 0, 0, tzinfo=EGYPT_TZ)
            service = MarketScheduleService(Mock(), Mock(), Mock())
            assert service.get_current_session_state() == SessionState.WEEKEND
    
    def test_holiday_overrides_trading_day(self):
        holiday_repo = Mock()
        holiday_repo.is_holiday.return_value = True
        service = MarketScheduleService(Mock(), Mock(), holiday_repo=holiday_repo)
        with patch('market_schedule_service.datetime') as mock_dt:
            mock_dt.now.return_value = datetime(2026, 7, 20, 10, 0, 0, tzinfo=EGYPT_TZ)
            assert service.get_current_session_state() == SessionState.HOLIDAY
    
    def test_dst_transition_no_duplicate_session(self):
        """DST switch must not cause duplicate session open."""
        # Egypt moves to DST (UTC+3) on last Thursday of April
        with patch('market_schedule_service.datetime') as mock_dt:
            # During DST, 09:30 wall clock time still evaluates correctly via ZoneInfo
            mock_dt.now.return_value = datetime(2026, 5, 4, 9, 30, 0, tzinfo=EGYPT_TZ)
            service = MarketScheduleService(Mock(), Mock(), Mock())
            assert service.get_current_session_state() == SessionState.OPEN
    
    def test_ramadan_adjustment(self):
        service = MarketScheduleService(Mock(), Mock(), Mock())
        service.schedule.ramadan_adjustment_minutes = -60
        # Session should open at 08:30 instead of 09:30
        with patch('market_schedule_service.datetime') as mock_dt:
            mock_dt.now.return_value = datetime(2026, 3, 15, 8, 45, 0, tzinfo=EGYPT_TZ)
            assert service.get_current_session_state() == SessionState.OPEN

@pytest.mark.integration
class TestSessionTransitionWithKafka:
    def test_transition_publishes_kafka_event(self, kafka_container, valkey_container):
        # Full integration test with Testcontainers
        producer = setup_kafka(kafka_container)
        v_client = setup_valkey(valkey_container)
        service = MarketScheduleService(v_client, producer, Mock())
        
        service.transition_to(SessionState.OPEN)
        
        # Consume and assert
        events = consume_test_events(kafka_container, 'market.egx.SessionStateChanged.v1')
        assert len(events) == 1
        assert events[0]['payload']['to'] == 'OPEN'

@pytest.mark.chaos  
class TestChaosScenarios:
    def test_kafka_down_at_session_open(self):
        """Session must NOT open if Kafka is unavailable."""
        broken_kafka = Mock()
        broken_kafka.produce.side_effect = ConnectionError("Kafka down")
        service = MarketScheduleService(Mock(), broken_kafka, Mock())
        
        with pytest.raises(ConnectionError):
            service.transition_to(SessionState.OPEN)
    
    def test_feed_failover_during_session(self):
        """Failover triggered when primary keepalive fails."""
        feed = EGXDataFeed(primary_url="tcp://down", backup_url="tcp://up")
        feed.start()
        assert feed.active_connection == feed.backup_url
```

---

## Standard Footer
---
*This blueprint is a living document. All changes require Architecture Review Board approval.*
*Constitution Authority: Article 15 (Market Data Integrity), Article 22 (Session Governance)*
*Document Owner: Platform Engineering*  
*Review Cycle: Quarterly or on EGX rule changes*
