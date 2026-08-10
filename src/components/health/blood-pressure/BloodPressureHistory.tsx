import { motion, AnimatePresence } from 'framer-motion';
import { getPressureCategory } from './utils';
import { POSITION_LABELS } from './types';
import type { BloodPressureEntry } from './types';

const TIME_FORMATTER = new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', hour12: false });
const LIST_DATE_FORMATTER = new Intl.DateTimeFormat([], { year: 'numeric', month: '2-digit', day: '2-digit' });

interface Props {
    entries: BloodPressureEntry[];
}

export const BloodPressureHistory = ({ entries }: Props) => {
    return (
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
                    const entryDate = new Date(entry.created_at);
                    const formattedDate = LIST_DATE_FORMATTER.format(entryDate);
                    const formattedTime = TIME_FORMATTER.format(entryDate);

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
    );
};
