import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'gold' | 'ghost' | 'glass' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}: ButtonProps) {
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  const variants = {
    primary: 'btn-primary rounded-xl',
    gold: 'btn-gold rounded-xl',
    ghost: 'btn-ghost rounded-xl',
    glass: 'glass-input rounded-xl hover:bg-white/10',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 rounded-xl'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`font-semibold tracking-wide flex items-center justify-center gap-2 ${sizeClasses[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children as React.ReactNode}
    </motion.button>
  );
}
