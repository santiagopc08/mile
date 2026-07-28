'use client';

import React, { useCallback, useMemo } from 'react';
import { useHillClimbStore } from '@/stores/useHillClimbStore';
import { InputManager } from '@/game/utils/inputManager';
import { Fuel, Coins, Gauge, RotateCcw, Wind } from 'lucide-react';
import { Tachometer } from './Tachometer';
import { Pedal } from './Pedal';

interface HillClimbHUDProps {
    accentColor?: string;
}

export function HillClimbHUD({ accentColor = '#c3f400' }: HillClimbHUDProps) {
    const fuel = useHillClimbStore((s) => s.fuel);
    const distance = useHillClimbStore((s) => s.distance);
    const coins = useHillClimbStore((s) => s.coins);
    const speed = useHillClimbStore((s) => s.speed);
    const airTime = useHillClimbStore((s) => s.airTime);
    const rpm = useHillClimbStore((s) => s.rpm);
    const accelActive = useHillClimbStore((s) => s.accelActive);
    const brakeActive = useHillClimbStore((s) => s.brakeActive);
    const highScore = useHillClimbStore((s) => s.highScore);
    const gameState = useHillClimbStore((s) => s.gameState);

    const inputMgr = useMemo(() => InputManager.getInstance(), []);

    // Un solo modelo de eventos (Pointer Events) con captura: antes se mezclaban
    // touch + pointer + mouse y un dedo que salía del pedal lo dejaba pegado.
    const press = useCallback(
        (setter: (active: boolean) => void, active: boolean) =>
            (e: React.PointerEvent<HTMLButtonElement>) => {
                e.preventDefault();
                // La captura mantiene el pedal pulsado aunque el dedo se salga
                // del botón. Lanza si el pointerId ya no está activo, así que el
                // estado del control nunca depende de que funcione.
                try {
                    if (active) {
                        e.currentTarget.setPointerCapture(e.pointerId);
                    } else if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                    }
                } catch {
                    /* pointerId no activo: se ignora */
                }
                setter(active);
            },
        []
    );

    const setBrake = useCallback((v: boolean) => inputMgr.setBraking(v), [inputMgr]);
    const setAccel = useCallback((v: boolean) => inputMgr.setAccelerating(v), [inputMgr]);

    if (gameState !== 'PLAYING') return null;

    const isLowFuel = fuel < 20;
    const isCriticalFuel = fuel < 10;
    const fuelBar = isCriticalFuel
        ? 'from-red-500 to-red-400'
        : isLowFuel
            ? 'from-amber-500 to-amber-400'
            : 'from-emerald-500 to-emerald-400';

    return (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-2.5 font-mono select-none touch-none sm:p-4">
          <div className="flex flex-col gap-2">
            {/* Barra superior */}
            <div className="mx-auto flex w-full max-w-4xl items-start justify-between gap-2">
                {/* Gasolina. En móvil se oculta la palabra y queda icono + barra + %,
                    o la fila no cabe en 343px y se recorta. */}
                <div
                    className={`pointer-events-auto flex min-w-0 flex-1 max-w-[150px] items-center gap-2 rounded-2xl border bg-black/55 px-2.5 py-1.5 shadow-xl backdrop-blur-md transition-colors sm:max-w-[250px] sm:gap-3 sm:px-4 sm:py-2 ${
                        isCriticalFuel ? 'border-red-500/70' : 'border-white/15'
                    }`}
                >
                    <Fuel
                        className={`h-4 w-4 shrink-0 sm:h-6 sm:w-6 ${
                            isCriticalFuel ? 'animate-bounce text-red-400' : isLowFuel ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-white/60 sm:text-[10px]">
                            <span className="hidden sm:inline">Gasolina</span>
                            <span className={`ml-auto ${isCriticalFuel ? 'text-red-400' : 'text-white/85'}`}>
                                {Math.round(fuel)}%
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/10 sm:h-2.5">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-150 ease-out ${fuelBar} ${
                                    isCriticalFuel ? 'animate-pulse' : ''
                                }`}
                                style={{ width: `${Math.max(0, Math.min(100, fuel))}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Marcadores */}
                <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2.5">
                    <Stat
                        icon={<Gauge className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" style={{ color: accentColor }} />}
                        label="Distancia"
                        value={`${distance} m`}
                        valueColor={accentColor}
                        hint={highScore > 0 ? `Récord ${highScore}` : undefined}
                    />
                    <Stat
                        icon={<Coins className="h-4 w-4 shrink-0 text-amber-400 sm:h-5 sm:w-5" />}
                        label="Monedas"
                        value={`${coins}`}
                        valueColor="#fcd34d"
                    />

                    <button
                        type="button"
                        onClick={() => inputMgr.triggerRestart()}
                        className="rounded-2xl border border-white/20 bg-white/10 p-1.5 text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/20 active:scale-90 sm:p-2.5"
                        title="Reiniciar carrera (R)"
                        aria-label="Reiniciar carrera"
                    >
                        <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </div>
            </div>

            {/* Velocímetro y aviso de salto, justo bajo la barra superior para no
                taparle la vista al jugador en mitad de la pantalla */}
            <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-2">
                {airTime > 0.9 && (
                    <div
                        className="animate-pulse rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] shadow-lg backdrop-blur-md sm:text-sm"
                        style={{
                            color: accentColor,
                            borderColor: `${accentColor}66`,
                            backgroundColor: `${accentColor}1a`,
                        }}
                    >
                        <Wind className="mr-1.5 inline h-4 w-4" />
                        ¡Vuelo {airTime.toFixed(1)}s!
                    </div>
                )}
                <div className="rounded-full border border-white/12 bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70 backdrop-blur-md sm:text-xs">
                    {speed} km/h
                </div>
            </div>
          </div>

            {/* Salpicadero: pedal de freno · cuentavueltas · pedal de gas */}
            <div className="mx-auto flex w-full max-w-5xl items-end justify-between gap-2 px-1 pb-0.5 sm:pb-2">
                <Pedal
                    kind="brake"
                    label="Freno"
                    hint="◄ Atrás"
                    active={brakeActive}
                    onDown={press(setBrake, true)}
                    onUp={press(setBrake, false)}
                />

                <Tachometer
                    rpm={rpm}
                    accentColor={accentColor}
                    className="mb-1 h-[86px] w-[86px] shrink-0 sm:h-[116px] sm:w-[116px]"
                />

                <Pedal
                    kind="accel"
                    label="Gas"
                    hint="Acelerar ►"
                    active={accelActive}
                    onDown={press(setAccel, true)}
                    onUp={press(setAccel, false)}
                />
            </div>
        </div>
    );
}

function Stat({
    icon,
    label,
    value,
    valueColor,
    hint,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    valueColor: string;
    hint?: string;
}) {
    // En móvil sólo icono + valor; la etiqueta y el récord aparecen desde sm.
    return (
        <div className="flex items-center gap-1.5 rounded-2xl border border-white/15 bg-black/55 px-2 py-1.5 shadow-xl backdrop-blur-md sm:gap-2 sm:px-3.5 sm:py-2">
            {icon}
            <div className="flex flex-col leading-none">
                <span className="hidden text-[9px] uppercase tracking-widest text-white/45 sm:inline">{label}</span>
                <span className="text-xs font-black tracking-wide sm:text-lg" style={{ color: valueColor }}>
                    {value}
                </span>
                {hint && <span className="mt-0.5 hidden text-[8px] tracking-wider text-white/35 sm:inline">{hint}</span>}
            </div>
        </div>
    );
}
