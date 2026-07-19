import React from 'react';

interface TradeoraLogoProps {
  className?: string;
  width?: number;
  height?: number;
  showSubtitle?: boolean;
}

export function TradeoraLogo({ className = '', width = 180, height = 50, showSubtitle = true }: TradeoraLogoProps) {
  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`} style={{ width, height }}>
      <svg
        viewBox="0 0 200 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xl"
      >
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE08B" />
            <stop offset="50%" stopColor="#C9A84C" />
            <stop offset="100%" stopColor="#8A6E24" />
          </linearGradient>
          <linearGradient id="goldGradientLight" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFF2C8" />
            <stop offset="50%" stopColor="#D4B65B" />
            <stop offset="100%" stopColor="#A38431" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Bull Horns (The T top) */}
        <path
          d="M 60 30 Q 100 45 140 30"
          stroke="url(#goldGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow)"
        />
        <path
          d="M 60 30 Q 80 15 100 25 Q 120 15 140 30"
          stroke="url(#goldGradientLight)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* The T stem (Bull face) */}
        <path
          d="M 100 25 L 100 65"
          stroke="url(#goldGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow)"
        />
        <path
          d="M 100 65 L 90 55 M 100 65 L 110 55"
          stroke="url(#goldGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* The Swooping Arrow */}
        <path
          d="M 40 50 C 40 85, 150 85, 160 35"
          stroke="url(#goldGradientLight)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="4 4"
        />
        <path
          d="M 155 40 L 160 35 L 165 42"
          stroke="url(#goldGradientLight)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Text TRADEORA */}
        <text
          x="100"
          y="85"
          fontFamily="Georgia, serif"
          fontSize="18"
          fontWeight="bold"
          letterSpacing="4"
          fill="url(#goldGradient)"
          textAnchor="middle"
          filter="url(#glow)"
        >
          TRADEORA
        </text>

        {/* Subtitle */}
        {showSubtitle && (
          <text
            x="100"
            y="98"
            fontFamily="Inter, sans-serif"
            fontSize="6"
            fontWeight="600"
            letterSpacing="2"
            fill="#A38431"
            textAnchor="middle"
          >
            YOUR TRADE • OUR INSIGHT
          </text>
        )}
      </svg>
    </div>
  );
}
