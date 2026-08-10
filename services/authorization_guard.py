"""
services/authorization_guard.py — Strict Authorization & User Isolation Engine
================================================================================
Server-side security guard preventing:
1. IDOR (Insecure Direct Object Reference)
2. Cross-User Data Leaks (User A accessing User B's portfolio or trades)
3. Privilege Escalation (Non-admin mutating risk parameters or fee schedules)
4. Unauthenticated or Anonymous Database Operations

All authorization checks are enforced SERVER-SIDE. Frontend hiding is NEVER relied upon.
"""

import os
import hmac
import hashlib
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("tradeora.authorization")

SERVICE_ROLE_SECRET = os.getenv("SERVICE_ROLE_SECRET", "tradeora_secure_service_secret_2026_egx")


class SecurityError(Exception):
    """Base exception for authorization and security failures."""
    pass


class UnauthorizedAccessError(SecurityError):
    """Raised when User A attempts to access or mutate User B's resources."""
    pass


class PermissionDeniedError(SecurityError):
    """Raised when a non-admin attempts to perform admin-only operations."""
    pass


class AuthenticationFailedError(SecurityError):
    """Raised when request credentials or tokens are invalid/missing."""
    pass


def enforce_user_isolation(requesting_user_id: Optional[str], resource_owner_id: str) -> None:
    """
    Enforces strict user isolation.
    Raises UnauthorizedAccessError if requesting_user_id does NOT match resource_owner_id.
    """
    if not requesting_user_id or str(requesting_user_id).strip() == "":
        raise AuthenticationFailedError("AUTHENTICATION_REQUIRED: Unauthenticated request rejected")

    if str(requesting_user_id) != str(resource_owner_id):
        logger.warning(
            f"SECURITY ALERT: User IDOR attempt detected! Requesting User '{requesting_user_id}' tried to access User '{resource_owner_id}' resource."
        )
        raise UnauthorizedAccessError("FORBIDDEN: You are not authorized to access another user's data")


def verify_admin_role(user_role: Optional[str]) -> None:
    """
    Verifies admin privilege for sensitive configuration mutations (risk parameters, fee schedules).
    """
    if not user_role or str(user_role).lower() not in ("admin", "service_role"):
        raise PermissionDeniedError("PERMISSION_DENIED: Admin privilege required for system configuration changes")


def verify_service_role_token(token: Optional[str]) -> None:
    """
    Verifies backend service-role token for automated cron/batch processing pipelines.
    """
    if not token:
        raise AuthenticationFailedError("SERVICE_ROLE_TOKEN_MISSING: Service role token is required")

    expected_token = SERVICE_ROLE_SECRET
    if not hmac.compare_digest(str(token), expected_token):
        raise AuthenticationFailedError("INVALID_SERVICE_ROLE_TOKEN: Service role token verification failed")
