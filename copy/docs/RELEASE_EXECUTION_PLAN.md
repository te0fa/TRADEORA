# Tradeora Financial Operating System - Release Execution Plan
> Architecture Baseline: FREEZE v1.2 FINAL

## R1.0 Alpha: EGX + KYC/AML/PDPL + Portfolio + Subscription
### 1. Release Header
**Vision:** Deliver Alpha: EGX + KYC/AML/PDPL + Portfolio + Subscription within Months 1-3.

**Business Goals:**
- Establish foundational K8s infrastructure and CI/CD.
- Deploy core identity, KYC, AML, and PDPL compliance modules.
- Enable EGX portfolio management and watchlists.
- Implement foundational market calendar.
- Deliver Subscription and Billing components.
- Establish immutable WORM audit trails in MinIO.
- Release Flutter mobile app with Arabic RTL first.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX (Equities)**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| UserIdentity | Core | Manage authentication and sessions | New | Keycloak |
| KYCVerification | Compliance | Identity verification and liveness | New | UserIdentity |
| AMLScreening | Compliance | Sanctions and PEP screening | New | KYCVerification |
| PDPLCompliance | Compliance | Data privacy and right-to-be-forgotten | New | UserIdentity |
| Portfolio | Trading | User holdings and cash balances | New | UserIdentity, SecurityMaster |
| Position | Trading | Asset positions per portfolio | New | Portfolio |
| Transaction | Trading | Ledger of asset movements | New | Position |
| Watchlist | Trading | User-tracked securities | New | SecurityMaster |
| SecurityMaster | Market Data | Source of truth for instruments | New | None |
| MarketCalendar | Market Data | Trading sessions and holidays | New | None |
| Subscription | Billing | User tier management | New | UserIdentity |
| Billing | Billing | Invoicing and payment processing | New | Subscription |
| Notification | Core | SMS, Email, Push alerts | New | UserIdentity |
| AuditTrail | Compliance | Immutable event logging | New | Kafka |
| SessionStatus | Market Data | Real-time market status | New | MarketCalendar |

### 4. Implementation-Ordered Modules
**1. K8s Infrastructure**
- **Priority:** P0
- **Dependencies:** None
- **Complexity:** XL
- **Acceptance Criteria:** Cluster up, FluxCD synced, OPA gatekeeper active
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. PostgreSQL+Patroni**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** L
- **Acceptance Criteria:** HA setup, pgBouncer, backup to MinIO
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. Kafka+Karapace**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** L
- **Acceptance Criteria:** Schema registry active, 3 brokers, ACLs
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. MinIO WORM**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Compliance mode ON, retention policies set
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. OpenBao**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Secrets injected via mutating webhook
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**6. Keycloak**
- **Priority:** P0
- **Dependencies:** PostgreSQL
- **Complexity:** M
- **Acceptance Criteria:** OIDC flows working, OTP SMS integrated
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**7. Kong**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Ingress controller, rate limiting plugins
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**8. Unleash**
- **Priority:** P1
- **Dependencies:** PostgreSQL
- **Complexity:** S
- **Acceptance Criteria:** Feature flags toggleable without deploy
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**9. FluxCD**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** S
- **Acceptance Criteria:** GitOps sync block during 08:45-15:20
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**10. Prometheus stack**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Metrics server, Grafana, Alertmanager
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**11. identity-service**
- **Priority:** P0
- **Dependencies:** Keycloak
- **Complexity:** M
- **Acceptance Criteria:** JWT minting, session tracking
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**12. kyc-service**
- **Priority:** P0
- **Dependencies:** identity-service
- **Complexity:** L
- **Acceptance Criteria:** ID upload, Liveness, Maker-Checker
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**13. compliance-service**
- **Priority:** P0
- **Dependencies:** kyc-service
- **Complexity:** M
- **Acceptance Criteria:** AML webhook, PDPL logs
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**14. portfolio-service**
- **Priority:** P0
- **Dependencies:** identity-service
- **Complexity:** L
- **Acceptance Criteria:** Create portfolio, deposit mock funds
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**15. subscription-service**
- **Priority:** P1
- **Dependencies:** identity-service
- **Complexity:** M
- **Acceptance Criteria:** Plan selection, quotas
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**16. market-calendar-service**
- **Priority:** P0
- **Dependencies:** None
- **Complexity:** S
- **Acceptance Criteria:** EGX holidays API
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**17. notification-service**
- **Priority:** P1
- **Dependencies:** Kafka
- **Complexity:** M
- **Acceptance Criteria:** Push token registry, SMS sender
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| identity-service | NestJS/TS | New | UserIdentity | POST /auth/login<br>POST /auth/otp<br>GET /users/me | user.created.v1 | None | identity |
| kyc-service | NestJS/TS | New | KYCVerification | POST /kyc/upload<br>POST /kyc/liveness<br>GET /kyc/status | kyc.submitted.v1 | user.created.v1 | kyc |
| compliance-service | NestJS/TS | New | AMLScreening, PDPL | POST /aml/screen<br>POST /pdpl/erase<br>GET /pdpl/consent | aml.cleared.v1 | kyc.submitted.v1 | compliance |
| portfolio-service | NestJS/TS | New | Portfolio, Position | POST /portfolios<br>GET /portfolios<br>GET /portfolios/:id/positions | portfolio.created.v1 | user.created.v1 | portfolio |
| subscription-service | NestJS/TS | New | Subscription, Billing | GET /plans<br>POST /subscriptions<br>GET /subscriptions/me | subscription.active.v1 | user.created.v1 | subscription |

### 6. Database Changes
```sql
CREATE SCHEMA identity; -- User authentication data
CREATE TABLE identity.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA kyc; -- Verification documents and status
CREATE TABLE kyc.kyc_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA compliance; -- AML hits and PDPL requests
CREATE TABLE compliance.aml_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA portfolio; -- Holdings and ledgers
CREATE TABLE portfolio.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA subscription; -- Billing and plans
CREATE TABLE subscription.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/auth/login` | `{ "phone": "string" }` | `{ "token": "string" }` | None | OTP step 1 |
| GET | `/api/v1/portfolios` | `None` | `{ "portfolios": [] }` | Bearer | Lists user portfolios |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.identity.user.created.v1` | identity-service | kyc-service, portfolio | userId, phone, timestamp | BACKWARD | Infinite |
| `tradeora.kyc.verification.submitted.v1` | kyc-service | compliance-service | userId, documentId | BACKWARD | 1 Year |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-KYC-EXPIRY-CHECK | `0 2 * * *` | kyc-service | Flags expired IDs | Log Error | 3 retries |
| JOB-AML-REFRESH | `0 1 * * *` | compliance-service | Re-screens against new lists | Alert SecOps | No retry |
| JOB-SESSION-HEALTH | `*/5 * * * *` | market-calendar | Checks API connectivity | Alert DevOps | 1 min |

### 10. AI Engines
*No AI Engines active for this release.*

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| RegistrationScreen | `/register` | Phone, OTP, Passcode | Mandatory | EGX | New |
| NationalIDUploadScreen | `/kyc/id` | Camera OCR, Edge detection | Mandatory | EGX | New |
| LivenessCheckScreen | `/kyc/liveness` | Face tracking | Mandatory | EGX | New |
| KYCStatusScreen | `/kyc/status` | Pending/Rejected states | Mandatory | EGX | New |
| HomeScreen | `/home` | Dashboard, widgets | Mandatory | EGX | New |
| PortfolioScreen | `/portfolio` | Holdings list, PnL | Mandatory | EGX | New |

### 12. Infrastructure Changes
- **K8s Cluster**: Base orchestration
- **PostgreSQL**: Relational storage
- **Kafka**: Event bus
- **MinIO**: WORM compliance

### 13. Security Requirements
- WORM compliance strictly enforced
- OIDC for all user flows
- NetworkPolicies isolating DB from Ingress
- Secrets in OpenBao

### 14. Testing Strategy
- Unit: 80% coverage on core logic
- Integration: Testcontainers for Postgres/Kafka
- Load: 1000 VU login flow

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] KYC maker-checker flow approved by compliance
- [ ] WORM logs verified by auditor
- [ ] Pen-test zero critical findings

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R2.0 Beta: EGX + Forex market data + Technical indicators
### 1. Release Header
**Vision:** Deliver Beta: EGX + Forex market data + Technical indicators within Months 4-6.

**Business Goals:**
- Integrate EGX market data feeds via WebSocket.
- Integrate Forex pricing feeds (24/5) with 5 decimal precision.
- Implement scalable timeseries DB (TimescaleDB).
- Compute and serve OHLCV bars.
- Implement technical indicators (RSI, MACD, MA).
- Enhance frontend with real-time charting.
- Implement real-time alerting engine.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX (Equities), Forex (FX Major/Minor)**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| MarketDataGateway | Market Data | Ingest and normalize external feeds | New | SecurityMaster |
| Pricing | Market Data | Manage real-time quotes | New | MarketDataGateway |
| Timeseries | Analytics | OHLCV aggregation and storage | New | Pricing |
| TechnicalAnalysis | Analytics | Indicator computation | New | Timeseries |
| Alerting | Core | User defined price/indicator alerts | New | Pricing, TechnicalAnalysis |

### 4. Implementation-Ordered Modules
**1. Market Data WebSocket Clients**
- **Priority:** P0
- **Dependencies:** None
- **Complexity:** L
- **Acceptance Criteria:** Connect, reconnect, parse messages
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. TimescaleDB Setup**
- **Priority:** P0
- **Dependencies:** PostgreSQL
- **Complexity:** M
- **Acceptance Criteria:** Hypertables created, retention policies
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. market-data-service**
- **Priority:** P0
- **Dependencies:** Kafka
- **Complexity:** XL
- **Acceptance Criteria:** Publish ticks to Kafka at high throughput
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. pricing-service**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** Maintain latest price in Valkey
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. timeseries-service**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** Aggregate ticks to 1m, 5m, 1h, 1d
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**6. technical-analysis-service**
- **Priority:** P1
- **Dependencies:** timeseries-service
- **Complexity:** L
- **Acceptance Criteria:** Compute RSI, MACD on demand
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**7. alerting-service**
- **Priority:** P1
- **Dependencies:** pricing-service
- **Complexity:** M
- **Acceptance Criteria:** Evaluate conditions, trigger notifications
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| market-data-service | FastAPI/Python | New | MarketDataGateway | GET /health | None | None | None |
| pricing-service | NestJS/TS | New | Pricing | GET /quotes/:symbol | price.updated.v1 | market.tick.v1 | None |
| timeseries-service | FastAPI/Python | New | Timeseries | GET /ohlcv/:symbol | ohlcv.created.v1 | market.tick.v1 | timeseries |

### 6. Database Changes
```sql
CREATE SCHEMA timeseries; -- Market data OHLCV
CREATE TABLE timeseries.bars_1m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| GET | `/api/v1/quotes/:symbol` | `None` | `{ "bid": "1.00000", "ask": "1.00010" }` | Bearer | Real-time quote |
| GET | `/api/v1/ohlcv/:symbol` | `?resolution=1D` | `{ "bars": [] }` | Bearer | Historical bars |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.marketdata.tick.v1` | market-data-service | pricing, timeseries | symbol, bid, ask, ts | FORWARD | 24 Hours |
| `tradeora.timeseries.ohlcv.created.v1` | timeseries-service | technical-analysis | symbol, timeframe, o, h, l, c, v | BACKWARD | 7 Days |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-EGX-OHLCV-COMPUTE | `*/1 10-15 * * 0-4` | timeseries-service | Build EGX bars | Skip | No retry |
| JOB-FOREX-OHLCV-COMPUTE | `* * * * 1-5` | timeseries-service | Build Forex bars | Skip | No retry |

### 10. AI Engines
*No AI Engines active for this release.*

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| ForexMarketScreen | `/forex` | Pairs list, spread | Mandatory | Forex | New |
| TechnicalChartScreen | `/chart/:symbol` | Candlestick chart, indicators | Mandatory | EGX/Forex | New |
| AlertsScreen | `/alerts` | Manage price alerts | Mandatory | All | New |

### 12. Infrastructure Changes
- **TimescaleDB**: Time-series extension for Postgres
- **Valkey**: In-memory cache for latest quotes

### 13. Security Requirements
- **Rate limit market data endpoints**: Prevent abuse
- **Validate timeframe parameters**: Prevent DoS via huge queries

### 14. Testing Strategy
- **Load: 10,000 ticks/sec ingestion**: Ensure Kafka/Timescale DB hold up
- **Unit: Indicator math precision**: Assert Decimal arithmetic

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Forex feed running 24/5 with 0 downtime for 1 week
- [ ] Charts render smoothly on mobile

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R3.0 Beta: 12-school AI Consensus + LLM Gateway
### 1. Release Header
**Vision:** Deliver Beta: 12-school AI Consensus + LLM Gateway within Months 7-9.

**Business Goals:**
- Deploy LLM Gateway and Ollama compute nodes.
- Implement 12 AI schools (Technical, Fundamental, Macro, Sentiment, etc.).
- Develop AI Consensus engine for aggregated scoring.
- Generate daily market briefs via LLM.
- Mandatory FRA/CBE disclaimers on AI output.
- No autonomous trading.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| AIGateway | AI | Route requests to LLMs, manage quotas | New | Subscription |
| AIEngine | AI | School evaluation logic | New | AIGateway, Timeseries |
| AIConsensus | AI | Aggregate school scores | New | AIEngine |
| ContentGeneration | AI | Daily briefs and summaries | New | AIConsensus, AIGateway |

### 4. Implementation-Ordered Modules
**1. Ollama Deployment**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** CPU nodes for Llama3 inference
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. LiteLLM Proxy**
- **Priority:** P0
- **Dependencies:** Ollama
- **Complexity:** S
- **Acceptance Criteria:** Routing and cost tracking
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. ai-gateway-service**
- **Priority:** P0
- **Dependencies:** LiteLLM
- **Complexity:** M
- **Acceptance Criteria:** Auth, rate limits, audit logging
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. school-technical**
- **Priority:** P0
- **Dependencies:** technical-analysis-service
- **Complexity:** M
- **Acceptance Criteria:** Evaluate TA indicators
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. school-macro**
- **Priority:** P0
- **Dependencies:** market-data
- **Complexity:** M
- **Acceptance Criteria:** Evaluate interest rates, inflation
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**6. consensus-service**
- **Priority:** P0
- **Dependencies:** schools
- **Complexity:** L
- **Acceptance Criteria:** Weighted scoring, JSON output
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**7. content-service**
- **Priority:** P1
- **Dependencies:** consensus-service
- **Complexity:** M
- **Acceptance Criteria:** Prompt assembly, translation to Arabic
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| ai-gateway-service | FastAPI/Python | New | AIGateway | POST /v1/chat/completions | ai.request.v1 | None | ai_audit |
| consensus-service | FastAPI/Python | New | AIConsensus | GET /consensus/:symbol | consensus.computed.v1 | None | consensus |
| content-service | FastAPI/Python | New | ContentGeneration | GET /briefs/daily | content.generated.v1 | None | content |

### 6. Database Changes
```sql
CREATE SCHEMA ai_audit; -- WORM logs for all AI prompts/responses
CREATE TABLE ai_audit.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA consensus; -- Historical AI scores
CREATE TABLE consensus.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| GET | `/api/v1/consensus/:symbol` | `None` | `{ "score": 85, "direction": "BULLISH" }` | Bearer | Aggregated AI score |
| GET | `/api/v1/briefs/daily` | `None` | `{ "content_ar": "..." }` | Bearer | Daily brief |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.ai.consensus.computed.v1` | consensus-service | content-service | symbol, score, timestamp | BACKWARD | 1 Year |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-DAILY-BRIEF | `30 8 * * *` | content-service | Generate EGX brief before open | Alert Editorial | 3 retries |
| JOB-RECOMMENDATION-BATCH | `0 9 * * *` | consensus-service | Precompute scores | Alert DataSci | 1 retry |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| AIRecommendationScreen | `/ai/recommendations` | List of top picks | Mandatory | EGX/Forex | New |
| AIExplanationScreen | `/ai/explain/:symbol` | Detailed breakdown of 12 schools | Mandatory | EGX/Forex | New |
| DailyBriefScreen | `/briefs/daily` | Morning newsletter view | Mandatory | EGX/Forex | New |

### 12. Infrastructure Changes
- **Ollama CPU Nodes**: Self-hosted open source models
- **LiteLLM**: LLM proxy

### 13. Security Requirements
- **Prompt injection filtering**: Block malicious prompts
- **Mandatory Disclaimer Append**: Ensure FRA/CBE disclaimers attached to all outputs

### 14. Testing Strategy
- **Unit: Consensus weighting logic**: Ensure sums to 100%
- **Integration: LiteLLM routing**: Fallback to secondary model if primary down

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] AI latency < 3s for cached consensus
- [ ] Disclaimers verified on 100% of test outputs

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R4.0 GA: Analytics + Risk (VaR, drawdown) + Reports
### 1. Release Header
**Vision:** Deliver GA: Analytics + Risk (VaR, drawdown) + Reports within Months 10-12.

**Business Goals:**
- Implement portfolio analytics (Beta, Sharpe, Sortino).
- Calculate Value at Risk (VaR) and max drawdown.
- Generate automated tax and performance reports (PDF).
- Optimize database performance for heavy analytical queries.
- General Availability release for EGX and Forex.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| RiskManagement | Analytics | VaR and drawdown calculations | New | Portfolio, Timeseries |
| Reporting | Core | Generate PDF statements | New | Portfolio, Transaction |

### 4. Implementation-Ordered Modules
**1. risk-service**
- **Priority:** P0
- **Dependencies:** timeseries-service
- **Complexity:** L
- **Acceptance Criteria:** Monte Carlo VaR simulation
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. analytics-service**
- **Priority:** P0
- **Dependencies:** portfolio-service
- **Complexity:** M
- **Acceptance Criteria:** Sharpe ratio, beta compute
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. reporting-service**
- **Priority:** P0
- **Dependencies:** portfolio-service
- **Complexity:** M
- **Acceptance Criteria:** PDF generation via Puppeteer/ReportLab
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. Report Storage**
- **Priority:** P0
- **Dependencies:** MinIO
- **Complexity:** S
- **Acceptance Criteria:** Bucket for generated statements
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| risk-service | FastAPI/Python | New | RiskManagement | GET /risk/var/:portfolioId | risk.computed.v1 | None | risk |
| analytics-service | NestJS/TS | New | Analytics | GET /analytics/portfolio/:id | None | None | analytics |
| reporting-service | NestJS/TS | New | Reporting | POST /reports/generate<br>GET /reports/:id/download | report.ready.v1 | None | reports |

### 6. Database Changes
```sql
CREATE SCHEMA risk; -- Daily risk metrics per portfolio
CREATE TABLE risk.var_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA reports; -- Metadata for generated reports
CREATE TABLE reports.report_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| GET | `/api/v1/analytics/portfolio/:id` | `None` | `{ "sharpe": 1.2, "beta": 0.9 }` | Bearer | Portfolio stats |
| POST | `/api/v1/reports/generate` | `{ "type": "TAX", "year": 2024 }` | `{ "jobId": "uuid" }` | Bearer | Async PDF gen |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.reporting.ready.v1` | reporting-service | notification-service | reportId, userId | BACKWARD | 7 Days |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-DAILY-VAR | `0 2 * * *` | risk-service | Compute VaR for all active portfolios | Alert RiskTeam | 2 retries |

### 10. AI Engines
*No AI Engines active for this release.*

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| AnalyticsDashboard | `/portfolio/analytics` | Charts for performance | Mandatory | All | New |
| ReportsScreen | `/reports` | Download statements | Mandatory | All | New |

### 12. Infrastructure Changes
- **Headless Chrome / ReportLab**: For PDF generation

### 13. Security Requirements
- **Signed URLs for PDF downloads**: Valid for 5 minutes only

### 14. Testing Strategy
- **Unit: VaR mathematical correctness**: Compare with known dataset
- **Load: PDF generation queue under load**: 

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] VaR computed accurately for 1000 test portfolios
- [ ] GA Launch criteria met

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R5.0 Enterprise: Crypto markets + AI Learning + Backtesting internal
### 1. Release Header
**Vision:** Deliver Enterprise: Crypto markets + AI Learning + Backtesting internal within Months 13-18.

**Business Goals:**
- Integrate Crypto feeds (Binance/Kraken) with 8 decimal precision.
- Deploy GPU nodes (NVIDIA A100) and vLLM for advanced AI.
- Implement internal backtesting engine (Rule 40: available_from_ts).
- Implement On-chain metrics integration (Glassnode).
- Add AI self-learning/calibration loops.
- Mandatory CBE disclaimers for Crypto.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex, Crypto**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| CryptoGateway | Market Data | Crypto exchange WebSockets | New | SecurityMaster |
| OnChainMetrics | Analytics | Blockchain data ingestion | New | CryptoGateway |
| Backtesting | AI | Historical strategy validation | New | Timeseries |
| AILearning | AI | Model weight calibration | New | AIConsensus |

### 4. Implementation-Ordered Modules
**1. Crypto WebSocket Clients**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** M
- **Acceptance Criteria:** 24/7 ingestion
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. GPU Infrastructure**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** L
- **Acceptance Criteria:** vLLM deployment for Llama3-70B
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. backtest-engine**
- **Priority:** P0
- **Dependencies:** timeseries-service
- **Complexity:** XL
- **Acceptance Criteria:** Vectorized backtesting avoiding look-ahead bias
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. onchain-service**
- **Priority:** P1
- **Dependencies:** CryptoGateway
- **Complexity:** M
- **Acceptance Criteria:** Glassnode API client
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. ai-calibration-service**
- **Priority:** P0
- **Dependencies:** consensus-service
- **Complexity:** L
- **Acceptance Criteria:** Compare predictions vs reality
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| backtest-engine | FastAPI/Python | New | Backtesting | POST /backtest/run | backtest.completed.v1 | None | backtests |
| onchain-service | FastAPI/Python | New | OnChainMetrics | GET /onchain/:asset | None | None | onchain |
| ai-calibration-service | FastAPI/Python | New | AILearning | POST /calibrate | calibration.applied.v1 | None | ai_weights |

### 6. Database Changes
```sql
CREATE SCHEMA backtests; -- Backtest results and params
CREATE TABLE backtests.runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA ai_weights; -- Historical school weights
CREATE TABLE ai_weights.weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/backtest/run` | `{ "strategy": "MACD_CROSS", "asset": "BTC" }` | `{ "cagr": 0.15, "maxDrawdown": -0.2 }` | Admin | Internal use only |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.crypto.tick.v1` | market-data-service | pricing, timeseries | symbol, bid, ask, ts | FORWARD | 24 Hours |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-CRYPTO-OHLCV | `* * * * *` | timeseries-service | Build Crypto bars (24/7) | Alert DevOps | No retry |
| JOB-GROUND-TRUTH-COLLECT | `0 9 * * *` | ai-calibration-service | Record actual outcomes | Log Error | 3 retries |
| JOB-SCHOOL-CALIBRATE | `0 0 * * 0` | ai-calibration-service | Weekly weight update | Alert DataSci | None |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| CryptoMarketScreen | `/crypto` | Coin list, 24h change | Mandatory | Crypto | New |
| CryptoCurrencyDetailScreen | `/crypto/:id` | Orderbook, chart, on-chain | Mandatory | Crypto | New |

