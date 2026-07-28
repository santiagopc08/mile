'use client';

import React from 'react';

interface TachometerProps {
    /** Régimen normalizado 0-1. */
    rpm: number;
    accentColor: string;
    className?: string;
}

const CENTER = 50;
const RADIUS = 37;
const START_ANGLE = 135;   // Abajo a la izquierda
const SWEEP = 270;         // Barrido completo hasta abajo a la derecha
const REDLINE = 0.82;

/** Punto de la esfera para una fracción t del recorrido. */
function polar(t: number, radius: number) {
    const angle = ((START_ANGLE + t * SWEEP) * Math.PI) / 180;
    return {
        x: CENTER + radius * Math.cos(angle),
        y: CENTER + radius * Math.sin(angle),
    };
}

function arcPath(from: number, to: number, radius: number) {
    const a = polar(from, radius);
    const b = polar(to, radius);
    const largeArc = (to - from) * SWEEP > 180 ? 1 : 0;
    return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

/**
 * Cuentarrevoluciones del salpicadero.
 * El régimen sube con la rueda cuando hay agarre y se dispara al patinar o en
 * el aire, así que la aguja delata el derrape antes que la propia velocidad.
 */
export function Tachometer({ rpm, accentColor, className = '' }: TachometerProps) {
    const value = Math.max(0, Math.min(1, rpm));
    const inRedline = value >= REDLINE;
    const needle = polar(value, RADIUS - 9);
    const activeColor = inRedline ? '#ff4d4d' : accentColor;

    // Marcas: largas cada 1/4, cortas cada 1/8
    const ticks = Array.from({ length: 9 }, (_, i) => i / 8);

    return (
        <div className={`relative ${className}`} aria-hidden="true">
            <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
                {/* Cuerpo de la esfera */}
                <circle cx={CENTER} cy={CENTER} r={RADIUS + 8} fill="rgba(6,4,12,0.72)" />
                <circle
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS + 8}
                    fill="none"
                    stroke="rgba(255,255,255,0.16)"
                    strokeWidth={1.5}
                />

                {/* Pista */}
                <path d={arcPath(0, 1, RADIUS)} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth={7} strokeLinecap="round" />

                {/* Zona roja */}
                <path d={arcPath(REDLINE, 1, RADIUS)} fill="none" stroke="rgba(255,70,70,0.45)" strokeWidth={7} strokeLinecap="round" />

                {/* Valor */}
                {value > 0.005 && (
                    <path
                        d={arcPath(0, value, RADIUS)}
                        fill="none"
                        stroke={activeColor}
                        strokeWidth={7}
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 5px ${activeColor})` }}
                    />
                )}

                {/* Marcas */}
                {ticks.map((t, i) => {
                    const major = i % 2 === 0;
                    const outer = polar(t, RADIUS - 6);
                    const inner = polar(t, RADIUS - (major ? 13 : 10));
                    return (
                        <line
                            key={t}
                            x1={outer.x}
                            y1={outer.y}
                            x2={inner.x}
                            y2={inner.y}
                            stroke={t >= REDLINE ? 'rgba(255,120,120,0.9)' : 'rgba(255,255,255,0.5)'}
                            strokeWidth={major ? 2 : 1.2}
                            strokeLinecap="round"
                        />
                    );
                })}

                {/* Aguja */}
                <line
                    x1={CENTER}
                    y1={CENTER}
                    x2={needle.x}
                    y2={needle.y}
                    stroke={activeColor}
                    strokeWidth={3}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 4px ${activeColor})` }}
                />
                <circle cx={CENTER} cy={CENTER} r={5} fill="#14121c" stroke={activeColor} strokeWidth={2} />

                {/* Lectura digital, sobre un fondo propio para que la aguja no
                    la cruce cuando apunta hacia abajo */}
                <rect x={CENTER - 20} y={CENTER + 12} width={40} height={22} rx={5} fill="rgba(4,3,8,0.85)" />
                <text
                    x={CENTER}
                    y={CENTER + 26}
                    textAnchor="middle"
                    fill={inRedline ? '#ff8a8a' : 'rgba(255,255,255,0.94)'}
                    style={{ font: 'bold 15px ui-monospace, monospace' }}
                >
                    {(value * 8).toFixed(1)}
                </text>
                <text
                    x={CENTER}
                    y={CENTER + 32.5}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.42)"
                    style={{ font: 'bold 5.5px ui-monospace, monospace', letterSpacing: '0.14em' }}
                >
                    RPM ×1000
                </text>
            </svg>
        </div>
    );
}
