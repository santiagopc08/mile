import { Vehicle } from '../entities/vehicle';
import { InputManager } from '../utils/inputManager';
import { VehicleConfigType, DEFAULT_VEHICLE_CONFIG } from '../config/VehicleConfig';
import { TerrainProbe } from '../terrain/terrainManager';

export class VehicleController {
    private vehicle: Vehicle;
    private input: InputManager;
    private config: VehicleConfigType;
    private terrain: TerrainProbe | null;

    /** Par aplicado ahora mismo (suavizado). Lo usa el renderer para el humo. */
    public currentTorque = 0;
    public isReversing = false;
    public isRearGrounded = true;
    public isFrontGrounded = true;
    /** Fracción de gas 0-1, para partículas y consumo de combustible. */
    public throttle = 0;
    /** Segundos acumulados sin tocar el suelo. */
    public airTime = 0;
    /** Sin combustible: el motor no responde pero el coche sigue rodando. */
    public outOfFuel = false;
    /** Patinada de la rueda motriz, 0-1 (gira más rápido que el avance real). */
    public slip = 0;
    /** Régimen del motor normalizado 0-1, para el tacómetro y el sonido. */
    public engineRpm = 0;

    constructor(
        vehicle: Vehicle,
        input: InputManager = InputManager.getInstance(),
        customConfig: Partial<VehicleConfigType> = {},
        terrain: TerrainProbe | null = null
    ) {
        this.vehicle = vehicle;
        this.input = input;
        this.config = { ...DEFAULT_VEHICLE_CONFIG, ...customConfig };
        this.terrain = terrain;
    }

    public setTerrain(terrain: TerrainProbe) {
        this.terrain = terrain;
    }

    /** ¿La rueda toca el suelo? Se compara con la altura real del terreno. */
    private isWheelGrounded(wheel: { position: { x: number; y: number } }): boolean {
        if (!this.terrain) return true;
        const groundY = this.terrain.getElevation(wheel.position.x);
        const wheelBottomY = wheel.position.y + this.config.wheelRadius;
        return groundY - wheelBottomY <= this.config.groundedTolerance;
    }

