'use client';

import React from 'react';
import { LinkPreviewProps } from './types';
import { useLinkPreview } from './useLinkPreview';
import { LinkPreviewLoading } from './LinkPreviewLoading';
import { LinkPreviewError } from './LinkPreviewError';
import { LinkPreviewSquare } from './LinkPreviewSquare';
import { LinkPreviewDefault } from './LinkPreviewDefault';

export function LinkPreview({ url, category, variant = 'default' }: LinkPreviewProps) {
    const { data, loading, error } = useLinkPreview(url);

    if (loading) {
        return <LinkPreviewLoading variant={variant} />;
    }

    if (error || !data) {
        return <LinkPreviewError url={url} variant={variant} />;
    }

    if (variant === 'square') {
        return <LinkPreviewSquare data={data} category={category} />;
    }

    return <LinkPreviewDefault data={data} category={category} />;
}
