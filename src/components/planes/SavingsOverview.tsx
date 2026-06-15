'use client';

import React, { useMemo } from 'react';
import type { WishlistItem } from '@/services/storeService';
import { formatCOP, GOAL_CATEGORIES } from './constants';
import { TrendingUp } from 'lucide-react';
import { FuturisticProgressBar } from '@/components/ui/FuturisticProgressBar';

export function SavingsOverview({ items }: { items: WishlistItem[] }) {
    const stats = useMemo(() => {
        let totalSaved = 0;
        let totalGoal = 0;
        let completed = 0;
        let active = 0;
        let ready = 0;
        const byCategory: Record<string, number> = {};

        // ⚡ Bolt Optimization: Single-pass O(N) calculation replacing multiple filter/reduce
        for (const item of items) {
            const saved = item.savedAmount || 0;
            totalSaved += saved;

            if (item.state === 'COMPLETED') {
                completed++;
            } else if (item.state === 'SAVING' || item.state === 'DISCOVERED') {
                active++;
            } else if (item.state === 'READY_TO_DEPLOY') {
                ready++;
            }

            if (item.state !== 'ARCHIVED' && item.state !== 'COMPLETED') {
                totalGoal += (item.price || 0);
            }

            if (item.state !== 'ARCHIVED') {
                byCategory[item.goalCategory] = (byCategory[item.goalCategory] || 0) + saved;
            }
        }

        return { totalSaved, totalGoal, completed, active, ready, byCategory };
    }, [items]);

    // AI suggestion based on savings data
    const aiSuggestion = useMemo(() => {
        try {
            const allocA = JSON.parse(localStorage.getItem('symmetry_A_allocations') || '[]');
            const allocB = JSON.parse(localStorage.getItem('symmetry_B_allocations') || '[]');

            // ⚡ Bolt Optimization: Single O(N) pass replacing [...A, ...B].filter().reduce()
            let totalIncome = 0;
            let totalExpenses = 0;

            for (const item of allocA) {
                if (item.amount > 0) totalIncome += item.amount;
                else if (item.amount < 0) totalExpenses += Math.abs(item.amount);
            }

            for (const item of allocB) {
                if (item.amount > 0) totalIncome += item.amount;
                else if (item.amount < 0) totalExpenses += Math.abs(item.amount);
            }

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
            {/* General Progress & Stats */}
            <div className="border border-white/10 bg-[#120d0e] py-3.5 px-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                    <TrendingUp size={100} className="text-[#ffb595]" />
                </div>
                
                <div className="flex items-center justify-between mb-3 relative z-10">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#ffb595]">Progreso General</span>
                </div>
                <FuturisticProgressBar 
                    progress={progress} 
                    color="var(--color-user-b)"
                />
                {stats.totalGoal > 0 && (
                    <div className="flex justify-between mt-3 font-mono text-[9px] uppercase tracking-widest text-white/35">
                        <span>{formatCOP(stats.totalSaved)} ({Math.round(progress)}%)</span>
                        <span>Meta Total: {formatCOP(stats.totalGoal)}</span>
                    </div>
                )}

                {/* Unified Stats Grid */}
                <div className="grid grid-cols-3 gap-1 mt-4 pt-3 border-t border-white/5 text-center">
                    <div className="flex flex-col items-center justify-center">
                        <div className="font-mono text-lg font-bold text-[#ffb595]">{stats.active}</div>
                        <div className="mt-0.5 font-mono text-[8px] uppercase tracking-widest text-[#a88a7e]">En curso</div>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <div className="font-mono text-lg font-bold text-[#00dbe9]">{stats.ready}</div>
                        <div className="mt-0.5 font-mono text-[8px] uppercase tracking-widest text-[#a88a7e]">¡Listos!</div>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <div className="font-mono text-lg font-bold text-user-c">{stats.completed}</div>
                        <div className="mt-0.5 font-mono text-[8px] uppercase tracking-widest text-[#a88a7e]">¡Logrados!</div>
                    </div>
                </div>
            </div>

            {/* Category breakdown */}
            {Object.keys(stats.byCategory).length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {GOAL_CATEGORIES.filter(c => stats.byCategory[c.id]).map(cat => (
                        <div key={cat.id} className="flex items-center gap-2 border border-white/10 bg-[#120d0e] px-2.5 py-1">
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
                    <p className="text-[10px] tracking-normal text-[#d9c1e8] leading-relaxed font-sans">{aiSuggestion}</p>
                </div>
            )}
        </div>
    );
}
