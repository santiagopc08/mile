/**
 * SuspensionConfig.ts
 * Parámetros de suspensión suave (plush & bouncier) con largo recorrido y amortiguación viva.
 *
 * Todas las longitudes están en píxeles de mundo y se miden a lo largo del eje
 * "abajo" del chasis, desde el punto de anclaje hasta el eje de la rueda.
 */

export interface SuspensionConfigType {
    /** Longitud libre del muelle (sin carga). El coche se hunde desde aquí. */
    restLength: number;
    /** Recorrido de compresión disponible por debajo de restLength. */
    maxCompression: number;
    /** Recorrido de extensión disponible por encima de restLength. */
    maxExtension: number;

    /** Rigidez lineal, la que domina al principio del recorrido. */
    baseStiffness: number;
    /** Rigidez añadida que crece con la compresión (término progresivo). */
    progressiveStiffness: number;
    /** Exponente de la curva progresiva. >1 mantiene suave el inicio. */
    progressiveExponent: number;

    /** Amortiguación al comprimir (absorbe el golpe). */
    compressionDamping: number;
    /** Amortiguación al extender. Menor que la de compresión: la rueda baja
     *  rápido a buscar el suelo, pero lo justo para no oscilar. */
    reboundDamping: number;
    /** Velocidad de compresión (px/paso) a la que el damping progresivo satura. */
    dampingSpeedReference: number;
    /** Cuánto llega a multiplicarse el damping en una compresión rápida. */
    dampingSpeedGain: number;

    /** Fuerza del tope de final de recorrido. */
    bumpStopStrength: number;
    /** Fracción del recorrido de compresión donde empieza a actuar el tope. */
    bumpStopStart: number;
    /** Fracción del recorrido de extensión donde empieza el tope de rebote. */
    reboundStopStart: number;

    /** Saturación de seguridad de la fuerza total por montante. */
    maxForce: number;

    /** Rigidez de la guía lateral: sujeta la rueda adelante/atrás. */
    lateralStiffness: number;
    /** Amortiguación de la guía lateral. */
    lateralDamping: number;
}

export const DEFAULT_SUSPENSION_CONFIG: SuspensionConfigType = {
    // Geometría Trophy Buggy de Ultra-Largo Recorrido (54px de recorrido total):
    // Longitud libre de 44px con 30px de compresión y 24px de extensión droop.
    restLength: 44,
    maxCompression: 30,
    maxExtension: 24,

    // Rigidez ultra-suave y elástica para el chasis ultraligero (~11.5 kg)
    // Permite que el coche balancee, absorba dunas profundas y flexione con total libertad
    baseStiffness: 0.00034,
    progressiveStiffness: 0.0042,
    progressiveExponent: 1.6,

    // Amortiguación afelpada y viva (absorción profunda con rebote alegre)
    compressionDamping: 0.0038,
    reboundDamping: 0.0020,
    dampingSpeedReference: 6.0,
    dampingSpeedGain: 1.4,

    bumpStopStrength: 0.18,
    bumpStopStart: 0.85,
    reboundStopStart: 0.85,

    maxForce: 1.8,

    // Guía lateral flexible que permite articulación fluida sin trabar las ruedas
    lateralStiffness: 0.014,
    lateralDamping: 0.002,
};
