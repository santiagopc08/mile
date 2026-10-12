import { useCallback } from 'react';
import { TileState } from '../../MahjongTile';
import * as MahjongAudio from '@/lib/mahjongAudio';
import { NotificationService } from '@/services/notificationService';
import {
    processIceOnMatch,
    processLockUnlock,
    applyGravityCollapse,
    triggerNewSmokeBomb,
    clearSmoke,
    HardeningMechanic
} from '../../hardeningEngine';
import { getLocalDateString } from '@/lib/mahjong/logic';

interface UseTilePointerDownProps {
    isProcessingRef: React.MutableRefObject<boolean>;
    gameLost: boolean;
    isReturningFlipped: boolean;
    dockIds: string[];
    setDockIds: React.Dispatch<React.SetStateAction<string[]>>;
    setUndoStack: React.Dispatch<React.SetStateAction<string[][]>>;
    gameMode: 'solo' | 'coop' | 'daily';
    activeCoopGame: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    MahjongService: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    coopTurn: 'el' | 'ella';
    tilesById: Map<string, TileState>;
    freeTilesMap: Map<string, boolean>;
    ghostSolidIds: Set<string>;
    setIsReturningFlipped: React.Dispatch<React.SetStateAction<boolean>>;
    timerActive: boolean;
    setTimerActive: React.Dispatch<React.SetStateAction<boolean>>;
    matchedCount: number;
    tiles: TileState[];
    dockTilesByValue: Map<string, TileState>;
    activeMechanics: HardeningMechanic[];
    setTiles: React.Dispatch<React.SetStateAction<TileState[]>>;
    matchCountSinceSmokeRef: React.MutableRefObject<number>;
    smokeTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
    setMatchedCount: React.Dispatch<React.SetStateAction<number>>;
    streakCombo: number;
    triggerStreakCombo: (combo: number) => void;
    setCoopTurn: React.Dispatch<React.SetStateAction<'el' | 'ella'>>;
    profile: string | null;
    notifySuccess: (message: string, title?: string) => void;
    eventDetailsMap: Map<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    setMemoryModalData: React.Dispatch<React.SetStateAction<any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
    notifyWarning: (message: string, title?: string) => void;
    setBottleNoteModal: React.Dispatch<React.SetStateAction<boolean>>;
    setDrawingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setRevealedDrawingData: React.Dispatch<React.SetStateAction<any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
    todayReceivedDrawing: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    setRevealDrawingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    todaySentDrawing: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    setGameLost: React.Dispatch<React.SetStateAction<boolean>>;
    setLostReason: React.Dispatch<React.SetStateAction<'dock' | 'bomb' | null>>;
    resetFireStreak: () => void;
    pendingReceivedBottle: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function useTilePointerDown({
    isProcessingRef,
    gameLost,
    isReturningFlipped,
    dockIds,
    setDockIds,
    setUndoStack,
    gameMode,
    activeCoopGame,
    MahjongService,
    coopTurn,
    tilesById,
    freeTilesMap,
    ghostSolidIds,
    setIsReturningFlipped,
    timerActive,
    setTimerActive,
    matchedCount,
    tiles,
    dockTilesByValue,
    activeMechanics,
    setTiles,
    matchCountSinceSmokeRef,
    smokeTimerRef,
    setMatchedCount,
    streakCombo,
    triggerStreakCombo,
    setCoopTurn,
    profile,
    notifySuccess,
    eventDetailsMap,
    setMemoryModalData,
    notifyWarning,
    setBottleNoteModal,
    setDrawingModalOpen,
    setRevealedDrawingData,
    todayReceivedDrawing,
    setRevealDrawingModalOpen,
    todaySentDrawing,
    setGameLost,
    setLostReason,
    resetFireStreak,
    pendingReceivedBottle
}: UseTilePointerDownProps) {
    return useCallback((id: string) => {
        if (isProcessingRef.current || gameLost || isReturningFlipped) return;
        if (dockIds.includes(id)) {
            // Devolver la ficha seleccionada del dock de vuelta al tablero
            const updatedDock = dockIds.filter(dId => dId !== id);
            setDockIds(updatedDock);
            setUndoStack(us => us.filter(move => !move.includes(id)));
            MahjongAudio.playPickup();
            if (gameMode === 'coop' && activeCoopGame) {
                MahjongService.updateCoopGame(activeCoopGame.id, tiles, updatedDock, coopTurn);
            }
            return;
        }
        const tile = tilesById.get(id);
        if (!tile || tile.isMatched || !freeTilesMap.get(id)) return;

        // Hardening click blocks
        if (tile.isLocked) return;
        if (tile.iceCounter && tile.iceCounter > 0) return;
        if (tile.isGhost && !ghostSolidIds.has(tile.id)) return;
        if (tile.isSmoked) return;

        // Fullscreen activation when a match is started / played on first tile click
        if (typeof window !== 'undefined') {
            const container = document.documentElement;
            if (container && !document.fullscreenElement) {
                if (typeof container.requestFullscreen === 'function') {
                    container.requestFullscreen().catch(() => {});
                } else if (typeof (container as any).webkitRequestFullscreen === 'function') {
                    (container as any).webkitRequestFullscreen();
                }
            }
        }

        // Memory game mechanic: if we have 2 unmatched flipped-down cards, return them to board
        // ⚡ Bolt Optimization: Replace dockIds.map().find() with a single-pass loop to avoid intermediate array allocation
        let flippedInDock = undefined;
        for (const dId of dockIds) {
            const t = tilesById.get(dId);
            if (t?.isFlippedDown && !t.isMatched) {
                flippedInDock = t;
                break;
            }
        }
        if (tile.isFlippedDown && flippedInDock && flippedInDock.content.value !== tile.content.value) {
            // Add clicked tile to the dock temporarily so player sees it
            const updatedDock = [...dockIds, id];
            setDockIds(updatedDock);
            setIsReturningFlipped(true);

            setTimeout(() => {
                setDockIds(currentDock => currentDock.filter(dId => dId !== id && dId !== flippedInDock.id));
                setIsReturningFlipped(false);
            }, 1000);
            return;
        }

        isProcessingRef.current = true;
        requestAnimationFrame(() => { isProcessingRef.current = false; });
        if (!timerActive && matchedCount < tiles.length) { setTimerActive(true); }

        // ⚡ Bolt Optimization: O(1) dock checks using pre-calculated map
        const matchingDockTile = dockTilesByValue.get(tile.content.value);
        const matchingDockId = matchingDockTile?.id;

        if (matchingDockId && matchingDockTile) {
            let processedTiles = tiles.map(t => {
                if (t.id === matchingDockTile.id || t.id === tile.id) {
                    return { ...t, isMatched: true, isSelected: false };
                }
                return t;
            });
            const updatedDock = dockIds.filter(did => did !== matchingDockId);

            // ─── Hardening match processing (solo mode) ───
            if (gameMode === 'solo') {
                // Ice: thaw adjacent tiles
                if (activeMechanics.includes('ice')) {
                    processedTiles = processIceOnMatch(processedTiles, tile, matchingDockTile);
                }
                // Padlock: unlock if key pair matched
                if (activeMechanics.includes('padlock')) {
                    processedTiles = processLockUnlock(processedTiles, tile);
                    processedTiles = processLockUnlock(processedTiles, matchingDockTile);
                }
                // Bomb: defuse if bomb tile was matched
                processedTiles = processedTiles.map(t => {
                    if ((t.id === tile.id || t.id === matchingDockTile.id) && t.isBomb) {
                        return { ...t, isBomb: false, bombTimer: undefined };
                    }
                    return t;
                });
                // Gravity: collapse unsupported tiles
                if (activeMechanics.includes('gravity')) {
                    processedTiles = applyGravityCollapse(processedTiles);
                }
                // Smoke: trigger new smoke after every 4 matches
                if (activeMechanics.includes('smoke')) {
                    matchCountSinceSmokeRef.current += 1;
                    if (matchCountSinceSmokeRef.current >= 4) {
                        matchCountSinceSmokeRef.current = 0;
                        const { tiles: smokedTiles } = triggerNewSmokeBomb(processedTiles);
                        processedTiles = smokedTiles;
                        // Clear smoke after 15 seconds
                        if (smokeTimerRef.current) clearTimeout(smokeTimerRef.current);
                        smokeTimerRef.current = setTimeout(() => {
                            setTiles(prev => clearSmoke(prev));
                        }, 15000);
                    }
                }
            }

            setUndoStack(us => [...us, [matchingDockTile.id, tile.id]]);
            setMatchedCount(mc => mc + 2);
            setDockIds(updatedDock);
            setTiles(processedTiles);

            // Fire streak combo logic
            const nextCombo = streakCombo + 1;
            triggerStreakCombo(nextCombo);

            // Sync to Coop Game in DB & Auto-Turn Pass
            if (gameMode === 'coop' && activeCoopGame) {
                const newMatchedCount = matchedCount + 2;
                const halfMatched = Math.floor(tiles.length / 2);
                if (newMatchedCount === halfMatched) {
                    const nextTurn = coopTurn === 'el' ? 'ella' : 'el';
                    setCoopTurn(nextTurn);
                    MahjongService.updateCoopGame(activeCoopGame.id, processedTiles, updatedDock, nextTurn, profile as 'el' | 'ella');

                    const target = profile === 'el' ? 'ella' : 'el';
                    const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                    NotificationService.addNotification(
                        target,
                        'mahjong_coop_turn',
                        `¡${authorName} completó la mitad del tablero! Tu turno de terminar el juego.`
                    ).catch(console.error);
                    notifySuccess(`Mitad del tablero completada (${halfMatched} fichas). El turno pasa a tu pareja.`, 'Relevo cooperativo');
                } else {
                    MahjongService.updateCoopGame(activeCoopGame.id, processedTiles, updatedDock, coopTurn, profile as 'el' | 'ella');
                }
            }

            // Si es un recuerdo de Supabase (dorado), pausar temporizador y mostrar modal
            if (tile.content.type === 'custom') {
                const eventInfo = eventDetailsMap.get(tile.content.value);
                setTimerActive(false); // Pausar temporizador
                setTimeout(() => {
                    setMemoryModalData({
                        imageUrl: tile.content.value,
                        title: eventInfo?.title || 'Recuerdo Especial',
                        description: eventInfo?.description || 'Un hermoso recuerdo de nuestra historia.',
                        date: eventInfo?.date || 'Fecha especial'
                    });
                }, 800);
            }

            // Si es un mensaje en la botella (para escribir)
            if (tile.content.type === 'bottle_message') {
                setTimerActive(false); // Pausar
                MahjongService.hasPendingSentMessage(profile as 'el' | 'ella').then((hasPending: boolean) => {
                    if (hasPending) {
                        notifyWarning('Ya tienes una botella en el océano esperando a que tu pareja la encuentre.', 'Botella pendiente');
                        if (!gameLost && matchedCount < tiles.length) {
                            setTimerActive(true);
                        }
                    } else {
                        setBottleNoteModal(true);
                    }
                }).catch(() => {
                    setBottleNoteModal(true);
                });
            }

            // Si es un dibujo especial (drawing_tile)
            if (tile.content.type === 'drawing_tile') {
                setTimerActive(false); // Pausar temporizador
                const actionType = tile.content.value; // 'draw' | 'reveal' | 'reveal_own'
                if (actionType === 'draw') {
                    setDrawingModalOpen(true);
                } else if (actionType === 'reveal') {
                    setRevealedDrawingData({
                        sender: profile === 'el' ? 'Milena' : 'Santiago',
                        image: todayReceivedDrawing?.drawing_data,
                        caption: todayReceivedDrawing?.caption || '¡Mira lo que te dibujé! 💖'
                    });
                    setRevealDrawingModalOpen(true);
                } else if (actionType === 'reveal_own') {
                    setRevealedDrawingData({
                        sender: profile === 'el' ? 'Santiago' : 'Milena',
                        image: todaySentDrawing?.drawing_data,
                        caption: todaySentDrawing?.caption || 'Tu dibujo de hoy ✨'
                    });
                    setRevealDrawingModalOpen(true);
                }
            }
        } else {
            const updatedDock = [...dockIds, id];
            if (dockIds.length >= 2) {
                setGameLost(true);
                setLostReason('dock');
                setDockIds(updatedDock);
                setUndoStack(us => [...us, [id]]);
                setTimerActive(false);
                resetFireStreak();
                MahjongAudio.playError();
                if (gameMode === 'coop' && activeCoopGame) {
                    MahjongService.updateCoopGame(activeCoopGame.id, tiles, updatedDock, coopTurn);
                } else if (gameMode === 'daily') {
                    const dateStr = getLocalDateString();
                    MahjongService.updateDailyPuzzleStatus(profile as 'el' | 'ella', dateStr, 'failed')
                        .then(() => { /* do nothing */ });
                }
            } else {
                setDockIds(updatedDock);
                setUndoStack(us => [...us, [id]]);
                MahjongAudio.playPickup();
                if (gameMode === 'coop' && activeCoopGame) {
                    MahjongService.updateCoopGame(activeCoopGame.id, tiles, updatedDock, coopTurn);
                }
            }
        }
    }, [
        isProcessingRef, gameLost, isReturningFlipped, dockIds, setDockIds, setUndoStack,
        gameMode, activeCoopGame, MahjongService, coopTurn, tilesById, freeTilesMap,
        ghostSolidIds, setIsReturningFlipped, timerActive, setTimerActive, matchedCount,
        tiles, dockTilesByValue, activeMechanics, setTiles, matchCountSinceSmokeRef,
        smokeTimerRef, setMatchedCount, streakCombo, triggerStreakCombo, setCoopTurn,
        profile, notifySuccess, eventDetailsMap, setMemoryModalData, notifyWarning,
        setBottleNoteModal, setDrawingModalOpen, setRevealedDrawingData, todayReceivedDrawing,
        setRevealDrawingModalOpen, todaySentDrawing, setGameLost, setLostReason,
        resetFireStreak
    ]);
}
