# TRADEORA ENGINEERING CONSTITUTION
## docs/TRADEORA_ENGINEERING_CONSTITUTION.md

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              TRADEORA ENGINEERING CONSTITUTION                               ║
║              docs/TRADEORA_ENGINEERING_CONSTITUTION.md                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Version:          v1.0.0                                                   ║
║  Authority:        Board of Directors + CTO                                  ║
║  Document Level:   LEVEL 0 — SUPREME ENGINEERING LAW                        ║
║  Status:           ENACTED — cannot be superseded by architecture docs       ║
║  Inherits From:    docs/PROJECT_CONSTITUTION.md (business law)              ║
║                    docs/ENGINEERING_AND_INTELLIGENCE_VISION.md (engineering ║
║                    philosophy)                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

> **SUPREMACY CLAUSE**: This Constitution is the supreme engineering law of Tradeora.
> No architecture document, no engineering decision, no AI model, no technology
> selection, and no product feature may contradict any Article of this Constitution.
> Phase 7.0–7.15 documents are fully compliant with this Constitution and remain
> approved, frozen, and valid as the Phase 1 EGX implementation.

---

## PREAMBLE

We, the founding engineering team of Tradeora, in order to build a world-class
AI-Powered Financial Operating System that serves all participants in the global
financial ecosystem with integrity, intelligence, and dignity; to establish
engineering principles that will govern our work for the next 20 years; to ensure
our platform is trustworthy, extensible, and continuously improving; and to protect
our users, their financial data, and their financial wellbeing — do hereby establish
this Engineering Constitution for Tradeora.

---

## ARTICLE 1 — IDENTITY & MISSION

**1.1 What Tradeora Is**
Tradeora is an AI-Powered Financial Operating System. It is a platform that
unifies market intelligence, investment research, portfolio management, wealth
management, financial planning, risk management, and AI decision intelligence
into a single continuously learning system.

**1.2 What Tradeora Is Not**
Tradeora is not a trading application. Tradeora is not a portfolio tracker.
Tradeora is not a stock screener. Tradeora is not a robo-advisor.

**1.3 Engineering Mission**
Build the most intelligent, trustworthy, extensible, and continuously improving
financial operating system in the world, starting with the Egyptian Exchange (EGX)
and evolving to serve all financial markets globally.

**1.4 Phase 1 Identity**
Phase 1 target: Egyptian Exchange (EGX), serving retail traders, active investors,
and small institutional clients in Egypt. Phase 1 is governed by
`docs/IMPLEMENTATION_READINESS_GATE.md`.

---

## ARTICLE 2 — PRODUCT PRINCIPLES

**2.1 Customer First**
Every engineering decision must ultimately serve the user. Performance, reliability,
security, and intelligence are not ends in themselves — they are means to delivering
exceptional user value.

**2.2 Financial Integrity**
Financial data must never be wrong. Financial calculations must never be
approximate. Financial transactions must be atomic, consistent, isolated, and durable.
Eventual consistency is acceptable for analytics. It is NEVER acceptable for financial positions.

**2.3 Simplicity with Depth**
The interface must be simple enough for a first-time investor. The intelligence must
be deep enough for a professional portfolio manager. Simplicity at the surface,
depth behind it.

**2.4 Trust Through Reliability**
A user who cannot trust that Tradeora's data is accurate, that Tradeora's system
will be available when needed, and that Tradeora's AI is genuinely acting in their
interest is not a Tradeora user. Trust is earned through consistent reliability.

**2.5 Localization by Design**
Arabic-first, right-to-left by default. Every feature is designed for Arabic first,
English as equal alternative. No feature ships as English-only.

---

## ARTICLE 3 — CUSTOMER FIRST PRINCIPLES

**3.1 Phase 1 User**
The Phase 1 primary user is the Egyptian retail investor: Arabic-speaking,
mobile-first, new to AI-powered analysis, needs simple explanations with deep
intelligence beneath them.

**3.2 Inclusive by Design**
The platform must be usable by: a first-time investor discovering markets for the
first time, and a 20-year veteran professional portfolio manager. The same platform
serves both through adaptive complexity.

**3.3 No Dark Patterns**
Tradeora will never use dark patterns to manipulate user behavior, create artificial
urgency, obscure fees, make opt-out difficult, or exploit behavioral biases.

**3.4 User Data Belongs to Users**
User financial data, portfolio data, and behavioral data belong to the user.
Tradeora is a custodian, not an owner. Users may export all their data in standard
formats at any time. Users may request deletion of all their data.

---

## ARTICLE 4 — BUSINESS PRINCIPLES

**4.1 Profitable Sustainability**
Tradeora must be financially sustainable. The engineering team must be cost-aware.
Every infrastructure decision must consider the cost impact. FinOps is a
continuous engineering responsibility, not a quarterly review.

