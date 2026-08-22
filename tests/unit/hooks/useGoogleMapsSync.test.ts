import { renderHook, act } from '@testing-library/react';
import { useGoogleMapsSync } from '../../../src/hooks/useGoogleMapsSync';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '../../../src/lib/supabase';
import type { WishlistItem } from '@/services/storeService';

vi.mock('../../../src/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    }
}));

describe('useGoogleMapsSync hook validation edge cases', () => {
    let mockFetch: any;
    let originalDispatchEvent: typeof window.dispatchEvent;
    let dispatchEventMock: any;

    beforeEach(() => {
        mockFetch = vi.fn();
        global.fetch = mockFetch;

        dispatchEventMock = vi.fn();
        originalDispatchEvent = window.dispatchEvent;
        window.dispatchEvent = dispatchEventMock;

        vi.clearAllMocks();
    });

    afterEach(() => {
        window.dispatchEvent = originalDispatchEvent;
    });

    it('bails out when the api responds but does not include coordinates', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ someOtherData: 'hello' })
        });

        const { result } = renderHook(() => useGoogleMapsSync([]));

        await act(async () => {
            await result.current.syncGoogleMapsLocation('Test', 'https://google.com/maps/place/test', 'DISCOVERED', 'author');
        });

        expect(mockFetch).toHaveBeenCalled();
        expect(supabase.from).not.toHaveBeenCalled();
        expect(dispatchEventMock).not.toHaveBeenCalled();
    });

    it('bails out when the lat is missing or invalid', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ coords: { lng: 123 } })
        });

        const { result } = renderHook(() => useGoogleMapsSync([]));

        await act(async () => {
            await result.current.syncGoogleMapsLocation('Test', 'https://google.com/maps/place/test', 'DISCOVERED', 'author');
        });

        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('bails out when the lng is missing or invalid', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ coords: { lat: 123, lng: 'invalid string' } }) // lng not a number
        });

        const { result } = renderHook(() => useGoogleMapsSync([]));

        await act(async () => {
            await result.current.syncGoogleMapsLocation('Test', 'https://google.com/maps/place/test', 'DISCOVERED', 'author');
        });

        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('bails out on non-ok fetch response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
        });

        const { result } = renderHook(() => useGoogleMapsSync([]));

        await act(async () => {
            await result.current.syncGoogleMapsLocation('Test', 'https://google.com/maps/place/test', 'DISCOVERED', 'author');
        });

        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('bails out gracefully when fetch throws an error (catches exception)', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useGoogleMapsSync([]));

        await act(async () => {
            await result.current.syncGoogleMapsLocation('Test', 'https://google.com/maps/place/test', 'DISCOVERED', 'author');
        });

        expect(consoleSpy).toHaveBeenCalledWith('Error syncing location:', expect.any(Error));
        expect(supabase.from).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('bails out when url is empty', async () => {
        const { result } = renderHook(() => useGoogleMapsSync([]));

        await act(async () => {
            await result.current.syncGoogleMapsLocation('Test', '', 'DISCOVERED', 'author');
        });

        expect(mockFetch).not.toHaveBeenCalled();
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('bails out when url is not a google maps url', async () => {
        const { result } = renderHook(() => useGoogleMapsSync([]));

        await act(async () => {
            await result.current.syncGoogleMapsLocation('Test', 'https://example.com/place/test', 'DISCOVERED', 'author');
        });

        expect(mockFetch).not.toHaveBeenCalled();
        expect(supabase.from).not.toHaveBeenCalled();
    });
});
