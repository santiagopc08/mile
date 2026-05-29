'use client';

import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useProfile } from '@/context/ProfileContext';
import { motion } from 'framer-motion';
import { Check, Heart, Trophy, Zap } from 'lucide-react';
import { PomodoroTimer } from './symmetry/PomodoroTimer';
import { PendingTasks } from './PendingTasks';
import { QuickLinks } from './QuickLinks';
import { StoreService, Victory } from '@/services/storeService';

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
        const victory: Victory = {
            id: Date.now().toString(),
            text: newText.trim(),
            created_at: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            author: profile
        };

        if (isEl) {
            await updateData({ victoriesEl: [victory, ...victoriesEl] });
        } else {
            await updateData({ victoriesElla: [victory, ...victoriesElla] });
        }

        // Enviar notificación a la pareja
        const target = profile === 'el' ? 'ella' : 'el';
        const name = profile === 'el' ? 'Santiago' : 'Milena';
        StoreService.addNotification(target, 'victory', `¡${name} fijó una nueva victoria!: "${newText.trim()}"`).catch(err => {
            console.error('Failed to trigger victory notification:', err);
        });

        setNewText('');
    };

    const StickyNote = ({ victory, type }: { victory: Victory, type: 'el' | 'ella' }) => {
        const dateStr = victory.created_at ? new Intl.DateTimeFormat('es-CO', { month: 'short', day: 'numeric' }).format(new Date(victory.created_at)) : 'Hoy';

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="geometric-card min-h-[140px] flex flex-col p-4 group"
            >
                <div className={`absolute top-0 right-0 w-8 h-8 border-b border-l ${type === 'el' ? 'border-amber-400/20 bg-amber-400/5' : 'border-rose-400/20 bg-rose-400/5'
                    }`} />
                <div className="flex-1 flex items-center justify-center py-4">
                    <p className="text-xl font-medium text-white text-center leading-tight tracking-tight">
                        {victory.text}
                    </p>
                </div>
                <div className="flex justify-between items-center mt-auto pt-3 border-t border-white/5 opacity-50 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-stone-500">
                        {type === 'el' ? 'Santiago' : 'Milena'}
                    </span>
                    <span className="text-[9px] font-mono tracking-widest uppercase text-stone-500">
                        {dateStr}
                    </span>
                </div>
            </motion.div>
        );
    };

    return (
        <div id="dashboard" className="w-full max-w-7xl mx-auto flex flex-col space-y-16 pb-20">

            {/* Sub-Header / Productivity Stats */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 border border-stone-200 dark:border-stone-800 bg-white/5 dark:bg-black/20 divide-y md:divide-y-0 md:divide-x divide-stone-200 dark:divide-stone-800">
                <div className="p-8 flex flex-col justify-center bg-grid-mosaic">
                    <PomodoroTimer />
                </div>
                <div className="p-8 flex flex-col justify-center bg-dot-matrix">
                    <QuickLinks />
                </div>
                <div className="p-8 flex flex-col justify-center space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-geometric-accent/10 border border-geometric-accent/20 flex items-center justify-center text-geometric-accent">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-500">Tiempo Juntos</p>
                            <p className="text-3xl font-light tracking-tighter text-white">
                                {audioStats.daysTracking} <span className="text-sm font-normal text-stone-400">Días</span>
                            </p>
                        </div>
                    </div>
                    {dailyProgress && (
                        <div className="space-y-4 pt-4 border-t border-stone-800">
                            <div className="flex justify-between text-[9px] uppercase font-bold tracking-[0.2em] text-stone-500">
                                <span>Progreso Compromisos</span>
                                <span>{dailyProgress.todayCompleted} / {dailyProgress.todayTotal}</span>
                            </div>
                            <div className="w-full h-1.5 bg-stone-900 border border-stone-800 flex overflow-hidden">
                                <div
                                    className="h-full bg-geometric-accent transition-all duration-500"
                                    style={{ width: `${(dailyProgress.todayCompleted / (dailyProgress.todayTotal || 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full grid lg:grid-cols-12 gap-12">
                {/* Tasks Module */}
                <div className="lg:col-span-5 flex flex-col min-h-[500px]">
                    <div className="flex items-center gap-2 mb-6 ml-2">
                        <Zap className="w-4 h-4 text-geometric-accent" />
                        <h3 className="text-sm uppercase font-bold tracking-[0.3em] text-white">Operaciones</h3>
                    </div>
                    <PendingTasks />
                </div>

                {/* Compromisos & Content */}
                <div className="lg:col-span-7 flex flex-col space-y-12">
                    {/* Relationship Commitments */}
                    <div className="geometric-card p-8 bg-grid-mosaic">
                        <h3 className="text-sm uppercase font-bold tracking-[0.3em] text-white mb-8 flex items-center gap-3">
                            <Heart className="w-4 h-4 text-rose-500" />
                            Compromisos Compartidos
                        </h3>
                        <ul className="grid sm:grid-cols-2 gap-4">
                            {commitments.map((commitment) => (
                                <li
                                    key={commitment.id}
                                    onClick={() => toggleCommitment(commitment.id)}
                                    className={`group flex items-start gap-3 p-4 border transition-all cursor-pointer ${commitment.completed
                                            ? 'bg-black/40 border-stone-800 opacity-40'
                                            : 'bg-white/5 border-stone-700 hover:border-geometric-accent hover:bg-white/10'
                                        }`}
                                >
                                    <div className={`mt-0.5 w-4 h-4 border flex items-center justify-center transition-colors ${commitment.completed ? 'bg-geometric-accent border-geometric-accent' : 'border-stone-500'
                                        }`}>
                                        {commitment.completed && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm tracking-wide text-stone-200">
                                        {commitment.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Victory Board */}
                    <div className="flex flex-col flex-1 min-h-[400px]">
                        <div className="flex items-center justify-between mb-6 ml-2">
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-500" />
                                <h3 className="text-sm uppercase font-bold tracking-[0.3em] text-white">Archivo de Victorias</h3>
                            </div>
                        </div>

                        {profile && (
                            <form onSubmit={handleAddVictory} className="mb-8 flex border border-stone-800 bg-white/5 overflow-hidden">
                                <input
                                    type="text"
                                    value={newText}
                                    onChange={(e) => setNewText(e.target.value)}
                                    placeholder="Registrar nueva victoria..."
                                    className="flex-1 bg-transparent px-6 py-4 text-sm text-white placeholder-stone-600 outline-none uppercase tracking-widest font-bold"
                                />
                                <button
                                    type="submit"
                                    disabled={!newText.trim()}
                                    className="px-8 border-l border-stone-800 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-all disabled:opacity-30"
                                >
                                    FIJAR
                                </button>
                            </form>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {victoriesEl.map((v: any) => <StickyNote key={v.id} victory={v} type="el" />)}
                            {victoriesElla.map((v: any) => <StickyNote key={v.id} victory={v} type="ella" />)}
                            {victoriesEl.length === 0 && victoriesElla.length === 0 && (
                                <div className="col-span-full py-12 flex justify-center text-stone-600 text-[10px] uppercase font-bold tracking-[0.3em] border border-stone-800 border-dashed">
                                    ARCHIVO VACÍO
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
