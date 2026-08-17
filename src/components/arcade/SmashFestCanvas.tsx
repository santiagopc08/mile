'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  HelpCircle,
  Zap,
  Bomb,
  Hammer,
  CircleDot,
  Dices,
  Star,
  Calendar,
  Eye,
} from 'lucide-react';
import {
  DEFAULT_LEVELS,
  INITIAL_OVERCHARGE,
  INITIAL_WILDCARD_AMMO,
  MAX_SHOT_POWER,
  MIN_SHOT_POWER,
  type WildcardType,
  type LevelSchema,
  type LevelResult,
  type WildcardAmmo,
} from '@/app/smash-fest/components/SmashFestGame';
import {
  generateLevel,
  generateDailyLevel,
  dailyLevelId,
  isDailyLevelId,
  randomSeed,
  type Difficulty,
} from '@/app/smash-fest/lib/levelGenerator';
import { loadLocalScores, recordScore, starsFor, syncScores, type ScoreMap } from '@/app/smash-fest/lib/scores';
import type { MemoryItem } from '@/app/smash-fest/lib/memories';
import { useProfile } from '@/context/ProfileContext';

const SmashFest3D = dynamic(() => import('@/app/smash-fest/components/SmashFestGame'), {
  ssr: false,
  loading: () => (
    <div className="flex w-full h-full min-h-[500px] items-center justify-center text-white font-mono uppercase text-xs">
      <span className="animate-spin text-[#ff4b89] mr-2">◆</span> CARGANDO MOTOR 3D Y FÍSICA CANNON...
    </div>
  ),
});

const DEFAULT_LEVEL_KEYS = Object.keys(DEFAULT_LEVELS);

function StarRow({ count, size = 12, dim = false }: { count: number; size?: number; dim?: boolean }) {
  return (
    <span className="inline-flex items-center gap-[2px]">
      {[1, 2, 3].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={
            n <= count
              ? dim
                ? 'fill-[#c3f400]/70 text-[#c3f400]/70'
                : 'fill-[#c3f400] text-[#c3f400]'
              : 'text-white/20'
          }
        />
      ))}
    </span>
  );
}

interface SmashFestCanvasProps {
  accentColor?: string;
}

