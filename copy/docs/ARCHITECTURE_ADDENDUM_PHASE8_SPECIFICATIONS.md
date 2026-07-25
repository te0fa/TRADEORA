# Tradeora Financial Operating System
## Architecture Addendum — Phase 8 Pre-Production Specifications
## Version 1.0.0 | Status: APPROVED | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Resolves  : INFRA-001, GOV-002, H001-adjacent gaps (Freeze Board Sprint 1) ║
║  Purpose   : Closes all MEDIUM/HIGH gap findings from the 2026-07-24 audit  ║
║  New BCs   : BC-50 (FRAReporting), BC-51 (CustomerComplaints)               ║
║  Owner     : Chief Platform Architect                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Section 1 — Corporate Actions & Dividend Processing

### 1.1 Problem Statement
Portfolio position cost basis and historical OHLCV data are invalidated by corporate
actions (dividends, splits, rights issues). Without proper handling, AI school accuracy
calculations and portfolio NAV are incorrect.

### 1.2 Data Ingestion Flow
```
FRA Official Filing API / EGX Announcements
        │
        ▼
CorporateActionsIngestionService (Python, BullMQ job)
        │
        ├─► corporate_actions table (PostgreSQL)
        ├─► Adjust egx_ohlcv_adjusted (TimescaleDB back-adjustment)
        └─► Publish: corporate.action.CorporateActionProcessed.v1
                │
                ├─► Portfolio BC: adjust Position cost basis
                ├─► Backtesting: recalculate adjusted prices for affected period
                └─► Alert BC: check if any alert rules reference affected ticker
```

### 1.3 Corporate Actions PostgreSQL Schema
```sql
CREATE TABLE corporate_actions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker              VARCHAR(20) NOT NULL,
    action_type         VARCHAR(30) NOT NULL,   -- DIVIDEND / STOCK_SPLIT / RIGHTS_ISSUE / BONUS_SHARE
    ex_date             DATE NOT NULL,           -- date of action (ex-dividend date)
    record_date         DATE,
    payment_date        DATE,
    -- Dividend fields
    dividend_per_share  NUMERIC(12,4),           -- EGP, Decimal precision
    dividend_type       VARCHAR(20),             -- CASH / STOCK
    -- Split fields
    split_ratio_from    INTEGER,                 -- e.g., 1 (1-for-2 split: from=1)
    split_ratio_to      INTEGER,                 -- e.g., 2
    -- Rights issue fields
    rights_ratio        NUMERIC(6,4),            -- shares per existing share
    rights_price        NUMERIC(12,4),           -- EGP, Decimal
    -- Metadata
    announced_at        TIMESTAMPTZ NOT NULL,
    available_from_ts   TIMESTAMPTZ NOT NULL,    -- Rule 40 compliance
    source              VARCHAR(50) NOT NULL,    -- 'EGX_API' / 'FRA_FILING'
    processed           BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at        TIMESTAMPTZ,
    CONSTRAINT chk_action_type CHECK (action_type IN
        ('DIVIDEND','STOCK_SPLIT','RIGHTS_ISSUE','BONUS_SHARE'))
);

CREATE INDEX idx_corporate_actions_ticker_exdate ON corporate_actions(ticker, ex_date);
```

### 1.4 Position Cost Basis Adjustment
```python
from decimal import Decimal, ROUND_HALF_UP

async def adjust_position_for_dividend(
    position_id: UUID,
    dividend_per_share: Decimal,
    shares_held: Decimal,
) -> None:
    """
    Article 17: all arithmetic is Decimal.
    Cash dividend reduces cost basis by dividend_per_share per share
    (tax treatment simplified — full specification in TAX_COMPLIANCE.md).
    """
    cost_basis_reduction = (dividend_per_share * shares_held).quantize(
        Decimal('0.01'), rounding=ROUND_HALF_UP
    )
    await db.execute("""
        UPDATE positions
        SET cost_basis_egp = cost_basis_egp - $1,
            updated_at = NOW()
        WHERE id = $2
    """, cost_basis_reduction, position_id)

async def adjust_position_for_split(
    position_id: UUID,
    shares_held: Decimal,
    split_from: int,
    split_to: int,
) -> None:
    """Stock split: shares multiply by ratio, cost basis per share divides."""
    ratio = Decimal(str(split_to)) / Decimal(str(split_from))
    new_shares = (shares_held * ratio).quantize(Decimal('0.0001'), ROUND_HALF_UP)
    new_cost_per_share_factor = Decimal(str(split_from)) / Decimal(str(split_to))
    await db.execute("""
        UPDATE positions
        SET quantity = $1,
            average_cost_egp = average_cost_egp * $2,
            updated_at = NOW()
        WHERE id = $3
    """, new_shares, new_cost_per_share_factor, position_id)
```

