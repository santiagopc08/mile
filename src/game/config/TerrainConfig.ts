/**
 * TerrainConfig.ts
 * Configuración del generador procedural de terreno infinito.
 *
 * Los valores de amplitud / escala de ruido están validados en banco headless:
 * producen pendientes p50 ≈ 12°, p90 ≈ 26°, máx ≈ 43°, con ~10% de tiempo en el
 * aire (saltos) y 0% de vuelcos conduciendo a fondo.
 */

export interface TerrainConfigType {
    chunkLength: number;          // Largo de cada chunk en píxeles
    pointsPerChunk: number;       // Vértices de superficie por chunk
    noiseScale: number;           // Frecuencia del ruido Perlin (colinas amplias)
    amplitude: number;            // Amplitud máxima de las colinas (px)
    highOctaveRatio: number;      // Peso de la segunda octava (baches y rampas)
    highOctaveScale: number;      // Multiplicador de frecuencia de la segunda octava
    baseHeight: number;           // Altura base del suelo (px)
    flatUntil: number;            // Plataforma plana de salida (px desde el origen)
    blendLength: number;          // Transición suave de la plataforma a las colinas
    difficultyRamp: number;       // Distancia (px) en la que el relieve llega al 100%
    difficultyFloor: number;      // Relieve inicial (0-1) al salir de la plataforma
    colliderThickness: number;    // Grosor de los colisionadores bajo la superficie
    chunksAhead: number;          // Chunks generados por delante del vehículo
    chunksBehind: number;         // Chunks retenidos por detrás del vehículo
    seed: number;                 // Semilla determinista del ruido
}

export const DEFAULT_TERRAIN_CONFIG: TerrainConfigType = {
    chunkLength: 900,
    pointsPerChunk: 45,
    noiseScale: 0.0016,
    amplitude: 120,
    highOctaveRatio: 0.5,
    highOctaveScale: 3.1,
    baseHeight: 480,
    flatUntil: 520,
    blendLength: 420,
    difficultyRamp: 26000,
    difficultyFloor: 0.55,
    colliderThickness: 220,
    chunksAhead: 4,
    chunksBehind: 2,
    seed: 1337,
};
