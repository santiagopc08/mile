'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '@/context/ProfileContext';

export type BackgroundPreset = 'home' | 'dashboard' | 'refugio' | 'planes' | 'salud' | 'juego';

interface InteractiveBackgroundProps {
    preset?: BackgroundPreset;
    profile?: 'el' | 'ella' | null;
    className?: string;
}

const PROFILE_COLORS = {
    el: {
        primary: '#c3f400',       // Santi Neon Green
        secondary: '#89D94A',
        glow: 'rgba(195, 244, 0, 0.25)',
        line: 'rgba(195, 244, 0, 0.18)',
        accent: '#D6FF8A'
    },
    ella: {
        primary: '#ff4b89',     // Mile Vibrant Pink
        secondary: '#FF79B6',
        glow: 'rgba(255, 75, 137, 0.25)',
        line: 'rgba(255, 75, 137, 0.18)',
        accent: '#FFB3D0'
    }
};

const DEFAULT_COLORS = {
    primary: 'rgba(255, 255, 255, 0.4)',
    secondary: 'rgba(255, 255, 255, 0.2)',
    glow: 'rgba(255, 255, 255, 0.1)',
    line: 'rgba(255, 255, 255, 0.12)',
    accent: 'rgba(255, 255, 255, 0.6)'
};

export function InteractiveBackground({ preset = 'home', profile: overrideProfile, className = '' }: InteractiveBackgroundProps) {
    const { profile: contextProfile } = useProfile();
    const activeProfile = overrideProfile !== undefined ? overrideProfile : contextProfile;
    const colors = activeProfile ? PROFILE_COLORS[activeProfile] : DEFAULT_COLORS;

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Interactive particle constellation canvas effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        // Particle configuration based on preset
        const particleCount = preset === 'refugio' ? 35 : preset === 'juego' ? 45 : 30;
        interface Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            radius: number;
            alpha: number;
            pulseSpeed: number;
        }

        const particles: Particle[] = Array.from({ length: particleCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5 + 0.2,
            pulseSpeed: Math.random() * 0.02 + 0.005
        }));

        let mouse = { x: -1000, y: -1000, radius: 150 };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw particles & connect lines
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                // Mouse interaction distance
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    p.x -= (dx / dist) * force * 1.5;
                    p.y -= (dy / dist) * force * 1.5;
                }

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = colors.primary;
                ctx.globalAlpha = p.alpha;
                ctx.fill();

                // Connect nearby particles
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const pdx = p.x - p2.x;
                    const pdy = p.y - p2.y;
                    const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

                    if (pdist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = colors.primary;
                        ctx.globalAlpha = (1 - pdist / 120) * 0.15;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }
            }

            ctx.globalAlpha = 1;
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [preset, colors]);

    return (
        <div className={`fixed inset-0 z-[-1] overflow-hidden bg-[#130d10] pointer-events-none select-none ${className}`}>
            {/* SVG Digital Noise Texture */}
            <svg className="hidden">
                <filter id="bgNoise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.05 0" />
                </filter>
            </svg>

            {/* Noise texture overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none opacity-40 mix-blend-overlay" style={{ filter: 'url(#bgNoise)' }} />

            {/* Canvas layer for interactive cursor constellation */}
            <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-auto" />

            {/* Base Mosaic Grid */}
            <div className="absolute inset-0 bg-mosaic opacity-40 pointer-events-none" />
            <div className="absolute inset-0 bg-dot-matrix opacity-25 pointer-events-none" />

            {/* Ambient Glow Orbs */}
            <motion.div
                className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[100px] opacity-30 pointer-events-none"
                style={{ backgroundColor: colors.primary }}
                animate={{
                    scale: [1, 1.25, 1],
                    opacity: [0.25, 0.4, 0.25]
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <motion.div
                className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[120px] opacity-25 pointer-events-none"
                style={{ backgroundColor: colors.secondary }}
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.2, 0.35, 0.2]
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Preset Specific Geometric Animations */}
            {preset === 'home' && (
                <>
                    {/* Top Left Floating Wireframe Triangle */}
                    <motion.div
                        className="absolute top-[15%] left-[8%] z-0"
                        animate={{
                            rotate: 360,
                            y: [0, 20, -20, 0]
                        }}
                        transition={{
                            duration: 30,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        <svg width="70" height="70" viewBox="0 0 100 100" className="overflow-visible fill-none stroke-[1]">
                            <polygon points="50,10 90,90 10,90" stroke={colors.primary} className="opacity-40" />
                        </svg>
                    </motion.div>

                    {/* Bottom Right Pulse Rings */}
                    <motion.div
                        className="absolute bottom-[20%] right-[10%] z-0"
                        animate={{
                            scale: [1, 1.15, 1],
                            rotate: -180
                        }}
                        transition={{
                            duration: 25,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <div className="w-24 h-24 border border-dashed rounded-full" style={{ borderColor: colors.secondary, opacity: 0.3 }} />
                    </motion.div>
                </>
            )}

            {preset === 'dashboard' && (
                <>
                    {/* Financial/Rhythm Pulse Waves */}
                    <motion.div
                        className="absolute inset-x-0 top-1/3 h-[1px] opacity-30"
                        style={{ backgroundColor: colors.primary }}
                        animate={{
                            opacity: [0.15, 0.5, 0.15],
                            scaleY: [1, 3, 1]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute top-[25%] right-[12%] font-mono text-[9px] border p-2 tracking-widest uppercase opacity-40"
                        style={{ borderColor: colors.line, color: colors.primary }}
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    >
                        [SYS_RITMO: ONLINE]
                    </motion.div>
                </>
            )}

            {preset === 'refugio' && (
                <>
                    {/* Floating Memory Aura Orbs */}
                    <motion.div
                        className="absolute top-[40%] left-[20%] w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none"
                        style={{ backgroundColor: colors.accent }}
                        animate={{
                            x: [0, 50, -30, 0],
                            y: [0, -40, 30, 0]
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </>
            )}

            {preset === 'planes' && (
                <>
                    {/* Geospatial Satellite Radar Pulse */}
                    <motion.div
                        className="absolute top-[18%] right-[15%] w-40 h-40 border border-dashed rounded-full flex items-center justify-center opacity-30"
                        style={{ borderColor: colors.primary }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    >
                        <div className="w-20 h-20 border border-dotted rounded-full" style={{ borderColor: colors.secondary }} />
                    </motion.div>
                </>
            )}

            {preset === 'salud' && (
                <>
                    {/* Biometric Sine Wave Scan */}
                    <motion.div
                        className="absolute bottom-[30%] left-[5%] opacity-25"
                        animate={{ x: [0, 30, 0] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <svg width="200" height="40" viewBox="0 0 200 40" fill="none" stroke={colors.primary} strokeWidth="1.5">
                            <path d="M 0 20 Q 25 0 50 20 T 100 20 T 150 20 T 200 20" />
                        </svg>
                    </motion.div>
                </>
            )}

            {preset === 'juego' && (
                <>
                    {/* Mahjong Cyber Matrix Frames */}
                    <motion.div
                        className="absolute top-[20%] left-[10%] w-16 h-24 border opacity-30 flex items-center justify-center font-mono text-xs"
                        style={{ borderColor: colors.primary, color: colors.primary }}
                        animate={{ rotate: [0, 10, -10, 0], y: [0, -15, 0] }}
                        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                    >
                        🀄
                    </motion.div>
                </>
            )}
        </div>
    );
}
