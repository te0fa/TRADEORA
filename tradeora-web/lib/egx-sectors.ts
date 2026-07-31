export const OFFICIAL_EGX_SECTORS = [
  { ar: 'البنوك', en: 'Banks' },
  { ar: 'العقارات', en: 'Real Estate' },
  { ar: 'الخدمات المالية غير المصرفية', en: 'Non-Bank Financial Services' },
  { ar: 'الموارد الأساسية', en: 'Basic Resources' },
  { ar: 'الأغذية والمشروبات والتبغ', en: 'Food, Beverages & Tobacco' },
  { ar: 'الخدمات والمنتجات الصناعية والسيارات', en: 'Industrial Goods, Services & Auto' },
  { ar: 'المقاولات والإنشاءات الهندسية', en: 'Construction & Engineering' },
  { ar: 'الرعاية الصحية والأدوية', en: 'Healthcare & Pharmaceuticals' },
  { ar: 'مواد البناء', en: 'Building Materials' },
  { ar: 'الاتصالات والإعلام وتكنولوجيا المعلومات', en: 'Telecom, Media & IT' },
  { ar: 'السياحة والترفيه', en: 'Tourism & Leisure' },
  { ar: 'المنسوجات والسلع المعمرة', en: 'Textiles & Durables' },
  { ar: 'خدمات النقل والشحن', en: 'Shipping & Transportation' },
  { ar: 'تجارة وموزعون', en: 'Trade & Distributors' },
  { ar: 'الخدمات التعليمية', en: 'Educational Services' },
  { ar: 'الطاقة والخدمات المساندة', en: 'Energy & Support Services' },
  { ar: 'ورق ومواد تعبئة وتغليف', en: 'Paper & Packaging' },
  { ar: 'المرافق', en: 'Utilities' }
] as const;

// Known EGX SME (Small and Medium Enterprises / Tamayuz / N Nile / EGX70) stock symbols
export const KNOWN_SME_SYMBOLS = new Set([
  'NILS', 'UTIP', 'FTWD', 'BIRD', 'DIGI', 'MASR', 'MIPH', 'SMFR', 'EPCO', 'PORT',
  'AIFI', 'ARAB', 'BIOC', 'VERT', 'KRDI', 'MEPA', 'MBEN', 'RICI', 'PRDC', 'UNIP',
  'ALCN', 'ALRA', 'EGTS', 'IDRE', 'GGCC', 'UEGC', 'ELWA', 'AFMC', 'FMTI', 'ICMI'
]);

/**
 * Normalizes raw sector strings from database or APIs to official 18 EGX sector names.
 */
export function normalizeEgxSector(rawSector: string | null | undefined): string {
  if (!rawSector) return 'خدمات متنوعة وقابضة';
  const trimmed = rawSector.trim();

  if (trimmed === 'بنوك' || trimmed === 'Banks' || trimmed === 'Finance') return 'البنوك';
  if (trimmed === 'عقارات' || trimmed === 'Real Estate') return 'العقارات';
  if (trimmed.includes('مالية') || trimmed.includes('استثمار') || trimmed.includes('Financial')) return 'الخدمات المالية غير المصرفية';
  if (trimmed.includes('أسمدة') || trimmed.includes('كيماو') || trimmed.includes('تعدين') || trimmed === 'Basic Resources' || trimmed === 'Process Industries') return 'الموارد الأساسية';
  if (trimmed.includes('غذائ') || trimmed.includes('مشروبات') || trimmed.includes('تبغ') || trimmed === 'Food & Beverages') return 'الأغذية والمشروبات والتبغ';
  if (trimmed.includes('صناع') || trimmed.includes('سيارات') || trimmed === 'Industrial Goods') return 'الخدمات والمنتجات الصناعية والسيارات';
  if (trimmed.includes('مقاولات') || trimmed.includes('إنشاءات') || trimmed === 'Construction') return 'المقاولات والإنشاءات الهندسية';
  if (trimmed.includes('دواء') || trimmed.includes('أدوية') || trimmed.includes('رعاية صحية') || trimmed.includes('طبي') || trimmed === 'Healthcare') return 'الرعاية الصحية والأدوية';
  if (trimmed.includes('أسمنت') || trimmed.includes('مواد بناء') || trimmed === 'Building Materials') return 'مواد البناء';
  if (trimmed.includes('اتصالات') || trimmed.includes('تكنولوجيا') || trimmed.includes('إعلام') || trimmed === 'Technology' || trimmed === 'Telecom') return 'الاتصالات والإعلام وتكنولوجيا المعلومات';
  if (trimmed.includes('سياحة') || trimmed.includes('فنادق') || trimmed === 'Tourism') return 'السياحة والترفيه';
  if (trimmed.includes('نسيج') || trimmed.includes('غزل') || trimmed.includes('ملابس') || trimmed === 'Textiles') return 'المنسوجات والسلع المعمرة';
  if (trimmed.includes('نقل') || trimmed.includes('شحن') || trimmed.includes('ملاحة') || trimmed === 'Transportation') return 'خدمات النقل والشحن';
  if (trimmed.includes('تجارة') || trimmed.includes('توزيع') || trimmed === 'Trade') return 'تجارة وموزعون';
  if (trimmed.includes('تعليم') || trimmed === 'Education') return 'الخدمات التعليمية';
  if (trimmed.includes('طاقة') || trimmed.includes('بترول') || trimmed === 'Energy') return 'الطاقة والخدمات المساندة';
  if (trimmed.includes('ورق') || trimmed.includes('تعبئة') || trimmed === 'Packaging') return 'ورق ومواد تعبئة وتغليف';
  if (trimmed.includes('مرافق') || trimmed.includes('غاز') || trimmed === 'Utilities') return 'المرافق';

  return trimmed;
}

/**
 * Checks if a company is classified as an SME (Small and Medium Enterprise / Tamayuz / EGX70).
 */
export function isSmeStock(company: { symbol?: string; market_type?: string | null; is_sme?: boolean | null }): boolean {
  if (company.is_sme === true) return true;
  if (company.market_type && (company.market_type.toLowerCase() === 'sme' || company.market_type.toLowerCase() === 'tamayuz' || company.market_type.toLowerCase() === 'nile')) return true;
  if (company.symbol && KNOWN_SME_SYMBOLS.has(company.symbol.toUpperCase())) return true;
  return false;
}
