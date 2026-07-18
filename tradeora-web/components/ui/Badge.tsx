import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'glass';
  className?: string;
}

export function Badge({ children, variant = 'glass', className = '' }: BadgeProps) {
  const baseStyle = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-colors duration-200";
  
  const variants = {
    primary: "bg-accent-blue/15 text-accent-blue border border-accent-blue/30 shadow-[0_0_10px_-3px_rgba(59,130,246,0.25)]",
    secondary: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
    success: "bg-up-green/15 text-up-green border border-up-green/30 shadow-[0_0_10px_-3px_rgba(16,185,129,0.25)]",
    danger: "bg-down-red/15 text-down-red border border-down-red/30 shadow-[0_0_10px_-3px_rgba(239,68,68,0.25)]",
    warning: "bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-[0_0_10px_-3px_rgba(245,158,11,0.25)]",
    glass: "bg-white/5 text-text-secondary border border-white/10 hover:bg-white/10 hover:text-text-primary"
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