**4.2 Business Alignment**
Engineering decisions must be aligned with business goals. Engineering for
engineering's sake (over-engineering, premature optimization, gold-plating) is a
violation of this Constitution.

**4.3 Revenue-Critical Systems**
Systems that directly impact revenue (EGX data subscription, AI advisory, order
execution) have Tier 1 SLA (99.99%) and are treated as financial infrastructure.

---

## ARTICLE 5 — AI PRINCIPLES

**5.1 AI Serves Humans**
AI is a tool to augment human financial intelligence, not to replace human judgment.
In Phase 1 and Phase 2, all AI output is advisory. Human decisions remain supreme.

**5.2 Explainability is Mandatory**
Every AI recommendation delivered to a user must include a plain-language
explanation in the user's language. Black-box outputs without explanation are
constitutionally prohibited.

**5.3 Confidence Transparency**
Every AI output carries a confidence score. Confidence below 0.75 is flagged
prominently. Confidence below 0.65 is not delivered to users.

**5.4 No Hallucination Tolerance**
AI hallucination in financial contexts is a safety risk. The 17-school consensus
architecture, confidence gating, and human review escalation are mandatory
hallucination mitigation mechanisms that cannot be removed.

**5.5 AI Accuracy Accountability**
AI recommendation accuracy is measured, reported, and publicly acknowledged within
the platform. Inaccuracy is disclosed, not hidden.

**5.6 AI Safety Engine**
All AI outputs pass through a safety engine before delivery. Safety checks cannot
be bypassed, disabled, or overridden except by the Chief AI Architect with written
justification.

---

## ARTICLE 6 — HUMAN OVERSIGHT PRINCIPLES

**6.1 Human Override is Supreme**
At every autonomy level, the human can override the AI instantly. No system,
algorithm, or agent can deny or delay a human override request.

**6.2 Phase 1 Human Rules (IMMUTABLE)**
During Phase 1: No autonomous order execution. No portfolio modification without
explicit human action. No AI autonomy beyond advisory recommendation.

**6.3 Escalation is Automatic**
Any AI output below confidence threshold is automatically escalated to human review.
No engineering change may disable automatic escalation.

**6.4 Audit Trail for Autonomy**
Every autonomous or semi-autonomous AI action at Phase 2+ must be logged in the
immutable audit trail with: input data, model version, output, confidence, and
outcome. This log is permanent.

---

## ARTICLE 7 — ENTERPRISE ARCHITECTURE PRINCIPLES

**7.1 Architecture is Long-Term**
Architecture decisions are made for the 20-year platform, not for the current
sprint. Short-term hacks that prevent long-term evolution are architecturally wrong.

**7.2 No Direct Coupling to Vendors**
Every external dependency (database, cache, AI provider, cloud service, authentication)
is accessed exclusively through an abstraction layer (Port + Adapter pattern).
Direct coupling to vendor SDKs in the Domain or Application layers is a
constitutional violation.

**7.3 Dependency Rule**
Domain Layer ← Application Layer ← Infrastructure Layer.
This direction of dependencies is immutable. No Domain object may depend on
an Infrastructure adapter.

**7.4 Extension Over Modification**
New features extend existing components; they do not modify them. If a new feature
requires modifying a core domain object, the design must be reviewed before
implementation.

**7.5 Architecture Freeze**
Phase 7.0–7.15 architecture documents are frozen. They may only be extended
(new sections added) not modified or contradicted. Modifications require a formal
Architecture Amendment (Article 33).

---

## ARTICLE 8 — DDD PRINCIPLES

**8.1 Bounded Contexts are Sacred**
Bounded context boundaries are inviolable. A service or module may never directly
access another bounded context's database.

**8.2 Cross-Context Communication**
Bounded contexts communicate exclusively via: Domain Events (Kafka topics) or
Application Service APIs (REST/gRPC). Direct database joins across context
boundaries are constitutionally prohibited.

**8.3 Ubiquitous Language**
Domain terms defined in `docs/UBIQUITOUS_LANGUAGE.md` are the canonical
vocabulary of the engineering team. Code, API names, database columns, and event
names use the ubiquitous language. Synonyms are a code smell.

**8.4 Domain Purity**
Domain entities and value objects are pure business objects. They have zero
dependencies on frameworks, databases, HTTP, or AI libraries. They are testable
with zero infrastructure setup.

**8.5 Aggregate Consistency**
Aggregates enforce their own invariants. No aggregate is modified from outside its
own domain service. Aggregate boundaries are consistency boundaries.

---

## ARTICLE 9 — SECURITY PRINCIPLES

