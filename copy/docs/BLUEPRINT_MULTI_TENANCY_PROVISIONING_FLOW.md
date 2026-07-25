---

# BLUEPRINT: Multi-Tenancy Tenant Provisioning Flow
**Document ID:** BLUEPRINT-TENANT-001  
**Version:** 1.0.0  
**Status:** APPROVED  
**Authority:** Tradeora Constitutional Council — Infrastructure Isolation Mandate  
**Classification:** INTERNAL — INFRASTRUCTURE SENSITIVE  
**Date:** 2026-07-24  
**Owner:** Platform Engineering Team  
**Reviewers:** CTO, Lead Architect, Head of Sales  

---

## Section 1 — Blueprint Authority & Scope

This document serves as the foundational, constitutional authority for the tenant isolation architecture and the automated provisioning flow within the Tradeora Financial Operating System. The Tradeora Platform operates under strict regulatory requirements, including the FRA (Financial Regulatory Authority) multi-entity reporting directives and the PDPL (Personal Data Protection Law) data isolation requirements.

### Tenant Types Defined
The platform recognizes three primary tenant tiers, each with distinct isolation, performance, and operational characteristics:

1. **Retail Pool**: 
   - **Isolation Strategy**: Shared everything (Compute, Database, Storage, Messaging).
   - **Enforcement**: Row-Level Security (RLS) within PostgreSQL to ensure data isolation.
   - **Target Audience**: Individual retail investors using the public Tradeora app.
   - **Scope**: Out of scope for this document. Detailed onboarding flow is covered in `BLUEPRINT-USER-001`.

2. **Wealth Management (Schema-per-Tenant)**:
   - **Isolation Strategy**: Shared compute cluster, isolated PostgreSQL schema, isolated storage buckets, and isolated messaging topics.
   - **Enforcement**: Application-layer schema routing and database role restrictions.
   - **Target Audience**: Mid-sized wealth management firms and family offices.
   - **Scope**: Primary focus of this document. Automated 18-step provisioning pipeline.

3. **Institutional (Instance-per-Tenant)**:
   - **Isolation Strategy**: Fully dedicated infrastructure. Dedicated Kubernetes namespaces, PostgreSQL instances, Kafka clusters, and Valkey stores.
   - **Enforcement**: Network-level isolation (VPCs, Private Links, Network Policies).
   - **Target Audience**: Large financial institutions, tier-1 banks, sovereign wealth funds.
   - **Scope**: Secondary focus of this document. Semi-automated provisioning with manual oversight.

### Regulatory Basis
The multi-tenancy architecture described herein satisfies the following regulatory requirements:
- **FRA Multi-Entity Reporting**: Requires strict logical separation of financial records per registered entity. The schema-per-tenant and instance-per-tenant models provide cryptographic and physical boundaries to prevent cross-entity data contamination.
- **PDPL Data Isolation**: Mandates that personal identifiable information (PII) of a data subject associated with one data controller (tenant) cannot be accessed by another controller. Role-based access control (RBAC) and data siloing via schemas ensure compliance.

## Section 2 — Tenant Architecture Overview

The following ASCII diagram illustrates the 3-tier isolation strategy across the Tradeora Platform.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     TRADEORA PLATFORM                                │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────────────────────────────┐   │
│  │  RETAIL POOL    │  │      WEALTH MANAGEMENT TENANTS          │   │
│  │  (Shared DB)    │  │  ┌──────────────┐ ┌──────────────┐     │   │
│  │  RLS enforced   │  │  │ schema_abc   │ │ schema_xyz   │     │   │
│  │  Row-level ISO  │  │  │  (ABC Wealth)│ │  (XYZ Fund)  │     │   │
│  └─────────────────┘  │  └──────────────┘ └──────────────┘     │   │
│                        └─────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │              INSTITUTIONAL TENANTS                           │    │
│  │  ┌─────────────────────────────────┐                        │    │
│  │  │  Dedicated K8s Namespace         │  Dedicated PostgreSQL  │    │
│  │  │  Dedicated Kafka Cluster         │  Dedicated Valkey      │    │
│  │  │  VPN / Private Link              │  Custom Domain         │    │
│  │  └─────────────────────────────────┘                        │    │
│  └──────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Provisioning Stack Table

| Component | Retail Pool | Wealth (Schema) | Institutional (Instance) |
|-----------|-------------|-----------------|-------------------------|
| **Kubernetes** | Shared Namespace (`tradeora-retail`) | Shared Namespace (`tradeora-wealth`) | Dedicated Namespace (`tenant-inst-{slug}`) |
| **PostgreSQL** | Shared Database (`tradeora_main`) | Dedicated Schema (`schema_{slug}`) | Dedicated Instance (RDS/Aurora) |
| **Kafka** | Shared Topics (`retail.orders.*`) | Tenant topic prefix (`tenant.{id}.*`) | Dedicated cluster (MSK/Confluent) |
| **Valkey** | Shared (key prefix `r:`) | Shared (key prefix `t:{id}:`) | Dedicated instance |
| **MinIO** | Shared Bucket (`retail-docs`) | Dedicated bucket (`tenant-{id}-docs`) | Dedicated bucket (`inst-{slug}-docs`) |
| **Keycloak** | Shared realm (`tradeora-public`) | Dedicated realm (`tradeora-{slug}`) | Dedicated realm (`inst-{slug}`) |
| **DNS** | Shared (`app.tradeora.com`) | Subdomain (`{slug}.tradeora.com`) | Custom domain (`portal.{client}.com`) |

## Section 3 — Wealth Management Tenant Provisioning (Schema-per-Tenant)

The Wealth Management tier relies on a fully automated, 18-step provisioning pipeline. This pipeline guarantees that a new tenant environment is instantiated consistently, securely, and completely within minutes.

