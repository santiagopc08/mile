import { test, expect } from '@playwright/test';
import { formatCOP, timeAgo } from '../src/components/planes/constants';

test.describe('formatCOP utility', () => {
    test('should format positive standard numbers as COP currency', () => {
        // es-CO locale formats COP as e.g., "$ 5.000" or "$ 5.000" (with non-breaking space) or similar
        // We can check if it starts with "$" and contains the number formatted correctly
        const result = formatCOP(5000);
        expect(result).toContain('5.000');
        expect(result).toContain('$');
    });

    test('should format zero correctly', () => {
        const result = formatCOP(0);
        expect(result).toContain('0');
        expect(result).toContain('$');
    });

    test('should format negative numbers correctly', () => {
        const result = formatCOP(-15000);
        expect(result).toContain('15.000');
        expect(result).toContain('$');
        // It should represent negative values (depending on browser/node locale, e.g. "-$ 15.000" or similar)
        expect(result).toContain('-');
    });

    test('should format large numbers correctly', () => {
        const result = formatCOP(123456789);
        expect(result).toContain('123.456.789');
        expect(result).toContain('$');
    });

    test('should round or truncate decimals to 0 fractional digits', () => {
        const result1 = formatCOP(1234.56);
        expect(result1).toContain('1.235'); // rounded up
        
        const result2 = formatCOP(1234.12);
        expect(result2).toContain('1.234'); // rounded down
    });
});

test.describe('timeAgo utility', () => {
    let originalDateNow: () => number;

    test.beforeEach(() => {
        originalDateNow = Date.now;
        // Mock Date.now() to a fixed timestamp: 2024-01-01T12:00:00.000Z
        const mockNow = new Date('2024-01-01T12:00:00.000Z').getTime();
        Date.now = () => mockNow;
    });

    test.afterEach(() => {
        // Restore the original Date.now()
        Date.now = originalDateNow;
    });

    test('should return "ahora" for time differences less than 1 minute', () => {
        // 30 seconds ago
        const dateStr = new Date(Date.now() - 30 * 1000).toISOString();
        expect(timeAgo(dateStr)).toBe('ahora');
    });

    test('should return minutes for time differences between 1 and 59 minutes', () => {
        // 1 minute ago
        const dateStr1 = new Date(Date.now() - 60 * 1000).toISOString();
        expect(timeAgo(dateStr1)).toBe('hace 1m');

        // 45 minutes ago
        const dateStr2 = new Date(Date.now() - 45 * 60 * 1000).toISOString();
        expect(timeAgo(dateStr2)).toBe('hace 45m');
    });

    test('should return hours for time differences between 1 and 23 hours', () => {
        // 1 hour ago
        const dateStr1 = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        expect(timeAgo(dateStr1)).toBe('hace 1h');

        // 12 hours ago
        const dateStr2 = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        expect(timeAgo(dateStr2)).toBe('hace 12h');
    });

    test('should return days for time differences of 24 hours or more', () => {
        // 1 day (24 hours) ago
        const dateStr1 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        expect(timeAgo(dateStr1)).toBe('hace 1d');

        // 5 days ago
        const dateStr2 = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
        expect(timeAgo(dateStr2)).toBe('hace 5d');
    });

    test('should handle future dates as "ahora" (diff < 1 min)', () => {
        // 1 minute in the future
        const dateStr = new Date(Date.now() + 60 * 1000).toISOString();
        expect(timeAgo(dateStr)).toBe('ahora');
    });

    test('should handle invalid dates gracefully', () => {
        expect(timeAgo('invalid-date')).toBe('hace NaNd');
        expect(timeAgo('')).toBe('hace NaNd');
    });
});
