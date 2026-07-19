import React from 'react';
import Image from 'next/image';

interface TradeoraLogoProps {
  className?: string;
  width?: number;
  height?: number;
  showSubtitle?: boolean;
}

export function TradeoraLogo({ className = '', width = 180, height = 50, showSubtitle = true }: TradeoraLogoProps) {
  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`} style={{ width, height }}>
      <Image
        src="/logo.png"
        alt="TRADEORA"
        width={width}
        height={height}
        className="object-contain mix-blend-screen drop-shadow-2xl brightness-110"
        priority
      />
    </div>
  );
}
