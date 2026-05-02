'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Heart, Trash2, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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

export const BloodPressureTracker = () => {
    const { profile } = useProfile();
    const [entries, setEntries] = useState<BloodPressureEntry[]>([]);
    const [systolic, setSystolic] = useState<number>(120);
    const [diastolic, setDiastolic] = useState<number>(80);
    const [heartRate, setHeartRate] = useState<number>(70);
    const [position, setPosition] = useState<'sitting' | 'edge of bed' | 'lied'>('sitting');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        const { data, error } = await supabase
            .from('blood_pressure')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setEntries(data);
    };

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

    const stats = useMemo(() => {
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
        <div className="space-y-6">
            <div className="geometric-card p-6 bg-dot-matrix border-stone-200 dark:border-stone-800">
                <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] mb-6 border-b border-stone-100 dark:border-stone-900 pb-3 flex justify-between items-center text-user-a">
                    <span>Blood Pressure & Heart Rate</span>
                    <span className="text-[8px] font-mono opacity-50">Vitals v1.1</span>
                </h2>

                <form onSubmit={handleAddEntry} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 items-end">
                    <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-widest text-stone-500 font-bold">Systolic</label>
                        <input
                            type="number"
                            value={systolic}
                            onChange={e => setSystolic(Number(e.target.value))}
                            className="w-full bg-transparent border border-stone-200 dark:border-stone-800 p-2 text-xs font-mono outline-none focus:border-user-a"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-widest text-stone-500 font-bold">Diastolic</label>
                        <input
                            type="number"
                            value={diastolic}
                            onChange={e => setDiastolic(Number(e.target.value))}
                            className="w-full bg-transparent border border-stone-200 dark:border-stone-800 p-2 text-xs font-mono outline-none focus:border-user-a"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-widest text-stone-500 font-bold">Heart Rate</label>
                        <input
                            type="number"
                            value={heartRate}
                            onChange={e => setHeartRate(Number(e.target.value))}
                            className="w-full bg-transparent border border-stone-200 dark:border-stone-800 p-2 text-xs font-mono outline-none focus:border-user-a"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-widest text-stone-500 font-bold">Position</label>
                        <select
                            value={position}
                            onChange={e => setPosition(e.target.value as any)}
                            className="w-full bg-transparent border border-stone-200 dark:border-stone-800 p-2 text-xs font-mono outline-none focus:border-user-a appearance-none"
                        >
                            <option value="sitting">Sitting</option>
                            <option value="edge of bed">Edge of Bed</option>
                            <option value="lied">Lied</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="md:col-span-4 bg-user-a text-white py-3 text-[10px] uppercase font-bold tracking-[0.2em] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        <Plus size={14} /> Log Vitals
                    </button>
                </form>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="p-3 border border-stone-100 dark:border-stone-900 bg-white/5 space-y-3">
                            <h3 className="text-[8px] uppercase font-bold text-stone-400 border-b border-stone-100 dark:border-stone-900 pb-1 flex items-center gap-1">
                                <TrendingUp size={10} /> Systolic (mmHg)
                            </h3>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="flex flex-col">
                                    <span className="text-[7px] text-stone-500 uppercase">High</span>
                                    <span className="text-xs font-bold font-mono">{stats.systolic.max.systolic}</span>
                                    <span className="text-[6px] uppercase text-stone-400">{stats.systolic.max.position}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[7px] text-stone-500 uppercase">Avg</span>
                                    <span className="text-xs font-bold font-mono">{stats.systolic.avg}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[7px] text-stone-500 uppercase">Low</span>
                                    <span className="text-xs font-bold font-mono">{stats.systolic.min.systolic}</span>
                                    <span className="text-[6px] uppercase text-stone-400">{stats.systolic.min.position}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 border border-stone-100 dark:border-stone-900 bg-white/5 space-y-3">
                            <h3 className="text-[8px] uppercase font-bold text-stone-400 border-b border-stone-100 dark:border-stone-900 pb-1 flex items-center gap-1">
                                <TrendingDown size={10} /> Diastolic (mmHg)
                            </h3>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="flex flex-col">
                                    <span className="text-[7px] text-stone-500 uppercase">High</span>
                                    <span className="text-xs font-bold font-mono">{stats.diastolic.max.diastolic}</span>
                                    <span className="text-[6px] uppercase text-stone-400">{stats.diastolic.max.position}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[7px] text-stone-500 uppercase">Avg</span>
                                    <span className="text-xs font-bold font-mono">{stats.diastolic.avg}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[7px] text-stone-500 uppercase">Low</span>
                                    <span className="text-xs font-bold font-mono">{stats.diastolic.min.diastolic}</span>
                                    <span className="text-[6px] uppercase text-stone-400">{stats.diastolic.min.position}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 border border-stone-100 dark:border-stone-900 bg-white/5 space-y-3">
                            <h3 className="text-[8px] uppercase font-bold text-stone-400 border-b border-stone-100 dark:border-stone-900 pb-1 flex items-center gap-1">
                                <Heart size={10} /> Heart Rate (BPM)
                            </h3>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="flex flex-col">
                                    <span className="text-[7px] text-stone-500 uppercase">High</span>
                                    <span className="text-xs font-bold font-mono">{stats.heartRate.max.heart_rate}</span>
                                    <span className="text-[6px] uppercase text-stone-400">{stats.heartRate.max.position}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[7px] text-stone-500 uppercase">Avg</span>
                                    <span className="text-xs font-bold font-mono">{stats.heartRate.avg}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[7px] text-stone-500 uppercase">Low</span>
                                    <span className="text-xs font-bold font-mono">{stats.heartRate.min.heart_rate}</span>
                                    <span className="text-[6px] uppercase text-stone-400">{stats.heartRate.min.position}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {entries.length > 0 && (
                    <div className="h-64 w-full mb-8 border border-stone-100 dark:border-stone-900 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 113, 108, 0.1)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 8, fill: 'currentColor', opacity: 0.5 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 8, fill: 'currentColor', opacity: 0.5 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--background)',
                                        border: '1px solid rgba(120, 113, 108, 0.2)',
                                        borderRadius: '0px',
                                        fontSize: '9px',
                                        textTransform: 'uppercase',
                                        fontWeight: 'bold'
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '8px', textTransform: 'uppercase', marginTop: '10px' }} />
                                <Line
                                    type="monotone"
                                    dataKey="systolic"
                                    stroke="var(--color-user-a)"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: 'var(--color-user-a)' }}
                                    activeDot={{ r: 5 }}
                                    name="Systolic"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="diastolic"
                                    stroke="var(--color-user-b)"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: 'var(--color-user-b)' }}
                                    activeDot={{ r: 5 }}
                                    name="Diastolic"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="heartRate"
                                    stroke="#10b981"
                                    strokeWidth={1.5}
                                    strokeDasharray="5 5"
                                    dot={{ r: 2, fill: '#10b981' }}
                                    name="Heart Rate"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    <AnimatePresence>
                        {entries.map((entry) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center justify-between p-3 border border-stone-100 dark:border-stone-900 bg-white/5"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-mono text-stone-400">
                                            {new Date(entry.created_at).toLocaleDateString()} {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="text-[8px] uppercase font-bold text-user-a">{entry.position}</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] uppercase text-stone-500">BP</span>
                                            <span className="text-sm font-bold font-mono">{entry.systolic}/{entry.diastolic}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] uppercase text-stone-500">HR</span>
                                            <span className="text-sm font-bold font-mono">{entry.heart_rate}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="text-stone-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
