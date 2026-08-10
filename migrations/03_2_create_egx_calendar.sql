-- Migration: 03_2_create_egx_calendar.sql
-- Description: Authoritative EGX Trading Calendar table & 2026 Official Calendar Seed

CREATE TABLE IF NOT EXISTS public.egx_trading_calendar (
    calendar_date DATE PRIMARY KEY,
    is_trading_day BOOLEAN NOT NULL DEFAULT TRUE,
    session_open TIME NOT NULL DEFAULT '10:00:00',
    session_close TIME NOT NULL DEFAULT '14:30:00',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Africa/Cairo',
    is_ramadan BOOLEAN NOT NULL DEFAULT FALSE,
    is_special_session BOOLEAN NOT NULL DEFAULT FALSE,
    is_exceptional_closure BOOLEAN NOT NULL DEFAULT FALSE,
    holiday_name VARCHAR(150),
    holiday_type VARCHAR(50), -- 'NATIONAL' | 'RELIGIOUS' | 'WEEKEND' | 'EXCEPTIONAL'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_egx_calendar_trading_day ON public.egx_trading_calendar (is_trading_day);
CREATE INDEX IF NOT EXISTS idx_egx_calendar_date ON public.egx_trading_calendar (calendar_date);
