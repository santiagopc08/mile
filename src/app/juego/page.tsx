'use client';

import { useState } from "react";
import { PrivateRoute } from "@/components/PrivateRoute";
import { useProfile } from "@/context/ProfileContext";
import dynamic from "next/dynamic";
import { BrutalistSkeleton } from "@/components/ui/BrutalistSkeleton";
import { AmbientField } from "@/components/AmbientField";
import { Flame, Layers, Target } from "lucide-react";

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

const SmashFestPage = dynamic(
  () => import("@/app/smash-fest/page"),
  {
    loading: () => (
      <BrutalistSkeleton label="Cargando Motor 3D Smash Fest" className="h-[550px] w-full rounded-3xl" />
    ),
    ssr: false,
  }
);

export default function JuegoPage() {
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<'mahjong' | 'hillclimb' | 'smashfest'>('mahjong');

  const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
  const accentClass = profile === 'ella' ? 'user-a' : 'user-b';

  return (
    <PrivateRoute>
      <AmbientField preset="juego" profile={profile} />
      <main className="relative z-10 min-h-screen w-full overflow-hidden px-3 sm:px-6 pb-24 pt-4 text-[#e5e2e1] md:px-8 md:pt-6 font-mono">
        <div className="mx-auto w-full max-w-7xl space-y-5">
          {/* Header Bar */}
          <div className="border border-white/12 bg-white/[0.04] backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden">
            <div className="relative p-4 sm:p-6 md:p-8">
              <div className={`absolute left-0 top-0 h-full w-[5px] bg-${accentClass}`} style={{ backgroundColor: accentColor }} />
              <div className="flex flex-wrap items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xl sm:text-2xl animate-bounce" style={{ color: accentColor }}>▲</span>
                  <div>
                    <h1
                      className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-[0.12em] font-mono text-white select-none"
                      style={{
                        textShadow: `3px 3px 0px #000, 0 0 10px ${accentColor}80, 0 0 30px ${accentColor}30`
                      }}
                    >
                      {activeTab === 'mahjong'
                        ? 'MAHJONG · MIEL-JONG'
                        : activeTab === 'hillclimb'
                        ? 'HILL CLIMB · BUGGY MOUNTAIN'
                        : 'SMASH FEST · DEMOLICIÓN'}
                    </h1>
                    <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-widest mt-1">
                      ZONA DE JUEGOS Y ENTRETENIMIENTO COMPARTIDO
                    </p>
                  </div>
                </div>

                {/* Game Selector Tabs */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-white/15 shadow-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab('mahjong')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'mahjong'
                        ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    MAHJONG
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('hillclimb')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'hillclimb'
                        ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    HILL CLIMB
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('smashfest')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'smashfest'
                        ? 'bg-[#ff4b89] text-slate-950 shadow-md scale-105'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    SMASH FEST
                  </button>
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
            ) : (
              <div className="relative w-full h-[calc(100vh-14rem)] min-h-[600px] rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
                <SmashFestPage />
              </div>
            )}
          </section>
        </div>
      </main>
    </PrivateRoute>
  );
}
