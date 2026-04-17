'use client';

import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, Check, Heart, Trophy, Zap } from 'lucide-react';
import { PomodoroTimer } from './PomodoroTimer';
import { PendingTasks } from './PendingTasks';
import { QuickLinks } from './QuickLinks';

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
                className={`w-full p-6 rounded-3xl shadow-lg aspect-[4/3] flex flex-col items-center justify-center text-center border transition-all hover:scale-105 hover:shadow-xl cursor-default glass-panel relative overflow-hidden`}
            >
                <div className={`absolute -right-10 -top-10 w-32 h-32 blur-3xl opacity-20 rounded-full ${type === 'el' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-4">
                    <p className="font-caveat text-3xl leading-snug text-white drop-shadow-md">
                        {victory.text}
                    </p>
                    <p className="text-[10px] text-white/50 font-mono tracking-widest uppercase opacity-70">
                        {dateStr}
                    </p>
                </div>
            </motion.div>
        );
    };

    return (
        <div id="dashboard" className="w-full max-w-7xl mx-auto flex flex-col space-y-12 pb-20">

            {/* Top Productivity Bar */}
            <div className="w-full grid md:grid-cols-3 gap-6 mb-4">
                <div className="md:col-span-1 h-[280px]">
                    <PomodoroTimer />
                </div>
                <div className="md:col-span-1 h-[280px]">
                    <QuickLinks />
                </div>
                <div className="md:col-span-1 glass-panel rounded-3xl p-6 h-[280px] flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-full bg-brand-cyan/20 text-brand-cyan flex items-center justify-center shrink-0 border border-brand-cyan/30">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-stone-400 text-sm font-light uppercase tracking-wider">Rastreo de progreso</p>
                            <p className="text-4xl font-light text-white flex items-baseline gap-2">
                                {audioStats.daysTracking} <span className="text-base text-stone-400">días juntos</span>
                            </p>
                        </div>
                    </div>
                    {dailyProgress && (
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-white/50 mb-1.5">
                                    <span>Compromisos de Hoy</span>
                                    <span>{dailyProgress.todayCompleted}/{dailyProgress.todayTotal}</span>
                                </div>
                                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-brand-blue to-brand-cyan rounded-full transition-all duration-500"
                                        style={{ width: `${(dailyProgress.todayCompleted / (dailyProgress.todayTotal || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full grid lg:grid-cols-12 gap-8">
                {/* Main Pending Tasks (Takes up 5 columns) */}
                <div className="lg:col-span-5 h-[600px] flex flex-col">
                    <PendingTasks />
                </div>

                {/* Commitments & Sticky Notes (Takes up 7 columns) */}
                <div className="lg:col-span-7 flex flex-col h-[600px] space-y-6">
                    {/* Active Commitments Checklist */}
                    <div className="glass-panel rounded-3xl p-6 flex-shrink-0">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Heart className="w-5 h-5 text-brand-pink" /> 
                            Compromisos de la Relación
                        </h3>
                        <ul className="grid sm:grid-cols-2 gap-3">
                            {commitments.map((commitment) => (
                                <li
                                    key={commitment.id}
                                    onClick={() => toggleCommitment(commitment.id)}
                                    className={`flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${commitment.completed
                                        ? 'bg-black/20 border-white/5 opacity-50'
                                        : 'bg-white/10 border-white/10 hover:bg-white/15'
                                        }`}
                                >
                                    <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${commitment.completed
                                        ? 'bg-brand-pink border-brand-pink text-white'
                                        : 'border-white/20'
                                        }`}>
                                        {commitment.completed && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                    <span className={`text-sm tracking-wide ${commitment.completed
                                        ? 'text-stone-400 line-through'
                                        : 'text-stone-200'
                                        }`}>
                                        {commitment.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Victories Board */}
                    <div className="glass-panel rounded-3xl p-6 flex-1 flex flex-col overflow-hidden relative">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-amber-400" />
                                Muro de Victorias
                            </h3>
                        </div>

                        {profile && (
                            <form onSubmit={handleAddVictory} className="mb-6 flex gap-3 relative z-10">
                                <input
                                    type="text"
                                    value={newText}
                                    onChange={(e) => setNewText(e.target.value)}
                                    placeholder={profile === 'el' ? "Añadir victoria..." : "Añadir felicitación..."}
                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-400 outline-none focus:border-amber-400/50"
                                />
                                <button
                                    type="submit"
                                    disabled={!newText.trim()}
                                    className={`px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 text-white shadow-lg ${profile === 'el' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-rose-500 hover:bg-rose-600'
                                        }`}
                                >
                                    Fijar
                                </button>
                            </form>
                        )}

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 w-full">
                            <div className="grid grid-cols-2 gap-4 pb-4">
                                {victoriesEl.map((v: any) => <StickyNote key={v.id} victory={v} type="el" />)}
                                {victoriesElla.map((v: any) => <StickyNote key={v.id} victory={v} type="ella" />)}
                                {victoriesEl.length === 0 && victoriesElla.length === 0 && (
                                    <div className="col-span-2 py-10 flex justify-center text-white/40 italic text-sm">
                                        El muro está vacío por ahora.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
