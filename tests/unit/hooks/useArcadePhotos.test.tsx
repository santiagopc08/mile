import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { useArcadePhotos } from '../../../src/hooks/useArcadePhotos';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as ProfileContext from '../../../src/context/ProfileContext';
import * as ArcadeMemories from '../../../src/lib/arcadeMemories';

vi.mock('../../../src/context/ProfileContext', () => ({
    useProfile: vi.fn(),
}));

vi.mock('../../../src/lib/arcadeMemories', () => ({
    fetchArcadeMemories: vi.fn(),
    createHoloDuotoneCanvas: vi.fn(),
}));

describe('useArcadePhotos hook', () => {
    let mockUseProfile: any;
    let mockFetchArcadeMemories: any;
    let mockCreateHoloDuotoneCanvas: any;
    let originalImage: typeof Image;

    beforeEach(() => {
        mockUseProfile = vi.spyOn(ProfileContext, 'useProfile');
        mockFetchArcadeMemories = vi.spyOn(ArcadeMemories, 'fetchArcadeMemories');
        mockCreateHoloDuotoneCanvas = vi.spyOn(ArcadeMemories, 'createHoloDuotoneCanvas');

        mockUseProfile.mockReturnValue({ profile: 'ella' });
        mockFetchArcadeMemories.mockResolvedValue([]);
        mockCreateHoloDuotoneCanvas.mockReturnValue(document.createElement('canvas'));

        // Mock Image globally
        originalImage = global.Image;
        global.Image = class {
            onload: () => void = () => {};
            onerror: () => void = () => {};
            crossOrigin: string = '';
            src: string = '';
            constructor() {
                // Automatically trigger onload slightly asynchronously to simulate image loading
                setTimeout(() => {
                    if (this.src.includes('error')) {
                        this.onerror();
                    } else {
                        this.onload();
                    }
                }, 0);
            }
        } as any;
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        global.Image = originalImage;
    });

    it('initializes with default state', () => {
        // Prevent immediate resolution for initial state check
        mockFetchArcadeMemories.mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useArcadePhotos());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.memories).toEqual([]);
        expect(result.current.stylizedMemories).toEqual([]);
        expect(result.current.accentColor).toBe('#ff4b89'); // 'ella' profile default
    });

    it('sets colors based on profile "el"', async () => {
        mockUseProfile.mockReturnValue({ profile: 'el' });

        const { result } = renderHook(() => useArcadePhotos());

        expect(result.current.accentColor).toBe('#c3f400');
    });

    it('fetches memories and processes canvases successfully', async () => {
        const mockMemories = [
            { id: '1', imageUrl: '/local/image.png', title: 'Test 1', source: 'local' as const },
            { id: '2', imageUrl: 'https://remote.com/image.png', title: 'Test 2', source: 'supabase' as const }
        ];
        mockFetchArcadeMemories.mockResolvedValue(mockMemories);

        const { result } = renderHook(() => useArcadePhotos(200, 200));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.memories).toEqual(mockMemories);
        expect(result.current.stylizedMemories).toHaveLength(2);

        expect(result.current.stylizedMemories[0].memory).toEqual(mockMemories[0]);
        expect(result.current.stylizedMemories[0].holoCanvas).toBeDefined();
        expect(result.current.stylizedMemories[0].holoCanvas?.tagName).toBe('CANVAS');
        expect(result.current.stylizedMemories[0].rawImage).toBeDefined();

        // Check proxy logic
        expect(result.current.stylizedMemories[0].rawImage?.src).toBe('/local/image.png');
        expect(result.current.stylizedMemories[1].rawImage?.src).toContain('/api/proxy-image?url=');

        expect(mockCreateHoloDuotoneCanvas).toHaveBeenCalledTimes(2);
    });

    it('handles image load errors gracefully', async () => {
        const mockMemories = [
            { id: '1', imageUrl: 'error', title: 'Error Image', source: 'local' as const },
            { id: '2', imageUrl: '/local/image.png', title: 'Valid Image', source: 'local' as const }
        ];
        mockFetchArcadeMemories.mockResolvedValue(mockMemories);

        const { result } = renderHook(() => useArcadePhotos());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.memories).toEqual(mockMemories);
        // Stylized memories only includes the successfully loaded one, or it resolves empty for that specific one?
        // Looking at the hook, loadedList.push happens only on img.onload. So if onerror triggers, it resolves without pushing.
        expect(result.current.stylizedMemories).toHaveLength(1);
        expect(result.current.stylizedMemories[0].memory.id).toBe('2');
    });

    it('handles fetch errors gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        mockFetchArcadeMemories.mockRejectedValue(new Error('Fetch failed'));

        const { result } = renderHook(() => useArcadePhotos());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.memories).toEqual([]);
        expect(result.current.stylizedMemories).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith('Error loading arcade photos:', expect.any(Error));

        consoleSpy.mockRestore();
    });

    it('aborts on unmount', () => {
        const mockMemories = [{ id: '1', imageUrl: '/local/image.png', title: 'Test 1', source: 'local' as const }];
        let resolveFetch: any;
        mockFetchArcadeMemories.mockReturnValue(new Promise((resolve) => {
            resolveFetch = resolve;
        }));

        const { result, unmount } = renderHook(() => useArcadePhotos());

        unmount();

        // Resolve after unmount
        resolveFetch(mockMemories);

        // State shouldn't be updated (would cause a warning usually, but we check if isLoading remains true since state wasn't updated)
        expect(result.current.isLoading).toBe(true);
        expect(result.current.memories).toEqual([]);
    });
});
