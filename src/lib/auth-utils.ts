import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase';
import crypto from 'crypto';

function secureCompare(a: string, b: string): boolean {
    const hashA = crypto.createHash('sha256').update(a).digest();
    const hashB = crypto.createHash('sha256').update(b).digest();
    return crypto.timingSafeEqual(hashA, hashB);
}

export async function verifyServerSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('mile_device_token');

    if (!token) {
        return false;
    }

    // Quick validation format if UUID is expected
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token.value)) {
        return false;
    }

    // Strictly you could verify token with DB, but just checking its presence might be minimum enough for this simple app
    // We can query supabase for users having this device token
    const supabase = createServerClient();
    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error || !users || !users.users) return false;

    let isAuthorized = false;

    // Check if token exists in any user's metadata in constant time
    for (const user of users.users) {
        const tokens = user.user_metadata?.device_tokens || [];
        for (const userToken of tokens) {
            if (secureCompare(userToken, token.value)) {
                isAuthorized = true;
            }
        }
    }

    return isAuthorized;
}
