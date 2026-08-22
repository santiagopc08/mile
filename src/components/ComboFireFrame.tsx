'use client';

import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ComboFireFrame
 * 
 * Aura perimetral de energía, rieles de plasma y partículas de brasa estilo Cyber-Arcade Brutalist.
 * Diseñado para enmarcar la pantalla con estética de alto impacto sin obstruir las fichas ni el tablero.
 */

interface ComboFireFrameProps {
    combo: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    maxLife: number;
    life: number;
    hue: number;
    swaySpeed: number;
    swayOffset: number;
}

const TIER_CONFIG = [
    // 0: Sin combo
    {
        name: 'None',
        border: 'rgba(255,255,255,0)',
        glow: 'rgba(255,255,255,0)',
        primary: '#f59e0b',
        secondary: '#fbbf24',
        accentHue: 38,
        emberCount: 0,
        railOpacity: 0,
        bracketScale: 1,
    },
    // 1: Chispa
    {
        name: 'Chispa',
        border: 'rgba(245, 158, 11, 0.7)',
        glow: 'rgba(245, 158, 11, 0.35)',
        primary: '#f59e0b',
        secondary: '#fbbf24',
        accentHue: 38,
        emberCount: 18,
        railOpacity: 0.5,
        bracketScale: 1,
    },
    // 2: Brasa Candente
    {
        name: 'Brasa',
        border: 'rgba(255, 106, 0, 0.85)',
        glow: 'rgba(255, 106, 0, 0.5)',
        primary: '#ff6a00',
        secondary: '#f97316',
        accentHue: 24,
        emberCount: 30,
        railOpacity: 0.75,
        bracketScale: 1.08,
    },
    // 3: Llama Alta
    {
        name: 'Llama',
        border: 'rgba(255, 59, 0, 0.95)',
        glow: 'rgba(255, 59, 0, 0.65)',
        primary: '#ff3b00',
        secondary: '#ff0055',
        accentHue: 12,
        emberCount: 46,
        railOpacity: 0.9,
        bracketScale: 1.15,
    },
    // 4: Llamarada Solar
    {
        name: 'Solar',
        border: 'rgba(255, 0, 98, 1)',
        glow: 'rgba(255, 0, 98, 0.75)',
        primary: '#ff0062',
        secondary: '#ff5500',
        accentHue: 340,
        emberCount: 65,
        railOpacity: 1,
        bracketScale: 1.22,
    },
    // 5+: Hipernova / Dios del Mahjong
    {
        name: 'Hipernova',
        border: 'rgba(255, 215, 0, 1)',
        glow: 'rgba(255, 215, 0, 0.85)',
        primary: '#ffd700',
        secondary: '#d946ef',
        accentHue: 48,
        emberCount: 85,
        railOpacity: 1,
        bracketScale: 1.3,
    },
];

