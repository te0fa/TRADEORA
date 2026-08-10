# TRADEORA EGX — REPOSITORY BASELINE SNAPSHOT (00.1A)

> **Snapshot Date / Timestamp:** 2026-08-10T23:06:19+03:00
> **Git Commit Hash:** `5b3d28bfd45f52e3a5be3de84be73288c956b07d`
> **Git Branch:** `main`
> **Working Tree Status:** Clean with Untracked Documentation Files
> **Total Files Tracked / Discovered:** `753` files (excluding `.git`, `node_modules`, `.next`, `__pycache__`, `.pytest_cache`)

## 1. Git Status & Working Tree Details
```text
On branch main
Your branch is up to date with 'origin/main'.

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	03_EGX_TARGET_ARCHITECTURE.md
	docs/01_EGX_COMPREHENSIVE_AUDIT.md
	docs/02_EGX_CURRENT_ARCHITECTURE.md
	docs/02_EGX_SUPPLEMENTARY_AUDIT.md
	docs/03_EGX_TARGET_ARCHITECTURE.md
	docs/04_EGX_GAP_ANALYSIS_AND_REBUILD_PLAN.md

nothing added to commit but untracked files present (use "git add" to track)
```

### 1.1 Summary of Untracked / Modified Files
```text
?? 03_EGX_TARGET_ARCHITECTURE.md
?? docs/01_EGX_COMPREHENSIVE_AUDIT.md
?? docs/02_EGX_CURRENT_ARCHITECTURE.md
?? docs/02_EGX_SUPPLEMENTARY_AUDIT.md
?? docs/03_EGX_TARGET_ARCHITECTURE.md
?? docs/04_EGX_GAP_ANALYSIS_AND_REBUILD_PLAN.md
```

## 2. File Inventory by Functional Category

| Category | File Count | Total Size (KB) |
| :--- | :---: | :---: |
| API Routes (Next.js / Backend) | 53 | 273.15 KB |
| Backend Python Services | 24 | 166.96 KB |
| Cron, Automation & Schedulers | 6 | 5.48 KB |
| Data Scrapers & External Feed Collectors | 21 | 1721.60 KB |
| Data Scripts, Seeders & Maintenance Utilities | 36 | 209.34 KB |
| Database & Migration Schemas | 46 | 76.85 KB |
| Documentation & Architecture Specs | 128 | 8088.27 KB |
| Frontend & Build Configuration | 3 | 2.13 KB |
| Frontend (tradeora-web) | 13 | 544.55 KB |
| Frontend App & Pages (Next.js) | 31 | 382.15 KB |
| Frontend Components (Next.js) | 40 | 583.17 KB |
| Frontend Libs / Hooks / Types / Utils | 32 | 148.83 KB |
| Frontend Other Assets & Files | 35 | 2518.63 KB |
| GitHub Actions / CI/CD | 16 | 35.85 KB |
| ML Models & Artifacts | 36 | 14844.76 KB |
| ML Training, Backtesting & Prediction Pipeline | 14 | 250.05 KB |
| Project Config & Environment | 3 | 3.09 KB |
| Root Level / Other Scripts & Utilities | 196 | 31568.74 KB |
| Tests & Verification Suites | 20 | 56.00 KB |

---

### 📂 API Routes (Next.js / Backend) (53 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `tradeora-web/app/api/alerts/route.ts` | 2,589 | `E:\zaora\TRADEORA\tradeora-web\app\api\alerts\route.ts` |
| `tradeora-web/app/api/canonical-price/route.ts` | 4,621 | `E:\zaora\TRADEORA\tradeora-web\app\api\canonical-price\route.ts` |
| `tradeora-web/app/api/corporate-events/route.ts` | 4,446 | `E:\zaora\TRADEORA\tradeora-web\app\api\corporate-events\route.ts` |
| `tradeora-web/app/api/cron/intraday-analysis/route.ts` | 12,660 | `E:\zaora\TRADEORA\tradeora-web\app\api\cron\intraday-analysis\route.ts` |
| `tradeora-web/app/api/cron/prune-snapshots/route.ts` | 1,347 | `E:\zaora\TRADEORA\tradeora-web\app\api\cron\prune-snapshots\route.ts` |
| `tradeora-web/app/api/cron/signal-monitor/route.ts` | 10,615 | `E:\zaora\TRADEORA\tradeora-web\app\api\cron\signal-monitor\route.ts` |
| `tradeora-web/app/api/cron/sync-fundamentals/route.ts` | 3,393 | `E:\zaora\TRADEORA\tradeora-web\app\api\cron\sync-fundamentals\route.ts` |
| `tradeora-web/app/api/cron/sync-intraday/route.ts` | 6,807 | `E:\zaora\TRADEORA\tradeora-web\app\api\cron\sync-intraday\route.ts` |
| `tradeora-web/app/api/cron/sync-investor-flows/route.ts` | 2,371 | `E:\zaora\TRADEORA\tradeora-web\app\api\cron\sync-investor-flows\route.ts` |
| `tradeora-web/app/api/cron/sync-prices/route.ts` | 5,141 | `E:\zaora\TRADEORA\tradeora-web\app\api\cron\sync-prices\route.ts` |
| `tradeora-web/app/api/cron/sync-shariah/route.ts` | 2,509 | `E:\zaora\TRADEORA\tradeora-web\app\api\cron\sync-shariah\route.ts` |
| `tradeora-web/app/api/cron/track-recommended-trades/route.ts` | 26,461 | `E:\zaora\TRADEORA\tradeora-web\app\api\cron\track-recommended-trades\route.ts` |
| `tradeora-web/app/api/cron/track-trades/route.ts` | 13,078 | `E:\zaora\TRADEORA\tradeora-web\app\api\cron\track-trades\route.ts` |
| `tradeora-web/app/api/daily-report/route.ts` | 5,555 | `E:\zaora\TRADEORA\tradeora-web\app\api\daily-report\route.ts` |
| `tradeora-web/app/api/domain-engine/route.ts` | 3,409 | `E:\zaora\TRADEORA\tradeora-web\app\api\domain-engine\route.ts` |
| `tradeora-web/app/api/egx100/route.ts` | 3,086 | `E:\zaora\TRADEORA\tradeora-web\app\api\egx100\route.ts` |
| `tradeora-web/app/api/egx30/route.ts` | 3,062 | `E:\zaora\TRADEORA\tradeora-web\app\api\egx30\route.ts` |
| `tradeora-web/app/api/egx33/route.ts` | 3,146 | `E:\zaora\TRADEORA\tradeora-web\app\api\egx33\route.ts` |
| `tradeora-web/app/api/egx70/route.ts` | 3,070 | `E:\zaora\TRADEORA\tradeora-web\app\api\egx70\route.ts` |
| `tradeora-web/app/api/email/trade-alert/route.ts` | 1,102 | `E:\zaora\TRADEORA\tradeora-web\app\api\email\trade-alert\route.ts` |
| `tradeora-web/app/api/insider-trading/route.ts` | 1,244 | `E:\zaora\TRADEORA\tradeora-web\app\api\insider-trading\route.ts` |
| `tradeora-web/app/api/intraday/route.ts` | 10,458 | `E:\zaora\TRADEORA\tradeora-web\app\api\intraday\route.ts` |
| `tradeora-web/app/api/investor-flows/route.ts` | 11,883 | `E:\zaora\TRADEORA\tradeora-web\app\api\investor-flows\route.ts` |
| `tradeora-web/app/api/long-term-investments/route.ts` | 6,663 | `E:\zaora\TRADEORA\tradeora-web\app\api\long-term-investments\route.ts` |
| `tradeora-web/app/api/market-breadth/route.ts` | 1,015 | `E:\zaora\TRADEORA\tradeora-web\app\api\market-breadth\route.ts` |
| `tradeora-web/app/api/market-indices/route.ts` | 3,993 | `E:\zaora\TRADEORA\tradeora-web\app\api\market-indices\route.ts` |
| `tradeora-web/app/api/market-investor-stats/route.ts` | 2,340 | `E:\zaora\TRADEORA\tradeora-web\app\api\market-investor-stats\route.ts` |
| `tradeora-web/app/api/market-movers/route.ts` | 10,178 | `E:\zaora\TRADEORA\tradeora-web\app\api\market-movers\route.ts` |
| `tradeora-web/app/api/market-summary/route.ts` | 1,274 | `E:\zaora\TRADEORA\tradeora-web\app\api\market-summary\route.ts` |
| `tradeora-web/app/api/ml-predict/route.ts` | 1,971 | `E:\zaora\TRADEORA\tradeora-web\app\api\ml-predict\route.ts` |
| `tradeora-web/app/api/news-sentiment/route.ts` | 3,927 | `E:\zaora\TRADEORA\tradeora-web\app\api\news-sentiment\route.ts` |
| `tradeora-web/app/api/news/route.ts` | 6,395 | `E:\zaora\TRADEORA\tradeora-web\app\api\news\route.ts` |
| `tradeora-web/app/api/orderbook/route.ts` | 4,290 | `E:\zaora\TRADEORA\tradeora-web\app\api\orderbook\route.ts` |
| `tradeora-web/app/api/push/send/route.ts` | 1,979 | `E:\zaora\TRADEORA\tradeora-web\app\api\push\send\route.ts` |
| `tradeora-web/app/api/referral/use/route.ts` | 1,864 | `E:\zaora\TRADEORA\tradeora-web\app\api\referral\use\route.ts` |
| `tradeora-web/app/api/screener/route.ts` | 4,015 | `E:\zaora\TRADEORA\tradeora-web\app\api\screener\route.ts` |
| `tradeora-web/app/api/seasonality/route.ts` | 1,435 | `E:\zaora\TRADEORA\tradeora-web\app\api\seasonality\route.ts` |
| `tradeora-web/app/api/sector-volume/route.ts` | 4,293 | `E:\zaora\TRADEORA\tradeora-web\app\api\sector-volume\route.ts` |
| `tradeora-web/app/api/sectors/route.ts` | 2,918 | `E:\zaora\TRADEORA\tradeora-web\app\api\sectors\route.ts` |
| `tradeora-web/app/api/settings/route.ts` | 2,272 | `E:\zaora\TRADEORA\tradeora-web\app\api\settings\route.ts` |
| `tradeora-web/app/api/stock-live/route.ts` | 2,446 | `E:\zaora\TRADEORA\tradeora-web\app\api\stock-live\route.ts` |
| `tradeora-web/app/api/stream-prices/route.ts` | 1,846 | `E:\zaora\TRADEORA\tradeora-web\app\api\stream-prices\route.ts` |
| `tradeora-web/app/api/stripe/checkout/route.ts` | 1,192 | `E:\zaora\TRADEORA\tradeora-web\app\api\stripe\checkout\route.ts` |
| `tradeora-web/app/api/stripe/webhook/route.ts` | 3,036 | `E:\zaora\TRADEORA\tradeora-web\app\api\stripe\webhook\route.ts` |
| `tradeora-web/app/api/telegram/notify/route.ts` | 1,161 | `E:\zaora\TRADEORA\tradeora-web\app\api\telegram\notify\route.ts` |
| `tradeora-web/app/api/telegram/webhook/route.ts` | 2,379 | `E:\zaora\TRADEORA\tradeora-web\app\api\telegram\webhook\route.ts` |
| `tradeora-web/app/api/trades/[id]/route.ts` | 1,944 | `E:\zaora\TRADEORA\tradeora-web\app\api\trades\[id]\route.ts` |
| `tradeora-web/app/api/trades/route.ts` | 47,931 | `E:\zaora\TRADEORA\tradeora-web\app\api\trades\route.ts` |
| `tradeora-web/app/api/update-live-tick/route.ts` | 1,114 | `E:\zaora\TRADEORA\tradeora-web\app\api\update-live-tick\route.ts` |
| `tradeora-web/app/api/user-trades/[id]/route.ts` | 1,808 | `E:\zaora\TRADEORA\tradeora-web\app\api\user-trades\[id]\route.ts` |
| `tradeora-web/app/api/user-trades/route.ts` | 5,429 | `E:\zaora\TRADEORA\tradeora-web\app\api\user-trades\route.ts` |
| `tradeora-web/app/api/volume-profile/route.ts` | 3,867 | `E:\zaora\TRADEORA\tradeora-web\app\api\volume-profile\route.ts` |
| `tradeora-web/app/api/yahoo-chart/route.ts` | 2,682 | `E:\zaora\TRADEORA\tradeora-web\app\api\yahoo-chart\route.ts` |

### 📂 Backend Python Services (24 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `services/canonical.py` | 8,283 | `E:\zaora\TRADEORA\services\canonical.py` |
| `services/daily_report_service.py` | 2,545 | `E:\zaora\TRADEORA\services\daily_report_service.py` |
| `services/elliott_time_engine.py` | 3,926 | `E:\zaora\TRADEORA\services\elliott_time_engine.py` |
| `services/exit_engine.py` | 15,983 | `E:\zaora\TRADEORA\services\exit_engine.py` |
| `services/fundamental_engine.py` | 6,148 | `E:\zaora\TRADEORA\services\fundamental_engine.py` |
| `services/fundamentals_importer.py` | 10,341 | `E:\zaora\TRADEORA\services\fundamentals_importer.py` |
| `services/ict_smc_engine.py` | 6,019 | `E:\zaora\TRADEORA\services\ict_smc_engine.py` |
| `services/importer.py` | 11,091 | `E:\zaora\TRADEORA\services\importer.py` |
| `services/index_live_fetcher.py` | 4,965 | `E:\zaora\TRADEORA\services\index_live_fetcher.py` |
| `services/intraday_importer.py` | 10,256 | `E:\zaora\TRADEORA\services\intraday_importer.py` |
| `services/long_term_investor_service.py` | 9,553 | `E:\zaora\TRADEORA\services\long_term_investor_service.py` |
| `services/macro_news_engine.py` | 7,928 | `E:\zaora\TRADEORA\services\macro_news_engine.py` |
| `services/market_breadth_engine.py` | 3,517 | `E:\zaora\TRADEORA\services\market_breadth_engine.py` |
| `services/news_intelligence_service.py` | 8,983 | `E:\zaora\TRADEORA\services\news_intelligence_service.py` |
| `services/orderbook_service.py` | 3,676 | `E:\zaora\TRADEORA\services\orderbook_service.py` |
| `services/patterns_engine.py` | 7,746 | `E:\zaora\TRADEORA\services\patterns_engine.py` |
| `services/seasonality_engine.py` | 4,536 | `E:\zaora\TRADEORA\services\seasonality_engine.py` |
| `services/sentiment_analyzer.py` | 4,034 | `E:\zaora\TRADEORA\services\sentiment_analyzer.py` |
| `services/shariah_live_fetcher.py` | 5,802 | `E:\zaora\TRADEORA\services\shariah_live_fetcher.py` |
| `services/smart_money_engine.py` | 4,893 | `E:\zaora\TRADEORA\services\smart_money_engine.py` |
| `services/sync_fundamentals.py` | 4,645 | `E:\zaora\TRADEORA\services\sync_fundamentals.py` |
| `services/trade_interpreter.py` | 6,987 | `E:\zaora\TRADEORA\services\trade_interpreter.py` |
| `services/volume_profile_engine.py` | 8,839 | `E:\zaora\TRADEORA\services\volume_profile_engine.py` |
| `services/wyckoff_engine.py` | 10,268 | `E:\zaora\TRADEORA\services\wyckoff_engine.py` |

