import { useState, useEffect } from 'react';
import { PreviewData } from './types';

export function useLinkPreview(url: string) {
    const [data, setData] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPreview = async () => {
            if (!url) return;

            // Validate URL format before fetching
            const isUrl = url.startsWith('http://') || url.startsWith('https://');
            if (!isUrl) {
                setError(true);
                setLoading(false);
                return;
            }

            const cacheKey = `link-preview:${url}`;
            try {
                setLoading(true);
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        if (Date.now() - parsed.timestamp < 86400000) {
                            setData(parsed.data);
                            setLoading(false);
                            return;
                        }
                    } catch (e) {
                        // Invalid cache data, ignore and fetch fresh
                        localStorage.removeItem(cacheKey);
                    }
                }

                const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                    localStorage.setItem(cacheKey, JSON.stringify({
                        data: json,
                        timestamp: Date.now()
                    }));
                } else {
                    setError(true);
                }
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchPreview();
    }, [url]);

    return { data, loading, error };
}
