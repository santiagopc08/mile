interface PomodoroHeaderProps {
    isRunning: boolean;
    mode: 'work' | 'break';
    isSessionActive: boolean;
    currentSession: number;
    totalSessions: number;
    totalBudget: number;
    accentHex: string;
}

export function PomodoroHeader({
    isRunning,
    mode,
    isSessionActive,
    currentSession,
    totalSessions,
    totalBudget,
    accentHex
}: PomodoroHeaderProps) {
    return (
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                    {isRunning && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: mode === 'work' ? accentHex : '#00dbe9' }} />
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isRunning ? '' : 'opacity-40'}`} style={{ backgroundColor: mode === 'work' ? accentHex : '#00dbe9' }} />
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: mode === 'work' ? accentHex : '#00dbe9' }}>
                    {isRunning ? (mode === 'work' ? 'ENFOQUE ACTIVO // EN CURSO' : 'DESCANSO REPARADOR') : (isSessionActive ? 'SESIÓN PAUSADA' : 'CONFIGURADOR DE MISIÓN')}
                </span>
            </div>
            <div className="flex items-center gap-3 text-[8px] tracking-widest text-[#a88a7e]">
                <span>BLOQUE {currentSession} / {totalSessions}</span>
                <span className="text-white/20">•</span>
                <span>TOTAL: {totalBudget} MIN</span>
            </div>
        </div>
    );
}
