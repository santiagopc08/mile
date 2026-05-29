import { test, expect } from '@playwright/test';
import { isMapLink } from '../src/services/storeService';

test.describe('isMapLink', () => {
    test('should return true for valid google.com/maps links', () => {
        expect(isMapLink('https://www.google.com/maps/place/...')).toBe(true);
        expect(isMapLink('http://google.com/maps/...')).toBe(true);
        expect(isMapLink('google.com/maps')).toBe(true);
    });

    test('should return true for valid maps.app.goo.gl links', () => {
        expect(isMapLink('https://maps.app.goo.gl/abcdefg')).toBe(true);
        expect(isMapLink('http://maps.app.goo.gl/abcdefg')).toBe(true);
        expect(isMapLink('maps.app.goo.gl/abcdefg')).toBe(true);
    });

    test('should return true for valid goo.gl/maps links', () => {
        expect(isMapLink('https://goo.gl/maps/abcdefg')).toBe(true);
        expect(isMapLink('http://goo.gl/maps/abcdefg')).toBe(true);
        expect(isMapLink('goo.gl/maps/abcdefg')).toBe(true);
    });

    test('should return false for other links', () => {
        expect(isMapLink('https://www.google.com')).toBe(false);
        expect(isMapLink('https://www.example.com/maps')).toBe(false);
        expect(isMapLink('https://maps.apple.com')).toBe(false);
        expect(isMapLink('some random text')).toBe(false);
    });

    test('should return false for empty strings', () => {
        expect(isMapLink('')).toBe(false);
        expect(isMapLink('   ')).toBe(false); // Only empty, not blank checking currently, but string matching fails
    });

    test('should return false for null and undefined', () => {
        expect(isMapLink(null)).toBe(false);
        expect(isMapLink(undefined)).toBe(false);
    });
});
