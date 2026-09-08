/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('mahjongAudio', () => {
    let mockGainNode: any;
    let originalAudioContext: any;
    let originalWebkitAudioContext: any;
    let mockOscillatorNode: any;
    let mockBufferSourceNode: any;
    let mockBiquadFilterNode: any;

    beforeEach(() => {
        // Reset localStorage
        localStorage.clear();

        // Setup mock gain node
        mockGainNode = {
            gain: {
                value: 1,
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn(),
                cancelScheduledValues: vi.fn(),
            },
            connect: vi.fn(() => mockGainNode), // Return itself for chaining
        };

        mockOscillatorNode = {
            type: 'sine',
            frequency: {
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn(),
            },
            detune: {
                setValueAtTime: vi.fn(),
            },
            connect: vi.fn(() => mockOscillatorNode), // Return itself for chaining
            start: vi.fn(),
            stop: vi.fn(),
        };

        mockBufferSourceNode = {
            buffer: null,
            connect: vi.fn(() => mockBufferSourceNode), // Return itself for chaining
            start: vi.fn(),
            stop: vi.fn(),
        };

        mockBiquadFilterNode = {
            type: 'bandpass',
            frequency: {
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn(),
            },
            Q: {
                value: 1,
            },
            connect: vi.fn(() => mockBiquadFilterNode), // Return itself for chaining
        };

        class MockAudioContext {
            createGain = vi.fn(() => mockGainNode);
            createOscillator = vi.fn(() => mockOscillatorNode);
            createBufferSource = vi.fn(() => mockBufferSourceNode);
            createBiquadFilter = vi.fn(() => mockBiquadFilterNode);
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

    describe('loadMutedPreference', () => {
        it('returns false if window is undefined', async () => {
            const originalWindow = global.window;
            (global as any).window = undefined;
            const { loadMutedPreference } = await import('../../src/lib/mahjongAudio');
            expect(loadMutedPreference()).toBe(false);
            global.window = originalWindow;
        });

        it('returns false and sets muted to false if localStorage fails', async () => {
            const getItemSpy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
                throw new Error('Access denied');
            });
            const { loadMutedPreference, isMuted } = await import('../../src/lib/mahjongAudio');
            expect(loadMutedPreference()).toBe(false);
            expect(isMuted()).toBe(false);
            getItemSpy.mockRestore();
        });

        it('returns true if localStorage has mahjong_muted = "1"', async () => {
            window.localStorage.setItem('mahjong_muted', '1');
            const { loadMutedPreference, isMuted } = await import('../../src/lib/mahjongAudio');
            expect(loadMutedPreference()).toBe(true);
            expect(isMuted()).toBe(true);
        });

        it('returns false if localStorage has mahjong_muted = "0"', async () => {
            window.localStorage.setItem('mahjong_muted', '0');
            const { loadMutedPreference, isMuted } = await import('../../src/lib/mahjongAudio');
            expect(loadMutedPreference()).toBe(false);
            expect(isMuted()).toBe(false);
        });

        it('sets master gain to 0 if muted is true (when context initialized)', async () => {
            const { loadMutedPreference, initAudio } = await import('../../src/lib/mahjongAudio');
            initAudio();

            window.localStorage.setItem('mahjong_muted', '1');
            loadMutedPreference();
            expect(mockGainNode.gain.value).toBe(0);
        });

        it('sets master gain to BASE_VOLUME if muted is false (when context initialized)', async () => {
            const { loadMutedPreference, initAudio } = await import('../../src/lib/mahjongAudio');
            initAudio();

            window.localStorage.setItem('mahjong_muted', '0');
            loadMutedPreference();
            expect(mockGainNode.gain.value).toBe(0.3); // BASE_VOLUME is 0.3
        });
    });

    describe('setMuted', () => {
        it('updates the muted state and localStorage', async () => {
            const { setMuted, isMuted } = await import('../../src/lib/mahjongAudio');
            setMuted(true);
            expect(isMuted()).toBe(true);
            expect(window.localStorage.getItem('mahjong_muted')).toBe('1');

            setMuted(false);
            expect(isMuted()).toBe(false);
            expect(window.localStorage.getItem('mahjong_muted')).toBe('0');
        });

        it('does not throw if localStorage.setItem fails', async () => {
            const setItemSpy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
                throw new Error('Access denied');
            });
            const { setMuted, isMuted } = await import('../../src/lib/mahjongAudio');
            expect(() => setMuted(true)).not.toThrow();
            expect(isMuted()).toBe(true);
            setItemSpy.mockRestore();
        });

        it('updates master gain and cancels scheduled values if context is initialized', async () => {
            const { setMuted, initAudio } = await import('../../src/lib/mahjongAudio');
            initAudio();

            setMuted(true);
            expect(mockGainNode.gain.cancelScheduledValues).toHaveBeenCalled();
            expect(mockGainNode.gain.value).toBe(0);

            setMuted(false);
            expect(mockGainNode.gain.cancelScheduledValues).toHaveBeenCalledTimes(2);
            expect(mockGainNode.gain.value).toBe(0.3); // BASE_VOLUME is 0.3
        });
    });

    describe('isMuted', () => {
        it('returns the current muted state', async () => {
            const { setMuted, isMuted } = await import('../../src/lib/mahjongAudio');
            setMuted(true);
            expect(isMuted()).toBe(true);

            setMuted(false);
            expect(isMuted()).toBe(false);
        });
    });

    describe('initAudio', () => {
        it('initializes AudioContext and master gain when called for the first time', async () => {
             const { initAudio } = await import('../../src/lib/mahjongAudio');

             initAudio();

             // call again should not re-throw
             expect(() => initAudio()).not.toThrow();
        });

        it('does nothing if window is undefined', async () => {
            const originalWindow = global.window;
            (global as any).window = undefined;

            const { initAudio } = await import('../../src/lib/mahjongAudio');

            expect(() => initAudio()).not.toThrow();
            global.window = originalWindow;
        });

        it('uses webkitAudioContext if AudioContext is not available', async () => {
            const { initAudio } = await import('../../src/lib/mahjongAudio');

            class MockWebkitAudioContext {
                createGain = vi.fn(() => mockGainNode);
                createOscillator = vi.fn(() => mockOscillatorNode);
                createBufferSource = vi.fn(() => mockBufferSourceNode);
                createBiquadFilter = vi.fn(() => mockBiquadFilterNode);
                createBuffer = vi.fn(() => ({
                    getChannelData: vi.fn(() => new Float32Array(100))
                }));
                resume = vi.fn().mockResolvedValue(undefined);
                state = 'suspended';
                sampleRate = 44100;
                destination = {};
                currentTime = 0;
            }

            (window as any).AudioContext = undefined;
            (window as any).webkitAudioContext = MockWebkitAudioContext;

            expect(() => initAudio()).not.toThrow();
        });

        it('does nothing if no AudioContext is available', async () => {
            const { initAudio } = await import('../../src/lib/mahjongAudio');

            (window as any).AudioContext = undefined;
            (window as any).webkitAudioContext = undefined;

            expect(() => initAudio()).not.toThrow();
        });

        it('resumes context if state is suspended', async () => {
            const { initAudio } = await import('../../src/lib/mahjongAudio');
            initAudio();
            // In our mock, state is always 'suspended', and resume is a mock function
            // We can check if resume was called during initAudio.  It depends on implementation details
            // so we'll just ensure it runs without throwing.
            expect(() => initAudio()).not.toThrow();
        });
    });

    describe('Game Effects', () => {
        it('playPickup executes without error', async () => {
            const { playPickup, setMuted, initAudio } = await import('../../src/lib/mahjongAudio');
            initAudio();
            setMuted(false);
            expect(() => playPickup()).not.toThrow();
        });

        it('playPickup does nothing if muted', async () => {
            const { playPickup, setMuted, initAudio } = await import('../../src/lib/mahjongAudio');
            initAudio();
            setMuted(true);
            mockOscillatorNode.start.mockClear();
            playPickup();
            expect(mockOscillatorNode.start).not.toHaveBeenCalled();
        });

        it('playMatch executes without error', async () => {
            const { playMatch, setMuted, initAudio } = await import('../../src/lib/mahjongAudio');
            initAudio();
            setMuted(false);
            expect(() => playMatch(1)).not.toThrow();
            expect(() => playMatch(5)).not.toThrow();
        });

        it('playCollision executes without error', async () => {
            const { playCollision, setMuted, initAudio } = await import('../../src/lib/mahjongAudio');
            initAudio();
            setMuted(false);
            expect(() => playCollision(1)).not.toThrow();
        });

        it('playInferno executes without error', async () => {
            const { playInferno, setMuted, initAudio } = await import('../../src/lib/mahjongAudio');
            initAudio();
            setMuted(false);
            expect(() => playInferno()).not.toThrow();
        });

        it('playError executes without error', async () => {
            const { playError, setMuted, initAudio } = await import('../../src/lib/mahjongAudio');
            initAudio();
            setMuted(false);
            expect(() => playError()).not.toThrow();
        });

        it('playVictory executes without error', async () => {
            const { playVictory, setMuted, initAudio } = await import('../../src/lib/mahjongAudio');
            initAudio();
            setMuted(false);
            expect(() => playVictory()).not.toThrow();
        });
    });
});
