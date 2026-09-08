import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('SoundEngine', () => {
  let mockGainNode: any;
  let mockOscillator: any;
  let mockAudioContextInstance: any;
  let originalAudioContext: any;
  let originalWebkitAudioContext: any;
  let originalWindow: any;

  beforeEach(() => {
    // Reset localStorage
    localStorage.clear();

    mockGainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockOscillator = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockAudioContextInstance = {
      createGain: vi.fn(() => mockGainNode),
      createOscillator: vi.fn(() => mockOscillator),
      resume: vi.fn().mockResolvedValue(undefined),
      state: 'suspended',
      currentTime: 100,
      destination: {},
    };

    class MockAudioContext {
      constructor() {
        return mockAudioContextInstance;
      }
    }

    originalWindow = global.window;
    originalAudioContext = (window as any).AudioContext;
    originalWebkitAudioContext = (window as any).webkitAudioContext;

    (window as any).AudioContext = MockAudioContext;
    (window as any).webkitAudioContext = undefined;
  });

  afterEach(() => {
    (global as any).window = originalWindow;
    if (originalWindow) {
      (window as any).AudioContext = originalAudioContext;
      (window as any).webkitAudioContext = originalWebkitAudioContext;
    }
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe('Initialization and State', () => {
    it('sets enabled to false if localStorage has false', async () => {
      localStorage.setItem('mile_sound_enabled', 'false');
      const { sound } = await import('../../src/lib/sound');
      const SoundEngineClass = (sound as any).constructor;
      const engine = new SoundEngineClass();
      expect(engine.isEnabled()).toBe(false);
    });

    it('sets enabled to true if window is undefined', async () => {
      (global as any).window = undefined;
      const { sound } = await import('../../src/lib/sound');
      const SoundEngineClass = (sound as any).constructor;
      const engine = new SoundEngineClass();
      expect(engine.isEnabled()).toBe(true);
    });

    it('does not touch localStorage if window is undefined on setEnabled', async () => {
      (global as any).window = undefined;
      const setItemSpy = vi.spyOn(localStorage, 'setItem');
      const { sound } = await import('../../src/lib/sound');
      sound.setEnabled(true);
      expect(setItemSpy).not.toHaveBeenCalled();
    });

    it('initializes as enabled by default if localStorage is empty', async () => {
      const { sound } = await import('../../src/lib/sound');
      const SoundEngineClass = (sound as any).constructor;
      const newEngine = new SoundEngineClass();
      expect(newEngine.isEnabled()).toBe(true);
    });

    it('can enable and disable sound, saving to localStorage', async () => {
      const { sound } = await import('../../src/lib/sound');
      sound.setEnabled(false);
      expect(sound.isEnabled()).toBe(false);
      expect(localStorage.getItem('mile_sound_enabled')).toBe('false');

      sound.setEnabled(true);
      expect(sound.isEnabled()).toBe(true);
      expect(localStorage.getItem('mile_sound_enabled')).toBe('true');
    });
  });

  describe('Context Initialization', () => {
    it('uses webkitAudioContext if AudioContext is not available', async () => {
      (window as any).AudioContext = undefined;
      let webkitCalled = false;
      class MockWebkitAudioContext {
        constructor() {
          webkitCalled = true;
          return mockAudioContextInstance;
        }
      }
      (window as any).webkitAudioContext = MockWebkitAudioContext;
      const { sound } = await import('../../src/lib/sound');
      const SoundEngineClass = (sound as any).constructor;
      const engine = new SoundEngineClass();

      // Trigger initialization
      engine.playTick();
      expect(webkitCalled).toBe(true);
      expect(engine['ctx']).toBeDefined();
    });

    it('does not create AudioContext if window is undefined', async () => {
      const { sound } = await import('../../src/lib/sound');
      const SoundEngineClass = (sound as any).constructor;
      const engine = new SoundEngineClass();

      (global as any).window = undefined;

      engine.playTick();
      expect(engine['ctx']).toBeNull();
    });
  });

  describe('Playback methods', () => {
    let engine: any;

    beforeEach(async () => {
      const { sound } = await import('../../src/lib/sound');
      const SoundEngineClass = (sound as any).constructor;
      engine = new SoundEngineClass();
      engine.setEnabled(true);
    });

    it('does nothing if disabled', () => {
      engine.setEnabled(false);
      engine.playTick();
      expect(mockAudioContextInstance.createOscillator).not.toHaveBeenCalled();
    });

    it('playTick calls createOscillator and creates gain node', () => {
      engine.playTick();
      expect(mockAudioContextInstance.resume).toHaveBeenCalled();
      expect(mockAudioContextInstance.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockAudioContextInstance.createGain).toHaveBeenCalledTimes(1);
      expect(mockOscillator.type).toBe('triangle');
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContextInstance.destination);
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalledWith(100 + 0.08);
    });

    it('playSuccess calls createOscillator twice and creates gain node', () => {
      engine.playSuccess();
      expect(mockAudioContextInstance.resume).toHaveBeenCalled();
      expect(mockAudioContextInstance.createOscillator).toHaveBeenCalledTimes(2);
      expect(mockAudioContextInstance.createGain).toHaveBeenCalledTimes(1);
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContextInstance.destination);
      expect(mockOscillator.start).toHaveBeenCalledTimes(2);
      expect(mockOscillator.stop).toHaveBeenCalledTimes(2);
      expect(mockOscillator.stop).toHaveBeenCalledWith(100 + 0.35);
    });

    it('playSave calls createOscillator and creates gain node', () => {
      engine.playSave();
      expect(mockAudioContextInstance.resume).toHaveBeenCalled();
      expect(mockAudioContextInstance.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockAudioContextInstance.createGain).toHaveBeenCalledTimes(1);
      expect(mockOscillator.type).toBe('sine');
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContextInstance.destination);
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalledWith(100 + 0.25);
    });

    it('playError calls createOscillator and creates gain node', () => {
      engine.playError();
      expect(mockAudioContextInstance.resume).toHaveBeenCalled();
      expect(mockAudioContextInstance.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockAudioContextInstance.createGain).toHaveBeenCalledTimes(1);
      expect(mockOscillator.type).toBe('sawtooth');
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContextInstance.destination);
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalledWith(100 + 0.25);
    });

    it('handles AudioContext errors silently', () => {
      mockAudioContextInstance.createOscillator.mockImplementationOnce(() => {
        throw new Error('AudioContext blocked');
      });
      expect(() => engine.playTick()).not.toThrow();
    });
  });
});
