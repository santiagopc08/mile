import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { haptics } from '../../src/lib/haptics';

describe('haptics', () => {
  let originalVibrate: typeof navigator.vibrate;

  beforeEach(() => {
    // Reset state before each test
    localStorage.clear();
    vi.restoreAllMocks();

    // Mock navigator.vibrate
    originalVibrate = navigator.vibrate;
    navigator.vibrate = vi.fn();

    // Suppress console warnings for error tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    navigator.vibrate = originalVibrate;
  });

  describe('Initialization and State', () => {
    it('initializes as enabled by default if localStorage is empty', () => {
      // Create a fresh instance for initialization tests to bypass the exported singleton
      const HapticEngine = (haptics as any).constructor;
      const newHaptics = new HapticEngine();
      expect(newHaptics.isEnabled()).toBe(true);
    });

    it('initializes based on localStorage', () => {
      localStorage.setItem('mile_haptic_enabled', 'false');
      const HapticEngine = (haptics as any).constructor;
      const newHaptics = new HapticEngine();
      expect(newHaptics.isEnabled()).toBe(false);

      localStorage.setItem('mile_haptic_enabled', 'true');
      const newHaptics2 = new HapticEngine();
      expect(newHaptics2.isEnabled()).toBe(true);
    });

    it('can enable and disable haptics, saving to localStorage', () => {
      haptics.setEnabled(false);
      expect(haptics.isEnabled()).toBe(false);
      expect(localStorage.getItem('mile_haptic_enabled')).toBe('false');

      haptics.setEnabled(true);
      expect(haptics.isEnabled()).toBe(true);
      expect(localStorage.getItem('mile_haptic_enabled')).toBe('true');
    });
  });

  describe('vibrate()', () => {
    it('does nothing if disabled', () => {
      haptics.setEnabled(false);
      haptics.vibrate(10);
      expect(navigator.vibrate).not.toHaveBeenCalled();
    });

    it('calls navigator.vibrate if enabled', () => {
      haptics.setEnabled(true);
      haptics.vibrate(20);
      expect(navigator.vibrate).toHaveBeenCalledWith(20);
    });

    it('handles navigator.vibrate throwing exceptions', () => {
      haptics.setEnabled(true);
      navigator.vibrate = vi.fn().mockImplementation(() => {
        throw new Error('vibrate error');
      });

      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      expect(() => haptics.vibrate(10)).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith('Vibration API blocked or failed:', expect.any(Error));

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('does not warn in production on error', () => {
      haptics.setEnabled(true);
      navigator.vibrate = vi.fn().mockImplementation(() => {
        throw new Error('vibrate error');
      });

      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      haptics.vibrate(10);
      expect(console.warn).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Trigger methods', () => {
    beforeEach(() => {
      haptics.setEnabled(true);
      vi.spyOn(haptics, 'vibrate');
    });

    it('triggerTick calls vibrate with 15', () => {
      haptics.triggerTick();
      expect(haptics.vibrate).toHaveBeenCalledWith(15);
    });

    it('triggerSuccess calls vibrate with [20, 50, 20]', () => {
      haptics.triggerSuccess();
      expect(haptics.vibrate).toHaveBeenCalledWith([20, 50, 20]);
    });

    it('triggerSave calls vibrate with 30', () => {
      haptics.triggerSave();
      expect(haptics.vibrate).toHaveBeenCalledWith(30);
    });

    it('triggerError calls vibrate with [50, 100, 50]', () => {
      haptics.triggerError();
      expect(haptics.vibrate).toHaveBeenCalledWith([50, 100, 50]);
    });
  });
});
