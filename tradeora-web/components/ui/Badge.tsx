import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface BadgeProps extends HTMLMotionProps<"span"> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'glass';
  pulsing?: boolean;
}

export function Badge({ 
  children, 
  variant = 'glass', 
  pulsing = false,
  className = '',
  ...props 
}: BadgeProps) {
  const baseStyle = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors duration-300";
  
  const variants = {
    primary: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    secondary: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20",
    warning: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    glass: "glass-panel text-zinc-300"
  };

  const dotColors = {
    primary: "bg-blue-400",
    secondary: "bg-zinc-400",
    success: "bg-emerald-400",
    danger: "bg-red-400",
    warning: "bg-yellow-400",
    glass: "bg-zinc-300"
  };

  return (
    <motion.span 
      whileHover={{ scale: 1.05 }}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {pulsing && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant]}`}></span>
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors[variant]}`}></span>
        </span>
      )}
      {children}
    </motion.span>
  );
}
