import { supabase as defaultSupabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export interface AppData {
    events: {
        id: string;
        title: string;
        date: string;
        description: string;
        imageUrl?: string;
        author?: string;
    }[];
    notes: {
        id: string;
        text: string;
        author: string;
    }[];
    commitments: {
        id: string;
        text: string;
        completed: boolean;
        author: string;
    }[];
    victoriesEl: any[];
    victoriesElla: any[];
    audioStats: {
        daysTracking: number;
        lastUpdate: string;
    };
    audioPlaylist: any[];
    dailyProgress?: {
        yesterdayTotal: number;
        yesterdayCompleted: number;
        todayTotal: number;
        todayCompleted: number;
    };
    persistentListening: {
        id: string;
        topic: string;
        reflection: string;
        date: string;
        author: string;
    }[];
}

// Data Access Abstraction - Now using Supabase
export const StoreService = {
    async getStore(supabase: SupabaseClient = defaultSupabase): Promise<AppData> {
        try {
            const [eventsRes, notesRes, commitmentsRes, victoriesRes, settingsRes, playlistRes, commentsRes, listeningRes] = await Promise.all([
                supabase.from('events').select('*').order('date', { ascending: false }),
                supabase.from('notes').select('*').order('created_at', { ascending: false }),
                supabase.from('commitments').select('*').order('created_at', { ascending: true }),
                supabase.from('victories').select('*').order('created_at', { ascending: false }),
                supabase.from('app_settings').select('*').eq('id', 1).single(),
                supabase.from('audio_track').select('*').order('display_order', { ascending: true }),
                supabase.from('audio_comments').select('*').order('created_at', { ascending: true }),
                supabase.from('persistent_listening').select('*').order('date', { ascending: false })
            ]);

            const settings = settingsRes.data || { connection_date: new Date().toISOString(), last_update: new Date().toISOString() };
            const trackingDays = Math.floor((new Date().getTime() - new Date(settings.connection_date).getTime()) / (1000 * 60 * 60 * 24));

            const rawPlaylist = playlistRes.data || [];
            const audioPlaylist = rawPlaylist.map(track => ({
                ...track,
                spotifyUrl: track.spotify_url || null,
                comments: (commentsRes.data || []).filter((c: any) => c.track_id === track.id)
            }));

            const formattedDate = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(settings.last_update));

            let finalCommitments = commitmentsRes.data || [];

            // Daily Tracking Logic
            const timeZoneOffset = (new Date()).getTimezoneOffset() * 60000;
            const localDate = new Date(Date.now() - timeZoneOffset);
            const todayStr = localDate.toISOString().split('T')[0];

            const yesterdayDate = new Date(localDate.getTime() - 24 * 60 * 60 * 1000);
            const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

            const trackingRes = await supabase.from('daily_tracking').select('*').in('date', [todayStr, yesterdayStr]);
            const trackingData = trackingRes.data || [];

            let todayTracking = trackingData.find((t: any) => t.date === todayStr);
            const yesterdayTracking = trackingData.find((t: any) => t.date === yesterdayStr);

            // If it's a new day, reset all commitments to uncompleted
            if (!todayTracking) {
                if (finalCommitments.length > 0) {
                    await supabase
                        .from('commitments')
                        .update({ is_active: true })
                        .in('id', finalCommitments.map((c: any) => c.id));
                    finalCommitments = finalCommitments.map(c => ({ ...c, is_active: true }));
                }

                await supabase.from('daily_tracking').insert({ date: todayStr, completed_count: 0 });
                todayTracking = { date: todayStr, completed_count: 0 };
            }

            const todayTotal = finalCommitments.length;
            const todayCompleted = finalCommitments.filter((c: any) => c.is_active === false).length;

            const yesterdayCompleted = yesterdayTracking ? yesterdayTracking.completed_count : 0;
            const yesterdayTotal = Math.max(yesterdayCompleted, todayTotal);

            const mappedCommitments = finalCommitments.map(c => ({
                id: c.id,
                text: c.text,
                completed: c.is_active === false,
                author: c.author || 'el'
            }));

            const allVictories = victoriesRes.data || [];

            return {
                events: (eventsRes.data || []).map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    date: e.date,
                    description: e.description,
                    imageUrl: e.image_url,
                    author: e.author || 'el'
                })),
                notes: (notesRes.data || []).map((n: any) => ({
                    id: n.id,
                    text: n.text,
                    author: n.author || 'el'
                })),
                commitments: mappedCommitments,
                victoriesEl: allVictories.filter((v: any) => v.author === 'el'),
                victoriesElla: allVictories.filter((v: any) => v.author === 'ella'),
                audioStats: {
                    daysTracking: trackingDays >= 0 ? trackingDays : 0,
                    lastUpdate: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
                },
                audioPlaylist,
                persistentListening: (listeningRes.data || []).map((l: any) => ({
                    id: l.id,
                    topic: l.topic,
                    reflection: l.reflection,
                    date: l.date,
                    author: l.author || 'el'
                })),
                dailyProgress: {
                    yesterdayTotal,
                    yesterdayCompleted,
                    todayTotal,
                    todayCompleted
                }
            };
        } catch (error) {
            console.error('Failed to read from Supabase', error);
            throw new Error('Could not read data store.');
        }
    },

    async updateStore(newData: Partial<AppData>, supabase: SupabaseClient = defaultSupabase): Promise<void> {
        try {
            // Helper for Upsert/Delete pattern
            const syncTable = async (tableName: string, incomingItems: any[], filter: any = {}) => {
                if (!incomingItems) return;

                const { data: existing } = await supabase.from(tableName).select('id').match(filter);
                const existingIds = new Set((existing || []).map((r: any) => r.id));

                const toUpsert: any[] = [];
                const toInsert: any[] = [];

                for (const item of incomingItems) {
                    if (item.id && existingIds.has(item.id)) {
                        toUpsert.push(item);
                    } else {
                        const { id, ...rest } = item;
                        toInsert.push(rest);
                    }
                }

                const incomingIds = incomingItems.filter(i => i.id).map(i => i.id);
                const toDelete = (existing || []).filter(r => !incomingIds.includes(r.id)).map(r => r.id);

                if (toDelete.length > 0) await supabase.from(tableName).delete().in('id', toDelete);
                if (toUpsert.length > 0) await supabase.from(tableName).upsert(toUpsert);
                if (toInsert.length > 0) await supabase.from(tableName).insert(toInsert);
            };

            // Events
            if (newData.events !== undefined) {
                await syncTable('events', newData.events.map(e => ({
                    id: e.id,
                    title: e.title,
                    date: e.date,
                    description: e.description,
                    image_url: e.imageUrl,
                    author: e.author || 'el'
                })));
            }

            // Notes
            if (newData.notes !== undefined) {
                const { data: existing } = await supabase.from('notes').select('text');
                const existingTexts = new Set((existing || []).map((r: any) => r.text));

                await syncTable('notes', newData.notes.map(n => ({
                    id: n.id,
                    text: n.text,
                    author: n.author || 'el'
                })));

                // Check for new notes to notify Ella
                const newNotes = newData.notes.filter(n => !existingTexts.has(n.text));
                if (newNotes.length > 0) {
                    await supabase.from('notifications').insert({
                        target_profile: 'ella',
                        type: 'new_note',
                        message: `Él agregó ${newNotes.length} nueva(s) nota(s) al tarro.`
                    });
                }
            }

            // Commitments
            if (newData.commitments !== undefined) {
                await syncTable('commitments', newData.commitments.map(c => ({
                    id: c.id,
                    text: c.text,
                    is_active: !c.completed,
                    author: c.author || 'el'
                })));

                // Update Progress
                const todayCompleted = newData.commitments.filter((c: any) => c.completed).length;
                const todayStr = new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000).toISOString().split('T')[0];
                await supabase.from('daily_tracking').upsert({ date: todayStr, completed_count: todayCompleted });
            }

            // Victories (Shared handling for El and Ella)
            const handleVictories = async (victories: any[], author: 'el' | 'ella') => {
                await syncTable('victories', victories.map(v => ({
                    id: typeof v === 'object' ? v.id : undefined,
                    text: typeof v === 'object' ? v.text : v,
                    author
                })), { author });
            };

            if (newData.victoriesEl !== undefined) await handleVictories(newData.victoriesEl, 'el');
            if (newData.victoriesElla !== undefined) await handleVictories(newData.victoriesElla, 'ella');

            // Audio Playlist
            if (newData.audioPlaylist !== undefined) {
                const { data: existingTracks } = await supabase.from('audio_track').select('id, title');
                const existingIds = new Set((existingTracks || []).map((r: any) => r.id));
                const existingTitles = new Set((existingTracks || []).map((r: any) => r.title));

                for (const track of newData.audioPlaylist) {
                    let trackId = track.id;
                    const isNew = !existingIds.has(trackId);

                    if (!isNew) {
                        await supabase.from('audio_track').update({
                            title: track.title,
                            artist: track.artist,
                            spotify_url: track.spotifyUrl,
                            display_order: track.display_order || 0
                        }).eq('id', trackId);
                    } else {
                        const res = await supabase.from('audio_track').insert({
                            title: track.title,
                            artist: track.artist,
                            spotify_url: track.spotifyUrl,
                            display_order: track.display_order || 0
                        }).select('id').single();
                        trackId = res.data?.id;

                        // Notify Ella if a new song was added by him
                        if (track.added_by === 'el' && !existingTitles.has(track.title)) {
                            await supabase.from('notifications').insert({
                                target_profile: 'ella',
                                type: 'new_song',
                                message: `Él agregó una nueva canción: ${track.title}`
                            });
                        }
                    }

                    if (trackId && track.comments) {
                        await supabase.from('audio_comments').delete().eq('track_id', trackId);
                        if (track.comments.length > 0) {
                            await supabase.from('audio_comments').insert(track.comments.map((c: any) => ({
                                track_id: trackId,
                                author: c.author,
                                text: c.text
                            })));
                        }
                    }
                }

                // Delete tracks not in payload
                const incomingIds = newData.audioPlaylist.map(t => t.id);
                const toDelete = (existingTracks || []).filter(r => !incomingIds.includes(r.id)).map(r => r.id);
                if (toDelete.length > 0) await supabase.from('audio_track').delete().in('id', toDelete);
            }

            // Persistent Listening
            if (newData.persistentListening !== undefined) {
                const { data: existingRows } = await supabase.from('persistent_listening').select('id, topic');
                const existingTopics = new Set((existingRows || []).map((r: any) => r.topic));

                await syncTable('persistent_listening', newData.persistentListening.map(l => ({
                    id: l.id,
                    topic: l.topic,
                    reflection: l.reflection,
                    date: l.date,
                    author: l.author || 'el'
                })));

                // Notifications for new reflections
                for (const item of newData.persistentListening) {
                    if (!existingRows?.find(r => r.id === item.id) && !existingTopics.has(item.topic)) {
                         await supabase.from('notifications').insert({
                            target_profile: 'ella',
                            type: 'escucha',
                            message: `Él agregó una nueva reflexión a la Escucha Persistente: "${item.topic}".`
                        });
                    }
                }
            }

            // Update App Settings
            await supabase.from('app_settings').update({ last_update: new Date().toISOString() }).eq('id', 1);

        } catch (error) {
            console.error('Failed to update Supabase', error);
            throw new Error('Could not write to data store.');
        }
    },

    async uploadTimelineImage(file: File, supabase: SupabaseClient = defaultSupabase): Promise<string> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
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
        await supabase.from('notifications').insert({
            target_profile: target,
            type,
            message
        });
    },

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

    async getMahjongImages(supabase: SupabaseClient = defaultSupabase): Promise<string[]> {
        // Pulls both from the existing 'events' table and the new local /img folders via API
        try {
            const [eventsRes, localRes] = await Promise.all([
                supabase.from('events').select('image_url').not('image_url', 'is', null),
                fetch('/api/mahjong-images').then(r => r.json()).catch(() => [])
            ]);

            const eventData = eventsRes.data || [];
            const eventImgs = eventData
                .map(e => e.image_url)
                .filter(url => url && typeof url === 'string' && url.trim() !== '');

            const localImgs = Array.isArray(localRes) ? localRes : [];

            return [...eventImgs, ...localImgs];
        } catch (e) {
            console.error('Failed fetching mahjong images:', e);
            return [];
        }
    }
};
