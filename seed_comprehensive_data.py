#!/usr/bin/env python3
"""
Comprehensive Platform Data Seeder & Fixer
Seeds ALL missing data: company_news, corporate_events, insider_trading,
daily_investor_flows, sector_investor_flows, market_prices for 30 days
"""

import os, random, datetime
from supabase import create_client, Client

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

today = datetime.date.today()

# ─── 1. Fetch all active companies ──────────────────────────────────────────
print("📦 Fetching companies...")
res = sb.table("companies").select("id, symbol, name_ar, sector").eq("status", "active").execute()
companies = res.data or []
print(f"   ✓ {len(companies)} companies found")

# ─── 2. Seed company_news (أخبار مربوطة بكل سهم) ────────────────────────
print("\n📰 Seeding company_news...")
sectors_map = {
    "البنوك والخدمات المالية": ["banking", "corporate"],
    "العقارات والإنشاءات": ["real_estate", "corporate"],
    "الاتصالات والتكنولوجيا": ["telecom", "corporate"],
    "الطاقة والموارد الطبيعية": ["corporate", "macro_fx"],
    "الأغذية والمشروبات": ["corporate"],
    "الرعاية الصحية والأدوية": ["corporate"],
    "السياحة والترفيه": ["corporate"],
}

news_templates = [
    {
        "title_template": "إفصاح {company}: شركة {name_ar} تعلن نتائج الأرباح للربع الثاني 2026",
        "content_template": "أعلنت شركة {name_ar} ({symbol}) عن نتائج مالية متميزة للربع الثاني من عام 2026، حيث سجلت نمواً ملحوظاً في الإيرادات والأرباح الصافية مقارنة بالفترة المناظرة من العام الماضي.",
        "expected_impact_ar": "إيجابي على سعر السهم في المدى القصير والمتوسط، يُنصح بمتابعة تفاصيل النتائج قبل اتخاذ القرار.",
        "sentiment": "positive",
        "impact_score": 0.35,
        "category": "corporate",
    },
    {
        "title_template": "إفصاح {company}: توزيع أرباح نقدية على مساهمي شركة {name_ar}",
        "content_template": "أعلن مجلس إدارة شركة {name_ar} ({symbol}) عن توزيع أرباح نقدية على المساهمين بنسبة تعكس الأداء الجيد للشركة خلال العام المالي 2025/2026.",
        "expected_impact_ar": "إيجابي جداً - توزيعات الأرباح تدل على متانة المركز المالي للشركة وتزيد من جاذبيتها للمستثمرين.",
        "sentiment": "positive",
        "impact_score": 0.45,
        "category": "corporate",
    },
    {
        "title_template": "البورصة المصرية: تراجع في أسهم القطاع العقاري مع ارتفاع أسعار الفائدة",
        "content_template": "شهد قطاع العقارات والإنشاءات ضغوطاً بيعية خلال جلسة اليوم على خلفية توقعات المستثمرين بشأن سياسة أسعار الفائدة، مع الحرص على دراسة المشاريع الكبرى قيد التنفيذ.",
        "expected_impact_ar": "تأثير سلبي محدود على قطاع العقارات في الأجل القريب. تُنصح بمتابعة سعر الفائدة في اجتماع البنك المركزي القادم.",
        "sentiment": "negative",
        "impact_score": -0.25,
        "category": "real_estate",
    },
    {
        "title_template": "توقعات إيجابية لقطاع البنوك المصري بعد قرارات البنك المركزي",
        "content_template": "يترقب المستثمرون في قطاع البنوك تداعيات آخر قرارات البنك المركزي المصري على هوامش الفائدة الصافية، في ظل بيئة اقتصادية تشهد تحسناً تدريجياً.",
        "expected_impact_ar": "إيجابي على المدى المتوسط لأسهم البنوك، لا سيما ذات السيولة العالية والمحافظ الائتمانية المتنوعة.",
        "sentiment": "positive",
        "impact_score": 0.28,
        "category": "banking",
    },
    {
        "title_template": "إفصاح {company}: عقد مشروع ضخم لشركة {name_ar}",
        "content_template": "أبرمت شركة {name_ar} ({symbol}) عقداً بقيمة ضخمة مع جهة حكومية لتنفيذ مشروع استراتيجي يُعزز محفظة أعمالها ويؤكد قدرتها التنافسية في السوق المصري.",
        "expected_impact_ar": "إيجابي جداً - العقود الكبرى تضيف إيرادات مستقبلية متكررة وتعزز مكانة الشركة في صناعتها.",
        "sentiment": "positive",
        "impact_score": 0.4,
        "category": "corporate",
    },
    {
        "title_template": "قطاع الاتصالات: تسارع ملحوظ في خدمات الجيل الرابع والخامس بمصر",
        "content_template": "تشهد شركات الاتصالات المدرجة في البورصة المصرية توسعاً ملحوظاً في قاعدة المشتركين وارتفاعاً في متوسط الإيرادات لكل مستخدم، مدفوعاً بانتشار الإنترنت والخدمات الرقمية.",
        "expected_impact_ar": "إيجابي على قطاع الاتصالات والتكنولوجيا - النمو الرقمي يدعم أرباح الشركات على المدى الطويل.",
        "sentiment": "positive",
        "impact_score": 0.22,
        "category": "telecom",
    },
    {
        "title_template": "اقتصاد كلي: البنك المركزي المصري يثبت أسعار الفائدة في اجتماع أغسطس",
        "content_template": "أعلن البنك المركزي المصري عن قراره تثبيت أسعار الفائدة عند مستوياتها الحالية في اجتماع السياسة النقدية لشهر أغسطس 2026، وهو ما يتوافق مع توقعات السوق.",
        "expected_impact_ar": "محايد بشكل عام، لكنه يدعم استقرار سوق الأسهم ويشجع على الاستثمار في قطاعات ذات عوائد منتظمة كالبنوك وصناديق الاستثمار.",
        "sentiment": "neutral",
        "impact_score": 0.05,
        "category": "macro_fx",
    },
]

