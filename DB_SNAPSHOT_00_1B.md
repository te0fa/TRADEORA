# TRADEORA EGX — DATABASE BASELINE SNAPSHOT (00.1B)

> **Snapshot Timestamp:** 2026-08-10T23:10:34.121043
> **Inspection Mode:** Strictly READ-ONLY (`set_session(readonly=True, autocommit=True)`)
> **Primary Storage Engine (Postgres/CockroachDB):** `defaultdb`
> **Target Supabase URL:** `https://kdjsguozssxvtmlmqhpz...`

## 1. Database Engine & Cluster Details
- **Engine / Version:** `CockroachDB CCL v26.2.5 (x86_64-pc-linux-gnu, built 2026/07/28 18:56:00, go1.25.5)`

## 2. Table Summary & Exact Baseline Row Counts

| Table Name | Type | CockroachDB Rows | Supabase Rows | Sync Status |
| :--- | :---: | :---: | :---: | :---: |
| `public.companies` | BASE TABLE | 344 | 344 | ✅ MATCH |
| `public.company_fundamentals` | BASE TABLE | 344 | 344 | ✅ MATCH |
| `public.company_news` | BASE TABLE | 472 | 468 | ⚠️ MISMATCH / DIFF |
| `public.corporate_disclosures` | BASE TABLE | 0 | NOT_FOUND | ℹ️ CR ONLY |
| `public.corporate_events` | BASE TABLE | 14 | 48 | ⚠️ MISMATCH / DIFF |
| `public.daily_investor_flows` | BASE TABLE | 129 | 131 | ⚠️ MISMATCH / DIFF |
| `public.egx_shariah_index` | BASE TABLE | 33 | 33 | ✅ MATCH |
| `public.historical_prices` | BASE TABLE | 11,000 | 21,309 | ⚠️ MISMATCH / DIFF |
| `public.import_jobs` | BASE TABLE | 0 | 396 | ⚠️ MISMATCH / DIFF |
| `public.insider_trading` | BASE TABLE | 10 | 10 | ✅ MATCH |
| `public.intraday_snapshots` | BASE TABLE | 134,825 | 337,273 | ⚠️ MISMATCH / DIFF |
| `public.market_breadth_snapshots` | BASE TABLE | 1 | 0 | ⚠️ MISMATCH / DIFF |
| `public.market_prices` | BASE TABLE | 307,188 | 312,533 | ⚠️ MISMATCH / DIFF |
| `public.market_sources` | BASE TABLE | 17 | 17 | ✅ MATCH |
| `public.orderbook_snapshots` | BASE TABLE | 0 | 0 | ✅ MATCH |
| `public.price_volume_levels` | BASE TABLE | 0 | 0 | ✅ MATCH |
| `public.recommended_trades` | BASE TABLE | 1,545 | 1,220 | ⚠️ MISMATCH / DIFF |
| `public.seasonality_patterns` | BASE TABLE | 2,688 | 2,688 | ✅ MATCH |
| `public.sector_investor_flows` | BASE TABLE | 1,032 | 1,032 | ✅ MATCH |
| `public.shariah_audit_log` | BASE TABLE | 0 | 0 | ✅ MATCH |
| `public.signal_stats` | BASE TABLE | 1,000 | 2,055 | ⚠️ MISMATCH / DIFF |
| `public.system_settings` | BASE TABLE | 1 | 1 | ✅ MATCH |
| `public.technical_levels` | BASE TABLE | 0 | 0 | ✅ MATCH |
| `public.user_profiles` | BASE TABLE | 1 | 1 | ✅ MATCH |
| `public.volume_profiles` | BASE TABLE | 0 | 6 | ⚠️ MISMATCH / DIFF |
| `public.watchlist_items` | BASE TABLE | 0 | 0 | ✅ MATCH |
| `public.watchlists` | BASE TABLE | 1 | 0 | ⚠️ MISMATCH / DIFF |

---
## 3. Detailed Schema Specification by Table

### 📋 Table: `public.companies`
- **Baseline Row Count:** `344` (CockroachDB) | `344` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`symbol`** | `text` | `NO` | `-` |
| 3 | **`isin`** | `text` | `YES` | `-` |
| 4 | **`name_ar`** | `text` | `YES` | `-` |
| 5 | **`name_en`** | `text` | `YES` | `-` |
| 6 | **`logo_url`** | `text` | `YES` | `-` |
| 7 | **`sector`** | `text` | `YES` | `-` |
| 8 | **`market_type`** | `text` | `YES` | `-` |
| 9 | **`currency`** | `text` | `YES` | `'EGP'` |
| 10 | **`listing_status`** | `text` | `YES` | `-` |
| 11 | **`first_listing_date`** | `date` | `YES` | `-` |
| 12 | **`is_shariah_compliant`** | `boolean` | `YES` | `false` |
| 13 | **`created_at`** | `timestamp with time zone` | `YES` | `now()` |
| 14 | **`updated_at`** | `timestamp with time zone` | `YES` | `now()` |
| 15 | **`market`** | `text` | `YES` | `'EGX'` |
| 16 | **`country`** | `text` | `YES` | `'Egypt'` |
| 17 | **`exchange`** | `text` | `YES` | `'EGX'` |
| 18 | **`industry`** | `text` | `YES` | `-` |
| 19 | **`asset_type`** | `text` | `YES` | `'stock'` |
| 20 | **`status`** | `text` | `YES` | `'active'` |
| 21 | **`is_egx_shariah_listed`** | `boolean` | `YES` | `false` |
| 22 | **`is_boubyan_compliant`** | `boolean` | `YES` | `false` |
| 23 | **`kasheif_purification_ratio`** | `numeric` | `YES` | `-` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `companies_pkey` | `PRIMARY KEY` | `id` | `companies.id` |
| `companies_symbol_key` | `UNIQUE` | `symbol` | `companies.symbol` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `companies_pkey` | `CREATE UNIQUE INDEX companies_pkey ON defaultdb.public.companies USING btree (id ASC)` |
| `companies_symbol_key` | `CREATE UNIQUE INDEX companies_symbol_key ON defaultdb.public.companies USING btree (symbol ASC)` |
| `idx_companies_market` | `CREATE INDEX idx_companies_market ON defaultdb.public.companies USING btree (market ASC)` |
| `idx_companies_sector` | `CREATE INDEX idx_companies_sector ON defaultdb.public.companies USING btree (sector ASC)` |
| `idx_companies_status` | `CREATE INDEX idx_companies_status ON defaultdb.public.companies USING btree (status ASC)` |
| `idx_companies_symbol` | `CREATE INDEX idx_companies_symbol ON defaultdb.public.companies USING btree (symbol ASC)` |

