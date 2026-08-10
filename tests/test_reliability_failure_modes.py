import pytest
import time
import os
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')

from services.reliability_engine import (
    execute_with_retry,
    IdempotentTaskExecutor,
    MaxRetriesExceededError
)


def test_idempotent_task_executor_prevents_duplicate_financial_action():
    executor = IdempotentTaskExecutor()
    task_key = "tx_deposit_account_123_epoch_99"

    execution_counter = {"count": 0}

    def process_financial_deposit():
        execution_counter["count"] += 1
        return {"status": "SUCCESS", "tx_id": "tx_9988", "amount": 5000.0}

    # First Execution -> Should run task_func
    is_new_1, res_1 = executor.execute_idempotent_task(task_key, process_financial_deposit)
    assert is_new_1 is True
    assert res_1["amount"] == 5000.0
    assert execution_counter["count"] == 1

    # Second Replay Execution (Worker Retry / Duplicate Call) -> Must NOT run task_func again!
    is_new_2, res_2 = executor.execute_idempotent_task(task_key, process_financial_deposit)
    assert is_new_2 is False
    assert res_2["amount"] == 5000.0
    assert execution_counter["count"] == 1 # Execution counter remains 1! Zero duplicate financial actions!


def test_exponential_backoff_retry_on_transient_failure():
    attempts = {"count": 0}

    def flaky_api_call():
        attempts["count"] += 1
        if attempts["count"] < 2:
            raise ConnectionError("Transient network drop")
        return {"price": 52.5, "source": "tradingview_1d"}

    res = execute_with_retry(flaky_api_call, max_retries=3, initial_delay=0.01)

    assert attempts["count"] == 2
    assert res["price"] == 52.5


def test_max_retries_exceeded_on_hard_failure():
    def broken_api_call():
        raise TimeoutError("Third-party vendor unavailable")

    with pytest.raises(MaxRetriesExceededError):
        execute_with_retry(broken_api_call, max_retries=3, initial_delay=0.01)


def test_network_drop_after_commit_recovery():
    executor = IdempotentTaskExecutor()
    batch_key = "batch_trade_reconciliation_2026_08_10"

    def record_trade():
        return {"committed_trades": 5, "total_value": 150000.0}

    # Simulate execution & DB commit
    is_new_1, res_1 = executor.execute_idempotent_task(batch_key, record_trade)
    assert is_new_1 is True

    # Simulate network drop during response, followed by client retry
    is_new_2, res_2 = executor.execute_idempotent_task(batch_key, record_trade)
    assert is_new_2 is False
    assert res_1 == res_2
