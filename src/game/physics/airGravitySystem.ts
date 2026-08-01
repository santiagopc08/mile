import { Vehicle } from '../entities/vehicle';
import { GAME_CONFIG } from '../config';

/**
 * Gravedad asimétrica en el aire.
 *
 * Portado del `JumpSystem` del motor C++ (`platform/engine/character/jump/`),
 * donde el salto usa `gravityScaleUp` < `gravityScaleDown`. Es la técnica que
 * separa un salto que se siente bien de uno flotante: subir con la gravedad
 * nominal conserva la altura que el jugador espera del terreno, y caer con más
 * peso acorta la espera y hace que el aterrizaje golpee.
 *
 * De las cuatro piezas del salto en C++ sólo ésta traslada al buggy. Altura
 * variable, coyote time y buffer de salto dependen de un botón de salto que
 * aquí no existe: el coche despega por la forma del terreno, no por una orden.
 *
 * La fuerza se reparte proporcional a la masa entre chasis y ruedas, que es
 * justo lo que hace la gravedad real. Aplicarla sólo al chasis introduciría un
 * par parásito y el coche cabecearía al caer.
 */

export interface AirGravityConfig {
    /** Multiplicador mientras sube. 1 = sin cambios respecto a la gravedad del mundo. */
    riseScale: number;
    /** Multiplicador mientras cae. > 1 acorta el tiempo de caída. */
    fallScale: number;
    /**
     * Banda muerta de velocidad vertical (px/paso) alrededor del vértice. Dentro
     * de ella la gravedad queda nominal, lo que produce el "apex hang": un
     * instante de suspensión arriba que da tiempo a colocar el coche.
     */
    apexThreshold: number;
}

/**
 * Multiplicador de gravedad para una velocidad vertical dada.
 *
 * Convenio de Matter.js: el eje Y crece hacia abajo, así que `velocityY < 0` es
 * subir y `velocityY > 0` es caer. Es el signo contrario al del motor C++, donde
 * Y crece hacia arriba.
 */
export function airGravityMultiplier(velocityY: number, cfg: AirGravityConfig): number {
    if (velocityY < -cfg.apexThreshold) return cfg.riseScale;
    if (velocityY > cfg.apexThreshold) return cfg.fallScale;
    return 1;
}

export class AirGravitySystem {
    private cfg: AirGravityConfig;

    constructor(cfg: AirGravityConfig = GAME_CONFIG.AIR) {
        this.cfg = cfg;
    }

    /**
     * Debe llamarse una vez por subpaso de física, después del controlador y
     * antes de `Matter.Engine.update`: Matter limpia `body.force` al final de
     * cada paso, así que la fuerza hay que reponerla en cada uno.
     */
    public update(vehicle: Vehicle, airborne: boolean) {
        if (!airborne) return;

        const multiplier = airGravityMultiplier(vehicle.getVelocity().y, this.cfg);
        if (multiplier === 1) return;

        // Matter aplica la gravedad como masa · gravity.y · gravity.scale. Para
        // escalarla por `multiplier` basta con añadir la diferencia.
        const extra = (multiplier - 1) * GAME_CONFIG.PHYSICS.GRAVITY_Y * MATTER_GRAVITY_SCALE;

        for (const body of [vehicle.chassis, vehicle.rearWheel, vehicle.frontWheel]) {
            body.force.y += body.mass * extra;
        }
    }
}

/** Igual que `gravity.scale` en PhysicsEngine; Matter no lo expone por cuerpo. */
const MATTER_GRAVITY_SCALE = 0.001;
