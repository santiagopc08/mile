import { ActorRegistry } from '../../sdk/actors/registry/ActorRegistry.js';
import { ViewportManager } from '../../sdk/viewport/core/ViewportManager.js';
import { EventBus } from '../../sdk/events/EventBus.js';
import { MemoryStorageProvider } from '../../persistence/storage/StorageProvider.js';
import { ReplayRecorder } from '../../persistence/replay/ReplayRecorder.js';
import { TetrisGrid } from './TetrisGrid.js';
import { PieceFactory, BlockFactory, HudFactory, GRID_CONFIG } from './TetrisActors.js';
import { TetrisInputSystem, FallSystem } from './TetrisSystems.js';
import { TetrominoUtils } from './TetrisTetrominoes.js';
import { TetrisEvents, TetrisState, TetrominoType } from './TetrisEvents.js';

export class TetrisWorld {
  constructor() {
    this.grid = new TetrisGrid();
    this.actorRegistry = new ActorRegistry();
    this.viewportManager = new ViewportManager();
    this.eventBus = new EventBus();

    // Persistence & Replay
    this.storage = new MemoryStorageProvider();
    this.replayRecorder = new ReplayRecorder();
    this.highScore = 0;

    // Actors
    this.activePiece = null;
    this.nextPieceType = TetrominoType.T;
    this.holdPieceType = null;
    this.canHold = true;
    this.hud = null;
    /** @type {Map<string, import('../../sdk/actors/core/Actor.js').Actor>} "x,y" -> BlockActor */
    this.lockedBlockActors = new Map();

    // Systems
    this.inputSystem = new TetrisInputSystem();
    this.fallSystem = new FallSystem();

    // State
    this.state = TetrisState.READY;
    this.frameCount = 0;

    // Audio log (headless collection)
    this.audioLog = [];
  }

  // ──────────── Lifecycle ────────────

  initialize() {
    this._loadPersistence();

    this.hud = HudFactory.create();
    this.actorRegistry.register(this.hud);
    const status = this.hud.getComponent('GameStatusComponent');
    status.highScore = this.highScore;

    this.nextPieceType = TetrominoUtils.getRandomType();
    this.replayRecorder.start();

    this._spawnNextPiece();
    this.state = TetrisState.PLAYING;
  }

  // ──────────── Input Handling ────────────

  moveLeft() {
    this._setInput((i) => (i.moveX = -1));
  }

  moveRight() {
    this._setInput((i) => (i.moveX = 1));
  }

  rotateCW() {
    this._setInput((i) => (i.rotateDir = 1));
  }

  rotateCCW() {
    this._setInput((i) => (i.rotateDir = -1));
  }

  softDrop() {
    this._setInput((i) => (i.softDrop = true));
  }

  hardDrop() {
    this._setInput((i) => (i.hardDrop = true));
  }

  holdPiece() {
    this._setInput((i) => (i.hold = true));
  }

  togglePause() {
    if (this.state === TetrisState.PLAYING) {
      this.state = TetrisState.PAUSED;
      this.eventBus.emit(TetrisEvents.GAME_PAUSED, {});
    } else if (this.state === TetrisState.PAUSED) {
      this.state = TetrisState.PLAYING;
      this.eventBus.emit(TetrisEvents.GAME_RESUMED, {});
    }
  }

  _setInput(fn) {
    if (this.state !== TetrisState.PLAYING || !this.activePiece) return;
    const input = this.activePiece.getComponent('TetrisInputComponent');
    if (input) fn(input);
  }

  // ──────────── Main Update Loop ────────────

  update(dt) {
    if (this.state === TetrisState.PAUSED ||
        this.state === TetrisState.GAME_OVER) {
      return;
    }

    this.frameCount++;

    // 1. Process Player Inputs (Move, Rotate, Soft/Hard Drop, Hold)
    const inputResult = this.inputSystem.update(this.activePiece, this.grid);

    if (inputResult.held && this.canHold) {
      this._handleHoldPiece();
      return;
    }

    let isLocked = inputResult.pieceLocked;

    // 2. Process Gravity Fall System (if not already hard-dropped)
    if (!isLocked && this.activePiece) {
      const status = this.hud.getComponent('GameStatusComponent');
      const fallResult = this.fallSystem.update(dt, this.activePiece, this.grid, status.level);
      isLocked = fallResult.locked;
    }

    // 3. Handle Piece Locking & Line Completion
    if (isLocked && this.activePiece) {
      this._lockActivePiece();
    }

    // 4. Consume Audio
    this._consumeAudio();

    // 5. Actor Component updates
    this.actorRegistry.update(dt);
    this.viewportManager.update(dt);
  }

  // ──────────── Piece Spawning & Holding ────────────

  _spawnNextPiece() {
    const typeToSpawn = this.nextPieceType;
    this.nextPieceType = TetrominoUtils.getRandomType();
    this.canHold = true;

    this.activePiece = PieceFactory.createPiece(typeToSpawn);

    const pos = this.activePiece.getComponent('GridPositionComponent');
    const tetro = this.activePiece.getComponent('TetrominoComponent');

    // Check game over upon spawning
    if (!this.grid.isValidPosition(tetro.matrix, pos.gridX, pos.gridY)) {
      this._handleGameOver();
      return;
    }

    this.actorRegistry.register(this.activePiece);
    this.eventBus.emit(TetrisEvents.PIECE_SPAWNED, { type: typeToSpawn });
    this.replayRecorder.record(this.frameCount, TetrisEvents.PIECE_SPAWNED, { type: typeToSpawn });
  }

