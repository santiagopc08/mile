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
import { AmbientField } from "@/components/AmbientField";
import { CyberButton } from "@/components/ui/CyberButton";
import { haptics } from "@/lib/haptics";

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

  const modules: Array<{
    id: RefugioTab;
    code: string;
    label: string;
    detail: string;
    icon: typeof MessageCircleHeart;
  }> = [
    { id: 'historia', code: 'SYS // 01', label: 'Historia', detail: 'Hitos y memorias', icon: Clock },
    { id: 'notas', code: 'SYS // 02', label: 'Notas', detail: 'Frasco de notas', icon: MessageCircleHeart },
    { id: 'escucha', code: 'SYS // 03', label: 'Escucha', detail: 'Bitácora activa', icon: Mic },
    { id: 'bebes', code: 'SYS // 04', label: 'Bebés', detail: 'Espacio de bebés', icon: PawPrint },
  ];

  return (
    <PrivateRoute>
      <AmbientField preset="refugio" profile={profile} />
      <main className="relative z-10 min-h-screen w-full overflow-hidden px-4 pb-24 pt-6 text-[#e5e2e1] md:px-8 md:pt-8 font-sans">

        <div className="mx-auto w-full max-w-7xl space-y-6">
          <div className="border border-white/12 bg-white/[0.04] backdrop-blur-2xl backdrop-saturate-150 shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
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
            <div className="border border-[#ff4b89]/30 bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl">
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
                  Se ha unlocked una experiencia interactiva exclusiva para ti con cartas de la tripulación, pasteles interactivos y sorpresas creadas con mucho cariño.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 font-mono text-[9px] text-[#a88a7e] uppercase">
                  <span>ESTADO DEL PROTOCOLO:</span>
                  <div className="flex gap-1.5 text-[#c3f400] font-bold bg-[#c3f400]/15 backdrop-blur-md px-2 py-0.5 border border-[#c3f400]/30 tracking-wider">
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

          {/* HUD Module Command Deck */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            {modules.map((mod, index) => {
              const isActive = activeTab === mod.id;
              const Icon = mod.icon;

              return (
                <button
                  key={mod.id}
                  onClick={() => {
                    if (!isActive) {
                      haptics.triggerTick();
                      setActiveTab(mod.id);
                    }
                  }}
                  className={`group relative overflow-hidden text-left p-3.5 sm:p-4.5 border transition-all duration-300 active:scale-[0.98] flex flex-col justify-between gap-3 min-h-[96px] sm:min-h-[110px] ${
                    isActive
                      ? 'border-white/30 bg-white/[0.07] backdrop-blur-2xl shadow-[0_0_24px_-4px_rgba(0,0,0,0.6)]'
                      : 'border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05] text-[#a88a7e]'
                  }`}
                  style={{
                    borderColor: isActive ? accentColor : undefined,
                    boxShadow: isActive ? `0 0 20px -6px ${accentColor}` : undefined
                  }}
                >
                  {/* Active animated backdrop indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="refugioActiveDeck"
                      className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}

                  {/* Corner HUD Brackets */}
                  <div 
                    className="absolute top-1.5 left-1.5 w-2 h-2 border-t-2 border-l-2 transition-all duration-300 group-hover:scale-125 pointer-events-none" 
                    style={{ borderColor: isActive ? accentColor : 'rgba(255,255,255,0.15)' }} 
                  />
                  <div 
                    className="absolute top-1.5 right-1.5 w-2 h-2 border-t-2 border-r-2 transition-all duration-300 group-hover:scale-125 pointer-events-none" 
                    style={{ borderColor: isActive ? accentColor : 'rgba(255,255,255,0.15)' }} 
                  />
                  <div 
                    className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b-2 border-l-2 transition-all duration-300 group-hover:scale-125 pointer-events-none" 
                    style={{ borderColor: isActive ? accentColor : 'rgba(255,255,255,0.15)' }} 
                  />
                  <div 
                    className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b-2 border-r-2 transition-all duration-300 group-hover:scale-125 pointer-events-none" 
                    style={{ borderColor: isActive ? accentColor : 'rgba(255,255,255,0.15)' }} 
                  />

                  {/* Top Row: System Tag & Pulse Indicator */}
                  <div className="flex items-center justify-between gap-2 relative z-10 w-full">
                    <span 
                      className="font-mono text-[8px] sm:text-[9px] font-black tracking-[0.2em] transition-colors"
                      style={{ color: isActive ? accentColor : undefined }}
                    >
                      {mod.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isActive && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: accentColor }} />
                          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: accentColor }} />
                        </span>
                      )}
                      <span className={`text-[8.5px] font-mono font-bold ${isActive ? 'text-white' : 'text-white/30 group-hover:text-white/60'}`}>
                        0{index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Icon + Module Label & Detail */}
                  <div className="flex items-center gap-3 relative z-10">
                    <div 
                      className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center shrink-0 border transition-all duration-300 ${
                        isActive 
                          ? 'border-white/30 bg-black/40 shadow-inner' 
                          : 'border-white/10 bg-white/[0.03] group-hover:border-white/20'
                      }`}
                      style={{ borderColor: isActive ? accentColor : undefined }}
                    >
                      <Icon 
                        className={`h-4 w-4 sm:h-4.5 sm:w-4.5 transition-all duration-300 ${
                          isActive 
                            ? 'scale-110 drop-shadow-[0_0_8px_var(--color-profile-accent)]' 
                            : 'group-hover:scale-110 group-hover:rotate-6 text-[#a88a7e] group-hover:text-white'
                        }`}
                        style={{ color: isActive ? accentColor : undefined }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className={`font-mono text-xs sm:text-sm font-black uppercase tracking-tight transition-colors truncate ${
                            isActive ? 'text-white' : 'text-[#e5e2e1]/85 group-hover:text-white'
                          }`}
                        >
                          {mod.label}
                        </span>
                      </div>
                      <span className="block font-sans text-[9px] sm:text-[10px] text-[#e1bfb2]/65 truncate">
                        {mod.detail}
                      </span>
                    </div>
                  </div>

                  {/* Active Neon Baseline Accent Bar */}
                  {isActive && (
                    <motion.div
                      layoutId="refugioBaselineAccent"
                      className="absolute bottom-0 left-0 right-0 h-[2px] shadow-[0_0_10px_var(--color-profile-accent)]"
                      style={{ backgroundColor: accentColor }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div id="refugio-content" className="p-0 bg-transparent">
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
