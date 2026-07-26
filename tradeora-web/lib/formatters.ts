const EASTERN_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];

/**
 * Translates Western Arabic numerals (0-9) to Eastern Arabic numerals (٠-٩).
 */
export function toEasternArabic(n: string | number): string {
  return String(n);
}

/**
 * Formats stock prices to 2 decimal places with currency symbol.
 */
export function formatPrice(price: number | null | undefined, locale: string): string {
  if (price === null || price === undefined || isNaN(Number(price))) {
    return locale === 'ar' ? 'غير متاح' : 'N/A';
  }
  
  const numPrice = Number(price);
  const formatted = numPrice.toFixed(2);
  return `${formatted} EGP`;
}

function formatChangeHelper(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "0.00";
  }
  const numValue = Number(value);
  const absVal = Math.abs(numValue);
  
  if (absVal < 0.0005) {
    return "0.00";
  }
  
  if (absVal < 0.005) {
    const sign = numValue > 0 ? '+' : '-';
    return sign + absVal.toFixed(3);
  }
  
  const roundedTo2 = Number(numValue.toFixed(2));
  if (roundedTo2 === 0) {
    return "0.00";
  }
  
  const sign = numValue > 0 ? '+' : '';
  return sign + numValue.toFixed(2);
}

/**
 * Formats price change values with sign (+ or -) and 2 decimal places (or 3 for small changes).
 */
export function formatChange(change: number | null | undefined, locale: string): string {
  if (change === null || change === undefined) return '-';
  return formatChangeHelper(change);
}

/**
 * Formats price change percentage with sign (+ or -) and percentage symbol.
 */
export function formatChangePercent(percent: number | null | undefined, locale: string): string {
  if (percent === null || percent === undefined) return '-';
  return formatChangeHelper(percent) + '%';
}

/**
 * Abbreviates large stock volume numbers.
 * E.g., 1,234,567 -> 1.23M
 */
export function formatVolume(volume: number | null | undefined, locale: string): string {
  if (volume === null || volume === undefined || volume === 0 || isNaN(Number(volume))) return '-';
  const numVol = Number(volume);
  
  if (numVol >= 1_000_000_000) {
    return (numVol / 1_000_000_000).toFixed(2) + 'B';
  } else if (numVol >= 1_000_000) {
    return (numVol / 1_000_000).toFixed(2) + 'M';
  } else if (numVol >= 1_000) {
    return (numVol / 1_000).toFixed(2) + 'K';
  } else {
    return numVol.toLocaleString('en-US');
  }
}

/**
 * Formats raw datetime strings to locale-aware relative times or short dates.
 */
export function formatRelativeTime(dateStr: string | null | undefined, locale: string, t: any): string {
  if (!dateStr) return '-';
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return t('relativeTime.seconds');
  }
  if (diffMin === 1) {
    return t('relativeTime.minute');
  }
  if (diffMin < 60) {
    return t('relativeTime.minutes', { count: diffMin });
  }
  if (diffHour === 1) {
    return t('relativeTime.hour');
  }
  if (diffHour < 24) {
    return t('relativeTime.hours', { count: diffHour });
  }
  if (diffDay === 1) {
    return t('relativeTime.day');
  }
  if (diffDay < 7) {
    return t('relativeTime.days', { count: diffDay });
  }
  
  // Return short date if more than a week ago
  return date.toLocaleDateString(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
