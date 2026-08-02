'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TileState } from './MahjongTile';
import { Tile3D } from './Tile3D';
import { useProfile } from '@/context/ProfileContext';
import * as MahjongAudio from '@/lib/mahjongAudio';

import { CameraRig } from "./mahjong/canvas/CameraRig";
import { DockSlots } from "./mahjong/canvas/DockSlots";
import { MatchExplosion } from "./mahjong/canvas/MatchExplosion";

interface MahjongCanvasProps {
    tiles: TileState[];
    freeTilesMap: Map<string, boolean>;
    dockIds: string[];
    onTilePointerDown: (id: string) => void;
    isMobile: boolean;
    ghostSolidIds?: Set<string>;
    hasStarted: boolean;
    streakCombo?: number;
}

// Duración de la coreografía de choque en el dock antes de la explosión
const COLLISION_MS = 300;
const SHATTER_MS = 180;

// Hit-stop: micro-congelación del render en el instante del impacto para dar peso.
// Escala con el combo; sin freeze en emparejamientos simples para no restar agilidad.
function hitStopDuration(combo: number) {
    if (combo < 2) return 0;
    return Math.min(70, 20 + combo * 10);
}

interface DyingTile {
    id: string;
    start: number; // performance.now()
    collisionPos: [number, number, number];
    isDockTile: boolean;
}

export function MahjongCanvas({ tiles, freeTilesMap, dockIds, onTilePointerDown, isMobile, ghostSolidIds, hasStarted, streakCombo = 0 }: MahjongCanvasProps) {
    const { profile } = useProfile();
    const [explosions, setExplosions] = useState<{ id: string; pos: [number, number, number]; color: string; combo: number }[]>([]);
    const [dyingTiles, setDyingTiles] = useState<DyingTile[]>([]);
    const [frozen, setFrozen] = useState(false); // hit-stop
    const prevMatchedIdsRef = useRef<Set<string>>(new Set());

    const dyingMap = useMemo(() => {
        const m = new Map<string, DyingTile>();
        for (const d of dyingTiles) m.set(d.id, d);
        return m;
    }, [dyingTiles]);

    // Las fichas emparejadas siguen visibles brevemente mientras corre su choque en el dock.
    const visibleTiles = useMemo(() => {
        return tiles.filter(t => !t.isMatched || dyingMap.has(t.id));
    }, [tiles, dyingMap]);

    // Calcular límites lógicos, tamaño del tablero y coordenadas Y del tablero y dock en unidades 3D
    const { centerX, centerY, boardWidth, boardHeight, boardY, dockY } = useMemo(() => {
        if (tiles.length === 0) {
            return {
                centerX: 9,
                centerY: 7,
                boardWidth: 11.2,
                boardHeight: 12.0,
                boardY: -0.6,
                dockY: 4.8
            };
        }

        // ⚡ Bolt Optimization: Single O(N) pass for boundary detection
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (const t of tiles) {
            if (t.x < minX) minX = t.x;
            if (t.x > maxX) maxX = t.x;
            if (t.y < minY) minY = t.y;
            if (t.y > maxY) maxY = t.y;
        }

        const spacingX = 0.43;
        const spacingY = 0.59;
        const tileWidth = 0.82;
        const tileHeight = 1.16;

        // Use fixed bounds of 14 columns (width) and 14 rows (height) to keep camera zoom and dock positioning constant across all layouts (strictly 8x8)
        const fixedCols = 14;
        const fixedRows = 14;

        const width = fixedCols * spacingX + tileWidth;
        const height = fixedRows * spacingY + tileHeight;

        // Espacio libre físico constante entre el tablero y el dock (reducido en móvil para ganar espacio y zoom)
        const gap = isMobile ? 0.42 : 0.78;
        const totalHeight = height + gap + tileHeight;

        // Centrado de la altura combinada sobre Y = 0
        const dockY = (totalHeight - tileHeight) / 2;
        const boardY = -(totalHeight - height) / 2;

        return {
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2,
            boardWidth: width,
            boardHeight: totalHeight,
            boardY,
            dockY
        };
    }, [tiles, isMobile]);

    const prevDockIdsRef = useRef<string[]>([]);

    // Detectar coincidencias, coreografiar el choque en el dock y lanzar explosiones
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

    const rawAccentColor = profile === 'ella' ? '#ff4b89' : '#e1ff80';

    return (
        <div className="relative h-full w-full select-none" style={{ minHeight: isMobile ? '400px' : '520px' }}>
            <Canvas
                frameloop={frozen ? 'never' : 'always'}
                shadows={{ type: THREE.PCFSoftShadowMap }}
                camera={{ fov: 50, position: [0, -0.6, 6.2], near: 0.1, far: 50 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                {/* Rig de Cámara Adaptativo Cenital con Parallax */}
                <CameraRig boardWidth={boardWidth} boardHeight={boardHeight} />

                {/* Slots del Dock 3D dibujados en escena */}
                <DockSlots dockY={dockY} accentColor={rawAccentColor} />

                {/* Iluminación Estética */}
                <ambientLight intensity={0.6} />

                {/* Luz Principal (Sombras dinámicas suaves) */}
                <directionalLight
                    position={[1.5, 11, 3.5]}
                    intensity={1.25}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-camera-far={25}
                    shadow-camera-left={-10}
                    shadow-camera-right={10}
                    shadow-camera-top={10}
                    shadow-camera-bottom={-10}
                    shadow-bias={-0.0005}
                    shadow-radius={4}
                />

                {/* Luz de Contorno / Relleno Púrpura */}
                <directionalLight
                    position={[-5, -4, 5]}
                    intensity={0.75}
                    color={profile === 'ella' ? '#ff8fb2' : '#d2f960'}
                />
                <pointLight
                    position={[0, -2.8, 4.5]}
                    intensity={0.8}
                    distance={8}
                    color={rawAccentColor}
                />

                {/* Renderizar Fichas */}
                <group>
                    {visibleTiles.map(tile => (
                        <Tile3D
                            key={tile.id}
                            tile={tile}
                            isFree={!!freeTilesMap.get(tile.id)}
                            centerX={centerX}
                            centerY={centerY}
                            boardY={boardY}
                            dockY={dockY}
                            dockIds={dockIds}
                            onSelect={onTilePointerDown}
                            isGhostSolid={tile.isGhost ? ghostSolidIds?.has(tile.id) : undefined}
                            hasStarted={hasStarted}
                            dyingInfo={dyingMap.get(tile.id)}
                        />
                    ))}
                </group>

                {/* Renderizar Efectos de Explosión de Fichas */}
                <group>
                    {explosions.map(exp => (
                        <MatchExplosion
                            key={exp.id}
                            position={exp.pos}
                            color={exp.color}
                            combo={exp.combo}
                            onComplete={() => setExplosions(prev => prev.filter(e => e.id !== exp.id))}
                        />
                    ))}
                </group>
            </Canvas>
        </div>
    );
}