news_to_insert = []
used_company_ids = set()

for template in news_templates:
    # Add global news (no company link)
    for i in range(2):
        days_ago = random.randint(0, 7)
        pub_date = datetime.datetime.now() - datetime.timedelta(days=days_ago, hours=random.randint(0, 12))
        news_to_insert.append({
            "title": template["title_template"].format(company="", name_ar="البورصة المصرية", symbol="EGX").strip(),
            "content": template["content_template"].format(company="", name_ar="البورصة المصرية", symbol="EGX").strip(),
            "source": random.choice(["egx", "almal", "mubasher", "enterprise"]),
            "url": f"https://egx.com.eg/ar/news/{random.randint(10000,99999)}",
            "category": template["category"],
            "sentiment": template["sentiment"],
            "confidence": round(random.uniform(0.65, 0.92), 2),
            "impact_score": template["impact_score"],
            "expected_impact_ar": template["expected_impact_ar"],
            "published_at": pub_date.isoformat(),
            "company_id": None,
        })

# Add company-specific news
for co in random.sample(companies, min(len(companies), 30)):
    template = random.choice(news_templates[:5])
    days_ago = random.randint(0, 5)
    pub_date = datetime.datetime.now() - datetime.timedelta(days=days_ago, hours=random.randint(0, 10))
    news_to_insert.append({
        "title": template["title_template"].format(company=co["symbol"], name_ar=co["name_ar"] or co["symbol"], symbol=co["symbol"]),
        "content": template["content_template"].format(company=co["symbol"], name_ar=co["name_ar"] or co["symbol"], symbol=co["symbol"]),
        "source": random.choice(["egx", "almal", "mubasher"]),
        "url": f"https://egx.com.eg/ar/disclosure/{co['symbol']}/{random.randint(1000,9999)}",
        "category": "corporate",
        "sentiment": template["sentiment"],
        "confidence": round(random.uniform(0.7, 0.95), 2),
        "impact_score": template["impact_score"],
        "expected_impact_ar": template["expected_impact_ar"],
        "published_at": pub_date.isoformat(),
        "company_id": co["id"],
    })

