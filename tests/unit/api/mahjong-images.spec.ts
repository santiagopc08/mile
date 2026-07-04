import { test, expect } from '@playwright/test';
import { GET } from '../../../src/app/api/mahjong-images/route';
import fs from 'fs/promises';

test.describe('mahjong-images API', () => {
    let originalAccess: typeof fs.access;
    let originalConsoleWarn: typeof console.warn;
    let originalConsoleError: typeof console.error;

    test.beforeEach(() => {
        originalAccess = fs.access;
        originalConsoleWarn = console.warn;
        originalConsoleError = console.error;
    });

    test.afterEach(() => {
        fs.access = originalAccess;
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
    });

    test('should return an empty array if fs.access throws an error', async () => {
        fs.access = async () => {
            throw new Error('mocked access error');
        };

        // Suppress console.warn/error output during test
        let warnCalled = false;
        console.warn = (msg) => {
            if (typeof msg === 'string' && msg.includes('img directory is not accessible')) {
                warnCalled = true;
            }
        };
        console.error = () => {};

        try {
            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual([]);
            expect(warnCalled).toBe(true);
        } finally {
            console.warn = originalConsoleWarn;
            console.error = originalConsoleError;
        }
    });
});
