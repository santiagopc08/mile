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
            <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/5 sm:grid-cols-4">
                <div className="bg-[#080808] p-4 text-center">
                    <div className="text-lg font-black text-user-b font-mono">{formatCOP(stats.totalSaved)}</div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] mt-1">Ahorrado</div>
                </div>
                <div className="bg-[#080808] p-4 text-center">
                    <div className="text-lg font-black text-[#ffb595] font-mono">{stats.active}</div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] mt-1">En curso</div>
                </div>
                <div className="bg-[#080808] p-4 text-center">
                    <div className="text-lg font-black text-[#00dbe9] font-mono">{stats.ready}</div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] mt-1">¡Listos!</div>
                </div>
                <div className="bg-[#080808] p-4 text-center">
                    <div className="text-lg font-black text-user-c font-mono">{stats.completed}</div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] mt-1">¡Logrados!</div>
                </div>
            </div>

            {/* Global savings bar */}
            <div className="border border-white/10 bg-black/40 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                    <TrendingUp size={100} className="text-[#ffb595]" />
                </div>
                
                <div className="flex items-center justify-between mb-2 relative z-10">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#ffb595]">Progreso General</span>
                    <span className="text-[10px] font-mono font-bold text-user-b">{Math.round(progress)}%</span>
                </div>
                <div className="savings-track">
                    {Array.from({ length: chunks }).map((_, i) => (
                        <div key={i} className={`savings-chunk ${i < filledChunks ? 'savings-chunk-filled' : ''} ${i === filledChunks - 1 && filledChunks > 0 ? 'savings-chunk-latest' : ''}`} />
                    ))}
                </div>
                {stats.totalGoal > 0 && (
                    <div className="flex justify-between mt-2 text-[8px] font-mono text-white/25">
                        <span>{formatCOP(stats.totalSaved)}</span>
                        <span>Meta Total: {formatCOP(stats.totalGoal)}</span>
                    </div>
                )}
            </div>

            {/* Category breakdown */}
            {Object.keys(stats.byCategory).length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {GOAL_CATEGORIES.filter(c => stats.byCategory[c.id]).map(cat => (
                        <div key={cat.id} className="flex items-center gap-1.5 border border-white/[0.06] bg-black/40 px-2.5 py-1.5">
                            <span className="text-xs">{cat.emoji}</span>
                            <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-white/40">{cat.label}</span>
                            <span className="text-[9px] font-mono font-bold text-user-b">{formatCOP(stats.byCategory[cat.id])}</span>
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
