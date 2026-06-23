'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TileState } from './MahjongTile';
import { useProfile } from '@/context/ProfileContext';

// Hook interno para cargar y formatear texturas en canvas 2D con bordes brutalistas no-planos
function useTileTexture(tile: TileState, accentColor: string) {
    const [texture, setTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        let active = true;
        let tex: THREE.CanvasTexture | null = null;

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const isGolden = tile.content.type === 'custom';

        // Función reutilizable para dibujar bordes y esquinas de estilo retro-cyber HUD super delgados y detallados
        const drawBordersAndTicks = (golden: boolean) => {
            if (golden) {
                // Borde exterior delgado dorado
                ctx.strokeStyle = '#937500';
                ctx.lineWidth = 4;
                ctx.strokeRect(4, 4, 248, 248);

                // Borde interior extra fino dorado brillante
                ctx.strokeStyle = '#d4af37';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(12, 12, 232, 232);

                // Corchetes de esquina ultra delgados y estilizados
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(12, 22); ctx.lineTo(12, 12); ctx.lineTo(22, 12);
                ctx.moveTo(244, 22); ctx.lineTo(244, 12); ctx.lineTo(234, 12);
                ctx.moveTo(12, 234); ctx.lineTo(12, 244); ctx.lineTo(22, 244);
                ctx.moveTo(244, 234); ctx.lineTo(244, 244); ctx.lineTo(234, 244);
                ctx.stroke();

                // Ticks tácticos HUD minimalistas en los bordes
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(125, 4, 6, 2);
                ctx.fillRect(125, 250, 6, 2);
                ctx.fillRect(4, 125, 2, 6);
                ctx.fillRect(250, 125, 2, 6);
            } else {
                // Borde exterior delgado color neón
                ctx.strokeStyle = accentColor;
                ctx.lineWidth = 4;
                ctx.strokeRect(4, 4, 248, 248);

                // Borde interior extra fino semi-transparente
                ctx.strokeStyle = accentColor + '66';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(12, 12, 232, 232);

                // Corchetes de esquina ultra delgados y estilizados
                ctx.strokeStyle = accentColor;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(12, 22); ctx.lineTo(12, 12); ctx.lineTo(22, 12);
                ctx.moveTo(244, 22); ctx.lineTo(244, 12); ctx.lineTo(234, 12);
                ctx.moveTo(12, 234); ctx.lineTo(12, 244); ctx.lineTo(22, 244);
                ctx.moveTo(244, 234); ctx.lineTo(244, 244); ctx.lineTo(234, 244);
                ctx.stroke();

                // Ticks tácticos HUD minimalistas en los bordes
                ctx.fillStyle = accentColor;
                ctx.fillRect(125, 4, 6, 2);
                ctx.fillRect(125, 250, 6, 2);
                ctx.fillRect(4, 125, 2, 6);
                ctx.fillRect(250, 125, 2, 6);
            }
        };

        if (tile.content.type === 'traditional') {
            // Fondo
            if (isGolden) {
                const goldGrad = ctx.createLinearGradient(0, 0, 256, 256);
                goldGrad.addColorStop(0, '#ffe57f');
                goldGrad.addColorStop(0.4, '#ffea9f');
                goldGrad.addColorStop(0.7, '#ffd700');
                goldGrad.addColorStop(1, '#b29300');
                ctx.fillStyle = goldGrad;
                ctx.fillRect(0, 0, 256, 256);
            } else {
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(0, 0, 256, 256);
            }

            // Dibujar bordes con estética no-plana
            drawBordersAndTicks(isGolden);

            const emoji = tile.content.value;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Fuente estándar para que el navegador aplique fallbacks de emojis automáticamente
            const fontStack = 'bold 120px sans-serif';

            // Colores especiales clásicos ajustados para alto contraste neón sobre fondo negro
            if (emoji === '🀄') {
                ctx.fillStyle = '#ff5c5c'; // Dragón Rojo neón
                ctx.font = fontStack;
            } else if (emoji === '🀅') {
                ctx.fillStyle = '#5cff8e'; // Dragón Verde neón
                ctx.font = fontStack;
            } else if (emoji === '🀆') {
                ctx.fillStyle = '#5cc6ff'; // Dragón Blanco / Cuadro
                ctx.font = fontStack;
            } else {
                // Color por defecto en blanco brutalista
                ctx.fillStyle = '#ffffff';
                ctx.font = fontStack;
            }
            ctx.fillText(emoji, 128, 128);

            if (active) {
                tex = new THREE.CanvasTexture(canvas);
                tex.colorSpace = THREE.SRGBColorSpace;
                setTexture(tex);
            }
        } else {
            // Cargar imagen personalizada (Supabase o Local)
            const img = new Image();
            const isLocal = tile.content.value.startsWith('/');

            // Definir handlers de carga ANTES de establecer src para evitar condiciones de carrera por caché
            img.onload = () => {
                if (!active) return;

                // Redibujar fondo
                if (isGolden) {
                    const goldGrad = ctx.createLinearGradient(0, 0, 256, 256);
                    goldGrad.addColorStop(0, '#ffe57f');
                    goldGrad.addColorStop(0.4, '#ffea9f');
                    goldGrad.addColorStop(0.7, '#ffd700');
                    goldGrad.addColorStop(1, '#b29300');
                    ctx.fillStyle = goldGrad;
                    ctx.fillRect(0, 0, 256, 256);
                } else {
                    ctx.fillStyle = '#0a0a0a';
                    ctx.fillRect(0, 0, 256, 256);
                }

                // Dibujar imagen con recorte tipo 'cover' ajustado para dejar espacio a la doble línea de borde delgada (maximizando la imagen)
                const margin = 14;
                const size = 228;

                const imgRatio = img.width / img.height;
                let sWidth = img.width;
                let sHeight = img.height;
                let sx = 0;
                let sy = 0;

                if (imgRatio > 1) {
                    sWidth = img.height;
                    sx = (img.width - sWidth) / 2;
                } else {
                    sHeight = img.width;
                    sy = (img.height - sHeight) / 2;
                }

                ctx.drawImage(img, sx, sy, sWidth, sHeight, margin, margin, size, size);

                // Aplicar el marco de borde y las marcas visuales por encima
                drawBordersAndTicks(isGolden);

                tex = new THREE.CanvasTexture(canvas);
                tex.colorSpace = THREE.SRGBColorSpace;
                setTexture(tex);
            };

            img.onerror = () => {
                if (!active) return;

                // Placeholder visual en caso de error
                if (isGolden) {
                    const goldGrad = ctx.createLinearGradient(0, 0, 256, 256);
                    goldGrad.addColorStop(0, '#ffe57f');
                    goldGrad.addColorStop(0.7, '#ffd700');
                    goldGrad.addColorStop(1, '#b29300');
                    ctx.fillStyle = goldGrad;
                    ctx.fillRect(0, 0, 256, 256);
                } else {
                    ctx.fillStyle = '#0a0a0a';
                    ctx.fillRect(0, 0, 256, 256);
                }

                drawBordersAndTicks(isGolden);

                ctx.fillStyle = isGolden ? '#937500' : '#e74c3c';
                ctx.font = 'bold 120px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(isGolden ? '✨' : '🖼️', 128, 128);

                tex = new THREE.CanvasTexture(canvas);
                tex.colorSpace = THREE.SRGBColorSpace;
                setTexture(tex);
            };

            // Establecer src AL FINAL para iniciar la descarga de forma segura
            if (!isLocal) {
                img.src = `/api/proxy-image?url=${encodeURIComponent(tile.content.value)}`;
            } else {
                img.src = tile.content.value;
            }
        }

        return () => {
            active = false;
            if (tex) {
                tex.dispose();
            }
        };
    }, [tile.content.value, tile.content.type, accentColor]);

    return texture;
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
}

