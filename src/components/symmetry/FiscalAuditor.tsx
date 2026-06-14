'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Plus, Trash2, Pizza, Coffee } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';

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

export const FiscalAuditor: React.FC<FiscalAuditorProps> = ({ allocations, onAddAllocation, onRemoveAllocation, profile: propProfile }) => {
    const { profile: contextProfile } = useProfile();
    const profile = propProfile || contextProfile || 'el';
    const accentColor = profile === 'ella' ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const accentClass = profile === 'ella' ? 'user-a' : 'user-b';
    const secondaryColor = profile === 'ella' ? 'var(--color-user-b)' : 'var(--color-user-a)';
    const secondaryClass = profile === 'ella' ? 'user-b' : 'user-a';
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

    const { rollingVices, junkCount, snackCount, viceSpending } = useMemo(() => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentVices = [];
        let junk = 0;
        let snack = 0;
        let spending = 0;

        // ⚡ Bolt Optimization: Replace multiple .filter() and .reduce() with a single pass O(N) loop
        for (const v of vices) {
            if (v.timestamp > sevenDaysAgo) {
                recentVices.push(v);
                spending += v.amount;
                if (v.type === 'junk_food') {
                    junk++;
                } else if (v.type === 'snack') {
                    snack++;
                }
            }
        }

        return {
            rollingVices: recentVices,
            junkCount: junk,
            snackCount: snack,
            viceSpending: spending
        };
    }, [vices]);

    const thresholdsExceeded = junkCount > 3 || snackCount > 5;

    const totalWeeklySpending = useMemo(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        let sum = 0;

        // ⚡ Bolt Optimization: Single pass O(N) loop instead of .filter().reduce()
        for (const a of allocations) {
            if (new Date(a.date) > sevenDaysAgo) {
                sum += a.amount;
            }
        }
        return sum;
    }, [allocations]);

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
        <div className={`geometric-card p-6 transition-all duration-500 ${thresholdsExceeded ? 'border-system-alert bg-fractured-mosaic bg-system-alert-soft' : 'border-white/10 bg-[#0a0a0a] bg-dot-matrix'}`}>
            <h2 className={`mb-6 flex items-center justify-between border-b pb-3 text-[10px] font-black uppercase tracking-[0.22em] font-mono ${thresholdsExceeded ? 'border-system-alert/20 text-system-alert' : 'border-white/10 text-[#a88a7e]'}`}>
                <span className="pr-2">Fiscal Health Guardian</span>
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
                        <p className="text-[10px] font-bold uppercase tracking-widest text-system-alert font-mono">Dietary Threshold Exceeded</p>
                        <p className="text-[9px] text-system-alert/80 mt-1 uppercase font-mono">You are spending {betrayalPercentage.toFixed(1)}% of your weekly budget on vices.</p>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] font-mono">
                        <span>Junk Food Tracker</span>
                        <span className={junkCount > 3 ? 'text-system-alert' : ''}>{junkCount} / 3</span>
                    </div>
                    <div className="flex h-1.5 w-full overflow-hidden border border-white/10 bg-black">
                        <motion.div
                            className={`h-full transition-all duration-500 ${junkCount > 3 ? 'bg-system-alert' : 'bg-user-a'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((junkCount / 3) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-[#a88a7e] font-mono">
                        <span>Snacks Tracker</span>
                        <span className={snackCount > 5 ? 'text-system-alert' : ''}>{snackCount} / 5</span>
                    </div>
                    <div className="flex h-1.5 w-full overflow-hidden border border-white/10 bg-black">
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
                        className={`flex-1 border bg-black px-4 py-2 text-xs uppercase tracking-widest text-white outline-none transition-colors placeholder:text-[#594137] font-mono ${thresholdsExceeded ? 'border-system-alert/30 focus:border-system-alert' : 'border-white/10 focus:border-profile-accent'}`}
                        style={!thresholdsExceeded ? { borderColor: accentColor } as any : {}}
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => addVice('junk_food')}
                        className={`flex items-center justify-center gap-2 border px-4 py-3 text-[9px] font-bold uppercase tracking-[0.2em] transition-all font-mono ${thresholdsExceeded ? 'border-system-alert bg-system-alert text-white' : `border-${accentClass} bg-${accentClass} text-black hover:opacity-80`}`}
                        style={!thresholdsExceeded ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
                    >
                        <Pizza size={14} /> Add Junk Food
                    </button>
                    <button
                        onClick={() => addVice('snack')}
                        className={`flex items-center justify-center gap-2 border px-4 py-3 text-[9px] font-bold uppercase tracking-[0.2em] transition-all font-mono ${thresholdsExceeded ? 'border-system-alert bg-system-alert text-white' : `border-${secondaryClass} bg-${secondaryClass} text-white hover:opacity-80`}`}
                        style={!thresholdsExceeded ? { backgroundColor: secondaryColor, borderColor: secondaryColor } : {}}
                    >
                        <Coffee size={14} /> Add Snack
                    </button>
                </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#a88a7e] font-mono">% of Betrayal</span>
                    <span className={`text-xl font-light tracking-normal font-mono ${thresholdsExceeded ? 'text-system-alert' : 'text-[#e5e2e1]'}`}>{betrayalPercentage.toFixed(1)}%</span>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    <AnimatePresence>
                        {rollingVices.map((vice) => (
                            <motion.div
                                key={vice.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center justify-between border border-white/10 bg-black/40 p-2"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 border ${vice.type === 'junk_food' ? 'border-user-a/20 text-user-a' : 'border-user-b/20 text-user-b'}`}>
                                        {vice.type === 'junk_food' ? <Pizza size={10} /> : <Coffee size={10} />}
                                    </div>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#e1bfb2] font-mono">
                                        {vice.type === 'junk_food' ? 'Junk Food' : 'Snack'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-[9px] text-[#a88a7e]">
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
