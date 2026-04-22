'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SymmetryShieldProps {
  focusScore: number;
  isFragmented: boolean;
}

export const SymmetryShield = ({ focusScore, isFragmented }: SymmetryShieldProps) => {
  const glowIntensity = Math.min(focusScore / 100, 1);

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      {/* Glow Effect */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2 * glowIntensity, 0.1],
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 rounded-full bg-user-a blur-xl"
        style={{
          boxShadow: focusScore > 80 ? '0 0 40px 10px var(--color-user-a)' : 'none'
        }}
      />

      <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Main Shield Geometry */}
        <motion.path
          d="M50 10 L85 25 V50 C85 70 50 90 50 90 C50 90 15 70 15 50 V25 L50 10Z"
          stroke="currentColor"
          strokeWidth="1.5"
          animate={{
            pathLength: [0, 1],
            strokeDasharray: isFragmented ? ["1, 5", "5, 10"] : ["1, 0"],
          }}
          className="text-stone-800 dark:text-stone-200"
        />

        {/* Internal Symmetrical Lines */}
        <path d="M50 10 V90" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
        <path d="M15 50 H85" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />

        {/* Core Center */}
        <motion.circle
          cx="50" cy="50" r="4"
          fill={focusScore > 80 ? 'var(--color-user-a)' : 'currentColor'}
          animate={focusScore > 80 ? {
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </svg>

      <div className="absolute -bottom-2 text-[8px] uppercase font-bold tracking-[0.3em] text-stone-400">
        Focus: {Math.round(focusScore)}%
      </div>
    </div>
  );
};
