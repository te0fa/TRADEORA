# Tradeora Financial Operating System
## Plugin & Extensibility Architecture Specification
**Document Version:** 1.0.0
**Status:** DRAFT / APPROVED
**Target Audience:** Core Architects, Security Teams, Ecosystem Partners

---

### Section 1 — Plugin Philosophy

#### 1.1 Why Plugins Matter for a Financial OS
In the complex and rapidly evolving landscape of financial technology, agility and adaptability are paramount. The Tradeora Financial Operating System requires an architecture that can seamlessly integrate new data sources, analytical methodologies, and regulatory requirements without necessitating modifications to the core platform. Plugins serve as the foundational mechanism for achieving this extensibility. By decentralizing feature development into modular, isolable components, Tradeora can scale its capabilities globally while maintaining the absolute stability and security of its core processing engine. 

The plugin philosophy is driven by the need to:
- **Accelerate Time-to-Market:** Enable independent teams and third-party partners to develop and deploy extensions concurrently.
- **Ensure Core Stability:** Isolate experimental or domain-specific logic from the mission-critical consensus and execution engines.
- **Foster Ecosystem Innovation:** Provide a standardized interface for quantitative researchers, compliance experts, and data vendors to contribute to the platform.

#### 1.2 Extension Over Modification (ARTICLE 3)
In adherence to the Constitutional Principles of the Tradeora architecture, specifically **Article 3: Extension Over Modification**, the core system MUST NOT be altered to accommodate new, specialized functionalities. Instead, the core exposes robust, versioned extension points (Hooks and APIs). 

Any requirement that demands custom logic for a specific jurisdiction, a novel market data feed, or an experimental AI model must be implemented as a plugin. This principle ensures that the core OS remains a pure, high-performance execution and orchestration layer, devoid of domain-specific clutter.

#### 1.3 Plugin Isolation Requirements
Financial data protection is the highest priority. Plugins, especially those developed by third parties, represent a significant attack surface. Therefore, the architecture mandates strict isolation:
- **Memory Isolation:** Plugins cannot access the memory space of the core OS or other plugins.
- **Data Encapsulation:** Plugins only receive the specific data slices they are authorized to process.
- **Execution Containment:** A plugin failure (e.g., infinite loop, out-of-memory) must be gracefully terminated without impacting the platform's overall latency or availability.

---

### Section 2 — Plugin Taxonomy

The Tradeora ecosystem supports three distinct classes of plugins, each with specific roles, SLAs, and interfaces.

#### 2.1 Type A — Data Connector Plugins
**Purpose:** To ingest, normalize, and stream external data sources into the Tradeora unified data bus.
**Examples:** Alternative EGX data providers, Bloomberg Terminal feeds, global news aggregators, sentiment analysis streams.

**Interface Specification:**
```typescript
/**
 * Type A Plugin: Data Connector
 * Responsible for interfacing with external data providers and streaming normalized 
 * data into the Tradeora internal event bus.
 */
interface DataConnectorPlugin {
  readonly pluginId: PluginId;
  readonly version: SemanticVersion;
  readonly dataType: DataType; // MARKET_DATA, NEWS, FUNDAMENTALS, SENTIMENT
  readonly schema: AvroSchema;
  
  /**
   * Initializes the connection to the external data source.
   * @param config - Injected configuration including secured credentials.
   */
  connect(config: DataConnectorConfig): Promise<void>;
  
  /**
   * Returns an asynchronous generator yielding normalized data points.
   */
  stream(): AsyncGenerator<DataPoint>;
  
  /**
   * Reports the current latency of the upstream connection.
   */
  getLatency(): Promise<Milliseconds>;
  
  /**
   * Gracefully terminates the connection.
   */
  disconnect(): Promise<void>;
}
```

#### 2.2 Type B — AI School Plugins
**Purpose:** To expand the Tradeora consensus engine by introducing new analytical models, quant strategies, or specialized reasoning schools. These plugins evaluate market conditions and emit recommendations that the core consensus algorithm weights.
**Examples:** ESG Analysis School, Islamic Finance Compliance School, High-Frequency Arbitrage School.

