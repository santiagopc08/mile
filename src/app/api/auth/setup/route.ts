import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { profile, password } = await request.json();
        
        if (!profile || !password) {
            return NextResponse.json({ error: 'Missing profile or password' }, { status: 400 });
        }

        const email = profile === 'ella' ? 'ella@mile.app' : 'el@mile.app';
        const adminSupabase = createServerClient();

        // 1. Attempt to lazily create the user using Supabase admin auth
        const { error } = await adminSupabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (error) {
            // If the user already exists, let's update their password in case it was changed
            if (error.message.includes('already exists') || error.message.includes('email_exists')) {
                const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers();
                if (!listError && usersData) {
                    const existingUser = usersData.users.find(u => u.email === email);
                    if (existingUser) {
                        await adminSupabase.auth.admin.updateUserById(existingUser.id, { password });
                    }
                }
            } else {
                console.error('Supabase Auth user setup error:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, email });
    } catch (err: any) {
        console.error('Auth setup API error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