export function Tile3D({ tile, isFree, centerX, centerY, boardY, dockY, dockIds, onSelect }: Tile3DProps) {
    const { profile } = useProfile();
    const meshRef = useRef<THREE.Group>(null);
    const frontMeshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    // Colores de acento según perfil
    const rawAccentColor = profile === 'ella' ? '#ff4b89' : '#e1ff80'; // Fucsia o Neón
    const backColor = profile === 'ella' ? '#c83b6b' : '#a1c24a';       // Capa trasera del Mahjong

    const texture = useTileTexture(tile, rawAccentColor);
    const isGolden = tile.content.type === 'custom';

    // Spacing en 3D para mapear el grid discreto (2x2 unidades lógicas por ficha)
    // Rediseño de proporciones: fichas menos altas / más anchas (ancho: 0.96, alto: 1.04)
    // Spacing ajustado matemáticamente a 0.49 en X y 0.53 en Y para mantener un espaciado brutalista perfecto
    const spacingX = 0.49;
    const spacingY = 0.53;
    const spacingZ = 0.16;

    // Calcular posición base en el tablero
    const posX = (tile.x - centerX) * spacingX;
    const posY = boardY - (tile.y - centerY) * spacingY;
    const baseZ = tile.z * spacingZ;

    // Detectar si la ficha está en el dock y obtener su índice
    const dockIndex = dockIds.indexOf(tile.id);
    const isInDock = dockIndex !== -1;
    const isBright = isFree || isInDock; // Las fichas en el dock no deben verse opacas ni translúcidas

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
    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Limitar delta para evitar saltos bruscos en caídas de frame
        const safeDelta = Math.min(delta, 0.1);
        const time = state.clock.elapsedTime;

        // Si es una ficha dorada libre, flotar suavemente arriba y abajo
        if (isGolden && isFree && !isInDock) {
            targetZ += Math.sin(time * 4) * 0.04;
        }

        // Interpolación LERP de posición en los 3 ejes (funciona para ir y volver del dock)
        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 11 * safeDelta);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 11 * safeDelta);
        meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 11 * safeDelta);

        // Rotación LERP (los del dock se alinean planos)
        const targetRotX = isInDock ? 0 : tile.isSelected ? -0.1 : 0;
        let targetRotY = isInDock ? 0 : tile.isSelected ? 0.08 : hovered && isFree ? 0.04 : 0;
        
        // Si es dorada y seleccionada, aplicar un suave bamboleo de rotación
        if (isGolden && tile.isSelected) {
            targetRotY += Math.sin(time * 6) * 0.15;
        }

        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotX, 9 * safeDelta);
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotY, 9 * safeDelta);

        // LERP de escala
        const targetScale = 1.0;
        meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 10 * safeDelta));

        // Animación de pulso luminiscente en el Mesh frontal
        if (frontMeshRef.current) {
            const materials = frontMeshRef.current.material as THREE.MeshStandardMaterial[];
            if (materials && materials.length >= 6) {
                // Material frontal (índice 4)
                const frontMat = materials[4];
                
                // Asegurar opacidad al 100%
                materials.forEach(m => { if (m) m.opacity = 1.0; });

                if (tile.isHinted) {
                    const clockTime = state.clock.elapsedTime;
                    const pulse = Math.sin(clockTime * 9) * 0.35 + 0.35; // Rango: 0.0 - 0.7
                    frontMat.emissive.set(rawAccentColor);
                    frontMat.emissiveIntensity = pulse;
                } else if (tile.isSelected) {
                    frontMat.emissive.set(rawAccentColor);
                    frontMat.emissiveIntensity = 0.25;
                } else if (isGolden && isFree && !isInDock) {
                    // Brillo emisivo dorado constante en fichas doradas libres
                    const shimmer = Math.sin(time * 3) * 0.12 + 0.18; // Rango: 0.06 - 0.3
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
            {/* Sobresale ligeramente para dar un detalle visual 3D escalonado (stepped lip) que atrapa la luz */}
            <mesh
                castShadow
                receiveShadow
                position={[0, 0, -0.045]}
            >
                <boxGeometry args={[0.96, 1.04, 0.06]} />
                <meshStandardMaterial
                    color={isGolden ? '#ffd700' : isBright ? backColor : '#323232'}
                    roughness={isGolden ? 0.15 : 0.3}
                    metalness={isGolden ? 0.95 : 0.3}
                    transparent
                    opacity={isBright ? 1.0 : 0.45}
                />
            </mesh>

            {/* 2. PLACA FRONTAL (Mosaico de Juego principal) */}
            {/* Ligeramente más pequeño en ancho y alto (0.90 x 0.98) para generar el relieve 3D brutalista */}
            <mesh
                ref={frontMeshRef}
                castShadow
                receiveShadow
                position={[0, 0, 0.03]}
            >
                <boxGeometry args={[0.90, 0.98, 0.09]} />
                
                {/* Laterales (Índices 0-3): Cerámica carbón brutalista u oro metálico */}
                <meshStandardMaterial
                    attach="material-0"
                    color={isGolden ? '#ffd700' : isBright ? '#161616' : '#0d0d0d'}
                    roughness={isGolden ? 0.15 : 0.4}
                    metalness={isGolden ? 0.95 : 0.1}
                    transparent
                    opacity={isBright ? 1.0 : 0.45}
                />
                <meshStandardMaterial
                    attach="material-1"
                    color={isGolden ? '#ffd700' : isBright ? '#161616' : '#0d0d0d'}
                    roughness={isGolden ? 0.15 : 0.4}
                    metalness={isGolden ? 0.95 : 0.1}
                    transparent
                    opacity={isBright ? 1.0 : 0.45}
                />
                <meshStandardMaterial
                    attach="material-2"
                    color={isGolden ? '#ffd700' : isBright ? '#161616' : '#0d0d0d'}
                    roughness={isGolden ? 0.15 : 0.4}
                    metalness={isGolden ? 0.95 : 0.1}
                    transparent
                    opacity={isBright ? 1.0 : 0.45}
                />
                <meshStandardMaterial
                    attach="material-3"
                    color={isGolden ? '#ffd700' : isBright ? '#161616' : '#0d0d0d'}
                    roughness={isGolden ? 0.15 : 0.4}
                    metalness={isGolden ? 0.95 : 0.1}
                    transparent
                    opacity={isBright ? 1.0 : 0.45}
                />
                
                {/* Cara Frontal (+Z, Índice 4): Textura con el símbolo o foto */}
                <meshStandardMaterial
                    key={texture ? 'loaded' : 'loading'}
                    attach="material-4"
                    map={texture || undefined}
                    color={isBright ? '#ffffff' : '#777777'}
                    roughness={0.15}
                    metalness={isGolden ? 0.5 : 0.05}
                    transparent
                    opacity={isBright ? 1.0 : 0.4}
                />

                {/* Cara Trasera (-Z, Índice 5): Acoplado al cuerpo, color oscuro interno */}
                <meshStandardMaterial
                    attach="material-5"
                    color={isGolden ? '#ffd700' : isBright ? '#161616' : '#0d0d0d'}
                    roughness={isGolden ? 0.15 : 0.4}
                    metalness={isGolden ? 0.95 : 0.1}
                    transparent
                    opacity={isBright ? 1.0 : 0.45}
                />
            </mesh>
        </group>
    );
}
