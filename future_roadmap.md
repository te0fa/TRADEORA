# Tradeora Future Roadmap

This document outlines the planned future enhancements and architectural upgrades for the Tradeora EOD Price Ingestion pipeline. These items are deferred to keep the initial foundation simple and focused.

---

## 📅 Deferred Core Architecture Upgrades

### 1. Redis & Queue Systems (BullMQ / Celery)
*   **Purpose:** To manage bulk parsing jobs, background scraper tasks, and database insertion queues asynchronously.
*   **Context:** Currently running in a synchronous process sequence. BullMQ/Celery will be introduced when scaling to scrape multiple international exchanges simultaneously.

### 2. Multi-user Authentication & JWT (Auth/JWT)
*   **Purpose:** To support multiple user watchlists, personalized portfolios, and API scopes.
*   **Context:** Currently initialized with a single default watchlist and no access restrictions.

### 3. Key Management Services (KMS / Vault)
*   **Purpose:** To securely encrypt, store, and rotate API secrets, Supabase connection tokens, and third-party portal credentials.
*   **Context:** Currently loaded from local environment `.env` files and GitHub repository secrets.

### 4. International Stock Markets Expansion
*   **Purpose:** Scraping, importing, and tracking price data for exchanges outside of the Egyptian Exchange (EGX) (e.g., Tadawul, US Exchanges).
*   **Context:** Although the schema has been upgraded to support market context (market, country, currency, exchange), the actual ingestion pipeline is strictly restricted to EGX.

### 5. Full-text Search Engine (Elasticsearch / Meilisearch)
*   **Purpose:** Fast fuzzy matching of company names (Arabic and English) across thousands of stock records.
*   **Context:** Currently matched using standard SQL queries and static normalized maps.

### 6. True Production Server Cron Jobs
*   **Purpose:** Moving EOD scheduled runs to a dedicated server cron or managed cloud scheduler.
*   **Context:** Currently run locally or via GitHub Actions scheduled workflow.

### 7. Advanced Repository & Engine Patterns
*   **Purpose:** Abstracting database tables behind a strict repository layer and implementing polymorphic Scraping Engines.
*   **Context:** Kept as a simple direct API model until multi-source and multi-repository configurations are officially introduced.

---

## 📚 Additional Data Sources & Libraries

### 1. Deferred Data Providers (Intraday & Alternate)
*   **Providers:** EODHD, Twelve Data, Alpha Vantage, Finnhub, Polygon, Financial Modeling Prep.
*   **EGX Limitations & Findings:**
    *   **Google Finance & MSN/Bing Finance:** لا يغطيان البورصة المصرية (EGX) إطلاقاً على الإطلاق - لا داعي لإعادة تجربتهما للسوق المحلي.
    *   **Yahoo Finance:** تم التغلب على مشكلة الأسعار المعدلة تاريخياً بتمرير المعامل `auto_adjust=False` مما يتيح سحب أسعار الإغلاق الفعلية (Raw Close Prices). ومع ذلك، يجب الانتباه لـ **محدوديات فنية هامة جداً**:
        *   **الرموز المعتمدة على الـ ISIN:** تم تصنيف وترميز 19 سهماً في السوق تدرج على ياهو برمز الـ ISIN وليس بالرمز الافتراضي (وهي: `ORAS`, `DCRC`, `NCGC`, `GTHE`, `ACRO`, `AMES`, `CAED`, `ELNA`, `NIPH`, `RREI` من أسهم الشريعة، بالإضافة إلى `AJWA`, `BONY`, `DOMT`, `FERC`, `GTEX`, `RAKT`, `TANM`, `TAQA`, `UTOP` من باقي أسهم السوق).
        *   **انعدام البيانات اللحظية:** هذه الأسهم الـ 19 لا تمتلك أي بيانات لحظية (Intraday Data) أثناء التداول على ياهو على الإطلاق.
        *   **تأخر شمعة الإغلاق (EOD Delay):** أسعار الإغلاق اليومية (EOD) لهذه الأسهم الـ 19 قد تتأخر في التحديث على خوادم ياهو بمقدار يوم أو أكثر مقارنة بالتاريخ الفعلي للجلسة.
        *   **شرط التحقق من تاريخ الشمعة:** أي استخدام مستقبلي لياهو فايننس كمرجع للمقارنة اليومية (EOD Reference) أو المراجعة الأسبوعية للأسهم الـ 19 **يجب أن يقوم بالتحقق من تاريخ آخر شمعة مسترجعة (Date Verification)** ومطابقتها بالتاريخ المستهدف، وعدم افتراض أنها تمثل تاريخ اليوم تلقائياً لتفادي مقارنة أسعار تواريخ مختلفة.
        *   **محدودية عمق التاريخ:** ياهو فايننس لا يحتفظ بتاريخ عميق (محدود بـ 1 إلى 5 أيام تداول فقط) للرموز القائمة على الـ ISIN، وبالتالي فإن المؤشرات الفنية (مثل RSI أو Moving Averages) لن تعمل لها فوراً إلا بعد تراكم التاريخ يومياً بمرور الوقت عبر تشغيل الـ Pipeline.
    *   **موقع EGX الرسمي (prices.aspx):** تم اختبار موقع EGX الرسمي لسحب الأسعار اللحظية آلياً - محظور بالكامل بجدار حماية F5 حتى مع Playwright ووضع التخفي المتقدم (صفحة فارغة تماماً، 0 جداول). لا داعي لإعادة المحاولة إلا لو تغيرت سياسة الموقع مستقبلاً. نعتمد بدلاً منه على TradingView + Investing.com + Mubasher للأسعار اللحظية.

