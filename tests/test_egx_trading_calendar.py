import pytest
from datetime import date, datetime, time
from zoneinfo import ZoneInfo
from services.calendar import (
    is_trading_day,
    is_ramadan,
    get_holiday_info,
    get_session_bounds,
    get_current_session_status,
    get_next_trading_day,
    get_previous_trading_day,
    get_trading_days,
    EGYPT_TZ
)

def test_weekend_days_are_not_trading_days():
    # 2026-06-05 is Friday, 2026-06-06 is Saturday
    friday = date(2026, 6, 5)
    saturday = date(2026, 6, 6)
    
    assert is_trading_day(friday) is False
    assert is_trading_day(saturday) is False
    
    status_friday = get_current_session_status(datetime.combine(friday, time(11, 0), tzinfo=EGYPT_TZ))
    assert status_friday["status"] == "WEEKEND"
    assert status_friday["is_open"] is False


def test_normal_trading_day():
    # 2026-06-02 is a normal Tuesday
    tuesday = date(2026, 6, 2)
    assert is_trading_day(tuesday) is True
    
    bounds = get_session_bounds(tuesday)
    assert bounds["is_trading_day"] is True
    assert bounds["is_ramadan"] is False
    assert bounds["holiday"] is None
    assert bounds["session_open_local"] == "10:00:00"
    assert bounds["session_close_local"] == "14:30:00"
    
    # In June (Summer DST), Cairo is UTC+3 -> 10:00 Cairo is 07:00 UTC, 14:30 Cairo is 11:30 UTC
    assert bounds["utc_offset_hours"] == 3
    assert bounds["session_open_utc"] == "07:00:00Z"
    assert bounds["session_close_utc"] == "11:30:00Z"


def test_official_holidays_are_closed():
    # 2026-07-23 is July 23 Revolution
    revolution_day = date(2026, 7, 23)
    assert is_trading_day(revolution_day) is False
    
    holiday = get_holiday_info(revolution_day)
    assert holiday is not None
    assert "23 يوليو" in holiday["name"]
    
    status = get_current_session_status(datetime.combine(revolution_day, time(11, 0), tzinfo=EGYPT_TZ))
    assert status["status"] == "HOLIDAY"
    assert status["is_open"] is False


def test_ramadan_shortened_session_hours():
    # 2026-03-05 is a Thursday in Ramadan
    ramadan_day = date(2026, 3, 5)
    assert is_trading_day(ramadan_day) is True
    assert is_ramadan(ramadan_day) is True
    
    bounds = get_session_bounds(ramadan_day)
    assert bounds["is_ramadan"] is True
    assert bounds["session_open_local"] == "10:00:00"
    assert bounds["session_close_local"] == "13:30:00"  # Shortened Ramadan close


def test_dynamic_dst_timezone_conversion():
    # Summer date (July) -> UTC+3
    summer_bounds = get_session_bounds(date(2026, 7, 15))
    assert summer_bounds["utc_offset_hours"] == 3
    
    # Winter date (January) -> UTC+2 (per Law 24/2023)
    winter_bounds = get_session_bounds(date(2026, 1, 15))
    assert winter_bounds["utc_offset_hours"] == 2
    assert winter_bounds["session_open_utc"] == "08:00:00Z"
    assert winter_bounds["session_close_utc"] == "12:30:00Z"


def test_next_and_previous_trading_day_skips_weekends_and_holidays():
    # 2026-06-04 is Thursday. Next trading day should be Sunday 2026-06-07 (skipping Fri 5 and Sat 6)
    thursday = date(2026, 6, 4)
    next_day = get_next_trading_day(thursday)
    assert next_day == date(2026, 6, 7)
    
    # Preceding trading day of Sunday 2026-06-07 should be Thursday 2026-06-04
    prev_day = get_previous_trading_day(date(2026, 6, 7))
    assert prev_day == date(2026, 6, 4)
