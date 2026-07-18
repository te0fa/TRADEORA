'use client';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({
  className = '',
  rounded = 'md'
}: SkeletonProps) {
  const r = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full'
  }[rounded];

  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] ${r} ${className}`}
      style={{
        animation: 'skeleton-shimmer 1.5s infinite linear'
      }}
    />
  );
}
