import pytest
import os
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')

from services.canonical import (
    CANONICAL_SOURCES_DAILY,
    FORBIDDEN_SOURCES
)


def test_canonical_source_hierarchy_definition():
    # Priority order must strictly be: tradingview_1d > egx_bulletin > yahoo_historical
    assert CANONICAL_SOURCES_DAILY[0] == 'tradingview_1d'
    assert CANONICAL_SOURCES_DAILY[1] == 'egx_bulletin'
    assert CANONICAL_SOURCES_DAILY[2] == 'yahoo_historical'

    # Forbidden sources must include all synthetic / close-only / unreliable feeds
    assert 'mubasher' in FORBIDDEN_SOURCES
    assert 'mubasher_close_only' in FORBIDDEN_SOURCES
    assert 'intraday_consensus' in FORBIDDEN_SOURCES
    assert 'investing' in FORBIDDEN_SOURCES


def test_pure_resolver_priority_and_forbidden_filter():
    # Simulate candidate records for a company
    candidates = [
        {"company_id": "c1", "price_date": "2026-08-10", "close_price": 50.0, "source": "mubasher_close_only"},
        {"company_id": "c1", "price_date": "2026-08-10", "close_price": 52.0, "source": "intraday_consensus"},
        {"company_id": "c1", "price_date": "2026-08-10", "close_price": 51.5, "source": "yahoo_historical"},
        {"company_id": "c1", "price_date": "2026-08-10", "close_price": 51.8, "source": "egx_bulletin"},
        {"company_id": "c1", "price_date": "2026-08-10", "close_price": 51.9, "source": "tradingview_1d"},
    ]

    # Filter out forbidden
    allowed = [c for c in candidates if c["source"] not in FORBIDDEN_SOURCES]
    assert len(allowed) == 3
    assert not any(c["source"] in ('mubasher_close_only', 'intraday_consensus') for c in allowed)

    # Sort by canonical priority rank
    def get_rank(item):
        src = item["source"]
        return CANONICAL_SOURCES_DAILY.index(src) if src in CANONICAL_SOURCES_DAILY else 999

    allowed.sort(key=get_rank)
    best = allowed[0]

    assert best["source"] == "tradingview_1d"
    assert best["close_price"] == 51.9


def test_rpc_get_latest_prices_in_db_excludes_forbidden_sources():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            # Query the updated RPC function
            cur.execute("SELECT company_id, close_price, source, price_date FROM get_latest_prices();")
            rows = cur.fetchall()

            for r in rows:
                source = r[2]
                assert source not in FORBIDDEN_SOURCES, f"RPC returned forbidden source: {source}"
                assert source in CANONICAL_SOURCES_DAILY, f"RPC returned non-canonical source: {source}"
                assert r[1] > 0, "Price must be strictly positive"
    finally:
        conn.close()


def test_regression_no_forbidden_sources_in_active_api_routes():
    repo_root = Path(__file__).parent.parent
    web_lib = repo_root / "tradeora-web" / "lib"
    web_api = repo_root / "tradeora-web" / "app" / "api"

    # Check queries.ts
    queries_content = (web_lib / "queries.ts").read_text(encoding="utf-8")
    assert "fetchCanonicalLatestPrices" in queries_content

    # Check screener route
    screener_content = (web_api / "screener" / "route.ts").read_text(encoding="utf-8")
    assert "fetchCanonicalLatestPrices" in screener_content
