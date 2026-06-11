'use client';

import { useState, useEffect } from 'react';
import { Settings, Volume2, VolumeX, Smartphone, Wifi, Cpu, ShieldAlert, HelpCircle } from 'lucide-react';
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useProfile } from '@/context/ProfileContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedBrutalistCorners } from './ui/AnimatedBrutalistCorners';

export function SystemSettings({ align = 'right' }: { align?: 'left' | 'right' }) {
  const { profile } = useProfile();
  const isOnline = useOnlineStatus();
  const [isOpen, setIsOpen] = useState(false);
  
  // Local state for toggles to trigger re-renders
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
  const accentHex = profile === 'ella' ? '#ff4b89' : '#c3f400';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setSoundEnabled(sound.isEnabled());
    setHapticEnabled(haptics.isEnabled());
    
    const isPushSupported = 'PushManager' in window && 'serviceWorker' in navigator;
    setPushSupported(isPushSupported);

    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
    const isApp = Boolean(('standalone' in navigatorWithStandalone) && navigatorWithStandalone.standalone);
    setIsStandalone(isApp);
  }, [isOpen]);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    sound.setEnabled(nextVal);
    setSoundEnabled(nextVal);
    if (nextVal) {
      sound.playTick();
    }
  };

  const toggleHaptic = () => {
    const nextVal = !hapticEnabled;
    haptics.setEnabled(nextVal);
    setHapticEnabled(nextVal);
    if (nextVal) {
      haptics.triggerTick();
    }
  };

  const requestPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPushPermission(result);
      if (result === 'granted') {
        sound.playSuccess();
        haptics.triggerSuccess();
        // Force reload so service worker registers push immediately
        window.location.reload();
      } else {
        sound.playError();
        haptics.triggerError();
      }
    } catch (err) {
      console.warn('Failed to request notification permission:', err);
    }
  };

  if (!profile) return null;

  return (
    <div className="relative">
      {/* Console Toggle Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            sound.playTick();
            haptics.triggerTick();
          }
        }}
        className="group relative flex h-9 w-9 items-center justify-center border border-white/10 bg-[#0a0a0a]/90 text-[#a88a7e] transition-all hover:border-white/20 hover:text-white"
        title="Consola de Configuración"
      >
        <Settings 
          className="h-4 w-4 transition-transform duration-500 group-hover:rotate-90"
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dropdown Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={`absolute mt-3 w-80 border border-white/10 bg-[#0a0a0a]/98 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden font-mono ${
                align === 'left' ? 'left-0 lg:left-full lg:top-0 lg:mt-0 lg:ml-4' : 'right-0'
              }`}
            >
              <AnimatedBrutalistCorners color={accentHex} size={12} thickness={1.5} />

              {/* Title Header */}
              <div className="flex items-center justify-between border-b border-white/10 bg-black/40 p-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5" style={{ color: accentHex }} />
                  CONSOLA DEL SISTEMA
                </span>
                <span className="text-[7px] text-[#a88a7e] opacity-60">V1.2.0</span>
              </div>

              {/* Section 1: Interaction controls */}
              <div className="p-4 space-y-3 border-b border-white/10">
                <span className="text-[7.5px] text-[#a88a7e] font-black tracking-widest uppercase block mb-1">INTERACCIÓN</span>
                
                {/* Sound Toggle */}
                <div className="flex items-center justify-between border border-white/5 bg-black/20 px-3 py-2">
                  <div className="flex items-center gap-2">
                    {soundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5" style={{ color: accentHex }} />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-stone-500" />
                    )}
                    <span className="text-[10px] font-bold text-white uppercase">Efectos Sonoros</span>
                  </div>
                  <button
                    onClick={toggleSound}
                    className="border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider transition-all"
                    style={{
                      borderColor: soundEnabled ? accentHex : 'rgba(255,255,255,0.1)',
                      color: soundEnabled ? accentHex : '#a88a7e',
                      backgroundColor: soundEnabled ? `${accentHex}11` : 'transparent'
                    }}
                  >
                    {soundEnabled ? 'ACTIVO' : 'INACTIVO'}
                  </button>
                </div>

                {/* Haptics Toggle */}
                <div className="flex items-center justify-between border border-white/5 bg-black/20 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5" style={{ color: hapticEnabled ? accentHex : undefined }} />
                    <span className="text-[10px] font-bold text-white uppercase">Vibración Háptica</span>
                  </div>
                  <button
                    onClick={toggleHaptic}
                    className="border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider transition-all"
                    style={{
                      borderColor: hapticEnabled ? accentHex : 'rgba(255,255,255,0.1)',
                      color: hapticEnabled ? accentHex : '#a88a7e',
                      backgroundColor: hapticEnabled ? `${accentHex}11` : 'transparent'
                    }}
                  >
                    {hapticEnabled ? 'ACTIVO' : 'INACTIVO'}
                  </button>
                </div>
              </div>

              {/* Section 2: Diagnostics */}
              <div className="p-4 space-y-2.5">
                <span className="text-[7.5px] text-[#a88a7e] font-black tracking-widest uppercase block mb-1">DIAGNÓSTICO PWA</span>

                {/* Connection Status */}
                <div className="flex items-center justify-between text-[9px] font-mono leading-none py-1">
                  <span className="text-stone-400">CONECTIVIDAD:</span>
                  <div className="flex items-center gap-1.5">
                    <span 
                      className={`inline-block h-1.5 w-1.5 rounded-none ${isOnline ? 'animate-pulse' : ''}`}
                      style={{ backgroundColor: isOnline ? accentHex : '#ef4444' }}
                    />
                    <span className="font-bold uppercase" style={{ color: isOnline ? '#ffffff' : '#ef4444' }}>
                      {isOnline ? 'ONLINE (SYS-OK)' : 'OFFLINE (SYS-DEG)'}
                    </span>
                  </div>
                </div>

                {/* Push Capability */}
                <div className="flex items-center justify-between text-[9px] font-mono leading-none py-1">
                  <span className="text-stone-400">NOTIFICACIONES:</span>
                  <span className={`font-bold ${pushSupported ? 'text-white' : 'text-red-400'}`}>
                    {pushSupported ? 'SOPORTADO' : 'NO SOPORTADO'}
                  </span>
                </div>

                {/* Push Permission Status */}
                <div className="flex items-center justify-between text-[9px] font-mono leading-none py-1 border-b border-white/5 pb-2">
                  <span className="text-stone-400">PERMISO ALERTAS:</span>
                  <span className="font-bold uppercase" style={{
                    color: pushPermission === 'granted' ? accentHex : pushPermission === 'denied' ? '#ef4444' : '#e5e2e1'
                  }}>
                    {pushPermission === 'granted' ? 'PERMITIDO' : pushPermission === 'denied' ? 'BLOQUEADO' : 'PENDIENTE'}
                  </span>
                </div>

                {/* Standalone state */}
                <div className="flex items-center justify-between text-[9px] font-mono leading-none py-1">
                  <span className="text-stone-400">ENTORNO APP:</span>
                  <span className="font-bold text-white uppercase">
                    {isStandalone ? 'INSTALADA (PWA)' : 'NAVEGADOR'}
                  </span>
                </div>

                {/* Actions / Guides based on Diagnostic */}
                <div className="mt-3 pt-2">
                  {pushPermission === 'default' && pushSupported && (
                    <button
                      onClick={requestPushPermission}
                      className="w-full flex items-center justify-center gap-1.5 border border-dashed py-2 text-[9px] font-bold uppercase tracking-wider text-white transition-colors"
                      style={{ borderColor: accentHex, backgroundColor: `${accentHex}08` }}
                    >
                      <Wifi className="w-3 h-3 animate-pulse" style={{ color: accentHex }} />
                      Activar Alertas Push
                    </button>
                  )}

                  {pushPermission === 'denied' && (
                    <div className="border border-red-500/20 bg-red-950/10 p-2 text-[8px] leading-relaxed uppercase text-red-400 flex gap-1.5 items-start">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Alertas bloqueadas. Restablece los permisos en los ajustes de tu navegador para recibir notificaciones.</span>
                    </div>
                  )}

                  {isIOS && !isStandalone && (
                    <div className="border border-white/10 bg-white/[0.02] p-3 text-[8px] uppercase tracking-normal leading-4 text-[#a88a7e] space-y-1.5">
                      <div className="flex items-center gap-1 font-bold text-white">
                        <HelpCircle className="w-3 h-3" style={{ color: accentHex }} />
                        <span>GUÍA DE INSTALACIÓN IOS</span>
                      </div>
                      <ol className="list-decimal pl-4 space-y-1 font-mono text-[#e5e2e1]">
                        <li>Presiona el botón "Compartir" de Safari.</li>
                        <li>Selecciona "Añadir a pantalla de inicio".</li>
                        <li>Abre la app instalada en tu iPhone.</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