### 📋 Table: `public.company_fundamentals`
- **Baseline Row Count:** `344` (CockroachDB) | `344` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`company_id`** | `uuid` | `YES` | `-` |
| 3 | **`fair_value`** | `numeric` | `YES` | `-` |
| 4 | **`upside_potential`** | `numeric` | `YES` | `-` |
| 5 | **`dividend_yield`** | `numeric` | `YES` | `-` |
| 6 | **`last_dividend_amount`** | `numeric` | `YES` | `-` |
| 7 | **`pe_ratio`** | `numeric` | `YES` | `-` |
| 8 | **`created_at`** | `timestamp with time zone` | `YES` | `now()` |
| 9 | **`updated_at`** | `timestamp with time zone` | `YES` | `now()` |
| 10 | **`pb_ratio`** | `numeric` | `YES` | `-` |
| 11 | **`roe`** | `numeric` | `YES` | `-` |
| 12 | **`debt_to_equity`** | `numeric` | `YES` | `-` |
| 13 | **`eps`** | `text` | `YES` | `-` |
| 14 | **`book_value_ps`** | `text` | `YES` | `-` |
| 15 | **`roa`** | `text` | `YES` | `-` |
| 16 | **`profit_margin`** | `text` | `YES` | `-` |
| 17 | **`current_ratio`** | `text` | `YES` | `-` |
| 18 | **`revenue`** | `text` | `YES` | `-` |
| 19 | **`net_income`** | `text` | `YES` | `-` |
| 20 | **`shares_outstanding`** | `text` | `YES` | `-` |
| 21 | **`market_cap`** | `text` | `YES` | `-` |
| 22 | **`fiscal_year`** | `text` | `YES` | `-` |
| 23 | **`source`** | `text` | `YES` | `-` |
| 24 | **`fetched_at`** | `text` | `YES` | `-` |
| 25 | **`fair_value_source`** | `text` | `YES` | `-` |
| 26 | **`last_dividend_date`** | `text` | `YES` | `-` |
| 27 | **`foreign_ownership_pct`** | `numeric` | `YES` | `0.0` |
| 28 | **`free_float_pct`** | `numeric` | `YES` | `0.0` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `company_fundamentals_company_id_fkey` | `FOREIGN KEY` | `company_id` | `companies.id` |
| `company_fundamentals_pkey` | `PRIMARY KEY` | `id` | `company_fundamentals.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `company_fundamentals_pkey` | `CREATE UNIQUE INDEX company_fundamentals_pkey ON defaultdb.public.company_fundamentals USING btree (id ASC)` |

### 📋 Table: `public.company_news`
- **Baseline Row Count:** `472` (CockroachDB) | `468` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`company_id`** | `uuid` | `YES` | `-` |
| 3 | **`title`** | `text` | `NO` | `-` |
| 4 | **`content`** | `text` | `YES` | `-` |
| 5 | **`published_at`** | `timestamp with time zone` | `NO` | `-` |
| 6 | **`source`** | `text` | `YES` | `-` |
| 7 | **`url`** | `text` | `NO` | `-` |
| 8 | **`category`** | `text` | `NO` | `-` |
| 9 | **`sentiment`** | `text` | `NO` | `-` |
| 10 | **`confidence`** | `numeric` | `YES` | `1.0` |
| 11 | **`created_at`** | `timestamp with time zone` | `YES` | `now()` |
| 12 | **`expected_impact_ar`** | `text` | `YES` | `-` |
| 13 | **`expected_impact_en`** | `text` | `YES` | `-` |
| 14 | **`impact_score`** | `text` | `YES` | `-` |
| 15 | **`sector_name`** | `text` | `YES` | `-` |
| 16 | **`source_label_ar`** | `character varying` | `YES` | `e'\U0001F3DB\U0000FE0F \u0627\u0644\u...` |
| 17 | **`scope`** | `character varying` | `YES` | `'stock_direct'` |
| 18 | **`weight`** | `numeric` | `YES` | `1.0` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `company_news_company_id_fkey` | `FOREIGN KEY` | `company_id` | `companies.id` |
| `company_news_pkey` | `PRIMARY KEY` | `id` | `company_news.id` |
| `idx_company_news_url` | `UNIQUE` | `url` | `company_news.url` |
| `unique_url` | `UNIQUE` | `url` | `company_news.url` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `company_news_pkey` | `CREATE UNIQUE INDEX company_news_pkey ON defaultdb.public.company_news USING btree (id ASC)` |
| `idx_company_news_category` | `CREATE INDEX idx_company_news_category ON defaultdb.public.company_news USING btree (category ASC)` |
| `idx_company_news_company_id` | `CREATE INDEX idx_company_news_company_id ON defaultdb.public.company_news USING btree (company_id ASC)` |
| `idx_company_news_published_at` | `CREATE INDEX idx_company_news_published_at ON defaultdb.public.company_news USING btree (published_at ASC)` |
| `idx_company_news_url` | `CREATE UNIQUE INDEX idx_company_news_url ON defaultdb.public.company_news USING btree (url ASC)` |
| `unique_url` | `CREATE UNIQUE INDEX unique_url ON defaultdb.public.company_news USING btree (url ASC)` |

### 📋 Table: `public.corporate_disclosures`
- **Baseline Row Count:** `0` (CockroachDB) | `NOT_FOUND` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`company_id`** | `uuid` | `YES` | `-` |
| 3 | **`symbol`** | `text` | `NO` | `-` |
| 4 | **`title`** | `text` | `NO` | `-` |
| 5 | **`disclosure_type`** | `text` | `NO` | `'financial_results'` |
| 6 | **`expected_date`** | `timestamp with time zone` | `NO` | `-` |
| 7 | **`countdown_days`** | `bigint` | `YES` | `0` |
| 8 | **`expected_impact_ar`** | `text` | `YES` | `-` |
| 9 | **`forecast_summary`** | `text` | `YES` | `-` |
| 10 | **`actual_summary`** | `text` | `YES` | `-` |
| 11 | **`status`** | `text` | `NO` | `'upcoming'` |
| 12 | **`impact_score`** | `numeric` | `YES` | `0.0` |
| 13 | **`source_url`** | `text` | `YES` | `-` |
| 14 | **`created_at`** | `timestamp with time zone` | `YES` | `now()` |
| 15 | **`updated_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `corporate_disclosures_company_id_fkey` | `FOREIGN KEY` | `company_id` | `companies.id` |
| `corporate_disclosures_pkey` | `PRIMARY KEY` | `id` | `corporate_disclosures.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `corporate_disclosures_pkey` | `CREATE UNIQUE INDEX corporate_disclosures_pkey ON defaultdb.public.corporate_disclosures USING btree (id ASC)` |
| `idx_disclosures_company_date` | `CREATE INDEX idx_disclosures_company_date ON defaultdb.public.corporate_disclosures USING btree (company_id ASC, expected_date ASC)` |
| `idx_disclosures_status` | `CREATE INDEX idx_disclosures_status ON defaultdb.public.corporate_disclosures USING btree (status ASC)` |

