import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CycleProps } from './types';

export function Cycle2Laser({ cycle, color, thickness, selectedVariant }: CycleProps) {
  return (
    <>
      {/* -------------------- CYCLE 2: PERIMETER LASER TRACER -------------------- */}
      <AnimatePresence>
        {cycle === 2 && (
          <div className="absolute inset-0 pointer-events-none" style={{ padding: thickness / 2 }}>
            <svg className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
              {selectedVariant === 'alpha' && (
                /* ALPHA: Single fast glowing laser loop */
                <motion.rect
                  x={0}
                  y={0}
                  width="100%"
                  height="100%"
                  fill="none"
                  stroke={color}
                  strokeWidth={thickness * 1.5}
                  initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
                  animate={{
                    pathLength: [0.15, 0.15],
                    pathOffset: [0, 1.2],
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{
                    duration: 3.5,
                    ease: "easeInOut",
                    repeat: Infinity
                  }}
                  style={{ filter: `drop-shadow(0 0 2px ${color})` }}
                />
              )}

              {selectedVariant === 'beta' && (
                /* BETA: Dual chasing lasers traveling in opposite directions */
                <>
                  <motion.rect
                    x={0}
                    y={0}
                    width="100%"
                    height="100%"
                    fill="none"
                    stroke={color}
                    strokeWidth={thickness * 1.5}
                    initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
                    animate={{
                      pathLength: [0.12, 0.12],
                      pathOffset: [0, 1.2],
                      opacity: [0, 0.8, 0.8, 0]
                    }}
                    transition={{
                      duration: 4,
                      ease: "linear",
                      repeat: Infinity
                    }}
                  />
                  <motion.rect
                    x={0}
                    y={0}
                    width="100%"
                    height="100%"
                    fill="none"
                    stroke={color}
                    strokeWidth={thickness * 1.5}
                    initial={{ pathLength: 0, pathOffset: 1, opacity: 0 }}
                    animate={{
                      pathLength: [0.12, 0.12],
                      pathOffset: [1, -0.2],
                      opacity: [0, 0.8, 0.8, 0]
                    }}
                    transition={{
                      duration: 4,
                      ease: "linear",
                      repeat: Infinity
                    }}
                  />
                </>
              )}

              {selectedVariant === 'gamma' && (
                /* GAMMA: High-speed dashed technical tracer scan */
                <motion.rect
                  x={0}
                  y={0}
                  width="100%"
                  height="100%"
                  fill="none"
                  stroke={color}
                  strokeWidth={thickness * 1.5}
                  strokeDasharray="15 30"
                  animate={{
                    strokeDashoffset: [0, -180],
                    opacity: [0, 0.8, 0.8, 0]
                  }}
                  transition={{
                    duration: 3,
                    ease: "linear",
                    repeat: Infinity
                  }}
                />
              )}

              {selectedVariant === 'delta' && (
                /* DELTA: Gentle breathing ambient card glow path */
                <motion.rect
                  x={0}
                  y={0}
                  width="100%"
                  height="100%"
                  fill="none"
                  stroke={color}
                  strokeWidth={thickness}
                  animate={{
                    opacity: [0, 0.6, 0.9, 0.6, 0]
                  }}
                  transition={{
                    duration: 2.5,
                    ease: "easeInOut",
                    repeat: Infinity
                  }}
                  style={{ filter: `drop-shadow(0 0 3px ${color})` }}
                />
              )}
            </svg>
          </div>
        )}
      </AnimatePresence>


    </>
  );
}