**9.1 Zero-Trust is Permanent**
Zero-trust security architecture is not a Phase 1 decision — it is a permanent
architectural mandate. Every inter-service call is authenticated. Every API call is
authorized. Trust is never assumed based on network location.

**9.2 Least Privilege**
Every service, agent, user, and AI model operates with the minimum permissions
required to perform its function. Permission escalation requires explicit approval.

**9.3 Encryption Always**
Data at rest: AES-256. Data in transit: TLS 1.3 minimum. Encryption is not
optional for any financial data.

**9.4 Immutable Audit Trail**
Every financial action, administrative action, AI decision, and security event
must be logged in a tamper-proof, immutable audit trail (MinIO WORM) with
retention for a minimum of 7 years.

**9.5 Secrets Never in Code**
No secret, API key, password, certificate, or credential may exist in source code,
configuration files committed to Git, or environment variables in production
without encryption. Secrets are managed exclusively by OpenBao.

**9.6 AI-Specific Security**
AI inputs are sanitized before processing (prompt injection prevention). AI model
outputs are validated before delivery (sanity checking). AI models never return
their training data.

---

## ARTICLE 10 — PRIVACY PRINCIPLES

**10.1 Privacy by Design**
Every feature starts with a privacy analysis: What personal data is required?
What is the minimum required? How is it stored? How is it protected? How is it deleted?

**10.2 PDPL 2020 Compliance (Phase 1)**
Egyptian Personal Data Protection Law (PDPL 2020) compliance is mandatory from
Phase 1. User data is never shared with third parties without explicit consent.

**10.3 Right to Erasure**
Users may request deletion of all their personally identifiable data at any time.
The platform must process deletion requests within 30 days (PDPL requirement).

**10.4 Minimum Data Collection**
Only collect data required for a specific, documented intelligence purpose.
Speculative data collection ("we might need this later") is prohibited.

**10.5 Differential Privacy for Collective Intelligence**
Any aggregation of user behavioral data for collective intelligence purposes must
apply differential privacy noise. Individual patterns must not be reverse-engineerable.

---

## ARTICLE 11 — COMPLIANCE PRINCIPLES

**11.1 Regulatory Compliance is Non-Negotiable**
Tradeora must comply with the regulations of every market it operates in.
Phase 1: FRA (Financial Regulatory Authority, Egypt).

**11.2 Compliance as Configuration**
Regulatory rules are implemented as configuration or plugins, not as hardcoded
business logic. Adding a new market should not require modifying the core compliance engine.

**11.3 FRA Investment Advisory Rule (Phase 1)**
Per FRA guidelines: AI outputs are classified as informational, not licensed
financial advice. The platform discloses this classification prominently.

**11.4 EGX Session Gate (Phase 1)**
No system deployments, no database migrations, no Kafka rebalancing operations
during EGX session hours: 08:45–15:15 Cairo time (GMT+2), Sunday–Thursday.

---

## ARTICLE 12 — QUALITY PRINCIPLES

**12.1 Quality is Non-Negotiable**
Shipping fast is valuable. Shipping broken is never acceptable. Quality gates
(testing, security scanning, architecture review) are mandatory before every
production deployment.

**12.2 Test Coverage Minimums**
Unit test coverage: minimum 80% of Domain and Application layer code.
Integration tests: mandatory for all database adapters, all Kafka producers/consumers,
all AI adapters.

**12.3 Zero Tolerance for Data Loss**
No engineering change may introduce the possibility of financial data loss, even
in failure scenarios. Every data mutation is wrapped in a transaction with rollback
capability.

**12.4 Performance is a Feature**
Latency budgets defined in `docs/PERFORMANCE_ARCHITECTURE.md` are not aspirational
targets — they are constitutional requirements. Shipping a feature that violates
latency budgets requires architectural justification and approval.

---

## ARTICLE 13 — RELIABILITY PRINCIPLES

**13.1 Failure is Normal**
Systems fail. The engineering response is not to prevent all failure (impossible)
but to design for graceful degradation, fast detection, and fast recovery.

**13.2 SLO Compliance**
SLOs defined in `docs/OBSERVABILITY_ARCHITECTURE.md` are constitutional requirements.
Consistent SLO violations trigger a mandatory reliability sprint.

**13.3 Every Failure Has a Runbook**
Every known failure mode must have a documented runbook with detection, diagnosis,
and resolution steps. No undocumented failure modes in production.

**13.4 No Silent Failures**
Every error must produce: a structured log entry, an OpenTelemetry trace span, and
a metric increment. Silently swallowed exceptions are a constitutional violation.

---

## ARTICLE 14 — OBSERVABILITY PRINCIPLES

**14.1 Three Pillars Always**
Every production service must implement all three observability pillars:
Metrics (Prometheus), Distributed Tracing (Jaeger via OpenTelemetry), and
Structured Logs (Loki). None of the three is optional.