### 📋 Table: `public.corporate_events`
- **Baseline Row Count:** `14` (CockroachDB) | `48` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`company_id`** | `uuid` | `YES` | `-` |
| 3 | **`symbol`** | `character varying` | `NO` | `-` |
| 4 | **`event_type`** | `character varying` | `NO` | `'earnings'` |
| 5 | **`event_date`** | `timestamp with time zone` | `NO` | `-` |
| 6 | **`countdown_days`** | `bigint` | `YES` | `0` |
| 7 | **`expected_impact_ar`** | `text` | `YES` | `-` |
| 8 | **`details_ar`** | `text` | `YES` | `-` |
| 9 | **`source_url`** | `text` | `YES` | `-` |
| 10 | **`status`** | `character varying` | `YES` | `'upcoming'` |
| 11 | **`created_at`** | `timestamp with time zone` | `YES` | `now()` |
| 12 | **`updated_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `corporate_events_company_id_fkey` | `FOREIGN KEY` | `company_id` | `companies.id` |
| `corporate_events_pkey` | `PRIMARY KEY` | `id` | `corporate_events.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `corporate_events_pkey` | `CREATE UNIQUE INDEX corporate_events_pkey ON defaultdb.public.corporate_events USING btree (id ASC)` |
| `idx_corporate_events_company` | `CREATE INDEX idx_corporate_events_company ON defaultdb.public.corporate_events USING btree (company_id ASC, event_date ASC)` |
| `idx_corporate_events_status` | `CREATE INDEX idx_corporate_events_status ON defaultdb.public.corporate_events USING btree (status ASC)` |
| `idx_corporate_events_type` | `CREATE INDEX idx_corporate_events_type ON defaultdb.public.corporate_events USING btree (event_type ASC)` |

### 📋 Table: `public.daily_investor_flows`
- **Baseline Row Count:** `129` (CockroachDB) | `131` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `bigint` | `NO` | `unique_rowid()` |
| 2 | **`trade_date`** | `date` | `NO` | `-` |
| 3 | **`foreigners_buy_egp`** | `numeric` | `YES` | `-` |
| 4 | **`foreigners_sell_egp`** | `numeric` | `YES` | `-` |
| 5 | **`foreigners_net_egp`** | `numeric` | `YES` | `-` |
| 6 | **`foreign_inst_buy_egp`** | `numeric` | `YES` | `-` |
| 7 | **`foreign_inst_sell_egp`** | `numeric` | `YES` | `-` |
| 8 | **`foreign_inst_net_egp`** | `numeric` | `YES` | `-` |
| 9 | **`egyptian_inst_buy_egp`** | `numeric` | `YES` | `-` |
| 10 | **`egyptian_inst_sell_egp`** | `numeric` | `YES` | `-` |
| 11 | **`egyptian_inst_net_egp`** | `numeric` | `YES` | `-` |
| 12 | **`arab_buy_egp`** | `numeric` | `YES` | `-` |
| 13 | **`arab_sell_egp`** | `numeric` | `YES` | `-` |
| 14 | **`arab_net_egp`** | `numeric` | `YES` | `-` |
| 15 | **`egyptian_ind_buy_egp`** | `numeric` | `YES` | `-` |
| 16 | **`egyptian_ind_sell_egp`** | `numeric` | `YES` | `-` |
| 17 | **`egyptian_ind_net_egp`** | `numeric` | `YES` | `-` |
| 18 | **`total_volume_egp`** | `numeric` | `YES` | `-` |
| 19 | **`source`** | `character varying` | `YES` | `'EGX_OFFICIAL'` |
| 20 | **`pdf_url`** | `text` | `YES` | `-` |
| 21 | **`created_at`** | `timestamp with time zone` | `YES` | `now()` |
| 22 | **`updated_at`** | `timestamp with time zone` | `YES` | `now()` |
| 23 | **`arab_inst_buy_egp`** | `numeric` | `YES` | `-` |
| 24 | **`arab_inst_sell_egp`** | `numeric` | `YES` | `-` |
| 25 | **`arab_inst_net_egp`** | `numeric` | `YES` | `-` |
| 26 | **`arab_ind_buy_egp`** | `numeric` | `YES` | `-` |
| 27 | **`arab_ind_sell_egp`** | `numeric` | `YES` | `-` |
| 28 | **`arab_ind_net_egp`** | `numeric` | `YES` | `-` |
| 29 | **`foreign_ind_buy_egp`** | `numeric` | `YES` | `-` |
| 30 | **`foreign_ind_sell_egp`** | `numeric` | `YES` | `-` |
| 31 | **`foreign_ind_net_egp`** | `numeric` | `YES` | `-` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `daily_investor_flows_pkey` | `PRIMARY KEY` | `id` | `daily_investor_flows.id` |
| `daily_investor_flows_trade_date_key` | `UNIQUE` | `trade_date` | `daily_investor_flows.trade_date` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `daily_investor_flows_pkey` | `CREATE UNIQUE INDEX daily_investor_flows_pkey ON defaultdb.public.daily_investor_flows USING btree (id ASC)` |
| `daily_investor_flows_trade_date_key` | `CREATE UNIQUE INDEX daily_investor_flows_trade_date_key ON defaultdb.public.daily_investor_flows USING btree (trade_date ASC)` |

### 📋 Table: `public.egx_shariah_index`
- **Baseline Row Count:** `33` (CockroachDB) | `33` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`symbol`** | `text` | `NO` | `-` |
| 2 | **`added_date`** | `date` | `YES` | `current_date()` |
| 3 | **`notes`** | `text` | `YES` | `-` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `egx_shariah_index_pkey` | `PRIMARY KEY` | `symbol` | `egx_shariah_index.symbol` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `egx_shariah_index_pkey` | `CREATE UNIQUE INDEX egx_shariah_index_pkey ON defaultdb.public.egx_shariah_index USING btree (symbol ASC)` |

