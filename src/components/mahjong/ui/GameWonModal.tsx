import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Trophy } from 'lucide-react';
import { BrutalistCorners } from '@/components/ui/BrutalistPanel';

interface GameWonModalProps {
    gameWon: boolean;
    gameMode: 'solo' | 'coop' | 'daily';
    profile: string | null;
    accentColor: string;
    accentClass: string;
    secondaryColor: string;
    isNewRecord: boolean;
    formatTime: (seconds: number) => string;
    timeSeconds: number;
    maxGameCombo: number;
    leaderboard: { el: any[]; ella: any[] };
    levelComparisons: any[];
    setIsLoaded: (loaded: boolean) => void;
}

export function GameWonModal({
    gameWon,
    gameMode,
    profile,
    accentColor,
    accentClass,
    secondaryColor,
    isNewRecord,
    formatTime,
    timeSeconds,
    maxGameCombo,
    leaderboard,
    levelComparisons,
    setIsLoaded
}: GameWonModalProps) {
    if (!gameWon || typeof window === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-hidden">
            {/* Cyber scanlines */}
            <div className="absolute inset-0 scanlines-overlay opacity-35 pointer-events-none z-0" />

            {/* Figuras desenfocadas de fondo (Glow con colores dinámicos) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[15%] left-[10%] w-80 h-80 rounded-full blur-[100px] animate-bg-glow-float-1" style={{ backgroundColor: `${accentColor}33` }} />
                <div className="absolute bottom-[15%] right-[10%] w-80 h-80 rounded-full blur-[100px] animate-bg-glow-float-2" style={{ backgroundColor: `${secondaryColor}22` }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full blur-[90px] animate-bg-glow-rotate" style={{ backgroundColor: `${accentColor}15` }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative z-10 flex w-[95%] max-w-md flex-col items-center border border-${accentClass} bg-black/95 px-8 py-10 shadow-none backdrop-blur-xl md:px-12 md:py-12 animate-glitch-container`}
                style={{ borderColor: accentColor, boxShadow: `0 0 44px ${accentColor}2e` }}
            >
                <BrutalistCorners color={accentColor} size={16} />

                <div className="mb-5 flex h-16 w-16 rotate-45 items-center justify-center border-2 border-current animate-glitch-flicker" style={{ color: accentColor }}>
                    <Trophy className="h-8 w-8 -rotate-45 text-current" />
                </div>
                <h3 className="mb-2 text-3xl font-black uppercase tracking-normal md:text-4xl animate-glitch-text" style={{ color: accentColor }}>¡Triunfo!</h3>
                <p className="mb-6 text-center text-sm font-light tracking-normal text-[#a88a7e]">
                    {gameMode === 'coop' ? '¡Tablero cooperativo completado en pareja! 💖' : gameMode === 'daily' ? '¡Desafío Diario superado con éxito! 🌟' : 'Has liberado todas nuestras memorias.'}
                </p>

                {/* Video de Victoria */}
                <div className="relative w-full mb-6 aspect-video overflow-hidden border border-white/10 bg-black/60 p-[3px]" style={{ borderColor: `${accentColor}40`, boxShadow: `0 0 15px ${accentColor}15` }}>
                    {/* Esquinas brutalistas decorativas */}
                    <div className="absolute top-0 left-0 h-2 w-2 border-t border-l" style={{ borderColor: accentColor }} />
                    <div className="absolute top-0 right-0 h-2 w-2 border-t border-r" style={{ borderColor: accentColor }} />
                    <div className="absolute bottom-0 left-0 h-2 w-2 border-b border-l" style={{ borderColor: accentColor }} />
                    <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r" style={{ borderColor: accentColor }} />

                    <video
                        src="/vid/mahjong_victory.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                    />
                </div>

                {isNewRecord && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [1, 1.05, 1], opacity: 1 }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className={`mb-4 border border-${accentClass} bg-${accentClass}/10 px-6 py-2 text-xs font-bold uppercase tracking-[0.2em] shadow-none`}
                        style={{ borderColor: accentColor, color: profile === 'ella' ? '#ffb595' : '#e1ff80' }}
                    >
                        NUEVO RÉCORD
                    </motion.div>
                )}

                <div className="relative mb-6 w-full border border-white/10 bg-[#050505] p-4 flex justify-around items-center">
                    <div className="text-center">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Tu Tiempo</span>
                        <span className="font-mono text-3xl tracking-normal text-white">{formatTime(timeSeconds)}</span>
                        <span className={`mt-1 block text-[10px] font-bold uppercase ${profile === 'ella' ? 'text-user-b' : 'text-user-a'}`}>
                            {profile === 'el' ? 'Santiago' : 'Mile'}
                        </span>
                    </div>
                    <div className="border-l border-white/10 h-10" />
                    <div className="text-center">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Racha Máxima</span>
                        <span className="font-mono text-3xl tracking-normal" style={{ color: accentColor }}>🔥 {maxGameCombo}</span>
                        <span className="mt-1 block text-[10px] font-bold uppercase text-orange-500">
                            Combo
                        </span>
                    </div>
                </div>

                {gameMode === 'daily' ? (
                    (leaderboard.el.length > 0 || leaderboard.ella.length > 0) && (
                        <div className="w-full mb-6">
                            <h4 className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Tabla de Récords (Diario)</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <span className="block text-center text-[10px] font-bold uppercase tracking-wider text-user-a">Él</span>
                                    {leaderboard.el.length > 0 ? leaderboard.el.slice(0, 3).map((s, i) => (
                                        <div key={i} className="flex items-center justify-between border border-white/10 bg-[#0a0a0a] px-3 py-1.5 text-xs font-mono">
                                            <span className="text-white/35">#{i + 1}</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="tabular-nums tracking-normal text-white">{formatTime(s.time_seconds)}</span>
                                                {s.highest_combo !== undefined && s.highest_combo > 0 && (
                                                    <span className="text-orange-500 text-[10px] font-bold">🔥{s.highest_combo}</span>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-center text-[10px] italic text-white/30">Sin récords</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <span className="block text-center text-[10px] font-bold uppercase tracking-wider text-user-b">Ella</span>
                                    {leaderboard.ella.length > 0 ? leaderboard.ella.slice(0, 3).map((s, i) => (
                                        <div key={i} className="flex items-center justify-between border border-white/10 bg-[#0a0a0a] px-3 py-1.5 text-xs font-mono">
                                            <span className="text-white/35">#{i + 1}</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="tabular-nums tracking-normal text-white">{formatTime(s.time_seconds)}</span>
                                                {s.highest_combo !== undefined && s.highest_combo > 0 && (
                                                    <span className="text-orange-500 text-[10px] font-bold">🔥{s.highest_combo}</span>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-center text-[10px] italic text-white/30">Sin récords</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                ) : gameMode === 'solo' && levelComparisons.length > 0 ? (
                    <div className="w-full mb-6">
                        <h4 className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Comparativa de Niveles</h4>
                        <div className="space-y-2">
                            {levelComparisons.map((comp, idx) => {
                                const elTimeStr = comp.elTime !== null ? formatTime(comp.elTime) : '--:--';
                                const ellaTimeStr = comp.ellaTime !== null ? formatTime(comp.ellaTime) : '--:--';
                                return (
                                    <div key={idx} className="flex flex-col items-center border border-white/10 bg-[#0a0a0a] py-2 px-3 text-xs tracking-normal font-mono">
                                        <div className="mb-1 text-[9px] font-bold uppercase text-[#a88a7e] tracking-wider">
                                            {comp.levelLabel}
                                        </div>
                                        <div className="flex w-full justify-center gap-3 text-white">
                                            <span className="text-user-a font-bold">
                                                el lvl {comp.elLvl} {elTimeStr} {comp.elCombo > 0 && <span className="text-orange-500 font-bold text-[10px]">🔥{comp.elCombo}</span>}
                                            </span>
                                            <span className="text-white/20">|</span>
                                            <span className="text-user-b font-bold">
                                                ella lvl {comp.ellaLvl} {ellaTimeStr} {comp.ellaCombo > 0 && <span className="text-orange-500 font-bold text-[10px]">🔥{comp.ellaCombo}</span>}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                <button onClick={() => { setIsLoaded(false); }} className={`w-full bg-${accentClass} py-3.5 text-xs font-black uppercase tracking-[0.18em] text-black transition-all hover:opacity-80 active:scale-95`} style={{ backgroundColor: accentColor }}>Jugar de nuevo</button>
            </motion.div>
        </div>,
        document.body
    );
}
