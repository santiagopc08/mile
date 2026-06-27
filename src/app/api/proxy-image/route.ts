import { NextResponse } from 'next/server';
import { fetchSafe } from '@/lib/fetch-safe';


export async function GET(request: Request) {
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

        // Fetch image on the server side to bypass browser-level CORS
        const res = await fetchSafe(url);
        if (!res.ok) {
            return new Response(`Failed to fetch image: ${res.statusText}`, { status: res.status });
        }

        const blob = await res.blob();
        
        // Return image content with CORS and cache headers
        return new NextResponse(blob, {
            status: 200,
            headers: {
                'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Error proxying image:', error);
        return new Response('Error proxying image', { status: 500 });
    }
}