### 📂 Cron, Automation & Schedulers (6 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `logs/scheduler.log` | 240 | `E:\zaora\TRADEORA\logs\scheduler.log` |
| `run_daily.bat` | 588 | `E:\zaora\TRADEORA\run_daily.bat` |
| `run_silent.vbs` | 105 | `E:\zaora\TRADEORA\run_silent.vbs` |
| `session_scheduler.py` | 2,281 | `E:\zaora\TRADEORA\session_scheduler.py` |
| `setup_intraday_scheduler.ps1` | 1,684 | `E:\zaora\TRADEORA\setup_intraday_scheduler.ps1` |
| `setup_scheduler.ps1` | 718 | `E:\zaora\TRADEORA\setup_scheduler.ps1` |

### 📂 Data Scrapers & External Feed Collectors (21 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `egx_debug.py` | 1,979 | `E:\zaora\TRADEORA\egx_debug.py` |
| `egx_debug_screenshot.png` | 4,714 | `E:\zaora\TRADEORA\egx_debug_screenshot.png` |
| `egx_flow_scraper.py` | 17,359 | `E:\zaora\TRADEORA\egx_flow_scraper.py` |
| `egx_html_inspect.py` | 1,083 | `E:\zaora\TRADEORA\egx_html_inspect.py` |
| `egx_intraday_flows.py` | 27,365 | `E:\zaora\TRADEORA\egx_intraday_flows.py` |
| `egx_pdf_watcher.py` | 13,009 | `E:\zaora\TRADEORA\egx_pdf_watcher.py` |
| `logs/egx_flow_scraper.log` | 3,475 | `E:\zaora\TRADEORA\logs\egx_flow_scraper.log` |
| `logs/egx_scraper.log` | 1,599,793 | `E:\zaora\TRADEORA\logs\egx_scraper.log` |
| `scrapers/almal_news_scraper.py` | 4,561 | `E:\zaora\TRADEORA\scrapers\almal_news_scraper.py` |
| `scrapers/egx_disclosures_insider_scraper.py` | 8,328 | `E:\zaora\TRADEORA\scrapers\egx_disclosures_insider_scraper.py` |
| `scrapers/egx_scraper.py` | 20,846 | `E:\zaora\TRADEORA\scrapers\egx_scraper.py` |
| `scrapers/fundamentals_scraper.py` | 4,365 | `E:\zaora\TRADEORA\scrapers\fundamentals_scraper.py` |
| `scrapers/investing_provider.py` | 13,822 | `E:\zaora\TRADEORA\scrapers\investing_provider.py` |
| `scrapers/mubasher_provider.py` | 4,804 | `E:\zaora\TRADEORA\scrapers\mubasher_provider.py` |
| `scrapers/news_scraper.py` | 8,883 | `E:\zaora\TRADEORA\scrapers\news_scraper.py` |
| `scrapers/pdf_downloader.py` | 10,585 | `E:\zaora\TRADEORA\scrapers\pdf_downloader.py` |
| `scrapers/tradingview_provider.py` | 3,222 | `E:\zaora\TRADEORA\scrapers\tradingview_provider.py` |
| `scrapers/tradingview_scraper.py` | 5,904 | `E:\zaora\TRADEORA\scrapers\tradingview_scraper.py` |
| `scrapers/utils.py` | 3,206 | `E:\zaora\TRADEORA\scrapers\utils.py` |
| `scrapers/yahoo_intraday_provider.py` | 2,771 | `E:\zaora\TRADEORA\scrapers\yahoo_intraday_provider.py` |
| `scrapers/yahoo_provider.py` | 2,843 | `E:\zaora\TRADEORA\scrapers\yahoo_provider.py` |

### 📂 Data Scripts, Seeders & Maintenance Utilities (36 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `backfill_all_tv_15m.py` | 3,304 | `E:\zaora\TRADEORA\backfill_all_tv_15m.py` |
| `backfill_historical.py` | 8,857 | `E:\zaora\TRADEORA\backfill_historical.py` |
| `backfill_investor_flows.py` | 6,163 | `E:\zaora\TRADEORA\backfill_investor_flows.py` |
| `check_data_and_seed.py` | 652 | `E:\zaora\TRADEORA\check_data_and_seed.py` |
| `check_flow_tables.py` | 1,031 | `E:\zaora\TRADEORA\check_flow_tables.py` |
| `check_market_sources.py` | 462 | `E:\zaora\TRADEORA\check_market_sources.py` |
| `check_model_trades.py` | 1,516 | `E:\zaora\TRADEORA\check_model_trades.py` |
| `clean_old_trades.py` | 1,004 | `E:\zaora\TRADEORA\clean_old_trades.py` |
| `inspect_closed.py` | 1,319 | `E:\zaora\TRADEORA\inspect_closed.py` |
| `inspect_flow_columns.py` | 423 | `E:\zaora\TRADEORA\inspect_flow_columns.py` |
| `inspect_table_columns.py` | 639 | `E:\zaora\TRADEORA\inspect_table_columns.py` |
| `inspect_v6_details.py` | 1,142 | `E:\zaora\TRADEORA\inspect_v6_details.py` |
| `inspect_v6_trades.py` | 1,141 | `E:\zaora\TRADEORA\inspect_v6_trades.py` |
| `scripts/backfill_historical.py` | 7,651 | `E:\zaora\TRADEORA\scripts\backfill_historical.py` |
| `scripts/canonical_validation.py` | 1,816 | `E:\zaora\TRADEORA\scripts\canonical_validation.py` |
| `scripts/close_stale_signals.py` | 6,889 | `E:\zaora\TRADEORA\scripts\close_stale_signals.py` |
| `scripts/export_historical_intraday.py` | 2,925 | `E:\zaora\TRADEORA\scripts\export_historical_intraday.py` |
| `scripts/golden_candle_audit.py` | 32,031 | `E:\zaora\TRADEORA\scripts\golden_candle_audit.py` |
| `scripts/run_enlarged_comparison.py` | 3,618 | `E:\zaora\TRADEORA\scripts\run_enlarged_comparison.py` |
| `scripts/signal_vs_chart_audit.py` | 13,780 | `E:\zaora\TRADEORA\scripts\signal_vs_chart_audit.py` |
| `scripts/simulate_sl_multi_scenario.py` | 11,090 | `E:\zaora\TRADEORA\scripts\simulate_sl_multi_scenario.py` |
| `scripts/simulate_sl_strategies.py` | 10,452 | `E:\zaora\TRADEORA\scripts\simulate_sl_strategies.py` |
| `scripts/split_detector.py` | 7,133 | `E:\zaora\TRADEORA\scripts\split_detector.py` |
| `scripts/validate_data.py` | 2,053 | `E:\zaora\TRADEORA\scripts\validate_data.py` |
| `scripts/verify_requirements.py` | 5,142 | `E:\zaora\TRADEORA\scripts\verify_requirements.py` |
| `scripts/weekly_shariah_review.py` | 9,164 | `E:\zaora\TRADEORA\scripts\weekly_shariah_review.py` |
| `seed_all_missing_data.py` | 10,938 | `E:\zaora\TRADEORA\seed_all_missing_data.py` |
| `seed_comprehensive_data.py` | 18,147 | `E:\zaora\TRADEORA\seed_comprehensive_data.py` |
| `seed_egx_screenshot_flows.py` | 2,096 | `E:\zaora\TRADEORA\seed_egx_screenshot_flows.py` |
| `seed_events.py` | 4,115 | `E:\zaora\TRADEORA\seed_events.py` |
| `seed_full_dual_tier_signals.py` | 7,121 | `E:\zaora\TRADEORA\seed_full_dual_tier_signals.py` |
| `seed_live_egx_official_flows.py` | 1,835 | `E:\zaora\TRADEORA\seed_live_egx_official_flows.py` |
| `seed_official_egx_news.py` | 19,663 | `E:\zaora\TRADEORA\seed_official_egx_news.py` |
| `seed_tight_v6_signals.py` | 5,343 | `E:\zaora\TRADEORA\seed_tight_v6_signals.py` |
| `sync_live_egx_prices.py` | 3,132 | `E:\zaora\TRADEORA\sync_live_egx_prices.py` |
| `wipe_recommended_trades.py` | 576 | `E:\zaora\TRADEORA\wipe_recommended_trades.py` |

### 📂 Database & Migration Schemas (46 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `database/db.py` | 8,892 | `E:\zaora\TRADEORA\database\db.py` |
| `database/list_users.py` | 996 | `E:\zaora\TRADEORA\database\list_users.py` |
| `database/make_admin.py` | 3,143 | `E:\zaora\TRADEORA\database\make_admin.py` |
| `database/migrations/002_add_market_context.sql` | 3,008 | `E:\zaora\TRADEORA\database\migrations\002_add_market_context.sql` |
| `database/migrations/003_add_shariah_audit_log.sql` | 605 | `E:\zaora\TRADEORA\database\migrations\003_add_shariah_audit_log.sql` |
| `database/migrations/004_create_historical_prices.sql` | 811 | `E:\zaora\TRADEORA\database\migrations\004_create_historical_prices.sql` |
| `database/migrations/005_create_get_latest_prices.sql` | 906 | `E:\zaora\TRADEORA\database\migrations\005_create_get_latest_prices.sql` |
| `database/migrations/006_create_signal_stats.sql` | 672 | `E:\zaora\TRADEORA\database\migrations\006_create_signal_stats.sql` |
| `database/migrations/007_create_disclosures_and_macro_news.sql` | 1,282 | `E:\zaora\TRADEORA\database\migrations\007_create_disclosures_and_macro_news.sql` |
| `database/migrations/007_create_trades.sql` | 771 | `E:\zaora\TRADEORA\database\migrations\007_create_trades.sql` |
| `database/migrations/008_create_settings.sql` | 387 | `E:\zaora\TRADEORA\database\migrations\008_create_settings.sql` |
| `database/migrations/009_create_user_trades.sql` | 1,642 | `E:\zaora\TRADEORA\database\migrations\009_create_user_trades.sql` |
| `database/migrations/010_watchlist_alerts_telegram.sql` | 3,741 | `E:\zaora\TRADEORA\database\migrations\010_watchlist_alerts_telegram.sql` |
| `database/migrations/011_add_performance_indexes.sql` | 457 | `E:\zaora\TRADEORA\database\migrations\011_add_performance_indexes.sql` |
| `database/migrations/012_create_performance_reports.sql` | 1,013 | `E:\zaora\TRADEORA\database\migrations\012_create_performance_reports.sql` |
| `database/migrations/013_create_processed_stripe_events.sql` | 576 | `E:\zaora\TRADEORA\database\migrations\013_create_processed_stripe_events.sql` |
| `database/migrations/014_delete_old_snapshots_chunked.sql` | 479 | `E:\zaora\TRADEORA\database\migrations\014_delete_old_snapshots_chunked.sql` |
| `database/migrations/015_create_company_news.sql` | 1,322 | `E:\zaora\TRADEORA\database\migrations\015_create_company_news.sql` |
| `database/migrations/016_create_company_fundamentals.sql` | 1,004 | `E:\zaora\TRADEORA\database\migrations\016_create_company_fundamentals.sql` |
| `database/migrations/017_create_ml_predictions.sql` | 794 | `E:\zaora\TRADEORA\database\migrations\017_create_ml_predictions.sql` |
| `database/migrations/018_add_fair_value_and_dividends.sql` | 630 | `E:\zaora\TRADEORA\database\migrations\018_add_fair_value_and_dividends.sql` |
| `database/migrations/019_add_news_impact_fields.sql` | 353 | `E:\zaora\TRADEORA\database\migrations\019_add_news_impact_fields.sql` |
| `database/schema.sql` | 4,499 | `E:\zaora\TRADEORA\database\schema.sql` |
| `database/seed_companies.py` | 6,214 | `E:\zaora\TRADEORA\database\seed_companies.py` |
| `setup_intraday_db.sql` | 2,236 | `E:\zaora\TRADEORA\setup_intraday_db.sql` |
| `supabase/.temp/cli-latest` | 8 | `E:\zaora\TRADEORA\supabase\.temp\cli-latest` |
| `supabase/.temp/gotrue-version` | 8 | `E:\zaora\TRADEORA\supabase\.temp\gotrue-version` |
| `supabase/.temp/linked-project.json` | 132 | `E:\zaora\TRADEORA\supabase\.temp\linked-project.json` |
| `supabase/.temp/pooler-url` | 92 | `E:\zaora\TRADEORA\supabase\.temp\pooler-url` |
| `supabase/.temp/postgres-version` | 10 | `E:\zaora\TRADEORA\supabase\.temp\postgres-version` |
| `supabase/.temp/project-ref` | 20 | `E:\zaora\TRADEORA\supabase\.temp\project-ref` |
| `supabase/.temp/rest-version` | 5 | `E:\zaora\TRADEORA\supabase\.temp\rest-version` |
| `supabase/.temp/storage-migration` | 33 | `E:\zaora\TRADEORA\supabase\.temp\storage-migration` |
| `supabase/.temp/storage-version` | 7 | `E:\zaora\TRADEORA\supabase\.temp\storage-version` |
| `supabase/migrations/20260720220522_remote_schema.sql` | 1,353 | `E:\zaora\TRADEORA\supabase\migrations\20260720220522_remote_schema.sql` |
| `supabase/migrations/20260720221855_drop_helper_rpc.sql` | 49 | `E:\zaora\TRADEORA\supabase\migrations\20260720221855_drop_helper_rpc.sql` |
| `supabase/migrations/20260721103000_add_fair_value_and_dividends.sql` | 561 | `E:\zaora\TRADEORA\supabase\migrations\20260721103000_add_fair_value_and_dividends.sql` |
| `supabase/migrations/20260721110000_add_news_impact_fields.sql` | 349 | `E:\zaora\TRADEORA\supabase\migrations\20260721110000_add_news_impact_fields.sql` |
| `supabase/migrations/20260731_trade_alerts.sql` | 3,726 | `E:\zaora\TRADEORA\supabase\migrations\20260731_trade_alerts.sql` |
| `supabase/migrations/20260801_corporate_events_and_insiders.sql` | 2,607 | `E:\zaora\TRADEORA\supabase\migrations\20260801_corporate_events_and_insiders.sql` |
| `supabase/migrations/20260801_investor_flows.sql` | 2,886 | `E:\zaora\TRADEORA\supabase\migrations\20260801_investor_flows.sql` |
| `supabase/migrations/20260801_yahoo_sources.sql` | 665 | `E:\zaora\TRADEORA\supabase\migrations\20260801_yahoo_sources.sql` |
| `supabase/migrations/20260802_critical_fixes.sql` | 3,505 | `E:\zaora\TRADEORA\supabase\migrations\20260802_critical_fixes.sql` |
| `supabase/migrations/20260802_missing_tables_supabase.sql` | 11,627 | `E:\zaora\TRADEORA\supabase\migrations\20260802_missing_tables_supabase.sql` |
| `supabase/migrations/20260802_seasonality_and_levels.sql` | 2,289 | `E:\zaora\TRADEORA\supabase\migrations\20260802_seasonality_and_levels.sql` |
| `supabase/migrations/20260802_volume_and_orderbook_tables.sql` | 2,332 | `E:\zaora\TRADEORA\supabase\migrations\20260802_volume_and_orderbook_tables.sql` |

