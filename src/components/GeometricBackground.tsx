'use client';

import { motion } from 'framer-motion';

export function GeometricBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-50">
      {/* Intertwined Triangles */}
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
        <svg width="100" height="100" viewBox="0 0 100 100" className="stroke-geometric-accent fill-none stroke-[0.5]">
          <path d="M50 10 L90 90 L10 90 Z" />
          <path d="M50 90 L90 10 L10 10 Z" className="opacity-50" />
        </svg>
      </motion.div>

      {/* Twin Circles */}
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
        <svg width="120" height="80" viewBox="0 0 120 80" className="stroke-stone-400 dark:stroke-stone-600 fill-none stroke-[0.5]">
          <circle cx="40" cy="40" r="30" />
          <circle cx="80" cy="40" r="30" />
        </svg>
      </motion.div>

      {/* Floating Rectangles */}
      <motion.div
        className="absolute top-1/3 right-1/10"
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
        <div className="w-12 h-24 border border-stone-400 dark:border-stone-600 opacity-60" />
      </motion.div>

      <motion.div
        className="absolute bottom-1/3 left-1/10"
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
        <div className="w-20 h-10 border border-geometric-accent opacity-50" />
      </motion.div>
    </div>
  );
}
