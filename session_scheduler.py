import os
import sys
import time
import subprocess
from datetime import datetime, timezone, timedelta

# Cairo Timezone (UTC+3)
CAIRO_TZ = timezone(timedelta(hours=3))

# Egyptian Stock Market Official Hours: Sunday to Thursday (10:00 AM to 2:30 PM)
SESSION_TIMES = ["10:00", "11:30", "13:00", "14:30"]

def get_cairo_now():
    return datetime.now(CAIRO_TZ)

def run_analysis():
    now_str = get_cairo_now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n🚀 [{now_str}] Starting EGX 1.5-Hour Automated Quantitative Analysis Scan...")
    try:
        result = subprocess.run([sys.executable, "predict.py"], check=True, capture_output=True, text=True)
        print(f"✅ [{now_str}] Analysis Scan Completed Successfully!")
        print(result.stdout[-300:])
    except subprocess.CalledProcessError as e:
        print(f"❌ Error executing predict.py: {e.stderr}")

def main():
    print("=" * 65)
    print("🤖 TRADEORA Intraday Analysis Scheduler (Every 1.5 Hours)")
    print("⏰ Schedule: 10:00 AM, 11:30 AM, 01:00 PM, 02:30 PM (Cairo Time)")
    print("=" * 65)

    last_executed_slot = None

    while True:
        now = get_cairo_now()
        current_time_str = now.strftime("%H:%M")
        weekday = now.weekday() # 0: Mon, 1: Tue, 2: Wed, 3: Thu, 4: Fri, 5: Sat, 6: Sun

        # Egyptian market operates Sunday (6) to Thursday (3)
        is_market_day = weekday in [6, 0, 1, 2, 3]

        if is_market_day:
            for slot in SESSION_TIMES:
                slot_hour, slot_min = map(int, slot.split(":"))
                slot_time = now.replace(hour=slot_hour, minute=slot_min, second=0, microsecond=0)
                
                # Check if we are within 5 minutes of scheduled slot and haven't run for this slot
                time_diff = abs((now - slot_time).total_seconds())
                if time_diff <= 300 and last_executed_slot != slot:
                    print(f"\n🔔 Scheduled Slot Matched: {slot} Cairo Time. Triggering Analysis...")
                    run_analysis()
                    last_executed_slot = slot
                    break

        # Reset slot lock after market closes (after 15:00)
        if now.hour >= 15:
            last_executed_slot = None

        time.sleep(30)

if __name__ == "__main__":
    main()
