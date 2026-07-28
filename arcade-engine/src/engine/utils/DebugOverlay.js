/**
 * Lightweight Debug HUD displaying FPS, Active Entities, Systems & Memory telemetry.
 */
export class DebugOverlay {
  constructor() {
    this.container = null;
    this.fpsEl = null;
    this.entitiesEl = null;
    this.systemsEl = null;
    this.customStatsEl = null;
    this.isVisible = false;
  }

  mount(parentEl = document.body) {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 9999;
      background: rgba(5, 5, 12, 0.85);
      border: 1px solid rgba(0, 255, 170, 0.4);
      color: #00ffaa;
      font-family: monospace;
      font-size: 11px;
      padding: 8px 12px;
      border-radius: 6px;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      line-height: 1.4;
      display: none;
    `;

    this.container.innerHTML = `
      <div style="font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #ff0055; margin-bottom: 4px;">Arcade Engine Debug</div>
      <div>FPS: <span id="dbg-fps" style="color: #fff;">0</span></div>
      <div>Entities: <span id="dbg-entities" style="color: #fff;">0</span></div>
      <div>Systems: <span id="dbg-systems" style="color: #fff;">0</span></div>
      <div id="dbg-custom" style="color: #88aaff; margin-top: 4px;"></div>
    `;

    parentEl.appendChild(this.container);

    this.fpsEl = this.container.querySelector('#dbg-fps');
    this.entitiesEl = this.container.querySelector('#dbg-entities');
    this.systemsEl = this.container.querySelector('#dbg-systems');
    this.customStatsEl = this.container.querySelector('#dbg-custom');
  }

  show() {
    this.isVisible = true;
    if (this.container) this.container.style.display = 'block';
  }

  hide() {
    this.isVisible = false;
    if (this.container) this.container.style.display = 'none';
  }

  toggle() {
    if (this.isVisible) this.hide();
    else this.show();
  }

  update({ fps = 0, entityCount = 0, systemCount = 0, customText = '' }) {
    if (!this.isVisible || !this.container) return;
    if (this.fpsEl) this.fpsEl.textContent = fps;
    if (this.entitiesEl) this.entitiesEl.textContent = entityCount;
    if (this.systemsEl) this.systemsEl.textContent = systemCount;
    if (this.customStatsEl) this.customStatsEl.textContent = customText;
  }

  destroy() {
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
      this.container = null;
    }
  }
}