export function ComboFireFrame({ combo }: ComboFireFrameProps) {
    const tierIndex = Math.min(5, Math.max(0, combo));
    const tier = TIER_CONFIG[tierIndex];

    const [comboFlash, setComboFlash] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameRef = useRef<number | null>(null);

    // Trigger visual pulse upon combo level up
    useEffect(() => {
        if (combo > 1) {
            setComboFlash(true);
            const timer = setTimeout(() => setComboFlash(false), 260);
            return () => clearTimeout(timer);
        }
    }, [combo]);

    // Canvas particle engine for ultra-smooth GPU embers
    useEffect(() => {
        if (tierIndex === 0) {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            particlesRef.current = [];
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        const maxParticles = tier.emberCount;

        const createParticle = (initY?: number): Particle => {
            const hue = tier.accentHue + (Math.random() - 0.5) * 26;
            return {
                x: Math.random() * width,
                y: initY !== undefined ? initY : height + Math.random() * 20,
                vx: (Math.random() - 0.5) * 0.9,
                vy: -(1.2 + Math.random() * (1.8 + tierIndex * 0.4)),
                size: 1.2 + Math.random() * (2.8 + tierIndex * 0.5),
                alpha: 0.2 + Math.random() * 0.8,
                maxLife: 90 + Math.random() * 80,
                life: 0,
                hue,
                swaySpeed: 0.02 + Math.random() * 0.03,
                swayOffset: Math.random() * Math.PI * 2,
            };
        };

        // Populate initial particles spread vertically for immediate visual feel
        if (particlesRef.current.length === 0) {
            for (let i = 0; i < maxParticles; i++) {
                particlesRef.current.push(createParticle(Math.random() * height));
            }
        }

        let lastTime = performance.now();

        const render = (time: number) => {
            const delta = Math.min((time - lastTime) / 1000, 0.05);
            lastTime = time;

            ctx.clearRect(0, 0, width, height);

            // Maintain correct particle count
            while (particlesRef.current.length < maxParticles) {
                particlesRef.current.push(createParticle());
            }
            if (particlesRef.current.length > maxParticles) {
                particlesRef.current.length = maxParticles;
            }

            for (let i = 0; i < particlesRef.current.length; i++) {
                const p = particlesRef.current[i];
                p.life += 1;
                p.swayOffset += p.swaySpeed;
                p.x += p.vx + Math.sin(p.swayOffset) * 0.6;
                p.y += p.vy;

                const progress = p.life / p.maxLife;
                const currentAlpha = Math.sin(progress * Math.PI) * p.alpha;

                if (p.life >= p.maxLife || p.y < -20 || p.x < -20 || p.x > width + 20) {
                    particlesRef.current[i] = createParticle();
                    continue;
                }

                // Render glowing particle
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                ctx.fillStyle = `hsla(${p.hue}, 100%, ${65 + tierIndex * 5}%, ${currentAlpha})`;
                ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, ${currentAlpha * 0.8})`;
                ctx.shadowBlur = p.size * 3;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        animationFrameRef.current = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [tierIndex, tier.emberCount, tier.accentHue]);

    // Client-only portal rendering
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted || typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {tierIndex > 0 && (
                <motion.div
                    key="combo-fire-frame"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="pointer-events-none fixed inset-0 z-[99990] overflow-hidden select-none"
                    aria-hidden
                >
                    {/* 1. Canvas Embers Particle Layer */}
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 h-full w-full pointer-events-none"
                        style={{ mixBlendMode: 'screen' }}
                    />

                    {/* 2. Precision Neon Laser Rails (Edge perimeter lines) */}
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Top Rail */}
                        <div
                            className="absolute top-0 inset-x-0 h-[2px] transition-all duration-300"
                            style={{
                                background: `linear-gradient(90deg, transparent 0%, ${tier.primary} 15%, ${tier.secondary} 50%, ${tier.primary} 85%, transparent 100%)`,
                                boxShadow: `0 0 14px 2px ${tier.glow}, 0 0 28px 4px ${tier.glow}`,
                                opacity: tier.railOpacity,
                            }}
                        />
                        {/* Bottom Rail */}
                        <div
                            className="absolute bottom-0 inset-x-0 h-[2.5px] transition-all duration-300"
                            style={{
                                background: `linear-gradient(90deg, transparent 0%, ${tier.primary} 15%, ${tier.secondary} 50%, ${tier.primary} 85%, transparent 100%)`,
                                boxShadow: `0 0 16px 3px ${tier.glow}, 0 0 32px 5px ${tier.glow}`,
                                opacity: tier.railOpacity,
                            }}
                        />
                        {/* Left Rail */}
                        <div
                            className="absolute left-0 inset-y-0 w-[2px] transition-all duration-300"
                            style={{
                                background: `linear-gradient(180deg, transparent 0%, ${tier.primary} 15%, ${tier.secondary} 50%, ${tier.primary} 85%, transparent 100%)`,
                                boxShadow: `0 0 14px 2px ${tier.glow}, 0 0 28px 4px ${tier.glow}`,
                                opacity: tier.railOpacity,
                            }}
                        />
                        {/* Right Rail */}
                        <div
                            className="absolute right-0 inset-y-0 w-[2px] transition-all duration-300"
                            style={{
                                background: `linear-gradient(180deg, transparent 0%, ${tier.primary} 15%, ${tier.secondary} 50%, ${tier.primary} 85%, transparent 100%)`,
                                boxShadow: `0 0 14px 2px ${tier.glow}, 0 0 28px 4px ${tier.glow}`,
                                opacity: tier.railOpacity,
                            }}
                        />
                    </div>

                    {/* 3. Subtle Edge Aura Glow (Non-obstructive, softly hugging outer 28px) */}
                    <div
                        className="absolute inset-0 pointer-events-none transition-all duration-300"
                        style={{
                            boxShadow: `inset 0 0 ${20 + tierIndex * 12}px 2px ${tier.glow}`,
                        }}
                    />

                    {/* 4. Bottom Organic Plasma Aura (Confined to bottom 40px) */}
                    <div
                        className="absolute inset-x-0 bottom-0 h-10 pointer-events-none"
                        style={{
                            background: `linear-gradient(to top, ${tier.glow} 0%, transparent 100%)`,
                            mixBlendMode: 'screen',
                            opacity: 0.6 + tierIndex * 0.08,
                        }}
                    />

                    {/* 5. Cyber-Brutalist Corner Power Brackets */}
                    <div className="absolute inset-0 pointer-events-none p-2 sm:p-4">
                        {/* Top-Left Corner */}
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 transition-transform duration-300" style={{ transform: `scale(${tier.bracketScale})` }}>
                            <div className="w-5 h-5 sm:w-7 sm:h-7 border-t-2 border-l-2" style={{ borderColor: tier.primary, boxShadow: `0 0 12px ${tier.glow}` }} />
                            <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full" style={{ backgroundColor: tier.secondary, boxShadow: `0 0 8px ${tier.primary}` }} />
                        </div>

                        {/* Top-Right Corner */}
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 transition-transform duration-300" style={{ transform: `scale(${tier.bracketScale})` }}>
                            <div className="w-5 h-5 sm:w-7 sm:h-7 border-t-2 border-r-2" style={{ borderColor: tier.primary, boxShadow: `0 0 12px ${tier.glow}` }} />
                            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ backgroundColor: tier.secondary, boxShadow: `0 0 8px ${tier.primary}` }} />
                        </div>

                        {/* Bottom-Left Corner */}
                        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 transition-transform duration-300" style={{ transform: `scale(${tier.bracketScale})` }}>
                            <div className="w-5 h-5 sm:w-7 sm:h-7 border-b-2 border-l-2" style={{ borderColor: tier.primary, boxShadow: `0 0 12px ${tier.glow}` }} />
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full" style={{ backgroundColor: tier.secondary, boxShadow: `0 0 8px ${tier.primary}` }} />
                        </div>

                        {/* Bottom-Right Corner */}
                        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 transition-transform duration-300" style={{ transform: `scale(${tier.bracketScale})` }}>
                            <div className="w-5 h-5 sm:w-7 sm:h-7 border-b-2 border-r-2" style={{ borderColor: tier.primary, boxShadow: `0 0 12px ${tier.glow}` }} />
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full" style={{ backgroundColor: tier.secondary, boxShadow: `0 0 8px ${tier.primary}` }} />
                        </div>
                    </div>

                    {/* 6. Dynamic Impact Shockwave Flare upon combo level up */}
                    <AnimatePresence>
                        {comboFlash && (
                            <motion.div
                                key={`flash-${combo}`}
                                initial={{ opacity: 0.9, scale: 0.98 }}
                                animate={{ opacity: 0, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.26, ease: 'easeOut' }}
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    boxShadow: `inset 0 0 50px 10px ${tier.primary}, inset 0 0 100px 20px ${tier.glow}`,
                                    mixBlendMode: 'screen',
                                }}
                            />
                        )}
                    </AnimatePresence>

                    {/* 7. Godlike Chromatic Shimmer for Tier 5+ */}
                    {tierIndex >= 5 && (
                        <div
                            className="absolute inset-0 pointer-events-none opacity-40 animate-pulse"
                            style={{
                                background: 'radial-gradient(ellipse at 50% 100%, rgba(255,215,0,0.15), rgba(217,70,239,0.08) 50%, transparent 80%)',
                                mixBlendMode: 'screen',
                            }}
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