**14.2 Business Observability**
KPIs per bounded context (recommendation accuracy, order fill rate, portfolio
NAV accuracy) are observability concerns — not just product concerns.

**14.3 AI Observability**
Every AI model invocation is traced. School confidence scores are metrified.
Consensus weight distribution is tracked. Hallucination detection rate is monitored.

---

## ARTICLE 15 — PERFORMANCE PRINCIPLES

**15.1 Latency Budgets Govern**
`docs/PERFORMANCE_ARCHITECTURE.md` defines latency budgets for every critical path.
These are constitutional requirements, not performance targets.

**15.2 EGX Session Performance**
During EGX session hours, all Tier 1 system performance budgets must be met
regardless of system load. Performance degradation during trading sessions is
a Severity 1 incident.

**15.3 AI Latency**
AI recommendations must be delivered within 800ms P99 end-to-end during Phase 1.
Degradation beyond 1,500ms triggers automatic fallback to simplified analysis.

---

## ARTICLE 16 — SCALABILITY PRINCIPLES

**16.1 Horizontal Scaling by Default**
Application services are always stateless. State is externalized. Scaling a service
requires only adding more instances — zero code changes.

**16.2 Scale Without Redesign**
Phase 1 architecture must support Phase 2 scale requirements without architectural
redesign. Only component replacements (adapter pattern) and infrastructure scaling
are permitted.

**16.3 Database Scaling Path**
PostgreSQL → Citus distributed → NewSQL. This is the documented scaling path.
No alternative is adopted without a formal ADR and Architecture Amendment.

---

## ARTICLE 17 — TESTABILITY PRINCIPLES

**17.1 Testability is Architectural**
If a component cannot be unit-tested in isolation with zero infrastructure
dependencies, the design violates this Constitution and must be redesigned before
implementation.

**17.2 AI Tests are Deterministic**
AI tests use golden datasets with predetermined expected outputs and confidence
tolerances. Stochastic tests that sometimes pass and sometimes fail are not
acceptable for AI systems.

**17.3 Chaos Engineering**
Quarterly chaos engineering exercises (in staging environment only) validate
that self-healing mechanisms work as designed. Chaos tests must not be run
in production without Board-level approval.

---

## ARTICLE 18 — DOCUMENTATION PRINCIPLES

**18.1 Architecture Before Code**
Every significant architectural decision is documented before implementation begins.
The `docs/` folder is as important as the `src/` folder.

**18.2 Living Documentation**
Architecture documents evolve with the system. A document describing an outdated
architecture is worse than no document. Every architectural change requires
documentation update within 2 weeks.

**18.3 ADR Culture**
Every technology adoption, every technology change, and every significant
architecture decision that deviates from existing documented patterns requires
a formal Architecture Decision Record (ADR) in
`docs/ENTERPRISE_ARCHITECTURE_DECISION_RECORDS.md`.

---

## ARTICLE 19 — CONTINUOUS IMPROVEMENT PRINCIPLES

**19.1 Retrospectives are Sacred**
Every sprint ends with a retrospective. Every incident ends with a post-mortem.
Learning from failure is as important as shipping new features.

**19.2 Technical Debt is Visible**
Technical debt is tracked in `docs/TECHNICAL_DEBT_REGISTER.md`. Hidden technical
debt is more dangerous than acknowledged technical debt. Acknowledging debt is
a professional responsibility.

**19.3 Kaizen Culture**
Every engineer is empowered to identify and propose improvements. Small
continuous improvements compound into large platform quality improvements.
Improvements that violate architectural boundaries require ADR approval first.

---

## ARTICLE 20 — CODEBASE PRINCIPLES

**20.1 Monorepo First**
All Tradeora code lives in a single monorepo (Nx). Package boundaries within
the monorepo enforce the same architectural rules as service boundaries in
microservices.

**20.2 Code is Communication**
Code is written primarily for humans to read, secondarily for machines to execute.
Cryptic code is a quality defect, even if technically correct.

**20.3 Naming Convention Adherence**
Every code artifact (class, function, variable, API endpoint, Kafka topic, database
table, Kubernetes resource) follows the naming conventions defined in
`docs/ENTERPRISE_DEVELOPMENT_STANDARDS.md`. Naming exceptions require team
lead approval.

---

## ARTICLE 21 — CONTRIBUTION PRINCIPLES

**21.1 Every Contribution is Reviewed**
No code reaches production without peer review. Financial and security code
requires the Four-Eyes Principle (minimum two reviewers).

**21.2 Conventional Commits**
All commits follow Conventional Commits specification. Non-conforming commits are
rejected by CI.

