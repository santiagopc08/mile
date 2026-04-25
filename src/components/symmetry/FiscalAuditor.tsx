'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Plus, Trash2, Pizza, Coffee } from 'lucide-react';

interface ViceEntry {
    id: string;
    type: 'junk_food' | 'snack';
    amount: number;
    timestamp: number;
    allocationId: string;
}

interface Allocation {
    id: string;
    amount: number;
    description: string;
    category: string;
    date: string;
}

interface FiscalAuditorProps {
    allocations: Allocation[];
    onAddAllocation: (allocation: Allocation) => void;
    onRemoveAllocation: (id: string) => void;
    profile: 'el' | 'ella';
}

export const FiscalAuditor: React.FC<FiscalAuditorProps> = ({ allocations, onAddAllocation, onRemoveAllocation, profile }) => {
    const [vices, setVices] = useState<ViceEntry[]>([]);
    const [price, setPrice] = useState<string>('');

    const storageKey = `fiscal_vices_${profile}`;

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) setVices(JSON.parse(saved));
    }, [storageKey]);

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(vices));
    }, [vices, storageKey]);

    const rollingVices = useMemo(() => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return vices.filter(v => v.timestamp > sevenDaysAgo);
    }, [vices]);

    const junkCount = rollingVices.filter(v => v.type === 'junk_food').length;
    const snackCount = rollingVices.filter(v => v.type === 'snack').length;

    const thresholdsExceeded = junkCount > 3 || snackCount > 5;

    const totalWeeklySpending = useMemo(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return allocations
            .filter(a => new Date(a.date) > sevenDaysAgo)
            .reduce((sum, a) => sum + a.amount, 0);
    }, [allocations]);

    const viceSpending = rollingVices.reduce((sum, v) => sum + v.amount, 0);
    const betrayalPercentage = totalWeeklySpending > 0 ? (viceSpending / totalWeeklySpending) * 100 : 0;

    const addVice = (type: 'junk_food' | 'snack') => {
        const amount = parseFloat(price) || 0;
        if (amount <= 0) return;

        const allocationId = Date.now().toString();
        const description = type === 'junk_food' ? 'Comida Chatarra (Vicio)' : 'Mecato (Vicio)';

        const newAllocation: Allocation = {
            id: allocationId,
            amount: amount,
            description: description,
            category: '🍔 Alimentación',
            date: new Date().toISOString()
        };

        const newVice: ViceEntry = {
            id: Date.now().toString(),
            type,
            amount,
            timestamp: Date.now(),
            allocationId
        };

        onAddAllocation(newAllocation);
        setVices([newVice, ...vices]);
        setPrice('');
    };

    const removeVice = (viceId: string) => {
        const vice = vices.find(v => v.id === viceId);
        if (vice) {
            onRemoveAllocation(vice.allocationId);
            setVices(vices.filter(v => v.id !== viceId));
        }
    };

    return (
        <div className={`geometric-card p-6 transition-all duration-500 ${thresholdsExceeded ? 'bg-fractured-mosaic border-system-alert bg-system-alert-soft' : 'bg-dot-matrix'}`}>
            <h2 className={`text-[10px] uppercase font-bold tracking-[0.2em] mb-6 border-b pb-3 flex justify-between items-center ${thresholdsExceeded ? 'text-system-alert border-system-alert/20' : 'text-stone-500 border-stone-100 dark:border-stone-900'}`}>
                <span className="pr-2">Fiscal Health Guardian</span>
                <div className="flex items-center justify-center px-2">
                    <video
                        className='w-20 h-20 object-cover rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xl'
                        src="vid/fatfit.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        webkit-playsinline="true"
                    />
                </div>
                <span className="text-[8px] font-mono opacity-50 pl-2">Auditor v1.0</span>
            </h2>

            {thresholdsExceeded && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 border border-system-alert bg-system-alert-soft flex items-start gap-3"
                >
                    <AlertCircle className="w-5 h-5 text-system-alert shrink-0" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-system-alert">Dietary Threshold Exceeded</p>
                        <p className="text-[9px] text-system-alert/80 mt-1 uppercase">You are spending {betrayalPercentage.toFixed(1)}% of your weekly budget on vices.</p>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                    <div className="flex justify-between text-[9px] uppercase font-bold tracking-[0.2em] text-stone-500">
                        <span>Junk Food Tracker</span>
                        <span className={junkCount > 3 ? 'text-system-alert' : ''}>{junkCount} / 3</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex overflow-hidden">
                        <motion.div
                            className={`h-full transition-all duration-500 ${junkCount > 3 ? 'bg-system-alert' : 'bg-user-a'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((junkCount / 3) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between text-[9px] uppercase font-bold tracking-[0.2em] text-stone-500">
                        <span>Snacks Tracker</span>
                        <span className={snackCount > 5 ? 'text-system-alert' : ''}>{snackCount} / 5</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex overflow-hidden">
                        <motion.div
                            className={`h-full transition-all duration-500 ${snackCount > 5 ? 'bg-system-alert' : 'bg-user-b'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((snackCount / 5) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="PRECIO (COP)"
                        className={`flex-1 bg-transparent border px-4 py-2 text-xs uppercase tracking-widest outline-none transition-colors ${thresholdsExceeded ? 'border-system-alert/30 focus:border-system-alert' : 'border-stone-200 dark:border-stone-800 focus:border-stone-400'}`}
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => addVice('junk_food')}
                        className={`py-3 px-4 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] transition-all border ${thresholdsExceeded ? 'bg-system-alert text-white border-system-alert' : 'bg-stone-800 dark:bg-stone-200 text-white dark:text-black border-stone-800'}`}
                    >
                        <Pizza size={14} /> Add Junk Food
                    </button>
                    <button
                        onClick={() => addVice('snack')}
                        className={`py-3 px-4 flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] transition-all border ${thresholdsExceeded ? 'bg-system-alert text-white border-system-alert' : 'bg-stone-800 dark:bg-stone-200 text-white dark:text-black border-stone-800'}`}
                    >
                        <Coffee size={14} /> Add Snack
                    </button>
                </div>
            </div>

            <div className="mt-8 border-t border-stone-100 dark:border-stone-900 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[9px] uppercase font-black tracking-[0.3em] text-stone-400">% of Betrayal</span>
                    <span className={`text-xl font-light tracking-tighter ${thresholdsExceeded ? 'text-system-alert' : 'text-stone-600'}`}>{betrayalPercentage.toFixed(1)}%</span>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    <AnimatePresence>
                        {rollingVices.map((vice) => (
                            <motion.div
                                key={vice.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center justify-between p-2 border border-stone-100 dark:border-stone-900 bg-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 border ${vice.type === 'junk_food' ? 'border-user-a/20 text-user-a' : 'border-user-b/20 text-user-b'}`}>
                                        {vice.type === 'junk_food' ? <Pizza size={10} /> : <Coffee size={10} />}
                                    </div>
                                    <span className="text-[9px] uppercase font-bold tracking-widest text-stone-600">
                                        {vice.type === 'junk_food' ? 'Junk Food' : 'Snack'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[9px] font-mono text-stone-400">
                                        COP {vice.amount.toLocaleString()}
                                    </span>
                                    <button
                                        onClick={() => removeVice(vice.id)}
                                        className="text-stone-300 hover:text-system-alert transition-colors"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
