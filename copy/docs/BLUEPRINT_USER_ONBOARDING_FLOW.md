# BLUEPRINT: User Onboarding Flow
**Document ID:** BLUEPRINT-USER-ONBOARD-001  
**Version:** 2.0.0  
**Status:** ACTIVE  
**Authority:** PDPL 2020 (Egypt Personal Data Protection Law), FRA Capital Markets Regulation, CBE Digital Banking Guidelines  
**Last Updated:** 2026-07-24  
**Classification:** INTERNAL — Architecture Team  
**Owner:** Product Engineering & Compliance  

---

## Section 1 — Blueprint Authority & Scope

### Constitutional Mandate: PDPL 2020 Compliance Requirements
The Egyptian Personal Data Protection Law (PDPL), Law No. 151 of 2020, establishes the foundational legal framework for data privacy in Egypt. As an entity collecting, processing, and storing sensitive personally identifiable information (PII) and financial data, Tradeora must strictly adhere to its provisions. This mandate requires explicit consent for data collection, the implementation of robust technical and organizational security measures, and the appointment of a Data Protection Officer (DPO). The law specifically dictates how biometric data (such as the required selfie for liveness checks) and National ID information are handled, mandating localized storage within Egypt unless explicitly authorized for cross-border transfer.

### FRA Regulations for Investor Onboarding
The Financial Regulatory Authority (FRA) oversees capital markets in Egypt and dictates the onboarding requirements for retail investors. The FRA mandates a rigorous Know Your Customer (KYC) process, risk tolerance assessment, and investment experience declaration before an investor can participate in the market. The onboarding process must ensure the accurate identification of the beneficial owner and assess their suitability for various financial products. All digital onboarding flows must maintain an unalterable audit trail of the KYC approval process.

### CBE Digital Banking Guidelines for KYC
While Tradeora primarily operates under FRA regulations for capital markets, we align our identity verification standards with the Central Bank of Egypt (CBE) Digital Banking Guidelines to ensure the highest level of security and to prepare for future banking integrations. This includes multi-factor authentication (MFA) requirements, secure session management, and stringent Anti-Money Laundering (AML) screening protocols during the initial account creation phase.

### Definition of 'Onboarding' in the Tradeora Context
Within the Tradeora ecosystem, "onboarding" encompasses the complete end-to-end journey from initial app installation to becoming a fully authorized and active user capable of receiving investment recommendations. This process includes:
1. **Registration:** Secure collection of contact details and credential establishment.
2. **Identity Verification:** Validation of the user's phone number and National ID.
3. **KYC Submission:** Collection of government-issued documents and biometric liveness data.
4. **Account Activation:** Creation of the user's initial portfolio and subscription assignment upon successful KYC review.

### Phase 1 Onboarding: Digital Self-Service
Phase 1 focuses on a completely digital, self-service onboarding flow for retail investors. Users verify their identity using their Egyptian National ID card and a live selfie. The KYC process is partially automated (OCR, image quality, preliminary AML checks) and partially manual (final review by a certified KYC officer). This phase establishes the Tradeora account but does not immediately link to a brokerage execution account.

### Phase 2+ Onboarding: Broker-Linked Accounts (Future Scope)
Phase 2 will introduce the integration of licensed Egyptian brokers directly into the onboarding flow. This will require additional legal agreements, potential wet-signature equivalent digital signatures, and direct API integrations with broker back-office systems. 

### Out of Scope
The following are explicitly out of scope for this blueprint:
- Phase 2 broker integration and trade execution onboarding.
- Institutional investor onboarding (which requires corporate documents, board resolutions, and complex UBO identification).
- Non-Egyptian resident onboarding.

---

## Section 2 — Onboarding Architecture Overview

The onboarding architecture leverages a microservices-based approach, ensuring scalability, security, and clear separation of concerns.

### Component Descriptions and Responsibilities

*   **Flutter App:** The primary mobile client, compiled for both iOS and Android. It handles all user interface rendering, input validation, camera access for document capture, and liveness checks. It communicates exclusively through the API Gateway.
*   **API Gateway (Kong):** The unified entry point for all client requests. Responsibilities include rate limiting, TLS termination, request routing, and initial JWT token validation for authenticated routes.
*   **UserIdentity BC (Bounded Context):** The core service managing the user aggregate. It handles the orchestration of the activation lifecycle, coordinating state changes from registration to active status.
*   **Authentication BC (Keycloak):** A centralized identity and access management system based on OAuth2/OpenID Connect (OIDC). It handles user credential storage, password policy enforcement, and JWT access/refresh token issuance.
*   **KYCVerification BC:** A dedicated service for managing the lifecycle of KYC documents. It handles presigned URL generation for secure uploads, triggers OCR extraction, computes image quality scores, and manages the queue for manual officer review.
*   **Compliance BC:** Responsible for all regulatory checks, primarily Anti-Money Laundering (AML) and sanctions list screening. It fuzzy-matches user details against international and local watchlists.
*   **PostgreSQL:** The primary relational data store. Each bounded context manages its own logical database or schema within the PostgreSQL cluster to ensure data sovereignty (e.g., `user_profile_db`, `kyc_status_db`).
*   **MinIO:** An S3-compatible object storage server. Used for the secure, encrypted, and immutable storage of all uploaded KYC documents (National IDs, selfies).
*   **Kafka:** The central event bus facilitating asynchronous communication between bounded contexts. It ensures reliable delivery of state changes (e.g., `KYCApproved` events triggering account activation).
*   **NotificationDelivery BC:** An abstraction layer for all outbound communications. It routes messages to the appropriate channels (SMS, email, push).
*   **Twilio / Vodafone Egypt:** The external SMS gateway providers. Twilio serves as the primary provider for OTP delivery, with a localized Vodafone Egypt Business SMS integration serving as an automated failover.

### Component Interaction Description

The typical interaction begins with the Flutter App sending requests through the API Gateway. For registration, the API Gateway routes the request to the UserIdentity BC. UserIdentity BC orchestrates the creation of the user record in Keycloak via the Admin REST API and triggers the NotificationDelivery BC to send an SMS OTP. 
During KYC, the Flutter App requests a presigned upload URL from KYCVerification BC, uploads documents directly to MinIO, and notifies KYCVerification BC upon completion. KYCVerification BC then emits a `KYCSubmitted` event on Kafka. The Compliance BC consumes this event, performs AML screening, and updates its internal state. Once a KYC officer approves the documents via the admin portal, KYCVerification BC emits a `KYCApproved` event on Kafka. The UserIdentity BC consumes this, activates the user, and emits a `UserActivated` event, triggering the creation of the initial portfolio and sending welcome notifications.

---

## Section 3 — Complete Onboarding Flow (Step by Step)

### Step 1: App Install & Language Selection
*   The Flutter app detects the device locale upon first launch.
*   If the locale is `ar_EG` (or any Arabic variant), the app defaults to the Arabic language interface.
*   The user can toggle between Arabic (Right-to-Left, RTL) and English (Left-to-Right, LTR) at any time.
*   Language preference is persisted locally using Flutter's `SharedPreferences`.
*   Typography: Arabic text utilizes the 'Cairo' font from Google Fonts, while English text utilizes 'Inter'.
*   The RTL layout engine is handled automatically by Flutter via the `Directionality` widget, ensuring UI elements flip seamlessly based on the selected language.

### Step 2: Phone Number Entry
*   Users must provide a valid Egyptian phone number. The required format is the country code (+20) followed by 10 digits.
*   Client-side validation regex: `^\+20[0-9]{10}$`
*   Phone number normalization occurs before processing: all spaces, dashes, and leading zeros (after the country code) are stripped.
*   The phone number is consistently stored and transmitted in E.164 format (e.g., +201001234567).
*   The API performs a `UserIdentity.phoneExists` query.
*   If the phone number is already registered, the registration flow is halted, and the user is presented with an 'Already registered — log in instead' message and a deep link to the login screen.

