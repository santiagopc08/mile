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

        // Store device token in Supabase (we can create a table for this, or just use user metadata)
        // For simplicity without schema changes, we can store it in user_metadata
        if (signInData.user) {
             const metadata = signInData.user.user_metadata || {};
             const tokens = metadata.device_tokens || [];
             tokens.push(deviceToken);
             // Keep only last 5 tokens to prevent metadata bloat
             if (tokens.length > 5) tokens.shift();

             await adminSupabase.auth.admin.updateUserById(signInData.user.id, {
                 user_metadata: { ...metadata, device_tokens: tokens }
             });
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

    } catch (error: any) {
        console.error('Login API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}