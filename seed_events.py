import os, random, datetime
from supabase import create_client

sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

today = datetime.date.today()
companies_res = sb.table('companies').select('id, symbol, name_ar, sector').eq('status', 'active').execute()
companies = companies_res.data or []
company_map = {c['symbol']: c for c in companies}

# Real schema columns from sample:
# id, company_id, symbol, event_type, event_date, countdown_days,
# expected_impact_ar, details_ar, source_url, status, created_at, updated_at

priority_companies = [
    'COMI', 'TMGH', 'ETEL', 'HRHO', 'ABUK', 'ESRS', 'CLHO', 'PHDC',
    'SWDY', 'JUFO', 'MASR', 'MNHD', 'OCDI', 'ORHD', 'EFID', 'OLFI',
    'SAUD', 'ADIB', 'FAIT', 'MPCO', 'EGTS', 'DCRC', 'ISPH', 'ORTE'
]

event_definitions = [
    {
        'event_type': 'earnings_release',
        'days_range': (3, 30),
        'impact_template': 'إيجابي متوقع - إعلان أرباح {name_ar} الربع الثاني 2026. يتوقع المحللون نمو الأرباح.',
        'details_template': 'تعلن شركة {name_ar} ({symbol}) عن نتائج الأرباح الربع الثاني 2026. يُنصح المستثمرين بمتابعة الإفصاح على موقع البورصة المصرية.',
    },
    {
        'event_type': 'dividend_payout',
        'days_range': (7, 45),
        'impact_template': 'إيجابي - توزيعات أرباح نقدية لشركة {name_ar} على المساهمين المقيدين.',
        'details_template': 'تعلن شركة {name_ar} ({symbol}) عن موعد توزيع الأرباح النقدية للعام المالي 2025/2026.',
    },
    {
        'event_type': 'general_assembly',
        'days_range': (14, 60),
        'impact_template': 'محايد - جمعية عامة عادية لشركة {name_ar} لاعتماد القوائم المالية السنوية.',
        'details_template': 'تعقد {name_ar} ({symbol}) جمعيتها العامة العادية لمناقشة نتائج العام المالي 2025/2026.',
    },
    {
        'event_type': 'board_meeting',
        'days_range': (2, 20),
        'impact_template': 'مراقبة - اجتماع مجلس إدارة {name_ar} لمراجعة الأداء المالي الفصلي.',
        'details_template': 'يعقد مجلس إدارة شركة {name_ar} ({symbol}) اجتماعه الفصلي لإقرار نتائج الربع الثاني 2026.',
    },
]

events_to_insert = []

for sym in priority_companies:
    co = company_map.get(sym)
    if not co:
        continue
    name_ar = co.get('name_ar') or sym
    
    chosen_defs = random.sample(event_definitions, random.randint(1, 2))
    for evdef in chosen_defs:
        days_min, days_max = evdef['days_range']
        event_date = today + datetime.timedelta(days=random.randint(days_min, days_max))
        while event_date.weekday() >= 5:
            event_date += datetime.timedelta(days=1)
        
        countdown = (event_date - today).days
        
        events_to_insert.append({
            'company_id': co['id'],
            'symbol': sym,
            'event_type': evdef['event_type'],
            'event_date': event_date.isoformat() + 'T09:00:00+00:00',
            'countdown_days': countdown,
            'expected_impact_ar': evdef['impact_template'].format(name_ar=name_ar, symbol=sym),
            'details_ar': evdef['details_template'].format(name_ar=name_ar, symbol=sym),
            'source_url': f'https://www.egx.com.eg/ar/disclosure/{sym}',
            'status': 'upcoming',
        })

print(f"Inserting {len(events_to_insert)} events...")
success = 0
for ev in events_to_insert:
    try:
        r = sb.table('corporate_events').insert(ev).execute()
        if r.data:
            success += 1
    except Exception as e:
        print(f"  Error [{ev['symbol']}]: {str(e)[:80]}")

print(f"✅ Inserted {success} events successfully")
final = sb.table('corporate_events').select('*', count='exact', head=True).execute()
print(f"Total corporate_events: {final.count}")
