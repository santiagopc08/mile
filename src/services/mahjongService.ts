import { supabase as defaultSupabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export const MahjongService = {


    async saveMahjongScore(
        profile: 'el' | 'ella',
        timeSeconds: number,
        layout: string,
        tileCount: number,
        highestCombo: number = 0,
        supabase: SupabaseClient = defaultSupabase
    ): Promise<void> {
        try {
            await supabase.from('mahjong_scores').insert({
                profile,
                time_seconds: timeSeconds,
                layout,
                tile_count: tileCount,
                highest_combo: highestCombo
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
                .eq('layout', 'daily')
                .order('time_seconds', { ascending: true })
                .limit(20);

            if (error || !data) return { el: [], ella: [] };

            // ⚡ Bolt Optimization: Single-pass O(N) allocation replacement for .filter().slice()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const el: any[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ella: any[] = [];
            for (const s of data) {
                if (s.profile === 'el' && el.length < 5) el.push(s);
                else if (s.profile === 'ella' && ella.length < 5) ella.push(s);
                if (el.length === 5 && ella.length === 5) break;
            }

            return { el, ella };
        } catch (e) {
            console.error('Failed to fetch mahjong leaderboard:', e);
            return { el: [], ella: [] };
        }
    },

    async getAllMahjongScores(supabase: SupabaseClient = defaultSupabase): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('mahjong_scores')
                .select('*')
                .order('created_at', { ascending: false });
            return error ? [] : (data || []);
        } catch (e) {
            console.error('Failed to fetch all mahjong scores:', e);
            return [];
        }
    },


    async getMahjongImages(supabase: SupabaseClient = defaultSupabase, signal?: AbortSignal): Promise<{ url: string, source: 'supabase' | 'local', title?: string, description?: string, date?: string }[]> {
        try {
            const query = supabase.from('events').select('image_url, title, description, date').not('image_url', 'is', null);
            if (signal) {
                query.abortSignal(signal);
            }
            const [eventsRes, localRes] = await Promise.all([
                query,
                fetch('/api/mahjong-images', { signal }).then(r => r.json()).catch(() => [])
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
    },

    // --- CO-OP GAME OPERATIONS ---

    async getActiveCoopGame(supabase: SupabaseClient = defaultSupabase): Promise<any | null> {
        try {
            const { data, error } = await supabase
                .from('coop_games')
                .select('*')
                .is('completed_at', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error('Error fetching active co-op game:', error);
                return null;
            }
            return data;
        } catch (e) {
            console.error('Failed to get active co-op game:', e);
            return null;
        }
    },

    async createCoopGame(layout: string, tiles: any[], activeTurn: 'el' | 'ella', supabase: SupabaseClient = defaultSupabase): Promise<any | null> {
        try {
            const { data, error } = await supabase
                .from('coop_games')
                .insert({
                    layout,
                    tiles,
                    dock_ids: [],
                    active_turn: activeTurn
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating co-op game:', error);
                return null;
            }
            return data;
        } catch (e) {
            console.error('Failed to create co-op game:', e);
            return null;
        }
    },

    async updateCoopGame(gameId: string, tiles: any[], dockIds: string[], activeTurn: 'el' | 'ella', lastMatchedBy?: 'el' | 'ella', supabase: SupabaseClient = defaultSupabase): Promise<void> {
        try {
            const updates: any = {
                tiles,
                dock_ids: dockIds,
                active_turn: activeTurn
            };
            if (lastMatchedBy) {
                updates.last_matched_by = lastMatchedBy;
                updates.last_matched_at = new Date().toISOString();
            }
            const { error } = await supabase
                .from('coop_games')
                .update(updates)
                .eq('id', gameId);

            if (error) {
                console.error('Error updating co-op game:', error);
            }
        } catch (e) {
            console.error('Failed to update co-op game:', e);
        }
    },

    async completeCoopGame(gameId: string, supabase: SupabaseClient = defaultSupabase): Promise<void> {
        try {
            const { error } = await supabase
                .from('coop_games')
                .update({
                    completed_at: new Date().toISOString()
                })
                .eq('id', gameId);

            if (error) {
                console.error('Error completing co-op game:', error);
            }
        } catch (e) {
            console.error('Failed to complete co-op game:', e);
        }
    },

    // --- BOTTLE MESSAGES OPERATIONS ---

    async createBottleMessage(sender: 'el' | 'ella', message: string, supabase: SupabaseClient = defaultSupabase): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('bottle_messages')
                .insert({
                    sender,
                    message
                });

            if (error) {
                console.error('Error creating bottle message:', error);
                return false;
            }
            return true;
        } catch (e) {
            console.error('Failed to create bottle message:', e);
            return false;
        }
    },

    async getPendingBottleMessage(receiver: 'el' | 'ella', supabase: SupabaseClient = defaultSupabase): Promise<any | null> {
        try {
            const sender = receiver === 'el' ? 'ella' : 'el';
            const localMidnight = new Date();
            localMidnight.setHours(0, 0, 0, 0);
            const isoMidnight = localMidnight.toISOString();

            const { data, error } = await supabase
                .from('bottle_messages')
                .select('*')
                .eq('sender', sender)
                .is('revealed_by', null)
                .gte('created_at', isoMidnight)
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error('Error fetching pending bottle message:', error);
                return null;
            }
            return data;
        } catch (e) {
            console.error('Failed to get pending bottle message:', e);
            return null;
        }
    },

    async revealBottleMessage(messageId: string, receiver: 'el' | 'ella', supabase: SupabaseClient = defaultSupabase): Promise<void> {
        try {
            const { error } = await supabase
                .from('bottle_messages')
                .update({
                    revealed_by: receiver,
                    revealed_at: new Date().toISOString()
                })
                .eq('id', messageId);

            if (error) {
                console.error('Error revealing bottle message:', error);
            }
        } catch (e) {
            console.error('Failed to reveal bottle message:', e);
        }
    },

    async hasPendingSentMessage(sender: 'el' | 'ella', supabase: SupabaseClient = defaultSupabase): Promise<boolean> {
        try {
            const localMidnight = new Date();
            localMidnight.setHours(0, 0, 0, 0);
            const isoMidnight = localMidnight.toISOString();

            const { data, error } = await supabase
                .from('bottle_messages')
                .select('id')
                .eq('sender', sender)
                .is('revealed_by', null)
                .gte('created_at', isoMidnight)
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error('Error checking pending sent message:', error);
                return false;
            }
            return !!data;
        } catch (e) {
            console.error('Failed checking pending sent message:', e);
            return false;
        }
    },

    async getTodayRevealedBottleMessage(profile: 'el' | 'ella', supabase: SupabaseClient = defaultSupabase): Promise<any | null> {
        try {
            const localMidnight = new Date();
            localMidnight.setHours(0, 0, 0, 0);
            const isoMidnight = localMidnight.toISOString();

            const { data, error } = await supabase
                .from('bottle_messages')
                .select('*')
                .eq('revealed_by', profile)
                .gte('revealed_at', isoMidnight)
                .order('revealed_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error('Error fetching today revealed bottle message:', error);
                return null;
            }
            return data;
        } catch (e) {
            console.error('Failed to get today revealed bottle message:', e);
            return null;
        }
    },

    async getDailyPuzzlePlay(profile: 'el' | 'ella', date: string, supabase: SupabaseClient = defaultSupabase): Promise<any | null> {
        try {
            const { data, error } = await supabase
                .from('daily_puzzle_plays')
                .select('*')
                .eq('profile', profile)
                .eq('date', date)
                .maybeSingle();

            if (error) {
                console.error('Error fetching daily puzzle play:', error);
                return null;
            }
            return data;
        } catch (e) {
            console.error('Failed to get daily puzzle play:', e);
            return null;
        }
    },

    async startDailyPuzzle(profile: 'el' | 'ella', date: string, supabase: SupabaseClient = defaultSupabase): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('daily_puzzle_plays')
                .insert({
                    profile,
                    date,
                    status: 'started'
                });

            if (error) {
                console.error('Error starting daily puzzle:', error);
                return false;
            }
            return true;
        } catch (e) {
            console.error('Failed to start daily puzzle:', e);
            return false;
        }
    },

    async updateDailyPuzzleStatus(
        profile: 'el' | 'ella',
        date: string,
        status: 'completed' | 'failed',
        timeSeconds?: number,
        supabase: SupabaseClient = defaultSupabase
    ): Promise<boolean> {
        try {
            const updates: any = { status };
            if (timeSeconds !== undefined) {
                updates.time_seconds = timeSeconds;
            }
            const { error } = await supabase
                .from('daily_puzzle_plays')
                .update(updates)
                .eq('profile', profile)
                .eq('date', date);

            if (error) {
                console.error('Error updating daily puzzle status:', error);
                return false;
            }
            return true;
        } catch (e) {
            console.error('Failed to update daily puzzle status:', e);
            return false;
        }
    },

    async getDailyPuzzleStats(date: string, supabase: SupabaseClient = defaultSupabase): Promise<{ el: any | null; ella: any | null }> {
        try {
            const { data, error } = await supabase
                .from('daily_puzzle_plays')
                .select('*')
                .eq('date', date);

            if (error || !data) return { el: null, ella: null };

            return {
                el: data.find(p => p.profile === 'el') || null,
                ella: data.find(p => p.profile === 'ella') || null
            };
        } catch (e) {
            console.error('Failed to fetch daily puzzle stats:', e);
            return { el: null, ella: null };
        }
    },

    async getDailyPuzzleHistoricCounts(
        supabase: SupabaseClient = defaultSupabase
    ): Promise<{
        el: { completed: number; failed: number; bestTime: number | null };
        ella: { completed: number; failed: number; bestTime: number | null };
    }> {
        try {
            const { data, error } = await supabase
                .from('daily_puzzle_plays')
                .select('profile, status, time_seconds');

            const stats = {
                el: { completed: 0, failed: 0, bestTime: null as number | null },
                ella: { completed: 0, failed: 0, bestTime: null as number | null }
            };

            if (error || !data) return stats;

            for (const play of data) {
                const p = play.profile as 'el' | 'ella';
                if (!stats[p]) continue;

                if (play.status === 'completed') {
                    stats[p].completed++;
                    if (play.time_seconds !== null && play.time_seconds !== undefined) {
                        if (stats[p].bestTime === null || play.time_seconds < stats[p].bestTime) {
                            stats[p].bestTime = play.time_seconds;
                        }
                    }
                } else if (play.status === 'failed') {
                    stats[p].failed++;
                }
            }

            return stats;
        } catch (e) {
            console.error('Failed to get daily puzzle historic counts:', e);
            return {
                el: { completed: 0, failed: 0, bestTime: null },
                ella: { completed: 0, failed: 0, bestTime: null }
            };
        }
    },

    async getTotalGamesCompletedCount(profile: 'el' | 'ella', supabase = defaultSupabase): Promise<number> {
        try {
            const [scoresRes, dailyRes, coopRes] = await Promise.all([
                supabase.from('mahjong_scores').select('*', { count: 'exact', head: true }).eq('profile', profile),
                supabase.from('daily_puzzle_plays').select('*', { count: 'exact', head: true }).eq('profile', profile).eq('status', 'completed'),
                supabase.from('coop_games').select('*', { count: 'exact', head: true }).not('completed_at', 'is', null)
            ]);

            const scoresCount = scoresRes.error ? 0 : (scoresRes.count || 0);
            const dailyCount = dailyRes.error ? 0 : (dailyRes.count || 0);
            const coopCount = coopRes.error ? 0 : (coopRes.count || 0);

            return scoresCount + dailyCount + coopCount;
        } catch (e) {
            console.error('Failed to calculate total games completed count:', e);
            return 0;
        }
    },

    async saveDrawing(
        sender: 'el' | 'ella',
        drawingData: string,
        caption?: string,
        supabase: SupabaseClient = defaultSupabase
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('mahjong_drawings')
                .insert({
                    sender,
                    drawing_data: drawingData,
                    caption
                });
            if (error) {
                console.error('Error saving drawing:', error);
                return false;
            }
            return true;
        } catch (e) {
            console.error('Failed to save drawing:', e);
            return false;
        }
    },

    async getTodayDrawing(
        sender: 'el' | 'ella',
        supabase: SupabaseClient = defaultSupabase
    ): Promise<any | null> {
        try {
            const localMidnight = new Date();
            localMidnight.setHours(0, 0, 0, 0);
            const isoMidnight = localMidnight.toISOString();

            const { data, error } = await supabase
                .from('mahjong_drawings')
                .select('*')
                .eq('sender', sender)
                .gte('created_at', isoMidnight)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error('Error fetching today drawing:', error);
                return null;
            }
            return data;
        } catch (e) {
            console.error('Failed to get today drawing:', e);
            return null;
        }
    }
};
