import { test, expect } from '@playwright/test';

test.describe('Link Preview API SSRF Protections', () => {
    const createRequest = (urlParam: string) => {
        return new Request(`http://localhost/api/link-preview?url=${encodeURIComponent(urlParam)}`);
    };

    const fetchSafeModulePath = require.resolve('../../../src/lib/fetch-safe');
    let originalFetchSafe: unknown;

    test.beforeEach(() => {
        originalFetchSafe = require.cache[fetchSafeModulePath];
    });

    test.afterEach(() => {
        if (originalFetchSafe) {
            require.cache[fetchSafeModulePath] = originalFetchSafe as any;
        } else {
            delete require.cache[fetchSafeModulePath];
        }
    });

    test('should allow valid public HTTP/HTTPS URLs', async () => {
        require.cache[fetchSafeModulePath] = {
            exports: {
                fetchSafe: async () => {
                    const html = `<html><head><title>Example Domain</title></head><body></body></html>`;
                    return new Response(html, {
                        status: 200,
                        headers: { 'Content-Type': 'text/html' }
                    });
                }
            }
        } as NodeJS.Module;

        delete require.cache[require.resolve('../../../src/app/api/link-preview/route')];
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/link-preview/route');

        const req = createRequest('https://example.com');
        const res = await mockGET(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.title).toBe('Example Domain');
    });

    test('should reject invalid URL schemes', async () => {
        delete require.cache[require.resolve('../../../src/app/api/link-preview/route')];
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/link-preview/route');
        const req = createRequest('ftp://example.com/file.txt');
        const res = await mockGET(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Invalid URL scheme');
    });

    test('should reject localhost', async () => {
        delete require.cache[require.resolve('../../../src/app/api/link-preview/route')];
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/link-preview/route');
        const req = createRequest('http://localhost:3000/api/internal');
        const res = await mockGET(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Private or local addresses are not allowed');
    });

    test('should reject IPv6 localhost', async () => {
        delete require.cache[require.resolve('../../../src/app/api/link-preview/route')];
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/link-preview/route');
        const req = createRequest('http://[::1]/admin');
        const res = await mockGET(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Private or local addresses are not allowed');
    });

    test('should reject private IPv4 range 10.x.x.x', async () => {
        delete require.cache[require.resolve('../../../src/app/api/link-preview/route')];
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/link-preview/route');
        const req = createRequest('http://10.0.0.5/secret');
        const res = await mockGET(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Private or local addresses are not allowed');
    });

    test('should reject private IPv4 range 192.168.x.x', async () => {
        delete require.cache[require.resolve('../../../src/app/api/link-preview/route')];
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/link-preview/route');
        const req = createRequest('http://192.168.1.1/router-login');
        const res = await mockGET(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Private or local addresses are not allowed');
    });

    test('should reject link-local IPv4 169.254.x.x (Cloud metadata)', async () => {
        delete require.cache[require.resolve('../../../src/app/api/link-preview/route')];
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/link-preview/route');
        const req = createRequest('http://169.254.169.254/latest/meta-data/');
        const res = await mockGET(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Private or local addresses are not allowed');
    });

    test('should reject invalid URL strings', async () => {
        delete require.cache[require.resolve('../../../src/app/api/link-preview/route')];
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/link-preview/route');
        const req = createRequest('not-a-url');
        const res = await mockGET(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Invalid URL format');
    });
});
