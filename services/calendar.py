"""
services/calendar.py — Authoritative EGX Trading Calendar & Session Manager
===========================================================================
Single source of truth for all EGX market calendar, holidays, session hours,
Ramadan schedules, and dynamic IANA timezone conversions (Africa/Cairo).

Handles dynamic DST (EEST UTC+3 in summer / EET UTC+2 in winter) per Law 24/2023.
"""

import os
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo
from typing import Optional, Dict, Any, List

EGYPT_TZ = ZoneInfo("Africa/Cairo")
UTC_TZ = ZoneInfo("UTC")

# ── Official 2026 EGX Holidays (Official Exchange & National Gazettes) ───────
OFFICIAL_HOLIDAYS_2026: Dict[str, Dict[str, str]] = {
    "2026-01-07": {"name": "عيد الميلاد المجيد (Coptic Christmas)", "type": "RELIGIOUS"},
    "2026-01-25": {"name": "عيد الشرطة وثورة 25 يناير (Police Day / Jan 25)", "type": "NATIONAL"},
    "2026-03-20": {"name": "عيد الفطر المبارك - وقفة (Eid al-Fitr Eve)", "type": "RELIGIOUS"},
    "2026-03-22": {"name": "عيد الفطر المبارك - اليوم الأول (Eid al-Fitr Day 1)", "type": "RELIGIOUS"},
    "2026-03-23": {"name": "عيد الفطر المبارك - اليوم الثاني (Eid al-Fitr Day 2)", "type": "RELIGIOUS"},
    "2026-03-24": {"name": "عيد الفطر المبارك - اليوم الثالث (Eid al-Fitr Day 3)", "type": "RELIGIOUS"},
    "2026-04-13": {"name": "عيد شم النسيم (Sham El-Nessim)", "type": "NATIONAL"},
    "2026-04-25": {"name": "عيد تحرير سيناء (Sinai Liberation Day)", "type": "NATIONAL"},
    "2026-05-01": {"name": "عيد العمال (Labor Day)", "type": "NATIONAL"},
    "2026-05-26": {"name": "وقفة عرفات (Arafat Day)", "type": "RELIGIOUS"},
    "2026-05-27": {"name": "عيد الأضحى المبارك - اليوم الأول (Eid al-Adha Day 1)", "type": "RELIGIOUS"},
    "2026-05-28": {"name": "عيد الأضحى المبارك - اليوم الثاني (Eid al-Adha Day 2)", "type": "RELIGIOUS"},
    "2026-05-31": {"name": "عيد الأضحى المبارك - عطلة ممتدة (Eid al-Adha Holiday)", "type": "RELIGIOUS"},
    "2026-06-16": {"name": "رأس السنة الهجرية 1448 (Islamic New Year)", "type": "RELIGIOUS"},
    "2026-06-30": {"name": "ثورة 30 يونيو (June 30 Revolution)", "type": "NATIONAL"},
    "2026-07-23": {"name": "ثورة 23 يوليو (July 23 Revolution)", "type": "NATIONAL"},
    "2026-08-25": {"name": "المولد النبوي الشريف (Prophet's Birthday)", "type": "RELIGIOUS"},
    "2026-10-06": {"name": "عيد القوات المسلحة / نصر 6 أكتوبر (Armed Forces Day)", "type": "NATIONAL"},
}

# ── Ramadan 2026 Date Range (Shortened session 10:00 - 13:30) ─────────────────
RAMADAN_2026_START = date(2026, 2, 18)
RAMADAN_2026_END = date(2026, 3, 19)

# Standard Session Times (Cairo Local)
STANDARD_OPEN_TIME = time(10, 0, 0)
STANDARD_CLOSE_TIME = time(14, 30, 0)
RAMADAN_CLOSE_TIME = time(13, 30, 0)


def parse_date(d: date | datetime | str) -> date:
    """Parses various date representations into a standard date object."""
    if isinstance(d, datetime):
        return d.date()
    if isinstance(d, date):
        return d
    if isinstance(d, str):
        # Support YYYY-MM-DD or ISO strings
        return datetime.fromisoformat(d.replace("Z", "+00:00")).date()
    raise ValueError(f"Unsupported date format: {d}")


def is_ramadan(d: date | datetime | str) -> bool:
    """Checks if a given date falls within Ramadan trading schedule."""
    dt = parse_date(d)
    return RAMADAN_2026_START <= dt <= RAMADAN_2026_END


def get_holiday_info(d: date | datetime | str) -> Optional[Dict[str, str]]:
    """Returns official holiday metadata if the date is an exchange holiday."""
    dt = parse_date(d)
    date_str = dt.isoformat()
    if date_str in OFFICIAL_HOLIDAYS_2026:
        return OFFICIAL_HOLIDAYS_2026[date_str]
    return None


