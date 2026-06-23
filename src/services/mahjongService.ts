import { supabase as defaultSupabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export const MahjongService = {


    async saveMahjongScore(
        profile: 'el' | 'ella',
        timeSeconds: number,
        layout: string,
        tileCount: number,
        supabase: SupabaseClient = defaultSupabase
    ): Promise<void> {
        try {
            await supabase.from('mahjong_scores').insert({
                profile,
                time_seconds: timeSeconds,
                layout,
                tile_count: tileCount
            });
        } catch (e) {
            console.error('Failed to save mahjong score:', e);
        }
    },


    async getMahjongLeaderboard(supabase: SupabaseClient = defaultSupabase): Promise<{ el: any[]; ella: any[] }> {
        try {
            const { data, error } = await supabase
                .from('mahjong_scores')
                .select('*')
                .order('time_seconds', { ascending: true })
                .limit(20);

            if (error || !data) return { el: [], ella: [] };

            return {
                el: data.filter(s => s.profile === 'el').slice(0, 5),
                ella: data.filter(s => s.profile === 'ella').slice(0, 5)
            };
        } catch (e) {
            console.error('Failed to fetch mahjong leaderboard:', e);
            return { el: [], ella: [] };
        }
    },


    async getMahjongImages(supabase: SupabaseClient = defaultSupabase): Promise<{ url: string, source: 'supabase' | 'local', title?: string, description?: string, date?: string }[]> {
        try {
            const [eventsRes, localRes] = await Promise.all([
                supabase.from('events').select('image_url, title, description, date').not('image_url', 'is', null),
                fetch('/api/mahjong-images').then(r => r.json()).catch(() => [])
            ]);

            const eventData = eventsRes.data || [];
            const eventImgs = eventData
                .filter(e => e.image_url && typeof e.image_url === 'string' && e.image_url.trim() !== '')
                .map(e => ({
                    url: e.image_url,
                    source: 'supabase' as const,
                    title: e.title || undefined,
                    description: e.description || undefined,
                    date: e.date || undefined
                }));

            const localImgsArray = Array.isArray(localRes) ? localRes : [];
            const localImgs = localImgsArray
                .filter(url => url && typeof url === 'string' && url.trim() !== '')
                .map(url => ({ url, source: 'local' as const }));

            return [...eventImgs, ...localImgs];
        } catch (e) {
            console.error('Failed fetching mahjong images:', e);
            return [];
        }
    }
};
