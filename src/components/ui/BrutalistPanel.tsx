'use client';

import React from 'react';
import { AnimatedBrutalistCorners } from './AnimatedBrutalistCorners';

interface BrutalistCornersProps {
    /** Color de las escuadras (default: currentColor) */
    color?: string;
    /** Tamaño en px (default: 12) */
    size?: number;
    /** Grosor en px (default: 2) */
    thickness?: number;
}

/**
 * BrutalistCorners — solo las 4 escuadras estáticas, para contenedores que ya
 * existen (p. ej. un motion.div con animación de entrada) y no pueden ser
 * reemplazados por BrutalistPanel. El padre debe ser `position: relative`.
 */
export function BrutalistCorners({ color = 'currentColor', size = 12, thickness = 2 }: BrutalistCornersProps) {
    return (
        <>
            <div className="pointer-events-none absolute left-0 top-0" style={{ width: size, height: size, borderTop: `${thickness}px solid ${color}`, borderLeft: `${thickness}px solid ${color}` }} />
            <div className="pointer-events-none absolute right-0 top-0" style={{ width: size, height: size, borderTop: `${thickness}px solid ${color}`, borderRight: `${thickness}px solid ${color}` }} />
            <div className="pointer-events-none absolute bottom-0 left-0" style={{ width: size, height: size, borderBottom: `${thickness}px solid ${color}`, borderLeft: `${thickness}px solid ${color}` }} />
            <div className="pointer-events-none absolute bottom-0 right-0" style={{ width: size, height: size, borderBottom: `${thickness}px solid ${color}`, borderRight: `${thickness}px solid ${color}` }} />
        </>
    );
}

interface BrutalistPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Color de acento para esquinas y borde (default: currentColor) */
    accentColor?: string;
    /** Color del borde si difiere del acento (p. ej. 'rgba(255,255,255,0.1)') */
    borderColor?: string;
    /** Estilo de esquinas: estáticas (4 escuadras), animadas (AnimatedBrutalistCorners) o ninguna */
    corners?: 'static' | 'animated' | 'none';
    /** Tamaño de las escuadras en px (default: 12) */
    cornerSize?: number;
    /** Grosor de las escuadras en px (default: 2) */
    cornerThickness?: number;
    /** Superponer scanlines retro-CRT sobre el fondo */
    scanlines?: boolean;
    children: React.ReactNode;
}

/**
 * BrutalistPanel — contenedor base del lenguaje "brutalista-cyber" de la app:
 * caja recta, borde fino, esquinas marcadas y fondo oscuro. Sustituye el patrón
 * copiado de 4 divs de esquina + borde que se repetía en cada modal/panel.
 *
 * Uso típico:
 *   <BrutalistPanel accentColor="#ffd700" corners="static" className="max-w-md p-6">
 *       ...contenido...
 *   </BrutalistPanel>
 */
export function BrutalistPanel({
    accentColor = 'currentColor',
    borderColor,
    corners = 'static',
    cornerSize = 12,
    cornerThickness = 2,
    scanlines = false,
    className = '',
    style,
    children,
    ...rest
}: BrutalistPanelProps) {
    return (
        <div
            className={`relative border bg-[#0a0a0a] ${className}`}
            style={{ borderColor: borderColor ?? `${accentColor}40`, ...style }}
            {...rest}
        >
            {scanlines && (
                <div className="scanlines-overlay pointer-events-none absolute inset-0 z-0 opacity-30" />
            )}

            {corners === 'static' && (
                <BrutalistCorners color={accentColor} size={cornerSize} thickness={cornerThickness} />
            )}

            {corners === 'animated' && (
                <AnimatedBrutalistCorners color={accentColor} size={cornerSize} thickness={cornerThickness} />
            )}

            {children}
        </div>
    );
}