### 📂 Documentation & Architecture Specs (128 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `03_EGX_TARGET_ARCHITECTURE.md` | 71,387 | `E:\zaora\TRADEORA\03_EGX_TARGET_ARCHITECTURE.md` |
| `README.md` | 8,695 | `E:\zaora\TRADEORA\README.md` |
| `copy/docs/AI_CAPABILITY_MATRIX.md` | 76,548 | `E:\zaora\TRADEORA\copy\docs\AI_CAPABILITY_MATRIX.md` |
| `copy/docs/AI_CAPABILITY_REGISTRY.md` | 99,363 | `E:\zaora\TRADEORA\copy\docs\AI_CAPABILITY_REGISTRY.md` |
| `copy/docs/AI_CAPABILITY_REGISTRY_CERTIFICATE.md` | 24,171 | `E:\zaora\TRADEORA\copy\docs\AI_CAPABILITY_REGISTRY_CERTIFICATE.md` |
| `copy/docs/AI_DEPENDENCY_GRAPH.md` | 33,147 | `E:\zaora\TRADEORA\copy\docs\AI_DEPENDENCY_GRAPH.md` |
| `copy/docs/AI_INTELLIGENCE_ENGINE_ARCHITECTURE.md` | 30,768 | `E:\zaora\TRADEORA\copy\docs\AI_INTELLIGENCE_ENGINE_ARCHITECTURE.md` |
| `copy/docs/AI_LIFECYCLE.md` | 41,464 | `E:\zaora\TRADEORA\copy\docs\AI_LIFECYCLE.md` |
| `copy/docs/AI_PERFORMANCE_SLA_ARCHITECTURE.md` | 61,011 | `E:\zaora\TRADEORA\copy\docs\AI_PERFORMANCE_SLA_ARCHITECTURE.md` |
| `copy/docs/AI_RUNTIME_ARCHITECTURE.md` | 21,476 | `E:\zaora\TRADEORA\copy\docs\AI_RUNTIME_ARCHITECTURE.md` |
| `copy/docs/AI_SAFETY_AND_ETHICS_FRAMEWORK.md` | 34,239 | `E:\zaora\TRADEORA\copy\docs\AI_SAFETY_AND_ETHICS_FRAMEWORK.md` |
| `copy/docs/AI_SERVICE_CATALOG.md` | 33,091 | `E:\zaora\TRADEORA\copy\docs\AI_SERVICE_CATALOG.md` |
| `copy/docs/AI_VERSION_HISTORY.md` | 44,525 | `E:\zaora\TRADEORA\copy\docs\AI_VERSION_HISTORY.md` |
| `copy/docs/API_CONTRACT_SPECIFICATION.md` | 23,206 | `E:\zaora\TRADEORA\copy\docs\API_CONTRACT_SPECIFICATION.md` |
| `copy/docs/APPLICATION_LAYER_ARCHITECTURE.md` | 69,232 | `E:\zaora\TRADEORA\copy\docs\APPLICATION_LAYER_ARCHITECTURE.md` |
| `copy/docs/ARCHITECTURE_ADDENDUM_PHASE8_SPECIFICATIONS.md` | 33,774 | `E:\zaora\TRADEORA\copy\docs\ARCHITECTURE_ADDENDUM_PHASE8_SPECIFICATIONS.md` |
| `copy/docs/ARCHITECTURE_BASELINE_MANIFEST.md` | 11,327 | `E:\zaora\TRADEORA\copy\docs\ARCHITECTURE_BASELINE_MANIFEST.md` |
| `copy/docs/ARCHITECTURE_CHANGE_LOG.md` | 36,153 | `E:\zaora\TRADEORA\copy\docs\ARCHITECTURE_CHANGE_LOG.md` |
| `copy/docs/ARCHITECTURE_COMPLIANCE_CERTIFICATE.md` | 8,509 | `E:\zaora\TRADEORA\copy\docs\ARCHITECTURE_COMPLIANCE_CERTIFICATE.md` |
| `copy/docs/ARCHITECTURE_CONSISTENCY_VERIFICATION.md` | 39,875 | `E:\zaora\TRADEORA\copy\docs\ARCHITECTURE_CONSISTENCY_VERIFICATION.md` |
| `copy/docs/ARCHITECTURE_DECISION_RECORDS.md` | 136,272 | `E:\zaora\TRADEORA\copy\docs\ARCHITECTURE_DECISION_RECORDS.md` |
| `copy/docs/ARCHITECTURE_DECISION_RECORDS_v1_1.md` | 52,680 | `E:\zaora\TRADEORA\copy\docs\ARCHITECTURE_DECISION_RECORDS_v1_1.md` |
| `copy/docs/ARCHITECTURE_FREEZE_CERTIFICATE_v1_1.md` | 28,595 | `E:\zaora\TRADEORA\copy\docs\ARCHITECTURE_FREEZE_CERTIFICATE_v1_1.md` |
| `copy/docs/ARCHITECTURE_FREEZE_CERTIFICATE_v1_2_FINAL.md` | 8,249 | `E:\zaora\TRADEORA\copy\docs\ARCHITECTURE_FREEZE_CERTIFICATE_v1_2_FINAL.md` |
| `copy/docs/ARCHITECTURE_FREEZE_CERTIFICATION.md` | 36,749 | `E:\zaora\TRADEORA\copy\docs\ARCHITECTURE_FREEZE_CERTIFICATION.md` |
| `copy/docs/ARCHITECTURE_IMPROVEMENT_REPORT.md` | 22,466 | `E:\zaora\TRADEORA\copy\docs\ARCHITECTURE_IMPROVEMENT_REPORT.md` |
| `copy/docs/ARCHITECTURE_SPECIFICATION_PATCHES.md` | 31,612 | `E:\zaora\TRADEORA\copy\docs\ARCHITECTURE_SPECIFICATION_PATCHES.md` |
| `copy/docs/BACKGROUND_PROCESSING_ARCHITECTURE.md` | 40,741 | `E:\zaora\TRADEORA\copy\docs\BACKGROUND_PROCESSING_ARCHITECTURE.md` |
| `copy/docs/BLUEPRINT_AI_RECOMMENDATION_FLOW.md` | 72,131 | `E:\zaora\TRADEORA\copy\docs\BLUEPRINT_AI_RECOMMENDATION_FLOW.md` |
| `copy/docs/BLUEPRINT_ALERT_TRIGGER_FLOW.md` | 28,050 | `E:\zaora\TRADEORA\copy\docs\BLUEPRINT_ALERT_TRIGGER_FLOW.md` |
| `copy/docs/BLUEPRINT_BACKTEST_FLOW.md` | 27,086 | `E:\zaora\TRADEORA\copy\docs\BLUEPRINT_BACKTEST_FLOW.md` |
| `copy/docs/BLUEPRINT_DATA_PIPELINE_FLOW.md` | 63,529 | `E:\zaora\TRADEORA\copy\docs\BLUEPRINT_DATA_PIPELINE_FLOW.md` |
| `copy/docs/BLUEPRINT_EGX_SESSION_MANAGEMENT.md` | 46,220 | `E:\zaora\TRADEORA\copy\docs\BLUEPRINT_EGX_SESSION_MANAGEMENT.md` |
| `copy/docs/BLUEPRINT_KYC_COMPLIANCE_FLOW.md` | 43,703 | `E:\zaora\TRADEORA\copy\docs\BLUEPRINT_KYC_COMPLIANCE_FLOW.md` |
| `copy/docs/BLUEPRINT_MULTI_TENANCY_PROVISIONING_FLOW.md` | 49,568 | `E:\zaora\TRADEORA\copy\docs\BLUEPRINT_MULTI_TENANCY_PROVISIONING_FLOW.md` |
| `copy/docs/BLUEPRINT_PORTFOLIO_NAV_FLOW.md` | 34,712 | `E:\zaora\TRADEORA\copy\docs\BLUEPRINT_PORTFOLIO_NAV_FLOW.md` |
| `copy/docs/BLUEPRINT_SUBSCRIPTION_BILLING_FLOW.md` | 43,199 | `E:\zaora\TRADEORA\copy\docs\BLUEPRINT_SUBSCRIPTION_BILLING_FLOW.md` |
| `copy/docs/BLUEPRINT_USER_ONBOARDING_FLOW.md` | 70,231 | `E:\zaora\TRADEORA\copy\docs\BLUEPRINT_USER_ONBOARDING_FLOW.md` |
| `copy/docs/BOUNDED_CONTEXT_MAP.md` | 1,069,165 | `E:\zaora\TRADEORA\copy\docs\BOUNDED_CONTEXT_MAP.md` |
| `copy/docs/BUSINESS_CAPABILITY_MODEL.md` | 168,107 | `E:\zaora\TRADEORA\copy\docs\BUSINESS_CAPABILITY_MODEL.md` |
| `copy/docs/BUSINESS_DOMAIN_DISCOVERY.md` | 137,446 | `E:\zaora\TRADEORA\copy\docs\BUSINESS_DOMAIN_DISCOVERY.md` |
| `copy/docs/CAPACITY_PLANNING_AND_SCALABILITY.md` | 24,540 | `E:\zaora\TRADEORA\copy\docs\CAPACITY_PLANNING_AND_SCALABILITY.md` |
| `copy/docs/CODEBASE_ARCHITECTURE.md` | 51,770 | `E:\zaora\TRADEORA\copy\docs\CODEBASE_ARCHITECTURE.md` |
| `copy/docs/DATA_ARCHITECTURE_AND_LAKEHOUSE.md` | 33,268 | `E:\zaora\TRADEORA\copy\docs\DATA_ARCHITECTURE_AND_LAKEHOUSE.md` |
| `copy/docs/DEVOPS_INFRASTRUCTURE_ARCHITECTURE.md` | 34,732 | `E:\zaora\TRADEORA\copy\docs\DEVOPS_INFRASTRUCTURE_ARCHITECTURE.md` |
| `copy/docs/DISASTER_RECOVERY_PLAN.md` | 28,442 | `E:\zaora\TRADEORA\copy\docs\DISASTER_RECOVERY_PLAN.md` |
| `copy/docs/DOMAINS_AND_BOUNDED_CONTEXTS.md` | 47,252 | `E:\zaora\TRADEORA\copy\docs\DOMAINS_AND_BOUNDED_CONTEXTS.md` |
| `copy/docs/DOMAIN_EVENT_CATALOG.md` | 277,031 | `E:\zaora\TRADEORA\copy\docs\DOMAIN_EVENT_CATALOG.md` |
| `copy/docs/EGX_25_STOCKS_EMPIRICAL_AUDIT_REPORT.md` | 6,770 | `E:\zaora\TRADEORA\copy\docs\EGX_25_STOCKS_EMPIRICAL_AUDIT_REPORT.md` |
| `copy/docs/EGX_ALL_293_STOCKS_FULL_REGISTER.md` | 34,691 | `E:\zaora\TRADEORA\copy\docs\EGX_ALL_293_STOCKS_FULL_REGISTER.md` |
| `copy/docs/EGX_ALL_STOCKS_MASTER_REGISTER.md` | 21,806 | `E:\zaora\TRADEORA\copy\docs\EGX_ALL_STOCKS_MASTER_REGISTER.md` |
| `copy/docs/EGX_MARKET_DATA_SOURCES_AUDIT_REPORT.md` | 9,749 | `E:\zaora\TRADEORA\copy\docs\EGX_MARKET_DATA_SOURCES_AUDIT_REPORT.md` |
| `copy/docs/EGX_PERFECT_OFFICIAL_MASTER_REGISTER.md` | 65,460 | `E:\zaora\TRADEORA\copy\docs\EGX_PERFECT_OFFICIAL_MASTER_REGISTER.md` |
| `copy/docs/EGX_SECURITY_MASTER_AND_DATA_FEEDS_AUTHORITATIVE_REPORT.md` | 3,080 | `E:\zaora\TRADEORA\copy\docs\EGX_SECURITY_MASTER_AND_DATA_FEEDS_AUTHORITATIVE_REPORT.md` |
| `copy/docs/ENGINEERING_AND_INTELLIGENCE_VISION.md` | 58,030 | `E:\zaora\TRADEORA\copy\docs\ENGINEERING_AND_INTELLIGENCE_VISION.md` |
| `copy/docs/ENGINEERING_FOUNDATION.md` | 69,980 | `E:\zaora\TRADEORA\copy\docs\ENGINEERING_FOUNDATION.md` |
| `copy/docs/ENTERPRISE_AI_BENCHMARK_SUITE.md` | 36,203 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_AI_BENCHMARK_SUITE.md` |
| `copy/docs/ENTERPRISE_ARCHITECTURE_DECISION_RECORDS.md` | 28,278 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_ARCHITECTURE_DECISION_RECORDS.md` |
| `copy/docs/ENTERPRISE_ARCHITECTURE_FRAMEWORK.md` | 25,274 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_ARCHITECTURE_FRAMEWORK.md` |
| `copy/docs/ENTERPRISE_BASELINE_SIGNATURE.md` | 8,742 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_BASELINE_SIGNATURE.md` |
| `copy/docs/ENTERPRISE_DEVELOPMENT_STANDARDS.md` | 55,624 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_DEVELOPMENT_STANDARDS.md` |
| `copy/docs/ENTERPRISE_EVOLUTION_KPIS.md` | 32,947 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_EVOLUTION_KPIS.md` |
| `copy/docs/ENTERPRISE_GOVERNANCE.md` | 31,226 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_GOVERNANCE.md` |
| `copy/docs/ENTERPRISE_METRICS_CATALOG.md` | 58,517 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_METRICS_CATALOG.md` |
| `copy/docs/ENTERPRISE_METRICS_FRAMEWORK.md` | 33,296 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_METRICS_FRAMEWORK.md` |
| `copy/docs/ENTERPRISE_OPERATIONS_PLATFORM.md` | 34,182 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_OPERATIONS_PLATFORM.md` |
| `copy/docs/ENTERPRISE_QUALITY_MANAGEMENT_PLATFORM.md` | 42,325 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_QUALITY_MANAGEMENT_PLATFORM.md` |
| `copy/docs/ENTERPRISE_RISK_MANAGEMENT_AND_COMPLIANCE_PLATFORM.md` | 35,562 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_RISK_MANAGEMENT_AND_COMPLIANCE_PLATFORM.md` |
| `copy/docs/ENTERPRISE_SRE_AND_RESILIENCE_PLATFORM.md` | 31,694 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_SRE_AND_RESILIENCE_PLATFORM.md` |
| `copy/docs/ENTERPRISE_TECHNICAL_BLUEPRINT.md` | 73,803 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_TECHNICAL_BLUEPRINT.md` |
| `copy/docs/ENTERPRISE_TECHNOLOGY_STACK.md` | 37,528 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_TECHNOLOGY_STACK.md` |
| `copy/docs/ENTERPRISE_TECHNOLOGY_STRATEGY.md` | 43,931 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_TECHNOLOGY_STRATEGY.md` |
| `copy/docs/ENTERPRISE_TOOLCHAIN_CERTIFICATION.md` | 30,985 | `E:\zaora\TRADEORA\copy\docs\ENTERPRISE_TOOLCHAIN_CERTIFICATION.md` |
| `copy/docs/EVENT_ARCHITECTURE.md` | 25,781 | `E:\zaora\TRADEORA\copy\docs\EVENT_ARCHITECTURE.md` |
| `copy/docs/EVENT_SCHEMA_REGISTRY_ARCHITECTURE.md` | 32,862 | `E:\zaora\TRADEORA\copy\docs\EVENT_SCHEMA_REGISTRY_ARCHITECTURE.md` |
| `copy/docs/FEATURE_GOVERNANCE_FRAMEWORK.md` | 27,093 | `E:\zaora\TRADEORA\copy\docs\FEATURE_GOVERNANCE_FRAMEWORK.md` |
| `copy/docs/FEATURE_TRACEABILITY_MATRIX.md` | 29,878 | `E:\zaora\TRADEORA\copy\docs\FEATURE_TRACEABILITY_MATRIX.md` |
| `copy/docs/FRONTEND_ARCHITECTURE.md` | 36,971 | `E:\zaora\TRADEORA\copy\docs\FRONTEND_ARCHITECTURE.md` |
| `copy/docs/GLOBAL_EXPANSION_STRATEGY.md` | 26,343 | `E:\zaora\TRADEORA\copy\docs\GLOBAL_EXPANSION_STRATEGY.md` |
| `copy/docs/GO_LIVE_CHECKLIST.md` | 111,499 | `E:\zaora\TRADEORA\copy\docs\GO_LIVE_CHECKLIST.md` |
| `copy/docs/GROUND_TRUTH_FEEDBACK_ARCHITECTURE.md` | 23,849 | `E:\zaora\TRADEORA\copy\docs\GROUND_TRUTH_FEEDBACK_ARCHITECTURE.md` |
| `copy/docs/IMPLEMENTATION_AUTHORIZATION_CERTIFICATE.md` | 10,312 | `E:\zaora\TRADEORA\copy\docs\IMPLEMENTATION_AUTHORIZATION_CERTIFICATE.md` |
| `copy/docs/IMPLEMENTATION_CHECKLIST.md` | 293,148 | `E:\zaora\TRADEORA\copy\docs\IMPLEMENTATION_CHECKLIST.md` |
| `copy/docs/IMPLEMENTATION_DEPENDENCY_GRAPH.md` | 101,725 | `E:\zaora\TRADEORA\copy\docs\IMPLEMENTATION_DEPENDENCY_GRAPH.md` |
| `copy/docs/IMPLEMENTATION_READINESS_GATE.md` | 27,476 | `E:\zaora\TRADEORA\copy\docs\IMPLEMENTATION_READINESS_GATE.md` |
| `copy/docs/INFRASTRUCTURE_CONFLICT_RESOLUTION.md` | 32,392 | `E:\zaora\TRADEORA\copy\docs\INFRASTRUCTURE_CONFLICT_RESOLUTION.md` |
| `copy/docs/INFRASTRUCTURE_LAYER_ARCHITECTURE.md` | 41,166 | `E:\zaora\TRADEORA\copy\docs\INFRASTRUCTURE_LAYER_ARCHITECTURE.md` |
| `copy/docs/INTEGRATION_ARCHITECTURE.md` | 29,349 | `E:\zaora\TRADEORA\copy\docs\INTEGRATION_ARCHITECTURE.md` |
| `copy/docs/INTRADAY_FRA_EMBARGO_SYNC_SPECIFICATION.md` | 18,633 | `E:\zaora\TRADEORA\copy\docs\INTRADAY_FRA_EMBARGO_SYNC_SPECIFICATION.md` |
| `copy/docs/LLM_GATEWAY_ARCHITECTURE.md` | 27,752 | `E:\zaora\TRADEORA\copy\docs\LLM_GATEWAY_ARCHITECTURE.md` |
| `copy/docs/MASTER_IMPLEMENTATION_EXECUTION_PLAN.md` | 88,131 | `E:\zaora\TRADEORA\copy\docs\MASTER_IMPLEMENTATION_EXECUTION_PLAN.md` |
| `copy/docs/MASTER_RELEASE_ROADMAP.md` | 76,000 | `E:\zaora\TRADEORA\copy\docs\MASTER_RELEASE_ROADMAP.md` |
| `copy/docs/MULTI_REGION_ARCHITECTURE.md` | 26,474 | `E:\zaora\TRADEORA\copy\docs\MULTI_REGION_ARCHITECTURE.md` |
| `copy/docs/MULTI_TENANCY_ARCHITECTURE.md` | 24,701 | `E:\zaora\TRADEORA\copy\docs\MULTI_TENANCY_ARCHITECTURE.md` |
| `copy/docs/OBSERVABILITY_ARCHITECTURE.md` | 69,207 | `E:\zaora\TRADEORA\copy\docs\OBSERVABILITY_ARCHITECTURE.md` |
| `copy/docs/OPERATIONAL_RUNBOOKS.md` | 35,489 | `E:\zaora\TRADEORA\copy\docs\OPERATIONAL_RUNBOOKS.md` |
| `copy/docs/PERFORMANCE_ARCHITECTURE.md` | 45,254 | `E:\zaora\TRADEORA\copy\docs\PERFORMANCE_ARCHITECTURE.md` |
| `copy/docs/PLUGIN_ARCHITECTURE.md` | 36,266 | `E:\zaora\TRADEORA\copy\docs\PLUGIN_ARCHITECTURE.md` |
| `copy/docs/PRODUCTION_ARCHITECTURE_CERTIFICATE.md` | 7,450 | `E:\zaora\TRADEORA\copy\docs\PRODUCTION_ARCHITECTURE_CERTIFICATE.md` |
| `copy/docs/PRODUCT_EVOLUTION_TIMELINE.md` | 40,397 | `E:\zaora\TRADEORA\copy\docs\PRODUCT_EVOLUTION_TIMELINE.md` |
| `copy/docs/PROJECT_CONSTITUTION.md` | 95,873 | `E:\zaora\TRADEORA\copy\docs\PROJECT_CONSTITUTION.md` |
| `copy/docs/RELEASE_DEPENDENCY_GRAPH.md` | 32,617 | `E:\zaora\TRADEORA\copy\docs\RELEASE_DEPENDENCY_GRAPH.md` |
| `copy/docs/RELEASE_EXECUTION_PLAN.md` | 267,710 | `E:\zaora\TRADEORA\copy\docs\RELEASE_EXECUTION_PLAN.md` |
| `copy/docs/ROADMAP_FREEZE_CERTIFICATE_v1_2.md` | 7,271 | `E:\zaora\TRADEORA\copy\docs\ROADMAP_FREEZE_CERTIFICATE_v1_2.md` |
| `copy/docs/SAGA_AND_PROCESS_MANAGER_SPECIFICATIONS.md` | 21,596 | `E:\zaora\TRADEORA\copy\docs\SAGA_AND_PROCESS_MANAGER_SPECIFICATIONS.md` |
| `copy/docs/SECURITY_ARCHITECTURE.md` | 35,093 | `E:\zaora\TRADEORA\copy\docs\SECURITY_ARCHITECTURE.md` |
| `copy/docs/SIMULATION_AND_BACKTESTING_FRAMEWORK.md` | 63,226 | `E:\zaora\TRADEORA\copy\docs\SIMULATION_AND_BACKTESTING_FRAMEWORK.md` |
| `copy/docs/SPRINT_EXECUTION_PLAN.md` | 174,789 | `E:\zaora\TRADEORA\copy\docs\SPRINT_EXECUTION_PLAN.md` |
| `copy/docs/SYSTEM_AUDIT_TRAIL_SPECIFICATION.md` | 46,585 | `E:\zaora\TRADEORA\copy\docs\SYSTEM_AUDIT_TRAIL_SPECIFICATION.md` |
| `copy/docs/TACTICAL_DOMAIN_MODEL.md` | 871,674 | `E:\zaora\TRADEORA\copy\docs\TACTICAL_DOMAIN_MODEL.md` |
| `copy/docs/TECHNICAL_DEBT_GOVERNANCE.md` | 25,668 | `E:\zaora\TRADEORA\copy\docs\TECHNICAL_DEBT_GOVERNANCE.md` |
| `copy/docs/TECHNOLOGY_ARCHITECTURE.md` | 56,362 | `E:\zaora\TRADEORA\copy\docs\TECHNOLOGY_ARCHITECTURE.md` |
| `copy/docs/TRADEORA_ENGINEERING_CONSTITUTION.md` | 41,646 | `E:\zaora\TRADEORA\copy\docs\TRADEORA_ENGINEERING_CONSTITUTION.md` |
| `copy/docs/UBIQUITOUS_LANGUAGE.md` | 213,134 | `E:\zaora\TRADEORA\copy\docs\UBIQUITOUS_LANGUAGE.md` |
| `copy/docs/VERTICAL_SLICE_VALIDATION_MATRIX.md` | 42,629 | `E:\zaora\TRADEORA\copy\docs\VERTICAL_SLICE_VALIDATION_MATRIX.md` |
| `docs/01_EGX_COMPREHENSIVE_AUDIT.md` | 76,738 | `E:\zaora\TRADEORA\docs\01_EGX_COMPREHENSIVE_AUDIT.md` |
| `docs/02_EGX_CURRENT_ARCHITECTURE.md` | 88,364 | `E:\zaora\TRADEORA\docs\02_EGX_CURRENT_ARCHITECTURE.md` |
| `docs/02_EGX_SUPPLEMENTARY_AUDIT.md` | 28,393 | `E:\zaora\TRADEORA\docs\02_EGX_SUPPLEMENTARY_AUDIT.md` |
| `docs/03_EGX_TARGET_ARCHITECTURE.md` | 71,387 | `E:\zaora\TRADEORA\docs\03_EGX_TARGET_ARCHITECTURE.md` |
| `docs/04_EGX_GAP_ANALYSIS_AND_REBUILD_PLAN.md` | 115,727 | `E:\zaora\TRADEORA\docs\04_EGX_GAP_ANALYSIS_AND_REBUILD_PLAN.md` |
| `docs/CANONICAL_PRICE_RESOLUTION_AUDIT.md` | 32,213 | `E:\zaora\TRADEORA\docs\CANONICAL_PRICE_RESOLUTION_AUDIT.md` |
| `docs/CANONICAL_PRICE_RUNTIME_VALIDATION.md` | 17,643 | `E:\zaora\TRADEORA\docs\CANONICAL_PRICE_RUNTIME_VALIDATION.md` |
| `docs/MARKET_DATA_FORENSIC_AUDIT.md` | 47,525 | `E:\zaora\TRADEORA\docs\MARKET_DATA_FORENSIC_AUDIT.md` |
| `docs/TRADINGVIEW_SOURCE_VERIFICATION_AUDIT.md` | 30,248 | `E:\zaora\TRADEORA\docs\TRADINGVIEW_SOURCE_VERIFICATION_AUDIT.md` |
| `future_roadmap.md` | 11,697 | `E:\zaora\TRADEORA\future_roadmap.md` |
| `tradeora-web/AGENTS.md` | 327 | `E:\zaora\TRADEORA\tradeora-web\AGENTS.md` |
| `tradeora-web/CLAUDE.md` | 11 | `E:\zaora\TRADEORA\tradeora-web\CLAUDE.md` |
| `tradeora-web/README.md` | 1,450 | `E:\zaora\TRADEORA\tradeora-web\README.md` |