### 12. Infrastructure Changes
- **NVIDIA A100 Nodes**: GPU compute
- **vLLM**: High throughput LLM serving

### 13. Security Requirements
- **Isolate backtesting DB access**: Prevent impact on prod timeseries

### 14. Testing Strategy
- **Integration: Backtesting Rule 40 check**: Assert available_from_ts is respected
- **Market: 24/7 continuity test**: Simulate crypto weekend load

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Backtester matches manual calculation within 0.01%
- [ ] Crypto feed handles 50k ticks/sec

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R6.0 Scale: US Stocks + 17 schools + Broker integration
### 1. Release Header
**Vision:** Deliver Scale: US Stocks + 17 schools + Broker integration within Months 19-30.

**Business Goals:**
- Integrate US market data (NYSE/NASDAQ) with 2 decimal precision.
- Implement DST handling for US market hours.
- Expand AI to 17 schools (adding Options flow, Dark pool data).
- Integrate execution broker (Interactive Brokers / Alpaca).
- Deploy multi-region Kafka (MirrorMaker 2).
- Mandatory SEC disclaimers.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex, Crypto, US Stocks**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| USGateway | Market Data | SIP feeds ingestion | New | SecurityMaster |
| OrderRouting | Trading | Route orders to external brokers | New | Portfolio |
| CorporateActions | Market Data | Splits, dividends | New | Timeseries |

### 4. Implementation-Ordered Modules
**1. US Market WebSocket**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** High throughput OPRA/SIP feeds
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. DST Management**
- **Priority:** P0
- **Dependencies:** market-calendar-service
- **Complexity:** S
- **Acceptance Criteria:** Handle ET/EET conversions
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. broker-integration-service**
- **Priority:** P0
- **Dependencies:** OrderRouting
- **Complexity:** XL
- **Acceptance Criteria:** FIX protocol or REST API to brokers
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. corporate-actions-service**
- **Priority:** P1
- **Dependencies:** CorporateActions
- **Complexity:** M
- **Acceptance Criteria:** Adjust historical data for splits
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. Kafka MirrorMaker 2**
- **Priority:** P0
- **Dependencies:** Kafka
- **Complexity:** L
- **Acceptance Criteria:** Sync topics between Cairo and Riyadh
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| broker-integration-service | NestJS/TS | New | OrderRouting | POST /orders/route | order.routed.v1 | order.created.v1 | routing |
| corporate-actions-service | FastAPI/Python | New | CorporateActions | GET /actions/:symbol | action.applied.v1 | None | corp_actions |

### 6. Database Changes
```sql
CREATE SCHEMA routing; -- Order routing states
CREATE TABLE routing.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA corp_actions; -- Dividends and splits
CREATE TABLE corp_actions.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/orders/route` | `{ "orderId": "uuid" }` | `{ "status": "ACCEPTED" }` | Internal | Routes validated order |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.us.tick.v1` | market-data-service | pricing, timeseries | symbol, bid, ask, ts | FORWARD | 24 Hours |
| `tradeora.trading.order.routed.v1` | broker-integration-service | portfolio | orderId, brokerId, status | BACKWARD | Infinite |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-US-OHLCV | `* 9-16 * * 1-5` | timeseries-service | Build US bars (ET) | Skip | No retry |
| JOB-EARNINGS-SYNC | `0 6 * * *` | market-calendar-service | Fetch US earnings dates | Log | 3 retries |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| USMarketScreen | `/us` | S&P500, top movers | Mandatory | US Stocks | New |
| OptionsFlowScreen | `/us/options` | Unusual options activity | Mandatory | US Stocks | New |

### 12. Infrastructure Changes
- **Kafka MirrorMaker 2**: Cross-region replication
- **Dedicated US Leased Line**: Low latency market data

### 13. Security Requirements
- **FIX Protocol TLS/VPN**: Secure broker connection

### 14. Testing Strategy
- **Unit: Split adjustment logic**: Ensure historical prices adjust correctly
- **Integration: Order routing state machine**: Verify ACK/NACK handling

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Order round-trip time to US broker < 500ms
- [ ] US market data ingested without lag during market open

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R7.0 Global: GCC + Global + Autonomous agents
### 1. Release Header
**Vision:** Deliver Global: GCC + Global + Autonomous agents within Months 31-48.

**Business Goals:**
- Expand to GCC markets (Tadawul, DFM).
- Deploy third active region (Dubai) for Active-Active-Active.
- Launch Global CDN for edge caching.
- Introduce autonomous trading agents (Opt-in, strict limits).
- Full multi-lingual support (Arabic, English, French).

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **Global (GCC, EU, Asia)**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| AutonomousTrading | AI | Algorithmic execution logic | New | OrderRouting, AIEngine |
| GlobalRouting | Infra | Geo-DNS and CDN | New | None |

### 4. Implementation-Ordered Modules
**1. GCC Market Connectors**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** Tadawul FIX feeds
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. Dubai Region Standup**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** XL
- **Acceptance Criteria:** Full cluster clone in UAE
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. autonomous-agent-service**
- **Priority:** P0
- **Dependencies:** AutonomousTrading
- **Complexity:** XL
- **Acceptance Criteria:** Execution logic with strict circuit breakers
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. Global CDN Setup**
- **Priority:** P0
- **Dependencies:** GlobalRouting
- **Complexity:** M
- **Acceptance Criteria:** Cloudflare/Akamai config
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| autonomous-agent-service | FastAPI/Python | New | AutonomousTrading | POST /agent/start<br>POST /agent/stop | agent.action.v1 | market.tick.v1 | agents |

### 6. Database Changes
```sql
CREATE SCHEMA agents; -- Agent configs and execution logs
CREATE TABLE agents.configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/agent/start` | `{ "strategyId": "uuid", "maxExposure": 10000 }` | `{ "agentId": "uuid" }` | Bearer | Start trading agent |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.trading.agent.action.v1` | autonomous-agent-service | broker-integration-service | agentId, action, qty, price | BACKWARD | 1 Year |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-AGENT-HEALTH | `* * * * *` | autonomous-agent-service | Verify agent limits not breached | Kill Agent | None |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| GCCMarketScreen | `/gcc` | Tadawul, DFM data | Mandatory | GCC | New |
| AutonomousDashboard | `/agents` | Manage trading bots | Mandatory | Global | New |

### 12. Infrastructure Changes
- **Dubai Data Center**: Third region
- **Global CDN**: Edge caching for static assets

### 13. Security Requirements
- **Strict Autonomous Circuit Breakers**: Hard stop at 5% daily loss per agent
- **Geo-fencing compliance**: Data residency for Saudi users

### 14. Testing Strategy
- **Load: Cross-region DB replication latency**: Ensure < 50ms
- **Security: Agent sandbox escape test**: Ensure agents cannot access unauthorized funds

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Active-Active-Active failover tested successfully
- [ ] Autonomous agents pass 3-month paper trading audit

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R1.0 Alpha: EGX + KYC/AML/PDPL + Portfolio + Subscription
### 1. Release Header
**Vision:** Deliver Alpha: EGX + KYC/AML/PDPL + Portfolio + Subscription within Months 1-3.

**Business Goals:**
- Establish foundational K8s infrastructure and CI/CD.
- Deploy core identity, KYC, AML, and PDPL compliance modules.
- Enable EGX portfolio management and watchlists.
- Implement foundational market calendar.
- Deliver Subscription and Billing components.
- Establish immutable WORM audit trails in MinIO.
- Release Flutter mobile app with Arabic RTL first.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX (Equities)**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| UserIdentity | Core | Manage authentication and sessions | New | Keycloak |
| KYCVerification | Compliance | Identity verification and liveness | New | UserIdentity |
| AMLScreening | Compliance | Sanctions and PEP screening | New | KYCVerification |
| PDPLCompliance | Compliance | Data privacy and right-to-be-forgotten | New | UserIdentity |
| Portfolio | Trading | User holdings and cash balances | New | UserIdentity, SecurityMaster |
| Position | Trading | Asset positions per portfolio | New | Portfolio |
| Transaction | Trading | Ledger of asset movements | New | Position |
| Watchlist | Trading | User-tracked securities | New | SecurityMaster |
| SecurityMaster | Market Data | Source of truth for instruments | New | None |
| MarketCalendar | Market Data | Trading sessions and holidays | New | None |
| Subscription | Billing | User tier management | New | UserIdentity |
| Billing | Billing | Invoicing and payment processing | New | Subscription |
| Notification | Core | SMS, Email, Push alerts | New | UserIdentity |
| AuditTrail | Compliance | Immutable event logging | New | Kafka |
| SessionStatus | Market Data | Real-time market status | New | MarketCalendar |

### 4. Implementation-Ordered Modules
**1. K8s Infrastructure**
- **Priority:** P0
- **Dependencies:** None
- **Complexity:** XL
- **Acceptance Criteria:** Cluster up, FluxCD synced, OPA gatekeeper active
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. PostgreSQL+Patroni**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** L
- **Acceptance Criteria:** HA setup, pgBouncer, backup to MinIO
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. Kafka+Karapace**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** L
- **Acceptance Criteria:** Schema registry active, 3 brokers, ACLs
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. MinIO WORM**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Compliance mode ON, retention policies set
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. OpenBao**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Secrets injected via mutating webhook
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**6. Keycloak**
- **Priority:** P0
- **Dependencies:** PostgreSQL
- **Complexity:** M
- **Acceptance Criteria:** OIDC flows working, OTP SMS integrated
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**7. Kong**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Ingress controller, rate limiting plugins
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**8. Unleash**
- **Priority:** P1
- **Dependencies:** PostgreSQL
- **Complexity:** S
- **Acceptance Criteria:** Feature flags toggleable without deploy
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**9. FluxCD**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** S
- **Acceptance Criteria:** GitOps sync block during 08:45-15:20
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**10. Prometheus stack**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Metrics server, Grafana, Alertmanager
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**11. identity-service**
- **Priority:** P0
- **Dependencies:** Keycloak
- **Complexity:** M
- **Acceptance Criteria:** JWT minting, session tracking
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**12. kyc-service**
- **Priority:** P0
- **Dependencies:** identity-service
- **Complexity:** L
- **Acceptance Criteria:** ID upload, Liveness, Maker-Checker
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**13. compliance-service**
- **Priority:** P0
- **Dependencies:** kyc-service
- **Complexity:** M
- **Acceptance Criteria:** AML webhook, PDPL logs
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**14. portfolio-service**
- **Priority:** P0
- **Dependencies:** identity-service
- **Complexity:** L
- **Acceptance Criteria:** Create portfolio, deposit mock funds
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**15. subscription-service**
- **Priority:** P1
- **Dependencies:** identity-service
- **Complexity:** M
- **Acceptance Criteria:** Plan selection, quotas
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**16. market-calendar-service**
- **Priority:** P0
- **Dependencies:** None
- **Complexity:** S
- **Acceptance Criteria:** EGX holidays API
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**17. notification-service**
- **Priority:** P1
- **Dependencies:** Kafka
- **Complexity:** M
- **Acceptance Criteria:** Push token registry, SMS sender
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| identity-service | NestJS/TS | New | UserIdentity | POST /auth/login<br>POST /auth/otp<br>GET /users/me | user.created.v1 | None | identity |
| kyc-service | NestJS/TS | New | KYCVerification | POST /kyc/upload<br>POST /kyc/liveness<br>GET /kyc/status | kyc.submitted.v1 | user.created.v1 | kyc |
| compliance-service | NestJS/TS | New | AMLScreening, PDPL | POST /aml/screen<br>POST /pdpl/erase<br>GET /pdpl/consent | aml.cleared.v1 | kyc.submitted.v1 | compliance |
| portfolio-service | NestJS/TS | New | Portfolio, Position | POST /portfolios<br>GET /portfolios<br>GET /portfolios/:id/positions | portfolio.created.v1 | user.created.v1 | portfolio |
| subscription-service | NestJS/TS | New | Subscription, Billing | GET /plans<br>POST /subscriptions<br>GET /subscriptions/me | subscription.active.v1 | user.created.v1 | subscription |

