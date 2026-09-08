import { useState, useMemo, memo } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus } from 'lucide-react';
import { NotificationService } from '@/services/notificationService';
import { ChamferedPanel } from '@/components/ui/ChamferedPanel';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';
import { getPressureCategory } from './utils';
import type { BloodPressureEntry } from './types';

interface Props {
    selectedAuthor: 'ella' | 'el';
    setSelectedAuthor: (author: 'ella' | 'el') => void;
    entries: BloodPressureEntry[];
    onEntryAdded: () => Promise<void>;
}

// ⚡ Bolt Optimization: Wrap component in React.memo() to prevent unnecessary re-renders
export const BloodPressureForm = memo(({ selectedAuthor, setSelectedAuthor, entries, onEntryAdded }: Props) => {
    const authorColor = selectedAuthor === 'ella' ? '#ff4b89' : '#c3f400';
    const authorName = selectedAuthor === 'ella' ? 'MILENA' : 'SANTIAGO';

    const [systolic, setSystolic] = useState<number | ''>('');
    const [diastolic, setDiastolic] = useState<number | ''>('');
    const [heartRate, setHeartRate] = useState<number | ''>('');
    const [position, setPosition] = useState<BloodPressureEntry['position']>('sitting');
    const [loading, setLoading] = useState(false);

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
            await onEntryAdded();
        }
        setLoading(false);
    };

    return (
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
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
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

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-0.5 items-center">
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
    );
});
