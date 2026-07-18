DROP TABLE IF EXISTS watchlists CASCADE;
DROP TABLE IF EXISTS price_alerts CASCADE;
DROP TABLE IF EXISTS user_telegram CASCADE;

-- Watchlist Table
CREATE TABLE watchlists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  symbol     TEXT NOT NULL,
  added_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_watchlist" ON watchlists FOR ALL USING (auth.uid() = user_id);

-- Price Alerts Table
CREATE TABLE price_alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  symbol       TEXT NOT NULL,
  target_price NUMERIC NOT NULL,
  condition    TEXT NOT NULL DEFAULT 'above', -- 'above' / 'below'
  status       TEXT NOT NULL DEFAULT 'active', -- 'active' / 'triggered' / 'cancelled'
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  triggered_at TIMESTAMPTZ
);
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_alerts" ON price_alerts FOR ALL USING (auth.uid() = user_id);

-- Telegram Links Table
CREATE TABLE user_telegram (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id     TEXT NOT NULL,
  verified    BOOLEAN DEFAULT FALSE,
  linked_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_telegram ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_telegram" ON user_telegram FOR ALL USING (auth.uid() = user_id);

-- Trailing Stop Loss Columns
ALTER TABLE user_trades
  ADD COLUMN IF NOT EXISTS trailing_sl BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trailing_pct NUMERIC DEFAULT 2,
  ADD COLUMN IF NOT EXISTS current_sl NUMERIC;

-- Push Subscriptions Table
DROP TABLE IF EXISTS push_subscriptions CASCADE;
CREATE TABLE push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth_key    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_subs" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Alter user_profiles table for sizing settings
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS default_capital NUMERIC DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS default_risk_pct NUMERIC DEFAULT 2,
  ADD COLUMN IF NOT EXISTS preferred_sectors JSONB;
