import Matter from 'matter-js';
import { VehicleConfigType, DEFAULT_VEHICLE_CONFIG } from '../config/VehicleConfig';

export class Vehicle {
    public composite: Matter.Composite;
    public chassis: Matter.Body;
    public rearWheel: Matter.Body;
    public frontWheel: Matter.Body;

    private world: Matter.World;
    private config: VehicleConfigType;

    constructor(
        world: Matter.World,
        spawnX: number,
        spawnY: number,
        customConfig: Partial<VehicleConfigType> = {}
    ) {
        this.world = world;
        this.config = { ...DEFAULT_VEHICLE_CONFIG, ...customConfig };
        const cfg = this.config;

        this.composite = Matter.Composite.create({ label: 'HillClimbVehicle' });

        // Grupo negativo: chasis y ruedas no colisionan entre sí
        const group = Matter.Body.nextGroup(true);

        const width = cfg.chassisWidth;
        const height = cfg.chassisHeight;
        const radius = cfg.wheelRadius;

        // 1. Chasis
        this.chassis = Matter.Bodies.rectangle(spawnX, spawnY, width, height, {
            density: cfg.chassisMass / (width * height),
            friction: cfg.chassisFriction,
            restitution: cfg.chassisRestitution,
            slop: 0.05,
            chamfer: { radius: 6 },
            collisionFilter: { group },
            label: 'hc_chassis',
        });

        // Baja el centro de giro respecto a la geometría: centro de gravedad bajo.
        // Ojo: Matter.Body.setCentre mueve `position` sin mover los vértices, así
        // que a partir de aquí `chassis.position` está centerOfMassOffsetY px por
        // debajo del centro geométrico del rectángulo (el renderer lo compensa).
        Matter.Body.setCentre(
            this.chassis,
            { x: cfg.centerOfMassOffsetX, y: cfg.centerOfMassOffsetY },
            true
        );

        // 2. Ruedas
        const rearWheelSpawnX = spawnX + cfg.wheelOffsetRearX;
        const frontWheelSpawnX = spawnX + cfg.wheelOffsetFrontX;
        const wheelSpawnY = spawnY + cfg.wheelOffsetY;

        const wheelOptions: Matter.IChamferableBodyDefinition = {
            density: cfg.wheelMass / (Math.PI * radius * radius),
            friction: cfg.wheelFriction,
            frictionStatic: cfg.wheelFrictionStatic,
            restitution: cfg.wheelRestitution,
            slop: 0.05,
            collisionFilter: { group },
        };

        this.rearWheel = Matter.Bodies.circle(rearWheelSpawnX, wheelSpawnY, radius, {
            ...wheelOptions,
            label: 'hc_rear_wheel',
        });

        this.frontWheel = Matter.Bodies.circle(frontWheelSpawnX, wheelSpawnY, radius, {
            ...wheelOptions,
            label: 'hc_front_wheel',
        });

        // No hay Constraint de Matter: un muelle de distancia impone rigidez
        // constante y además admite la solución espejo (rueda por encima del
        // anclaje), que es lo que dejaba la llanta encajada en el chasis.
        // Toda la sujeción —vertical progresiva y lateral— la aplica
        // SuspensionSystem como fuerzas.

        Matter.Composite.add(this.composite, [this.chassis, this.rearWheel, this.frontWheel]);

        Matter.World.add(this.world, this.composite);
    }

    public getPosition(): { x: number; y: number } {
        return this.chassis.position;
    }

    public getVelocity(): { x: number; y: number } {
        return this.chassis.velocity;
    }

    public getAngle(): number {
        return this.chassis.angle;
    }

    public getConfig(): VehicleConfigType {
        return this.config;
    }

    /** Punto de anclaje del montante en coordenadas de mundo. */
    public getAnchorWorld(offsetX: number): { x: number; y: number } {
        const cos = Math.cos(this.chassis.angle);
        const sin = Math.sin(this.chassis.angle);
        const oy = this.config.anchorOffsetY;
        return {
            x: this.chassis.position.x + offsetX * cos - oy * sin,
            y: this.chassis.position.y + offsetX * sin + oy * cos,
        };
    }

    /**
     * Impide que las ruedas se embalen. Sin este tope la rueda motriz acelera
     * indefinidamente (se midieron ω > 400 rad/paso), lanza el coche por los
     * aires y lo deja tumbado: era la causa raíz de que el juego fuera injugable.
     */
    public clampWheelSpin() {
        const max = this.config.maxWheelSpin;
        for (const wheel of [this.rearWheel, this.frontWheel]) {
            if (Math.abs(wheel.angularVelocity) > max) {
                Matter.Body.setAngularVelocity(wheel, Math.sign(wheel.angularVelocity) * max);
            }
        }
    }

    /** Ángulo normalizado a (-π, π]. */
    public getNormalizedAngle(): number {
        const a = this.chassis.angle % (Math.PI * 2);
        if (a > Math.PI) return a - Math.PI * 2;
        if (a <= -Math.PI) return a + Math.PI * 2;
        return a;
    }

    /** El chasis está lo bastante invertido como para no poder recuperarse. */
    public isUpsideDown(): boolean {
        return Math.abs(this.getNormalizedAngle()) > Math.PI * 0.62;
    }

    public destroy() {
        Matter.World.remove(this.world, this.composite);
    }
}
