-- Migration 011: Add performance indexes to optimize active trade tracking and alerts
-- Created At: 2026-07-19T02:05:00+03:00

CREATE INDEX IF NOT EXISTS idx_user_trades_user_status ON user_trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_status ON price_alerts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_signal_stats_symbol ON signal_stats(symbol);
