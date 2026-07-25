# Tradeora Financial Operating System
## SPRINT EXECUTION PLAN
## Version 1.0.0 | Status: AUTHORITATIVE | Date: 2026-07-24

╔══════════════════════════════════════════════════════════════════════════════╗
║  SPRINT EXECUTION PLAN                                                       ║
║  Sprint Duration: 2 weeks per sprint                                        ║
║  Market Order: EGX+Forex → Crypto → US Stocks → GCC+Global                 ║
║  Baseline: Architecture FREEZE v1.2 FINAL                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

## PREFACE
This document defines the 60-sprint execution plan across 7 major releases of the Tradeora Financial Operating System.
- **Sprint Duration:** 2 weeks per sprint.
- **Total Sprints:** 60 sprints (~120 weeks) across 7 releases.
- **Sprint Naming Convention:** `S-R{release_number}.{sprint_number}`.
- **Goal Alignment:** Each sprint goal rolls up to the specific Release Goal (R1.0 Alpha, R2.0 Beta, etc.).
- **Definition of Done (DoD):**
  - All Karapace schemas registered and validated.
  - No floating point arithmetic in any financial code (Python Decimal mandatory).
  - FRA mandatory Arabic disclaimer present on all AI-generated outputs.
  - MinIO WORM COMPLIANCE mode enabled for all audit/financial records.
  - Flutter UI strictly Arabic-first, RTL layout.
  - Integration tests using Testcontainers passing in CI pipeline.
  - FluxCD GitOps sync completed. No EGX session deployments (08:45-15:20 Cairo).

---


## SPRINT S-R1.1 — Infrastructure bootstrap & K8s foundation

| Attribute | Value |
|-----------|-------|
| Release | R1.0 (Alpha) |
| Sprint Number | 1 of 6 |
| Duration | Weeks 1–2 |
| Sprint Goal | Infrastructure bootstrap & K8s foundation |
| Markets in Scope | EGX |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] K8s cluster setup
- [5pts] PostgreSQL Patroni
- [5pts] Kafka KRaft
- [5pts] MinIO WORM
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `infrastructure` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.infra.status.v1` in Karapace.
- Database: Migration V100_infrastructure.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB1`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Infra load test
- BDD: `Feature: Infrastructure bootstrap & K8s foundation Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `infrastructure` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r1-s1` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R1.2 — Identity Service & Keycloak Integration

| Attribute | Value |
|-----------|-------|
| Release | R1.0 (Alpha) |
| Sprint Number | 2 of 6 |
| Duration | Weeks 3–4 |
| Sprint Goal | Identity Service & Keycloak Integration |
| Markets in Scope | EGX |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] identity-service (NestJS)
- [5pts] Keycloak OIDC/JWT flows
- [5pts] user registration API
- [5pts] Valkey session cache
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `identity-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.identity.user.registered.v1` in Karapace.
- Database: Migration V101_identity_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `RegistrationScreen (RTL)` (/route/registrationscreen (rtl)): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB1`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Keycloak OIDC Testcontainers
- BDD: `Feature: Identity Service & Keycloak Integration Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `identity-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r1-s2` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R1.3 — KYC & AML Sumsub Integration via Kafka

| Attribute | Value |
|-----------|-------|
| Release | R1.0 (Alpha) |
| Sprint Number | 3 of 6 |
| Duration | Weeks 5–6 |
| Sprint Goal | KYC & AML Sumsub Integration via Kafka |
| Markets in Scope | EGX |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] kyc-service
- [5pts] Sumsub KYC integration
- [5pts] Egyptian National ID OCR
- [5pts] liveness check
- [5pts] AML screening
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `kyc-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.kyc.verification.initiated.v1` in Karapace.
- Database: Migration V102_kyc_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `KYCScreen` (/route/kycscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB1`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): SAGA-001 Choreography BDD
- BDD: `Feature: KYC & AML Sumsub Integration via Kafka Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `kyc-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r1-s3` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R1.4 — Portfolio Service & Security Master Data

| Attribute | Value |
|-----------|-------|
| Release | R1.0 (Alpha) |
| Sprint Number | 4 of 6 |
| Duration | Weeks 7–8 |
| Sprint Goal | Portfolio Service & Security Master Data |
| Markets in Scope | EGX |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] portfolio-service
- [5pts] Position schema
- [5pts] Transaction recording
- [5pts] multi-currency FX conversion (EGP/USD/EUR in Decimal)
- [5pts] security-master bootstrap (EGX 300)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `portfolio-service, security-master` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.portfolio.position.updated.v1` in Karapace.
- Database: Migration V103_portfolio_service, security_master.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `PortfolioScreen` (/route/portfolioscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB1`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Decimal conversion precision test
- BDD: `Feature: Portfolio Service & Security Master Data Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `portfolio-service, security-master` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r1-s4` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R1.5 — Subscription Billing & Entitlement

| Attribute | Value |
|-----------|-------|
| Release | R1.0 (Alpha) |
| Sprint Number | 5 of 6 |
| Duration | Weeks 9–10 |
| Sprint Goal | Subscription Billing & Entitlement |
| Markets in Scope | EGX |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] subscription-service
- [5pts] billing integration
- [5pts] entitlement enforcement
- [5pts] PDPL consent recording
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `subscription-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.subscription.created.v1` in Karapace.
- Database: Migration V104_subscription_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `SubscriptionScreen` (/route/subscriptionscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB1`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): SAGA-002, SAGA-006 validation
- BDD: `Feature: Subscription Billing & Entitlement Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `subscription-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r1-s5` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R1.6 — Market Calendar & Alpha Launch Compliance

| Attribute | Value |
|-----------|-------|
| Release | R1.0 (Alpha) |
| Sprint Number | 6 of 6 |
| Duration | Weeks 11–12 |
| Sprint Goal | Market Calendar & Alpha Launch Compliance |
| Markets in Scope | EGX |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] market-calendar-service
- [5pts] EGX session status (PRE_OPEN/OPEN/CLOSED/HALTED)
- [5pts] circuit breaker events
- [5pts] Alpha launch (100 users)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `market-calendar-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.market.session.changed.v1` in Karapace.
- Database: Migration V105_market_calendar_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `MarketStatusWidget` (/route/marketstatuswidget): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB1`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): SAGA-004 (PDPL erasure)
- BDD: `Feature: Market Calendar & Alpha Launch Compliance Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `market-calendar-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r1-s6` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R2.1 — Forex Market Data Integration

