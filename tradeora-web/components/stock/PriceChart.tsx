'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ComposedChart,
  Bar,
  Cell,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { PriceRecord } from '@/lib/market-utils';
import {
  calcSMA,
  calcBollingerBands,
  calcRSI,
  calcMACD,
  calcSupportResistance,
  calcATR,
  calcVolumeScore,
  calcVolumeRatio,
  detectCandlePattern,
  detectRSIDivergence,
  calcTFSignal,
  calcPositionSize,
  detectSRLevels,
  type CandlePattern,
  type TFSignal
} from '@/lib/ta-utils';
import { fetchHistoricalPrices, fetchSignalStats, SignalStat } from '@/lib/queries';
import { CandlestickChart, CandlestickChartHandle, SRLevel } from '@/components/stock/CandlestickChart';
import { Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PriceChartProps {
  symbol: string;
  companyId: string;
  intradayData: any;
  historicalPrices: PriceRecord[];
  locale: string;
}

type Interval = '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1m';

function isMarketOpen(): boolean {
  try {
    const cairoTime = new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' });
    const d = new Date(cairoTime);
    const day = d.getDay();
    const mins = d.getHours() * 60 + d.getMinutes();
    return day >= 0 && day <= 4 && mins >= 600 && mins <= 870;
  } catch { return false; }
}

function formatVolume(v: number | null | undefined): string {
  if (!v) return '-';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toFixed(0);
}

function getYahooTicker(symbol: string): string {
  const mapping: Record<string, string> = {
    "ORAS": "EGS95001C011.CA",
    "DCRC": "EGS21451C017-EGP.CA",
    "NCGC": "EGS32131C012-EGP.CA",
    "GTHE": "EGS74081C018-EGP.CA",
    "ACRO": "EGS3E071C013-EGP.CA",
    "AMES": "EGS72081C010.CA",
    "CAED": "EGS72201C014.CA",
    "ELNA": "EGS300L1C011.CA",
    "NIPH": "EGS38331C012.CA",
    "RREI": "EGS65011C016.CA",
    "AJWA": "EGS30211C014.CA",
    "BONY": "EGS656M1C010.CA",
    "DOMT": "EGS30031C016.CA",
    "FERC": "EGS385S1C012.CA",
    "GTEX": "EGS59U92C011.CA",
    "RAKT": "EGS36021C011.CA",
    "TANM": "EGS21EB1C011.CA",
    "TAQA": "EGS490S1C014.CA",
    "UTOP": "EGS655Y1C017.CA"
  };
  const sym = symbol.toUpperCase();
  return mapping[sym] || `${sym}.CA`;
}

interface SREntry extends SRLevel {
  id: string;
  distPct: number;
  isClosest: boolean;
  label?: string;
  isATH?: boolean;
  isProjected?: boolean;
}

// Client-side aggregations
function aggregateWeekly(prices: PriceRecord[]): PriceRecord[] {
  if (prices.length === 0) return [];
  const sorted = [...prices].sort((a, b) => a.price_date.localeCompare(b.price_date));
  const weekly: PriceRecord[] = [];
  let currentWeekKey: string | null = null;
  let currentWeekPrices: PriceRecord[] = [];

  const getWeekKey = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const sunday = new Date(d.setDate(diff));
    return sunday.toISOString().split('T')[0];
  };

  sorted.forEach((p) => {
    const weekKey = getWeekKey(p.price_date);
    if (weekKey !== currentWeekKey) {
      if (currentWeekPrices.length > 0) {
        weekly.push(buildAggregatedCandle(currentWeekPrices, currentWeekKey!));
      }
      currentWeekKey = weekKey;
      currentWeekPrices = [p];
    } else {
      currentWeekPrices.push(p);
    }
  });

  if (currentWeekPrices.length > 0) {
    weekly.push(buildAggregatedCandle(currentWeekPrices, currentWeekKey!));
  }
  return weekly;
}

function aggregateMonthly(prices: PriceRecord[]): PriceRecord[] {
  if (prices.length === 0) return [];
  const sorted = [...prices].sort((a, b) => a.price_date.localeCompare(b.price_date));
  const monthly: PriceRecord[] = [];
  let currentMonthKey: string | null = null;
  let currentMonthPrices: PriceRecord[] = [];

  sorted.forEach((p) => {
    const monthKey = p.price_date.substring(0, 7);
    if (monthKey !== currentMonthKey) {
      if (currentMonthPrices.length > 0) {
        const lastDayStr = currentMonthPrices[currentMonthPrices.length - 1].price_date;
        monthly.push(buildAggregatedCandle(currentMonthPrices, lastDayStr));
      }
      currentMonthKey = monthKey;
      currentMonthPrices = [p];
    } else {
      currentMonthPrices.push(p);
    }
  });

  if (currentMonthPrices.length > 0) {
    const lastDayStr = currentMonthPrices[currentMonthPrices.length - 1].price_date;
    monthly.push(buildAggregatedCandle(currentMonthPrices, lastDayStr));
  }
  return monthly;
}

function buildAggregatedCandle(chunk: PriceRecord[], dateStr: string): PriceRecord {
  const first = chunk[0];
  const last = chunk[chunk.length - 1];
  let high = first.high_price ?? first.close_price;
  let low = first.low_price ?? first.close_price;
  let volume = 0;

  chunk.forEach((c) => {
    const h = c.high_price ?? c.close_price;
    const l = c.low_price ?? c.close_price;
    if (h > high) high = h;
    if (l < low) low = l;
    volume += c.volume || 0;
  });

  return {
    ...last,
    price_date: dateStr,
    open_price: first.open_price ?? first.close_price,
    high_price: high,
    low_price: low,
    close_price: last.close_price,
    volume: volume
  };
}

function generateIntradayForDay(day: PriceRecord, interval: string): any[] {
  const O = day.open_price ?? day.close_price;
  const H = day.high_price ?? day.close_price;
  const L = day.low_price ?? day.close_price;
  const C = day.close_price;
  const V = day.volume ?? 0;

  let times: string[] = [];
  if (interval === '4h') {
    times = ['10:00', '13:00'];
  } else if (interval === '1h') {
    times = ['10:00', '11:00', '12:00', '13:00', '14:00'];
  } else if (interval === '30m') {
    times = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00'];
  } else { // 15m
    times = [
      '10:00', '10:15', '10:30', '10:45',
      '11:00', '11:15', '11:30', '11:45',
      '12:00', '12:15', '12:30', '12:45',
      '13:00', '13:15', '13:30', '13:45',
      '14:00', '14:15'
    ];
  }

  const K = times.length;
  const result: any[] = [];

  const dateParts = day.price_date.split(' ')[0].split('-');
  if (dateParts.length !== 3) return [];
  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]);
  const dayNum = parseInt(dateParts[2]);

  const isGreen = C >= O;
  const p0 = O;
  const p1 = isGreen ? L : H;
  const p2 = isGreen ? H : L;
  const p3 = C;

  let prevClose = O;

  for (let i = 0; i < K; i++) {
    const [hourStr, minStr] = times[i].split(':');
    const hr = parseInt(hourStr);
    const mn = parseInt(minStr);

    const dateObj = new Date(Date.UTC(year, month - 1, dayNum, hr, mn));
    const timeSec = Math.floor(dateObj.getTime() / 1000);

    const progress = i / (K - 1 || 1);
    let targetClose = C;
    if (progress < 0.25) {
      const t = progress / 0.25;
      targetClose = p0 + (p1 - p0) * t;
    } else if (progress < 0.7) {
      const t = (progress - 0.25) / 0.45;
      targetClose = p1 + (p2 - p1) * t;
    } else {
      const t = (progress - 0.7) / 0.3;
      targetClose = p2 + (p3 - p2) * t;
    }

    const noise = (Math.sin(i * 1.5) * 0.0012) * targetClose;
    targetClose = targetClose + noise;

    if (targetClose > H) targetClose = H;
    if (targetClose < L) targetClose = L;

    const candleOpen = i === 0 ? O : prevClose;
    let candleClose = i === K - 1 ? C : parseFloat(targetClose.toFixed(3));

    let candleHigh = Math.max(candleOpen, candleClose);
    let candleLow = Math.min(candleOpen, candleClose);

    if (K > 1) {
      if (progress >= 0.1 && progress <= 0.4) {
        if (isGreen) {
          candleLow = Math.min(candleLow, L);
        } else {
          candleHigh = Math.max(candleHigh, H);
        }
      }
      if (progress >= 0.5 && progress <= 0.8) {
        if (isGreen) {
          candleHigh = Math.max(candleHigh, H);
        } else {
          candleLow = Math.min(candleLow, L);
        }
      }
    } else {
      candleHigh = H;
      candleLow = L;
    }

    if (candleHigh > H) candleHigh = H;
    if (candleLow < L) candleLow = L;

    const candleVolume = Math.round(V / K);

    result.push({
      time: timeSec,
      price_date: `${day.price_date.split(' ')[0]} ${times[i]}`,
      open_price: candleOpen,
      high_price: candleHigh,
      low_price: candleLow,
      close_price: candleClose,
      volume: candleVolume
    });

    prevClose = candleClose;
  }

  return result;
}

