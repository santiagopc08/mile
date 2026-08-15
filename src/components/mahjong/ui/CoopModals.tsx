import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';

interface CoopTurnModalProps {
    gameMode: string;
    activeCoopGame: any;
    coopTurn: string;
    profile: string | null;
    accentColor: string;
}

export function CoopTurnModal({
    gameMode,
    activeCoopGame,
    coopTurn,
    profile,
    accentColor
}: CoopTurnModalProps) {
    if (gameMode !== 'coop' || !activeCoopGame || coopTurn === profile) return null;

    return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="border border-white/10 bg-black/90 p-6 text-center max-w-xs relative">
                <AnimatedBrutalistCorners color={accentColor} size={8} thickness={1.5} />
                <div className="animate-pulse mb-3 text-sm font-bold uppercase tracking-widest text-[#a88a7e]">
                    Esperando a tu pareja
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed font-mono">
                    Es el turno de {coopTurn === 'el' ? 'Santiago' : 'Milena'} para jugar y despejar recuerdos.
                </p>
                <div className="text-[10px] uppercase font-mono text-slate-500">
                    Recibirás una notificación cuando sea tu turno.
                </div>
            </div>
        </div>
    );
}

interface CoopSetupModalProps {
    gameMode: string;
    activeCoopGame: any;
    accentColor: string;
    handleStartCoopGame: (layout: any) => void;
}

export function CoopSetupModal({
    gameMode,
    activeCoopGame,
    accentColor,
    handleStartCoopGame
}: CoopSetupModalProps) {
    if (gameMode !== 'coop' || activeCoopGame) return null;

    return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 p-4">
            <div className="border border-white/10 bg-black/95 p-6 text-center max-w-sm relative">
                <AnimatedBrutalistCorners color={accentColor} size={10} thickness={1.5} />
                <h3 className="text-lg font-bold uppercase tracking-wider text-white mb-2 font-mono">Tablero Cooperativo</h3>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed font-mono">
                    Trabaja con tu pareja para despejar el tablero y desbloquear recuerdos mutuos.
                </p>

                <div className="flex flex-col gap-2 font-mono">
                    <button
                        onClick={() => handleStartCoopGame('turtle')}
                        className="bg-white/5 border border-white/15 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-white/25 active:scale-95 transition-all"
                    >
                        Iniciar: Tortuga
                    </button>
                    <button
                        onClick={() => handleStartCoopGame('peaks')}
                        className="bg-white/5 border border-white/15 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-white/25 active:scale-95 transition-all"
                    >
                        Iniciar: Picos Gemelos
                    </button>
                    <button
                        onClick={() => handleStartCoopGame('random')}
                        className="bg-white/5 border border-white/15 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 hover:border-white/25 active:scale-95 transition-all"
                    >
                        Iniciar: Caos
                    </button>
                </div>
            </div>
        </div>
    );
}
