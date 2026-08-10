import React from 'react';
import { TrendingDown } from 'lucide-react';
import { HABIT_CONFIG, formatCOP } from './constants';
import type { HealthHabitType } from '@/services/storeService';

interface HabitAnalysisProps {
    stats: {
        byType: Record<string, number>;
        totalSpent: number;
        potentialSavings: number;
    };
}

export function HabitAnalysis({ stats }: HabitAnalysisProps) {
    return (
        <div className="border border-white/10 bg-white/[0.03] p-6 rounded-none">
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
    );
}
