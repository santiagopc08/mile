'use client';

import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ComboFireFrame
 * Fuego perimetral que rodea la pantalla y escala según la racha de combo.
 *
 * Progresión por nivel de combo:
 *   1 → chispa: brasas suaves solo en el borde inferior
 *   2 → brasa: llamas en el borde inferior
 *   3 → llama alta: fuego inferior + laterales bajos
 *   4 → llamarada: fuego inferior + laterales altos
 *   5+ → tablero en llamas: marco completo rugiente + tinte de pantalla
 *
 * Construido con capas de gradiente + lengüetas de llama animadas por CSS
 * (transform/opacity únicamente) para mantener 60fps sin tocar el hilo principal.
 */

type Edge = 'bottom' | 'left' | 'right' | 'top';

interface FlameTongue {
    left: number;      // 0-100 posición a lo largo del borde
    width: number;     // px
    height: number;    // px (altura de la llama)
    delay: number;     // s
    duration: number;  // s
    hue: number;       // matiz base
}

interface ComboFireFrameProps {
    combo: number;
}

// Genera un set determinista-aleatorio de lengüetas para un borde
function buildTongues(count: number, baseHeight: number, spread: number): FlameTongue[] {
    return Array.from({ length: count }, (_, i) => {
        const jitter = Math.sin(i * 12.9898) * 43758.5453;
        const r = jitter - Math.floor(jitter); // pseudo-random estable 0-1
        const r2 = (Math.sin(i * 78.233) * 12543.123) % 1;
        return {
            left: (i / count) * 100 + (r - 0.5) * (100 / count) * 0.9,
            width: 26 + r * 36,
            height: baseHeight * (0.6 + r * 0.9),
            delay: -(r2 < 0 ? -r2 : r2) * 1.4,
            duration: 0.7 + r * 0.7,
            hue: 18 + r * spread,
        };
    });
}

