import { renderHook, waitFor } from '@testing-library/react';
import { useLinkPreview } from '../../../../src/components/link-preview/useLinkPreview';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/** @vitest-environment jsdom */

describe('useLinkPreview hook', () => {
    beforeEach(() => {
        global.fetch = vi.fn();

        // Mock localStorage
        const store: Record<string, string> = {};
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => { store[key] = value.toString(); });
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => { delete store[key]; });
        vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => { Object.keys(store).forEach(key => delete store[key]); });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('falls back to fetching when cached data is invalid JSON', async () => {
        const testUrl = 'https://example.com';
        const cacheKey = `link-preview:${testUrl}`;

        // Set an invalid JSON string in localStorage
        localStorage.setItem(cacheKey, 'invalid json string');

        const mockPreviewData = {
            title: 'Test Title',
            description: 'Test Description',
            image: 'https://example.com/image.jpg',
            siteName: 'Test Site',
        };

        // Mock fetch to simulate a successful API response
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => mockPreviewData,
        });

        const { result } = renderHook(() => useLinkPreview(testUrl));

        // Wait for the hook to catch the JSON parsing error and fallback to fetching
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(`/api/link-preview?url=${encodeURIComponent(testUrl)}`);
        });

        // Ensure the hook properly sets the fetched data
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.data).toEqual(mockPreviewData);
            expect(result.current.error).toBe(false);
        });

        // Ensure the invalid cache is overwritten with the new valid data
        const newCache = localStorage.getItem(cacheKey);
        expect(newCache).not.toBeNull();
        const parsedCache = JSON.parse(newCache as string);
        expect(parsedCache.data).toEqual(mockPreviewData);
    });
});
