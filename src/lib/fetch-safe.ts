import dns from 'dns/promises';
import * as http from 'http';
import * as https from 'https';
import { Readable } from 'stream';

export function isLocalOrPrivateIP(ip: string): boolean {
    ip = ip.toLowerCase();

    // Normalize IPv4-mapped IPv6 addresses (e.g., ::ffff:127.0.0.1, 0:0:0:0:0:ffff:127.0.0.1)
    const mappedIpv4Match = ip.match(/^(?:0:0:0:0:0:ffff:|::ffff:)(\d+\.\d+\.\d+\.\d+)$/);
    if (mappedIpv4Match) {
        ip = mappedIpv4Match[1];
    }

    if (ip.includes('.')) {
        const parts = ip.split('.').map(Number);
        return (
            parts[0] === 127 ||
            parts[0] === 10 ||
            (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
            (parts[0] === 192 && parts[1] === 168) ||
            (parts[0] === 169 && parts[1] === 254) ||
            parts[0] === 0 ||
            parts[0] === 255
        );
    }
    return (
        ip === '::1' ||
        ip === '::' ||
        ip.startsWith('fc') ||
        ip.startsWith('fd') ||
        ip.startsWith('fe8') ||
        ip.startsWith('fe9') ||
        ip.startsWith('fea') ||
        ip.startsWith('feb')
    );
}

export async function resolveSafeIP(hostname: string): Promise<string> {
    try {
        const addrs = await dns.lookup(hostname, { all: true });
        for (const addr of addrs) {
            if (!isLocalOrPrivateIP(addr.address)) {
                return addr.address;
            }
        }
    } catch {
        // Block if DNS resolution fails to prevent bypasses
    }
    throw new Error('Private or local addresses are not allowed');
}

const validateCache = new Map<string, { isValid: boolean; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function validateHostname(hostname: string): Promise<boolean> {
    const now = Date.now();
    const cached = validateCache.get(hostname);
    if (cached && cached.expiresAt > now) {
        return cached.isValid;
    }

    try {
        const addrs = await dns.lookup(hostname, { all: true });
        for (const addr of addrs) {
            if (isLocalOrPrivateIP(addr.address)) {
                validateCache.set(hostname, { isValid: false, expiresAt: now + CACHE_TTL_MS });
                return false;
            }
        }
        validateCache.set(hostname, { isValid: true, expiresAt: now + CACHE_TTL_MS });
        return true;
    } catch {
        // We don't cache errors to allow transient failures to recover
        return false;
    }
}

export async function fetchSafe(targetUrl: string, options: RequestInit = {}, maxRedirects = 5): Promise<Response> {
    if (maxRedirects < 0) {
        throw new Error('Too many redirects');
    }

    const url = new URL(targetUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Invalid URL scheme');
    }

    // Validate hostname strictly first to prevent DNS rebinding attacks on redirects
    const isValid = await validateHostname(url.hostname);
    if (!isValid) {
        throw new Error('Private or local addresses are not allowed');
    }

    const ip = await resolveSafeIP(url.hostname);

    // Preserve default headers used originally for link previews
    const defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
    };

    const requestOptions = {
        hostname: ip,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
            ...defaultHeaders,
            ...((options.headers || {}) as Record<string, string>),
            Host: url.hostname // Important for virtual hosting
        } as http.OutgoingHttpHeaders,
        // Important: set servername for SNI in HTTPS!
        ...(url.protocol === 'https:' ? { servername: url.hostname } : {})
    };

    return new Promise((resolve, reject) => {
        const client = url.protocol === 'https:' ? https : http;
        const req = client.request(requestOptions, (res) => {
            const status = res.statusCode || 200;

            // Handle redirects (matching previous fetchSafe behavior with redirect: 'manual')
            if (status >= 300 && status < 400) {
                const location = res.headers.location;
                if (!location) {
                    resolve(createResponse(res, url.toString()));
                    return;
                }
                const nextUrl = new URL(location, url).toString();
                // To prevent memory leaks, we should consume or destroy the stream
                res.resume();
                resolve(fetchSafe(nextUrl, options, maxRedirects - 1));
                return;
            }

            resolve(createResponse(res, url.toString()));
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy(new Error('Request timeout'));
        });

        // Handle body if present in options
        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

function createResponse(res: http.IncomingMessage, finalUrl: string): Response {
    const headers = new Headers();
    for (const [key, value] of Object.entries(res.headers)) {
        if (Array.isArray(value)) {
            value.forEach(v => headers.append(key, v));
        } else if (value) {
            headers.set(key, value);
        }
    }

    const webStream = Readable.toWeb(res) as ReadableStream<Uint8Array>;

    const webRes = new Response(webStream, {
        status: res.statusCode,
        statusText: res.statusMessage,
        headers
    });

    // We also need to attach the final URL so `res.url` works for link preview
    if (finalUrl) {
        Object.defineProperty(webRes, 'url', { value: finalUrl });
    }

    return webRes;
}
