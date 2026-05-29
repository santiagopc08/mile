import { test, expect } from '@playwright/test';
import { isMapLink, StoreService } from '../src/services/storeService';
import type { SupabaseClient } from '@supabase/supabase-js';

test.describe('isMapLink function', () => {
    test('should return true for valid Google Maps desktop URLs', () => {
        expect(isMapLink('https://www.google.com/maps/place/Medellin')).toBe(true);
        expect(isMapLink('http://google.com/maps/dir/Bogota/Medellin')).toBe(true);
        expect(isMapLink('https://google.com/maps')).toBe(true);
    });

    test('should return true for valid maps.app.goo.gl short URLs', () => {
        expect(isMapLink('https://maps.app.goo.gl/abc123XYZ')).toBe(true);
        expect(isMapLink('http://maps.app.goo.gl/something')).toBe(true);
    });

    test('should return true for valid goo.gl/maps short URLs', () => {
        expect(isMapLink('https://goo.gl/maps/xyz456ABC')).toBe(true);
        expect(isMapLink('http://goo.gl/maps/dir')).toBe(true);
    });

    test('should return false for other domains and non-map URLs', () => {
        expect(isMapLink('https://www.google.com')).toBe(false);
        expect(isMapLink('https://google.com/search?q=maps')).toBe(false);
        expect(isMapLink('https://github.com')).toBe(false);
        expect(isMapLink('not-a-url')).toBe(false);
    });

    test('should return false for empty strings', () => {
        expect(isMapLink('')).toBe(false);
    });

    test('should return false for null or undefined', () => {
        expect(isMapLink(null)).toBe(false);
        expect(isMapLink(undefined)).toBe(false);
    });
});

test.describe('StoreService.getStore', () => {
    test('should throw "Could not read from data store." when supabase fails', async () => {
        // Create a mock SupabaseClient that always throws an error when .from() is called
        const mockSupabase = {
            from: () => {
                throw new Error('Mock Supabase connection error');
            }
        } as unknown as SupabaseClient;

        await expect(StoreService.getStore(mockSupabase)).rejects.toThrow('Could not read from data store.');
    });
});
