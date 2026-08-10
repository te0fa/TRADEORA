# TRADEORA EGX — ENVIRONMENT & SECRETS INVENTORY (00.1C)

> **Audit Timestamp:** 2026-08-10T23:12:38+03:00
> **Security Classification:** Strict Redaction (NO credential values printed)
> **Total Unique Environment Variables:** `55`
> **Total Hardcoded Source Code Violations:** `0`

## 1. Summary of Discovered Environment Variables

| Environment Variable | Total Usages | Primary Area / Layer | Security Sensitivity |
| :--- | :---: | :--- | :--- |
| **`CI_API_KEY`** | `1` | Backend / Python | 🔴 CRITICAL SECRET |
| **`COCKROACHDB_URL`** | `5` | CI/CD Workflows | 🟡 SENSITIVE ENDPOINT |
| **`COCKROACH_DB_URL`** | `5` | CI/CD Workflows | 🟡 SENSITIVE ENDPOINT |
| **`CRON_SECRET`** | `10` | CI/CD Workflows | 🔴 CRITICAL SECRET |
| **`DATABASE_URL`** | `21` | CI/CD Workflows | 🔴 CRITICAL SECRET |
| **`DATA_FOLDER`** | `1` | Backend / Python | NORMAL / CONFIG |
| **`DB_HOST`** | `1` | Backend / Python | NORMAL / CONFIG |
| **`DEFAULT_SOURCE`** | `1` | Backend / Python | NORMAL / CONFIG |
| **`EGX_API_KEY`** | `1` | Backend / Python | 🔴 CRITICAL SECRET |
| **`EGX_FEED_URL`** | `1` | Backend / Python | 🟡 SENSITIVE ENDPOINT |
| **`FROM_EMAIL`** | `1` | Frontend / Next.js | NORMAL / CONFIG |
| **`GITHUB_TOKEN`** | `1` | Backend / Python | 🔴 CRITICAL SECRET |
| **`JAEGER_ENDPOINT`** | `1` | Backend / Python | NORMAL / CONFIG |
| **`KARAPACE_URL`** | `1` | Backend / Python | 🟡 SENSITIVE ENDPOINT |
| **`KUBERNETES_API_SERVER`** | `1` | Backend / Python | NORMAL / CONFIG |
| **`KUBERNETES_OIDC_ISSUER`** | `1` | Backend / Python | NORMAL / CONFIG |
| **`LOG_LEVEL`** | `1` | Backend / Python | NORMAL / CONFIG |
| **`MINIO_ACCESS_KEY`** | `1` | Backend / Python | 🔴 CRITICAL SECRET |
| **`MINIO_ENDPOINT`** | `1` | Backend / Python | NORMAL / CONFIG |
| **`MINIO_SECRET_KEY`** | `1` | Backend / Python | 🔴 CRITICAL SECRET |
| **`NEXT_PUBLIC_APP_URL`** | `7` | CI/CD Workflows | 🟡 SENSITIVE ENDPOINT |
| **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** | `63` | Frontend / Next.js | 🔴 CRITICAL SECRET |
| **`NEXT_PUBLIC_SUPABASE_URL`** | `116` | CI/CD Workflows | 🟡 SENSITIVE ENDPOINT |
| **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`** | `1` | Frontend / Next.js | 🔴 CRITICAL SECRET |
| **`NODE_ENV`** | `8` | Frontend / Next.js | NORMAL / CONFIG |
| **`RESEND_API_KEY`** | `1` | Frontend / Next.js | 🔴 CRITICAL SECRET |
| **`SERVICE_NAME`** | `1` | Backend / Python | NORMAL / CONFIG |
| **`SERVICE_VERSION`** | `1` | Backend / Python | NORMAL / CONFIG |
| **`STRIPE_SECRET_KEY`** | `2` | Frontend / Next.js | 🔴 CRITICAL SECRET |
| **`STRIPE_WEBHOOK_SECRET`** | `1` | Frontend / Next.js | 🔴 CRITICAL SECRET |
| **`SUPABASE_ANON_KEY`** | `3` | CI/CD Workflows | 🔴 CRITICAL SECRET |
| **`SUPABASE_KEY`** | `69` | CI/CD Workflows | 🔴 CRITICAL SECRET |
| **`SUPABASE_SERVICE_ROLE_KEY`** | `138` | CI/CD Workflows | 🔴 CRITICAL SECRET |
| **`SUPABASE_URL`** | `94` | CI/CD Workflows | 🟡 SENSITIVE ENDPOINT |
| **`SUPABASE_WEBHOOK_SECRET`** | `1` | Backend / Python | 🔴 CRITICAL SECRET |
| **`TELEGRAM_BOT_TOKEN`** | `12` | CI/CD Workflows | 🔴 CRITICAL SECRET |
| **`TELEGRAM_CHANNEL_ID`** | `1` | Frontend / Next.js | NORMAL / CONFIG |
| **`TELEGRAM_CHAT_ID`** | `4` | CI/CD Workflows | NORMAL / CONFIG |
| **`TRADEORA_PLUGIN_CERT_PUBLIC_KEY`** | `1` | Backend / Python | 🔴 CRITICAL SECRET |
| **`TV_PASSWORD`** | `2` | CI/CD Workflows | 🔴 CRITICAL SECRET |
| **`TV_USERNAME`** | `2` | CI/CD Workflows | NORMAL / CONFIG |
| **`UNLEASH_ADMIN_TOKEN`** | `1` | Backend / Python | 🔴 CRITICAL SECRET |
| **`UPSTASH_REDIS_REST_TOKEN`** | `2` | Frontend / Next.js | 🔴 CRITICAL SECRET |
| **`UPSTASH_REDIS_REST_URL`** | `2` | Frontend / Next.js | 🟡 SENSITIVE ENDPOINT |
| **`USE_NLP_SENTIMENT`** | `1` | Backend / Python | NORMAL / CONFIG |
| **`VALKEY_URL`** | `1` | Backend / Python | 🔴 CRITICAL SECRET |
| **`VAPID_EMAIL`** | `4` | Frontend / Next.js | NORMAL / CONFIG |
| **`VAPID_PRIVATE_KEY`** | `4` | Frontend / Next.js | 🔴 CRITICAL SECRET |
| **`VAPID_PUBLIC_KEY`** | `4` | Frontend / Next.js | 🔴 CRITICAL SECRET |
| **`VERCEL_APP_URL`** | `2` | CI/CD Workflows | 🟡 SENSITIVE ENDPOINT |
| **`WHATSAPP_TOKEN`** | `1` | Frontend / Next.js | 🔴 CRITICAL SECRET |
| **`d`** | `1` | Frontend / Next.js | NORMAL / CONFIG |
| **`get`** | `1` | Backend / Python | NORMAL / CONFIG |
| **`randbelow`** | `1` | Backend / Python | NORMAL / CONFIG |
| **`token_bytes`** | `2` | Backend / Python | 🔴 CRITICAL SECRET |

---
## 2. Detailed File & Line Inventory of Environment Variables

### 🔑 Variable: `CI_API_KEY` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/AI_PERFORMANCE_SLA_ARCHITECTURE.md` | 771 | `GitHub Actions secrets` |

