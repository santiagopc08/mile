import React from 'react';
import { Target, TrendingDown, Clock, Activity } from 'lucide-react';
import { MovementSession } from './types';

interface ProgressAnalyticsProps {
    isElla: boolean;
    weeklyStats: any;
    sessions: MovementSession[];
    accentColor: string;
    painAnalytics: any;
}

export function ProgressAnalytics({ isElla, weeklyStats, sessions, accentColor, painAnalytics }: ProgressAnalyticsProps) {
    return (
        <>
                    {/* CAPA 4: PROGRESS ANALYTICS */}
                    <div className="border border-white/10 bg-[#060606] p-6 relative rounded-none">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30" />

                        <h3 className="text-[10px] uppercase font-black tracking-[0.25em] text-[#a88a7e] mb-4 border-b border-white/5 pb-3 font-mono">
                            Resumen de Progreso
                        </h3>

                        {/* Therapy specific analytics displayed if logs are available */}
                        {painAnalytics && (
                            <div className="border border-emerald-900/30 bg-emerald-950/5 p-4 mb-5 space-y-3 rounded-none relative pl-8">
                                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-emerald-500" />
                                <h4 className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                                    <Activity className="w-3.5 h-3.5 stroke-[1.5]" /> Tu evolución y recuperación
                                </h4>
                                <div className="grid grid-cols-2 gap-4 font-mono">
                                    <div className="border-r border-white/5 pr-2">
                                        <span className="text-[7px] text-[#a88a7e] block uppercase">Nivel de dolor (Antes / Después)</span>
                                        <span className="text-sm font-black tabular-nums text-white">
                                            {painAnalytics.averageBefore} → <span className="text-emerald-400">{painAnalytics.averageAfter}</span>
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[7px] text-[#a88a7e] block uppercase">Disminución del dolor</span>
                                        <span className="text-sm font-black tabular-nums text-emerald-400">
                                            -{painAnalytics.totalReduction} Puntos
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[7px] text-[#a88a7e] uppercase font-mono">
                                    Análisis generado sobre {painAnalytics.sessionsCount} sesiones de terapia.
                                </p>
                            </div>
                        )}

                        {/* Heatmap Matrix for Weekly consistency */}
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a88a7e] block font-mono">
                                Consistencia de la semana (Él / Ella):
                            </label>

                            <div className="grid grid-cols-7 gap-1.5 text-center">
                                {Array.from({ length: 7 }).map((_, index) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() - (6 - index));
                                    const dStr = d.toISOString().split('T')[0];
                                    const label = d.toLocaleDateString('es-ES', { weekday: 'short' });

                                    const userElLogs = sessions.filter(s => s.profile === 'el' && s.date === dStr);
                                    const userEllaLogs = sessions.filter(s => s.profile === 'ella' && s.date === dStr);

                                    const isElActive = userElLogs.some(s => s.completion_status === 'completed');
                                    const isElRecovery = userElLogs.some(s => s.completion_status === 'recovery');
                                    const isElRest = userElLogs.some(s => s.completion_status === 'rest_day');

                                    const isEllaActive = userEllaLogs.some(s => s.completion_status === 'completed');
                                    const isEllaRecovery = userEllaLogs.some(s => s.completion_status === 'recovery');
                                    const isEllaRest = userEllaLogs.some(s => s.completion_status === 'rest_day');

                                    return (
                                        <div key={index} className="flex flex-col gap-1">
                                            <div className="text-[8px] font-bold text-white/30 uppercase font-mono">{label[0]}</div>

                                            {/* El Box */}
                                            <div
                                                className="h-6 border border-white/5 relative rounded-none"
                                                style={{
                                                    backgroundColor: isElActive ? '#c3f400' : isElRecovery ? '#c3f4002b' : isElRest ? '#0f172a' : 'transparent',
                                                    borderColor: isElActive ? '#c3f400' : 'rgba(255,255,255,0.05)'
                                                }}
                                                title={`Él: ${dStr}`}
                                            >
                                                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-black/50 font-mono">
                                                    {isElRest ? 'R' : ''}
                                                </span>
                                            </div>

                                            {/* Ella Box */}
                                            <div
                                                className="h-6 border border-white/5 relative rounded-none"
                                                style={{
                                                    backgroundColor: isEllaActive ? '#ff4b89' : isEllaRecovery ? '#ff4b892b' : isEllaRest ? '#0f172a' : 'transparent',
                                                    borderColor: isEllaActive ? '#ff4b89' : 'rgba(255,255,255,0.05)'
                                                }}
                                                title={`Ella: ${dStr}`}
                                            >
                                                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-black/50 font-mono">
                                                    {isEllaRest ? 'R' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 pt-2 text-[7px] text-white/40 uppercase font-black font-mono">
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-[#c3f400] rounded-none" /> Él Activo
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-[#ff4b89] rounded-none" /> Ella Activa
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-slate-900 border border-white/10 rounded-none" /> Descanso (R)
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-emerald-500/20 rounded-none" /> Recuperación Activa
                                </div>
                            </div>
                        </div>
                    </div>
        </>
    );
}
