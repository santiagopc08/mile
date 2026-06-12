import { supabase as defaultSupabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export const TaskService = {


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
    }
};