### 6. Database Changes
```sql
CREATE SCHEMA identity; -- User authentication data
CREATE TABLE identity.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA kyc; -- Verification documents and status
CREATE TABLE kyc.kyc_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA compliance; -- AML hits and PDPL requests
CREATE TABLE compliance.aml_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA portfolio; -- Holdings and ledgers
CREATE TABLE portfolio.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA subscription; -- Billing and plans
CREATE TABLE subscription.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/auth/login` | `{ "phone": "string" }` | `{ "token": "string" }` | None | OTP step 1 |
| GET | `/api/v1/portfolios` | `None` | `{ "portfolios": [] }` | Bearer | Lists user portfolios |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.identity.user.created.v1` | identity-service | kyc-service, portfolio | userId, phone, timestamp | BACKWARD | Infinite |
| `tradeora.kyc.verification.submitted.v1` | kyc-service | compliance-service | userId, documentId | BACKWARD | 1 Year |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-KYC-EXPIRY-CHECK | `0 2 * * *` | kyc-service | Flags expired IDs | Log Error | 3 retries |
| JOB-AML-REFRESH | `0 1 * * *` | compliance-service | Re-screens against new lists | Alert SecOps | No retry |
| JOB-SESSION-HEALTH | `*/5 * * * *` | market-calendar | Checks API connectivity | Alert DevOps | 1 min |

### 10. AI Engines
*No AI Engines active for this release.*

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| RegistrationScreen | `/register` | Phone, OTP, Passcode | Mandatory | EGX | New |
| NationalIDUploadScreen | `/kyc/id` | Camera OCR, Edge detection | Mandatory | EGX | New |
| LivenessCheckScreen | `/kyc/liveness` | Face tracking | Mandatory | EGX | New |
| KYCStatusScreen | `/kyc/status` | Pending/Rejected states | Mandatory | EGX | New |
| HomeScreen | `/home` | Dashboard, widgets | Mandatory | EGX | New |
| PortfolioScreen | `/portfolio` | Holdings list, PnL | Mandatory | EGX | New |

### 12. Infrastructure Changes
- **K8s Cluster**: Base orchestration
- **PostgreSQL**: Relational storage
- **Kafka**: Event bus
- **MinIO**: WORM compliance

### 13. Security Requirements
- WORM compliance strictly enforced
- OIDC for all user flows
- NetworkPolicies isolating DB from Ingress
- Secrets in OpenBao

### 14. Testing Strategy
- Unit: 80% coverage on core logic
- Integration: Testcontainers for Postgres/Kafka
- Load: 1000 VU login flow

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] KYC maker-checker flow approved by compliance
- [ ] WORM logs verified by auditor
- [ ] Pen-test zero critical findings

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R2.0 Beta: EGX + Forex market data + Technical indicators
### 1. Release Header
**Vision:** Deliver Beta: EGX + Forex market data + Technical indicators within Months 4-6.

**Business Goals:**
- Integrate EGX market data feeds via WebSocket.
- Integrate Forex pricing feeds (24/5) with 5 decimal precision.
- Implement scalable timeseries DB (TimescaleDB).
- Compute and serve OHLCV bars.
- Implement technical indicators (RSI, MACD, MA).
- Enhance frontend with real-time charting.
- Implement real-time alerting engine.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX (Equities), Forex (FX Major/Minor)**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| MarketDataGateway | Market Data | Ingest and normalize external feeds | New | SecurityMaster |
| Pricing | Market Data | Manage real-time quotes | New | MarketDataGateway |
| Timeseries | Analytics | OHLCV aggregation and storage | New | Pricing |
| TechnicalAnalysis | Analytics | Indicator computation | New | Timeseries |
| Alerting | Core | User defined price/indicator alerts | New | Pricing, TechnicalAnalysis |

### 4. Implementation-Ordered Modules
**1. Market Data WebSocket Clients**
- **Priority:** P0
- **Dependencies:** None
- **Complexity:** L
- **Acceptance Criteria:** Connect, reconnect, parse messages
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. TimescaleDB Setup**
- **Priority:** P0
- **Dependencies:** PostgreSQL
- **Complexity:** M
- **Acceptance Criteria:** Hypertables created, retention policies
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. market-data-service**
- **Priority:** P0
- **Dependencies:** Kafka
- **Complexity:** XL
- **Acceptance Criteria:** Publish ticks to Kafka at high throughput
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. pricing-service**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** Maintain latest price in Valkey
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. timeseries-service**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** Aggregate ticks to 1m, 5m, 1h, 1d
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**6. technical-analysis-service**
- **Priority:** P1
- **Dependencies:** timeseries-service
- **Complexity:** L
- **Acceptance Criteria:** Compute RSI, MACD on demand
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**7. alerting-service**
- **Priority:** P1
- **Dependencies:** pricing-service
- **Complexity:** M
- **Acceptance Criteria:** Evaluate conditions, trigger notifications
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| market-data-service | FastAPI/Python | New | MarketDataGateway | GET /health | None | None | None |
| pricing-service | NestJS/TS | New | Pricing | GET /quotes/:symbol | price.updated.v1 | market.tick.v1 | None |
| timeseries-service | FastAPI/Python | New | Timeseries | GET /ohlcv/:symbol | ohlcv.created.v1 | market.tick.v1 | timeseries |

### 6. Database Changes
```sql
CREATE SCHEMA timeseries; -- Market data OHLCV
CREATE TABLE timeseries.bars_1m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| GET | `/api/v1/quotes/:symbol` | `None` | `{ "bid": "1.00000", "ask": "1.00010" }` | Bearer | Real-time quote |
| GET | `/api/v1/ohlcv/:symbol` | `?resolution=1D` | `{ "bars": [] }` | Bearer | Historical bars |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.marketdata.tick.v1` | market-data-service | pricing, timeseries | symbol, bid, ask, ts | FORWARD | 24 Hours |
| `tradeora.timeseries.ohlcv.created.v1` | timeseries-service | technical-analysis | symbol, timeframe, o, h, l, c, v | BACKWARD | 7 Days |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-EGX-OHLCV-COMPUTE | `*/1 10-15 * * 0-4` | timeseries-service | Build EGX bars | Skip | No retry |
| JOB-FOREX-OHLCV-COMPUTE | `* * * * 1-5` | timeseries-service | Build Forex bars | Skip | No retry |

### 10. AI Engines
*No AI Engines active for this release.*

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| ForexMarketScreen | `/forex` | Pairs list, spread | Mandatory | Forex | New |
| TechnicalChartScreen | `/chart/:symbol` | Candlestick chart, indicators | Mandatory | EGX/Forex | New |
| AlertsScreen | `/alerts` | Manage price alerts | Mandatory | All | New |

### 12. Infrastructure Changes
- **TimescaleDB**: Time-series extension for Postgres
- **Valkey**: In-memory cache for latest quotes

### 13. Security Requirements
- **Rate limit market data endpoints**: Prevent abuse
- **Validate timeframe parameters**: Prevent DoS via huge queries

### 14. Testing Strategy
- **Load: 10,000 ticks/sec ingestion**: Ensure Kafka/Timescale DB hold up
- **Unit: Indicator math precision**: Assert Decimal arithmetic

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Forex feed running 24/5 with 0 downtime for 1 week
- [ ] Charts render smoothly on mobile

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R3.0 Beta: 12-school AI Consensus + LLM Gateway
### 1. Release Header
**Vision:** Deliver Beta: 12-school AI Consensus + LLM Gateway within Months 7-9.

**Business Goals:**
- Deploy LLM Gateway and Ollama compute nodes.
- Implement 12 AI schools (Technical, Fundamental, Macro, Sentiment, etc.).
- Develop AI Consensus engine for aggregated scoring.
- Generate daily market briefs via LLM.
- Mandatory FRA/CBE disclaimers on AI output.
- No autonomous trading.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| AIGateway | AI | Route requests to LLMs, manage quotas | New | Subscription |
| AIEngine | AI | School evaluation logic | New | AIGateway, Timeseries |
| AIConsensus | AI | Aggregate school scores | New | AIEngine |
| ContentGeneration | AI | Daily briefs and summaries | New | AIConsensus, AIGateway |

### 4. Implementation-Ordered Modules
**1. Ollama Deployment**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** CPU nodes for Llama3 inference
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. LiteLLM Proxy**
- **Priority:** P0
- **Dependencies:** Ollama
- **Complexity:** S
- **Acceptance Criteria:** Routing and cost tracking
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. ai-gateway-service**
- **Priority:** P0
- **Dependencies:** LiteLLM
- **Complexity:** M
- **Acceptance Criteria:** Auth, rate limits, audit logging
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. school-technical**
- **Priority:** P0
- **Dependencies:** technical-analysis-service
- **Complexity:** M
- **Acceptance Criteria:** Evaluate TA indicators
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. school-macro**
- **Priority:** P0
- **Dependencies:** market-data
- **Complexity:** M
- **Acceptance Criteria:** Evaluate interest rates, inflation
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**6. consensus-service**
- **Priority:** P0
- **Dependencies:** schools
- **Complexity:** L
- **Acceptance Criteria:** Weighted scoring, JSON output
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**7. content-service**
- **Priority:** P1
- **Dependencies:** consensus-service
- **Complexity:** M
- **Acceptance Criteria:** Prompt assembly, translation to Arabic
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| ai-gateway-service | FastAPI/Python | New | AIGateway | POST /v1/chat/completions | ai.request.v1 | None | ai_audit |
| consensus-service | FastAPI/Python | New | AIConsensus | GET /consensus/:symbol | consensus.computed.v1 | None | consensus |
| content-service | FastAPI/Python | New | ContentGeneration | GET /briefs/daily | content.generated.v1 | None | content |

### 6. Database Changes
```sql
CREATE SCHEMA ai_audit; -- WORM logs for all AI prompts/responses
CREATE TABLE ai_audit.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA consensus; -- Historical AI scores
CREATE TABLE consensus.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| GET | `/api/v1/consensus/:symbol` | `None` | `{ "score": 85, "direction": "BULLISH" }` | Bearer | Aggregated AI score |
| GET | `/api/v1/briefs/daily` | `None` | `{ "content_ar": "..." }` | Bearer | Daily brief |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.ai.consensus.computed.v1` | consensus-service | content-service | symbol, score, timestamp | BACKWARD | 1 Year |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-DAILY-BRIEF | `30 8 * * *` | content-service | Generate EGX brief before open | Alert Editorial | 3 retries |
| JOB-RECOMMENDATION-BATCH | `0 9 * * *` | consensus-service | Precompute scores | Alert DataSci | 1 retry |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| AIRecommendationScreen | `/ai/recommendations` | List of top picks | Mandatory | EGX/Forex | New |
| AIExplanationScreen | `/ai/explain/:symbol` | Detailed breakdown of 12 schools | Mandatory | EGX/Forex | New |
| DailyBriefScreen | `/briefs/daily` | Morning newsletter view | Mandatory | EGX/Forex | New |

### 12. Infrastructure Changes
- **Ollama CPU Nodes**: Self-hosted open source models
- **LiteLLM**: LLM proxy

### 13. Security Requirements
- **Prompt injection filtering**: Block malicious prompts
- **Mandatory Disclaimer Append**: Ensure FRA/CBE disclaimers attached to all outputs

### 14. Testing Strategy
- **Unit: Consensus weighting logic**: Ensure sums to 100%
- **Integration: LiteLLM routing**: Fallback to secondary model if primary down

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] AI latency < 3s for cached consensus
- [ ] Disclaimers verified on 100% of test outputs

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R4.0 GA: Analytics + Risk (VaR, drawdown) + Reports
### 1. Release Header
**Vision:** Deliver GA: Analytics + Risk (VaR, drawdown) + Reports within Months 10-12.

**Business Goals:**
- Implement portfolio analytics (Beta, Sharpe, Sortino).
- Calculate Value at Risk (VaR) and max drawdown.
- Generate automated tax and performance reports (PDF).
- Optimize database performance for heavy analytical queries.
- General Availability release for EGX and Forex.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| RiskManagement | Analytics | VaR and drawdown calculations | New | Portfolio, Timeseries |
| Reporting | Core | Generate PDF statements | New | Portfolio, Transaction |

### 4. Implementation-Ordered Modules
**1. risk-service**
- **Priority:** P0
- **Dependencies:** timeseries-service
- **Complexity:** L
- **Acceptance Criteria:** Monte Carlo VaR simulation
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. analytics-service**
- **Priority:** P0
- **Dependencies:** portfolio-service
- **Complexity:** M
- **Acceptance Criteria:** Sharpe ratio, beta compute
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. reporting-service**
- **Priority:** P0
- **Dependencies:** portfolio-service
- **Complexity:** M
- **Acceptance Criteria:** PDF generation via Puppeteer/ReportLab
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. Report Storage**
- **Priority:** P0
- **Dependencies:** MinIO
- **Complexity:** S
- **Acceptance Criteria:** Bucket for generated statements
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| risk-service | FastAPI/Python | New | RiskManagement | GET /risk/var/:portfolioId | risk.computed.v1 | None | risk |
| analytics-service | NestJS/TS | New | Analytics | GET /analytics/portfolio/:id | None | None | analytics |
| reporting-service | NestJS/TS | New | Reporting | POST /reports/generate<br>GET /reports/:id/download | report.ready.v1 | None | reports |

### 6. Database Changes
```sql
CREATE SCHEMA risk; -- Daily risk metrics per portfolio
CREATE TABLE risk.var_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA reports; -- Metadata for generated reports
CREATE TABLE reports.report_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| GET | `/api/v1/analytics/portfolio/:id` | `None` | `{ "sharpe": 1.2, "beta": 0.9 }` | Bearer | Portfolio stats |
| POST | `/api/v1/reports/generate` | `{ "type": "TAX", "year": 2024 }` | `{ "jobId": "uuid" }` | Bearer | Async PDF gen |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.reporting.ready.v1` | reporting-service | notification-service | reportId, userId | BACKWARD | 7 Days |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-DAILY-VAR | `0 2 * * *` | risk-service | Compute VaR for all active portfolios | Alert RiskTeam | 2 retries |

### 10. AI Engines
*No AI Engines active for this release.*

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| AnalyticsDashboard | `/portfolio/analytics` | Charts for performance | Mandatory | All | New |
| ReportsScreen | `/reports` | Download statements | Mandatory | All | New |

### 12. Infrastructure Changes
- **Headless Chrome / ReportLab**: For PDF generation

### 13. Security Requirements
- **Signed URLs for PDF downloads**: Valid for 5 minutes only

### 14. Testing Strategy
- **Unit: VaR mathematical correctness**: Compare with known dataset
- **Load: PDF generation queue under load**: 

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] VaR computed accurately for 1000 test portfolios
- [ ] GA Launch criteria met

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R5.0 Enterprise: Crypto markets + AI Learning + Backtesting internal
### 1. Release Header
**Vision:** Deliver Enterprise: Crypto markets + AI Learning + Backtesting internal within Months 13-18.

**Business Goals:**
- Integrate Crypto feeds (Binance/Kraken) with 8 decimal precision.
- Deploy GPU nodes (NVIDIA A100) and vLLM for advanced AI.
- Implement internal backtesting engine (Rule 40: available_from_ts).
- Implement On-chain metrics integration (Glassnode).
- Add AI self-learning/calibration loops.
- Mandatory CBE disclaimers for Crypto.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex, Crypto**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| CryptoGateway | Market Data | Crypto exchange WebSockets | New | SecurityMaster |
| OnChainMetrics | Analytics | Blockchain data ingestion | New | CryptoGateway |
| Backtesting | AI | Historical strategy validation | New | Timeseries |
| AILearning | AI | Model weight calibration | New | AIConsensus |

### 4. Implementation-Ordered Modules
**1. Crypto WebSocket Clients**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** M
- **Acceptance Criteria:** 24/7 ingestion
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. GPU Infrastructure**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** L
- **Acceptance Criteria:** vLLM deployment for Llama3-70B
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. backtest-engine**
- **Priority:** P0
- **Dependencies:** timeseries-service
- **Complexity:** XL
- **Acceptance Criteria:** Vectorized backtesting avoiding look-ahead bias
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. onchain-service**
- **Priority:** P1
- **Dependencies:** CryptoGateway
- **Complexity:** M
- **Acceptance Criteria:** Glassnode API client
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. ai-calibration-service**
- **Priority:** P0
- **Dependencies:** consensus-service
- **Complexity:** L
- **Acceptance Criteria:** Compare predictions vs reality
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| backtest-engine | FastAPI/Python | New | Backtesting | POST /backtest/run | backtest.completed.v1 | None | backtests |
| onchain-service | FastAPI/Python | New | OnChainMetrics | GET /onchain/:asset | None | None | onchain |
| ai-calibration-service | FastAPI/Python | New | AILearning | POST /calibrate | calibration.applied.v1 | None | ai_weights |

### 6. Database Changes
```sql
CREATE SCHEMA backtests; -- Backtest results and params
CREATE TABLE backtests.runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA ai_weights; -- Historical school weights
CREATE TABLE ai_weights.weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/backtest/run` | `{ "strategy": "MACD_CROSS", "asset": "BTC" }` | `{ "cagr": 0.15, "maxDrawdown": -0.2 }` | Admin | Internal use only |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.crypto.tick.v1` | market-data-service | pricing, timeseries | symbol, bid, ask, ts | FORWARD | 24 Hours |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-CRYPTO-OHLCV | `* * * * *` | timeseries-service | Build Crypto bars (24/7) | Alert DevOps | No retry |
| JOB-GROUND-TRUTH-COLLECT | `0 9 * * *` | ai-calibration-service | Record actual outcomes | Log Error | 3 retries |
| JOB-SCHOOL-CALIBRATE | `0 0 * * 0` | ai-calibration-service | Weekly weight update | Alert DataSci | None |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| CryptoMarketScreen | `/crypto` | Coin list, 24h change | Mandatory | Crypto | New |
| CryptoCurrencyDetailScreen | `/crypto/:id` | Orderbook, chart, on-chain | Mandatory | Crypto | New |

### 12. Infrastructure Changes
- **NVIDIA A100 Nodes**: GPU compute
- **vLLM**: High throughput LLM serving

### 13. Security Requirements
- **Isolate backtesting DB access**: Prevent impact on prod timeseries

### 14. Testing Strategy
- **Integration: Backtesting Rule 40 check**: Assert available_from_ts is respected
- **Market: 24/7 continuity test**: Simulate crypto weekend load

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Backtester matches manual calculation within 0.01%
- [ ] Crypto feed handles 50k ticks/sec

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R6.0 Scale: US Stocks + 17 schools + Broker integration
### 1. Release Header
**Vision:** Deliver Scale: US Stocks + 17 schools + Broker integration within Months 19-30.

**Business Goals:**
- Integrate US market data (NYSE/NASDAQ) with 2 decimal precision.
- Implement DST handling for US market hours.
- Expand AI to 17 schools (adding Options flow, Dark pool data).
- Integrate execution broker (Interactive Brokers / Alpaca).
- Deploy multi-region Kafka (MirrorMaker 2).
- Mandatory SEC disclaimers.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex, Crypto, US Stocks**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| USGateway | Market Data | SIP feeds ingestion | New | SecurityMaster |
| OrderRouting | Trading | Route orders to external brokers | New | Portfolio |
| CorporateActions | Market Data | Splits, dividends | New | Timeseries |

### 4. Implementation-Ordered Modules
**1. US Market WebSocket**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** High throughput OPRA/SIP feeds
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. DST Management**
- **Priority:** P0
- **Dependencies:** market-calendar-service
- **Complexity:** S
- **Acceptance Criteria:** Handle ET/EET conversions
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. broker-integration-service**
- **Priority:** P0
- **Dependencies:** OrderRouting
- **Complexity:** XL
- **Acceptance Criteria:** FIX protocol or REST API to brokers
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. corporate-actions-service**
- **Priority:** P1
- **Dependencies:** CorporateActions
- **Complexity:** M
- **Acceptance Criteria:** Adjust historical data for splits
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. Kafka MirrorMaker 2**
- **Priority:** P0
- **Dependencies:** Kafka
- **Complexity:** L
- **Acceptance Criteria:** Sync topics between Cairo and Riyadh
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| broker-integration-service | NestJS/TS | New | OrderRouting | POST /orders/route | order.routed.v1 | order.created.v1 | routing |
| corporate-actions-service | FastAPI/Python | New | CorporateActions | GET /actions/:symbol | action.applied.v1 | None | corp_actions |