**Interface Specification:**
```typescript
/**
 * Type B Plugin: AI School
 * Represents a specialized analytical methodology contributing to the overall Tradeora Consensus.
 */
interface AISchoolPlugin {
  readonly schoolId: SchoolId;
  readonly schoolName: string; // e.g., 'ESGAnalysis', 'IslamicFinance'
  readonly version: SemanticVersion;
  readonly maxLatencyMs: 1500; // Strict SLA for consensus participation
  
  /**
   * Analyzes the given market context and returns a recommendation.
   */
  analyze(context: AnalysisContext): Promise<SchoolRecommendation>;
  
  /**
   * Returns the school's self-assessed confidence level in current market conditions.
   */
  getConfidence(): Decimal;
  
  /**
   * Generates a localized explanation of the recommendation for transparency.
   */
  explainInArabic(recommendation: SchoolRecommendation): string;
  explainInEnglish(recommendation: SchoolRecommendation): string;
}
```

#### 2.3 Type C — Compliance Plugins
**Purpose:** To enforce regulatory, jurisdictional, or user-defined constraints on trading activities. These plugins intercept trade intents before execution to ensure compliance.
**Examples:** Saudi SAMA regulatory rules, UAE SCA restrictions, MiFID II (Phase 3) reporting rules, Sharia-compliant asset filtering.

**Interface Specification:**
```typescript
/**
 * Type C Plugin: Compliance
 * Evaluates trade intents against strict regulatory or institutional rules.
 */
interface CompliancePlugin {
  readonly complianceId: string;
  readonly jurisdiction: Jurisdiction;
  readonly version: SemanticVersion;
  readonly maxLatencyMs: 100; // Extremely strict SLA for pre-trade checks
  
  /**
   * Evaluates an intent. Returns a block if compliance is violated.
   */
  evaluateTrade(intent: TradeIntent): Promise<ComplianceResult>;
  
  /**
   * Audits the historical execution log for compliance reporting.
   */
  generateAuditReport(timeframe: TimeRange): Promise<AuditReport>;
}
```

---

### Section 3 — Plugin Isolation Model

Tradeora employs a dual-isolation strategy based on the plugin's origin and trust level.

#### 3.1 Execution Environments

**A. WebAssembly (WASM) Sandbox (For Third-Party Plugins)**
All community and commercial third-party plugins are compiled to WebAssembly (WASM) and executed within a hardened runtime (e.g., Wasmtime or Wasmer). 
- **Pros:** Absolute memory safety, deterministic execution, near-native performance, capability-based security (WASI).
- **Cons:** Slight overhead compared to native code, restrictive I/O.

**B. gRPC Sidecar (For First-Party Plugins)**
Certified internal plugins developed by the core Tradeora team run as separate processes communicating via high-speed gRPC over Unix Domain Sockets (UDS).
- **Pros:** Maximum performance, access to native system libraries, flexible language choice (Go, Rust, C++).
- **Cons:** Requires rigorous internal code review; runs as an OS process (though containerized).

#### 3.2 Permission Model & Resource Limits

| Plugin Type | CPU Limit (Cores) | Memory Limit | Network Access | Disk I/O |
| :--- | :--- | :--- | :--- | :--- |
| **Data Connector (WASM)** | 0.5 | 256 MB | Specific Whitelisted IPs | Ephemeral (tmpfs) |
| **Data Connector (gRPC)** | 1.0 | 512 MB | VPC Internal + API Endpoints | Ephemeral |
| **AI School (WASM)** | 2.0 | 1024 MB | None (Data fed via context) | None |
| **Compliance (WASM)** | 0.5 | 128 MB | None (Data fed via context) | Read-only rulesets |

*Diagram 3.1: Isolation Architecture*
```ascii
+-------------------------------------------------------------+
|                     Tradeora Core OS                        |
|                                                             |
|  +----------------+  +----------------+  +---------------+  |
|  | Event Bus      |  | Consensus Eng. |  | Order Routing |  |
|  +-------+--------+  +--------+-------+  +-------+-------+  |
|          |                    |                  |          |
+----------|--------------------|------------------|----------+
           |                    |                  |
    =======|====================|==================|======= (Strict Boundary)
           |                    |                  |
 +---------v---------+ +--------v---------+ +------v--------+
 | Type A Connector  | | Type B AI School | | Type C Compl. |
 | [gRPC Sidecar]    | | [WASM Sandbox]   | | [WASM Sandbox]|
 +-------------------+ +------------------+ +---------------+
```

---

### Section 4 — Plugin Lifecycle

Plugins transition through a strict state machine to ensure platform stability.

#### 4.1 State Machine
1. **REGISTERED:** The plugin manifest and binary are uploaded to the Registry.
2. **VALIDATED:** The system performs static analysis, vulnerability scanning, and schema verification.
3. **ACTIVE:** The plugin is enabled via feature flag and is processing live data.
4. **DEPRECATED:** The plugin is active but marked for removal. No new dependencies allowed.
5. **RETIRED:** The plugin is permanently disabled and archived.

