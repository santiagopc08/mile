import Matter from 'matter-js';
import { GAME_CONFIG } from '../config';

export class PhysicsEngine {
    private engine: Matter.Engine;
    private world: Matter.World;
    private accumulator = 0;

    constructor() {
        this.engine = Matter.Engine.create({
            gravity: {
                x: GAME_CONFIG.PHYSICS.GRAVITY_X,
                y: GAME_CONFIG.PHYSICS.GRAVITY_Y,
                scale: 0.001,
            },
            positionIterations: GAME_CONFIG.PHYSICS.POSITION_ITERATIONS,
            velocityIterations: GAME_CONFIG.PHYSICS.VELOCITY_ITERATIONS,
        });
        this.world = this.engine.world;
    }

    /**
     * Acumula el tiempo real y ejecuta tantos pasos fijos como quepan, de modo
     * que la simulación avance igual a 60 Hz que a 120 Hz. Antes se daba un paso
     * fijo por frame, así que en pantallas de 120 Hz el juego iba al doble.
     * Devuelve el número de pasos ejecutados.
     */
    public stepFixed(deltaSec: number, onStep?: (stepSec: number) => void): number {
        const stepMs = GAME_CONFIG.PHYSICS.TIME_STEP;
        const stepSec = stepMs / 1000;

        this.accumulator += deltaSec;

        // Tope de pasos: si la pestaña estuvo en segundo plano, descarta el atraso
        const maxSteps = GAME_CONFIG.PHYSICS.MAX_STEPS_PER_FRAME;
        if (this.accumulator > stepSec * maxSteps) {
            this.accumulator = stepSec * maxSteps;
        }

        let steps = 0;
        while (this.accumulator >= stepSec) {
            onStep?.(stepSec);
            Matter.Engine.update(this.engine, stepMs);
            this.accumulator -= stepSec;
            steps++;
        }
        return steps;
    }

    public resetAccumulator() {
        this.accumulator = 0;
    }

    public getWorld(): Matter.World {
        return this.world;
    }

    public getEngine(): Matter.Engine {
        return this.engine;
    }

    public clear() {
        Matter.World.clear(this.world, false);
        Matter.Engine.clear(this.engine);
        this.accumulator = 0;
    }
}
