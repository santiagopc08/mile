import { test, expect } from '@playwright/test';
import { timeAgo } from '../../src/components/planes/constants';

test.describe('timeAgo function', () => {
    let originalDateNow: () => number;

    test.beforeAll(() => {
        originalDateNow = Date.now;
    });

    test.afterAll(() => {
        Date.now = originalDateNow;
    });

    test('should return "ahora" for time less than 1 minute', () => {
        const now = 1700000000000;
        Date.now = () => now;

        expect(timeAgo(new Date(now).toISOString())).toBe('ahora');
        expect(timeAgo(new Date(now - 30000).toISOString())).toBe('ahora'); // 30 seconds ago
        expect(timeAgo(new Date(now - 59000).toISOString())).toBe('ahora'); // 59 seconds ago
    });

    test('should return "hace Xm" for time between 1 and 59 minutes', () => {
        const now = 1700000000000;
        Date.now = () => now;

        expect(timeAgo(new Date(now - 60000).toISOString())).toBe('hace 1m'); // Exactly 1 minute ago
        expect(timeAgo(new Date(now - 15 * 60000).toISOString())).toBe('hace 15m'); // 15 minutes ago
        expect(timeAgo(new Date(now - 59 * 60000).toISOString())).toBe('hace 59m'); // 59 minutes ago
    });

    test('should return "hace Xh" for time between 1 and 23 hours', () => {
        const now = 1700000000000;
        Date.now = () => now;

        expect(timeAgo(new Date(now - 60 * 60000).toISOString())).toBe('hace 1h'); // Exactly 1 hour ago
        expect(timeAgo(new Date(now - 10 * 60 * 60000).toISOString())).toBe('hace 10h'); // 10 hours ago
        expect(timeAgo(new Date(now - 23 * 60 * 60000).toISOString())).toBe('hace 23h'); // 23 hours ago
    });

    test('should return "hace Xd" for time 24 hours or more', () => {
        const now = 1700000000000;
        Date.now = () => now;

        expect(timeAgo(new Date(now - 24 * 60 * 60000).toISOString())).toBe('hace 1d'); // Exactly 1 day ago
        expect(timeAgo(new Date(now - 3 * 24 * 60 * 60000).toISOString())).toBe('hace 3d'); // 3 days ago
        expect(timeAgo(new Date(now - 30 * 24 * 60 * 60000).toISOString())).toBe('hace 30d'); // 30 days ago
    });

    test('should handle future dates as "ahora" (diff < 1 min)', () => {
        const now = 1700000000000;
        Date.now = () => now;

        expect(timeAgo(new Date(now + 60000).toISOString())).toBe('ahora'); // 1 minute in the future
    });

    test('should handle invalid dates gracefully', () => {
        const now = 1700000000000;
        Date.now = () => now;

        expect(timeAgo('invalid-date')).toBe('hace NaNd');
        expect(timeAgo('')).toBe('hace NaNd');
    });
});
