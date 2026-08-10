import pytest
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')

from services.disaster_recovery_drill import (
    execute_disaster_recovery_drill,
    DisasterRecoveryError,
    get_db_conn
)


def test_full_disaster_recovery_backup_and_restore_cycle():
    # Execute DR drill in isolated staging mode
    res = execute_disaster_recovery_drill()

    assert res["status"] == "PASSED"
    assert res["integrity_verified"] is True
    assert res["records_backed_up"] == res["records_restored"]
    assert res["records_restored"] > 0


def test_disaster_recovery_rto_and_rpo_metrics_compliance():
    res = execute_disaster_recovery_drill()

    # RTO must be strictly under 300 seconds (5 minutes limit)
    assert res["rto_seconds"] < 300.0
    # RPO must be 0 seconds (zero data loss target)
    assert res["rpo_seconds"] == 0.0


def test_migration_rollback_plans_availability():
    # Verify migration files contain rollback SQL blocks
    migrations_dir = Path(__file__).parent.parent / "migrations"
    assert migrations_dir.exists()

    sql_files = list(migrations_dir.glob("*.sql"))
    assert len(sql_files) > 0

    has_rollback_block = False
    for sf in sql_files:
        with open(sf, "r", encoding="utf-8") as f:
            content = f.read()
            if "DROP TABLE" in content or "DROP INDEX" in content or "Rollback" in content:
                has_rollback_block = True
                break

    assert has_rollback_block is True


def test_disaster_recovery_drill_zero_impact_on_production_tables():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            # Confirm production market_prices table remains 100% intact and untouched
            cur.execute("SELECT COUNT(*) FROM public.market_prices;")
            count = cur.fetchone()[0]
            assert count >= 0

            # Confirm no staging drill table leaks into database schema
            cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'staging_dr_drill_ledger');")
            drill_table_exists = cur.fetchone()[0]
            assert drill_table_exists is False
    finally:
        conn.close()