### Step 3: SMS OTP Generation & Delivery
*   A 6-digit numeric OTP is generated using a cryptographically secure random number generator (e.g., Python's `secrets.randbelow(1000000)`).
*   The OTP is hashed before being stored in Valkey (a Redis alternative) as `otp:{phone_hash}`. The Key has a Time-To-Live (TTL) of 300 seconds (5 minutes).
*   Delivery is orchestrated via Twilio SendGrid SMS as the primary provider. If the delivery fails or times out, a fallback to the Vodafone Egypt Business SMS gateway is triggered.
*   Rate limiting is strictly enforced: A maximum of 3 OTP sends per phone number per hour are allowed, tracked via a counter in Valkey.
*   SMS Template (Arabic): `رمز التحقق الخاص بك في Tradeora هو: {otp} صالح لمدة 5 دقائق`
*   SMS Template (English): `Your Tradeora verification code is: {otp} Valid for 5 minutes`

### Step 4: OTP Verification
*   Rate limit for verification attempts: 3 attempts per OTP session. Exceeding this triggers a 30-minute lockout.
*   The lockout state is stored in Valkey: `otp:lockout:{phone_hash}` with a TTL of 1800 seconds.
*   The verification process uses a timing-safe comparison function (e.g., Python's `hmac.compare_digest`) to prevent timing attacks.
*   On success: The phone number is marked as verified in the temporary registration context, and a short-lived session token (JWT, 10-minute TTL) is issued to authorize the next steps.
*   On failure: The attempt counter is decremented. The API returns a 401 Unauthorized status, indicating the remaining number of attempts.

### Step 5: Password Creation
*   Password policies align with NIST SP 800-63B guidelines, mandating a minimum length of 12 characters.
*   The proposed password is checked against the HaveIBeenPwned breach database using a k-anonymity API implementation to ensure it hasn't been compromised.
*   Specific complexity requirements (e.g., mandatory special characters) are avoided, as NIST discourages them in favor of length and breach checks.
*   The system blocks the use of the top 10,000 most common passwords.
*   Password hashing utilizes Argon2id with the following parameters: `time=3`, `memory=65536KB`, `parallelism=4`.
*   A client-side strength meter (e.g., utilizing the `zxcvbn` library in Flutter) provides real-time feedback to the user.

### Step 6: Keycloak Account Creation
*   The user account is created within the `tradeora-retail` Keycloak realm.
*   The `username` is set to the verified phone number (E.164 format).
*   Initial user attributes are injected: `onboarding_step=personal_info`, `kyc_status=PENDING`, `account_tier=FREE`.
*   Required actions are configured: `VERIFY_EMAIL` (if an email address is provided later in the flow) and optionally `configure-totp` (planned for Phase 2).
*   The creation is executed via a Keycloak Admin REST API call: `POST /admin/realms/tradeora-retail/users`.

### Step 7: Personal Information Entry
*   The user inputs their full name (in both Arabic and Latin characters), date of birth, and Egyptian National ID number.
*   Egyptian National ID validation logic:
    *   Must be exactly 14 digits.
    *   Century digit (1st digit): 2 signifies 1900s, 3 signifies 2000s.
    *   Birthdate (Digits 2-7): YYMMDD format. Must match the provided date of birth.
    *   Governorate code (Digits 8-9): Must fall within the valid range of 01-27, plus 88 for foreign-born.
    *   Gender (Digit 14): Odd numbers denote male; even numbers denote female.
    *   A Luhn-like checksum validation is applied to the final digit.
*   Age verification: The extracted birthdate must confirm the user is 18 years of age or older.
*   Name validation: The Arabic name field is strictly validated against the Arabic Unicode range (`\u0600-\u06FF`).

### Step 8: Address Entry
*   The user selects their Egyptian governorate from a standardized dropdown list of the 27 governorates.
*   A text field is provided for the district/area (optional).
*   A comprehensive text field is provided for the full street address.
*   The governorate list is stored as static asset data within the Flutter app, eliminating the need for an API call during this step.

### Step 9: Investment Experience Declaration
*   In accordance with FRA requirements, the investor must self-declare their level of investment experience.
*   The available options are: Beginner, Intermediate, Experienced, Professional.
*   This data is stored in the user profile and directly influences the AI recommendation strategy engine later in the lifecycle.
*   A mandatory legal consent checkbox is required: 'I declare the above information is accurate and acknowledge that Tradeora will rely on this information.'

### Step 10: Risk Tolerance Questionnaire
*   A 7-question survey assesses the user's risk profile, covering topics such as investment horizon, loss tolerance capacity, income stability, and primary investment goals.
*   Each question is multiple-choice, with answers mapping to a 1-5 point score.
*   The overall risk score is the sum of all answers, categorizing the user into: Conservative (7-14), Moderate (15-21), or Aggressive (22-35).
*   This score is persisted in the user profile and is intrinsically linked to the AI's selection of suitable investment "schools" or strategies.

### Step 11: National ID Document Upload
*   The Flutter app utilizes the `image_picker` package, strongly preferring live camera capture over gallery uploads to provide rudimentary liveness assurance.
*   Stringent client-side image quality checks are enforced before upload:
    *   Minimum resolution: 1080x720 pixels.
    *   Maximum file size: 5MB.
    *   Blur detection: Calculates the Laplacian variance; an image is rejected if the variance is < 100.
*   Two distinct captures are required: the front and the back of the National ID card.
*   Images undergo local compression (JPEG quality 85%) to optimize bandwidth usage.
*   The upload utilizes the endpoint: `POST /api/v1/kyc/documents`, supporting chunked uploads for resilience on slow mobile networks.

### Step 12: Selfie Capture for Liveness Check
*   The Flutter camera package accesses the front-facing camera.
*   Liveness check implementation:
    *   Phase 1 focuses on passive liveness, utilizing simple blink detection or localized challenge-response (e.g., "turn head left").
    *   Phase 2 architecture prepares for integration with a professional, certified liveness vendor (e.g., iProov or similar).
*   The captured selfie serves a dual purpose: liveness verification and facial matching against the photograph present on the uploaded National ID.
*   During Phase 1, the facial match is primarily verified via manual review by a KYC officer.

### Step 13: Document Storage in MinIO
*   All uploaded KYC documents are routed to a dedicated MinIO bucket named `kyc-documents`.
*   Data at rest is secured using Server-Side Encryption (SSE-S3) with AES-256.
*   The object key structure follows a strict taxonomy: `{user_id}/{document_type}/{document_id}.jpg`.
*   The bucket is configured with object versioning, ensuring immutability once a document is successfully uploaded.
*   The API generates Presigned URLs for client uploads, configured with a strict Time-To-Live (TTL) of 15 minutes.
*   MinIO IAM policies are strictly scoped: only the `KYCVerification` service identity possesses read/write privileges for this bucket.

### Step 14: KYCVerification Aggregate Created
*   Upon successful document upload and metadata registration, the `KYCVerificationInitiated` domain event is published.
*   The `KYCVerification` aggregate is instantiated, storing critical state: `userId`, `documentRefs` (the exact MinIO object keys), `submittedAt` timestamp, and setting the initial `status` to `PENDING`.
*   This state is durably persisted as a record in the PostgreSQL `kyc_verifications` table.

### Step 15: KYC Review Process
*   An automated verification pipeline executes immediately upon submission:
    1.  Document format validation (AI-based check to confirm the image resembles an Egyptian National ID).
    2.  Image quality scoring (evaluating blur, brightness, and glare to ensure readability).
    3.  OCR Extraction & Matching: The extracted National ID number must perfectly match the user-input data from Step 7.
    4.  Date of Birth Matching: The OCR-extracted date of birth must match the self-declared date of birth.
*   If automated checks require further scrutiny or fail within acceptable thresholds, the application enters the Manual Review Queue.
*   The KYC officer accesses this queue via a secure admin dashboard.
*   Service Level Agreement (SLA): Manual reviews must be completed within 24 hours of submission.
*   The reviewing officer has three distinct actions available: `APPROVE`, `REJECT` (requiring a selected reason code), or `REQUEST_RESUBMISSION` (allowing the user to re-upload specific flawed documents without restarting the entire flow).

### Step 16: AML Screening
*   Anti-Money Laundering (AML) screening is triggered synchronously upon KYC document submission.
*   The screening engine evaluates the user's full name (both Arabic and romanized versions) and their National ID number.
*   The engine queries multiple consolidated lists: OFAC Specially Designated Nationals (SDN), UN Security Council Consolidated List, and the CBE Egyptian Watchlist.
*   Fuzzy matching algorithms (specifically Jaro-Winkler distance) are employed with a strict match threshold of 85%.
*   Possible Outcomes:
    *   `CLEAR`: No matches found; the flow proceeds.
    *   `HIT_REVIEW`: A potential match requires human intervention. The case is routed to a compliance officer queue with an aggressive 4-hour manual review SLA.
    *   `BLOCKED`: An exact or confirmed hit against a critical sanctions list. The account is permanently suspended, and an automated regulatory notification workflow is initiated.

### Step 17: KYCApproved Event Published
*   Upon successful completion of all automated and manual checks, the system authorizes the user.
*   An event named `KYCApproved` is published to the Kafka topic `kyc.KYCApproved.v1`.
*   The event payload contains: `userId`, `approvedAt` (timestamp), `approvedBy` (the UUID of the reviewing officer, or the string 'AUTOMATED' if passed via straight-through processing), and the achieved `kycLevel` (e.g., BASIC or ENHANCED).

### Step 18: UserIdentity Aggregate Activated
*   The UserIdentity bounded context acts as a consumer for the `kyc.KYCApproved.v1` topic.
*   Upon receiving the event, it transitions the user's core status to `ACTIVE`.
*   It executes an API call to Keycloak to update the user's attributes, specifically setting `kyc_status=APPROVED`.
*   Following the successful state changes, it publishes the overarching `UserActivated` domain event.

### Step 19: Subscription Plan Selection
*   Newly activated users are assigned to the default `FREE` tier, requiring no immediate payment processing.
*   The FREE tier configuration grants access to 10 AI-driven investment recommendations per month and comprehensive basic portfolio tracking features.
*   The assigned subscription plan is permanently recorded within the user's core profile.
*   A dedicated Subscription aggregate is initialized for the user to manage future upgrades and billing cycles.

### Step 20: Initial Portfolio Created
*   Listening to the `UserActivated` event, the Portfolio bounded context initializes a new, empty portfolio aggregate for the user.
*   A unique Portfolio ID is generated and assigned.
*   The base currency for the portfolio is definitively set to Egyptian Pounds (EGP).
*   Upon successful creation, a `PortfolioCreated` event is published to the event bus.

### Step 21: Welcome Notification
*   The NotificationDelivery service responds to the `UserActivated` event.
*   A push notification is dispatched via Firebase Cloud Messaging (FCM).
    *   Arabic Locale: `أهلاً بك في Tradeora! محفظتك الاستثمارية جاهزة.`
    *   English Locale: `Welcome to Tradeora! Your investment portfolio is ready.`
*   Concurrently, a beautifully formatted HTML welcome email is dispatched, containing a comprehensive getting-started guide and links to educational resources.

### Step 22: User Directed to Portfolio Dashboard
*   The Flutter client app, which has been polling the `/api/v1/onboarding/status` endpoint (or listening via a WebSocket connection) detects the transition to the ACTIVE state.
*   The application automatically navigates the user away from the onboarding loading screens and into the main portfolio dashboard view.
*   A first-time user experience (FTUE) tutorial, consisting of a 5-slide interactive overlay, is presented to guide the user through the interface.

---

## Section 4 — Keycloak Configuration

Keycloak serves as the cornerstone of our Identity and Access Management (IAM) strategy.

### Realm Structure
The architecture relies on a multi-realm configuration to strictly isolate different user populations and their respective security policies:
*   `tradeora-retail`: Dedicated to individual retail investors utilizing phone number and password authentication.
*   `tradeora-wealth`: Segmented for high-net-worth individuals, enforcing mandatory hardware-backed Multi-Factor Authentication (MFA).
*   `tradeora-admin`: Restricted to internal Tradeora staff, requiring integration with corporate Single Sign-On (SSO) and mandatory hardware MFA.

### Configuration Specifications for `tradeora-retail` Realm
*   **Token Lifetimes:** 
    *   `access_token`: 15 minutes (ensures rapid revocation capability).
    *   `refresh_token`: 7 days (balances UX with security).
*   **Session Management:**
    *   `SSO Session Max`: 30 days.
    *   `SSO Session Idle`: 7 days.
*   **Password Policy:**
    *   `length`: Minimum 12 characters.
    *   `notUsername`: Password cannot contain the username.
    *   `notEmail`: Password cannot contain the email address.
    *   `passwordHistory`: Retain the last 5 passwords to prevent reuse.
*   **Brute Force Detection:**
    *   Threshold: 5 consecutive failed login attempts.
    *   Action: 30-minute temporary account lockout.
*   **Custom User Attributes:**
    *   `onboarding_step` (String): Tracks progress (e.g., 'personal_info', 'completed').
    *   `kyc_status` (String): 'PENDING', 'APPROVED', 'REJECTED'.
    *   `account_tier` (String): 'FREE', 'PREMIUM'.
    *   `risk_score` (Integer): Derived from the risk questionnaire.
    *   `preferred_language` (String): 'ar' or 'en'.

### Client Scopes Definition
The API relies on granular OAuth2 scopes to enforce authorization at the gateway and service levels.

```json
{
  "scopes": [
    { "name": "read:portfolio", "description": "Read user portfolio data and balances" },
    { "name": "read:recommendations", "description": "Read AI-generated investment recommendations" },
    { "name": "read:market-data", "description": "Read real-time and historical market prices" },
    { "name": "write:watchlist", "description": "Create, update, or delete items on the user's watchlist" },
    { "name": "read:notifications", "description": "Read notification history and preferences" },
    { "name": "write:profile", "description": "Update user profile information and settings" },
    { "name": "admin:kyc", "description": "KYC officer access for document review (restricted to admin realm users)" },
    { "name": "admin:compliance", "description": "Compliance officer access for AML review (restricted to admin realm users)" }
  ]
}
```

### Keycloak Admin API Integration (Python)

```python
# keycloak_service.py
import httpx
from typing import Dict
from uuid import uuid4

class KeycloakUserCreationError(Exception):
    pass

class KeycloakAdminService:
    BASE_URL = 'https://auth.tradeora.com/admin/realms/tradeora-retail'
    
    def __init__(self, http_client: httpx.AsyncClient, token_manager):
        self.http_client = http_client
        self.token_manager = token_manager
        
    async def _get_admin_token(self) -> str:
        return await self.token_manager.get_token()
    
    async def create_user(self, phone: str, initial_attributes: Dict) -> str:
        """Creates a new user in the Keycloak retail realm."""
        payload = {
            'username': phone,
            'enabled': True,
            'emailVerified': False,
            'attributes': {
                'phone': [phone],
                'onboarding_step': ['personal_info'],
                'kyc_status': ['PENDING'],
                'account_tier': ['FREE'],
                **{k: [v] for k, v in initial_attributes.items()}
            },
            'requiredActions': [],
            'credentials': []  # Password set via a separate, explicit call
        }
        
        response = await self.http_client.post(
            f'{self.BASE_URL}/users',
            json=payload,
            headers={'Authorization': f'Bearer {await self._get_admin_token()}'}
        )
        
        if response.status_code != 201:
            raise KeycloakUserCreationError(f"Failed to create user: {response.text}")
        
        # Extract the newly created Keycloak user ID from the Location header
        location = response.headers.get('Location')
        if not location:
            raise KeycloakUserCreationError("Location header missing in Keycloak response.")
        user_id = location.split('/')[-1]
        return user_id
    
    async def set_password(self, user_id: str, password: str):
        """Sets or resets the password for a specific user."""
        payload = {
            'type': 'password',
            'value': password,
            'temporary': False
        }
        response = await self.http_client.put(
            f'{self.BASE_URL}/users/{user_id}/reset-password',
            json=payload,
            headers={'Authorization': f'Bearer {await self._get_admin_token()}'}
        )
        if response.status_code != 204:
             raise KeycloakUserCreationError(f"Failed to set password: {response.text}")
```

### Keycloak Admin API Integration (TypeScript/Node.js Equivalent)

```typescript
// keycloak.service.ts
import axios, { AxiosInstance } from 'axios';

export class KeycloakAdminService {
    private readonly baseUrl = 'https://auth.tradeora.com/admin/realms/tradeora-retail';
    
    constructor(
        private readonly httpClient: AxiosInstance,
        private readonly tokenManager: any
    ) {}

    private async getAdminToken(): Promise<string> {
        return this.tokenManager.getToken();
    }

    async createUser(phone: string, initialAttributes: Record<string, any>): Promise<string> {
        const payload = {
            username: phone,
            enabled: true,
            emailVerified: false,
            attributes: {
                phone: [phone],
                onboarding_step: ['personal_info'],
                kyc_status: ['PENDING'],
                account_tier: ['FREE'],
                ...Object.fromEntries(Object.entries(initialAttributes).map(([k, v]) => [k, [v]]))
            },
            requiredActions: [],
            credentials: []
        };

        const token = await this.getAdminToken();
        const response = await this.httpClient.post(`${this.baseUrl}/users`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status !== 201) {
            throw new Error(`Failed to create user: ${response.data}`);
        }

        const location = response.headers['location'];
        if (!location) throw new Error("Location header missing");
        return location.split('/').pop() as string;
    }
}
```

---

## Section 5 — KYC Verification Architecture

The KYC Verification process is built around secure document handling and a strictly controlled state machine.

### Document Storage Implementation (Python)
```python
# kyc_document_storage.py
from minio import Minio
from minio.sse import SseS3
from datetime import timedelta
from uuid import uuid4

class KYCDocumentStorage:
    BUCKET = 'kyc-documents'
    
    def __init__(self, minio_client: Minio):
        self.minio = minio_client
        # Ensure bucket exists during initialization
        if not self.minio.bucket_exists(self.BUCKET):
            self.minio.make_bucket(self.BUCKET)
    
    def generate_presigned_upload_url(self, user_id: str, doc_type: str) -> dict:
        """
        Generates a secure, time-limited URL for the mobile client to upload documents directly.
        """
        document_id = str(uuid4())
        object_key = f'{user_id}/{doc_type}/{document_id}.jpg'
        
        url = self.minio.presigned_put_object(
            bucket_name=self.BUCKET,
            object_name=object_key,
            expires=timedelta(minutes=15),
            # Note: SSE-S3 encryption is enforced via bucket policies on the MinIO server side,
            # ensuring all written objects are encrypted regardless of client headers.
        )
        
        return {
            'uploadUrl': url,
            'objectKey': object_key,
            'expiresIn': 900
        }
    
    def get_document(self, object_key: str) -> bytes:
        """Retrieves a document for OCR or manual review."""
        try:
            response = self.minio.get_object(self.BUCKET, object_key)
            return response.read()
        finally:
            response.close()
            response.release_conn()
```

### KYC State Machine
The KYC status dictates the user's progress and capabilities within the platform. Transitions must be strictly enforced to prevent bypass vulnerabilities.

```python
# kyc_state_machine.py
from enum import Enum
from typing import List

class KYCStatus(str, Enum):
    PENDING = 'PENDING'
    UNDER_REVIEW = 'UNDER_REVIEW'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'
    RESUBMISSION_REQUESTED = 'RESUBMISSION_REQUESTED'
    BLOCKED = 'BLOCKED'  # AML block - absolute terminal state, cannot be overridden

class KYCStatusTransitions:
    """Defines the directed acyclic graph (DAG) of allowed KYC state transitions."""
    ALLOWED = {
        KYCStatus.PENDING: [KYCStatus.UNDER_REVIEW],
        KYCStatus.UNDER_REVIEW: [
            KYCStatus.APPROVED, 
            KYCStatus.REJECTED, 
            KYCStatus.RESUBMISSION_REQUESTED,
            KYCStatus.BLOCKED
        ],
        KYCStatus.REJECTED: [KYCStatus.PENDING],  # Only allowed after user resubmits all docs
        KYCStatus.RESUBMISSION_REQUESTED: [KYCStatus.PENDING], # After specific doc resubmission
        KYCStatus.APPROVED: [],  # Terminal state - no outward transitions allowed
        KYCStatus.BLOCKED: [],   # Terminal state - no outward transitions allowed
    }

    @classmethod
    def can_transition(cls, current_state: KYCStatus, new_state: KYCStatus) -> bool:
        return new_state in cls.ALLOWED.get(current_state, [])
```

---

## Section 6 — AML Screening Architecture

AML screening is a continuous process, initiated during onboarding and continuously applied as watchlists are updated.

### AML Screening Service Implementation (Python)
```python
# aml_screening_service.py
from rapidfuzz import fuzz
from decimal import Decimal
from typing import List, Optional
from dataclasses import dataclass

@dataclass
class SanctionEntry:
    id: str
    name_arabic: str
    name_latin: str
    national_id: Optional[str]

@dataclass
class SanctionsList:
    name: str
    entries: List[SanctionEntry]

@dataclass
class AMLCandidate:
    user_id: str
    full_name_arabic: str
    full_name_latin: str
    national_id: str

@dataclass
class AMLHit:
    list_name: str
    entry_id: str
    score: Decimal
    match_field: str

class ScreeningResult:
    def __init__(self, is_clear: bool, hits: List[AMLHit] = None):
        self.is_clear = is_clear
        self.hits = hits or []
        
    @classmethod
    def CLEAR(cls):
        return cls(is_clear=True)
        
    @classmethod
    def HIT_REVIEW(cls, hits: List[AMLHit]):
        return cls(is_clear=False, hits=hits)

class AMLScreeningService:
    MATCH_THRESHOLD = Decimal('85')  # 85% similarity ratio required to flag a hit
    
    def __init__(self, sanctions_lists: List[SanctionsList]):
        self.sanctions_lists = sanctions_lists
    
    def screen(self, candidate: AMLCandidate) -> ScreeningResult:
        hits = []
        
        for sanctions_list in self.sanctions_lists:
            for entry in sanctions_list.entries:
                # 1. Exact National ID Match (Highest Priority)
                if entry.national_id and entry.national_id == candidate.national_id:
                    hits.append(AMLHit(
                        list_name=sanctions_list.name,
                        entry_id=entry.id,
                        score=Decimal('100'),
                        match_field='national_id'
                    ))
                    continue # Skip name checks if NID is an exact match
                
                # 2. Fuzzy Match on Arabic Name
                arabic_score = self._compute_name_similarity(
                    candidate.full_name_arabic,
                    entry.name_arabic
                )
                if arabic_score >= self.MATCH_THRESHOLD:
                    hits.append(AMLHit(
                        list_name=sanctions_list.name,
                        entry_id=entry.id,
                        score=arabic_score,
                        match_field='name_arabic'
                    ))
                
                # 3. Fuzzy Match on Latin/Romanized Name
                latin_score = self._compute_name_similarity(
                    candidate.full_name_latin,
                    entry.name_latin
                )
                if latin_score >= self.MATCH_THRESHOLD:
                    hits.append(AMLHit(
                        list_name=sanctions_list.name,
                        entry_id=entry.id,
                        score=latin_score,
                        match_field='name_latin'
                    ))
        
        if not hits:
            return ScreeningResult.CLEAR()
        else:
            return ScreeningResult.HIT_REVIEW(hits=hits)
    
    def _compute_name_similarity(self, name1: str, name2: str) -> Decimal:
        """Calculates token sort ratio to handle name variations and out-of-order words."""
        if not name1 or not name2:
            return Decimal('0')
        score = fuzz.token_sort_ratio(name1, name2)
        return Decimal(str(score))
```

### Sanctions List Management Protocol
*   **OFAC SDN List:** Downloaded and parsed daily via the official OFAC API. Delta updates are applied locally.
*   **UN Security Council Consolidated List:** Updated asynchronously upon publication via webhook listeners or daily polling of the UN XML feed.
*   **CBE Egyptian Watchlist:** Provided securely by the Central Bank of Egypt. The specific format is TBD (often CSV or secure API). This data is securely stored within the Compliance BC's isolated PostgreSQL schema.
*   **Continuous Screening Trigger:** Whenever a sanctions list is updated, a `compliance.SanctionsListUpdated.v1` Kafka event is emitted. The Compliance BC consumes this event and initiates a background job to re-screen all currently active and `UNDER_REVIEW` accounts against the new list entries.

---

## Section 7 — PDPL 2020 Compliance

Strict adherence to the Egyptian Personal Data Protection Law (PDPL) is embedded into the onboarding architecture.

### Consent Collection Matrix
A granular consent model is implemented, tracking the exact version of the policy agreed to and the timestamp of consent.

| # | Consent Item | Required | Retention Period |
|---|---|---|---|
| 1 | General Terms of Service | Yes | Account lifetime + 5 years |
| 2 | Privacy Policy | Yes | Account lifetime + 5 years |
| 3 | KYC document collection | Yes | 5 years post account closure (Regulatory mandate) |
| 4 | National ID processing | Yes | 5 years post account closure |
| 5 | Biometric data (selfie) processing | Yes | 5 years post account closure |
| 6 | Transactional SMS communications | Yes | Account lifetime |
| 7 | Operational Push notifications | Yes | Account lifetime |
| 8 | Marketing Email communications | Optional | Until explicitly withdrawn by user |
| 9 | AI recommendation data processing | Yes | Account lifetime |
| 10 | Portfolio data processing | Yes | Account lifetime |
| 11 | AML/sanctions screening | Yes (Legal basis) | 5 years post account closure |
| 12 | Regulatory reporting to FRA | Yes (Legal basis) | 7 years (FRA mandate overrides PDPL default) |
| 13 | Marketing SMS communications | Optional | Until explicitly withdrawn by user |
| 14 | Analytics & product improvement | Optional | Until explicitly withdrawn by user |
| 15 | Third-party data sharing (Phase 2) | Optional | Until explicitly withdrawn by user |

### Data Retention Implementation (Python)
Data retention policies are enforced via scheduled asynchronous jobs to ensure compliance with the "Right to Erasure" while respecting overriding regulatory mandates.

```python
# data_retention_policy.py
from datetime import date, timedelta
import json

class DataRetentionPolicy:
    KYC_DOCUMENTS_YEARS = 5      # PDPL standard for financial records post-closure
    REGULATORY_REPORTS_YEARS = 7 # FRA overriding requirement
    TRANSACTION_HISTORY_YEARS = 10 # Capital gains tax audit requirements
    USER_PROFILE_YEARS = 5       # General profile data
    AUDIT_LOG_YEARS = 7
    
    def __init__(self, airflow_client):
        self.airflow_client = airflow_client
    
    def schedule_deletion(self, user_id: str, closure_date: date):
        """
        Schedules the physical deletion of PII data after the required retention period.
        """
        # Calculate when KYC documents can be legally deleted
        retention_end_date = closure_date + timedelta(days=365 * self.KYC_DOCUMENTS_YEARS)
        
        # Trigger an Apache Airflow DAG configured to run on the future retention_end_date
        self.airflow_client.trigger_dag(
            dag_id='user_data_retention_cleanup',
            conf={
                'user_id': user_id,
                'target_deletion_date': retention_end_date.isoformat(),
                'policy_version': '1.0'
            },
            execution_date=retention_end_date # Schedules the run for the future
        )
```

### Right to Erasure Constraints
According to PDPL Article 17, the right to erasure applies UNLESS specific conditions are met. In Tradeora's context:
1.  **Legal Obligation:** The requirement to retain KYC and AML records for 5 years overrides immediate deletion requests.
2.  **Exercise of Legal Claims:** Data may be retained if a dispute or litigation is active.
3.  **Implementation Strategy:** When a user requests account deletion, the account is logically soft-deleted (status marked for erasure) and access is revoked immediately. Physical deletion of sensitive PII (like National ID images) is scheduled according to the `DataRetentionPolicy` schedule.

---

## Section 8 — Complete JSON Schemas

These JSON schemas represent the definitive API contracts for the onboarding bounded contexts.

### 8.1 User Registration Request
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "UserRegistrationRequest",
  "type": "object",
  "required": ["phoneNumber", "password", "consentItems"],
  "properties": {
    "phoneNumber": {
      "type": "string",
      "pattern": "^\\+20[0-9]{10}$",
      "description": "Egyptian phone number in strictly E.164 format"
    },
    "password": {
      "type": "string",
      "minLength": 12,
      "description": "NIST SP 800-63B compliant password. Will be hashed immediately."
    },
    "preferredLanguage": {
      "type": "string",
      "enum": ["ar", "en"],
      "default": "ar",
      "description": "User's preferred UI language"
    },
    "consentItems": {
      "type": "array",
      "minItems": 10,
      "description": "Array of explicitly accepted consent items",
      "items": {
        "type": "object",
        "required": ["consentId", "granted", "grantedAt", "version"],
        "properties": {
          "consentId": { 
              "type": "string",
              "description": "Unique identifier for the consent clause (e.g., 'TOS', 'PRIVACY_POLICY')"
          },
          "granted": { 
              "type": "boolean",
              "enum": [true],
              "description": "Must be true. We do not store negative consents for required items during registration."
          },
          "grantedAt": { 
              "type": "string", 
              "format": "date-time" 
          },
          "version": { 
              "type": "string",
              "description": "The specific document version agreed to (e.g., 'v1.2')"
          }
        }
      }
    }
  }
}
```

### 8.2 KYC Submission Request
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "KYCSubmissionRequest",
  "type": "object",
  "required": ["documentRefs", "declaredData"],
  "properties": {
    "documentRefs": {
      "type": "object",
      "required": ["nationalIdFront", "nationalIdBack", "selfie"],
      "properties": {
        "nationalIdFront": { "type": "string", "description": "MinIO object key for the front of the ID" },
        "nationalIdBack": { "type": "string", "description": "MinIO object key for the back of the ID" },
        "selfie": { "type": "string", "description": "MinIO object key for the liveness selfie" }
      }
    },
    "declaredData": {
      "type": "object",
      "required": ["nationalIdNumber", "fullNameArabic", "dateOfBirth"],
      "properties": {
        "nationalIdNumber": { "type": "string", "pattern": "^[0-9]{14}$" },
        "fullNameArabic": { "type": "string", "pattern": "^[\u0600-\u06FF\\s]+$" },
        "fullNameLatin": { "type": "string" },
        "dateOfBirth": { "type": "string", "format": "date" },
        "investmentExperience": {
           "type": "string",
           "enum": ["Beginner", "Intermediate", "Experienced", "Professional"]
        }
      }
    }
  }
}
```

### 8.3 User Profile Response
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "UserProfileResponse",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "phoneNumber": { "type": "string" },
    "status": { "type": "string", "enum": ["PENDING_OTP", "PENDING_KYC", "ACTIVE", "SUSPENDED"] },
    "kycStatus": { "type": "string", "enum": ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"] },
    "accountTier": { "type": "string", "enum": ["FREE", "PREMIUM"] },
    "riskProfile": {
      "type": "object",
      "properties": {
        "score": { "type": "integer" },
        "category": { "type": "string", "enum": ["Conservative", "Moderate", "Aggressive"] }
      }
    },
    "createdAt": { "type": "string", "format": "date-time" }
  }
}
```

### 8.4 KYCApproved Kafka Event Payload
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "KYCApprovedEvent",
  "type": "object",
  "required": ["eventId", "timestamp", "userId", "kycLevel", "approvedBy"],
  "properties": {
    "eventId": { "type": "string", "format": "uuid" },
    "timestamp": { "type": "string", "format": "date-time" },
    "userId": { "type": "string", "format": "uuid" },
    "kycLevel": { "type": "string", "enum": ["BASIC", "ENHANCED"] },
    "approvedBy": { 
        "type": "string", 
        "description": "UUID of the approving KYC officer, or 'AUTOMATED' if STP was achieved."
    },
    "metadata": {
      "type": "object",
      "properties": {
        "ocrConfidenceScore": { "type": "number" },
        "faceMatchScore": { "type": "number" }
      }
    }
  }
}
```

