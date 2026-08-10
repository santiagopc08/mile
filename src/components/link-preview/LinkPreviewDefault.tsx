import React from 'react';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import { PreviewData, LinkPreviewProps } from './types';

interface LinkPreviewDefaultProps extends Pick<LinkPreviewProps, 'category'> {
    data: PreviewData;
}

export function LinkPreviewDefault({ data, category }: LinkPreviewDefaultProps) {
    const domain = new URL(data.url).hostname.replace('www.', '').toUpperCase();

    return (
        <div className="flex flex-col md:flex-row gap-3" data-preview-category={category}>
            <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block w-full md:w-32 h-20 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 overflow-hidden shrink-0"
            >
                {data.image ? (
                    <img
                        loading="lazy"
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