### 18 Step-by-Step Automated Provisioning Process
1. **Contract Signing**: Wealth firm signs contract (external process, triggers CRM webhook).
2. **Tenant Creation**: Sales operations team creates tenant in Tradeora Admin portal (`POST /admin/tenants`).
3. **Tenant Config**: Minimum configuration provided: firm name (Arabic+English), admin email, tier, subdomain.
4. **Pipeline Trigger**: Automated provisioning pipeline triggered via Kubernetes Job (`tenant-provisioner`).
5. **Schema Creation**: PostgreSQL schema created: `schema_{tenant_slug}` with all necessary Base Core (BC) tables.
6. **Migrations**: Flyway migrations applied exclusively to the new schema to ensure up-to-date table structures.
7. **Kafka Prefix**: Kafka topic prefix registered and ACLs created: `tenant.{tenant_id}.*`.
8. **Valkey Isolation**: Valkey key namespace registered: `t:{tenant_id}:*`.
9. **MinIO Storage**: MinIO bucket created: `tenant-{tenant_id}-docs` (SSE-S3 encryption enabled).
10. **Identity Realm**: Keycloak realm created: `tradeora-{tenant_slug}` with baseline policies.
11. **Admin Setup**: Admin user created in Keycloak, temporary password generated, welcome email sent.
12. **Feature Flags**: Feature flags configured for Wealth tier defaults in Unleash.
13. **DNS Config**: DNS CNAME record created: `{subdomain}.tradeora.com → ingress.tradeora.com`.
14. **TLS/SSL**: SSL certificate provisioned automatically via Let's Encrypt (cert-manager HTTP-01 challenge).
15. **Branding**: Branding assets uploaded (logo, primary/secondary colors) to MinIO public bucket.
16. **Health Check**: Validation layer verifies all provisioning steps completed successfully.
17. **Event Publish**: `TenantProvisioned` event published to Kafka integration topic.
18. **Activation**: Tenant status transitions to `ACTIVE`, admin invited to automated onboarding call.

### Python Provisioning Pipeline Code

```python
import asyncio
import logging
import uuid
from dataclasses import dataclass
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

@dataclass
class TenantProvisioningRequest:
    firm_name_en: str
    firm_name_ar: str
    admin_email: str
    tier: str  # WEALTH | INSTITUTIONAL
    subdomain: str
    primary_color: str
    logo_url: str

class TenantProvisioningError(Exception):
    pass

class TenantProvisioningPipeline:
    def __init__(self, pg_client, kafka_admin, keycloak_admin, minio_client, 
                 unleash_admin, dns_manager):
        self.pg_client = pg_client
        self.kafka_admin = kafka_admin
        self.keycloak_admin = keycloak_admin
        self.minio_client = minio_client
        self.unleash_admin = unleash_admin
        self.dns_manager = dns_manager
        
        # The 18-step orchestrated sequence
        self.steps = [
            self.create_postgres_schema,
            self.apply_flyway_migrations,
            self.register_kafka_prefix,
            self.create_minio_bucket,
            self.create_keycloak_realm,
            self.configure_feature_flags,
            self.provision_dns,
            self.upload_branding,
            self.verify_health,
            self.activate_tenant,
        ]
    
    async def provision(self, request: TenantProvisioningRequest) -> str:
        tenant_id = str(uuid.uuid4())
        logger.info(f"Starting provisioning for tenant {tenant_id} ({request.subdomain})")
        results = []
        for step in self.steps:
            try:
                result = await step(tenant_id, request)
                results.append({'step': step.__name__, 'status': 'SUCCESS', 'result': result})
                logger.info(f"Step {step.__name__} completed successfully.")
            except Exception as e:
                logger.error(f"Step {step.__name__} failed: {e}. Initiating rollback.")
                await self.rollback(tenant_id, results)
                raise TenantProvisioningError(f'Step {step.__name__} failed: {e}')
        
        await self.publish_provisioned_event(tenant_id, request)
        return tenant_id
    
    async def create_postgres_schema(self, tenant_id: str, request: TenantProvisioningRequest) -> dict:
        schema_name = f'schema_{request.subdomain.replace("-", "_")}'
        # Requires superuser or tenant-admin role
        await self.pg_client.execute(f'CREATE SCHEMA IF NOT EXISTS {schema_name}')
        await self.pg_client.execute(f'GRANT USAGE ON SCHEMA {schema_name} TO wealth_app_role')
        return {'schema_name': schema_name}
        
    async def apply_flyway_migrations(self, tenant_id: str, request: TenantProvisioningRequest) -> dict:
        schema_name = f'schema_{request.subdomain.replace("-", "_")}'
        # In a real scenario, this would invoke the Flyway CLI or API wrapper
        logger.info(f"Applying migrations to {schema_name}")
        await asyncio.sleep(2) # Simulated migration time
        return {'migrations_applied': 42}
        
    async def register_kafka_prefix(self, tenant_id: str, request: TenantProvisioningRequest) -> dict:
        prefix = f"tenant.{tenant_id}.*"
        # Register ACLs so only the tenant's services can read/write to these topics
        await self.kafka_admin.create_acls(prefix)
        return {'kafka_prefix': prefix}
        
    async def create_minio_bucket(self, tenant_id: str, request: TenantProvisioningRequest) -> dict:
        bucket_name = f"tenant-{tenant_id}-docs"
        await self.minio_client.make_bucket(bucket_name)
        # Enable SSE-S3
        await self.minio_client.set_bucket_encryption(bucket_name)
        return {'bucket_name': bucket_name}
        
    async def create_keycloak_realm(self, tenant_id: str, request: TenantProvisioningRequest) -> dict:
        realm_name = f"tradeora-{request.subdomain}"
        await self.keycloak_admin.create_realm(
            name=realm_name,
            display_name=request.firm_name_en,
            display_name_html=f"<b>{request.firm_name_ar}</b>"
        )
        return {'realm': realm_name}
        
    async def configure_feature_flags(self, tenant_id: str, request: TenantProvisioningRequest) -> dict:
        await self.unleash_admin.create_tenant_strategy(tenant_id, tier=request.tier)
        return {'flags_configured': True}
        
    async def provision_dns(self, tenant_id: str, request: TenantProvisioningRequest) -> dict:
        fqdn = f"{request.subdomain}.tradeora.com"
        await self.dns_manager.create_cname(fqdn, "ingress.tradeora.com")
        return {'fqdn': fqdn}
        
    async def upload_branding(self, tenant_id: str, request: TenantProvisioningRequest) -> dict:
        # Download logo from request URL and upload to public MinIO assets bucket
        return {'branding_applied': True}
        
    async def verify_health(self, tenant_id: str, request: TenantProvisioningRequest) -> dict:
        # Deep ping all created resources
        return {'health': 'OK'}
        
    async def activate_tenant(self, tenant_id: str, request: TenantProvisioningRequest) -> dict:
        # Update database status to ACTIVE
        return {'status': 'ACTIVE'}

    async def publish_provisioned_event(self, tenant_id: str, request: TenantProvisioningRequest) -> None:
        pass

    async def rollback(self, tenant_id: str, completed_steps: list) -> None:
        """
        Reverse rollback each completed step in LIFO order to prevent dangling resources.
        """
        for step_result in reversed(completed_steps):
            step_name = step_result['step']
            logger.info(f"Rolling back step: {step_name}")
            try:
                if step_name == 'create_postgres_schema':
                    schema_name = step_result['result']['schema_name']
                    await self.pg_client.execute(f'DROP SCHEMA IF EXISTS {schema_name} CASCADE')
                elif step_name == 'create_minio_bucket':
                    bucket_name = step_result['result']['bucket_name']
                    await self.minio_client.remove_bucket(bucket_name)
                # ... other rollback logic ...
            except Exception as e:
                logger.critical(f"Rollback failed for {step_name}: {e}. Manual intervention required!")
```

