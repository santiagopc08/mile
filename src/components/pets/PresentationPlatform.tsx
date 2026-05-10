'use client';

import { motion } from 'framer-motion';

interface PresentationPlatformProps {
  accentColor?: string;
}

export const PresentationPlatform = ({ accentColor = '#ff7020' }: PresentationPlatformProps) => {
  return (
    <div className="relative flex h-32 w-full items-center justify-center">
      {/* Outer metallic base */}
      <div className="absolute h-16 w-80 rounded-[50%] border border-white/20 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] shadow-[0_10px_30px_rgba(0,0,0,0.8)] sm:w-96" />

      {/* Inner glowing ring */}
      <motion.div
        className="absolute h-12 w-64 rounded-[50%] border-2 sm:w-80"
        style={{
          borderColor: accentColor,
          boxShadow: `0 0 20px ${accentColor}44, inset 0 0 20px ${accentColor}44`
        }}
        animate={{
          opacity: [0.4, 0.8, 0.4],
          scale: [0.98, 1.02, 0.98]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Central energy emitter */}
      <div className="absolute h-4 w-40 rounded-[50%] bg-gradient-to-t from-white/10 to-transparent blur-sm sm:w-56" />

      {/* Volumetric light effect upward */}
      <motion.div
        className="absolute bottom-1/2 h-64 w-64 rounded-full bg-gradient-to-t from-transparent via-transparent to-transparent opacity-20"
        style={{
          background: `radial-gradient(ellipse at bottom, ${accentColor}33 0%, transparent 70%)`
        }}
        animate={{
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};
