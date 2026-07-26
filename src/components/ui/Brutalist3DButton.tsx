'use client';

import React from 'react';

interface Brutalist3DButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Color de la capa de sombra/extrusión (default: currentColor) */
    shadowColor?: string;
    /** Desplazamiento de la extrusión en px (default: 2) */
    offset?: number;
    /** Clases extra para la cara frontal (padding, tipografía, etc.) */
    faceClassName?: string;
    children: React.ReactNode;
}

/**
 * Brutalist3DButton — botón con extrusión desplazada del lenguaje de la app:
 * una capa de color detrás y la cara frontal que se hunde al pulsar.
 * Sustituye el patrón copiado de sombra `translate-x-[2px]` + cara `group-hover`.
 *
 * Uso típico:
 *   <Brutalist3DButton shadowColor={accentColor} onClick={...} title="Pista">
 *       <Lightbulb className="h-3.5 w-3.5" />
 *       <span className="hidden sm:inline">Pista</span>
 *   </Brutalist3DButton>
 */
export function Brutalist3DButton({
    shadowColor = 'currentColor',
    offset = 2,
    faceClassName = 'px-2.5 py-1 text-[9px]',
    className = '',
    children,
    ...rest
}: Brutalist3DButtonProps) {
    return (
        <button
            className={`relative group select-none disabled:opacity-30 disabled:pointer-events-none ${className}`}
            {...rest}
        >
            {/* Capa de extrusión */}
            <div
                className="absolute inset-0 border border-black transition-transform duration-200"
                style={{ backgroundColor: shadowColor, transform: `translate(${offset}px, ${offset}px)` }}
            />
            {/* Cara frontal: se eleva al hover y se hunde al pulsar */}
            <div
                className={`relative flex items-center gap-1 border border-white/30 bg-[#0c0c0e] font-bold uppercase tracking-wider text-white transition-transform duration-200 group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] group-active:translate-x-[1px] group-active:translate-y-[1px] ${faceClassName}`}
            >
                {children}
            </div>
        </button>
    );
}