### 8.5 Onboarding Progress API Response
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "OnboardingProgressResponse",
  "type": "object",
  "required": ["currentStep", "isComplete", "stepsCompleted"],
  "properties": {
    "currentStep": { 
        "type": "string",
        "enum": ["phone_entry", "otp_verification", "personal_info", "address", "questionnaire", "document_upload", "under_review", "account_active"]
    },
    "isComplete": { "type": "boolean" },
    "stepsCompleted": {
      "type": "array",
      "items": { "type": "string" }
    },
    "nextActionRequired": { "type": "string" }
  }
}
```

---

## Section 9 — Sequence Diagram (Full ASCII)

This sequence diagram details the full, synchronous and asynchronous interactions across the 22-step onboarding flow.

```
User(Flutter)    API Gateway    UserIdentity    Keycloak    KYCVerif    Compliance    MinIO    Kafka    Notification
     |                |               |              |           |             |          |        |           |
     |--1.POST /reg-->|               |              |           |             |          |        |           |
     |                |--2.validate-->|              |           |             |          |        |           |
     |                |               |--check phone exists                               |        |           |
     |                |               |--generate OTP                                     |        |           |
     |                |               |----------------------------------------------------------------------->|
     |                |               |              |           |             |          |        |           |--3.SMS OTP
     |<--4.Response---|               |              |           |             |          |        |           |
     |                |               |              |           |             |          |        |           |
     |--5.Verify OTP->|               |              |           |             |          |        |           |
     |                |--route------->|              |           |             |          |        |           |
     |                |               |--validate OTP hash                                |        |           |
     |                |               |--6.POST /users---------->|             |          |        |           |
     |                |               |<--201 Created------------|             |          |        |           |
     |                |               |--7.PUT /reset-password-->|             |          |        |           |
     |<--8.SessionJWT-|               |              |           |             |          |        |           |
     |                |               |              |           |             |          |        |           |
     |--9.Submit Info>|               |              |           |             |          |        |           |
     |                |--route------->|              |           |             |          |        |           |
     |                |               |--save profile db         |             |          |        |           |
     |<--200 OK-------|               |              |           |             |          |        |           |
     |                |               |              |           |             |          |        |           |
     |--10.GetUpload->|               |              |           |             |          |        |           |
     |                |--route---------------------------------->|             |          |        |           |
     |                |               |              |           |--Req URL---------------->|        |           |
     |                |               |              |           |<--Presigned URL----------|        |           |
     |<--URL Response-|               |              |           |             |          |        |           |
     |                |               |              |           |             |          |        |           |
     |--11.PUT Image--------------------------------------------------------------------->|        |           |
     |<--200 OK---------------------------------------------------------------------------|        |           |
     |                |               |              |           |             |          |        |           |
     |--12.Submit KYC>|               |              |           |             |          |        |           |
     |                |--route---------------------------------->|             |          |        |           |
     |                |               |              |           |--save state |          |        |           |
     |                |               |              |           |--13.Produce KYCSubmitted Event->|           |
     |<--202 Accepted-|               |              |           |             |          |        |           |
     |                |               |              |           |             |          |        |           |
     |                |               |              |           |             |--Consume Event----|           |
     |                |               |              |           |             |--14.AML Screen    |           |
     |                |               |              |           |             |--Save Result      |           |
     |                |               |              |           |             |                   |           |
     |                |               |              |           |--15.Automated OCR/Quality Check |           |
     |                |               |              |           |--Wait for Manual Review (if req)|           |
     |                |               |              |           |--16.Produce KYCApproved Event-->|           |
     |                |               |              |           |             |          |        |           |
     |                |               |<-17.Consume KYCApproved Event---------------------|        |           |
     |                |               |--Update user status      |             |          |        |           |
     |                |               |--18.PUT /attributes----->|             |          |        |           |
     |                |               |--Produce UserActivated Event------------------------------>|           |
     |                |               |              |           |             |          |        |           |
     |                |               |              |           |             |          |        |<-Consume--|
     |                |               |              |           |             |          |        |--19.Push->|
     |<--20.Push Notification----------------------------------------------------------------------------------|
     |                |               |              |           |             |          |        |           |
     |--21.Poll State>|               |              |           |             |          |        |           |
     |                |--route------->|              |           |             |          |        |           |
     |<--state:ACTIVE-|               |              |           |             |          |        |           |
     |--22.Navigate to Dashboard      |              |           |             |          |        |           |