### 6. Database Changes
```sql
CREATE SCHEMA routing; -- Order routing states
CREATE TABLE routing.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA corp_actions; -- Dividends and splits
CREATE TABLE corp_actions.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/orders/route` | `{ "orderId": "uuid" }` | `{ "status": "ACCEPTED" }` | Internal | Routes validated order |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.us.tick.v1` | market-data-service | pricing, timeseries | symbol, bid, ask, ts | FORWARD | 24 Hours |
| `tradeora.trading.order.routed.v1` | broker-integration-service | portfolio | orderId, brokerId, status | BACKWARD | Infinite |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-US-OHLCV | `* 9-16 * * 1-5` | timeseries-service | Build US bars (ET) | Skip | No retry |
| JOB-EARNINGS-SYNC | `0 6 * * *` | market-calendar-service | Fetch US earnings dates | Log | 3 retries |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| USMarketScreen | `/us` | S&P500, top movers | Mandatory | US Stocks | New |
| OptionsFlowScreen | `/us/options` | Unusual options activity | Mandatory | US Stocks | New |

### 12. Infrastructure Changes
- **Kafka MirrorMaker 2**: Cross-region replication
- **Dedicated US Leased Line**: Low latency market data

### 13. Security Requirements
- **FIX Protocol TLS/VPN**: Secure broker connection

### 14. Testing Strategy
- **Unit: Split adjustment logic**: Ensure historical prices adjust correctly
- **Integration: Order routing state machine**: Verify ACK/NACK handling

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Order round-trip time to US broker < 500ms
- [ ] US market data ingested without lag during market open

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R7.0 Global: GCC + Global + Autonomous agents
### 1. Release Header
**Vision:** Deliver Global: GCC + Global + Autonomous agents within Months 31-48.

**Business Goals:**
- Expand to GCC markets (Tadawul, DFM).
- Deploy third active region (Dubai) for Active-Active-Active.
- Launch Global CDN for edge caching.
- Introduce autonomous trading agents (Opt-in, strict limits).
- Full multi-lingual support (Arabic, English, French).

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **Global (GCC, EU, Asia)**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| AutonomousTrading | AI | Algorithmic execution logic | New | OrderRouting, AIEngine |
| GlobalRouting | Infra | Geo-DNS and CDN | New | None |

### 4. Implementation-Ordered Modules
**1. GCC Market Connectors**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** Tadawul FIX feeds
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. Dubai Region Standup**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** XL
- **Acceptance Criteria:** Full cluster clone in UAE
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. autonomous-agent-service**
- **Priority:** P0
- **Dependencies:** AutonomousTrading
- **Complexity:** XL
- **Acceptance Criteria:** Execution logic with strict circuit breakers
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. Global CDN Setup**
- **Priority:** P0
- **Dependencies:** GlobalRouting
- **Complexity:** M
- **Acceptance Criteria:** Cloudflare/Akamai config
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| autonomous-agent-service | FastAPI/Python | New | AutonomousTrading | POST /agent/start<br>POST /agent/stop | agent.action.v1 | market.tick.v1 | agents |

### 6. Database Changes
```sql
CREATE SCHEMA agents; -- Agent configs and execution logs
CREATE TABLE agents.configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/agent/start` | `{ "strategyId": "uuid", "maxExposure": 10000 }` | `{ "agentId": "uuid" }` | Bearer | Start trading agent |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.trading.agent.action.v1` | autonomous-agent-service | broker-integration-service | agentId, action, qty, price | BACKWARD | 1 Year |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-AGENT-HEALTH | `* * * * *` | autonomous-agent-service | Verify agent limits not breached | Kill Agent | None |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| GCCMarketScreen | `/gcc` | Tadawul, DFM data | Mandatory | GCC | New |
| AutonomousDashboard | `/agents` | Manage trading bots | Mandatory | Global | New |

### 12. Infrastructure Changes
- **Dubai Data Center**: Third region
- **Global CDN**: Edge caching for static assets

### 13. Security Requirements
- **Strict Autonomous Circuit Breakers**: Hard stop at 5% daily loss per agent
- **Geo-fencing compliance**: Data residency for Saudi users

### 14. Testing Strategy
- **Load: Cross-region DB replication latency**: Ensure < 50ms
- **Security: Agent sandbox escape test**: Ensure agents cannot access unauthorized funds

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Active-Active-Active failover tested successfully
- [ ] Autonomous agents pass 3-month paper trading audit

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R1.0 Alpha: EGX + KYC/AML/PDPL + Portfolio + Subscription
### 1. Release Header
**Vision:** Deliver Alpha: EGX + KYC/AML/PDPL + Portfolio + Subscription within Months 1-3.

**Business Goals:**
- Establish foundational K8s infrastructure and CI/CD.
- Deploy core identity, KYC, AML, and PDPL compliance modules.
- Enable EGX portfolio management and watchlists.
- Implement foundational market calendar.
- Deliver Subscription and Billing components.
- Establish immutable WORM audit trails in MinIO.
- Release Flutter mobile app with Arabic RTL first.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX (Equities)**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| UserIdentity | Core | Manage authentication and sessions | New | Keycloak |
| KYCVerification | Compliance | Identity verification and liveness | New | UserIdentity |
| AMLScreening | Compliance | Sanctions and PEP screening | New | KYCVerification |
| PDPLCompliance | Compliance | Data privacy and right-to-be-forgotten | New | UserIdentity |
| Portfolio | Trading | User holdings and cash balances | New | UserIdentity, SecurityMaster |
| Position | Trading | Asset positions per portfolio | New | Portfolio |
| Transaction | Trading | Ledger of asset movements | New | Position |
| Watchlist | Trading | User-tracked securities | New | SecurityMaster |
| SecurityMaster | Market Data | Source of truth for instruments | New | None |
| MarketCalendar | Market Data | Trading sessions and holidays | New | None |
| Subscription | Billing | User tier management | New | UserIdentity |
| Billing | Billing | Invoicing and payment processing | New | Subscription |
| Notification | Core | SMS, Email, Push alerts | New | UserIdentity |
| AuditTrail | Compliance | Immutable event logging | New | Kafka |
| SessionStatus | Market Data | Real-time market status | New | MarketCalendar |

### 4. Implementation-Ordered Modules
**1. K8s Infrastructure**
- **Priority:** P0
- **Dependencies:** None
- **Complexity:** XL
- **Acceptance Criteria:** Cluster up, FluxCD synced, OPA gatekeeper active
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. PostgreSQL+Patroni**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** L
- **Acceptance Criteria:** HA setup, pgBouncer, backup to MinIO
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. Kafka+Karapace**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** L
- **Acceptance Criteria:** Schema registry active, 3 brokers, ACLs
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. MinIO WORM**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Compliance mode ON, retention policies set
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. OpenBao**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Secrets injected via mutating webhook
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**6. Keycloak**
- **Priority:** P0
- **Dependencies:** PostgreSQL
- **Complexity:** M
- **Acceptance Criteria:** OIDC flows working, OTP SMS integrated
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**7. Kong**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Ingress controller, rate limiting plugins
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**8. Unleash**
- **Priority:** P1
- **Dependencies:** PostgreSQL
- **Complexity:** S
- **Acceptance Criteria:** Feature flags toggleable without deploy
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**9. FluxCD**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** S
- **Acceptance Criteria:** GitOps sync block during 08:45-15:20
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**10. Prometheus stack**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Metrics server, Grafana, Alertmanager
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**11. identity-service**
- **Priority:** P0
- **Dependencies:** Keycloak
- **Complexity:** M
- **Acceptance Criteria:** JWT minting, session tracking
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**12. kyc-service**
- **Priority:** P0
- **Dependencies:** identity-service
- **Complexity:** L
- **Acceptance Criteria:** ID upload, Liveness, Maker-Checker
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**13. compliance-service**
- **Priority:** P0
- **Dependencies:** kyc-service
- **Complexity:** M
- **Acceptance Criteria:** AML webhook, PDPL logs
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**14. portfolio-service**
- **Priority:** P0
- **Dependencies:** identity-service
- **Complexity:** L
- **Acceptance Criteria:** Create portfolio, deposit mock funds
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**15. subscription-service**
- **Priority:** P1
- **Dependencies:** identity-service
- **Complexity:** M
- **Acceptance Criteria:** Plan selection, quotas
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**16. market-calendar-service**
- **Priority:** P0
- **Dependencies:** None
- **Complexity:** S
- **Acceptance Criteria:** EGX holidays API
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**17. notification-service**
- **Priority:** P1
- **Dependencies:** Kafka
- **Complexity:** M
- **Acceptance Criteria:** Push token registry, SMS sender
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| identity-service | NestJS/TS | New | UserIdentity | POST /auth/login<br>POST /auth/otp<br>GET /users/me | user.created.v1 | None | identity |
| kyc-service | NestJS/TS | New | KYCVerification | POST /kyc/upload<br>POST /kyc/liveness<br>GET /kyc/status | kyc.submitted.v1 | user.created.v1 | kyc |
| compliance-service | NestJS/TS | New | AMLScreening, PDPL | POST /aml/screen<br>POST /pdpl/erase<br>GET /pdpl/consent | aml.cleared.v1 | kyc.submitted.v1 | compliance |
| portfolio-service | NestJS/TS | New | Portfolio, Position | POST /portfolios<br>GET /portfolios<br>GET /portfolios/:id/positions | portfolio.created.v1 | user.created.v1 | portfolio |
| subscription-service | NestJS/TS | New | Subscription, Billing | GET /plans<br>POST /subscriptions<br>GET /subscriptions/me | subscription.active.v1 | user.created.v1 | subscription |

### 6. Database Changes
```sql
CREATE SCHEMA identity; -- User authentication data
CREATE TABLE identity.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA kyc; -- Verification documents and status
CREATE TABLE kyc.kyc_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA compliance; -- AML hits and PDPL requests
CREATE TABLE compliance.aml_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA portfolio; -- Holdings and ledgers
CREATE TABLE portfolio.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA subscription; -- Billing and plans
CREATE TABLE subscription.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/auth/login` | `{ "phone": "string" }` | `{ "token": "string" }` | None | OTP step 1 |
| GET | `/api/v1/portfolios` | `None` | `{ "portfolios": [] }` | Bearer | Lists user portfolios |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.identity.user.created.v1` | identity-service | kyc-service, portfolio | userId, phone, timestamp | BACKWARD | Infinite |
| `tradeora.kyc.verification.submitted.v1` | kyc-service | compliance-service | userId, documentId | BACKWARD | 1 Year |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-KYC-EXPIRY-CHECK | `0 2 * * *` | kyc-service | Flags expired IDs | Log Error | 3 retries |
| JOB-AML-REFRESH | `0 1 * * *` | compliance-service | Re-screens against new lists | Alert SecOps | No retry |
| JOB-SESSION-HEALTH | `*/5 * * * *` | market-calendar | Checks API connectivity | Alert DevOps | 1 min |

### 10. AI Engines
*No AI Engines active for this release.*

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| RegistrationScreen | `/register` | Phone, OTP, Passcode | Mandatory | EGX | New |
| NationalIDUploadScreen | `/kyc/id` | Camera OCR, Edge detection | Mandatory | EGX | New |
| LivenessCheckScreen | `/kyc/liveness` | Face tracking | Mandatory | EGX | New |
| KYCStatusScreen | `/kyc/status` | Pending/Rejected states | Mandatory | EGX | New |
| HomeScreen | `/home` | Dashboard, widgets | Mandatory | EGX | New |
| PortfolioScreen | `/portfolio` | Holdings list, PnL | Mandatory | EGX | New |

### 12. Infrastructure Changes
- **K8s Cluster**: Base orchestration
- **PostgreSQL**: Relational storage
- **Kafka**: Event bus
- **MinIO**: WORM compliance

### 13. Security Requirements
- WORM compliance strictly enforced
- OIDC for all user flows
- NetworkPolicies isolating DB from Ingress
- Secrets in OpenBao

### 14. Testing Strategy
- Unit: 80% coverage on core logic
- Integration: Testcontainers for Postgres/Kafka
- Load: 1000 VU login flow

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] KYC maker-checker flow approved by compliance
- [ ] WORM logs verified by auditor
- [ ] Pen-test zero critical findings

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R2.0 Beta: EGX + Forex market data + Technical indicators
### 1. Release Header
**Vision:** Deliver Beta: EGX + Forex market data + Technical indicators within Months 4-6.

**Business Goals:**
- Integrate EGX market data feeds via WebSocket.
- Integrate Forex pricing feeds (24/5) with 5 decimal precision.
- Implement scalable timeseries DB (TimescaleDB).
- Compute and serve OHLCV bars.
- Implement technical indicators (RSI, MACD, MA).
- Enhance frontend with real-time charting.
- Implement real-time alerting engine.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX (Equities), Forex (FX Major/Minor)**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| MarketDataGateway | Market Data | Ingest and normalize external feeds | New | SecurityMaster |
| Pricing | Market Data | Manage real-time quotes | New | MarketDataGateway |
| Timeseries | Analytics | OHLCV aggregation and storage | New | Pricing |
| TechnicalAnalysis | Analytics | Indicator computation | New | Timeseries |
| Alerting | Core | User defined price/indicator alerts | New | Pricing, TechnicalAnalysis |

### 4. Implementation-Ordered Modules
**1. Market Data WebSocket Clients**
- **Priority:** P0
- **Dependencies:** None
- **Complexity:** L
- **Acceptance Criteria:** Connect, reconnect, parse messages
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. TimescaleDB Setup**
- **Priority:** P0
- **Dependencies:** PostgreSQL
- **Complexity:** M
- **Acceptance Criteria:** Hypertables created, retention policies
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. market-data-service**
- **Priority:** P0
- **Dependencies:** Kafka
- **Complexity:** XL
- **Acceptance Criteria:** Publish ticks to Kafka at high throughput
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. pricing-service**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** Maintain latest price in Valkey
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. timeseries-service**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** Aggregate ticks to 1m, 5m, 1h, 1d
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**6. technical-analysis-service**
- **Priority:** P1
- **Dependencies:** timeseries-service
- **Complexity:** L
- **Acceptance Criteria:** Compute RSI, MACD on demand
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**7. alerting-service**
- **Priority:** P1
- **Dependencies:** pricing-service
- **Complexity:** M
- **Acceptance Criteria:** Evaluate conditions, trigger notifications
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| market-data-service | FastAPI/Python | New | MarketDataGateway | GET /health | None | None | None |
| pricing-service | NestJS/TS | New | Pricing | GET /quotes/:symbol | price.updated.v1 | market.tick.v1 | None |
| timeseries-service | FastAPI/Python | New | Timeseries | GET /ohlcv/:symbol | ohlcv.created.v1 | market.tick.v1 | timeseries |

### 6. Database Changes
```sql
CREATE SCHEMA timeseries; -- Market data OHLCV
CREATE TABLE timeseries.bars_1m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| GET | `/api/v1/quotes/:symbol` | `None` | `{ "bid": "1.00000", "ask": "1.00010" }` | Bearer | Real-time quote |
| GET | `/api/v1/ohlcv/:symbol` | `?resolution=1D` | `{ "bars": [] }` | Bearer | Historical bars |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.marketdata.tick.v1` | market-data-service | pricing, timeseries | symbol, bid, ask, ts | FORWARD | 24 Hours |
| `tradeora.timeseries.ohlcv.created.v1` | timeseries-service | technical-analysis | symbol, timeframe, o, h, l, c, v | BACKWARD | 7 Days |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-EGX-OHLCV-COMPUTE | `*/1 10-15 * * 0-4` | timeseries-service | Build EGX bars | Skip | No retry |
| JOB-FOREX-OHLCV-COMPUTE | `* * * * 1-5` | timeseries-service | Build Forex bars | Skip | No retry |

### 10. AI Engines
*No AI Engines active for this release.*

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| ForexMarketScreen | `/forex` | Pairs list, spread | Mandatory | Forex | New |
| TechnicalChartScreen | `/chart/:symbol` | Candlestick chart, indicators | Mandatory | EGX/Forex | New |
| AlertsScreen | `/alerts` | Manage price alerts | Mandatory | All | New |

### 12. Infrastructure Changes
- **TimescaleDB**: Time-series extension for Postgres
- **Valkey**: In-memory cache for latest quotes

### 13. Security Requirements
- **Rate limit market data endpoints**: Prevent abuse
- **Validate timeframe parameters**: Prevent DoS via huge queries

### 14. Testing Strategy
- **Load: 10,000 ticks/sec ingestion**: Ensure Kafka/Timescale DB hold up
- **Unit: Indicator math precision**: Assert Decimal arithmetic

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Forex feed running 24/5 with 0 downtime for 1 week
- [ ] Charts render smoothly on mobile

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R3.0 Beta: 12-school AI Consensus + LLM Gateway
### 1. Release Header
**Vision:** Deliver Beta: 12-school AI Consensus + LLM Gateway within Months 7-9.

**Business Goals:**
- Deploy LLM Gateway and Ollama compute nodes.
- Implement 12 AI schools (Technical, Fundamental, Macro, Sentiment, etc.).
- Develop AI Consensus engine for aggregated scoring.
- Generate daily market briefs via LLM.
- Mandatory FRA/CBE disclaimers on AI output.
- No autonomous trading.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| AIGateway | AI | Route requests to LLMs, manage quotas | New | Subscription |
| AIEngine | AI | School evaluation logic | New | AIGateway, Timeseries |
| AIConsensus | AI | Aggregate school scores | New | AIEngine |
| ContentGeneration | AI | Daily briefs and summaries | New | AIConsensus, AIGateway |

### 4. Implementation-Ordered Modules
**1. Ollama Deployment**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** CPU nodes for Llama3 inference
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. LiteLLM Proxy**
- **Priority:** P0
- **Dependencies:** Ollama
- **Complexity:** S
- **Acceptance Criteria:** Routing and cost tracking
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. ai-gateway-service**
- **Priority:** P0
- **Dependencies:** LiteLLM
- **Complexity:** M
- **Acceptance Criteria:** Auth, rate limits, audit logging
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. school-technical**
- **Priority:** P0
- **Dependencies:** technical-analysis-service
- **Complexity:** M
- **Acceptance Criteria:** Evaluate TA indicators
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. school-macro**
- **Priority:** P0
- **Dependencies:** market-data
- **Complexity:** M
- **Acceptance Criteria:** Evaluate interest rates, inflation
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**6. consensus-service**
- **Priority:** P0
- **Dependencies:** schools
- **Complexity:** L
- **Acceptance Criteria:** Weighted scoring, JSON output
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**7. content-service**
- **Priority:** P1
- **Dependencies:** consensus-service
- **Complexity:** M
- **Acceptance Criteria:** Prompt assembly, translation to Arabic
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| ai-gateway-service | FastAPI/Python | New | AIGateway | POST /v1/chat/completions | ai.request.v1 | None | ai_audit |
| consensus-service | FastAPI/Python | New | AIConsensus | GET /consensus/:symbol | consensus.computed.v1 | None | consensus |
| content-service | FastAPI/Python | New | ContentGeneration | GET /briefs/daily | content.generated.v1 | None | content |

### 6. Database Changes
```sql
CREATE SCHEMA ai_audit; -- WORM logs for all AI prompts/responses
CREATE TABLE ai_audit.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA consensus; -- Historical AI scores
CREATE TABLE consensus.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| GET | `/api/v1/consensus/:symbol` | `None` | `{ "score": 85, "direction": "BULLISH" }` | Bearer | Aggregated AI score |
| GET | `/api/v1/briefs/daily` | `None` | `{ "content_ar": "..." }` | Bearer | Daily brief |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.ai.consensus.computed.v1` | consensus-service | content-service | symbol, score, timestamp | BACKWARD | 1 Year |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-DAILY-BRIEF | `30 8 * * *` | content-service | Generate EGX brief before open | Alert Editorial | 3 retries |
| JOB-RECOMMENDATION-BATCH | `0 9 * * *` | consensus-service | Precompute scores | Alert DataSci | 1 retry |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| AIRecommendationScreen | `/ai/recommendations` | List of top picks | Mandatory | EGX/Forex | New |
| AIExplanationScreen | `/ai/explain/:symbol` | Detailed breakdown of 12 schools | Mandatory | EGX/Forex | New |
| DailyBriefScreen | `/briefs/daily` | Morning newsletter view | Mandatory | EGX/Forex | New |

### 12. Infrastructure Changes
- **Ollama CPU Nodes**: Self-hosted open source models
- **LiteLLM**: LLM proxy

### 13. Security Requirements
- **Prompt injection filtering**: Block malicious prompts
- **Mandatory Disclaimer Append**: Ensure FRA/CBE disclaimers attached to all outputs

### 14. Testing Strategy
- **Unit: Consensus weighting logic**: Ensure sums to 100%
- **Integration: LiteLLM routing**: Fallback to secondary model if primary down

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] AI latency < 3s for cached consensus
- [ ] Disclaimers verified on 100% of test outputs

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R4.0 GA: Analytics + Risk (VaR, drawdown) + Reports
### 1. Release Header
**Vision:** Deliver GA: Analytics + Risk (VaR, drawdown) + Reports within Months 10-12.

**Business Goals:**
- Implement portfolio analytics (Beta, Sharpe, Sortino).
- Calculate Value at Risk (VaR) and max drawdown.
- Generate automated tax and performance reports (PDF).
- Optimize database performance for heavy analytical queries.
- General Availability release for EGX and Forex.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| RiskManagement | Analytics | VaR and drawdown calculations | New | Portfolio, Timeseries |
| Reporting | Core | Generate PDF statements | New | Portfolio, Transaction |

### 4. Implementation-Ordered Modules
**1. risk-service**
- **Priority:** P0
- **Dependencies:** timeseries-service
- **Complexity:** L
- **Acceptance Criteria:** Monte Carlo VaR simulation
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. analytics-service**
- **Priority:** P0
- **Dependencies:** portfolio-service
- **Complexity:** M
- **Acceptance Criteria:** Sharpe ratio, beta compute
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. reporting-service**
- **Priority:** P0
- **Dependencies:** portfolio-service
- **Complexity:** M
- **Acceptance Criteria:** PDF generation via Puppeteer/ReportLab
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. Report Storage**
- **Priority:** P0
- **Dependencies:** MinIO
- **Complexity:** S
- **Acceptance Criteria:** Bucket for generated statements
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| risk-service | FastAPI/Python | New | RiskManagement | GET /risk/var/:portfolioId | risk.computed.v1 | None | risk |
| analytics-service | NestJS/TS | New | Analytics | GET /analytics/portfolio/:id | None | None | analytics |
| reporting-service | NestJS/TS | New | Reporting | POST /reports/generate<br>GET /reports/:id/download | report.ready.v1 | None | reports |

### 6. Database Changes
```sql
CREATE SCHEMA risk; -- Daily risk metrics per portfolio
CREATE TABLE risk.var_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA reports; -- Metadata for generated reports
CREATE TABLE reports.report_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| GET | `/api/v1/analytics/portfolio/:id` | `None` | `{ "sharpe": 1.2, "beta": 0.9 }` | Bearer | Portfolio stats |
| POST | `/api/v1/reports/generate` | `{ "type": "TAX", "year": 2024 }` | `{ "jobId": "uuid" }` | Bearer | Async PDF gen |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.reporting.ready.v1` | reporting-service | notification-service | reportId, userId | BACKWARD | 7 Days |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-DAILY-VAR | `0 2 * * *` | risk-service | Compute VaR for all active portfolios | Alert RiskTeam | 2 retries |

### 10. AI Engines
*No AI Engines active for this release.*

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| AnalyticsDashboard | `/portfolio/analytics` | Charts for performance | Mandatory | All | New |
| ReportsScreen | `/reports` | Download statements | Mandatory | All | New |

### 12. Infrastructure Changes
- **Headless Chrome / ReportLab**: For PDF generation

### 13. Security Requirements
- **Signed URLs for PDF downloads**: Valid for 5 minutes only

### 14. Testing Strategy
- **Unit: VaR mathematical correctness**: Compare with known dataset
- **Load: PDF generation queue under load**: 

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] VaR computed accurately for 1000 test portfolios
- [ ] GA Launch criteria met

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R5.0 Enterprise: Crypto markets + AI Learning + Backtesting internal
### 1. Release Header
**Vision:** Deliver Enterprise: Crypto markets + AI Learning + Backtesting internal within Months 13-18.

**Business Goals:**
- Integrate Crypto feeds (Binance/Kraken) with 8 decimal precision.
- Deploy GPU nodes (NVIDIA A100) and vLLM for advanced AI.
- Implement internal backtesting engine (Rule 40: available_from_ts).
- Implement On-chain metrics integration (Glassnode).
- Add AI self-learning/calibration loops.
- Mandatory CBE disclaimers for Crypto.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex, Crypto**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| CryptoGateway | Market Data | Crypto exchange WebSockets | New | SecurityMaster |
| OnChainMetrics | Analytics | Blockchain data ingestion | New | CryptoGateway |
| Backtesting | AI | Historical strategy validation | New | Timeseries |
| AILearning | AI | Model weight calibration | New | AIConsensus |

### 4. Implementation-Ordered Modules
**1. Crypto WebSocket Clients**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** M
- **Acceptance Criteria:** 24/7 ingestion
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. GPU Infrastructure**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** L
- **Acceptance Criteria:** vLLM deployment for Llama3-70B
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. backtest-engine**
- **Priority:** P0
- **Dependencies:** timeseries-service
- **Complexity:** XL
- **Acceptance Criteria:** Vectorized backtesting avoiding look-ahead bias
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. onchain-service**
- **Priority:** P1
- **Dependencies:** CryptoGateway
- **Complexity:** M
- **Acceptance Criteria:** Glassnode API client
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. ai-calibration-service**
- **Priority:** P0
- **Dependencies:** consensus-service
- **Complexity:** L
- **Acceptance Criteria:** Compare predictions vs reality
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| backtest-engine | FastAPI/Python | New | Backtesting | POST /backtest/run | backtest.completed.v1 | None | backtests |
| onchain-service | FastAPI/Python | New | OnChainMetrics | GET /onchain/:asset | None | None | onchain |
| ai-calibration-service | FastAPI/Python | New | AILearning | POST /calibrate | calibration.applied.v1 | None | ai_weights |

### 6. Database Changes
```sql
CREATE SCHEMA backtests; -- Backtest results and params
CREATE TABLE backtests.runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA ai_weights; -- Historical school weights
CREATE TABLE ai_weights.weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/backtest/run` | `{ "strategy": "MACD_CROSS", "asset": "BTC" }` | `{ "cagr": 0.15, "maxDrawdown": -0.2 }` | Admin | Internal use only |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.crypto.tick.v1` | market-data-service | pricing, timeseries | symbol, bid, ask, ts | FORWARD | 24 Hours |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-CRYPTO-OHLCV | `* * * * *` | timeseries-service | Build Crypto bars (24/7) | Alert DevOps | No retry |
| JOB-GROUND-TRUTH-COLLECT | `0 9 * * *` | ai-calibration-service | Record actual outcomes | Log Error | 3 retries |
| JOB-SCHOOL-CALIBRATE | `0 0 * * 0` | ai-calibration-service | Weekly weight update | Alert DataSci | None |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| CryptoMarketScreen | `/crypto` | Coin list, 24h change | Mandatory | Crypto | New |
| CryptoCurrencyDetailScreen | `/crypto/:id` | Orderbook, chart, on-chain | Mandatory | Crypto | New |

