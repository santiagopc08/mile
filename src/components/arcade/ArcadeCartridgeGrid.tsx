import React from 'react';
import { GameTab, GAMES_METADATA } from './ArcadeGameSelector';

interface ArcadeCartridgeGridProps {
  filteredGames: GameTab[];
  activeTab: GameTab;
  onSelectTab: (tab: GameTab) => void;
}

export function ArcadeCartridgeGrid({
  filteredGames,
  activeTab,
  onSelectTab,
}: ArcadeCartridgeGridProps) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5"
      role="tablist"
      aria-label="Cuadrícula de Juegos Arcade"
    >
      {filteredGames.map((gameKey) => {
        const game = GAMES_METADATA[gameKey];
        const Icon = game.icon;
        const isActive = activeTab === gameKey;

        return (
          <button
            key={gameKey}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`game-canvas-${gameKey}`}
            onClick={() => onSelectTab(gameKey)}
            className={`group relative flex flex-col justify-between p-2.5 sm:p-3 rounded-xl text-left transition-all active:scale-95 ${
              isActive
                ? 'bg-white/[0.08] shadow-[0_8px_20px_rgba(0,0,0,0.5)] z-10'
                : 'bg-black/40 hover:bg-white/[0.05] opacity-80 hover:opacity-100'
            }`}
            style={{
              border: isActive
                ? `1.5px solid ${game.accentHex}`
                : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: isActive ? `0 0 16px ${game.glowHex}` : undefined,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-mono text-white/40 font-bold">
                {game.romId}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${isActive ? 'animate-ping' : 'opacity-20'}`}
                style={{ backgroundColor: game.accentHex }}
              />
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                  isActive ? 'text-slate-950' : 'bg-white/5 text-white/70'
                }`}
                style={{
                  backgroundColor: isActive ? game.accentHex : undefined,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-[11px] font-mono font-bold text-white uppercase truncate">
                  {game.shortTitle}
                </h4>
                <span className="text-[7.5px] font-mono text-white/45 uppercase truncate block">
                  {game.engine}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
