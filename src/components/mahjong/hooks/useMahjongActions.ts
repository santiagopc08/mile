import { useCallback } from 'react';
import { TileState } from '../../MahjongTile';

interface UseMahjongActionsProps {
    dockIds: string[];
    setDockIds: React.Dispatch<React.SetStateAction<string[]>>;
    tiles: TileState[];
    setTiles: React.Dispatch<React.SetStateAction<TileState[]>>;
    undoStack: string[][];
    setUndoStack: React.Dispatch<React.SetStateAction<string[][]>>;
    setMatchedCount: React.Dispatch<React.SetStateAction<number>>;
    setTimerActive: React.Dispatch<React.SetStateAction<boolean>>;
    setGameLost: React.Dispatch<React.SetStateAction<boolean>>;
    setLostReason: React.Dispatch<React.SetStateAction<'dock' | 'bomb' | null>>;
    freeTilesMap: Map<string, boolean>;
    tilesById: Map<string, TileState>;
    timerRef: React.RefObject<{ resetTime: () => void } | null>;
    resetFireStreak: () => void;
    initialDeal: TileState[] | null;
    ghostElapsedRef: React.MutableRefObject<number>;
    setGhostSolidIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    matchCountSinceSmokeRef: React.MutableRefObject<number>;
    bombTickRef: React.MutableRefObject<NodeJS.Timeout | null>;
    ghostTickRef: React.MutableRefObject<NodeJS.Timeout | null>;
    smokeTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
    setMaxGameCombo: React.Dispatch<React.SetStateAction<number>>;
    setIsReturningFlipped: React.Dispatch<React.SetStateAction<boolean>>;
    setScoreSaved: React.Dispatch<React.SetStateAction<boolean>>;
    setIsNewRecord: React.Dispatch<React.SetStateAction<boolean>>;
    gameMode: 'solo' | 'coop' | 'daily';
    activeCoopGame: Record<string, unknown> | null;
    coopTurn: 'el' | 'ella';
    MahjongService: Record<string, unknown>;
}

export function useMahjongActions({
    dockIds,
    setDockIds,
    tiles,
    setTiles,
    undoStack,
    setUndoStack,
    setMatchedCount,
    setTimerActive,
    setGameLost,
    setLostReason,
    freeTilesMap,
    tilesById,
    timerRef,
    resetFireStreak,
    initialDeal,
    ghostElapsedRef,
    setGhostSolidIds,
    matchCountSinceSmokeRef,
    bombTickRef,
    ghostTickRef,
    smokeTimerRef,
    setMaxGameCombo,
    setIsReturningFlipped,
    setScoreSaved,
    setIsNewRecord,
    gameMode,
    activeCoopGame,
    coopTurn,
    MahjongService
}: UseMahjongActionsProps) {

    const handleRestart = useCallback(() => {
        if (initialDeal) {
            setTiles([...initialDeal]);
            setMatchedCount(0);
            setUndoStack([]);
            setDockIds([]);
            resetFireStreak();

            // Reset hardening timers
            ghostElapsedRef.current = 0;
            setGhostSolidIds(new Set());
            matchCountSinceSmokeRef.current = 0;
            if (bombTickRef.current) clearInterval(bombTickRef.current);
            if (ghostTickRef.current) clearInterval(ghostTickRef.current);
            if (smokeTimerRef.current) clearTimeout(smokeTimerRef.current);

            setMaxGameCombo(0);
            setGameLost(false);
            setLostReason(null);
            setIsReturningFlipped(false);
            setTimerActive(false);
            timerRef.current?.resetTime();
            setScoreSaved(false);
            setIsNewRecord(false);

            if (gameMode === 'coop' && activeCoopGame) {
                MahjongService.updateCoopGame(activeCoopGame.id, initialDeal, [], coopTurn);
            }
        }
    }, [initialDeal, setTiles, setMatchedCount, setUndoStack, setDockIds, resetFireStreak, ghostElapsedRef, setGhostSolidIds, matchCountSinceSmokeRef, bombTickRef, ghostTickRef, smokeTimerRef, setMaxGameCombo, setGameLost, setLostReason, setIsReturningFlipped, setTimerActive, timerRef, setScoreSaved, setIsNewRecord, gameMode, activeCoopGame, MahjongService, coopTurn]);

    const handleUndo = useCallback(() => {
        if (undoStack.length === 0) return;
        const lastMove = undoStack[undoStack.length - 1];
        setUndoStack(prev => prev.slice(0, prev.length - 1));
        let updatedTiles = tiles;
        let updatedDock = dockIds;
        if (lastMove.length === 2) {
            const [id1, id2] = lastMove;
            updatedTiles = tiles.map(t =>
                (t.id === id1 || t.id === id2) ? { ...t, isMatched: false, isSelected: false } : t
            );
            setTiles(updatedTiles);
            setMatchedCount(mc => mc - 2);
        } else {
            const [id] = lastMove;
            updatedDock = dockIds.filter(did => did !== id);
            setDockIds(updatedDock);
            setGameLost(false);
        }

        if (gameMode === 'coop' && activeCoopGame) {
            MahjongService.updateCoopGame(activeCoopGame.id, updatedTiles, updatedDock, coopTurn);
        }
    }, [undoStack, tiles, dockIds, setUndoStack, setTiles, setMatchedCount, setDockIds, setGameLost, gameMode, activeCoopGame, MahjongService, coopTurn]);

    const handleHint = useCallback(() => {
        const dockIdsSet = new Set(dockIds);
        const freeOnBoard = tiles.filter(t => !t.isMatched && !dockIdsSet.has(t.id) && freeTilesMap.get(t.id));
        const seenValues = new Map<string, string>();
        for (const tile of freeOnBoard) {
            const value = tile.content.value;
            if (seenValues.has(value)) {
                const id1 = seenValues.get(value)!;
                const id2 = tile.id;
                setTiles(prev => prev.map(t => (t.id === id1 || t.id === id2) ? { ...t, isHinted: true } : t));
                setTimeout(() => {
                    setTiles(prev => prev.map(t => (t.id === id1 || t.id === id2) ? { ...t, isHinted: false } : t));
                }, 2000);
                return;
            }
            seenValues.set(value, tile.id);
        }

        const freeTilesByValue = new Map();
        for (const t of freeOnBoard) {
            if (!freeTilesByValue.has(t.content.value)) {
                freeTilesByValue.set(t.content.value, t);
            }
        }

        for (const dId of dockIds) {
            const dockTile = tilesById.get(dId);
            if (!dockTile) continue;
            const match = freeTilesByValue.get(dockTile.content.value);
            if (match) {
                setTiles(prev => prev.map(t => t.id === match.id ? { ...t, isHinted: true } : t));
                setTimeout(() => {
                    setTiles(prev => prev.map(t => t.id === match.id ? { ...t, isHinted: false } : t));
                }, 2000);
                return;
            }
        }
    }, [tiles, dockIds, freeTilesMap, tilesById, setTiles]);

    return {
        handleRestart,
        handleUndo,
        handleHint
    };
}