### 📋 Table: `public.historical_prices`
- **Baseline Row Count:** `11,000` (CockroachDB) | `21,309` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`company_id`** | `uuid` | `YES` | `-` |
| 3 | **`open`** | `numeric` | `NO` | `-` |
| 4 | **`high`** | `numeric` | `NO` | `-` |
| 5 | **`low`** | `numeric` | `NO` | `-` |
| 6 | **`close`** | `numeric` | `NO` | `-` |
| 7 | **`volume`** | `bigint` | `NO` | `-` |
| 8 | **`source`** | `text` | `NO` | `-` |
| 9 | **`price_date`** | `date` | `NO` | `-` |
| 10 | **`created_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `historical_prices_company_id_fkey` | `FOREIGN KEY` | `company_id` | `companies.id` |
| `historical_prices_pkey` | `PRIMARY KEY` | `id` | `historical_prices.id` |
| `unique_historical_company_price_date_source` | `UNIQUE` | `price_date` | `historical_prices.source` |
| `unique_historical_company_price_date_source` | `UNIQUE` | `source` | `historical_prices.price_date` |
| `unique_historical_company_price_date_source` | `UNIQUE` | `price_date` | `historical_prices.company_id` |
| `unique_historical_company_price_date_source` | `UNIQUE` | `price_date` | `historical_prices.price_date` |
| `unique_historical_company_price_date_source` | `UNIQUE` | `source` | `historical_prices.source` |
| `unique_historical_company_price_date_source` | `UNIQUE` | `source` | `historical_prices.company_id` |
| `unique_historical_company_price_date_source` | `UNIQUE` | `company_id` | `historical_prices.price_date` |
| `unique_historical_company_price_date_source` | `UNIQUE` | `company_id` | `historical_prices.source` |
| `unique_historical_company_price_date_source` | `UNIQUE` | `company_id` | `historical_prices.company_id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `historical_prices_pkey` | `CREATE UNIQUE INDEX historical_prices_pkey ON defaultdb.public.historical_prices USING btree (id ASC)` |
| `idx_historical_prices_company_id` | `CREATE INDEX idx_historical_prices_company_id ON defaultdb.public.historical_prices USING btree (company_id ASC)` |
| `idx_historical_prices_price_date` | `CREATE INDEX idx_historical_prices_price_date ON defaultdb.public.historical_prices USING btree (price_date ASC)` |
| `unique_historical_company_price_date_source` | `CREATE UNIQUE INDEX unique_historical_company_price_date_source ON defaultdb.public.historical_prices USING btree (company_id ASC, price_date ASC, source ASC)` |

### 📋 Table: `public.import_jobs`
- **Baseline Row Count:** `0` (CockroachDB) | `396` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`source`** | `text` | `YES` | `-` |
| 3 | **`started_at`** | `timestamp with time zone` | `YES` | `now()` |
| 4 | **`finished_at`** | `timestamp with time zone` | `YES` | `-` |
| 5 | **`status`** | `text` | `NO` | `-` |
| 6 | **`rows_read`** | `bigint` | `YES` | `0` |
| 7 | **`rows_inserted`** | `bigint` | `YES` | `0` |
| 8 | **`rows_updated`** | `bigint` | `YES` | `0` |
| 9 | **`warnings_count`** | `bigint` | `YES` | `0` |
| 10 | **`errors_count`** | `bigint` | `YES` | `0` |
| 11 | **`error_message`** | `text` | `YES` | `-` |
| 12 | **`created_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `import_jobs_pkey` | `PRIMARY KEY` | `id` | `import_jobs.id` |
| `import_jobs_source_fkey` | `FOREIGN KEY` | `source` | `market_sources.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `import_jobs_pkey` | `CREATE UNIQUE INDEX import_jobs_pkey ON defaultdb.public.import_jobs USING btree (id ASC)` |

### 📋 Table: `public.insider_trading`
- **Baseline Row Count:** `10` (CockroachDB) | `10` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`company_id`** | `uuid` | `YES` | `-` |
| 3 | **`symbol`** | `character varying` | `NO` | `-` |
| 4 | **`insider_name`** | `text` | `NO` | `-` |
| 5 | **`position_ar`** | `character varying` | `YES` | `e'\u0639\u0636\u0648 \u0645\u062C\u06...` |
| 6 | **`transaction_type`** | `character varying` | `NO` | `'buy'` |
| 7 | **`shares_count`** | `numeric` | `YES` | `0` |
| 8 | **`price`** | `numeric` | `YES` | `0` |
| 9 | **`total_value_egp`** | `numeric` | `YES` | `0` |
| 10 | **`transaction_date`** | `date` | `NO` | `-` |
| 11 | **`source_url`** | `text` | `YES` | `-` |
| 12 | **`created_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `insider_trading_company_id_fkey` | `FOREIGN KEY` | `company_id` | `companies.id` |
| `insider_trading_pkey` | `PRIMARY KEY` | `id` | `insider_trading.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `idx_insider_trading_company` | `CREATE INDEX idx_insider_trading_company ON defaultdb.public.insider_trading USING btree (company_id ASC, transaction_date ASC)` |
| `idx_insider_trading_type` | `CREATE INDEX idx_insider_trading_type ON defaultdb.public.insider_trading USING btree (transaction_type ASC)` |
| `insider_trading_pkey` | `CREATE UNIQUE INDEX insider_trading_pkey ON defaultdb.public.insider_trading USING btree (id ASC)` |

