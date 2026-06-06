'use client';

import { useState, useEffect } from 'react';
import { PrivateRoute } from "@/components/PrivateRoute";
import { JarOfNotes } from "@/components/JarOfNotes";
import { PersistentListening } from "@/components/PersistentListening";
import { AudioSection } from "@/components/AudioSection";
import { PetSpaceHub } from "@/components/PetSpaceHub";
import { Timeline } from "@/components/Timeline";
import { useStore } from "@/context/StoreContext";
import { useProfile } from "@/context/ProfileContext";
import { MessageCircleHeart, Mic, Music, PawPrint, Clock, Activity, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RefugioPage() {
  type RefugioTab = 'notas' | 'escucha' | 'musica' | 'bebes' | 'historia';

  const [activeTab, setActiveTab] = useState<RefugioTab>('notas');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as RefugioTab;
      if (tab && ['notas', 'escucha', 'musica', 'bebes', 'historia'].includes(tab)) {
        setActiveTab(tab);
        setTimeout(() => {
          const el = document.getElementById('refugio-content');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, []);
  const { data } = useStore();
  const { profile } = useProfile();
  const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
  const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
  const secondaryColor = profile === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';
  const secondaryClass = profile === 'ella' ? 'user-b' : 'user-a';
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
      <main className="relative z-10 min-h-screen w-full overflow-hidden bg-black px-4 pb-24 pt-6 text-[#e5e2e1] md:px-8 md:pt-8 font-sans">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-mosaic opacity-70" />
        <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-64 opacity-20" style={{ backgroundImage: `linear-gradient(180deg, ${accentColor}, transparent)` }} />

        <div className="mx-auto w-full max-w-7xl border-x border-white/10">
          <div className="border-y border-white/10 bg-[#0a0a0a]/92">
            <div className="relative p-5 sm:p-8 md:p-10">
              <div className={`absolute left-0 top-0 h-full w-px bg-${accentClass}`} style={{ backgroundColor: accentColor }} />
              <h1 className="max-w-4xl text-3xl sm:text-4xl md:text-5xl font-mono font-bold uppercase leading-[0.92] tracking-tight text-white">
                El Refugio
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 border-b border-white/10 bg-black sm:grid-cols-5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative font-mono flex min-h-20 items-center justify-between border-r border-white/10 px-4 py-4 transition-all last:border-r-0 ${activeTab === tab.id
                  ? 'text-black'
                  : 'bg-[#0a0a0a] text-[#a88a7e] hover:bg-[#121212] hover:text-white'
                  }`}
                style={activeTab === tab.id ? { backgroundColor: accentColor } : {}}
              >
                <span className="flex flex-col items-start gap-2">
                  <tab.icon className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] font-mono">{tab.label}</span>
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] font-mono ${activeTab === tab.id ? 'text-black/55' : `text-white/20 group-hover:text-${secondaryClass}`}`} style={activeTab !== tab.id ? { '--tw-hover-text-opacity': 1 } as any : {}}>
                  0{tabs.findIndex((item) => item.id === tab.id) + 1}
                </span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabRefugio"
                    className={`absolute inset-x-0 bottom-0 h-1 bg-${secondaryClass}`}
                    style={{ backgroundColor: secondaryColor }}
                  />
                )}
              </button>
            ))}
          </div>

          <div id="refugio-content" className="bg-[#050505] p-3 sm:p-5 md:p-8">
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
