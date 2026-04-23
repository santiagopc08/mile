'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { WishlistModule } from "@/components/WishlistModule";

export default function PlanesPage() {
  return (
    <PrivateRoute>
      <main className="w-full flex flex-col items-center justify-start pt-12 px-4 md:px-12 pb-24 relative z-10">
        <div className="w-full max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col items-center justify-center text-center border-b border-stone-200 dark:border-stone-800 pb-8 mb-8">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase italic leading-none text-geometric-accent">Deseos</h1>
            <p className="text-stone-500 text-[10px] uppercase font-bold tracking-[0.4em] mt-4">
              Planes, Antojos y Gustos para el Futuro
            </p>
          </div>

          <WishlistModule />
        </div>
      </main>
    </PrivateRoute>
  );
}
