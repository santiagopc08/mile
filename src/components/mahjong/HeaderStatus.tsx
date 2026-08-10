import React from 'react';
import { motion } from 'framer-motion';

interface HeaderStatusProps {
    level: number;
    activeTileset: { name: string; icon: string };
    layoutName: string;
    accentColor: string;
    completedGamesCount: number;
    pendingReceivedBottle: { id: string; message: string; sender: string } | null;
    todayRevealedBottle: { id: string; message: string; sender: string } | null;
    setShowMessageText: (show: boolean) => void;
    setHasPausedForMessage: (paused: boolean) => void;
    setRevealedBottleMessage: (msg: { id: string; text: string; sender: string }) => void;
    children?: React.ReactNode;
}

export function HeaderStatus({
    level,
    activeTileset,
    layoutName,
    accentColor,
    completedGamesCount,
    pendingReceivedBottle,
    todayRevealedBottle,
    setShowMessageText,
    setHasPausedForMessage,
    setRevealedBottleMessage,
    children
}: HeaderStatusProps) {
    return (
        <div className="relative z-10 mb-4 flex flex-col items-center justify-center border border-white/10 bg-black/60 p-4 w-full gap-3.5">
            {/* Title line combining Level, Tileset, and Layout */}
            <div className="flex items-center justify-center flex-wrap gap-2 md:gap-3 text-xs md:text-sm font-black uppercase tracking-[0.15em] text-white font-mono select-none">
                <span className="text-base md:text-lg select-none mr-0.5" role="img" aria-label={activeTileset.name}>
                    {activeTileset.icon}
                </span>
                <span className="text-white/50">LVL</span>
                <span className="font-black font-sans text-sm md:text-base -ml-1" style={{ color: accentColor }}>
                    {level}
                </span>
                <span className="h-3 w-[1px] bg-white/20 mx-1.5" />
                <span className="font-black font-sans tracking-wider" style={{ color: accentColor }}>
                    {activeTileset.name}
                </span>
                <span className="h-3 w-[1px] bg-white/20 mx-1.5" />
                <span className="font-bold text-[#a88a7e]">
                    {layoutName}
                </span>

                {/* Resized and Inline Bottle Tile Button */}
                {(pendingReceivedBottle || todayRevealedBottle) && (
                    <div className="ml-2.5 flex items-center">
                        {pendingReceivedBottle ? (
                            <button
                                onClick={() => {
                                    setShowMessageText(false);
                                    setHasPausedForMessage(false);
                                    setRevealedBottleMessage({
                                        id: pendingReceivedBottle.id,
                                        text: pendingReceivedBottle.message,
                                        sender: pendingReceivedBottle.sender === 'el' ? 'Santiago' : 'Milena'
                                    });
                                }}
                                className="relative w-8 h-11 overflow-hidden rounded-none border border-r-[2px] border-b-[3px] border-[#4b403a] bg-[#111] hover:brightness-125 transition-all active:scale-95 shadow-[0_0_12px_rgba(0,255,204,0.55)] animate-bounce"
                                title="Revelar Botella Recibida"
                            >
                                {/* Geometric corner mark */}
                                <div className="pointer-events-none absolute right-0 top-0 h-1 w-1 border-r border-t border-[#00ffcc]/60 z-30" />

                                <div className="relative h-full w-full overflow-hidden p-[1px] flex items-center justify-center bg-[#0a2323]">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#008080] via-[#004d4d] to-[#001a1a] opacity-75"></div>
                                    {/* inner dark bezel */}
                                    <div className="absolute inset-[2px] bg-black z-0"></div>
                                    {/* Bottle emoji */}
                                    <div className="relative z-10 text-sm select-none pointer-events-none animate-pulse">🍾</div>
                                    {/* top glossy shine */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-[#00ffcc]/20 z-20 pointer-events-none"></div>
                                </div>
                            </button>
                        ) : todayRevealedBottle ? (
                            <button
                                onClick={() => {
                                    setShowMessageText(false);
                                    setHasPausedForMessage(false);
                                    setRevealedBottleMessage({
                                        id: todayRevealedBottle.id,
                                        text: todayRevealedBottle.message,
                                        sender: todayRevealedBottle.sender === 'el' ? 'Santiago' : 'Milena'
                                    });
                                }}
                                className="relative w-8 h-11 overflow-hidden rounded-none border border-r-[2px] border-b-[3px] border-[#4b403a] bg-[#111] hover:brightness-110 transition-all active:scale-95 shadow-[0_0_8px_rgba(0,255,204,0.2)]"
                                title="Ver Botella Recibida"
                            >
                                {/* Geometric corner mark */}
                                <div className="pointer-events-none absolute right-0 top-0 h-1 w-1 border-r border-t border-[#00ffcc]/40 z-30" />

                                <div className="relative h-full w-full overflow-hidden p-[1px] flex items-center justify-center bg-[#051515]">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#004d4d] via-[#003333] to-[#001111] opacity-75"></div>
                                    {/* inner dark bezel */}
                                    <div className="absolute inset-[2px] bg-black z-0"></div>
                                    {/* Bottle emoji */}
                                    <div className="relative z-10 text-sm select-none pointer-events-none opacity-80">🍾</div>
                                    {/* top glossy shine */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-[#00ffcc]/10 z-20 pointer-events-none"></div>
                                </div>
                            </button>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Level Progress Bar: 0 to 15 games completed for current level */}
            <div className="w-full max-w-[280px] md:max-w-[340px] flex flex-col gap-1.5 font-mono text-[9px] text-[#a88a7e] select-none">
                <div className="flex justify-between uppercase tracking-wider font-bold">
                    <span>Progreso Nivel</span>
                    <span style={{ color: accentColor }}>{completedGamesCount % 15}/15 juegos</span>
                </div>
                <div className="relative h-[4px] w-full bg-white/10 overflow-hidden border border-white/5">
                    <motion.div
                        className="absolute left-0 top-0 bottom-0 origin-left"
                        initial={{ width: 0 }}
                        animate={{ width: `${(completedGamesCount % 15) * (100 / 15)}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                        style={{
                            backgroundColor: accentColor,
                            boxShadow: `0 0 10px ${accentColor}, 0 0 4px ${accentColor}`
                        }}
                    />
                </div>
            </div>

            {children}
        </div>
    );
}
