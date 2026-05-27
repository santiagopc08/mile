'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedBrutalistCornersProps {
  color?: string;      // Color for the corners
  size?: number;       // Size of the corner lines (default: 10)
  thickness?: number;  // Border thickness (default: 1)
  gap?: number;        // Padding from the edge of the card (default: 0)
  variant?: 'alpha' | 'beta' | 'gamma' | 'delta' | 'auto'; // Animation variant preset (default: 'auto')
}

export function AnimatedBrutalistCorners({ 
  color = 'currentColor', 
  size = 10, 
  thickness = 1,
  gap = 0,
  variant = 'auto'
}: AnimatedBrutalistCornersProps) {
  const [cycle, setCycle] = useState(0);
  const [subCycle, setSubCycle] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<'alpha' | 'beta' | 'gamma' | 'delta'>('alpha');
  const [cycleDuration, setCycleDuration] = useState(5000);

  // Initialize randomized settings for non-repetitive organic behaviors
  useEffect(() => {
    // 1. Assign or randomize variant
    if (variant === 'auto') {
      const variants: ('alpha' | 'beta' | 'gamma' | 'delta')[] = ['alpha', 'beta', 'gamma', 'delta'];
      // Deterministic choice based on props string hash if possible, otherwise simple random choice on mount
      const hash = color.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const chosen = variants[hash % variants.length];
      setSelectedVariant(chosen);
    } else {
      setSelectedVariant(variant);
    }

    // 2. Slightly randomize transition durations (between 4.5s and 6.8s) so cycles drift apart
    const randDuration = 4500 + Math.random() * 2300;
    setCycleDuration(randDuration);

    // 3. Randomize starting cycle phase so cards don't start in sync
    setCycle(Math.floor(Math.random() * 4));
  }, [variant, color]);

  // Main Cycle Timer
  useEffect(() => {
    const mainTimer = setInterval(() => {
      setCycle((prev) => (prev + 1) % 4);
    }, cycleDuration);

    return () => clearInterval(mainTimer);
  }, [cycleDuration]);

  // Micro-ticker for character glitch cycles (every 1.1s - 1.4s)
  useEffect(() => {
    const subDuration = 1100 + Math.random() * 300;
    const subTimer = setInterval(() => {
      setSubCycle((prev) => (prev + 1) % 4);
    }, subDuration);

    return () => clearInterval(subTimer);
  }, []);

  // Framer-motion spring config
  const springConfig = { type: 'spring' as const, stiffness: 220, damping: 18 };

  // --- VARIANT-BASED CONFIGURATIONS ---

  // Character sets per variant
  const characterSets = {
    alpha: {
      tl: ['*+', '▰▱', '[+]', '//'],
      tr: ['+*', '▱▰', '[+]', '\\\\'],
      bl: ['+*', '▰▱', '[+]', '//'],
      br: ['*+', '▱▰', '[+]', '\\\\']
    },
    beta: {
      tl: ['[x]', '##', '/*', '▼▲'],
      tr: ['[x]', '##', '*/', '▼▲'],
      bl: ['[x]', '##', '/*', '▲▼'],
      br: ['[x]', '##', '*/', '▲▼']
    },
    gamma: {
      tl: ['◇◆', '::', '[o]', '++'],
      tr: ['◆◇', '::', '[o]', '++'],
      bl: ['◆◇', '::', '[o]', '++'],
      br: ['◇◆', '::', '[o]', '++']
    },
    delta: {
      tl: ['«»', '||', '~_', '¤¤'],
      tr: ['«»', '||', '_~', '¤¤'],
      bl: ['«»', '||', '~_', '¤¤'],
      br: ['«»', '||', '_~', '¤¤']
    }
  };

  const characterCombos = characterSets[selectedVariant];

  return (
    <>
      {/* -------------------- CYCLE 0: BRACKETS (ESCUADRAS) -------------------- */}
      <AnimatePresence>
        {cycle === 0 && (
          <>
            {/* Top Left (┌) */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [1, 1.05, 1], 
                opacity: 0.95 
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                scale: { repeat: Infinity, duration: 3, ease: "easeInOut" },
                opacity: { duration: 0.2 }
              }}
              className="absolute pointer-events-none"
              style={{
                left: gap,
                top: gap,
                width: size,
                height: size,
                borderTop: `${thickness}px solid ${color}`,
                borderLeft: `${thickness}px solid ${color}`,
                transformOrigin: 'top left',
              }}
            />
            {/* Top Right (┐) */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [1, 1.05, 1], 
                opacity: 0.95 
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                scale: { repeat: Infinity, duration: 3, ease: "easeInOut" },
                opacity: { duration: 0.2 }
              }}
              className="absolute pointer-events-none"
              style={{
                right: gap,
                top: gap,
                width: size,
                height: size,
                borderTop: `${thickness}px solid ${color}`,
                borderRight: `${thickness}px solid ${color}`,
                transformOrigin: 'top right',
              }}
            />
            {/* Bottom Left (└) */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [1, 1.05, 1], 
                opacity: 0.95 
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                scale: { repeat: Infinity, duration: 3, ease: "easeInOut" },
                opacity: { duration: 0.2 }
              }}
              className="absolute pointer-events-none"
              style={{
                left: gap,
                bottom: gap,
                width: size,
                height: size,
                borderBottom: `${thickness}px solid ${color}`,
                borderLeft: `${thickness}px solid ${color}`,
                transformOrigin: 'bottom left',
              }}
            />
            {/* Bottom Right (┘) */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [1, 1.05, 1], 
                opacity: 0.95 
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                scale: { repeat: Infinity, duration: 3, ease: "easeInOut" },
                opacity: { duration: 0.2 }
              }}
              className="absolute pointer-events-none"
              style={{
                right: gap,
                bottom: gap,
                width: size,
                height: size,
                borderBottom: `${thickness}px solid ${color}`,
                borderRight: `${thickness}px solid ${color}`,
                transformOrigin: 'bottom right',
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* -------------------- CYCLE 1: CHARACTER COMBINATIONS -------------------- */}
      <AnimatePresence mode="popLayout">
        {cycle === 1 && (
          <div className="absolute inset-0 pointer-events-none font-mono text-[9px] font-black uppercase tracking-tighter select-none">
            {/* Top Left */}
            <motion.div
              key={`tl-${subCycle}`}
              initial={{ scale: 0.7, opacity: 0, x: -2, y: -2 }}
              animate={{ scale: 1, opacity: 0.9, x: 0, y: 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute"
              style={{ 
                left: gap + 2, 
                top: gap + 2, 
                color,
                textShadow: `0 0 3px ${color}50`
              }}
            >
              {characterCombos.tl[subCycle]}
            </motion.div>

            {/* Top Right */}
            <motion.div
              key={`tr-${subCycle}`}
              initial={{ scale: 0.7, opacity: 0, x: 2, y: -2 }}
              animate={{ scale: 1, opacity: 0.9, x: 0, y: 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute"
              style={{ 
                right: gap + 2, 
                top: gap + 2, 
                color,
                textShadow: `0 0 3px ${color}50`
              }}
            >
              {characterCombos.tr[subCycle]}
            </motion.div>

            {/* Bottom Left */}
            <motion.div
              key={`bl-${subCycle}`}
              initial={{ scale: 0.7, opacity: 0, x: -2, y: 2 }}
              animate={{ scale: 1, opacity: 0.9, x: 0, y: 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute"
              style={{ 
                left: gap + 2, 
                bottom: gap + 2, 
                color,
                textShadow: `0 0 3px ${color}50`
              }}
            >
              {characterCombos.bl[subCycle]}
            </motion.div>

            {/* Bottom Right */}
            <motion.div
              key={`br-${subCycle}`}
              initial={{ scale: 0.7, opacity: 0, x: 2, y: 2 }}
              animate={{ scale: 1, opacity: 0.9, x: 0, y: 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute"
              style={{ 
                right: gap + 2, 
                bottom: gap + 2, 
                color,
                textShadow: `0 0 3px ${color}50`
              }}
            >
              {characterCombos.br[subCycle]}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* -------------------- CYCLE 3: TACTICAL TARGETS & FIGURES -------------------- */}
      <AnimatePresence>
        {cycle === 3 && (
          <div className="absolute inset-0 pointer-events-none">
            {selectedVariant === 'alpha' && (
              /* ALPHA: Target circular crosshairs */
              <>
                <motion.div
                  initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
                  animate={{ scale: 1, opacity: 0.8, rotate: 180 }}
                  exit={{ scale: 0.4, opacity: 0, rotate: 225 }}
                  transition={springConfig}
                  className="absolute"
                  style={{ left: gap + 2, top: gap + 2 }}
                >
                  <svg width={size * 1.4} height={size * 1.4} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
                    <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
                    <line x1="12" y1="2" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                  </svg>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.4, opacity: 0, rotate: 45 }}
                  animate={{ scale: 1, opacity: 0.8, rotate: -180 }}
                  exit={{ scale: 0.4, opacity: 0, rotate: -225 }}
                  transition={springConfig}
                  className="absolute"
                  style={{ right: gap + 2, top: gap + 2 }}
                >
                  <svg width={size * 1.4} height={size * 1.4} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
                    <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
                    <line x1="12" y1="2" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                  </svg>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.4, opacity: 0, rotate: 45 }}
                  animate={{ scale: 1, opacity: 0.8, rotate: -180 }}
                  exit={{ scale: 0.4, opacity: 0, rotate: -225 }}
                  transition={springConfig}
                  className="absolute"
                  style={{ left: gap + 2, bottom: gap + 2 }}
                >
                  <svg width={size * 1.4} height={size * 1.4} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
                    <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
                    <line x1="12" y1="2" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                  </svg>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
                  animate={{ scale: 1, opacity: 0.8, rotate: 180 }}
                  exit={{ scale: 0.4, opacity: 0, rotate: 225 }}
                  transition={springConfig}
                  className="absolute"
                  style={{ right: gap + 2, bottom: gap + 2 }}
                >
                  <svg width={size * 1.4} height={size * 1.4} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
                    <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
                    <line x1="12" y1="2" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                  </svg>
                </motion.div>
              </>
            )}

            {selectedVariant === 'beta' && (
              /* BETA: Tactical right triangles pointing inwards */
              <>
                <motion.div
                  initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
                  animate={{ scale: 1, opacity: 0.9, rotate: 135 }} /* pointing bottom-right */
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={springConfig}
                  className="absolute"
                  style={{ left: gap + 2, top: gap + 2 }}
                >
                  <svg width={size * 1.3} height={size * 1.3} viewBox="0 0 24 24" fill={color}>
                    <polygon points="12,4 4,20 20,20" />
                  </svg>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.4, opacity: 0, rotate: 45 }}
                  animate={{ scale: 1, opacity: 0.9, rotate: -135 }} /* pointing bottom-left */
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={springConfig}
                  className="absolute"
                  style={{ right: gap + 2, top: gap + 2 }}
                >
                  <svg width={size * 1.3} height={size * 1.3} viewBox="0 0 24 24" fill={color}>
                    <polygon points="12,4 4,20 20,20" />
                  </svg>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.4, opacity: 0, rotate: 45 }}
                  animate={{ scale: 1, opacity: 0.9, rotate: 45 }} /* pointing top-right */
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={springConfig}
                  className="absolute"
                  style={{ left: gap + 2, bottom: gap + 2 }}
                >
                  <svg width={size * 1.3} height={size * 1.3} viewBox="0 0 24 24" fill={color}>
                    <polygon points="12,4 4,20 20,20" />
                  </svg>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.4, opacity: 0, rotate: -45 }}
                  animate={{ scale: 1, opacity: 0.9, rotate: -45 }} /* pointing top-left */
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={springConfig}
                  className="absolute"
                  style={{ right: gap + 2, bottom: gap + 2 }}
                >
                  <svg width={size * 1.3} height={size * 1.3} viewBox="0 0 24 24" fill={color}>
                    <polygon points="12,4 4,20 20,20" />
                  </svg>
                </motion.div>
              </>
            )}

            {selectedVariant === 'gamma' && (
              /* GAMMA: Rotating nested command boxes */
              <>
                <motion.div
                  initial={{ scale: 0.4, opacity: 0, rotate: -90 }}
                  animate={{ scale: 1, opacity: 0.85, rotate: 180 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={springConfig}
                  className="absolute"
                  style={{ left: gap + 2, top: gap + 2 }}
                >
                  <svg width={size * 1.3} height={size * 1.3} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
                    <rect x="3" y="3" width="18" height="18" />
                    <rect x="9" y="9" width="6" height="6" fill={color} />
                  </svg>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.4, opacity: 0, rotate: 90 }}
                  animate={{ scale: 1, opacity: 0.85, rotate: -180 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={springConfig}
                  className="absolute"
                  style={{ right: gap + 2, top: gap + 2 }}
                >
                  <svg width={size * 1.3} height={size * 1.3} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
                    <rect x="3" y="3" width="18" height="18" />
                    <rect x="9" y="9" width="6" height="6" fill={color} />
                  </svg>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.4, opacity: 0, rotate: 90 }}
                  animate={{ scale: 1, opacity: 0.85, rotate: -180 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={springConfig}
                  className="absolute"
                  style={{ left: gap + 2, bottom: gap + 2 }}
                >
                  <svg width={size * 1.3} height={size * 1.3} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
                    <rect x="3" y="3" width="18" height="18" />
                    <rect x="9" y="9" width="6" height="6" fill={color} />
                  </svg>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.4, opacity: 0, rotate: -90 }}
                  animate={{ scale: 1, opacity: 0.85, rotate: 180 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={springConfig}
                  className="absolute"
                  style={{ right: gap + 2, bottom: gap + 2 }}
                >
                  <svg width={size * 1.3} height={size * 1.3} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}>
                    <rect x="3" y="3" width="18" height="18" />
                    <rect x="9" y="9" width="6" height="6" fill={color} />
                  </svg>
                </motion.div>
              </>
            )}

            {selectedVariant === 'delta' && (
              /* DELTA: Blinking retro-terminal cursor blocks */
              <>
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.25, repeat: Infinity, ease: "linear" }}
                  className="absolute"
                  style={{ 
                    left: gap + 2, 
                    top: gap + 2, 
                    width: size * 1.2, 
                    height: size * 1.2, 
                    backgroundColor: color,
                    boxShadow: `0 0 3px ${color}`
                  }}
                />
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.25, repeat: Infinity, ease: "linear", delay: 0.2 }}
                  className="absolute"
                  style={{ 
                    right: gap + 2, 
                    top: gap + 2, 
                    width: size * 1.2, 
                    height: size * 1.2, 
                    backgroundColor: color,
                    boxShadow: `0 0 3px ${color}`
                  }}
                />
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.25, repeat: Infinity, ease: "linear", delay: 0.4 }}
                  className="absolute"
                  style={{ 
                    left: gap + 2, 
                    bottom: gap + 2, 
                    width: size * 1.2, 
                    height: size * 1.2, 
                    backgroundColor: color,
                    boxShadow: `0 0 3px ${color}`
                  }}
                />
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.25, repeat: Infinity, ease: "linear", delay: 0.6 }}
                  className="absolute"
                  style={{ 
                    right: gap + 2, 
                    bottom: gap + 2, 
                    width: size * 1.2, 
                    height: size * 1.2, 
                    backgroundColor: color,
                    boxShadow: `0 0 3px ${color}`
                  }}
                />
              </>
            )}
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
