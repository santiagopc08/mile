/**
 * SuspensionConfig.ts
 * Parámetros del montante progresivo (TASK-011).
 *
 * Todas las longitudes están en píxeles de mundo y se miden a lo largo del eje
 * "abajo" del chasis, desde el punto de anclaje hasta el eje de la rueda.
 *
 * Las fuerzas van en las unidades de Matter: una fuerza de `m * g * scale`
 * sostiene una masa m. Con la gravedad del juego (1.4, escala 0.001) eso son
 * ~0.0014 por kg, así que los números son deliberadamente pequeños.
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
    // La geometría del coche deja el eje a 22px del anclaje. Con una longitud
    // libre de 26 el coche se asienta hundido ~4px, en torno a un tercio del
    // recorrido de compresión: queda margen tanto para hundirse como para estirar.
    restLength: 26,
    maxCompression: 12,
    maxExtension: 9,

    // Escala de fuerzas: con la gravedad del juego, sostener el reparto de masa
    // de un montante (~19.5 kg) pide del orden de 0.027. Un aterrizaje fuerte
    // necesita frenar también al chasis y llega a pedir varias unidades, de ahí
    // que el tope y la saturación estén dos órdenes por encima del muelle base.
    baseStiffness: 0.0052,
    progressiveStiffness: 0.09,
    progressiveExponent: 2.4,

    // El suelo de amortiguación importa más de lo que parece: la vibración al
    // rodar es de amplitud pequeña, así que la manda el damping MÍNIMO, no el
    // progresivo. Con 0.030 el montante resonaba a 25 Hz en llano (un zumbido);
    // con 0.055 baja a 12.7 Hz, que ya se percibe como balanceo y no como buzz.
    compressionDamping: 0.055,
    reboundDamping: 0.030,
    dampingSpeedReference: 4.0,
    dampingSpeedGain: 2.0,

    bumpStopStrength: 1.2,
    bumpStopStart: 0.68,
    reboundStopStart: 0.72,

    maxForce: 3.0,

    lateralStiffness: 0.12,
    lateralDamping: 0.024,
};
