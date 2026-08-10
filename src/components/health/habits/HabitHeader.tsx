import React from 'react';
import { Activity, Flame, CircleDollarSign } from 'lucide-react';
import { formatCOP } from './constants';

interface HabitHeaderProps {
    stats: {
        score: 'STABLE' | 'UNBALANCED' | 'CRITICAL_CONSUMPTION';
        streak: number;
        totalSpent: number;
    };
}

export function HabitHeader({ stats }: HabitHeaderProps) {
    return (
        <div className="border border-white/10 bg-white/[0.035] p-6 pl-10 md:pl-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden rounded-none">
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
                <div className="border border-white/10 p-4 text-center min-w-[100px] bg-white/[0.03] rounded-none">
                    <Flame className="w-6 h-6 mx-auto mb-2 text-[#ffb595] stroke-[1.5]" />
                    <div className="text-2xl font-black font-mono">{stats.streak}</div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30 font-mono">Días en Equilibrio</div>
                </div>
                <div className="border border-white/10 p-4 text-center min-w-[120px] bg-white/[0.03] rounded-none">
                    <CircleDollarSign className="w-6 h-6 mx-auto mb-2 text-user-c stroke-[1.5]" />
                    <div className="text-xl font-black font-mono text-user-c">{formatCOP(stats.totalSpent)}</div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30 font-mono">Gastado (30 días)</div>
                </div>
            </div>
        </div>
    );
}
