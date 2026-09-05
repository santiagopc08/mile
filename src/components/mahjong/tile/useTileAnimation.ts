import { useRef, useEffect, RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TileState } from '../../MahjongTile';
import { DyingInfo } from './Types';

interface UseTileAnimationParams {
    meshRef: RefObject<THREE.Group | null>;
    frontMeshRef: RefObject<THREE.Mesh | null>;
    tile: TileState;
    hasStarted: boolean;
    posX: number;
    posY: number;
    baseZ: number;
    targetX: number;
    targetY: number;
    targetZ: number;
    dyingInfo?: DyingInfo;
    isInDock: boolean;
    dockIndex: number;
    isGolden: boolean;
    isFree: boolean;
    isFlipped: boolean;
    hovered: boolean;
    isGhostSolid?: boolean;
    isBlackSpot: boolean;
    isBright: boolean;
    rawAccentColor: string;
}

export function useTileAnimation({
    meshRef,
    frontMeshRef,
    tile,
    hasStarted,
    posX,
    posY,
    baseZ,
    targetX,
    targetY,
    targetZ,
    dyingInfo,
    isInDock,
    dockIndex,
    isGolden,
    isFree,
    isFlipped,
    hovered,
    isGhostSolid,
    isBlackSpot,
    isBright,
    rawAccentColor,
}: UseTileAnimationParams) {
    const entryDelayRef = useRef(0);
    const startTimeRef = useRef<number | null>(null);
    const wasInDockRef = useRef(false);
    const prevDockIndexRef = useRef<number>(-1);
    const dockMoveRef = useRef<{
        active: boolean;
        start: number;
        from: [number, number, number];
        to: [number, number, number];
    }>({ active: false, start: 0, from: [0, 0, 0], to: [0, 0, 0] });
    const returnMoveRef = useRef<{
        active: boolean;
        start: number;
        from: [number, number, number];
        to: [number, number, number];
    }>({ active: false, start: 0, from: [0, 0, 0], to: [0, 0, 0] });
    // Captura la posición de partida del choque en el primer frame de destrucción
    const dyingFromRef = useRef<{ start: number; from: [number, number, number] }>({ start: -1, from: [0, 0, 0] });

    useEffect(() => {
        if (meshRef.current && !hasStarted) {
            const numericId = Number(tile.id.replace(/\D/g, '')) || 0;
            entryDelayRef.current = (numericId % 16) * 0.018 + tile.z * 0.045;
            // Set starting position high up with enough rotation to make the deal feel physical.
            meshRef.current.position.set(
                posX + (Math.random() - 0.5) * 9,
                posY + (Math.random() - 0.5) * 9,
                baseZ + 18 + Math.random() * 12
            );
            meshRef.current.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            meshRef.current.scale.setScalar(0.18);
        }
    }, [hasStarted, posX, posY, baseZ, tile.id, tile.z, meshRef]);

    useEffect(() => {
        if (hasStarted) {
            startTimeRef.current = null;
        }
    }, [hasStarted]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Limitar delta para evitar saltos bruscos en caídas de frame
        const safeDelta = Math.min(delta, 0.1);
        const time = state.clock.elapsedTime;
        if (hasStarted && startTimeRef.current === null) {
            startTimeRef.current = time;
        }

        // ─── CHOQUE Y DESTRUCCIÓN EN EL DOCK ───
        if (dyingInfo) {
            const SLAM = 0.30;   // s: vuelo acelerado hacia el punto de impacto
            const IMPACT = 0.18; // s: aplastamiento y colapso
            const [cx, cy, cz] = dyingInfo.collisionPos;
            const elapsed = (performance.now() - dyingInfo.start) / 1000;

            // Guardar la posición de partida una sola vez por choque.
            // La ficha que ya estaba en el dock arranca en su ranura (espera el impacto);
            // la ficha del tablero vuela desde su posición hacia el dock.
            if (dyingFromRef.current.start !== dyingInfo.start) {
                const startFrom: [number, number, number] = dyingInfo.isDockTile
                    ? [cx, cy, cz]
                    : [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z];
                dyingFromRef.current = { start: dyingInfo.start, from: startFrom };
                if (dyingInfo.isDockTile) {
                    meshRef.current.position.set(cx, cy, cz);
                }
            }
            const from = dyingFromRef.current.from;

            if (elapsed < SLAM) {
                const t = elapsed / SLAM;
                const eased = t * t * t; // aceleración fuerte (embestida)
                meshRef.current.position.set(
                    THREE.MathUtils.lerp(from[0], cx, eased),
                    THREE.MathUtils.lerp(from[1], cy, eased),
                    THREE.MathUtils.lerp(from[2], cz, eased)
                );
                // Giro en el aire; las dos fichas rotan en sentidos opuestos
                meshRef.current.rotation.z += safeDelta * 7 * (dyingInfo.isDockTile ? -1 : 1);
                const s = 1 + eased * 0.14;
                meshRef.current.scale.set(s, s, s);
            } else {
                // Impacto: aplastar horizontalmente y colapsar a cero
                const t2 = Math.min(1, (elapsed - SLAM) / IMPACT);
                const k = 1 - t2;
                meshRef.current.position.set(cx, cy, cz);
                meshRef.current.scale.set(1.4 * k + 0.001, 0.45 * k + 0.001, k + 0.001);
                meshRef.current.rotation.z += safeDelta * 13;
            }

            // Destello caliente durante la destrucción
            if (frontMeshRef.current) {
                const mats = frontMeshRef.current.material as THREE.MeshStandardMaterial[];
                if (mats && mats.length >= 6) {
                    const flash = 0.6 + Math.sin(elapsed * 42) * 0.4;
                    mats.forEach(m => { if (m) m.opacity = 1; });
                    const fm = mats[4];
                    if (fm) {
                        fm.emissive.set('#ffb54d');
                        fm.emissiveIntensity = flash * 1.7;
                    }
                }
            }
            return;
        }

        if (isInDock && !wasInDockRef.current) {
            // Entrar al dock desde el tablero
            dockMoveRef.current = {
                active: true,
                start: time,
                from: [
                    meshRef.current.position.x,
                    meshRef.current.position.y,
                    meshRef.current.position.z
                ],
                to: [targetX, targetY, targetZ]
            };
            returnMoveRef.current.active = false;
        } else if (isInDock && wasInDockRef.current && prevDockIndexRef.current !== -1 && prevDockIndexRef.current !== dockIndex) {
            // Reordenar ranura dentro del dock si otra ficha sale
            dockMoveRef.current = {
                active: true,
                start: time,
                from: [
                    meshRef.current.position.x,
                    meshRef.current.position.y,
                    meshRef.current.position.z
                ],
                to: [targetX, targetY, targetZ]
            };
            returnMoveRef.current.active = false;
        } else if (!isInDock && wasInDockRef.current) {
            // Volver del dock al tablero
            dockMoveRef.current.active = false;
            returnMoveRef.current = {
                active: true,
                start: time,
                from: [
                    meshRef.current.position.x,
                    meshRef.current.position.y,
                    meshRef.current.position.z
                ],
                to: [targetX, targetY, targetZ]
            };
        }
        wasInDockRef.current = isInDock;
        prevDockIndexRef.current = dockIndex;

        // Si es una ficha dorada libre, flotar suavemente arriba y abajo
        let localTargetZ = targetZ;
        if (isGolden && isFree && !isInDock) {
            localTargetZ += Math.sin(time * 4) * 0.04;
        }

        const elapsedSinceStart = hasStarted && startTimeRef.current !== null ? time - startTimeRef.current : 0;
        const entryDelay = hasStarted ? entryDelayRef.current : 0;
        const entryActive = hasStarted && elapsedSinceStart < entryDelay;

        if (dockMoveRef.current.active) {
            const move = dockMoveRef.current;
            const moveDuration = 0.38;
            const t = Math.min(1, (time - move.start) / moveDuration);
            const eased = 1 - Math.pow(1 - t, 3);
            const arc = Math.sin(t * Math.PI) * 0.55;
            const drift = Math.sin(t * Math.PI * 2) * 0.035;
            meshRef.current.position.set(
                THREE.MathUtils.lerp(move.from[0], move.to[0], eased),
                THREE.MathUtils.lerp(move.from[1], move.to[1], eased) + drift,
                THREE.MathUtils.lerp(move.from[2], move.to[2], eased) + arc
            );
            if (t >= 1) {
                dockMoveRef.current.active = false;
            }
        } else if (returnMoveRef.current.active) {
            const move = returnMoveRef.current;
            const moveDuration = 0.35;
            const t = Math.min(1, (time - move.start) / moveDuration);
            const eased = 1 - Math.pow(1 - t, 3);
            const arc = Math.sin(t * Math.PI) * 0.65;
            meshRef.current.position.set(
                THREE.MathUtils.lerp(move.from[0], move.to[0], eased),
                THREE.MathUtils.lerp(move.from[1], move.to[1], eased),
                THREE.MathUtils.lerp(move.from[2], move.to[2], eased) + arc
            );
            if (t >= 1) {
                returnMoveRef.current.active = false;
            }
        } else {
            // Interpolación LERP ágil para movimiento general
            const settleSpeed = entryActive ? 0.01 : 18.0;
            meshRef.current.position.x = THREE.MathUtils.damp(meshRef.current.position.x, targetX, settleSpeed, safeDelta);
            meshRef.current.position.y = THREE.MathUtils.damp(meshRef.current.position.y, targetY, settleSpeed, safeDelta);
            meshRef.current.position.z = THREE.MathUtils.damp(meshRef.current.position.z, localTargetZ, settleSpeed, safeDelta);
        }

        // Rotación LERP (los del dock se alinean planos)
        const dockMoveActive = dockMoveRef.current.active;
        const targetRotX = isInDock ? (dockMoveActive ? -0.16 : 0) : tile.isSelected ? -0.1 : 0;

        let targetRotY = isInDock
            ? (dockMoveActive ? 0.12 : 0)
            : isFlipped
                ? Math.PI
                : tile.isSelected
                    ? 0.08
                    : hovered && isFree
                        ? 0.04
                        : 0;

        // Si es dorada y seleccionada, aplicar un suave bamboleo de rotación
        if (isGolden && tile.isSelected) {
            targetRotY += Math.sin(time * 6) * 0.15;
        }

        meshRef.current.rotation.x = THREE.MathUtils.damp(meshRef.current.rotation.x, targetRotX, entryActive ? 0.01 : 8.5, safeDelta);
        meshRef.current.rotation.y = THREE.MathUtils.damp(meshRef.current.rotation.y, targetRotY, entryActive ? 0.01 : 8.5, safeDelta);
        meshRef.current.rotation.z = THREE.MathUtils.damp(meshRef.current.rotation.z, 0, entryActive ? 0.01 : 8, safeDelta);

        // LERP de escala
        const targetScale = hovered && isFree && !isInDock ? 1.035 : 1.0;
        meshRef.current.scale.setScalar(THREE.MathUtils.damp(meshRef.current.scale.x, targetScale, entryActive ? 0.01 : 11, safeDelta));

        // Animación de pulso luminiscente en el Mesh frontal
        if (frontMeshRef.current) {
            const materials = frontMeshRef.current.material as THREE.MeshStandardMaterial[];
            if (materials && materials.length >= 6) {
                // Material frontal (índice 4)
                const frontMat = materials[4];

                // Ghost tile opacity animation
                if (tile.isGhost && !isInDock) {
                    const ghostOpacity = isGhostSolid ? 1.0 : 0.2;
                    const currentOp = frontMat.opacity;
                    const lerpedOp = THREE.MathUtils.damp(currentOp, ghostOpacity, 5, safeDelta);
                    materials.forEach(m => { if (m) m.opacity = lerpedOp; });
                } else {
                    materials.forEach(m => { if (m) m.opacity = isBlackSpot ? 1.0 : (isBright ? 1.0 : 0.45); });
                }

                if (tile.isBomb && !tile.isMatched) {
                    // Pulsing red danger glow for bombs
                    const bombPulse = Math.sin(time * 6) * 0.4 + 0.5;
                    frontMat.emissive.set('#ff0000');
                    frontMat.emissiveIntensity = bombPulse;
                } else if (tile.isHinted) {
                    const clockTime = state.clock.elapsedTime;
                    const pulse = Math.sin(clockTime * 9) * 0.35 + 0.35;
                    frontMat.emissive.set(rawAccentColor);
                    frontMat.emissiveIntensity = pulse;
                } else if (tile.isSelected) {
                    frontMat.emissive.set(rawAccentColor);
                    frontMat.emissiveIntensity = 0.25;
                } else if (tile.isGhost && !isGhostSolid && !isInDock) {
                    // Cyan glow when ghost is translucent
                    frontMat.emissive.set('#00ffff');
                    frontMat.emissiveIntensity = 0.3;
                } else if (tile.iceCounter && tile.iceCounter > 0) {
                    // Subtle blue emissive for iced tiles
                    const icePulse = Math.sin(time * 2) * 0.1 + 0.15;
                    frontMat.emissive.set('#87ceeb');
                    frontMat.emissiveIntensity = icePulse;
                } else if (isGolden && isFree && !isInDock) {
                    const shimmer = Math.sin(time * 3) * 0.12 + 0.18;
                    frontMat.emissive.set('#e5c100');
                    frontMat.emissiveIntensity = shimmer;
                } else {
                    frontMat.emissiveIntensity = 0;
                }
            }
        }
    });
}