#### 4.2 Health Monitoring & Circuit Breaking
Every plugin exposes Prometheus metrics (`tradeora_plugin_latency_ms`, `tradeora_plugin_error_rate`, `tradeora_plugin_memory_bytes`).
The Core OS includes a **Circuit Breaker** component. If a plugin violates its SLA (e.g., an AI School takes >1500ms to respond, or a Data Connector drops >1% of packets), the circuit breaker trips.
- **Action:** The plugin is forcefully restarted.
- **Fallback:** If an AI school fails, the Consensus Engine recalculates weights excluding the failed school. If a Compliance plugin fails, trading is HALTED (fail-closed secure).

---

### Section 5 — Plugin Registry

#### 5.1 Storage & Distribution
Plugins are stored as immutable artifacts in a MinIO object storage cluster. Each plugin consists of a Manifest (`plugin.json`) and a Binary (`plugin.wasm` or `container image`).

#### 5.2 Manifest Specification
```json
{
  "id": "tradeora.school.esg.v1",
  "name": "ESG Consensus Analytics",
  "version": "1.2.0",
  "type": "TYPE_B_AI_SCHOOL",
  "author": "Tradeora Research",
  "license": "Proprietary",
  "dependencies": {
    "coreVersion": ">=2.0.0 <3.0.0"
  },
  "permissions": {
    "network": false,
    "filesystem": false
  }
}
```
Versioning strictly follows Semantic Versioning (SemVer). The platform refuses to load plugins that are incompatible with the current core OS version.

---

### Section 6 — Built-in vs Third-Party

#### 6.1 First-Party Plugins
Developed by Tradeora. These plugins handle mission-critical tasks where maximum performance is needed. They run as gRPC sidecars. They are subject to rigorous internal CI/CD, penetration testing, and code reviews.

#### 6.2 Third-Party Plugins
Developed by partners, quantitative analysts, or the community. These MUST run in the WASM sandbox.
**Certification Process:**
1. **Source Code Escrow:** Partner must submit source code for automated scanning.
2. **Benchmark Suite:** Plugin must pass a 24-hour load test on a simulated market environment.
3. **Manual Security Audit:** Tradeora InfoSec team reviews capability requests (WASI permissions).

---

### Section 7 — Security Model

#### 7.1 Secret Management
Plugins NEVER store API keys or database passwords. Secrets are managed by HashiCorp OpenBao (Vault). At startup, the core OS retrieves necessary secrets and injects them into the plugin's isolated memory space or passes them securely during initialization.

#### 7.2 Audit Trail
Every interaction between the Core OS and a plugin is logged to an append-only cryptographic ledger (Kafka topics with retention).
- **Log Format:** `[Timestamp] [PluginID] [Action] [PayloadHash] [Latency]`
- This ensures non-repudiation. If an AI school makes a disastrous recommendation, the audit trail proves the exact inputs and outputs.

---

### Section 8 — Performance Constraints

The Tradeora OS operates in a high-throughput environment. Plugins must adhere to strict SLAs.

| Plugin Category | Max Latency (p99) | Timeout Behavior | Retry Policy |
| :--- | :--- | :--- | :--- |
| **Data Connector** | 50ms per batch | Drop batch, alert | Exponential backoff on connect |
| **AI School** | 1500ms | Exclude from consensus | None (Wait for next tick) |
| **Compliance** | 100ms | Fail-closed (Reject Trade)| None (Immediate rejection) |

Health checks are performed via a specialized heartbeat API every 30 seconds. Three consecutive missed heartbeats trigger auto-eviction.

---

### Section 9 — Example Implementations

#### 9.1 EGX Data Feed Connector (Type A)
```typescript
import { DataConnectorPlugin, DataConnectorConfig, DataPoint } from '@tradeora/plugin-sdk';

export class EGXFeedConnector implements DataConnectorPlugin {
  readonly pluginId = 'tradeora.connector.egx.marketdata';
  readonly version = '1.0.0';
  readonly dataType = 'MARKET_DATA';
  readonly schema = EGX_AVRO_SCHEMA;
  private socket: WebSocket | null = null;

  async connect(config: DataConnectorConfig): Promise<void> {
    const apiKey = config.secrets.get('EGX_API_KEY');
    this.socket = new WebSocket(`wss://feed.egx.com.eg/v1/stream?key=${apiKey}`);
    await this.waitForConnection();
  }

  async *stream(): AsyncGenerator<DataPoint> {
    // Yield normalized data points as they arrive over the websocket
    while (this.socket?.readyState === WebSocket.OPEN) {
      const raw = await this.nextMessage();
      yield this.normalize(raw);
    }
  }
  
  async getLatency(): Promise<Milliseconds> {
    return this.calculatePing();
  }

  async disconnect(): Promise<void> {
    this.socket?.close();
  }
  
  private normalize(raw: any): DataPoint {
    // Implementation for normalizing EGX data format
    return { /* ... */ };
  }
}
```

#### 9.2 Islamic Finance AI School (Type B)
```typescript
import { AISchoolPlugin, AnalysisContext, SchoolRecommendation } from '@tradeora/plugin-sdk';

