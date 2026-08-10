import React from 'react';
import { ExternalLink } from 'lucide-react';
import { LinkPreviewProps } from './types';

interface LinkPreviewErrorProps extends Pick<LinkPreviewProps, 'variant'> {
    url: string;
}

export function LinkPreviewError({ url, variant }: LinkPreviewErrorProps) {
    if (variant === 'square') {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex aspect-square w-full flex-col items-center justify-center gap-2 border border-white/10 bg-black p-3 text-center text-[8px] font-black uppercase tracking-[0.16em] text-[#00dbe9]"
            >
                <ExternalLink className="h-4 w-4" />
                Abrir Link
            </a>
        );
    }

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
