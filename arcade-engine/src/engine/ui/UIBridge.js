import { EngineEvents } from '../core/EventBus.js';

/**
 * UI Bridge syncs high-level Engine telemetry to React state observers.
 */
export class UIBridge {
  /**
   * @param {import('../core/EventBus.js').EventBus} eventBus 
   */
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.state = {
      score: 0,
      lives: 3,
      coins: 0,
      fps: 60,
      gameState: 'IDLE', // 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY'
    };

    /** @type {Set<Function>} React State Observers */
    this.observers = new Set();

    this._bindEvents();
  }

  _bindEvents() {
    this.eventBus.on(EngineEvents.SCORE_CHANGED, (score) => this.setState({ score }));
    this.eventBus.on(EngineEvents.LIVES_CHANGED, (lives) => this.setState({ lives }));
    this.eventBus.on(EngineEvents.COINS_CHANGED, (coins) => this.setState({ coins }));
    this.eventBus.on(EngineEvents.FPS_UPDATED, (fps) => this.setState({ fps }));
    this.eventBus.on(EngineEvents.GAME_STARTED, () => this.setState({ gameState: 'PLAYING' }));
    this.eventBus.on(EngineEvents.GAME_PAUSED, () => this.setState({ gameState: 'PAUSED' }));
    this.eventBus.on(EngineEvents.GAME_RESUMED, () => this.setState({ gameState: 'PLAYING' }));
    this.eventBus.on(EngineEvents.GAME_OVER, () => this.setState({ gameState: 'GAMEOVER' }));
    this.eventBus.on(EngineEvents.VICTORY, () => this.setState({ gameState: 'VICTORY' }));
  }

  subscribe(observer) {
    this.observers.add(observer);
    observer(this.state);
    return () => this.observers.delete(observer);
  }

  setState(partialState) {
    this.state = { ...this.state, ...partialState };
    this.observers.forEach((obs) => obs(this.state));
  }

  reset() {
    this.setState({
      score: 0,
      lives: 3,
      coins: 0,
      fps: 60,
      gameState: 'IDLE',
    });
  }
}
