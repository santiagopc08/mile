import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            redirect: 'follow'
        });

        const finalUrl = response.url;
        const html = await response.text();

        // Extract Metadata
        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        const descriptionMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
        const siteNameMatch = html.match(/<meta property="og:site_name" content="([^"]+)"/i);

        // Extract Coordinates from Google Maps URL
        let coords = null;
        const mapsCoordsRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        const mapsMatch = finalUrl.match(mapsCoordsRegex);

        if (mapsMatch) {
            coords = {
                lat: parseFloat(mapsMatch[1]),
                lng: parseFloat(mapsMatch[2])
            };
        } else if (html.includes('google.com/maps')) {
            // Try searching in HTML for static map or other coordinate hints
            const htmlCoordsMatch = html.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (htmlCoordsMatch) {
                coords = {
                    lat: parseFloat(htmlCoordsMatch[1]),
                    lng: parseFloat(htmlCoordsMatch[2])
                };
            }
        }

        return NextResponse.json({
            title: titleMatch ? titleMatch[1] : null,
            image: imageMatch ? imageMatch[1] : null,
            description: descriptionMatch ? descriptionMatch[1] : null,
            siteName: siteNameMatch ? siteNameMatch[1] : null,
            url: finalUrl,
            coords
        });

    } catch (error) {
        console.error('Link preview error:', error);
        return NextResponse.json({ error: 'Failed to fetch link preview' }, { status: 500 });
    }
}
