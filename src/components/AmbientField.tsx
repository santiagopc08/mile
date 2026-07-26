'use client';

import { useEffect, useRef } from 'react';
import { useProfile } from '@/context/ProfileContext';
import {
    getProfilePalette,
    NEUTRAL_PALETTE_SOFT,
    type ProfileKey,
    type ProfilePalette,
} from '@/lib/profilePalette';

export type AmbientPreset =
    | 'home'
    | 'dashboard'
    | 'refugio'
    | 'planes'
    | 'salud'
    | 'juego'
    | 'login';

interface AmbientFieldProps {
    preset?: AmbientPreset;
    /** Fuerza un perfil. Si se omite, se toma del contexto. */
    profile?: ProfileKey | null;
    /** Constelación de partículas que reacciona al dedo/cursor. */
    interactive?: boolean;
    /** Usa el neutro apagado cuando no hay perfil (fondos tras un formulario). */
    dim?: boolean;
    /**
     * `viewport` (por defecto) lo clava al viewport por detrás de todo.
     * `parent` lo mete dentro del contenedor que lo monta — necesario cuando
     * ese contenedor ya es un `fixed inset-0` con fondo propio, como el login:
     * ahí un `z-[-1]` lo dejaría escondido detrás de su propio `bg`.
     */
    attach?: 'viewport' | 'parent';
    className?: string;
}

/**
 * AmbientField — el único fondo de la app.
 *
 * Sustituye a `InteractiveBackground` y `GeometricBackground`, que hacían casi
 * lo mismo con rampas de color distintas y ocho bucles de framer-motion cada
 * uno. Aquí toda la animación ambiental es CSS sobre `transform`: el hilo
 * principal queda libre para el scroll, que es lo que el usuario sí nota.
 *
 * Cinco capas, de atrás hacia delante:
 *   1. Base      — color plano + dos resplandores radiales del acento
 *   2. Retícula  — blueprint con máscara que la desvanece hacia los bordes
 *   3. Halftone  — trama de puntos en parallax contrario a la retícula
 *   4. Geometría — wireframes flotantes propios de cada sección
 *   5. Grano + viñeta — textura y profundidad
 *
 * La constelación interactiva (canvas) se intercala entre 4 y 5.
 */
export function AmbientField({
    preset = 'home',
    profile: overrideProfile,
    interactive = true,
    dim = false,
    attach = 'viewport',
    className = '',
}: AmbientFieldProps) {
    const { profile: contextProfile } = useProfile();
    const activeProfile = overrideProfile !== undefined ? overrideProfile : contextProfile;
    const colors = getProfilePalette(activeProfile, dim ? NEUTRAL_PALETTE_SOFT : undefined);
    const anchor = attach === 'parent' ? 'absolute inset-0 z-0' : 'fixed inset-0 z-[-1]';

    return (
        <div
            className={`${anchor} overflow-hidden bg-[#0b0709] pointer-events-none select-none ${className}`}
            aria-hidden="true"
            style={
                {
                    '--ambient-line': colors.line,
                    '--ambient-dot': colors.glow,
                } as React.CSSProperties
            }
        >
            {/* ── Capa 1 · Base ─────────────────────────────────────────────
                Dos resplandores fijos en las diagonales. Antes eran dos orbes
                con blur(100px) animados en bucle: un blur de ese radio sobre
                384px se recompone en cada fotograma. Estáticos se ven casi
                igual y cuestan cero. */}
            <div
                className="ambient-layer inset-0"
                style={{
                    background: `
                        radial-gradient(ellipse 80% 60% at 12% 8%, ${colors.glow} 0%, transparent 60%),
                        radial-gradient(ellipse 70% 55% at 88% 92%, ${colors.line} 0%, transparent 62%)
                    `,
                }}
            />

            {/* ── Capa 2 · Retícula técnica ─────────────────────────────── */}
            <div className="ambient-layer ambient-grid" />

            {/* ── Capa 3 · Halftone ─────────────────────────────────────── */}
            <div className="ambient-layer ambient-halftone" />

            {/* ── Capa 4 · Geometría de sección ─────────────────────────── */}
            <PresetGeometry preset={preset} colors={colors} />

            {/* Constelación interactiva */}
            {interactive && <ParticleField colors={colors} preset={preset} />}

            {/* ── Capa 5 · Grano y viñeta ───────────────────────────────── */}
            <div className="ambient-layer ambient-grain" />
            <div className="ambient-layer ambient-vignette" />
        </div>
    );
}

