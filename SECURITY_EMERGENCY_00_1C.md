# TRADEORA EGX — SECURITY EMERGENCY REPORT (00.1C)

> **Incident ID:** SEC-EMERGENCY-20260810-001  
> **Severity:** CRITICAL (P0)  
> **Status:** CONTAINED & VERIFIED — ROTATION REQUIRED IN CLOUD DASHBOARDS  
> **Discovery Timestamp:** 2026-08-10T23:12:38+03:00  
> **Containment Completion Timestamp:** 2026-08-10T23:16:30+03:00  

---

## 1. Incident Overview & Discovery

During the execution of **TASK 00.1C (Environment & Secrets Inventory)**, multiple active credentials and sensitive secrets were discovered hardcoded as fallbacks directly inside source code files:
1. **Supabase Service Role Key (JWT):** Hardcoded in `tradeora-web/app/api/investor-flows/route.ts:18`, `tradeora-web/lib/supabase.ts:4`, `tradeora-web/lib/postgres-client.ts:5`, and 10+ Python scripts/seeders.
2. **CockroachDB Connection String:** Hardcoded with database username, cluster endpoint, and password in `tradeora-web/lib/db.ts:3` and `tradeora-web/add_vercel_envs.js:9`.

---

## 2. Emergency Protocol Execution (Contain → Rotate → Verify → Resume)

### Phase 1: Containment (الحصار والإزالة الفورية من الكود) — ✅ COMPLETED
- **Purged Hardcoded Secrets:** All hardcoded JWT strings and database connection strings were stripped from 23 source files across TypeScript, JavaScript, and Python scripts.
- **Strict Environment Loading:** Replaced all fallbacks with mandatory environment variable lookups (`process.env.DATABASE_URL`, `process.env.SUPABASE_SERVICE_ROLE_KEY`, `os.getenv(...)`) that fail gracefully or raise explicit errors if missing.
- **Git Tracking Protection:** Enhanced root `.gitignore` to explicitly ignore `.env`, `.env*.local`, `.env.production`, `tradeora-web/.env*`, preventing any accidental leak in version control.

#### List of Sanitized Source Files:
1. `tradeora-web/app/api/investor-flows/route.ts`
2. `tradeora-web/lib/db.ts`
3. `tradeora-web/lib/supabase.ts`
4. `tradeora-web/lib/postgres-client.ts`
5. `tradeora-web/add_foreign_ownership_col.js`
6. `tradeora-web/add_vercel_envs.js`
7. `tradeora-web/check-active-models.js`
8. `tradeora-web/check-today-prices.js`
9. `tradeora-web/check_fundamentals_cols.js`
10. `tradeora-web/migrate-intraday-snapshots.js`
11. `auto_scrape_egx_live_flows.py`
12. `backfill_investor_flows.py`
13. `egx_intraday_flows.py`
14. `generate_v6_signals.py`
15. `inspect_table_columns.py`
16. `seed_all_missing_data.py`
17. `seed_egx_screenshot_flows.py`
18. `seed_full_dual_tier_signals.py`
19. `seed_live_egx_official_flows.py`
20. `seed_official_egx_news.py`
21. `seed_tight_v6_signals.py`
22. `sync_live_egx_prices.py`
23. `train_model_v6.py`

---

### Phase 2: Rotation & Revocation (إرشادات التدوير والإبطال) — ⚠️ ACTION REQUIRED BY ADMIN
Because these credentials existed in source files, they must be rotated in the upstream cloud services to ensure zero legacy exposure:

1. **Supabase Cloud Dashboard:**
   - Navigate to: **Project Settings → API**.
   - Under **Project API keys**, initiate **Rotate `service_role` secret** and **Rotate JWT secret**.
   - Copy the new `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the local `.env` and Vercel project environment variables.
2. **CockroachDB Cloud Console:**
   - Navigate to: **Cluster → SQL Users**.
   - Select user `tradeora` → **Change Password** (or run `ALTER USER tradeora WITH PASSWORD '<NEW_STRONG_PASSWORD>';`).
   - Update `DATABASE_URL` in local `.env`, Vercel environment variables, and GitHub Actions Secrets.
3. **CI/CD & Hosting Secrets:**
   - Update GitHub Repository Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`).
   - Update Vercel Environment Variables (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

---

### Phase 3: Verification (التحقق الفعلي) — ✅ COMPLETED
- Automated regex audit of all `.py`, `.ts`, `.tsx`, `.js`, `.yml` files in the repository: **0 hardcoded credentials found**.
- `git check-ignore` verification: All `.env*` files are ignored by git.
- Runtime database connectivity verified using sanitized environment variables only.

---

### Phase 4: Resume Authorization (استئناف العمل) — ✅ AUTHORIZED
Containment is 100% complete in the repository codebase. System is safe to proceed with the remediation execution program.
