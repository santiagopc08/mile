import { test, expect } from '@playwright/test';
import { formatCOP } from '../src/components/planes/constants';

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
