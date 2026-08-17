import { Vehicle } from '../entities/vehicle';
import { InputManager } from '../utils/inputManager';
import { VehicleConfigType, DEFAULT_VEHICLE_CONFIG } from '../config/VehicleConfig';
import { TerrainProbe } from '../terrain/terrainManager';

export class VehicleController {
    private vehicle: Vehicle;
    private input: InputManager;
    private config: VehicleConfigType;
    private terrain: TerrainProbe | null;

    /** Par instantáneo total aplicado a la transmisión. */
    public currentTorque = 0;
    /** Par efectivo aplicado a la rueda delantera (AWD / Hill Assist). */
    public frontTorque = 0;
    /** Marcha actual calculada: 1 (Trepada), 2 (Crucero), 3 (Alta Velocidad), -1 (Reversa). */
    public currentGear = 1;
    public isReversing = false;
    public isRearGrounded = true;
    public isFrontGrounded = true;
    /** Fracción de gas 0-1, para partículas y consumo de combustible. */
    public throttle = 0;
    /** Segundos acumulados sin tocar el suelo. */
    public airTime = 0;
    /** Sin combustible: el motor no responde pero el coche sigue rodando. */
    public outOfFuel = false;
    /** Patinada de la rueda motriz, 0-1. */
    public slip = 0;
    /** Régimen del motor normalizado 0-1, para tacómetro y sonido. */
    public engineRpm = 0;
    /** Factor de multiplicación de par por pendiente (1.0 - 2.8x). */
    public climbBoostFactor = 1.0;

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
     * Un paso de control con motor de Par Variable.
     * Debe llamarse ANTES de Matter.Engine.update.
     */
    public update(deltaSec: number = 1 / 60) {
        const cfg = this.config;
        const isAccel = this.input.isAccelerating && !this.outOfFuel;
        const isBrake = this.input.isBraking && !this.outOfFuel;

        const chassis = this.vehicle.chassis;
        const rearWheel = this.vehicle.rearWheel;
        const frontWheel = this.vehicle.frontWheel;

        this.isRearGrounded = this.isWheelGrounded(rearWheel);
        this.isFrontGrounded = this.isWheelGrounded(frontWheel);

        const airborne = !this.isRearGrounded && !this.isFrontGrounded;
        this.airTime = airborne ? this.airTime + deltaSec : 0;

        // Inclinación del coche (negativo = morro arriba subiendo)
        const tilt = this.vehicle.getNormalizedAngle();
        const isFlippingBackwards = tilt < -cfg.maxWheelieAngle;
        const atSpinLimit = Math.abs(rearWheel.angularVelocity) >= cfg.maxWheelSpin;

        // Velocidad de avance real
        const forwardSpeed = Math.max(0, chassis.velocity.x);

        // ── 1. TRANSMISIÓN VARIABLE Y SELECCIÓN DE MARCHA ──────────────────
        if (isAccel) {
            this.isReversing = false;
            if (forwardSpeed < 6.5) {
                this.currentGear = 1; // 1ª Marcha: Max par de trepada (Hill Crawl)
            } else if (forwardSpeed < 14.0) {
                this.currentGear = 2; // 2ª Marcha: Crucero y aceleración media
            } else {
                this.currentGear = 3; // 3ª Marcha: Alta velocidad y saltos
            }
        } else if (this.isReversing) {
            this.currentGear = -1;
        }

        const gearIndex = Math.max(0, Math.min(cfg.gearRatios.length - 1, this.currentGear - 1));
        const gearRatio = cfg.gearRatios[gearIndex] || 1.0;

        // ── 2. CÁLCULO DE PAR VARIABLE ──────────────────────────────────────
        // A. Boost de pendiente (incline awareness):
        // Cuando el coche encara una subida (tilt < 0), el motor incrementa su par
        // para vencer la resistencia gravitatoria sin calarse.
        const uphillTilt = Math.max(0, -tilt);
        this.climbBoostFactor = 1.0 + Math.min(cfg.hillClimbSlopeGain, uphillTilt * 2.0);

        // B. Curva de par según RPM (Power band):
        // El par entrega su máximo en el rango medio-bajo (0.25 - 0.65 RPM)
        const rpmCurve = 0.55 + 0.45 * Math.sin(Math.PI * Math.pow(this.engineRpm, 0.75));

        // C. Par objetivo modulado:
        let targetTorque = 0;

        if (isAccel) {
            if (!this.isRearGrounded && !this.isFrontGrounded) {
                // En el aire: par libre reducido para no desbalancear el tren
                targetTorque = cfg.maxTorque * 0.4;
            } else if (isFlippingBackwards) {
                // Anti-vuelco inteligente: reduce gas para recuperar tracción
                targetTorque = 0;
            } else if (atSpinLimit) {
                // Limitador de revoluciones: mantiene par de crucero
                targetTorque = cfg.maxTorque * 0.45;
            } else {
                // Par Variable = Par Base * Relación de Transmisión * Factor Pendiente * Curva RPM
                targetTorque = cfg.maxTorque * gearRatio * this.climbBoostFactor * rpmCurve;
            }
        } else if (isBrake) {
            if (this.currentTorque > 0.05) {
                // Freno inicial
                targetTorque = 0;
                this.isReversing = false;
            } else {
                // Marcha atrás con par progresivo
                this.isReversing = true;
                targetTorque = (this.isRearGrounded || this.isFrontGrounded) ? -cfg.reverseTorque : 0;
            }
        } else {
            targetTorque = 0;
            if (Math.abs(this.currentTorque) < 0.005) {
                this.currentTorque = 0;
                this.isReversing = false;
            }
        }

        // Suavizado continuo de par
        const lerpSpeed = targetTorque !== 0 ? cfg.accelerationRate : cfg.decelerationRate;
        this.currentTorque += (targetTorque - this.currentTorque) * Math.min(1, lerpSpeed * deltaSec);

        this.throttle = Math.max(0, this.currentTorque) / (cfg.maxTorque * (cfg.gearRatios[0] || 2.5));

        // ── 3. DISTRIBUCIÓN DE PAR (AWD HILL CLIMB ASSIST) ──────────────────
        // En pendientes pronunciadas, una fracción del par se transfiere a la rueda delantera
        // para traccionar y coronar crestas en vez de encallar la panza.
        if (Math.abs(this.currentTorque) > 0.001) {
            if (this.isRearGrounded && !atSpinLimit) {
                const rearRatio = uphillTilt > 0.25 ? 0.75 : 1.0;
                rearWheel.torque += this.currentTorque * rearRatio;
            }

            // Asistencia delantera activa en subidas o cuando el morro toca tierra
            if (isAccel && this.isFrontGrounded && (uphillTilt > 0.15 || !this.isRearGrounded)) {
                this.frontTorque = this.currentTorque * cfg.frontAssistRatio;
                frontWheel.torque += this.frontTorque;
            } else {
                this.frontTorque = 0;
            }
        } else {
            this.frontTorque = 0;
        }

        // ── 4. CONTROL DE PATINADA Y ADHERENCIA ─────────────────────────────
        const treadSpeed = rearWheel.angularVelocity * cfg.wheelRadius;
        const groundSpeed = chassis.velocity.x;
        this.slip = this.isRearGrounded
            ? Math.min(1, Math.abs(treadSpeed - groundSpeed) / cfg.slipReference)
            : 0;

        // ── 5. TRANSFERENCIA DE PESO Y CABECEO DINÁMICO ──────────────────────
        if (!airborne) {
            const pitchDir = isAccel ? -1 : isBrake ? 1 : 0;
            if (pitchDir !== 0 && Math.abs(chassis.angularVelocity) < cfg.maxPitchSpin) {
                const strength = isAccel
                    ? cfg.launchPitchTorque * Math.min(1, this.throttle * 1.2)
                    : cfg.brakePitchTorque;
                const headroom = isAccel
                    ? Math.max(0, 1 - Math.max(0, -tilt) / cfg.maxWheelieAngle)
                    : 1;
                chassis.torque += pitchDir * strength * headroom;
            }
        }

        // ── 6. CONTROL ACTIVO EN EL AIRE (AIR FLIP CONTROL) ──────────────────
        if (airborne && (isAccel || isBrake)) {
            const dir = isAccel ? -1 : 1;
            if (Math.abs(chassis.angularVelocity) < cfg.airControlMaxSpin) {
                chassis.torque += dir * cfg.airControl;
            }
        }

        this.updateEngineRpm(deltaSec, isAccel || isBrake, airborne);
    }

    /**
     * Régimen del motor (RPM). Sigue al par variable y la velocidad de ruedas.
     */
    private updateEngineRpm(deltaSec: number, hasInput: boolean, airborne: boolean) {
        const cfg = this.config;
        const IDLE = 0.12;

        const wheelFraction = Math.min(1, Math.abs(this.rearWheelSpin) / cfg.maxWheelSpin);

        let target: number;
        if (!hasInput || this.outOfFuel) {
            target = Math.max(IDLE, wheelFraction * 0.65);
        } else if (airborne) {
            target = 0.65 + 0.35 * Math.abs(this.throttle || 0.7);
        } else {
            // RPM combinan velocidad de rueda, patinada y marcha
            const gearFactor = this.currentGear === 1 ? 0.85 : this.currentGear === 2 ? 0.95 : 1.0;
            target = Math.max(wheelFraction * gearFactor, this.slip * 0.98);
        }

        const rate = target > this.engineRpm ? 8.5 : 3.5;
        this.engineRpm += (target - this.engineRpm) * Math.min(1, rate * deltaSec);
        this.engineRpm = Math.max(0, Math.min(1, this.engineRpm));
    }

    private get rearWheelSpin(): number {
        return this.vehicle.rearWheel.angularVelocity;
    }
}
