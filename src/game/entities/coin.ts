import { GAME_CONFIG } from '../config';
import { TerrainProbe } from '../terrain/terrainManager';

export interface Coin {
    id: number;
    x: number;
    y: number;
    phase: number;      // Desfase de la animación de giro
    collected: boolean;
    pop: number;        // 1 → 0 tras recogerla, para el destello
}

export class CoinManager {
    private coins: Map<number, Coin> = new Map();
    private nextId = 0;
    private lastSpawnX = 0;
    private terrain: TerrainProbe;

    constructor(terrain: TerrainProbe) {
        this.terrain = terrain;
    }

    /**
     * Genera arcos de monedas por delante de la cámara y detecta las recogidas.
     * Devuelve las monedas recogidas en este frame (para HUD, partículas y sonido).
     */
    public update(
        cameraX: number,
        vehiclePos: { x: number; y: number },
        deltaSec: number
    ): Coin[] {
        const renderMargin = GAME_CONFIG.TERRAIN.RENDER_MARGIN;
        const { COLLECTION_RADIUS, MIN_GAP, MAX_GAP, SPAWN_CHANCE } = GAME_CONFIG.COINS;

        // 1. Generación procedural por delante de la cámara
        while (this.lastSpawnX < cameraX + renderMargin) {
            this.lastSpawnX += MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);

            if (Math.random() > SPAWN_CHANCE) continue;

            const clusterCount = 3 + Math.floor(Math.random() * 4);
            const startX = this.lastSpawnX;
            // Arco: las monedas del centro flotan más alto, invitando a saltar
            const arcHeight = 18 + Math.random() * 46;

            for (let i = 0; i < clusterCount; i++) {
                const coinX = startX + i * 42;
                const t = clusterCount > 1 ? i / (clusterCount - 1) : 0.5;
                const arc = Math.sin(t * Math.PI) * arcHeight;

                const coin: Coin = {
                    id: this.nextId++,
                    x: coinX,
                    y: this.terrain.getElevation(coinX) - 34 - arc,
                    phase: Math.random() * Math.PI * 2,
                    collected: false,
                    pop: 0,
                };

                this.coins.set(coin.id, coin);
            }
        }

        // 2. Recogida y descarte de las que quedan atrás
        const collected: Coin[] = [];

        for (const [id, coin] of Array.from(this.coins.entries())) {
            if (coin.collected) {
                coin.pop -= deltaSec * 3;
                if (coin.pop <= 0) this.coins.delete(id);
                continue;
            }

            if (coin.x < cameraX - renderMargin) {
                this.coins.delete(id);
                continue;
            }

            if (Math.hypot(vehiclePos.x - coin.x, vehiclePos.y - coin.y) < COLLECTION_RADIUS) {
                coin.collected = true;
                coin.pop = 1;
                collected.push(coin);
            }
        }

        return collected;
    }

    /** Monedas aún sin recoger, para el renderer. */
    public getActiveCoins(): Coin[] {
        return Array.from(this.coins.values()).filter((c) => !c.collected);
    }

    public clear() {
        this.coins.clear();
        this.nextId = 0;
        this.lastSpawnX = 0;
    }
}
