import React from 'react';
import { MahjongService } from '@/services/mahjongService';

interface GameModeTabsProps {
    gameMode: 'solo' | 'coop' | 'daily';
    setGameMode: (mode: 'solo' | 'coop' | 'daily') => void;
    setIsLoaded: (loaded: boolean) => void;
    requestGameFullscreen: () => void;
    handleLoadCoopGame: (game: any) => void;
    setActiveCoopGame: (game: any) => void;
}

export function GameModeTabs({
    gameMode,
    setGameMode,
    setIsLoaded,
    requestGameFullscreen,
    handleLoadCoopGame,
    setActiveCoopGame
}: GameModeTabsProps) {
    return (
        <div className="flex gap-2 mb-4 bg-black/40 p-1 border border-white/5 font-mono text-[10px] md:text-xs z-10">
            <button
                onClick={() => {
                    setGameMode('solo');
                    setIsLoaded(false);
                    requestGameFullscreen();
                }}
                className={`px-3 py-1.5 transition-all ${gameMode === 'solo' ? 'bg-white/10 text-white font-bold' : 'text-white/40 hover:text-white/75'}`}
            >
                Solo
            </button>
            <button
                onClick={async () => {
                    setGameMode('coop');
                    setIsLoaded(false);
                    const activeGame = await MahjongService.getActiveCoopGame();
                    if (activeGame) {
                        handleLoadCoopGame(activeGame);
                    } else {
                        setActiveCoopGame(null);
                    }
                }}
                className={`px-3 py-1.5 transition-all ${gameMode === 'coop' ? 'bg-white/10 text-white font-bold' : 'text-white/40 hover:text-white/75'}`}
            >
                Cooperativo
            </button>
            <button
                onClick={() => {
                    setGameMode('daily');
                    setIsLoaded(false);
                    requestGameFullscreen();
                }}
                className={`px-3 py-1.5 transition-all ${gameMode === 'daily' ? 'bg-white/10 text-white font-bold' : 'text-white/40 hover:text-white/75'}`}
            >
                Juego Diario
            </button>
        </div>
    );
}
