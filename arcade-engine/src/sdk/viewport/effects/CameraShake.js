export class CameraShake {
  constructor(intensity = 0.5, duration = 0.3) {
    this.intensity = intensity;
    this.duration = duration;
    this.elapsed = 0;
    this.active = false;
  }

  trigger() {
    this.active = true;
    this.elapsed = 0;
  }

  update(dt) {
    if (!this.active) return { offsetX: 0, offsetY: 0 };
    this.elapsed += dt;
    if (this.elapsed >= this.duration) {
      this.active = false;
      return { offsetX: 0, offsetY: 0 };
    }
    const offsetX = (Math.random() * 2 - 1) * this.intensity;
    const offsetY = (Math.random() * 2 - 1) * this.intensity;
    return { offsetX, offsetY };
  }
}

export class CameraZoom {
  constructor(targetZoom = 1.0, duration = 0.5) {
    this.targetZoom = targetZoom;
    this.duration = duration;
  }
}

export class CameraFade {
  constructor(color = 0x000000, duration = 0.5) {
    this.color = color;
    this.duration = duration;
    this.alpha = 0;
  }
}

export class CameraTransition {}
