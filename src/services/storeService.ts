import { supabase as defaultSupabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export interface AppData {
    // ... same as before
    events: any[];
    notes: string[];
    commitments: any[];
    victoriesEl: any[];
    victoriesElla: any[];
    audioStats: any;
    audioPlaylist: any[];
    dailyProgress?: {
        yesterdayTotal: number;
        yesterdayCompleted: number;
        todayTotal: number;
        todayCompleted: number;
    };
}

// Data Access Abstraction - Now using Supabase
export const StoreService = {
    async getStore(supabase: SupabaseClient = defaultSupabase): Promise<AppData> {
        try {
            const [eventsRes, notesRes, commitmentsRes, victoriesRes, settingsRes, playlistRes, commentsRes] = await Promise.all([
                supabase.from('events').select('*').order('date', { ascending: false }),
                supabase.from('notes').select('text').order('created_at', { ascending: false }),
                supabase.from('commitments').select('*').order('created_at', { ascending: true }),
                supabase.from('victories').select('*').order('created_at', { ascending: false }),
                supabase.from('app_settings').select('*').eq('id', 1).single(),
                supabase.from('audio_track').select('*').order('display_order', { ascending: true }),
                supabase.from('audio_comments').select('*').order('created_at', { ascending: true })
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
                completed: c.is_active === false
            }));

            const allVictories = victoriesRes.data || [];

            return {
                events: (eventsRes.data || []).map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    date: e.date,
                    description: e.description,
                    imageUrl: e.image_url
                })),
                notes: (notesRes.data || []).map((n: any) => n.text),
                commitments: mappedCommitments,
                victoriesEl: allVictories.filter((v: any) => v.author === 'el'),
                victoriesElla: allVictories.filter((v: any) => v.author === 'ella'),
                audioStats: {
                    daysTracking: trackingDays >= 0 ? trackingDays : 0,
                    lastUpdate: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
                },
                audioPlaylist,
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
            // Events
            if (newData.events !== undefined) {
                await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                if (newData.events.length > 0) {
                    await supabase.from('events').insert(newData.events.map(e => ({
                        title: e.title,
                        date: e.date,
                        description: e.description,
                        image_url: e.imageUrl
                    })));
                }
            }
            // ...
            // (I will use multi_replace for accuracy, but for now just one)

            // Notes
            if (newData.notes !== undefined) {
                const { data: existing } = await supabase.from('notes').select('text');
                const existingTexts = new Set((existing || []).map((r: any) => r.text));

                await supabase.from('notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                if (newData.notes.length > 0) {
                    await supabase.from('notes').insert(newData.notes.map(text => ({ text })));

                    // Check for new notes to notify Ella
                    const newNotes = newData.notes.filter(t => !existingTexts.has(t));
                    if (newNotes.length > 0) {
                        await supabase.from('notifications').insert({
                            target_profile: 'ella',
                            type: 'new_note',
                            message: `Él agregó ${newNotes.length} nueva(s) nota(s) al tarro.`
                        });
                    }
                }
            }

            // Commitments
            if (newData.commitments !== undefined) {
                const { data: existingRows } = await supabase.from('commitments').select('id');
                const existingIds = new Set((existingRows || []).map((r: any) => r.id));

                const toUpsert: any[] = [];
                const toInsert: any[] = [];

                for (const c of newData.commitments) {
                    if (existingIds.has(c.id)) {
                        toUpsert.push({ id: c.id, text: c.text, is_active: !c.completed });
                    } else {
                        toInsert.push({ text: c.text, is_active: true });
                    }
                }

                const incomingIds = newData.commitments.map((c: any) => c.id);
                const toDelete = (existingRows || []).filter((r: any) => !incomingIds.includes(r.id)).map((r: any) => r.id);

                if (toDelete.length > 0) await supabase.from('commitments').delete().in('id', toDelete);
                if (toUpsert.length > 0) await supabase.from('commitments').upsert(toUpsert);
                if (toInsert.length > 0) await supabase.from('commitments').insert(toInsert);

                // Update Progress
                const todayCompleted = newData.commitments.filter((c: any) => c.completed).length;
                const todayStr = new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000).toISOString().split('T')[0];
                await supabase.from('daily_tracking').upsert({ date: todayStr, completed_count: todayCompleted });
            }

            // Victories (Shared handling for El and Ella)
            const handleVictories = async (victories: any[], author: 'el' | 'ella') => {
                const { data: existing } = await supabase.from('victories').select('id').eq('author', author);
                const existingIds = new Set((existing || []).map((r: any) => r.id));

                const toUpsert: any[] = [];
                const toInsert: any[] = [];

                for (const v of victories) {
                    const isObj = typeof v === 'object' && v !== null;
                    const id = isObj ? v.id : null;
                    const text = isObj ? v.text : v;

                    if (id && existingIds.has(id)) {
                        toUpsert.push({ id, text, author });
                    } else {
                        toInsert.push({ text, author });
                    }
                }

                const incomingIds = victories.map((v: any) => v.id);
                const toDelete = (existing || []).filter((r: any) => !incomingIds.includes(r.id)).map((r: any) => r.id);

                if (toDelete.length > 0) await supabase.from('victories').delete().in('id', toDelete);
                if (toUpsert.length > 0) await supabase.from('victories').upsert(toUpsert);
                if (toInsert.length > 0) await supabase.from('victories').insert(toInsert);
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
    }
};