### 📋 Table: `public.intraday_snapshots`
- **Baseline Row Count:** `134,825` (CockroachDB) | `337,273` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `text` | `NO` | `-` |
| 2 | **`company_id`** | `text` | `YES` | `-` |
| 3 | **`snapshot_time`** | `text` | `YES` | `-` |
| 4 | **`price`** | `text` | `YES` | `-` |
| 5 | **`open_price`** | `text` | `YES` | `-` |
| 6 | **`high_price`** | `text` | `YES` | `-` |
| 7 | **`low_price`** | `text` | `YES` | `-` |
| 8 | **`volume`** | `text` | `YES` | `-` |
| 9 | **`source`** | `text` | `YES` | `-` |
| 10 | **`created_at`** | `text` | `YES` | `-` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `intraday_snapshots_pkey` | `PRIMARY KEY` | `id` | `intraday_snapshots.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `intraday_snapshots_pkey` | `CREATE UNIQUE INDEX intraday_snapshots_pkey ON defaultdb.public.intraday_snapshots USING btree (id ASC)` |

### 📋 Table: `public.market_breadth_snapshots`
- **Baseline Row Count:** `1` (CockroachDB) | `0` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`advance_count`** | `bigint` | `NO` | `0` |
| 3 | **`decline_count`** | `bigint` | `NO` | `0` |
| 4 | **`unchanged_count`** | `bigint` | `NO` | `0` |
| 5 | **`pct_above_ma200`** | `numeric` | `YES` | `50.0` |
| 6 | **`mcclellan_oscillator`** | `numeric` | `YES` | `0.0` |
| 7 | **`market_health_status`** | `character varying` | `YES` | `'neutral'` |
| 8 | **`snapshot_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `market_breadth_snapshots_pkey` | `PRIMARY KEY` | `id` | `market_breadth_snapshots.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `market_breadth_snapshots_pkey` | `CREATE UNIQUE INDEX market_breadth_snapshots_pkey ON defaultdb.public.market_breadth_snapshots USING btree (id ASC)` |

### 📋 Table: `public.market_prices`
- **Baseline Row Count:** `307,188` (CockroachDB) | `312,533` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`company_id`** | `uuid` | `YES` | `-` |
| 3 | **`open_price`** | `numeric` | `YES` | `-` |
| 4 | **`high_price`** | `numeric` | `YES` | `-` |
| 5 | **`low_price`** | `numeric` | `YES` | `-` |
| 6 | **`close_price`** | `numeric` | `YES` | `-` |
| 7 | **`previous_close`** | `numeric` | `YES` | `-` |
| 8 | **`change_value`** | `numeric` | `YES` | `-` |
| 9 | **`change_percent`** | `numeric` | `YES` | `-` |
| 10 | **`volume`** | `bigint` | `YES` | `-` |
| 11 | **`value_traded`** | `numeric` | `YES` | `-` |
| 12 | **`source`** | `text` | `YES` | `-` |
| 13 | **`price_date`** | `date` | `NO` | `-` |
| 14 | **`data_quality_flag`** | `text` | `YES` | `-` |
| 15 | **`fetched_at`** | `timestamp with time zone` | `YES` | `now()` |
| 16 | **`news_sentiment_score`** | `numeric` | `YES` | `0.0` |
| 17 | **`created_at`** | `timestamp with time zone` | `YES` | `now()` |
| 18 | **`updated_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `market_prices_company_id_fkey` | `FOREIGN KEY` | `company_id` | `companies.id` |
| `market_prices_pkey` | `PRIMARY KEY` | `id` | `market_prices.id` |
| `market_prices_source_fkey` | `FOREIGN KEY` | `source` | `market_sources.id` |
| `unique_company_price_date_source` | `UNIQUE` | `company_id` | `market_prices.source` |
| `unique_company_price_date_source` | `UNIQUE` | `company_id` | `market_prices.company_id` |
| `unique_company_price_date_source` | `UNIQUE` | `company_id` | `market_prices.price_date` |
| `unique_company_price_date_source` | `UNIQUE` | `source` | `market_prices.company_id` |
| `unique_company_price_date_source` | `UNIQUE` | `source` | `market_prices.source` |
| `unique_company_price_date_source` | `UNIQUE` | `source` | `market_prices.price_date` |
| `unique_company_price_date_source` | `UNIQUE` | `price_date` | `market_prices.price_date` |
| `unique_company_price_date_source` | `UNIQUE` | `price_date` | `market_prices.source` |
| `unique_company_price_date_source` | `UNIQUE` | `price_date` | `market_prices.company_id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `idx_market_prices_company_id` | `CREATE INDEX idx_market_prices_company_id ON defaultdb.public.market_prices USING btree (company_id ASC)` |
| `idx_market_prices_price_date` | `CREATE INDEX idx_market_prices_price_date ON defaultdb.public.market_prices USING btree (price_date ASC)` |
| `idx_market_prices_source` | `CREATE INDEX idx_market_prices_source ON defaultdb.public.market_prices USING btree (source ASC)` |
| `market_prices_pkey` | `CREATE UNIQUE INDEX market_prices_pkey ON defaultdb.public.market_prices USING btree (id ASC)` |
| `unique_company_price_date_source` | `CREATE UNIQUE INDEX unique_company_price_date_source ON defaultdb.public.market_prices USING btree (company_id ASC, price_date ASC, source ASC)` |

### 📋 Table: `public.market_sources`
- **Baseline Row Count:** `17` (CockroachDB) | `17` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `text` | `NO` | `-` |
| 2 | **`name`** | `text` | `NO` | `-` |
| 3 | **`priority`** | `bigint` | `YES` | `1` |
| 4 | **`enabled`** | `boolean` | `YES` | `true` |
| 5 | **`created_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `market_sources_name_key` | `UNIQUE` | `name` | `market_sources.name` |
| `market_sources_pkey` | `PRIMARY KEY` | `id` | `market_sources.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `market_sources_name_key` | `CREATE UNIQUE INDEX market_sources_name_key ON defaultdb.public.market_sources USING btree (name ASC)` |
| `market_sources_pkey` | `CREATE UNIQUE INDEX market_sources_pkey ON defaultdb.public.market_sources USING btree (id ASC)` |

### 📋 Table: `public.orderbook_snapshots`
- **Baseline Row Count:** `0` (CockroachDB) | `0` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`company_id`** | `uuid` | `YES` | `-` |
| 3 | **`symbol`** | `character varying` | `NO` | `-` |
| 4 | **`total_bid_qty`** | `numeric` | `YES` | `0` |
| 5 | **`total_ask_qty`** | `numeric` | `YES` | `0` |
| 6 | **`ofi_ratio`** | `numeric` | `YES` | `1.0` |
| 7 | **`imbalance_signal`** | `character varying` | `YES` | `'balanced'` |
| 8 | **`top_bids_json`** | `jsonb` | `YES` | `'[]'` |
| 9 | **`top_asks_json`** | `jsonb` | `YES` | `'[]'` |
| 10 | **`snapshot_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `orderbook_snapshots_company_id_fkey` | `FOREIGN KEY` | `company_id` | `companies.id` |
| `orderbook_snapshots_pkey` | `PRIMARY KEY` | `id` | `orderbook_snapshots.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `idx_orderbook_snapshots_company` | `CREATE INDEX idx_orderbook_snapshots_company ON defaultdb.public.orderbook_snapshots USING btree (company_id ASC, snapshot_at ASC)` |
| `orderbook_snapshots_pkey` | `CREATE UNIQUE INDEX orderbook_snapshots_pkey ON defaultdb.public.orderbook_snapshots USING btree (id ASC)` |

### 📋 Table: `public.price_volume_levels`
- **Baseline Row Count:** `0` (CockroachDB) | `0` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`company_id`** | `uuid` | `YES` | `-` |
| 3 | **`symbol`** | `character varying` | `NO` | `-` |
| 4 | **`level_type`** | `character varying` | `NO` | `-` |
| 5 | **`price`** | `numeric` | `NO` | `-` |
| 6 | **`strength_score`** | `numeric` | `YES` | `0.5` |
| 7 | **`details_ar`** | `text` | `YES` | `-` |
| 8 | **`calculated_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `price_volume_levels_company_id_fkey` | `FOREIGN KEY` | `company_id` | `companies.id` |
| `price_volume_levels_pkey` | `PRIMARY KEY` | `id` | `price_volume_levels.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `idx_price_volume_levels_company` | `CREATE INDEX idx_price_volume_levels_company ON defaultdb.public.price_volume_levels USING btree (company_id ASC, level_type ASC)` |
| `price_volume_levels_pkey` | `CREATE UNIQUE INDEX price_volume_levels_pkey ON defaultdb.public.price_volume_levels USING btree (id ASC)` |

### 📋 Table: `public.recommended_trades`
- **Baseline Row Count:** `1,545` (CockroachDB) | `1,220` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`company_id`** | `uuid` | `YES` | `-` |
| 3 | **`symbol`** | `text` | `NO` | `-` |
| 4 | **`direction`** | `text` | `NO` | `'buy'` |
| 5 | **`entry_price`** | `numeric` | `NO` | `-` |
| 6 | **`tp1`** | `numeric` | `NO` | `-` |
| 7 | **`tp2`** | `numeric` | `NO` | `-` |
| 8 | **`sl`** | `numeric` | `NO` | `-` |
| 9 | **`timeframe`** | `text` | `NO` | `-` |
| 10 | **`status`** | `text` | `NO` | `'active'` |
| 11 | **`exit_reason`** | `text` | `YES` | `-` |
| 12 | **`exit_price`** | `numeric` | `YES` | `-` |
| 13 | **`pnl_percent`** | `numeric` | `YES` | `-` |
| 14 | **`ml_probability`** | `numeric` | `YES` | `-` |
| 15 | **`win_rate_hist`** | `numeric` | `YES` | `-` |
| 16 | **`features_snapshot`** | `jsonb` | `YES` | `-` |
| 17 | **`recommended_at`** | `timestamp with time zone` | `YES` | `now()` |
| 18 | **`closed_at`** | `timestamp with time zone` | `YES` | `-` |
| 19 | **`flow_signal`** | `character varying` | `YES` | `-` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `recommended_trades_company_id_fkey` | `FOREIGN KEY` | `company_id` | `companies.id` |
| `recommended_trades_pkey` | `PRIMARY KEY` | `id` | `recommended_trades.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `idx_rec_trades_status` | `CREATE INDEX idx_rec_trades_status ON defaultdb.public.recommended_trades USING btree (status ASC)` |
| `idx_rec_trades_symbol` | `CREATE INDEX idx_rec_trades_symbol ON defaultdb.public.recommended_trades USING btree (symbol ASC)` |
| `recommended_trades_pkey` | `CREATE UNIQUE INDEX recommended_trades_pkey ON defaultdb.public.recommended_trades USING btree (id ASC)` |

