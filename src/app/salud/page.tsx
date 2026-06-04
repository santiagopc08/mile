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
import { Allocation, StoreService } from "@/services/storeService";
import { MovementTracker } from "@/components/health/MovementTracker";

export default function SaludPage() {
    type SaludTab = 'vitals' | 'biometric' | 'fiscal' | 'habits' | 'movement';
    const [activeTab, setActiveTab] = useState<SaludTab>('vitals');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab') as SaludTab;
            if (tab && ['vitals', 'biometric', 'fiscal', 'habits', 'movement'].includes(tab)) {
                setActiveTab(tab);
            }
        }
    }, []);
    const { data } = useStore();
    const { profile } = useProfile();
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
    const secondaryColor = profile === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';
    const secondaryClass = profile === 'ella' ? 'user-b' : 'user-a';
    const [allocations, setAllocations] = useState<Allocation[]>([]);

    // Re-implementing allocation logic from SymmetryDashboard for FiscalAuditor
    const [allocationsA, setAllocationsA] = useState<Allocation[]>([]);
    const [allocationsB, setAllocationsB] = useState<Allocation[]>([]);

    useEffect(() => {
        const savedA = localStorage.getItem('symmetry_A_allocations') || localStorage.getItem('symmetry_A_expenses');
        const savedB = localStorage.getItem('symmetry_B_allocations') || localStorage.getItem('symmetry_B_expenses');
        if (savedA) setAllocationsA(JSON.parse(savedA));
        if (savedB) setAllocationsB(JSON.parse(savedB));
    }, []);



    const tabs: Array<{ id: SaludTab; label: string; icon: typeof Activity }> = [
        { id: 'vitals', label: 'Signos Vitales', icon: HeartPulse },
        { id: 'biometric', label: 'Bóveda Biométrica', icon: Shield },
        { id: 'habits', label: 'Hábitos', icon: Activity },
        { id: 'movement', label: 'Movimiento', icon: Flame },
    ];

    return (
        <PrivateRoute>
            <main className="relative z-10 min-h-screen w-full overflow-hidden bg-black px-4 pb-24 pt-6 text-[#e5e2e1] md:px-8 md:pt-8 font-mono">
                <div className="pointer-events-none fixed inset-0 -z-10 bg-mosaic opacity-60" />
                <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-64 opacity-20" style={{ backgroundImage: `linear-gradient(180deg, ${accentColor}, transparent)` }} />
                <div className="mx-auto w-full max-w-7xl border-x border-white/10">
                    <div className="border-y border-white/10 bg-[#0a0a0a]/95 rounded-none">
                        <div className="relative p-5 sm:p-8 md:p-10">
                            <div className={`absolute left-0 top-0 h-full w-[5px] bg-${accentClass}`} style={{ backgroundColor: accentColor }} />
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold uppercase leading-[0.92] tracking-tight text-white flex justify-between items-center">Salud
                                <div className="relative p-1 border border-white/10 bg-black rounded-none">
                                    <div className={`absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-${accentClass}`} style={{ borderColor: accentColor }} />
                                    <div className={`absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-${accentClass}`} style={{ borderColor: accentColor }} />
                                    <video
                                        className="w-20 h-20 object-cover contrast-125 opacity-80 mix-blend-screen rounded-none"
                                        src="vid/dogtor.mp4"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        webkit-playsinline="true"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <div className={`w-1 h-1 bg-${secondaryClass} animate-pulse`} style={{ backgroundColor: secondaryColor }} />
                                    </div>
                                </div>
                            </h1>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 border-b border-white/10 bg-black sm:grid-cols-4 rounded-none">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group relative font-mono flex min-h-20 items-center justify-between border-b border-white/10 px-4 py-4 transition-all last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 rounded-none ${activeTab === tab.id
                                    ? 'text-black'
                                    : 'bg-[#0a0a0a] text-[#a88a7e] hover:bg-[#121212] hover:text-white'
                                    }`}
                                style={activeTab === tab.id ? { backgroundColor: accentColor } : {}}
                            >
                                <span className="flex flex-col items-start gap-2">
                                    <tab.icon className="h-4 w-4 stroke-[1.5]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.22em]">{tab.label}</span>
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${activeTab === tab.id ? 'text-black/55' : `text-white/20 group-hover:text-${secondaryClass}`}`} style={activeTab !== tab.id ? { '--tw-hover-text-opacity': 1 } as any : {}}>
                                    0{tabs.findIndex(item => item.id === tab.id) + 1}
                                </span>
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTabSalud"
                                        className={`absolute inset-x-0 bottom-0 h-1 bg-${secondaryClass}`}
                                        style={{ backgroundColor: secondaryColor }}
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
