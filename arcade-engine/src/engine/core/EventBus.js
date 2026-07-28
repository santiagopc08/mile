/**
 * High-performance, zero-allocation EventBus using Pub/Sub.
 */
export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event channel.
   * @param {string} event 
   * @param {Function} callback 
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const handlers = this.listeners.get(event);
    handlers.add(callback);

    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event once.
   * @param {string} event 
   * @param {Function} callback 
   */
  once(event, callback) {
    const wrapper = (payload) => {
      callback(payload);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event.
   * @param {string} event 
   * @param {Function} callback 
   */
  off(event, callback) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(callback);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event payload to all subscribers.
   * @param {string} event 
   * @param {any} [payload] 
   */
  emit(event, payload) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((callback) => {
        try {
          callback(payload);
        } catch (err) {
          console.error(`[EventBus] Error in handler for event "${event}":`, err);
        }
      });
    }
  }

  /**
   * Clear all listeners.
   */
  clear() {
    this.listeners.clear();
  }
}

// Built-in Standard Engine Events
export const EngineEvents = Object.freeze({
  GAME_LOADED: 'GameLoaded',
  GAME_STARTED: 'GameStarted',
  GAME_PAUSED: 'GamePaused',
  GAME_RESUMED: 'GameResumed',
  GAME_OVER: 'GameOver',
  VICTORY: 'Victory',
  LEVEL_COMPLETED: 'LevelCompleted',
  SCORE_CHANGED: 'ScoreChanged',
  LIVES_CHANGED: 'LivesChanged',
  COINS_CHANGED: 'CoinsChanged',
  PLAYER_DEAD: 'PlayerDead',
  ENTITY_DESTROYED: 'EntityDestroyed',
  POWERUP_COLLECTED: 'PowerUpCollected',
  ENEMY_KILLED: 'EnemyKilled',
  FPS_UPDATED: 'FpsUpdated',
});