| Attribute | Value |
|-----------|-------|
| Release | R2.0 (Beta) |
| Sprint Number | 1 of 6 |
| Duration | Weeks 13–14 |
| Sprint Goal | Forex Market Data Integration |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Forex data provider (OANDA/FXCM)
- [5pts] WebSocket client (24/5)
- [5pts] pip precision (5dp majors, 3dp JPY, 4dp EGP)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `market-data-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.market.forex.tick.v1` in Karapace.
- Database: Migration V106_market_data_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `ForexWatchlist` (/route/forexwatchlist): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB2`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): WebSocket reconnect resilience
- BDD: `Feature: Forex Market Data Integration Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `market-data-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r2-s1` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R2.2 — EGX Real-time Tick Ingestion

| Attribute | Value |
|-----------|-------|
| Release | R2.0 (Beta) |
| Sprint Number | 2 of 6 |
| Duration | Weeks 15–16 |
| Sprint Goal | EGX Real-time Tick Ingestion |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] EGX real-time tick ingestion
- [5pts] TimescaleDB price_ticks hypertable
- [5pts] OHLCV bar computation
- [5pts] EGX session gate enforcement
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `market-data-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.market.egx.tick.v1` in Karapace.
- Database: Migration V107_market_data_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `EGXTicker` (/route/egxticker): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB2`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Circuit breaker tracking (5%/10% halt)
- BDD: `Feature: EGX Real-time Tick Ingestion Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `market-data-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r2-s2` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R2.3 — Technical Indicators Service

| Attribute | Value |
|-----------|-------|
| Release | R2.0 (Beta) |
| Sprint Number | 3 of 6 |
| Duration | Weeks 17–18 |
| Sprint Goal | Technical Indicators Service |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Technical indicator computation (RSI, MACD, Bollinger, ADX, Ichimoku) for EGX
- [5pts] adapted for Forex 24/5 (no session gaps)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `technical-indicators-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.analytics.indicator.computed.v1` in Karapace.
- Database: Migration V108_technical_indicators_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `ChartIndicators` (/route/chartindicators): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB2`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Float absence verification in RSI calc
- BDD: `Feature: Technical Indicators Service Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `technical-indicators-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r2-s3` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R2.4 — Fundamental Analysis & News Service

| Attribute | Value |
|-----------|-------|
| Release | R2.0 (Beta) |
| Sprint Number | 4 of 6 |
| Duration | Weeks 19–20 |
| Sprint Goal | Fundamental Analysis & News Service |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] fundamentals service
- [5pts] EGX financial statements PDF parser (Arabic)
- [5pts] DCF modeling
- [5pts] news ingestion
- [5pts] Qdrant vector population
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `fundamentals-service, news-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.data.news.ingested.v1` in Karapace.
- Database: Migration V109_fundamentals_service, news_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `NewsFeedScreen` (/route/newsfeedscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB2`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Arabic PDF parsing test
- BDD: `Feature: Fundamental Analysis & News Service Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `fundamentals-service, news-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r2-s4` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R2.5 — Alerts & Screening Engine

| Attribute | Value |
|-----------|-------|
| Release | R2.0 (Beta) |
| Sprint Number | 5 of 6 |
| Duration | Weeks 21–22 |
| Sprint Goal | Alerts & Screening Engine |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] alert-service (price/volatility EGX+Forex)
- [5pts] screening-engine (multi-variable)
- [5pts] universal search (Qdrant)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `alert-service, screening-engine` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.alert.triggered.v1` in Karapace.
- Database: Migration V110_alert_service, screening_engine.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `ForexMarketScreen, EGXMarketScreen` (/route/forexmarketscreen, egxmarketscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB2`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Alert dispatch latency < 500ms
- BDD: `Feature: Alerts & Screening Engine Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `alert-service, screening-engine` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r2-s5` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R2.6 — Portfolio NAV & Beta Launch Prep

| Attribute | Value |
|-----------|-------|
| Release | R2.0 (Beta) |
| Sprint Number | 6 of 6 |
| Duration | Weeks 23–24 |
| Sprint Goal | Portfolio NAV & Beta Launch Prep |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Portfolio NAV calculation with live prices (Decimal)
- [5pts] TWR calculation
- [5pts] benchmark comparison
- [5pts] sector heatmap
- [5pts] Beta launch (5k users)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `portfolio-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.portfolio.nav.calculated.v1` in Karapace.
- Database: Migration V111_portfolio_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `PortfolioPerformanceScreen` (/route/portfolioperformancescreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB2`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): TWR Decimal accuracy test
- BDD: `Feature: Portfolio NAV & Beta Launch Prep Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `portfolio-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r2-s6` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R3.1 — Ollama LLM Gateway Deployment

| Attribute | Value |
|-----------|-------|
| Release | R3.0 (Beta) |
| Sprint Number | 1 of 6 |
| Duration | Weeks 25–26 |
| Sprint Goal | Ollama LLM Gateway Deployment |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Ollama deployment (Qwen2.5:14b-q4 + 7b-q4 CPU)
- [5pts] LiteLLM proxy
- [5pts] JOB-WARMUP-001 cron
- [5pts] Valkey AI cache
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `llm-gateway` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.request.v1` in Karapace.
- Database: Migration V112_llm_gateway.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `AIChatWidget` (/route/aichatwidget): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB3`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): LLM Gateway health check
- BDD: `Feature: Ollama LLM Gateway Deployment Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `llm-gateway` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r3-s1` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R3.2 — AI Core Schools (1-4)

| Attribute | Value |
|-----------|-------|
| Release | R3.0 (Beta) |
| Sprint Number | 2 of 6 |
| Duration | Weeks 27–28 |
| Sprint Goal | AI Core Schools (1-4) |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] SCHOOL-01 Market Intelligence
- [5pts] SCHOOL-02 Fundamental Analysis
- [5pts] SCHOOL-03 Technical
- [5pts] SCHOOL-04 Sentiment (Arabic BERT)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `ai-schools-1-4` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.school.v1` in Karapace.
- Database: Migration V113_ai_schools_1_4.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `SchoolInsightsScreen` (/route/schoolinsightsscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB3`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Arabic sentiment polarity test
- BDD: `Feature: AI Core Schools (1-4) Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `ai-schools-1-4` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r3-s2` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R3.3 — AI Core Schools (5-8)

