'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TileState } from './MahjongTile';
import { useProfile } from '@/context/ProfileContext';
import { drawBordersAndTicks, drawCanvasBackground, renderTileToCanvas } from '@/utils/tileTextureRenderer';

const TILE_WIDTH = 0.82;
const TILE_HEIGHT = 1.16;
const TILE_BACK_DEPTH = 0.28;
const TILE_FACE_WIDTH = 0.82;
const TILE_FACE_HEIGHT = 1.16;
const TILE_FACE_DEPTH = 0.32;

// Geometrías compartidas: todas las fichas tienen las mismas dimensiones, así que
// reutilizamos una sola instancia por cara en lugar de crear dos BoxGeometry por
// ficha (con 96-128 fichas eso ahorra mucha memoria y allocations en GPU).
// Se pasan por prop `geometry`, por lo que R3F NO las libera al desmontar la ficha.
const BACK_GEOMETRY = new THREE.BoxGeometry(TILE_WIDTH, TILE_HEIGHT, TILE_BACK_DEPTH);
const FRONT_GEOMETRY = new THREE.BoxGeometry(TILE_FACE_WIDTH, TILE_FACE_HEIGHT, TILE_FACE_DEPTH);

// ─── Caché LRU de texturas de ficha ──────────────────────────────────────────
// Muchas fichas comparten el mismo símbolo/imagen, así que reutilizamos la
// CanvasTexture en lugar de repintar un canvas 256×256 por cada ficha. El caché
// es dueño del ciclo de vida (no se hace dispose por ficha); la evicción LRU
// libera las texturas menos usadas. El tope supera de sobra el máximo de fichas
// simultáneas en el tablero (≤128) para no evictar una textura aún en uso.
const MAX_TILE_TEXTURE_CACHE = 256;
const tileTextureCache = new Map<string, THREE.CanvasTexture>();
// Cargas de imagen en vuelo, para que fichas iguales compartan una sola textura
const pendingTileTextures = new Map<string, Promise<THREE.CanvasTexture>>();

function buildTileTextureKey(
    tile: TileState,
    accentColor: string,
    mirrorVariant?: 'flipX' | 'flipY' | 'rot90' | 'rot270'
): string {
    return [
        tile.content.type,
        tile.content.value,
        accentColor,
        mirrorVariant || '',
        tile.isLocked ? 'L' : '',
        tile.isBomb && tile.bombTimer !== undefined ? `B${tile.bombTimer}` : '',
        tile.iceCounter ? `I${tile.iceCounter}` : '',
        tile.isSmoked ? 'S' : '',
    ].join('|');
}

function getCachedTileTexture(key: string): THREE.CanvasTexture | undefined {
    const tex = tileTextureCache.get(key);
    if (tex) {
        // Refrescar orden LRU
        tileTextureCache.delete(key);
        tileTextureCache.set(key, tex);
    }
    return tex;
}

function setCachedTileTexture(key: string, tex: THREE.CanvasTexture) {
    tileTextureCache.set(key, tex);
    if (tileTextureCache.size > MAX_TILE_TEXTURE_CACHE) {
        const oldestKey = tileTextureCache.keys().next().value;
        if (oldestKey !== undefined) {
            const old = tileTextureCache.get(oldestKey);
            tileTextureCache.delete(oldestKey);
            old?.dispose();
        }
    }
}

function createTileTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// Hook interno para cargar y formatear texturas en canvas 2D con bordes brutalistas no-planos
function useTileTexture(tile: TileState, accentColor: string, mirrorVariant?: 'flipX' | 'flipY' | 'rot90' | 'rot270') {
    const [texture, setTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        let active = true;

        // Reutilizar textura ya generada si el símbolo/estado coincide
        const key = buildTileTextureKey(tile, accentColor, mirrorVariant);
        const cached = getCachedTileTexture(key);
        if (cached) {
            setTexture(cached);
            return () => { active = false; };
        }

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const isGolden = tile.content.type === 'custom';
        const isCanvasRender = ['traditional', 'bottle_message', 'calendar_date', 'clock_time', 'drawing_tile'].includes(tile.content.type);

        if (isCanvasRender) {
            renderTileToCanvas(ctx, tile, accentColor, mirrorVariant);

            const tex = createTileTexture(canvas);
            setCachedTileTexture(key, tex);
            if (active) setTexture(tex);
        } else {
            // Cargar imagen personalizada (Supabase o Local), deduplicando cargas
            // iguales para que las dos fichas del par compartan una sola textura.
            let pending = pendingTileTextures.get(key);
            if (!pending) {
                pending = new Promise<THREE.CanvasTexture>((resolve) => {
                    const img = new Image();
                    const isLocal = tile.content.value.startsWith('/');

                    // Definir handlers ANTES de establecer src para evitar carreras por caché
                    img.onload = () => {
                        // Redibujar fondo
                        drawCanvasBackground(ctx, tile, isGolden);

                        // Dibujar imagen 'contain' ajustada para contrarrestar el estiramiento 3D
                        const margin = 26; // Mayor margen para hacer la imagen más pequeña
                        const size = 256 - margin * 2; // 204

                        const correctionFactor = TILE_FACE_HEIGHT / TILE_FACE_WIDTH;
                        const imgAspect = img.width / img.height;
                        const targetCanvasAspect = imgAspect * correctionFactor;

                        let drawW = size;
                        let drawH = size;
                        let drawX = margin;
                        let drawY = margin;

                        if (targetCanvasAspect > 1) {
                            // Más ancho que alto -> reducimos altura
                            drawH = size / targetCanvasAspect;
                            drawY = margin + (size - drawH) / 2;
                        } else {
                            // Más alto que ancho -> reducimos anchura
                            drawW = size * targetCanvasAspect;
                            drawX = margin + (size - drawW) / 2;
                        }

                        ctx.drawImage(img, 0, 0, img.width, img.height, drawX, drawY, drawW, drawH);

                        // Aplicar el marco de borde y las marcas visuales por encima
                        drawBordersAndTicks(ctx, isGolden, accentColor);

                        resolve(createTileTexture(canvas));
                    };

                    img.onerror = () => {
                        // Placeholder visual en caso de error
                        drawCanvasBackground(ctx, tile, isGolden);

                        drawBordersAndTicks(ctx, isGolden, accentColor);

                        ctx.fillStyle = isGolden ? '#937500' : '#e74c3c';
                        ctx.font = 'bold 140px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(isGolden ? '✨' : '🖼️', 128, 128);

                        resolve(createTileTexture(canvas));
                    };

                    // Establecer src AL FINAL para iniciar la descarga de forma segura
                    if (!isLocal) {
                        img.src = `/api/proxy-image?url=${encodeURIComponent(tile.content.value)}`;
                    } else {
                        img.src = tile.content.value;
                    }
                });

                pendingTileTextures.set(key, pending);
                pending.then(tex => {
                    setCachedTileTexture(key, tex);
                    pendingTileTextures.delete(key);
                });
            }

            pending.then(tex => {
                if (active) setTexture(tex);
            });
        }

        // El caché es dueño de la textura; no se hace dispose por ficha.
        return () => {
            active = false;
        };
    }, [tile.content.value, tile.content.type, accentColor, mirrorVariant, tile.isLocked, tile.isBomb, tile.bombTimer, tile.iceCounter, tile.isSmoked]);

    return texture;
}

interface DyingInfo {
    id: string;
    start: number;
    collisionPos: [number, number, number];
    isDockTile: boolean;
}

interface Tile3DProps {
    tile: TileState;
    isFree: boolean;
    centerX: number;
    centerY: number;
    boardY: number;
    dockY: number;
    dockIds: string[];
    onSelect: (id: string) => void;
    isGhostSolid?: boolean;
    hasStarted: boolean;
    dyingInfo?: DyingInfo;
}

