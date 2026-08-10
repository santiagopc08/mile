import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface Particle {
    pos: [number, number, number];
    vel: [number, number, number];
    rot: [number, number, number];
    rotVel: [number, number, number];
    scale: number;
    life: number;
    delay: number;
    shape: 'spark' | 'ember' | 'bar';
}

export interface ExplosionProps {
    position: [number, number, number];
    color: string;
    combo: number;
    onComplete: () => void;
}

export function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3);
}

export function FlameBurst({ position, combo, color }: { position: [number, number, number]; combo: number; color: string }) {
    const flameRef = useRef<THREE.Group>(null);
    const flameCount = Math.min(16, 4 + combo * 3);

    const flames = useMemo(() => {
        return Array.from({ length: flameCount }, (_, idx) => {
            const angle = (idx / flameCount) * Math.PI * 2 + Math.random() * 0.35;
            const radius = 0.22 + Math.random() * 0.45;
            return {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                z: 0.10 + Math.random() * 0.22,
                scale: 0.38 + Math.random() * 0.28 + combo * 0.035,
                phase: Math.random() * Math.PI * 2,
                height: 0.65 + Math.random() * 0.45 + combo * 0.05
            };
        });
    }, [combo, flameCount]);

    useFrame((state) => {
        if (!flameRef.current) return;
        const time = state.clock.elapsedTime;
        flameRef.current.children.forEach((child, idx) => {
            const flame = flames[idx];
            const pulse = 1 + Math.sin(time * 10 + flame.phase) * 0.22;
            child.scale.set(flame.scale * pulse, flame.height * pulse, flame.scale);
            child.position.z = flame.z + Math.sin(time * 6 + flame.phase) * 0.045;
            child.rotation.z = Math.sin(time * 5 + flame.phase) * 0.25;
        });
    });

    return (
        <group ref={flameRef} position={position}>
            {flames.map((flame, idx) => (
                <mesh key={idx} position={[flame.x, flame.y, flame.z]} rotation={[0, 0, flame.phase]}>
                    <coneGeometry args={[0.18, 0.85, 6, 1, true]} />
                    <meshBasicMaterial
                        color={idx % 3 === 0 ? '#fff5b8' : idx % 3 === 1 ? '#ff9d00' : combo >= 4 ? '#ff2e7e' : color}
                        transparent
                        opacity={0.72}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            ))}
        </group>
    );
}