### 12. Infrastructure Changes
- **NVIDIA A100 Nodes**: GPU compute
- **vLLM**: High throughput LLM serving

### 13. Security Requirements
- **Isolate backtesting DB access**: Prevent impact on prod timeseries

### 14. Testing Strategy
- **Integration: Backtesting Rule 40 check**: Assert available_from_ts is respected
- **Market: 24/7 continuity test**: Simulate crypto weekend load

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Backtester matches manual calculation within 0.01%
- [ ] Crypto feed handles 50k ticks/sec

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R6.0 Scale: US Stocks + 17 schools + Broker integration
### 1. Release Header
**Vision:** Deliver Scale: US Stocks + 17 schools + Broker integration within Months 19-30.

**Business Goals:**
- Integrate US market data (NYSE/NASDAQ) with 2 decimal precision.
- Implement DST handling for US market hours.
- Expand AI to 17 schools (adding Options flow, Dark pool data).
- Integrate execution broker (Interactive Brokers / Alpaca).
- Deploy multi-region Kafka (MirrorMaker 2).
- Mandatory SEC disclaimers.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex, Crypto, US Stocks**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| USGateway | Market Data | SIP feeds ingestion | New | SecurityMaster |
| OrderRouting | Trading | Route orders to external brokers | New | Portfolio |
| CorporateActions | Market Data | Splits, dividends | New | Timeseries |

### 4. Implementation-Ordered Modules
**1. US Market WebSocket**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** High throughput OPRA/SIP feeds
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. DST Management**
- **Priority:** P0
- **Dependencies:** market-calendar-service
- **Complexity:** S
- **Acceptance Criteria:** Handle ET/EET conversions
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. broker-integration-service**
- **Priority:** P0
- **Dependencies:** OrderRouting
- **Complexity:** XL
- **Acceptance Criteria:** FIX protocol or REST API to brokers
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. corporate-actions-service**
- **Priority:** P1
- **Dependencies:** CorporateActions
- **Complexity:** M
- **Acceptance Criteria:** Adjust historical data for splits
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. Kafka MirrorMaker 2**
- **Priority:** P0
- **Dependencies:** Kafka
- **Complexity:** L
- **Acceptance Criteria:** Sync topics between Cairo and Riyadh
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| broker-integration-service | NestJS/TS | New | OrderRouting | POST /orders/route | order.routed.v1 | order.created.v1 | routing |
| corporate-actions-service | FastAPI/Python | New | CorporateActions | GET /actions/:symbol | action.applied.v1 | None | corp_actions |

### 6. Database Changes
```sql
CREATE SCHEMA routing; -- Order routing states
CREATE TABLE routing.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA corp_actions; -- Dividends and splits
CREATE TABLE corp_actions.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/orders/route` | `{ "orderId": "uuid" }` | `{ "status": "ACCEPTED" }` | Internal | Routes validated order |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.us.tick.v1` | market-data-service | pricing, timeseries | symbol, bid, ask, ts | FORWARD | 24 Hours |
| `tradeora.trading.order.routed.v1` | broker-integration-service | portfolio | orderId, brokerId, status | BACKWARD | Infinite |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-US-OHLCV | `* 9-16 * * 1-5` | timeseries-service | Build US bars (ET) | Skip | No retry |
| JOB-EARNINGS-SYNC | `0 6 * * *` | market-calendar-service | Fetch US earnings dates | Log | 3 retries |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| USMarketScreen | `/us` | S&P500, top movers | Mandatory | US Stocks | New |
| OptionsFlowScreen | `/us/options` | Unusual options activity | Mandatory | US Stocks | New |

### 12. Infrastructure Changes
- **Kafka MirrorMaker 2**: Cross-region replication
- **Dedicated US Leased Line**: Low latency market data

### 13. Security Requirements
- **FIX Protocol TLS/VPN**: Secure broker connection

### 14. Testing Strategy
- **Unit: Split adjustment logic**: Ensure historical prices adjust correctly
- **Integration: Order routing state machine**: Verify ACK/NACK handling

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Order round-trip time to US broker < 500ms
- [ ] US market data ingested without lag during market open

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R7.0 Global: GCC + Global + Autonomous agents
### 1. Release Header
**Vision:** Deliver Global: GCC + Global + Autonomous agents within Months 31-48.

**Business Goals:**
- Expand to GCC markets (Tadawul, DFM).
- Deploy third active region (Dubai) for Active-Active-Active.
- Launch Global CDN for edge caching.
- Introduce autonomous trading agents (Opt-in, strict limits).
- Full multi-lingual support (Arabic, English, French).

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **Global (GCC, EU, Asia)**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| AutonomousTrading | AI | Algorithmic execution logic | New | OrderRouting, AIEngine |
| GlobalRouting | Infra | Geo-DNS and CDN | New | None |

### 4. Implementation-Ordered Modules
**1. GCC Market Connectors**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** Tadawul FIX feeds
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. Dubai Region Standup**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** XL
- **Acceptance Criteria:** Full cluster clone in UAE
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. autonomous-agent-service**
- **Priority:** P0
- **Dependencies:** AutonomousTrading
- **Complexity:** XL
- **Acceptance Criteria:** Execution logic with strict circuit breakers
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. Global CDN Setup**
- **Priority:** P0
- **Dependencies:** GlobalRouting
- **Complexity:** M
- **Acceptance Criteria:** Cloudflare/Akamai config
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| autonomous-agent-service | FastAPI/Python | New | AutonomousTrading | POST /agent/start<br>POST /agent/stop | agent.action.v1 | market.tick.v1 | agents |

### 6. Database Changes
```sql
CREATE SCHEMA agents; -- Agent configs and execution logs
CREATE TABLE agents.configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/agent/start` | `{ "strategyId": "uuid", "maxExposure": 10000 }` | `{ "agentId": "uuid" }` | Bearer | Start trading agent |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.trading.agent.action.v1` | autonomous-agent-service | broker-integration-service | agentId, action, qty, price | BACKWARD | 1 Year |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-AGENT-HEALTH | `* * * * *` | autonomous-agent-service | Verify agent limits not breached | Kill Agent | None |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| GCCMarketScreen | `/gcc` | Tadawul, DFM data | Mandatory | GCC | New |
| AutonomousDashboard | `/agents` | Manage trading bots | Mandatory | Global | New |

### 12. Infrastructure Changes
- **Dubai Data Center**: Third region
- **Global CDN**: Edge caching for static assets

### 13. Security Requirements
- **Strict Autonomous Circuit Breakers**: Hard stop at 5% daily loss per agent
- **Geo-fencing compliance**: Data residency for Saudi users

### 14. Testing Strategy
- **Load: Cross-region DB replication latency**: Ensure < 50ms
- **Security: Agent sandbox escape test**: Ensure agents cannot access unauthorized funds

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Active-Active-Active failover tested successfully
- [ ] Autonomous agents pass 3-month paper trading audit

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R1.0 Alpha: EGX + KYC/AML/PDPL + Portfolio + Subscription
### 1. Release Header
**Vision:** Deliver Alpha: EGX + KYC/AML/PDPL + Portfolio + Subscription within Months 1-3.

**Business Goals:**
- Establish foundational K8s infrastructure and CI/CD.
- Deploy core identity, KYC, AML, and PDPL compliance modules.
- Enable EGX portfolio management and watchlists.
- Implement foundational market calendar.
- Deliver Subscription and Billing components.
- Establish immutable WORM audit trails in MinIO.
- Release Flutter mobile app with Arabic RTL first.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX (Equities)**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| UserIdentity | Core | Manage authentication and sessions | New | Keycloak |
| KYCVerification | Compliance | Identity verification and liveness | New | UserIdentity |
| AMLScreening | Compliance | Sanctions and PEP screening | New | KYCVerification |
| PDPLCompliance | Compliance | Data privacy and right-to-be-forgotten | New | UserIdentity |
| Portfolio | Trading | User holdings and cash balances | New | UserIdentity, SecurityMaster |
| Position | Trading | Asset positions per portfolio | New | Portfolio |
| Transaction | Trading | Ledger of asset movements | New | Position |
| Watchlist | Trading | User-tracked securities | New | SecurityMaster |
| SecurityMaster | Market Data | Source of truth for instruments | New | None |
| MarketCalendar | Market Data | Trading sessions and holidays | New | None |
| Subscription | Billing | User tier management | New | UserIdentity |
| Billing | Billing | Invoicing and payment processing | New | Subscription |
| Notification | Core | SMS, Email, Push alerts | New | UserIdentity |
| AuditTrail | Compliance | Immutable event logging | New | Kafka |
| SessionStatus | Market Data | Real-time market status | New | MarketCalendar |

### 4. Implementation-Ordered Modules
**1. K8s Infrastructure**
- **Priority:** P0
- **Dependencies:** None
- **Complexity:** XL
- **Acceptance Criteria:** Cluster up, FluxCD synced, OPA gatekeeper active
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. PostgreSQL+Patroni**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** L
- **Acceptance Criteria:** HA setup, pgBouncer, backup to MinIO
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. Kafka+Karapace**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** L
- **Acceptance Criteria:** Schema registry active, 3 brokers, ACLs
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. MinIO WORM**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Compliance mode ON, retention policies set
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. OpenBao**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Secrets injected via mutating webhook
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**6. Keycloak**
- **Priority:** P0
- **Dependencies:** PostgreSQL
- **Complexity:** M
- **Acceptance Criteria:** OIDC flows working, OTP SMS integrated
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**7. Kong**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Ingress controller, rate limiting plugins
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**8. Unleash**
- **Priority:** P1
- **Dependencies:** PostgreSQL
- **Complexity:** S
- **Acceptance Criteria:** Feature flags toggleable without deploy
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**9. FluxCD**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** S
- **Acceptance Criteria:** GitOps sync block during 08:45-15:20
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**10. Prometheus stack**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Metrics server, Grafana, Alertmanager
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**11. identity-service**
- **Priority:** P0
- **Dependencies:** Keycloak
- **Complexity:** M
- **Acceptance Criteria:** JWT minting, session tracking
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**12. kyc-service**
- **Priority:** P0
- **Dependencies:** identity-service
- **Complexity:** L
- **Acceptance Criteria:** ID upload, Liveness, Maker-Checker
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**13. compliance-service**
- **Priority:** P0
- **Dependencies:** kyc-service
- **Complexity:** M
- **Acceptance Criteria:** AML webhook, PDPL logs
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**14. portfolio-service**
- **Priority:** P0
- **Dependencies:** identity-service
- **Complexity:** L
- **Acceptance Criteria:** Create portfolio, deposit mock funds
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**15. subscription-service**
- **Priority:** P1
- **Dependencies:** identity-service
- **Complexity:** M
- **Acceptance Criteria:** Plan selection, quotas
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**16. market-calendar-service**
- **Priority:** P0
- **Dependencies:** None
- **Complexity:** S
- **Acceptance Criteria:** EGX holidays API
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**17. notification-service**
- **Priority:** P1
- **Dependencies:** Kafka
- **Complexity:** M
- **Acceptance Criteria:** Push token registry, SMS sender
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| identity-service | NestJS/TS | New | UserIdentity | POST /auth/login<br>POST /auth/otp<br>GET /users/me | user.created.v1 | None | identity |
| kyc-service | NestJS/TS | New | KYCVerification | POST /kyc/upload<br>POST /kyc/liveness<br>GET /kyc/status | kyc.submitted.v1 | user.created.v1 | kyc |
| compliance-service | NestJS/TS | New | AMLScreening, PDPL | POST /aml/screen<br>POST /pdpl/erase<br>GET /pdpl/consent | aml.cleared.v1 | kyc.submitted.v1 | compliance |
| portfolio-service | NestJS/TS | New | Portfolio, Position | POST /portfolios<br>GET /portfolios<br>GET /portfolios/:id/positions | portfolio.created.v1 | user.created.v1 | portfolio |
| subscription-service | NestJS/TS | New | Subscription, Billing | GET /plans<br>POST /subscriptions<br>GET /subscriptions/me | subscription.active.v1 | user.created.v1 | subscription |