/* ───────────────────────────────────────────────────────────────────────────
   Geometría por sección — el carácter de cada pantalla.
   Todo CSS: `.ambient-float` para la deriva vertical, `.animate-spin-slow`
   con duración larga para el giro. Ni un solo bucle en JS.
   ─────────────────────────────────────────────────────────────────────── */

function PresetGeometry({ preset, colors }: { preset: AmbientPreset; colors: ProfilePalette }) {
    const floatStyle = (i: number) => ({ '--i': i }) as React.CSSProperties;

    switch (preset) {
        case 'home':
        case 'login':
            return (
                <>
                    <div className="ambient-layer ambient-float top-[15%] left-[8%]" style={floatStyle(0)}>
                        <svg width="72" height="72" viewBox="0 0 100 100" className="overflow-visible fill-none stroke-1 opacity-40 animate-spin-slow" style={{ animationDuration: '54s' }}>
                            <polygon points="50,10 90,90 10,90" stroke={colors.primary} />
                            <line x1="50" y1="10" x2="50" y2="90" stroke={colors.shadow} strokeDasharray="3 3" />
                        </svg>
                    </div>
                    <div className="ambient-layer ambient-float bottom-[22%] right-[10%]" style={floatStyle(2)}>
                        <div
                            className="w-24 h-24 rounded-full border border-dashed opacity-30 animate-spin-slow"
                            style={{ borderColor: colors.secondary, animationDuration: '68s' }}
                        />
                    </div>
                    <div className="ambient-layer ambient-float top-[52%] left-[16%]" style={floatStyle(4)}>
                        <svg width="46" height="46" viewBox="0 0 100 100" className="overflow-visible fill-none stroke-1 opacity-25">
                            <rect x="18" y="18" width="64" height="64" stroke={colors.highlight} />
                            <circle cx="50" cy="50" r="14" stroke={colors.shadow} />
                        </svg>
                    </div>
                </>
            );

        case 'dashboard':
            return (
                <>
                    <div
                        className="ambient-layer inset-x-0 top-1/3 h-px opacity-25"
                        style={{ backgroundColor: colors.primary }}
                    />
                    <div className="ambient-layer ambient-float top-[24%] right-[12%]" style={floatStyle(1)}>
                        <div
                            className="border p-2 font-mono text-[9px] uppercase tracking-widest opacity-40"
                            style={{ borderColor: colors.line, color: colors.primary }}
                        >
                            [SYS_RITMO: ONLINE]
                        </div>
                    </div>
                    <div className="ambient-layer ambient-float bottom-[18%] left-[9%]" style={floatStyle(3)}>
                        <svg width="120" height="46" viewBox="0 0 120 46" className="fill-none opacity-25" stroke={colors.secondary} strokeWidth="1">
                            <path d="M0 40 L18 40 L26 12 L34 40 L52 40 L60 24 L68 40 L120 40" />
                        </svg>
                    </div>
                </>
            );

        case 'refugio':
            return (
                <>
                    <div
                        className="ambient-layer ambient-float top-[38%] left-[18%] h-48 w-48 rounded-full opacity-20 blur-[80px]"
                        style={{ backgroundColor: colors.highlight, ...floatStyle(0) }}
                    />
                    <div className="ambient-layer ambient-float bottom-[26%] right-[14%]" style={floatStyle(3)}>
                        <svg width="88" height="88" viewBox="0 0 100 100" className="overflow-visible fill-none stroke-1 opacity-25 animate-spin-slow" style={{ animationDuration: '72s' }}>
                            <polygon points="50,6 94,50 50,94 6,50" stroke={colors.primary} />
                            <polygon points="50,26 74,50 50,74 26,50" stroke={colors.shadow} strokeDasharray="2 4" />
                        </svg>
                    </div>
                </>
            );

        case 'planes':
            return (
                <>
                    <div className="ambient-layer ambient-float top-[18%] right-[14%]" style={floatStyle(0)}>
                        <div
                            className="flex h-40 w-40 items-center justify-center rounded-full border border-dashed opacity-30 animate-spin-slow"
                            style={{ borderColor: colors.primary, animationDuration: '80s' }}
                        >
                            <div className="h-20 w-20 rounded-full border border-dotted" style={{ borderColor: colors.secondary }} />
                        </div>
                    </div>
                    <div className="ambient-layer ambient-float bottom-[24%] left-[10%]" style={floatStyle(3)}>
                        <svg width="70" height="70" viewBox="0 0 100 100" className="fill-none stroke-1 opacity-25">
                            <path d="M50 88 C 22 58 14 42 14 34 a 36 36 0 0 1 72 0 c 0 8 -8 24 -36 54 z" stroke={colors.highlight} />
                            <circle cx="50" cy="34" r="11" stroke={colors.shadow} />
                        </svg>
                    </div>
                </>
            );

        case 'salud':
            return (
                <>
                    <div className="ambient-layer ambient-float bottom-[30%] left-[6%]" style={floatStyle(0)}>
                        <svg width="200" height="40" viewBox="0 0 200 40" className="fill-none opacity-25" stroke={colors.primary} strokeWidth="1.5">
                            <path d="M 0 20 Q 25 0 50 20 T 100 20 T 150 20 T 200 20" />
                        </svg>
                    </div>
                    <div className="ambient-layer ambient-float top-[20%] right-[12%]" style={floatStyle(3)}>
                        <svg width="64" height="64" viewBox="0 0 100 100" className="overflow-visible fill-none stroke-1 opacity-25 animate-spin-slow" style={{ animationDuration: '60s' }}>
                            <circle cx="50" cy="50" r="42" stroke={colors.secondary} strokeDasharray="6 8" />
                            <circle cx="50" cy="50" r="22" stroke={colors.shadow} />
                        </svg>
                    </div>
                </>
            );

        case 'juego':
            return (
                <>
                    <div className="ambient-layer ambient-float top-[20%] left-[10%]" style={floatStyle(0)}>
                        <div
                            className="flex h-24 w-16 items-center justify-center border font-mono text-xs opacity-30"
                            style={{ borderColor: colors.primary, color: colors.primary }}
                        >
                            🀄
                        </div>
                    </div>
                    <div className="ambient-layer ambient-float bottom-[22%] right-[12%]" style={floatStyle(3)}>
                        <svg width="80" height="80" viewBox="0 0 100 100" className="overflow-visible fill-none stroke-1 opacity-25 animate-spin-slow" style={{ animationDuration: '64s' }}>
                            <rect x="12" y="12" width="76" height="76" stroke={colors.secondary} />
                            <rect x="30" y="30" width="40" height="40" stroke={colors.shadow} strokeDasharray="3 5" />
                        </svg>
                    </div>
                </>
            );

        default:
            return null;
    }
}

