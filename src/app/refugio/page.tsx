'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PrivateRoute } from "@/components/PrivateRoute";
import { JarOfNotes } from "@/components/JarOfNotes";
import { PersistentListening } from "@/components/PersistentListening";
import { PetSpaceHub } from "@/components/PetSpaceHub";
import { Timeline } from "@/components/Timeline";
import { useStore } from "@/context/StoreContext";
import { useProfile } from "@/context/ProfileContext";
import { MessageCircleHeart, Mic, PawPrint, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { CyberButton } from "@/components/ui/CyberButton";

export default function RefugioPage() {
  type RefugioTab = 'notas' | 'escucha' | 'bebes' | 'historia';

  const [activeTab, setActiveTab] = useState<RefugioTab>('historia');

  const isBirthdayActive = new Date() >= new Date(2026, 5, 17, 0, 0, 0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URL(window.location.href).searchParams;
      const tab = params.get('tab') as RefugioTab;
      if (tab && ['notas', 'escucha', 'bebes', 'historia'].includes(tab)) {
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
    { id: 'historia', label: 'Historia', icon: Clock },
    { id: 'notas', label: 'Notas', icon: MessageCircleHeart },
    { id: 'escucha', label: 'Escucha', icon: Mic },
    { id: 'bebes', label: 'Bebés', icon: PawPrint },
  ];

  return (
    <PrivateRoute>
      <InteractiveBackground preset="refugio" profile={profile} />
      <main className="relative z-10 min-h-screen w-full overflow-hidden px-4 pb-24 pt-6 text-[#e5e2e1] md:px-8 md:pt-8 font-sans">

        <div className="mx-auto w-full max-w-7xl border-x border-white/10">
          <div className="border-y border-white/10 bg-[#0a0a0a]/92">
            <div className="relative p-5 sm:p-8 md:p-10">
              <div className={`absolute left-0 top-0 h-full w-[4px] bg-${accentClass}`} style={{ backgroundColor: accentColor }} />
              <div className="flex items-center gap-3">
                <span className="font-mono text-base sm:text-xl animate-spin-slow" style={{ color: accentColor }}>◆</span>
                <h1 className="max-w-4xl text-2xl sm:text-4xl md:text-5xl font-mono font-bold uppercase leading-[0.92] tracking-tight text-white">
                  REFUGIO · NUESTRO ESPACIO
                </h1>
              </div>
            </div>
          </div>

          {isBirthdayActive && (
            <div className="border-b border-[#ff4b89]/20 bg-[#070105]/80 p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-[#ff4b89] via-[#c3f400] to-purple-600" />
              
              <div className="space-y-3 relative z-10 max-w-2xl">
                <div className="flex items-center gap-2 text-[9px] font-mono font-bold tracking-[0.25em] text-[#ff4b89]">
                  <Sparkles size={12} className="text-[#c3f400] animate-pulse" />
                  <span>SECCIÓN PERMANENTE · PROTOCOLO DE CUMPLEAÑOS</span>
                </div>
                
                <h2 className="text-2xl font-mono font-black uppercase text-white leading-none tracking-wide">
                  ¡FELIZ CUMPLEAÑOS, MILE! 🎂✨
                </h2>
                
                <p className="text-xs leading-relaxed text-[#e1bfb2] font-sans">
                  Se ha unlocked una experiencia interactiva exclusiva para ti con cartas de la tripulación, videos, pasteles interactivos y sorpresas creadas con mucho cariño. ¡No te la pierdas!
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 font-mono text-[9px] text-[#a88a7e] uppercase">
                  <span>ESTADO DEL PROTOCOLO:</span>
                  <div className="flex gap-1.5 text-[#c3f400] font-bold bg-[#c3f400]/10 px-2 py-0.5 border border-[#c3f400]/20 tracking-wider">
                    <span>ARCHIVO PERMANENTE</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 relative z-10 self-start md:self-center">
                <Link href="/cumple">
                  <CyberButton variant="primary" accentColor="#ff4b89" size="lg">
                    INGRESAR A LA EXPERIENCIA 🎁
                  </CyberButton>
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 border-b border-white/10 bg-black sm:grid-cols-4 lg:grid-cols-4">
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
