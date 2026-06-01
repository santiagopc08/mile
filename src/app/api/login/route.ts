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

        // Validate credentials securely against environment variables
        const elPassword = process.env.PROFILE_EL_PASSWORD;
        const ellaPassword = process.env.PROFILE_ELLA_PASSWORD;

        let isValid = false;
        let email = '';

        if (profile === 'el' && password === elPassword) {
            isValid = true;
            email = 'el@mile.app';
        } else if (profile === 'ella' && password === ellaPassword) {
            isValid = true;
            email = 'ella@mile.app';
        }

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const adminSupabase = createServerClient();

        // Ensure user exists and password matches via admin API
        const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers();
        let userId = null;

        if (!listError && usersData) {
            const existingUser = usersData.users.find(u => u.email === email);
            if (existingUser) {
                userId = existingUser.id;
                await adminSupabase.auth.admin.updateUserById(userId, { password });
            } else {
                const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true
                });
                if (!createError && newUser.user) {
                    userId = newUser.user.id;
                }
            }
        }

        // Sign in to establish standard session. We use the standard client for this,
        // but Next.js requires special handling to set cookies from standard client.
        // Since we are creating a custom device token, we can just use the admin client
        // to verify credentials, then set our own persistent cookie. However, our UI
        // expects Supabase session, so we can generate a secure random device token
        // and link it to the profile.

        // Actually, to establish the standard Supabase session for the browser,
        // we can let the client-side call `signInWithPassword` OR we can do it via auth.signInWithPassword here,
        // but passing the session back is complex.
        // Wait, the client-side `login` expects this route to just validate and set up the session.
        // Wait, earlier I modified `ProfileContext.tsx`:
        // It removed `signInWithPassword` from the client! So we MUST establish the session here or return the token for the client to establish it.
        // Let's modify this to use the Supabase Auth helpers for Next.js if possible, OR we can sign in using `adminSupabase` and return the session to the client?
        // Let's just create a unique device token, save it to cookies, and we'll have the client do a standard sign in using the ENV passwords? NO, client shouldn't have ENV passwords.

        // So this `/api/login` route should perform the Supabase sign in.
        // Next.js App Router route handlers can set cookies.

        const { data: signInData, error: signInError } = await adminSupabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInError) {
             return NextResponse.json({ error: 'Failed to establish session' }, { status: 500 });
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