### 1.5 Kafka Events
| Event | Topic | Consumers |
|-------|-------|-----------|
| `DividendDeclared.v1` | `corporate.action.DividendDeclared.v1` | Portfolio BC, Alert BC |
| `StockSplitProcessed.v1` | `corporate.action.StockSplitProcessed.v1` | Portfolio BC, TimescaleDB adjuster |
| `CorporateActionProcessed.v1` | `corporate.action.CorporateActionProcessed.v1` | Backtest invalidator |

---

## Section 2 — EGX30TR Benchmark Comparison

### 2.1 Purpose
Users need portfolio performance relative to the EGX30TR (Total Return Index) to
understand if their portfolio is outperforming or underperforming the market.

### 2.2 Data Ingestion
```sql
-- TimescaleDB: benchmark price time-series
CREATE TABLE benchmark_prices (
    benchmark_id    VARCHAR(20) NOT NULL,       -- 'EGX30TR' / 'EGX100'
    price_date      DATE NOT NULL,
    close_value     NUMERIC(14,4) NOT NULL,     -- index value, Decimal precision
    total_return    NUMERIC(14,6),              -- cumulative total return factor
    available_from_ts TIMESTAMPTZ NOT NULL,     -- Rule 40
    PRIMARY KEY (benchmark_id, price_date)
);
SELECT create_hypertable('benchmark_prices', 'price_date');
```

### 2.3 Alpha & Beta Calculation (Decimal Arithmetic)
```python
from decimal import Decimal, ROUND_HALF_UP
from typing import List
import statistics

def calculate_portfolio_alpha_beta(
    portfolio_daily_returns: List[Decimal],
    benchmark_daily_returns: List[Decimal],
    risk_free_daily: Decimal = Decimal('0.000365'),  # ~13% annual CBE rate / 365
) -> tuple[Decimal, Decimal]:
    """
    Calculate portfolio Alpha and Beta vs EGX30TR.
    All arithmetic is Decimal (Article 17).
    Returns: (alpha_annualized, beta)
    """
    n = len(portfolio_daily_returns)
    assert n == len(benchmark_daily_returns) and n >= 30, "Minimum 30 days required"
    n_d = Decimal(str(n))

    # Mean returns
    port_mean = sum(portfolio_daily_returns) / n_d
    bench_mean = sum(benchmark_daily_returns) / n_d
    rf_mean = risk_free_daily

    # Beta = Cov(portfolio, benchmark) / Var(benchmark)
    port_excess  = [r - port_mean  for r in portfolio_daily_returns]
    bench_excess = [r - bench_mean for r in benchmark_daily_returns]

    covariance = sum(p * b for p, b in zip(port_excess, bench_excess)) / (n_d - 1)
    bench_var  = sum(b ** 2 for b in bench_excess) / (n_d - 1)

    if bench_var == Decimal('0'):
        return Decimal('0'), Decimal('1')

    beta  = (covariance / bench_var).quantize(Decimal('0.0001'), ROUND_HALF_UP)
    alpha_daily = port_mean - (rf_mean + beta * (bench_mean - rf_mean))
    alpha_annual = (alpha_daily * Decimal('252')).quantize(Decimal('0.0001'), ROUND_HALF_UP)

    return alpha_annual, beta
```

### 2.4 API Endpoint
```
GET /api/v1/portfolio/{portfolioId}/benchmark-comparison
Authorization: Bearer {user_jwt}
Response 200:
{
  "portfolioId": "...",
  "benchmarkId": "EGX30TR",
  "periodDays": 90,
  "portfolioReturn": "0.1823",      // Decimal string: 18.23%
  "benchmarkReturn": "0.1241",      // Decimal string: 12.41%
  "alpha": "0.0421",                // Decimal string: annualized
  "beta": "0.8750",                 // Decimal string
  "sharpeRatio": "1.2340",          // Decimal string
  "informationRatio": "0.7810",     // Decimal string
  "calculatedAt": "2026-07-24T09:00:00Z"
}
```

---

## Section 3 — AI Cold-Start Strategy

### 3.1 Definition
Cold-start occurs in two scenarios:
- **User cold-start**: New user with no portfolio history (no behavioral school data)
- **Ticker cold-start**: Newly listed EGX security with < 30 days of OHLCV history

