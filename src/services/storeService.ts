import { supabase as defaultSupabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'skipped';
export type TaskCategory = 'work' | 'home' | 'personal';

export interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

export interface Task {
    id: string;
    text: string;
    status: TaskStatus;
    category: TaskCategory;
    priority?: 'low' | 'medium' | 'high';
    estimated_time: number;
    actual_time: number;
    objective_id?: string;
    due_date?: string;
    updated_at?: string;
    actions?: ChecklistItem[];
    validations?: ChecklistItem[];
    detail?: string;
}

export interface Objective {
    id: string;
    title: string;
    author: string;
    last_active: string;
    created_at: string;
    is_complete?: boolean;
}

export interface Allocation {
    id: string;
    amount: number;
    description: string;
    category: string;
    date: string;
}

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
    lastPulseAt?: string;
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
    tasks: Task[];
    objectives: Objective[];
    wishlist: {
        id: string;
        category: 'plan' | 'antojo' | 'gusto';
        title: string;
        price: number;
        isPriority: boolean;
        description: string;
        status: "to-visit" | "visited";
        locationUrl?: string;
        owner?: string;
        author: string;
    }[];
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
            const [eventsRes, notesRes, commitmentsRes, victoriesRes, settingsRes, playlistRes, commentsRes, listeningRes, tasksRes, wishlistRes, objectivesRes] = await Promise.all([
                supabase.from('events').select('*').order('date', { ascending: false }),
                supabase.from('notes').select('*').order('created_at', { ascending: false }),
                supabase.from('commitments').select('*').order('created_at', { ascending: true }),
                supabase.from('victories').select('*').order('created_at', { ascending: false }),
                supabase.from('app_settings').select('*').eq('id', 1).single(),
                supabase.from('audio_track').select('*').order('display_order', { ascending: true }),
                supabase.from('audio_comments').select('*').order('created_at', { ascending: true }),
                supabase.from('persistent_listening').select('*').order('date', { ascending: false }),
                supabase.from('tasks').select('*').order('created_at', { ascending: false }),
                supabase.from('wishlist').select('*').order('created_at', { ascending: false }),
                supabase.from('objectives').select('*').order('created_at', { ascending: true })
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

            const allVictories = victoriesRes.data || [];

            return {
                wishlist: (wishlistRes.data || []).map(w => ({ id: w.id, category: w.category, title: w.title, description: w.description, status: w.status, author: w.author || "el", owner: w.owner || undefined, locationUrl: w.location_url, price: w.price || 0, isPriority: w.is_priority || false })),
                tasks: (tasksRes.data || []).map((t) => ({
                    id: t.id,
                    text: t.text || t.title,
                    status: t.status === 'pending' ? 'todo' : (t.status === 'skipped' ? 'skipped' : (t.status === 'done' ? 'done' : (t.status === 'in_progress' ? 'in_progress' : 'todo'))),
                    category: t.category || 'work',
                    priority: t.priority || undefined,
                    estimated_time: t.estimated_time || 0,
                    actual_time: t.actual_time || 0,
                    objective_id: t.objective_id,
                    due_date: t.due_date,
                    updated_at: t.updated_at,
                    actions: t.actions || [],
                    validations: t.validations || [],
                    detail: t.detail || undefined,
                })),
                objectives: (objectivesRes.data || []).map(o => ({
                    id: o.id,
                    title: o.title,
                    author: o.author,
                    last_active: o.last_active,
                    created_at: o.created_at,
                    is_complete: o.is_complete || false,
                })),
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
                commitments: finalCommitments.map((c: any) => ({
                    id: c.id,
                    text: c.text,
                    completed: !c.is_active,
                    author: c.author || 'el'
                })),
                victoriesEl: allVictories.filter((v: any) => v.author === 'el'),
                victoriesElla: allVictories.filter((v: any) => v.author === 'ella'),
                audioStats: {
                    daysTracking: trackingDays,
                    lastUpdate: formattedDate
                },
                audioPlaylist, lastPulseAt: settings.last_pulse_at,
                dailyProgress: {
                    yesterdayTotal: finalCommitments.length,
                    yesterdayCompleted: yesterdayTracking ? yesterdayTracking.completed_count : 0,
                    todayTotal: finalCommitments.length,
                    todayCompleted: todayTracking ? todayTracking.completed_count : 0
                },
                persistentListening: (listeningRes.data || []).map((l: any) => ({
                    id: l.id,
                    topic: l.topic,
                    reflection: l.reflection,
                    date: l.date,
                    author: l.author || 'el'
                }))
            };
        } catch (error) {
            console.error('Failed to fetch from Supabase', error);
            throw new Error('Could not read from data store.');
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
                    // Check if item.id is a UUID (Supabase generated) or a temporary numeric ID (Date.now())
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);

                    if (item.id && isUuid && existingIds.has(item.id)) {
                        toUpsert.push(item);
                    } else {
                        const { id, ...rest } = item;
                        // If it's a temp ID, we don't send it to Supabase so it generates a new UUID
                        toInsert.push(rest);
                    }
                }

                const incomingIds = incomingItems.filter(i => i.id).map(i => i.id);
                const toDelete = (existing || []).filter(r => !incomingIds.includes(r.id)).map(r => r.id);

                if (toDelete.length > 0) await supabase.from(tableName).delete().in('id', toDelete);
                if (toUpsert.length > 0) await supabase.from(tableName).upsert(toUpsert);
                if (toInsert.length > 0) await supabase.from(tableName).insert(toInsert);
            };

            // Wishlist
            if (newData.wishlist !== undefined) {
                await syncTable('wishlist', newData.wishlist.map(w => ({
                    id: w.id,
                    category: w.category,
                    title: w.title,
                    description: w.description,
                    status: w.status,
                    location_url: w.locationUrl, price: w.price, is_priority: w.isPriority,
                    author: w.author || "el", owner: w.owner || undefined
                })));
            }

            // Tasks
            if (newData.tasks !== undefined) {
                await syncTable('tasks', newData.tasks.map((t) => ({
                    id: t.id,
                    title: t.text,
                    text: t.text,
                    status: t.status === 'todo' ? 'pending' : t.status,
                    category: t.category,
                    priority: t.priority || null,
                    estimated_time: t.estimated_time,
                    actual_time: t.actual_time,
                    objective_id: (t as any).objectiveId || (t as any).objective_id || null,
                    due_date: t.due_date,
                    actions: t.actions || [],
                    validations: t.validations || [],
                    detail: t.detail || null,
                    updated_at: new Date().toISOString()
                })));
            }

            // Objectives
            if (newData.objectives !== undefined) {
                await syncTable('objectives', newData.objectives.map(o => ({
                    id: o.id,
                    title: o.title,
                    author: o.author || 'el',
                    is_complete: o.is_complete || false,
                    last_active: o.last_active || new Date().toISOString(),
                    created_at: o.created_at || new Date().toISOString()
                })));
            }

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
                await syncTable('notes', newData.notes.map(n => ({
                    id: n.id,
                    text: n.text,
                    author: n.author || 'el'
                })));
            }

            // Commitments
            if (newData.commitments !== undefined) {
                await syncTable('commitments', newData.commitments.map(c => ({
                    id: c.id,
                    text: c.text,
                    is_active: !c.completed,
                    author: c.author || 'el'
                })));

                // Update tracking
                const todayCompleted = newData.commitments.filter(c => c.completed).length;
                const timeZoneOffset = (new Date()).getTimezoneOffset() * 60000;
                const todayStr = new Date(Date.now() - timeZoneOffset).toISOString().split('T')[0];
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
                            spotify_url: track.spotifyUrl || track.spotify_url || null,
                            display_order: track.display_order || 0
                        }).eq('id', trackId);
                    } else {
                        const res = await supabase.from('audio_track').insert({
                            title: track.title,
                            artist: track.artist,
                            spotify_url: track.spotifyUrl || track.spotify_url || null,
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
            if (newData.lastPulseAt !== undefined) {
                await supabase.from("app_settings").update({ last_pulse_at: newData.lastPulseAt }).eq("id", 1);
            }

            await supabase.from('app_settings').update({ last_update: new Date().toISOString() }).eq('id', 1);

        } catch (error) {
            console.error('Failed to update Supabase', error);
            throw new Error('Could not write to data store.');
        }
    },

    async updateTaskActualTime(taskId: string, additionalMinutes: number, supabase: SupabaseClient = defaultSupabase): Promise<void> {
        const { data: task } = await supabase.from('tasks').select('actual_time').eq('id', taskId).single();
        if (task) {
            await supabase.from('tasks').update({
                actual_time: (task.actual_time || 0) + additionalMinutes,
                updated_at: new Date().toISOString()
            }).eq('id', taskId);
        }
    },

    async updateTaskStatus(taskId: string, status: 'todo' | 'in_progress' | 'done', supabase: SupabaseClient = defaultSupabase): Promise<void> {
        const dbStatus = status === 'todo' ? 'pending' : status;
        await supabase.from('tasks').update({
            status: dbStatus,
            updated_at: new Date().toISOString()
        }).eq('id', taskId);
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