| Attribute | Value |
|-----------|-------|
| Release | R3.0 (Beta) |
| Sprint Number | 3 of 6 |
| Duration | Weeks 29–30 |
| Sprint Goal | AI Core Schools (5-8) |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] SCHOOL-05 Macroeconomic
- [5pts] SCHOOL-06 Quantitative
- [5pts] SCHOOL-07 Risk-Adjusted Return
- [5pts] SCHOOL-08 Behavioral Finance
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `ai-schools-5-8` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.school.v1` in Karapace.
- Database: Migration V114_ai_schools_5_8.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `MacroInsightsScreen` (/route/macroinsightsscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB3`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Sharpe ratio Decimal calculation test
- BDD: `Feature: AI Core Schools (5-8) Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `ai-schools-5-8` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r3-s3` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R3.4 — AI Core Schools (9-12)

| Attribute | Value |
|-----------|-------|
| Release | R3.0 (Beta) |
| Sprint Number | 4 of 6 |
| Duration | Weeks 31–32 |
| Sprint Goal | AI Core Schools (9-12) |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] SCHOOL-09 Sector Rotation
- [5pts] SCHOOL-10 Peer Comparison
- [5pts] SCHOOL-11 Earnings Quality
- [5pts] SCHOOL-12 Pattern Recognition
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `ai-schools-9-12` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.school.v1` in Karapace.
- Database: Migration V115_ai_schools_9_12.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `PatternRecognitionScreen` (/route/patternrecognitionscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB3`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Qdrant vector similarity Testcontainers
- BDD: `Feature: AI Core Schools (9-12) Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `ai-schools-9-12` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r3-s4` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R3.5 — AI Consensus Orchestrator Engine

| Attribute | Value |
|-----------|-------|
| Release | R3.0 (Beta) |
| Sprint Number | 5 of 6 |
| Duration | Weeks 33–34 |
| Sprint Goal | AI Consensus Orchestrator Engine |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Consensus Orchestrator (asyncio parallel dispatch)
- [5pts] WisdomEngine base weights
- [5pts] AI Safety Engine (7-check gate)
- [5pts] FRA embargo check
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `consensus-orchestrator` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.consensus.v1` in Karapace.
- Database: Migration V116_consensus_orchestrator.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `ConsensusDashboard` (/route/consensusdashboard): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB3`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): SAGA-003 WORM audit (30s timeout)
- BDD: `Feature: AI Consensus Orchestrator Engine Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `consensus-orchestrator` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r3-s5` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R3.6 — Explainability & Beta Gate 2

| Attribute | Value |
|-----------|-------|
| Release | R3.0 (Beta) |
| Sprint Number | 6 of 6 |
| Duration | Weeks 35–36 |
| Sprint Goal | Explainability & Beta Gate 2 |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Explainability Engine (Arabic 50-500 words)
- [5pts] FRA disclaimer enforcement
- [5pts] Daily Market Brief
- [5pts] Beta Gate 2 (15k users)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `explainability-engine` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.explanation.v1` in Karapace.
- Database: Migration V117_explainability_engine.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `AIRecommendationScreen` (/route/airecommendationscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB3`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): FRA disclaimer presence verification
- BDD: `Feature: Explainability & Beta Gate 2 Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `explainability-engine` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r3-s6` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R4.1 — Risk Profiling & Suitability

