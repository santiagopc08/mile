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
        camera.position.x = THREE.MathUtils.damp(camera.position.x, x * 0.35, 8, safeDelta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY + y * 0.28, 8, safeDelta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 8, safeDelta);

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
                    <planeGeometry args={[0.82, 1.16]} />
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
    life: number;
    delay: number;
    shape: 'spark' | 'ember' | 'bar';
}

interface ExplosionProps {
    position: [number, number, number];
    color: string;
    combo: number;
    onComplete: () => void;
}

function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3);
}

function FlameBurst({ position, combo, color }: { position: [number, number, number]; combo: number; color: string }) {
    const flameRef = useRef<THREE.Group>(null);
    const flameCount = Math.min(12, 3 + combo * 2);

    const flames = useMemo(() => {
        return Array.from({ length: flameCount }, (_, idx) => {
            const angle = (idx / flameCount) * Math.PI * 2 + Math.random() * 0.45;
            const radius = 0.18 + Math.random() * 0.38;
            return {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                z: 0.08 + Math.random() * 0.18,
                scale: 0.32 + Math.random() * 0.22 + combo * 0.025,
                phase: Math.random() * Math.PI * 2,
                height: 0.55 + Math.random() * 0.35 + combo * 0.035
            };
        });
    }, [combo, flameCount]);

    useFrame((state) => {
        if (!flameRef.current) return;
        const time = state.clock.elapsedTime;
        flameRef.current.children.forEach((child, idx) => {
            const flame = flames[idx];
            const pulse = 1 + Math.sin(time * 8 + flame.phase) * 0.16;
            child.scale.set(flame.scale * pulse, flame.height * pulse, flame.scale);
            child.position.z = flame.z + Math.sin(time * 5 + flame.phase) * 0.035;
            child.rotation.z = Math.sin(time * 4 + flame.phase) * 0.18;
        });
    });

    return (
        <group ref={flameRef} position={position}>
            {flames.map((flame, idx) => (
                <mesh key={idx} position={[flame.x, flame.y, flame.z]} rotation={[0, 0, flame.phase]}>
                    <coneGeometry args={[0.15, 0.75, 5, 1, true]} />
                    <meshBasicMaterial
                        color={idx % 3 === 0 ? '#fff3a3' : idx % 3 === 1 ? '#ff8a00' : color}
                        transparent
                        opacity={0.58}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            ))}
        </group>
    );
}

