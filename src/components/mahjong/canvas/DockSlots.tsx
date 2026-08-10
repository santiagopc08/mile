import { useMemo } from 'react';
import * as THREE from 'three';

export interface DockSlotsProps {
    dockY: number;
    accentColor: string;
}

export function DockSlots({ dockY, accentColor }: DockSlotsProps) {
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
