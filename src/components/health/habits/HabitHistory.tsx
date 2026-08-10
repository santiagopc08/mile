import React from 'react';
import { HABIT_CONFIG, formatCOP } from './constants';
import type { HealthHabit } from '@/services/storeService';
import { HealthService } from '@/services/healthService';
import { supabase } from '@/lib/supabase';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';

interface HabitHistoryProps {
    recentHabitsForProfile: HealthHabit[];
    onRefresh: () => void;
}

export function HabitHistory({ recentHabitsForProfile, onRefresh }: HabitHistoryProps) {
    const handleDelete = async (id: string) => {
        try {
            await HealthService.deleteHealthHabit(id, supabase);
            sound.playTick();
            haptics.triggerTick();
            onRefresh();
        } catch(e) {
            console.error(e);
            sound.playError();
            haptics.triggerError();
        }
    };

    return (
        <div className="border border-white/10 bg-black p-4 max-h-[300px] overflow-y-auto custom-scrollbar rounded-none">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 sticky top-0 bg-black pb-2 font-mono">
                Historial Reciente
            </h3>
            <div className="space-y-2">
                {recentHabitsForProfile.length === 0 && (
                    <p className="border border-dashed border-white/10 px-3 py-8 text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-white/25">
                        Nada registrado todavía
                    </p>
                )}
                {recentHabitsForProfile.map(h => {
                    const config = HABIT_CONFIG[h.habitType];
                    const severityColor = h.severity === 'high' ? '#ff003c' : h.severity === 'medium' ? '#ffb595' : '#c3f400';
                    return (
                        <div key={h.id} className="relative flex items-center justify-between p-2 pl-8 border border-white/5 bg-white/[0.02] rounded-none">
                            <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: severityColor }} />
                            <div className="flex items-center gap-3">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/80 font-mono">{config?.label}</div>
                                    <div className="text-[8px] font-mono text-white/30">{new Date(h.createdAt).toLocaleDateString('es-CO')}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 relative z-10">
                                <span className="text-xs font-mono text-white/60">{formatCOP(h.cost)}</span>
                                <button onClick={() => handleDelete(h.id)} className="text-[8px] text-white/20 hover:text-red-400 font-mono">✕</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
