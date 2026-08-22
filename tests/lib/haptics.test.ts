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

    it('sets enabled to false if localStorage has false', () => {
      const HapticEngine = (haptics as any).constructor;
      localStorage.setItem('mile_haptic_enabled', 'false');
      const engine = new HapticEngine();
      expect(engine.isEnabled()).toBe(false);
    });

    it('sets enabled to true if window is undefined', () => {
      vi.stubGlobal('window', undefined);
      const HapticEngine = (haptics as any).constructor;
      const engine = new HapticEngine();
      expect(engine.isEnabled()).toBe(true);
      vi.unstubAllGlobals();
    });

    it('does not touch localStorage if window is undefined on setEnabled', () => {
      vi.stubGlobal('window', undefined);
      const setItemSpy = vi.spyOn(localStorage, 'setItem');
      haptics.setEnabled(true);
      expect(setItemSpy).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

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


  describe('Edge cases (window / navigator missing)', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('does not vibrate if window is undefined', () => {
      vi.stubGlobal('window', undefined);
      haptics.vibrate(10);
    });

    it('does not vibrate if vibrate is not in navigator', () => {
      const mockNavigator = { ...navigator };
      delete (mockNavigator as any).vibrate;
      vi.stubGlobal('navigator', mockNavigator);
      haptics.vibrate(10);
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
      (process.env as any).NODE_ENV = 'development';

      expect(() => haptics.vibrate(10)).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith('Vibration API blocked or failed:', expect.any(Error));

      (process.env as any).NODE_ENV = originalNodeEnv;
    });


    it('handles navigator.vibrate throwing exceptions silently when process is undefined', () => {
      haptics.setEnabled(true);
      navigator.vibrate = vi.fn().mockImplementation(() => {
        throw new Error('vibrate error 2');
      });

      vi.stubGlobal('process', { env: { } });

      expect(() => haptics.vibrate(10)).not.toThrow();
      expect(console.warn).not.toHaveBeenCalled();

      vi.unstubAllGlobals();
    });

    it('does not warn in production on error', () => {
      haptics.setEnabled(true);
      navigator.vibrate = vi.fn().mockImplementation(() => {
        throw new Error('vibrate error');
      });

      const originalNodeEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';

      haptics.vibrate(10);
      expect(console.warn).not.toHaveBeenCalled();

      (process.env as any).NODE_ENV = originalNodeEnv;
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
