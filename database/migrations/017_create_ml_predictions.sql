-- Migration: 017_create_ml_predictions.sql
CREATE TABLE IF NOT EXISTS ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  timeframe TEXT NOT NULL DEFAULT '1d',
  probability NUMERIC NOT NULL,
  signal_type TEXT NOT NULL,
  predicted_date DATE DEFAULT CURRENT_DATE,
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_company_tf_pred_date UNIQUE (company_id, timeframe, predicted_date)
);

CREATE INDEX IF NOT EXISTS idx_ml_predictions_company_id ON ml_predictions(company_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_predicted_date ON ml_predictions(predicted_date);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_predicted_at ON ml_predictions(predicted_at);
