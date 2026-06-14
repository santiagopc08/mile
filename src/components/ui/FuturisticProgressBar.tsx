'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FuturisticProgressBarProps {
    progress: number; // 0 to 100
    color?: string;    // CSS color value, e.g., 'var(--color-user-a)' or '#00dbe9'
}

export function FuturisticProgressBar({ progress, color = 'var(--color-user-b)' }: FuturisticProgressBarProps) {
    const cleanProgress = Math.max(0, Math.min(100, progress));

    return (
        <div className="relative w-full h-5 flex items-center select-none font-mono">
            {/* Background Line Track */}
            <div className="absolute left-0 right-0 h-[1.5px] bg-white/[0.08]" />

            {/* Glowing Active Progress Line Segment */}
            <motion.div
                className="absolute left-0 h-[1.5px] origin-left rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${cleanProgress}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 15, mass: 0.8 }}
                style={{ 
                    backgroundColor: color,
                    boxShadow: `0 0 6px ${color}`
                }}
            />

            {/* Interactive Arrow Head Tracker */}
            <motion.div
                className="absolute pointer-events-none"
                initial={{ left: 0 }}
                animate={{ left: `${cleanProgress}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 15, mass: 0.8 }}
                style={{ x: '-50%' }}
            >
                <motion.div 
                    className="flex items-center justify-center"
                    animate={cleanProgress > 0 && cleanProgress < 100 ? {
                        scale: [1, 1.15, 1],
                        opacity: [0.9, 1, 0.9]
                    } : {}}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{ 
                        filter: `drop-shadow(0 0 5px ${color})` 
                    }}
                >
                    {/* Futuristic Dart/Arrow Head */}
                    <svg 
                        viewBox="0 0 10 10" 
                        className="w-3.5 h-3.5 fill-current" 
                        style={{ color: color }}
                    >
                        <path d="M2 1.5 L8 5 L2 8.5 L4 5 Z" />
                    </svg>
                </motion.div>
            </motion.div>
        </div>
    );
}