### 3.2 User Cold-Start
| School | Cold-Start Behavior |
|--------|---------------------|
| Behavioral School (SCHOOL-08) | Uses market-wide median behavioral profile for Egypt until ≥30 days of user interaction history |
| Portfolio Intelligence (SCHOOL-11) | Uses empty portfolio defaults (equal-weight EGX30 exposure as reference) |
| All other schools | No change — analyze ticker independently of user history |

```python
# Cold-start detection
COLD_START_USER_THRESHOLD_DAYS = 30
COLD_START_USER_KEY = "ai:user:cold_start:{user_id}"

async def is_user_cold_start(user_id: str, valkey: Valkey) -> bool:
    return bool(await valkey.exists(f"ai:user:cold_start:{user_id}"))

# Set on user registration, expires after 30 days
async def mark_user_cold_start(user_id: str, valkey: Valkey) -> None:
    await valkey.set(f"ai:user:cold_start:{user_id}", "1",
                     ex=30 * 24 * 3600)  # 30 days TTL
```

### 3.3 Ticker Cold-Start
```python
COLD_START_TICKER_THRESHOLD_DAYS = 30
COLD_START_TICKER_KEY = "ai:ticker:cold_start:{ticker}"

# Schools excluded during ticker cold-start
COLD_START_EXCLUDED_SCHOOLS = {
    'SCHOOL-10',  # Peer Comparison (needs historical peer data)
    'SCHOOL-12',  # Pattern Recognition (needs ≥30 days OHLCV)
}

# Reduced quorum for cold-start tickers (10 of 12 schools)
# becomes (8 of 10 schools = 80% of eligible)
COLD_START_MINIMUM_SCHOOLS = 7   # 7 of 10 eligible schools (70%)

async def get_eligible_schools_for_ticker(ticker: str, valkey: Valkey) -> set[str]:
    is_cold_start = bool(await valkey.exists(f"ai:ticker:cold_start:{ticker}"))
    if is_cold_start:
        return ALL_PHASE1_SCHOOLS - COLD_START_EXCLUDED_SCHOOLS
    return ALL_PHASE1_SCHOOLS
```

---

## Section 4 — Market Regime Detection Engine

### 4.1 Why Market Regime Detection Is Required
The WisdomEngine uses static weights between monthly recalibrations. However, the
optimal weighting differs significantly by market regime. Technical Analysis schools
perform better in trending markets; Fundamental schools perform better in sideways
markets; Macro schools dominate in high-rate environments.

### 4.2 The 4 EGX Market Regimes
| Regime | Definition | Weight Shift |
|--------|-----------|-------------|
| `BULL_TREND` | EGX30 > 50-DMA > 200-DMA; positive momentum | ↑ Technical (+15%), ↑ Smart Money (+10%) |
| `BEAR_TREND` | EGX30 < 50-DMA < 200-DMA; negative momentum | ↑ Risk (+20%), ↑ Macro (+15%) |
| `HIGH_VOLATILITY` | EGX volatility index > 2σ above 90-day avg | ↑ Risk (+25%), ↓ Technical (-10%) |
| `SIDEWAYS` | Range-bound ±3% over 20 days; low volume | ↑ Fundamental (+15%), ↑ Earnings (+10%) |

### 4.3 Detection Algorithm
```python
from decimal import Decimal

async def detect_market_regime(egx30_prices: list[Decimal], cberate: Decimal) -> str:
    """Detect current EGX market regime using moving averages and volatility."""
    if len(egx30_prices) < 200:
        return 'SIDEWAYS'   # Insufficient history: conservative default

    current  = egx30_prices[-1]
    ma_50    = sum(egx30_prices[-50:]) / Decimal('50')
    ma_200   = sum(egx30_prices[-200:]) / Decimal('200')

    # Volatility: 20-day std dev of daily returns
    returns_20d = [
        (egx30_prices[i] - egx30_prices[i-1]) / egx30_prices[i-1]
        for i in range(-20, 0)
    ]
    mean_ret = sum(returns_20d) / Decimal('20')
    variance = sum((r - mean_ret)**2 for r in returns_20d) / Decimal('19')
    vol_20d  = variance.sqrt()
    vol_ann  = (vol_20d * Decimal('252').sqrt()).quantize(Decimal('0.0001'))

    # High volatility threshold: > 30% annualized
    if vol_ann > Decimal('0.30'):
        return 'HIGH_VOLATILITY'

    if current > ma_50 > ma_200:
        return 'BULL_TREND'

    if current < ma_50 < ma_200:
        return 'BEAR_TREND'

    # Range-bound check: last 20 days within ±3% of 20-day mean
    high_20d = max(egx30_prices[-20:])
    low_20d  = min(egx30_prices[-20:])
    range_pct = (high_20d - low_20d) / low_20d
    if range_pct < Decimal('0.06'):
        return 'SIDEWAYS'

    return 'SIDEWAYS'   # Default fallback
```

