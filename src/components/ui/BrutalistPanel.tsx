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
    // Retirado por refinamiento estético: evita sobrecarga de escuadras en contenedores grandes
    return null;
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
 * BrutalistPanel — contenedor base con bordes limpios y chamfered aesthetic.
 */
export function BrutalistPanel({
    accentColor = 'currentColor',
    borderColor,
    corners = 'none',
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
            className={`group relative border bg-[#0a070c]/95 backdrop-blur-xl transition-all duration-300 ${className}`}
            style={{ borderColor: borderColor ?? `${accentColor}35`, ...style }}
            {...rest}
        >
            {scanlines && (
                <div className="scanlines-overlay pointer-events-none absolute inset-0 z-0 opacity-20 bg-diagonal-stripes" />
            )}

            {children}
        </div>
    );
}