### 🔑 Variable: `COCKROACHDB_URL` (5 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `cockroach_sync.py` | 39 | `Python os.getenv` |
| `.github/workflows/cockroach-sync.yml` | 44 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 45 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 63 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 64 | `GitHub Actions secrets` |

### 🔑 Variable: `COCKROACH_DB_URL` (5 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `cockroach_sync.py` | 39 | `Python os.getenv` |
| `.github/workflows/cockroach-sync.yml` | 44 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 45 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 63 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 64 | `GitHub Actions secrets` |

### 🔑 Variable: `CRON_SECRET` (10 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `.github/workflows/session-crons.yml` | 48 | `GitHub Actions secrets` |
| `.github/workflows/session-crons.yml` | 58 | `GitHub Actions secrets` |
| `tradeora-web/app/api/cron/intraday-analysis/route.ts` | 18 | `Node process.env` |
| `tradeora-web/app/api/cron/prune-snapshots/route.ts` | 8 | `Node process.env` |
| `tradeora-web/app/api/cron/signal-monitor/route.ts` | 60 | `Node process.env` |
| `tradeora-web/app/api/cron/sync-intraday/route.ts` | 92 | `Node process.env` |
| `tradeora-web/app/api/cron/sync-investor-flows/route.ts` | 24 | `Node process.env` |
| `tradeora-web/app/api/cron/sync-prices/route.ts` | 47 | `Node process.env` |
| `tradeora-web/app/api/cron/sync-shariah/route.ts` | 25 | `Node process.env` |
| `tradeora-web/app/api/cron/track-recommended-trades/route.ts` | 211 | `Node process.env` |

### 🔑 Variable: `DATABASE_URL` (21 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `cockroach_sync.py` | 39 | `Python os.getenv` |
| `egx_intraday_flows.py` | 498 | `Python os.getenv` |
| `inspect_table_columns.py` | 5 | `Python os.getenv` |
| `SECURITY_EMERGENCY_00_1C.md` | 23 | `Node process.env` |
| `seed_all_missing_data.py` | 14 | `Python os.getenv` |
| `train_model_v6.py` | 35 | `Python os.getenv` |
| `.github/workflows/cockroach-sync.yml` | 44 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 45 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 63 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 64 | `GitHub Actions secrets` |
| `services/market_breadth_engine.py` | 28 | `Python os.getenv` |
| `services/orderbook_service.py` | 27 | `Python os.getenv` |
| `services/seasonality_engine.py` | 27 | `Python os.getenv` |
| `services/volume_profile_engine.py` | 184 | `Python os.getenv` |
| `tradeora-web/add_foreign_ownership_col.js` | 3 | `Node process.env` |
| `tradeora-web/add_vercel_envs.js` | 9 | `Node process.env` |
| `tradeora-web/check-active-models.js` | 3 | `Node process.env` |
| `tradeora-web/check-today-prices.js` | 3 | `Node process.env` |
| `tradeora-web/check_fundamentals_cols.js` | 3 | `Node process.env` |
| `tradeora-web/migrate-intraday-snapshots.js` | 6 | `Node process.env` |
| `tradeora-web/lib/db.ts` | 3 | `Node process.env` |

### 🔑 Variable: `DATA_FOLDER` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `config/settings.py` | 18 | `Python os.getenv` |

### 🔑 Variable: `DB_HOST` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/MULTI_TENANCY_ARCHITECTURE.md` | 199 | `Node process.env` |

### 🔑 Variable: `DEFAULT_SOURCE` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `config/settings.py` | 19 | `Python os.getenv` |

### 🔑 Variable: `EGX_API_KEY` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/PLUGIN_ARCHITECTURE.md` | 849 | `Python os.environ[]` |

### 🔑 Variable: `EGX_FEED_URL` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/PLUGIN_ARCHITECTURE.md` | 848 | `Python os.environ[]` |

### 🔑 Variable: `FROM_EMAIL` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `tradeora-web/lib/email.ts` | 54 | `Node process.env` |

### 🔑 Variable: `GITHUB_TOKEN` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/TECHNICAL_DEBT_GOVERNANCE.md` | 517 | `Python os.environ[]` |

### 🔑 Variable: `JAEGER_ENDPOINT` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/ENTERPRISE_METRICS_FRAMEWORK.md` | 839 | `Node process.env` |

### 🔑 Variable: `KARAPACE_URL` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/ARCHITECTURE_DECISION_RECORDS_v1_1.md` | 417 | `Node process.env` |

### 🔑 Variable: `KUBERNETES_API_SERVER` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/ARCHITECTURE_DECISION_RECORDS_v1_1.md` | 767 | `Node process.env` |

### 🔑 Variable: `KUBERNETES_OIDC_ISSUER` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/ARCHITECTURE_DECISION_RECORDS_v1_1.md` | 778 | `Node process.env` |

### 🔑 Variable: `LOG_LEVEL` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `config/settings.py` | 17 | `Python os.getenv` |

### 🔑 Variable: `MINIO_ACCESS_KEY` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/BLUEPRINT_KYC_COMPLIANCE_FLOW.md` | 441 | `Python os.getenv` |

### 🔑 Variable: `MINIO_ENDPOINT` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/BLUEPRINT_KYC_COMPLIANCE_FLOW.md` | 440 | `Python os.getenv` |

### 🔑 Variable: `MINIO_SECRET_KEY` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/BLUEPRINT_KYC_COMPLIANCE_FLOW.md` | 442 | `Python os.getenv` |

### 🔑 Variable: `NEXT_PUBLIC_APP_URL` (7 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `track_trades.py` | 36 | `Python os.getenv` |
| `.github/workflows/track_trades_schedule.yml` | 38 | `GitHub Actions secrets` |
| `tradeora-web/app/api/cron/track-trades/route.ts` | 160 | `Node process.env` |
| `tradeora-web/app/api/daily-report/route.ts` | 128 | `Node process.env` |
| `tradeora-web/app/api/stripe/checkout/route.ts` | 23 | `Node process.env` |
| `tradeora-web/app/api/stripe/checkout/route.ts` | 24 | `Node process.env` |
| `tradeora-web/lib/email.ts` | 109 | `Node process.env` |

