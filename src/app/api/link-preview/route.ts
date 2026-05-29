import { NextResponse } from 'next/server';

// Use environment variable for API key
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
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

        // Extract Price from meta tags or common patterns
        let estimatedPrice: number | null = null;
        const priceMetaMatch =
            html.match(/<meta property="og:price:amount" content="([^"]+)"/i) ||
            html.match(/<meta property="product:price:amount" content="([^"]+)"/i) ||
            html.match(/<meta property="product:price" content="([^"]+)"/i) ||
            html.match(/<meta itemprop="price" content="([^"]+)"/i);

        if (priceMetaMatch) {
            const parsed = parseFloat(priceMetaMatch[1].replace(/[^0-9.]/g, ''));
            if (!isNaN(parsed)) estimatedPrice = parsed;
        }

        // Fallback: try common price patterns in HTML (COP format: $XX.XXX or $X.XXX.XXX)
        if (!estimatedPrice) {
            const priceCOPMatch = html.match(/\$\s?([\d]{1,3}(?:\.[\d]{3})+)/);
            if (priceCOPMatch) {
                const parsed = parseFloat(priceCOPMatch[1].replace(/\./g, ''));
                if (!isNaN(parsed) && parsed > 100) estimatedPrice = parsed;
            }
        }

        // Extract domain cleanly
        let domain: string | null = null;
        try {
            domain = new URL(finalUrl).hostname.replace('www.', '');
        } catch { }

        // Coordinate Extraction Helper
        const extractCoords = (text: string) => {
            const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

            const dataMatch = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
            if (dataMatch) return { lat: parseFloat(dataMatch[1]), lng: parseFloat(dataMatch[2]) };

            const centerMatch = text.match(/center=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/);
            if (centerMatch) return { lat: parseFloat(centerMatch[1]), lng: parseFloat(centerMatch[2]) };

            const llMatch = text.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };

            return null;
        };

        // Extract Coordinates from Google Maps URL or HTML
        let coords = null;
        const isGoogleMaps = finalUrl.includes('google.com/maps') || finalUrl.includes('maps.app.goo.gl') || targetUrl.includes('google.com/maps') || targetUrl.includes('maps.app.goo.gl');

        if (isGoogleMaps) {
            // 1. Try extracting from URL
            coords = extractCoords(finalUrl);

            // 2. Try extracting from HTML
            if (!coords) {
                const found = extractCoords(html);
                // Avoid default Google Maps US center (37.0625, -95.677068)
                if (found && Math.abs(found.lat - 37.0625) > 0.001) {
                    coords = found;
                }
            }

            // 3. Fallback: Use Google Places API if extraction failed but we have a query or title
            if (!coords && (finalUrl.includes('?q=') || titleMatch)) {
                try {
                    let query = '';
                    try {
                        const urlObj = new URL(finalUrl);
                        query = urlObj.searchParams.get('q') || '';
                    } catch (e) {
                        // Ignore URL parsing error
                    }

                    if (!query && titleMatch) {
                        query = titleMatch[1];
                    }

                    if (query && GOOGLE_MAPS_API_KEY) {
                        const placesRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                                'X-Goog-FieldMask': 'places.location'
                            },
                            body: JSON.stringify({ textQuery: query })
                        });
                        const placesData = await placesRes.json();
                        if (placesData.places?.[0]?.location) {
                            coords = {
                                lat: placesData.places[0].location.latitude,
                                lng: placesData.places[0].location.longitude
                            };
                        }
                    }
                } catch (placesErr) {
                    console.error('Places API fallback error:', placesErr);
                }
            }
        }

        return NextResponse.json({
            title: titleMatch ? titleMatch[1] : null,
            image: imageMatch ? imageMatch[1] : null,
            description: descriptionMatch ? descriptionMatch[1] : null,
            siteName: siteNameMatch ? siteNameMatch[1] : null,
            url: finalUrl,
            domain,
            estimatedPrice,
            coords
        });

    } catch (error) {
        console.error('Link preview error:', error);
        return NextResponse.json({ error: 'Failed to fetch link preview' }, { status: 500 });
    }
}
