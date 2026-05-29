'use client';

import { useState, useEffect } from 'react';
import { Share, SquareArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function IOSInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Detect if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Detect if running as standalone app
    const isApp = Boolean(('standalone' in window.navigator) && (window.navigator as Navigator & { standalone?: boolean }).standalone);
    setIsStandalone(isApp);

    // If it's iOS Safari and not standalone, show prompt after delay
    if (isIOSDevice && !isApp) {
      // Check if user dismissed it previously
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
        className="fixed bottom-0 md:bottom-4 left-1/2 -translate-x-1/2 w-full md:w-[400px] z-[9999] p-4"
      >
        <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-5 w-full flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-stone-800 dark:text-stone-100 mb-1">Instalar la App</h4>
            <button 
              onClick={dismissPrompt}
              className="text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Para instalar esta aplicación completa en tu dispositivo:
            <ol className="list-decimal pl-5 mt-2 space-y-2 font-medium bg-stone-50 dark:bg-stone-800/50 p-3 rounded-lg">
              <li className="flex items-center gap-2">
                Presiona el icono de <SquareArrowUp className="w-5 h-5 text-geometric-accent inline" /> Compartir en el menú
              </li>
              <li>Selecciona <span className="text-stone-800 dark:text-stone-300 font-bold">"Agregar a inicio"</span></li>
            </ol>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
