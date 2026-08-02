'use client';

/**
 * Kit decorativo — el lenguaje lineal y geométrico del moodboard, destilado
 * en piezas pequeñas y reutilizables.
 *
 * Reglas comunes a todas:
 *  · `aria-hidden` y `pointer-events-none`: son adorno, no contenido ni tacto.
 *  · Color por `currentColor` salvo que se pase otro: heredan el acento del
 *    contenedor sin cablear el perfil pieza por pieza.
 *  · Los trazos entran dibujándose (`.deco-draw`) al asomar en pantalla, vía
 *    el observer compartido de `useInView`. Sin scroll listeners.
 *
 * Criterio de uso: una o dos por pantalla, en los márgenes. Nunca compitiendo
 * con el contenido — si tapan lo que se lee, sobran.
 */

import React from 'react';
import { useInView } from '@/lib/useInView';

/* Anchura de trazo fina y homogénea en el kit completo */
const STROKE = 1;

type DivProps = React.HTMLAttributes<HTMLDivElement>;

function cx(...parts: (string | false | undefined)[]) {
    return parts.filter(Boolean).join(' ');
}

/**
 * Redondea una coordenada a 3 decimales.
 *
 * `Math.cos`/`Math.sin` pueden diferir en el último dígito entre el runtime de
 * Node (SSR) y el del navegador; React serializa esos floats tal cual y el
 * atributo SVG no coincide byte a byte, disparando un error de hidratación.
 * A 3 decimales el resultado es idéntico en ambos lados y sub-píxel: no cambia
 * nada visible.
 */
const r3 = (n: number) => Math.round(n * 1000) / 1000;

/* ───────────────────────────────────────────────────────────────────────────
   DecoRule — regla horizontal discontinua con remates en tick y micro-etiqueta.
   El separador ⟨├───────┤⟩ del moodboard. Reemplaza los `<hr>` con degradado.
   ─────────────────────────────────────────────────────────────────────────── */

interface DecoRuleProps extends DivProps {
    label?: string;
    color?: string;
}

export function DecoRule({ label, color = 'currentColor', className, ...rest }: DecoRuleProps) {
    const { ref, inView } = useInView<HTMLDivElement>({ once: true });

    return (
        <div
            ref={ref}
            aria-hidden="true"
            className={cx('pointer-events-none flex items-center gap-3 select-none', className)}
            style={{ color }}
            {...rest}
        >
            <svg height="10" className="flex-1 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 10">
                <line x1="0" y1="5" x2="0" y2="10" stroke="currentColor" strokeWidth={STROKE} opacity="0.7" />
                <line
                    x1="0"
                    y1="8"
                    x2="100"
                    y2="8"
                    stroke="currentColor"
                    strokeWidth={STROKE}
                    strokeDasharray="2 3"
                    pathLength={1}
                    className={cx('deco-draw', inView && 'is-revealed')}
                    vectorEffect="non-scaling-stroke"
                    opacity="0.55"
                />
                <line x1="100" y1="5" x2="100" y2="10" stroke="currentColor" strokeWidth={STROKE} opacity="0.7" />
            </svg>
            {label && (
                <span className="font-mono text-[8px] uppercase tracking-[0.35em] opacity-60 whitespace-nowrap">
                    {label}
                </span>
            )}
            <svg height="10" width="18" className="overflow-visible">
                <line x1="0" y1="8" x2="18" y2="8" stroke="currentColor" strokeWidth={STROKE} strokeDasharray="2 3" opacity="0.55" />
                <line x1="18" y1="5" x2="18" y2="10" stroke="currentColor" strokeWidth={STROKE} opacity="0.7" />
            </svg>
        </div>
    );
}

/* ───────────────────────────────────────────────────────────────────────────
   CornerBrackets — corchetes ⌐ ¬ que se dibujan en las 4 esquinas del padre.
   Envuelve cualquier contenedor `relative`. El HUD táctico del moodboard.
   ─────────────────────────────────────────────────────────────────────────── */

interface CornerBracketsProps {
    color?: string;
    /** Longitud del brazo del corchete en px. */
    size?: number;
    inset?: number;
    className?: string;
}

export function CornerBrackets({ color = 'currentColor', size = 14, inset = 6, className }: CornerBracketsProps) {
    const { ref, inView } = useInView<HTMLDivElement>({ once: true });
    const corners = [
        { key: 'tl', d: `M0 ${size} L0 0 L${size} 0`, pos: { top: inset, left: inset } },
        { key: 'tr', d: `M0 0 L${size} 0 L${size} ${size}`, pos: { top: inset, right: inset } },
        { key: 'bl', d: `M0 0 L0 ${size} L${size} ${size}`, pos: { bottom: inset, left: inset } },
        { key: 'br', d: `M${size} 0 L${size} ${size} L0 ${size}`, pos: { bottom: inset, right: inset } },
    ] as const;

    return (
        <div ref={ref} aria-hidden="true" className={cx('pointer-events-none absolute inset-0 select-none', className)} style={{ color }}>
            {corners.map((c, i) => (
                <svg
                    key={c.key}
                    width={size}
                    height={size}
                    className="absolute overflow-visible"
                    style={c.pos as React.CSSProperties}
                >
                    <path
                        d={c.d}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        pathLength={1}
                        className={cx('deco-draw', inView && 'is-revealed')}
                        style={{ '--i': i } as React.CSSProperties}
                    />
                </svg>
            ))}
        </div>
    );
}

