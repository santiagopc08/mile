'use client';

import { useState } from "react";
import { PrivateRoute } from "@/components/PrivateRoute";
import { useProfile } from "@/context/ProfileContext";
import dynamic from "next/dynamic";
import { BrutalistSkeleton } from "@/components/ui/BrutalistSkeleton";
import { AmbientField } from "@/components/AmbientField";
import { Flame, Layers, Target, Zap, Rocket, Gamepad2, Crosshair, Sparkles, Grid3X3, CircleDot, Shield, Gauge, Waves, Boxes } from "lucide-react";

const Mahjong = dynamic(
  () => import("@/components/Mahjong").then((m) => m.Mahjong),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Tablero Mahjong 3D" className="h-[550px] w-full rounded-3xl" />
    ),
    ssr: false,
  }
);

const HillClimbCanvas = dynamic(
  () => import("@/components/hill-climb/HillClimbCanvas").then((m) => m.HillClimbCanvas),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Motor Físico Hill Climb (Matter.js)" className="h-[550px] w-full rounded-3xl" />
    ),
    ssr: false,
  }
);

const SmashFestCanvas = dynamic(
  () => import("@/components/arcade/SmashFestCanvas").then((m) => m.SmashFestCanvas),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Motor 3D Smash Fest (Cannon.js)" className="h-[550px] w-full rounded-3xl" />
    ),
    ssr: false,
  }
);

const BrickStormCanvas = dynamic(
  () => import("@/components/arcade/BrickStormCanvas").then((m) => m.BrickStormCanvas),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Motor C++ Brick Storm" className="h-[550px] w-full rounded-3xl" />
    ),
    ssr: false,
  }
);

const VoidRunnerCanvas = dynamic(
  () => import("@/components/arcade/VoidRunnerCanvas").then((m) => m.VoidRunnerCanvas),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Motor C++ Void Runner" className="h-[550px] w-full rounded-3xl" />
    ),
    ssr: false,
  }
);

const CyberViperCanvas = dynamic(
  () => import("@/components/arcade/CyberViperCanvas").then((m) => m.CyberViperCanvas),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Motor C++ Cyber Viper 2088" className="h-[550px] w-full rounded-3xl" />
    ),
    ssr: false,
  }
);

const TetrisMatrixCanvas = dynamic(
  () => import("@/components/arcade/TetrisMatrixCanvas").then((m) => m.TetrisMatrixCanvas),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Motor C++ Tetris Matrix Guideline" className="h-[550px] w-full rounded-3xl" />
    ),
    ssr: false,
  }
);

const BallShooterCanvas = dynamic(
  () => import("@/components/arcade/BallShooterCanvas").then((m) => m.BallShooterCanvas),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Motor C++ Ball Shooters" className="h-[550px] w-full rounded-3xl" />
    ),
    ssr: false,
  }
);

const TankDefenseCanvas = dynamic(
  () => import("@/components/arcade/TankDefenseCanvas").then((m) => m.TankDefenseCanvas),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Motor C++ Tanks Base Defense" className="h-[550px] w-full rounded-3xl" />
    ),
    ssr: false,
  }
);

const TurboRaceCanvas = dynamic(
  () => import("@/components/arcade/TurboRaceCanvas").then((m) => m.TurboRaceCanvas),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Motor C++ Turbo Highway Race" className="h-[550px] w-full rounded-3xl" />
    ),
    ssr: false,
  }
);

const CyberFroggerCanvas = dynamic(
  () => import("@/components/arcade/CyberFroggerCanvas").then((m) => m.CyberFroggerCanvas),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Motor C++ Cyber Frogger River Crossing" className="h-[550px] w-full rounded-3xl" />
    ),
    ssr: false,
  }
);

const SupplementShooterCanvas = dynamic(
  () => import("@/components/arcade/SupplementShooterCanvas").then((m) => m.SupplementShooterCanvas),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Motor C++ Supplement Shooting Matrix" className="h-[550px] w-full rounded-3xl" />
    ),
    ssr: false,
  }
);

const PacmanCanvas = dynamic(
  () => import("@/components/arcade/PacmanCanvas").then((m) => m.PacmanCanvas),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Motor Arcade Pac-Man" className="h-[550px] w-full rounded-3xl" />
    ),
    ssr: false,
  }
);

const NeonStrikerCanvas = dynamic(
  () => import("@/components/arcade/NeonStrikerCanvas").then((m) => m.NeonStrikerCanvas),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Motor Galaxy Shmup Neon Striker" className="h-[550px] w-full rounded-3xl" />
    ),
    ssr: false,
  }
);

type GameTab = 'mahjong' | 'hillclimb' | 'smashfest' | 'brickstorm' | 'voidrunner' | 'cyberviper' | 'tetrismatrix' | 'ballshooter' | 'tankdefense' | 'turborace' | 'cyberfrogger' | 'supplementshooter' | 'pacman' | 'neonstriker';

