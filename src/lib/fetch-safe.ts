import dns from 'dns/promises';

export function isLocalOrPrivateIP(ip: string): boolean {
    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
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
    ip = ip.toLowerCase();
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

export async function validateHostname(hostname: string): Promise<boolean> {
    try {
        const addrs = await dns.lookup(hostname, { all: true });
        for (const addr of addrs) {
            if (isLocalOrPrivateIP(addr.address)) {
                return false;
            }
        }
        return true;
    } catch {
        // Block if DNS resolution fails to prevent bypasses
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

    const isValid = await validateHostname(url.hostname);
    if (!isValid) {
        throw new Error('Private or local addresses are not allowed');
    }

    // Preserve default headers used originally for link previews
    const defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
    };

    const res = await fetch(url.toString(), {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        },
        redirect: 'manual'
    });

    if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) {
            return res;
        }
        const nextUrl = new URL(location, url).toString();
        return fetchSafe(nextUrl, options, maxRedirects - 1);
    }

    return res;
}
