'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { 
  createChart, 
  ColorType, 
  LineStyle, 
  CrosshairMode, 
  IPriceLine,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  Time
} from 'lightweight-charts';

export interface SRLevel {
  price: number;
  strength: number;
  isResistance: boolean;
}

// Imperative handle so PriceChart can toggle individual S/R lines
export interface CandlestickChartHandle {
  toggleSRLine: (price: number, isResistance: boolean, isATH?: boolean, isProjected?: boolean) => boolean;
  clearSRLines: () => void;
}

interface CandlestickChartProps {
  data: {
    time: string | number; // YYYY-MM-DD string or Unix timestamp number
    price_date: string;
    open_price: number | null;
    high_price: number | null;
    low_price: number | null;
    close_price: number;
    volume: number | null;
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
    bbUpper: number | null;
    bbMiddle: number | null;
    bbLower: number | null;
  }[];
  showSMA: boolean;
  showBB: boolean;
  showVol: boolean;
  interval: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';
  srLevels?: { price: number; type: 'support' | 'resistance'; strength: number; distance: number; isStrong?: boolean; isWeekly?: boolean }[];
  onCrosshairMove?: (time: string | null, data?: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }) => void;
}

const CandlestickChartInner = (
  { data, showSMA, showBB, showVol, interval, srLevels, onCrosshairMove }: CandlestickChartProps,
  ref: React.Ref<CandlestickChartHandle>
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const priceLineRefs = useRef<Map<number, IPriceLine>>(new Map());
  const hasFittedRef = useRef(false);

  useEffect(() => {
    hasFittedRef.current = false;
  }, [interval]);

  // Expose imperative S/R line controls using unique keys
  useImperativeHandle(ref, () => ({
    toggleSRLine: (price: number, isResistance: boolean, isATH = false, isProjected = false): boolean => {
      if (!candlestickSeriesRef.current) return false;
      const key = Math.round(price * 10000);
      const existing = priceLineRefs.current.get(key);
      
      if (existing) {
        candlestickSeriesRef.current.removePriceLine(existing);
        priceLineRefs.current.delete(key);
        return false; // hidden
      } else {
        // Color and style based on type
        let color = isResistance ? '#EF4444' : '#10B981';
        let lineWidth: 1 | 2 | 3 | 4 = 1;
        let lineStyle = LineStyle.Dashed;
        const safeP = Number(price ?? 0);
        let title = safeP.toFixed(3);

        if (isATH) {
          color = '#F59E0B';   // Gold/Amber
          lineWidth = 2;
          lineStyle = LineStyle.Solid;
          title = `🏆 ${safeP.toFixed(3)}`;
        } else if (isProjected) {
          color = '#3B82F6';   // Blue
          lineWidth = 1;
          lineStyle = LineStyle.Dashed;
          title = `🎯 ${safeP.toFixed(3)}`;
        }

        const line = candlestickSeriesRef.current.createPriceLine({
          price,
          color,
          lineWidth,
          lineStyle,
          axisLabelVisible: true,
          title,
        });
        if (line) {
          priceLineRefs.current.set(key, line);
        }
        return true; // visible
      }
    },
    clearSRLines: () => {
      if (!candlestickSeriesRef.current) return;
      priceLineRefs.current.forEach((line) => {
        candlestickSeriesRef.current?.removePriceLine(line);
      });
      priceLineRefs.current.clear();
    }
  }));

  // 1. Create Chart Instance (only on interval change or mount)
  useEffect(() => {
    if (!containerRef.current) return;

    const isIntraday = interval === '1m' || interval === '5m' || interval === '15m' || interval === '30m' || interval === '1h' || interval === '4h';

    // Create Chart
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 380,
      layout: {
        background: { type: ColorType.Solid, color: '#0B0F19' },
        textColor: '#9CA3AF',
        fontSize: 10,
        fontFamily: 'sans-serif',
        attributionLogo: false,
      },
      watermark: {
        visible:  true,
        fontSize: 18,
        horzAlign: 'center',
        vertAlign: 'center',
        color: 'rgba(201, 168, 76, 0.08)',
        text: 'TRADEORA',
        fontFamily: 'Georgia, serif',
        fontStyle: 'bold',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(255,255,255,0.25)',
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: '#1F2937',
        },
        horzLine: {
          color: 'rgba(255,255,255,0.25)',
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: '#1F2937',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.05)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.05)',
        timeVisible: isIntraday,
        secondsVisible: false,
        barSpacing: 8,
        minBarSpacing: 1.5,
      },
    } as any);

    chartRef.current = chart;

    // 1. Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: true,
      wickVisible: true,
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });
    candlestickSeriesRef.current = candleSeries;

    // Crosshair subscription
    chart.subscribeCrosshairMove((param) => {
      if (!onCrosshairMove) return;
      if (!param.time) { onCrosshairMove(null); return; }

      let dateStr: string | null = null;
      if (typeof param.time === 'string') {
        dateStr = param.time;
      } else if (typeof param.time === 'number') {
        const date = new Date(param.time * 1000);
        const cairoFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Africa/Cairo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const parts = cairoFormatter.formatToParts(date);
        const partMap: Record<string, string> = {};
        parts.forEach(pt => partMap[pt.type] = pt.value);
        dateStr = `${partMap.year}-${partMap.month}-${partMap.day} ${partMap.hour}:${partMap.minute}`;
      } else if (typeof param.time === 'object') {
        const t = param.time as any;
        dateStr = `${t.year}-${String(t.month).padStart(2,'0')}-${String(t.day).padStart(2,'0')}`;
      }

      if (dateStr && candleSeries) {
        const barData = param.seriesData.get(candleSeries) as any;
        if (barData) {
          onCrosshairMove(dateStr, {
            open: barData.open,
            high: barData.high,
            low: barData.low,
            close: barData.close,
            volume: 0,
          });
          return;
        }
      }
      onCrosshairMove(dateStr);
    });

    // Hide attribution
    const style = document.createElement('style');
    style.textContent = `
      .tv-lightweight-charts a[href*="tradingview"] {
        display: none !important;
        opacity: 0 !important;
      }
    `;
    containerRef.current.appendChild(style);

    // Watermark overlay
    const logoOverlay = document.createElement('div');
    logoOverlay.style.cssText = `
      position: absolute;
      top: 12px;
      left: 12px;
      opacity: 0.35;
      pointer-events: none;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    const logoImg = document.createElement('img');
    logoImg.src = '/logo.png';
    logoImg.style.cssText = `
      height: 28px;
      width: auto;
      object-fit: contain;
      filter: brightness(0.9);
    `;
    logoOverlay.appendChild(logoImg);
    containerRef.current.style.position = 'relative';
    containerRef.current.appendChild(logoOverlay);

    return () => {
      priceLineRefs.current.forEach((line) => {
        candlestickSeriesRef.current?.removePriceLine(line);
      });
      priceLineRefs.current.clear();
      style.remove();
      logoOverlay.remove();
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
    };
  }, [interval, onCrosshairMove]);

  // 2. Update Chart Series Data in-place (preserves scroll position and price lines)
  const indicatorSeriesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || data.length === 0) return;

    const isIntraday = interval === '1m' || interval === '5m' || interval === '15m' || interval === '30m' || interval === '1h' || interval === '4h';
    const isValidNum = (v: any): v is number => typeof v === 'number' && !isNaN(v) && isFinite(v);
    const getClose = (d: any) => d.close_price ?? d.close;
    const getOpen  = (d: any) => d.open_price  ?? d.open  ?? getClose(d);
    const getHigh  = (d: any) => d.high_price  ?? d.high  ?? getClose(d);
    const getLow   = (d: any) => d.low_price   ?? d.low   ?? getClose(d);

    const normalizeTime = (timeVal: any, isIntraday: boolean): Time | null => {
      if (timeVal === undefined || timeVal === null) return null;
      try {
        if (typeof timeVal === 'number') {
          if (isNaN(timeVal) || !isFinite(timeVal)) return null;
          const sec = timeVal > 1e11 ? Math.floor(timeVal / 1000) : timeVal;
          if (isIntraday) return sec as Time;
          const d = new Date(sec * 1000);
          if (isNaN(d.getTime())) return null;
          return d.toISOString().split('T')[0] as Time;
        }
        if (typeof timeVal === 'string') {
          if (!timeVal || timeVal.trim() === '') return null;
          if (!isIntraday) {
            return timeVal.split('T')[0] as Time;
          }
          const parsed = new Date(timeVal).getTime();
          if (isNaN(parsed)) return null;
          return Math.floor(parsed / 1000) as Time;
        }
      } catch {
        return null;
      }
      return null;
    };

    const sanitizeSeriesData = <T extends { time: any }>(items: T[]): T[] => {
      if (!items || items.length === 0) return [];
      const map = new Map<string | number, T>();
      for (const item of items) {
        if (!item || item.time === undefined || item.time === null) continue;
        const normTime = normalizeTime(item.time, isIntraday);
        if (!normTime) continue;
        map.set(normTime as any, { ...item, time: normTime });
      }
      const sorted = Array.from(map.values()).sort((a, b) => {
        const tA = typeof a.time === 'number' ? a.time : new Date(a.time as any).getTime();
        const tB = typeof b.time === 'number' ? b.time : new Date(b.time as any).getTime();
        const valA = isNaN(tA) ? 0 : tA;
        const valB = isNaN(tB) ? 0 : tB;
        return valA - valB;
      });

      const finalClean: T[] = [];
      let prevKey: string | number | null = null;
      for (const it of sorted) {
        if (it.time !== prevKey) {
          finalClean.push(it);
          prevKey = it.time;
        }
      }
      return finalClean;
    };

    // Update Candles
    const candleData = sanitizeSeriesData(
      data
        .filter((d) => d && d.time !== undefined && d.time !== null && isValidNum(getClose(d)))
        .map((d) => ({
          time: d.time as Time,
          open: isValidNum(getOpen(d)) ? getOpen(d) : getClose(d),
          high: isValidNum(getHigh(d)) ? getHigh(d) : getClose(d),
          low: isValidNum(getLow(d)) ? getLow(d) : getClose(d),
          close: getClose(d),
        }))
    );
    candlestickSeriesRef.current.setData(candleData);

    // Clean previous indicators
    indicatorSeriesRef.current.forEach((s) => {
      try { chartRef.current?.removeSeries(s); } catch {}
    });
    indicatorSeriesRef.current = [];

    // Volume Histogram
    if (showVol) {
      const volumeSeries = chartRef.current.addSeries(HistogramSeries, {
        color: '#10B981',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chartRef.current.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
      const volData = sanitizeSeriesData(
        data
          .filter((d) => d && d.time !== undefined && d.time !== null && isValidNum(getClose(d)))
          .map((d) => ({
            time: d.time as Time,
            value: isValidNum(d.volume) ? d.volume : 0,
            color: getClose(d) >= (isValidNum(getOpen(d)) ? getOpen(d) : getClose(d))
              ? 'rgba(16, 185, 129, 0.35)'
              : 'rgba(239, 68, 68, 0.35)',
          }))
      );
      volumeSeries.setData(volData);
      indicatorSeriesRef.current.push(volumeSeries);
    }

    // SMA Lines
    if (showSMA) {
      if (!showBB) {
        const s20 = chartRef.current.addSeries(LineSeries, { color: 'rgba(16,185,129,0.8)', lineWidth: 1, lastValueVisible: false, priceLineVisible: false });
        s20.setData(sanitizeSeriesData(data.filter(d => isValidNum(d.sma20)).map(d => ({ time: d.time as Time, value: d.sma20 as number }))));
        indicatorSeriesRef.current.push(s20);
      }
      const s50 = chartRef.current.addSeries(LineSeries, { color: 'rgba(59,130,246,0.8)', lineWidth: 1, lastValueVisible: false, priceLineVisible: false });
      s50.setData(sanitizeSeriesData(data.filter(d => isValidNum(d.sma50)).map(d => ({ time: d.time as Time, value: d.sma50 as number }))));
      indicatorSeriesRef.current.push(s50);

      const s200 = chartRef.current.addSeries(LineSeries, { color: 'rgba(245,158,11,0.8)', lineWidth: 1, lastValueVisible: false, priceLineVisible: false });
      s200.setData(sanitizeSeriesData(data.filter(d => isValidNum(d.sma200)).map(d => ({ time: d.time as Time, value: d.sma200 as number }))));
      indicatorSeriesRef.current.push(s200);
    }

    // Bollinger Bands
    if (showBB) {
      const bbColor = 'rgba(99,102,241,0.5)';
      const bbUp = chartRef.current.addSeries(LineSeries, { color: bbColor, lineWidth: 1, lineStyle: LineStyle.Dashed, lastValueVisible: false, priceLineVisible: false });
      bbUp.setData(sanitizeSeriesData(data.filter(d => isValidNum(d.bbUpper)).map(d => ({ time: d.time as Time, value: d.bbUpper as number }))));
      const bbMid = chartRef.current.addSeries(LineSeries, { color: bbColor, lineWidth: 1, lastValueVisible: false, priceLineVisible: false });
      bbMid.setData(sanitizeSeriesData(data.filter(d => isValidNum(d.bbMiddle)).map(d => ({ time: d.time as Time, value: d.bbMiddle as number }))));
      const bbLow = chartRef.current.addSeries(LineSeries, { color: bbColor, lineWidth: 1, lineStyle: LineStyle.Dashed, lastValueVisible: false, priceLineVisible: false });
      bbLow.setData(sanitizeSeriesData(data.filter(d => isValidNum(d.bbLower)).map(d => ({ time: d.time as Time, value: d.bbLower as number }))));
      indicatorSeriesRef.current.push(bbUp, bbMid, bbLow);
    }

    // Scroll and fit chart ONLY ON INITIAL MOUNT / INTERVAL CHANGE
    if (!hasFittedRef.current) {
      chartRef.current.timeScale().fitContent();
      hasFittedRef.current = true;
    }
  }, [data, showSMA, showBB, showVol, interval]);


  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);




  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-white/5 bg-[#0B0F19]">
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: 380 }}
      />
      {/* TRADEORA Watermark Logo */}
      <div className="absolute bottom-8 left-3 flex items-center gap-1 opacity-20 pointer-events-none select-none">
        <span className="text-[#0EA5E9] font-bold text-[10px] tracking-wider font-sans">
          TRADEORA
        </span>
      </div>
    </div>
  );
};

export const CandlestickChart = forwardRef(CandlestickChartInner);
