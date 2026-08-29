'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Layers,
  Target,
  Zap,
  Rocket,
  Gamepad2,
  Crosshair,
  Sparkles,
  Grid3X3,
  CircleDot,
  Shield,
  Gauge,
  Waves,
  Boxes,
  Camera,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Tv,
  Box,
  LayoutGrid,
  SlidersHorizontal,
  Radio,
  Trophy,
  Dog,
} from 'lucide-react';
import { CornerBrackets, DataStrip } from '@/components/deco';

export type GameTab =
  | 'mahjong'
  | 'hillclimb'
  | 'smashfest'
  | 'brickstorm'
  | 'voidrunner'
  | 'cyberviper'
  | 'tetrismatrix'
  | 'ballshooter'
  | 'tankdefense'
  | 'turborace'
  | 'cyberfrogger'
  | 'supplementshooter'
  | 'pacman'
  | 'neonstriker'
  | 'dogsvsmonsters';

export interface GameMetadata {
  id: GameTab;
  romId: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  category: 'cpp' | '3d' | 'retro';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  accentHex: string;
  glowHex: string;
  badge?: string;
  engine: string;
  controls: string;
  specs: string;
}

export const GAMES_METADATA: Record<GameTab, GameMetadata> = {
  mahjong: {
    id: 'mahjong',
    romId: 'ROM-01',
    title: 'MAHJONG · MIEL-JONG',
    shortTitle: 'MAHJONG 3D',
    subtitle: 'TABLERO 3D DE ENLACES, MEMORIA Y RACHAS DE FUEGO',
    category: '3d',
    icon: Layers,
    color: 'bg-amber-400',
    accentHex: '#f59e0b',
    glowHex: 'rgba(245, 158, 11, 0.4)',
    badge: 'FOTOS 3D',
    engine: 'THREE.JS 3D',
    controls: 'TOUCH / TAP',
    specs: '3D SPATIAL · MEMORIA',
  },
  hillclimb: {
    id: 'hillclimb',
    romId: 'ROM-02',
    title: 'HILL CLIMB · BUGGY MOUNTAIN',
    shortTitle: 'HILL CLIMB',
    subtitle: 'FÍSICAS 2D DE SUSPENSIÓN, GASOLINA Y SUBIDAS EXTREMAS',
    category: '3d',
    icon: Flame,
    color: 'bg-emerald-500',
    accentHex: '#10b981',
    glowHex: 'rgba(16, 185, 129, 0.4)',
    badge: 'FÍSICA 2D',
    engine: 'MATTER.JS 2D',
    controls: 'GAS / FRENO',
    specs: 'RIGID BODY · SUSPENSIÓN',
  },
  smashfest: {
    id: 'smashfest',
    romId: 'ROM-03',
    title: 'SMASH FEST · DEMOLICIÓN 3D',
    shortTitle: 'SMASH FEST',
    subtitle: 'ARENA DE FÍSICA 3D, BALAS DE CHOQUE Y DESTRUCCIÓN DE ESTRUCTURAS',
    category: '3d',
    icon: Target,
    color: 'bg-[#ff4b89]',
    accentHex: '#ff4b89',
    glowHex: 'rgba(255, 75, 137, 0.45)',
    badge: '3D CANNON',
    engine: 'CANNON.JS 3D',
    controls: 'TOUCH / APUNTAR',
    specs: '3D IMPACT · DESTRUCCIÓN',
  },
  brickstorm: {
    id: 'brickstorm',
    romId: 'ROM-04',
    title: 'BRICK STORM · C++ BREAKOUT',
    shortTitle: 'BRICK STORM',
    subtitle: 'ARCADE CYBERPUNK: LÁSERES, MULTIBOLAS Y COMBOS',
    category: 'cpp',
    icon: Zap,
    color: 'bg-cyan-400',
    accentHex: '#06b6d4',
    glowHex: 'rgba(6, 182, 212, 0.45)',
    badge: 'C++ NATIVO',
    engine: 'C++ ENGINE',
    controls: 'PADDLE / TOUCH',
    specs: '60 FPS · BALÍSTICA',
  },
  voidrunner: {
    id: 'voidrunner',
    romId: 'ROM-05',
    title: 'VOID RUNNER · VECTOR COMBAT',
    shortTitle: 'VOID RUNNER',
    subtitle: 'COMBATE ESPACIAL CON INERCIA REAL Y ASTEROIDES MULTI-TIER',
    category: 'cpp',
    icon: Rocket,
    color: 'bg-purple-500',
    accentHex: '#a855f7',
    glowHex: 'rgba(168, 85, 247, 0.45)',
    badge: 'C++ NATIVO',
    engine: 'C++ VECTOR',
    controls: 'INERCIA / DISPARO',
    specs: 'VECTOR WARP · INERCIA',
  },
  cyberviper: {
    id: 'cyberviper',
    romId: 'ROM-06',
    title: 'CYBER VIPER · 2088 NATIVE',
    shortTitle: 'CYBER VIPER',
    subtitle: 'SERPIENTE VECTORIAL CON POWER-UPS, OVERDRIVE Y MATRICES 60 FPS',
    category: 'cpp',
    icon: Sparkles,
    color: 'bg-emerald-400',
    accentHex: '#34d399',
    glowHex: 'rgba(52, 211, 153, 0.45)',
    badge: 'C++ NATIVO',
    engine: 'C++ 2088',
    controls: 'DPAD / SWIPE',
    specs: 'MATRICIAL · OVERDRIVE',
  },
  tetrismatrix: {
    id: 'tetrismatrix',
    romId: 'ROM-07',
    title: 'TETRIS MATRIX · GUIDELINE ARCADE',
    shortTitle: 'TETRIS MATRIX',
    subtitle: 'REGLAS OFICIALES 7-BAG, SRS WALL KICKS, GHOST PIECE Y HOLD',
    category: 'cpp',
    icon: Grid3X3,
    color: 'bg-cyan-400',
    accentHex: '#22d3ee',
    glowHex: 'rgba(34, 211, 238, 0.45)',
    badge: 'C++ NATIVO',
    engine: 'C++ SRS ENGINE',
    controls: 'ROTAR / HOLD / DROP',
    specs: '7-BAG · SRS WALL KICKS',
  },
  ballshooter: {
    id: 'ballshooter',
    romId: 'ROM-08',
    title: 'BALL SHOOTERS · BRICK SMASH',
    shortTitle: 'BALL SHOOTERS',
    subtitle: 'APUNTA Y DISPARA RÁFAGAS DE BOLAS PARA DESTRUIR BLOQUES NUMERADOS',
    category: 'cpp',
    icon: CircleDot,
    color: 'bg-rose-500',
    accentHex: '#f43f5e',
    glowHex: 'rgba(244, 63, 94, 0.45)',
    badge: 'C++ NATIVO',
    engine: 'C++ BALÍSTICA',
    controls: 'ARRASTRAR / APUNTAR',
    specs: 'MULTI-BALAS · FÍSICA',
  },
  tankdefense: {
    id: 'tankdefense',
    romId: 'ROM-09',
    title: 'TANKS · BASE DEFENSE 1990',
    shortTitle: 'TANKS 1990',
    subtitle: 'COMBATE BLINDADO TOP-DOWN: PROTEGE EL HQ Y DESTRUYE OLAS ENEMIGAS',
    category: 'retro',
    icon: Shield,
    color: 'bg-lime-500',
    accentHex: '#84cc16',
    glowHex: 'rgba(132, 204, 22, 0.45)',
    badge: 'C++ NATIVO',
    engine: 'C++ TOP-DOWN',
    controls: 'DPAD / FUEGO',
    specs: 'AI ENEMIGA · DEFENSA HQ',
  },
  turborace: {
    id: 'turborace',
    romId: 'ROM-10',
    title: 'TURBO HIGHWAY · RETRO RACER',
    shortTitle: 'TURBO HIGHWAY',
    subtitle: 'ESQUIVA EL TRÁFICO A TODA VELOCIDAD CON ACELERACIÓN LINEAL',
    category: 'cpp',
    icon: Gauge,
    color: 'bg-amber-400',
    accentHex: '#f59e0b',
    glowHex: 'rgba(245, 158, 11, 0.45)',
    badge: 'C++ NATIVO',
    engine: 'C++ SUPER-SCALER',
    controls: 'VOLANTE / NITRO',
    specs: 'PSEUDO-3D · ACELERACIÓN',
  },
  cyberfrogger: {
    id: 'cyberfrogger',
    romId: 'ROM-11',
    title: 'CYBER FROGGER · RIVER RUN',
    shortTitle: 'CYBER FROGGER',
    subtitle: 'CALCULA TUS SALTOS SOBRE LA AUTOPISTA Y EL RÍO HASTA LAS BAHÍAS',
    category: 'retro',
    icon: Waves,
    color: 'bg-emerald-400',
    accentHex: '#10b981',
    glowHex: 'rgba(16, 185, 129, 0.45)',
    badge: 'C++ NATIVO',
    engine: 'C++ TRAFFIC/RIVER',
    controls: 'TOUCH / SALTOS',
    specs: 'TEMPO EXACTO · BAHÍAS',
  },
  supplementshooter: {
    id: 'supplementshooter',
    romId: 'ROM-12',
    title: 'SUPPLEMENT SHOOTER · QUARTH MATRIX',
    shortTitle: 'SUPPLEMENT',
    subtitle: 'RELLENA LOS HUECOS EN LAS FORMAS DESCENDENTES PARA COMPLETAR RECTÁNGULOS SÓLIDOS',
    category: 'cpp',
    icon: Boxes,
    color: 'bg-cyan-400',
    accentHex: '#06b6d4',
    glowHex: 'rgba(6, 182, 212, 0.45)',
    badge: 'C++ NATIVO',
    engine: 'C++ QUARTH MATRIX',
    controls: 'NAVE / DISPARO BLOQUE',
    specs: 'GEOMETRÍA · RECTÁNGULOS',
  },
  pacman: {
    id: 'pacman',
    romId: 'ROM-13',
    title: 'PAC-MAN · RETRO ARCADE',
    shortTitle: 'PAC-MAN ARCADE',
    subtitle: 'LABERINTO CLÁSICO CON IA DE FANTASMAS Y FILTRO CRT',
    category: 'retro',
    icon: Gamepad2,
    color: 'bg-yellow-400',
    accentHex: '#eab308',
    glowHex: 'rgba(234, 179, 8, 0.45)',
    badge: 'ARCADE CRT',
    engine: 'NAMCO ARCADE',
    controls: '4-WAY DPAD / SWIPE',
    specs: 'GHOST AI · FILTRO CRT',
  },
  neonstriker: {
    id: 'neonstriker',
    romId: 'ROM-14',
    title: 'NEON STRIKER · BULLET HELL',
    shortTitle: 'NEON STRIKER',
    subtitle: 'GALAXY SHMUP CON HYPER BOMBAS, DRONES Y JEFES MULTI-FASE',
    category: 'retro',
    icon: Crosshair,
    color: 'bg-pink-500',
    accentHex: '#ec4899',
    glowHex: 'rgba(236, 72, 153, 0.45)',
    badge: 'BULLET HELL',
    engine: 'DANMAKU SHMUP',
    controls: 'TOUCH / DRAG / BOMB',
    specs: 'PATRONES BALÍSTICOS',
  },
  dogsvsmonsters: {
    id: 'dogsvsmonsters',
    romId: 'ROM-15',
    title: 'DOGS VS MONSTERS · PATIO DEFENSE',
    shortTitle: 'DOGS VS MONSTERS',
    subtitle: 'EDICIÓN PVZ CON MIEL, KIARO, NIKA Y SAM DEFENDIENDO EL PATIO',
    category: '3d',
    icon: Dog,
    color: 'bg-amber-500',
    accentHex: '#f59e0b',
    glowHex: 'rgba(245, 158, 11, 0.45)',
    badge: 'PVZ EDITION',
    engine: 'CANVAS 2D LANE DEFENSE',
    controls: 'TOUCH / TAP / CARTAS',
    specs: 'CROQUETAS · PLANT FOOD',
  },
};

