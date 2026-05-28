'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { WishlistModule } from "@/components/WishlistModule";
import { GeospatialPlanTracker } from "@/components/GeospatialPlanTracker";
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
          <div className="border-y border-white/10 bg-[#0a0a0a]/95">
            <div className="relative p-5 sm:p-8 md:p-10">
              <div className={`absolute left-0 top-0 h-full w-px bg-${accentClass}`} style={{ backgroundColor: accentColor }} />
              <div className="mb-8 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-[#a88a7e]">
                <span className={`border border-${accentClass}/60 px-2 py-1 text-${accentClass}`} style={{ borderColor: `${accentColor}99`, color: accentColor }}>NUESTROS PLANES // DESEOS Y METAS</span>
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 bg-${secondaryClass}`} style={{ backgroundColor: secondaryColor }} />
                  MAPA LISTO
                </span>
              </div>
              <h1 className="max-w-4xl text-5xl font-mono font-black uppercase leading-[0.92] tracking-tighter text-white sm:text-7xl lg:text-8xl">
                Planes
              </h1>
              <div className="mt-6 max-w-4xl border-t border-white/10 pt-5">
                <p className="max-w-2xl text-sm leading-6 tracking-normal text-[#d9c1e8] md:text-base font-mono uppercase tracking-wider text-xs">
                  Antojos, metas de ahorro y experiencias organizadas como una bitácora compartida de intención y deseo.
                </p>
              </div>
            </div>
          </div>

          <section className="bg-[#050505] p-3 sm:p-5 md:p-8 space-y-8">
            <GeospatialPlanTracker />
            <div className="border-t border-white/10 pt-4" />
            <WishlistModule />
          </section>
        </div>
      </main>
    </PrivateRoute>
  );
}
