import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { RotateCcw, Undo2 } from 'lucide-react';
import { BrutalistCorners } from '@/components/ui/BrutalistPanel';

interface GameLostModalProps {
    gameLost: boolean;
    lostReason: 'dock' | 'bomb' | null;
    handleRestart: () => void;
    handleUndo: () => void;
}

export function GameLostModal({
    gameLost,
    lostReason,
    handleRestart,
    handleUndo
}: GameLostModalProps) {
    if (!gameLost || typeof window === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-hidden">
            {/* Background Loop Video when Bomb explodes */}
            {lostReason === 'bomb' && (
                <video
                    src="/vid/Miel_smoke.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-screen pointer-events-none z-0"
                />
            )}

            {/* Cyber scanlines */}
            <div className="absolute inset-0 scanlines-overlay opacity-35 pointer-events-none z-0" />

            {/* Figuras desenfocadas de fondo (Glow) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[15%] left-[10%] w-80 h-80 rounded-full bg-red-600/25 blur-[100px] animate-bg-glow-float-1" />
                <div className="absolute bottom-[15%] right-[10%] w-80 h-80 rounded-full bg-stone-900/50 blur-[100px] animate-bg-glow-float-2" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-red-900/15 blur-[90px] animate-bg-glow-rotate" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 flex w-[95%] max-w-md flex-col items-center border border-red-500 bg-black/95 px-8 py-10 shadow-[0_0_40px_rgba(239,68,68,0.22)] backdrop-blur-xl md:px-12 md:py-12 animate-glitch-container"
            >
                <BrutalistCorners color="#ef4444" size={16} />

                <div className="mb-6 flex h-16 w-16 rotate-45 items-center justify-center border border-red-500 bg-red-500/10 animate-glitch-flicker">
                    {lostReason === 'bomb' ? (
                        <span className="h-8 w-8 -rotate-45 text-2xl flex items-center justify-center select-none pointer-events-none">💣</span>
                    ) : (
                        <RotateCcw className="h-8 w-8 -rotate-45 text-red-400" />
                    )}
                </div>
                <h3 className="mb-2 text-3xl font-black uppercase tracking-normal text-white md:text-4xl animate-glitch-text">
                    {lostReason === 'bomb' ? '¡DETONACIÓN!' : 'Sin Espacio'}
                </h3>
                <p className="mb-8 text-center text-sm font-light tracking-normal text-[#a88a7e]">
                    {lostReason === 'bomb'
                        ? 'Una ficha de bomba ha explotado. El tablero ha quedado destruido.'
                        : 'Tu bandeja se ha llenado con cartas sin emparejar.'}
                </p>
                <button
                    onClick={handleRestart}
                    className="w-full bg-red-500 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-red-600 active:scale-95"
                >
                    Reintentar
                </button>
                {lostReason !== 'bomb' && (
                    <button
                        onClick={handleUndo}
                        className="mt-4 flex w-full items-center justify-center gap-2 border border-white/10 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#a88a7e] transition-all hover:bg-white/5 hover:text-white active:scale-95"
                    >
                        <Undo2 className="h-4 w-4" /> Deshacer
                    </button>
                )}
            </motion.div>
        </div>,
        document.body
    );
}