export function MatchExplosion({ position, color, combo, onComplete }: ExplosionProps) {
    const groupRef = useRef<THREE.Group>(null);
    const flashRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const haloRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);

    // Barras de glitch horizontales y verticales (efecto screen tear)
    const hBarRef = useRef<THREE.Mesh>(null);
    const vBarRef = useRef<THREE.Mesh>(null);

    const ageRef = useRef(0);
    const duration = Math.min(1.1, 0.70 + combo * 0.04);

    // Generar fragmentos y chispas ardientes de alta velocidad
    const particles = useMemo(() => {
        const arr: Particle[] = [];
        const count = Math.min(110, 52 + combo * 10);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const speed = 3.2 + Math.random() * (5.2 + combo * 0.28);

            const velX = Math.cos(theta) * speed;
            const velY = Math.sin(theta) * speed;
            const velZ = 0.35 + Math.random() * (1.5 + combo * 0.12);

            arr.push({
                pos: [...position],
                vel: [velX, velY, velZ],
                rot: [0, 0, Math.random() * Math.PI],
                rotVel: [0, 0, (Math.random() - 0.5) * 16],
                scale: 0.04 + Math.random() * 0.095,
                life: 0.70 + Math.random() * 0.35,
                delay: Math.random() * 0.12,
                shape: Math.random() > 0.70 ? 'bar' : Math.random() > 0.40 ? 'ember' : 'spark'
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

        // Fuego incandescente solar o rosa deslumbrante en alto combo
        const flameColor = combo >= 5 ? '#ff2a75' : combo >= 3 ? '#ff7700' : color;
        const accentPulse = 0.88 + Math.sin(time * 20) * 0.12;

        // Luz parpadeante de estallido
        if (lightRef.current) {
            lightRef.current.intensity = progress * (24 + combo * 6) * accentPulse;
            lightRef.current.color.set(flameColor);
        }

        if (flashRef.current) {
            const flashScale = 0.15 + eased * (2.1 + combo * 0.18);
            flashRef.current.scale.set(flashScale, flashScale, flashScale);
            const flashMat = flashRef.current.material as THREE.MeshStandardMaterial;
            if (flashMat) {
                flashMat.opacity = progress * 0.75;
                flashMat.emissive.set(flameColor);
                flashMat.emissiveIntensity = progress * (4.2 + combo * 0.4);
            }
        }

        if (ringRef.current) {
            const ringScale = 0.28 + eased * (5.2 + combo * 0.4);
            ringRef.current.scale.set(ringScale, ringScale, 1);
            const ringMat = ringRef.current.material as THREE.MeshBasicMaterial;
            if (ringMat) {
                ringMat.opacity = progress * 0.85;
                ringMat.color.set(flameColor);
            }
        }

        if (haloRef.current) {
            const haloScale = 0.22 + eased * (3.2 + combo * 0.3);
            haloRef.current.scale.set(haloScale * 1.2, haloScale, 1);
            haloRef.current.rotation.z = time * 0.8;
            const haloMat = haloRef.current.material as THREE.MeshBasicMaterial;
            if (haloMat) {
                haloMat.opacity = progress * 0.45;
                haloMat.color.set(color);
            }
        }

        if (hBarRef.current) {
            const hScaleX = 0.28 + eased * (6.0 + combo * 0.4);
            hBarRef.current.scale.set(hScaleX, 1 + Math.sin(time * 18) * 0.3, 1);
            const mat = hBarRef.current.material as THREE.MeshBasicMaterial;
            if (mat) {
                mat.opacity = progress * 0.50;
                mat.color.set(flameColor);
            }
        }

        if (vBarRef.current) {
            const vScaleY = 0.28 + eased * (6.0 + combo * 0.4);
            vBarRef.current.scale.set(1 + Math.cos(time * 18) * 0.25, vScaleY, 1);
            const mat = vBarRef.current.material as THREE.MeshBasicMaterial;
            if (mat) {
                mat.opacity = progress * 0.45;
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

                    p.vel[0] *= 0.975;
                    p.vel[1] *= 0.975;
                    p.vel[2] = p.vel[2] * 0.950 - safeDelta * 2.2;

                    p.rot[2] += p.rotVel[2] * safeDelta;

                    mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
                    mesh.rotation.set(p.rot[0], p.rot[1], p.rot[2]);

                    const particleFade = visible ? Math.sin(localEase * Math.PI) * (1 - localProgress * 0.25) : 0;
                    const baseScale = p.scale * particleFade * (1 + combo * 0.05);
                    const stretch = p.shape === 'bar' ? 3.8 : p.shape === 'ember' ? 1.6 : 1.0;
                    mesh.scale.set(baseScale * stretch, baseScale * (p.shape === 'bar' ? 0.35 : 1.0), baseScale);

                    const mat = mesh.material as THREE.MeshStandardMaterial;
                    if (mat) {
                        mat.opacity = particleFade;
                        // Evolución de color por radiación de cuerpo negro (Incandescente -> Dorado -> Carmesí)
                        const emberColor = localProgress < 0.2 ? '#ffffff' : localProgress < 0.65 ? '#ffaa00' : '#cc1100';
                        mat.emissive.set(p.shape === 'ember' ? emberColor : flameColor);
                        mat.emissiveIntensity = particleFade * (3.5 + combo * 0.4);
                    }
                }
            });
        }
    });

    return (
        <group>
            {/* Destello de luz dinámica de estallido */}
            <pointLight
                ref={lightRef}
                position={position}
                color={color}
                intensity={22}
                distance={8.5 + combo * 0.6}
                decay={2.0}
            />

            {/* Núcleo resplandeciente blanco de choque */}
            <mesh ref={flashRef} position={position}>
                <sphereGeometry args={[0.48, 16, 16]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive={color}
                    emissiveIntensity={3.2}
                    transparent
                    opacity={0.9}
                    depthWrite={false}
                />
            </mesh>

            {/* Anillo de onda expansiva */}
            <mesh ref={ringRef} position={[position[0], position[1], position[2] + 0.02]}>
                <ringGeometry args={[0.09, 0.48, 48]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.9}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            <mesh ref={haloRef} position={[position[0], position[1], position[2] + 0.018]}>
                <ringGeometry args={[0.18, 0.75, 64]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.4}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {combo >= 2 && <FlameBurst position={[position[0], position[1], position[2] + 0.15]} combo={combo} color={color} />}

            {/* Interferencia horizontal (scanline glitch) */}
            <mesh ref={hBarRef} position={[position[0], position[1], position[2] + 0.015]}>
                <planeGeometry args={[1.4, 0.04]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.8}
                    depthWrite={false}
                />
            </mesh>

            {/* Interferencia vertical (scanline glitch) */}
            <mesh ref={vBarRef} position={[position[0], position[1], position[2] + 0.015]}>
                <planeGeometry args={[0.04, 1.4]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.8}
                    depthWrite={false}
                />
            </mesh>

            {/* Grupo de chispas y brasas 3D */}
            <group ref={groupRef}>
                {particles.map((p, idx) => (
                    <mesh key={idx}>
                        {p.shape === 'spark' ? (
                            <sphereGeometry args={[0.09, 8, 8]} />
                        ) : p.shape === 'ember' ? (
                            <sphereGeometry args={[0.08, 8, 8]} />
                        ) : (
                            <boxGeometry args={[0.25, 0.025, 0.006]} />
                        )}
                        <meshStandardMaterial
                            color={color}
                            emissive={color}
                            emissiveIntensity={2.2}
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
