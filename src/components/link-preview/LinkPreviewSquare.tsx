import React from 'react';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import { PreviewData, LinkPreviewProps } from './types';

interface LinkPreviewSquareProps extends Pick<LinkPreviewProps, 'category'> {
    data: PreviewData;
}

export function LinkPreviewSquare({ data, category }: LinkPreviewSquareProps) {
    const domain = new URL(data.url).hostname.replace('www.', '').toUpperCase();

    return (
        <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            data-preview-category={category}
            className="group relative block aspect-square w-full overflow-hidden border border-white/10 bg-black"
        >
            {data.image ? (
                <img
                        loading="lazy"
                    src={data.image}
                    alt={data.title || 'Preview'}
                    className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-white/15">
                    <ImageIcon className="h-8 w-8" />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
                <span className="mb-1 block text-[7px] font-black uppercase tracking-[0.18em] text-[#00dbe9]">
                    {data.siteName || domain}
                </span>
                <h5 className="line-clamp-2 text-[9px] font-black uppercase leading-tight tracking-[0.06em] text-white">
                    {data.title || 'Sin Título'}
                </h5>
            </div>
            <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center border border-white/20 bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <ExternalLink className="h-3.5 w-3.5" />
            </div>
        </a>
    );
}