/* ───────────────────────────────────────────────────────────────────────────
   TickScale — regla de medición con marcas mayores/menores. Márgenes de sección.
   ─────────────────────────────────────────────────────────────────────────── */

interface TickScaleProps extends DivProps {
    orientation?: 'horizontal' | 'vertical';
    ticks?: number;
    length?: number;
    color?: string;
}

export function TickScale({
    orientation = 'horizontal',
    ticks = 24,
    length = 200,
    color = 'currentColor',
    className,
    ...rest
}: TickScaleProps) {
    const { ref, inView } = useInView<HTMLDivElement>({ once: true });
    const vertical = orientation === 'vertical';
    const step = length / ticks;
    const cross = 10; // grosor de la banda

    const w = vertical ? cross : length;
    const h = vertical ? length : cross;

    return (
        <div ref={ref} aria-hidden="true" className={cx('pointer-events-none select-none', className)} style={{ color }} {...rest}>
            <svg width={w} height={h} className="overflow-visible opacity-50">
                {Array.from({ length: ticks + 1 }, (_, i) => {
                    const major = i % 5 === 0;
                    const pos = i * step;
                    const len = major ? cross : cross * 0.5;
                    const x1 = vertical ? 0 : pos;
                    const y1 = vertical ? pos : 0;
                    const x2 = vertical ? len : pos;
                    const y2 = vertical ? pos : len;
                    return (
                        <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="currentColor"
                            strokeWidth={STROKE}
                            pathLength={1}
                            className={cx('deco-draw', inView && 'is-revealed')}
                            style={{ '--i': i, '--dur-draw': '380ms' } as React.CSSProperties}
                            opacity={major ? 0.9 : 0.45}
                        />
                    );
                })}
            </svg>
        </div>
    );
}

/* ───────────────────────────────────────────────────────────────────────────
   RadialBurst — abanico de líneas radiales. Referencia "Unlocking Potential".
   ─────────────────────────────────────────────────────────────────────────── */

interface RadialBurstProps extends DivProps {
    rays?: number;
    size?: number;
    color?: string;
}

export function RadialBurst({ rays = 40, size = 120, color = 'currentColor', className, ...rest }: RadialBurstProps) {
    const { ref, inView } = useInView<HTMLDivElement>({ once: true });
    const c = size / 2;

    return (
        <div ref={ref} aria-hidden="true" className={cx('pointer-events-none select-none', className)} style={{ color }} {...rest}>
            <svg width={size} height={size} className="overflow-visible opacity-45">
                {Array.from({ length: rays }, (_, i) => {
                    const angle = (i / rays) * Math.PI * 2;
                    // Longitud alterna: da la textura de "código de barras radial"
                    const rInner = c * 0.25;
                    const rOuter = c * (i % 2 === 0 ? 0.95 : 0.7);
                    return (
                        <line
                            key={i}
                            x1={r3(c + Math.cos(angle) * rInner)}
                            y1={r3(c + Math.sin(angle) * rInner)}
                            x2={r3(c + Math.cos(angle) * rOuter)}
                            y2={r3(c + Math.sin(angle) * rOuter)}
                            stroke="currentColor"
                            strokeWidth={STROKE}
                            pathLength={1}
                            className={cx('deco-draw', inView && 'is-revealed')}
                            style={{ '--i': i * 0.4, '--dur-draw': '500ms' } as React.CSSProperties}
                        />
                    );
                })}
            </svg>
        </div>
    );
}

/* ───────────────────────────────────────────────────────────────────────────
   ContourLines — curvas topográficas. Referencia "Std. LOREM". Detrás de secciones.
   ─────────────────────────────────────────────────────────────────────────── */

interface ContourLinesProps extends DivProps {
    lines?: number;
    width?: number;
    height?: number;
    color?: string;
}

export function ContourLines({ lines = 6, width = 300, height = 160, color = 'currentColor', className, ...rest }: ContourLinesProps) {
    const { ref, inView } = useInView<HTMLDivElement>({ once: true });

    return (
        <div ref={ref} aria-hidden="true" className={cx('pointer-events-none select-none', className)} style={{ color }} {...rest}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible opacity-30" fill="none">
                {Array.from({ length: lines }, (_, i) => {
                    const y = (height / (lines + 1)) * (i + 1);
                    const amp = 14 + i * 4;
                    const d = `M0 ${y} C ${width * 0.25} ${y - amp}, ${width * 0.4} ${y + amp}, ${width * 0.55} ${y} S ${width * 0.85} ${y - amp}, ${width} ${y}`;
                    return (
                        <path
                            key={i}
                            d={d}
                            stroke="currentColor"
                            strokeWidth={STROKE}
                            pathLength={1}
                            className={cx('deco-draw', inView && 'is-revealed')}
                            style={{ '--i': i, '--dur-draw': '1100ms' } as React.CSSProperties}
                            opacity={0.4 + (i / lines) * 0.4}
                        />
                    );
                })}
            </svg>
        </div>
    );
}

