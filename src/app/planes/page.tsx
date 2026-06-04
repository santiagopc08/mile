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