### 📂 Frontend & Build Configuration (3 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `tradeora-web/next.config.ts` | 297 | `E:\zaora\TRADEORA\tradeora-web\next.config.ts` |
| `tradeora-web/package.json` | 1,220 | `E:\zaora\TRADEORA\tradeora-web\package.json` |
| `tradeora-web/tsconfig.json` | 666 | `E:\zaora\TRADEORA\tradeora-web\tsconfig.json` |

### 📂 Frontend (tradeora-web) (13 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `tradeora-web/.env.local` | 1,293 | `E:\zaora\TRADEORA\tradeora-web\.env.local` |
| `tradeora-web/.env.production` | 1,041 | `E:\zaora\TRADEORA\tradeora-web\.env.production` |
| `tradeora-web/.env.production.local` | 1,680 | `E:\zaora\TRADEORA\tradeora-web\.env.production.local` |
| `tradeora-web/.gitignore` | 498 | `E:\zaora\TRADEORA\tradeora-web\.gitignore` |
| `tradeora-web/.vercel/README.txt` | 520 | `E:\zaora\TRADEORA\tradeora-web\.vercel\README.txt` |
| `tradeora-web/env.vercel.production.txt` | 1,764 | `E:\zaora\TRADEORA\tradeora-web\env.vercel.production.txt` |
| `tradeora-web/env.vercel.txt` | 1,175 | `E:\zaora\TRADEORA\tradeora-web\env.vercel.txt` |
| `tradeora-web/eslint.config.mjs` | 465 | `E:\zaora\TRADEORA\tradeora-web\eslint.config.mjs` |
| `tradeora-web/models/prediction_errors.log` | 458 | `E:\zaora\TRADEORA\tradeora-web\models\prediction_errors.log` |
| `tradeora-web/mubasher.html` | 289,800 | `E:\zaora\TRADEORA\tradeora-web\mubasher.html` |
| `tradeora-web/postcss.config.mjs` | 94 | `E:\zaora\TRADEORA\tradeora-web\postcss.config.mjs` |
| `tradeora-web/supabase/migrations/20260803_trade_alert_snapshots.sql` | 1,540 | `E:\zaora\TRADEORA\tradeora-web\supabase\migrations\20260803_trade_alert_snapshots.sql` |
| `tradeora-web/tsconfig.tsbuildinfo` | 257,293 | `E:\zaora\TRADEORA\tradeora-web\tsconfig.tsbuildinfo` |