export function PriceChart({ symbol, companyId, historicalPrices, locale }: PriceChartProps) {
  const tTA = useTranslations('technicalAnalysis');
  const tGlobal = useTranslations();

  const [interval, setIntervalVal] = useState<Interval>('1d');
  const [dbCandlesCount, setDbCandlesCount] = useState(0);

  // Indicator toggles
  const [showSMA, setShowSMA] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(false);
  const [showVol, setShowVol] = useState(true);

  // Crosshair sync
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [hoveredOHLCV, setHoveredOHLCV] = useState<{ open: number; high: number; low: number; close: number; volume: number } | null>(null);

  // Database daily prices
  const [dbPrices, setDbPrices] = useState<PriceRecord[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Intraday prices fetched from proxy API
  const [intradayYahooPrices, setIntradayYahooPrices] = useState<any[]>([]);
  const [isIntradayLoading, setIsIntradayLoading] = useState(false);
  const [intradayHasNoData, setIntradayHasNoData] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bug Fix: Track visible S/R lines using separate state
  const [visibleSRLines, setVisibleSRLines] = useState<Set<number>>(new Set());
  const [signalStats, setSignalStats] = useState<SignalStat[]>([]);
  const [mlProb, setMlProb] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    trailing_stop_to_entry: true,
    min_risk_reward: 1.5,
    min_ml_probability: 0.58,
    require_volume_spike: true
  });
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeShares, setTradeShares] = useState(100);
  const [tradeEntry, setTradeEntry] = useState(0);
  const [userCapital, setUserCapital] = useState(10000);
  const [userRiskPercent, setUserRiskPercent] = useState(2);

  useEffect(() => {
    try {
      const savedCap = localStorage.getItem('user_capital');
      const savedRisk = localStorage.getItem('user_risk_percent');
      if (savedCap) setUserCapital(Number(savedCap));
      if (savedRisk) setUserRiskPercent(Number(savedRisk));
    } catch (e) {
      console.error('Error loading config in PriceChart:', e);
    }
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.settings) {
          setSettings(data.settings);
        }
        setIsSettingsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching settings:', err);
        setIsSettingsLoading(false);
      });
  }, []);

  const handleUpdateSetting = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (!res.ok) {
        throw new Error('Failed to update setting');
      }
    } catch (err) {
      console.error('Error saving setting:', err);
      // Revert on error
      fetch('/api/settings')
        .then(r => r.json())
        .then(data => {
          if (data && data.success && data.settings) {
            setSettings(data.settings);
          }
        });
    }
  };

  const chartRef = useRef<CandlestickChartHandle>(null);

  useEffect(() => {
    if (companyId) {
      fetchSignalStats(companyId).then(setSignalStats);
    }
  }, [companyId]);



  const handleCrosshairMove = useCallback((time: string | null, ohlcv?: any) => {
    setHoveredDate(time);
    setHoveredOHLCV(ohlcv ?? null);
  }, []);

  // Initialize dbPrices
  useEffect(() => {
    if (historicalPrices?.length > 0) setDbPrices(historicalPrices);
  }, [historicalPrices]);

  // Auto-switch to 1D if intraday is selected but has no real data
  useEffect(() => {
    const isIntraday = ['15m', '30m', '1h', '4h'].includes(interval);
    if (isIntraday && intradayHasNoData && !isIntradayLoading) {
      setIntervalVal('1d');
      setToastMessage(
        locale === 'ar'
          ? '⚠️ البيانات اللحظية الحقيقية غير متاحة حالياً. تم التحويل إلى الفريم اليومي تلقائياً.'
          : '⚠️ Live intraday data is currently unavailable. Switched to Daily (1D) interval.'
      );
      
      const tid = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(tid);
    }
  }, [interval, intradayHasNoData, isIntradayLoading, locale]);

  // Daily polling to Supabase every 60s
  useEffect(() => {
    if (!companyId) return;
    const fetch = async () => {
      try {
        const latest = await fetchHistoricalPrices(companyId, 1);
        if (latest.length > 0) {
          const p = latest[0];
          setDbPrices(prev => {
            const idx = prev.findIndex(x => x.price_date === p.price_date);
            if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = p;
              return updated;
            }
            return [...prev, p];
          });
          setLastUpdated(new Date());
        }
      } catch (e) { /* silent */ }
    };
    fetch();
    const id = setInterval(fetch, 60000);
    return () => clearInterval(id);
  }, [companyId]);

  // Intraday fetching: DB first, fallback to Yahoo
  useEffect(() => {
    const isIntraday = interval === '15m' || interval === '30m' || interval === '1h' || interval === '4h';
    if (!isIntraday) {
      setIntradayYahooPrices([]);
      return;
    }

    const fetchIntraday = async () => {
      setIsIntradayLoading(true);
      try {
        const cairoFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Africa/Cairo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        const formatCandle = (p: any) => {
          const date = new Date(p.time * 1000);
          const parts = cairoFormatter.formatToParts(date);
          const partMap: Record<string, string> = {};
          parts.forEach(pt => partMap[pt.type] = pt.value);
          const dateStr = `${partMap.year}-${partMap.month}-${partMap.day} ${partMap.hour}:${partMap.minute}`;
          return {
            time: p.time,
            price_date: dateStr,
            open_price: p.open,
            high_price: p.high,
            low_price: p.low,
            close_price: p.close,
            volume: p.volume
          };
        };

        let minuteInterval = 15;
        if (interval === '30m') minuteInterval = 30;
        else if (interval === '1h') minuteInterval = 60;
        else if (interval === '4h') minuteInterval = 240;

        // 1. Fetch from DB
        const dbRes = await fetch(`/api/intraday?symbol=${symbol}&interval=${minuteInterval}&days=90`);
        const { candles: dbCandles } = await dbRes.json();
        
        let finalRawPoints = dbCandles || [];
        setDbCandlesCount(finalRawPoints.length);
        
        // 2. If insufficient data, fallback to Yahoo
        if (finalRawPoints.length < 50) {
          try {
            const yfTicker = getYahooTicker(symbol);
            const url = `/api/yahoo-chart?ticker=${encodeURIComponent(yfTicker)}&interval=${interval}`;
            const res = await fetch(url);
            if (res.ok) {
              const json = await res.json();
              const result = json?.chart?.result?.[0];
              if (result) {
                // Guard: reject if Yahoo returned daily data instead of intraday
                const meta = result.meta ?? {};
                const actualGranularity: string = meta.dataGranularity ?? '';
                const expectedGranularity = (interval === '4h') ? '60m' : interval;
                if (actualGranularity && actualGranularity !== expectedGranularity) {
                  console.warn(`Yahoo returned ${actualGranularity} instead of ${expectedGranularity} — skipping fallback`);
                  // Do not use this data — keep DB-only data
                } else {
                  const timestamps = result.timestamp || [];
                  const quotes = result.indicators?.quote?.[0] || {};
                  const opens = quotes.open || [];
                  const highs = quotes.high || [];
                  const lows = quotes.low || [];
                  const closes = quotes.close || [];
                  const volumes = quotes.volume || [];

                  const rawPoints: any[] = [];
                  for (let i = 0; i < timestamps.length; i++) {
                    const op = opens[i];
                    const hi = highs[i];
                    const lo = lows[i];
                    const cl = closes[i];
                    const vol = volumes[i] ?? 0;
                    if (op === null || hi === null || lo === null || cl === null) continue;
                    rawPoints.push({ time: timestamps[i], open: op, high: hi, low: lo, close: cl, volume: vol });
                  }

                  let yfFinalPoints = rawPoints;
                  if (interval === '4h') {
                    const aggregated: any[] = [];
                    for (let i = 0; i < rawPoints.length; i += 4) {
                      const chunk = rawPoints.slice(i, i + 4);
                      if (chunk.length === 0) continue;
                      const first = chunk[0];
                      const last = chunk[chunk.length - 1];
                      let maxHigh = chunk[0].high;
                      let minLow = chunk[0].low;
                      let sumVol = 0;
                      chunk.forEach(c => {
                        if (c.high > maxHigh) maxHigh = c.high;
                        if (c.low < minLow) minLow = c.low;
                        sumVol += c.volume;
                      });
                      aggregated.push({ time: last.time, open: first.open, high: maxHigh, low: minLow, close: last.close, volume: sumVol });
                    }
                    yfFinalPoints = aggregated;
                  }

                  // Merge DB + Yahoo (prevent duplicate times)
                  const dbTimes = new Set(finalRawPoints.map((c: any) => c.time));
                  const extra = yfFinalPoints.filter(c => !dbTimes.has(c.time));
                  finalRawPoints = [...finalRawPoints, ...extra].sort((a: any, b: any) => a.time - b.time);
                }
              }
            }
          } catch (e) {
            console.error('Yahoo fallback failed:', e);
          }
        }

        const formatted = finalRawPoints.map(formatCandle);
        // If still very few candles (< 3 real intraday bars), mark as no data
        setIntradayHasNoData(finalRawPoints.length < 3);
        setIntradayYahooPrices(formatted);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Error loading intraday data:', err);
        setIntradayHasNoData(true);
      } finally {
        setIsIntradayLoading(false);
      }
    };

    fetchIntraday();
  }, [interval, symbol]);

  // Selected active prices
  const activePrices = useMemo(() => {
    if (interval === '1w') {
      const data = aggregateWeekly(dbPrices);
      return data.map(d => ({ ...d, time: d.price_date }));
    }
    if (interval === '1m') {
      const data = aggregateMonthly(dbPrices);
      return data.map(d => ({ ...d, time: d.price_date }));
    }
    if (interval === '1d') {
      return dbPrices.map(d => ({ ...d, time: d.price_date }));
    }
    
    // Intraday estimation if no data found
    if (intradayHasNoData) {
      // Use last 45 daily prices to generate estimated intraday candles so the chart loads nicely
      const dailySlice = dbPrices.slice(-45);
      const generated: any[] = [];
      dailySlice.forEach(day => {
        const dayCandles = generateIntradayForDay(day, interval);
        generated.push(...dayCandles);
      });
      return generated;
    }
    
    return intradayYahooPrices;
  }, [interval, dbPrices, intradayYahooPrices, intradayHasNoData]);

  // Find full historical All-Time High
  const allTimeHigh = useMemo(() => {
    const dbHighs = dbPrices.map(p => p.high_price || p.close_price);
    const activeHighs = activePrices.map(p => p.high_price || p.close_price);
    const allHighs = [...dbHighs, ...activeHighs];
    if (allHighs.length === 0) return 0;
    return Math.max(...allHighs);
  }, [dbPrices, activePrices]);

  const currentPrice = useMemo(() =>
    dbPrices.at(-1)?.close_price ?? 0
  , [dbPrices]);

  const isNearATH = allTimeHigh > 0 && currentPrice >= allTimeHigh * 0.99;

  // Indicator calculations on active prices
  const closes = useMemo(() => activePrices.map(p => p.close_price), [activePrices]);
  const sma20Raw = useMemo(() => calcSMA(closes, 20), [closes]);
  const sma50Raw = useMemo(() => calcSMA(closes, 50), [closes]);
  const sma200Raw = useMemo(() => calcSMA(closes, 200), [closes]);
  const bbRaw = useMemo(() => calcBollingerBands(closes, 20, 2), [closes]);
  const rsiRaw = useMemo(() => calcRSI(closes, 14), [closes]);
  const macdRaw = useMemo(() => calcMACD(closes), [closes]);

  const allChartData = useMemo(() => activePrices.map((p, i) => ({
    ...p,
    sma20: sma20Raw[i] ?? null,
    sma50: sma50Raw[i] ?? null,
    sma200: sma200Raw[i] ?? null,
    bbUpper: bbRaw[i]?.upper ?? null,
    bbMiddle: bbRaw[i]?.middle ?? null,
    bbLower: bbRaw[i]?.lower ?? null,
    rsi: rsiRaw[i] ?? null,
    macd: macdRaw[i]?.macd ?? null,
    macdSignal: macdRaw[i]?.signal ?? null,
    macdHistogram: macdRaw[i]?.histogram ?? null,
  })), [activePrices, sma20Raw, sma50Raw, sma200Raw, bbRaw, rsiRaw, macdRaw]);

  // Support & Resistance levels calculated client-side
  const srLevelsRaw = useMemo(() => {
    if (activePrices.length === 0) return { supports: [], resistances: [] };
    
    // Dynamic window size based on interval
    const srWindowSize: Record<string, number> = {
      '15m': 96,
      '30m': 48,
      '1h': 48,
      '4h': 60,
      '1d': 120,
      '1w': 52,
      '1m': 24,
    };
    
    // Default to 120 if interval not specified
    const windowSize = srWindowSize[interval.toLowerCase()] ?? 120;
    const srWindow = activePrices.slice(-windowSize);

    const levels = calcSupportResistance(
      srWindow.map(p => p.high_price || p.close_price),
      srWindow.map(p => p.low_price || p.close_price),
      srWindow.map(p => p.close_price),
      srWindow.length,
      0.02
    );
    
    const allLevels = [...levels.resistances, ...levels.supports];
    
    // Filter out levels that are too far away (>25% from current price)
    const maxDist = currentPrice * 0.25;
    const nearbyLevels = allLevels.filter(l => Math.abs(l.price - currentPrice) <= maxDist);
    
    // Re-classify based strictly on location relative to current price
    const filteredResistances: any[] = nearbyLevels.filter(l => l.price > currentPrice);
    const filteredSupports: any[] = nearbyLevels.filter(l => l.price < currentPrice);
    
    // ATH Logic
    // If we are near ATH and ATH is above currentPrice, show it as resistance
    const athResistance = (isNearATH && allTimeHigh > currentPrice) ? [{
      price: allTimeHigh,
      strength: 99,
      label: locale === 'ar' ? '🏆 سعر تاريخي (ATH)' : '🏆 All-Time High (ATH)',
      isATH: true,
      isProjected: false
    }] : [];
    
    // Projected target (+5%) shown when near ATH
    const projectedTarget = isNearATH ? [{
      price: parseFloat((allTimeHigh * 1.05).toFixed(3)),
      strength: 98,
      label: locale === 'ar' ? '🎯 هدف مفتوح (+5%)' : '🎯 Projected Target (+5%)',
      isATH: false,
      isProjected: true
    }] : [];
    
    // If NOT near ATH but allTimeHigh is still above currentPrice, add it as a normal resistance
    if (!isNearATH && allTimeHigh > currentPrice) {
      const athExists = filteredResistances.some(r => Math.abs(r.price - allTimeHigh) / allTimeHigh < 0.01);
      if (!athExists) {
        filteredResistances.push({
          price: allTimeHigh,
          strength: 99,
          label: locale === 'ar' ? '🏆 سعر تاريخي (ATH)' : '🏆 All-Time High (ATH)',
          isATH: true,
          isProjected: false
        });
      }
    }
    
    // If allTimeHigh is below currentPrice, add it as a support
    if (allTimeHigh < currentPrice) {
      const athSupportExists = filteredSupports.some(s => Math.abs(s.price - allTimeHigh) / allTimeHigh < 0.01);
      if (!athSupportExists) {
        filteredSupports.push({
          price: allTimeHigh,
          strength: 99,
          label: locale === 'ar' ? '🏆 سعر تاريخي (ATH)' : '🏆 All-Time High (ATH)',
          isATH: true,
          isProjected: false
        });
      }
    }
    
    // Build the ATH entry to prepend (works regardless of isNearATH)
    // isNearATH → from athResistance; !isNearATH → from filteredResistances push above
    const athEntry = allTimeHigh > currentPrice ? [{
      price: allTimeHigh,
      strength: 99,
      label: locale === 'ar' ? '🏆 سعر تاريخي (ATH)' : '🏆 All-Time High (ATH)',
      isATH: true,
      isProjected: false
    }] : [];

    const finalResistances = [
      ...athEntry,
      ...projectedTarget,
      ...filteredResistances.filter(r => !r.isATH)
    ].slice(0, 4);
    
    return { supports: filteredSupports, resistances: finalResistances };
  }, [activePrices, interval, currentPrice, allTimeHigh, isNearATH, locale]);

  // Build S/R entries list
  const buildEntries = useCallback((
    levels: { price: number; strength: number; label?: string; isATH?: boolean; isProjected?: boolean }[],
    isResistance: boolean
  ): SREntry[] => {
    const sorted = [...levels].sort((a, b) => b.strength - a.strength);
    const filtered: { price: number; strength: number; label?: string; isATH?: boolean; isProjected?: boolean }[] = [];
    for (const lvl of sorted) {
      if (lvl.strength < 2 && !lvl.isATH && !lvl.isProjected) continue;
      const tooClose = filtered.some(f => Math.abs(f.price - lvl.price) / lvl.price < 0.01);
      if (!tooClose) filtered.push(lvl);
    }
    const top = filtered.slice(0, 3);

    // Find the closest level above (for resistance) or below (for support) currentPrice
    const validRelative = top.filter(l =>
      isResistance ? l.price > currentPrice : l.price < currentPrice
    );
    const closestPrice = validRelative.length > 0
      ? validRelative.reduce((a, b) =>
          Math.abs(a.price - currentPrice) < Math.abs(b.price - currentPrice) ? a : b
        ).price
      : null;

    return top.map((lvl, i) => {
      const distPct = Math.abs((lvl.price - currentPrice) / currentPrice * 100);
      return {
        id: `${isResistance ? 'r' : 's'}-${i}`,
        price: lvl.price,
        strength: lvl.strength,
        isResistance,
        distPct,
        isClosest: lvl.price === closestPrice,
        label: lvl.label,
        isATH: lvl.isATH,
        isProjected: lvl.isProjected,
      };
    });
  }, [currentPrice]);

  // Build top levels list
  const topLevels = useMemo(() => {
    const res = buildEntries(srLevelsRaw.resistances, true);
    const sup = buildEntries(srLevelsRaw.supports, false);
    return [...res, ...sup];
  }, [srLevelsRaw, buildEntries]);

  // Bug Fix: Clear chart refs and set default toggles when interval or stock symbol changes
  useEffect(() => {
    chartRef.current?.clearSRLines();
    setVisibleSRLines(new Set());
  }, [symbol, interval]);

  // Initialize visible set with all computed levels by default
  useEffect(() => {
    if (topLevels.length > 0) {
      setVisibleSRLines(new Set(topLevels.map(l => l.price)));
    }
  }, [topLevels]);

  // Sync visible levels on chart
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.clearSRLines();
    topLevels.forEach(level => {
      if (visibleSRLines.has(level.price)) {
        chartRef.current?.toggleSRLine(
          level.price,
          level.isResistance,
          level.isATH ?? false,
          level.isProjected ?? false
        );
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleSRLines, topLevels]);

  const handleToggleSR = useCallback((price: number) => {
    setVisibleSRLines(prev => {
      const next = new Set(prev);
      if (next.has(price)) {
        next.delete(price);
      } else {
        next.add(price);
      }
      return next;
    });
  }, []);

  const activeData = useMemo(() => {
    return allChartData[allChartData.length - 1] ?? null;
  }, [allChartData]);

  const displayOHLCV = hoveredOHLCV ?? (activeData ? {
    open: activeData.open_price ?? activeData.close_price,
    high: activeData.high_price ?? activeData.close_price,
    low: activeData.low_price ?? activeData.close_price,
    close: activeData.close_price,
    volume: activeData.volume ?? 0,
  } : null);

  const priceChange = useMemo(() => {
    if (activePrices.length < 2) return { diff: 0, pct: 0 };
    const cur = activePrices[activePrices.length - 1].close_price;
    const prev = activePrices[activePrices.length - 2].close_price;
    return { diff: cur - prev, pct: ((cur - prev) / prev) * 100 };
  }, [activePrices]);

  const isUp = priceChange.diff >= 0;
  const marketOpen = isMarketOpen();
  const latestClose = activePrices[activePrices.length - 1]?.close_price ?? 0;

  // ─── Technical Analysis Timeframe Fallback (Day vs Swing) ─────────
  const isIntradayInterval = ['15m', '30m', '1h', '4h'].includes(interval);

  const analysisCandles = useMemo(() => {
    if (isIntradayInterval && !intradayHasNoData && activePrices.length >= 100) {
      return activePrices.slice(-500).map(p => ({
        open: p.open_price ?? p.close_price,
        high: p.high_price ?? p.close_price,
        low: p.low_price ?? p.close_price,
        close: p.close_price,
        volume: p.volume ?? 0,
      }));
    }
    // fallback -> daily always
    return dbPrices.slice(-200).map(p => ({
      open: p.open_price ?? p.close_price,
      high: p.high_price ?? p.close_price,
      low: p.low_price ?? p.close_price,
      close: p.close_price,
      volume: p.volume ?? 0,
    }));
  }, [isIntradayInterval, intradayHasNoData, activePrices, dbPrices]);

  const analysisCloses = useMemo(() => analysisCandles.map(c => c.close), [analysisCandles]);
  const analysisRsiRaw = useMemo(() => calcRSI(analysisCloses, 14), [analysisCloses]);
  const analysisMacdRaw = useMemo(() => calcMACD(analysisCloses), [analysisCloses]);
  const analysisSma20Raw = useMemo(() => calcSMA(analysisCloses, 20), [analysisCloses]);
  const analysisSma50Raw = useMemo(() => calcSMA(analysisCloses, 50), [analysisCloses]);
  const analysisBbRaw = useMemo(() => calcBollingerBands(analysisCloses, 20, 2), [analysisCloses]);

  // ── Volume ──────────────────────────
  const volumeScore = useMemo(() =>
    calcVolumeScore(analysisCandles)
  , [analysisCandles]);

  const volumeRatio = useMemo(() =>
    calcVolumeRatio(analysisCandles)
  , [analysisCandles]);

  // ── Candle Pattern ───────────────────
  const candlePattern = useMemo(() =>
    detectCandlePattern(analysisCandles)
  , [analysisCandles]);

  // ── RSI Divergence ───────────────────
  const rsiDivergence = useMemo(() =>
    detectRSIDivergence(analysisCandles, analysisRsiRaw)
  , [analysisCandles, analysisRsiRaw]);

  // للـ 1D — نستخدم dbPrices دايماً
  const dailySignal = useMemo(() => {
    if (dbPrices.length < 50) return 'neutral' as TFSignal;
    const candles = dbPrices.map(p => ({
      close: p.close_price,
      open:  p.open_price  ?? p.close_price,
      high:  p.high_price  ?? p.close_price,
      low:   p.low_price   ?? p.close_price,
    }));
    const rsi = calcRSI(candles.map(c => c.close), 14);
    return calcTFSignal(candles, rsi);
  }, [dbPrices]);

  // للفريم الحالي
  const currentTFSignal = useMemo(() => {
    if (analysisCandles.length < 50) return 'neutral' as TFSignal;
    const rsi = calcRSI(analysisCandles.map((c: any) => c.close), 14);
    return calcTFSignal(analysisCandles, rsi);
  }, [analysisCandles]);

  // Multi-TF Score
  const mtfScore = useMemo(() => {
    const signals = [dailySignal, currentTFSignal];
    const bulls = signals.filter(s => s === 'bullish').length;
    const bears = signals.filter(s => s === 'bearish').length;
    if (bulls === 2) return 'strong_bull';
    if (bears === 2) return 'strong_bear';
    if (bulls > bears) return 'mild_bull';
    if (bears > bulls) return 'mild_bear';
    return 'neutral';
  }, [dailySignal, currentTFSignal]);

  const srLevels = useMemo(() =>
    detectSRLevels(analysisCandles, currentPrice)
  , [analysisCandles, currentPrice]);

  const analysisData = useMemo(() => {
    if (analysisCandles.length === 0) return null;
    const idx = analysisCandles.length - 1;
    const last = analysisCandles[idx];
    const closes = analysisCloses;
    const highs = analysisCandles.map(c => c.high);
    const lows = analysisCandles.map(c => c.low);

    // Bollinger Bands Width & Position
    const bb = analysisBbRaw[idx];
    const sma20 = analysisSma20Raw[idx] ?? last.close;
    // Calculate std dev for BB:
    const closes20 = closes.slice(-20);
    const mean20 = sma20;
    const std20 = Math.sqrt(
      closes20.reduce((a, b) => a + (b - mean20) ** 2, 0) / Math.max(closes20.length, 1)
    );
    const bbWidth = std20 > 0 ? (std20 * 4) / mean20 * 100 : 2;
    const bbPos = std20 > 0 ? (last.close - mean20) / (std20 * 2) : 0;

    // Stochastic RSI:
    const rsi14 = analysisRsiRaw.slice(-14);
    const validRsis = rsi14.filter(x => x !== null && x !== undefined) as number[];
    const lastRsi = analysisRsiRaw[idx] ?? 50;
    const minRsi = validRsis.length > 0 ? Math.min(...validRsis) : 30;
    const maxRsi = validRsis.length > 0 ? Math.max(...validRsis) : 70;
    const stochRsi = (maxRsi - minRsi) > 0 ? (lastRsi - minRsi) / (maxRsi - minRsi) : 0.5;

    // Distance to 52-week High (ATH):
    const recentHighs = highs.slice(-252);
    const ath52 = recentHighs.length > 0 ? Math.max(...recentHighs) : last.close;
    const distAth = ((last.close - ath52) / ath52) * 100;

    // Volume Spike:
    const recentVols = analysisCandles.slice(-14).map(c => c.volume ?? 0);
    const avgVol = recentVols.reduce((a, b) => a + b, 0) / Math.max(recentVols.length, 1);
    const volRatio = avgVol > 0 ? (last.volume ?? 0) / avgVol : 1;
    const volSpike = volRatio >= 3 ? 1 : 0;

    return {
      ...last,
      rsi: lastRsi,
      macd: analysisMacdRaw[idx]?.macd ?? null,
      macdSignal: analysisMacdRaw[idx]?.signal ?? null,
      macdHistogram: analysisMacdRaw[idx]?.histogram ?? null,
      sma20,
      sma50: analysisSma50Raw[idx] ?? null,
      bbUpper: bb?.upper ?? null,
      bbLower: bb?.lower ?? null,
      bbWidth,
      bbPos,
      stochRsi,
      distAth,
      volRatio,
      volSpike,
    };
  }, [analysisCandles, analysisCloses, analysisRsiRaw, analysisMacdRaw, analysisSma20Raw, analysisSma50Raw, analysisBbRaw]);

  // ─── Scored Technical Analysis ────────────────────────────────────
  const rsiDetails = useMemo(() => {
    const r = analysisData?.rsi;
    if (r === null || r === undefined) {
      return { val: '-', desc: locale === 'ar' ? 'غير متاح' : 'N/A', bar: '[░░░░░░░░░░]', score: 0, signal: '🟡' };
    }
    let desc = '';
    let scoreVal = 0;
    let signal = '🟡';
    
    if (r > 70) {
      desc = locale === 'ar' ? 'منطقة تشبع شراء (سلبي)' : 'Overbought region (bearish)';
      scoreVal = -2;
      signal = '🔴';
    } else if (r < 30) {
      desc = locale === 'ar' ? 'منطقة تشبع بيع (إيجابي)' : 'Oversold region (bullish)';
      scoreVal = 2;
      signal = '🟢';
    } else if (r >= 50) {
      desc = locale === 'ar' ? 'منطقة محايدة مائلة للشراء (50-70)' : 'Neutral-bullish region (50-70)';
      scoreVal = 1;
      signal = '🟡';
    } else {
      desc = locale === 'ar' ? 'منطقة محايدة مائلة للبيع (30-50)' : 'Neutral-bearish region (30-50)';
      scoreVal = 1;
      signal = '🟡';
    }

    const filled = Math.round(r / 10);
    const bar = '[' + '▓'.repeat(filled) + '░'.repeat(10 - filled) + ']';

    return { val: r.toFixed(1), desc, bar, score: scoreVal, signal };
  }, [analysisData?.rsi, locale]);

  const macdDetails = useMemo(() => {
    const h = analysisData?.macdHistogram;
    const m = analysisData?.macd;
    if (h === null || h === undefined || m === null || m === undefined) {
      return { val: '-', desc: locale === 'ar' ? 'غير متاح' : 'N/A', score: 0, signal: '🟡' };
    }
    let desc = '';
    let scoreVal = 0;
    let signal = '🟡';

    if (h > 0) {
      desc = locale === 'ar' ? 'الـ MACD فوق خط الإشارة ← اتجاه صاعد' : 'MACD above signal line → bullish trend';
      scoreVal = 2;
      signal = '🟢';
    } else {
      desc = locale === 'ar' ? 'الـ MACD تحت خط الإشارة ← اتجاه هابط' : 'MACD below signal line → bearish trend';
      scoreVal = -2;
      signal = '🔴';
    }

    return { val: m.toFixed(4), desc, score: scoreVal, signal };
  }, [analysisData?.macdHistogram, analysisData?.macd, locale]);

  const smaDetails = useMemo(() => {
    const s20 = analysisData?.sma20;
    const s50 = analysisData?.sma50;
    if (!analysisData || s20 === null || s20 === undefined || s50 === null || s50 === undefined) {
      return { val: '-', desc: locale === 'ar' ? 'غير متاح' : 'N/A', score: 0, signal: '🟡' };
    }
    const c = analysisData.close;
    let desc = '';
    let scoreVal = 0;
    let signal = '🟡';

    const valStr = locale === 'ar' 
      ? `السعر ${c.toFixed(3)} / SMA20: ${s20.toFixed(2)} / SMA50: ${s50.toFixed(2)}`
      : `Price ${c.toFixed(3)} / SMA20: ${s20.toFixed(2)} / SMA50: ${s50.toFixed(2)}`;

    if (c > s20 && c > s50) {
      desc = locale === 'ar' ? 'السعر فوق المتوسطين ← اتجاه صاعد' : 'Price above SMA20 & SMA50 → bullish';
      scoreVal = 2;
      signal = '🟢';
    } else if (c < s20 && c < s50) {
      desc = locale === 'ar' ? 'السعر تحت المتوسطين ← اتجاه هابط' : 'Price below SMA20 & SMA50 → bearish';
      scoreVal = -2;
      signal = '🔴';
    } else {
      desc = locale === 'ar' ? 'السعر بين المتوسطين ← اتجاه محايد' : 'Price between averages → neutral';
      scoreVal = 0;
      signal = '🟡';
    }

    return { val: valStr, desc, score: scoreVal, signal };
  }, [analysisData, locale]);

  // Support/Resistance proximity score
  const srDetails = useMemo(() => {
    const resistancesAbove = topLevels.filter(e => e.isResistance && e.price > currentPrice);
    const supportsBelow = topLevels.filter(e => !e.isResistance && e.price < currentPrice);
    
    let desc = locale === 'ar' ? 'السعر في منطقة آمنة بين الدعم والمقاومة' : 'Price in a safe zone between S/R levels';
    let scoreVal = 0;
    let signal = '🟡';

    if (resistancesAbove.length > 0) {
      const nearestR = resistancesAbove.reduce((a, b) => a.distPct < b.distPct ? a : b);
      if (nearestR.distPct < 3.0) {
        desc = locale === 'ar' 
          ? `السعر يقترب من مقاومة ${nearestR.price.toFixed(3)} (يبعد ${nearestR.distPct.toFixed(1)}%)`
          : `Price approaching resistance ${nearestR.price.toFixed(3)} (dist ${nearestR.distPct.toFixed(1)}%)`;
        scoreVal = -1;
        signal = '🔴';
      }
    }
    if (supportsBelow.length > 0) {
      const nearestS = supportsBelow.reduce((a, b) => a.distPct < b.distPct ? a : b);
      if (nearestS.distPct < 3.0) {
        desc = locale === 'ar' 
          ? `السعر يقترب من دعم ${nearestS.price.toFixed(3)} (يبعد ${nearestS.distPct.toFixed(1)}%)`
          : `Price approaching support ${nearestS.price.toFixed(3)} (dist ${nearestS.distPct.toFixed(1)}%)`;
        scoreVal = 1;
        signal = '🟢';
      }
    }

    return { desc, score: scoreVal, signal };
  }, [topLevels, currentPrice, locale]);

  // BB score and details
  const bbDetails = useMemo(() => {
    if (!analysisData || analysisData.bbUpper === null || analysisData.bbLower === null) {
      return { val: '-', desc: locale === 'ar' ? 'غير متاح' : 'N/A', score: 0, signal: '🟡' };
    }
    const c = analysisData.close;
    const upper = analysisData.bbUpper;
    const lower = analysisData.bbLower;
    const width = analysisData.bbWidth ?? 2;
    const pos = analysisData.bbPos ?? 0;

    let desc = '';
    let scoreVal = 0;
    let signal = '🟡';

    if (pos <= -0.8) {
      desc = locale === 'ar' ? 'السعر قرب الحد السفلي للبولنجر (إيجابي)' : 'Price near lower Bollinger Band (bullish)';
      scoreVal = 2;
      signal = '🟢';
    } else if (pos >= 0.8) {
      desc = locale === 'ar' ? 'السعر قرب الحد العلوي للبولنجر (سلبي)' : 'Price near upper Bollinger Band (bearish)';
      scoreVal = -2;
      signal = '🔴';
    } else {
      desc = locale === 'ar' ? 'السعر داخل حدود البولنجر (محايد)' : 'Price inside Bollinger Bands (neutral)';
      scoreVal = 0;
      signal = '🟡';
    }

    const valStr = locale === 'ar'
      ? `العرض: ${width.toFixed(1)}% / الموضع: ${pos.toFixed(2)}`
      : `Width: ${width.toFixed(1)}% / Pos: ${pos.toFixed(2)}`;

    return { val: valStr, desc, score: scoreVal, signal };
  }, [analysisData, locale]);

  // Stochastic RSI details
  const stochRsiDetails = useMemo(() => {
    if (!analysisData || analysisData.stochRsi === undefined) {
      return { val: '-', desc: locale === 'ar' ? 'غير متاح' : 'N/A', score: 0, signal: '🟡' };
    }
    const stoch = analysisData.stochRsi;
    let desc = '';
    let scoreVal = 0;
    let signal = '🟡';

    if (stoch <= 0.2) {
      desc = locale === 'ar' ? 'مؤشر ستوكاستيك RSI متشبع بيعياً (إيجابي)' : 'Stochastic RSI oversold (bullish)';
      scoreVal = 2;
      signal = '🟢';
    } else if (stoch >= 0.8) {
      desc = locale === 'ar' ? 'مؤشر ستوكاستيك RSI متشبع شرائياً (سلبي)' : 'Stochastic RSI overbought (bearish)';
      scoreVal = -2;
      signal = '🔴';
    } else {
      desc = locale === 'ar' ? 'مؤشر ستوكاستيك RSI في منطقة معتدلة' : 'Stochastic RSI in a neutral zone';
      scoreVal = 0;
      signal = '🟡';
    }

    return { val: stoch.toFixed(3), desc, score: scoreVal, signal };
  }, [analysisData, locale]);

  // ATH Proximity details
  const athDetails = useMemo(() => {
    if (!analysisData || analysisData.distAth === undefined) {
      return { val: '-', desc: locale === 'ar' ? 'غير متاح' : 'N/A', score: 0, signal: '🟡' };
    }
    const dist = analysisData.distAth;
    let desc = '';
    let scoreVal = 0;
    let signal = '🟡';

    if (dist >= -2) {
      desc = locale === 'ar' ? 'السعر يقترب جداً من القمة السنوية (حذر)' : 'Price very close to 52-week High (caution)';
      scoreVal = -1;
      signal = '🔴';
    } else {
      desc = locale === 'ar' ? 'السعر يتداول بأريحية تحت القمة السنوية' : 'Price trading safely below 52-week High';
      scoreVal = 0;
      signal = '🟡';
    }

    const valStr = locale === 'ar'
      ? `المسافة للقمة: ${dist.toFixed(1)}%`
      : `Dist to ATH: ${dist.toFixed(1)}%`;

    return { val: valStr, desc, score: scoreVal, signal };
  }, [analysisData, locale]);

  // Volume Analysis
  const volumeDetails = useMemo(() => {
    if (analysisCandles.length < 20 || !analysisData || analysisData.volume === undefined) {
      return { val: '-', desc: locale === 'ar' ? 'غير متاح' : 'N/A', score: 0, signal: '🟡' };
    }
    const avgVolume = analysisCandles.slice(-20).reduce((sum, c) => sum + (c.volume || 0), 0) / 20;
    const lastVolume = analysisData.volume || 0;
    if (avgVolume === 0) return { val: '-', desc: locale === 'ar' ? 'حجم معدوم' : 'No volume', score: 0, signal: '🟡' };
    
    const volumeRatio = lastVolume / avgVolume;
    const isUp = (analysisData.close ?? 0) >= (analysisData.open ?? 0);
    
    let desc = '';
    let scoreVal = 0;
    let signal = '🟡';
    
    if (isUp) {
      if (volumeRatio >= 1.5) {
        desc = locale === 'ar' ? `حجم مرتفع مع صعود (${volumeRatio.toFixed(1)}× المتوسط) — إشارة صعود قوية` : `High volume with price up (${volumeRatio.toFixed(1)}x avg) — strong bullish`;
        scoreVal = 1;
        signal = '🟢';
      } else if (volumeRatio >= 1) {
        desc = locale === 'ar' ? `حجم طبيعي مع صعود (${volumeRatio.toFixed(1)}× المتوسط)` : `Normal volume with price up (${volumeRatio.toFixed(1)}x avg)`;
        scoreVal = 0;
        signal = '🟡';
      } else {
        desc = locale === 'ar' ? `حجم ضعيف مع صعود (${volumeRatio.toFixed(1)}× المتوسط) — صعود غير مؤكد` : `Low volume with price up (${volumeRatio.toFixed(1)}x avg) — weak bullish`;
        scoreVal = 0;
        signal = '🟡';
      }
    } else {
      if (volumeRatio >= 1.5) {
        desc = locale === 'ar' ? `حجم مرتفع مع هبوط (${volumeRatio.toFixed(1)}× المتوسط) — إشارة هبوط قوية` : `High volume with price down (${volumeRatio.toFixed(1)}x avg) — strong bearish`;
        scoreVal = -1;
        signal = '🔴';
      } else if (volumeRatio >= 1) {
        desc = locale === 'ar' ? `حجم طبيعي مع هبوط (${volumeRatio.toFixed(1)}× المتوسط)` : `Normal volume with price down (${volumeRatio.toFixed(1)}x avg)`;
        scoreVal = 0;
        signal = '🟡';
      } else {
        desc = locale === 'ar' ? `حجم ضعيف مع هبوط (${volumeRatio.toFixed(1)}× المتوسط) — هبوط غير مؤكد` : `Low volume with price down (${volumeRatio.toFixed(1)}x avg) — weak bearish`;
        scoreVal = 0;
        signal = '🟡';
      }
    }
    
    const formatVol = (v: number) => v >= 1000000 ? (v/1000000).toFixed(1) + 'M' : v >= 1000 ? (v/1000).toFixed(1) + 'K' : v.toFixed(0);
    
    const valStr = locale === 'ar'
      ? `حجم الشمعة: ${formatVol(lastVolume)} / متوسط 20: ${formatVol(avgVolume)} / النسبة: ${volumeRatio.toFixed(1)}×`
      : `Vol: ${formatVol(lastVolume)} / Avg: ${formatVol(avgVolume)} / Ratio: ${volumeRatio.toFixed(1)}x`;
      
    return { val: valStr, desc, score: scoreVal, signal };
  }, [analysisCandles, analysisData, locale]);

  // Overall combined score (-8 to +8)
  const scoreDetails = useMemo(() => {
    let sum = rsiDetails.score +
              macdDetails.score +
              smaDetails.score +
              srDetails.score +
              bbDetails.score +
              stochRsiDetails.score +
              athDetails.score +
              volumeDetails.score;
    const lastRSI = analysisData?.rsi ?? 50;
    
    let athWarning = '';
    
    if (isNearATH) {
      if (lastRSI > 70) {
        sum -= 2;
        athWarning = 'مشبع';
      } else if (lastRSI >= 65) {
        sum -= 1;
        athWarning = 'حذر';
      } else {
        athWarning = 'زخم';
      }
    }
    
    const finalScore = Math.max(-8, Math.min(8, sum));
    return { finalScore, athWarning, lastRSI };
  }, [rsiDetails.score, macdDetails.score, smaDetails.score, srDetails.score, bbDetails.score, stochRsiDetails.score, athDetails.score, volumeDetails.score, isNearATH, analysisData]);

  const overallScore = scoreDetails.finalScore;
  const { athWarning, lastRSI } = scoreDetails;

  const signalLabel = overallScore >= 5 ? (locale === 'ar' ? 'شراء قوي' : 'Strong Buy')
    : overallScore >= 2 ? (locale === 'ar' ? 'شراء' : 'Buy')
    : overallScore <= -5 ? (locale === 'ar' ? 'بيع قوي' : 'Strong Sell')
    : overallScore <= -2 ? (locale === 'ar' ? 'بيع' : 'Sell')
    : (locale === 'ar' ? 'محايد' : 'Neutral');

  const signalColor = overallScore >= 2 ? '#10B981' : overallScore <= -2 ? '#EF4444' : '#F59E0B';

  // ─── Targets / Stop Loss calculations ─────────────────────────────
  const probabilities = useMemo(() => {
    let bullScore = 0;
    let bearScore = 0;
    if (analysisData) {
      const rsi = analysisData.rsi ?? 50;
      if (rsi > 50) bullScore++; else bearScore++;
      const macd = analysisData.macd ?? 0;
      const sig = analysisData.macdSignal ?? 0;
      if (macd > sig) bullScore++; else bearScore++;

      const p = analysisData.close;
      const sma20 = analysisData.sma20 ?? p;
      if (p > sma20) bullScore++; else bearScore++;

      const sma50 = analysisData.sma50 ?? p;
      if (p > sma50) bullScore++; else bearScore++;
    }
    const total = bullScore + bearScore || 1;
    const rawBull = (bullScore / total) * 100;
    const bullPct = Math.round(20 + (rawBull / 100) * 60);
    const bearPct = 100 - bullPct;
    return { bullPct, bearPct };
  }, [analysisData]);

  const dealSetup = useMemo(() => {
    const resistancesAbove = topLevels
      .filter(e => e.isResistance && e.price > currentPrice)
      .sort((a, b) => a.price - b.price);
    const supportsBelow = topLevels
      .filter(e => !e.isResistance && e.price < currentPrice)
      .sort((a, b) => b.price - a.price);

    const action = overallScore >= 2 ? 'buy' : overallScore <= -2 ? 'sell' : 'neutral';
    const isSell = action === 'sell';

    // ATR calculations on analysisCandles:
    const atrValues = calcATR(analysisCandles, 14);
    const currentATR = atrValues[atrValues.length - 1] ?? (currentPrice * 0.015);

    // Multipliers for fallbacks:
    const tpMultiplier = isIntradayInterval ? 0.015 : 0.035;
    const tp2Multiplier = isIntradayInterval ? 0.03 : 0.07;
    const slMultiplier = isIntradayInterval ? 0.01 : 0.035;

    // 1. Bollinger Bands Targets:
    const bb_tp1 = analysisData?.sma20 ?? currentPrice;
    const bb_tp2 = isSell
      ? (analysisData?.bbLower ?? (currentPrice * (1 - tp2Multiplier)))
      : (analysisData?.bbUpper ?? (currentPrice * (1 + tp2Multiplier)));
    const bb_sl = isSell
      ? (analysisData?.bbUpper ?? (currentPrice * (1 + slMultiplier)))
      : (analysisData?.bbLower ?? (currentPrice * (1 - slMultiplier)));

    // 2. RSI Targets:
    const rsi_tp1 = isSell ? currentPrice - 1.2 * currentATR : currentPrice + 1.2 * currentATR;
    const rsi_tp2 = isSell ? currentPrice - 2.4 * currentATR : currentPrice + 2.4 * currentATR;
    const rsi_sl = isSell ? currentPrice + 1.5 * currentATR : currentPrice - 1.5 * currentATR;

    // 3. MACD Targets:
    const macd_tp1 = isSell ? currentPrice - 1.5 * currentATR : currentPrice + 1.5 * currentATR;
    const macd_tp2 = isSell ? currentPrice - 3.0 * currentATR : currentPrice + 3.0 * currentATR;
    const macd_sl = isSell ? currentPrice + 1.2 * currentATR : currentPrice - 1.2 * currentATR;

    // 4. Moving Averages Targets:
    const ma_tp1 = isSell ? currentPrice - 1.8 * currentATR : currentPrice + 1.8 * currentATR;
    const ma_tp2 = isSell ? currentPrice - 3.2 * currentATR : currentPrice + 3.2 * currentATR;
    const ma_sl = isSell
      ? Math.max(analysisData?.sma20 ?? currentPrice, analysisData?.sma50 ?? currentPrice) * 1.005
      : Math.min(analysisData?.sma20 ?? currentPrice, analysisData?.sma50 ?? currentPrice) * 0.995;

    // 5. Support / Resistance Targets:
    const sr_tp1 = isSell
      ? (supportsBelow[0]?.price ?? (currentPrice * (1 - tpMultiplier)))
      : (resistancesAbove[0]?.price ?? (currentPrice * (1 + tpMultiplier)));
    const sr_tp2 = isSell
      ? (supportsBelow[1]?.price ?? supportsBelow[0]?.price ?? (currentPrice * (1 - tp2Multiplier)))
      : (resistancesAbove[1]?.price ?? resistancesAbove[0]?.price ?? (currentPrice * (1 + tp2Multiplier)));
    const sr_sl = isSell
      ? (resistancesAbove[0]?.price ?? (currentPrice * (1 + slMultiplier)))
      : (supportsBelow[0]?.price ?? (currentPrice * (1 - slMultiplier)));

    // Median helper:
    function median(values: number[]): number {
      if (values.length === 0) return 0;
      const sorted = [...values].sort((a, b) => a - b);
      const half = Math.floor(sorted.length / 2);
      if (sorted.length % 2 !== 0) return sorted[half];
      return (sorted[half - 1] + sorted[half]) / 2.0;
    }

    // final consensus values
    const tp1 = median([bb_tp1, rsi_tp1, macd_tp1, ma_tp1, sr_tp1]);
    const tp2 = median([bb_tp2, rsi_tp2, macd_tp2, ma_tp2, sr_tp2]);
    const sl = median([bb_sl, rsi_sl, macd_sl, ma_sl, sr_sl]);

    const tp1Source = locale === 'ar' ? 'سعر توافقي (وسيط أهداف المؤشرات)' : 'Consensus price (median of indicator targets)';
    const tp2Source = locale === 'ar' ? 'سعر توافقي (وسيط أهداف المؤشرات الثاني)' : 'Consensus price (median of indicator second targets)';
    const slSource = locale === 'ar' ? 'سعر توافقي (وسيط مستويات الوقف)' : 'Consensus price (median of indicator stops)';
    const tradeDuration = isIntradayInterval
      ? (locale === 'ar' ? 'ساعات (صفقة يومية)' : 'Hours (Day Trading)')
      : (locale === 'ar' ? 'أيام - أسابيع (سـوينج - بحد أقصى ٢٠ يوم تداول للتصفية)' : 'Days - Weeks (Swing - Max 20 trading days)');
    const reward = isSell ? (currentPrice - ((tp1 + tp2) / 2)) : (((tp1 + tp2) / 2) - currentPrice);
    const risk = isSell ? (sl - currentPrice) : (currentPrice - sl);
    const rrNum = risk > 0 ? (reward / risk) : 1.0;
    const rr = risk > 0 ? (reward / risk).toFixed(1) : '1.0';

    // Quality filters checks
    const filteredByRR = rrNum < settings.min_risk_reward;
    const filteredByML = mlProb !== null && mlProb < settings.min_ml_probability;
    const filteredByVolume = settings.require_volume_spike && (analysisData?.volRatio ?? 1.0) < 1.3;
    const isFiltered = (action === 'buy' || action === 'sell') && (filteredByRR || filteredByML || filteredByVolume);

    const indicatorRecs = [
      {
        name: locale === 'ar' ? 'نطاقات البولنجر (Bollinger Bands)' : 'Bollinger Bands',
        signal: bbDetails.signal,
        tp1: bb_tp1,
        tp2: bb_tp2,
        sl: bb_sl
      },
      {
        name: locale === 'ar' ? 'مؤشر القوة النسبية (RSI)' : 'RSI Indicator',
        signal: rsiDetails.signal,
        tp1: rsi_tp1,
        tp2: rsi_tp2,
        sl: rsi_sl
      },
      {
        name: locale === 'ar' ? 'مؤشر الماكد (MACD)' : 'MACD Indicator',
        signal: macdDetails.signal,
        tp1: macd_tp1,
        tp2: macd_tp2,
        sl: macd_sl
      },
      {
        name: locale === 'ar' ? 'المتوسطات المتحركة (SMA 20/50)' : 'Moving Averages (SMA 20/50)',
        signal: smaDetails.signal,
        tp1: ma_tp1,
        tp2: ma_tp2,
        sl: ma_sl
      },
      {
        name: locale === 'ar' ? 'مستويات الدعم والمقاومة (S/R)' : 'Support & Resistance (S/R)',
        signal: srDetails.signal,
        tp1: sr_tp1,
        tp2: sr_tp2,
        sl: sr_sl
      }
    ];



    // Expected bars to reach targets:
    const barsToTP1 = currentATR > 0
      ? Math.round(Math.abs(tp1 - currentPrice) / currentATR)
      : null;
    const barsToTP2 = currentATR > 0
      ? Math.round(Math.abs(tp2 - currentPrice) / currentATR)
      : null;

    // Helper to translate bars to time description:
    function barsToTime(bars: number, intervalStr: string, loc: string): string {
      if (intervalStr === '15m') {
        const mins = bars * 15;
        if (mins < 60) return loc === 'ar' ? `~${mins} دقيقة` : `~${mins} min`;
        return loc === 'ar' ? `~${(mins / 60).toFixed(1)} ساعة` : `~${(mins / 60).toFixed(1)} hrs`;
      }
      if (intervalStr === '30m') {
        const hrs = (bars * 30) / 60;
        return loc === 'ar' ? `~${hrs.toFixed(1)} ساعة` : `~${hrs.toFixed(1)} hrs`;
      }
      if (['1h', '4h'].includes(intervalStr)) {
        const hrs = bars * (intervalStr === '4h' ? 4 : 1);
        if (hrs < 24) return loc === 'ar' ? `~${hrs} ساعة` : `~${hrs} hrs`;
        return loc === 'ar' ? `~${(hrs / 24).toFixed(1)} يوم` : `~${(hrs / 24).toFixed(1)} days`;
      }
      // 1D fallback
      return loc === 'ar' ? `~${bars} يوم تداول` : `~${bars} trading days`;
    }

    const fallbackTimeToTP1 = barsToTP1 !== null ? barsToTime(barsToTP1, interval, locale) : null;
    const fallbackTimeToTP2 = barsToTP2 !== null ? barsToTime(barsToTP2, interval, locale) : null;

    // Historical Win Rate fallback calculation:
    const rsiArr = analysisRsiRaw.map(x => x ?? 50);
    const macdArr = analysisMacdRaw.map(m => m?.histogram ?? 0);

    let localWins1 = 0;
    let localWins2 = 0;
    let localTotal = 0;
    
    // We must ensure index bounds: i must be < analysisCandles.length - 21 to have a full 20 future candles.
    const maxIndex = analysisCandles.length - 21;
    const lookback = Math.min(80, maxIndex - 20);

    if (lookback > 0) {
      for (let i = 20; i < 20 + lookback; i++) {
        const histRsi = rsiArr[i] ?? 50;
        const histMacd = macdArr[i] ?? 0;

        const isBullSimilar = action === 'buy' && histRsi > 45 && histRsi < 70 && histMacd > 0;
        const isBearSimilar = action === 'sell' && histRsi < 55 && histRsi > 30 && histMacd < 0;

        if (!isBullSimilar && !isBearSimilar) continue;
        localTotal++;

        const futureWindow = analysisCandles.slice(i + 1, i + 21);
        const entryPrice = analysisCandles[i].close;

        const targetHit = futureWindow.some(c =>
          action === 'buy'
            ? c.high >= entryPrice * (1 + tpMultiplier)
            : c.low <= entryPrice * (1 - tpMultiplier)
        );
        if (targetHit) localWins1++;

        const targetHit2 = futureWindow.some(c =>
          action === 'buy'
            ? c.high >= entryPrice * (1 + tp2Multiplier)
            : c.low <= entryPrice * (1 - tp2Multiplier)
        );
        if (targetHit2) localWins2++;
      }
    }

    const localWinRate1 = localTotal >= 10 ? Math.round((localWins1 / localTotal) * 100) : null;
    const localWinRate2 = localTotal >= 10 ? Math.round((localWins2 / localTotal) * 100) : null;

    // Check matching statistics from DB:
    const matchingStat = signalStats.find(s =>
      s.timeframe === interval &&
      s.signal_type === action
    );

    const winRate = matchingStat ? Math.round(matchingStat.win_rate_tp1) : localWinRate1;
    const winRate2 = matchingStat ? Math.round(matchingStat.win_rate_tp2) : localWinRate2;
    const totalSignals = matchingStat ? matchingStat.total_signals : localTotal;

    const timeToTP1 = matchingStat && matchingStat.avg_bars_tp1 !== null
      ? barsToTime(Math.round(matchingStat.avg_bars_tp1), interval, locale)
      : fallbackTimeToTP1;

    const timeToTP2 = matchingStat && matchingStat.avg_bars_tp2 !== null
      ? barsToTime(Math.round(matchingStat.avg_bars_tp2), interval, locale)
      : fallbackTimeToTP2;

    // Generate educational note based on score
    let noteAR = '';
    let noteEN = '';
    
    if (isNearATH) {
      if (lastRSI > 70) {
        noteAR = `🔴 تشبع شرائي عند قمة تاريخية\n\nRSI (${lastRSI.toFixed(0)}) في منطقة التشبع الشرائي والسهم عند أعلى مستوياته التاريخية. هذا مزيج يرفع احتمال التصحيح.\nالمتداولون المحترفون يأخذون أرباحاً أو يخففون مراكزهم في هذه الحالة.\n\nلا ينصح بالدخول الجديد — انتظر تصحيحاً أو إغلاق يومي قوي جديد.`;
        noteEN = `🔴 Overbought at All-Time High\n\nRSI (${lastRSI.toFixed(0)}) is overbought while testing ATH, increasing correction risk. Professionals usually take profits here.\nWait for a pullback before entering new positions.`;
      } else if (lastRSI >= 65) {
        noteAR = `⚠️ شراء مع حذر — منطقة تشبع قريبة\n\nالسهم عند قمة تاريخية والـ RSI (${lastRSI.toFixed(0)}) يقترب من منطقة التشبع الشرائي (70+). الزخم لا يزال إيجابياً لكن المخاطرة ترتفع عند هذه المستويات.\n\nنصيحة: استخدم وقف خسارة محكم وأهدافاً أصغر عند ATH.`;
        noteEN = `⚠️ Cautious Buy — approaching overbought\n\nTesting ATH with RSI (${lastRSI.toFixed(0)}) nearing overbought (70+). Momentum is positive but risk is elevated.\nTip: Use tight stop losses and smaller targets.`;
      } else if (analysisData?.macd && analysisData.macd > (analysisData.macdSignal ?? 0)) {
        noteAR = `📈 شراء قوي عند قمة تاريخية\n\nلماذا الشراء رغم القمة التاريخية؟\nالسهم كسر أعلى مستوياته السابقة بزخم قوي (MACD موجب). RSI (${lastRSI.toFixed(0)}) لم يصل لمنطقة التشبع بعد، مما يعني أن هناك مساحة للصعود.\n\nفي مثل هذه الحالات (Breakout)، القمة القديمة تصبح دعماً جديداً.\n⚠️ انتبه: بدون مقاومات تاريخية، الهدف يُحسب بنسبة % وليس من مستوى محدد.`;
        noteEN = `📈 Strong Breakout Buy\n\nWhy buy at ATH? Breakout confirmed with strong momentum (MACD positive). RSI (${lastRSI.toFixed(0)}) has room to grow.\nOld resistance becomes new support.\n⚠️ Targets are calculated by % since no historical resistance exists.`;
      } else {
        noteAR = `⚖️ السهم يختبر قمة تاريخية بزخم محايد\n\nالسعر عند مستويات عليا ولكن مؤشر الـ MACD لم يؤكد الاختراق بقوة بعد. يفضل انتظار شمعة تأكيد فوق القمة قبل الشراء.`;
        noteEN = `⚖️ Testing ATH with neutral momentum\n\nWait for strong breakout confirmation (MACD crossover) before entering.`;
      }
    } else {
      if (action === 'buy') {
        noteAR = `📈 إشارة شراء قوية\n\nالمؤشرات متوافقة: RSI (${lastRSI.toFixed(0)}) في منطقة محايدة → مساحة للصعود. MACD موجب → زخم صاعد. السعر ${analysisData?.close! > (analysisData?.sma20 ?? 0) ? 'فوق' : 'تحت'} المتوسط المتحرك 20 → اتجاه إيجابي.`;
        noteEN = `📈 Strong Buy Signal\n\nIndicators aligned: RSI (${lastRSI.toFixed(0)}) has room to grow, MACD positive. Price ${analysisData?.close! > (analysisData?.sma20 ?? 0) ? 'above' : 'below'} SMA20.`;
      } else if (action === 'sell') {
        noteAR = `🔴 إشارات هبوط\n\nRSI (${lastRSI.toFixed(0)}) يميل للبيع والـ MACD سلبي يعكس ضعف الزخم. السعر ${analysisData?.close! < (analysisData?.sma20 ?? 0) ? 'تحت' : 'فوق'} المتوسط المتحرك 20.`;
        noteEN = `🔴 Bearish signals\n\nRSI (${lastRSI.toFixed(0)}) favors sell, MACD negative. Price ${analysisData?.close! < (analysisData?.sma20 ?? 0) ? 'below' : 'above'} SMA20.`;
      } else {
        noteAR = `⚖️ السوق في حالة انتظار\n\nالمؤشرات لا تعطي اتجاهاً واضحاً الآن. MACD لم يتأكد والسعر بين المتوسطات.\n\nانتظر: كسر ${resistancesAbove[0]?.price.toFixed(2) ?? '-'} للشراء، أو كسر ${supportsBelow[0]?.price.toFixed(2) ?? '-'} للخروج.`;
        noteEN = `⚖️ Market is waiting\n\nIndicators lack clear direction. MACD unconfirmed.\n\nWait: Break above ${resistancesAbove[0]?.price.toFixed(2) ?? '-'} to buy, or below ${supportsBelow[0]?.price.toFixed(2) ?? '-'} to sell.`;
      }
    }
    
    return {
      action,
      entry: currentPrice,
      tp1,
      tp1Source,
      tp2,
      tp2Source,
      sl,
      slSource,
      rr,
      isSell,
      noteAR,
      noteEN,
      tradeDuration,
      timeToTP1,
      timeToTP2,
      winRate,
      winRate2,
      totalSignals,
      atr: currentATR,
      indicatorRecs,
      filteredByRR,
      filteredByML,
      filteredByVolume,
      isFiltered
    };
  }, [overallScore, topLevels, currentPrice, analysisData, isNearATH, lastRSI, locale, isIntradayInterval, analysisCandles, analysisRsiRaw, analysisMacdRaw, signalStats, bbDetails, rsiDetails, macdDetails, smaDetails, srDetails, settings, mlProb]);

  // تحقق هل TP1 قريب من مقاومة قوية؟
  const tp1NearResistance = useMemo(() => {
    if (!dealSetup) return false;
    return srLevels.some(l =>
      l.type === 'resistance' &&
      Math.abs(l.price - dealSetup.tp1) / dealSetup.tp1 < 0.02
    );
  }, [srLevels, dealSetup]);

  useEffect(() => {
    if (!analysisData) {
      setMlProb(null);
      return;
    }

    const dayOfWeek = new Date().getDay();

    const features = [
      analysisData.rsi ?? 50,
      analysisData.macdHistogram ?? 0,
      analysisData.macd ?? 0,
      analysisData.sma20
        ? (currentPrice - analysisData.sma20) / analysisData.sma20 * 100 : 0,
      analysisData.sma50
        ? (currentPrice - analysisData.sma50) / analysisData.sma50 * 100 : 0,
      (dealSetup?.atr ?? 0) / (currentPrice || 1) * 100,
      Math.min(analysisData.volRatio ?? 1, 5),
      0.5,           // price_pos
      analysisData.bbWidth ?? 2,
      analysisData.bbPos ?? 0,
      analysisData.stochRsi ?? 0.5,
      analysisData.volSpike ?? 0,
      analysisData.distAth ?? 0,
      dayOfWeek,
    ].join(',');

    fetch('/api/ml-predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features, interval })
    })
      .then(r => r.json())
      .then(d => setMlProb(d.probability))
      .catch(() => setMlProb(null));
  }, [analysisData, interval, dealSetup?.atr, currentPrice]);

  useEffect(() => {
    setIsSaved(false);
    if (!symbol) return;
    fetch(`/api/trades?symbol=${symbol}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.trades) {
          const hasActive = data.trades.some((t: any) => t.status === 'active');
          if (hasActive) {
            setIsSaved(true);
          }
        }
      })
      .catch(err => console.error('Error fetching trades:', err));
  }, [symbol]);

  const handleSaveRecommendation = async () => {
    if (isSaving || isSaved) return;
    setIsSaving(true);
    try {
      const dayOfWeek = new Date().getDay();
      const featuresSnapshot = analysisData ? {
        rsi: analysisData.rsi ?? 50,
        macd_hist: analysisData.macdHistogram ?? 0,
        macd: analysisData.macd ?? 0,
        sma20_dist: analysisData.sma20 ? (currentPrice - analysisData.sma20) / analysisData.sma20 * 100 : 0,
        sma50_dist: analysisData.sma50 ? (currentPrice - analysisData.sma50) / analysisData.sma50 * 100 : 0,
        atr_pct: (dealSetup?.atr ?? 0) / (currentPrice || 1) * 100,
        vol_ratio: Math.min(analysisData.volRatio ?? 1, 5),
        bb_width: analysisData.bbWidth ?? 2,
        bb_pos: analysisData.bbPos ?? 0,
        stoch_rsi: analysisData.stochRsi ?? 0.5,
        vol_spike: analysisData.volSpike ?? 0,
        dist_ath: analysisData.distAth ?? 0,
        day_of_week: dayOfWeek
      } : null;

      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          symbol,
          direction: dealSetup.action,
          entry_price: dealSetup.entry,
          tp1: dealSetup.tp1,
          tp2: dealSetup.tp2,
          sl: dealSetup.sl,
          timeframe: interval,
          ml_probability: mlProb,
          win_rate_hist: dealSetup.winRate,
          features_snapshot: featuresSnapshot
        })
      });

      if (res.ok) {
        setIsSaved(true);
        setToastMessage(
          locale === 'ar'
            ? '✅ تم حفظ التوصية بنجاح لمتابعة الأداء!'
            : '✅ Recommendation saved successfully for performance tracking!'
        );
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save');
      }
    } catch (err: any) {
      console.error('Error saving trade:', err);
      setToastMessage(
        locale === 'ar'
          ? `❌ فشل حفظ التوصية: ${err.message}`
          : `❌ Failed to save recommendation: ${err.message}`
      );
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };



  const scoreBarPct = ((overallScore + 8) / 16) * 100;
  const isLargeData = allChartData.length > 200;

  const CustomRSITooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="glass-card p-2 rounded-lg border border-white/10 text-xs font-sans">
        <p className="text-[#A78BFA] font-semibold">RSI: {d.rsi?.toFixed(1) ?? '-'}</p>
      </div>
    );
  };

  const CustomMACDTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="glass-card p-2 rounded-lg border border-white/10 text-xs font-sans flex flex-col gap-0.5">
        <p className="text-[#3B82F6] font-semibold">MACD: {d.macd?.toFixed(3) ?? '-'}</p>
        <p className="text-[#F59E0B] font-semibold">Sig: {d.macdSignal?.toFixed(3) ?? '-'}</p>
        <p className={`${(d.macdHistogram ?? 0) >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'} font-semibold`}>
          Hist: {d.macdHistogram?.toFixed(3) ?? '-'}
        </p>
      </div>
    );
  };

  const INTERVALS: { label: string; value: Interval }[] = [
    { label: '15m', value: '15m' },
    { label: '30m', value: '30m' },
    { label: '1H', value: '1h' },
    { label: '4H', value: '4h' },
    { label: '1D', value: '1d' },
    { label: '1W', value: '1w' },
    { label: '1M', value: '1m' },
  ];

  const resistanceEntries = topLevels.filter(e => e.isResistance);
  const supportEntries = topLevels.filter(e => !e.isResistance);

  return (
    <div className="glass-card p-5 rounded-2xl mb-6 flex flex-col gap-5">

      {/* ── OHLCV Live Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-white/[0.02] px-5 py-4 rounded-xl border border-white/5 font-sans">
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-extrabold text-text-primary tracking-tight">
              {latestClose.toFixed(3)}
              <span className="text-sm font-bold text-text-secondary ml-1.5">
                {locale === 'ar' ? 'ج.م' : 'EGP'}
              </span>
            </span>
            <span className={`text-sm font-extrabold px-2 py-0.5 rounded-lg ${isUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {isUp ? '+' : ''}{priceChange.diff.toFixed(3)} ({isUp ? '+' : ''}{priceChange.pct.toFixed(2)}%) {isUp ? '↑' : '↓'}
            </span>
          </div>
          {displayOHLCV && (
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] font-medium text-text-secondary mt-1">
              <span>{locale === 'ar' ? 'أ:' : 'O:'} <span className="text-text-primary font-mono">{displayOHLCV.open.toFixed(3)}</span></span>
              <span>{locale === 'ar' ? 'ع:' : 'H:'} <span className="text-text-primary font-mono">{displayOHLCV.high.toFixed(3)}</span></span>
              <span>{locale === 'ar' ? 'ص:' : 'L:'} <span className="text-text-primary font-mono">{displayOHLCV.low.toFixed(3)}</span></span>
              <span>{locale === 'ar' ? 'ق:' : 'C:'} <span className="text-text-primary font-mono">{displayOHLCV.close.toFixed(3)}</span></span>
              <span>{locale === 'ar' ? 'حجم:' : 'Vol:'} <span className="text-text-primary font-mono">{formatVolume(displayOHLCV.volume)}</span></span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1 text-[11px] text-text-secondary">
          <div className="flex items-center gap-1.5 font-bold">
            <span>{marketOpen ? '🟢' : '⚫'}</span>
            <span className="text-text-primary">
              {marketOpen ? (locale === 'ar' ? 'مباشر' : 'Live') : (locale === 'ar' ? 'السوق مغلق' : 'Closed')}
            </span>
          </div>
          <span>
            {locale === 'ar' ? 'آخر تحديث: ' : 'Updated: '}
            <span className="font-mono text-text-primary">
              {lastUpdated.toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </span>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border border-yellow-500/20 bg-[#0A0F1E]/95 text-yellow-400 text-xs font-semibold shadow-2xl backdrop-blur-md animate-fade-in font-sans">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-3 text-text-secondary hover:text-white cursor-pointer font-bold text-xs p-1">
            ✕
          </button>
        </div>
      )}

      {/* ── Indicator Toggles ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'SMA', active: showSMA, toggle: () => setShowSMA(!showSMA), color: '#10B981' },
          { key: 'BB', active: showBB, toggle: () => setShowBB(!showBB), color: '#6366F1' },
          { key: 'RSI', active: showRSI, toggle: () => setShowRSI(!showRSI), color: '#A78BFA' },
          { key: 'MACD', active: showMACD, toggle: () => setShowMACD(!showMACD), color: '#3B82F6' },
          { key: 'Vol', active: showVol, toggle: () => setShowVol(!showVol), color: '#F59E0B' },
        ].map(({ key, active, toggle, color }) => (
          <button key={key} onClick={toggle}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all duration-150"
            style={{
              background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
              color: active ? color : '#9CA3AF',
              borderColor: active ? `${color}55` : 'rgba(255,255,255,0.08)',
            }}>
            {key}
          </button>
        ))}
      </div>

      {/* ── Main Chart Grid ── */}
      {isIntradayLoading ? (
        <div className="w-full h-96 flex flex-col items-center justify-center text-text-secondary border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
          <span className="text-xl animate-spin mb-2">🔄</span>
          <span className="text-xs font-bold font-sans tracking-wide text-text-secondary/60">
            {locale === 'ar' ? 'جاري تحميل البيانات اللحظية من Yahoo Finance...' : 'Loading Yahoo Finance Intraday candles...'}
          </span>
        </div>
      ) : allChartData.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">

          {/* Left Column: Candlestick + RSI/MACD subcharts */}
          <div className="xl:col-span-8 flex flex-col gap-3">

            {/* Timeframe/Interval selectors */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {INTERVALS.map(({ label, value }) => (
                <button key={value} onClick={() => setIntervalVal(value)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold border cursor-pointer transition-all duration-150 font-sans ${
                    interval === value
                      ? 'bg-[#6366F1]/20 border-[#6366F1] text-white'
                      : 'bg-transparent border-white/10 text-text-secondary hover:text-text-primary hover:border-white/25'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Candlestick Chart */}
            <div className="relative">
              <CandlestickChart
                ref={chartRef}
                data={allChartData}
                showSMA={showSMA}
                showBB={showBB}
                showVol={showVol}
                interval={interval}
                srLevels={srLevels}
                onCrosshairMove={handleCrosshairMove}
              />
              {intradayHasNoData && ['15m', '30m', '1h', '4h'].includes(interval) && (
                <div className="absolute top-2 left-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none select-none font-sans">
                  ⚠️ {locale === 'ar' ? 'شارت تقديري' : 'Estimated Chart'}
                </div>
              )}
            </div>

            {/* Notice for 15m/30m/1h/4h */}
            {['15m', '30m', '1h', '4h'].includes(interval) && (
              <div className="w-full text-center mt-1 text-[10px] text-text-secondary/60 italic flex flex-col justify-center items-center gap-0.5">
                {intradayHasNoData ? (
                  <span className="text-yellow-500 bg-yellow-500/5 border border-yellow-500/10 py-1 px-3 rounded-lg w-full">
                    ⚠️ {locale === 'ar'
                      ? 'بيانات تقديرية — غير متاحة من المصادر الفنية اللحظية (توليد ذكي من الشموع اليومية)'
                      : 'Estimated data — unavailable from live sources (smartly generated from daily candles)'}
                  </span>
                ) : (
                  <span>⏱ {locale === 'ar' ? `البيانات اللحظية من DB: ${dbCandlesCount} شمعة` : `Intraday data from DB: ${dbCandlesCount} candles`}</span>
                )}
              </div>
            )}

            {/* RSI sub-chart */}
            {showRSI && (
              <div className="w-full h-[90px]">
                <div className="flex justify-between items-center px-1 mb-1 text-[10px]">
                  <span className="text-text-secondary/60 font-bold uppercase tracking-wider">RSI (14)</span>
                  <span className="font-mono text-[#A78BFA] font-bold">
                    {activeData?.rsi?.toFixed(1) ?? '-'}
                    <span className="text-text-secondary/60 ml-1.5">{rsiDetails.desc}</span>
                  </span>
                </div>
                {activePrices.length >= 14 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={allChartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                      <XAxis dataKey="price_date" hide />
                      <YAxis domain={[0, 100]} ticks={[30, 70]} stroke="#9CA3AF" fontSize={9} tickLine={false} />
                      <Tooltip content={<CustomRSITooltip />} />
                      <ReferenceArea y1={70} y2={100} fill="#EF4444" fillOpacity={0.05} />
                      <ReferenceArea y1={0} y2={30} fill="#10B981" fillOpacity={0.05} />
                      <ReferenceLine y={70} stroke="#EF4444" strokeWidth={0.5} strokeDasharray="3 3" />
                      <ReferenceLine y={30} stroke="#10B981" strokeWidth={0.5} strokeDasharray="3 3" />
                      {hoveredDate && <ReferenceLine x={hoveredDate} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />}
                      <Line type="monotone" dataKey="rsi" stroke="#A78BFA" strokeWidth={1.5} dot={false} isAnimationActive={!isLargeData} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary/40 text-[10px] border border-dashed border-white/5 rounded-lg">
                    {tTA('insufficientRsi')}
                  </div>
                )}
              </div>
            )}

            {/* MACD sub-chart */}
            {showMACD && (
              <div className="w-full h-[90px]">
                <div className="flex justify-between items-center px-1 mb-1 text-[10px]">
                  <span className="text-text-secondary/60 font-bold uppercase tracking-wider">MACD</span>
                  <span className={`font-mono font-bold ${(activeData?.macdHistogram ?? 0) >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {macdDetails.desc}
                  </span>
                </div>
                {activePrices.length >= 26 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={allChartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                      <XAxis dataKey="price_date" hide />
                      <YAxis stroke="#9CA3AF" fontSize={9} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip content={<CustomMACDTooltip />} />
                      <Bar dataKey="macdHistogram" isAnimationActive={!isLargeData}>
                        {allChartData.map((entry, index) => (
                          <Cell key={`macd-${index}`} fill={(entry.macdHistogram ?? 0) >= 0 ? '#10B981' : '#EF4444'} opacity={0.7} />
                        ))}
                      </Bar>
                      <Line type="monotone" dataKey="macd" stroke="#3B82F6" strokeWidth={1.2} dot={false} isAnimationActive={!isLargeData} />
                      <Line type="monotone" dataKey="macdSignal" stroke="#F59E0B" strokeWidth={1.2} dot={false} isAnimationActive={!isLargeData} />
                      {hoveredDate && <ReferenceLine x={hoveredDate} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />}
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary/40 text-[10px] border border-dashed border-white/5 rounded-lg">
                    {tTA('insufficientMacd')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Technical details & Recommendation sidebar */}
          <div className="xl:col-span-4 flex flex-col gap-4">

            {/* Task 2: Support & Resistance List */}
            <div className="glass-card p-4 rounded-2xl border border-white/5 font-sans">
              <h3 className="text-[11px] font-bold text-text-primary flex items-center gap-2 pb-2.5 border-b border-white/5 mb-3">
                <span>📈</span>
                <span>{locale === 'ar' ? 'مستويات الدعم والمقاومة' : 'Support & Resistance'}</span>
              </h3>

              {/* Resistances */}
              {resistanceEntries.length > 0 ? (
                <div className="mb-3">
                  <span className="text-[9px] font-bold uppercase text-red-400/60 tracking-wider mb-1.5 block">
                    {locale === 'ar' ? 'مقاومة' : 'Resistance'}
                  </span>
                  {resistanceEntries.map(entry => {
                    const isVisible = visibleSRLines.has(entry.price);
                    
                    let bgClass = '';
                    let titleElement = null;
                    
                    if (entry.isATH) {
                      bgClass = isVisible 
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                        : 'bg-transparent border-white/10 text-text-secondary/50';
                      titleElement = <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1" title={entry.label}>🏆 {entry.label}</span>;
                    } else if (entry.isProjected) {
                      bgClass = isVisible 
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.15)]' 
                        : 'bg-transparent border-white/10 text-text-secondary/50';
                      titleElement = <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-1" title={entry.label}>🎯 {entry.label}</span>;
                    } else {
                      bgClass = isVisible 
                        ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                        : 'bg-transparent border-white/10 text-text-secondary/50';
                      if (entry.isClosest) {
                        titleElement = <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-1 py-0.5 rounded flex items-center gap-0.5" title={locale === 'ar' ? 'أقرب مستوى مقاومة' : 'Closest resistance'}>🎯 {locale === 'ar' ? 'أقرب' : 'closest'} ({entry.distPct.toFixed(1)}%)</span>;
                      }
                    }
                    
                    return (
                      <div key={entry.id} className="flex flex-col mb-1.5">
                        <div 
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${bgClass}`}
                        >
                          <button
                            onClick={() => handleToggleSR(entry.price)}
                            className="w-5 h-5 flex items-center justify-center transition-all cursor-pointer font-sans"
                          >
                            {isVisible ? '👁' : '👁‍🗨'}
                          </button>
                          <div className="flex-1 flex items-center justify-between text-xs">
                            <span className="font-mono font-bold">
                              {entry.price.toFixed(3)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {!entry.isProjected && !entry.isATH && (
                                <span className="text-[9px]">
                                  {locale === 'ar' ? `لمس ${entry.strength}×` : `${entry.strength}× touch`}
                                </span>
                              )}
                              {titleElement}
                            </div>
                          </div>
                        </div>
                        {entry.isATH && (
                          <div className="text-[9px] text-amber-500/80 italic mt-0.5 px-2">
                            {locale === 'ar' 
                              ? 'هذا هو أعلى سعر وصله السهم في تاريخه — ليس له مقاومة تاريخية فوقه.' 
                              : 'This is the highest price the stock has ever reached — no historical resistance above it.'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mb-3">
                  <span className="text-[9px] font-bold uppercase text-red-400/60 tracking-wider mb-1.5 block">
                    {locale === 'ar' ? 'مقاومة' : 'Resistance'}
                  </span>
                  <div className="text-[10px] text-text-secondary/50 italic px-2 py-1.5 border border-white/5 rounded-lg text-center">
                    {activePrices.length > 0 && currentPrice >= Math.max(...activePrices.map(p => p.high_price || p.close_price)) * 0.99
                      ? (locale === 'ar' ? '⚠️ السهم يختبر قمة تاريخية جديدة — لا توجد مقاومات سابقة' : '⚠️ Testing All-Time Highs — no historical resistance')
                      : (locale === 'ar' ? 'لم يتم رصد مستويات مقاومة قريبة' : 'No nearby resistance levels detected')
                    }
                  </div>
                </div>
              )}

              {/* Supports */}
              {supportEntries.length > 0 ? (
                <div>
                  <span className="text-[9px] font-bold uppercase text-green-400/60 tracking-wider mb-1.5 block">
                    {locale === 'ar' ? 'دعم' : 'Support'}
                  </span>
                  {supportEntries.map(entry => {
                    const isVisible = visibleSRLines.has(entry.price);
                    return (
                      <div key={entry.id} 
                        className={`flex items-center gap-2 mb-1.5 px-2 py-1.5 rounded-lg border transition-all ${
                          isVisible 
                            ? 'bg-green-500/10 border-green-500/35 text-green-400' 
                            : 'bg-transparent border-white/10 text-text-secondary/50'
                        }`}
                      >
                        <button
                          onClick={() => handleToggleSR(entry.price)}
                          className="w-5 h-5 flex items-center justify-center transition-all cursor-pointer font-sans"
                        >
                          {isVisible ? '👁' : '👁‍🗨'}
                        </button>
                        <div className="flex-1 flex items-center justify-between text-xs">
                          <span className="font-mono font-bold">
                            {entry.price.toFixed(3)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px]">
                              {locale === 'ar' ? `لمس ${entry.strength}×` : `${entry.strength}× touch`}
                            </span>
                            {entry.isClosest && (
                              <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-1 py-0.5 rounded flex items-center gap-0.5" title={locale === 'ar' ? 'أقرب مستوى دعم' : 'Closest support'}>
                                🎯 {locale === 'ar' ? 'أقرب' : 'closest'} ({entry.distPct.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <span className="text-[9px] font-bold uppercase text-green-400/60 tracking-wider mb-1.5 block">
                    {locale === 'ar' ? 'دعم' : 'Support'}
                  </span>
                  <div className="text-[10px] text-text-secondary/50 italic px-2 py-1.5 border border-white/5 rounded-lg text-center">
                    {locale === 'ar' ? 'لم يتم رصد مستويات دعم قريبة' : 'No nearby support levels detected'}
                  </div>
                </div>
              )}

              {topLevels.length === 0 && (
                <p className="text-[10px] text-text-secondary/40 italic">
                  {locale === 'ar' ? 'لا توجد مستويات كافية' : 'Not enough levels found'}
                </p>
              )}
            </div>

            {/* Task 3: Detailed Indicator Scorecard Panel */}
            <div className="glass-card p-4 rounded-2xl border border-white/5 font-sans flex flex-col gap-4">
              {/* Timeframe Analysis Banner */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                  {isIntradayInterval && !intradayHasNoData ? (
                    <>
                      <span>⚡</span>
                      <span>{locale === 'ar' ? `تحليل فني للفريم الزمني: ${interval}` : `Technical Analysis (${interval})`}</span>
                    </>
                  ) : (
                    <>
                      <span>📊</span>
                      <span>{locale === 'ar' ? 'تحليل فني: اليومي' : 'Technical Analysis: Daily'}</span>
                    </>
                  )}
                </div>
                <div className="text-[10px] text-text-secondary/70">
                  {isIntradayInterval && !intradayHasNoData ? (
                    <span>{locale === 'ar' ? 'صالح لصفقات اليوم (Day Trading)' : 'Suitable for Day Trading'}</span>
                  ) : (
                    <span>{locale === 'ar' ? 'صالح للسوينج (أسابيع - أشهر)' : 'Suitable for Swing Trading (weeks - months)'}</span>
                  )}
                </div>
              </div>

              <h3 className="text-[11px] font-bold text-text-primary flex items-center gap-2 pb-2.5 border-b border-white/5">
                <span>📊</span>
                <span>{locale === 'ar' ? 'تفصيل المؤشرات التقنية' : 'Detailed Indicators'}</span>
              </h3>

              {/* RSI Scorecard */}
              <div className="flex flex-col gap-1 pb-2.5 border-b border-white/5">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-text-secondary flex items-center gap-1">
                    RSI (14): 
                    <div className="group relative flex items-center">
                      <Info className="w-3.5 h-3.5 cursor-help" />
                      <div className="hidden group-hover:block absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 p-2.5 bg-surface-dark border border-white/10 rounded-xl shadow-2xl text-[10px] text-text-secondary font-normal whitespace-normal leading-relaxed">
                        {locale === 'ar' ? 'مؤشر القوة النسبية يقيس سرعة وتغير حركات الأسعار. القيمة فوق 70 تعني ذروة شراء (تشبع شرائي)، وتحت 30 تعني ذروة بيع (تشبع بيعي).' : 'RSI measures the speed and change of price movements. >70 is overbought, <30 is oversold.'}
                      </div>
                    </div>
                    <span className="font-mono text-text-primary ml-1">{rsiDetails.val}</span>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    rsiDetails.score > 0 ? 'bg-green-500/10 text-green-400' : rsiDetails.score < 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-text-secondary'
                  }`}>
                    {rsiDetails.signal} {locale === 'ar' ? (rsiDetails.score > 0 ? 'شراء' : rsiDetails.score < 0 ? 'بيع' : 'محايد') : (rsiDetails.score > 0 ? 'Buy' : rsiDetails.score < 0 ? 'Sell' : 'Neutral')} ({rsiDetails.score >= 0 ? '+' : ''}{rsiDetails.score} {locale === 'ar' ? 'نقطة' : 'pts'})
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary/70">{rsiDetails.desc}</p>
                <div className="font-mono text-xs text-[#A78BFA] tracking-wider mt-0.5">
                  {rsiDetails.bar} <span className="text-[10px] text-text-secondary/50">{rsiDetails.val}/100</span>
                </div>
              </div>

              {/* MACD Scorecard */}
              <div className="flex flex-col gap-1 pb-2.5 border-b border-white/5">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-text-secondary flex items-center gap-1">
                    MACD: 
                    <div className="group relative flex items-center">
                      <Info className="w-3.5 h-3.5 cursor-help" />
                      <div className="hidden group-hover:block absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 p-2.5 bg-surface-dark border border-white/10 rounded-xl shadow-2xl text-[10px] text-text-secondary font-normal whitespace-normal leading-relaxed">
                        {locale === 'ar' ? 'يُظهر العلاقة بين متوسطين متحركين. التقاطع الإيجابي (فوق خط الإشارة) يدل على زخم صاعد، والتقاطع السلبي يدل على زخم هابط.' : 'Shows relationship between two moving averages. Crossing above signal line indicates upward momentum.'}
                      </div>
                    </div>
                    <span className="font-mono text-text-primary ml-1">{macdDetails.val}</span>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    macdDetails.score > 0 ? 'bg-green-500/10 text-green-400' : macdDetails.score < 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-text-secondary'
                  }`}>
                    {macdDetails.signal} {locale === 'ar' ? (macdDetails.score > 0 ? 'شراء' : 'بيع') : (macdDetails.score > 0 ? 'Buy' : 'Sell')} ({macdDetails.score >= 0 ? '+' : ''}{macdDetails.score} {locale === 'ar' ? 'نقطة' : 'pts'})
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary/70">{macdDetails.desc}</p>
              </div>

              {/* SMA Scorecard */}
              <div className="flex flex-col gap-1 pb-2.5 border-b border-white/5">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-text-secondary flex items-center gap-1">
                    SMA:
                    <div className="group relative flex items-center">
                      <Info className="w-3.5 h-3.5 cursor-help" />
                      <div className="hidden group-hover:block absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 p-2.5 bg-surface-dark border border-white/10 rounded-xl shadow-2xl text-[10px] text-text-secondary font-normal whitespace-normal leading-relaxed">
                        {locale === 'ar' ? 'المتوسطات المتحركة البسيطة. بقاء السعر فوق متوسط 20 و 50 يوم يؤكد قوة الاتجاه الصاعد للسهم.' : 'Simple Moving Averages. Price staying above 20 and 50 SMA confirms a strong uptrend.'}
                      </div>
                    </div>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    smaDetails.score > 0 ? 'bg-green-500/10 text-green-400' : smaDetails.score < 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-text-secondary'
                  }`}>
                    {smaDetails.signal} {locale === 'ar' ? (smaDetails.score > 0 ? 'شراء' : smaDetails.score < 0 ? 'بيع' : 'محايد') : (smaDetails.score > 0 ? 'Buy' : smaDetails.score < 0 ? 'Sell' : 'Neutral')} ({smaDetails.score >= 0 ? '+' : ''}{smaDetails.score} {locale === 'ar' ? 'نقطة' : 'pts'})
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary/70">{smaDetails.desc}</p>
                <div className="text-[9px] font-mono text-text-secondary/50 mt-0.5">{smaDetails.val}</div>
              </div>

              {/* Volume Scorecard */}
              <div className="flex flex-col gap-1 pb-2.5 border-b border-white/5">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-text-secondary flex items-center gap-1">
                    {locale === 'ar' ? 'الحجم (Volume):' : 'Volume:'}
                    <div className="group relative flex items-center">
                      <Info className="w-3.5 h-3.5 cursor-help" />
                      <div className="hidden group-hover:block absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 p-2.5 bg-surface-dark border border-white/10 rounded-xl shadow-2xl text-[10px] text-text-secondary font-normal whitespace-normal leading-relaxed">
                        {locale === 'ar' ? 'يقارن حجم التداول للشمعة الأخيرة بمتوسط آخر 20 شمعة. الأحجام المرتفعة تؤكد قوة الاتجاه (صعوداً أو هبوطاً).' : 'Compares last volume with 20-period average. High volume confirms trend strength.'}
                      </div>
                    </div>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    volumeDetails.score > 0 ? 'bg-green-500/10 text-green-400' : volumeDetails.score < 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-text-secondary'
                  }`}>
                    {volumeDetails.signal} {locale === 'ar' ? (volumeDetails.score > 0 ? 'شراء' : volumeDetails.score < 0 ? 'بيع' : 'محايد') : (volumeDetails.score > 0 ? 'Buy' : volumeDetails.score < 0 ? 'Sell' : 'Neutral')} ({volumeDetails.score >= 0 ? '+' : ''}{volumeDetails.score} {locale === 'ar' ? 'نقطة' : 'pts'})
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary/70">{volumeDetails.desc}</p>
                <div className="text-[9px] font-mono text-text-secondary/50 mt-0.5">{volumeDetails.val}</div>
              </div>

              {/* S/R Proximity Scorecard */}
              <div className="flex flex-col gap-1 pb-2.5 border-b border-white/5">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-text-secondary flex items-center gap-1">
                    {locale === 'ar' ? 'الدعم والمقاومة:' : 'S/R Proximity:'}
                    <div className="group relative flex items-center">
                      <Info className="w-3.5 h-3.5 cursor-help" />
                      <div className="hidden group-hover:block absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 p-2.5 bg-surface-dark border border-white/10 rounded-xl shadow-2xl text-[10px] text-text-secondary font-normal whitespace-normal leading-relaxed">
                        {locale === 'ar' ? 'يبين قرب السعر من مستويات الدعم (شراء/ارتداد) أو المقاومة (بيع/تراجع). اقتراب السعر بنسبة <3% يرفع التحذير.' : 'Shows proximity to Support (buy/bounce) or Resistance (sell/drop). Proximity <3% triggers a warning.'}
                      </div>
                    </div>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    srDetails.score > 0 ? 'bg-green-500/10 text-green-400' : srDetails.score < 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-text-secondary'
                  }`}>
                    {srDetails.signal} {locale === 'ar' ? (srDetails.score > 0 ? 'شراء' : srDetails.score < 0 ? 'تحذير' : 'محايد') : (srDetails.score > 0 ? 'Buy' : srDetails.score < 0 ? 'Warning' : 'Neutral')} ({srDetails.score >= 0 ? '+' : ''}{srDetails.score} {locale === 'ar' ? 'نقطة' : 'pts'})
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary/70">{srDetails.desc}</p>
              </div>

              {/* Bollinger Bands Scorecard */}
              <div className="flex flex-col gap-1 pb-2.5 border-b border-white/5">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-text-secondary flex items-center gap-1">
                    {locale === 'ar' ? 'نطاقات البولنجر (Bollinger):' : 'Bollinger Bands:'}
                    <div className="group relative flex items-center">
                      <Info className="w-3.5 h-3.5 cursor-help" />
                      <div className="hidden group-hover:block absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 p-2.5 bg-surface-dark border border-white/10 rounded-xl shadow-2xl text-[10px] text-text-secondary font-normal whitespace-normal leading-relaxed">
                        {locale === 'ar' ? 'نطاقات البولنجر تقيس تذبذب السوق. ملامسة الحد السفلي تعني دخول السعر منطقة تشبع بيعي (إيجابي)، وملامسة الحد العلوي تعني دخول منطقة تشبع شرائي (سلبي).' : 'Bollinger Bands measure market volatility. Touching the lower band indicates oversold, while the upper band indicates overbought.'}
                      </div>
                    </div>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    bbDetails.score > 0 ? 'bg-green-500/10 text-green-400' : bbDetails.score < 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-text-secondary'
                  }`}>
                    {bbDetails.signal} {locale === 'ar' ? (bbDetails.score > 0 ? 'شراء' : bbDetails.score < 0 ? 'بيع' : 'محايد') : (bbDetails.score > 0 ? 'Buy' : bbDetails.score < 0 ? 'Sell' : 'Neutral')} ({bbDetails.score >= 0 ? '+' : ''}{bbDetails.score} {locale === 'ar' ? 'نقطة' : 'pts'})
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary/70">{bbDetails.desc}</p>
                <div className="text-[9px] font-mono text-text-secondary/50 mt-0.5">{bbDetails.val}</div>
              </div>

              {/* Stochastic RSI Scorecard */}
              <div className="flex flex-col gap-1 pb-2.5 border-b border-white/5">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-text-secondary flex items-center gap-1">
                    Stoch RSI:
                    <div className="group relative flex items-center">
                      <Info className="w-3.5 h-3.5 cursor-help" />
                      <div className="hidden group-hover:block absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 p-2.5 bg-surface-dark border border-white/10 rounded-xl shadow-2xl text-[10px] text-text-secondary font-normal whitespace-normal leading-relaxed">
                        {locale === 'ar' ? 'مؤشر ستوكاستيك RSI يقيس الحساسية الزخمة لـ RSI. القيمة تحت 0.2 تشير لتشبع بيعي قوي، وفوق 0.8 تشير لتشبع شرائي قوي.' : 'Stochastic RSI applies Stochastic calculation to RSI values. <0.2 is oversold, >0.8 is overbought.'}
                      </div>
                    </div>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    stochRsiDetails.score > 0 ? 'bg-green-500/10 text-green-400' : stochRsiDetails.score < 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-text-secondary'
                  }`}>
                    {stochRsiDetails.signal} {locale === 'ar' ? (stochRsiDetails.score > 0 ? 'شراء' : stochRsiDetails.score < 0 ? 'بيع' : 'محايد') : (stochRsiDetails.score > 0 ? 'Buy' : stochRsiDetails.score < 0 ? 'Sell' : 'Neutral')} ({stochRsiDetails.score >= 0 ? '+' : ''}{stochRsiDetails.score} {locale === 'ar' ? 'نقطة' : 'pts'})
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary/70">{stochRsiDetails.desc}</p>
                <div className="text-[9px] font-mono text-text-secondary/50 mt-0.5">{stochRsiDetails.val}</div>
              </div>

              {/* ATH Proximity Scorecard */}
              <div className="flex flex-col gap-1 pb-1">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-text-secondary flex items-center gap-1">
                    {locale === 'ar' ? 'القرب من القمة السنوية:' : '52w High Proximity:'}
                    <div className="group relative flex items-center">
                      <Info className="w-3.5 h-3.5 cursor-help" />
                      <div className="hidden group-hover:block absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 p-2.5 bg-surface-dark border border-white/10 rounded-xl shadow-2xl text-[10px] text-text-secondary font-normal whitespace-normal leading-relaxed">
                        {locale === 'ar' ? 'يوضح مدى قرب السعر الحالي من أعلى قمة مسجلة في آخر 52 أسبوعاً. الاقتراب منها يمثل حاجز مقاومة نفسي وفني هام.' : 'Measures how close the current price is to its 52-week High. Reaching it represents a major psychological and technical resistance.'}
                      </div>
                    </div>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    athDetails.score < 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-text-secondary'
                  }`}>
                    {athDetails.signal} {locale === 'ar' ? (athDetails.score < 0 ? 'حذر' : 'محايد') : (athDetails.score < 0 ? 'Caution' : 'Neutral')} ({athDetails.score >= 0 ? '+' : ''}{athDetails.score} {locale === 'ar' ? 'نقطة' : 'pts'})
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary/70">{athDetails.desc}</p>
                <div className="text-[9px] font-mono text-text-secondary/50 mt-0.5">{athDetails.val}</div>
              </div>

              {/* Overall Combined Score & Pointer Bar */}
              <div className="flex flex-col gap-2 pt-2.5 border-t border-white/5">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-text-secondary flex items-center gap-1">
                    {locale === 'ar' ? 'الإجمالي:' : 'Overall Score:'}
                    <div className="group relative flex items-center">
                      <Info className="w-3.5 h-3.5 cursor-help" />
                      <div className="hidden group-hover:block absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 p-2.5 bg-surface-dark border border-white/10 rounded-xl shadow-2xl text-[10px] text-text-secondary font-normal whitespace-normal leading-relaxed">
                        {locale === 'ar' ? 'نتيجة دمج وتحليل جميع المؤشرات السابقة (RSI, MACD, SMA, SR). كلما زادت النقط نحو +7 كانت الإشارة إيجابية قوية.' : 'Combined result of all technical indicators. Higher score towards +7 indicates a stronger positive signal.'}
                      </div>
                    </div>
                  </span>
                  <span className="font-extrabold" style={{ color: signalColor }}>
                    {locale === 'ar' ? 'Score:' : 'Score:'} {overallScore >= 0 ? '+' : ''}{overallScore} {locale === 'ar' ? 'من +7' : 'of +7'}
                  </span>
                </div>
                {/* Horizontal colored segments */}
                <div className="relative h-3 rounded-full overflow-hidden flex">
                  <div className="flex-1 bg-gradient-to-r from-red-600 to-red-500" style={{ opacity: 0.7 }} />
                  <div className="flex-1 bg-gradient-to-r from-orange-500 to-amber-400" style={{ opacity: 0.7 }} />
                  <div className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-300" style={{ opacity: 0.7 }} />
                  <div className="flex-1 bg-gradient-to-r from-lime-400 to-green-400" style={{ opacity: 0.7 }} />
                  <div className="flex-1 bg-gradient-to-r from-green-500 to-green-600" style={{ opacity: 0.7 }} />
                  {/* Indicator Arrow */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-white shadow-lg transition-all duration-300"
                    style={{ left: `${scoreBarPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] text-text-secondary/40 mt-[-2px]">
                  <span>{locale === 'ar' ? 'بيع قوي' : 'Strong Sell'}</span>
                  <span className="font-bold" style={{ color: signalColor }}>
                    ▲ {locale === 'ar' ? `أنت هنا (${scoreBarPct.toFixed(0)}%)` : `you here (${scoreBarPct.toFixed(0)}%)`}
                  </span>
                  <span>{locale === 'ar' ? 'شراء قوي' : 'Strong Buy'}</span>
                </div>
                <div className="text-xs font-bold text-center mt-1 p-1 rounded bg-white/5" style={{ color: signalColor }}>
                  {locale === 'ar' ? 'التوصية:' : 'Recommendation:'} {signalLabel}
                </div>
              </div>
            </div>

            {/* Recommendation Trade Details Panel */}
            <div className="glass-card p-4 rounded-2xl border border-white/5 font-sans flex flex-col gap-4">
              
              <div className="flex flex-col gap-3">
                <h3 className="text-[11px] font-bold text-text-primary flex items-center gap-2 pb-1 border-b border-white/5">
                  <span>📊</span>
                  <span>{locale === 'ar' ? 'التوقع والاحتمالات' : 'Probabilities'}</span>
                </h3>
                
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-bold text-green-400">
                      <span>{locale === 'ar' ? 'احتمال الصعود:' : 'Bullish Prob:'}</span>
                      <span>{probabilities.bullPct}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${probabilities.bullPct}%` }} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-bold text-red-400">
                      <span>{locale === 'ar' ? 'احتمال الهبوط:' : 'Bearish Prob:'}</span>
                      <span>{probabilities.bearPct}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${probabilities.bearPct}%` }} />
                    </div>
                  </div>
                  <p className="text-[8px] text-text-secondary/50 leading-relaxed mt-1 text-center bg-white/5 p-1.5 rounded">
                    ⚠️ {locale === 'ar' ? 'هذه احتمالات إحصائية بناءً على المؤشرات وليست ضمانات. لا يوجد تحليل يضمن 100%.' : 'These are statistical probabilities based on indicators, not guarantees. No analysis guarantees 100%.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <h3 className="text-[11px] font-bold flex items-center gap-2 pb-1 border-b border-white/5"
                  style={{ color: signalColor }}>
                  <span>{dealSetup.action === 'buy' ? '📈' : dealSetup.action === 'sell' ? '📉' : '⚖️'}</span>
                  <span>{locale === 'ar' ? 'الصفقة المقترحة' : 'Suggested Trade Deal'}</span>
                  <span className="ml-auto text-[10px] bg-white/5 px-2 py-0.5 rounded-full">
                    {dealSetup.action === 'buy' ? (locale === 'ar' ? 'شراء' : 'Buy') : dealSetup.action === 'sell' ? (locale === 'ar' ? 'بيع' : 'Sell') : (locale === 'ar' ? 'محايد' : 'Neutral')}
                  </span>
                </h3>

                {/* Advanced Risk Settings Panel */}
                <div className="border border-white/5 bg-white/[0.01] rounded-xl p-2.5 mb-2 font-sans">
                  <button
                    onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                    className="w-full flex items-center justify-between text-[10px] font-bold text-accent-blue hover:text-accent-blue/80 transition-colors cursor-pointer select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>🎛️</span>
                      <span>{locale === 'ar' ? 'فلاتر جودة التوصيات والمخاطر' : 'Risk & Quality Filters'}</span>
                    </span>
                    <span>{showSettingsPanel ? '▲' : '▼'}</span>
                  </button>

                  {showSettingsPanel && (
                    <div className="flex flex-col gap-2.5 mt-2.5 pt-2.5 border-t border-white/5 text-[9px] text-text-secondary">
                      {/* Trailing Stop */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-text-primary">
                            {locale === 'ar' ? 'الوقف للتعادل بعد الهدف الأول' : 'Trailing Stop to Entry after TP1'}
                          </span>
                          <span className="text-[8px] text-text-secondary/60">
                            {locale === 'ar' ? 'نقل الوقف لسعر الدخول بعد ضرب TP1 لتأمين الصفقة.' : 'Move Stop to entry after TP1 hits.'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleUpdateSetting('trailing_stop_to_entry', !settings.trailing_stop_to_entry)}
                          className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${
                            settings.trailing_stop_to_entry ? 'bg-emerald-500 flex justify-end' : 'bg-white/10 flex justify-start'
                          }`}
                        >
                          <span className="w-3 h-3 bg-white rounded-full block shadow" />
                        </button>
                      </div>

                      {/* Risk Reward Filter */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-text-primary">
                            {locale === 'ar' ? 'تصفية العائد/المخاطرة (R:R)' : 'Risk/Reward (R:R) Filter'}
                          </span>
                          <span className="text-[8px] text-text-secondary/60">
                            {locale === 'ar' ? 'استبعاد الصفقات ذات العائد الضعيف مقابل الوقف.' : 'Exclude setups with low risk-reward ratios.'}
                          </span>
                        </div>
                        <select
                          value={settings.min_risk_reward}
                          onChange={(e) => handleUpdateSetting('min_risk_reward', parseFloat(e.target.value))}
                          className="bg-surface-dark border border-white/10 text-text-primary rounded px-1.5 py-0.5 outline-none text-[9px] font-sans"
                        >
                          <option value={0}>{locale === 'ar' ? 'تعطيل' : 'Disabled'}</option>
                          <option value={1.2}>1 : 1.2</option>
                          <option value={1.5}>1 : 1.5</option>
                          <option value={1.8}>1 : 1.8</option>
                          <option value={2.0}>1 : 2.0</option>
                        </select>
                      </div>

                      {/* ML Probability Filter */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-text-primary">
                            {locale === 'ar' ? 'فلتر احتمالية الذكاء الاصطناعي' : 'AI Win Probability Filter'}
                          </span>
                          <span className="text-[8px] text-text-secondary/60">
                            {locale === 'ar' ? 'استبعاد الصفقات ذات احتمالية النجاح المنخفضة بالـ AI.' : 'Exclude setups with low AI success probability.'}
                          </span>
                        </div>
                        <select
                          value={settings.min_ml_probability}
                          onChange={(e) => handleUpdateSetting('min_ml_probability', parseFloat(e.target.value))}
                          className="bg-surface-dark border border-white/10 text-text-primary rounded px-1.5 py-0.5 outline-none text-[9px] font-sans"
                        >
                          <option value={0}>{locale === 'ar' ? 'تعطيل' : 'Disabled'}</option>
                          <option value={0.50}>50%</option>
                          <option value={0.55}>55%</option>
                          <option value={0.58}>58%</option>
                          <option value={0.60}>60%</option>
                          <option value={0.65}>65%</option>
                        </select>
                      </div>

                      {/* Volume Spike Filter */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-text-primary">
                            {locale === 'ar' ? 'اشتراط تأكيد السيولة' : 'Confirm Volume Spike'}
                          </span>
                          <span className="text-[8px] text-text-secondary/60">
                            {locale === 'ar' ? 'حجب الصفقة إذا لم يكن حجم التداول > 1.3x من متوسط 20 يوم.' : 'Require volume > 1.3x of 20-day average.'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleUpdateSetting('require_volume_spike', !settings.require_volume_spike)}
                          className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${
                            settings.require_volume_spike ? 'bg-emerald-500 flex justify-end' : 'bg-white/10 flex justify-start'
                          }`}
                        >
                          <span className="w-3 h-3 bg-white rounded-full block shadow" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {dealSetup.isFiltered ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl bg-amber-500/5 border border-amber-500/10 gap-3 mt-1 font-sans">
                    <span className="text-2xl animate-pulse">🛡️</span>
                    <h4 className="text-xs font-bold text-amber-400">
                      {locale === 'ar' ? 'تم حجب هذه التوصية بواسطة فلاتر الجودة النشطة' : 'Setup Filtered by Active Quality Settings'}
                    </h4>
                    <p className="text-[9px] leading-relaxed text-text-secondary/80 max-w-[220px]">
                      {locale === 'ar' 
                        ? 'توصية الشراء/البيع الحالية لا تستوفي كافة معايير المخاطر والجودة التي قمت بتفعيلها في الإعدادات أعلاه:'
                        : 'The current trade setup does not meet all active risk and quality parameters configured above:'}
                    </p>
                    <div className="flex flex-col gap-1 w-full text-start text-[8px] text-text-secondary/60 bg-black/10 p-2 rounded-lg border border-white/5">
                      {dealSetup.filteredByRR && (
                        <div className="flex justify-between items-center text-red-400 font-medium">
                          <span>• {locale === 'ar' ? 'معدل العائد للمخاطرة ضعيف:' : 'Poor Risk/Reward Ratio:'}</span>
                          <span className="font-mono">1 : {dealSetup.rr} &lt; {settings.min_risk_reward}</span>
                        </div>
                      )}
                      {dealSetup.filteredByML && (
                        <div className="flex justify-between items-center text-red-400 font-medium">
                          <span>• {locale === 'ar' ? 'احتمالية الذكاء الاصطناعي ضعيفة:' : 'Low AI Win Probability:'}</span>
                          <span className="font-mono">{(mlProb !== null ? mlProb * 100 : 0).toFixed(0)}% &lt; {settings.min_ml_probability * 100}%</span>
                        </div>
                      )}
                      {dealSetup.filteredByVolume && (
                        <div className="flex justify-between items-center text-red-400 font-medium">
                          <span>• {locale === 'ar' ? 'حجم تداول ضعيف (سيولة منخفضة):' : 'Low Relative Trading Volume:'}</span>
                          <span className="font-mono">{(analysisData?.volRatio ?? 1.0).toFixed(1)}x &lt; 1.3x</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 text-[10px]">
                    <div className="flex justify-between items-center py-1 border-b border-white/5">
                      <span className="text-text-secondary">{locale === 'ar' ? 'الدخول المقترح:' : 'Suggested Entry:'}</span>
                      <span className="font-mono font-bold text-text-primary">{dealSetup.entry.toFixed(3)} {locale === 'ar' ? 'ج.م' : 'EGP'}</span>
                    </div>
                    
                    <div className="flex flex-col gap-0.5">
                      <div className="flex justify-between items-center">
                        <span className="text-green-400">🎯 {locale === 'ar' ? 'هدف 1:' : 'Target 1:'}</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-green-400">
                            {dealSetup.tp1.toFixed(3)} {locale === 'ar' ? 'ج.م' : 'EGP'}
                            <span className="text-green-400/60 ml-1 text-[9px]">
                              ({dealSetup.isSell ? '-' : '+'}{Math.abs(((dealSetup.tp1 - dealSetup.entry) / dealSetup.entry) * 100).toFixed(1)}%)
                            </span>
                          </span>
                          <div className="text-[9px] text-text-secondary/60 flex justify-end gap-2 mt-0.5">
                            {dealSetup.timeToTP1 && (
                              <span>⏱ {dealSetup.timeToTP1}</span>
                            )}
                            {dealSetup.winRate !== null && (
                              <span className={dealSetup.winRate >= 60
                                ? 'text-green-400 font-bold'
                                : dealSetup.winRate >= 45
                                  ? 'text-yellow-400 font-bold'
                                  : 'text-red-400 font-bold'}>
                                📊 {dealSetup.winRate}% {dealSetup.totalSignals > 0 ? (locale === 'ar' ? `(من ${dealSetup.totalSignals} إشارة)` : `(of ${dealSetup.totalSignals} signals)`) : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {dealSetup.tp1Source && (
                        <p className="text-[9px] text-text-secondary/50 text-end leading-tight">{dealSetup.tp1Source}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <div className="flex justify-between items-center">
                        <span className="text-green-400">🎯 {locale === 'ar' ? 'هدف 2:' : 'Target 2:'}</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-green-400">
                            {dealSetup.tp2.toFixed(3)} {locale === 'ar' ? 'ج.م' : 'EGP'}
                            <span className="text-green-400/60 ml-1 text-[9px]">
                              ({dealSetup.isSell ? '-' : '+'}{Math.abs(((dealSetup.tp2 - dealSetup.entry) / dealSetup.entry) * 100).toFixed(1)}%)
                            </span>
                          </span>
                          <div className="text-[9px] text-text-secondary/60 flex justify-end gap-2 mt-0.5">
                            {dealSetup.timeToTP2 && (
                              <span>⏱ {dealSetup.timeToTP2}</span>
                            )}
                            {dealSetup.winRate2 !== null && (
                              <span className={dealSetup.winRate2 >= 60
                                ? 'text-green-400 font-bold'
                                : dealSetup.winRate2 >= 45
                                  ? 'text-yellow-400 font-bold'
                                  : 'text-red-400 font-bold'}>
                                📊 {dealSetup.winRate2}% {dealSetup.totalSignals > 0 ? (locale === 'ar' ? `(من ${dealSetup.totalSignals} إشارة)` : `(of ${dealSetup.totalSignals} signals)`) : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {dealSetup.tp2Source && (
                        <p className="text-[9px] text-text-secondary/50 text-end leading-tight">{dealSetup.tp2Source}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5 pb-2 border-b border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-red-400">🛑 {locale === 'ar' ? 'وقف الخسارة:' : 'Stop Loss:'}</span>
                        <span className="font-mono font-bold text-red-400">
                          {dealSetup.sl.toFixed(3)} 
                          <span className="text-red-400/60 ml-1 text-[9px]">
                            ({dealSetup.isSell ? '+' : '-'}{Math.abs(((dealSetup.sl - dealSetup.entry) / dealSetup.entry) * 100).toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                      {dealSetup.slSource && (
                        <p className="text-[9px] text-text-secondary/50 text-end leading-tight">{dealSetup.slSource}</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-0.5 border-b border-white/5 pb-2">
                      <span className="text-text-secondary">{locale === 'ar' ? 'نسبة العائد/المخاطرة:' : 'Risk/Reward Ratio:'}</span>
                      <span className="font-mono font-bold text-text-primary">1 : {dealSetup.rr}</span>
                    </div>

                    <div className="flex justify-between items-center pt-0.5 border-b border-white/5 pb-2">
                      <span className="text-text-secondary">{locale === 'ar' ? 'المدى المتوقع للصفقة:' : 'Expected Duration:'}</span>
                      <span className="font-bold text-text-primary">{dealSetup.tradeDuration}</span>
                    </div>

                    <div className="flex justify-between items-center pt-0.5 border-b border-white/5 pb-2">
                      <span className="text-text-secondary">
                        {locale === 'ar' ? 'تذبذب الشمعة (ATR):' : 'Candle Volatility (ATR):'}
                      </span>
                      <span className="font-mono text-text-primary">
                        {dealSetup.atr.toFixed(3)} {locale === 'ar' ? 'ج.م' : 'EGP'}
                      </span>
                    </div>

                    {dealSetup && (
                      <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                        {/* Capital Input */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] text-slate-400">
                            💰 {locale === 'ar' ? 'رأس المال المتاح:' : 'Available Capital:'}
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={userCapital}
                              onChange={e => setUserCapital(Number(e.target.value))}
                              className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs text-right outline-none focus:border-purple-500"
                            />
                            <span className="text-[10px] text-slate-500">
                              EGP
                            </span>
                          </div>
                        </div>

                        {/* Position Size Calculation */}
                        {(() => {
                          const pos = calcPositionSize(
                            userCapital,
                            currentPrice,
                            dealSetup.sl,
                            userRiskPercent
                          );
                          const totalInvest = pos.shares * currentPrice;
                          const potentialTP1 = pos.shares * (dealSetup.tp1 - currentPrice);
                          const potentialTP2 = pos.shares * (dealSetup.tp2 - currentPrice);

                          return (
                            <div className="space-y-1.5 text-[11px] font-sans">
                              <div className="flex justify-between">
                                <span className="text-slate-400">
                                  📊 {locale === 'ar' ? 'عدد الأسهم المقترح:' : 'Suggested Shares:'}
                                </span>
                                <span className="text-purple-300 font-bold">
                                  {pos.shares.toLocaleString()} {locale === 'ar' ? 'سهم' : 'Shares'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">
                                  💵 {locale === 'ar' ? 'إجمالي الاستثمار:' : 'Total Investment:'}
                                </span>
                                <span className="text-white font-mono">
                                  {totalInvest.toLocaleString(undefined, { maximumFractionDigits: 0 })} EGP
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">
                                  🛑 {locale === 'ar' ? `أقصى خسارة (${userRiskPercent}%):` : `Max Loss (${userRiskPercent}%):`}
                                </span>
                                <span className="text-red-400 font-bold font-mono">
                                  -{pos.maxLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })} EGP
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">
                                  🎯 {locale === 'ar' ? 'ربح متوقع TP1:' : 'Expected TP1 Profit:'}
                                </span>
                                <span className="text-green-400 font-bold font-mono">
                                  +{potentialTP1.toLocaleString(undefined, { maximumFractionDigits: 0 })} EGP
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">
                                  🎯🎯 {locale === 'ar' ? 'ربح متوقع TP2:' : 'Expected TP2 Profit:'}
                                </span>
                                <span className="text-emerald-400 font-bold font-mono">
                                  +{potentialTP2.toLocaleString(undefined, { maximumFractionDigits: 0 })} EGP
                                </span>
                              </div>
                              <div className="flex justify-between pt-1.5 border-t border-white/10">
                                <span className="text-slate-400">
                                  ⚖️ {locale === 'ar' ? 'نسبة ربح/خسارة:' : 'Reward/Risk:'}
                                </span>
                                <span className={`font-bold ${
                                  potentialTP1 / (pos.maxLoss || 1) >= 2
                                    ? 'text-green-400'
                                    : potentialTP1 / (pos.maxLoss || 1) >= 1.5
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                                }`}>
                                  {pos.maxLoss > 0
                                    ? (potentialTP1 / pos.maxLoss).toFixed(2)
                                    : '∞'}:1
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {mlProb !== null && (
                      <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/10 mt-1">
                        <span className="text-[11px] text-text-secondary flex items-center gap-1.5">
                          <span>🤖</span>
                          <span>{locale === 'ar' ? 'احتمال النجاح (AI):' : 'AI Success Probability:'}</span>
                        </span>
                        <span className={`font-bold text-sm ${
                          mlProb >= 0.65 ? 'text-green-400'
                          : mlProb >= 0.50 ? 'text-yellow-400'
                          : 'text-red-400'
                        }`}>
                          {(mlProb * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}

                    {dealSetup.indicatorRecs && (
                      <div className="mt-3 border-t border-white/5 pt-3">
                        <span className="text-[11px] font-bold text-text-primary block mb-2 flex items-center gap-1.5">
                          <span>📊</span>
                          <span>{locale === 'ar' ? 'توصيات المؤشرات الفردية:' : 'Individual Indicator Recommendations:'}</span>
                        </span>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[10px] text-text-secondary">
                            <thead>
                              <tr className="border-b border-white/5 text-text-secondary/70">
                                <th className="pb-1 font-semibold">{locale === 'ar' ? 'المؤشر' : 'Indicator'}</th>
                                <th className="pb-1 text-center font-semibold">{locale === 'ar' ? 'الإشارة' : 'Signal'}</th>
                                <th className="pb-1 text-right font-semibold">{locale === 'ar' ? 'الوقف' : 'Stop'}</th>
                                <th className="pb-1 text-right font-semibold">{locale === 'ar' ? 'هدف 1' : 'TP1'}</th>
                                <th className="pb-1 text-right font-semibold">{locale === 'ar' ? 'هدف 2' : 'TP2'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {dealSetup.indicatorRecs.map((rec, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                  <td className="py-1.5 font-medium max-w-[95px] truncate text-text-primary">{rec.name}</td>
                                  <td className="py-1.5 text-center">{rec.signal}</td>
                                  <td className="py-1.5 text-right font-mono text-red-400">{rec.sl.toFixed(2)}</td>
                                  <td className="py-1.5 text-right font-mono text-green-400">{rec.tp1.toFixed(2)}</td>
                                  <td className="py-1.5 text-right font-mono text-green-400">{rec.tp2.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-[9px] text-text-secondary/50 mt-1.5 leading-relaxed bg-white/5 p-1.5 rounded border border-white/5">
                          💡 {locale === 'ar'
                            ? 'يتم احتساب الأهداف النهائية للمجموعة عن طريق وسيط (Median) توصيات المؤشرات الـ ٥ أعلاه لاستبعاد القيم الشاذة وضمان أقصى دقة.'
                            : 'Final consensus targets are calculated using the median of the 5 indicators above to eliminate outliers and maximize accuracy.'}
                        </p>
                        <p className="text-[9px] text-text-secondary/50 mt-1 leading-relaxed bg-white/5 p-1.5 rounded border border-white/5">
                          ⏱️ {locale === 'ar'
                            ? 'تتم تصفية وإغلاق التوصية تلقائياً عند سعر الإغلاق إذا استمرت لأكثر من ٢٠ يوم تداول دون تحقيق الأهداف أو ضرب الوقف كحد أقصى لإدارة رأس المال وتفادي تجميد السيولة.'
                            : 'The trade setup is automatically closed at the close price if it remains active for more than 20 trading days without reaching targets or stop loss, to prevent capital lock-up.'}
                        </p>
                      </div>
                    )}

                    <div className="bg-accent-blue/10 border border-accent-blue/20 rounded-lg p-2.5 mt-1 flex flex-col gap-1">
                      <div className="font-bold text-accent-blue flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {locale === 'ar' ? 'ملاحظة:' : 'Note:'}
                      </div>
                      <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                        {locale === 'ar' ? dealSetup.noteAR : dealSetup.noteEN}
                      </p>
                    </div>

                    {/* Volume Score */}
                    {volumeScore && (
                      <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                        <span className="text-[11px] text-text-secondary flex items-center gap-1.5">
                          📊 {locale==='ar' ? 'قوة حجم التداول:' : 'Volume Strength:'}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          volumeScore === 'strong'
                            ? 'bg-green-400/15 text-green-400'
                            : volumeScore === 'normal'
                              ? 'bg-yellow-400/15 text-yellow-400'
                              : 'bg-red-400/15 text-red-400'
                        }`}>
                          {volumeScore === 'strong'
                            ? (locale==='ar' ? `🔥 قوي (${volumeRatio.toFixed(1)}×)` : `🔥 Strong (${volumeRatio.toFixed(1)}×)`)
                            : volumeScore === 'normal'
                              ? (locale==='ar' ? `✅ عادي (${volumeRatio.toFixed(1)}×)` : `✅ Normal (${volumeRatio.toFixed(1)}×)`)
                              : (locale==='ar' ? `⚠️ ضعيف (${volumeRatio.toFixed(1)}×)` : `⚠️ Weak (${volumeRatio.toFixed(1)}×)`)}
                        </span>
                      </div>
                    )}

                    {/* Candle Pattern */}
                    {candlePattern.pattern && (
                      <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                        <span className="text-[11px] text-text-secondary flex items-center gap-1.5">
                          🕯️ {locale==='ar' ? 'نمط الشمعة:' : 'Candle Pattern:'}
                        </span>
                        <span className={`text-xs font-bold ${
                          candlePattern.bullish === true
                            ? 'text-green-400'
                            : candlePattern.bullish === false
                              ? 'text-red-400'
                              : 'text-yellow-400'
                        }`}>
                          {(() => {
                            const patterns: Record<string, {ar:string; en:string}> = {
                              hammer:            {ar:'🔨 Hammer ↑',      en:'🔨 Hammer ↑'},
                              shooting_star:     {ar:'⭐ Shooting Star ↓',en:'⭐ Shooting Star ↓'},
                              bullish_engulfing: {ar:'📈 ابتلاع صاعد ↑',  en:'📈 Bull Engulf ↑'},
                              bearish_engulfing: {ar:'📉 ابتلاع هابط ↓',  en:'📉 Bear Engulf ↓'},
                              doji:              {ar:'🔁 Doji',           en:'🔁 Doji'},
                              morning_star:      {ar:'🌅 نجمة صباح ↑',   en:'🌅 Morning Star ↑'},
                              evening_star:      {ar:'🌆 نجمة مساء ↓',   en:'🌆 Evening Star ↓'},
                            };
                            const p = patterns[candlePattern.pattern!];
                            return locale==='ar' ? p?.ar : p?.en;
                          })()}
                        </span>
                      </div>
                    )}

                    {/* RSI Divergence */}
                    {rsiDivergence && (
                      <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                        <span className="text-[11px] text-text-secondary flex items-center gap-1.5">
                          📐 {locale==='ar' ? 'تباين RSI:' : 'RSI Divergence:'}
                        </span>
                        <span className={`text-xs font-bold ${
                          rsiDivergence === 'bullish' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {rsiDivergence === 'bullish'
                            ? (locale==='ar' ? '🟢 صاعد (انعكاس محتمل ↑)' : '🟢 Bullish Div ↑')
                            : (locale==='ar' ? '🔴 هابط (انعكاس محتمل ↓)' : '🔴 Bearish Div ↓')}
                        </span>
                      </div>
                    )}

                    {/* Multi-Timeframe */}
                    <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                      <span className="text-[11px] text-text-secondary flex items-center gap-1.5">
                        🕐 {locale==='ar' ? 'تأكيد الفريمات:' : 'TF Confirmation:'}
                      </span>
                      <span className={`text-xs font-bold ${
                        mtfScore === 'strong_bull' ? 'text-green-400'
                        : mtfScore === 'strong_bear' ? 'text-red-400'
                        : mtfScore === 'mild_bull'  ? 'text-emerald-400'
                        : mtfScore === 'mild_bear'  ? 'text-orange-400'
                        : 'text-slate-400'
                      }`}>
                        {(() => {
                          const labels: Record<string, {ar:string;en:string}> = {
                            strong_bull: {ar:'🟢🟢 قوي جداً ↑',  en:'🟢🟢 Strong Bull'},
                            mild_bull:   {ar:'🟢🟡 صاعد',         en:'🟢🟡 Mild Bull'},
                            neutral:     {ar:'🟡🟡 محايد',         en:'🟡🟡 Neutral'},
                            mild_bear:   {ar:'🔴🟡 هابط',          en:'🔴🟡 Mild Bear'},
                            strong_bear: {ar:'🔴🔴 هابط قوي ↓',   en:'🔴🔴 Strong Bear'},
                          };
                          return locale==='ar' ? labels[mtfScore]?.ar : labels[mtfScore]?.en;
                        })()}
                      </span>
                    </div>

                    {/* Signal Strength Summary */}
                    {(() => {
                      let score = 0;
                      if (volumeScore === 'strong') score += 2;
                      if (volumeScore === 'normal') score += 1;
                      if (candlePattern.pattern &&
                          candlePattern.bullish === (dealSetup?.action === 'buy')) score += 2;
                      if (rsiDivergence === 'bullish' && dealSetup?.action === 'buy') score += 2;
                      if (rsiDivergence === 'bearish' && dealSetup?.action === 'sell') score += 2;
                      if (mtfScore === 'strong_bull' && dealSetup?.action === 'buy') score += 2;
                      if (mtfScore === 'mild_bull' && dealSetup?.action === 'buy') score += 1;

                      const label =
                        score >= 6 ? {
                          text: locale==='ar' ? '🔥 إشارة قوية جداً' : '🔥 Very Strong Signal',
                          color: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400'
                        } : score >= 4 ? {
                          text: locale==='ar' ? '✅ إشارة جيدة' : '✅ Good Signal',
                          color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400'
                        } : score >= 2 ? {
                          text: locale==='ar' ? '⚠️ إشارة متوسطة' : '⚠️ Moderate Signal',
                          color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400'
                        } : {
                          text: locale==='ar' ? '🔴 إشارة ضعيفة — تجنبها' : '🔴 Weak Signal — Avoid',
                          color: 'from-red-500/20 to-rose-500/20 border-red-500/30 text-red-400'
                        };

                      return (
                        <div className={`mt-2 p-3 rounded-xl bg-gradient-to-r border text-center font-bold text-xs ${label.color}`}>
                          {label.text}
                          <span className="text-[10px] opacity-70 block mt-0.5">
                            {locale==='ar' ? `قوة الإشارة: ${score}/8` : `Signal Score: ${score}/8`}
                          </span>
                        </div>
                      );
                    })()}

                    {/* S/R Levels */}
                    {srLevels.length > 0 && (
                      <div className="mt-3 space-y-1.5 pt-2.5 border-t border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                          {locale === 'ar' ? '📊 مستويات الدعم والمقاومة اللحظية:' : 'Support & Resistance:'}
                        </p>
                        <div className="space-y-1 font-mono">
                          {srLevels.slice(0, 3).map((l, i) => (
                            <div key={i} className="flex justify-between items-center text-[10px]">
                              <span className={l.type === 'support' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                {l.type === 'support'
                                  ? (locale === 'ar' ? '🟢 دعم' : '🟢 Support')
                                  : (locale === 'ar' ? '🔴 مقاومة' : '🔴 Resistance')}
                                {' '}{'★'.repeat(Math.min(l.strength, 3))}
                              </span>
                              <span className="text-white font-semibold">
                                {l.price.toFixed(2)} EGP
                                <span className={`mr-1 text-[9px] ${l.distance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                  ({l.distance > 0 ? '+' : ''}{l.distance.toFixed(1)}%)
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* تحذير لو TP1 قريب من مقاومة */}
                        {tp1NearResistance && (
                          <div className="mt-2.5 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-400 leading-normal">
                            ⚠️ {locale === 'ar'
                              ? 'الهدف الأول (TP1) قريب جداً من مستوى مقاومة قوية! فكّر في جني الأرباح مبكراً.'
                              : 'TP1 is near strong resistance! Consider early profit-taking.'}
                          </div>
                        )}
                      </div>
                    )}

                    {(dealSetup.action === 'buy' || dealSetup.action === 'sell') && (
                      <button
                        onClick={() => {
                          const pos = calcPositionSize(userCapital, currentPrice, dealSetup.sl, userRiskPercent);
                          setTradeEntry(currentPrice || 0);
                          setTradeShares(pos.shares > 0 ? pos.shares : 100);
                          setShowTradeModal(true);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/15 border border-transparent"
                      >
                        <span>🟢</span>
                        <span>{locale === 'ar' ? 'تفعيل الصفقة في محفظتي' : 'Activate Trade in My Portfolio'}</span>
                      </button>
                    )}

                    {showTradeModal && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm">
                        <div className="bg-[#1E293B] rounded-2xl p-6 border border-white/10 w-80 shadow-2xl font-sans relative">
                          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <span>🟢</span>
                            <span>{locale === 'ar' ? 'تفعيل صفقة جديدة' : 'Activate New Trade'}</span>
                          </h3>

                          <div className="space-y-3.5">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">
                                {locale === 'ar' ? 'سعر الدخول الفعلي (EGP)' : 'Actual Entry Price (EGP)'}
                              </label>
                              <input
                                type="number"
                                step="any"
                                value={tradeEntry}
                                onChange={e => setTradeEntry(Number(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-accent-blue outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">
                                {locale === 'ar' ? 'عدد الأسهم' : 'Number of Shares'}
                              </label>
                              <input
                                type="number"
                                value={tradeShares}
                                onChange={e => setTradeShares(Number(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-accent-blue outline-none"
                              />
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-[10px] space-y-1.5">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Target 1 (TP1)</span>
                                <span className="text-green-400 font-mono font-semibold">
                                  {dealSetup?.tp1?.toFixed(3)} EGP
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Target 2 (TP2)</span>
                                <span className="text-green-400 font-mono font-semibold">
                                  {dealSetup?.tp2?.toFixed(3)} EGP
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Stop Loss (SL)</span>
                                <span className="text-red-400 font-mono font-semibold">
                                  {dealSetup?.sl?.toFixed(3)} EGP
                                </span>
                              </div>
                              <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1.5">
                                <span className="text-slate-400">
                                  {locale === 'ar' ? 'إجمالي الاستثمار:' : 'Total Investment:'}
                                </span>
                                <span className="text-white font-mono font-bold">
                                  {(tradeEntry * tradeShares).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => setShowTradeModal(false)}
                                className="flex-1 py-2 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10 cursor-pointer"
                              >
                                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                              </button>
                              <button
                                onClick={async () => {
                                  const { data: { user } } = await supabase.auth.getUser();
                                  if (!user) {
                                    alert(locale === 'ar' ? '⚠️ يجب تسجيل الدخول أولاً' : '⚠️ You must sign in first');
                                    return;
                                  }
                                  const { error } = await supabase.from('user_trades').insert([{
                                    user_id:        user.id,
                                    company_id:     companyId,
                                    symbol:         symbol,
                                    direction:      dealSetup.action,
                                    entry_price:    tradeEntry,
                                    shares_count:   tradeShares,
                                    tp1:            dealSetup.tp1,
                                    tp2:            dealSetup.tp2,
                                    sl:             dealSetup.sl,
                                    timeframe:      interval,
                                    ml_probability: mlProb,
                                  }]);
                                  if (error) {
                                    alert(locale === 'ar' ? `❌ فشل تفعيل الصفقة: ${error.message}` : `❌ Failed to activate trade: ${error.message}`);
                                  } else {
                                    setShowTradeModal(false);
                                    alert(locale === 'ar' ? '✅ تم تفعيل الصفقة بنجاح في محفظتك!' : '✅ Trade successfully activated in your portfolio!');
                                  }
                                }}
                                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer"
                              >
                                {locale === 'ar' ? 'تأكيد التفعيل' : 'Confirm'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-[9px] text-text-secondary/40 leading-relaxed border-t border-white/5 pt-2">
                ⚠️ {locale === 'ar'
                  ? 'البيانات والأهداف لغرض التحليل والمعلومات فقط وليست توصية استثمارية مباشرة.'
                  : 'Data and targets are for analysis purposes only and do not constitute direct investment advice.'}
              </p>
            </div>

          </div>
        </div>
      ) : (
        <div className="w-full h-80 flex flex-col items-center justify-center text-text-secondary border border-dashed border-white/5 rounded-xl">
          <span className="text-2xl mb-2">📊</span>
          <span className="text-sm font-semibold">{tGlobal('stockDetail.noDataAvailable')}</span>
        </div>
      )}
    </div>
  );
}
