import { Focus, Coffee } from 'lucide-react';

interface PomodoroSessionMapProps {
    sessionPlan: { type: 'work' | 'break', duration: number }[];
    totalPlannedDuration: number;
    currentSession: number;
    elapsedSeconds: number;
    totalBudget: number;
    accentHex: string;
}

export function PomodoroSessionMap({
    sessionPlan,
    totalPlannedDuration,
    currentSession,
    elapsedSeconds,
    totalBudget,
    accentHex
}: PomodoroSessionMapProps) {
    return (
        <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-[#a88a7e]">
                <span>MAPA DE SESIONES ({sessionPlan.length} BLOQUES)</span>
                <span>{totalBudget} MIN TOTAL</span>
            </div>

            <div className="flex h-6 w-full border border-white/15 bg-black/60 overflow-hidden relative font-mono select-none">
                {sessionPlan.map((session, i) => {
                    const pct = (session.duration / totalPlannedDuration) * 100;
                    const isCompleted = i + 1 < currentSession;
                    const isCurrent = i + 1 === currentSession;
                    const progressPct = isCurrent ? (elapsedSeconds / (session.duration * 60)) * 100 : 0;

                    const blockColor = session.type === 'work' ? accentHex : '#00dbe9';

                    return (
                        <div
                            key={i}
                            className="h-full border-r border-white/10 last:border-r-0 flex items-center justify-center transition-all duration-300 relative overflow-hidden"
                            style={{
                                width: `${pct}%`,
                                backgroundColor: isCompleted ? 'rgba(255, 255, 255, 0.08)' : (isCurrent ? 'rgba(0, 0, 0, 0.4)' : undefined)
                            }}
                            title={`${session.type === 'work' ? 'Enfoque' : 'Descanso'}: ${session.duration} min`}
                        >
                            {/* Unfinished background */}
                            {!isCompleted && !isCurrent && (
                                <div className="absolute inset-0 opacity-20" style={{ backgroundColor: blockColor }} />
                            )}

                            {/* Completed solid fill */}
                            {isCompleted && (
                                <div className="absolute inset-0 opacity-80" style={{ backgroundColor: blockColor }} />
                            )}

                            {/* Active live progress */}
                            {isCurrent && (
                                <div
                                    className="absolute inset-y-0 left-0"
                                    style={{
                                        width: `${progressPct}%`,
                                        backgroundColor: blockColor
                                    }}
                                />
                            )}

                            <span className={`relative z-10 text-[8px] font-mono leading-none flex items-center gap-1 ${isCompleted || isCurrent ? 'text-black font-black' : 'text-[#a88a7e]'}`}>
                                {session.type === 'work' ? <Focus size={8} /> : <Coffee size={8} />}
                                <span className="hidden sm:inline">{session.duration}m</span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
