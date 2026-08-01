import { ActorRegistry } from '../../sdk/actors/registry/ActorRegistry.js';
import { ViewportManager } from '../../sdk/viewport/core/ViewportManager.js';
import { EventBus } from '../../sdk/events/EventBus.js';
import { MemoryStorageProvider } from '../../persistence/storage/StorageProvider.js';
import { ReplayRecorder } from '../../persistence/replay/ReplayRecorder.js';
import { ProceduralTerrain } from './HillClimbTerrain.js';
import {
  VehicleFactory,
  CoinFactory,
  FuelCanFactory,
  HudFactory,
  FIELD,
} from './HillClimbActors.js';
import {
  VehicleInputSystem,
  PhysicsEngineSystem,
  CameraFollowSystem,
  CollectibleSystem,
} from './HillClimbSystems.js';
import { HillClimbEvents, HillClimbState } from './HillClimbEvents.js';

export class HillClimbWorld {
  constructor() {
    this.terrain = new ProceduralTerrain();
    this.actorRegistry = new ActorRegistry();
    this.viewportManager = new ViewportManager();
    this.eventBus = new EventBus();

    // Persistence & Replay
    this.storage = new MemoryStorageProvider();
    this.replayRecorder = new ReplayRecorder();
    this.highDistance = 0;

    // Vehicle Composite Parts
    this.vehicle = null;
    this.hud = null;
    /** @type {import('../../sdk/actors/core/Actor.js').Actor[]} */
    this.collectibles = [];

    // Camera 2D Focus
    this.camera = { x: 10, y: 30 };

    // Systems
    this.inputSystem = new VehicleInputSystem();
    this.physicsSystem = new PhysicsEngineSystem();
    this.cameraSystem = new CameraFollowSystem();
    this.collectibleSystem = new CollectibleSystem();

    // State
    this.state = HillClimbState.READY;
    this.startX = 10;
    this.maxDistanceReached = 0;
    this.nextCollectibleX = 40;
    this.frameCount = 0;

    // Audio Log
    this.audioLog = [];
  }

  // ──────────── Lifecycle ────────────

  initialize() {
    this._loadPersistence();

    // 1. Create Vehicle Composite Actor
    this.vehicle = VehicleFactory.createVehicle(this.startX, 32);
    this.actorRegistry.register(this.vehicle.chassis);
    this.actorRegistry.register(this.vehicle.frontWheel);
    this.actorRegistry.register(this.vehicle.rearWheel);

    // 2. Create HUD
    this.hud = HudFactory.create();
    this.actorRegistry.register(this.hud);
    const status = this.hud.getComponent('GameStatusComponent');
    status.highDistance = this.highDistance;

    // 3. Initial Collectibles Spawning
    this._spawnTerrainCollectibles(200);

    this.replayRecorder.start();
    this.state = HillClimbState.PLAYING;
    this.eventBus.emit(HillClimbEvents.VEHICLE_SPAWNED, { x: this.startX });
  }

  // ──────────── Input Handling ────────────

  setControls(gas, brake) {
    if (this.state !== HillClimbState.PLAYING || !this.vehicle) return;
    const input = this.vehicle.chassis.getComponent('VehicleInputComponent');
    if (input) {
      input.gas = gas;
      input.brake = brake;
    }
  }

  togglePause() {
    if (this.state === HillClimbState.PLAYING) {
      this.state = HillClimbState.PAUSED;
      this.eventBus.emit(HillClimbEvents.GAME_PAUSED, {});
    } else if (this.state === HillClimbState.PAUSED) {
      this.state = HillClimbState.PLAYING;
      this.eventBus.emit(HillClimbEvents.GAME_RESUMED, {});
    }
  }

  // ──────────── Main Update Loop ────────────

  update(dt) {
    if (this.state === HillClimbState.PAUSED ||
        this.state === HillClimbState.GAME_OVER) {
      return;
    }

    this.frameCount++;

    // 1. Vehicle Input System
    this.inputSystem.update(this.vehicle.chassis);

    // 2. Fixed Physics Engine Integration & Suspension Constraints
    this.physicsSystem.update(dt, this.vehicle, this.terrain);

    // 3. Dynamic Camera Follow
    this.cameraSystem.update(dt, this.camera, this.vehicle.chassis);

    // 4. Fuel Depletion & Distance Calculation
    this._updateFuelAndDistance(dt);

    // 5. Collectibles System
    const colResult = this.collectibleSystem.update(this.vehicle, this.collectibles);
    this._processCollectibles(colResult);

    // 6. Check Vehicle Flip / Roll Condition
    this._checkVehicleFlipped();

    // 7. Dynamic Procedural Terrain Collectibles Expansion
    const cTc = this.vehicle.chassis.getComponent('TransformComponent');
    if (cTc && cTc.x + 150 > this.nextCollectibleX) {
      this._spawnTerrainCollectibles(this.nextCollectibleX + 200);
    }

    // 8. Consume Audio
    this._consumeAudio();

    // 9. Actor Component Updates
    this.actorRegistry.update(dt);
    this.viewportManager.update(dt);
  }