def is_trading_day(d: date | datetime | str) -> bool:
    """
    Evaluates whether a given calendar date is an official active EGX trading day.
    Conditions:
      1. Must be Sunday (6 in python weekday / 0 in JS) through Thursday (3 in python weekday / 4 in JS).
      2. Must NOT be an official public/religious holiday.
    """
    dt = parse_date(d)
    # Python weekday: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
    # EGX Weekend: Friday (4) and Saturday (5)
    if dt.weekday() in (4, 5):
        return False
    
    # Check official holiday registry
    if get_holiday_info(dt) is not None:
        return False
        
    return True


def get_session_bounds(d: date | datetime | str) -> Dict[str, Any]:
    """
    Computes precise local and UTC session opening/closing timestamps for a given date.
    Dynamically resolves Daylight Saving Time (DST UTC+2 / UTC+3) for Cairo.
    """
    dt = parse_date(d)
    is_trading = is_trading_day(dt)
    ramadan = is_ramadan(dt)
    holiday = get_holiday_info(dt)

    open_t = STANDARD_OPEN_TIME
    close_t = RAMADAN_CLOSE_TIME if ramadan else STANDARD_CLOSE_TIME

    # Construct localized datetime in Africa/Cairo
    open_local = datetime.combine(dt, open_t, tzinfo=EGYPT_TZ)
    close_local = datetime.combine(dt, close_t, tzinfo=EGYPT_TZ)

    # Convert to exact UTC
    open_utc = open_local.astimezone(UTC_TZ)
    close_utc = close_local.astimezone(UTC_TZ)

    return {
        "calendar_date": dt.isoformat(),
        "is_trading_day": is_trading,
        "is_ramadan": ramadan,
        "holiday": holiday,
        "session_open_local": open_t.strftime("%H:%M:%S"),
        "session_close_local": close_t.strftime("%H:%M:%S"),
        "session_open_utc": open_utc.strftime("%H:%M:%SZ"),
        "session_close_utc": close_utc.strftime("%H:%M:%SZ"),
        "utc_offset_hours": int(open_local.utcoffset().total_seconds() / 3600),
        "timezone": "Africa/Cairo"
    }


def get_current_session_status(now: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Determines real-time market session status for current or specified moment.
    Returns: 'PRE_OPEN' | 'OPEN' | 'CLOSED' | 'WEEKEND' | 'HOLIDAY'
    """
    if now is None:
        now = datetime.now(EGYPT_TZ)
    elif now.tzinfo is None:
        now = now.replace(tzinfo=EGYPT_TZ)
    else:
        now = now.astimezone(EGYPT_TZ)

    current_date = now.date()
    current_time = now.time()

    # Weekend check
    if current_date.weekday() in (4, 5):
        return {"status": "WEEKEND", "is_open": False, "reason": "عطلة نهاية الأسبوع (الجمعة/السبت)"}

    # Holiday check
    holiday = get_holiday_info(current_date)
    if holiday:
        return {"status": "HOLIDAY", "is_open": False, "reason": holiday["name"]}

    # Compute bounds for today
    bounds = get_session_bounds(current_date)
    close_t = time(13, 30, 0) if bounds["is_ramadan"] else time(14, 30, 0)
    pre_open_t = time(9, 30, 0)
    open_t = time(10, 0, 0)

    if pre_open_t <= current_time < open_t:
        return {"status": "PRE_OPEN", "is_open": False, "reason": "جلسة الاستكشاف وتسجيل الأوامر قبل الافتتاح"}
    elif open_t <= current_time <= close_t:
        return {"status": "OPEN", "is_open": True, "reason": "جلسة التداول مستمرة"}
    else:
        return {"status": "CLOSED", "is_open": False, "reason": "خارج ساعات التداول الرسمية"}


def get_next_trading_day(d: date | datetime | str) -> date:
    """Returns the subsequent valid EGX trading day."""
    dt = parse_date(d) + timedelta(days=1)
    while not is_trading_day(dt):
        dt += timedelta(days=1)
    return dt


def get_previous_trading_day(d: date | datetime | str) -> date:
    """Returns the preceding valid EGX trading day."""
    dt = parse_date(d) - timedelta(days=1)
    while not is_trading_day(dt):
        dt -= timedelta(days=1)
    return dt


def get_trading_days(start_date: date | datetime | str, end_date: date | datetime | str) -> List[date]:
    """Generates all valid EGX trading days between start_date and end_date (inclusive)."""
    s = parse_date(start_date)
    e = parse_date(end_date)
    curr = s
    trading_days = []
    while curr <= e:
        if is_trading_day(curr):
            trading_days.append(curr)
        curr += timedelta(days=1)
    return trading_days
