'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CyberButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    accentColor?: string;
    notchSize?: number;
    icon?: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}

/**
 * CyberButton — Directriz Oficial de Botones Cibernéticos Biselados Mobile-First.
 * Esquinas cortadas en chaflán a 45°, respuesta táctil spring, resplandor neón e icono.
 */
export function CyberButton({
    variant = 'primary',
    size = 'md',
    accentColor = '#ff4b89',
    notchSize = 10,
    icon: Icon,
    className = '',
    style,
    children,
    disabled,
    ...rest
}: CyberButtonProps) {
    // clipPath de chaflán a 45° en esquina superior derecha e inferior izquierda
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

    const sizeClasses =
        size === 'xs'
            ? 'px-2.5 py-1 text-[8.5px]'
            : size === 'sm'
            ? 'px-3 py-1.5 text-[9.5px]'
            : size === 'lg'
            ? 'px-6 py-3 text-xs sm:text-sm'
            : 'px-4 py-2 text-[10.5px]';

    // El clip-path recorta la box-shadow, así que la flotación y el halo neón
    // van por `filter: drop-shadow`, que sí sigue la forma biselada. Un tono
    // oscuro para el despegue del fondo + (en primary/danger) un halo de color.
    const variantStyles: Record<string, React.CSSProperties> = {
        primary: {
            backgroundColor: `${accentColor}28`,
            borderColor: accentColor,
            color: '#ffffff',
            filter: `drop-shadow(0 8px 16px rgba(0,0,0,0.5)) drop-shadow(0 0 12px ${accentColor}55)`,
        },
        secondary: {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.45))',
        },
        outline: {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderColor: `${accentColor}aa`,
            color: accentColor,
            filter: `drop-shadow(0 6px 12px rgba(0,0,0,0.4)) drop-shadow(0 0 8px ${accentColor}30)`,
        },
        danger: {
            backgroundColor: 'rgba(239, 68, 68, 0.18)',
            borderColor: '#ef4444',
            color: '#fca5a5',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5)) drop-shadow(0 0 12px rgba(239,68,68,0.5))',
        },
        ghost: {
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            color: '#e5e2e1',
        },
    };

    return (
        <motion.button
            whileHover={disabled ? undefined : { y: -2 }}
            whileTap={disabled ? undefined : { scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            disabled={disabled}
            className={`group relative inline-flex items-center justify-center gap-2 font-mono font-black uppercase tracking-[0.16em] border backdrop-blur-md backdrop-saturate-150 transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none select-none ${sizeClasses} ${className}`}
            style={{
                clipPath: clipPathStyle,
                ...variantStyles[variant],
                ...style,
            }}
            {...rest}
        >
            {/* Resplandor neón interno al tocar/hover */}
            <span
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100"
                style={{
                    background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`,
                }}
            />

            {/* Icono de acompañamiento */}
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110" />}

            {/* Texto limpio en Mayúsculas */}
            <span className="relative z-10 truncate">
                {typeof children === 'string'
                    ? children.replace(/\/\//g, '·').replace(/_/g, ' ')
                    : children}
            </span>
        </motion.button>
    );
}
