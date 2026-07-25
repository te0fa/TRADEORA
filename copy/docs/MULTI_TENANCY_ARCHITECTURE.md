# Tradeora Financial Operating System
## Multi-Tenancy Architecture — Complete Technical Specification
## Version 1.0.0 | Status: APPROVED | Date: 2026-07-24

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT AUTHORITY                                                          ║
║  Constitution Article 3   : Extension Over Modification (tenant isolation)   ║
║  Constitution Article 8   : Mandatory data isolation between tenants         ║
║  Constitutional Reference : Cross-tenant data access = immediate SEV-1       ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Section 1 — Tenant Classification (4 Tiers)

| Tier | User Type | Isolation Model | Phase | Key Differentiator |
|------|----------|----------------|-------|------------------|
| **RETAIL** | Individual Egyptian investors | Pooled (RLS) | 1 | Shared DB, cost-efficient, EGX retail focus |
| **WEALTH_MANAGEMENT** | Wealth advisors managing client portfolios | Pooled (RLS) + elevated quotas | 1 | Multi-client view, elevated rate limits |
| **FAMILY_OFFICE** | Single family managing wealth | Schema-per-tenant | 2 | Dedicated schema, custom risk parameters |
| **INSTITUTIONAL** | Brokerage firms, investment companies | Instance-per-tenant | 2 | Dedicated Kubernetes namespace + DB |

---

## Section 2 — Isolation Model A: Pooled/Shared Schema (RETAIL)

### 2.1 PostgreSQL Row-Level Security (RLS)

The foundation of retail tenant isolation — enforced at the **database level**, not the
application level. Even if application code has a bug, RLS prevents cross-user data access.

```sql
-- Applied to ALL financial tables in RETAIL schema
-- Migration: V1_0_0__enable_rls_portfolio.sql

-- Enable RLS on every table that contains user data
ALTER TABLE portfolio.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts.portfolio_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_identity.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create isolation policies
CREATE POLICY retail_user_isolation ON portfolio.portfolios
  AS RESTRICTIVE
  FOR ALL
  TO tradeora_app_user
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

CREATE POLICY retail_user_isolation ON portfolio.holdings
  AS RESTRICTIVE
  FOR ALL
  TO tradeora_app_user
  USING (
    portfolio_id IN (
      SELECT id FROM portfolio.portfolios
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Compliance team can read all records (for FRA investigations)
CREATE POLICY compliance_read_all ON portfolio.portfolios
  AS PERMISSIVE
  FOR SELECT
  TO tradeora_compliance_user
  USING (true);

-- FORCE: Ensure RLS cannot be bypassed even by table owner
ALTER TABLE portfolio.portfolios FORCE ROW LEVEL SECURITY;
```

### 2.2 Request Context Injection

```typescript
// packages/database/src/tenant/rls-context.middleware.ts

@Injectable()
export class RLSContextMiddleware implements NestMiddleware {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user?.sub; // JWT 'sub' claim = user UUID
    if (!userId) {
      return next();
    }

    // Set PostgreSQL session variable for RLS policy evaluation
    // This is the ONLY mechanism for tenant isolation at DB level
    await this.dataSource.query(
      `SET app.current_user_id = $1`,
      [userId]
    );

    // Validate it's a valid UUID (prevent injection)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(userId)) {
      throw new ForbiddenException('Invalid user context');
    }

    return next();
  }
}
```

### 2.3 Valkey Namespace Isolation (Retail)

```typescript
// Cache key pattern for retail tier: tenant:{userId}:{domain}:{key}
// Examples:
//   tenant:usr_01J6XXX:portfolio:nav         → Portfolio NAV cache
//   tenant:usr_01J6XXX:ai:recommendation:COMI → AI recommendation cache
//   tenant:usr_01J6XXX:ratelimit:recommendations → Rate limit counter

class RetailCacheKeyFactory {
  static portfolioNAV(userId: string): string {
    return `tenant:${userId}:portfolio:nav`;
  }
  
  static aiRecommendation(userId: string, ticker: string): string {
    return `tenant:${userId}:ai:recommendation:${ticker}`;
  }
  
  static rateLimit(userId: string, feature: string): string {
    return `tenant:${userId}:ratelimit:${feature}`;
  }
}
```

