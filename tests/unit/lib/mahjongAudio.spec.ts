import { test, expect } from '@playwright/test';
import { initAudio, loadMutedPreference, setMuted, isMuted } from '../../../src/lib/mahjongAudio';

test.describe('mahjongAudio', () => {
  let originalWindow: unknown;

  test.beforeEach(() => {
    originalWindow = globalThis.window;
  });

  test.afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as unknown as Record<string, unknown>).window;
    } else {
      globalThis.window = originalWindow as Window & typeof globalThis;
    }
  });

  test.describe('loadMutedPreference', () => {
    test('returns false when window is undefined', () => {
      delete (globalThis as unknown as Record<string, unknown>).window;
      const result = loadMutedPreference();
      expect(result).toBe(false);
    });

    test('returns true when localStorage contains "1"', () => {
      (globalThis as unknown as Record<string, unknown>).window = {
        localStorage: {
          getItem: (key: string) => key === 'mahjong_muted' ? '1' : null
        }
      };
      const result = loadMutedPreference();
      expect(result).toBe(true);
      expect(isMuted()).toBe(true);
    });

    test('returns false when localStorage contains "0"', () => {
      (globalThis as unknown as Record<string, unknown>).window = {
        localStorage: {
          getItem: (key: string) => key === 'mahjong_muted' ? '0' : null
        }
      };
      const result = loadMutedPreference();
      expect(result).toBe(false);
      expect(isMuted()).toBe(false);
    });

    test('returns false when localStorage throws an error', () => {
      (globalThis as unknown as Record<string, unknown>).window = {
        get localStorage() {
          throw new Error('Access denied');
        }
      };
      const result = loadMutedPreference();
      expect(result).toBe(false);
      expect(isMuted()).toBe(false);
    });
  });

  test.describe('setMuted / isMuted', () => {
    test('updates muted state and saves to localStorage', () => {
      let savedValue: string | null = null;
      let savedKey: string | null = null;

      (globalThis as unknown as Record<string, unknown>).window = {
        localStorage: {
          setItem: (key: string, value: string) => {
            savedKey = key;
            savedValue = value;
          }
        }
      };

      setMuted(true);
      expect(isMuted()).toBe(true);
      expect(savedKey).toBe('mahjong_muted');
      expect(savedValue).toBe('1');

      setMuted(false);
      expect(isMuted()).toBe(false);
      expect(savedValue).toBe('0');
    });

    test('does not throw when localStorage throws an error', () => {
      (globalThis as unknown as Record<string, unknown>).window = {
        get localStorage() {
          throw new Error('Access denied');
        }
      };

      expect(() => setMuted(true)).not.toThrow();
      expect(isMuted()).toBe(true);
    });
  });

  test.describe('initAudio', () => {
    test('does not throw when window is undefined', () => {
      delete (globalThis as unknown as Record<string, unknown>).window;
      expect(() => initAudio()).not.toThrow();
    });

    test('initializes AudioContext successfully', () => {
      let bufferCreated = false;
      let contextResumed = false;

      class MockAudioContext {
        state = 'suspended';
        sampleRate = 44100;
        destination = {};

        createGain() {
          return {
            gain: {
              value: 1,
              setValueAtTime: () => {},
              exponentialRampToValueAtTime: () => {},
              cancelScheduledValues: () => {}
            },
            connect: () => {}
          };
        }

        createBuffer() {
          bufferCreated = true;
          return {
            getChannelData: () => new Float32Array(44100)
          };
        }

        resume() {
          contextResumed = true;
          return Promise.resolve();
        }
      }

      (globalThis as unknown as Record<string, unknown>).window = {
        AudioContext: MockAudioContext
      };

      initAudio();
      expect(bufferCreated).toBe(true);
      expect(contextResumed).toBe(true);
    });
  });
});