### 🔑 Variable: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (63 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `apply_critical_fixes.py` | 15 | `Python os.getenv` |
| `backfill_investor_flows.py` | 17 | `Python os.getenv` |
| `backtest_engine.py` | 35 | `Python os.getenv` |
| `backtest_signals.py` | 13 | `Python os.getenv` |
| `check_data_and_seed.py` | 7 | `Python os.getenv` |
| `check_flow_tables.py` | 8 | `Python os.getenv` |
| `check_market_sources.py` | 8 | `Python os.getenv` |
| `egx_flow_scraper.py` | 37 | `Python os.getenv` |
| `egx_intraday_flows.py` | 39 | `Python os.getenv` |
| `egx_pdf_watcher.py` | 41 | `Python os.getenv` |
| `foreign_flow_analyzer.py` | 40 | `Python os.getenv` |
| `generate_daily_recommendations.py` | 40 | `Python os.getenv` |
| `generate_intraday_recommendations.py` | 35 | `Python os.getenv` |
| `intraday_collector.py` | 43 | `Python os.environ.get` |
| `performance_analytics.py` | 32 | `Python os.getenv` |
| `platform_db_audit.py` | 11 | `Python os.getenv` |
| `predict.py` | 19 | `Python os.getenv` |
| `scratch_check_all_stock_candles.py` | 7 | `Python os.getenv` |
| `scratch_fast_audit_candles.py` | 7 | `Python os.getenv` |
| `seed_all_missing_data.py` | 11 | `Python os.getenv` |
| `track_trades.py` | 28 | `Python os.getenv` |
| `trade_monitor.py` | 33 | `Python os.getenv` |
| `train_model.py` | 22 | `Python os.getenv` |
| `train_model_intraday_v2.py` | 26 | `Python os.getenv` |
| `train_model_v2.py` | 24 | `Python os.getenv` |
| `train_model_v3.py` | 46 | `Python os.getenv` |
| `train_model_v4.py` | 38 | `Python os.getenv` |
| `train_model_v5.py` | 37 | `Python os.getenv` |
| `train_model_v6.py` | 32 | `Python os.getenv` |
| `tv_backfill.py` | 24 | `Python os.getenv` |
| `validate_backtest.py` | 26 | `Python os.getenv` |
| `yf_backfill.py` | 43 | `Python os.getenv` |
| `config/settings.py` | 13 | `Python os.getenv` |
| `scrapers/almal_news_scraper.py` | 28 | `Python os.getenv` |
| `scrapers/egx_disclosures_insider_scraper.py` | 31 | `Python os.getenv` |
| `scripts/export_historical_intraday.py` | 13 | `Python os.getenv` |
| `scripts/golden_candle_audit.py` | 90 | `Python os.getenv` |
| `scripts/signal_vs_chart_audit.py` | 66 | `Python os.getenv` |
| `scripts/source_unification_test.py` | 18 | `Python os.getenv` |
| `services/exit_engine.py` | 300 | `Python os.getenv` |
| `services/sync_fundamentals.py` | 21 | `Python os.environ.get` |
| `services/volume_profile_engine.py` | 30 | `Python os.getenv` |
| `tradeora-web/proxy.ts` | 113 | `Node process.env` |
| `tradeora-web/app/api/alerts/route.ts` | 18 | `Node process.env` |
| `tradeora-web/app/api/canonical-price/route.ts` | 43 | `Node process.env` |
| `tradeora-web/app/api/cron/intraday-analysis/route.ts` | 10 | `Node process.env` |
| `tradeora-web/app/api/cron/signal-monitor/route.ts` | 20 | `Node process.env` |
| `tradeora-web/app/api/cron/sync-intraday/route.ts` | 18 | `Node process.env` |
| `tradeora-web/app/api/cron/sync-investor-flows/route.ts` | 9 | `Node process.env` |
| `tradeora-web/app/api/cron/sync-shariah/route.ts` | 10 | `Node process.env` |
| `tradeora-web/app/api/cron/track-recommended-trades/route.ts` | 10 | `Node process.env` |
| `tradeora-web/app/api/egx33/route.ts` | 45 | `Node process.env` |
| `tradeora-web/app/api/intraday/route.ts` | 10 | `Node process.env` |
| `tradeora-web/app/api/investor-flows/route.ts` | 18 | `Node process.env` |
| `tradeora-web/app/api/screener/route.ts` | 10 | `Node process.env` |
| `tradeora-web/app/api/user-trades/route.ts` | 11 | `Node process.env` |
| `tradeora-web/app/api/user-trades/route.ts` | 113 | `Node process.env` |
| `tradeora-web/app/api/user-trades/[id]/route.ts` | 15 | `Node process.env` |
| `tradeora-web/app/[locale]/auth/page.tsx` | 22 | `Node process.env` |
| `tradeora-web/components/layout/Navbar.tsx` | 51 | `Node process.env` |
| `tradeora-web/lib/postgres-client.ts` | 10 | `Node process.env` |
| `tradeora-web/lib/supabase.ts` | 10 | `Node process.env` |
| `tradeora-web/lib/useUserRole.ts` | 9 | `Node process.env` |