    /**
     * Un paso de control. Debe llamarse ANTES de Matter.Engine.update, y
     * `vehicle.clampWheelSpin()` justo DESPUÉS.
     */
    public update(deltaSec: number = 1 / 60) {
        const cfg = this.config;
        const isAccel = this.input.isAccelerating && !this.outOfFuel;
        const isBrake = this.input.isBraking && !this.outOfFuel;

        const chassis = this.vehicle.chassis;
        const rearWheel = this.vehicle.rearWheel;

        this.isRearGrounded = this.isWheelGrounded(rearWheel);
        this.isFrontGrounded = this.isWheelGrounded(this.vehicle.frontWheel);

        const airborne = !this.isRearGrounded && !this.isFrontGrounded;
        this.airTime = airborne ? this.airTime + deltaSec : 0;

        // El caballito se corta solo: pasado maxWheelieAngle se suelta el gas
        const tilt = this.vehicle.getNormalizedAngle();
        const isFlippingBackwards = tilt < -cfg.maxWheelieAngle;
        const atSpinLimit = Math.abs(rearWheel.angularVelocity) >= cfg.maxWheelSpin;

        let targetTorque = 0;

        if (isAccel) {
            this.isReversing = false;
            if (!this.isRearGrounded) {
                targetTorque = 0;                       // Rueda al aire: no hay tracción
            } else if (isFlippingBackwards) {
                targetTorque = 0;                       // Evita el vuelco hacia atrás
            } else if (atSpinLimit) {
                targetTorque = cfg.maxTorque * 0.35;    // Mantiene, no acelera más
            } else {
                targetTorque = cfg.maxTorque;
            }
        } else if (isBrake) {
            // Primero frena; sólo cuando el par se ha disipado entra la marcha atrás
            if (this.currentTorque > 0.05) {
                targetTorque = 0;
                this.isReversing = false;
            } else {
                this.isReversing = true;
                targetTorque = this.isRearGrounded ? -cfg.reverseTorque : 0;
            }
        } else {
            targetTorque = 0;
            if (Math.abs(this.currentTorque) < 0.005) {
                this.currentTorque = 0;
                this.isReversing = false;
            }
        }

        // Suavizado exponencial: curva de par continua, sin tirones
        const lerpSpeed = targetTorque !== 0 ? cfg.accelerationRate : cfg.decelerationRate;
        this.currentTorque += (targetTorque - this.currentTorque) * Math.min(1, lerpSpeed * deltaSec);

        this.throttle = Math.max(0, this.currentTorque) / cfg.maxTorque;

        // Par a la rueda motriz, sólo si aún no está en el tope de giro
        if (Math.abs(this.currentTorque) > 0.001 && !atSpinLimit) {
            rearWheel.torque += this.currentTorque;
        }

        // Patinada: diferencia entre la velocidad de la banda de rodadura y el
        // avance real del coche. Es lo que alimenta la tierra, el temblor y las
        // vueltas del motor cuando se pisa a fondo desde parado.
        const treadSpeed = rearWheel.angularVelocity * cfg.wheelRadius;
        const groundSpeed = chassis.velocity.x;
        this.slip = this.isRearGrounded
            ? Math.min(1, Math.abs(treadSpeed - groundSpeed) / cfg.slipReference)
            : 0;

        // Transferencia de peso: acelerar levanta el morro y frenar lo hunde.
        // Sin esto pisar a fondo no se notaba, el coche sólo avanzaba.
        if (!airborne) {
            const pitchDir = isAccel ? -1 : isBrake ? 1 : 0;
            if (pitchDir !== 0 && Math.abs(chassis.angularVelocity) < cfg.maxPitchSpin) {
                const strength = isAccel
                    ? cfg.launchPitchTorque * Math.abs(this.throttle)
                    : cfg.brakePitchTorque;
                // El caballito se corta solo al acercarse al ángulo límite
                const headroom = isAccel
                    ? Math.max(0, 1 - Math.max(0, -tilt) / cfg.maxWheelieAngle)
                    : 1;
                chassis.torque += pitchDir * strength * headroom;
            }
        }

        // Control aéreo: en el aire el gas levanta el morro y el freno lo baja,
        // que es lo que permite enderezar el coche antes de aterrizar.
        if (airborne && (isAccel || isBrake)) {
            const dir = isAccel ? -1 : 1;
            if (Math.abs(chassis.angularVelocity) < cfg.airControlMaxSpin) {
                chassis.torque += dir * cfg.airControl;
            }
        }

        this.updateEngineRpm(deltaSec, isAccel || isBrake, airborne);
    }

    /**
     * Régimen del motor. Sigue a la rueda cuando hay agarre, pero se dispara al
     * patinar o en el aire: es lo que hace que pisar a fondo suene y se vea
     * distinto de ir rápido.
     */
    private updateEngineRpm(deltaSec: number, hasInput: boolean, airborne: boolean) {
        const cfg = this.config;
        const IDLE = 0.11;

        const wheelFraction = Math.min(1, Math.abs(this.rearWheelSpin) / cfg.maxWheelSpin);

        let target: number;
        if (!hasInput || this.outOfFuel) {
            target = Math.max(IDLE, wheelFraction * 0.65);
        } else if (airborne) {
            target = 0.62 + 0.38 * Math.abs(this.throttle || 0.6);  // sube de vueltas libre
        } else {
            target = Math.max(wheelFraction, this.slip * 0.95);
        }

        // Sube rápido y baja despacio, como un motor de verdad
        const rate = target > this.engineRpm ? 7.5 : 3.2;
        this.engineRpm += (target - this.engineRpm) * Math.min(1, rate * deltaSec);
        this.engineRpm = Math.max(0, Math.min(1, this.engineRpm));
    }

    private get rearWheelSpin(): number {
        return this.vehicle.rearWheel.angularVelocity;
    }
}
