import { ActorRegistry } from '../../sdk/actors/registry/ActorRegistry.js';
import { ViewportManager } from '../../sdk/viewport/core/ViewportManager.js';
import { EventBus } from '../../sdk/events/EventBus.js';
import { StateRegistry } from '../../persistence/core/PersistenceManager.js';
import { StateScope } from '../../persistence/state/StateObject.js';
import { MemoryStorageProvider } from '../../persistence/storage/StorageProvider.js';
import { PacmanMaze } from './PacmanMaze.js';
import {
  PacmanActorFactory,
  GhostActorFactory,
  PelletFactory,
  FruitFactory,
  HudFactory,
} from './PacmanActors.js';
import {
  PacmanInputSystem,
  DiscreteMovementSystem,
  GhostAISystem,
  PelletCollectionSystem,
  GhostCollisionSystem,
} from './PacmanSystems.js';
import { GhostState, GhostType, GameState, Direction, PacmanEvents } from './PacmanEvents.js';

// Global Mode Timings in seconds (Scatter vs Chase cycles)
const MODE_CYCLES = [
  { mode: GhostState.SCATTER, duration: 7 },
  { mode: GhostState.CHASE, duration: 20 },
  { mode: GhostState.SCATTER, duration: 7 },
  { mode: GhostState.CHASE, duration: 20 },
  { mode: GhostState.SCATTER, duration: 5 },
  { mode: GhostState.CHASE, duration: Infinity },
];

export class PacmanWorld {
  constructor() {
    this.maze = new PacmanMaze();
    this.actorRegistry = new ActorRegistry();
    this.viewportManager = new ViewportManager();
    this.eventBus = new EventBus();
    this.stateRegistry = new StateRegistry();

    // Persistence
    this.storage = new MemoryStorageProvider();
    this.highScore = 0;

    // Actors
    this.pacman = null;
    this.ghosts = new Map(); // GhostType -> Actor
    this.pelletsMap = new Map(); // "x,y" -> Actor
    this.fruit = null;
    this.hud = null;

    // Systems
    this.inputSystem = new PacmanInputSystem();
    this.movementSystem = new DiscreteMovementSystem();
    this.ghostAISystem = new GhostAISystem();
    this.pelletCollectionSystem = new PelletCollectionSystem();
    this.ghostCollisionSystem = new GhostCollisionSystem();

    // Mode cycle state
    this.cycleIndex = 0;
    this.cycleTimer = 0;
    this.globalGhostMode = GhostState.SCATTER;

    // Frightened state
    this.frightenedTimer = 0;
    this.frightenedDuration = 7.0;

    // Game state
    this.state = GameState.READY;
    this.fruitSpawned = false;

    // Audio log (headless collection)
    this.audioLog = [];
  }

  // ──────────── Lifecycle ────────────

  initialize() {
    // 1. Persistence high score restore
    this._loadPersistence();

    // 2. Create Pacman & Ghosts
    this.pacman = PacmanActorFactory.createPacman(this.maze.pacmanSpawn.x, this.maze.pacmanSpawn.y);
    this.actorRegistry.register(this.pacman);

    const types = [GhostType.BLINKY, GhostType.PINKY, GhostType.INKY, GhostType.CLYDE];
    for (const t of types) {
      const spawn = this.maze.ghostSpawns[t];
      const ghost = GhostActorFactory.createGhost(t, spawn.x, spawn.y);
      this.ghosts.set(t, ghost);
      this.actorRegistry.register(ghost);
    }

    // 3. Create Pellets & Power Pellets
    this._spawnPellets();

    // 4. Create HUD
    this.hud = HudFactory.create();
    this.actorRegistry.register(this.hud);
    const status = this.hud.getComponent('GameStatusComponent');
    status.highScore = this.highScore;
    status.pelletsRemaining = this.pelletsMap.size;

    this.state = GameState.PLAYING;
  }

  setBufferedDirection(dirName) {
    if (this.state !== GameState.PLAYING) return;
    const input = this.pacman.getComponent('PacmanInputComponent');
    if (input) {
      input.bufferedDirection = Direction[dirName] || Direction.NONE;
    }
  }

