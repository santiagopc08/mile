'use client';

import { useState, useEffect } from 'react';
import { SquareArrowUp, X, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '@/context/ProfileContext';
import { BrutalistPanel } from '@/components/ui/BrutalistPanel';

export function IOSInstallPrompt() {
  const { profile } = useProfile();
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);

  const accentColor = profile === 'ella' ? '#ff4b89' : '#c3f400';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Detect if running as standalone app
    const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
    const isApp = Boolean(('standalone' in navigatorWithStandalone) && navigatorWithStandalone.standalone);
    setIsStandalone(isApp);

    // If it's iOS Safari and not standalone, show prompt after a delay
    if (isIOSDevice && !isApp) {
      const dismissed = localStorage.getItem('ios-pwa-prompt-dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 md:bottom-4 left-1/2 -translate-x-1/2 w-full md:w-[400px] z-[9999] p-4 font-mono"
      >
        <BrutalistPanel
          accentColor={accentColor}
          cornerSize={12}
          cornerThickness={1.5}
          className="!bg-[#0a0a0a]/95 backdrop-blur-md rounded-none p-5 w-full flex flex-col gap-4 shadow-[0_15px_40px_rgba(0,0,0,0.7)]"
        >
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5" style={{ color: accentColor }} />
              INSTALAR LA APLICACIÓN (PWA)
            </h4>
            <button 
              onClick={dismissPrompt}
              className="text-stone-400 hover:text-white border border-white/10 p-1 bg-black/40 hover:bg-white/5 transition-all rounded-none"
              title="Cerrar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="text-[10px] leading-relaxed uppercase text-[#a88a7e]">
            Para ejecutar nuestro espacio seguro en modo de pantalla completa y habilitar notificaciones nativas:
            <ol className="list-decimal pl-4 mt-3 space-y-2 text-[#e5e2e1] bg-black/40 border border-white/5 p-3 font-mono">
              <li>
                Presiona el icono de <SquareArrowUp className="w-3.5 h-3.5 inline mx-1" style={{ color: accentColor }} /> Compartir en la barra de navegación de Safari.
              </li>
              <li>
                Desplázate hacia abajo y selecciona <span className="font-bold text-white" style={{ textShadow: `0 0 8px ${accentColor}33` }}>"Añadir a pantalla de inicio"</span>.
              </li>
              <li>
                Abre el icono del sistema desde la pantalla principal de tu dispositivo.
              </li>
            </ol>
          </div>
        </BrutalistPanel>
      </motion.div>
    </AnimatePresence>
  );
}
