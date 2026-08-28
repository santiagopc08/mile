import { test, expect } from '@playwright/test';
import { setAudioEnabled } from '../../../src/lib/petSpaceAudio';

test.describe('petSpaceAudio ensureContext catch block', () => {
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

  test('ensureContext handles ctx.resume() throwing an exception', async () => {
    let applicationCalledCatch = false;

    class MockAudioContextResumeReject {
      state = 'suspended';
      sampleRate = 44100;
      destination = {};
      currentTime = 0;
      createGain() {
        return {
          gain: { value: 1, cancelScheduledValues: () => {}, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          connect: (dest: unknown) => dest
        };
      }
      createBuffer() { return { getChannelData: () => new Float32Array(88200) }; }
      createOscillator() {
        return {
          frequency: { value: 0, exponentialRampToValueAtTime: () => {}, setValueAtTime: () => {} },
          type: 'sine', start: () => {}, stop: () => {}, connect: (dest: unknown) => dest
        };
      }
      createBiquadFilter() {
        return {
          frequency: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          Q: { value: 1 }, connect: (dest: unknown) => dest
        };
      }
      createBufferSource() {
        return {
          start: () => {}, stop: () => {}, playbackRate: { value: 1, setValueAtTime: () => {} },
          buffer: null, loop: false, connect: (dest: unknown) => dest
        };
      }
      resume() {
        // Return a mock Promise to spy on the .catch() call from the application
        return {
          catch: (fn: () => void) => {
            applicationCalledCatch = true;
            // Execute the empty catch block just to be thorough
            if (typeof fn === 'function') fn();
          }
        } as unknown as Promise<void>;
      }
    }

    (globalThis as unknown as Record<string, unknown>).window = {
      AudioContext: MockAudioContextResumeReject,
      localStorage: { setItem: () => {} }
    } as unknown as Window & typeof globalThis;

    // Trigger ensureContext by enabling audio
    expect(() => setAudioEnabled(true)).not.toThrow();

    // Assert that the application explicitly called .catch() on the returned promise
    expect(applicationCalledCatch).toBe(true);
  });
});
