import { supabase as defaultSupabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { HealthHabitType } from './storeService';

export interface DailyTrackingData {
    weight?: number;
    sleep_hours?: number;
    water_glasses?: number;
    steps?: number;
    calories_burned?: number;
    calories_consumed?: number;
    mood?: number;
    notes?: string;
}

export const HealthService = {

    // === DAILY TRACKING ===

    async updateDailyTracking(
        profile: 'el' | 'ella',
        updates: Partial<DailyTrackingData>,
        supabase: SupabaseClient = defaultSupabase
    ): Promise<void> {
        const timeZoneOffset = (new Date()).getTimezoneOffset() * 60000;
        const localDate = new Date(Date.now() - timeZoneOffset);
        const todayStr = localDate.toISOString().split('T')[0];

        // Upsert daily tracking data for the profile and current date
        await supabase.from('daily_tracking').upsert({
            profile,
            date: todayStr,
            ...updates
        }, {
            onConflict: 'profile,date'
        });
    },


    // === HEALTH HABITS ===

    async logHealthHabit(
        profile: string,
        habitType: HealthHabitType,
        cost: number,
        severity: 'low' | 'medium' | 'high',
        note?: string,
        supabase: SupabaseClient = defaultSupabase
    ): Promise<void> {
        const timeZoneOffset = (new Date()).getTimezoneOffset() * 60000;
        const localDate = new Date(Date.now() - timeZoneOffset);
        const todayStr = localDate.toISOString().split('T')[0];

        await supabase.from('health_habits').insert({
            profile,
            date: todayStr,
            habit_type: habitType,
            cost,
            severity,
            note: note || null
        });
    },


    async deleteHealthHabit(id: string, supabase: SupabaseClient = defaultSupabase): Promise<void> {
        await supabase.from('health_habits').delete().eq('id', id);
    }
};