### 📂 Frontend App & Pages (Next.js) (31 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `tradeora-web/app/[locale]/admin/loading.tsx` | 369 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\admin\loading.tsx` |
| `tradeora-web/app/[locale]/admin/page.tsx` | 27,643 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\admin\page.tsx` |
| `tradeora-web/app/[locale]/analytics/page.tsx` | 14,354 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\analytics\page.tsx` |
| `tradeora-web/app/[locale]/auth/page.tsx` | 19,711 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\auth\page.tsx` |
| `tradeora-web/app/[locale]/calendar/page.tsx` | 12,943 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\calendar\page.tsx` |
| `tradeora-web/app/[locale]/compare/loading.tsx` | 388 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\compare\loading.tsx` |
| `tradeora-web/app/[locale]/compare/page.tsx` | 17,324 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\compare\page.tsx` |
| `tradeora-web/app/[locale]/daily-report/page.tsx` | 2,003 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\daily-report\page.tsx` |
| `tradeora-web/app/[locale]/investment/page.tsx` | 10,969 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\investment\page.tsx` |
| `tradeora-web/app/[locale]/investor-flows/page.tsx` | 26,058 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\investor-flows\page.tsx` |
| `tradeora-web/app/[locale]/layout.tsx` | 2,908 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\layout.tsx` |
| `tradeora-web/app/[locale]/my-trades/loading.tsx` | 364 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\my-trades\loading.tsx` |
| `tradeora-web/app/[locale]/my-trades/page.tsx` | 24,757 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\my-trades\page.tsx` |
| `tradeora-web/app/[locale]/news/page.tsx` | 16,358 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\news\page.tsx` |
| `tradeora-web/app/[locale]/page.tsx` | 31,148 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\page.tsx` |
| `tradeora-web/app/[locale]/performance/loading.tsx` | 374 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\performance\loading.tsx` |
| `tradeora-web/app/[locale]/performance/page.tsx` | 48,009 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\performance\page.tsx` |
| `tradeora-web/app/[locale]/pricing/page.tsx` | 9,260 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\pricing\page.tsx` |
| `tradeora-web/app/[locale]/screener/page.tsx` | 21,734 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\screener\page.tsx` |
| `tradeora-web/app/[locale]/sectors/loading.tsx` | 377 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\sectors\loading.tsx` |
| `tradeora-web/app/[locale]/sectors/page.tsx` | 14,613 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\sectors\page.tsx` |
| `tradeora-web/app/[locale]/settings/loading.tsx` | 357 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\settings\loading.tsx` |
| `tradeora-web/app/[locale]/settings/page.tsx` | 27,083 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\settings\page.tsx` |
| `tradeora-web/app/[locale]/stock/[symbol]/page.tsx` | 17,725 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\stock\[symbol]\page.tsx` |
| `tradeora-web/app/[locale]/watchlist/loading.tsx` | 367 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\watchlist\loading.tsx` |
| `tradeora-web/app/[locale]/watchlist/page.tsx` | 9,686 | `E:\zaora\TRADEORA\tradeora-web\app\[locale]\watchlist\page.tsx` |
| `tradeora-web/app/error.tsx` | 1,370 | `E:\zaora\TRADEORA\tradeora-web\app\error.tsx` |
| `tradeora-web/app/favicon.ico` | 25,931 | `E:\zaora\TRADEORA\tradeora-web\app\favicon.ico` |
| `tradeora-web/app/globals.css` | 4,287 | `E:\zaora\TRADEORA\tradeora-web\app\globals.css` |
| `tradeora-web/app/layout.tsx` | 243 | `E:\zaora\TRADEORA\tradeora-web\app\layout.tsx` |
| `tradeora-web/app/not-found.tsx` | 2,612 | `E:\zaora\TRADEORA\tradeora-web\app\not-found.tsx` |

### 📂 Frontend Components (Next.js) (40 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `tradeora-web/components/dashboard/MacroNewsPanel.tsx` | 4,509 | `E:\zaora\TRADEORA\tradeora-web\components\dashboard\MacroNewsPanel.tsx` |
| `tradeora-web/components/dashboard/MarketMoversWidget.tsx` | 16,834 | `E:\zaora\TRADEORA\tradeora-web\components\dashboard\MarketMoversWidget.tsx` |
| `tradeora-web/components/dashboard/MarketOverviewBar.tsx` | 7,560 | `E:\zaora\TRADEORA\tradeora-web\components\dashboard\MarketOverviewBar.tsx` |
| `tradeora-web/components/dashboard/StockRow.tsx` | 5,423 | `E:\zaora\TRADEORA\tradeora-web\components\dashboard\StockRow.tsx` |
| `tradeora-web/components/dashboard/StockTable.tsx` | 9,570 | `E:\zaora\TRADEORA\tradeora-web\components\dashboard\StockTable.tsx` |
| `tradeora-web/components/dashboard/TableFilters.tsx` | 4,376 | `E:\zaora\TRADEORA\tradeora-web\components\dashboard\TableFilters.tsx` |
| `tradeora-web/components/layout/DisclaimerModal.tsx` | 2,553 | `E:\zaora\TRADEORA\tradeora-web\components\layout\DisclaimerModal.tsx` |
| `tradeora-web/components/layout/Navbar.tsx` | 13,055 | `E:\zaora\TRADEORA\tradeora-web\components\layout\Navbar.tsx` |
| `tradeora-web/components/layout/NotificationCenter.tsx` | 5,661 | `E:\zaora\TRADEORA\tradeora-web\components\layout\NotificationCenter.tsx` |
| `tradeora-web/components/news/NewsDetailModal.tsx` | 5,923 | `E:\zaora\TRADEORA\tradeora-web\components\news\NewsDetailModal.tsx` |
| `tradeora-web/components/onboarding/OnboardingFlow.tsx` | 11,971 | `E:\zaora\TRADEORA\tradeora-web\components\onboarding\OnboardingFlow.tsx` |
| `tradeora-web/components/performance/ActiveTradesModal.tsx` | 44,738 | `E:\zaora\TRADEORA\tradeora-web\components\performance\ActiveTradesModal.tsx` |
| `tradeora-web/components/performance/QualityDrilldownModal.tsx` | 14,414 | `E:\zaora\TRADEORA\tradeora-web\components\performance\QualityDrilldownModal.tsx` |
| `tradeora-web/components/performance/TradeVisualizer.tsx` | 8,394 | `E:\zaora\TRADEORA\tradeora-web\components\performance\TradeVisualizer.tsx` |
| `tradeora-web/components/report/DailyReportView.tsx` | 30,613 | `E:\zaora\TRADEORA\tradeora-web\components\report\DailyReportView.tsx` |
| `tradeora-web/components/sectors/SectorDetailModal.tsx` | 21,090 | `E:\zaora\TRADEORA\tradeora-web\components\sectors\SectorDetailModal.tsx` |
| `tradeora-web/components/stock/CandlestickChart.tsx` | 24,637 | `E:\zaora\TRADEORA\tradeora-web\components\stock\CandlestickChart.tsx` |
| `tradeora-web/components/stock/DataSourcesPanel.tsx` | 12,484 | `E:\zaora\TRADEORA\tradeora-web\components\stock\DataSourcesPanel.tsx` |
| `tradeora-web/components/stock/Level2OrderBook.tsx` | 20,783 | `E:\zaora\TRADEORA\tradeora-web\components\stock\Level2OrderBook.tsx` |
| `tradeora-web/components/stock/PriceAlertModal.tsx` | 4,554 | `E:\zaora\TRADEORA\tradeora-web\components\stock\PriceAlertModal.tsx` |
| `tradeora-web/components/stock/PriceChart.tsx` | 216,271 | `E:\zaora\TRADEORA\tradeora-web\components\stock\PriceChart.tsx` |
| `tradeora-web/components/stock/PriceFreshnessIndicator.tsx` | 2,576 | `E:\zaora\TRADEORA\tradeora-web\components\stock\PriceFreshnessIndicator.tsx` |
| `tradeora-web/components/stock/SeasonalityWidget.tsx` | 6,871 | `E:\zaora\TRADEORA\tradeora-web\components\stock\SeasonalityWidget.tsx` |
| `tradeora-web/components/stock/StockFundamentals.tsx` | 14,120 | `E:\zaora\TRADEORA\tradeora-web\components\stock\StockFundamentals.tsx` |
| `tradeora-web/components/stock/StockHeader.tsx` | 13,137 | `E:\zaora\TRADEORA\tradeora-web\components\stock\StockHeader.tsx` |
| `tradeora-web/components/stock/StockNewsPanel.tsx` | 7,124 | `E:\zaora\TRADEORA\tradeora-web\components\stock\StockNewsPanel.tsx` |
| `tradeora-web/components/stock/StockNewsTab.tsx` | 7,544 | `E:\zaora\TRADEORA\tradeora-web\components\stock\StockNewsTab.tsx` |
| `tradeora-web/components/stock/TechnicalBreakdownTable.tsx` | 42,479 | `E:\zaora\TRADEORA\tradeora-web\components\stock\TechnicalBreakdownTable.tsx` |
| `tradeora-web/components/stock/TradingViewAdvancedChart.tsx` | 2,433 | `E:\zaora\TRADEORA\tradeora-web\components\stock\TradingViewAdvancedChart.tsx` |
| `tradeora-web/components/stock/WatchlistButton.tsx` | 2,259 | `E:\zaora\TRADEORA\tradeora-web\components\stock\WatchlistButton.tsx` |
| `tradeora-web/components/ui/Badge.tsx` | 1,725 | `E:\zaora\TRADEORA\tradeora-web\components\ui\Badge.tsx` |
| `tradeora-web/components/ui/Button.tsx` | 1,107 | `E:\zaora\TRADEORA\tradeora-web\components\ui\Button.tsx` |
| `tradeora-web/components/ui/Card.tsx` | 627 | `E:\zaora\TRADEORA\tradeora-web\components\ui\Card.tsx` |
| `tradeora-web/components/ui/ChartSkeleton.tsx` | 945 | `E:\zaora\TRADEORA\tradeora-web\components\ui\ChartSkeleton.tsx` |
| `tradeora-web/components/ui/PriceTag.tsx` | 1,901 | `E:\zaora\TRADEORA\tradeora-web\components\ui\PriceTag.tsx` |
| `tradeora-web/components/ui/QualityDot.tsx` | 2,147 | `E:\zaora\TRADEORA\tradeora-web\components\ui\QualityDot.tsx` |
| `tradeora-web/components/ui/ScreenerRowSkeleton.tsx` | 626 | `E:\zaora\TRADEORA\tradeora-web\components\ui\ScreenerRowSkeleton.tsx` |
| `tradeora-web/components/ui/Skeleton.tsx` | 551 | `E:\zaora\TRADEORA\tradeora-web\components\ui\Skeleton.tsx` |
| `tradeora-web/components/ui/StockCardSkeleton.tsx` | 578 | `E:\zaora\TRADEORA\tradeora-web\components\ui\StockCardSkeleton.tsx` |
| `tradeora-web/components/ui/TradeoraLogo.tsx` | 3,000 | `E:\zaora\TRADEORA\tradeora-web\components\ui\TradeoraLogo.tsx` |

### 📂 Frontend Libs / Hooks / Types / Utils (32 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `tradeora-web/hooks/useLivePriceStream.ts` | 1,175 | `E:\zaora\TRADEORA\tradeora-web\hooks\useLivePriceStream.ts` |
| `tradeora-web/hooks/useMarketStatus.ts` | 692 | `E:\zaora\TRADEORA\tradeora-web\hooks\useMarketStatus.ts` |
| `tradeora-web/hooks/useStockDetail.ts` | 2,289 | `E:\zaora\TRADEORA\tradeora-web\hooks\useStockDetail.ts` |
| `tradeora-web/hooks/useStocks.ts` | 1,191 | `E:\zaora\TRADEORA\tradeora-web\hooks\useStocks.ts` |
| `tradeora-web/lib/alert-dispatcher.ts` | 12,927 | `E:\zaora\TRADEORA\tradeora-web\lib\alert-dispatcher.ts` |
| `tradeora-web/lib/data-aggregator.ts` | 3,094 | `E:\zaora\TRADEORA\tradeora-web\lib\data-aggregator.ts` |
| `tradeora-web/lib/db.ts` | 896 | `E:\zaora\TRADEORA\tradeora-web\lib\db.ts` |
| `tradeora-web/lib/domain.ts` | 32 | `E:\zaora\TRADEORA\tradeora-web\lib\domain.ts` |
| `tradeora-web/lib/domain/alerts-screening.ts` | 1,446 | `E:\zaora\TRADEORA\tradeora-web\lib\domain\alerts-screening.ts` |
| `tradeora-web/lib/domain/fundamentals.ts` | 1,595 | `E:\zaora\TRADEORA\tradeora-web\lib\domain\fundamentals.ts` |
| `tradeora-web/lib/domain/identity.ts` | 834 | `E:\zaora\TRADEORA\tradeora-web\lib\domain\identity.ts` |
| `tradeora-web/lib/domain/index.ts` | 348 | `E:\zaora\TRADEORA\tradeora-web\lib\domain\index.ts` |
| `tradeora-web/lib/domain/kyc.ts` | 1,662 | `E:\zaora\TRADEORA\tradeora-web\lib\domain\kyc.ts` |
| `tradeora-web/lib/domain/market-calendar.ts` | 3,567 | `E:\zaora\TRADEORA\tradeora-web\lib\domain\market-calendar.ts` |
| `tradeora-web/lib/domain/market-data.ts` | 4,914 | `E:\zaora\TRADEORA\tradeora-web\lib\domain\market-data.ts` |
| `tradeora-web/lib/domain/money.ts` | 2,147 | `E:\zaora\TRADEORA\tradeora-web\lib\domain\money.ts` |
| `tradeora-web/lib/domain/portfolio.ts` | 2,979 | `E:\zaora\TRADEORA\tradeora-web\lib\domain\portfolio.ts` |
| `tradeora-web/lib/domain/subscription.ts` | 3,849 | `E:\zaora\TRADEORA\tradeora-web\lib\domain\subscription.ts` |
| `tradeora-web/lib/domain/technical-indicators.ts` | 9,529 | `E:\zaora\TRADEORA\tradeora-web\lib\domain\technical-indicators.ts` |
| `tradeora-web/lib/domain/trade-risk-levels.ts` | 3,390 | `E:\zaora\TRADEORA\tradeora-web\lib\domain\trade-risk-levels.ts` |
| `tradeora-web/lib/egx-sectors.ts` | 5,677 | `E:\zaora\TRADEORA\tradeora-web\lib\egx-sectors.ts` |
| `tradeora-web/lib/email.ts` | 4,086 | `E:\zaora\TRADEORA\tradeora-web\lib\email.ts` |
| `tradeora-web/lib/formatters.ts` | 3,651 | `E:\zaora\TRADEORA\tradeora-web\lib\formatters.ts` |
| `tradeora-web/lib/live-price-store.ts` | 2,007 | `E:\zaora\TRADEORA\tradeora-web\lib\live-price-store.ts` |
| `tradeora-web/lib/market-utils.ts` | 5,601 | `E:\zaora\TRADEORA\tradeora-web\lib\market-utils.ts` |
| `tradeora-web/lib/postgres-client.ts` | 9,800 | `E:\zaora\TRADEORA\tradeora-web\lib\postgres-client.ts` |
| `tradeora-web/lib/queries.ts` | 20,436 | `E:\zaora\TRADEORA\tradeora-web\lib\queries.ts` |
| `tradeora-web/lib/shariah-data.ts` | 2,169 | `E:\zaora\TRADEORA\tradeora-web\lib\shariah-data.ts` |
| `tradeora-web/lib/supabase.ts` | 1,144 | `E:\zaora\TRADEORA\tradeora-web\lib\supabase.ts` |
| `tradeora-web/lib/ta-utils.ts` | 35,684 | `E:\zaora\TRADEORA\tradeora-web\lib\ta-utils.ts` |
| `tradeora-web/lib/usePushNotifications.ts` | 2,366 | `E:\zaora\TRADEORA\tradeora-web\lib\usePushNotifications.ts` |
| `tradeora-web/lib/useUserRole.ts` | 1,224 | `E:\zaora\TRADEORA\tradeora-web\lib\useUserRole.ts` |