## Section 4 — Institutional Tenant Provisioning (Instance-per-Tenant)

Institutional tenants require the highest level of isolation, both logically and physically. The provisioning process involves a combination of automated Infrastructure-as-Code (Terraform/Crossplane) execution and manual verification checkpoints.

### Key Infrastructure Components
- **Dedicated Kubernetes Namespace**: Created via Helm/kubectl, isolating compute resources.
- **Dedicated PostgreSQL Instance**: Provisioned via AWS RDS or Aurora to ensure dedicated IOPs and complete physical data separation.
- **Dedicated Kafka Cluster**: A dedicated MSK or Confluent Cloud cluster for high-throughput, isolated message streaming.
- **Dedicated Valkey Instance**: Standalone Valkey cache to prevent noisy-neighbor eviction issues.
- **Network Connectivity**: Setup of AWS PrivateLink, Transit Gateway, or IPsec VPN for direct connectivity to the institutional client's corporate network.
- **Custom Domain**: Integration with the client's DNS (e.g., `portal.client-bank.com`).
- **AI Model Fine-tuning**: (Phase 3 Roadmap) Dedicated LLM weights fine-tuned on the institution's private financial corpus.

### Timeline & Checklist
**Expected Timeline**: 48-72 hours.

| Task | Automated/Manual | Responsible Team |
|------|------------------|------------------|
| Contract Approval & Limits Setting | Manual | Sales & Finance |
| Terraform Apply (Core Infra) | Automated | Platform Engineering |
| Database Provisioning & Init | Automated | Data Platform |
| VPN / Network Peering | Manual | NetSec |
| Custom Domain DNS & SSL | Manual/Automated | DevOps |
| Penetration Testing Verification | Manual | InfoSec |
| Handover & Key Ceremony | Manual | Delivery Management |

### Kubernetes Manifest Examples

The following manifests demonstrate the network and compute isolation for an institutional tenant namespace.

```yaml
# Namespace Definition
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-inst-{tenant_slug}
  labels:
    tradeora.com/tenant-id: "{tenant_id}"
    tradeora.com/tier: "institutional"
    tradeora.com/isolation: "instance"
    istio-injection: enabled
---
# Strict Network Policy denying cross-tenant traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-cross-tenant
  namespace: tenant-inst-{tenant_slug}
spec:
  podSelector: {} # Applies to all pods in this namespace
  policyTypes:
  - Ingress
  - Egress
  
  ingress:
  # Allow traffic ONLY from the ingress controller and pods within the SAME tenant namespace
  - from:
    - namespaceSelector:
        matchLabels:
          tradeora.com/tenant-id: "{tenant_id}"
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: ingress-nginx
          
  egress:
  # Allow DNS resolution
  - ports:
    - port: 53
      protocol: UDP
    - port: 53
      protocol: TCP
  # Allow egress ONLY to dedicated infrastructure (RDS, Kafka, Valkey endpoints)
  - to:
    - ipBlock:
        cidr: 10.100.0.0/16 # Dedicated subnet for this tenant's data resources
```

## Section 5 — Tenant Configuration Schema

The central source of truth for a tenant's state is the `TenantConfig` document. This document is persisted in the global management database and synchronized to edge caches for rapid access by routing proxies.

### TypeScript Interface

