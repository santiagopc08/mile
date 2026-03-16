'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { Timeline } from "@/components/Timeline";
import { JarOfNotes } from "@/components/JarOfNotes";
import { TransparencyDashboard } from "@/components/TransparencyDashboard";
import { AudioSection } from "@/components/AudioSection";
import { useStore } from "@/context/StoreContext";

export default function Home() {
  const { data } = useStore();

  const events = data?.events || [];

  return (
    <PrivateRoute>
      <main className="w-full max-w-5xl mx-auto px-6 md:px-12 py-24 space-y-48 flex flex-col items-center justify-center">

        {/* Header Hero Area */}
        <header id="hero" className="text-center space-y-8 pt-10 w-full max-w-3xl mx-auto flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-light tracking-tight text-stone-800 dark:text-stone-100">
            Santuario Activo
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Un espacio seguro dedicado a la reconstrucción, la transparencia radical y la honestidad profunda.
          </p>
        </header>

        {/* Interactive Dashboard Section */}
        <section id="dashboard" className="w-full flex justify-center">
          <TransparencyDashboard />
        </section>

        {/* Jar of Notes Section */}
        <section id="notes" className="w-full flex justify-center">
          <JarOfNotes />
        </section>

        {/* Timeline Section */}
        <section id="timeline" className="w-full space-y-12 flex flex-col items-center">
          <div className="text-center w-full">
            <h2 className="text-3xl font-light text-stone-800 dark:text-stone-200 mb-3">Nuestra Historia</h2>
            <p className="text-stone-500 font-light">Los pasos que hemos dado juntos.</p>
          </div>
          <Timeline events={events} />
        </section>

        {/* Embedded Audio Section */}
        <section id="audio" className="w-full pb-20 flex justify-center">
          <AudioSection />
        </section>

      </main>
    </PrivateRoute>
  );
}
