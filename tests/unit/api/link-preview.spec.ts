/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import { test, expect } from '@playwright/test';

test.describe('Link Preview API SSRF Protections', () => {
    const createRequest = (urlParam: string) => {
        return new Request(`http://localhost/api/link-preview?url=${encodeURIComponent(urlParam)}`);
    };

    const fetchSafeModulePath = require.resolve('../../../src/lib/fetch-safe');
    const authModulePath = require.resolve('../../../src/lib/auth');
    let originalFetchSafe: unknown;
    let originalAuth: unknown;

    test.beforeEach(() => {
        originalFetchSafe = require.cache[fetchSafeModulePath];
        originalAuth = require.cache[authModulePath];

        // Mock auth by default for all tests
        require.cache[authModulePath] = {
            exports: {
                verifyAuth: async () => true
            }
        } as NodeJS.Module;
    });

    test.afterEach(() => {
        if (originalFetchSafe) {
            require.cache[fetchSafeModulePath] = originalFetchSafe as any;
        } else {
            delete require.cache[fetchSafeModulePath];
        }

        if (originalAuth) {
            require.cache[authModulePath] = originalAuth as any;
        } else {
            delete require.cache[authModulePath];
        }
    });

    test('should reject unauthenticated requests', async () => {
        require.cache[authModulePath] = {
            exports: {
                verifyAuth: async () => false
            }
        } as NodeJS.Module;

        delete require.cache[require.resolve('../../../src/app/api/link-preview/route')];
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/link-preview/route');

        const req = createRequest('https://example.com');
        const res = await mockGET(req);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toBe('Unauthorized');
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

    test('should handle map API parsing errors', async () => {
        const originalFetch = global.fetch;
        const originalApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        try {
            global.fetch = async (url, options) => {
                if (url === 'https://places.googleapis.com/v1/places:searchText') {
                    // Create a realistic mock Response object that throws when json() is called
                    const mockResponse = new Response('not a json', { status: 200 });
                    mockResponse.json = async () => {
                        throw new Error('Unexpected token < in JSON at position 0');
                    };
                    return mockResponse;
                }
                return originalFetch(url, options);
            };

            process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'dummy-key';

            require.cache[fetchSafeModulePath] = {
                exports: {
                    fetchSafe: async () => {
                        const html = `<html><head><title>Some Place</title></head><body></body></html>`;
                        return new Response(html, {
                            status: 200,
                            headers: { 'Content-Type': 'text/html' }
                        });
                    }
                }
            } as any;

            delete require.cache[require.resolve('../../../src/app/api/link-preview/route')];
            const { GET: mockGET } = require('../../../src/app/api/link-preview/route');

            const req = createRequest('https://google.com/maps?q=something');
            const res = await mockGET(req);

            expect(res.status).toBe(500);
            const data = await res.json();
            expect(data.error).toBe('Failed to parse map API response');
        } finally {
            global.fetch = originalFetch;
            process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalApiKey;
        }
    });

    test('should return 400 when URL is not provided', async () => {
        delete require.cache[require.resolve('../../../src/app/api/link-preview/route')];
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/link-preview/route');

        const req = new Request('http://localhost/api/link-preview'); // Missing url param
        const res = await mockGET(req);

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('URL is required');
    });

    test('should extract metadata correctly', async () => {
        require.cache[fetchSafeModulePath] = {
            exports: {
                fetchSafe: async () => {
                    const html = "<html\n><head\n><meta property=\"og:title\" content=\"Test Title\" /\n><meta property=\"og:image\" content=\"https://example.com/image.jpg\" /\n><meta property=\"og:description\" content=\"Test Description\" /\n><meta property=\"og:site_name\" content=\"Test Site\" /\n></head\n><body\n></body\n></html\n>";
                    return { url: 'https://example.com/test', text: async () => html };
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
        expect(data.title).toBe('Test Title');
        expect(data.image).toBe('https://example.com/image.jpg');
        expect(data.description).toBe('Test Description');
        expect(data.siteName).toBe('Test Site');
        expect(data.domain).toBe('example.com');
    });

    test('should extract price from meta tags', async () => {
        require.cache[fetchSafeModulePath] = {
            exports: {
                fetchSafe: async () => {
                    const html = "<html><head><meta property=\"og:price:amount\" content=\"49.99\" /></head><body></body></html>";
                    return { url: 'https://example.com/product', text: async () => html };
                }
            }
        } as NodeJS.Module;

        delete require.cache[require.resolve('../../../src/app/api/link-preview/route')];
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/link-preview/route');

        const req = createRequest('https://example.com/product');
        const res = await mockGET(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.estimatedPrice).toBe(49.99);
    });

    test('should extract price from HTML fallback (COP format)', async () => {
        require.cache[fetchSafeModulePath] = {
            exports: {
                fetchSafe: async () => {
                    const html = "<html><body>Price: $ 1.500.000</body></html>";
                    return { url: 'https://example.com/product', text: async () => html };
                }
            }
        } as NodeJS.Module;

        delete require.cache[require.resolve('../../../src/app/api/link-preview/route')];
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/link-preview/route');

        const req = createRequest('https://example.com/product');
        const res = await mockGET(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.estimatedPrice).toBe(1500000);
    });

    test('should extract coordinates from URL', async () => {
        require.cache[fetchSafeModulePath] = {
            exports: {
                fetchSafe: async () => {
                    const html = "<html><body></body></html>";
                    return { url: 'https://www.google.com/maps/@40.7128,-74.0060,15z', text: async () => html };
                }
            }
        } as NodeJS.Module;

        delete require.cache[require.resolve('../../../src/app/api/link-preview/route')];
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { GET: mockGET } = require('../../../src/app/api/link-preview/route');

        const req = createRequest('https://www.google.com/maps/@40.7128,-74.0060,15z');
        const res = await mockGET(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.coords).toEqual({ lat: 40.7128, lng: -74.0060 });
    });

    test('should handle Too many redirects error', async () => {
        require.cache[fetchSafeModulePath] = {
            exports: {
                fetchSafe: async () => {
                    throw new Error('Too many redirects');
                }
            }
        } as any;

        delete require.cache[require.resolve('../../../src/app/api/link-preview/route')];
        const { GET: mockGET } = require('../../../src/app/api/link-preview/route');

        const req = createRequest('https://example.com/redirect-loop');
        const res = await mockGET(req);

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Too many redirects');
    });

    test('should return 500 when fetchSafe throws an unexpected error', async () => {
        require.cache[fetchSafeModulePath] = {
            exports: {
                fetchSafe: async () => {
                    throw new Error('Some unexpected network failure');
                }
            }
        } as any;

        delete require.cache[require.resolve('../../../src/app/api/link-preview/route')];
        const { GET: mockGET } = require('../../../src/app/api/link-preview/route');

        const req = createRequest('https://example.com/error-path');
        const res = await mockGET(req);

        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data.error).toBe('Failed to fetch link preview');
    });
});
