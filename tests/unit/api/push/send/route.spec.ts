import { test, expect } from '@playwright/test';


const setupMocks = (authResult: boolean = true) => {
    const authPath = require.resolve('../../../../../src/lib/auth.ts');
    require.cache[authPath] = {
        id: authPath,
        filename: authPath,
        loaded: true,
        exports: {
            verifyAuth: async () => authResult
        }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
};

const cleanupMocks = () => {
    const authPath = require.resolve('../../../../../src/lib/auth.ts');
    delete require.cache[authPath];
    const routePath = require.resolve('../../../../../src/app/api/push/send/route.ts');
    delete require.cache[routePath];
};

test.describe('Push Send API Validation', () => {

    test.beforeEach(() => {
        cleanupMocks();
    });

    test.afterEach(() => {
        cleanupMocks();
    });

    test('should return 400 for non-string target', async () => {
        setupMocks(true);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST: localPost } = require('../../../../../src/app/api/push/send/route.ts');

        const req = new Request('http://localhost:3000/api/push/send', {
            method: 'POST',
            body: JSON.stringify({ target: 123, message: 'valid message' })
        });

        const res = await localPost(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toEqual({ error: 'Invalid input types' });
    });

    test('should return 400 for non-string message', async () => {
        setupMocks(true);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST: localPost } = require('../../../../../src/app/api/push/send/route.ts');

        const req = new Request('http://localhost:3000/api/push/send', {
            method: 'POST',
            body: JSON.stringify({ target: 'valid target', message: { object: true } })
        });

        const res = await localPost(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toEqual({ error: 'Invalid input types' });
    });

    test('should return 400 for target length > 50', async () => {
        setupMocks(true);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST: localPost } = require('../../../../../src/app/api/push/send/route.ts');

        const req = new Request('http://localhost:3000/api/push/send', {
            method: 'POST',
            body: JSON.stringify({ target: 'a'.repeat(51), message: 'valid message' })
        });

        const res = await localPost(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toEqual({ error: 'Input exceeds maximum length' });
    });

    test('should return 400 for message length > 1000', async () => {
        setupMocks(true);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { POST: localPost } = require('../../../../../src/app/api/push/send/route.ts');

        const req = new Request('http://localhost:3000/api/push/send', {
            method: 'POST',
            body: JSON.stringify({ target: 'valid target', message: 'a'.repeat(1001) })
        });

        const res = await localPost(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toEqual({ error: 'Input exceeds maximum length' });
    });
});
