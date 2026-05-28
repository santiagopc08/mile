'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Heart, Trash2, Plus, TrendingUp, TrendingDown, Clipboard, User, Clock } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { StoreService } from '@/services/storeService';
import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';
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
            .eq('author', profile)
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
        } else {
            const sys = Number(systolic);
            const dia = Number(diastolic);
            const hr = Number(heartRate);
            const isAtypical = sys >= 140 || sys <= 90 || dia >= 90 || dia <= 60 || hr >= 100 || hr <= 55;
            
            if (isAtypical) {
                const target = profile === 'el' ? 'ella' : 'el';
                StoreService.addNotification(target, 'health_alert', 'Se registró una lectura atípica de signos vitales.').catch(err => console.error(err));
            }

            // Clear form
            setSystolic('');
            setDiastolic('');
            setHeartRate('');
            await fetchEntries();
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('blood_pressure').delete().eq('id', id);
        if (error) {
            console.error('Error deleting entry:', error);
        } else {
            setEntries(entries.filter(e => e.id !== id));
        }
    };

    const stats = useMemo(() => {
        if (entries.length === 0) return null;

        const result = entries.reduce((acc, curr) => {
            if (curr.systolic < acc.systolic.min.systolic) acc.systolic.min = curr;
            if (curr.systolic > acc.systolic.max.systolic) acc.systolic.max = curr;
            acc.systolic.sum += curr.systolic;

            if (curr.diastolic < acc.diastolic.min.diastolic) acc.diastolic.min = curr;
            if (curr.diastolic > acc.diastolic.max.diastolic) acc.diastolic.max = curr;
            acc.diastolic.sum += curr.diastolic;

            if (curr.heart_rate < acc.heartRate.min.heart_rate) acc.heartRate.min = curr;
            if (curr.heart_rate > acc.heartRate.max.heart_rate) acc.heartRate.max = curr;
            acc.heartRate.sum += curr.heart_rate;

            return acc;
        }, {
            systolic: { min: entries[0], max: entries[0], sum: 0 },
            diastolic: { min: entries[0], max: entries[0], sum: 0 },
            heartRate: { min: entries[0], max: entries[0], sum: 0 }
        });

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
        return entries.slice().reverse().map(entry => {
            const date = new Date(entry.created_at);
            return {
                name: `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`,
                fullDate: date.toLocaleString(),
                systolic: entry.systolic,
                diastolic: entry.diastolic,
                heartRate: entry.heart_rate,
                position: entry.position
            };
        });
    }, [entries]);

    return (
        <div className="space-y-6 font-mono">
            <div className="geometric-card p-6 border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Activity size={120} />
                </div>
                <AnimatedBrutalistCorners color="var(--color-user-a)" size={12} thickness={1.5} />

                <h2 className="text-[10px] uppercase font-black tracking-[0.3em] mb-8 border-b border-white/5 pb-4 flex justify-between items-center text-user-a">
                    <span className="flex items-center gap-2">
                        <Clipboard size={12} /> Registro de Presión Arterial
                    </span>
                    <span className="text-[8px] opacity-40">ESTADO: ACTIVO</span>
                </h2>

                <form onSubmit={handleAddEntry} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 items-end relative z-10">
                    <div className="space-y-2">
                        <label className="text-[7px] uppercase font-bold text-stone-500 tracking-widest">PRESIÓN MÁXIMA (Sistólica)</label>
                        <input
                            type="number"
                            value={systolic}
                            onChange={e => setSystolic(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="120"
                            className={`w-full bg-black border border-white/10 p-3 text-xs font-bold outline-none focus:border-${accentClass} text-white`}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[7px] uppercase font-bold text-stone-500 tracking-widest">PRESIÓN MÍNIMA (Diastólica)</label>
                        <input
                            type="number"
                            value={diastolic}
                            onChange={e => setDiastolic(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="80"
                            className={`w-full bg-black border border-white/10 p-3 text-xs font-bold outline-none focus:border-${accentClass} text-white`}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[7px] uppercase font-bold text-stone-500 tracking-widest">PULSO / RITMO CARDÍACO</label>
                        <input
                            type="number"
                            value={heartRate}
                            onChange={e => setHeartRate(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="70"
                            className={`w-full bg-black border border-white/10 p-3 text-xs font-bold outline-none focus:border-${accentClass} text-white`}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[7px] uppercase font-bold text-stone-500 tracking-widest">Posición al medir</label>
                        <select
                            value={position}
                            onChange={e => setPosition(e.target.value as any)}
                            className={`w-full bg-black border border-white/10 p-3 text-xs font-bold outline-none focus:border-${accentClass} text-stone-300 appearance-none cursor-pointer`}
                        >
                            <option value="sitting">SENTADO</option>
                            <option value="edge of bed">BORDE CAMA</option>
                            <option value="lied">ACOSTADO</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`md:col-span-4 py-4 text-[10px] uppercase font-black tracking-[0.3em] transition-all flex items-center justify-center gap-2 border mt-2 ${loading
                                ? 'bg-stone-800 text-stone-500 border-stone-800 cursor-not-allowed'
                                : `bg-${accentClass} text-black border-${accentClass}`
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
                                <Plus size={14} /> REGISTRAR LECTURA
                            </>
                        )}
                    </button>
                </form>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                        <div className="p-4 border border-white/5 bg-stone-900/20 space-y-4">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <h3 className="text-[8px] uppercase font-black text-stone-500 tracking-widest flex items-center gap-1">
                                    <Activity size={10} /> MÁXIMA (Sistólica)
                                </h3>
                                <span className="text-[6px] text-stone-600">mmHg</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="flex flex-col">
                                    <span className="text-[6px] text-stone-600 uppercase">MAX</span>
                                    <span className="text-sm font-bold text-white">{stats.systolic.max.systolic}</span>
                                </div>
                                <div className="flex flex-col border-x border-white/5">
                                    <span className="text-[6px] text-stone-600 uppercase">AVG</span>
                                    <span className={`text-sm font-bold text-${accentClass}`} style={{ color: accentColor }}>{stats.systolic.avg}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[6px] text-stone-600 uppercase">MIN</span>
                                    <span className="text-sm font-bold text-white">{stats.systolic.min.systolic}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border border-white/5 bg-stone-900/20 space-y-4">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <h3 className="text-[8px] uppercase font-black text-stone-500 tracking-widest flex items-center gap-1">
                                    <Activity size={10} /> MÍNIMA (Diastólica)
                                </h3>
                                <span className="text-[6px] text-stone-600">mmHg</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="flex flex-col">
                                    <span className="text-[6px] text-stone-600 uppercase">MAX</span>
                                    <span className="text-sm font-bold text-white">{stats.diastolic.max.diastolic}</span>
                                </div>
                                <div className="flex flex-col border-x border-white/5">
                                    <span className="text-[6px] text-stone-600 uppercase">AVG</span>
                                    <span className={`text-sm font-bold text-${accentClass}`} style={{ color: accentColor }}>{stats.diastolic.avg}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[6px] text-stone-600 uppercase">MIN</span>
                                    <span className="text-sm font-bold text-white">{stats.diastolic.min.diastolic}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border border-white/5 bg-stone-900/20 space-y-4">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <h3 className="text-[8px] uppercase font-black text-stone-500 tracking-widest flex items-center gap-1">
                                    <Heart size={10} /> RITMO CARDÍACO
                                </h3>
                                <span className="text-[6px] text-stone-600">BPM</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="flex flex-col">
                                    <span className="text-[6px] text-stone-600 uppercase">MAX</span>
                                    <span className="text-sm font-bold text-white">{stats.heartRate.max.heart_rate}</span>
                                </div>
                                <div className="flex flex-col border-x border-white/5">
                                    <span className="text-[6px] text-stone-600 uppercase">AVG</span>
                                    <span className={`text-sm font-bold text-${accentClass}`} style={{ color: accentColor }}>{stats.heartRate.avg}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[6px] text-stone-600 uppercase">MIN</span>
                                    <span className="text-sm font-bold text-white">{stats.heartRate.min.heart_rate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {entries.length > 0 && (
                    <div className="h-72 w-full mb-10 border border-white/5 bg-black/40 p-2 sm:p-6 relative">
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

                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    <AnimatePresence mode="popLayout">
                        {entries.map((entry) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className={`flex items-center justify-between p-4 border border-white/5 bg-[#0a0a0a] group hover:border-${accentClass}/30 transition-all relative`}
                            >
                                <div className={`absolute top-0 left-0 w-1 h-1 bg-${accentClass} opacity-20 group-hover:opacity-100 transition-opacity`} style={{ backgroundColor: accentColor }} />
                                <div className="grid grid-cols-5 gap-4 items-center flex-1 mr-4">
                                    <div className="flex items-center gap-1.5 text-stone-500">
                                        <Clock size={8} />
                                        <span className="text-[7px] font-bold tracking-widest">
                                            {new Date(entry.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className={`flex items-center gap-1.5 text-${accentClass}`} style={{ color: accentColor }}>
                                        <User size={8} />
                                        <span className="text-[7px] uppercase font-black tracking-[0.2em]">
                                            {entry.author === 'ella' ? 'Ella' : entry.author === 'el' ? 'Él' : entry.author}
                                        </span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-[6px] uppercase font-bold text-stone-600 mb-0.5">PRESIÓN (mmHg)</span>
                                        <span className="text-xs font-black tabular-nums text-white">
                                            {entry.systolic}/{entry.diastolic}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[6px] uppercase font-bold text-stone-600 mb-0.5">PULSO (BPM)</span>
                                        <span className="text-xs font-black tabular-nums text-white">{entry.heart_rate}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[6px] uppercase font-bold text-stone-600 mb-0.5">POSICIÓN</span>
                                        <span className="text-[8px] font-bold text-stone-400 uppercase tracking-tighter">
                                            {POSITION_LABELS[entry.position as keyof typeof POSITION_LABELS] || entry.position}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(entry.id)}
                                    className="p-2 text-stone-800 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-20 group-hover:opacity-100"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