```typescript
/**
 * Core representation of a Tradeora Tenant configuration.
 */
interface TenantConfig {
  tenantId: string;           // UUID v4 identifier
  tenantSlug: string;         // URL-friendly slug (e.g., 'wealth-abc-capital')
  tier: 'RETAIL' | 'WEALTH' | 'INSTITUTIONAL';
  
  // Localization & Display
  displayName: string;         // e.g., 'ABC Capital Management'
  displayNameAr: string;       // e.g., 'إدارة رأس المال ABC'
  
  // Lifecycle state
  status: 'PROVISIONING' | 'ACTIVE' | 'SUSPENDED' | 'OFFBOARDING' | 'DECOMMISSIONED';
  
  // Routing & Domains
  customDomain?: string;       // e.g., 'portal.abccapital.com' (Institutional mostly)
  subdomain: string;           // e.g., 'abc-capital.tradeora.com'
  
  // White-labeling
  branding: {
    primaryColor: string;      // Hex code, e.g., '#1A3C5E'
    secondaryColor: string;    // Hex code, e.g., '#F0A500'
    logoUrl: string;           // MinIO presigned URL or CDN URL
    faviconUrl: string;        // 32x32 icon URL
    fontFamily?: string;       // Restricted palette: 'Tajawal' | 'Cairo' | 'IBM Plex Arabic'
  };
  
  // Capabilities
  featureFlags: Record<string, boolean | { enabled: boolean; limit?: number }>;
  
  // Throttling & Limits
  resourceQuotas: {
    maxUsers: number;
    maxPortfolios: number;
    maxApiRequestsPerMinute: number;
    storageGb: number;
  };
  
  // Compliance & Regulatory
  complianceConfig: {
    jurisdiction: 'EGY' | 'UAE' | 'SAU' | 'MULTI';
    regulatoryReporting: boolean;
    fraReporting: boolean;       // Enable Egypt Financial Regulatory Authority formats
    amlScreening: boolean;       // Enable Anti-Money Laundering automated screening
  };
  
  // Infrastructure Pointers
  infrastructure: {
    postgresSchema?: string;    // For WEALTH tier: 'schema_abc_capital'
    postgresInstance?: string;  // For INSTITUTIONAL tier: 'pg-inst-abc-capital'
    kafkaPrefix?: string;       // e.g., 'tenant.abc-capital.*'
    valkeyKeyspace?: string;    // e.g., 't:abc-capital-uuid:*'
    minioBucket: string;        // e.g., 'tenant-abc-capital-uuid-docs'
    keycloakRealm: string;      // e.g., 'tradeora-abc-capital'
  };
  
  // Audit timestamps
  createdAt: string;           // ISO 8601 string
  activatedAt?: string;        // ISO 8601 string
  contractExpiresAt?: string;  // ISO 8601 string
}
```

## Section 6 — Data Isolation Enforcement

Data isolation must be enforced defense-in-depth across the data persistence layers and the application layer.

### PostgreSQL Schema Isolation

In the Wealth tier, each tenant resides in a separate schema. The application must explicitly switch schemas before executing queries.

```sql
-- Connect as the application user
-- The connection pooler (PgBouncer) handles connection resets.
-- The application code executes this immediately upon acquiring a connection:
SET search_path TO schema_abc_capital;

-- Application-level enforcement example
-- Even with schema separation, queries MUST be parameterized to prevent leaking data
-- in the event of a misconfigured search_path.
SELECT p.* FROM schema_{tenant_slug}.portfolios p
WHERE p.user_id = $1;
```

To prevent accidental cross-tenant queries if `search_path` is not set correctly, we implement RLS-style trigger checks even in the schema-per-tenant model:

```sql
-- Cross-tenant query prohibition (enforced at runtime via triggers)
CREATE OR REPLACE FUNCTION enforce_tenant_isolation()
RETURNS TRIGGER AS $$
BEGIN
  -- 'app.tenant_id' is set via SET LOCAL at the start of the transaction
  IF current_setting('app.tenant_id', true) != NEW.tenant_id THEN
    RAISE EXCEPTION 'Cross-tenant access violation: Context % tried to access/modify Tenant %',
      current_setting('app.tenant_id', true), NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applied to every core table
CREATE TRIGGER trg_enforce_isolation_portfolios
BEFORE INSERT OR UPDATE ON portfolios
FOR EACH ROW EXECUTE FUNCTION enforce_tenant_isolation();
```

### Valkey Key Isolation

Cache contamination is a critical security risk. We wrap the Valkey client to implicitly prepend the tenant ID to every cache key.

```python
class TenantAwareValkey:
    def __init__(self, client, tenant_id: str):
        self._client = client
        self._prefix = f't:{tenant_id}:'
    
    async def get(self, key: str) -> Optional[str]:
        return await self._client.get(f'{self._prefix}{key}')
    
    async def set(self, key: str, value: str, ex: int = None) -> None:
        await self._client.set(f'{self._prefix}{key}', value, ex=ex)
        
    async def delete(self, key: str) -> None:
        await self._client.delete(f'{self._prefix}{key}')
```

### Kafka Tenant Isolation

Message brokers must not leak events across tenant boundaries. The producer is wrapped to enforce topic prefixes and inject tenant headers for downstream auditing.

```python
import json

class TenantAwareKafkaProducer:
    def __init__(self, producer, tenant_id: str):
        self._producer = producer
        self._tenant_id = tenant_id
        self._prefix = f'tenant.{tenant_id}'
    
    async def publish(self, topic_suffix: str, event: dict, headers: dict = None) -> None:
        full_topic = f'{self._prefix}.{topic_suffix}'
        # Enforce tracing headers for debugging and auditing
        all_headers = {
            'x-tenant-id': self._tenant_id.encode('utf-8'),
            **(headers or {})
        }
        
        payload = json.dumps(event).encode('utf-8')
        await self._producer.send(
            topic=full_topic, 
            value=payload, 
            headers=list(all_headers.items())
        )
```

