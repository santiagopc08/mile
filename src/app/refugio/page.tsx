'use client';

import { useState } from 'react';
import { PrivateRoute } from "@/components/PrivateRoute";
import { JarOfNotes } from "@/components/JarOfNotes";
import { PersistentListening } from "@/components/PersistentListening";
import { AudioSection } from "@/components/AudioSection";
import { PetSpaceHub } from "@/components/pets/PetSpaceHub";
import { Timeline } from "@/components/Timeline";
import { useStore } from "@/context/StoreContext";
import { MessageCircleHeart, Mic, Music, PawPrint, Clock, Activity, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RefugioPage() {
  type RefugioTab = 'notas' | 'escucha' | 'musica' | 'bebes' | 'historia';

  const [activeTab, setActiveTab] = useState<RefugioTab>('notas');
  const { data } = useStore();
  const events = data?.events || [];

  const tabs: Array<{ id: RefugioTab; label: string; icon: typeof MessageCircleHeart }> = [
    { id: 'notas', label: 'Notas', icon: MessageCircleHeart },
    { id: 'escucha', label: 'Escucha', icon: Mic },
    { id: 'musica', label: 'Música', icon: Music },
    { id: 'bebes', label: 'Bebés', icon: PawPrint },
    { id: 'historia', label: 'Historia', icon: Clock },
  ];

  return (
    <PrivateRoute>
      <main className="relative z-10 min-h-screen w-full overflow-hidden bg-black px-4 pb-24 pt-6 text-[#e5e2e1] md:px-8 md:pt-8">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-mosaic opacity-70" />
        <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-64 bg-[linear-gradient(180deg,rgba(255,112,32,0.16),transparent)]" />

        <div className="mx-auto w-full max-w-7xl border-x border-white/10">
          <div className="grid border-y border-white/10 bg-[#0a0a0a]/92 md:grid-cols-[1fr_auto]">
            <div className="relative p-5 sm:p-8 md:p-10">
              <div className="absolute left-0 top-0 h-full w-px bg-[#ff7020]" />
              <div className="mb-8 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#a88a7e]">
                <span className="border border-[#ff7020]/50 px-2 py-1 text-[#ffb595]">REFUGIO // V2.0</span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-[#00dbe9]" />
                  SYS_READY
                </span>
              </div>
              <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-normal text-white sm:text-7xl lg:text-8xl">
                El Refugio
              </h1>
              <div className="mt-6 grid max-w-3xl gap-4 border-t border-white/10 pt-5 md:grid-cols-[1fr_auto] md:items-end">
                <p className="max-w-2xl text-sm leading-6 tracking-normal text-[#e1bfb2] md:text-base">
                  Espacio de preservación emocional y conexión activa, presentado como una consola privada de memoria, audio y cuidado.
                </p>
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
                  <span>Channel</span>
                  <span className="text-[#e5b5ff]">{activeTab}</span>
                </div>
              </div>
              <Radio className="h-16 w-16 text-[#ff7020]" strokeWidth={1} />
            </aside>
          </div>

          <div className="grid grid-cols-2 border-b border-white/10 bg-black sm:grid-cols-5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex min-h-20 items-center justify-between border-r border-white/10 px-4 py-4 transition-all last:border-r-0 ${activeTab === tab.id
                    ? 'bg-[#ff7020] text-black'
                    : 'bg-[#0a0a0a] text-[#a88a7e] hover:bg-[#121212] hover:text-white'
                  }`}
              >
                <span className="flex flex-col items-start gap-2">
                  <tab.icon className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${activeTab === tab.id ? 'text-black/55' : 'text-white/20 group-hover:text-[#00dbe9]'}`}>
                  0{tabs.findIndex((item) => item.id === tab.id) + 1}
                </span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabRefugio"
                    className="absolute inset-x-0 bottom-0 h-1 bg-[#00dbe9]"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="bg-[#050505] p-3 sm:p-5 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="min-h-[560px]"
              >
                {activeTab === 'notas' && <JarOfNotes />}
                {activeTab === 'escucha' && <PersistentListening />}
                {activeTab === 'musica' && <AudioSection />}
                {activeTab === 'bebes' && <PetSpaceHub />}
                {activeTab === 'historia' && <Timeline events={events} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </PrivateRoute>
  );
}
