import os
from supabase import create_client
from datetime import date

def validate_daily_import():
    sb = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_ROLE_KEY'])
    today = date.today().isoformat()
    violations = []
    
    # فحص 1: عدد الأسهم المحدّثة
    res = sb.table('market_prices').select('*', count='exact').eq('price_date', today).execute()
    if res.count < 200:
        violations.append(f"❌ فقط {res.count} سهم اتحدث (أقل من 200)")
    
    # فحص 2: أسهم بسعر صفر
    zero = sb.table('market_prices').select('*', count='exact').eq('price_date', today).lte('close_price', 0).execute()
    if zero.count > 10:
        violations.append(f"⚠️ {zero.count} سهم بسعر = 0")
    
    # فحص 3: تغيير% شاذ (> 25%)
    extreme = sb.table('market_prices').select('*', count='exact').eq('price_date', today).gte('change_percent', 25).execute()
    if extreme.count > 5:
        violations.append(f"⚠️ {extreme.count} سهم بتغيير > 25%")
    
    # إرسال تقرير Telegram
    total = res.count
    msg = f"📊 تقرير TRADEORA {today}\n✅ {total} سهم اتحدث\n"
    msg += "\n".join(violations) if violations else "✅ كل البيانات سليمة"
    
    bot = os.environ.get('TELEGRAM_BOT_TOKEN')
    chat = os.environ.get('TELEGRAM_CHAT_ID')
    if bot and chat:
        import requests
        requests.post(f"https://api.telegram.org/bot{bot}/sendMessage",
                     json={"chat_id": chat, "text": msg})
    
    print(msg)
    return len(violations) == 0

if __name__ == "__main__":
    validate_daily_import()
