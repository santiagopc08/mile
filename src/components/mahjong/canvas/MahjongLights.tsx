import React from 'react';

interface MahjongLightsProps {
    profile: string;
    accentColor: string;
}

export function MahjongLights({ profile, accentColor }: MahjongLightsProps) {
    return (
        <>
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
                color={accentColor}
            />
        </>
    );
}
