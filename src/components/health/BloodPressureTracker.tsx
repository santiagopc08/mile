'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Heart, Plus, Clipboard, User, Clock, Check, SlidersHorizontal } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { NotificationService } from '@/services/notificationService';
import { ChamferedPanel } from '@/components/ui/ChamferedPanel';
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

// Clinical evaluation helper based on AHA / ESC guidelines
const getPressureCategory = (sys: number | '', dia: number | '') => {
    if (typeof sys !== 'number' || typeof dia !== 'number' || sys <= 0 || dia <= 0) return null;

    if (sys > 180 || dia > 120) {
        return {
            label: 'CRISIS HIPERTENSIVA',
            color: '#f43f5e',
            bg: 'bg-rose-950/40 text-rose-300 border-rose-500/40',
            badge: 'CRISIS',
            icon: '🚨',
        };
    }
    if (sys >= 140 || dia >= 90) {
        return {
            label: 'HIPERTENSIÓN ETAPA 2',
            color: '#fb7185',
            bg: 'bg-rose-950/30 text-rose-300 border-rose-500/30',
            badge: 'ETAPA 2',
            icon: '⚠️',
        };
    }
    if (sys >= 130 || dia >= 80) {
        return {
            label: 'HIPERTENSIÓN ETAPA 1',
            color: '#f97316',
            bg: 'bg-amber-950/30 text-amber-300 border-amber-500/30',
            badge: 'ETAPA 1',
            icon: '⚡',
        };
    }
    if (sys >= 120 && dia < 80) {
        return {
            label: 'PRESIÓN ELEVADA',
            color: '#f59e0b',
            bg: 'bg-amber-950/20 text-amber-200 border-amber-500/20',
            badge: 'ELEVADA',
            icon: '📈',
        };
    }
    if (sys < 90 || dia < 60) {
        return {
            label: 'HIPOTENSIÓN (BAJA)',
            color: '#38bdf8',
            bg: 'bg-sky-950/30 text-sky-300 border-sky-500/30',
            badge: 'BAJA',
            icon: '📉',
        };
    }
    return {
        label: 'PRESIÓN ÓPTIMA / NORMAL',
        color: '#10b981',
        bg: 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30',
        badge: 'ÓPTIMA',
        icon: '✓',
    };
};

