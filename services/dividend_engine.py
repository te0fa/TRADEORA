"""
services/dividend_engine.py — Cash Dividend & Total Return Accounting Engine
=============================================================================
Implementation of Cash Dividend Semantics & Total Return Architecture.

Egyptian Tax Law Context:
- Per Egyptian Law No. 199 of 2020 (amending Law 91/2005), the withholding tax rate
  on cash dividends for equities listed on the Egyptian Exchange (EGX) is 5.0% (0.05).

Total Return Formula:
  Capital Price P&L (EGP) = (Exit Price - Entry Price) * Shares
  Net Dividend Income (EGP) = Gross Dividend * (1 - Tax Rate)
  Total Return (EGP) = Capital Price P&L + Net Dividend Income - Fees
  Total Return (%) = (Total Return EGP / Initial Invested EGP) * 100
"""

import os
import logging
from datetime import date, datetime, timezone
from typing import Dict, Any, List, Optional
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

logger = logging.getLogger("tradeora.dividend_engine")

EGYPT_LISTED_DIVIDEND_TAX_RATE = 0.05  # 5% Tax Law 199/2020 for listed EGX equities
DATABASE_URL = os.getenv('DATABASE_URL')


def get_db_conn():
    if DATABASE_URL:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        return conn
    return None


def calculate_dividend_cash(
    shares_held: int,
    amount_per_share: float,
    withholding_tax_rate: float = EGYPT_LISTED_DIVIDEND_TAX_RATE
) -> Dict[str, float]:
    """
    Computes gross dividend income, Egyptian withholding tax, and net cash received.
    """
    if shares_held <= 0 or amount_per_share <= 0 or withholding_tax_rate < 0:
        raise ValueError(f"Invalid inputs: shares={shares_held}, amount={amount_per_share}, tax={withholding_tax_rate}")

    gross = shares_held * amount_per_share
    tax = gross * withholding_tax_rate
    net = gross - tax

    return {
        "shares_held": shares_held,
        "amount_per_share": round(amount_per_share, 4),
        "gross_amount": round(gross, 2),
        "withholding_tax_rate": round(withholding_tax_rate, 4),
        "tax_amount": round(tax, 2),
        "net_amount": round(net, 2)
    }


def calculate_total_return(
    entry_price: float,
    exit_price: float,
    shares_held: int,
    net_dividends_egp: float = 0.0,
    fees_egp: float = 0.0
) -> Dict[str, float]:
    """
    Segregates Capital Price P&L from Dividend Income and computes total return.
    """
    if entry_price <= 0 or shares_held <= 0:
        raise ValueError("entry_price and shares_held must be strictly positive")

    initial_investment = entry_price * shares_held
    price_pnl_egp = (exit_price - entry_price) * shares_held
    price_pnl_pct = (price_pnl_egp / initial_investment) * 100.0

    dividend_yield_pct = (net_dividends_egp / initial_investment) * 100.0 if initial_investment > 0 else 0.0

    total_return_egp = price_pnl_egp + net_dividends_egp - fees_egp
    total_return_pct = (total_return_egp / initial_investment) * 100.0

    return {
        "initial_investment_egp": round(initial_investment, 2),
        "price_pnl_egp": round(price_pnl_egp, 2),
        "price_pnl_pct": round(price_pnl_pct, 2),
        "net_dividends_egp": round(net_dividends_egp, 2),
        "dividend_yield_pct": round(dividend_yield_pct, 2),
        "fees_egp": round(fees_egp, 2),
        "total_return_egp": round(total_return_egp, 2),
        "total_return_pct": round(total_return_pct, 2)
    }


def record_dividend_income(
    company_id: str,
    symbol: str,
    ex_date: date | str,
    shares_held: int,
    amount_per_share: float,
    trade_id: Optional[str] = None,
    portfolio_id: Optional[str] = None,
    withholding_tax_rate: float = EGYPT_LISTED_DIVIDEND_TAX_RATE,
    conn=None
) -> Dict[str, Any]:
    """
    Records a cash dividend receipt into public.dividend_income_ledger and public.corporate_actions.
    """
    calc = calculate_dividend_cash(shares_held, amount_per_share, withholding_tax_rate)
    ex_d_str = str(ex_date)[:10]

    close_conn = False
    if conn is None:
        conn = get_db_conn()
        close_conn = True

    if not conn:
        logger.warning("No DB connection available; returning calculated dividend dict only.")
        return calc

    try:
        with conn.cursor() as cur:
            # 1. Record in dividend_income_ledger
            cur.execute("""
                INSERT INTO public.dividend_income_ledger (
                    company_id, symbol, trade_id, portfolio_id, ex_date,
                    shares_held, amount_per_share, gross_amount, withholding_tax_rate,
                    tax_amount, net_amount
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (symbol, ex_date, trade_id) DO UPDATE SET
                    shares_held = EXCLUDED.shares_held,
                    amount_per_share = EXCLUDED.amount_per_share,
                    gross_amount = EXCLUDED.gross_amount,
                    tax_amount = EXCLUDED.tax_amount,
                    net_amount = EXCLUDED.net_amount,
                    updated_at = NOW();
            """, (
                company_id, symbol, trade_id, portfolio_id, ex_d_str,
                shares_held, amount_per_share, calc["gross_amount"], withholding_tax_rate,
                calc["tax_amount"], calc["net_amount"]
            ))

            # 2. Record in corporate_actions registry
            cur.execute("""
                INSERT INTO public.corporate_actions (
                    company_id, symbol, action_type, ex_date, ratio, adjustment_factor,
                    confirmed_by, notes
                ) VALUES (%s, %s, 'CASH_DIVIDEND', %s, %s, 1.0, 'EGX Official Disclosure Bulletin', %s)
                ON CONFLICT (company_id, ex_date, action_type) DO UPDATE SET
                    notes = EXCLUDED.notes,
                    updated_at = NOW();
            """, (
                company_id, symbol, ex_d_str, amount_per_share,
                f"Cash Dividend of {amount_per_share} EGP/share. Net: {calc['net_amount']} EGP (after 5% tax)"
            ))

        logger.info(f"Recorded Cash Dividend for {symbol} on {ex_d_str}: Net {calc['net_amount']} EGP (Gross: {calc['gross_amount']} EGP, Tax: {calc['tax_amount']} EGP)")
        return calc
    finally:
        if close_conn:
            conn.close()
