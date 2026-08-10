import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HABIT_CONFIG } from './constants';
import type { HealthHabitType } from '@/services/storeService';
import { HealthService } from '@/services/healthService';
import { NotificationService } from '@/services/notificationService';
import { supabase } from '@/lib/supabase';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';

interface HabitLogFormProps {
    profile: string | null;
    onRefresh: () => void;
}

export function HabitLogForm({ profile, onRefresh }: HabitLogFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState<HealthHabitType | null>(null);
    const [costInput, setCostInput] = useState('');
    const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');

    const handleLogHabit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHabit || !profile) return;

        setIsSubmitting(true);
        const cost = parseFloat(costInput) || 0;

        try {
            await HealthService.logHealthHabit(profile, selectedHabit, cost, severity, '', supabase);

            // Disparar notificación discreta a la pareja
            const target = profile === 'el' ? 'ella' : 'el';
            await NotificationService.addNotification(target, 'habits', 'Se guardó un registro en la lista de hábitos.', supabase);

            sound.playSave();
            haptics.triggerSave();

            setSelectedHabit(null);
            setCostInput('');
            setSeverity('medium');
            onRefresh(); // trigger store reload
        } catch (error) {
            console.error("Failed to log habit", error);
            sound.playError();
            haptics.triggerError();
        }
        setIsSubmitting(false);
    };

    return (
        <div className="border border-white/10 bg-white/[0.03] p-6 relative rounded-none">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30" />

            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a88a7e] mb-4 font-mono">
                Registrar hábito
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-6">
                {(Object.keys(HABIT_CONFIG) as HealthHabitType[]).map(type => {
                    const config = HABIT_CONFIG[type];
                    return (
                        <button
                            key={type}
                            onClick={() => {
                                setSelectedHabit(type);
                                sound.playTick();
                                haptics.triggerTick();
                            }}
                            className={`habit-btn p-4 flex flex-col items-center justify-center gap-3 rounded-none border border-white/10 hover:bg-white/5 transition-colors ${selectedHabit === type ? 'ring-1 ring-white/50 bg-white/10 border-white/30' : ''}`}
                        >
                            <config.icon className="w-6 h-6 stroke-[1.5]" style={{ color: config.color }} />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-white/70 text-center font-mono">{config.label}</span>
                        </button>
                    );
                })}
            </div>

            <AnimatePresence>
                {selectedHabit && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleLogHabit}
                        className="overflow-hidden"
                    >
                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] font-mono">Monto gastado (COP)</label>
                                <input
                                    type="number"
                                    required
                                    value={costInput}
                                    onChange={e => setCostInput(e.target.value)}
                                    className="w-full bg-black border border-white/10 p-3 text-sm font-mono text-white outline-none rounded-none focus:border-white/30"
                                    placeholder="Ej: 25000"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] font-mono">Impacto (Salud y finanzas)</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => { setSeverity('low'); sound.playTick(); haptics.triggerTick(); }} className={`flex-1 py-2 text-[9px] uppercase font-bold border transition-colors rounded-none ${severity === 'low' ? 'border-[#c3f400] text-[#c3f400] bg-[#c3f400]/10' : 'border-white/10 text-white/30'} font-mono`}>Baja</button>
                                    <button type="button" onClick={() => { setSeverity('medium'); sound.playTick(); haptics.triggerTick(); }} className={`flex-1 py-2 text-[9px] uppercase font-bold border transition-colors rounded-none ${severity === 'medium' ? 'border-[#ffb595] text-[#ffb595] bg-[#ffb595]/10' : 'border-white/10 text-white/30'} font-mono`}>Media</button>
                                    <button type="button" onClick={() => { setSeverity('high'); sound.playTick(); haptics.triggerTick(); }} className={`flex-1 py-2 text-[9px] uppercase font-bold border transition-colors rounded-none ${severity === 'high' ? 'border-[#ff003c] text-[#ff003c] bg-[#ff003c]/10' : 'border-white/10 text-white/30'} font-mono`}>Alta</button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-none hover:bg-white/20 transition-colors disabled:opacity-50 font-mono"
                            >
                                Guardar de Forma Segura
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
}
