'use client';

import { motion } from 'framer-motion';

interface GeometricBackgroundProps {
    activeProfile: 'el' | 'ella' | null;
}

const PROFILE_COLORS = {
    el: {
        primary: '#89D94A',
        secondary: '#B8FF2E',
        shadow: '#3C5F1F',
        highlight: '#D6FF8A'
    },
    ella: {
        primary: '#FF4F9A',
        secondary: '#FF79B6',
        shadow: '#7A1E47',
        highlight: '#FFB3D0'
    }
};

export function GeometricBackground({ activeProfile }: GeometricBackgroundProps) {
    // If no profile is selected, we are in absolute high-contrast technical grayscale
    const colors = activeProfile ? PROFILE_COLORS[activeProfile] : {
        primary: 'rgba(255, 255, 255, 0.15)',
        secondary: 'rgba(255, 255, 255, 0.1)',
        shadow: 'rgba(255, 255, 255, 0.05)',
        highlight: 'rgba(255, 255, 255, 0.25)'
    };

    // Transition values for smooth color morphing
    const transitionStyle = {
        transition: 'stroke 0.8s cubic-bezier(0.16, 1, 0.3, 1), fill 0.8s cubic-bezier(0.16, 1, 0.3, 1), color 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
    };

    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#131313] pointer-events-none select-none">
            {/* SVG Digital Noise Grain Filter */}
            <svg className="hidden">
                <filter id="brutalistNoise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.07 0" />
                </filter>
            </svg>

            {/* Layer 01: Noise Texture Layer */}
            <div className="absolute inset-0 z-10 pointer-events-none opacity-50 mix-blend-overlay" style={{ filter: 'url(#brutalistNoise)' }} />

            {/* Layer 02: Parallax Slow Grid Overlay */}
            <motion.div
                className="absolute inset-[-50px] z-0 opacity-15"
                animate={{
                    x: [-20, 20, -20],
                    y: [-20, 20, -20]
                }}
                transition={{
                    duration: 40,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                <svg width="100%" height="100%">
                    <defs>
                        <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.5" />
                            <circle cx="0" cy="0" r="1" fill="rgba(255, 255, 255, 0.3)" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
                </svg>
            </motion.div>

            {/* Layer 03: Connected Constellation Nodes (Top Left Cluster) */}
            <motion.div
                className="absolute top-[10%] left-[10%] z-0"
                animate={{
                    x: [0, 15, -10, 0],
                    y: [0, -10, 15, 0]
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <svg width="300" height="200" viewBox="0 0 300 200" className="overflow-visible">
                    <g className="stroke-[0.75] fill-none">
                        {/* Lines */}
                        <line x1="50" y1="50" x2="150" y2="30" stroke={colors.secondary} style={transitionStyle} className="opacity-40" />
                        <line x1="150" y1="30" x2="220" y2="90" stroke={colors.primary} style={transitionStyle} />
                        <line x1="220" y1="90" x2="120" y2="140" stroke={colors.secondary} style={transitionStyle} />
                        <line x1="120" y1="140" x2="50" y2="50" stroke={colors.primary} style={transitionStyle} className="opacity-30" />
                        <line x1="150" y1="30" x2="120" y2="140" stroke={colors.highlight} style={transitionStyle} className="opacity-50" />

                        {/* Node Points */}
                        <circle cx="50" cy="50" r="3" fill="#131313" stroke={colors.primary} style={transitionStyle} className="stroke-2" />
                        <circle cx="150" cy="30" r="4" fill={colors.highlight} stroke={colors.primary} style={transitionStyle} />
                        <circle cx="220" cy="90" r="3" fill="#131313" stroke={colors.secondary} style={transitionStyle} className="stroke-2" />
                        <circle cx="120" cy="140" r="3.5" fill="#131313" stroke={colors.highlight} style={transitionStyle} className="stroke-[1.5]" />
                    </g>
                </svg>
            </motion.div>

            {/* Connected Constellation Nodes (Bottom Right Cluster) */}
            <motion.div
                className="absolute bottom-[10%] right-[10%] z-0"
                animate={{
                    x: [0, -20, 10, 0],
                    y: [0, 15, -15, 0]
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <svg width="350" height="220" viewBox="0 0 350 220" className="overflow-visible">
                    <g className="stroke-[0.75] fill-none">
                        <line x1="80" y1="160" x2="180" y2="180" stroke={colors.primary} style={transitionStyle} />
                        <line x1="180" y1="180" x2="280" y2="100" stroke={colors.secondary} style={transitionStyle} className="opacity-40" />
                        <line x1="280" y1="100" x2="200" y2="40" stroke={colors.highlight} style={transitionStyle} />
                        <line x1="200" y1="40" x2="80" y2="160" stroke={colors.secondary} style={transitionStyle} />
                        <line x1="180" y1="180" x2="200" y2="40" stroke={colors.primary} style={transitionStyle} className="opacity-50" />

                        <circle cx="80" cy="160" r="3.5" fill="#131313" stroke={colors.primary} style={transitionStyle} className="stroke-2" />
                        <circle cx="180" cy="180" r="3" fill="#131313" stroke={colors.secondary} style={transitionStyle} />
                        <circle cx="280" cy="100" r="4" fill={colors.highlight} stroke={colors.secondary} style={transitionStyle} />
                        <circle cx="200" cy="40" r="3" fill="#131313" stroke={colors.highlight} style={transitionStyle} className="stroke-2" />
                    </g>
                </svg>
            </motion.div>

            {/* Layer 04: Technical Wireframe Triangle 01 (Left Side) */}
            <motion.div
                className="absolute top-[35%] left-[5%] z-0"
                animate={{
                    rotate: 360,
                    y: [0, 30, -30, 0],
                    scale: [1, 1.05, 0.95, 1]
                }}
                transition={{
                    duration: 35,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                <svg width="90" height="90" viewBox="0 0 100 100" className="overflow-visible fill-none stroke-[0.75]" style={transitionStyle} stroke={colors.secondary}>
                    <polygon points="50,10 90,90 10,90" />
                    <line x1="50" y1="10" x2="50" y2="90" stroke={colors.shadow} style={transitionStyle} className="opacity-30 stroke-dashed" strokeDasharray="3 3" />
                </svg>
            </motion.div>

            {/* Technical Wireframe Triangle 02 (Right Side) */}
            <motion.div
                className="absolute bottom-[35%] right-[5%] z-0"
                animate={{
                    rotate: -360,
                    y: [0, -25, 25, 0],
                    scale: [1, 0.92, 1.08, 1]
                }}
                transition={{
                    duration: 45,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                <svg width="110" height="110" viewBox="0 0 100 100" className="overflow-visible fill-none stroke-[0.75]" style={transitionStyle} stroke={colors.primary}>
                    <polygon points="50,90 90,10 10,10" />
                    <circle cx="50" cy="50" r="15" stroke={colors.shadow} style={transitionStyle} className="opacity-25" />
                </svg>
            </motion.div>

            {/* Layer 05: Fragmented Rectangles (Left / Bottom drift) */}
            <motion.div
                className="absolute bottom-[20%] left-[8%] z-0"
                animate={{
                    y: [0, -50, 0],
                    opacity: [0.15, 0.35, 0.15]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <div className="flex flex-col gap-1 border border-white/5 p-1 bg-[#131313]">
                    <div className="h-2 w-16" style={{ backgroundColor: colors.shadow, ...transitionStyle }} />
                    <div className="h-2 w-16" style={{ backgroundColor: colors.primary, opacity: 0.3, ...transitionStyle }} />
                    <div className="h-2 w-8" style={{ backgroundColor: colors.secondary, opacity: 0.5, ...transitionStyle }} />
                </div>
            </motion.div>

            {/* Fragmented Rectangles (Top / Right drift) */}
            <motion.div
                className="absolute top-[20%] right-[15%] z-0"
                animate={{
                    y: [0, 40, 0],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{
                    duration: 24,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <div className="border border-dashed p-2 font-mono text-[7px]" style={{ borderColor: colors.secondary, ...transitionStyle }}>
                    <div className="w-12 h-6 border-b border-white/10 flex items-center justify-between px-1">
                        <span style={{ color: colors.primary, ...transitionStyle }}>SYS</span>
                        <span style={{ color: colors.highlight, ...transitionStyle }}>OK</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
