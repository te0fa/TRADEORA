'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface QualityDotProps {
  flag: string | null;
  showText?: boolean;
}

export function QualityDot({ flag, showText = true }: QualityDotProps) {
  const t = useTranslations('qualityFlags');

  // Resolve config based on flag pattern
  let labelKey = 'consensusPerfect';
  let dotColor = 'bg-up-green';
  let glowColor = 'shadow-up-green/50';
  let textColor = 'text-up-green';
  let bgWrapper = 'bg-up-green/10 border-up-green/20';

  if (flag) {
    if (flag.startsWith('2_source_consensus_')) {
      labelKey = 'consensus2Source';
      dotColor = 'bg-accent-blue';
      glowColor = 'shadow-accent-blue/50';
      textColor = 'text-accent-blue';
      bgWrapper = 'bg-accent-blue/10 border-accent-blue/20';
    } else if (flag === 'single_source_warning') {
      labelKey = 'singleSource';
      dotColor = 'bg-yellow-500';
      glowColor = 'shadow-yellow-500/50';
      textColor = 'text-yellow-500';
      bgWrapper = 'bg-yellow-500/10 border-yellow-500/20';
    } else if (flag.startsWith('conflict_over_1.5_')) {
      labelKey = 'conflict';
      dotColor = 'bg-down-red';
      glowColor = 'shadow-down-red/50';
      textColor = 'text-down-red';
      bgWrapper = 'bg-down-red/10 border-down-red/20';
    } else if (flag === 'outlier_discarded' || flag === 'low_consensus_fallback_to_median') {
      labelKey = 'outlier';
      dotColor = 'bg-orange-500';
      glowColor = 'shadow-orange-500/50';
      textColor = 'text-orange-500';
      bgWrapper = 'bg-orange-500/10 border-orange-500/20';
    }
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium leading-none ${bgWrapper}`}>
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor} shadow-sm ${glowColor}`}></span>
      </span>
      {showText && <span className={`${textColor}`}>{t(labelKey)}</span>}
    </div>
  );
}
