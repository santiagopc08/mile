'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { Timeline } from "@/components/Timeline";
import { useStore } from "@/context/StoreContext";

export default function HistoriaPage() {
  const { data } = useStore();
  const events = data?.events || [];

  return (
    <PrivateRoute>
      <main className="w-full flex flex-col items-center justify-start pt-10 px-4 md:px-12 pb-24 space-y-12">
        <div className="text-center w-full">
          <h2 className="text-3xl font-light text-stone-800 dark:text-stone-200 mb-3">Nuestra Historia</h2>
          <p className="text-stone-500 font-light">Los pasos que hemos dado juntos.</p>
        </div>
        <Timeline events={events} />
      </main>
    </PrivateRoute>
  );
}
