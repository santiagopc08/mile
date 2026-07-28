import { TerrainConfigType } from '../config/TerrainConfig';

/**
 * TerrainMesh.ts
 * Curva de elevación continua a partir de ruido Perlin 1D condicionado por semilla.
 * Garantiza cero escalones verticales y terreno idéntico para la misma semilla.
 *
 * Sobre el ruido se aplican dos modeladores de jugabilidad:
 *  1. Plataforma plana de salida + transición suavizada, para que el coche
 *     aparezca nivelado y no resbale antes de empezar.
 *  2. Rampa de dificultad: el relieve crece con la distancia recorrida.
 */
export class TerrainMesh {
    private seed: number;
    private perm: number[] = [];

    constructor(seed: number = 1337) {
        this.seed = seed;
        this.initPermutationTable();
    }

    public setSeed(seed: number) {
        this.seed = seed;
        this.initPermutationTable();
    }

    /** Tabla de permutación de 512 entradas barajada de forma determinista (Mulberry32). */
    private initPermutationTable() {
        const p: number[] = [];
        for (let i = 0; i < 256; i++) {
            p[i] = i;
        }

        let s = this.seed | 0;
        for (let i = 255; i > 0; i--) {
            s = (s + 0x6d2b79f5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            const r = Math.abs((t ^ (t >>> 14)) >>> 0) % (i + 1);

            const temp = p[i];
            p[i] = p[r];
            p[r] = temp;
        }

        this.perm = new Array(512);
        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255];
        }
    }

    private fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    private lerp(t: number, a: number, b: number): number {
        return a + t * (b - a);
    }

    private grad1D(hash: number, x: number): number {
        const h = hash & 15;
        const grad = 1.0 + (h & 7);
        return (h & 8) !== 0 ? -grad * x : grad * x;
    }

    /** Ruido Perlin 1D determinista. */
    public noise1D(x: number): number {
        const X = Math.floor(x) & 255;
        const xRel = x - Math.floor(x);
        const u = this.fade(xRel);

        const g0 = this.grad1D(this.perm[X], xRel);
        const g1 = this.grad1D(this.perm[X + 1], xRel - 1);

        return this.lerp(u, g0, g1) * 0.25;
    }

    /**
     * Elevación de la superficie (Y de canvas: menor = más alto) en cualquier X del mundo.
     */
    public getElevation(worldX: number, cfg: TerrainConfigType): number {
        const nLow = this.noise1D(worldX * cfg.noiseScale);
        const nHigh = this.noise1D(worldX * cfg.noiseScale * cfg.highOctaveScale);

        let relief = nLow * cfg.amplitude + nHigh * cfg.amplitude * cfg.highOctaveRatio;

        // 1. Plataforma plana de salida y transición suavizada (smoothstep)
        if (worldX < cfg.flatUntil) {
            relief = 0;
        } else if (worldX < cfg.flatUntil + cfg.blendLength) {
            const b = (worldX - cfg.flatUntil) / cfg.blendLength;
            relief *= b * b * (3 - 2 * b);
        }

        // 2. Rampa de dificultad con la distancia
        const ramp = Math.min(
            1,
            cfg.difficultyFloor + (Math.max(0, worldX) / cfg.difficultyRamp) * (1 - cfg.difficultyFloor)
        );

        return cfg.baseHeight + relief * ramp;
    }

    /** Ángulo (rad) de la pendiente en X, para posar objetos alineados al suelo. */
    public getSlopeAngle(worldX: number, cfg: TerrainConfigType, delta: number = 6): number {
        const y1 = this.getElevation(worldX - delta, cfg);
        const y2 = this.getElevation(worldX + delta, cfg);
        return Math.atan2(y2 - y1, delta * 2);
    }
}
