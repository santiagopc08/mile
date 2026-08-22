import { test, expect } from '@playwright/test';
import {
    initAudio,
    loadMutedPreference,
    setMuted,
    isMuted,
    playPickup,
    playMatch,
    playCollision,
    playInferno,
    playError,
    playVictory
} from '../../../src/lib/mahjongAudio';

test.describe('mahjongAudio', () => {
    let originalWindow: unknown;
    let originalLocalStorage: unknown;
    let originalAudioContext: unknown;
    let originalWebkitAudioContext: unknown;
    let mockStorage: Record<string, string> = {};
    let mockAudioContextCreated = false;

    test.beforeEach(() => {
        originalWindow = globalThis.window;
        originalLocalStorage = globalThis.localStorage;
        mockStorage = {};
        mockAudioContextCreated = false;

        if (typeof globalThis.window === 'undefined') {
            (globalThis as unknown as Record<string, unknown>).window = {};
        }

        const localStorageMock = {
            getItem: (key: string) => mockStorage[key] || null,
            setItem: (key: string, val: string) => { mockStorage[key] = val; }
        };

        if (typeof globalThis.localStorage === 'undefined') {
            (globalThis as unknown as Record<string, unknown>).localStorage = localStorageMock;
        }
        (globalThis.window as unknown as Record<string, unknown>).localStorage = localStorageMock;

        originalAudioContext = (globalThis.window as unknown as Record<string, unknown>).AudioContext;
        originalWebkitAudioContext = (globalThis.window as unknown as Record<string, unknown>).webkitAudioContext;

        class MockAudioContext {
            state = 'running';
            sampleRate = 44100;
            currentTime = 0;
            destination = {};

            constructor() {
                mockAudioContextCreated = true;
            }

            createGain() {
                return {
                    gain: {
                        value: 1,
                        setValueAtTime: () => {},
                        exponentialRampToValueAtTime: () => {},
                        cancelScheduledValues: () => {}
                    },
                    connect: (dest: unknown) => dest
                };
            }
            createBuffer(channels: number, length: number, sampleRate: number) {
                return {
                    getChannelData: () => new Float32Array(length)
                };
            }
            createBufferSource() {
                return {
                    buffer: null,
                    connect: (dest: unknown) => dest,
                    start: () => {},
                    stop: () => {}
                };
            }
            createBiquadFilter() {
                return {
                    type: '',
                    frequency: {
                        setValueAtTime: () => {},
                        exponentialRampToValueAtTime: () => {}
                    },
                    Q: { value: 1 },
                    connect: (dest: unknown) => dest
                };
            }
            createOscillator() {
                return {
                    type: '',
                    frequency: {
                        setValueAtTime: () => {},
                        exponentialRampToValueAtTime: () => {}
                    },
                    detune: {
                        setValueAtTime: () => {}
                    },
                    connect: (dest: unknown) => dest,
                    start: () => {},
                    stop: () => {}
                };
            }
            resume() { return Promise.resolve(); }
        }

        (globalThis.window as unknown as Record<string, unknown>).AudioContext = MockAudioContext;

        // Reset state
        setMuted(false);
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
    });

    test('isMuted should return current muted state', () => {
        setMuted(false);
        expect(isMuted()).toBe(false);
        setMuted(true);
        expect(isMuted()).toBe(true);
    });

    test('loadMutedPreference should load from localStorage', () => {
        mockStorage['mahjong_muted'] = '1';
        expect(loadMutedPreference()).toBe(true);
        expect(isMuted()).toBe(true);

        mockStorage['mahjong_muted'] = '0';
        expect(loadMutedPreference()).toBe(false);
        expect(isMuted()).toBe(false);
    });

    test('loadMutedPreference should handle errors gracefully', () => {
        const oldGetItem = globalThis.window.localStorage.getItem;
        globalThis.window.localStorage.getItem = () => { throw new Error('Storage disabled'); };

        expect(loadMutedPreference()).toBe(false);

        globalThis.window.localStorage.getItem = oldGetItem;
    });

    test('setMuted should save to localStorage', () => {
        setMuted(true);
        expect(mockStorage['mahjong_muted']).toBe('1');

        setMuted(false);
        expect(mockStorage['mahjong_muted']).toBe('0');
    });

    test('setMuted should handle localStorage errors gracefully', () => {
        const oldSetItem = globalThis.window.localStorage.setItem;
        globalThis.window.localStorage.setItem = () => { throw new Error('Storage disabled'); };

        setMuted(true);
        expect(isMuted()).toBe(true);

        globalThis.window.localStorage.setItem = oldSetItem;
    });

    test('initAudio should create context and not crash', () => {
        initAudio();
        expect(mockAudioContextCreated).toBe(true);
    });

    test('play methods should not crash when sound is played', () => {
        initAudio(); // ensure initialized
        setMuted(false);

        let errorThrown = false;
        try {
            playPickup();
            playMatch(1);
            playMatch(5); // tests playInferno trigger
            playCollision(1);
            playInferno();
            playError();
            playVictory();
        } catch (e) {
            errorThrown = true;
            console.error(e);
        }

        expect(errorThrown).toBe(false);
    });

    test('play methods should not crash when muted', () => {
        initAudio(); // ensure initialized
        setMuted(true);

        let errorThrown = false;
        try {
            playPickup();
            playMatch(1);
            playCollision(1);
            playInferno();
            playError();
            playVictory();
        } catch (e) {
            errorThrown = true;
            console.error(e);
        }

        expect(errorThrown).toBe(false);
    });

    test('play methods should not crash when AudioContext is missing', () => {
        (globalThis.window as unknown as Record<string, unknown>).AudioContext = undefined;

        let errorThrown = false;
        try {
            playPickup();
            playMatch(1);
            playCollision(1);
            playInferno();
            playError();
            playVictory();
        } catch (e) {
            errorThrown = true;
            console.error(e);
        }

        expect(errorThrown).toBe(false);
    });
});
