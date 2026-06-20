'use client';

import { useSearchParams } from 'next/navigation';
import { LinkPreview } from '@/components/LinkPreview';
import { Suspense } from 'react';

function LinkPreviewTestContent() {
    const searchParams = useSearchParams();
    const url = searchParams.get('url') || '';
    const variant = (searchParams.get('variant') as 'default' | 'square') || 'default';

    return (
        <div className="p-4 bg-stone-100 min-h-screen">
            <h1>LinkPreview Test Mount</h1>
            <LinkPreview url={url} category="gusto" variant={variant} />
        </div>
    );
}

export default function LinkPreviewTestPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LinkPreviewTestContent />
        </Suspense>
    );
}
