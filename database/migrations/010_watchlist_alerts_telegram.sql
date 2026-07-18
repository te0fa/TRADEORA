-- Watchlist Table
CREATE TABLE IF NOT EXISTS watchlists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  symbol     TEXT NOT NULL,
  added_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'watchlists' AND policyname = 'users_own_watchlist'
    ) THEN
        CREATE POLICY "users_own_watchlist" ON watchlists FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Price Alerts Table
CREATE TABLE IF NOT EXISTS price_alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id   UUID REFERENCES companies(id),
  symbol       TEXT NOT NULL,
  target_price NUMERIC NOT NULL,
  condition    TEXT NOT NULL DEFAULT 'above', -- 'above' / 'below'
  status       TEXT NOT NULL DEFAULT 'active', -- 'active' / 'triggered' / 'cancelled'
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  triggered_at TIMESTAMPTZ
);
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'price_alerts' AND policyname = 'users_own_alerts'
    ) THEN
        CREATE POLICY "users_own_alerts" ON price_alerts FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Telegram Links Table
CREATE TABLE IF NOT EXISTS user_telegram (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id     TEXT NOT NULL,
  verified    BOOLEAN DEFAULT FALSE,
  linked_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_telegram ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_telegram' AND policyname = 'users_own_telegram'
    ) THEN
        CREATE POLICY "users_own_telegram" ON user_telegram FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;