| Attribute | Value |
|-----------|-------|
| Release | R4.0 (GA) |
| Sprint Number | 1 of 6 |
| Duration | Weeks 37–38 |
| Sprint Goal | Risk Profiling & Suitability |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] risk-profiling-service (FRA questionnaire)
- [5pts] Python Decimal implementation for risk scores
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `risk-profiling-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.risk.profile.v1` in Karapace.
- Database: Migration V118_risk_profiling_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `RiskProfileScreen` (/route/riskprofilescreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB4`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): FRA suitability test
- BDD: `Feature: Risk Profiling & Suitability Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `risk-profiling-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r4-s1` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R4.2 — Risk Analytics & VaR Engine

| Attribute | Value |
|-----------|-------|
| Release | R4.0 (GA) |
| Sprint Number | 2 of 6 |
| Duration | Weeks 39–40 |
| Sprint Goal | Risk Analytics & VaR Engine |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] risk-analytics-service (VaR 95%/99% historical+parametric, Decimal)
- [5pts] sector concentration stress-testing
- [5pts] Forex VaR pip-normalized
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `risk-analytics-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.risk.var.v1` in Karapace.
- Database: Migration V119_risk_analytics_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `RiskMetricsScreen` (/route/riskmetricsscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB4`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): VaR calculation Testcontainers
- BDD: `Feature: Risk Analytics & VaR Engine Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `risk-analytics-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r4-s2` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R4.3 — Drawdown & Stress Testing Engine

| Attribute | Value |
|-----------|-------|
| Release | R4.0 (GA) |
| Sprint Number | 3 of 6 |
| Duration | Weeks 41–42 |
| Sprint Goal | Drawdown & Stress Testing Engine |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] drawdown stress-testing (EGX crash scenarios, Forex USD/EGP spikes)
- [5pts] risk breach alert dispatch
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `risk-analytics-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.risk.breach.v1` in Karapace.
- Database: Migration V120_risk_analytics_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `StressTestScreen` (/route/stresstestscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB4`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Drawdown scenario testing
- BDD: `Feature: Drawdown & Stress Testing Engine Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `risk-analytics-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r4-s3` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R4.4 — AI Portfolio Rebalancing (SAGA-005)

| Attribute | Value |
|-----------|-------|
| Release | R4.0 (GA) |
| Sprint Number | 4 of 6 |
| Duration | Weeks 43–44 |
| Sprint Goal | AI Portfolio Rebalancing (SAGA-005) |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] SAGA-005 portfolio rebalancing (AI suggest -> user confirm -> WORM audit)
- [5pts] position-sizing-service
- [5pts] reporting-service (PDF+Excel)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `position-sizing-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.portfolio.rebalance.v1` in Karapace.
- Database: Migration V121_position_sizing_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `RebalanceScreen` (/route/rebalancescreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB4`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): SAGA-005 end-to-end BDD
- BDD: `Feature: AI Portfolio Rebalancing (SAGA-005) Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `position-sizing-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r4-s4` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R4.5 — Reporting & Compliance Export

| Attribute | Value |
|-----------|-------|
| Release | R4.0 (GA) |
| Sprint Number | 5 of 6 |
| Duration | Weeks 45–46 |
| Sprint Goal | Reporting & Compliance Export |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Portfolio statements (PDF/Excel bilingual)
- [5pts] equity research export
- [5pts] PDPL data export (SLICE-12)
- [5pts] audit trail reporting
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `reporting-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.report.generated.v1` in Karapace.
- Database: Migration V122_reporting_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `ReportsScreen` (/route/reportsscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB4`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): WeasyPrint Arabic rendering test
- BDD: `Feature: Reporting & Compliance Export Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `reporting-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r4-s5` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R4.6 — B2B API & GA Launch

| Attribute | Value |
|-----------|-------|
| Release | R4.0 (GA) |
| Sprint Number | 6 of 6 |
| Duration | Weeks 47–48 |
| Sprint Goal | B2B API & GA Launch |
| Markets in Scope | EGX+Forex |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] B2B API program launch (Kong route)
- [5pts] FRA readiness review
- [5pts] GA Launch (50k MAU)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `kong-gateway` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.b2b.api.v1` in Karapace.
- Database: Migration V123_kong_gateway.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `APIKeysScreen` (/route/apikeysscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB4`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Kong rate limiting k6 test
- BDD: `Feature: B2B API & GA Launch Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `kong-gateway` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r4-s6` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R5.1 — GPU Provisioning & vLLM

| Attribute | Value |
|-----------|-------|
| Release | R5.0 (Enterprise) |
| Sprint Number | 1 of 12 |
| Duration | Weeks 49–50 |
| Sprint Goal | GPU Provisioning & vLLM |
| Markets in Scope | EGX+Forex+Crypto |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] NVIDIA A100 GPU provisioning
- [5pts] vLLM deployment
- [5pts] GPU health monitoring
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `llm-gateway` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.gpu.v1` in Karapace.
- Database: Migration V124_llm_gateway.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB5`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): GPU health monitoring test
- BDD: `Feature: GPU Provisioning & vLLM Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `llm-gateway` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r5-s1` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R5.2 — Ground Truth Collector

| Attribute | Value |
|-----------|-------|
| Release | R5.0 (Enterprise) |
| Sprint Number | 2 of 12 |
| Duration | Weeks 51–52 |
| Sprint Goal | Ground Truth Collector |
| Markets in Scope | EGX+Forex+Crypto |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Ground Truth Collector (8 signal types: EGX 5d, Forex 1d, user feedback)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `ai-learning` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.groundtruth.v1` in Karapace.
- Database: Migration V125_ai_learning.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB5`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Ground truth DB ingestion
- BDD: `Feature: Ground Truth Collector Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `ai-learning` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r5-s2` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R5.3 — Learning & Self-Reflection Engine

| Attribute | Value |
|-----------|-------|
| Release | R5.0 (Enterprise) |
| Sprint Number | 3 of 12 |
| Duration | Weeks 53–54 |
| Sprint Goal | Learning & Self-Reflection Engine |
| Markets in Scope | EGX+Forex+Crypto |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Learning Engine (TRD-AI-023)
- [5pts] Self-Reflection Engine (TRD-AI-024)
- [5pts] Bias Detection (TRD-AI-025)
- [5pts] Decision Improvement
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `ai-learning` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.learning.v1` in Karapace.
- Database: Migration V126_ai_learning.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB5`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Learning rate EMA test
- BDD: `Feature: Learning & Self-Reflection Engine Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `ai-learning` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r5-s3` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R5.4 — Qdrant Learning Collections

| Attribute | Value |
|-----------|-------|
| Release | R5.0 (Enterprise) |
| Sprint Number | 4 of 12 |
| Duration | Weeks 55–56 |
| Sprint Goal | Qdrant Learning Collections |
| Markets in Scope | EGX+Forex+Crypto |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Qdrant learning collections (learning_core, learning_recent 90d, learning_antipatterns)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `qdrant` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.vectors.v1` in Karapace.
- Database: Migration V127_qdrant.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB5`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Vector retrieval latency
- BDD: `Feature: Qdrant Learning Collections Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `qdrant` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r5-s4` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R5.5 — Backtesting Engine

| Attribute | Value |
|-----------|-------|
| Release | R5.0 (Enterprise) |
| Sprint Number | 5 of 12 |
| Duration | Weeks 57–58 |
| Sprint Goal | Backtesting Engine |
| Markets in Scope | EGX+Forex+Crypto |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Backtesting Engine (Rule 40: available_from_ts filter)
- [5pts] internal only, NEVER user-facing
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `backtesting-engine` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.backtest.run.v1` in Karapace.
- Database: Migration V128_backtesting_engine.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB5`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Lookahead bias prevention BDD
- BDD: `Feature: Backtesting Engine Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `backtesting-engine` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r5-s5` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R5.6 — Monte Carlo Simulation

| Attribute | Value |
|-----------|-------|
| Release | R5.0 (Enterprise) |
| Sprint Number | 6 of 12 |
| Duration | Weeks 59–60 |
| Sprint Goal | Monte Carlo Simulation |
| Markets in Scope | EGX+Forex+Crypto |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Monte Carlo Simulation (internal)
- [5pts] EGX+Forex shock scenarios
- [5pts] FRA compliance metadata attached
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `simulation-engine` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.simulation.run.v1` in Karapace.
- Database: Migration V129_simulation_engine.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB5`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Monte Carlo Decimal precision
- BDD: `Feature: Monte Carlo Simulation Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `simulation-engine` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r5-s6` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R5.7 — Family Office Multi-tenancy

