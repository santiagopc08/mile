'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { GameLoop } from '@/game/systems/gameLoop';
import { HillClimbHUD } from './HillClimbHUD';
import { HillClimbMenu } from './HillClimbMenu';
import { useHillClimbStore } from '@/stores/useHillClimbStore';

interface HillClimbCanvasProps {
    /** Color de acento del perfil activo, en hex. Pinta el buggy y los carteles. */
    accentColor?: string;
}

/** Resuelve una variable CSS a un hex utilizable por el canvas. */
function resolveCssColor(value: string, fallback: string): string {
    const match = value.match(/var\((--[\w-]+)\)/);
    if (!match || typeof window === 'undefined') return value || fallback;
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
    return resolved || fallback;
}

export function HillClimbCanvas({ accentColor = '#c3f400' }: HillClimbCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const shellRef = useRef<HTMLDivElement | null>(null);
    const gameLoopRef = useRef<GameLoop | null>(null);
    const loadRecords = useHillClimbStore((s) => s.loadRecords);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const shell = shellRef.current;
        if (!canvas || !shell) return;

        const gameLoop = new GameLoop();
        gameLoopRef.current = gameLoop;
        gameLoop.setAccentColor(resolveCssColor(accentColor, '#c3f400'));
        gameLoop.attachCanvas(canvas);

        // Tamaño real del contenedor + densidad de pantalla: sin esto el búfer se
        // quedaba en 1280×720 y el navegador estiraba la imagen (borrosa en móvil).
        const applySize = () => {
            const rect = shell.getBoundingClientRect();
            if (rect.width < 2 || rect.height < 2) return;
            gameLoop.resize(rect.width, rect.height, window.devicePixelRatio || 1);
        };

        applySize();

        const observer = new ResizeObserver(applySize);
        observer.observe(shell);
        window.addEventListener('orientationchange', applySize);

        // Pausa al ocultar la pestaña: al volver, el bucle reanuda sin saltos
        const handleVisibility = () => {
            if (document.hidden) gameLoop.pause();
            else gameLoop.resume();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            observer.disconnect();
            window.removeEventListener('orientationchange', applySize);
            document.removeEventListener('visibilitychange', handleVisibility);
            gameLoop.destroy();
            gameLoopRef.current = null;
        };
    }, [accentColor]);

    const handleStartGame = useCallback(() => {
        gameLoopRef.current?.start();
    }, []);

    return (
        /* Altura acotada para que el lienzo no acabe siendo más alto que ancho:
           en un lienzo vertical apenas se ve terreno por delante y la pantalla
           se llena de tierra. El mínimo deja sitio al menú y a los pedales. */
        <div
            ref={shellRef}
            className="relative h-[52vh] max-h-[620px] min-h-[360px] w-full overflow-hidden rounded-3xl border border-white/15 bg-[#170a2b] shadow-[0_24px_70px_rgba(0,0,0,0.6)] touch-none select-none sm:h-[62vh]"
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full block touch-none select-none"
            />

            <HillClimbHUD accentColor={accentColor} />
            <HillClimbMenu onStartGame={handleStartGame} accentColor={accentColor} />
        </div>
    );
}
