'use client';

import { useState, useCallback } from 'react';
import { MahjongService } from '@/services/mahjongService';

/**
 * useDrawings — encapsula el estado y la carga de los "dibujos de amor" diarios
 * (el que tú enviaste y el que te dejó tu pareja) más los modales de dibujar y
 * revelar. Los valores `todaySent/ReceivedDrawing` los lee el componente al
 * inicializar el tablero para decidir si inyecta fichas de dibujo, y los modales
 * se disparan al emparejar una ficha de dibujo, por eso se exponen los setters.
 */
export function useDrawings(profile: 'el' | 'ella' | null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [todaySentDrawing, setTodaySentDrawing] = useState<any | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [todayReceivedDrawing, setTodayReceivedDrawing] = useState<any | null>(null);
    const [drawingModalOpen, setDrawingModalOpen] = useState(false);
    const [revealDrawingModalOpen, setRevealDrawingModalOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [revealedDrawingData, setRevealedDrawingData] = useState<any | null>(null);

    const refreshDrawings = useCallback(async () => {
        if (!profile) return;
        const sentDrawing = await MahjongService.getTodayDrawing(profile);
        setTodaySentDrawing(sentDrawing);

        const partnerKey = profile === 'el' ? 'ella' : 'el';
        const receivedDrawing = await MahjongService.getTodayDrawing(partnerKey);
        setTodayReceivedDrawing(receivedDrawing);
    }, [profile]);

    return {
        todaySentDrawing,
        todayReceivedDrawing,
        drawingModalOpen,
        setDrawingModalOpen,
        revealDrawingModalOpen,
        setRevealDrawingModalOpen,
        revealedDrawingData,
        setRevealedDrawingData,
        refreshDrawings,
    };
}