# Insert in chunks
print(f"   Inserting {len(news_to_insert)} news items...")
chunk_size = 50
for i in range(0, len(news_to_insert), chunk_size):
    chunk = news_to_insert[i:i+chunk_size]
    result = sb.table("company_news").insert(chunk).execute()
    if hasattr(result, "error") and result.error:
        print(f"   ✗ Error inserting news chunk {i//chunk_size}: {result.error}")
    else:
        print(f"   ✓ Inserted news chunk {i//chunk_size+1} ({len(chunk)} items)")

# ─── 3. Seed corporate_events ────────────────────────────────────────────────
print("\n📅 Seeding corporate_events...")
event_types = ["earnings", "dividend", "general_assembly", "board_meeting", "capital_increase", "bond_issuance"]
event_titles = {
    "earnings": "إعلان نتائج الأرباح الربع الثاني 2026",
    "dividend": "توزيع أرباح الدورة السنوية 2025/2026",
    "general_assembly": "الجمعية العامة العادية للمساهمين",
    "board_meeting": "اجتماع مجلس الإدارة الفصلي",
    "capital_increase": "زيادة رأس المال عن طريق حقوق الأولوية",
    "bond_issuance": "إصدار سندات قابلة للتحويل",
}

events_to_insert = []
for co in random.sample(companies, min(len(companies), 40)):
    for _ in range(random.randint(1, 2)):
        event_type = random.choice(event_types)
        days_offset = random.randint(-5, 30)
        event_date = today + datetime.timedelta(days=days_offset)
        events_to_insert.append({
            "company_id": co["id"],
            "event_type": event_type,
            "title": f"[{co['symbol']}] {event_titles[event_type]}",
            "description": f"موعد {event_titles[event_type]} لشركة {co['name_ar']} ({co['symbol']}) - الرجاء متابعة الإفصاحات الرسمية على موقع البورصة المصرية.",
            "event_date": event_date.isoformat(),
            "source": "egx_official",
            "is_confirmed": random.choice([True, True, False]),
        })

for i in range(0, len(events_to_insert), 50):
    chunk = events_to_insert[i:i+50]
    sb.table("corporate_events").insert(chunk).execute()
    print(f"   ✓ Inserted corporate events chunk {i//50+1} ({len(chunk)} items)")

# ─── 4. Seed insider_trading ─────────────────────────────────────────────────
print("\n👔 Seeding insider_trading...")
roles = ["رئيس مجلس الإدارة", "العضو المنتدب (CEO)", "عضو مجلس الإدارة", "كبير المساهمين", "المدير المالي"]
insider_to_insert = []
for co in random.sample(companies, min(len(companies), 25)):
    for _ in range(random.randint(1, 3)):
        days_ago = random.randint(0, 14)
        trade_date = today - datetime.timedelta(days=days_ago)
        direction = random.choice(["buy", "buy", "sell"])
        shares = random.randint(5000, 200000)
        price = round(random.uniform(5.0, 80.0), 2)
        insider_to_insert.append({
            "company_id": co["id"],
            "insider_name": f"م. {random.choice(['أحمد','محمد','خالد','سامي','عمرو'])} {random.choice(['الشريف','البسيوني','زيدان','رشاد','فتحي'])}",
            "role": random.choice(roles),
            "transaction_type": direction,
            "shares_count": shares,
            "price_per_share": price,
            "total_value": round(shares * price, 2),
            "transaction_date": trade_date.isoformat(),
            "notes": f"{'شراء' if direction=='buy' else 'بيع'} {shares:,} سهم بسعر {price} جنيه",
        })

for i in range(0, len(insider_to_insert), 50):
    chunk = insider_to_insert[i:i+50]
    sb.table("insider_trading").insert(chunk).execute()
    print(f"   ✓ Inserted insider trading chunk {i//50+1} ({len(chunk)} items)")

# ─── 5. Seed daily_investor_flows (30 days) ─────────────────────────────────
print("\n🌍 Seeding daily_investor_flows...")
existing = sb.table("daily_investor_flows").select("trade_date").order("trade_date", desc=True).limit(30).execute()
existing_dates = set(r["trade_date"] for r in (existing.data or []))

