'use client';

import { useState } from 'react';
import { PrivateRoute } from "@/components/PrivateRoute";
import { JarOfNotes } from "@/components/JarOfNotes";
import { PersistentListening } from "@/components/PersistentListening";
import { AudioSection } from "@/components/AudioSection";
import { PetsGallery } from "@/components/PetsGallery";
import { Timeline } from "@/components/Timeline";
import { useStore } from "@/context/StoreContext";
import { MessageCircleHeart, Mic, Music, PawPrint, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RefugioPage() {
  const [activeTab, setActiveTab] = useState<'notas' | 'escucha' | 'musica' | 'bebes' | 'historia'>('notas');
  const { data } = useStore();
  const events = data?.events || [];

  const tabs = [
    { id: 'notas', label: 'Notas', icon: MessageCircleHeart },
    { id: 'escucha', label: 'Escucha', icon: Mic },
    { id: 'musica', label: 'Música', icon: Music },
    { id: 'bebes', label: 'Bebés', icon: PawPrint },
    { id: 'historia', label: 'Historia', icon: Clock },
  ];

  return (
    <PrivateRoute>
      <main className="w-full flex flex-col items-center justify-start pt-12 px-4 md:px-12 pb-24 relative z-10">
        <div className="w-full max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col items-center justify-center text-center border-b border-stone-200 dark:border-stone-800 pb-8">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase italic leading-none">El Refugio</h1>
            <p className="text-stone-500 text-[10px] uppercase font-bold tracking-[0.4em] mt-4">
              Espacio de Preservación Emocional y Conexión Activa
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center gap-2 md:gap-4 border-b border-stone-100 dark:border-stone-900 pb-4 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-4 sm:px-6 py-3 flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? 'text-geometric-accent'
                    : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-[10px] uppercase font-black tracking-widest hidden sm:inline">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabRefugio"
                    className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-geometric-accent"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'notas' && <JarOfNotes />}
                {activeTab === 'escucha' && <PersistentListening />}
                {activeTab === 'musica' && <AudioSection />}
                {activeTab === 'bebes' && <PetsGallery />}
                {activeTab === 'historia' && <Timeline events={events} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </PrivateRoute>
  );
}
