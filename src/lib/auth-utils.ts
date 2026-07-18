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

    // Verify token exists securely in the device_tokens table
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('device_tokens')
        .select('id, token')
        .eq('token', token.value)
        .single();

    if (error || !data || !secureCompare(data.token, token.value)) {
        return false;
    }

    return true;
}