```

---

## Section 10 — Failure Modes

Comprehensive error handling is required to ensure a resilient onboarding experience.

| # | Failure Mode | Detection Mechanism | System Response | Recovery Strategy | User Impact |
|---|---|---|---|---|---|
| 1 | SMS OTP not delivered | Twilio webhook reports delivery failure | Immediate retry via backup provider (Vodafone Egypt) | Automatic failover | User experiences a delay of up to 30 seconds |
| 2 | OTP lockout (3 failed attempts) | Counter incremented in Valkey | 30-minute lockout triggered; API returns 429 Too Many Requests | Time-based expiry | User is locked out and must wait |
| 3 | Document upload failure (network issue) | HTTP 5xx or client-side timeout | Client initiates retry with exponential backoff strategy | User retries upload | Upload process is delayed |
| 4 | MinIO unavailable | S3 connection error or timeout | KYCVerification queues the upload task, returns 'pending' status | Automatic retry upon MinIO recovery | KYC review process is delayed |
| 5 | KYC rejected - blurry photo | Automated image quality score check fails | State transitions to RESUBMISSION_REQUESTED with specific reason | User receives notification to resubmit specific document | Delay in final approval |
| 6 | AML false positive | Manual review flag generated during screening | Case placed in compliance officer review queue | Officer manually clears the hit | Approval delayed by up to 4 hours |
| 7 | Keycloak unavailable | API Gateway detects HTTP 503 from Identity provider | Circuit breaker opens, API returns 503 Service Unavailable to client | System awaits Keycloak recovery | Registration flow is temporarily blocked |
| 8 | KYC approval delayed >24h | Prometheus SLA monitor triggers alert | Alert sent to KYC officer team escalation channel | Manual escalation and prioritization | User waits longer than expected |
| 9 | Duplicate phone registration attempt | UserIdentity.phoneExists check returns true | API returns 409 Conflict | System suggests logging in instead | User receives clear error message and redirection |
| 10 | National ID invalid format | Client-side regex or server-side Luhn validation fails | API returns 422 Unprocessable Entity with specific field error | User must correct the input | Validation error displayed on screen |
| 11 | Kafka event loss (KYCApproved) | Consumer lag monitor detects stall | Event replay initiated from compacted Kafka topic | Kafka infrastructure recovery | Account activation (UserActivated) is delayed |
| 12 | Password breach detected | HIBP k-anonymity API check returns positive match | Registration blocked | Prompt user to choose a different, secure password | Minor UX friction |

---

## Section 11 — Performance Budget

Performance budgets define the acceptable latency constraints for the onboarding flow to ensure a premium user experience.

```yaml
# Performance budget specifications for the onboarding flow
onboarding_slos:
  otp_delivery_time:
    description: "Time from user requesting OTP to SMS delivery confirmation"
    target_p50: 3s
    target_p95: 8s
    target_p99: 10s
    measurement: twilio_message_delivered_at - api_request_at
    alert_threshold: ">10s for P99"
  
  document_upload_time:
    description: "Time required to upload compressed KYC documents"
    max_file_size: 5MB
    target_p50: 5s
    target_p95: 20s
    target_p99: 30s
    measurement: upload_complete_at - upload_start_at
    alert_threshold: ">30s for P95"
  
  automated_kyc_check:
    description: "Time for OCR extraction, matching, and image quality scoring"
    target_p50: 10s
    target_p95: 45s
    target_p99: 60s
    measurement: kyc_checks_complete_at - document_upload_complete_at
    alert_threshold: ">60s for P99"
  
  account_activation_automated:
    description: "Time from KYC approval to complete account activation (STP)"
    target: "<5 minutes"
    measurement: user_activated_at - kyc_approved_at
    alert_threshold: ">5 minutes"
  
  kyc_review_sla:
    description: "Total time allowed for manual KYC review by an officer"
    target: "<24 hours"
    measurement: kyc_approved_at - kyc_submitted_at
    alert_threshold: ">20 hours (early warning), >24 hours (SLA breach)"
    regulatory_basis: "FRA guideline for investor onboarding"
