import pytest
import os
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')

from services.authorization_guard import (
    enforce_user_isolation,
    verify_admin_role,
    verify_service_role_token,
    UnauthorizedAccessError,
    PermissionDeniedError,
    AuthenticationFailedError,
    SERVICE_ROLE_SECRET
)


def test_user_a_accessing_user_b_data_triggers_unauthorized_error():
    user_a = "usr_alice_123"
    user_b = "usr_bob_456"

    # User A attempting to access User B's resource -> MUST FAIL WITH UnauthorizedAccessError
    with pytest.raises(UnauthorizedAccessError):
        enforce_user_isolation(requesting_user_id=user_a, resource_owner_id=user_b)


def test_unauthenticated_request_rejection():
    # Anonymous / empty requesting user -> MUST FAIL WITH AuthenticationFailedError
    with pytest.raises(AuthenticationFailedError):
        enforce_user_isolation(requesting_user_id=None, resource_owner_id="usr_bob_456")

    with pytest.raises(AuthenticationFailedError):
        enforce_user_isolation(requesting_user_id="", resource_owner_id="usr_bob_456")


def test_non_admin_privilege_escalation_rejection():
    # User role is 'trader' attempting admin task -> MUST FAIL WITH PermissionDeniedError
    with pytest.raises(PermissionDeniedError):
        verify_admin_role(user_role="trader")

    with pytest.raises(PermissionDeniedError):
        verify_admin_role(user_role=None)


def test_valid_user_and_admin_access_allowed():
    user_alice = "usr_alice_123"

    # User accessing own data -> OK
    enforce_user_isolation(requesting_user_id=user_alice, resource_owner_id=user_alice)

    # Admin performing admin task -> OK
    verify_admin_role(user_role="admin")
    verify_admin_role(user_role="service_role")


def test_service_role_token_verification():
    # Invalid token -> MUST FAIL
    with pytest.raises(AuthenticationFailedError):
        verify_service_role_token(token="invalid_hacker_token")

    # Valid token -> OK
    verify_service_role_token(token=SERVICE_ROLE_SECRET)


def test_cockroachdb_rls_policies_exist_in_db():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            # Query PostgreSQL system catalog for enabled RLS policies
            cur.execute("""
                SELECT relname, relrowsecurity
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public'
                  AND relname IN ('portfolio_equity_snapshots', 'fee_schedule', 'risk_parameters');
            """)
            rows = dict(cur.fetchall())

            assert rows.get("portfolio_equity_snapshots") is True
            assert rows.get("fee_schedule") is True
            assert rows.get("risk_parameters") is True
    finally:
        conn.close()
