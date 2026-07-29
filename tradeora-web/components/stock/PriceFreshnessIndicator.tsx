'use client';

import { useEffect, useState, useCallback } from 'react';

interface Props {
  lastUpdatedAt: string | null | undefined;
  className?: string;
}

type FreshnessLevel = 'fresh' | 'stale' | 'very_stale' | 'unknown';

const THRESHOLDS_MS = {
  FRESH:     20 * 60 * 1000,
  STALE:     60 * 60 * 1000,
};

function getFreshness(lastUpdatedAt: string | null | undefined): {
  level: FreshnessLevel;
  ageMs: number;
  label: string;
} {
  if (!lastUpdatedAt) {
    return { level: 'unknown', ageMs: 0, label: '' };
  }

  const ageMs = Date.now() - new Date(lastUpdatedAt).getTime();

  if (ageMs < 0 || isNaN(ageMs)) {
    return { level: 'unknown', ageMs: 0, label: '' };
  }

  if (ageMs < THRESHOLDS_MS.FRESH) {
    return { level: 'fresh', ageMs, label: '' };
  }

  const mins  = Math.floor(ageMs / 60_000);
  const hours = Math.floor(mins / 60);

  if (ageMs < THRESHOLDS_MS.STALE) {
    return {
      level: 'stale',
      ageMs,
      label: `آخر تحديث منذ ${mins} دقيقة`,
    };
  }

  return {
    level: 'very_stale',
    ageMs,
    label: hours >= 1
      ? `السعر قديم — منذ ${hours} ساعة`
      : `السعر قديم — منذ ${mins} دقيقة`,
  };
}

export function PriceFreshnessIndicator({
  lastUpdatedAt,
  className = '',
}: Props) {
  const [freshness, setFreshness] = useState(() =>
    getFreshness(lastUpdatedAt)
  );

  const update = useCallback(() => {
    setFreshness(getFreshness(lastUpdatedAt));
  }, [lastUpdatedAt]);

  useEffect(() => {
    update();
    const id = setInterval(update, 30_000); // كل 30 ثانية
    return () => clearInterval(id);
  }, [update]);

  // طازج أو unknown = لا يظهر شيء
  if (freshness.level === 'fresh' || freshness.level === 'unknown') {
    return null;
  }

  const isVeryStale = freshness.level === 'very_stale';

  return (
    <span
      role="status"
      aria-label={freshness.label}
      title={`آخر تحديث: ${lastUpdatedAt}`}
      className={[
        'inline-flex items-center gap-1.5',
        'text-xs font-medium',
        'px-2 py-0.5 rounded-full',
        'border select-none',
        isVeryStale
          ? 'bg-red-500/15 text-red-400 border-red-500/25'
          : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
        className,
      ].join(' ')}
    >
      <span
        className={[
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          'animate-pulse',
          isVeryStale ? 'bg-red-400' : 'bg-yellow-400',
        ].join(' ')}
      />
      {freshness.label}
    </span>
  );
}
