import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadMutedPreference, setMuted, isMuted, initArcadeAudio } from '@/lib/arcadeAudio';

describe('arcadeAudio', () => {
    beforeEach(() => {
        // Clear local storage and reset module state before each test if possible
        window.localStorage.clear();
        vi.restoreAllMocks();
    });

    describe('isMuted and setMuted', () => {
        it('should correctly set and get muted state', () => {
            setMuted(true);
            expect(isMuted()).toBe(true);

            setMuted(false);
            expect(isMuted()).toBe(false);
        });

        it('should persist muted state to localStorage', () => {
            setMuted(true);
            expect(window.localStorage.getItem('arcade_audio_muted')).toBe('1');

            setMuted(false);
            expect(window.localStorage.getItem('arcade_audio_muted')).toBe('0');
        });
    });

    describe('loadMutedPreference', () => {
        it('should return false when window is undefined', () => {
            const originalWindow = global.window;
            // @ts-ignore
            delete global.window;

            expect(loadMutedPreference()).toBe(false);

            global.window = originalWindow;
        });

        it('should load true from localStorage when value is "1"', () => {
            window.localStorage.setItem('arcade_audio_muted', '1');
            const result = loadMutedPreference();

            expect(result).toBe(true);
            expect(isMuted()).toBe(true);
        });

        it('should load false from localStorage when value is not "1"', () => {
            window.localStorage.setItem('arcade_audio_muted', '0');
            const result = loadMutedPreference();

            expect(result).toBe(false);
            expect(isMuted()).toBe(false);
        });

        it('should fallback to false if localStorage throws an error', () => {
            const getItemMock = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
                throw new Error('Access denied');
            });

            const result = loadMutedPreference();

            expect(result).toBe(false);
            expect(isMuted()).toBe(false);

            getItemMock.mockRestore();
        });
    });
});