### 📋 Table: `public.seasonality_patterns`
- **Baseline Row Count:** `2,688` (CockroachDB) | `2,688` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`company_id`** | `uuid` | `YES` | `-` |
| 3 | **`symbol`** | `character varying` | `NO` | `-` |
| 4 | **`month`** | `bigint` | `NO` | `-` |
| 5 | **`avg_return_pct`** | `numeric` | `YES` | `0.0` |
| 6 | **`win_rate`** | `numeric` | `YES` | `50.0` |
| 7 | **`sample_size`** | `bigint` | `YES` | `5` |
| 8 | **`is_bullish_season`** | `boolean` | `YES` | `false` |
| 9 | **`calculated_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `seasonality_patterns_company_id_fkey` | `FOREIGN KEY` | `company_id` | `companies.id` |
| `seasonality_patterns_company_id_month_key` | `UNIQUE` | `month` | `seasonality_patterns.company_id` |
| `seasonality_patterns_company_id_month_key` | `UNIQUE` | `company_id` | `seasonality_patterns.company_id` |
| `seasonality_patterns_company_id_month_key` | `UNIQUE` | `month` | `seasonality_patterns.month` |
| `seasonality_patterns_company_id_month_key` | `UNIQUE` | `company_id` | `seasonality_patterns.month` |
| `seasonality_patterns_pkey` | `PRIMARY KEY` | `id` | `seasonality_patterns.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `idx_seasonality_patterns_company` | `CREATE INDEX idx_seasonality_patterns_company ON defaultdb.public.seasonality_patterns USING btree (company_id ASC, month ASC)` |
| `seasonality_patterns_company_id_month_key` | `CREATE UNIQUE INDEX seasonality_patterns_company_id_month_key ON defaultdb.public.seasonality_patterns USING btree (company_id ASC, month ASC)` |
| `seasonality_patterns_pkey` | `CREATE UNIQUE INDEX seasonality_patterns_pkey ON defaultdb.public.seasonality_patterns USING btree (id ASC)` |

