"use client";

import dynamic from "next/dynamic";
import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Sparkles, Trophy, HelpCircle, Zap, Bomb, Hammer, CircleDot, Dices, Star, Calendar } from "lucide-react";
import Link from "next/link";
import { ChamferedPanel } from "@/components/ui/ChamferedPanel";
import { CyberButton } from "@/components/ui/CyberButton";
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
} from "./components/SmashFestGame";
import {
  generateLevel,
  generateDailyLevel,
  dailyLevelId,
  isDailyLevelId,
  randomSeed,
  type Difficulty,
} from "./lib/levelGenerator";
import { loadLocalScores, recordScore, starsFor, syncScores, type ScoreMap } from "./lib/scores";
import type { MemoryItem } from "./lib/memories";
import { useProfile } from "@/context/ProfileContext";

const SmashFestGame = dynamic(() => import("./components/SmashFestGame"), {
  ssr: false,
  loading: () => (
    <div className="flex w-full h-full items-center justify-center text-white font-mono uppercase text-xs">
      <span className="animate-spin-slow text-[#ff4b89] mr-2">◆</span> CARGANDO MOTOR DE FÍSICA Y NIVELES...
    </div>
  ),
});

function StarRow({ count, size = 10, dim = false }: { count: number; size?: number; dim?: boolean }) {
  return (
    <span className="inline-flex items-center gap-[1px]" aria-label={`${count} de 3 estrellas`}>
      {[1, 2, 3].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={
            n <= count
              ? dim
                ? "fill-[#c3f400]/70 text-[#c3f400]/70"
                : "fill-[#c3f400] text-[#c3f400]"
              : "text-white/25"
          }
        />
      ))}
    </span>
  );
}