### 🔑 Variable: `NEXT_PUBLIC_SUPABASE_URL` (116 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `apply_critical_fixes.py` | 14 | `Python os.getenv` |
| `auto_scrape_egx_live_flows.py` | 14 | `Python os.getenv` |
| `backfill_all_tv_15m.py` | 13 | `Python os.getenv` |
| `backfill_investor_flows.py` | 16 | `Python os.getenv` |
| `backtest_engine.py` | 34 | `Python os.getenv` |
| `backtest_signals.py` | 12 | `Python os.getenv` |
| `check_data_and_seed.py` | 6 | `Python os.getenv` |
| `check_flow_tables.py` | 7 | `Python os.getenv` |
| `check_market_sources.py` | 7 | `Python os.getenv` |
| `check_model_trades.py` | 4 | `Python os.getenv` |
| `clean_old_trades.py` | 4 | `Python os.getenv` |
| `cockroach_sync.py` | 28 | `Python os.getenv` |
| `debug_trades.py` | 4 | `Python os.getenv` |
| `egx_flow_scraper.py` | 36 | `Python os.getenv` |
| `egx_intraday_flows.py` | 38 | `Python os.getenv` |
| `egx_pdf_watcher.py` | 40 | `Python os.getenv` |
| `fill_intraday_history.py` | 13 | `Python os.getenv` |
| `foreign_flow_analyzer.py` | 39 | `Python os.getenv` |
| `generate_daily_recommendations.py` | 39 | `Python os.getenv` |
| `generate_intraday_recommendations.py` | 34 | `Python os.getenv` |
| `generate_v6_signals.py` | 4 | `Python os.getenv` |
| `inspect_closed.py` | 4 | `Python os.getenv` |
| `inspect_flow_columns.py` | 4 | `Python os.getenv` |
| `inspect_v6_details.py` | 4 | `Python os.getenv` |
| `inspect_v6_trades.py` | 4 | `Python os.getenv` |
| `intraday_collector.py` | 42 | `Python os.environ.get` |
| `performance_analytics.py` | 31 | `Python os.getenv` |
| `platform_db_audit.py` | 10 | `Python os.getenv` |
| `predict.py` | 18 | `Python os.getenv` |
| `scratch_check_all_stock_candles.py` | 6 | `Python os.getenv` |
| `scratch_fast_audit_candles.py` | 6 | `Python os.getenv` |
| `seed_all_missing_data.py` | 10 | `Python os.getenv` |
| `seed_comprehensive_data.py` | 11 | `Python os.getenv` |
| `seed_egx_screenshot_flows.py` | 4 | `Python os.getenv` |
| `seed_events.py` | 4 | `Python os.getenv` |
| `seed_full_dual_tier_signals.py` | 4 | `Python os.getenv` |
| `seed_live_egx_official_flows.py` | 4 | `Python os.getenv` |
| `seed_official_egx_news.py` | 4 | `Python os.getenv` |
| `seed_tight_v6_signals.py` | 4 | `Python os.getenv` |
| `signal_guardian.py` | 37 | `Python os.getenv` |
| `sync_live_egx_prices.py` | 4 | `Python os.getenv` |
| `test_api_trades.py` | 4 | `Python os.getenv` |
| `test_categories.py` | 4 | `Python os.getenv` |
| `test_market_movers.py` | 4 | `Python os.getenv` |
| `track_trades.py` | 27 | `Python os.getenv` |
| `trade_monitor.py` | 32 | `Python os.getenv` |
| `train_model.py` | 21 | `Python os.getenv` |
| `train_model_intraday_v2.py` | 25 | `Python os.getenv` |
| `train_model_v2.py` | 23 | `Python os.getenv` |
| `train_model_v3.py` | 45 | `Python os.getenv` |
| `train_model_v4.py` | 37 | `Python os.getenv` |
| `train_model_v5.py` | 36 | `Python os.getenv` |
| `train_model_v6.py` | 31 | `Python os.getenv` |
| `train_model_weekly_v2.py` | 29 | `Python os.getenv` |
| `tv_backfill.py` | 23 | `Python os.getenv` |
| `validate_backtest.py` | 25 | `Python os.getenv` |
| `verify_data.py` | 4 | `Python os.getenv` |
| `wipe_recommended_trades.py` | 4 | `Python os.getenv` |
| `yf_backfill.py` | 42 | `Python os.getenv` |
| `.github/workflows/cockroach-sync.yml` | 40 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 41 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 59 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 60 | `GitHub Actions secrets` |
| `.github/workflows/daily_news_intelligence.yml` | 39 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 29 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 38 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 47 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 56 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 66 | `GitHub Actions secrets` |
| `.github/workflows/intraday_prices_schedule.yml` | 45 | `GitHub Actions secrets` |
| `.github/workflows/intraday_prices_schedule.yml` | 54 | `GitHub Actions secrets` |
| `.github/workflows/intraday_prices_schedule.yml` | 62 | `Python os.environ.get` |
| `.github/workflows/track_trades_schedule.yml` | 34 | `GitHub Actions secrets` |
| `.github/workflows/track_trades_schedule.yml` | 37 | `GitHub Actions secrets` |
| `config/settings.py` | 12 | `Python os.getenv` |
| `scrapers/almal_news_scraper.py` | 27 | `Python os.getenv` |
| `scrapers/egx_disclosures_insider_scraper.py` | 30 | `Python os.getenv` |
| `scripts/close_stale_signals.py` | 21 | `Python os.getenv` |
| `scripts/export_historical_intraday.py` | 13 | `Python os.getenv` |
| `scripts/golden_candle_audit.py` | 85 | `Python os.getenv` |
| `scripts/signal_vs_chart_audit.py` | 62 | `Python os.getenv` |
| `scripts/simulate_sl_multi_scenario.py` | 12 | `Python os.getenv` |
| `scripts/simulate_sl_strategies.py` | 12 | `Python os.getenv` |
| `scripts/source_unification_test.py` | 17 | `Python os.getenv` |
| `services/daily_report_service.py` | 17 | `Python os.getenv` |
| `services/exit_engine.py` | 299 | `Python os.getenv` |
| `services/fundamentals_importer.py` | 23 | `Python os.getenv` |
| `services/long_term_investor_service.py` | 22 | `Python os.getenv` |
| `services/news_intelligence_service.py` | 20 | `Python os.getenv` |
| `services/shariah_live_fetcher.py` | 121 | `Python os.environ.get` |
| `services/sync_fundamentals.py` | 20 | `Python os.environ.get` |
| `services/volume_profile_engine.py` | 29 | `Python os.getenv` |
| `tradeora-web/migrate-intraday-snapshots.js` | 4 | `Node process.env` |
| `tradeora-web/proxy.ts` | 112 | `Node process.env` |
| `tradeora-web/app/api/alerts/route.ts` | 17 | `Node process.env` |
| `tradeora-web/app/api/canonical-price/route.ts` | 42 | `Node process.env` |
| `tradeora-web/app/api/cron/intraday-analysis/route.ts` | 9 | `Node process.env` |
| `tradeora-web/app/api/cron/signal-monitor/route.ts` | 19 | `Node process.env` |
| `tradeora-web/app/api/cron/sync-intraday/route.ts` | 17 | `Node process.env` |
| `tradeora-web/app/api/cron/sync-investor-flows/route.ts` | 8 | `Node process.env` |
| `tradeora-web/app/api/cron/sync-prices/route.ts` | 8 | `Node process.env` |
| `tradeora-web/app/api/cron/sync-shariah/route.ts` | 9 | `Node process.env` |
| `tradeora-web/app/api/cron/track-recommended-trades/route.ts` | 9 | `Node process.env` |
| `tradeora-web/app/api/egx33/route.ts` | 44 | `Node process.env` |
| `tradeora-web/app/api/intraday/route.ts` | 9 | `Node process.env` |
| `tradeora-web/app/api/investor-flows/route.ts` | 17 | `Node process.env` |
| `tradeora-web/app/api/referral/use/route.ts` | 8 | `Node process.env` |
| `tradeora-web/app/api/screener/route.ts` | 9 | `Node process.env` |
| `tradeora-web/app/api/user-trades/route.ts` | 10 | `Node process.env` |
| `tradeora-web/app/api/user-trades/route.ts` | 112 | `Node process.env` |
| `tradeora-web/app/api/user-trades/[id]/route.ts` | 14 | `Node process.env` |
| `tradeora-web/app/[locale]/auth/page.tsx` | 21 | `Node process.env` |
| `tradeora-web/components/layout/Navbar.tsx` | 50 | `Node process.env` |
| `tradeora-web/lib/postgres-client.ts` | 9 | `Node process.env` |
| `tradeora-web/lib/supabase.ts` | 9 | `Node process.env` |
| `tradeora-web/lib/useUserRole.ts` | 8 | `Node process.env` |

### 🔑 Variable: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `tradeora-web/lib/usePushNotifications.ts` | 40 | `Node process.env` |

### 🔑 Variable: `NODE_ENV` (8 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/ENTERPRISE_METRICS_FRAMEWORK.md` | 202 | `Node process.env` |
| `copy/docs/ENTERPRISE_METRICS_FRAMEWORK.md` | 233 | `Node process.env` |
| `copy/docs/ENTERPRISE_METRICS_FRAMEWORK.md` | 828 | `Node process.env` |
| `copy/docs/TECHNICAL_DEBT_GOVERNANCE.md` | 70 | `Node process.env` |
| `docs/01_EGX_COMPREHENSIVE_AUDIT.md` | 521 | `Node process.env` |
| `docs/02_EGX_CURRENT_ARCHITECTURE.md` | 347 | `Node process.env` |
| `tradeora-web/lib/db.ts` | 10 | `Node process.env` |
| `tradeora-web/lib/live-price-store.ts` | 69 | `Node process.env` |

### 🔑 Variable: `RESEND_API_KEY` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `tradeora-web/lib/email.ts` | 4 | `Node process.env` |

### 🔑 Variable: `SERVICE_NAME` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/ARCHITECTURE_SPECIFICATION_PATCHES.md` | 149 | `Node process.env` |

### 🔑 Variable: `SERVICE_VERSION` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/ENTERPRISE_METRICS_FRAMEWORK.md` | 826 | `Node process.env` |

### 🔑 Variable: `STRIPE_SECRET_KEY` (2 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `tradeora-web/app/api/stripe/checkout/route.ts` | 8 | `Node process.env` |
| `tradeora-web/app/api/stripe/webhook/route.ts` | 8 | `Node process.env` |

### 🔑 Variable: `STRIPE_WEBHOOK_SECRET` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `tradeora-web/app/api/stripe/webhook/route.ts` | 20 | `Node process.env` |

