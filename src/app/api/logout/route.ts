import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';

export async function POST() {
    try {
        if (!(await verifyAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const cookieStore = await cookies();
        cookieStore.delete('mile_device_token');

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Logout API error:', error);
        return NextResponse.json({ error: (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
    }
}