export class IslamicFinanceSchool implements AISchoolPlugin {
  readonly schoolId = 'school.islamic_finance';
  readonly schoolName = 'Sharia Compliance & Islamic Finance Analysis';
  readonly version = '2.1.0';
  readonly maxLatencyMs = 1500;

  async analyze(context: AnalysisContext): Promise<SchoolRecommendation> {
    const { asset, fundamentals } = context;
    // Check debt-to-equity ratios, non-compliant income percentages, etc.
    if (fundamentals.debtToEquity > 0.33) {
      return { action: 'STRONG_SELL', weight: 0.9, reasonCode: 'DEBT_RATIO_EXCEEDED' };
    }
    // Calculate recommendation based on Halal growth metrics
    return this.computeRecommendation(context);
  }

  explainInArabic(rec: SchoolRecommendation): string {
    if (rec.reasonCode === 'DEBT_RATIO_EXCEEDED') {
      return "تجاوزت نسبة الدين إلى حقوق الملكية الحد المسموح به شرعاً (33%)";
    }
    return "الشركة متوافقة مع الضوابط الشرعية بناءً على التحليل المالي الأخير.";
  }
  
  explainInEnglish(rec: SchoolRecommendation): string { 
    if (rec.reasonCode === 'DEBT_RATIO_EXCEEDED') {
      return "Debt-to-equity ratio exceeded the permitted limit (33%).";
    }
    return "The company complies with Sharia controls based on recent financial analysis.";
  }
  
  getConfidence(): Decimal { return new Decimal(0.95); }
}
```

#### 9.3 Saudi SAMA Compliance Plugin (Type C)
```typescript
import { CompliancePlugin, TradeIntent, ComplianceResult, TimeRange, AuditReport } from '@tradeora/plugin-sdk';

export class SAMARegulatoryPlugin implements CompliancePlugin {
  readonly complianceId = 'tradeora.compliance.sama.v2';
  readonly jurisdiction = 'SAUDI_ARABIA';
  readonly version = '2.0.1';
  readonly maxLatencyMs = 100;

  async evaluateTrade(intent: TradeIntent): Promise<ComplianceResult> {
    if (intent.assetClass === 'CRYPTO') {
       return { 
         status: 'REJECTED', 
         reason: 'SAMA prohibits direct cryptocurrency trading by regulated entities.' 
       };
    }
    
    const exposure = await this.calculateExposure(intent.clientId);
    if (exposure > SAMA_LIMITS.MAX_EXPOSURE) {
       return {
         status: 'REJECTED',
         reason: 'Client exposure exceeds maximum regulatory limits.'
       };
    }

    return { status: 'APPROVED' };
  }

