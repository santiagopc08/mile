'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { WishlistModule } from "@/components/WishlistModule";
import { useProfile } from "@/context/ProfileContext";
import { useStore } from "@/context/StoreContext";
import { Activity, Compass, Radio } from "lucide-react";
import { useMemo } from "react";

export default function PlanesPage() {
  const { profile } = useProfile();
  const { data } = useStore();
  const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
  const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
  const secondaryColor = profile === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';
  const secondaryClass = profile === 'ella' ? 'user-b' : 'user-a';

  const stats = useMemo(() => {
    const items = data?.wishlist || [];
    const active = items.filter((i: any) => i.state !== 'ARCHIVED' && i.state !== 'COMPLETED').length;
    const completed = items.filter((i: any) => i.state === 'COMPLETED').length;
    return { total: items.length, active, completed };
  }, [data?.wishlist]);

  return (
    <PrivateRoute>
      <main className="relative z-10 min-h-screen w-full overflow-hidden bg-black px-4 pb-24 pt-6 text-[#e5e2e1] md:px-8 md:pt-8">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-mosaic opacity-65" />
        <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-64 opacity-20" style={{ backgroundImage: `linear-gradient(180deg, ${accentColor}, transparent)` }} />
        <div className="pointer-events-none fixed inset-0 -z-10 planes-warm-glow opacity-40" />

        <div className="mx-auto w-full max-w-7xl border-x border-white/10">
          <div className="grid border-y border-white/10 bg-[#0a0a0a]/95 md:grid-cols-[1fr_auto]">
            <div className="relative p-5 sm:p-8 md:p-10">
              <div className={`absolute left-0 top-0 h-full w-px bg-${accentClass}`} style={{ backgroundColor: accentColor }} />
              <div className="mb-8 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-[#a88a7e]">
                <span className={`border border-${accentClass}/60 px-2 py-1 text-${accentClass}`} style={{ borderColor: `${accentColor}99`, color: accentColor }}>PLANS // DESIRE_GRID</span>
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 bg-${secondaryClass}`} style={{ backgroundColor: secondaryColor }} />
                  MAP_SYNC_READY
                </span>
              </div>
              <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-normal text-white sm:text-7xl lg:text-8xl">
                Planes
              </h1>
              <div className="mt-6 grid max-w-4xl gap-5 border-t border-white/10 pt-5 md:grid-cols-[1fr_auto] md:items-end">
                <p className="max-w-2xl text-sm leading-6 tracking-normal text-[#d9c1e8] md:text-base">
                  Antojos, metas de ahorro y experiencias organizadas como una bitácora compartida de intención y deseo.
                </p>
                <div className="grid grid-cols-3 border border-white/10 text-center">
                  <div className="border-r border-white/10 px-4 py-3">
                    <div className={`text-2xl font-black text-${accentClass}`} style={{ color: accentColor }}>{String(stats.active).padStart(2, '0')}</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Activos</div>
                  </div>
                  <div className="border-r border-white/10 px-4 py-3">
                    <div className="text-2xl font-black text-user-c">{String(stats.completed).padStart(2, '0')}</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Logrados</div>
                  </div>
                  <div className="px-4 py-3">
                    <Compass className={`mx-auto h-7 w-7 text-${secondaryClass}`} style={{ color: secondaryColor }} strokeWidth={1.5} />
                    <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Rutas</div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="hidden min-w-56 border-l border-white/10 bg-black/60 p-5 md:flex md:flex-col md:justify-between">
              <div className="space-y-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#a88a7e]">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span>Telemetry</span>
                  <Activity className={`h-4 w-4 text-${secondaryClass}`} style={{ color: secondaryColor }} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Signal</span>
                  <span className="text-[#ffb595]">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Module</span>
                  <span className={accentClass} style={{ color: accentColor }}>WISHLIST</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Items</span>
                  <span className="text-user-c">{stats.total}</span>
                </div>
              </div>
              <Radio className={`h-16 w-16 text-${accentClass}`} style={{ color: accentColor }} strokeWidth={1} />
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
