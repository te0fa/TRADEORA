import pytest
from services.financial_ledger_engine import (
    InMemoryLedgerAccount,
    FinancialLedgerError,
    DuplicateTransactionError,
    NegativeCashBalanceError,
    CurrencyMismatchError,
    InsufficientSharesError
)


def test_hand_calculated_penny_perfect_reconciliation():
    """
    Hand-calculated benchmark scenario:
    1. Initial Deposit: EGP 100,000.00
    2. Buy 1,000 shares COMI @ EGP 50.00 (Brokerage Fee 0.15% = EGP 75.00) -> Cash = 100000 - 50075 = 49,925.00 EGP
    3. Sell 1,000 shares COMI @ EGP 55.00 (Brokerage Fee 0.15% = EGP 82.50, Tax = EGP 5.00) -> Net Proceeds = 55000 - 87.50 = 54,912.50 EGP
       Cash after sell = 49925 + 54912.50 = 104,837.50 EGP
    4. Dividend: EGP 2,000 gross - 5% tax (100 EGP) = EGP 1,900 net -> Cash = 104837.50 + 1900 = 106,737.50 EGP
    """
    account = InMemoryLedgerAccount(initial_cash=0.0)

    # 1. Deposit
    account.record_transaction("DEPOSIT", amount=100000.0, idempotency_key="TX_DEP_01")
    assert account.cash_balance == 100000.0

    # 2. Buy
    account.record_transaction(
        "BUY_EXECUTION",
        amount=50000.0,
        symbol="COMI",
        shares=1000,
        price=50.0,
        fee=75.0,
        idempotency_key="TX_BUY_01"
    )
    assert account.cash_balance == 49925.0
    assert account.positions["COMI"]["shares"] == 1000
    assert account.positions["COMI"]["cost_basis"] == 50.0

    # 3. Sell
    account.record_transaction(
        "SELL_EXECUTION",
        amount=55000.0,
        symbol="COMI",
        shares=1000,
        price=55.0,
        fee=82.50,
        tax=5.0,
        idempotency_key="TX_SELL_01"
    )
    assert account.cash_balance == 104837.50
    assert "COMI" not in account.positions # Zero position cleared

    # 4. Dividend
    account.record_transaction(
        "DIVIDEND_PAYMENT",
        amount=2000.0,
        tax=100.0, # 5% withholding tax
        idempotency_key="TX_DIV_01"
    )

    # Penny-perfect match assertion
    assert account.cash_balance == 106737.50


def test_partial_sells_and_weighted_average_cost_basis():
    account = InMemoryLedgerAccount(initial_cash=10000.0)

    # Buy 100 shares @ 10 EGP
    account.record_transaction("BUY_EXECUTION", amount=1000.0, symbol="EAST", shares=100, price=10.0)
    assert account.positions["EAST"]["cost_basis"] == 10.0

    # Buy 100 shares @ 20 EGP
    account.record_transaction("BUY_EXECUTION", amount=2000.0, symbol="EAST", shares=100, price=20.0)
    assert account.positions["EAST"]["shares"] == 200
    assert account.positions["EAST"]["cost_basis"] == 15.0 # (1000 + 2000) / 200 = 15.0 EGP

    # Partial Sell 50 shares
    account.record_transaction("SELL_EXECUTION", amount=1000.0, symbol="EAST", shares=50, price=20.0)
    assert account.positions["EAST"]["shares"] == 150
    assert account.positions["EAST"]["cost_basis"] == 15.0 # Cost basis per share stays 15.0 EGP


def test_idempotency_duplicate_rejection():
    account = InMemoryLedgerAccount(initial_cash=5000.0)

    account.record_transaction("DEPOSIT", amount=1000.0, idempotency_key="UNIQUE_KEY_001")

    with pytest.raises(DuplicateTransactionError):
        account.record_transaction("DEPOSIT", amount=1000.0, idempotency_key="UNIQUE_KEY_001")


def test_negative_cash_balance_protection():
    account = InMemoryLedgerAccount(initial_cash=500.0)

    with pytest.raises(NegativeCashBalanceError):
        account.record_transaction("WITHDRAWAL", amount=1000.0)

    with pytest.raises(NegativeCashBalanceError):
        account.record_transaction("BUY_EXECUTION", amount=1000.0, symbol="SWDY", shares=100, price=10.0)


def test_currency_mismatch_rejection():
    account = InMemoryLedgerAccount(base_currency="EGP", initial_cash=1000.0)

    with pytest.raises(CurrencyMismatchError):
        account.record_transaction("DEPOSIT", amount=100.0, currency="USD")