### 4.4 Regime Storage & Events
```python
# Stored in Valkey with 15-minute TTL (recalculated every 15 min)
REGIME_KEY = "market:regime:current"
await valkey.set(REGIME_KEY, regime, ex=900)  # 15 min

# Kafka event on regime change
if previous_regime != new_regime:
    await kafka.publish('market.regime.RegimeChanged.v1', {
        'previousRegime': previous_regime,
        'newRegime': new_regime,
        'detectedAt': datetime.utcnow().isoformat(),
        'egx30Value': str(current),
        'volatilityAnnualized': str(vol_ann),
    })
```

---

## Section 5 — Portfolio Correlation Matrix

### 5.1 Purpose
Measures concentration risk: if all held securities are highly correlated, the
portfolio has hidden concentration risk even if spread across many tickers.

### 5.2 Schema
```sql
CREATE TABLE portfolio_correlations (
    portfolio_id        UUID NOT NULL,
    ticker_a            VARCHAR(20) NOT NULL,
    ticker_b            VARCHAR(20) NOT NULL,
    correlation_90d     NUMERIC(6,4) NOT NULL,    -- Pearson, Decimal [-1.0000, 1.0000]
    calculated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (portfolio_id, ticker_a, ticker_b)
);
-- Nightly BullMQ job: recalculate after market close
-- Alert: if weighted-average correlation > 0.85 → HighCorrelationRiskAlert published
```

### 5.3 Calculation (Decimal)
```python
def pearson_correlation(returns_a: list[Decimal], returns_b: list[Decimal]) -> Decimal:
    n = Decimal(str(len(returns_a)))
    mean_a = sum(returns_a) / n
    mean_b = sum(returns_b) / n
    dev_a = [r - mean_a for r in returns_a]
    dev_b = [r - mean_b for r in returns_b]
    numerator   = sum(da * db for da, db in zip(dev_a, dev_b))
    denom_a     = sum(da**2 for da in dev_a).sqrt()
    denom_b     = sum(db**2 for db in dev_b).sqrt()
    denom       = denom_a * denom_b
    if denom == Decimal('0'):
        return Decimal('0')
    return (numerator / denom).quantize(Decimal('0.0001'), ROUND_HALF_UP)
```

---

## Section 6 — PDPL Right-to-Erasure: EventStoreDB Strategy

### 6.1 Problem
EventStoreDB is append-only. Physical deletion of events is architecturally impossible
without destroying the event log integrity.

### 6.2 Solution: PII Encryption Key Deletion Pattern

```
At event write time:
  PII field value → AES-256-GCM encrypt (per-user key from OpenBao) → store encrypted

At erasure time (SAGA-004):
  1. DELETE /secret/users/{userId}/event-encryption-key from OpenBao
  2. All encrypted PII fields in EventStoreDB → permanently unreadable
  3. This constitutes "functional erasure" — equivalent to physical deletion for PDPL purposes

Justification:
  - PDPL 2020 Art. 10 requires that personal data be rendered inaccessible
  - Key deletion achieves this: data exists but is indecipherable without the key
  - DPA (Data Protection Authority) interpretive guidance supports cryptographic erasure
  - This pattern is used by Google Cloud, AWS, and Stripe for GDPR compliance
```

### 6.3 Implementation
```python
# OpenBao key management
OPENBAO_KEY_PATH = "secret/users/{user_id}/event-encryption-key"

async def create_user_encryption_key(user_id: str) -> None:
    """Called at user registration."""
    key_bytes = secrets.token_bytes(32)   # 256-bit AES key
    await openbao.write_secret(
        OPENBAO_KEY_PATH.format(user_id=user_id),
        {'value': base64.b64encode(key_bytes).decode(), 'algorithm': 'AES-256-GCM'}
    )

async def encrypt_pii(data: str, user_id: str) -> str:
    """Encrypt a PII string field before writing to EventStoreDB."""
    secret = await openbao.read_secret(OPENBAO_KEY_PATH.format(user_id=user_id))
    key = base64.b64decode(secret['value'])
    nonce = secrets.token_bytes(12)
    ct = aes_gcm_encrypt(data.encode(), key, nonce)
    return base64.b64encode(nonce + ct).decode()

async def erase_user_pii(user_id: str) -> bool:
    """SAGA-004 Step 6: delete key → all PII becomes unreadable."""
    await openbao.delete_secret(OPENBAO_KEY_PATH.format(user_id=user_id))
    verify = await openbao.read_secret(OPENBAO_KEY_PATH.format(user_id=user_id))
    if verify is not None:
        raise PDPLErasureError(f"Key deletion failed for user {user_id}")
    return True
```

