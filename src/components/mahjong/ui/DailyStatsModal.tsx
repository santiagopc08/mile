import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';

interface DailyStatsModalProps {
    gameMode: string;
    dailyPlayRecord: any;
    accentColor: string;
    DATE_FORMATTER: Intl.DateTimeFormat;
    dailyStats: any;
    formatTime: (seconds: number) => string;
    historicDailyStats: any;
    handleStartDailyGame: () => void;
}

export function DailyStatsModal({
    gameMode,
    dailyPlayRecord,
    accentColor,
    DATE_FORMATTER,
    dailyStats,
    formatTime,
    historicDailyStats,
    handleStartDailyGame
}: DailyStatsModalProps) {
    if (gameMode !== 'daily' || dailyPlayRecord?.status === 'started') return null;

    return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-4 overflow-y-auto">
            <div className="border border-white/10 bg-black/95 p-6 text-center w-full max-w-md relative font-mono">
                <AnimatedBrutalistCorners color={accentColor} size={10} thickness={1.5} />

                <h3 className="text-xl font-black uppercase tracking-wider text-white mb-2 animate-glitch-text" style={{ color: accentColor }}>
                    DESAFÍO DIARIO
                </h3>
                <p className="text-[10px] text-slate-500 mb-6 uppercase tracking-widest">
                    {DATE_FORMATTER.format(new Date())}
                </p>

                {/* Today's Results comparing Santiago vs Milena */}
                <div className="mb-6 border-b border-white/10 pb-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#a88a7e] mb-3 text-left">
                        Resultados de Hoy
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="border border-white/10 bg-black/40 p-3 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-user-a mb-1">Santiago</span>
                            {dailyStats.el ? (
                                dailyStats.el.status === 'completed' ? (
                                    <div className="text-center">
                                        <span className="text-green-400 font-bold block">COMPLETADO</span>
                                        <span className="text-white/60 text-[10px] font-mono block mt-0.5">
                                            {formatTime(dailyStats.el.time_seconds)}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-red-400 font-bold">FALLADO</span>
                                )
                            ) : (
                                <span className="text-white/35 italic">Pendiente</span>
                            )}
                        </div>
                        <div className="border border-white/10 bg-black/40 p-3 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-user-b mb-1">Milena</span>
                            {dailyStats.ella ? (
                                dailyStats.ella.status === 'completed' ? (
                                    <div className="text-center">
                                        <span className="text-green-400 font-bold block">COMPLETADO</span>
                                        <span className="text-white/60 text-[10px] font-mono block mt-0.5">
                                            {formatTime(dailyStats.ella.time_seconds)}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-red-400 font-bold">FALLADO</span>
                                )
                            ) : (
                                <span className="text-white/35 italic">Pendiente</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Historic stats */}
                <div className="mb-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#a88a7e] mb-3 text-left">
                        Historial Acumulado
                    </h4>
                    <div className="space-y-3">
                        {/* Santiago */}
                        <div className="flex items-center justify-between text-[11px] border border-white/5 bg-[#050505] p-2">
                            <span className="font-bold text-user-a">Santiago:</span>
                            <span className="text-white/80">
                                {historicDailyStats.el.completed} ✔ | {historicDailyStats.el.failed} ❌ | {historicDailyStats.el.bestTime ? `⏱ ${formatTime(historicDailyStats.el.bestTime)}` : 'N/A'}
                            </span>
                        </div>
                        {/* Milena */}
                        <div className="flex items-center justify-between text-[11px] border border-white/5 bg-[#050505] p-2">
                            <span className="font-bold text-user-b">Milena:</span>
                            <span className="text-white/80">
                                {historicDailyStats.ella.completed} ✔ | {historicDailyStats.ella.failed} ❌ | {historicDailyStats.ella.bestTime ? `⏱ ${formatTime(historicDailyStats.ella.bestTime)}` : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Play or locked message */}
                {(!dailyPlayRecord || dailyPlayRecord.status === null) ? (
                    <button
                        onClick={handleStartDailyGame}
                        className="w-full bg-[#00ffcc] py-3 text-xs font-black uppercase tracking-[0.18em] text-black hover:bg-teal-300 active:scale-95 transition-all"
                        style={{ backgroundColor: accentColor, color: '#000' }}
                    >
                        Iniciar Desafío Diario
                    </button>
                ) : (
                    <div className="border border-red-500/20 bg-red-950/15 p-3 text-[10px] text-red-400 uppercase tracking-wider font-bold">
                        Intento de hoy finalizado. ¡Vuelve mañana!
                    </div>
                )}
            </div>
        </div>
    );
}
