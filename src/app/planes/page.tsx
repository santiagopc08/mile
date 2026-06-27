'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { WishlistModule } from "@/components/WishlistModule";
import { useProfile } from "@/context/ProfileContext";
import { useStore } from "@/context/StoreContext";
import { Activity, Compass, Radio } from "lucide-react";
import { useMemo, useEffect } from "react";
import dynamic from "next/dynamic";

const GeospatialPlanTracker = dynamic(
  () => import("@/components/GeospatialPlanTracker").then((m) => m.GeospatialPlanTracker),
  {
    loading: () => (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 border border-dashed border-white/10 bg-black/60 p-8">
        <Compass className="h-8 w-8 text-[#00dbe9] animate-pulse" />
        <p className="text-center text-[10px] font-mono font-black uppercase tracking-[0.24em] text-[#a88a7e]">
          Iniciando Mapa Satelital...
        </p>
      </div>
    ),
    ssr: false,
  }
);

export default function PlanesPage() {
  const { profile } = useProfile();
  const { data } = useStore();
  const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
  const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
  const secondaryColor = profile === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';
  const secondaryClass = profile === 'ella' ? 'user-b' : 'user-a';

  const stats = useMemo(() => {
    const items = data?.wishlist || [];
    // ⚡ Bolt Optimization: Replace multiple .filter().length with a single O(N) pass
    // to avoid creating intermediate arrays and reduce GC pressure.
    let active = 0;
    let completed = 0;
    for (const i of items) {
      if (i.state === 'COMPLETED') {
        completed++;
      } else if (i.state !== 'ARCHIVED') {
        active++;
      }
    }
    return { total: items.length, active, completed };
  }, [data?.wishlist]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const scroll = params.get('scroll');
      if (action === 'add' || scroll === 'wishlist') {
        setTimeout(() => {
          const el = document.getElementById('wishlist-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    }
  }, []);

  return (
    <PrivateRoute>
      <main className="relative z-10 min-h-screen w-full overflow-hidden bg-black px-4 pb-24 pt-6 text-[#e5e2e1] md:px-8 md:pt-8 font-sans">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-mosaic opacity-65" />
        <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-64 opacity-20" style={{ backgroundImage: `linear-gradient(180deg, ${accentColor}, transparent)` }} />
        <div className="pointer-events-none fixed inset-0 -z-10 planes-warm-glow opacity-40" />

        <div className="mx-auto w-full max-w-7xl border-x border-white/10">
          <div className="border-y border-white/10 bg-[#0a0a0a]/95">
            <div className="relative p-5 sm:p-8 md:p-10">
              <div className={`absolute left-0 top-0 h-full w-px bg-${accentClass}`} style={{ backgroundColor: accentColor }} />
              <h1 className="max-w-4xl text-3xl sm:text-4xl md:text-5xl font-mono font-bold uppercase leading-[0.92] tracking-tight text-white">
                Planes
              </h1>
            </div>
          </div>

          <section className="bg-[#050505] p-3 sm:p-5 md:p-8 space-y-4">
            <GeospatialPlanTracker />
            <div id="wishlist-section" className="border-t border-white/10" />
            <WishlistModule />
          </section>
        </div>
      </main>
    </PrivateRoute>
  );
}