export default function JuegoPage() {
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<GameTab>('mahjong');

  const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
  const accentClass = profile === 'ella' ? 'user-a' : 'user-b';

  const gamesConfig: Record<GameTab, { title: string; subtitle: string; icon: any; color: string; badge?: string }> = {
    mahjong: {
      title: 'MAHJONG · MIEL-JONG',
      subtitle: 'TABLERO 3D DE ENLACES, MEMORIA Y RACHAS DE FUEGO',
      icon: Layers,
      color: 'bg-amber-400',
    },
    hillclimb: {
      title: 'HILL CLIMB · BUGGY MOUNTAIN',
      subtitle: 'FÍSICAS 2D DE SUSPENSIÓN, GASOLINA Y SUBIDAS EXTREMAS',
      icon: Flame,
      color: 'bg-emerald-500',
    },
    smashfest: {
      title: 'SMASH FEST · DEMOLICIÓN 3D',
      subtitle: 'ARENA DE FÍSICA 3D, BALAS DE CHOQUE Y DESTRUCCIÓN DE ESTRUCTURAS',
      icon: Target,
      color: 'bg-[#ff4b89]',
    },
    brickstorm: {
      title: 'BRICK STORM · C++ BREAKOUT',
      subtitle: 'ARCADE CYBERPUNK: LÁSERES, MULTIBOLAS Y COMBOS',
      icon: Zap,
      color: 'bg-cyan-400',
      badge: 'C++ NATIVO',
    },
    voidrunner: {
      title: 'VOID RUNNER · VECTOR COMBAT',
      subtitle: 'COMBATE ESPACIAL CON INERCIA REAL Y ASTEROIDES MULTI-TIER',
      icon: Rocket,
      color: 'bg-purple-500',
      badge: 'C++ NATIVO',
    },
    cyberviper: {
      title: 'CYBER VIPER · 2088 NATIVE',
      subtitle: 'SERPIENTE VECTORIAL CON POWER-UPS, OVERDRIVE Y MATRICES 60 FPS',
      icon: Sparkles,
      color: 'bg-emerald-400',
      badge: 'C++ NATIVO',
    },
    tetrismatrix: {
      title: 'TETRIS MATRIX · GUIDELINE ARCADE',
      subtitle: 'REGLAS OFICIALES 7-BAG, SRS WALL KICKS, GHOST PIECE Y HOLD',
      icon: Grid3X3,
      color: 'bg-cyan-400',
      badge: 'C++ NATIVO',
    },
    ballshooter: {
      title: 'BALL SHOOTERS · BRICK SMASH',
      subtitle: 'APUNTA Y DISPARA RÁFAGAS DE BOLAS PARA DESTRUIR BLOQUES NUMERADOS',
      icon: CircleDot,
      color: 'bg-rose-500',
      badge: 'C++ NATIVO',
    },
    tankdefense: {
      title: 'TANKS · BASE DEFENSE 1990',
      subtitle: 'COMBATE BLINDADO TOP-DOWN: PROTEGE EL HQ Y DESTRUYE OLAS ENEMIGAS',
      icon: Shield,
      color: 'bg-lime-500',
      badge: 'C++ NATIVO',
    },
    turborace: {
      title: 'TURBO HIGHWAY · RETRO RACER',
      subtitle: 'ESQUIVA EL TRÁFICO A TODA VELOCIDAD CON ACELERACIÓN LINEAL',
      icon: Gauge,
      color: 'bg-amber-400',
      badge: 'C++ NATIVO',
    },
    cyberfrogger: {
      title: 'CYBER FROGGER · RIVER RUN',
      subtitle: 'CALCULA TUS SALTOS SOBRE LA AUTOPISTA Y EL RÍO HASTA LAS BAHÍAS',
      icon: Waves,
      color: 'bg-emerald-400',
      badge: 'C++ NATIVO',
    },
    supplementshooter: {
      title: 'SUPPLEMENT SHOOTER · QUARTH MATRIX',
      subtitle: 'RELLENA LOS HUECOS EN LAS FORMAS DESCENDENTES PARA COMPLETAR RECTÁNGULOS SÓLIDOS',
      icon: Boxes,
      color: 'bg-cyan-400',
      badge: 'C++ NATIVO',
    },
    pacman: {
      title: 'PAC-MAN · RETRO ARCADE',
      subtitle: 'LABERINTO CLÁSICO CON IA DE FANTASMAS Y FILTRO CRT',
      icon: Gamepad2,
      color: 'bg-yellow-400',
      badge: 'ARCADE',
    },
    neonstriker: {
      title: 'NEON STRIKER · BULLET HELL',
      subtitle: 'GALAXY SHMUP CON HYPER BOMBAS, DRONES Y JEFES MULTI-FASE',
      icon: Crosshair,
      color: 'bg-pink-500',
      badge: 'NUEVO',
    },
  };

  const activeConfig = gamesConfig[activeTab];

  const getTabLabel = (key: GameTab) => {
    switch (key) {
      case 'mahjong': return 'MAHJONG';
      case 'hillclimb': return 'HILL CLIMB';
      case 'smashfest': return 'SMASH FEST';
      case 'brickstorm': return 'BRICK STORM';
      case 'voidrunner': return 'VOID RUNNER';
      case 'cyberviper': return 'CYBER VIPER';
      case 'tetrismatrix': return 'TETRIS';
      case 'ballshooter': return 'BALL SHOOTER';
      case 'tankdefense': return 'TANKS';
      case 'turborace': return 'TURBO RACE';
      case 'cyberfrogger': return 'FROGGER';
      case 'supplementshooter': return 'SUPPLEMENT';
      case 'pacman': return 'PAC-MAN';
      case 'neonstriker': return 'NEON STRIKER';
    }
  };

  return (
    <PrivateRoute>
      <AmbientField preset="juego" profile={profile} />
      <main className="relative z-10 min-h-screen w-full overflow-hidden px-3 sm:px-6 pb-24 pt-4 text-[#e5e2e1] md:px-8 md:pt-6 font-mono">
        <div className="mx-auto w-full max-w-7xl space-y-5">
          {/* Header Bar */}
          <div className="border border-white/12 bg-white/[0.04] backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden">
            <div className="relative p-4 sm:p-6 md:p-8">
              <div className={`absolute left-0 top-0 h-full w-[5px] bg-${accentClass}`} style={{ backgroundColor: accentColor }} />
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 w-full">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xl sm:text-2xl animate-bounce" style={{ color: accentColor }}>▲</span>
                  <div>
                    <h1
                      className="text-xl sm:text-3xl md:text-4xl font-black uppercase tracking-[0.12em] font-mono text-white select-none"
                      style={{
                        textShadow: `3px 3px 0px #000, 0 0 10px ${accentColor}80, 0 0 30px ${accentColor}30`
                      }}
                    >
                      {activeConfig.title}
                    </h1>
                    <p className="text-[9px] sm:text-xs text-white/60 uppercase tracking-widest mt-1">
                      {activeConfig.subtitle}
                    </p>
                  </div>
                </div>

                {/* Game Selector Tabs (Horizontally Scrollable on Mobile) */}
                <div className="flex items-center gap-2 bg-slate-950/90 p-1.5 rounded-xl border border-white/15 shadow-2xl overflow-x-auto max-w-full scrollbar-none">
                  {(Object.keys(gamesConfig) as GameTab[]).map((tabKey) => {
                    const cfg = gamesConfig[tabKey];
                    const Icon = cfg.icon;
                    const isActive = activeTab === tabKey;

                    return (
                      <button
                        key={tabKey}
                        type="button"
                        onClick={() => setActiveTab(tabKey)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                          isActive
                            ? `${cfg.color} text-slate-950 shadow-lg scale-105 font-black`
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{getTabLabel(tabKey)}</span>
                        {cfg.badge && (
                          <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-black/20 text-black font-bold' : 'bg-white/10 text-white/60'}`}>
                            {cfg.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Active Game Section */}
          <section className="w-full">
            {activeTab === 'mahjong' ? (
              <div className="p-0 bg-transparent">
                <Mahjong />
              </div>
            ) : activeTab === 'hillclimb' ? (
              <HillClimbCanvas accentColor={profile === 'ella' ? '#ff4b89' : '#c3f400'} />
            ) : activeTab === 'smashfest' ? (
              <SmashFestCanvas accentColor={accentColor} />
            ) : activeTab === 'brickstorm' ? (
              <BrickStormCanvas accentColor={accentColor} />
            ) : activeTab === 'voidrunner' ? (
              <VoidRunnerCanvas accentColor={accentColor} />
            ) : activeTab === 'cyberviper' ? (
              <CyberViperCanvas accentColor={accentColor} />
            ) : activeTab === 'tetrismatrix' ? (
              <TetrisMatrixCanvas accentColor={accentColor} />
            ) : activeTab === 'ballshooter' ? (
              <BallShooterCanvas accentColor={accentColor} />
            ) : activeTab === 'tankdefense' ? (
              <TankDefenseCanvas accentColor={accentColor} />
            ) : activeTab === 'turborace' ? (
              <TurboRaceCanvas accentColor={accentColor} />
            ) : activeTab === 'cyberfrogger' ? (
              <CyberFroggerCanvas accentColor={accentColor} />
            ) : activeTab === 'supplementshooter' ? (
              <SupplementShooterCanvas accentColor={accentColor} />
            ) : activeTab === 'pacman' ? (
              <PacmanCanvas accentColor={accentColor} />
            ) : (
              <NeonStrikerCanvas accentColor={accentColor} />
            )}
          </section>
        </div>
      </main>
    </PrivateRoute>
  );
}
