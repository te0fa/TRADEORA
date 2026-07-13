-- Migration 003: Create shariah_audit_log table

CREATE TABLE IF NOT EXISTS shariah_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    old_status BOOLEAN,
    new_status BOOLEAN,
    review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on company_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_shariah_audit_log_company_id ON shariah_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_shariah_audit_log_review_date ON shariah_audit_log(review_date);
