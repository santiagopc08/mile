'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ChamferedPanelProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    accentColor?: string;
    borderColor?: string;
    notchSize?: number; // Tamaño del bisel/corte en px (default: 16)
    label?: string;      // Ej: "SYS_DATA", "RITMO_v2", "REFUGIO"
    showCornerReticles?: boolean;
    showSideTabs?: boolean;
    scanlines?: boolean;
    children: React.ReactNode;
}

/**
 * ChamferedPanel — Contenedor cibernético Mobile-First con esquinas recortadas en chaflán (45°),
 * pestañas laterales flotantes, marcadores HUD y micro-animaciones al tocar/hacer hover.
 */
export function ChamferedPanel({
    accentColor = '#ff4b89',
    borderColor,
    notchSize = 16,
    label,
    showCornerReticles = true,
    showSideTabs = true,
    scanlines = false,
    className = '',
    style,
    children,
    ...rest
}: ChamferedPanelProps) {
    const finalBorderColor = borderColor ?? `${accentColor}50`;

    // Genera el clipPath poligonal con chaflán en la esquina superior derecha e inferior izquierda
    const clipPathStyle = `polygon(
        0 0,
        calc(100% - ${notchSize}px) 0,
        100% ${notchSize}px,
        100% 100%,
        100% 100%,
        ${notchSize}px 100%,
        0 calc(100% - ${notchSize}px),
        0 0
    )`;

    return (
        <motion.div
            whileTap={{ scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`group relative overflow-hidden bg-[#0a070c]/92 backdrop-blur-xl border p-4 transition-all duration-300 ${className}`}
            style={{
                clipPath: clipPathStyle,
                borderColor: finalBorderColor,
                boxShadow: `0 0 25px ${accentColor}15, inset 0 0 15px rgba(0,0,0,0.8)`,
                ...style,
            }}
            {...rest}
        >
            {/* Superposición de Scanlines Retro */}
            {scanlines && (
                <div className="pointer-events-none absolute inset-0 z-0 opacity-20 bg-diagonal-stripes" />
            )}

            {/* Resplandor Neón de Fondo con Auto-Shimmer Móvil Periódico */}
            <div
                className="pointer-events-none absolute -inset-1 opacity-10 sm:opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-active:opacity-100 animate-mobile-auto-pulse"
                style={{
                    background: `radial-gradient(ellipse at 50% 0%, ${accentColor}20 0%, transparent 75%)`,
                }}
            />

            {/* Marcadores HUD de Esquina [ + ] */}
            {showCornerReticles && (
                <>
                    <span
                        className="pointer-events-none absolute left-2 top-1.5 font-mono text-[9px] font-bold tracking-tighter opacity-40 transition-opacity group-hover:opacity-90"
                        style={{ color: accentColor }}
                    >
                        +
                    </span>
                    <span
                        className="pointer-events-none absolute right-4 top-1.5 font-mono text-[9px] font-bold tracking-tighter opacity-40 transition-opacity group-hover:opacity-90"
                        style={{ color: accentColor }}
                    >
                        +
                    </span>
                    <span
                        className="pointer-events-none absolute bottom-1.5 left-4 font-mono text-[9px] font-bold tracking-tighter opacity-40 transition-opacity group-hover:opacity-90"
                        style={{ color: accentColor }}
                    >
                        +
                    </span>
                    <span
                        className="pointer-events-none absolute bottom-1.5 right-2 font-mono text-[9px] font-bold tracking-tighter opacity-40 transition-opacity group-hover:opacity-90"
                        style={{ color: accentColor }}
                    >
                        +
                    </span>
                </>
            )}

            {/* Etiqueta Superior HUD Limpia con Diamante Geométrico Rotativo */}
            {(label || showSideTabs) && (
                <div className="pointer-events-none mb-3 flex items-center justify-between border-b border-white/10 pb-2">
                    {label ? (
                        <div className="flex items-center gap-2">
                            <span
                                className="inline-block font-mono text-[10px] animate-spin-slow"
                                style={{ color: accentColor }}
                            >
                                ◆
                            </span>
                            <span
                                className="font-mono text-[9.5px] font-black uppercase tracking-[0.2em]"
                                style={{ color: accentColor }}
                            >
                                {label.replace(/\/\//g, '·').replace(/_/g, ' ')}
                            </span>
                        </div>
                    ) : (
                        <div />
                    )}

                    {showSideTabs && (
                        <div className="flex items-center gap-1 opacity-60">
                            <div className="h-1.5 w-4 border-b-2" style={{ borderColor: accentColor }} />
                            <div className="h-1.5 w-1.5 bg-white/30" />
                            <div className="h-1.5 w-1.5 bg-white/20" />
                        </div>
                    )}
                </div>
            )}

            {/* Borde Biselado Neón en Esquinas Cortadas */}
            <div
                className="pointer-events-none absolute right-0 top-0 h-[2px] w-6 transition-all group-hover:w-12"
                style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }}
            />
            <div
                className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-6 transition-all group-hover:w-12"
                style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }}
            />

            {/* Contenido */}
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
}
