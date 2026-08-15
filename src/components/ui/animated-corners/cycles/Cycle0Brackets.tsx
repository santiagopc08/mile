import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { CycleProps } from './types';

export function Cycle0Brackets({ cycle, color, size, thickness, gap }: CycleProps) {
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


    </>
  );
}