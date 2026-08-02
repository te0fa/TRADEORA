"""
apply_critical_fixes.py
=======================
ينفذ الإصلاحات الحرجة الثلاثة:
1. إضافة عمود flow_signal في recommended_trades
2. إضافة حقول Shariah في companies
3. إنشاء جدول egx_shariah_index
"""
import os
from dotenv import load_dotenv
load_dotenv()
from supabase import create_client

url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb  = create_client(url, key)

import httpx

def run_sql(description, sql):
    """Run SQL via Supabase management API."""
    mgmt_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    project   = url.replace('https://','').split('.')[0]
    endpoint  = f'https://api.supabase.com/v1/projects/{project}/database/query'
    headers   = {'Authorization': f'Bearer {mgmt_key}', 'Content-Type': 'application/json'}
    try:
        r = httpx.post(endpoint, json={'query': sql}, headers=headers, timeout=20)
        if r.status_code in (200, 201):
            print(f'  ✅ {description}')
            return True
        else:
            print(f'  ⚠️  {description}: {r.status_code} {r.text[:100]}')
            return False
    except Exception as e:
        print(f'  ❌ {description}: {e}')
        return False

def verify_column(table, col):
    try:
        sb.table(table).select(col).limit(1).execute()
        return True
    except:
        return False

print("=" * 55)
print("  TRADEORA Critical Fixes")
print("=" * 55)

# ── FIX 1: flow_signal column ───────────────────────────────
print("\n🔧 Fix 1: flow_signal column in recommended_trades")
if verify_column('recommended_trades', 'flow_signal'):
    print("  ✅ Already exists")
else:
    run_sql(
        "Add flow_signal column",
        "ALTER TABLE public.recommended_trades ADD COLUMN IF NOT EXISTS flow_signal VARCHAR(20) DEFAULT 'neutral';"
    )
    if verify_column('recommended_trades', 'flow_signal'):
        print("  ✅ Verified!")
    else:
        print("  ❌ Still missing – run SQL manually in Supabase Dashboard")

# ── FIX 2: Shariah columns ──────────────────────────────────
print("\n🔧 Fix 2: Shariah columns in companies")
shariah_cols = ['is_egx_shariah_listed', 'is_boubyan_compliant', 'kasheif_purification_ratio']
missing = [c for c in shariah_cols if not verify_column('companies', c)]

if not missing:
    print("  ✅ All Shariah columns already exist")
else:
    print(f"  Missing: {missing}")
    run_sql(
        "Add Shariah columns",
        """
        ALTER TABLE public.companies
        ADD COLUMN IF NOT EXISTS is_egx_shariah_listed BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_boubyan_compliant BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS kasheif_purification_ratio DECIMAL(5,2);
        """
    )
    still_missing = [c for c in shariah_cols if not verify_column('companies', c)]
    if not still_missing:
        print("  ✅ All Shariah columns added!")
    else:
        print(f"  ❌ Still missing: {still_missing}")

# ── FIX 3: egx_shariah_index table ─────────────────────────
print("\n🔧 Fix 3: egx_shariah_index table")
try:
    sb.table('egx_shariah_index').select('symbol').limit(1).execute()
    print("  ✅ Table already exists")
except:
    run_sql(
        "Create egx_shariah_index table",
        """
        CREATE TABLE IF NOT EXISTS public.egx_shariah_index (
            symbol      TEXT PRIMARY KEY,
            added_date  DATE DEFAULT CURRENT_DATE,
            notes       TEXT
        );
        """
    )

print("\n✅ Fixes applied. Check Supabase Dashboard if any failed.")
print("=" * 55)
