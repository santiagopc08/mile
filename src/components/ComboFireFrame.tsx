'use client';

import { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ComboFireFrame
 * Fuego perimetral perimetral de alta definición que rodea la pantalla
 * y reacciona de forma espectacular a la racha de combo en Mahjong.
 */

type Edge = 'bottom' | 'left' | 'right' | 'top';

interface FlameTongue {
    left: number;      // 0-100% posición a lo largo del borde
    width: number;     // px
    height: number;    // px
    delay: number;     // s
    duration: number;  // s
    hue: number;       // matiz base
    scaleY: number;    // variación de estiramiento
}

interface ComboFireFrameProps {
    combo: number;
}

// Genera lengüetas de fuego deterministas y con física de movimiento ondulante
function buildTongues(count: number, baseHeight: number, spread: number): FlameTongue[] {
    return Array.from({ length: count }, (_, i) => {
        const jitter = Math.sin(i * 14.9898) * 43758.5453;
        const r = jitter - Math.floor(jitter); // pseudo-random estable 0-1
        const r2 = (Math.sin(i * 78.233) * 12543.123) % 1;
        const rr2 = r2 < 0 ? -r2 : r2;

        return {
            left: (i / count) * 100 + (r - 0.5) * (100 / count) * 0.95,
            width: 28 + r * 42,
            height: baseHeight * (0.65 + r * 0.95),
            delay: -rr2 * 1.5,
            duration: 0.65 + r * 0.65,
            hue: 15 + r * spread,
            scaleY: 0.9 + rr2 * 0.4
        };
    });
}

export function ComboFireFrame({ combo }: ComboFireFrameProps) {
    const tier = Math.min(5, Math.max(0, combo));

    // Estado para animar el pulso/destello térmico al incrementar el combo
    const [comboFlash, setComboFlash] = useState(false);

    useEffect(() => {
        if (combo > 1) {
            setComboFlash(true);
            const timer = setTimeout(() => setComboFlash(false), 450);
            return () => clearTimeout(timer);
        }
    }, [combo]);

    // Bordes activos por nivel de combo
    const edges = useMemo<Edge[]>(() => {
        if (tier <= 0) return [];
        if (tier === 1) return ['bottom'];
        if (tier === 2) return ['bottom'];
        if (tier === 3) return ['bottom', 'left', 'right'];
        if (tier === 4) return ['bottom', 'left', 'right'];
        return ['bottom', 'left', 'right', 'top'];
    }, [tier]);

    const baseHeight = 70 + tier * 38;
    const glowOpacity = Math.min(0.9, 0.32 + tier * 0.14);
    const hotShift = tier >= 5 ? 32 : tier >= 4 ? 22 : tier >= 3 ? 14 : 8;

    const tongues = useMemo(() => {
        const perEdgeBottom = 12 + tier * 3;
        const perEdgeSide = 7 + tier * 2;
        return {
            bottom: buildTongues(perEdgeBottom, baseHeight, hotShift),
            top: buildTongues(perEdgeBottom - 2, baseHeight * 0.75, hotShift),
            left: buildTongues(perEdgeSide, baseHeight * 0.85, hotShift),
            right: buildTongues(perEdgeSide, baseHeight * 0.85, hotShift),
        };
    }, [tier, baseHeight, hotShift]);

    if (typeof document === 'undefined') return null;

    // Núcleo incandescente multi-capa (blanco cálido -> dorado solar -> bermellón profundo)
    const flameColorBody = (hue: number) =>
        `radial-gradient(ellipse at 50% 100%,
            hsla(${hue + 40}, 100%, 94%, 0.98) 0%,
            hsla(${hue + 22}, 100%, 65%, 0.90) 28%,
            hsla(${hue + 8}, 100%, 52%, 0.65) 56%,
            hsla(${hue - 4}, 100%, 42%, 0) 84%)`;

    const flameColorCore = (hue: number) =>
        `radial-gradient(ellipse at 50% 100%,
            hsla(55, 100%, 97%, 1) 0%,
            hsla(${hue + 35}, 100%, 75%, 0.85) 45%,
            transparent 75%)`;

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
                <div key={`${edge}-${i}`} className="absolute" style={posStyle}>
                    {/* Capa de Llama Exterior */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: flameColorBody(t.hue),
                            borderRadius: '50% 50% 44% 44% / 65% 65% 38% 38%',
                            transformOrigin: 'bottom center',
                            transform: `rotate(${rotate}deg) scaleY(${t.scaleY})`,
                            animation: `flame-tongue ${t.duration}s ease-in-out ${t.delay}s infinite alternate`,
                            mixBlendMode: 'screen',
                            filter: 'blur(1px)',
                            willChange: 'transform, opacity',
                        }}
                    />
                    {/* Núcleo Blanco Incandescent Interno */}
                    <div
                        className="absolute inset-[15%]"
                        style={{
                            background: flameColorCore(t.hue),
                            borderRadius: '50% 50% 40% 40% / 70% 70% 30% 30%',
                            transformOrigin: 'bottom center',
                            transform: `rotate(${rotate}deg)`,
                            animation: `flame-tongue ${t.duration * 0.8}s ease-in-out ${t.delay * 0.5}s infinite alternate`,
                            mixBlendMode: 'screen',
                            willChange: 'transform, opacity',
                        }}
                    />
                </div>
            );
        });
    };

    const edgeGlow = (edge: Edge): React.CSSProperties => {
        const isVertical = edge === 'left' || edge === 'right';
        const dir =
            edge === 'bottom' ? 'to top'
            : edge === 'top' ? 'to bottom'
            : edge === 'left' ? 'to right'
            : 'to left';
        const size = 110 + tier * 32;

        return {
            position: 'absolute',
            [edge]: 0,
            ...(isVertical
                ? { top: 0, bottom: 0, width: size }
                : { left: 0, right: 0, height: size }),
            background: `linear-gradient(${dir},
                hsla(28, 100%, 58%, ${glowOpacity}) 0%,
                hsla(38, 100%, 62%, ${glowOpacity * 0.6}) 35%,
                hsla(18, 100%, 48%, ${glowOpacity * 0.2}) 70%,
                transparent 100%)`,
            mixBlendMode: 'screen',
            animation: `fire-glow-breathe ${1.4 + tier * 0.1}s ease-in-out infinite`,
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
                    transition={{ duration: 0.3 }}
                    className="pointer-events-none fixed inset-0 z-[99990] overflow-hidden"
                    aria-hidden
                >
                    {/* Destello Térmico de Impacto cuando sube el combo */}
                    <AnimatePresence>
                        {comboFlash && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 0.8, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 bg-gradient-radial from-amber-500/30 via-orange-600/20 to-transparent mix-blend-screen pointer-events-none"
                            />
                        )}
                    </AnimatePresence>

                    {/* Tinte de pantalla ardiente para combos altos (tier >= 4) */}
                    {tier >= 4 && (
                        <div
                            className="absolute inset-0"
                            style={{
                                background:
                                    'radial-gradient(ellipse at 50% 120%, hsla(28,100%,50%,0.22), transparent 65%)',
                                animation: 'fire-glow-breathe 1.2s ease-in-out infinite',
                            }}
                        />
                    )}

                    {/* Viñeta cálida intensa en todos los bordes activos */}
                    <div
                        className="absolute inset-0 transition-all duration-300"
                        style={{
                            boxShadow: `inset 0 0 ${50 + tier * 30}px ${10 + tier * 8}px hsla(24, 100%, 50%, ${0.12 + tier * 0.04})`,
                        }}
                    />

                    {edges.map(edge => (
                        <div key={edge}>
                            <div style={edgeGlow(edge)} />
                            {renderTongues(edge, tongues[edge])}
                        </div>
                    ))}

                    {/* Brasas ascendentes dinámicas con sway horizontal */}
                    {tier >= 2 &&
                        Array.from({ length: 6 + tier * 3 }).map((_, i) => {
                            const emberCount = 6 + tier * 3;
                            const r = (Math.sin(i * 91.17) * 4231.7) % 1;
                            const rr = r < 0 ? -r : r;
                            const size = 3 + rr * 5;

                            return (
                                <span
                                    key={`ember-${i}`}
                                    className="absolute bottom-0 rounded-full"
                                    style={{
                                        left: `${(i / emberCount) * 100}%`,
                                        width: size,
                                        height: size,
                                        background: `hsl(${25 + rr * 25}, 100%, ${65 + rr * 25}%)`,
                                        boxShadow: '0 0 8px hsla(35,100%,65%,0.95)',
                                        // @ts-expect-error custom CSS variable
                                        '--ember-drift': `${(rr - 0.5) * 60}px`,
                                        animation: `fire-ember-rise ${1.2 + rr * 1.5}s ease-out ${rr * 1.8}s infinite`,
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
