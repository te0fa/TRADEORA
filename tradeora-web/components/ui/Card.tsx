import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<"div"> {
  hoverEffect?: boolean;
}

export function Card({ children, hoverEffect = true, className = '', ...props }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={hoverEffect ? { y: -4 } : {}}
      className={`glass-card rounded-2xl overflow-hidden ${className}`}
      {...props}
    >
      {children as React.ReactNode}
    </motion.div>
  );
}