| Attribute | Value |
|-----------|-------|
| Release | R5.0 (Enterprise) |
| Sprint Number | 7 of 12 |
| Duration | Weeks 61–62 |
| Sprint Goal | Family Office Multi-tenancy |
| Markets in Scope | EGX+Forex+Crypto |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Family Office multi-tenancy (SAGA-007)
- [5pts] schema isolation
- [5pts] multi-user RBAC
- [5pts] B2B API expansion
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `identity-service, portfolio-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.tenant.created.v1` in Karapace.
- Database: Migration V130_identity_service, portfolio_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `FamilyOfficeDashboard` (/route/familyofficedashboard): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB5`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): SAGA-007 Multi-tenant isolation
- BDD: `Feature: Family Office Multi-tenancy Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `identity-service, portfolio-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r5-s7` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R5.8 — Crypto Binance WebSocket

| Attribute | Value |
|-----------|-------|
| Release | R5.0 (Enterprise) |
| Sprint Number | 8 of 12 |
| Duration | Weeks 63–64 |
| Sprint Goal | Crypto Binance WebSocket |
| Markets in Scope | EGX+Forex+Crypto |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] CRYPTO — Binance WebSocket client (24/7)
- [5pts] CoinGecko REST fallback
- [5pts] crypto_instruments schema
- [5pts] crypto_market_data TimescaleDB (8dp)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `market-data-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.crypto.tick.v1` in Karapace.
- Database: Migration V131_market_data_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB5`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): 8-decimal Decimal test
- BDD: `Feature: Crypto Binance WebSocket Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `market-data-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r5-s8` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R5.9 — Crypto Technical Analysis

| Attribute | Value |
|-----------|-------|
| Release | R5.0 (Enterprise) |
| Sprint Number | 9 of 12 |
| Duration | Weeks 65–66 |
| Sprint Goal | Crypto Technical Analysis |
| Markets in Scope | EGX+Forex+Crypto |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] CRYPTO — Technical analysis (24/7 adapted)
- [5pts] on-chain metrics (Glassnode)
- [5pts] Fear & Greed index
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `technical-indicators-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.crypto.indicator.v1` in Karapace.
- Database: Migration V132_technical_indicators_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB5`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): On-chain metrics ingestion
- BDD: `Feature: Crypto Technical Analysis Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `technical-indicators-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r5-s9` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R5.10 — Crypto AI School 13

| Attribute | Value |
|-----------|-------|
| Release | R5.0 (Enterprise) |
| Sprint Number | 10 of 12 |
| Duration | Weeks 67–68 |
| Sprint Goal | Crypto AI School 13 |
| Markets in Scope | EGX+Forex+Crypto |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] CRYPTO — SCHOOL-13 (On-Chain Analysis)
- [5pts] sentiment from Reddit/Twitter
- [5pts] CBE crypto advisory disclaimer enforcement
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `ai-school-13` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.school.v1` in Karapace.
- Database: Migration V133_ai_school_13.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB5`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): CBE disclaimer verification
- BDD: `Feature: Crypto AI School 13 Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `ai-school-13` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r5-s10` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R5.11 — Crypto Portfolio & UI

| Attribute | Value |
|-----------|-------|
| Release | R5.0 (Enterprise) |
| Sprint Number | 11 of 12 |
| Duration | Weeks 69–70 |
| Sprint Goal | Crypto Portfolio & UI |
| Markets in Scope | EGX+Forex+Crypto |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] CRYPTO — Portfolio (BTC/ETH 8dp)
- [5pts] EGP valuation via USD/EGP real-time rate
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `portfolio-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.portfolio.crypto.v1` in Karapace.
- Database: Migration V134_portfolio_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `CryptoMarketScreen, OnChainMetricsScreen` (/route/cryptomarketscreen, onchainmetricsscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB5`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Crypto EGP valuation test
- BDD: `Feature: Crypto Portfolio & UI Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `portfolio-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r5-s11` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R5.12 — Crypto GA & Active-Passive Multi-region

| Attribute | Value |
|-----------|-------|
| Release | R5.0 (Enterprise) |
| Sprint Number | 12 of 12 |
| Duration | Weeks 71–72 |
| Sprint Goal | Crypto GA & Active-Passive Multi-region |
| Markets in Scope | EGX+Forex+Crypto |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] CRYPTO GA
- [5pts] Riyadh passive standby region deployment
- [5pts] Kafka MirrorMaker 2 sync
- [5pts] first school calibration cycle
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `infra, ai-learning` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.system.failover.v1` in Karapace.
- Database: Migration V135_infra, ai_learning.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB5`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): MirrorMaker 2 replication lag test
- BDD: `Feature: Crypto GA & Active-Passive Multi-region Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `infra, ai-learning` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r5-s12` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R6.1 — US Market Data Vendor Contract

| Attribute | Value |
|-----------|-------|
| Release | R6.0 (Scale) |
| Sprint Number | 1 of 12 |
| Duration | Weeks 73–74 |
| Sprint Goal | US Market Data Vendor Contract |
| Markets in Scope | EGX+Forex+Crypto+US |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] US market data vendor contract signed (IEX Cloud/Polygon)
- [5pts] us_instruments schema
- [5pts] NYSE+NASDAQ security master
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `security-master` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.us.instrument.v1` in Karapace.
- Database: Migration V136_security_master.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB6`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Security master US load test
- BDD: `Feature: US Market Data Vendor Contract Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `security-master` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r6-s1` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R6.2 — US Market Data Service

| Attribute | Value |
|-----------|-------|
| Release | R6.0 (Scale) |
| Sprint Number | 2 of 12 |
| Duration | Weeks 75–76 |
| Sprint Goal | US Market Data Service |
| Markets in Scope | EGX+Forex+Crypto+US |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] US market data service (EST timezone handling, DST)
- [5pts] us_market_data TimescaleDB hypertable (USD 2dp Decimal)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `market-data-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.us.tick.v1` in Karapace.
- Database: Migration V137_market_data_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB6`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): DST spring-forward time series test
- BDD: `Feature: US Market Data Service Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `market-data-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r6-s2` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R6.3 — SEC Compliance Framework

