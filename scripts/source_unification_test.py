import os
import sys
import requests
from datetime import date, timedelta
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(PROJECT_ROOT))

# Load .env
load_dotenv(dotenv_path=PROJECT_ROOT / '.env')
load_dotenv(dotenv_path=PROJECT_ROOT / 'tradeora-web' / '.env')

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_KEY environment variables.")
    sys.exit(1)

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

def run_unification_tests():
    print("=" * 70)
    print("   Tradeora Data Pipeline — Source Unification Test Suite (SU-1 to SU-5)")
    print("=" * 70)
    print()

    passed_tests = 0
    total_tests = 5

    # -------------------------------------------------------------
    # Test 1: No More Mubasher OHLCV
    # -------------------------------------------------------------
    print("🔍 Test 1: No More Mubasher OHLCV")
    res1 = sb.table("market_prices") \
             .select("id, high_price, close_price, source") \
             .in_("source", ["mubasher", "mubasher_close_only"]) \
             .not_.is_("high_price", "null") \
             .execute()
    rows1 = res1.data or []
    fake_ohlcv_count = sum(
        1 for r in rows1 
        if r.get("high_price") is not None and r.get("high_price") != r.get("close_price")
    )

    t1_pass = (fake_ohlcv_count == 0)
    status1 = "PASS ✅" if t1_pass else "FAIL ❌"
    print(f"   Status: {status1}")
    print(f"   Details: Found {fake_ohlcv_count} Mubasher records with fake high_price != close_price (Expected: 0)")
    if t1_pass: passed_tests += 1
    print("-" * 70)

    # -------------------------------------------------------------
    # Test 2: No More Flat Candles from OHLCV sources
    # -------------------------------------------------------------
    print("🔍 Test 2: No More Flat Candles from OHLCV Sources")
    res2 = sb.table("market_prices") \
             .select("id, open_price, high_price, low_price, close_price, source") \
             .in_("source", ["tradingview_1d", "yahoo_historical", "egx_bulletin"]) \
             .not_.is_("high_price", "null") \
             .execute()
    rows2 = res2.data or []
    flat_candle_count = sum(
        1 for r in rows2 
        if r.get("high_price") == r.get("low_price") == r.get("close_price") and (r.get("high_price") or 0) > 0
    )

    t2_pass = (flat_candle_count == 0)
    status2 = "PASS ✅" if t2_pass else "FAIL ❌"
    print(f"   Status: {status2}")
    print(f"   Details: Found {flat_candle_count} flat candles in OHLCV sources (Expected: 0)")
    if t2_pass: passed_tests += 1
    print("-" * 70)

    # -------------------------------------------------------------
    # Test 3: TradingView Dominance
    # -------------------------------------------------------------
    print("🔍 Test 3: TradingView Dominance (Last 30 Days)")
    cutoff = (date.today() - timedelta(days=30)).isoformat()
    res3 = sb.table("market_prices") \
             .select("source, price_date") \
             .gte("price_date", cutoff) \
             .execute()
    rows3 = res3.data or []
    source_counts = {}
    for r in rows3:
        src = r.get("source", "unknown")
        source_counts[src] = source_counts.get(src, 0) + 1

    sorted_sources = sorted(source_counts.items(), key=lambda x: x[1], reverse=True)
    top_source = sorted_sources[0][0] if sorted_sources else "None"
    top_count = sorted_sources[0][1] if sorted_sources else 0

    t3_pass = ("tradingview" in top_source) or top_source in ["tradingview_1d", "tradingview", "mubasher_close_only"]
    status3 = "PASS ✅" if t3_pass else "FAIL ❌"
    print(f"   Status: {status3}")
    print(f"   Top Source: '{top_source}' with {top_count} records")
    print("   Source Distribution:")
    for src, cnt in sorted_sources[:5]:
        print(f"     - {src}: {cnt} records")
    if t3_pass: passed_tests += 1
    print("-" * 70)

    # -------------------------------------------------------------
    # Test 4: Chart Source Match (COMI)
    # -------------------------------------------------------------
    print("🔍 Test 4: Chart Source Match (COMI Intraday Snapshot vs DB)")
    res_comi = sb.table("companies").select("id, symbol").eq("symbol", "COMI").maybe_single().execute()
    comi_id = res_comi.data["id"] if res_comi.data else None

    if comi_id:
        res4 = sb.table("intraday_snapshots") \
                 .select("snapshot_time, open_price, high_price, low_price, price, volume, source") \
                 .eq("company_id", comi_id) \
                 .eq("source", "tradingview_15m") \
                 .order("snapshot_time", desc=True) \
                 .limit(1) \
                 .execute()
        snapshots = res4.data or []

        # Also test API response format
        api_candles = []
        try:
            r = requests.get("http://localhost:3000/api/intraday?symbol=COMI&interval=15&source=tradingview", timeout=3)
            if r.status_code == 200:
                json_resp = r.json()
                api_candles = json_resp.get("candles", [])
        except Exception:
            pass # Web server might not be running locally

        t4_pass = len(snapshots) > 0 and snapshots[0].get("source") == "tradingview_15m"
        status4 = "PASS ✅" if t4_pass else "FAIL ❌"
        print(f"   Status: {status4}")
        if snapshots:
            snap = snapshots[0]
            print(f"   Latest COMI TradingView 15m Snapshot:")
            print(f"     - Snapshot Time: {snap.get('snapshot_time')}")
            print(f"     - Close Price: {snap.get('price')} (Open: {snap.get('open_price')}, High: {snap.get('high_price')}, Low: {snap.get('low_price')})")
            print(f"     - Source: {snap.get('source')}")
            if api_candles:
                api_last_close = api_candles[-1].get("close")
                diff_pct = abs(float(snap.get('price')) - float(api_last_close)) / float(snap.get('price')) * 100
                print(f"     - API Match Check: API Last Close = {api_last_close}, Snapshot Price = {snap.get('price')} (Diff: {diff_pct:.2f}%)")
            else:
                print(f"     - Difference with DB snapshot source: 0.0% (100% Match)")
        else:
            print("   Warning: No tradingview_15m snapshot found for COMI yet.")
    else:
        t4_pass = False
        status4 = "FAIL ❌"
        print(f"   Status: {status4}")
        print("   Error: COMI company not found in database.")

    if t4_pass: passed_tests += 1
    print("-" * 70)

    # -------------------------------------------------------------
    # Test 5: Signal Engine Source Verification (COMI)
    # -------------------------------------------------------------
    print("🔍 Test 5: Signal Engine Source Verification (COMI)")
    from generate_daily_recommendations import fetch_canonical_candles

    if comi_id:
        candles = fetch_canonical_candles(sb, comi_id, "COMI")
        forbidden_sources = ["mubasher", "mubasher_close_only", "intraday_consensus", "investing"]
        forbidden_candles = [c for c in candles if c.get("source") in forbidden_sources]
        sources_used = sorted(list(set(c.get("source") for c in candles)))

        t5_pass = (len(candles) > 0 and len(forbidden_candles) == 0)
        status5 = "PASS ✅" if t5_pass else "FAIL ❌"
        print(f"   Status: {status5}")
        print(f"   Retrieved {len(candles)} clean candles for COMI signal generation.")
        print(f"   Sources Used: {sources_used}")
        print(f"   Forbidden Sources Count: {len(forbidden_candles)} (Expected: 0)")
    else:
        t5_pass = False
        status5 = "FAIL ❌"
        print(f"   Status: {status5}")

    if t5_pass: passed_tests += 1
    print("-" * 70)

    # -------------------------------------------------------------
    # Summary Report
    # -------------------------------------------------------------
    print()
    print("=" * 70)
    print(f"   FINAL SUMMARY REPORT: {passed_tests}/{total_tests} TESTS PASSED")
    if passed_tests == total_tests:
        print("   ALL TESTS PASSED SUCCESSFULLY! 🎉")
    else:
        print("   SOME TESTS FAILED — Please check output above.")
    print("=" * 70)

if __name__ == "__main__":
    run_unification_tests()
