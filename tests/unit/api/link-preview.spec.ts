import { test, expect } from '@playwright/test';
import { GET } from '../../../src/app/api/link-preview/route';

test.describe('Link Preview API SSRF Protections', () => {
    const createRequest = (urlParam: string) => {
        return new Request(`http://localhost/api/link-preview?url=${encodeURIComponent(urlParam)}`);
    };

    test('should allow valid public HTTP/HTTPS URLs', async () => {
        // We do not want to actually hit the network if possible, but the route tries to fetch.
        // We will mock fetch to simulate a successful request.
        const req = createRequest('https://example.com');
        const res = await GET(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.title).toBe('Example Domain');
    });

    test('should reject invalid URL schemes', async () => {
        const req = createRequest('ftp://example.com/file.txt');
        const res = await GET(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Invalid URL scheme');
    });

    test('should reject localhost', async () => {
        const req = createRequest('http://localhost:3000/api/internal');
        const res = await GET(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Private or local addresses are not allowed');
    });

    test('should reject IPv6 localhost', async () => {
        const req = createRequest('http://[::1]/admin');
        const res = await GET(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Private or local addresses are not allowed');
    });

    test('should reject private IPv4 range 10.x.x.x', async () => {
        const req = createRequest('http://10.0.0.5/secret');
        const res = await GET(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Private or local addresses are not allowed');
    });

    test('should reject private IPv4 range 192.168.x.x', async () => {
        const req = createRequest('http://192.168.1.1/router-login');
        const res = await GET(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Private or local addresses are not allowed');
    });

    test('should reject link-local IPv4 169.254.x.x (Cloud metadata)', async () => {
        const req = createRequest('http://169.254.169.254/latest/meta-data/');
        const res = await GET(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Private or local addresses are not allowed');
    });

    test('should reject invalid URL strings', async () => {
        const req = createRequest('not-a-url');
        const res = await GET(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Invalid URL format');
    });
});