```

---

## Section 12 — Security Controls

Security is implemented at multiple layers, protecting PII and preventing abuse.

### Security Controls Implementation (Python)
```python
# security_controls.py
import logging
import hashlib
import re

# 1. API Gateway Rate Limiting Specifications (Kong plugin configuration conceptualization)
# Applied at the Kong API Gateway layer to prevent volumetric attacks and abuse.
rate_limits = {
    'POST /api/v1/auth/register': '10/minute/IP',      # Prevent mass account creation from single IP
    'POST /api/v1/auth/otp/send': '3/hour/phone',      # Prevent SMS toll fraud
    'POST /api/v1/auth/otp/verify': '3/5min/phone',    # Prevent brute-forcing the 6-digit OTP
    'POST /api/v1/kyc/documents': '5/hour/user',       # Prevent excessive MinIO storage consumption
}

# 2. PII Masking in Application Logs
# Ensures sensitive data never leaks into centralized logging systems (e.g., ELK stack).
class PIIMaskingFilter(logging.Filter):
    PATTERNS = [
        (r'\+20[0-9]{10}', '+20XXXXXXXXXX'),  # Egyptian Phone Number
        (r'[0-9]{14}', '**NID**'),              # 14-digit National ID
        (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '***@***.***')  # Standard Email
    ]
    
    def filter(self, record):
        if isinstance(record.msg, str):
            record.msg = self._mask_pii(record.msg)
        return True
    
    def _mask_pii(self, message: str) -> str:
        for pattern, replacement in self.PATTERNS:
            message = re.sub(pattern, replacement, message)
        return message

