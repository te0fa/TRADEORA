import os, datetime
from supabase import create_client

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "https://kdjsguozssxvtmlmqhpz.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

sb = create_client(SUPABASE_URL, SUPABASE_KEY)
today_str = datetime.date.today().isoformat() # 2026-08-02

print(f"📌 Updating official EGX investor flows for {today_str} from screenshot...")

# Exact data from official EGX screenshot
flow_record = {
    "trade_date": today_str,
    "foreigners_buy_egp": 77787353,
    "foreigners_sell_egp": 66627810,
    "foreigners_net_egp": 11159543,
    
    "foreign_inst_buy_egp": 70434778,
    "foreign_inst_sell_egp": 63383276,
    "foreign_inst_net_egp": 7051502,
    
    "egyptian_inst_buy_egp": 459537402,
    "egyptian_inst_sell_egp": 475950599,
    "egyptian_inst_net_egp": -16413197,
    
    "egyptian_ind_buy_egp": 5524954563,
    "egyptian_ind_sell_egp": 5418697450,
    "egyptian_ind_net_egp": 106257113,
    
    "arab_buy_egp": 129829886,
    "arab_sell_egp": 230833345,
    "arab_net_egp": -101003459,
    
    "total_volume_egp": 6192109204,
    "source": "EGX_OFFICIAL_CHARTS",
    "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
}

# Delete any existing record for today and insert
sb.table("daily_investor_flows").delete().eq("trade_date", today_str).execute()
res = sb.table("daily_investor_flows").insert(flow_record).execute()

if res.data:
    print("✅ Successfully seeded exact EGX official investor flows!")
    print(f"   - Foreigners Net: +{flow_record['foreigners_net_egp']:,} EGP")
    print(f"   - Egyptian Retail Net: +{flow_record['egyptian_ind_net_egp']:,} EGP")
    print(f"   - Egyptian Inst Net: {flow_record['egyptian_inst_net_egp']:,} EGP")
    print(f"   - Arab Net: {flow_record['arab_net_egp']:,} EGP")
else:
    print("❌ Failed to insert record.")
