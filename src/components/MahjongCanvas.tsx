'use client';

import { useMemo } from 'react';
import { useBoardBounds } from './mahjong/hooks/useBoardBounds';
import { useMatchAnimations, DyingTile } from './mahjong/hooks/useMatchAnimations';
import { MahjongLights } from './mahjong/canvas/MahjongLights';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { TileState } from './MahjongTile';
import { Tile3D } from './Tile3D';
import { useProfile } from '@/context/ProfileContext';

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

export function MahjongCanvas({ tiles, freeTilesMap, dockIds, onTilePointerDown, isMobile, ghostSolidIds, hasStarted, streakCombo = 0 }: MahjongCanvasProps) {
    const { profile } = useProfile();
    const {
        centerX, centerY, boardWidth, boardHeight, boardY, dockY
    } = useBoardBounds(tiles, isMobile);

    const {
        explosions, setExplosions, dyingTiles, frozen
    } = useMatchAnimations({
        tiles, dockIds, centerX, centerY, boardY, dockY, profile: profile || 'default', streakCombo
    });

    const dyingMap = useMemo(() => {
        const m = new Map<string, DyingTile>();
        for (const d of dyingTiles) m.set(d.id, d);
        return m;
    }, [dyingTiles]);

    // Las fichas emparejadas siguen visibles brevemente mientras corre su choque en el dock.
    const visibleTiles = useMemo(() => {
        return tiles.filter(t => !t.isMatched || dyingMap.has(t.id));
    }, [tiles, dyingMap]);

    const rawAccentColor = profile === 'ella' ? '#ff4b89' : '#e1ff80';

    return (
        <div className="relative h-full w-full select-none" style={{ minHeight: isMobile ? '400px' : '520px' }}>
            <Canvas
                frameloop={frozen ? 'never' : 'always'}
                shadows={{ type: THREE.PCFShadowMap }}
                camera={{ fov: 50, position: [0, -0.6, 6.2], near: 0.1, far: 50 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                {/* Rig de Cámara Adaptativo Cenital con Parallax */}
                <CameraRig boardWidth={boardWidth} boardHeight={boardHeight} />

                {/* Slots del Dock 3D dibujados en escena */}
                <DockSlots dockY={dockY} accentColor={rawAccentColor} />

                <MahjongLights profile={profile || 'default'} accentColor={rawAccentColor} />

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
