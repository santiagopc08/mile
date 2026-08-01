import { PhysicsEngine } from '../physics/physicsEngine';
import { Vehicle } from '../entities/vehicle';
import { VehicleController } from '../controllers/vehicleController';
import { TerrainManager } from '../terrain/terrainManager';
import { CameraSystem } from '../camera/cameraSystem';
import { GameRenderer } from '../renderer/gameRenderer';
import { InputManager } from '../utils/inputManager';
import { CoinManager } from '../entities/coin';
import { FuelCanisterManager } from '../entities/fuelCanister';
import { ParticleSystem } from '../particles/particleSystem';
import { SuspensionSystem } from '../physics/suspensionSystem';
import { AirGravitySystem } from '../physics/airGravitySystem';
import { GAME_CONFIG } from '../config';
import { useHillClimbStore } from '../../stores/useHillClimbStore';

const SPAWN_X = 220;

export class GameLoop {
    private physics: PhysicsEngine;
    private vehicle: Vehicle | null = null;
    private controller: VehicleController | null = null;
    private terrain: TerrainManager;
    private camera: CameraSystem;
    private renderer: GameRenderer | null = null;
    private input: InputManager;
    private coins: CoinManager;
    private canisters: FuelCanisterManager;
    private particles: ParticleSystem;
    private suspension: SuspensionSystem;
    private airGravity: AirGravitySystem;

    private animFrameId: number | null = null;
    private isRunning = false;
    private lastFrameTime = 0;
    private elapsedSec = 0;

    // Estado de la partida
    private fuel: number = GAME_CONFIG.FUEL.MAX_FUEL;
    private coinTotal = 0;
    private distanceMeters = 0;
    private flipTimer = 0;
    private wasAirborne = false;
    private lastAirTime = 0;
    private accentColor = '#c3f400';

    constructor() {
        this.physics = new PhysicsEngine();
        this.terrain = new TerrainManager(this.physics.getWorld());
        this.camera = new CameraSystem();
        this.input = InputManager.getInstance();
        this.coins = new CoinManager(this.terrain);
        this.canisters = new FuelCanisterManager(this.terrain);
        this.particles = new ParticleSystem();
        this.suspension = new SuspensionSystem();
        this.airGravity = new AirGravitySystem();
    }

    public attachCanvas(canvas: HTMLCanvasElement) {
        this.renderer = new GameRenderer(canvas);
        this.renderer.setAccentColor(this.accentColor);
        this.input.attach();
        this.initPreview();
    }

    /** Color del buggy y de los acentos del mundo (perfil "el" / "ella"). */
    public setAccentColor(color: string) {
        this.accentColor = color;
        this.renderer?.setAccentColor(color);
    }

    /** Tamaño del canvas en px CSS + densidad de pantalla. */
    public resize(cssWidth: number, cssHeight: number, dpr: number) {
        this.renderer?.resize(cssWidth, cssHeight, dpr);
        this.camera.setViewport(cssWidth, cssHeight);
        if (!this.isRunning) {
            const pos = this.vehicle?.getPosition();
            if (pos) this.camera.reset(pos.x, pos.y);
            this.renderCurrentFrame();
        }
    }

    /** Escena estática que se ve detrás del menú antes de empezar. */
    public initPreview() {
        this.buildScene(Math.floor(Math.random() * 100000));
        this.renderCurrentFrame();
    }

    private buildScene(seed: number) {
        this.physics.clear();
        this.terrain.setSeed(seed);

        const groundY = this.terrain.getElevation(SPAWN_X);
        const cfg = GAME_CONFIG.VEHICLE;
        // Apoya las ruedas 2px por encima del suelo para que asiente sin rebotar
        const spawnY = groundY - cfg.wheelOffsetY - cfg.wheelRadius - 2;

        this.vehicle = new Vehicle(this.physics.getWorld(), SPAWN_X, spawnY);
        this.controller = new VehicleController(this.vehicle, this.input, {}, this.terrain);

        this.camera.reset(SPAWN_X, spawnY);
        this.coins.clear();
        this.canisters.clear();
        this.particles.clear();

        this.fuel = GAME_CONFIG.FUEL.MAX_FUEL;
        this.coinTotal = 0;
        this.distanceMeters = 0;
        this.flipTimer = 0;
        this.wasAirborne = false;
        this.elapsedSec = 0;
    }

