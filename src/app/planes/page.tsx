'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { WishlistModule } from "@/components/WishlistModule";
import { Activity, Compass, Radio } from "lucide-react";

export default function PlanesPage() {
  return (
    <PrivateRoute>
      <main className="relative z-10 min-h-screen w-full overflow-hidden bg-black px-4 pb-24 pt-6 text-[#e5e2e1] md:px-8 md:pt-8">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-mosaic opacity-65" />
        <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-64 bg-[linear-gradient(180deg,rgba(161,0,240,0.15),transparent)]" />

        <div className="mx-auto w-full max-w-7xl border-x border-white/10">
          <div className="grid border-y border-white/10 bg-[#0a0a0a]/95 md:grid-cols-[1fr_auto]">
            <div className="relative p-5 sm:p-8 md:p-10">
              <div className="absolute left-0 top-0 h-full w-px bg-[#a100f0]" />
              <div className="mb-8 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-[#a88a7e]">
                <span className="border border-[#a100f0]/60 px-2 py-1 text-[#e5b5ff]">PLANS // DESIRE_GRID</span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-[#00dbe9]" />
                  MAP_SYNC_READY
                </span>
              </div>
              <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-normal text-white sm:text-7xl lg:text-8xl">
                Planes
              </h1>
              <div className="mt-6 grid max-w-4xl gap-5 border-t border-white/10 pt-5 md:grid-cols-[1fr_auto] md:items-end">
                <p className="max-w-2xl text-sm leading-6 tracking-normal text-[#d9c1e8] md:text-base">
                  Coordenadas, antojos y gustos futuros organizados como una bitácora compartida de intención, presupuesto y memoria.
                </p>
                <div className="grid grid-cols-2 border border-white/10 text-center">
                  <div className="border-r border-white/10 px-4 py-3">
                    <div className="text-2xl font-black text-[#a100f0]">03</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Listas</div>
                  </div>
                  <div className="px-4 py-3">
                    <Compass className="mx-auto h-7 w-7 text-[#00dbe9]" strokeWidth={1.5} />
                    <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Rutas</div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="hidden min-w-56 border-l border-white/10 bg-black/60 p-5 md:flex md:flex-col md:justify-between">
              <div className="space-y-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#a88a7e]">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span>Telemetry</span>
                  <Activity className="h-4 w-4 text-[#00dbe9]" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Signal</span>
                  <span className="text-[#ffb595]">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Module</span>
                  <span className="text-[#e5b5ff]">WISHLIST</span>
                </div>
              </div>
              <Radio className="h-16 w-16 text-[#a100f0]" strokeWidth={1} />
            </aside>
          </div>

          <section className="bg-[#050505] p-3 sm:p-5 md:p-8">
            <WishlistModule />
          </section>
        </div>
      </main>
    </PrivateRoute>
  );
}
