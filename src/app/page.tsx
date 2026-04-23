'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { SymmetryDashboard } from "@/components/symmetry/SymmetryDashboard";

export default function Home() {
  return (
    <PrivateRoute>
      <div className="fixed inset-0 z-[-1] bg-stone-50 dark:bg-stone-950 overflow-hidden">
        {/* Subtle Geometric Background */}
        <div className="absolute inset-0 bg-mosaic opacity-85" />
        <div className="absolute inset-0 bg-dot-matrix opacity-65" />
        
        {/* Structural Geometric Accents */}
        <div className="absolute top-0 left-1/4 w-[1px] h-full bg-stone-200/50 dark:bg-stone-800/30" />
        <div className="absolute top-0 right-1/4 w-[1px] h-full bg-stone-200/50 dark:bg-stone-800/30" />
        <div className="absolute top-1/3 left-0 w-full h-[1px] bg-stone-200/50 dark:bg-stone-800/30" />
      </div>

      <main className="w-full flex flex-col items-center justify-start pt-12 px-6 md:px-16 pb-24 relative z-10">
        <section className="w-full">
          <SymmetryDashboard />
        </section>
      </main>
    </PrivateRoute>
  );
}