### 📂 Frontend Other Assets & Files (35 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `tradeora-web/.vercel/project.json` | 117 | `E:\zaora\TRADEORA\tradeora-web\.vercel\project.json` |
| `tradeora-web/add_foreign_ownership_col.js` | 923 | `E:\zaora\TRADEORA\tradeora-web\add_foreign_ownership_col.js` |
| `tradeora-web/add_vercel_envs.js` | 1,548 | `E:\zaora\TRADEORA\tradeora-web\add_vercel_envs.js` |
| `tradeora-web/check-active-models.js` | 653 | `E:\zaora\TRADEORA\tradeora-web\check-active-models.js` |
| `tradeora-web/check-infi-adj.js` | 1,011 | `E:\zaora\TRADEORA\tradeora-web\check-infi-adj.js` |
| `tradeora-web/check-infi.js` | 610 | `E:\zaora\TRADEORA\tradeora-web\check-infi.js` |
| `tradeora-web/check-today-prices.js` | 949 | `E:\zaora\TRADEORA\tradeora-web\check-today-prices.js` |
| `tradeora-web/check_fundamentals_cols.js` | 686 | `E:\zaora\TRADEORA\tradeora-web\check_fundamentals_cols.js` |
| `tradeora-web/i18n.ts` | 270 | `E:\zaora\TRADEORA\tradeora-web\i18n.ts` |
| `tradeora-web/messages/ar.json` | 7,173 | `E:\zaora\TRADEORA\tradeora-web\messages\ar.json` |
| `tradeora-web/messages/en.json` | 5,668 | `E:\zaora\TRADEORA\tradeora-web\messages\en.json` |
| `tradeora-web/migrate-intraday-snapshots.js` | 3,415 | `E:\zaora\TRADEORA\tradeora-web\migrate-intraday-snapshots.js` |
| `tradeora-web/next-env.d.ts` | 247 | `E:\zaora\TRADEORA\tradeora-web\next-env.d.ts` |
| `tradeora-web/package-lock.json` | 305,734 | `E:\zaora\TRADEORA\tradeora-web\package-lock.json` |
| `tradeora-web/proxy.ts` | 5,478 | `E:\zaora\TRADEORA\tradeora-web\proxy.ts` |
| `tradeora-web/public/favicon.ico` | 137,705 | `E:\zaora\TRADEORA\tradeora-web\public\favicon.ico` |
| `tradeora-web/public/file.svg` | 391 | `E:\zaora\TRADEORA\tradeora-web\public\file.svg` |
| `tradeora-web/public/globe.svg` | 1,035 | `E:\zaora\TRADEORA\tradeora-web\public\globe.svg` |
| `tradeora-web/public/icon-192.png` | 302,946 | `E:\zaora\TRADEORA\tradeora-web\public\icon-192.png` |
| `tradeora-web/public/icon-512.png` | 302,946 | `E:\zaora\TRADEORA\tradeora-web\public\icon-512.png` |
| `tradeora-web/public/logo-icon.png` | 157,916 | `E:\zaora\TRADEORA\tradeora-web\public\logo-icon.png` |
| `tradeora-web/public/logo.png` | 705,575 | `E:\zaora\TRADEORA\tradeora-web\public\logo.png` |
| `tradeora-web/public/manifest.json` | 417 | `E:\zaora\TRADEORA\tradeora-web\public\manifest.json` |
| `tradeora-web/public/next.svg` | 1,375 | `E:\zaora\TRADEORA\tradeora-web\public\next.svg` |
| `tradeora-web/public/sw.js` | 1,548 | `E:\zaora\TRADEORA\tradeora-web\public\sw.js` |
| `tradeora-web/public/trading-mockup.jpg` | 622,472 | `E:\zaora\TRADEORA\tradeora-web\public\trading-mockup.jpg` |
| `tradeora-web/public/vercel.svg` | 128 | `E:\zaora\TRADEORA\tradeora-web\public\vercel.svg` |
| `tradeora-web/public/window.svg` | 385 | `E:\zaora\TRADEORA\tradeora-web\public\window.svg` |
| `tradeora-web/scratch_test_indices.js` | 1,578 | `E:\zaora\TRADEORA\tradeora-web\scratch_test_indices.js` |
| `tradeora-web/scratch_test_shariah.js` | 1,881 | `E:\zaora\TRADEORA\tradeora-web\scratch_test_shariah.js` |
| `tradeora-web/sync-mubasher.js` | 3,763 | `E:\zaora\TRADEORA\tradeora-web\sync-mubasher.js` |
| `tradeora-web/sync-prices.js` | 598 | `E:\zaora\TRADEORA\tradeora-web\sync-prices.js` |
| `tradeora-web/test-tv-scanner.js` | 680 | `E:\zaora\TRADEORA\tradeora-web\test-tv-scanner.js` |
| `tradeora-web/test.js` | 789 | `E:\zaora\TRADEORA\tradeora-web\test.js` |
| `tradeora-web/vercel.json` | 466 | `E:\zaora\TRADEORA\tradeora-web\vercel.json` |

### 📂 GitHub Actions / CI/CD (16 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `.github/workflows/cockroach-sync.yml` | 3,126 | `E:\zaora\TRADEORA\.github\workflows\cockroach-sync.yml` |
| `.github/workflows/daily-backfill.yml` | 2,227 | `E:\zaora\TRADEORA\.github\workflows\daily-backfill.yml` |
| `.github/workflows/daily-recommendations.yml` | 1,792 | `E:\zaora\TRADEORA\.github\workflows\daily-recommendations.yml` |
| `.github/workflows/daily_news_intelligence.yml` | 1,264 | `E:\zaora\TRADEORA\.github\workflows\daily_news_intelligence.yml` |
| `.github/workflows/daily_update.yml` | 2,892 | `E:\zaora\TRADEORA\.github\workflows\daily_update.yml` |
| `.github/workflows/egx-investor-flows.yml` | 5,993 | `E:\zaora\TRADEORA\.github\workflows\egx-investor-flows.yml` |
| `.github/workflows/intraday_prices_schedule.yml` | 2,899 | `E:\zaora\TRADEORA\.github\workflows\intraday_prices_schedule.yml` |
| `.github/workflows/intraday_signals.yml` | 1,671 | `E:\zaora\TRADEORA\.github\workflows\intraday_signals.yml` |
| `.github/workflows/live-session-candles.yml` | 1,754 | `E:\zaora\TRADEORA\.github\workflows\live-session-candles.yml` |
| `.github/workflows/session-crons.yml` | 2,798 | `E:\zaora\TRADEORA\.github\workflows\session-crons.yml` |
| `.github/workflows/track_trades_schedule.yml` | 1,444 | `E:\zaora\TRADEORA\.github\workflows\track_trades_schedule.yml` |
| `.github/workflows/trade-monitor.yml` | 3,053 | `E:\zaora\TRADEORA\.github\workflows\trade-monitor.yml` |
| `.github/workflows/weekly_backtest.yml` | 3,005 | `E:\zaora\TRADEORA\.github\workflows\weekly_backtest.yml` |
| `.github/workflows/weekly_fundamentals_sync.yml` | 968 | `E:\zaora\TRADEORA\.github\workflows\weekly_fundamentals_sync.yml` |
| `.github/workflows/weekly_performance_analytics.yml` | 998 | `E:\zaora\TRADEORA\.github\workflows\weekly_performance_analytics.yml` |
| `.github/workflows/weekly_shariah_review.yml` | 831 | `E:\zaora\TRADEORA\.github\workflows\weekly_shariah_review.yml` |

### 📂 ML Models & Artifacts (36 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `models/model_15m.pkl` | 349,837 | `E:\zaora\TRADEORA\models\model_15m.pkl` |
| `models/model_15m_v2.pkl` | 349,775 | `E:\zaora\TRADEORA\models\model_15m_v2.pkl` |
| `models/model_15m_v2_metadata.json` | 1,971 | `E:\zaora\TRADEORA\models\model_15m_v2_metadata.json` |
| `models/model_1d.pkl` | 349,361 | `E:\zaora\TRADEORA\models\model_1d.pkl` |
| `models/model_1d_v2.pkl` | 344,597 | `E:\zaora\TRADEORA\models\model_1d_v2.pkl` |
| `models/model_1d_v3.pkl` | 795,687 | `E:\zaora\TRADEORA\models\model_1d_v3.pkl` |
| `models/model_1d_v4.pkl` | 7,167,923 | `E:\zaora\TRADEORA\models\model_1d_v4.pkl` |
| `models/model_1d_v5.pkl` | 1,443,467 | `E:\zaora\TRADEORA\models\model_1d_v5.pkl` |
| `models/model_1d_v6.pkl` | 2,856,139 | `E:\zaora\TRADEORA\models\model_1d_v6.pkl` |
| `models/model_1h.pkl` | 335,967 | `E:\zaora\TRADEORA\models\model_1h.pkl` |
| `models/model_1h_v2.pkl` | 336,789 | `E:\zaora\TRADEORA\models\model_1h_v2.pkl` |
| `models/model_1h_v2_metadata.json` | 1,963 | `E:\zaora\TRADEORA\models\model_1h_v2_metadata.json` |
| `models/model_1w_v2.pkl` | 209,368 | `E:\zaora\TRADEORA\models\model_1w_v2.pkl` |
| `models/model_1w_v2_metadata.json` | 289 | `E:\zaora\TRADEORA\models\model_1w_v2_metadata.json` |
| `models/model_4h.pkl` | 314,681 | `E:\zaora\TRADEORA\models\model_4h.pkl` |
| `models/model_4h_v2.pkl` | 316,525 | `E:\zaora\TRADEORA\models\model_4h_v2.pkl` |
| `models/model_4h_v2_metadata.json` | 1,963 | `E:\zaora\TRADEORA\models\model_4h_v2_metadata.json` |
| `models/model_v2_metadata.json` | 2,011 | `E:\zaora\TRADEORA\models\model_v2_metadata.json` |
| `models/model_v3_metadata.json` | 2,522 | `E:\zaora\TRADEORA\models\model_v3_metadata.json` |
| `models/model_v4_metadata.json` | 2,081 | `E:\zaora\TRADEORA\models\model_v4_metadata.json` |
| `models/model_v5_metadata.json` | 976 | `E:\zaora\TRADEORA\models\model_v5_metadata.json` |
| `models/model_v6_metadata.json` | 1,100 | `E:\zaora\TRADEORA\models\model_v6_metadata.json` |
| `models/prediction_errors.log` | 2,987 | `E:\zaora\TRADEORA\models\prediction_errors.log` |
| `models/scaler_15m.pkl` | 927 | `E:\zaora\TRADEORA\models\scaler_15m.pkl` |
| `models/scaler_15m_v2.pkl` | 927 | `E:\zaora\TRADEORA\models\scaler_15m_v2.pkl` |
| `models/scaler_1d.pkl` | 927 | `E:\zaora\TRADEORA\models\scaler_1d.pkl` |
| `models/scaler_1d_v2.pkl` | 927 | `E:\zaora\TRADEORA\models\scaler_1d_v2.pkl` |
| `models/scaler_1d_v3.pkl` | 1,071 | `E:\zaora\TRADEORA\models\scaler_1d_v3.pkl` |
| `models/scaler_1d_v4.pkl` | 1,167 | `E:\zaora\TRADEORA\models\scaler_1d_v4.pkl` |
| `models/scaler_1d_v5.pkl` | 1,263 | `E:\zaora\TRADEORA\models\scaler_1d_v5.pkl` |
| `models/scaler_1d_v6.pkl` | 1,359 | `E:\zaora\TRADEORA\models\scaler_1d_v6.pkl` |
| `models/scaler_1h.pkl` | 927 | `E:\zaora\TRADEORA\models\scaler_1h.pkl` |
| `models/scaler_1h_v2.pkl` | 927 | `E:\zaora\TRADEORA\models\scaler_1h_v2.pkl` |
| `models/scaler_1w_v2.pkl` | 783 | `E:\zaora\TRADEORA\models\scaler_1w_v2.pkl` |
| `models/scaler_4h.pkl` | 927 | `E:\zaora\TRADEORA\models\scaler_4h.pkl` |
| `models/scaler_4h_v2.pkl` | 927 | `E:\zaora\TRADEORA\models\scaler_4h_v2.pkl` |

### 📂 ML Training, Backtesting & Prediction Pipeline (14 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `backtest_engine.py` | 29,371 | `E:\zaora\TRADEORA\backtest_engine.py` |
| `backtest_results.json` | 4,837 | `E:\zaora\TRADEORA\backtest_results.json` |
| `backtest_signals.py` | 13,502 | `E:\zaora\TRADEORA\backtest_signals.py` |
| `predict.py` | 23,721 | `E:\zaora\TRADEORA\predict.py` |
| `signal_guardian.py` | 10,283 | `E:\zaora\TRADEORA\signal_guardian.py` |
| `train_model.py` | 29,723 | `E:\zaora\TRADEORA\train_model.py` |
| `train_model_intraday_v2.py` | 16,174 | `E:\zaora\TRADEORA\train_model_intraday_v2.py` |
| `train_model_v2.py` | 14,837 | `E:\zaora\TRADEORA\train_model_v2.py` |
| `train_model_v3.py` | 18,253 | `E:\zaora\TRADEORA\train_model_v3.py` |
| `train_model_v4.py` | 17,368 | `E:\zaora\TRADEORA\train_model_v4.py` |
| `train_model_v5.py` | 14,539 | `E:\zaora\TRADEORA\train_model_v5.py` |
| `train_model_v6.py` | 15,589 | `E:\zaora\TRADEORA\train_model_v6.py` |
| `train_model_weekly_v2.py` | 9,303 | `E:\zaora\TRADEORA\train_model_weekly_v2.py` |
| `validate_backtest.py` | 38,547 | `E:\zaora\TRADEORA\validate_backtest.py` |

### 📂 Project Config & Environment (3 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `.env` | 1,305 | `E:\zaora\TRADEORA\.env` |
| `.gitignore` | 328 | `E:\zaora\TRADEORA\.gitignore` |
| `requirements.txt` | 1,527 | `E:\zaora\TRADEORA\requirements.txt` |

