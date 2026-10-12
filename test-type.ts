import { RealtimePostgresUpdatePayload } from '@supabase/supabase-js';

interface CoopGamePayload {
    tiles: any[];
    dock_ids: string[] | null;
    active_turn: 'el' | 'ella';
}

const payload: RealtimePostgresUpdatePayload<CoopGamePayload> = {} as any;
console.log(payload.new?.tiles);
