'use client';

class HapticEngine {
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mile_haptic_enabled');
      this.enabled = saved !== 'false';
    }
  }

  setEnabled(val: boolean) {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mile_haptic_enabled', val ? 'true' : 'false');
    }
  }

  isEnabled() {
    return this.enabled;
  }

  vibrate(pattern: number | number[]) {
    if (!this.enabled) return;
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn('Vibration API blocked or failed:', e);
      }
    }
  }

  triggerTick() {
    this.vibrate(15);
  }

  triggerSuccess() {
    this.vibrate([20, 50, 20]);
  }

  triggerSave() {
    this.vibrate(30);
  }

  triggerError() {
    this.vibrate([50, 100, 50]);
  }
}

export const haptics = new HapticEngine();
