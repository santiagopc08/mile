'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend
} from 'recharts';

interface BloodPressureEntry {
    id: string;
    systolic: number;
    diastolic: number;
    heart_rate: number;
    position: 'sitting' | 'edge of bed' | 'lied';
    author: string;
    created_at: string;
}

interface StatDetails {
    max: BloodPressureEntry;
    min: BloodPressureEntry;
    avg: number;
}

interface VitalsStats {
    systolic: StatDetails;
    diastolic: StatDetails;
    heartRate: StatDetails;
}

export const BloodPressureTracker = () => {
    const { profile } = useProfile();
    const [entries, setEntries] = useState<BloodPressureEntry[]>([]);
    const [systolic, setSystolic] = useState<number>(120);
    const [diastolic, setDiastolic] = useState<number>(80);
    const [heartRate, setHeartRate] = useState<number>(70);
    const [position, setPosition] = useState<'sitting' | 'edge of bed' | 'lied'>('sitting');
    const [loading, setLoading] = useState(false);

    const fetchEntries = useCallback(async () => {
        const { data } = await supabase
            .from('blood_pressure')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setEntries(data);
    }, []);

    useEffect(() => {
        const fetchOnce = async () => {
            await fetchEntries();
        };
        fetchOnce();
    }, [fetchEntries]);

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.from('blood_pressure').insert({
            systolic,
            diastolic,
            heart_rate: heartRate,
            position,
            author: profile || 'el'
        });

        if (!error) {
            fetchEntries();
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('blood_pressure').delete().eq('id', id);
        if (!error) {
            setEntries(entries.filter(e => e.id !== id));
        }
    };

    const stats = useMemo<VitalsStats | null>(() => {
        if (entries.length === 0) return null;

        const sortedBySystolic = [...entries].sort((a, b) => a.systolic - b.systolic);
        const sortedByDiastolic = [...entries].sort((a, b) => a.diastolic - b.diastolic);
        const sortedByHeartRate = [...entries].sort((a, b) => a.heart_rate - b.heart_rate);

        const avgSystolic = Math.round(entries.reduce((acc, curr) => acc + curr.systolic, 0) / entries.length);
        const avgDiastolic = Math.round(entries.reduce((acc, curr) => acc + curr.diastolic, 0) / entries.length);
        const avgHeartRate = Math.round(entries.reduce((acc, curr) => acc + curr.heart_rate, 0) / entries.length);

        return {
            systolic: {
                max: sortedBySystolic[sortedBySystolic.length - 1],
                min: sortedBySystolic[0],
                avg: avgSystolic
            },
            diastolic: {
                max: sortedByDiastolic[sortedByDiastolic.length - 1],
                min: sortedByDiastolic[0],
                avg: avgDiastolic
            },
            heartRate: {
                max: sortedByHeartRate[sortedByHeartRate.length - 1],
                min: sortedByHeartRate[0],
                avg: avgHeartRate
            }
        };
    }, [entries]);

    const chartData = useMemo(() => {
        return [...entries].reverse().map(entry => ({
            name: new Date(entry.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            fullDate: new Date(entry.created_at).toLocaleString(),
            systolic: entry.systolic,
            diastolic: entry.diastolic,
            heartRate: entry.heart_rate,
            position: entry.position
        }));
    }, [entries]);

    return (
        <div className="space-y-8">
            <div className="geometric-card p-8 bg-dot-matrix border-white/10 relative">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-user-c" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-user-c" />

                <h2 className="text-[10px] font-display font-black uppercase tracking-[0.3em] mb-8 border-b border-white/10 pb-4 flex justify-between items-center text-user-c">
                    <span>[ SYSTEM_MONITOR ] VITALS_TRACKER</span>
                    <span className="text-[8px] font-mono opacity-50">STABLE_BUILD_2.5</span>
                </h2>

                <form onSubmit={handleAddEntry} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 items-end">
                    <div className="space-y-2">
                        <label className="text-[9px] font-display font-bold uppercase tracking-widest text-stone-500">Systolic (mmHg)</label>
                        <input
                            type="number"
                            value={systolic}
                            onChange={e => setSystolic(Number(e.target.value))}
                            className="w-full bg-surface-dim border border-white/10 p-3 text-sm font-display font-black outline-none focus:border-user-c transition-colors"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-display font-bold uppercase tracking-widest text-stone-500">Diastolic (mmHg)</label>
                        <input
                            type="number"
                            value={diastolic}
                            onChange={e => setDiastolic(Number(e.target.value))}
                            className="w-full bg-surface-dim border border-white/10 p-3 text-sm font-display font-black outline-none focus:border-user-c transition-colors"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-display font-bold uppercase tracking-widest text-stone-500">Pulse (BPM)</label>
                        <input
                            type="number"
                            value={heartRate}
                            onChange={e => setHeartRate(Number(e.target.value))}
                            className="w-full bg-surface-dim border border-white/10 p-3 text-sm font-display font-black outline-none focus:border-user-c transition-colors"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-display font-bold uppercase tracking-widest text-stone-500">Position</label>
                        <select
                            value={position}
                            onChange={e => setPosition(e.target.value as 'sitting' | 'edge of bed' | 'lied')}
                            className="w-full bg-surface-dim border border-white/10 p-3 text-sm font-display font-black outline-none focus:border-user-c appearance-none"
                        >
                            <option value="sitting">SITTING</option>
                            <option value="edge of bed">EDGE_OF_BED</option>
                            <option value="lied">LIED</option>
                        </select>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="md:col-span-4 bg-user-c text-black py-4 text-[11px] font-display font-black uppercase tracking-[0.2em] hover:shadow-[0_0_15px_rgba(0,219,233,0.3)] transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={16} strokeWidth={3} /> EXECUTE_LOG_VITAL
                    </motion.button>
                </form>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {[
                            { label: 'SYSTOLIC', key: 'systolic' as const, icon: TrendingUp, unit: 'mmHg' },
                            { label: 'DIASTOLIC', key: 'diastolic' as const, icon: TrendingDown, unit: 'mmHg' },
                            { label: 'HEART_RATE', key: 'heartRate' as const, icon: Heart, unit: 'BPM' }
                        ].map(s => (
                            <div key={s.label} className="p-4 border border-white/5 bg-surface-dim/50 relative group">
                                <div className="absolute top-0 right-0 p-1">
                                    <s.icon size={10} className="text-user-c opacity-50" />
                                </div>
                                <h3 className="text-[9px] font-display font-black text-stone-500 border-b border-white/5 pb-2 mb-4 uppercase tracking-widest">
                                    {s.label} ({s.unit})
                                </h3>
                                <div className="grid grid-cols-3 gap-2 text-center items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[7px] text-stone-600 uppercase font-black">MAX</span>
                                        <span className="text-lg font-display font-black text-stone-200">
                                            {s.key === 'heartRate' ? stats[s.key].max.heart_rate : stats[s.key].max[s.key]}
                                        </span>
                                    </div>
                                    <div className="flex flex-col border-x border-white/5">
                                        <span className="text-[7px] text-user-c uppercase font-black">AVG</span>
                                        <span className="text-lg font-display font-black text-user-c">{stats[s.key].avg}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[7px] text-stone-600 uppercase font-black">MIN</span>
                                        <span className="text-lg font-display font-black text-stone-200">
                                            {s.key === 'heartRate' ? stats[s.key].min.heart_rate : stats[s.key].min[s.key]}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {entries.length > 0 && (
                    <div className="h-72 w-full mb-12 border border-white/10 p-6 bg-black/40">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fill: '#555', fontWeight: 'bold' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fill: '#555', fontWeight: 'bold' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0a0a0a',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '0px',
                                        fontSize: '10px',
                                        textTransform: 'uppercase',
                                        fontWeight: 'black'
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'black', paddingTop: '20px', letterSpacing: '0.1em' }} />
                                <Line
                                    type="stepAfter"
                                    dataKey="systolic"
                                    stroke="var(--color-user-a)"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 4, fill: 'var(--color-user-a)' }}
                                    name="SYS"
                                />
                                <Line
                                    type="stepAfter"
                                    dataKey="diastolic"
                                    stroke="var(--color-user-b)"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 4, fill: 'var(--color-user-b)' }}
                                    name="DIA"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="heartRate"
                                    stroke="var(--color-user-c)"
                                    strokeWidth={1}
                                    strokeDasharray="4 4"
                                    dot={false}
                                    name="PULSE"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                    <AnimatePresence>
                        {entries.map((entry) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center justify-between p-4 border border-white/5 bg-surface-dim/30 group relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-user-c opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center gap-8">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-display font-black text-stone-200">
                                            {new Date(entry.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="text-[8px] font-mono text-stone-600 uppercase">
                                            {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex gap-10">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-display font-black text-stone-600 uppercase tracking-tighter">BP_READING</span>
                                            <span className="text-sm font-display font-black text-user-c">{entry.systolic}<span className="text-stone-700 mx-1">/</span>{entry.diastolic}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-display font-black text-stone-600 uppercase tracking-tighter">HEART_RATE</span>
                                            <span className="text-sm font-display font-black text-stone-200">{entry.heart_rate}<span className="text-[8px] text-stone-600 ml-1">BPM</span></span>
                                        </div>
                                        <div className="flex flex-col hidden sm:flex">
                                            <span className="text-[7px] font-display font-black text-stone-600 uppercase tracking-tighter">POSITION</span>
                                            <span className="text-[10px] font-display font-black text-stone-400 uppercase">{entry.position}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="text-stone-800 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