  // ──────────── Internal Logic ────────────

  _updateFuelAndDistance(dt) {
    const chassis = this.vehicle.chassis;
    const tank = chassis.getComponent('FuelTankComponent');
    const cTc = chassis.getComponent('TransformComponent');
    const status = this.hud.getComponent('GameStatusComponent');
    if (!tank || !cTc || !status) return;

    // Fuel Consumption
    const empty = tank.consume(tank.consumptionRate * dt);
    if (empty && this.state === HillClimbState.PLAYING) {
      this.eventBus.emit(HillClimbEvents.FUEL_EMPTY, {});
      this._handleGameOver('FUEL_EMPTY');
      return;
    }

    // Distance Calculation
    const currentDist = Math.max(0, Math.floor(cTc.x - this.startX));
    if (currentDist > status.distance) {
      status.distance = currentDist;
      this.maxDistanceReached = currentDist;

      this.eventBus.emit(HillClimbEvents.DISTANCE_UPDATED, { distance: currentDist });
      this.replayRecorder.record(this.frameCount, HillClimbEvents.DISTANCE_UPDATED, { distance: currentDist });

      if (currentDist > status.highDistance) {
        status.highDistance = currentDist;
        this.highDistance = currentDist;
        this._savePersistence();
      }
    }
  }

  _spawnTerrainCollectibles(targetX) {
    while (this.nextCollectibleX < targetX) {
      const x = this.nextCollectibleX;
      const y = this.terrain.getHeight(x) + 2.5;

      if (Math.floor(x) % 120 === 0) {
        // Spawn Fuel Can every 120 meters
        const fuelCan = FuelCanFactory.createFuelCan(x, y, 50);
        this.collectibles.push(fuelCan);
        this.actorRegistry.register(fuelCan);
      } else {
        // Spawn Coin every 40 meters
        const coin = CoinFactory.createCoin(x, y, 10);
        this.collectibles.push(coin);
        this.actorRegistry.register(coin);
      }

      this.nextCollectibleX += 40;
    }
  }

  _processCollectibles({ collectedCoins, collectedFuel }) {
    const status = this.hud.getComponent('GameStatusComponent');
    const tank = this.vehicle.chassis.getComponent('FuelTankComponent');

    for (const coin of collectedCoins) {
      status.coins++;
      status.score += coin.value * 10;
      this.actorRegistry.unregister(coin.id);
      const idx = this.collectibles.indexOf(coin);
      if (idx !== -1) this.collectibles.splice(idx, 1);

      this.eventBus.emit(HillClimbEvents.COIN_COLLECTED, { coins: status.coins, value: coin.value });
      this._audio('coin');
    }

    for (const fuelCan of collectedFuel) {
      if (tank) tank.refill(fuelCan.amount);
      this.actorRegistry.unregister(fuelCan.id);
      const idx = this.collectibles.indexOf(fuelCan);
      if (idx !== -1) this.collectibles.splice(idx, 1);

      this.eventBus.emit(HillClimbEvents.FUEL_COLLECTED, { fuel: tank ? tank.fuel : 100 });
      this._audio('fuel');
    }
  }

  _checkVehicleFlipped() {
    const cTc = this.vehicle.chassis.getComponent('TransformComponent');
    if (!cTc) return;

    // Check if chassis is flipped upside down (angle > 130° or < -130°) and touches ground
    const normalizedRot = Math.abs(cTc.rotation % (Math.PI * 2));
    const isFlipped = normalizedRot > 2.2 && normalizedRot < 4.1; // ~126° to 235°
    const groundY = this.terrain.getHeight(cTc.x);

    if (isFlipped && cTc.y <= groundY + FIELD.CHASSIS_RADIUS + 0.5) {
      this.eventBus.emit(HillClimbEvents.VEHICLE_FLIPPED, { x: cTc.x, y: cTc.y });
      this._handleGameOver('FLIPPED');
    }
  }

  _handleGameOver(reason) {
    this.state = HillClimbState.GAME_OVER;
    this.replayRecorder.stop();

    const status = this.hud.getComponent('GameStatusComponent');
    this.eventBus.emit(HillClimbEvents.RUN_COMPLETED, {
      reason,
      distance: status.distance,
      coins: status.coins,
    });
    this._audio('crash');
  }

  // ──────────── Persistence & Audio ────────────

  _loadPersistence() {
    const saved = this.storage.storage.get('high_distance');
    if (saved) {
      this.highDistance = parseInt(saved, 10) || 0;
    }
  }

  _savePersistence() {
    this.storage.save('high_distance', String(this.highDistance));
  }

  _audio(cue) {
    this.audioLog.push(cue);
  }

  _consumeAudio() {
    const audio = this.vehicle.chassis ? this.vehicle.chassis.getComponent('AudioCueComponent') : null;
    if (audio) {
      const cue = audio.consume();
      if (cue) this._audio(cue);
    }
  }

  // ──────────── Restart ────────────

  restart() {
    this.actorRegistry.clear();
    this.collectibles = [];
    this.audioLog = [];
    this.nextCollectibleX = 40;
    this.frameCount = 0;
    this.initialize();
  }
}