### 📋 Table: `public.sector_investor_flows`
- **Baseline Row Count:** `1,032` (CockroachDB) | `1,032` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `bigint` | `NO` | `unique_rowid()` |
| 2 | **`trade_date`** | `date` | `NO` | `-` |
| 3 | **`sector_name`** | `text` | `NO` | `-` |
| 4 | **`foreigners_net_egp`** | `numeric` | `YES` | `-` |
| 5 | **`egyptian_inst_net_egp`** | `numeric` | `YES` | `-` |
| 6 | **`total_volume_egp`** | `numeric` | `YES` | `-` |
| 7 | **`source`** | `character varying` | `YES` | `'EGX_OFFICIAL'` |
| 8 | **`created_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `sector_investor_flows_pkey` | `PRIMARY KEY` | `id` | `sector_investor_flows.id` |
| `sector_investor_flows_trade_date_sector_name_key` | `UNIQUE` | `trade_date` | `sector_investor_flows.trade_date` |
| `sector_investor_flows_trade_date_sector_name_key` | `UNIQUE` | `sector_name` | `sector_investor_flows.sector_name` |
| `sector_investor_flows_trade_date_sector_name_key` | `UNIQUE` | `trade_date` | `sector_investor_flows.sector_name` |
| `sector_investor_flows_trade_date_sector_name_key` | `UNIQUE` | `sector_name` | `sector_investor_flows.trade_date` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `sector_investor_flows_pkey` | `CREATE UNIQUE INDEX sector_investor_flows_pkey ON defaultdb.public.sector_investor_flows USING btree (id ASC)` |
| `sector_investor_flows_trade_date_sector_name_key` | `CREATE UNIQUE INDEX sector_investor_flows_trade_date_sector_name_key ON defaultdb.public.sector_investor_flows USING btree (trade_date ASC, sector_name ASC)` |

### 📋 Table: `public.shariah_audit_log`
- **Baseline Row Count:** `0` (CockroachDB) | `0` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`company_id`** | `uuid` | `YES` | `-` |
| 3 | **`old_status`** | `boolean` | `YES` | `-` |
| 4 | **`new_status`** | `boolean` | `YES` | `-` |
| 5 | **`review_date`** | `timestamp with time zone` | `YES` | `now()` |
| 6 | **`created_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `shariah_audit_log_company_id_fkey` | `FOREIGN KEY` | `company_id` | `companies.id` |
| `shariah_audit_log_pkey` | `PRIMARY KEY` | `id` | `shariah_audit_log.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `idx_shariah_audit_log_company_id` | `CREATE INDEX idx_shariah_audit_log_company_id ON defaultdb.public.shariah_audit_log USING btree (company_id ASC)` |
| `idx_shariah_audit_log_review_date` | `CREATE INDEX idx_shariah_audit_log_review_date ON defaultdb.public.shariah_audit_log USING btree (review_date ASC)` |
| `shariah_audit_log_pkey` | `CREATE UNIQUE INDEX shariah_audit_log_pkey ON defaultdb.public.shariah_audit_log USING btree (id ASC)` |

### 📋 Table: `public.signal_stats`
- **Baseline Row Count:** `1,000` (CockroachDB) | `2,055` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`company_id`** | `uuid` | `YES` | `-` |
| 3 | **`symbol`** | `text` | `NO` | `-` |
| 4 | **`timeframe`** | `text` | `NO` | `-` |
| 5 | **`signal_type`** | `text` | `NO` | `-` |
| 6 | **`total_signals`** | `bigint` | `NO` | `0` |
| 7 | **`tp1_hits`** | `bigint` | `NO` | `0` |
| 8 | **`tp2_hits`** | `bigint` | `NO` | `0` |
| 9 | **`avg_bars_tp1`** | `numeric` | `YES` | `-` |
| 10 | **`avg_bars_tp2`** | `numeric` | `YES` | `-` |
| 11 | **`win_rate_tp1`** | `numeric` | `YES` | `-` |
| 12 | **`win_rate_tp2`** | `numeric` | `YES` | `-` |
| 13 | **`last_updated`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `signal_stats_company_id_fkey` | `FOREIGN KEY` | `company_id` | `companies.id` |
| `signal_stats_company_id_timeframe_signal_type_key` | `UNIQUE` | `company_id` | `signal_stats.signal_type` |
| `signal_stats_company_id_timeframe_signal_type_key` | `UNIQUE` | `company_id` | `signal_stats.company_id` |
| `signal_stats_company_id_timeframe_signal_type_key` | `UNIQUE` | `timeframe` | `signal_stats.timeframe` |
| `signal_stats_company_id_timeframe_signal_type_key` | `UNIQUE` | `timeframe` | `signal_stats.signal_type` |
| `signal_stats_company_id_timeframe_signal_type_key` | `UNIQUE` | `timeframe` | `signal_stats.company_id` |
| `signal_stats_company_id_timeframe_signal_type_key` | `UNIQUE` | `signal_type` | `signal_stats.timeframe` |
| `signal_stats_company_id_timeframe_signal_type_key` | `UNIQUE` | `signal_type` | `signal_stats.signal_type` |
| `signal_stats_company_id_timeframe_signal_type_key` | `UNIQUE` | `signal_type` | `signal_stats.company_id` |
| `signal_stats_company_id_timeframe_signal_type_key` | `UNIQUE` | `company_id` | `signal_stats.timeframe` |
| `signal_stats_pkey` | `PRIMARY KEY` | `id` | `signal_stats.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `signal_stats_company_id_timeframe_signal_type_key` | `CREATE UNIQUE INDEX signal_stats_company_id_timeframe_signal_type_key ON defaultdb.public.signal_stats USING btree (company_id ASC, timeframe ASC, signal_type ASC)` |
| `signal_stats_pkey` | `CREATE UNIQUE INDEX signal_stats_pkey ON defaultdb.public.signal_stats USING btree (id ASC)` |

### 📋 Table: `public.system_settings`
- **Baseline Row Count:** `1` (CockroachDB) | `1` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`key`** | `text` | `NO` | `-` |
| 2 | **`value`** | `jsonb` | `NO` | `-` |
| 3 | **`updated_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `system_settings_pkey` | `PRIMARY KEY` | `key` | `system_settings.key` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `system_settings_pkey` | `CREATE UNIQUE INDEX system_settings_pkey ON defaultdb.public.system_settings USING btree (key ASC)` |

### 📋 Table: `public.technical_levels`
- **Baseline Row Count:** `0` (CockroachDB) | `0` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`company_id`** | `uuid` | `YES` | `-` |
| 3 | **`symbol`** | `character varying` | `NO` | `-` |
| 4 | **`level_type`** | `character varying` | `NO` | `-` |
| 5 | **`price`** | `numeric` | `NO` | `-` |
| 6 | **`confidence_score`** | `numeric` | `YES` | `0.8` |
| 7 | **`timeframe`** | `character varying` | `YES` | `'1d'` |
| 8 | **`details_ar`** | `text` | `YES` | `-` |
| 9 | **`calculated_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `technical_levels_company_id_fkey` | `FOREIGN KEY` | `company_id` | `companies.id` |
| `technical_levels_pkey` | `PRIMARY KEY` | `id` | `technical_levels.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `idx_technical_levels_company` | `CREATE INDEX idx_technical_levels_company ON defaultdb.public.technical_levels USING btree (company_id ASC, level_type ASC)` |
| `technical_levels_pkey` | `CREATE UNIQUE INDEX technical_levels_pkey ON defaultdb.public.technical_levels USING btree (id ASC)` |

### 📋 Table: `public.user_profiles`
- **Baseline Row Count:** `1` (CockroachDB) | `1` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `-` |
| 2 | **`email`** | `text` | `YES` | `-` |
| 3 | **`full_name`** | `text` | `YES` | `-` |
| 4 | **`role`** | `text` | `YES` | `'user'` |
| 5 | **`default_capital`** | `numeric` | `YES` | `-` |
| 6 | **`default_risk_pct`** | `numeric` | `YES` | `-` |
| 7 | **`created_at`** | `timestamp with time zone` | `YES` | `now()` |
| 8 | **`updated_at`** | `timestamp with time zone` | `YES` | `now()` |
| 9 | **`subscription_end`** | `timestamp with time zone` | `YES` | `-` |
| 10 | **`plan`** | `text` | `YES` | `-` |
| 11 | **`preferred_sectors`** | `text` | `YES` | `-` |
| 12 | **`referral_code`** | `text` | `YES` | `-` |
| 13 | **`referred_by`** | `text` | `YES` | `-` |
| 14 | **`referral_count`** | `text` | `YES` | `-` |
| 15 | **`referral_months`** | `text` | `YES` | `-` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `user_profiles_pkey` | `PRIMARY KEY` | `id` | `user_profiles.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `user_profiles_pkey` | `CREATE UNIQUE INDEX user_profiles_pkey ON defaultdb.public.user_profiles USING btree (id ASC)` |

