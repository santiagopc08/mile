import { useState, useEffect, useRef, MutableRefObject } from 'react';
import { TileState } from '../../MahjongTile';
import * as MahjongAudio from '@/lib/mahjongAudio';

// Duración de la coreografía de choque en el dock antes de la explosión
const COLLISION_MS = 300;
const SHATTER_MS = 180;

// Hit-stop: micro-congelación del render en el instante del impacto para dar peso.
// Escala con el combo; sin freeze en emparejamientos simples para no restar agilidad.
function hitStopDuration(combo: number) {
    if (combo < 2) return 0;
    return Math.min(70, 20 + combo * 10);
}

export interface DyingTile {
    id: string;
    start: number; // performance.now()
    collisionPos: [number, number, number];
    isDockTile: boolean;
}

export interface ExplosionData {
    id: string;
    pos: [number, number, number];
    color: string;
    combo: number;
}

interface UseMatchAnimationsProps {
    tiles: TileState[];
    dockIds: string[];
    centerX: number;
    centerY: number;
    boardY: number;
    dockY: number;
    profile: string | null;
    streakCombo: number;
}

export function useMatchAnimations({
    tiles,
    dockIds,
    centerX,
    centerY,
    boardY,
    dockY,
    profile,
    streakCombo
}: UseMatchAnimationsProps) {
    const [explosions, setExplosions] = useState<ExplosionData[]>([]);
    const [dyingTiles, setDyingTiles] = useState<DyingTile[]>([]);
    const [frozen, setFrozen] = useState(false); // hit-stop
    const prevMatchedIdsRef = useRef<Set<string>>(new Set());
    const prevDockIdsRef = useRef<string[]>([]);

    useEffect(() => {
        const newlyMatched = tiles.filter(t => t.isMatched && !prevMatchedIdsRef.current.has(t.id));
        if (newlyMatched.length > 0) {
            const rawAccentColor = profile === 'ella' ? '#ff4b89' : '#e1ff80';

            const spacingX = 0.43;
            const spacingY = 0.59;
            const spacingZ = 0.34;

            const combo = Math.max(1, streakCombo);

            const prevDockIdsMap = new Map(prevDockIdsRef.current.map((id, index) => [id, index]));

            // ¿La coincidencia salió del dock? (caso normal de emparejamiento)
            // ⚡ Bolt Optimization: Replace O(N^2) indexOf in loop with O(1) Map lookup
            const dockTile = newlyMatched.find(t => prevDockIdsMap.has(t.id));

            if (dockTile && newlyMatched.length <= 2) {
                // ─── CHOQUE EN EL DOCK ───
                const dockIndex = prevDockIdsMap.get(dockTile.id) ?? -1;
                const collisionPos: [number, number, number] = [(dockIndex - 1) * 1.30, dockY, 0.35];
                const isGolden = newlyMatched.some(t => t.content.type === 'custom');
                const expColor = isGolden ? '#ffd700' : rawAccentColor;

                const start = performance.now();
                const batch: DyingTile[] = newlyMatched.map(t => ({
                    id: t.id,
                    start,
                    collisionPos,
                    isDockTile: t.id === dockTile.id
                }));
                setDyingTiles(prev => [...prev, ...batch]);

                // Whoosh de la ficha volando al dock + nota de combo
                MahjongAudio.playMatch(combo);

                // La explosión detona en el instante del impacto (con clink + hit-stop)
                window.setTimeout(() => {
                    setExplosions(prev => [...prev, {
                        id: `exp-${dockTile.id}-${start}`,
                        pos: collisionPos,
                        color: expColor,
                        combo
                    }]);
                    MahjongAudio.playCollision(combo);

                    // Hit-stop: congela el render unos milisegundos para dar impacto
                    const freezeMs = hitStopDuration(combo);
                    if (freezeMs > 0) {
                        setFrozen(true);
                        window.setTimeout(() => setFrozen(false), freezeMs);
                    }
                }, COLLISION_MS);

                // Retirar las fichas ya destruidas tras el estallido
                const batchIds = new Set(batch.map(b => b.id));
                window.setTimeout(() => {
                    setDyingTiles(prev => prev.filter(d => !batchIds.has(d.id)));
                }, COLLISION_MS + SHATTER_MS);
            } else {
                // ─── Fallback: explosión instantánea (ej. carga remota en coop) ───
                const newExplosions = newlyMatched.map(tile => {
                    const dockIndex = prevDockIdsMap.get(tile.id) ?? -1;
                    const wasInDock = dockIndex !== -1;

                    let posX: number;
                    let posY: number;
                    let posZ: number;

                    if (wasInDock) {
                        posX = (dockIndex - 1) * 1.30;
                        posY = dockY;
                        posZ = 0.25;
                    } else {
                        posX = (tile.x - centerX) * spacingX;
                        posY = boardY - (tile.y - centerY) * spacingY;
                        posZ = tile.z * spacingZ;
                    }

                    return {
                        id: `exp-${tile.id}-${Date.now()}-${Math.random()}`,
                        pos: [posX, posY, posZ] as [number, number, number],
                        color: tile.content.type === 'custom' ? '#ffd700' : rawAccentColor,
                        combo
                    };
                });

                setExplosions(prev => [...prev, ...newExplosions]);
            }
        }

        // ⚡ Bolt Optimization: Replace double-pass filter/map with single-pass O(N) iteration
        const matchedSet = new Set<string>();
        for (const t of tiles) {
            if (t.isMatched) matchedSet.add(t.id);
        }
        prevMatchedIdsRef.current = matchedSet;
        prevDockIdsRef.current = [...dockIds];
    }, [tiles, dockIds, centerX, centerY, boardY, dockY, profile, streakCombo]);

    return {
        explosions,
        setExplosions,
        dyingTiles,
        frozen
    };
}
