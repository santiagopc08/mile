/**
 * VehicleConfig.ts
 * Configuración del buggy: chasis ultraligero, suspensión suave y tren motriz de par agresivo.
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

    // Control y Tren Motriz de Par Variable Agresivo
    maxTorque: number;
    reverseTorque: number;
    accelerationRate: number;
    decelerationRate: number;
    maxWheelSpin: number;         // Tope duro de velocidad angular (rad/paso)
    airControl: number;           // Par sobre el chasis en el aire
    airControlMaxSpin: number;    // Tope de giro del chasis en el aire
    maxWheelieAngle: number;      // Ángulo (rad) tras el que se corta el gas
    groundedTolerance: number;    // Holgura (px) para considerar la rueda en el suelo

    // Par Variable y Asistencia de Pendiente (Hill Climb)
    lowRpmTorqueMultiplier: number;  // Multiplicador de par a bajas RPM para arranque y trepada
    hillClimbSlopeGain: number;      // Ganancia de par adicional según la inclinación de la colina
    frontAssistRatio: number;        // Fracción de par enviada a la rueda delantera en subidas (AWD)
    gearRatios: number[];            // Relaciones de transmisión [1ª, 2ª, 3ª]

    // Transferencia de peso reactiva (caballitos y cabeceo dinámico)
    launchPitchTorque: number;    // Par que levanta el morro al acelerar con fuerza
    brakePitchTorque: number;     // Par que hunde el morro al frenar
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
    wheelOffsetY: 36,

    // Masas ultraligeras (comportamiento muy ágil, nervioso y exigente de conducir)
    chassisMass: 11.5,
    wheelMass: 2.8,
    centerOfMassOffsetX: 0,
    centerOfMassOffsetY: 8,

    // Agarre y tracción off-road
    wheelFriction: 1.85,
    wheelFrictionStatic: 2.3,
    wheelRestitution: 0.0,
    chassisFriction: 0.4,
    chassisRestitution: 0.0,

    anchorOffsetY: -6.0,

    // Par explosivo y respuesta inmediata de acelerador
    maxTorque: 2.60,
    reverseTorque: 1.85,
    accelerationRate: 8.0,
    decelerationRate: 8.5,
    maxWheelSpin: 0.62,
    airControl: 0.52,
    airControlMaxSpin: 0.11,
    maxWheelieAngle: 1.28,
    groundedTolerance: 22,

    // Par Variable Agresivo (Gran empuje inicial y trepada extrema)
    lowRpmTorqueMultiplier: 3.0,
    hillClimbSlopeGain: 2.0,
    frontAssistRatio: 0.38,
    gearRatios: [2.8, 1.6, 1.0],

    // Transferencia de peso agresiva: pisar a fondo levanta el morro
    // obligando al jugador a dosificar el gas (feathering) para no volcar
    launchPitchTorque: 0.44,
    brakePitchTorque: 0.28,
    maxPitchSpin: 0.065,
    slipReference: 5.5,
};