    public renderCurrentFrame() {
        if (!this.renderer) return;
        this.renderer.render({
            camera: this.camera,
            vehicle: this.vehicle,
            segments: this.terrain.getActiveSegments(),
            coins: this.coins.getActiveCoins(),
            canisters: this.canisters.getActiveCanisters(),
            particles: this.particles.getParticles(),
            controller: this.controller,
            timeSec: this.elapsedSec,
            fuel: this.fuel,
            debug: this.input.isDebugMode,
            suspension: this.suspension.getTelemetry(),
        });
    }

    public start() {
        this.stop();
        this.buildScene(Math.floor(Math.random() * 100000));
        this.physics.resetAccumulator();

        useHillClimbStore.getState().resetGame();
        this.pushHUD();

        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.animFrameId = requestAnimationFrame(this.loop);
    }

    public stop() {
        this.isRunning = false;
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    /** Congela el bucle sin perder la partida (pestaña oculta). */
    public pause() {
        if (!this.isRunning) return;
        this.stop();
        this.input.releaseAll();
    }

    public resume() {
        if (this.isRunning) return;
        if (useHillClimbStore.getState().gameState !== 'PLAYING') return;
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.physics.resetAccumulator();
        this.animFrameId = requestAnimationFrame(this.loop);
    }

    private pushHUD() {
        const speedKmh = this.vehicle ? Math.abs(this.vehicle.getVelocity().x) * 4.32 : 0;
        useHillClimbStore.getState().updateHUD({
            fuel: this.fuel,
            distance: this.distanceMeters,
            coins: this.coinTotal,
            speed: Math.round(speedKmh),
            airTime: this.controller?.airTime ?? 0,
            rpm: this.controller?.engineRpm ?? 0,
            // Se lee del InputManager, no del estado táctil: así los pedales de
            // la pantalla también se iluminan al conducir con el teclado.
            accelActive: this.input.isAccelerating,
            brakeActive: this.input.isBraking,
        });
    }

    private endRun(reason: string) {
        this.stop();
        this.input.releaseAll();
        useHillClimbStore.getState().setGameOver(reason);
        this.renderCurrentFrame();
    }

    private loop = (currentTime: number) => {
        if (!this.isRunning) return;

        const deltaSec = Math.min((currentTime - this.lastFrameTime) / 1000, 0.25);
        this.lastFrameTime = currentTime;
        this.elapsedSec += deltaSec;

        if (this.input.consumeRestart()) {
            this.start();
            return;
        }

        const vehicle = this.vehicle;
        const controller = this.controller;
        if (!vehicle || !controller) return;

        // 1. FÍSICA con paso fijo: control y tope de giro se aplican en CADA
        //    subpaso, no una vez por frame, o la rueda se embalaría dentro del
        //    propio frame en pantallas lentas.
        this.physics.stepFixed(deltaSec, (stepSec) => {
            vehicle.clampWheelSpin();           // limitador del tren motriz
            this.suspension.update(vehicle);    // muelle progresivo, sólo fuerzas
            controller.update(stepSec);
            // Después del controlador (que acaba de recalcular airTime) y antes
            // del paso de Matter, que limpia las fuerzas al terminar.
            this.airGravity.update(vehicle, controller.airTime > 0);
        });
        vehicle.clampWheelSpin();

        const vPos = vehicle.getPosition();
        const vVel = vehicle.getVelocity();

        // 2. COMBUSTIBLE
        const burn = controller.throttle > 0.05
            ? GAME_CONFIG.FUEL.ACCEL_BURN_RATE
            : GAME_CONFIG.FUEL.IDLE_BURN_RATE;
        this.fuel = Math.max(0, this.fuel - burn * deltaSec);
        controller.outOfFuel = this.fuel <= 0;

        // 3. DISTANCIA (récord: nunca decrece al retroceder)
        const meters = Math.floor((vPos.x - SPAWN_X) / GAME_CONFIG.SCORE.PIXELS_PER_METER);
        this.distanceMeters = Math.max(this.distanceMeters, Math.max(0, meters));

        // 4. TERRENO en streaming
        this.terrain.update(vPos.x);

        // 5. RECOGIDAS
        const picked = this.coins.update(this.camera.x, vPos, deltaSec);
        for (const coin of picked) {
            this.coinTotal += GAME_CONFIG.COINS.VALUE;
            this.particles.emitCoinBurst(coin.x, coin.y);
        }

        const canister = this.canisters.update(this.camera.x, vPos);
        if (canister) {
            this.fuel = Math.min(
                GAME_CONFIG.FUEL.MAX_FUEL,
                this.fuel + GAME_CONFIG.FUEL.CANISTER_REFILL_AMOUNT
            );
            this.particles.emitFuelBurst(canister.x, canister.y);
            this.camera.addShake(2.5);
        }

        // 6. EFECTOS ligados al estado del vehículo
        this.updateEffects(controller, vehicle);

        // 7. DERROTA
        const death = this.checkDeath(deltaSec, vPos);
        if (death) {
            this.endRun(death);
            return;
        }

        // 8. CÁMARA, HUD y DIBUJO
        this.camera.update(vPos, vVel, deltaSec);
        this.particles.update(deltaSec);
        this.pushHUD();
        this.renderCurrentFrame();

        this.animFrameId = requestAnimationFrame(this.loop);
    };

    private updateEffects(controller: VehicleController, vehicle: Vehicle) {
        const rear = vehicle.rearWheel;
        const airborne = controller.airTime > 0;

        // Tierra levantada al acelerar. La patinada pesa más que el gas: pisar a
        // fondo desde parado levanta una nube, ir lanzado y con agarre apenas.
        if (controller.isRearGrounded && (controller.throttle > 0.15 || controller.slip > 0.2)) {
            const intensity = Math.min(1, controller.throttle * 0.45 + controller.slip * 0.9);
            this.particles.emitDirt(
                rear.position.x,
                rear.position.y + vehicle.getConfig().wheelRadius * 0.8,
                intensity,
                Math.sign(rear.angularVelocity) || 1
            );
            // Aquí NO va temblor de cámara. Con el tope de giro, la banda de
            // rodadura casi siempre gira más rápido que el avance del coche, así
            // que el derrape está alto el 80-99% del tiempo (subiendo, el 99%).
            // Ligar el temblor a ese estado saturaba la cámara y la desplazaba
            // ±8px al azar en cada frame: eso era la "vibración excesiva", y no
            // tenía nada que ver con la suspensión. El derrape ya se ve en la
            // tierra que levanta la rueda.
        }

        // Humo del escape en la trasera del chasis
        if (controller.throttle > 0.05 || Math.random() < 0.08) {
            const angle = vehicle.chassis.angle;
            const ex = vehicle.chassis.position.x - Math.cos(angle) * 58 + Math.sin(angle) * 4;
            const ey = vehicle.chassis.position.y - Math.sin(angle) * 58 - Math.cos(angle) * 4;
            this.particles.emitExhaust(ex, ey, controller.throttle);
        }

        // Aterrizaje: polvo, temblor y bonus por el tiempo que estuvo en el aire
        if (this.wasAirborne && !airborne) {
            const impact = Math.min(1, Math.abs(vehicle.getVelocity().y) / 14);
            if (impact > 0.15) {
                this.particles.emitLandingPuff(rear.position.x, rear.position.y + 18, impact);
                this.camera.addShake(impact * 5);
            }
            if (this.lastAirTime >= GAME_CONFIG.SCORE.MIN_AIRTIME_FOR_BONUS) {
                this.coinTotal += Math.round(this.lastAirTime * GAME_CONFIG.SCORE.AIRTIME_BONUS_PER_SEC);
            }
            this.lastAirTime = 0;
        }

        if (airborne) this.lastAirTime = controller.airTime;
        this.wasAirborne = airborne;
    }

    private checkDeath(deltaSec: number, vPos: { x: number; y: number }): string | null {
        const vehicle = this.vehicle;
        if (!vehicle) return null;

        // a) Volcado: hay un margen para poder recuperarse con el control aéreo
        if (vehicle.isUpsideDown()) {
            this.flipTimer += deltaSec;
            if (this.flipTimer >= GAME_CONFIG.DEATH.FLIP_GRACE_SECONDS) {
                return 'Te has quedado con las ruedas hacia arriba. El casco aguantó, el orgullo no.';
            }
        } else {
            this.flipTimer = 0;
        }

        // b) Sin gasolina y ya detenido
        if (this.fuel <= 0 && Math.abs(vehicle.getVelocity().x) < 0.35) {
            return 'Te quedaste sin gasolina en mitad de la montaña.';
        }

        // c) Caída fuera del mundo (hueco en el terreno o glitch)
        if (vPos.y > this.terrain.getElevation(vPos.x) + GAME_CONFIG.DEATH.FALL_DEPTH) {
            return 'Te caíste al vacío.';
        }

        return null;
    }

    public destroy() {
        this.stop();
        this.input.detach();
        this.physics.clear();
        this.terrain.clear();
        this.coins.clear();
        this.canisters.clear();
        this.particles.clear();
        this.renderer = null;
    }
}
