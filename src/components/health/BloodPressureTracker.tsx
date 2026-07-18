'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Heart, Plus, Clipboard, User, Clock } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { NotificationService } from '@/services/notificationService';
import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';
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

const POSITION_LABELS = {
    sitting: 'SENTADO',
    'edge of bed': 'BORDE CAMA',
    lied: 'ACOSTADO'
} as const;

interface BloodPressureEntry {
    id: string;
    systolic: number;
    diastolic: number;
    heart_rate: number;
    position: keyof typeof POSITION_LABELS;
    author: string;
    created_at: string;
}

export const BloodPressureTracker = () => {
    const { profile } = useProfile();
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
    const accentHoverBg = profile === 'ella' ? '#ffb595' : '#e1ff80';
    const [entries, setEntries] = useState<BloodPressureEntry[]>([]);
    const [systolic, setSystolic] = useState<number | ''>('');
    const [diastolic, setDiastolic] = useState<number | ''>('');
    const [heartRate, setHeartRate] = useState<number | ''>('');
    const [position, setPosition] = useState<BloodPressureEntry['position']>('sitting');
    const [loading, setLoading] = useState(false);

    const fetchEntries = useCallback(async () => {
        if (!profile) return;

        const { data, error } = await supabase
            .from('blood_pressure')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching blood pressure entries:', error);
            return;
        }
        if (data) setEntries(data);
    }, [profile]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (systolic === '' || diastolic === '' || heartRate === '') return;

        setLoading(true);

        // Simple duplicate prevention: check if last entry is identical and within 30 seconds
        const lastEntry = entries[0];
        if (lastEntry) {
            const timeDiff = Date.now() - new Date(lastEntry.created_at).getTime();
            if (
                timeDiff < 30000 &&
                lastEntry.systolic === Number(systolic) &&
                lastEntry.diastolic === Number(diastolic) &&
                lastEntry.heart_rate === Number(heartRate) &&
                lastEntry.position === position
            ) {
                console.warn('Duplicate entry detected. Ignoring.');
                setLoading(false);
                return;
            }
        }

        const { error } = await supabase.from('blood_pressure').insert({
            systolic: Number(systolic),
            diastolic: Number(diastolic),
            heart_rate: Number(heartRate),
            position,
            author: profile || 'el'
        });

        if (error) {
            console.error('Error saving blood pressure entry:', error);
            sound.playError();
            haptics.triggerError();
        } else {
            sound.playSave();
            haptics.triggerSave();
            const sys = Number(systolic);
            const dia = Number(diastolic);
            const hr = Number(heartRate);
            const isAtypical = sys >= 140 || sys <= 90 || dia >= 90 || dia <= 60 || hr >= 100 || hr <= 55;

            if (isAtypical) {
                const target = profile === 'el' ? 'ella' : 'el';
                NotificationService.addNotification(target, 'health_alert', 'Se registró una lectura atípica de signos vitales.').catch(err => console.error(err));
            }

            // Clear form
            setSystolic('');
            setDiastolic('');
            setHeartRate('');
            await fetchEntries();
        }
        setLoading(false);
    };

    const stats = useMemo(() => {
        if (entries.length === 0) return null;

        const result = {
            systolic: { min: entries[0], max: entries[0], sum: 0 },
            diastolic: { min: entries[0], max: entries[0], sum: 0 },
            heartRate: { min: entries[0], max: entries[0], sum: 0 }
        };

        // ⚡ Bolt Optimization: Replace entries.reduce() with a single pass O(N) loop
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

    const chartData = useMemo(() => {
        // ⚡ Bolt Optimization: Replace entries.slice().reverse().map() with a single backward loop
        const data = [];
        for (let i = entries.length - 1; i >= 0; i--) {
            const entry = entries[i];
            const date = new Date(entry.created_at);
            data.push({
                name: `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`,
                fullDate: date.toLocaleString(),
                systolic: entry.systolic,
                diastolic: entry.diastolic,
                heartRate: entry.heart_rate,
                position: entry.position
            });
        }
        return data;
    }, [entries]);

    return (
        <div className="space-y-6 font-mono">
            <div className="relative border border-white/10 bg-[#0a0a0a] p-6 pl-10 sm:pl-12 rounded-none overflow-hidden">
                {/* Solid Left Accent Stripe */}
                <div className="absolute left-0 top-0 bottom-0 w-[5px]" style={{ backgroundColor: accentColor }} />

                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Activity size={120} className="stroke-[1.5]" />
                </div>
                <AnimatedBrutalistCorners color={accentColor} size={12} thickness={1.5} />

                <h2 className="text-[10px] uppercase font-black tracking-[0.3em] mb-8 border-b border-white/5 pb-4 flex justify-between items-center text-white font-sans">
                    <span className="flex items-center gap-2">
                        <Clipboard size={12} className="stroke-[1.5]" /> Registro de Presión Arterial
                    </span>
                    <span className="text-[8px] opacity-40">ESTADO: ACTIVO</span>
                </h2>

                <form onSubmit={handleAddEntry} className="grid grid-cols-2 md:grid-cols-12 gap-4 mb-10 items-end relative z-10 bg-black/20 p-4 border border-white/5 rounded-none">
                    <div className="col-span-1 md:col-span-3 space-y-2">
                        <label className="text-[7px] uppercase font-bold text-stone-500 tracking-widest flex items-center gap-1">
                            <Activity size={8} className="stroke-[1.5]" /> PRESIÓN MÁXIMA (Sistólica)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={systolic}
                                onChange={e => setSystolic(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="120"
                                className={`w-full bg-black border border-white/10 p-3 pr-10 text-xs font-bold outline-none focus:border-${accentClass} text-white rounded-none transition-all`}
                                required
                            />
                            <span className="absolute right-3 top-3 text-[7px] font-bold text-stone-600">mmHg</span>
                        </div>
                    </div>
                    <div className="col-span-1 md:col-span-3 space-y-2">
                        <label className="text-[7px] uppercase font-bold text-stone-500 tracking-widest flex items-center gap-1">
                            <Activity size={8} className="stroke-[1.5]" /> PRESIÓN MÍNIMA (Diastólica)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={diastolic}
                                onChange={e => setDiastolic(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="80"
                                className={`w-full bg-black border border-white/10 p-3 pr-10 text-xs font-bold outline-none focus:border-${accentClass} text-white rounded-none transition-all`}
                                required
                            />
                            <span className="absolute right-3 top-3 text-[7px] font-bold text-stone-600">mmHg</span>
                        </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-[7px] uppercase font-bold text-stone-500 tracking-widest flex items-center gap-1">
                            <Heart size={8} className="stroke-[1.5]" /> PULSO
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={heartRate}
                                onChange={e => setHeartRate(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="70"
                                className={`w-full bg-black border border-white/10 p-3 pr-10 text-xs font-bold outline-none focus:border-${accentClass} text-white rounded-none transition-all`}
                                required
                            />
                            <span className="absolute right-3 top-3 text-[7px] font-bold text-stone-600">BPM</span>
                        </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-[7px] uppercase font-bold text-stone-500 tracking-widest">POSICIÓN AL MEDIR</label>
                        <select
                            value={position}
                            onChange={e => setPosition(e.target.value as any)}
                            className={`w-full bg-black border border-white/10 p-3 text-xs font-bold outline-none focus:border-${accentClass} text-stone-300 appearance-none cursor-pointer rounded-none transition-all`}
                        >
                            <option value="sitting">SENTADO</option>
                            <option value="edge of bed">BORDE CAMA</option>
                            <option value="lied">ACOSTADO</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`col-span-2 md:col-span-2 py-3.5 text-[9px] uppercase font-black tracking-[0.25em] transition-all flex items-center justify-center gap-2 border rounded-none cursor-pointer ${loading
                            ? 'bg-stone-800 text-stone-500 border-stone-800 cursor-not-allowed'
                            : `bg-${accentClass} text-black border-${accentClass} hover:opacity-90`
                            }`}
                        style={!loading ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
                    >
                        {loading ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                            />
                        ) : (
                            <>
                                <Plus size={12} className="stroke-[2]" /> REGISTRAR
                            </>
                        )}
                    </button>
                </form>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                        <div className="p-4 border border-white/10 bg-stone-900/20 space-y-4 rounded-none">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <h3 className="text-[8px] uppercase font-black text-stone-500 tracking-widest flex items-center gap-1">
                                    <Activity size={10} className="stroke-[1.5]" /> MÁXIMA (Sistólica)
                                </h3>
                                <span className="text-[6px] text-stone-600">mmHg</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="flex flex-col">
                                    <span className="text-[6px] text-stone-600 uppercase">MAX</span>
                                    <span className="text-sm font-bold text-white tracking-tighter">{stats.systolic.max.systolic}</span>
                                </div>
                                <div className="flex flex-col border-x border-white/5">
                                    <span className="text-[6px] text-stone-600 uppercase">AVG</span>
                                    <span className={`text-sm font-bold tracking-tighter text-${accentClass}`} style={{ color: accentColor }}>{stats.systolic.avg}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[6px] text-stone-600 uppercase">MIN</span>
                                    <span className="text-sm font-bold text-white tracking-tighter">{stats.systolic.min.systolic}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border border-white/10 bg-stone-900/20 space-y-4 rounded-none">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <h3 className="text-[8px] uppercase font-black text-stone-500 tracking-widest flex items-center gap-1">
                                    <Activity size={10} className="stroke-[1.5]" /> MÍNIMA (Diastólica)
                                </h3>
                                <span className="text-[6px] text-stone-600">mmHg</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="flex flex-col">
                                    <span className="text-[6px] text-stone-600 uppercase">MAX</span>
                                    <span className="text-sm font-bold text-white tracking-tighter">{stats.diastolic.max.diastolic}</span>
                                </div>
                                <div className="flex flex-col border-x border-white/5">
                                    <span className="text-[6px] text-stone-600 uppercase">AVG</span>
                                    <span className={`text-sm font-bold tracking-tighter text-${accentClass}`} style={{ color: accentColor }}>{stats.diastolic.avg}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[6px] text-stone-600 uppercase">MIN</span>
                                    <span className="text-sm font-bold text-white tracking-tighter">{stats.diastolic.min.diastolic}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border border-white/10 bg-stone-900/20 space-y-4 rounded-none">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <h3 className="text-[8px] uppercase font-black text-stone-500 tracking-widest flex items-center gap-1">
                                    <Heart size={10} className="stroke-[1.5]" /> RITMO CARDÍACO
                                </h3>
                                <span className="text-[6px] text-stone-600">BPM</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="flex flex-col">
                                    <span className="text-[6px] text-stone-600 uppercase">MAX</span>
                                    <span className="text-sm font-bold text-white tracking-tighter">{stats.heartRate.max.heart_rate}</span>
                                </div>
                                <div className="flex flex-col border-x border-white/5">
                                    <span className="text-[6px] text-stone-600 uppercase">AVG</span>
                                    <span className={`text-sm font-bold tracking-tighter text-${accentClass}`} style={{ color: accentColor }}>{stats.heartRate.avg}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[6px] text-stone-600 uppercase">MIN</span>
                                    <span className="text-sm font-bold text-white tracking-tighter">{stats.heartRate.min.heart_rate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {entries.length > 0 && (
                    <div className="h-72 w-full mb-10 border border-white/10 bg-black/40 p-2 sm:p-6 relative rounded-none">
                        <AnimatedBrutalistCorners color={accentColor} />
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 7, fill: '#555', letterSpacing: '0.1em' }}
                                />
                                <YAxis width={15}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 7, fill: '#555' }}
                                />
                                <Tooltip
                                    cursor={{ stroke: 'rgba(255, 112, 32, 0.2)', strokeWidth: 1 }}
                                    contentStyle={{
                                        backgroundColor: '#0a0a0a',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '0px',
                                        fontSize: '8px',
                                        textTransform: 'uppercase',
                                        fontWeight: 'black',
                                        padding: '12px'
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '7px', textTransform: 'uppercase', marginTop: '20px', letterSpacing: '0.2em' }} />
                                <Line
                                    type="monotone"
                                    dataKey="systolic"
                                    stroke="var(--color-user-a)"
                                    strokeWidth={2}
                                    dot={{ r: 2, fill: 'var(--color-user-a)' }}
                                    activeDot={{ r: 4 }}
                                    name="Presión Máxima (Sistólica)"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="diastolic"
                                    stroke="var(--color-user-b)"
                                    strokeWidth={2}
                                    dot={{ r: 2, fill: 'var(--color-user-b)' }}
                                    activeDot={{ r: 4 }}
                                    name="Presión Mínima (Diastólica)"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="heartRate"
                                    stroke="#555"
                                    strokeWidth={1}
                                    strokeDasharray="4 4"
                                    dot={false}
                                    name="Ritmo Cardíaco"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    <AnimatePresence mode="popLayout">
                        {entries.map((entry) => {
                            const entryIsElla = entry.author === 'ella';
                            const authorAccent = entryIsElla ? 'var(--color-user-a)' : '#00dbe9';
                            const authorName = entryIsElla ? 'MILENA' : 'SANTIAGO';
                            const formattedDate = new Date(entry.created_at).toLocaleDateString([], {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                            });
                            const formattedTime = new Date(entry.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            });

                            return (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="relative overflow-hidden border border-white/5 bg-[#0c0c0c] hover:bg-[#121212] py-2 px-3 pl-8 flex items-center justify-between gap-3 transition-all rounded-none group"
                                >
                                    {/* Left lateral author stripe */}
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: authorAccent }} />

                                    <div className="flex flex-row items-center justify-between w-full flex-1 mr-2 relative z-10">
                                        {/* 1. Timestamp */}
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[5.5px] uppercase font-bold text-stone-600 tracking-wider flex items-center gap-1">
                                                <Clock size={7} className="stroke-[1.5]" /> REGISTRO
                                            </span>
                                            <span className="text-[8px] font-bold text-stone-400 tabular-nums">
                                                {formattedDate} {formattedTime}
                                            </span>
                                        </div>

                                        {/* 2. Author */}
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[5.5px] uppercase font-bold text-stone-600 tracking-wider flex items-center gap-1">
                                                <User size={7} className="stroke-[1.5]" /> OPERADOR
                                            </span>
                                            <span className="text-[8px] font-black tracking-wider" style={{ color: authorAccent }}>
                                                {authorName}
                                            </span>
                                        </div>

                                        {/* 3. Pressure */}
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[5.5px] uppercase font-bold text-stone-600 tracking-wider">PRESIÓN</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-[11px] font-black tabular-nums text-white">
                                                    {entry.systolic}/{entry.diastolic}
                                                </span>
                                                <span className="text-[6.5px] font-bold text-stone-500 uppercase">mmHg</span>
                                            </div>
                                        </div>

                                        {/* 4. Pulses */}
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[5.5px] uppercase font-bold text-stone-600 tracking-wider">PULSO</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-[11px] font-black tabular-nums text-white">
                                                    {entry.heart_rate}
                                                </span>
                                                <span className="text-[6.5px] font-bold text-stone-500 uppercase">BPM</span>
                                            </div>
                                        </div>

                                        {/* 5. Position */}
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[5.5px] uppercase font-bold text-stone-600 tracking-wider">POSICIÓN</span>
                                            <span className="text-[7px] font-bold text-stone-400 uppercase tracking-wide border border-white/5 bg-white/[0.01] px-1.5 py-0.5 self-start rounded-none">
                                                {POSITION_LABELS[entry.position as keyof typeof POSITION_LABELS] || entry.position}
                                            </span>
                                        </div>
                                    </div>

                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
