import { useState, useCallback, useEffect, useRef } from 'react';
import {
  INITIAL_OVERCHARGE,
  INITIAL_WILDCARD_AMMO,
  type WildcardType,
  type LevelSchema,
  type LevelResult,
  type WildcardAmmo,
  DEFAULT_LEVELS,
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

const DEFAULT_LEVEL_KEYS = Object.keys(DEFAULT_LEVELS);

export function useSmashFest() {
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

  return {
    levelId,
    setLevelId,
    activeWildcard,
    setActiveWildcard,
    shotPower,
    setShotPower,
    memoryToasts,
    comboToast,
    wildcardAmmo,
    overcharge,
    isVictoryModalOpen,
    isOutOfAmmoModalOpen,
    isSoundMuted,
    setIsSoundMuted,
    isHelpOpen,
    setIsHelpOpen,
    stats,
    resetKey,
    generated,
    setGenerated,
    scores,
    todayScore,
    lastRun,
    handleResetLevel,
    handleGenerateLevel,
    handleDailyChallenge,
    handleNextLevel,
    handleMemoryBlockTriggered,
    handleComboTriggered,
    handleWildcardAmmoUpdate,
    handleOverchargeUpdate,
    handleLevelCompleted,
    handleOutOfAmmo,
    handleStatsUpdate,
  };
}
