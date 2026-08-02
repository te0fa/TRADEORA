import os
from supabase import create_client

sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

LAUNCH_DATE = '2026-07-30T00:00:00+00:00'

try:
    q1 = sb.from_('recommended_trades').select('*, companies(name_ar, name_en, sector, is_shariah_compliant)').or_('exit_reason.is.null,exit_reason.neq.pre_launch_reset').gte('recommended_at', LAUNCH_DATE).order('recommended_at', desc=True).limit(100)
    res1 = q1.execute()
    print("Q1 trades count:", len(res1.data or []))
except Exception as e:
    print("Q1 error:", e)

try:
    q2 = sb.from_('recommended_trades').select('pnl_percent, status, exit_reason, direction, ml_probability, features_snapshot').eq('status', 'closed').or_('exit_reason.is.null,exit_reason.neq.pre_launch_reset').gte('recommended_at', LAUNCH_DATE)
    res2 = q2.execute()
    print("Q2 closed count:", len(res2.data or []))
except Exception as e:
    print("Q2 error:", e)
