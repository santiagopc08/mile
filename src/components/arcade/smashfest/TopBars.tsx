import React from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  Dices,
  Calendar,
} from 'lucide-react';
import { DEFAULT_LEVELS } from '@/app/smash-fest/components/SmashFestGame';
import { isDailyLevelId } from '@/app/smash-fest/lib/levelGenerator';
import type { ScoreMap, LevelScore } from '@/app/smash-fest/lib/scores';
import type { LevelSchema } from '@/app/smash-fest/components/SmashFestGame';
import { StarRow } from './Shared';

const DEFAULT_LEVEL_KEYS = Object.keys(DEFAULT_LEVELS);

interface TopBarsProps {
  levelId: string;
  setLevelId: (id: string) => void;
  generated: LevelSchema | null;
  setGenerated: (gen: LevelSchema | null) => void;
  scores: ScoreMap;
  todayScore: LevelScore | null | undefined;
  handleResetLevel: () => void;
  handleDailyChallenge: () => void;
  handleGenerateLevel: () => void;
  isSoundMuted: boolean;
  setIsSoundMuted: (muted: boolean) => void;
  setIsHelpOpen: (open: boolean) => void;
  stats: {
    remainingBalls: number;
    memoryBlocksLeft: number;
    totalMemoryBlocks: number;
  };
}

export function TopBars({
  levelId,
  setLevelId,
  generated,
  setGenerated,
  scores,
  todayScore,
  handleResetLevel,
  handleDailyChallenge,
  handleGenerateLevel,
  isSoundMuted,
  setIsSoundMuted,
  setIsHelpOpen,
  stats,
}: TopBarsProps) {
  return (
    <>
      <div className="absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-black/85 border border-white/15 p-1 rounded-xl shadow-xl backdrop-blur-md pointer-events-auto overflow-x-auto max-w-full scrollbar-none">
          {DEFAULT_LEVEL_KEYS.map((lvl, index) => (
            <button
              key={lvl}
              onClick={() => {
                setLevelId(lvl);
                setGenerated(null);
                handleResetLevel();
              }}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-all whitespace-nowrap rounded-lg ${
                levelId === lvl && !generated
                  ? 'bg-[#ff4b89] text-black font-black shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-1">
                L{index + 1}
                {scores[lvl] && <StarRow count={scores[lvl].stars} size={8} dim={levelId === lvl && !generated} />}
              </span>
            </button>
          ))}

          <button
            onClick={handleDailyChallenge}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-all whitespace-nowrap rounded-lg flex items-center gap-1 ${
              generated && isDailyLevelId(generated.level_id)
                ? 'bg-amber-400 text-black font-black'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title="Nivel diario único para todos"
          >
            <Calendar className="w-3 h-3 text-amber-400" />
            <span>HOY</span>
            {todayScore && <StarRow count={todayScore.stars} size={8} />}
          </button>

          <button
            onClick={handleGenerateLevel}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase transition-all whitespace-nowrap rounded-lg flex items-center gap-1 ${
              generated && !isDailyLevelId(generated.level_id)
                ? 'bg-emerald-400 text-black font-black'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title="Generar nivel aleatorio infinito"
          >
            <Dices className="w-3 h-3 text-emerald-400" />
            <span>AZAR</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleResetLevel}
            className="p-2 bg-black/80 border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all shadow-lg"
            title="Reiniciar Nivel (R)"
          >
            <RotateCcw className="w-4 h-4 text-[#c3f400]" />
          </button>

          <button
            onClick={() => setIsSoundMuted(!isSoundMuted)}
            className="p-2 bg-black/80 border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all shadow-lg"
            title={isSoundMuted ? 'Activar Sonido' : 'Silenciar Sonido'}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#ff4b89]" />}
          </button>

          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2 bg-black/80 border border-white/20 rounded-xl text-white hover:bg-white/10 transition-all shadow-lg"
            title="Cómo jugar"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      <div className="absolute top-16 left-4 z-20 flex items-center gap-3 pointer-events-none">
        <div className="relative flex flex-col items-center justify-center w-16 h-20 sm:w-20 sm:h-24 rounded-3xl bg-gradient-to-b from-rose-500 to-red-600 border-4 border-white shadow-[0_10px_25px_rgba(225,29,72,0.6)] overflow-hidden">
          <div className="absolute -top-6 left-0 right-0 h-10 bg-white/35 rounded-full blur-[1px]" />
          <div className="text-[9px] sm:text-[10px] font-black uppercase text-white tracking-wider mt-1 drop-shadow">
            BOLAS
          </div>
          <div className="w-[85%] h-[58%] rounded-2xl bg-white flex items-center justify-center shadow-inner mt-1 mb-1.5">
            <span className="text-xl sm:text-2xl font-black text-rose-600 tabular-nums">
              {stats.remainingBalls}
            </span>
          </div>
        </div>

        <div className="bg-black/80 border border-pink-500/50 px-3.5 py-2.5 rounded-2xl shadow-xl backdrop-blur-md flex flex-col gap-0.5">
          <div className="text-[8px] uppercase tracking-widest text-pink-300 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-pink-400" />
            <span>OBJETIVO</span>
          </div>
          <div className="text-xs sm:text-sm font-black text-white">
            {stats.totalMemoryBlocks - stats.memoryBlocksLeft} / {stats.totalMemoryBlocks} MEMORIAS
          </div>
        </div>
      </div>
    </>
  );
}
