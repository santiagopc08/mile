import Matter from 'matter-js';
import { TerrainMesh } from './TerrainMesh';
import { TerrainChunk } from './TerrainChunk';
import { TerrainConfigType, DEFAULT_TERRAIN_CONFIG } from '../config/TerrainConfig';
import { DecorationSystem } from './DecorationSystem';

export class TerrainGenerator {
    private world: Matter.World;
    private config: TerrainConfigType;
    private mesh: TerrainMesh;
    private decorationSystem: DecorationSystem;
    private loadedChunks: Map<number, TerrainChunk> = new Map();

    constructor(world: Matter.World, customConfig: Partial<TerrainConfigType> = {}) {
        this.world = world;
        this.config = { ...DEFAULT_TERRAIN_CONFIG, ...customConfig };
        this.mesh = new TerrainMesh(this.config.seed);
        this.decorationSystem = new DecorationSystem();
    }

    public setSeed(seed: number) {
        this.config.seed = seed;
        this.mesh.setSeed(seed);
        this.reset();
    }

    public getConfig(): TerrainConfigType {
        return this.config;
    }

    public getMesh(): TerrainMesh {
        return this.mesh;
    }

    public reset() {
        this.clear();
        this.updateStreaming(0);
    }

    /**
     * Mantiene una ventana acotada de chunks alrededor de la posición del vehículo.
     */
    public updateStreaming(focusX: number) {
        const cfg = this.config;
        const currentChunkIdx = Math.floor(focusX / cfg.chunkLength);

        const startChunkIdx = Math.max(0, currentChunkIdx - cfg.chunksBehind);
        const endChunkIdx = currentChunkIdx + cfg.chunksAhead;

        // 1. Crear los chunks que falten dentro de la ventana
        for (let idx = startChunkIdx; idx <= endChunkIdx; idx++) {
            if (!this.loadedChunks.has(idx)) {
                this.loadedChunks.set(
                    idx,
                    new TerrainChunk(this.world, idx, this.mesh, cfg, this.decorationSystem)
                );
            }
        }

        // 2. Descargar los que queden fuera (memoria acotada)
        for (const [idx, chunk] of this.loadedChunks.entries()) {
            if (idx < startChunkIdx || idx > endChunkIdx) {
                chunk.destroy();
                this.loadedChunks.delete(idx);
            }
        }
    }

    public getActiveChunks(): TerrainChunk[] {
        return Array.from(this.loadedChunks.values()).sort((a, b) => a.chunkIndex - b.chunkIndex);
    }

    public clear() {
        for (const chunk of this.loadedChunks.values()) {
            chunk.destroy();
        }
        this.loadedChunks.clear();
    }
}