### 6.4 PII Fields by Event Type
| Event Type | Encrypted PII Fields |
|-----------|---------------------|
| `UserRegistered.v1` | email, mobile, fullName, nationalIdHash |
| `KYCDocumentsSubmitted.v1` | documentUrls, nationalIdNumber |
| `AddressUpdated.v1` | streetAddress, city, governorate |
| `OrderPlaced.v1` (future) | brokerAccountNumber |

---

## Section 7 — FRA Regulatory Reporting (BC-50: FRAReporting)

### 7.1 Bounded Context Definition
| Field | Value |
|-------|-------|
| BC Name | FRAReporting |
| BC Number | BC-50 |
| Domain | Compliance |
| Aggregate Root | FRAReport |
| Owner | Compliance Team |
| New in | Phase 1 (mandatory) |

### 7.2 FRAReport Aggregate State Machine
```
DRAFT → GENERATING → GENERATED → UNDER_REVIEW → SUBMITTED → ACKNOWLEDGED
                                                    │
                                                    └─► REJECTED → RESUBMITTED
```

### 7.3 PostgreSQL Schema
```sql
CREATE TABLE fra_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_period   DATE NOT NULL,              -- first day of month (2026-07-01)
    report_type     VARCHAR(30) NOT NULL,        -- MONTHLY_AI_ACTIVITY / QUARTERLY_RISK
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    generated_at    TIMESTAMPTZ,
    submitted_at    TIMESTAMPTZ,
    fra_reference   VARCHAR(100),               -- FRA acknowledgement number
    sftp_path       VARCHAR(500),               -- MinIO path before upload
    report_data     JSONB,                       -- summary metrics
    generated_by    VARCHAR(255),               -- 'AUTOMATED' or engineer ID
    reviewed_by     VARCHAR(255),               -- ROLE_COMPLIANCE_OFFICER
    worm_path       VARCHAR(500),               -- MinIO WORM archive path
    CONSTRAINT chk_status CHECK (status IN
        ('DRAFT','GENERATING','GENERATED','UNDER_REVIEW','SUBMITTED','ACKNOWLEDGED','REJECTED'))
);
```

### 7.4 Monthly Report Content
The monthly AI activity report includes:
- Total AI recommendations generated in the period
- Recommendations by direction (BUY/HOLD/SELL counts)
- Safety gate block rate (how often Check 1–7 blocked a recommendation)
- User count receiving AI recommendations
- FRA embargo check events (how many tickers were blocked)
- Confirmation that all recommendations included FRA disclosure

### 7.5 Automated Delivery
```python
# BullMQ cron: 1st of each month, 03:00 Cairo time
MONTHLY_REPORT_CRON = '0 3 1 * *'

async def generate_and_submit_fra_report(period: date) -> None:
    report = await compile_monthly_metrics(period)
    csv_path = await generate_csv_report(report)
    pdf_path = await generate_pdf_report(report)

    # Encrypt with FRA public key before transmission
    encrypted_pdf = await encrypt_with_fra_public_key(pdf_path)

    # Upload via SFTP to FRA portal
    await sftp_upload(encrypted_pdf, fra_sftp_config)

    # Archive to WORM
    worm_path = f"fra-reports/{period.year}/{period.month:02d}/report.pdf"
    await minio_worm.put_object('fra-reports', worm_path, encrypted_pdf)

    await kafka.publish('compliance.FRAReporting.MonthlyReportSubmitted.v1', {
        'reportId': str(report.id),
        'period': period.isoformat(),
        'wormPath': worm_path,
        'submittedAt': datetime.utcnow().isoformat(),
    })
```

### 7.6 API Endpoints
```
GET  /api/v1/admin/fra-reports                    # ROLE_COMPLIANCE_OFFICER
GET  /api/v1/admin/fra-reports/{id}               # ROLE_COMPLIANCE_OFFICER
POST /api/v1/admin/fra-reports/trigger            # Manual trigger (ROLE_COMPLIANCE_OFFICER)
GET  /api/v1/admin/fra-reports/{id}/download      # Download PDF (ROLE_COMPLIANCE_OFFICER)
```

---

