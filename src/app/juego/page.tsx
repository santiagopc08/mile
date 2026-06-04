'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { Mahjong } from "@/components/Mahjong";
import { useProfile } from "@/context/ProfileContext";

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
              <div className={`absolute left-0 top-0 h-full w-px bg-${accentClass}`} style={{ backgroundColor: accentColor }} />
              <h1 className="max-w-4xl text-3xl sm:text-4xl md:text-5xl font-mono font-bold uppercase leading-[0.92] tracking-tight text-white">
                Mahjong
              </h1>
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
