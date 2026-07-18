-- Migration 009: User Profiles and User Trades with RLS Policies

-- 1. Create user_profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user', -- 'user', 'premium', 'admin'
  subscription_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile"
  ON user_profiles FOR ALL
  USING (auth.uid() = id);

-- 2. Create user_trades table linked to auth.users and companies
CREATE TABLE IF NOT EXISTS user_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'buy',
  entry_price NUMERIC NOT NULL,
  shares_count NUMERIC NOT NULL DEFAULT 1,
  tp1 NUMERIC NOT NULL,
  tp2 NUMERIC NOT NULL,
  sl  NUMERIC NOT NULL,
  timeframe TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'tp1_hit', 'closed'
  tp1_hit BOOLEAN DEFAULT FALSE,
  tp1_exit_price NUMERIC,
  exit_price NUMERIC,
  pnl_percent NUMERIC,
  pnl_amount NUMERIC,
  exit_reason TEXT, -- 'tp2', 'sl', 'trailing_sl', 'manual', 'time_exit'
  ml_probability NUMERIC,
  features_snapshot JSONB,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Enable RLS for user_trades
ALTER TABLE user_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_trades"
  ON user_trades FOR ALL
  USING (auth.uid() = user_id);
