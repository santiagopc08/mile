import { CameraConfigType, DEFAULT_CAMERA_CONFIG } from '../config/CameraConfig';

/**
 * Cámara con seguimiento suavizado y encuadre relativo al viewport.
 *
 * `x` / `y` son la esquina superior izquierda del rectángulo de mundo visible.
 * El renderer aplica `scale(zoom)` y luego `translate(-x, -y)`.
 *
 * El zoom se deriva del tamaño del canvas para que siempre se vea una porción de
 * mundo jugable: antes los offsets eran fijos (350, -480) y en un canvas bajo el
 * coche quedaba fuera de pantalla.
 */
export class CameraSystem {
    public x = 0;
    public y = 0;
    public zoom = 1;
    public shake = 0;

    private config: CameraConfigType;
    private viewWidth = 1280;
    private viewHeight = 720;
    private currentLookAhead = 0;

    constructor(customConfig: Partial<CameraConfigType> = {}) {
        this.config = { ...DEFAULT_CAMERA_CONFIG, ...customConfig };
        this.setViewport(this.viewWidth, this.viewHeight);
    }

    /** Tamaño del canvas en píxeles CSS. Recalcula el zoom. */
    public setViewport(width: number, height: number) {
        this.viewWidth = Math.max(1, width);
        this.viewHeight = Math.max(1, height);

        const cfg = this.config;
        const zoomForWidth = this.viewWidth / cfg.targetViewWidth;
        const zoomForHeight = this.viewHeight / cfg.maxViewHeight;

        this.zoom = Math.min(
            cfg.maxZoom,
            Math.max(cfg.minZoom, Math.max(zoomForWidth, zoomForHeight))
        );
    }

    /** Ancho del mundo visible en px de mundo. */
    public get worldWidth(): number {
        return this.viewWidth / this.zoom;
    }

    /** Alto del mundo visible en px de mundo. */
    public get worldHeight(): number {
        return this.viewHeight / this.zoom;
    }

    /**
     * Distancia vertical entre el coche y el borde superior de la vista.
     * Se limita el mundo visible POR DEBAJO del coche: en un lienzo alto, el
     * espacio sobrante se llena de cielo (montañas, sol, nubes) y no de tierra.
     */
    private get topOffset(): number {
        const below = Math.min(
            this.worldHeight * (1 - this.config.focusY),
            this.config.maxGroundMargin
        );
        return this.worldHeight - below;
    }

    public reset(targetX: number = 0, targetY: number = 480) {
        const safeX = Number.isFinite(targetX) ? targetX : 0;
        const safeY = Number.isFinite(targetY) ? targetY : 480;

        this.x = safeX - this.worldWidth * this.config.focusX;
        this.y = safeY - this.topOffset;
        this.currentLookAhead = 0;
        this.shake = 0;
    }

    /**
     * Sacudida puntual (aterrizajes, recogidas). El tope es deliberadamente
     * bajo: es un efecto de evento, no un estado sostenido. Con el tope anterior
     * (18) cualquier fuente continua saturaba la cámara y producía un ruido
     * aleatorio de ±9px por frame.
     */
    public addShake(amount: number) {
        this.shake = Math.min(7, this.shake + amount);
    }

    public update(
        vehiclePos: { x: number; y: number },
        vehicleVel: { x: number; y: number },
        deltaSec: number = 1 / 60
    ) {
        const cfg = this.config;

        const posX = Number.isFinite(vehiclePos.x) ? vehiclePos.x : 0;
        const posY = Number.isFinite(vehiclePos.y) ? vehiclePos.y : 480;
        const velX = Number.isFinite(vehicleVel.x) ? vehicleVel.x : 0;

        // 1. Anticipación en el sentido de la marcha
        const targetLookAhead =
            velX > 0.5 ? cfg.lookAheadDistance : velX < -0.5 ? -cfg.lookAheadDistance * 0.5 : 0;
        this.currentLookAhead += (targetLookAhead - this.currentLookAhead) * cfg.lookAheadSpeed;

        const targetCamX = posX + this.currentLookAhead - this.worldWidth * cfg.focusX;
        const targetCamY = posY - this.topOffset;

        // 2. Zonas muertas: ignoran micro-baches
        const diffX = targetCamX - this.x;
        const diffY = targetCamY - this.y;

        if (Math.abs(diffX) > cfg.deadZoneX) {
            this.x += diffX * cfg.followSpeed;
        }
        if (Math.abs(diffY) > cfg.deadZoneY) {
            this.y += diffY * cfg.verticalFollow;
        }

        // 3. Límite izquierdo del mundo
        this.x = Math.max(cfg.minWorldX - this.worldWidth * cfg.focusX, this.x);

        // 4. Amortiguación del temblor
        if (this.shake > 0) {
            this.shake = Math.max(0, this.shake - deltaSec * 26);
        }
    }

    /** Desplazamiento aleatorio del temblor, en px de mundo. */
    public getShakeOffset(): { x: number; y: number } {
        if (this.shake <= 0) return { x: 0, y: 0 };
        return {
            x: (Math.random() - 0.5) * this.shake,
            y: (Math.random() - 0.5) * this.shake,
        };
    }
}
