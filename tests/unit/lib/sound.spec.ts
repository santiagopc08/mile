import { test, expect } from '@playwright/test';
import { sound } from '../../../src/lib/sound';

test.describe('SoundEngine', () => {
  let originalAudioContext: unknown;
  let originalWebkitAudioContext: unknown;
  let originalWindow: unknown;
  let originalLocalStorage: unknown;
  let mockConsoleWarn: (...data: unknown[]) => void;
  let warnings: unknown[][] = [];

  test.beforeEach(() => {
    originalWindow = globalThis.window;
    if (typeof globalThis.window === 'undefined') {
        (globalThis as unknown as Record<string, unknown>).window = {};
    }

    originalLocalStorage = globalThis.localStorage;
    if (typeof globalThis.localStorage === 'undefined') {
        (globalThis as unknown as Record<string, unknown>).localStorage = {
            getItem: () => null,
            setItem: () => {}
        };
    }

    originalAudioContext = (globalThis.window as unknown as Record<string, unknown>).AudioContext;
    originalWebkitAudioContext = (globalThis.window as unknown as Record<string, unknown>).webkitAudioContext;

    // Reset sound engine state via private field
    (sound as unknown as Record<string, unknown>).ctx = null;
    sound.setEnabled(true);

    mockConsoleWarn = console.warn;
    warnings = [];
    console.warn = (...args) => {
      warnings.push(args);
    };
  });

  test.afterEach(() => {
    (globalThis.window as unknown as Record<string, unknown>).AudioContext = originalAudioContext;
    (globalThis.window as unknown as Record<string, unknown>).webkitAudioContext = originalWebkitAudioContext;
    if (originalWindow === undefined) {
        delete (globalThis as unknown as Record<string, unknown>).window;
    } else {
        globalThis.window = originalWindow as Window & typeof globalThis;
    }

    if (originalLocalStorage === undefined) {
        delete (globalThis as unknown as Record<string, unknown>).localStorage;
    } else {
        globalThis.localStorage = originalLocalStorage as Storage;
    }

    console.warn = mockConsoleWarn;
  });

  test('should play tick successfully', () => {
    let oscillatorStarted = false;
    let oscillatorStopped = false;

    class MockAudioContext {
      state = 'running';
      currentTime = 0;
      destination = {};
      createOscillator() {
        return {
          type: '',
          frequency: {
            setValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {},
            linearRampToValueAtTime: () => {},
          },
          connect: () => {},
          start: () => { oscillatorStarted = true; },
          stop: () => { oscillatorStopped = true; }
        };
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {},
          },
          connect: () => {}
        };
      }
      resume() {}
    }

    (globalThis.window as unknown as Record<string, unknown>).AudioContext = MockAudioContext;

    sound.playTick();
    expect(oscillatorStarted).toBe(true);
    expect(oscillatorStopped).toBe(true);
    expect(warnings.length).toBe(0);
  });

  test('should handle and log error when AudioContext operations fail', () => {
    class MockAudioContext {
      state = 'running';
      currentTime = 0;
      destination = {};
      createOscillator() {
        throw new Error('Intentional audio context failure');
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {},
          },
          connect: () => {}
        };
      }
      resume() {}
    }

    (globalThis.window as unknown as Record<string, unknown>).AudioContext = MockAudioContext;

    sound.playTick();

    expect(warnings.length).toBe(1);
    expect(warnings[0][0]).toBe('Web Audio playback blocked or failed:');
    expect((warnings[0][1] as Error).message).toBe('Intentional audio context failure');
  });

  test('should not play if sound is disabled', () => {
      sound.setEnabled(false);

      class MockAudioContext {
        createOscillator() {
          throw new Error('Should not be called');
        }
      }
      (globalThis.window as unknown as Record<string, unknown>).AudioContext = MockAudioContext;

      sound.playTick();
      expect(warnings.length).toBe(0);
  });
});
