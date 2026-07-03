'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TileState } from './MahjongTile';
import { Tile3D } from './Tile3D';
import { useProfile } from '@/context/ProfileContext';

// --- RIG DE CÁMARA (Efecto Parallax sutil con ratón y auto-escalado matemático) ---
interface CameraRigProps {
    boardWidth: number;
    boardHeight: number;
}

function CameraRig({ boardWidth, boardHeight }: CameraRigProps) {
    const { camera, size } = useThree();

    useFrame((state, delta) => {
        const safeDelta = Math.min(delta, 0.1);
        const { x, y } = state.pointer; // Coordenadas del cursor entre -1 y 1
        const aspect = size.width / size.height;
        const fovRad = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;

        const isMobileDevice = size.width <= 768;

        // Calcular distancia Z requerida tanto para el ancho como para el alto
        const requiredZHeight = boardHeight / (2 * Math.tan(fovRad / 2));
        const requiredZWidth = boardWidth / (2 * aspect * Math.tan(fovRad / 2));

        // La distancia requerida es el máximo de ambas para asegurar que el tablero quepa por completo
        const requiredZ = Math.max(requiredZHeight, requiredZWidth);

        const marginMultiplier = isMobileDevice ? 1.22 : 1.18;
        const targetZ = Math.max(isMobileDevice ? 3.0 : 5.0, requiredZ * marginMultiplier);
        const targetY = isMobileDevice ? -0.38 : -0.25; // Centrado ligeramente ajustado para maximizar espacio vertical y separar los botones

        // Interpolación suave de la posición de la cámara (Parallax)
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, x * 0.35, 8 * safeDelta);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY + y * 0.28, 8 * safeDelta);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 8 * safeDelta);

        // Apuntar suavemente al centro del tablero
        camera.lookAt(0, 0, 0);
    });

    return null;
}

// --- COMPONENTE DE SLOTS INDICADORES EN EL DOCK 3D ---
interface DockSlotsProps {
    dockY: number;
    accentColor: string;
}

