import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CycleProps } from './types';

export function Cycle3Tactical({ cycle, color, size, gap, selectedVariant, springConfig }: CycleProps) {
  return (
    <>
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