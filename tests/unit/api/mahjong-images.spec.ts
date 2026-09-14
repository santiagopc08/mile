import { test, expect } from '@playwright/test';

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
    test('should return image list with 200 status and caching headers', async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET } = require('../../../src/app/api/mahjong-images/route');
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
        expect(data[0]).toMatch(/^\/img\//);
        expect(response.headers.get('Cache-Control')).toContain('s-maxage');
    });
});
