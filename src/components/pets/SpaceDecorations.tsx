'use client';

import { motion } from 'framer-motion';

export const SpaceDecorations = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Background stars */}
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-px w-px bg-white"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.7 + 0.1,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      {/* Saturn-like planet */}
      <div className="absolute -right-20 top-20 h-40 w-40 opacity-10">
        <div className="h-full w-full rounded-full bg-gradient-to-br from-stone-400 to-stone-900" />
        <div className="absolute left-1/2 top-1/2 h-4 w-64 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-[50%] border border-white/40" />
        <div className="absolute left-1/2 top-1/2 h-8 w-72 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-[50%] border border-white/20" />
      </div>

      {/* Constellation lines */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.03]">
        <line x1="10%" y1="20%" x2="30%" y2="40%" stroke="white" strokeWidth="0.5" />
        <line x1="30%" y1="40%" x2="25%" y2="70%" stroke="white" strokeWidth="0.5" />
        <line x1="80%" y1="10%" x2="70%" y2="30%" stroke="white" strokeWidth="0.5" />
        <line x1="70%" y1="30%" x2="90%" y2="50%" stroke="white" strokeWidth="0.5" />
      </svg>

      {/* Particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={`p-${i}`}
          className="absolute h-[1px] w-[1px] bg-[#00dbe9]/30"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};