export const BloodPressureTracker = () => {
    const { profile } = useProfile();
    const [selectedAuthor, setSelectedAuthor] = useState<'ella' | 'el'>(profile === 'ella' ? 'ella' : 'el');

    useEffect(() => {
        if (profile) setSelectedAuthor(profile === 'ella' ? 'ella' : 'el');
    }, [profile]);

    const authorColor = selectedAuthor === 'ella' ? '#ff4b89' : '#c3f400';
    const authorName = selectedAuthor === 'ella' ? 'MILENA' : 'SANTIAGO';

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

    // Live classification based on inputs
    const liveDiagnosis = useMemo(() => {
        return getPressureCategory(systolic, diastolic);
    }, [systolic, diastolic]);

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (systolic === '' || diastolic === '' || heartRate === '') return;

        setLoading(true);

        // Simple duplicate prevention
        const lastEntry = entries[0];
        if (lastEntry) {
            const timeDiff = Date.now() - new Date(lastEntry.created_at).getTime();
            if (
                timeDiff < 30000 &&
                lastEntry.systolic === Number(systolic) &&
                lastEntry.diastolic === Number(diastolic) &&
                lastEntry.heart_rate === Number(heartRate) &&
                lastEntry.position === position &&
                lastEntry.author === selectedAuthor
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
            author: selectedAuthor
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
                const target = selectedAuthor === 'el' ? 'ella' : 'el';
                const reporter = selectedAuthor === 'el' ? 'Santiago' : 'Milena';
                NotificationService.addNotification(
                    target,
                    'health_alert',
                    `⚠️ Lectura atípica registrada para ${reporter}: ${sys}/${dia} mmHg · ${hr} BPM.`
                ).catch(err => console.error(err));
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
                position: entry.position,
                author: entry.author
            });
        }
        return data;
    }, [entries]);

    return (
        <div className="space-y-5 font-mono">
            {/* Compact Redesigned Blood Pressure Form */}
            <ChamferedPanel
                accentColor={authorColor}
                notchSize={14}
                label={`${authorName} · REGISTRO DE PRESIÓN`}
                headerRight={
                    <div className="flex items-center gap-1">
                        <span className="text-[7px] font-mono uppercase text-stone-500 mr-1 hidden xs:inline">
                            Operador:
                        </span>
                        <button
                            type="button"
                            onClick={() => setSelectedAuthor('ella')}
                            className={`min-h-[24px] px-2 py-0.5 text-[7.5px] font-mono font-black uppercase tracking-wider border transition-all ${
                                selectedAuthor === 'ella'
                                    ? 'border-[#ff4b89] bg-[#ff4b89] text-black shadow-[0_0_8px_rgba(255,75,137,0.4)]'
                                    : 'border-white/10 bg-black/40 text-stone-400 hover:text-white'
                            }`}
                        >
                            Milena
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedAuthor('el')}
                            className={`min-h-[24px] px-2 py-0.5 text-[7.5px] font-mono font-black uppercase tracking-wider border transition-all ${
                                selectedAuthor === 'el'
                                    ? 'border-[#c3f400] bg-[#c3f400] text-black shadow-[0_0_8px_rgba(195,244,0,0.4)]'
                                    : 'border-white/10 bg-black/40 text-stone-400 hover:text-white'
                            }`}
                        >
                            Santiago
                        </button>
                    </div>
                }
                className="!p-3.5 sm:!p-4 space-y-3"
            >
                <form onSubmit={handleAddEntry} className="space-y-3">
                    {/* Compact Inputs Grid: Systolic, Diastolic, Pulse */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {/* Sistólica (MÁX) */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-[7.5px] font-mono uppercase font-bold text-stone-400 tracking-wider">
                                    MÁX (SYS)
                                </label>
                                <span className="text-[6.5px] font-mono text-stone-600 font-bold">mmHg</span>
                            </div>
                            <input
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={systolic}
                                onChange={e => setSystolic(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="120"
                                className="w-full h-[40px] bg-black/80 border border-white/15 px-2.5 text-center text-lg sm:text-xl font-black text-white outline-none focus:border-[#ff4b89] transition-all tabular-nums"
                                required
                            />
                        </div>

                        {/* Diastólica (MÍN) */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-[7.5px] font-mono uppercase font-bold text-stone-400 tracking-wider">
                                    MÍN (DIA)
                                </label>
                                <span className="text-[6.5px] font-mono text-stone-600 font-bold">mmHg</span>
                            </div>
                            <input
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={diastolic}
                                onChange={e => setDiastolic(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="80"
                                className="w-full h-[40px] bg-black/80 border border-white/15 px-2.5 text-center text-lg sm:text-xl font-black text-white outline-none focus:border-[#c3f400] transition-all tabular-nums"
                                required
                            />
                        </div>

                        {/* Pulso (BPM) */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-[7.5px] font-mono uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1">
                                    <Heart size={8} className="text-rose-400" /> PULSO
                                </label>
                                <span className="text-[6.5px] font-mono text-stone-600 font-bold">BPM</span>
                            </div>
                            <input
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={heartRate}
                                onChange={e => setHeartRate(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="72"
                                className="w-full h-[40px] bg-black/80 border border-white/15 px-2.5 text-center text-lg sm:text-xl font-black text-white outline-none focus:border-rose-400 transition-all tabular-nums"
                                required
                            />
                        </div>
                    </div>

                    {/* Live Diagnostic HUD Strip */}
                    <AnimatePresence mode="wait">
                        {liveDiagnosis && (
                            <motion.div
                                initial={{ opacity: 0, y: -2 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -2 }}
                                className={`px-2.5 py-1.5 border flex items-center justify-between gap-2 text-[8px] font-mono ${liveDiagnosis.bg}`}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span>{liveDiagnosis.icon}</span>
                                    <span className="font-bold uppercase tracking-wider">{liveDiagnosis.label}</span>
                                </div>
                                <span
                                    className="text-[7px] font-black uppercase px-1.5 py-0.5 border shrink-0"
                                    style={{ borderColor: liveDiagnosis.color, color: liveDiagnosis.color }}
                                >
                                    {liveDiagnosis.badge}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Bottom Row: Position Selector & Register CTA in one clean line */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-0.5 items-center">
                        {/* Position Segmented Buttons */}
                        <div className="sm:col-span-8 grid grid-cols-3 gap-1">
                            {(
                                [
                                    { id: 'sitting' as const, label: 'SENTADO', icon: '🪑' },
                                    { id: 'edge of bed' as const, label: 'BORDE CAMA', icon: '🛏️' },
                                    { id: 'lied' as const, label: 'ACOSTADO', icon: '🛌' }
                                ]
                            ).map(pos => {
                                const isActive = position === pos.id;
                                return (
                                    <button
                                        key={pos.id}
                                        type="button"
                                        onClick={() => {
                                            setPosition(pos.id);
                                            sound.playTick();
                                            haptics.triggerTick();
                                        }}
                                        className={`min-h-[34px] px-1.5 py-1 flex items-center justify-center gap-1 text-[7.5px] font-mono font-bold uppercase border transition-all ${
                                            isActive
                                                ? 'border-white bg-white text-black font-black'
                                                : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/20 hover:text-white'
                                        }`}
                                    >
                                        <span className="text-[10px]">{pos.icon}</span>
                                        <span className="truncate">{pos.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Submit Button */}
                        <div className="sm:col-span-4">
                            <button
                                type="submit"
                                disabled={loading || systolic === '' || diastolic === '' || heartRate === ''}
                                className={`w-full min-h-[34px] px-3 py-1 text-[8.5px] font-mono uppercase font-black tracking-wider transition-all flex items-center justify-center gap-1.5 border cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${
                                    loading
                                        ? 'bg-stone-800 text-stone-500 border-stone-800'
                                        : 'text-black hover:opacity-90'
                                }`}
                                style={
                                    !loading && systolic !== '' && diastolic !== '' && heartRate !== ''
                                        ? { backgroundColor: authorColor, borderColor: authorColor }
                                        : {}
                                }
                            >
                                {loading ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full"
                                    />
                                ) : (
                                    <>
                                        <Plus size={12} strokeWidth={3} />
                                        <span>REGISTRAR</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </ChamferedPanel>

            {/* Statistics Summary Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
                    {/* Systolic Stat */}
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

                    {/* Diastolic Stat */}
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

                    {/* Heart Rate Stat */}
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
            )}

            {/* Historical Trend Chart */}
            {entries.length > 0 && (
                <div className="border border-white/10 bg-black/60 p-3 sm:p-4 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-[8.5px] font-mono uppercase font-bold tracking-wider text-stone-300 flex items-center gap-1.5">
                            <Activity size={11} /> TENDENCIA CRONOLÓGICA
                        </span>
                        <span className="text-[7px] font-mono text-stone-500 tabular-nums">
                            {entries.length} REGISTROS
                        </span>
                    </div>

                    <div className="h-56 sm:h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 7, fill: '#888', letterSpacing: '0.05em' }}
                                />
                                <YAxis
                                    width={22}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 7, fill: '#888' }}
                                />
                                <Tooltip
                                    cursor={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1 }}
                                    contentStyle={{
                                        backgroundColor: '#0a0a0a',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        borderRadius: '0px',
                                        fontSize: '8.5px',
                                        fontFamily: 'monospace',
                                        textTransform: 'uppercase',
                                        padding: '8px'
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '7px', textTransform: 'uppercase', marginTop: '8px', letterSpacing: '0.1em' }} />
                                <Line
                                    type="monotone"
                                    dataKey="systolic"
                                    stroke="#ff4b89"
                                    strokeWidth={2}
                                    dot={{ r: 2, fill: '#ff4b89' }}
                                    activeDot={{ r: 4 }}
                                    name="Sistólica (Máx)"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="diastolic"
                                    stroke="#c3f400"
                                    strokeWidth={2}
                                    dot={{ r: 2, fill: '#c3f400' }}
                                    activeDot={{ r: 4 }}
                                    name="Diastólica (Mín)"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="heartRate"
                                    stroke="#60a5fa"
                                    strokeWidth={1.5}
                                    strokeDasharray="4 4"
                                    dot={{ r: 2, fill: '#60a5fa' }}
                                    name="Pulso (BPM)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Historical Entries Log */}
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-1.5">
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-stone-400">
                        HISTORIAL DE LECTURAS
                    </span>
                    <span className="text-[7px] font-mono text-stone-500">
                        ÚLTIMOS REGISTROS
                    </span>
                </div>

                <AnimatePresence mode="popLayout">
                    {entries.map(entry => {
                        const entryIsElla = entry.author === 'ella';
                        const itemAuthorAccent = entryIsElla ? '#ff4b89' : '#c3f400';
                        const itemAuthorName = entryIsElla ? 'MILENA' : 'SANTIAGO';
                        const diag = getPressureCategory(entry.systolic, entry.diastolic);
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
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="relative overflow-hidden border border-white/10 bg-black/60 hover:bg-black/80 py-2 px-3 pl-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 transition-all group"
                            >
                                {/* Left lateral author stripe */}
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                                    style={{ backgroundColor: itemAuthorAccent }}
                                />

                                <div className="flex items-center justify-between w-full sm:w-auto gap-3 flex-1">
                                    {/* Timestamp & Operator */}
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex flex-col">
                                            <span className="text-[6.5px] uppercase font-bold text-stone-500 tracking-wider">
                                                {formattedDate} · {formattedTime}
                                            </span>
                                            <span
                                                className="text-[8.5px] font-black tracking-wider"
                                                style={{ color: itemAuthorAccent }}
                                            >
                                                {itemAuthorName}
                                            </span>
                                        </div>

                                        <span className="text-[7px] font-bold text-stone-400 uppercase tracking-wide border border-white/10 bg-white/[0.02] px-1.5 py-0.5">
                                            {POSITION_LABELS[entry.position as keyof typeof POSITION_LABELS] || entry.position}
                                        </span>
                                    </div>

                                    {/* Pressure & Pulse Numbers */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-end sm:items-start">
                                            <span className="text-[6px] uppercase font-bold text-stone-500">PRESIÓN</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xs sm:text-sm font-black tabular-nums text-white">
                                                    {entry.systolic}/{entry.diastolic}
                                                </span>
                                                <span className="text-[6.5px] font-bold text-stone-500">mmHg</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end sm:items-start">
                                            <span className="text-[6px] uppercase font-bold text-stone-500">PULSO</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xs sm:text-sm font-black tabular-nums text-rose-300">
                                                    {entry.heart_rate}
                                                </span>
                                                <span className="text-[6.5px] font-bold text-stone-500">BPM</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Category Badge */}
                                {diag && (
                                    <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                                        <span
                                            className="text-[7px] font-black uppercase px-1.5 py-0.5 border"
                                            style={{ borderColor: `${diag.color}50`, color: diag.color, backgroundColor: `${diag.color}15` }}
                                        >
                                            {diag.badge}
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};
