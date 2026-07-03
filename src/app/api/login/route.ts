import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { profile, password } = await request.json();

        if (!profile || !password) {
            return NextResponse.json({ error: 'Missing profile or password' }, { status: 400 });
        }

        const email = profile === 'el' ? 'el@mile.app' : 'ella@mile.app';
        const adminSupabase = createServerClient();

        // Sign in using Supabase Client with password directly
        const { data: signInData, error: signInError } = await adminSupabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInError) {
             return NextResponse.json({ error: 'Invalid credentials or failed to establish session' }, { status: 401 });
        }

        // Generate a secure device token
        const deviceToken = crypto.randomUUID();

        // Store device token securely in the device_tokens table
        if (signInData.user) {
             const userId = signInData.user.id;

             // Insert the new token
             const { error: insertError } = await adminSupabase
                 .from('device_tokens')
                 .insert({ user_id: userId, token: deviceToken });

             if (insertError) {
                 console.error('Failed to store device token:', insertError);
                 // We might still want to proceed, but ideally this shouldn't fail
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

        // Set the device token as a long-lived HttpOnly cookie
        const cookieStore = await cookies();
        cookieStore.set('mile_device_token', deviceToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365, // 1 year
            path: '/'
        });

        // We also need to set the Supabase session cookies if we are to use the server client.
        // But our `ProfileContext` calls `supabase.auth.getSession()` on the client.
        // If we want the client `supabase` to have the session, we have to return the session from this API
        // and let the client call `supabase.auth.setSession(session)`.

        return NextResponse.json({ success: true, session: signInData.session });

    } catch (error: unknown) {
        console.error('Login API error:', error);
        return NextResponse.json({ error: (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
    }
}