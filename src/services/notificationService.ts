import { supabase as defaultSupabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export const NotificationService = {


    async getNotifications(profile: string, supabase: SupabaseClient = defaultSupabase): Promise<any[]> {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('target_profile', profile)
            .order('created_at', { ascending: false });
        return data || [];
    },


    async markNotificationRead(id: string, supabase: SupabaseClient = defaultSupabase): Promise<void> {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
    },


    async addNotification(target: string, type: string, message: string, supabase: SupabaseClient = defaultSupabase): Promise<void> {
        const { data, error } = await supabase.from('notifications').insert({
            target_profile: target,
            type,
            message
        }).select().single();

        if (!error && typeof window !== 'undefined') {
            fetch('/api/push/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    target,
                    message,
                    type
                })
            }).catch(err => console.error('Failed to dispatch background push:', err));
        }
    }
};
