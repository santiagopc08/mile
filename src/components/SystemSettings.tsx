'use client';

import { useState, useEffect } from 'react';
import { Settings, Cpu } from 'lucide-react';
import { InteractionSettings } from './settings/InteractionSettings';
import { DiagnosticSettings } from './settings/DiagnosticSettings';
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

              <InteractionSettings
                soundEnabled={soundEnabled}
                hapticEnabled={hapticEnabled}
                toggleSound={toggleSound}
                toggleHaptic={toggleHaptic}
                accentHex={accentHex}
              />

              <DiagnosticSettings
                isOnline={isOnline}
                pushSupported={pushSupported}
                pushPermission={pushPermission}
                isStandalone={isStandalone}
                isIOS={isIOS}
                requestPushPermission={requestPushPermission}
                accentHex={accentHex}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