### 6. Database Changes
```sql
CREATE SCHEMA identity; -- User authentication data
CREATE TABLE identity.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA kyc; -- Verification documents and status
CREATE TABLE kyc.kyc_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA compliance; -- AML hits and PDPL requests
CREATE TABLE compliance.aml_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA portfolio; -- Holdings and ledgers
CREATE TABLE portfolio.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA subscription; -- Billing and plans
CREATE TABLE subscription.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/auth/login` | `{ "phone": "string" }` | `{ "token": "string" }` | None | OTP step 1 |
| GET | `/api/v1/portfolios` | `None` | `{ "portfolios": [] }` | Bearer | Lists user portfolios |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.identity.user.created.v1` | identity-service | kyc-service, portfolio | userId, phone, timestamp | BACKWARD | Infinite |
| `tradeora.kyc.verification.submitted.v1` | kyc-service | compliance-service | userId, documentId | BACKWARD | 1 Year |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-KYC-EXPIRY-CHECK | `0 2 * * *` | kyc-service | Flags expired IDs | Log Error | 3 retries |
| JOB-AML-REFRESH | `0 1 * * *` | compliance-service | Re-screens against new lists | Alert SecOps | No retry |
| JOB-SESSION-HEALTH | `*/5 * * * *` | market-calendar | Checks API connectivity | Alert DevOps | 1 min |

### 10. AI Engines
*No AI Engines active for this release.*

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| RegistrationScreen | `/register` | Phone, OTP, Passcode | Mandatory | EGX | New |
| NationalIDUploadScreen | `/kyc/id` | Camera OCR, Edge detection | Mandatory | EGX | New |
| LivenessCheckScreen | `/kyc/liveness` | Face tracking | Mandatory | EGX | New |
| KYCStatusScreen | `/kyc/status` | Pending/Rejected states | Mandatory | EGX | New |
| HomeScreen | `/home` | Dashboard, widgets | Mandatory | EGX | New |
| PortfolioScreen | `/portfolio` | Holdings list, PnL | Mandatory | EGX | New |

### 12. Infrastructure Changes
- **K8s Cluster**: Base orchestration
- **PostgreSQL**: Relational storage
- **Kafka**: Event bus
- **MinIO**: WORM compliance

### 13. Security Requirements
- WORM compliance strictly enforced
- OIDC for all user flows
- NetworkPolicies isolating DB from Ingress
- Secrets in OpenBao

### 14. Testing Strategy
- Unit: 80% coverage on core logic
- Integration: Testcontainers for Postgres/Kafka
- Load: 1000 VU login flow

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] KYC maker-checker flow approved by compliance
- [ ] WORM logs verified by auditor
- [ ] Pen-test zero critical findings

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R2.0 Beta: EGX + Forex market data + Technical indicators
### 1. Release Header
**Vision:** Deliver Beta: EGX + Forex market data + Technical indicators within Months 4-6.

**Business Goals:**
- Integrate EGX market data feeds via WebSocket.
- Integrate Forex pricing feeds (24/5) with 5 decimal precision.
- Implement scalable timeseries DB (TimescaleDB).
- Compute and serve OHLCV bars.
- Implement technical indicators (RSI, MACD, MA).
- Enhance frontend with real-time charting.
- Implement real-time alerting engine.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX (Equities), Forex (FX Major/Minor)**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| MarketDataGateway | Market Data | Ingest and normalize external feeds | New | SecurityMaster |
| Pricing | Market Data | Manage real-time quotes | New | MarketDataGateway |
| Timeseries | Analytics | OHLCV aggregation and storage | New | Pricing |
| TechnicalAnalysis | Analytics | Indicator computation | New | Timeseries |
| Alerting | Core | User defined price/indicator alerts | New | Pricing, TechnicalAnalysis |

### 4. Implementation-Ordered Modules
**1. Market Data WebSocket Clients**
- **Priority:** P0
- **Dependencies:** None
- **Complexity:** L
- **Acceptance Criteria:** Connect, reconnect, parse messages
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. TimescaleDB Setup**
- **Priority:** P0
- **Dependencies:** PostgreSQL
- **Complexity:** M
- **Acceptance Criteria:** Hypertables created, retention policies
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. market-data-service**
- **Priority:** P0
- **Dependencies:** Kafka
- **Complexity:** XL
- **Acceptance Criteria:** Publish ticks to Kafka at high throughput
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. pricing-service**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** Maintain latest price in Valkey
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. timeseries-service**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** Aggregate ticks to 1m, 5m, 1h, 1d
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**6. technical-analysis-service**
- **Priority:** P1
- **Dependencies:** timeseries-service
- **Complexity:** L
- **Acceptance Criteria:** Compute RSI, MACD on demand
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**7. alerting-service**
- **Priority:** P1
- **Dependencies:** pricing-service
- **Complexity:** M
- **Acceptance Criteria:** Evaluate conditions, trigger notifications
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| market-data-service | FastAPI/Python | New | MarketDataGateway | GET /health | None | None | None |
| pricing-service | NestJS/TS | New | Pricing | GET /quotes/:symbol | price.updated.v1 | market.tick.v1 | None |
| timeseries-service | FastAPI/Python | New | Timeseries | GET /ohlcv/:symbol | ohlcv.created.v1 | market.tick.v1 | timeseries |

### 6. Database Changes
```sql
CREATE SCHEMA timeseries; -- Market data OHLCV
CREATE TABLE timeseries.bars_1m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| GET | `/api/v1/quotes/:symbol` | `None` | `{ "bid": "1.00000", "ask": "1.00010" }` | Bearer | Real-time quote |
| GET | `/api/v1/ohlcv/:symbol` | `?resolution=1D` | `{ "bars": [] }` | Bearer | Historical bars |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.marketdata.tick.v1` | market-data-service | pricing, timeseries | symbol, bid, ask, ts | FORWARD | 24 Hours |
| `tradeora.timeseries.ohlcv.created.v1` | timeseries-service | technical-analysis | symbol, timeframe, o, h, l, c, v | BACKWARD | 7 Days |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-EGX-OHLCV-COMPUTE | `*/1 10-15 * * 0-4` | timeseries-service | Build EGX bars | Skip | No retry |
| JOB-FOREX-OHLCV-COMPUTE | `* * * * 1-5` | timeseries-service | Build Forex bars | Skip | No retry |

### 10. AI Engines
*No AI Engines active for this release.*

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| ForexMarketScreen | `/forex` | Pairs list, spread | Mandatory | Forex | New |
| TechnicalChartScreen | `/chart/:symbol` | Candlestick chart, indicators | Mandatory | EGX/Forex | New |
| AlertsScreen | `/alerts` | Manage price alerts | Mandatory | All | New |

### 12. Infrastructure Changes
- **TimescaleDB**: Time-series extension for Postgres
- **Valkey**: In-memory cache for latest quotes

### 13. Security Requirements
- **Rate limit market data endpoints**: Prevent abuse
- **Validate timeframe parameters**: Prevent DoS via huge queries

### 14. Testing Strategy
- **Load: 10,000 ticks/sec ingestion**: Ensure Kafka/Timescale DB hold up
- **Unit: Indicator math precision**: Assert Decimal arithmetic

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Forex feed running 24/5 with 0 downtime for 1 week
- [ ] Charts render smoothly on mobile

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R3.0 Beta: 12-school AI Consensus + LLM Gateway
### 1. Release Header
**Vision:** Deliver Beta: 12-school AI Consensus + LLM Gateway within Months 7-9.

**Business Goals:**
- Deploy LLM Gateway and Ollama compute nodes.
- Implement 12 AI schools (Technical, Fundamental, Macro, Sentiment, etc.).
- Develop AI Consensus engine for aggregated scoring.
- Generate daily market briefs via LLM.
- Mandatory FRA/CBE disclaimers on AI output.
- No autonomous trading.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| AIGateway | AI | Route requests to LLMs, manage quotas | New | Subscription |
| AIEngine | AI | School evaluation logic | New | AIGateway, Timeseries |
| AIConsensus | AI | Aggregate school scores | New | AIEngine |
| ContentGeneration | AI | Daily briefs and summaries | New | AIConsensus, AIGateway |

### 4. Implementation-Ordered Modules
**1. Ollama Deployment**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** CPU nodes for Llama3 inference
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. LiteLLM Proxy**
- **Priority:** P0
- **Dependencies:** Ollama
- **Complexity:** S
- **Acceptance Criteria:** Routing and cost tracking
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. ai-gateway-service**
- **Priority:** P0
- **Dependencies:** LiteLLM
- **Complexity:** M
- **Acceptance Criteria:** Auth, rate limits, audit logging
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. school-technical**
- **Priority:** P0
- **Dependencies:** technical-analysis-service
- **Complexity:** M
- **Acceptance Criteria:** Evaluate TA indicators
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. school-macro**
- **Priority:** P0
- **Dependencies:** market-data
- **Complexity:** M
- **Acceptance Criteria:** Evaluate interest rates, inflation
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**6. consensus-service**
- **Priority:** P0
- **Dependencies:** schools
- **Complexity:** L
- **Acceptance Criteria:** Weighted scoring, JSON output
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**7. content-service**
- **Priority:** P1
- **Dependencies:** consensus-service
- **Complexity:** M
- **Acceptance Criteria:** Prompt assembly, translation to Arabic
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| ai-gateway-service | FastAPI/Python | New | AIGateway | POST /v1/chat/completions | ai.request.v1 | None | ai_audit |
| consensus-service | FastAPI/Python | New | AIConsensus | GET /consensus/:symbol | consensus.computed.v1 | None | consensus |
| content-service | FastAPI/Python | New | ContentGeneration | GET /briefs/daily | content.generated.v1 | None | content |

### 6. Database Changes
```sql
CREATE SCHEMA ai_audit; -- WORM logs for all AI prompts/responses
CREATE TABLE ai_audit.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA consensus; -- Historical AI scores
CREATE TABLE consensus.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| GET | `/api/v1/consensus/:symbol` | `None` | `{ "score": 85, "direction": "BULLISH" }` | Bearer | Aggregated AI score |
| GET | `/api/v1/briefs/daily` | `None` | `{ "content_ar": "..." }` | Bearer | Daily brief |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.ai.consensus.computed.v1` | consensus-service | content-service | symbol, score, timestamp | BACKWARD | 1 Year |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-DAILY-BRIEF | `30 8 * * *` | content-service | Generate EGX brief before open | Alert Editorial | 3 retries |
| JOB-RECOMMENDATION-BATCH | `0 9 * * *` | consensus-service | Precompute scores | Alert DataSci | 1 retry |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| AIRecommendationScreen | `/ai/recommendations` | List of top picks | Mandatory | EGX/Forex | New |
| AIExplanationScreen | `/ai/explain/:symbol` | Detailed breakdown of 12 schools | Mandatory | EGX/Forex | New |
| DailyBriefScreen | `/briefs/daily` | Morning newsletter view | Mandatory | EGX/Forex | New |

### 12. Infrastructure Changes
- **Ollama CPU Nodes**: Self-hosted open source models
- **LiteLLM**: LLM proxy

### 13. Security Requirements
- **Prompt injection filtering**: Block malicious prompts
- **Mandatory Disclaimer Append**: Ensure FRA/CBE disclaimers attached to all outputs

### 14. Testing Strategy
- **Unit: Consensus weighting logic**: Ensure sums to 100%
- **Integration: LiteLLM routing**: Fallback to secondary model if primary down

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] AI latency < 3s for cached consensus
- [ ] Disclaimers verified on 100% of test outputs

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R4.0 GA: Analytics + Risk (VaR, drawdown) + Reports
### 1. Release Header
**Vision:** Deliver GA: Analytics + Risk (VaR, drawdown) + Reports within Months 10-12.

**Business Goals:**
- Implement portfolio analytics (Beta, Sharpe, Sortino).
- Calculate Value at Risk (VaR) and max drawdown.
- Generate automated tax and performance reports (PDF).
- Optimize database performance for heavy analytical queries.
- General Availability release for EGX and Forex.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| RiskManagement | Analytics | VaR and drawdown calculations | New | Portfolio, Timeseries |
| Reporting | Core | Generate PDF statements | New | Portfolio, Transaction |

### 4. Implementation-Ordered Modules
**1. risk-service**
- **Priority:** P0
- **Dependencies:** timeseries-service
- **Complexity:** L
- **Acceptance Criteria:** Monte Carlo VaR simulation
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. analytics-service**
- **Priority:** P0
- **Dependencies:** portfolio-service
- **Complexity:** M
- **Acceptance Criteria:** Sharpe ratio, beta compute
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. reporting-service**
- **Priority:** P0
- **Dependencies:** portfolio-service
- **Complexity:** M
- **Acceptance Criteria:** PDF generation via Puppeteer/ReportLab
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. Report Storage**
- **Priority:** P0
- **Dependencies:** MinIO
- **Complexity:** S
- **Acceptance Criteria:** Bucket for generated statements
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| risk-service | FastAPI/Python | New | RiskManagement | GET /risk/var/:portfolioId | risk.computed.v1 | None | risk |
| analytics-service | NestJS/TS | New | Analytics | GET /analytics/portfolio/:id | None | None | analytics |
| reporting-service | NestJS/TS | New | Reporting | POST /reports/generate<br>GET /reports/:id/download | report.ready.v1 | None | reports |

### 6. Database Changes
```sql
CREATE SCHEMA risk; -- Daily risk metrics per portfolio
CREATE TABLE risk.var_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA reports; -- Metadata for generated reports
CREATE TABLE reports.report_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| GET | `/api/v1/analytics/portfolio/:id` | `None` | `{ "sharpe": 1.2, "beta": 0.9 }` | Bearer | Portfolio stats |
| POST | `/api/v1/reports/generate` | `{ "type": "TAX", "year": 2024 }` | `{ "jobId": "uuid" }` | Bearer | Async PDF gen |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.reporting.ready.v1` | reporting-service | notification-service | reportId, userId | BACKWARD | 7 Days |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-DAILY-VAR | `0 2 * * *` | risk-service | Compute VaR for all active portfolios | Alert RiskTeam | 2 retries |

### 10. AI Engines
*No AI Engines active for this release.*

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| AnalyticsDashboard | `/portfolio/analytics` | Charts for performance | Mandatory | All | New |
| ReportsScreen | `/reports` | Download statements | Mandatory | All | New |

### 12. Infrastructure Changes
- **Headless Chrome / ReportLab**: For PDF generation

### 13. Security Requirements
- **Signed URLs for PDF downloads**: Valid for 5 minutes only

### 14. Testing Strategy
- **Unit: VaR mathematical correctness**: Compare with known dataset
- **Load: PDF generation queue under load**: 

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] VaR computed accurately for 1000 test portfolios
- [ ] GA Launch criteria met

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R5.0 Enterprise: Crypto markets + AI Learning + Backtesting internal
### 1. Release Header
**Vision:** Deliver Enterprise: Crypto markets + AI Learning + Backtesting internal within Months 13-18.

**Business Goals:**
- Integrate Crypto feeds (Binance/Kraken) with 8 decimal precision.
- Deploy GPU nodes (NVIDIA A100) and vLLM for advanced AI.
- Implement internal backtesting engine (Rule 40: available_from_ts).
- Implement On-chain metrics integration (Glassnode).
- Add AI self-learning/calibration loops.
- Mandatory CBE disclaimers for Crypto.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex, Crypto**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| CryptoGateway | Market Data | Crypto exchange WebSockets | New | SecurityMaster |
| OnChainMetrics | Analytics | Blockchain data ingestion | New | CryptoGateway |
| Backtesting | AI | Historical strategy validation | New | Timeseries |
| AILearning | AI | Model weight calibration | New | AIConsensus |

### 4. Implementation-Ordered Modules
**1. Crypto WebSocket Clients**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** M
- **Acceptance Criteria:** 24/7 ingestion
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. GPU Infrastructure**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** L
- **Acceptance Criteria:** vLLM deployment for Llama3-70B
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. backtest-engine**
- **Priority:** P0
- **Dependencies:** timeseries-service
- **Complexity:** XL
- **Acceptance Criteria:** Vectorized backtesting avoiding look-ahead bias
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. onchain-service**
- **Priority:** P1
- **Dependencies:** CryptoGateway
- **Complexity:** M
- **Acceptance Criteria:** Glassnode API client
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. ai-calibration-service**
- **Priority:** P0
- **Dependencies:** consensus-service
- **Complexity:** L
- **Acceptance Criteria:** Compare predictions vs reality
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| backtest-engine | FastAPI/Python | New | Backtesting | POST /backtest/run | backtest.completed.v1 | None | backtests |
| onchain-service | FastAPI/Python | New | OnChainMetrics | GET /onchain/:asset | None | None | onchain |
| ai-calibration-service | FastAPI/Python | New | AILearning | POST /calibrate | calibration.applied.v1 | None | ai_weights |

### 6. Database Changes
```sql
CREATE SCHEMA backtests; -- Backtest results and params
CREATE TABLE backtests.runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA ai_weights; -- Historical school weights
CREATE TABLE ai_weights.weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/backtest/run` | `{ "strategy": "MACD_CROSS", "asset": "BTC" }` | `{ "cagr": 0.15, "maxDrawdown": -0.2 }` | Admin | Internal use only |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.crypto.tick.v1` | market-data-service | pricing, timeseries | symbol, bid, ask, ts | FORWARD | 24 Hours |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-CRYPTO-OHLCV | `* * * * *` | timeseries-service | Build Crypto bars (24/7) | Alert DevOps | No retry |
| JOB-GROUND-TRUTH-COLLECT | `0 9 * * *` | ai-calibration-service | Record actual outcomes | Log Error | 3 retries |
| JOB-SCHOOL-CALIBRATE | `0 0 * * 0` | ai-calibration-service | Weekly weight update | Alert DataSci | None |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| CryptoMarketScreen | `/crypto` | Coin list, 24h change | Mandatory | Crypto | New |
| CryptoCurrencyDetailScreen | `/crypto/:id` | Orderbook, chart, on-chain | Mandatory | Crypto | New |

### 12. Infrastructure Changes
- **NVIDIA A100 Nodes**: GPU compute
- **vLLM**: High throughput LLM serving

### 13. Security Requirements
- **Isolate backtesting DB access**: Prevent impact on prod timeseries

### 14. Testing Strategy
- **Integration: Backtesting Rule 40 check**: Assert available_from_ts is respected
- **Market: 24/7 continuity test**: Simulate crypto weekend load

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Backtester matches manual calculation within 0.01%
- [ ] Crypto feed handles 50k ticks/sec

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R6.0 Scale: US Stocks + 17 schools + Broker integration
### 1. Release Header
**Vision:** Deliver Scale: US Stocks + 17 schools + Broker integration within Months 19-30.

**Business Goals:**
- Integrate US market data (NYSE/NASDAQ) with 2 decimal precision.
- Implement DST handling for US market hours.
- Expand AI to 17 schools (adding Options flow, Dark pool data).
- Integrate execution broker (Interactive Brokers / Alpaca).
- Deploy multi-region Kafka (MirrorMaker 2).
- Mandatory SEC disclaimers.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex, Crypto, US Stocks**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| USGateway | Market Data | SIP feeds ingestion | New | SecurityMaster |
| OrderRouting | Trading | Route orders to external brokers | New | Portfolio |
| CorporateActions | Market Data | Splits, dividends | New | Timeseries |

