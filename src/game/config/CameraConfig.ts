/**
 * CameraConfig.ts
 * Cámara con encuadre relativo al viewport: el vehículo se sitúa siempre en la
 * misma fracción de la pantalla, así el juego se ve igual de bien en un canvas
 * de móvil (360×500) que en uno de escritorio (1280×720).
 */

export interface CameraConfigType {
    followSpeed: number;          // Lerp horizontal
    verticalFollow: number;       // Lerp vertical (amortigua baches y saltos)
    lookAheadDistance: number;    // Anticipación al acelerar (px de mundo)
    lookAheadSpeed: number;       // Velocidad de transición de la anticipación
    focusX: number;               // Posición del coche en pantalla (0 = izq, 1 = der)
    focusY: number;               // Posición del coche en pantalla (0 = arr, 1 = abajo)
    maxGroundMargin: number;      // Tope de mundo visible bajo el coche (px)
    deadZoneX: number;            // Tolerancia horizontal
    deadZoneY: number;            // Tolerancia vertical
    targetViewWidth: number;      // Ancho de mundo visible deseado (px)
    maxViewHeight: number;        // Alto de mundo visible máximo (px)
    minZoom: number;
    maxZoom: number;
    minWorldX: number;            // Límite izquierdo del mundo
}

export const DEFAULT_CAMERA_CONFIG: CameraConfigType = {
    followSpeed: 0.12,
    verticalFollow: 0.06,
    lookAheadDistance: 170,
    lookAheadSpeed: 0.06,
    focusX: 0.34,
    focusY: 0.66,          // Coche algo más bajo: más cielo y menos tierra vacía
    maxGroundMargin: 300,  // Mundo visible por debajo del coche (px). Evita que
                           // un lienzo alto se llene de tierra en vez de cielo.
    deadZoneX: 6,
    deadZoneY: 24,
    targetViewWidth: 980,
    maxViewHeight: 780,
    minZoom: 0.4,
    maxZoom: 1.15,
    minWorldX: 0,
};
