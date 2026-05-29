import { test, expect } from '@playwright/test';
import { formatCOP } from '../src/components/planes/constants';

test.describe('formatCOP', () => {
    test('formats positive numbers correctly', () => {
        expect(formatCOP(1000).replace(/\s/g, ' ')).toBe('$ 1.000');
    });

    test('formats zero correctly', () => {
        expect(formatCOP(0).replace(/\s/g, ' ')).toBe('$ 0');
    });

    test('formats negative numbers correctly', () => {
        expect(formatCOP(-1500).replace(/\s/g, ' ')).toBe('-$ 1.500');
    });

    test('formats large numbers correctly', () => {
        expect(formatCOP(1000000).replace(/\s/g, ' ')).toBe('$ 1.000.000');
    });

    test('handles decimal inputs by rounding/truncating to 0 fraction digits', () => {
        expect(formatCOP(1500.5).replace(/\s/g, ' ')).toBe('$ 1.501');
        expect(formatCOP(1500.4).replace(/\s/g, ' ')).toBe('$ 1.500');
    });
});
