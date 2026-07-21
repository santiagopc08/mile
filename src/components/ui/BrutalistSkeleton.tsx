'use client';

import React from 'react';

interface BrutalistSkeletonProps {
    /** Color de acento de las esquinas y el barrido (default: rgba blanca tenue) */
    accentColor?: string;
    /** Etiqueta de estado tipo terminal (default: "Cargando") */
    label?: string;
    /** Clases del contenedor (altura, ancho...) */
    className?: string;
}

/**
 * BrutalistSkeleton — estado de carga temático del lenguaje de la app:
 * caja recta con esquinas marcadas, scanlines y un barrido de luz horizontal,
 * en lugar de un spinner genérico.
 */
export function BrutalistSkeleton({
    accentColor = '#a88a7e',
    label = 'Cargando',
    className = 'h-[400px] w-full',
}: BrutalistSkeletonProps) {
    return (
        <div
            className={`relative overflow-hidden border border-white/10 bg-black/40 ${className}`}
            role="status"
            aria-label={label}
        >
            {/* Esquinas */}
            <div className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2" style={{ borderColor: accentColor }} />
            <div className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2" style={{ borderColor: accentColor }} />
            <div className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2" style={{ borderColor: accentColor }} />
            <div className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2" style={{ borderColor: accentColor }} />

            {/* Scanlines retro-CRT */}
            <div className="scanlines-overlay pointer-events-none absolute inset-0 opacity-25" />

            {/* Barrido de luz */}
            <div
                className="pointer-events-none absolute inset-y-0 w-1/3 animate-skeleton-sweep"
                style={{ background: `linear-gradient(90deg, transparent, ${accentColor}22, transparent)` }}
            />

            {/* Etiqueta terminal parpadeante */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="animate-pulse font-mono text-xs font-bold uppercase tracking-[0.3em]" style={{ color: accentColor }}>
                    {label}<span className="animate-pulse">_</span>
                </span>
            </div>
        </div>
    );
}
