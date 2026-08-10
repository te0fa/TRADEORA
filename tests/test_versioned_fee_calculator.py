import pytest
import os
import psycopg2
from decimal import Decimal
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')

from services.versioned_fee_calculator import (
    calculate_transaction_fees_decimal,
    fetch_fee_schedule_for_date,
    get_db_conn
)


def test_decimal_precision_prevents_float_drift():
    amount = Decimal("100000.00")
    res = calculate_transaction_fees_decimal(amount, trade_type="buy", tx_date="2026-08-11")

    # Assert Decimal accuracy
    assert isinstance(res["total_fee_decimal"], Decimal)
    # Total fee = 0.15% commission + 0.012% egx fee + 0.05% stamp tax = 0.212%
    # 100,000 * 0.00212 = 212.0000 EGP exactly
    assert res["total_fee_decimal"] == Decimal("212.0000")


def test_time_versioned_fee_schedules_historical_accuracy():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()

    try:
        # Date 1: 2020-05-01 (Legacy Stamp Tax = 0.125%)
        res_2020 = calculate_transaction_fees_decimal(
            trade_amount=Decimal("100000.00"),
            trade_type="buy",
            tx_date="2020-05-01",
            conn=conn
        )

        # Date 2: 2024-05-01 (Amended Stamp Tax = 0.05%)
        res_2024 = calculate_transaction_fees_decimal(
            trade_amount=Decimal("100000.00"),
            trade_type="buy",
            tx_date="2024-05-01",
            conn=conn
        )

        # Legacy 2020 stamp tax was higher (125 EGP) than 2024 stamp tax (50 EGP)
        assert res_2020["fee_breakdown"]["stamp_tax"] == 125.0
        assert res_2024["fee_breakdown"]["stamp_tax"] == 50.0

        # Total fee in 2020 > Total fee in 2024
        assert res_2020["total_fee"] > res_2024["total_fee"]

    finally:
        conn.close()


def test_round_trip_fee_breakdown():
    amount_buy = Decimal("50000.00")
    amount_sell = Decimal("55000.00")

    buy_fees = calculate_transaction_fees_decimal(amount_buy, trade_type="buy", tx_date="2026-08-11")
    sell_fees = calculate_transaction_fees_decimal(amount_sell, trade_type="sell", tx_date="2026-08-11")

    assert buy_fees["total_fee"] == 106.0 # 50000 * 0.00212 = 106.0 EGP
    assert sell_fees["total_fee"] == 116.6 # 55000 * 0.00212 = 116.6 EGP
