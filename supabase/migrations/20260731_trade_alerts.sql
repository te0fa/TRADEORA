-- ============================================================
-- Migration: Create trade_alerts table
-- للتنبيهات اللحظية عبر Supabase Realtime
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trade_alerts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id    UUID REFERENCES public.recommended_trades(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol      TEXT NOT NULL,
  reason      TEXT NOT NULL,          -- machine key: 'trailing_stop', 'rsi_exhaustion', etc.
  reason_ar   TEXT NOT NULL,          -- Arabic message shown to user
  urgency     TEXT NOT NULL CHECK (urgency IN ('critical', 'high', 'medium', 'low')),
  pnl_pct     NUMERIC(10, 2),
  exit_price  NUMERIC(12, 4),
  new_sl      NUMERIC(12, 4),
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user-based queries
CREATE INDEX IF NOT EXISTS idx_trade_alerts_user_id   ON public.trade_alerts (user_id);
CREATE INDEX IF NOT EXISTS idx_trade_alerts_trade_id  ON public.trade_alerts (trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_alerts_urgency   ON public.trade_alerts (urgency);
CREATE INDEX IF NOT EXISTS idx_trade_alerts_created   ON public.trade_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_alerts_unread    ON public.trade_alerts (user_id, is_read) WHERE is_read = false;

-- Row Level Security
ALTER TABLE public.trade_alerts ENABLE ROW LEVEL SECURITY;

-- Users can read their own alerts OR broadcast alerts (user_id IS NULL)
CREATE POLICY "Users can read own alerts" ON public.trade_alerts
  FOR SELECT USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Only service role can insert/update
CREATE POLICY "Service role only insert" ON public.trade_alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role only update" ON public.trade_alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable Realtime on this table (run in Supabase Dashboard → Database → Replication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_alerts;

-- Auto-cleanup: delete alerts older than 7 days (optional cron)
-- DELETE FROM public.trade_alerts WHERE created_at < NOW() - INTERVAL '7 days';

-- ============================================================
-- Add telegram_chat_id to profiles (for per-user Telegram DMs)
-- ============================================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number  TEXT,
  ADD COLUMN IF NOT EXISTS notify_telegram  BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_push      BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_urgency   TEXT DEFAULT 'high'  -- 'critical' | 'high' | 'medium'
    CHECK (notify_urgency IN ('critical', 'high', 'medium', 'low'));

COMMENT ON COLUMN public.profiles.telegram_chat_id IS 'Telegram chat ID for per-user DM alerts';
COMMENT ON COLUMN public.profiles.notify_urgency   IS 'Minimum urgency level to trigger notifications';