### 2. Deferred Engineering Libraries
*   **Libraries:** `playwright` (for intraday/scraping layers), `selenium` (legacy bot bypass), `SQLAlchemy` (ORM transitions), `pydantic` (strict payload validation).
*   **Context:** Deferred to keep the initial ingestion service lightweight and performant.

### 3. Third-party API Integrity Verification Note
*   **Rule:** Any new, unverified, or third-party APIs (e.g., egxapi.com or personal endpoints) MUST go through strict credibility, rate-limiting, and security scans before integration. No unverified API keys or secrets should be added to the codebase.

---

## 🏷️ Price Source Semantics

يحتوي عمود `source` في جدول `market_prices` على ثلاث قيم لكل منها دلالة محددة وحالة استخدام مختلفة:

### `egx_bulletin` — سعر الإغلاق الرسمي المعتمد
*   **المصدر:** نشرة البورصة المصرية اليومية الرسمية (PDF).
*   **التوقيت:** يُستورد يدوياً أو عبر آلية رفع الملفات بعد إصدار النشرة الرسمية.
*   **الدلالة:** سعر الإغلاق الرسمي المعتمد والنهائي للجلسة، مُصادَق عليه من البورصة.
*   **الاستخدام:** **المرجع الأساسي الإلزامي** لأي تحليل تاريخي، حسابات مالية دقيقة، مؤشرات فنية، أو نسب تقييم.

### `tradingview` — تقدير سريع لسعر الإغلاق (EOD Estimate)
*   **المصدر:** TradingView Scanner API، يُشغَّل تلقائياً عبر `daily_update.yml` عند **6:00 مساءً بتوقيت القاهرة** (بعد إغلاق السوق).
*   **التوقيت:** متاح مباشرة بعد إغلاق الجلسة — قبل صدور النشرة الرسمية بساعات.
*   **الدلالة:** تقدير أولي لسعر الإغلاق النهائي، دقيق في الغالب لكن غير رسمي.
*   **الاستخدام:** مرجع مبدئي سريع لأسعار إغلاق اليوم قبل توفر `egx_bulletin`. لا يُستخدم للحسابات الرسمية الدقيقة.

### `intraday_consensus` — حركة السعر أثناء الجلسة
*   **المصدر:** إجماع مرجَّح من 3 مصادر (TradingView + Investing.com + Mubasher) عبر خوارزمية تصفية القيم الشاذة (1.5% threshold).
*   **التوقيت:** يُحدَّث كل 15 دقيقة أثناء الجلسة من **10:00 صباحاً → 2:30 ظهراً بتوقيت القاهرة** (الأحد إلى الخميس).
*   **الدلالة:** السعر اللحظي أثناء التداول فقط. **آخر قيمة مُسجَّلة عند 2:30 ظهراً لا تمثل سعر الإغلاق النهائي ولا يجب استخدامها كذلك.**
*   **الاستخدام:** متابعة حركة السعر خلال الجلسة، تتبع التقلبات اللحظية، أو تنبيهات السعر أثناء التداول.

### ⚠️ قاعدة ذهبية للمرحلة القادمة (تحليل تقني / مؤشرات):
> أي مؤشر فني أو حساب مالي مستقبلي يعتمد على "سعر الإغلاق" **يجب أن يستخدم `egx_bulletin` كمصدر افتراضي أول**، وليس آخر قيمة من `intraday_consensus`. الترتيب الصحيح للأولوية:
> 1. `egx_bulletin` (الأكثر دقة ورسمية) ✅
> 2. `tradingview` (تقدير مبدئي سريع، نفس اليوم) ⚡
> 3. `intraday_consensus` (للمتابعة اللحظية فقط، ليس للإغلاق) ⏱️
