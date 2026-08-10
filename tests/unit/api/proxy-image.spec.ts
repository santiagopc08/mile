import { test, expect } from '@playwright/test';

test.describe('Proxy Image API Security', () => {
    const createRequest = (urlParam: string) => {
        return new Request(`http://localhost/api/proxy-image?url=${encodeURIComponent(urlParam)}`);
    };

    const fetchSafeModulePath = require.resolve('../../../src/lib/fetch-safe');
    let originalFetchSafe: unknown;

    let originalSupabaseUrl: string | undefined;
        test.beforeEach(() => {
        originalFetchSafe = require.cache[fetchSafeModulePath];
        originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com';

        // Mock server-only
        require.cache[require.resolve('server-only')] = {
            exports: {}
        } as NodeJS.Module;
        require.cache[require.resolve('../../../src/lib/supabase-server')] = {
            exports: {
                createServerClient: () => ({})
            }
        } as NodeJS.Module;

        // Mock auth to return a valid user session
        require.cache[require.resolve('../../../src/lib/auth')] = {
            exports: {
                verifyAuth: async () => true,
                getAuthUser: async () => ({ id: 'test-user-id' })
            }
        } as NodeJS.Module;
    });

    test.afterEach(() => {
        if (originalFetchSafe) {
            require.cache[fetchSafeModulePath] = originalFetchSafe as any;
        } else {
            delete require.cache[fetchSafeModulePath];
        }
        if (originalSupabaseUrl !== undefined) {
            process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
        } else {
            delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        }
    });

    const mockFetchWithContentType = (contentType: string) => {
        require.cache[fetchSafeModulePath] = {
            exports: {
                fetchSafe: async () => {
                    return new Response(Buffer.from('fake-data'), {
                        status: 200,
                        headers: { 'Content-Type': contentType }
                    });
                }
            }
        } as NodeJS.Module;
    };

    test('should allow valid image types and include nosniff header', async () => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

        for (const type of allowedTypes) {
            mockFetchWithContentType(type);
                        delete require.cache[require.resolve('../../../src/app/api/proxy-image/route')];
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/proxy-image/route');
            const req = createRequest('https://example.com/storage/v1/object/public/image.jpg');
            const res = await mockGET(req);

            expect(res.status).toBe(200);
            expect(res.headers.get('Content-Type')).toBe(type);
            expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
        }
    });

    test('should reject text/html', async () => {
        mockFetchWithContentType('text/html; charset=utf-8');
                delete require.cache[require.resolve('../../../src/app/api/proxy-image/route')];
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/proxy-image/route');
        const req = createRequest('https://example.com/storage/v1/object/public/page.html');
        const res = await mockGET(req);

        expect(res.status).toBe(400);
        const text = await res.text();
        expect(text).toBe('Invalid image content type');
    });

    test('should reject image/svg+xml (prevent XSS)', async () => {
        mockFetchWithContentType('image/svg+xml');
                delete require.cache[require.resolve('../../../src/app/api/proxy-image/route')];
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/proxy-image/route');
        const req = createRequest('https://example.com/storage/v1/object/public/image.svg');
        const res = await mockGET(req);

        expect(res.status).toBe(400);
        const text = await res.text();
        expect(text).toBe('Invalid image content type');
    });

    test('should reject application/javascript', async () => {
        mockFetchWithContentType('application/javascript');
                delete require.cache[require.resolve('../../../src/app/api/proxy-image/route')];
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/proxy-image/route');
        const req = createRequest('https://example.com/storage/v1/object/public/script.js');
        const res = await mockGET(req);

        expect(res.status).toBe(400);
    });

    test('should reject URLs not in allowlist (prevent SSRF/Open Proxy)', async () => {
        try {
            delete require.cache[require.resolve('../../../src/app/api/proxy-image/route')];
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { GET: mockGET } = require('../../../src/app/api/proxy-image/route');

            // Unrelated domain
            const req = createRequest('https://evil.com/image.jpg');
            const res = await mockGET(req);

            expect(res.status).toBe(403);
            const text = await res.text();
            expect(text).toBe('Forbidden: URL not in allowlist');

            // Domain suffix bypass attempt
            const reqBypass = createRequest('https://example.com.evil.com/image.jpg');
            const resBypass = await mockGET(reqBypass);

            expect(resBypass.status).toBe(403);
            const textBypass = await resBypass.text();
            expect(textBypass).toBe('Forbidden: URL not in allowlist');

            // Trusted domain
            mockFetchWithContentType('image/jpeg');
            delete require.cache[require.resolve('../../../src/app/api/proxy-image/route')];
            const { GET: mockGET2 } = require('../../../src/app/api/proxy-image/route');
            const reqTrusted = createRequest('https://example.com/storage/v1/object/public/image.jpg');
            const resTrusted = await mockGET2(reqTrusted);
            expect(resTrusted.status).toBe(200);
        } finally {
            // Restore happens in afterEach
        }
    });

    test('should fallback to image/jpeg if no content type and allow it', async () => {
        require.cache[fetchSafeModulePath] = {
            exports: {
                fetchSafe: async () => {
                    return new Response(Buffer.from('fake-data'), {
                        status: 200,
                        headers: {} // No content-type header
                    });
                }
            }
        } as NodeJS.Module;
                delete require.cache[require.resolve('../../../src/app/api/proxy-image/route')];
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/proxy-image/route');
        const req = createRequest('https://example.com/storage/v1/object/public/image.jpg');
        const res = await mockGET(req);

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('image/jpeg');
    });
    test('should handle fetch errors gracefully', async () => {
        const originalConsoleError = console.error;
        console.error = () => {};
        try {
            require.cache[fetchSafeModulePath] = {
                exports: {
                    fetchSafe: async () => {
                        throw new Error('Test fetch error');
                    }
                }
            } as NodeJS.Module;
                        delete require.cache[require.resolve('../../../src/app/api/proxy-image/route')];
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/proxy-image/route');
            const req = createRequest('https://example.com/storage/v1/object/public/image.jpg');
            const res = await mockGET(req);

            expect(res.status).toBe(500);
            const text = await res.text();
            expect(text).toBe('Error proxying image');
        } finally {
            console.error = originalConsoleError;
        }
    });
});
