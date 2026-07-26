'use client';

import { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ComboFireFrame
 * Fuego perimetral unificado estilo fogata (roaring campfire body).
 *
 * Características clave:
 * 1. Manto continuo de fogata: las llamaradas se entrelazan y traslapan para evitar llamas aisladas tipo vela.
 * 2. Cero bordes planos: la base de cada fuego se extiende fuera de la pantalla (-24px a -30px) para que
 *    nazca sin cortes rectos visibles desde los 4 bordes.
 * 3. Rendimiento GPU ultra optimizado a 60-120 FPS (sin filtros SVG en CPU).
 */

type Edge = 'bottom' | 'left' | 'right' | 'top';

interface FlamePlume {
    left: number;      // 0-100% posición a lo largo del borde
    width: number;     // px (ancho de pluma para traslape)
    height: number;    // px
    delay: number;     // s
    duration: number;  // s
    hue: number;       // matiz base
    scaleX: number;    // variación de ancho
}

interface ComboFireFrameProps {
    combo: number;
}

// Genera plumas anchas e interconectadas estilo fogata
function buildCampfirePlumes(count: number, baseHeight: number, spread: number): FlamePlume[] {
    return Array.from({ length: count }, (_, i) => {
        const jitter = Math.sin(i * 18.9898) * 43758.5453;
        const r = jitter - Math.floor(jitter);
        const r2 = (Math.sin(i * 92.233) * 12543.123) % 1;
        const rr2 = r2 < 0 ? -r2 : r2;

        return {
            left: (i / count) * 100 - 5 + (r - 0.5) * 8, // traslape continuo entre plumas
            width: 75 + r * 70,                           // llamaradas anchas estilo fogata
            height: baseHeight * (0.75 + r * 0.7),
            delay: -rr2 * 1.6,
            duration: 0.7 + r * 0.7,
            hue: 14 + r * spread,
            scaleX: 0.9 + rr2 * 0.4
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

    const baseHeight = 90 + tier * 36;
    const glowOpacity = Math.min(0.92, 0.38 + tier * 0.12);
    const hotShift = tier >= 5 ? 32 : tier >= 4 ? 22 : tier >= 3 ? 14 : 8;

    const plumes = useMemo(() => {
        const perEdgeBottom = 10 + tier * 2;
        const perEdgeSide = 6 + tier * 2;
        return {
            bottom: buildCampfirePlumes(perEdgeBottom, baseHeight, hotShift),
            top: buildCampfirePlumes(perEdgeBottom - 2, baseHeight * 0.8, hotShift),
            left: buildCampfirePlumes(perEdgeSide, baseHeight * 0.85, hotShift),
            right: buildCampfirePlumes(perEdgeSide, baseHeight * 0.85, hotShift),
        };
    }, [tier, baseHeight, hotShift]);

    if (typeof document === 'undefined') return null;

    // Núcleo incandescente estilo fogata (blanco-dorado -> naranja candente -> carmesí)
    const campfireFlameBody = (hue: number) =>
        `radial-gradient(ellipse at 50% 100%,
            rgba(255, 255, 245, 1) 0%,
            hsla(${hue + 38}, 100%, 75%, 0.96) 24%,
            hsla(${hue + 18}, 100%, 58%, 0.85) 50%,
            hsla(${hue + 2}, 100%, 46%, 0.50) 75%,
            transparent 92%)`;

    const campfireFlameCore = (hue: number) =>
        `radial-gradient(ellipse at 50% 100%,
            rgba(255, 255, 255, 1) 0%,
            hsla(${hue + 45}, 100%, 86%, 0.95) 35%,
            hsla(${hue + 25}, 100%, 65%, 0.65) 65%,
            transparent 88%)`;

    const renderEdgeFire = (edge: Edge, list: FlamePlume[]) => {
        const isVertical = edge === 'left' || edge === 'right';

        // Anclaje y sangrado de bordes planos fuera de pantalla (-24px)
        const edgeContainerStyle: React.CSSProperties =
            edge === 'bottom'
                ? { bottom: '-26px', left: '-5%', right: '-5%', height: `${baseHeight}px` }
                : edge === 'top'
                ? { top: '-26px', left: '-5%', right: '-5%', height: `${baseHeight}px`, transform: 'rotate(180deg)', transformOrigin: 'center center' }
                : edge === 'left'
                ? { left: '-26px', top: '-5%', bottom: '-5%', width: `${baseHeight}px`, transform: 'rotate(90deg)', transformOrigin: 'left center' }
                : { right: '-26px', top: '-5%', bottom: '-5%', width: `${baseHeight}px`, transform: 'rotate(-90deg)', transformOrigin: 'right center' };

        return (
            <div className="absolute overflow-visible pointer-events-none" style={edgeContainerStyle}>
                {/* Manto Base Continuo de Fogata (Unifica las llamas sin grietas ni aislamiento) */}
                <div
                    className="absolute inset-x-0 bottom-0 h-3/5 pointer-events-none"
                    style={{
                        background: `linear-gradient(to top,
                            rgba(255, 245, 200, 0.95) 0%,
                            rgba(255, 150, 0, 0.80) 40%,
                            rgba(220, 50, 0, 0.40) 75%,
                            transparent 100%)`,
                        mixBlendMode: 'screen',
                        filter: 'blur(3px)',
                    }}
                />

                {/* Plumas de llamarada interconectadas */}
                {list.map((t, i) => {
                    const posStyle: React.CSSProperties = isVertical
                        ? {
                              top: `${t.left}%`,
                              left: 0,
                              width: `${t.height}px`,
                              height: `${t.width}px`,
                          }
                        : {
                              left: `${t.left}%`,
                              bottom: 0,
                              width: `${t.width}px`,
                              height: `${t.height}px`,
                          };

                    return (
                        <div key={`${edge}-${i}`} className="absolute" style={posStyle}>
                            {/* Cuerpo principal de llamarada ancha */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: campfireFlameBody(t.hue),
                                    borderRadius: '50% 50% 35% 35% / 75% 75% 25% 25%',
                                    transformOrigin: 'bottom center',
                                    transform: `scale3d(${t.scaleX}, 1, 1)`,
                                    animation: `flame-tongue ${t.duration}s ease-in-out ${t.delay}s infinite alternate`,
                                    mixBlendMode: 'screen',
                                    filter: 'blur(1.5px)',
                                    willChange: 'transform',
                                }}
                            />
                            {/* Núcleo Incandescente Blanco de Fogata */}
                            <div
                                className="absolute inset-x-[15%] bottom-0 top-[20%]"
                                style={{
                                    background: campfireFlameCore(t.hue),
                                    borderRadius: '50% 50% 30% 30% / 80% 80% 20% 20%',
                                    transformOrigin: 'bottom center',
                                    animation: `flame-tongue ${t.duration * 0.75}s ease-in-out ${t.delay * 0.5}s infinite alternate`,
                                    mixBlendMode: 'screen',
                                    willChange: 'transform',
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    const edgeGlow = (edge: Edge): React.CSSProperties => {
        const isVertical = edge === 'left' || edge === 'right';
        const dir =
            edge === 'bottom' ? 'to top'
            : edge === 'top' ? 'to bottom'
            : edge === 'left' ? 'to right'
            : 'to left';
        const size = 130 + tier * 40;

        return {
            position: 'absolute',
            [edge]: 0,
            ...(isVertical
                ? { top: 0, bottom: 0, width: size }
                : { left: 0, right: 0, height: size }),
            background: `linear-gradient(${dir},
                hsla(30, 100%, 60%, ${glowOpacity}) 0%,
                hsla(38, 100%, 64%, ${glowOpacity * 0.65}) 35%,
                hsla(16, 100%, 46%, ${glowOpacity * 0.25}) 70%,
                transparent 100%)`,
            mixBlendMode: 'screen',
            animation: `fire-glow-breathe ${1.3 + tier * 0.1}s ease-in-out infinite`,
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
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 0.85, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.35 }}
                                className="absolute inset-0 bg-gradient-radial from-amber-400/40 via-orange-600/25 to-transparent mix-blend-screen pointer-events-none"
                            />
                        )}
                    </AnimatePresence>

                    {/* Tinte de pantalla ardiente para combos altos (tier >= 4) */}
                    {tier >= 4 && (
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background:
                                    'radial-gradient(ellipse at 50% 120%, hsla(28,100%,50%,0.24), transparent 65%)',
                                animation: 'fire-glow-breathe 1.1s ease-in-out infinite',
                            }}
                        />
                    )}

                    {/* Viñeta cálida intensa en todos los bordes activos */}
                    <div
                        className="absolute inset-0 transition-all duration-300 pointer-events-none"
                        style={{
                            boxShadow: `inset 0 0 ${60 + tier * 35}px ${14 + tier * 10}px hsla(24, 100%, 50%, ${0.15 + tier * 0.04})`,
                        }}
                    />

                    {edges.map(edge => (
                        <div key={edge}>
                            <div style={edgeGlow(edge)} />
                            {renderEdgeFire(edge, plumes[edge])}
                        </div>
                    ))}

                    {/* Brasas ascendentes dinámicas estilo fogata con sway horizontal */}
                    {tier >= 2 &&
                        Array.from({ length: 8 + tier * 4 }).map((_, i) => {
                            const emberCount = 8 + tier * 4;
                            const r = (Math.sin(i * 91.17) * 4231.7) % 1;
                            const rr = r < 0 ? -r : r;
                            const size = 3 + rr * 6;

                            return (
                                <span
                                    key={`ember-${i}`}
                                    className="absolute bottom-0 rounded-full pointer-events-none"
                                    style={{
                                        left: `${(i / emberCount) * 100}%`,
                                        width: size,
                                        height: size,
                                        background: `hsl(${22 + rr * 28}, 100%, ${70 + rr * 25}%)`,
                                        boxShadow: '0 0 10px hsla(38,100%,70%,0.98)',
                                        // @ts-expect-error custom CSS variable
                                        '--ember-drift': `${(rr - 0.5) * 70}px`,
                                        animation: `fire-ember-rise ${1.1 + rr * 1.4}s ease-out ${rr * 1.6}s infinite`,
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
