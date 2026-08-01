export const OFFICIAL_EGX33_SHARIAH_SYMBOLS = new Set([
  'ADIB', 'FAIT', 'FAITA', 'SAUD', 'TMGH', 'PHDC', 'MASR', 'OCDI', 'ORHD',
  'JUFO', 'EFID', 'OLFI', 'MPCO', 'EGAL', 'SKPC', 'AMOC', 'ICFC', 'ATQA',
  'ORAS', 'ARCC', 'MCQE', 'LCSW', 'ISPH', 'RMDA', 'ETEL', 'EFIH', 'RACC',
  'ORWE', 'ACGC', 'MTIE', 'IFAP', 'CIRA', 'ETRS', 'EGAS'
]);

export interface ShariahSourceAudit {
  egx33: {
    isListed: boolean;
    labelAr: string;
    labelEn: string;
  };
  boubyan: {
    isCompliant: boolean;
    labelAr: string;
    labelEn: string;
  };
  kasheif: {
    purificationRatio: number;
    isPure: boolean;
    labelAr: string;
    labelEn: string;
  };
}

export function getShariahAudit(company: {
  symbol?: string;
  is_shariah_compliant?: boolean | null;
  is_egx33_shariah?: boolean | null;
  is_boubyan_compliant?: boolean | null;
  purification_ratio?: number | null;
}): ShariahSourceAudit {
  const sym = (company.symbol || '').toUpperCase();

  // 1. EGX 33 Shariah Index (Official)
  const isEgx33 = company.is_egx33_shariah ?? OFFICIAL_EGX33_SHARIAH_SYMBOLS.has(sym);

  // 2. Boubyan Sharia Standards
  const isBoubyan = company.is_boubyan_compliant ?? Boolean(company.is_shariah_compliant ?? isEgx33);

  // 3. Kasheif Audit & Purification Ratio
  let ratio = company.purification_ratio ?? 0.0;
  if (company.purification_ratio === undefined || company.purification_ratio === null) {
    if (!company.is_shariah_compliant && !isEgx33) {
      ratio = 1.5;
    } else {
      ratio = 0.0;
    }
  }

  const isPure = ratio === 0.0;

  return {
    egx33: {
      isListed: isEgx33,
      labelAr: isEgx33 ? 'مدرج' : 'غير مدرج',
      labelEn: isEgx33 ? 'Listed' : 'Unlisted'
    },
    boubyan: {
      isCompliant: isBoubyan,
      labelAr: isBoubyan ? 'متوافق' : 'يحتاج تطهير',
      labelEn: isBoubyan ? 'Compliant' : 'Needs Purification'
    },
    kasheif: {
      purificationRatio: ratio,
      isPure,
      labelAr: isPure ? 'حلال 100% (تطهير: 0.0%)' : `مختلط (تطهير: ${ratio.toFixed(1)}%)`,
      labelEn: isPure ? '100% Halal (Purif: 0.0%)' : `Mixed (Purif: ${ratio.toFixed(1)}%)`
    }
  };
}
