/**
 * VehicleConfig.ts
 * Configuración del buggy: dimensiones, masas, suspensión y control.
 *
 * `maxWheelSpin` es el parámetro crítico: sin un tope duro de velocidad angular
 * la rueda motriz se embala indefinidamente, lanza el coche por los aires y lo
 * deja boca abajo a los pocos segundos. Validado en banco headless.
 */

export interface VehicleConfigType {
    // Dimensiones
    chassisWidth: number;
    chassisHeight: number;
    wheelRadius: number;
    wheelOffsetRearX: number;
    wheelOffsetFrontX: number;
    wheelOffsetY: number;

    // Masas y centro de gravedad
    chassisMass: number;
    wheelMass: number;
    centerOfMassOffsetX: number;
    centerOfMassOffsetY: number;

    // Fricción y rebote
    wheelFriction: number;
    wheelFrictionStatic: number;
    wheelRestitution: number;
    chassisFriction: number;
    chassisRestitution: number;

    // Geometría del anclaje del montante en el chasis.
    anchorOffsetY: number;

    // Control
    maxTorque: number;
    reverseTorque: number;
    accelerationRate: number;
    decelerationRate: number;
    maxWheelSpin: number;         // Tope duro de velocidad angular (rad/paso)
    airControl: number;           // Par sobre el chasis en el aire
    airControlMaxSpin: number;    // Tope de giro del chasis en el aire
    maxWheelieAngle: number;      // Ángulo (rad) tras el que se corta el gas
    groundedTolerance: number;    // Holgura (px) para considerar la rueda en el suelo

    // Transferencia de peso: es lo que se "siente" al pisar a fondo
    launchPitchTorque: number;    // Par que levanta el morro al acelerar
    brakePitchTorque: number;     // Par que hunde el morro al frenar / dar atrás
    maxPitchSpin: number;         // Tope de giro del chasis por transferencia
    slipReference: number;        // Derrape (px/paso) que cuenta como patinada total
}

export const DEFAULT_VEHICLE_CONFIG: VehicleConfigType = {
    // Dimensiones
    chassisWidth: 120,
    chassisHeight: 30,
    wheelRadius: 20,
    wheelOffsetRearX: -40,
    wheelOffsetFrontX: 40,
    wheelOffsetY: 26,

    // Masas y centro de gravedad bajo (anti-vuelco)
    chassisMass: 30.0,
    // Rueda pesada a propósito: sin compliancia de neumático, una rueda ligera
    // sale rebotada por cada vértice del colisionador. Subirla de 4.5 a 10 baja
    // la frecuencia propia del modo de rueda y mejora el contacto (63% vs 57%).
    wheelMass: 10.0,
    centerOfMassOffsetX: 0,
    centerOfMassOffsetY: 8,

    // Agarre
    wheelFriction: 1.6,
    wheelFrictionStatic: 2.0,
    wheelRestitution: 0.0,
    chassisFriction: 0.4,
    chassisRestitution: 0.0,

    // El anclaje va 4px por encima del origen del chasis, así el montante mide
    // 22px en la posición de marcha y le queda recorrido en ambos sentidos.
    anchorOffsetY: -4.0,

    // Control
    maxTorque: 2.6,
    reverseTorque: 1.8,
    accelerationRate: 4.0,
    decelerationRate: 6.0,
    maxWheelSpin: 0.55,
    airControl: 0.55,
    airControlMaxSpin: 0.09,
    maxWheelieAngle: 1.15,
    groundedTolerance: 12,

    // Transferencia de peso. Bajó de 1.2 a 0.3 al entrar la suspensión
    // progresiva: ahora el cabeceo lo genera el propio montante al aplicar la
    // reacción en el anclaje, y sumar el par antiguo volcaba el coche.
    launchPitchTorque: 0.3,
    brakePitchTorque: 0.25,
    maxPitchSpin: 0.055,
    slipReference: 5.5,
};
