'use client';

import { motion } from 'framer-motion';

export function GeometricBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
      {/* Intertwined Triangles - Pink Accent */}
      <motion.div
        className="absolute top-1/4 left-1/4"
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg width="100" height="100" viewBox="0 0 100 100" className="fill-none stroke-user-a stroke-[0.5]">
          <path d="M50 10 L90 90 L10 90 Z" />
          <path d="M50 90 L90 10 L10 10 Z" className="opacity-50" />
        </svg>
      </motion.div>

      {/* Twin Circles - Neon Green Accent */}
      <motion.div
        className="absolute bottom-1/4 right-1/4"
        animate={{
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg width="120" height="80" viewBox="0 0 120 80" className="fill-none stroke-user-b stroke-[0.5] opacity-70">
          <circle cx="40" cy="40" r="30" />
          <circle cx="80" cy="40" r="30" />
        </svg>
      </motion.div>

      {/* Floating Rectangles - Subtle Outline */}
      <motion.div
        className="absolute top-1/3 right-[10%]"
        animate={{
          y: [0, 50, 0],
          rotate: [0, 45, 0]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="h-24 w-12 border border-outline/20 opacity-60" />
      </motion.div>

      {/* Purple Accent Rectangle */}
      <motion.div
        className="absolute bottom-1/3 left-[10%]"
        animate={{
          y: [0, -40, 0],
          rotate: [0, -30, 0]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="h-10 w-20 border border-user-c opacity-40" />
      </motion.div>
    </div>
  );
}
