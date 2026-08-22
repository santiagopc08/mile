import { test, expect, vi, describe, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGoogleMapsSync } from '@/hooks/useGoogleMapsSync';
import { supabase } from '@/lib/supabase';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('p-map', () => ({
  default: vi.fn(),
}));

describe('useGoogleMapsSync', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock global fetch
    globalThis.fetch = vi.fn();
    // Mock CustomEvent
    globalThis.CustomEvent = class CustomEvent extends Event {
      constructor(type: string, eventInitDict?: CustomEventInit) {
        super(type, eventInitDict);
      }
    } as any;
    // Mock window.dispatchEvent
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('syncGoogleMapsLocation', () => {
    test('returns early if URL is missing', async () => {
      const { result } = renderHook(() => useGoogleMapsSync([]));
      await result.current.syncGoogleMapsLocation('Test Title', '', 'NEW', 'Author');

      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    test('returns early if URL is not a Google Maps URL', async () => {
      const { result } = renderHook(() => useGoogleMapsSync([]));
      await result.current.syncGoogleMapsLocation('Test Title', 'https://example.com', 'NEW', 'Author');

      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    test('returns early if fetch fails', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: false,
      });

      const { result } = renderHook(() => useGoogleMapsSync([]));
      await result.current.syncGoogleMapsLocation('Test Title', 'https://google.com/maps/place', 'NEW', 'Author');

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/link-preview?url=https%3A%2F%2Fgoogle.com%2Fmaps%2Fplace');
      expect(supabase.from).not.toHaveBeenCalled();
    });

    test('handles missing coordinates in response', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ some: 'data' }),
      });

      const { result } = renderHook(() => useGoogleMapsSync([]));
      await result.current.syncGoogleMapsLocation('Test Title', 'https://google.com/maps/place', 'NEW', 'Author');

      expect(supabase.from).not.toHaveBeenCalled();
    });

    test('inserts new location if check fails/finds none', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ coords: { lat: 10, lng: 20 } }),
      });

      const mockEq2 = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'ubicaciones') {
          return {
            select: mockSelect,
            insert: mockInsert,
          };
        }
      });

      const { result } = renderHook(() => useGoogleMapsSync([]));
      await result.current.syncGoogleMapsLocation('New Place', 'https://maps.app.goo.gl/abcd', 'NEW', 'el');

      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq1).toHaveBeenCalledWith('nombre', 'New Place');
      expect(mockEq2).toHaveBeenCalledWith('created_by', 'el');

      expect(mockInsert).toHaveBeenCalledWith({
        nombre: 'New Place',
        latitud: 10,
        longitud: 20,
        created_by: 'el',
        status: 'to-visit',
      });

      expect(window.dispatchEvent).toHaveBeenCalled();
    });

    test('updates existing location if found', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ coords: { lat: 30, lng: 40 } }),
      });

      const mockEq2 = vi.fn().mockResolvedValue({ data: [{ id: '123' }], error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      const mockEqUpdate = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'ubicaciones') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
      });

      const { result } = renderHook(() => useGoogleMapsSync([]));
      await result.current.syncGoogleMapsLocation('Existing Place', 'https://goo.gl/maps/efgh', 'COMPLETED', 'test_user');

      expect(mockUpdate).toHaveBeenCalledWith({
        latitud: 30,
        longitud: 40,
        status: 'visited',
      });
      expect(mockEqUpdate).toHaveBeenCalledWith('id', '123');
      expect(window.dispatchEvent).toHaveBeenCalled();
    });

    test('handles fetch errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (globalThis.fetch as any).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useGoogleMapsSync([]));
      await result.current.syncGoogleMapsLocation('Error Place', 'https://google.com/maps/error', 'NEW', 'Author');

      expect(consoleSpy).toHaveBeenCalledWith('Error syncing location:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});