function MatchExplosion({ position, color, combo, onComplete }: ExplosionProps) {
    const groupRef = useRef<THREE.Group>(null);
    const flashRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const haloRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);

    // Barras de glitch horizontales y verticales (efecto screen tear)
    const hBarRef = useRef<THREE.Mesh>(null);
    const vBarRef = useRef<THREE.Mesh>(null);

    const ageRef = useRef(0);
    const duration = Math.min(0.95, 0.62 + combo * 0.035);

    // Generar fragmentos cuadriculados y barras (pixel glitch brutalista)
    const particles = useMemo(() => {
        const arr: Particle[] = [];
        const count = Math.min(96, 46 + combo * 8);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const speed = 2.8 + Math.random() * (4.4 + combo * 0.22);

            const velX = Math.cos(theta) * speed;
            const velY = Math.sin(theta) * speed;
            const velZ = 0.25 + Math.random() * (1.2 + combo * 0.08);

            arr.push({
                pos: [...position],
                vel: [velX, velY, velZ],
                rot: [0, 0, Math.random() * Math.PI],
                rotVel: [0, 0, (Math.random() - 0.5) * 14],
                scale: 0.035 + Math.random() * 0.085,
                life: 0.65 + Math.random() * 0.35,
                delay: Math.random() * 0.13,
                shape: Math.random() > 0.72 ? 'bar' : Math.random() > 0.45 ? 'ember' : 'spark'
            });
        }
        return arr.sort((a, b) => a.delay - b.delay);
    }, [position, combo]);

    useFrame((state, delta) => {
        const safeDelta = Math.min(delta, 0.033);
        ageRef.current += safeDelta;

        if (ageRef.current >= duration) {
            onComplete();
            return;
        }

        const elapsed = ageRef.current;
        const lifeProgress = Math.min(1, elapsed / duration);
        const progress = 1 - lifeProgress;
        const eased = easeOutCubic(lifeProgress);
        const time = state.clock.elapsedTime;

        const flameColor = combo >= 3 ? '#ff6a00' : color;
        const accentPulse = 0.86 + Math.sin(time * 18) * 0.14;

        // Luz parpadeante
        if (lightRef.current) {
            lightRef.current.intensity = progress * (18 + combo * 4) * accentPulse;
            lightRef.current.color.set(flameColor);
        }

        if (flashRef.current) {
            const flashScale = 0.12 + eased * (1.7 + combo * 0.14);
            flashRef.current.scale.set(flashScale, flashScale, flashScale);
            const flashMat = flashRef.current.material as THREE.MeshStandardMaterial;
            if (flashMat) {
                flashMat.opacity = progress * 0.55;
                flashMat.emissive.set(flameColor);
                flashMat.emissiveIntensity = progress * (3.5 + combo * 0.3);
            }
        }

        if (ringRef.current) {
            const ringScale = 0.25 + eased * (4.5 + combo * 0.32);
            ringRef.current.scale.set(ringScale, ringScale, 1);
            const ringMat = ringRef.current.material as THREE.MeshBasicMaterial;
            if (ringMat) {
                ringMat.opacity = progress * 0.72;
                ringMat.color.set(flameColor);
            }
        }

        if (haloRef.current) {
            const haloScale = 0.2 + eased * (2.8 + combo * 0.24);
            haloRef.current.scale.set(haloScale * 1.18, haloScale, 1);
            haloRef.current.rotation.z = time * 0.7;
            const haloMat = haloRef.current.material as THREE.MeshBasicMaterial;
            if (haloMat) {
                haloMat.opacity = progress * 0.34;
                haloMat.color.set(color);
            }
        }

        if (hBarRef.current) {
            const hScaleX = 0.25 + eased * (5.0 + combo * 0.35);
            hBarRef.current.scale.set(hScaleX, 1 + Math.sin(time * 16) * 0.25, 1);
            const mat = hBarRef.current.material as THREE.MeshBasicMaterial;
            if (mat) {
                mat.opacity = progress * 0.42;
                mat.color.set(flameColor);
            }
        }

        if (vBarRef.current) {
            const vScaleY = 0.25 + eased * (5.0 + combo * 0.35);
            vBarRef.current.scale.set(1 + Math.cos(time * 15) * 0.2, vScaleY, 1);
            const mat = vBarRef.current.material as THREE.MeshBasicMaterial;
            if (mat) {
                mat.opacity = progress * 0.36;
                mat.color.set(flameColor);
            }
        }

        if (groupRef.current) {
            const meshes = groupRef.current.children;

            particles.forEach((p, idx) => {
                const mesh = meshes[idx] as THREE.Mesh;
                if (mesh) {
                    const localAge = Math.max(0, elapsed - p.delay);
                    const localProgress = Math.min(1, localAge / (duration * p.life));
                    const localEase = easeOutCubic(localProgress);
                    const visible = localAge > 0 && localProgress < 1;

                    p.pos[0] += p.vel[0] * safeDelta;
                    p.pos[1] += p.vel[1] * safeDelta;
                    p.pos[2] += p.vel[2] * safeDelta;

                    p.vel[0] *= 0.982;
                    p.vel[1] *= 0.982;
                    p.vel[2] = p.vel[2] * 0.965 - safeDelta * 1.6;

                    p.rot[2] += p.rotVel[2] * safeDelta;

                    mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
                    mesh.rotation.set(p.rot[0], p.rot[1], p.rot[2]);

                    const particleFade = visible ? Math.sin(localEase * Math.PI) * (1 - localProgress * 0.35) : 0;
                    const baseScale = p.scale * particleFade * (1 + combo * 0.045);
                    const stretch = p.shape === 'bar' ? 3.2 : p.shape === 'ember' ? 1.45 : 1.0;
                    mesh.scale.set(baseScale * stretch, baseScale * (p.shape === 'bar' ? 0.35 : 1.0), baseScale);

                    const mat = mesh.material as THREE.MeshStandardMaterial;
                    if (mat) {
                        mat.opacity = particleFade;
                        mat.emissive.set(p.shape === 'ember' ? '#ff7a00' : flameColor);
                        mat.emissiveIntensity = particleFade * (2.4 + combo * 0.2);
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
                distance={7.5 + combo * 0.5}
                decay={2.2}
            />

            {/* Núcleo digital de glitch */}
            <mesh ref={flashRef} position={position}>
                <sphereGeometry args={[0.42, 16, 16]} />
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
                <ringGeometry args={[0.08, 0.42, 48]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.85}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            <mesh ref={haloRef} position={[position[0], position[1], position[2] + 0.018]}>
                <ringGeometry args={[0.16, 0.68, 64]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.3}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {combo >= 2 && <FlameBurst position={[position[0], position[1], position[2] + 0.15]} combo={combo} color={color} />}

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
                        {p.shape === 'spark' ? (
                            <sphereGeometry args={[0.08, 8, 8]} />
                        ) : p.shape === 'ember' ? (
                            <sphereGeometry args={[0.07, 8, 8]} />
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
    streakCombo?: number;
}

export function MahjongCanvas({ tiles, freeTilesMap, dockIds, onTilePointerDown, isMobile, ghostSolidIds, hasStarted, streakCombo = 0 }: MahjongCanvasProps) {
    const { profile } = useProfile();
    const [explosions, setExplosions] = useState<{ id: string; pos: [number, number, number]; color: string; combo: number }[]>([]);
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

    // Detectar coincidencias y lanzar explosiones
    useEffect(() => {
        const newlyMatched = tiles.filter(t => t.isMatched && !prevMatchedIdsRef.current.has(t.id));
        if (newlyMatched.length > 0) {
            const rawAccentColor = profile === 'ella' ? '#ff4b89' : '#e1ff80';

            const spacingX = 0.43;
            const spacingY = 0.59;
            const spacingZ = 0.34;

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
                    color: tile.content.type === 'custom' ? '#ffd700' : rawAccentColor,
                    combo: Math.max(1, streakCombo)
                };
            });

            setExplosions(prev => [...prev, ...newExplosions]);
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
