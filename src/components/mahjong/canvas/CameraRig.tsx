import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface CameraRigProps {
    boardWidth: number;
    boardHeight: number;
}

export function CameraRig({ boardWidth, boardHeight }: CameraRigProps) {
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