/* ───────────────────────────────────────────────────────────────────────────
   Constelación de partículas.
   ─────────────────────────────────────────────────────────────────────── */

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    alpha: number;
}

function ParticleField({ colors, preset }: { colors: ProfilePalette; preset: AmbientPreset }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Quien pide menos movimiento no quiere un enjambre detrás del texto.
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (reduced.matches) return;

        let width = 0;
        let height = 0;
        let frameId = 0;

        // Sin escalar por devicePixelRatio el canvas se rasteriza a 1x y se
        // reescala: en un iPhone las partículas salían visiblemente borrosas.
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        resize();

        const particleCount = preset === 'refugio' ? 35 : preset === 'juego' ? 45 : 30;
        const particles: Particle[] = Array.from({ length: particleCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5 + 0.2,
        }));

        const pointer = { x: -1000, y: -1000, radius: 150 };

        const handleMouseMove = (e: MouseEvent) => {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                pointer.x = e.touches[0].clientX;
                pointer.y = e.touches[0].clientY;
            }
        };

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                const dx = pointer.x - p.x;
                const dy = pointer.y - p.y;
                const dist = Math.hypot(dx, dy);

                if (dist < pointer.radius && dist > 0) {
                    const force = (pointer.radius - dist) / pointer.radius;
                    p.x -= (dx / dist) * force * 1.5;
                    p.y -= (dy / dist) * force * 1.5;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = colors.primary;
                ctx.globalAlpha = p.alpha;
                ctx.fill();

                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const pdist = Math.hypot(p.x - p2.x, p.y - p2.y);

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
            frameId = requestAnimationFrame(render);
        };

        // Con la PWA en segundo plano el rAF sigue encolado en algunos
        // navegadores; pararlo explícitamente ahorra batería.
        const handleVisibility = () => {
            cancelAnimationFrame(frameId);
            if (!document.hidden) frameId = requestAnimationFrame(render);
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('visibilitychange', handleVisibility);

        render();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('visibilitychange', handleVisibility);
            cancelAnimationFrame(frameId);
        };
    }, [preset, colors]);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
}
