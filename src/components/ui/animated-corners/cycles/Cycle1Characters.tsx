import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CycleProps } from './types';

export function Cycle1Characters({ cycle, color, gap, subCycle, characterCombos }: CycleProps) {
  return (
    <>
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


    </>
  );
}