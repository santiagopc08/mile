import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const deviceToken = cookieStore.get('mile_device_token')?.value;

        if (!deviceToken) {
            return NextResponse.json({ error: 'No device token found' }, { status: 401 });
        }

        const adminSupabase = createServerClient();

        // Find user by device token in user_metadata
        // Supabase admin listUsers supports pagination, we assume a small number of users (2)
        const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers();

        if (listError || !usersData) {
             return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
        }

        let matchedUser = null;
        for (const user of usersData.users) {
            if (user.user_metadata?.device_tokens?.includes(deviceToken)) {
                matchedUser = user;
                break;
            }
        }

        if (!matchedUser) {
             // Invalid or expired token
             return NextResponse.json({ error: 'Invalid device token' }, { status: 401 });
        }

        const email = matchedUser.email;
        const profile = email === 'ella@mile.app' ? 'ella' : 'el';

        // We need the password to sign in and get a session, or we can use admin to generate a link?
        // Wait, adminSupabase cannot generate a session directly without password unless we use generateLink (OTP).
        // Since we know the password is in the env vars, we can just use the ENV vars to log them in!
        const password = profile === 'ella' ? process.env.PROFILE_ELLA_PASSWORD : process.env.PROFILE_EL_PASSWORD;

        if (!password) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const { data: signInData, error: signInError } = await adminSupabase.auth.signInWithPassword({
            email: email!,
            password
        });

        if (signInError) {
             return NextResponse.json({ error: 'Failed to establish session' }, { status: 500 });
        }

        // Return the session to the client
        return NextResponse.json({ success: true, profile, session: signInData.session });

    } catch (error: any) {
        console.error('Refresh API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}