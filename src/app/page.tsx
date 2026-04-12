'use client';

import { PrivateRoute } from "@/components/PrivateRoute";
import { Timeline } from "@/components/Timeline";
import { JarOfNotes } from "@/components/JarOfNotes";
import { Mahjong } from "@/components/Mahjong";
import { TransparencyDashboard } from "@/components/TransparencyDashboard";
import { PersistentListening } from "@/components/PersistentListening";
import { AudioSection } from "@/components/AudioSection";
import { useStore } from "@/context/StoreContext";

export default function Home() {
  const { data } = useStore();

  const events = data?.events || [];

  return (
    <PrivateRoute>
      <main className="w-full max-w-5xl mx-auto px-6 md:px-12 flex flex-col items-center justify-center">

        {/* Header Hero Area */}
        <header id="hero" className="min-h-[100dvh] text-center space-y-8 w-full max-w-3xl mx-auto flex flex-col items-center justify-center pt-20">
          <h1 className="text-4xl md:text-6xl font-light tracking-tight text-stone-800 dark:text-stone-100">
            Nuestro Espacio
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Me equivoqué y lo reconozco, pero estoy dispuesto a trabajar en ello y hacerte saber que por ti lo doy todo. Te amo y quiero demostrarlo, con gestos como este, que demuestren mi compromiso y mi amor por ti. Este espacio es para ti, para nosotros. <br></br>❤️
          </p>
        </header>

        {/* Interactive Dashboard Section */}
        <section id="dashboard" className="min-h-[100dvh] w-full flex items-center justify-center py-20">
          <TransparencyDashboard />
        </section>

        {/* Jar of Notes Section */}
        <section id="notes" className="min-h-[100dvh] w-full flex flex-col items-center justify-center py-20 relative">
          <JarOfNotes />
        </section>

        {/* Persistent Listening Section */}
        <section id="listening" className="min-h-[100dvh] w-full flex flex-col items-center justify-center py-24 relative">
          <PersistentListening />
        </section>
        
        {/* Memory Match Game Section */}
        <section id="game" className="min-h-[100dvh] w-full flex items-center justify-center py-20 relative bg-stone-50 dark:bg-stone-950 px-0 md:px-0 -mx-6 w-[calc(100%+3rem)] md:mx-0 md:w-full">
          <Mahjong />
        </section>

        {/* Timeline Section */}
        <section id="timeline" className="min-h-[100dvh] w-full space-y-12 flex flex-col items-center justify-center py-24">
          <div className="text-center w-full">
            <h2 className="text-3xl font-light text-stone-800 dark:text-stone-200 mb-3">Nuestra Historia</h2>
            <p className="text-stone-500 font-light">Los pasos que hemos dado juntos.</p>
          </div>
          <Timeline events={events} />
        </section>

        {/* Embedded Audio Section */}
        <section id="audio" className="min-h-[100dvh] w-full flex items-center justify-center py-24">
          <AudioSection />
        </section>

      </main>
    </PrivateRoute>
  );
}
