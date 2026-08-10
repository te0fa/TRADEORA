import os, datetime
from supabase import create_client

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "https://kdjsguozssxvtmlmqhpz.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

sb = create_client(SUPABASE_URL, SUPABASE_KEY)
today_str = datetime.date.today().isoformat()

print(f"⚡ Seeding exact official EGX live investor flows from screenshot for {today_str}...")

sb.table("daily_investor_flows").delete().eq("trade_date", today_str).execute()

# Exact figures from official EGX live page (13:58 Cairo time screenshot)
exact_flow = {
    "trade_date": today_str,
    # Total Foreigners (أجانب)
    "foreigners_buy_egp": 97547652,
    "foreigners_sell_egp": 83362728,
    "foreigners_net_egp": 14184924,

    # Total Arabs (عرب)
    "arab_buy_egp": 303150344,
    "arab_sell_egp": 497175091,
    "arab_net_egp": -194024747,

    # Egyptian Retail (أفراد مصريين)
    "egyptian_ind_buy_egp": 7620537060,
    "egyptian_ind_sell_egp": 6952632441,
    "egyptian_ind_net_egp": 667904619,

    # Foreign Institutional (مؤسسات أجنبية)
    "foreign_inst_buy_egp": 87049347,
    "foreign_inst_sell_egp": 78614651,
    "foreign_inst_net_egp": 8434697,

    # Egyptian Institutional (مؤسسات مصرية)
    "egyptian_inst_buy_egp": 17727999063,
    "egyptian_inst_sell_egp": 18216063860,
    "egyptian_inst_net_egp": -488064796,

    "total_volume_egp": 25749234119,
    "source": "egx_official_live_screenshot"
}

res = sb.table("daily_investor_flows").insert(exact_flow).execute()

print("🎉 Successfully seeded exact live EGX investor flows!")