  _handleHoldPiece() {
    if (!this.activePiece || !this.canHold) return;

    this.canHold = false;
    const currentType = this.activePiece.getComponent('TetrominoComponent').type;

    this.actorRegistry.unregister(this.activePiece.id);
    this.activePiece = null;

    if (!this.holdPieceType) {
      this.holdPieceType = currentType;
      this._spawnNextPiece();
    } else {
      const swapType = this.holdPieceType;
      this.holdPieceType = currentType;
      this.activePiece = PieceFactory.createPiece(swapType);
      this.actorRegistry.register(this.activePiece);
    }
  }

  // ──────────── Lock Piece & Line Removal ────────────

  _lockActivePiece() {
    const pos = this.activePiece.getComponent('GridPositionComponent');
    const tetro = this.activePiece.getComponent('TetrominoComponent');

    // 1. Lock into occupancy grid & create locked block actors
    const lockedCells = this.grid.lockPiece(tetro.matrix, pos.gridX, pos.gridY, tetro.color);

    for (const cell of lockedCells) {
      const block = BlockFactory.createBlock(cell.x, cell.y, cell.color);
      this.lockedBlockActors.set(`${cell.x},${cell.y}`, block);
      this.actorRegistry.register(block);
    }

    // 2. Unregister active piece
    this.actorRegistry.unregister(this.activePiece.id);
    this.activePiece = null;

    this.eventBus.emit(TetrisEvents.PIECE_LOCKED, { count: lockedCells.length });
    this.replayRecorder.record(this.frameCount, TetrisEvents.PIECE_LOCKED, { count: lockedCells.length });
    this._audio('lock');

    // 3. Check & Clear completed lines
    const completedLines = this.grid.findCompletedLines();
    if (completedLines.length > 0) {
      this._clearCompletedLines(completedLines);
    }

    // 4. Spawn next piece
    this._spawnNextPiece();
  }

  _clearCompletedLines(completedLines) {
    const status = this.hud.getComponent('GameStatusComponent');
    const count = completedLines.length;

    // Score calculation
    const baseScores = [0, 100, 300, 500, 800];
    const earned = (baseScores[count] || 800) * status.level;
    status.score += earned;
    status.lines += count;

    this.eventBus.emit(TetrisEvents.LINE_COMPLETED, { lines: count, score: status.score });
    this.replayRecorder.record(this.frameCount, TetrisEvents.LINE_COMPLETED, { lines: count });

    // Perform Structural Mutation on discrete grid & re-render blocks
    this.grid.clearLines(completedLines);
    this._rebuildBlockActors();

    this.eventBus.emit(TetrisEvents.LINES_REMOVED, { count, totalLines: status.lines });

    // Level up check (every 10 lines)
    const newLevel = Math.floor(status.lines / 10) + 1;
    if (newLevel > status.level) {
      status.level = newLevel;
      this.eventBus.emit(TetrisEvents.LEVEL_UP, { level: newLevel });
    }

    this._audio('line_clear');

    if (status.score > status.highScore) {
      status.highScore = status.score;
      this.highScore = status.score;
      this._savePersistence();
    }
  }

  _rebuildBlockActors() {
    // Unregister all old locked block actors
    for (const block of this.lockedBlockActors.values()) {
      this.actorRegistry.unregister(block.id);
    }
    this.lockedBlockActors.clear();

    BlockFactory.resetCounter();

    // Re-create block actors for populated cells
    for (let r = 0; r < this.grid.height; r++) {
      for (let c = 0; c < this.grid.width; c++) {
        const color = this.grid.cells[r][c];
        if (color !== null) {
          const block = BlockFactory.createBlock(c, r, color);
          this.lockedBlockActors.set(`${c},${r}`, block);
          this.actorRegistry.register(block);
        }
      }
    }
  }

  // ──────────── Game Over & Persistence ────────────

  _handleGameOver() {
    this.state = TetrisState.GAME_OVER;
    this.replayRecorder.stop();

    const status = this.hud.getComponent('GameStatusComponent');
    this.eventBus.emit(TetrisEvents.GAME_OVER, { score: status.score });
    this.eventBus.emit(TetrisEvents.REPLAY_SAVED, { eventsCount: this.replayRecorder.replay.events.length });
    this._audio('game_over');
  }

  _loadPersistence() {
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

  _consumeAudio() {
    const audio = this.activePiece ? this.activePiece.getComponent('AudioCueComponent') : null;
    if (audio) {
      const cue = audio.consume();
      if (cue) this._audio(cue);
    }
  }

  // ──────────── Restart ────────────

  restart() {
    this.actorRegistry.clear();
    this.grid.clear();
    this.lockedBlockActors.clear();
    this.activePiece = null;
    this.holdPieceType = null;
    this.audioLog = [];
    this.frameCount = 0;
    this.initialize();
  }
}
