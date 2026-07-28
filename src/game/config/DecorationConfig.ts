/**
 * DecorationConfig.ts
 * Dedicated configuration for procedural visual decorations (trees, rocks, bushes, flowers, signs, fences).
 */

export interface DecorationConfigType {
    treeProbability: number;
    rockProbability: number;
    bushProbability: number;
    flowerProbability: number;
    signProbability: number;
    fenceProbability: number;
    decorationDensity: number;      // Density of candidate positions along chunk
    maxSlopeForDecoration: number;  // Radians threshold; skip placing items if slope is too steep
}

export const DEFAULT_DECORATION_CONFIG: DecorationConfigType = {
    treeProbability: 0.25,
    rockProbability: 0.20,
    bushProbability: 0.30,
    flowerProbability: 0.35,
    signProbability: 0.10,
    fenceProbability: 0.15,
    decorationDensity: 0.40,
    maxSlopeForDecoration: 0.45,    // ~25 degrees
};
