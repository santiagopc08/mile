import { NextResponse } from 'next/server';
import { fetchSafe } from '@/lib/fetch-safe';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: Request) {
    if (!(await verifyAuth())) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        if (!url) {
            return new Response('Missing url parameter', { status: 400 });
        }

        // Basic validation: ensure it is a valid absolute HTTP/S URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return new Response('Invalid url scheme', { status: 400 });
        }

        // Security fix: Restrict open proxy to allowed origin (Supabase storage)
        const allowedOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!allowedOrigin) {
            return new Response('Forbidden: URL not in allowlist', { status: 403 });
        }

        try {
            const parsedUrl = new URL(url);
            const parsedAllowedOrigin = new URL(allowedOrigin);
            if (parsedUrl.origin !== parsedAllowedOrigin.origin || !parsedUrl.pathname.startsWith('/storage/v1/object/public/')) {
                return new Response('Forbidden: URL not in allowlist', { status: 403 });
            }
        } catch (e) {
            return new Response('Invalid URL format', { status: 400 });
        }

        // Fetch image on the server side to bypass browser-level CORS
        const res = await fetchSafe(url);
        if (!res.ok) {
            return new Response(`Failed to fetch image: ${res.statusText}`, { status: res.status });
        }

        const contentType = res.headers.get('Content-Type') || 'image/jpeg';

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
        if (!allowedTypes.some(type => contentType.toLowerCase().startsWith(type))) {
            return new Response('Invalid image content type', { status: 400 });
        }

        const blob = await res.blob();
        
        // Return image content with CORS and cache headers
        return new NextResponse(blob, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'X-Content-Type-Options': 'nosniff'
            }
        });
    } catch (error) {
        console.error('Error proxying image:', error);
        return new Response('Error proxying image', { status: 500 });
    }
}