### 4. Implementation-Ordered Modules
**1. US Market WebSocket**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** High throughput OPRA/SIP feeds
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. DST Management**
- **Priority:** P0
- **Dependencies:** market-calendar-service
- **Complexity:** S
- **Acceptance Criteria:** Handle ET/EET conversions
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. broker-integration-service**
- **Priority:** P0
- **Dependencies:** OrderRouting
- **Complexity:** XL
- **Acceptance Criteria:** FIX protocol or REST API to brokers
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. corporate-actions-service**
- **Priority:** P1
- **Dependencies:** CorporateActions
- **Complexity:** M
- **Acceptance Criteria:** Adjust historical data for splits
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. Kafka MirrorMaker 2**
- **Priority:** P0
- **Dependencies:** Kafka
- **Complexity:** L
- **Acceptance Criteria:** Sync topics between Cairo and Riyadh
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| broker-integration-service | NestJS/TS | New | OrderRouting | POST /orders/route | order.routed.v1 | order.created.v1 | routing |
| corporate-actions-service | FastAPI/Python | New | CorporateActions | GET /actions/:symbol | action.applied.v1 | None | corp_actions |

### 6. Database Changes
```sql
CREATE SCHEMA routing; -- Order routing states
CREATE TABLE routing.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA corp_actions; -- Dividends and splits
CREATE TABLE corp_actions.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/orders/route` | `{ "orderId": "uuid" }` | `{ "status": "ACCEPTED" }` | Internal | Routes validated order |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.us.tick.v1` | market-data-service | pricing, timeseries | symbol, bid, ask, ts | FORWARD | 24 Hours |
| `tradeora.trading.order.routed.v1` | broker-integration-service | portfolio | orderId, brokerId, status | BACKWARD | Infinite |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-US-OHLCV | `* 9-16 * * 1-5` | timeseries-service | Build US bars (ET) | Skip | No retry |
| JOB-EARNINGS-SYNC | `0 6 * * *` | market-calendar-service | Fetch US earnings dates | Log | 3 retries |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| USMarketScreen | `/us` | S&P500, top movers | Mandatory | US Stocks | New |
| OptionsFlowScreen | `/us/options` | Unusual options activity | Mandatory | US Stocks | New |

### 12. Infrastructure Changes
- **Kafka MirrorMaker 2**: Cross-region replication
- **Dedicated US Leased Line**: Low latency market data

### 13. Security Requirements
- **FIX Protocol TLS/VPN**: Secure broker connection

### 14. Testing Strategy
- **Unit: Split adjustment logic**: Ensure historical prices adjust correctly
- **Integration: Order routing state machine**: Verify ACK/NACK handling

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Order round-trip time to US broker < 500ms
- [ ] US market data ingested without lag during market open

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R7.0 Global: GCC + Global + Autonomous agents
### 1. Release Header
**Vision:** Deliver Global: GCC + Global + Autonomous agents within Months 31-48.

**Business Goals:**
- Expand to GCC markets (Tadawul, DFM).
- Deploy third active region (Dubai) for Active-Active-Active.
- Launch Global CDN for edge caching.
- Introduce autonomous trading agents (Opt-in, strict limits).
- Full multi-lingual support (Arabic, English, French).

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **Global (GCC, EU, Asia)**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| AutonomousTrading | AI | Algorithmic execution logic | New | OrderRouting, AIEngine |
| GlobalRouting | Infra | Geo-DNS and CDN | New | None |

### 4. Implementation-Ordered Modules
**1. GCC Market Connectors**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** Tadawul FIX feeds
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. Dubai Region Standup**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** XL
- **Acceptance Criteria:** Full cluster clone in UAE
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. autonomous-agent-service**
- **Priority:** P0
- **Dependencies:** AutonomousTrading
- **Complexity:** XL
- **Acceptance Criteria:** Execution logic with strict circuit breakers
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. Global CDN Setup**
- **Priority:** P0
- **Dependencies:** GlobalRouting
- **Complexity:** M
- **Acceptance Criteria:** Cloudflare/Akamai config
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| autonomous-agent-service | FastAPI/Python | New | AutonomousTrading | POST /agent/start<br>POST /agent/stop | agent.action.v1 | market.tick.v1 | agents |

### 6. Database Changes
```sql
CREATE SCHEMA agents; -- Agent configs and execution logs
CREATE TABLE agents.configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/agent/start` | `{ "strategyId": "uuid", "maxExposure": 10000 }` | `{ "agentId": "uuid" }` | Bearer | Start trading agent |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.trading.agent.action.v1` | autonomous-agent-service | broker-integration-service | agentId, action, qty, price | BACKWARD | 1 Year |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-AGENT-HEALTH | `* * * * *` | autonomous-agent-service | Verify agent limits not breached | Kill Agent | None |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| GCCMarketScreen | `/gcc` | Tadawul, DFM data | Mandatory | GCC | New |
| AutonomousDashboard | `/agents` | Manage trading bots | Mandatory | Global | New |

### 12. Infrastructure Changes
- **Dubai Data Center**: Third region
- **Global CDN**: Edge caching for static assets

### 13. Security Requirements
- **Strict Autonomous Circuit Breakers**: Hard stop at 5% daily loss per agent
- **Geo-fencing compliance**: Data residency for Saudi users

### 14. Testing Strategy
- **Load: Cross-region DB replication latency**: Ensure < 50ms
- **Security: Agent sandbox escape test**: Ensure agents cannot access unauthorized funds

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Active-Active-Active failover tested successfully
- [ ] Autonomous agents pass 3-month paper trading audit

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R1.0 Alpha: EGX + KYC/AML/PDPL + Portfolio + Subscription
### 1. Release Header
**Vision:** Deliver Alpha: EGX + KYC/AML/PDPL + Portfolio + Subscription within Months 1-3.

**Business Goals:**
- Establish foundational K8s infrastructure and CI/CD.
- Deploy core identity, KYC, AML, and PDPL compliance modules.
- Enable EGX portfolio management and watchlists.
- Implement foundational market calendar.
- Deliver Subscription and Billing components.
- Establish immutable WORM audit trails in MinIO.
- Release Flutter mobile app with Arabic RTL first.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX (Equities)**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| UserIdentity | Core | Manage authentication and sessions | New | Keycloak |
| KYCVerification | Compliance | Identity verification and liveness | New | UserIdentity |
| AMLScreening | Compliance | Sanctions and PEP screening | New | KYCVerification |
| PDPLCompliance | Compliance | Data privacy and right-to-be-forgotten | New | UserIdentity |
| Portfolio | Trading | User holdings and cash balances | New | UserIdentity, SecurityMaster |
| Position | Trading | Asset positions per portfolio | New | Portfolio |
| Transaction | Trading | Ledger of asset movements | New | Position |
| Watchlist | Trading | User-tracked securities | New | SecurityMaster |
| SecurityMaster | Market Data | Source of truth for instruments | New | None |
| MarketCalendar | Market Data | Trading sessions and holidays | New | None |
| Subscription | Billing | User tier management | New | UserIdentity |
| Billing | Billing | Invoicing and payment processing | New | Subscription |
| Notification | Core | SMS, Email, Push alerts | New | UserIdentity |
| AuditTrail | Compliance | Immutable event logging | New | Kafka |
| SessionStatus | Market Data | Real-time market status | New | MarketCalendar |

### 4. Implementation-Ordered Modules
**1. K8s Infrastructure**
- **Priority:** P0
- **Dependencies:** None
- **Complexity:** XL
- **Acceptance Criteria:** Cluster up, FluxCD synced, OPA gatekeeper active
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. PostgreSQL+Patroni**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** L
- **Acceptance Criteria:** HA setup, pgBouncer, backup to MinIO
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. Kafka+Karapace**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** L
- **Acceptance Criteria:** Schema registry active, 3 brokers, ACLs
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. MinIO WORM**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Compliance mode ON, retention policies set
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. OpenBao**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Secrets injected via mutating webhook
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**6. Keycloak**
- **Priority:** P0
- **Dependencies:** PostgreSQL
- **Complexity:** M
- **Acceptance Criteria:** OIDC flows working, OTP SMS integrated
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**7. Kong**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Ingress controller, rate limiting plugins
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**8. Unleash**
- **Priority:** P1
- **Dependencies:** PostgreSQL
- **Complexity:** S
- **Acceptance Criteria:** Feature flags toggleable without deploy
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**9. FluxCD**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** S
- **Acceptance Criteria:** GitOps sync block during 08:45-15:20
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**10. Prometheus stack**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** Metrics server, Grafana, Alertmanager
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**11. identity-service**
- **Priority:** P0
- **Dependencies:** Keycloak
- **Complexity:** M
- **Acceptance Criteria:** JWT minting, session tracking
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**12. kyc-service**
- **Priority:** P0
- **Dependencies:** identity-service
- **Complexity:** L
- **Acceptance Criteria:** ID upload, Liveness, Maker-Checker
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**13. compliance-service**
- **Priority:** P0
- **Dependencies:** kyc-service
- **Complexity:** M
- **Acceptance Criteria:** AML webhook, PDPL logs
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**14. portfolio-service**
- **Priority:** P0
- **Dependencies:** identity-service
- **Complexity:** L
- **Acceptance Criteria:** Create portfolio, deposit mock funds
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**15. subscription-service**
- **Priority:** P1
- **Dependencies:** identity-service
- **Complexity:** M
- **Acceptance Criteria:** Plan selection, quotas
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**16. market-calendar-service**
- **Priority:** P0
- **Dependencies:** None
- **Complexity:** S
- **Acceptance Criteria:** EGX holidays API
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**17. notification-service**
- **Priority:** P1
- **Dependencies:** Kafka
- **Complexity:** M
- **Acceptance Criteria:** Push token registry, SMS sender
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| identity-service | NestJS/TS | New | UserIdentity | POST /auth/login<br>POST /auth/otp<br>GET /users/me | user.created.v1 | None | identity |
| kyc-service | NestJS/TS | New | KYCVerification | POST /kyc/upload<br>POST /kyc/liveness<br>GET /kyc/status | kyc.submitted.v1 | user.created.v1 | kyc |
| compliance-service | NestJS/TS | New | AMLScreening, PDPL | POST /aml/screen<br>POST /pdpl/erase<br>GET /pdpl/consent | aml.cleared.v1 | kyc.submitted.v1 | compliance |
| portfolio-service | NestJS/TS | New | Portfolio, Position | POST /portfolios<br>GET /portfolios<br>GET /portfolios/:id/positions | portfolio.created.v1 | user.created.v1 | portfolio |
| subscription-service | NestJS/TS | New | Subscription, Billing | GET /plans<br>POST /subscriptions<br>GET /subscriptions/me | subscription.active.v1 | user.created.v1 | subscription |