| Attribute | Value |
|-----------|-------|
| Release | R6.0 (Scale) |
| Sprint Number | 3 of 12 |
| Duration | Weeks 77–78 |
| Sprint Goal | SEC Compliance Framework |
| Markets in Scope | EGX+Forex+Crypto+US |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] SEC compliance framework (advisory-only disclaimer)
- [5pts] SEC registration process documentation
- [5pts] US geolocation gating rules
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `compliance-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.compliance.sec.v1` in Karapace.
- Database: Migration V138_compliance_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `USDisclaimerWidget` (/route/usdisclaimerwidget): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB6`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): US Geo-blocking test
- BDD: `Feature: SEC Compliance Framework Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `compliance-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r6-s3` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R6.4 — AI Schools 14-16 (US & ESG)

| Attribute | Value |
|-----------|-------|
| Release | R6.0 (Scale) |
| Sprint Number | 4 of 12 |
| Duration | Weeks 79–80 |
| Sprint Goal | AI Schools 14-16 (US & ESG) |
| Markets in Scope | EGX+Forex+Crypto+US |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] SCHOOL-14 OptionsFlow
- [5pts] SCHOOL-15 InsiderActivity
- [5pts] SCHOOL-16 ESG/Sharia (ESG score + Sharia screen)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `ai-schools-14-16` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.school.v1` in Karapace.
- Database: Migration V139_ai_schools_14_16.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `ESGSchoolScreen` (/route/esgschoolscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB6`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Sharia screener integration test
- BDD: `Feature: AI Schools 14-16 (US & ESG) Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `ai-schools-14-16` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r6-s4` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R6.5 — AI Schools 17-18 (Macro & Alt)

| Attribute | Value |
|-----------|-------|
| Release | R6.0 (Scale) |
| Sprint Number | 5 of 12 |
| Duration | Weeks 81–82 |
| Sprint Goal | AI Schools 17-18 (Macro & Alt) |
| Markets in Scope | EGX+Forex+Crypto+US |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] SCHOOL-17 GlobalMacro
- [5pts] SCHOOL-18 AlternativeData (satellite imagery, web traffic)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `ai-schools-17-18` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.school.v1` in Karapace.
- Database: Migration V140_ai_schools_17_18.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `AltDataScreen` (/route/altdatascreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB6`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Alternative data parsing BDD
- BDD: `Feature: AI Schools 17-18 (Macro & Alt) Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `ai-schools-17-18` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r6-s5` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R6.6 — 17-School Consensus Recalibration

| Attribute | Value |
|-----------|-------|
| Release | R6.0 (Scale) |
| Sprint Number | 6 of 12 |
| Duration | Weeks 83–84 |
| Sprint Goal | 17-School Consensus Recalibration |
| Markets in Scope | EGX+Forex+Crypto+US |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] 17-school consensus recalibration
- [5pts] new quorum 13/17
- [5pts] WisdomEngine recalibrated
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `consensus-orchestrator` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.consensus.v2` in Karapace.
- Database: Migration V141_consensus_orchestrator.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `ConsensusDashboardV2` (/route/consensusdashboardv2): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB6`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): 13/17 Quorum logic verification
- BDD: `Feature: 17-School Consensus Recalibration Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `consensus-orchestrator` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r6-s6` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R6.7 — Broker Order Routing (SOR)

| Attribute | Value |
|-----------|-------|
| Release | R6.0 (Scale) |
| Sprint Number | 7 of 12 |
| Duration | Weeks 85–86 |
| Sprint Goal | Broker Order Routing (SOR) |
| Markets in Scope | EGX+Forex+Crypto+US |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] EXC-SOR-001 Broker Order Routing (3+ EGX broker APIs)
- [5pts] smart order routing
- [5pts] order_management schema
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `oms-bridge` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.oms.order.v1` in Karapace.
- Database: Migration V142_oms_bridge.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `OrderTicketScreen` (/route/orderticketscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB6`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): FIX protocol dummy broker test
- BDD: `Feature: Broker Order Routing (SOR) Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `oms-bridge` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r6-s7` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R6.8 — Tax-Aware Rebalancing

| Attribute | Value |
|-----------|-------|
| Release | R6.0 (Scale) |
| Sprint Number | 8 of 12 |
| Duration | Weeks 87–88 |
| Sprint Goal | Tax-Aware Rebalancing |
| Markets in Scope | EGX+Forex+Crypto+US |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] WLT-REB-001 tax-aware rebalancing (EGX capital gains tax, US tax-lot accounting)
- [5pts] wealth_management schema
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `wealth-management` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.wealth.tax.v1` in Karapace.
- Database: Migration V143_wealth_management.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `TaxReportsScreen` (/route/taxreportsscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB6`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): FIFO cost basis Decimal validation
- BDD: `Feature: Tax-Aware Rebalancing Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `wealth-management` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r6-s8` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R6.9 — Financial Advisor Copilot

| Attribute | Value |
|-----------|-------|
| Release | R6.0 (Scale) |
| Sprint Number | 9 of 12 |
| Duration | Weeks 89–90 |
| Sprint Goal | Financial Advisor Copilot |
| Markets in Scope | EGX+Forex+Crypto+US |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] ADV-COP-001 Financial Advisor Copilot (Arabic-first)
- [5pts] FRA suitability automation
- [5pts] client report drafting
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `advisor-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.advisor.copilot.v1` in Karapace.
- Database: Migration V144_advisor_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `AdvisorDashboard` (/route/advisordashboard): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB6`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Report generation PDF layout BDD
- BDD: `Feature: Financial Advisor Copilot Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `advisor-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r6-s9` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R6.10 — Paper Trading Launch

| Attribute | Value |
|-----------|-------|
| Release | R6.0 (Scale) |
| Sprint Number | 10 of 12 |
| Duration | Weeks 91–92 |
| Sprint Goal | Paper Trading Launch |
| Markets in Scope | EGX+Forex+Crypto+US |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Paper trading (FRA written approval REQUIRED)
- [5pts] paper_trading schema
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `paper-trading-engine` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.paper.order.v1` in Karapace.
- Database: Migration V145_paper_trading_engine.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `PaperPortfolioScreen` (/route/paperportfolioscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB6`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Virtual matching engine latency test
- BDD: `Feature: Paper Trading Launch Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `paper-trading-engine` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r6-s10` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R6.11 — Plugin Marketplace

