import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.substring(7);
        const adminSupabase = createServerClient();
        const { data: { user }, error } = await adminSupabase.auth.getUser(token);

        if (error || !user || (user.email !== 'el@mile.app' && user.email !== 'ella@mile.app')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cookieStore = await cookies();
        let deviceToken = cookieStore.get('mile_device_token')?.value;

        // If no device token cookie exists, generate one and update user metadata
        if (!deviceToken) {
            deviceToken = crypto.randomUUID();
            const metadata = user.user_metadata || {};
            const tokens = metadata.device_tokens || [];
            if (!tokens.includes(deviceToken)) {
                tokens.push(deviceToken);
                if (tokens.length > 5) tokens.shift();
                await adminSupabase.auth.admin.updateUserById(user.id, {
                    user_metadata: { ...metadata, device_tokens: tokens }
                });
            }
        }

        // Always refresh the cookie expiration
        cookieStore.set('mile_device_token', deviceToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365, // 1 year
            path: '/'
        });

        return NextResponse.json({ success: true, profile: user.email === 'el@mile.app' ? 'el' : 'ella' });
    } catch (e) {
        console.error('Error syncing auth session:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
