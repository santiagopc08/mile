import Matter from 'matter-js';
import { TerrainGenerator } from './TerrainGenerator';
import { TerrainChunk } from './TerrainChunk';
import { TerrainConfigType } from '../config/TerrainConfig';
import { DecorationItem } from './DecorationSystem';

export interface TerrainSegment {
    id: number;
    startX: number;
    endX: number;
    surfacePoints: { x: number; y: number }[];
    decorations?: DecorationItem[];
    body: Matter.Body;
}

/**
 * Fuente única de verdad de la altura del terreno.
 * Todo lo que necesite saber dónde está el suelo (vehículo, monedas, bidones,
 * partículas, renderer) debe pasar por aquí; usar una segunda función de ruido
 * en paralelo hace que los objetos floten o queden enterrados.
 */
export interface TerrainProbe {
    getElevation(worldX: number): number;
    getSlopeAngle(worldX: number): number;
}

export class TerrainManager implements TerrainProbe {
    private generator: TerrainGenerator;

    constructor(world: Matter.World, customConfig: Partial<TerrainConfigType> = {}) {
        this.generator = new TerrainGenerator(world, customConfig);
    }

    public init() {
        this.generator.reset();
    }

    public setSeed(seed: number) {
        this.generator.setSeed(seed);
    }

    public update(focusX: number) {
        this.generator.updateStreaming(focusX);
    }

    public getActiveSegments(): TerrainSegment[] {
        return this.generator
            .getActiveChunks()
            .filter((c: TerrainChunk) => c.body !== null)
            .map((c: TerrainChunk) => ({
                id: c.chunkIndex,
                startX: c.startX,
                endX: c.endX,
                surfacePoints: c.surfacePoints,
                decorations: c.decorations,
                body: c.body!,
            }));
    }

    public getElevation(worldX: number): number {
        return this.generator.getMesh().getElevation(worldX, this.generator.getConfig());
    }

    public getSlopeAngle(worldX: number): number {
        return this.generator.getMesh().getSlopeAngle(worldX, this.generator.getConfig());
    }

    public clear() {
        this.generator.clear();
    }
}
