-- Migration: trade_alert_snapshots
-- تُخزّن آخر سعر تم تنبيهه لكل صفقة لتجنب إرسال تنبيهات متكررة
-- الجدول يُستخدم من: /api/cron/signal-monitor

CREATE TABLE IF NOT EXISTS public.trade_alert_snapshots (
  trade_id          TEXT        PRIMARY KEY REFERENCES public.recommended_trades(id) ON DELETE CASCADE,
  snapshotted_price NUMERIC(12, 4) NOT NULL,
  alerted_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  alert_reason      TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_trade_alert_snapshots_alerted_at
  ON public.trade_alert_snapshots(alerted_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_trade_alert_snapshots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trade_alert_snapshots_updated_at ON public.trade_alert_snapshots;
CREATE TRIGGER trg_trade_alert_snapshots_updated_at
  BEFORE UPDATE ON public.trade_alert_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_trade_alert_snapshots_updated_at();

-- RLS: Service role only (cron runs with service key)
ALTER TABLE public.trade_alert_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.trade_alert_snapshots
  FOR ALL USING (auth.role() = 'service_role');
