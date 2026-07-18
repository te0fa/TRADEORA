import React from 'react';

interface SkeletonProps {
  className?: string;
  circle?: boolean;
}

export function Skeleton({ className = '', circle = false }: SkeletonProps) {
  return (
    <div
      className={`
        animate-pulse 
        bg-white/5 
        border border-white/5 
        ${circle ? 'rounded-full' : 'rounded-md'} 
        ${className}
      `}
    />
  );
}
