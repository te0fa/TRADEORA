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
  interval: '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1m';
  srLevels?: { price: number; type: 'support' | 'resistance'; strength: number; distance: number }[];
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
        let title = price.toFixed(3);

        if (isATH) {
          color = '#F59E0B';   // Gold/Amber
          lineWidth = 2;
          lineStyle = LineStyle.Solid;
          title = `🏆 ${price.toFixed(3)}`;
        } else if (isProjected) {
          color = '#3B82F6';   // Blue
          lineWidth = 1;
          lineStyle = LineStyle.Dashed;
          title = `🎯 ${price.toFixed(3)}`;
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

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const isIntraday = interval === '15m' || interval === '30m' || interval === '1h' || interval === '4h';

    // Create Chart
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 380,
      layout: {
        background: { type: ColorType.Solid, color: '#0A0F1E' },
        textColor: '#9CA3AF',
        fontSize: 10,
        fontFamily: 'sans-serif',
        attributionLogo: false,
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
        timeVisible: isIntraday, // Show hours/minutes only for intraday intervals
        secondsVisible: false,
      },
    });

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

    candleSeries.setData(
      data.map((d) => ({
        time: d.time as Time,
        open: d.open_price ?? d.close_price,
        high: d.high_price ?? d.close_price,
        low: d.low_price ?? d.close_price,
        close: d.close_price,
      }))
    );

    // 2. Volume Histogram
    let volumeSeries: any = null;
    if (showVol) {
      volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#10B981',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
      volumeSeries.setData(
        data.map((d) => ({
          time: d.time as Time,
          value: d.volume || 0,
          color: d.close_price >= (d.open_price ?? d.close_price)
            ? 'rgba(16, 185, 129, 0.35)'
            : 'rgba(239, 68, 68, 0.35)',
        }))
      );
    }

    // 3. SMA Lines
    if (showSMA) {
      if (!showBB) {
        const s20 = chart.addSeries(LineSeries, { color: 'rgba(16,185,129,0.8)', lineWidth: 1, lastValueVisible: false, priceLineVisible: false });
        s20.setData(
          data.filter(d => d.sma20 !== null).map(d => ({
            time: d.time as Time,
            value: d.sma20 as number,
          }))
        );
      }
      const s50 = chart.addSeries(LineSeries, { color: 'rgba(59,130,246,0.8)', lineWidth: 1, lastValueVisible: false, priceLineVisible: false });
      s50.setData(
        data.filter(d => d.sma50 !== null).map(d => ({
          time: d.time as Time,
          value: d.sma50 as number,
        }))
      );
      const s200 = chart.addSeries(LineSeries, { color: 'rgba(245,158,11,0.8)', lineWidth: 1, lastValueVisible: false, priceLineVisible: false });
      s200.setData(
        data.filter(d => d.sma200 !== null).map(d => ({
          time: d.time as Time,
          value: d.sma200 as number,
        }))
      );
    }

    // 4. Bollinger Bands
    if (showBB) {
      const bbColor = 'rgba(99,102,241,0.5)';
      const bbUp = chart.addSeries(LineSeries, { color: bbColor, lineWidth: 1, lineStyle: LineStyle.Dashed, lastValueVisible: false, priceLineVisible: false });
      bbUp.setData(data.filter(d => d.bbUpper !== null).map(d => ({ time: d.time as Time, value: d.bbUpper as number })));
      const bbMid = chart.addSeries(LineSeries, { color: bbColor, lineWidth: 1, lastValueVisible: false, priceLineVisible: false });
      bbMid.setData(data.filter(d => d.bbMiddle !== null).map(d => ({ time: d.time as Time, value: d.bbMiddle as number })));
      const bbLow = chart.addSeries(LineSeries, { color: bbColor, lineWidth: 1, lineStyle: LineStyle.Dashed, lastValueVisible: false, priceLineVisible: false });
      bbLow.setData(data.filter(d => d.bbLower !== null).map(d => ({ time: d.time as Time, value: d.bbLower as number })));
    }

    // Draw Support & Resistance Levels (Part 6)
    if (srLevels && srLevels.length > 0) {
      srLevels.slice(0, 4).forEach((level) => {
        const line = chart.addSeries(LineSeries, {
          color: level.type === 'support'
            ? 'rgba(34, 197, 94, 0.4)'
            : 'rgba(239, 68, 68, 0.4)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: false,
        });

        const firstTime = data[0]?.time as Time;
        const lastTime  = data[data.length - 1]?.time as Time;

        if (firstTime && lastTime) {
          line.setData([
            { time: firstTime, value: level.price },
            { time: lastTime,  value: level.price },
          ]);
        }
      });
    }

    // Scroll to the latest data
    chart.timeScale().scrollToRealTime();

    // 5. Crosshair subscription (emit OHLCV for the header panel)
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

    chart.timeScale().fitContent();

    return () => {
      // Clear all lines on unmount
      priceLineRefs.current.forEach((line) => {
        candlestickSeriesRef.current?.removePriceLine(line);
      });
      priceLineRefs.current.clear();
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
    };
  }, [data, showSMA, showBB, showVol, interval, onCrosshairMove]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      chartRef.current?.applyOptions({ width: containerRef.current!.clientWidth });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-white/5 bg-[#0A0F1E]">
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
