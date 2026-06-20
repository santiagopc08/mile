import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase';

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

    // Check if token exists in any user's metadata
    for (const user of users.users) {
        const tokens = user.user_metadata?.device_tokens || [];
        if (tokens.includes(token.value)) {
            return true;
        }
    }

    return false;
}