| Attribute | Value |
|-----------|-------|
| Release | R6.0 (Scale) |
| Sprint Number | 11 of 12 |
| Duration | Weeks 93–94 |
| Sprint Goal | Plugin Marketplace |
| Markets in Scope | EGX+Forex+Crypto+US |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Plugin Marketplace (registration API, sandbox execution)
- [5pts] first 10 certified providers
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `marketplace-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.plugin.installed.v1` in Karapace.
- Database: Migration V146_marketplace_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `PluginStoreScreen, USMarketScreen` (/route/pluginstorescreen, usmarketscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB6`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Sandbox execution security test
- BDD: `Feature: Plugin Marketplace Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `marketplace-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r6-s11` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R6.12 — Multi-Region Failover & Scale GA

| Attribute | Value |
|-----------|-------|
| Release | R6.0 (Scale) |
| Sprint Number | 12 of 12 |
| Duration | Weeks 95–96 |
| Sprint Goal | Multi-Region Failover & Scale GA |
| Markets in Scope | EGX+Forex+Crypto+US |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Multi-region Cairo+Riyadh active-passive failover tested (RTO <= 5 min)
- [5pts] 1M MAU target
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `infra` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.infra.scale.v1` in Karapace.
- Database: Migration V147_infra.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB6`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): RTO <= 5min chaos monkey test
- BDD: `Feature: Multi-Region Failover & Scale GA Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `infra` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r6-s12` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R7.1 — GCC Market Data Infrastructure

| Attribute | Value |
|-----------|-------|
| Release | R7.0 (Global) |
| Sprint Number | 1 of 12 |
| Duration | Weeks 97–98 |
| Sprint Goal | GCC Market Data Infrastructure |
| Markets in Scope | EGX+Forex+Crypto+US+GCC |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] GCC market data infrastructure (Tadawul, DFM, ADX) provider contracts signed
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `market-data-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.gcc.feed.v1` in Karapace.
- Database: Migration V148_market_data_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB7`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): GCC market data ingestion k6 load
- BDD: `Feature: GCC Market Data Infrastructure Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `market-data-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r7-s1` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R7.2 — GCC Licenses & Security Master

| Attribute | Value |
|-----------|-------|
| Release | R7.0 (Global) |
| Sprint Number | 2 of 12 |
| Duration | Weeks 99–100 |
| Sprint Goal | GCC Licenses & Security Master |
| Markets in Scope | EGX+Forex+Crypto+US+GCC |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] CMA Saudi + SCA UAE + CMA Kuwait + QFMA Qatar license verification
- [5pts] gcc_instruments schema
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `security-master` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.gcc.instrument.v1` in Karapace.
- Database: Migration V149_security_master.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB7`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): GCC license config map verification
- BDD: `Feature: GCC Licenses & Security Master Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `security-master` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r7-s2` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R7.3 — GCC Market Data Services

| Attribute | Value |
|-----------|-------|
| Release | R7.0 (Global) |
| Sprint Number | 3 of 12 |
| Duration | Weeks 101–102 |
| Sprint Goal | GCC Market Data Services |
| Markets in Scope | EGX+Forex+Crypto+US+GCC |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] GCC market data services (GCC-specific fundamentals, Arabic disclosures)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `fundamentals-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.gcc.fundamental.v1` in Karapace.
- Database: Migration V150_fundamentals_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `GCCMarketScreen` (/route/gccmarketscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB7`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Arabic PDF disclosure parsing
- BDD: `Feature: GCC Market Data Services Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `fundamentals-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r7-s3` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R7.4 — Dubai Active Region

| Attribute | Value |
|-----------|-------|
| Release | R7.0 (Global) |
| Sprint Number | 4 of 12 |
| Duration | Weeks 103–104 |
| Sprint Goal | Dubai Active Region |
| Markets in Scope | EGX+Forex+Crypto+US+GCC |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Dubai active region (third active region)
- [5pts] Active-Active-Active multi-region
- [5pts] write affinity routing
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `infra, kong-gateway` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.infra.routing.v1` in Karapace.
- Database: Migration V151_infra, kong_gateway.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB7`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Write affinity geo-routing test
- BDD: `Feature: Dubai Active Region Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `infra, kong-gateway` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r7-s4` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R7.5 — Knowledge Operating System

| Attribute | Value |
|-----------|-------|
| Release | R7.0 (Global) |
| Sprint Number | 5 of 12 |
| Duration | Weeks 105–106 |
| Sprint Goal | Knowledge Operating System |
| Markets in Scope | EGX+Forex+Crypto+US+GCC |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Knowledge Operating System (Financial Knowledge Graph)
- [5pts] Qdrant graph embeddings
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `knowledge-graph` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.kg.node.v1` in Karapace.
- Database: Migration V152_knowledge_graph.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `KnowledgeGraphExplorer` (/route/knowledgegraphexplorer): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB7`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Graph embedding vector precision test
- BDD: `Feature: Knowledge Operating System Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `knowledge-graph` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r7-s5` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R7.6 — Enterprise Memory Engine

| Attribute | Value |
|-----------|-------|
| Release | R7.0 (Global) |
| Sprint Number | 6 of 12 |
| Duration | Weeks 107–108 |
| Sprint Goal | Enterprise Memory Engine |
| Markets in Scope | EGX+Forex+Crypto+US+GCC |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Enterprise Memory Engine (cross-session user learning, anonymized signal aggregation)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `memory-engine` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.memory.v1` in Karapace.
- Database: Migration V153_memory_engine.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB7`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Privacy preserving aggregation test
- BDD: `Feature: Enterprise Memory Engine Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `memory-engine` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r7-s6` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R7.7 — Autonomous Agents Phase 1

| Attribute | Value |
|-----------|-------|
| Release | R7.0 (Global) |
| Sprint Number | 7 of 12 |
| Duration | Weeks 109–110 |
| Sprint Goal | Autonomous Agents Phase 1 |
| Markets in Scope | EGX+Forex+Crypto+US+GCC |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Autonomous Financial Agents Phase 1 (advisory-only)
- [5pts] FRA/CMA pre-approval required
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `autonomous-agents` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.agent.advise.v1` in Karapace.
- Database: Migration V154_autonomous_agents.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `AgentDashboard` (/route/agentdashboard): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB7`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Advisory guardrail unit tests
- BDD: `Feature: Autonomous Agents Phase 1 Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `autonomous-agents` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r7-s7` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R7.8 — Autonomous Agents Phase 2

| Attribute | Value |
|-----------|-------|
| Release | R7.0 (Global) |
| Sprint Number | 8 of 12 |
| Duration | Weeks 111–112 |
| Sprint Goal | Autonomous Agents Phase 2 |
| Markets in Scope | EGX+Forex+Crypto+US+GCC |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Autonomous Financial Agents Phase 2 (semi-autonomous, user pre-approval, kill switch)
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `autonomous-agents` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.agent.action.v1` in Karapace.
- Database: Migration V155_autonomous_agents.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `AgentApprovalScreen` (/route/agentapprovalscreen): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB7`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Kill switch latency test (<50ms)
- BDD: `Feature: Autonomous Agents Phase 2 Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `autonomous-agents` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r7-s8` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R7.9 — Collective Intelligence

| Attribute | Value |
|-----------|-------|
| Release | R7.0 (Global) |
| Sprint Number | 9 of 12 |
| Duration | Weeks 113–114 |
| Sprint Goal | Collective Intelligence |
| Markets in Scope | EGX+Forex+Crypto+US+GCC |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Collective Intelligence (1M+ anonymized signal aggregation)
- [5pts] federated learning prep
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `federated-learning` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.collective.v1` in Karapace.
- Database: Migration V156_federated_learning.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB7`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Federated learning epoch duration
- BDD: `Feature: Collective Intelligence Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `federated-learning` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r7-s9` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R7.10 — Proprietary Tradeora LLM

| Attribute | Value |
|-----------|-------|
| Release | R7.0 (Global) |
| Sprint Number | 10 of 12 |
| Duration | Weeks 115–116 |
| Sprint Goal | Proprietary Tradeora LLM |
| Markets in Scope | EGX+Forex+Crypto+US+GCC |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Proprietary Tradeora LLM (model training completion, vLLM deployment)
- [5pts] A/B testing vs Ollama
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `llm-gateway` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.ai.proprietary.v1` in Karapace.
- Database: Migration V157_llm_gateway.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB7`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): A/B test proxy routing
- BDD: `Feature: Proprietary Tradeora LLM Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `llm-gateway` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r7-s10` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R7.11 — Whitelabel B2B Platform

