import Matter from 'matter-js';
import { Vehicle } from '../entities/vehicle';
import { SuspensionConfigType, DEFAULT_SUSPENSION_CONFIG } from '../config/SuspensionConfig';

export type StrutId = 'rear' | 'front';

/** Estado instantáneo de un montante, para el modo debug. */
export interface StrutTelemetry {
    id: StrutId;
    /** Longitud actual anclaje → eje, en px. */
    length: number;
    /** Recorrido consumido: 0 = totalmente extendido, 1 = tope de compresión. */
    compression: number;
    /** Velocidad de compresión en px/paso. Positiva al comprimir. */
    compressionVelocity: number;
    springForce: number;
    damperForce: number;
    bumpStopForce: number;
    totalForce: number;
    bumpStopActive: boolean;
    reboundStopActive: boolean;
}

const EMPTY_TELEMETRY = (id: StrutId): StrutTelemetry => ({
    id,
    length: 0,
    compression: 0,
    compressionVelocity: 0,
    springForce: 0,
    damperForce: 0,
    bumpStopForce: 0,
    totalForce: 0,
    bumpStopActive: false,
    reboundStopActive: false,
});

/**
 * Montante progresivo basado enteramente en fuerzas (TASK-011).
 *
 * Sustituye a la rigidez constante de los muelles de Matter. La respuesta se
 * compone de tres términos continuos, sin escalones:
 *
 *   1. Muelle progresivo: lineal al principio del recorrido y cada vez más
 *      firme al acercarse al tope, con F = k0·d + k1·d·(d/dmax)^p.
 *   2. Amortiguación asimétrica y dependiente de la velocidad: más freno cuanto
 *      más rápido se comprime, y menos al extender para que la rueda vuelva
 *      deprisa a buscar el suelo.
 *   3. Topes de final de recorrido (bump stop y droop stop) con crecimiento
 *      cúbico, que impiden agotar el recorrido sin volver rígida la marcha.
 *
 * No se toca ninguna posición ni velocidad: todo sale de applyForce, y la
 * reacción se aplica en el punto de anclaje del chasis, de donde salen solos
 * el balanceo, el hundimiento al frenar y la transferencia de peso.
 */
export class SuspensionSystem {
    private config: SuspensionConfigType;
    private telemetry: Record<StrutId, StrutTelemetry>;

    constructor(customConfig: Partial<SuspensionConfigType> = {}) {
        this.config = { ...DEFAULT_SUSPENSION_CONFIG, ...customConfig };
        this.telemetry = {
            rear: EMPTY_TELEMETRY('rear'),
            front: EMPTY_TELEMETRY('front'),
        };
    }

    public getConfig(): SuspensionConfigType {
        return this.config;
    }

    public getTelemetry(): StrutTelemetry[] {
        return [this.telemetry.rear, this.telemetry.front];
    }

    /** Un paso del modelo. Debe llamarse ANTES de Matter.Engine.update. */
    public update(vehicle: Vehicle) {
        const cfg = vehicle.getConfig();
        const chassis = vehicle.chassis;

        const cos = Math.cos(chassis.angle);
        const sin = Math.sin(chassis.angle);
        // Eje del montante: "abajo" en coordenadas del chasis
        const axisX = -sin;
        const axisY = cos;

        this.applyStrut('rear', vehicle, vehicle.rearWheel, cfg.wheelOffsetRearX, cos, sin, axisX, axisY);
        this.applyStrut('front', vehicle, vehicle.frontWheel, cfg.wheelOffsetFrontX, cos, sin, axisX, axisY);
    }

