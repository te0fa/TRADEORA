import React from 'react';

interface TradeoraLogoProps {
  className?: string;
  width?: number;
  height?: number;
  showSubtitle?: boolean;
}

export function TradeoraLogo({ className = '', width = 160, height = 40, showSubtitle = false }: TradeoraLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`} style={{ height }}>
      {/* Glowing Transparent Vector Emblem */}
      <div className="relative flex items-center justify-center shrink-0">
        {/* Subtle Ambient Glow Effect Behind Logo */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 blur-md opacity-40 rounded-full scale-125" />
        
        <svg
          width={Math.round(height * 0.9)}
          height={Math.round(height * 0.9)}
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]"
        >
          <defs>
            <linearGradient id="tradeoraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Hexagonal Dynamic Border Container */}
          <path
            d="M22 2L39.32 12V32L22 42L4.68 32V12L22 2Z"
            fill="url(#tradeoraGrad)"
            fillOpacity="0.15"
            stroke="url(#tradeoraGrad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Upward Bullish Trend Lines */}
          <path
            d="M11 28L18 20L24 25L33 13"
            stroke="url(#tradeoraGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Arrow Tip */}
          <path
            d="M27 13H33V19"
            stroke="url(#tradeoraGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* AI Lightning Spark Dot */}
          <circle cx="33" cy="13" r="3" fill="url(#goldAccent)" className="animate-pulse" />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col justify-center leading-none">
        <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm font-sans">
          TRADEORA
        </span>
        {showSubtitle && (
          <span className="text-[9px] font-extrabold tracking-[0.25em] text-cyan-400/90 uppercase mt-0.5 font-mono">
            EGX INTELLIGENCE
          </span>
        )}
      </div>
    </div>
  );
}