  togglePause() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      this.eventBus.emit(PacmanEvents.GAME_PAUSED, {});
    } else if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.eventBus.emit(PacmanEvents.GAME_RESUMED, {});
    }
  }

  // ──────────── Main Update Loop ────────────

  update(dt) {
    if (this.state === GameState.PAUSED ||
        this.state === GameState.GAME_OVER ||
        this.state === GameState.VICTORY) {
      return;
    }

    // 1. Update Mode Cycle / Frightened Timers
    this._updateTimers(dt);

    // 2. Run Input System for Pac-Man
    this.inputSystem.update(this.pacman, this.maze);

    // 3. Run Movement System for Pac-Man & Ghosts
    this.movementSystem.update(this.pacman, this.maze);
    for (const ghost of this.ghosts.values()) {
      this.movementSystem.update(ghost, this.maze);
    }

    // 4. Run Ghost AI System
    const blinky = this.ghosts.get(GhostType.BLINKY);
    for (const ghost of this.ghosts.values()) {
      this.ghostAISystem.update(ghost, this.pacman, blinky, this.maze, this.globalGhostMode);
    }

    // 5. Run Pellet & Item Collection System
    const pelletResult = this.pelletCollectionSystem.update(this.pacman, this.pelletsMap, this.fruit);
    this._processPelletCollection(pelletResult);

    // 6. Run Ghost Collision System
    const ghostResult = this.ghostCollisionSystem.update(this.pacman, Array.from(this.ghosts.values()));
    this._processGhostCollision(ghostResult);

    // 7. Consume Audio
    const audio = this.pacman ? this.pacman.getComponent('AudioCueComponent') : null;
    if (audio) {
      const cue = audio.consume();
      if (cue) this._audio(cue);
    }

    // 8. Check level victory
    if (this.pelletsMap.size === 0) {
      this._handleLevelCompleted();
    }

    // 9. Actor Component updates
    this.actorRegistry.update(dt);
    this.viewportManager.update(dt);
  }

  // ──────────── Timer Updates ────────────

  _updateTimers(dt) {
    // Frightened timer countdown
    if (this.frightenedTimer > 0) {
      this.frightenedTimer -= dt;
      if (this.frightenedTimer <= 0) {
        this.frightenedTimer = 0;
        for (const ghost of this.ghosts.values()) {
          const bh = ghost.getComponent('GhostBehaviorComponent');
          if (bh && bh.state === GhostState.FRIGHTENED) {
            bh.setState(this.globalGhostMode);
            this.eventBus.emit(PacmanEvents.GHOST_STATE_CHANGED, {
              ghostType: bh.ghostType,
              newState: this.globalGhostMode,
            });
          }
        }
      }
    } else {
      // Normal Scatter / Chase cycle countdown
      const currentCycle = MODE_CYCLES[this.cycleIndex];
      if (currentCycle && currentCycle.duration !== Infinity) {
        this.cycleTimer += dt;
        if (this.cycleTimer >= currentCycle.duration) {
          this.cycleTimer = 0;
          this.cycleIndex++;
          this.globalGhostMode = MODE_CYCLES[this.cycleIndex].mode;

          for (const ghost of this.ghosts.values()) {
            const bh = ghost.getComponent('GhostBehaviorComponent');
            if (bh && bh.state !== GhostState.RESPAWNING) {
              bh.setState(this.globalGhostMode);
            }
          }
        }
      }
    }
  }

  // ──────────── Pellets & Power Pellets ────────────

  _spawnPellets() {
    let count = 0;
    for (const pos of this.maze.pelletPositions) {
      const id = `pellet_${count++}`;
      const pellet = PelletFactory.createPellet(id, pos.x, pos.y, false);
      this.pelletsMap.set(`${pos.x},${pos.y}`, pellet);
      this.actorRegistry.register(pellet);
    }

    for (const pos of this.maze.powerPelletPositions) {
      const id = `power_pellet_${count++}`;
      const powerPellet = PelletFactory.createPellet(id, pos.x, pos.y, true);
      this.pelletsMap.set(`${pos.x},${pos.y}`, powerPellet);
      this.actorRegistry.register(powerPellet);
    }
  }

  _processPelletCollection({ consumedPellet, consumedPowerPellet, consumedFruit }) {
    const status = this.hud.getComponent('GameStatusComponent');

    if (consumedPellet) {
      status.score += consumedPellet.points;
      status.pelletsRemaining--;
      this.actorRegistry.unregister(consumedPellet.id);

      this.eventBus.emit(PacmanEvents.PELLET_CONSUMED, {
        score: status.score,
        remaining: status.pelletsRemaining,
      });

      this._checkFruitSpawn(status.pelletsRemaining);
      this._audio('pellet');
    }

    if (consumedPowerPellet) {
      status.score += consumedPowerPellet.points;
      status.pelletsRemaining--;
      status.ghostCombo = 0; // Reset combo multiplier
      this.actorRegistry.unregister(consumedPowerPellet.id);

      // Trigger Frightened state across all active ghosts
      this.frightenedTimer = this.frightenedDuration;
      for (const ghost of this.ghosts.values()) {
        const bh = ghost.getComponent('GhostBehaviorComponent');
        if (bh && bh.state !== GhostState.RESPAWNING) {
          bh.setState(GhostState.FRIGHTENED);
          this.eventBus.emit(PacmanEvents.GHOST_STATE_CHANGED, {
            ghostType: bh.ghostType,
            newState: GhostState.FRIGHTENED,
          });
        }
      }

      this.eventBus.emit(PacmanEvents.POWER_PELLET_CONSUMED, {
        score: status.score,
        remaining: status.pelletsRemaining,
      });

      this._audio('power_pellet');
    }

    if (consumedFruit && this.fruit) {
      status.score += this.fruit.points;
      this.actorRegistry.unregister(this.fruit.id);
      this.fruit = null;

      this.eventBus.emit(PacmanEvents.FRUIT_CONSUMED, { score: status.score });
      this._audio('fruit');
    }

    // High Score tracking & Persistence update
    if (status.score > status.highScore) {
      status.highScore = status.score;
      this.highScore = status.score;
      this._savePersistence();
    }
  }

  _checkFruitSpawn(pelletsRemaining) {
    if (!this.fruitSpawned && (pelletsRemaining === 150 || pelletsRemaining === 70)) {
      this.fruitSpawned = true;
      this.fruit = FruitFactory.createFruit(13, 17, 100);
      this.actorRegistry.register(this.fruit);
      this.eventBus.emit(PacmanEvents.FRUIT_SPAWNED, { x: 13, y: 17 });
    }
  }

  // ──────────── Ghost Collisions ────────────

  _processGhostCollision({ capturedGhost, pacmanDied }) {
    const status = this.hud.getComponent('GameStatusComponent');

    if (capturedGhost) {
      status.ghostCombo++;
      const points = 200 * Math.pow(2, status.ghostCombo - 1);
      status.score += points;

      this.eventBus.emit(PacmanEvents.GHOST_CAPTURED, {
        ghostType: capturedGhost.getComponent('GhostBehaviorComponent').ghostType,
        points,
        combo: status.ghostCombo,
        score: status.score,
      });

      this._audio('ghost_eat');
    }

    if (pacmanDied) {
      status.lives--;
      this.eventBus.emit(PacmanEvents.LIFE_LOST, { livesRemaining: status.lives });
      this._audio('pacman_death');

      if (status.lives <= 0) {
        this.state = GameState.GAME_OVER;
      } else {
        this._resetActorPositions();
      }
    }
  }

  _resetActorPositions() {
    // Reset Pac-Man
    const pacPos = this.pacman.getComponent('GridPositionComponent');
    pacPos.set(this.maze.pacmanSpawn.x, this.maze.pacmanSpawn.y);
    this.pacman.gridX = this.maze.pacmanSpawn.x;
    this.pacman.gridY = this.maze.pacmanSpawn.y;

    // Reset Ghosts
    const types = [GhostType.BLINKY, GhostType.PINKY, GhostType.INKY, GhostType.CLYDE];
    for (const t of types) {
      const ghost = this.ghosts.get(t);
      const spawn = this.maze.ghostSpawns[t];
      const gpos = ghost.getComponent('GridPositionComponent');
      const bh = ghost.getComponent('GhostBehaviorComponent');
      gpos.set(spawn.x, spawn.y);
      ghost.gridX = spawn.x;
      ghost.gridY = spawn.y;
      if (bh) bh.setState(this.globalGhostMode);
    }
  }

  _handleLevelCompleted() {
    const status = this.hud.getComponent('GameStatusComponent');
    this.eventBus.emit(PacmanEvents.LEVEL_COMPLETED, { level: status.level });

    status.level++;
    this.eventBus.emit(PacmanEvents.GAME_COMPLETED, { score: status.score });
    this.state = GameState.VICTORY;
  }

  // ──────────── Persistence & Audio ────────────

  _loadPersistence() {
    this.stateRegistry.register('high_score', 0, StateScope.GLOBAL);
    const saved = this.storage.storage.get('high_score');
    if (saved) {
      this.highScore = parseInt(saved, 10) || 0;
    }
  }

  _savePersistence() {
    this.storage.save('high_score', String(this.highScore));
  }

  _audio(cue) {
    this.audioLog.push(cue);
  }

  // ──────────── Restart ────────────

  restart() {
    this.actorRegistry.clear();
    this.ghosts.clear();
    this.pelletsMap.clear();
    this.fruit = null;
    this.audioLog = [];
    this.cycleIndex = 0;
    this.cycleTimer = 0;
    this.globalGhostMode = GhostState.SCATTER;
    this.frightenedTimer = 0;
    this.fruitSpawned = false;
    this.initialize();
  }
}
