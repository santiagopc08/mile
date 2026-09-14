import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import mahjongImages from '@/data/mahjong-images.json';

export async function GET() {
    if (!(await verifyAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    return NextResponse.json(mahjongImages, {
        headers: {
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
        },
    });
}

