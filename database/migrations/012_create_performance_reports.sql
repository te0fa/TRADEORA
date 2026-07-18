-- Migration 012: Create performance_reports table
-- Created At: 2026-07-19T02:13:00+03:00

CREATE TABLE IF NOT EXISTS performance_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  overall_stats JSONB NOT NULL,     -- {win_rate, sharpe, max_dd, total_trades, benchmark_return}
  feature_ic   JSONB NOT NULL,     -- List of {feature, ic, p_value}
  by_timeframe JSONB NOT NULL,     -- { "1d": {win_rate, sharpe, max_dd}, ... }
  by_sector    JSONB NOT NULL,     -- { "Banks": {...}, ... }
  by_period    JSONB NOT NULL,     -- monthly performance breakdown
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE performance_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_reports" ON performance_reports FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
  )
);
CREATE POLICY "users_read_reports" ON performance_reports FOR SELECT USING (true);
