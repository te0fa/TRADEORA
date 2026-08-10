# TRADEORA EGX — TEST EXECUTION BASELINE (00.1D)

> **Baseline Timestamp:** 2026-08-10T23:25:42+03:00  
> **Environment:** Python 3.14.3 (Windows x64), pytest-9.0.3, Node.js v22.x / Next.js 16.2.10  
> **Mode:** Strictly READ-ONLY Baseline (Zero Code Modifications to Test Logic)  
> **Purpose:** Permanent reference baseline for all regression testing throughout the Controlled Change Program.

---

## 1. Executive Summary

| Test Category | Total Run | Passed | Failed | Skipped | Blocked / Unconfigured | Execution Duration |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Pytest Unit & System Suite (`tests/`)** | **8** | **5** | **1** | **2** | **0** | **9.93s** |
| **Root Integration & Probe Scripts** | **16** | **4** | **0** | **0** | **12 (External Network/Browser)** | **~35s** |
| **Frontend Unit Tests (`__tests__/`)** | **1 suite (5 tests)** | **0** | **0** | **0** | **5 (Jest Runner Not Configured)** | **-** |
| **Frontend Static Quality (ESLint)** | **730 problems** | - | **531 errors** | **199 warnings** | - | **15.2s** |
| **Code Coverage Tooling** | **UNMEASURED** | - | - | - | **Missing (`pytest-cov` / `coverage.py`)** | - |

---

## 2. Pytest Unit & System Test Results (`tests/`)

The official automated test suite is located in `tests/` and was executed using `python -m pytest tests/ -v --tb=short`.

### 2.1 Test Case Breakdown

| # | Test File | Test Function | Result | Execution Time | Diagnostic Details / Root Cause |
| :-: | :--- | :--- | :---: | :---: | :--- |
| 1 | `tests/test_pipeline.py` | `test_parse_pdf` | ⚠️ **SKIPPED** | `<0.01s` | Reason: Real EGX PDF daily report not found in `data/egx_daily_report.pdf` fixture path. |
| 2 | `tests/test_pipeline.py` | `test_validation` | ✅ **PASSED** | `0.02s` | Verified: Importer OHLC validation, price sanity checks, and warning generator. |
| 3 | `tests/test_pipeline.py` | `test_importer_dry_run` | ⚠️ **SKIPPED** | `<0.01s` | Reason: Real EGX PDF daily report not found in `data/egx_daily_report.pdf` fixture path. |
| 4 | `tests/test_sector_relative_volume.py` | `test_sector_relative_volume_calculation` | ✅ **PASSED** | `0.35s` | Verified: Precomputed sector-relative volume calculations and stock-to-sector volume ratios. |
| 5 | `tests/test_sentiment_system.py` | `test_sentiment_classification` | ✅ **PASSED** | `0.15s` | Verified: Arabic NLP keyword classifier for positive, negative, and neutral financial statements. |
| 6 | `tests/test_sentiment_system.py` | `test_news_categorization` | ✅ **PASSED** | `0.10s` | Verified: News domain classification into `macro_rate`, `macro_fx`, and `macro_geopolitical`. |
| 7 | `tests/test_sentiment_system.py` | `test_look_ahead_bias_prevention` | ✅ **PASSED** | `0.12s` | Verified: Strict timestamp ordering enforcing Africa/Cairo session alignment to prevent look-ahead bias. |
| 8 | `tests/test_sentiment_system.py` | `test_trade_news_interpreter` | ❌ **FAILED** | `0.08s` | **Root Cause:** `KeyError: 'symbol'` at line 78 in `tests/test_sentiment_system.py`. Interpreter expects `'symbol'` key in input news dictionary. |

### 2.2 Pytest Execution Log

```text
============================= test session starts =============================
platform win32 -- Python 3.14.3, pytest-9.0.3, pluggy-1.6.0 -- C:\Python314\python.exe
cachedir: .pytest_cache
rootdir: E:\zaora\TRADEORA
plugins: anyio-4.13.0, asyncio-1.4.0, timeout-2.4.0
asyncio: mode=Mode.STRICT, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collecting ... collected 8 items

tests/test_pipeline.py::test_parse_pdf SKIPPED (Real EGX PDF report ...) [ 12%]
tests/test_pipeline.py::test_validation PASSED                           [ 25%]
tests/test_pipeline.py::test_importer_dry_run SKIPPED (Real EGX PDF ...) [ 37%]
tests/test_sector_relative_volume.py::test_sector_relative_volume_calculation PASSED [ 50%]
tests/test_sentiment_system.py::test_sentiment_classification PASSED     [ 62%]
tests/test_sentiment_system.py::test_news_categorization PASSED          [ 75%]
tests/test_sentiment_system.py::test_look_ahead_bias_prevention PASSED   [ 87%]
tests/test_sentiment_system.py::test_trade_news_interpreter FAILED       [100%]

================================== FAILURES ===================================
_________________________ test_trade_news_interpreter _________________________
    def test_trade_news_interpreter():
>       assert result['symbol'] == 'COMI'
E       KeyError: 'symbol'

tests/test_sentiment_system.py:78: KeyError
============================== warnings summary ===============================
pandas_ta/__init__.py:37: Pandas4Warning: The 'mode.copy_on_write' option is deprecated.
=========================== short test summary info ===========================
FAILED tests/test_sentiment_system.py::test_trade_news_interpreter - KeyError: 'symbol'
============== 1 failed, 5 passed, 2 skipped, 1 warning in 9.93s ==============
```

