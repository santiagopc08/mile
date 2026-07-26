'use client';

import { useState, useCallback } from 'react';
import { MahjongService } from '@/services/mahjongService';
import { getLocalDateString } from '@/lib/mahjong/logic';

interface DailyHistoric {
    completed: number;
    failed: number;
    bestTime: number | null;
}

/**
 * useDailyStats — encapsula el estado y la carga del marcador del Desafío Diario
 * (registro de la jugada de hoy, resultados de la pareja e historial acumulado).
 * Es el subconjunto de "connection features" con menos acoplamiento al bucle de
 * juego: solo lo consume la pantalla de scoreboard diario.
 */
export function useDailyStats(profile: 'el' | 'ella' | null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [dailyPlayRecord, setDailyPlayRecord] = useState<any | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [dailyStats, setDailyStats] = useState<{ el: any | null; ella: any | null }>({ el: null, ella: null });
    const [historicDailyStats, setHistoricDailyStats] = useState<{
        el: DailyHistoric;
        ella: DailyHistoric;
    }>({
        el: { completed: 0, failed: 0, bestTime: null },
        ella: { completed: 0, failed: 0, bestTime: null }
    });

    const refreshDailyStats = useCallback(async () => {
        if (!profile) return;
        const dateStr = getLocalDateString();
        const play = await MahjongService.getDailyPuzzlePlay(profile, dateStr);

        if (play && play.status === 'started') {
            // "started" significa que abortaron o recargaron: marcar "failed" (regla de un solo intento)
            await MahjongService.updateDailyPuzzleStatus(profile, dateStr, 'failed');
            setDailyPlayRecord({ ...play, status: 'failed' });
        } else {
            setDailyPlayRecord(play);
        }

        const stats = await MahjongService.getDailyPuzzleStats(dateStr);
        setDailyStats(stats);

        const historic = await MahjongService.getDailyPuzzleHistoricCounts();
        setHistoricDailyStats(historic);
    }, [profile]);

    return {
        dailyPlayRecord,
        setDailyPlayRecord,
        dailyStats,
        historicDailyStats,
        refreshDailyStats,
    };
}