### 🔑 Variable: `SUPABASE_ANON_KEY` (3 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `.github/workflows/daily-recommendations.yml` | 50 | `GitHub Actions secrets` |
| `tradeora-web/lib/postgres-client.ts` | 10 | `Node process.env` |
| `tradeora-web/lib/supabase.ts` | 10 | `Node process.env` |

### 🔑 Variable: `SUPABASE_KEY` (69 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `backfill_all_tv_15m.py` | 14 | `Python os.getenv` |
| `backfill_historical.py` | 18 | `Python os.getenv` |
| `backtest_signals.py` | 13 | `Python os.getenv` |
| `cockroach_sync.py` | 29 | `Python os.getenv` |
| `fill_intraday_history.py` | 14 | `Python os.getenv` |
| `generate_daily_recommendations.py` | 40 | `Python os.getenv` |
| `generate_intraday_recommendations.py` | 35 | `Python os.getenv` |
| `intraday_collector.py` | 43 | `Python os.environ.get` |
| `performance_analytics.py` | 32 | `Python os.getenv` |
| `predict.py` | 19 | `Python os.getenv` |
| `scratch_check_all_stock_candles.py` | 7 | `Python os.getenv` |
| `scratch_fast_audit_candles.py` | 7 | `Python os.getenv` |
| `signal_guardian.py` | 38 | `Python os.getenv` |
| `test_historical.py` | 8 | `Python os.getenv` |
| `track_trades.py` | 28 | `Python os.getenv` |
| `train_model.py` | 22 | `Python os.getenv` |
| `train_model_intraday_v2.py` | 26 | `Python os.getenv` |
| `train_model_v2.py` | 24 | `Python os.getenv` |
| `train_model_v3.py` | 46 | `Python os.getenv` |
| `train_model_weekly_v2.py` | 30 | `Python os.getenv` |
| `tv_backfill.py` | 24 | `Python os.getenv` |
| `validate_backtest.py` | 21 | `Python os.getenv` |
| `yf_backfill.py` | 43 | `Python os.getenv` |
| `.github/workflows/cockroach-sync.yml` | 42 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 43 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 61 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 62 | `GitHub Actions secrets` |
| `.github/workflows/daily_news_intelligence.yml` | 40 | `GitHub Actions secrets` |
| `.github/workflows/daily_news_intelligence.yml` | 41 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 30 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 31 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 39 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 40 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 48 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 49 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 57 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 58 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 67 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 68 | `GitHub Actions secrets` |
| `.github/workflows/intraday_prices_schedule.yml` | 46 | `GitHub Actions secrets` |
| `.github/workflows/intraday_prices_schedule.yml` | 47 | `GitHub Actions secrets` |
| `.github/workflows/intraday_prices_schedule.yml` | 55 | `GitHub Actions secrets` |
| `.github/workflows/intraday_prices_schedule.yml` | 56 | `GitHub Actions secrets` |
| `.github/workflows/intraday_prices_schedule.yml` | 63 | `Python os.environ.get` |
| `.github/workflows/intraday_signals.yml` | 44 | `GitHub Actions secrets` |
| `.github/workflows/intraday_signals.yml` | 54 | `GitHub Actions secrets` |
| `.github/workflows/track_trades_schedule.yml` | 35 | `GitHub Actions secrets` |
| `.github/workflows/track_trades_schedule.yml` | 36 | `GitHub Actions secrets` |
| `.github/workflows/weekly_backtest.yml` | 40 | `GitHub Actions secrets` |
| `.github/workflows/weekly_backtest.yml` | 48 | `GitHub Actions secrets` |
| `.github/workflows/weekly_backtest.yml` | 56 | `GitHub Actions secrets` |
| `.github/workflows/weekly_backtest.yml` | 64 | `GitHub Actions secrets` |
| `.github/workflows/weekly_backtest.yml` | 72 | `GitHub Actions secrets` |
| `.github/workflows/weekly_fundamentals_sync.yml` | 31 | `GitHub Actions secrets` |
| `.github/workflows/weekly_performance_analytics.yml` | 35 | `GitHub Actions secrets` |
| `.github/workflows/weekly_shariah_review.yml` | 30 | `GitHub Actions secrets` |
| `config/settings.py` | 13 | `Python os.getenv` |
| `scrapers/almal_news_scraper.py` | 28 | `Python os.getenv` |
| `scrapers/egx_disclosures_insider_scraper.py` | 31 | `Python os.getenv` |
| `scripts/close_stale_signals.py` | 22 | `Python os.getenv` |
| `scripts/golden_candle_audit.py` | 89 | `Python os.getenv` |
| `scripts/signal_vs_chart_audit.py` | 65 | `Python os.getenv` |
| `scripts/source_unification_test.py` | 18 | `Python os.getenv` |
| `scripts/validate_data.py` | 9 | `Python os.environ.get` |
| `services/daily_report_service.py` | 18 | `Python os.getenv` |
| `services/fundamentals_importer.py` | 24 | `Python os.getenv` |
| `services/long_term_investor_service.py` | 23 | `Python os.getenv` |
| `services/news_intelligence_service.py` | 21 | `Python os.getenv` |
| `services/volume_profile_engine.py` | 30 | `Python os.getenv` |