/* ───────────────────────────────────────────────────────────────────────────
   DataStrip — franja tipo código de barras con anchos deterministas.
   Determinista a propósito: `Math.random()` en render rompe la hidratación SSR.
   ─────────────────────────────────────────────────────────────────────────── */

interface DataStripProps extends DivProps {
    bars?: number;
    height?: number;
    color?: string;
    seed?: number;
}

export function DataStrip({ bars = 32, height = 24, color = 'currentColor', seed = 7, className, ...rest }: DataStripProps) {
    const { ref, inView } = useInView<HTMLDivElement>({ once: true });

    // PRNG mínimo con semilla: mismo patrón en servidor y cliente.
    const rand = (n: number) => {
        const x = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
        return x - Math.floor(x);
    };

    return (
        <div
            ref={ref}
            aria-hidden="true"
            className={cx('pointer-events-none flex items-end gap-[2px] select-none', className)}
            style={{ color, height }}
            {...rest}
        >
            {Array.from({ length: bars }, (_, i) => {
                const r = rand(i);
                return (
                    <span
                        key={i}
                        className={cx('block bg-current deco-fade', inView && 'is-revealed')}
                        style={
                            {
                                width: r > 0.72 ? 3 : 1.5,
                                height: `${30 + r * 70}%`,
                                opacity: 0.25 + r * 0.5,
                                '--deco-opacity': 0.25 + r * 0.5,
                                '--i': i * 0.3,
                            } as React.CSSProperties
                        }
                    />
                );
            })}
        </div>
    );
}

/* ───────────────────────────────────────────────────────────────────────────
   MicroLabel — SYS_DATA · 07 · OK. Metadato mono minúsculo.
   ─────────────────────────────────────────────────────────────────────────── */

interface MicroLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
    parts: (string | number)[];
    color?: string;
}

export function MicroLabel({ parts, color = 'currentColor', className, ...rest }: MicroLabelProps) {
    return (
        <span
            aria-hidden="true"
            className={cx('pointer-events-none font-mono text-[8px] uppercase tracking-[0.3em] opacity-40 select-none', className)}
            style={{ color }}
            {...rest}
        >
            {parts.join(' · ')}
        </span>
    );
}

/* ───────────────────────────────────────────────────────────────────────────
   WireSolid — poliedro isométrico en wireframe con giro lento CSS 3D.
   ─────────────────────────────────────────────────────────────────────────── */

interface WireSolidProps extends DivProps {
    size?: number;
    color?: string;
}

export function WireSolid({ size = 90, color = 'currentColor', className, ...rest }: WireSolidProps) {
    const { ref, inView } = useInView<HTMLDivElement>({ once: true });

    // Cubo isométrico: cara frontal, cara trasera desplazada, aristas de unión.
    const o = size * 0.22; // profundidad
    const s = size * 0.55; // lado de cara
    const x0 = size * 0.12;
    const y0 = size * 0.28;

    const front = [
        [x0, y0],
        [x0 + s, y0],
        [x0 + s, y0 + s],
        [x0, y0 + s],
    ];
    const back = front.map(([x, y]) => [x + o, y - o]);

    return (
        <div ref={ref} aria-hidden="true" className={cx('pointer-events-none select-none', className)} style={{ color }} {...rest}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" className="overflow-visible opacity-40 animate-spin-slow" style={{ animationDuration: '48s' }}>
                <polygon points={front.map((p) => p.join(',')).join(' ')} stroke="currentColor" strokeWidth={STROKE} pathLength={1} className={cx('deco-draw', inView && 'is-revealed')} style={{ '--i': 0 } as React.CSSProperties} />
                <polygon points={back.map((p) => p.join(',')).join(' ')} stroke="currentColor" strokeWidth={STROKE} pathLength={1} className={cx('deco-draw', inView && 'is-revealed')} style={{ '--i': 1, opacity: 0.5 } as React.CSSProperties} />
                {front.map((p, i) => (
                    <line key={i} x1={p[0]} y1={p[1]} x2={back[i][0]} y2={back[i][1]} stroke="currentColor" strokeWidth={STROKE} pathLength={1} className={cx('deco-draw', inView && 'is-revealed')} style={{ '--i': 2 + i * 0.2, opacity: 0.4 } as React.CSSProperties} />
                ))}
            </svg>
        </div>
    );
}