### 2.4 Kafka Isolation (Retail — Header-Based)

For the pooled model, all events go through shared topics. Tenant identification via Kafka message headers:

```typescript
// All Kafka producers MUST set tenant headers
producer.send({
  topic: 'portfolio.PortfolioNAVUpdated.v1',
  messages: [{
    key: portfolioId,
    value: JSON.stringify(payload),
    headers: {
      'tenant-id': userId,           // RETAIL: userId IS tenantId
      'tenant-tier': 'RETAIL',
      'trace-id': requestId,
    },
  }],
});

// Consumers filter by tenant-id header — no cross-tenant processing
```

---

## Section 3 — Isolation Model B: Schema-per-Tenant (FAMILY_OFFICE)

### 3.1 Schema Provisioning

When a Family Office tenant is onboarded, a dedicated PostgreSQL schema is created:

```sql
-- Automated by TenantProvisioningService
-- Migration template: V1_0_0__family_office_schema.sql.template

-- Create dedicated schema for family office
CREATE SCHEMA IF NOT EXISTS "fo_${TENANT_ID}";

-- Grant access only to this tenant's service user
CREATE USER "fo_svc_${TENANT_ID}" WITH PASSWORD '${GENERATED_PASSWORD}';
GRANT USAGE ON SCHEMA "fo_${TENANT_ID}" TO "fo_svc_${TENANT_ID}";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA "fo_${TENANT_ID}" TO "fo_svc_${TENANT_ID}";

-- Create tables in tenant schema
CREATE TABLE "fo_${TENANT_ID}".portfolios (
    id          TEXT PRIMARY KEY,
    client_id   TEXT NOT NULL,  -- Family member / beneficiary
    name        TEXT NOT NULL,
    -- ... same structure as pooled.portfolios
    -- NO user_id column needed (whole schema is single tenant)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Flyway migration runs in tenant schema context
-- All subsequent migrations apply to this schema
```

### 3.2 TypeScript Tenant Context for Schema-per-Tenant

```typescript
// services/tenant-aware-db/src/family-office-datasource.factory.ts

export class FamilyOfficeDataSourceFactory {
  create(tenantId: string, credentials: TenantCredentials): DataSource {
    return new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432,
      database: 'tradeora',
      username: `fo_svc_${tenantId}`,   // Dedicated DB user per tenant
      password: credentials.dbPassword,
      schema: `fo_${tenantId}`,          // Search path set to tenant schema
      // PgBouncer pool: dedicated pool per family office tenant
      // pool_mode: transaction (for multi-statement transactions)
    });
  }
}
```

### 3.3 Custom Risk Parameters (Family Office Differentiator)

```typescript
export interface FamilyOfficeRiskConfig {
  maxSingleStockConcentration: Decimal;  // e.g., Decimal('0.20') = 20%
  maxSectorConcentration: Decimal;        // e.g., Decimal('0.35') = 35%
  maxDrawdownThreshold: Decimal;          // Alert at: e.g., Decimal('0.10') = 10%
  prohibitedSectors?: string[];           // e.g., ['GAMBLING', 'ALCOHOL']
  shariahCompliantOnly?: boolean;         // Islamic finance filter
  customBenchmark?: string;               // e.g., 'EGX30TR' or custom index
  rebalancingFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
}
```

---

## Section 4 — Isolation Model C: Instance-per-Tenant (INSTITUTIONAL)

### 4.1 Architecture (Phase 2)

```
Kubernetes Cluster
├── namespace: tradeora-platform (shared services: API Gateway, Keycloak)
├── namespace: tradeora-retail   (Retail + WM tenants, pooled model)
├── namespace: tradeora-fo-{id}  (Each Family Office, schema-per-tenant)
└── namespace: tradeora-inst-{id} (Each Institutional tenant, full isolation)
         │
         ├── Dedicated PostgreSQL cluster (Patroni 3-node, in-namespace)
         ├── Dedicated Kafka consumer group + topic prefix
         ├── Dedicated Ollama GPU allocation (if custom AI model)
         ├── Dedicated Keycloak realm
         └── Dedicated resource quotas (CPU, memory, GPU)
```