# Apply the filter to the root logger
logging.getLogger().addFilter(PIIMaskingFilter())

# 3. Secure Hashing of Sensitive Identifiers
def hash_national_id(national_id: str, salt: bytes) -> str:
    """
    Hashes the National ID after KYC approval is complete. 
    The original plaintext is NOT stored in the operational database, only the hash,
    while the image resides encrypted in MinIO.
    """
    # Uses Argon2id, recommended for password hashing but suitable for highly sensitive PII
    return hashlib.argon2id.hash(
        national_id.encode('utf-8'),
        salt=salt,
        time_cost=3,
        memory_cost=65536, # 64MB memory hardness
        parallelism=4,
        hash_len=32
    )
```

### Document Encryption Specifications
*   **Documents at Rest (MinIO):** Server-Side Encryption with Amazon S3-Managed Keys (SSE-S3) utilizing the AES-256 cipher block.
*   **Documents in Transit:** Mandatory Transport Layer Security (TLS) version 1.3 for all client-to-gateway and service-to-service communications.
*   **Database PII Fields:** Sensitive fields (like exact Date of Birth or exact street address) are encrypted at the application layer before being written to PostgreSQL, utilizing the `pgcrypto` extension for seamless indexing where necessary.
*   **Backup Encryption:** All database and MinIO backups are encrypted using AES-256-GCM with keys managed by a dedicated Hardware Security Module (HSM).

---

## Section 13 — Onboarding Analytics

Comprehensive analytics are required to monitor the health of the onboarding funnel and identify drop-off points.

### Prometheus Metrics Specification (Python)
```python
# metrics.py - Prometheus metric definitions for the onboarding funnel
from prometheus_client import Counter, Histogram, Gauge