export function Tile3D({ tile, isFree, centerX, centerY, boardY, dockY, dockIds, onSelect, isGhostSolid, hasStarted, dyingInfo }: Tile3DProps) {
    const { profile } = useProfile();
    const meshRef = useRef<THREE.Group>(null);
    const frontMeshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    // Colores de acento según perfil
    const rawAccentColor = profile === 'ella' ? '#ff4b89' : '#e1ff80'; // Fucsia o Neón
    const backColor = profile === 'ella' ? '#c83b6b' : '#a1c24a';       // Capa trasera del Mahjong

    const texture = useTileTexture(tile, rawAccentColor, tile.isMirrored);
    const isGolden = tile.content.type === 'custom';

    // Spacing en 3D para mapear el grid discreto. Las fichas ahora son más verticales
    // y el eje Z separa más las capas para que la pila se lea con profundidad real.
    const spacingX = 0.43;
    const spacingY = 0.59;
    const spacingZ = 0.62;

    // Calcular posición base en el tablero
    const posX = (tile.x - centerX) * spacingX;
    const posY = boardY - (tile.y - centerY) * spacingY;
    const baseZ = tile.z * spacingZ;

    // Detectar si la ficha está en el dock y obtener su índice
    const dockIndex = dockIds.indexOf(tile.id);
    const isInDock = dockIndex !== -1;
    const dying = !!dyingInfo;
    const isBright = isFree || isInDock || dying; // Las fichas en el dock/destruyéndose no deben verse opacas
    const isFlipped = !!tile.isFlippedDown && !isInDock;
    const isBlackSpot = isFlipped && !isFree;

    // Calcular posición final objetivo (target)
    let targetX = posX;
    let targetY = posY;
    let targetZ = baseZ + (tile.isSelected ? 0.28 : hovered && isFree ? 0.08 : 0);

    if (isInDock) {
        // Posicionamiento de slots en el Dock 3D al tope de la pantalla
        targetX = (dockIndex - 1) * 1.30; // Centrado en X con espacio de 1.30 unidades para las fichas más anchas
        targetY = dockY;                  // Ubicación al tope del tablero
        targetZ = 0.25;                   // Leve elevación
    }

    // Animación suave usando LERP por frame

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
    }, [hasStarted, posX, posY, baseZ, tile.id, tile.z]);

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
        if (isGolden && isFree && !isInDock) {
            targetZ += Math.sin(time * 4) * 0.04;
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
            meshRef.current.position.z = THREE.MathUtils.damp(meshRef.current.position.z, targetZ, settleSpeed, safeDelta);
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

    // Cambiar cursor al hacer hover
    useEffect(() => {
        if (hovered && isFree) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'auto';
        }
        return () => {
            document.body.style.cursor = 'auto';
        };
    }, [hovered, isFree]);

    return (
        <group
            ref={meshRef}
            position={[posX, posY, baseZ]}
            onPointerOver={(e) => {
                e.stopPropagation();
                if (isFree) setHovered(true);
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                setHovered(false);
            }}
            onPointerDown={(e) => {
                e.stopPropagation();
                if (isFree) {
                    onSelect(tile.id);
                }
            }}
        >
            {/* 1. PLACA TRASERA DE ACCENTO / SOPORTE */}
            <mesh
                castShadow={isBright && !isBlackSpot}
                receiveShadow={true}
                position={[0, 0, -0.15]}
                geometry={BACK_GEOMETRY}
            >
                <meshStandardMaterial
                    color={isBlackSpot ? '#000000' : (isGolden ? '#ffd700' : isBright ? backColor : '#323232')}
                    roughness={isBlackSpot ? 1.0 : (isGolden ? 0.15 : 0.3)}
                    metalness={isBlackSpot ? 0.0 : (isGolden ? 0.95 : 0.3)}
                    transparent
                    opacity={isBlackSpot ? 1.0 : (isBright ? 1.0 : 0.45)}
                />
            </mesh>

            {/* 2. PLACA FRONTAL (Mosaico de Juego principal) */}
            {/* Cara frontal con textura blanca/hueso para parecer ficha de mahjong real */}
            <mesh
                ref={frontMeshRef}
                castShadow={isBright && !isBlackSpot}
                receiveShadow={true}
                position={[0, 0, 0.15]}
                geometry={FRONT_GEOMETRY}
            >
                {/* Laterales (Índices 0-3): Color hueso/blanco */}
                <meshStandardMaterial
                    attach="material-0"
                    color={isBlackSpot ? '#000000' : (isGolden ? '#ffd700' : isBright ? '#fdfcf0' : '#dcdbc7')}
                    roughness={isBlackSpot ? 1.0 : (isGolden ? 0.15 : 0.4)}
                    metalness={isBlackSpot ? 0.0 : (isGolden ? 0.95 : 0.1)}
                    transparent
                    opacity={isBlackSpot ? 1.0 : (isBright ? 1.0 : 0.45)}
                />
                <meshStandardMaterial
                    attach="material-1"
                    color={isBlackSpot ? '#000000' : (isGolden ? '#ffd700' : isBright ? '#fdfcf0' : '#dcdbc7')}
                    roughness={isBlackSpot ? 1.0 : (isGolden ? 0.15 : 0.4)}
                    metalness={isBlackSpot ? 0.0 : (isGolden ? 0.95 : 0.1)}
                    transparent
                    opacity={isBlackSpot ? 1.0 : (isBright ? 1.0 : 0.45)}
                />
                <meshStandardMaterial
                    attach="material-2"
                    color={isBlackSpot ? '#000000' : (isGolden ? '#ffd700' : isBright ? '#fdfcf0' : '#dcdbc7')}
                    roughness={isBlackSpot ? 1.0 : (isGolden ? 0.15 : 0.4)}
                    metalness={isBlackSpot ? 0.0 : (isGolden ? 0.95 : 0.1)}
                    transparent
                    opacity={isBlackSpot ? 1.0 : (isBright ? 1.0 : 0.45)}
                />
                <meshStandardMaterial
                    attach="material-3"
                    color={isBlackSpot ? '#000000' : (isGolden ? '#ffd700' : isBright ? '#fdfcf0' : '#dcdbc7')}
                    roughness={isBlackSpot ? 1.0 : (isGolden ? 0.15 : 0.4)}
                    metalness={isBlackSpot ? 0.0 : (isGolden ? 0.95 : 0.1)}
                    transparent
                    opacity={isBlackSpot ? 1.0 : (isBright ? 1.0 : 0.45)}
                />
                
                {/* Cara Frontal (+Z, Índice 4): Textura con el símbolo o foto */}
                <meshStandardMaterial
                    key={texture ? 'loaded' : 'loading'}
                    attach="material-4"
                    map={isBlackSpot ? undefined : (texture || undefined)}
                    color={isBlackSpot ? '#000000' : (isBright ? '#ffffff' : '#dcdbc7')}
                    roughness={isBlackSpot ? 1.0 : 0.15}
                    metalness={isBlackSpot ? 0.0 : (isGolden ? 0.5 : 0.05)}
                    transparent
                    opacity={isBlackSpot ? 1.0 : (isBright ? 1.0 : 0.4)}
                />

                {/* Cara Trasera (-Z, Índice 5): Igual al borde */}
                <meshStandardMaterial
                    attach="material-5"
                    color={isBlackSpot ? '#000000' : (isGolden ? '#ffd700' : isBright ? '#fdfcf0' : '#dcdbc7')}
                    roughness={isBlackSpot ? 1.0 : (isGolden ? 0.15 : 0.4)}
                    metalness={isBlackSpot ? 0.0 : (isGolden ? 0.95 : 0.1)}
                    transparent
                    opacity={isBlackSpot ? 1.0 : (isBright ? 1.0 : 0.45)}
                />
            </mesh>
        </group>
    );
}
