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
  Dog,
} from 'lucide-react';
import { DataStrip } from '@/components/deco';
import { ArcadeCabinetMarqueeHeader } from './ArcadeCabinetMarqueeHeader';
import { CategoryFilterDeck, CategoryFilter } from './CategoryFilterDeck';
import { ArcadeCartridgeRack } from './ArcadeCartridgeRack';
import { ArcadeCartridgeGrid } from './ArcadeCartridgeGrid';

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
          ───────────────────────────────────────────────────────────── */}
      <ArcadeCabinetMarqueeHeader
        accentColor={accentColor}
        activeGame={activeGame}
        playerLabel={playerLabel}
        onOpenHub={onOpenHub}
        coins={coins}
        pendingQuests={pendingQuests}
        memoriesCount={memoriesCount}
        handlePrev={handlePrev}
        handleNext={handleNext}
      />

      {/* ─────────────────────────────────────────────────────────────
          2. DECK DE CATEGORÍAS & SELECTOR DE MODO
          ───────────────────────────────────────────────────────────── */}
      <CategoryFilterDeck
        category={category}
        setCategory={setCategory}
        accentColor={accentColor}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* ─────────────────────────────────────────────────────────────
          3. ARCADE CARTRIDGE RACK / MATRIX
          ───────────────────────────────────────────────────────────── */}
      {viewMode === 'rack' ? (
        <ArcadeCartridgeRack
          filteredGames={filteredGames}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          scrollContainerRef={scrollContainerRef}
          activeCartridgeRef={activeCartridgeRef}
        />
      ) : (
        <ArcadeCartridgeGrid
          filteredGames={filteredGames}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
        />
      )}
    </div>
  );
}