# Counters track the absolute number of users passing through each phase
onboarding_step_completed = Counter(
    'onboarding_step_completed_total',
    'Total count of users successfully completing a specific onboarding step',
    ['step_name', 'step_number'] # e.g., ('phone_entry', '1')
)

onboarding_step_failed = Counter(
    'onboarding_step_failed_total',
    'Total count of users failing or abandoning a specific onboarding step',
    ['step_name', 'step_number', 'failure_reason']
)

# Histograms track durations to monitor SLAs and UX latency
onboarding_duration_seconds = Histogram(
    'onboarding_duration_seconds',
    'Total time elapsed from registration initiation to full account activation',
    buckets=[60, 180, 300, 600, 1800, 3600, 86400] # 1m, 3m, 5m, 10m, 30m, 1h, 24h
)

kyc_review_duration_seconds = Histogram(
    'kyc_review_duration_seconds',
    'Total time elapsed from KYC document submission to final KYC decision',
    buckets=[60, 300, 1800, 3600, 14400, 86400] # 1m, 5m, 30m, 1h, 4h, 24h
)

aml_screening_hits_total = Counter(
    'aml_screening_hits_total',
    'Count of AML screening events categorized by outcome',
    ['outcome']  # CLEAR, HIT_REVIEW, BLOCKED
)
```

### Funnel Drop-off Metrics Table
This table defines the expected conversion rates at each step and the thresholds that trigger immediate engineering alerts.

| Step | Metric Identifier | Expected Drop-off | Critical Alert Threshold |
|---|---|---|---|
| Phone Entry | `onboarding_step_completed{step=phone_entry}` | < 5% | > 10% drop-off |
| OTP Verified | `onboarding_step_completed{step=otp_verified}` | < 15% | > 25% drop-off |
| Personal Info | `onboarding_step_completed{step=personal_info}` | < 10% | > 20% drop-off |
| KYC Submitted | `onboarding_step_completed{step=kyc_submitted}` | < 20% | > 30% drop-off |
| KYC Approved | `onboarding_step_completed{step=kyc_approved}` | < 15% | > 25% rejection rate |
| Account Active | `onboarding_step_completed{step=account_active}` | < 5% | > 10% failure rate |

---

## Section 14 — SLO Compliance and Alerting

Service Level Objectives (SLOs) are actively monitored using Prometheus and Alertmanager.

### Defined SLOs
| SLO Definition | Target | Measurement Query | Alert Condition |
|---|---|---|---|
| Account Creation (Automated) | 95th percentile < 5 minutes | `histogram_quantile(0.95, kyc_review_duration_seconds)` | > 5 minutes for P95 |
| KYC Review SLA (Manual) | 99th percentile < 24 hours | `histogram_quantile(0.99, kyc_review_duration_seconds)` | > 20 hours (Early Warning) |
| Onboarding Completion Rate | > 80% of started registrations reach ACTIVE status | `completed / started` ratio | < 75% = WARNING, < 70% = CRITICAL |
| OTP Delivery Latency | 99th percentile < 10 seconds | `histogram_quantile(0.99, otp_delivery_seconds)` | > 10 seconds for P99 |

### PromQL Alert Configurations
```promql
# Alert: KYC review P99 exceeds the 24-hour SLA mandated by FRA guidelines
alert: KYCReviewSLABreach
expr: histogram_quantile(0.99, kyc_review_duration_seconds_bucket) > 86400
for: 1m
labels: 
  severity: critical
  team: compliance-ops
