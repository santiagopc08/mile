'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pizza, Coffee, Bike, CreditCard, Activity, TrendingDown, Flame, CircleDollarSign } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { StoreService } from '@/services/storeService';
import type { HealthHabitType, HealthHabit } from '@/services/storeService';
import { supabase } from '@/lib/supabase';

const HABIT_CONFIG: Record<HealthHabitType, { label: string; icon: typeof Pizza; color: string }> = {
    junk_food: { label: 'Comida Chatarra', icon: Pizza, color: '#ffb595' },
    snacks: { label: 'Snacks / Antojos', icon: Coffee, color: '#e5b5ff' },
    delivery: { label: 'Domicilios', icon: Bike, color: '#00dbe9' },
    impulse_spending: { label: 'Gasto Impulsivo', icon: CreditCard, color: '#ff003c' },
};

export function HabitTracker() {
    const { data, refreshData } = useStore();
    const { profile } = useProfile();
    const habits = useMemo(() => data?.healthHabits || [], [data?.healthHabits]);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState<HealthHabitType | null>(null);
    const [costInput, setCostInput] = useState('');
    const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');

    // Analysis
    const stats = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const recentHabits = habits.filter(h => new Date(h.createdAt) >= thirtyDaysAgo && h.profile === profile);
        
        const totalSpent = recentHabits.reduce((acc, h) => acc + (h.cost || 0), 0);
        
        const byType = recentHabits.reduce((acc, h) => {
            acc[h.habitType] = (acc[h.habitType] || 0) + (h.cost || 0);
            return acc;
        }, {} as Record<string, number>);

        // Calculate score
        let score: 'STABLE' | 'UNBALANCED' | 'CRITICAL_CONSUMPTION' = 'STABLE';
        if (totalSpent > 300000) score = 'CRITICAL_CONSUMPTION';
        else if (totalSpent > 100000) score = 'UNBALANCED';

        // Streak: consecutive days without any habit logged
        let streak = 0;
        const profileHabits = habits.filter(h => h.profile === profile);
        if (profileHabits.length > 0) {
            const todayStr = now.toISOString().split('T')[0];
            let checkDate = new Date(now);
            
            // Find oldest habit date to avoid looping indefinitely
            const oldestHabitTime = Math.min(...profileHabits.map(h => new Date(h.date || h.createdAt).getTime()));
            const oldestHabitDate = new Date(oldestHabitTime);
            oldestHabitDate.setHours(0, 0, 0, 0);

            while (checkDate >= oldestHabitDate) {
                const dateStr = checkDate.toISOString().split('T')[0];
                const hasHabit = habits.some(h => h.profile === profile && h.date === dateStr);
                if (!hasHabit) {
                    if (dateStr !== todayStr || streak > 0) streak++; // don't count today if it's the only one
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        // Potential savings (reducing by 20%)
        const potentialSavings = totalSpent * 0.2;

        return { totalSpent, byType, score, streak, potentialSavings };
    }, [habits, profile]);

    const formatCOP = (val: number) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

    const handleLogHabit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHabit || !profile) return;
        
        setIsSubmitting(true);
        const cost = parseFloat(costInput) || 0;
        
        try {
            await StoreService.logHealthHabit(profile, selectedHabit, cost, severity, '', supabase);
            
            // Disparar notificación discreta a la pareja
            const target = profile === 'el' ? 'ella' : 'el';
            await StoreService.addNotification(target, 'habits', 'Se guardó un registro en la lista de hábitos.', supabase);

            setSelectedHabit(null);
            setCostInput('');
            setSeverity('medium');
            onRefresh(); // trigger store reload
        } catch (error) {
            console.error("Failed to log habit", error);
        }
        setIsSubmitting(false);
    };

    const onRefresh = async () => {
        await refreshData();
    };

    const handleDelete = async (id: string) => {
        try {
            await StoreService.deleteHealthHabit(id, supabase);
            onRefresh();
        } catch(e) { console.error(e); }
    };

    return (
        <div className="space-y-6">
            {/* Header / Score */}
            <div className="border border-white/10 bg-black/60 p-6 pl-10 md:pl-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden rounded-none">
                {/* Left accent stripe */}
                <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[#00dbe9]" />
                
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Flame size={120} className="text-[#00dbe9] stroke-[1.5]" />
                </div>
                
                <div className="relative z-10">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00dbe9] mb-2 flex items-center gap-2 font-mono">
                        <Activity className="w-3 h-3 text-[#00dbe9] stroke-[1.5]" /> Control de Hábitos
                    </h2>
                    <div className={`text-4xl font-black tracking-widest uppercase font-mono ${
                        stats.score === 'STABLE' ? 'text-[#c3f400]' :
                        stats.score === 'UNBALANCED' ? 'text-[#ffb595]' :
                        'text-[#ff003c]'
                    }`}>
                        {stats.score === 'STABLE' ? 'ESTABLE' : stats.score === 'UNBALANCED' ? 'DESEQUILIBRADO' : 'LÍMITE EXCEDIDO'}
                    </div>
                    <p className="text-xs text-white/40 mt-2 max-w-md font-mono">
                        Evaluación basada en la frecuencia y el impacto de los hábitos y gastos en los últimos 30 días.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="border border-white/10 p-4 text-center min-w-[100px] bg-[#050505] rounded-none">
                        <Flame className="w-6 h-6 mx-auto mb-2 text-[#ffb595] stroke-[1.5]" />
                        <div className="text-2xl font-black font-mono">{stats.streak}</div>
                        <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30 font-mono">Días en Equilibrio</div>
                    </div>
                    <div className="border border-white/10 p-4 text-center min-w-[120px] bg-[#050505] rounded-none">
                        <CircleDollarSign className="w-6 h-6 mx-auto mb-2 text-user-c stroke-[1.5]" />
                        <div className="text-xl font-black font-mono text-user-c">{formatCOP(stats.totalSpent)}</div>
                        <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30 font-mono">Gastado (30 días)</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="border border-white/10 bg-[#0a0a0a] p-6 relative rounded-none">
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
                                    onClick={() => setSelectedHabit(type)}
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
                                            <button type="button" onClick={() => setSeverity('low')} className={`flex-1 py-2 text-[9px] uppercase font-bold border transition-colors rounded-none ${severity === 'low' ? 'border-[#c3f400] text-[#c3f400] bg-[#c3f400]/10' : 'border-white/10 text-white/30'}`}>Baja</button>
                                            <button type="button" onClick={() => setSeverity('medium')} className={`flex-1 py-2 text-[9px] uppercase font-bold border transition-colors rounded-none ${severity === 'medium' ? 'border-[#ffb595] text-[#ffb595] bg-[#ffb595]/10' : 'border-white/10 text-white/30'}`}>Media</button>
                                            <button type="button" onClick={() => setSeverity('high')} className={`flex-1 py-2 text-[9px] uppercase font-bold border transition-colors rounded-none ${severity === 'high' ? 'border-[#ff003c] text-[#ff003c] bg-[#ff003c]/10' : 'border-white/10 text-white/30'}`}>Alta</button>
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

                {/* Analysis & History Section */}
                <div className="space-y-6">
                    {/* Financial Analysis */}
                    <div className="border border-white/10 bg-[#050505] p-6 rounded-none">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a88a7e] mb-4 flex items-center gap-2 font-mono">
                            <TrendingDown className="w-4 h-4 stroke-[1.5]" /> Impacto Financiero
                        </h3>
                        
                        <div className="space-y-4">
                            {Object.entries(stats.byType).map(([type, amount]) => {
                                const config = HABIT_CONFIG[type as HealthHabitType];
                                if (!config) return null;
                                const percentage = stats.totalSpent > 0 ? (amount / stats.totalSpent) * 100 : 0;
                                
                                return (
                                    <div key={type} className="space-y-1">
                                        <div className="flex justify-between text-xs mb-1 font-mono">
                                            <span className="text-white/70">{config.label}</span>
                                            <span className="font-mono">{formatCOP(amount)}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-none">
                                            <div className="h-full rounded-none" style={{ width: `${percentage}%`, backgroundColor: config.color }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {stats.potentialSavings > 0 && (
                            <div className="mt-6 p-3 border border-[#c3f400]/30 bg-[#c3f400]/5 text-sm text-[#c3f400] leading-relaxed rounded-none relative pl-8">
                                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#c3f400]" />
                                <span className="font-mono">Si redujeras estos gastos en un 20%, ahorrarías <span className="font-bold font-mono">{formatCOP(stats.potentialSavings)}</span> al mes.</span>
                            </div>
                        )}
                    </div>

                    {/* Recent History */}
                    <div className="border border-white/10 bg-black p-4 max-h-[300px] overflow-y-auto custom-scrollbar rounded-none">
                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 sticky top-0 bg-black pb-2 font-mono">
                            Historial Reciente
                        </h3>
                        <div className="space-y-2">
                            {habits.filter(h => h.profile === profile).slice(0, 10).map(h => {
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
                </div>
            </div>
        </div>
    );
}
