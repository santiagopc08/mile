/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('petSpaceAudio', () => {
    let mockGainNode: any;
    let mockOscillatorNode: any;
    let mockBiquadFilterNode: any;
    let mockBufferSourceNode: any;
    let originalAudioContext: any;
    let originalWebkitAudioContext: any;

    beforeEach(() => {
        // Reset localStorage
        localStorage.clear();

        // Setup mock nodes
        mockGainNode = {
            gain: {
                value: 1,
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn(),
                cancelScheduledValues: vi.fn(),
            },
            connect: vi.fn().mockReturnThis(),
        };

        mockOscillatorNode = {
            type: 'sine',
            frequency: {
                value: 440,
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn().mockReturnThis(),
            start: vi.fn(),
            stop: vi.fn(),
        };

        mockBiquadFilterNode = {
            type: 'lowpass',
            frequency: {
                value: 440,
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn(),
            },
            Q: { value: 1 },
            connect: vi.fn().mockReturnThis(),
        };

        mockBufferSourceNode = {
            buffer: null,
            loop: false,
            connect: vi.fn().mockReturnThis(),
            start: vi.fn(),
            stop: vi.fn(),
        };

        class MockAudioContext {
            createGain = vi.fn(() => mockGainNode);
            createOscillator = vi.fn(() => mockOscillatorNode);
            createBiquadFilter = vi.fn(() => mockBiquadFilterNode);
            createBufferSource = vi.fn(() => mockBufferSourceNode);
            createBuffer = vi.fn(() => ({
                getChannelData: vi.fn(() => new Float32Array(100))
            }));
            resume = vi.fn().mockResolvedValue(undefined);
            state = 'suspended';
            sampleRate = 44100;
            destination = {};
            currentTime = 0;
        }

        originalAudioContext = (window as any).AudioContext;
        originalWebkitAudioContext = (window as any).webkitAudioContext;

        (window as any).AudioContext = MockAudioContext;
        (window as any).webkitAudioContext = undefined;
    });

    afterEach(() => {
        (window as any).AudioContext = originalAudioContext;
        (window as any).webkitAudioContext = originalWebkitAudioContext;
        vi.restoreAllMocks();
        vi.resetModules();
    });

    describe('loadAudioPreference', () => {
        it('returns false if window is undefined', async () => {
            const originalWindow = global.window;
            (global as any).window = undefined;
            const { loadAudioPreference } = await import('../../src/lib/petSpaceAudio');
            expect(loadAudioPreference()).toBe(false);
            global.window = originalWindow;
        });

        it('returns false if localStorage fails', async () => {
            const getItemSpy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
                throw new Error('Access denied');
            });
            const { loadAudioPreference, isAudioEnabled } = await import('../../src/lib/petSpaceAudio');
            expect(loadAudioPreference()).toBe(false);
            expect(isAudioEnabled()).toBe(false);
            getItemSpy.mockRestore();
        });

        it('returns true if localStorage has mile_petspace_audio = "1"', async () => {
            window.localStorage.setItem('mile_petspace_audio', '1');
            const { loadAudioPreference, isAudioEnabled } = await import('../../src/lib/petSpaceAudio');
            expect(loadAudioPreference()).toBe(true);
            expect(isAudioEnabled()).toBe(true);
        });

        it('returns false if localStorage has mile_petspace_audio = "0"', async () => {
            window.localStorage.setItem('mile_petspace_audio', '0');
            const { loadAudioPreference, isAudioEnabled } = await import('../../src/lib/petSpaceAudio');
            expect(loadAudioPreference()).toBe(false);
            expect(isAudioEnabled()).toBe(false);
        });
    });

    describe('setAudioEnabled', () => {
        it('updates the enabled state and localStorage', async () => {
            const { setAudioEnabled, isAudioEnabled } = await import('../../src/lib/petSpaceAudio');
            setAudioEnabled(true);
            expect(isAudioEnabled()).toBe(true);
            expect(window.localStorage.getItem('mile_petspace_audio')).toBe('1');

            setAudioEnabled(false);
            expect(isAudioEnabled()).toBe(false);
            expect(window.localStorage.getItem('mile_petspace_audio')).toBe('0');
        });

        it('does not throw if localStorage.setItem fails', async () => {
            const setItemSpy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
                throw new Error('Access denied');
            });
            const { setAudioEnabled, isAudioEnabled } = await import('../../src/lib/petSpaceAudio');
            expect(() => setAudioEnabled(true)).not.toThrow();
            expect(isAudioEnabled()).toBe(true);
            setItemSpy.mockRestore();
        });
    });

    describe('isAudioEnabled', () => {
        it('returns the current enabled state', async () => {
            const { setAudioEnabled, isAudioEnabled } = await import('../../src/lib/petSpaceAudio');
            setAudioEnabled(true);
            expect(isAudioEnabled()).toBe(true);

            setAudioEnabled(false);
            expect(isAudioEnabled()).toBe(false);
        });
    });

    describe('suspendAmbient', () => {
        it('does not throw if audio is not enabled/started', async () => {
            const { suspendAmbient } = await import('../../src/lib/petSpaceAudio');
            expect(() => suspendAmbient()).not.toThrow();
        });

        it('stops the ambient sounds if started', async () => {
             const { setAudioEnabled, suspendAmbient } = await import('../../src/lib/petSpaceAudio');
             setAudioEnabled(true); // Starts ambient

             // Now mock Gain Node methods called in stopAmbient
             expect(() => suspendAmbient()).not.toThrow();
             expect(mockGainNode.gain.cancelScheduledValues).toHaveBeenCalled();
        });
    });

    describe('resumeAmbientIfEnabled', () => {
        it('does nothing if audio is not enabled', async () => {
            const { resumeAmbientIfEnabled } = await import('../../src/lib/petSpaceAudio');
            // Audio context should not be created if not enabled
            resumeAmbientIfEnabled();
        });

        it('starts ambient if audio is enabled', async () => {
            const { setAudioEnabled, suspendAmbient, resumeAmbientIfEnabled } = await import('../../src/lib/petSpaceAudio');
            setAudioEnabled(true);
            suspendAmbient(); // stop it first

            expect(() => resumeAmbientIfEnabled()).not.toThrow();
        });
    });

    describe('Interaction Blips', () => {
        beforeEach(async () => {
            const { setAudioEnabled } = await import('../../src/lib/petSpaceAudio');
            setAudioEnabled(true);
            vi.clearAllMocks(); // Clear the ambient oscillator starts
        });

        it('playSelect does not throw', async () => {
            const { playSelect } = await import('../../src/lib/petSpaceAudio');
            expect(() => playSelect()).not.toThrow();
            expect(mockOscillatorNode.start).toHaveBeenCalled();
        });

        it('playWarp does not throw', async () => {
            const { playWarp } = await import('../../src/lib/petSpaceAudio');
            expect(() => playWarp()).not.toThrow();
            expect(mockOscillatorNode.start).toHaveBeenCalled();
            expect(mockBufferSourceNode.start).toHaveBeenCalled();
        });

        it('playCuddle does not throw', async () => {
            const { playCuddle } = await import('../../src/lib/petSpaceAudio');
            expect(() => playCuddle()).not.toThrow();
            expect(mockOscillatorNode.start).toHaveBeenCalledTimes(3); // 3 tones
        });

        it('playWarmth does not throw', async () => {
            const { playWarmth } = await import('../../src/lib/petSpaceAudio');
            expect(() => playWarmth()).not.toThrow();
            expect(mockOscillatorNode.start).toHaveBeenCalled();
            expect(mockBufferSourceNode.start).toHaveBeenCalled();
        });

        it('playCapture does not throw', async () => {
            const { playCapture } = await import('../../src/lib/petSpaceAudio');
            expect(() => playCapture()).not.toThrow();
            expect(mockOscillatorNode.start).toHaveBeenCalled();
            expect(mockBufferSourceNode.start).toHaveBeenCalled();
        });

        it('interaction blips do nothing if not enabled', async () => {
             const { setAudioEnabled, playSelect, playWarp, playCuddle, playWarmth, playCapture } = await import('../../src/lib/petSpaceAudio');
             setAudioEnabled(false);
             vi.clearAllMocks(); // clear mocks from setAudioEnabled(true) in beforeEach

             playSelect();
             playWarp();
             playCuddle();
             playWarmth();
             playCapture();

             expect(mockOscillatorNode.start).not.toHaveBeenCalled();
        });
    });
});
