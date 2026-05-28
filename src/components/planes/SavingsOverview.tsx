'use client';

import React, { useMemo } from 'react';
import type { WishlistItem } from '@/services/storeService';
import { formatCOP, GOAL_CATEGORIES } from './constants';
import { TrendingUp } from 'lucide-react';

export function SavingsOverview({ items }: { items: WishlistItem[] }) {
    const stats = useMemo(() => {
        const totalSaved = items.reduce((s, i) => s + (i.savedAmount || 0), 0);
        const totalGoal = items.filter(i => i.state !== 'ARCHIVED' && i.state !== 'COMPLETED').reduce((s, i) => s + (i.price || 0), 0);
        const completed = items.filter(i => i.state === 'COMPLETED').length;
        const active = items.filter(i => i.state === 'SAVING' || i.state === 'DISCOVERED').length;
        const ready = items.filter(i => i.state === 'READY_TO_DEPLOY').length;

        const byCategory: Record<string, number> = {};
        items.filter(i => i.state !== 'ARCHIVED').forEach(i => {
            byCategory[i.goalCategory] = (byCategory[i.goalCategory] || 0) + (i.savedAmount || 0);
        });

        return { totalSaved, totalGoal, completed, active, ready, byCategory };
    }, [items]);

    // AI suggestion based on savings data
    const aiSuggestion = useMemo(() => {
        try {
            const allocA = JSON.parse(localStorage.getItem('symmetry_A_allocations') || '[]');
            const allocB = JSON.parse(localStorage.getItem('symmetry_B_allocations') || '[]');
            const totalIncome = [...allocA, ...allocB].filter((a: any) => a.amount > 0).reduce((s: number, a: any) => s + a.amount, 0);
            const totalExpenses = [...allocA, ...allocB].filter((a: any) => a.amount < 0).reduce((s: number, a: any) => s + Math.abs(a.amount), 0);
            const available = totalIncome - totalExpenses;
            if (available > 10000) {
                const safe = Math.floor(available * 0.15 / 1000) * 1000;
                return `Según tus ingresos y gastos, puedes destinar ${formatCOP(safe)} a tus deseos sin afectar el presupuesto básico.`;
            }
        } catch {}
        return null;
    }, []);

    const progress = stats.totalGoal > 0 ? Math.min((stats.totalSaved / stats.totalGoal) * 100, 100) : 0;
    const chunks = 20;
    const filledChunks = Math.round((progress / 100) * chunks);

    return (
        <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-1 lg:grid-cols-4">
                <div className="flex flex-col items-center justify-center border border-white/10 bg-[#120d0e] p-4 text-center">
                    <div className="font-mono text-xl font-bold text-user-b">{formatCOP(stats.totalSaved)}</div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-[#a88a7e]">Ahorrado</div>
                </div>
                <div className="flex flex-col items-center justify-center border border-white/10 bg-[#120d0e] p-4 text-center">
                    <div className="font-mono text-xl font-bold text-[#ffb595]">{stats.active}</div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-[#a88a7e]">En curso</div>
                </div>
                <div className="flex flex-col items-center justify-center border border-white/10 bg-[#120d0e] p-4 text-center">
                    <div className="font-mono text-xl font-bold text-[#00dbe9]">{stats.ready}</div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-[#a88a7e]">¡Listos!</div>
                </div>
                <div className="flex flex-col items-center justify-center border border-white/10 bg-[#120d0e] p-4 text-center">
                    <div className="font-mono text-xl font-bold text-user-c">{stats.completed}</div>
                    <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-[#a88a7e]">¡Logrados!</div>
                </div>
            </div>

            {/* General Progress */}
            <div className="border border-white/10 bg-[#120d0e] p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                    <TrendingUp size={100} className="text-[#ffb595]" />
                </div>
                
                <div className="flex items-center justify-between mb-3 relative z-10">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#ffb595]">Progreso General</span>
                    <span className="font-mono text-[12px] font-bold text-user-b">{Math.round(progress)}%</span>
                </div>
                <div className="chunked-progress">
                    {Array.from({ length: chunks }).map((_, i) => (
                        <div key={i} className={`chunk ${i < filledChunks ? 'filled' : ''}`} />
                    ))}
                </div>
                {stats.totalGoal > 0 && (
                    <div className="flex justify-between mt-3 font-mono text-[9px] uppercase tracking-widest text-white/35">
                        <span>{formatCOP(stats.totalSaved)}</span>
                        <span>Meta Total: {formatCOP(stats.totalGoal)}</span>
                    </div>
                )}
            </div>

            {/* Category breakdown */}
            {Object.keys(stats.byCategory).length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {GOAL_CATEGORIES.filter(c => stats.byCategory[c.id]).map(cat => (
                        <div key={cat.id} className="flex items-center gap-2 border border-white/10 bg-[#120d0e] px-3 py-2">
                            <span className="text-xs">{cat.emoji}</span>
                            <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">{cat.label}</span>
                            <span className="font-mono text-[10px] font-bold text-user-b">{formatCOP(stats.byCategory[cat.id])}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* AI suggestion */}
            {aiSuggestion && (
                <div className="flex items-start gap-3 border border-user-c/25 bg-user-c/[0.04] p-3">
                    <TrendingUp className="w-4 h-4 text-user-c shrink-0 mt-0.5" />
                    <p className="text-[10px] tracking-normal text-[#d9c1e8] leading-relaxed">{aiSuggestion}</p>
                </div>
            )}
        </div>
    );
}