export function ComboFireFrame({ combo }: ComboFireFrameProps) {
    // Nivel de intensidad 0-5
    const tier = Math.min(5, Math.max(0, combo));

    // Qué bordes están activos según el tier
    const edges = useMemo<Edge[]>(() => {
        if (tier <= 0) return [];
        if (tier === 1) return ['bottom'];
        if (tier === 2) return ['bottom'];
        if (tier === 3) return ['bottom', 'left', 'right'];
        if (tier === 4) return ['bottom', 'left', 'right'];
        return ['bottom', 'left', 'right', 'top'];
    }, [tier]);

    // Altura base de la llama crece con el combo
    const baseHeight = 60 + tier * 34;
    const glowOpacity = Math.min(0.85, 0.28 + tier * 0.12);
    // A mayor combo, el fuego se vuelve más blanco/amarillo (más caliente)
    const hotShift = tier >= 5 ? 26 : tier >= 4 ? 16 : 8;

    const tongues = useMemo(() => {
        // Densidad moderada para mantener 60fps también en móvil
        const perEdgeBottom = 10 + tier * 2;
        const perEdgeSide = 5 + tier;
        return {
            bottom: buildTongues(perEdgeBottom, baseHeight, hotShift),
            top: buildTongues(perEdgeBottom - 3, baseHeight * 0.72, hotShift),
            left: buildTongues(perEdgeSide, baseHeight * 0.82, hotShift),
            right: buildTongues(perEdgeSide, baseHeight * 0.82, hotShift),
        };
    }, [tier, baseHeight, hotShift]);

    // El portal necesita el DOM; en SSR no renderizamos nada.
    if (typeof document === 'undefined') return null;

    const flameColor = (hue: number) =>
        `radial-gradient(ellipse at 50% 100%,
            hsla(${hue + 30}, 100%, 82%, 0.95) 0%,
            hsla(${hue + 14}, 100%, 60%, 0.85) 32%,
            hsla(${hue}, 100%, 50%, 0.55) 58%,
            hsla(${hue - 6}, 100%, 45%, 0) 82%)`;

    const renderTongues = (edge: Edge, list: FlameTongue[]) => {
        const isVertical = edge === 'left' || edge === 'right';
        return list.map((t, i) => {
            const rotate =
                edge === 'top' ? 180 : edge === 'left' ? 90 : edge === 'right' ? -90 : 0;

            const posStyle: React.CSSProperties = isVertical
                ? {
                      top: `${t.left}%`,
                      [edge]: 0,
                      width: t.height,
                      height: t.width,
                  }
                : {
                      left: `${t.left}%`,
                      [edge]: 0,
                      width: t.width,
                      height: t.height,
                  };

            return (
                <div
                    key={`${edge}-${i}`}
                    className="absolute"
                    style={{
                        ...posStyle,
                        background: flameColor(t.hue),
                        borderRadius: '50% 50% 46% 46% / 62% 62% 40% 40%',
                        transformOrigin: 'bottom center',
                        transform: `rotate(${rotate}deg)`,
                        animation: `flame-tongue ${t.duration}s ease-in-out ${t.delay}s infinite alternate`,
                        mixBlendMode: 'screen',
                        filter: 'blur(1.5px)',
                        willChange: 'transform, opacity',
                    }}
                />
            );
        });
    };

    // Resplandor de borde (glow) con el color de acento del jugador
    const edgeGlow = (edge: Edge): React.CSSProperties => {
        const isVertical = edge === 'left' || edge === 'right';
        const dir =
            edge === 'bottom' ? 'to top'
            : edge === 'top' ? 'to bottom'
            : edge === 'left' ? 'to right'
            : 'to left';
        const size = 90 + tier * 28;
        return {
            position: 'absolute',
            [edge]: 0,
            ...(isVertical
                ? { top: 0, bottom: 0, width: size }
                : { left: 0, right: 0, height: size }),
            background: `linear-gradient(${dir},
                hsla(24, 100%, 55%, ${glowOpacity}) 0%,
                hsla(36, 100%, 60%, ${glowOpacity * 0.5}) 40%,
                transparent 100%)`,
            mixBlendMode: 'screen',
            animation: `fire-glow-breathe ${1.6 + tier * 0.1}s ease-in-out infinite`,
            willChange: 'opacity',
        };
    };

    return createPortal(
        <AnimatePresence>
            {tier > 0 && (
                <motion.div
                    key="combo-fire-frame"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="pointer-events-none fixed inset-0 z-[99990] overflow-hidden"
                    aria-hidden
                >
                    {/* Tinte de pantalla ardiente para combos máximos */}
                    {tier >= 5 && (
                        <div
                            className="absolute inset-0"
                            style={{
                                background:
                                    'radial-gradient(ellipse at 50% 120%, hsla(24,100%,50%,0.16), transparent 60%)',
                                animation: 'fire-glow-breathe 1.4s ease-in-out infinite',
                            }}
                        />
                    )}

                    {/* Viñeta cálida en todos los bordes activos */}
                    <div
                        className="absolute inset-0"
                        style={{
                            boxShadow: `inset 0 0 ${40 + tier * 26}px ${8 + tier * 6}px hsla(20, 100%, 48%, ${0.08 + tier * 0.03})`,
                        }}
                    />

                    {edges.map(edge => (
                        <div key={edge}>
                            <div style={edgeGlow(edge)} />
                            {renderTongues(edge, tongues[edge])}
                        </div>
                    ))}

                    {/* Brasas ascendentes (aparecen desde el combo 2) */}
                    {tier >= 2 &&
                        Array.from({ length: 4 + tier * 2 }).map((_, i) => {
                            const emberCount = 4 + tier * 2;
                            const r = (Math.sin(i * 91.17) * 4231.7) % 1;
                            const rr = r < 0 ? -r : r;
                            return (
                                <span
                                    key={`ember-${i}`}
                                    className="absolute bottom-0 rounded-full"
                                    style={{
                                        left: `${(i / emberCount) * 100}%`,
                                        width: 3 + rr * 4,
                                        height: 3 + rr * 4,
                                        background: `hsl(${28 + rr * 20}, 100%, ${60 + rr * 20}%)`,
                                        boxShadow: '0 0 6px hsla(30,100%,60%,0.9)',
                                        // @ts-expect-error custom prop
                                        '--ember-drift': `${(rr - 0.5) * 40}px`,
                                        animation: `fire-ember-rise ${1.4 + rr * 1.6}s ease-out ${rr * 2}s infinite`,
                                        willChange: 'transform, opacity',
                                    }}
                                />
                            );
                        })}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
