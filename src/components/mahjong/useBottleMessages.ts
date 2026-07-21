'use client';

import { useState, useRef, useCallback } from 'react';
import { MahjongService } from '@/services/mahjongService';

/**
 * useBottleMessages — encapsula el estado y la carga de los "mensajes en la botella"
 * (escribir una nota para la pareja y revelar la que ella dejó). Devuelve también
 * los setters, ya que el flujo se dispara desde eventos del juego (emparejar una
 * ficha de botella) y desde el render (botón en el HUD y modales de revelado).
 */
export function useBottleMessages(profile: 'el' | 'ella' | null) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasPausedForMessage, setHasPausedForMessage] = useState(false);
    const [bottleNoteText, setBottleNoteText] = useState('');
    const [bottleNoteModal, setBottleNoteModal] = useState(false);
    const [revealedBottleMessage, setRevealedBottleMessage] = useState<{ id: string; text: string; sender: string } | null>(null);
    const [showMessageText, setShowMessageText] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [pendingReceivedBottle, setPendingReceivedBottle] = useState<any | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [todayRevealedBottle, setTodayRevealedBottle] = useState<any | null>(null);

    const refreshBottleMessages = useCallback(async () => {
        if (!profile) return;
        // Mensaje revelado hoy (botella ya abierta)
        const todayMsg = await MahjongService.getTodayRevealedBottleMessage(profile);
        setTodayRevealedBottle(todayMsg);
        // Botella pendiente de abrir
        const pendingMsg = await MahjongService.getPendingBottleMessage(profile);
        setPendingReceivedBottle(pendingMsg);
    }, [profile]);

    return {
        videoRef,
        hasPausedForMessage,
        setHasPausedForMessage,
        bottleNoteText,
        setBottleNoteText,
        bottleNoteModal,
        setBottleNoteModal,
        revealedBottleMessage,
        setRevealedBottleMessage,
        showMessageText,
        setShowMessageText,
        pendingReceivedBottle,
        setPendingReceivedBottle,
        todayRevealedBottle,
        setTodayRevealedBottle,
        refreshBottleMessages,
    };
}