annotations:
  summary: "KYC review P99 exceeds 24-hour SLA"
  description: "99% of KYC reviews are taking longer than 24 hours. Immediate intervention required in the review queue."

# Alert: Overall onboarding completion rate has fallen below acceptable thresholds
alert: OnboardingCompletionRateLow
expr: |
  (
    sum(rate(onboarding_step_completed_total{step="account_active"}[1h])) 
    / 
    sum(rate(onboarding_step_completed_total{step="phone_entry"}[1h]))
  ) < 0.80
for: 30m
labels: 
  severity: warning
  team: product-engineering
annotations:
  summary: "Onboarding completion rate dropped below 80%"
  description: "Less than 80% of users who started onboarding in the last hour successfully activated their accounts. Check logs for elevated error rates in document upload or OTP verification."
```

---

## Section 15 — Test Strategy

A robust test strategy ensures the onboarding flow remains stable across unit, integration, and end-to-end boundaries.

### Automated Testing Implementation (Python/Pytest)
```python
# test_onboarding.py
import pytest
import time
from typing import Dict

# ---------------------------------------------------------
# Unit Tests: Core Business Logic Validation
# ---------------------------------------------------------
class TestNationalIDValidation:
    def test_valid_national_id_2000s(self):
        # 3YYMMDDGGSSS0G format, century=3 means born in 2000s
        nid = '30101012301234'  # Valid 14-digit format
        assert validate_national_id(nid) is True
    
    def test_invalid_length_13_digits(self):
        # Must be exactly 14 digits
        assert validate_national_id('3010101230123') is False
    
    def test_invalid_governorate_code_00(self):
        # Governorate code '00' is out of bounds (valid: 01-27, 88)
        nid = '30101010001234'
        assert validate_national_id(nid) is False
    
    def test_invalid_governorate_code_28(self):
        # Governorate code '28' is out of bounds
        nid = '30101012801234'
        assert validate_national_id(nid) is False
    
    def test_age_under_18_rejected(self):
        # Dynamically generate an ID for an 8-year-old
        from datetime import date
        born = date.today().replace(year=date.today().year - 8)
        nid = f'3{born.strftime("%y%m%d")}01001234'
        assert validate_age_from_national_id(nid) is False
    
    def test_arabic_name_validation(self):
        # Must only contain characters from the Arabic Unicode block
        assert validate_arabic_name('محمد أحمد عبدالله') is True
        assert validate_arabic_name('John Smith') is False # Fails due to Latin chars
        assert validate_arabic_name('محمد Smith') is False # Fails mixed chars

# ---------------------------------------------------------
# Integration Tests: Bounded Context Interactions
# ---------------------------------------------------------
@pytest.mark.integration
class TestKeycloakRealmIntegration:
    async def test_create_user_in_retail_realm(self, keycloak_container):
        """Validates that the service can successfully communicate with Keycloak."""
        service = KeycloakAdminService(
            http_client=httpx.AsyncClient(),
            token_manager=MockTokenManager()
        )
        # Should return a valid UUID string
        user_id = await service.create_user('+201001234567', {})
        assert user_id is not None
        assert len(user_id) == 36 # Standard UUID length
    
    async def test_brute_force_lockout_after_5_failures(self, keycloak_container, auth_client):
        """Simulates 5 failed logins and verifies the account is locked."""
        for _ in range(5):
            response = await auth_client.post('/token', data={'username': 'test', 'password': 'wrong'})
            assert response.status_code == 401
            
        # The 6th attempt should return a different error indicating lockout
        response = await auth_client.post('/token', data={'username': 'test', 'password': 'wrong'})
        assert response.status_code == 403 # Forbidden (Locked out)

# ---------------------------------------------------------
# Security Tests: Vulnerability Prevention
# ---------------------------------------------------------
@pytest.mark.security
class TestAuthEndpointSecurity:
    async def test_otp_endpoint_rate_limit_enforced(self, api_client):
        """Validates the Kong rate limiting plugin configuration."""
        # Send 3 valid OTP requests within the window
        for i in range(3):
            res = await api_client.post('/api/v1/auth/otp/send', json={'phone': '+201001234567'})
            assert res.status_code == 200
            
        # The 4th request must be rejected by the rate limiter
        response = await api_client.post('/api/v1/auth/otp/send', json={'phone': '+201001234567'})
        assert response.status_code == 429 # Too Many Requests
    
    async def test_sql_injection_in_national_id_field(self, api_client):
        """Ensures the application layer properly sanitizes inputs before DB execution."""
        payload = {'nationalId': "'; DROP TABLE users;--", 'fullName': 'Test'}
        response = await api_client.post('/api/v1/profile', json=payload)
        # Should be caught by validation layer, not result in a 500 DB error
        assert response.status_code == 422 
    
    async def test_pii_not_in_response_headers(self, api_client):
        """Checks for accidental data leakage in HTTP headers."""
        response = await api_client.post('/api/v1/auth/register', json={'phone': '+201011122233', 'password': 'ValidPassword123!'})
        headers_str = str(response.headers).lower()
        assert 'national_id' not in headers_str
        assert '+201011122233' not in headers_str

# ---------------------------------------------------------
# End-to-End Tests: Complete User Journey
# ---------------------------------------------------------
@pytest.mark.e2e
class TestFullOnboardingFlow:
    def test_complete_onboarding_in_under_10_minutes(self, appium_driver, mock_kyc_officer):
        """
        Executes a full Flutter UI automation test representing a happy-path onboarding.
        Requires a mock KYC officer backend to approve documents instantly.
        """
        start_time = time.time()
        
        # ... Automation code interacting with Flutter elements (Appium/Flutter Driver) ...
        # appium_driver.find_element_by_id('phone_input').send_keys('+201000000001')
        # ...
        
        end_time = time.time()
        duration = end_time - start_time
        
        # The entire automated UI test must complete within 10 minutes
        assert duration < 600 
```

---
*This blueprint is a living document. All changes require Architecture Review Board approval.*  
*Regulatory Authority: PDPL 2020 (Law No. 151 of 2020), FRA Capital Markets Regulation, CBE Digital Banking Guidelines*  
*Document Owner: Product Engineering & Compliance*  
*Review Cycle: Quarterly or on regulatory changes*
