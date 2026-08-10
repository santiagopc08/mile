import { test, expect } from '@playwright/test';
import fs from 'fs/promises';

// Mock server-only dependencies required by auth
test.beforeAll(() => {
    require.cache[require.resolve('server-only')] = {
        id: 'server-only',
        filename: 'server-only',
        loaded: true,
        exports: {}
    } as any;

    require.cache[require.resolve('../../../src/lib/auth.ts')] = {
        id: '../../../src/lib/auth.ts',
        filename: '../../../src/lib/auth.ts',
        loaded: true,
        exports: {
            verifyAuth: () => Promise.resolve(true)
        }
    } as any;
});

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
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET } = require('../../../src/app/api/mahjong-images/route');
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