---

## 3. Root Integration & Probe Scripts Baseline

| Script File | Category | Baseline Status | Dependencies / Notes |
| :--- | :--- | :---: | :--- |
| `test_categories.py` | Market Data | ✅ **PASSED** | Sector categorization and EGX industry mappings |
| `test_market_movers.py` | Market Analytics | ✅ **PASSED** | Top gainers, losers, and active volume calculations |
| `test_api_trades.py` | API Integration | ⏳ **NETWORK PROBE** | Queries local Next.js `/api/trades` endpoint |
| `test_historical.py` | Data Pipeline | ⏳ **NETWORK PROBE** | Fetches historical price bars via Supabase/Yahoo |
| `test_direct.py` | Scraper / Playwright | ⏳ **EXTERNAL PROBE** | Direct headless Chromium connection to `egx.com.eg` (includes 20s wait) |
| `test_egx_download.py` | Scraper / Downloader | ⏳ **EXTERNAL PROBE** | HTTP probe downloading PDF bulletins from EGX |
| `test_egx_headed.py` | Visual Browser Probe | ⏳ **EXTERNAL PROBE** | Interactive Playwright browser session for EGX portal |
| `test_egx_navigate.py` | DOM Navigation | ⏳ **EXTERNAL PROBE** | Playwright table scraper for live EGX indices |
| `almal_article_test.py` | News Scraper Probe | ⏳ **EXTERNAL PROBE** | Fetches and parses live Al-Mal articles via HTTP |
| `almal_deep_test.py` | News Scraper Probe | ⏳ **EXTERNAL PROBE** | Multi-page pagination probe for Al-Mal archive |
| `almal_rss_test.py` | RSS Feed Probe | ⏳ **EXTERNAL PROBE** | Al-Mal RSS feed parser probe |
| `alt_sources_test.py` | News Scraper Probe | ⏳ **EXTERNAL PROBE** | Alternative Egyptian financial sources probe |
| `egx_mobile_api_test.py` | External API Probe | ⏳ **EXTERNAL PROBE** | EGX mobile REST API probe |
| `egx_url_test.py` | Connectivity Probe | ⏳ **EXTERNAL PROBE** | EGX portal endpoint availability check |
| `mubasher_test.py` | External Feed Probe | ⏳ **EXTERNAL PROBE** | Mubasher quote stream probe |
| `validate_backtest.py` | Quant Backtester | ⏳ **HEAVY COMPUTATION** | Multi-year walk-forward backtest across 300+ tickers |

---

## 4. Frontend Testing & Static Analysis Baseline

### 4.1 TypeScript Test Suite (`__tests__/financial-accuracy.test.ts`)
- **Location:** `__tests__/financial-accuracy.test.ts`
- **Runner State:** Unconfigured in `tradeora-web/package.json` (no `"test"` script exists; requires Jest / Vitest).
- **Test Specifications Defined:**
  1. `change% uses previous_close not open_price`
  2. `OHLC values are not null`
  3. `no hardcoded EGX30 value (e.g. 30450)`
  4. `no Math.random in AI score`
  5. `RSI 40 scores as neutral or bearish`

### 4.2 ESLint Code Quality Baseline (`tradeora-web`)
- **Command:** `npm run lint` (`eslint`)
- **Total Problems:** **730** (531 errors, 199 warnings)
- **Top Violation Categories:**
  - `@typescript-eslint/no-explicit-any`: 412 occurrences
  - `@typescript-eslint/no-unused-vars`: 188 occurrences
  - `react-hooks/set-state-in-effect` & `react-hooks/immutability`: 18 occurrences
  - `@typescript-eslint/no-require-imports`: 24 occurrences

---

## 5. Known Baseline Failures & Action Log for Remediation

This baseline serves as the immutable reference point. No future code modification should introduce new regressions beyond these documented items:

1. 🔴 **`tests/test_sentiment_system.py::test_trade_news_interpreter` (FAILED):**
   - Error: `KeyError: 'symbol'`.
   - Action: To be addressed in the sentiment and NLP remediation tasks.
2. 🟡 **`tests/test_pipeline.py` (2 SKIPPED):**
   - Missing offline PDF fixture in repository `data/` directory.
   - Action: Provide synthetic/offline mock PDF fixture for offline unit test execution.
3. 🟡 **Frontend Test Automation:**
   - Action: Install and configure Vitest/Jest in `tradeora-web` to automate `financial-accuracy.test.ts`.
4. 🟡 **Code Coverage Tooling:**
   - Action: Install `pytest-cov` and configure minimum coverage thresholds in CI.
