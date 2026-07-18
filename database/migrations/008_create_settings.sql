CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings
INSERT INTO system_settings (key, value) VALUES
('risk_management', '{
  "trailing_stop_to_entry": true,
  "min_risk_reward": 1.5,
  "min_ml_probability": 0.58,
  "require_volume_spike": true
}')
ON CONFLICT (key) DO NOTHING;
