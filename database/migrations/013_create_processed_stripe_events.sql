-- Migration 013: Create processed_stripe_events table to prevent duplicate webhook delivery execution
-- Created At: 2026-07-19T02:29:00+03:00

CREATE TABLE IF NOT EXISTS processed_stripe_events (
  event_id     TEXT PRIMARY KEY,
  event_type   TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE processed_stripe_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_stripe_events" ON processed_stripe_events FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
  )
);
