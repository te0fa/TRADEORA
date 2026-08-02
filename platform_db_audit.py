"""
platform_db_audit.py - فحص شامل لحالة قاعدة البيانات
"""
import os, sys
from datetime import date, timedelta
from dotenv import load_dotenv
load_dotenv()
from supabase import create_client

url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb  = create_client(url, key)

def count(table, filters=None):
    q = sb.table(table).select('id', count='exact')
    if filters:
        for k, v in filters.items():
            q = q.eq(k, v)
    try:
        return q.execute().count
    except:
        return '?'

def latest(table, col):
    try:
        r = sb.table(table).select(col).order(col, desc=True).limit(1).execute()
        return r.data[0][col] if r.data else 'EMPTY'
    except Exception as e:
        return f'ERR: {e}'

print("=" * 65)
print("   TRADEORA DATABASE AUDIT")
print("=" * 65)

# Companies
print("\n📊 COMPANIES")
total_co    = count('companies')
active_co   = count('companies', {'status': 'active'})
shariah_co  = count('companies', {'is_shariah_compliant': True})
print(f"  Total: {total_co} | Active: {active_co} | Shariah: {shariah_co}")

# Check new shariah fields
try:
    r = sb.table('companies').select('is_egx_shariah_listed,is_boubyan_compliant,kasheif_purification_ratio').limit(1).execute()
    print(f"  New Shariah Fields: ✅ EXISTS")
    row = r.data[0] if r.data else {}
    print(f"    is_egx_shariah_listed: {row.get('is_egx_shariah_listed', 'N/A')}")
    print(f"    is_boubyan_compliant: {row.get('is_boubyan_compliant', 'N/A')}")
    print(f"    kasheif_purification_ratio: {row.get('kasheif_purification_ratio', 'N/A')}")
except Exception as e:
    print(f"  New Shariah Fields: ❌ MISSING ({e})")

# Market Prices (historical candles)
print("\n📈 MARKET PRICES (Historical Candles)")
total_prices = count('market_prices')
latest_price = latest('market_prices', 'price_date')
print(f"  Total candles: {total_prices:,}")
print(f"  Latest date: {latest_price}")
# By source
for src in ['yahoo_1d', 'tradingview_1d', 'tradingview_15m', 'yahoo_15m']:
    c = count('market_prices', {'source': src})
    print(f"  [{src}]: {c:,}")

# Intraday Snapshots
print("\n⚡ INTRADAY SNAPSHOTS")
total_intraday = count('intraday_snapshots')
latest_intra   = latest('intraday_snapshots', 'snapshot_time')
print(f"  Total: {total_intraday:,} | Latest: {latest_intra}")

# Recommended Trades
print("\n💼 RECOMMENDED TRADES")
total_recs  = count('recommended_trades')
active_recs = count('recommended_trades', {'status': 'active'})
closed_recs = count('recommended_trades', {'status': 'closed'})
print(f"  Total: {total_recs} | Active: {active_recs} | Closed: {closed_recs}")
# Check flow_signal column
try:
    r = sb.table('recommended_trades').select('flow_signal').limit(1).execute()
    vals = [x.get('flow_signal') for x in r.data]
    print(f"  flow_signal column: ✅ EXISTS (sample: {vals})")
except Exception as e:
    print(f"  flow_signal column: ❌ MISSING")

# Latest recommendations
try:
    r = sb.table('recommended_trades').select('company_id,status,ml_probability,flow_signal,recommended_at').order('recommended_at', desc=True).limit(5).execute()
    print(f"  Latest 5 recs:")
    for rec in r.data:
        print(f"    {rec.get('recommended_at','')[:10]} | {rec.get('status')} | prob={rec.get('ml_probability')} | flow={rec.get('flow_signal')}")
except Exception as e:
    print(f"  Error fetching latest: {e}")

# Daily Investor Flows
print("\n🌍 DAILY INVESTOR FLOWS")
try:
    total_flows = count('daily_investor_flows')
    latest_flow = latest('daily_investor_flows', 'trade_date')
    print(f"  Total days: {total_flows} | Latest: {latest_flow}")
    # Sample latest
    r = sb.table('daily_investor_flows').select('trade_date,foreigners_net_egp,source').order('trade_date', desc=True).limit(3).execute()
    for row in r.data:
        net = float(row.get('foreigners_net_egp') or 0) / 1e6
        print(f"    {row.get('trade_date')}: foreigners_net={net:+.1f}M | source={row.get('source')}")
except Exception as e:
    print(f"  ERROR: {e}")

# Sector Investor Flows
print("\n🏭 SECTOR INVESTOR FLOWS")
try:
    total_sector = count('sector_investor_flows')
    latest_sector = latest('sector_investor_flows', 'trade_date')
    print(f"  Total: {total_sector} | Latest: {latest_sector}")
except Exception as e:
    print(f"  ERROR: {e}")

# Volume Profiles
print("\n📊 VOLUME PROFILES (VPOC/VAH/VAL)")
try:
    total_vp = count('volume_profiles')
    print(f"  Total: {total_vp}")
except Exception as e:
    print(f"  Table missing: {e}")

# Technical Levels
print("\n📐 TECHNICAL LEVELS")
try:
    total_tl = count('technical_levels')
    print(f"  Total: {total_tl}")
except Exception as e:
    print(f"  Table missing: {e}")

# Seasonality
print("\n🗓️ SEASONALITY PATTERNS")
try:
    total_s = count('seasonality_patterns')
    print(f"  Total: {total_s}")
except Exception as e:
    print(f"  Table missing: {e}")

# Corporate Events
print("\n📅 CORPORATE EVENTS")
try:
    total_ce = count('corporate_events')
    print(f"  Total: {total_ce}")
except Exception as e:
    print(f"  Table missing: {e}")

# Company Foreign Ownership
print("\n🌍 COMPANY FOREIGN OWNERSHIP")
try:
    total_fo = count('company_foreign_ownership')
    print(f"  Total: {total_fo}")
except Exception as e:
    print(f"  Table missing: {e}")

# Shariah Audit Log
print("\n☪️  SHARIAH AUDIT LOG")
try:
    total_sal = count('shariah_audit_log')
    print(f"  Total: {total_sal}")
except:
    print(f"  Table missing")

# EGX Shariah Index table
print("\n🏛️  EGX SHARIAH INDEX TABLE")
try:
    total_esi = count('egx_shariah_index')
    print(f"  Total: {total_esi}")
    r = sb.table('egx_shariah_index').select('symbol').execute()
    symbols = [x['symbol'] for x in r.data]
    print(f"  Symbols: {symbols}")
except Exception as e:
    print(f"  Table missing: {e}")

print("\n" + "=" * 65)
print("DB Audit Complete")
print("=" * 65)