## Section 8 — Customer Complaint Handling (BC-51: CustomerComplaints)

### 8.1 Bounded Context Definition
| Field | Value |
|-------|-------|
| BC Name | CustomerComplaints |
| BC Number | BC-51 |
| Domain | CustomerService |
| Aggregate Root | Complaint |
| Owner | Customer Success Team |
| SLA | 24h initial response, 10 business days resolution (FRA standard) |

### 8.2 Complaint State Machine
```
SUBMITTED ─────────────────────► UNDER_REVIEW ──────────────────► RESOLVED
    │                                   │                              │
    │                            (> 5 business days)                  ▼
    │                                   │                         CLOSED
    └──────────────────────────────►  ESCALATED ────────────────► RESOLVED
                                        │
                              (ROLE_COMPLIANCE_OFFICER)
```

### 8.3 PostgreSQL Schema
```sql
CREATE TABLE complaints (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,
    complaint_type      VARCHAR(50) NOT NULL,   -- AI_RECOMMENDATION / APP_BUG / BILLING / OTHER
    title               VARCHAR(200) NOT NULL,
    description         TEXT NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    priority            VARCHAR(10) NOT NULL DEFAULT 'NORMAL',  -- LOW/NORMAL/HIGH/CRITICAL
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    initial_response_at TIMESTAMPTZ,
    resolved_at         TIMESTAMPTZ,
    closed_at           TIMESTAMPTZ,
    escalated_at        TIMESTAMPTZ,
    assigned_to         VARCHAR(255),           -- support agent
    resolution_notes    TEXT,
    fra_reference       VARCHAR(100),           -- if FRA-escalated
    worm_path           VARCHAR(500),           -- WORM audit archive
    CONSTRAINT chk_status CHECK (status IN
        ('SUBMITTED','UNDER_REVIEW','ESCALATED','RESOLVED','CLOSED'))
);
```

### 8.4 SLA Enforcement (BullMQ)
```typescript
// On complaint submission: schedule SLA checks
await complaintQueue.add('initial-response-check', { complaintId }, {
  delay: 24 * 60 * 60 * 1000,      // 24 hours
  jobId: `sla-initial:${complaintId}`,
});

await complaintQueue.add('escalation-check', { complaintId }, {
  delay: 5 * 24 * 60 * 60 * 1000,  // 5 business days
  jobId: `sla-escalation:${complaintId}`,
});

await complaintQueue.add('resolution-deadline', { complaintId }, {
  delay: 10 * 24 * 60 * 60 * 1000, // 10 business days
  jobId: `sla-resolution:${complaintId}`,
});
```

### 8.5 API Endpoints
```
POST /api/v1/complaints                          # User submits complaint
GET  /api/v1/complaints/{id}                     # User views own complaint status
GET  /api/v1/admin/complaints                    # ROLE_COMPLIANCE_OFFICER: all complaints
PUT  /api/v1/admin/complaints/{id}/status        # Update status
POST /api/v1/admin/complaints/{id}/escalate      # Manual escalation
GET  /api/v1/admin/complaints/sla-dashboard      # SLA compliance view
```

---

## Section 9 — Zero-Downtime Database Migration (Expand-and-Contract)

### 9.1 The Problem
Kubernetes rolling deployments run old and new pod versions simultaneously.
A migration that drops a column causes old pods to fail immediately.

### 9.2 The Mandatory Pattern
```
Phase 1 — EXPAND:
  Add new column/table WITHOUT removing old one.
  Old pods: ignore new column (tolerant code)
  New pods: write to both old and new columns

Phase 2 — DEPLOY:
  Roll out new application version (100% new pods)
  Verify: all pods on new version, no old pods remain

Phase 3 — CONTRACT:
  Remove old column/table (old pods are gone, no risk)
  Migration: DROP COLUMN old_column_name;
```

### 9.3 Flyway Migration Naming Convention
```
V{version}__{description}.sql       — Standard migration (expand or non-breaking)
V{version}__CONTRACT_{description}.sql — Contract phase (drop/rename)
```

### 9.4 CI Gate: Migration Linter
```python
# .github/workflows/migration-lint.yml
def lint_migration_file(sql_content: str, filename: str) -> list[str]:
    errors = []
    is_contract = 'CONTRACT_' in filename.upper()

    if not is_contract:
        # Non-contract migrations must NOT contain destructive DDL
        DESTRUCTIVE_PATTERNS = [
            r'\bDROP\s+COLUMN\b',
            r'\bRENAME\s+COLUMN\b',
            r'\bALTER\s+COLUMN\b.*\bTYPE\b',   # type change
            r'\bDROP\s+TABLE\b',
        ]
        for pattern in DESTRUCTIVE_PATTERNS:
            if re.search(pattern, sql_content, re.IGNORECASE):
                errors.append(
                    f"Migration {filename} contains destructive DDL '{pattern}'. "
                    f"Use Expand-and-Contract: rename file to CONTRACT_{filename} "
                    f"and only apply AFTER full deployment of the expand phase."
                )
    return errors
```