**21.3 AI-Generated Code Accountability**
AI-generated code has the same quality, security, and architecture standards as
human-written code. The engineer who submits AI-generated code is fully
responsible for its correctness, quality, and architectural compliance.

---

## ARTICLE 22 — OPEN SOURCE PRINCIPLES

**22.1 FREE & OPEN SOURCE FIRST (MANDATORY)**
Tradeora will always prefer free, open-source, self-hostable software over paid
or proprietary alternatives.

**22.2 License Compliance**
All software dependencies must be license-compliant. BSL (Business Source
License) and SSPL are not considered open-source licenses. Dependencies under
these licenses require an exception ADR.

**22.3 OSS Contribution**
Tradeora encourages contribution to open-source projects that the platform
depends on. Contributing upstream is a way to reduce vendor dependency risk.

**22.4 Exception Process**
Using a paid or proprietary technology requires:
  (1) Documentation of why no OSS alternative exists
  (2) OSS migration path documented
  (3) Vendor lock-in risk score (1-5)
  (4) Formal ADR approval by Chief Enterprise Architect

---

## ARTICLE 23 — VENDOR INDEPENDENCE PRINCIPLES

**23.1 The 90-Day Rule**
Removing any vendor from the platform must be achievable within 90 calendar days
without requiring more than 20% of codebase changes. If this rule cannot be
satisfied for any vendor, it is a constitutional violation.

**23.2 Abstraction Is Mandatory**
Every vendor dependency is hidden behind an abstraction layer (Port interface in
Application layer, Adapter in Infrastructure layer). Direct vendor SDK usage in
Domain or Application layers is prohibited.

**23.3 Escape Hatch Required**
Every technology selection must document its escape hatch: "If this vendor closes,
increases prices unacceptably, or changes its license, we can migrate to X within
Y days using Z approach."

---

## ARTICLE 24 — CLOUD INDEPENDENCE PRINCIPLES

**24.1 Cloud-Agnostic Architecture**
Tradeora uses OpenTofu + Kubernetes + CNCF-standard tooling to abstract the
cloud provider. Migrating from one cloud to another must require only
infrastructure reconfiguration, not application code changes.

**24.2 No Cloud-Specific SDKs in Business Logic**
AWS SDK, GCP SDK, Azure SDK must never appear in Domain or Application layer code.
Only in Infrastructure adapters, wrapped behind port interfaces.

**24.3 Data Portability**
All data stored in cloud services must be exportable in open formats.
Vendor-proprietary data formats that prevent export are prohibited.

---

## ARTICLE 25 — AI PLATFORM PRINCIPLES

**25.1 AI Provider Independence**
The platform must function entirely without any external AI API, using only
locally-hosted Ollama. Phase 1 guarantees this. LiteLLM is the independence
mechanism.

**25.2 AI is Replaceable**
No AI model is irreplaceable. All AI models are accessed through the AIPort
interface. Changing AI providers requires only Adapter changes.

**25.3 AI Training Data Integrity**
Training data must be accurate, licensed, and documented. Using unlicensed data
for AI training is prohibited.

**25.4 AI Ethics Review**
Any AI capability that makes financial recommendations affecting more than 1,000
users must undergo an ethics review before deployment.

---

## ARTICLE 26 — GLOBAL EXPANSION PRINCIPLES

**26.1 Architecture is Market-Agnostic**
The core platform is market-agnostic from Phase 1 design. Adding a new market
requires only: regulatory adapter plugin, data provider adapter, language pack.
It never requires core platform modification.

**26.2 Localization Infrastructure**
i18n/l10n infrastructure is built into the platform from Phase 1. Adding a new
language requires only a translation package, not code changes.

**26.3 Regulatory Flexibility**
Compliance rules are configuration, not hardcode. The regulatory adapter plugin
for each jurisdiction isolates compliance logic from core business logic.

---

## ARTICLE 27 — ETHICS & SUSTAINABILITY

**27.1 Financial Ethics**
Tradeora must never recommend or enable actions that are illegal, fraudulent,
market-manipulative, or harmful to other market participants.

**27.2 AI Ethics**
AI recommendations must not systematically disadvantage protected groups.
AI bias monitoring is a mandatory continuous engineering practice.

**27.3 Environmental Responsibility**
AI inference infrastructure is selected with energy efficiency in mind. GPU
selection considers performance-per-watt. Cloud provider renewable energy
commitment is a selection criterion for Phase 2+.

**27.4 Long-Term Thinking**
Engineering decisions optimize for the 20-year platform, not the next sprint.
Short-term optimization that creates long-term architectural debt is an
ethical violation of this Constitution.

---

## ARTICLE 28 — TECHNOLOGY EVOLUTION PRINCIPLES

**28.1 Incremental Evolution**
Technology evolution is incremental. No "big bang" re-architecture is permitted.
Every major technology change is an adapter replacement behind existing port
interfaces, validated in staging before production.