### 📋 Table: `public.volume_profiles`
- **Baseline Row Count:** `0` (CockroachDB) | `6` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`company_id`** | `uuid` | `YES` | `-` |
| 3 | **`symbol`** | `character varying` | `NO` | `-` |
| 4 | **`period`** | `character varying` | `NO` | `'30d'` |
| 5 | **`vpoc`** | `numeric` | `NO` | `-` |
| 6 | **`vah`** | `numeric` | `NO` | `-` |
| 7 | **`val`** | `numeric` | `NO` | `-` |
| 8 | **`poc_volume`** | `numeric` | `YES` | `0` |
| 9 | **`total_volume`** | `numeric` | `YES` | `0` |
| 10 | **`calculated_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `volume_profiles_company_id_fkey` | `FOREIGN KEY` | `company_id` | `companies.id` |
| `volume_profiles_pkey` | `PRIMARY KEY` | `id` | `volume_profiles.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `idx_volume_profiles_company` | `CREATE INDEX idx_volume_profiles_company ON defaultdb.public.volume_profiles USING btree (company_id ASC, period ASC)` |
| `volume_profiles_pkey` | `CREATE UNIQUE INDEX volume_profiles_pkey ON defaultdb.public.volume_profiles USING btree (id ASC)` |

### 📋 Table: `public.watchlist_items`
- **Baseline Row Count:** `0` (CockroachDB) | `0` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`watchlist_id`** | `uuid` | `YES` | `-` |
| 3 | **`company_id`** | `uuid` | `YES` | `-` |
| 4 | **`created_at`** | `timestamp with time zone` | `YES` | `now()` |
| 5 | **`updated_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `unique_watchlist_company` | `UNIQUE` | `company_id` | `watchlist_items.company_id` |
| `unique_watchlist_company` | `UNIQUE` | `company_id` | `watchlist_items.watchlist_id` |
| `unique_watchlist_company` | `UNIQUE` | `watchlist_id` | `watchlist_items.company_id` |
| `unique_watchlist_company` | `UNIQUE` | `watchlist_id` | `watchlist_items.watchlist_id` |
| `watchlist_items_company_id_fkey` | `FOREIGN KEY` | `company_id` | `companies.id` |
| `watchlist_items_pkey` | `PRIMARY KEY` | `id` | `watchlist_items.id` |
| `watchlist_items_watchlist_id_fkey` | `FOREIGN KEY` | `watchlist_id` | `watchlists.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `unique_watchlist_company` | `CREATE UNIQUE INDEX unique_watchlist_company ON defaultdb.public.watchlist_items USING btree (watchlist_id ASC, company_id ASC)` |
| `watchlist_items_pkey` | `CREATE UNIQUE INDEX watchlist_items_pkey ON defaultdb.public.watchlist_items USING btree (id ASC)` |

### 📋 Table: `public.watchlists`
- **Baseline Row Count:** `1` (CockroachDB) | `0` (Supabase)

#### Columns
| # | Column Name | Type | Nullable | Default |
| :-: | :--- | :--- | :-: | :--- |
| 1 | **`id`** | `uuid` | `NO` | `gen_random_uuid()` |
| 2 | **`name`** | `text` | `NO` | `-` |
| 3 | **`created_at`** | `timestamp with time zone` | `YES` | `now()` |
| 4 | **`updated_at`** | `timestamp with time zone` | `YES` | `now()` |

#### Constraints (PK, FK, Unique)
| Constraint Name | Type | Column | Target Reference |
| :--- | :--- | :--- | :--- |
| `watchlists_name_key` | `UNIQUE` | `name` | `watchlists.name` |
| `watchlists_pkey` | `PRIMARY KEY` | `id` | `watchlists.id` |

#### Indexes
| Index Name | Definition |
| :--- | :--- |
| `watchlists_name_key` | `CREATE UNIQUE INDEX watchlists_name_key ON defaultdb.public.watchlists USING btree (name ASC)` |
| `watchlists_pkey` | `CREATE UNIQUE INDEX watchlists_pkey ON defaultdb.public.watchlists USING btree (id ASC)` |

---
## 4. Functions & Stored Procedures (`public` schema)
_No user-defined functions or stored procedures found in public schema._

---
## 5. Row-Level Security (RLS) & Policies
| Table Name | RLS Enabled (RowSecurity) |
| :--- | :---: |
| `public.market_sources` | `False` |
| `public.companies` | `False` |
| `public.market_prices` | `False` |
| `public.import_jobs` | `False` |
| `public.company_news` | `False` |
| `public.watchlists` | `False` |
| `public.watchlist_items` | `False` |
| `public.shariah_audit_log` | `False` |
| `public.historical_prices` | `False` |
| `public.signal_stats` | `False` |
| `public.corporate_disclosures` | `False` |
| `public.recommended_trades` | `False` |
| `public.system_settings` | `False` |
| `public.company_fundamentals` | `False` |
| `public.user_profiles` | `False` |
| `public.intraday_snapshots` | `False` |
| `public.daily_investor_flows` | `False` |
| `public.sector_investor_flows` | `False` |
| `public.corporate_events` | `False` |
| `public.insider_trading` | `False` |
| `public.volume_profiles` | `False` |
| `public.price_volume_levels` | `False` |
| `public.orderbook_snapshots` | `False` |
| `public.technical_levels` | `False` |
| `public.seasonality_patterns` | `False` |
| `public.market_breadth_snapshots` | `False` |
| `public.egx_shariah_index` | `False` |
