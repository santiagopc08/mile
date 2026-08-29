'use client';

import { useState } from "react";
import { PrivateRoute } from "@/components/PrivateRoute";
import { useProfile } from "@/context/ProfileContext";
import dynamic from "next/dynamic";
import { BrutalistSkeleton } from "@/components/ui/BrutalistSkeleton";
import { AmbientField } from "@/components/AmbientField";
import { useArcadePhotos } from "@/hooks/useArcadePhotos";
import { useArcadeProgression } from "@/hooks/useArcadeProgression";
import { ArcadeGameSelector, type GameTab } from "@/components/arcade/ArcadeGameSelector";
import { ArcadeHubModal } from "@/components/arcade/ArcadeHubModal";

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

const DogsVsMonstersCanvas = dynamic(
  () => import("@/components/arcade/dogs-vs-monsters/DogsVsMonstersCanvas").then((m) => m.DogsVsMonstersCanvas),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Dogs vs Monsters (Patio Defense)" className="h-[550px] w-full rounded-3xl" />
    ),
    ssr: false,
  }
);

export default function JuegoPage() {
  const { profile } = useProfile();
  const { memories } = useArcadePhotos();
  const { coins, pendingQuestsCount, coupons } = useArcadeProgression();
  const [activeTab, setActiveTab] = useState<GameTab>('mahjong');
  const [isHubOpen, setIsHubOpen] = useState(false);

  const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';

  return (
    <PrivateRoute>
      <AmbientField preset="juego" profile={profile} />
      <main className="relative z-10 min-h-screen w-full overflow-hidden px-3 sm:px-6 pb-24 pt-4 text-[#e5e2e1] md:px-8 md:pt-6 font-mono">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          {/* Arcade Cabinet Game Selector */}
          <ArcadeGameSelector
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            profile={profile}
            memoriesCount={memories.length}
            onOpenHub={() => setIsHubOpen(true)}
            coins={coins}
            pendingQuests={pendingQuestsCount}
            couponsCount={coupons.length}
          />

          {/* Active Game Section / Arcade Display Screen */}
          <section id={`game-canvas-${activeTab}`} className="w-full relative">
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
            ) : activeTab === 'neonstriker' ? (
              <NeonStrikerCanvas accentColor={accentColor} />
            ) : (
              <DogsVsMonstersCanvas />
            )}
          </section>

          {/* Arcade Hub & Duels Modal */}
          <ArcadeHubModal
            isOpen={isHubOpen}
            onClose={() => setIsHubOpen(false)}
            onSelectGame={setActiveTab}
          />
        </div>
      </main>
    </PrivateRoute>
  );
}