### 🔑 Variable: `SUPABASE_SERVICE_ROLE_KEY` (138 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `apply_critical_fixes.py` | 15 | `Python os.getenv` |
| `apply_critical_fixes.py` | 22 | `Python os.getenv` |
| `auto_scrape_egx_live_flows.py` | 15 | `Python os.getenv` |
| `backfill_all_tv_15m.py` | 14 | `Python os.getenv` |
| `backfill_investor_flows.py` | 17 | `Python os.getenv` |
| `backtest_engine.py` | 35 | `Python os.getenv` |
| `backtest_signals.py` | 13 | `Python os.getenv` |
| `check_data_and_seed.py` | 7 | `Python os.getenv` |
| `check_flow_tables.py` | 8 | `Python os.getenv` |
| `check_market_sources.py` | 8 | `Python os.getenv` |
| `check_model_trades.py` | 4 | `Python os.getenv` |
| `clean_old_trades.py` | 4 | `Python os.getenv` |
| `cockroach_sync.py` | 29 | `Python os.getenv` |
| `debug_trades.py` | 4 | `Python os.getenv` |
| `egx_flow_scraper.py` | 37 | `Python os.getenv` |
| `egx_intraday_flows.py` | 39 | `Python os.getenv` |
| `egx_pdf_watcher.py` | 41 | `Python os.getenv` |
| `fill_intraday_history.py` | 14 | `Python os.getenv` |
| `foreign_flow_analyzer.py` | 40 | `Python os.getenv` |
| `generate_daily_recommendations.py` | 40 | `Python os.getenv` |
| `generate_intraday_recommendations.py` | 35 | `Python os.getenv` |
| `generate_v6_signals.py` | 5 | `Python os.getenv` |
| `inspect_closed.py` | 4 | `Python os.getenv` |
| `inspect_flow_columns.py` | 4 | `Python os.getenv` |
| `inspect_v6_details.py` | 4 | `Python os.getenv` |
| `inspect_v6_trades.py` | 4 | `Python os.getenv` |
| `intraday_collector.py` | 43 | `Python os.environ.get` |
| `performance_analytics.py` | 32 | `Python os.getenv` |
| `platform_db_audit.py` | 11 | `Python os.getenv` |
| `predict.py` | 19 | `Python os.getenv` |
| `scratch_check_all_stock_candles.py` | 7 | `Python os.getenv` |
| `scratch_fast_audit_candles.py` | 7 | `Python os.getenv` |
| `SECURITY_EMERGENCY_00_1C.md` | 23 | `Node process.env` |
| `seed_all_missing_data.py` | 11 | `Python os.getenv` |
| `seed_comprehensive_data.py` | 12 | `Python os.getenv` |
| `seed_egx_screenshot_flows.py` | 5 | `Python os.getenv` |
| `seed_events.py` | 4 | `Python os.getenv` |
| `seed_full_dual_tier_signals.py` | 5 | `Python os.getenv` |
| `seed_live_egx_official_flows.py` | 5 | `Python os.getenv` |
| `seed_official_egx_news.py` | 5 | `Python os.getenv` |
| `seed_tight_v6_signals.py` | 5 | `Python os.getenv` |
| `signal_guardian.py` | 38 | `Python os.getenv` |
| `sync_live_egx_prices.py` | 5 | `Python os.getenv` |
| `test_api_trades.py` | 4 | `Python os.getenv` |
| `test_categories.py` | 4 | `Python os.getenv` |
| `test_market_movers.py` | 4 | `Python os.getenv` |
| `track_trades.py` | 28 | `Python os.getenv` |
| `trade_monitor.py` | 33 | `Python os.getenv` |
| `train_model.py` | 22 | `Python os.getenv` |
| `train_model_intraday_v2.py` | 26 | `Python os.getenv` |
| `train_model_v2.py` | 24 | `Python os.getenv` |
| `train_model_v3.py` | 46 | `Python os.getenv` |
| `train_model_v4.py` | 38 | `Python os.getenv` |
| `train_model_v5.py` | 37 | `Python os.getenv` |
| `train_model_v6.py` | 32 | `Python os.getenv` |
| `train_model_weekly_v2.py` | 30 | `Python os.getenv` |
| `tv_backfill.py` | 24 | `Python os.getenv` |
| `validate_backtest.py` | 26 | `Python os.getenv` |
| `verify_data.py` | 4 | `Python os.getenv` |
| `wipe_recommended_trades.py` | 4 | `Python os.getenv` |
| `yf_backfill.py` | 43 | `Python os.getenv` |
| `.github/workflows/cockroach-sync.yml` | 42 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 43 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 61 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 62 | `GitHub Actions secrets` |
| `.github/workflows/daily-backfill.yml` | 54 | `GitHub Actions secrets` |
| `.github/workflows/daily-recommendations.yml` | 48 | `GitHub Actions secrets` |
| `.github/workflows/daily_news_intelligence.yml` | 40 | `GitHub Actions secrets` |
| `.github/workflows/daily_news_intelligence.yml` | 41 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 30 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 31 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 39 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 40 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 48 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 49 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 57 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 58 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 67 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 68 | `GitHub Actions secrets` |
| `.github/workflows/egx-investor-flows.yml` | 110 | `GitHub Actions secrets` |
| `.github/workflows/egx-investor-flows.yml` | 130 | `GitHub Actions secrets` |
| `.github/workflows/intraday_prices_schedule.yml` | 46 | `GitHub Actions secrets` |
| `.github/workflows/intraday_prices_schedule.yml` | 47 | `GitHub Actions secrets` |
| `.github/workflows/intraday_prices_schedule.yml` | 55 | `GitHub Actions secrets` |
| `.github/workflows/intraday_prices_schedule.yml` | 56 | `GitHub Actions secrets` |
| `.github/workflows/intraday_prices_schedule.yml` | 63 | `Python os.environ.get` |
| `.github/workflows/intraday_signals.yml` | 45 | `GitHub Actions secrets` |
| `.github/workflows/intraday_signals.yml` | 55 | `GitHub Actions secrets` |
| `.github/workflows/live-session-candles.yml` | 39 | `GitHub Actions secrets` |
| `.github/workflows/live-session-candles.yml` | 40 | `GitHub Actions secrets` |
| `.github/workflows/track_trades_schedule.yml` | 35 | `GitHub Actions secrets` |
| `.github/workflows/track_trades_schedule.yml` | 36 | `GitHub Actions secrets` |
| `.github/workflows/trade-monitor.yml` | 72 | `GitHub Actions secrets` |
| `.github/workflows/weekly_backtest.yml` | 41 | `GitHub Actions secrets` |
| `.github/workflows/weekly_backtest.yml` | 49 | `GitHub Actions secrets` |
| `.github/workflows/weekly_backtest.yml` | 57 | `GitHub Actions secrets` |
| `.github/workflows/weekly_backtest.yml` | 65 | `GitHub Actions secrets` |
| `.github/workflows/weekly_backtest.yml` | 73 | `GitHub Actions secrets` |
| `.github/workflows/weekly_fundamentals_sync.yml` | 32 | `GitHub Actions secrets` |
| `config/settings.py` | 13 | `Python os.getenv` |
| `scrapers/almal_news_scraper.py` | 28 | `Python os.getenv` |
| `scrapers/egx_disclosures_insider_scraper.py` | 31 | `Python os.getenv` |
| `scripts/close_stale_signals.py` | 22 | `Python os.getenv` |
| `scripts/golden_candle_audit.py` | 88 | `Python os.getenv` |
| `scripts/signal_vs_chart_audit.py` | 64 | `Python os.getenv` |
| `scripts/simulate_sl_multi_scenario.py` | 12 | `Python os.getenv` |
| `scripts/simulate_sl_strategies.py` | 12 | `Python os.getenv` |
| `scripts/source_unification_test.py` | 18 | `Python os.getenv` |
| `scripts/validate_data.py` | 8 | `Python os.environ.get` |
| `services/daily_report_service.py` | 18 | `Python os.getenv` |
| `services/exit_engine.py` | 300 | `Python os.getenv` |
| `services/fundamentals_importer.py` | 24 | `Python os.getenv` |
| `services/long_term_investor_service.py` | 23 | `Python os.getenv` |
| `services/news_intelligence_service.py` | 21 | `Python os.getenv` |
| `services/shariah_live_fetcher.py` | 122 | `Python os.environ.get` |
| `services/sync_fundamentals.py` | 21 | `Python os.environ.get` |
| `services/volume_profile_engine.py` | 30 | `Python os.getenv` |
| `tradeora-web/add_vercel_envs.js` | 5 | `Node process.env` |
| `tradeora-web/add_vercel_envs.js` | 6 | `Node process.env` |
| `tradeora-web/add_vercel_envs.js` | 8 | `Node process.env` |
| `tradeora-web/migrate-intraday-snapshots.js` | 5 | `Node process.env` |
| `tradeora-web/app/api/alerts/route.ts` | 18 | `Node process.env` |
| `tradeora-web/app/api/canonical-price/route.ts` | 43 | `Node process.env` |
| `tradeora-web/app/api/cron/intraday-analysis/route.ts` | 10 | `Node process.env` |
| `tradeora-web/app/api/cron/signal-monitor/route.ts` | 20 | `Node process.env` |
| `tradeora-web/app/api/cron/sync-intraday/route.ts` | 18 | `Node process.env` |
| `tradeora-web/app/api/cron/sync-investor-flows/route.ts` | 9 | `Node process.env` |
| `tradeora-web/app/api/cron/sync-prices/route.ts` | 9 | `Node process.env` |
| `tradeora-web/app/api/cron/sync-shariah/route.ts` | 10 | `Node process.env` |
| `tradeora-web/app/api/cron/track-recommended-trades/route.ts` | 10 | `Node process.env` |
| `tradeora-web/app/api/cron/track-trades/route.ts` | 8 | `Node process.env` |
| `tradeora-web/app/api/egx33/route.ts` | 45 | `Node process.env` |
| `tradeora-web/app/api/intraday/route.ts` | 10 | `Node process.env` |
| `tradeora-web/app/api/investor-flows/route.ts` | 18 | `Node process.env` |
| `tradeora-web/app/api/referral/use/route.ts` | 9 | `Node process.env` |
| `tradeora-web/app/api/screener/route.ts` | 10 | `Node process.env` |
| `tradeora-web/lib/postgres-client.ts` | 10 | `Node process.env` |
| `tradeora-web/lib/supabase.ts` | 10 | `Node process.env` |

