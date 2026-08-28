import { test, expect } from '@playwright/test';
import { loadAudioPreference, setAudioEnabled, playSelect, playWarp, playCuddle, playWarmth, playCapture } from '../../../src/lib/petSpaceAudio';

test.describe('petSpaceAudio', () => {
  let originalWindow: unknown;

  test.beforeEach(() => {
    originalWindow = globalThis.window;
  });
  test.describe('playback functions and stopAmbient error handling', () => {
    test('stopAmbient catches errors during node stopping', () => {
      // Create chainable mock objects
      const createChainable = (obj) => {
        const result = { ...obj };
        result.connect = (dest) => result; // Return self or something to allow chaining
        return result;
      };

      class MockAudioContext {
        state = 'running';
        sampleRate = 44100;
        destination = {};
        currentTime = 0;

        createGain() {
          return createChainable({
            gain: {
              value: 1,
              cancelScheduledValues: () => { throw new Error('Simulated stopAmbient error'); },
              setValueAtTime: () => {},
              exponentialRampToValueAtTime: () => {}
            }
          });
        }

        createBuffer() {
          return { getChannelData: () => new Float32Array(88200) };
        }

        createOscillator() {
          return createChainable({
            frequency: { value: 0, exponentialRampToValueAtTime: () => {}, setValueAtTime: () => {} },
            type: 'sine',
            start: () => {},
            stop: () => {}
          });
        }

        createBiquadFilter() {
          return createChainable({
            frequency: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
            Q: { value: 1 }
          });
        }

        createBufferSource() {
          return createChainable({
            start: () => {},
            stop: () => {},
            playbackRate: { value: 1, setValueAtTime: () => {} },
            buffer: null,
            loop: false
          });
        }

        resume() {
          return Promise.resolve();
        }
      }

      globalThis.window = {
        AudioContext: MockAudioContext,
        localStorage: { setItem: () => {} }
      };

      // Start ambient to populate the ambient object
      expect(() => setAudioEnabled(true)).not.toThrow();

      // Stopping should trigger stopAmbient, which will throw on cancelScheduledValues
      // but the try/catch should suppress it.
      expect(() => setAudioEnabled(false)).not.toThrow();
    });

    test('playback functions handle missing AudioContext gracefully', () => {
      // Simulate environment without AudioContext
      globalThis.window = {
        localStorage: { setItem: () => {} }
      };
      // Forcing context to be uninitialized or handle the graceful exit
      expect(() => playSelect()).not.toThrow();
      expect(() => playWarp()).not.toThrow();
      expect(() => playCuddle()).not.toThrow();
      expect(() => playWarmth()).not.toThrow();
      expect(() => playCapture()).not.toThrow();
    });
  });


  test.afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as unknown as Record<string, unknown>).window;
    } else {
      globalThis.window = originalWindow as Window & typeof globalThis;
    }

    // Attempt to reset module state by forcing setAudioEnabled to false which stops ambient
    setAudioEnabled(false);
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
      } as unknown as Window & typeof globalThis;

      const result = loadAudioPreference();

      expect(result).toBe(true);
    });

    test('returns false when localStorage contains "0"', () => {
      (globalThis as unknown as Record<string, unknown>).window = {
        localStorage: {
          getItem: (key: string) => key === 'mile_petspace_audio' ? '0' : null
        }
      } as unknown as Window & typeof globalThis;

      const result = loadAudioPreference();

      expect(result).toBe(false);
    });

    test('returns false when localStorage returns null', () => {
      (globalThis as unknown as Record<string, unknown>).window = {
        localStorage: {
          getItem: () => null
        }
      } as unknown as Window & typeof globalThis;

      const result = loadAudioPreference();

      expect(result).toBe(false);
    });

    test('returns false when localStorage access throws an error', () => {
      (globalThis as unknown as Record<string, unknown>).window = {
        get localStorage() {
          throw new Error('Access denied');
        }
      } as unknown as Window & typeof globalThis;

      const result = loadAudioPreference();

      expect(result).toBe(false);
    });
  });

  test.describe('setAudioEnabled error handling', () => {
    test('ensureContext handles ctx.resume() promise rejection gracefully', async () => {
      let resumeCalled = false;

      // Create chainable mock objects
      const createChainable = <T extends Record<string, unknown>>(obj: T) => {
        const result = { ...obj } as T & { connect: (dest: unknown) => unknown };

        result.connect = (dest: unknown) => {
          return dest; // Return the destination to allow chaining: a.connect(b).connect(c)
        };
        return result;
      };

      class MockAudioContext {
        state = 'suspended';
        sampleRate = 44100;
        destination = {};
        currentTime = 0;

        createGain() {
          return createChainable({
            gain: {
              value: 1,
              setValueAtTime: () => {},
              exponentialRampToValueAtTime: () => {}
            }
          });
        }

        createBuffer() {
          return { getChannelData: () => new Float32Array(88200) };
        }

        createOscillator() {
          return createChainable({
            frequency: { value: 0, exponentialRampToValueAtTime: () => {}, setValueAtTime: () => {} },
            type: 'sine',
            start: () => {},
            stop: () => {}
          });
        }

        createBiquadFilter() {
          return createChainable({
            frequency: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
            Q: { value: 1 }
          });
        }

        createBufferSource() {
          return createChainable({
            start: () => {},
            stop: () => {},
            playbackRate: { value: 1, setValueAtTime: () => {} },
            buffer: null,
            loop: false
          });
        }

        resume() {
          resumeCalled = true;
          return Promise.reject(new Error('resume failed'));
        }
      }

      (globalThis as unknown as Record<string, unknown>).window = {
        AudioContext: MockAudioContext,
        localStorage: {
          setItem: () => {}
        }
      } as unknown as Window & typeof globalThis;

      // This should not throw an error
      expect(() => setAudioEnabled(true)).not.toThrow();

      // Allow the unhandled promise rejection to potentially surface
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(resumeCalled).toBe(true);
      // If the promise rejection was not caught by ensureContext, Playwright would fail the test.
    });





    test('gracefully handles localStorage.setItem errors', () => {
      (globalThis as unknown as Record<string, unknown>).window = {
        localStorage: {
          setItem: () => {
            throw new Error('Quota exceeded');
          }
        }
      } as unknown as Window & typeof globalThis;

      // Should not throw
      expect(() => setAudioEnabled(false)).not.toThrow();
    });
  });
});
