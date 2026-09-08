'use client';

import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useProfile } from '@/context/ProfileContext';

import { BACK_GEOMETRY, FRONT_GEOMETRY } from "./mahjong/tile/Geometry";
import { useTileTexture } from "./mahjong/tile/useTileTexture";
import { Tile3DProps } from "./mahjong/tile/Types";
import { useTileAnimation } from "./mahjong/tile/useTileAnimation";

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

    // Animación suave extraída en un custom hook
    useTileAnimation({
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