  async generateAuditReport(timeframe: TimeRange): Promise<AuditReport> {
    // Generate SAMA compliant XML report format
    return new SAMAXmlReport(timeframe);
  }
}
```

---

### Section 10 — Phase Roadmap

The plugin architecture will be rolled out in three distinct phases:

#### Phase 1: Internal Plugins Only (Q3 2026)
- Launch the core plugin orchestrator.
- Migrate existing monolithic data connectors (EGX, global FX) to Type A gRPC sidecars.
- Establish the MinIO Plugin Registry and Vault integration.

#### Phase 2: Certified Partner Plugins (Q1 2027)
- Introduce the WASM sandbox environment.
- Onboard select institutional partners (e.g., regional brokers, premium data vendors) to develop Type A and Type C plugins.
- Formalize the certification and audit process.

#### Phase 3: Plugin Marketplace (Q4 2027)
- Open the ecosystem to community developers.
- Launch the Tradeora Plugin Marketplace, allowing users to subscribe to proprietary Type B AI Schools (quantitative strategies).
- Implement billing, licensing, and automated security scanning pipelines.

---

## Section 8 — Plugin Security Model (Complete Specification)

### 8.1 Threat Model for Plugins

Plugins represent an extension of trust into the Tradeora platform. A compromised or
malicious plugin could attempt to:

| Threat | Severity | Mitigation |
|--------|----------|-----------|
| Exfiltrate user portfolio data | CRITICAL | Data encapsulation — plugin only receives anonymized context |
| Manipulate AI recommendation output | CRITICAL | Output validation layer; plugin output is advisory input only |
| Exhaust system resources (CPU/memory DoS) | HIGH | Kubernetes ResourceQuotas + WASM memory limits |
| Inject malicious SQL via data callback | HIGH | Parameterized queries enforced; plugins never touch DB directly |
| Escalate to core system privileges | CRITICAL | gRPC service account with minimal RBAC; WASM sandbox |
| Supply chain attack via dependency | HIGH | SBOM audit + OSS license scan in certification pipeline |
| Timing side-channel attacks | MEDIUM | Fixed-window execution budget; response normalization |

### 8.2 Plugin Sandboxing: Two Models

**Model A — gRPC Sidecar (Type A: Data Connector, Type C: Compliance)**

```
┌────────────────────────────────────────────────┐
│  Kubernetes Pod: egx-data-connector-plugin      │
│                                                  │
│  ┌──────────────────┐    ┌────────────────────┐  │
│  │  Plugin Process  │◄──►│  gRPC Server       │  │
│  │  (Python/Go)     │    │  (port 50051)      │  │
│  └──────────────────┘    └────────────────────┘  │
│                                   │               │
│  NetworkPolicy:                   │               │
│  - ALLOW: tradeora-platform ns   ◄┘               │
│  - DENY: all other namespaces                     │
│  - DENY: internet egress                          │
│  - DENY: metadata service (cloud IMDS)            │
│                                                  │
│  ServiceAccount: plugin-svc-egx-connector        │
│  ClusterRole: NONE (namespace-scoped only)        │
│  Secrets: Plugin reads from mounted volume        │
│           (OpenBao agent injects at startup)      │
└────────────────────────────────────────────────┘
```

**Model B — WebAssembly Sandbox (Type B: AI School Plugin)**

```typescript
// packages/plugin-runtime/src/wasm/wasm-sandbox.ts

import { WASI } from '@wasmer/wasi';
import { WasmFs } from '@wasmer/wasmfs';

export class WasmPluginSandbox {
  private readonly MAX_MEMORY_PAGES = 256;   // 256 × 64KB = 16 MB max
  private readonly EXECUTION_TIMEOUT_MS = 800; // Must complete within school timeout budget

  async executePlugin(
    pluginWasmBytes: Uint8Array,
    input: PluginInput,
  ): Promise<PluginOutput> {
    const wasmFs = new WasmFs();
    const wasi = new WASI({
      args: [],
      env: {
        // Minimal environment — no secrets, no credentials
        PLUGIN_INSTANCE_ID: this.generateInstanceId(),
      },
      bindings: {
        ...WASI.defaultBindings,
        fs: wasmFs.fs,
      },
    });

    const memory = new WebAssembly.Memory({
      initial: 16,
      maximum: this.MAX_MEMORY_PAGES,  // Hard cap: 16MB
    });

    const importObject = {
      wasi_snapshot_preview1: wasi.wasiImport,
      env: { memory },
      // Plugin can ONLY call these host functions:
      tradeora: {
        get_market_price: (tickerPtr: number, tickerLen: number) => {
          // Provides current price — read-only, no write access
          return this.marketDataProvider.getPrice(this.readString(memory, tickerPtr, tickerLen));
        },
        log_output: (msgPtr: number, msgLen: number) => {
          // Captured for audit — not written to production logs
          this.auditLogger.capturePluginLog(this.readString(memory, msgPtr, msgLen));
        },
        // PROHIBITED host functions (not exposed):
        // - database access
        // - file system access
        // - network calls
        // - environment variables
      },
    };

    const module = await WebAssembly.compile(pluginWasmBytes);
    const instance = await WebAssembly.instantiate(module, importObject);

    // Execute with timeout
    const result = await Promise.race([
      this.invokePlugin(instance, input),
      this.timeoutReject(this.EXECUTION_TIMEOUT_MS),
    ]);

    return this.validateOutput(result);
  }
}
```

### 8.3 Plugin Permission Model

```yaml
# Plugin capability declarations (in plugin manifest)
# Plugins must declare ALL capabilities at certification time
# Any undeclared capability attempt → immediate plugin termination

