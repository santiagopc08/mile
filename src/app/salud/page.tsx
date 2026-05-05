'use client';

import { useState, useEffect } from 'react';
import { PrivateRoute } from "@/components/PrivateRoute";
import { BiometricVault } from "@/components/symmetry/BiometricVault";
import { FiscalAuditor } from "@/components/symmetry/FiscalAuditor";
import { BloodPressureTracker } from "@/components/health/BloodPressureTracker";
import { useStore } from "@/context/StoreContext";
import { useProfile } from "@/context/ProfileContext";
import { Activity, HeartPulse, Utensils, Shield, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Allocation, StoreService } from "@/services/storeService";

export default function SaludPage() {
    type SaludTab = 'vitals' | 'biometric' | 'fiscal';
    const [activeTab, setActiveTab] = useState<SaludTab>('vitals');
    const { data } = useStore();
    const { profile } = useProfile();
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

    const handleAddAllocation = (newAlloc: any) => {
        if (profile === 'el') {
            const next = [newAlloc, ...allocationsA];
            setAllocationsA(next);
            localStorage.setItem('symmetry_A_allocations', JSON.stringify(next));
        } else {
            const next = [newAlloc, ...allocationsB];
            setAllocationsB(next);
            localStorage.setItem('symmetry_B_allocations', JSON.stringify(next));
        }
    };

    const handleRemoveAllocation = (id: string) => {
        if (profile === 'el') {
            const next = allocationsA.filter(a => a.id !== id);
            setAllocationsA(next);
            localStorage.setItem('symmetry_A_allocations', JSON.stringify(next));
        } else {
            const next = allocationsB.filter(a => a.id !== id);
            setAllocationsB(next);
            localStorage.setItem('symmetry_B_allocations', JSON.stringify(next));
        }
    };

    const tabs: Array<{ id: SaludTab; label: string; icon: typeof Activity }> = [
        { id: 'vitals', label: 'Signos Vitales', icon: HeartPulse },
        { id: 'biometric', label: 'Bóveda Biométrica', icon: Shield },
        { id: 'fiscal', label: 'Salud Fiscal', icon: Utensils },
    ];

    return (
        <PrivateRoute>
            <main className="relative z-10 min-h-screen w-full overflow-hidden bg-black px-4 pb-24 pt-6 text-[#e5e2e1] md:px-8 md:pt-8">
                <div className="pointer-events-none fixed inset-0 -z-10 bg-mosaic opacity-60" />
                <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-64 bg-[linear-gradient(180deg,rgba(0,219,233,0.12),transparent)]" />
                <div className="mx-auto w-full max-w-7xl border-x border-white/10">
                    <div className="grid border-y border-white/10 bg-[#0a0a0a]/95 md:grid-cols-[1fr_auto]">
                        <div className="relative p-5 sm:p-8 md:p-10">
                            <div className="absolute left-0 top-0 h-full w-px bg-[#00dbe9]" />
                            <div className="mb-8 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-[#a88a7e]">
                                <span className="border border-[#00dbe9]/50 px-2 py-1 text-[#7df4ff]">HEALTH // VITAL_CORE</span>
                                <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 bg-[#ff7020]" />
                                    MONITOR_ONLINE
                                </span>
                            </div>
                            <h1 className="text-5xl font-black uppercase leading-[0.92] tracking-normal text-white sm:text-7xl lg:text-8xl">Salud</h1>
                            <div className="mt-6 grid max-w-4xl gap-5 border-t border-white/10 pt-5 md:grid-cols-[1fr_auto] md:items-end">
                                <p className="max-w-2xl text-sm leading-6 tracking-normal text-[#e1bfb2] md:text-base">
                                    Monitoreo de parámetros vitales, privacidad biométrica y hábitos fiscales asociados al bienestar.
                                </p>
                                <div className="grid grid-cols-2 border border-white/10 text-center">
                                    <div className="border-r border-white/10 px-4 py-3">
                                        <div className="text-2xl font-black text-[#00dbe9]">{tabs.length}</div>
                                        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Módulos</div>
                                    </div>
                                    <div className="px-4 py-3">
                                        <div className="text-2xl font-black text-[#ffb595]">{profile === 'ella' ? 'S' : 'A'}</div>
                                        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e]">Modo</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <aside className="hidden min-w-56 border-l border-white/10 bg-black/60 p-5 md:flex md:flex-col md:justify-between">
                            <div className="space-y-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#a88a7e]">
                                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                    <span>Telemetry</span>
                                    <Activity className="h-4 w-4 text-[#00dbe9]" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Channel</span>
                                    <span className="text-[#e5b5ff]">{activeTab}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Signal</span>
                                    <span className="text-[#ffb595]">ACTIVE</span>
                                </div>
                            </div>
                            <Radio className="h-16 w-16 text-[#00dbe9]" strokeWidth={1} />
                        </aside>
                    </div>

                    {/* Section Video Header */}
                    <div className="flex justify-center mb-8">
                        <div className="relative p-1 border border-white/10 bg-black">
                            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#00dbe9]" />
                            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#00dbe9]" />
                            <video
                                className="w-48 h-32 object-cover contrast-125 opacity-80 mix-blend-screen"
                                src="vid/dogtor.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                webkit-playsinline="true"
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                                <div className="w-1 h-1 bg-[#ff7020] animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 border-b border-white/10 bg-black sm:grid-cols-3">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group relative flex min-h-20 items-center justify-between border-b border-white/10 px-4 py-4 transition-all last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 ${activeTab === tab.id
                                        ? 'bg-[#00dbe9] text-black'
                                        : 'bg-[#0a0a0a] text-[#a88a7e] hover:bg-[#121212] hover:text-white'
                                    }`}
                            >
                                <span className="flex flex-col items-start gap-2">
                                    <tab.icon className="h-4 w-4" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.22em]">{tab.label}</span>
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${activeTab === tab.id ? 'text-black/55' : 'text-white/20 group-hover:text-[#ff7020]'}`}>
                                    0{tabs.findIndex(item => item.id === tab.id) + 1}
                                </span>
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTabSalud"
                                        className="absolute inset-x-0 bottom-0 h-1 bg-[#ff7020]"
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
                                {activeTab === 'fiscal' && (
                                    <FiscalAuditor
                                        allocations={profile === 'el' ? allocationsA : allocationsB}
                                        onAddAllocation={handleAddAllocation}
                                        onRemoveAllocation={handleRemoveAllocation}
                                        profile={profile || 'el'}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </PrivateRoute>
    );
}
