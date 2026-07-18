import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
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

        // If no device token cookie exists, generate one and store securely in device_tokens table
        if (!deviceToken) {
            deviceToken = crypto.randomUUID();

            const userId = user.id;

            // Insert the new token
            const { error: insertError } = await adminSupabase
                .from('device_tokens')
                .insert({ user_id: userId, token: deviceToken });

            if (insertError) {
                console.error('Failed to store sync device token:', insertError);
            }

            // Enforce limit of 5 tokens per user
            const { data: existingTokens } = await adminSupabase
                .from('device_tokens')
                .select('id')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (existingTokens && existingTokens.length > 5) {
                const tokensToDelete = existingTokens.slice(5).map(t => t.id);
                if (tokensToDelete.length > 0) {
                    await adminSupabase
                        .from('device_tokens')
                        .delete()
                        .in('id', tokensToDelete);
                }
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