---

## Section 10 — PgBouncer Per-BC Connection Quotas

### 10.1 Problem
49 BCs sharing a single PgBouncer pool can cause connection starvation during peak load.
A misbehaving BC can exhaust the pool, starving critical BCs like Portfolio and Orders.

### 10.2 Named Pool Sets per BC Tier

```ini
# pgbouncer.ini — named pools per criticality tier
[databases]
; CRITICAL TIER — reserved pools (5 connections each)
tradeora_portfolio   = host=postgres port=5432 dbname=tradeora_db pool_size=5
tradeora_risk        = host=postgres port=5432 dbname=tradeora_db pool_size=5
tradeora_auth        = host=postgres port=5432 dbname=tradeora_db pool_size=5
tradeora_compliance  = host=postgres port=5432 dbname=tradeora_db pool_size=5

; HIGH TIER — reserved pools (3 connections each)
tradeora_marketdata  = host=postgres port=5432 dbname=tradeora_db pool_size=3
tradeora_ai_consensus= host=postgres port=5432 dbname=tradeora_db pool_size=3
tradeora_notifications= host=postgres port=5432 dbname=tradeora_db pool_size=3

; STANDARD TIER — shared pool (remaining BCs rotate)
tradeora_standard    = host=postgres port=5432 dbname=tradeora_db pool_size=40

[pgbouncer]
pool_mode = transaction
max_client_conn = 500
default_pool_size = 2
server_idle_timeout = 600

; Alert if any named pool wait > 50ms
; Prometheus: pgbouncer_pool_waiting_clients{database} > 0
```

### 10.3 Monitoring Alert
```yaml
- alert: PgBouncerPoolStarvation
  expr: pgbouncer_pool_waiting_clients{database=~"tradeora_.*"} > 3
  for: 30s
  labels:
    severity: warning
  annotations:
    summary: "PgBouncer pool {{ $labels.database }} has {{ $value }} waiting clients"
```

---

## Section 11 — AML Ongoing Transaction Monitoring

### 11.1 Monitoring Rules (Nightly BullMQ Job: `aml-monitor`)
```python
AML_RULES = [
    AMLRule(
        id='AML-001',
        name='High Velocity Trading',
        description='User viewing >20 securities per day for 3 consecutive days (proxy for unusual research)',
        check=lambda stats: stats.daily_securities_viewed > 20,
        consecutive_days=3,
        risk_level='MEDIUM',
    ),
    AMLRule(
        id='AML-002',
        name='Extreme Concentration Signal',
        description='Portfolio >80% single security + high AI recommendation requests for that ticker',
        check=lambda stats: stats.max_ticker_concentration > Decimal('0.80'),
        risk_level='MEDIUM',
    ),
    AMLRule(
        id='AML-003',
        name='Suspicious Activity Pattern',
        description='AI recommendation request patterns matching known pump-and-dump profiles',
        check=lambda stats: stats.pump_dump_score > Decimal('0.85'),
        risk_level='HIGH',
    ),
]
```

### 11.2 Flagged Account Handling
```python
async def handle_aml_flag(user_id: str, rule_id: str, risk_level: str) -> None:
    # 1. Store flag in compliance schema
    await db.execute("""
        INSERT INTO aml_flags (user_id, rule_id, risk_level, detected_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, rule_id) DO UPDATE SET
            detected_at = NOW(), cleared = FALSE
    """, user_id, rule_id, risk_level)

    # 2. Publish event for compliance review queue
    await kafka.publish('compliance.AMLMonitoring.AMLSuspicionRaised.v1', {
        'userId': user_id,
        'ruleId': rule_id,
        'riskLevel': risk_level,
        'detectedAt': datetime.utcnow().isoformat(),
    })

    # 3. HIGH risk: immediate Slack + email to ROLE_COMPLIANCE_OFFICER
    if risk_level == 'HIGH':
        await notify_compliance_officer(user_id, rule_id)
```

---

## Section 12 — WORM Archive Integrity Verification

