import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LiveLinkPreview } from '../../src/components/LiveLinkPreview';

describe('LiveLinkPreview', () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        global.fetch = vi.fn();

        // Mock localStorage
        const store: Record<string, string> = {};
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => { store[key] = value.toString(); });
        vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => { Object.keys(store).forEach(key => delete store[key]); });
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('handles fetch error correctly', async () => {
        // Mock fetch to simulate an error response
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(<LiveLinkPreview url="https://example.com" />);

        // Fast-forward debounce timer (600ms)
        vi.advanceTimersByTime(600);

        // Wait for the component to resolve the fetch
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/link-preview?url=https%3A%2F%2Fexample.com');
        });

        // Error should be handled, preview should be null, component returns null
        // Component does not render card nor loading anymore
        expect(screen.queryByText('Cargando vista previa del enlace...')).toBeNull();
        expect(screen.queryByText('VISTA PREVIA EN VIVO')).toBeNull();

        consoleSpy.mockRestore();
    });

    it('renders null if url is invalid', () => {
        const { container } = render(<LiveLinkPreview url="invalid url" />);
        vi.advanceTimersByTime(600);
        expect(container.firstChild).toBeNull();
    });

    it('renders preview card when fetch is successful', async () => {
        const mockPreviewData = {
            title: 'Test Title',
            description: 'Test Description',
            image: 'https://example.com/image.jpg',
            siteName: 'Test Site',
        };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => mockPreviewData,
        });

        render(<LiveLinkPreview url="https://example.com" />);

        // Should show loading state after debouncing
        vi.advanceTimersByTime(600);

        // Wait for the preview card to render
        await waitFor(() => {
            expect(screen.getByText('Test Title')).toBeDefined();
            expect(screen.getByText('Test Description')).toBeDefined();
            expect(screen.getByText('Test Site')).toBeDefined();
        });
    });
});