function DockSlots({ dockY, accentColor }: DockSlotsProps) {
    const slotsX = [-1.30, 0, 1.30];

    // Crear textura del rectángulo segmentado para la ranura del dock en 3D
    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, 128, 128);
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 6;
            ctx.setLineDash([12, 12]);
            ctx.strokeRect(6, 6, 116, 116);
        }
        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }, [accentColor]);

    return (
        <group>
            {slotsX.map((posX, idx) => (
                <mesh key={idx} position={[posX, dockY, 0.01]} receiveShadow>
                    <planeGeometry args={[0.96, 1.04]} />
                    <meshStandardMaterial
                        map={texture}
                        transparent
                        opacity={0.3}
                        roughness={0.9}
                        metalness={0.1}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

// --- COMPONENTE DE EXPLOSIÓN DIGITAL DE TIPO GLITCH BRUTALISTA ---
interface Particle {
    pos: [number, number, number];
    vel: [number, number, number];
    rot: [number, number, number];
    rotVel: [number, number, number];
    scale: number;
    shape: 'pixel' | 'bar';
}

interface ExplosionProps {
    position: [number, number, number];
    color: string;
    onComplete: () => void;
}

function MatchExplosion({ position, color, onComplete }: ExplosionProps) {
    const groupRef = useRef<THREE.Group>(null);
    const flashRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);

    // Barras de glitch horizontales y verticales (efecto screen tear)
    const hBarRef = useRef<THREE.Mesh>(null);
    const vBarRef = useRef<THREE.Mesh>(null);

    const ageRef = useRef(0);
    const duration = 0.45; // Animación corta y ultra responsiva

    // Generar fragmentos cuadriculados y barras (pixel glitch brutalista)
    const particles = useMemo(() => {
        const arr: Particle[] = [];
        for (let i = 0; i < 35; i++) {
            const theta = Math.random() * Math.PI * 2;
            const speed = 4.0 + Math.random() * 6.5; // Expansión rápida y enérgica

            // Movimiento alineado al plano cartesiano
            const velX = Math.cos(theta) * speed;
            const velY = Math.sin(theta) * speed;
            const velZ = (Math.random() - 0.5) * 1.5;

            arr.push({
                pos: [...position],
                vel: [velX, velY, velZ],
                rot: [0, 0, Math.random() * Math.PI],
                rotVel: [0, 0, (Math.random() - 0.5) * 25],
                scale: 0.04 + Math.random() * 0.10,
                shape: Math.random() > 0.4 ? 'pixel' : 'bar'
            });
        }
        return arr;
    }, [position]);

    useFrame((state, delta) => {
        const safeDelta = Math.min(delta, 0.1);
        ageRef.current += safeDelta;

        if (ageRef.current >= duration) {
            onComplete();
            return;
        }

        const progress = 1 - (ageRef.current / duration);
        const time = state.clock.elapsedTime;

        // Efecto glitch: parpadeos de alta frecuencia (RGB shift / signal loss simulation)
        const isGlitchActive = Math.sin(time * 95) > 0.15;
        const glitchColor = Math.sin(time * 140) > 0 ? color : (color === '#ffd700' ? '#ff00ff' : '#00ffff');

        // Luz parpadeante
        if (lightRef.current) {
            lightRef.current.intensity = isGlitchActive ? progress * 25 : progress * 5;
            lightRef.current.color.set(glitchColor);
        }

        // Esfera central destellante deformada
        if (flashRef.current) {
            const flashScale = 0.05 + (ageRef.current / 0.15) * 2.8;
            flashRef.current.scale.set(
                flashScale * (1 + (isGlitchActive ? 0.5 : 0)),
                flashScale * (1 - (isGlitchActive ? 0.4 : 0)),
                flashScale
            );
            const flashMat = flashRef.current.material as THREE.MeshStandardMaterial;
            if (flashMat) {
                flashMat.opacity = progress * (isGlitchActive ? 0.95 : 0.3);
                flashMat.emissive.set(glitchColor);
                flashMat.emissiveIntensity = progress * 4.0;
            }
        }

        // Shockwave de anillo cuadrado (4 segmentos)
        if (ringRef.current) {
            const ringScale = 0.1 + (ageRef.current / duration) * 5.2;
            ringRef.current.scale.set(
                ringScale * (isGlitchActive ? 1.25 : 1.0),
                ringScale * (isGlitchActive ? 0.85 : 1.0),
                1
            );
            const ringMat = ringRef.current.material as THREE.MeshBasicMaterial;
            if (ringMat) {
                ringMat.opacity = progress * 0.9;
                ringMat.color.set(glitchColor);
            }
        }

        // Animación de la barra de interferencia horizontal (Scanline glitch horizontal)
        if (hBarRef.current) {
            const hScaleX = 0.2 + (ageRef.current / duration) * 9.0;
            hBarRef.current.scale.set(hScaleX, 1 + (isGlitchActive ? 3.0 : 0), 1);
            hBarRef.current.position.y = position[1] + (isGlitchActive ? (Math.random() - 0.5) * 0.35 : 0);
            const mat = hBarRef.current.material as THREE.MeshBasicMaterial;
            if (mat) {
                mat.opacity = progress * 0.75;
                mat.color.set(glitchColor);
            }
        }

        // Animación de la barra de interferencia vertical (Scanline glitch vertical)
        if (vBarRef.current) {
            const vScaleY = 0.2 + (ageRef.current / duration) * 9.0;
            vBarRef.current.scale.set(1 + (isGlitchActive ? 3.0 : 0), vScaleY, 1);
            vBarRef.current.position.x = position[0] + (isGlitchActive ? (Math.random() - 0.5) * 0.35 : 0);
            const mat = vBarRef.current.material as THREE.MeshBasicMaterial;
            if (mat) {
                mat.opacity = progress * 0.75;
                mat.color.set(glitchColor);
            }
        }

        // Partículas (Pixeles y Barras de datos)
        if (groupRef.current) {
            const meshes = groupRef.current.children;

            particles.forEach((p, idx) => {
                const mesh = meshes[idx] as THREE.Mesh;
                if (mesh) {
                    p.pos[0] += p.vel[0] * safeDelta;
                    p.pos[1] += p.vel[1] * safeDelta;
                    p.pos[2] += p.vel[2] * safeDelta;

                    // Fricción digital
                    p.vel[0] *= 0.94;
                    p.vel[1] *= 0.94;
                    p.vel[2] *= 0.94;

                    // Desplazamiento digital glitch aleatorio
                    if (isGlitchActive && Math.random() < 0.25) {
                        p.pos[0] += (Math.random() - 0.5) * 0.18;
                        p.pos[1] += (Math.random() - 0.5) * 0.18;
                    }

                    p.rot[2] += p.rotVel[2] * safeDelta;

                    mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
                    mesh.rotation.set(p.rot[0], p.rot[1], p.rot[2]);

                    // Escala no uniforme distorsionada estilo pixel art glitcheado
                    const baseScale = p.scale * progress;
                    mesh.scale.set(
                        baseScale * (Math.random() < 0.12 ? 3.5 : 1.0),
                        baseScale * (Math.random() < 0.12 ? 0.25 : 1.0),
                        baseScale
                    );

                    const mat = mesh.material as THREE.MeshStandardMaterial;
                    if (mat) {
                        mat.opacity = progress;
                        mat.emissive.set(glitchColor);
                        mat.emissiveIntensity = progress * 3.5;
                    }
                }
            });
        }
    });

    return (
        <group>
            {/* Destello de luz dinámica de glitch */}
            <pointLight
                ref={lightRef}
                position={position}
                color={color}
                intensity={16}
                distance={6.5}
                decay={2.2}
            />

            {/* Núcleo digital de glitch */}
            <mesh ref={flashRef} position={position}>
                <sphereGeometry args={[0.45, 8, 8]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive={color}
                    emissiveIntensity={2.5}
                    transparent
                    opacity={0.8}
                    depthWrite={false}
                />
            </mesh>

            {/* Anillo de onda digital segmentado (Cuadrado, 4 segmentos) */}
            <mesh ref={ringRef} position={[position[0], position[1], position[2] + 0.02]}>
                <ringGeometry args={[0.06, 0.45, 4]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.85}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Interferencia horizontal (scanline glitch) */}
            <mesh ref={hBarRef} position={[position[0], position[1], position[2] + 0.015]}>
                <planeGeometry args={[1.2, 0.03]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.7}
                    depthWrite={false}
                />
            </mesh>

            {/* Interferencia vertical (scanline glitch) */}
            <mesh ref={vBarRef} position={[position[0], position[1], position[2] + 0.015]}>
                <planeGeometry args={[0.03, 1.2]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.7}
                    depthWrite={false}
                />
            </mesh>

            {/* Grupo de pixeles y tiras de glitch */}
            <group ref={groupRef}>
                {particles.map((p, idx) => (
                    <mesh key={idx}>
                        {p.shape === 'pixel' ? (
                            <boxGeometry args={[0.08, 0.08, 0.08]} />
                        ) : (
                            <boxGeometry args={[0.22, 0.02, 0.005]} />
                        )}
                        <meshStandardMaterial
                            color={color}
                            emissive={color}
                            emissiveIntensity={1.8}
                            roughness={0.1}
                            metalness={0.8}
                            transparent
                            depthWrite={false}
                        />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

interface MahjongCanvasProps {
    tiles: TileState[];
    freeTilesMap: Map<string, boolean>;
    dockIds: string[];
    onTilePointerDown: (id: string) => void;
    isMobile: boolean;
    ghostSolidIds?: Set<string>;
    hasStarted: boolean;
}

export function MahjongCanvas({ tiles, freeTilesMap, dockIds, onTilePointerDown, isMobile, ghostSolidIds, hasStarted }: MahjongCanvasProps) {
    const { profile } = useProfile();
    const [explosions, setExplosions] = useState<{ id: string; pos: [number, number, number]; color: string }[]>([]);
    const prevMatchedIdsRef = useRef<Set<string>>(new Set());

    // En 3D ya no filtramos las fichas en el dock de la pantalla del tablero; dejamos que LERPeen libremente hacia el Dock 3D
    const visibleTiles = useMemo(() => {
        return tiles.filter(t => !t.isMatched);
    }, [tiles]);

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

        const spacingX = 0.49;
        const spacingY = 0.53;
        const tileWidth = 0.96;
        const tileHeight = 1.04;

        // Use fixed bounds of 14 columns (width) and 14 rows (height) to keep camera zoom and dock positioning constant across all layouts (strictly 8x8)
        const fixedCols = 14;
        const fixedRows = 14;

        const width = fixedCols * spacingX + tileWidth;
        const height = fixedRows * spacingY + tileHeight;

        // Espacio libre físico constante entre el tablero y el dock (reducido en móvil para ganar espacio y zoom)
        const gap = isMobile ? 0.35 : 0.7;
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

    // Detectar coincidencias y lanzar explosiones
    useEffect(() => {
        const newlyMatched = tiles.filter(t => t.isMatched && !prevMatchedIdsRef.current.has(t.id));
        if (newlyMatched.length > 0) {
            const rawAccentColor = profile === 'ella' ? '#ff4b89' : '#e1ff80';

            const spacingX = 0.49;
            const spacingY = 0.53;
            const spacingZ = 0.24;

            const newExplosions = newlyMatched.map(tile => {
                // Verificar si la ficha estaba en el dock antes del emparejamiento para detonar la explosión allí
                const dockIndex = prevDockIdsRef.current.indexOf(tile.id);
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
                    color: tile.content.type === 'custom' ? '#ffd700' : rawAccentColor
                };
            });

            setExplosions(prev => [...prev, ...newExplosions]);
        }

        prevMatchedIdsRef.current = new Set(tiles.filter(t => t.isMatched).map(t => t.id));
        prevDockIdsRef.current = [...dockIds];
    }, [tiles, dockIds, centerX, centerY, boardY, dockY, profile]);

    const rawAccentColor = profile === 'ella' ? '#ff4b89' : '#e1ff80';

    return (
        <div className="relative h-full w-full select-none" style={{ minHeight: isMobile ? '400px' : '520px' }}>
            <Canvas
                shadows={{ type: THREE.PCFShadowMap }} // Se define tipo de shadow map explícito para eliminar warning de deprecación de PCFSoftShadowMap
                camera={{ fov: 50, position: [0, -0.6, 6.2], near: 0.1, far: 50 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                {/* Rig de Cámara Adaptativo Cenital con Parallax */}
                <CameraRig boardWidth={boardWidth} boardHeight={boardHeight} />

                {/* Slots del Dock 3D dibujados en escena */}
                <DockSlots dockY={dockY} accentColor={rawAccentColor} />

                {/* Iluminación Estética */}
                <ambientLight intensity={0.65} />

                {/* Luz Principal (Sombras dinámicas) */}
                <directionalLight
                    position={[2, 14, 4]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                    shadow-camera-far={20}
                    shadow-camera-left={-7}
                    shadow-camera-right={7}
                    shadow-camera-top={6}
                    shadow-camera-bottom={-6}
                    shadow-bias={-0.0006}
                />

                {/* Luz de Contorno / Relleno Púrpura */}
                <directionalLight
                    position={[-5, -4, 4]}
                    intensity={0.6}
                    color={profile === 'ella' ? '#ff8fb2' : '#d2f960'}
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
                            onComplete={() => setExplosions(prev => prev.filter(e => e.id !== exp.id))}
                        />
                    ))}
                </group>
            </Canvas>
        </div>
    );
}