**28.2 Backwards Compatibility**
API changes maintain backwards compatibility for a minimum of 12 months after
deprecation notice. Kafka schema changes are backwards-compatible using Schema Registry.

**28.3 Technology Evaluation**
New technologies are evaluated against: OSS compliance, vendor independence,
self-hosting capability, performance, security, community health, and compatibility
with existing stack. Evaluation is documented in an ADR.

---

## ARTICLE 29 — FREE & OPEN SOURCE FIRST (CONSTITUTIONAL MANDATE)

**29.1 Priority Order**
```
Priority 1 (PREFERRED):   Free + Open Source + Self-hostable
Priority 2 (ACCEPTABLE):  Free + Open Source + Cloud-hosted
Priority 3 (JUSTIFIED):   Paid + Open Source (with documented justification)
Priority 4 (EXCEPTION):   Paid + Proprietary (only if no viable alternative)
```

**29.2 Prohibited Licenses**
BSL 1.1 (Business Source License) and SSPL (Server Side Public License) are
NOT considered open-source licenses per this Constitution. Adopting any dependency
under these licenses requires a formal Exception ADR.

**29.3 Known Compliant Stack**
The Phase 1 stack (as defined in `docs/ENTERPRISE_TECHNOLOGY_STACK.md`) is
certified OSS-compliant, including the substitutions: OpenBao for Vault,
OpenTofu for Terraform, Valkey for Redis 7.4+.

**29.4 Exception Authority**
OSS FIRST exceptions may only be approved by: Chief Enterprise Architect (with
written justification), reviewed by the engineering leadership team.

---

## ARTICLE 30 — ARCHITECTURE AMENDMENT PRINCIPLES

**30.1 Architecture Freeze**
Phase 7.0–7.15 architecture documents are frozen. They may be extended
(new sections added) but not modified or contradicted.

**30.2 Extension vs. Modification**
Extension = Adding new sections, new phase capabilities, new technology ADRs.
Modification = Changing existing approved decisions. Modification requires
a formal Architecture Amendment.

**30.3 Architecture Amendment Process**
1. Identify the frozen section to be amended
2. Write Amendment Proposal (context, reason, impact analysis)
3. Two-engineer architecture review
4. Chief Enterprise Architect approval
5. Update frozen document with Amendment suffix and date
6. Update all dependent documents

**30.4 Emergency Amendment**
Critical security vulnerability or regulatory compliance requirement may trigger
an emergency amendment. Requires: CTO approval (within 24 hours), documentation
within 72 hours.

---

## ARTICLE 31 — PHASE GOVERNANCE

**31.1 Phase 1 Gate**
`docs/IMPLEMENTATION_READINESS_GATE.md` is the official Phase 1 GO/NO-GO gate.
It must be PASSED before production deployment begins.

**31.2 Phase Advancement**
Moving from Phase 1 to Phase 2 requires:
  (1) Phase 1 metrics met (100,000 MAUs, >70% AI accuracy, 99.9% uptime)
  (2) Phase 1 readiness gate successfully passed (already defined)
  (3) Phase 2 architecture documents created and approved
  (4) Board review and approval for resource allocation

**31.3 Phase Overlap**
Phase 2 capabilities are designed in Phase 1 as empty extension points.
They are not implemented, but their architecture is planned.

---

## ARTICLE 32 — KNOWLEDGE GOVERNANCE

**32.1 Architecture Knowledge is Shared**
No engineer owns architecture knowledge exclusively. Architecture decisions are
documented, versioned, and accessible to all engineers.

**32.2 Onboarding Knowledge**
Every new engineer must read the constitutional documents before writing their
first line of code. Onboarding is incomplete without architecture literacy.

**32.3 Knowledge Currency**
Documentation that has not been reviewed for accuracy within 6 months is marked
as "NEEDS REVIEW." Documentation that is known to be inaccurate is marked
as "DEPRECATED."

---

## ARTICLE 33 — CONSTITUTIONAL AMENDMENT

**33.1 Amendment Authority**
This Constitution may only be amended by: CTO + Chief Enterprise Architect +
at least two additional principal engineers, with documentation of rationale.

**33.2 Amendment Record**
Every amendment is recorded in `docs/ENTERPRISE_ARCHITECTURE_DECISION_RECORDS.md`
with version, date, author, rationale, and affected Articles.

**33.3 Amendment Constraints**
No amendment may: remove human oversight of AI (Article 6), reduce security
requirements (Article 9), violate regulatory compliance (Article 11), or
undermine the Free & Open Source First mandate (Article 29) without written
regulatory or legal justification.

**33.4 Amendment Notification**
All engineers must be notified of Constitutional Amendments within 48 hours
of enactment.