### 📂 Root Level / Other Scripts & Utilities (196 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `apply_critical_fixes.py` | 3,869 | `E:\zaora\TRADEORA\apply_critical_fixes.py` |
| `auto_scrape_egx_live_flows.py` | 6,486 | `E:\zaora\TRADEORA\auto_scrape_egx_live_flows.py` |
| `cockroach_sync.py` | 12,801 | `E:\zaora\TRADEORA\cockroach_sync.py` |
| `config/settings.py` | 1,193 | `E:\zaora\TRADEORA\config\settings.py` |
| `copy/docs/_r1_template.txt` | 15,814 | `E:\zaora\TRADEORA\copy\docs\_r1_template.txt` |
| `copy/docs/_r3_sample.txt` | 16,246 | `E:\zaora\TRADEORA\copy\docs\_r3_sample.txt` |
| `copy/docs/egx_10_sources_25_stocks_full_audit.json` | 13,237 | `E:\zaora\TRADEORA\copy\docs\egx_10_sources_25_stocks_full_audit.json` |
| `copy/docs/egx_10_stocks_all_sources_matrix.json` | 2,593 | `E:\zaora\TRADEORA\copy\docs\egx_10_stocks_all_sources_matrix.json` |
| `copy/docs/egx_10_stocks_master_perfect_match.json` | 2,468 | `E:\zaora\TRADEORA\copy\docs\egx_10_stocks_master_perfect_match.json` |
| `copy/docs/egx_25_stocks_audit_results.json` | 9,132 | `E:\zaora\TRADEORA\copy\docs\egx_25_stocks_audit_results.json` |
| `copy/docs/egx_300_full_raw_list.json` | 70,482 | `E:\zaora\TRADEORA\copy\docs\egx_300_full_raw_list.json` |
| `copy/docs/egx_all_stocks_master.json` | 16,976 | `E:\zaora\TRADEORA\copy\docs\egx_all_stocks_master.json` |
| `copy/docs/egx_basic_resources_exact_14.json` | 3,133 | `E:\zaora\TRADEORA\copy\docs\egx_basic_resources_exact_14.json` |
| `copy/docs/egx_complete_200_stocks.json` | 27,824 | `E:\zaora\TRADEORA\copy\docs\egx_complete_200_stocks.json` |
| `copy/docs/egx_deep_multi_source_comparison.json` | 6,219 | `E:\zaora\TRADEORA\copy\docs\egx_deep_multi_source_comparison.json` |
| `copy/docs/egx_official_sectors_playwright.json` | 2 | `E:\zaora\TRADEORA\copy\docs\egx_official_sectors_playwright.json` |
| `copy/docs/egx_prices_dump.html` | 49,168 | `E:\zaora\TRADEORA\copy\docs\egx_prices_dump.html` |
| `copy/docs/egx_real_estate_exact_33.json` | 7,723 | `E:\zaora\TRADEORA\copy\docs\egx_real_estate_exact_33.json` |
| `copy/docs/egx_real_estate_full_register.json` | 6,226 | `E:\zaora\TRADEORA\copy\docs\egx_real_estate_full_register.json` |
| `copy/docs/egx_scraping_test.png` | 4,714 | `E:\zaora\TRADEORA\copy\docs\egx_scraping_test.png` |
| `copy/docs/generate.py` | 30,890 | `E:\zaora\TRADEORA\copy\docs\generate.py` |
| `copy/docs/generate_docs.py` | 57,741 | `E:\zaora\TRADEORA\copy\docs\generate_docs.py` |
| `copy/docs/generate_registry.py` | 18,254 | `E:\zaora\TRADEORA\copy\docs\generate_registry.py` |
| `copy/docs/live_10_stocks_raw_prices.json` | 2,031 | `E:\zaora\TRADEORA\copy\docs\live_10_stocks_raw_prices.json` |
| `copy/packages/domain/dist/alerts-screening.d.ts` | 1,663 | `E:\zaora\TRADEORA\copy\packages\domain\dist\alerts-screening.d.ts` |
| `copy/packages/domain/dist/alerts-screening.js` | 220 | `E:\zaora\TRADEORA\copy\packages\domain\dist\alerts-screening.js` |
| `copy/packages/domain/dist/fundamentals.d.ts` | 1,855 | `E:\zaora\TRADEORA\copy\packages\domain\dist\fundamentals.d.ts` |
| `copy/packages/domain/dist/fundamentals.js` | 235 | `E:\zaora\TRADEORA\copy\packages\domain\dist\fundamentals.js` |
| `copy/packages/domain/dist/identity.d.ts` | 896 | `E:\zaora\TRADEORA\copy\packages\domain\dist\identity.d.ts` |
| `copy/packages/domain/dist/identity.js` | 77 | `E:\zaora\TRADEORA\copy\packages\domain\dist\identity.js` |
| `copy/packages/domain/dist/index.d.ts` | 348 | `E:\zaora\TRADEORA\copy\packages\domain\dist\index.d.ts` |
| `copy/packages/domain/dist/index.js` | 1,303 | `E:\zaora\TRADEORA\copy\packages\domain\dist\index.js` |
| `copy/packages/domain/dist/kyc.d.ts` | 1,707 | `E:\zaora\TRADEORA\copy\packages\domain\dist\kyc.d.ts` |
| `copy/packages/domain/dist/kyc.js` | 77 | `E:\zaora\TRADEORA\copy\packages\domain\dist\kyc.js` |
| `copy/packages/domain/dist/market-calendar.d.ts` | 1,839 | `E:\zaora\TRADEORA\copy\packages\domain\dist\market-calendar.d.ts` |
| `copy/packages/domain/dist/market-calendar.js` | 4,171 | `E:\zaora\TRADEORA\copy\packages\domain\dist\market-calendar.js` |
| `copy/packages/domain/dist/market-data.d.ts` | 3,414 | `E:\zaora\TRADEORA\copy\packages\domain\dist\market-data.d.ts` |
| `copy/packages/domain/dist/market-data.js` | 6,127 | `E:\zaora\TRADEORA\copy\packages\domain\dist\market-data.js` |
| `copy/packages/domain/dist/money.d.ts` | 571 | `E:\zaora\TRADEORA\copy\packages\domain\dist\money.d.ts` |
| `copy/packages/domain/dist/money.js` | 2,150 | `E:\zaora\TRADEORA\copy\packages\domain\dist\money.js` |
| `copy/packages/domain/dist/portfolio.d.ts` | 3,138 | `E:\zaora\TRADEORA\copy\packages\domain\dist\portfolio.d.ts` |
| `copy/packages/domain/dist/portfolio.js` | 77 | `E:\zaora\TRADEORA\copy\packages\domain\dist\portfolio.js` |
| `copy/packages/domain/dist/subscription.d.ts` | 2,272 | `E:\zaora\TRADEORA\copy\packages\domain\dist\subscription.d.ts` |
| `copy/packages/domain/dist/subscription.js` | 3,588 | `E:\zaora\TRADEORA\copy\packages\domain\dist\subscription.js` |
| `copy/packages/domain/dist/technical-indicators.d.ts` | 2,477 | `E:\zaora\TRADEORA\copy\packages\domain\dist\technical-indicators.d.ts` |
| `copy/packages/domain/dist/technical-indicators.js` | 10,735 | `E:\zaora\TRADEORA\copy\packages\domain\dist\technical-indicators.js` |
| `copy/packages/domain/dist/trade-risk-levels.d.ts` | 1,026 | `E:\zaora\TRADEORA\copy\packages\domain\dist\trade-risk-levels.d.ts` |
| `copy/packages/domain/dist/trade-risk-levels.js` | 4,258 | `E:\zaora\TRADEORA\copy\packages\domain\dist\trade-risk-levels.js` |
| `copy/packages/domain/package.json` | 279 | `E:\zaora\TRADEORA\copy\packages\domain\package.json` |
| `copy/packages/domain/src/alerts-screening.ts` | 1,726 | `E:\zaora\TRADEORA\copy\packages\domain\src\alerts-screening.ts` |
| `copy/packages/domain/src/fundamentals.ts` | 2,036 | `E:\zaora\TRADEORA\copy\packages\domain\src\fundamentals.ts` |
| `copy/packages/domain/src/identity.ts` | 834 | `E:\zaora\TRADEORA\copy\packages\domain\src\identity.ts` |
| `copy/packages/domain/src/index.ts` | 348 | `E:\zaora\TRADEORA\copy\packages\domain\src\index.ts` |
| `copy/packages/domain/src/kyc.ts` | 1,910 | `E:\zaora\TRADEORA\copy\packages\domain\src\kyc.ts` |
| `copy/packages/domain/src/market-calendar.ts` | 4,408 | `E:\zaora\TRADEORA\copy\packages\domain\src\market-calendar.ts` |
| `copy/packages/domain/src/market-data.ts` | 6,293 | `E:\zaora\TRADEORA\copy\packages\domain\src\market-data.ts` |
| `copy/packages/domain/src/money.ts` | 2,147 | `E:\zaora\TRADEORA\copy\packages\domain\src\money.ts` |
| `copy/packages/domain/src/portfolio.ts` | 3,760 | `E:\zaora\TRADEORA\copy\packages\domain\src\portfolio.ts` |
| `copy/packages/domain/src/subscription.ts` | 4,054 | `E:\zaora\TRADEORA\copy\packages\domain\src\subscription.ts` |
| `copy/packages/domain/src/technical-indicators.ts` | 10,363 | `E:\zaora\TRADEORA\copy\packages\domain\src\technical-indicators.ts` |
| `copy/packages/domain/src/trade-risk-levels.ts` | 4,226 | `E:\zaora\TRADEORA\copy\packages\domain\src\trade-risk-levels.ts` |
| `copy/packages/domain/tsconfig.json` | 206 | `E:\zaora\TRADEORA\copy\packages\domain\tsconfig.json` |
| `data/company_logos.json` | 21,344 | `E:\zaora\TRADEORA\data\company_logos.json` |
| `data/egx_daily_report.pdf` | 1,455,003 | `E:\zaora\TRADEORA\data\egx_daily_report.pdf` |
| `data/egx_daily_report_eng.pdf` | 1,510,050 | `E:\zaora\TRADEORA\data\egx_daily_report_eng.pdf` |
| `data/egypt-list-q1-2026.pdf` | 128,549 | `E:\zaora\TRADEORA\data\egypt-list-q1-2026.pdf` |
| `data/historical_exports/export_tradingview_15m.parquet` | 24,848 | `E:\zaora\TRADEORA\data\historical_exports\export_tradingview_15m.parquet` |
| `data/historical_exports/export_tradingview_1h.parquet` | 7,233,635 | `E:\zaora\TRADEORA\data\historical_exports\export_tradingview_1h.parquet` |
| `data/historical_exports/export_tradingview_30m.parquet` | 6,906,989 | `E:\zaora\TRADEORA\data\historical_exports\export_tradingview_30m.parquet` |
| `data/historical_exports/export_tradingview_4h.parquet` | 7,424,192 | `E:\zaora\TRADEORA\data\historical_exports\export_tradingview_4h.parquet` |
| `data/mubasher_mapping.json` | 57,810 | `E:\zaora\TRADEORA\data\mubasher_mapping.json` |
| `data/shariah_audit_full.json` | 137,777 | `E:\zaora\TRADEORA\data\shariah_audit_full.json` |
| `data/shariah_companies.json` | 25,939 | `E:\zaora\TRADEORA\data\shariah_companies.json` |
| `data/shariah_live_cache.json` | 205 | `E:\zaora\TRADEORA\data\shariah_live_cache.json` |
| `data/tradingview_mapping.json` | 14,435 | `E:\zaora\TRADEORA\data\tradingview_mapping.json` |
| `debug_egx_page.html` | 39 | `E:\zaora\TRADEORA\debug_egx_page.html` |
| `debug_egx_page.py` | 3,582 | `E:\zaora\TRADEORA\debug_egx_page.py` |
| `debug_egx_text.txt` | 0 | `E:\zaora\TRADEORA\debug_egx_text.txt` |
| `debug_trades.py` | 1,191 | `E:\zaora\TRADEORA\debug_trades.py` |
| `fill_intraday_history.py` | 3,499 | `E:\zaora\TRADEORA\fill_intraday_history.py` |
| `foreign_flow_analyzer.py` | 9,515 | `E:\zaora\TRADEORA\foreign_flow_analyzer.py` |
| `generate_daily_recommendations.py` | 36,431 | `E:\zaora\TRADEORA\generate_daily_recommendations.py` |
| `generate_intraday_recommendations.py` | 10,566 | `E:\zaora\TRADEORA\generate_intraday_recommendations.py` |
| `generate_v6_signals.py` | 7,820 | `E:\zaora\TRADEORA\generate_v6_signals.py` |
| `intraday_collector.py` | 4,010 | `E:\zaora\TRADEORA\intraday_collector.py` |
| `logs/backfill_errors.txt` | 45,228 | `E:\zaora\TRADEORA\logs\backfill_errors.txt` |
| `logs/egx_intraday_flows.log` | 325,927 | `E:\zaora\TRADEORA\logs\egx_intraday_flows.log` |
| `logs/flow_analyzer.log` | 0 | `E:\zaora\TRADEORA\logs\flow_analyzer.log` |
| `logs/generate_intraday_recommendations.log` | 0 | `E:\zaora\TRADEORA\logs\generate_intraday_recommendations.log` |
| `logs/generate_recommendations.log` | 3,405,578 | `E:\zaora\TRADEORA\logs\generate_recommendations.log` |
| `logs/golden_candle_audit_20260729_152819.json` | 36,519 | `E:\zaora\TRADEORA\logs\golden_candle_audit_20260729_152819.json` |
| `logs/golden_candle_audit_20260729_152819.txt` | 16,872 | `E:\zaora\TRADEORA\logs\golden_candle_audit_20260729_152819.txt` |
| `logs/html/egx_arb_blocked.html` | 39 | `E:\zaora\TRADEORA\logs\html\egx_arb_blocked.html` |
| `logs/html/egx_arb_error.html` | 39 | `E:\zaora\TRADEORA\logs\html\egx_arb_error.html` |
| `logs/import_report_20260712_214436.json` | 392 | `E:\zaora\TRADEORA\logs\import_report_20260712_214436.json` |
| `logs/import_report_20260712_214501.json` | 599 | `E:\zaora\TRADEORA\logs\import_report_20260712_214501.json` |
| `logs/import_report_20260712_214514.json` | 599 | `E:\zaora\TRADEORA\logs\import_report_20260712_214514.json` |
| `logs/import_report_20260712_214525.json` | 392 | `E:\zaora\TRADEORA\logs\import_report_20260712_214525.json` |
| `logs/import_report_20260712_214828.json` | 599 | `E:\zaora\TRADEORA\logs\import_report_20260712_214828.json` |
| `logs/import_report_20260712_221712.json` | 1,104 | `E:\zaora\TRADEORA\logs\import_report_20260712_221712.json` |
| `logs/import_report_20260712_221737.json` | 1,104 | `E:\zaora\TRADEORA\logs\import_report_20260712_221737.json` |
| `logs/import_report_20260712_223501.json` | 1,104 | `E:\zaora\TRADEORA\logs\import_report_20260712_223501.json` |
| `logs/import_report_20260712_223527.json` | 1,104 | `E:\zaora\TRADEORA\logs\import_report_20260712_223527.json` |
| `logs/import_report_20260712_224904.json` | 1,104 | `E:\zaora\TRADEORA\logs\import_report_20260712_224904.json` |
| `logs/import_report_20260712_224929.json` | 1,104 | `E:\zaora\TRADEORA\logs\import_report_20260712_224929.json` |
| `logs/import_report_20260712_231239.json` | 1,086 | `E:\zaora\TRADEORA\logs\import_report_20260712_231239.json` |
| `logs/import_report_20260712_232620.json` | 1,363 | `E:\zaora\TRADEORA\logs\import_report_20260712_232620.json` |
| `logs/import_report_20260712_232735.json` | 1,086 | `E:\zaora\TRADEORA\logs\import_report_20260712_232735.json` |
| `logs/import_report_20260712_233010.json` | 1,087 | `E:\zaora\TRADEORA\logs\import_report_20260712_233010.json` |
| `logs/import_report_20260712_233059.json` | 1,087 | `E:\zaora\TRADEORA\logs\import_report_20260712_233059.json` |
| `logs/import_report_20260712_233219.json` | 1,086 | `E:\zaora\TRADEORA\logs\import_report_20260712_233219.json` |
| `logs/import_report_20260712_233516.json` | 1,086 | `E:\zaora\TRADEORA\logs\import_report_20260712_233516.json` |
| `logs/import_report_20260712_234028.json` | 1,087 | `E:\zaora\TRADEORA\logs\import_report_20260712_234028.json` |
| `logs/import_report_20260712_235441.json` | 1,087 | `E:\zaora\TRADEORA\logs\import_report_20260712_235441.json` |
| `logs/import_report_20260712_235617.json` | 1,086 | `E:\zaora\TRADEORA\logs\import_report_20260712_235617.json` |
| `logs/import_report_20260712_235903.json` | 1,088 | `E:\zaora\TRADEORA\logs\import_report_20260712_235903.json` |
| `logs/import_report_20260713_001445.json` | 1,086 | `E:\zaora\TRADEORA\logs\import_report_20260713_001445.json` |
| `logs/import_report_20260714_014523.json` | 1,086 | `E:\zaora\TRADEORA\logs\import_report_20260714_014523.json` |
| `logs/import_report_20260714_015121.json` | 397 | `E:\zaora\TRADEORA\logs\import_report_20260714_015121.json` |
| `logs/import_report_20260714_015243.json` | 687 | `E:\zaora\TRADEORA\logs\import_report_20260714_015243.json` |
| `logs/import_report_20260714_015359.json` | 396 | `E:\zaora\TRADEORA\logs\import_report_20260714_015359.json` |
| `logs/import_report_20260714_154324.json` | 396 | `E:\zaora\TRADEORA\logs\import_report_20260714_154324.json` |
| `logs/import_report_20260714_231527.json` | 1,088 | `E:\zaora\TRADEORA\logs\import_report_20260714_231527.json` |
| `logs/import_report_20260714_231856.json` | 398 | `E:\zaora\TRADEORA\logs\import_report_20260714_231856.json` |
| `logs/import_report_20260716_202612.json` | 1,088 | `E:\zaora\TRADEORA\logs\import_report_20260716_202612.json` |
| `logs/import_report_20260717_034710.json` | 1,087 | `E:\zaora\TRADEORA\logs\import_report_20260717_034710.json` |
| `logs/import_report_20260717_035127.json` | 1,086 | `E:\zaora\TRADEORA\logs\import_report_20260717_035127.json` |
| `logs/import_report_20260717_170840.json` | 1,086 | `E:\zaora\TRADEORA\logs\import_report_20260717_170840.json` |
| `logs/import_report_20260719_020549.json` | 1,087 | `E:\zaora\TRADEORA\logs\import_report_20260719_020549.json` |
| `logs/import_report_20260721_000906.json` | 1,088 | `E:\zaora\TRADEORA\logs\import_report_20260721_000906.json` |
| `logs/import_report_20260721_012125.json` | 393 | `E:\zaora\TRADEORA\logs\import_report_20260721_012125.json` |
| `logs/import_report_20260721_012148.json` | 397 | `E:\zaora\TRADEORA\logs\import_report_20260721_012148.json` |
| `logs/import_report_20260721_015025.json` | 397 | `E:\zaora\TRADEORA\logs\import_report_20260721_015025.json` |
| `logs/import_report_20260721_015200.json` | 398 | `E:\zaora\TRADEORA\logs\import_report_20260721_015200.json` |
| `logs/intraday_importer.log` | 193,971 | `E:\zaora\TRADEORA\logs\intraday_importer.log` |
| `logs/performance_analytics.log` | 1,433 | `E:\zaora\TRADEORA\logs\performance_analytics.log` |
| `logs/screenshots/egx_arb_blocked.png` | 4,714 | `E:\zaora\TRADEORA\logs\screenshots\egx_arb_blocked.png` |
| `logs/screenshots/egx_arb_error.png` | 4,714 | `E:\zaora\TRADEORA\logs\screenshots\egx_arb_error.png` |
| `logs/signal_guardian.log` | 241,091 | `E:\zaora\TRADEORA\logs\signal_guardian.log` |
| `logs/signal_vs_chart_audit_20260729_153253.json` | 79,558 | `E:\zaora\TRADEORA\logs\signal_vs_chart_audit_20260729_153253.json` |
| `logs/signal_vs_chart_audit_20260729_153253.txt` | 22,082 | `E:\zaora\TRADEORA\logs\signal_vs_chart_audit_20260729_153253.txt` |
| `logs/stale_signals_backup_20260729_153907.json` | 4,019 | `E:\zaora\TRADEORA\logs\stale_signals_backup_20260729_153907.json` |
| `logs/track_trades.log` | 126,899 | `E:\zaora\TRADEORA\logs\track_trades.log` |
| `logs/trade_monitor.log` | 181,407 | `E:\zaora\TRADEORA\logs\trade_monitor.log` |
| `logs/tv_backfill.log` | 706,838 | `E:\zaora\TRADEORA\logs\tv_backfill.log` |
| `logs/yf_backfill.log` | 799,282 | `E:\zaora\TRADEORA\logs\yf_backfill.log` |
| `main.py` | 7,752 | `E:\zaora\TRADEORA\main.py` |
| `performance_analytics.py` | 12,892 | `E:\zaora\TRADEORA\performance_analytics.py` |
| `platform_db_audit.py` | 6,050 | `E:\zaora\TRADEORA\platform_db_audit.py` |
| `scratch/egx_page.html` | 6,700 | `E:\zaora\TRADEORA\scratch\egx_page.html` |
| `scratch/inspect_188k.py` | 790 | `E:\zaora\TRADEORA\scratch\inspect_188k.py` |
| `scratch/page_188k.html` | 189,730 | `E:\zaora\TRADEORA\scratch\page_188k.html` |
| `scratch/test_chrome_flow.py` | 1,969 | `E:\zaora\TRADEORA\scratch\test_chrome_flow.py` |
| `scratch/test_curl_cffi.py` | 1,065 | `E:\zaora\TRADEORA\scratch\test_curl_cffi.py` |
| `scratch/test_curl_direct.py` | 1,086 | `E:\zaora\TRADEORA\scratch\test_curl_direct.py` |
| `scratch/test_curl_html.py` | 830 | `E:\zaora\TRADEORA\scratch\test_curl_html.py` |
| `scratch/test_direct.py` | 1,755 | `E:\zaora\TRADEORA\scratch\test_direct.py` |
| `scratch/test_dump_dom.py` | 2,747 | `E:\zaora\TRADEORA\scratch\test_dump_dom.py` |
| `scratch/test_egx_fetch.py` | 1,384 | `E:\zaora\TRADEORA\scratch\test_egx_fetch.py` |
| `scratch/test_egx_scrape.py` | 1,493 | `E:\zaora\TRADEORA\scratch\test_egx_scrape.py` |
| `scratch/test_find_text.py` | 1,592 | `E:\zaora\TRADEORA\scratch\test_find_text.py` |
| `scratch/test_find_text2.py` | 1,915 | `E:\zaora\TRADEORA\scratch\test_find_text2.py` |
| `scratch/test_firefox.py` | 1,497 | `E:\zaora\TRADEORA\scratch\test_firefox.py` |
| `scratch/test_handle_redirect.py` | 1,820 | `E:\zaora\TRADEORA\scratch\test_handle_redirect.py` |
| `scratch/test_iframes.py` | 1,968 | `E:\zaora\TRADEORA\scratch\test_iframes.py` |
| `scratch/test_loop_eval.py` | 2,000 | `E:\zaora\TRADEORA\scratch\test_loop_eval.py` |
| `scratch/test_parse_188k.py` | 2,721 | `E:\zaora\TRADEORA\scratch\test_parse_188k.py` |
| `scratch/test_playwright_ajax.py` | 2,301 | `E:\zaora\TRADEORA\scratch\test_playwright_ajax.py` |
| `scratch/test_playwright_chrome.py` | 2,399 | `E:\zaora\TRADEORA\scratch\test_playwright_chrome.py` |
| `scratch/test_print_after_challenge.py` | 1,735 | `E:\zaora\TRADEORA\scratch\test_print_after_challenge.py` |
| `scratch/test_print_html.py` | 1,174 | `E:\zaora\TRADEORA\scratch\test_print_html.py` |
| `scratch/test_print_html2.py` | 2,146 | `E:\zaora\TRADEORA\scratch\test_print_html2.py` |
| `scratch/test_print_meta.py` | 1,389 | `E:\zaora\TRADEORA\scratch\test_print_meta.py` |
| `scratch/test_redirect_scrape.py` | 1,854 | `E:\zaora\TRADEORA\scratch\test_redirect_scrape.py` |
| `scratch/test_requests.py` | 1,089 | `E:\zaora\TRADEORA\scratch\test_requests.py` |
| `scratch/test_save_188k.py` | 2,372 | `E:\zaora\TRADEORA\scratch\test_save_188k.py` |
| `scratch/test_stable_scrape.py` | 2,387 | `E:\zaora\TRADEORA\scratch\test_stable_scrape.py` |
| `scratch/test_stealth.py` | 1,648 | `E:\zaora\TRADEORA\scratch\test_stealth.py` |
| `scratch/test_stealth_dom.py` | 2,006 | `E:\zaora\TRADEORA\scratch\test_stealth_dom.py` |
| `scratch/test_stealth_full.py` | 4,004 | `E:\zaora\TRADEORA\scratch\test_stealth_full.py` |
| `scratch/test_stealth_redirect.py` | 1,726 | `E:\zaora\TRADEORA\scratch\test_stealth_redirect.py` |
| `scratch/test_stealth_tsc.py` | 2,805 | `E:\zaora\TRADEORA\scratch\test_stealth_tsc.py` |
| `scratch/test_tspd_cookie.py` | 2,362 | `E:\zaora\TRADEORA\scratch\test_tspd_cookie.py` |
| `scratch/test_tspd_solve.py` | 3,082 | `E:\zaora\TRADEORA\scratch\test_tspd_solve.py` |
| `scratch/test_wait_title.py` | 2,157 | `E:\zaora\TRADEORA\scratch\test_wait_title.py` |
| `scratch_audit_results.json` | 319 | `E:\zaora\TRADEORA\scratch_audit_results.json` |
| `scratch_check_all_stock_candles.py` | 1,600 | `E:\zaora\TRADEORA\scratch_check_all_stock_candles.py` |
| `scratch_fast_audit_candles.py` | 922 | `E:\zaora\TRADEORA\scratch_fast_audit_candles.py` |
| `scratch_shariah.html` | 238,869 | `E:\zaora\TRADEORA\scratch_shariah.html` |
| `supabase_webhook_sync.py` | 4,079 | `E:\zaora\TRADEORA\supabase_webhook_sync.py` |
| `track_trades.py` | 26,920 | `E:\zaora\TRADEORA\track_trades.py` |
| `trade_monitor.py` | 8,563 | `E:\zaora\TRADEORA\trade_monitor.py` |
| `tv_backfill.py` | 12,142 | `E:\zaora\TRADEORA\tv_backfill.py` |
| `upgrade_to_v6.py` | 911 | `E:\zaora\TRADEORA\upgrade_to_v6.py` |
| `verify_data.py` | 2,737 | `E:\zaora\TRADEORA\verify_data.py` |
| `yf_backfill.py` | 10,185 | `E:\zaora\TRADEORA\yf_backfill.py` |