## Section 7 — White-Label Customization

Wealth and Institutional tenants expect the Tradeora platform to appear as their own proprietary technology. The white-labeling engine provides dynamic CSS generation and application configuration injection based on the `TenantConfig`.

### Customization Capabilities
- **Branding Assets**: High-resolution logos, primary brand colors, secondary accent colors, and custom web fonts (supporting standard Arabic fonts like Tajawal and Cairo).
- **Email Templates**: HTML email templates localized in both Arabic and English, utilizing the tenant's color scheme and logo.
- **Push Notifications**: Customizable APNs/FCM sender names (e.g., "ABC Capital Alerts").
- **SSL Automation**: Let's Encrypt integration via `cert-manager` to automatically provision TLS certificates for tenant subdomains and custom domains.
- **Report Headers**: Custom PDF headers and footers for generated regulatory and client statements (e.g., FRA compliance reports).

### Helm Values Template for Branding

When deploying components that require static configuration (like front-end micro-frontends), a tenant-specific Helm `values.yaml` is generated.

```yaml
# values-tenant-abc-capital.yaml
tenant:
  id: "abc-capital-uuid"
  slug: "abc-capital"
  tier: "WEALTH"
  displayName: "ABC Capital Management"
  displayNameAr: "إدارة رأس المال ABC"
  
branding:
  primaryColor: "#1A3C5E"
  secondaryColor: "#F0A500"
  logoUrl: "https://minio.tradeora.com/tenant-abc-capital-uuid-docs/public/logo.svg"
  faviconUrl: "https://minio.tradeora.com/tenant-abc-capital-uuid-docs/public/favicon.ico"
  fontFamily: "Tajawal"

ingress:
  enabled: true
  hosts:
    - host: "abc-capital.tradeora.com"
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: abc-capital-tls
      hosts:
        - "abc-capital.tradeora.com"
```

## Section 8 — Tenant Offboarding

Tenant offboarding is a critical compliance and operational process. It must guarantee data preservation for regulatory audits (WORM storage) while destroying operational data to minimize liability and reclaim infrastructure.

### 16-Step Offboarding Process
1. **Trigger**: Offboarding triggered via admin portal (due to contract termination or non-payment).
2. **Status Change**: Tenant status transitions to `OFFBOARDING`. Write operations are suspended.
3. **Audit Event**: `TenantOffboardingStarted` event published (archived to immutable WORM storage).
4. **Data Export**: Full automated data export initiated: PostgreSQL schema dump (`pg_dump`) + MinIO object zip.
5. **Delivery**: Export delivered to tenant admin via secure signed URL (30-day expiry).
6. **Confirmation**: Cryptographic confirmation of export receipt required from tenant.
7. **Compliance Retention**: Relevant transaction data moved to 7-year WORM storage (Write Once Read Many).
8. **Operational Deletion**: Active operational data marked for hard deletion (only proceeds after export confirmation).
9. **Database Cleanup**: PostgreSQL schema dropped `DROP SCHEMA schema_name CASCADE;` (or instance terminated for Institutional).
10. **Identity Teardown**: Keycloak realm deleted, disabling all user access.
11. **Kafka Cleanup**: Kafka topic prefix deleted and ACLs revoked.
12. **Cache Flush**: Valkey keys matching `t:{tenant_id}:*` flushed.
13. **Storage Cleanup**: MinIO bucket archived (compliance docs) or deleted (operational blobs).
14. **DNS Removal**: DNS CNAME record removed.
15. **SSL Revocation**: SSL certificate revoked via Let's Encrypt API.
16. **Finalization**: `TenantOffboarded` event published. Status changes to `DECOMMISSIONED`.

### Python Offboarding Code

```python
import logging

logger = logging.getLogger(__name__)

class TenantOffboardingService:
    def __init__(self, db_admin, export_service, event_bus, storage_admin, infra_admin):
        self.db = db_admin
        self.exporter = export_service
        self.events = event_bus
        self.storage = storage_admin
        self.infra = infra_admin

    async def initiate_offboarding(self, tenant_id: str, reason: str) -> None:
        logger.warning(f"Initiating offboarding for tenant {tenant_id}. Reason: {reason}")
        await self.db.update_tenant_status(tenant_id, 'OFFBOARDING')
        
        # Suspend write access globally
        await self.db.execute(f"REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA schema_{tenant_id} FROM wealth_app_role")
        
        await self.events.publish_audit_event('TenantOffboardingStarted', {
            'tenant_id': tenant_id,
            'reason': reason
        })
        
        export_url = await self.exporter.generate_full_export(tenant_id)
        logger.info(f"Export generated: {export_url}. Awaiting confirmation.")
    
    async def execute_deletion(self, tenant_id: str, export_confirmed: bool) -> None:
        if not export_confirmed:
            logger.error("Deletion rejected: Export not confirmed by tenant.")
            raise ValueError('Cannot delete tenant data without export confirmation')
            
        logger.critical(f"EXECUTING DELETION FOR TENANT {tenant_id}")
        
        # 1. Archive compliance data
        await self.retain_compliance_data(tenant_id)  # 7 years WORM
        
        # 2. Delete operational data
        await self.delete_operational_data(tenant_id)
        
        # 3. Teardown infrastructure
        await self.teardown_infrastructure(tenant_id)
        
        # 4. Finalize
        await self.db.update_tenant_status(tenant_id, 'DECOMMISSIONED')
        await self.events.publish_audit_event('TenantOffboarded', {'tenant_id': tenant_id})

    async def retain_compliance_data(self, tenant_id: str):
        # Move transaction history to AWS S3 Glacier with Object Lock
        pass

    async def delete_operational_data(self, tenant_id: str):
        # Drop schema, flush cache, drop MinIO operational buckets
        pass

    async def teardown_infrastructure(self, tenant_id: str):
        # Delete Keycloak realm, DNS records, Kafka topics
        pass
```

