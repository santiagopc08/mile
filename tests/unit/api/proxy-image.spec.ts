import { test, expect } from '@playwright/test';
import { GET } from '../../../src/app/api/proxy-image/route';

test.describe('Proxy Image API Security', () => {
    const createRequest = (urlParam: string) => {
        return new Request(`http://localhost/api/proxy-image?url=${encodeURIComponent(urlParam)}`);
    };

    let originalFetch: typeof global.fetch;

    test.beforeEach(() => {
        originalFetch = global.fetch;
    });

    test.afterEach(() => {
        global.fetch = originalFetch;
    });

    const mockFetchWithContentType = (contentType: string) => {
        global.fetch = async () => {
            return new Response(Buffer.from('fake-data'), {
                status: 200,
                headers: { 'Content-Type': contentType }
            });
        };
    };

    test('should allow valid image types and include nosniff header', async () => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

        for (const type of allowedTypes) {
            mockFetchWithContentType(type);
            const req = createRequest('https://example.com/image.jpg');
            const res = await GET(req);

            expect(res.status).toBe(200);
            expect(res.headers.get('Content-Type')).toBe(type);
            expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
        }
    });

    test('should reject text/html', async () => {
        mockFetchWithContentType('text/html; charset=utf-8');
        const req = createRequest('https://example.com/page.html');
        const res = await GET(req);

        expect(res.status).toBe(400);
        const text = await res.text();
        expect(text).toBe('Invalid image content type');
    });

    test('should reject image/svg+xml (prevent XSS)', async () => {
        mockFetchWithContentType('image/svg+xml');
        const req = createRequest('https://example.com/image.svg');
        const res = await GET(req);

        expect(res.status).toBe(400);
        const text = await res.text();
        expect(text).toBe('Invalid image content type');
    });

    test('should reject application/javascript', async () => {
        mockFetchWithContentType('application/javascript');
        const req = createRequest('https://example.com/script.js');
        const res = await GET(req);

        expect(res.status).toBe(400);
    });

    test('should fallback to image/jpeg if no content type and allow it', async () => {
        global.fetch = async () => {
            return new Response(Buffer.from('fake-data'), {
                status: 200,
                headers: {} // No content-type header
            });
        };
        const req = createRequest('https://example.com/image.jpg');
        const res = await GET(req);

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('image/jpeg');
    });
    test('should handle fetch errors gracefully', async () => {
        const originalConsoleError = console.error;
        console.error = () => {};
        try {
            global.fetch = async () => {
                throw new Error('Test fetch error');
            };
            const req = createRequest('https://example.com/image.jpg');
            const res = await GET(req);

            expect(res.status).toBe(500);
            const text = await res.text();
            expect(text).toBe('Error proxying image');
        } finally {
            console.error = originalConsoleError;
        }
    });
});