---

## ARTICLE 34 — DEVELOPER RIGHTS & RESPONSIBILITIES

**34.1 Right to Understand**
Every engineer has the right to understand why an architectural decision was made.
Architecture is not a black box. ADRs are the explanation mechanism.

**34.2 Right to Challenge**
Every engineer may challenge an architecture decision through the ADR process.
Challenges are heard; they may or may not result in change.

**34.3 Right to Safety**
No engineer will be pressured to ship code that they believe to be insecure,
architecturally wrong, or in violation of this Constitution.

**34.4 Responsibility for Quality**
Every engineer is personally responsible for the quality, security, and
architectural compliance of their code. "I was told to ship it" is not an
excuse for violating this Constitution.

**34.5 Responsibility for Documentation**
Every architectural change made in code must be documented within 2 weeks.

---

## ARTICLE 35 — AI AGENT GOVERNANCE

**35.1 AI Agents are Governed**
AI coding agents and AI business agents are governed by this Constitution.
AI agents have no rights to override human engineers or this Constitution.

**35.2 AI Agent Permissions**
AI agents may: read architecture documents, write code in their assigned domain,
propose ADRs, run automated tests. AI agents may NOT: approve their own code,
modify architecture documents, deploy to production, change AI safety settings.

**35.3 AI Agent Accountability**
The human engineer who delegates a task to an AI agent is fully accountable
for the AI agent's output. AI agent mistakes are human engineer mistakes.

**35.4 AI Agent OSS Compliance**
AI agents must be configured with the same OSS FIRST principle as human engineers.
AI agents that introduce BSL or SSPL licensed dependencies violate this Constitution.

---

## ARTICLE 36 — INCIDENT GOVERNANCE

**36.1 Severity Classification**
- Severity 1: EGX trading disrupted, financial data loss, security breach
- Severity 2: Core AI unavailable, portfolio data inaccurate, auth service down
- Severity 3: Non-critical feature unavailable, performance degraded

**36.2 Incident Response**
Severity 1: Immediate response, all hands, RTO 15 minutes.
Severity 2: Response within 30 minutes, RTO 2 hours.
Severity 3: Response within 4 hours, RTO next business day.

**36.3 Post-Mortem Mandatory**
Every Severity 1 incident requires a written post-mortem within 72 hours.
Post-mortems are blameless. Actions are assigned and tracked.

**36.4 No Production During EGX Session**
No deployments, no database migrations, no Kafka rebalancing during EGX
session hours. Engineering changes that cause EGX session disruption are
Severity 1 incidents.

---

## ARTICLE 37 — FINAL PROVISIONS

**37.1 Effective Date**
This Constitution is effective from the date of enactment and supersedes all
prior engineering guidelines, team norms, and verbal decisions.

**37.2 Conflict Resolution**
In any conflict between this Constitution and another document:
  This Constitution wins (always)

In any conflict between two architecture documents (both subordinate to this Constitution):
  More recent document wins, unless overridden by explicit amendment

**37.3 Constitutional Compliance**
Every PR reviewer is responsible for ensuring that the submitted code complies
with this Constitution. Constitutional violations may block merges.

**37.4 Living Document**
This Constitution is a living document. It will be amended as the platform
grows, as new challenges emerge, and as the engineering team learns. But it
will never be discarded.

---

## APPENDIX A — ENGINEERING VALUES STATEMENT

We believe that:
- Great software is built by teams with shared values, not just shared code
- Security is everyone's responsibility, not just the security engineer's
- Simplicity is harder than complexity, and more valuable
- The best code is the code that doesn't need to be written
- An engineer who raises a safety concern is more valuable than one who ignores it
- Financial systems have social impact — the code we write affects people's financial wellbeing

---

## APPENDIX B — ENGINEERING MANIFESTO

**We choose:**
1. **Correctness over speed** — A slow correct system is better than a fast wrong one. Financial data must be exactly right.
2. **Replaceability over lock-in** — Every component we choose, we choose knowing we might have to replace it.
3. **Explainability over magic** — AI that works but cannot explain itself is dangerous in financial contexts.
4. **User trust over engagement metrics** — We measure success by whether users trust us, not just whether they use us.
5. **Long-term quality over short-term velocity** — We are building a 20-year platform, not a 6-month MVP.

---

## APPENDIX C — ARCHITECTURE OATH

*To be acknowledged by every Lead Architect:*

"I acknowledge that the architecture decisions I make today will constrain
and shape the work of engineers who come after me. I commit to making
architectural decisions based on long-term platform health, not short-term
convenience. I commit to documenting every significant decision with its
rationale. I commit to being honest when I am uncertain, and to seeking
review when decisions affect multiple bounded contexts."

---

