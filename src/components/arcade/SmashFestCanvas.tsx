'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  DEFAULT_LEVELS,
  INITIAL_OVERCHARGE,
  INITIAL_WILDCARD_AMMO,
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
import { useArcadeProgression } from '@/hooks/useArcadeProgression';

import { TopBars } from './smashfest/TopBars';
import { BottomControls } from './smashfest/BottomControls';
import { Modals } from './smashfest/Modals';

const SmashFest3D = dynamic(() => import('@/app/smash-fest/components/SmashFestGame'), {
  ssr: false,
  loading: () => (
    <div className="flex w-full h-full min-h-[500px] items-center justify-center text-white font-mono uppercase text-xs">
      <span className="animate-spin text-[#ff4b89] mr-2">◆</span> CARGANDO MOTOR 3D Y FÍSICA CANNON...
    </div>
  ),
});

const DEFAULT_LEVEL_KEYS = Object.keys(DEFAULT_LEVELS);

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
  const { recordScore: recordArcadeScore } = useArcadeProgression();
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

      // Record arcade progression score
      const earnedPts = stars * 400 + Math.max(0, result.projectileLimit - result.shotsUsed) * 150;
      recordArcadeScore('smashfest', earnedPts);

      setIsVictoryModalOpen(true);
    },
    [generated, levelId, profile, recordArcadeScore]
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
      <TopBars
        levelId={levelId}
        setLevelId={setLevelId}
        generated={generated}
        setGenerated={setGenerated}
        scores={scores}
        todayScore={todayScore}
        handleResetLevel={handleResetLevel}
        handleDailyChallenge={handleDailyChallenge}
        handleGenerateLevel={handleGenerateLevel}
        isSoundMuted={isSoundMuted}
        setIsSoundMuted={setIsSoundMuted}
        setIsHelpOpen={setIsHelpOpen}
        stats={stats}
      />

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

      <BottomControls
        activeWildcard={activeWildcard}
        setActiveWildcard={setActiveWildcard}
        wildcardAmmo={wildcardAmmo}
        shotPower={shotPower}
        setShotPower={setShotPower}
        overcharge={overcharge}
      />

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

      <Modals
        isVictoryModalOpen={isVictoryModalOpen}
        isOutOfAmmoModalOpen={isOutOfAmmoModalOpen}
        isHelpOpen={isHelpOpen}
        setIsHelpOpen={setIsHelpOpen}
        lastRun={lastRun}
        handleResetLevel={handleResetLevel}
        handleNextLevel={handleNextLevel}
      />
    </div>
  );
}