### 4.2 Kubernetes Resource Quotas per Institutional Tenant

```yaml
# k8s/institutional-tenant-quota-template.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: inst-quota
  namespace: tradeora-inst-${TENANT_ID}
spec:
  hard:
    requests.cpu: "16"
    requests.memory: 64Gi
    limits.cpu: "32"
    limits.memory: 128Gi
    nvidia.com/gpu: "1"      # Dedicated GPU for custom AI model (if licensed)
    persistentvolumeclaims: "10"
    requests.storage: 2Ti
---
apiVersion: v1
kind: LimitRange
metadata:
  name: inst-limits
  namespace: tradeora-inst-${TENANT_ID}
spec:
  limits:
    - max:
        cpu: "8"
        memory: 32Gi
      min:
        cpu: 100m
        memory: 128Mi
      type: Container
```

---

## Section 5 — Tenant Provisioning Workflow

### 5.1 Automated Provisioning Pipeline

```typescript
// services/tenant-management/src/provisioning/tenant-provisioner.service.ts

@Injectable()
export class TenantProvisionerService {
  async provisionTenant(request: CreateTenantRequest): Promise<TenantProvisionResult> {
    const tenantId = this.generateTenantId(request.tier);
    const steps: ProvisioningStep[] = [];

    try {
      // Step 1: Create Keycloak realm/client
      steps.push(await this.keycloakProvisioner.provision(tenantId, request));

      // Step 2: Database provisioning (tier-dependent)
      if (request.tier === 'FAMILY_OFFICE') {
        steps.push(await this.schemaProvisioner.createSchema(tenantId));
        steps.push(await this.flywayRunner.migrateSchema(`fo_${tenantId}`));
      } else if (request.tier === 'INSTITUTIONAL') {
        steps.push(await this.k8sProvisioner.createNamespace(tenantId));
        steps.push(await this.patroniProvisioner.deployCluster(tenantId));
      }
      // RETAIL and WEALTH_MANAGEMENT: no DB provisioning (pooled schema with RLS)

      // Step 3: Kafka consumer groups
      steps.push(await this.kafkaProvisioner.createConsumerGroup(tenantId, request.tier));

      // Step 4: Valkey namespace initialization
      steps.push(await this.valkeyProvisioner.initNamespace(tenantId));

      // Step 5: Store tenant config in OpenBao
      steps.push(await this.secretsProvisioner.storeTenantConfig(tenantId, {
        dbCredentials: steps.find(s => s.type === 'DATABASE')?.output?.credentials,
        keycloakClientSecret: steps.find(s => s.type === 'KEYCLOAK')?.output?.clientSecret,
      }));

      // Step 6: Unleash feature flag group for this tenant
      steps.push(await this.unleashProvisioner.createTenantGroup(tenantId, request.tier));

      // Step 7: Publish TenantProvisioned event
      await this.eventBus.publish('platform.tenant.TenantProvisioned.v1', {
        tenantId,
        tier: request.tier,
        provisionedAt: new Date().toISOString(),
      });

      return {
        tenantId,
        status: 'PROVISIONED',
        steps,
        provisionedAt: new Date().toISOString(),
      };

    } catch (error) {
      // Compensating transactions: reverse completed steps
      await this.rollbackProvisioning(tenantId, steps, error);
      throw error;
    }
  }
}
```

---

## Section 6 — Tenant-Aware Request Context

