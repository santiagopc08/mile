'use client';

import React from 'react';

interface PedalProps {
    kind: 'brake' | 'accel';
    label: string;
    hint: string;
    /** Pisado ahora mismo (táctil o teclado). Controla la inclinación. */
    active: boolean;
    onDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
    onUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
}

// Goma estriada del pisador
const RUBBER =
    'repeating-linear-gradient(180deg, #3a3a45 0px, #3a3a45 4px, #1d1d24 4px, #1d1d24 9px)';

/**
 * Pedal de coche: pisador articulado por la parte de arriba que bascula en
 * perspectiva al pisarlo. El freno es ancho y corto, el acelerador estrecho y
 * alargado, como en un coche real.
 */
export function Pedal({ kind, label, hint, active, onDown, onUp }: PedalProps) {
    const isBrake = kind === 'brake';
    const glow = isBrake ? '#f4514b' : '#3ddc84';

    const plateSize = isBrake
        ? 'h-[58px] w-[78px] sm:h-[80px] sm:w-[108px]'
        : 'h-[72px] w-[58px] sm:h-[100px] sm:w-[80px]';

    return (
        <button
            type="button"
            onPointerDown={onDown}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={label}
            aria-pressed={active}
            className="pointer-events-auto flex touch-none select-none flex-col items-center outline-none"
            style={{ perspective: '520px' }}
        >
            {/* Brazo articulado */}
            <div className="relative h-3.5 w-2.5 rounded-t-sm bg-gradient-to-b from-zinc-300 via-zinc-500 to-zinc-700 shadow-md sm:h-5 sm:w-3">
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-sm bg-white/40" />
            </div>

            {/* Pisador */}
            <div
                className={`relative overflow-hidden rounded-lg border-2 shadow-[0_10px_22px_rgba(0,0,0,0.6)] transition-transform duration-75 ease-out ${plateSize}`}
                style={{
                    background: RUBBER,
                    transformOrigin: 'top center',
                    transform: `rotateX(${active ? 47 : 26}deg)`,
                    borderColor: active ? glow : `${glow}88`,
                    boxShadow: active
                        ? `0 0 24px ${glow}99, inset 0 0 20px ${glow}55, 0 10px 22px rgba(0,0,0,0.6)`
                        : `0 0 10px ${glow}33, 0 10px 22px rgba(0,0,0,0.6)`,
                }}
            >
                {/* Bisel metálico superior */}
                <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-b from-white/45 to-transparent" />

                {/* Tinte del color del pedal: sin él los dos pisadores se leían
                    igual de grises y no se distinguía freno de acelerador */}
                <div
                    className="absolute inset-0 transition-opacity duration-75"
                    style={{ background: glow, opacity: active ? 0.46 : 0.3 }}
                />

                {/* Rótulo grabado */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-1">
                    <span
                        className="text-center text-[11px] font-black uppercase leading-none tracking-wide text-white sm:text-[15px]"
                        style={{ textShadow: '0 2px 3px rgba(0,0,0,0.9)' }}
                    >
                        {label}
                    </span>
                    <span
                        className="text-[7px] font-bold uppercase tracking-wider text-white/75 sm:text-[9px]"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
                    >
                        {hint}
                    </span>
                </div>
            </div>

            {/* Sombra proyectada en el suelo del habitáculo */}
            <div
                className="mt-1 h-1.5 rounded-full blur-[3px] transition-all duration-75"
                style={{
                    width: active ? '58%' : '74%',
                    background: 'rgba(0,0,0,0.55)',
                }}
            />
        </button>
    );
}
