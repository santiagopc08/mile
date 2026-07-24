"use client";

import dynamic from "next/dynamic";
import { Suspense, useState } from "react";
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Sparkles, Trophy, HelpCircle } from "lucide-react";
import Link from "next/link";
import { ChamferedPanel } from "@/components/ui/ChamferedPanel";
import { CyberButton } from "@/components/ui/CyberButton";
import { DEFAULT_LEVELS } from "./components/SmashFestGame";

const SmashFestGame = dynamic(() => import("./components/SmashFestGame"), {
  ssr: false,
  loading: () => (
    <div className="flex w-full h-full items-center justify-center text-white font-mono uppercase text-xs">
      <span className="animate-spin-slow text-[#ff4b89] mr-2">◆</span> CARGANDO MOTOR DE FÍSICA...
    </div>
  ),
});

export default function SmashFestPage() {
  const [levelId, setLevelId] = useState<string>("level_1");
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const [isOutOfAmmoModalOpen, setIsOutOfAmmoModalOpen] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [stats, setStats] = useState({ remainingBalls: 8, memoryBlocksLeft: 1, totalMemoryBlocks: 1 });
  const [resetKey, setResetKey] = useState(0);

  const handleResetLevel = () => {
    setResetKey((prev) => prev + 1);
    setIsVictoryModalOpen(false);
    setIsOutOfAmmoModalOpen(false);
    setIsMemoryModalOpen(false);
  };

  const handleNextLevel = () => {
    if (levelId === "level_1") setLevelId("level_2");
    else if (levelId === "level_2") setLevelId("level_3");
    else setLevelId("level_1");

    setResetKey((prev) => prev + 1);
    setIsVictoryModalOpen(false);
    setIsOutOfAmmoModalOpen(false);
    setIsMemoryModalOpen(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0c0a12] touch-none font-mono">
      {/* Floating Top Glass HUD */}
      <header className="fixed top-3 left-3 right-3 z-40 flex items-center justify-between gap-2 p-2.5 sm:px-4 bg-white/[0.04] backdrop-blur-2xl border border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.6)] rounded-none pointer-events-auto">
        <div className="flex items-center gap-2">
          <Link href="/">
            <CyberButton variant="secondary" size="xs">
              <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">VOLVER</span>
            </CyberButton>
          </Link>

          {/* Level Selector Pills */}
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 p-1">
            {Object.keys(DEFAULT_LEVELS).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setLevelId(lvl);
                  handleResetLevel();
                }}
                className={`px-2 py-1 text-[9px] font-bold uppercase transition-all ${
                  levelId === lvl
                    ? "bg-[#ff4b89] text-black font-black"
                    : "text-[#a88a7e] hover:text-white hover:bg-white/10"
                }`}
              >
                {lvl.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Live Level Stats */}
        <div className="flex items-center gap-3 text-[10px]">
          <div className="hidden md:flex items-center gap-1.5 border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[#a88a7e]">
            <span>BOLAS:</span>
            <span className="font-bold text-white">{stats.remainingBalls}</span>
          </div>

          <div className="flex items-center gap-1.5 border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[#a88a7e]">
            <span className="text-[#ff4b89] animate-pulse">◆</span>
            <span>RECUERDOS:</span>
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

      {/* 3D Physics Game Canvas */}
      <Suspense
        fallback={
          <div className="flex w-full h-full items-center justify-center text-white font-mono uppercase text-xs">
            <span className="animate-spin-slow text-[#ff4b89] mr-2">◆</span> CARGANDO FÍSICA...
          </div>
        }
      >
        <SmashFestGame
          key={`${levelId}-${resetKey}`}
          levelId={levelId}
          isSoundMuted={isSoundMuted}
          onMemoryBlockTriggered={() => setIsMemoryModalOpen(true)}
          onLevelCompleted={() => setIsVictoryModalOpen(true)}
          onOutOfAmmo={() => {
            if (stats.memoryBlocksLeft > 0) setIsOutOfAmmoModalOpen(true);
          }}
          onStatsUpdate={setStats}
        />
      </Suspense>

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 pointer-events-auto backdrop-blur-md p-4">
          <ChamferedPanel accentColor="#00dbe9" notchSize={16} label="COMO JUGAR" className="max-w-sm text-center">
            <h2 className="text-base font-bold uppercase text-white tracking-wide mb-3 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00dbe9]" /> INSTRUCCIONES DEL JUEGO
            </h2>
            <div className="space-y-2 text-[10.5px] leading-relaxed text-[#e1bfb2] mb-6 text-left border-t border-b border-white/10 py-3">
              <p>🎯 <strong className="text-white">Apuntar y Lanzar:</strong> Haz clic o toca rápido en cualquier punto de la pantalla para lanzar una bola de demolición.</p>
              <p>🔄 <strong className="text-white">Rotar Cámara:</strong> Arrastra la pantalla suavemente para cambiar la perspectiva 3D alrededor de la torre.</p>
              <p>💖 <strong className="text-white">Bloques de Recuerdo:</strong> Derriba los bloques brillantes neón hacia el suelo para desbloquear recuerdos especiales.</p>
            </div>
            <CyberButton onClick={() => setIsHelpOpen(false)} variant="primary" accentColor="#00dbe9" size="sm" className="w-full">
              ¡ENTENDIDO! ⚡
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
              Has derribado un bloque especial de memoria. ¡Tómate un momento para celebrar este logro juntos!
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
              ¡NIVEL DESTRUIDO!
            </h2>
            <p className="text-xs leading-relaxed text-[#e1bfb2] mb-6 font-sans">
              ¡Excelente tiro! Todos los bloques de memoria del nivel han sido desbloqueados con éxito.
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
              ¡TE QUEDASTE SIN BOLAS!
            </h2>
            <p className="text-xs leading-relaxed text-[#e1bfb2] mb-6 font-sans">
              Algunos bloques de memoria aún están en pie. ¡Reinicia el nivel e inténtalo de nuevo con un tiro estratégico!
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
