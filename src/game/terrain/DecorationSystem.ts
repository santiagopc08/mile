import { DecorationConfigType, DEFAULT_DECORATION_CONFIG } from '../config/DecorationConfig';

export type DecorationType = 'tree' | 'rock' | 'bush' | 'flower' | 'sign' | 'fence';

export interface DecorationItem {
    type: DecorationType;
    x: number;
    y: number;
    slope: number;
    scale: number;
    variant: number;
}

export class DecorationSystem {
    private config: DecorationConfigType;

    constructor(customConfig: Partial<DecorationConfigType> = {}) {
        this.config = { ...DEFAULT_DECORATION_CONFIG, ...customConfig };
    }

    /**
     * Mulberry32 deterministic pseudo-random generator.
     */
    private random(seed: number): () => number {
        let s = seed | 0;
        return () => {
            s = (s + 0x6d2b79f5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /**
     * Generates a list of visual decoration items for a chunk's surface points.
     */
    public generateDecorations(
        surfacePoints: { x: number; y: number }[],
        chunkIndex: number,
        worldSeed: number
    ): DecorationItem[] {
        const cfg = this.config;
        const decorations: DecorationItem[] = [];

        if (surfacePoints.length < 2) return decorations;

        const rng = this.random(worldSeed + chunkIndex * 99991);

        for (let i = 1; i < surfacePoints.length - 1; i++) {
            // Density check
            if (rng() > cfg.decorationDensity) continue;

            const pPrev = surfacePoints[i - 1];
            const pNext = surfacePoints[i + 1];
            const pCurr = surfacePoints[i];

            // Slope angle
            const slope = Math.atan2(pNext.y - pPrev.y, pNext.x - pPrev.x);

            // Skip steep slopes
            if (Math.abs(slope) > cfg.maxSlopeForDecoration) continue;

            const roll = rng();

            let type: DecorationType | null = null;

            if (roll < cfg.treeProbability) {
                type = 'tree';
            } else if (roll < cfg.treeProbability + cfg.rockProbability) {
                type = 'rock';
            } else if (roll < cfg.treeProbability + cfg.rockProbability + cfg.bushProbability) {
                type = 'bush';
            } else if (roll < cfg.treeProbability + cfg.rockProbability + cfg.bushProbability + cfg.flowerProbability) {
                type = 'flower';
            } else if (roll < cfg.treeProbability + cfg.rockProbability + cfg.bushProbability + cfg.flowerProbability + cfg.signProbability) {
                type = 'sign';
            } else if (roll < cfg.treeProbability + cfg.rockProbability + cfg.bushProbability + cfg.flowerProbability + cfg.signProbability + cfg.fenceProbability) {
                type = 'fence';
            }

            if (type) {
                decorations.push({
                    type,
                    x: pCurr.x,
                    y: pCurr.y,
                    slope,
                    scale: 0.8 + rng() * 0.4,
                    variant: Math.floor(rng() * 3),
                });
            }
        }

        return decorations;
    }
}