type CategoryFilter = 'all' | 'cpp' | '3d' | 'retro';

interface ArcadeGameSelectorProps {
  activeTab: GameTab;
  onSelectTab: (tab: GameTab) => void;
  profile: 'el' | 'ella' | null;
  memoriesCount?: number;
  onOpenHub?: () => void;
  coins?: number;
  pendingQuests?: number;
  couponsCount?: number;
}

export function ArcadeGameSelector({
  activeTab,
  onSelectTab,
  profile,
  memoriesCount = 0,
  onOpenHub,
  coins,
  pendingQuests = 0,
  couponsCount = 0,
}: ArcadeGameSelectorProps) {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [viewMode, setViewMode] = useState<'rack' | 'grid'>('rack');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeCartridgeRef = useRef<HTMLButtonElement>(null);

  const accentColor = profile === 'ella' ? '#ff4b89' : '#c3f400';
  const playerLabel = profile === 'ella' ? 'P1: ELLA' : profile === 'el' ? 'P1: SANTI' : 'P1: INVITADO';

  const gameKeys = useMemo(() => Object.keys(GAMES_METADATA) as GameTab[], []);
  const activeGame = GAMES_METADATA[activeTab];

  const filteredGames = useMemo(() => {
    if (category === 'all') return gameKeys;
    return gameKeys.filter((key) => GAMES_METADATA[key].category === category);
  }, [category, gameKeys]);

  // Navegación prev / next
  const currentIndex = gameKeys.indexOf(activeTab);
  const handlePrev = () => {
    const nextIdx = (currentIndex - 1 + gameKeys.length) % gameKeys.length;
    onSelectTab(gameKeys[nextIdx]);
  };
  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % gameKeys.length;
    onSelectTab(gameKeys[nextIdx]);
  };

  // Scroll suave al cartucho activo en vista rack
  useEffect(() => {
    if (viewMode === 'rack' && activeCartridgeRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const element = activeCartridgeRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      // Centrar el elemento en el scroll horizontal
      const scrollOffset = element.offsetLeft - (containerRect.width / 2) + (elementRect.width / 2);
      container.scrollTo({ left: scrollOffset, behavior: 'smooth' });
    }
  }, [activeTab, viewMode]);

  return (
    <div className="w-full space-y-4">
      {/* ─────────────────────────────────────────────────────────────
          1. ARCADE CABINET MARQUEE HEADER
          ───────────────────────────────────────────────────────────── */}
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

      {/* ─────────────────────────────────────────────────────────────
          2. DECK DE CATEGORÍAS & SELECTOR DE MODO
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 px-1">
        {/* Chips de Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none" role="tablist" aria-label="Filtrar por categoría">
          {[
            { id: 'all' as CategoryFilter, label: 'TODOS (14)', icon: SlidersHorizontal },
            { id: 'cpp' as CategoryFilter, label: 'C++ NATIVO (8)', icon: Cpu },
            { id: '3d' as CategoryFilter, label: '3D & FÍSICA (3)', icon: Box },
            { id: 'retro' as CategoryFilter, label: 'RETRO CLÁSICO (3)', icon: Tv },
          ].map((cat) => {
            const isSelected = category === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${
                  isSelected
                    ? 'bg-white/15 text-white border border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                    : 'bg-black/40 text-white/55 border border-white/10 hover:text-white/85 hover:bg-white/5'
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: `${accentColor}80`,
                        color: '#ffffff',
                      }
                    : undefined
                }
              >
                <Icon className="w-3 h-3" style={isSelected ? { color: accentColor } : undefined} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toggle de Visualización: Rack de Cartuchos vs Cuadrícula */}
        <div className="flex items-center justify-end gap-1 text-[10px] font-mono uppercase text-white/50 self-end sm:self-auto">
          <span className="hidden md:inline mr-1 text-[9px] tracking-widest text-white/40">VISTA:</span>
          <button
            type="button"
            onClick={() => setViewMode('rack')}
            aria-label="Vista de Cartuchos Horizontal"
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[9.5px] transition-all ${
              viewMode === 'rack'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-black/30 text-white/40 border-white/10 hover:text-white/70'
            }`}
          >
            <span>RACK</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="Vista en Cuadrícula"
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[9.5px] transition-all ${
              viewMode === 'grid'
                ? 'bg-white/15 text-white border-white/30'
                : 'bg-black/30 text-white/40 border-white/10 hover:text-white/70'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            <span>GRILLA</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ARCADE CARTRIDGE RACK / MATRIX
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'rack' ? (
        /* RACK HORIZONTAL CON CARTUCHOS TÁCTILES */
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
      ) : (
        /* GRILLA / MATRIX VIEW (MODO COMPACTO) */
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
      )}
    </div>
  );
}
