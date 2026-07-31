-- ============================================================
-- Migration: Create trade_alerts table + notification settings
-- ============================================================

-- 1. جدول التنبيهات الرئيسي
CREATE TABLE IF NOT EXISTS public.trade_alerts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id    UUID REFERENCES public.recommended_trades(id) ON DELETE CASCADE,
  user_id     UUID,                             -- NULL = broadcast (visible to all)
  symbol      TEXT NOT NULL,
  reason      TEXT NOT NULL,
  reason_ar   TEXT NOT NULL,
  urgency     TEXT NOT NULL CHECK (urgency IN ('critical', 'high', 'medium', 'low')),
  pnl_pct     NUMERIC(10, 2),
  exit_price  NUMERIC(12, 4),
  new_sl      NUMERIC(12, 4),
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trade_alerts_user_id   ON public.trade_alerts (user_id);
CREATE INDEX IF NOT EXISTS idx_trade_alerts_trade_id  ON public.trade_alerts (trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_alerts_urgency   ON public.trade_alerts (urgency);
CREATE INDEX IF NOT EXISTS idx_trade_alerts_created   ON public.trade_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_alerts_unread    ON public.trade_alerts (is_read) WHERE is_read = false;

-- RLS
ALTER TABLE public.trade_alerts ENABLE ROW LEVEL SECURITY;

-- Everyone can read broadcast alerts (user_id IS NULL) or their own
CREATE POLICY "Read own or broadcast alerts" ON public.trade_alerts
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

-- Service role can insert
CREATE POLICY "Service role insert alerts" ON public.trade_alerts
  FOR INSERT WITH CHECK (true);

-- Users can mark their own as read
CREATE POLICY "Users update own alerts" ON public.trade_alerts
  FOR UPDATE USING (user_id IS NULL OR auth.uid() = user_id);

-- Auto-cleanup: remove alerts older than 7 days
-- (يمكن تشغيله يدوياً أو عبر pg_cron)
-- DELETE FROM public.trade_alerts WHERE created_at < NOW() - INTERVAL '7 days';

-- ============================================================
-- 2. إعدادات الإشعارات لكل مستخدم (جدول مستقل بدون profiles)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL UNIQUE,       -- auth.users(id) but no FK to avoid dependency issues
  telegram_chat_id  TEXT,
  whatsapp_number   TEXT,
  notify_telegram   BOOLEAN DEFAULT true,
  notify_push       BOOLEAN DEFAULT true,
  notify_email      BOOLEAN DEFAULT false,
  notify_urgency    TEXT DEFAULT 'high'
                      CHECK (notify_urgency IN ('critical', 'high', 'medium', 'low')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notif_user_id ON public.user_notification_settings (user_id);

ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own settings" ON public.user_notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users upsert own settings" ON public.user_notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 3. Supabase Realtime – فعّل على trade_alerts
-- (شغّل هذا السطر من Supabase Dashboard → Database → Replication
--  أو من SQL Editor)
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_alerts;