### 6. Database Changes
```sql
CREATE SCHEMA identity; -- User authentication data
CREATE TABLE identity.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA kyc; -- Verification documents and status
CREATE TABLE kyc.kyc_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA compliance; -- AML hits and PDPL requests
CREATE TABLE compliance.aml_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA portfolio; -- Holdings and ledgers
CREATE TABLE portfolio.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA subscription; -- Billing and plans
CREATE TABLE subscription.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/auth/login` | `{ "phone": "string" }` | `{ "token": "string" }` | None | OTP step 1 |
| GET | `/api/v1/portfolios` | `None` | `{ "portfolios": [] }` | Bearer | Lists user portfolios |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.identity.user.created.v1` | identity-service | kyc-service, portfolio | userId, phone, timestamp | BACKWARD | Infinite |
| `tradeora.kyc.verification.submitted.v1` | kyc-service | compliance-service | userId, documentId | BACKWARD | 1 Year |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-KYC-EXPIRY-CHECK | `0 2 * * *` | kyc-service | Flags expired IDs | Log Error | 3 retries |
| JOB-AML-REFRESH | `0 1 * * *` | compliance-service | Re-screens against new lists | Alert SecOps | No retry |
| JOB-SESSION-HEALTH | `*/5 * * * *` | market-calendar | Checks API connectivity | Alert DevOps | 1 min |

### 10. AI Engines
*No AI Engines active for this release.*

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| RegistrationScreen | `/register` | Phone, OTP, Passcode | Mandatory | EGX | New |
| NationalIDUploadScreen | `/kyc/id` | Camera OCR, Edge detection | Mandatory | EGX | New |
| LivenessCheckScreen | `/kyc/liveness` | Face tracking | Mandatory | EGX | New |
| KYCStatusScreen | `/kyc/status` | Pending/Rejected states | Mandatory | EGX | New |
| HomeScreen | `/home` | Dashboard, widgets | Mandatory | EGX | New |
| PortfolioScreen | `/portfolio` | Holdings list, PnL | Mandatory | EGX | New |

### 12. Infrastructure Changes
- **K8s Cluster**: Base orchestration
- **PostgreSQL**: Relational storage
- **Kafka**: Event bus
- **MinIO**: WORM compliance

### 13. Security Requirements
- WORM compliance strictly enforced
- OIDC for all user flows
- NetworkPolicies isolating DB from Ingress
- Secrets in OpenBao

### 14. Testing Strategy
- Unit: 80% coverage on core logic
- Integration: Testcontainers for Postgres/Kafka
- Load: 1000 VU login flow

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] KYC maker-checker flow approved by compliance
- [ ] WORM logs verified by auditor
- [ ] Pen-test zero critical findings

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R2.0 Beta: EGX + Forex market data + Technical indicators
### 1. Release Header
**Vision:** Deliver Beta: EGX + Forex market data + Technical indicators within Months 4-6.

**Business Goals:**
- Integrate EGX market data feeds via WebSocket.
- Integrate Forex pricing feeds (24/5) with 5 decimal precision.
- Implement scalable timeseries DB (TimescaleDB).
- Compute and serve OHLCV bars.
- Implement technical indicators (RSI, MACD, MA).
- Enhance frontend with real-time charting.
- Implement real-time alerting engine.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX (Equities), Forex (FX Major/Minor)**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| MarketDataGateway | Market Data | Ingest and normalize external feeds | New | SecurityMaster |
| Pricing | Market Data | Manage real-time quotes | New | MarketDataGateway |
| Timeseries | Analytics | OHLCV aggregation and storage | New | Pricing |
| TechnicalAnalysis | Analytics | Indicator computation | New | Timeseries |
| Alerting | Core | User defined price/indicator alerts | New | Pricing, TechnicalAnalysis |

### 4. Implementation-Ordered Modules
**1. Market Data WebSocket Clients**
- **Priority:** P0
- **Dependencies:** None
- **Complexity:** L
- **Acceptance Criteria:** Connect, reconnect, parse messages
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. TimescaleDB Setup**
- **Priority:** P0
- **Dependencies:** PostgreSQL
- **Complexity:** M
- **Acceptance Criteria:** Hypertables created, retention policies
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. market-data-service**
- **Priority:** P0
- **Dependencies:** Kafka
- **Complexity:** XL
- **Acceptance Criteria:** Publish ticks to Kafka at high throughput
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. pricing-service**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** Maintain latest price in Valkey
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. timeseries-service**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** Aggregate ticks to 1m, 5m, 1h, 1d
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**6. technical-analysis-service**
- **Priority:** P1
- **Dependencies:** timeseries-service
- **Complexity:** L
- **Acceptance Criteria:** Compute RSI, MACD on demand
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**7. alerting-service**
- **Priority:** P1
- **Dependencies:** pricing-service
- **Complexity:** M
- **Acceptance Criteria:** Evaluate conditions, trigger notifications
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| market-data-service | FastAPI/Python | New | MarketDataGateway | GET /health | None | None | None |
| pricing-service | NestJS/TS | New | Pricing | GET /quotes/:symbol | price.updated.v1 | market.tick.v1 | None |
| timeseries-service | FastAPI/Python | New | Timeseries | GET /ohlcv/:symbol | ohlcv.created.v1 | market.tick.v1 | timeseries |

### 6. Database Changes
```sql
CREATE SCHEMA timeseries; -- Market data OHLCV
CREATE TABLE timeseries.bars_1m (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| GET | `/api/v1/quotes/:symbol` | `None` | `{ "bid": "1.00000", "ask": "1.00010" }` | Bearer | Real-time quote |
| GET | `/api/v1/ohlcv/:symbol` | `?resolution=1D` | `{ "bars": [] }` | Bearer | Historical bars |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.marketdata.tick.v1` | market-data-service | pricing, timeseries | symbol, bid, ask, ts | FORWARD | 24 Hours |
| `tradeora.timeseries.ohlcv.created.v1` | timeseries-service | technical-analysis | symbol, timeframe, o, h, l, c, v | BACKWARD | 7 Days |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-EGX-OHLCV-COMPUTE | `*/1 10-15 * * 0-4` | timeseries-service | Build EGX bars | Skip | No retry |
| JOB-FOREX-OHLCV-COMPUTE | `* * * * 1-5` | timeseries-service | Build Forex bars | Skip | No retry |

### 10. AI Engines
*No AI Engines active for this release.*

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| ForexMarketScreen | `/forex` | Pairs list, spread | Mandatory | Forex | New |
| TechnicalChartScreen | `/chart/:symbol` | Candlestick chart, indicators | Mandatory | EGX/Forex | New |
| AlertsScreen | `/alerts` | Manage price alerts | Mandatory | All | New |

### 12. Infrastructure Changes
- **TimescaleDB**: Time-series extension for Postgres
- **Valkey**: In-memory cache for latest quotes

### 13. Security Requirements
- **Rate limit market data endpoints**: Prevent abuse
- **Validate timeframe parameters**: Prevent DoS via huge queries

### 14. Testing Strategy
- **Load: 10,000 ticks/sec ingestion**: Ensure Kafka/Timescale DB hold up
- **Unit: Indicator math precision**: Assert Decimal arithmetic

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Forex feed running 24/5 with 0 downtime for 1 week
- [ ] Charts render smoothly on mobile

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R3.0 Beta: 12-school AI Consensus + LLM Gateway
### 1. Release Header
**Vision:** Deliver Beta: 12-school AI Consensus + LLM Gateway within Months 7-9.

**Business Goals:**
- Deploy LLM Gateway and Ollama compute nodes.
- Implement 12 AI schools (Technical, Fundamental, Macro, Sentiment, etc.).
- Develop AI Consensus engine for aggregated scoring.
- Generate daily market briefs via LLM.
- Mandatory FRA/CBE disclaimers on AI output.
- No autonomous trading.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| AIGateway | AI | Route requests to LLMs, manage quotas | New | Subscription |
| AIEngine | AI | School evaluation logic | New | AIGateway, Timeseries |
| AIConsensus | AI | Aggregate school scores | New | AIEngine |
| ContentGeneration | AI | Daily briefs and summaries | New | AIConsensus, AIGateway |

### 4. Implementation-Ordered Modules
**1. Ollama Deployment**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** M
- **Acceptance Criteria:** CPU nodes for Llama3 inference
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. LiteLLM Proxy**
- **Priority:** P0
- **Dependencies:** Ollama
- **Complexity:** S
- **Acceptance Criteria:** Routing and cost tracking
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. ai-gateway-service**
- **Priority:** P0
- **Dependencies:** LiteLLM
- **Complexity:** M
- **Acceptance Criteria:** Auth, rate limits, audit logging
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. school-technical**
- **Priority:** P0
- **Dependencies:** technical-analysis-service
- **Complexity:** M
- **Acceptance Criteria:** Evaluate TA indicators
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. school-macro**
- **Priority:** P0
- **Dependencies:** market-data
- **Complexity:** M
- **Acceptance Criteria:** Evaluate interest rates, inflation
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**6. consensus-service**
- **Priority:** P0
- **Dependencies:** schools
- **Complexity:** L
- **Acceptance Criteria:** Weighted scoring, JSON output
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**7. content-service**
- **Priority:** P1
- **Dependencies:** consensus-service
- **Complexity:** M
- **Acceptance Criteria:** Prompt assembly, translation to Arabic
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| ai-gateway-service | FastAPI/Python | New | AIGateway | POST /v1/chat/completions | ai.request.v1 | None | ai_audit |
| consensus-service | FastAPI/Python | New | AIConsensus | GET /consensus/:symbol | consensus.computed.v1 | None | consensus |
| content-service | FastAPI/Python | New | ContentGeneration | GET /briefs/daily | content.generated.v1 | None | content |

### 6. Database Changes
```sql
CREATE SCHEMA ai_audit; -- WORM logs for all AI prompts/responses
CREATE TABLE ai_audit.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA consensus; -- Historical AI scores
CREATE TABLE consensus.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| GET | `/api/v1/consensus/:symbol` | `None` | `{ "score": 85, "direction": "BULLISH" }` | Bearer | Aggregated AI score |
| GET | `/api/v1/briefs/daily` | `None` | `{ "content_ar": "..." }` | Bearer | Daily brief |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.ai.consensus.computed.v1` | consensus-service | content-service | symbol, score, timestamp | BACKWARD | 1 Year |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-DAILY-BRIEF | `30 8 * * *` | content-service | Generate EGX brief before open | Alert Editorial | 3 retries |
| JOB-RECOMMENDATION-BATCH | `0 9 * * *` | consensus-service | Precompute scores | Alert DataSci | 1 retry |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| AIRecommendationScreen | `/ai/recommendations` | List of top picks | Mandatory | EGX/Forex | New |
| AIExplanationScreen | `/ai/explain/:symbol` | Detailed breakdown of 12 schools | Mandatory | EGX/Forex | New |
| DailyBriefScreen | `/briefs/daily` | Morning newsletter view | Mandatory | EGX/Forex | New |

### 12. Infrastructure Changes
- **Ollama CPU Nodes**: Self-hosted open source models
- **LiteLLM**: LLM proxy

### 13. Security Requirements
- **Prompt injection filtering**: Block malicious prompts
- **Mandatory Disclaimer Append**: Ensure FRA/CBE disclaimers attached to all outputs

### 14. Testing Strategy
- **Unit: Consensus weighting logic**: Ensure sums to 100%
- **Integration: LiteLLM routing**: Fallback to secondary model if primary down

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] AI latency < 3s for cached consensus
- [ ] Disclaimers verified on 100% of test outputs

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R4.0 GA: Analytics + Risk (VaR, drawdown) + Reports
### 1. Release Header
**Vision:** Deliver GA: Analytics + Risk (VaR, drawdown) + Reports within Months 10-12.

**Business Goals:**
- Implement portfolio analytics (Beta, Sharpe, Sortino).
- Calculate Value at Risk (VaR) and max drawdown.
- Generate automated tax and performance reports (PDF).
- Optimize database performance for heavy analytical queries.
- General Availability release for EGX and Forex.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| RiskManagement | Analytics | VaR and drawdown calculations | New | Portfolio, Timeseries |
| Reporting | Core | Generate PDF statements | New | Portfolio, Transaction |

### 4. Implementation-Ordered Modules
**1. risk-service**
- **Priority:** P0
- **Dependencies:** timeseries-service
- **Complexity:** L
- **Acceptance Criteria:** Monte Carlo VaR simulation
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. analytics-service**
- **Priority:** P0
- **Dependencies:** portfolio-service
- **Complexity:** M
- **Acceptance Criteria:** Sharpe ratio, beta compute
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. reporting-service**
- **Priority:** P0
- **Dependencies:** portfolio-service
- **Complexity:** M
- **Acceptance Criteria:** PDF generation via Puppeteer/ReportLab
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. Report Storage**
- **Priority:** P0
- **Dependencies:** MinIO
- **Complexity:** S
- **Acceptance Criteria:** Bucket for generated statements
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| risk-service | FastAPI/Python | New | RiskManagement | GET /risk/var/:portfolioId | risk.computed.v1 | None | risk |
| analytics-service | NestJS/TS | New | Analytics | GET /analytics/portfolio/:id | None | None | analytics |
| reporting-service | NestJS/TS | New | Reporting | POST /reports/generate<br>GET /reports/:id/download | report.ready.v1 | None | reports |

### 6. Database Changes
```sql
CREATE SCHEMA risk; -- Daily risk metrics per portfolio
CREATE TABLE risk.var_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA reports; -- Metadata for generated reports
CREATE TABLE reports.report_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| GET | `/api/v1/analytics/portfolio/:id` | `None` | `{ "sharpe": 1.2, "beta": 0.9 }` | Bearer | Portfolio stats |
| POST | `/api/v1/reports/generate` | `{ "type": "TAX", "year": 2024 }` | `{ "jobId": "uuid" }` | Bearer | Async PDF gen |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.reporting.ready.v1` | reporting-service | notification-service | reportId, userId | BACKWARD | 7 Days |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-DAILY-VAR | `0 2 * * *` | risk-service | Compute VaR for all active portfolios | Alert RiskTeam | 2 retries |

### 10. AI Engines
*No AI Engines active for this release.*

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| AnalyticsDashboard | `/portfolio/analytics` | Charts for performance | Mandatory | All | New |
| ReportsScreen | `/reports` | Download statements | Mandatory | All | New |

### 12. Infrastructure Changes
- **Headless Chrome / ReportLab**: For PDF generation

### 13. Security Requirements
- **Signed URLs for PDF downloads**: Valid for 5 minutes only

### 14. Testing Strategy
- **Unit: VaR mathematical correctness**: Compare with known dataset
- **Load: PDF generation queue under load**: 

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] VaR computed accurately for 1000 test portfolios
- [ ] GA Launch criteria met

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R5.0 Enterprise: Crypto markets + AI Learning + Backtesting internal
### 1. Release Header
**Vision:** Deliver Enterprise: Crypto markets + AI Learning + Backtesting internal within Months 13-18.

**Business Goals:**
- Integrate Crypto feeds (Binance/Kraken) with 8 decimal precision.
- Deploy GPU nodes (NVIDIA A100) and vLLM for advanced AI.
- Implement internal backtesting engine (Rule 40: available_from_ts).
- Implement On-chain metrics integration (Glassnode).
- Add AI self-learning/calibration loops.
- Mandatory CBE disclaimers for Crypto.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex, Crypto**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| CryptoGateway | Market Data | Crypto exchange WebSockets | New | SecurityMaster |
| OnChainMetrics | Analytics | Blockchain data ingestion | New | CryptoGateway |
| Backtesting | AI | Historical strategy validation | New | Timeseries |
| AILearning | AI | Model weight calibration | New | AIConsensus |

### 4. Implementation-Ordered Modules
**1. Crypto WebSocket Clients**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** M
- **Acceptance Criteria:** 24/7 ingestion
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. GPU Infrastructure**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** L
- **Acceptance Criteria:** vLLM deployment for Llama3-70B
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. backtest-engine**
- **Priority:** P0
- **Dependencies:** timeseries-service
- **Complexity:** XL
- **Acceptance Criteria:** Vectorized backtesting avoiding look-ahead bias
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. onchain-service**
- **Priority:** P1
- **Dependencies:** CryptoGateway
- **Complexity:** M
- **Acceptance Criteria:** Glassnode API client
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. ai-calibration-service**
- **Priority:** P0
- **Dependencies:** consensus-service
- **Complexity:** L
- **Acceptance Criteria:** Compare predictions vs reality
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| backtest-engine | FastAPI/Python | New | Backtesting | POST /backtest/run | backtest.completed.v1 | None | backtests |
| onchain-service | FastAPI/Python | New | OnChainMetrics | GET /onchain/:asset | None | None | onchain |
| ai-calibration-service | FastAPI/Python | New | AILearning | POST /calibrate | calibration.applied.v1 | None | ai_weights |

### 6. Database Changes
```sql
CREATE SCHEMA backtests; -- Backtest results and params
CREATE TABLE backtests.runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA ai_weights; -- Historical school weights
CREATE TABLE ai_weights.weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/backtest/run` | `{ "strategy": "MACD_CROSS", "asset": "BTC" }` | `{ "cagr": 0.15, "maxDrawdown": -0.2 }` | Admin | Internal use only |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.crypto.tick.v1` | market-data-service | pricing, timeseries | symbol, bid, ask, ts | FORWARD | 24 Hours |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-CRYPTO-OHLCV | `* * * * *` | timeseries-service | Build Crypto bars (24/7) | Alert DevOps | No retry |
| JOB-GROUND-TRUTH-COLLECT | `0 9 * * *` | ai-calibration-service | Record actual outcomes | Log Error | 3 retries |
| JOB-SCHOOL-CALIBRATE | `0 0 * * 0` | ai-calibration-service | Weekly weight update | Alert DataSci | None |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| CryptoMarketScreen | `/crypto` | Coin list, 24h change | Mandatory | Crypto | New |
| CryptoCurrencyDetailScreen | `/crypto/:id` | Orderbook, chart, on-chain | Mandatory | Crypto | New |

### 12. Infrastructure Changes
- **NVIDIA A100 Nodes**: GPU compute
- **vLLM**: High throughput LLM serving

### 13. Security Requirements
- **Isolate backtesting DB access**: Prevent impact on prod timeseries

### 14. Testing Strategy
- **Integration: Backtesting Rule 40 check**: Assert available_from_ts is respected
- **Market: 24/7 continuity test**: Simulate crypto weekend load

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Backtester matches manual calculation within 0.01%
- [ ] Crypto feed handles 50k ticks/sec

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R6.0 Scale: US Stocks + 17 schools + Broker integration
### 1. Release Header
**Vision:** Deliver Scale: US Stocks + 17 schools + Broker integration within Months 19-30.

**Business Goals:**
- Integrate US market data (NYSE/NASDAQ) with 2 decimal precision.
- Implement DST handling for US market hours.
- Expand AI to 17 schools (adding Options flow, Dark pool data).
- Integrate execution broker (Interactive Brokers / Alpaca).
- Deploy multi-region Kafka (MirrorMaker 2).
- Mandatory SEC disclaimers.

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **EGX, Forex, Crypto, US Stocks**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| USGateway | Market Data | SIP feeds ingestion | New | SecurityMaster |
| OrderRouting | Trading | Route orders to external brokers | New | Portfolio |
| CorporateActions | Market Data | Splits, dividends | New | Timeseries |

### 4. Implementation-Ordered Modules
**1. US Market WebSocket**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** High throughput OPRA/SIP feeds
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. DST Management**
- **Priority:** P0
- **Dependencies:** market-calendar-service
- **Complexity:** S
- **Acceptance Criteria:** Handle ET/EET conversions
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. broker-integration-service**
- **Priority:** P0
- **Dependencies:** OrderRouting
- **Complexity:** XL
- **Acceptance Criteria:** FIX protocol or REST API to brokers
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. corporate-actions-service**
- **Priority:** P1
- **Dependencies:** CorporateActions
- **Complexity:** M
- **Acceptance Criteria:** Adjust historical data for splits
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**5. Kafka MirrorMaker 2**
- **Priority:** P0
- **Dependencies:** Kafka
- **Complexity:** L
- **Acceptance Criteria:** Sync topics between Cairo and Riyadh
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| broker-integration-service | NestJS/TS | New | OrderRouting | POST /orders/route | order.routed.v1 | order.created.v1 | routing |
| corporate-actions-service | FastAPI/Python | New | CorporateActions | GET /actions/:symbol | action.applied.v1 | None | corp_actions |

### 6. Database Changes
```sql
CREATE SCHEMA routing; -- Order routing states
CREATE TABLE routing.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
```sql
CREATE SCHEMA corp_actions; -- Dividends and splits
CREATE TABLE corp_actions.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/orders/route` | `{ "orderId": "uuid" }` | `{ "status": "ACCEPTED" }` | Internal | Routes validated order |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.us.tick.v1` | market-data-service | pricing, timeseries | symbol, bid, ask, ts | FORWARD | 24 Hours |
| `tradeora.trading.order.routed.v1` | broker-integration-service | portfolio | orderId, brokerId, status | BACKWARD | Infinite |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-US-OHLCV | `* 9-16 * * 1-5` | timeseries-service | Build US bars (ET) | Skip | No retry |
| JOB-EARNINGS-SYNC | `0 6 * * *` | market-calendar-service | Fetch US earnings dates | Log | 3 retries |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| USMarketScreen | `/us` | S&P500, top movers | Mandatory | US Stocks | New |
| OptionsFlowScreen | `/us/options` | Unusual options activity | Mandatory | US Stocks | New |

### 12. Infrastructure Changes
- **Kafka MirrorMaker 2**: Cross-region replication
- **Dedicated US Leased Line**: Low latency market data

### 13. Security Requirements
- **FIX Protocol TLS/VPN**: Secure broker connection

### 14. Testing Strategy
- **Unit: Split adjustment logic**: Ensure historical prices adjust correctly
- **Integration: Order routing state machine**: Verify ACK/NACK handling

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Order round-trip time to US broker < 500ms
- [ ] US market data ingested without lag during market open

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

## R7.0 Global: GCC + Global + Autonomous agents
### 1. Release Header
**Vision:** Deliver Global: GCC + Global + Autonomous agents within Months 31-48.

**Business Goals:**
- Expand to GCC markets (Tadawul, DFM).
- Deploy third active region (Dubai) for Active-Active-Active.
- Launch Global CDN for edge caching.
- Introduce autonomous trading agents (Opt-in, strict limits).
- Full multi-lingual support (Arabic, English, French).

**Success Metrics:**
| Metric | Target |
|---|---|
| Delivery Timeline | On Schedule |
| Critical Bugs | 0 in Prod |
| Uptime | 99.99% |

### 2. Markets & Instruments
Active Markets: **Global (GCC, EU, Asia)**

- Pricing uses Decimal exclusively.
- No Python floats permitted.

### 3. Bounded Contexts
| BC Name | Domain | Responsibility | New/Existing | Key Dependencies |
|---------|--------|----------------|--------------|------------------|
| AutonomousTrading | AI | Algorithmic execution logic | New | OrderRouting, AIEngine |
| GlobalRouting | Infra | Geo-DNS and CDN | New | None |

### 4. Implementation-Ordered Modules
**1. GCC Market Connectors**
- **Priority:** P0
- **Dependencies:** market-data-service
- **Complexity:** L
- **Acceptance Criteria:** Tadawul FIX feeds
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**2. Dubai Region Standup**
- **Priority:** P0
- **Dependencies:** K8s
- **Complexity:** XL
- **Acceptance Criteria:** Full cluster clone in UAE
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**3. autonomous-agent-service**
- **Priority:** P0
- **Dependencies:** AutonomousTrading
- **Complexity:** XL
- **Acceptance Criteria:** Execution logic with strict circuit breakers
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

**4. Global CDN Setup**
- **Priority:** P0
- **Dependencies:** GlobalRouting
- **Complexity:** M
- **Acceptance Criteria:** Cloudflare/Akamai config
- **Definition of Done:** Passes 12-criterion DoD checklist including WORM audit verification and security scans.

### 5. Backend Services Table
| Service Name | Language/Framework | New/Existing | BCs Served | Key Endpoints | Topics Produced | Topics Consumed | DB Schemas |
|--------------|--------------------|--------------|------------|---------------|-----------------|-----------------|------------|
| autonomous-agent-service | FastAPI/Python | New | AutonomousTrading | POST /agent/start<br>POST /agent/stop | agent.action.v1 | market.tick.v1 | agents |

### 6. Database Changes
```sql
CREATE SCHEMA agents; -- Agent configs and execution logs
CREATE TABLE agents.configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. API Contracts
| Method | Path | Request Body | Response | Auth | Notes |
|--------|------|--------------|----------|------|-------|
| POST | `/api/v1/agent/start` | `{ "strategyId": "uuid", "maxExposure": 10000 }` | `{ "agentId": "uuid" }` | Bearer | Start trading agent |

### 8. Kafka Events
| Topic Name | Producer | Consumers | Key Schema Fields | Compatibility | Retention |
|------------|----------|-----------|-------------------|---------------|-----------|
| `tradeora.trading.agent.action.v1` | autonomous-agent-service | broker-integration-service | agentId, action, qty, price | BACKWARD | 1 Year |

### 9. Background Workers / Cron Jobs
| Job ID | Schedule | Service | Description | Failure Mode | Retry |
|--------|----------|---------|-------------|--------------|-------|
| JOB-AGENT-HEALTH | `* * * * *` | autonomous-agent-service | Verify agent limits not breached | Kill Agent | None |

### 10. AI Engines
| Engine ID | School Name | Input Sources | Model Backend | Latency SLA | Cache TTL | Valkey Key Pattern | Failure Mode |
|-----------|-------------|---------------|---------------|-------------|-----------|--------------------|--------------|
| ENGINE-01 | Technical   | OHLCV, TA     | Llama3-70B    | < 2000ms    | 15m       | `ai:tech:{sym}`    | Degrade gracefully |
| ENGINE-05 | Macro       | CBE, Fed      | Llama3-70B    | < 2000ms    | 1h        | `ai:macro:{sym}`   | Degrade gracefully |

### 11. Flutter Screens
| Screen Name | Route | Key Features | Arabic Requirement | Market | New/Updated |
|-------------|-------|--------------|--------------------|--------|-------------|
| GCCMarketScreen | `/gcc` | Tadawul, DFM data | Mandatory | GCC | New |
| AutonomousDashboard | `/agents` | Manage trading bots | Mandatory | Global | New |

### 12. Infrastructure Changes
- **Dubai Data Center**: Third region
- **Global CDN**: Edge caching for static assets

### 13. Security Requirements
- **Strict Autonomous Circuit Breakers**: Hard stop at 5% daily loss per agent
- **Geo-fencing compliance**: Data residency for Saudi users

### 14. Testing Strategy
- **Load: Cross-region DB replication latency**: Ensure < 50ms
- **Security: Agent sandbox escape test**: Ensure agents cannot access unauthorized funds

### 15. Deployment Strategy
- **Blue-Green Deploy**: Active via FluxCD, ensuring zero downtime.
- **FluxCD Window**: No deployments during EGX session 08:45-15:20 Cairo.
- **Rollback**: Automatic rollback on Helm release failure.

### 16. Monitoring / SLOs
- **SLO API**: P99 <= 500ms
- **Alert WORMAuditFailed**: CRITICAL immediate page

### 17. Exit Criteria
- [ ] Active-Active-Active failover tested successfully
- [ ] Autonomous agents pass 3-month paper trading audit

### 18. Risk Level & Mitigations
- **Risk**: Data loss during migration. **Mitigation**: Multi-AZ backups and WORM.
- **Risk**: Downtime during market hours. **Mitigation**: Strict deployment windows enforced by CD tools.
---

