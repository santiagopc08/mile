/**
 * Deterministic GameLoop separating fixed updates (physics/collision)
 * from variable updates and frame rendering.
 */
export class GameLoop {
  /**
   * @param {Object} options
   * @param {number} [options.targetFps=60]
   * @param {Function} [options.onAlwaysUpdate] - Every frame update (runs even when paused)
   * @param {Function} options.onFixedUpdate - Fixed physics tick: (fixedDt) => void
   * @param {Function} options.onUpdate - Variable frame tick: (dt) => void
   * @param {Function} options.onLateUpdate - Post-update tick: (dt) => void
   * @param {Function} options.onRender - Render frame tick: (alpha) => void
   */
  constructor({ targetFps = 60, onAlwaysUpdate, onFixedUpdate, onUpdate, onLateUpdate, onRender }) {
    this.targetFps = targetFps;
    this.fixedDeltaTime = 1 / targetFps; // e.g. ~0.01666s
    this.maxAccumulator = 0.25; // Prevents spiral of death

    this.onAlwaysUpdate = onAlwaysUpdate || (() => {});
    this.onFixedUpdate = onFixedUpdate || (() => {});
    this.onUpdate = onUpdate || (() => {});
    this.onLateUpdate = onLateUpdate || (() => {});
    this.onRender = onRender || (() => {});

    this.isRunning = false;
    this.isPaused = false;

    this.lastTime = 0;
    this.accumulator = 0;
    this.animationFrameId = null;

    // Telemetry
    this.fps = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;

    this._step = this._step.bind(this);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now() / 1000;
    this.accumulator = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.animationFrameId = requestAnimationFrame(this._step);
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = performance.now() / 1000;
  }

  _step(timestampMs) {
    if (!this.isRunning) return;

    const currentTime = timestampMs / 1000;
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Clamp huge frame spikes
    if (deltaTime > this.maxAccumulator) {
      deltaTime = this.maxAccumulator;
    }

    // Telemetry tracking
    this.frameCount++;
    this.fpsTimer += deltaTime;
    if (this.fpsTimer >= 1.0) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    // Always-on update (Input manager & pause toggles)
    this.onAlwaysUpdate(deltaTime);

    if (!this.isPaused) {
      // 1. Fixed Timestep Loop (Physics & Collisions)
      this.accumulator += deltaTime;
      while (this.accumulator >= this.fixedDeltaTime) {
        this.onFixedUpdate(this.fixedDeltaTime);
        this.accumulator -= this.fixedDeltaTime;
      }

      // 2. Variable Update Loop (AI, Inputs, Animations)
      this.onUpdate(deltaTime);

      // 3. Late Update Loop (Camera follow, cleanups)
      this.onLateUpdate(deltaTime);
    }

    // 4. Render Tick with Interpolation Alpha
    const alpha = this.isPaused ? 1.0 : this.accumulator / this.fixedDeltaTime;
    this.onRender(alpha);

    this.animationFrameId = requestAnimationFrame(this._step);
  }
}
