'use client';

import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, Edit3, Check, Heart, Trophy } from 'lucide-react';

export function TransparencyDashboard() {
    const { data, isLoading, updateData } = useStore();
    const { profile } = useProfile();
    const [newText, setNewText] = useState('');

    if (isLoading || !data) {
        return <div className="w-full flex justify-center items-center min-h-[400px] text-stone-500 font-light">Cargando compromisos...</div>;
    }

    const { commitments, victoriesEl, victoriesElla, audioStats, dailyProgress } = data;

    const toggleCommitment = async (id: string) => {
        const updatedCommitments = commitments.map((c: any) =>
            c.id === id ? { ...c, completed: !c.completed } : c
        );
        await updateData({ commitments: updatedCommitments });
    };

    const handleAddVictory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newText.trim() || !profile) return;

        const isEl = profile === 'el';
        const victory = {
            id: Date.now().toString(),
            text: newText.trim(),
            created_at: new Date().toISOString(),
            author: profile
        };

        if (isEl) {
            await updateData({ victoriesEl: [victory, ...victoriesEl] });
        } else {
            await updateData({ victoriesElla: [victory, ...victoriesElla] });
        }
        setNewText('');
    };

    const StickyNote = ({ victory, type }: { victory: any, type: 'el' | 'ella' }) => {
        const rotation = Math.random() * 4 - 2;
        const dateStr = victory.created_at ? new Intl.DateTimeFormat('es-CO', { month: 'short', day: 'numeric' }).format(new Date(victory.created_at)) : 'Hoy';

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                style={{ rotate: `${rotation}deg` }}
                className={`w-full p-6 rounded-sm shadow-sm aspect-square flex flex-col items-center justify-center text-center border transition-transform hover:scale-105 hover:shadow-md cursor-default ${type === 'el'
                        ? 'bg-amber-50/90 dark:bg-yellow-900/20 border-amber-200/50 dark:border-yellow-700/20'
                        : 'bg-rose-50/90 dark:bg-rose-900/20 border-rose-200/50 dark:border-rose-700/20'
                    }`}
            >
                <div className="flex-1 flex items-center">
                    <p className={`font-caveat text-2xl leading-snug ${type === 'el' ? 'text-amber-900 dark:text-amber-100' : 'text-rose-900 dark:text-rose-100'}`}>
                        {victory.text}
                    </p>
                </div>
                <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase mt-4 opacity-70">
                    {dateStr}
                </p>
            </motion.div>
        );
    };

    return (
        <div id="dashboard" className="w-full max-w-5xl mx-auto flex flex-col items-center space-y-12">

            {/* Overview Stats */}
            <div className="w-full flex flex-col sm:flex-row justify-center gap-6 mb-8">
                <div className="flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 flex items-center gap-6 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-earth-soft/20 text-earth-dark dark:text-earth-soft flex items-center justify-center shrink-0">
                        <CalendarDays className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-4xl font-light text-stone-800 dark:text-stone-100 flex items-baseline gap-2">
                            {audioStats.daysTracking} <span className="text-lg font-normal text-stone-500">días</span>
                        </p>
                        <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">trabajando en nuestra mejor versión</p>
                    </div>
                </div>

                <div className="flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 flex items-center gap-6 shadow-sm">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-earth-base/10 text-earth-base flex items-center justify-center">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">Última actualización</p>
                        <p className="text-stone-800 dark:text-stone-100 font-medium">{audioStats.lastUpdate}</p>
                    </div>
                </div>
            </div>

            <div className="w-full grid lg:grid-cols-3 gap-8">
                {/* Commitments list */}
                <section className="lg:col-span-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2rem] p-6 shadow-sm h-fit">
                    <h3 className="text-xl font-light text-stone-800 dark:text-stone-200 mb-6 flex items-center gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
                        Compromisos Diarios
                    </h3>

                    {dailyProgress && (
                        <div className="mb-8 space-y-4">
                            <div>
                                <div className="flex justify-between text-[10px] uppercase tracking-wider text-stone-400 mb-1">
                                    <span>Ayer</span>
                                    <span>{dailyProgress.yesterdayCompleted}/{dailyProgress.yesterdayTotal}</span>
                                </div>
                                <div className="w-full h-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-stone-300 dark:bg-stone-600 rounded-full transition-all duration-1000"
                                        style={{ width: `${(dailyProgress.yesterdayCompleted / (dailyProgress.yesterdayTotal || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-earth-dark dark:text-earth-soft mb-1">
                                    <span>Hoy</span>
                                    <span>{dailyProgress.todayCompleted}/{dailyProgress.todayTotal}</span>
                                </div>
                                <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-earth-base rounded-full transition-all duration-500"
                                        style={{ width: `${(dailyProgress.todayCompleted / (dailyProgress.todayTotal || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <ul className="space-y-3">
                        {commitments.map((commitment) => (
                            <li
                                key={commitment.id}
                                onClick={() => toggleCommitment(commitment.id)}
                                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${commitment.completed
                                    ? 'bg-stone-50 dark:bg-stone-800/30 opacity-60'
                                    : 'bg-stone-50 hover:bg-stone-100 dark:bg-stone-800/50 dark:hover:bg-stone-800'
                                    }`}
                            >
                                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${commitment.completed
                                    ? 'bg-earth-base border-earth-base text-white'
                                    : 'border-stone-300 dark:border-stone-600'
                                    }`}>
                                    {commitment.completed && <Check className="w-3 h-3" />}
                                </div>
                                <span className={`text-base font-light transition-all ${commitment.completed
                                    ? 'text-stone-400 dark:text-stone-500 line-through'
                                    : 'text-stone-700 dark:text-stone-300'
                                    }`}>
                                    {commitment.text}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Victories & Felicitaciones Columns */}
                <section className="lg:col-span-2 space-y-8">
                    {/* Input for the active profile */}
                    {profile && (
                        <form onSubmit={handleAddVictory} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-[2rem] p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-xl ${profile === 'el' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {profile === 'el' ? <Trophy className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                                </div>
                                <h3 className="text-xl font-light text-stone-800 dark:text-stone-200">
                                    {profile === 'el' ? '¿Qué victoria lograste hoy?' : '¿A quién quieres felicitar?'}
                                </h3>
                            </div>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newText}
                                    onChange={(e) => setNewText(e.target.value)}
                                    placeholder={profile === 'el' ? "Escribe tu victoria..." : "Escribe tu felicitación..."}
                                    className="flex-1 bg-stone-50 dark:bg-stone-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-earth-base"
                                />
                                <button
                                    type="submit"
                                    disabled={!newText.trim()}
                                    className={`px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 ${profile === 'el' ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-rose-600 text-white hover:bg-rose-700'
                                        }`}
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* El Column */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                <h4 className="text-lg font-light text-stone-800 dark:text-stone-200 uppercase tracking-widest">Victorias</h4>
                            </div>
                            <div className="grid gap-4">
                                {victoriesEl.length > 0 ? (
                                    victoriesEl.map((v: any) => <StickyNote key={v.id} victory={v} type="el" />)
                                ) : (
                                    <p className="text-center text-stone-400 py-10 font-light italic">Sin victorias aún...</p>
                                )}
                            </div>
                        </div>

                        {/* Ella Column */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <Heart className="w-5 h-5 text-rose-500" />
                                <h4 className="text-lg font-light text-stone-800 dark:text-stone-200 uppercase tracking-widest">Felicitaciones</h4>
                            </div>
                            <div className="grid gap-4">
                                {victoriesElla.length > 0 ? (
                                    victoriesElla.map((v: any) => <StickyNote key={v.id} victory={v} type="ella" />)
                                ) : (
                                    <p className="text-center text-stone-400 py-10 font-light italic">Sin felicitaciones aún...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
