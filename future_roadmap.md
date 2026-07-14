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
    *   **Yahoo Finance:** يعطي أسعاراً معدلة تاريخياً بناء على التوزيعات والانقسامات (split-adjusted) وغير صالح لمقارنة الأسعار اللحظية مع شاشة البورصة، ولكن قد يفيد مستقبلاً لبيانات تاريخ التوزيعات (dividend history).
    *   **موقع EGX الرسمي (prices.aspx):** تم اختبار موقع EGX الرسمي لسحب الأسعار اللحظية آلياً - محظور بالكامل بجدار حماية F5 حتى مع Playwright ووضع التخفي المتقدم (صفحة فارغة تماماً، 0 جداول). لا داعي لإعادة المحاولة إلا لو تغيرت سياسة الموقع مستقبلاً. نعتمد بدلاً منه على TradingView + Investing.com + Mubasher للأسعار اللحظية.

### 2. Deferred Engineering Libraries
*   **Libraries:** `playwright` (for intraday/scraping layers), `selenium` (legacy bot bypass), `SQLAlchemy` (ORM transitions), `pydantic` (strict payload validation).
*   **Context:** Deferred to keep the initial ingestion service lightweight and performant.

### 3. Third-party API Integrity Verification Note
*   **Rule:** Any new, unverified, or third-party APIs (e.g., egxapi.com or personal endpoints) MUST go through strict credibility, rate-limiting, and security scans before integration. No unverified API keys or secrets should be added to the codebase.
