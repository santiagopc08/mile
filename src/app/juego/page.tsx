'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { Mahjong } from "@/components/Mahjong";
import { Activity, Gamepad2, Radio } from "lucide-react";
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
              <div className="mb-8 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-[#a88a7e]">
                <span className={`border border-${accentClass}/60 px-2 py-1 text-${accentClass}`} style={{ borderColor: `${accentColor}99`, color: accentColor }}>ENTRENAMIENTO COGNITIVO // MEMORIA</span>
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 bg-${secondaryClass}`} style={{ backgroundColor: secondaryColor }} />
                  EN LÍNEA
                </span>
              </div>
              <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-normal text-white sm:text-7xl lg:text-8xl">
                Nuestra Memoria
              </h1>
              <div className="mt-6 grid max-w-4xl gap-5 border-t border-white/10 pt-5 md:grid-cols-[1fr_auto] md:items-end">
                <p className="max-w-2xl text-sm leading-6 tracking-normal text-[#e1bfb2] md:text-base">
                  Un tablero de recuerdos compartidos, parejas visuales y precisión táctil diseñado para ejercitar la mente juntos.
                </p>
                <div className="grid grid-cols-2 border border-white/10 text-center">
                  <div className="border-r border-white/10 px-4 py-3">
                    <Gamepad2 className={`mx-auto h-7 w-7 text-${accentClass}`} style={{ color: accentColor }} strokeWidth={1.5} />
                    <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Mahjong</div>
                  </div>
                  <div className="px-4 py-3">
                    <div className={`text-2xl font-black text-${secondaryClass}`} style={{ color: secondaryColor }}>04</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Niveles</div>
                  </div>
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