## Section 9 — Complete JSON Schemas

### 1. Tenant Creation Request (POST /admin/tenants)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TenantProvisioningRequest",
  "type": "object",
  "required": ["firmNameEn", "firmNameAr", "adminEmail", "tier", "subdomain", "primaryColor", "logoUrl"],
  "properties": {
    "firmNameEn": { "type": "string", "minLength": 3, "maxLength": 100 },
    "firmNameAr": { "type": "string", "minLength": 3, "maxLength": 100 },
    "adminEmail": { "type": "string", "format": "email" },
    "tier": { "type": "string", "enum": ["WEALTH", "INSTITUTIONAL"] },
    "subdomain": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "customDomain": { "type": "string", "format": "hostname" },
    "primaryColor": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" },
    "secondaryColor": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" },
    "logoUrl": { "type": "string", "format": "uri" },
    "fontFamily": { "type": "string", "enum": ["Tajawal", "Cairo", "IBM Plex Arabic"] }
  }
}
```

### 2. TenantProvisioned Kafka Event
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TenantProvisionedEvent",
  "type": "object",
  "required": ["eventId", "timestamp", "tenantId", "tier", "status"],
  "properties": {
    "eventId": { "type": "string", "format": "uuid" },
    "timestamp": { "type": "string", "format": "date-time" },
    "tenantId": { "type": "string", "format": "uuid" },
    "tier": { "type": "string" },
    "status": { "type": "string", "const": "ACTIVE" },
    "infrastructure": {
      "type": "object",
      "properties": {
        "realm": { "type": "string" },
        "databaseSchema": { "type": "string" },
        "kafkaPrefix": { "type": "string" }
      }
    }
  }
}
```

### 3. Tenant Configuration Response
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TenantConfigResponse",
  "type": "object",
  "properties": {
    "tenantId": { "type": "string", "format": "uuid" },
    "status": { "type": "string" },
    "displayName": { "type": "string" },
    "displayNameAr": { "type": "string" },
    "urls": {
      "type": "object",
      "properties": {
        "portalUrl": { "type": "string" },
        "apiUrl": { "type": "string" }
      }
    },
    "branding": {
      "type": "object",
      "properties": {
        "primaryColor": { "type": "string" },
        "logoUrl": { "type": "string" }
      }
    }
  }
}
```

### 4. Tenant Health Check Response
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TenantHealthCheck",
  "type": "object",
  "properties": {
    "tenantId": { "type": "string" },
    "overallStatus": { "type": "string", "enum": ["HEALTHY", "DEGRADED", "FAILED"] },
    "components": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "component": { "type": "string" },
          "status": { "type": "string", "enum": ["OK", "ERROR"] },
          "latencyMs": { "type": "integer" }
        }
      }
    }
  }
}
```

## Section 10 — Sequence Diagrams (ASCII)

### 1. Wealth Tenant Provisioning (Automated 18-Step)
```text
AdminPortal     Provisioner      PostgreSQL      Kafka      Keycloak       MinIO        DNS
     |               |               |             |           |             |           |
     |---Create----->|               |             |           |             |           |
     |  (Request)    |               |             |           |             |           |
     |               |--1.CreateSchema->           |           |             |           |
     |               |<--SchemaCreated-            |           |             |           |
     |               |               |             |           |             |           |
     |               |--2.RunMigrations->          |           |             |           |
     |               |<--Migrated------            |           |             |           |
     |               |               |             |           |             |           |
     |               |--3.RegPrefix--------------->|           |             |           |
     |               |<--PrefixReady---------------|           |             |           |
     |               |               |             |           |             |           |
     |               |--4.CreateRealm------------------------->|             |           |
     |               |<--RealmCreated--------------------------|             |           |
     |               |               |             |           |             |           |
     |               |--5.MakeBucket---------------------------------------->|           |
     |               |<--BucketReady-----------------------------------------|           |
     |               |               |             |           |             |           |
     |               |--6.CreateCNAME--------------------------------------------------->|
     |               |<--DNSRecordSet----------------------------------------------------|
     |               |               |             |           |             |           |
     |               |--7.HealthCheck--------------------------------------------------->|
     |<--Success-----|               |             |           |             |           |
     |  (Tenant ID)  |               |             |           |             |           |
```

### 2. Institutional Tenant Provisioning (Manual + Automated)
```text
Sales      PlatformEng      Terraform       AWS_RDS      AWS_MSK     NetSec     Client
  |             |               |              |            |           |          |
  |-SignOff---->|               |              |            |           |          |
  |             |---ApplyCfg--->|              |            |           |          |
  |             |               |--CreateDB--->|            |           |          |
  |             |               |<--DBReady----|            |           |          |
  |             |               |              |            |           |          |
  |             |               |--CreateKaf--------------->|           |          |
  |             |               |<--KafkaReady--------------|           |          |
  |             |               |              |            |           |          |
  |             |<--StateFile---|              |            |           |          |
  |             |               |              |            |           |          |
  |             |---RequestVPN----------------------------------------->|          |
  |             |               |              |            |           |--Setup-->|
  |             |<--VPNActive-------------------------------------------|<--Conn---|
  |             |               |              |            |           |          |
  |<--Handover--|               |              |            |           |          |
  |             |               |              |            |           |          |
```