    private applyStrut(
        id: StrutId,
        vehicle: Vehicle,
        wheel: Matter.Body,
        offsetX: number,
        cos: number,
        sin: number,
        axisX: number,
        axisY: number
    ) {
        const cfg = vehicle.getConfig();
        const s = this.config;
        const chassis = vehicle.chassis;

        // Punto de anclaje en coordenadas de mundo
        const anchorX = chassis.position.x + offsetX * cos - cfg.anchorOffsetY * sin;
        const anchorY = chassis.position.y + offsetX * sin + cfg.anchorOffsetY * cos;

        // Longitud actual del montante, con signo, a lo largo del eje
        const dx = wheel.position.x - anchorX;
        const dy = wheel.position.y - anchorY;
        const length = dx * axisX + dy * axisY;

        // Velocidad del chasis EN el punto de anclaje: v + ω × r
        const rx = anchorX - chassis.position.x;
        const ry = anchorY - chassis.position.y;
        const anchorVelX = chassis.velocity.x - chassis.angularVelocity * ry;
        const anchorVelY = chassis.velocity.y + chassis.angularVelocity * rx;

        // Velocidad de compresión: positiva cuando el montante se acorta
        const relVelX = wheel.velocity.x - anchorVelX;
        const relVelY = wheel.velocity.y - anchorVelY;
        const compressionVelocity = -(relVelX * axisX + relVelY * axisY);

        // Compresión respecto a la longitud libre. Positiva = comprimido.
        const deflection = s.restLength - length;

        // --- 1. MUELLE PROGRESIVO (continuo) ---
        let springForce: number;
        if (deflection >= 0) {
            const ratio = deflection / s.maxCompression;
            springForce =
                s.baseStiffness * deflection +
                s.progressiveStiffness * deflection * Math.pow(ratio, s.progressiveExponent);
        } else {
            // En extensión el muelle sólo tira, sin término progresivo: así la
            // rueda cae a buscar el suelo en vez de quedarse colgando.
            springForce = s.baseStiffness * deflection;
        }

        // --- 2. AMORTIGUACIÓN progresiva y asimétrica ---
        const speedFactor =
            1 + s.dampingSpeedGain * Math.min(1, Math.abs(compressionVelocity) / s.dampingSpeedReference);
        const dampingCoefficient =
            (compressionVelocity > 0 ? s.compressionDamping : s.reboundDamping) * speedFactor;
        const damperForce = dampingCoefficient * compressionVelocity;

        // --- 3. TOPES DE FINAL DE RECORRIDO (crecimiento cúbico) ---
        let bumpStopForce = 0;
        let bumpStopActive = false;
        let reboundStopActive = false;

        const compressionRatio = deflection / s.maxCompression;
        if (compressionRatio > s.bumpStopStart) {
            const over = (compressionRatio - s.bumpStopStart) / (1 - s.bumpStopStart);
            bumpStopForce = s.bumpStopStrength * over * over * over;
            bumpStopActive = true;
        } else {
            const extensionRatio = -deflection / s.maxExtension;
            if (extensionRatio > s.reboundStopStart) {
                const over = (extensionRatio - s.reboundStopStart) / (1 - s.reboundStopStart);
                bumpStopForce = -s.bumpStopStrength * over * over * over;
                reboundStopActive = true;
            }
        }

        // Fuerza total del montante: positiva = separa rueda y chasis
        let totalForce = springForce + damperForce + bumpStopForce;
        totalForce = Math.max(-s.maxForce, Math.min(s.maxForce, totalForce));

        // --- 4. GUÍA LATERAL ---
        // Sustituye al brazo mecánico: mantiene la rueda alineada con su anclaje
        // en el eje longitudinal del chasis. Sin ella el par motor arrastraría la
        // rueda hacia atrás hasta meterla debajo de la carrocería.
        const lateralAxisX = cos;
        const lateralAxisY = sin;
        const lateralOffset = dx * lateralAxisX + dy * lateralAxisY;
        const lateralVelocity =
            (wheel.velocity.x - anchorVelX) * lateralAxisX + (wheel.velocity.y - anchorVelY) * lateralAxisY;
        let lateralForce = -(s.lateralStiffness * lateralOffset + s.lateralDamping * lateralVelocity);
        lateralForce = Math.max(-s.maxForce, Math.min(s.maxForce, lateralForce));

        const forceX = axisX * totalForce + lateralAxisX * lateralForce;
        const forceY = axisY * totalForce + lateralAxisY * lateralForce;

        // La rueda recibe la fuerza en su centro (sin par parásito) y el chasis
        // la reacción EN EL ANCLAJE: de ahí salen solos el cabeceo y el balanceo.
        Matter.Body.applyForce(wheel, wheel.position, { x: forceX, y: forceY });
        Matter.Body.applyForce(chassis, { x: anchorX, y: anchorY }, { x: -forceX, y: -forceY });

        const t = this.telemetry[id];
        t.length = length;
        t.compression = Math.max(0, Math.min(1, compressionRatio));
        t.compressionVelocity = compressionVelocity;
        t.springForce = springForce;
        t.damperForce = damperForce;
        t.bumpStopForce = bumpStopForce;
        t.totalForce = totalForce;
        t.bumpStopActive = bumpStopActive;
        t.reboundStopActive = reboundStopActive;
    }
}