export default function SmashFestPage() {
  const [levelId, setLevelId] = useState<string>("level_1");
  const [activeWildcard, setActiveWildcard] = useState<WildcardType>("standard");
  const [shotPower, setShotPower] = useState<number>(1.0);
  const [memoryToasts, setMemoryToasts] = useState<{ id: number; label: string; icon?: string }[]>([]);
  const [comboToast, setComboToast] = useState<{ count: number; label: string } | null>(null);
  // Shares the engine's constants so the HUD can never disagree with the rules.
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

  // Today's stored result, so the HOY button can show it was already cleared.
  const todayScore = scores[dailyLevelId()];

  // `syncScores` starts from the local copy and merges the remote one on top,
  // so a single resolution covers both offline and synced cases.
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

  // Rolls a fresh procedural level. Difficulty tracks the level currently
  // selected, so the dice stays meaningful as the player advances.
  const handleGenerateLevel = useCallback(() => {
    const index = Object.keys(DEFAULT_LEVELS).indexOf(levelId);
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
    const levelKeys = Object.keys(DEFAULT_LEVELS);
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
    const label = memory ? `${memory.icon} ${memory.title}` : "¡RECUERDO LIBERADO!";
    setMemoryToasts((prev) => [...prev.slice(-2), { id, label, icon: memory?.icon }]);
    const timer = setTimeout(() => {
      setMemoryToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimers.current = toastTimers.current.filter((t) => t !== timer);
    }, 3200);
    toastTimers.current.push(timer);
  }, []);

  const handleComboTriggered = useCallback((comboCount: number) => {
    const labels = ["", "", "¡COMBO x2! ⚡", "¡DEMOLICIÓN MASIVA x3! 🔥", "¡INCOMPARABLE x4! 💥"];
    const label = labels[Math.min(comboCount, labels.length - 1)] || `¡COMBO x${comboCount}! 🚀`;
    setComboToast({ count: comboCount, label });
    const timer = setTimeout(() => setComboToast(null), 2000);
    toastTimers.current.push(timer);
  }, []);

  const handleWildcardAmmoUpdate = useCallback((ammo: WildcardAmmo) => {
    setWildcardAmmo(ammo);
    // If active wildcard ran out of ammo, auto-switch to standard
    setActiveWildcard((current) => {
      if (current !== "standard" && ammo[current] <= 0) {
        return "standard";
      }
      return current;
    });
  }, []);

  // The engine is the authority on how much overcharge is left; the slider just
  // follows it back down so the dial can't show a power the shot won't have.
  const handleOverchargeUpdate = useCallback((left: number) => {
    setOvercharge(left);
    if (left <= 0) setShotPower((power) => Math.min(power, 1));
  }, []);

  const handleLevelCompleted = useCallback(
    (result: LevelResult) => {
      const stars = starsFor(result.shotsUsed, result.projectileLimit);

      // The daily challenge is worth remembering (it is the same level for
      // everyone, all day). Other generated levels are one-off seeds nobody
      // will play again, so recording them is just clutter.
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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0c0a14] touch-none font-mono select-none">
      {/* Top Glass Floating Header & Controls */}
      <header className="fixed top-3 left-3 right-3 z-40 flex flex-wrap items-center justify-between gap-2 p-2.5 sm:px-4 bg-white/[0.04] backdrop-blur-2xl border border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.6)] rounded-none pointer-events-auto">
        <div className="flex items-center gap-2">
          <Link href="/">
            <CyberButton variant="secondary" size="xs">
              <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">VOLVER</span>
            </CyberButton>
          </Link>

          {/* Level Selector Pills */}
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 p-1 overflow-x-auto max-w-[280px] sm:max-w-none scrollbar-none">
            {Object.keys(DEFAULT_LEVELS).map((lvl, index) => (
              <button
                key={lvl}
                onClick={() => {
                  setLevelId(lvl);
                  setGenerated(null);
                  handleResetLevel();
                }}
                className={`px-2 py-1 text-[9px] font-bold uppercase transition-all whitespace-nowrap ${
                  levelId === lvl && !generated
                    ? "bg-[#ff4b89] text-black font-black"
                    : "text-[#a88a7e] hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-1">
                  NIVEL {index + 1}
                  {scores[lvl] && <StarRow count={scores[lvl].stars} size={7} dim={levelId === lvl && !generated} />}
                </span>
              </button>
            ))}

            <button
              onClick={handleDailyChallenge}
              title="Cargar desafío del día"
              className={`flex items-center gap-1 px-2 py-1 text-[9px] font-bold uppercase transition-all whitespace-nowrap ${
                isDailyLevelId(generated?.level_id)
                  ? "bg-[#ff4b89] text-black font-black shadow-[0_0_10px_rgba(255,75,137,0.5)]"
                  : "text-[#a88a7e] hover:text-white hover:bg-white/10"
              }`}
            >
              <Calendar className="w-3 h-3 text-[#ff4b89]" /> HOY
              {todayScore ? (
                <StarRow count={todayScore.stars} size={7} dim={isDailyLevelId(generated?.level_id)} />
              ) : (
                <span aria-hidden>📅</span>
              )}
            </button>

            <button
              onClick={handleGenerateLevel}
              title="Generar nivel aleatorio"
              className={`flex items-center gap-1 px-2 py-1 text-[9px] font-bold uppercase transition-all whitespace-nowrap ${
                generated && !isDailyLevelId(generated.level_id)
                  ? "bg-[#00dbe9] text-black font-black"
                  : "text-[#a88a7e] hover:text-white hover:bg-white/10"
              }`}
            >
              <Dices className="w-3 h-3" /> ALEATORIO
            </button>
          </div>
        </div>

        {/* Live Level Stats & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 text-[10px]">
          <div className="hidden md:flex items-center gap-1.5 border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[#a88a7e]">
            <span>PROYECTILES:</span>
            <span className="font-bold text-white">{stats.remainingBalls}</span>
          </div>

          {generated && (
            <div className="hidden lg:flex items-center gap-1.5 border border-[#00dbe9]/30 bg-[#00dbe9]/5 px-2.5 py-1 text-[#00dbe9]">
              <span className="uppercase truncate max-w-[160px]">{generated.name}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 border border-white/10 bg-white/[0.03] px-2 py-1 text-[#a88a7e]">
            <span className="text-[#ff4b89] animate-pulse">◆</span>
            <span className="hidden sm:inline">RECUERDOS:</span>
            <span className="font-bold text-white">
              {stats.totalMemoryBlocks - stats.memoryBlocksLeft}/{stats.totalMemoryBlocks}
            </span>
          </div>

          {/* Utility Buttons */}
          <button
            onClick={handleResetLevel}
            className="flex h-8 w-8 items-center justify-center border border-white/12 bg-white/[0.04] text-[#a88a7e] hover:text-white hover:border-white/30 transition-all"
            title="Reiniciar Nivel"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsSoundMuted(!isSoundMuted)}
            className="flex h-8 w-8 items-center justify-center border border-white/12 bg-white/[0.04] text-[#a88a7e] hover:text-white hover:border-white/30 transition-all"
            title={isSoundMuted ? "Activar Sonido" : "Silenciar Sonido"}
          >
            {isSoundMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#c3f400]" />}
          </button>

          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex h-8 w-8 items-center justify-center border border-white/12 bg-white/[0.04] text-[#a88a7e] hover:text-white hover:border-white/30 transition-all"
            title="Ayuda"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Floating Bottom Wildcards Bar (COMODINES & POTENCIA) */}
      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col sm:flex-row items-center gap-2.5 p-2 sm:px-4 bg-white/[0.04] backdrop-blur-2xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.7)] pointer-events-auto">
        {/* Wildcard Selector Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-[#a88a7e] uppercase mr-1 hidden md:inline">COMODÍN:</span>
          
          <button
            onClick={() => setActiveWildcard("standard")}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold uppercase transition-all ${
              activeWildcard === "standard"
                ? "bg-[#ff4b89] text-black shadow-[0_0_12px_rgba(255,75,137,0.6)]"
                : "border border-white/10 text-[#a88a7e] hover:text-white hover:bg-white/10"
            }`}
          >
            <CircleDot className="w-3 h-3" /> ESTÁNDAR
          </button>

          <button
            onClick={() => wildcardAmmo.bomb > 0 && setActiveWildcard("bomb")}
            disabled={wildcardAmmo.bomb <= 0}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold uppercase transition-all ${
              wildcardAmmo.bomb <= 0
                ? "opacity-35 border border-white/5 text-gray-500 cursor-not-allowed"
                : activeWildcard === "bomb"
                ? "bg-[#ff003c] text-white shadow-[0_0_12px_rgba(255,0,60,0.7)]"
                : "border border-white/10 text-[#a88a7e] hover:text-white hover:bg-white/10"
            }`}
          >
            <Bomb className="w-3 h-3 text-red-400" /> BOMBA
            <span className="ml-0.5 text-[8px] font-black opacity-80">({wildcardAmmo.bomb})</span>
          </button>

          <button
            onClick={() => wildcardAmmo.triple > 0 && setActiveWildcard("triple")}
            disabled={wildcardAmmo.triple <= 0}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold uppercase transition-all ${
              wildcardAmmo.triple <= 0
                ? "opacity-35 border border-white/5 text-gray-500 cursor-not-allowed"
                : activeWildcard === "triple"
                ? "bg-[#c3f400] text-black shadow-[0_0_12px_rgba(195,244,0,0.6)]"
                : "border border-white/10 text-[#a88a7e] hover:text-white hover:bg-white/10"
            }`}
          >
            <Zap className="w-3 h-3 text-lime-400" /> TRÍPTICO
            <span className="ml-0.5 text-[8px] font-black opacity-80">({wildcardAmmo.triple})</span>
          </button>

          <button
            onClick={() => wildcardAmmo.heavy > 0 && setActiveWildcard("heavy")}
            disabled={wildcardAmmo.heavy <= 0}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold uppercase transition-all ${
              wildcardAmmo.heavy <= 0
                ? "opacity-35 border border-white/5 text-gray-500 cursor-not-allowed"
                : activeWildcard === "heavy"
                ? "bg-[#a178ff] text-black shadow-[0_0_12px_rgba(161,120,255,0.6)]"
                : "border border-white/10 text-[#a88a7e] hover:text-white hover:bg-white/10"
            }`}
          >
            <Hammer className="w-3 h-3 text-purple-300" /> YUNQUE
            <span className="ml-0.5 text-[8px] font-black opacity-80">({wildcardAmmo.heavy})</span>
          </button>
        </div>

        {/* Shot Power Regulator — past 100% it eats an overcharge charge */}
        <div className="flex items-center gap-2 pl-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-1.5 sm:pt-0">
          <span className="text-[9px] font-bold text-[#a88a7e] uppercase">POTENCIA:</span>
          <input
            type="range"
            min={MIN_SHOT_POWER}
            max={overcharge > 0 ? MAX_SHOT_POWER : 1}
            step="0.05"
            value={shotPower}
            onChange={(e) => setShotPower(parseFloat(e.target.value))}
            className={`w-20 sm:w-24 cursor-pointer ${shotPower > 1 ? "accent-[#c3f400]" : "accent-[#ff4b89]"}`}
          />
          <span className={`text-[10px] font-bold w-8 ${shotPower > 1 ? "text-[#c3f400]" : "text-white"}`}>
            {Math.round(shotPower * 100)}%
          </span>
          <span
            title="Sobrecarga: disparos por encima del 100%"
            className={`flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-black uppercase border ${
              overcharge > 0
                ? "border-[#c3f400]/40 bg-[#c3f400]/10 text-[#c3f400]"
                : "border-white/10 text-gray-500 line-through"
            }`}
          >
            <Zap className="w-2.5 h-2.5" />
            {overcharge}
          </span>
        </div>
      </footer>

      {/* 3D Physics Game Canvas */}
      <Suspense
        fallback={
          <div className="flex w-full h-full items-center justify-center text-white font-mono uppercase text-xs">
            <span className="animate-spin-slow text-[#ff4b89] mr-2">◆</span> CARGANDO FÍSICA 3D...
          </div>
        }
      >
        {/* No `key` here on purpose: remounting the component threw away the
            WebGL context on every reset. The game rebuilds the scene from
            `resetKey` internally instead. */}
        <SmashFestGame
          levelId={levelId}
          resetKey={resetKey}
          levelOverride={generated}
          activeWildcard={activeWildcard}
          shotPower={shotPower}
          isSoundMuted={isSoundMuted}
          onMemoryBlockTriggered={handleMemoryBlockTriggered}
          onComboTriggered={handleComboTriggered}
          onWildcardAmmoUpdate={handleWildcardAmmoUpdate}
          onOverchargeUpdate={handleOverchargeUpdate}
          onLevelCompleted={handleLevelCompleted}
          onOutOfAmmo={handleOutOfAmmo}
          onStatsUpdate={handleStatsUpdate}
        />
      </Suspense>

      {/* Combo Feedback Overlay Toast */}
      {comboToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[46] animate-bounce pointer-events-none">
          <div className="px-4 py-1.5 bg-[#c3f400] text-black font-mono font-black text-xs uppercase tracking-widest border border-white shadow-[0_0_20px_rgba(195,244,0,0.8)]">
            {comboToast.label}
          </div>
        </div>
      )}

      {/* Help & Powerups Guide Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 pointer-events-auto backdrop-blur-md p-4">
          <ChamferedPanel accentColor="#00dbe9" notchSize={16} label="GUÍA DE COMODINES Y FÍSICA" className="max-w-md text-center">
            <h2 className="text-base font-bold uppercase text-white tracking-wide mb-3 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00dbe9]" /> MANUAL DE DEMOLICIÓN
            </h2>
            <div className="space-y-2.5 text-[10.5px] leading-relaxed text-[#e1bfb2] mb-6 text-left border-t border-b border-white/10 py-3">
              <p>🎯 <strong className="text-white">Trayectoria Real:</strong> El arco muestra la parábola exacta del disparo y la mirilla marca el impacto. Arrastra para girar la cámara, toca para disparar.</p>
              <p>🏛️ <strong className="text-white">La Plataforma:</strong> Cada formación se alza sobre su propia plataforma. Un recuerdo derribado <em>encima</em> de ella no cuenta: tiene que caer por el borde. Empuja hacia los lados, no solo hacia abajo.</p>
              <p>🧱 <strong className="text-white">Estructuras Pesadas:</strong> La piedra y el metal aguantan un impacto directo. Busca la madera, los barriles y las bolas de piedra que sostienen el peso: es la diferencia entre una abolladura y un derrumbe.</p>
              <p>🚧 <strong className="text-white">Obstáculos:</strong> Muros fijos, compuertas que se deslizan y aspas que giran se interponen en el tiro. No se pueden romper: hay que rodearlos, pasarlos por encima o esperar el hueco.</p>
              <p>💣 <strong className="text-red-400">Comodín Bomba:</strong> Detona al primer impacto y genera una onda de choque que lanza por los aires todo lo que hay cerca.</p>
              <p>⚡ <strong className="text-lime-400">Comodín Tríptico:</strong> Dispara 3 proyectiles en abanico, cada uno por su carril, y consume un solo proyectil. Ideal contra muros anchos.</p>
              <p>🔨 <strong className="text-purple-300">Comodín Yunque:</strong> Bola ultra pesada y algo más lenta: la única que mueve el muro de metal.</p>
              <p>🔋 <strong className="text-[#c3f400]">Sobrecarga:</strong> Pasar del 100% de potencia gasta una de las {INITIAL_OVERCHARGE} cargas del nivel. Cuando se agotan, el regulador vuelve a tope de 100%.</p>
              <p>💖 <strong className="text-white">Objetivo:</strong> Tira todos los bloques resplandecientes de recuerdo fuera de su plataforma. Derribar lo que los sostiene suele ser más eficaz que golpearlos de frente.</p>
            </div>
            <CyberButton onClick={() => setIsHelpOpen(false)} variant="primary" accentColor="#00dbe9" size="sm" className="w-full">
              ¡A DEMOLER! ⚡
            </CyberButton>
          </ChamferedPanel>
        </div>
      )}

      {/* Memory Unlocked Toasts (non-blocking, physics keeps running) */}
      {memoryToasts.length > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[45] flex flex-col items-center gap-1.5 pointer-events-none max-w-sm w-full px-4">
          {memoryToasts.map((toast) => (
            <div
              key={toast.id}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-white/[0.08] backdrop-blur-2xl border border-[#ff4b89]/50 shadow-[0_0_24px_rgba(255,75,137,0.4)] text-center animate-fade-in"
            >
              <span className="font-mono text-xs animate-spin-slow text-[#ff4b89]">◆</span>
              <span className="text-[10px] font-bold tracking-wide text-white font-sans">{toast.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Victory Celebration Modal */}
      {isVictoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 pointer-events-auto backdrop-blur-md p-4">
          <ChamferedPanel accentColor="#c3f400" notchSize={18} label="VICTORIA · NIVEL COMPLETADO" className="max-w-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-8 h-8 text-[#c3f400] animate-bounce" />
            </div>
            <h2 className="text-xl font-mono font-black uppercase text-white tracking-wider mb-2">
              ¡NIVEL COMPLETADO!
            </h2>

            {lastRun && (
              <>
                <div className="flex justify-center mb-2">
                  <StarRow count={lastRun.stars} size={30} />
                </div>
                <p className="text-[10px] uppercase tracking-wide text-[#a88a7e] mb-1">
                  {lastRun.shotsUsed} {lastRun.shotsUsed === 1 ? "disparo" : "disparos"}
                </p>
                {lastRun.isRecord && (
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#c3f400] mb-1 animate-pulse">
                    ¡Nuevo récord!
                  </p>
                )}
              </>
            )}

            <p className="text-xs leading-relaxed text-[#e1bfb2] mb-6 font-sans">
              {lastRun?.stars === 3
                ? "Demolición limpia. No sobró ni un proyectil de más."
                : "Has liberado todos los recuerdos. Gasta menos proyectiles para las 3 estrellas."}
            </p>
            <div className="flex gap-2 justify-center">
              <CyberButton onClick={handleResetLevel} variant="outline" accentColor="#c3f400" size="sm">
                REPETIR
              </CyberButton>
              <CyberButton onClick={handleNextLevel} variant="primary" accentColor="#c3f400" size="sm">
                {generated ? "OTRO ALEATORIO 🎲" : "SIGUIENTE NIVEL ➔"}
              </CyberButton>
            </div>
          </ChamferedPanel>
        </div>
      )}

      {/* Out of Ammo Modal */}
      {isOutOfAmmoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 pointer-events-auto backdrop-blur-md p-4">
          <ChamferedPanel accentColor="#ef4444" notchSize={16} label="SIN PROYECTILES" className="max-w-sm text-center">
            <h2 className="text-lg font-mono font-black uppercase text-red-400 tracking-wide mb-2">
              ¡SIN PROYECTILES!
            </h2>
            <p className="text-xs leading-relaxed text-[#e1bfb2] mb-6 font-sans">
              Quedan recuerdos sobre la plataforma. Prueba a apuntar a un lado para empujarlos hacia el borde, o usa la Bomba y el Yunque para barrer la base entera.
            </p>
            <div className="flex gap-3 justify-center">
              <CyberButton onClick={handleResetLevel} variant="danger" size="sm">
                REINTENTAR 🔄
              </CyberButton>
              <Link href="/">
                <CyberButton variant="secondary" size="sm">
                  SALIR
                </CyberButton>
              </Link>
            </div>
          </ChamferedPanel>
        </div>
      )}
    </div>
  );
}
