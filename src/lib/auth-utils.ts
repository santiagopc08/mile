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

    // Verify token exists securely in the device_tokens table
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('device_tokens')
        .select('id')
        .eq('token', token.value)
        .single();

    if (error || !data) {
        return false;
    }

    return true;
}