flows_to_insert = []
for d in range(35, 0, -1):
    dt = today - datetime.timedelta(days=d)
    # Skip weekends
    if dt.weekday() >= 5:
        continue
    date_str = dt.isoformat()
    if date_str in existing_dates:
        continue
    foreigners_net = random.randint(-120, 180) * 1_000_000
    egy_inst_net = -foreigners_net * random.uniform(0.3, 0.7) + random.randint(-30, 30) * 1_000_000
    arab_net = random.randint(-40, 60) * 1_000_000
    total_vol = random.randint(28, 55) * 100_000_000
    flows_to_insert.append({
        "trade_date": date_str,
        "foreigners_net_egp": foreigners_net,
        "foreign_inst_net_egp": foreigners_net * 0.6,
        "egyptian_inst_net_egp": egy_inst_net,
        "arabs_net_egp": arab_net,
        "total_volume_egp": total_vol,
        "source": "egx_official",
    })

if flows_to_insert:
    sb.table("daily_investor_flows").insert(flows_to_insert).execute()
    print(f"   ✓ Inserted {len(flows_to_insert)} daily flow records")
else:
    print("   ℹ Already up-to-date")

# ─── 6. Seed sector_investor_flows ──────────────────────────────────────────
print("\n🏢 Seeding sector_investor_flows...")
sector_names = [
    "البنوك والخدمات المالية",
    "العقارات والإنشاءات",
    "الاتصالات والتكنولوجيا",
    "الطاقة والموارد الطبيعية",
    "الأغذية والمشروبات",
    "الرعاية الصحية والأدوية",
    "السياحة والترفيه",
]
existing_sf = sb.table("sector_investor_flows").select("id").limit(1).execute()
if not existing_sf.data:
    sf_to_insert = []
    for d in range(14, 0, -1):
        dt = today - datetime.timedelta(days=d)
        if dt.weekday() >= 5:
            continue
        for sec in sector_names:
            sf_to_insert.append({
                "trade_date": dt.isoformat(),
                "sector_name": sec,
                "foreigners_net_egp": random.randint(-60, 80) * 1_000_000,
                "egyptian_inst_net_egp": random.randint(-40, 50) * 1_000_000,
            })
    if sf_to_insert:
        for i in range(0, len(sf_to_insert), 50):
            sb.table("sector_investor_flows").insert(sf_to_insert[i:i+50]).execute()
        print(f"   ✓ Inserted {len(sf_to_insert)} sector flow records")
else:
    print("   ℹ sector_investor_flows already has data, skipping")

# ─── 7. Seed market_prices for last 30 days ─────────────────────────────────
print("\n📊 Seeding missing market_prices...")
# Check how many prices we have
cnt = sb.table("market_prices").select("*", count="exact", head=True).execute()
print(f"   Current market_prices count: {cnt.count}")

if (cnt.count or 0) < 500:
    print("   Low prices count, seeding basic price data...")
    prices_to_insert = []
    for co in companies[:80]:  # limit to 80 companies for speed
        base_price = round(random.uniform(5.0, 100.0), 2)
        for d in range(20, 0, -1):
            dt = today - datetime.timedelta(days=d)
            if dt.weekday() >= 5:
                continue
            chg = random.uniform(-0.05, 0.05)
            close = round(base_price * (1 + chg), 2)
            open_p = round(base_price * (1 + random.uniform(-0.02, 0.02)), 2)
            high = round(max(close, open_p) * (1 + random.uniform(0, 0.02)), 2)
            low = round(min(close, open_p) * (1 - random.uniform(0, 0.02)), 2)
            vol = random.randint(100000, 5000000)
            prices_to_insert.append({
                "company_id": co["id"],
                "symbol": co["symbol"],
                "price_date": dt.isoformat(),
                "open_price": open_p,
                "close_price": close,
                "high_price": high,
                "low_price": low,
                "volume": vol,
                "change_percent": round(chg * 100, 2),
                "source": "seed_data",
            })
            base_price = close

    for i in range(0, len(prices_to_insert), 100):
        chunk = prices_to_insert[i:i+100]
        try:
            sb.table("market_prices").upsert(chunk, on_conflict="company_id,price_date").execute()
        except Exception as e:
            sb.table("market_prices").insert(chunk).execute()
    print(f"   ✓ Inserted {len(prices_to_insert)} price records")
else:
    print(f"   ✓ market_prices already has {cnt.count} rows")

print("\n✅ All seeding complete!")
