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
    assignee?: 'el' | 'ella';
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

export type WishlistState = 'DISCOVERED' | 'SAVING' | 'READY_TO_DEPLOY' | 'COMPLETED' | 'ARCHIVED';
export type GoalCategory = 'Food' | 'Travel' | 'Gaming' | 'Tech' | 'Experiences' | 'Home';
export type ReactionType = 'LIKE' | 'PRIORITY' | 'WANT_THIS_WITH_YOU';

export const isMapLink = (url?: string | null) =>
    Boolean(url && (url.includes('google.com/maps') || url.includes('maps.google.com') || url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps') || url.includes('share.google')));

export interface WishlistContribution {
    id: string;
    wishlistItemId: string;
    contributor: string;
    amount: number;
    note?: string;
    createdAt: string;
}

export interface WishlistReaction {
    id: string;
    wishlistItemId: string;
    reactor: string;
    type: ReactionType;
}

export interface WishlistActivity {
    id: string;
    wishlistItemId?: string;
    actor: string;
    action: string;
    detail?: string;
    createdAt: string;
}

export interface WishlistItem {
    id: string;
    category: string;
    title: string;
    description: string;
    price: number;
    savedAmount: number;
    isPriority: boolean;
    state: WishlistState;
    goalCategory: GoalCategory;
    imageUrl?: string;
    externalLink?: string;
    locationUrl?: string;
    shared: boolean;
    owner?: string;
    author: string;
    reactions: WishlistReaction[];
    contributions: WishlistContribution[];
    createdAt?: string;
}

export type HealthHabitType = 'junk_food' | 'snacks' | 'delivery' | 'impulse_spending';

export interface HealthHabit {
    id: string;
    profile: string;
    date: string;
    habitType: HealthHabitType;
    cost: number;
    severity: 'low' | 'medium' | 'high';
    note?: string;
    createdAt: string;
}

export interface Victory {
    id: string;
    text: string;
    author: string;
    created_at?: string;
    createdAt?: string;
}


export interface EventComment {
    id: string;
    eventId: string;
    author: 'el' | 'ella';
    text: string;
    createdAt: string;
}

export interface AppData {
    events: {
        id: string;
        title: string;
        date: string;
        description: string;
        imageUrl?: string;
        author?: string;
        tags?: string[];
        reactions?: Record<string, string[]>;
        comments?: EventComment[];
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
    victoriesEl: Victory[];
    victoriesElla: Victory[];
    lastPulseAt?: string;

    dailyProgress?: {
        yesterdayTotal: number;
        yesterdayCompleted: number;
        todayTotal: number;
        todayCompleted: number;
    };
    tasks: Task[];
    objectives: Objective[];
    wishlist: WishlistItem[];
    wishlistActivity: WishlistActivity[];
    healthHabits: HealthHabit[];
    persistentListening: {
        id: string;
        topic: string;
        reflection: string;
        date: string;
        author: string;
    }[];
    allocations: Allocation[];
}

// Data Access Abstraction - Now using Supabase
export const StoreService = {
    async getStore(supabase: SupabaseClient = defaultSupabase, tables: string[] | null = null): Promise<AppData> {
        try {
            const shouldFetch = (name: string) => !tables || tables.includes(name);

            // Fetch table promises dynamically
            const eventsPromise = shouldFetch('events') 
                ? supabase.from('events').select('*').order('date', { ascending: false }) 
                : Promise.resolve({ data: null });
            
            const notesPromise = shouldFetch('notes')
                ? supabase.from('notes').select('*').order('created_at', { ascending: false })
                : Promise.resolve({ data: null });

            const commitmentsPromise = shouldFetch('commitments')
                ? supabase.from('commitments').select('*').order('created_at', { ascending: true })
                : Promise.resolve({ data: null });

            const victoriesPromise = shouldFetch('victories')
                ? supabase.from('victories').select('*').order('created_at', { ascending: false })
                : Promise.resolve({ data: null });

            const settingsPromise = shouldFetch('app_settings')
                ? supabase.from('app_settings').select('*').eq('id', 1).single()
                : Promise.resolve({ data: null });



            const listeningPromise = shouldFetch('persistent_listening')
                ? supabase.from('persistent_listening').select('*').order('date', { ascending: false })
                : Promise.resolve({ data: null });

            const tasksPromise = shouldFetch('tasks')
                ? supabase.from('tasks').select('*').order('created_at', { ascending: false })
                : Promise.resolve({ data: null });

            const wishlistPromise = shouldFetch('wishlist')
                ? supabase.from('wishlist').select('*').order('created_at', { ascending: false })
                : Promise.resolve({ data: null });

            const objectivesPromise = shouldFetch('objectives')
                ? supabase.from('objectives').select('*').order('created_at', { ascending: true })
                : Promise.resolve({ data: null });

            const contribPromise = shouldFetch('wishlist_contributions')
                ? supabase.from('wishlist_contributions').select('*').order('created_at', { ascending: false })
                : Promise.resolve({ data: null });

            const reactionsPromise = shouldFetch('wishlist_reactions')
                ? supabase.from('wishlist_reactions').select('*')
                : Promise.resolve({ data: null });

            const activityPromise = shouldFetch('wishlist_activity')
                ? supabase.from('wishlist_activity').select('*').order('created_at', { ascending: false }).limit(50)
                : Promise.resolve({ data: null });

            const habitsPromise = shouldFetch('health_habits')
                ? supabase.from('health_habits').select('*').order('created_at', { ascending: false })
                : Promise.resolve({ data: null });

            const allocationsPromise = shouldFetch('allocations')
                ? supabase.from('allocations').select('*').order('created_at', { ascending: false })
                : Promise.resolve({ data: null });

            const eventCommentsPromise = shouldFetch('event_comments')
                ? supabase.from('event_comments').select('*').order('created_at', { ascending: true })
                : Promise.resolve({ data: null });

            // Daily Tracking Logic setup
            const timeZoneOffset = (new Date()).getTimezoneOffset() * 60000;
            const localDate = new Date(Date.now() - timeZoneOffset);
            const todayStr = localDate.toISOString().split('T')[0];
            const yesterdayDate = new Date(localDate.getTime() - 24 * 60 * 60 * 1000);
            const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

            // ⚡ Bolt Optimization: Move daily_tracking query into the main Promise.all to prevent a waterfall request
            const trackingPromise = shouldFetch('daily_tracking')
                ? supabase.from('daily_tracking').select('*').in('date', [todayStr, yesterdayStr])
                : Promise.resolve({ data: null });

            const [
                eventsRes, notesRes, commitmentsRes, victoriesRes, settingsRes,
                listeningRes, tasksRes, wishlistRes,
                objectivesRes, contribRes, reactionsRes, activityRes, habitsRes,
                allocationsRes, eventCommentsRes, trackingRes
            ] = await Promise.all([
                eventsPromise, notesPromise, commitmentsPromise, victoriesPromise, settingsPromise,
                listeningPromise, tasksPromise, wishlistPromise,
                objectivesPromise, contribPromise, reactionsPromise, activityPromise, habitsPromise,
                allocationsPromise, eventCommentsPromise, trackingPromise
            ]);

            const settings = settingsRes?.data || { connection_date: new Date().toISOString(), last_update: new Date().toISOString() };
            const trackingDays = Math.floor((new Date().getTime() - new Date(settings.connection_date).getTime()) / (1000 * 60 * 60 * 24));



            const formattedDate = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(settings.last_update));

            const finalCommitments = commitmentsRes?.data || [];

            const trackingData: any[] = trackingRes?.data || [];

            // ⚡ Bolt Optimization: Replace O(N) array finds with a single O(N) pass mapping by date
            const trackingByDate: Record<string, typeof trackingData[0]> = {};
            for (const t of trackingData) {
                trackingByDate[t.date] = t;
            }
            const todayTracking = trackingByDate[todayStr];
            const yesterdayTracking = trackingByDate[yesterdayStr];

            const allVictories = victoriesRes?.data || [];

            const allContributions = (contribRes?.data || []) as any[];
            // ⚡ Bolt Optimization: Replace reduce with a direct O(N) loop to minimize callbacks and array copies
            const contribsByWishlistId: Record<string, any[]> = {};
            for (const c of allContributions) {
                (contribsByWishlistId[c.wishlist_item_id] ??= []).push(c);
            }

            const allReactions = (reactionsRes?.data || []) as any[];
            // ⚡ Bolt Optimization: Replace reduce with a direct O(N) loop to minimize callbacks and array copies
            const reactionsByWishlistId: Record<string, any[]> = {};
            for (const r of allReactions) {
                (reactionsByWishlistId[r.wishlist_item_id] ??= []).push(r);
            }



            const result: any = {};

            if (shouldFetch('wishlist')) {
                result.wishlist = (wishlistRes?.data || []).map(w => {
                    const itemContribs = contribsByWishlistId[w.id] || [];
                    const itemReactions = reactionsByWishlistId[w.id] || [];
                    return {
                        id: w.id,
                        category: w.category || 'antojo',
                        title: w.title,
                        description: w.description || '',
                        state: w.state || 'DISCOVERED',
                        author: w.author || 'el',
                        owner: w.owner || undefined,
                        locationUrl: w.location_url || (isMapLink(w.external_link) ? w.external_link : undefined),
                        externalLink: isMapLink(w.external_link) && !w.location_url ? undefined : (w.external_link || undefined),
                        imageUrl: w.image_url || undefined,
                        price: w.price || 0,
                        savedAmount: w.saved_amount || 0,
                        isPriority: w.is_priority || false,
                        goalCategory: w.goal_category || 'Experiences',
                        shared: w.shared || false,
                        reactions: itemReactions.map((r: any) => ({ id: r.id, wishlistItemId: r.wishlist_item_id, reactor: r.reactor, type: r.type })),
                        contributions: itemContribs.map((c: any) => ({ id: c.id, wishlistItemId: c.wishlist_item_id, contributor: c.contributor, amount: c.amount, note: c.note, createdAt: c.created_at })),
                        createdAt: w.created_at || undefined,
                    } as WishlistItem;
                });
            }

            if (shouldFetch('wishlist_activity')) {
                result.wishlistActivity = (activityRes?.data || []).map((a: any) => ({ id: a.id, wishlistItemId: a.wishlist_item_id, actor: a.actor, action: a.action, detail: a.detail, createdAt: a.created_at }));
            }

            if (shouldFetch('health_habits')) {
                result.healthHabits = (habitsRes?.data || []).map((h: any) => ({
                    id: h.id,
                    profile: h.profile,
                    date: h.date,
                    habitType: h.habit_type as HealthHabitType,
                    cost: h.cost,
                    severity: h.severity,
                    note: h.note,
                    createdAt: h.created_at
                }));
            }

            if (shouldFetch('tasks')) {
                result.tasks = (tasksRes?.data || []).map((t) => ({
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
                    assignee: t.assignee || undefined,
                }));
            }

            if (shouldFetch('objectives')) {
                result.objectives = (objectivesRes?.data || []).map(o => ({
                    id: o.id,
                    title: o.title,
                    author: o.author,
                    last_active: o.last_active,
                    created_at: o.created_at,
                    is_complete: o.is_complete || false,
                }));
            }

            if (shouldFetch('events')) {
                const rawEvents = eventsRes?.data || [];

                // ⚡ Bolt Optimization: Replace reduce with a direct O(N) loop to minimize callbacks and array copies
                const commentsByEventId: Record<string, any[]> = {};
                const eventCommentsData = eventCommentsRes?.data || [];
                for (const c of eventCommentsData) {
                    (commentsByEventId[c.event_id] ??= []).push({
                        id: c.id,
                        eventId: c.event_id,
                        author: c.author,
                        text: c.text,
                        createdAt: c.created_at
                    });
                }

                result.events = rawEvents.map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    date: e.date,
                    description: e.description,
                    imageUrl: e.image_url,
                    author: e.author || 'el',
                    tags: e.tags || [],
                    reactions: e.reactions || {},
                    comments: commentsByEventId[e.id] || []
                }));
            }

            if (shouldFetch('notes')) {
                result.notes = (notesRes?.data || []).map((n: any) => ({
                    id: n.id,
                    text: n.text,
                    author: n.author || 'el'
                }));
            }

            if (shouldFetch('commitments')) {
                result.commitments = finalCommitments.map((c: any) => ({
                    id: c.id,
                    text: c.text,
                    completed: !c.is_active,
                    author: c.author || 'el'
                }));
                result.dailyProgress = {
                    yesterdayTotal: finalCommitments.length,
                    yesterdayCompleted: yesterdayTracking ? yesterdayTracking.completed_count : 0,
                    todayTotal: finalCommitments.length,
                    todayCompleted: todayTracking ? todayTracking.completed_count : 0
                };
            }

            if (shouldFetch('victories')) {
                // ⚡ Bolt Optimization: Replace double filter().map() with a single O(N) pass to reduce intermediate arrays
                result.victoriesEl = [];
                result.victoriesElla = [];
                for (const v of allVictories) {
                    if (v.author === 'el') {
                        result.victoriesEl.push({
                            id: v.id,
                            text: v.text,
                            author: v.author,
                            created_at: v.created_at || v.createdAt,
                            createdAt: v.created_at || v.createdAt
                        });
                    } else if (v.author === 'ella') {
                        result.victoriesElla.push({
                            id: v.id,
                            text: v.text,
                            author: v.author,
                            created_at: v.created_at || v.createdAt,
                            createdAt: v.created_at || v.createdAt
                        });
                    }
                }
            }

            if (shouldFetch('app_settings')) {
                result.lastPulseAt = settings.last_pulse_at;
            }

            if (shouldFetch('persistent_listening')) {
                result.persistentListening = (listeningRes?.data || []).map((l: any) => ({
                    id: l.id,
                    topic: l.topic,
                    reflection: l.reflection,
                    date: l.date,
                    author: l.author || 'el'
                }));
            }

            if (shouldFetch('allocations')) {
                result.allocations = (allocationsRes?.data || []).map((a: any) => ({
                    id: a.id,
                    amount: a.amount,
                    description: a.description,
                    category: a.category,
                    date: a.date,
                    profile: a.profile
                }));
            }



            return result as AppData;
        } catch (error) {
            console.error('Failed to fetch from Supabase', error);
            throw new Error('Could not read from data store.');
        }
    },

    async updateStore(newData: Partial<AppData>, supabase: SupabaseClient = defaultSupabase): Promise<void> {
        try {
            // Cache for fetched table data to avoid duplicate fetches
            const tableCache = new Map<string, Record<string, unknown>[]>();

            // Helper for Upsert/Delete pattern
            const syncTable = async (tableName: string, incomingItems: any[], filter: any = {}) => {
                if (!incomingItems) return;

                let existingRecords: Record<string, unknown>[] = [];
                if (tableCache.has(tableName)) {
                    existingRecords = tableCache.get(tableName)!;
                } else {
                    const cols = new Set(['id']);
                    if (filter) {
                        Object.keys(filter).forEach(k => cols.add(k));
                    }
                    if (tableName === 'persistent_listening') {
                        cols.add('topic');
                    }
                    const { data } = await supabase.from(tableName).select(Array.from(cols).join(', '));
                    existingRecords = (data || []) as unknown as Record<string, unknown>[];
                    tableCache.set(tableName, existingRecords);
                }

                // ⚡ Bolt Optimization: Replace chained filter().map() with single O(N) pass, preserving original types
                let existing = existingRecords;
                const existingIds = new Set();

                const filterKeys = filter ? Object.keys(filter) : [];
                if (filterKeys.length > 0) {
                    existing = [];
                    for (const item of existingRecords) {
                        let match = true;
                        for (const key of filterKeys) {
                            if (item[key] !== filter[key]) {
                                match = false;
                                break;
                            }
                        }
                        if (match) {
                            existing.push(item);
                            existingIds.add(item.id);
                        }
                    }
                } else {
                    for (const item of existingRecords) {
                        existingIds.add(item.id);
                    }
                }

                const toUpsert: any[] = [];
                const toInsert: any[] = [];

                const incomingIds = new Set<string>();
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

                for (const item of incomingItems) {
                    if (item.id) {
                        incomingIds.add(item.id);
                    }

                    // Check if item.id is a UUID (Supabase generated) or a temporary numeric ID (Date.now())
                    const isUuid = item.id && uuidRegex.test(item.id);

                    if (item.id && isUuid) {
                        if (existingIds.has(item.id)) {
                            toUpsert.push(item);
                        } else {
                            toInsert.push(item);
                        }
                    } else {
                        const { id, ...rest } = item;
                        // If it's a temp ID, we don't send it to Supabase so it generates a new UUID
                        toInsert.push(rest);
                    }
                }

                const toDelete: string[] = [];
                for (const r of (existing || [])) {
                    if (!incomingIds.has(r.id as string)) {
                        toDelete.push(r.id as string);
                    }
                }

                const ops: PromiseLike<unknown>[] = [];
                if (toDelete.length > 0) ops.push(supabase.from(tableName).delete().in('id', toDelete));
                if (toUpsert.length > 0) ops.push(supabase.from(tableName).upsert(toUpsert));
                if (toInsert.length > 0) ops.push(supabase.from(tableName).insert(toInsert));
                await Promise.all(ops);
            };

            const syncPromises: Promise<void>[] = [];

            // Wishlist
            if (newData.wishlist !== undefined) {
                syncPromises.push(syncTable('wishlist', newData.wishlist.map(w => ({
                    id: w.id,
                    category: w.category,
                    title: w.title,
                    description: w.description,
                    state: w.state || 'DISCOVERED',
                    status: w.state === 'COMPLETED' ? 'visited' : 'to-visit',
                    location_url: w.locationUrl || null,
                    external_link: w.externalLink || null,
                    image_url: w.imageUrl || null,
                    price: w.price,
                    saved_amount: w.savedAmount || 0,
                    is_priority: w.isPriority,
                    goal_category: w.goalCategory || 'Experiences',
                    shared: w.shared || false,
                    author: w.author || 'el',
                    owner: w.owner || undefined
                }))));
            }

            // Tasks
            if (newData.tasks !== undefined) {
                syncPromises.push(syncTable('tasks', newData.tasks.map((t) => ({
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
                    assignee: t.assignee || null,
                    updated_at: new Date().toISOString()
                }))));
            }

            // Objectives
            if (newData.objectives !== undefined) {
                syncPromises.push(syncTable('objectives', newData.objectives.map(o => ({
                    id: o.id,
                    title: o.title,
                    author: o.author || 'el',
                    is_complete: o.is_complete || false,
                    last_active: o.last_active || new Date().toISOString(),
                    created_at: o.created_at || new Date().toISOString()
                }))));
            }

            // Allocations
            if (newData.allocations !== undefined) {
                syncPromises.push(syncTable('allocations', newData.allocations.map(a => ({
                    id: a.id,
                    amount: a.amount,
                    description: a.description,
                    category: a.category,
                    date: a.date,
                    profile: (a as any).profile || 'el',
                    created_at: new Date().toISOString()
                }))));
            }

            // Events
            if (newData.events !== undefined) {
                syncPromises.push(syncTable('events', newData.events.map(e => ({
                    id: e.id,
                    title: e.title,
                    date: e.date,
                    description: e.description,
                    image_url: e.imageUrl,
                    author: e.author || 'el',
                    tags: e.tags || [],
                    reactions: e.reactions || {}
                }))));
            }

            // Notes
            if (newData.notes !== undefined) {
                syncPromises.push(syncTable('notes', newData.notes.map(n => ({
                    id: n.id,
                    text: n.text,
                    author: n.author || 'el'
                }))));
            }

            // Commitments
            if (newData.commitments !== undefined) {
                syncPromises.push(syncTable('commitments', newData.commitments.map(c => ({
                    id: c.id,
                    text: c.text,
                    is_active: !c.completed,
                    author: c.author || 'el'
                }))));

                // Update tracking
                const todayCompleted = newData.commitments.filter(c => c.completed).length;
                const timeZoneOffset = (new Date()).getTimezoneOffset() * 60000;
                const todayStr = new Date(Date.now() - timeZoneOffset).toISOString().split('T')[0];
                await supabase.from('daily_tracking').upsert({ date: todayStr, completed_count: todayCompleted });
            }

            // Victories (Shared handling for El and Ella)
            const handleVictories = async (victories: Victory[], author: 'el' | 'ella') => {
                syncPromises.push(syncTable('victories', victories.map(v => ({
                    id: v.id,
                    text: v.text,
                    author
                })), { author }));
            };

            if (newData.victoriesEl !== undefined) syncPromises.push(handleVictories(newData.victoriesEl, 'el'));
            if (newData.victoriesElla !== undefined) syncPromises.push(handleVictories(newData.victoriesElla, 'ella'));



            await Promise.all(syncPromises);

            // Persistent Listening
            if (newData.persistentListening !== undefined) {
                let existingRows: Record<string, unknown>[] = [];
                if (tableCache.has('persistent_listening')) {
                    existingRows = tableCache.get('persistent_listening')!;
                } else {
                    const { data } = await supabase.from('persistent_listening').select('id, topic');
                    existingRows = (data || []) as unknown as Record<string, unknown>[];
                    tableCache.set('persistent_listening', existingRows);
                }
                const existingTopics = new Set<unknown>();
                const existingIds = new Set<unknown>();
                for (const r of existingRows) {
                    existingTopics.add(r.topic);
                    existingIds.add(r.id);
                }

                await syncTable('persistent_listening', newData.persistentListening.map(l => ({
                    id: l.id,
                    topic: l.topic,
                    reflection: l.reflection,
                    date: l.date,
                    author: l.author || 'el'
                })));

                // Notifications for new reflections
                const notificationsToInsert = [];
                for (const item of newData.persistentListening) {
                    if (!existingIds.has(item.id) && !existingTopics.has(item.topic)) {
                        notificationsToInsert.push({
                            target_profile: 'ella',
                            type: 'escucha',
                            message: `Él agregó una nueva reflexión a la Escucha Persistente: "${item.topic}".`
                        });
                    }
                }

                if (notificationsToInsert.length > 0) {
                    await supabase.from('notifications').insert(notificationsToInsert);
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

    // === PLANES MODULE: Direct DB methods ===

    // === HEALTH HABITS ===

    // === TIMELINE ===
};