### 📂 Tests & Verification Suites (20 files)

| Relative Path | Size (Bytes) | Full Path |
| :--- | :---: | :--- |
| `__tests__/financial-accuracy.test.ts` | 1,267 | `E:\zaora\TRADEORA\__tests__\financial-accuracy.test.ts` |
| `almal_article_test.py` | 3,356 | `E:\zaora\TRADEORA\almal_article_test.py` |
| `almal_deep_test.py` | 3,095 | `E:\zaora\TRADEORA\almal_deep_test.py` |
| `almal_rss_test.py` | 2,878 | `E:\zaora\TRADEORA\almal_rss_test.py` |
| `alt_sources_test.py` | 2,210 | `E:\zaora\TRADEORA\alt_sources_test.py` |
| `egx_mobile_api_test.py` | 2,041 | `E:\zaora\TRADEORA\egx_mobile_api_test.py` |
| `egx_url_test.py` | 1,516 | `E:\zaora\TRADEORA\egx_url_test.py` |
| `mubasher_test.py` | 2,383 | `E:\zaora\TRADEORA\mubasher_test.py` |
| `scripts/source_unification_test.py` | 8,608 | `E:\zaora\TRADEORA\scripts\source_unification_test.py` |
| `test_api_trades.py` | 948 | `E:\zaora\TRADEORA\test_api_trades.py` |
| `test_categories.py` | 1,640 | `E:\zaora\TRADEORA\test_categories.py` |
| `test_direct.py` | 2,233 | `E:\zaora\TRADEORA\test_direct.py` |
| `test_egx_download.py` | 4,910 | `E:\zaora\TRADEORA\test_egx_download.py` |
| `test_egx_headed.py` | 2,818 | `E:\zaora\TRADEORA\test_egx_headed.py` |
| `test_egx_navigate.py` | 4,577 | `E:\zaora\TRADEORA\test_egx_navigate.py` |
| `test_historical.py` | 2,280 | `E:\zaora\TRADEORA\test_historical.py` |
| `test_market_movers.py` | 2,064 | `E:\zaora\TRADEORA\test_market_movers.py` |
| `tests/test_pipeline.py` | 3,156 | `E:\zaora\TRADEORA\tests\test_pipeline.py` |
| `tests/test_sector_relative_volume.py` | 1,991 | `E:\zaora\TRADEORA\tests\test_sector_relative_volume.py` |
| `tests/test_sentiment_system.py` | 3,369 | `E:\zaora\TRADEORA\tests\test_sentiment_system.py` |
