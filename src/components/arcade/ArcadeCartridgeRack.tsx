import React, { RefObject } from 'react';
import { GameTab, GAMES_METADATA } from './ArcadeGameSelector';

interface ArcadeCartridgeRackProps {
  filteredGames: GameTab[];
  activeTab: GameTab;
  onSelectTab: (tab: GameTab) => void;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  activeCartridgeRef: RefObject<HTMLButtonElement | null>;
}

export function ArcadeCartridgeRack({
  filteredGames,
  activeTab,
  onSelectTab,
  scrollContainerRef,
  activeCartridgeRef,
}: ArcadeCartridgeRackProps) {
  return (
    <div className="relative group/rack">
      {/* Sombras difusas de fade a los costados */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#1f0e13] to-transparent z-10 opacity-70" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#1f0e13] to-transparent z-10 opacity-70" />

      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-3 overflow-x-auto py-2 px-2 scrollbar-none snap-x snap-mandatory"
        role="tablist"
        aria-label="Selector de Cartuchos Arcade"
      >
        {filteredGames.map((gameKey) => {
          const game = GAMES_METADATA[gameKey];
          const Icon = game.icon;
          const isActive = activeTab === gameKey;

          return (
            <button
              key={gameKey}
              ref={isActive ? activeCartridgeRef : null}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`game-canvas-${gameKey}`}
              onClick={() => onSelectTab(gameKey)}
              className={`group relative flex-shrink-0 flex flex-col justify-between w-[150px] sm:w-[175px] md:w-[190px] p-3 rounded-xl transition-all duration-200 snap-start text-left select-none outline-none ${
                isActive
                  ? 'bg-white/[0.08] shadow-[0_12px_28px_rgba(0,0,0,0.6)] scale-[1.03] z-10'
                  : 'bg-black/45 hover:bg-white/[0.05] opacity-75 hover:opacity-100'
              }`}
              style={{
                border: isActive
                  ? `1.5px solid ${game.accentHex}`
                  : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: isActive
                  ? `0 0 20px ${game.glowHex}, inset 0 0 15px rgba(0,0,0,0.5)`
                  : undefined,
              }}
            >
              {/* Pistas de oro / conector PCB inferior decorativo */}
              <div className="absolute top-0 left-4 right-4 h-[3px] flex justify-between gap-1 opacity-60">
                <div className="h-full w-full bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 rounded-b-sm" />
              </div>

              {/* Header del Cartucho: ROM ID & LED */}
              <div className="flex items-center justify-between w-full pt-1.5 mb-2">
                <span
                  className={`text-[8.5px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-white text-black font-black'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  {game.romId}
                </span>

                {/* LED de estado */}
                <div className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full transition-all ${
                      isActive ? 'animate-pulse' : 'opacity-30'
                    }`}
                    style={{
                      backgroundColor: isActive ? game.accentHex : '#ffffff',
                      boxShadow: isActive ? `0 0 8px ${game.accentHex}` : 'none',
                    }}
                  />
                </div>
              </div>

              {/* Centro del Cartucho: Icono Holográfico y Título */}
              <div className="space-y-2 my-1">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all ${
                      isActive
                        ? 'shadow-md text-slate-950'
                        : 'bg-white/5 text-white/80 group-hover:text-white group-hover:bg-white/10'
                    }`}
                    style={{
                      backgroundColor: isActive ? game.accentHex : undefined,
                    }}
                  >
                    <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
                  </div>

                  {/* Badge de tipo */}
                  {game.badge && (
                    <span
                      className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-black/50 text-white border border-white/20'
                          : 'bg-white/5 text-white/50'
                      }`}
                    >
                      {game.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3
                    className={`text-xs sm:text-sm font-mono font-black uppercase tracking-wider truncate ${
                      isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                    }`}
                  >
                    {game.shortTitle}
                  </h3>
                  <p className="text-[8.5px] font-mono uppercase text-white/45 truncate mt-0.5">
                    {game.engine}
                  </p>
                </div>
              </div>

              {/* Pie del Cartucho: Contact Pins PCB */}
              <div className="pt-2 mt-1 border-t border-white/10 flex items-center justify-between text-[8px] font-mono text-white/40 uppercase">
                <span>{game.category.toUpperCase()}</span>
                <span
                  style={{
                    color: isActive ? game.accentHex : undefined,
                  }}
                  className={isActive ? 'font-bold' : ''}
                >
                  {isActive ? '● INSERTADO' : 'LISTO'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