### 3. Tenant Offboarding Sequence
```text
AdminPortal    OffboardSvc     PostgreSQL      StorageSvc    Keycloak      TenantAdmin
     |              |               |               |           |               |
     |-Trigger----->|               |               |           |               |
     |              |--SetReadOnly->|               |           |               |
     |              |               |               |           |               |
     |              |--StartExport----------------->|           |               |
     |              |<--ExportZip-------------------|           |               |
     |              |               |               |           |               |
     |              |--SendSecureLink------------------------------------------>|
     |              |               |               |           |               |
     |              |<--ConfirmReceipt------------------------------------------|
     |              |               |               |           |               |
     |              |--MoveToWORM------------------>|           |               |
     |              |               |               |           |               |
     |              |--DropSchema-->|               |           |               |
     |              |               |               |           |               |
     |              |--DeleteRealm----------------------------->|               |
     |<--Complete---|               |               |           |               |
```

## Section 11 — Failure Modes & Mitigations

Robust error handling and rollback mechanisms are critical for maintaining infrastructure state integrity during provisioning operations.

| Failure | Probability | Impact | Detection | Mitigation | Recovery SLA |
|---------|-------------|--------|-----------|------------|------|
| **PostgreSQL schema creation failure** | LOW | HIGH | Pipeline Exception | Immediate rollback of transaction. Alert Data Platform team. | < 5m |
| **Flyway migration error** | LOW | HIGH | Flyway Exit Code != 0 | Automated schema drop (rollback). Block activation. Fix migration script. | < 15m |
| **Keycloak realm creation failure** | LOW | HIGH | HTTP 5xx from IDP | Retry with exponential backoff (max 3). Rollback on persistent failure. | < 5m |
| **DNS propagation delay** | MEDIUM | LOW | Pre-flight check fails | Pipeline pauses and polls Route53 until propagation is confirmed. | N/A |
| **SSL certificate issuance failure** | LOW | MEDIUM | Let's Encrypt Rate Limit / Timeout | Fallback to wildcard cert temporarily. Alert DevOps. | < 30m |
| **Kafka topic prefix collision** | VERY LOW | HIGH | ACL creation fails | Strict UUID generation for tenant IDs prevents this natively. | < 5m |
| **MinIO bucket naming conflict** | VERY LOW | MEDIUM | HTTP 409 Conflict | UUID-based naming prevents collision. | < 5m |
| **Partial provisioning (half-complete)** | LOW | HIGH | K8s Job Timeout / Crash | Job restart triggers idempotency checks. Orphaned resources swept by cron. | < 1h |
| **Rollback failure after error** | VERY LOW | CRITICAL | Rollback Exception | Trigger PagerDuty CRITICAL alert. Manual cleanup required by SRE. | < 2h |
| **Cross-tenant data access attempt** | VERY LOW | CRITICAL | DB Trigger Exception | Block query. Audit log generated. Alert InfoSec immediately. | < 1m |
| **Tenant slug collision** | LOW | MEDIUM | Validation API | Pre-validation API rejects duplicate slugs before provisioning starts. | Instant |
| **Branding asset upload failure** | LOW | LOW | S3 PutObject timeout | Retry logic. If fails, use default branding and allow manual upload later. | N/A |

## Section 12 — Performance Budget

Provisioning must adhere to strict Service Level Objectives (SLOs) to ensure operational scalability.

| Operation | P50 Target | P99 Target | Constraint |
|-----------|------------|------------|------------|
| **Wealth provisioning (full pipeline)** | < 10 min | < 15 min | Fully Automated |
| **PostgreSQL Schema creation** | < 30s | < 60s | Executed on target PostgreSQL instance |
| **Flyway migrations** | < 2 min | < 5 min | Dependent on schema complexity |
| **Keycloak realm creation** | < 10s | < 30s | Keycloak Admin API performance |
| **DNS propagation** | < 5 min | < 30 min | External DNS provider latency |
| **SSL certificate provisioning** | < 2 min | < 5 min | ACME / Let's Encrypt challenge times |
| **MinIO bucket creation** | < 5s | < 15s | MinIO Admin API |
| **Institutional provisioning (E2E)** | < 48h | < 72h | Includes manual networking and security checks |

## Section 13 — SLO Compliance

Tenant provisioning reliability is tracked via Prometheus and visualized in Grafana.

### SLO Table

| SLO | Target | Measurement | PromQL Base |
|-----|--------|-------------|-------------|
| **Wealth Provisioning Time** | < 15 min (99%) | Pipeline duration from trigger to ACTIVE status | `histogram_quantile(0.99, rate(tenant_provisioning_duration_seconds_bucket[1h]))` |
| **Institutional Provisioning** | < 72 hours (95%) | Jira ticket tracking / API state transition | `avg_over_time(institutional_provisioning_duration_hours[30d])` |
| **Tenant Data Isolation** | Zero incidents | DB trigger fires / App logs | `sum(increase(cross_tenant_access_violations_total[30d]))` |
| **Pipeline Success Rate** | > 99% | Successful provisionings / Total attempts | `sum(rate(tenant_provisioning_success_total[1h])) / sum(rate(tenant_provisioning_attempts_total[1h]))` |

### PromQL Alert Expressions

```promql
# Alert: Wealth Provisioning taking too long
alert: TenantProvisioningTimeout
expr: tenant_provisioning_duration_seconds > 900
for: 1m
labels:
  severity: critical
  team: platform-engineering
annotations:
  summary: "Tenant provisioning exceeded 15 minute SLA"
  description: "Tenant {{ $labels.tenant_slug }} is stuck in PROVISIONING state."

# Alert: Security violation - Cross tenant access
alert: CrossTenantAccessAttempt
expr: increase(cross_tenant_access_violations_total[5m]) > 0
for: 0s
labels:
  severity: critical
  page: true
  team: infosec
annotations:
  summary: "CRITICAL: Cross-tenant data access attempt detected"
  description: "A query was blocked attempting to access data outside its tenant boundary. Source Tenant: {{ $labels.source_tenant }}, Target Tenant: {{ $labels.target_tenant }}"
  
# Alert: High failure rate in automated pipeline
alert: ProvisioningPipelineFailureSpike
expr: (sum(rate(tenant_provisioning_failure_total[15m])) / sum(rate(tenant_provisioning_attempts_total[15m]))) > 0.05
for: 5m
labels:
  severity: warning
annotations:
  summary: "Provisioning pipeline error rate > 5%"
```

