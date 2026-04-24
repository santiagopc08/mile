'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react';

interface LinkPreviewProps {
    url: string;
    category: 'plan' | 'antojo' | 'gusto';
}

interface PreviewData {
    title: string | null;
    image: string | null;
    description: string | null;
    siteName: string | null;
    url: string;
}

export function LinkPreview({ url, category }: LinkPreviewProps) {
    const [data, setData] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                } else {
                    setError(true);
                }
            } catch (e) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (url) fetchPreview();
    }, [url]);

    if (loading) {
        return (
            <div className="w-full md:w-48 h-24 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-stone-300 animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[9px] uppercase font-bold tracking-widest text-geometric-accent hover:underline"
            >
                <ExternalLink className="w-3 h-3" />
                Abrir Link
            </a>
        );
    }

    const domain = new URL(data.url).hostname.replace('www.', '').toUpperCase();

    return (
        <div className="flex flex-col md:flex-row gap-3">
            <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block w-full md:w-32 h-20 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 overflow-hidden shrink-0"
            >
                {data.image ? (
                    <img
                        src={data.image}
                        alt={data.title || 'Preview'}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                        <ImageIcon className="w-6 h-6" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink className="w-4 h-4 text-white" />
                </div>
            </a>

            <div className="flex flex-col justify-center min-w-0 py-1">
                <span className="text-[7px] font-black tracking-widest text-geometric-accent mb-1 uppercase">
                    {data.siteName || domain}
                </span>
                <h5 className="text-[10px] font-bold uppercase tracking-tight text-stone-800 dark:text-stone-200 line-clamp-2 leading-tight">
                    {data.title || 'Sin Título'}
                </h5>
                {data.description && (
                    <p className="text-[8px] text-stone-500 mt-1 line-clamp-1 italic">
                        {data.description}
                    </p>
                )}
            </div>
        </div>
    );
}
