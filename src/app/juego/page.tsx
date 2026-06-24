'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { useProfile } from "@/context/ProfileContext";
import dynamic from "next/dynamic";
import { AnimatedBrutalistCorners } from "@/components/ui/AnimatedBrutalistCorners";

const Mahjong = dynamic(
  () => import("@/components/Mahjong").then((m) => m.Mahjong),
  {
    loading: () => (
      <div className="flex h-[400px] w-full items-center justify-center border border-dashed border-white/10 bg-black/40 font-mono text-xs uppercase text-[#a88a7e] tracking-widest animate-pulse">
        Cargando Tablero Mahjong...
      </div>
    ),
    ssr: false,
  }
);

export default function JuegoPage() {
  const { profile } = useProfile();
  const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
  const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
  const secondaryColor = profile === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';
  const secondaryClass = profile === 'ella' ? 'user-b' : 'user-a';

  return (
    <PrivateRoute>
      <main className="relative z-10 min-h-screen w-full overflow-hidden bg-black px-4 pb-24 pt-6 text-[#e5e2e1] md:px-8 md:pt-8">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-mosaic opacity-65" />
        <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-64 opacity-20" style={{ backgroundImage: `linear-gradient(180deg, ${accentColor}, transparent)` }} />

        <div className="mx-auto w-full max-w-7xl border-x border-white/10">
          <div className="border-y border-white/10 bg-[#0a0a0a]/95">
            <div className="relative p-5 sm:p-8 md:p-10">
              <div className={`absolute left-0 top-0 h-full w-[5px] bg-${accentClass}`} style={{ backgroundColor: accentColor }} />
              <div className="flex items-center justify-between gap-4 w-full">
                <h1 
                  className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-[0.15em] font-mono text-white select-none"
                  style={{
                    textShadow: `3px 3px 0px #000, 0 0 10px ${accentColor}80, 0 0 30px ${accentColor}30`
                  }}
                >
                  Miel-jong
                </h1>
                
                {/* Sprite B from Miel-jong.mp4 */}
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 flex-shrink-0">
                  <video
                    className="h-full w-full object-cover object-right opacity-90 mix-blend-screen contrast-125"
                    src="/vid/Miel-jong.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    webkit-playsinline="true"
                  />
                </div>
              </div>
            </div>
          </div>

          <section className="bg-[#050505] p-3 sm:p-5 md:p-8">
            <Mahjong />
          </section>
        </div>
      </main>
    </PrivateRoute>
  );
}