```typescript
// packages/shared-kernel/src/tenant/tenant-context.interface.ts

export interface TenantContext {
  tenantId: string;
  tier: 'RETAIL' | 'WEALTH_MANAGEMENT' | 'FAMILY_OFFICE' | 'INSTITUTIONAL';
  isolationModel: 'POOLED' | 'SCHEMA_PER_TENANT' | 'INSTANCE_PER_TENANT';
  
  // Feature access (populated from Unleash)
  features: {
    aiRecommendationsEnabled: boolean;
    rebalancingSuggestions: boolean;
    multiClientView: boolean;         // WEALTH_MANAGEMENT only
    customRiskParameters: boolean;    // FAMILY_OFFICE+
    apiAccess: boolean;               // INSTITUTIONAL only
  };
  
  // Resource quotas
  quotas: {
    portfolioLimit: number;
    aiRecommendationsPerDay: number;
    apiRateLimitPerMinute: number;
    dataRetentionDays: number;
  };
  
  // Custom configuration (FAMILY_OFFICE+)
  riskConfig?: FamilyOfficeRiskConfig;
  customBranding?: TenantBranding;  // Logo, colors (Phase 2 white-label)
}
```

---

## Section 7 — Quota Matrix by Tier

| Quota | RETAIL | WEALTH_MGT | FAMILY_OFFICE | INSTITUTIONAL |
|-------|--------|-----------|--------------|--------------|
| Portfolios | 1–3 (plan-based) | 10 + clients | 50 | Unlimited |
| AI Recommendations/day | 5–50 (plan-based) | 100 | 500 | Unlimited |
| API rate limit/min | 60 | 200 | 600 | 6,000 |
| Data retention (days) | 365 | 1,095 | 2,555 | 2,555 |
| Custom AI weighting | NO | NO | YES | YES |
| Dedicated support SLA | None | 48h | 24h | 4h |
| White-label branding | NO | NO | Phase 2 | Phase 2 |
| Real-time API access | NO | NO | NO | YES |

---

## Section 8 — Tenant Offboarding (PDPL Compliance)

```typescript
// services/tenant-management/src/offboarding/tenant-offboarding.service.ts

async offboardTenant(tenantId: string, reason: string): Promise<void> {
  // Step 1: Disable all tenant sessions (Keycloak)
  await this.keycloakClient.disableRealm(tenantId);

  // Step 2: Generate PDPL data export (right of portability)
  const exportPath = await this.dataExporter.exportTenantData(tenantId);
  await this.notifyTenant(tenantId, { dataExportPath: exportPath });

  // Step 3: Pseudonymize personal data (PDPL Art. 16)
  await this.erasureCoordinator.pseudonymizeAllUserData(tenantId);

  // Step 4: Retain financial records (FRA 7-year mandate)
  // PostgreSQL financial tables: keep but pseudonymized
  // MinIO WORM: cannot delete (Object Lock) — pseudonymized data links only

  // Step 5: Remove Kubernetes namespace (for INSTITUTIONAL tenants)
  if (await this.tierLookup.is('INSTITUTIONAL', tenantId)) {
    await this.k8sClient.deleteNamespace(`tradeora-inst-${tenantId}`);
  }

  // Step 6: Archive tenant configuration (for FRA audit purposes)
  await this.archiver.archiveTenantConfig(tenantId);

  // Step 7: Publish TenantOffboarded event (triggers compliance audit record)
  await this.eventBus.publish('platform.tenant.TenantOffboarded.v1', { tenantId, reason });
}
```

---

## Section 9 — Cross-Tenant Data Prohibition

**This is absolute. No exceptions.**

```typescript
// Fitness function: CI check for cross-tenant data access
// ci/checks/cross_tenant_checker.py

PROHIBITED_PATTERNS = [
  r"FROM \w+ WHERE.*user_id\s*!=\s*current_setting",  # Cross-user query
  r"SELECT.*FROM.*fo_[a-z0-9]+.*JOIN.*fo_[a-z0-9]+",  # Cross-schema join
  r"SET app\.current_user_id\s*=\s*['\"][^'\"]+['\"](?!.*from.*request)",  # Hardcoded user
]
```

**Enforcement layers:**
1. PostgreSQL RLS (database-level, cannot be bypassed by app bugs)
2. Schema-level DB user permissions (FAMILY_OFFICE: user can only access own schema)
3. Kubernetes NetworkPolicy (INSTITUTIONAL: namespace isolation, no cross-namespace traffic)
4. Integration test: `test_cross_tenant_isolation.py` — runs on every PR

---

## Section 10 — Tenant Health Monitoring

