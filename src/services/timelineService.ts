import { supabase as defaultSupabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export const TimelineService = {


    async uploadTimelineImage(file: File, supabase: SupabaseClient = defaultSupabase): Promise<string> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('timeline')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('timeline')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Failed to upload image', error);
            throw new Error('Could not upload image.');
        }
    },


    // === TIMELINE ===

    async addEventComment(
        comment: { eventId: string; author: 'el' | 'ella'; text: string },
        supabase: SupabaseClient = defaultSupabase
    ): Promise<void> {
        const { error } = await supabase.from('event_comments').insert({
            event_id: comment.eventId,
            author: comment.author,
            text: comment.text
        });
        if (error) throw error;
    },


    async deleteEventComment(id: string, supabase: SupabaseClient = defaultSupabase): Promise<void> {
        const { error } = await supabase.from('event_comments').delete().eq('id', id);
        if (error) throw error;
    },


    async reactToEvent(
        id: string,
        reactions: Record<string, string[]>,
        supabase: SupabaseClient = defaultSupabase
    ): Promise<void> {
        const { error } = await supabase
            .from('events')
            .update({ reactions })
            .eq('id', id);
        if (error) throw error;
    }
};