### 🔑 Variable: `SUPABASE_URL` (94 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `apply_critical_fixes.py` | 14 | `Python os.getenv` |
| `backfill_all_tv_15m.py` | 13 | `Python os.getenv` |
| `backfill_historical.py` | 17 | `Python os.getenv` |
| `backfill_investor_flows.py` | 16 | `Python os.getenv` |
| `backtest_engine.py` | 34 | `Python os.getenv` |
| `backtest_signals.py` | 12 | `Python os.getenv` |
| `check_data_and_seed.py` | 6 | `Python os.getenv` |
| `check_flow_tables.py` | 7 | `Python os.getenv` |
| `check_market_sources.py` | 7 | `Python os.getenv` |
| `cockroach_sync.py` | 28 | `Python os.getenv` |
| `egx_flow_scraper.py` | 36 | `Python os.getenv` |
| `egx_intraday_flows.py` | 38 | `Python os.getenv` |
| `egx_pdf_watcher.py` | 40 | `Python os.getenv` |
| `fill_intraday_history.py` | 13 | `Python os.getenv` |
| `foreign_flow_analyzer.py` | 39 | `Python os.getenv` |
| `generate_daily_recommendations.py` | 39 | `Python os.getenv` |
| `generate_intraday_recommendations.py` | 34 | `Python os.getenv` |
| `intraday_collector.py` | 42 | `Python os.environ.get` |
| `performance_analytics.py` | 31 | `Python os.getenv` |
| `platform_db_audit.py` | 10 | `Python os.getenv` |
| `predict.py` | 18 | `Python os.getenv` |
| `scratch_check_all_stock_candles.py` | 6 | `Python os.getenv` |
| `scratch_fast_audit_candles.py` | 6 | `Python os.getenv` |
| `seed_all_missing_data.py` | 10 | `Python os.getenv` |
| `signal_guardian.py` | 37 | `Python os.getenv` |
| `test_historical.py` | 7 | `Python os.getenv` |
| `track_trades.py` | 27 | `Python os.getenv` |
| `trade_monitor.py` | 32 | `Python os.getenv` |
| `train_model.py` | 21 | `Python os.getenv` |
| `train_model_intraday_v2.py` | 25 | `Python os.getenv` |
| `train_model_v2.py` | 23 | `Python os.getenv` |
| `train_model_v3.py` | 45 | `Python os.getenv` |
| `train_model_v4.py` | 37 | `Python os.getenv` |
| `train_model_v5.py` | 36 | `Python os.getenv` |
| `train_model_v6.py` | 31 | `Python os.getenv` |
| `train_model_weekly_v2.py` | 29 | `Python os.getenv` |
| `tv_backfill.py` | 23 | `Python os.getenv` |
| `validate_backtest.py` | 20 | `Python os.getenv` |
| `yf_backfill.py` | 42 | `Python os.getenv` |
| `.github/workflows/cockroach-sync.yml` | 40 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 41 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 59 | `GitHub Actions secrets` |
| `.github/workflows/cockroach-sync.yml` | 60 | `GitHub Actions secrets` |
| `.github/workflows/daily-backfill.yml` | 53 | `GitHub Actions secrets` |
| `.github/workflows/daily-recommendations.yml` | 47 | `GitHub Actions secrets` |
| `.github/workflows/daily-recommendations.yml` | 49 | `GitHub Actions secrets` |
| `.github/workflows/daily_news_intelligence.yml` | 39 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 29 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 38 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 47 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 56 | `GitHub Actions secrets` |
| `.github/workflows/daily_update.yml` | 66 | `GitHub Actions secrets` |
| `.github/workflows/egx-investor-flows.yml` | 109 | `GitHub Actions secrets` |
| `.github/workflows/egx-investor-flows.yml` | 111 | `GitHub Actions secrets` |
| `.github/workflows/egx-investor-flows.yml` | 129 | `GitHub Actions secrets` |
| `.github/workflows/egx-investor-flows.yml` | 131 | `GitHub Actions secrets` |
| `.github/workflows/intraday_prices_schedule.yml` | 45 | `GitHub Actions secrets` |
| `.github/workflows/intraday_prices_schedule.yml` | 54 | `GitHub Actions secrets` |
| `.github/workflows/intraday_prices_schedule.yml` | 62 | `Python os.environ.get` |
| `.github/workflows/intraday_signals.yml` | 43 | `GitHub Actions secrets` |
| `.github/workflows/intraday_signals.yml` | 53 | `GitHub Actions secrets` |
| `.github/workflows/live-session-candles.yml` | 38 | `GitHub Actions secrets` |
| `.github/workflows/track_trades_schedule.yml` | 34 | `GitHub Actions secrets` |
| `.github/workflows/track_trades_schedule.yml` | 37 | `GitHub Actions secrets` |
| `.github/workflows/trade-monitor.yml` | 71 | `GitHub Actions secrets` |
| `.github/workflows/trade-monitor.yml` | 73 | `GitHub Actions secrets` |
| `.github/workflows/weekly_backtest.yml` | 39 | `GitHub Actions secrets` |
| `.github/workflows/weekly_backtest.yml` | 47 | `GitHub Actions secrets` |
| `.github/workflows/weekly_backtest.yml` | 55 | `GitHub Actions secrets` |
| `.github/workflows/weekly_backtest.yml` | 63 | `GitHub Actions secrets` |
| `.github/workflows/weekly_backtest.yml` | 71 | `GitHub Actions secrets` |
| `.github/workflows/weekly_fundamentals_sync.yml` | 30 | `GitHub Actions secrets` |
| `.github/workflows/weekly_performance_analytics.yml` | 34 | `GitHub Actions secrets` |
| `.github/workflows/weekly_shariah_review.yml` | 29 | `GitHub Actions secrets` |
| `config/settings.py` | 12 | `Python os.getenv` |
| `scrapers/almal_news_scraper.py` | 27 | `Python os.getenv` |
| `scrapers/egx_disclosures_insider_scraper.py` | 30 | `Python os.getenv` |
| `scripts/close_stale_signals.py` | 21 | `Python os.getenv` |
| `scripts/golden_candle_audit.py` | 84 | `Python os.getenv` |
| `scripts/signal_vs_chart_audit.py` | 62 | `Python os.getenv` |
| `scripts/source_unification_test.py` | 17 | `Python os.getenv` |
| `scripts/validate_data.py` | 15 | `Python os.environ[]` |
| `services/daily_report_service.py` | 17 | `Python os.getenv` |
| `services/exit_engine.py` | 299 | `Python os.getenv` |
| `services/fundamentals_importer.py` | 23 | `Python os.getenv` |
| `services/long_term_investor_service.py` | 22 | `Python os.getenv` |
| `services/news_intelligence_service.py` | 20 | `Python os.getenv` |
| `services/sync_fundamentals.py` | 20 | `Python os.environ.get` |
| `services/volume_profile_engine.py` | 29 | `Python os.getenv` |
| `tradeora-web/app/api/cron/intraday-analysis/route.ts` | 9 | `Node process.env` |
| `tradeora-web/app/api/cron/track-recommended-trades/route.ts` | 9 | `Node process.env` |
| `tradeora-web/app/api/investor-flows/route.ts` | 17 | `Node process.env` |
| `tradeora-web/lib/postgres-client.ts` | 9 | `Node process.env` |
| `tradeora-web/lib/supabase.ts` | 9 | `Node process.env` |

