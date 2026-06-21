import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase';

export async function verifyAuth() {
    const cookieStore = await cookies();
    const deviceToken = cookieStore.get('mile_device_token')?.value;

    if (!deviceToken) {
        return false;
    }

    const supabase = createServerClient();

    try {
        const { data: { users }, error } = await supabase.auth.admin.listUsers();

        if (error || !users) {
            return false;
        }

        for (const user of users) {
            const tokens = user.user_metadata?.device_tokens || [];
            if (tokens.includes(deviceToken)) {
                return true;
            }
        }

        return false;
    } catch (e) {
        console.error('Error verifying auth:', e);
        return false;
    }
}