plugin:
  id: egx-market-data-connector
  version: 1.2.0
  capabilities:
    - MARKET_DATA_READ       # Can read live market data provided by platform
    - KAFKA_PUBLISH_ALLOWED  # Can publish to assigned Kafka topic prefix
    - HTTP_EGRESS_ALLOWED    # Can make HTTP calls to declared external hosts
  
  # Whitelist of allowed external HTTP endpoints
  # Any call to unlisted endpoint: blocked by egress NetworkPolicy
  allowed_egress:
    - host: api.egx.com.eg
      port: 443
      protocol: HTTPS
    - host: data.egx.com.eg
      port: 443
      protocol: HTTPS
  
  # Data access scope
  data_access:
    user_pii: NONE              # Cannot access any PII
    portfolio_data: NONE        # Cannot access user portfolios
    market_data: READ_ONLY      # Read current prices only
    instrument_registry: READ_ONLY
  
  # Resource limits
  resource_limits:
    max_memory_mb: 512
    max_cpu_millicores: 500
    max_execution_ms: 5000
    max_kafka_messages_per_second: 10000
```

---

## Section 9 — Plugin Registry Architecture

### 9.1 Registry Schema (MinIO + PostgreSQL Metadata)

```sql
-- Plugin registry metadata (PostgreSQL)
CREATE TABLE plugin_registry.plugins (
    id              TEXT PRIMARY KEY,          -- e.g., 'egx-data-connector'
    version         TEXT NOT NULL,             -- SemVer: '1.2.0'
    type            TEXT NOT NULL CHECK (type IN ('DATA_CONNECTOR', 'AI_SCHOOL', 'COMPLIANCE')),
    status          TEXT NOT NULL CHECK (status IN ('DRAFT', 'UNDER_REVIEW', 'CERTIFIED', 'DEPRECATED', 'REVOKED')),
    publisher       TEXT NOT NULL,             -- 'tradeora-core' or partner org
    wasm_sha256     TEXT,                      -- SHA-256 of WASM binary (Type B only)
    docker_sha256   TEXT,                      -- SHA-256 of Docker image digest (Type A/C)
    manifest_json   JSONB NOT NULL,            -- Full capability declaration
    certified_at    TIMESTAMPTZ,
    certified_by    TEXT,                      -- Certifier identity
    revoked_at      TIMESTAMPTZ,
    revoke_reason   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plugin version history (immutable log)
CREATE TABLE plugin_registry.plugin_versions (
    plugin_id       TEXT NOT NULL REFERENCES plugin_registry.plugins(id),
    version         TEXT NOT NULL,
    artifact_path   TEXT NOT NULL,            -- MinIO path: plugins/{id}/{version}/artifact.wasm
    changelog       TEXT,
    published_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (plugin_id, version)
);

-- Active plugin deployments per environment
CREATE TABLE plugin_registry.deployments (
    id              TEXT PRIMARY KEY,
    plugin_id       TEXT NOT NULL REFERENCES plugin_registry.plugins(id),
    version         TEXT NOT NULL,
    environment     TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
    deployed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deployed_by     TEXT NOT NULL,
    health_status   TEXT DEFAULT 'UNKNOWN',
    last_health_at  TIMESTAMPTZ
);
```

### 9.2 Plugin Artifact Storage (MinIO)

```
MinIO bucket: tradeora-plugin-registry/
├── plugins/
│   ├── egx-data-connector/
│   │   ├── 1.0.0/
│   │   │   ├── manifest.yaml           # Capability declaration
│   │   │   ├── docker-image.tar.gz     # For gRPC sidecar plugins
│   │   │   ├── SBOM.json               # Software Bill of Materials
│   │   │   ├── security-scan.json      # Trivy scan results
│   │   │   └── certification.sig       # Ed25519 signature by Tradeora cert authority
│   │   └── 1.1.0/
│   │       └── ... (same structure)
│   │
│   ├── quant-momentum-school/
│   │   └── 1.0.0/
│   │       ├── manifest.yaml
│   │       ├── school.wasm             # WASM binary for AI school plugin
│   │       ├── SBOM.json
│   │       └── certification.sig
```

### 9.3 Plugin Certification Verification at Load Time

```typescript
// packages/plugin-loader/src/certification/plugin-verifier.ts

export class PluginCertificationVerifier {
  private readonly TRADEORA_CERT_PUBLIC_KEY = Buffer.from(
    process.env.TRADEORA_PLUGIN_CERT_PUBLIC_KEY!, 'base64'
  );

  async verify(pluginId: string, version: string): Promise<VerificationResult> {
    // Step 1: Load artifact + signature from MinIO
    const artifactPath = `plugins/${pluginId}/${version}/`;
    const [manifest, artifact, signature] = await Promise.all([
      this.minio.getObject('tradeora-plugin-registry', `${artifactPath}manifest.yaml`),
      this.minio.getObject('tradeora-plugin-registry', `${artifactPath}docker-image.tar.gz`),
      this.minio.getObject('tradeora-plugin-registry', `${artifactPath}certification.sig`),
    ]);

    // Step 2: Verify Ed25519 signature (produced by Tradeora CA during certification)
    const isSignatureValid = await crypto.subtle.verify(
      'Ed25519',
      await crypto.subtle.importKey('raw', this.TRADEORA_CERT_PUBLIC_KEY, 'Ed25519', false, ['verify']),
      signature,
      artifact,
    );

    if (!isSignatureValid) {
      throw new PluginTamperingError(
        `Plugin ${pluginId}@${version} signature verification FAILED. Plugin will not load.`
      );
    }

    // Step 3: Verify artifact SHA-256 matches registry metadata
    const artifactHash = crypto.createHash('sha256').update(artifact).digest('hex');
    const registryRecord = await this.db.query(
      'SELECT docker_sha256 FROM plugin_registry.plugins WHERE id=$1',
      [pluginId]
    );

    if (artifactHash !== registryRecord.rows[0].docker_sha256) {
      throw new PluginTamperingError(`Plugin artifact hash mismatch for ${pluginId}@${version}`);
    }

    return { verified: true, pluginId, version, artifactHash };
  }
}
```

---

## Section 10 — Plugin Health Monitoring

### 10.1 Plugin Health Metrics (Prometheus)

```yaml
# Every plugin MUST expose these metrics on :9090/metrics
# Enforced by the plugin health checker (scrapes every 15 seconds)

# Counter: Total number of invocations
plugin_invocations_total{plugin_id, version, status="success|error|timeout"} counter

# Histogram: Execution duration
plugin_execution_duration_seconds{plugin_id, version} histogram
  buckets: [0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0]

# Gauge: Plugin health status (1=healthy, 0=degraded, -1=failed)
plugin_health_status{plugin_id, version} gauge

# Counter: Data items processed (for Data Connector plugins)
plugin_data_items_processed_total{plugin_id, data_type} counter

# Gauge: External API latency (for Data Connector plugins)
plugin_external_api_latency_seconds{plugin_id, host} gauge
```

### 10.2 Plugin Circuit Breaker

```typescript
// packages/plugin-runtime/src/circuit-breaker/plugin-circuit-breaker.ts

export class PluginCircuitBreaker {
  // State: CLOSED (normal) → OPEN (blocked) → HALF_OPEN (testing)
  
  private readonly FAILURE_THRESHOLD = 5;      // 5 failures in window
  private readonly FAILURE_WINDOW_MS = 60_000; // 60 second window
  private readonly RECOVERY_TIMEOUT_MS = 30_000; // Try again after 30s
  private readonly SUCCESS_THRESHOLD = 2;       // 2 successes to close

  async callPlugin(pluginId: string, input: PluginInput): Promise<PluginOutput> {
    const state = await this.stateStore.getState(pluginId);

    if (state === 'OPEN') {
      const lastFailure = await this.stateStore.getLastFailureTime(pluginId);
      if (Date.now() - lastFailure < this.RECOVERY_TIMEOUT_MS) {
        // Circuit is OPEN — reject immediately, don't wait for plugin
        throw new PluginCircuitOpenError(
          `Plugin ${pluginId} circuit breaker OPEN. Service degraded gracefully.`
        );
      }
      // Move to HALF_OPEN — allow one test call through
      await this.stateStore.setState(pluginId, 'HALF_OPEN');
    }

    try {
      const result = await this.executePlugin(pluginId, input);
      await this.recordSuccess(pluginId);
      return result;
    } catch (error) {
      await this.recordFailure(pluginId, error);
      throw error;
    }
  }
}
```

### 10.3 Plugin Grafana Dashboard Panels

```yaml
panels:
  - title: "Active Plugin Health Overview"
    type: stat
    targets:
      - expr: "plugin_health_status"
        legendFormat: "{{ plugin_id }} v{{ version }}"
    # Color: green=1 (healthy), yellow=0 (degraded), red=-1 (failed)

  - title: "Plugin Execution Latency P99"
    type: timeseries
    targets:
      - expr: "histogram_quantile(0.99, rate(plugin_execution_duration_seconds_bucket[5m]))"
        legendFormat: "{{ plugin_id }}"
    thresholds:
      - value: 1.0  color: yellow   # Warning: > 1s
      - value: 5.0  color: red      # Critical: > 5s (budget exceeded)

  - title: "Plugin Error Rate"
    type: timeseries
    targets:
      - expr: |
          rate(plugin_invocations_total{status="error"}[5m])
          / rate(plugin_invocations_total[5m])
        legendFormat: "{{ plugin_id }} error rate"
    thresholds:
      - value: 0.01  color: yellow
      - value: 0.05  color: red

  - title: "EGX Data Connector Tick Rate"
    type: gauge
    targets:
      - expr: "rate(plugin_data_items_processed_total{plugin_id='egx-data-connector'}[1m])"
    # Should show ~100-500 ticks/second during EGX session
```

---

## Section 11 — EGX Data Connector Plugin — Reference Implementation

Full specification of the built-in EGX Data Connector (Phase 1 reference plugin):

```proto
// proto/tradeora/plugin/data_connector/v1/egx_connector.proto
syntax = "proto3";
package tradeora.plugin.data_connector.v1;

service EGXDataConnectorService {
  // Called by platform on startup — plugin returns its capabilities
  rpc GetCapabilities(GetCapabilitiesRequest) returns (GetCapabilitiesResponse);

  // Streaming: plugin pushes ticks to platform
  rpc StreamMarketTicks(StreamTicksRequest) returns (stream MarketTick);

  // One-shot: platform requests current snapshot
  rpc GetCurrentSnapshot(SnapshotRequest) returns (MarketSnapshot);

  // Health check: platform polls every 15 seconds
  rpc HealthCheck(HealthCheckRequest) returns (HealthCheckResponse);
}

message MarketTick {
  string ticker = 1;          // EGX ticker: "COMI", "ETEL"
  string isin = 2;            // ISIN: "EGS60121C018"
  string price = 3;           // Decimal string — NEVER float
  string volume = 4;          // Decimal string
  string timestamp_utc = 5;   // ISO 8601 UTC
  string session_state = 6;   // "PRE_OPEN" | "OPEN" | "CLOSING" | "CLOSED"
  string source = 7;          // Data vendor name for audit
}

message HealthCheckResponse {
  enum Status {
    HEALTHY = 0;
    DEGRADED = 1;   // Operating with reduced data (e.g., some tickers missing)
    FAILED = 2;     // Plugin cannot provide data
  }
  Status status = 1;
  string message = 2;
  int64 last_tick_timestamp_ms = 3;
  int32 active_subscriptions = 4;
}
```

```python
# Plugin implementation (Python gRPC sidecar)
# services/plugins/egx-data-connector/src/main.py

import grpc
from decimal import Decimal
from concurrent import futures
from tradeora.plugin.data_connector.v1 import egx_connector_pb2_grpc

class EGXDataConnectorServicer(egx_connector_pb2_grpc.EGXDataConnectorServiceServicer):
    def __init__(self):
        self.feed_client = EGXFeedClient(
            url=os.environ['EGX_FEED_URL'],
            api_key=os.environ['EGX_API_KEY'],  # Injected by OpenBao agent
        )

    def StreamMarketTicks(self, request, context):
        """
        Stream real-time EGX ticks to the Tradeora platform.
        Uses Decimal for all price values — NEVER float.
        """
        for raw_tick in self.feed_client.subscribe(request.tickers):
            # Critical: price MUST be Decimal string, never float
            price_decimal = Decimal(str(raw_tick['price']))  # str() prevents float contamination
            
            yield MarketTick(
                ticker=raw_tick['ticker'],
                isin=raw_tick['isin'],
                price=str(price_decimal),    # Decimal → string for protobuf
                volume=str(Decimal(str(raw_tick['volume']))),
                timestamp_utc=raw_tick['timestamp'],
                session_state=raw_tick['session_state'],
                source='EGX_DIRECT_FEED_v2',
            )
```

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DOCUMENT FOOTER                                                             ║
║  Document: PLUGIN_ARCHITECTURE.md                                           ║
║  Version:  1.0.0 (expanded)                                                  ║
║  Owner:    Platform Architecture Working Group                              ║
║  Completeness: 98% — Security model, registry schema, certification         ║
║    verification, health monitoring, circuit breaker, and EGX reference      ║
║    plugin all fully specified.                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```
