'use client';

import { useState, useEffect } from 'react';
import { PrivateRoute } from "@/components/PrivateRoute";
import { BiometricVault } from "@/components/symmetry/BiometricVault";
import { BloodPressureTracker } from "@/components/health/BloodPressureTracker";
import { HabitTracker } from "@/components/health/HabitTracker";
import { useStore } from "@/context/StoreContext";
import { useProfile } from "@/context/ProfileContext";
import { Activity, HeartPulse, Shield, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Allocation } from "@/services/storeService";
import { MovementTracker } from "@/components/health/MovementTracker";
import { AmbientField } from "@/components/AmbientField";
import { sound } from '@/lib/sound';
import { haptics } from '@/lib/haptics';

export default function SaludPage() {
    type SaludTab = 'vitals' | 'biometric' | 'habits' | 'movement';
    const [activeTab, setActiveTab] = useState<SaludTab>('vitals');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URL(window.location.href).searchParams;
            const tab = params.get('tab') as SaludTab;
            if (tab && ['vitals', 'biometric', 'habits', 'movement'].includes(tab)) {
                setActiveTab(tab);
                setTimeout(() => {
                    const el = document.getElementById('salud-content');
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            }
        }
    }, []);

    const { profile } = useProfile();
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const accentHex = profile === 'ella' ? '#ff4b89' : '#c3f400';
    const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
    const secondaryColor = profile === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';
    const secondaryClass = profile === 'ella' ? 'user-b' : 'user-a';

    const tabs: Array<{
        id: SaludTab;
        label: string;
        shortLabel: string;
        detail: string;
        icon: typeof Activity;
    }> = [
        { id: 'vitals', label: 'Signos Vitales', shortLabel: 'Vitales', detail: 'Presión & Pulso', icon: HeartPulse },
        { id: 'biometric', label: 'Ella', shortLabel: 'Ella', detail: 'Bóveda Biológica', icon: Shield },
        { id: 'habits', label: 'Hábitos', shortLabel: 'Hábitos', detail: 'Rutinas & Racha', icon: Activity },
        { id: 'movement', label: 'Movimiento', shortLabel: 'Movimiento', detail: 'Pasos & Quema', icon: Flame },
    ];

    const handleTabChange = (tabId: SaludTab) => {
        if (tabId !== activeTab) {
            sound.playTick();
            haptics.triggerTick();
            setActiveTab(tabId);
        }
    };

    return (
        <PrivateRoute>
            <AmbientField preset="salud" profile={profile} />
            <main className="relative z-10 min-h-screen w-full overflow-hidden px-3 sm:px-4 pb-24 pt-4 sm:pt-6 text-[#e5e2e1] md:px-8 md:pt-8 font-mono">
                <div className="mx-auto w-full max-w-7xl">
                    {/* Header Banner */}
                    <div className="border border-white/12 bg-white/[0.04] backdrop-blur-2xl backdrop-saturate-150 shadow-[0_12px_36px_rgba(0,0,0,0.5)] mb-4">
                        <div className="relative p-4 sm:p-6 md:p-8">
                            <div className="absolute left-0 top-0 h-full w-[4px]" style={{ backgroundColor: accentColor }} />
                            <div className="flex items-center justify-between gap-3 w-full">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-base sm:text-xl animate-spin-slow" style={{ color: accentColor }}>◆</span>
                                    <div>
                                        <p className="text-[7.5px] sm:text-[8.5px] font-mono font-bold uppercase tracking-[0.24em] text-stone-400">
                                            MÓDULO CLÍNICO // BIOMETRÍA
                                        </p>
                                        <h1 className="text-xl sm:text-3xl md:text-4xl font-mono font-bold uppercase leading-tight tracking-tight text-white mt-0.5">
                                            SALUD · SIGNOS VITALES
                                        </h1>
                                    </div>
                                </div>
                                <div className="relative p-1 border border-white/15 bg-white/[0.05] backdrop-blur-md shrink-0">
                                    <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l" style={{ borderColor: accentColor }} />
                                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r" style={{ borderColor: accentColor }} />
                                    <video
                                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover contrast-125 opacity-80 mix-blend-screen"
                                        src="vid/dogtor.mp4"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        webkit-playsinline="true"
                                    />
                                    <div className="absolute top-1.5 right-1.5 flex gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: secondaryColor }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Redesigned Cyber-HUD Segmented Tab Selector */}
                    <div className="border border-white/12 bg-black/60 backdrop-blur-2xl backdrop-saturate-150 p-1 sm:p-1.5 mb-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-1.5">
                            {tabs.map((tab, index) => {
                                const isActive = activeTab === tab.id;
                                const TabIcon = tab.icon;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => handleTabChange(tab.id)}
                                        className={`group relative min-h-[50px] sm:min-h-[58px] px-3 py-2 flex items-center justify-between transition-all duration-200 border text-left overflow-hidden ${
                                            isActive
                                                ? 'border-white/30 text-white shadow-[0_0_16px_rgba(0,0,0,0.6)]'
                                                : 'border-white/5 bg-white/[0.015] text-stone-400 hover:border-white/20 hover:text-stone-200 hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        {/* Animated Glider Background on Active Tab */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeSaludTabGlider"
                                                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                                                className="absolute inset-0 bg-white/[0.08] backdrop-blur-md"
                                                style={{
                                                    boxShadow: `inset 0 0 16px ${accentHex}20`,
                                                }}
                                            />
                                        )}

                                        {/* Active Top & Bottom Neon Accent Bars */}
                                        {isActive && (
                                            <>
                                                <motion.div
                                                    layoutId="activeSaludTabTopBar"
                                                    className="absolute top-0 inset-x-0 h-[2px]"
                                                    style={{
                                                        backgroundColor: accentColor,
                                                        boxShadow: `0 0 8px ${accentColor}`,
                                                    }}
                                                />
                                                <motion.div
                                                    layoutId="activeSaludTabBottomBar"
                                                    className="absolute bottom-0 inset-x-0 h-[2px]"
                                                    style={{
                                                        backgroundColor: accentColor,
                                                        boxShadow: `0 0 8px ${accentColor}`,
                                                    }}
                                                />
                                            </>
                                        )}

                                        {/* Tab Content */}
                                        <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                                            <div
                                                className={`p-1.5 border transition-colors shrink-0 ${
                                                    isActive
                                                        ? 'border-white/30 bg-black/60'
                                                        : 'border-white/10 bg-black/30 group-hover:border-white/20'
                                                }`}
                                            >
                                                <TabIcon
                                                    size={15}
                                                    className="transition-colors stroke-[1.75]"
                                                    style={isActive ? { color: accentColor } : {}}
                                                />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span
                                                    className={`text-[9.5px] sm:text-[10px] font-mono font-black uppercase tracking-wider truncate leading-tight ${
                                                        isActive ? 'text-white' : 'text-stone-300 group-hover:text-white'
                                                    }`}
                                                >
                                                    {tab.label}
                                                </span>
                                                <span className="text-[7px] sm:text-[7.5px] font-mono text-stone-500 truncate hidden xs:inline tracking-tight mt-0.5">
                                                    {tab.detail}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Index Badge */}
                                        <div className="relative z-10 hidden sm:flex flex-col items-end shrink-0 pl-1">
                                            <span
                                                className={`text-[8px] font-mono font-bold tabular-nums transition-colors ${
                                                    isActive ? 'font-black' : 'text-stone-600 group-hover:text-stone-400'
                                                }`}
                                                style={isActive ? { color: accentColor } : {}}
                                            >
                                                0{index + 1}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active Tab Main Content */}
                    <div id="salud-content" className="bg-[#0a070c]/50 border border-white/10 backdrop-blur-2xl backdrop-saturate-150 p-3 sm:p-5 md:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18 }}
                                className="min-h-[480px]"
                            >
                                {activeTab === 'vitals' && <BloodPressureTracker />}
                                {activeTab === 'biometric' && <BiometricVault />}
                                {activeTab === 'habits' && <HabitTracker />}
                                {activeTab === 'movement' && <MovementTracker />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </PrivateRoute>
    );
}
