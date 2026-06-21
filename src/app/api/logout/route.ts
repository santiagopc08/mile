import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('mile_device_token');

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Logout API error:', error);
        return NextResponse.json({ error: (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
    }
}