export function SmashFestCanvas({ accentColor = '#ff4b89' }: SmashFestCanvasProps) {
  const [levelId, setLevelId] = useState<string>('level_1');
  const [activeWildcard, setActiveWildcard] = useState<WildcardType>('standard');
  const [shotPower, setShotPower] = useState<number>(1.0);
  const [memoryToasts, setMemoryToasts] = useState<{ id: number; label: string; icon?: string }[]>([]);
  const [comboToast, setComboToast] = useState<{ count: number; label: string } | null>(null);
  const [wildcardAmmo, setWildcardAmmo] = useState<WildcardAmmo>(INITIAL_WILDCARD_AMMO);
  const [overcharge, setOvercharge] = useState<number>(INITIAL_OVERCHARGE);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const [isOutOfAmmoModalOpen, setIsOutOfAmmoModalOpen] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [stats, setStats] = useState({ remainingBalls: 8, memoryBlocksLeft: 1, totalMemoryBlocks: 1 });
  const [resetKey, setResetKey] = useState(0);
  const [generated, setGenerated] = useState<LevelSchema | null>(null);
  const [scores, setScores] = useState<ScoreMap>({});
  const [lastRun, setLastRun] = useState<{ stars: number; shotsUsed: number; isRecord: boolean } | null>(null);
  const { profile } = useProfile();
  const toastCounter = useRef(0);
  const toastTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = toastTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const todayScore = scores[dailyLevelId()];

  useEffect(() => {
    void syncScores(profile).then(setScores);
  }, [profile]);

  const handleResetLevel = useCallback(() => {
    setResetKey((prev) => prev + 1);
    setIsVictoryModalOpen(false);
    setIsOutOfAmmoModalOpen(false);
    setMemoryToasts([]);
    setComboToast(null);
  }, []);

  const handleGenerateLevel = useCallback(() => {
    const index = DEFAULT_LEVEL_KEYS.indexOf(levelId);
    const difficulty = (Math.min(5, Math.max(1, index + 1)) || 3) as Difficulty;
    setGenerated(generateLevel(randomSeed(), difficulty));
    setResetKey((prev) => prev + 1);
    setIsVictoryModalOpen(false);
    setIsOutOfAmmoModalOpen(false);
    setMemoryToasts([]);
    setComboToast(null);
  }, [levelId]);

  const handleDailyChallenge = useCallback(() => {
    setGenerated(generateDailyLevel());
    setResetKey((prev) => prev + 1);
    setIsVictoryModalOpen(false);
    setIsOutOfAmmoModalOpen(false);
    setMemoryToasts([]);
    setComboToast(null);
  }, []);

  const handleNextLevel = useCallback(() => {
    if (generated) {
      handleGenerateLevel();
      return;
    }
    const levelKeys = DEFAULT_LEVEL_KEYS;
    setLevelId((currentLvl) => {
      const currentIndex = levelKeys.indexOf(currentLvl);
      const nextIndex = (currentIndex + 1) % levelKeys.length;
      return levelKeys[nextIndex];
    });

    setResetKey((prev) => prev + 1);
    setIsVictoryModalOpen(false);
    setIsOutOfAmmoModalOpen(false);
    setMemoryToasts([]);
    setComboToast(null);
  }, [generated, handleGenerateLevel]);

  const handleMemoryBlockTriggered = useCallback((memory?: MemoryItem) => {
    const id = toastCounter.current++;
    const label = memory ? `${memory.icon} ${memory.title}` : '¡RECUERDO LIBERADO!';
    setMemoryToasts((prev) => [...prev.slice(-2), { id, label, icon: memory?.icon }]);
    const timer = setTimeout(() => {
      setMemoryToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimers.current = toastTimers.current.filter((t) => t !== timer);
    }, 3200);
    toastTimers.current.push(timer);
  }, []);

  const handleComboTriggered = useCallback((comboCount: number) => {
    const labels = ['', '', '¡COMBO x2! ⚡', '¡DEMOLICIÓN MASIVA x3! 🔥', '¡INCOMPARABLE x4! 💥'];
    const label = labels[Math.min(comboCount, labels.length - 1)] || `¡COMBO x${comboCount}! 🚀`;
    setComboToast({ count: comboCount, label });
    const timer = setTimeout(() => setComboToast(null), 2000);
    toastTimers.current.push(timer);
  }, []);

  const handleWildcardAmmoUpdate = useCallback((ammo: WildcardAmmo) => {
    setWildcardAmmo(ammo);
    setActiveWildcard((current) => {
      if (current !== 'standard' && ammo[current] <= 0) {
        return 'standard';
      }
      return current;
    });
  }, []);

  const handleOverchargeUpdate = useCallback((left: number) => {
    setOvercharge(left);
    if (left <= 0) setShotPower((power) => Math.min(power, 1));
  }, []);

  const handleLevelCompleted = useCallback(
    (result: LevelResult) => {
      const stars = starsFor(result.shotsUsed, result.projectileLimit);
      const scoreKey = generated ? (isDailyLevelId(generated.level_id) ? generated.level_id : null) : levelId;

      if (scoreKey) {
        const { isRecord } = recordScore(scoreKey, { stars, shotsUsed: result.shotsUsed }, profile);
        setScores(loadLocalScores());
        setLastRun({ stars, shotsUsed: result.shotsUsed, isRecord });
      } else {
        setLastRun({ stars, shotsUsed: result.shotsUsed, isRecord: false });
      }

      setIsVictoryModalOpen(true);
    },
    [generated, levelId, profile]
  );

  const handleOutOfAmmo = useCallback(() => {
    setIsOutOfAmmoModalOpen(true);
  }, []);

  const handleStatsUpdate = useCallback((newStats: { remainingBalls: number; memoryBlocksLeft: number; totalMemoryBlocks: number }) => {
    setStats(newStats);
  }, []);

  // Keyboard shortcut listeners for power & wildcards
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') setActiveWildcard('standard');
      if (e.key === '2' && wildcardAmmo.bomb > 0) setActiveWildcard('bomb');
      if (e.key === '3' && wildcardAmmo.triple > 0) setActiveWildcard('triple');
      if (e.key === '4' && wildcardAmmo.heavy > 0) setActiveWildcard('heavy');
      if (e.key === 'r' || e.key === 'R') handleResetLevel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [wildcardAmmo, handleResetLevel]);

  return (
    <div className="relative h-[74vh] max-h-[820px] min-h-[540px] w-full overflow-hidden rounded-3xl border border-white/15 bg-[#0a0814] shadow-[0_24px_70px_rgba(0,0,0,0.85)] select-none font-mono">
      {/* Top Floating Mini-Header for Campaign Level Switcher */}
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

      {/* Target Progress & Memory Blocks Counter */}
      <div className="absolute top-16 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="bg-black/85 border border-pink-500/50 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(255,75,137,0.3)] backdrop-blur-md flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#ff4b89] animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-widest text-white/50 font-bold">OBJETIVOS</span>
            <span className="text-xs sm:text-sm font-black text-white">
              {stats.totalMemoryBlocks - stats.memoryBlocksLeft} / {stats.totalMemoryBlocks} MEMORIAS
            </span>
          </div>
        </div>

        <div className="bg-black/85 border border-white/20 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-2">
          <CircleDot className="w-4 h-4 text-yellow-400" />
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-widest text-white/50 font-bold">MUNICIÓN</span>
            <span className="text-xs sm:text-sm font-black text-yellow-400">
              {stats.remainingBalls} DISPAROS
            </span>
          </div>
        </div>
      </div>

      {/* Interactive 3D Canvas */}
      <div className="absolute inset-0 w-full h-full">
        <SmashFest3D
          levelId={levelId}
          activeWildcard={activeWildcard}
          shotPower={shotPower}
          resetKey={resetKey}
          levelOverride={generated}
          onMemoryBlockTriggered={handleMemoryBlockTriggered}
          onComboTriggered={handleComboTriggered}
          onWildcardAmmoUpdate={handleWildcardAmmoUpdate}
          onOverchargeUpdate={handleOverchargeUpdate}
          onLevelCompleted={handleLevelCompleted}
          onOutOfAmmo={handleOutOfAmmo}
          onStatsUpdate={handleStatsUpdate}
          isSoundMuted={isSoundMuted}
        />
      </div>

      {/* Bottom Floating Control Tray: Wildcard Ammo & Power Dial */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-end justify-between gap-3 pointer-events-none">
        {/* Wildcards Ammo Selector */}
        <div className="flex items-center gap-1.5 bg-black/85 border border-white/20 p-1.5 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto">
          {[
            { id: 'standard' as const, label: 'ESTÁNDAR', icon: CircleDot, count: '∞', color: '#ff4b89', shortcut: '1' },
            { id: 'bomb' as const, label: 'BOMBA', icon: Bomb, count: wildcardAmmo.bomb, color: '#f43f5e', shortcut: '2' },
            { id: 'triple' as const, label: 'TRIPLE', icon: Zap, count: wildcardAmmo.triple, color: '#38bdf8', shortcut: '3' },
            { id: 'heavy' as const, label: 'DEMOLEDOR', icon: Hammer, count: wildcardAmmo.heavy, color: '#f59e0b', shortcut: '4' },
          ].map((wc) => {
            const Icon = wc.icon;
            const isSelected = activeWildcard === wc.id;
            const isAvailable = wc.id === 'standard' || Number(wc.count) > 0;

            return (
              <button
                key={wc.id}
                type="button"
                disabled={!isAvailable}
                onClick={() => isAvailable && setActiveWildcard(wc.id)}
                className={`flex flex-col items-center px-2.5 py-1.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-[#ff4b89]/30 border-[#ff4b89] shadow-[0_0_15px_rgba(255,75,137,0.5)] scale-105'
                    : isAvailable
                    ? 'border-white/10 hover:border-white/30 hover:bg-white/5'
                    : 'border-white/5 opacity-30 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Icon className="w-3.5 h-3.5" style={{ color: wc.color }} />
                  <span className="text-[8px] font-mono text-white/50">{wc.shortcut}</span>
                </div>
                <span className="text-[9px] font-bold uppercase text-white mt-0.5">{wc.label}</span>
                <span className="text-[10px] font-black text-white/80 tabular-nums">({wc.count})</span>
              </button>
            );
          })}
        </div>

        {/* Shot Power Dial / Overcharge */}
        <div className="bg-black/85 border border-white/20 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto flex flex-col gap-1.5 min-w-[170px]">
          <div className="flex items-center justify-between text-[9px] font-bold">
            <span className="text-white/60 uppercase">POTENCIA DISPARO</span>
            <span className={shotPower > 1.0 ? 'text-[#c3f400] font-black animate-pulse' : 'text-white'}>
              {Math.round(shotPower * 100)}% {shotPower > 1.0 && `(SOBRECARGA ${overcharge})`}
            </span>
          </div>
          <input
            type="range"
            min={MIN_SHOT_POWER}
            max={overcharge > 0 ? MAX_SHOT_POWER : 1.0}
            step={0.05}
            value={shotPower}
            onChange={(e) => setShotPower(parseFloat(e.target.value))}
            className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#ff4b89]"
          />
        </div>
      </div>

      {/* Floating Memory & Combo Toasts */}
      <div className="absolute top-20 right-4 z-30 flex flex-col gap-2 pointer-events-none">
        {comboToast && (
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 border border-pink-400 px-4 py-2 rounded-2xl shadow-[0_0_25px_rgba(236,72,153,0.7)] text-white text-xs font-black uppercase tracking-wider animate-bounce">
            {comboToast.label}
          </div>
        )}

        {memoryToasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-black/90 border border-cyan-400/60 px-4 py-2 rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.4)] backdrop-blur-md text-cyan-300 text-xs font-bold flex items-center gap-2 animate-slide-in-bottom"
          >
            <span>{toast.icon || '✨'}</span>
            <span>{toast.label}</span>
          </div>
        ))}
      </div>

      {/* Victory Modal */}
      {isVictoryModalOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
          <div className="max-w-md w-full border border-[#ff4b89]/50 bg-slate-950/95 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(255,75,137,0.5)] text-center font-mono">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3 animate-bounce" />
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider mb-2">
              ¡ESTRUCTURA DEMOLIDA! 💥
            </h2>
            <div className="flex justify-center mb-4">
              <StarRow count={lastRun?.stars || 3} size={24} />
            </div>
            <p className="text-xs text-white/70 mb-6 leading-relaxed">
              Has liberado todos los bloques de memoria usando {lastRun?.shotsUsed} disparos.
              {lastRun?.isRecord && <span className="block text-[#c3f400] font-bold mt-1">¡NUEVO RÉCORD DE EFICIENCIA! 🏆</span>}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleResetLevel}
                className="flex-1 py-3 bg-white/10 border border-white/20 text-white font-bold uppercase text-xs tracking-wider rounded-xl hover:bg-white/20 transition-all"
              >
                REPETIR 🔄
              </button>
              <button
                onClick={handleNextLevel}
                className="flex-1 py-3 bg-gradient-to-r from-[#ff4b89] to-pink-600 text-black font-black uppercase text-xs tracking-wider rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,75,137,0.6)]"
              >
                SIGUIENTE NIVEL ⏩
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Out of Ammo Modal */}
      {isOutOfAmmoModalOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
          <div className="max-w-md w-full border border-red-500/50 bg-slate-950/95 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.5)] text-center font-mono">
            <CircleDot className="w-12 h-12 text-red-400 mx-auto mb-3 animate-pulse" />
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider mb-2">
              MUNICIÓN AGOTADA 🛑
            </h2>
            <p className="text-xs text-white/70 mb-6 leading-relaxed">
              Te has quedado sin proyectiles antes de poder liberar todas las memorias. ¡Ajusta tu ángulo y dispara a los puntos débiles de la base!
            </p>

            <button
              onClick={handleResetLevel}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-black uppercase text-sm tracking-widest rounded-xl hover:scale-105 transition-all shadow-[0_0_25px_rgba(239,68,68,0.6)]"
            >
              REINTENTAR 🔄
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
          <div className="max-w-lg w-full border border-cyan-500/50 bg-slate-950/95 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.4)] text-left font-mono">
            <h3 className="text-xl font-black text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" /> GUÍA DE DEMOLICIÓN SMASH FEST
            </h3>
            <ul className="text-xs text-white/80 space-y-3 leading-relaxed mb-6">
              <li>🎯 <strong>Apuntar y Disparar:</strong> Haz clic y arrastra con el ratón o desliza con el dedo para ver la trayectoria parabólica. Suelta para disparar el cañón.</li>
              <li>🌀 <strong>Girar Cámara:</strong> Arrastra con dos dedos en móvil o usa el botón derecho en PC para rotar alrededor de la estructura y buscar vigas débiles.</li>
              <li>💣 <strong>Comodines Especiales:</strong> Usa las teclas 1-4 o la barra inferior para cambiar entre Balas Estándar, Bombas de Choque, Disparo Triple y Bola de Demolición.</li>
              <li>✨ <strong>Bloques de Memoria:</strong> Haz caer los bloques brillantes fuera de su pedestal para liberar los recuerdos de la relación y ganar estrellas.</li>
            </ul>
            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-3 bg-cyan-500 text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-cyan-400 transition-all"
            >
              ¡ENTENDIDO, A DEMOLER! 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