| Attribute | Value |
|-----------|-------|
| Release | R7.0 (Global) |
| Sprint Number | 11 of 12 |
| Duration | Weeks 117–118 |
| Sprint Goal | Whitelabel B2B Platform |
| Markets in Scope | EGX+Forex+Crypto+US+GCC |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Whitelabel B2B Platform (50+ banks/brokerages)
- [5pts] custom branding API
- [5pts] white-label billing
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `b2b-whitelabel-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.b2b.whitelabel.v1` in Karapace.
- Database: Migration V158_b2b_whitelabel_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `WhitelabelAdminPortal` (/route/whitelabeladminportal): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB7`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): Tenant isolation verification
- BDD: `Feature: Whitelabel B2B Platform Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `b2b-whitelabel-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r7-s11` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.


## SPRINT S-R7.12 — Global GA & MIFID II

| Attribute | Value |
|-----------|-------|
| Release | R7.0 (Global) |
| Sprint Number | 12 of 12 |
| Duration | Weeks 119–120 |
| Sprint Goal | Global GA & MIFID II |
| Markets in Scope | EGX+Forex+Crypto+US+GCC |
| Story Points Budget | 40 points (senior team, 2-week sprint) |

### Trading & Market Features (Points)
- [5pts] Global GA (MIFID II full compliance EU markets)
- [5pts] 5M MAU target
- [5pts] final architecture review
- [2pts] End-to-end telemetry verification.
- [3pts] Audit log consistency checks against MinIO.

### AI Features (Points)
- [3pts] Validate Decimal conversion for AI inputs and outputs.
- [5pts] Enhance prompt guardrails (FRA Arabic guidelines).

### Backend Tasks
- Service `compliance-service` (NestJS/Python FastAPI): Implement core business logic for sprint features.
- Kafka: Register `tradeora.compliance.mifid.v1` in Karapace.
- Database: Migration V159_compliance_service.sql — CREATE TABLE/SCHEMA as required.
- API Route: Implement Kong gateway rate limiting rules.
- Cache: Setup Valkey DB namespaces for rapid state retrieval.

### Frontend Tasks (Flutter)
- Screen `N/A` (/route/n/a): Implement Arabic RTL layout with localized UI strings.
- Integration: Connect frontend via gRPC/REST APIs exposed by Kong.
- Asset Generation: Update localization dictionary for new terms.
- Compliance UI: Display FRA/SEC appropriate disclaimers if required.

### Infrastructure Tasks
- Apply K8s manifests for new components in `tradeora-infra` Git repo.
- Configure MinIO WORM compliance policies for audit buckets.
- Update Valkey cache namespaces (`DB7`) for new workloads.
- OpenBao secrets update: rotate keys if necessary.

### Testing Tasks
- Unit: 100% line coverage for critical domain calculations (Decimal enforcement).
- Integration (Testcontainers): MIFID II reporting BDD
- BDD: `Feature: Global GA & MIFID II Integration Scenario`
- Load (k6): Verify endpoint latency < 200ms at 500 VUs.
- Security: DAST/SAST scan enforcement in GitLab CI.

### Deployment
- Deploy `compliance-service` to production via FluxCD after 15:30 Cairo (outside EGX session).
- Enable feature flag `flag-r7-s12` for beta cohort in Unleash.
- Verify production health via Prometheus and Grafana alerting routes.

### Quality Gates
- [ ] All new Karapace schemas registered before sprint ends.
- [ ] No float violations (ast_float_checker.py passes).
- [ ] Arabic copy reviewed for all new user-facing strings.
- [ ] FRA disclaimer present in all new AI output paths.
- [ ] DB migration scripts validated on staging database.

### Sprint Risks
- Risk: Unforeseen integration latency or floating point precision leaks.
- Mitigation: Strict CI checks for Decimal types, load tests before GA release.
