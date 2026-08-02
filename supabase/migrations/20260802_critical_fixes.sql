-- ================================================================
-- TRADEORA Critical Fixes Migration
-- التاريخ: 2026-08-02
-- كيفية التشغيل:
--   1. افتح: https://supabase.com/dashboard/project/kdjsguozssxvtmlmqhpz/sql/new
--   2. انسخ هذا الملف كله والصقه
--   3. اضغط Run
-- ================================================================

-- ✅ Fix 1: إضافة عمود flow_signal في recommended_trades
ALTER TABLE public.recommended_trades
ADD COLUMN IF NOT EXISTS flow_signal VARCHAR(20) DEFAULT 'neutral';

-- تحديث السجلات الموجودة بقيمة افتراضية
UPDATE public.recommended_trades
SET flow_signal = 'neutral'
WHERE flow_signal IS NULL;

-- ================================================================

-- ✅ Fix 2: إضافة حقول الشريعة في companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS is_egx_shariah_listed      BOOLEAN     DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_boubyan_compliant        BOOLEAN     DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS kasheif_purification_ratio  DECIMAL(5,2);

-- نسخ البيانات الموجودة: is_shariah_compliant → is_boubyan_compliant
UPDATE public.companies
SET is_boubyan_compliant = is_shariah_compliant
WHERE is_boubyan_compliant IS NULL OR is_boubyan_compliant = FALSE;

-- ================================================================

-- ✅ Fix 3: إنشاء جدول egx_shariah_index
CREATE TABLE IF NOT EXISTS public.egx_shariah_index (
    symbol      TEXT PRIMARY KEY,
    added_date  DATE DEFAULT CURRENT_DATE,
    notes       TEXT
);

-- إدراج الـ 33 سهم الرسمية في EGX Shariah Index
INSERT INTO public.egx_shariah_index (symbol) VALUES
('ADIB'), ('FAIT'), ('SAUD'), ('TMGH'), ('PHDC'),
('MASR'), ('OCDI'), ('ORHD'), ('JUFO'), ('EFID'),
('OLFI'), ('MPCO'), ('EGAL'), ('SKPC'), ('AMOC'),
('ICFC'), ('ATQA'), ('ORAS'), ('ARCC'), ('MCQE'),
('LCSW'), ('ISPH'), ('RMDA'), ('ETEL'), ('EFIH'),
('RACC'), ('ORWE'), ('ACGC'), ('MTIE'), ('IFAP'),
('CIRA'), ('ETRS'), ('EGAS')
ON CONFLICT (symbol) DO NOTHING;

-- تحديث is_egx_shariah_listed في جدول companies بناءً على القائمة
UPDATE public.companies c
SET is_egx_shariah_listed = TRUE
WHERE c.symbol IN (SELECT symbol FROM public.egx_shariah_index);

-- ================================================================

-- ✅ Fix 4: إضافة index للـ flow_signal للاستعلام السريع
CREATE INDEX IF NOT EXISTS idx_rec_trades_flow_signal
    ON public.recommended_trades(flow_signal);

CREATE INDEX IF NOT EXISTS idx_companies_egx_shariah
    ON public.companies(is_egx_shariah_listed)
    WHERE is_egx_shariah_listed = TRUE;

-- ================================================================
-- تحقق من النتائج
-- ================================================================
SELECT
    'recommended_trades.flow_signal'   AS check_name,
    COUNT(*)                            AS total_rows,
    COUNT(flow_signal)                  AS non_null
FROM public.recommended_trades

UNION ALL

SELECT
    'companies.is_boubyan_compliant',
    COUNT(*),
    COUNT(*) FILTER (WHERE is_boubyan_compliant = TRUE)
FROM public.companies

UNION ALL

SELECT
    'companies.is_egx_shariah_listed',
    COUNT(*),
    COUNT(*) FILTER (WHERE is_egx_shariah_listed = TRUE)
FROM public.companies

UNION ALL

SELECT
    'egx_shariah_index rows',
    COUNT(*),
    COUNT(*)
FROM public.egx_shariah_index;