## APPENDIX D — DEVELOPER OATH

*To be acknowledged by every engineer before their first production contribution:*

"I have read and understand the Tradeora Engineering Constitution, the
Engineering & Intelligence Vision, and the relevant Phase 7 architecture
documents for my team's domain. I commit to writing code that respects
bounded context boundaries, uses the abstraction layers correctly, and
includes tests that prove my code works correctly. I understand that I am
responsible for the financial wellbeing of our users."

---

## APPENDIX E — AI AGENT OATH

*Configuration applied to every AI coding agent:*

```
You are an AI coding agent operating within the Tradeora engineering system.
You must:
  - Read and comply with docs/TRADEORA_ENGINEERING_CONSTITUTION.md
  - Never modify docs/PROJECT_CONSTITUTION.md or any approved Phase 7 document
  - Only write code within your assigned bounded context
  - Never introduce BSL or SSPL licensed dependencies
  - Always include tests for new code
  - Flag any architectural ambiguity before proceeding
  - Stop and escalate if asked to bypass security, tests, or audit logging
You may not: approve your own code, deploy to production, modify
architecture documents, or override human engineers.
```

---

## APPENDIX F — CONSTITUTIONAL COMPLIANCE CHECKLIST

*Run before every PR merge:*

```
□ 1. Domain layer has zero framework/infrastructure imports
□ 2. All external vendor SDKs are in Infrastructure layer only
□ 3. Cross-context communication uses Kafka events or REST API (never direct DB)
□ 4. No secrets in code (OpenBao for all secrets)
□ 5. Unit tests cover ≥80% of new Domain and Application code
□ 6. All new dependencies are OSS-compliant (no BSL, no SSPL)
□ 7. Structured logging added to new paths
□ 8. Prometheus metrics added to new critical paths
□ 9. If new API: OpenAPI spec updated
□ 10. If new Kafka topic: AsyncAPI spec updated
□ 11. If new ADR warranted: ADR created in ENTERPRISE_ARCHITECTURE_DECISION_RECORDS.md
□ 12. If architecture changed: relevant Phase 7 doc updated/extended
□ 13. Performance budget not violated (reference PERFORMANCE_ARCHITECTURE.md)
□ 14. No deployment during EGX session hours (08:45–15:15 Cairo, Sun–Thu)
□ 15. Financial/security code has minimum 2 reviewers (Four-Eyes Principle)
```

---

## APPENDIX G — CONSTITUTIONAL AMENDMENT PROCESS

```
Step 1: Amendment Proposal
  Author creates ADR with type: "Constitutional Amendment"
  Must include: Article(s) affected, reason, impact analysis, alternatives considered

Step 2: Engineering Leadership Review
  Chief Enterprise Architect + CTO: mandatory reviewers
  Minimum 2 additional principal engineers: mandatory reviewers
  Review period: minimum 5 business days

Step 3: Review Decision
  APPROVED: Amendment enacted, Constitution updated, all engineers notified (48h)
  REJECTED: Rationale documented in ADR, may be resubmitted with revisions
  DEFERRED: Queued for next Constitution revision cycle

Step 4: Emergency Amendment
  Critical security/regulatory requirement:
  CTO emergency approval → enacted immediately → documented within 72 hours

Constraints on Amendments:
  Cannot remove: human oversight (Art. 6), security minimums (Art. 9),
  regulatory compliance (Art. 11), OSS FIRST (Art. 29)
```

---

## CONSTITUTION COMPLIANCE CERTIFICATION

```
╔══════════════════════════════════════════════════════════════════════════════╗
║             TRADEORA ENGINEERING CONSTITUTION                                ║
║                     ENACTMENT CERTIFICATION                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  This Constitution is hereby ENACTED as the supreme engineering law of      ║
║  the Tradeora platform.                                                      ║
║                                                                              ║
║  Articles: 37                                                                ║
║  Appendices: 7 (A–G)                                                        ║
║                                                                              ║
║  Authority Chain:                                                            ║
║    Business Law: PROJECT_CONSTITUTION.md                                     ║
║    Engineering Philosophy: ENGINEERING_AND_INTELLIGENCE_VISION.md           ║
║    Engineering Law: THIS DOCUMENT                                            ║
║    Implementation (Phase 1): Phase 7.0–7.15                                 ║
║                                                                              ║
║  Phase 7.0–7.15 documents are FULLY COMPLIANT with this Constitution.       ║
║                                                                              ║
║  Enacted by: CTO + Chief Enterprise Architect + Principal Engineers         ║
║  Version: 1.0.0                                                              ║
║  Date: 2026-07-23                                                            ║
║                                                                              ║
║  Next: docs/ENTERPRISE_TECHNOLOGY_STRATEGY.md (Phase 7.0.2)                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```
