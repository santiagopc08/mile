import { cookies, headers } from 'next/headers';
import { createServerClient } from '@/lib/supabase';
import crypto from 'crypto';

function secureCompare(a: string, b: string): boolean {
    const hashA = crypto.createHash('sha256').update(a).digest();
    const hashB = crypto.createHash('sha256').update(b).digest();
    return crypto.timingSafeEqual(hashA, hashB);
}

export async function verifyAuth() {
    try {
        // 1. Try checking the Authorization header first (JWT Token)
        const headersList = await headers();
        const authHeader = headersList.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const supabase = createServerClient();
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user && (user.email === 'el@mile.app' || user.email === 'ella@mile.app')) {
                return true;
            }
        }
    } catch (e) {
        console.error('Error verifying auth via header:', e);
    }

    // 2. Fall back to checking the device token cookie
    try {
        const cookieStore = await cookies();
        const deviceToken = cookieStore.get('mile_device_token')?.value;

        if (!deviceToken) {
            return false;
        }

        const supabase = createServerClient();
        const { data: { users }, error } = await supabase.auth.admin.listUsers();

        if (error || !users) {
            return false;
        }

        let isAuthorized = false;
        for (const user of users) {
            const tokens = user.user_metadata?.device_tokens || [];
            for (const token of tokens) {
                if (secureCompare(token, deviceToken)) {
                    isAuthorized = true;
                }
            }
        }

        return isAuthorized;
    } catch (e) {
        console.error('Error verifying auth via cookie:', e);
        return false;
    }
}
