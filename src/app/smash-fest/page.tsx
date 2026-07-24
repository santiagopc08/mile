"use client";

import dynamic from "next/dynamic";
import { Suspense, useState, useCallback } from "react";
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Sparkles, Trophy, HelpCircle, Zap, Bomb, Hammer, CircleDot } from "lucide-react";
import Link from "next/link";
import { ChamferedPanel } from "@/components/ui/ChamferedPanel";
import { CyberButton } from "@/components/ui/CyberButton";
import { DEFAULT_LEVELS, type WildcardType } from "./components/SmashFestGame";

const SmashFestGame = dynamic(() => import("./components/SmashFestGame"), {
  ssr: false,
  loading: () => (
    <div className="flex w-full h-full items-center justify-center text-white font-mono uppercase text-xs">
      <span className="animate-spin-slow text-[#ff4b89] mr-2">◆</span> CARGANDO MOTOR DE FÍSICA Y NIVELES...
    </div>
  ),
});

export default function SmashFestPage() {
  const [levelId, setLevelId] = useState<string>("level_1");
  const [activeWildcard, setActiveWildcard] = useState<WildcardType>("standard");
  const [shotPower, setShotPower] = useState<number>(1.0);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const [isOutOfAmmoModalOpen, setIsOutOfAmmoModalOpen] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [stats, setStats] = useState({ remainingBalls: 8, memoryBlocksLeft: 1, totalMemoryBlocks: 1 });
  const [resetKey, setResetKey] = useState(0);

  const handleResetLevel = useCallback(() => {
    setResetKey((prev) => prev + 1);
    setIsVictoryModalOpen(false);
    setIsOutOfAmmoModalOpen(false);
    setIsMemoryModalOpen(false);
  }, []);

  const handleNextLevel = useCallback(() => {
    const levelKeys = Object.keys(DEFAULT_LEVELS);
    setLevelId((currentLvl) => {
      const currentIndex = levelKeys.indexOf(currentLvl);
      const nextIndex = (currentIndex + 1) % levelKeys.length;
      return levelKeys[nextIndex];
    });

    setResetKey((prev) => prev + 1);
    setIsVictoryModalOpen(false);
    setIsOutOfAmmoModalOpen(false);
    setIsMemoryModalOpen(false);
  }, []);

  const handleMemoryBlockTriggered = useCallback(() => {
    setIsMemoryModalOpen(true);
  }, []);

  const handleLevelCompleted = useCallback(() => {
    setIsVictoryModalOpen(true);
  }, []);

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
                  handleResetLevel();
                }}
                className={`px-2 py-1 text-[9px] font-bold uppercase transition-all whitespace-nowrap ${
                  levelId === lvl
                    ? "bg-[#ff4b89] text-black font-black"
                    : "text-[#a88a7e] hover:text-white hover:bg-white/10"
                }`}
              >
                NIVEL {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Live Level Stats & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 text-[10px]">
          <div className="hidden md:flex items-center gap-1.5 border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[#a88a7e]">
            <span>PROYECTILES:</span>
            <span className="font-bold text-white">{stats.remainingBalls}</span>
          </div>

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
            onClick={() => setActiveWildcard("bomb")}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold uppercase transition-all ${
              activeWildcard === "bomb"
                ? "bg-[#ff003c] text-white shadow-[0_0_12px_rgba(255,0,60,0.7)]"
                : "border border-white/10 text-[#a88a7e] hover:text-white hover:bg-white/10"
            }`}
          >
            <Bomb className="w-3 h-3 text-red-400" /> BOMBA
          </button>

          <button
            onClick={() => setActiveWildcard("triple")}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold uppercase transition-all ${
              activeWildcard === "triple"
                ? "bg-[#c3f400] text-black shadow-[0_0_12px_rgba(195,244,0,0.6)]"
                : "border border-white/10 text-[#a88a7e] hover:text-white hover:bg-white/10"
            }`}
          >
            <Zap className="w-3 h-3 text-lime-400" /> TRÍPTICO
          </button>

          <button
            onClick={() => setActiveWildcard("heavy")}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold uppercase transition-all ${
              activeWildcard === "heavy"
                ? "bg-[#a178ff] text-black shadow-[0_0_12px_rgba(161,120,255,0.6)]"
                : "border border-white/10 text-[#a88a7e] hover:text-white hover:bg-white/10"
            }`}
          >
            <Hammer className="w-3 h-3 text-purple-300" /> YUNQUE
          </button>
        </div>

        {/* Shot Power Regulator */}
        <div className="flex items-center gap-2 pl-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-1.5 sm:pt-0">
          <span className="text-[9px] font-bold text-[#a88a7e] uppercase">POTENCIA:</span>
          <input
            type="range"
            min="0.6"
            max="1.4"
            step="0.1"
            value={shotPower}
            onChange={(e) => setShotPower(parseFloat(e.target.value))}
            className="w-20 sm:w-24 accent-[#ff4b89] cursor-pointer"
          />
          <span className="text-[10px] font-bold text-white w-8">{Math.round(shotPower * 100)}%</span>
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
        <SmashFestGame
          key={`${levelId}-${resetKey}`}
          levelId={levelId}
          activeWildcard={activeWildcard}
          shotPower={shotPower}
          isSoundMuted={isSoundMuted}
          onMemoryBlockTriggered={handleMemoryBlockTriggered}
          onLevelCompleted={handleLevelCompleted}
          onOutOfAmmo={handleOutOfAmmo}
          onStatsUpdate={handleStatsUpdate}
        />
      </Suspense>

      {/* Help & Powerups Guide Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 pointer-events-auto backdrop-blur-md p-4">
          <ChamferedPanel accentColor="#00dbe9" notchSize={16} label="GUÍA DE COMODINES Y FÍSICA" className="max-w-md text-center">
            <h2 className="text-base font-bold uppercase text-white tracking-wide mb-3 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00dbe9]" /> MANUAL DE DEMOLICIÓN
            </h2>
            <div className="space-y-2.5 text-[10.5px] leading-relaxed text-[#e1bfb2] mb-6 text-left border-t border-b border-white/10 py-3">
              <p>🎯 <strong className="text-white">Puntería Láser:</strong> Mira la línea láser punteada que sigue tu cursor para calcular la trayectoria exacta.</p>
              <p>💣 <strong className="text-red-400">Comodín Bomba:</strong> Genera una onda de choque expansiva que hace volar los bloques adyacentes.</p>
              <p>⚡ <strong className="text-lime-400">Comodín Tríptico:</strong> Dispara 3 proyectiles simultáneos en abanico para cobertura masiva.</p>
              <p>🔨 <strong className="text-purple-300">Comodín Yunque:</strong> Bola ultra pesada que destruye estructuras acorazadas de piedra y metal.</p>
              <p>💖 <strong className="text-white">Objetivo:</strong> Derriba todos los bloques resplandecientes de recuerdo hasta que caigan al suelo.</p>
            </div>
            <CyberButton onClick={() => setIsHelpOpen(false)} variant="primary" accentColor="#00dbe9" size="sm" className="w-full">
              ¡A DEMOLER! ⚡
            </CyberButton>
          </ChamferedPanel>
        </div>
      )}

      {/* Memory Trigger Notification Modal */}
      {isMemoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 pointer-events-auto backdrop-blur-md p-4">
          <ChamferedPanel accentColor="#ff4b89" notchSize={16} label="RECUERDO DESBLOQUEADO" className="max-w-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="font-mono text-xs animate-spin-slow text-[#ff4b89]">◆</span>
              <h2 className="text-lg font-mono font-black uppercase text-white tracking-wide">
                ¡NUEVO RECUERDO!
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-[#e1bfb2] mb-6 font-sans">
              Has derribado un bloque especial de memoria. ¡Un momento especial desbloqueado!
            </p>
            <div className="flex gap-3 justify-center">
              <CyberButton
                onClick={() => setIsMemoryModalOpen(false)}
                variant="primary"
                accentColor="#ff4b89"
                size="sm"
              >
                CONTINUAR
              </CyberButton>
              <Link href="/">
                <CyberButton variant="secondary" size="sm">
                  INICIO
                </CyberButton>
              </Link>
            </div>
          </ChamferedPanel>
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
            <p className="text-xs leading-relaxed text-[#e1bfb2] mb-6 font-sans">
              ¡Puntería perfecta! Has liberado todos los recuerdos de este nivel.
            </p>
            <div className="flex gap-2 justify-center">
              <CyberButton onClick={handleResetLevel} variant="outline" accentColor="#c3f400" size="sm">
                REPETIR
              </CyberButton>
              <CyberButton onClick={handleNextLevel} variant="primary" accentColor="#c3f400" size="sm">
                SIGUIENTE NIVEL ➔
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
              Quedan bloques de recuerdo en pie. Prueba usar comodines como la Bomba o el Yunque para derribar las defensas.
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
