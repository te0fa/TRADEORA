-- migrations/18_1_model_health.sql
-- Model Health Monitoring Telemetry Table

CREATE TABLE IF NOT EXISTS public.model_health_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL, -- 'GREEN', 'YELLOW', 'RED', 'INSUFFICIENT_SAMPLE'
    sample_size INT NOT NULL,
    feature_drift_score NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
    prediction_drift_score NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
    live_expectancy NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
    oos_expectancy_ci_lower NUMERIC(8,4) NOT NULL,
    oos_expectancy_ci_upper NUMERIC(8,4) NOT NULL,
    human_review_required BOOLEAN NOT NULL DEFAULT FALSE,
    reason TEXT NOT NULL
);
