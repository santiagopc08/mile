import { test, expect } from '@playwright/test';
import { formatCOP } from '../../src/components/planes/constants';

test.describe('formatCOP function', () => {
    // Helper function to normalize spaces (handle non-breaking spaces \xA0)
    const normalizeSpace = (str: string) => str.replace(/\s/g, ' ');

    test('should format zero correctly', () => {
        expect(normalizeSpace(formatCOP(0))).toBe('$ 0');
    });

    test('should format positive numbers with thousands separators', () => {
        expect(normalizeSpace(formatCOP(1000))).toBe('$ 1.000');
        expect(normalizeSpace(formatCOP(1500000))).toBe('$ 1.500.000');
        expect(normalizeSpace(formatCOP(42))).toBe('$ 42');
    });

    test('should format negative numbers correctly', () => {
        expect(normalizeSpace(formatCOP(-1000))).toBe('-$ 1.000');
        expect(normalizeSpace(formatCOP(-500))).toBe('-$ 500');
    });

    test('should not render fraction digits', () => {
        expect(normalizeSpace(formatCOP(1000.5))).toBe('$ 1.001'); // Rounds up
        expect(normalizeSpace(formatCOP(1000.4))).toBe('$ 1.000'); // Rounds down
    });
});