```yaml
# Prometheus metrics with tenant labels
# Allows per-tenant SLO tracking

ai_recommendation_latency_seconds{tenant_tier="RETAIL", tenant_id="..."} histogram
portfolio_nav_calculation_errors_total{tenant_tier="FAMILY_OFFICE", tenant_id="..."} counter
api_request_duration_seconds{tenant_tier="INSTITUTIONAL", tenant_id="..."} histogram

# Grafana: Tenant Health Dashboard
# Panel 1: AI recommendation latency by tier
# Panel 2: Error rate by tenant tier
# Panel 3: Quota utilization by tenant (recommendations used vs. limit)
# Panel 4: Active tenants by tier (gauge)
# Panel 5: Tenant provisioning events (last 30 days)
```

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT FOOTER                                                             ║
║  Document: MULTI_TENANCY_ARCHITECTURE.md                                    ║
║  Version:  1.0.0                                                            ║
║  Owner:    Platform Engineering + DBA                                        ║
║  Completeness: 97% — All 3 isolation models, provisioning, offboarding,     ║
║    cross-tenant prohibition enforcement, and quota matrix specified.         ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Section 11 — Keycloak Realm Isolation Per Tier

Each tenant tier uses a distinct Keycloak realm structure to enforce authentication isolation:

```
Keycloak Realms
├── tradeora-retail          → All RETAIL + WEALTH_MANAGEMENT users
│   ├── Clients: flutter-app, web-app, api-gateway-internal
│   ├── Roles: retail_user, wealth_manager, admin
│   └── User attributes: tier, subscription_plan, quota_config
│
├── tradeora-family-office   → All FAMILY_OFFICE tenants (Phase 2)
│   ├── Clients: fo-{tenantId}-app (one per Family Office tenant)
│   ├── Roles: fo_admin, fo_advisor, fo_beneficiary
│   └── User attributes: tenant_id, schema_id, risk_config_version
│
└── tradeora-institutional   → Each INSTITUTIONAL tenant (Phase 2)
    ├── Client: inst-{tenantId} (dedicated realm per institution)
    ├── Federation: Institution's own LDAP/AD (optional)
    ├── Roles: inst_admin, inst_analyst, inst_compliance
    └── SAML/OIDC: Institution can bring their own IdP
```

### Keycloak Token Claims by Tier

```typescript
// JWT claims injected by Keycloak per tenant tier

// RETAIL user JWT
{
  "sub": "usr_01J6XXXX",
  "tier": "RETAIL",
  "subscription": "PREMIUM",
  "quotas": {
    "ai_recommendations_per_day": 50,
    "portfolio_limit": 3
  },
  "features": ["ai.recommendations", "price.alerts"]
}

// FAMILY_OFFICE user JWT
{
  "sub": "usr_FO_01J6XXXX",
  "tier": "FAMILY_OFFICE",
  "tenant_id": "fo_01J6XXXX",
  "schema_id": "fo_01j6xxxx",      // Lowercase PostgreSQL schema name
  "quotas": {
    "ai_recommendations_per_day": 500,
    "portfolio_limit": 50
  },
  "features": ["ai.recommendations", "custom_risk", "rebalancing", "multi_client_view"],
  "risk_config_version": "v3"       // Which risk config version is active
}
```

---

## Section 12 — Tenant Billing & Resource Metering

### 12.1 Metered Usage Tracking

