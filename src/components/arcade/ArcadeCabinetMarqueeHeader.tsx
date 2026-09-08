import React from 'react';
import { CornerBrackets } from '@/components/deco';
import { Radio, Cpu, Trophy, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { GameMetadata } from './ArcadeGameSelector';

interface ArcadeCabinetMarqueeHeaderProps {
  accentColor: string;
  activeGame: GameMetadata;
  playerLabel: string;
  onOpenHub?: () => void;
  coins?: number;
  pendingQuests?: number;
  memoriesCount?: number;
  handlePrev: () => void;
  handleNext: () => void;
}

export function ArcadeCabinetMarqueeHeader({
  accentColor,
  activeGame,
  playerLabel,
  onOpenHub,
  coins,
  pendingQuests = 0,
  memoriesCount = 0,
  handlePrev,
  handleNext,
}: ArcadeCabinetMarqueeHeaderProps) {
  return (
    <div className="relative rounded-2xl border border-white/12 bg-[#0a070c]/85 backdrop-blur-2xl p-4 sm:p-6 md:p-7 shadow-[0_16px_40px_rgba(0,0,0,0.6)] overflow-hidden">
      {/* Esquinas tácticas HUD */}
      <CornerBrackets color={accentColor} size={14} />

      {/* Scanlines CRT muy sutiles de fondo */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-diagonal-stripes z-0" />

      {/* Resplandor ambiental de marquesina */}
      <div
        className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-32 blur-3xl opacity-20"
        style={{ background: activeGame.glowHex }}
      />

      {/* Barra superior de telemetría arcade */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 pb-3.5 mb-3.5 border-b border-white/10 text-[9.5px] sm:text-[10.5px] font-mono uppercase tracking-widest text-white/70">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Indicador LED Coin-Op */}
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/70 border border-white/15 font-bold text-white/90 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
            <span style={{ color: accentColor }}>FREE PLAY</span>
          </span>

          {/* Perfil del Jugador Activo */}
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 border border-white/10 font-bold">
            <Radio className="w-3 h-3 animate-pulse" style={{ color: accentColor }} />
            <span className="text-white/90">{playerLabel}</span>
          </span>

          {/* Contador de ROMs */}
          <span className="hidden sm:inline-flex items-center gap-1 text-white/50">
            <Cpu className="w-3 h-3 text-white/40" />
            <span>ROMS: 14/14</span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Botón Duelos & Gachapon */}
          {onOpenHub && (
            <button
              type="button"
              onClick={onOpenHub}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-fuchsia-500/20 border border-amber-400/50 text-amber-300 hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] relative"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-black text-[10px] uppercase tracking-wider">DUELOS & GACHAPON</span>
              {coins !== undefined && (
                <span className="bg-black/70 px-1.5 py-0.5 rounded font-mono font-bold text-[9px] text-amber-300 border border-amber-400/30">
                  {coins} 🪙
                </span>
              )}
              {pendingQuests > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute -top-1 -right-1" />
              )}
            </button>
          )}

          {/* Recuerdos sincronizados */}
          {memoriesCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-black/60 border border-white/15 px-2.5 py-0.5 rounded text-[9.5px] font-bold">
              <Camera className="w-3 h-3 text-pink-400" />
              <span style={{ color: accentColor }}>
                {memoriesCount} MEMORIAS 3D
              </span>
            </span>
          )}

          {/* Ciclo rápido de juego con botones arcade */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Juego anterior"
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 active:scale-90 border border-white/15 transition-all text-white/80 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Siguiente juego"
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 active:scale-90 border border-white/15 transition-all text-white/80 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Marquesina Central del Juego Activo */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            {/* Badge de ROM ID con corte chamfered */}
            <span
              className="px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded font-mono text-slate-950 shadow-sm"
              style={{ backgroundColor: activeGame.accentHex }}
            >
              {activeGame.romId}
            </span>
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-white/50">
              {activeGame.specs}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="text-lg sm:text-2xl font-mono animate-bounce"
              style={{ color: activeGame.accentHex }}
            >
              ▲
            </span>
            <h1
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-[0.1em] font-mono text-white select-none transition-all duration-300"
              style={{
                textShadow: `2px 2px 0px #000, 0 0 12px ${activeGame.accentHex}88, 0 0 28px ${activeGame.accentHex}33`,
              }}
            >
              {activeGame.title}
            </h1>
          </div>

          <p className="text-[10px] sm:text-xs text-white/65 uppercase tracking-widest max-w-2xl">
            {activeGame.subtitle}
          </p>
        </div>

        {/* Ficha técnica rápida de la cabina */}
        <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 text-[9.5px] font-mono uppercase text-white/60">
          <div className="inline-flex items-center gap-1.5 bg-black/60 border border-white/10 px-2.5 py-1 rounded">
            <span className="text-white/40">MOTOR:</span>
            <span className="font-bold text-white/90">{activeGame.engine}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-black/60 border border-white/10 px-2.5 py-1 rounded">
            <span className="text-white/40">MANDO:</span>
            <span className="font-bold text-white/90">{activeGame.controls}</span>
          </div>
        </div>
      </div>

      {/* Línea láser inferior */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-70 transition-all duration-500"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${activeGame.accentHex} 25%, ${activeGame.accentHex} 75%, transparent 100%)`,
        }}
      />
    </div>
  );
}