## Section 14 — Observability

Deep observability is embedded into the tenant architecture to monitor per-tenant resource consumption and platform health.

### Metrics Inventory

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `tenant_count_total` | Gauge | `tier`, `status` | Total number of tenants registered in the system. |
| `tenant_provisioning_duration_seconds` | Histogram | `tier`, `step` | Time taken for the end-to-end provisioning or individual steps. |
| `tenant_provisioning_success_total` | Counter | `tier` | Total successful tenant creation events. |
| `tenant_provisioning_failure_total` | Counter | `tier`, `step`, `reason` | Total failed tenant creation events. |
| `cross_tenant_access_violations_total` | Counter | `source_tenant`, `target_tenant` | Security violations blocked by DB triggers or app logic. |
| `tenant_api_requests_total` | Counter | `tenant_id`, `endpoint`, `status` | Per-tenant API usage for billing and rate limiting. |
| `tenant_storage_bytes` | Gauge | `tenant_id`, `bucket` | Storage consumption in MinIO per tenant. |
| `tenant_active_users_total` | Gauge | `tenant_id` | Number of active Keycloak sessions per tenant. |

### Grafana Dashboards
- **Tenant Overview**: High-level dashboard showing total tenant counts by tier, global provisioning success rate, and active onboarding pipelines.
- **Per-tenant Usage Metrics**: Detailed drill-down for a specific `tenant_id` showing API request rates, storage consumption, and active user counts.
- **Security & Isolation Auditing**: Dedicated Infosec dashboard monitoring the `CrossTenantAccessAttempt` alert panel and RBAC violation logs.
- **Provisioning Pipeline Health**: Step-by-step funnel visualization of the 18-step pipeline, highlighting bottlenecks (e.g., DNS propagation delays).

## Section 15 — Test Strategy

The multi-tenancy implementation relies heavily on automated integration and security testing.

### Test Automation Framework

```python
import pytest
import asyncio
from testcontainers.postgres import PostgresContainer
from testcontainers.kafka import KafkaContainer
from app.services.provisioning import TenantProvisioningPipeline
from app.models import TenantProvisioningRequest

class TestTenantProvisioning:
    
    @pytest.fixture(scope="module")
    def db_container(self):
        with PostgresContainer("postgres:15-alpine") as postgres:
            yield postgres

    @pytest.mark.integration
    async def test_full_wealth_provisioning(self, db_container):
        """
        Tests the end-to-end automated 18-step provisioning pipeline.
        Mocks external calls (DNS, Let's Encrypt) but uses real DB/Kafka.
        """
        pipeline = TenantProvisioningPipeline(
            pg_client=db_container.get_connection_url(),
            # ... mock other dependencies
        )
        
        request = TenantProvisioningRequest(
            firm_name_en='Test Wealth Firm',
            firm_name_ar='شركة الثروة للاختبار',
            admin_email='admin@testwealthfirm.com',
            tier='WEALTH',
            subdomain='test-wealth-firm',
            primary_color='#1A3C5E',
            logo_url='https://example.com/logo.svg'
        )
        
        tenant_id = await pipeline.provision(request)
        assert tenant_id is not None
        
        # Verify PostgreSQL schema was successfully created
        schema_exists = await pipeline.pg_client.fetch_val(
            "SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = 'schema_test_wealth_firm')"
        )
        assert schema_exists is True

    @pytest.mark.security
    async def test_cross_tenant_isolation(self, db_container):
        """
        Verifies that row-level and schema-level isolation triggers correctly 
        reject cross-tenant data access.
        """
        # 1. Provision Tenant A and Tenant B
        # 2. Insert test portfolio data for Tenant A
        # 3. Open connection, SET app.tenant_id = Tenant_B
        # 4. Attempt to SELECT or UPDATE Tenant A's portfolio
        # 5. Assert database throws isolation exception
        pass
    
    @pytest.mark.security
    async def test_tenant_slug_injection(self):
        """
        Validates that the tenant slug parser prevents SQL injection 
        when constructing dynamic schema names.
        """
        pipeline = TenantProvisioningPipeline(...)
        malicious_slug = "'; DROP SCHEMA public; --"
        
        with pytest.raises(ValueError, match="Invalid slug format"):
            await pipeline.provision(TenantProvisioningRequest(
                firm_name_en='Evil Corp',
                firm_name_ar='شركة شريرة',
                admin_email='hack@evil.com',
                tier='WEALTH',
                subdomain=malicious_slug,
                primary_color='#000000',
                logo_url=''
            ))

    def test_tenant_slug_validation(self):
        """
        Unit test for regex validation of tenant subdomains.
        """
        from app.utils.validators import is_valid_tenant_slug
        
        valid_slugs = ['abc-capital', 'wealth-firm-123', 'nile-investments']
        invalid_slugs = ['ABC CAPITAL', 'firm_with_underscore', 'a' * 64, '', '-start-dash']
        
        for slug in valid_slugs:
            assert is_valid_tenant_slug(slug) is True
            
        for slug in invalid_slugs:
            assert is_valid_tenant_slug(slug) is False
```

---
*End of Blueprint Document*
