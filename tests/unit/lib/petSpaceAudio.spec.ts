import { test, expect } from '@playwright/test';
import { loadAudioPreference, setAudioEnabled } from '../../../src/lib/petSpaceAudio';

test.describe('petSpaceAudio', () => {
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

  test.describe('loadAudioPreference', () => {
    test('returns false when window is undefined', () => {
      // Simulate SSR or environment without window
      delete (globalThis as unknown as Record<string, unknown>).window;

      const result = loadAudioPreference();

      expect(result).toBe(false);
    });

    test('returns true when localStorage contains "1"', () => {
      // Setup window with mock localStorage
      (globalThis as unknown as Record<string, unknown>).window = {
        localStorage: {
          getItem: (key: string) => key === 'mile_petspace_audio' ? '1' : null
        }
      };

      const result = loadAudioPreference();

      expect(result).toBe(true);
    });

    test('returns false when localStorage contains "0"', () => {
      (globalThis as unknown as Record<string, unknown>).window = {
        localStorage: {
          getItem: (key: string) => key === 'mile_petspace_audio' ? '0' : null
        }
      };

      const result = loadAudioPreference();

      expect(result).toBe(false);
    });

    test('returns false when localStorage returns null', () => {
      (globalThis as unknown as Record<string, unknown>).window = {
        localStorage: {
          getItem: () => null
        }
      };

      const result = loadAudioPreference();

      expect(result).toBe(false);
    });

    test('returns false when localStorage access throws an error', () => {
      (globalThis as unknown as Record<string, unknown>).window = {
        get localStorage() {
          throw new Error('Access denied');
        }
      };

      const result = loadAudioPreference();

      expect(result).toBe(false);
    });
  });
});
