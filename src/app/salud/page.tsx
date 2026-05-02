'use client';

import { useState, useEffect } from 'react';
import { PrivateRoute } from "@/components/PrivateRoute";
import { BiometricVault } from "@/components/symmetry/BiometricVault";
import { FiscalAuditor } from "@/components/symmetry/FiscalAuditor";
import { BloodPressureTracker } from "@/components/health/BloodPressureTracker";
import { useStore } from "@/context/StoreContext";
import { useProfile } from "@/context/ProfileContext";
import { Activity, Heart, Utensils, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Allocation, StoreService } from "@/services/storeService";

export default function SaludPage() {
    const [activeTab, setActiveTab] = useState<'vitals' | 'biometric' | 'fiscal'>('vitals');
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

    const tabs = [
        { id: 'vitals', label: 'Signos Vitales', icon: Activity },
        { id: 'biometric', label: 'Bóveda Biométrica', icon: Shield },
        { id: 'fiscal', label: 'Salud Fiscal', icon: Utensils },
    ];

    return (
        <PrivateRoute>
            <main className="w-full flex flex-col items-center justify-start pt-12 px-4 md:px-12 pb-24 relative z-10">
                <div className="w-full max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col items-center justify-center text-center border-b border-stone-200 dark:border-stone-800 pb-8">
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase italic leading-none">Salud</h1>
                        <p className="text-stone-500 text-[10px] uppercase font-bold tracking-[0.4em] mt-4">
                            Monitoreo de Parámetros Vitales y Bienestar
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex justify-center gap-2 md:gap-4 border-b border-stone-100 dark:border-stone-900 pb-4 flex-wrap">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`relative px-4 sm:px-6 py-3 flex items-center gap-2 transition-all ${
                                    activeTab === tab.id
                                        ? 'text-geometric-accent'
                                        : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="text-[10px] uppercase font-black tracking-widest hidden sm:inline">{tab.label}</span>
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTabSalud"
                                        className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-geometric-accent"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="mt-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
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