### 12.1 Monthly Automated Verification Job
```python
# BullMQ cron: 1st of month, 04:00 Cairo time
WORM_VERIFICATION_CRON = '0 4 1 * *'

async def verify_worm_integrity(bucket: str, month: date) -> IntegrityReport:
    """Verify all WORM objects from the previous month are intact."""
    prefix = f"{month.year}/{month.month:02d}/"
    objects = await minio.list_objects(bucket, prefix=prefix)
    results = []

    for obj in objects:
        # Download object and verify SHA-256 hash
        data = await minio.get_object(bucket, obj.object_name)
        actual_hash = hashlib.sha256(data).hexdigest()
        stored_hash = obj.metadata.get('X-Amz-Meta-Sha256')

        integrity_ok = stored_hash and actual_hash == stored_hash
        results.append(IntegrityResult(
            object_name=obj.object_name,
            size_bytes=obj.size,
            integrity_ok=integrity_ok,
            actual_hash=actual_hash,
            stored_hash=stored_hash,
        ))

        if not integrity_ok:
            # PagerDuty P1 alert — WORM corruption is a regulatory emergency
            await pagerduty.trigger(
                severity='critical',
                summary=f'WORM integrity failure: {bucket}/{obj.object_name}',
            )

    # Write verification report to separate bucket
    report_path = f"worm-verification/{bucket}/{month.year}/{month.month:02d}/report.json"
    await minio.put_object('worm-verification', report_path,
                           json.dumps(results_summary(results)).encode())

    return IntegrityReport(
        bucket=bucket,
        period=month,
        total_objects=len(results),
        passed=sum(1 for r in results if r.integrity_ok),
        failed=sum(1 for r in results if not r.integrity_ok),
    )
```

---

## Section 13 — Push Notification Token Lifecycle

### 13.1 Token Registration
```typescript
// Flutter app → API Gateway → NotificationDelivery service
PATCH /api/v1/me/notification-token
Body: { "platform": "ANDROID" | "IOS", "token": "fcm-or-apns-token", "deviceId": "..." }
```

### 13.2 PostgreSQL Schema
```sql
CREATE TABLE notification_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    device_id   VARCHAR(255) NOT NULL,   -- unique per device
    platform    VARCHAR(10) NOT NULL,    -- ANDROID / IOS
    token       TEXT NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at  TIMESTAMPTZ,
    UNIQUE (user_id, device_id)          -- one token per device
);
-- Max 5 active tokens per user (5-device limit)
```

### 13.3 Token Expiry Handling (FCM INVALID_REGISTRATION)
```python
async def handle_fcm_delivery_failure(token: str, error_code: str) -> None:
    if error_code == 'INVALID_REGISTRATION':
        await db.execute(
            "UPDATE notification_tokens SET is_active = FALSE WHERE token = $1", token
        )
        await kafka.publish('notifications.Token.TokenExpired.v1', {
            'token': token[:20] + '***',   # partial log only (security)
            'reason': 'INVALID_REGISTRATION',
        })
        # User prompted to re-enable notifications on next app open
```

### 13.4 PDPL Erasure Integration
Tokens are deleted in SAGA-004 Step 8 (notification preferences deletion):
```python
await db.execute(
    "DELETE FROM notification_tokens WHERE user_id = $1", user_id
)
```

---

## Section 14 — Formally Acknowledged Phase 1.5 Backlog

The following capabilities are intentionally deferred and formally registered
in the Technical Debt Register. They are NOT missing — they are scheduled:

| Debt ID | Capability | Target Phase | Justification |
|---------|-----------|-------------|---------------|
| DEBT-006 | Stop-loss / Take-profit advisory | Phase 1.5 | Requires FRA pre-approval for advisory price targets |
| DEBT-007 | EGX Level 2 order book | Phase 2 | Requires EGX co-location agreement |
| DEBT-008 | Schools 13–17 activation | Phase 2 | Requires additional training data for EGX |
| DEBT-009 | PATCH-001b (17-school quorum) | Phase 2 | Blocked on DEBT-008 |
| DEBT-010 | GCC expansion (Tadawul, DFM) | Phase 3 | Separate regulatory and market-data agreements |
| DEBT-011 | EGX30TR futures (when listed) | Phase 3 | EGX derivatives market not yet launched |

---

*Document: ARCHITECTURE_ADDENDUM_PHASE8_SPECIFICATIONS.md*
*Version: 1.0.0 | Status: APPROVED*
*Resolves: INFRA-001 — closes all MEDIUM/HIGH gap findings from Freeze Board audit*
*New BCs: BC-50 (FRAReporting), BC-51 (CustomerComplaints)*
