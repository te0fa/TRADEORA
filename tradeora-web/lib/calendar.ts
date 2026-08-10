/**
 * tradeora-web/lib/calendar.ts
 * =============================
 * Authoritative EGX Trading Calendar & Session Manager (TypeScript)
 * Single source of truth for market sessions, holidays, Ramadan hours,
 * and dynamic IANA Africa/Cairo timezone management.
 */

export interface HolidayMetadata {
  name: string;
  type: 'NATIONAL' | 'RELIGIOUS' | 'EXCEPTIONAL';
}

export const OFFICIAL_EGX_HOLIDAYS_2026: Record<string, HolidayMetadata> = {
  '2026-01-07': { name: 'عيد الميلاد المجيد (Coptic Christmas)', type: 'RELIGIOUS' },
  '2026-01-25': { name: 'عيد الشرطة وثورة 25 يناير (Police Day / Jan 25)', type: 'NATIONAL' },
  '2026-03-20': { name: 'عيد الفطر المبارك - وقفة (Eid al-Fitr Eve)', type: 'RELIGIOUS' },
  '2026-03-22': { name: 'عيد الفطر المبارك - اليوم الأول (Eid al-Fitr Day 1)', type: 'RELIGIOUS' },
  '2026-03-23': { name: 'عيد الفطر المبارك - اليوم الثاني (Eid al-Fitr Day 2)', type: 'RELIGIOUS' },
  '2026-03-24': { name: 'عيد الفطر المبارك - اليوم الثالث (Eid al-Fitr Day 3)', type: 'RELIGIOUS' },
  '2026-04-13': { name: 'عيد شم النسيم (Sham El-Nessim)', type: 'NATIONAL' },
  '2026-04-25': { name: 'عيد تحرير سيناء (Sinai Liberation Day)', type: 'NATIONAL' },
  '2026-05-01': { name: 'عيد العمال (Labor Day)', type: 'NATIONAL' },
  '2026-05-26': { name: 'وقفة عرفات (Arafat Day)', type: 'RELIGIOUS' },
  '2026-05-27': { name: 'عيد الأضحى المبارك - اليوم الأول (Eid al-Adha Day 1)', type: 'RELIGIOUS' },
  '2026-05-28': { name: 'عيد الأضحى المبارك - اليوم الثاني (Eid al-Adha Day 2)', type: 'RELIGIOUS' },
  '2026-05-31': { name: 'عيد الأضحى المبارك - عطلة ممتدة (Eid al-Adha Holiday)', type: 'RELIGIOUS' },
  '2026-06-16': { name: 'رأس السنة الهجرية 1448 (Islamic New Year)', type: 'RELIGIOUS' },
  '2026-06-30': { name: 'ثورة 30 يونيو (June 30 Revolution)', type: 'NATIONAL' },
  '2026-07-23': { name: 'ثورة 23 يوليو (July 23 Revolution)', type: 'NATIONAL' },
  '2026-08-25': { name: 'المولد النبوي الشريف (Prophet\'s Birthday)', type: 'RELIGIOUS' },
  '2026-10-06': { name: 'عيد القوات المسلحة / نصر 6 أكتوبر (Armed Forces Day)', type: 'NATIONAL' },
};

export const RAMADAN_2026_START = '2026-02-18';
export const RAMADAN_2026_END = '2026-03-19';

/** Extracts Cairo date string (YYYY-MM-DD) from any Date */
export function getCairoDateStr(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(d);
}

/** Checks if a date falls in Ramadan */
export function isRamadan(dateStr: string): boolean {
  return dateStr >= RAMADAN_2026_START && dateStr <= RAMADAN_2026_END;
}

/** Returns holiday info if the date is a holiday */
export function getHolidayInfo(dateStr: string): HolidayMetadata | null {
  return OFFICIAL_EGX_HOLIDAYS_2026[dateStr] || null;
}

/** Checks if the given date is an official EGX trading day */
export function isTradingDay(d: Date | string): boolean {
  const dateStr = typeof d === 'string' ? d.slice(0, 10) : getCairoDateStr(d);
  const cairoDate = new Date(`${dateStr}T12:00:00+02:00`);
  const day = cairoDate.getDay(); // 0=Sun, 1=Mon... 5=Fri, 6=Sat

  // Friday (5) & Saturday (6) are weekends in EGX
  if (day === 5 || day === 6) {
    return false;
  }

  // Check official holidays
  if (getHolidayInfo(dateStr) !== null) {
    return false;
  }

  return true;
}

export type EGXSessionState = 'PRE_OPEN' | 'OPEN' | 'CLOSED' | 'WEEKEND' | 'HOLIDAY';

export interface EGXSessionStatusResult {
  status: EGXSessionState;
  isOpen: boolean;
  reason: string;
  cairoTime: string;
  isRamadan: boolean;
  sessionOpen: string;
  sessionClose: string;
}

/** Evaluates the current EGX session status */
export function getEGXSessionStatus(now: Date = new Date()): EGXSessionStatusResult {
  const cairoDateStr = getCairoDateStr(now);
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const cairoTimeStr = timeFormatter.format(now);
  const [hour, min] = cairoTimeStr.split(':').map(Number);
  const totalMins = hour * 60 + min;

  const ramadan = isRamadan(cairoDateStr);
  const sessionCloseMins = ramadan ? 13 * 60 + 30 : 14 * 60 + 30; // 13:30 in Ramadan, 14:30 normal
  const preOpenMins = 9 * 60 + 30; // 09:30
  const openMins = 10 * 60; // 10:00

  const cairoDayOfWeek = new Date(`${cairoDateStr}T12:00:00`).getDay();

  if (cairoDayOfWeek === 5 || cairoDayOfWeek === 6) {
    return {
      status: 'WEEKEND',
      isOpen: false,
      reason: 'عطلة نهاية الأسبوع (الجمعة/السبت)',
      cairoTime: cairoTimeStr,
      isRamadan: ramadan,
      sessionOpen: '10:00:00',
      sessionClose: ramadan ? '13:30:00' : '14:30:00',
    };
  }

  const holiday = getHolidayInfo(cairoDateStr);
  if (holiday) {
    return {
      status: 'HOLIDAY',
      isOpen: false,
      reason: holiday.name,
      cairoTime: cairoTimeStr,
      isRamadan: ramadan,
      sessionOpen: '10:00:00',
      sessionClose: ramadan ? '13:30:00' : '14:30:00',
    };
  }

  if (totalMins >= preOpenMins && totalMins < openMins) {
    return {
      status: 'PRE_OPEN',
      isOpen: false,
      reason: 'جلسة الاستكشاف وتسجيل الأوامر قبل الافتتاح',
      cairoTime: cairoTimeStr,
      isRamadan: ramadan,
      sessionOpen: '10:00:00',
      sessionClose: ramadan ? '13:30:00' : '14:30:00',
    };
  }

  if (totalMins >= openMins && totalMins <= sessionCloseMins) {
    return {
      status: 'OPEN',
      isOpen: true,
      reason: 'جلسة التداول مستمرة',
      cairoTime: cairoTimeStr,
      isRamadan: ramadan,
      sessionOpen: '10:00:00',
      sessionClose: ramadan ? '13:30:00' : '14:30:00',
    };
  }

  return {
    status: 'CLOSED',
    isOpen: false,
    reason: 'خارج ساعات التداول الرسمية',
    cairoTime: cairoTimeStr,
    isRamadan: ramadan,
    sessionOpen: '10:00:00',
    sessionClose: ramadan ? '13:30:00' : '14:30:00',
  };
}
