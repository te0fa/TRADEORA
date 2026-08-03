'use client';

import React from 'react';
import { useLocale } from 'next-intl';

export interface TradeVisualizerProps {
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number | null;
  slPrice: number;
  tp1Price: number;
  tp2Price: number;
  isBuy?: boolean;
  status?: string;
  exitReason?: string | null;
  pnlPercent?: number | null;
}

export function TradeVisualizer({
  entryPrice,
  currentPrice,
  exitPrice,
  slPrice,
  tp1Price,
  tp2Price,
  isBuy = true,
  status,
  exitReason,
  pnlPercent,
}: TradeVisualizerProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const entry = Number(entryPrice || 0);
  const sl = Number(slPrice || (isBuy ? entry * 0.95 : entry * 1.05));
  const tp1 = Number(tp1Price || (isBuy ? entry * 1.05 : entry * 0.95));
  const tp2 = Number(tp2Price || (isBuy ? entry * 1.10 : entry * 0.90));
  
  // Use exitPrice if closed/hit, otherwise currentPrice, fallback to entry
  const current = Number(exitPrice || currentPrice || entry || 1);

  // Bounds for scale calculation (Far Right = SL, Far Left = TP2)
  const minVal = Math.min(sl, entry, current, tp1, tp2);
  const maxVal = Math.max(sl, entry, current, tp1, tp2);
  const range = maxVal - minVal > 0 ? maxVal - minVal : 1;

  // Compute percentage positions from Right (0% = Right end / SL, 100% = Left end / TP2)
  const getPctFromRight = (price: number) => {
    const rawPct = ((price - minVal) / range) * 100;
    return Math.min(98, Math.max(2, rawPct));
  };

  const slPct = getPctFromRight(sl);
  const entryPct = getPctFromRight(entry);
  const currentPct = getPctFromRight(current);
  const tp1Pct = getPctFromRight(tp1);
  const tp2Pct = getPctFromRight(tp2);

  // Compute PnL
  const pnlPct = pnlPercent !== undefined && pnlPercent !== null
    ? Number(pnlPercent)
    : (entry > 0 ? ((current - entry) / entry) * 100 : 0);

  const isProfit = pnlPct >= 0;

  return (
    <div className="space-y-3 font-sans" dir="rtl">
      {/* 5-Column Live Prices Grid — Ordered from Right (SL) to Left (TP2) for Arabic RTL */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-black/40 p-3 rounded-xl border border-zinc-800/80 text-xs font-mono">
        {/* Col 1 (Far Right in RTL): Stop Loss SL */}
        <div className="text-right">
          <span className="text-[10px] text-zinc-500 block">{isAr ? 'وقف الخسارة (SL)' : 'Stop Loss'}</span>
          <span className="font-bold text-rose-400 text-sm">{sl.toFixed(2)} ج.م</span>
        </div>

        {/* Col 2: Entry Price */}
        <div className="text-right">
          <span className="text-[10px] text-zinc-500 block">{isAr ? 'سعر الدخول' : 'Entry Price'}</span>
          <span className="font-bold text-white text-sm">{entry.toFixed(2)} ج.م</span>
        </div>

        {/* Col 3 (Middle): Current Live Price */}
        <div className="text-right bg-cyan-950/30 px-2.5 py-1 rounded-lg border border-cyan-500/30 shadow-inner">
          <span className="text-[10px] text-cyan-300 block font-bold">{isAr ? 'السعر الحالي (لايف)' : 'Current Price'}</span>
          <span className="font-bold text-cyan-400 text-sm flex items-center gap-1">
            {current.toFixed(2)} ج.م
            <span className={`text-[10px] font-mono ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
              ({isProfit ? '+' : ''}{pnlPct.toFixed(1)}%)
            </span>
          </span>
        </div>

        {/* Col 4: Target 1 TP1 */}
        <div className="text-right">
          <span className="text-[10px] text-zinc-500 block">{isAr ? 'الهدف الأول (TP1)' : 'Target 1'}</span>
          <span className="font-bold text-emerald-400 text-sm">{tp1.toFixed(2)} ج.م</span>
        </div>

        {/* Col 5 (Far Left in RTL): Target 2 TP2 */}
        <div className="text-right">
          <span className="text-[10px] text-zinc-500 block">{isAr ? 'الهدف الثاني (TP2)' : 'Target 2'}</span>
          <span className="font-bold text-blue-400 text-sm">{tp2.toFixed(2)} ج.م</span>
        </div>
      </div>

      {/* Trade Progress Visualizer Bar — Precise Mathematical Placement */}
      <div className="relative w-full pt-7 pb-6 px-1">
        {/* Main Track */}
        <div className="relative w-full h-3 bg-zinc-900 rounded-full border border-zinc-800/90 shadow-inner">
          {/* Background Zone Fills */}
          {/* Red Loss zone (SL to Entry) */}
          <div 
            className="absolute top-0 bottom-0 bg-rose-500/15"
            style={{ right: `${slPct}%`, width: `${Math.max(0, entryPct - slPct)}%` }}
          />
          {/* Green TP1 zone (Entry to TP1) */}
          <div 
            className="absolute top-0 bottom-0 bg-emerald-500/15"
            style={{ right: `${entryPct}%`, width: `${Math.max(0, tp1Pct - entryPct)}%` }}
          />
          {/* Blue TP2 zone (TP1 to TP2) */}
          <div 
            className="absolute top-0 bottom-0 bg-blue-500/15"
            style={{ right: `${tp1Pct}%`, width: `${Math.max(0, tp2Pct - tp1Pct)}%` }}
          />

          {/* Filled Bar: Active Range from Entry to Current Price */}
          {currentPct >= entryPct ? (
            <div 
              className="absolute top-0 bottom-0 bg-gradient-to-l from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)]"
              style={{ right: `${entryPct}%`, width: `${Math.max(0, currentPct - entryPct)}%` }}
            />
          ) : (
            <div 
              className="absolute top-0 bottom-0 bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-500 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.4)]"
              style={{ right: `${currentPct}%`, width: `${Math.max(0, entryPct - currentPct)}%` }}
            />
          )}
        </div>

        {/* Fixed Price Level Vertical Markers */}
        <div className="absolute top-7 bottom-6 w-0.5 bg-rose-500/70 z-10" style={{ right: `${slPct}%` }} title={`SL: ${sl}`} />
        <div className="absolute top-7 bottom-6 w-0.5 bg-white/80 z-10" style={{ right: `${entryPct}%` }} title={`Entry: ${entry}`} />
        <div className="absolute top-7 bottom-6 w-0.5 bg-emerald-400/80 z-10" style={{ right: `${tp1Pct}%` }} title={`TP1: ${tp1}`} />
        <div className="absolute top-7 bottom-6 w-0.5 bg-blue-400/80 z-10" style={{ right: `${tp2Pct}%` }} title={`TP2: ${tp2}`} />

        {/* Floating Dynamic Pin Marker for Live Current Price */}
        <div 
          className="absolute top-1 transition-all duration-500 z-30"
          style={{ right: `${currentPct}%`, transform: 'translateX(50%)' }}
        >
          {/* Floating Price Badge */}
          <div className="-mt-1 px-2 py-0.5 rounded-md text-[10px] font-black font-mono shadow-xl border whitespace-nowrap flex items-center gap-1.5 animate-bounce-subtle ${
            isProfit 
              ? 'bg-emerald-500 text-black border-emerald-300' 
              : 'bg-rose-500 text-white border-rose-300'
          }">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>{current.toFixed(2)} ج.م</span>
          </div>
          {/* Pin Dot */}
          <div className={`w-3.5 h-3.5 mx-auto -mt-0.5 rounded-full border-2 border-zinc-950 shadow-lg ${
            isProfit ? 'bg-emerald-400 ring-2 ring-emerald-500/40' : 'bg-rose-400 ring-2 ring-rose-500/40'
          }`} />
        </div>

        {/* Price Labels under the ticks */}
        <div className="relative w-full h-4 text-[10px] font-mono mt-1.5">
          <span className="absolute text-rose-400 font-bold" style={{ right: `${slPct}%`, transform: 'translateX(50%)' }}>
            {sl.toFixed(2)} ({isAr ? 'الوقف' : 'SL'})
          </span>
          <span className="absolute text-zinc-300" style={{ right: `${entryPct}%`, transform: 'translateX(50%)' }}>
            {entry.toFixed(2)} ({isAr ? 'الدخول' : 'Entry'})
          </span>
          <span className="absolute text-emerald-400 font-bold" style={{ right: `${tp1Pct}%`, transform: 'translateX(50%)' }}>
            {tp1.toFixed(2)} (TP1)
          </span>
          <span className="absolute text-blue-400 font-bold" style={{ right: `${tp2Pct}%`, transform: 'translateX(50%)' }}>
            {tp2.toFixed(2)} (TP2)
          </span>
        </div>
      </div>
    </div>
  );
}
