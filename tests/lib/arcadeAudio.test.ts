import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('arcadeAudio', () => {
    let mockGainNode: any;
    let originalAudioContext: any;
    let originalWebkitAudioContext: any;

    beforeEach(() => {
        // Reset localStorage
        localStorage.clear();

        // Setup mock gain node
        mockGainNode = {
            gain: {
                value: 1,
                cancelScheduledValues: vi.fn(),
            },
            connect: vi.fn(),
        };

        class MockAudioContext {
            createGain = vi.fn(() => mockGainNode);
            createBuffer = vi.fn(() => ({
                getChannelData: vi.fn(() => new Float32Array(100))
            }));
            resume = vi.fn().mockResolvedValue(undefined);
            state = 'suspended';
            sampleRate = 44100;
            destination = {};
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
            const { loadMutedPreference } = await import('../../src/lib/arcadeAudio');
            expect(loadMutedPreference()).toBe(false);
            global.window = originalWindow;
        });

        it('returns false and sets muted to false if localStorage fails', async () => {
            const getItemSpy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
                throw new Error('Access denied');
            });
            const { loadMutedPreference, isMuted } = await import('../../src/lib/arcadeAudio');
            expect(loadMutedPreference()).toBe(false);
            expect(isMuted()).toBe(false);
            getItemSpy.mockRestore();
        });

        it('returns true if localStorage has arcade_audio_muted = "1"', async () => {
            window.localStorage.setItem('arcade_audio_muted', '1');
            const { loadMutedPreference, isMuted } = await import('../../src/lib/arcadeAudio');
            expect(loadMutedPreference()).toBe(true);
            expect(isMuted()).toBe(true);
        });

        it('returns false if localStorage has arcade_audio_muted = "0"', async () => {
            window.localStorage.setItem('arcade_audio_muted', '0');
            const { loadMutedPreference, isMuted } = await import('../../src/lib/arcadeAudio');
            expect(loadMutedPreference()).toBe(false);
            expect(isMuted()).toBe(false);
        });

        it('sets master gain to 0 if muted is true (when context initialized)', async () => {
            const { loadMutedPreference, initArcadeAudio } = await import('../../src/lib/arcadeAudio');
            initArcadeAudio();

            window.localStorage.setItem('arcade_audio_muted', '1');
            loadMutedPreference();
            expect(mockGainNode.gain.value).toBe(0);
        });

        it('sets master gain to BASE_VOLUME if muted is false (when context initialized)', async () => {
            const { loadMutedPreference, initArcadeAudio } = await import('../../src/lib/arcadeAudio');
            initArcadeAudio();

            window.localStorage.setItem('arcade_audio_muted', '0');
            loadMutedPreference();
            expect(mockGainNode.gain.value).toBe(0.25); // BASE_VOLUME is 0.25
        });
    });

    describe('setMuted', () => {
        it('updates the muted state and localStorage', async () => {
            const { setMuted, isMuted } = await import('../../src/lib/arcadeAudio');
            setMuted(true);
            expect(isMuted()).toBe(true);
            expect(window.localStorage.getItem('arcade_audio_muted')).toBe('1');

            setMuted(false);
            expect(isMuted()).toBe(false);
            expect(window.localStorage.getItem('arcade_audio_muted')).toBe('0');
        });

        it('does not throw if localStorage.setItem fails', async () => {
            const setItemSpy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
                throw new Error('Access denied');
            });
            const { setMuted, isMuted } = await import('../../src/lib/arcadeAudio');
            expect(() => setMuted(true)).not.toThrow();
            expect(isMuted()).toBe(true);
            setItemSpy.mockRestore();
        });

        it('updates master gain and cancels scheduled values if context is initialized', async () => {
            const { setMuted, initArcadeAudio } = await import('../../src/lib/arcadeAudio');
            initArcadeAudio();

            setMuted(true);
            expect(mockGainNode.gain.cancelScheduledValues).toHaveBeenCalled();
            expect(mockGainNode.gain.value).toBe(0);

            setMuted(false);
            expect(mockGainNode.gain.cancelScheduledValues).toHaveBeenCalledTimes(2);
            expect(mockGainNode.gain.value).toBe(0.25);
        });
    });

    describe('isMuted', () => {
        it('returns the current muted state', async () => {
            const { setMuted, isMuted } = await import('../../src/lib/arcadeAudio');
            setMuted(true);
            expect(isMuted()).toBe(true);

            setMuted(false);
            expect(isMuted()).toBe(false);
        });
    });

    describe('initArcadeAudio', () => {
        it('initializes AudioContext and master gain when called for the first time', async () => {
             const { initArcadeAudio } = await import('../../src/lib/arcadeAudio');

             initArcadeAudio();

             // call again should not re-throw
             expect(() => initArcadeAudio()).not.toThrow();
        });

        it('returns null and does nothing if window is undefined', async () => {
            const originalWindow = global.window;
            (global as any).window = undefined;

            const { initArcadeAudio } = await import('../../src/lib/arcadeAudio');

            expect(() => initArcadeAudio()).not.toThrow();

            global.window = originalWindow;
        });

        it('uses webkitAudioContext if AudioContext is not available', async () => {
            const { initArcadeAudio } = await import('../../src/lib/arcadeAudio');

            class MockWebkitAudioContext {
                createGain = vi.fn(() => mockGainNode);
                createBuffer = vi.fn(() => ({
                    getChannelData: vi.fn(() => new Float32Array(100))
                }));
                resume = vi.fn().mockResolvedValue(undefined);
                state = 'suspended';
                sampleRate = 44100;
                destination = {};
            }

            (window as any).AudioContext = undefined;
            (window as any).webkitAudioContext = MockWebkitAudioContext;

            expect(() => initArcadeAudio()).not.toThrow();
        });

        it('does nothing if no AudioContext is available', async () => {
            const { initArcadeAudio } = await import('../../src/lib/arcadeAudio');

            (window as any).AudioContext = undefined;
            (window as any).webkitAudioContext = undefined;

            expect(() => initArcadeAudio()).not.toThrow();
        });
    });
});
