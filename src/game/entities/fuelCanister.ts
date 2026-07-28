import { GAME_CONFIG } from '../config';
import { TerrainProbe } from '../terrain/terrainManager';

export interface FuelCanister {
    id: number;
    x: number;
    y: number;
    angle: number;
    phase: number;
    collected: boolean;
}

export class FuelCanisterManager {
    private canisters: Map<number, FuelCanister> = new Map();
    private nextId = 0;
    private lastSpawnX = 0;
    private terrain: TerrainProbe;

    constructor(terrain: TerrainProbe) {
        this.terrain = terrain;
    }

    /**
     * Coloca bidones apoyados en la superficie por delante de la cámara.
     * Devuelve el bidón recogido en este frame, si lo hay.
     */
    public update(cameraX: number, vehiclePos: { x: number; y: number }): FuelCanister | null {
        const { SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX, COLLECTION_RADIUS } = GAME_CONFIG.FUEL;
        const renderMargin = GAME_CONFIG.TERRAIN.RENDER_MARGIN;

        while (this.lastSpawnX < cameraX + renderMargin) {
            this.lastSpawnX += SPAWN_INTERVAL_MIN + Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN);

            const spawnX = this.lastSpawnX;
            const groundY = this.terrain.getElevation(spawnX);
            const angle = this.terrain.getSlopeAngle(spawnX);

            // Apoyado sobre la normal de la pendiente, no sobre la vertical
            const canister: FuelCanister = {
                id: this.nextId++,
                x: spawnX - Math.sin(angle) * 22,
                y: groundY - Math.cos(angle) * 22,
                angle,
                phase: Math.random() * Math.PI * 2,
                collected: false,
            };

            this.canisters.set(canister.id, canister);
        }

        let collected: FuelCanister | null = null;

        for (const [id, c] of Array.from(this.canisters.entries())) {
            if (c.x < cameraX - renderMargin || c.collected) {
                this.canisters.delete(id);
                continue;
            }

            if (Math.hypot(vehiclePos.x - c.x, vehiclePos.y - c.y) < COLLECTION_RADIUS) {
                c.collected = true;
                collected = c;
            }
        }

        return collected;
    }

    public getActiveCanisters(): FuelCanister[] {
        return Array.from(this.canisters.values()).filter((c) => !c.collected);
    }

    public clear() {
        this.canisters.clear();
        this.nextId = 0;
        this.lastSpawnX = 0;
    }
}