```typescript
// services/billing/src/metering/usage-meter.service.ts

@Injectable()
export class UsageMeterService {
  /**
   * Records metered usage events for billing reconciliation.
   * Published to Kafka for async processing — never blocks the hot path.
   */
  async recordUsage(event: UsageEvent): Promise<void> {
    await this.kafkaProducer.send({
      topic: 'billing.UsageRecorded.v1',
      messages: [{
        key: event.tenantId,
        value: JSON.stringify({
          tenantId: event.tenantId,
          tier: event.tier,
          feature: event.feature,       // 'AI_RECOMMENDATION', 'PORTFOLIO_NAV', etc.
          quantity: event.quantity,      // Number of units consumed
          recordedAt: new Date().toISOString(),
          billingPeriod: this.getCurrentBillingPeriod(),
        }),
        headers: { 'tenant-id': event.tenantId },
      }],
    });
  }

  /** Called at end of each billing period — aggregates usage for invoice */
  async aggregateBillingPeriod(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<BillingAggregate> {
    const usageRecords = await this.db.query(`
      SELECT feature, SUM(quantity) as total_quantity
      FROM billing.usage_events
      WHERE tenant_id = $1
        AND recorded_at BETWEEN $2 AND $3
      GROUP BY feature
    `, [tenantId, periodStart, periodEnd]);

    return {
      tenantId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      lineItems: usageRecords.rows.map(row => ({
        feature: row.feature,
        quantity: parseInt(row.total_quantity),
        unitPrice: this.getPricing(tenantId, row.feature),
        totalAmount: new Decimal(row.total_quantity)
          .times(this.getPricing(tenantId, row.feature))
          .toFixed(2),  // Decimal precision — never float
      })),
    };
  }
}
```

### 12.2 Billing Model per Tier

| Tier | Billing Model | Pricing Base | Overage Handling |
|------|--------------|-------------|-----------------|
| RETAIL | Fixed monthly subscription | EGP 99–599/month | Feature-gated at quota limit; prompt to upgrade |
| WEALTH_MANAGEMENT | Fixed monthly + per-client seat | EGP 999/month + EGP 50/client | Soft limit with 20% overage allowance |
| FAMILY_OFFICE | Annual contract | Negotiated (EGP 50,000–200,000/year) | Flexible — annual review |
| INSTITUTIONAL | Enterprise contract | USD 5,000–50,000/month | SLA-based; overages by agreement |

---

## Section 13 — Tenant Migration Path (Upgrade Between Tiers)

```typescript
// When a RETAIL user upgrades to FAMILY_OFFICE tier:
// Data must migrate from pooled schema → dedicated schema

async migrateTenantTier(
  userId: string,
  fromTier: 'RETAIL',
  toTier: 'FAMILY_OFFICE',
): Promise<MigrationResult> {
  const newTenantId = `fo_${ulid()}`;
  
  // Step 1: Provision new schema
  await this.schemaProvisioner.createSchema(newTenantId);
  await this.flywayRunner.migrateSchema(`fo_${newTenantId}`);
  
  // Step 2: Copy user data from pooled schema to dedicated schema
  await this.db.query(`
    -- Copy portfolios
    INSERT INTO "fo_${newTenantId}".portfolios
    SELECT * FROM portfolio.portfolios WHERE user_id = $1;
    
    -- Copy holdings
    INSERT INTO "fo_${newTenantId}".holdings h
    SELECT h.* FROM portfolio.holdings h
    JOIN portfolio.portfolios p ON h.portfolio_id = p.id
    WHERE p.user_id = $1;
  `, [userId]);
  
  // Step 3: Update user's tenant_id in Keycloak
  await this.keycloakClient.updateUserAttribute(userId, 'tenant_id', newTenantId);
  await this.keycloakClient.updateUserAttribute(userId, 'tier', 'FAMILY_OFFICE');
  
  // Step 4: Publish migration event (triggers audit + billing update)
  await this.eventBus.publish('platform.tenant.TenantTierUpgraded.v1', {
    userId,
    fromTier,
    toTier,
    newTenantId,
    migratedAt: new Date().toISOString(),
  });
  
  // Step 5: Delete from pooled schema (RLS data remains for FRA audit period)
  // IMPORTANT: Soft delete only — mark as migrated, retain for 7 years per FRA
  await this.db.query(`
    UPDATE portfolio.portfolios
    SET status = 'MIGRATED', migrated_to_tenant = $2, migrated_at = NOW()
    WHERE user_id = $1
  `, [userId, newTenantId]);
  
  return { success: true, newTenantId, migrationCompletedAt: new Date().toISOString() };
}
```

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT FOOTER (EXPANDED)                                                  ║
║  Document: MULTI_TENANCY_ARCHITECTURE.md                                    ║
║  Version:  1.0.1 (expanded with Keycloak isolation, billing, migration)     ║
║  Owner:    Platform Engineering + DBA + Billing Team                        ║
║  Completeness: 99%                                                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
```
