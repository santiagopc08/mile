import { useMemo, memo } from 'react';
import { Activity, Heart } from 'lucide-react';
import type { BloodPressureEntry } from './types';

interface Props {
    entries: BloodPressureEntry[];
}

// ⚡ Bolt Optimization: Wrap component in React.memo() to prevent unnecessary re-renders
export const BloodPressureStats = memo(({ entries }: Props) => {
    const stats = useMemo(() => {
        if (entries.length === 0) return null;

        const result = {
            systolic: { min: entries[0], max: entries[0], sum: 0 },
            diastolic: { min: entries[0], max: entries[0], sum: 0 },
            heartRate: { min: entries[0], max: entries[0], sum: 0 }
        };

        for (const curr of entries) {
            if (curr.systolic < result.systolic.min.systolic) result.systolic.min = curr;
            if (curr.systolic > result.systolic.max.systolic) result.systolic.max = curr;
            result.systolic.sum += curr.systolic;

            if (curr.diastolic < result.diastolic.min.diastolic) result.diastolic.min = curr;
            if (curr.diastolic > result.diastolic.max.diastolic) result.diastolic.max = curr;
            result.diastolic.sum += curr.diastolic;

            if (curr.heart_rate < result.heartRate.min.heart_rate) result.heartRate.min = curr;
            if (curr.heart_rate > result.heartRate.max.heart_rate) result.heartRate.max = curr;
            result.heartRate.sum += curr.heart_rate;
        }

        return {
            systolic: {
                max: result.systolic.max,
                min: result.systolic.min,
                avg: Math.round(result.systolic.sum / entries.length)
            },
            diastolic: {
                max: result.diastolic.max,
                min: result.diastolic.min,
                avg: Math.round(result.diastolic.sum / entries.length)
            },
            heartRate: {
                max: result.heartRate.max,
                min: result.heartRate.min,
                avg: Math.round(result.heartRate.sum / entries.length)
            }
        };
    }, [entries]);

    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="p-3 border border-white/10 bg-black/40 space-y-2">
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                    <h3 className="text-[8px] uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1">
                        <Activity size={10} className="text-[#ff4b89]" /> MÁXIMA (SYS)
                    </h3>
                    <span className="text-[7px] font-mono text-stone-500">mmHg</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="flex flex-col">
                        <span className="text-[6.5px] text-stone-500 uppercase font-bold">MÍN</span>
                        <span className="text-sm font-black text-white tabular-nums">{stats.systolic.min.systolic}</span>
                    </div>
                    <div className="flex flex-col border-x border-white/10">
                        <span className="text-[6.5px] text-stone-500 uppercase font-bold">PROMEDIO</span>
                        <span className="text-sm font-black text-[#ff4b89] tabular-nums">{stats.systolic.avg}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[6.5px] text-stone-500 uppercase font-bold">MÁX</span>
                        <span className="text-sm font-black text-white tabular-nums">{stats.systolic.max.systolic}</span>
                    </div>
                </div>
            </div>

            <div className="p-3 border border-white/10 bg-black/40 space-y-2">
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                    <h3 className="text-[8px] uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1">
                        <Activity size={10} className="text-[#c3f400]" /> MÍNIMA (DIA)
                    </h3>
                    <span className="text-[7px] font-mono text-stone-500">mmHg</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="flex flex-col">
                        <span className="text-[6.5px] text-stone-500 uppercase font-bold">MÍN</span>
                        <span className="text-sm font-black text-white tabular-nums">{stats.diastolic.min.diastolic}</span>
                    </div>
                    <div className="flex flex-col border-x border-white/10">
                        <span className="text-[6.5px] text-stone-500 uppercase font-bold">PROMEDIO</span>
                        <span className="text-sm font-black text-[#c3f400] tabular-nums">{stats.diastolic.avg}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[6.5px] text-stone-500 uppercase font-bold">MÁX</span>
                        <span className="text-sm font-black text-white tabular-nums">{stats.diastolic.max.diastolic}</span>
                    </div>
                </div>
            </div>

            <div className="p-3 border border-white/10 bg-black/40 space-y-2">
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                    <h3 className="text-[8px] uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1">
                        <Heart size={10} className="text-rose-400" /> PULSO
                    </h3>
                    <span className="text-[7px] font-mono text-stone-500">BPM</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="flex flex-col">
                        <span className="text-[6.5px] text-stone-500 uppercase font-bold">MÍN</span>
                        <span className="text-sm font-black text-white tabular-nums">{stats.heartRate.min.heart_rate}</span>
                    </div>
                    <div className="flex flex-col border-x border-white/10">
                        <span className="text-[6.5px] text-stone-500 uppercase font-bold">PROMEDIO</span>
                        <span className="text-sm font-black text-rose-400 tabular-nums">{stats.heartRate.avg}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[6.5px] text-stone-500 uppercase font-bold">MÁX</span>
                        <span className="text-sm font-black text-white tabular-nums">{stats.heartRate.max.heart_rate}</span>
                    </div>
                </div>
            </div>
        </div>
    );
});
