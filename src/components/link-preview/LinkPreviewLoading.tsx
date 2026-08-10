import React from 'react';
import { Loader2 } from 'lucide-react';
import { LinkPreviewProps } from './types';

export function LinkPreviewLoading({ variant }: Pick<LinkPreviewProps, 'variant'>) {
    if (variant === 'square') {
        return (
            <div className="flex aspect-square w-full items-center justify-center border border-white/10 bg-black">
                <Loader2 className="h-4 w-4 animate-spin text-[#a88a7e]" />
            </div>
        );
    }

    return (
        <div className="w-full md:w-48 h-24 border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-stone-300 animate-spin" />
        </div>
    );
}