### 🔑 Variable: `SUPABASE_WEBHOOK_SECRET` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `supabase_webhook_sync.py` | 27 | `Python os.getenv` |

### 🔑 Variable: `TELEGRAM_BOT_TOKEN` (12 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `performance_analytics.py` | 36 | `Python os.getenv` |
| `track_trades.py` | 195 | `Python os.getenv` |
| `track_trades.py` | 483 | `Python os.getenv` |
| `.github/workflows/daily_update.yml` | 59 | `GitHub Actions secrets` |
| `.github/workflows/track_trades_schedule.yml` | 39 | `GitHub Actions secrets` |
| `.github/workflows/weekly_backtest.yml` | 74 | `GitHub Actions secrets` |
| `.github/workflows/weekly_performance_analytics.yml` | 36 | `GitHub Actions secrets` |
| `scripts/validate_data.py` | 39 | `Python os.environ.get` |
| `tradeora-web/app/api/cron/track-trades/route.ts` | 222 | `Node process.env` |
| `tradeora-web/app/api/telegram/notify/route.ts` | 3 | `Node process.env` |
| `tradeora-web/app/api/telegram/webhook/route.ts` | 6 | `Node process.env` |
| `tradeora-web/lib/alert-dispatcher.ts` | 107 | `Node process.env` |

### 🔑 Variable: `TELEGRAM_CHANNEL_ID` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `tradeora-web/lib/alert-dispatcher.ts` | 264 | `Node process.env` |

### 🔑 Variable: `TELEGRAM_CHAT_ID` (4 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `performance_analytics.py` | 44 | `Python os.getenv` |
| `performance_analytics.py` | 45 | `Python os.getenv` |
| `.github/workflows/daily_update.yml` | 60 | `GitHub Actions secrets` |
| `scripts/validate_data.py` | 40 | `Python os.environ.get` |

### 🔑 Variable: `TRADEORA_PLUGIN_CERT_PUBLIC_KEY` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/PLUGIN_ARCHITECTURE.md` | 641 | `Node process.env` |

### 🔑 Variable: `TV_PASSWORD` (2 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `tv_backfill.py` | 40 | `Python os.getenv` |
| `.github/workflows/daily-backfill.yml` | 56 | `GitHub Actions secrets` |

### 🔑 Variable: `TV_USERNAME` (2 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `tv_backfill.py` | 39 | `Python os.getenv` |
| `.github/workflows/daily-backfill.yml` | 55 | `GitHub Actions secrets` |

### 🔑 Variable: `UNLEASH_ADMIN_TOKEN` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/BLUEPRINT_SUBSCRIPTION_BILLING_FLOW.md` | 391 | `Node process.env` |

### 🔑 Variable: `UPSTASH_REDIS_REST_TOKEN` (2 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `tradeora-web/proxy.ts` | 13 | `Node process.env` |
| `tradeora-web/proxy.ts` | 16 | `Node process.env` |

### 🔑 Variable: `UPSTASH_REDIS_REST_URL` (2 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `tradeora-web/proxy.ts` | 13 | `Node process.env` |
| `tradeora-web/proxy.ts` | 15 | `Node process.env` |

### 🔑 Variable: `USE_NLP_SENTIMENT` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `config/settings.py` | 25 | `Python os.getenv` |

### 🔑 Variable: `VALKEY_URL` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/BLUEPRINT_SUBSCRIPTION_BILLING_FLOW.md` | 392 | `Node process.env` |

### 🔑 Variable: `VAPID_EMAIL` (4 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `tradeora-web/app/api/push/send/route.ts` | 7 | `Node process.env` |
| `tradeora-web/app/api/push/send/route.ts` | 9 | `Node process.env` |
| `tradeora-web/lib/alert-dispatcher.ts` | 21 | `Node process.env` |
| `tradeora-web/lib/alert-dispatcher.ts` | 26 | `Node process.env` |

### 🔑 Variable: `VAPID_PRIVATE_KEY` (4 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `tradeora-web/app/api/push/send/route.ts` | 7 | `Node process.env` |
| `tradeora-web/app/api/push/send/route.ts` | 11 | `Node process.env` |
| `tradeora-web/lib/alert-dispatcher.ts` | 23 | `Node process.env` |
| `tradeora-web/lib/alert-dispatcher.ts` | 28 | `Node process.env` |

### 🔑 Variable: `VAPID_PUBLIC_KEY` (4 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `tradeora-web/app/api/push/send/route.ts` | 7 | `Node process.env` |
| `tradeora-web/app/api/push/send/route.ts` | 10 | `Node process.env` |
| `tradeora-web/lib/alert-dispatcher.ts` | 22 | `Node process.env` |
| `tradeora-web/lib/alert-dispatcher.ts` | 27 | `Node process.env` |

### 🔑 Variable: `VERCEL_APP_URL` (2 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `.github/workflows/session-crons.yml` | 45 | `GitHub Actions secrets` |
| `.github/workflows/session-crons.yml` | 55 | `GitHub Actions secrets` |

### 🔑 Variable: `WHATSAPP_TOKEN` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `tradeora-web/lib/alert-dispatcher.ts` | 298 | `Node process.env` |

### 🔑 Variable: `d` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `tradeora-web/tsconfig.tsbuildinfo` | 1 | `GitHub Actions secrets` |

### 🔑 Variable: `get` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/PLUGIN_ARCHITECTURE.md` | 286 | `GitHub Actions secrets` |

### 🔑 Variable: `randbelow` (1 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/BLUEPRINT_USER_ONBOARDING_FLOW.md` | 88 | `GitHub Actions secrets` |

### 🔑 Variable: `token_bytes` (2 occurrences)
| File Path | Line | Access Method |
| :--- | :-: | :--- |
| `copy/docs/ARCHITECTURE_ADDENDUM_PHASE8_SPECIFICATIONS.md` | 406 | `GitHub Actions secrets` |
| `copy/docs/ARCHITECTURE_ADDENDUM_PHASE8_SPECIFICATIONS.md` | 416 | `GitHub Actions secrets` |

---
## 3. Hardcoded Secrets & Credentials Violations Log

_No hardcoded secrets detected in source code files._
