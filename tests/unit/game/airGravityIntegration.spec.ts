import { test, expect } from '@playwright/test';
import Matter from 'matter-js';
import { Vehicle } from '../../../src/game/entities/vehicle';
import { AirGravitySystem } from '../../../src/game/physics/airGravitySystem';
import { GAME_CONFIG } from '../../../src/game/config';

/**
 * Efecto real de la gravedad asimétrica sobre la trayectoria.
 *
 * El test de `airGravity.spec.ts` sólo cubre la función que decide el
 * multiplicador. Éste simula el vuelo completo del buggy en Matter y comprueba
 * que la fuerza llega al cuerpo: sin esto, un fallo al conectar el sistema al
 * bucle pasaría desapercibido porque la función seguiría devolviendo 1.45.
 *
 * Es el mismo hueco que encontré en la suite C++ del platformer, donde 758 de
 * 795 aserciones verificaban banderas y ninguna comprobaba que el personaje se
 * moviera.
 */

const STEP_MS = GAME_CONFIG.PHYSICS.TIME_STEP;

interface FlightResult {
    /** Subpasos desde el lanzamiento hasta volver a la altura inicial. */
    steps: number;
    /** Altura máxima alcanzada, en px por encima del punto de lanzamiento. */
    peak: number;
}

/** Lanza el buggy hacia arriba en caída libre y mide el vuelo. */
function simulateFlight(useAirGravity: boolean): FlightResult {
    const engine = Matter.Engine.create({
        gravity: { x: 0, y: GAME_CONFIG.PHYSICS.GRAVITY_Y, scale: 0.001 },
    });

    const vehicle = new Vehicle(engine.world, 0, 0);
    const airGravity = new AirGravitySystem();

    // Impulso vertical inicial. Y negativo = hacia arriba en Matter.
    for (const body of [vehicle.chassis, vehicle.rearWheel, vehicle.frontWheel]) {
        Matter.Body.setVelocity(body, { x: 0, y: -12 });
    }

    const startY = vehicle.chassis.position.y;
    let peak = 0;
    let steps = 0;

    // Tope generoso: el vuelo real ronda los pocos cientos de subpasos.
    for (let i = 0; i < 5000; i++) {
        if (useAirGravity) airGravity.update(vehicle, true);
        Matter.Engine.update(engine, STEP_MS);
        steps++;

        const height = startY - vehicle.chassis.position.y; // positivo = más alto
        if (height > peak) peak = height;

        // Ha vuelto a bajar del punto de partida: vuelo terminado.
        if (steps > 5 && height <= 0) break;
    }

    return { steps, peak };
}

test.describe('AirGravitySystem sobre la trayectoria real', () => {
    test('acorta el vuelo sin recortar la altura alcanzada', () => {
        const sin = simulateFlight(false);
        const con = simulateFlight(true);

        // La subida no se toca (riseScale = 1), así que el pico debe coincidir.
        expect(GAME_CONFIG.AIR.riseScale).toBe(1.0);
        expect(con.peak).toBeGreaterThan(0);
        expect(Math.abs(con.peak - sin.peak) / sin.peak).toBeLessThan(0.02);

        // Pero la caída pesa más: el vuelo entero dura menos.
        expect(con.steps).toBeLessThan(sin.steps);
    });

    test('la fuerza llega al cuerpo, no se queda en la función', () => {
        const engine = Matter.Engine.create({
            gravity: { x: 0, y: GAME_CONFIG.PHYSICS.GRAVITY_Y, scale: 0.001 },
        });
        const vehicle = new Vehicle(engine.world, 0, 0);
        const airGravity = new AirGravitySystem();

        // Cayendo: Y positivo, fuera de la banda muerta del vértice.
        Matter.Body.setVelocity(vehicle.chassis, { x: 0, y: 5 });
        vehicle.chassis.force.y = 0;

        airGravity.update(vehicle, true);

        expect(vehicle.chassis.force.y).toBeGreaterThan(0);
    });

    test('en el suelo no aplica ninguna fuerza extra', () => {
        const engine = Matter.Engine.create({
            gravity: { x: 0, y: GAME_CONFIG.PHYSICS.GRAVITY_Y, scale: 0.001 },
        });
        const vehicle = new Vehicle(engine.world, 0, 0);
        const airGravity = new AirGravitySystem();

        Matter.Body.setVelocity(vehicle.chassis, { x: 0, y: 5 });
        vehicle.chassis.force.y = 0;

        airGravity.update(vehicle, false); // con las ruedas en el suelo

        expect(vehicle.chassis.force.y).toBe(0);
    });

    test('reparte la fuerza proporcional a la masa, sin par parásito', () => {
        const engine = Matter.Engine.create({
            gravity: { x: 0, y: GAME_CONFIG.PHYSICS.GRAVITY_Y, scale: 0.001 },
        });
        const vehicle = new Vehicle(engine.world, 0, 0);
        const airGravity = new AirGravitySystem();

        const bodies = [vehicle.chassis, vehicle.rearWheel, vehicle.frontWheel];
        for (const b of bodies) {
            Matter.Body.setVelocity(b, { x: 0, y: 5 });
            b.force.y = 0;
        }

        airGravity.update(vehicle, true);

        // Misma aceleración para todos = gravedad uniforme = el coche no cabecea.
        const accelerations = bodies.map((b) => b.force.y / b.mass);
        for (const a of accelerations) {
            expect(a).toBeCloseTo(accelerations[0], 10);
        }
    });
});
